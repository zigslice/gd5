import { Component } from '../src/engine/index.js';
import { loadUi, SparkView } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class SparkDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  async componentDidMount() {
    await loadUi();
  }

  render() {
    // 就地组合 — 与 TodoList / ThreeView 相同
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'SparkView' }),
          p({
            className: 'gd-demo__hint',
            text: 'Spark.js 3D Gaussian Splatting（@sparkjsdev/spark）— 写法与 TodoList 一样可嵌套',
          }),
          div(
            { className: 'gd-demo__body' },
            SparkView({
              height: 420,
              url: 'https://sparkjs.dev/assets/splats/butterfly.spz',
              background: 0x0c0c0c,
              autoRotate: true,
              onReady({ splat, camera }) {
                if (splat) {
                  splat.quaternion.set(1, 0, 0, 0);
                  splat.position.set(0, 0, -3);
                }
                camera.position.set(0, 0.2, 0.5);
              },
            })
          )
        );
      }
    );
  }
}

startDemoApp({ home: SparkDemoPage }, undefined, { demo: 'spark' });
