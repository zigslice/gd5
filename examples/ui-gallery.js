/**
 * Live gallery for gd5 UI kit — NameThatUI-aligned catalog.
 * Standard gd5 app: page slot `#home` + ComponentRender (see demoApp.js).
 * Open examples/ui-gallery.html via static server.
 */
import { Component } from '../src/engine/index.js';
import { startDemoApp } from './demoApp.js';
import {
  loadUi,
  Button,
  Input,
  TextArea,
  Select,
  Field,
  Checkbox,
  Switch,
  RadioGroup,
  Badge,
  Chip,
  Pill,
  Space,
  Title,
  Text,
  Truncate,
  Card,
  Tag,
  Alert,
  Banner,
  Callout,
  Spin,
  Empty,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Avatar,
  AvatarGroup,
  StatusDot,
  Accordion,
  Tabs,
  ToggleGroup,
  Breadcrumbs,
  Steps,
  QuantityStepper,
  Pagination,
  Navbar,
  SiteHeader,
  BottomNav,
  Sidebar,
  Toolbar,
  HamburgerButton,
  Scrollspy,
  SplitButton,
  Tooltip,
  Popover,
  DropdownMenu,
  HoverCard,
  OverflowMenu,
  SearchInput,
  Combobox,
  TagInput,
  MultiSelect,
  Transfer,
  Slider,
  ColorWell,
  DatePicker,
  TimeField,
  Table,
  Timeline,
  ChatBubble,
  Carousel,
  BentoGrid,
  BentoTile,
  Marquee,
  ScrollArea,
  ResizeHandle,
  Splitter,
  Tree,
  PieChart,
  DonutChart,
  DragHandle,
  DropZone,
  SignInForm,
  Fab,
  InputNumber,
  Rate,
  Cascader,
  Upload,
  Mentions,
  TreeSelect,
  Form,
  FormItem,
  List,
  ListItem,
  Descriptions,
  Statistic,
  Calendar,
  Image,
  Result,
  Popconfirm,
  Watermark,
  Flex,
  Row,
  Col,
  Layout,
  LayoutHeader,
  LayoutSider,
  LayoutContent,
  LayoutFooter,
  Menu,
  Affix,
  Anchor,
  Icon,
  ConfigProvider,
  Notification,
  Modal,
  Drawer,
  Toast,
  Lightbox,
  CommandPalette,
  WorkflowDAG,
  JsonTree,
  CodeBlock,
  DiffBlock,
  MarkdownEditor,
  CoverFlow,
  TodoList,
  nextTodoStatus,
  LoadingButton,
  themes,
  setTheme,
  getTheme,
} from '../src/ui/index.js';
class GalleryPage extends Component {
  static styles = [new URL('./ui-gallery.css', import.meta.url)];

  constructor(deps = {}) {
    super(deps);
    this.state.data = {
      name: '',
      notify: true,
      agree: false,
      tab: 'a',
      segment: 'day',
      page: 1,
      slide: 0,
      qty: 2,
      slider: 40,
      color: '#e86a17',
      tags: ['orange', 'ui'],
      multi: ['dev'],
      transfer: ['b'],
      combo: '',
      comboOpen: false,
      multiOpen: false,
      overflowOpen: false,
      popoverOpen: false,
      search: '',
      treeExpanded: ['root', 'ui'],
      treeSelected: 'ui-button',
      email: '',
      password: '',
      pwVisible: false,
      radio: 'a',
      number: 3,
      rate: 4,
      cascader: ['zhejiang', 'hangzhou'],
      cascaderOpen: false,
      files: [],
      mentions: '',
      mentionsOpen: false,
      treeSelect: 'leaf1',
      treeSelectOpen: false,
      calendar: new Date(),
      menuKey: '1',
      menuOpen: ['sub'],
      popconfirmOpen: false,
      anchorKey: 'antd',
      theme: 'orange',
    };
    this.modal = new Modal({});
    this.drawer = new Drawer({});
    this.toast = new Toast({});
    this.lightbox = new Lightbox({});
    this.cmd = new CommandPalette({});
    this.notification = new Notification({});
    this.workflow = new WorkflowDAG({});
    this.jsonTree = new JsonTree({
      height: 320,
      defaultExpand: 2,
      onPath: (path) => this.toast.show({ message: path, type: 'info' }),
    });
    this.markdownEditor = new MarkdownEditor({
      height: 280,
      mode: 'split',
      value:
        '# Markdown editor\n\nWrite **bold**, *italic*, and `code`.\n\n- Toolbar wraps selection\n- Switch 编辑 / 分栏 / 预览\n\n```js\nconst ok = true;\n```\n\n> Preview updates as you type.\n',
      onChange: () => {},
    });
    this.coverFlow = new CoverFlow({
      height: 300,
      index: 2,
      items: [
        { key: 'knight', title: 'Knight', subtitle: 'Tank · Iron Order', color: 'linear-gradient(145deg,#4a5568,#1a202c)' },
        { key: 'mage', title: 'Mage', subtitle: 'Caster · Arcane', color: 'linear-gradient(145deg,#6b46c1,#2b1a4e)' },
        { key: 'ranger', title: 'Ranger', subtitle: 'Scout · Wildwood', color: 'linear-gradient(145deg,#2f8f5b,#143528)' },
        { key: 'rogue', title: 'Rogue', subtitle: 'Assassin · Night', color: 'linear-gradient(145deg,#c05621,#3b1d0f)' },
        { key: 'cleric', title: 'Cleric', subtitle: 'Support · Dawn', color: 'linear-gradient(145deg,#2b6cb0,#1a365d)' },
      ],
      onChange: (i, item) => this.toast.show({ message: `Selected ${item.title}`, type: 'info' }),
    });
    this.todoList = new TodoList({
      title: 'To-dos',
      items: [
        {
          key: '1',
          text: 'Add Button loading + LoadingButton with dots/spin',
          status: 'active',
        },
        { key: '2', text: 'CSS, gallery, docs, tests, demo', status: 'pending' },
        { key: '3', text: 'Commit, push, open PR', status: 'pending' },
      ],
      onItemClick: (_item, index) => {
        const items = this.todoList.getItems().map((t, i) =>
          i === index ? { ...t, status: nextTodoStatus(t.status) } : t
        );
        this.todoList.setItems(items);
      },
    });
    this.loadingBtnDots = new LoadingButton({
      text: 'Save',
      loadingText: 'Saving',
      type: 'default',
      loadingType: 'primary',
      indicator: 'dots',
      onClick: () => new Promise((r) => setTimeout(r, 1600)),
    });
    this.loadingBtnSpin = new LoadingButton({
      text: 'Publish',
      loadingText: 'Publishing',
      type: 'primary',
      indicator: 'spin',
      onClick: () => new Promise((r) => setTimeout(r, 1600)),
    });
  }

  async componentDidMount() {
    await loadUi();
    const theme = getTheme() || 'orange';
    setTheme(theme);
    this.setData({ theme }, { refresh: false });
    await this.modal.mount();
    await this.drawer.mount();
    await this.toast.mount();
    await this.lightbox.mount();
    await this.cmd.mount();
    await this.notification.mount();
    this.cmd.setData({
      items: [
        { id: 'save', label: 'Save document', onSelect: () => this.toast.show({ message: 'Saved', type: 'success' }) },
        { id: 'toast', label: 'Show toast', onSelect: () => this.toast.show({ message: 'Hello from palette' }) },
        { id: 'drawer', label: 'Open drawer', onSelect: () => this.drawer.open({ title: 'Menu', content: 'From ⌘K' }) },
      ],
    }, { refresh: false });
  }

  section(title, ...body) {
    return Card({ title, style: { marginTop: '24px' } }, ...body);
  }

  render() {
    const d = this.state.data;
    this.ensureShell(
      (ids) => ids.galleryRoot,
      ({ div }) => {
        div(
          { id: 'galleryRoot', className: 'gallery' },
          Banner({
            type: 'info',
            message: 'gd5 UI — NameThatUI + Ant Design coverage. White panels; accent theme is selectable.',
            closable: false,
          }),
          Title({ level: 1, text: 'gd5 UI' }),
          Text({
            type: 'secondary',
            text: 'Component library aligned with namethatui.com and Ant Design. Themes: orange / blue / green.',
          }),
          Card(
            { title: 'Theme', style: { marginTop: '24px' } },
            Space(
              { direction: 'vertical', size: 'md' },
              Text({
                type: 'secondary',
                text: 'Call setTheme("blue") or wrap with ConfigProvider({ theme: "green" }). Default is orange.',
              }),
              ToggleGroup({
                value: d.theme,
                onChange: (theme) => {
                  setTheme(theme);
                  // Full-page ensureShell skips rebuild; clear ref so theme UI repaints.
                  this.state.ref = {};
                  this.setData({ theme });
                },
                options: Object.keys(themes).map((key) => ({
                  value: key,
                  label: themes[key].label,
                })),
              }),
              Text({
                type: 'secondary',
                text: `Active: ${themes[d.theme]?.label || d.theme} · primary ${themes[d.theme]?.primary || ''}`,
              }),
              Space(
                {},
                Button({ type: 'primary', text: 'Primary' }),
                Button({ type: 'default', text: 'Default' }),
                Button({ type: 'ghost', text: 'Ghost' }),
                Tag({ color: 'primary', text: 'Primary tag' }),
                Switch({ checked: true })
              )
            )
          ),

          this.section(
            'Header / Navbar / Toolbar',
            SiteHeader(
              { brand: 'ProtoLive', sticky: false },
              Navbar({
                items: [
                  { label: 'Home', active: true },
                  { label: 'Docs' },
                  { label: 'Gallery' },
                ],
              }),
              Toolbar(
                {},
                Button({ type: 'primary', size: 'sm', text: 'New' }),
                HamburgerButton({
                  onClick: () =>
                    this.drawer.open({
                      title: 'Nav drawer',
                      content: 'Hamburger → Drawer (left).',
                      placement: 'left',
                    }),
                }),
                OverflowMenu({
                  open: d.overflowOpen,
                  onOpenChange: (open) => this.setData({ overflowOpen: open }),
                  items: [
                    { label: 'Rename', onClick: () => this.toast.show({ message: 'Rename' }) },
                    { label: 'Delete', danger: true },
                  ],
                })
              )
            )
          ),

          this.section(
            'Button / Split / FAB',
            Space(
              { direction: 'vertical', size: 'sm' },
              Space(
                {},
                Button({ type: 'primary', text: 'Primary' }),
                Button({ type: 'default', text: 'Default' }),
                Button({ type: 'ghost', text: 'Ghost' }),
                Button({ type: 'danger', text: 'Danger' }),
                Button({ type: 'text', text: 'Text' }),
                Button({ type: 'primary', text: 'Loading', loading: true, indicator: 'dots' }),
                SplitButton({
                  text: 'Publish',
                  onClick: () => this.toast.show({ message: 'Published', type: 'success' }),
                  onMenuClick: () => this.setData({ overflowOpen: !d.overflowOpen }),
                }),
                Tooltip({ title: 'Floating action' }, Button({ type: 'default', text: 'Hover me' }))
              ),
              Text({
                type: 'secondary',
                text: 'LoadingButton — click locks until async finishes (dots / spin).',
              }),
              Space(
                {},
                this.slot(this.loadingBtnDots, { className: 'component-host' }),
                this.slot(this.loadingBtnSpin, { className: 'component-host' })
              )
            )
          ),

          this.section(
            'Form controls',
            Space(
              { direction: 'vertical', size: 'md' },
              Field({
                label: 'Name',
                control: Input({
                  id: 'galleryName',
                  placeholder: 'Type something',
                  onInput: (e) => this.setData({ name: e.target.value }),
                }),
                hint: 'Form Field anatomy: label + control + hint',
              }),
              Field({
                label: 'Notes',
                control: TextArea({ id: 'galleryNotes', placeholder: 'Notes…' }),
              }),
              Field({
                label: 'Role',
                control: Select({
                  id: 'galleryRole',
                  options: [
                    { value: 'dev', label: 'Developer' },
                    { value: 'design', label: 'Designer' },
                    { value: 'pm', label: 'PM' },
                  ],
                }),
              }),
              SearchInput({
                value: d.search,
                onInput: (e) => this.setData({ search: e.target.value }),
                onClear: () => this.setData({ search: '' }),
              }),
              Combobox({
                value: d.combo,
                open: d.comboOpen,
                options: ['Accordion', 'Avatar', 'Breadcrumbs', 'Carousel', 'Drawer'],
                onChange: (v) => this.setData({ combo: v }),
                onOpenChange: (open) => this.setData({ comboOpen: open }),
                onSelect: (v) => this.setData({ combo: v, comboOpen: false }),
              }),
              TagInput({
                value: d.tags,
                onChange: (tags) => this.setData({ tags }),
              }),
              MultiSelect({
                open: d.multiOpen,
                value: d.multi,
                options: [
                  { value: 'dev', label: 'Developer' },
                  { value: 'design', label: 'Designer' },
                  { value: 'pm', label: 'PM' },
                ],
                onOpenChange: (open) => this.setData({ multiOpen: open }),
                onChange: (multi) => this.setData({ multi }),
              }),
              Space(
                { align: 'center' },
                Checkbox({
                  label: 'I agree',
                  checked: !!d.agree,
                  onChange: (e) => this.setData({ agree: e.target.checked }),
                }),
                Switch({
                  checked: !!d.notify,
                  onChange: (on) => this.setData({ notify: on }),
                }),
                RadioGroup({
                  name: 'demo-radio',
                  direction: 'horizontal',
                  value: d.radio,
                  onChange: (radio) => this.setData({ radio }),
                  options: [
                    { value: 'a', label: 'A' },
                    { value: 'b', label: 'B' },
                  ],
                }),
                QuantityStepper({
                  value: d.qty,
                  min: 0,
                  max: 9,
                  onChange: (qty) => this.setData({ qty }),
                })
              ),
              Slider({
                value: d.slider,
                onChange: (slider) => this.setData({ slider }),
              }),
              Space(
                { align: 'center' },
                ColorWell({
                  value: d.color,
                  onChange: (color) => this.setData({ color }),
                }),
                DatePicker({}),
                TimeField({})
              ),
              Transfer({
                dataSource: [
                  { key: 'a', title: 'Alpha' },
                  { key: 'b', title: 'Bravo' },
                  { key: 'c', title: 'Charlie' },
                ],
                targetKeys: d.transfer,
                onChange: (transfer) => this.setData({ transfer }),
              })
            )
          ),

          this.section(
            'Feedback',
            Space(
              { direction: 'vertical', size: 'md' },
              Space(
                { align: 'center' },
                Tag({ text: 'Tag' }),
                Tag({ color: 'primary', text: 'Primary' }),
                Chip({ text: 'Chip', selected: true }),
                Pill({ text: 'Pill', color: 'primary' }),
                Badge({ count: 5 }, Button({ text: 'Inbox' })),
                StatusDot({ status: 'online' }),
                StatusDot({ status: 'processing' }),
                Spin({}),
                ProgressRing({ percent: 64, size: 40 })
              ),
              ProgressBar({ percent: d.slider, showInfo: true }),
              Skeleton({ variant: 'title' }),
              Alert({ type: 'info', message: 'Inline Alert' }),
              Callout({ type: 'warning', title: 'Callout', message: 'In-content notice, not a toast.' }),
              Empty({ description: 'Nothing here yet' })
            )
          ),

          this.section(
            'Avatar / Timeline / Chat',
            Space(
              { direction: 'vertical', size: 'md' },
              AvatarGroup({
                items: [
                  { name: 'Ava Reyes' },
                  { name: 'Bo Chen', status: 'online' },
                  { name: 'Cy Dunn' },
                  { name: 'Di Fox' },
                  { name: 'Ed Gu' },
                  { name: 'Fa Ho' },
                ],
                max: 4,
              }),
              Timeline({
                items: [
                  { time: '09:12', title: 'Order placed', description: '3 items' },
                  { time: '09:13', title: 'Payment confirmed', description: 'Visa ending 4242' },
                  { time: 'Today', title: 'Out for delivery', description: 'Arriving by 6 pm' },
                ],
              }),
              ChatBubble({ side: 'theirs', author: 'Ava', text: 'Ship the draft?', showAvatar: true }),
              ChatBubble({ side: 'mine', text: 'On it — opening the drawer.' })
            )
          ),

          this.section(
            'Navigation patterns',
            Space(
              { direction: 'vertical', size: 'md' },
              Breadcrumbs({
                items: [
                  { label: 'Home', onClick: () => {} },
                  { label: 'UI', onClick: () => {} },
                  { label: 'Gallery' },
                ],
              }),
              Steps({
                current: 1,
                items: [
                  { title: 'Cart', description: 'Review' },
                  { title: 'Pay', description: 'Card' },
                  { title: 'Done', description: 'Confirm' },
                ],
              }),
              Tabs({
                activeKey: d.tab,
                onChange: (tab) => this.setData({ tab }),
                items: [
                  { key: 'a', label: 'Overview', content: Text({ text: 'Tabs panel A' }) },
                  { key: 'b', label: 'API', content: Text({ text: 'Tabs panel B' }) },
                ],
              }),
              ToggleGroup({
                value: d.segment,
                onChange: (segment) => this.setData({ segment }),
                options: [
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ],
              }),
              Pagination({
                current: d.page,
                total: 5,
                onChange: (page) => this.setData({ page }),
              }),
              Accordion({
                items: [
                  { title: 'What is gd5 UI?', content: 'Antd-style kit on the real-DOM engine.', defaultOpen: true },
                  { title: 'How to theme?', content: 'Override --gd-* tokens on :root.' },
                ],
              }),
              Scrollspy({
                activeKey: 'nav',
                items: [
                  { key: 'nav', label: 'Navigation' },
                  { key: 'data', label: 'Data' },
                  { key: 'overlay', label: 'Overlays' },
                ],
              }),
              BottomNav({
                items: [
                  { key: 'home', label: 'Home', icon: '⌂', active: true },
                  { key: 'search', label: 'Search', icon: '⌕' },
                  { key: 'me', label: 'Me', icon: '☺' },
                ],
              })
            )
          ),

          this.section(
            'To-dos',
            Space(
              { direction: 'vertical', size: 'sm' },
              Text({
                type: 'secondary',
                text: 'TodoList — active arrow · pending dashed ring · done check. Click a row to cycle status.',
              }),
              this.slot(this.todoList, { className: 'component-host' })
            )
          ),

          this.section(
            'Cover Flow',
            Space(
              { direction: 'vertical', size: 'sm' },
              Text({
                type: 'secondary',
                text: 'Cover Flow（封面流）— game character-select style: center card faces forward, neighbors tilt & stack. Drag / arrows / dots.',
              }),
              this.slot(this.coverFlow, {
                className: 'component-host',
                style: { minHeight: '360px' },
              })
            )
          ),

          this.section(
            'Markdown editor',
            Space(
              { direction: 'vertical', size: 'sm' },
              Text({
                type: 'secondary',
                text: 'Default Markdown editing with a basic top toolbar and live preview (编辑 / 分栏 / 预览).',
              }),
              this.slot(this.markdownEditor, {
                className: 'component-host',
                style: { minHeight: '300px' },
              })
            )
          ),

          this.section(
            'Code block',
            Space(
              { direction: 'vertical', size: 'sm' },
              Text({
                type: 'secondary',
                text: 'Native line numbers (no highlight.js). Fixes table-copy blanks, multiline tokens, trailing newline count.',
              }),
              CodeBlock({
                language: 'javascript',
                highlightLines: [4, 5],
                code:
                  "/** Add two numbers */\nexport function add(a, b) {\n  // keep precision\n  const sum = a + b;\n  return sum;\n}\n",
              }),
              CodeBlock({
                language: 'json',
                startFrom: 10,
                lineNumbers: true,
                code: '{\n  "ok": true,\n  "n": 42\n}\n',
              }),
              Text({
                type: 'secondary',
                text: 'DiffBlock — unified diff with dual gutters (old | new) and +/- markers.',
              }),
              DiffBlock({
                language: 'javascript',
                diff:
                  '--- a/add.js\n+++ b/add.js\n@@ -1,5 +1,6 @@\n /** Add two numbers */\n-export function add(a, b) {\n-  return a + b;\n+export function add(a, b, c = 0) {\n+  // keep precision\n+  return a + b + c;\n }\n',
              })
            )
          ),

          this.section(
            'JSON Tree',
            Space(
              { direction: 'vertical', size: 'sm' },
              Text({
                type: 'secondary',
                text: 'Virtualized JSON viewer (jsonTreeViewer-style). Expand / mark / JSONPath; theme-aware type colors.',
              }),
              this.slot(this.jsonTree, {
                className: 'component-host',
                style: { minHeight: '340px' },
                onMount: (jt) => {
                  jt.loadData({
                    product: 'gd5',
                    themes: ['orange', 'blue', 'green'],
                    engine: {
                      runtime: 'real-DOM',
                      bundler: false,
                      apis: ['Component', 'bind', 'LogProvider'],
                    },
                    ui: {
                      kits: 80,
                      overlays: ['Modal', 'Drawer', 'Toast'],
                      flags: { virtualJson: true, workflowDag: true },
                    },
                    metrics: {
                      score: 98.5,
                      samples: [1, 2, 3, 5, 8, 13],
                      ok: true,
                      note: null,
                    },
                  });
                },
              })
            )
          ),

          this.section(
            'Workflow DAG',
            Space(
              { direction: 'vertical', size: 'sm' },
              Text({
                type: 'secondary',
                text: 'Multi-column DAG: scroll, drag blank area to pan, click a node for the right drawer.',
              }),
              this.slot(this.workflow, {
                className: 'component-host',
                style: { minHeight: '360px' },
                onMount: (wf) => {
                  wf.setGraph({
                    columns: [
                      {
                        key: 'ingest',
                        title: 'Ingest',
                        nodes: [
                          {
                            key: 'n-source',
                            title: 'Source sync',
                            status: 'success',
                            description: 'Pull events from upstream queue.',
                          },
                          {
                            key: 'n-validate',
                            title: 'Validate',
                            status: 'running',
                            description: 'Schema + freshness checks.',
                          },
                        ],
                      },
                      {
                        key: 'transform',
                        title: 'Transform',
                        nodes: [
                          {
                            key: 'n-enrich',
                            title: 'Enrich',
                            status: 'pending',
                            description: 'Join dimensions and tags.',
                          },
                          {
                            key: 'n-aggregate',
                            title: 'Aggregate',
                            status: 'pending',
                            description: 'Roll up by tenant and day.',
                          },
                        ],
                      },
                      {
                        key: 'deliver',
                        title: 'Deliver',
                        nodes: [
                          {
                            key: 'n-warehouse',
                            title: 'Warehouse load',
                            status: 'pending',
                            description: 'Write parquet partitions.',
                          },
                          {
                            key: 'n-notify',
                            title: 'Notify',
                            status: 'pending',
                            description: 'Slack + email on completion.',
                          },
                        ],
                      },
                      {
                        key: 'observe',
                        title: 'Observe',
                        nodes: [
                          {
                            key: 'n-metrics',
                            title: 'Metrics',
                            status: 'pending',
                            description: 'Emit pipeline SLIs.',
                          },
                        ],
                      },
                    ],
                    edges: [
                      { from: 'n-source', to: 'n-enrich' },
                      { from: 'n-validate', to: 'n-enrich' },
                      { from: 'n-enrich', to: 'n-aggregate' },
                      { from: 'n-aggregate', to: 'n-warehouse' },
                      { from: 'n-warehouse', to: 'n-notify' },
                      { from: 'n-notify', to: 'n-metrics' },
                    ],
                  });
                },
              })
            )
          ),

          this.section(
            'Data / Tree / Charts',
            Space(
              { direction: 'vertical', size: 'md' },
              Table({
                columns: [
                  { key: 'name', title: 'Name', sortable: true },
                  { key: 'status', title: 'Status' },
                  { key: 'amount', title: 'Amount', sortable: true },
                ],
                dataSource: [
                  { name: 'Northwind', status: 'Paid', amount: '$4,280' },
                  { name: 'Globex', status: 'Pending', amount: '$1,860' },
                ],
              }),
              Tree({
                accordion: true,
                treeData: [
                  {
                    key: 'root',
                    title: 'src',
                    children: [
                      {
                        key: 'ui',
                        title: 'ui/',
                        children: [
                          { key: 'ui-button', title: 'button.js' },
                          { key: 'ui-tree', title: 'tree.js' },
                        ],
                      },
                      {
                        key: 'engine',
                        title: 'engine/',
                        children: [
                          { key: 'engine-component', title: 'component.js' },
                          { key: 'engine-log', title: 'log.js' },
                        ],
                      },
                    ],
                  },
                ],
                expandedKeys: d.treeExpanded,
                selectedKey: d.treeSelected,
                onExpand: (treeExpanded) => this.setData({ treeExpanded }),
                onSelect: (treeSelected) => this.setData({ treeSelected }),
              }),
              Space(
                {},
                PieChart({
                  size: 120,
                  data: [
                    { value: 40, label: 'A' },
                    { value: 25, label: 'B' },
                    { value: 35, label: 'C' },
                  ],
                }),
                DonutChart({
                  size: 120,
                  data: [
                    { value: 55, label: 'Done' },
                    { value: 45, label: 'Todo' },
                  ],
                })
              )
            )
          ),

          this.section(
            'Layout / Carousel / Media',
            Space(
              { direction: 'vertical', size: 'md' },
              BentoGrid(
                { columns: 4 },
                BentoTile({ span: 2 }, Text({ text: 'Wide tile' })),
                BentoTile({}, Text({ text: 'A' })),
                BentoTile({}, Text({ text: 'B' })),
                BentoTile({ span: 2, rowSpan: 1 }, Text({ text: 'Another wide' }))
              ),
              Marquee(
                {},
                Pill({ text: 'Accordion' }),
                Pill({ text: 'Drawer' }),
                Pill({ text: 'Toast' }),
                Pill({ text: 'Carousel' }),
                Pill({ text: 'Command Palette' })
              ),
              Carousel({
                index: d.slide,
                onChange: (slide) => this.setData({ slide }),
                slides: ['Slide one — arrows & dots', 'Slide two', 'Slide three'],
              }),
              Splitter(
                {},
                Sidebar({
                  title: 'Sidebar',
                  items: [
                    { label: 'Inbox', active: true },
                    { label: 'Archive' },
                  ],
                  width: '100%',
                }),
                ScrollArea(
                  { height: 120 },
                  Text({ text: 'Scroll area pane — resize handle demo below.' }),
                  ResizeHandle({})
                )
              ),
              Space(
                {},
                DragHandle({}),
                DropZone({ label: 'Drop zone' })
              ),
              Truncate({
                text: 'Release notes: this update reworks the sync engine and adds shortcuts for every panel.',
                lines: 1,
              }),
              HoverCard({
                title: 'Jane Appleseed',
                content: Text({ type: 'secondary', text: 'Design systems engineer.' }),
              }, Text({ text: '@jane (hover card)' }))
            )
          ),

          this.section(
            'Overlays',
            Space(
              {},
              Button({
                type: 'primary',
                text: 'Modal',
                onClick: () =>
                  this.modal.open({
                    title: 'Confirm',
                    content: `Hello${d.name ? `, ${d.name}` : ''}. Continue?`,
                    onOk: () => this.toast.show({ message: 'OK', type: 'success' }),
                  }),
              }),
              Button({
                type: 'default',
                text: 'Drawer',
                onClick: () =>
                  this.drawer.open({
                    title: 'Drawer / Sheet',
                    content: 'Side overlay with scrim.',
                    placement: 'right',
                  }),
              }),
              Button({
                type: 'default',
                text: 'Toast',
                onClick: () => this.toast.show({ message: 'Snackbar message', type: 'info' }),
              }),
              Button({
                type: 'default',
                text: 'Lightbox',
                onClick: () =>
                  this.lightbox.open({
                    src: 'https://picsum.photos/seed/gd5/800/500',
                    alt: 'Demo',
                  }),
              }),
              Button({
                type: 'default',
                text: '⌘K Palette',
                onClick: () => this.cmd.open(),
              }),
              Popover({
                open: d.popoverOpen,
                title: 'Popover',
                content: Text({ text: 'Anchored rich panel.' }),
              },
                Button({
                  type: 'ghost',
                  text: 'Popover',
                  onClick: () => this.setData({ popoverOpen: !d.popoverOpen }),
                })
              ),
              DropdownMenu({
                open: d.overflowOpen,
                onOpenChange: (overflowOpen) => this.setData({ overflowOpen }),
                items: [
                  { label: 'Edit' },
                  { label: 'Share' },
                  { divider: true },
                  { label: 'Remove', danger: true },
                ],
              },
                Button({
                  type: 'ghost',
                  text: 'Menu',
                  onClick: () => this.setData({ overflowOpen: !d.overflowOpen }),
                })
              )
            )
          ),

          this.section(
            'Ant Design gap fill',
            Space(
              { direction: 'vertical', size: 'md' },
              Flex(
                { gap: 12, align: 'center', wrap: true },
                Icon({ type: 'setting', size: 'lg' }),
                Icon({ type: 'star' }),
                InputNumber({
                  value: d.number,
                  min: 0,
                  max: 10,
                  onChange: (number) => this.setData({ number }),
                }),
                Rate({ value: d.rate, onChange: (rate) => this.setData({ rate }) }),
                Statistic({ title: 'Active users', value: 112893, suffix: '' })
              ),
              Cascader({
                value: d.cascader,
                open: d.cascaderOpen,
                onOpenChange: (cascaderOpen) => this.setData({ cascaderOpen }),
                onChange: (cascader) => this.setData({ cascader }),
                options: [
                  {
                    value: 'zhejiang',
                    label: 'Zhejiang',
                    children: [
                      { value: 'hangzhou', label: 'Hangzhou' },
                      { value: 'ningbo', label: 'Ningbo' },
                    ],
                  },
                  {
                    value: 'jiangsu',
                    label: 'Jiangsu',
                    children: [{ value: 'nanjing', label: 'Nanjing' }],
                  },
                ],
              }),
              TreeSelect({
                value: d.treeSelect,
                open: d.treeSelectOpen,
                onOpenChange: (treeSelectOpen) => this.setData({ treeSelectOpen }),
                onChange: (treeSelect) => this.setData({ treeSelect }),
                treeData: [
                  {
                    value: 'parent',
                    title: 'Parent',
                    children: [
                      { value: 'leaf1', title: 'Leaf 1' },
                      { value: 'leaf2', title: 'Leaf 2' },
                    ],
                  },
                ],
              }),
              Upload({
                fileList: d.files,
                onChange: ({ fileList }) => this.setData({ files: fileList }),
              }),
              Mentions({
                value: d.mentions,
                open: d.mentionsOpen,
                options: ['alice', 'bob', 'carol'],
                onChange: (mentions) => this.setData({ mentions }),
                onOpenChange: (mentionsOpen) => this.setData({ mentionsOpen }),
              }),
              Row(
                { gutter: 16 },
                Col({ span: 12 }, Calendar({
                  value: d.calendar,
                  onChange: (calendar) => this.setData({ calendar }),
                })),
                Col(
                  { span: 12 },
                  Space(
                    { direction: 'vertical' },
                    Image({
                      src: 'https://picsum.photos/seed/gd5antd/240/140',
                      width: 240,
                      onPreview: ({ src, alt }) => this.lightbox.open({ src, alt }),
                    }),
                    Descriptions({
                      title: 'User info',
                      column: 1,
                      items: [
                        { label: 'Name', children: 'Jane' },
                        { label: 'Role', children: 'Designer' },
                      ],
                    })
                  )
                )
              ),
              List({
                header: Text({ text: 'List header' }),
                dataSource: [
                  { key: '1', title: 'Ant Design Title 1' },
                  { key: '2', title: 'Ant Design Title 2' },
                ],
                renderItem: (item) =>
                  ListItem(
                    {
                      actions: [
                        Button({
                          type: 'text',
                          size: 'sm',
                          text: 'Edit',
                        }),
                      ],
                    },
                    Text({ text: item.title })
                  ),
              }),
              Menu({
                mode: 'inline',
                selectedKey: d.menuKey,
                openKeys: d.menuOpen,
                onOpenChange: (menuOpen) => this.setData({ menuOpen }),
                onClick: ({ key }) => this.setData({ menuKey: key }),
                items: [
                  { key: '1', label: 'Option 1' },
                  { key: '2', label: 'Option 2' },
                  {
                    key: 'sub',
                    label: 'Submenu',
                    children: [
                      { key: '3', label: 'Option 3' },
                      { key: '4', label: 'Option 4' },
                    ],
                  },
                ],
              }),
              Layout(
                { hasSider: true },
                LayoutSider(
                  { width: 140 },
                  Text({ text: 'Sider' })
                ),
                Layout(
                  {},
                  LayoutHeader({}, Text({ text: 'Header' })),
                  LayoutContent({}, Text({ text: 'Content' })),
                  LayoutFooter({}, Text({ type: 'secondary', text: 'Footer' }))
                )
              ),
              Affix(
                { offsetTop: 8 },
                Anchor({
                  activeKey: d.anchorKey,
                  onChange: (anchorKey) => this.setData({ anchorKey }),
                  items: [
                    { key: 'antd', title: 'Ant gap' },
                    { key: 'overlays', title: 'Overlays' },
                  ],
                })
              ),
              Result({
                status: 'success',
                title: 'Purchase success',
                subTitle: 'Order number 20260316001',
                extra: Button({
                  type: 'primary',
                  text: 'Buy again',
                  onClick: () =>
                    this.notification.success({
                      message: 'Ordered',
                      description: 'Notification (antd-style top-right).',
                    }),
                }),
              }),
              Space(
                {},
                Popconfirm({
                  open: d.popconfirmOpen,
                  title: 'Delete this task?',
                  onOpenChange: (popconfirmOpen) => this.setData({ popconfirmOpen }),
                  onConfirm: () => this.toast.show({ message: 'Deleted', type: 'success' }),
                },
                  Button({
                    type: 'danger',
                    text: 'Popconfirm',
                    onClick: () => this.setData({ popconfirmOpen: !d.popconfirmOpen }),
                  })
                ),
                Button({
                  type: 'default',
                  text: 'Notification',
                  onClick: () =>
                    this.notification.info({
                      message: 'Hello',
                      description: 'Top-right notification stack.',
                    }),
                })
              ),
              Watermark(
                { content: 'gd5' },
                Form(
                  {
                    onSubmit: () =>
                      this.toast.show({ message: 'Form submitted', type: 'success' }),
                  },
                  FormItem({
                    label: 'Username',
                    required: true,
                    control: Input({ name: 'username', placeholder: 'Jane' }),
                  }),
                  Button({ type: 'primary', text: 'Submit', htmlType: 'submit' })
                )
              ),
              Flex(
                { gap: 12, wrap: true },
                ConfigProvider(
                  { theme: 'blue', style: { padding: '12px', border: '1px solid var(--gd-border)', borderRadius: '8px', background: 'var(--gd-bg-elevated)' } },
                  Space(
                    { direction: 'vertical', size: 'sm' },
                    Text({ text: 'Scoped blue' }),
                    Button({ type: 'primary', size: 'sm', text: 'Blue primary' })
                  )
                ),
                ConfigProvider(
                  { theme: 'green', style: { padding: '12px', border: '1px solid var(--gd-border)', borderRadius: '8px', background: 'var(--gd-bg-elevated)' } },
                  Space(
                    { direction: 'vertical', size: 'sm' },
                    Text({ text: 'Scoped green' }),
                    Button({ type: 'primary', size: 'sm', text: 'Green primary' })
                  )
                )
              )
            )
          ),

          this.section(
            'Sign-in form',
            SignInForm({
              email: d.email,
              password: d.password,
              passwordVisible: d.pwVisible,
              onEmail: (email) => this.setData({ email }),
              onPassword: (password) => this.setData({ password }),
              onToggleVisible: () => this.setData({ pwVisible: !d.pwVisible }),
              onSubmit: () => this.toast.show({ message: 'Signed in (demo)', type: 'success' }),
              onContinueWith: (p) => this.toast.show({ message: `Continue with ${p}` }),
            })
          ),

          Fab({
            text: '+',
            onClick: () => this.toast.show({ message: 'FAB clicked', type: 'success' }),
          })
        );
      }
    );
  }
}

startDemoApp({ home: GalleryPage }, undefined, { demo: 'ui-gallery' });
