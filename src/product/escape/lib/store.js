/**
 * Escape room store — inventory, flags, examine UI, narrative log.
 */

import {
  DOOR_CODE,
  HOTSPOTS,
  INITIAL_FLAGS,
  INTRO_LOG,
  ITEMS,
  SAFE_CODE,
} from './world.js';

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEscapeStore() {
  let state = {
    flags: { ...INITIAL_FLAGS },
    inventory: [],
    selectedItem: null,
    examine: null,
    log: INTRO_LOG.map((text) => ({ id: uid('log'), text })),
    moves: 0,
    status: 'playing', // playing | won
  };

  const listeners = new Set();

  function emit() {
    const snap = getState();
    listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch {
        /* ignore */
      }
    });
  }

  function getState() {
    return {
      flags: { ...state.flags },
      inventory: state.inventory.map((id) => ({ ...ITEMS[id], id })),
      selectedItem: state.selectedItem,
      examine: state.examine ? { ...state.examine } : null,
      log: state.log.map((e) => ({ ...e })),
      moves: state.moves,
      status: state.status,
      hotspots: HOTSPOTS.filter((h) => {
        if (h.requires && !state.flags[h.requires]) return false;
        if (h.id === 'safe' && !state.flags.paintingMoved) return false;
        return true;
      }),
    };
  }

  function pushLog(text) {
    state.log = [...state.log, { id: uid('log'), text }].slice(-40);
  }

  function hasItem(id) {
    return state.inventory.includes(id);
  }

  function giveItem(id) {
    if (!ITEMS[id] || hasItem(id)) return false;
    state.inventory = [...state.inventory, id];
    pushLog(`获得：${ITEMS[id].name}`);
    return true;
  }

  function bumpMove() {
    state.moves += 1;
  }

  function selectItem(id) {
    if (!id || !hasItem(id)) {
      state.selectedItem = null;
    } else {
      state.selectedItem = state.selectedItem === id ? null : id;
    }
    emit();
  }

  function closeExamine() {
    state.examine = null;
    emit();
  }

  function openExamine(payload) {
    state.examine = { ...payload };
    emit();
  }

  function reset() {
    state = {
      flags: { ...INITIAL_FLAGS },
      inventory: [],
      selectedItem: null,
      examine: null,
      log: INTRO_LOG.map((text) => ({ id: uid('log'), text })),
      moves: 0,
      status: 'playing',
    };
    emit();
  }

  function trySafeCode(code) {
    const normalized = String(code || '')
      .replace(/\s+/g, '')
      .trim();
    bumpMove();
    if (state.flags.safeOpen) {
      pushLog('保险箱已经打开了。');
      emit();
      return { ok: true, already: true };
    }
    if (normalized === SAFE_CODE) {
      state.flags.safeOpen = true;
      giveItem('brass_key');
      pushLog('咔哒——保险箱开了。里面躺着一把黄铜钥匙。');
      state.examine = {
        kind: 'text',
        title: '保险箱',
        body: '密码正确。你取走了黄铜钥匙。',
      };
      emit();
      return { ok: true };
    }
    pushLog('保险箱发出一声拒绝的嗡鸣。');
    emit();
    return { ok: false };
  }

  function tryDoorCode(code) {
    const normalized = String(code || '')
      .replace(/\s+/g, '')
      .trim()
      .toUpperCase();
    bumpMove();
    if (state.flags.escaped) {
      emit();
      return { ok: true, already: true };
    }
    if (normalized === DOOR_CODE) {
      state.flags.doorUnlocked = true;
      state.flags.escaped = true;
      state.status = 'won';
      pushLog('门锁绿灯闪了一下。雨声涌进来——你逃出了午夜档案室。');
      state.examine = null;
      emit();
      return { ok: true };
    }
    pushLog('电子锁闪红：口令错误。');
    emit();
    return { ok: false };
  }

  /**
   * Handle hotspot click. Returns { navigateWin?: true } when escape succeeds.
   */
  function interact(hotspotId) {
    if (state.status === 'won') return { done: true };

    const id = String(hotspotId || '');
    bumpMove();

    switch (id) {
      case 'lamp': {
        if (!state.flags.lampOn) {
          state.flags.lampOn = true;
          pushLog('你拧亮台灯。暖光铺开，灯座下露出一张皱纸条。');
          giveItem('note');
        } else {
          pushLog('台灯已经亮着。灯光把房间切成温暖与阴影。');
        }
        break;
      }
      case 'clock': {
        openExamine({
          kind: 'clock',
          title: '挂钟',
          body: '钟摆停住了。时针指向 4，分针指向 17。雨在窗外数着秒。',
          time: '4:17',
        });
        return {};
      }
      case 'bookshelf': {
        openExamine({
          kind: 'bookshelf',
          title: '档案书架',
          body: '尘封的卷册排成一墙。第三卷的书脊被摸得发亮。',
        });
        return {};
      }
      case 'painting': {
        if (!state.flags.paintingMoved) {
          state.flags.paintingMoved = true;
          pushLog('你把油画挪开——墙里嵌着一只小保险箱。');
        } else {
          pushLog('油画已经移到一边，保险箱露在外面。');
        }
        break;
      }
      case 'safe': {
        if (!state.flags.paintingMoved) {
          pushLog('墙上只有一幅画。');
          break;
        }
        if (state.flags.safeOpen) {
          openExamine({
            kind: 'text',
            title: '保险箱',
            body: '空的保险箱。黄铜钥匙你已经带走了。',
          });
          return {};
        }
        openExamine({
          kind: 'safe',
          title: '保险箱',
          body: '四位数字密码锁。转盘冰凉。',
        });
        return {};
      }
      case 'desk': {
        openExamine({
          kind: 'text',
          title: '书桌',
          body: state.flags.drawerOpen
            ? '抽屉开着。桌面空空，只剩潮湿的木纹。'
            : '沉重的橡木书桌。下方有一只上锁的抽屉。',
        });
        return {};
      }
      case 'drawer': {
        if (state.flags.drawerOpen) {
          pushLog('抽屉已经空了。');
          break;
        }
        if (state.selectedItem === 'brass_key' || hasItem('brass_key')) {
          if (state.selectedItem !== 'brass_key' && !hasItem('brass_key')) break;
          // Prefer selected key; also allow if key in inventory when clicking drawer
          if (!hasItem('brass_key')) {
            pushLog('抽屉锁着。需要合适的钥匙。');
            break;
          }
          state.flags.drawerOpen = true;
          state.selectedItem = null;
          giveItem('door_slip');
          pushLog('钥匙啮合，抽屉滑开。里面有一张出门口令条。');
          openExamine({
            kind: 'text',
            title: '书桌抽屉',
            body: '你找到了口令条：「出门口令：ARCHIVE」',
          });
          return {};
        }
        pushLog('抽屉锁着。需要合适的钥匙。');
        break;
      }
      case 'door': {
        if (state.flags.escaped) {
          return { navigateWin: true };
        }
        openExamine({
          kind: 'door',
          title: '出口大门',
          body: '冷铁门上嵌着电子锁。需要字母口令。',
        });
        return {};
      }
      case 'window': {
        openExamine({
          kind: 'text',
          title: '窗户',
          body: '雨夜。街灯在水洼里碎成金色。窗户焊死了——只有门能出去。',
        });
        return {};
      }
      default:
        pushLog('没什么特别的。');
    }

    emit();
    return {};
  }

  function takeVolume() {
    bumpMove();
    state.flags.readVolume = true;
    giveItem('volume');
    pushLog('你翻开第三卷，抄下关键句。');
    state.examine = {
      kind: 'text',
      title: '第三卷',
      body: ITEMS.volume.desc,
    };
    emit();
  }

  return {
    getState,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    selectItem,
    closeExamine,
    openExamine,
    interact,
    trySafeCode,
    tryDoorCode,
    takeVolume,
    reset,
    /** @internal test helpers */
    _debug: {
      SAFE_CODE,
      DOOR_CODE,
      hasItem: (id) => hasItem(id),
      giveItem: (id) => {
        giveItem(id);
        emit();
      },
      setFlag: (k, v) => {
        state.flags[k] = v;
        emit();
      },
    },
  };
}
