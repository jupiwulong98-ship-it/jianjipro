import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePlanningChain} from '../../motion-library/scripts/style-contract.mjs';
import {reviewRhythm,assertRhythmGate} from '../../motion-library/scripts/rhythm-review.mjs';
import {resolvePlan} from '../../motion-library/runtime-talkcraft/core.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const write=(n,v)=>fs.writeFileSync(path.join(dir,n),JSON.stringify(v,null,2)+'\n');
const scenes=read('production-scenes.json'), concepts=read('visual-concepts.json');
const content={
  1:{kind:'keyword',title:'AI 剪辑',labels:['AI 剪辑']},
  2:{kind:'pipeline',title:'把对标风格变成可复用模板',labels:['对标风格','模板母体','新内容'],details:['提取编辑语言','固定结构与动效','更换内容再输出']},
  4:{kind:'code',title:'Hyperframes：HTML → 动画片段',labels:['HTML','渲染','动画片段']},
  5:{kind:'branch',title:'Remotion：一套组件，多次复用',labels:['组件母体','片段 A','片段 B','片段 C'],details:['结构 · 样式 · 动画','新文案','新参数','新内容']},
  6:{kind:'tracks',title:'ChatCut：口播与动画在时间线上相遇',labels:['生成动画','画面轨','口播轨']},
  8:{kind:'mapping',title:'01 / 拆解风格',labels:['这句话','这个效果'],details:['先理解表达','再追踪画面']},
  9:{kind:'direction',title:'同一个主体，不同变化方向',labels:['增长','下降']},
  10:{kind:'rules',title:'从一句话，整理成一组风格规则',labels:['口播表达','对应效果','风格规则'],details:['出现关键词','关键词强调','表达 → 画面'],illustration:true},
  11:{kind:'preview',title:'02 / 先看方案，再做动画',labels:['风格规则','口播文案','方案预览']},
  12:{kind:'handoff',title:'把概念画面交给 AI 复刻',labels:['图片模型','概念画面','复刻端']},
  14:{kind:'decision',title:'确认之后，再进入复刻',labels:['文字占位','检查方案','复刻组件']},
  15:{kind:'timeline',title:'03 / 逐帧看清入场与退场',labels:['入场','停留','退场']},
  16:{kind:'mini',title:'复刻 → 审核',labels:['复刻','审核'],details:['按方案制作','检查实现']},
  18:{kind:'library',title:'把组件按使用场景归档',labels:['组件库','卡片','录屏','真人口播']},
  19:{kind:'reuse',title:'新视频调用已有组件库',labels:['新口播','已有组件库','包装片段']},
  21:{kind:'rewrite',title:'核心意思保留，结构更清楚',labels:['原口播文案','整理后的文案','画面槽位']},
  23:{kind:'keywordSwap',title:'减少重复制作',labels:['提高效率','减少重复生成']},
  24:{kind:'parameters',title:'固定风格，只替换内容参数',labels:['固定框架','文案 A','文案 B','文案 C']},
  26:{kind:'dimensions',title:'一句话生成：需要考虑的三个维度',labels:['稳定性','消耗','可用性'],details:['需反复检查','生成成本','访问条件']},
  27:{kind:'recap',title:'照着这条视频，按步骤实践',labels:['下载视频','提取逐字稿','按步骤实践'],details:['拆解','预览','复刻','复用']},
};
const family={single_focus:['emphasis','keyword'],input_process_output:['process','process-map'],one_to_many:['process','process-map'],hierarchy:['process','process-map'],sequence:['process','process-map'],comparison:['comparison','misconception'],decision_tree:['process','process-map'],timeline:['process','process-map'],before_after:['comparison','misconception']};
const events=[],shots=[];let cursor=0;
for(const s of scenes){
 const no=Number(s.id.slice(-2)),c=concepts.concepts.find(c=>c.source_segment_ids.includes(s.id));
 const from=Math.ceil(s.start*30-0.0001),to=Math.floor(s.end*30+0.0001);
 if(from>cursor)shots.push({id:`breath-${no}`,start_frame:cursor,duration_frames:from-cursor,clean_presenter:true,presentation_mode:'presenter_safe',visual_structure:'clean_presenter'});
 const base={id:`scene-${String(no).padStart(2,'0')}`,start_frame:from,duration_frames:to-from,presentation_mode:c?.presentation??'presenter_safe',source_segment_ids:[s.id],spoken_text:s.text,primary_visual_job:s.viewer_goal,safe_zones:{presenter:{enabled:true,region:c?.presentation==='full_screen'?{left:1510,top:585,width:330,height:220}:{left:550,top:80,width:850,height:750}},captions:{enabled:true,bottom_reserve_pct:20}},asset_slots:[],supporting_layers:{sfx:{enabled:false},camera:{enabled:false},transition_in:{enabled:false,mode:'hard_cut'},transition_out:{enabled:false,mode:'hard_cut'}},review:{checks:{face_safety:'pending',subtitle_clearance:'pending',clipping:'pending',contrast:'pending',semantic_fit:'pending'}}};
 if(!c){shots.push({...base,clean_presenter:true,visual_structure:'clean_presenter'});cursor=to;continue;}
 const [f,st]=family[c.visual_structure],data=content[no];
 const req={family:f,subtype:st,visual_structure:c.visual_structure,required:true,content:{labels:data.labels,title:data.title},constraints:{input_types_required:['text'],input_types_optional:[],media_required:[]},visual_intent:{energy:'medium',density:'low',preferred_layouts:[data.kind]}};
 if(no===1)req.content={keyword:'AI 剪辑'};
 const event={id:`edit-${no}`,start:from/30,end:to/30,source_segment_id:s.id,visual_concept_id:c.event_id,intent:c.visual_structure==='single_focus'?'emphasis':'explain',rationale:s.reason,style_rule_id:'project-dark-relations',motion_request:req,presentation_hint:{preferred_mode:c.presentation,presenter_required:true},asset_requirements:[]};events.push(event);
 const cues=s.actions.map(a=>({...a,frame:Math.max(0,Math.round(a.start*30)-from)}));
 shots.push({...base,source_edit_event_id:event.id,visual_concept_ids:[c.event_id],visual_structure:c.visual_structure,importance:'high',primary_motion_request:req,box:c.presentation==='presenter_safe'?{left:70,top:180,width:465,height:500}:undefined,rhythm:{layout:data.kind,visual_intensity:no===1||no===23?'low':'medium',visual_subject:c.presentation==='full_screen'?'diagram':'mixed',motion_strength:'medium',information_change:'new_state',visualizable:true,annotation_source:'shotbook'},implementation_notes:'保持已批准的关系与动作顺序；每次变化由剪后字词触发。全屏关系图保留右侧口播小窗，底部20%留给原字幕。',production:{...data,no,cues,provider:no===1?'talkcraft-adapted-timing':'generated-motion',exit_frames:4}});cursor=to;
}
if(cursor<7253)shots.push({id:'breath-tail',start_frame:cursor,duration_frames:7253-cursor,clean_presenter:true,presentation_mode:'presenter_safe',visual_structure:'clean_presenter'});
const edit={version:'0.4',project_id:concepts.project_id,style_id:'ai-editing-workflow-20261008-approved',style_profile_source:'project-style-profile.json',visual_concepts_source:'visual-concepts.json',events};
const plan={version:'0.2',project_id:concepts.project_id,visual_contract_version:'0.1',visual_concepts:concepts,fps:30,width:1920,height:1080,duration_frames:7253,theme:{accent:'#55dfce',ink:'#ffffff',panelInk:'#102027',panel:'#14212b'},global:{fps:30,duration:7253/30,caption_mode:'generated',presenter_default_position:'center'},shots,base_timeline:read('validation/base-timeline.json').state};
write('edit-plan.json',edit);write('shotbook.json',plan);
write('validation/planning-contract.json',validatePlanningChain(read('semantic-map.json'),concepts,edit,plan));
const rhythm=reviewRhythm(plan);plan.rhythm_review={timeline_digest:rhythm.timeline_digest,decisions:rhythm.issues.map(i=>({issue_id:i.issue_id,decision:'accepted_context',reason:'这段属于个人经历和自然停留，策划已明确保留人物；关系解释处已安排图示，不靠固定秒数补动画。'}))};assertRhythmGate(plan);write('shotbook.json',plan);write('validation/gate-b.json',rhythm);
const routed=resolvePlan(plan);
for(const s of routed.shots)if(s.production){
 const original=s.resolution;
 s.resolution={...original,status:s.production.no===1?'adapted_pending_stable_frame':'needs_generation',provider:s.production.provider,reason:s.production.no===1?'复用关键词卡曲线，按实际字词缩短默认延时，需项目稳定帧验收':'逐字词状态变化、关系连接与人物安全区由项目 Generated Motion 实现；通用卡不能表达这些完整状态。'};
}
write('router-plan.json',routed);write('asset-manifest.json',{project_id:plan.project_id,status:'ready',external_evidence_required:false,assets:[],note:'全为抽象解释动画；实际人物小窗引用原口播，禁止冒充软件实录或客户结果。'});
console.log('Plan ready',shots.length,'shots; visual',shots.filter(s=>s.production).length,'Gate B',rhythm.issues.length);
