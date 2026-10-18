import { Component } from '../src/engine/index.js';
import { loadUi, CodeBlock, DiffBlock, Space, splitCodeLines } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class CodeBlockDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  async componentDidMount() {
    await loadUi();
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'CodeBlock' }),
          p({
            className: 'gd-demo__hint',
            text: 'Native line numbers + DiffBlock (no highlight.js).',
          }),
          div({ id: 'host', className: 'gd-demo__body' })
        );
      }
    );

    const host = this.ids().host;
    if (!host || host.dataset.ready === '1') return;
    host.dataset.ready = '1';

    const code = `/** demo */\nexport function add(a, b) {\n  // sum\n  return a + b;\n}\n`;
    this.logger?.i(`code-block lines=${splitCodeLines(code).length}`);

    host.appendChild(
      Space(
        { direction: 'vertical', size: 'md' },
        CodeBlock({
          language: 'javascript',
          highlightLines: [4],
          startFrom: 1,
          code,
        }),
        CodeBlock({
          language: 'json',
          startFrom: 10,
          code: '{\n  "ok": true,\n  "n": 1\n}\n',
        }),
        DiffBlock({
          language: 'javascript',
          diff:
            '@@ -1,4 +1,5 @@\n /** demo */\n-export function add(a, b) {\n-  // sum\n-  return a + b;\n+export function add(a, b, c = 0) {\n+  // sum\n+  return a + b + c;\n }\n',
        })
      ).dom()
    );
  }
}

startDemoApp({ home: CodeBlockDemoPage }, undefined, { demo: 'code-block' });
