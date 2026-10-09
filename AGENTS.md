# JIANJIPRO Agent Contract

目标：把参考视频的编辑语言学习成可复用规则，并把全新口播自动规划、补素材、编排镜头、选卡、执行和质检。

## 总流程
1. Reference Analyzer：逐事件拆解参考视频。
2. Style Synthesizer：跨视频归纳 Editorial Grammar + Visual Skin。
3. ChatCut 口播初剪与字幕校正 → 剪后全文抽取：按最终播放顺序完整读取原文字幕及字词时间，保存 final-transcript.json / .txt / .srt；详见 docs/style-engine-v2/post-cut-transcript.md。
4. Semantic Mapper：以剪后全文为输入，理解每个意群的语义关系、证据需求与输入需求。
5. Visual Conceiver：先构思观众最易理解的理想画面，不读取模板库；把剪后全文与逐段画面策划放到本仓库工作台 `/#planning` 审阅，按当前版本保存意见与确认，再交后续制作。详见 docs/style-engine-v2/planning-workbench.md。
6. Edit Planner：生成 Motion Request，不直接指定卡片。
7. Asset Gate / Asset Workspace：识别并补齐真实素材。
8. Shotbook Planner：把导演意图变成逐镜实现合同，确定人物模式、安全区、输入、主卡需求和辅助层。
9. Gate B Rhythm Review：完整Shotbook形成视觉时间轴，检查变化、强弱与呼吸。
10. Motion Router：按 Input → Family → Subtype → Capability 选择 Primary Card。
11. Generated Motion：无合适卡时生成候选，先验证再使用。
12. Executor：ChatCut 按 resolved shotbook / edit plan 执行。
13. Stable Frame Gate：先审代表性稳定帧。
14. Final Visual QC：渲染后按时间抽样成整页时间带，并播放检查整片节奏，问题回对应层返工。

## 决策分层
语义 → 画面概念/信息结构 → Motion Family/Subtype → Input Requirements → Shotbook → Candidate Cards → Router Ranking → Primary Card + Annotation + Camera + Transition + SFX → ChatCut

## 新参考风格 V0.2 的导演与素材规则（优先于旧V0.1默认背景）
- **仅新项目默认使用** `styles/codex-six-skills-tech-v0.2/`，V0.1保持可复现、不改已认可样段。阅读V0.2 README 了解旧项目显式迁移。
- 对标的科技感不是“所有包装背景变蓝”。P05媒体优先/实景可选，P07要真实多媒体成果，P08原参考支持浅暖插画，P09透明大字叠加真人。深蓝只在确有原事件依据时使用。
- 第一次执行 `style:reference` 时需保留 `style-asset-intent.json`，不得将初始真实素材 `required` 静默改为 `none`。在 `style-selection.json` 每镜明确 `background_mode`、`visual_media_kind`、`media_evidence`，包括 `no_match` 的镜头。
- 把同一 `art_direction` 映射传给 Edit Plan 和 Shotbook，确保Gate B验证通过。禁止项目 CSS 统一强制把真实软件界面与浅色模板覆盖成深蓝色。
- V0.2 的 `TechMediaTakeaway` 有显式 `backgroundMode` 可选参数；不传时仍使用旧版深蓝以保护原样段。新项目不得仅依赖组件旧默认色。
- 即使规划pass，仍需动态实片 Contact Sheet＋逐镜媒介对照＋连续听音评审；避免通过改layout标签掩盖色材、媒介单一。
- 真实工程实例修复建议：先检查44.633～49.367s P07、59.2～65.2s P08和72.433～78.933s P10，保护原8秒样段；完整原因见用户10月9日上传的全片诊断报告。

## 参考风格调用（新项目选择参考风格时必须执行）
- 参考视频拆解与日常剪辑是两条流程。已拆解《6个Skill》的来源在 `references/samples/codex-six-skills-20261008/`；实验风格包在 `styles/codex-six-skills-tech-v0.1/`。**新口播不需要重新拆视频**。
- 新项目完成 Semantic Map 与 Visual Concepts 后，运行 `npm --prefix motion-library run style:reference -- --project ../projects/<项目>`。它生成逐段候选与 `style-selection.json`，**只给候选，不自动批准**。
- Codex 必须按真实新口播逐段审阅候选；参考适用时填写 `use_reference`、参考 P 编号、视觉媒介和理由。不适用时填写 `no_match` 和理由。不得为了使用参考模板改变文案含义。
- `use_reference` 的 `style_reference` 必须从 Visual Concepts 的用户选择传递到 Edit Plan 的事件和 Shotbook 的镜头。选择 `P05` 时必须使用真实可定位软件素材，缺素材则向用户索取，禁止用抽象假界面替代。
- 制作前执行 `npm --prefix motion-library run style:reference -- --project ../projects/<项目> --validate` 和正常 `style:review`。如果 style-selection 存在，style:review 会检查每条参考绑定，失败则停止进入正式渲染。参考候选/108卡测试通过不代表最终视觉验收通过。
- 先制作含人物、字幕、实际媒体和完整入场/退场的8~12秒动态样段；用户确认后再批量制作。动态样段不得用静帧或工作台占位预览冒充。细节见 `styles/codex-six-skills-tech-v0.1/README.md`。

## 强制原则
- 新口播项目先完成剪后全文抽取，再做语义与画面规划。不可用录制前文案、原素材转录或仅有句级时间的SRT冒充剪后字词时间；分页未读完、原文轨道不明确或文字/时间校验失败时阻断此交接。
- 字词时间使用剪辑后时间线；保存全文来源版本。口播剪切、顺序或字幕文字变更后重新抽取，下游旧时间与计划需复核。自动时间戳不代表已完成听音验收。
- 画面策划必须在工作台可查：每个意义段写观众目标、开始画面、锚定原文字词的变化动作、结束画面、素材需要和理由；保留人物段也明确记录。不得只在聊天里给方案，或把每条字幕机械变成一张动画卡。全文或策划变化后旧确认失效，保留历史意见；未确认的策划不进入模板制作。
- Planner 禁止直接输出 card_id。
- 卡片名称是执行细节，不是导演语言。
- 数量不是类型；必须先判断并列、流程、比较、证据等信息关系。
- Camera / Annotation / Transition 与 Primary Card 分层。
- Screenshot证据与普通图片分开。
- 口播数字不自动视为已验证事实。
- 每条风格规则必须可追溯到 reference event。
- 真实案例证据不得伪造。
- 模板库是执行资源，不是决策脑。
- 画面构思必须先于模板检索；Router不能改变概念，不支持原结构即返回needs_generation。
- Gate B做整片预检，Gate D做实际时间带及动态审片；不规定每3秒变化，也不要求每句包装。
- 旧计划标legacy_unverified，不等同于新合同通过；字段与命令见docs/style-engine-v2/visual-concepts-and-rhythm.md。
- 没有合适卡片时返回 generated/upgrade request，不允许硬套错误模板。
- Generated Motion通过稳定帧QC后才能用于项目，多次验证后才能晋升正式卡片。
- Presenter-safe / Full-screen模式必须明确。
- 成片不显示来源脚注、仓库地址、调试标签或具体 Skill 名称。来源证据保存在内部记录。
- 截图中的网页链接、仓库地址和具体 Skill 名称必须先打码并写入图片像素，再做动画；禁止只在动画层临时遮挡。渲染前校验已验收素材的哈希，素材变化使旧缓存失效。

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
