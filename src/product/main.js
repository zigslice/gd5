/**
 * ProtoLive Product bootstrap
 *
 * 用引擎 ComponentRender 挂载产品页面：
 * - boot  → loading 槽
 * - editor → home
 * - preview → 模态预览（isModal）
 *
 * 注册可简写：默认 id=name、isMount=false；页面构造自动获得 navigator/logger。
 */

import { ComponentRender, LogProvider } from '../engine/index.js';
import { applyRememberedJelly, loadUi } from '../ui/index.js';

applyRememberedJelly();
void loadUi();
import { BootComponent } from './components/BootComponent.js';
import { EditorComponent } from './components/EditorComponent.js';
import { PreviewComponent } from './components/PreviewComponent.js';

const logProvider = new LogProvider({
  level: 'info',
  sink: 'console',
  context: {
    machId: 'browser',
    userId: 'protolive',
  },
});

const render = new ComponentRender({ logProvider });

render.init(
  {
    loading: 'boot',
    home: 'editor',
  },
  {
    boot: BootComponent,
    editor: EditorComponent,
    preview: { type: PreviewComponent, isModal: true },
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
