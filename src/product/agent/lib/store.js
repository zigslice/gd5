/**
 * Coding Agent workspace store — files, chat, todos, terminal, diffs.
 */

import { SEED_FILES, languageForPath, pathsToTreeData } from './seed.js';

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function snapshotFrom(state) {
  return {
    files: clone(state.files),
    openTabs: [...state.openTabs],
    activePath: state.activePath,
    messages: clone(state.messages),
    todos: clone(state.todos),
    terminal: [...state.terminal],
    diff: state.diff ? clone(state.diff) : null,
    running: state.running,
    status: state.status,
    sideTab: state.sideTab,
  };
}

/**
 * @param {object} [initial]
 */
export function createAgentStore(initial = {}) {
  const files = clone(initial.files || SEED_FILES);
  const first = files[0]?.path || null;

  /** @type {any} */
  let state = {
    files,
    openTabs: first ? [first] : [],
    activePath: first,
    messages: clone(
      initial.messages || [
        {
          id: 'm0',
          role: 'assistant',
          text: '我是 gd5 Coding Agent。描述你想改的代码，我会读写文件、更新 to-dos，并给出 diff。',
          at: Date.now(),
        },
      ]
    ),
    todos: clone(
      initial.todos || [
        { key: 'orient', text: '了解工作区文件结构', status: 'done' },
        { key: 'wait', text: '等待用户任务', status: 'active' },
        { key: 'ship', text: '应用改动并验证', status: 'pending' },
      ]
    ),
    terminal: clone(initial.terminal || ['$ ready — coding agent workspace']),
    diff: initial.diff || null,
    running: false,
    status: 'idle',
    sideTab: 'todos',
  };

  const listeners = new Set();

  const emit = () => {
    const snap = getState();
    listeners.forEach((fn) => fn(snap));
  };

  function getState() {
    return snapshotFrom(state);
  }

  function subscribe(fn) {
    listeners.add(fn);
    fn(getState());
    return () => listeners.delete(fn);
  }

  function getFile(path) {
    return state.files.find((f) => f.path === path) || null;
  }

  function setActivePath(path) {
    if (!path) return;
    if (!state.openTabs.includes(path)) state.openTabs = [...state.openTabs, path];
    state.activePath = path;
    emit();
  }

  function closeTab(path) {
    state.openTabs = state.openTabs.filter((p) => p !== path);
    if (state.activePath === path) {
      state.activePath = state.openTabs[state.openTabs.length - 1] || null;
    }
    emit();
  }

  function updateFileContent(path, content, { language } = {}) {
    const idx = state.files.findIndex((f) => f.path === path);
    if (idx < 0) {
      state.files.push({
        path,
        language: language || languageForPath(path),
        content: String(content ?? ''),
      });
    } else {
      state.files[idx] = {
        ...state.files[idx],
        content: String(content ?? ''),
        language: language || state.files[idx].language || languageForPath(path),
      };
    }
    emit();
  }

  function upsertFile(file) {
    updateFileContent(file.path, file.content, { language: file.language });
    setActivePath(file.path);
  }

  function appendMessage(msg) {
    state.messages = [
      ...state.messages,
      {
        id: msg.id || uid('msg'),
        role: msg.role || 'assistant',
        text: String(msg.text || ''),
        kind: msg.kind || 'text',
        meta: msg.meta || null,
        at: msg.at || Date.now(),
      },
    ];
    emit();
    return state.messages[state.messages.length - 1];
  }

  function setTodos(todos) {
    state.todos = clone(todos || []);
    emit();
  }

  function patchTodo(key, patch) {
    state.todos = state.todos.map((t) => (t.key === key ? { ...t, ...patch } : t));
    emit();
  }

  function appendTerminal(line) {
    state.terminal = [...state.terminal, String(line)];
    if (state.terminal.length > 200) state.terminal = state.terminal.slice(-200);
    emit();
  }

  function setDiff(diff) {
    state.diff = diff ? clone(diff) : null;
    if (diff) state.sideTab = 'diff';
    emit();
  }

  function setSideTab(tab) {
    state.sideTab = tab;
    emit();
  }

  function setRunning(running, status) {
    state.running = !!running;
    if (status != null) state.status = status;
    emit();
  }

  function treeData() {
    return pathsToTreeData(state.files.map((f) => f.path));
  }

  return {
    getState,
    subscribe,
    getFile,
    setActivePath,
    closeTab,
    updateFileContent,
    upsertFile,
    appendMessage,
    setTodos,
    patchTodo,
    appendTerminal,
    setDiff,
    setSideTab,
    setRunning,
    treeData,
    languageForPath,
  };
}

export { languageForPath, pathsToTreeData, SEED_FILES };
