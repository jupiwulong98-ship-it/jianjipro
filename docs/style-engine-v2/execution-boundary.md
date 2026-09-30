# Execution Boundary

## jianjipro 负责
- 学习参考风格
- 语义分析
- Edit Plan
- Asset Gate / Asset Workspace
- Motion Spec
- Router Binding
- QC规则

## 本仓库的 motion-library/ 负责
- 真正可渲染的 JSX Component
- manifest.json
- mediaSlots
- 版本管理
- 动画预览与测试

## 唯一实现位置
卡片实现只在本仓库的 `motion-library/` 维护，不再引用旧的独立仓库。

## TalkCraft 执行来源

完整模板原件在 `motion-library/vendor/talkcraft/`，实拍适配在 `motion-library/adapters/talkcraft/`，独立渲染环境在 `motion-library/runtime-talkcraft/`。工作顺序仍由 jianjipro 风格与语义规划决定；Remotion 生成分段包装，ChatCut 负责初剪与装配。使用说明见 `motion-library/docs/talkcraft.md`。

当前已实现模板检索、八张卡参数适配、确定性解析和分段渲染；ChatCut 输出为装配清单，实际写入由 Codex 调用 ChatCut 工具执行。原独立 TalkCraft 保留，不作为仓库运行依赖。

正确方式是：
```
jianjipro 的计划决定“用什么”
        ↓
binding 决定“调用哪张”
        ↓
motion-library/ 决定“怎么渲染”
```
