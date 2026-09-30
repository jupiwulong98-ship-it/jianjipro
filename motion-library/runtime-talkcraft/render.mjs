import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {catalog, runtimeDir, resolvePlan, validateAssets, fingerprint, deliveryManifest, verifyVideo} from './core.mjs';

const [command, input, ...flags] = process.argv.slice(2);
if (command === 'list') {
  const term = input ?? '';
  console.log(JSON.stringify(catalog.filter(c => `${c.title} ${c.slug} ${c.semantics.join(' ')}`.includes(term))
    .map(c => ({id:'talkcraft:'+c.slug,title:c.title,semantics:c.semantics,production_adapter:!!c.adapter,hardcoded_demo:c.hardcoded})),null,2));
} else if (['resolve','render'].includes(command) && input) {
  const planFile = path.resolve(input);
  const source = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  const plan = resolvePlan(source);
  const publicDir = path.resolve(path.dirname(planFile), source.public_dir ?? 'assets');
  validateAssets(plan, publicDir);
  const out = path.join(path.dirname(planFile), 'renders');
  fs.mkdirSync(out, {recursive:true});
  fs.writeFileSync(path.join(out,'resolved-plan.json'),JSON.stringify(plan,null,2)+'\n');
  if (command === 'resolve') console.log(`已解析 ${plan.shots.length} 个镜头：${out}/resolved-plan.json`);
  else {
    const stillOnly = flags.includes('--stills');
    const serveUrl = await bundle({entryPoint:path.join(runtimeDir,'Root.tsx'),publicDir,
      webpackOverride: config => ({...config,resolve:{...config.resolve,modules:[path.join(runtimeDir,'node_modules'),'node_modules']}})});
    const cacheFile = path.join(out,'cache.json');
    const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile,'utf8')) : {};
    const results = [];
    for (const shot of plan.shots) {
      if (!shot.card) continue;
      const hash = fingerprint(shot,plan,publicDir);
      const file = path.join(out,`${shot.id}-${hash.slice(0,12)}.mov`);
      const still = path.join(out,`${shot.id}-${hash.slice(0,12)}.png`);
      const inputProps = {shot,theme:plan.theme,width:plan.width,height:plan.height};
      const browserExecutable = process.env.JIANJIPRO_BROWSER || undefined;
      const composition = await selectComposition({serveUrl,id:'TalkCraftShot',inputProps,browserExecutable});
      if (!fs.existsSync(still)) await renderStill({composition,serveUrl,output:still,inputProps,
        frame:Math.min(shot.duration_frames-1,Math.round(shot.duration_frames*.72)),imageFormat:'png',browserExecutable});
      let cached = cache[shot.id]?.hash === hash && fs.existsSync(file);
      if (cached) {try {verifyVideo(file,shot,plan);} catch {cached = false;}}
      if (!stillOnly && !cached) {
        const partial = file.replace(/\.mov$/,'.partial.mov');
        await renderMedia({composition,serveUrl,outputLocation:partial,inputProps,codec:'prores',proResProfile:'4444',
          pixelFormat:'yuva444p10le',imageFormat:'png',muted:true,concurrency:2,browserExecutable});
        const verification = verifyVideo(partial,shot,plan);
        fs.renameSync(partial,file);
        cache[shot.id] = {hash,file,verification};
        fs.writeFileSync(cacheFile,JSON.stringify(cache,null,2)+'\n');
      }
      if (!stillOnly) results.push({shot_id:shot.id,file,hash,start_frame:shot.start_frame,duration_frames:shot.duration_frames});
      console.log(`${shot.id}: ${stillOnly?'代表帧':cached?'复用缓存':'已渲染'} ${stillOnly?still:file}`);
    }
    if (!stillOnly) fs.writeFileSync(path.join(out,'chatcut-delivery.json'),JSON.stringify(deliveryManifest(plan,results),null,2)+'\n');
  }
} else {
  console.error('用法：node render.mjs list [关键词] | resolve <plan.json> | render <plan.json> [--stills]');
  process.exitCode = 1;
}
