# TalkCraft 已接入的能力

- 浏览：108 张配方、TSX 和离线 demo，打开网页默认即为 TalkCraft 模板库。它只用来挑效果，时间线调整在 ChatCut。
- 制作：108 张均有参数适配。8 张沿用原接口，100 张保留完整源动画并开放具名文案、数据和真实素材槽。参数与校验状态见 `adapters/talkcraft/registry.json`。接入不等于当前项目审片通过。
- 渲染：Remotion 4.0.519 独立依赖，静音 ProRes 4444 透明 MOV；按镜头缓存。
- 交付：生成包含帧位置的 `chatcut-delivery.json`，由 Codex 使用 ChatCut 工具在副本装配。这一步没有内置无人值守的 ChatCut 客户端。

## 使用

首次安装：在 `motion-library/runtime-talkcraft/` 运行 `npm ci`。

在 `motion-library/` 运行：

```bash
npm run talkcraft:list -- 步骤
npm run talkcraft:resolve -- ../projects/talkcraft-integration-smoke/plan.json
npm run talkcraft:render -- ../projects/talkcraft-integration-smoke/plan.json --stills
npm run talkcraft:render -- ../projects/talkcraft-integration-smoke/render-test.json
```

计划示例在 `projects/talkcraft-integration-smoke/`。制作顺序：ChatCut 确认初剪与字幕 → jianjipro 风格/语义规划 → 真实素材 → 解析计划 → 代表帧与视频预览 → 用户审片 → ChatCut 装配。

`primary_motion_request.content` 放内容参数，Planner 不填写卡 ID。脚本根据 family/subtype 和真实参数选择卡；无卡会报升级/生成需求，不自动硬套。清爽口播镜头使用 `clean_presenter: true`。

`theme` 支持 accent、ink、panelInk、panel、fontFamily；`motion_speed` 和 `start_delay_frames` 控制实际动画速度与启动时间。截图/图标只接受 `asset:filename`，文件在计划的 `public_dir` 下。人物旁包装必须指定 box，并结合实际人物画面审查安全区。

## 如何修改和增加模板

1. 日常改文字、素材和颜色：修改项目计划，再运行渲染；只重做内容哈希变化的镜头。
2. 改动画：修改 `adapters/talkcraft/cards/<slug>.tsx`，保留 vendor 原件。共享代码变化会使相关缓存失效。
3. 加模板：从 vendor 中选择源码，在 adapter 中暴露真实文案/素材参数，补 registry 的用途、输入与限制；验证后运行 `npm run talkcraft:index`。
4. 全量生成器自动维护 `full/index.ts` 注册表；先检查代表帧，再检查动态视频与实际 ChatCut 合成。

上游 demo 经常包含占位人物、硬编码文案或假截图；不能直接导入真实项目充当素材。原全局 TalkCraft 安装保持独立。

## ChatCut 装配约定

读取交付 JSON 和当前项目，核对主线快照；创建项目副本；上传每段素材并放入独立包装轨道。使用 `start_frame / fps` 和 `duration_frames / fps`，素材起点为零，保持画布原尺寸和静音。

记录项目、时间线、轨道、素材与 shot_id 映射，重复执行先查已有映射。预览后对账主线和字幕，避免覆盖原项目、重复轨道、露底或透明失效。当前提供装配清单和工具操作协议；真正装配完成须有 ChatCut 项目与对账证据。

来源、快照哈希和许可见 `vendor/talkcraft/UPSTREAM.json`、`LICENSE`、`THIRD_PARTY_NOTICES.md`。这是本地整合测试，商业用途所需授权不由本仓库提供。

## 画面概念合同与节奏Gate

新计划设置visual_contract_version: "0.1"，内联visual_concepts并让每个包装镜头引用visual_concept_ids和visual_structure。registry的visual_structures是实际结构能力，不能把process-map自动当作1→N。缺实现返回needs_generation，render会中止等待生成候选验收。运行style:review可从项目文件生成可解析的完整计划。整片render先过Gate B节奏检查，--stills用于修订预览。旧输入保留运行并标legacy_unverified。详见 [新流程](../../docs/style-engine-v2/visual-concepts-and-rhythm.md)。

## 108 张完整接口

新增 100 张的源码在 `adapters/talkcraft/full/cards/`，不可直接编辑生成件；修订 `scripts/adapt-talkcraft-all.mjs` 后运行 `npm run talkcraft:adapt` 和 `npm run talkcraft:index`。Vendor 原件保持不变。生成器把原模块隔离在参数工厂内，因此派生坐标和内部辅助函数会读取同一组新参数，不会只替换表层标题。

`texts` 是具名槽对象，逐卡的例文与源码行在 `full/contracts.json`；`data` 是类型受限的原配置/数据覆写；`media` 是动画容器内的真实素材。`src`、`srcs`、`docSrc`、`hostSrc` 等保留原卡接口。素材引用使用 `asset:`，数组数量由具体版式限制。图表计数值必须明确绑定，截图槽不能隐式降级成假页面。七张工具/聊天/终端模拟卡必须设置 `illustration: true`，成片会显示流程示意标识。

Planner 仍只写语义内容与关系；选卡之后，Router 在 `resolution.adapter_props` 中绑定该卡的实际接口。这个字段属于执行解析，不得进入画面构思。Resolver 对绑定做严格验证并保持语义结构。新增完整源卡默认全屏，人物旁、透明蒙皮、长文案或改变条目数必须单独验收。旧八张支持原主题，新增完整源卡保留原皮；`skin` 当前只开放 `fontFamily`，颜色可用原生 `accent` 或对应配置字段，不能声称通用蒙皮已完成。

```bash
npm run talkcraft:verify-all -- --contracts # 全部接口与素材绑定预检
npm run talkcraft:verify-all               # 108 张阶段帧、替换帧与 HD ProRes
python3 scripts/build-talkcraft-report.py  # 可播放验收页与分组联系表
```

验证材料在根目录 `.cache/talkcraft-all/`。合成测试素材明确标明 TEST，只证明该组参数的接口与渲染，不证明任何示例数据或实际项目效果。交付还必须记录 ChatCut 导入及实际时间线预览；尚未通过的卡保持 `adapted_pending_verification`。

2026-10-02：108 张渲染、可见参数替换与 ChatCut 代表帧验证均已完成，记录在 `full/verification.json`。索引会校验适配源码与 shared support 的 SHA256，匹配才显示验证标签。库接入通过不替代逐项目审片。`magnifier-detail` 与 `news-card-desk` 的素材采用正常文档流以保留容器高度，避免素材替换后零高度空画面。
