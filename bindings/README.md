# 执行绑定

当前使用 `talkcraft-bindings.yaml` 指向 TalkCraft 适配 registry 与独立 Remotion 渲染工具。

Planner 输出语义和输入，Router 解析为适配卡；按镜头渲染静音透明 MOV，生成 `chatcut-delivery.json`。助手通过 ChatCut 工具在项目副本上装配。

八张已适配卡可执行；108 张浏览模板不能等同于 108 张已适配卡。未适配需求返回升级/生成请求。流程见 `motion-library/docs/talkcraft.md`。
