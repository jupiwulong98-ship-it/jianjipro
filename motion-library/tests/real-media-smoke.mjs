import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runBatch,buildStoryboard} from '../scripts/unattended-edit.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'../..');
const project=path.join(repo,'projects/qa-real-media-smoke-20261022');
const file=p=>path.join(project,p);
const write=(p,data)=>{fs.mkdirSync(path.dirname(file(p)),{recursive:true});fs.writeFileSync(file(p),typeof data==='string'?data:JSON.stringify(data,null,2));};
const sum=[];
const cli=path.join(repo,'motion-library/scripts/unattended-edit.mjs');
// Test 1: a REAL pre-existing jianjipro project should not silently claim end-to-end readiness.
const existing=spawnSync('node',[cli,'check','--project','ai-editing-workflow-20261008'],{cwd:repo,encoding:'utf8'});
sum.push({test:'pre-existing-project-readiness',status:existing.status===0?'ready':'blocked',
  detail:(existing.stderr||existing.stdout||'').trim().slice(-800)});
if(existing.status===0) throw Error('Existing project unexpectedly has a fully prepared unattended workflow; inspect manually');
fs.rmSync(project,{recursive:true,force:true});
fs.mkdirSync(file('production/assets'),{recursive:true});
// The video and screenshot are repo-provided media, not a fresh Codex acquisition; explicit QA fixture only.
fs.copyFileSync(path.join(repo,'motion-library/public/review-projects/ai-tools-real-20260930/host.jpg'),file('production/assets/presenter.jpg'));
fs.copyFileSync(path.join(repo,'projects/chatgpt-settings-20261004/production/assets/screen-style.png'),file('production/assets/real-screen.png'));
const revision='qa-edited-transcript-20261022';
write('transcript/final-transcript.json',{revision,source:{time_basis:'edited_timeline'},segments:[{words:[
  {id:'w1',text:'来看',start:0,end:1.2},{id:'w2',text:'真实界面',start:1.2,end:4.5},{id:'w3',text:'效果',start:4.5,end:6}]}]});
write('visual-planning.json',{transcript_revision:revision,scenes:[{id:'ui-evidence',title:'真实界面证据展示',mode:'visual',
  source_word_ids:['w1','w2','w3'],viewer_goal:'看清真实软件截图，不使用幻觉UI',actions:[{word_id:'w2',description:'真实截图叠放并保持阅读时间'}]}]});
write('production/scene-assets.json',{transcript_revision:revision,scenes:[{scene_id:'ui-evidence',role:'evidence',
  design:'镜头先是人物；第2秒显示本仓库的截图，持续到第5秒然后回人物',
  sound:'人声示意音持续，精细音效不在此次技术冒烟测试中',
  media:[{path:'production/assets/real-screen.png',type:'image',mime:'image/png',source:'repo historical ChatGPT interface screenshot (QA fixture)',verified:true}]}]});
const stageFile='../../motion-library/tests/fixtures/real-media-stage.mjs';
write('production/workflow.json',{steps:[
  {id:'rough_cut',command:['node',stageFile,'rough_cut'],outputs:['production/video.mp4']},
  {id:'motion',command:['node',stageFile,'motion'],outputs:['production/motion.mp4']},
  {id:'audio',command:['node',stageFile,'audio'],outputs:['production/mixed.wav']},
  {id:'assemble',command:['node',stageFile,'assemble'],outputs:['production/final.mp4']},
  {id:'qc',command:['node',stageFile,'qc'],outputs:['production/qc-report.json','production/frame-before.png','production/frame-after.png']}
]});
const board=buildStoryboard(project);
const report=runBatch(project);
const qc=JSON.parse(fs.readFileSync(file('production/qc-report.json'),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(file(p))).digest('hex');
if(report.status!=='ready_for_final_human_review'||qc.status!=='pass')throw Error('Full-media pipeline did not pass technical checks');
if(sha('production/frame-before.png')===sha('production/frame-after.png'))throw Error('Actual output did not change when screenshot was supposed to appear');
sum.push({test:'actual-six-second-video-with-real-image-and-audio',status:'technical_pass',
  stages:report.steps.map(s=>({id:s.id,status:s.status})),final_video:file('production/final.mp4'),
  video_bytes:fs.statSync(file('production/final.mp4')).size,board:board.output,technical_qc:qc,
  caveat:'Test uses a repo screenshot, static presenter frame and tone, not a real-user video or a Codex/HyperFrames generation.'});
write('production/smoke-summary.json',{date:new Date().toISOString(),tests:sum});
console.log(JSON.stringify({status:'technical_pass',existing_project:sum[0],smoke:sum[1]},null,2));
