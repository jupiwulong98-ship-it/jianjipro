import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {ensureBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {loadReferenceStyle} from '../scripts/reference-style.mjs';
import {validateReferenceMotionRequest,referenceMotionRegistry} from '../scripts/reference-motion-bindings.mjs';

const [input,...flags]=process.argv.slice(2);
if(!input)throw Error('用法: node render-reference.mjs <request.json> [--stills] [--out <file.mp4>]');
const flagsAt=name=>flags.includes(name)?flags[flags.indexOf(name)+1]:null;
const source=path.resolve(input);
const request=JSON.parse(fs.readFileSync(source,'utf8'));
const dir=path.dirname(source);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const loaded=loadReferenceStyle(root,request.style_package||'styles/codex-six-skills-tech-v0.3/style-package.json');
const binding=validateReferenceMotionRequest(request,loaded);
const outFile=path.resolve(flagsAt('--out')||path.join(dir,'renders',request.pattern_id+'.mp4'));
fs.mkdirSync(path.dirname(outFile),{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'jianji-reference-'));
const publicDir=path.join(temp,'public');fs.mkdirSync(publicDir);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let mediaInfo=null;
const props={...request.props,pattern_id:request.pattern_id,demoOnly:request.media_provenance==='qa_synthetic'};
try{
 if(referenceMotionRegistry[request.pattern_id].requireMedia){
   const src=path.resolve(dir,props.mediaSrc);
   if(!fs.existsSync(src)||!fs.statSync(src).isFile())throw Error('素材不存在：'+src);
   if(src===source)throw Error('素材不可为请求json');
   const ext=path.extname(src).toLowerCase();
   if(!['.png','.jpg','.jpeg','.webp','.svg','.mp4','.mov'].includes(ext))throw Error('素材格式不支持：'+ext);
   if(props.mediaType==='image' && !['.png','.jpg','.jpeg','.webp','.svg'].includes(ext))throw Error('mediaType与截图类型不符');
   if(props.mediaType==='video' && !['.mp4','.mov'].includes(ext))throw Error('mediaType与视频类型不符');
   props.mediaSrc='reference-source'+ext;
   fs.copyFileSync(src,path.join(publicDir,props.mediaSrc));
   mediaInfo={path:src,sha256:hash(src),type:props.mediaType};
 }
 await ensureBrowser({logLevel:'error'});
 const serveUrl=await bundle({entryPoint:path.join(path.dirname(fileURLToPath(import.meta.url)),'ReferenceRoot.tsx'),
   publicDir,webpackOverride:config=>({...config,resolve:{...config.resolve,modules:[
    path.join(path.dirname(fileURLToPath(import.meta.url)),'node_modules'),'node_modules']}})});
 const composition=await selectComposition({serveUrl,id:'ReferenceStyleShot',inputProps:props});
 const stills=[];
 for(const [label,at] of [['entry',.12],['stable',.65],['exit',.91]]){
   const dest=outFile.replace(/\.mp4$/i,'-'+label+'.png');
   await renderStill({serveUrl,composition,inputProps:props,output:dest,
     frame:Math.min(props.durationFrames-1,Math.round(props.durationFrames*at)),imageFormat:'png'});
   stills.push(dest);
 }
 if(!flags.includes('--stills')){
   await renderMedia({serveUrl,composition,inputProps:props,outputLocation:outFile,
     codec:'h264',crf:20,muted:true,concurrency:2});
 }
 const result={status:flags.includes('--stills')?'stills_only':'rendered_needs_visual_approval',
   version:1,style_package:loaded.style.id,pattern_id:request.pattern_id,
   component:binding.component,reference_event:request.reference_event,provenance:request.media_provenance,
   media:mediaInfo,output:flags.includes('--stills')?null:outFile,
   output_sha256:flags.includes('--stills')?null:hash(outFile),
   stills,frames:props.durationFrames,
   disclaimer:'真实渲染≠对标动态审美通过。QA样例中的软件画面必须替换为创作者自己真实的截图或录屏。'};
 const manifest=outFile.replace(/\.mp4$/i,'-evidence.json');
 fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({manifest,...result},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
