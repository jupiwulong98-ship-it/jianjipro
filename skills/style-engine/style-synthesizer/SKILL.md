# Style Synthesizer Skill

## 任务
把同一创作者的多条 reference-events 归纳成稳定、可执行、可追溯的 Style Profile。

## 输入
- 同一 creator 的 3~10 个 reference-events YAML
- style-profile schema

## 输出
- styles/<style-id>/style-profile.yaml
- styles/<style-id>/evidence-index.yaml
- styles/<style-id>/README.md

## 归纳规则
1. 单条视频只允许产生候选规则；至少在 2 条视频重复出现，才升级为稳定规则。
2. 每条 rule 记录 evidence：video_id + event_id。
3. 区分：
   - hard rule：高度稳定
   - preference：高频偏好
   - optional pattern：偶发可用
   - negative rule：明确避免
4. 同一语义可能有多个效果，记录条件和权重，不强制一对一。
5. 同一效果如果对应多种语义，必须写清 context conditions。
6. 统计视觉事件间隔、同类重复、字幕层级、镜头变化、B-roll比例和SFX密度。

## 关键目标
学“编辑决策分布”，不是复制某一条视频的时间线。
