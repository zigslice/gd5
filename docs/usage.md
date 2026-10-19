# Usage

## 启动

```bash
python3 -m http.server 8080
# 索引：          http://localhost:8080/
# ProtoLive：     http://localhost:8080/protolive.html
# Coding Agent：  http://localhost:8080/agent.html
# Escape Room：   http://localhost:8080/escape.html
```

## 索引

入口：[`index.html`](../index.html) → `src/catalog/`。

`http://localhost:8080/` 是产品与示例的索引，页面本身用 gd5 写（`ComponentRender` 页槽 + UI 组件库）。可以搜索，也可以按「产品 / 示例」筛选。点击卡片才进入子产品或示例页，不会一打开就进 ProtoLive。

| 入口 | 地址 |
|------|------|
| 索引 | http://localhost:8080/ |
| ProtoLive | http://localhost:8080/protolive.html |
| Coding Agent | http://localhost:8080/agent.html |
| 密室逃脱 | http://localhost:8080/escape.html |
| 组件画廊与 demo | `examples/*.html` |

## Coding Agent（产品能力全景 demo）

入口：[`agent.html`](../agent.html) → `src/product/agent/main.js`。

用引擎页面槽 + UI 组件库拼出的 **Coding Agent IDE**：文件树、代码高亮、Agent 对话、To-dos、Terminal、Diff、Command Palette、Settings 模态。

| 操作 | 方式 |
|------|------|
| 切文件 | 左侧树 / 顶栏 Commands |
| 发任务 | 右侧 Agent 输入框 ⌘↵，或「Run demo task」 |
| 看补丁 | 底部 Diff 面板 |
| 命令面板 | ⌘K / 「Commands」 |
| 主题 | Settings 模态 → `setTheme` |

Agent 回合是**本地模拟**（读写 store、刷 todos/diff/terminal），用于探测产品组合能力，不接真实 LLM。

## Escape Room（2D 密室逃脱产品 demo）

入口：[`escape.html`](../escape.html) → `src/product/escape/main.js`。

点阵式 **2D 密室逃脱**（Midnight Archive）：CSS 场景 + 热点、背包、调查面板、密码锁 / 门口令，通关弹出 Win 模态。

| 操作 | 方式 |
|------|------|
| 调查 | 点击场景热点（灯、钟、书架、油画、保险箱、抽屉、门…） |
| 用物品 | 背包里选中物品，再点目标（如钥匙 → 抽屉） |
| 解谜 | 保险箱四位码（钟面）→ 出门口令（抽屉纸条） |
| 重置 | 顶栏「重置」或通关后「再玩一次」 |

同样用 `ComponentRender` 页槽 + 子组件 `mount` + store 驱动，展示非 IDE 类产品组合。

## ProtoLive 操作

| 操作 | 方式 |
|------|------|
| 添加组件 | 点击或拖左侧积木 |
| 编辑属性 | 选中节点后改右侧面板 |
| 预览 | 顶部「预览」→ 引擎 `navigate('preview')` |
| 关闭预览 | 「关闭」或 Esc → `goBack()` |
| 导出 | 「导出 HTML」 |

## 用引擎写新产品页

1. 在 HTML 增加 `<div id="myPage">`
2. `class MyPage extends Component { ... }`
3. 在对应 `main.js` 的 `componentsDef` 注册
4. `navigator.navigate('myPage', params)`

详见 [engine.md](./engine.md) 与 [skills/engine/](../skills/engine/)。
