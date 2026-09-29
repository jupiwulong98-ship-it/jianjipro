# V2 Roadmap

## Phase 0 — Framework
- [x] Agent contract
- [x] Reference event schema
- [x] Semantic map schema
- [x] Style profile schema
- [x] Edit plan schema
- [x] Reference analyzer
- [x] Style synthesizer
- [x] Semantic mapper
- [x] Edit planner
- [x] Visual QC

## Phase 1 — 第一位对标博主
- [ ] 收集 3~5 条同风格视频
- [ ] 每条逐事件拆解
- [ ] 生成 evidence index
- [ ] 归纳 style profile v0.1
- [ ] 选一条自己的口播做 semantic map
- [ ] 生成 edit plan
- [ ] 人工复核 plan

## Phase 2 — 执行接入
- [ ] Motion Library manifest adapter
- [ ] ChatCut executor mapping
- [ ] generated motion fallback
- [ ] asset gate
- [ ] SFX router

## Phase 3 — QC 闭环
- [ ] 抽帧
- [ ] 事件时间检查
- [ ] 遮挡/安全区检查
- [ ] 视觉密度检查
- [ ] 同类效果重复检查
- [ ] 自动 revision request

## Phase 4 — 一键入口
目标命令：
```
/learn-style <reference-folder>
/edit <my-video> --style <style-id>
```
