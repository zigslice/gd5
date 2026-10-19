/**
 * 潮前线 store。地图页和岛内页共用这一份。
 */

import { castSkill, createBattle, deployUnit, tickBattle } from './battle.js';
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
        battle.npcs.length,
        battle.units.length,
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
    if (!battle || battle.status === 'fight') return;
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
      state.message = `进入${state.islands[id].name}。选兵种，再点岛上的部署点。房子被攻破就会失守。`;
      emit(true);
      return { ok: true };
    },

    deploy(padId) {
      const result = deployUnit(state, padId);
      state.message = result.ok ? `部署了兵。这个兵种进入冷却。` : result.reason;
      emit(true);
      return result;
    },

    cast(skillId) {
      const result = castSkill(state, skillId);
      state.message = result.ok ? '技能已释放，进入冷却。' : result.reason;
      emit(true);
      return result;
    },

    retreat() {
      if (state.phase !== 'battle' || !state.battle) return { ok: false };
      const islandId = state.battle.islandId;
      state.battle = null;
      state.phase = 'map';
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
