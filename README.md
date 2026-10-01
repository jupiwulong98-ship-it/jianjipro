# jianjipro

AI 口播视频风格学习、动效规划、素材装配、镜头编排、卡片路由、ChatCut 执行与视觉质检的一体化仓库。

## TalkCraft 能力接入（2026-10-01）

已引入 108 张模板的源码、配方与离线 demo；八张实拍适配卡可通过独立 Remotion 环境按镜头渲染。风格参数来自本仓库，复杂效果分段交付 ChatCut。

简版设计：[整合方案](docs/superpowers/specs/2026-10-01-talkcraft-integration-design.md)。命令与制作说明：[TalkCraft 使用说明](motion-library/docs/talkcraft.md)。

模板浏览入口：在 `motion-library/` 运行 `npm run dev`，网页默认打开 TalkCraft 模板库。这是模板预览库，剪辑调整仍在 ChatCut。

项目审阅入口：同一服务的 `/#review`（页面按钮“打开口播项目审阅”）。当前用真实项目“AI 剪辑工具怎么选”的旧 v2 方案占位：16 段镜头、53 条字幕、画面参考、模板 demo、素材来源和逐段意见。可建议更换模板、处理意见、确认方案；记录保存在 `projects/ai-tools-real-20260930/review.json`，不入 Git。确认不会自动渲染或修改 ChatCut，后续制作按意见逐条执行。静态托管只可浏览，保存需要本机 Vite 服务。

## 当前模板体系

旧 ChatCut 原生链路的 20 张 Card、预览实现与绑定已移除。模板制作统一使用 TalkCraft + Remotion；ChatCut 用于初剪、字幕与透明片段装配。108 张模板中，目前 8 张有真实参数适配与确定性解析，其他需适配后使用。历史实跑记录只说明当时的状态，以本页和当前 registry 为准。

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
- motion-library/vendor/talkcraft/：108 张上游模板源码、配方与许可。
- motion-library/adapters/talkcraft/：8 张适配卡、能力 registry 和主题参数。
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
- 项目审阅看板：已实现画面/模板/素材查看与意见保存；自动素材装配未实现
- Motion Router实际执行脚本：TalkCraft 八张适配卡的确定性解析已实现；全库综合路由尚未实现
- ChatCut完整闭环：未跑通

首次本机实跑的已验证步骤与阻碍见 [docs/style-engine-v2/first-real-run-2026-09-29.md](docs/style-engine-v2/first-real-run-2026-09-29.md)。
