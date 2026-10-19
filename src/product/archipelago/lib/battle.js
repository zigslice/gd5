/**
 * 岛内防御模拟。纯数据，画面只负责把它画出来。
 */

import { SKILLS, TROOPS, troopDamage, troopHp } from './world.js';

const HOUSE_LAYOUT = [
  { x: -0.85, z: -0.15 },
  { x: 0.85, z: -0.1 },
  { x: 0.05, z: 0.7 },
  { x: -1.35, z: 0.62 },
];

const PAD_LAYOUT = [
  { x: -1.2, z: 0.25 },
  { x: 1.2, z: 0.25 },
  { x: 0, z: 1.05 },
  { x: 0, z: -0.85 },
];

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
    pads: PAD_LAYOUT.map((point, index) => ({
      id: index,
      x: point.x,
      z: point.z,
      unitId: null,
    })),
    units: [],
    npcs: [],
    shots: [],
    wave: 0,
    waveCount: Math.min(3, island.row + 1),
    perWave: Math.min(4, 2 + island.row),
    spawnLeft: 0,
    nextSpawn: 0,
    nextWave: 1.4,
    elapsed: 0,
    slow: 0,
    status: 'fight',
    serial: 1,
    row: island.row,
    level: state.level,
  };
}

function nearestLiving(houses, npc) {
  let best = null;
  let bestDist = Infinity;
  for (const house of houses) {
    if (house.hp <= 0) continue;
    const dist = Math.hypot(house.x - npc.x, house.z - npc.z);
    if (dist < bestDist) {
      best = house;
      bestDist = dist;
    }
  }
  return best;
}

function makeNpc(battle, index) {
  const row = battle.row || 1;
  const spread = (index % battle.perWave) - (battle.perWave - 1) / 2;
  return {
    id: `n${battle.serial++}`,
    x: spread * 0.55,
    z: 2.35,
    hp: 20 + row * 7,
    maxHp: 20 + row * 7,
    speed: 0.52 + row * 0.04,
    damage: 6 + row,
  };
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
      battle.spawnLeft = battle.perWave;
      battle.nextWave = 8.5;
      battle.nextSpawn = 0;
    }
  }

  if (battle.spawnLeft > 0) {
    battle.nextSpawn -= step;
    if (battle.nextSpawn <= 0) {
      battle.npcs.push(makeNpc(battle, battle.perWave - battle.spawnLeft));
      battle.spawnLeft -= 1;
      battle.nextSpawn = 0.65;
    }
  }

  const slow = battle.slow > 0 ? SKILLS.ebb.slow : 1;
  for (const npc of battle.npcs) {
    const house = nearestLiving(battle.houses, npc);
    if (!house) continue;
    const dx = house.x - npc.x;
    const dz = house.z - npc.z;
    const dist = Math.hypot(dx, dz) || 0.0001;
    if (dist < 0.32) {
      house.hp -= npc.damage * step;
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
  battle.shots = battle.shots.filter((shot) => {
    shot.life -= step;
    return shot.life > 0;
  });

  if (!battle.houses.some((house) => house.hp > 0)) {
    battle.status = 'lost';
    return battle;
  }
  const spawning = battle.wave < battle.waveCount || battle.spawnLeft > 0;
  if (!spawning && battle.npcs.length === 0) battle.status = 'won';
  return battle;
}

/**
 * @param {object} state
 * @param {number} padId
 */
export function deployUnit(state, padId) {
  const battle = state.battle;
  const kind = state.selectedTroop;
  const spec = TROOPS[kind];
  if (!battle || battle.status !== 'fight') return { ok: false, reason: '不在战斗中' };
  if (!spec) return { ok: false, reason: '没有这个兵种' };
  if (state.level < spec.unlockLevel) return { ok: false, reason: `${spec.name}需要 ${spec.unlockLevel} 级` };
  if ((state.cooldowns[kind] || 0) > 0) return { ok: false, reason: `${spec.name}冷却中` };
  const pad = battle.pads.find((item) => item.id === padId);
  if (!pad) return { ok: false, reason: '没有这个部署点' };
  if (pad.unitId) return { ok: false, reason: '这里已经有兵' };
  const unit = {
    id: `u${battle.serial++}`,
    kind,
    padId,
    x: pad.x,
    z: pad.z,
    hp: troopHp(kind, state),
    damage: troopDamage(kind, state),
    range: spec.range,
    interval: spec.interval,
    splash: spec.splash || 0,
    cool: 0.15,
    color: spec.color,
  };
  battle.units.push(unit);
  pad.unitId = unit.id;
  state.cooldowns[kind] = spec.cooldown;
  return { ok: true, unit };
}

/**
 * @param {object} state
 * @param {string} skillId
 */
export function castSkill(state, skillId) {
  const battle = state.battle;
  const spec = SKILLS[skillId];
  if (!battle || battle.status !== 'fight') return { ok: false, reason: '不在战斗中' };
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
