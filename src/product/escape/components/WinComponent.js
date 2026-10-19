import { Component } from '../../../engine/index.js';

/**
 * Escape success modal page.
 */
export class WinComponent extends Component {
  static styles = new URL('./WinComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = deps.store;
  }

  render() {
    // Win modal may open from GameComponent navigation; moves come from game store if passed.
    // Prefer reading via navigator parent is awkward — show static win + back.
    this.ensureShell(
      (ids) => ids.escapeWin,
      ({ div, h1, p, button }) => {
        div(
          { id: 'escapeWin', className: 'escape-win' },
          div(
            { className: 'escape-win__card' },
            h1({ className: 'escape-win__title', text: '逃出成功' }),
            p({
              className: 'escape-win__lead',
              text: '雨夜散去。Midnight Archive 的门锁在你身后合上——密室逃脱 demo 通关。',
            }),
            p({
              className: 'escape-win__meta',
              text: '本 demo 展示 gd5 产品组合：ComponentRender 页槽、子组件 mount、store 驱动谜题。',
            }),
            div(
              { className: 'escape-win__actions' },
              button({
                type: 'button',
                className: 'btn btn--primary',
                text: '再玩一次',
                onClick: () => {
                  // Game page owns the store; goBack then ask game to reset via custom event
                  window.dispatchEvent(new CustomEvent('gd-escape-reset'));
                  this.navigator?.goBack?.();
                },
              }),
              button({
                type: 'button',
                className: 'btn btn--ghost',
                text: '关闭',
                onClick: () => this.navigator?.goBack?.(),
              })
            )
          )
        );
      }
    );
  }
}
