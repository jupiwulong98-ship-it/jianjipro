import {useEffect,useRef} from 'react';
import type {PlanningProject} from './types';

export function SamplePreview({sample,start=0,onClose}:{sample:NonNullable<PlanningProject['reference_sample']>;start?:number;onClose:()=>void}) {
  const dialog=useRef<HTMLElement>(null);
  useEffect(()=>{
    const opener=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';dialog.current?.focus();
    return()=>{document.body.style.overflow=overflow;opener?.focus();};
  },[]);
  return <div className="pb-preview-backdrop" onClick={onClose}><section ref={dialog} role="dialog" aria-modal="true" tabIndex={-1} aria-label="动效候选预览" className="pb-rule-dialog" onClick={event=>event.stopPropagation()} onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();onClose();}
    if(event.key==='Tab'){
      const items=dialog.current?.querySelectorAll<HTMLElement>('button,video');if(!items?.length)return;
      if(event.shiftKey&&(document.activeElement===items[0]||document.activeElement===dialog.current)){event.preventDefault();items[items.length-1].focus();}
      else if(!event.shiftKey&&(document.activeElement===items[items.length-1]||document.activeElement===dialog.current)){event.preventDefault();items[0].focus();}
    }
  }}>
    <header><div><p className="pb-eyebrow">当前项目 · 可播放候选</p><h2>{sample.title}</h2></div><button aria-label="关闭样段参考" onClick={onClose}>关闭 ✕</button></header>
    <p className="pb-preview-note">包含真实人物、原口播与剪后字幕。操作界面为真实截图，图形为解释性示意；此处播放的是本地参考渲染。</p>
    <video aria-label="动效候选视频" controls preload="metadata" poster={sample.poster} src={sample.url} onLoadedMetadata={event=>{event.currentTarget.currentTime=start;}} style={{width:'100%',display:'block',borderRadius:12}}/>
    <p className="pb-preview-note">画面与时点以当前策划表为准。先看、听实际样段，再回到对应行留意见或确认。</p>
  </section></div>;
}
