import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {inspect,review,approve,fileInside,mediaType,repository} from './core.mjs';

function json(res,status,data){const b=Buffer.from(JSON.stringify(data));res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':b.length,'Cache-Control':'no-store'});res.end(b);}
function serveMedia(req,res,file) {
  const size=fs.statSync(file).size;let start=0,end=size-1,status=200;
  if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if(!m){res.writeHead(416,{'Content-Range':'bytes */'+size});return res.end();}
    start=Number(m[1]);end=m[2]?Math.min(size-1,Number(m[2])):size-1;
    if(start>=size||start>end){res.writeHead(416,{'Content-Range':'bytes */'+size});return res.end();}
    status=206;
  }
  const headers={'Content-Type':mediaType(file),'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store'};
  if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;
  res.writeHead(status,headers);
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
}
export function startServer(dir,{port=3038,autoProduce=false}={}) {
  let running=false;
  function status(){
    try{return JSON.parse(fs.readFileSync(fileInside(dir,'studio/output/report.json'),'utf8'));}
    catch{return {status:running?'running':'not_started'};}
  }
  function maybeStart(){
    if(!autoProduce||running)return;
    const d=inspect(dir),r=review(dir,d);
    if(!(r.assets_approved&&r.visual_approved))return;
    const existing=status();if(existing.binding===d.binding&&['running','rendered_pending_visual_audio_review'].includes(existing.status))return;
    running=true;
    const child=spawn(process.execPath,[path.join(import.meta.dirname,'cli.mjs'),'produce','--project',path.basename(dir)],{cwd:repository,stdio:'inherit',env:process.env});
    child.on('close',code=>{running=false;console.log('自动剪辑退出码',code);});
    child.on('error',e=>{running=false;console.error(e);});
  }
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost'),route=url.pathname;
    try{
      if(route==='/'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return fs.createReadStream(fileInside(repository,'studio-v2/board.html')).pipe(res);}
      if(route==='/media'&&['GET','HEAD'].includes(req.method)){
        const rel=url.searchParams.get('f');
        if(!rel||!/\.(png|jpe?g|webp|mp4|mov|wav|m4a|mp3)$/i.test(rel))return json(res,400,{error:'不支持的媒体'});
        const d=inspect(dir),allowed=new Set([...d.plan.assets.map(x=>x.file),d.plan.source.video,
          ...d.plan.scenes.map(x=>'studio/previews/'+x.id+'.jpg')]);
        if(!allowed.has(rel))return json(res,403,{error:'不是本次授权查看的素材'});
        return serveMedia(req,res,fileInside(dir,rel));
      }
      if(route==='/api/status'&&req.method==='GET')return json(res,200,status());
      if(route==='/api/board'&&req.method==='GET'){
        const d=inspect(dir);let preview;
        try{preview=JSON.parse(fs.readFileSync(fileInside(dir,'studio/preview-status.json'),'utf8'));}
        catch{}
        if(preview?.binding!==d.binding)return json(res,409,{error:'素材或方案已更新，请 Codex 重新执行 preflight'});
        return json(res,200,{binding:d.binding,assets:[...d.assets.values()].map(({full,digest,...x})=>x),
          scenes:d.plan.scenes,review:review(dir,d),production:status()});
      }
      if(route==='/api/review'&&req.method==='POST'){
        if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host)return json(res,403,{error:'仅接受当前本地页面'});
        if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'请使用JSON'});
        let raw='',tooLong=false;
        req.on('data',part=>{raw+=part;if(raw.length>8192){tooLong=true;req.destroy();}});
        return req.on('end',()=>{
          if(tooLong)return;
          try{const body=JSON.parse(raw);const saved=approve(dir,body.action,body.binding,body.comment);
            json(res,200,saved);maybeStart();
          }catch(e){json(res,409,{error:e.message});}
        });
      }
      return json(res,404,{error:'未找到'});
    }catch(e){return json(res,400,{error:e.message});}
  });
  server.listen(port,'127.0.0.1',()=>console.log('素材与画面审阅：http://127.0.0.1:'+server.address().port));
  return server;
}
