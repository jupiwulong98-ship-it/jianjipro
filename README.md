# jianjipro

AI 口播视频风格学习、动效规划、素材装配、镜头编排、卡片路由、ChatCut 执行与视觉质检的一体化仓库。

## TalkCraft 能力接入（2026-10-02）

已引入 108 张模板的源码、配方与离线 demo；108 张模板均已接入参数化的独立 Remotion 渲染器；逐卡渲染、替换与 ChatCut 抽帧记录见 full/verification.json。风格参数来自本仓库，复杂效果分段交付 ChatCut。

简版设计：[整合方案](docs/superpowers/specs/2026-10-01-talkcraft-integration-design.md)。命令与制作说明：[TalkCraft 使用说明](motion-library/docs/talkcraft.md)。

工作台入口：在 `motion-library/` 运行 `npm run dev -- --host 127.0.0.1`，网页默认打开剪后全文与画面策划 `/#planning`。新项目完成 `transcript/final-transcript.json` 抽取后自动进入项目列表。查看全部原文、逐字词时间和逐段画面变化，保存意见、处理意见并确认策划；再进入模板与制作。当前载入“找工具”项目的 94 条原文、946 个字词和 33 段 AI 策划初稿，尚未制作或用户确认。使用与数据合同见 [画面策划工作台](docs/style-engine-v2/planning-workbench.md)。

模板浏览入口：同一服务 `/#talkcraft` 或工作台右上角“模板库”。这是模板预览库，剪辑调整仍在 ChatCut。

历史审阅入口：同一服务的 `/#review`（工作台右上角“历史审片”）。保留真实项目“AI 剪辑工具怎么选”的旧 v2 方案：16 段镜头、53 条字幕、画面参考、模板 demo、素材来源和逐段意见。记录保存在 `projects/ai-tools-real-20260930/review.json`，不入 Git；不继承为新策划确认。确认不会自动渲染或修改 ChatCut，后续制作按意见逐条执行。工作台数据读取和意见保存需要本机 Vite 服务，静态托管不提供项目 API。

## 当前模板体系

旧 ChatCut 原生链路的 20 张 Card、预览实现与绑定已移除。模板制作统一使用 TalkCraft + Remotion；ChatCut 用于初剪、字幕与透明片段装配。108 张模板均有实际参数接口；8 张沿用原接口，100 张保留完整源动画。每张卡只能在其素材、时长、条目数和结构约束内使用。历史实跑记录只说明当时的状态，以本页和当前 registry 为准。

## 核心链路

参考视频 → Style Profile

自己的口播 → ChatCut 口播初剪与字幕校正 → 获取剪后全文及字词时间 → Semantic Map → 画面构思 → Edit Plan → Asset Gate / Asset Workspace → Shotbook → Gate B 整片节奏预检 → Motion Router → Primary Card + Camera/Annotation/Transition/SFX → ChatCut → Stable Frame Gate → Final QC（整片时间带 + 动态审片）→ 成片

剪后全文是后续规划的正式文字输入。保存完整原文、句级SRT和字词时间JSON，不从原视频时间或文案长度估算动作时点。流程与命令见 [剪后全文抽取](docs/style-engine-v2/post-cut-transcript.md)。

## 核心原则
语义关系 → 理想画面概念 / 信息结构 → Family / Subtype → Input Requirements → Shotbook → 候选 Cards → Router → Primary Card

然后再独立叠加：
- Annotation：指哪看哪
- Camera：推拉/巡游/轻运镜
- Transition：镜头边界
- SFX：声音重音

所以一镜不等于一张卡。

## 仓库结构
- styles/：参考风格归纳。
- references/samples/：逐视频拆解证据。
- references/style-engine/：Semantic / Visual Concepts / Edit Plan / Shotbook / Asset / Rhythm Review schemas。
- skills/style-engine/：各 Agent 规范。
- motion-specs/：抽象包装规范。
- motion-library/vendor/talkcraft/：108 张上游模板源码、配方与许可。
- motion-library/adapters/talkcraft/：108 张适配卡、能力 registry、逐卡参数合同和主题参数。
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
- Motion Router实际执行脚本：108 张实际参数校验与确定性解析已实现；语义分层与严格关系过滤保留，模板不能改写构思
- ChatCut真实实跑：GitHub找Skill已完成剪切、字幕、素材与包装装配；108 模板的渲染、内容替换和原生抽帧均通过；呈现 V2 已装配，动态与听审需单独记录

首次本机实跑的已验证步骤与阻碍见 [docs/style-engine-v2/first-real-run-2026-09-29.md](docs/style-engine-v2/first-real-run-2026-09-29.md)。

## 画面构思与整片节奏（2026-10-02）

模板选择前先构思画面，Router只实现已确定的关系；无法保留结构返回Generated Motion请求。新增Gate B整片预检和Gate D按时间排列的抽帧复核，复用现有Shotbook与Visual QC。这一步先建立构思与节奏合同；随后按用户要求接入全量108模板。字段、命令和兼容说明见 [画面构思与节奏流程](docs/style-engine-v2/visual-concepts-and-rhythm.md)。

在`motion-library/`运行`npm run style:review -- ../projects/ai-tools-real-20260930`。真实项目 [验证记录](projects/ai-tools-real-20260930/VALIDATION.md) 包含Remotion 1→N、ChatCut时间线处理、旧方案节奏问题及历史62帧时间带。审阅看板同时显示新构思与整片节奏诊断，原画面仍标旧v2参考。新动效尚未生成，新成片尚未验收。


## 全量模板验收与实际呈现改版

执行 `npm --prefix motion-library run talkcraft:verify-all` 会为每张卡绑定明确标注 TEST 的素材，生成四个阶段帧、内容替换帧和1920×1080透明视频。测试证明接口与该组渲染参数可用，不能把演示数据、默认截图或占位人物当实际成果。原始源码保留不改；全部制作能力受 `motion-library/adapters/talkcraft/registry.json` 和 `full/contracts.json` 约束。Router选卡后写 `resolution.adapter_props`，Planner仍只描述真实语义与理想画面。

真实视频V1与V2分别在 `projects/github-skill-real-20261002` 和 `projects/github-skill-real-20261002-v2`。V2重新构思连续网页取景、来源与人物同屏、逐站流程和身份展示；不为使用更多模板而改写不等于、顺序、分支或双条件关系。

108/108 已完成参数绑定、HD ProRes 渲染、可见内容替换，以及独立 ChatCut 测试时间线的代表帧核对。可追踪记录：`motion-library/adapters/talkcraft/full/verification.json`；换源后索引会核对源码哈希，不沿用旧通过状态。实际口播 V2 已去除来源脚注，截图先打码后参与动画，详见其 README。
