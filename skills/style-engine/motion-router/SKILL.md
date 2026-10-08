---
name: motion-router
description: 根据口播镜头的语义、真实输入和布局约束解析已适配的 TalkCraft 卡，缺能力时返回适配或生成请求。
---

# Motion Router Skill

## 任务
保留已批准的画面概念，把 Shotbook / Edit Plan 的 motion_request 解析为真实可执行 Primary Card。

## 输入
- TalkCraft 候选：`motion-library/adapters/talkcraft/registry.json`；完整浏览库：`motion-library/src/talkcraft/catalog.json`。
- visual-concepts + shotbook shot / edit-plan motion_request
- motion-library/taxonomy/input-types.yaml
- motion-library/taxonomy/families.yaml
- motion-library/taxonomy/router-policy.yaml
- asset-manifest
- 最近已使用卡片与布局历史
- style-profile.visual_skin

## 输出
填写 resolution：status / card_id / card_version / score / reason / props / media_bindings。

TalkCraft 分段执行使用 `resolution.primary_card` 保存主卡 ID（与 Shotbook schema 对齐），来源为 `talkcraft:<slug>`。辅助 Camera 的 ID 单独保存，不能作为 Primary。真实参数解析和渲染入口见 `motion-library/docs/talkcraft.md`。

108张均已接入参数适配，但只有 registry 中开放且符合当前镜头的能力可进入解析；逐卡待验收状态不等于当前项目审片通过。Planner 的 content 必须表达真实内容关系，不能为命中某张卡而改语义。

旧 ChatCut 原生 Card 已移除，不再查找其 manifest 或绑定。可执行能力与硬输入以 adapters/talkcraft/registry.json 为准。

## 决策顺序
0. 校验概念引用、visual_structure与候选visual_structures；不支持原关系直接淘汰。
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
1. 仅在保留画面概念与visual_structure时，同 family 寻找可降级 subtype。
2. 判断现有卡是否只需参数扩展/版本升级。
3. 返回 needs_generation + generated_motion_request，携带完整visual_concept、safe_zones和asset_slots；未实现时禁止静默跳过渲染。
4. 若该事件不是必须包装，可明确降级为干净口播。

## 禁止
- 不因 card 名字相似直接命中。
- 不允许跨 family 硬套。
- 不允许忽略 required media。
- 不允许把普通image冒充证据截图。
- 不允许 Router 改写 Planner 的语义关系或画面概念。

新计划使用 visual_contract_version: "0.1"，校验由 scripts/style-contract.mjs 和 runtime-talkcraft/core.mjs执行。旧计划明确标 legacy_unverified，不能算通过新流程。


## 全量参数绑定

100 张完整源卡使用 `texts` / `data` / `media` 及原生 props；参数例文、源码行、固定数组长度与硬素材见 `adapters/talkcraft/full/contracts.json`。先根据画面概念选择实现，再把执行参数写进 `resolution.adapter_props`；Planner 的 motion_request.content 不得填具体卡 ID 或为了命中模板而改写结构。Resolver只验证这个已绑定合同，不自动把三个框当任何关系。

数字目标与曲线点必须来自本次内容并显式绑定；网页/图片槽绑定真实本地素材。七张界面/聊天/终端模拟卡必须 `illustration: true`，保留流程示意标记。新增完整源卡默认全屏，不能把不支持的人物旁或通用主题能力猜成已经具备；长文案、数量变化、透明皮及新素材焦点要重新验收。
