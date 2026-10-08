import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const p=path.dirname(fileURLToPath(import.meta.url));const runtime=path.resolve(p,'../../motion-library/runtime-talkcraft');const require=createRequire(runtime+'/package.json');
const {bundle}=require('@remotion/bundler');const {renderMedia,renderStill,selectComposition}=require('@remotion/renderer');
const {resolvePlan,verifyVideo}=await import(runtime+'/core.mjs');const {assertRhythmGate,reviewRhythm}=await import(path.resolve(p,'../../motion-library/scripts/rhythm-review.mjs'));
const plan=JSON.parse(fs.readFileSync(p+'/shotbook.json','utf8'));plan.visual_concepts=JSON.parse(fs.readFileSync(p+'/visual-concepts.json','utf8'));
const resolved=resolvePlan(plan);const out=p+'/renders';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/resolved-plan.json',JSON.stringify(resolved,null,2));
const command=process.argv[2]??'stills';
if(command==='render')assertRhythmGate(plan);
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const serveUrl=await bundle({entryPoint:p+'/Generated.tsx',publicDir:p+'/assets',webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[runtime+'/node_modules','node_modules']}})});
const sourceHash=crypto.createHash('sha256').update(fs.readFileSync(p+'/Generated.tsx')).digest('hex');
const proofPath=p+'/validation/stable-frame-qc.json';
const proof=fs.existsSync(proofPath)?JSON.parse(fs.readFileSync(proofPath,'utf8')):null;
if(command==='render'&&(!proof||proof.source_hash!==sourceHash||proof.status!=='pass'))throw Error('当前候选源尚未通过稳定帧 QC');
const manifest=[];
for(const shot of resolved.shots){
 if(shot.clean_presenter)continue;
 for(const s of shot.asset_slots??[])if(s.required&&s.status!=='ready')throw Error(shot.id+':真实素材未就绪');
 const inputProps={shot};const composition=await selectComposition({serveUrl,id:'GithubSkillShot',inputProps,browserExecutable});
 const frames=[Math.min(shot.duration_frames-1,20),Math.min(shot.duration_frames-1,Math.floor(shot.duration_frames*.72)),shot.duration_frames-1];
 if(command==='stills')for(let i=0;i<frames.length;i++)await renderStill({composition,serveUrl,inputProps,output:out+`/${shot.id}-${i}.png`,frame:frames[i],imageFormat:'png',browserExecutable});
 else{
 const file=out+'/'+shot.id+'.mov';const hash=crypto.createHash('sha256').update(sourceHash).update(JSON.stringify(shot)).digest('hex');const cache=out+'/'+shot.id+'.cache.json';
 if(!(fs.existsSync(file)&&fs.existsSync(cache)&&JSON.parse(fs.readFileSync(cache)).hash===hash)){
 await renderMedia({composition,serveUrl,inputProps,outputLocation:file,codec:'prores',proResProfile:'4444',pixelFormat:'yuva444p10le',imageFormat:'png',muted:true,concurrency:3,browserExecutable});
 const verification=verifyVideo(file,shot,resolved);fs.writeFileSync(cache,JSON.stringify({hash,verification}));}
 manifest.push({shot_id:shot.id,file,start_frame:shot.start_frame,duration_frames:shot.duration_frames,source_in:0,muted:true,alpha:true,provider:shot.resolution.status==='resolved'?'talkcraft':'generated_motion',source_hash:sourceHash});
 }
 console.log(shot.id+': '+command);
}
if(command==='render')fs.writeFileSync(out+'/chatcut-delivery.json',JSON.stringify({project_id:plan.project_id,fps:30,width:1920,height:1080,status:'ready_for_assembly',clips:manifest},null,2));
fs.writeFileSync(out+'/source-hash.txt',sourceHash);console.log('完成 '+manifest.length+' rendered clips');
