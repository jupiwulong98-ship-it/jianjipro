import React from 'react';
import {AbsoluteFill,Composition,Freeze,Img,OffthreadVideo,Sequence,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import Counter from './templates/number-counter';
import Branches from './templates/instruction-branches';
import Focus from './templates/screen-focus';
import Rack from '../../../motion-library/adapters/talkcraft/full/cards/rack-focus-pair';
import Retype from '../../../motion-library/adapters/talkcraft/full/cards/error-retype';
import Strike from '../../../motion-library/adapters/talkcraft/full/cards/strike-and-replace';
import Page from '../../../motion-library/adapters/talkcraft/full/cards/tilt-3d-page';
import plan from './production-plan.json';
const img=(n:string)=>staticFile(n+'.png');const font='"PingFang SC", "Noto Sans SC", sans-serif';
const css=`
.tc-source>div{background:transparent!important}.host-wrap,.host-badge,.doc-eyebrow,.ch-label{display:none!important}
.tc-counter .data-panel{left:20px;right:0;border:0;padding:0}.tc-counter .metric:nth-child(2),.tc-counter .label,.tc-counter .delta{display:none}
.tc-counter .value{font-size:230px;font-weight:850;letter-spacing:-8px;color:#252620}
.tc-rack-small .rfp-pf{left:20px;top:190px;width:500px;height:290px}.tc-rack-small .rfp-pb{left:425px;top:30px;width:500px;height:290px}.tc-rack-small .rfp-tag{font-size:30px;left:20px;bottom:20px}
.tc-rack .rfp-pf{left:75px;top:135px;width:380px;height:270px}.tc-rack .rfp-pb{left:460px;top:55px;width:410px;height:280px}
.tc-rack .rfp-tag{font-size:22px}.rfp-photo{box-shadow:0 8px 28px #0002!important}
.tc-retype .ert-tw{top:130px;font-size:76px;height:100px;letter-spacing:0}.tc-retype .ert-slot span{width:80px}.tc-retype .ert-cur{height:75px;width:4px}
.tc-strike .sr-line{left:42px;right:30px;top:190px;font-size:66px}.tc-strike .strike{height:5px;background:#9e4938}
.tc-branches .hcg-hostcard,.tc-branches .hcg-bgtex,.tc-branches .hcg-floor,.tc-branches .hcg-glyph,.tc-branches .hcg-yr,.tc-branches .hcg-be,.tc-branches .hcg-sheen{display:none}
.tc-branches .hcg-board{left:130px;top:20px;width:690px;height:410px;background:#252a31;border-color:#5e6875;box-shadow:none}
.tc-branches .hcg-bt{font-size:32px;top:22px;letter-spacing:0}.tc-branches .hcg-tiles{top:170px;left:70px!important}.tc-branches .hcg-ts{font-size:13px;letter-spacing:0}.tc-branches .hcg-result{top:365px;font-size:20px}
.tc-focus .table-card{left:0;top:0;width:960px;height:430px;padding:0;border:0;border-radius:0}.tc-focus .ring{border-color:#9e4938}.tc-focus .ring-glow{box-shadow:none}.tc-focus .spot{box-shadow:0 0 0 9999px #0004}
.tc-page .camera{width:860px;height:400px;margin:-248px 0 0 -430px}.tc-page .shadow{filter:blur(16px)}
`;
function Text({children,top=400,left=60,size=26,color='#52554c'}:{children:React.ReactNode;top?:number;left?:number;size?:number;color?:string}){return <div style={{position:'absolute',left,top,fontSize:size,lineHeight:1.4,color,fontWeight:600}}>{children}</div>}
function Shot({job}:{job:any}){
 const frame=useCurrentFrame(),t=frame/30,d=job.duration_frames/30;const cues=job.cue_seconds.map((s:number)=>s-job.start);const alpha=Math.min(1,(frame+1)/4,(job.duration_frames-frame)/5);let content:React.ReactNode;
 const rack=(a:string,b:string,labels:[string,string],at:number)=> <Rack srcs={[img(a),img(b)]} labels={labels} data={{CONFIG:{focusAt:[at,100],shift:job.n===2?.20:.35,enterAt:0,exitAt:d-.12,end:d,softBlur:5,softBright:.72}}}/>;
 if(job.n===2)content=<>{rack('text-model-a','text-model-b',['设置 A','设置 B'],cues[1])}</>;
 if(job.n===4)content=<Counter data={{CONFIG:{target:95,countDur:.65,landScale:1.05,odoTarget:'0'}}}/>;
 if(job.n===7)content=<>{rack(t<cues[2]?'text-praise1':'text-praise2','text-problem',['听着舒服','解决问题'],cues[3])}<Text top={20} left={75} size={24}>口播例子</Text></>;
 if(job.n===10){const switchAt=cues[2],typeAt=.20,type=.09,del=.06,gap=.1,pause=Math.max(.1,switchAt-typeAt-4*type-4*del-gap);content=<><Retype prefix="" first="每次重说" second="一次保存" accent="#9e4938" data={{CONFIG:{typeAt,type,pause,del,gap,retype:.07,slotW:80,settle:.30,cursorOff:.3,holdEnd:Math.max(2,d-switchAt-.5),exitDur:.3}}}/><Text top={55} left={280} size={24}>自定义指令 · 示意</Text><Text top={285} left={200} size={34}>简洁一点　/　不要说废话</Text><Text top={342} left={200} size={34}>有问题，直接指出来</Text></>}
 if(job.n===12)content=<Branches title="一份指令，持续复用" tag="" en="" result="设置一次，后续对话沿用" steps={[{icon:'1',label:'固定指令',sub:'共同来源'},{icon:'A',label:'新会话',sub:'沿用要求'},{icon:'B',label:'新会话',sub:'沿用要求'}]} data={{CONFIG:{rotFrom:0,rot:0,boardAt:0,boardIn:.20,titleAt:0,charDur:.18,charStagger:.015,tileAt:[.25,cues[1],cues[1]+.10],tilePop:.25,connDelay:.35,connDur:.30,resultAt:cues[1]+.5,exitAt:d-.25,exit:.25}}}/>;
 if(job.n===15)content=<><Text top={40} left={70} size={24}>口播例子 · 当前情况</Text><Strike texts={{t001:'现在：',t002:''}} data={{CONFIG:{from:'在减肥',to:'不再减肥',lead:Math.max(.2,cues[1]),strikeDur:.15,swapLag:.1,swapDur:.3,keepStrike:false}}}/><Text top={310} left={75} size={35}>旧记忆仍是：“在减肥”</Text>{t>=cues[2]&&<Text top={375} left={75} size={28} color="#9e4938">旧记录 → 可能影响后续回答</Text>}</>;
 if(job.n===20)content=<>{rack('text-ability','text-work',['模型能力','工作方式'],cues[1])}{t>=cues[2]&&<Text top={412} left={330} size={28} color="#9e4938">共同指向：更贴合任务</Text>}</>;
 const focus=(file:string,targets:any[],times:number[],wide:any)=> <Focus media={{'table-card':img(file)}} data={{TARGETS:targets,WIDE:wide,CONFIG:{startDelay:times[0],cueTimes:times,wideAt:d-.10,dimIn:.25,ringIn:.25,jump:.22,wideHold:.1,restore:.25,glowFrom:.4}}}/>;
 if(job.n===5){const switched=t>=cues[1]+.45;content=<>{focus(switched?'canvas-style-options':'canvas-menu',switched?[{x:282,y:38,w:650,h:51}]:[{x:250,y:282,w:420,h:84}],switched?[cues[2]]:[Math.max(0,cues[1])],{x:10,y:10,w:940,h:410})}<Text top={414} left={60} size={24}>1 / 说话风格　设置 → 个性化 → 基础风格和语气</Text></>}
 if(job.n===11)content=<><Img src={img('canvas-instructions')} style={{position:'absolute',left:15,top:30,width:335,height:270,objectFit:'contain'}}/><Text top={325} left={30} size={20}>真实输入区 · 私人内容已隐藏</Text><div style={{position:'absolute',left:390,top:10,width:560,height:420}}><Img src={img('canvas-instructions-example')} style={{width:'100%',height:'100%'}}/></div><Freeze frame={frame}><Focus media={{'table-card':img('canvas-instruction-combined')}} data={{TARGETS:[{x:416,y:130,w:500,h:55},{x:416,y:205,w:500,h:55},{x:416,y:280,w:500,h:55},{x:416,y:355,w:500,h:55}],WIDE:{x:390,y:10,w:550,h:410},CONFIG:{cueTimes:cues,startDelay:0,wideAt:d-.7,dimIn:.2,ringIn:.2,jump:.2,wideHold:.1,restore:.25}}}/></Freeze></>;
 if(job.n===13){const managed=t>=cues[1];content=<>{focus(managed?'canvas-memory':'canvas-personalization',managed?[{x:242,y:0,w:476,h:70}]:[{x:790,y:125,w:125,h:68}],managed?[cues[1]]:[Math.max(0,cues[0])],{x:10,y:10,w:940,h:410})}<Text top={414} left={60} size={24}>3 / 记忆　个性化 → 管理 → 记忆摘要</Text></>}
 if(job.n===17)content=<>{focus(t>=cues[2]?'canvas-data-target':'canvas-data',t>=cues[2]?[{x:45,y:165,w:870,h:68}]:[{x:0,y:220,w:245,h:70}],t>=cues[2]?[cues[2]]:[Math.max(.1,cues[1])],{x:10,y:10,w:940,h:410})}<Text top={414} left={60} size={24}>4 / 数据管理　按自己的需求检查开关</Text></>;
 const kind=job.n===4?'counter':job.n===2?'rack-small':job.n===10?'retype':job.n===12?'branches':job.n===15?'strike':[5,11,13,17].includes(job.n)?'focus':'rack';
 const small=job.mode==='presenter_safe';return <div className={`tc-${kind}`} style={{position:'absolute',left:small?62:0,top:small?180:0,width:small?700:1920,height:small?394:1080,opacity:alpha,overflow:'hidden',background:small?'transparent':'#f6f5f0'}}><div className="tc-source" style={{position:'absolute',width:960,height:540,transform:`scale(${small?700/960:2})`,transformOrigin:'0 0'}}>{content}</div><style>{css}</style>{!small&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:175,background:"#262821"}}/>}</div>;
}
function Effects(){return <>{plan.jobs.filter(j=>j.status==='candidate').map(job=><Sequence key={job.id} from={job.start_frame} durationInFrames={job.duration_frames} layout="none"><Shot job={job}/></Sequence>)}</>}
function Candidate(){const t=useCurrentFrame()/30,cap=plan.captions.find(c=>t>=c.start&&t<c.end);return <AbsoluteFill style={{fontFamily:font,background:'#111'}}><OffthreadVideo src={staticFile('base.mp4')} style={{width:'100%',height:'100%'}}/><Effects/>{plan.jobs.some(j=>j.mode==='full_screen'&&t>=j.start&&t<j.end)&&<div style={{position:'absolute',bottom:0,left:0,right:0,height:175,background:'#262821'}}/>}{cap&&<div style={{position:'absolute',left:180,right:180,bottom:78,fontSize:64,lineHeight:1.15,fontWeight:900,color:'#fafafa',textAlign:'center',textShadow:'0 3px 4px #000b',WebkitTextStroke:'2.5px #252525',paintOrder:'stroke fill'}}>{cap.text}</div>}</AbsoluteFill>}
function Overlay(){return <AbsoluteFill style={{fontFamily:font}}><Effects/></AbsoluteFill>}
registerRoot(()=> <><Composition id="Candidate" component={Candidate} width={1920} height={1080} fps={30} durationInFrames={4475}/><Composition id="Overlay" component={Overlay} width={1920} height={1080} fps={30} durationInFrames={4475}/></>);
