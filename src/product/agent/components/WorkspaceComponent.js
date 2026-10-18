import { Component } from '../../../engine/index.js';
import { CommandPalette, loadUi } from '../../../ui/index.js';
import { createAgentStore } from '../lib/store.js';
import { runUserPrompt } from '../lib/agentRunner.js';
import { AgentToolbarComponent } from './AgentToolbarComponent.js';
import { FileTreeComponent } from './FileTreeComponent.js';
import { CodePaneComponent } from './CodePaneComponent.js';
import { AgentChatComponent } from './AgentChatComponent.js';
import { AgentSideComponent } from './AgentSideComponent.js';

/**
 * Coding Agent workspace page — composes IDE chrome + panels.
 */
export class WorkspaceComponent extends Component {
  static styles = new URL('./WorkspaceComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = createAgentStore();
    this._unsub = null;
    this.commandPalette = null;

    const panelDeps = {
      navigator: this.navigator,
      logger: this.logger,
      store: this.store,
    };

    this.toolbar = new AgentToolbarComponent({
      ...panelDeps,
      onOpenCommand: () => this._openCommands(),
      onOpenSettings: () => this.navigator?.navigate?.('settings'),
      onRunDemo: () => void this._runDemo(),
    });
    this.files = new FileTreeComponent(panelDeps);
    this.code = new CodePaneComponent(panelDeps);
    this.chat = new AgentChatComponent(panelDeps);
    this.side = new AgentSideComponent(panelDeps);
    this.children = [this.toolbar, this.files, this.code, this.chat, this.side];
  }

  async componentDidMount() {
    await loadUi();
    this.logger?.i('WorkspaceComponent mounted');
  }

  refresh() {
    this.children.forEach((c) => c.refresh?.());
  }

  componentDidUnMount() {
    this._unsub?.();
    this._unsub = null;
    this.commandPalette?.unmount?.();
    this.commandPalette = null;
    this.children.forEach((c) => c.unmount());
  }

  componentDidAttachEvents() {
    void this._mountChildren();

    this.on(window, 'keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this._openCommands();
      }
    });
  }

  async _mountChildren() {
    await this.toolbar.mount('host-agent-toolbar');
    await this.files.mount('host-agent-files');
    await this.code.mount('host-agent-code');
    await this.chat.mount('host-agent-chat');
    await this.side.mount('host-agent-side');

    this.commandPalette = new CommandPalette({});
    await this.commandPalette.mount(document.body);

    this._unsub = this.store.subscribe(() => this.refresh());
    this.refresh();
  }

  _openCommands() {
    const items = [
      {
        id: 'demo',
        label: 'Run demo agent task (shout helper)',
        onSelect: () => void this._runDemo(),
      },
      {
        id: 'settings',
        label: 'Open settings',
        onSelect: () => this.navigator?.navigate?.('settings'),
      },
      {
        id: 'open-utils',
        label: 'Open src/utils.js',
        onSelect: () => this.store.setActivePath('src/utils.js'),
      },
      {
        id: 'open-app',
        label: 'Open src/app.js',
        onSelect: () => this.store.setActivePath('src/app.js'),
      },
      {
        id: 'tab-diff',
        label: 'Show Diff panel',
        onSelect: () => this.store.setSideTab('diff'),
      },
      {
        id: 'tab-term',
        label: 'Show Terminal panel',
        onSelect: () => this.store.setSideTab('terminal'),
      },
    ];
    this.commandPalette?.open({ items });
  }

  async _runDemo() {
    if (this.store.getState().running) return;
    await runUserPrompt(this.store, '给 greet 加一个 shout 大写版本，并在 app 里用上');
  }

  render() {
    this.ensureShell(
      (ids) => ids.agentWorkspace,
      ({ div }) => {
        div(
          { id: 'agentWorkspace', className: 'agent-workspace' },
          div({ id: 'host-agent-toolbar', className: 'agent-host agent-host--toolbar' }),
          div(
            { className: 'agent-workspace__main' },
            div({ id: 'host-agent-files', className: 'agent-host agent-host--files' }),
            div(
              { className: 'agent-workspace__center' },
              div({ id: 'host-agent-code', className: 'agent-host agent-host--code' }),
              div({ id: 'host-agent-side', className: 'agent-host agent-host--side' })
            ),
            div({ id: 'host-agent-chat', className: 'agent-host agent-host--chat' })
          )
        );
      }
    );
  }
}
