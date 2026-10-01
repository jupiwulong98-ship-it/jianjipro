# JIANJIPRO Agent Contract

目标：把参考视频的编辑语言学习成可复用规则，并把全新口播自动规划、补素材、编排镜头、选卡、执行和质检。

## 总流程
1. Reference Analyzer：逐事件拆解参考视频。
2. Style Synthesizer：跨视频归纳 Editorial Grammar + Visual Skin。
3. Semantic Mapper：理解新口播每个意群的语义关系、证据需求与输入需求。
4. Edit Planner：生成 Motion Request，不直接指定卡片。
5. Asset Gate / Asset Workspace：识别并补齐真实素材。
6. Shotbook Planner：把导演意图变成逐镜实现合同，确定人物模式、安全区、输入、主卡需求和辅助层。
7. Motion Router：按 Input → Family → Subtype → Capability 选择 Primary Card。
8. Generated Motion：无合适卡时生成候选，先验证再使用。
9. Executor：ChatCut 按 resolved shotbook / edit plan 执行。
10. Stable Frame Gate：先审代表性稳定帧。
11. Final Visual QC：检查整片并返工。

## 决策分层
语义 → Motion Family/Subtype → Input Requirements → Shotbook → Candidate Cards → Router Ranking → Primary Card + Annotation + Camera + Transition + SFX → ChatCut

## 强制原则
- Planner 禁止直接输出 card_id。
- 卡片名称是执行细节，不是导演语言。
- 数量不是类型；必须先判断并列、流程、比较、证据等信息关系。
- Camera / Annotation / Transition 与 Primary Card 分层。
- Screenshot证据与普通图片分开。
- 口播数字不自动视为已验证事实。
- 每条风格规则必须可追溯到 reference event。
- 真实案例证据不得伪造。
- 模板库是执行资源，不是决策脑。
- 没有合适卡片时返回 generated/upgrade request，不允许硬套错误模板。
- Generated Motion通过稳定帧QC后才能用于项目，多次验证后才能晋升正式卡片。
- Presenter-safe / Full-screen模式必须明确。

## 关键目录
- references/samples/：逐视频证据。
- styles/：Style Profile。
- motion-specs/：抽象包装规范。
- motion-library/adapters/talkcraft/：真实可渲染适配卡与 registry。
- motion-library/vendor/talkcraft/：108 张上游模板源码与配方；未适配模板不可直接执行。
- motion-library/taxonomy/：Family、Subtype、Input、Capability、Layer、Router规则。
- asset-workspace/：素材装配协议。
- projects/：真实项目的 semantic map / edit plan / shotbook / assets。
- skills/style-engine/：各 Agent 的执行规范。
