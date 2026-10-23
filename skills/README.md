# Skills

两类 skill：

| 目录 | 归属 | 内容 |
|------|------|------|
| `skills/engine/` | 引擎 | 层级分解、声明式组装、`Component` / `D` / 导航 |
| `skills/blocks/` | 产品 | 编辑器左侧可拖积木（JSON） |

Agent / LLM 写或改 UI 时：**先读** [engine/README.md](./engine/README.md) 的「先拆层级」与「禁止」，再读 [`docs/composition.md`](../docs/composition.md)。不要对着单体命令式 `render` 继续堆代码。

## 产品积木（blocks）

启动时读取 `blocks/manifest.json`。字段：`id` / `kind` / `label` / `icon` / `defaults`。

新增：加 JSON → 写入 manifest → 刷新。`fetch` 失败时产品回退到内置 fallback。

## 引擎约定

见 [engine/README.md](./engine/README.md)。
