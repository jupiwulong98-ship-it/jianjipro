# Codex Six Skills · 视觉风格 V0.2（纠正全片统一蓝底）

本包仍基于同一条《6个Skill》参考片。**它不是新的参考视频、不是保证自动复刻原作者风格的许可证，更不是把全片统一改成白底。**

## 为什么要修

2026-10-09 真实项目全片诊断：九段全屏包装累计约45.4秒，其中44.633–49.367s的图片/视频/音频真实成果被三个SVG符号替代；59.200–65.200s的P08浅暖参考变成蓝色科技舞台；72.433–78.933s实际工作台/文件预览变成文字轨迹。视觉重复主要来自项目级Stage与CSS强制同色，而不只是深蓝帧百分比。参考片按同阈值反而有更多深蓝帧，但媒体内部材料和画面变化更丰富。

## 相比 V0.1 的实际改动

- **不修改 V0.1 包和旧8.67秒样段**；V0.2新包独立存放，在新项目中明确启用。
- 每个 P 规则具有 `art_direction`: 允许背景、首选背景、媒体类型、真实媒体约束、源事件条件。
- 背景模式：`presenter_natural`（原场景）、`transparent_overlay`（透明叠加）、`media_first`（真实媒体主导）、`light_explainer`（浅暖插画）、`dark_tech`（适合时才使用的科技舞台）。
- P08首选 `light_explainer`，P05首选 `media_first`，P09为 `transparent_overlay`，P07必须至少具有与口播对应的真实示例媒体。符合对标不等于每镜都套深蓝。
- `TechMediaTakeaway` 新增可选 `backgroundMode`。**未传参仍保持V0.1的原深蓝默认**，避免旧项目和已认可片段视觉变化；新V0.2项目必须按镜头选择显式传入。
- 候选与选择文件增加每镜背景与媒体真实性；Gate B 确认规则选择从Edit Plan传到Shotbook，并比较最初的素材要求是否被降低。深蓝镜头比例过高会形成规划级警告，非自动审美结论。

## V0.2新项目 SOP

1. 拍完口播，ChatCut初剪、逐词校正、Semantic Map、Visual Concepts。首次Visual Concepts完成后，**修改素材条件之前**运行如下命令以冻结需求。

```bash
npm --prefix motion-library run style:reference -- --project ../projects/<新项目>
```

2. 输出`style-recommendations.json`、`style-selection.json`、`style-asset-intent.json`。**最后一个文件是首次素材意图，不要用已经被修改的终稿来覆盖它。**
3. 每个visual concept填写`style-selection.json`的`decision`、`pattern_id`、`medium`（现有风格匹配）、`reason`，还必须填`background_mode`、`visual_media_kind`、`media_evidence`。`no_match`也必须填写后三项以防没有参考规则时统一套蓝底。偏离所选规则的推荐背景，写`deviation_reason`。
4. `visual_media_kind`可选 `presenter`、`typography`、`diagram`、`real_screen`、`real_output`、`mixed_media`；对应`media_evidence`只可`real_verified`、`illustration_declared`、`not_applicable`。真实软件录屏和真实输出须核对源文件/版权/语义匹配；`illustration_declared`不得冒充工具真实成果。
5. 在每条Edit Plan事件与Shotbook视觉镜头添加与决策相同的`art_direction`三元组。若选参考P规则，保留原有的`style_reference`。P05/P07等必须配对应已就绪的必需真实素材槽，不许把`real_asset_need:required`降成`none`。

```json
"art_direction": {
  "background_mode": "light_explainer",
  "visual_media_kind": "diagram",
  "media_evidence": "illustration_declared"
}
```

6. 校验：

```bash
npm --prefix motion-library run style:reference -- --project ../projects/<新项目> --validate
npm --prefix motion-library run style:review -- ../projects/<新项目>
```

7. 读取`style-production-brief.json`（或`validation/style-production-brief.json`）中的`art_direction`与背景分布。制作动态样段，不以自动检查通过宣布审美合格。项目实际渲染代码应按`art_direction.background_mode`选择舞台，不能把参数固定为深蓝。

## V0.1旧项目迁移：必须显式操作

不要直接对用户已经满意的8.67秒样段、原始`Root.tsx`、旧`style-selection.json`和既有视频覆盖或强制更新。

1. 在新分支或新的项目复制中制作V0.2候选。先从**首次**`prepare.py`、原规划、编辑历史还原`style-asset-intent.json`；如果无法验证首次素材要求，停止并请用户确认，不能用最后改过的visual-concepts伪造初始值。
2. 备份旧Style Selection。旧目录存在V0.1选择文件时，迁移命令必须显式覆盖目标并重置选择：

```bash
npm --prefix motion-library run style:reference -- --project ../projects/<项目副本> --style styles/codex-six-skills-tech-v0.2/style-package.json --reset-selection
```

3. 逐镜决定背景与媒介，不允许直接把旧蓝色方案标为全部通过。重新通过Gate B和素材校验，再渲染三个代表修复镜头：**P07 44.633–49.367s**，**P08 59.200–65.200s**，**P10 72.433–78.933s**。如素材确实缺失，先索取真实截图/录屏，或者明确调整导演目标，不能谎称演示成功。
4. 其余深蓝镜头保留有证据的必要画面，不机械换色；同场景内SVG素材的颜色、外层背景和人物小窗组合需要单独审阅。完整全片应重新输出Contact Sheet并连续听看。保持原8秒样段和ChatCut旧成片不变。

## 能力边界

- V0.2校验的是**规划意图是否被显式传递**，并不是像素检测；项目级React/CSS若仍把所有素材硬改为蓝底，必须由真实渲染的审片才能发现。
- `style-asset-intent.json`阻止了常见的静默素材要求降级，但只是一份首次快照；人为造假、修改历史或提交假真实文件仍需外部核查。
- 规则单镜条件来自单条参考视频的抽样与事件记录，不代表跨作者通用硬法规。保留好的V0.1镜头是优先约束。
