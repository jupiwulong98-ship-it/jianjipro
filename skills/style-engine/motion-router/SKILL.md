# Motion Router Skill

## 任务
把 Edit Planner 输出的 `motion_request` 解析为真实可执行卡片。

## 输入
- edit-plan 中的 motion_request
- motion-library/taxonomy/families.yaml
- motion-library/taxonomy/card-capabilities.yaml
- motion-library/taxonomy/router-policy.yaml
- asset-manifest
- 最近已使用卡片历史
- style-profile.visual_skin

## 输出
填写 edit-plan 事件中的 `resolution`：
- status
- card_id
- card_version
- score
- reason
- props
- media_bindings

## 决策顺序
1. Family 必须匹配。
2. 优先精确 subtype。
3. 检查 item_count。
4. 检查 required media 是否 ready。
5. 检查人物布局兼容性。
6. 检查 visual skin / density / energy。
7. 对最近重复使用的 family/card 扣分。
8. 选择得分最高且超过阈值的候选。

## 失败策略
若没有合格卡：
1. 同 family 寻找可降级 subtype。
2. 判断现有卡是否只需参数扩展/版本升级。
3. 返回 generated_motion_request。
4. 若该事件不是必须包装，可明确降级为干净口播。

## 禁止
- 不因 card 名字相似直接命中。
- 不允许跨 family 硬套。
- 不允许忽略 required media。
- 不允许 Router 改写 Planner 的语义关系。
