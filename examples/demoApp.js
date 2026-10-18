/**
 * Standard gd5 demo bootstrap — same shape as `src/product/main.js`.
 *
 * HTML provides page slots (`<div id="home">`), then:
 *   startDemoApp({ home: HomePage })
 */
import { ComponentRender, LogProvider } from '../src/engine/index.js';

/**
 * @param {Record<string, any>} pages  ComponentRender page registry
 * @param {{ loading?: string, home?: string }} [slots]
 * @param {object} [context]  LogProvider context extras
 * @returns {ComponentRender}
 */
export function startDemoApp(pages, slots = { loading: 'home', home: 'home' }, context = {}) {
  const app = new ComponentRender({
    logProvider: new LogProvider({
      level: 'info',
      sink: 'console',
      context: {
        machId: 'demo',
        userId: 'local',
        ...context,
      },
    }),
  });

  app.init(slots, pages);

  const boot = () => {
    app.render();
  };

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return app;
}
