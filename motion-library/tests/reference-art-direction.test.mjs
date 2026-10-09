import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReferenceStyle,recommendReferenceStyle,newStyleSelection,validateStyleBindings,buildReferenceProductionBrief} from '../scripts/reference-style.mjs';
import {initialAssetIntent,validateArtDirection} from '../scripts/reference-art-direction.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const loaded=()=>loadReferenceStyle(root,'styles/codex-six-skills-tech-v0.2/style-package.json');
function fixture({pattern='P08',need='none'}={}) {
  const c={event_id:'v1',visual_structure:pattern==='P07'?'parallel':'sequence',
    spoken_text:pattern==='P07'?'图片、视频、音频都给你看真实结果':'一个创意变成分镜提示词',
    meaning:'新的表达任务',visual_focus:'观众直观理解',real_asset_need:need,
    evidence_need:need==='required'?'required':'none',asset_description:need==='required'?'本人的真实样例':'解释性插画'};
  const concepts={project_id:'test-art',concepts:[c]};
  const style=loaded(),recommendations=recommendReferenceStyle(style,concepts);
  const selection=newStyleSelection(recommendations,style.relativePath);
  const preferred=style.style.rules.find(x=>x.id===pattern).art_direction.preferred_background_mode;
  const real=pattern==='P07';
  Object.assign(selection.decisions[0],{decision:'use_reference',pattern_id:pattern,
    medium:real?'mixed':'diagram',reason:'参考事件要求媒介与背景同时对齐',
    background_mode:preferred,visual_media_kind:real?'real_output':'diagram',
    media_evidence:real?'real_verified':'illustration_declared'});
  const art_direction={background_mode:preferred,visual_media_kind:real?'real_output':'diagram',
    media_evidence:real?'real_verified':'illustration_declared'};
  const edit={events:[{id:'e1',visual_concept_id:'v1',
    style_reference:{package_id:style.style.id,pattern_id:pattern,medium:real?'mixed':'diagram'},
    art_direction}]};
  const shotbook={shots:[{id:'s1',clean_presenter:false,visual_concept_ids:['v1'],
    style_reference:{package_id:style.style.id,pattern_id:pattern,medium:real?'mixed':'diagram'},
    art_direction,
    asset_slots:real?[{required:true,status:'ready',asset_id:'actual-sample-video'}]:[]}]};
  const assetIntent=initialAssetIntent(concepts);
  return {loaded:style,concepts,selection,edit,shotbook,assetIntent};
}
test('P08从真实参考浅色插画中提取独立背景，不能一律使用深蓝',()=>{
  const x=fixture();
  const result=validateStyleBindings(x);
  assert.equal(result.art_direction_audit.status,'pass');
  assert.equal(result.art_direction_audit.decisions[0].background_mode,'light_explainer');
  assert.equal(result.art_direction_audit.background_distribution.light_explainer,1);
  x.selection.decisions[0].background_mode='dark_tech';
  x.edit.events[0].art_direction.background_mode='dark_tech';
  x.shotbook.shots[0].art_direction.background_mode='dark_tech';
  assert.throws(()=>validateStyleBindings(x),/背景\/媒介不符合/);
});
test('P07真实三媒介演示必须有实际例子，不能改为三个SVG',()=>{
  const x=fixture({pattern:'P07',need:'required'});
  assert.equal(validateStyleBindings(x).art_direction_audit.status,'pass');
  x.selection.decisions[0].visual_media_kind='diagram';
  x.selection.decisions[0].media_evidence='illustration_declared';
  x.edit.events[0].art_direction={...x.edit.events[0].art_direction,
    visual_media_kind:'diagram',media_evidence:'illustration_declared'};
  x.shotbook.shots[0].art_direction={...x.shotbook.shots[0].art_direction,
    visual_media_kind:'diagram',media_evidence:'illustration_declared'};
  assert.throws(()=>validateStyleBindings(x),/真实媒体|背景\/媒介不符合/);
});
test('即使no_match也不能把初始required偷偷改成none',()=>{
  const x=fixture({pattern:'P07',need:'required'});
  Object.assign(x.selection.decisions[0],{decision:'no_match',pattern_id:null,medium:null,
    reason:'改为原创新媒体演示'});
  delete x.edit.events[0].style_reference;
  delete x.shotbook.shots[0].style_reference;
  x.concepts.concepts[0].real_asset_need='none';
  assert.throws(()=>validateArtDirection({style:x.loaded.style,concepts:x.concepts,selection:x.selection,
    edit:x.edit,shotbook:x.shotbook,assetIntent:x.assetIntent}),/不得将最初required/);
});
test('导演决策必须进入Edit Plan及Shotbook，且非默认背景需要原因',()=>{
  const x=fixture();
  delete x.edit.events[0].art_direction;
  assert.throws(()=>validateStyleBindings(x),/art_direction未传递/);
  const y=fixture({pattern:'P07',need:'required'});
  y.selection.decisions[0].background_mode='light_explainer';
  y.edit.events[0].art_direction.background_mode='light_explainer';
  y.shotbook.shots[0].art_direction.background_mode='light_explainer';
  assert.throws(()=>validateStyleBindings(y),/逐镜理由/);
  y.selection.decisions[0].deviation_reason='此镜参考采用亮背景，以保证素材边框及内部画面可读';
  assert.equal(validateStyleBindings(y).art_direction_audit.status,'pass');
});
test('制作简报携带各镜背景媒介规则，仍保留参考来源信息',()=>{
  const x=fixture();
  const brief=buildReferenceProductionBrief(x);
  assert.equal(brief.shots[0].art_direction.background_mode,'light_explainer');
  assert.equal(brief.shots[0].rule_art_direction.preferred_background_mode,'light_explainer');
  assert.equal(brief.art_direction_audit.scope,'art_direction_planning_only_not_pixel_or_dynamic_review');
});
test('旧V0.1保持兼容，不使用V0.2的逐镜新字段也可按旧合同验证',()=>{
  const style=loadReferenceStyle(root,'styles/codex-six-skills-tech-v0.1/style-package.json');
  assert.equal(style.style.art_direction_contract,undefined);
  const original=fixture();
  const selected=original.selection;
  selected.package_id=style.style.id; selected.package_hash=style.hash;
  original.edit.events[0].style_reference.package_id=style.style.id;
  original.shotbook.shots[0].style_reference.package_id=style.style.id;
  const r=validateStyleBindings({...original,loaded:style,selection:selected});
  assert.equal(r.art_direction_audit.legacy,true);
});
