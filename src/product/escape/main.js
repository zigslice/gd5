/**
 * gd5 Escape Room product — Midnight Archive
 *
 * Point-and-click 2D escape room demo:
 * - ComponentRender page slots (boot / game / win)
 * - Child Component.mount panels (scene, inventory, journal)
 * - Store-driven puzzles + inventory
 */

import { ComponentRender, LogProvider } from '../../engine/index.js';
import { applyRememberedJelly, loadUi } from '../../ui/index.js';

applyRememberedJelly();
void loadUi();
import { EscapeBootComponent } from './components/EscapeBootComponent.js';
import { GameComponent } from './components/GameComponent.js';
import { WinComponent } from './components/WinComponent.js';

const logProvider = new LogProvider({
  level: 'info',
  sink: 'console',
  context: {
    machId: 'browser',
    userId: 'escape-player',
    product: 'escape',
  },
});

const render = new ComponentRender({ logProvider });

render.init(
  {
    loading: 'boot',
    home: 'game',
  },
  {
    boot: EscapeBootComponent,
    game: GameComponent,
    win: { type: WinComponent, isModal: true },
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
