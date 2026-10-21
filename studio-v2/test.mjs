import crypto from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {inspect,preview,review,approve,produce,repository} from './core.mjs';
import {startServer} from './web.mjs';
function ff(args,cwd=repository){
  const p=spawnSync(args[0],args.slice(1),{cwd,encoding:'utf8',timeout:180000,maxBuffer:2048000});
  if(p.status!==0)throw Error(args.join(' ')+'\n'+(p.stderr||p.error?.message||'').slice(-1200));
}
function fixture() {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'studio-v2-'));
  fs.mkdirSync(path.join(temp,'studio'),{recursive:true});
  fs.copyFileSync(path.join(repository,'motion-library/public/review-projects/ai-tools-real-20260930/host.jpg'),path.join(temp,'host.jpg'));
  fs.copyFileSync(path.join(repository,'projects/chatgpt-settings-20261004/production/assets/screen-style.png'),path.join(temp,'screen.png'));
  ff(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-loop','1','-framerate','30','-i',path.join(temp,'host.jpg'),'-f','lavfi','-i','sine=frequency=220:sample_rate=48000','-t','6','-vf','scale=1280:720','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',path.join(temp,'talking.mp4')]);
  ff(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-f','lavfi','-i','sine=frequency=330:sample_rate=48000','-t','6',path.join(temp,'bed.wav')]);
  ff(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-f','lavfi','-i','sine=frequency=880:sample_rate=48000','-t','0.2',path.join(temp,'click.wav')]);
  const plan={version:1,source:{video:'talking.mp4'},assets:[{
    id:'ui-proof',kind:'screenshot',file:'screen.png',origin:'历史软件真实截图，仓库projects/chatgpt-settings-20261004，QA仅验证能力',checked_at:'2026-10-22',verified:true
  }],scenes:[
    {id:'s1',start:0,end:2,type:'presenter',layout:'full',assets:[],intent:'人物开场',visual:'先保留原真人',sound:'测试音轨，无音效'},
    {id:'s2',start:2,end:4,type:'evidence',layout:'split',music_state:'mute',assets:['ui-proof'],intent:'展示真正的软件',visual:'人居左图居右，不允许遮脸',sound:'保持声音'},
    {id:'s3',start:4,end:6,type:'evidence',layout:'full',music_state:'low',assets:['ui-proof'],intent:'阅读软件细节',visual:'全屏截图清晰停留',sound:'不加不必要的声音'}
  ],music:{file:'bed.wav',gain:0.03,license_confirmed:true},sfx:[{file:'click.wav',at:2,gain:0.08,license_confirmed:true}]};
  fs.writeFileSync(path.join(temp,'studio/plan.json'),JSON.stringify(plan,null,2));
  return {temp,plan,cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
}
test('两道确认门禁：素材与整片画面都看完才允许整片制作，修改真实图后旧确认失效',()=>{
 const f=fixture();try {
   const d=inspect(f.temp);assert.equal(d.duration,6);
   assert.throws(()=>produce(f.temp),/先在网页确认/);
   const pv=preview(f.temp);assert.equal(pv.scenes,3);
   assert.ok(fs.existsSync(path.join(f.temp,'studio/previews/s2.jpg')));
   assert.ok(fs.existsSync(path.join(f.temp,'studio/previews/s2.m4a')));
   approve(f.temp,'assets',d.binding);
   assert.equal(review(f.temp).assets_approved,true);
   assert.equal(review(f.temp).visual_approved,false);
   assert.throws(()=>produce(f.temp),/确认/);
   approve(f.temp,'visual',d.binding);
   const done=produce(f.temp);
   assert.equal(done.status,'rendered_pending_visual_audio_review');
   assert.ok(fs.statSync(path.join(f.temp,done.output)).size>10000);
   const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','csv=p=0',path.join(f.temp,done.output)],{encoding:'utf8'});
   assert.match(p.stdout,/video/);assert.match(p.stdout,/audio/);
   assert.equal(done.human_visual_audio_review,'pending');
   const output=path.join(repository,'studio-v2/qa-output');fs.mkdirSync(output,{recursive:true});
   fs.copyFileSync(path.join(f.temp,done.output),path.join(output,'test-final.mp4'));
   fs.copyFileSync(path.join(f.temp,'studio/previews/s2.jpg'),path.join(output,'test-split-preview.jpg'));
   fs.copyFileSync(path.join(f.temp,'studio/previews/s3.jpg'),path.join(output,'test-full-preview.jpg'));
   fs.copyFileSync(path.join(f.temp,'studio/output/report.json'),path.join(output,'report.json'));
   // Source asset bytes changed, so the same reviewer cannot silently approve old visuals.
   fs.appendFileSync(path.join(f.temp,'screen.png'),'changed');
   assert.equal(review(f.temp).assets_approved,false);assert.equal(review(f.temp).visual_approved,false);
   assert.throws(()=>produce(f.temp),/先在网页确认/);
 }finally{f.cleanup();}
});
test('真实证据不能用假占位、破损路径或错误录屏替代',()=>{
  const f=fixture();try{
    f.plan.assets[0].verified=false;fs.writeFileSync(path.join(f.temp,'studio/plan.json'),JSON.stringify(f.plan));
    assert.throws(()=>inspect(f.temp),/未真实核验/);
    f.plan.assets[0].verified=true;f.plan.assets[0].file='../outside.png';
    fs.writeFileSync(path.join(f.temp,'studio/plan.json'),JSON.stringify(f.plan));
    assert.throws(()=>inspect(f.temp),/禁止项目外路径/);
    f.plan.assets[0].file='screen.png';f.plan.assets[0].kind='screenrecord';f.plan.scenes[1].type='screenrecord';
    fs.writeFileSync(path.join(f.temp,'studio/plan.json'),JSON.stringify(f.plan));
    assert.throws(()=>inspect(f.temp),/录屏必须是实际视频/);
  }finally{f.cleanup();}
});
test('真实网页接受两次全片预制作确认，拒绝旧版本，且静帧服务以真实素材为来源',async()=>{
 const f=fixture();const server=startServer(f.temp,{port:0});
 await new Promise(r=>server.listening?r():server.once('listening',r));
 const endpoint='http://127.0.0.1:'+server.address().port;
 try{
   preview(f.temp);
   const home=await fetch(endpoint);assert.equal(home.status,200);assert.match(home.headers.get('content-type'),/text\/html/);
   assert.match(await home.text(),/先看真实素材/);
   const first=await(await fetch(endpoint+'/api/board')).json();
   assert.equal(first.scenes.length,3);assert.equal(first.assets.length,1);
   const image=await fetch(endpoint+'/media?f='+encodeURIComponent('studio/previews/s2.jpg'));
   assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/jpeg/);
   const voice=await fetch(endpoint+'/media?f='+encodeURIComponent('studio/previews/s2.m4a'));
   assert.equal(voice.status,200);assert.match(voice.headers.get('content-type'),/audio\/mp4/);
   const bad=await fetch(endpoint+'/api/review',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({binding:'stale',action:'assets'})});
   assert.equal(bad.status,409);
   const ok=await fetch(endpoint+'/api/review',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({binding:first.binding,action:'assets'})});assert.equal(ok.status,200);
   const ok2=await fetch(endpoint+'/api/review',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({binding:first.binding,action:'visual'})});assert.equal(ok2.status,200);
   const r=await(await fetch(endpoint+'/api/board')).json();assert.equal(r.review.assets_approved,true);assert.equal(r.review.visual_approved,true);
 }finally{await new Promise(r=>server.close(r));f.cleanup();}
});


test('自定义动态分镜可在素材批准后提供，必须验证成片SHA及剪后时长，不允许静默降级成PPT',()=>{
 const f=fixture();try{
   f.plan.scenes[1].render_mode='custom';
   f.plan.scenes[2].focus={x:0.25,y:0.14,w:0.65,h:0.70};
   fs.writeFileSync(path.join(f.temp,'studio/plan.json'),JSON.stringify(f.plan,null,2));
   const d=inspect(f.temp);preview(f.temp);
   approve(f.temp,'assets',d.binding);approve(f.temp,'visual',d.binding);
   assert.throws(()=>produce(f.temp),/manifest.json/);
   fs.mkdirSync(path.join(f.temp,'studio/renders'),{recursive:true});
   const motion=path.join(f.temp,'studio/renders/s2.mp4');
   ff(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-ss','2','-t','2','-i',path.join(f.temp,'talking.mp4'),'-an','-c:v','libx264','-preset','ultrafast',motion]);
   
   const digest=crypto.createHash('sha256').update(fs.readFileSync(motion)).digest('hex');
   fs.writeFileSync(path.join(f.temp,'studio/renders/manifest.json'),JSON.stringify({binding:d.binding,clips:{s2:digest}}));
   const done=produce(f.temp);
   assert.equal(done.stages[1].renderer,'custom-validated-render');
   assert.equal(done.status,'rendered_pending_visual_audio_review');
   fs.writeFileSync(path.join(f.temp,'studio/renders/manifest.json'),JSON.stringify({binding:'old',clips:{s2:digest}}));
   assert.throws(()=>produce(f.temp),/旧素材或旧画面方案/);
 }finally{f.cleanup();}
});
