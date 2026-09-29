# V2 Roadmap

## Phase 0 — Framework
- [x] Agent contract
- [x] Reference event schema
- [x] Semantic map schema
- [x] Style profile schema
- [x] Edit plan schema v0.2
- [x] Reference analyzer
- [x] Style synthesizer
- [x] Semantic mapper
- [x] Edit planner
- [x] Motion router
- [x] Visual QC

## Phase 1 — 第一批参考风格
- [x] 收集 3 条参考视频
- [x] 每条逐事件拆解
- [x] 生成 evidence index
- [x] 归纳 style profile v0.1
- [x] 用真实文案测试 semantic map
- [x] 生成第一版 edit plan
- [x] 暴露真实 motion / asset 缺口

## Phase 2 — Motion Library 统一
- [x] 把旧 Motion Library 完整迁入 jianjipro
- [x] 保留真实 cards / versions / manifests / tests
- [x] 建立 Motion Family / Subtype
- [x] 建立 20 张卡片 Capability Index
- [x] 建立 Router Policy
- [x] Planner 禁止直接选 card
- [ ] 升级 tag-list / side-tag-cluster 的自适应能力
- [ ] 升级 process-map-scene 支持 3~8 节点
- [ ] 补 metric-comparison
- [ ] 补 statement-pair
- [ ] 补 equation-stack
- [ ] 补 checklist-card

## Phase 3 — Asset + Executor
- [x] Asset Workspace 数据协议
- [x] Asset requirements schema
- [x] Asset manifest schema
- [ ] 本地素材装配网页
- [ ] Motion Router 实际脚本
- [ ] ChatCut executor mapping
- [ ] Generated Motion fallback
- [ ] SFX router

## Phase 4 — 第一次真实口播闭环
- [ ] 输入原始口播视频
- [ ] 对齐 transcript / timestamp
- [ ] Semantic Map
- [ ] Motion Request Edit Plan
- [ ] Asset Gate
- [ ] Router Resolve
- [ ] ChatCut 自动装配
- [ ] Render
- [ ] Visual QC
- [ ] Revision Loop

## Phase 5 — 一键入口

目标：

```
/learn-style <reference-folder>
/edit <my-video> --style <style-id>
```
