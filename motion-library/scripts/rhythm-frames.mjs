import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {visualTimeline} from './rhythm-review.mjs';

export function sampleTimes(plan, interval=4) {
  if(!Number.isFinite(interval)||interval<=0) throw new Error('interval 必须为正数');
  const {rows,duration}=visualTimeline(plan);
  const times=new Set();
  const add=t=>times.add(Math.round(Math.max(0,Math.min(duration-.05,t))*1000)/1000);
  for(let t=.15;t<duration;t+=interval)add(t);
  for(const r of rows){add(r.start+(r.end-r.start)*.72);add(r.start+Math.min(.2,(r.end-r.start)*.1));}
  add(duration-.1);
  return [...times].sort((a,b)=>a-b);
}
const ffmpeg=args=>execFileSync('ffmpeg',['-v','error','-y',...args],{stdio:['ignore','ignore','pipe']});
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

export function extractRhythmFrames(plan, options) {
  const {rows,duration}=visualTimeline(plan);
  const out=path.resolve(options.out);
  fs.mkdirSync(out,{recursive:true});
  const legacy=options.legacyProject?path.resolve(options.legacyProject):null;
  const video=legacy?path.join(legacy,'sample/remotion/out/AI剪辑工具怎么选-多版式包装-v2.mov'):path.resolve(options.video);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video],{encoding:'utf8'}));
  const stream=probe.streams.find(s=>s.codec_type==='video');
  const videoDuration=Number(stream?.duration??probe.format?.duration);
  if(!stream||!Number.isFinite(videoDuration)||videoDuration<duration-.1)throw new Error('视频时长不足或未知，不能冒充完整整片抽样');
  if(!legacy && /^(yuva|rgba|argb|bgra|abgr|gbrap|ya)/.test(stream.pix_fmt))throw new Error('这是透明包装层；请提供人物、字幕、素材已经合成的完整视频');
  const times=sampleTimes(plan,options.interval??4);
  const cuts=legacy?read(path.join(legacy,'sample/remotion/src/cuts.json')):null;
  const publicDir=legacy?path.join(legacy,'sample/remotion/public'):null;
  const samples=[];
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jianjipro-rhythm-'));
  try {
    for(const [index,time] of times.entries()) {
      const row=rows.find(r=>time>=r.start && time<r.end);
      const file=`frame-${String(index).padStart(3,'0')}.jpg`;
      let inputs=['-ss',String(time),'-i',video], graph='[0:v]scale=480:270[base]';
      if(legacy) {
        const frame=Math.round(time*plan.fps);
        const cut=cuts.find(c=>c.from<=frame && frame<c.from+c.frames);
        if(!cut)throw new Error(`缺少初剪源帧映射：${time}`);
        const sourceTime=(cut.sourceFrame+frame-cut.from)/plan.fps;
        inputs=['-ss',String(sourceTime),'-i',path.join(publicDir,'source-normalized.mp4'),'-ss',String(time),'-i',video];
        graph='[0:v]setpts=PTS-STARTPTS,scale=640:360[a];[1:v]setpts=PTS-STARTPTS,scale=640:360[o];[a][o]overlay=0:0,scale=480:270[base]';
        // The old overlay deliberately leaves the B-roll centre transparent.
        const broll=row?.visual_subject==='real_asset'?(row.shot_id==='scene-07'?'typing-pixabay-6378.mp4':row.shot_id==='scene-10'?'editing-pixabay-26537.mp4':null):null;
        if(broll){
          inputs.push('-ss',String(2+time-row.start),'-i',path.join(publicDir,'broll',broll));
          graph='[2:v]setpts=PTS-STARTPTS,scale=1852:1042,crop=1852:940:0:51,scale=617:313[b];[0:v]setpts=PTS-STARTPTS,scale=640:360[a];[a][b]overlay=11:11[v];[1:v]setpts=PTS-STARTPTS,scale=640:360[o];[v][o]overlay=0:0,scale=480:270[base]';
        }
      }
      const label=`${time.toFixed(1)}s ${row?.shot_id??'gap'}`;
      graph+=`;[base]drawtext=text='${label}':fontcolor=white:fontsize=18:box=1:boxcolor=black@0.75:x=8:y=8[out]`;
      ffmpeg([...inputs,'-filter_complex',graph,'-map','[out]','-frames:v','1','-q:v','3',path.join(out,file)]);
      fs.copyFileSync(path.join(out,file),path.join(tmp,file));
      samples.push({time,shot_id:row?.shot_id??null,file});
    }
    ffmpeg(['-framerate','1','-i',path.join(tmp,'frame-%03d.jpg'),'-vf',`tile=6x${Math.ceil(samples.length/6)}`,'-frames:v','1',path.join(out,'contact-sheet.jpg')]);
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
  const sourceKind=legacy?'historical_v2_reconstructed_composites':'rendered_full_video';
  const manifest={version:'0.1',project_id:plan.project_id,gate:'D',status:'needs_visual_review',source_kind:sourceKind,
    video,source_size:fs.statSync(video).size,source_mtime:fs.statSync(video).mtime.toISOString(),duration,
    interval:options.interval??4,sample_count:samples.length,samples,
    limitation:legacy?'依据旧 v2 透明包装与真实初剪帧映射重建，仅用于历史画面诊断；未包含最终字幕/音效，不是新方案渲染，也不是当前 ChatCut 成片。':'抽样静帧不能证明动态节奏、阅读停留和声音通过，仍需整片播放。'};
  fs.writeFileSync(path.join(out,'frames-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="zh"><meta charset="utf-8"><title>整片节奏时间带</title><style>body{margin:24px;background:#101827;color:#eef;font-family:sans-serif}section{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}img{width:100%}figure{margin:0}figcaption{padding:6px}a{color:#aef}</style><h1>${escapeHtml(plan.project_id)} · 整片节奏时间带</h1><p>${escapeHtml(manifest.limitation)}</p><p>${samples.length} 帧，${duration.toFixed(1)} 秒，待视觉复核。</p><section>${samples.map(s=>`<figure><a href="${s.file}"><img src="${s.file}" loading="lazy"></a><figcaption>${s.time.toFixed(1)}s · ${escapeHtml(s.shot_id)}</figcaption></figure>`).join('')}</section></html>`);
  return manifest;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [input,...flags]=process.argv.slice(2);
  if(!input)throw new Error('用法：node scripts/rhythm-frames.mjs <shotbook.json> --video <成片> --out <dir> [--interval 4]；旧项目诊断使用 --legacy-project <dir>');
  const option=name=>{const i=flags.indexOf(name);return i<0?null:flags[i+1];};
  if(!option('--out')||(!option('--video')&&!option('--legacy-project')))throw new Error('必须指定视频来源和输出目录');
  const result=extractRhythmFrames(read(path.resolve(input)),{video:option('--video'),legacyProject:option('--legacy-project'),out:option('--out'),interval:Number(option('--interval')??4)});
  console.log(`Gate D: ${result.sample_count} 帧，${result.source_kind}，needs_visual_review`);
}
