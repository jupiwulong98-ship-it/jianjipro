# Motion Router Skill

## 任务
把 Shotbook / Edit Plan 的 motion_request 解析为真实可执行 Primary Card。

## 输入
- TalkCraft 候选：`motion-library/adapters/talkcraft/registry.json`；完整浏览库：`motion-library/src/talkcraft/catalog.json`。
- shotbook shot / edit-plan motion_request
- motion-library/taxonomy/input-types.yaml
- motion-library/taxonomy/card-input-index.yaml
- motion-library/taxonomy/families.yaml
- motion-library/taxonomy/card-capabilities.yaml
- motion-library/taxonomy/router-policy.yaml
- asset-manifest
- 最近已使用卡片与布局历史
- style-profile.visual_skin

## 输出
填写 resolution：status / card_id / card_version / score / reason / props / media_bindings。

TalkCraft 分段执行使用 `resolution.primary_card` 保存主卡 ID（与 Shotbook schema 对齐），来源为 `talkcraft:<slug>`。辅助 Camera 的 ID 单独保存，不能作为 Primary。真实参数解析和渲染入口见 `motion-library/docs/talkcraft.md`。

完整模板库不代表所有卡已适配；只有 registry 中开放的能力可进入自动解析。其余返回适配请求。Planner 的 content 必须表达真实内容关系，不能为命中某张卡而改语义。

## 决策顺序
1. 先检查 input types，缺硬输入直接淘汰。
2. Family 必须匹配。
3. 优先精确 subtype。
4. 检查 item_count。
5. 检查 required media 是否 ready。
6. 检查人物布局兼容性。
7. 检查 visual skin / density / energy。
8. 对最近重复使用的 family/card/layout 扣分。
9. 选择得分最高且超过阈值的候选。

## 边界
Router只选 Primary Card。
- Annotation由Shotbook supporting layer处理。
- Camera由Shotbook supporting layer处理。
- Transition由镜头边界层处理。
- SFX由SFX Router处理。

## 失败策略
1. 同 family 寻找可降级 subtype。
2. 判断现有卡是否只需参数扩展/版本升级。
3. 返回 generated_motion_request。
4. 若该事件不是必须包装，可明确降级为干净口播。

## 禁止
- 不因 card 名字相似直接命中。
- 不允许跨 family 硬套。
- 不允许忽略 required media。
- 不允许把普通image冒充证据截图。
- 不允许 Router 改写 Planner 的语义关系。
