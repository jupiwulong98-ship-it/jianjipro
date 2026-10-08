import fs from 'node:fs';
import path from 'node:path';
import {validatePlanningChain} from './style-contract.mjs';
import {reviewRhythm} from './rhythm-review.mjs';
import {resolvePlan} from '../runtime-talkcraft/core.mjs';

const [input,...flags]=process.argv.slice(2);
if(!input) throw new Error('用法：node scripts/style-review.mjs <project-dir | shotbook.json> [--out dir]');
const target=path.resolve(input);
const isProject=fs.statSync(target).isDirectory();
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const outIndex=flags.indexOf('--out');
const out=outIndex>=0?path.resolve(flags[outIndex+1]):isProject?path.join(target,'validation'):path.join(path.dirname(target),'validation');
const write=(file,value)=>fs.writeFileSync(path.join(out,file),JSON.stringify(value,null,2)+'\n');
fs.mkdirSync(out,{recursive:true});
let shotbook;
if(isProject) {
  const semantic=read(path.join(target,'semantic-map.json'));
  const concepts=read(path.join(target,'visual-concepts.json'));
  const edit=read(path.join(target,'edit-plan.json'));
  shotbook={...read(path.join(target,'shotbook.json')),visual_concepts:concepts};
  write('planning-contract.json',validatePlanningChain(semantic,concepts,edit,shotbook));
} else shotbook=read(target);
const framesIndex=flags.indexOf('--frames');
const frames=framesIndex>=0?read(path.resolve(flags[framesIndex+1])):null;
if(frames) {
  if(frames.project_id!==shotbook.project_id || !Array.isArray(frames.samples) || frames.samples.length<2) throw new Error('抽样来源不一致或不完整');
  if(shotbook.shots.some(s=>s.rhythm?.annotation_source!=='sampled_visual_observation' || !frames.samples.some(f=>f.shot_id===s.id))) throw new Error('Gate D需逐镜基于实际抽样观察标注，不能复用规划标注冒充视觉审阅');
}
const rhythm=reviewRhythm(shotbook,{stage:frames?'rendered':'shotbook',policy:shotbook.rhythm_policy??{}});
if(frames){rhythm.frame_evidence={source_kind:frames.source_kind,video:frames.video,sample_count:frames.sample_count,limitation:frames.limitation};}
write('rhythm-review.json',rhythm);
if(shotbook.visual_contract_version) {
  const base=isProject?target:path.dirname(target);
  const sourceAssets=path.resolve(base,shotbook.public_dir??'assets');
  write('resolved-plan.json',{...resolvePlan(shotbook),public_dir:path.relative(out,sourceAssets)});
}
console.log(`${shotbook.project_id}: Gate ${rhythm.gate} ${rhythm.status}, ${rhythm.issues.length} 个节奏提示；输出 ${out}`);
// needs_revision is a review result, not a process error. Rendering enforces signoff.
