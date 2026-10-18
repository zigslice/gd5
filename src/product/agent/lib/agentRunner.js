/**
 * Simulated coding-agent turn — exercises store updates end-to-end
 * (chat, todos, file edits, diff, terminal) without a real LLM.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Build a unified-ish diff snippet for DiffBlock.
 * @param {string} path
 * @param {string} before
 * @param {string} after
 */
export function makeUnifiedDiff(path, before, after) {
  const a = String(before || '').split('\n');
  const b = String(after || '').split('\n');
  const lines = [`--- a/${path}`, `+++ b/${path}`, `@@ -1,${a.length} +1,${b.length} @@`];
  // Simple full-file replace view (good enough for demo DiffBlock)
  for (const line of a) lines.push(`-${line}`);
  for (const line of b) lines.push(`+${line}`);
  return lines.join('\n');
}

/**
 * Default demo task: add a `shout` helper and wire it from app.js.
 */
export function planDemoEdit(store) {
  const utils = store.getFile('src/utils.js');
  const app = store.getFile('src/app.js');
  if (!utils || !app) return null;

  const nextUtils =
    utils.content.trimEnd() +
    `

/** Loud greeting */
export function shout(name) {
  return greet(name).toUpperCase();
}
`;

  const nextApp = app.content.includes("from './utils.js'")
    ? app.content
        .replace(
          "import { greet } from './utils.js';",
          "import { greet, shout } from './utils.js';"
        )
        .replace(
          '  const message = greet(name);',
          "  const message = shout(name);\n  // was: greet(name)"
        )
    : app.content;

  return {
    title: 'Add shout() and use it from boot()',
    steps: [
      {
        kind: 'think',
        text: '任务：给 utils 增加 shout()，并在 app.js 的 boot 里改用它。',
      },
      {
        kind: 'read',
        path: 'src/utils.js',
        text: '读取 src/utils.js',
      },
      {
        kind: 'edit',
        path: 'src/utils.js',
        before: utils.content,
        after: nextUtils,
        text: '在 utils.js 追加 shout()',
      },
      {
        kind: 'edit',
        path: 'src/app.js',
        before: app.content,
        after: nextApp,
        text: '更新 app.js 导入并调用 shout()',
      },
      {
        kind: 'test',
        text: '运行 node test/app.test.js',
        ok: true,
      },
    ],
  };
}

/**
 * Heuristic plan from user prompt (still simulated).
 * @param {ReturnType<import('./store.js').createAgentStore>} store
 * @param {string} prompt
 */
export function planFromPrompt(store, prompt) {
  const q = String(prompt || '').toLowerCase();
  if (
    q.includes('shout') ||
    q.includes('大写') ||
    q.includes('upper') ||
    q.includes('改') ||
    q.includes('fix') ||
    q.includes('add') ||
    q.trim().length > 0
  ) {
    return planDemoEdit(store);
  }
  return planDemoEdit(store);
}

/**
 * Run a planned agent turn against the store.
 * @param {object} store
 * @param {object} plan
 * @param {{ onStep?: (s:object)=>void }} [opts]
 */
export async function runAgentPlan(store, plan, opts = {}) {
  if (!plan) return;
  store.setRunning(true, 'running');
  store.setTodos([
    { key: 'understand', text: '理解任务', status: 'active' },
    { key: 'edit', text: '编辑相关文件', status: 'pending' },
    { key: 'verify', text: '运行检查', status: 'pending' },
  ]);
  store.appendTerminal(`$ agent run — ${plan.title}`);
  store.appendMessage({ role: 'assistant', text: plan.title, kind: 'plan' });

  try {
    for (const step of plan.steps) {
      opts.onStep?.(step);
      if (step.kind === 'think') {
        store.patchTodo('understand', { status: 'done' });
        store.patchTodo('edit', { status: 'active' });
        store.appendMessage({ role: 'assistant', text: step.text });
        await sleep(350);
      } else if (step.kind === 'read') {
        store.setActivePath(step.path);
        store.appendMessage({
          role: 'assistant',
          text: step.text || `Read ${step.path}`,
          kind: 'tool',
          meta: { tool: 'read_file', path: step.path },
        });
        store.appendTerminal(`$ read ${step.path}`);
        await sleep(400);
      } else if (step.kind === 'edit') {
        store.setActivePath(step.path);
        store.setDiff({
          path: step.path,
          language: store.languageForPath(step.path),
          unified: makeUnifiedDiff(step.path, step.before, step.after),
        });
        store.updateFileContent(step.path, step.after);
        store.appendMessage({
          role: 'assistant',
          text: step.text || `Edit ${step.path}`,
          kind: 'tool',
          meta: { tool: 'apply_patch', path: step.path },
        });
        store.appendTerminal(`$ apply_patch ${step.path}`);
        await sleep(500);
      } else if (step.kind === 'test') {
        store.patchTodo('edit', { status: 'done' });
        store.patchTodo('verify', { status: 'active' });
        store.setSideTab('terminal');
        store.appendTerminal('$ node test/app.test.js');
        await sleep(450);
        store.appendTerminal(step.ok ? 'ok' : 'fail');
        store.patchTodo('verify', { status: step.ok ? 'done' : 'pending' });
        store.appendMessage({
          role: 'assistant',
          text: step.ok
            ? '改动已应用，本地检查通过。可在 Diff 面板查看补丁，或继续提需求。'
            : '检查未通过，请继续描述期望行为。',
        });
      }
    }
    store.setRunning(false, 'idle');
  } catch (err) {
    store.appendTerminal(`! agent error: ${err?.message || err}`);
    store.appendMessage({
      role: 'assistant',
      text: `执行失败：${err?.message || err}`,
    });
    store.setRunning(false, 'error');
  }
}

/**
 * @param {object} store
 * @param {string} prompt
 */
export async function runUserPrompt(store, prompt) {
  const text = String(prompt || '').trim();
  if (!text) return;
  store.appendMessage({ role: 'user', text });
  const plan = planFromPrompt(store, text);
  await runAgentPlan(store, plan);
}
