# AIJIANJI V2 Agent Contract

本分支目标：把“参考博主剪辑风格”抽象为可复用 Style Profile，再应用到新的口播视频。

## 总流程
1. Reference Analyzer：逐事件拆解参考视频，不只记录“发生了什么”，还记录“为什么在这里发生”。
2. Style Profile：把多个参考视频归纳为稳定规则、概率、禁用项和视觉参数。
3. Semantic Mapper：把新口播按句/意群标注意图、实体、数字、对比、结论、反问、警告等语义。
4. Edit Planner：用 Style Profile + Semantic Map 生成可执行 Edit Decision List。
5. Executor：基础剪辑交给 ChatCut；已有包装优先复用个人 Motion Library；无合适模板时允许生成新包装。
6. Visual QC：渲染后检查时间、布局、文字、节奏、重复度和风格一致性；失败则回到 Planner/Executor 修正。

## 强制原则
- 不允许“看起来像”但无证据地编造参考风格规则。
- 每条风格规则必须能追溯到 reference event。
- 不允许仅按关键词选动画，必须同时考虑语义角色、节奏上下文和前后效果重复。
- 模板库是缓存，不是决策脑。
- 新生成的动效必须先进入候选区，通过 QC 后才能成为正式可复用模板。
- 一切最终输出都应优先结构化（YAML/JSON），方便 Codex 和脚本继续消费。

## 关键目录
- styles/：每个博主/风格一个 profile。
- references/style-engine/：结构规范和 schema。
- skills/style-engine/：Agent 执行规范。
- docs/style-engine-v2/：架构、视频输入和验收说明。
- outputs/：运行时产物，默认不提交大型视频文件。
