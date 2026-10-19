/**
 * 潮前线 — 战役规则（无 DOM / 无 three）。
 *
 * 岛屿按排排开，航线相连。玩家逐岛进入防御。
 * 兵种和技能有冷却，地图上冷却不自己流逝，只有「刷新前线」会清空。
 * 刷新同时把前线推进到最近一次防御成功的岛的前一排。
 * 当前前线这一排若全部失守，已防御成功的岛会重新丢失。
 */

export const HOME_ID = 'home';
export const MAX_ROW = 4;
export const PRESSURE_MAX = 100;
/** 地图上，当前前线未防御岛屿每秒积累的攻势 */
export const PRESSURE_RATE = 6;

/** @typedef {'held'|'open'|'locked'|'lost'} IslandStatus */

export const TROOPS = {
  bulwark: {
    id: 'bulwark',
    name: '礁盾',
    blurb: '贴着房子的近战，血厚。',
    cooldown: 11,
    range: 1.35,
    damage: 9,
    interval: 0.75,
    hp: 90,
    unlockLevel: 1,
    color: 0x3d7ea6,
  },
  archer: {
    id: 'archer',
    name: '哨箭',
    blurb: '射程远，适合压海滩。',
    cooldown: 8,
    range: 3.4,
    damage: 7,
    interval: 0.55,
    hp: 36,
    unlockLevel: 1,
    color: 0xe07a2f,
  },
  cannon: {
    id: 'cannon',
    name: '潮炮',
    blurb: '溅射，2 级解锁。',
    cooldown: 15,
    range: 2.7,
    damage: 12,
    interval: 1.15,
    hp: 48,
    unlockLevel: 2,
    splash: 0.85,
    color: 0x243042,
  },
};

export const SKILLS = {
  ebb: {
    id: 'ebb',
    name: '退潮',
    blurb: '全场敌人减速数秒。',
    cooldown: 13,
    duration: 3.5,
    slow: 0.42,
  },
  flare: {
    id: 'flare',
    name: '灯塔',
    blurb: '对场上所有敌人造成一次伤害。',
    cooldown: 16,
    damage: 16,
  },
};

export const COOLDOWN_KEYS = [...Object.keys(TROOPS), ...Object.keys(SKILLS)];

const DEFS = [
  { id: 'home', name: '母港', row: 0, x: 0, z: 5.4, houses: 0 },
  { id: 'a1', name: '沙岬', row: 1, x: -3.5, z: 2.7, houses: 2 },
  { id: 'a2', name: '盐滩', row: 1, x: 3.5, z: 2.7, houses: 2 },
  { id: 'b1', name: '礁门', row: 2, x: -4.8, z: -0.15, houses: 3 },
  { id: 'b2', name: '潮心', row: 2, x: 0, z: -0.55, houses: 3 },
  { id: 'b3', name: '东屿', row: 2, x: 4.8, z: 0.05, houses: 2 },
  { id: 'c1', name: '雾港', row: 3, x: -2.5, z: -3.35, houses: 3 },
  { id: 'c2', name: '黑礁', row: 3, x: 2.7, z: -3.5, houses: 3 },
  { id: 'd1', name: '远灯', row: 4, x: 0.15, z: -6.15, houses: 4 },
];

const ROUTES = [
  ['home', 'a1'],
  ['home', 'a2'],
  ['a1', 'a2'],
  ['a1', 'b1'],
  ['a1', 'b2'],
  ['a2', 'b2'],
  ['a2', 'b3'],
  ['b1', 'b2'],
  ['b2', 'b3'],
  ['b1', 'c1'],
  ['b2', 'c1'],
  ['b2', 'c2'],
  ['b3', 'c2'],
  ['c1', 'c2'],
  ['c1', 'd1'],
  ['c2', 'd1'],
];

function emptyCooldowns() {
  const cooldowns = {};
  for (const key of COOLDOWN_KEYS) cooldowns[key] = 0;
  return cooldowns;
}

function buildIslands() {
  /** @type {Record<string, any>} */
  const islands = {};
  for (const def of DEFS) {
    islands[def.id] = {
      ...def,
      links: [],
      status: def.id === HOME_ID ? 'held' : 'locked',
      pressure: 0,
    };
  }
  for (const [a, b] of ROUTES) {
    islands[a].links.push(b);
    islands[b].links.push(a);
  }
  return islands;
}

export function levelCost(level) {
  return 36 + (level - 1) * 24;
}

export function troopCost(rank) {
  return 22 + (rank - 1) * 16;
}

export function troopDamage(kind, state) {
  const spec = TROOPS[kind];
  const rank = state.troopRank[kind] || 1;
  return spec.damage * (1 + 0.22 * (state.level - 1)) * (1 + 0.28 * (rank - 1));
}

export function troopHp(kind, state) {
  const spec = TROOPS[kind];
  const rank = state.troopRank[kind] || 1;
  return spec.hp * (1 + 0.18 * (state.level - 1)) * (1 + 0.22 * (rank - 1));
}

export function createCampaignState() {
  const state = {
    islands: buildIslands(),
    frontRow: 1,
    latestHeldId: HOME_ID,
    playerAt: HOME_ID,
    selectedId: 'a1',
    phase: 'map',
    gold: 40,
    level: 1,
    troopRank: { bulwark: 1, archer: 1, cannon: 1 },
    cooldowns: emptyCooldowns(),
    selectedTroop: 'archer',
    message: '沿航线进入第一排。地图上的冷却不会自己结束，要按「刷新前线」。',
    notice: '',
    battle: null,
  };
  return syncAccess(state);
}

/**
 * 已防御或失守的岛保持原状。
 * 其余岛：排数不超过前线、且有航线连到已防御岛时，变为可进入。
 * @param {ReturnType<typeof createCampaignState>} state
 */
export function syncAccess(state) {
  for (const island of Object.values(state.islands)) {
    if (island.id === HOME_ID) {
      island.status = 'held';
      island.pressure = 0;
      continue;
    }
    if (island.status === 'held' || island.status === 'lost') continue;
    const linked = island.links.some((id) => state.islands[id].status === 'held');
    const next = island.row <= state.frontRow && linked ? 'open' : 'locked';
    if (next === 'locked') island.pressure = 0;
    island.status = next;
  }
  return state;
}

/**
 * @param {ReturnType<typeof createCampaignState>} state
 * @param {string} id
 * @returns {string} 空字符串表示可以进入
 */
export function enterReason(state, id) {
  const island = state.islands[id];
  if (!island || island.id === HOME_ID) return '母港不用进入';
  if (state.phase === 'battle') return '还在岛上';
  if (island.status === 'locked') return '航线没到，或这一排还在前线后面';
  if (island.status === 'lost') return '这座岛已经失守';
  if (island.status === 'held') return '已经防御成功';
  if (island.status !== 'open') return '现在不能进入';
  return '';
}

export function rewardFor(island) {
  return {
    gold: 22 + island.row * 14,
    xp: 8 + island.row * 6,
  };
}

/**
 * @param {ReturnType<typeof createCampaignState>} state
 * @param {string} id
 */
export function defendSuccess(state, id) {
  const island = state.islands[id];
  if (!island) return state;
  const reward = rewardFor(island);
  island.status = 'held';
  island.pressure = 0;
  state.latestHeldId = id;
  state.playerAt = id;
  state.selectedId = id;
  state.gold += reward.gold;
  state.phase = 'map';
  state.battle = null;
  state.notice = '';
  state.message = `${island.name}守住了，+${reward.gold} 金。它会变成已防御的颜色。冷却还在，刷新才会清空，并把前线推到它前面一排。`;
  return syncAccess(state);
}

/**
 * 清空全部冷却，并把前线推进到最近一次防御成功岛屿的前一排。
 * @param {ReturnType<typeof createCampaignState>} state
 */
export function refreshFront(state) {
  for (const key of COOLDOWN_KEYS) state.cooldowns[key] = 0;
  const latest = state.islands[state.latestHeldId];
  if (!latest || latest.id === HOME_ID) {
    state.message = '冷却已清空。还没有新的防御成功，前线停在第 1 排。';
    return { advanced: false, frontRow: state.frontRow };
  }
  const target = Math.min(MAX_ROW, latest.row + 1);
  const from = state.frontRow;
  state.frontRow = Math.max(state.frontRow, target);
  syncAccess(state);
  const advanced = state.frontRow > from;
  state.message = advanced
    ? `冷却已清空。前线推进到第 ${state.frontRow} 排，也就是${latest.name}前面的那一排。`
    : `冷却已清空。前线已经在${latest.name}前面的第 ${state.frontRow} 排。`;
  return { advanced, frontRow: state.frontRow };
}

/**
 * @param {ReturnType<typeof createCampaignState>} state
 */
export function collapseFront(state) {
  const lostNames = [];
  for (const island of Object.values(state.islands)) {
    if (island.id === HOME_ID) continue;
    if (island.status === 'held') lostNames.push(island.name);
    island.status = 'locked';
    island.pressure = 0;
  }
  state.frontRow = 1;
  state.latestHeldId = HOME_ID;
  state.playerAt = HOME_ID;
  state.selectedId = 'a1';
  state.phase = 'map';
  state.battle = null;
  syncAccess(state);
  const who = lostNames.length ? `已防御的岛重新丢失：${lostNames.join('、')}。` : '已防御的成果清空。';
  state.notice = `前线整排失守。${who}`;
  state.message = state.notice;
  return { collapsed: true, lostNames };
}

/**
 * 标记一座岛失守。若当前前线这一排已经全部失守，触发连锁丢失。
 * @param {ReturnType<typeof createCampaignState>} state
 * @param {string} id
 */
export function markLost(state, id) {
  const island = state.islands[id];
  if (!island || island.id === HOME_ID || island.status === 'lost') {
    return { collapsed: false };
  }
  island.status = 'lost';
  island.pressure = PRESSURE_MAX;
  const front = Object.values(state.islands).filter((item) => item.row === state.frontRow && item.id !== HOME_ID);
  const active = front.filter((item) => item.status !== 'locked');
  const allLost = active.length > 0 && active.every((item) => item.status === 'lost');
  if (!allLost) {
    state.message = `${island.name}失守。这一排还有岛没丢，已经守住的岛还在。`;
    return { collapsed: false };
  }
  return collapseFront(state);
}

/**
 * 只在地图上流逝。当前前线排、状态为 open 的岛积累攻势，满了则失守。
 * @param {ReturnType<typeof createCampaignState>} state
 * @param {number} dt
 */
export function tickPressure(state, dt) {
  if (state.phase !== 'map' || dt <= 0) return { lost: [], collapsed: false };
  /** @type {string[]} */
  const lost = [];
  let collapsed = false;
  const ids = Object.keys(state.islands);
  for (const id of ids) {
    const island = state.islands[id];
    if (island.status !== 'open' || island.row !== state.frontRow) continue;
    island.pressure = Math.min(PRESSURE_MAX, island.pressure + PRESSURE_RATE * dt);
    if (island.pressure >= PRESSURE_MAX && island.status === 'open') {
      const result = markLost(state, id);
      lost.push(id);
      collapsed = collapsed || result.collapsed;
      if (result.collapsed) break;
    }
  }
  return { lost, collapsed };
}

/**
 * @param {ReturnType<typeof createCampaignState>} state
 */
export function upgradeLevel(state) {
  const cost = levelCost(state.level);
  if (state.gold < cost) return { ok: false, reason: `升级需要 ${cost} 金` };
  state.gold -= cost;
  state.level += 1;
  state.message =
    state.level === 2
      ? '升到 2 级。兵种更强，潮炮解锁。'
      : `升到 ${state.level} 级。兵种伤害和生命提高。`;
  return { ok: true };
}

/**
 * @param {ReturnType<typeof createCampaignState>} state
 * @param {string} kind
 */
export function upgradeTroop(state, kind) {
  const spec = TROOPS[kind];
  if (!spec) return { ok: false, reason: '没有这个兵种' };
  if (state.level < spec.unlockLevel) return { ok: false, reason: `${spec.name}需要 ${spec.unlockLevel} 级` };
  const rank = state.troopRank[kind] || 1;
  if (rank >= 4) return { ok: false, reason: '已经满阶' };
  const cost = troopCost(rank);
  if (state.gold < cost) return { ok: false, reason: `升阶需要 ${cost} 金` };
  state.gold -= cost;
  state.troopRank[kind] = rank + 1;
  state.message = `${spec.name}升到 ${state.troopRank[kind]} 阶。`;
  return { ok: true };
}

export function islandRows(state) {
  const rows = [];
  for (let row = 0; row <= MAX_ROW; row += 1) {
    rows.push(Object.values(state.islands).filter((island) => island.row === row));
  }
  return rows;
}

export function statusLabel(status) {
  if (status === 'held') return '已防御';
  if (status === 'open') return '未防御';
  if (status === 'lost') return '失守';
  return '未抵达';
}
