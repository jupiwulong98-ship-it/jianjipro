# jianjipro

AI 口播视频风格学习、动效规划、素材装配、卡片路由、ChatCut 执行与视觉质检的一体化仓库。

## 核心链路

```
参考视频
→ Reference Analyzer
→ Style Profile

自己的口播
→ Semantic Mapper
→ Edit Planner
→ Motion Request
→ Asset Gate / Asset Workspace
→ Motion Router
→ Motion Library Card
→ ChatCut
→ Visual QC
→ 成片
```

## 关键原则

Planner 不直接选卡片。

```
语义
→ Motion Family
→ Subtype
→ 候选 Cards
→ Router Ranking
→ Card + Params + Media
```

例如“选题、流量、转化”：

```
list
→ key-points
→ tag-list / side-tag-cluster / future variants
```

而“找客户 → 问需求 → 报价 → 交付”：

```
process
→ process-map
→ process-map-scene / future dynamic variants
```

## 仓库结构

- `styles/`：参考风格归纳。
- `references/samples/`：逐视频拆解证据。
- `skills/style-engine/`：各 Agent 规范。
- `motion-specs/`：抽象包装规范。
- `motion-library/cards/`：20 张真实可渲染卡片及历史版本。
- `motion-library/taxonomy/`：Family / Subtype / Capability / Router Policy。
- `asset-workspace/`：真实素材装配协议。
- `projects/`：真实视频项目。
- `bindings/`：执行兼容层。
- `docs/style-engine-v2/`：架构与验收说明。

## 当前状态

- Style Engine 框架：已建立
- 第一批 3 条参考视频：已拆解
- 第一个 Style Profile：已建立
- Motion Library：已迁入本仓库，114 个文件 / 20 张卡片
- Motion Taxonomy：已建立
- Planner → Router 分层：已建立
- Asset Workspace：协议已建立，网页暂未开发
- 真实口播完整 ChatCut 闭环：下一阶段
