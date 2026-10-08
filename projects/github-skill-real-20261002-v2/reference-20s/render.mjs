import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const p=path.dirname(fileURLToPath(import.meta.url));const runtime=path.resolve(p,'../../../motion-library/runtime-talkcraft');
const require=createRequire(runtime+'/package.json');const {bundle}=require('@remotion/bundler');const {selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const command=process.argv[2]??'stills';
const digest=crypto.createHash('sha256');
for(const file of ['Reference.tsx','reference-plan.json','template-selection.json','templates/number-counter.tsx','assets/base.mp4','assets/search-codex.png'])digest.update(fs.readFileSync(p+'/'+file));
for(const slug of ['number-counter','strike-and-replace','tilt-3d-page','error-retype','type-contrast-emphasis'])digest.update(fs.readFileSync(runtime+'/../adapters/talkcraft/full/cards/'+slug+'.tsx'));
digest.update(fs.readFileSync(runtime+'/../adapters/talkcraft/full/support.tsx'));
const hash=digest.digest('hex');
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const serveUrl=await bundle({entryPoint:p+'/Reference.tsx',publicDir:p+'/assets',webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[runtime+'/node_modules','node_modules']}})});
const composition=await selectComposition({serveUrl,id:'First20Reference',browserExecutable});
if(command==='stills'){
  const requested=process.argv[3]?.split(',').map(Number);
  for(const frame of requested??[105,126,195,206,249,295,339,366,414,455,530,585]){
    await renderStill({composition,serveUrl,frame,output:p+`/validation/frame-${frame}.png`,imageFormat:'png',browserExecutable,scale:.6666667});
    console.log('frame '+frame);
  }
  fs.writeFileSync(p+'/validation/source-hash.txt',hash);
}else if(command==='render'){
  const proof=JSON.parse(fs.readFileSync(p+'/validation/stable-frame-qc.json'));
  if(proof.source_hash!==hash||proof.status!=='pass')throw Error('当前候选未通过稳定帧检查');
  let lastProgress=-1;
  await renderMedia({composition,serveUrl,outputLocation:p+'/reference.mp4',codec:'h264',crf:19,pixelFormat:'yuv420p',concurrency:3,browserExecutable,onProgress:({progress})=>{const step=Math.floor(progress*5)*20;if(step>lastProgress){lastProgress=step;console.log(`Rendering ${step}%`);}}});
  console.log('\nReference rendered: 600 frames, speech included.');
}else throw Error('Unknown command');
