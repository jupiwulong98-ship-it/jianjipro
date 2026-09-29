# Execution Boundary

## jianjipro 负责
- 学习参考风格
- 语义分析
- Edit Plan
- Asset Gate / Asset Workspace
- Motion Spec
- Router Binding
- QC规则

## chatcut-motion-library 负责
- 真正可渲染的 JSX Component
- manifest.json
- mediaSlots
- 版本管理
- 动画预览与测试

## 为什么不把卡片代码复制进 jianjipro
否则会出现两份动画实现：
- 一份在 jianjipro
- 一份在 chatcut-motion-library

两边版本会很快漂移。

正确方式是：
```
jianjipro 决定“用什么”
        ↓
binding 决定“调用哪张”
        ↓
chatcut-motion-library 决定“怎么渲染”
```
