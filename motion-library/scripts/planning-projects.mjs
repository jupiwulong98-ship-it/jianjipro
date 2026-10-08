import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readReview, mutateReview} from './review-store.mjs';
import rules from '../src/planning/rules.json' with {type:'json'};

const projectsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../projects');
const slug = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const fail = (message, status=400) => Object.assign(new Error(message), {status});

// Only repository projects and regular files are exposed by the local workbench.
function projectPath(root, id) {
  if (!slug.test(id)) throw fail('项目不存在', 404);
  const directory=path.join(root,id);
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) throw fail('项目不存在',404);
  return directory;
}
function checkedFile(directory, relative) {
  const file=path.join(directory,relative);
  if (!fs.existsSync(file)) return null;
  const real=fs.realpathSync(file);
  if (!real.startsWith(fs.realpathSync(directory)+path.sep) || !fs.lstatSync(file).isFile()) throw fail('项目文件路径无效');
  return file;
}
function readJson(directory, relative) {
  const file=checkedFile(directory,relative);
  return file ? JSON.parse(fs.readFileSync(file,'utf8')) : null;
}

export function validatePlanning(plan, transcript) {
  if (plan.transcript_revision !== transcript.revision) throw fail('剪后逐字稿已变化，请重新策划并绑定新版本。',409);
  if (!Array.isArray(plan.scenes) || !plan.scenes.length) throw fail('画面策划没有段落');
  const words=transcript.segments.flatMap(segment=>segment.words);
  const wordMap=new Map(words.map(word=>[word.id,word]));
  const assigned=[]; const sceneIds=new Set();
  const scenes=plan.scenes.map(scene=>{
    if (typeof scene.id!=='string' || !scene.id || sceneIds.has(scene.id)) throw fail('策划段落编号重复或缺失');
    sceneIds.add(scene.id);
    for (const key of ['title','viewer_goal','initial_state','final_state','materials','reason']) {
      if (typeof scene[key]!=='string' || !scene[key].trim()) throw fail(`策划缺少 ${key}`);
    }
    if (!['clean','visual'].includes(scene.mode)) throw fail('策划呈现方式无效');
    if (scene.packaging_rule!==undefined) {
      if (!rules.some(rule=>rule.id===scene.packaging_rule)) throw fail('包装规则不存在，请补充有效的规则预览');
      if ((scene.mode==='clean') !== (scene.packaging_rule==='clean_presenter')) throw fail('包装规则与呈现方式不一致');
    }
    if (!Array.isArray(scene.source_word_ids) || !scene.source_word_ids.length) throw fail('策划缺少原文字词');
    const source=scene.source_word_ids.map(id=>{
      if (!wordMap.has(id)) throw fail('策划引用了不存在的原文字词');
      return wordMap.get(id);
    });
    assigned.push(...scene.source_word_ids);
    if (!Array.isArray(scene.actions) || (scene.mode==='visual' && !scene.actions.length)) throw fail('画面策划缺少动作时点');
    const actions=scene.actions.map(action=>{
      if (!scene.source_word_ids.includes(action.word_id) || typeof action.description!=='string' || !action.description.trim()) throw fail('画面动作必须锚定本段原文字词');
      const word=wordMap.get(action.word_id);
      const cueIds=action.cue_word_ids??[word.id];
      const anchorIndex=scene.source_word_ids.indexOf(word.id);
      if (!Array.isArray(cueIds) || !cueIds.length || cueIds.some((id,index)=>id!==scene.source_word_ids[anchorIndex+index])) throw fail('触发短语必须从锚点起连续引用本段原文');
      const cue=cueIds.map(id=>wordMap.get(id));
      return {word_id:word.id, description:action.description, text:cue.map(w=>w.text).join(''), start:word.start, end:cue.at(-1).end};
    });
    if (actions.some((action,index)=>index>0 && action.start<actions[index-1].start)) throw fail('画面动作必须按口播顺序排列');
    // Text and times always come from the captured transcript, never the proposal.
    return {...scene,start:source[0].start,end:source.at(-1).end,text:source.map(w=>w.text).join(''),words:source,actions};
  });
  if (assigned.length!==words.length || assigned.some((id,index)=>id!==words[index].id)) throw fail('策划必须按顺序覆盖剪后全文，每个字词恰好一次');
  return scenes;
}

export function listPlanningProjects(root=projectsRoot) {
  return fs.readdirSync(root,{withFileTypes:true}).filter(entry=>entry.isDirectory() && slug.test(entry.name))
    .filter(entry=>fs.existsSync(path.join(root,entry.name,'transcript/final-transcript.json')))
    .map(entry=>({id:entry.name,title:entry.name})).sort((a,b)=>b.id.localeCompare(a.id));
}
export function loadPlanningProject(id, root=projectsRoot) {
  const directory=projectPath(root,id);
  const transcript=readJson(directory,'transcript/final-transcript.json');
  if (!transcript) throw fail('尚未获取剪后全文',404);
  if (transcript.data_validation!=='pass' || transcript.source?.time_basis!=='edited_timeline' || !Array.isArray(transcript.segments) || !transcript.revision) throw fail('剪后逐字稿格式或来源未通过校验');
  let plan=null; let scenes=[]; let planError='';
  try {plan=readJson(directory,'visual-planning.json');}
  catch(error) {
    if (!(error instanceof SyntaxError)) throw error;
    planError='画面策划 JSON 无法解析，请修复文件；剪后全文仍可查看。';
  }
  if (plan) {try {scenes=validatePlanning(plan,transcript);} catch(error) {planError=error.message;}}
  // Re-reading identical captions should not discard approval just because capture time changed.
  const transcriptContent={revision:transcript.revision,source:transcript.source,segments:transcript.segments};
  const binding=crypto.createHash('sha256').update(JSON.stringify({transcript:transcriptContent,plan})).digest('hex');
  const reviewFile=path.join(directory,'planning-reviews',`${binding}.json`);
  // A changed transcript or proposal receives its own review; prior reviews are kept.
  checkedFile(directory,path.relative(directory,reviewFile));
  return {id,title:plan?.title??id,transcript,scenes,plan_error:planError,
    proposal_note:plan?.proposal_note??'尚未提交画面策划。',binding,review:readReview(reviewFile),
    reference_sample:planError?null:loadReferenceSample(directory,id,plan,transcript)};
}

// Rendered candidates bind only to their own scenes; later scenes do not invalidate this sample.
function loadReferenceSample(directory,id,plan,transcript) {
  try {
    const sample=readJson(directory,'reference-20s/preview.json');
    if (!sample || !plan || sample.status!=='candidate' || sample.transcript_revision!==transcript.revision || !Array.isArray(sample.scene_ids) || !sample.scene_ids.length) return null;
    const scenes=plan.scenes.filter(scene=>sample.scene_ids.includes(scene.id));
    const sceneHash=crypto.createHash('sha256').update(JSON.stringify(scenes)).digest('hex');
    if (scenes.length!==sample.scene_ids.length || sceneHash!==sample.scene_hash) return null;
    const video=checkedFile(directory,'reference-20s/reference.mp4');
    const poster=checkedFile(directory,'reference-20s/validation/frame-295.png');
    if (!video || !poster || crypto.createHash('sha256').update(fs.readFileSync(video)).digest('hex')!==sample.video_sha256) return null;
    const duration=Number.isFinite(sample.duration_seconds)&&sample.duration_seconds>0?sample.duration_seconds:20;
    return {title:typeof sample.title==='string'&&sample.title.trim()?sample.title:'前 20 秒 · 新规则动效参考',duration_seconds:duration,scene_ids:sample.scene_ids,
      url:`/api/planning-projects/${id}/reference.mp4?v=${sample.video_sha256}`,
      poster:`/api/planning-projects/${id}/reference.png?v=${sample.scene_hash}`};
  } catch {return null;} // A stale or incomplete candidate must not block transcript review.
}
export function savePlanningReview(id, request, root=projectsRoot) {
  const project=loadPlanningProject(id,root);
  if (request.binding!==project.binding) throw fail('逐字稿或策划已有更新，请重新载入；输入内容会保留。',409);
  if (!project.scenes.length || project.plan_error) throw fail('先完成当前版本的画面策划，再保存意见或确认。');
  const directory=projectPath(root,id);
  const reviewDirectory=path.join(directory,'planning-reviews');
  if (fs.existsSync(reviewDirectory) && (!fs.lstatSync(reviewDirectory).isDirectory() || !fs.realpathSync(reviewDirectory).startsWith(fs.realpathSync(directory)+path.sep))) throw fail('意见目录路径无效');
  return mutateReview(path.join(reviewDirectory,`${project.binding}.json`), project.scenes.map(s=>s.id),request);
}

export function planningApiPlugin(root=projectsRoot) {
  function middleware(req,res,next) {
    const route=req.url?.split('?')[0];
    if (route!=='/api/planning-projects' && !route?.startsWith('/api/planning-projects/')) return next();
    const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
    try {
      if (route==='/api/planning-projects') return req.method==='GET'?send(200,listPlanningProjects(root)):send(405,{error:'方法不支持'});
      const media=route.match(/^\/api\/planning-projects\/([^/]+)\/(reference\.mp4|reference\.png)$/);
      if (media) {
        if (!['GET','HEAD'].includes(req.method)) return send(405,{error:'方法不支持'});
        if (!loadPlanningProject(media[1],root).reference_sample) return send(404,{error:'参考已失效或尚未完成'});
        const file=checkedFile(projectPath(root,media[1]),media[2]==='reference.mp4'?'reference-20s/reference.mp4':'reference-20s/validation/frame-295.png');
        const size=fs.statSync(file).size;let start=0,end=size-1;
        if (req.headers.range) {
          const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
          if (!range) {res.setHeader('Content-Range',`bytes */${size}`);return send(416,{error:'范围无效'});}
          start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;
          if (!Number.isSafeInteger(start)||start<0||start>end) {res.setHeader('Content-Range',`bytes */${size}`);return send(416,{error:'范围无效'});}
          res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
        }
        res.setHeader('Content-Type',media[2]==='reference.mp4'?'video/mp4':'image/png');
        res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);res.setHeader('Cache-Control','no-store');
        if (req.method==='HEAD') return res.end();
        const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());return stream.pipe(res);
      }
      const id=route.slice('/api/planning-projects/'.length);
      if (req.method==='GET') return send(200,loadPlanningProject(id,root));
      if (req.method!=='POST') return send(405,{error:'方法不支持'});
      if ((req.headers.origin && req.headers.origin!==`http://${req.headers.host}`) || req.headers['sec-fetch-site']==='cross-site') return send(403,{error:'请从本机工作台提交'});
      if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'请求必须是 JSON'});
      let body=''; let ended=false;
      req.on('data',chunk=>{body+=chunk;if (Buffer.byteLength(body)>8192 && !ended) {ended=true;send(413,{error:'意见过长'});}});
      req.on('end',()=>{if (ended) return;try {send(200,savePlanningReview(id,JSON.parse(body),root));} catch(error) {send(error.status??400,{error:error.message});}});
    } catch(error) {send(error.status??400,{error:error.message});}
  }
  return {name:'jianjipro-planning',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
