# 剪后全文与画面策划工作台

复用 `motion-library` 原有 React/Vite 工作台，不新增独立应用，不修改全局 Skill。`npm run dev -- --host 127.0.0.1` 后打开 `/#planning`；旧审片在 `/#review`，108 张模板在 `/#talkcraft`。

## 固定交接

1. ChatCut 完成口播剪辑与字幕校正，完整抽取 `projects/<id>/transcript/final-transcript.json`。工作台自动发现所有具有该文件的项目，用户可直接阅读全文、搜索字幕和查看每个字词时间。
2. Semantic Mapper 按完整含义分段。Visual Conceiver 写 `projects/<id>/visual-planning.json`，在模板检索前说明画面如何帮助理解。保留人物也是一种明确决策，不能把字幕条数量当作动画数量。
3. 在工作台的策划表连续查看所有段落：真实口播与包装动作并排，后面直接提供预览、意见与确认入口。原文和开始/变化/结束画面默认展开，字词时间、选择理由与素材按需展开；窄屏仍并排显示原文与包装，操作放在本行下方。预览是包装规则的动态示意，使用占位人物和界面，不是本段成片；用户写意见、处理意见、确认本段策划。
4. AI 读取当前版本对应的意见，修改策划后重新打开工作台。确认全部需要制作的策划后，再继续 Edit Plan、模板与素材、样段与装配。工作台确认不自动操作 ChatCut、不渲染、不导出。

交付链接使用 `/?project=<项目目录名>#planning`，直接载入指定项目；刷新保持该项目。切换项目后地址同步更新，普通 `/#planning` 入口沿用本浏览器最近成功加载的项目，没有历史选择才使用列表首项。链接指定的项目不存在时显示明确提示，不静默替换成另一条视频。页面标题随实际项目更新。

截图中的网页链接、仓库地址、具体 Skill 名称必须在进入动画之前完成像素遮盖；成片不能加入来源脚注或调试标记。内部工作台保留真实逐字稿供核对，不把它当作直接上屏文案。

画面选择由仓库内 [画面策划 Skill](../../skills/style-engine/visual-conceiver/SKILL.md) 规定；它必须读取从用户三份拆解报告提炼的 [规则与参考案例](../../skills/style-engine/visual-conceiver/references/planning-rules.md)。每段先回答具体理解难点、画面补充与取舍，`reason` 写清「难点：…；画面补充：…」。工作台展示这些判断，程序不把填写了理由等同于视觉质量通过。

## 审阅稿合同

```json
{
  "version": "0.1",
  "project_id": "项目目录名",
  "title": "项目标题",
  "transcript_revision": "final-transcript.json 的 revision",
  "proposal_note": "AI 初稿，待用户确认；尚未制作",
  "scenes": [{
    "id": "meaning-01",
    "title": "输入经过工具得到结果",
    "mode": "visual",
    "packaging_rule": "input_process_output",
    "source_word_ids": ["剪后字词id1", "剪后字词id2"],
    "viewer_goal": "看懂输入、处理与输出的关系",
    "initial_state": "只显示输入材料",
    "actions": [{"word_id": "剪后字词id2", "description": "输入进入工具，显出待核验结果"}],
    "final_state": "输入、工具与结果保持相连",
    "materials": "解释性示意；不可冒充真实执行",
    "reason": "用移动过程解释处理关系，减少重复口播"
  }]
}
```

`mode` 为 `visual` 或 `clean`；`clean` 可用空 actions，必须说明为什么保留人物。所有段落按播放顺序覆盖全文，字词不可重复、遗漏、重排。段落文字和起止、动作时间和触发字词均由后端从原文字词读出，忽略提案中自行填写的时间和原文。动作只能引用本段字词，按口播顺序排列；关键落点仍需实际播放核对。

`packaging_rule` 从 [规则示意清单](../../motion-library/src/planning/rules.json) 选择。它关联工作台里的通用动态预览，不是 TalkCraft 模板或 card_id，也不代表素材已绑定或效果已渲染。先决定画面关系，再关联符合该关系的示意；没有合适示意时省略该字段，工作台显示“预览待补”，不能为命中预览改变策划。旧提案允许缺省；保留人物使用 `clean_presenter`。未知规则、规则与呈现方式矛盾时阻断确认。示意的均匀播放节奏不代表本段字词落点，实际落点以表格动作时间和后续成片为准。

动作可选 `cue_word_ids`：从 `word_id` 起连续引用本段字词，工作台将它们拼成可读触发短语（例如“项目仓库”），显示短语首字的开始时间。不能自行填写一个未说过的短语。

缺少提案或提案版本不匹配时全文仍可查看，暂停方案确认。历史 `semantic-map.json` / `visual-concepts.json` 可以供重新思考，但不自动当作新版本的确认方案。当前“找工具”33 段为新 AI 策划初稿：参考历史意义分段，按当前 946 个字词重新绑定；没有修改 ChatCut 时间线或媒体文件。

## 版本、意见与验证

- GET `/api/planning-projects`：项目列表；GET `/api/planning-projects/<id>`：全文、有效策划、binding 和本轮意见。
- POST 同项目接口：`binding`、`revision`、`shotId`、action；复用原有 comment/status/resolve/delete 存储规则，未处理意见不能确认。前端也阻止带未提交意见草稿直接确认。
- binding 是全文来源、版本、全部字幕/字词数据和策划内容的 SHA-256；仅采集时间改变不影响确认。意见写在 `projects/<id>/planning-reviews/<binding>.json`，全文或策划变化后旧确认不继承，历史文件保留。版本冲突返回409，输入草稿保留；载入新版后重新检查再提交。
- 仓库根目录 `.gitignore` 统一排除 `projects/*/planning-reviews/`；意见留在本机项目内，勿随仓库发布。原有历史 review.json 保留。
- `npm run test:planning` 验证项目发现、字词覆盖与锚点、版本隔离、保存读回和 API 访问约束；`npm test` 覆盖页面交互和历史界面回归；`npm run build` 检查类型和构建。

此工作台提供流程策划与本机审阅，尚无全文字词与播放器联动、自动 AI 生成按钮或自动模板制作。字词时间不是 ASR 准确性或听音验收的证明。

## 独立候选样段

用户明确要求制作短段动效参考时，可以生成供看听的独立候选，再回到表格审阅；这不代表策划已经确认或允许自动装回 ChatCut。`reference-20s/preview.json` 记录候选状态、全文版本、关联场景编号、场景内容 SHA-256 和 MP4 哈希；可用title与duration_seconds标记完整候选（旧样段省略时仍兼容20秒默认值）。有效候选在表格上方显示候选真实标题、时长与“播放动效候选”，对应行可定位至该段；通用“预览包装规则”仍与实际候选分开。

当前媒体路径为项目内 `reference-20s/reference.mp4`、海报 `reference-20s/validation/frame-295.png`，由本机 `/api/planning-projects/<id>/reference.mp4` / `reference.png` 只读提供并支持 Range。媒体或相关策划发生变化时隐藏旧候选；没有候选的项目沿用文字策划与规则示意。实际候选播放器有音轨和连续视频，尚未把全文字词按钮做成音视频联动，也不提供自动生成按钮。
