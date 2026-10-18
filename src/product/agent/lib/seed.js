/**
 * Starter workspace for the Coding Agent product demo.
 */

export const SEED_FILES = [
  {
    path: 'src/app.js',
    language: 'javascript',
    content: `import { greet } from './utils.js';

export function boot(name = 'world') {
  const message = greet(name);
  console.log(message);
  return message;
}

boot('gd5');
`,
  },
  {
    path: 'src/utils.js',
    language: 'javascript',
    content: `/** @param {string} name */
export function greet(name) {
  return 'Hello, ' + name + '!';
}

export function add(a, b) {
  return a + b;
}
`,
  },
  {
    path: 'test/app.test.js',
    language: 'javascript',
    content: `import { add, greet } from '../src/utils.js';

export function runTests() {
  const checks = [
    greet('gd5') === 'Hello, gd5!',
    add(2, 3) === 5,
  ];
  return checks.every(Boolean);
}

console.log(runTests() ? 'ok' : 'fail');
`,
  },
  {
    path: 'README.md',
    language: 'markdown',
    content: `# Demo Workspace

Sample project for the **gd5 Coding Agent** product demo.

- Edit files in the center pane
- Chat with the agent on the right
- Watch todos, terminal, and diffs update as the agent works
`,
  },
  {
    path: 'package.json',
    language: 'json',
    content: `{
  "name": "gd5-agent-demo",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node test/app.test.js"
  }
}
`,
  },
];

export function languageForPath(path) {
  const p = String(path || '').toLowerCase();
  if (p.endsWith('.js') || p.endsWith('.mjs')) return 'javascript';
  if (p.endsWith('.ts') || p.endsWith('.tsx')) return 'typescript';
  if (p.endsWith('.json')) return 'json';
  if (p.endsWith('.md')) return 'markdown';
  if (p.endsWith('.css')) return 'css';
  if (p.endsWith('.html')) return 'html';
  return 'plaintext';
}

/** Build a Tree-friendly hierarchy from flat paths. */
export function pathsToTreeData(paths = []) {
  const root = { children: new Map() };

  for (const path of paths) {
    const parts = String(path).split('/').filter(Boolean);
    let cursor = root;
    parts.forEach((part, i) => {
      const key = parts.slice(0, i + 1).join('/');
      if (!cursor.children.has(part)) {
        cursor.children.set(part, {
          key,
          title: part,
          isLeaf: i === parts.length - 1,
          children: new Map(),
        });
      }
      cursor = cursor.children.get(part);
    });
  }

  const toNodes = (map) =>
    [...map.values()]
      .sort((a, b) => {
        if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1;
        return a.title.localeCompare(b.title);
      })
      .map((n) => ({
        key: n.key,
        title: n.title,
        children: n.isLeaf ? undefined : toNodes(n.children),
      }));

  return toNodes(root.children);
}
