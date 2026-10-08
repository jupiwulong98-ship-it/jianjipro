import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const p=path.dirname(fileURLToPath(import.meta.url));const runtime=path.resolve(p,'../../../motion-library/runtime-talkcraft');
const require=createRequire(runtime+'/package.json');const {bundle}=require('@remotion/bundler');const {selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const command=process.argv[2]??'stills';
const hash=crypto.createHash('sha256').update(fs.readFileSync(p+'/Reference.tsx')).update(fs.readFileSync(p+'/reference-plan.json')).update(fs.readFileSync(p+'/assets/base.mp4')).digest('hex');
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const serveUrl=await bundle({entryPoint:p+'/Reference.tsx',publicDir:p+'/assets',webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[runtime+'/node_modules','node_modules']}})});
const composition=await selectComposition({serveUrl,id:'First20Reference',browserExecutable});
if(command==='stills'){
  const requested=process.argv[3]?.split(',').map(Number);
  for(const frame of requested??[60,98,105,117,126,145,153,295,455,585]){
    await renderStill({composition,serveUrl,frame,output:p+`/validation/frame-${frame}.png`,imageFormat:'png',browserExecutable,scale:.6666667});
    console.log('frame '+frame);
  }
  fs.writeFileSync(p+'/validation/source-hash.txt',hash);
}else if(command==='render'){
  const proof=JSON.parse(fs.readFileSync(p+'/validation/stable-frame-qc.json'));
  if(proof.source_hash!==hash||proof.status!=='pass')throw Error('当前候选未通过稳定帧检查');
  await renderMedia({composition,serveUrl,outputLocation:p+'/reference.mp4',codec:'h264',crf:19,pixelFormat:'yuv420p',concurrency:3,browserExecutable,onProgress:({progress})=>{if(Math.round(progress*100)%20===0)process.stdout.write(`\rRendering ${Math.round(progress*100)}%`);}});
  console.log('\nReference rendered: 600 frames, speech included.');
}else throw Error('Unknown command');
