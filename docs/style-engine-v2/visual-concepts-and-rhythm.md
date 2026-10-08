# 画面构思与整片节奏检查

Semantic Mapper 理解「说什么」。新增 Visual Conceiver 先回答「最好看见什么」，不读模板目录。Edit Planner 安排事件和时间，Shotbook 落实逐镜合同。Motion Router 只选择实现，不能改写画面概念。未适配的结构交 Generated Motion，而不是扩充模板数量或硬套旧卡。

## 复用与新增

复用 Semantic Map 的 segment id、时间、importance、evidence_need 和 claim_status；复用 Edit Plan 的事件、Motion Request、素材需求；复用 Shotbook 的人物模式、保护区、素材槽、辅助层和review；复用既有 TalkCraft registry、resolver及render入口。没有重写这些分层。

新增一个 `visual-conceiver` Skill、`visual-concepts.schema.yaml` 和 `rhythm-review.schema.yaml`。Edit Plan v0.4 增加 visual_concept_id 和 visual_structure；Shotbook v0.2 增加概念引用及整片 rhythm 标注。Schema YAML 是字段说明，JSON 是运行载体，代码校验在 `motion-library/scripts/style-contract.mjs`。

`visual_structure` 是关系标识，`structure_description` 描述具体对象：not_equal、sequence、parallel、center_branches、one_to_many、before_after、input_process_output、comparison、hierarchy、timeline、decision_tree、single_focus；特殊创意可用custom并说明关系。结构不等同于family，3个对象不自动成为list。

registry 新增 `visual_structures`，描述现有适配组件真实能表达的关系。编号堆叠只开放sequence，不能冒充one_to_many或时间线处理。未支持关系输出 `resolution.status: needs_generation` 和完整 generated_motion_request。当前命令不会自动写新的Generated Motion组件；Skill生成候选后仍需稳定帧和真实素材验收。渲染遇到未实现请求会中止。

## Gate B：执行前的整片预检

Shotbook 必须覆盖完整主画面，包括干净口播。辅助层放supporting_layers，不另造重叠的主镜头。执行载体沿用start_frame/duration_frames；普通秒时间Shotbook也可用于节奏分析。

每镜rhythm记录：layout、visual_intensity、visual_subject、motion_strength、information_change、visualizable和annotation_source。布局名表达构图，不能以卡名命名来掩盖重复。只有新关系、状态或观察焦点才标new_state；小字替换标text_only，模板切换本身不是新认知。

检查连续人物弱变化、连续构图/屏幕布局重复、2或3镜的机械循环、强包装集中、相同信息结构重复、连续高强度缺少呼吸。输入缺失或时间轴空缺明确报错，不能当成通过。

默认长静态提示12秒、重复提示3镜、机械循环3轮、强包装连用3镜、密度窗口20秒。这些都是可调启发式预警，不是剪辑强制频率，不要求每3秒加效果，不要求密度均匀。低强度人物停留没有可视觉化任务时只给low提示。阈值可在rhythm_policy覆盖。

在 `motion-library/` 运行：

```bash
npm run style:review -- ../projects/ai-tools-real-20260930
```

项目目录包含semantic-map.json、visual-concepts.json、edit-plan.json、shotbook.json。命令校验跨层合同，并输出validation/planning-contract.json、rhythm-review.json、resolved-plan.json；Resolved文件内联概念且修正素材相对目录，可交既有talkcraft:resolve/render。只评估完整Shotbook也可直接传其JSON。

有提示先修订或记录保留理由：Shotbook.rhythm_review包含当前timeline_digest及decisions，每项写issue_id、decision: accepted_context、具体reason。时间轴或policy变更后旧结果失效。不能豁免缺失标注/空缺时间轴。新合同的整片render必须经过Gate B，代表帧--stills可先跑以帮助修订。重复结构是否保留由整片review处理，新合同Router不再用旧的“第三次直接拒绝”代替审阅。

## Gate C与D：复用Visual QC

Gate C仍检查每个视觉beat主要入场完成后的稳定帧，默认72%，用于局部语义、布局和素材安全。

Gate D增加整条视频的均匀抽样、每镜早期帧、稳定帧和片尾。默认4秒只是抽样覆盖间隔，不是效果频率。所有帧按真实时间排序，生成HTML时间带、带时间标注的contact sheet和frames-manifest.json：

```bash
npm run style:frames -- ../projects/ai-tools-real-20260930/shotbook.json --video /absolute/path/full-video.mp4 --out ../projects/ai-tools-real-20260930/validation/frames
```

必须传完整合成视频；透明包装层和时长不足的片段被拒绝。代码只抽帧，不声称已实现自动视觉识别。AI/人工读整页后更新观察版Shotbook的rhythm，annotation_source写sampled_visual_observation，再生成D报告：

```bash
npm run style:review -- ../projects/ai-tools-real-20260930/shotbook.observed-v2.json --frames ../projects/ai-tools-real-20260930/validation/frames/frames-manifest.json --out ../projects/ai-tools-real-20260930/validation/rendered-v2
```

报告保留抽样来源；没有发现启发式问题也只标needs_visual_review，不能自动当成完整动态审片通过。仍需播放检查节奏、运动、阅读停留、字幕和声音。

本项目没有新的完整成片，验证使用 `--legacy-project` 读取旧工程透明包装及真实初剪帧映射重建历史画面。这个专用诊断模式明确标historical_v2_reconstructed_composites，未包含最终字幕/声音，不冒充新方案或实时ChatCut画面。普通项目使用--video。

## 兼容与执行限制

新计划明确设置visual_contract_version: "0.1"，包装镜头必须引用一个主概念；多个概念拆成beat。无视觉任务的干净口播无需概念。要取消一个既有概念必须回规划层修订并记录理由，不能仅在Router打clean_presenter绕过合同。

旧v0.3 Edit Plan和历史渲染输入仍可诊断/运行，但明确标legacy_unverified，不能作为新流程验收。未扩充TalkCraft适配卡，未改原始口播、字幕、用户review.json或ChatCut工程。真实项目输出为待审AI方案；实际新Generated Motion和成片验收是后续制作工作。
