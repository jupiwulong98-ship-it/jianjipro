import React from 'react';
import {AbsoluteFill,Composition,Freeze,OffthreadVideo,Sequence,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import NumberCounter from './templates/number-counter';
import Strike from '../../../motion-library/adapters/talkcraft/full/cards/strike-and-replace';
import Page from '../../../motion-library/adapters/talkcraft/full/cards/tilt-3d-page';
import Retype from '../../../motion-library/adapters/talkcraft/full/cards/error-retype';
import TypeContrast from '../../../motion-library/adapters/talkcraft/full/cards/type-contrast-emphasis';
import plan from './reference-plan.json';

const font='"PingFang SC", "Noto Sans SC", sans-serif';
// Relocate existing templates onto the filmed wall; core motion comes from TalkCraft.
const layoutCss=`
.tc-source > div { background: transparent !important; }
.tc-source .host-wrap { display: none; }
.tc-number .data-panel { left: 30px; right: 0; border: 0; padding: 0; gap: 0; }
.tc-number .metric:nth-child(2) { display: none; }
.tc-number .metric .label { font-size: 42px; color: #41413e; letter-spacing: 4px; margin-bottom: 14px; }
.tc-number .big-num { gap: 20px; }
.tc-number .big-num .value { font-size: 178px; font-weight: 800; letter-spacing: -4px; }
.tc-number .big-num .delta { font-size: 88px; color: #a94732; }
.tc-strike .sr-line { left: 50px; right: 20px; font-size: 104px; }
.tc-strike .strike { height: 8px; background: #a94732; }
.tc-retype .ert-tw { left: 50px !important; font-size: 100px; height: 130px; top: 205px; letter-spacing: 0; }
.tc-retype .ert-slot span { width: 104px; }
.tc-retype .ert-cur { height: 100px; width: 5px; }
.tc-wait .tc-captions { left: 40px; right: 10px; --tc-base: 74px; --tc-serif-scale: 1.4; }
.tc-wait .tc-line { gap: 14px; }
.tc-page .shadow { filter: blur(18px); }
`;
function Layer({from,to,kind,offset=0,children}:{from:number;to:number;kind:string;offset?:number;children:React.ReactNode}) {
  const frame=useCurrentFrame();
  const opacity=Math.max(0,Math.min(1,(frame-from)/4,(to-frame)/5));
  return <Sequence from={from} durationInFrames={to-from} layout="none">
    <div className={`tc-${kind}`} style={{position:'absolute',left:62,top:226,width:700,height:394,opacity,overflow:'hidden'}}>
      <div className="tc-source" style={{position:'absolute',width:960,height:540,transform:'scale(0.729166667)',transformOrigin:'0 0'}}>
        <Freeze frame={Math.max(0,frame-from+offset)}>{children}</Freeze>
      </div>
    </div>
  </Sequence>;
}
function Candidate() {
  const t=useCurrentFrame()/30;
  const caption=plan.captions.find(c=>t>=c.start&&t<c.end);
  return <AbsoluteFill style={{fontFamily:font,background:'#111'}}>
    <OffthreadVideo src={staticFile('base.mp4')} style={{width:'100%',height:'100%'}}/>
    <Layer from={96} to={151} kind="number" offset={9}>
      <NumberCounter texts={{t001:'观看人数',t002:'万+',t003:'',t004:'',t005:''}} data={{CONFIG:{target:100000,countDur:.69,landScale:1.06,odoTarget:'0'}}}/>
    </Layer>
    <Layer from={159} to={263} kind="strike">
      <Strike texts={{t001:'',t002:''}} data={{CONFIG:{from:'私藏',to:'公开可找',lead:1.333333,strikeDur:.15,swapLag:1.184,swapDur:.25,keepStrike:false}}}/>
    </Layer>
    <Layer from={264} to={325} kind="page">
      <Page media={{page:staticFile('search-codex.png')}} data={{CONFIG:{startHold:.566667,tiltDur:.45,rotYTo:-12,rotXTo:2,holdRotY:-14,holdRotX:2,shadowTo:.12}}}/>
    </Layer>
    <Layer from={327} to={473} kind="retype">
      <Retype prefix="" first="推荐清单" second="找方法" accent="#a94732" data={{CONFIG:{typeAt:.10,type:.09,pause:.35,del:.06,gap:1.58,retype:.08,slotW:104,settle:.30,holdEnd:1.4,exitDur:.35}}}/>
    </Layer>
    <Layer from={510} to={599} kind="wait">
      <TypeContrast data={{CONFIG:{startDelay:0,words:[{w:'不必',beat:0},{w:'等分享',beat:.18,emph:'serif'},{w:'',beat:0},{w:'',beat:0},{w:'',beat:0}]}}}/>
    </Layer>
    <style>{layoutCss}</style>
    {t>=11.94&&t<13.533333&&<style>{'.tc-retype .ert-cur {visibility:hidden}'}</style>}
    {caption&&<div style={{position:'absolute',left:220,right:220,bottom:78,display:'flex',justifyContent:'center'}}>
      <div style={{fontSize:64,lineHeight:1.15,fontWeight:900,color:'#f8fafc',textAlign:'center',maxWidth:1320,textShadow:'0 3px 3px #0009',WebkitTextStroke:'1.6px #252525',paintOrder:'stroke fill'}}>{caption.text}</div>
    </div>}
  </AbsoluteFill>;
}
registerRoot(()=> <Composition id="First20Reference" component={Candidate} width={1920} height={1080} fps={30} durationInFrames={600}/>);
