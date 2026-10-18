import { Component } from '../../../engine/index.js';
import { Button, loadUi } from '../../../ui/index.js';

/**
 * Top chrome — brand, run status, command palette / settings actions.
 */
export class AgentToolbarComponent extends Component {
  static styles = new URL('./AgentToolbarComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
    this.onOpenCommand = deps.onOpenCommand;
    this.onOpenSettings = deps.onOpenSettings;
    this.onRunDemo = deps.onRunDemo;
  }

  async mount(host, params = {}) {
    await loadUi();
    return super.mount(host, params);
  }

  render() {
    const snap = this.store?.getState?.() || {};
    const status = snap.running ? 'running' : snap.status || 'idle';

    this.ensureShell(
      (ids) => ids.agentToolbar,
      ({ div, span }) => {
        div(
          { id: 'agentToolbar', className: 'agent-toolbar' },
          div(
            { className: 'agent-toolbar__brand' },
            span({ className: 'agent-toolbar__mark', text: '◈' }),
            span({ className: 'agent-toolbar__title', text: 'gd5 Coding Agent' }),
            span({
              className: `agent-toolbar__pill agent-toolbar__pill--${status}`,
              text: status,
            })
          ),
          div(
            { id: 'agentToolbarActions', className: 'agent-toolbar__actions' }
          )
        );
      }
    );

    const actions = this.ids().agentToolbarActions;
    if (!actions) return;
    actions.textContent = '';

    const demo = Button({
      type: 'primary',
      text: snap.running ? 'Running…' : 'Run demo task',
      disabled: !!snap.running,
      onClick: () => this.onRunDemo?.(),
    });
    const cmd = Button({
      type: 'default',
      text: '⌘K Commands',
      onClick: () => this.onOpenCommand?.(),
    });
    const settings = Button({
      type: 'default',
      text: 'Settings',
      onClick: () => this.onOpenSettings?.(),
    });
    actions.appendChild(demo.dom());
    actions.appendChild(cmd.dom());
    actions.appendChild(settings.dom());
  }
}
