// 首次安装时自动写入默认配置，无需手动设置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('apiKey', (data) => {
    if (!data.apiKey) {
      chrome.storage.local.set({
        apiKey: '',
        model: 'deepseek-chat',
      });
    }
  });
});

interface EnhanceRequest {
  type: 'ENHANCE';
  text: string;
  mode: 'enhance' | 'summarize';
}

interface EnhanceResult {
  text?: string;
  error?: string;
}

const DEFAULT_PROMPTS = {
  enhance: `你是上下文整理员。任务：对下面的对话消息做最小化润色，让新 AI 能快速读懂来龙去脉。

规则：
- 完整保留每一条消息，不得删除、合并或压缩任何一条
- 只去掉明显的废话（"好的"、"嗯嗯"、"你好"等无实质内容的句子）和完全重复的内容
- 修正错别字、补全明显残缺的表达，但不改变原意
- 不添加任何原文没有的内容、总结或推断
- 保持原有的消息条数和结构，每条消息仍以"我："或"AI名："开头
- 直接输出整理后的消息列表，不加任何前言、标题或解释`,
};

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false;
    const msg = message as Record<string, unknown>;

    if (msg['type'] === 'OPEN_OPTIONS') {
      chrome.runtime.openOptionsPage();
      return false;
    }
    if (msg['type'] !== 'ENHANCE') return false;
    handleEnhance(msg as unknown as EnhanceRequest)
      .then(sendResponse)
      .catch(e => sendResponse({ error: String(e) }));
    return true;
  },
);

async function handleEnhance(req: EnhanceRequest): Promise<EnhanceResult> {
  const stored = await chrome.storage.local.get([
    'apiKey', 'model', 'enhancePrompt', 'summarizePrompt',
  ]);

  const apiKey: string = stored.apiKey ?? '';
  if (!apiKey) return { error: '请先在设置中填写 DeepSeek API Key' };

  const model: string = stored.model ?? 'deepseek-v4-pro';
  const systemPrompt: string = stored.enhancePrompt || DEFAULT_PROMPTS.enhance;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: req.text },
        ],
        temperature: 0.3,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { error: `API 错误 ${response.status}：${errText.slice(0, 200)}` };
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '';
    return { text };
  } catch (e) {
    return { error: `网络错误：${String(e)}` };
  }
}
