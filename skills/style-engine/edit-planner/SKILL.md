# Edit Planner Skill

## 任务
把 Semantic Map + Style Profile 转成“导演意图”，而不是直接选择具体卡片。

## 输入
- semantic-map
- style-profile
- 最近一段时间已使用的 motion family / card 历史
- optional asset inventory

## 输出
严格符合 `edit-plan.schema.yaml v0.2`。

每个需要包装的事件必须输出 `motion_request`：
- family：信息关系属于哪一类
- subtype：这一类里的具体表达方式
- content：文字、条目、数字、标签
- constraints：数量、长度、人物位置、素材要求
- visual_intent：能量、密度、布局偏好
- avoid：明确不希望出现的表现

## 决策顺序
1. 这句话是否真的需要视觉事件？不需要就保持干净口播。
2. 语义关系是什么：并列、流程、比较、证据、章节、数字还是强调？
3. 信息形状是什么：几个条目、文字多长、有没有数字关系？
4. 参考 Style Profile 在这种语义下通常用哪个 family/subtype？
5. 最近 5~10 秒是否已连续使用同一 family？
6. 是否需要真实素材？需要则写入 asset_requirements。
7. 输出 motion_request，停止。不要选 card。

## 强制原则
- 不允许输出具体 card_id。
- 数量不是 family；3个元素既可能是 list，也可能是 process 或 comparison。
- 不允许为了命中已有卡片而改变语义关系。
- 不允许每句话都加效果。
- rationale 必须能追溯到 style_rule_id。
