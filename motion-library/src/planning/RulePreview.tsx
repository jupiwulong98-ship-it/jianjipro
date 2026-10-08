import {useEffect,useRef,useState} from 'react';
import rules from './rules.json';
import type {PlanningScene} from './types';

export const ruleFor=(scene:PlanningScene)=>rules.find(rule=>rule.id===(scene.packaging_rule??(scene.mode==='clean'?'clean_presenter':'')));

function RuleGraphic({kind,ruleId,progress}:{kind:string;ruleId:string;progress:number}) {
  const phase=Math.min(3,Math.floor(progress*4));
  const node=(x:number,y:number,label:string,lit:boolean,key:string)=> <g key={key} className={`pb-demo-node ${lit?'lit':''}`}>
    <rect x={x-64} y={y-28} width="128" height="56" rx="14"/><text x={x} y={y+5} textAnchor="middle">{label}</text></g>;
  const line=(x1:number,y1:number,x2:number,y2:number,lit:boolean,key:string)=> <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} className={lit?'lit':''} markerEnd="url(#pb-demo-arrow)"/>;
  const labels=ruleId==='input_process_output'?['输入材料','工具处理','待核验结果']:['第一步','第二步','第三步'];
  return <svg viewBox="0 0 640 320" role="img" aria-label="包装规则动态示意" className="pb-rule-graphic" data-phase={phase}>
    <defs><marker id="pb-demo-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="context-stroke"/></marker></defs>
    {(kind==='presenter'||kind==='focus')&&<>
      <rect x="170" y="30" width="220" height="220" rx="24" className="pb-demo-presenter"/>
      <circle cx="280" cy="98" r="36"/><path d="M208 230 Q208 152 280 152 Q352 152 352 230"/>
      <text x="280" y="279" textAnchor="middle">人物画面示意</text>
      {kind==='focus'&&<g opacity={phase>0?1:0} className="pb-demo-reveal">{node(490,150,'一个重点',true,'focus')}</g>}
    </>}
    {kind==='number'&&<>
      <text x="320" y="160" textAnchor="middle" className="pb-demo-symbol">{progress<.45?`${(10*Math.min(1,progress/.45)).toFixed(1)}万`:'10万+'}</text>
      <text x="320" y="228" textAnchor="middle">终值取自口播 · 此处为数量示意</text>
    </>}
    {kind==='sequence'&&<>
      {line(175,160,253,160,phase>=1,'a')}{line(385,160,463,160,phase>=2,'b')}
      {labels.map((label,index)=>node(110+index*210,160,label,phase>=index,String(index)))}
      <circle cx={110+Math.min(progress*2,2)*210} cy="212" r="5" className="pb-demo-dot"/>
    </>}
    {(kind==='branches'||kind==='collection')&&<>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y],index)=>{
        const nx=320+x*210,ny=160+y*91;
        return <g key={index} opacity={phase>=index?1:.15}>{line(320+x*65,160+y*29,nx-x*65,ny-y*29,phase>=index,`line${index}`)}{node(nx,ny,kind==='collection'?`工具 ${index+1}`:`关联 ${index+1}`,phase>=index,`node${index}`)}</g>;
      })}
      {node(320,160,ruleId==='one_to_many'?'共享母体':kind==='collection'?'合集入口':'核心对象',true,'center')}
    </>}
    {kind==='parallel'&&<>
      {[0,1,2].map(index=><g key={index}>{node(110+index*210,132,`任务 ${index+1}`,phase===index||phase===3,String(index))}
        <rect x={66+index*210} y="191" width={88*(.2+((progress+index*.22)%1)*.8)} height="6" rx="3" className="pb-demo-dot"/></g>)}
      <text x="320" y="250" textAnchor="middle">多个任务同时进行</text>
    </>}
    {kind==='contrast'&&<>
      {node(155,160,ruleId==='not_equal'?'关注 / 安装':'对象 / 前态 A',true,'left')}
      <text x="320" y="177" textAnchor="middle" className="pb-demo-symbol" opacity={phase>0?1:0}>{ruleId==='not_equal'?'≠':'↔'}</text>
      {node(485,160,ruleId==='not_equal'?'适用 / 有效':'对象 / 后态 B',phase>=2,'right')}
    </>}
    {kind==='conditions'&&<>
      {line(214,87,370,152,phase>=1,'c1')}{line(214,233,370,168,phase>=2,'c2')}
      {node(150,85,'条件一成立',phase>=1,'first')}{node(150,235,'条件二成立',phase>=2,'second')}
      {node(445,160,'两项满足才可用',phase===3,'result')}
      <text x="310" y="170" textAnchor="middle">AND</text>
    </>}
    {kind==='conditional'&&<>
      {line(180,160,260,160,phase>=1,'check')}{line(380,160,460,160,phase>=2,'next')}
      {node(115,160,'检查条件',true,'first')}{node(320,160,phase>=1?'通过 ✓':'等待通过',phase>=1,'gate')}{node(525,160,'安装 / 试用',phase>=2,'next')}
    </>}
    {kind==='handoff'&&<>
      {node(150,160,'来源位置',true,'from')}{node(490,160,'接收位置',phase>=2,'to')}
      {line(215,160,425,160,phase>0,'path')}
      <g transform={`translate(${150+Math.min(1,progress*1.4)*340},235)`}><rect x="-44" y="-16" width="88" height="32" rx="8" className="pb-demo-dot"/><text x="0" y="5" textAnchor="middle" className="pb-demo-masked">██████</text></g>
      <text x="320" y="287" textAnchor="middle">交接对象始终打码</text>
    </>}
    {kind==='screen'&&<>
      <rect x="60" y="30" width="520" height="250" rx="14" className="pb-demo-screen"/>
      <text x="320" y="66" textAnchor="middle">已打码素材占位 · 待绑定真实截图</text>
      {[0,1,2].map(index=><g key={index} opacity={ruleId==='document_checks'?(Math.min(phase,2)===index?1:.3):index===1?1:.3}>
        <rect x="108" y={99+index*49} width="424" height="33" rx="7" className={phase>0&&(ruleId==='document_checks'?Math.min(phase,2)===index:index===1)?'pb-demo-target':''}/>
        <text x="320" y={121+index*49} textAnchor="middle">{ruleId==='document_checks'?['用途位置','效果位置','安装与使用位置'][index]:index===1?'操作目标区域':'页面位置参考'}</text>
      </g>)}
    </>}
  </svg>;
}

export function RulePreview({scene,onClose}:{scene:PlanningScene;onClose:()=>void}) {
  const rule=ruleFor(scene);
  const [progress,setProgress]=useState(0);
  const [playing,setPlaying]=useState(true);
  const dialog=useRef<HTMLElement>(null);
  useEffect(()=>{
    const opener=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.current?.focus();
    return()=>{document.body.style.overflow=overflow;opener?.focus();};
  },[]);
  useEffect(()=>{
    if(!playing) return;
    const timer=window.setInterval(()=>setProgress(current=>Math.min(1,current+1/60)),100);
    return()=>window.clearInterval(timer);
  },[playing]);
  useEffect(()=>{if(progress>=1)setPlaying(false);},[progress]);
  const currentAction=scene.actions.length?Math.min(scene.actions.length-1,Math.floor(progress*scene.actions.length)):-1;
  if(!rule) return null;
  return <div className="pb-preview-backdrop" onClick={onClose}><section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${rule.label}预览`} className="pb-rule-dialog" onClick={event=>event.stopPropagation()} onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();onClose();}
    if(event.key==='Tab'){
      const items=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]');
      if(!items?.length)return;
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){event.preventDefault();first.focus();}
    }
  }}>
    <header><div><p className="pb-eyebrow">包装规则示意</p><h2>{rule.label}</h2><p>{rule.description}</p></div><button aria-label="关闭预览" onClick={onClose}>关闭 ✕</button></header>
    <p className="pb-preview-note">通用动态示意 · 本段成片尚未制作。界面与人物使用占位，最终素材和构图另行审阅。</p>
    <RuleGraphic kind={rule.kind} ruleId={rule.id} progress={progress}/>
    <div className="pb-play-controls"><button onClick={()=>{if(progress>=1)setProgress(0);setPlaying(value=>!value);}}>{playing?'暂停示意':'播放示意'}</button><button onClick={()=>{setProgress(0);setPlaying(true);}}>重新播放</button><progress aria-label="规则示意播放进度" value={progress} max="1"/></div>
    <section className="pb-preview-script"><h3>这段准备这样包装</h3><p>{scene.initial_state}</p>{scene.actions.length?<ol>{scene.actions.map((action,index)=><li key={`${action.word_id}-${index}`} className={currentAction===index?'active':''}><b>说到「{action.text.trim()}」</b><span>{action.description}</span></li>)}</ol>:<p>保持人物讲述，不增加解释性动画。</p>}<p>{scene.final_state}</p></section>
  </section></div>;
}
