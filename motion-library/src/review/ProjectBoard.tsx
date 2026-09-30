import {useEffect, useState} from 'react';
import catalog from '../talkcraft/catalog.json';
import data from './project.json';
import {loadReview, saveReview} from './client';
import type {BoardProject, ReviewState, ShotReview} from './types';
import './review.css';

const project=data as BoardProject;
const labels={pending:'待确认',approved:'已确认',changes_requested:'需调整'};
const empty:ShotReview={status:'pending',comments:[]};
const clock=(frame:number)=>`${Math.floor(frame/project.fps/60).toString().padStart(2,'0')}:${(frame/project.fps%60).toFixed(1).padStart(4,'0')}`;
const ruleLabels:Record<string,string>={
  'rule-section-title':'章节与主题','rule-entity-emphasis':'工具首次出现','rule-list-tags':'平级并列',
  'rule-tutorial-screen-primary':'真实界面为主','rule-example-broll':'素材与内容匹配','rule-return-to-clean-talking-head':'返回干净口播',
};

export function ProjectBoard({onOpenTemplates,onBack}:{onOpenTemplates:()=>void;onBack:()=>void}) {
  const [selected,setSelected]=useState(project.shots[0].id);
  const [filter,setFilter]=useState('all');
  const [review,setReview]=useState<ReviewState>({revision:0,shots:{}});
  const [ready,setReady]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [tab,setTab]=useState<'frame'|'template'>('frame');
  const [picker,setPicker]=useState(false);
  const [search,setSearch]=useState('');
  useEffect(()=>{
    let live=true;
    const originalTitle=document.title;document.title=`${project.title} · jianjipro 审阅`;
    loadReview(project.id).then(value=>{if(live){setReview(value);setReady(true);}})
      .catch(()=>{if(live)setError('意见服务未连接，暂时不能保存。请从本机看板入口打开后重试。');});
    return ()=>{live=false;document.title=originalTitle;};
  },[]);
  const shot=project.shots.find(s=>s.id===selected)!;
  const state=review.shots[shot.id]??empty;
  const pending=state.comments.filter(c=>!c.resolved).length;
  const approved=project.shots.filter(s=>review.shots[s.id]?.status==='approved').length;
  const changes=project.shots.filter(s=>review.shots[s.id]?.status==='changes_requested').length;
  const shown=project.shots.filter(s=>filter==='all'||(review.shots[s.id]?.status??'pending')===filter);
  const template=catalog.find(c=>c.slug===shot.templateIds[0]);
  const assets=project.assets.filter(a=>shot.assetIds.includes(a.id));
  const candidates=catalog.filter(c=>`${c.title} ${c.slug} ${c.semantics.join(' ')}`.toLowerCase().includes(search.toLowerCase()));

  async function mutate(shotId:string, action:Record<string,unknown>) {
    setSaving(true);setMessage('');setError('');
    try {
      const next=await saveReview(project.id,{revision:review.revision,shotId,...action});
      setReview(next);setMessage('已保存到本机项目');return true;
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'保存失败，输入内容已保留。');
      try {setReview(await loadReview(project.id));} catch {/* Preserve the draft if the service is unavailable. */}
      return false;
    } finally {setSaving(false);}
  }
  async function submit() {
    const id=shot.id;
    if(await mutate(id,{action:'comment',text:drafts[id]??''})) setDrafts(prev=>({...prev,[id]:''}));
  }
  function select(id:string) {setSelected(id);setTab('frame');setMessage('');setError('');}
  return <main className="review-board">
    <header className="rb-header">
      <div className="rb-brand"><span className="rb-brand-mark">J</span><div><strong>JIANJIPRO</strong><span>项目审阅 / 包装计划</span></div></div>
      <nav><button onClick={onBack}>原卡片库</button><button onClick={onOpenTemplates}>模板库 ↗</button></nav>
    </header>
    <section className="rb-project">
      <div><p className="rb-kicker">真实口播 · 旧方案占位</p><h1>{project.title}</h1><p>{clock(project.durationFrames)} · {project.clipCount} 个口播片段 · {project.captionCount} 条字幕 · {project.shots.length} 个包装镜头</p></div>
      <div className="rb-progress"><span><b>{approved}</b> / {project.shots.length} 镜头已确认</span><div><i style={{width:`${approved/project.shots.length*100}%`}}/></div><small>你看方案和素材，我按意见修改</small></div>
    </section>
    <div className="rb-flow"><span className="done">✓ 初剪与字幕</span><i>→</i><span className="current">② 规划 · 模板 · 素材审阅</span><i>→</i><span>③ 样段预览</span><i>→</i><span>④ ChatCut 装配</span></div>
    <section className="rb-layout">
      <aside className="rb-sidebar">
        <div className="rb-sidebar-heading"><h2>镜头清单</h2><span>{shown.length} 段</span></div>
        <div className="rb-filters" aria-label="镜头筛选">
          {[['all','全部'],['pending','待确认'],['changes_requested',`需调整 ${changes}`],['approved','已确认']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}
        </div>
        <div className="rb-shot-list">{shown.length?shown.map((s,index)=>{
          const r=review.shots[s.id]??empty;
          const unresolved=r.comments.filter(c=>!c.resolved).length;
          return <button className={`rb-shot ${selected===s.id?'selected':''}`} key={s.id} onClick={()=>select(s.id)} aria-label={`查看镜头 ${s.title}`} aria-current={selected===s.id?'true':undefined}>
            <div className="rb-shot-top"><span>{clock(s.startFrame)} — {clock(s.endFrame)}</span><span className={`rb-status ${r.status}`}>{labels[r.status]}</span></div>
            <div className="rb-shot-body"><img src={s.preview} alt="" loading="lazy"/><div><strong>{s.title}</strong><small>{s.mode} · {unresolved?`${unresolved} 条待处理意见`:s.packaging}</small></div></div>
          </button>;
        }):<p className="rb-empty">这个分类暂时没有镜头。</p>}</div>
      </aside>
      <div className="rb-main">
        <div className="rb-scene-heading"><div><p className="rb-kicker">{clock(shot.startFrame)} — {clock(shot.endFrame)} · {((shot.endFrame-shot.startFrame)/project.fps).toFixed(1)} 秒</p><h2>{shot.title}</h2></div><span className={`rb-status ${state.status}`}>{labels[state.status]}</span></div>
        <section className="rb-preview">
          <div role="tablist" aria-label="预览模式"><button role="tab" aria-selected={tab==='frame'} onClick={()=>setTab('frame')}>画面参考</button><button role="tab" aria-selected={tab==='template'} disabled={!template} onClick={()=>setTab('template')}>模板动效</button><span>{shot.mode}</span></div>
          {tab==='frame'?<div className="rb-image"><img src={shot.preview} alt={`${shot.title} 的历史包装合成参考`}/><span className="rb-reference">旧 v2 参考帧</span>{shot.caption&&<p className="rb-caption">{shot.caption}</p>}</div>
            :<iframe title={`${template!.title} 模板动效`} src={template!.demo_url} sandbox="allow-scripts allow-same-origin"/>}
          <p className="rb-preview-note">{tab==='frame'?'已有包装的合成参考，供本轮讨论；还不是新的确认版本。':'模板原始演示：看运动形式，真实文案和配色以项目为准。'}</p>
        </section>
        <section className="rb-transcript"><span>这一段说了什么</span><p>{shot.transcript}</p></section>
        <section className="rb-plan rb-panel">
          <div className="rb-section-head"><h3>包装计划</h3><span>规划建议 · 待确认</span></div>
          <div className="rb-intent"><span>重点</span><strong>{shot.intent}</strong></div>
          <p>{shot.reason}</p>
          <div className="rb-rule-chips">{shot.ruleIds.map(id=><span key={id}>↳ {ruleLabels[id]??id}</span>)}</div>
          <div className="rb-template-row"><div><small>{shot.layerNote}</small><strong>{template?.title??'原生素材 / 定制包装'}</strong><span>{shot.packaging}</span></div><button onClick={()=>{setPicker(true);setSearch('');}}>建议换模板</button></div>
          {shot.attention.map(note=><p className="rb-attention" key={note}><b>待核对</b>{note}</p>)}
        </section>
        <section className="rb-assets rb-panel"><div className="rb-section-head"><h3>本段素材</h3><span>{assets.length} 项 · 可查看来源</span></div>
          <div className="rb-asset-grid">{assets.map(asset=><article key={asset.id}>
            {asset.kind==='video'?<video key={asset.url} src={asset.url} controls muted playsInline preload="none"/>:<img src={asset.url} alt={asset.label} loading="lazy"/>}
            <div><strong>{asset.label}</strong><p>{asset.note}</p>{asset.source?<a href={asset.source} target="_blank" rel="noreferrer">查看来源 ↗</a>:<span className="rb-local-source">实拍源视频</span>}</div>
          </article>)}</div>
        </section>
        <details className="rb-provenance"><summary>项目资料说明</summary><p>{project.provenance}</p><p>快照：{project.snapshotDate} · {project.styleLabel}。镜头字幕可能跨边界重复展示，实际字幕与时间线未改动。</p></details>
      </div>
      <aside className="rb-feedback rb-panel">
        <div className="rb-section-head"><h3>这段怎么改？</h3><span>{pending} 条待处理</span></div>
        <p className="rb-muted">直接写你不满意的地方，意见会跟着当前镜头保存。</p>
        <div className="rb-quick">{['换个效果','素材不合适','包装太密'].map(text=><button key={text} onClick={()=>setDrafts(prev=>({...prev,[shot.id]:prev[shot.id]?`${prev[shot.id]}\n${text}：`:text+'：'}))}>{text}</button>)}</div>
        <label className="rb-input-label" htmlFor="review-comment">修改意见</label>
        <textarea id="review-comment" maxLength={2000} placeholder="例如：这一段先留人物，工具标识小一点；别一直用白卡。" value={drafts[shot.id]??''} onChange={event=>setDrafts(prev=>({...prev,[shot.id]:event.target.value}))}/>
        <button className="rb-submit" disabled={!ready||saving||!(drafts[shot.id]??'').trim()} onClick={submit}>{saving?'正在保存…':'提交意见'}</button>
        {error&&<p className="rb-error" role="alert">{error}</p>}{message&&<p className="rb-saved" role="status">✓ {message}</p>}
        <div className="rb-comments"><h4>本段意见</h4>{state.comments.length?state.comments.map(comment=><article key={comment.id} className={comment.resolved?'resolved':''}>
          <div><strong>龙神</strong><span>{comment.resolved?'已标记处理':'待处理'}</span></div><p>{comment.text}</p>
          <div className="rb-comment-actions"><button disabled={saving} onClick={()=>mutate(shot.id,{action:'resolve',commentId:comment.id})}>{comment.resolved?'重新打开':'标记已处理'}</button><button disabled={saving} onClick={()=>mutate(shot.id,{action:'delete',commentId:comment.id})}>撤回</button></div>
        </article>):<p className="rb-empty">还没有意见。先看看方案和素材。</p>}</div>
        <div className="rb-confirm"><button className="rb-approve" disabled={!ready||saving||pending>0||state.status==='approved'} onClick={()=>mutate(shot.id,{action:'status',status:'approved'})}>{state.status==='approved'?'✓ 这段已确认':'确认这段方案'}</button>
          {state.status==='approved'&&<button className="rb-reset" disabled={saving} onClick={()=>mutate(shot.id,{action:'status',status:'pending'})}>重新讨论</button>}
          <p>{pending?'先处理意见，再确认方案。':'确认会记录审阅状态；不会立即改片或渲染。'}</p></div>
      </aside>
    </section>
    {picker&&<div className="rb-modal-backdrop"><section className="rb-modal" role="dialog" aria-modal="true" aria-label="建议替换模板">
      <div className="rb-section-head"><div><h3>给这段建议一个模板</h3><p>记录为修改意见，重新规划后再制作。</p></div><button onClick={()=>setPicker(false)}>关闭</button></div>
      <input aria-label="搜索候选模板" placeholder="搜索用途或模板名称…" value={search} onChange={event=>setSearch(event.target.value)}/>
      <div className="rb-candidates">{candidates.map(card=><button key={card.slug} disabled={!ready||saving} onClick={async()=>{if(await mutate(shot.id,{action:'comment',text:`建议改用「${card.title}」（${card.slug}）${card.adapter?'':'，这张需要先做制作适配'}。请重新检查语义、版式与素材。`}))setPicker(false);}}>
        <span>{card.category} · {card.adapter?'已有制作适配':'需制作适配'}</span><strong>{card.title}</strong><small>{card.oneliner}</small>
      </button>)}</div>
    </section></div>}
  </main>;
}
