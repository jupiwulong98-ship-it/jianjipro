# Style Engine V2 Architecture

## 最终链路

参考视频 → Reference Analyzer → reference-events → Style Synthesizer → Style Profile

自己的口播 → Transcript / Alignment → Semantic Mapper → Edit Planner → Asset Gate / Asset Workspace → Shotbook Planner → Motion Router → Primary Card + Annotation / Camera / Transition / SFX → ChatCut Executor → Stable Frame Gate → Render → Final Visual QC → Revision Loop

## Planner 与 Card 的边界
Planner 不知道具体卡片名，只描述信息关系、输入与视觉意图。

## Shotbook 的角色
Edit Plan 是导演决策，Shotbook 是逐镜施工单：
- 这一镜唯一主要视觉任务是什么
- 人物继续在场还是全屏接管
- 吃什么真实素材
- 主卡是什么类型
- 是否叠加标注 / 运镜 / 转场 / SFX
- 安全区是什么
- 稳定帧在哪里审

## Motion Library
真实 JSX 卡片位于 motion-library/cards/。
AI检索入口位于 motion-library/taxonomy/。
卡片只负责 Primary Visual。Camera / Annotation / Transition 不再被迫塞进某一张Card。

## 包装来源优先级
1. 当前 Library 中能力精确匹配的 Card
2. 同 Family 可参数化的 Card
3. 对现有 Card 升级
4. Generated Motion + stable-frame verification
5. 明确降级为干净口播/文字表现

## Evidence
数字、评论、收益、后台、案例截图的视觉存在不代表事实已验证。
Semantic Map / Asset Gate必须保存 claim_status 和 evidence_role。

## 不做
- 不按关键词机械匹配卡片。
- 不因只有现成模板而强行使用错误的信息结构。
- 不逐字复制参考创作者的独创视觉资产。
- 不为运动而运动。
