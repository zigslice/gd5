import { Component } from '../../../engine/index.js';
import { CodeBlock, loadUi } from '../../../ui/index.js';

/**
 * Center pane — open tabs + CodeBlock preview of active file.
 * (Editable textarea kept for light edits; CodeBlock shows highlighted view.)
 */
export class CodePaneComponent extends Component {
  static styles = new URL('./CodePaneComponent.css', import.meta.url);

  constructor(deps = {}) {
    super(deps);
    this.store = deps.store;
  }

  async mount(host, params = {}) {
    await loadUi();
    return super.mount(host, params);
  }

  render() {
    const snap = this.store?.getState?.() || {};
    const file = this.store?.getFile?.(snap.activePath);

    this.ensureShell(
      (ids) => ids.agentCode,
      ({ div }) => {
        div(
          { id: 'agentCode', className: 'agent-code' },
          div({ id: 'agentCodeTabs', className: 'agent-code__tabs' }),
          div({ id: 'agentCodeBody', className: 'agent-code__body' }),
          div({ id: 'agentCodeEdit', className: 'agent-code__edit-wrap' })
        );
      }
    );

    const tabsHost = this.ids().agentCodeTabs;
    const body = this.ids().agentCodeBody;
    const editWrap = this.ids().agentCodeEdit;
    if (!tabsHost || !body || !editWrap) return;

    tabsHost.textContent = '';
    for (const path of snap.openTabs || []) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className =
        'agent-code__tab' + (path === snap.activePath ? ' agent-code__tab--active' : '');
      tab.textContent = path.split('/').pop() || path;
      tab.title = path;
      tab.addEventListener('click', () => this.store.setActivePath(path));
      tabsHost.appendChild(tab);

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'agent-code__tab-close';
      close.textContent = '×';
      close.title = 'Close';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        this.store.closeTab(path);
      });
      tab.appendChild(close);
    }

    body.textContent = '';
    editWrap.textContent = '';

    if (!file) {
      const empty = document.createElement('div');
      empty.className = 'agent-code__empty';
      empty.textContent = 'Select a file from the tree';
      body.appendChild(empty);
      return;
    }

    const pathLabel = document.createElement('div');
    pathLabel.className = 'agent-code__path';
    pathLabel.textContent = file.path;
    body.appendChild(pathLabel);

    const block = CodeBlock({
      language: file.language || 'plaintext',
      code: file.content,
      showCopy: true,
    });
    body.appendChild(block.dom());

    const label = document.createElement('label');
    label.className = 'agent-code__edit-label';
    label.textContent = 'Quick edit';
    const ta = document.createElement('textarea');
    ta.className = 'agent-code__textarea';
    ta.value = file.content;
    ta.spellcheck = false;
    ta.addEventListener('change', () => {
      this.store.updateFileContent(file.path, ta.value);
    });
    editWrap.appendChild(label);
    editWrap.appendChild(ta);
  }
}
