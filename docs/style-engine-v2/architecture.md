# Style Engine V2 Architecture

## 最终链路

参考视频 → Reference Analyzer → reference-events → Style Synthesizer → Style Profile

自己的口播 → ChatCut 初剪与字幕校正 → 剪后全文抽取（全文 + 字词时间）→ Semantic Mapper → Visual Conceiver（画面构思）→ Edit Planner → Asset Gate / Asset Workspace → Shotbook Planner → Gate B Rhythm Review → Motion Router → Primary Card + Annotation / Camera / Transition / SFX → ChatCut Executor → Stable Frame Gate → Render → Final Visual QC（整片时间带 + 动态审片） → Revision Loop

新增输入交接规则见 [剪后全文抽取](post-cut-transcript.md)。全文及字词时间来自最终剪辑的原文字幕，后续语义段和动作时点引用这个来源版本；SRT保留字幕条时间，字词JSON保留更细的时间。初剪或字幕文字变更后重新抽取并复核下游计划。

## Planner 与 Card 的边界
Semantic Mapper理解口播含义；Visual Conceiver先独立构思理想画面与关系，不读取模板目录。Planner依据概念安排导演事件，不知道具体卡片名。Shotbook把同一概念落实成逐镜合同；Router只检验候选是否保留结构，不能修改概念。没有合适实现时Generated Motion接收完整原概念。

## Shotbook 的角色
Edit Plan 是导演决策，Shotbook 是逐镜施工单：
- 这一镜唯一主要视觉任务是什么
- 人物继续在场还是全屏接管
- 吃什么真实素材
- 主卡是什么类型
- 是否叠加标注 / 运镜 / 转场 / SFX
- 安全区是什么
- 稳定帧在哪里审

## Motion Library
2026-10-01 起旧 ChatCut 原生卡已移除。真实 TSX 适配卡位于 motion-library/adapters/talkcraft/cards/，执行能力索引为 adapters/talkcraft/registry.json。
AI检索入口位于 motion-library/taxonomy/。
卡片只负责 Primary Visual。Camera / Annotation / Transition 不再被迫塞进某一张Card。

## 包装来源优先级
1. 当前 Library 中能力精确匹配的 Card
2. 同 Family 可参数化的 Card
3. 对现有 Card 升级
4. Generated Motion + stable-frame verification
5. 明确降级为干净口播/文字表现

## Evidence
数字、评论、收益、后台、案例截图的视觉存在不代表事实已验证。
Semantic Map / Asset Gate必须保存 claim_status 和 evidence_role。

## 不做
- 不按关键词机械匹配卡片。
- 不因只有现成模板而强行使用错误的信息结构。
- 不逐字复制参考创作者的独创视觉资产。
- 不为运动而运动。

## 新增合同与Review位置

画面构思新增独立Skill和轻量visual-concepts文档；复用现有segment id、时间、人物模式、证据字段与素材槽。Edit Plan v0.4、Shotbook v0.2通过概念引用保持跨层一致。Gate B使用完整Shotbook形成视觉时间轴；Gate C保留单镜稳定帧安全检查；Gate D增加整页连续抽样观察，不用单帧通过代替整片节奏。实现与兼容边界见 [画面构思与节奏](visual-concepts-and-rhythm.md)。
