# Executor Bindings

这里负责把 jianjipro 的抽象剪辑决策映射到真实执行资源。

原则：
- `motion-specs/` 定义“什么时候用、应该长什么样”。
- `bindings/` 定义“实际调用哪张 ChatCut 卡片/哪个版本”。
- 真正的 JSX 动画代码继续放在 `chatcut-motion-library`，不在 jianjipro 重复维护。
- Planner 不直接依赖具体卡片名；Router 通过 binding 解析。

执行链：
```
Edit Plan
  -> effect_category / motion_spec
  -> binding registry
  -> executable card + version + prop mapping + media slots
  -> ChatCut
```
