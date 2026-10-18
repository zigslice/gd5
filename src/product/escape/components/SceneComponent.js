import { Component } from '../../../engine/index.js';

/**
 * 2D point-and-click room scene — CSS diorama + hotspot buttons.
 */
export class SceneComponent extends Component {
  static styles = new URL('./SceneComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = deps.store;
    this.onEscaped = deps.onEscaped;
  }

  render() {
    const snap = this.store.getState();

    this.ensureShell(
      (ids) => ids.escapeScene,
      ({ div }) => {
        div(
          { id: 'escapeScene', className: 'escape-scene' },
          div({ className: 'escape-scene__sky' }),
          div({ className: 'escape-scene__rain', 'aria-hidden': 'true' }),
          div({ className: 'escape-scene__floor' }),
          div({ className: 'escape-scene__wall' }),
          div({ className: 'escape-scene__prop escape-scene__prop--door', id: 'propDoor' }),
          div({ className: 'escape-scene__prop escape-scene__prop--window' }),
          div({ className: 'escape-scene__prop escape-scene__prop--lamp', id: 'propLamp' }),
          div({ className: 'escape-scene__prop escape-scene__prop--clock' }),
          div({ className: 'escape-scene__prop escape-scene__prop--shelf' }),
          div({
            className: 'escape-scene__prop escape-scene__prop--painting',
            id: 'propPainting',
          }),
          div({ className: 'escape-scene__prop escape-scene__prop--safe', id: 'propSafe' }),
          div({ className: 'escape-scene__prop escape-scene__prop--desk' }),
          div({
            className: 'escape-scene__prop escape-scene__prop--drawer',
            id: 'propDrawer',
          }),
          div({ id: 'escapeHotspots', className: 'escape-scene__hotspots' }),
          div({ id: 'escapeSceneHint', className: 'escape-scene__hint', text: '' })
        );
      }
    );

    const root = this.ids().escapeScene;
    const lamp = this.ids().propLamp;
    const painting = this.ids().propPainting;
    const safe = this.ids().propSafe;
    const drawer = this.ids().propDrawer;
    const door = this.ids().propDoor;
    const hint = this.ids().escapeSceneHint;
    const host = this.ids().escapeHotspots;
    if (!root || !host) return;

    root.classList.toggle('escape-scene--lit', !!snap.flags.lampOn);
    lamp?.classList.toggle('is-on', !!snap.flags.lampOn);
    painting?.classList.toggle('is-moved', !!snap.flags.paintingMoved);
    safe?.classList.toggle('is-visible', !!snap.flags.paintingMoved);
    safe?.classList.toggle('is-open', !!snap.flags.safeOpen);
    drawer?.classList.toggle('is-open', !!snap.flags.drawerOpen);
    door?.classList.toggle('is-open', !!snap.flags.doorUnlocked);

    if (hint) {
      hint.textContent = snap.flags.lampOn
        ? '点击物品调查 · 选中背包物品后再点目标使用'
        : '房间很暗——先找光源';
    }

    host.textContent = '';
    for (const h of snap.hotspots) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'escape-hotspot';
      btn.style.left = `${h.x}%`;
      btn.style.top = `${h.y}%`;
      btn.style.width = `${h.w}%`;
      btn.style.height = `${h.h}%`;
      btn.title = h.hint || h.label;
      btn.dataset.hotspot = h.id;
      const label = document.createElement('span');
      label.className = 'escape-hotspot__label';
      label.textContent = h.label;
      btn.appendChild(label);
      btn.addEventListener('click', () => this._onHotspot(h.id));
      host.appendChild(btn);
    }
  }

  _onHotspot(id) {
    const result = this.store.interact(id);
    if (result?.navigateWin) this.onEscaped?.();
  }
}
