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

正确方式是：
```
jianjipro 的计划决定“用什么”
        ↓
binding 决定“调用哪张”
        ↓
motion-library/ 决定“怎么渲染”
```
