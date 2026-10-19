import { Component } from '../../../engine/index.js';
import { loadUi } from '../../../ui/index.js';

export class TideBootComponent extends Component {
  static styles = new URL('./TideBootComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.state.data.message = '潮前线 起航…';
  }

  async componentDidMount() {
    this.logger?.i('TideBootComponent mounted');
    try {
      await loadUi();
      this.setData({ message: '海图准备好了' });
    } catch (err) {
      this.setData({ message: `启动提示：${err?.message || err}` });
    }
  }

  render() {
    this.ensureShell(
      (ids) => ids.tideBoot,
      ({ div }) => {
        div({
          id: 'tideBoot',
          className: 'tide-boot',
          text: this.state.data.message,
        });
      }
    );
    const el = this.ids().tideBoot;
    if (el) el.textContent = this.state.data.message;
  }
}
