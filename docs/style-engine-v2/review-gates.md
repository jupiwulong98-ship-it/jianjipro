# Review Gates

## Gate A — Plan
先核对剪后全文交接：原文轨道明确、分页完整、全文与字词匹配、时间为剪后时间线、输入版本有效。口播或字幕修改后重新抽取。见 [剪后全文抽取](post-cut-transcript.md)。

确认 Semantic Map / Visual Concepts / Edit Plan。先审口播含义和理想画面关系，再安排实现请求；检查概念引用、结构和时间一致性，Planner不选Card。不渲染。

## Gate B — Shotbook + Assets
确认逐镜：
- primary visual job
- presentation mode
- inputs
- asset slots
- safe zones
- primary motion family/subtype
- camera / annotation / transition layers

Required 素材未就绪时不得进入最终执行。

增加整片节奏预检：完整Shotbook（含干净口播）生成visual_timeline和rhythm_review，检查长人物弱变化、连续布局/结构重复、机械循环、密度失衡和缺少呼吸。基于认知状态变化，不按固定频率加特效。问题需修订或记录具体上下文保留理由；timeline_digest保证计划改动后复查。详见 [命令与字段](visual-concepts-and-rhythm.md)。

## Gate C — Stable Frame Review
不先整片重渲。每个代表性镜头在主要入场完成后抽稳定帧，默认取该视觉beat的约72%。

优先覆盖不同结构的代表镜头，生成 contact sheet。

每帧必须人工/视觉模型检查：
- face safety
- subtitle clearance
- clipping/overlap
- density
- contrast/readability
- semantic fit
- evidence integrity

任一 blocking issue 不进入最终整片。

## Gate D — Render + QC
渲染成片后，按合理间隔、镜头早期/稳定位置及片尾抽样，生成按时间排序的contact sheet / HTML时间带。AI或人工从整页观察后补充observed Shotbook，生成Gate D rhythm_review。抽帧成功和无启发式问题都不自动表示动态节奏通过。

同时播放整片检查：
- 时间点是否卡语义
- 连续效果是否重复
- 镜头/版式节奏是否单调
- 素材是否正确绑定
- 音效是否干扰口播
- 是否偏离 Style Profile

失败则回到 Shotbook / Router / Generated Motion 的对应层修改，而不是无脑重做整片。
