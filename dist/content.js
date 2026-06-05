"use strict";(()=>{function Z(t,e){let s=t;for(let n=0;n<e;n++)s=s?.parentElement??null;return s}function X(){let t=Array.from(document.querySelectorAll('[data-testid="user-message"]'));if(t.length===0)return[];if(t.length===1)return t;for(let e=1;e<=12;e++){let s=t.map(r=>Z(r,e));if(s.some(r=>r===null))break;let n=new Set(s.map(r=>r.parentElement));if(n.size===1){let r=[...n][0];if(r&&r!==document.body)return Array.from(r.children).filter(o=>(o.textContent?.trim().length??0)>5)}}return t}var J={host:"claude.ai",sourceModelName:"Claude",messageSelector:'[data-testid="user-message"]',getMessages(){return X()},roleOf(t){return t.getAttribute("data-testid")==="user-message"||t.querySelector('[data-testid="user-message"]')?"user":"assistant"},textOf(t){let e=t.getAttribute("data-testid")==="user-message"?t:t.querySelector('[data-testid="user-message"]');if(e)return e.textContent?.trim()??"";let s=t.cloneNode(!0);return s.querySelectorAll('[role="group"], button, [data-testid*="action"], [aria-label*="actions"]').forEach(n=>n.remove()),s.textContent?.replace(/\s+/g," ").trim()??""},mountPoint(){return document.body},scrollContainer(){return document.querySelector('[class*="overflow-y-auto"]')??document.querySelector("main")??null},conversationTitle(){let t=document.title;return t&&t.replace(/\s*[–\-]\s*Claude.*$/i,"").trim()||null}},M=J;var A=t=>new Promise(e=>setTimeout(e,t)),k={host:"chatgpt.com",sourceModelName:"ChatGPT",messageSelector:"[data-message-author-role]",roleOf(t){return t.getAttribute("data-message-author-role")==="user"?"user":"assistant"},textOf(t){if(t.getAttribute("data-message-author-role")==="user")return t.querySelector(".whitespace-pre-wrap")?.textContent?.trim()??t.textContent?.trim()??"";let s=t.cloneNode(!0);return s.querySelectorAll('button, [role="group"], form, [class*="action"]').forEach(r=>r.remove()),(s.querySelector('.markdown, [class*="prose"], [class*="markdown"]')??s).textContent?.replace(/\s+/g," ").trim()??""},mountPoint(){return document.body},scrollContainer(){let t=document.querySelector("[data-message-author-role]");if(t){let e=t.parentElement;for(;e&&e!==document.body;){let{overflowY:s}=window.getComputedStyle(e);if(["auto","scroll"].includes(s)&&e.scrollHeight>e.clientHeight+10)return e;e=e.parentElement}}return document.querySelector("main")??null},conversationTitle(){let t=document.title;return t&&t.replace(/\s*[–\-]\s*ChatGPT.*$/i,"").trim()||null},async ensureAllLoaded(){let t=this.scrollContainer();if(!t)return;let e=n=>{t.scrollTop=n,t.dispatchEvent(new Event("scroll",{bubbles:!0}))};e(0),await A(700);let s=Math.max(t.clientHeight*.7,400);for(;t.scrollTop+t.clientHeight<t.scrollHeight-50;)e(t.scrollTop+s),await A(500);e(t.scrollHeight),await A(300)}},T={...k,host:"chat.openai.com"},L=k;var ee={host:"gemini.google.com",sourceModelName:"Gemini",messageSelector:"user-query, model-response",roleOf(t){let e=t.tagName.toLowerCase();return e==="user-query"||e.includes("user")?"user":"assistant"},textOf(t){let e=[".query-text",".response-content","p","span"];for(let s of e){let n=t.querySelector(s);if(n?.textContent?.trim())return n.textContent.trim()}return t.textContent?.trim()??""},mountPoint(){return document.body},scrollContainer(){return document.querySelector("chat-window")??document.querySelector("main")??null},conversationTitle(){let t=document.title;return t&&t.replace(/\s*[–\-]\s*Gemini.*$/i,"").trim()||null}},B=ee;function q(t){return t.filter(e=>!t.some(s=>s!==e&&s.contains(e)))}function m(t){let e=t.cloneNode(!0);return e.querySelectorAll('button, [role="button"], svg, [class*="action"], [class*="toolbar"], [class*="copy"], [class*="vote"], [class*="thumb"]').forEach(n=>n.remove()),(e.querySelector('[class*="markdown"], [class*="content"], [class*="prose"], [class*="text"]')??e).textContent?.replace(/\s+/g," ").trim()??""}function C(t){try{let e=window.getComputedStyle(t).backgroundColor;if(!e||e==="transparent"||e==="rgba(0, 0, 0, 0)")return!1;let s=e.match(/[\d.]+/g);if(!s||s.length<3)return!1;let[n,r,o,i]=s.map(Number);return!((i??1)<.1||n<20&&r<20&&o<20||Math.max(n,r,o)-Math.min(n,r,o)<8)}catch{return!1}}function te(t,e){let s=t;for(let n=0;n<e;n++)s=s?.parentElement??null;return s}function F(){let t=Array.from(document.querySelectorAll("div, p")).filter(e=>!C(e)||e.closest('textarea, input, [contenteditable="true"], form, header, nav, aside, button, [role="button"], [role="tooltip"], [role="menu"]')?!1:(e.textContent?.trim()??"").length>=10);return q(t)}function d(){let t=F();if(t.length===0)return[];for(let e=1;e<=15;e++){let s=t.map(r=>te(r,e));if(s.some(r=>r===null))break;let n=new Set(s.map(r=>r.parentElement));if(n.size===1){let r=[...n][0];if(r&&r!==document.body){let o=Array.from(r.children).filter(i=>(i.textContent?.trim().length??0)>5);if(o.length>0&&o.length<t.length){let i=o.flatMap(l=>{let c=Array.from(l.children).filter(a=>(a.textContent?.trim().length??0)>5);return c.length>=2?c:[l]});if(i.length>o.length)return i}return o}}}return t}var w=t=>new Promise(e=>setTimeout(e,t));async function P(t,e,s){let n=new Set,r=[],o=()=>{try{for(let a of t()){let u=m(a);if(u.length<3)continue;let S=a.getAttribute("data-observe-row")??a.getAttribute("data-message-id")??u.slice(0,80);n.has(S)||(n.add(S),r.push({role:e(a),text:u}))}}catch{}};if(!s)return o(),r;let i=s;i.scrollTop=0,s.dispatchEvent(new Event("scroll",{bubbles:!0})),await w(700),o();let l=Math.max(i.clientHeight*.75,400),c=-1;for(;i.scrollTop+=l,s.dispatchEvent(new Event("scroll",{bubbles:!0})),await w(350),o(),!(i.scrollTop===c||(c=i.scrollTop,i.scrollTop+i.clientHeight>=i.scrollHeight-30)););return i.scrollTop=i.scrollHeight,s.dispatchEvent(new Event("scroll",{bubbles:!0})),await w(300),o(),r}function g(t,e=5){let s=document.querySelector(t);return s?Array.from(s.children).filter(n=>(n.textContent?.trim().length??0)>e):[]}function b(...t){for(let e of t)try{let s=q(Array.from(document.querySelectorAll(e)).filter(n=>(n.textContent?.trim().length??0)>5));if(s.length>0)return s}catch{}return[]}function O(t){let e=t;for(let s=0;s<8&&!(!e||e===document.body);s++){let n=window.getComputedStyle(e);if(n.marginLeft==="auto"&&n.marginRight!=="auto"||n.alignSelf==="flex-end"||n.alignSelf==="self-end")return"user";if(n.alignSelf==="flex-start"||n.alignSelf==="self-start")return"assistant";let r=e.parentElement;if(r){let o=window.getComputedStyle(r);if(o.display==="flex"){if(o.justifyContent==="flex-end"||o.justifyContent==="end")return"user";if(o.flexDirection!=="column"&&o.flexDirection!=="column-reverse"&&(o.justifyContent==="flex-start"||o.justifyContent==="start"))return"assistant"}}e=e.parentElement}return null}function x(t){let e=((t.className??"")+" "+(t.getAttribute("data-role")??"")+" "+(t.getAttribute("data-author")??"")).toLowerCase();if(/\b(user|human|right|self|me|我|问|sent)\b/.test(e))return"user";if(/\b(assistant|bot|ai|left|answer|reply|response|答)\b/.test(e))return"assistant";let s=O(t);if(s)return s;if(C(t)&&(t.textContent?.trim().length??0)>5)return"user";let n=document.createTreeWalker(t,NodeFilter.SHOW_ELEMENT,null),r=n.nextNode();for(;r;){let o=((r.className??"")+" "+(r.getAttribute("data-role")??"")).toLowerCase();if(/\b(user|human|sent)\b/.test(o)||C(r)&&(r.textContent?.trim().length??0)>5)return"user";r=n.nextNode()}return"assistant"}var $={host:"kimi.com",sourceModelName:"Kimi",messageSelector:'[class*="message"]',getMessages(){let t=['[class*="chatList"]','[class*="chat-list"]','[class*="messageList"]','[class*="message-list"]','[class*="conversation-list"]'];for(let s of t){let n=g(s);if(n.length>0)return n}let e=b('[class*="message-item"]','[class*="chat-item"]','[class*="segment"]');return e.length>0?e:d()},roleOf:x,textOf:m,mountPoint:()=>document.body,scrollContainer:()=>document.querySelector('[class*="chat-list"], [class*="message-list"], [class*="chatList"], main')??null,conversationTitle:()=>document.title.replace(/\s*[-–|].*$/,"").trim()||null};function se(t){if(t.length===0)return null;let e=t[0];for(;e&&!t.every(s=>e.contains(s));)e=e.parentElement;return e}function N(){let t=Array.from(document.querySelectorAll(".ds-markdown"));if(t.length===0)return d();let e=se(t);if(!e||e===document.body)return d();let s=Array.from(e.children).filter(n=>(n.textContent?.trim().length??0)>0);if(s.length<t.length){let n=s.flatMap(r=>{let o=Array.from(r.children).filter(i=>(i.textContent?.trim().length??0)>0);return o.length>=2?o:[r]});n.length>s.length&&(s=n)}return s}var j={host:"deepseek.com",sourceModelName:"DeepSeek",messageSelector:'[class*="message"]',usesApiHistory:!0,getMessages:N,roleOf(t){if(t.classList.contains("ds-markdown")||t.querySelector(".ds-markdown"))return"assistant";let e=((t.className??"")+" "+(t.getAttribute("data-role")??"")).toLowerCase();return/\b(assistant|bot|ai)\b/.test(e)?"assistant":"user"},textOf:m,mountPoint:()=>document.body,scrollContainer(){let t=F()[0]??document.querySelector("main");if(!t)return document.querySelector("main")??null;let e=t.parentElement;for(;e&&e!==document.body;){let s=window.getComputedStyle(e);if((s.overflowY==="auto"||s.overflowY==="scroll")&&e.scrollHeight>e.clientHeight+20)return e;e=e.parentElement}return document.querySelector("main")??null},async collectMessages(){return P(N,t=>this.roleOf(t),this.scrollContainer())},conversationTitle:()=>document.title.replace(/\s*[-–|].*$/,"").trim()||null};function H(){let t=Array.from(document.querySelectorAll(".v_list_row[data-observe-row]")).filter(e=>(e.textContent?.trim().length??0)>0);return t.length>0?t:Array.from(document.querySelectorAll("[data-observe-row]")).filter(e=>(e.textContent?.trim().length??0)>0)}var D={host:"doubao.com",sourceModelName:"\u8C46\u5305",messageSelector:"[data-observe-row]",usesApiHistory:!0,getMessages:H,roleOf(t){if(t.querySelector(".bg-g-send-msg-bubble-bg")||t.closest(".justify-end")||t.querySelector(".justify-end"))return"user";if(t.querySelector('.markdown-body, [class*="md-box"]'))return"assistant";let e=O(t);return e||"assistant"},textOf(t){let e=t.cloneNode(!0);return e.querySelectorAll('button, [role="button"], svg, [class*="action"], [class*="toolbar"], [class*="copy"], [class*="vote"], [class*="thumb"]').forEach(n=>n.remove()),(e.querySelector('.markdown-body, [class*="md-box"], .whitespace-pre-wrap')??e).textContent?.replace(/\s+/g," ").trim()??""},mountPoint:()=>document.body,scrollContainer:()=>document.querySelector('main div[class*="v_list_scroller"]')??document.querySelector('main div[class*="scroll"]')??null,async collectMessages(){return P(H,t=>this.roleOf(t),this.scrollContainer())},conversationTitle:()=>document.title.replace(/\s*[-–|].*$/,"").trim()||null},R={host:"qianwen.com",sourceModelName:"\u901A\u4E49\u5343\u95EE",messageSelector:'[class*="message"]',getMessages(){let t=['[class*="chatItem"]','[class*="chat-item"]','[class*="conversation-list"]','[class*="dialog-list"]'];for(let s of t){let n=g(s);if(n.length>0)return n}let e=b('[class*="human-message"], [class*="ai-message"]','[class*="chatItem"]','[class*="chat-item"]','[class*="message-item"]','[class*="bubble-wrap"]','[class*="dialog-item"]');return e.length>0?e:d()},roleOf:x,textOf:m,mountPoint:()=>document.body,scrollContainer:()=>document.querySelector('[class*="chat-box"], [class*="content-wrap"], [class*="dialog-list"], main')??null,conversationTitle:()=>document.title.replace(/\s*[-–|].*$/,"").trim()||null},I={host:"bigmodel.cn",sourceModelName:"\u667A\u8C31 GLM",messageSelector:'[class*="message"]',getMessages(){let t=['[class*="chatList"]','[class*="chat-list"]','[class*="messageList"]','[class*="message-list"]'];for(let s of t){let n=g(s);if(n.length>0)return n}let e=b('[class*="chat-item"]','[class*="chatItem"]','[class*="message-item"]','[class*="human"], [class*="answer"]');return e.length>0?e:d()},roleOf:x,textOf:m,mountPoint:()=>document.body,scrollContainer:()=>document.querySelector('[class*="chat-wrap"], [class*="message-list"], [class*="chatList"], main')??null,conversationTitle:()=>document.title.replace(/\s*[-–|].*$/,"").trim()||null},z={host:"minimaxi.com",sourceModelName:"MiniMax",messageSelector:'[class*="message"]',getMessages(){let t=['[class*="chat-list"]','[class*="chatList"]','[class*="message-list"]','[class*="conversation-list"]'];for(let s of t){let n=g(s);if(n.length>0)return n}let e=b('[class*="user-message"], [class*="bot-message"]','[class*="chat-message"]','[class*="message-item"]','[class*="bubble"]','[data-role="user"], [data-role="assistant"]');return e.length>0?e:d()},roleOf:x,textOf:m,mountPoint:()=>document.body,scrollContainer:()=>document.querySelector('[class*="chat-wrap"], [class*="message-list"], [class*="chat-list"], main')??null,conversationTitle:()=>document.title.replace(/\s*[-–|].*$/,"").trim()||null};var ne=[M,L,T,B,$,j,D,R,I,z];function U(){let t=location.hostname;return ne.find(e=>t.includes(e.host))??null}var h="data-ic-injected",_="ic-cb-wrapper",y=class{constructor(e,s){this.selected=new Set;this.adapter=e,this.onChange=s;let n=null;this.observer=new MutationObserver(()=>{n&&clearTimeout(n),n=setTimeout(()=>this.injectAll(),300)}),this.observer.observe(document.body,{childList:!0,subtree:!0}),this.injectAll()}getNodes(){if(this.adapter.getMessages)try{return this.adapter.getMessages()}catch{}try{return Array.from(document.querySelectorAll(this.adapter.messageSelector))}catch{return[]}}injectAll(){this.getNodes().forEach(e=>{e.getAttribute(h)||this.inject(e)})}inject(e){e.setAttribute(h,"1");let s=document.createElement("label");s.className=_,s.title="\u9009\u4E2D\u6B64\u6761\u6D88\u606F";let n=document.createElement("input");n.type="checkbox",n.className="ic-checkbox",this.selected.has(e)&&(n.checked=!0),n.addEventListener("change",()=>{n.checked?this.selected.add(e):this.selected.delete(e),this.onChange(this.getSelected())}),s.appendChild(n),e.insertBefore(s,e.firstChild)}async selectAllUser(e){this.adapter.ensureAllLoaded&&(e?.("\u6B63\u5728\u52A0\u8F7D\u5168\u90E8\u6D88\u606F\u2026"),await this.adapter.ensureAllLoaded(),this.injectAll(),await new Promise(n=>setTimeout(n,100))),Array.from(document.querySelectorAll(`[${h}]`)).forEach(n=>{if(this.adapter.roleOf(n)==="user"){this.selected.add(n);let r=n.querySelector("input.ic-checkbox");r&&(r.checked=!0)}}),this.onChange(this.getSelected())}clearAll(){this.selected.clear(),document.querySelectorAll("input.ic-checkbox").forEach(e=>{e.checked=!1}),this.onChange([])}getSelected(){return Array.from(this.selected).filter(e=>document.contains(e))}destroy(){this.observer.disconnect(),document.querySelectorAll(`.${_}`).forEach(e=>e.remove()),document.querySelectorAll(`[${h}]`).forEach(e=>{e.removeAttribute(h)}),this.selected.clear()}};var re="ic-api-history",oe="ic-request-history",p=[],f=[];function G(t){window.addEventListener("message",e=>{if(e.origin!==window.location.origin)return;let s=e.data;if(s&&s.__ic===re&&s.__nonce===t&&Array.isArray(s.messages)){p=s.messages;let n=f;f=[],n.forEach(r=>r())}})}function W(){return p}function Y(t=800){return p.length>0?Promise.resolve(p):(window.postMessage({__ic:oe},window.location.origin),new Promise(e=>{let s=setTimeout(()=>{f=f.filter(r=>r!==n),e(p)},t),n=()=>{clearTimeout(s),e(p)};f.push(n)}))}var ie=`
/* \u2500\u2500 FAB \u2500\u2500 */
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

/* \u2500\u2500 Panel \u2500\u2500 */
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

/* \u6267\u884C\u64CD\u4F5C\u5217\uFF1A\u4E00\u952E\u590D\u5236\uFF08\u4E0A\uFF09+ AI\u6574\u7406\uFF08\u4E0B\uFF09 */
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

/* \u9009\u62E9\u64CD\u4F5C\u884C */
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
/* \u5168\u9009\u5DF2\u9009\u4E2D\u72B6\u6001 */
.ic-btn-sm.ic-all-selected { background: #FFE4F0; color: #EB4C89; font-weight: 600; }
.ic-btn-sm.ic-all-selected:hover { background: #FFCCE0; }

/* \u5C42\u7EA7\u8FC7\u6E21\u6807\u7B7E\uFF08\u4E24\u4FA7\u5206\u5272\u7EBF\uFF09 */
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

/* \u2500\u2500 tooltip\uFF08fixed \u5B9A\u4F4D\uFF0C\u6302\u5728 body\uFF0C\u4E0D\u53D7 panel overflow \u9650\u5236\uFF09\u2500\u2500 */
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

/* \u2500\u2500 \u6CE8\u5165\u5230\u5BF9\u8BDD\u9875\u7684\u590D\u9009\u6846 \u2014 !important \u9632\u9875\u9762 CSS \u8986\u76D6 \u2500\u2500 */
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

/* \u2500\u2500 \u6DF1\u8272\u6A21\u5F0F \u2500\u2500 */
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
`,E=class{constructor(e){this.selected=[];this.apiMode=!1;this.apiUserMsgs=[];this.onKeydown=e=>{e.altKey&&e.key.toLowerCase()==="c"&&(e.preventDefault(),this.togglePanel())};this.adapter=e,this.injector=new y(e,s=>{this.apiMode=!1,this.apiUserMsgs=[],this.selected=s,this.updateCount()}),this.injectStyles(),this.buildFAB(),this.buildTooltip(),this.buildPanel(),document.addEventListener("keydown",this.onKeydown)}injectStyles(){if(document.getElementById("ic-styles"))return;let e=document.createElement("style");e.id="ic-styles",e.textContent=ie,document.head.appendChild(e)}buildFAB(){this.fabWrapEl=document.createElement("div"),this.fabWrapEl.id="ic-fab-wrap",this.fabEl=document.createElement("button"),this.fabEl.id="ic-fab",this.fabEl.title="\u610F\u56FE\u80F6\u56CA\uFF08Alt+C\uFF09",this.fabEl.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="none">
        <g transform="translate(9, 9) rotate(270) translate(-9, -9)" fill="#FFFFFF" fill-opacity="0.9" fill-rule="nonzero">
          <path d="M16.4832917,1.51693642 C18.4244795,3.45895896 18.5134265,6.57821271 16.6860585,8.62770141 L16.4832917,8.84150715 L8.84022458,16.4847174 C6.85779609,18.4652404 3.65976339,18.5099535 1.62274163,16.585628 C-0.414280136,14.6613026 -0.551514471,11.4658431 1.3130242,9.3739524 L1.515791,9.16014667 L9.15747877,1.51693642 C11.1806215,-0.505645472 14.460149,-0.505645472 16.4832917,1.51693642 Z M6.03735282,6.54619911 L2.47031229,10.1160652 C1.03979975,11.5800954 1.01361043,13.9103008 2.4108571,15.4061135 C3.80810378,16.9019261 6.13464729,17.0343488 7.69259205,15.7067404 L7.88570329,15.5301782 L11.4513645,11.9603121 L6.03735282,6.54619911 Z M12.9728052,1.91420127 C11.971069,1.84307548 11.0029122,2.29096704 10.4085637,3.10047826 C10.1876409,3.40139601 10.2524851,3.82443473 10.5533972,4.04536168 C10.8543093,4.26628864 11.2773401,4.20144328 11.4982629,3.90052554 C11.8188416,3.46310073 12.341883,3.22134105 12.8827754,3.2605775 C13.4236678,3.29981395 13.9063439,3.6145286 14.1604393,4.0936404 C14.3451957,4.40310346 14.7402681,4.51315242 15.0584032,4.34377174 C15.3765384,4.17439106 15.5058037,3.7851756 15.3522116,3.45912014 C14.8787105,2.56813421 13.9793494,1.98419025 12.9728052,1.91420127 Z"/>
        </g>
      </svg>
    `,this.fabWrapEl.appendChild(this.fabEl),this.fabWrapEl.addEventListener("click",()=>this.togglePanel()),document.body.appendChild(this.fabWrapEl)}buildTooltip(){this.tooltipEl=document.createElement("div"),this.tooltipEl.id="ic-tooltip",document.body.appendChild(this.tooltipEl)}showTooltip(e,s){this.tooltipEl.textContent=s,this.tooltipEl.style.display="block";let n=e.getBoundingClientRect(),r=this.tooltipEl.offsetWidth,o=this.tooltipEl.offsetHeight;this.tooltipEl.style.left=`${n.left+n.width/2-r/2}px`,this.tooltipEl.style.top=`${n.top-o-6}px`}hideTooltip(){this.tooltipEl.style.display="none"}buildPanel(){this.panelEl=document.createElement("div"),this.panelEl.id="ic-panel";let e=document.createElement("div");e.className="ic-hd";let s=document.createElement("span");s.className="ic-title",s.textContent="\u{1F48A} \u610F\u56FE\u80F6\u56CA";let n=document.createElement("button");n.className="ic-hd-close",n.innerHTML="\u2715",n.title="\u5173\u95ED",n.addEventListener("click",()=>this.closePanel()),e.append(s,n);let r=document.createElement("div");r.className="ic-count-area",this.countNum=document.createElement("span"),this.countNum.className="ic-count-num",this.countNum.textContent="0",this.countSub=document.createElement("span"),this.countSub.className="ic-count-sub",this.countSub.textContent="\u6761\u6D88\u606F\u5DF2\u9009",r.append(this.countNum,this.countSub);let o=document.createElement("div");o.className="ic-body";let i=document.createElement("div");i.className="ic-row",this.selAllBtn=document.createElement("button"),this.selAllBtn.className="ic-btn-sm",this.selAllBtn.textContent="\u5168\u9009\u6211\u7684",this.selAllBtn.addEventListener("click",()=>this.handleSelectAll());let l=document.createElement("button");l.className="ic-btn-sm",l.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>\u6E05\u7A7A',l.addEventListener("click",()=>{this.injector.clearAll(),this.selAllBtn.classList.remove("ic-all-selected"),this.selAllBtn.textContent="\u5168\u9009\u6211\u7684"}),i.append(this.selAllBtn,l);let c=document.createElement("div");c.className="ic-section-label",c.textContent="\u5E26\u53BB\u53E6\u4E00\u4E2A AI";let a=document.createElement("div");a.className="ic-action-row",this.copyBtn=document.createElement("button"),this.copyBtn.className="ic-btn-copy",this.copyBtn.textContent="\u4E00\u952E\u590D\u5236",this.copyBtn.addEventListener("click",()=>this.handleCopy()),this.aiRewriteBtn=document.createElement("button"),this.aiRewriteBtn.className="ic-btn-ai",this.aiRewriteBtn.textContent="\u2728 AI \u6574\u7406",this.aiRewriteBtn.addEventListener("click",()=>this.handleEnhance()),this.aiRewriteBtn.addEventListener("mouseenter",()=>this.showTooltip(this.aiRewriteBtn,"\u7528 AI \u628A\u788E\u7247\u6D88\u606F\u6574\u7406\u6210\u81EA\u7136\u7684\u4E0A\u4E0B\u6587\u4EA4\u4EE3\uFF0C\u518D\u62FC\u4E0A\u80F6\u56CA\u5934\u590D\u5236")),this.aiRewriteBtn.addEventListener("mouseleave",()=>this.hideTooltip()),a.append(this.copyBtn,this.aiRewriteBtn),o.append(i,c,a),this.statusEl=document.createElement("div"),this.statusEl.className="ic-status";let u=document.createElement("div");u.className="ic-foot",u.append(this.statusEl),this.panelEl.append(e,r,o,u),document.body.appendChild(this.panelEl)}togglePanel(){let e=this.panelEl.classList.toggle("ic-open");this.fabWrapEl.classList.toggle("ic-active",e)}closePanel(){this.panelEl.classList.remove("ic-open"),this.fabWrapEl.classList.remove("ic-active")}effectiveCount(){return this.apiMode?this.apiUserMsgs.length:this.selected.length}updateCount(){let e=this.effectiveCount();this.countNum.textContent=String(e),this.countSub.textContent=e===0?"\u6761\u6D88\u606F\u5DF2\u9009":"\u6761 \xB7 \u70B9\u590D\u5236\u5E26\u8D70",e===0&&(this.selAllBtn.classList.remove("ic-all-selected"),this.selAllBtn.textContent="\u5168\u9009\u6211\u7684")}checkVisibleUserBoxes(){document.querySelectorAll("input.ic-checkbox").forEach(e=>{let s=e.closest("[data-ic-injected]");s&&this.adapter.roleOf(s)==="user"&&(e.checked=!0)})}markSelAllDone(){this.selAllBtn.classList.add("ic-all-selected"),this.selAllBtn.textContent="\u2713 \u5DF2\u5168\u9009"}async handleSelectAll(){this.selAllBtn.disabled=!0;try{if(this.adapter.usesApiHistory){let e=W();if(e.length===0&&(this.setStatus("\u8BFB\u53D6\u5B8C\u6574\u5BF9\u8BDD\u4E2D\u2026",""),e=await Y()),e.length>0){this.apiMode=!0,this.apiUserMsgs=e.filter(s=>s.role==="user"),this.markSelAllDone(),this.updateCount(),this.setStatus(`\u2713 \u5DF2\u53D6\u5168\u90E8 ${this.apiUserMsgs.length} \u6761`,"ok"),this.checkVisibleUserBoxes();return}}if(this.adapter.collectMessages){this.setStatus("\u6B63\u5728\u6536\u96C6\u5168\u90E8\u5BF9\u8BDD\uFF0C\u8BF7\u7A0D\u5019\u2026","");let e=await this.adapter.collectMessages();if(e.length>0){this.apiMode=!0,this.apiUserMsgs=e.filter(s=>s.role==="user"),this.markSelAllDone(),this.updateCount(),this.setStatus(`\u2713 \u5DF2\u6536\u96C6 ${this.apiUserMsgs.length} \u6761`,"ok"),this.checkVisibleUserBoxes();return}}await this.injector.selectAllUser(e=>this.setStatus(e,"")),this.markSelAllDone(),this.setStatus(this.adapter.usesApiHistory?"\u4EC5\u9009\u5230\u5F53\u524D\u53EF\u89C1\uFF0C\u5237\u65B0\u672C\u9875\u53EF\u53D6\u5168\u90E8":"","")}finally{this.selAllBtn.disabled=!1}}buildHeader(){let e=this.apiMode?this.apiUserMsgs.length:this.selected.filter(l=>this.adapter.roleOf(l)==="user").length,s=this.apiMode?this.apiUserMsgs.length:this.selected.length,n=new Date().toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}).replace(/\//g,"-"),r=this.adapter.conversationTitle?.(),o=r?`\u300A${r}\u300B`:"",i=e===s;return["\u3010\u4E0A\u4E0B\u6587\u4EA4\u63A5 \xB7 \u610F\u56FE\u80F6\u56CA\u3011",`\u6765\u6E90\uFF1A\u4E0E ${this.adapter.sourceModelName} \u7684\u4E00\u6BB5\u5BF9\u8BDD${o}\uFF08${n}\uFF09\uFF0C\u5E26\u8FC7\u6765 ${s} \u6761\u6D88\u606F`,i?"\u8BF4\u660E\uFF1A\u4EE5\u4E0B\u662F\u6211\uFF08\u7528\u6237\uFF09\u8BF4\u8FC7\u7684\u8BDD\uFF0C\u4EE3\u8868\u6211\u7684\u610F\u56FE\u4E0E\u9700\u6C42\uFF0C\u975E AI \u56DE\u590D\u3002\u8BF7\u57FA\u4E8E\u6B64\u7EE7\u7EED\u3002":`\u8BF4\u660E\uFF1A\u4EE5\u4E0B\u662F\u9009\u4E2D\u7684\u5BF9\u8BDD\u7247\u6BB5\uFF08${e} \u6761\u7528\u6237\u6D88\u606F\uFF0C${s-e} \u6761 AI \u56DE\u590D\uFF09\u3002\u8BF7\u57FA\u4E8E\u6B64\u7EE7\u7EED\u3002`,"\u2014\u2014\u2014"].join(`
`)}buildMessages(){let e=[];if(this.apiMode){for(let s of this.apiUserMsgs){let n=s.role==="user"?"\u6211":this.adapter.sourceModelName;s.text&&e.push(`${n}\uFF1A${s.text}`,"")}return e.join(`
`).trim()}for(let s of this.selected){let r=this.adapter.roleOf(s)==="user"?"\u6211":this.adapter.sourceModelName,o=this.adapter.textOf(s);o&&e.push(`${r}\uFF1A${o}`,"")}return e.join(`
`).trim()}buildOutputText(){return`${this.buildHeader()}

${this.buildMessages()}`}async handleCopy(){if(this.effectiveCount()===0){this.setStatus("\u8BF7\u5148\u52FE\u9009\u6D88\u606F","err");return}try{await navigator.clipboard.writeText(this.buildOutputText()),this.setStatus(`\u2713 \u5DF2\u590D\u5236 ${this.effectiveCount()} \u6761`,"ok")}catch{this.setStatus("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668\u6743\u9650","err")}}async handleEnhance(){if(this.effectiveCount()===0){this.setStatus("\u8BF7\u5148\u52FE\u9009\u6D88\u606F","err");return}let e=this.buildMessages();this.setStatus("AI \u6574\u7406\u4E2D\u2026",""),this.aiRewriteBtn.disabled=!0;try{let s=await chrome.runtime.sendMessage({type:"ENHANCE",text:e,mode:"enhance"});if(s.error)this.setStatus(s.error,"err");else if(s.text){let n=`${this.buildHeader()}

${s.text.trim()}`;await navigator.clipboard.writeText(n),this.setStatus("\u2713 AI \u6574\u7406\u7248\u5DF2\u590D\u5236","ok")}}catch{this.setStatus("\u901A\u4FE1\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u6269\u5C55","err")}finally{this.aiRewriteBtn.disabled=!1}}setStatus(e,s){this.statusEl.textContent=e,this.statusEl.className=`ic-status${s?" "+s:""}`,s==="ok"&&setTimeout(()=>{this.statusEl.textContent===e&&(this.statusEl.textContent="")},3e3)}destroy(){document.removeEventListener("keydown",this.onKeydown),this.injector.destroy(),this.fabWrapEl.remove(),this.panelEl.remove(),this.tooltipEl.remove(),document.getElementById("ic-styles")?.remove()}};var V=Math.random().toString(36).slice(2);document.documentElement.dataset.icNonce=V;G(V);var v=null;function Q(){let t=U();if(!t)return;let e=location.hostname.includes("claude")?1500:800;setTimeout(()=>{v?.destroy(),v=new E(t)},e)}Q();var K=location.href;new MutationObserver(()=>{location.href!==K&&(K=location.href,v?.destroy(),v=null,Q())}).observe(document,{subtree:!0,childList:!0});})();
