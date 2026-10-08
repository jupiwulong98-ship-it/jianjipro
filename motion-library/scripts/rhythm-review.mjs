import crypto from 'node:crypto';

export const defaultPolicy = {long_static_seconds:12, repeated_shots:3, mechanical_cycles:3,
  density_window_seconds:20, dense_strong_events:3, overpacked_shots:3};
const assert = (ok, message) => {if (!ok) throw new Error(message);};
const required = ['presentation_mode','visual_structure','layout','visual_intensity','visual_subject','motion_strength','information_change'];

export function visualTimeline(plan) {
  const fps = plan.fps ?? plan.global?.fps ?? 30;
  assert(Number.isFinite(fps) && fps > 0, 'fps 无效');
  assert(Array.isArray(plan.shots) && plan.shots.length, '节奏检查需要完整 Shotbook');
  const ids = new Set();
  const rows = plan.shots.map(s => {
    assert(typeof s.id === 'string' && !ids.has(s.id), '节奏检查镜头 id 缺失或重复'); ids.add(s.id);
    const start = s.start_frame !== undefined ? s.start_frame/fps : s.start;
    const end = s.duration_frames !== undefined ? (s.start_frame+s.duration_frames)/fps : s.end;
    assert(Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start, `${s.id}: 时间无效`);
    const rhythm = s.rhythm ?? {};
    return {shot_id:s.id, start, end, presentation_mode:s.presentation_mode,
      visual_structure:s.visual_structure ?? (s.clean_presenter ? 'clean_presenter' : null),
      primary_family:s.primary_motion_request?.family ?? null,
      layout:rhythm.layout ?? (s.clean_presenter ? 'presenter_clean' : null),
      visual_intensity:rhythm.visual_intensity ?? (s.clean_presenter ? 'low' : null),
      visual_subject:rhythm.visual_subject ?? (s.clean_presenter ? 'presenter' : null),
      motion_strength:rhythm.motion_strength ?? (s.clean_presenter ? 'none' : null),
      information_change:rhythm.information_change ?? (s.clean_presenter ? 'none' : null),
      importance:s.importance ?? 0, visualizable:rhythm.visualizable === true,
      visual_focus:s.primary_visual_job ?? '', event_ids:s.visual_concept_ids ?? [],
      annotation_source:rhythm.annotation_source ?? 'shotbook'};
  }).sort((a,b) => a.start-b.start || a.end-b.end);
  for (const r of rows) {
    for (const [key,values] of Object.entries({presentation_mode:['presenter_safe','full_screen'],
      visual_intensity:['low','medium','high'],motion_strength:['none','low','medium','high'],
      information_change:['none','text_only','new_state'],visual_subject:['presenter','screen','real_asset','diagram','mixed']}))
      if (r[key] != null) assert(values.includes(r[key]), `${r.shot_id}: ${key} 无效`);
  }
  for (let i=1;i<rows.length;i++) assert(rows[i].start >= rows[i-1].end-.001, '节奏检查需要按主画面排列的非重叠镜头；辅助层留在 supporting_layers');
  const duration = plan.duration_frames !== undefined ? plan.duration_frames/fps : plan.duration ?? plan.global?.duration ?? rows.at(-1).end;
  assert(Number.isFinite(duration) && duration >= rows.at(-1).end-.001, '整片时长小于镜头时间范围');
  return {rows,duration};
}

export function reviewRhythm(plan, {stage='shotbook', policy={}}={}) {
  const settings = {...defaultPolicy,...policy};
  for (const [key,value] of Object.entries(settings)) assert(Number.isFinite(value) && value > 0, `节奏 policy.${key} 无效`);
  const {rows,duration} = visualTimeline(plan);
  const issues = [];
  const add = (type, group, reason, suggestion, severity='medium') => {
    const start=group[0].start, end=group.at(-1).end;
    const shot_ids=[...new Set(group.map(r=>r.shot_id))];
    const issue_id=crypto.createHash('sha256').update(JSON.stringify({type,start,end,shot_ids})).digest('hex').slice(0,12);
    if (!issues.some(i=>i.issue_id===issue_id)) issues.push({issue_id,start,end,severity,type,shot_ids,
      event_ids:[...new Set(group.flatMap(r=>r.event_ids))],reason,suggestion,evidence:stage==='shotbook'?'shotbook_annotation':'sampled_visual_annotation'});
  };
  const missing=rows.filter(r=>required.some(k=>r[k]==null));
  if (missing.length) add('insufficient_rhythm_metadata',missing,'镜头缺少画面结构、构图或认知变化标注，不能把未知状态当成干净口播。','补齐 rhythm 字段后复查。','high');
  let covered=0;
  for (const r of rows) {
    if(r.start>covered+.001) add('timeline_gap',[{...r,start:covered,end:r.start}], 'Shotbook 未覆盖这段主画面，整片检查不完整。','把真实干净口播或素材主画面补入 Shotbook。','high');
    covered=r.end;
  }
  if(duration>covered+.001) add('timeline_gap',[{...rows.at(-1),start:covered,end:duration}], '片尾未记录主画面。','补齐片尾镜头。','high');
  // Boundaries only reset a run when something viewers understand actually changes.
  let staticRun=[];
  const flushStatic=()=>{
    if(staticRun.length && staticRun.at(-1).end-staticRun[0].start>=settings.long_static_seconds) {
      const valuable=staticRun.filter(r=>r.visualizable && (r.importance==='high'||r.importance==='critical'||r.importance>=.65));
      add('long_static_presenter',staticRun,`连续 ${(staticRun.at(-1).end-staticRun[0].start).toFixed(1)} 秒主要保持人物构图，只有弱变化；其中 ${valuable.length} 段标注为可视觉化的重要信息。`,
        valuable.length?`保留必要人物呼吸，在 ${valuable.map(r=>r.shot_id).join('、')} 的关系解释处考虑结构画面；不按固定秒数加效果。`:'确认这段是否需要人物停留和信息消化；没有新视觉任务可以保留。',valuable.length?'high':'low');
    }
    staticRun=[];
  };
  for(const r of rows) {
    const isStatic=r.visual_subject==='presenter' && r.visual_intensity==='low' && ['none','low'].includes(r.motion_strength) && ['none','text_only'].includes(r.information_change);
    if(!isStatic || staticRun.length && (r.start>staticRun.at(-1).end+.001 || r.layout!==staticRun.at(-1).layout)) flushStatic();
    if(isStatic) staticRun.push(r);
  }
  flushStatic();
  const runs=(key,eligible,callback)=>{
    let group=[];
    const flush=()=>{if(group.length>=settings.repeated_shots) callback(group);group=[];};
    for(const r of rows) {if(!eligible(r)||group.length&&(key(group.at(-1))!==key(r)||r.start>group.at(-1).end+.001)) flush();if(eligible(r))group.push(r);}flush();
  };
  runs(r=>`${r.presentation_mode}/${r.visual_subject}/${r.layout}`,r=>r.layout!=null && r.visual_structure!=='clean_presenter',group=>
    add(group.every(r=>r.visual_subject==='screen')?'repeated_screen_layout':'repeated_layout',group,
      `连续 ${group.length} 镜使用相似构图 ${group[0].layout}，换文字或模板不改变构图。`,
      '检查是否可改为局部放大、关系展开或回到人物；有教学连续性理由可以保留。'));
  runs(r=>r.visual_structure,r=>r.visual_structure && !['single_focus','clean_presenter'].includes(r.visual_structure),group=>
    add('repeated_structure',group,`连续 ${group.length} 镜都采用 ${group[0].visual_structure} 信息结构。`,
      '先确认语义是否确实相同；必要时合并、换观察视角或留干净口播，不能只为变化扭曲关系。'));
  const signature=r=>`${r.presentation_mode}/${r.visual_subject}/${r.layout}`;
  for(let i=0;i<rows.length;i++) for(const period of [2,3]) {
    const n=period*settings.mechanical_cycles, group=rows.slice(i,i+n);
    if(group.length<n||group.some(r=>r.layout==null)||new Set(group.slice(0,period).map(signature)).size<2)continue;
    if(group.every((r,k)=>signature(r)===signature(group[k%period]) && (!k||r.start<=group[k-1].end+.001))) {
      if (!issues.some(x=>x.type==='mechanical_cycle' && x.start<=group[0].start && x.end>=group[0].end))
        add('mechanical_cycle',group,`构图序列以 ${period} 镜为一组机械循环 ${settings.mechanical_cycles} 次。`,
          '检查各次切换是否提供新认知；考虑一次集中演示后回人物，避免人物/官网反复往返。');
    }
  }
  let strong=[];
  const flushStrong=()=>{if(strong.length>=settings.overpacked_shots)add('overpacked',strong,`连续 ${strong.length} 镜高强度包装，没有低强度呼吸。`,'在适合停顿或解释处留干净人物口播，让观众消化；不要强行缩短动画阅读时间。');strong=[];};
  for(const r of rows){if(r.visual_intensity!=='high'||strong.length&&r.start>strong.at(-1).end+.001)flushStrong();if(r.visual_intensity==='high')strong.push(r);}flushStrong();
  const windows=[];
  for(let start=0;start<duration;start+=settings.density_window_seconds){
    const end=Math.min(duration,start+settings.density_window_seconds);
    const group=rows.filter(r=>r.start<end && r.end>start);
    const strongSeconds=group.reduce((sum,r)=>sum+(r.visual_intensity==='high'?Math.min(end,r.end)-Math.max(start,r.start):0),0);
    windows.push({start,end,strong_fraction:strongSeconds/(end-start),strong_events:group.filter(r=>r.visual_intensity==='high' && r.start>=start && r.start<end).length,
      new_states:group.filter(r=>r.information_change==='new_state' && r.start>=start && r.start<end).length});
  }
  const quiet=windows.filter(w=>w.strong_fraction<.1 && w.new_states<=1);
  const dense=windows.filter(w=>w.strong_events>=settings.dense_strong_events && w.strong_fraction>.5);
  if(quiet.length && dense.length) {
    const focus=dense[0], group=rows.filter(r=>r.start<focus.end && r.end>focus.start);
    add('uneven_density',group,`强包装集中在 ${focus.start.toFixed(1)}–${focus.end.toFixed(1)} 秒；另有 ${quiet.length} 个窗口几乎无新的视觉状态。`,
      '结合语义重音检查分布：可将结构解释提前，或删减密集段的次要包装；不追求均匀撒动画。');
  }
  const decisions=plan.shots.map(s=>({id:s.id,spoken_text:s.spoken_text,primary_motion_request:s.primary_motion_request,
    implementation_notes:s.implementation_notes,safe_zones:s.safe_zones,supporting_layers:s.supporting_layers,
    box:s.presentation_mode==='presenter_safe'?s.box:undefined}));
  const digest=crypto.createHash('sha256').update(JSON.stringify({rows,duration,settings,decisions,concepts:plan.visual_concepts??null})).digest('hex');
  return {version:'0.1',project_id:plan.project_id,gate:stage==='shotbook'?'B':'D',stage,
    status:issues.length?'needs_revision':stage==='shotbook'?'pass':'needs_visual_review',
    scope:stage==='shotbook'?'规划标注的启发式预检，不证明成片视觉通过':'基于抽样观察标注的整片节奏复查，仍需动态审片',
    timeline_digest:digest,policy:settings,duration,visual_timeline:rows,windows,issues};
}

export function assertRhythmGate(plan) {
  const report=reviewRhythm(plan, {policy:plan.rhythm_policy ?? {}});
  if(!report.issues.length) return report;
  const signoff=plan.rhythm_review;
  assert(signoff?.timeline_digest===report.timeline_digest, 'Gate B 节奏报告缺失或过期，请运行 style:review');
  for(const issue of report.issues) {
    const decision=signoff.decisions?.find(d=>d.issue_id===issue.issue_id);
    assert(decision?.decision==='accepted_context' && typeof decision.reason==='string' && decision.reason.trim(), `Gate B 未处理 ${issue.type} ${issue.issue_id}；修订或记录具体保留理由`);
    assert(!['timeline_gap','insufficient_rhythm_metadata'].includes(issue.type), '不完整时间轴或缺失标注不能豁免');
  }
  return {...report,status:'pass_with_context',decisions:signoff.decisions};
}
