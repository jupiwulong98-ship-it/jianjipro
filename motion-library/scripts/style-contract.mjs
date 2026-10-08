// Shared by planning validation and the existing TalkCraft resolver.
export const structures = ['not_equal','sequence','parallel','center_branches','one_to_many','before_after',
  'input_process_output','comparison','hierarchy','timeline','decision_tree','single_focus','custom'];
const assert = (ok, message) => {if (!ok) throw new Error(message);};
const nonempty = x => typeof x === 'string' && x.trim().length > 0;
const oneOf = (x, values, name) => assert(values.includes(x), `${name} 无效`);

export function validateConcepts(document, semanticMap) {
  assert(nonempty(document?.project_id) && Array.isArray(document.concepts), '缺少 project_id / concepts');
  if (semanticMap) assert(document.project_id === semanticMap.project_id, 'Semantic Map 项目不一致');
  const ids = new Set();
  for (const c of document.concepts) {
    assert(nonempty(c.event_id) && !ids.has(c.event_id), '画面概念 event_id 缺失或重复'); ids.add(c.event_id);
    for (const key of ['spoken_text','meaning','visual_concept','structure_description','visual_focus'])
      assert(nonempty(c[key]), `${c.event_id}: 缺少 ${key}`);
    assert(Number.isFinite(c.start) && Number.isFinite(c.end) && c.start >= 0 && c.end > c.start, `${c.event_id}: 时间范围无效`);
    assert(Array.isArray(c.source_segment_ids) && c.source_segment_ids.length > 0 && c.source_segment_ids.every(nonempty), `${c.event_id}: 缺少语义来源`);
    const checkTemplateLeak = value => {
      if (typeof value === 'string') assert(!/talkcraft:|card_id|primary_card/.test(value), `${c.event_id}: 画面构思不得指定卡片`);
      else if (value && typeof value === 'object') for (const [k,v] of Object.entries(value)) {
        assert(!['card_id','primary_card','family','subtype','templateIds'].includes(k), `${c.event_id}: 画面构思不得包含 ${k}`);
        checkTemplateLeak(v);
      }
    };
    checkTemplateLeak(c);
    oneOf(c.visual_structure, structures, 'visual_structure');
    oneOf(c.presentation, ['presenter_safe','full_screen','either'], 'presentation');
    oneOf(c.real_asset_need, ['required','recommended','none'], 'real_asset_need');
    assert(c.real_asset_need === 'none' || nonempty(c.asset_description), `${c.event_id}: 需描述真实素材`);
    oneOf(c.importance, ['critical','high','normal'], 'importance');
    oneOf(c.evidence_need, ['none','supporting','required'], 'evidence_need');
    oneOf(c.claim_status, ['not_applicable','speaker_claim','owner_confirmed','sourced','estimate'], 'claim_status');
    oneOf(c.fallback?.strategy, ['generated_motion','simplify_preserving_structure','clean_presenter','block_until_assets'], 'fallback.strategy');
    assert(nonempty(c.fallback.description), `${c.event_id}: 缺少 fallback 说明`);
    if (semanticMap) {
      const segments = c.source_segment_ids.map(id => semanticMap.segments.find(s => s.id === id));
      assert(segments.every(Boolean), `${c.event_id}: 引用了不存在的语义段`);
      assert(c.start >= Math.min(...segments.map(s => s.start)) - .001 && c.end <= Math.max(...segments.map(s => s.end)) + .001, `${c.event_id}: 超出语义来源时间`);
    }
  }
  return document;
}

export function conceptForShot(plan, shot) {
  const ids = shot.visual_concept_ids ?? [];
  assert(ids.length === 1, `${shot.id}: 包装镜头需引用一个主要画面概念；多个概念请拆成 beat`);
  const c = plan.visual_concepts.concepts.find(c => c.event_id === ids[0]);
  assert(c, `${shot.id}: 画面概念不存在`);
  assert(shot.visual_structure === c.visual_structure, `${shot.id}: 画面结构被改写，需回画面构思层修订`);
  const start = shot.start_frame !== undefined ? shot.start_frame / plan.fps : shot.start;
  const end = shot.duration_frames !== undefined ? (shot.start_frame + shot.duration_frames) / plan.fps : shot.end;
  assert(start >= c.start - 1 / (plan.fps ?? 30) && end <= c.end + 1 / (plan.fps ?? 30), `${shot.id}: 镜头超出概念时间`);
  assert(c.presentation === 'either' || c.presentation === shot.presentation_mode, `${shot.id}: 人物/全屏模式违背画面概念`);
  if(c.real_asset_need==='required') assert(shot.asset_slots?.some(slot=>slot.required), `${shot.id}: 必需真实素材未进入asset_slots`);
  return c;
}

export function validateVisualPlan(plan) {
  const strict = plan.visual_contract_version !== undefined;
  if (!strict) return {legacy: true};
  assert(plan.visual_contract_version === '0.1', '不支持的 visual_contract_version');
  validateConcepts(plan.visual_concepts);
  assert(plan.project_id === plan.visual_concepts.project_id, '画面概念项目不一致');
  assert(Array.isArray(plan.shots) && plan.shots.length, 'shots 不能为空');
  for (const shot of plan.shots) {
    if (!shot.clean_presenter) conceptForShot(plan, shot);
    else assert(!(shot.visual_concept_ids?.length), `${shot.id}: 干净口播不能静默跳过已引用概念`);
    if (shot.primary_motion_request?.visual_structure !== undefined)
      assert(shot.primary_motion_request.visual_structure === shot.visual_structure, `${shot.id}: Motion Request 改写画面结构`);
  }
  return {legacy: false};
}

export function structureFits(card, concept) {
  // No fuzzy fallback: a process stack cannot implement 1 -> N or a timeline edit.
  return Array.isArray(card.visual_structures) && card.visual_structures.includes(concept.visual_structure);
}

export function generatedRequest(shot, concept, rejections) {
  return {event_id: concept.event_id, visual_concept: concept, motion_request: shot.primary_motion_request,
    implementation_notes:shot.implementation_notes ?? '',
    presentation_mode: shot.presentation_mode, safe_zones: shot.safe_zones ?? {},
    asset_slots: shot.asset_slots ?? [], reason: '现有实现不保留画面概念或不满足输入/时长约束', rejections,
    validation_required: ['stable_frame','semantic_fit','structure_preservation','assets','presenter_and_caption_safety']};
}

export function validatePlanningChain(semanticMap, concepts, editPlan, shotbook) {
  validateConcepts(concepts, semanticMap);
  for (const document of [editPlan,shotbook]) assert(document.project_id === concepts.project_id, '规划链项目不一致');
  const seen = new Set();
  for (const event of editPlan.events) {
    assert(nonempty(event.id) && !seen.has(event.id), 'Edit Plan 事件 id 缺失或重复');seen.add(event.id);
    const concept = concepts.concepts.find(c=>c.event_id===event.visual_concept_id);
    assert(concept, `${event.id}: Edit Plan 未引用画面概念`);
    assert(event.motion_request?.visual_structure===concept.visual_structure, `${event.id}: Edit Plan 改写画面结构`);
    assert(!event.motion_request.card_id && !event.motion_request.primary_card, `${event.id}: Planner 不得选卡`);
    assert(event.start>=concept.start-.001 && event.end<=concept.end+.001 && event.end>event.start, `${event.id}: Edit Plan 时间越界`);
  }
  validateVisualPlan({...shotbook,visual_contract_version:'0.1',visual_concepts:concepts});
  for (const shot of shotbook.shots) if(!shot.clean_presenter) {
    const event = editPlan.events.find(e=>e.id===shot.source_edit_event_id);
    assert(event && shot.visual_concept_ids.includes(event.visual_concept_id), `${shot.id}: Shotbook / Edit Plan 引用不一致`);
    assert(shot.primary_motion_request?.family===event.motion_request.family && shot.primary_motion_request?.subtype===event.motion_request.subtype, `${shot.id}: Shotbook 改写 Motion Request`);
    if(shot.start_frame!==undefined) assert(Math.abs(shot.start_frame/shotbook.fps-event.start)<.001 && Math.abs((shot.start_frame+shot.duration_frames)/shotbook.fps-event.end)<.001, `${shot.id}: Shotbook / Edit Plan 时间不一致`);
  }
  return {status:'pass',concept_count:concepts.concepts.length,shot_count:shotbook.shots.length};
}
