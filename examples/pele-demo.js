import { Component } from '../src/engine/index.js';
import { loadUi, PeleView } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class PeleDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  async componentDidMount() {
    await loadUi();
  }

  render() {
    // 就地组合 — 与 TodoList / SparkView 相同
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p, h2 }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'PeleView' }),
          p({
            className: 'gd-demo__hint',
            text: 'Pele（obsidianmd/pele）Mermaid→SVG — 写法与 TodoList 一样可嵌套',
          }),
          div(
            { className: 'gd-demo__body', style: { display: 'grid', gap: '1.25rem' } },
            h2({ text: 'Flowchart', style: { margin: '0', fontSize: '1rem' } }),
            PeleView({
              height: 260,
              source: `flowchart LR
  Ask[Ask] --> Plan[Plan]
  Plan --> Edit[Edit]
  Edit --> Test[Test]
  Test --> Ship[Ship]`,
            }),
            h2({ text: 'Sequence', style: { margin: '0.5rem 0 0', fontSize: '1rem' } }),
            PeleView({
              height: 280,
              source: `sequenceDiagram
  participant U as User
  participant A as Agent
  participant F as Files
  U->>A: describe change
  A->>F: read / patch
  F-->>A: ok
  A-->>U: diff + todos`,
            })
          )
        );
      }
    );
  }
}

startDemoApp({ home: PeleDemoPage }, undefined, { demo: 'pele' });
