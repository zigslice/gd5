/**
 * 潮前线 — 3D 群岛防御产品
 *
 * 页槽：boot → game。
 * 海图和岛内防御都在 game 里切换，共用一份 store。
 */

import { ComponentRender, LogProvider } from '../../engine/index.js';
import { TideBootComponent } from './components/TideBootComponent.js';
import { TideGameComponent } from './components/TideGameComponent.js';

const logProvider = new LogProvider({
  level: 'info',
  sink: 'console',
  context: {
    machId: 'browser',
    userId: 'tide-player',
    product: 'tidefront',
  },
});

const render = new ComponentRender({ logProvider });

render.init(
  {
    loading: 'boot',
    home: 'game',
  },
  {
    boot: TideBootComponent,
    game: TideGameComponent,
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
