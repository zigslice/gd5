import { Component } from '../src/engine/index.js';
import { loadUi, EChart, ThreeView } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';

class EmbedDemoPage extends Component {
  static styles = [new URL('./demo-shell.css', import.meta.url)];

  async componentDidMount() {
    await loadUi();
  }

  render() {
    // 就地组合 — 与 TodoList 相同：div 里直接写 EChart / ThreeView
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p, h2 }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'EChart + ThreeView' }),
          p({
            className: 'gd-demo__hint',
            text: '第三方嵌入宿主：ECharts 图表 + three.js 3D，写法与 TodoList 一样可嵌套',
          }),
          div(
            { className: 'gd-demo__body', style: { display: 'grid', gap: '1.25rem' } },
            h2({ text: 'ECharts', style: { margin: '0', fontSize: '1rem' } }),
            EChart({
              height: 280,
              option: {
                color: ['#e86a17'],
                tooltip: { trigger: 'axis' },
                grid: { left: 40, right: 16, top: 24, bottom: 32 },
                xAxis: {
                  type: 'category',
                  data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                },
                yAxis: { type: 'value' },
                series: [
                  {
                    type: 'bar',
                    data: [12, 18, 9, 22, 15, 28, 20],
                    barWidth: '48%',
                  },
                ],
              },
            }),
            h2({ text: 'three.js 3D', style: { margin: '0.5rem 0 0', fontSize: '1rem' } }),
            ThreeView({
              height: 320,
              background: 0xf7f4ef,
              onInit({ THREE, scene, camera }) {
                camera.position.set(1.4, 1.1, 2.2);
                camera.lookAt(0, 0, 0);
                scene.add(new THREE.AmbientLight(0xffffff, 0.55));
                const key = new THREE.DirectionalLight(0xffffff, 1.05);
                key.position.set(3, 4, 2);
                scene.add(key);
                const mesh = new THREE.Mesh(
                  new THREE.IcosahedronGeometry(0.75, 0),
                  new THREE.MeshStandardMaterial({
                    color: 0xe86a17,
                    metalness: 0.25,
                    roughness: 0.4,
                    flatShading: true,
                  })
                );
                scene.add(mesh);
                return () => {
                  mesh.geometry.dispose();
                  mesh.material.dispose();
                };
              },
              onFrame(dt, { scene }) {
                const mesh = scene?.children?.find((c) => c.isMesh);
                if (mesh) {
                  mesh.rotation.x += dt * 0.55;
                  mesh.rotation.y += dt * 0.85;
                }
              },
            })
          )
        );
      }
    );
  }
}

startDemoApp({ home: EmbedDemoPage }, undefined, { demo: 'embed' });
