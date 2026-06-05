export interface Adapter {
  host: string;
  sourceModelName: string;
  messageSelector: string;
  /** 自定义获取消息节点列表（优先于 messageSelector） */
  getMessages?(): Element[];
  roleOf(node: Element): 'user' | 'assistant';
  textOf(node: Element): string;
  mountPoint(): Element;
  scrollContainer(): Element | null;
  conversationTitle?(): string | null;
  /**
   * 虚拟滚动站点（ChatGPT）实现此方法：
   * 滚动整个对话让所有消息渲染到 DOM，供"全选我的"使用。
   */
  ensureAllLoaded?(): Promise<void>;
  /**
   * 站点会卸载视口外消息（DeepSeek），DOM 拿不到全部。
   * 标记 true 时，"全选我的"改用接口截获的完整消息（historyStore）。
   */
  usesApiHistory?: boolean;
  /**
   * 虚拟滚动站点：API 截获失败时的兜底——边滚动边捕获，每步立即读节点存内存。
   * 解决"滚完 DOM 只剩底部、顶部早已卸载"的问题。
   */
  collectMessages?(): Promise<Array<{ role: 'user' | 'assistant'; text: string }>>;
}
