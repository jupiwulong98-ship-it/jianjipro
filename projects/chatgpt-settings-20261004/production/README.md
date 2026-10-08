# 当前口播动效候选

输入是本项目149.167秒ChatCut初剪时间线与final-transcript.json。没有换用上一个视频。4475帧预览底稿按69个真实片段范围重建，源起点逐段归零，帧数与时间线一致。

实际动效源码Production.tsx调用已有TalkCraft组件；templates/只保存项目级计数格式、分支连接布局及真实界面焦点参数升级。选择依据在template-selection.json。所有动效均使用剪后原生字词锚点。未将公共卡未声明的sequence/one_to_many能力冒充已支持；项目升级需要独立稳定帧复验。

原始截图只用于本轮脱敏，交付素材位于assets/。privacy-assets.json保存裁切、遮盖和哈希；private文本不进入示例文案。真实开关现状保留，未点击切换或保存。

复现候选：从仓库根运行node projects/chatgpt-settings-20261004/production/render.mjs stills，查看稳定帧后更新validation/stable-frame-qc.json的源哈希，再运行render.mjs render或render.mjs clips。源码和素材变化会阻断旧QC复用。素材已经脱敏保存，复现渲染不需要原始截图。

candidate.mp4是带原口播/字幕的完整审片预览。renders/是11段静音动效素材，两段人物旁包装为ProRes4444透明MOV，其余全屏为MP4。delivery.json记录逐段位置、起点、帧数和哈希。未把渲染结果宣称为ChatCut原生可编辑动效。

Gate C仅检查代表帧；Gate D时间带也不替代完整动态审片和听音。此前最终导出保留给用户；本轮用户已确认效果并明确授权完整导出。完整合成与整片1.08倍速成片已完成，见export/README.md。

工作台：http://127.0.0.1:5201/?project=chatgpt-settings-20261004#planning，点击“播放动效候选”，或逐段播放。候选4475帧、149.167秒；11段素材均为1920×1080、30fps、静音，2段带透明通道。media-check.json通过13份媒体核对。AAC音轨末尾约60ms编码填充，视频帧数和字词锚点保持一致。

整片72帧时间带已复查：人物安全区、字幕、界面遮盖和主要关系结构未发现静帧问题。117.6–135.8秒保持人物讲述，用于资料隐私与默认设置的解释，未机械加动画。Gate D为needs_visual_review，仍需完整动态审片和听音；浏览器已实际从13.43秒播放到38.46秒并暂停，确认可以播放及跳段。

本轮原始截图缓存已清理，仅保留脱敏素材及哈希记录。11段素材现已装入ChatCut当前时间线的V2“TalkCraft 动效 · 11段”；原69个口播片段映射与81条字幕均未改变。装配记录及ChatCut原生合成帧在assembly/。
