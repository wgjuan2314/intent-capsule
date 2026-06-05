// MAIN world 脚本：挂钩 fetch/XHR，被动截获 DeepSeek / 豆包 自己的历史消息接口，
// 提取完整消息列表后经 window.postMessage 投递给内容脚本。
// document_start 注入，早于站点代码。

type ApiMsg = { role: 'user' | 'assistant'; text: string };

(function () {
  const POST_TAG = 'ic-api-history';
  const REQ_TAG = 'ic-request-history';

  let latestHistory: ApiMsg[] = [];
  // 读取内容脚本写入的 nonce，只有匹配才能被 historyStore 接受，防页面 JS 伪造
  const nonce = document.documentElement.dataset.icNonce ?? '';

  // ── 通用角色提取 ──────────────────────────────────────────────────────────────
  function pickRole(m: any): 'user' | 'assistant' {
    const raw = String(
      m.role ?? m.message_type ?? m.type ?? m.from ?? m.sender ?? m.author ?? '',
    ).toLowerCase();
    if (/assist|bot|\bai\b|model|gpt|reply|answer/.test(raw)) return 'assistant';
    if (/user|human|\bme\b|question|prompt/.test(raw)) return 'user';
    if (m.thinking_content || m.model || m.search_results) return 'assistant';
    return 'user';
  }

  // ── 通用文本提取 ──────────────────────────────────────────────────────────────
  function pickText(m: any): string {
    if (typeof m.content === 'string' && m.content.trim()) return m.content.trim();
    if (typeof m.text === 'string' && m.text.trim()) return m.text.trim();
    if (typeof m.message === 'string' && m.message.trim()) return m.message.trim();
    if (Array.isArray(m.fragments)) {
      const s = m.fragments.map((f: any) => f.content || f.text || '').join('').trim();
      if (s) return s;
    }
    return '';
  }

  // ── DeepSeek：history_messages 接口，标准 JSON ────────────────────────────────
  function extractDeepSeek(data: any): ApiMsg[] {
    const arr: any[] = Array.isArray(data)
      ? data
      : (data && (data.chat_messages || data.messages || data.list || data.items)) || [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map(m => ({ role: pickRole(m), text: pickText(m) }))
      .filter(m => m.text.length > 0);
  }

  // ── 豆包：/samantha/ 接口，content 字段是 JSON 字符串 {"text":"..."} ──────────
  function extractDoubaoContent(raw: string): string {
    if (!raw) return '';
    // content 可能是 JSON 字符串，也可能是普通字符串
    try {
      const o = JSON.parse(raw);
      if (typeof o.text === 'string') return o.text.trim();
    } catch { /* 普通字符串，直接用 */ }
    return raw.trim();
  }

  function extractDoubao(data: any): ApiMsg[] {
    // 历史消息可能在不同字段下，逐一尝试
    const candidates: any[] = [
      data?.messages,
      data?.data?.messages,
      data?.data?.chat_messages,
      data?.chat_messages,
      data?.data?.list,
      data?.list,
    ].filter(Array.isArray);

    for (const arr of candidates) {
      const msgs: ApiMsg[] = (arr as any[])
        .map((m: any) => {
          const roleRaw = String(m.role ?? m.sender ?? '').toLowerCase();
          const role: 'user' | 'assistant' =
            /assist|bot|ai|model/.test(roleRaw) ? 'assistant' : 'user';
          // 豆包 content 字段是 JSON 字符串，需要二次解析
          const text = extractDoubaoContent(
            typeof m.content === 'string' ? m.content :
            typeof m.text === 'string' ? m.text : '',
          );
          return { role, text };
        })
        .filter((m: ApiMsg) => m.text.length > 0);
      if (msgs.length > 1) return msgs; // 至少2条才算历史
    }
    return [];
  }

  // ── 豆包 SSE 流解析（/samantha/chat/completion 格式）────────────────────────
  // 累积 SSE 事件中的 message，组合出完整历史
  function parseDoubaoSSE(body: string): ApiMsg[] {
    const msgs: ApiMsg[] = [];
    const lines = body.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      try {
        const ev = JSON.parse(line.slice(5).trim());
        const edRaw = ev?.event_data;
        if (!edRaw) continue;
        const ed = typeof edRaw === 'string' ? JSON.parse(edRaw) : edRaw;
        const msg = ed?.message;
        if (!msg) continue;
        const roleRaw = String(msg.role ?? '').toLowerCase();
        const role: 'user' | 'assistant' =
          /assist|bot|ai|model/.test(roleRaw) ? 'assistant' : 'user';
        const text = extractDoubaoContent(
          typeof msg.content === 'string' ? msg.content : '',
        );
        if (text.length > 0) msgs.push({ role, text });
      } catch { /* 单行解析失败，继续 */ }
    }
    return msgs;
  }

  function broadcast(): void {
    window.postMessage({ __ic: POST_TAG, __nonce: nonce, messages: latestHistory }, window.location.origin);
  }

  // DeepSeek 处理入口
  function handleDeepSeek(body: string): void {
    try {
      const j = JSON.parse(body);
      const msgs = extractDeepSeek(j && j.data);
      if (msgs.length > 0) { latestHistory = msgs; broadcast(); }
    } catch { /* 忽略 */ }
  }

  // 豆包处理入口：先试 JSON，再试 SSE
  function handleDoubao(body: string): void {
    try {
      const j = JSON.parse(body);
      const msgs = extractDoubao(j);
      if (msgs.length > 0) { latestHistory = msgs; broadcast(); return; }
    } catch { /* 不是纯 JSON */ }
    // SSE 流
    const msgs = parseDoubaoSSE(body);
    if (msgs.length > 0) { latestHistory = msgs; broadcast(); }
  }

  // 握手：接收方就位后主动索要，把存着的最新一份发回去
  window.addEventListener('message', e => {
    if (e.origin !== window.location.origin) return;
    if (e.data && e.data.__ic === REQ_TAG && latestHistory.length > 0) broadcast();
  });

  function urlMatches(url: string): 'deepseek' | 'doubao' | null {
    if (/history_messages/.test(url)) return 'deepseek';
    // 豆包 IM 接口：/samantha/（旧）或 /im/chain/（Manus 实地验证）
    if (/\/samantha\//.test(url) || /\/im\/chain\//.test(url)) return 'doubao';
    return null;
  }

  // ── patch fetch ──
  const origFetch = window.fetch;
  window.fetch = async function (this: any, ...args: any[]) {
    const res = await origFetch.apply(this, args as any);
    try {
      const a0 = args[0];
      const url: string = typeof a0 === 'string' ? a0 : (a0 && a0.url) || '';
      const site = urlMatches(url);
      if (site) {
        // 豆包 SSE 响应用 content-type 过滤，避免挂住长流（仅处理 JSON 响应）
        const ct = res.headers?.get('content-type') ?? '';
        if (site === 'doubao' && ct.includes('text/event-stream')) {
          // SSE 流：克隆后完整读取（历史加载一次性，不是持续流）
          res.clone().text().then(handleDoubao).catch(() => {});
        } else {
          res.clone().text().then(
            site === 'deepseek' ? handleDeepSeek : handleDoubao,
          ).catch(() => {});
        }
      }
    } catch {}
    return res;
  };

  // ── patch XHR ──
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (this: any, method: string, url: string, ...rest: any[]) {
    this.__icUrl = url;
    return (origOpen as any).call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...sendArgs: any[]) {
    this.addEventListener('load', () => {
      try {
        const url: string = (this as any).__icUrl;
        const site = url ? urlMatches(url) : null;
        if (site === 'deepseek') handleDeepSeek(this.responseText);
        else if (site === 'doubao') handleDoubao(this.responseText);
      } catch {}
    });
    return origSend.apply(this, sendArgs as []);
  };
})();
