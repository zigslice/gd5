import { Component } from '../../../engine/index.js';
import { Button, loadUi, setTheme, getTheme } from '../../../ui/index.js';

/**
 * Settings modal page — theme + product notes; close via goBack().
 */
export class AgentSettingsComponent extends Component {
  static styles = new URL('./AgentSettingsComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.state.data.theme = 'orange';
  }

  async componentDidMount() {
    await loadUi();
    this.setData({ theme: getTheme?.() || 'orange' });
  }

  render() {
    const theme = this.state.data.theme || 'orange';

    this.ensureShell(
      (ids) => ids.agentSettings,
      ({ div, h2, p }) => {
        div(
          { id: 'agentSettings', className: 'agent-settings' },
          div(
            { className: 'agent-settings__card' },
            h2({ text: 'Agent settings' }),
            p({
              className: 'agent-settings__hint',
              text: 'Coding Agent product demo — engine pages + UI kit embeds (Tree, CodeBlock, Diff, TodoList, Chat, CommandPalette).',
            }),
            div({ id: 'agentSettingsThemes', className: 'agent-settings__row' }),
            div({ id: 'agentSettingsActions', className: 'agent-settings__row' })
          )
        );
      }
    );

    const themes = this.ids().agentSettingsThemes;
    const actions = this.ids().agentSettingsActions;
    if (!themes || !actions) return;

    themes.textContent = '';
    for (const name of ['orange', 'blue', 'green']) {
      const btn = Button({
        type: name === theme ? 'primary' : 'default',
        text: name,
        onClick: () => {
          setTheme(name);
          this.setData({ theme: name });
        },
      });
      themes.appendChild(btn.dom());
    }

    actions.textContent = '';
    const close = Button({
      type: 'primary',
      text: 'Close',
      onClick: () => this.navigator?.goBack?.(),
    });
    actions.appendChild(close.dom());
  }
}
