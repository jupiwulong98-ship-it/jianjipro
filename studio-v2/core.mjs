import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const safeId = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
export const repository = path.resolve(import.meta.dirname,'..');
export const projects = path.join(repository,'projects');

export function projectDir(id, base=projects) {
  if (!safeId.test(id)) throw Error('非法项目编号');
  const dir=path.join(base,id);
  if (!fs.existsSync(dir)||!fs.statSync(dir).isDirectory()) throw Error('项目不存在：'+id);
  return dir;
}
export function fileInside(dir,relative,exists=true) {
  if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||relative.includes('\0')) throw Error('素材路径必须为项目内相对路径');
  const full=path.resolve(dir,relative),base=fs.realpathSync(dir);
  if(!full.startsWith(path.resolve(dir)+path.sep)) throw Error('禁止项目外路径 '+relative);
  let cur=dir;
  for(const part of path.relative(dir,full).split(path.sep)){
    cur=path.join(cur,part);
    if(fs.existsSync(cur)&&fs.lstatSync(cur).isSymbolicLink()) throw Error('禁止软链接素材 '+relative);
  }
  if(exists&&(!fs.existsSync(full)||!fs.statSync(full).isFile()||!fs.statSync(full).size))throw Error('素材文件缺失或为空 '+relative);
  if(exists&&!fs.realpathSync(full).startsWith(base+path.sep))throw Error('素材路径越界');
  return full;
}
const rj=(dir,p)=>JSON.parse(fs.readFileSync(fileInside(dir,p),'utf8'));
const mkdir=(dir)=>fs.mkdirSync(dir,{recursive:true});
const put=(file,value)=>{mkdir(path.dirname(file));const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);};
const types=['presenter','evidence','screenrecord','comparison'];
const layouts=['full','split'];
const mimeType=(file)=>({'.mp4':'video/mp4','.mov':'video/quicktime','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4'}[path.extname(file).toLowerCase()]||'application/octet-stream');

export function inspect(dir) {
  const plan=rj(dir,'studio/plan.json');
  if(plan.version!==1||!plan.source?.video||!Array.isArray(plan.scenes)||!plan.scenes.length)throw Error('缺少新版主工程 plan.json');
  const source=fileInside(dir,plan.source.video);
  if(!Array.isArray(plan.assets))throw Error('plan.assets 必须为数组');
  const assets=new Map();
  for(const a of plan.assets){
    if(typeof a.id!=='string'||assets.has(a.id))throw Error('素材ID重复或缺失');
    if(!['logo','screenshot','screenrecord','image'].includes(a.kind))throw Error('素材类别错误 '+a.id);
    if(!a.origin||!a.checked_at||a.verified!==true)throw Error('素材未真实核验或缺少来源 '+a.id);
    if(!a.file||!['image/png','image/jpeg','image/webp','video/mp4','video/quicktime'].includes(mimeType(a.file)))throw Error('素材格式不可用于画面 '+a.id);
    const full=fileInside(dir,a.file);
    if(a.kind==='screenrecord'&&!mimeType(a.file).startsWith('video/'))throw Error('录屏必须是实际视频 '+a.id);
    assets.set(a.id,{...a,full,digest:sha(fs.readFileSync(full))});
  }
  const sceneIds=new Set();
  let end=0;
  for(const s of plan.scenes){
    if(!s.id||sceneIds.has(s.id)||!types.includes(s.type)||!layouts.includes(s.layout||'full'))throw Error('分镜格式、ID或类别错误');
    sceneIds.add(s.id);
    if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||Math.abs(s.start-end)>.08)throw Error('分镜时间未连续：'+s.id);
    if(!s.intent||!s.visual||!s.sound)throw Error('分镜缺少内容、真实画面或声音设计：'+s.id);
    if(!Array.isArray(s.assets))throw Error('scene.assets 必须为数组：'+s.id);
    for(const id of s.assets)if(!assets.has(id))throw Error('分镜所需素材未找到：'+s.id+' / '+id);
    if(s.type==='evidence' && !s.assets.some(id=>['screenshot','image'].includes(assets.get(id).kind)))throw Error('真实证据缺少截图：'+s.id);
    if(s.type==='screenrecord'&&!s.assets.some(id=>assets.get(id).kind==='screenrecord'))throw Error('操作演示必须真实录屏：'+s.id);
    if(s.type==='comparison'&&s.assets.length<2)throw Error('对比需要两个真实素材：'+s.id);
    if(s.type==='presenter'&&s.assets.length)throw Error('纯真人段不应硬塞素材：'+s.id);
    if(s.type==='comparison'&&s.layout==='split'&&s.assets.length>2)throw Error('对比只支持2素材，超过请用自定义HyperFrames效果');
    if(s.render_mode&&!['basic','custom'].includes(s.render_mode))throw Error('渲染方式必须为basic或custom：'+s.id);
    if(s.music_state&&!['normal','low','mute'].includes(s.music_state))throw Error('音乐状态不正确：'+s.id);
    if(s.focus){const {x,y,w,h}=s.focus;
      if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<=0||h<=0||x+w>1.001||y+h>1.001)throw Error('真实界面局部聚焦范围无效：'+s.id);
      if(s.type==='presenter'||s.type==='comparison')throw Error('局部聚焦仅适用于单真实媒体：'+s.id);
    }
    end=s.end;
  }
  if(plan.music){
    if(!plan.music.file||!['audio/wav','audio/mpeg','audio/mp4'].includes(mimeType(plan.music.file)))throw Error('配乐文件格式无效');
    fileInside(dir,plan.music.file);
    if(plan.music.license_confirmed!==true)throw Error('配乐未确认许可');
  }
  for(const cue of plan.sfx||[]){
    if(!Number.isFinite(cue.at)||cue.at<0||cue.at>end)throw Error('音效落点越界');
    if(!cue.file||!['audio/wav','audio/mpeg','audio/mp4'].includes(mimeType(cue.file)))throw Error('音效必须为本地音频');
    if(cue.license_confirmed!==true)throw Error('音效许可未确认');
    fileInside(dir,cue.file);
  }
  if(plan.source.transcript)fileInside(dir,plan.source.transcript);
  const linked=[plan.source.video,plan.source.transcript,...plan.assets.map(a=>a.file),plan.music?.file,...(plan.sfx||[]).map(x=>x.file)].filter(Boolean);
  const signatures=linked.map(p=>[p,sha(fs.readFileSync(fileInside(dir,p)))]);
  const binding=sha(JSON.stringify({plan,signatures})); // changes to any asset or script invalidate approval
  return {plan,source,assets,binding,duration:end};
}
export function review(dir, data=inspect(dir)) {
  let saved=null;
  try{saved=rj(dir,'studio/review.json');}catch{}
  const current=saved?.binding===data.binding;
  return {binding:data.binding,assets_approved:current&&saved.assets_approved===true,
    visual_approved:current&&saved.visual_approved===true,comment:current?saved.comment||'':'',
    stale:!!saved&&!current};
}
export function approve(dir,action,binding,comment='') {
  const data=inspect(dir);
  if(binding!==data.binding)throw Error('素材或方案已改变，请重新查看后确认');
  const prior=review(dir,data);
  if(!['assets','visual','changes','reset'].includes(action))throw Error('未知确认操作');
  const state={binding,assets_approved:prior.assets_approved,visual_approved:prior.visual_approved,comment:prior.comment,
    updated_at:new Date().toISOString()};
  if(action==='assets')state.assets_approved=true;
  if(action==='visual')state.visual_approved=true;
  if(action==='changes'){if(!String(comment).trim())throw Error('请写具体修改意见');state.assets_approved=false;state.visual_approved=false;state.comment=String(comment).slice(0,2000);}
  if(action==='reset'){state.assets_approved=false;state.visual_approved=false;}
  put(path.join(dir,'studio/review.json'),state);
  return state;
}
function cmd(binary,args,cwd) {
  const x=spawnSync(binary,args,{cwd,encoding:'utf8',timeout:180000,maxBuffer:2*1024*1024});
  if(x.status!==0)throw Error(binary+' 命令失败：'+(x.stderr||x.error?.message||'').slice(-1000));
  return x.stdout;
}
const WIDTH=1280,HEIGHT=720,FPS=30;
function ffScene(dir,data,s,out,poster=false) {
  const length=s.end-s.start; // final edited transcript and presenter share the same clock
  const args=['-hide_banner','-loglevel','error','-nostdin','-y'];
  let graph='',input=0;
  if(s.render_mode==='custom' && !poster){
    args.push('-i',fileInside(dir,'studio/renders/'+s.id+'.mp4'));
    graph='[0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v]';
  }else{
    args.push('-ss',String(s.start),'-t',String(length),'-i',data.source);
    const media=s.assets.map(id=>data.assets.get(id));
    for(const m of media)args.push(...(mimeType(m.file).startsWith('image/')?['-loop','1','-framerate',String(FPS)]:[]),'-i',m.full);
    const fit=(idx,w,h,label,focus=false)=>{
      const f=focus?s.focus:null;
      const crop=f?'['+idx+':v]crop=iw*'+f.w+':ih*'+f.h+':iw*'+f.x+':ih*'+f.y+'[crop'+idx+'];[crop'+idx+']':'['+idx+':v]';
      return crop+'scale='+w+':'+h+':force_original_aspect_ratio=decrease,pad='+w+':'+h+':(ow-iw)/2:(oh-ih)/2:color=0x171c23,setsar=1['+label+']';
    };
    if(s.type==='presenter')graph=fit(0,WIDTH,HEIGHT,'stage')+';[stage]format=yuv420p[v]';
    else if(s.type==='comparison'){
      graph=fit(1,640,720,'left')+';'+fit(2,640,720,'right')+';[left][right]hstack=inputs=2,format=yuv420p[v]';
    } else if((s.layout||'full')==='split'){
      // Cropping the source to its center half prevents placing a screenshot on top of the face.
      graph='[0:v]crop=iw/2:ih:iw/4:0,scale=640:720:force_original_aspect_ratio=increase,crop=640:720,setsar=1[left];'+fit(1,640,720,'right',true)+';[left][right]hstack=inputs=2,format=yuv420p[v]';
    } else graph=fit(1,WIDTH,HEIGHT,'stage',true)+';[stage]format=yuv420p[v]';
  }
  args.push('-filter_complex',graph,'-map','[v]','-an');
  if(poster)args.push('-frames:v','1',out);
  else args.push('-t',String(length),'-r',String(FPS),'-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',out);
  cmd('ffmpeg',args,dir);
}
export function preview(dir) {
  const data=inspect(dir);
  const posters=path.join(dir,'studio/previews');mkdir(posters);
  for(const s of data.plan.scenes)ffScene(dir,data,s,path.join(posters,s.id+'.jpg'),true);
  const state={binding:data.binding,updated_at:new Date().toISOString(),scenes:data.plan.scenes.length};
  put(path.join(dir,'studio/preview-status.json'),state);
  return state;
}
function ensureReview(dir,data) {
  const state=review(dir,data);
  if(!state.assets_approved||!state.visual_approved)throw Error('请先在网页确认真实素材和整片画面方向（不是每10秒确认）');
  const stat=rj(dir,'studio/preview-status.json');
  if(stat.binding!==data.binding)throw Error('预览图版本已过期');
}
function makeAudio(dir,data,muteVideo) {
  const input=['-i',muteVideo,'-i',data.source];
  const tracks=['[1:a:0]volume=1,highpass=f=65[voice]'];let index=2,segments=['[voice]'];
  if(data.plan.music){
    input.push('-stream_loop','-1','-i',fileInside(dir,data.plan.music.file));
    const gain=Math.max(0,Math.min(.3,Number(data.plan.music.gain??.045)));
    const duck=data.plan.scenes.filter(s=>s.music_state==='low'||s.music_state==='mute').map(s=>
      ',volume='+(s.music_state==='mute'?0:0.42)+':enable=\'between(t\\,'+s.start+'\\,'+s.end+')\'').join('');
    tracks.push('['+index+':a:0]atrim=duration='+data.duration+',asetpts=N/SR/TB,volume='+gain+duck+'[music]');
    segments.push('[music]');index++;
  }
  for(const [i,cue] of (data.plan.sfx||[]).entries()){
    input.push('-i',fileInside(dir,cue.file));
    const gain=Math.max(0,Math.min(.5,Number(cue.gain??.12))),delay=Math.round(cue.at*1000);
    tracks.push('['+index+':a:0]volume='+gain+',adelay='+delay+'|'+delay+'[fx'+i+']');
    segments.push('[fx'+i+']');index++;
  }
  const mix=segments.length>1?segments.join('')+'amix=inputs='+segments.length+':duration=first:dropout_transition=0,alimiter=limit=0.95[a]':'[voice]anull[a]';
  const video=path.join(dir,'studio/output/final.mp4');
  cmd('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',...input,
    '-filter_complex',[...tracks,mix].join(';'),'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(data.duration),'-movflags','+faststart',video],dir);
  return video;
}
function probe(file,dir) {return JSON.parse(cmd('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],dir));}
export function produce(dir) {
  const data=inspect(dir);ensureReview(dir,data);
  const chosen=data.plan.scenes.filter(s=>s.render_mode==='custom');
  if(chosen.length){
    const proof=rj(dir,'studio/renders/manifest.json');
    if(proof.binding!==data.binding||!proof.clips)throw Error('HyperFrames实际视频对应旧素材或旧画面方案');
    for(const s of chosen){
      const f=fileInside(dir,'studio/renders/'+s.id+'.mp4');
      if(proof.clips[s.id]!==sha(fs.readFileSync(f)))throw Error('动态效果缺失或文件未核验：'+s.id);
      const meta=probe(f,dir),duration=Number(meta.format.duration);
      if(!meta.streams.some(x=>x.codec_type==='video')||Math.abs(duration-(s.end-s.start))>0.2)throw Error('动态视频时长与剪后时间轴不符：'+s.id);
    }
  }
  const out=path.join(dir,'studio/output'),stage=path.join(out,'segments');mkdir(stage);
  const report={status:'running',binding:data.binding,started_at:new Date().toISOString(),stages:[],user_approved_before_render:true};
  const save=()=>put(path.join(out,'report.json'),report);save();
  try{
    const segments=[];
    for(const s of data.plan.scenes){
      const dest=path.join(stage,s.id+'.mp4');ffScene(dir,data,s,dest);
      segments.push(dest);report.stages.push({id:s.id,renderer:s.render_mode==='custom'?'custom-validated-render':'basic-real-media',status:'rendered',file:path.relative(dir,dest),sha256:sha(fs.readFileSync(dest))});save();
    }
    // Concatenate clips with identical encoding, codec and geometry; sound is always sourced from the final edited presenter track.
    const list=path.join(out,'concat.txt');
    fs.writeFileSync(list,segments.map(s=>"file '"+s.replaceAll("'","'\\''")+"'").join('\n')+'\n');
    const visual=path.join(out,'visual.mp4');
    cmd('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-f','concat','-safe','0','-i',list,'-c','copy',visual],dir);
    const final=makeAudio(dir,data,visual);
    const p=probe(final,dir),v=p.streams.find(x=>x.codec_type==='video'),a=p.streams.find(x=>x.codec_type==='audio');
    const duration=Number(p.format.duration);
    if(!v||!a||v.width!==WIDTH||v.height!==HEIGHT||Math.abs(duration-data.duration)>0.35)throw Error('最终成片缺视频、音轨或时长偏差过大');
    report.status='rendered_pending_visual_audio_review';
    report.output=path.relative(dir,final);report.duration=duration;report.sha256=sha(fs.readFileSync(final));
    report.technical_qc={output_exists:true,has_audio:true,video_size:WIDTH+'x'+HEIGHT,continous_timeline:true};
    report.human_visual_audio_review='pending';report.finished_at=new Date().toISOString();save();return report;
  }catch(err){report.status='failed';report.error=err.message;report.finished_at=new Date().toISOString();save();throw err;}
}
export function mediaType(relative){return mimeType(relative);}
