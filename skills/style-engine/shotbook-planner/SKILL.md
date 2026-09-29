# Shotbook Planner Skill

## 任务
把 Edit Plan 变成逐镜头“实现合同”。Edit Planner回答为什么需要视觉，Shotbook Planner回答这一镜具体如何落地。

## 输入
- semantic-map
- edit-plan
- style-profile
- asset-requirements / asset-manifest
- source video geometry / presenter position
- caption mode

## 输出
严格符合 `references/style-engine/shotbook.schema.yaml`。

## 每镜必须明确
1. primary_visual_job：这一镜唯一主要视觉任务。
2. presentation_mode：presenter_safe 或 full_screen。
3. inputs：人物 / 视频 / 图片 / 截图 / UI / 文字 / 镜头边界。
4. primary_motion_request：主信息结构。
5. supporting_layers：annotation / camera / transition / sfx。
6. safe_zones：人物、字幕和自定义保护区。
7. asset_slots：真实素材绑定。
8. rhythm_context：前面刚用了什么，避免连续重复。
9. review：稳定帧与阻断检查。

## 版式纪律
- 一镜一个 primary visual job。
- 主视觉、Camera、Annotation、Transition 分层，不把全部需求塞进一张 Card。
- Presenter-safe 模式下不得让关键元素进入人物保护区。
- Full-screen 模式必须真正接管背景，不做半透明“既挡人又不像全屏”的混合态。
- 相邻镜头连续使用同一布局两次后，第三次优先换构图；Style Profile 有明确证据时可例外。
- 素材关系决定版式：并列≠流程，流程≠对比，多图平级≠时间线。

## 素材纪律
- screenshot承载证据时必须有来源/批准状态。
- 没有真实证据就降级为解释性动效，不伪造后台、评论、收益、Logo或指标。
- Asset Workspace只负责补素材，Shotbook负责说明素材如何进入这一镜。
