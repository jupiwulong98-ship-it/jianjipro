---
name: semantic-mapper
description: 理解口播含义、时间与证据需求，交给画面构思层。
---

# Semantic Mapper Skill

## 任务
把新的口播转成可用于剪辑决策的语义时间轴。

## 正式输入
新口播项目只读取剪辑及字幕校正之后的 `transcript/final-transcript.json`。先按 `docs/style-engine-v2/post-cut-transcript.md` 完整抽取全文和字词时间。确认数据校验通过，原文轨道、ChatCut项目/时间线及来源版本正确；未经完整抽取不能开始正式规划。

`transcript_source` 指向该JSON，`transcript_revision` 保存它的revision。每个segment用 `source_word_ids` 引用剪后字词，start/end复用其时间。可按完整意思合并字幕条，不改写原文、不使用文案字数推测时间、不以原视频时间替代剪后时间。SRT仅作字幕交换文件。

ASR和校正后的原文仍可能存在听音误差，关键锚点需听音复核；字词时间不要求每个字配动画。口播剪切、顺序、字幕文字变化后重新抽取、复核旧语义与画面计划。

## 每个 segment 至少标注
- text
- start/end
- primary intent
- importance
- entities
- numbers
- contrast pair
- rhetorical function
- emotional intensity
- whether visual evidence is useful

## 常见语义
setup, claim, misconception, contrast, number, list, process, example, entity, quote, question, warning, conclusion, CTA.

## 原则
语义标注不直接指定动画、模板或 family。先交 Visual Conceiver 回答“如何被看见”，再由 Edit Planner 安排事件。

输出遵循 `references/style-engine/semantic-map.schema.yaml`；新层复用 segment id、时间、证据需求和claim_status。
