import React from 'react';
import {Img,OffthreadVideo,Loop} from 'remotion';
// Media replacement stays inside the animated source container, so camera/clip
// geometry and the picture always move together. No remote loading in production.
export function AdapterMedia({src,flow=false}: {src:string;flow?:boolean}) {
 const style:React.CSSProperties=flow?{position:'relative',display:'block',width:'100%',height:'auto',aspectRatio:'16 / 9',objectFit:'fill',maxWidth:'none'}:{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'fill',maxWidth:'none'};
 return /\.(mov|mp4|webm)(?:\?|$)/i.test(src)?<Loop durationInFrames={600}><OffthreadVideo src={src} muted style={style}/></Loop>:<Img src={src} style={style}/>;
}
export function mergeData(base:any,over:any):any {
 if(over===undefined)return base;
 if(base&&over&&typeof base==='object'&&typeof over==='object'&&!Array.isArray(base)&&!Array.isArray(over))return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,mergeData(v,over[k])]).concat(Object.entries(over).filter(([k])=>!(k in base))));
 return over;
}
export function applySkinCss(skin:any={}) {
 return skin.fontFamily?`.tc-stage, .tc-stage * {font-family:${JSON.stringify(skin.fontFamily)} !important}`:'';
}
