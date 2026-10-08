---
name: edit-planner
description: 依据先前画面概念安排导演事件及实现请求，不选择模板。
---

# Edit Planner Skill

## 任务
把 Semantic Map + Visual Concepts + Style Profile 转成“导演意图”，而不是直接选择具体卡片。

## 输入
- semantic-map
- visual-concepts（必须先于模板检索产生）
- style-profile
- 最近一段时间已使用的 motion family / card / layout 历史
- optional asset inventory

## 输出
严格符合 edit-plan.schema.yaml v0.4。

每个需要包装的事件必须输出：
- visual_concept_id
- motion_request.visual_structure（必须与概念一致）
- motion_request.family / subtype
- content
- constraints
- input_types_required / optional
- visual_intent
- presentation_hint
- supporting_layer_hints
- asset_requirements

## 决策顺序
1. 这句话是否真的需要视觉事件？不需要就保持干净口播。
2. 读取已构思的画面、信息结构和visual_focus；若缺概念，先回Visual Conceiver。
3. 信息形状是什么：几个条目、文字多长、有没有数字关系？
4. 这一镜实际需要什么输入：人物、视频、图片、截图、UI、文字？
5. 用现有taxonomy描述实现请求；Style Profile只调节风格，不能把1→N改成列表。
6. 最近 5~10 秒是否连续使用同一 family / layout？
7. 是否需要真实素材？需要则写入 asset_requirements，并标 evidence_need / claim_status。
8. 给出 presentation_hint 和 supporting_layer_hints。
9. 输出 motion_request，停止。不要选 card。

## 强制原则
- 不允许输出具体 card_id。
- 数量不是 family；3个元素既可能是 list，也可能是 process 或 comparison。
- 不允许为了命中已有卡片而改变语义关系或画面概念。
- 需要改变关系、模式或焦点时回画面构思层，并记录revision_reason。
- 不允许每句话都加效果。
- screenshot/evidence 与普通image分开。
- 数字是“口播主张”还是“已验证事实”必须分开。
- rationale 必须能追溯到 style_rule_id。
