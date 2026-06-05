import type { Adapter } from './types';

// 已验证：用户消息 = [data-testid="user-message"]
// AI 消息无专用 testid，通过公共父容器算法推断

/** 向上取第 n 级祖先 */
function nthAncestor(el: Element, n: number): Element | null {
  let cur: Element | null = el;
  for (let i = 0; i < n; i++) cur = cur?.parentElement ?? null;
  return cur;
}

/**
 * 找到所有 user-message 节点的"对话列表"容器（所有 turn 的直接父级）：
 * 逐层向上，找到第一个深度 d，使得所有 user-message 在深度 d 的祖先
 * 都是同一个父元素的直接子节点。这个父元素就是 conversationList。
 * 返回 conversationList 的所有子节点（包含 user turn + ai turn）。
 */
function findAllTurns(): Element[] {
  const userMsgs = Array.from(
    document.querySelectorAll<Element>('[data-testid="user-message"]'),
  );
  if (userMsgs.length === 0) return [];

  // 单条消息：直接返回，等对话展开后 MutationObserver 会重新触发
  if (userMsgs.length === 1) return userMsgs;

  for (let depth = 1; depth <= 12; depth++) {
    const ancestors = userMsgs.map(msg => nthAncestor(msg, depth));
    if (ancestors.some(a => a === null)) break;

    const parentSet = new Set(ancestors.map(a => a!.parentElement));
    if (parentSet.size === 1) {
      const conversationList = [...parentSet][0];
      // 排除太顶层的容器（body / main）
      if (conversationList && conversationList !== document.body) {
        return Array.from(conversationList.children).filter(
          el => (el.textContent?.trim().length ?? 0) > 5,
        );
      }
    }
  }

  return userMsgs; // 降级：只返回用户消息
}

const ClaudeAdapter: Adapter = {
  host: 'claude.ai',
  sourceModelName: 'Claude',
  messageSelector: '[data-testid="user-message"]', // 备用

  getMessages(): Element[] {
    return findAllTurns();
  },

  roleOf(node: Element): 'user' | 'assistant' {
    // 节点本身是 user-message（单条降级路径）
    if (node.getAttribute('data-testid') === 'user-message') return 'user';
    // 节点包含 user-message 子节点（turn container 路径）
    return node.querySelector('[data-testid="user-message"]') ? 'user' : 'assistant';
  },

  textOf(node: Element): string {
    // 用户消息：自身或子节点
    const userMsg =
      node.getAttribute('data-testid') === 'user-message'
        ? node
        : node.querySelector('[data-testid="user-message"]');
    if (userMsg) return userMsg.textContent?.trim() ?? '';

    // AI 消息：克隆后移除操作按钮，取干净正文
    const clone = node.cloneNode(true) as Element;
    clone
      .querySelectorAll('[role="group"], button, [data-testid*="action"], [aria-label*="actions"]')
      .forEach(el => el.remove());
    return clone.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  },

  mountPoint(): Element {
    return document.body;
  },

  scrollContainer(): Element | null {
    return (
      document.querySelector('[class*="overflow-y-auto"]') ??
      document.querySelector('main') ??
      null
    );
  },

  conversationTitle(): string | null {
    const t = document.title;
    return t ? t.replace(/\s*[–\-]\s*Claude.*$/i, '').trim() || null : null;
  },
};

export default ClaudeAdapter;
