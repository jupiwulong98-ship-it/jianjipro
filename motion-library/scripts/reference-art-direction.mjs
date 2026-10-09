// V0.2 art-direction layer. This is a design-intent gate, not visual pixel QA.
export const backgroundModes=[
  'presenter_natural','dark_tech','light_explainer','media_first','transparent_overlay'
];
export const mediaKinds=[
  'presenter','typography','diagram','real_screen','real_output','mixed_media'
];
export const evidenceStatuses=['real_verified','illustration_declared','not_applicable'];
const fail=message=>{throw new Error('reference art direction: '+message);};
const good=x=>typeof x==='string' && x.trim().length>0;
const actualMedia=new Set(['real_screen','real_output','mixed_media']);
const evidenceNeedsMedia=(kind,evidence)=>actualMedia.has(kind) && evidence==='real_verified';

export function initialAssetIntent(concepts) {
  return {version:1,project_id:concepts.project_id,
    note:'Captured at initial visual concept planning. Do not regenerate to erase missing real assets.',
    requirements:concepts.concepts.map(c=>({concept_id:c.event_id,
      real_asset_need:c.real_asset_need,asset_description:c.asset_description,
      evidence_need:c.evidence_need}))};
}

export function validateArtDirection({style,concepts,selection,edit,shotbook,assetIntent}) {
  if(style.art_direction_contract!==1) return {legacy:true};
  if(assetIntent?.version!==1 || assetIntent.project_id!==concepts.project_id ||
    !Array.isArray(assetIntent.requirements)) fail('缺少首次画面规划的 style-asset-intent.json，不允许静默降低真实素材要求');
  const original=new Map(assetIntent.requirements.map(a=>[a.concept_id,a]));
  if(original.size!==concepts.concepts.length ||
    assetIntent.requirements.length!==concepts.concepts.length)
    fail('初始真实素材意图缺失或重复');
  const decisions=new Map(selection.decisions.map(d=>[d.concept_id,d]));
  const rules=new Map(style.rules.map(r=>[r.id,r]));
  const results=[];
  for(const c of concepts.concepts){
    const baseline=original.get(c.event_id), decision=decisions.get(c.event_id);
    if(!baseline || !decision) fail(c.event_id+': 缺少初始素材要求或导演选择');
    if(baseline.real_asset_need==='required' && c.real_asset_need!=='required')
      fail(c.event_id+': 不得将最初required真实媒体悄悄降为'+c.real_asset_need);
    if(baseline.evidence_need==='required' && c.evidence_need!=='required')
      fail(c.event_id+': 不得悄悄取消最初required证据要求');
    const {background_mode,visual_media_kind,media_evidence}=decision;
    if(!backgroundModes.includes(background_mode) || !mediaKinds.includes(visual_media_kind) ||
      !evidenceStatuses.includes(media_evidence))
      fail(c.event_id+': 背景/视觉媒介/媒体真实性没有明确选择');
    if(background_mode==='presenter_natural' && visual_media_kind==='diagram')
      fail(c.event_id+': 真人原景不应被标成纯图解，需注明混合媒体或者换场景');
    if(evidenceNeedsMedia(visual_media_kind,media_evidence) && c.real_asset_need!=='required')
      fail(c.event_id+': 真实媒体要求必须反映在visual-concepts的required状态');
    if(actualMedia.has(visual_media_kind) && media_evidence==='illustration_declared')
      fail(c.event_id+': 真实媒体类别不能冒充已证实内容；纯示意应标为diagram');
    if(!actualMedia.has(visual_media_kind) && media_evidence==='real_verified')
      fail(c.event_id+': 该媒介类型不能被标为真实媒体证据');
    const rule=decision.decision==='use_reference'?rules.get(decision.pattern_id):null;
    if(rule){
      const direction=rule.art_direction;
      if(!direction || !direction.background_modes.includes(background_mode) ||
         !direction.media_kinds.includes(visual_media_kind))
        fail(c.event_id+': 背景/媒介不符合所选参考事件的导演范围');
      if(background_mode!==direction.preferred_background_mode &&
         !good(decision.deviation_reason))
        fail(c.event_id+': 偏离对标默认背景必须记录逐镜理由');
      if(direction.source_media_fidelity==='real_media_required' &&
         (media_evidence!=='real_verified' || !actualMedia.has(visual_media_kind) ||
         c.real_asset_need!=='required'))
        fail(c.event_id+': 此参考规则必须提供匹配口播的真实媒体，不可用SVG/图解降级');
    }
    if(baseline.real_asset_need==='required' &&
       (media_evidence!=='real_verified' || c.real_asset_need!=='required'))
      fail(c.event_id+': 最初需要真实素材；不能用no_match或解释图解绕过');
    if(media_evidence==='illustration_declared' &&
      !['diagram','typography'].includes(visual_media_kind))
      fail(c.event_id+': 纯示意仅允许diagram/typography媒介');
    const expected={background_mode,visual_media_kind,media_evidence};
    const events=edit?.events?.filter(e=>e.visual_concept_id===c.event_id)||[];
    const shots=shotbook?.shots?.filter(s=>!s.clean_presenter && s.visual_concept_ids?.includes(c.event_id))||[];
    if(edit&&!events.length || shotbook&&!shots.length)
      fail(c.event_id+': 缺少在Edit Plan或Shotbook中的实际镜头引用');
    for(const row of [...events,...shots]) for(const [key,value] of Object.entries(expected))
      if(row.art_direction?.[key]!==value) fail((row.id||'unknown')+': 逐镜art_direction未传递到实际规划');
    const needsReal=baseline.real_asset_need==='required' ||
      c.real_asset_need==='required' || rule?.art_direction?.source_media_fidelity==='real_media_required';
    if(needsReal){
      if(media_evidence!=='real_verified') fail(c.event_id+': 有真实素材要求但被声明为虚拟示意');
      for(const shot of shots){
        if(!shot.asset_slots?.some(a=>a.required===true && a.status==='ready' &&
            good(a.asset_id||a.path||a.source)))
          fail(shot.id+': 缺少已就绪、可定位的真实媒体素材槽');
      }
    }
    results.push({concept_id:c.event_id,pattern_id:decision.decision==='use_reference'?decision.pattern_id:null,
      ...expected,original_real_asset_need:baseline.real_asset_need,
      current_real_asset_need:c.real_asset_need,
      requirement:needsReal?'real_media_gate':'illustration_or_no_claim',
      notes:decision.deviation_reason||null});
  }
  return {status:'pass',scope:'art_direction_planning_only_not_pixel_or_dynamic_review',
    background_modes:backgroundModes,decisions:results};
}
