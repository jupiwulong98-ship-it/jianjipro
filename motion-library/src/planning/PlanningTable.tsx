import {useState} from 'react';
import {ruleFor,RulePreview} from './RulePreview';
import {SamplePreview} from './SamplePreview';
import type {PlanningProject,PlanningScene,TimedWord} from './types';

const clock=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toFixed(2).padStart(5,'0')}`;
const labels={pending:'待确认',approved:'已确认',changes_requested:'需调整'};

type Props={project:PlanningProject;scenes:PlanningScene[];drafts:Record<string,string>;locked:boolean;savingId:string;
  focusId:string;notice:{id:string;text:string;error:boolean}|null;onDraft:(id:string,value:string)=>void;
  onMutate:(id:string,action:Record<string,unknown>)=>void;onWord:(word:TimedWord)=>void};

export function PlanningTable({project,scenes,drafts,locked,savingId,focusId,notice,onDraft,onMutate,onWord}:Props) {
  const [previewId,setPreviewId]=useState('');
  const [sampleStart,setSampleStart]=useState<number|null>(null);
  const [editors,setEditors]=useState<Record<string,boolean>>({});
  const preview=project.scenes.find(s=>s.id===previewId);
  return <>
    {project.reference_sample&&<div className="pb-sample-banner"><div><strong>{project.reference_sample.title}</strong><p>包含原口播的实际候选 · {project.reference_sample.duration_seconds.toFixed(1)} 秒 · 可从各段直接播放</p></div><button className="pb-preview-button" onClick={()=>setSampleStart(0)}>播放动效候选</button></div>}
    <div className="pb-table-wrap"><table className="pb-plan-table" aria-label="逐段口播与包装策划"><colgroup><col className="pb-col-spoken"/><col className="pb-col-plan"/><col className="pb-col-review"/></colgroup>
      <thead><tr><th scope="col">真实口播 · 按时间顺序</th><th scope="col">准备怎么包装</th><th scope="col">预览与审阅</th></tr></thead>
      <tbody>{scenes.map(scene=>{
        const index=project.scenes.indexOf(scene)+1;
        const state=project.review.shots[scene.id]??{status:'pending',comments:[]};
        const pending=state.comments.filter(c=>!c.resolved).length;
        const draft=drafts[`${project.id}:${scene.id}`]??'';
        const rule=ruleFor(scene);
        const editorOpen=editors[scene.id]||!!draft;
        const rowNotice=notice?.id===scene.id?notice:null;
        return <tr key={scene.id} id={`planning-row-${index}`} className={focusId===scene.id?'pb-row-focused':''} data-scene-id={scene.id} aria-label={`策划第 ${index} 段`}>
          <td className="pb-table-spoken"><div className="pb-row-meta"><b>{String(index).padStart(2,'0')}</b><time>{clock(scene.start)} — {clock(scene.end)}</time><span className={`pb-status-${state.status}`}>{labels[state.status]}</span></div>
            <p>{scene.text}</p><details className="pb-row-words"><summary>字词时间</summary><div className="pb-words">{scene.words.map(w=><button key={w.id} onClick={()=>onWord(w)}><strong>{w.text}</strong><small>{w.start.toFixed(3)} — {w.end.toFixed(3)} s</small></button>)}</div></details>
          </td>
          <td className="pb-table-plan"><strong className={`pb-rule-tag ${scene.mode==='clean'?'clean':''}`}>{rule?.label??'包装规则待补充'}</strong><p className="pb-row-goal">要看懂：{scene.viewer_goal}</p>
            {scene.mode==='clean'?<p className="pb-row-clean">保持人物讲述，不增加解释性动画。</p>:<><p className="pb-row-start"><span>开始</span>{scene.initial_state}</p><ol className="pb-row-actions">{scene.actions.map((action,i)=><li key={`${action.word_id}-${i}`}><time>{clock(action.start)}</time><span>{action.description}</span></li>)}</ol><p className="pb-row-end"><span>结束</span>{scene.final_state}</p></>}
            <details className="pb-row-more"><summary>选择理由与素材</summary><p>{scene.reason}</p><p>{scene.materials}</p></details>
          </td>
          <td className="pb-table-review"><div className="pb-row-buttons"><button className="pb-preview-button" disabled={!rule} aria-label={`预览第 ${index} 段包装规则`} onClick={()=>setPreviewId(scene.id)}>▷ {rule?'预览包装规则':'预览待补充'}</button>
            {project.reference_sample?.scene_ids.includes(scene.id)&&<button className="pb-preview-button" onClick={()=>setSampleStart(scene.start)} aria-label={`播放第 ${index} 段样段参考`}>播放本段参考</button>}
            <button disabled={locked} aria-expanded={!!editorOpen} aria-label={`给第 ${index} 段留意见`} onClick={()=>setEditors(previous=>({...previous,[scene.id]:!editorOpen}))}>写意见{pending>0?` · ${pending} 待处理`:''}</button>
            <button className="pb-row-approve" aria-label={`确认第 ${index} 段策划`} disabled={locked||pending>0||state.status==='approved'||!!draft.trim()} onClick={()=>onMutate(scene.id,{action:'status',status:'approved'})}>{state.status==='approved'?'✓ 已确认':'确认这段'}</button></div>
            {editorOpen&&<section className="pb-row-editor"><label htmlFor={`comment-${index}`}>第 {index} 段意见</label><textarea id={`comment-${index}`} maxLength={2000} value={draft} placeholder="例如：先看输入，再看结果；少写重复口播文字。" onChange={event=>onDraft(scene.id,event.target.value)}/><button disabled={locked||!draft.trim()} aria-label={`保存第 ${index} 段意见`} onClick={()=>onMutate(scene.id,{action:'comment',text:draft})}>{savingId===scene.id?'正在保存…':'保存意见'}</button></section>}
            {rowNotice&&<p role={rowNotice.error?'alert':'status'} className={rowNotice.error?'pb-error':'pb-success'}>{rowNotice.text}</p>}
            {state.comments.length>0&&<details className="pb-row-comments" open={pending>0}><summary>{state.comments.length} 条意见 · {pending} 待处理</summary>{state.comments.map(comment=><article key={comment.id}><small>{comment.resolved?'已标记处理':'待处理'}</small><p>{comment.text}</p><button disabled={locked} onClick={()=>onMutate(scene.id,{action:'resolve',commentId:comment.id})}>{comment.resolved?'重新打开':'标记已处理'}</button><button disabled={locked} onClick={()=>onMutate(scene.id,{action:'delete',commentId:comment.id})}>撤回</button></article>)}</details>}
            {state.status==='approved'&&<button className="pb-row-reset" disabled={locked} onClick={()=>onMutate(scene.id,{action:'status',status:'pending'})}>重新讨论</button>}
            <small className="pb-row-hint">{draft.trim()?'先保存或清空意见草稿。':pending?'先处理意见，再确认。':project.reference_sample?.scene_ids.includes(scene.id)?'样段已生成，可看听后留意见。':'预览是规则示意，确认后再制作。'}</small>
          </td>
        </tr>;
      })}</tbody>
    </table>{!scenes.length&&<p className="pb-notice">没有匹配的段落。</p>}</div>
    {preview&&<RulePreview key={`${project.binding}:${preview.id}`} scene={preview} onClose={()=>setPreviewId('')}/>}
    {sampleStart!==null&&project.reference_sample&&<SamplePreview key={`${project.reference_sample.url}:${sampleStart}`} sample={project.reference_sample} start={sampleStart} onClose={()=>setSampleStart(null)}/>}
  </>;
}
