import { Component, D, bind } from '../../../engine/index.js';
import { loadUi, Button, Tag, Text, Title, ProgressBar } from '../../../ui/index.js';
import { BattleView } from './BattleView.js';
import { MapView } from './MapView.js';
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
    const reason = selected ? enterReason(state, selected.id) : '先选一座岛';
    div(
      { className: 'tide-panel', key: 'map-side' },
      Title({ level: 4, text: '岛屿', className: 'tide-h' }),
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
              text: `${island.name} · ${statusLabel(island.status)}`,
              onClick: () => this.store.selectIsland(island.id),
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
        type: 'primary',
        block: true,
        text: reason ? reason : `进入${selected.name}`,
        disabled: !!reason,
        onClick: () => selected && this.store.enter(selected.id),
      }),
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
    const island = state.islands[battle?.islandId];
    div(
      { className: 'tide-panel', key: 'battle-side' },
      Title({ level: 4, text: island ? island.name : '防御', className: 'tide-h' }),
      Text({
        type: 'secondary',
        small: true,
        text: battle
          ? `第 ${battle.wave}/${battle.waveCount} 波 · 场上 ${battle.npcs.length} · ${battle.slow > 0 ? '退潮中' : '敌人全速'}`
          : '',
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
      Text({
        type: 'muted',
        small: true,
        className: 'tide-rule',
        text: '选中下方兵种，再点岛上的圆点部署。冷却中的兵种不能再放。房子全毁则这座岛失守。',
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
    const { div, get } = bind();
    const battle = state.phase === 'battle';
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
            text: locked ? `${spec.name} · ${spec.unlockLevel}级` : cd > 0.05 ? `${spec.name} ${cd.toFixed(1)}s` : spec.name,
            onClick: () => this.store.selectTroop(spec.id),
          }),
          Text({ as: 'span', small: true, type: 'muted', text: `${rank}阶 · ${spec.blurb}` }),
          battle
            ? null
            : Button({
                size: 'sm',
                type: 'text',
                disabled: locked || rank >= 4,
                text: rank >= 4 ? '满阶' : `升阶 ${cost}金`,
                onClick: () => this.store.upgradeTroop(spec.id),
              })
        );
      }),
      ...Object.values(SKILLS).map((spec) => {
        const cd = state.cooldowns[spec.id] || 0;
        return div(
          { className: 'tide-card', key: spec.id },
          Button({
            size: 'sm',
            type: 'default',
            disabled: !battle || cd > 0.05,
            text: cd > 0.05 ? `${spec.name} ${cd.toFixed(1)}s` : spec.name,
            onClick: () => this.store.cast(spec.id),
          }),
          Text({ as: 'span', small: true, type: 'muted', text: spec.blurb })
        );
      }),
      battle
        ? null
        : div(
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
