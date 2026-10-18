import { Component } from '../src/engine/index.js';
import { loadUi, CoverFlow } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class CoverFlowDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  constructor(deps) {
    super(deps);
    this.coverFlow = new CoverFlow({
      height: 320,
      index: 2,
      items: [
        { key: 'knight', title: 'Knight', subtitle: 'Tank · Iron Order', color: 'linear-gradient(145deg,#4a5568,#1a202c)' },
        { key: 'mage', title: 'Mage', subtitle: 'Caster · Arcane', color: 'linear-gradient(145deg,#6b46c1,#2b1a4e)' },
        { key: 'ranger', title: 'Ranger', subtitle: 'Scout · Wildwood', color: 'linear-gradient(145deg,#2f8f5b,#143528)' },
        { key: 'rogue', title: 'Rogue', subtitle: 'Assassin · Night', color: 'linear-gradient(145deg,#c05621,#3b1d0f)' },
        { key: 'cleric', title: 'Cleric', subtitle: 'Support · Dawn', color: 'linear-gradient(145deg,#2b6cb0,#1a365d)' },
      ],
    });
    this._mountedCf = false;
  }

  async componentDidMount() {
    await loadUi();
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'Cover Flow' }),
          p({
            className: 'gd-demo__hint',
            text: '封面流 — 居中正面卡片，左右倾斜叠放（游戏选角色那种）',
          }),
          div({ id: 'host', className: 'gd-demo__body' })
        );
      }
    );

    const host = this.ids().host;
    if (host && !this._mountedCf) {
      this._mountedCf = true;
      void this.coverFlow.mount(host);
    }
  }
}

startDemoApp({ home: CoverFlowDemoPage }, undefined, { demo: 'coverflow' });
