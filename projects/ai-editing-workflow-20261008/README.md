# AI剪辑流程与组件复用

20段动画已制作并装入 ChatCut 项目「AI剪辑流程 · jianjiPro动画包装」。原初剪项目保留，当前副本包含87段口播、143条主字幕、20段动画和46段静音人物小窗，总时长7253帧（30fps，4分01.767秒）。

用户的小窗修订已完成：15段全屏动画统一删除“口播讲解”标注和蓝色外框，保留圆角人物视频。15处实际ChatCut合成画面复核通过，原87段主线和20段动画位置对账一致。新版审阅视频：`/Users/jupiwulong/Downloads/AI剪辑流程-动画包装-小窗修订-v2-20261008.mp4`。

## 来源和边界

- `transcript/final-transcript.json` 为初剪后的143条主字幕、1345字词；Opus 5.5名称按用户确认。
- `visual-concepts.json` 和 `visual-planning.json` 为28个意群、20段包装、8段人物停留的批准方案；用户通过“开始制作”授权整版，记录在 `validation/user-approval.json`。
- `project-style-profile.json` 明确参考候选规则与本轮批准的项目设计的来源，图示为解释性表达。
- 1段复用TalkCraft关键词曲线，19段使用项目Generated Motion；字词时间触发状态变化。
- 动画以ProRes 4444透明片段装配，源代码在 `motion/Root.tsx`。ChatCut里可调剪辑位置和尺寸，动画内部文字和关系需修改源代码后重渲染。

## 检查与记录

- `validation/assembly-check.json`：87口播项、143字幕的文本/时间及原主线快照一致；动画帧位置和人物小窗覆盖一致。
- `validation/render-integrity.json`：20动画的完整解码、帧数、尺寸、透明格式检查。
- `validation/export-record.json`：ChatCut原生1080p导出、完整解码、音视频尾点、Downloads副本SHA256。
- `validation/gate-d/`：初版真实完整合成视频的172帧时间带，55镜观察版见 `shotbook.observed.json`；修订版15处实际合成复核见 `validation/pip-cleanup-chatcut-15-shots.jpg` 与 `validation/pip-cleanup.json`。修订版整片已完整解码、帧数尺寸检查和Downloads副本校验。Gate D保持 `needs_visual_review`，连续播放、听审和人工审美验收未声明通过。
- 已运行TalkCraft 11项和Style 14项测试。工作台： http://127.0.0.1:5201/?project=ai-editing-workflow-20261008#planning

## 项目制作命令

在仓库根目录运行：

```bash
node projects/ai-editing-workflow-20261008/render-motion.mjs --stills
node projects/ai-editing-workflow-20261008/render-motion.mjs --only=scene-02,scene-04
```

稳定帧和当前组件hash通过后才正式渲染。`build-production.mjs`会重新生成规划及初始路由记录，仅重做计划时使用；它不会代替ChatCut装配。
