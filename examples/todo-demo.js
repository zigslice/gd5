import { Component } from '../src/engine/index.js';
import { loadUi, TodoList, nextTodoStatus } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class TodoDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  constructor(deps) {
    super(deps);
    this.todoList = new TodoList({
      title: 'To-dos',
      items: [
        { key: '1', text: 'Add Button loading + LoadingButton with dots/spin', status: 'active' },
        { key: '2', text: 'CSS, gallery, docs, tests, demo', status: 'pending' },
        { key: '3', text: 'Commit, push, open PR', status: 'pending' },
      ],
      onItemClick: (_item, index) => {
        const items = this.todoList.getItems().map((t, i) =>
          i === index ? { ...t, status: nextTodoStatus(t.status) } : t
        );
        this.todoList.setItems(items);
      },
    });
  }

  async componentDidMount() {
    await loadUi();
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p, slot }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'TodoList' }),
          p({ className: 'gd-demo__hint', text: '点击条目可循环：pending → active → done' }),
          slot(this.todoList, { className: 'gd-demo__body' })
        );
      }
    );
  }
}

startDemoApp({ home: TodoDemoPage }, undefined, { demo: 'todo' });
