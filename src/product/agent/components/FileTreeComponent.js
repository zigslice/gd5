import { Component } from '../../../engine/index.js';
import { Tree, loadUi } from '../../../ui/index.js';

/**
 * Left rail — workspace file tree (UI Tree).
 */
export class FileTreeComponent extends Component {
  static styles = new URL('./FileTreeComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
    this.state.data.expandedKeys = ['src', 'test'];
  }

  async mount(host, params = {}) {
    await loadUi();
    return super.mount(host, params);
  }

  render() {
    const snap = this.store?.getState?.() || {};
    const treeData = this.store?.treeData?.() || [];

    this.ensureShell(
      (ids) => ids.agentFiles,
      ({ div }) => {
        div(
          { id: 'agentFiles', className: 'agent-files' },
          div({ className: 'agent-files__title', text: 'Files' }),
          div({ id: 'agentFilesTree', className: 'agent-files__tree' })
        );
      }
    );

    const host = this.ids().agentFilesTree;
    if (!host) return;
    host.textContent = '';
    const tree = Tree({
      treeData,
      expandedKeys: this.state.data.expandedKeys,
      selectedKey: snap.activePath,
      onExpand: (keys) => {
        this.state.data.expandedKeys = keys;
      },
      onSelect: (key, node) => {
        if (node?.children) return;
        this.store.setActivePath(key);
      },
    });
    host.appendChild(tree.dom());
  }
}
