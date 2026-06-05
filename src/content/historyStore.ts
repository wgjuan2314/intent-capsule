// 存放从站点接口截获的完整对话消息（用于虚拟滚动站点，如 DeepSeek）。
// 拦截器（MAIN world）经 window.postMessage 投递，内容脚本监听后写入这里。

export type ApiMsg = { role: 'user' | 'assistant'; text: string };

const POST_TAG = 'ic-api-history';
const REQ_TAG = 'ic-request-history';

let messages: ApiMsg[] = [];
let waiters: Array<() => void> = [];

/** 内容脚本侧：监听 MAIN world 投递的消息，nonce 校验防页面 JS 伪造 */
export function listenApiHistory(nonce: string): void {
  window.addEventListener('message', e => {
    if (e.origin !== window.location.origin) return;
    const d = e.data;
    if (d && d.__ic === POST_TAG && d.__nonce === nonce && Array.isArray(d.messages)) {
      messages = d.messages as ApiMsg[];
      const ws = waiters;
      waiters = [];
      ws.forEach(w => w());
    }
  });
}

export function getApiHistory(): ApiMsg[] {
  return messages;
}

/**
 * 主动向拦截器索要完整消息（握手）。
 * 解决"网页加载时已截获并广播，但监听器尚未就位导致丢失"的时序问题。
 */
export function requestApiHistory(timeoutMs = 800): Promise<ApiMsg[]> {
  if (messages.length > 0) return Promise.resolve(messages);
  window.postMessage({ __ic: REQ_TAG }, window.location.origin);
  return new Promise(resolve => {
    const t = setTimeout(() => {
      waiters = waiters.filter(w => w !== done);
      resolve(messages);
    }, timeoutMs);
    const done = () => { clearTimeout(t); resolve(messages); };
    waiters.push(done);
  });
}

export function clearApiHistory(): void {
  messages = [];
}
