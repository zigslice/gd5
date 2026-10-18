import { Component } from '../../../engine/index.js';
import { loadUi } from '../../../ui/index.js';

/**
 * Coding Agent boot / loading slot — also warms UI kit styles.
 */
export class AgentBootComponent extends Component {
  static styles = new URL('./AgentBootComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.state.data.message = 'Coding Agent starting…';
  }

  async componentDidMount() {
    this.logger?.i('AgentBootComponent mounted');
    try {
      await loadUi();
      this.setData({ message: 'UI kit ready' });
    } catch (err) {
      this.setData({ message: `Boot warning: ${err?.message || err}` });
    }
  }

  render() {
    this.ensureShell(
      (ids) => ids.agentBootMsg,
      ({ div }) => {
        div({
          className: 'agent-boot',
          id: 'agentBootMsg',
          text: this.state.data.message,
        });
      }
    );
    const el = this.ids().agentBootMsg;
    if (el) el.textContent = this.state.data.message;
  }
}
