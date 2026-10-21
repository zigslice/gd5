import { Component } from '../../../engine/index.js';
import { JellySwitch, loadUi } from '../../../ui/index.js';
import { createEscapeStore } from '../lib/store.js';
import { SceneComponent } from './SceneComponent.js';
import { InventoryComponent } from './InventoryComponent.js';
import { SidePanelComponent } from './SidePanelComponent.js';

/**
 * Escape Room game page — composes scene + inventory + journal/examine.
 */
export class GameComponent extends Component {
  static styles = new URL('./GameComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = createEscapeStore();
    this._unsub = null;

    const panelDeps = {
      navigator: this.navigator,
      logger: this.logger,
      store: this.store,
    };

    this.scene = new SceneComponent({
      ...panelDeps,
      onEscaped: () => this.navigator?.navigate?.('win'),
    });
    this.inventory = new InventoryComponent(panelDeps);
    this.side = new SidePanelComponent({
      ...panelDeps,
      onEscaped: () => this.navigator?.navigate?.('win'),
      onReset: () => this.store.reset(),
    });
    this.children = [this.scene, this.inventory, this.side];
  }

  async componentDidMount() {
    await loadUi();
    this.logger?.i('GameComponent mounted');
  }

  refresh() {
    this.children.forEach((c) => c.refresh?.());
  }

  componentDidUnMount() {
    this._unsub?.();
    this._unsub = null;
    this.children.forEach((c) => c.unmount());
  }

  componentDidAttachEvents() {
    void this._mountChildren();

    this.on(window, 'keydown', (e) => {
      if (e.key === 'Escape') {
        this.store.closeExamine();
      }
    });

    this.on(window, 'gd-escape-reset', () => {
      this.store.reset();
    });
  }

  async _mountChildren() {
    await this.scene.mount('host-escape-scene');
    await this.inventory.mount('host-escape-inv');
    await this.side.mount('host-escape-side');

    this._unsub = this.store.subscribe((snap) => {
      this.refresh();
      if (snap.status === 'won') {
        this.navigator?.navigate?.('win');
      }
      const moves = this.ids().escapeMoves;
      if (moves) moves.textContent = `步数 ${snap.moves}`;
    });
    this.refresh();
  }

  render() {
    this.ensureShell(
      (ids) => ids.escapeRoot,
      ({ div, header, span, button }) => {
        div(
          { id: 'escapeRoot', className: 'escape-game' },
          header(
            { className: 'escape-game__bar' },
            span({ className: 'escape-game__brand', text: 'Midnight Archive' }),
            span({ className: 'escape-game__sub', text: '密室逃脱 · 产品 demo' }),
            span({ id: 'escapeMoves', className: 'escape-game__moves', text: '步数 0' }),
            JellySwitch({ label: '果冻' }),
            button({
              className: 'btn btn--ghost escape-game__reset',
              type: 'button',
              text: '重置',
              onClick: () => this.store.reset(),
            })
          ),
          div(
            { className: 'escape-game__body' },
            div({ id: 'host-escape-scene', className: 'escape-game__scene-host' }),
            div(
              { className: 'escape-game__rail' },
              div({ id: 'host-escape-inv', className: 'escape-game__inv-host' }),
              div({ id: 'host-escape-side', className: 'escape-game__side-host' })
            )
          )
        );
      }
    );
  }
}
