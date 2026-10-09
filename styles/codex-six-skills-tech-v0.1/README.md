# Codex Six Skills · 科技口播参考风格 V1

这是 **16:9 真人口播 + 软件截图/录屏 + 科技动效** 的实验风格包。基于 2026-10-08 已归档的《6个Skill》，其原始事件、帧证据、16类包装候选在 `references/samples/codex-six-skills-20261008/`。

当前只启用其中 11 类候选；其他 5 类保留在来源档案。首版属于 **单片候选风格**，不能称同一博主长期稳定风格。背景色、字体与运动规则是创作性近似，不是从原视频准确测出的统一参数。

## 使用：每条新口播只需选择风格，不重新拆对标

1. Codex 完成 ChatCut 初剪、校正字幕并抽取剪后逐词时间，生成新项目 `semantic-map.json`、`visual-concepts.json`。不要复用旧片时间轴。
2. 在仓库根目录执行：

```bash
npm --prefix motion-library run style:reference -- --project ../projects/<project-id>
```

这会产生 `style-recommendations.json`（逐概念最多三条推荐）和初始的 `style-selection.json`（全部为 pending），**不会自动批准和选卡**。

3. Codex 逐条检查口播、实际观众任务、真实参考事件和素材。编辑 `style-selection.json` 的 `decisions`，每个 concept 要么选 `use_reference`，写 `pattern_id`、`medium`、`reason`；要么写 `no_match`，将 `pattern_id`/`medium` 设为 `null` 并写理由。不要靠关键词凑动画。
4. 对选中参考规则的概念，在对应的 `edit-plan.json` 事件及 `shotbook.json` 镜头附加相同的引用。例如：

```json
"style_reference": {"package_id":"codex-six-skills-tech-v0.1","pattern_id":"P05","medium":"mixed"}
```

5. P05（结论+真实演示）需要真实的可定位软件截图/录屏。必须在对应 `visual-concepts.json` 设置 `real_asset_need: "required"`，Shotbook `asset_slots` 添加 `required:true` 和 `asset_id` / `path`，经过 Asset Gate 后状态为 ready；无法获得时暂停向用户索取。不得用抽象示意冒充真实软件运行。
6. 规划阶段严格核对：

```bash
npm --prefix motion-library run style:reference -- --project ../projects/<project-id> --validate
npm --prefix motion-library run style:review -- ../projects/<project-id>
```

`style:review` 检查风格绑定，并输出 `validation/style-binding-audit.json`。没有绑定或未处理 pending 会阻断。没有启用风格的旧项目不受影响。

7. 在新片最合适的 8–12 秒制作一个 **带真人、真实录屏、字幕、完整运动和退场** 的动态样段，人工确认视觉质感、音乐音效以及原音轨同步后，再扩展整片。Preview Board 的通用示意/静态抽帧不能替代动态样段。

8. 概念或风格源有改动时选择文件失效；如要重建，先备份审阅意见，再明确运行：

```bash
npm --prefix motion-library run style:reference -- --project ../projects/<project-id> --reset-selection
```

## 第一轮重点测试

- **P05，12.8–16.2s 参考动作**：短结论牌 + 右侧真实软件媒体 + 媒体内部动画 + 整体容器退出。媒体本身使用你自己提供的实际录屏/截图。Codex 先查 TalkCraft 能否实现，做不到再写项目级 Generated Motion，并将可复用版本加入库。
- **P09，47.6–50.0s 参考动作**：真人画面上一次强结果大字，快速进入、缩回可读、保持、右侧离场，不是逐句巨字。
- **P02**：连续工具章节统一编号风格、变化内容和实际演示媒介。不能让整片变成相同卡片。

## 能力边界

- Reference Analyzer 的 16 种候选并不意味着 16 个对应模板已经实现。TalkCraft 的 108 卡通过合成数据渲染测试，也不代表已自动复刻原视频。
- `style:reference` 是确定性的 **候选推荐、来源引用和防漏审校验**，不是视觉理解大模型。它不自动生成媒体、不会自动改动 ChatCut。
- 对标作品只学习可迁移的视觉语言；不复制原作者创作的截图/镜头用于你的公开成片。真实操作画面请录自己的。
- 一次动态样段用户满意后，才能说“这个风格有可用的初版效果”；最终水平仍需要看实际视频。

## 给 Codex 的启动指令

> 从仓库 AGENTS.md 和本风格包 README 开始。新建项目继续沿用 ChatCut 初剪、剪后逐词、语义与 Visual Conceiver 流程。选用 `styles/codex-six-skills-tech-v0.1/style-package.json`，调用 `style:reference`，逐意群确认真实媒介与参考 P 编号，绝不自动批准候选。缺真实软件录屏时先向我索取。严格通过 `--validate` 和 `style:review`；先给我一段 8–12 秒可播放动态样片，不能直接全片渲染。
