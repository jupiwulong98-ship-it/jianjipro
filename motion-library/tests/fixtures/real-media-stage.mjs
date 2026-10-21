import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const project=process.cwd();
const stage=process.argv[2];
const file=p=>path.join(project,'production',p);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function exec(cmd,args){
  const r=spawnSync(cmd,args,{cwd:project,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
  if(r.status!==0)throw Error(cmd+' failed ('+r.status+'): '+(r.stderr||r.error?.message||'').slice(-2200));
  return r.stdout;
}
const ff=(...args)=>exec('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y',...args]);
const probe=name=>JSON.parse(exec('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file(name)]));
const video='video.mp4', motion='motion.mp4', audio='mixed.wav', final='final.mp4';
if(stage==='rough_cut'){
  ff('-loop','1','-framerate','15','-i',file('assets/presenter.jpg'),'-f','lavfi','-i','sine=frequency=220:sample_rate=48000',
  '-t','6','-vf','scale=640:360,format=yuv420p','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',file(video));
}else if(stage==='motion'){
  ff('-i',file(video),'-loop','1','-i',file('assets/real-screen.png'),
  '-filter_complex'," [1:v]scale=360:220[ui];[0:v][ui]overlay=x=260:y=70:enable='between(t,2,5)'[v]".trim(),
  '-map','[v]','-map','0:a:0','-t','6','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','copy',file(motion));
}else if(stage==='audio'){
  ff('-i',file(video),'-vn','-af','highpass=f=80,volume=0.55','-c:a','pcm_s16le',file(audio));
}else if(stage==='assemble'){
  ff('-i',file(motion),'-i',file(audio),'-map','0:v:0','-map','1:a:0',
  '-c:v','copy','-c:a','aac','-b:a','96k','-shortest',file(final));
}else if(stage==='qc'){
  const p=probe(final), v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
  const d=Number(p.format.duration);
  ff('-ss','1','-i',file(final),'-frames:v','1',file('frame-before.png'));
  ff('-ss','3','-i',file(final),'-frames:v','1',file('frame-after.png'));
  const changes=sha(file('frame-before.png'))!==sha(file('frame-after.png'));
  const checks={sync:d>=5.7&&d<=6.2&&!!a, evidence:changes,
    readability:!!v&&v.width===640&&v.height===360,audio:!!a,full_video_review:changes&&d>=5.7&&d<=6.2};
  const report={status:Object.values(checks).every(Boolean)?'pass':'fail',
    ...Object.fromEntries(Object.entries(checks).map(([k,ok])=>[k,ok?'pass':'fail'])),
    scope:'QA-only: technical 6-second render, NOT user footage or aesthetic review',
    duration_seconds:d,video:{width:v?.width,height:v?.height,codec:v?.codec_name},
    audio_stream_present:!!a,asset_visible_in_comparison:changes,
    file_sha256:sha(file(final))};
  fs.writeFileSync(file('qc-report.json'),JSON.stringify(report,null,2));
  if(report.status!=='pass')process.exitCode=1;
}else throw Error('unknown test stage '+stage);
