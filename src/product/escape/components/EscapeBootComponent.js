import { Component } from '../../../engine/index.js';
import { loadUi } from '../../../ui/index.js';

/**
 * Escape Room boot / loading slot — warms UI kit styles.
 */
export class EscapeBootComponent extends Component {
  static styles = new URL('./EscapeBootComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.state.data.message = 'Midnight Archive 启动中…';
  }

  async componentDidMount() {
    this.logger?.i('EscapeBootComponent mounted');
    try {
      await loadUi();
      this.setData({ message: '进入档案室…' });
    } catch (err) {
      this.setData({ message: `Boot warning: ${err?.message || err}` });
    }
  }

  render() {
    this.ensureShell(
      (ids) => ids.escapeBootMsg,
      ({ div }) => {
        div({
          className: 'escape-boot',
          id: 'escapeBootMsg',
          text: this.state.data.message,
        });
      }
    );
    const el = this.ids().escapeBootMsg;
    if (el) el.textContent = this.state.data.message;
  }
}
