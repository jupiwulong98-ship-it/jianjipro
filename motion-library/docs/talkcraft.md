# TalkCraft 已接入的能力

- 浏览：108 张配方、TSX 和离线 demo，进入原卡片库后选择“浏览 TalkCraft 108 张模板”。它只用来挑效果，时间线调整在 ChatCut。
- 制作：八张适配卡的开放参数和限制见 `adapters/talkcraft/registry.json`；未适配模板仅供参考。
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
4. 在 `runtime-talkcraft/Root.tsx` 注册新适配组件；先检查代表帧，再检查动态视频与实际 ChatCut 合成。

上游 demo 经常包含占位人物、硬编码文案或假截图；不能直接导入真实项目充当素材。原全局 TalkCraft 安装保持独立。

## ChatCut 装配约定

读取交付 JSON 和当前项目，核对主线快照；创建项目副本；上传每段素材并放入独立包装轨道。使用 `start_frame / fps` 和 `duration_frames / fps`，素材起点为零，保持画布原尺寸和静音。

记录项目、时间线、轨道、素材与 shot_id 映射，重复执行先查已有映射。预览后对账主线和字幕，避免覆盖原项目、重复轨道、露底或透明失效。当前提供装配清单和工具操作协议；真正装配完成须有 ChatCut 项目与对账证据。

来源、快照哈希和许可见 `vendor/talkcraft/UPSTREAM.json`、`LICENSE`、`THIRD_PARTY_NOTICES.md`。这是本地整合测试，商业用途所需授权不由本仓库提供。
