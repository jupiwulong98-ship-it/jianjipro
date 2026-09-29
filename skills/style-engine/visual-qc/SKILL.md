# Visual QC Skill

## 目标
判断成片是否“正确执行计划并保持参考风格”，而不是只判断好不好看。

## 检查维度
- timing：出现/结束是否卡语义点
- layout：是否挡脸、出安全区、元素碰撞
- typography：字号、层级、换行、强调词
- motion：速度、轨迹、缓动、入出场
- density：单位时间视觉事件是否接近 profile
- repetition：同类效果是否过度重复
- assets：B-roll/图片是否语义匹配
- sound：SFX 是否与事件同步，音量是否干扰口播
- style consistency：是否偏离 reference rules

## 输出
- pass/fail
- issue list
- severity
- timestamp
- proposed fix
- affected edit-event-id

任何 critical issue 必须返工；多个 minor issue 允许汇总修复后再次渲染。
