import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const fail = msg => { throw new Error('reference-style: ' + msg); };
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const present = x => typeof x === 'string' && x.trim().length > 0;

export function loadReferenceStyle(root, rel) {
  const filename = path.resolve(root, rel);
  if (!filename.startsWith(path.resolve(root) + path.sep)) fail('风格包不在仓库内');
  const style = read(filename);
  if (style.version !== 1 || style.status !== 'experimental' || !present(style.id) ||
    !Array.isArray(style.rules) || !present(style.pattern_source)) fail('风格包格式无效');
  const source = read(path.resolve(path.dirname(filename), style.pattern_source));
  if (!Array.isArray(source.patterns)) fail('缺少对标来源规则');
  const patterns = new Map(source.patterns.map(p => [p.pattern_id, p]));
  const ids = new Set();
  for (const rule of style.rules) {
    if (!present(rule.id) || ids.has(rule.id) || !patterns.has(rule.id)) fail('规则ID不存在或重复: '+rule.id);
    ids.add(rule.id);
    if (!Array.isArray(rule.mediums) || !rule.mediums.length ||
      !Array.isArray(rule.structures) || !Array.isArray(rule.hints) || !present(rule.visual_goal)) fail('规则缺少可执行信息: '+rule.id);
    if (!patterns.get(rule.id).evidence_events?.length) fail('缺少参考事件: '+rule.id);
  }
  return {style, patterns, hash:digest({style,source}), relativePath:path.relative(root,filename)};
}

export function recommendReferenceStyle(loaded, concepts) {
  if (!Array.isArray(concepts?.concepts)) fail('缺少画面构思');
  const {style,patterns,hash} = loaded;
  const recommendations = concepts.concepts.map(c => {
    const t = [c.spoken_text,c.meaning,c.visual_focus].join(' ').toLowerCase();
    const matches = style.rules.map(rule => {
      const tokens = rule.hints.filter(h=>t.includes(String(h).toLowerCase()));
      const structureMatch = rule.structures.includes(c.visual_structure);
      const score = (structureMatch ? 4 : 0) + 2*Math.min(tokens.length,3);
      return {rule_id:rule.id,score,reason:(structureMatch ? ['语义结构相容'] : []).concat(tokens.map(h=>'口播: '+h)),
        visual_goal:rule.visual_goal,mediums:rule.mediums,assets:rule.assets,
        reference_events:patterns.get(rule.id).evidence_events};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score || a.rule_id.localeCompare(b.rule_id)).slice(0,3);
    return {concept_id:c.event_id,spoken_text:c.spoken_text,visual_structure:c.visual_structure,
      status:'candidate_only',candidates:matches};
  });
  return {version:1,package_id:style.id,package_hash:hash,concept_hash:digest(concepts),
    notice:'建议仅供审片人员选择，不自动确定视觉媒介或模板，禁止用示意代替真实软件画面。',
    recommendations};
}

export function newStyleSelection(recommendations, relativePath) {
  return {version:1,package_path:relativePath,package_id:recommendations.package_id,
    package_hash:recommendations.package_hash,concept_hash:recommendations.concept_hash,
    decisions:recommendations.recommendations.map(x=>({concept_id:x.concept_id,decision:'pending',
      pattern_id:null,medium:null,reason:''}))};
}

export function validateStyleBindings({loaded,concepts,selection,edit,shotbook}) {
  const {style,patterns,hash} = loaded;
  if (!selection || selection.version!==1 || selection.package_id!==style.id ||
      selection.package_hash!==hash || selection.concept_hash!==digest(concepts))
    fail('风格选择版本失效，须复核后重新生成');
  const decisions=selection.decisions||[], byId=new Map();
  for (const d of decisions) {
    if (!present(d.concept_id) || byId.has(d.concept_id)) fail('重复或缺失概念ID');
    byId.set(d.concept_id,d);
  }
  if (byId.size!==concepts.concepts.length) fail('风格选择未覆盖全部画面概念');
  const rules=new Map(style.rules.map(r=>[r.id,r]));
  const bindings=[];
  for (const c of concepts.concepts) {
    const decision=byId.get(c.event_id);
    if (!decision || !present(decision.reason)) fail(c.event_id+' 尚未完成选择并说明理由');
    if (decision.decision==='no_match') {
      if(decision.pattern_id!==null || decision.medium!==null) fail(c.event_id+' 不匹配必须置空引用');
      continue;
    }
    if(decision.decision!=='use_reference') fail(c.event_id+' 仍处于 pending 状态');
    const rule=rules.get(decision.pattern_id);
    if(!rule || !rule.mediums.includes(decision.medium)) fail(c.event_id+' 规则/视觉媒介无效');
    const needsAsset = rule.assets==='real_media_required';
    if(needsAsset && c.real_asset_need!=='required') fail(c.event_id+' 必须申请真实媒体');
    const expected={package_id:style.id,pattern_id:decision.pattern_id,medium:decision.medium};
    const events=edit?.events?.filter(e=>e.visual_concept_id===c.event_id)||[];
    if(edit && !events.length) fail(c.event_id+' 未进入 Edit Plan');
    for (const e of events) for (const [k,v] of Object.entries(expected))
      if(e.style_reference?.[k]!==v) fail(e.id+' 缺少风格来源引用');
    const shots=shotbook?.shots?.filter(s=>!s.clean_presenter && s.visual_concept_ids?.includes(c.event_id))||[];
    if(shotbook && !shots.length) fail(c.event_id+' 未进入 Shotbook');
    for(const s of shots) {
      for(const [k,v] of Object.entries(expected))
        if(s.style_reference?.[k]!==v) fail(s.id+' 风格来源未传递到 Shotbook');
      if(needsAsset && !s.asset_slots?.some(a=>a.required===true && present(a.asset_id||a.path||a.source)))
        fail(s.id+' 缺少可追踪的真实媒体素材槽');
    }
    bindings.push({concept_id:c.event_id,...expected,reference_events:patterns.get(decision.pattern_id).evidence_events,
      requires_real_media:needsAsset});
  }
  return {status:'pass',project_id:concepts.project_id,style_id:style.id,selected_count:bindings.length,
    no_match_count:decisions.length-bindings.length,bindings,
    limitation:'规划引用通过，不代表模板已实现、素材真实可用或动态审美已通过。'};
}

export function readProjectStyle(projectDir, root) {
  const filename=path.join(projectDir,'style-selection.json');
  if(!fs.existsSync(filename)) return null;
  const selection=read(filename);
  if(!present(selection.package_path)) fail('style-selection.json 缺少 package_path');
  return {...loadReferenceStyle(root,selection.package_path),selection};
}

export const readReferenceJson=read;
