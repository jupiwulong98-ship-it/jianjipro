> 历史记录：以下为 2026-09-29 的验证结果。2026-10-01 已移除旧 20 张原生 Card，当前实现见根 README 与 TalkCraft registry。

# 首次实际跑通记录（2026-09-29）

## 本次输入

- 三条参考视频：本机 `Downloads` 中与 `references/samples/*/reference-events.yaml` 的 `source_file` 同名文件。
- 风格：`styles/ai-talkinghead-editorial-v0.1/`。
- 待剪项目：`projects/ai-business-cases-test/` 中的现成草稿。

## 已验证

1. 三条参考视频均可读取；视频时长与记录误差不超过 0.004 秒，分辨率一致。每条首个事件各抽取一帧，画面与事件描述相符。此抽样不能证明全部 85 个事件的细节都正确。
2. Style Profile 的 10 条正式规则所引用的事件 ID 全部存在，每条规则至少来自两条参考视频。此检查只验证引用关系，不替代逐事件视觉复核。
3. `motion-library/` 的 20 张卡片通过卡片与分类校验；27 个测试通过；生产构建成功。构建有单个包超过 500 kB 的提示，不阻断当前验证。
4. 旧独立动效库的 114 个受 Git 跟踪文件在 `motion-library/` 均有对应文件。旧库本地未提交的 `keyword-impact` 2.1.0、2.2.0 版本及当前版本指针已迁入本仓库，并通过上述校验、测试和构建。

## 流程停在何处

1. `ai-business-cases-test` 只有文案：35 个语义段没有 `start/end`，29 个 Edit Plan 事件也没有 `start/end`。仓库中没有这条口播的原视频或 SRT，不能生成真实时间轴。
2. 现有 Semantic Map 草稿是 v0.1，当前格式定义是 v0.2；Edit Plan 草稿是 v0.2，当前格式定义是 v0.3。29 个事件都缺 `presentation_hint` 和 `supporting_layer_hints`，27 个缺 `asset_requirements`。它们是历史草稿，不能当作符合当前合同的最终输入。
3. 项目里没有 `shotbook` 或 `asset-manifest`。真实证据截图也未装配。当前不能执行 Shotbook → Router → ChatCut → Stable Frame Gate → Final QC 的完整闭环。
4. Roadmap 中的自动 Shotbook、Motion Router 执行脚本、ChatCut executor mapping、素材装配网页仍未实现；不能把“有规范和样例”视为自动流程已跑通。

## 下一次实际运行所需

- 明确要剪的原始口播视频，或对应的 SRT/逐字稿与时间码；先确认画幅、帧率、人物位置、字幕状态。
- 案例中需要展示的真实截图/录屏及来源。素材缺失时只能做明确标注的解释性降级，不能伪造案例证据。
- 以当前 v0.2/v0.3 数据合同重建这个项目的 Semantic Map 与 Edit Plan，然后逐步生成 Shotbook、路由结果和 ChatCut 审核版。
