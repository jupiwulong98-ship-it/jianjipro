# Motion Specs

这里不是“效果展示库”，而是可执行包装规范。

每个 spec 包含：
- semantic_trigger：什么语义触发
- eligibility：什么情况下才允许使用
- layout：画面构成
- timing：入场/停留/退场节奏
- sequencing：多个元素如何依次出现
- parameters：可替换文本/颜色/位置
- fallback：当前库没有对应模板时如何降级
- evidence：来自参考视频的证据

优先实现顺序：
1. accumulating-side-tags
2. grid-stage-screen
3. screen-primary-circle-pip
4. giant-keyword
5. section-title
