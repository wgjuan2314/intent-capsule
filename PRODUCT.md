# 意图胶囊 (Intent Capsule) — 产品文档

> 供 Codex 生成产品介绍页（landing page）及后续迭代参考。
> 最后更新：2026-06-01（v1.0.0 已提交 Chrome Web Store 审核）

---

## 核心定位

**一句话**：在 AI 对话页里，逐条勾选你说的话，一键打包带去另一个 AI 继续聊。

**核心差异**：现有工具（Context Bridge 等）是"铲子"——整段对话搬走。意图胶囊是"手术刀"——你选哪条带哪条，默认只摘你自己的问题（用户 prompt = 意图浓缩，最高效、噪音最少）。

**目标用户**：深度多模型用户。场景：① 当前模型"聊变蠢了"，选关键消息重开干净对话续上；② 想对比另一个模型，把意图带过去不用重新解释。

---

## 核心功能

### 1. 悬浮入口（FAB）
- 页面右侧常驻悬浮胶囊按钮，鼠标悬停滑出，不干扰正常使用
- 快捷键 `Alt+C` 展开/收起面板
- 品牌色：`#EB4C89`（玫红）

### 2. 逐条勾选
- 每条消息旁注入 checkbox（accent-color 与品牌色一致）
- 「全选我的」一键选中所有用户消息
- 支持手动任意勾选（含 AI 关键回复）

### 3. 虚拟滚动全量收集（核心技术亮点）
DeepSeek、豆包等平台使用虚拟列表，视口外消息节点会被卸载，普通 DOM 方案只能选到可见部分。
意图胶囊采用**边滚动边捕获**策略：
- 点「全选我的」时自动从顶到底滚一遍
- 每滚一步立即读取当前可见节点存入内存
- 节点事后被虚拟列表卸载也不影响，文本已存进内存
- 最终返回完整对话，不只是当前可见部分

同时在 DeepSeek 上额外支持 API 接口截获（被动拦截网页自身的 `history_messages` 请求），速度更快。

### 4. 时间胶囊头（Provenance Header）
插件确定性生成（不调 AI），格式示例：
```
【上下文交接 · 意图胶囊】
来源：与 DeepSeek 的一段对话《如何设计 API》（2026-06-01），带过来 8 条消息
说明：以下是我（用户）说过的话，代表我的意图与需求，非 AI 回复。请基于此继续。
———
我：...
我：...
```

### 5. 一键复制
选好 → 点「一键复制」→ 粘到任意 AI，继续聊。全本地，零网络延迟。

### 6. AI 整理（可选）
「✨ AI 整理」按钮：对选中消息做最小化润色——完整保留每一条，只去掉废话和重复，修正错别字。调用 DeepSeek API，需在设置页填 key。未填 key 时核心功能照常可用。

---

## 支持平台（9 个）

| 平台 | 域名 | 虚拟滚动处理 |
|------|------|------------|
| Claude | claude.ai | 全渲染，直接读 DOM |
| ChatGPT | chatgpt.com / chat.openai.com | ensureAllLoaded 滚动加载 |
| Gemini | gemini.google.com | 直接读 DOM |
| Kimi | www.kimi.com | 直接读 DOM |
| DeepSeek | chat.deepseek.com | API 截获 + scrollAndCollect 兜底 |
| 豆包 | www.doubao.com | scrollAndCollect（[data-observe-row] 选择器） |
| 通义千问 | www.qianwen.com | 直接读 DOM |
| 智谱 GLM | bigmodel.cn | 直接读 DOM |
| MiniMax 海螺 | agent.minimaxi.com | 直接读 DOM |

---

## 品牌设计规范

### 颜色
- 主色：`#EB4C89`（玫红，胶囊品牌色）
- 辅色浅：`#FFE4F0`（浅玫红，hover 态）
- 辅色深：`#C2185B`（深玫红，按压态）
- 中性文字：`#18181B`
- 次级文字：`#71717A`
- 背景/分割：`#F4F4F5`、`#EBEBEB`

### 图标
胶囊形状（竖向药丸），底色玫红圆角正方形。SVG 路径已内嵌于扩展代码。

### 字体
`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### Tagline 备选
- 「别人是铲子，它是手术刀」
- 「选你说的话，带去下一个 AI」
- 「意图不丢，换模型继续」

---

## Landing Page 结构建议

### Hero Section
- 大标题：**意图胶囊**
- 副标题：在 AI 对话里勾选你说的话，一键带去另一个 AI 继续聊
- 主 CTA：「加入 Chrome」按钮
- Hero 视觉：扩展 UI 截图或动图演示（FAB → 面板 → 全选 → 复制）

### Problem Section（为什么需要它）
三个痛点：
1. **模型"变蠢"了**：聊太久上下文退化，重开对话又要从头解释
2. **想换模型对比**：ChatGPT 换 Claude，要重打一遍需求
3. **整段搬太乱**：现有工具搬走全部，AI 回复占大半，噪音太多

### How It Works（三步）
1. 🔘 勾选：点「全选我的」或手动选任意消息
2. 📋 复制：一键打包成带来源标注的文本
3. 💬 继续：粘到新对话，AI 秒懂上下文

### Feature Highlights
- 手术刀精度：逐条选，而非整段搬
- 长对话全量：虚拟滚动平台也能全部选到
- 时间胶囊头：自动标注来源模型、日期、条数
- 9 大平台支持
- AI 整理加持（需 DeepSeek API key）
- 全本地隐私：不上传任何内容

### Supported Platforms（平台 Logo 墙）
Claude · ChatGPT · Gemini · Kimi · DeepSeek · 豆包 · 通义千问 · 智谱 GLM · MiniMax

### CTA Section
- 副文案：免费，无需注册，数据全在本地
- 按钮：「添加到 Chrome」

---

## 上线状态

- **v1.0.0**：2026-06-01 提交 Chrome Web Store 审核，审核中
- **v1.0.1**（待审核通过后提交）：安全修复包，包含 API key 泄露修复、postMessage nonce 校验

---

## 技术说明

- Chrome Extension Manifest V3，TypeScript + esbuild
- 适配器模式：每个平台一份配置对象，核心逻辑不变
- 虚拟滚动方案：scrollAndCollect（边滚边捕获）+ API 截获（DeepSeek）
- postMessage 通信：MAIN world ↔ content script，nonce 防伪造
- 数据全存 `chrome.storage.local`，不走任何服务器
- AI 整理调用 DeepSeek OpenAI 兼容接口（key 本地保存，max_tokens: 16000）
