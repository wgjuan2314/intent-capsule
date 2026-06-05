import type { Adapter } from './types';

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/** 只保留最外层节点（去掉被其他节点包含的子节点） */
function outermost(els: Element[]): Element[] {
  return els.filter(el => !els.some(other => other !== el && other.contains(el)));
}

/** 移除按钮/图标后提取纯文本 */
function cleanText(node: Element): string {
  const clone = node.cloneNode(true) as Element;
  clone.querySelectorAll(
    'button, [role="button"], svg, [class*="action"], [class*="toolbar"], [class*="copy"], [class*="vote"], [class*="thumb"]'
  ).forEach(el => el.remove());
  const md = clone.querySelector('[class*="markdown"], [class*="content"], [class*="prose"], [class*="text"]');
  return (md ?? clone).textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/**
 * 判断元素是否有明显的彩色背景。
 * 用色度（chroma = max-min）而非绝对亮度，避免过滤掉极浅的蓝/绿色用户气泡。
 */
function hasColoredBg(el: Element): boolean {
  try {
    const bg = window.getComputedStyle(el as HTMLElement).backgroundColor;
    if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return false;
    const m = bg.match(/[\d.]+/g);
    if (!m || m.length < 3) return false;
    const [r, g, b, a] = m.map(Number);
    if ((a ?? 1) < 0.1) return false;
    if (r < 20 && g < 20 && b < 20) return false; // 近黑色
    // 色度 < 8 视为无色相（白/灰/黑）——浅蓝 rgb(244,247,255) 色度=11，可通过
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (chroma < 8) return false;
    return true;
  } catch { return false; }
}

/** 向上取第 n 级祖先 */
function nthAncestor(el: Element, n: number): Element | null {
  let cur: Element | null = el;
  for (let i = 0; i < n; i++) cur = cur?.parentElement ?? null;
  return cur;
}

/**
 * 找用户消息气泡：有彩色背景 + 有实质文字 + 不在输入框/导航内。
 * 不用 getBoundingClientRect（避免过滤掉 DOM 中存在但未在视口的节点）。
 */
function findUserBubbles(): Element[] {
  const candidates = Array.from(document.querySelectorAll<Element>('div, p'))
    .filter(el => {
      if (!hasColoredBg(el)) return false;
      if (el.closest('textarea, input, [contenteditable="true"], form, header, nav, aside, button, [role="button"], [role="tooltip"], [role="menu"]')) return false;
      const text = el.textContent?.trim() ?? '';
      return text.length >= 10;
    });
  return outermost(candidates);
}

/**
 * Claude 同款算法：用彩色气泡定位聊天容器，返回容器全部直接子节点。
 * 若子节点数 < 气泡数，说明每个子节点是"轮次容器"（user+assistant 打包），
 * 自动展开一层以获取真正的消息行。
 */
function getMessagesByBubbleDepth(): Element[] {
  const bubbles = findUserBubbles();
  if (bubbles.length === 0) return [];
  for (let depth = 1; depth <= 15; depth++) {
    const ancestors = bubbles.map(b => nthAncestor(b, depth));
    if (ancestors.some(a => a === null)) break;
    const parents = new Set(ancestors.map(a => a!.parentElement));
    if (parents.size === 1) {
      const container = [...parents][0];
      if (container && container !== document.body) {
        const children = Array.from(container.children).filter(
          c => (c.textContent?.trim().length ?? 0) > 5,
        );
        // 子节点少于气泡数 → 可能是"轮次容器"（每个包含 user+assistant），展开一层
        if (children.length > 0 && children.length < bubbles.length) {
          const expanded = children.flatMap(c => {
            const subs = Array.from(c.children).filter(
              s => (s.textContent?.trim().length ?? 0) > 5
            );
            return subs.length >= 2 ? subs : [c];
          });
          if (expanded.length > children.length) return expanded;
        }
        return children;
      }
    }
  }
  return bubbles;
}

const colSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * 虚拟滚动全量收集：从顶到底，每滚一步立刻调 getRows() 读当前可见节点，
 * 用 data-message-id 或 text 前缀去重——节点事后被卸载也无所谓，文本已存内存。
 * 这是"滚完再读"方案的根本修复：每步捕获，而非最后一次性读。
 */
async function scrollAndCollect(
  getRows: () => Element[],
  roleOf: (el: Element) => 'user' | 'assistant',
  container: Element | null,
): Promise<Array<{ role: 'user' | 'assistant'; text: string }>> {
  const seen = new Set<string>();
  const results: Array<{ role: 'user' | 'assistant'; text: string }> = [];

  const capture = () => {
    try {
      for (const el of getRows()) {
        const text = cleanText(el);
        if (text.length < 3) continue;
        const key = el.getAttribute('data-observe-row')
          ?? el.getAttribute('data-message-id')
          ?? text.slice(0, 80);
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ role: roleOf(el), text });
      }
    } catch { /* DOM 短暂不稳定，跳过本步 */ }
  };

  if (!container) { capture(); return results; }

  const c = container as HTMLElement;
  // 先滚到顶，捕获最早的消息
  c.scrollTop = 0;
  container.dispatchEvent(new Event('scroll', { bubbles: true }));
  await colSleep(700);
  capture();

  const step = Math.max(c.clientHeight * 0.75, 400);
  let prev = -1;
  while (true) {
    c.scrollTop += step;
    container.dispatchEvent(new Event('scroll', { bubbles: true }));
    await colSleep(350);
    capture();
    if (c.scrollTop === prev) break;
    prev = c.scrollTop;
    if (c.scrollTop + c.clientHeight >= c.scrollHeight - 30) break;
  }

  c.scrollTop = c.scrollHeight;
  container.dispatchEvent(new Event('scroll', { bubbles: true }));
  await colSleep(300);
  capture();

  return results;
}

/** 通用：取容器的直接子级消息块 */
function childrenOf(containerSel: string, minText = 5): Element[] {
  const container = document.querySelector(containerSel);
  if (!container) return [];
  return Array.from(container.children).filter(
    el => (el.textContent?.trim().length ?? 0) > minText,
  );
}

/** 通用：尝试多个 selector，返回第一个有结果的 outermost 列表 */
function trySelectors(...selectors: string[]): Element[] {
  for (const sel of selectors) {
    try {
      const els = outermost(
        Array.from(document.querySelectorAll<Element>(sel)).filter(
          el => (el.textContent?.trim().length ?? 0) > 5,
        ),
      );
      if (els.length > 0) return els;
    } catch { /* bad selector, skip */ }
  }
  return [];
}

/**
 * CSS 布局对齐检测：chat UI 中用户消息靠右（margin-left:auto / align-self:flex-end），
 * AI 消息靠左。此信号比颜色更稳定，不依赖 content-visibility 渲染状态。
 */
function detectRoleByAlignment(node: Element): 'user' | 'assistant' | null {
  let el: Element | null = node;
  for (let i = 0; i < 8; i++) {
    if (!el || el === document.body) break;
    const s = window.getComputedStyle(el as HTMLElement);
    // margin-left:auto = flex 子元素靠右
    if (s.marginLeft === 'auto' && s.marginRight !== 'auto') return 'user';
    // align-self 直接标明对齐方向
    if (s.alignSelf === 'flex-end' || s.alignSelf === 'self-end') return 'user';
    if (s.alignSelf === 'flex-start' || s.alignSelf === 'self-start') return 'assistant';
    // 父容器 justify-content
    const p = el.parentElement;
    if (p) {
      const ps = window.getComputedStyle(p);
      if (ps.display === 'flex') {
        if (ps.justifyContent === 'flex-end' || ps.justifyContent === 'end') return 'user';
        if (ps.flexDirection !== 'column' && ps.flexDirection !== 'column-reverse') {
          if (ps.justifyContent === 'flex-start' || ps.justifyContent === 'start') return 'assistant';
        }
      }
    }
    el = el.parentElement;
  }
  return null;
}

/**
 * 通用角色检测：类名/属性关键字 → CSS 对齐 → 自身彩色背景 → 后代彩色背景。
 */
function detectRole(node: Element): 'user' | 'assistant' {
  const cls = (
    (node.className ?? '') + ' ' +
    (node.getAttribute('data-role') ?? '') + ' ' +
    (node.getAttribute('data-author') ?? '')
  ).toLowerCase();
  if (/\b(user|human|right|self|me|我|问|sent)\b/.test(cls)) return 'user';
  if (/\b(assistant|bot|ai|left|answer|reply|response|答)\b/.test(cls)) return 'assistant';

  // CSS 布局对齐（不依赖颜色渲染，off-screen 也可靠）
  const byAlign = detectRoleByAlignment(node);
  if (byAlign) return byAlign;

  // 节点自身彩色背景 → 用户
  if (hasColoredBg(node) && (node.textContent?.trim().length ?? 0) > 5) return 'user';

  // 深度扫描后代
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, null);
  let el = walker.nextNode() as Element | null;
  while (el) {
    const dcls = ((el.className ?? '') + ' ' + (el.getAttribute('data-role') ?? '')).toLowerCase();
    if (/\b(user|human|sent)\b/.test(dcls)) return 'user';
    if (hasColoredBg(el) && (el.textContent?.trim().length ?? 0) > 5) return 'user';
    el = walker.nextNode() as Element | null;
  }
  return 'assistant';
}

// ── Kimi (www.kimi.com) ───────────────────────────────────────────────────────

export const KimiAdapter: Adapter = {
  host: 'kimi.com',
  sourceModelName: 'Kimi',
  messageSelector: '[class*="message"]',

  getMessages(): Element[] {
    const containerSelectors = [
      '[class*="chatList"]',
      '[class*="chat-list"]',
      '[class*="messageList"]',
      '[class*="message-list"]',
      '[class*="conversation-list"]',
    ];
    for (const sel of containerSelectors) {
      const children = childrenOf(sel);
      if (children.length > 0) return children;
    }
    const fromSel = trySelectors(
      '[class*="message-item"]',
      '[class*="chat-item"]',
      '[class*="segment"]',
    );
    if (fromSel.length > 0) return fromSel;
    return getMessagesByBubbleDepth();
  },

  roleOf: detectRole,
  textOf: cleanText,
  mountPoint: () => document.body,
  scrollContainer: () =>
    document.querySelector('[class*="chat-list"], [class*="message-list"], [class*="chatList"], main') ?? null,
  conversationTitle: () => document.title.replace(/\s*[-–|].*$/, '').trim() || null,
};

// ── DeepSeek (chat.deepseek.com) ─────────────────────────────────────────────

/** 取一组节点的最近公共祖先 */
function lowestCommonAncestor(nodes: Element[]): Element | null {
  if (nodes.length === 0) return null;
  let lca: Element | null = nodes[0];
  while (lca && !nodes.every(n => lca!.contains(n))) lca = lca.parentElement;
  return lca;
}

/**
 * DeepSeek 消息行：锚定稳定类名 .ds-markdown（AI 回复渲染器）。
 * AI 回复块的最近公共祖先 = 消息列表容器，其直接子节点 = 每条消息（用户/AI 交替）。
 * 不依赖颜色或哈希 class。
 */
function deepseekRows(): Element[] {
  const ai = Array.from(document.querySelectorAll('.ds-markdown'));
  if (ai.length === 0) return getMessagesByBubbleDepth();
  const lca = lowestCommonAncestor(ai);
  if (!lca || lca === document.body) return getMessagesByBubbleDepth();
  let rows = Array.from(lca.children).filter(
    c => (c.textContent?.trim().length ?? 0) > 0,
  );
  // 行数明显少于 AI 块数 → 每行是"轮次容器"(含 user+AI)，展开一层
  if (rows.length < ai.length) {
    const expanded = rows.flatMap(r => {
      const subs = Array.from(r.children).filter(
        s => (s.textContent?.trim().length ?? 0) > 0,
      );
      return subs.length >= 2 ? subs : [r];
    });
    if (expanded.length > rows.length) rows = expanded;
  }
  return rows;
}

export const DeepSeekAdapter: Adapter = {
  host: 'deepseek.com',
  sourceModelName: 'DeepSeek',
  messageSelector: '[class*="message"]',
  usesApiHistory: true, // 虚拟滚动，"全选我的"走接口截获的完整消息

  getMessages: deepseekRows,

  roleOf(node: Element): 'user' | 'assistant' {
    // 含 .ds-markdown = AI 回复；消息列表里其余的一律是用户消息
    if (node.classList.contains('ds-markdown') || node.querySelector('.ds-markdown')) {
      return 'assistant';
    }
    const cls = ((node.className ?? '') + ' ' + (node.getAttribute('data-role') ?? '')).toLowerCase();
    if (/\b(assistant|bot|ai)\b/.test(cls)) return 'assistant';
    // 默认：DeepSeek 消息行里非 AI 块就是用户的话
    return 'user';
  },

  textOf: cleanText,
  mountPoint: () => document.body,

  scrollContainer(): Element | null {
    const bubble = findUserBubbles()[0] ?? document.querySelector('main');
    if (!bubble) return document.querySelector('main') ?? null;
    let el: Element | null = bubble.parentElement;
    while (el && el !== document.body) {
      const s = window.getComputedStyle(el as HTMLElement);
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll') &&
          (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight + 20) {
        return el;
      }
      el = el.parentElement;
    }
    return document.querySelector('main') ?? null;
  },

  async collectMessages() {
    return scrollAndCollect(
      deepseekRows,
      (el) => this.roleOf(el),
      this.scrollContainer(),
    );
  },

  conversationTitle: () => document.title.replace(/\s*[-–|].*$/, '').trim() || null,
};

// ── 豆包 (www.doubao.com) ─────────────────────────────────────────────────────

// data-observe-row = 豆包虚拟列表行的稳定标识（经 Manus 实地验证）
function doubaoRows(): Element[] {
  const rows = Array.from(
    document.querySelectorAll<Element>('.v_list_row[data-observe-row]'),
  ).filter(el => (el.textContent?.trim().length ?? 0) > 0);
  if (rows.length > 0) return rows;
  // 兜底：宽松匹配（class 名后缀可能变动）
  return Array.from(
    document.querySelectorAll<Element>('[data-observe-row]'),
  ).filter(el => (el.textContent?.trim().length ?? 0) > 0);
}

export const DoubaoAdapter: Adapter = {
  host: 'doubao.com',
  sourceModelName: '豆包',
  messageSelector: '[data-observe-row]',
  usesApiHistory: true,

  getMessages: doubaoRows,

  roleOf(node: Element): 'user' | 'assistant' {
    // 经 Manus 实地验证：用户消息含 .bg-g-send-msg-bubble-bg 或祖先含 .justify-end
    if (node.querySelector('.bg-g-send-msg-bubble-bg')) return 'user';
    if (node.closest('.justify-end') || node.querySelector('.justify-end')) return 'user';
    // AI 消息含 .markdown-body 或 [class*="md-box"]
    if (node.querySelector('.markdown-body, [class*="md-box"]')) return 'assistant';
    // CSS 布局对齐兜底
    const byAlign = detectRoleByAlignment(node);
    if (byAlign) return byAlign;
    return 'assistant';
  },

  textOf(node: Element): string {
    const clone = node.cloneNode(true) as Element;
    clone.querySelectorAll(
      'button, [role="button"], svg, [class*="action"], [class*="toolbar"], [class*="copy"], [class*="vote"], [class*="thumb"]'
    ).forEach(el => el.remove());
    // 豆包文本节点优先级：.markdown-body > [class*="md-box"] > .whitespace-pre-wrap > 全文本
    const md = clone.querySelector('.markdown-body, [class*="md-box"], .whitespace-pre-wrap');
    return (md ?? clone).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  },

  mountPoint: () => document.body,

  // Manus 验证：document.querySelector('main div[class*="scroll"]') 可滚到顶
  scrollContainer: () =>
    document.querySelector<Element>('main div[class*="v_list_scroller"]')
    ?? document.querySelector<Element>('main div[class*="scroll"]')
    ?? null,

  async collectMessages() {
    return scrollAndCollect(
      doubaoRows,
      (el) => this.roleOf(el),
      this.scrollContainer(),
    );
  },

  conversationTitle: () => document.title.replace(/\s*[-–|].*$/, '').trim() || null,
};

// ── 通义千问 (www.qianwen.com) ────────────────────────────────────────────────

export const QwenAdapter: Adapter = {
  host: 'qianwen.com',
  sourceModelName: '通义千问',
  messageSelector: '[class*="message"]',

  getMessages(): Element[] {
    const containerSelectors = [
      '[class*="chatItem"]',
      '[class*="chat-item"]',
      '[class*="conversation-list"]',
      '[class*="dialog-list"]',
    ];
    for (const sel of containerSelectors) {
      const children = childrenOf(sel);
      if (children.length > 0) return children;
    }
    const fromSel = trySelectors(
      '[class*="human-message"], [class*="ai-message"]',
      '[class*="chatItem"]',
      '[class*="chat-item"]',
      '[class*="message-item"]',
      '[class*="bubble-wrap"]',
      '[class*="dialog-item"]',
    );
    if (fromSel.length > 0) return fromSel;
    return getMessagesByBubbleDepth();
  },

  roleOf: detectRole,
  textOf: cleanText,
  mountPoint: () => document.body,
  scrollContainer: () =>
    document.querySelector('[class*="chat-box"], [class*="content-wrap"], [class*="dialog-list"], main') ?? null,
  conversationTitle: () => document.title.replace(/\s*[-–|].*$/, '').trim() || null,
};

// ── 智谱 GLM (bigmodel.cn) ────────────────────────────────────────────────────

export const GLMAdapter: Adapter = {
  host: 'bigmodel.cn',
  sourceModelName: '智谱 GLM',
  messageSelector: '[class*="message"]',

  getMessages(): Element[] {
    const containerSelectors = [
      '[class*="chatList"]',
      '[class*="chat-list"]',
      '[class*="messageList"]',
      '[class*="message-list"]',
    ];
    for (const sel of containerSelectors) {
      const children = childrenOf(sel);
      if (children.length > 0) return children;
    }
    const fromSel = trySelectors(
      '[class*="chat-item"]',
      '[class*="chatItem"]',
      '[class*="message-item"]',
      '[class*="human"], [class*="answer"]',
    );
    if (fromSel.length > 0) return fromSel;
    return getMessagesByBubbleDepth();
  },

  roleOf: detectRole,
  textOf: cleanText,
  mountPoint: () => document.body,
  scrollContainer: () =>
    document.querySelector('[class*="chat-wrap"], [class*="message-list"], [class*="chatList"], main') ?? null,
  conversationTitle: () => document.title.replace(/\s*[-–|].*$/, '').trim() || null,
};

// ── MiniMax / 海螺 (agent.minimaxi.com) ──────────────────────────────────────

export const MinimaxAdapter: Adapter = {
  host: 'minimaxi.com',
  sourceModelName: 'MiniMax',
  messageSelector: '[class*="message"]',

  getMessages(): Element[] {
    const containerSelectors = [
      '[class*="chat-list"]',
      '[class*="chatList"]',
      '[class*="message-list"]',
      '[class*="conversation-list"]',
    ];
    for (const sel of containerSelectors) {
      const children = childrenOf(sel);
      if (children.length > 0) return children;
    }
    const fromSel = trySelectors(
      '[class*="user-message"], [class*="bot-message"]',
      '[class*="chat-message"]',
      '[class*="message-item"]',
      '[class*="bubble"]',
      '[data-role="user"], [data-role="assistant"]',
    );
    if (fromSel.length > 0) return fromSel;
    return getMessagesByBubbleDepth();
  },

  roleOf: detectRole,
  textOf: cleanText,
  mountPoint: () => document.body,
  scrollContainer: () =>
    document.querySelector('[class*="chat-wrap"], [class*="message-list"], [class*="chat-list"], main') ?? null,
  conversationTitle: () => document.title.replace(/\s*[-–|].*$/, '').trim() || null,
};
