import { Component } from '../../../engine/index.js';
import { ThreeView } from '../../../ui/index.js';
import { mountMapScene } from '../lib/mapScene.js';

/**
 * 海图。ThreeView 负责画，岛名用 HTML 叠在上面，避免 canvas 字体缺失。
 */
export class MapView extends Component {
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
    const islands = Object.values(this.store.getState().islands).sort((a, b) => a.row - b.row || a.x - b.x);

    this.ensureShell(
      (ids) => ids.root,
      ({ div, span }) => {
        div(
          { id: 'root', className: 'tide-view' },
          ThreeView({
            height: '100%',
            className: 'tide-canvas',
            background: 0x08344a,
            onInit: ({ THREE, scene, camera, renderer }) => {
              this._api = mountMapScene(THREE, scene, camera, renderer.domElement, {
                onPick: (id) => {
                  this.store.selectIsland(id);
                  this.store.enter(id);
                },
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
              if (state.phase !== 'map') return;
              this._api.update(state, dt, performance.now() / 1000);
              this._placeLabels(state);
            },
          }),
            div({ className: 'tide-map-cta' }, span({ text: '点击沙色岛屿，进入岛屿视角' })),
          div(
            { id: 'labels', className: 'tide-labels' },
            ...islands.map((island) =>
              span({
                id: `label-${island.id}`,
                className: 'tide-label',
                text: island.name,
                onClick: () => {
                  this.store.selectIsland(island.id);
                  this.store.enter(island.id);
                },
              })
            )
          )
        );
      }
    );
  }

  _placeLabels(state) {
    const host = this.ids().labels;
    if (!host || !this._api) return;
    for (const island of Object.values(state.islands)) {
      const el = this.ids()[`label-${island.id}`];
      const pos = this._api.project(island.id, host);
      if (!el) continue;
      el.dataset.status = island.status;
      el.textContent = island.status === 'open' ? `${island.name} · 点击进入` : island.name;
      if (!pos) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = 'block';
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
    }
  }
}
