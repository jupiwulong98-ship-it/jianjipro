"""Build an evidence-backed reference archive, not a production timeline."""
from pathlib import Path
import hashlib
import html
import json
import math
import shutil
import subprocess
import yaml

ROOT = Path(__file__).resolve().parent
SOURCE = Path('/Users/jupiwulong/Downloads/6个skill立刻实现Codex做视频全流程 _ai新星计划 _vibecoding大赏 _前沿科技趋势发布月 _我在抖音聊科技 _codex.mp4')
VID = 'codex-six-skills-20261008'
DURATION = 61.3239

def write_json(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def grid(at):
    page = min(int(at // 5) + 1, 13)
    return f'evidence/dense/001-0_000s-61_200s-p{page:03d}.jpg'

# Observed at 5 fps. Boundaries are rounded estimates, not frame-exact cuts.
# The main-stage track partitions the source; overlapping layers are separate.
scenes = [
 (0,1.8,'结果承诺开场','装Codex不知道干什么','大白字 Codex 做视频搞钱，真人画面压暗','标题由较淡、小的状态变清晰；小标签补入','标题保持，真人继续口播','演示窗口进入后标题消失','用结果承诺建立观看理由','P01','claim'),
 (1.8,3.8,'先露出制作结果','当然是拿来做视频搞钱','编辑器窗口覆盖画面中右部，真人为底','窗口从较小、偏右下变大','窗口内可见时间线与预览','旋转成斜向薄片退场','在介绍工具前展示成片工作环境；不能据此验证工具能力','P05','example'),
 (3.8,5.8,'六项总览','给Codex装上这6个skills','蓝紫网格舞台，三列两行编号卡','背景与六卡从半透明叠加变成全屏','六项同时展示，不逐项讲解','录屏窗口从右下区域放大进入','先建立全片地图，让后续编号有上下文','P03','number'),
 (5.8,8.2,'制作界面展示','直接让它参与整条视频制作流程','白底聊天/编辑界面包住深色预览与底部时间线','窗口由小变大覆盖总览','窗口内预览从六项网格切到单工具卡','整个外层窗口倾斜、收窄退出','把流程承诺与可见界面联系起来；界面不等于完成运行证据','P05','example'),
 (8.2,8.6,'真人桥接一','第一个','短暂干净真人画面','前一窗口离开','人物手势和口播保持','编号卡淡入','章与章之间短暂回到讲述者','P00','entity'),
 (8.6,10.2,'章节一：HyperFrames','第一个，Hyperframes','左侧描边01，中间名称/用途/标签，右侧截图；紫色曲面背景','截图与编号先可见，名称和副文案随后变清晰','同版式保持，顶部当前章节高亮','与真人背景交叠淡出','建立工具身份；重复版式降低阅读成本','P02','entity'),
 (10.2,10.4,'真人桥接二','一句话','真人画面，顶部导航与字幕保持','章节卡消退','非常短的桥接','能力卡组进入','连接工具身份和用途','P00','claim'),
 (10.4,12.8,'五张用途卡展开','一句话，生成动效视频，知识科普','五张倾斜圆角卡，上二下三，紫色一张更亮','卡片从中心堆叠展开，至约10.8秒形成两排','知识科普/产品介绍/动态视频/自动工作流/AI能力同时保持','切换为真人上的演示叠层','将抽象用途展开为并列场景；五项未与口播逐项完全对齐','P04','example'),
 (12.8,16.2,'结论牌配白底演示','产品介绍，还能直接渲染成MP4成片','左侧KEY TAKEAWAY结论牌，右侧白色示例，真人压暗为背景','两侧内容淡入/放大到稳定位置','演示内部有图标、路径和中部卡片变化；结论牌底线伸长','结论先淡去，右侧演示收成斜片退场','口播说用途，画面给出输出示例；演示只是源片展示内容','P05','example'),
 (16.2,17.4,'章节二：Video Use','第二个，Video use','沿用编号介绍卡，02和右侧截图','截图/编号先出现，名称随后清晰','布局保持','交叠真人淡出','统一章节识别方式','P02','entity'),
 (17.4,17.6,'真人桥接三','把拍摄素材','真人短暂恢复亮度','介绍卡退去','短暂口播','能力窗口叠入','连接名称与功能','P00','process'),
 (17.6,18.8,'自动后期能力窗口','把拍摄素材交给它','左侧主标题与四小标签，右侧模拟桌面窗口/三张白卡','标题、四标签和窗口建立','窗口中白卡略移动；它是功能示意，不是真实操作证据','切成真人上的真实编辑器叠层','用抽象窗口表达自动后期类别','P06','process'),
 (18.8,21.8,'自动后期界面展示','自动删除停顿，添加字幕调色做动效','左侧结论牌，右侧深色编辑器大窗口','窗口从偏下较小状态放大','编辑器和左侧结论牌保持；底线伸长','右侧窗口约21.4秒开始斜片退出，结论牌淡去','把功能清单与编辑界面并列；具体功能完成情况未验证','P05','example'),
 (21.8,23.2,'章节三：Remotion','第三个，Remotion','03编号介绍卡，右侧仓库类截图','编号/截图先出现，再补名称','统一介绍版式','交叠真人淡出，随后演示进入','统一章节识别方式','P02','entity'),
 (23.2,28.9,'代码批量视频展示','用代码批量制作视频，比如排行榜、数据周报、固定栏目','白底制作界面，预览内播放六项介绍卡','窗口由下方小状态放大','嵌套预览从总览切HyperFrames再Video Use后回总览；有光标圆圈','约28.8秒窗口斜片退场','示意代码制作，但未直接展示排行榜/周报成品；复用时素材需更贴合','P05','example'),
 (28.9,29.2,'真人桥接四','第四个','真人手势与原景','窗口退出恢复真人','短暂桥接','04编号卡进入','给新章一点辨识空间','P00','entity'),
 (29.2,31.0,'章节四：Generative Media','第四个，Generative media','04编号卡；名称右端与截图接近/部分遮挡','截图/编号出现，名称随后','统一版式，但长名称空间不足','交叠真人淡出','介绍新实体；长标题需要自适应而非照抄原比例','P02','entity'),
 (31.0,31.2,'真人桥接五','视频生成工具箱','真人短暂恢复','卡片退去','短暂口播','多媒体能力舞台进入','从实体转入能力关系','P00','claim'),
 (31.2,34.8,'图片/视频/音频能力矩阵','视频生成工具箱，图片视频音频全覆盖','暗网格舞台；左截图，中部图片/视频/波形，右资产列表','矩阵由淡变实','约32.6秒起图片示例替换抽象图；横向示例和右侧竖版蛋糕动图入场','约34.6秒与真人交叠淡出','用不同媒体载体表现覆盖范围；波形是示意，不是已提取的源音轨','P07','claim'),
 (34.8,36.2,'章节五：Video Cut','第五个，Video Cut','05编号介绍卡，右侧仓库/插件截图','截图/编号先出现，名称随后','统一版式保持','淡回真人','统一章节识别方式','P02','entity'),
 (36.2,36.4,'真人桥接六','专门为中文创作者','干净真人','编号卡退去','短暂口播','中文需求能力舞台进入','连接介绍和需求','P00','claim'),
 (36.4,39.0,'中文剪辑需求示意','专门为中文创作者做的剪辑Skill','左主标题/四标签，右模拟桌面窗口/白卡','复用第二章能力窗口结构，更换文案','白卡保持轻微移动；需求标签可见','切为左结论牌+右真实截图','表达差异化需求；窗口图解不算功能验证','P06','claim'),
 (39.0,40.6,'中文能力结论配截图','更懂中文剪辑需求','左结论牌+右仓库/插件截图，真人仍可见','两侧叠层由淡到实','结论和截图保持，进度底线伸长','约40.4秒开始淡去','保持同一总结语法；静态仓库截图只能证明画面中展示了它','P05','conclusion'),
 (40.6,41.0,'真人桥接七','第六个','真人恢复原景','叠层消退','短暂口播','06编号卡进入','章间桥接','P00','entity'),
 (41.0,42.8,'章节六：Seedance 2','第六个，Seedance 2 skill','06编号卡，右侧变成浅色流程插画缩略图','截图先出现，编号/标题随后','统一章节版式','与真人交叠后浅色流程板进入','新实体用后续解释图提前预告','P02','entity'),
 (42.8,47.6,'创意到分镜到成片','你只需要告诉它一个视频创意，它就能帮你设计15秒分镜和提示词','浅米色全屏横向流程插画：灯泡→分镜→摄像机/成片','浅色板由淡变实，约43秒稳定','布局基本稳定，插画有微小位置/装饰变化；未见各节点按口播逐项新增','约47.6秒退回真人','用空间顺序解释输入到输出；不应把它误读成逐词推进动画','P08','process'),
 (47.6,49.9,'结果大字强调','直接交给Seedance生成视频','真人前景大白字“直接生成视频”','约47.8秒文字超大裁边，约48.2秒缩到可读大小','文字在真人胸口上方保持，字幕另在底部','约49.8秒向右移出并变淡','把输入流程的结果作为一处强强调','P09','conclusion'),
 (49.9,55.6,'回到六工具并收束观点','这六个skill最大的作用不是单独使用，而是串成自己的视频工作流脚本','六项网格回归，标题改为最大价值：串成工作流','网格与标题淡入','约52.8秒右上加入“专属工作流”白标签/绿色勾；约54.2秒勾重复出现一次','网格约55.4秒淡回真人，标签短暂保留','复用开场地图，把并列工具收束成协同观点；当前网格没有连线表达依赖','P03','conclusion'),
 (55.6,55.8,'真人桥接八','从选题','真人和右上工作流标签','网格淡出','短暂桥接','深色五步生产链进入，标签移除','切入最终结构','P00','process'),
 (55.8,DURATION,'五步生产链结尾','从选题、分镜、提示词到剪辑字幕、包装，都可以交给Codex，一步一步完成','五张等宽编号卡横向并排：选题/分镜/提示词/剪辑字幕/动效包装','五卡快速依次补齐，约56.2秒已有完整五卡','卡片和空间顺序保持；没有见到每个口播词对应单独高亮','结束处维持流程板，源文件终止','把六个工具重新组织为生产步骤；源片没有明确的互动CTA','P10','process'),
]

events = []
def event(start,end,name,spoken,layout,entrance,hold,exit,reason,pattern,role='other',track='main-stage',kind='motion_graphic',confidence=.90):
    eid = f'{VID}-e{len(events)+1:03d}'
    first = min(math.ceil(start*5-1e-6)/5,61.0)
    last = min(max(first,math.floor((end-1e-6)*5)/5),61.0)
    observed = sorted(set([first,last]))
    evidence = [dict(kind='reference_grid',path=path,sample_times=[at for at in observed if grid(at)==path])
                for path in dict.fromkeys(grid(at) for at in observed)]
    rec = dict(event_id=eid, id=eid, name=name, start=start, end=end,
      spoken_text=spoken, semantic_role=role, event_type=kind, track=track,
      trigger=dict(evidence_text=spoken, inferred_reason=reason),
      visual=dict(layout=dict(description=layout), typography=dict(exact_font='unknown'), color=dict(description='见原帧；未做精确色值测量')),
      motion=dict(entrance=entrance, hold=hold, exit=exit, timing=dict(clock='reference_source', boundary_status='sample_estimate', tolerance_sec=.2, easing='unverified')),
      assets=evidence,
      sound=dict(speech='已用本地ASR检测口播；文字修正依据画面字幕',music='unverified',sfx='unverified'),
      context=dict(previous_event=None,next_event=None),confidence=confidence,
      confidence_basis='视觉观察可信度；不表示源口播主张真实，也不表示观众效果已测量',candidate_pattern_id=pattern,
      reuse_status='candidate_not_implemented')
    events.append(rec)
    return eid

scene_ids = []
for row in scenes:
    scene_ids.append(event(*row))
for i,eid in enumerate(scene_ids):
    e = next(x for x in events if x['event_id']==eid)
    e['context'] = dict(previous_event=scene_ids[i-1] if i else None,next_event=scene_ids[i+1] if i+1<len(scene_ids) else None)

# Compound scenes are split by layer so later template authors can find actions.
event(0,DURATION,'顶部章节导航','开场/六个工具/串成工作流','顶部窄条持续导航；章节介绍内部也有自身导航版式','源视频第一帧已可见','当前章节在不同段落高亮；源界面导航与外层导航存在样式更替','随源视频结束','维持章节位置感；是否同一源组件未知','P11','other','navigation','background')
event(0,DURATION,'底部字幕系统','见字幕校正记录','底部居中白字、黑色圆角底板','字幕按语句换行替换','与主包装并存；它不是关键词大字层','随语句替换/结束','保证讲话内容可读，和大字强调分层','P12','other','captions','caption')
event(.2,1.8,'开场标题补充标签','Codex 做视频搞钱','主标题下青色小字和描边小标签','主标题先可见，补充标签随后补齐','小标签保持','被编辑器叠层替换','主标题与补充说明有阅读优先级；小字内容未完全校读','P01','claim','annotation','emphasis',.82)
event(1.8,2.2,'编辑器窗口放大进入','当然是拿来做视频搞钱','编辑器从右下放大居中','约1.8秒窗口较小，至2.2秒更大','进入后大窗口保持','由所在场景统一退出','结果句出现时让演示成为视觉主体','P05','example','internal-motion')
event(3.6,4.0,'第一处斜片退出','给Codex装上','编辑器整体变斜/变窄退离','大窗口先稳定','短转场','真人显露后六项舞台出现','从演示返回新结构；几何似翻页，但无法由成片推断实际3D实现','P13','other','transition','transition')
event(5.8,6.2,'制作界面放大进入','参与整条视频制作流程','白底外层界面从下方放大','先在右下/中下可见','进入后保持','所在场景退出','承诺句切到演示','P05','example','internal-motion')
event(7.85,8.25,'制作界面斜片退出','第一个','外层录屏旋转、收窄退出','整张录屏从稳定状态开始变斜','短转场','露出真人','主窗口退出动作与窗口内部播放动效要分开记录','P13','other','transition','transition')
event(10.4,10.8,'五卡由堆叠到展开','一句话生成动效视频','中心卡叠成两排并列场景','先堆叠，后展开','展开后保持至12.8秒','主场景更换','揭示并列用途而非顺序步骤','P04','example','internal-motion')
event(13.0,15.4,'白底演示内部构建','知识科普、产品介绍','白底录屏内小图标、路径、中部面板陆续出现','空白/背景先可见','图标、弧线与中部卡片在录屏内部构建','随外层演示退出','源演示本身的动作，不应复制为外层固定字幕动作','P05','example','embedded-media',confidence=.85)
event(12.8,15.6,'第一处结论牌底线','一句话生成动态内容','左结论牌底部青到黄绿色细线','先短线','横向变长','结论牌消退','提供持续运动；是否表达真实时间进度未知','P14','other','annotation')
event(15.8,16.2,'白底演示斜片退出','第二个','右侧白底演示窗口收窄斜退','结论牌先退去','窗口短暂单独保留','恢复真人并进02卡','结束演示与换章解耦','P13','other','transition','transition')
event(17.6,18.0,'后期示意窗口建立','把拍摄素材交给它','四需求小标签+右侧三张白卡','标题/标签与窗口入场','白卡及细线轻微运动','切到界面演示','抽象功能总览，不假定是逐项执行流程','P06','process','internal-motion')
event(18.8,19.2,'第二处演示放大','自动删除停顿','编辑器窗口从偏下放大至主展示位置','较小窗口进入','稳定','场景退出','让功能口播切换到演示','P05','example','internal-motion')
event(18.8,21.4,'第二处结论牌底线','拍摄素材自动完成后期','左结论牌底线伸长','短线','逐渐变长','牌子淡去','同第一处底线的视觉语法；用途是推断','P14','other','annotation')
event(21.4,21.8,'第二处编辑器斜片退出','第三个','大编辑器变窄斜向退出','右侧大窗稳定状态打破','退出期间左牌仍短暂保留','真人和下一章','把主展示窗口和总结层分别管理','P13','other','transition','transition')
event(23.4,28.4,'批量制作录屏内部切换','排行榜、数据周报、固定栏目','外层白界面不变，内层预览换卡，有光标圆圈','六项预览→01介绍卡→02介绍卡→六项预览','外层窗口尺寸保持','外层转场另处理','说明这是带内部时间线的媒体素材，不能每帧当成独立包装模板','P05','example','embedded-media')
event(28.6,29.0,'第三处录屏斜片退出','第四个','白界面整体倾斜收窄','开始退出','短转场','真人恢复','演示结束的重复转场语法','P13','other','transition','transition')
event(32.6,33.0,'多媒体示例替换抽象占位','图片视频音频全覆盖','蛋糕海报替换图片占位，横向示例与竖版动图进入','原有矩阵先建立','示例叠入并保持同一矩阵位置','与舞台一起退','先讲类别后给对应示例；波形不证明音频实际播放','P07','example','internal-motion')
event(33.0,34.6,'右侧竖版示例内部运动','图片视频音频全覆盖','蛋糕房子动图内容变化，外框基本不变','跟随示例进入','图内运动持续','整体舞台淡出','把动态媒体与外层包装区分','P07','example','embedded-media')
event(36.4,36.8,'中文需求窗口建立','专门为中文创作者','复用四标签+右侧白卡窗口','主标题、标签和窗口由淡变实','稍微运动','切到截图总结','重复结构更换内容，证明同一包装模式在片内重复','P06','claim','internal-motion')
event(39.0,40.4,'第三处结论牌底线','更懂中文剪辑需求','左总结牌细线伸长','短线','伸长','结论牌淡去','与前两个总结牌一致；不可直接视为语音进度条','P14','other','annotation')
event(42.8,43.2,'浅色流程舞台建立','你只需要告诉它一个视频创意','暗舞台转浅米色全屏流程图','浅板先透明，后完整','流程整图保持','主场景统一退','概念关系变化时换视觉舞台','P08','process','internal-motion')
event(47.6,48.25,'巨字缩小至可读','直接交给Seedance生成视频','白字由巨大裁边缩到可读大小','大字强入场','约48.2秒后保持可读形态','后续动作独立记录','在结果句制造强弱对比；不能据此证明提高留存','P09','conclusion','internal-motion','emphasis')
event(49.6,50.0,'巨字右移退出','这六个skill最大的作用','大字向右离场并变淡','从稳定字开始退出','短退出','六项舞台淡入','强强调结束后进入总结','P09','conclusion','internal-motion','emphasis')
event(52.8,53.2,'工作流标签与勾入场','而是串成你自己的视频工作流脚本','右上白色牌“专属工作流”和绿色勾','标签进入，勾出现','与六项网格共存','标签在55.6秒真人桥接仍短暂存在，五步舞台建立时去掉','将总结判断再提炼为一个标签','P15','conclusion','annotation','emphasis')
event(54.15,54.5,'绿色勾的重复绘入','而是串成你自己的视频工作流脚本','白牌保留，绿色勾一度消失/部分出现后恢复','已有勾消失','勾再显现','恢复稳定标签','源片出现重复动作；未见新增语义，不建议默认循环照搬','P15','other','internal-motion','emphasis',.85)
event(55.8,56.3,'五步骤快速补齐','从选题、分镜、提示词','横向五个编号卡','卡片按横向位置快速出现','约56.2秒五项完整','保持到源片结束','入口快速建立整体流程；不是五个词各触发一次逐项入场','P10','process','internal-motion')

for name,path in [('第一处斜片退出','001-screen-exit.jpg'),('制作界面斜片退出','002-studio-exit.jpg'),
                  ('巨字缩小至可读','003-result-emphasis.jpg'),('绿色勾的重复绘入','004-check-repeat.jpg')]:
    e=next(e for e in events if e['name']==name)
    e['assets'].append(dict(kind='micro_grid',path=f'evidence/micro/{path}',requested_sampling_sec=.05,
                           actual_clock='源视频30fps；请求时点按实际帧就近采样'))

write_json('reference-events.json',dict(version=.1,video_id=VID,source_file=str(SOURCE),duration_sec=DURATION,
 sampling=dict(overview_every_sec=1,dense_every_sec=.2,boundary_precision='approximate',no_frame_exact_claim=True),
 notes=['成片逆向观察；无法恢复原始项目、精确字体、缓动参数或分层素材。','旁白主张仅为源片内容，不视为工具能力或流量表现已验证。','音效/音乐尚未做独立听音核验。'],events=events))
(ROOT/'reference-events.yaml').write_text(yaml.safe_dump(json.loads((ROOT/'reference-events.json').read_text()),allow_unicode=True,sort_keys=False))

# Original ASR is immutable. Corrections rely on burned-in source captions.
raw_bytes = (ROOT/'transcript-auto.json').read_bytes()
# whisper.cpp full JSON can emit partial UTF-8 inside byte-level tokens.
# Retain those exact original bytes; a separate copy is safe for JSON readers.
decoded = raw_bytes.decode('utf-8', errors='replace')
raw = json.loads(decoded)
write_json('transcript-auto-readable.json',raw)
write_json('transcript-normalization.json',dict(original='transcript-auto.json',
  readable_copy='transcript-auto-readable.json',original_bytes_preserved=True,
  replacement_character_count=decoded.count('\ufffd'),
  reason='原始full JSON的部分字节级token含不完整UTF-8；仅可读副本用替换字符处理，句文本另行按画面校正。',
  token_times_not_forced_aligned=True))
fixed = [
 '装Codex不知道干什么？当然是拿来做视频搞钱。',
 '给Codex装上这6个skill，直接让它参与整条视频制作流程。',
 '第一个，Hyperframes。一句话，生成动效视频。',
 '知识科普、产品介绍，还能直接渲染成MP4成片。',
 '第二个，Video Use。把拍摄素材交给它，自动删除停顿，添加字幕、调色、做动效。',
 '第三个，Remotion。用代码批量制作视频。',
 '比如排行榜、数据周报、固定栏目，都可以批量出片。',
 '第四个，Generative Media。视频生成工具箱，图片、视频、音频全覆盖。',
 '第五个，Video Cut。专门为中文创作者做的剪辑skill，更懂中文剪辑需求。',
 '第六个，Seedance 2 skill。你只需要告诉它一个视频创意，',
 '它就能帮你设计15秒分镜和提示词，直接交给Seedance生成视频。',
 '这六个skill最大的作用不是单独使用，而是串成你自己的视频工作流脚本。',
 '从选题、分镜、提示词到剪辑、字幕、包装，都可以交给Codex，一步一步完成。'
]
segments=[]
for i,(s,text) in enumerate(zip(raw['transcription'],fixed)):
    start,end = s['offsets']['from']/1000,s['offsets']['to']/1000
    segments.append(dict(id=f's{i+1:02}',start=start,end=end,raw_text=s['text'],screen_corrected_text=text,
      text_evidence=[grid(start),grid(max(start,end-.4))],timing_status='asr_segment_estimate_not_word_aligned',
      correction_basis='可见烧录字幕及章节标题；补充标点；没有完成逐字听音校正'))
assert len(segments)==len(raw['transcription'])==13
write_json('transcript-screen-corrected.json',dict(video_id=VID,status='screen_corrected_not_listening_approved',
 clock='reference_source_not_post_cut_production',segments=segments))
transcript_md = '# 对标文字校正记录\n\n原始 whisper.cpp small 转录保存在 transcript-auto.*，没有覆盖。下表按画面字幕/标题校正明显误识别，并补标点；不代表已经完成逐字听音验收。分段与时点仍是 ASR 粗估，不能用于新口播字词锚定。\n\n|源片粗时间|原始ASR|按画面校正|\n|---|---|---|\n'
for s in segments:
    transcript_md += f"|{s['start']:.1f}–{s['end']:.1f}|{s['raw_text']}|{s['screen_corrected_text']}|\n"
transcript_md += '\n主要可见误识别：成人动潮→生成动效；缺乏成→渲染成；Zdans→Seedance；串全→串成；选批→选题。知识科普在两个ASR分段之间，按画面补回，分段边界未重新对齐。\n'
(ROOT/'TRANSCRIPT.md').write_text(transcript_md)

patterns_data = [
 ('P00','真人桥接/呼吸','承接或建立可信讲述关系，没有新增需图解的信息','人物视频、字幕、字幕安全区','保留原景；进入/退出包装时恢复人物可读性','按语义段保留，不复制源片0.2秒桥接时长','不能靠卡片密度替代解释清楚'),
 ('P01','结果承诺标题','开头同时说明主题和观看收益','主标题、可选短副标题、标签、人物视频','主标题先清晰，小标签随后；整体为一个开场系统','锚定自己的结果句；按可读长度决定停留','流量/搞钱类承诺不自动继承；长小字可省略'),
 ('P02','编号章节介绍','首次引入同级工具/方法/知识点','序号、名称、短定位、可选截图、章节导航','截图/序号先进入，名称与短定位跟进，统一版式退出','锚定自己的章节引入句；标题可读后再退','单条观点不硬套编号；长标题必须避让截图'),
 ('P03','并列总览/总结网格','先给总览或结尾回看同级项目','items[]、总标题、每项短定位','背景和网格建立，同一网格可更换总结标题','总览整体进入；总结重新使用同一实体ID','网格本身不表示先后顺序或真实依赖'),
 ('P04','并列用途卡展开','一个工具或观点有多个并列用途','items[{title,icon,description}]、可选重点项','中心堆叠→展开→稳定；强调项可更亮','展开对齐类别总句，不对每个词机械弹卡','不能把顺序步骤表达成无序卡片'),
 ('P05','结论牌+演示载体','口播提出功能/结果，需要观众看到样例或过程','短结论、子点、真实媒体、可读区域、人物模式','结论层、媒体容器层、媒体内部播放分别管理；可放大进入','容器动作锚定自己的语句；媒体段需剪选，音轨另处理','网页截图不能证明已运行；对应具体例子，不拿无关页面充数'),
 ('P06','能力/需求窗口图解','讲抽象能力或需求集合，不是操作教程','主标题、需求标签、抽象窗口元素','左摘要+右窗口；内部卡/线轻微变化','按自己的能力段组织状态，不声明是真实操作','真实教程需实际操作录屏；示意图不得冒充证据'),
 ('P07','多类型能力矩阵','解释图片/视频/音频等不同载体的覆盖','类型列表、各类示例媒体、可选资产列表','先建立分类空间，再把占位替换成对应实例','替换锚定自己的具体举例；示例各有播放策略','波形示意与真实音频分开；无需每片固定四列'),
 ('P08','输入到输出的流程图','明确存在输入、处理阶段、产出关系','nodes[]、edges[]、输入输出、图标或插画','先画关系再考虑节点的强调或媒体运动','源片基本整图保持；新版本可按已对齐语义逐段强调','使用有向流程，不能用并列网格代替'),
 ('P09','结果大字缩放强调','真正的转折、关键结果或短结论','短强调文字、人物画面、安全区','大字进入→缩到完整可读→保持→右移退出','进入对齐自己的结果词，停留满足完整阅读','源片故意裁边仅为入场态；稳定态不得裁字；不要每句都用'),
 ('P10','横向生产步骤','讲有顺序的工作链路','steps[]、短标题、可选链接/强调状态','快速建立完整步骤列，保持空间顺序','入口建立全局；逐项强调另由新口播锚点决定','六个工具和五个步骤是两套关系，不能简单一对一映射'),
 ('P11','章节导航','多个同级章节需要持续位置感','chapters[]、activeChapterId、保留区','内容换章时更新当前状态，主体可共用','从自己的章节边界更新，不复制源片秒数','短片/单章可关闭；竖屏须重新排版，不压缩小字'),
 ('P12','字幕底层','口播持续','真实剪后全文、校正文字和时间、安全区','底部独立字幕层，按语句替换','最终剪后字词时间驱动；源ASR不可作为目标时间','不把字幕变化计成全新的主镜头'),
 ('P13','演示窗口斜片退出','演示结束，需要回到人物或新章节','媒体容器、退出锚点、后续画面','整个外层窗口倾斜/收窄后离场；不必复制具体3D实现','结束词或段落边界驱动','低优先级，先解决可读性；精确透视与缓动未知'),
 ('P14','结论牌细线','总结牌保持期间需要温和动态','结论牌、装饰线、可选语义进度','短线逐渐伸长，随牌统一退出','若仅装饰使用时间进度；若表达语义进度需独立锚定','源片无法证明它代表真实任务完成度'),
 ('P15','总结标签与勾','在解释后提炼一个明确判断','短标签、确认图形、判断依据','标签入场→勾出现→稳定；单独管理退出','锚定自己的总结判断，不默认重复循环','勾不能暗示未经验证的能力；源片重复勾不是必须继承的规则'),
]
patterns=[]
for pid,name,trigger,inputs,behavior,retime,limit in patterns_data:
    ev=[e['event_id'] for e in events if e['candidate_pattern_id']==pid]
    patterns.append(dict(pattern_id=pid,name=name,status='candidate_not_implemented',trigger=trigger,required_inputs=inputs,
      behavior=behavior,retiming=retime,limits=limit,evidence_events=ev,
      source_sample_count=1,stable_across_videos=False,renderer_choice='未选择；先确认结构和输入，再检索模板或生成'))
write_json('reusable-patterns.json',dict(version=.1,video_id=VID,patterns=patterns))

rules=[
 ('R01','先给价值承诺与总览，再逐章介绍，结尾重新组织为工作流',[scene_ids[i] for i in [0,2,5,27,29]],'适用于工具清单/方法合集；不是所有知识分享的统一开头'),
 ('R02','章节介绍复用身份版式；主体解释按并列、示例或流程选择不同结构',[scene_ids[i] for i in [5,9,13,16,19,24]],'仅片内六次重复观察，尚未跨片验证'),
 ('R03','需要观众看产物或操作时，把真实媒体放大并配短结论',[scene_ids[i] for i in [8,12,14,22]],'必须校验素材相关性，截图不自动证明口播主张'),
 ('R04','换结构由信息关系触发；强大字用于关键结果，而非每句话',[scene_ids[i] for i in [7,18,25,26]],'未测量流量、理解或留存效果'),
 ('R05','底字幕、章节导航、主舞台、媒体内部运动、强调与退出转场分层',[e['event_id'] for e in events if e['name'] in ['顶部章节导航','底部字幕系统','第一处斜片退出','批量制作录屏内部切换']], '避免把每一次字幕替换都算成主画面切换'),
]
write_json('candidate-style.json',dict(version=.1,status='single_reference_candidate_not_production_profile',video_id=VID,
 proposed_scope=dict(content_purpose='知识分享',content_structure='工具清单/能力介绍→工作流总结',presentation='真人口播+图解+演示',skin='暗蓝紫科技舞台+浅色流程插画'),
 stable_rule_min_videos=2,source_sample_count=1,rules=[dict(rule_id=r,title=t,evidence_events=e,limit=l,status='candidate') for r,t,e,l in rules],
 unverified=['流量/转化/留存表现','精确字体与缓动','音效与BGM设计','成片逆向无法恢复的源组件实现']))

# Keep a local byte-identical source copy so the offline page can play it.
(ROOT/'source').mkdir(exist_ok=True)
target = ROOT/'source/reference.mp4'
if not target.exists():
    shutil.copy2(SOURCE,target)
source_hash=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert hashlib.sha256(target.read_bytes()).hexdigest()==source_hash
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(SOURCE)]))
write_json('source-info.json',dict(video_id=VID,original_path=str(SOURCE),archive_path='source/reference.mp4',sha256=source_hash,
 original_unchanged=True,ffprobe=probe,transcription=dict(engine='whisper.cpp',model='small',language='zh',local=True,word_alignment=False),
 inspection=dict(method='全时段1fps概览+5fps时间带+短动作20fps抽样；查看烧录字幕，未逐字听音验收',human_approved=False)))

(ROOT/'evidence/frames').mkdir(exist_ok=True)
for at in [.8,4.8,9.4,11.4,14.8,18.2,20,24.4,30.2,33.4,37,39.6,43.8,48.4,53.4,58]:
    dest=ROOT/f'evidence/frames/{at:05.1f}s.jpg'
    if not dest.exists():
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-ss',str(at),'-i',str(SOURCE),'-frames:v','1','-q:v','2',str(dest)],check=True)

timeline='# 全片视觉时间轴\n\n所有时间都是源成片秒数、5fps抽样估计，普通边界精度约±0.2秒。短动作另有micro时间带。这里的事件不能直接搬进新口播时间线。\n\n主舞台全片覆盖；导航/字幕/内部动作/转场允许叠加。\n\n|源片时间|画面状态|进入→变化/停留→退出|口播触发与作用|\n|---|---|---|---|\n'
for e in events[:len(scenes)]:
    timeline+=f"|{e['start']:.1f}–{e['end']:.1f}|{e['name']}|{e['motion']['entrance']}；{e['motion']['hold']}；{e['motion']['exit']}|{e['spoken_text']}；推断：{e['trigger']['inferred_reason']}|\n"
timeline+='\n## 独立叠层与内部动作\n\n'
for e in events[len(scenes):]:
    timeline+=f"- **{e['start']:.2f}–{e['end']:.2f} {e['name']}**：{e['motion']['entrance']}；{e['motion']['hold']}；{e['motion']['exit']}。[{e['event_id']}]({e['assets'][0]['path']})\n"
(ROOT/'TIMELINE.md').write_text(timeline)

pattern_md='# 可复用包装候选\n\n状态：结构已拆解，组件尚未编写/渲染，尚未用新口播验证。16种候选包含主结构、字幕/导航底层和辅助动作，不能理解为已经有16套可执行模板。\n\n'
for p in patterns:
    pattern_md+=f"## {p['pattern_id']} {p['name']}\n\n- 适用语义：{p['trigger']}\n- 替换输入：{p['required_inputs']}\n- 动作结构：{p['behavior']}\n- 新口播时间适配：{p['retiming']}\n- 限制：{p['limits']}\n- 源事件：{', '.join(p['evidence_events'])}\n\n"
pattern_md+='## 后续做成真模板时的验证任务\n\n1. 使用另一条口播与另一套实体名称，不保留源秒数、源素材、源结论。\n2. 验证长标题、项数变化、人物位置和字幕安全区；16:9与9:16分别验收。\n3. 输入材料缺失时明确返回需补素材，不能把普通截图冒充操作/结果证据。\n4. 每个动作绑定新口播语义锚点；剪切变更后重新对齐。\n5. 先选一段8–12秒验证章节介绍与结论配演示的复用，再扩大；样片通过不等于整片自动化通过。\n'
(ROOT/'PACKAGING.md').write_text(pattern_md)

analysis='''# 第一步：工具清单型知识分享对标拆解

这条对标可作为 jianjipro 的“工具清单型知识分享”样本。最值得学习的是：先建立全片地图，用固定版式介绍实体，再按信息关系选择图解或演示，最后把清单收束为工作流。它的形式仍是真人口播，所以“口播”和“知识分享”不能当互斥选项。

## 证据与当前完成范围

- 源片61.3239秒，1024×576，30fps，H.264；AAC双声道。
- 原始视频未修改；归档副本哈希一致。本地转录保留原始输出，按可见字幕另存校正。
- 查看了全片1秒概览、每0.2秒时间带；四组短动作另以0.05秒采样。源时点是抽样估计，不是精确逐帧工程时间。
- 已记录主舞台全时段与独立叠层/内部动作；可复用结构为候选，未写组件、未渲染新视频。
- 未完成逐字听音、BGM/SFX独立辨识、精确字体/色值/缓动测量。音轨存在、ASR有内容不代表这些通过。
- 源片展示的工具能力属于源片主张，没有本轮实测；“流量型”是用户的目标，不是该视频已证实的流量表现。

## 它的内容与包装如何配合

|源片约时间|内容任务|包装办法|可学习的编辑逻辑|
|---|---|---|---|
|0–3.8秒|引出用途和观看收益|真人+结果大标题+早期编辑器画面|先说明结果，再给观众可见的制作情境|
|3.8–8.6秒|建立六项全片地图|六格总览+制作界面|先知道有哪几项，后续编号才有意义|
|8.6–16.2秒|介绍工具1及用途|编号卡→并列用途卡→结论+示例|身份、用途和演示是三个不同任务|
|16.2–21.8秒|介绍工具2及后期能力|编号卡→能力窗口→结论+编辑器|抽象图解和真实界面分开，底字幕持续|
|21.8–29.2秒|介绍工具3及批量用途|编号卡→代码制作录屏|需要演示，但源片的示例和口播没有完全对应|
|29.2–34.8秒|介绍工具4与媒体覆盖|编号卡→多媒体能力矩阵→具体示例|先建立类别位置，再用不同载体补实例|
|34.8–41秒|介绍工具5的中文需求|编号卡→需求窗口→结论+截图|复用第二章结构，替换主标题和需求|
|41–49.9秒|介绍工具6，解释输入到输出|编号卡→浅色流程插画→结果大字|有先后关系时换流程结构；结果用一次强强调|
|49.9–61.3秒|从六项并列走向工作流总结|原网格回归+总结标签→五步骤链|同一内容可以从实体清单变成生产顺序，关系改变时画面也改变|

## 动效不能只记录成“是什么特效”

以12.8–16.2秒为例：进入前是五张用途卡；进入后，左侧结论牌和右侧白色演示建立。右侧媒体内部继续生成图标、路径和面板；左侧底线缓慢伸长；最后左牌先退，右侧演示收窄成斜片离开。这里至少存在四个职责：结论、媒体容器、媒体内部播放、退出转场。后续换自己的口播时，应分别替换结论和示例，并重新对齐进入/退出锚点，不能把源片这一段当一个固定秒数的视频贴片。

以42.8–49.9秒为例：先用完整流程图解释“创意→分镜→生成”，整体保持较长；到结果句才切回真人，用超大文字进入、缩到可读、保持、右移退出。源片并没有逐个词弹出流程节点。可复用的是信息关系与强调优先级，逐词时点需要来自新口播。

## 分层讨论稿，尚未修改核心流程

|层|负责决定什么|这条样本对应内容|
|---|---|---|
|内容任务与组织方式|解释、清单、步骤、对比或观点；观众要理解什么|知识分享中的工具清单，结尾改成生产步骤|
|呈现方式|真人、屏幕演示、图解或混合|真人口播+屏幕展示+动效图解|
|剪辑规则|何时需要画面变化、证据、总结或呼吸|新工具先标身份；功能需图解或素材；结果句短强调|
|视觉外观|颜色、字形、舞台、边框、图标、比例|暗蓝紫科技感，青色编号，浅色插画舞台|
|可执行动效库|如何实现已确认的画面结构|编号介绍、结论配媒体、用途卡、能力矩阵、流程等候选；还未适配/渲染|

现有仓库已经区分 Editorial Grammar 与 Visual Skin，也要求先构思画面再选模板。这次更需要补明确的内容任务/结构与呈现方式，而不是仅把模板库按“口播库/知识库”复制两份。不同链路可以共用底层动效能力，同时有各自的规则与默认外观。这里是依据本例的设计建议，尚未成为运行配置。

## 这条样本中需要优化的地方

1. **演示与例子对应。** 23.2–28.9秒口播提排行榜和周报，画面更多在展示六工具介绍预览。它有制作情境，但没有直接展示这几个结果；新片应补对应结果或明确只是制作方式示意。
2. **长标题与截图避让。** 29.6–30.6秒 Generative Media 名称与右侧截图挤在一起，长名称不能按短名称固定排版。
3. **阅读负担。** 网格、仓库小字和顶部导航在源分辨率就偏小；竖屏直接缩放更难读。应优先保主信息，不要求观众读完全部网页细节。
4. **真人空间。** 大演示常覆盖人物。需按目的选择全屏演示或明确人物安全区，不默认“背景保留人物”就等于人物清楚。
5. **总结关系。** 六格回归能回顾内容，但没有直接表达六工具如何协作。需要关系理解时，可增加清楚的有向流程，不只贴一个勾。
6. **无新增信息的重复动作。** 54秒附近绿色勾重复出现，没有看到新语义。新模板默认一次表达即可，避免为动而动。

## 第一步的交接边界

可以交接：源证据、全片视觉时间轴、16类包装候选、5条剪辑规则候选、素材与语义锚点需求。

不能当作交接成功的内容：已生成动画、已建立正式风格、已完成新口播自动套用、已验证流量或音效设计。

下一步宜先把这条链路的编辑规则写清：在“工具清单型知识分享”里，每类语义什么时候保持真人、什么时候用图解、什么时候必须要真实演示。规则确认后，再选一个8–12秒片段做可替换内容的模板样片，检验分层是否真的降低交付负担。

## 文件导航

- [互动拆解页](review.html)：原视频、逐事件拆解、包装候选、证据时间带。
- [全片时间轴](TIMELINE.md)：主舞台与独立动作。
- [包装候选及输入](PACKAGING.md)：后续复用需要什么。
- [文字校正记录](TRANSCRIPT.md)：原始ASR与按画面修正对照。
- [结构化事件](reference-events.yaml)、[候选规则](candidate-style.json)：供后续工具读取，仍是候选状态。
'''
(ROOT/'ANALYSIS.md').write_text(analysis)

# A standalone review artifact; it doesn't change jianjipro's product workbench.
payload=json.dumps(dict(events=events,patterns=patterns,scenes=scene_ids,segments=segments),ensure_ascii=False).replace('</','<\\/')
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>知识分享 · 对标拆解</title>
<style>:root{color-scheme:dark;font-family:system-ui,-apple-system,sans-serif;background:#0b1220;color:#e7edf7}*{box-sizing:border-box}body{margin:0}header{padding:24px 28px;border-bottom:1px solid #29374b}h1{font-size:25px;margin:0 0 9px}p{line-height:1.65}small,.muted{color:#a5b5cb}header p{margin:0}main{display:grid;grid-template-columns:minmax(400px,1.15fr) minmax(390px,1fr);gap:22px;padding:22px 28px}.player{position:sticky;top:18px;align-self:start}video{width:100%;border-radius:12px;background:black}button,a{color:#a9dbff}button{cursor:pointer;background:#16273d;border:1px solid #354760;border-radius:8px;padding:9px 12px;font-size:14px}button:hover,button.active{background:#22496c;border-color:#70c1ef}nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.box{padding:16px;border:1px solid #2c3b51;border-radius:12px;background:#111e30;margin-bottom:14px}.box h2,.box h3{margin:0 0 12px}.box h2{font-size:19px}.box h3{font-size:16px}.row{display:block;width:100%;text-align:left;margin:7px 0;line-height:1.5}.row span{display:block;color:#a5b5cb;font-size:12px}.badge{display:inline-block;padding:3px 8px;border-radius:20px;background:#2d3440;color:#c7d0db;font-size:12px}.detail dt{color:#8ed5ff;font-size:13px;margin-top:13px}.detail dd{margin:4px 0;line-height:1.7}.evidence{width:100%;height:auto;border-radius:8px}.tab{display:none}.tab.active{display:block}.pattern p{margin:8px 0}.fine{font-size:13px}footer{padding:20px 28px;border-top:1px solid #29374b;color:#a5b5cb}@media(max-width:900px){main{display:block;padding:16px}.player{position:static}header{padding:20px}} </style>
<header><h1>知识分享 · 第一条对标拆解</h1><p>工具清单 → 能力与示例 → 工作流总结 <span class="badge">规则与模板候选</span></p></header>
<main><section class="player"><video id="video" controls preload="metadata" src="source/reference.mp4"></video><nav><button id="segment">播放所选片段</button><button id="pause">暂停</button><span id="clock" class="muted">源片时钟</span></nav><div id="detail" class="box"></div><div class="box fine"><strong>审阅范围</strong><p>源片 61.3 秒 · 1024×576 · 30fps。时点为抽样估计，普通边界约±0.2秒；声音与逐字听音未验收。候选结构尚未生成动画或套用到新口播。</p><a href="ANALYSIS.md">完整分析</a> · <a href="TIMELINE.md">时间轴</a> · <a href="PACKAGING.md">复用输入</a> · <a href="TRANSCRIPT.md">转录对照</a></div></section>
<section><nav id="tabs"><button data-tab="timeline" class="active">逐事件拆解</button><button data-tab="patterns">16类包装候选</button><button data-tab="evidence">原帧证据</button><button data-tab="transcript">文字校正</button></nav>
<div id="timeline" class="tab active"><p class="muted fine">点击事件定位原视频。主舞台与独立动作分开，动作时段允许重叠。</p><div id="mainrows"></div><h2>独立叠层与内部动作</h2><div id="overlays"></div></div>
<div id="patterns" class="tab"></div><div id="evidence" class="tab"><p class="muted fine">5fps全时段观察；短动作另有20fps时间带。点击图片可查看原尺寸。</p></div><div id="transcript" class="tab"></div></section></main><footer>这是源成片分析档案。自身口播需重新抽取最终字幕和字词时间；源秒数不会自动成为目标视频动作时间。</footer>
<script>const DATA=__PAYLOAD__;const $=id=>document.getElementById(id);const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');const v=$('video');let selected=DATA.events[0],playEnd=null;
function select(e){selected=e;v.pause();playEnd=null;v.currentTime=e.start;$('detail').innerHTML=`<h2>${esc(e.name)}</h2><span class="badge">${e.start.toFixed(2)}–${e.end.toFixed(2)} 秒 · ${esc(e.track)}</span><dl class="detail"><dt>口播锚点</dt><dd>${esc(e.spoken_text)}</dd><dt>可见画面</dt><dd>${esc(e.visual.layout.description)}</dd><dt>进入</dt><dd>${esc(e.motion.entrance)}</dd><dt>变化与停留</dt><dd>${esc(e.motion.hold)}</dd><dt>退出</dt><dd>${esc(e.motion.exit)}</dd><dt>作用 · 推断</dt><dd>${esc(e.trigger.inferred_reason)}</dd><dt>复用候选</dt><dd>${esc(e.candidate_pattern_id)} · 需要替换内容并重新对齐</dd></dl><a href="${esc(e.assets[0].path)}">对应源片时间带</a>`;if(window.innerWidth<900)window.scrollTo({top:0,behavior:'smooth'});}
DATA.events.forEach(e=>{let b=document.createElement('button');b.className='row';b.innerHTML=`${e.start.toFixed(2)}–${e.end.toFixed(2)} · ${esc(e.name)}<span>${esc(e.spoken_text)}</span>`;b.onclick=()=>select(e);$(e.track==='main-stage'?'mainrows':'overlays').appendChild(b)});
$('segment').onclick=()=>{v.currentTime=selected.start;playEnd=selected.end;v.play().catch(()=>{})};$('pause').onclick=()=>{v.pause();playEnd=null};v.ontimeupdate=()=>{$('clock').textContent=v.currentTime.toFixed(2)+' / '+(Number.isFinite(v.duration)?v.duration.toFixed(2):'61.32')+' 秒';if(playEnd!==null&&v.currentTime>=playEnd){const stopAt=playEnd;playEnd=null;v.pause();v.currentTime=stopAt}};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab));document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b))});
DATA.patterns.forEach(p=>{let d=document.createElement('article');d.className='box pattern';d.innerHTML=`<h2>${esc(p.pattern_id)} ${esc(p.name)}</h2><span class="badge">候选 · 未实现</span><p><b>何时用：</b>${esc(p.trigger)}</p><p><b>替换输入：</b>${esc(p.required_inputs)}</p><p><b>动作结构：</b>${esc(p.behavior)}</p><p><b>新口播适配：</b>${esc(p.retiming)}</p><p><b>限制：</b>${esc(p.limits)}</p>`;const b=document.createElement('button');b.textContent='查看一个源片例子';b.onclick=()=>select(DATA.events.find(e=>e.event_id===p.evidence_events[0]));d.appendChild(b);$('patterns').appendChild(d)});
for(let n=1;n<=13;n++){let at=(n-1)*5,path=`evidence/dense/001-0_000s-61_200s-p${String(n).padStart(3,'0')}.jpg`;let d=document.createElement('div');d.className='box';d.innerHTML=`<h3>${at}–${Math.min(at+5,61.32).toFixed(2)} 秒</h3><a href="${path}"><img loading="lazy" class="evidence" src="${path}" alt="源片 ${at} 秒起的时间带"></a>`;$('evidence').appendChild(d)}
for(const [name,path] of [['编辑器斜片退出','001-screen-exit.jpg'],['制作界面退出','002-studio-exit.jpg'],['大字缩放细节','003-result-emphasis.jpg'],['绿色勾重复动作','004-check-repeat.jpg']]){let d=document.createElement('div');d.className='box';let src='evidence/micro/'+path;d.innerHTML=`<h3>短动作 · ${name}</h3><a href="${src}"><img loading="lazy" class="evidence" src="${src}" alt="${name} 时间带"></a>`;$('evidence').appendChild(d)}
DATA.segments.forEach(s=>{let d=document.createElement('div');d.className='box';d.innerHTML=`<h3>${s.start.toFixed(1)}–${s.end.toFixed(1)} 秒</h3><p class="muted">原始ASR：${esc(s.raw_text)}</p><p>按画面校正：${esc(s.screen_corrected_text)}</p><small>ASR粗时间；尚未逐字听音确认</small>`;$('transcript').appendChild(d)});select(selected);</script></html>'''
(ROOT/'review.html').write_text(page.replace('__PAYLOAD__',payload))

# Validate evidence references and temporal continuity, not the aesthetic result.
assert scenes[0][0]==0 and scenes[-1][1]==DURATION
assert all(a[1]==b[0] for a,b in zip(scenes,scenes[1:]))
assert len({e['event_id'] for e in events})==len(events)
for e in events:
    assert 0<=e['start']<e['end']<=DURATION
    for a in e['assets']:
        assert (ROOT/a['path']).is_file()
assert all(p['evidence_events'] for p in patterns)
assert len(list((ROOT/'evidence/dense').glob('*.jpg')))==13
assert SOURCE.stat().st_size==target.stat().st_size
write_json('validation.json',dict(status='structural_checks_passed',event_count=len(events),main_stage_count=len(scenes),pattern_count=len(patterns),
 checks=['主舞台从0覆盖至源片结束，无时间间隙','所有事件时间合法，事件ID唯一','所有事件引用的时间带存在','所有包装候选可追溯到源事件','源视频与归档副本SHA256一致','13段ASR均保留并提供画面校正对照'],
 not_checked=['逐字听音验收','BGM/SFX辨识','精确逐帧边界','动画组件实现和新口播适配','目标竖屏版式','人类审阅确认']))
print(json.dumps(dict(events=len(events),main_stages=len(scenes),patterns=len(patterns),source_sha256=source_hash),ensure_ascii=False))
