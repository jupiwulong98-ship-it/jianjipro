# 无值守整片制作：真实素材优先、先声画后动效

**模式**：当用户说“自动做整条片”“不要每10秒确认”时，默认使用本流程。十秒仅用于内部缓存/切片，不是人类审批单元。旧的逐段确认工作台保留给主动要求精修的用户。

## 边界与目标

仓库已有 Semantic Map、Visual Conceiver、Shotbook、108张TalkCraft和Remotion的执行能力，不应另建一套同名抽象层。新增的 unattended-edit.mjs 是**可执行的媒体证据门禁、全片素材画面板和无人工中断的批处理编排器**，不是独立AI模型，也**不会自行上网、登录账号或自动编写视频特效**。这些动作由 Codex 的浏览器/录屏工具、ChatCut、HyperFrames和现有渲染工具执行，Codex要写出该项目实际可运行的步骤脚本；没有实际命令，不能声称一键全自动已完成。

## 默认新片执行 SOP（Codex 主导，用户只看最终成片）

1. 获取本人原视频、可选口播稿与对标；完成 ChatCut 初剪、剪后逐字时间。整条片子一次理解并划分真实意群，不按每个字幕或每10秒生成一张卡。
2. 使用 Visual Conceiver 设计全片的「理解目标／观看焦点／重要证据／真人呼吸／转场类别／声音强弱」。允许 clean 人物段、真实UI、操作录屏、必要抽象动效；音乐收放与音效落点从这里开始规划。不先从108张模板里挑。
3. **先采集后构图**：Codex 自行检索官方Logo/截图，实际打开软件操作并录屏；录屏不成功则不能伪造操作画面。保留原始证据、操作时间、来源与许可；私密信息先在像素层处理。旁白说出的事实必须绑定真实对应证据，不能用生成假UI替代。
4. 在项目 production/scene-assets.json 绑定全片意群与真实媒体；design 写实际怎么排版，sound 写声音安排。用 edit:board 自动生成一次**全片真实素材画面板**。有实际渲染关键帧就写入 preview，否则明确标记「素材非最终构图」。不用逐段请用户批准。
5. 先生成全片声画粗剪：真人+真实图片/操作录屏+大致切点+基本的音乐强弱；让观众在动效前就能看懂。复杂包装只负责引导焦点与层次。
6. 整条片交给 HyperFrames 或现有 Remotion 生成动效，复用已经证明好看的字号层级、运动参数等，而非固定窗口结构；按自然语义段落分片并行渲染，不让用户守着电脑逐10秒确认。
7. 用**同一份时间轴**组织人声、字幕、画面、转场、BGM、提示音；插入过渡统一平移全部轨道。音效只在真实视觉/语义事件上发声，留出读图与呼吸段，不默认抽取并商用对标BGM。
8. **只看最终全片合成文件**做自动验收：来源真实、界面可读、构图单一、人物安全、转场、音轨同步、响度、人声清晰、成片实际引用的当前素材版本。失败要重做受影响部分并重新组装，不用修了源码却继续交旧片。
9. 最后一次性交付成片、预览、原工程、素材/音轨清单、QC及未解决项给用户。只有用户明确认可的片段才升为个人风格正例。

## 新增批处理工具

项目 production/scene-assets.json 格式示例：

~~~json
{
  "transcript_revision": "与 transcript/final-transcript.json 相同",
  "scenes": [{
    "scene_id": "对应 visual-planning.json 中 scene.id",
    "role": "evidence",
    "design": "真人退到一侧，真实界面出现并放大免费标识，读清后切回本人",
    "sound": "入场轻提示一次，放大时轻点，读标识时不加音效",
    "media": [{
      "path": "production/assets/real-screen.png",
      "type": "image",
      "mime": "image/png",
      "source": "官方软件页面，采集时补具体日期与链接",
      "verified": true
    }]
  }]
}
~~~

role 可用 clean、evidence、demo（必须录屏）、emphasis、diagram；preview 可选且指向项目内实际渲染的静帧。每段均需完整的 design、sound。没有实证素材时不能声称已补齐。

项目 production/workflow.json 格式示例：

~~~json
{"steps": [
  {"id":"rough_cut","command":["node","production/make-rough.mjs"],"outputs":["production/rough.mp4"]},
  {"id":"motion","command":["node","production/render-motion.mjs"],"outputs":["production/motion-done.json"]},
  {"id":"audio","command":["python3","production/mix-audio.py"],"outputs":["production/mixed.wav"]},
  {"id":"assemble","command":["node","production/assemble.mjs"],"outputs":["production/final.mp4"]},
  {"id":"qc","command":["node","production/check-final.mjs"],"outputs":["production/qc-report.json"]}
]}
~~~

**上面是合同示例，不是仓库已存在的脚本**。Codex 必须基于实际 ChatCut/HyperFrames/Remotion 的调用生成这些项目脚本并验证命令存在。没有实际命令就必须停止，不得伪报全自动已完成。

~~~bash
npm --prefix motion-library run edit:board -- --project <id>   # 一次生成全片真实素材画面板
npm --prefix motion-library run edit:check -- --project <id>   # 检查每段证据和5段执行合同
npm --prefix motion-library run edit:run -- --project <id>     # 无人工中途审批，连续运行与验收
npm --prefix motion-library run test:unattended                # 测试门禁
~~~

程序检查每个步骤产物真实存在、非空、本轮重新输出，记录哈希及失败原因到 production/run-report.json。最终 production/qc-report.json 的 status、sync、evidence、readability、audio、full_video_review 必须全是 pass，状态才能是 ready_for_final_human_review。此状态仅代表进入用户最后审片，不保证审美已获认可。

## 对标与风格来源

本轮对标《秋芝·豆包大升级》原片在另一个私有仓库 my-super-experiments/05_原始视频，GitHub 的普通文件读取目前为 LFS 指针；本机有实际 LFS 媒体时才可复核听感。可复用的**观察证据**来自原仓库 03 的前10秒分析和 19 的整片叙事/声音规则，摘要见 styles/qiuzhi-real-evidence-rhythm-v1/STYLE.md。

新片先检验四件事：人物+官方Logo+重点大字、真实截图的局部聚焦、连续操作录屏、不同章节的安静转切。按整片真实感、阅读焦点和声音节奏评分，不按模板使用数量评分。
