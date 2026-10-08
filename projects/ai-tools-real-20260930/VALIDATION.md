# 画面构思与整片节奏 · 本轮验证

2026-10-02，基于远端main `39f27a475faad48b6ea471b09f6b297a54726f91` 实施。新增画面构思层与两处整片节奏检查，现有Semantic / Edit Plan / Shotbook / Router层级保留。TalkCraft仍为108张浏览模板、8张制作适配卡，没有扩充卡片。

## 输入与结果的性质

真实口播来自 `motion-library/src/review/project.json` 的2026-09-30快照：16镜、53条字幕、35个初剪片段、3410帧 / 113.667秒。字幕在镜头边界可能重复，原字幕和源工程均未改动；用户 `review.json` 保留。源工程仍在项目README所列本机位置。

本轮由AI依据真实字幕构思9个概念，落实为10个Edit Plan事件和完整16镜Shotbook。这是待审提案，不是用户已批准的导演方案；Skill负责推理，脚本负责合同/能力/节奏验证，不声称脚本自动理解自然语言。

## 重点语义验证

| 真实时间与内容 | 新画面结构 | 解析结果 |
| --- | --- | --- |
| 38.267–56.933秒：Remotion固定模板、换内容参数、重复批量制作 | one_to_many，母模板 → 换参数 → 视频01/02/03；模板内含标题/字幕/品牌色/动画 | 两镜共享同一概念，分别建立母模板、承接复制产物；needs_generation，不套编号步骤或普通列表 |
| 72.600–76.267秒：ChatCut剪废话、排字幕、补画面 | input_process_output，同一口播时间线依次删除冗余、出现字幕轨、增加画面轨 | needs_generation，场景B-roll和普通步骤堆叠不能替代关系 |
| 76.267–81.100秒：在时间线上修改 | timeline，真实时间线与局部标注 | 真实界面素材槽missing；已有官网首页不冒充操作录屏 |
| 99.133–108.067秒：三种需求对应工具 | parallel，三组平级需求对应 | 现有全屏三栏适配卡可解析，保留真实标识和阅读停留 |

规划链合同通过：概念的语义来源、时间、结构与人物模式一致。Router结果为9镜needs_generation、6镜clean_presenter、1镜resolved。这说明能力缺口被显式保留，不能宣称新方案已经可执行或生成了9个新动效。

## 节奏发现

Gate B旧v2标注预检发现25.467–38.267秒连续12.8秒人物弱变化，其中优势/代价值得可视化。新方案将其构思成取舍对比。

对旧v2透明包装与真实初剪源帧映射重建62帧，覆盖均匀时间点、每镜早期/稳定位置与片尾。AI已查看整页contact sheet，并据实写入observed Shotbook。Gate D复查定位：

- 25.467–38.267秒，high / long_static_presenter：持续人物构图，文字重音未充分解释取舍。
- 81.100–99.133秒，medium / repeated_layout：三个不同包装依然沿用左侧文字、右侧人物。

新方案预检在81.100–99.133秒给出low提示：18秒干净人物口播可用于微调/安装/选择原则的解释与消化；没有新增可视觉化任务，不强制插入特效。报告仍为needs_revision，需结合动态阅读和上下文决定保留理由。没有机械追求每3秒变化或强包装均匀分布。

历史时间带不包含最终字幕/声音，不是新方案渲染，也不是当前ChatCut成片。尚未进行新方案动态审片和最终成片验收。

## 可复现命令

在 `motion-library/` 执行：

```bash
npm run style:review -- ../projects/ai-tools-real-20260930
npm run style:review -- ../projects/ai-tools-real-20260930/shotbook.legacy-v2.json --out ../projects/ai-tools-real-20260930/validation/legacy-v2
npm run style:frames -- ../projects/ai-tools-real-20260930/shotbook.legacy-v2.json --legacy-project /Users/jupiwulong/视频制作/jianying-headless/work/real-talkcraft-20260930 --out ../projects/ai-tools-real-20260930/validation/frames
npm run style:review -- ../projects/ai-tools-real-20260930/shotbook.observed-v2.json --frames ../projects/ai-tools-real-20260930/validation/frames/frames-manifest.json --out ../projects/ai-tools-real-20260930/validation/rendered-v2
```

普通成片使用style:frames的--video参数。完整命令和迁移方式见 [流程说明](../../docs/style-engine-v2/visual-concepts-and-rhythm.md)。

## 验证记录

- TalkCraft执行回归：8项通过。
- 新规划/节奏/真实项目/FFmpeg同步抽帧：14项通过，覆盖六类节奏问题及反例、跨层改写、模板能力不足、旧报告过期、透明层拒绝。
- 看板交互：5项通过，包含新构思展示和节奏问题跳转。
- 用户审阅存储回归：4项通过。
- TypeScript / Vite生产构建通过；Style Engine YAML解析通过；7个相关Skill格式检查通过；git diff --check通过。
- 实际TalkCraft resolve命令成功解析16镜；实际render预览入口会拒绝未实现的Generated Motion请求，不能静默产出缺镜版本。
- 已在Codex浏览器实查Remotion概念和整片节奏展开；原有用户意见/确认状态未写入或覆盖。

审阅看板由本机 `npm run dev` 启动，打开 `/#review`。可以看新构思、旧v2参考、节奏问题与62帧时间带。旧方案的确认不等于本轮构思已批准。
