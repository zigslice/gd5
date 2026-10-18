import { Component } from '../src/engine/index.js';
import { loadUi, TodoList, nextTodoStatus } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class TodoDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  constructor(deps) {
    super(deps);
    this.state.data.items = [
      { key: '1', text: 'Add Button loading + LoadingButton with dots/spin', status: 'active' },
      { key: '2', text: 'CSS, gallery, docs, tests, demo', status: 'pending' },
      { key: '3', text: 'Commit, push, open PR', status: 'pending' },
    ];
  }

  async componentDidMount() {
    await loadUi();
  }

  render() {
    const { items } = this.state.data;

    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'TodoList' }),
          p({ className: 'gd-demo__hint', text: '点击条目可循环：pending → active → done' }),
          div({ id: 'host', className: 'gd-demo__body' })
        );
      }
    );

    const host = this.ids().host;
    if (!host) return;
    host.replaceChildren(
      TodoList({
        title: 'To-dos',
        items,
        onItemClick: (_item, index) => {
          this.setData({
            items: items.map((t, i) =>
              i === index ? { ...t, status: nextTodoStatus(t.status) } : t
            ),
          });
        },
      }).dom()
    );
  }
}

startDemoApp({ home: TodoDemoPage }, undefined, { demo: 'todo' });
