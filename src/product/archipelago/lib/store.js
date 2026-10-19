/**
 * 潮前线 store。地图页和岛内页共用这一份。
 */

import { beginRound, castSkill, createBattle, deployAt, moveUnit, tickBattle, GARRISON_CAP } from './battle.js';
import {
  TROOPS,
  createCampaignState,
  defendSuccess,
  enterReason,
  markLost,
  refreshFront,
  tickPressure,
  upgradeLevel,
  upgradeTroop,
} from './world.js';

/**
 * @param {object} state
 */
function signature(state) {
  const cooldowns = Object.entries(state.cooldowns)
    .map(([key, value]) => `${key}:${value.toFixed(1)}`)
    .join(',');
  const islands = Object.values(state.islands)
    .map((island) => `${island.id}:${island.status}:${Math.floor(island.pressure)}`)
    .join('|');
  const battle = state.battle;
  const fight = battle
    ? [
        battle.status,
        battle.wave,
        battle.boats.length,
        battle.npcs.length,
        battle.units.length,
        state.selectedUnitId || '',
        battle.houses.map((house) => Math.ceil(house.hp)).join('.'),
        battle.slow > 0 ? 1 : 0,
      ].join(',')
    : '';
  return [
    state.phase,
    state.frontRow,
    state.gold,
    state.level,
    state.selectedId,
    state.selectedTroop,
    state.troopRank.bulwark,
    state.troopRank.archer,
    state.troopRank.cannon,
    state.message,
    state.notice,
    cooldowns,
    islands,
    fight,
  ].join('#');
}

export function createTideStore() {
  let state = createCampaignState();
  let lastSig = signature(state);
  const listeners = new Set();

  function emit(force = false) {
    const sig = signature(state);
    if (!force && sig === lastSig) return;
    lastSig = sig;
    const snap = state;
    listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch {
        /* ignore */
      }
    });
  }

  function finishIfNeeded() {
    const battle = state.battle;
    if (!battle || battle.status === 'fight' || battle.status === 'deploy') return;
    const islandId = battle.islandId;
    if (battle.status === 'won') {
      state.battle = null;
      defendSuccess(state, islandId);
      return;
    }
    state.battle = null;
    state.phase = 'map';
    markLost(state, islandId);
  }

  return {
    getState() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    tick(dt) {
      if (state.phase === 'map') {
        tickPressure(state, dt);
        emit(false);
        return;
      }
      if (state.phase === 'battle' && state.battle) {
        tickBattle(state.battle, state, dt);
        finishIfNeeded();
        emit(false);
      }
    },

    selectIsland(id) {
      if (!state.islands[id] || state.phase !== 'map') return;
      state.selectedId = id;
      emit(true);
    },

    selectTroop(kind) {
      if (!TROOPS[kind]) return;
      state.selectedTroop = kind;
      state.selectedUnitId = null;
      if (state.phase === 'battle' && state.battle?.status === 'deploy') {
        state.message = `已选${TROOPS[kind].name}。点岛面，让它站到那里。`;
      }
      emit(true);
    },

    enter(id) {
      const reason = enterReason(state, id);
      if (reason) {
        state.message = reason;
        emit(true);
        return { ok: false, reason };
      }
      state.battle = createBattle(state.islands[id], state);
      state.phase = 'battle';
      state.playerAt = id;
      state.selectedId = id;
      state.selectedUnitId = null;
      state.message = `已进入${state.islands[id].name}。左侧选兵种，再点岛面放置。这座岛最多 ${GARRISON_CAP} 个兵，满了就不能再放。敌人只会从码头上岸。`;
      emit(true);
      return { ok: true };
    },

    pickUnit(id) {
      const unit = state.battle?.units.find((item) => item.id === id);
      if (!unit) return { ok: false };
      state.selectedUnitId = id;
      state.message = `选中${TROOPS[unit.kind].name}。点岛上的地面，把它调过去。`;
      emit(true);
      return { ok: true };
    },

    ground(x, z) {
      if (state.selectedUnitId) {
        const result = moveUnit(state, state.selectedUnitId, x, z);
        state.message = result.ok ? '兵已经站到新的位置。' : result.reason;
        emit(true);
        return result;
      }
      const result = deployAt(state, x, z);
      const battle = state.battle;
      state.message = result.ok
        ? `${TROOPS[result.unit.kind].name}站上了岛。${battle.units.length}/${GARRISON_CAP}`
        : result.reason;
      emit(true);
      return result;
    },

    startRound() {
      const result = beginRound(state);
      state.message = result.ok
        ? '回合开始。敌船分批开向码头，上岸后和你的兵对打。点自己的兵，再点地面，可以调动。'
        : result.reason;
      emit(true);
      return result;
    },

    leave() {
      if (state.phase !== 'battle' || !state.battle || state.battle.status !== 'deploy') {
        return { ok: false, reason: '回合已经开始' };
      }
      const name = state.islands[state.battle.islandId]?.name || '这座岛';
      state.battle = null;
      state.phase = 'map';
      state.selectedUnitId = null;
      state.message = `已离开${name}。布防取消，岛还没有开打。`;
      emit(true);
      return { ok: true };
    },

    cast(skillId) {
      const result = castSkill(state, skillId);
      state.message = result.ok ? '技能已释放，进入冷却。' : result.reason;
      emit(true);
      return result;
    },

    retreat() {
      if (state.phase !== 'battle' || !state.battle) return { ok: false };
      if (state.battle.status === 'deploy') return this.leave();
      const islandId = state.battle.islandId;
      state.battle = null;
      state.phase = 'map';
      state.selectedUnitId = null;
      markLost(state, islandId);
      emit(true);
      return { ok: true };
    },

    refresh() {
      if (state.phase !== 'map') return { ok: false, reason: '岛内不能刷新前线' };
      const result = refreshFront(state);
      emit(true);
      return { ok: true, ...result };
    },

    upgradeLevel() {
      const result = upgradeLevel(state);
      if (!result.ok) state.message = result.reason;
      emit(true);
      return result;
    },

    upgradeTroop(kind) {
      const result = upgradeTroop(state, kind);
      if (!result.ok) state.message = result.reason;
      emit(true);
      return result;
    },

    reset() {
      state = createCampaignState();
      lastSig = '';
      emit(true);
    },
  };
}

let singleton = null;

export function getTideStore() {
  if (!singleton) singleton = createTideStore();
  return singleton;
}
