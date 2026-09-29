# Reference Analyzer Skill

## 任务
把参考视频拆成“可学习的编辑事件”，不是写观后感。

## 输入
- reference video
- 可选 transcript/SRT
- 可选 creator/style id

## 输出
- reference-events/<video-id>.yaml
- reference-summary/<video-id>.md

## 方法
1. 建立逐字稿与时间轴。
2. 找所有视觉/声音事件边界。
3. 每个事件填写 reference-event schema。
4. 对每个事件回答：为什么这里要出现这个效果？
5. 区分确定事实与推断，推断必须写 confidence。
6. 不跳过短促事件；连续复合效果拆成多个事件并建立关系。

## 禁止
- 只写“黄色大字、放大、转场”这种无语义触发条件的描述。
- 因为看到了某效果，就默认该效果适合所有相同关键词。
