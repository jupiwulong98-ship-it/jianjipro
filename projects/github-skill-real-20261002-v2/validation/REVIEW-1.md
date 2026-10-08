# 前 7 镜独立静帧评审

范围：github、find、repository、three-actions、signup、search-codex、search-ppt。
评审范围仅为接触表和每镜 0/1/2 原帧；动态连贯性、真实词落点、听审待完成，不能据静帧或锚点表判定通过。

## 材料清单
- shotbook.json
- validation/contact-1.jpg 与 renders/<id>-0/1/2.png
- github/find 旧 keyword adapter 对照帧与源；其余为 Generated Motion，原卡保真不适用
- validation/word-anchors.json
- validation/sfx-report.json（本轮未加 SFX，仅视觉审查）
- semantic-map.json、validation/card-candidates.md
- validation/QA.md

## P0
待逐镜检查。

## P1
待逐镜检查。

## P2
待逐镜检查。

## 逐镜记录

- **1/7 github**：接触表已看 0/1/2，并放大 github-1.png。青底斜切圆角标签与原 keyword-pop-highlight 对照帧一致，白字与阴影保留；图形约 x=321–532、y=333–414，静帧上距字幕保留区 y=885 有 471px。无文字裁切。原帧只有透明包装（查看器呈黑底），未含真人与字幕，因此不能据此判定最终合成脸部/字幕避让已通过。词锚 7.967s 仅是计划，动态待核。
- **2/7 find**：接触表已看 0/1/2，并放大 find-1.png。标签约 x=295–558、y=333–414；“AI 帮你找”字形完整，无挤出青底，视觉强调对应寻找行动。与同源 keyword 卡对照无明显保真走样。右端超过 shot.box 的 x=482 约 76px，但未侵入按 shotbook 给定的脸部区域主体中心；透明包装未提供真实合成，脸部遮挡仍待核。词锚 20.167s 仅是计划。

- **3/7 repository**：接触表已看 0/1/2，放大 repository-2.png。中心 GitHub（约 x=700–1210、y=356–604）用四条青色连接线连到四类内容，末帧四项全显，center_branches 静态关系成立。最下“学习资料 / Skill”约 y=716–760，距保留区 125px；无裁字、线与正文相撞。中文分支约 48px，390px 宽缩放后仅约 9.8px，属于下述手机可读性问题，不能判全尺寸可读就终检通过。无人物。
- **4/7 three-actions**：接触表中 0/1/2 依次以“搜需求 / 看介绍 / 复制链接”为主角，three-actions-2.png 的底部路线完整保留 1→2→3（约 y=808–841），并由青线从左至右连接，sequence 未退化为并列清单。主标题与当前动作完整，最后“复制链接”大字不裁切；路线底端距 y=885 保留区约 44px。末帧没有放大呈现三项同等正文，但路线仍保留顺序。小路线字约 38px，缩到390宽约 7.7px，手机上只靠底部路线追前两项不充分，建议末帧三项以较大字号同显。
