import { Component } from '../src/engine/index.js';
import { loadUi, MarkdownEditor } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class MarkdownEditorDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  async componentDidMount() {
    await loadUi();
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p, h }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'MarkdownEditor' }),
          p({
            className: 'gd-demo__hint',
            text: '默认 Markdown 编辑 · 顶部工具栏 · 编辑 / 分栏 / 预览',
          }),
          div(
            { className: 'gd-demo__body' },
            h(MarkdownEditor, {
              height: 360,
              mode: 'split',
              value: [
                '# gd5 Markdown',
                '',
                '默认以 **Markdown** 编辑，顶部工具栏可快速插入格式。',
                '',
                '## 功能',
                '',
                '- 粗体 / 斜体 / 标题',
                '- 引用、列表、链接、行内代码',
                '- 分栏实时预览',
                '',
                '```js',
                'ed.setMode("preview");',
                '```',
                '',
                '> 切换右上角「编辑 / 分栏 / 预览」。',
                '',
                'Visit [gd5](https://github.com/zigslice/gd5).',
              ].join('\n'),
            })
          )
        );
      }
    );
  }
}

startDemoApp({ home: MarkdownEditorDemoPage }, undefined, { demo: 'markdown-editor' });
