import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Easing, interpolate, useCurrentFrame} from 'remotion';

// First implementation examples for P05 / P09, based on the general visual language
// of the reference. This is original rendering code, not extracted source code.
// Asset media must be supplied by the creator, never by copying the reference video.
export type ReferenceMediaProps = {
  title: string;
  subtitle?: string;
  mediaSrc: string;
  mediaType: 'image' | 'video';
  durationFrames: number;
  label?: string;
  /** V0.2 explicit shot background; omitted keeps V0.1 dark stage exactly as before. */
  backgroundMode?: 'dark_tech' | 'media_first' | 'presenter_natural';
};

const font = '"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
const ease = Easing.out(Easing.cubic);
const between = (v:number,a:number,b:number)=>interpolate(v,[a,b],[0,1],
  {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});

export function TechMediaTakeaway({
  title, subtitle='', mediaSrc, mediaType, durationFrames, label='画面演示', backgroundMode='dark_tech'
}:ReferenceMediaProps) {
  if(!mediaSrc) throw new Error('TechMediaTakeaway requires real user media');
  const f=useCurrentFrame();
  const light=backgroundMode==='media_first';
  const showTechGrid=backgroundMode==='dark_tech';
  const bg=backgroundMode==='presenter_natural'?'transparent':
    light?'#EEF2F8':'linear-gradient(124deg,#0C1331 0%,#151D48 68%,#0D132A 100%)';
  const ink=light?'#17213A':'#F7F8FF';
  const supportingInk=light?'#465377':'#CACFEA';
  const inTitle=between(f,5,18);
  const inMedia=between(f,15,31);
  const out=between(f,Math.max(32,durationFrames-16),Math.max(34,durationFrames-2));
  return <AbsoluteFill style={{fontFamily:font,background:bg,
    color:ink,overflow:'hidden'}}>
    {showTechGrid && <AbsoluteFill style={{opacity:.24,backgroundImage:'linear-gradient(#66E3F21A 1px,transparent 1px),linear-gradient(90deg,#66E3F21A 1px,transparent 1px)',
      backgroundSize:'88px 88px',transform:'perspective(1000px) rotateX(10deg) scale(1.18)'}}/>}
    <div style={{position:'absolute',left:100,top:100,fontSize:23,letterSpacing:4,fontWeight:800,
      color:light?'#5965BD':'#66E3F2'}}>AI / TECH EXPLAINER</div>
    <div style={{position:'absolute',left:110,top:305,width:560,
      transform:'translateY('+((1-inTitle)*34)+'px) translateX('+(-out*55)+'px)',
      opacity:inTitle*(1-out)}}>
      <div style={{fontSize:58,fontWeight:850,lineHeight:1.2,letterSpacing:-1.2,
        textShadow:light?'none':'0 10px 45px #06082555'}}>{title}</div>
      {subtitle && <div style={{fontSize:28,color:supportingInk,marginTop:34,lineHeight:1.5}}>{subtitle}</div>}
      <div style={{height:5,width:interpolate(f,[22,65],[30,280],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),
        background:'linear-gradient(90deg,#66E3F2,#8A79F7)',marginTop:38,borderRadius:10}}/>
    </div>
    <div style={{position:'absolute',left:740,top:175,width:1050,height:655,overflow:'hidden',
      borderRadius:24,background:'#E8EAF6',border:'2px solid #DDE5FF',
      boxShadow:'0 30px 100px #060B30A0, 0 0 52px #66E3F225',
      opacity:inMedia*(1-out),
      transform:'perspective(1800px) translateX('+((1-inMedia)*130+out*700)+'px) rotateY('+(out*35)+'deg) scale('+(1-out*.26)+')'}}>
      <div style={{height:54,display:'flex',alignItems:'center',paddingLeft:25,
        background:'#DDE4FA',gap:10}}>
        {['#FF6C80','#F5C756','#73CDBF'].map((c,i)=><div key={i} style={{width:13,height:13,
          background:c,borderRadius:'50%'}}/>)}
        <span style={{fontSize:19,color:'#374470',marginLeft:20,fontWeight:700}}>{label}</span>
      </div>
      <div style={{width:'100%',height:'calc(100% - 54px)',position:'relative',
        background:'#141932',overflow:'hidden'}}>
        {mediaType==='video'
          ? <OffthreadVideo src={mediaSrc} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          : <Img src={mediaSrc} style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
      </div>
    </div>
  </AbsoluteFill>;
}

export type ReferenceResultProps = {
  text: string;
  durationFrames: number;
  accent?: string;
};

// Transparent over an actual host shot; ChatCut retains presenter and subtitles.
export function TechResultPunch({text,durationFrames,accent='#F4D966'}:ReferenceResultProps) {
  const f=useCurrentFrame();
  const appear=between(f,0,10);
  const settle=between(f,8,22);
  const exit=between(f,Math.max(24,durationFrames-15),Math.max(26,durationFrames-2));
  const scale=2.5-(1.5*settle);
  return <AbsoluteFill style={{fontFamily:font,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:125,top:240,width:1660,height:500,
      display:'flex',justifyContent:'center',alignItems:'center',
      opacity:appear*(1-exit),transform:'translateX('+(exit*1800)+'px) scale('+scale+')',
      transformOrigin:'center center'}}>
      <div style={{fontSize:Math.min(198,Math.max(108,155-(Math.max(0,[...text].length-7)*9))),
        textAlign:'center',fontWeight:900,letterSpacing:-6,lineHeight:1.06,color:accent,
        textShadow:'0 12px 60px #080A1DD0, 0 4px 13px #040513D0'}}>{text}</div>
    </div>
  </AbsoluteFill>;
}
