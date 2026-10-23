import { Component } from '../src/engine/index.js';
import { loadUi, Timeline } from '../src/ui/index.js';
import { startDemoApp } from './demoApp.js';
import { platformTimelineItems, platformTimelineTags } from './timeline-data.js';

class TimelineDemoPage extends Component {
  static styles = [
    new URL('./demo-shell.css', import.meta.url),
    new URL('./timeline-demo.css', import.meta.url),
  ];

  async componentDidMount() {
    await loadUi();
  }

  render() {
    const initial = new URLSearchParams(window.location.search).get('tag') || 'all';
    this.ensureShell(
      (ids) => ids.root,
      ({ div, h1, p }) => {
        div(
          { id: 'root', className: 'gd-demo' },
          h1({ className: 'gd-demo__title', text: 'Timeline' }),
          p({
            className: 'gd-demo__hint',
            text: '点上方标签筛选。标签上的字就是 Tab 的名字；All 显示全部。',
          }),
          div(
            { className: 'gd-demo__body' },
            Timeline({
              mode: 'tags',
              defaultActiveKey: initial,
              allLabel: 'All',
              tags: platformTimelineTags,
              items: platformTimelineItems,
            })
          )
        );
      }
    );
  }
}

startDemoApp({ home: TimelineDemoPage }, undefined, { demo: 'timeline' });
