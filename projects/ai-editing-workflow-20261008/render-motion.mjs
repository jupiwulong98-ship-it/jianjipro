import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {verifyVideo} from '../../motion-library/runtime-talkcraft/core.mjs';
import {assertRhythmGate} from '../../motion-library/scripts/rhythm-review.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));const runtime=path.resolve(dir,'../../motion-library/runtime-talkcraft');const require=createRequire(path.join(runtime,'package.json'));
const {bundle}=require('@remotion/bundler'),{selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const plan=JSON.parse(fs.readFileSync(path.join(dir,'shotbook.json'))),out=path.join(dir,'renders');fs.mkdirSync(out,{recursive:true});const stills=process.argv.includes('--stills');assertRhythmGate(plan);
const entry=path.join(dir,'motion/Root.tsx');const entrySource=fs.readFileSync(entry),componentHash=crypto.createHash('sha256').update(entrySource).digest('hex');const serveUrl=await bundle({entryPoint:entry,webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[path.join(runtime,'node_modules'),'node_modules']}})});
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);const results=[];for(const shot of plan.shots.filter(s=>s.production&&(!only||only.split(',').includes(s.id)))){
const hash=crypto.createHash('sha256').update(entrySource).update(JSON.stringify(shot)).digest('hex'),file=path.join(out,shot.id+'-'+hash.slice(0,12)+'.mov');const inputProps={shot};
const composition=await selectComposition({serveUrl,id:'ProjectMotion',inputProps});
const samples=[Math.round(shot.duration_frames*.35),Math.round(shot.duration_frames*.72),Math.max(0,shot.duration_frames-8)];
if(stills){for(let i=0;i<samples.length;i++)await renderStill({composition,serveUrl,output:path.join(out,shot.id+'-'+i+'.png'),inputProps,frame:samples[i],imageFormat:'png'});console.log('stable',shot.id);continue;}
const gate=JSON.parse(fs.readFileSync(path.join(dir,'validation/stable-frames.json')));if(gate.status!=='pass'||gate.component_hash!==componentHash||!fs.readFileSync(entry).equals(entrySource))throw Error('稳定帧审核缺失或已过期');
let cached=false;const record=path.join(out,shot.id+'.json');if(fs.existsSync(file)&&fs.existsSync(record)&&JSON.parse(fs.readFileSync(record)).hash===hash){verifyVideo(file,shot,plan);cached=true;}
if(!cached){await renderMedia({composition,serveUrl,outputLocation:file,inputProps,codec:'prores',proResProfile:'4444',pixelFormat:'yuva444p10le',imageFormat:'png',muted:true,concurrency:4});const verification=verifyVideo(file,shot,plan);fs.writeFileSync(record,JSON.stringify({hash,component_hash:componentHash,verification}));}
results.push({shot_id:shot.id,file,start_frame:shot.start_frame,duration_frames:shot.duration_frames,presentation_mode:shot.presentation_mode,hash});console.log(cached?'cached':'rendered',shot.id);}
if(!stills){const prior=only&&fs.existsSync(path.join(out,'chatcut-delivery.json'))?JSON.parse(fs.readFileSync(path.join(out,'chatcut-delivery.json'))).clips:[];const merged=[...prior.filter(s=>!results.some(r=>r.shot_id===s.shot_id)),...results].sort((a,b)=>a.start_frame-b.start_frame);fs.writeFileSync(path.join(out,'chatcut-delivery.json'),JSON.stringify({project_id:plan.project_id,fps:30,width:1920,height:1080,status:'rendered_not_assembled',clips:merged},null,2));}
