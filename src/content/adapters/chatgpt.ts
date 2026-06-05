import type { Adapter } from './types';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const ChatGPTAdapter: Adapter = {
  host: 'chatgpt.com',
  sourceModelName: 'ChatGPT',
  messageSelector: '[data-message-author-role]',

  roleOf(node: Element): 'user' | 'assistant' {
    return node.getAttribute('data-message-author-role') === 'user' ? 'user' : 'assistant';
  },

  textOf(node: Element): string {
    const role = node.getAttribute('data-message-author-role');
    if (role === 'user') {
      return node.querySelector('.whitespace-pre-wrap')?.textContent?.trim()
        ?? node.textContent?.trim() ?? '';
    }
    const clone = node.cloneNode(true) as Element;
    clone.querySelectorAll('button, [role="group"], form, [class*="action"]').forEach(el => el.remove());
    const md = clone.querySelector('.markdown, [class*="prose"], [class*="markdown"]');
    return (md ?? clone).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  },

  mountPoint(): Element { return document.body; },

  scrollContainer(): Element | null {
    // 从消息节点向上走，找到第一个真正在滚动的祖先容器
    // 比用 class 名选更可靠（ChatGPT class 名经常变）
    const anchor = document.querySelector('[data-message-author-role]');
    if (anchor) {
      let el: Element | null = anchor.parentElement;
      while (el && el !== document.body) {
        const { overflowY } = window.getComputedStyle(el);
        if (['auto', 'scroll'].includes(overflowY) && el.scrollHeight > el.clientHeight + 10) {
          return el;
        }
        el = el.parentElement;
      }
    }
    return document.querySelector('main') ?? null;
  },

  conversationTitle(): string | null {
    const t = document.title;
    return t ? t.replace(/\s*[–\-]\s*ChatGPT.*$/i, '').trim() || null : null;
  },

  /**
   * ChatGPT 虚拟滚动：滚动整个对话让所有消息渲染进 DOM。
   * 每次移动后 dispatchEvent('scroll') 确保 React 虚拟化感知到滚动。
   */
  async ensureAllLoaded(): Promise<void> {
    const container = this.scrollContainer();
    if (!container) return;

    const scrollTo = (top: number) => {
      container.scrollTop = top;
      // 手动触发 scroll 事件，确保 React 虚拟化重新计算渲染范围
      container.dispatchEvent(new Event('scroll', { bubbles: true }));
    };

    // 先到顶部加载历史消息
    scrollTo(0);
    await sleep(700);

    // 逐步向下，每步等待新内容渲染
    const step = Math.max(container.clientHeight * 0.7, 400);
    while (container.scrollTop + container.clientHeight < container.scrollHeight - 50) {
      scrollTo(container.scrollTop + step);
      await sleep(500);
    }

    // 确保到底
    scrollTo(container.scrollHeight);
    await sleep(300);
  },
};

export const OpenAIAdapter: Adapter = { ...ChatGPTAdapter, host: 'chat.openai.com' };

export default ChatGPTAdapter;
