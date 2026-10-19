/**
 * 岛内防御模拟。纯数据，画面只负责把它画出来。
 *
 * 流程：先布防（左侧选兵种，点岛面放置，人数有上限），再开始回合。
 * 敌船只朝码头这一个入口开，靠岸后步兵上岸，和岛上的兵对打。
 */

import { SKILLS, TROOPS, troopDamage, troopHp } from './world.js';

/** 一座岛同时能站多少个兵。满了任何兵种都不能再放。 */
export const GARRISON_CAP = 4;
/** 船停靠的海面点，在岛外。 */
export const DOCK = { x: 0, z: 2.55 };
/** 步兵下船后踏上岛的唯一入口。 */
export const LANDING = { x: 0, z: 1.28 };
/** 兵只能站在岛面上。 */
export const ISLAND_R = 1.78;

const HOUSE_LAYOUT = [
  { x: -0.85, z: -0.15 },
  { x: 0.85, z: -0.1 },
  { x: 0.05, z: 0.7 },
  { x: -1.35, z: 0.62 },
];

/**
 * @param {number} x
 * @param {number} z
 */
export function clampIsland(x, z) {
  const radius = Math.hypot(x, z);
  if (radius <= ISLAND_R) return { x, z };
  const scale = ISLAND_R / (radius || 1);
  return { x: x * scale, z: z * scale };
}

/**
 * @param {object} island
 * @param {object} state
 */
export function createBattle(island, state) {
  const count = Math.max(1, Math.min(HOUSE_LAYOUT.length, island.houses || 1));
  return {
    islandId: island.id,
    houses: HOUSE_LAYOUT.slice(0, count).map((point, index) => ({
      id: `h${index}`,
      x: point.x,
      z: point.z,
      hp: 58,
      maxHp: 58,
    })),
    units: [],
    boats: [],
    npcs: [],
    shots: [],
    wave: 0,
    waveCount: Math.min(3, island.row + 1),
    perWave: Math.min(4, 2 + island.row),
    boatsToLaunch: 0,
    nextLaunch: 0,
    nextWave: 0.45,
    elapsed: 0,
    slow: 0,
    status: 'deploy',
    serial: 1,
    row: island.row,
    level: state.level,
  };
}

function nearestLiving(list, npc) {
  let best = null;
  let bestDist = Infinity;
  for (const item of list) {
    if (item.hp <= 0) continue;
    const dist = Math.hypot(item.x - npc.x, item.z - npc.z);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}

function makeBoat(battle, slot) {
  const spread = slot - (battle.perWave - 1) / 2;
  return {
    id: `boat${battle.serial++}`,
    x: spread * 0.78,
    z: 3.7,
    slot,
  };
}

function disembark(battle, boat) {
  const row = battle.row || 1;
  const side = ((boat.slot % 3) - 1) * 0.28;
  const hp = 32 + row * 6;
  battle.npcs.push({
    id: `n${battle.serial++}`,
    x: LANDING.x + side,
    z: LANDING.z,
    hp,
    maxHp: hp,
    speed: 0.48 + row * 0.03,
    damage: 6 + row,
  });
}

/**
 * @param {ReturnType<typeof createBattle>} battle
 * @param {object} state
 * @param {number} dt
 */
export function tickBattle(battle, state, dt) {
  if (!battle || battle.status !== 'fight') return battle;
  const step = Math.min(0.05, Math.max(0, dt));
  battle.elapsed += step;
  if (battle.slow > 0) battle.slow = Math.max(0, battle.slow - step);

  if (state?.cooldowns) {
    for (const key of Object.keys(state.cooldowns)) {
      state.cooldowns[key] = Math.max(0, state.cooldowns[key] - step);
    }
  }

  if (battle.wave < battle.waveCount) {
    battle.nextWave -= step;
    if (battle.nextWave <= 0) {
      battle.wave += 1;
      battle.boatsToLaunch = battle.perWave;
      battle.nextWave = 9;
      battle.nextLaunch = 0.15;
    }
  }

  if (battle.boatsToLaunch > 0) {
    battle.nextLaunch -= step;
    if (battle.nextLaunch <= 0) {
      const slot = battle.perWave - battle.boatsToLaunch;
      battle.boats.push(makeBoat(battle, slot));
      battle.boatsToLaunch -= 1;
      battle.nextLaunch = 0.9;
    }
  }

  const slow = battle.slow > 0 ? SKILLS.ebb.slow : 1;
  const boatSpeed = 0.95 * slow;
  for (const boat of battle.boats) {
    const dx = DOCK.x - boat.x;
    const dz = DOCK.z - boat.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    if (dist <= boatSpeed * step + 0.06) {
      disembark(battle, boat);
      boat.done = true;
    } else {
      boat.x += (dx / dist) * boatSpeed * step;
      boat.z += (dz / dist) * boatSpeed * step;
    }
  }
  battle.boats = battle.boats.filter((boat) => !boat.done);

  for (const npc of battle.npcs) {
    const unit = nearestLiving(battle.units, npc);
    const target = unit || nearestLiving(battle.houses, npc);
    if (!target) continue;
    const reach = unit ? 0.42 : 0.32;
    const dx = target.x - npc.x;
    const dz = target.z - npc.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    if (dist < reach) {
      target.hp -= npc.damage * step;
    } else {
      const move = npc.speed * slow * step;
      npc.x += (dx / dist) * move;
      npc.z += (dz / dist) * move;
    }
  }
  for (const house of battle.houses) {
    if (house.hp < 0) house.hp = 0;
  }

  for (const unit of battle.units) {
    if (unit.hp <= 0) continue;
    unit.cool -= step;
    let target = null;
    let targetDist = unit.range;
    for (const npc of battle.npcs) {
      const dist = Math.hypot(npc.x - unit.x, npc.z - unit.z);
      if (dist <= targetDist) {
        target = npc;
        targetDist = dist;
      }
    }
    if (!target || unit.cool > 0) continue;
    if (unit.splash) {
      for (const npc of battle.npcs) {
        if (Math.hypot(npc.x - target.x, npc.z - target.z) <= unit.splash) npc.hp -= unit.damage;
      }
    } else {
      target.hp -= unit.damage;
    }
    unit.cool = unit.interval;
    battle.shots.push({
      x: unit.x,
      z: unit.z,
      tx: target.x,
      tz: target.z,
      life: 0.16,
    });
  }

  battle.npcs = battle.npcs.filter((npc) => npc.hp > 0);
  battle.units = battle.units.filter((unit) => unit.hp > 0);
  if (state?.selectedUnitId && !battle.units.some((unit) => unit.id === state.selectedUnitId)) {
    state.selectedUnitId = null;
  }
  battle.shots = battle.shots.filter((shot) => {
    shot.life -= step;
    return shot.life > 0;
  });

  if (!battle.houses.some((house) => house.hp > 0)) {
    battle.status = 'lost';
    return battle;
  }
  const incoming = battle.wave < battle.waveCount || battle.boatsToLaunch > 0 || battle.boats.length > 0;
  if (!incoming && battle.npcs.length === 0) battle.status = 'won';
  return battle;
}

function makeUnit(battle, state, kind, x, z) {
  const spec = TROOPS[kind];
  const hp = troopHp(kind, state);
  const spot = clampIsland(x, z);
  return {
    id: `u${battle.serial++}`,
    kind,
    x: spot.x,
    z: spot.z,
    hp,
    maxHp: hp,
    damage: troopDamage(kind, state),
    range: spec.range,
    interval: spec.interval,
    splash: spec.splash || 0,
    cool: 0.15,
    color: spec.color,
  };
}

/**
 * 布防阶段把选中的兵种放到岛面上。人数到上限后，任何兵种都不能再放。
 * @param {object} state
 * @param {number} x
 * @param {number} z
 */
export function deployAt(state, x, z) {
  const battle = state.battle;
  const kind = state.selectedTroop;
  const spec = TROOPS[kind];
  if (!battle || battle.status !== 'deploy') return { ok: false, reason: '回合已经开始，不能再部署' };
  if (!spec) return { ok: false, reason: '先在左侧选择兵种' };
  if (state.level < spec.unlockLevel) return { ok: false, reason: `${spec.name}需要 ${spec.unlockLevel} 级` };
  if ((state.cooldowns?.[kind] || 0) > 0) {
    return { ok: false, reason: `${spec.name}还在冷却，回海图点刷新前线后才能再用` };
  }
  if (battle.units.length >= GARRISON_CAP) return { ok: false, reason: '这座岛已满，不能再部署' };
  const unit = makeUnit(battle, state, kind, x, z);
  battle.units.push(unit);
  if (state.selectedUnitId) state.selectedUnitId = null;
  return { ok: true, unit };
}

/**
 * @param {object} state
 * @param {string} unitId
 * @param {number} x
 * @param {number} z
 */
export function moveUnit(state, unitId, x, z) {
  const battle = state.battle;
  if (!battle || (battle.status !== 'deploy' && battle.status !== 'fight')) {
    return { ok: false, reason: '现在不能调动' };
  }
  const unit = battle.units.find((item) => item.id === unitId);
  if (!unit) return { ok: false, reason: '没有这个兵' };
  const spot = clampIsland(x, z);
  unit.x = spot.x;
  unit.z = spot.z;
  return { ok: true, unit };
}

/**
 * 布防结束，敌船开始分批朝码头开。
 * @param {object} state
 */
export function beginRound(state) {
  const battle = state.battle;
  if (!battle || battle.status !== 'deploy') return { ok: false, reason: '现在不能开始回合' };
  if (!battle.units.length) return { ok: false, reason: '先部署至少一个兵种' };
  battle.status = 'fight';
  battle.nextWave = 0.45;
  const used = new Set(battle.units.map((unit) => unit.kind));
  for (const kind of used) {
    const spec = TROOPS[kind];
    state.cooldowns[kind] = Math.max(state.cooldowns[kind] || 0, spec.cooldown);
  }
  return { ok: true };
}

/**
 * @param {object} state
 * @param {string} skillId
 */
export function castSkill(state, skillId) {
  const battle = state.battle;
  const spec = SKILLS[skillId];
  if (!battle || battle.status !== 'fight') return { ok: false, reason: '回合开始后才能放技能' };
  if (!spec) return { ok: false, reason: '没有这个技能' };
  if ((state.cooldowns[skillId] || 0) > 0) return { ok: false, reason: `${spec.name}冷却中` };
  if (skillId === 'ebb') {
    battle.slow = spec.duration;
  } else if (skillId === 'flare') {
    const damage = spec.damage * (1 + 0.18 * (state.level - 1));
    for (const npc of battle.npcs) npc.hp -= damage;
    battle.npcs = battle.npcs.filter((npc) => npc.hp > 0);
  }
  state.cooldowns[skillId] = spec.cooldown;
  return { ok: true };
}
