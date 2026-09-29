# Edit Planner Skill

## 输入
- semantic-map
- style-profile
- available motion library manifest
- optional asset inventory

## 输出
严格符合 edit-plan schema。

## 决策顺序
1. 该句是否真的需要视觉事件？
2. 参考风格在相似语义下通常怎么处理？
3. 最近 5~10 秒是否已经使用过同类效果？
4. 库内是否存在精确匹配？
5. 是否可参数化已有模板？
6. 是否需要生成新 motion？
7. 是否需要素材/B-roll而不是 motion？

## 约束
- 不允许每句都加效果。
- 避免连续重复同一个 effect family。
- 效果密度要服从 style profile，而不是追求“越多越好”。
- rationale 必须可追溯到 style_rule_id。
