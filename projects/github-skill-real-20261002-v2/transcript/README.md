# 剪后全文快照（2026-10-03）

本次只完成剪后全文抽取，不修改既有口播、字幕、包装或项目时间线，也没有继续画面策划。

- ChatCut项目：3d96aaae-2026-4693-9e2a-259e38bb996d。
- 活动时间线：1bb570e0-800e-43ee-a8f6-38bc56f7871b，5994帧。
- 原文轨道：31075d0c-3ded-4b55-ba43-f48b4bb1fbbc。
- 完整读取2页、95条原生字幕；有效文字94条，字词946个。
- 一条空字幕占位保留在capture.json及final-transcript.json的ignored_empty_cards，不补造内容。
- final-transcript.txt为完整原文；final-transcript.json保留字词秒时间；final-transcript.srt保留字幕条毫秒时间。
- 两次完整读回一致；输出全文及946个字词时间逐项与原生数据一致；SRT有94条；抽取工具6项测试通过。
- 数据校验通过；自动识别文字与时间没有在本轮进行全片听音复核。

来源revision：9499f81b9eed99c19096740613a8211957f26c6a439e7014a74a3a2cb7803201。

剪切、重排、字幕文字修改后必须重新抽取并复核下游计划。既有semantic-map和画面方案尚未迁移，不声称已依据这份新快照重新生成。
