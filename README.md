# jianjipro

AI 口播视频风格学习、动效规划、素材装配、镜头编排、卡片路由、ChatCut 执行与视觉质检的一体化仓库。

## 核心链路

参考视频 → Style Profile

自己的口播 → Semantic Map → Edit Plan → Asset Gate / Asset Workspace → Shotbook → Motion Router → Primary Card + Camera/Annotation/Transition/SFX → ChatCut → Stable Frame Gate → Final QC → 成片

## 核心原则
语义关系 → Family / Subtype → Input Requirements → Shotbook → 候选 Cards → Router → Primary Card

然后再独立叠加：
- Annotation：指哪看哪
- Camera：推拉/巡游/轻运镜
- Transition：镜头边界
- SFX：声音重音

所以一镜不等于一张卡。

## 仓库结构
- styles/：参考风格归纳。
- references/samples/：逐视频拆解证据。
- references/style-engine/：Semantic / Edit Plan / Shotbook / Asset schemas。
- skills/style-engine/：各 Agent 规范。
- motion-specs/：抽象包装规范。
- motion-library/cards/：20 张现有真实可渲染卡片及历史版本。
- motion-library/taxonomy/：Family / Subtype / Input / Capability / Layer / Router Policy。
- asset-workspace/：真实素材装配协议。
- projects/：真实视频项目。
- docs/style-engine-v2/：架构、验收和Review Gates。

## 当前状态
- 第一批参考视频与 Style Profile：已完成
- Motion Library统一进本仓库：已完成
- Planner → Shotbook → Router 分层：已建立
- Input Type过滤：已建立
- Asset Workspace协议：已建立
- Stable Frame Review Gate：已建立
- Generated Motion工作流：已建立
- 本地素材装配网页：未开发
- Motion Router实际执行脚本：未开发
- ChatCut完整闭环：未跑通

首次本机实跑的已验证步骤与阻碍见 [docs/style-engine-v2/first-real-run-2026-09-29.md](docs/style-engine-v2/first-real-run-2026-09-29.md)。
