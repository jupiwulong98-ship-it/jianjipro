---
name: visual-qc
description: 在Shotbook、稳定帧与成片三个Review位置检查画面安全、语义和整片变化强弱。
---

# Visual QC Skill

## 目标
判断成片是否“正确执行计划并保持参考风格”，而不是只判断好不好看。

## 检查位置

### Gate B — Shotbook整片节奏预检

正式执行前运行style:review，以完整Shotbook检查长人物弱变化、连续相似构图、机械循环、同结构重复、包装密度不均和缺少呼吸。每镜标注layout、visual_subject、visual_intensity、motion_strength及information_change。字词变化不等于新认知，模板切换不等于有效视觉变化。阈值为提示，不要求每3秒加效果。有语义或停留理由可记录accepted_context；缺失时间轴/标注不可豁免。

### Gate C — Stable Frame Gate
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

### Gate D — Final Video QC

运行style:frames对真实合成视频取均匀帧、每镜早期/稳定帧和片尾，生成按时间排序的HTML时间带与contact sheet。逐页读整条变化，不能只看一两帧。根据看到的画面写observed Shotbook（annotation_source: sampled_visual_observation），用style:review --frames生成带抽样来源的D报告。

抽帧工具不自动理解画面；无启发式问题只能needs_visual_review。历史透明包装重建必须明确标历史诊断。还需播放检查动画速度、停留、字幕和声音；不能把静帧时间带当成最终成片通过。

字段和命令见 `docs/style-engine-v2/visual-concepts-and-rhythm.md`，输出遵循rhythm-review.schema.yaml。
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
- 概念关系被实现偷换，或required素材未就绪。
- 节奏提示需结合信息与上下文处理，不因达到固定镜头数量自动强制换结构。

## 输出
- TalkCraft 的 ffprobe 检查只验证帧数、尺寸、透明格式和静音。仍须在真实人物画面上检查安全区、可读性和实际 ChatCut 合成；测试卡代表帧不能替代整片审片。
- pass/fail
- gate: B（rhythm）|C（stable_frame）|D（final_video + rhythm）
- issue list
- severity
- timestamp
- shot-id / edit-event-id
- proposed fix

多个minor issue允许汇总修复；critical/blocking必须返工。
