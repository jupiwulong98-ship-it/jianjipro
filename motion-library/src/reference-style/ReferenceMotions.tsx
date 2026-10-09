import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';

const font='"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
const ease=Easing.out(Easing.cubic);
const progress=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const mediaUrl=(src:string)=>/^(data:|https?:)/.test(src)?src:staticFile(src);
type Media={mediaSrc:string;mediaType:'image'|'video';demoOnly?:boolean};
type Base={durationFrames:number};
const MediaFrame=({mediaSrc,mediaType}:Media)=>mediaType==='video'
 ? <OffthreadVideo muted src={mediaUrl(mediaSrc)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
 : <Img src={mediaUrl(mediaSrc)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>;

export type ChapterProps=Base&Media&{chapter:string;title:string;subtitle?:string;backgroundMode?:'presenter_natural'|'media_first'};
export function ReferenceChapter({chapter,title,subtitle='',mediaSrc,mediaType,durationFrames,backgroundMode='media_first',demoOnly=false}:ChapterProps){
 if(!mediaSrc)throw Error('P02 needs a real software screenshot/video');
 const f=useCurrentFrame(),a=progress(f,0,11),b=progress(f,10,26),c=progress(f,14,27);
 const out=progress(f,Math.max(33,durationFrames-18),Math.max(37,durationFrames-1));
 const transparent=backgroundMode==='presenter_natural';
 return <AbsoluteFill style={{fontFamily:font,overflow:'hidden',
  background:transparent?'transparent':'linear-gradient(118deg,#F9F1E7,#EDF0F5 60%,#E3E9F4)'}}>
  <div style={{position:'absolute',left:105,top:120,width:600,opacity:a*(1-out),
    transform:'translateX('+((1-a)*-76-out*100)+'px)'}}>
   <div style={{color:transparent?'#FFFFFF':'#525F77',fontWeight:750,fontSize:25,letterSpacing:7}}>CHAPTER / {chapter}</div>
   <div style={{fontWeight:950,letterSpacing:-17,fontSize:238,lineHeight:1.05,
    color:transparent?'#FFFFFF':'#172646',textShadow:transparent?'0 8px 35px #0B1023BB':'none'}}>{chapter}</div>
   <div style={{height:8,width:142,marginTop:13,background:'#8178D7',borderRadius:12}}/>
   <div style={{opacity:c,fontSize:76,fontWeight:900,lineHeight:1.2,
    color:transparent?'#FFFFFF':'#1B2946',marginTop:35}}>{title}</div>
   {subtitle&&<div style={{opacity:c,fontSize:30,lineHeight:1.4,marginTop:18,
    color:transparent?'#E5E5F9':'#58647B'}}>{subtitle}</div>}
  </div>
  <div style={{position:'absolute',left:748,top:140,width:1070,height:753,opacity:b*(1-out),
   transform:'translateX('+((1-b)*185+out*520)+'px) rotateY('+(out*30)+'deg) scale('+(1-out*.23)+')',
   border:'2px solid white',borderRadius:26,overflow:'hidden',background:'#F6F7FB',
   boxShadow:'0 38px 110px #1B2A5655'}}>
   <div style={{height:54,background:'#F5F7FA',display:'flex',alignItems:'center',paddingLeft:24,gap:9}}>
    {['#E57F8D','#F0C36B','#76C5A8'].map((cc,i)=><span key={i} style={{width:14,height:14,borderRadius:14,background:cc}}/>)}
    <span style={{marginLeft:18,color:'#4B5772',fontSize:20,fontWeight:750}}>软件画面</span>
   </div>
   <div style={{height:699,position:'relative',overflow:'hidden',background:'#182136'}}>
    <MediaFrame mediaSrc={mediaSrc} mediaType={mediaType}/>
    {demoOnly&&<div style={{position:'absolute',bottom:20,right:20,padding:'8px 14px',fontSize:22,background:'#F5D77D',color:'#1D2438',fontWeight:800}}>TEST MEDIA / 仅演示</div>}
   </div>
  </div>
 </AbsoluteFill>;
}

export type CardsProps=Base&{title:string;items:{title:string;description?:string}[];backgroundMode?:'light_explainer'|'dark_tech'};
export function ReferenceCardFan({title,items,durationFrames,backgroundMode='light_explainer'}:CardsProps){
 if(items.length<2||items.length>4)throw Error('P04 requires 2-4 use cards');
 const f=useCurrentFrame(),dark=backgroundMode==='dark_tech',intro=progress(f,0,12);
 const spread=progress(f,12,47),end=progress(f,Math.max(54,durationFrames-16),Math.max(57,durationFrames-1));
 const cw=items.length===4?395:items.length===3?455:560;
 const gap=items.length===4?35:items.length===3?58:90,span=items.length*cw+(items.length-1)*gap;
 const hues=['#8E84EE','#64B8DB','#F2B669','#75BDAB'];
 return <AbsoluteFill style={{fontFamily:font,overflow:'hidden',
  background:dark?'linear-gradient(135deg,#19223C,#293455)':'linear-gradient(125deg,#FBF5E9,#EDEDF3)',
  color:dark?'#F4F6FE':'#243149'}}>
  <div style={{position:'absolute',top:88,left:113,fontWeight:900,fontSize:55,opacity:intro*(1-end)}}>{title}</div>
  <div style={{position:'absolute',top:177,left:115,width:progress(f,10,46)*320,height:6,background:'#887EE5',borderRadius:8}}/>
  {items.map((item,i)=>{
   const dx=(1920-span)/2+i*(cw+gap),x=960-cw/2+(dx-960+cw/2)*spread;
   const a=progress(f,3+i*3,18+i*3);
   return <div key={i} style={{position:'absolute',left:x,top:300-(1-spread)*i*14+(1-a)*65,
    width:cw,height:520,padding:34,boxSizing:'border-box',borderRadius:26,
    background:dark?'#313C57':'white',boxShadow:'0 25px 70px #17213C44',
    border:dark?'1px solid #626E8A':'1px solid #E2E6EC',opacity:a*(1-end),
    transform:'rotate('+((1-spread)*(i-(items.length-1)/2)*-9)+'deg) scale('+(1+(1-spread)*(items.length-i-1)*.035)+') translateY('+(end*110)+'px)'}}>
     <div style={{height:9,width:75,background:hues[i],borderRadius:9,marginBottom:32}}/>
     <div style={{letterSpacing:3,fontWeight:750,fontSize:22,color:dark?'#B7C2DF':'#65728A'}}>USE CASE / {String(i+1).padStart(2,'0')}</div>
     <div style={{fontWeight:900,fontSize:items.length===4?39:47,lineHeight:1.25,marginTop:25,wordBreak:'break-word'}}>{item.title}</div>
     <div style={{fontSize:items.length===4?23:27,lineHeight:1.55,marginTop:26,color:dark?'#CDD5E8':'#586980'}}>{item.description||''}</div>
    </div>;
  })}
 </AbsoluteFill>;
}

export type WindowProps=Base&Media&{label?:string;backgroundMode?:'transparent_overlay'|'media_first'};
export function ReferenceWindowExit({mediaSrc,mediaType,durationFrames,label='界面演示',
 backgroundMode='transparent_overlay',demoOnly=false}:WindowProps){
 if(!mediaSrc)throw Error('P13 needs actual screenshot/video');
 const f=useCurrentFrame(),enter=progress(f,0,15),exit=progress(f,Math.max(20,durationFrames-25),Math.max(25,durationFrames-1));
 return <AbsoluteFill style={{overflow:'hidden',fontFamily:font,
  background:backgroundMode==='transparent_overlay'?'transparent':'linear-gradient(115deg,#EDF3F8,#FCF4EA)'}}>
  <div style={{position:'absolute',left:252,top:106,width:1415,height:828,overflow:'hidden',
   background:'#FFFFFF',borderRadius:24,border:'2px solid #F1F5FA',
   boxShadow:'0 45px 125px #15214666',opacity:enter*(1-exit),
   transform:'perspective(1800px) translateX('+((1-enter)*205+exit*1150)+'px) translateY('+((1-enter)*90-exit*160)+'px) rotateY('+(exit*65)+'deg) rotateZ('+(-exit*11)+'deg) scale('+(1-exit*.72)+')'}}>
   <div style={{height:55,background:'#EFF1F7',display:'flex',alignItems:'center',gap:9,paddingLeft:23}}>
    {['#EB7C84','#EFBF6B','#70C2A3'].map((c,i)=><span key={i} style={{width:14,height:14,borderRadius:14,background:c}}/>)}
    <span style={{fontSize:21,color:'#46536D',fontWeight:700,marginLeft:20}}>{label}</span>
   </div>
   <div style={{height:773,background:'#182037',position:'relative',overflow:'hidden'}}>
    <MediaFrame mediaSrc={mediaSrc} mediaType={mediaType}/>
    {demoOnly&&<div style={{position:'absolute',bottom:19,right:20,background:'#FFDE8A',
     padding:'7px 16px',fontSize:22,color:'#182039',fontWeight:800}}>SYNTHETIC QA</div>}
   </div>
  </div>
 </AbsoluteFill>;
}
