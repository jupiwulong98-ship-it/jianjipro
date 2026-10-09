import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ReferenceChapter,ReferenceCardFan,ReferenceWindowExit} from '../src/reference-style/ReferenceMotions';
import {TechMediaTakeaway,TechResultPunch} from '../src/reference-style/TechReferenceMotions';

const DemoShot:React.FC<any>=(p)=>{
 switch(p.pattern_id){
  case 'P02': return <ReferenceChapter {...p}/>;
  case 'P04': return <ReferenceCardFan {...p}/>;
  case 'P05': return <TechMediaTakeaway {...p}/>;
  case 'P09': return <TechResultPunch {...p}/>;
  case 'P13': return <ReferenceWindowExit {...p}/>;
  default:throw Error('Unknown reference motion '+p.pattern_id);
 }
};
const Root=()=> <Composition id="ReferenceStyleShot" component={DemoShot}
 fps={30} width={1920} height={1080} durationInFrames={90}
 defaultProps={{pattern_id:'P04',title:'效果示意 · QA',items:[{title:'文字内容'},{title:'真实实例'}],durationFrames:90}}
 calculateMetadata={({props})=>({durationInFrames:props.durationFrames||90,fps:30,width:1920,height:1080})}/>;
registerRoot(Root);
