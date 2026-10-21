import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const phases = ['rough_cut', 'motion', 'audio', 'assemble', 'qc'];
const mediaTypes = new Set(['image', 'video']);
const roles = new Set(['clean', 'evidence', 'demo', 'emphasis', 'diagram']);
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const safeName = name => /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name);
const requiredString = (value, label) => {if (typeof value !== 'string' || !value.trim()) throw Error('缺少' + label); return value.trim();};

export function resolveProject(id, projectRoot=path.join(root,'projects')) {
  if (!safeName(id)) throw Error('非法项目 ID');
  const project=path.join(projectRoot,id);
  if (!fs.existsSync(project) || !fs.statSync(project).isDirectory()) throw Error('项目目录不存在：' + id);
  return project;
}
export function insideProject(project, relative, exists=true) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\0')) throw Error('路径必须是项目内相对路径');
  const target=path.resolve(project,relative);
  const base=fs.realpathSync(project);
  if (!target.startsWith(path.resolve(project)+path.sep)) throw Error('路径越界：' + relative);
  // Reject symlinks (including parent directories) so the preview never reads outside the project.
  let walk=project;
  for (const segment of path.relative(project,target).split(path.sep)) {
    walk=path.join(walk,segment);
    if (fs.existsSync(walk) && fs.lstatSync(walk).isSymbolicLink()) throw Error('禁止媒体软链接：' + relative);
  }
  if (exists && (!fs.existsSync(target) || !fs.statSync(target).isFile() || fs.statSync(target).size===0)) throw Error('素材或产物缺失：' + relative);
  if (exists && !fs.realpathSync(target).startsWith(base+path.sep)) throw Error('路径越界：' + relative);
  return target;
}
export function loadEvidence(project) {
  const transcriptFile=insideProject(project,'transcript/final-transcript.json');
  const planFile=insideProject(project,'visual-planning.json');
  const manifestFile=insideProject(project,'production/scene-assets.json');
  const transcript=read(transcriptFile), plan=read(planFile), manifest=read(manifestFile);
  if (transcript.source?.time_basis!=='edited_timeline' || plan.transcript_revision!==transcript.revision) throw Error('剪后逐字稿和策划版本不一致');
  if (!Array.isArray(plan.scenes) || !plan.scenes.length || !Array.isArray(manifest.scenes)) throw Error('缺少完整的全片规划或素材表');
  if (manifest.transcript_revision!==transcript.revision) throw Error('素材表使用了旧逐字稿');
  const mapped=new Map();
  for (const record of manifest.scenes) {
    if (!record || typeof record.scene_id!=='string' || mapped.has(record.scene_id)) throw Error('素材表镜头重复或缺少 ID');
    mapped.set(record.scene_id,record);
  }
  const out=[];
  for (const scene of plan.scenes) {
    const record=mapped.get(scene.id);
    if (!record) throw Error('镜头未进行素材与声画设计：' + scene.id);
    if (!roles.has(record.role)) throw Error('画面表达类型无效：' + scene.id);
    if (scene.mode==='clean' && record.role!=='clean') throw Error('人物保留段与素材表冲突：' + scene.id);
    if (scene.mode==='visual' && record.role==='clean') throw Error('包装段不能静默降级为纯人物：' + scene.id);
    requiredString(record.design,'本段实际画面设计 ' + scene.id);
    requiredString(record.sound,'本段声音安排 ' + scene.id);
    const media=record.media ?? [];
    if (!Array.isArray(media)) throw Error('素材必须是数组：' + scene.id);
    const bound=media.map(m=>{
      if (!mediaTypes.has(m.type)) throw Error('媒体类型无效：' + scene.id);
      if (!['image/png','image/jpeg','image/webp','video/mp4','video/quicktime'].includes(m.mime)) throw Error('素材 MIME 类型无效：' + scene.id);
      if ((m.type==='image')!==m.mime.startsWith('image/')) throw Error('媒体类型与 MIME 不一致：' + scene.id);
      requiredString(m.source,'素材来源 ' + scene.id);
      if (m.verified!==true) throw Error('素材未经核验：' + scene.id);
      const filename=insideProject(project,m.path);
      return {...m, sha256:hash(fs.readFileSync(filename))};
    });
    if (['evidence','demo'].includes(record.role) && !bound.some(m=>m.type==='video'||m.type==='image')) throw Error('真实证据/操作演示没有实拍素材：' + scene.id);
    if (record.role==='demo' && !bound.some(m=>m.type==='video')) throw Error('操作演示缺少真实录屏：' + scene.id);
    if (record.preview) insideProject(project,record.preview);
    out.push({...scene, evidence:{...record,media:bound}});
  }
  if (mapped.size!==out.length) throw Error('素材表出现不属于当前规划的镜头');
  return {transcript,plan,manifest,scenes:out,manifest_sha256:hash(fs.readFileSync(manifestFile))};
}
function duration(scene, words) {
  const map=new Map(words.flatMap(s=>s.words??[]).map(w=>[w.id,w]));
  const first=map.get(scene.source_word_ids[0]), last=map.get(scene.source_word_ids.at(-1));
  return {start:first?.start ?? 0,end:last?.end ?? 0};
}
export function buildStoryboard(project) {
  const input=loadEvidence(project);
  const words=input.transcript.segments;
  const cards=input.scenes.map((scene,index)=>{
    const record=scene.evidence, span=duration(scene,words);
    const main=record.preview?{path:record.preview,type:'image',mime:'image/png'}:record.media[0];
    const media=main?(main.type==='video'?'<video controls preload="metadata" src="'+escapeHtml(main.path)+'"></video>':'<img loading="lazy" src="'+escapeHtml(main.path)+'" alt="真实绑定的素材或渲染帧">'):'<div class="clean">保留真人口播 · 不额外堆卡片</div>';
    const tag=record.preview?'已渲染的构图帧':main?'已绑定真实素材（非最终构图）':'人物留白';
    return '<article><header><b>'+String(index+1).padStart(2,'0')+'</b><span>'+span.start.toFixed(2)+'–'+span.end.toFixed(2)+'s</span><strong>'+escapeHtml(scene.title)+'</strong></header><div class="screen">'+media+'</div><small>'+tag+'</small><p class="speak">'+escapeHtml(scene.viewer_goal)+'</p><p>画面：'+escapeHtml(record.design)+'</p><p>声音：'+escapeHtml(record.sound)+'</p><p class="sources">来源：'+escapeHtml(record.media.map(m=>m.source).join('；')||'真人原片')+'</p></article>';
  }).join('\n');
  const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全片真实素材画面板</title><style>body{margin:0;background:#0d1117;color:#f0f3f7;font:16px/1.6 system-ui,-apple-system,sans-serif}main{max-width:1150px;margin:auto;padding:32px 20px}h1{font-size:32px;margin-bottom:0}.hint{color:#aab3c0;margin-bottom:32px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:22px}article{background:#1b222e;padding:16px;border:1px solid #323d4d;border-radius:14px}header{display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap}header b{color:#8ad7ce}header span{color:#aab3c0}.screen{aspect-ratio:16/9;display:flex;background:#06090d;border-radius:8px;overflow:hidden;align-items:center;justify-content:center}.screen img,.screen video{width:100%;height:100%;object-fit:contain}.clean{color:#b2c0d0}small,.sources{color:#9cacb9}.speak{font-weight:600}p{margin:8px 0}</style></head><body><main><h1>全片真实素材画面板</h1><p class="hint">一次查看整条片子的证据素材与声画方向；不是逐10秒人工审批。没有渲染关键帧的画面只代表素材，不冒充最终包装。</p><section class="grid">'+cards+'</section></main></body></html>';
  const output=path.join(project,'production/storyboard.html');
  fs.writeFileSync(output,html);
  fs.writeFileSync(path.join(project,'production/storyboard-record.json'),JSON.stringify({transcript_revision:input.transcript.revision,manifest_sha256:input.manifest_sha256,scenes:input.scenes.map(s=>({scene_id:s.id,role:s.evidence.role,media:s.evidence.media.map(m=>({path:m.path,sha256:m.sha256}))}))},null,2)+'\n');
  return {output,scenes:input.scenes.length};
}
export function validateWorkflow(project) {
  const workflow=read(insideProject(project,'production/workflow.json'));
  if (!Array.isArray(workflow.steps) || workflow.steps.map(s=>s.id).join(',')!==phases.join(',')) throw Error('批处理顺序必须为 rough_cut → motion → audio → assemble → qc');
  for (const step of workflow.steps) {
    if (!Array.isArray(step.command) || !step.command.length || step.command.some(x=>typeof x!=='string'||!x.trim())) throw Error('步骤缺少可执行命令：' + step.id);
    // Shell injection is deliberately unavailable. A project-local Codex-created script may be invoked with node/python.
    if (!['node','python3','npm','npx','ffmpeg'].includes(step.command[0])) throw Error('步骤只接受指定无 shell 的执行器：' + step.id);
    if (!Array.isArray(step.outputs) || !step.outputs.length) throw Error('步骤没有产物验收：' + step.id);
    for (const output of step.outputs) insideProject(project,output,false);
  }
  return workflow;
}
export function runBatch(project, runner=spawnSync) {
  const board=buildStoryboard(project);
  const workflow=validateWorkflow(project);
  const report={started_at:new Date().toISOString(),status:'running',board:path.relative(project,board.output),steps:[]};
  const reportFile=path.join(project,'production/run-report.json');
  const save=()=>fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
  save();
  try {
    for (const stage of workflow.steps) {
      const before=new Map(stage.outputs.map(name=>{
        const file=insideProject(project,name,false);
        return [name,fs.existsSync(file)?fs.statSync(file).mtimeMs:null];
      }));
      let success=false, detail='';
      const retries=Math.min(2,Math.max(0,Number.isInteger(stage.retries)?stage.retries:0));
      for (let attempt=0;attempt<=retries;attempt++) {
        const result=runner(stage.command[0],stage.command.slice(1),{cwd:project,encoding:'utf8',timeout:1800000,windowsHide:true,maxBuffer:4*1024*1024,shell:false});
        detail=String(result.stderr??result.error?.message??'').slice(-2000);
        if (result.status!==0) continue;
        const all=stage.outputs.every(name=>{
          try{const file=insideProject(project,name);return before.get(name)===null||fs.statSync(file).mtimeMs>before.get(name);}
          catch{return false;}
        });
        if (all) {success=true;break;}
        detail='命令完成但产物缺失、未更新或为空';
      }
      const outputs=success?stage.outputs.map(p=>({path:p,sha256:hash(fs.readFileSync(insideProject(project,p)))})):[];
      report.steps.push({id:stage.id,status:success?'pass':'failed',outputs,detail});
      save();
      if (!success) throw Error('自动制作中止：'+stage.id+'；'+detail);
    }
    const qc=read(insideProject(project,'production/qc-report.json'));
    if (qc.status!=='pass' || ['sync','evidence','readability','audio','full_video_review'].some(k=>qc[k]!=='pass')) throw Error('QC没有完成整片声画和真实素材核验，不能标记可交付');
    report.status='ready_for_final_human_review';
    report.finished_at=new Date().toISOString();save();
    return report;
  }catch(error){report.status='failed';report.error=error.message;report.finished_at=new Date().toISOString();save();throw error;}
}
function cli() {
  const args=process.argv.slice(2),projectId=args[args.indexOf('--project')+1],action=args[0];
  if (!projectId || !['board','check','run'].includes(action)) throw Error('用法：node scripts/unattended-edit.mjs board|check|run --project <项目ID>');
  const project=resolveProject(projectId);
  if (action==='board') return buildStoryboard(project);
  if (action==='check') {const board=buildStoryboard(project);return {board,...{steps:validateWorkflow(project).steps.map(s=>s.id)}};}
  return runBatch(project);
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{console.log(JSON.stringify(cli(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
