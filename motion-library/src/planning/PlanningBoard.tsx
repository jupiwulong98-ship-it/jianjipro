import {useEffect,useState} from 'react';
import {listProjects,loadProject,savePlanning} from './client';
import {PlanningTable} from './PlanningTable';
import type {PlanningProject,TimedWord} from './types';
import './planning.css';

const clock=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toFixed(2).padStart(5,'0')}`;
const selectionKey='jianjipro.planning.project';
const rememberedProject=()=>{try{return window.localStorage.getItem(selectionKey);}catch{return null;}};

export function PlanningBoard({onHistory,onTemplates}:{onHistory:()=>void;onTemplates:()=>void}) {
  const [projects,setProjects]=useState<{id:string;title:string}[]>([]);
  const [id,setId]=useState('');
  const [project,setProject]=useState<PlanningProject|null>(null);
  const [focusId,setFocusId]=useState('');
  const [view,setView]=useState<'plan'|'transcript'>('plan');
  const [filter,setFilter]=useState('all');
  const [query,setQuery]=useState('');
  const [word,setWord]=useState<TimedWord|null>(null);
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [savingId,setSavingId]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState<{id:string;text:string;error:boolean}|null>(null);
  const [stale,setStale]=useState(false);
  const [reload,setReload]=useState(0);
  const saving=!!savingId;
  useEffect(()=>{
    let live=true;
    listProjects().then(items=>{if(live){
      setProjects(items);
      const requested=new URLSearchParams(window.location.search).get('project')||null;
      if(requested&&!items.some(item=>item.id===requested)) {
        setError('链接中的项目不存在，请从当前项目列表重新选择。');setLoading(false);return;
      }
      const remembered=rememberedProject();
      setId(requested??items.find(item=>item.id===remembered)?.id??items[0]?.id??'');
      if(!items.length)setLoading(false);
    }})
      .catch(reason=>{if(live){setError(reason.message);setLoading(false);}});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    if(!id) return;
    let live=true;setLoading(true);setError('');setNotice(null);setStale(false);
    loadProject(id).then(value=>{
      if(!live) return;
      setProject(value);setWord(null);setLoading(false);setFilter('all');
      // Bind the shareable link only after this project has actually loaded.
      const url=new URL(window.location.href);url.searchParams.set('project',id);
      window.history.replaceState(window.history.state,'',url);
      try{window.localStorage.setItem(selectionKey,id);}catch{/* URL selection still works when storage is unavailable. */}
      if(!value.scenes.length)setView('transcript');
    }).catch(reason=>{if(live){setError(reason.message);setProject(null);setLoading(false);}});
    return()=>{live=false;};
  },[id,reload]);
  useEffect(()=>{
    const before=document.title;document.title=project?`${project.title} · jianjipro`:'剪后全文与画面策划 · jianjipro';
    return()=>{document.title=before;};
  },[project?.title]);
  useEffect(()=>{
    if(view!=='plan'||!focusId||!project)return;
    const index=project.scenes.findIndex(scene=>scene.id===focusId);
    document.getElementById(`planning-row-${index+1}`)?.scrollIntoView?.({block:'center',behavior:'smooth'});
  },[view,focusId,project?.binding]);
  const confirmed=project?.scenes.filter(s=>project.review.shots[s.id]?.status==='approved').length??0;
  const scenes=project?.scenes.filter(s=>(filter==='all'||(filter==='clean'?s.mode==='clean':s.mode==='visual'))
    && `${s.title} ${s.text} ${s.viewer_goal}`.toLowerCase().includes(query.trim().toLowerCase()))??[];
  const segments=project?.transcript.segments.filter(s=>s.text.toLowerCase().includes(query.trim().toLowerCase()))??[];
  async function mutate(sceneId:string,action:Record<string,unknown>) {
    if(!project||saving||stale) return;
    const current=project;const draftKey=`${current.id}:${sceneId}`;
    setSavingId(sceneId);setNotice(null);
    try {
      const review=await savePlanning(current.id,{binding:current.binding,revision:current.review.revision,shotId:sceneId,...action});
      setProject({...current,review});setNotice({id:sceneId,text:'✓ 已保存到本项目',error:false});
      if(action.action==='comment')setDrafts(previous=>({...previous,[draftKey]:''}));
    } catch(reason) {
      setNotice({id:sceneId,text:reason instanceof Error?reason.message:'保存失败，输入内容已保留。',error:true});
      try {
        const fresh=await loadProject(current.id);
        if(fresh.binding===current.binding)setProject({...current,review:fresh.review});
        else setStale(true);
      } catch {/* Keep the project and unsaved drafts visible during a service failure. */}
    } finally {setSavingId('');}
  }
  function jump(wordId:string) {
    const target=project?.scenes.find(s=>s.words.some(w=>w.id===wordId));
    if(target){setFocusId(target.id);setView('plan');setFilter('all');setQuery('');setWord(null);}
  }
  const locked=saving||loading||stale;
  return <main className="planning-board">
    <header className="pb-header"><div className="pb-brand"><b>J</b><div><strong>JIANJIPRO</strong><small>口播制作工作台</small></div></div>
      <nav><button disabled={saving} onClick={onHistory}>历史审片</button><button disabled={saving} onClick={onTemplates}>模板库 ↗</button></nav></header>
    <section className="pb-heading"><div><p className="pb-eyebrow">先确定画面帮助观众看懂什么</p><h1>剪后全文与画面策划</h1><p>逐行看原文与包装方案，点开预览，再留意见或确认</p></div>
      <label>当前项目<select aria-label="当前项目" disabled={saving||loading} value={id} onChange={e=>{setId(e.target.value);setQuery('');setFocusId('');}}>{projects.map(p=><option key={p.id} value={p.id}>{project?.id===p.id?project.title:p.title}</option>)}</select></label></section>
    <ol className="pb-flow"><li className={project?'complete':''}><b>01</b> 剪后全文</li><li className="active"><b>02</b> 画面策划</li><li><b>03</b> 模板与素材</li><li><b>04</b> 样段与装配</li></ol>
    {loading?<p role="status" className="pb-notice">正在载入项目…</p>:!project?<div className="pb-notice"><p>{error||'还没有剪后全文。新项目完成全文抽取后会自动出现在这里。'}</p><button onClick={()=>id?setReload(n=>n+1):window.location.reload()}>重新载入</button></div>:<>
      <section className="pb-summary"><div><strong>{project.transcript.segment_count} 条原文</strong><span>{project.transcript.word_count} 个字词 · 每个字词可查时间</span></div>
        <div><strong>{project.scenes.length} 个意义段</strong><span>{project.scenes.filter(s=>s.mode==='visual').length} 段画面解释 · {project.scenes.filter(s=>s.mode==='clean').length} 段保留人物</span></div>
        <div><strong>{confirmed} / {project.scenes.length} 已确认</strong><span>确认策划后推进正式制作</span></div></section>
      <div className="pb-source"><span>剪后时间线 · 原生字词时间 · {project.transcript.listening_review==='not_verified'?'听音核对待完成':'听音状态以项目记录为准'}</span><button disabled={saving||loading} onClick={()=>setReload(n=>n+1)}>载入最新版本</button></div>
      <div className="pb-tabs" role="tablist" aria-label="流程内容"><button role="tab" aria-selected={view==='plan'} onClick={()=>setView('plan')}>画面策划表</button><button role="tab" aria-selected={view==='transcript'} onClick={()=>setView('transcript')}>剪后全文</button>
        <input aria-label="搜索原文或策划" placeholder="搜索一句口播或关键词…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      {project.plan_error&&<p className="pb-error" role="alert">{project.plan_error} 全文仍可查看，方案确认已暂停。</p>}
      {stale&&<div className="pb-stale"><p>全文或策划已有更新，意见草稿已保留，请载入新版后重新检查。</p><button onClick={()=>setReload(n=>n+1)}>载入新版本，保留意见草稿</button></div>}
      {view==='transcript'?<section className="pb-transcript-view"><header><h2>完整剪后逐字稿</h2><p>字幕条保留原文；点开一条，可查看其中每个字词的起止时间。它不是“一词一条 SRT”。</p>
        <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(project.transcript.full_text)}`} download={`${id}-剪后全文.txt`}>下载全文 TXT ↓</a></header>
        <div className="pb-transcript-list">{segments.map(segment=><details key={segment.id}><summary><time>{clock(segment.start)} — {clock(segment.end)}</time><span>{segment.text}</span></summary>
          <div className="pb-words">{segment.words.map(w=><button key={w.id} title={`${w.start.toFixed(3)}–${w.end.toFixed(3)} 秒`} onClick={()=>setWord(w)}><strong>{w.text}</strong><small>{w.start.toFixed(3)} — {w.end.toFixed(3)} s</small></button>)}</div>
          <button disabled={!project.scenes.length||saving} onClick={()=>jump(segment.words[0].id)}>查看对应画面策划</button></details>)}</div>
        {!segments.length&&<p className="pb-notice">没有匹配的原文。</p>}
      </section>:<><div className="pb-table-toolbar"><div className="pb-filter" aria-label="策划筛选">{[['all','全部'],['visual','画面解释'],['clean','保留人物']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div><span>{scenes.length} / {project.scenes.length} 段 · 规则预览为通用示意</span></div>
        <p className="pb-proposal">{project.proposal_note}</p>{!project.scenes.length?<div className="pb-notice">当前版本的画面策划待提交。先依据全文分出意义段，再写观众目标、开始画面、动作时点和结束画面。</div>:<PlanningTable project={project} scenes={scenes} drafts={drafts} locked={locked} savingId={savingId} focusId={focusId} notice={notice}
          onDraft={(sceneId,value)=>setDrafts(previous=>({...previous,[`${project.id}:${sceneId}`]:value}))} onMutate={mutate} onWord={setWord}/>}
      </>}
      {word&&<p role="status" className="pb-word-time">「{word.text}」 {word.start.toFixed(3)} — {word.end.toFixed(3)} 秒</p>}
      <details className="pb-version"><summary>来源与版本</summary><p>采集：{new Date(project.transcript.captured_at).toLocaleString('zh-CN')} · 原文字词完整性已校验；这不代表听音验收通过。</p><p>全文版本：{project.transcript.revision}</p><p>策划与意见版本：{project.binding}</p><p>全文或策划变化后重新确认，历史意见会保留在本项目内。</p></details>
    </>}
  </main>;
}
