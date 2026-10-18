import { Component } from '../../../engine/index.js';

/**
 * Journal / narrative log + examine / puzzle panel.
 */
export class SidePanelComponent extends Component {
  static styles = new URL('./SidePanelComponent.css', import.meta.url);

  constructor(deps) {
    super(deps);
    this.store = deps.store;
    this.onEscaped = deps.onEscaped;
    this.onReset = deps.onReset;
  }

  render() {
    const snap = this.store.getState();

    this.ensureShell(
      (ids) => ids.escapeSide,
      ({ div }) => {
        div(
          { id: 'escapeSide', className: 'escape-side' },
          div({ id: 'escapeExamine', className: 'escape-examine' }),
          div(
            { className: 'escape-log' },
            div({ className: 'escape-log__title', text: '调查日志' }),
            div({ id: 'escapeLogList', className: 'escape-log__list' })
          )
        );
      }
    );

    this._renderExamine(snap);
    this._renderLog(snap);
  }

  _renderLog(snap) {
    const list = this.ids().escapeLogList;
    if (!list) return;
    list.textContent = '';
    for (const entry of [...snap.log].reverse()) {
      const row = document.createElement('div');
      row.className = 'escape-log__row';
      row.textContent = entry.text;
      list.appendChild(row);
    }
  }

  _renderExamine(snap) {
    const host = this.ids().escapeExamine;
    if (!host) return;
    host.textContent = '';

    const ex = snap.examine;
    if (!ex) {
      host.classList.remove('is-open');
      const idle = document.createElement('div');
      idle.className = 'escape-examine__idle';
      idle.innerHTML =
        '<strong>午夜档案室</strong><span>点击场景中的热点调查。解谜顺序大致是：灯 → 钟/书 → 画后保险箱 → 抽屉 → 门。</span>';
      host.appendChild(idle);
      return;
    }

    host.classList.add('is-open');

    const head = document.createElement('div');
    head.className = 'escape-examine__head';
    const title = document.createElement('h2');
    title.className = 'escape-examine__title';
    title.textContent = ex.title || '调查';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn btn--ghost escape-examine__close';
    close.textContent = '关闭';
    close.addEventListener('click', () => this.store.closeExamine());
    head.appendChild(title);
    head.appendChild(close);
    host.appendChild(head);

    const body = document.createElement('p');
    body.className = 'escape-examine__body';
    body.textContent = ex.body || '';
    host.appendChild(body);

    if (ex.kind === 'clock') {
      const time = document.createElement('div');
      time.className = 'escape-examine__clock';
      time.textContent = ex.time || '4:17';
      host.appendChild(time);
    }

    if (ex.kind === 'bookshelf') {
      const row = document.createElement('div');
      row.className = 'escape-examine__actions';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--primary';
      btn.textContent = snap.flags.readVolume ? '再读第三卷' : '翻开第三卷';
      btn.addEventListener('click', () => this.store.takeVolume());
      row.appendChild(btn);
      host.appendChild(row);
    }

    if (ex.kind === 'safe') {
      host.appendChild(this._codeForm({
        placeholder: '四位数字',
        maxlength: 4,
        submitLabel: '开锁',
        onSubmit: (value) => {
          this.store.trySafeCode(value);
        },
      }));
    }

    if (ex.kind === 'door') {
      host.appendChild(this._codeForm({
        placeholder: '字母口令',
        maxlength: 16,
        submitLabel: '开门',
        onSubmit: (value) => {
          const result = this.store.tryDoorCode(value);
          if (result?.ok) this.onEscaped?.();
        },
      }));
    }
  }

  _codeForm({ placeholder, maxlength, submitLabel, onSubmit }) {
    const form = document.createElement('form');
    form.className = 'escape-examine__form';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      onSubmit?.(input?.value || '');
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'escape-examine__input';
    input.placeholder = placeholder;
    input.maxLength = maxlength;
    input.autocomplete = 'off';
    input.spellcheck = false;

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn--primary';
    submit.textContent = submitLabel;

    form.appendChild(input);
    form.appendChild(submit);
    queueMicrotask(() => input.focus());
    return form;
  }
}
