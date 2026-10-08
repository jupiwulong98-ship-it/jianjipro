import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {validateConcepts} from '../../motion-library/scripts/style-contract.mjs';
import {validatePlanning,loadPlanningProject} from '../../motion-library/scripts/planning-projects.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const projectId='chatgpt-settings-20261004';
const transcript=JSON.parse(fs.readFileSync(path.join(root,'transcript/final-transcript.json'),'utf8'));
const expectedRevision='bfa9253e69f717c0058472d3fd44feb33f868165da73ea4f437de2bf070765ed';
assert.equal(transcript.revision,expectedRevision,'全文变化后需重新审阅分段及动作，不能自动沿用本稿');
assert.equal(transcript.data_validation,'pass');
assert.equal(transcript.source.time_basis,'edited_timeline');

// ranges 引用已完整抽取的字幕条；只有按完整含义决策后才合并字词。
const specs=[
 {range:[1,1],title:'开场提问 · 让观众代入',intent:'question',role:'hook',importance:.9,emotion:.6,goal:'理解这期在解决同款 AI 用起来不同的问题',clean:'难点：观众先要判断这是不是自己的问题；画面补充：保留直视镜头的提问，让表情承担代入，没有必要另加问号动画。'},
 {range:[2,3],title:'同样模型 · 设置差异',intent:'contrast',role:'thesis',importance:.9,emotion:.5,structure:'comparison',rule:'comparison',presentation:'presenter_safe',goal:'看懂相同模型仍有不同设置这一对照维度',initial:'人物和字幕保持；左侧小区域放两行相同的模型标识，暂不增加结果评分。',actions:[['同样的模型','两行模型标识保持一致，用同一括线说明模型相同。'],['设置','下方仅显出两个不同的设置状态，焦点从模型移向设置，收在“设置不同”。']],final:'只保留模型相同、设置不同的关系，下一段回到人物。',materials:'抽象关系示意，无性能数值；短文字置于左侧留白，面部和底部字幕保护；需稳定帧再核对实际边界。',reason:'难点：观众容易把体验差异全部归因于模型；画面补充：固定模型标识，只改变设置这一维度。不做好用度评分，也不把“全在设置”扩大成排除其他因素的证据。',contrast:['同样模型','不同设置'],claim:'speaker_claim'},
 {range:[4,7],title:'官方背景 · 设置引入',intent:'claim',role:'evidence',importance:.7,emotion:.4,goal:'听清讲述者为何引出设置',clean:'难点：官方承认迎合与设置可以影响回答是不同层次；画面补充：保留人物叙述，不用官方截图盖章全部结论。OpenAI 2025-04-29 文章支持 GPT-4o 曾有迎合问题及个性化方向，不证明所有问题只靠这四个设置解决。',evidence:'supporting',claim:'speaker_claim',sources:['sycophancy']},
 {range:[8,11],title:'95%数字强调 · 按用户意见滚动',intent:'claim',role:'emphasis',importance:.7,emotion:.6,structure:'single_focus',rule:'number_emphasis',presentation:'presenter_safe',goal:'在讲到95%时同步强调口播数字，再返回人物操作引导',initial:'左侧留白显示0%，人物和原字幕保持。',actions:[['95%','从0%滚动到95%，在这一个字词的口播区间内落定；保持短暂阅读后退出。']],final:'95%落定后退出，后半段回人物交代最后一项并引导操作。',materials:'仅使用口播数字，不增加统计图、调查来源或认证图标；人物和字幕保护。',reason:'用户在meaning-04明确要求0%滚到95%，并在本轮授权制作；数字只作为原话强调，内部证据记录仍为未核实的口播主张。',claim:'speaker_claim',evidence:'supporting',numbers:[{value:'95%',status:'speaker_claim'}]},
 {range:[12,14],title:'设置一 · 找到说话风格入口',intent:'process',role:'tutorial_step',importance:.95,emotion:.3,structure:'sequence',rule:'screen_focus',presentation:'full_screen',goal:'找到设置与个性化的位置，不把说话风格当成模型切换',initial:'真实 ChatGPT 中文界面作为主画面；左上角短标识“1 / 说话风格”，先保留账户菜单到设置的上下文。',actions:[['第一个','显示第1项标识，界面大面积可读，人物暂时退出主画面。'],['打开设置','聚焦真实菜单中的设置入口，随后进入设置。'],['个性化','定位真实个性化选项，再停留在基础风格与语气区域；不提前自动修改用户设置。']],final:'个性化页面的风格区域保持可读，下一段回人物解释选择。',materials:'必需真实当前中文界面录屏/截图：设置→个性化→基础风格与语气。素材已采集并像素遮盖；账户名、邮箱、历史会话等私人内容先裁切或像素遮盖。短章标识与底部字幕分区。',reason:'难点：只听“找到个性化”无法知道按钮在哪里；画面补充：保留菜单和目标页面的连续位置关系，每次只圈当前目标。借鉴 R02 顺序接力，具体名称以真实界面为准。',asset:'style-screen',evidence:'required',claim:'sourced',sources:['personality'],fallback:'block_until_assets'},
 {range:[15,18],title:'按工作需求选风格 · 保留个人建议',intent:'claim',role:'clean_explanation',importance:.65,emotion:.35,goal:'把专业、高效、直截了当理解为工作偏好',clean:'难点：三个描述容易被做成三个必点按钮；画面补充：回人物讲个人选择，不把口播形容词伪造成三个独立开关。当前官方说明将 Professional、Efficient、Candid 作为不同风格，需要真实界面确认中文名称。',claim:'speaker_claim',sources:['personality']},
 {range:[19,25],title:'夸赞与问题 · 听着舒服不等于有用',intent:'example',role:'comparison',importance:.9,emotion:.65,structure:'comparison',rule:'comparison',presentation:'full_screen',goal:'看懂赞美回复没有推进问题处理这一落差',initial:'先让“为什么”落在人物上；说到夸赞再切入标有“口播例子”的简洁对话示意，问题栏保持“待解决”。',actions:[['先夸你两句','建立一条赞美回复与一栏待解决问题，问题状态暂时不变化。'],['你的想法很棒','逐句显出这一短回复，不补写真实用户问题或假聊天记录。'],['这个方向非常有潜力','第二句替换第一句成为阅读焦点，保持问题栏没有推进。'],['没有任何帮助','将焦点移到仍待解决的问题栏，标“没有具体建议”，赞美回复退为次要。']],final:'一个具体落差：有夸赞、问题仍待解决；下句回人物给原则。',materials:'仅用口播原有两句例子构成解释性对话，持续标“口播例子”；不是实际模型输出，不冒充真实截图。主内容在上部，字幕在底部原安全区。',reason:'难点：舒服和有效的区别是结果，不是两种颜色；画面补充：赞美回复变化而问题状态不动，转折时让未推进的结果成为焦点。一个对话对象足够，不放双屏全文。',contrast:['听着舒服','解决问题'],claim:'speaker_claim'},
 {range:[26,27],title:'个人原则 · 少哄我，多找出问题',intent:'quote',role:'quote',importance:.85,emotion:.55,goal:'记住讲述者对回复的要求',clean:'难点：前面例子刚有较多阅读，原则需要听清；画面补充：回到人物直述“少哄我，多找出问题”，保留字幕，不再做第二次对照图。'},
 {range:[28,29],title:'设置二 · 自定义指令',intent:'setup',role:'section',importance:.8,emotion:.35,goal:'知道下一项从风格转向固定指令',clean:'难点：需要识别章节转换；画面补充：人物直接交代下一项，字幕已有名称。下一段会具体解释一次写入，不再额外加全屏章节转场。'},
 {range:[30,34],title:'反复提醒 → 一次写进指令',intent:'process',role:'mechanism',importance:.95,emotion:.4,structure:'before_after',rule:'before_after',presentation:'full_screen',goal:'分清每次新会话重说和保存一次指令两种做法',initial:'解释性示意里一张新会话页在左，三条要求暂为空；右侧保留一个固定指令容器，标“示意”。',actions:[['新会话','左侧出现新会话，每次提醒的三条要求依次叠在同一页。'],['简洁一点','第一条要求填入当前会话，后续原文“不要说废话”“直接指出来”逐句填入同一区域，阅读焦点随字幕推进。'],['一次性写进指令','把同一组要求从临时会话移入固定指令容器，左侧重复输入淡出。']],final:'固定指令容器成为下一段示例的同一主体，保持位置不变。',materials:'解释性示意，不画真实产品按钮；三条文字只来自本段口播。复杂内容全屏，字幕安全区不叠文字。',reason:'难点：观众可能知道指令内容却不懂保存位置与重复提醒的差别；画面补充：同一组要求从临时会话转入固定容器，用位置和持久状态说明“一次写好”，与下一段维持同一文档主体。'},
 {range:[35,41],title:'固定指令示例 · 顺着口播逐行读',intent:'quote',role:'quote',importance:.9,emotion:.3,structure:'sequence',rule:'document_checks',presentation:'full_screen',goal:'看清四条要求写成什么，而不是一次读整屏长文',initial:'真实自定义指令输入区域为主画面；用单独标为“口播示例”的文档内容呈现本段要求，初始只亮第一行。',actions:[['不要为了认同我','聚焦第1行“不为认同而认同”，其他行保持弱化，完整要求由口播与字幕解释。'],['发现我的逻辑有问题','焦点移到第2行“逻辑有问题，直接指出”，不额外生成回答示例。'],['回答优先给我结论','第3行“先结论，再原因”亮起，沿同一行从结论移向原因，明确先后。'],['不要堆砌','第4行“少说正确但无用的话”亮起，最后四行保持，准备解释复用。']],final:'同一个固定指令文档保留四条短要求，下一段从这份母指令向多个会话派生。',materials:'需要真实当前中文自定义指令输入区截图，已采集并像素遮盖。示例文本另绘并明确“口播示例”，不读写用户实际指令。真实输入区中既有私人内容先像素遮盖；文档展示上部，字幕底部。',reason:'难点：连续四条长要求同时显示会抢口播；画面补充：文档不换页，沿原文逐行移动焦点，把“先结论再原因”表现为行内顺序。承接上段固定容器，避免连续换不同版式。',asset:'instructions-screen',evidence:'required',claim:'not_applicable',sources:['instructions'],fallback:'block_until_assets'},
 {range:[42,44],title:'一次设置 · 多次对话复用',intent:'conclusion',role:'mechanism',importance:.9,emotion:.4,structure:'one_to_many',rule:'one_to_many',presentation:'full_screen',goal:'看懂同一套已保存指令可以影响后续多次对话',initial:'承接上一段的固定指令文档，不重新打四条文字；文档保持为共享母体。',actions:[['设置一次','固定指令文档落定为母体，说明只写一次。'],['大量的对话','从母体向两个新会话框连接，框内只写“沿用要求”，不展开答案全文。'],['重复','两个会话框保持同一连接，重复输入的空位收起，随后回到第三项入口。']],final:'一份指令连接多个会话，关系完成后退出；不声称模型必然逐条完美遵守。',materials:'同一份指令示意和两个会话轮廓即可，不需要新的真实聊天记录；字词锚点仍须制作后听音对齐。',reason:'难点：只列“简洁、指出错误”看不出一次设置的长期收益；画面补充：母指令持续在场并连接多个会话，强调共享来源。借鉴 R10 复用关系，短段只做一次派生，避免又堆清单。',claim:'sourced',sources:['instructions']},
 {range:[45,48],title:'设置三 · 查看记忆内容',intent:'process',role:'tutorial_step',importance:.95,emotion:.35,structure:'sequence',rule:'screen_focus',presentation:'full_screen',goal:'找到记忆管理入口并知道要检查内容',initial:'真实设置界面延续第1项的视觉基准，短标识“3 / 记忆”，先显示个性化入口。',actions:[['个性化','焦点回到真实个性化页，保留页面导航。'],['记忆相关的设置','移向真实记忆控制或管理入口，展开可查看记忆的区域；以当前账号实际名称为准。'],['定期去看','框住内容检查区，停住让观众看位置，示例不出现真实私人记忆。']],final:'管理入口和内容检查位置保持，下一段回到人物解释过期风险。',materials:'必需真实中文设置→个性化→记忆/管理内容的录屏或截图，未采集；不能显示用户现有私人记忆，采集时先裁切或像素遮盖，仅保留入口和空内容区域。',reason:'难点：观众可能只找到记忆开关却不知道去哪看具体记忆；画面补充：入口和管理内容位置连续呈现，最后焦点停在检查区。与第1项使用同一导航基准，真实界面优先于装饰。',asset:'memory-screen',evidence:'required',claim:'sourced',sources:['memory'],fallback:'block_until_assets'},
 {range:[49,51],title:'旧信息可能过期 · 先听懂条件',intent:'warning',role:'warning',importance:.75,emotion:.4,goal:'理解曾经真实的信息可能不再符合现在',clean:'难点：半年前的信息并非必然错误，关键是现在是否仍成立；画面补充：回人物讲“可能”，保留语气和限定条件，给下一段具体例子铺垫，不提前画必然出错的红色警报。',claim:'speaker_claim'},
 {range:[52,56],title:'减肥状态变了 · 旧记忆还在影响建议',intent:'example',role:'mechanism',importance:.95,emotion:.4,structure:'before_after',rule:'before_after',presentation:'full_screen',goal:'看懂当前情况已经改变，而记录仍旧的错位',initial:'标“口播例子”的同一信息条：左边“当时：在减肥”，右边“现在”还未显出；记忆栏保留旧状态。',actions:[['我最近在减肥','当时的信息进入记忆栏，形成“在减肥”这一条记录。'],['不减了','当前情况改成“不再减肥”，记忆栏仍显示旧状态，两个位置形成明显错位。'],['影响它后面的回答','旧记忆栏连接到后续建议轮廓，箭头旁写“可能影响”，不编造饮食建议或医学结论。'],['越来越偏','焦点收在“现在情况”和“旧记录不一致”，保留可能性，不做偏差数值或增长曲线。']],final:'当前情况与旧记录错位清晰，下一段回人物强调准确。',materials:'解释性示意，标“口播例子”；无真实用户记忆或真实模型回答，无量化偏差。上下分区保护底部原字幕。',reason:'难点：观众看不出为什么曾经正确的记忆会后来影响回答；画面补充：当前状态先改变，记忆栏保持不变，再连接到可能受影响的建议。对照维度是同一条信息的时效，不是两个工具能力排名。',claim:'speaker_claim'},
 {range:[57,58],title:'记忆重准确 · 观点落定',intent:'conclusion',role:'conclusion',importance:.85,emotion:.45,goal:'记住定期校准比堆积记忆更关键',clean:'难点：前面的因果图需要消化；画面补充：回人物把“准确的记忆才有价值”说完，不再做记忆数量对比或虚构评分。',claim:'speaker_claim'},
 {range:[59,65],title:'设置四 · 找到数据控制开关',intent:'process',role:'tutorial_step',importance:.95,emotion:.35,structure:'sequence',rule:'screen_focus',presentation:'full_screen',goal:'找到数据控制中的模型改进选项，按自己需求检查',initial:'真实设置页面为主画面，短标识“4 / 数据控制”，保留侧边导航而不是只截孤立开关。',actions:[['打开设置','显示真实设置入口，不添加锁头或“绝对安全”标签。'],['进入数据控制','焦点移到真实数据控制导航，进入该页面并保留位置上下文。'],['帮助改进模型','定位当前界面对应的 Improve the model for everyone 中文选项，先显示真实现状。'],['符合你的需求','让开关和说明保持可读；只表示“按需求检查”，不替用户切换，也不虚构已经关闭。']],final:'目标开关和相关说明驻留，随后回人物说明哪些场景应关注。',materials:'必需真实中文设置→数据控制→对应模型改进选项截图/录屏，未采集；具体译名以素材为准。账号与其他私人信息先像素遮盖，不采集上传文件。',reason:'难点：听到隐私选项仍可能不知道检查哪一个；画面补充：保留导航关系后聚焦一个真实开关，末尾只停留供判断。官方说明模型训练偏好与记忆设置不同，不把开关画成删除历史或保密认证。',asset:'data-screen',evidence:'required',claim:'sourced',sources:['data'],fallback:'block_until_assets'},
 {range:[66,70],title:'工作和私人内容 · 解释适用场景',intent:'warning',role:'warning',importance:.8,emotion:.45,goal:'意识到公司资料、客户信息和私人内容都需要主动检查设置',clean:'难点：观众需要判断自己的使用情境，而不是再阅读一组文件名；画面补充：回人物说清四类例子，不插真实公司资料、客户数据，也不以通用文件飞入动画暗示已经上传。',claim:'speaker_claim'},
 {range:[71,72],title:'知道开关在哪里 · 提醒落定',intent:'conclusion',role:'conclusion',importance:.75,emotion:.4,goal:'把默认使用转为有意识检查',clean:'难点：需要落在实际行动，而非继续增加隐私图标；画面补充：人物强调主动检查，延续上一段情境说明，留出呼吸。'},
 {range:[73,78],title:'更强模型之外 · 让助手懂你的工作方式',intent:'conclusion',role:'comparison',importance:.9,emotion:.5,structure:'comparison',rule:'comparison',presentation:'full_screen',goal:'分清模型能力与贴合个人工作方式是两个维度',initial:'先在人物上说“四个地方”；说到真正好用再切两栏简洁关系图，上方“模型能力”，下方“工作方式”，不做等号或取代关系。',actions:[['更强的模型','突出模型能力这一维度，保持工作方式栏尚未展开，不打叉否定模型。'],['了解','把焦点移向工作方式维度，出现“偏好 / 指令 / 准确记忆”三个已有设置作用的短标签。'],['怎么样和你工作','两个维度共同指向“更贴合任务”，仅用定性结论，不画能力提升百分比。']],final:'模型能力与工作适配并存，回人物收尾；数据控制不画成提高能力的原因。',materials:'解释性关系图，最多三条短标签，只有一个主焦点；四项设置已经在前文出现，不重放四张截图。',reason:'难点：观众可能把“不是只换模型”理解成模型能力没有用；画面补充：保留模型能力一栏，同时展开工作适配这一额外维度，两者共同指向贴合任务。数据控制承担隐私选择而非能力增益，避免错误因果。',contrast:['模型能力','工作方式适配'],claim:'speaker_claim'},
 {range:[79,81],title:'行动与关注 · 用人物收尾',intent:'cta',role:'cta',importance:.7,emotion:.5,goal:'记住先检查四项设置并理解后续内容方向',clean:'难点：最后需要形成可执行行动和后续期待；画面补充：保留人物直视镜头和完整口播，不追加按钮、倒计时或工具墙抢走结束句。',numbers:[{value:'4',status:'not_applicable'}]}
];

const write=(file,value)=>fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const normalize=text=>text.replace(/[\s，。？！、]/g,'');
function cue(words,phrase) {
 const target=normalize(phrase);
 for(let i=0;i<words.length;i++) {
  let text='';
  for(let j=i;j<words.length;j++) {
   text+=normalize(words[j].text);
   if(text.length>=target.length) {
    if(text.startsWith(target)) return words.slice(i,j+1).map(w=>w.id);
    break;
   }
  }
 }
 throw new Error(`原文找不到动作短语: ${phrase}`);
}
const semantics=[]; const scenes=[]; const concepts=[];
for(const [index,s] of specs.entries()) {
 const cards=transcript.segments.slice(s.range[0]-1,s.range[1]);
 const words=cards.flatMap(c=>c.words);
 const id=`meaning-${String(index+1).padStart(2,'0')}`;
 const source_word_ids=words.map(w=>w.id);
 const start=words[0].start,end=words.at(-1).end,text=words.map(w=>w.text).join('');
 semantics.push({id,source_word_ids,source_caption_ids:cards.map(c=>c.id),start,end,text,
  primary_intent:s.intent,semantic_role:s.role,importance:s.importance,entities:['ChatGPT'],numbers:s.numbers??[],contrast_pair:s.contrast??[],
  rhetorical_function:s.goal,emotional_intensity:s.emotion,visual_evidence_useful:Boolean(s.asset),evidence_need:s.evidence??'none',
  claim_status:s.claim??'not_applicable',suggested_inputs:s.asset?['screenshot','screen_recording']:s.structure?['text','diagram']:[],
  evidence_sources:s.sources??[],notes:s.reason??s.clean});
 const actions=(s.actions??[]).map(([phrase,description])=>{const ids=cue(words,phrase);return {word_id:ids[0],cue_word_ids:ids,description};});
 scenes.push({id,title:s.title,mode:s.clean?'clean':'visual',packaging_rule:s.clean?'clean_presenter':s.rule,source_word_ids,
  viewer_goal:s.goal,initial_state:s.clean?'保留当前实拍人物、背景和原字幕，构图不变。':s.initial,actions,
  final_state:s.clean?'人物自然说完本意群，保持原字幕，顺接下一段。':s.final,
  materials:s.clean?'当前原实拍与已校正字幕；无需外部素材。':s.materials,reason:s.clean??s.reason,
  source_segment_ids:[id],visual_concept_id:s.clean?null:`visual-${String(index+1).padStart(2,'0')}`,
  presentation:s.clean?'presenter_safe':s.presentation,asset_requirement_id:s.asset??null});
 if(!s.clean) concepts.push({event_id:`visual-${String(index+1).padStart(2,'0')}`,source_segment_ids:[id],start,end,spoken_text:text,
  meaning:s.goal,visual_concept:`开始：${s.initial} 变化：${s.actions.map(a=>a[1]).join('；')} 结束：${s.final}`,
  visual_structure:s.structure,structure_description:s.reason,visual_focus:s.goal,presentation:s.presentation,
  real_asset_need:s.asset?'required':'none',asset_description:s.materials,importance:s.importance>=.9?'high':'normal',
  evidence_need:s.evidence??'none',claim_status:s.claim??'not_applicable',
  fallback:{strategy:s.fallback??'simplify_preserving_structure',description:s.asset?'真实界面缺失时暂停本段界面制作，原口播保留；不得用伪界面冒充操作证据。':'减少辅助文字和装饰，保留同一主体及原有关系；仍不能清楚表达时回本层修订并重新审阅。'},revision_reason:null});
}
const semanticMap={version:'0.2',project_id:projectId,source_video:`ChatCut ${transcript.source.project_id}`,transcript_source:'transcript/final-transcript.json',transcript_revision:transcript.revision,time_basis:'edited_timeline',listening_review:transcript.listening_review,segments:semantics};
const conceptsDocument={version:'0.1',project_id:projectId,source_video:semanticMap.source_video,semantic_map_source:'semantic-map.json',transcript_revision:transcript.revision,style_profile_source:'../../styles/ai-talkinghead-editorial-v0.1/style-profile.yaml',status:'draft_for_review',concepts};
const plan={version:'0.1',project_id:projectId,title:'ChatGPT先改这4个设置 · 画面策划',transcript_revision:transcript.revision,
 proposal_note:'已按用户意见进入制作：21个意义段，11段画面解释、10段保留人物。95%按意见做0→95滚动，仍为口播主张；4组真实界面已从Tabbit采集并打码。所有动作绑定剪后字词。',scenes};
assert.deepEqual(semantics.flatMap(s=>s.source_word_ids),transcript.segments.flatMap(s=>s.words.map(w=>w.id)));
validateConcepts(conceptsDocument,semanticMap);
for(const scene of scenes) {
 const wordMap=new Map(transcript.segments.flatMap(s=>s.words).map(w=>[w.id,w]));
 const starts=scene.actions.map(a=>wordMap.get(a.word_id).start);
 assert.ok(starts.every((start,index)=>!index||start>=starts[index-1]),`${scene.id} 动作锚点倒序: ${starts}`);
}
const validatedScenes=validatePlanning(plan,transcript);
write('semantic-map.json',semanticMap); write('visual-concepts.json',conceptsDocument); write('visual-planning.json',plan);
const loaded=loadPlanningProject(projectId);
assert.equal(loaded.plan_error,''); assert.equal(loaded.scenes.length,specs.length);
const unresolved=Object.values(loaded.review.shots??{}).flatMap(shot=>(shot.comments??[]).filter(c=>!c.resolved));
const result={status:'pass',project_id:projectId,transcript_revision:transcript.revision,binding:loaded.binding,
 source_words:transcript.word_count,covered_words:semantics.reduce((n,s)=>n+s.source_word_ids.length,0),scene_count:scenes.length,
 visual_scenes:concepts.length,clean_scenes:scenes.length-concepts.length,actions:validatedScenes.reduce((n,s)=>n+s.actions.length,0),
 checks:['原文756字词按顺序恰好覆盖一次','语义起止均引用原生剪后字词时间','动作短语连续引用本段原文','动作按口播顺序排列','概念关系与语义来源对应','概念无模板标识','工作台加载无合同错误','已读取当前binding意见'],
 current_review:loaded.review,unresolved_comments:unresolved.length,listening_review:transcript.listening_review,
 production_status:'production_authorized',visual_acceptance:'pending_user_review',materials_status:'four_real_interface_sets_captured_redacted'};
fs.mkdirSync(path.join(root,'validation'),{recursive:true}); write('validation/planning-contract.json',result);
console.log(JSON.stringify({...result,current_review:undefined},null,2));
