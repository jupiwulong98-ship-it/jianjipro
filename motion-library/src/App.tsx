import {useEffect, useState} from 'react';
import {TalkCraftGallery} from './talkcraft/Gallery';
import {ProjectBoard} from './review/ProjectBoard';
import {PlanningBoard} from './planning/PlanningBoard';
import './styles.css';

export function App() {
  const viewFromHash=()=>window.location.hash==='#review'?'review':window.location.hash==='#talkcraft'?'talkcraft':'planning';
  const [view,setView]=useState(viewFromHash);
  useEffect(()=>{const update=()=>setView(viewFromHash());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  const navigate=(next:'review'|'talkcraft'|'planning')=>{setView(next);window.location.hash=next;};
  if(view==='planning') return <PlanningBoard onHistory={()=>navigate('review')} onTemplates={()=>navigate('talkcraft')}/>;
  if(view==='review') return <ProjectBoard onBack={()=>navigate('talkcraft')} onOpenTemplates={()=>navigate('talkcraft')} onPlanning={()=>navigate('planning')}/>;
  return <TalkCraftGallery onBack={()=>navigate('planning')}/>;
}
