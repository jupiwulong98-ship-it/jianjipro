# Motion Taxonomy

这是 AI 选择动效的唯一入口。

## 三层结构

```
Family
  ↓
Subtype
  ↓
Card Variant
```

例如：

```
list
  └── key-points
       ├── tag-list
       └── side-tag-cluster
```

Planner 只知道 `list/key-points`。
Router 才知道底层卡片名称。

## 文件
- `families.yaml`：定义信息关系和类型。
- `card-capabilities.yaml`：20张真实卡的能力索引。
- `router-policy.yaml`：筛选、评分、重复惩罚、降级规则。

## 新卡加入流程
1. 新建真实 card + manifest。
2. 在 card-capabilities.yaml 注册。
3. 标注 family/subtype、数量范围、素材要求、布局、视觉密度。
4. 通过预览/QC。
5. Router 自动可发现，无需修改 Planner。
