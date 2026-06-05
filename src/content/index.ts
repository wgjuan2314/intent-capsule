import { getAdapter } from './adapters/registry';
import { ControlPanel } from './ControlPanel';
import { listenApiHistory } from './historyStore';

// 生成随机 nonce 写入 DOM，interceptor（MAIN world）读取后附在每条消息上，
// 防止页面 JS 伪造 ic-api-history 消息污染历史数据。
const IC_NONCE = Math.random().toString(36).slice(2);
document.documentElement.dataset.icNonce = IC_NONCE;

// 监听 MAIN world 拦截器投递的完整对话消息（DeepSeek 等虚拟滚动站点）
listenApiHistory(IC_NONCE);

let panel: ControlPanel | null = null;

function init(): void {
  const adapter = getAdapter();
  if (!adapter) return;

  // SPA 内页面渲染有延迟，等待 DOM 稳定后再注入
  const delay = location.hostname.includes('claude') ? 1500 : 800;
  setTimeout(() => {
    panel?.destroy();
    panel = new ControlPanel(adapter);
  }, delay);
}

init();

// 监听 SPA 路由变化，重新初始化（对话切换时旧 panel 销毁）
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    panel?.destroy();
    panel = null;
    init();
  }
}).observe(document, { subtree: true, childList: true });
