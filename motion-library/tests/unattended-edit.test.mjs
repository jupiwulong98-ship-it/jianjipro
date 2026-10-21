import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {resolveProject,insideProject,loadEvidence,buildStoryboard,validateWorkflow,runBatch} from '../scripts/unattended-edit.mjs';

function setup() {
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jianjipro-auto-'));
  const project=path.join(tmp,'sample');fs.mkdirSync(path.join(project,'transcript'),{recursive:true});
  fs.mkdirSync(path.join(project,'production/assets'),{recursive:true});
  const transcript={revision:'v1',source:{time_basis:'edited_timeline'},segments:[{words:[{id:'w1',text:'看',start:0,end:0.5},{id:'w2',text:'证据',start:0.5,end:2}]}]};
  const plan={transcript_revision:'v1',scenes:[{id:'one',title:'真实截图',mode:'visual',source_word_ids:['w1','w2'],viewer_goal:'看见UI',actions:[{word_id:'w1',description:'展示截图'}]}]};
  const manifest={transcript_revision:'v1',scenes:[{scene_id:'one',role:'evidence',design:'展示真实页面，定位免费标识',sound:'画面出现时轻提示，停留时安静',media:[{path:'production/assets/ui.png',type:'image',mime:'image/png',source:'原始软件界面，2026-10-21',verified:true}]}]};
  const steps=['rough_cut','motion','audio','assemble','qc'].map(id=>({id,command:['node','placeholder.mjs',id],outputs:['production/'+id+'.txt']}));
  steps.at(-1).outputs=['production/qc-report.json'];
  const put=(p,v)=>{fs.mkdirSync(path.dirname(path.join(project,p)),{recursive:true});fs.writeFileSync(path.join(project,p),typeof v==='string'?v:JSON.stringify(v));};
  put('transcript/final-transcript.json',transcript);put('visual-planning.json',plan);put('production/scene-assets.json',manifest);
  put('production/assets/ui.png','real screenshot bytes');put('production/workflow.json',{steps});
  const cleanup=()=>fs.rmSync(tmp,{recursive:true,force:true});
  return {tmp,project,manifest,put,cleanup};
}
test('在准备阶段强制真实素材来源，不允许证据无图',()=>{
  const f=setup();try {
    assert.equal(loadEvidence(f.project).scenes.length,1);
    f.manifest.scenes[0].media=[];
    f.put('production/scene-assets.json',f.manifest);
    assert.throws(()=>loadEvidence(f.project),/没有实拍素材/);
    f.manifest.scenes[0].media=[{path:'production/assets/ui.png',type:'image',mime:'image/png',source:'示例',verified:false}];
    f.put('production/scene-assets.json',f.manifest);
    assert.throws(()=>loadEvidence(f.project),/未经核验/);
  }finally{f.cleanup();}
});
test('一次生成全片画面板，展示真实素材与声音，不需要逐段审批',()=>{
  const f=setup();try {
    const result=buildStoryboard(f.project);
    const html=fs.readFileSync(result.output,'utf8');
    assert.equal(result.scenes,1);
    assert.match(html,/production\/assets\/ui.png/);
    assert.match(html,/画面出现时轻提示/);
    assert.match(html,/不是逐10秒人工审批/);
    assert.ok(fs.existsSync(path.join(f.project,'production/storyboard-record.json')));
  }finally{f.cleanup();}
});
test('拒绝不在项目内的素材路径、软链接及不完整工作流',()=>{
  const f=setup();try{
    assert.throws(()=>insideProject(f.project,'../escape'),/越界/);
    assert.throws(()=>resolveProject('../bad',f.tmp),/非法/);
    const outside=path.join(f.tmp,'outside.png');fs.writeFileSync(outside,'x');
    fs.symlinkSync(outside,path.join(f.project,'production/assets/other.png'));
    assert.throws(()=>insideProject(f.project,'production/assets/other.png'),/软链接/);
    const flow=JSON.parse(fs.readFileSync(path.join(f.project,'production/workflow.json')));
    flow.steps.pop();f.put('production/workflow.json',flow);
    assert.throws(()=>validateWorkflow(f.project),/批处理顺序/);
  }finally{f.cleanup();}
});
test('自动批量跑完所有阶段并停在整片人工验收，不插入逐10秒确认',()=>{
  const f=setup();try{
    const calls=[];
    const runner=(cmd,args)=>{
      const id=args.at(-1);calls.push(id);
      const target=id==='qc'?'production/qc-report.json':'production/'+id+'.txt';
      f.put(target,id==='qc'?{status:'pass',sync:'pass',evidence:'pass',readability:'pass',audio:'pass',full_video_review:'pass'}:'new '+id);
      return {status:0,stderr:''};
    };
    const report=runBatch(f.project,runner);
    assert.deepEqual(calls,['rough_cut','motion','audio','assemble','qc']);
    assert.equal(report.status,'ready_for_final_human_review');
    assert.equal(report.steps.length,5);
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.project,'production/run-report.json'))).status,'ready_for_final_human_review');
  }finally{f.cleanup();}
});
test('不允许拿旧输出/空输出冒充重做成功，也不把未检查整片的 QC 当 pass',()=>{
  const f=setup();try{
    f.put('production/rough_cut.txt','previous content');
    assert.throws(()=>runBatch(f.project,()=>({status:0,stderr:''})),/未更新/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.project,'production/run-report.json'))).status,'failed');
    const runner=(cmd,args)=>{
      const id=args.at(-1);
      f.put(id==='qc'?'production/qc-report.json':'production/'+id+'.txt',
        id==='qc'?{status:'pass',sync:'pass',evidence:'pass',readability:'pass',audio:'pass',full_video_review:'pending'}:'new '+id);
      return {status:0,stderr:''};
    };
    assert.throws(()=>runBatch(f.project,runner),/没有完成整片声画/);
  }finally{f.cleanup();}
});
