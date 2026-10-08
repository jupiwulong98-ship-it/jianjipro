import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';

const p=path.dirname(fileURLToPath(import.meta.url));
const runtime=path.resolve(p,'../../../motion-library/runtime-talkcraft');
const require=createRequire(runtime+'/package.json');
const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const digest=crypto.createHash('sha256');
for(const file of ['Reference.tsx','reference-plan.json','template-selection.json','templates/number-counter.tsx','assets/base.mp4','assets/search-codex.png'])digest.update(fs.readFileSync(p+'/'+file));
for(const slug of ['number-counter','strike-and-replace','tilt-3d-page','error-retype','type-contrast-emphasis'])digest.update(fs.readFileSync(runtime+'/../adapters/talkcraft/full/cards/'+slug+'.tsx'));
digest.update(fs.readFileSync(runtime+'/../adapters/talkcraft/full/support.tsx'));
const hash=digest.digest('hex');
const proof=JSON.parse(fs.readFileSync(p+'/validation/stable-frame-qc.json'));
assert.equal(proof.status,'pass');assert.equal(proof.source_hash,hash);

// Derive only the approved visual layers. Never re-render the presenter/audio/captions.
let source=fs.readFileSync(p+'/Reference.tsx','utf8');
const first=source.indexOf('    <Layer from={96}');
const last=source.indexOf('    {caption&&');
assert(first>0&&last>first);
const layers=source.slice(first,last);
source=source.slice(0,source.indexOf('function Candidate()'))+
  'function Overlay() {\n  const t=useCurrentFrame()/30;\n  return <AbsoluteFill style={{fontFamily:font,background:"transparent"}}>\n'+layers+
  '  </AbsoluteFill>;\n}\nregisterRoot(()=> <Composition id="First20Overlay" component={Overlay} width={700} height={394} fps={30} durationInFrames={600}/>);\n';
assert.equal(source.split('left:62,top:226').length,2);
source=source.replace('left:62,top:226','left:0,top:0');
fs.mkdirSync(p+'/assembly',{recursive:true});
fs.writeFileSync(p+'/Overlay.tsx',source);
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const serveUrl=await bundle({entryPoint:p+'/Overlay.tsx',publicDir:p+'/assets',webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[runtime+'/node_modules','node_modules']}})});
const composition=await selectComposition({serveUrl,id:'First20Overlay',browserExecutable});
for(const frame of [132,206,249,295,414,530]){
  await renderStill({composition,serveUrl,frame,output:p+`/assembly/overlay-${frame}.png`,imageFormat:'png',browserExecutable});
}
let progressStep=-1;
await renderMedia({composition,serveUrl,outputLocation:p+'/assembly/first20-overlay.mov',codec:'prores',proResProfile:'4444',pixelFormat:'yuva444p10le',imageFormat:'png',muted:true,concurrency:3,browserExecutable,onProgress:({progress})=>{const step=Math.floor(progress*5)*20;if(step>progressStep){progressStep=step;console.log(`Overlay ${step}%`);}}});
const clips=[['number',96,151],['strike',159,263],['page',264,325],['retype',327,473],['wait',510,599]].map(([name,start,end])=>({name,start_frame:start,duration_frames:end-start,source_in:Math.round(start/30*1e6),left:62,top:226,width:700,height:394,muted:true}));
fs.writeFileSync(p+'/assembly/overlay-delivery.json',JSON.stringify({approved_source_hash:hash,reference_sha256:JSON.parse(fs.readFileSync(p+'/preview.json')).video_sha256,overlay_sha256:crypto.createHash('sha256').update(fs.readFileSync(p+'/assembly/first20-overlay.mov')).digest('hex'),file:p+'/assembly/first20-overlay.mov',fps:30,alpha:true,audio:false,clips},null,2)+'\n');
console.log('Approved layers rendered without presenter, captions or audio.');
