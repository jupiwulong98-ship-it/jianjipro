# Asset Workspace

这是“Edit Plan”和“Executor”之间的人工补素材层。

目标：
- AI先根据 edit-plan 判断哪些事件需要真实素材。
- 系统生成 asset-requirements.yaml。
- 用户只负责把真实图片/视频/截图放进对应槽位。
- 前端网页未来只是这个目录的可视化编辑器，不承担业务逻辑。
- Executor只读取 asset-manifest.yaml，不需要理解网页状态。

## 项目内推荐结构

```
projects/<project-id>/
  source/
    talking-head.mp4
  plan/
    semantic-map.yaml
    edit-plan.yaml
    asset-requirements.yaml
  assets/
    <event-id>/
  asset-manifest.yaml
  output/
```

## 素材状态

- required：缺失时阻止最终执行。
- recommended：有则增强，没有可降级。
- optional：纯增强，不影响执行。
- not_needed：该事件不需要外部真实素材。

## 执行原则

1. 真实案例证据不得伪造。
2. 每个素材槽位必须绑定 edit-event-id。
3. 用户不需要手动贴时间线，只需要把素材放入槽位。
4. Executor根据 edit-plan 中的事件时间自动放置、裁切、缩放、包装。
5. 素材缺失时优先使用明确的 fallback，而不是随意生成假素材。
