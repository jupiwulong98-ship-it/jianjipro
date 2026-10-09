import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadReferenceStyle,newStyleSelection,recommendReferenceStyle} from '../scripts/reference-style.mjs';
import {bindReferencePattern,validateReferenceMotionRequest} from '../scripts/reference-motion-bindings.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const fixtures=path.join(root,'motion-library/tests/fixtures');
const loaded=()=>loadReferenceStyle(root,'styles/codex-six-skills-tech-v0.3/style-package.json');
const read=id=>JSON.parse(fs.readFileSync(path.join(fixtures,'reference-'+id+'.json'),'utf8'));

test('V0.3保留V0.2视觉契约并正式加入P04',()=>{
 const x=loaded();
 assert.equal(x.style.art_direction_contract,1);
 assert.ok(x.style.rules.some(r=>r.id==='P04'));
 assert.equal(x.patterns.get('P04').evidence_events.length,2);
});
test('P02/P04/P13映射到确定的可执行Remotion组件并保留真实参考事件',()=>{
 const x=loaded();
 for(const [id,name] of [['P02','ReferenceChapter'],['P04','ReferenceCardFan'],['P13','ReferenceWindowExit']]){
  const request=read(id.toLowerCase());
  const binding=validateReferenceMotionRequest(request,x);
  assert.equal(binding.component,name);
  assert.equal(binding.status,'render_request_valid');
  assert.ok(binding.reference_events.includes(request.reference_event));
  assert.ok(fs.existsSync(path.join(root,binding.module)));
 }
});
test('不允许把没有实现的参考规则降级为任意蓝底TalkCraft卡',()=>{
 const x=loaded(),p=bindReferencePattern({loaded:x,patternId:'P06'});
 assert.equal(p.status,'needs_reference_implementation');
 assert.throws(()=>bindReferencePattern({loaded:x,patternId:'P999'}),/不包含/);
});
test('旧V0.2不能偷偷使用P04，新包需要显式迁移',()=>{
 const old=loadReferenceStyle(root,'styles/codex-six-skills-tech-v0.2/style-package.json');
 assert.throws(()=>bindReferencePattern({loaded:old,patternId:'P04'}),/不包含/);
});
test('真实媒体P02/P13拒绝缺文件的请求或未声明来源',()=>{
 const x=loaded(),r=read('p02');
 delete r.props.mediaSrc;
 assert.throws(()=>validateReferenceMotionRequest(r,x),/缺少必须参数/);
 const q=read('p13');
 q.media_provenance='qa_synthetic';q.output_purpose='published';
 assert.throws(()=>validateReferenceMotionRequest(q,x),/QA演示素材/);
});
test('参考证据事件不匹配必须中止；不能只有P编号',()=>{
 const x=loaded(),p=read('p04');
 p.reference_event='codex-six-skills-20261008-e001';
 assert.throws(()=>validateReferenceMotionRequest(p,x),/引用不属于/);
});
test('P04拒绝空卡和超过4个，P09保留已有执行实现',()=>{
 const x=loaded(),p=read('p04');
 p.props.items=[];
 assert.throws(()=>validateReferenceMotionRequest(p,x),/2~4/);
 const b=bindReferencePattern({loaded:x,patternId:'P09'});
 assert.equal(b.component,'TechResultPunch');
});
test('V0.3真实style:reference --validate命令能够生成production brief（回归缺参错误）',()=>{
 const project=fs.mkdtempSync(path.join(os.tmpdir(),'jianji-reference-test-'));
 try{
  const concepts={project_id:'bridge-test',concepts:[{event_id:'v1',spoken_text:'三个工具的用途',
    visual_structure:'parallel',meaning:'并列用途',visual_focus:'用途分类',
    real_asset_need:'none',evidence_need:'none'}]};
  fs.writeFileSync(path.join(project,'visual-concepts.json'),JSON.stringify(concepts));
  const cli=path.join(root,'motion-library/scripts/reference-style-cli.mjs');
  execFileSync(process.execPath,[cli,'--project',project],{stdio:'pipe'});
  const selection=JSON.parse(fs.readFileSync(path.join(project,'style-selection.json'),'utf8'));
  selection.decisions[0]={concept_id:'v1',decision:'use_reference',pattern_id:'P04',
    medium:'diagram',reason:'明确有三类独立用途',
    background_mode:'light_explainer',visual_media_kind:'diagram',media_evidence:'illustration_declared'};
  fs.writeFileSync(path.join(project,'style-selection.json'),JSON.stringify(selection));
  const ref={package_id:selection.package_id,pattern_id:'P04',medium:'diagram'};
  const art={background_mode:'light_explainer',visual_media_kind:'diagram',media_evidence:'illustration_declared'};
  fs.writeFileSync(path.join(project,'edit-plan.json'),JSON.stringify({events:[{id:'e1',visual_concept_id:'v1',style_reference:ref,art_direction:art}]}));
  fs.writeFileSync(path.join(project,'shotbook.json'),JSON.stringify({shots:[{id:'s1',clean_presenter:false,
    visual_concept_ids:['v1'],style_reference:ref,art_direction:art,asset_slots:[]}]}));
  execFileSync(process.execPath,[cli,'--project',project,'--validate'],{stdio:'pipe'});
  const brief=JSON.parse(fs.readFileSync(path.join(project,'style-production-brief.json'),'utf8'));
  assert.equal(brief.shots.length,1);
  assert.equal(brief.shots[0].reference_motion_binding.component,'ReferenceCardFan');
  assert.equal(brief.art_direction_audit.status,'pass');
 } finally {fs.rmSync(project,{force:true,recursive:true});}
});
