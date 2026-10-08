import React from 'react';
import {AbsoluteFill,Composition,Freeze,Img,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import Keyword from '../../motion-library/adapters/talkcraft/cards/keyword-pop-highlight';
import Steps from '../../motion-library/adapters/talkcraft/cards/numbered-step-stack';
import {Skin,defaultTheme} from '../../motion-library/adapters/talkcraft/theme';
const C={bg:'#10141d',ink:'#f8fafc',accent:'#22d3ee',muted:'#b3bfce',panel:'#202936'};
const font='"PingFang SC", "Noto Sans SC", sans-serif';
const ease=(f:number,at:number,d=10)=>Math.max(0,Math.min(1,(f-at)/d));
const enter=(frame:number,at:number)=>{const p=ease(frame,at);return {opacity:p,transform:`translateY(${(1-p)*20}px)`};};
function Arrow({width=90,color=C.accent}:any){return <svg width={width} height="40" viewBox={`0 0 ${width} 40`}><path d={`M 4 20 H ${width-14} M ${width-28} 7 L ${width-14} 20 L ${width-28} 33`} stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function NotEqual(){return <svg width="150" height="150" viewBox="0 0 150 150"><path d="M 20 58 H 130 M 20 96 H 130 M 110 20 L 42 130" stroke={C.accent} strokeWidth="12" strokeLinecap="round"/></svg>;}
function Box({children,style={}}:any){return <div style={{padding:'28px 32px',border:'2px solid #354555',borderRadius:18,background:C.panel,fontSize:48,fontWeight:700,lineHeight:1.25,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',...style}}>{children}</div>;}
function Header({title,tag='GITHUB · 找到需要的工具'}:any){return <div style={{display:'flex',flexDirection:'column',gap:20}}><div style={{fontSize:25,color:C.accent,letterSpacing:3}}>{tag}</div><div style={{fontSize:66,fontWeight:800,lineHeight:1.15}}>{title}</div></div>;}
function Screen({p,frame,id}:any){
 const isReadme=id==='readme';
 const base=isReadme?[220,550,1270,480]:[0,0,1920,726];
 const raw=p.focus;
 const cw=raw?Math.min(1920,Math.max(raw[2]+250,750)):base[2]; const ch=cw*620/1640;
 const target=raw?[Math.min(1920-cw,Math.max(0,raw[0]+raw[2]/2-cw/2)),Math.min(1080-ch,Math.max(0,raw[1]+raw[3]/2-ch/2)),cw,ch]:base;
 const at=id==='stars'?8.97*30:24;
 const z=ease(frame,at,22);
 const crop=base.map((v:number,i:number)=>v+(target[i]-v)*z);
 const w=1640,h=620,scale=Math.min(w/crop[2],h/crop[3]);
 const x=(w-crop[2]*scale)/2-crop[0]*scale,y=(h-crop[3]*scale)/2-crop[1]*scale;
 return <><div style={{position:'absolute',left:140,top:195,width:w,height:h,overflow:'hidden',borderRadius:16,background:'#fff',border:'2px solid #5b7288'}}><Img src={staticFile(p.src.slice(6))} style={{position:'absolute',left:x,top:y,width:1920*scale,height:1080*scale,maxWidth:'none'}}/></div><div style={{position:'absolute',right:160,top:730,padding:'16px 28px',background:C.accent,color:'#10141d',borderRadius:8,fontSize:36,fontWeight:800}}>{p.caption}</div><div style={{position:'absolute',left:145,top:832,fontSize:23,color:C.muted}}>真实页面 · {p.source}</div></>;
}
function Branches({p,frame,structure}:any){
 const center=structure==='center_branches';
 if(center)return <div style={{position:'absolute',inset:'280px 120px 230px'}}><svg width="1680" height="570" viewBox="0 0 1680 570" style={{position:'absolute',inset:0}}><path d="M 700 280 L 440 110 M 970 280 L 1250 110 M 700 280 L 440 440 M 970 280 L 1250 440" stroke="#4c7284" strokeWidth="5" fill="none"/></svg><Box style={{position:'absolute',left:625,top:200,width:370,height:155,background:C.accent,color:C.bg,fontSize:72}}>{p.center}</Box>{p.items.map((txt:string,i:number)=>{const loc=[[50,35],[1190,35],[50,385],[1190,385]][i];return <Box key={txt} style={{position:'absolute',left:loc[0],top:loc[1],width:430,height:110,...enter(frame,p.entryTimes[i]*30)}}>{txt}</Box>})}</div>;
 return <div style={{position:'absolute',left:150,right:150,top:310,height:490,display:'flex',alignItems:'center',gap:70}}><Box style={{width:430,height:170,background:C.accent,color:C.bg}}>{p.center}</Box><div style={{width:140,height:370,position:'relative'}}><svg width="140" height="370" viewBox="0 0 140 370"><path d="M 0 185 H 55 M 55 50 V 320 M 55 50 H 135 M 55 185 H 135 M 55 320 H 135" stroke={C.accent} strokeWidth="5" fill="none"/></svg></div><div style={{display:'flex',flexDirection:'column',gap:25,flex:1}}>{p.items.map((txt:string,i:number)=><Box key={txt} style={{height:85,...enter(frame,p.entryTimes[i]*30)}}>{txt}</Box>)}</div></div>;
}
function SequenceMap({p,frame}:any){
 const n=p.items.length;
 const six=n===6;
 const cols=six?3:n;
 const width=six?500:n===4?340:430;
 return <div style={{position:'absolute',left:120,right:120,top:six?295:375,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:six?'65px 42px':28}}>{p.items.map((txt:string,i:number)=>{const at=(p.entryTimes[i]??0)*30,active=frame>=at;return <div key={txt} style={{position:'relative',...enter(frame,at)}}><div style={{fontSize:25,color:C.accent,marginBottom:14,fontWeight:800}}>0{i+1}</div><Box style={{minHeight:155,width:width-64,fontSize:n===4?39:45,borderColor:active?C.accent:'#354555'}}>{txt}</Box>{i<n-1&&(!six||i%3!==2)&&<div style={{position:'absolute',right:-28,top:90}}><Arrow width={55}/></div>}</div>})}</div>;
}
function Process({p,frame}:any){const first=frame<5.7*30;const list=first?p.items:p.second;return <div style={{position:'absolute',left:120,right:120,top:360,display:'flex',alignItems:'center',justifyContent:'space-between',gap:28}}>{list.map((txt:string,i:number)=><React.Fragment key={txt}><Box style={{width:420,height:190,background:i===1?C.accent:C.panel,color:i===1?C.bg:C.ink,fontSize:48,...enter(frame,first?p.entryTimes[Math.min(i,1)]*30:i?5.7*30:5.7*30)}}>{txt}</Box>{i<2&&<Arrow width={110}/>}</React.Fragment>)}</div>;}
function Generated({shot}:any){
 const frame=useCurrentFrame();const p=shot.primary_motion_request.content;const structure=shot.visual_structure;
 const full=shot.presentation_mode==='full_screen';
 if(shot.resolution.status==='resolved'){
  const b=shot.box;const scale=full?Math.min(b.width/960,b.height/540):.78;const Card=shot.card.slug==='numbered-step-stack'?Steps:Keyword;
  return <Skin theme={{...defaultTheme,accent:C.accent,fontFamily:font}}><AbsoluteFill style={{background:full?C.bg:'transparent'}}><div className="tc-stage" style={{position:'absolute',...b,background:shot.card.panel==='light'?'#f8fafc':'transparent',borderRadius:full?0:18}}><div style={{position:'absolute',left:(b.width-960*scale)/2,top:(b.height-540*scale)/2,width:960,height:540,transform:`scale(${scale})`,transformOrigin:'0 0'}}><Card {...p}/></div></div>{full&&<><style>{".tc-stage .stack{left:220px}"}</style><div style={{position:"absolute",left:140,top:70,color:"#171923",fontSize:58,fontWeight:800}}>你只需要会三件事</div></>}</AbsoluteFill></Skin>;
 }
 return <AbsoluteFill style={{background:full?C.bg:'transparent',color:C.ink,fontFamily:font}}><div style={{position:'absolute',left:140,top:70,right:140}}><Header title={p.title}/></div>
 {p.kind==='screen'?<Screen p={p} frame={frame} id={shot.id}/>:
 structure==='center_branches'||structure==='one_to_many'?<Branches p={p} frame={frame} structure={structure}/>:
 structure==='not_equal'?<div style={{position:'absolute',left:140,right:140,top:355,display:'flex',alignItems:'center',gap:75}}><Box style={{flex:1,minHeight:210,...enter(frame,0)}}>{p.left}</Box><div style={enter(frame,(p.entryTimes[1]??.8)*30)}><NotEqual/></div><Box style={{flex:1,minHeight:210,...enter(frame,(p.entryTimes[1]??.8)*30)}}>{p.right}</Box></div>:
 structure==='parallel'?<div style={{position:'absolute',left:130,right:130,top:350,display:'flex',gap:40}}>{p.items.map((txt:string,i:number)=><div key={txt} style={{flex:1,...enter(frame,p.entryTimes[i]*30)}}><div style={{fontSize:95,color:C.accent,fontWeight:800,marginBottom:30}}>0{i+1}</div><Box style={{fontSize:43,minHeight:160}}>{txt}</Box></div>)}</div>:
 structure==='sequence'?<SequenceMap p={p} frame={frame}/>:
 structure==='input_process_output'?<Process p={p} frame={frame}/>:
 structure==='custom'?<div style={{position:'absolute',left:150,right:150,top:335,display:'flex',flexDirection:'column',alignItems:'center',gap:55}}><div style={{display:'flex',gap:55,alignItems:'center'}}><Box>{p.items[0]}</Box><div style={{fontSize:42,color:C.accent,fontWeight:800}}>AND</div><Box style={enter(frame,27)}>{p.items[1]}</Box></div><Box style={{background:C.accent,color:C.bg,width:750,...enter(frame,35)}}>{p.result}</Box></div>:null}
 {p.footer&&<div style={{position:'absolute',left:140,right:140,top:845,fontSize:26,color:C.muted,lineHeight:1.3}}>{p.footer}</div>}
 </AbsoluteFill>;
}
function Root(){return <Composition id="GithubSkillShot" component={Generated} width={1920} height={1080} fps={30} durationInFrames={150} defaultProps={{shot:{}}} calculateMetadata={({props}:any)=>({durationInFrames:props.shot.duration_frames})}/>;}
registerRoot(Root);
