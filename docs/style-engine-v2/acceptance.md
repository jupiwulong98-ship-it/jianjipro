# V2 Acceptance Criteria

一个 style 只有满足以下条件才算“可用”：

1. 至少来自 3 条参考视频。
2. 80% 以上正式 decision rules 有两个以上 evidence events。
3. 任意 edit-plan event 都能说明触发语义与 style_rule_id。
4. 同一句新文案重复运行时允许有小范围变化，但不应出现完全不同的视觉语言。
5. 不因关键词相同而机械套同一动画。
6. 5~10 秒窗口内会检查效果重复与密度。
7. 库中无匹配模板时能明确返回“需生成新动效”，而不是硬套错误模板。
8. QC 能定位 timestamp + edit-event-id + 修复建议。
9. 人工删除某条规则后，后续计划不得继续调用它。
10. 新增参考视频后可以重新归纳 profile，而不破坏旧版本。
