/**
 * 站点索引目录：子产品 + examples 示例页。
 * 纯数据，过滤逻辑不依赖 DOM，方便页面和测试共用。
 */

/** @typedef {'product'|'example'} CatalogKind */

/**
 * @typedef {object} CatalogEntry
 * @property {string} id
 * @property {CatalogKind} kind
 * @property {string} title
 * @property {string} kicker
 * @property {string} summary
 * @property {string} href
 * @property {string[]} tags
 * @property {string} searchText
 */

/** @type {Array<Omit<CatalogEntry, 'searchText'>>} */
const RAW_CATALOG = [
  {
    id: 'protolive',
    kind: 'product',
    title: 'ProtoLive',
    kicker: '原型编辑器',
    summary: '在画布上拼积木、改属性、预览，并导出一份独立 HTML。引擎的参考产品。',
    href: 'protolive.html',
    tags: ['编辑器', '导出'],
  },
  {
    id: 'agent',
    kind: 'product',
    title: 'Coding Agent',
    kicker: 'IDE',
    summary: '文件树、代码高亮、Agent 对话、Diff 和命令面板。回合在本地模拟，用来看产品怎么拼起来。',
    href: 'agent.html',
    tags: ['IDE', 'Agent'],
  },
  {
    id: 'escape',
    kind: 'product',
    title: 'Midnight Archive',
    kicker: '密室逃脱',
    summary: '2D 点选解谜：场景热点、背包、密码锁，通关后进入结算页。',
    href: 'escape.html',
    tags: ['游戏', '场景'],
  },
  {
    id: 'tidefront',
    kind: 'product',
    title: '潮前线',
    kicker: '3D 群岛防御',
    summary: '海洋上的多座岛屿。沿航线逐岛布防、守住房子。冷却要靠刷新清空，刷新会把前线推到最近守住的岛前面；这一排若全部失守，已防御的岛会重新丢失。',
    href: 'archipelago.html',
    tags: ['3D', '防御'],
  },
  {
    id: 'gallery',
    kind: 'example',
    title: 'UI Gallery',
    kicker: '组件画廊',
    summary: '组件目录和橙 / 蓝 / 绿三套主题。想先看控件长什么样，从这里进。',
    href: 'examples/ui-gallery.html',
    tags: ['主题', '目录'],
  },
  {
    id: 'code',
    kind: 'example',
    title: 'CodeBlock',
    kicker: '代码与 Diff',
    summary: '原生行号高亮，以及并排 Diff，不依赖 highlight.js。',
    href: 'examples/code-block-demo.html',
    tags: ['代码'],
  },
  {
    id: 'coverflow',
    kind: 'example',
    title: 'Cover Flow',
    kicker: '封面流',
    summary: '居中的正面卡片，左右倾斜叠放，接近游戏里选角色的那种。',
    href: 'examples/coverflow-demo.html',
    tags: ['轮播'],
  },
  {
    id: 'embed',
    kind: 'example',
    title: 'EChart + Three',
    kicker: '图表与 3D',
    summary: 'ECharts 图表和 three.js 场景，写法和页面里的普通组件一样。',
    href: 'examples/embed-demo.html',
    tags: ['图表', '3D'],
  },
  {
    id: 'loading-button',
    kind: 'example',
    title: 'LoadingButton',
    kicker: '异步按钮',
    summary: '空闲、进行中、完成。进行中会换色并锁住重复点击。',
    href: 'examples/loading-button-demo.html',
    tags: ['按钮'],
  },
  {
    id: 'markdown',
    kind: 'example',
    title: 'MarkdownEditor',
    kicker: 'Markdown',
    summary: '顶部工具栏，编辑、分栏、预览三种模式。',
    href: 'examples/markdown-editor-demo.html',
    tags: ['编辑器'],
  },
  {
    id: 'pele',
    kind: 'example',
    title: 'PeleView',
    kicker: 'Mermaid',
    summary: '用 Pele 把 Mermaid 画成 SVG，可以嵌进页面树。',
    href: 'examples/pele-demo.html',
    tags: ['图表'],
  },
  {
    id: 'spark',
    kind: 'example',
    title: 'SparkView',
    kicker: 'Gaussian Splatting',
    summary: 'Spark.js 三维高斯泼溅。嵌入方式和 TodoList 相同。',
    href: 'examples/spark-demo.html',
    tags: ['3D'],
  },
  {
    id: 'todo',
    kind: 'example',
    title: 'TodoList',
    kicker: '待办',
    summary: '点击条目，在待处理、进行中、完成之间循环。',
    href: 'examples/todo-demo.html',
    tags: ['列表'],
  },
];

/** @type {CatalogEntry[]} */
export const CATALOG = RAW_CATALOG.map((entry) => ({
  ...entry,
  searchText: [entry.title, entry.kicker, entry.summary, entry.href, entry.kind, ...entry.tags]
    .join('\n')
    .toLowerCase(),
}));

/**
 * @param {CatalogEntry[]} entries
 * @param {{ kind?: string, query?: string }} [options]
 * @returns {CatalogEntry[]}
 */
export function filterCatalog(entries, options = {}) {
  const kind = options.kind || 'all';
  const query = String(options.query ?? '')
    .trim()
    .toLowerCase();
  return entries.filter((entry) => {
    if (kind !== 'all' && entry.kind !== kind) return false;
    if (!query) return true;
    return entry.searchText.includes(query);
  });
}

/**
 * @param {CatalogEntry[]} entries
 * @param {CatalogKind} kind
 */
export function countCatalog(entries, kind) {
  return entries.reduce((n, entry) => n + (entry.kind === kind ? 1 : 0), 0);
}
