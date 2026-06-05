import type { Adapter } from './types';

// ⚠️ Gemini DOM 改版频繁，此适配器为尽力版本，待真实页面验证
// 验证：document.querySelectorAll('user-query, model-response')
// 如果无结果，尝试：document.querySelectorAll('[class*="user-query"], [class*="model-response"]')
const GeminiAdapter: Adapter = {
  host: 'gemini.google.com',
  sourceModelName: 'Gemini',

  messageSelector: 'user-query, model-response',

  roleOf(node: Element): 'user' | 'assistant' {
    const tag = node.tagName.toLowerCase();
    if (tag === 'user-query' || tag.includes('user')) return 'user';
    return 'assistant';
  },

  textOf(node: Element): string {
    const selectors = ['.query-text', '.response-content', 'p', 'span'];
    for (const sel of selectors) {
      const el = node.querySelector(sel);
      if (el?.textContent?.trim()) return el.textContent.trim();
    }
    return node.textContent?.trim() ?? '';
  },

  mountPoint(): Element {
    return document.body;
  },

  scrollContainer(): Element | null {
    return document.querySelector('chat-window') ?? document.querySelector('main') ?? null;
  },

  conversationTitle(): string | null {
    const title = document.title;
    return title ? title.replace(/\s*[–\-]\s*Gemini.*$/i, '').trim() || null : null;
  },
};

export default GeminiAdapter;
