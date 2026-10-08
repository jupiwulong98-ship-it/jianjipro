import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {validateConcepts,validatePlanningChain} from '../scripts/style-contract.mjs';
import {reviewRhythm,assertRhythmGate} from '../scripts/rhythm-review.mjs';
import {sampleTimes,extractRhythmFrames} from '../scripts/rhythm-frames.mjs';
import {resolvePlan} from '../runtime-talkcraft/core.mjs';

const concept=(structure='one_to_many')=>({event_id:'visual-a',source_segment_ids:['a'],start:0,end:10,
  spoken_text:'一次搭好，以后换内容参数反复生成。',meaning:'复用',visual_concept:'母模板向多个视频复制',
  visual_structure:structure,structure_description:'1 -> N',visual_focus:'一次投入、多次复用',
  presentation:'either',real_asset_need:'none',asset_description:'',importance:'high',evidence_need:'none',
  claim_status:'speaker_claim',fallback:{strategy:'generated_motion',description:'保留母模板向多产物的复制关系'}});
const visualPlan=(structure='one_to_many')=>({project_id:'test',visual_contract_version:'0.1',fps:30,width:1920,height:1080,
  visual_concepts:{project_id:'test',concepts:[concept(structure)]},shots:[{id:'a',start_frame:0,duration_frames:300,
    presentation_mode:'full_screen',visual_concept_ids:['visual-a'],visual_structure:structure,
    primary_motion_request:{family:'process',subtype:'process-map',content:{steps:[{no:'1',txt:'模板'},{no:'2',txt:'视频'}]}}}]});
const shot=(i, overrides={})=>({id:`s${i}`,start:i*5,end:(i+1)*5,visual_structure:'clean_presenter',
  presentation_mode:'presenter_safe',clean_presenter:true,importance:.8,
  rhythm:{layout:'same_host',visual_intensity:'low',visual_subject:'presenter',motion_strength:'none',
    information_change:'text_only',visualizable:true,...overrides}});
const book=shots=>({project_id:'test',fps:30,duration:shots.at(-1).end,shots});
const types=p=>reviewRhythm(p).issues.map(i=>i.type);

test('画面概念拒绝模板泄漏、错时间和不存在的语义来源',()=>{
  const doc={project_id:'test',concepts:[concept()]};assert.doesNotThrow(()=>validateConcepts(doc));
  assert.throws(()=>validateConcepts({...doc,concepts:[{...concept(),visual_concept:'用 talkcraft:numbered-step-stack'}]}),/不得指定卡片/);
  assert.throws(()=>validateConcepts({...doc,concepts:[{...concept(),fallback:{...concept().fallback,card_id:'a'}}]}),/不得包含/);
  assert.throws(()=>validateConcepts(doc,{project_id:'test',segments:[]}),/不存在/);
  assert.throws(()=>validateConcepts({...doc,concepts:[{...concept(),end:0}]}),/时间范围/);
});
test('1 -> N 不硬套流程卡；需要生成且原概念完整保留',()=>{
  const source=visualPlan(), original=structuredClone(source);
  const result=resolvePlan(source);
  assert.equal(result.shots[0].resolution.status,'needs_generation');
  assert.equal(result.shots[0].resolution.primary_card,null);
  assert.deepEqual(result.shots[0].generated_motion_request.visual_concept,concept());
  assert.deepEqual(source,original);
});
test('真正步骤流程可解析；同卡不能把时间线处理伪装成普通步骤',()=>{
  assert.equal(resolvePlan(visualPlan('sequence')).shots[0].resolution.primary_card,'talkcraft:numbered-step-stack');
  assert.equal(resolvePlan(visualPlan('input_process_output')).shots[0].resolution.status,'needs_generation');
});
test('跨层改写关系、漏概念、静默clean fallback都被阻止',()=>{
  const a=visualPlan();a.shots[0].visual_structure='sequence';assert.throws(()=>resolvePlan(a),/结构被改写/);
  const b=visualPlan();delete b.visual_concepts;assert.throws(()=>resolvePlan(b),/缺少/);
  const c=visualPlan();c.shots[0].clean_presenter=true;assert.throws(()=>resolvePlan(c),/静默跳过/);
});
test('人物静态跨多个镜头累计；新认知状态会中断而小文字变化不会',()=>{
  const p=book([shot(0),shot(1),shot(2)]);
  const issue=reviewRhythm(p).issues.find(i=>i.type==='long_static_presenter');
  assert.deepEqual([issue.start,issue.end,issue.severity],[0,15,'high']);
  p.shots[1].rhythm.information_change='new_state';assert.ok(!types(p).includes('long_static_presenter'));
});
test('换模板或family不掩盖同构图、同信息结构重复',()=>{
  const shots=[0,1,2].map(i=>({...shot(i,{layout:'three_columns',visual_subject:'diagram',information_change:'new_state',visual_intensity:'medium'}),
    clean_presenter:false,visual_structure:'parallel',primary_motion_request:{family:['list','comparison','entity'][i]},resolution:{primary_card:`different-${i}`}}));
  assert.ok(types(book(shots)).includes('repeated_layout'));assert.ok(types(book(shots)).includes('repeated_structure'));
});
test('网页缓推重复和人物/网页机械循环分别被定位',()=>{
  const screens=[0,1,2].map(i=>shot(i,{visual_subject:'screen',layout:'page_push',information_change:'new_state'}));
  screens.forEach(s=>{s.clean_presenter=false;s.visual_structure='single_focus';s.presentation_mode='full_screen';});
  assert.ok(types(book(screens)).includes('repeated_screen_layout'));
  const alternating=[0,1,2,3,4,5].map(i=>shot(i,{visual_subject:i%2?'screen':'presenter',layout:i%2?'page_push':'host',information_change:'new_state'}));
  assert.ok(types(book(alternating)).includes('mechanical_cycle'));
  alternating[3].rhythm.layout='focus_callout';assert.ok(!types(book(alternating)).includes('mechanical_cycle'));
});
test('缺少呼吸和密度集中可检出；并非要求每3秒变化',()=>{
  const shots=[0,1,2,3].map(i=>shot(i,{visualizable:false}));
  for(const i of [4,5,6,7]) shots.push(shot(i,{visual_intensity:'high',motion_strength:'high',information_change:'new_state',layout:`layout-${i}`,visual_subject:'diagram'}));
  const all=types(book(shots));assert.ok(all.includes('overpacked'));assert.ok(all.includes('uneven_density'));
  const quiet=book([{...shot(0,{visualizable:false}),end:20}]);
  assert.ok(!types(quiet).includes('overpacked'));assert.ok(!types(quiet).includes('uneven_density'));
  assert.equal(reviewRhythm(quiet).issues.find(i=>i.type==='long_static_presenter').severity,'low');
});
test('呼吸中断连续强包装；完整clean镜头无需画面概念',()=>{
  const shots=[shot(0,{visual_intensity:'high'}),shot(1),shot(2,{visual_intensity:'high'}),shot(3,{visual_intensity:'high'})];
  assert.ok(!types(book(shots)).includes('overpacked'));
  const p={...visualPlan(),visual_concepts:{project_id:'test',concepts:[]},shots:[{id:'a',start_frame:0,duration_frames:300,presentation_mode:'presenter_safe',clean_presenter:true}]};
  assert.equal(resolvePlan(p).shots[0].resolution.status,'clean_presenter');
});
test('空缺、重叠、未知标注不能获得假的节奏通过',()=>{
  assert.ok(types(book([shot(1)])).includes('timeline_gap'));
  const p=book([shot(0)]);p.shots[0].clean_presenter=false;p.shots[0].rhythm={};
  assert.ok(types(p).includes('insufficient_rhythm_metadata'));
  assert.throws(()=>reviewRhythm(book([shot(0),{...shot(1),start:3}])),/非重叠/);
  assert.throws(()=>reviewRhythm(book([shot(0)]),{policy:{density_window_seconds:0}}),/policy/);
});
test('Gate B保留理由绑定报告；改时间后旧签核失效',()=>{
  const p=book([shot(0),shot(1),shot(2)]),report=reviewRhythm(p);
  assert.throws(()=>assertRhythmGate(p),/缺失或过期/);
  p.rhythm_review={timeline_digest:report.timeline_digest,decisions:report.issues.map(i=>({issue_id:i.issue_id,decision:'accepted_context',reason:'这段保留真实讲解和信息消化'}))};
  assert.equal(assertRhythmGate(p).status,'pass_with_context');
  p.shots[0].implementation_notes='改为额外强调和转场';assert.throws(()=>assertRhythmGate(p),/过期/);delete p.shots[0].implementation_notes;
  p.shots[2].end=20;p.duration=20;assert.throws(()=>assertRhythmGate(p),/过期/);
});
test('整片均匀抽样包含镜头内部和结尾；D不能自动当成视觉通过',()=>{
  const p=book([{...shot(0),end:30}]),times=sampleTimes(p,4);
  assert.ok(times.length>=9);assert.ok(times.at(-1)>29);assert.ok(times.includes(21.6));
  assert.throws(()=>sampleTimes(p,0),/正数/);
  const noIssue=book([shot(0,{information_change:'new_state'})]);
  assert.equal(reviewRhythm(noIssue,{stage:'rendered'}).status,'needs_visual_review');
});
test('真实AI工具项目的规划链验证，复用与处理流程都不降级成旧卡',()=>{
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../projects/ai-tools-real-20260930');
  const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const semantic=read('semantic-map.json'),concepts=read('visual-concepts.json'),edit=read('edit-plan.json'),shots=read('shotbook.json');
  assert.equal(validatePlanningChain(semantic,concepts,edit,shots).status,'pass');
  const result=resolvePlan({...shots,visual_concepts:concepts});
  for(const id of ['scene-05','scene-06','scene-10'])assert.equal(result.shots.find(s=>s.id===id).resolution.status,'needs_generation');
  assert.equal(result.shots.find(s=>s.id==='scene-05').visual_structure,'one_to_many');
  assert.equal(result.shots.find(s=>s.id==='scene-10').visual_structure,'input_process_output');
  assert.equal(result.shots.find(s=>s.id==='scene-15').resolution.status,'resolved');
  const changed=structuredClone(edit);changed.events[0].motion_request.visual_structure='parallel';
  assert.throws(()=>validatePlanningChain(semantic,concepts,changed,shots),/改写/);
});

test('真实FFmpeg抽帧保留不同源seek后的透明包装，不能只抽到人物',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'jianjipro-中文抽帧-'));
  const run=args=>execFileSync('ffmpeg',['-v','error','-y',...args],{stdio:'pipe'});
  const publicDir=path.join(root,'sample/remotion/public'),outDir=path.join(root,'sample/remotion/out');
  fs.mkdirSync(publicDir,{recursive:true});fs.mkdirSync(outDir,{recursive:true});fs.mkdirSync(path.join(root,'sample/remotion/src'),{recursive:true});
  try {
    run(['-f','lavfi','-i','color=c=blue:s=320x180:r=30:d=3','-c:v','libx264',path.join(publicDir,'source-normalized.mp4')]);
    const overlay=path.join(outDir,'AI剪辑工具怎么选-多版式包装-v2.mov');
    run(['-f','lavfi','-i','color=c=red:s=320x180:r=30:d=2,format=yuva444p10le','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le',overlay]);
    fs.writeFileSync(path.join(root,'sample/remotion/src/cuts.json'),JSON.stringify([{from:0,frames:60,sourceFrame:7}]));
    const p={project_id:'test',fps:30,duration_frames:60,shots:[{...shot(0),end:2}]};
    const dest=path.join(root,'frames');
    const result=extractRhythmFrames(p,{legacyProject:root,out:dest});
    assert.equal(result.source_kind,'historical_v2_reconstructed_composites');assert.equal(result.status,'needs_visual_review');
    assert.ok(result.samples.length>=4);
    for(const sample of result.samples) {
      const rgb=execFileSync('ffmpeg',['-v','error','-i',path.join(dest,sample.file),'-vf','format=rgb24,crop=2:2:100:100','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
      assert.ok(rgb[0]>200 && rgb[2]<50, '包装红色丢失，抽到蓝色底片：多输入时间戳没有对齐');
    }
    assert.throws(()=>extractRhythmFrames(p,{video:overlay,out:path.join(root,'bad')}),/透明包装层/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
