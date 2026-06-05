import type { Adapter } from './adapters/types';

export type SelectionChangeHandler = (selected: Element[]) => void;

const INJECTED_ATTR = 'data-ic-injected';
const WRAPPER_CLASS = 'ic-cb-wrapper';

export class CheckboxInjector {
  private adapter: Adapter;
  private selected = new Set<Element>();
  private onChange: SelectionChangeHandler;
  private observer: MutationObserver;

  constructor(adapter: Adapter, onChange: SelectionChangeHandler) {
    this.adapter = adapter;
    this.onChange = onChange;

    let timer: ReturnType<typeof setTimeout> | null = null;
    this.observer = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => this.injectAll(), 300);
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
    this.injectAll();
  }

  private getNodes(): Element[] {
    if (this.adapter.getMessages) {
      try { return this.adapter.getMessages(); } catch { /* fall through */ }
    }
    try {
      return Array.from(document.querySelectorAll(this.adapter.messageSelector));
    } catch {
      return [];
    }
  }

  injectAll(): void {
    this.getNodes().forEach(node => {
      if (!node.getAttribute(INJECTED_ATTR)) this.inject(node);
    });
  }

  private inject(node: Element): void {
    node.setAttribute(INJECTED_ATTR, '1');

    const wrapper = document.createElement('label');
    wrapper.className = WRAPPER_CLASS;
    wrapper.title = '选中此条消息';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'ic-checkbox';
    if (this.selected.has(node)) checkbox.checked = true;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) this.selected.add(node);
      else this.selected.delete(node);
      this.onChange(this.getSelected());
    });

    wrapper.appendChild(checkbox);
    node.insertBefore(wrapper, node.firstChild);
  }

  /**
   * 全选用户消息。
   * 以 data-ic-injected 节点为权威来源（而非重调 getMessages()），
   * 避免因 getMessages() 多次调用结果不一致导致漏选。
   */
  async selectAllUser(onStatus?: (msg: string) => void): Promise<void> {
    if (this.adapter.ensureAllLoaded) {
      onStatus?.('正在加载全部消息…');
      await this.adapter.ensureAllLoaded();
      this.injectAll();
      await new Promise(r => setTimeout(r, 100));
    }

    // 从所有已注入节点中选用户消息，而非重调 getMessages()
    const injectedNodes = Array.from(
      document.querySelectorAll<Element>(`[${INJECTED_ATTR}]`)
    );
    injectedNodes.forEach(node => {
      if (this.adapter.roleOf(node) === 'user') {
        this.selected.add(node);
        const cb = node.querySelector<HTMLInputElement>('input.ic-checkbox');
        if (cb) cb.checked = true;
      }
    });
    this.onChange(this.getSelected());
  }

  clearAll(): void {
    this.selected.clear();
    document.querySelectorAll<HTMLInputElement>('input.ic-checkbox')
      .forEach(cb => { cb.checked = false; });
    this.onChange([]);
  }

  getSelected(): Element[] {
    // 只保留仍在 DOM 中的节点
    return Array.from(this.selected).filter(el => document.contains(el));
  }

  destroy(): void {
    this.observer.disconnect();
    document.querySelectorAll(`.${WRAPPER_CLASS}`).forEach(el => el.remove());
    document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach(el => {
      el.removeAttribute(INJECTED_ATTR);
    });
    this.selected.clear();
  }
}
