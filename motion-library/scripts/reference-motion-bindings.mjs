// Executable reference-motion mapping. This is separate from generic TalkCraft taxonomy.
// A style pattern is not "implemented" until it has a declared component and render contract.
export const referenceMotionRegistry=Object.freeze({
  P02:{component:'ReferenceChapter',module:'motion-library/src/reference-style/ReferenceMotions.tsx',
    required:['chapter','title','mediaSrc','mediaType','durationFrames'],requireMedia:true,
    source_behavior:'大编号章节 + 真实软件窗口，分层进入与独立退出'},
  P04:{component:'ReferenceCardFan',module:'motion-library/src/reference-style/ReferenceMotions.tsx',
    required:['title','items','durationFrames'],requireMedia:false,source_behavior:'卡片中心堆叠 → 空间展开 → 停留'},
  P05:{component:'TechMediaTakeaway',module:'motion-library/src/reference-style/TechReferenceMotions.tsx',
    required:['title','mediaSrc','mediaType','durationFrames'],requireMedia:true,source_behavior:'结论牌、外部媒体容器与内部媒体分层'},
  P09:{component:'TechResultPunch',module:'motion-library/src/reference-style/TechReferenceMotions.tsx',
    required:['text','durationFrames'],requireMedia:false,source_behavior:'大字进入 → 收缩 → 稳定 → 退场'},
  P13:{component:'ReferenceWindowExit',module:'motion-library/src/reference-style/ReferenceMotions.tsx',
    required:['mediaSrc','mediaType','durationFrames'],requireMedia:true,source_behavior:'完整媒体窗口倾斜、收窄并退出'}
});
const fail=m=>{throw new Error('reference motion binding: '+m);};
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const mediaPropsOk=p=>nonempty(p.mediaSrc)&&['image','video'].includes(p.mediaType);

export function bindReferencePattern({loaded,patternId,referenceEvents,mediaKind}) {
  const rule=loaded.style.rules.find(r=>r.id===patternId);
  if(!rule) fail('当前 Style Package 不包含 '+patternId+'，需要正式迁移风格包而不能只写P编号');
  const source=loaded.patterns.get(patternId);
  if(!source?.evidence_events?.length)fail(patternId+' 无来源事件');
  if(referenceEvents?.length && !referenceEvents.some(x=>source.evidence_events.includes(x)))
    fail(patternId+' 的引用不属于源视频的证据事件');
  const impl=referenceMotionRegistry[patternId];
  if(!impl) return {status:'needs_reference_implementation',pattern_id:patternId,
    note:'源规则存在但没有对应的已编写组件。严禁静默换成无关TalkCraft卡或泛用蓝底图。'};
  if(impl.requireMedia && mediaKind && !['real_screen','real_output','mixed_media'].includes(mediaKind))
    fail(patternId+' 执行要求真实媒体；规划中选成纯diagram时不能调用该组件');
  return {status:'component_available_not_rendered',pattern_id:patternId,component:impl.component,
    module:impl.module,required_props:impl.required,
    requires_actual_media:impl.requireMedia,reference_events:source.evidence_events,
    source_behavior:impl.source_behavior,renderer:'motion-library/runtime-talkcraft/render-reference.mjs',
    note:'源代码可用≠已按本视频渲染，必须传真实props并进行动态审片'};
}

export function validateReferenceMotionRequest(request,loaded) {
  if(!request||!nonempty(request.pattern_id)||!nonempty(request.reference_event))
    fail('请求需要 pattern_id 和具体参考 source event');
  if(request.reference_package!==loaded.style.id)
    fail('请求中的风格包版本与加载版本不一致');
  const binding=bindReferencePattern({loaded,patternId:request.pattern_id,
    referenceEvents:[request.reference_event]});
  if(binding.status!=='component_available_not_rendered')
    fail('所选规则没有真正可执行的组件');
  const props=request.props;
  if(!props||typeof props!=='object')fail('缺少模板参数');
  const impl=referenceMotionRegistry[request.pattern_id];
  for(const key of impl.required)if(!(key in props)||props[key]===null||props[key]==='')
    fail(request.pattern_id+' 缺少必须参数 '+key);
  if(!Number.isInteger(props.durationFrames)||props.durationFrames<45||props.durationFrames>900)
    fail('durationFrames必须是45~900帧，必要时分段渲染');
  if(impl.requireMedia&&!mediaPropsOk(props))fail('需要真实软件截图/视频路径和媒体类型');
  if(request.pattern_id==='P02'&&(!nonempty(props.title)||!nonempty(props.chapter)))fail('P02章节号和标题无效');
  if(request.pattern_id==='P04'&&(!Array.isArray(props.items)||props.items.length<2||props.items.length>4||
    !props.items.every(x=>nonempty(x?.title))))fail('P04必须输入2~4张具有真实文本的卡片');
  if(request.pattern_id==='P09'&&(!nonempty(props.text)||[...props.text].length>25))
    fail('P09强结论需短文本');
  if(!['qa_synthetic','creator_owned'].includes(request.media_provenance))
    fail('必须声明合成QA或自己提供的媒体；严禁用参考原视频当作创作素材');
  if(request.media_provenance==='qa_synthetic' && request.output_purpose!=='preview_only')
    fail('QA演示素材不能标为正式成片');
  return {...binding,status:'render_request_valid',provenance:request.media_provenance,
    fidelity:'unverified_until_dynamic_review'};
}
