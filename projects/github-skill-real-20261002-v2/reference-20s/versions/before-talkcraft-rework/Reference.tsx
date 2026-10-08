import React from 'react';
import {AbsoluteFill,Composition,OffthreadVideo,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import plan from './reference-plan.json';

// This local candidate uses the existing project's cyan/white skin, not a new brand direction.
const cyan='#22d3ee', ink='#f8fafc', dark='#10141d';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ramp=(t:number,at:number,d=.35)=>clamp((t-at)/d);
const smooth=(p:number)=>1-Math.pow(1-p,3);
const between=(t:number,a:number,b:number)=>ramp(t,a,.22)*(1-ramp(t,b-.2,.2));
const font='"PingFang SC", "Noto Sans SC", sans-serif';

function Tool({x,y,kind=0,scale=1,opacity=1}:{x:number;y:number;kind?:number;scale?:number;opacity?:number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <rect x="-37" y="-37" width="74" height="74" rx="19" fill={dark} stroke={cyan} strokeWidth="3"/>
    {kind===0?<><path d="M-19 -8L-29 0L-19 8M19 -8L29 0L19 8M7 -18L-7 18" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round"/></>:
     kind===1?<><rect x="-19" y="-23" width="38" height="46" rx="3" fill="none" stroke={ink} strokeWidth="3"/><path d="M-10 -10H10M-10 1H10M-10 12H3" stroke={ink} strokeWidth="3"/></>:
     <><circle r="20" fill="none" stroke={ink} strokeWidth="3"/><path d="M-7 -10L12 0L-7 10Z" fill={ink}/></>}
  </g>;
}
function Search({x,y,scale=1}:{x:number;y:number;scale?:number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><circle r="27" stroke={cyan} strokeWidth="6" fill={dark}/><path d="M20 20L44 44" stroke={cyan} strokeWidth="8" strokeLinecap="round"/></g>;
}
function AudienceNumber({t}:{t:number}) {
  const progress=smooth(ramp(t,3.21,.68));
  const landed=t>=3.89;
  const value=landed?'10':(Math.floor(progress*100)/10).toFixed(1);
  const entry=smooth(ramp(t,3.21,.15));
  return <div style={{position:'absolute',left:140,top:285,width:530,opacity:between(t,3.21,5.066667),transform:`translateY(${16*(1-entry)}px) scale(${.97+.03*entry})`,transformOrigin:'0 50%',textShadow:'0 3px 8px #0006'}}>
    <div style={{display:'flex',alignItems:'baseline',gap:8,color:cyan,lineHeight:1,fontWeight:900,fontVariantNumeric:'tabular-nums'}}><span style={{fontSize:180,minWidth:285}}>{value}</span><span style={{fontSize:92}}>万{landed?'+':''}</span></div>
    <div style={{marginTop:25,fontSize:49,fontWeight:800,color:ink}}>人看过</div>
  </div>;
}
function Shared({t}:{t:number}) {
  const open=smooth(ramp(t,6.626667,.45));
  const publicState=ramp(t,7.966667,.45);
  const repo=ramp(t,9.366667,.2);
  const search=smooth(ramp(t,9.366667,.88));
  const found=ramp(t,10.246667,.15);
  return <div style={{position:'absolute',left:110,top:265,width:600,height:480,opacity:between(t,5.066667,10.866667),transform:`translateY(${18*(1-ramp(t,5.066667,.3))}px)`}}>
    <svg viewBox="0 0 600 480" width="600" height="480">
      <path d="M65 175V112Q65 90 88 90H221L255 123H492Q515 123 515 148V345Q515 367 492 367H88Q65 367 65 345Z" fill={dark} fillOpacity=".94" stroke={cyan} strokeWidth="4"/>
      <g opacity={.3+.7*open}>
        {[0,1,2].map(i=><Tool key={i} kind={i} x={164+i*126} y={215-publicState*(27+i%2*35)} scale={.9+publicState*.08}/>)}
      </g>
      <g transform={`translate(0 ${open*60})`} opacity={1-open}>
        <path d="M65 175H515V345Q515 367 492 367H88Q65 367 65 345Z" fill={dark} stroke={cyan} strokeWidth="4"/>
      </g>
      <g opacity={1-publicState} transform={`translate(290 ${254+open*72}) rotate(${-open*18})`}>
        <rect x="-31" y="-6" width="62" height="50" rx="8" fill={cyan}/>
        <path d={`M-20 -4V-26Q-20 -50 0 -50Q20 -50 20 -26V${-4-open*26}`} stroke={cyan} strokeWidth="8" strokeLinecap="round" fill="none"/>
        <circle cy="15" r="5" fill={dark}/>
      </g>
      <g opacity={repo}><Search x={530-search*240} y={108+search*82} scale={.8}/></g>
      <rect x="232" y="130" width="116" height="116" rx="24" fill="none" stroke={ink} strokeWidth="3" opacity={found}/>
      <text x="290" y="328" textAnchor="middle" fill={ink} fontSize="44" fontWeight="800" opacity={repo}>共享项目</text>
    </svg>
  </div>;
}
function Method({t}:{t:number}) {
  const retreat=smooth(ramp(t,11.706667,.5));
  const path=smooth(ramp(t,13.533333,.75));
  const focus=smooth(ramp(t,14.573333,.16));
  return <div style={{position:'absolute',left:90,top:255,width:630,height:460,opacity:between(t,10.866667,15.766667)}}>
    <svg viewBox="0 0 630 460" width="630" height="460">
      <g transform={`translate(${-retreat*45} 0)`} opacity={1-retreat*.72}>
        {[0,1,2].map(i=><Tool key={i} kind={i} x={115+i*152} y={125} scale={1-retreat*.2}/>)}
        <text x="267" y="216" fill={ink} textAnchor="middle" fontSize="40" fontWeight="700">工具清单</text>
      </g>
      <path d="M85 326C175 260 365 400 530 288" fill="none" stroke={cyan} strokeWidth="5" strokeDasharray="520" strokeDashoffset={520*(1-path)} opacity={path}/>
      <g opacity={path}><Search x={85+path*390} y={326-38*path} scale={.9}/></g>
      <text x="250" y="440" textAnchor="middle" fill={ink} fontSize="49" fontWeight="900" opacity={focus}>找方法</text>
    </svg>
  </div>;
}
function NoWaiting({t}:{t:number}) {
  const needs=smooth(ramp(t,16.246667,.3));
  const cut=smooth(ramp(t,17.006667,.4));
  const finish=smooth(ramp(t,18.926667,.45));
  const clockOpacity=(1-cut*.4)*(1-finish*.7);
  const angle=(t<17.006667?(t-15.766667)*80:99)*Math.PI/180;
  return <div style={{position:'absolute',left:100,top:240,width:620,height:490,opacity:ramp(t,15.766667,.25)}}>
    <svg viewBox="0 0 620 490" width="620" height="490">
      <g opacity={needs}>
        <circle cx="135" cy="145" r="70" fill={dark} stroke={cyan} strokeWidth="4"/>
        <path d="M121 119Q121 96 140 96Q163 96 163 119Q163 134 141 142V157" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round"/>
        <circle cx="141" cy="177" r="4" fill={ink}/>
        <text x="135" y="262" textAnchor="middle" fill={ink} fontSize="44" fontWeight="800">你的需求</text>
      </g>
      <path d={`M205 145C320 145 290 264 ${420-cut*75} 264`} fill="none" stroke={cyan} strokeWidth="4" strokeDasharray="9 10" opacity={1-cut}/>
      <g opacity={clockOpacity} transform={`translate(${finish*18} ${finish*30}) scale(1)`}>
        <circle cx="453" cy="267" r="66" fill={dark} stroke={ink} strokeWidth="4"/>
        <path d={`M453 267L${453+Math.sin(angle)*35} ${267-Math.cos(angle)*35}M453 267L453 230`} fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round"/>
        <text x="453" y="382" textAnchor="middle" fill={ink} fontSize="36" fontWeight="700">等分享</text>
      </g>
      <path d="M395 325L510 210" stroke={cyan} strokeWidth="7" strokeLinecap="round" strokeDasharray="180" strokeDashoffset={180*(1-cut)} opacity={cut*(1-finish*.35)}/>
      <path d="M205 145H330" fill="none" stroke={cyan} strokeWidth="5" strokeDasharray="125" strokeDashoffset={125*(1-finish)} opacity={finish}/>
      <circle cx="335" cy="145" r="5" fill={cyan} opacity={finish}/>
    </svg>
  </div>;
}
function Candidate() {
  const t=useCurrentFrame()/30;
  const caption=plan.captions.find(c=>t>=c.start&&t<c.end);
  return <AbsoluteFill style={{fontFamily:font,color:ink,background:'#111'}}>
    <OffthreadVideo src={staticFile('base.mp4')} style={{width:'100%',height:'100%'}}/>
    <AudienceNumber t={t}/><Shared t={t}/><Method t={t}/><NoWaiting t={t}/>
    {caption&&<div style={{position:'absolute',left:220,right:220,bottom:78,display:'flex',justifyContent:'center'}}>
      <div style={{fontSize:64,lineHeight:1.15,fontWeight:900,textAlign:'center',maxWidth:1320,textShadow:'0 3px 3px #0009',WebkitTextStroke:'1.6px #252525',paintOrder:'stroke fill',whiteSpace:'normal'}}>{caption.text}</div>
    </div>}
  </AbsoluteFill>;
}
function Root(){return <Composition id="First20Reference" component={Candidate} width={1920} height={1080} fps={30} durationInFrames={600}/>;}
registerRoot(Root);
