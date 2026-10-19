import { Component } from '../../../engine/index.js';
import { ThreeView } from '../../../ui/index.js';
import { mountBattleScene } from '../lib/battleScene.js';

/**
 * 岛内防御画面。点部署点会调用 store.deploy。
 */
export class BattleView extends Component {
  static styles = new URL('./MapView.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = deps.store;
    this._api = null;
  }

  componentDidUnMount() {
    this._api?.dispose?.();
    this._api = null;
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div }) => {
        div(
          { id: 'root', className: 'tide-view' },
          ThreeView({
            height: '100%',
            className: 'tide-canvas',
            background: 0x0c4a62,
            onInit: ({ THREE, scene, camera, renderer }) => {
              this._api = mountBattleScene(THREE, scene, camera, renderer.domElement, {
                onPad: (padId) => this.store.deploy(padId),
              });
              return () => {
                this._api?.dispose?.();
                this._api = null;
              };
            },
            onFrame: (dt) => {
              if (!this._api) return;
              this.store.tick(dt);
              const state = this.store.getState();
              if (state.phase !== 'battle') return;
              this._api.update(state);
            },
          })
        );
      }
    );
  }
}
