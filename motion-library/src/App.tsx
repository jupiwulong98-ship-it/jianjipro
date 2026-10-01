import {useEffect, useState} from 'react';
import {TalkCraftGallery} from './talkcraft/Gallery';
import {ProjectBoard} from './review/ProjectBoard';
import './styles.css';

export function App() {
  const viewFromHash=()=>window.location.hash==='#review'?'review':'talkcraft';
  const [view,setView]=useState(viewFromHash);
  useEffect(()=>{const update=()=>setView(viewFromHash());window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  const navigate=(next:'review'|'talkcraft')=>{setView(next);window.location.hash=next;};
  if(view==='review') return <ProjectBoard onBack={()=>navigate('talkcraft')} onOpenTemplates={()=>navigate('talkcraft')}/>;
  return <TalkCraftGallery onBack={()=>navigate('review')}/>;
}
