---
name: shotbook-planner
description: 把画面概念和Edit Plan落实为完整逐镜合同，执行前进行整片节奏预检。
---

# Shotbook Planner Skill

## 任务
把 Edit Plan 变成逐镜头“实现合同”。Visual Conceiver回答看什么；Edit Planner安排为何/何时呈现；Shotbook Planner回答如何落地。

## 输入
- semantic-map
- visual-concepts
- edit-plan
- style-profile
- asset-requirements / asset-manifest
- source video geometry / presenter position
- caption mode

## 输出
严格符合 `references/style-engine/shotbook.schema.yaml`。

TalkCraft 执行另生成分段计划，字段与例子见 `motion-library/docs/talkcraft.md` 和 `projects/talkcraft-integration-smoke/plan.json`。保留 ChatCut 原始时间映射，以 30 fps 端点计算 start_frame / duration_frames；不要逐段累计取整。

干净口播合法，不强制每句动效。复杂包装按透明视频交付，内部文字/颜色/动效改源参数后局部重渲染；不宣称已转换为 ChatCut 原生可编辑组件。

## 每镜必须明确
1. primary_visual_job：这一镜唯一主要视觉任务。
2. presentation_mode：presenter_safe 或 full_screen。
3. inputs：人物 / 视频 / 图片 / 截图 / UI / 文字 / 镜头边界。
4. primary_motion_request：主信息结构。
5. supporting_layers：annotation / camera / transition / sfx。
6. safe_zones：人物、字幕和自定义保护区。
7. asset_slots：真实素材绑定。
8. rhythm / rhythm_context：标注实际布局、主画面来源、强度、运动、是否新增认知状态。
9. source_edit_event_id / visual_concept_ids / visual_structure：保持跨层追溯。
10. review：稳定帧与阻断检查。

## 版式纪律
- 一镜一个 primary visual job。
- 主视觉、Camera、Annotation、Transition 分层，不把全部需求塞进一张 Card。
- Presenter-safe 模式下不得让关键元素进入人物保护区。
- Full-screen 模式必须真正接管背景，不做半透明“既挡人又不像全屏”的混合态。
- 连续相似构图交Gate B整片节奏预检；有教学连续性或呼吸需求可说明理由保留，不机械换镜。
- 素材关系决定版式：并列≠流程，流程≠对比，多图平级≠时间线。

## 素材纪律
- screenshot承载证据时必须有来源/批准状态。
- 没有真实证据就降级为解释性动效，不伪造后台、评论、收益、Logo或指标。
- Asset Workspace只负责补素材，Shotbook负责说明素材如何进入这一镜。

## 整片预检
覆盖整条视频，包括干净口播。辅助层不作为重复主镜头。使用 `npm run style:review -- <project-dir>` 在Gate B输出visual_timeline和rhythm_review。小字变化标text_only，新增关系/状态标new_state；不得把模板切换本身视为认知变化。有提示先结合上下文修订或记录保留理由，Render之前需要与当前timeline_digest一致的处理结果。
