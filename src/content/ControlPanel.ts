import type { Adapter } from './adapters/types';
import { CheckboxInjector } from './CheckboxInjector';
import { getApiHistory, requestApiHistory, type ApiMsg } from './historyStore';

const STYLES = `
/* ── FAB ── */
#ic-fab-wrap {
  position: fixed; top: 50%; right: 0;
  display: flex; align-items: center;
  padding: 3px 21px 3px 3px; /* right: 3px visible + 18px off-screen */
  border-radius: 999px;
  background: #fff;
  box-shadow: -2px 2px 14px rgba(0,0,0,0.1);
  z-index: 2147483646;
  transform: translateX(18px) translateY(-50%);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
  cursor: pointer; user-select: none;
}
#ic-fab-wrap:hover,
#ic-fab-wrap.ic-active {
  transform: translateX(0) translateY(-50%);
  box-shadow: -3px 3px 20px rgba(0,0,0,0.13);
}
#ic-fab {
  width: 30px; height: 30px; border-radius: 50%;
  background: #FFBDD6; color: white; border: none;
  cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
#ic-fab-wrap:hover #ic-fab,
#ic-fab-wrap.ic-active #ic-fab { background: #EB4C89; }

/* ── Panel ── */
#ic-panel {
  position: fixed; top: 50%; right: 8px; width: 292px;
  transform: translateY(-50%);
  background: #fff; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  z-index: 2147483645; overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px; color: #18181B;
  display: none;
  animation: ic-up 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
#ic-panel.ic-open { display: block; }
@keyframes ic-up {
  from { opacity: 0; transform: translateY(calc(-50% + 10px)) scale(0.96); }
  to   { opacity: 1; transform: translateY(-50%) scale(1); }
}

/* header */
.ic-hd {
  padding: 13px 14px 11px;
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid #F4F4F5;
}
.ic-title { font-weight: 700; font-size: 14px; flex: 1; }
.ic-hd-close {
  width: 26px; height: 26px; border-radius: 6px;
  background: none; border: none; cursor: pointer;
  color: #A1A1AA; font-size: 15px; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.ic-hd-close:hover { background: #F4F4F5; color: #18181B; }

/* count */
.ic-count-area {
  padding: 14px 16px 6px;
  display: flex; align-items: baseline; gap: 5px;
}
.ic-count-num { font-size: 30px; font-weight: 700; color: #EB4C89; line-height: 1; }
.ic-count-sub { font-size: 12px; color: #71717A; }

/* body */
.ic-body { padding: 8px 14px 14px; display: flex; flex-direction: column; gap: 8px; }

/* 执行操作列：一键复制（上）+ AI整理（下） */
.ic-action-row { display: flex; flex-direction: column; gap: 10px; }

.ic-btn-copy {
  width: 100%; padding: 11px 0; border-radius: 10px;
  background: #EB4C89; color: white; border: none;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.ic-btn-copy:hover:not(:disabled) { background: #C2185B; }
.ic-btn-copy:active:not(:disabled) { transform: scale(0.98); }
.ic-btn-copy:disabled { opacity: 0.4; cursor: not-allowed; }

.ic-btn-ai {
  width: 100%; padding: 9px 0; border-radius: 10px;
  background: #F4F4F5; color: #3F3F46; border: none;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ic-btn-ai:hover:not(:disabled) { background: #FFE4F0; color: #EB4C89; }
.ic-btn-ai:disabled { opacity: 0.4; cursor: not-allowed; }

/* 选择操作行 */
.ic-row { display: flex; gap: 6px; }
.ic-btn-sm {
  flex: 1; padding: 8px 0; border-radius: 8px;
  background: #F4F4F5; color: #3F3F46; border: none;
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: background 0.15s, color 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.ic-btn-sm:hover:not(:disabled) { background: #E4E4E7; }
.ic-btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
/* 全选已选中状态 */
.ic-btn-sm.ic-all-selected { background: #FFE4F0; color: #EB4C89; font-weight: 600; }
.ic-btn-sm.ic-all-selected:hover { background: #FFCCE0; }

/* 层级过渡标签（两侧分割线） */
.ic-section-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: #C4C4C8; letter-spacing: 0.3px; user-select: none;
  margin: 10px 0;
}
.ic-section-label::before,
.ic-section-label::after {
  content: ''; flex: 1; height: 1px; background: #EBEBEB;
}

/* footer */
.ic-foot {
  padding: 8px 14px;
  display: flex; align-items: center; gap: 8px;
}
.ic-status { flex: 1; font-size: 12px; color: #71717A; min-height: 16px; }
.ic-status.err { color: #EF4444; }
.ic-status.ok  { color: #EB4C89; }
.ic-settings-btn {
  width: 26px; height: 26px; border-radius: 6px;
  background: none; border: none; cursor: pointer;
  color: #A1A1AA; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s; flex-shrink: 0;
}
.ic-settings-btn:hover { background: #F4F4F5; color: #3F3F46; }

/* ── tooltip（fixed 定位，挂在 body，不受 panel overflow 限制）── */
#ic-tooltip {
  position: fixed;
  background: #18181B; color: #fff;
  padding: 6px 10px; border-radius: 6px;
  font-size: 11px; line-height: 1.5; white-space: normal; max-width: 200px; text-align: center;
  pointer-events: none; display: none;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}

/* ── 注入到对话页的复选框 — !important 防页面 CSS 覆盖 ── */
.ic-cb-wrapper {
  display: inline-flex !important; align-items: flex-start !important;
  padding-top: 2px !important; margin-right: 8px !important;
  flex-shrink: 0 !important; vertical-align: top !important;
  visibility: visible !important; opacity: 1 !important;
  overflow: visible !important; clip: auto !important;
  position: relative !important; z-index: 9999 !important;
  min-width: 20px !important; min-height: 20px !important;
}
.ic-checkbox {
  display: block !important;
  width: 15px !important; height: 15px !important; cursor: pointer !important;
  accent-color: #EB4C89 !important; margin: 0 !important;
  flex-shrink: 0 !important; visibility: visible !important;
  opacity: 1 !important; appearance: auto !important;
  -webkit-appearance: checkbox !important;
}

/* ── 深色模式 ── */
@media (prefers-color-scheme: dark) {
  #ic-fab-wrap { background: #27272A; box-shadow: -3px 2px 18px rgba(0,0,0,0.35); }
  #ic-fab { background: #9D3A5C; color: white; }
  #ic-panel { background: #18181B; color: #FAFAFA; }
  .ic-hd, .ic-foot { border-color: #27272A; }
  .ic-hd-close:hover, .ic-settings-btn:hover { background: #27272A; color: #D4D4D8; }
  .ic-btn-sm, .ic-btn-ai { background: #27272A; color: #D4D4D8; }
  .ic-btn-sm:hover:not(:disabled) { background: #3F3F46; }
  .ic-btn-ai:hover:not(:disabled) { background: #3D0B22; color: #F9A8D4; }
  .ic-count-sub, .ic-status { color: #71717A; }
}
`;

export class ControlPanel {
  private adapter: Adapter;
  private injector: CheckboxInjector;
  private panelEl!: HTMLDivElement;
  private fabWrapEl!: HTMLDivElement;
  private fabEl!: HTMLButtonElement;
  private tooltipEl!: HTMLDivElement;
  private countNum!: HTMLSpanElement;
  private countSub!: HTMLSpanElement;
  private copyBtn!: HTMLButtonElement;
  private statusEl!: HTMLDivElement;
  private aiRewriteBtn!: HTMLButtonElement;
  private selAllBtn!: HTMLButtonElement;
  private selected: Element[] = [];
  // API 模式：DeepSeek 等虚拟滚动站点，"全选我的"直接用接口截获的完整消息
  private apiMode = false;
  private apiUserMsgs: ApiMsg[] = [];
  private readonly onKeydown = (e: KeyboardEvent) => {
    if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      this.togglePanel();
    }
  };

  constructor(adapter: Adapter) {
    this.adapter = adapter;
    this.injector = new CheckboxInjector(adapter, selected => {
      // 用户手动勾选 → 退出 API 全选模式，改用 DOM 选择
      this.apiMode = false;
      this.apiUserMsgs = [];
      this.selected = selected;
      this.updateCount();
    });
    this.injectStyles();
    this.buildFAB();
    this.buildTooltip();
    this.buildPanel();
    document.addEventListener('keydown', this.onKeydown);
  }

  private injectStyles(): void {
    if (document.getElementById('ic-styles')) return;
    const s = document.createElement('style');
    s.id = 'ic-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  private buildFAB(): void {
    this.fabWrapEl = document.createElement('div');
    this.fabWrapEl.id = 'ic-fab-wrap';

    this.fabEl = document.createElement('button');
    this.fabEl.id = 'ic-fab';
    this.fabEl.title = '意图胶囊（Alt+C）';
    this.fabEl.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="none">
        <g transform="translate(9, 9) rotate(270) translate(-9, -9)" fill="#FFFFFF" fill-opacity="0.9" fill-rule="nonzero">
          <path d="M16.4832917,1.51693642 C18.4244795,3.45895896 18.5134265,6.57821271 16.6860585,8.62770141 L16.4832917,8.84150715 L8.84022458,16.4847174 C6.85779609,18.4652404 3.65976339,18.5099535 1.62274163,16.585628 C-0.414280136,14.6613026 -0.551514471,11.4658431 1.3130242,9.3739524 L1.515791,9.16014667 L9.15747877,1.51693642 C11.1806215,-0.505645472 14.460149,-0.505645472 16.4832917,1.51693642 Z M6.03735282,6.54619911 L2.47031229,10.1160652 C1.03979975,11.5800954 1.01361043,13.9103008 2.4108571,15.4061135 C3.80810378,16.9019261 6.13464729,17.0343488 7.69259205,15.7067404 L7.88570329,15.5301782 L11.4513645,11.9603121 L6.03735282,6.54619911 Z M12.9728052,1.91420127 C11.971069,1.84307548 11.0029122,2.29096704 10.4085637,3.10047826 C10.1876409,3.40139601 10.2524851,3.82443473 10.5533972,4.04536168 C10.8543093,4.26628864 11.2773401,4.20144328 11.4982629,3.90052554 C11.8188416,3.46310073 12.341883,3.22134105 12.8827754,3.2605775 C13.4236678,3.29981395 13.9063439,3.6145286 14.1604393,4.0936404 C14.3451957,4.40310346 14.7402681,4.51315242 15.0584032,4.34377174 C15.3765384,4.17439106 15.5058037,3.7851756 15.3522116,3.45912014 C14.8787105,2.56813421 13.9793494,1.98419025 12.9728052,1.91420127 Z"/>
        </g>
      </svg>
    `;

    this.fabWrapEl.appendChild(this.fabEl);
    this.fabWrapEl.addEventListener('click', () => this.togglePanel());
    document.body.appendChild(this.fabWrapEl);
  }

  private buildTooltip(): void {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.id = 'ic-tooltip';
    document.body.appendChild(this.tooltipEl);
  }

  private showTooltip(anchor: HTMLElement, text: string): void {
    this.tooltipEl.textContent = text;
    this.tooltipEl.style.display = 'block';
    const rect = anchor.getBoundingClientRect();
    const tw = this.tooltipEl.offsetWidth;
    const th = this.tooltipEl.offsetHeight;
    this.tooltipEl.style.left = `${rect.left + rect.width / 2 - tw / 2}px`;
    this.tooltipEl.style.top = `${rect.top - th - 6}px`;
  }

  private hideTooltip(): void {
    this.tooltipEl.style.display = 'none';
  }

  private buildPanel(): void {
    this.panelEl = document.createElement('div');
    this.panelEl.id = 'ic-panel';

    // ── Header ──
    const hd = document.createElement('div');
    hd.className = 'ic-hd';
    const title = document.createElement('span');
    title.className = 'ic-title';
    title.textContent = '💊 意图胶囊';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ic-hd-close';
    closeBtn.innerHTML = '✕';
    closeBtn.title = '关闭';
    closeBtn.addEventListener('click', () => this.closePanel());
    hd.append(title, closeBtn);

    // ── Count ──
    const countArea = document.createElement('div');
    countArea.className = 'ic-count-area';
    this.countNum = document.createElement('span');
    this.countNum.className = 'ic-count-num';
    this.countNum.textContent = '0';
    this.countSub = document.createElement('span');
    this.countSub.className = 'ic-count-sub';
    this.countSub.textContent = '条消息已选';
    countArea.append(this.countNum, this.countSub);

    // ── Body ──
    const body = document.createElement('div');
    body.className = 'ic-body';

    // 选择操作行：全选 + 清空
    const row1 = document.createElement('div');
    row1.className = 'ic-row';
    this.selAllBtn = document.createElement('button');
    this.selAllBtn.className = 'ic-btn-sm';
    this.selAllBtn.textContent = '全选我的';
    this.selAllBtn.addEventListener('click', () => this.handleSelectAll());
    const clearBtn = document.createElement('button');
    clearBtn.className = 'ic-btn-sm';
    clearBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>清空`;
    clearBtn.addEventListener('click', () => {
      this.injector.clearAll();
      this.selAllBtn.classList.remove('ic-all-selected');
      this.selAllBtn.textContent = '全选我的';
    });
    row1.append(this.selAllBtn, clearBtn);

    // 层级过渡标签
    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'ic-section-label';
    sectionLabel.textContent = '带去另一个 AI';

    // 执行操作行：一键复制 + AI整理
    const actionRow = document.createElement('div');
    actionRow.className = 'ic-action-row';

    this.copyBtn = document.createElement('button');
    this.copyBtn.className = 'ic-btn-copy';
    this.copyBtn.textContent = '一键复制';
    this.copyBtn.addEventListener('click', () => this.handleCopy());

    this.aiRewriteBtn = document.createElement('button');
    this.aiRewriteBtn.className = 'ic-btn-ai';
    this.aiRewriteBtn.textContent = '✨ AI 整理';
    this.aiRewriteBtn.addEventListener('click', () => this.handleEnhance());
    this.aiRewriteBtn.addEventListener('mouseenter', () =>
      this.showTooltip(this.aiRewriteBtn, '用 AI 把碎片消息整理成自然的上下文交代，再拼上胶囊头复制'),
    );
    this.aiRewriteBtn.addEventListener('mouseleave', () => this.hideTooltip());

    actionRow.append(this.copyBtn, this.aiRewriteBtn);

    body.append(row1, sectionLabel, actionRow);

    // ── Footer ──
    this.statusEl = document.createElement('div');
    this.statusEl.className = 'ic-status';
    const foot = document.createElement('div');
    foot.className = 'ic-foot';
    foot.append(this.statusEl);

    this.panelEl.append(hd, countArea, body, foot);
    document.body.appendChild(this.panelEl);
  }

  private togglePanel(): void {
    const isOpen = this.panelEl.classList.toggle('ic-open');
    this.fabWrapEl.classList.toggle('ic-active', isOpen);
  }

  private closePanel(): void {
    this.panelEl.classList.remove('ic-open');
    this.fabWrapEl.classList.remove('ic-active');
  }

  /** 当前选中条数（API 模式取接口消息，否则取 DOM 选择） */
  private effectiveCount(): number {
    return this.apiMode ? this.apiUserMsgs.length : this.selected.length;
  }

  private updateCount(): void {
    const n = this.effectiveCount();
    this.countNum.textContent = String(n);
    this.countSub.textContent = n === 0 ? '条消息已选' : `条 · 点复制带走`;
    if (n === 0) {
      this.selAllBtn.classList.remove('ic-all-selected');
      this.selAllBtn.textContent = '全选我的';
    }
  }

  /** 把当前 DOM 里可见的用户消息复选框打勾（apiMode 下纯视觉反馈） */
  private checkVisibleUserBoxes(): void {
    document.querySelectorAll<HTMLInputElement>('input.ic-checkbox').forEach(cb => {
      const node = cb.closest('[data-ic-injected]');
      if (node && this.adapter.roleOf(node) === 'user') cb.checked = true;
    });
  }

  private markSelAllDone(): void {
    this.selAllBtn.classList.add('ic-all-selected');
    this.selAllBtn.textContent = '✓ 已全选';
  }

  /** 全选我的：① API 截获 → ② 边滚边捕获 → ③ DOM 兜底 */
  private async handleSelectAll(): Promise<void> {
    this.selAllBtn.disabled = true;
    try {
      if (this.adapter.usesApiHistory) {
        // ① 接口截获（DeepSeek/豆包网页发出的历史请求）
        let history = getApiHistory();
        if (history.length === 0) {
          this.setStatus('读取完整对话中…', '');
          history = await requestApiHistory();
        }
        if (history.length > 0) {
          this.apiMode = true;
          this.apiUserMsgs = history.filter(m => m.role === 'user');
          this.markSelAllDone();
          this.updateCount();
          this.setStatus(`✓ 已取全部 ${this.apiUserMsgs.length} 条`, 'ok');
          this.checkVisibleUserBoxes();
          return;
        }
      }

      // ② 边滚边捕获：每步立即读节点存内存，节点被虚拟列表卸载也没关系
      if (this.adapter.collectMessages) {
        this.setStatus('正在收集全部对话，请稍候…', '');
        const msgs = await this.adapter.collectMessages();
        if (msgs.length > 0) {
          this.apiMode = true;
          this.apiUserMsgs = msgs.filter(m => m.role === 'user') as ApiMsg[];
          this.markSelAllDone();
          this.updateCount();
          this.setStatus(`✓ 已收集 ${this.apiUserMsgs.length} 条`, 'ok');
          // 把当前 DOM 里可见的用户消息复选框勾上（纯视觉，apiMode 数据不依赖这个）
          this.checkVisibleUserBoxes();
          return;
        }
      }

      // ③ DOM 兜底（仅可见）
      await this.injector.selectAllUser(msg => this.setStatus(msg, ''));
      this.markSelAllDone();
      this.setStatus(this.adapter.usesApiHistory ? '仅选到当前可见，刷新本页可取全部' : '', '');
    } finally {
      this.selAllBtn.disabled = false;
    }
  }

  /** 生成时间胶囊头 */
  private buildHeader(): string {
    const userCount = this.apiMode
      ? this.apiUserMsgs.length
      : this.selected.filter(n => this.adapter.roleOf(n) === 'user').length;
    const total = this.apiMode ? this.apiUserMsgs.length : this.selected.length;
    const date = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).replace(/\//g, '-');
    const title = this.adapter.conversationTitle?.();
    const titlePart = title ? `《${title}》` : '';
    const userOnly = userCount === total;
    return [
      `【上下文交接 · 意图胶囊】`,
      `来源：与 ${this.adapter.sourceModelName} 的一段对话${titlePart}（${date}），带过来 ${total} 条消息`,
      userOnly
        ? `说明：以下是我（用户）说过的话，代表我的意图与需求，非 AI 回复。请基于此继续。`
        : `说明：以下是选中的对话片段（${userCount} 条用户消息，${total - userCount} 条 AI 回复）。请基于此继续。`,
      `———`,
    ].join('\n');
  }

  /** 生成消息正文（不含胶囊头） */
  private buildMessages(): string {
    const lines: string[] = [];
    if (this.apiMode) {
      // API 模式：直接用接口截获的完整消息
      for (const m of this.apiUserMsgs) {
        const label = m.role === 'user' ? '我' : this.adapter.sourceModelName;
        if (m.text) lines.push(`${label}：${m.text}`, ``);
      }
      return lines.join('\n').trim();
    }
    for (const node of this.selected) {
      const role = this.adapter.roleOf(node);
      const label = role === 'user' ? '我' : this.adapter.sourceModelName;
      const text = this.adapter.textOf(node);
      if (text) lines.push(`${label}：${text}`, ``);
    }
    return lines.join('\n').trim();
  }

  /** 完整输出 = 胶囊头 + 消息正文 */
  private buildOutputText(): string {
    return `${this.buildHeader()}\n\n${this.buildMessages()}`;
  }

  private async handleCopy(): Promise<void> {
    if (this.effectiveCount() === 0) {
      this.setStatus('请先勾选消息', 'err');
      return;
    }
    try {
      await navigator.clipboard.writeText(this.buildOutputText());
      this.setStatus(`✓ 已复制 ${this.effectiveCount()} 条`, 'ok');
    } catch {
      this.setStatus('复制失败，请检查浏览器权限', 'err');
    }
  }

  private async handleEnhance(): Promise<void> {
    if (this.effectiveCount() === 0) {
      this.setStatus('请先勾选消息', 'err');
      return;
    }
    const rawMessages = this.buildMessages();
    this.setStatus('AI 整理中…', '');
    this.aiRewriteBtn.disabled = true;

    try {
      const result: { text?: string; error?: string } = await chrome.runtime.sendMessage({
        type: 'ENHANCE', text: rawMessages, mode: 'enhance',
      });
      if (result.error) {
        this.setStatus(result.error, 'err');
      } else if (result.text) {
        const final = `${this.buildHeader()}\n\n${result.text.trim()}`;
        await navigator.clipboard.writeText(final);
        this.setStatus('✓ AI 整理版已复制', 'ok');
      }
    } catch {
      this.setStatus('通信失败，请重新加载扩展', 'err');
    } finally {
      this.aiRewriteBtn.disabled = false;
    }
  }

  private setStatus(msg: string, type: '' | 'err' | 'ok'): void {
    this.statusEl.textContent = msg;
    this.statusEl.className = `ic-status${type ? ' ' + type : ''}`;
    if (type === 'ok') {
      setTimeout(() => {
        if (this.statusEl.textContent === msg) this.statusEl.textContent = '';
      }, 3000);
    }
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeydown);
    this.injector.destroy();
    this.fabWrapEl.remove();
    this.panelEl.remove();
    this.tooltipEl.remove();
    document.getElementById('ic-styles')?.remove();
  }
}
