/**
 * gd5 站点索引
 *
 * index.html 的首页：列出子产品和 examples，点击才进入对应页面。
 * 本身是标准 gd5 应用（页槽 + ComponentRender + UI 组件库）。
 */

import { ComponentRender, LogProvider } from '../engine/index.js';
import { isThemeName, setTheme } from '../ui/index.js';
import { CatalogPage } from './components/CatalogPage.js';

const THEME_KEY = 'gd5-catalog-theme';

try {
  const saved = localStorage.getItem(THEME_KEY);
  if (isThemeName(saved)) setTheme(saved);
} catch {
  /* private mode */
}

const render = new ComponentRender({
  logProvider: new LogProvider({
    level: 'info',
    sink: 'console',
    context: {
      machId: 'browser',
      userId: 'catalog',
    },
  }),
});

render.init(
  {
    loading: 'home',
    home: 'home',
  },
  {
    home: CatalogPage,
  }
);

window.addEventListener('DOMContentLoaded', () => {
  render.render();
});
