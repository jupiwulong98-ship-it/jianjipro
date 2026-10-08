# V2 Acceptance Criteria

一个 style / project 只有满足以下条件才算“可用”：

新口播项目输入前置条件：完成 [剪后全文抽取](post-cut-transcript.md)，全文覆盖指定原文轨道的全部分页，字词使用剪后时间，保存来源版本；文字乱码、缺失字词时间、轨道混合或文字/字词不一致时不得交给后续规划。数据校验通过不代表ASR和听音已验收。

1. Style 至少来自 3 条参考视频。
2. 80% 以上正式 decision rules 有两个以上 evidence events。
3. 任意 edit-plan event 都能说明触发语义与 style_rule_id。
4. Planner 不直接指定 card；Router 能解释为什么选择当前候选。
5. 不因关键词相同而机械套同一动画。
6. Router先过input/media兼容，再比较family/subtype与视觉偏好。
7. 5~10秒窗口内会检查效果重复与密度；同结构/同版式不应无理由连续堆叠。
8. Camera / Annotation / Transition 与 Primary Card 分层管理。
9. 库中无匹配模板时能明确返回“需生成新动效”，而不是硬套错误模板。
10. Generated Motion先通过stable-frame QC，重复验证后才允许晋升正式卡。
11. Required素材缺失会阻止证据型执行，真实证据不得伪造。
12. Presenter-safe / Full-screen模式明确，人物和字幕安全区有阻断检查。
13. QC 能定位 timestamp + shot-id/edit-event-id + 修复建议。
14. Stable Frame Gate通过后再做最终整片QC。
15. 人工删除某条规则后，后续计划不得继续调用它。
16. 新增参考视频后可以重新归纳 profile，而不破坏旧版本。

17. 包装事件先有Visual Concepts，来源时间/segment可追溯；Edit Plan与Shotbook不得改写关系。
18. Router候选需真实支持visual_structure，1→N和时间线处理不可偷换成普通列表/步骤；缺实现保留生成请求并阻止静默跳过。
19. Gate B覆盖整片视觉时间轴，识别重复、静态、密度与呼吸问题；保留理由绑定当前计划。
20. Gate D有按时间排列的多帧覆盖和实际观察记录；历史重建、单帧、抽样通过不等同于新成片动态验收。
