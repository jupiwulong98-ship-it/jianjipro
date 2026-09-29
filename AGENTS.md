# JIANJIPRO Agent Contract

目标：把“参考视频的编辑语言”学习成可复用规则，并把全新口播自动规划、补素材、选卡、执行和质检。

## 总流程
1. Reference Analyzer：逐事件拆解参考视频。
2. Style Synthesizer：跨视频归纳 Editorial Grammar + Visual Skin。
3. Semantic Mapper：理解新口播每个意群的语义关系。
4. Edit Planner：只生成 Motion Request，不直接指定卡片。
5. Asset Gate / Asset Workspace：识别并补齐真实素材。
6. Motion Router：按 Family → Subtype → Capability 从本地 Motion Library 选择真实卡片。
7. Executor：ChatCut 按 resolved edit plan 执行。
8. Visual QC：检查时间、布局、密度、重复、素材与风格一致性，失败则返工。

## 决策分层
```
语义
→ Motion Family
→ Subtype
→ Candidate Cards
→ Router Ranking
→ Card + Params + Media
→ ChatCut
```

## 强制原则
- Planner 禁止直接输出 card_id。
- 卡片名称是执行细节，不是导演语言。
- 数量不是类型；必须先判断并列、流程、比较、证据等信息关系。
- 每条风格规则必须可追溯到 reference event。
- 真实案例证据不得伪造。
- 模板库是执行资源，不是决策脑。
- 没有合适卡片时返回 generated/upgrade request，不允许硬套错误模板。
- 新动效通过 QC 后才能升级为正式可复用卡片。

## 关键目录
- `references/samples/`：逐视频证据。
- `styles/`：Style Profile。
- `motion-specs/`：抽象包装规范。
- `motion-library/cards/`：真实可渲染卡片。
- `motion-library/taxonomy/`：Family、Subtype、卡片能力与Router规则。
- `asset-workspace/`：素材装配协议。
- `projects/`：真实项目的 semantic map / edit plan / assets。
- `skills/style-engine/`：各 Agent 的执行规范。
