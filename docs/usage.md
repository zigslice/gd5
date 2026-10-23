# Usage

## 启动

```bash
python3 -m http.server 8080
# 索引：          http://localhost:8080/
# ProtoLive：     http://localhost:8080/protolive.html
# Coding Agent：  http://localhost:8080/agent.html
# Escape Room：   http://localhost:8080/escape.html
# 潮前线：        http://localhost:8080/archipelago.html
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
| 潮前线 | http://localhost:8080/archipelago.html |
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

## 潮前线（3D 群岛防御产品 demo）

入口：[`archipelago.html`](../archipelago.html) → `src/product/archipelago/main.js`。

海洋上有多座岛，沿航线一座一座进去。进入岛屿后先在左侧布防，兵按人数站在岛上，一座岛有人数上限，满了就不能再放。开始回合后，NPC 坐船分批开向码头这一个上岸口，上岸后和岛上的兵对打。守住就拿奖励、升级，回到地图后这座岛换成已防御的颜色。

兵种和技能有冷却，人在地图上时冷却不会自己走完，要点「刷新前线」。刷新会把前线推进到最近一次守住的岛的前一排，新的一排开始积累攻势。这一排如果全部失守，之前防御成功的岛会重新丢失。

| 操作 | 方式 |
|------|------|
| 进入岛屿 | 点海图上的沙色岛，或左侧「进入 · 岛屿视角」。左侧面板会换成布防 |
| 布防 | 左侧选兵种，再点岛面。人数到上限后按钮不可用 |
| 调动 | 点自己的兵，再点地面 |
| 开始回合 | 左侧「开始回合」。敌船只从码头上岸 |
| 技能 | 交战时左侧「退潮」「灯塔」 |
| 返回 | 布防阶段「返回海图」不记失守。交战中「撤退失守」 |
| 刷新前线 | 地图上的「刷新前线」 |
| 失守 | 房子全毁，或攻势条满，或交战中撤退 |

## ProtoLive 操作

| 操作 | 方式 |
|------|------|
| 添加组件 | 点击或拖左侧积木 |
| 编辑属性 | 选中节点后改右侧面板 |
| 预览 | 顶部「预览」→ 引擎 `navigate('preview')` |
| 关闭预览 | 「关闭」或 Esc → `goBack()` |
| 导出 | 「导出 HTML」 |

## 用引擎写新产品页

1. **先画组件树**（侧栏 / 详情 / 工具栏各一节点），见 [composition.md](./composition.md)
2. 在 HTML 增加 `<div id="myPage">`
3. 每个节点一个 `extends Component`；页面只 `ensureShell` 组装子组件
4. 在对应 `main.js` 的 `componentsDef` 注册
5. `navigator.navigate('myPage', params)`

禁止在单个 `render` 里用 `createElement` / `appendChild` 灌整页。详见 [engine.md](./engine.md) 与 [skills/engine/](../skills/engine/)。
