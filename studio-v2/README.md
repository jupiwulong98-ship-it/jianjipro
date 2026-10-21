# JIANJIPRO Studio V2 · 新主流程（2026-10-22）

本目录是**重新构建的默认生产入口**，不依赖旧 motion-library、TalkCraft108卡、Motion Router 或旧 Shotbook。老项目保留作历史证据，不删除，但新项目不再读取模板路由。

## 基于 my-super-experiments 的实际链路

认真参照其04初剪记录、02逐句真实素材表、03对标拆解、11全片工程、13–21声音与转场修正、24真实画面审阅和06用户纠正，确定新的默认路径：

**口播/对标 → ChatCut初剪与准确逐字时间 → 全片内容与声画导演规划 → Codex真实搜集并核验截图/Logo/必要录屏 → 素材板和实际构图预演（你可以检查并退回） → 完整影片自动精剪/动效/混音 → 整片动态与听觉质检 → 你只在最终成片阶段再看一次 → 认可案例才沉淀。**

**10秒不是新流程的用户审批单位**。之前逐10秒是探索参考风格的办法，用户已经明确纠正：剪辑前素材和视觉方案可以审批，开始正式包装后不得每10秒问一次。

有些视频只需真实截图，不能机械强求录屏；只有讲到实际操作才录真实操作。没有证据的事实不得伪造模型界面。

## 新项目输入

项目目录 projects/项目ID，需要一个剪后带原声口播视频、真实素材与 studio/plan.json：

~~~json
{
  "version":1,
  "source":{"video":"talking.mp4","transcript":"transcript/final.json"},
  "assets":[
    {"id":"ui","kind":"screenshot","file":"assets/real-ui.png","origin":"实际软件页面及采集来源","checked_at":"2026-10-22","verified":true}
  ],
  "scenes":[
    {"id":"a1","start":0,"end":3,"type":"presenter","layout":"full","assets":[],"intent":"开场说明","visual":"真人直接讲，保留气口","sound":"人声清晰，音乐轻铺"},
    {"id":"a2","start":3,"end":6,"type":"evidence","layout":"split","assets":["ui"],"intent":"给出真实证据","visual":"人物左、真实截图右；先完整界面再聚焦","sound":"轻提示后安静读图"}
  ],
  "music":{"file":"audio/cleared-bed.wav","gain":0.045,"license_confirmed":true},
  "sfx":[{"file":"audio/cleared-click.wav","at":3,"gain":0.1,"license_confirmed":true}]
}
~~~

输入经过 ChatCut 实际剪辑后，以 **剪后播放时间** 为唯一时间基准。整个主轨道必须连续。画面角色：presenter干净真人；evidence真实截图；screenrecord真实录屏；comparison两份真实媒体。全屏/分栏由内容和素材决定，不从旧卡片目录选择。分栏构图由同一份 FFmpeg 几何代码用于静帧预演与实际视频，避免图片盖住人物的基本错误。

## 使用

在仓库根目录：

~~~bash
node studio-v2/cli.mjs preflight --project <ID>                      # 真实素材生成全片构图预览
node studio-v2/cli.mjs serve --project <ID> --auto-produce             # 127.0.0.1:3038 开网页，等待你确认后自动批量制作
node studio-v2/cli.mjs status --project <ID>                         # 确认与素材版本状态
node studio-v2/cli.mjs produce --project <ID>                        # 两项确认后可手动启动同一批处理
node --test studio-v2/test.mjs                                        # 实媒体集成测试（需要 ffmpeg / ffprobe）
~~~

你在网页上看 **AI 已采集的实际素材、来源、每段真实构图及声音规划**；分开批准整片素材和整片视觉方向。修改任一截图、录屏、音效或计划会使批准版本失效。批量渲染全片时不再逐段询问。浏览器生成的静帧 **不是动态成片**，需最终完整看听。

输出：
- studio/previews/：真实图/人物合成的预演关键帧
- studio/review.json：版本锁定的人工意见
- studio/output/segments/：自动的内部镜头产物
- studio/output/final.mp4：整条带人声音轨的成片
- studio/output/report.json：运行报告，审美状态明确待确认

## 实现范围，不允许夸大

**本次已经写入的程序**：媒体/来源核验、统一镜头与时基、两个独立的人工确认、源文件变更导致旧确认失效、基于同一构图的实际预演与整片FFmpeg渲染、基础的背景音乐与指定时间SFX混音、存在性/时间轴/音轨技术验收和全片报告。

**仍待接入 Codex 实际能力**：从文案自动搜索、登录网页、操作浏览器、录屏、事实核验；ChatCut自动初剪与逐字稿；从参考与实际媒体创作 HyperFrames 专业动画；声画节奏自动评分、真实视觉审片/连续音频审听和自动修改。代码当前不具备大模型推理能力，也不能用全片文件技术检查冒充高级视频已经做好。

声画导演的 visual / sound 字段必须由接入的 Codex 真正理解并执行，不能只写漂亮文字假装已经落地。没有材质来源和实际产品证据就必须挡住。

新库只固定已经经过用户审美认可的字体、层次、动效缓动和可复用能力；不把 H 版时长、颜色或对标品牌皮肤固定为永远的模板。成功案例保存视频、实际媒体、源码、参数、适用语义、正反例和用户认可状态。

## 迁移原则

旧 motion-library、108卡、此前新增 unattended-edit.mjs 全部为 legacy。现阶段暂存旧代码免得破坏历史项目；默认执行仅使用 studio-v2。需要参考已存在某个漂亮动效时，可以看历史实现，但必须由新内容和素材重新设计，不调用旧模板路由。

要证明新的完整AI剪辑真的可用，必须在第二条全新真实口播里检验自动搜集素材、素材/画面确认、HyperFrames编排、BGM/SFX、整片QC和实际感受。新增技术脚手架或通过单元测试不算完成这一验收。
