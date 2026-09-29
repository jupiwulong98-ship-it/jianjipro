# Style Engine V2 Architecture

## 最终链路

```
参考视频
  ↓
Reference Analyzer
  ↓
reference-events
  ↓
Style Synthesizer
  ↓
Style Profile
(Editorial Grammar + Visual Skin)

自己的口播
  ↓
Transcript / Alignment
  ↓
Semantic Mapper
  ↓
Semantic Map
  ↓
Edit Planner
  ↓
Motion Request
(family / subtype / content / constraints)
  ↓
Asset Gate
  ↓
Asset Workspace
  ↓
Motion Router
  ├─ families.yaml
  ├─ card-capabilities.yaml
  └─ router-policy.yaml
  ↓
Resolved Edit Plan
(card + version + props + media bindings)
  ↓
ChatCut Executor
  ↓
Render
  ↓
Visual QC
  ↓
Pass / Revision Loop
```

## Planner 与 Card 的边界

Planner 不知道具体卡片名。

例如它只输出：

```yaml
family: list
subtype: key-points
item_count: 3
items: [选题, 流量, 转化]
```

Router 再从本地 Motion Library 中寻找符合：
- list/key-points
- 支持3项
- 当前素材满足
- 人物布局兼容
- 视觉密度合适
- 最近没有重复使用

的真实 Card。

## Motion Library

真实 JSX 卡片已统一迁入：

`motion-library/cards/`

AI 检索入口：

`motion-library/taxonomy/`

底层 card id 保留用于稳定执行和版本管理，但不再作为 Planner 的主要语言。

## 包装来源优先级
1. 当前 Library 中能力精确匹配的 Card
2. 同 Family 可参数化的 Card
3. 对现有 Card 升级
4. Generated Motion
5. 明确降级为干净口播/文字表现

## 不做
- 不按关键词机械匹配卡片。
- 不因只有现成模板而强行使用错误的信息结构。
- 不逐字复制参考创作者的独创视觉资产。
