/**
 * Midnight Archive — room content, items, puzzle constants.
 * Pure data; store owns mutable state.
 */

export const SAFE_CODE = '0417';
export const DOOR_CODE = 'ARCHIVE';

export const ITEMS = {
  note: {
    id: 'note',
    name: '皱巴巴的纸条',
    nameEn: 'Crumpled note',
    desc: '灯下找到的纸条：「指针停住时，保险箱才肯听。III。」',
  },
  volume: {
    id: 'volume',
    name: '第三卷摘录',
    nameEn: 'Volume III excerpt',
    desc: '「密码是时钟上的时与分，写成四位数字。」—— 午夜档案 · 卷三',
  },
  brass_key: {
    id: 'brass_key',
    name: '黄铜钥匙',
    nameEn: 'Brass key',
    desc: '保险箱里的小钥匙，钥匙齿上刻着细纹。似乎能开书桌抽屉。',
  },
  door_slip: {
    id: 'door_slip',
    name: '出门口令条',
    nameEn: 'Door code slip',
    desc: '抽屉深处的纸条：「出门口令：ARCHIVE」',
  },
};

/** Hotspot ids used by SceneComponent + store handlers */
export const HOTSPOTS = [
  {
    id: 'lamp',
    label: '台灯',
    x: 12,
    y: 38,
    w: 14,
    h: 28,
    hint: '一盏旧台灯',
  },
  {
    id: 'clock',
    label: '挂钟',
    x: 44,
    y: 8,
    w: 12,
    h: 16,
    hint: '墙上的挂钟停在某个时刻',
  },
  {
    id: 'bookshelf',
    label: '书架',
    x: 68,
    y: 18,
    w: 26,
    h: 52,
    hint: '一排尘封的档案卷册',
  },
  {
    id: 'painting',
    label: '油画',
    x: 28,
    y: 16,
    w: 18,
    h: 22,
    hint: '挂得不太正的风景画',
  },
  {
    id: 'safe',
    label: '保险箱',
    x: 31,
    y: 22,
    w: 12,
    h: 14,
    hint: '画后露出的小保险箱',
    requires: 'paintingMoved',
  },
  {
    id: 'desk',
    label: '书桌',
    x: 18,
    y: 58,
    w: 42,
    h: 28,
    hint: '沉重的橡木书桌',
  },
  {
    id: 'drawer',
    label: '抽屉',
    x: 28,
    y: 72,
    w: 16,
    h: 10,
    hint: '带锁的抽屉',
  },
  {
    id: 'door',
    label: '大门',
    x: 2,
    y: 22,
    w: 10,
    h: 58,
    hint: '唯一的出口，有电子锁',
  },
  {
    id: 'window',
    label: '窗户',
    x: 82,
    y: 12,
    w: 14,
    h: 24,
    hint: '雨夜窗外的街灯',
  },
];

export const INITIAL_FLAGS = {
  lampOn: false,
  paintingMoved: false,
  safeOpen: false,
  drawerOpen: false,
  doorUnlocked: false,
  escaped: false,
  readVolume: false,
};

export const INTRO_LOG = [
  '雨敲着窗。你醒在午夜档案室里——门从外面锁死了。',
  '桌上的空气发潮。找线索，拼出口令，逃出去。',
];
