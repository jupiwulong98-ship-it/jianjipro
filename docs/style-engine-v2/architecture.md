# Style Engine V2 Architecture

## 目标
输入：
- 1~10 条参考博主视频
- 1 条自己的新口播视频

输出：
- reference events
- style profile
- semantic map
- edit plan
- 渲染后的成片
- visual QC report

## Pipeline
```
reference videos
  -> reference analyzer
  -> reference-events/*.yaml
  -> style synthesizer
  -> styles/<style-id>/style-profile.yaml

new talking-head video
  -> transcript/alignment
  -> semantic mapper
  -> semantic-map.yaml

style-profile + semantic-map
  -> edit planner
  -> edit-plan.yaml

edit-plan
  -> ChatCut / motion library / generated motion / assets / sfx
  -> render
  -> visual-qc
  -> pass OR revision loop
```

## 四种包装来源优先级
1. 现有 Motion Library 精确匹配
2. 现有模板参数化改写
3. 基于已有风格组件组合生成
4. 全新生成包装

## 不做的事
- 不逐字复制参考博主的独创成片内容。
- 不要求新口播与参考口播逐句对应。
- 不把“模板命中率”当最终目标；最终目标是语义、节奏、视觉语言一致。
