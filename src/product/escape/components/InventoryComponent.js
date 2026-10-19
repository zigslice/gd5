import { Component } from '../../../engine/index.js';

/**
 * Inventory bar — click to select item for use on hotspots.
 */
export class InventoryComponent extends Component {
  static styles = new URL('./InventoryComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = deps.store;
  }

  render() {
    const snap = this.store.getState();

    this.ensureShell(
      (ids) => ids.escapeInv,
      ({ div }) => {
        div(
          { id: 'escapeInv', className: 'escape-inv' },
          div({ className: 'escape-inv__title', text: '背包' }),
          div({ id: 'escapeInvList', className: 'escape-inv__list' }),
          div({ id: 'escapeInvHint', className: 'escape-inv__hint', text: '' })
        );
      }
    );

    const list = this.ids().escapeInvList;
    const hint = this.ids().escapeInvHint;
    if (!list) return;

    list.textContent = '';
    if (!snap.inventory.length) {
      const empty = document.createElement('div');
      empty.className = 'escape-inv__empty';
      empty.textContent = '空空如也';
      list.appendChild(empty);
    } else {
      for (const item of snap.inventory) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'escape-inv__item' +
          (snap.selectedItem === item.id ? ' is-selected' : '');
        btn.title = item.desc;
        btn.textContent = item.name;
        btn.addEventListener('click', () => this.store.selectItem(item.id));
        list.appendChild(btn);
      }
    }

    if (hint) {
      const selected = snap.inventory.find((i) => i.id === snap.selectedItem);
      hint.textContent = selected
        ? `已选中：${selected.name}（再点场景中的目标使用）`
        : '点击物品选中，再与场景互动';
    }
  }
}
