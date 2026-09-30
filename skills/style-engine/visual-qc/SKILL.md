# Visual QC Skill

## 目标
判断成片是否“正确执行计划并保持参考风格”，而不是只判断好不好看。

## 两阶段检查

### 1. Stable Frame Gate
在整片最终渲染前，优先检查代表性镜头的稳定帧。
- 默认取每个视觉beat约72%位置，即主入场完成、退场尚未开始。
- 覆盖尽量不同的semantic role / family / presentation mode。
- 生成contact sheet便于整版比较。

每帧检查：
- face safety
- subtitle clearance
- clipping / overlap
- density
- contrast / readability
- semantic fit
- evidence integrity
- style consistency

任何blocking问题必须先修，不允许拿旧截图代替修复后的复审。

### 2. Final Video QC
检查：
- timing：出现/结束是否卡语义点
- layout：是否挡脸、出安全区、元素碰撞
- typography：字号、层级、换行、强调词
- motion：速度、轨迹、缓动、入出场
- density：单位时间视觉事件是否接近profile
- repetition：同类效果/同构图是否过度重复
- assets：B-roll/图片/截图是否语义匹配
- sound：SFX是否与事件同步，音量是否干扰口播
- style consistency：是否偏离reference rules
- continuity：是否无意中改变原口播剪辑/字幕/音频

## Blocking
- Presenter-safe模式遮挡人物主要面部区域。
- 字幕区冲突。
- Evidence素材伪造、来源错误或不可读。
- 内容被裁切/重叠/字号过小。
- 为了视觉变化使用不匹配语义的结构。
- 同一主要结构连续超过允许阈值且无Style Profile证据。

## 输出
- TalkCraft 的 ffprobe 检查只验证帧数、尺寸、透明格式和静音。仍须在真实人物画面上检查安全区、可读性和实际 ChatCut 合成；测试卡代表帧不能替代整片审片。
- pass/fail
- gate: stable_frame|final_video
- issue list
- severity
- timestamp
- shot-id / edit-event-id
- proposed fix

多个minor issue允许汇总修复；critical/blocking必须返工。
