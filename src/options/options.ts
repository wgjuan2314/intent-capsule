const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const modelSelect = document.getElementById('model') as HTMLSelectElement;
const enhancePrompt = document.getElementById('enhance-prompt') as HTMLTextAreaElement;
const statusEl = document.getElementById('status') as HTMLElement;
const toggleKeyBtn = document.getElementById('toggle-key') as HTMLButtonElement;
const testKeyBtn = document.getElementById('test-key') as HTMLButtonElement;
const keyHint = document.getElementById('key-hint') as HTMLElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;

// 加载已保存的设置
chrome.storage.local.get(
  ['apiKey', 'model', 'enhancePrompt'],
  (data) => {
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    if (data.model) modelSelect.value = data.model;
    if (data.enhancePrompt) enhancePrompt.value = data.enhancePrompt;
  },
);

// 显示 / 隐藏 API Key
toggleKeyBtn.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyBtn.textContent = '隐藏';
  } else {
    apiKeyInput.type = 'password';
    toggleKeyBtn.textContent = '显示';
  }
});

testKeyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) { keyHint.style.color = '#DC2626'; keyHint.textContent = '请先填写 API Key'; return; }
  testKeyBtn.disabled = true;
  testKeyBtn.textContent = '…';
  keyHint.style.color = '#888';
  keyHint.textContent = '连接中…';
  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: modelSelect.value || 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 3 }),
    });
    if (res.ok) {
      keyHint.style.color = '#16A34A';
      keyHint.textContent = '✓ 连接成功，API Key 有效';
    } else {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      keyHint.style.color = '#DC2626';
      keyHint.textContent = `✗ 错误 ${res.status}：${err?.error?.message ?? '请检查 Key'}`;
    }
  } catch {
    keyHint.style.color = '#DC2626';
    keyHint.textContent = '✗ 网络错误，请检查连接';
  } finally {
    testKeyBtn.disabled = false;
    testKeyBtn.textContent = '测试';
  }
});

saveBtn.addEventListener('click', () => {
  chrome.storage.local.set(
    {
      apiKey: apiKeyInput.value.trim(),
      model: modelSelect.value,
      enhancePrompt: enhancePrompt.value.trim(),
    },
    () => {
      statusEl.textContent = '已保存 ✓';
      setTimeout(() => { statusEl.textContent = ''; }, 2500);
    },
  );
});
