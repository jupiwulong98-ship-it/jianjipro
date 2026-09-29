# Styles

每个风格一个目录：

```
styles/
  <style-id>/
    style-profile.yaml
    evidence-index.yaml
    README.md
```

## 命名建议
使用可读稳定 id，例如：
- creator-name-v1
- medical-explainer-v1
- tech-talkinghead-v1

## 版本策略
风格发生明显变化时新建版本，不覆盖旧版本。

## Evidence Index
每条 decision rule 都必须能定位到参考视频里的具体事件。没有 evidence 的规则不得进入正式 profile。
