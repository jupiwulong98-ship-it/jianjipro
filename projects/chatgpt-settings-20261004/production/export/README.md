# 完整导出与全片1.08倍速

用户确认“效果可以”，并明确要求完整导出，整片包含动画效果统一1.08倍速。

先用ChatCut Desktop local_export导出已装配时间线的真实完整合成，1080p、30fps、H.264；原速视频4475帧，视频和音轨都149.166667秒。未把以前的Remotion候选预览当作本次成片来源。

再对完整合成使用setpts=(PTS-STARTPTS)/1.08、fps=30及atempo=1.08，口播、已烧录字幕与全部11段动效同步加速。atempo保持原音高；目标时长约138.119秒。源时间线与原素材保持可继续编辑。

原生源文件：/Users/jupiwulong/Movies/ChatCut/ChatGPT先改这4个设置_原速合成_20261004.mp4
最终文件：/Users/jupiwulong/Downloads/ChatGPT先改这4个设置_1.08倍速_20261004.mp4

export-record.json保存任务与验证结果，native-export-probe.json记录原生合成的帧数与音轨信息。已完成：4144帧，视频138.133333秒、音轨138.119秒，1920×1080、30fps；完整视频/音频解码通过，首尾与11段动效共13帧抽查通过。输出文件59,052,994字节。
