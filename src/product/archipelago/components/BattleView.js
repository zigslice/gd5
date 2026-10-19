import { Component } from '../../../engine/index.js';
import { ThreeView } from '../../../ui/index.js';
import { mountBattleScene } from '../lib/battleScene.js';

/**
 * 岛内画面。点自己的兵再点地面是调动，布防阶段点空地是放置。
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
      ({ div, span }) => {
        div(
          { id: 'root', className: 'tide-view' },
          ThreeView({
            height: '100%',
            className: 'tide-canvas',
            background: 0x0c4a62,
            onInit: ({ THREE, scene, camera, renderer }) => {
              this._api = mountBattleScene(THREE, scene, camera, renderer.domElement, {
                onUnit: (id) => this.store.pickUnit(id),
                onGround: (x, z) => this.store.ground(x, z),
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
              this._api.update(state, dt);
            },
          }),
          div({ className: 'tide-landing-note' }, span({ text: '码头是唯一上岸口' }))
        );
      }
    );
  }
}
