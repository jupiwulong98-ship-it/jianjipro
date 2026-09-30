import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readReview, mutateReview} from './review-store.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root,'src/review/project.json');
export function reviewApiPlugin() {
  function middleware(req, res, next) {
    if (!req.url?.startsWith('/api/project-review/')) return next();
    const project = JSON.parse(fs.readFileSync(dataFile,'utf8'));
    const route = `/api/project-review/${project.id}`;
    const send = (status, data) => {res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
    if (req.url.split('?')[0] !== route) return send(404,{error:'项目不存在'});
    const file = path.resolve(root,'../projects',project.id,'review.json');
    if (req.method === 'GET') {try {return send(200,readReview(file));} catch {return send(500,{error:'意见文件读取失败，请保留文件并检查内容。'});}}
    if (req.method !== 'POST') return send(405,{error:'方法不支持'});
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` || req.headers['sec-fetch-site'] === 'cross-site') return send(403,{error:'请从本机看板提交'});
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'请求必须是 JSON'});
    let body=''; let ended=false;
    req.on('data',chunk => {body+=chunk; if (Buffer.byteLength(body)>8192 && !ended) {ended=true;send(413,{error:'意见过长'});}});
    req.on('end',() => {
      if (ended) return;
      try {send(200,mutateReview(file,project.shots.map(s => s.id),JSON.parse(body)));}
      catch(error) {send(error.status ?? 400,{error:error.message});}
    });
  }
  return {name:'jianjipro-project-review',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
