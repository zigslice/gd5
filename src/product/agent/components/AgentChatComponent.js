import { Component } from '../../../engine/index.js';
import { Button, ChatBubble, loadUi } from '../../../ui/index.js';
import { runUserPrompt } from '../lib/agentRunner.js';

/**
 * Agent chat — message list + composer (drives simulated agent turns).
 */
export class AgentChatComponent extends Component {
  static styles = new URL('./AgentChatComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
    this.state.data.draft = '';
  }

  async mount(host, params = {}) {
    await loadUi();
    return super.mount(host, params);
  }

  async _send() {
    const text = String(this.state.data.draft || '').trim();
    if (!text || this.store.getState().running) return;
    this.state.data.draft = '';
    const input = this.ids().agentChatInput;
    if (input) input.value = '';
    this.refresh();
    await runUserPrompt(this.store, text);
  }

  render() {
    const snap = this.store?.getState?.() || {};

    this.ensureShell(
      (ids) => ids.agentChat,
      ({ div, textarea }) => {
        div(
          { id: 'agentChat', className: 'agent-chat' },
          div({ className: 'agent-chat__title', text: 'Agent' }),
          div({ id: 'agentChatList', className: 'agent-chat__list' }),
          div(
            { className: 'agent-chat__composer' },
            textarea({
              id: 'agentChatInput',
              className: 'agent-chat__input',
              attrs: {
                rows: '3',
                placeholder: '描述要改的代码… 例如：给 greet 加一个 shout 大写版本',
              },
              onInput: (e) => {
                this.state.data.draft = e.target.value;
              },
              onKeyDown: (e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void this._send();
                }
              },
            }),
            div({ id: 'agentChatSend', className: 'agent-chat__send' })
          )
        );
      }
    );

    const list = this.ids().agentChatList;
    const sendHost = this.ids().agentChatSend;
    const input = this.ids().agentChatInput;
    if (input && input.value !== this.state.data.draft) {
      input.value = this.state.data.draft;
    }
    if (!list || !sendHost) return;

    list.textContent = '';
    for (const msg of snap.messages || []) {
      const side = msg.role === 'user' ? 'mine' : 'theirs';
      let text = msg.text;
      if (msg.kind === 'tool' && msg.meta?.tool) {
        text = `⚙ ${msg.meta.tool}${msg.meta.path ? ` · ${msg.meta.path}` : ''}\n${msg.text}`;
      }
      const bubble = ChatBubble({
        side,
        author: msg.role === 'user' ? 'You' : 'Agent',
        showAvatar: true,
        text,
      });
      list.appendChild(bubble.dom());
    }
    list.scrollTop = list.scrollHeight;

    sendHost.textContent = '';
    const btn = Button({
      type: 'primary',
      text: snap.running ? 'Agent working…' : 'Send ⌘↵',
      disabled: !!snap.running,
      onClick: () => void this._send(),
    });
    sendHost.appendChild(btn.dom());
  }
}
