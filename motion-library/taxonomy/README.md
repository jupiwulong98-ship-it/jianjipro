# Motion Taxonomy

规划顺序：Family → Subtype → 真实输入与布局 → 已适配 Card。

- `families.yaml`：语义信息关系。
- `input-types.yaml`：素材与输入类型。
- `layer-model.yaml`：Primary / Camera / Annotation / Transition / SFX 分层。
- `router-policy.yaml`：全库筛选与评分设计；当前解析脚本尚未实现完整加权评分。
- `../adapters/talkcraft/registry.json`：八张适配卡的可执行能力、参数和约束。
- `../src/talkcraft/catalog.json`：108 张模板的浏览目录。

旧原生 Card 的能力索引与输入索引已移除。

新增模板：保留 vendor 原件，在 adapters/talkcraft/cards 新增参数化 TSX，登记 registry，在 runtime-talkcraft/Root.tsx 注册；验证代表帧和动态片段，再用于实际项目。运行 `npm run talkcraft:index` 更新目录。未适配模板只能参考，不能自动命中。
