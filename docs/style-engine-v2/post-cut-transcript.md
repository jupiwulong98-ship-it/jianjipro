# 剪后全文抽取

位置：ChatCut口播初剪与字幕校正完成后，Semantic Mapper / 画面构思之前。

正式输入必须是最终剪辑按播放顺序留下的全文及字词时间。录制前文案只用于文字核对，原素材转录只用于溯源；二者均不能替代剪后文字与时间。字幕文件SRT通常只保存每条字幕的起止，字词时间单独保存JSON。

## 获取

1. 使用ChatCut transcription技能，调用 `get_active_project` 和 `read_project` 确认项目、活动时间线。
2. `read_captions({json:'{"words":true,"limit":50,"offset":0}'})` 获取原文字幕及字词。按返回的nextOffset读取到hasMore=false，不能只拿第一页或只搜索若干关键词。
3. 选择当前口播对应的original轨道，排除翻译/独立字幕。多个原文轨道时明确选择；有多个真人口播轨道需要分别抽取并专门核对，不能悄悄混合。这里的“字幕卡”是原生字幕条，不是动效模板。
4. 保存 `transcript/capture.json`：projectId、projectName、timelineId、durationFrames、trackId、capturedAt，以及全部原生pages（page、cards、captions.tracks、timelineId）。所有时间沿用read_captions的微秒单位。读取期间若项目、时间线、总条数或轨道变化，重新读取；不要拼接不同状态的页面。
5. 在motion-library运行 `npm run transcript:build -- ../projects/<project>/transcript/capture.json ../projects/<project>/transcript`。

此命令处理工具已读回的数据，不自动连接或操作ChatCut；获取必须通过ChatCut工具。校验分页/重复/来源、每条原文及字词时间、乱码与全文/字词一致性。失败先处理对应输入问题，不补造时间、不改写原文。

原生字幕可能有无文字且无字词的空占位：在capture.json保留，输出JSON的ignored_empty_cards记录id与原时间，全文和SRT不生成空内容。空文字但有字词、非空文字却缺字词都仍需阻断。native_card_count统计原生条数，segment_count统计有效文字条数。

## 交付

- `final-transcript.txt`：完整逐字稿，按字幕播放顺序逐条保留，供直接阅读。
- `final-transcript.json`：全文、字幕条、每个字词的id/text/start/end、项目/时间线/轨道、来源revision；时间单位为秒。
- `final-transcript.srt`：相同全文的字幕条时间，毫秒精度；不作为字词时间的替代。

revision基于项目/时间线/轨道、总帧数及完整字幕文字和字词时间计算，不包含字号等外观设置。新项目的Semantic Map引用该JSON与revision。剪切、重排、字幕文字修改后重新抽取，来源版本改变时复核旧时间和计划。旧项目保留原记录，不自动修改或冒充已经迁移。

程序通过只确认读回数据完整及内部一致，不证明ASR准确、已经校正或听音通过。自动时间戳有误差，关键动作时点仍需播放核对。此步骤不改口播、不选模板、不渲染，也不导出成片。

交付后在本仓库工作台 `/#planning` 查看完整原文与字词时间；下一步画面构思同时写入 `visual-planning.json`，让用户在工作台按段查看与留意见。合同与版本确认规则见 [画面策划工作台](planning-workbench.md)。
