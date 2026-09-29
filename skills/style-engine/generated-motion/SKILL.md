# Generated Motion Skill

## 任务
当 Motion Router 找不到合适真实 Card 时，生成一次性的候选 Motion，并通过视觉验证后决定是否沉淀进 Library。

## 触发条件
- 没有精确 family/subtype 卡片；
- 现有卡片的数量/素材/布局能力不满足；
- 强行降级会破坏语义关系。

## 输入
- motion_request
- shotbook shot
- style_profile.visual_skin
- asset_manifest
- safe_zones

## 输出
- candidate component
- candidate manifest
- preview stills
- validation report
- promotion recommendation

## Deliver-and-Verify
1. 先生成最小可渲染候选。
2. 渲染稳定帧，不先渲整条视频。
3. 检查：语义是否正确、人物/字幕安全、文字可读、素材不失真、运动是否seek-safe。
4. 有问题先改候选，再重新渲染稳定帧。
5. 候选通过后才进入当前项目。
6. 同类需求在多个真实项目重复出现并通过QC后，才晋升为正式 Motion Library Card。

## 禁止
- 随机值/依赖实时时钟导致同帧不确定。
- 为了视觉炫技改变原来的信息关系。
- 伪造证据素材。
- 未经QC直接写入正式卡库。
