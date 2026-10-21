/**
 * gd5 Coding Agent product bootstrap
 *
 * Exercises full product stack:
 * - ComponentRender page slots (boot / workspace / settings)
 * - Child Component.mount panels
 * - UI kit embeds (Tree, CodeBlock, Diff, TodoList, Chat, CommandPalette, themes)
 * - Store-driven refresh + simulated agent turns
 */

import { ComponentRender, LogProvider } from '../../engine/index.js';
import { applyRememberedJelly, loadUi } from '../../ui/index.js';

applyRememberedJelly();
void loadUi();
import { AgentBootComponent } from './components/AgentBootComponent.js';
import { WorkspaceComponent } from './components/WorkspaceComponent.js';
import { AgentSettingsComponent } from './components/AgentSettingsComponent.js';

const logProvider = new LogProvider({
  level: 'info',
  sink: 'console',
  context: {
    machId: 'browser',
    userId: 'coding-agent',
    product: 'agent',
  },
});

const render = new ComponentRender({ logProvider });

render.init(
  {
    loading: 'boot',
    home: 'workspace',
  },
  {
    boot: AgentBootComponent,
    workspace: WorkspaceComponent,
    settings: { type: AgentSettingsComponent, isModal: true },
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
