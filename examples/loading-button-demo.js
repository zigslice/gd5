import { Component } from '../src/engine/index.js';
import { loadUi, Button, LoadingButton } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class LoadingButtonDemoPage extends Component {
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
          h1({ className: 'gd-demo__title', text: 'Loading Button' }),
          p({
            className: 'gd-demo__hint',
            text: 'Idle → busy（换色 + 散点/转圈，不可重复点）→ done 纯文本',
          }),
          div(
            { className: 'gd-demo__body' },
            div(
              { className: 'gd-demo__row' },
              div({ className: 'gd-demo__lab', text: 'Idle' }),
              Button({ type: 'default', text: 'Save' })
            ),
            div(
              { className: 'gd-demo__row' },
              div({ className: 'gd-demo__lab', text: 'Dots' }),
              Button({ type: 'primary', text: 'Saving', loading: true, indicator: 'dots' })
            ),
            div(
              { className: 'gd-demo__row' },
              div({ className: 'gd-demo__lab', text: 'Spin' }),
              Button({ type: 'primary', text: 'Publishing', loading: true, indicator: 'spin' })
            ),
            p({
              className: 'gd-demo__hint',
              text: 'Interactive — click locks until async finishes:',
              style: { marginTop: '20px', marginBottom: '10px' },
            }),
            div(
              { className: 'gd-demo__row' },
              h(LoadingButton, {
                text: 'Save',
                loadingText: 'Saving',
                type: 'default',
                loadingType: 'primary',
                indicator: 'dots',
                onClick: () => wait(1800),
              }),
              h(LoadingButton, {
                text: 'Publish',
                loadingText: 'Publishing',
                type: 'primary',
                indicator: 'spin',
                onClick: () => wait(1800),
              })
            )
          )
        );
      }
    );
  }
}

startDemoApp({ home: LoadingButtonDemoPage }, undefined, { demo: 'loading-button' });
