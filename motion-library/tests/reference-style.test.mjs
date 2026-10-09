import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReferenceStyle,recommendReferenceStyle,newStyleSelection,validateStyleBindings,buildReferenceProductionBrief} from '../scripts/reference-style.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const load=()=>loadReferenceStyle(root,'styles/codex-six-skills-tech-v0.1/style-package.json');
const concept=()=>({project_id:'sample',concepts:[{
  event_id:'visual-01',visual_structure:'single_focus',spoken_text:'我用 Remotion 做软件演示，给你看录屏',
  meaning:'功能演示',visual_focus:'真正的界面',real_asset_need:'required'
}]});
function fixture() {
  const loaded=load(),concepts=concept();
  const recommended=recommendReferenceStyle(loaded,concepts);
  const selection=newStyleSelection(recommended,loaded.relativePath);
  selection.decisions[0]={concept_id:'visual-01',decision:'use_reference',pattern_id:'P05',medium:'mixed',
    reason:'真实操作画面加结论牌才符合参考的演示结构'};
  const style_reference={package_id:loaded.style.id,pattern_id:'P05',medium:'mixed'};
  const edit={events:[{id:'edit-01',visual_concept_id:'visual-01',style_reference}]};
  const shotbook={shots:[{id:'shot-01',clean_presenter:false,visual_concept_ids:['visual-01'],
    style_reference,asset_slots:[{required:true,asset_id:'user-remotion-screencast'}]}]};
  return {loaded,concepts,selection,edit,shotbook};
}
test('单参考风格保留实验状态，且关联原始参考事件',()=>{
  const loaded=load();
  assert.equal(loaded.style.status,'experimental');
  assert.equal(loaded.style.aspect_ratio,'16:9');
  assert.ok(loaded.patterns.get('P05').evidence_events.length>0);
});
test('新口播推荐只作为候选，不自动生成决策',()=>{
  const x=fixture(), recommended=recommendReferenceStyle(x.loaded,x.concepts);
  assert.ok(recommended.recommendations[0].candidates.some(x=>x.rule_id==='P05'));
  assert.equal(recommended.recommendations[0].status,'candidate_only');
  assert.equal(newStyleSelection(recommended,x.loaded.relativePath).decisions[0].decision,'pending');
});
test('风格来源必须贯通到Edit Plan与Shotbook，且含真实素材槽',()=>{
  const x=fixture();
  const report=validateStyleBindings(x);
  assert.equal(report.status,'pass');
  assert.equal(report.bindings[0].pattern_id,'P05');
  const altered=structuredClone(x.edit);
  delete altered.events[0].style_reference;
  assert.throws(()=>validateStyleBindings({...x,edit:altered}),/缺少风格来源/);
});
test('真实媒体缺失、未审核和版本失效会阻断',()=>{
  const x=fixture();x.shotbook.shots[0].asset_slots=[];
  assert.throws(()=>validateStyleBindings(x),/真实媒体/);
  const y=fixture();y.selection.decisions[0].decision='pending';
  assert.throws(()=>validateStyleBindings(y),/pending/);
  const z=fixture();z.selection.package_hash='stale';
  assert.throws(()=>validateStyleBindings(z),/版本失效/);
});
test('允许明确说明参考样式不匹配，而不是强套模板',()=>{
  const x=fixture();
  x.selection.decisions[0]={concept_id:'visual-01',decision:'no_match',pattern_id:null,medium:null,
    reason:'这一处只要人物表达情绪，不应该用对标演示模式'};
  const result=validateStyleBindings(x);
  assert.equal(result.selected_count,0);
  assert.equal(result.no_match_count,1);
});

test('制作交接单保留参考事件、真实素材和动效分层，而不是只存一个规则ID',()=>{
  const x=fixture(),brief=buildReferenceProductionBrief(x);
  assert.equal(brief.status,'planning_only');
  assert.equal(brief.shots.length,1);
  assert.equal(brief.shots[0].reference_pattern,'P05');
  assert.ok(brief.shots[0].reference_behavior);
  assert.ok(brief.shots[0].reference_timing);
  assert.ok(brief.shots[0].suggested_primitives.some(x=>x.includes('TechMediaTakeaway')));
  assert.ok(brief.shots[0].project_asset_slots[0].asset_id);
});
