# Codex 六工具科技口播：V0.3 参考动效执行桥

此包从 V0.2 派生，增加 P04 正式候选和一条可执行参考动效路由。**不覆盖** V0.1 / V0.2 和任何已认可的 8 秒样段；仅新项目默认选 V0.3。

## 本次真正完成的修复

- V0.2 CLI 在第二次构建 Production Brief 时遗漏 `assetIntent` 的错误已修复。
- 新 Production Brief 的每条参考镜头含 `reference_motion_binding`。已实现的返回 `component_available_not_rendered` 和文件/参数/来源事件；未实现的返回 `needs_reference_implementation`，不能把它当成已实现或静默换成普通蓝底卡片。
- P02：`ReferenceChapter`，大编号章节、软件素材窗口、不同层级的进出场。
- P04：`ReferenceCardFan`，2～4 张用途卡从中心堆叠展开、稳定、退场。
- P13：`ReferenceWindowExit`，软件窗口作为一个外部容器倾斜收窄退出。
- P05/P09 保留此前公共组件，使用同一个新的参考动效渲染入口。

## 新口播如何使用（Codex 操作）

1. 初剪 → 剪后逐字时间 → Semantic Map → Visual Concepts，按旧流程完成。
2. 首次规划运行 `npm --prefix motion-library run style:reference -- --project ../projects/<新项目>`。新项目默认 V0.3；旧 `style-selection.json` 继续使用原来的 V0.1/V0.2 包，不静默迁移。
3. 逐镜决定 P 规则、真实媒体、背景和理由，并将来源传给 Edit Plan / Shotbook。
4. 执行 `npm --prefix motion-library run style:reference -- --project ../projects/<新项目> --validate` 和 `npm --prefix motion-library run style:review -- ../projects/<新项目>`。
5. 阅读 `style-production-brief.json` 的 `reference_motion_binding`。只有确实存在公共组件时才生成动效渲染请求；如果是 `needs_reference_implementation`，应继续参考资产制作，不能假称已调用。
6. 首次运行 `npm ci --prefix motion-library/runtime-talkcraft`，然后执行 `node motion-library/runtime-talkcraft/render-reference.mjs projects/<新项目>/request.json --out projects/<新项目>/renders/P02.mp4`。
7. 需要叠加真人的透明镜头（如 P09、透明 P13）使用 `--alpha --out projects/<新项目>/renders/P13.mov`，生成 ProRes 4444 Alpha MOV；不能用 H.264 MP4 冒充透明层。
8. 渲染器输出可播放视频、入场/稳定/退场三张实帧和 `*-evidence.json`，记录参考来源、媒体 SHA-256 和测试/实际项目状态。再由 Codex 把视频装入 ChatCut 工程副本并进行真实动态验收。

## P02 一个真实项目请求的 JSON 示例

```json
{
  "style_package": "styles/codex-six-skills-tech-v0.3/style-package.json",
  "reference_package": "codex-six-skills-tech-v0.3",
  "pattern_id": "P02",
  "reference_event": "codex-six-skills-20261008-e006",
  "media_provenance": "creator_owned",
  "output_purpose": "project",
  "props": {
    "chapter": "01",
    "title": "HyperFrames",
    "subtitle": "软件真实操作演示",
    "mediaSrc": "my-real-recording.mp4",
    "mediaType": "video",
    "durationFrames": 120
  }
}
```

实际媒体必须存在于请求 JSON 同目录或以相对路径引用。P04 在 `props.items` 填入 2～4 条真实文案；P13 的 `mediaSrc` 与 P02 相同要求。所有动画按新片逐词时间调整，不复制参考视频的时长。

## 测试边界

`motion-library/tests/fixtures/reference-p02.json`、`reference-p04.json`、`reference-p13.json` 是带明确 QA 声明的测试请求。示意软件截图印有 `SYNTHETIC QA / NOT REAL SOFTWARE`，不得导入公开成片冒充实际软件。GitHub Actions 成功后，`reference-motion-qa-preview` 工件包含动态 MP4、关键帧和证据文件。

真正的原片运动参数无法仅凭抽帧精确反推；这些组件是遵循参考分层与信息表达逻辑的自主实现，必须让用户观看真实合成后再判断是否达标。

当前可绑定的五类参考组件是 P02/P04/P05/P09/P13；其他 P 规则仍可能显示 `needs_reference_implementation`。这意味着本轮交付是专用动效的可运行起点，而不是一键复刻全部 16 类。
