import { Component, D, bind } from '../../../engine/index.js';
import { loadUi, Button, Tag, Text, Title, ProgressBar } from '../../../ui/index.js';
import { BattleView } from './BattleView.js';
import { MapView } from './MapView.js';
import { GARRISON_CAP } from '../lib/battle.js';
import { getTideStore } from '../lib/store.js';
import {
  SKILLS,
  TROOPS,
  enterReason,
  islandRows,
  levelCost,
  statusLabel,
  troopCost,
} from '../lib/world.js';

/**
 * 潮前线产品页：海图和岛内防御共用这一页，HUD 用组件库，3D 视图按阶段换上。
 */
export class TideGameComponent extends Component {
  static styles = new URL('./TideGameComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = getTideStore();
    this.mapView = new MapView({ store: this.store, logger: this.logger });
    this.battleView = new BattleView({ store: this.store, logger: this.logger });
    this._view = null;
    this._swap = 0;
    this._unsub = null;
  }

  async componentDidMount() {
    await loadUi();
    this.logger?.i('TideGameComponent mounted');
  }

  componentDidAttachEvents() {
    this._unsub = this.store.subscribe(() => this._syncHud());
    void this._show('map');
  }

  componentDidUnMount() {
    this._unsub?.();
    this._unsub = null;
    this._swap += 1;
    if (this.mapView.isMounted()) this.mapView.unmount();
    if (this.battleView.isMounted()) this.battleView.unmount();
  }

  async _show(phase) {
    if (this._view === phase) return;
    const token = ++this._swap;
    const next = phase === 'battle' ? this.battleView : this.mapView;
    const prev = phase === 'battle' ? this.mapView : this.battleView;
    if (prev.isMounted()) prev.unmount();
    this._view = phase;
    await next.mount('tideStage');
    if (token !== this._swap) return;
    this._syncHud();
  }

  render() {
    this.ensureShell(
      (ids) => ids.root,
      ({ div, header, span, p }) => {
        div(
          { id: 'root', className: 'tide' },
          div({ id: 'tideStage', className: 'tide-stage' }),
          header(
            { className: 'tide-top' },
            span({ className: 'tide-brand', text: '潮前线' }),
            span({ className: 'tide-brand__sub', text: '群岛防御' }),
            span({ id: 'frontTag', className: 'gd-tag gd-tag--primary', text: '前线' }),
            span({ id: 'metaLabel', className: 'tide-meta', text: '' }),
            Button({
              type: 'text',
              size: 'sm',
              text: '重开',
              onClick: () => this.store.reset(),
            })
          ),
          p({ id: 'message', className: 'tide-message', text: '' }),
          div({ id: 'side', className: 'tide-side' }),
          div({ id: 'dock', className: 'tide-dock' })
        );
      }
    );
    this._syncHud();
  }

  refresh() {
    this._syncHud();
  }

  _syncHud() {
    const state = this.store.getState();
    if (state.phase !== this._view) void this._show(state.phase);
    const root = this.ids().root;
    if (root) root.dataset.phase = state.phase;

    const front = this.ids().frontTag;
    if (front) front.textContent = `前线 第 ${state.frontRow} 排`;
    const meta = this.ids().metaLabel;
    if (meta) meta.textContent = `等级 ${state.level} · ${state.gold} 金`;
    const message = this.ids().message;
    if (message) message.textContent = state.message;

    this._paintSide(state);
    this._paintDock(state);
  }

  _paintSide(state) {
    const host = this.ids().side;
    if (!host) return;
    D.clear(host);
    const { div, span, get } = bind();
    if (state.phase === 'battle') {
      this._paintBattleSide(div, span, state);
    } else {
      this._paintMapSide(div, span, state);
    }
    const root = get()[1];
    if (root) host.appendChild(root);
  }

  _paintMapSide(div, span, state) {
    const selected = state.islands[state.selectedId];
    const reason = selected ? enterReason(state, selected.id) : '先点一座沙色岛';
    div(
      { className: 'tide-panel', key: 'map-side' },
      div(
        { className: 'tide-guide', key: 'guide' },
        Title({ level: 4, text: '第一步 · 进入岛屿视角', className: 'tide-h' }),
        Text({
          small: true,
          text: '点击海图上发亮的沙色岛，或点下面的按钮。进入后，左侧会自动换成布防。',
        })
      ),
      Button({
        type: 'primary',
        block: true,
        size: 'lg',
        className: 'tide-enter',
        text: reason ? reason : `进入${selected.name} · 岛屿视角`,
        disabled: !!reason,
        onClick: () => selected && this.store.enter(selected.id),
      }),
      Title({ level: 5, text: '岛屿', className: 'tide-h' }),
      div(
        { className: 'tide-legend' },
        span({ className: 'tide-dot tide-dot--held', text: '' }),
        span({ text: '已防御' }),
        span({ className: 'tide-dot tide-dot--open', text: '' }),
        span({ text: '未防御' }),
        span({ className: 'tide-dot tide-dot--lost', text: '' }),
        span({ text: '失守' }),
        span({ className: 'tide-dot tide-dot--locked', text: '' }),
        span({ text: '未抵达' })
      ),
      ...islandRows(state).map((row) =>
        div(
          { className: 'tide-row', key: `row-${row[0]?.row ?? 0}` },
          Text({
            as: 'span',
            type: 'muted',
            small: true,
            text: row[0]?.row === 0 ? '母港' : `第 ${row[0]?.row} 排`,
            className: 'tide-row__label',
          }),
          ...row.map((island) =>
            Button({
              size: 'sm',
              type: island.id === state.selectedId ? 'primary' : 'default',
              className: `tide-island tide-island--${island.status}`,
              text:
                island.status === 'open'
                  ? `${island.name} · 点击进入`
                  : `${island.name} · ${statusLabel(island.status)}`,
              onClick: () => {
                this.store.selectIsland(island.id);
                if (island.status === 'open') this.store.enter(island.id);
              },
            })
          ),
          ...row
            .filter((island) => island.status === 'open' && island.row === state.frontRow)
            .map((island) =>
              div(
                { className: 'tide-pressure', key: `p-${island.id}` },
                Text({
                  as: 'span',
                  small: true,
                  type: 'secondary',
                  text: `${island.name}攻势 ${Math.floor(island.pressure)}`,
                }),
                ProgressBar({ percent: island.pressure, size: 'sm' })
              )
            )
        )
      ),
      selected
        ? div(
            { className: 'tide-detail', key: 'detail' },
            Title({ level: 5, text: selected.name }),
            Text({
              type: 'secondary',
              small: true,
              text:
                selected.id === 'home'
                  ? '从这里出航。航线连着第一排。'
                  : `${statusLabel(selected.status)} · ${selected.houses} 座房子 · 航线 ${selected.links
                      .map((id) => state.islands[id].name)
                      .join('、')}`,
            })
          )
        : null,
      Button({
        block: true,
        text: '刷新前线',
        onClick: () => this.store.refresh(),
      }),
      Text({
        type: 'muted',
        small: true,
        className: 'tide-rule',
        text: '刷新会清空兵种和技能冷却，并把前线推到最近守住的岛的前一排。这一排若全部失守，已经防御成功的岛会重新丢失。',
      })
    );
  }

  _paintBattleSide(div, span, state) {
    const battle = state.battle;
    if (battle?.status === 'deploy') {
      this._paintDeploySide(div, span, state, battle);
      return;
    }
    this._paintFightSide(div, span, state, battle);
  }

  _paintDeploySide(div, span, state, battle) {
    const island = state.islands[battle.islandId];
    const full = battle.units.length >= GARRISON_CAP;
    const selected = battle.units.find((unit) => unit.id === state.selectedUnitId);
    div(
      { className: 'tide-panel', key: 'deploy-side' },
      div(
        { className: 'tide-guide', key: 'deploy-guide' },
        Title({ level: 4, text: `布防 · ${island?.name || ''}`, className: 'tide-h' }),
        Text({
          small: true,
          text: '选一个兵种，再点岛面。兵会站在岛上。点自己的兵，再点地面，可以调动站位。',
        })
      ),
      div(
        { className: full ? 'tide-garrison tide-garrison--full' : 'tide-garrison', key: 'count' },
        span({ text: `已部署 ${battle.units.length}/${GARRISON_CAP}` }),
        span({ text: full ? '这座岛已满' : '还可以部署' })
      ),
      ...Object.values(TROOPS).map((spec) => this._troopButton(spec, state, full)),
      Text({
        type: 'secondary',
        small: true,
        text: selected
          ? `已选中${TROOPS[selected.kind].name}。点岛面把它调过去。`
          : '未选中已部署的兵时，点岛面会再放一个。',
      }),
      Button({
        type: 'primary',
        block: true,
        size: 'lg',
        disabled: battle.units.length === 0,
        text: battle.units.length ? '开始回合' : '先部署兵种',
        onClick: () => this.store.startRound(),
      }),
      Button({
        block: true,
        text: '返回海图',
        onClick: () => this.store.leave(),
      }),
      Text({
        type: 'muted',
        small: true,
        className: 'tide-rule',
        text: '满员后不能再放任何兵种。敌人只会坐船，从码头这一个入口分批上岸。',
      })
    );
  }

  _troopButton(spec, state, full) {
    const locked = state.level < spec.unlockLevel;
    const cooling = (state.cooldowns[spec.id] || 0) > 0.05;
    const active = state.selectedTroop === spec.id && !state.selectedUnitId;
    let text = `部署 ${spec.name}`;
    if (locked) text = `${spec.name} · ${spec.unlockLevel}级解锁`;
    else if (full) text = `${spec.name} · 岛已满`;
    else if (cooling) text = `${spec.name} · 冷却中`;
    return Button({
      type: active ? 'primary' : 'default',
      block: true,
      disabled: locked || full || cooling,
      text,
      onClick: () => this.store.selectTroop(spec.id),
    });
  }

  _paintFightSide(div, span, state, battle) {
    const island = state.islands[battle?.islandId];
    const selected = battle?.units.find((unit) => unit.id === state.selectedUnitId);
    div(
      { className: 'tide-panel', key: 'fight-side' },
      Title({ level: 4, text: island ? `交战 · ${island.name}` : '交战', className: 'tide-h' }),
      Text({
        type: 'secondary',
        small: true,
        text: battle
          ? `第 ${battle.wave}/${battle.waveCount} 批 · 来船 ${battle.boats.length} · 上岸 ${battle.npcs.length} · 我方 ${battle.units.length}`
          : '',
      }),
      Text({
        small: true,
        text: selected
          ? `已选中${TROOPS[selected.kind].name}。点地面调动。`
          : '点自己的兵，再点地面，调动站位。敌人从码头上岸后和你的兵对打。',
      }),
      ...(battle?.houses || []).map((house) =>
        div(
          { className: 'tide-pressure', key: house.id },
          span({
            className: 'tide-house',
            text: `房子 ${house.id.slice(1)}  ${Math.ceil(house.hp)}/${house.maxHp}`,
          }),
          ProgressBar({ percent: (house.hp / house.maxHp) * 100, size: 'sm' })
        )
      ),
      ...Object.values(SKILLS).map((spec) => {
        const cd = state.cooldowns[spec.id] || 0;
        return Button({
          block: true,
          disabled: cd > 0.05,
          text: cd > 0.05 ? `${spec.name} ${cd.toFixed(1)}s` : spec.name,
          onClick: () => this.store.cast(spec.id),
        });
      }),
      Button({
        type: 'danger',
        block: true,
        text: '撤退失守',
        onClick: () => this.store.retreat(),
      })
    );
  }

  _paintDock(state) {
    const host = this.ids().dock;
    if (!host) return;
    D.clear(host);
    if (state.phase !== 'map') return;
    const { div, get } = bind();
    div(
      { className: 'tide-dock__row', key: 'dock' },
      ...Object.values(TROOPS).map((spec) => {
        const cd = state.cooldowns[spec.id] || 0;
        const locked = state.level < spec.unlockLevel;
        const rank = state.troopRank[spec.id] || 1;
        const cost = troopCost(rank);
        return div(
          { className: 'tide-card', key: spec.id },
          Button({
            type: state.selectedTroop === spec.id ? 'primary' : 'default',
            size: 'sm',
            disabled: locked,
            text: locked
              ? `${spec.name} · ${spec.unlockLevel}级`
              : cd > 0.05
                ? `${spec.name} ${cd.toFixed(1)}s`
                : spec.name,
            onClick: () => this.store.selectTroop(spec.id),
          }),
          Text({ as: 'span', small: true, type: 'muted', text: `${rank}阶 · ${spec.blurb}` }),
          Button({
            size: 'sm',
            type: 'text',
            disabled: locked || rank >= 4,
            text: rank >= 4 ? '满阶' : `升阶 ${cost}金`,
            onClick: () => this.store.upgradeTroop(spec.id),
          })
        );
      }),
      div(
        { className: 'tide-card', key: 'level' },
        Button({
          size: 'sm',
          text: `升级到 ${state.level + 1} 级`,
          onClick: () => this.store.upgradeLevel(),
        }),
        Text({
          as: 'span',
          small: true,
          type: 'muted',
          text: `花费 ${levelCost(state.level)} 金，提高全部兵种`,
        })
      )
    );
    const root = get()[1];
    if (root) host.appendChild(root);
  }
}
