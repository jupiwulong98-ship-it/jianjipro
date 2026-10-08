import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
import {registry,resolvePlan,validateAssets,verifyVideo} from '../runtime-talkcraft/core.mjs';
const root=path.resolve(import.meta.dirname,'../..'),out=root+'/.cache/talkcraft-all',assets=out+'/assets';fs.mkdirSync(out+'/renders',{recursive:true});
const req=createRequire(root+'/motion-library/runtime-talkcraft/package.json');const {bundle}=req('@remotion/bundler');const {renderMedia,renderStill,selectComposition,openBrowser}=req('@remotion/renderer');
const fixtureText=s=>s.replace(/[\u3400-\u9fff]/g,(_,i)=>'测试文案'[i%4]);
const fromShape=s=>s.type==='array'?s.items.map(fromShape):s.type==='object'?Object.fromEntries(Object.entries(s.fields).filter(([,v])=>v.type!=='derived').map(([k,v])=>[k,fromShape(v)])):s.type==='string'?fixtureText(s.default):s.default;
const at=(o,p)=>p.reduce((v,k)=>v?.[k],o);
function set(o,p,v){let q=o;for(const k of p.slice(0,-1))q=q[k]??=(typeof p[p.indexOf(k)+1]==='number'?[]:{});q[p.at(-1)]=v;}
const old={
 'split-text-stagger':{text:'测试内容替换'},'keyword-pop-highlight':{keyword:'全部打通'},
 'title-demote-to-label':{title:'测试流程',items:['第一步','第二步','第三步']},
 'numbered-step-stack':{steps:[{no:'01',txt:'测试第一步'},{no:'02',txt:'测试第二步'},{no:'03',txt:'测试第三步'}]},
 'word-slot-cycle':{stem:'测试',words:['替换','核对','完成'],final:'测试完成'},
 'parallel-items-with-host':{items:['测试甲','测试乙','测试丙'],srcs:[0,1,2].map(i=>'asset:test-'+i+'.png'),layout:'vertical-strips',fullScreen:true},
 'quote-hold-arrow':{lines:['测试引语第一行','测试引语第二行','测试引语第三行']},'slow-push-in':{src:'asset:test-0.png'},
};
const shots=registry.map((card,i)=>{
 const c=card.contract;let props=old[card.slug];
 if(c){props={texts:Object.fromEntries(Object.entries(c.texts).map(([k,s])=>[k,fixtureText(s.example)])),media:Object.fromEntries(c.media.map(k=>[k,'asset:test-1.png'])),data:{},illustration:c.illustration_only||false};
  for(const k of c.native_props){if(['hostSrc'].includes(k))props[k]='asset:test.mp4';else if(/^(src|srcBefore|srcAfter|srcB|docSrc|avatar|handSrc)$/.test(k))props[k]=k==='src'&&['bed-echo-blur','split-60-40-story'].includes(card.slug)?'asset:test.mp4':'asset:test-2.png';else if(k==='srcs')props[k]=Array.from({length:c.native_media_count??6},(_,j)=>'asset:test-'+j%6+'.png');}
  for(const parts of c.numeric_bindings??[]){const top=parts[0];const full=fromShape(c.data[top]);if(Array.isArray(full))props.data[top]=full;else{let prefix=[top];let schema=c.data[top];for(const k of parts.slice(1)){schema=schema.type==='array'?schema.items[k]:schema.fields[k];prefix.push(k);if(schema.type==='array'){set(props.data,prefix,fromShape(schema));break;}if(prefix.length===parts.length)set(props.data,prefix,fromShape(schema));}}}
 }
 const duration=Math.max(card.min_frames,card.slug==='word-slot-cycle'?210:card.slug==='title-demote-to-label'?180:120);
 const shot={id:'qa-'+String(i+1).padStart(3,'0'),start_frame:0,duration_frames:duration,presentation_mode:'full_screen',layer:card.layer,primary_motion_request:{family:card.family,subtype:card.subtype,content:props},resolution:card.layer==='primary'?{primary_card:card.id}:{[card.layer]:{card_id:card.id}}};
 const plan=resolvePlan({project_id:'talkcraft-108-qa',fps:30,width:1920,height:1080,shots:[shot]});validateAssets(plan,assets);return plan.shots[0];
});
fs.writeFileSync(out+'/fixture-shots.json',JSON.stringify(shots,null,2));
if(process.argv.includes('--contracts')){console.log('All '+shots.length+' contracts resolved');process.exit(0);}
const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const serveUrl=await bundle({entryPoint:root+'/motion-library/runtime-talkcraft/Root.tsx',publicDir:assets,webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[root+'/motion-library/runtime-talkcraft/node_modules','node_modules']}})});

const results=fs.existsSync(out+'/verification.json')?JSON.parse(fs.readFileSync(out+'/verification.json')).results:[];
const hash=crypto.createHash('sha256').update(fs.readFileSync(root+'/motion-library/adapters/talkcraft/registry.json')).update(fs.readFileSync(root+'/motion-library/adapters/talkcraft/full/support.tsx')).digest('hex');
let next=0;
const persist=()=>fs.writeFileSync(out+'/verification.json',JSON.stringify({status:results.filter(r=>r.status==='pass'&&r.hash===hash).length===108?'pass':'in_progress',total:108,passed:results.filter(r=>r.status==='pass'&&r.hash===hash).length,fixture:'SYNTHETIC QA; not real project evidence',hash,results},null,2));
async function worker(){const browser=await openBrowser('chrome',{browserExecutable});try{while(next<shots.length){const shot=shots[next++],slug=shot.card.slug,dir=out+'/renders/'+slug;fs.mkdirSync(dir,{recursive:true});const prior=results.find(r=>r.slug===slug&&r.hash===hash&&r.status==='pass');if(prior&&fs.existsSync(dir+'/output.mov')){console.log(slug+': cached');continue;}
 const inputProps={shot,width:1920,height:1080};let result;
 try{const composition=await selectComposition({serveUrl,id:'TalkCraftShot',inputProps,puppeteerInstance:browser});
 const frames=[Math.min(20,shot.duration_frames-1),Math.floor(shot.duration_frames*.45),Math.floor(shot.duration_frames*.72),shot.duration_frames-1];
 for(let j=0;j<frames.length;j++)await renderStill({composition,serveUrl,inputProps,output:dir+'/'+j+'.png',frame:frames[j],imageFormat:'png',puppeteerInstance:browser});
 const changed={...shot,props:structuredClone(shot.props)};if(changed.props.media)for(const k of Object.keys(changed.props.media))changed.props.media[k]='asset:test-4.png';
 if(changed.props.texts)for(const k of Object.keys(changed.props.texts))changed.props.texts[k]=changed.props.texts[k].replace(/[\u3400-\u9fff]/g,'改');else if(changed.props.keyword)changed.props.keyword='替换验证';else if(changed.props.text)changed.props.text='内容已替换';else if(changed.props.src)changed.props.src='asset:test-3.png';else if(changed.props.title)changed.props.title='内容已替换';else if(changed.props.lines)changed.props.lines=['替换验证第一行','替换验证第二行','替换验证第三行'];else if(changed.props.steps)changed.props.steps[0].txt='替换验证';else if(changed.props.stem)changed.props.stem='改动';else if(changed.props.items)changed.props.items[0]='替换验证';
 const changedInput={...inputProps,shot:changed};const changedComposition=await selectComposition({serveUrl,id:'TalkCraftShot',inputProps:changedInput,puppeteerInstance:browser});
 await renderStill({composition:changedComposition,serveUrl,inputProps:changedInput,output:dir+'/changed.png',frame:frames[1],imageFormat:'png',puppeteerInstance:browser});
 await renderMedia({composition,serveUrl,inputProps,outputLocation:dir+'/output.mov',codec:'prores',proResProfile:'4444',pixelFormat:'yuva444p10le',imageFormat:'png',muted:true,concurrency:2,puppeteerInstance:browser});
 const video=verifyVideo(dir+'/output.mov',shot,{width:1920,height:1080});result={slug,card_id:shot.card.id,status:'pass',hash,frames,video,file:dir+'/output.mov',stills:frames.map((_,j)=>dir+'/'+j+'.png'),changed:dir+'/changed.png',duration_frames:shot.duration_frames};
 }catch(error){result={slug,status:'fail',hash,error:error.stack};}
 const index=results.findIndex(r=>r.slug===slug);if(index<0)results.push(result);else results[index]=result;persist();console.log(`${results.filter(r=>r.status==='pass'&&r.hash===hash).length}/108 ${slug}: ${result.status}${result.error?' '+result.error.split('\n')[0]:''}`);
}}finally{await browser.close({silent:true});}}
await Promise.all(Array.from({length:3},worker));persist();
