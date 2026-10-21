# 2026-10-22 无值守剪辑实测与失败证据

## 实测环境
GitHub Actions run 39661706699，PR #6（已合并 main）；Node 22 + FFmpeg，测试脚本 motion-library/tests/real-media-smoke.mjs。产物：6秒640×360 H.264 MP4，含音轨、抽帧、全片故事板、run-report 和 qc-report。媒体来源为仓库既有真人帧和 ChatGPT 真实界面截图，声音是测试正弦音；**不是本人的新口播，也没有触发 Codex 自动浏览器录制或 HyperFrames 创作**。因此只算实媒体管线冒烟测试，不算整条高质视频自动剪辑通过。

## 结果
1. 已有实际项目 ai-editing-workflow-20261008 运行 edit:check：**失败**，production/scene-assets.json 不存在。说明现有项目不能直接复用这套 CLI；缺少项目级素材需求→抓取→证据绑定→执行脚本自动生成器。
2. 合成测试：rough_cut / motion / audio / assemble / qc 五阶段真实执行成功，最终 MP4、音轨、前后对照图均生成。test run 输出的技术QC全部pass。
3. **人工打开实际 frame-after.png 后，发现截图直接覆盖人物面部**，是显著视觉不合格。技术脚本却给出 readability=pass、full_video_review=pass；脚本只检查了分辨率、时长、音轨存在和帧变化，未检查人物遮挡、真实信息可读性或视觉审美。这里的标签是QA技术检查结论，**不能当作真实视觉审片完成**。

## 必须修正（按优先级）

P0. 项目实际素材自动采集及产物编排：基于文案意群自动搜集/录制真实媒体并建立manifest，实跑下一条新口播。缺素材不得伪造“已验证”。
P0. **真实画面层安全与审查**：分清全屏证据切镜、真人与截图分栏、人物后文字等构图。截图不能像测试一样遮脸。构图规则里明确检测或守护人脸区域、字幕区域；产出实际渲染关键帧，再进入整片。
P0. QC必须区分静态/媒体技术pass与视觉/动态/声音通过。不能从“有音轨”“尺寸合格”“前后不同”推出画面可读、人声清晰、声音匹配或已审整片。没有视觉和完整视听检查时只报告未验证。
P1. 在真实第二条影片上完成 Codex 浏览器素材获取、ChatCut、HyperFrames/Remotion、自编排BGM/SFX和完整反馈迭代，产出可编辑工程与最终成片后才叫“全链路成功”。

## 证据
- 自动运行：https://github.com/jupiwulong98-ship-it/jianjipro/actions/runs/39661706699
- 7件可复现产物：https://github.com/jupiwulong98-ship-it/jianjipro/actions/runs/39661706699/artifacts/12372903944
- 检验脚本：motion-library/tests/real-media-smoke.mjs
- 本结论由真实视频抽帧的人工视觉检查补充，和CI通过并不矛盾。
