import { Component } from '../../engine/index.js';
import { JellySwitch } from '../../ui/index.js';

/**
 * 顶栏：撤销 / 重做 / 预览 / 导出。
 * super(deps) 后与页面相同：直接 this.navigator.navigate(…)。
 */
export class ToolbarComponent extends Component {
  static styles = new URL('./ToolbarComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
    this.onExport = deps.onExport;
  }

  render() {
    this.ensureShell(
      (ids) => ids.toolbar,
      ({ header, div, span, h1, button }) => {
        header(
          { className: 'toolbar', id: 'toolbar' },
          div(
            { className: 'toolbar__brand', id: 'brand' },
            span({ className: 'toolbar__mark', id: 'brandMark' }),
            h1({ className: 'toolbar__title', id: 'brandTitle', text: 'ProtoLive' })
          ),
          div(
            { className: 'toolbar__actions', id: 'toolbarActions' },
            JellySwitch({ label: '果冻' }),
            button({
              id: 'btnUndo',
              type: 'button',
              className: 'btn btn--ghost',
              text: '撤销',
              onClick: () => this.store.undo(),
            }),
            button({
              id: 'btnRedo',
              type: 'button',
              className: 'btn btn--ghost',
              text: '重做',
              onClick: () => this.store.redo(),
            }),
            button({
              id: 'btnPreview',
              type: 'button',
              className: 'btn btn--secondary',
              text: '预览',
              onClick: () => {
                const { doc } = this.store.getState();
                this.navigator.navigate('preview', { doc });
              },
            }),
            button({
              id: 'btnExport',
              type: 'button',
              className: 'btn btn--primary',
              text: '导出 HTML',
              onClick: () => this.onExport?.(),
            })
          )
        );
      }
    );
  }
}
