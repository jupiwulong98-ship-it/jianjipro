import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {listPlanningProjects,loadPlanningProject,savePlanningReview,validatePlanning,planningApiPlugin} from '../scripts/planning-projects.mjs';

function fixture() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'jianjipro-planning-'));
  const directory=path.join(root,'new-video');fs.mkdirSync(path.join(directory,'transcript'),{recursive:true});
  const transcript={revision:'transcript-1',data_validation:'pass',source:{time_basis:'edited_timeline'},
    segments:[{words:[{id:'w1',text:'输入',start:1,end:2},{id:'w2',text:'结果',start:3,end:4}]}]};
  const plan={transcript_revision:'transcript-1',title:'新片子',scenes:[{id:'s1',title:'输入到结果',mode:'visual',source_word_ids:['w1','w2'],
    viewer_goal:'理解处理关系',initial_state:'只有输入',final_state:'出现结果',reason:'解释关系',materials:'使用示意',actions:[{word_id:'w2',description:'显示输出'}]}]};
  const write=(file,data)=>fs.writeFileSync(path.join(directory,file),JSON.stringify(data));
  write('transcript/final-transcript.json',transcript);write('visual-planning.json',plan);
  return {root,directory,transcript,plan,write,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
function candidate(f) {
  fs.mkdirSync(path.join(f.directory,'reference-20s/validation'),{recursive:true});
  fs.writeFileSync(path.join(f.directory,'reference-20s/reference.mp4'),'0123456789');
  fs.writeFileSync(path.join(f.directory,'reference-20s/validation/frame-295.png'),'poster');
  const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
  f.write('reference-20s/preview.json',{status:'candidate',transcript_revision:'transcript-1',scene_ids:['s1'],scene_hash:hash(JSON.stringify(f.plan.scenes)),video_sha256:hash('0123456789')});
}
test('实际候选只绑定自身策划，修改策划或视频内容后旧预览隐藏',()=>{
  const f=fixture();try {
    candidate(f);assert.ok(loadPlanningProject('new-video',f.root).reference_sample);
    f.plan.scenes[0].initial_state='已变化';f.write('visual-planning.json',f.plan);
    assert.equal(loadPlanningProject('new-video',f.root).reference_sample,null);
    candidate(f);assert.ok(loadPlanningProject('new-video',f.root).reference_sample);
    fs.writeFileSync(path.join(f.directory,'reference-20s/reference.mp4'),'changed');
    assert.equal(loadPlanningProject('new-video',f.root).reference_sample,null);
  } finally {f.cleanup();}
});
test('候选媒体支持浏览器分段播放，错误范围和失效候选被拒绝',async()=>{
  const f=fixture();candidate(f);let middleware;planningApiPlugin(f.root).configureServer({middlewares:{use(fn){middleware=fn;}}});
  const server=http.createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/api/planning-projects/new-video/reference.mp4`;
  try {
    const partial=await fetch(url,{headers:{Range:'bytes=2-5'}});
    assert.equal(partial.status,206);assert.equal(partial.headers.get('content-range'),'bytes 2-5/10');assert.equal(await partial.text(),'2345');
    assert.equal((await fetch(url,{headers:{Range:'bytes=20-'}})).status,416);
    assert.equal((await fetch(url,{method:'HEAD'})).headers.get('content-length'),'10');
    f.plan.scenes[0].reason='new reason';f.write('visual-planning.json',f.plan);
    assert.equal((await fetch(url)).status,404);
  } finally {await new Promise(resolve=>server.close(resolve));f.cleanup();}
});
test('新项目自动发现，全文与动作时间沿用字词而非提案时间',()=>{
  const f=fixture();try {
    assert.equal(listPlanningProjects(f.root)[0].id,'new-video');
    f.plan.scenes[0].start=999;f.plan.scenes[0].text='伪造';f.plan.scenes[0].actions[0].start=999;f.write('visual-planning.json',f.plan);
    const p=loadPlanningProject('new-video',f.root);
    assert.equal(p.scenes[0].text,'输入结果');assert.equal(p.scenes[0].start,1);assert.equal(p.scenes[0].actions[0].start,3);
  } finally {f.cleanup();}
});
test('缺失、重复、乱序字词或段外动作均阻断确认',()=>{
  const f=fixture();try {
    for(const ids of [['w1'],['w1','w1','w2'],['w2','w1']]) {
      const plan=structuredClone(f.plan);plan.scenes[0].source_word_ids=ids;
      assert.throws(()=>validatePlanning(plan,f.transcript));
    }
    const plan=structuredClone(f.plan);plan.scenes[0].actions[0].word_id='missing';
    assert.throws(()=>validatePlanning(plan,f.transcript),/本段原文字词/);
    plan.scenes[0].actions[0]={word_id:'w1',cue_word_ids:['w2'],description:'显示输出'};
    assert.throws(()=>validatePlanning(plan,f.transcript),/连续引用/);
  } finally {f.cleanup();}
});
test('全文尚无策划时可以读全文，但不能确认',()=>{
  const f=fixture();try {
    fs.unlinkSync(path.join(f.directory,'visual-planning.json'));
    const p=loadPlanningProject('new-video',f.root);assert.equal(p.scenes.length,0);
    assert.throws(()=>savePlanningReview(p.id,{binding:p.binding,revision:0,shotId:'s1',action:'status',status:'approved'},f.root),/先完成/);
  } finally {f.cleanup();}
});
test('包装预览规则兼容旧稿，但未知规则或与呈现方式矛盾时阻断',()=>{
  const f=fixture();try {
    assert.equal(validatePlanning(f.plan,f.transcript)[0].packaging_rule,undefined);
    f.plan.scenes[0].packaging_rule='input_process_output';
    assert.equal(validatePlanning(f.plan,f.transcript)[0].packaging_rule,'input_process_output');
    f.plan.scenes[0].packaging_rule='unknown';
    assert.throws(()=>validatePlanning(f.plan,f.transcript),/包装规则不存在/);
    f.plan.scenes[0].packaging_rule='clean_presenter';
    assert.throws(()=>validatePlanning(f.plan,f.transcript),/包装规则与呈现方式不一致/);
    f.plan.scenes[0].mode='clean';
    assert.equal(validatePlanning(f.plan,f.transcript)[0].packaging_rule,'clean_presenter');
  } finally {f.cleanup();}
});
test('策划 JSON 写错仍可阅读剪后全文，并阻断确认',()=>{
  const f=fixture();try {
    fs.writeFileSync(path.join(f.directory,'visual-planning.json'),'{broken');
    const p=loadPlanningProject('new-video',f.root);
    assert.match(p.plan_error,/无法解析/);assert.equal(p.transcript.revision,'transcript-1');assert.deepEqual(p.scenes,[]);
  } finally {f.cleanup();}
});
test('策划改变不继承旧确认，历史文件保留；旧页面提交被拒绝',()=>{
  const f=fixture();try {
    const first=loadPlanningProject('new-video',f.root);
    savePlanningReview(first.id,{binding:first.binding,revision:0,shotId:'s1',action:'status',status:'approved'},f.root);
    f.plan.scenes[0].final_state='更新后结果';f.write('visual-planning.json',f.plan);
    const next=loadPlanningProject(first.id,f.root);assert.notEqual(next.binding,first.binding);assert.deepEqual(next.review.shots,{});
    assert.equal(fs.readdirSync(path.join(f.directory,'planning-reviews')).length,1);
    assert.throws(()=>savePlanningReview(first.id,{binding:first.binding,revision:1,shotId:'s1',action:'comment',text:'旧意见'},f.root),e=>e.status===409);
  } finally {f.cleanup();}
});
test('相同全文重新采集只更新采集时间，不丢失有效确认',()=>{
  const f=fixture();try {
    const p=loadPlanningProject('new-video',f.root);
    savePlanningReview(p.id,{binding:p.binding,revision:0,shotId:'s1',action:'status',status:'approved'},f.root);
    f.transcript.captured_at='2026-10-03T01:00:00Z';f.write('transcript/final-transcript.json',f.transcript);
    const next=loadPlanningProject(p.id,f.root);assert.equal(next.binding,p.binding);assert.equal(next.review.shots.s1.status,'approved');
  } finally {f.cleanup();}
});
test('全文版本改变后旧策划不可确认；即使 revision 未更新也不沿用旧确认',()=>{
  const f=fixture();try {
    const p=loadPlanningProject('new-video',f.root);
    savePlanningReview(p.id,{binding:p.binding,revision:0,shotId:'s1',action:'status',status:'approved'},f.root);
    f.transcript.segments[0].words[0].start=.9;f.write('transcript/final-transcript.json',f.transcript);
    assert.deepEqual(loadPlanningProject(p.id,f.root).review.shots,{});
    f.transcript.revision='transcript-2';f.write('transcript/final-transcript.json',f.transcript);
    const next=loadPlanningProject(p.id,f.root);assert.match(next.plan_error,/重新策划/);assert.equal(next.scenes.length,0);
  } finally {f.cleanup();}
});
test('意见读回、冲突与未处理意见阻断确认复用已有存储规则',()=>{
  const f=fixture();try {
    const p=loadPlanningProject('new-video',f.root);
    const request={binding:p.binding,revision:0,shotId:'s1',action:'comment',text:'先看输入'};
    const review=savePlanningReview(p.id,request,f.root);
    assert.equal(loadPlanningProject(p.id,f.root).review.shots.s1.comments[0].text,'先看输入');
    assert.throws(()=>savePlanningReview(p.id,request,f.root),e=>e.status===409);
    assert.throws(()=>savePlanningReview(p.id,{...request,revision:review.revision,action:'status',status:'approved'},f.root),/先标记/);
  } finally {f.cleanup();}
});
test('非法项目路径与仓库外文件不能读取或写入',()=>{
  const f=fixture();try {
    assert.throws(()=>loadPlanningProject('../new-video',f.root));
    const outside=path.join(f.root,'outside.json');fs.writeFileSync(outside,'{}');
    fs.unlinkSync(path.join(f.directory,'visual-planning.json'));fs.symlinkSync(outside,path.join(f.directory,'visual-planning.json'));
    assert.throws(()=>loadPlanningProject('new-video',f.root),/路径无效/);
  } finally {f.cleanup();}
});
test('本机 HTTP 接口可以保存和读回，跨站与无效请求被拒绝',async()=>{
  const f=fixture();let middleware;planningApiPlugin(f.root).configureServer({middlewares:{use(fn){middleware=fn;}}});
  const server=http.createServer((req,res)=>middleware(req,res,()=>{res.statusCode=404;res.end();}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/api/planning-projects/new-video`;
  try {
    const p=await (await fetch(url)).json();const body=JSON.stringify({binding:p.binding,revision:0,shotId:'s1',action:'comment',text:'接口测试'});
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body})).status,403);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain'},body})).status,415);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body})).status,200);
    assert.equal((await (await fetch(url)).json()).review.shots.s1.comments[0].text,'接口测试');
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body})).status,409);
  } finally {await new Promise(resolve=>server.close(resolve));f.cleanup();}
});

test('完整候选保留真实标题与时长，不再固定标为前20秒',()=>{
 const f=fixture();try {candidate(f);const file=path.join(f.directory,'reference-20s/preview.json');const sample=JSON.parse(fs.readFileSync(file));sample.title='完整动效候选';sample.duration_seconds=149.166667;fs.writeFileSync(file,JSON.stringify(sample));const loaded=loadPlanningProject('new-video',f.root).reference_sample;assert.equal(loaded.title,'完整动效候选');assert.equal(loaded.duration_seconds,149.166667);}finally{f.cleanup();}
});
