// Generate isolated, parameterized adapters from the immutable upstream snapshot.
// Factory scope lets content changes also reach derived geometry/timing and helpers.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..');const require=createRequire(root+'/package.json');const ts=require('typescript');const f=ts.factory;const printer=ts.createPrinter();
const input=JSON.parse(fs.readFileSync(root+'/vendor/talkcraft/references/cards-index.json')).cards;
const runtimeRequire=createRequire(root+'/runtime-talkcraft/package.json');
function readMeta(source){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,require:runtimeRequire});return exports.meta;}
const existing=JSON.parse(fs.readFileSync(root+'/adapters/talkcraft/registry.json')).filter(c=>c.adapter_mode!=='full_source');
const mediaTargets={
 'callout-line-label':['screen'],'evidence-scroll-tour':['doc-page'],'focus-dim-spotlight':['table-card'],
 'gooey-morph':['gm-pic'],'logo-enter':['badge'],'magnifier-detail':['shot'],
 'media-pop-in':['shot shot-browser','shot shot-chat','shot shot-pay'],'motion-blur-slam-in':['shot shot-a','shot shot-b'],
 'news-card-desk':['kb-inner'],'orbit-drift':['page'],'pip-zoom-box':['pz-scene'],
 'scribble-annotation':['shot'],'slow-pull-reveal':['page'],'stage-keyframe-tour':['page'],'sway-parallax':['page'],'tilt-3d-page':['page'],
};
const illustrations=new Set(['chat-gpt','claude-code','ui-flow-theater','ui-prop-theater','chat-message-flow','cursor-actor-demo','terminal-typing-log']);
const special={
 'alt-block-lines':['statement','statement-pair',['parallel']], 'error-retype':['comparison','misconception',['before_after']],
 'strike-and-replace':['comparison','misconception',['before_after']], 'source-converge':['process','convergence-map',['center_branches']],
 'step-timeline-vertical':['process','process-map',['sequence','timeline']], 'chapter-progress-list':['checklist','framework-checklist',['sequence']],
 'chip-grid-single-select':['list','category-overview',['parallel']], 'unit-grid-proportion':['number','proportion',['hierarchy','comparison']],
 'chart-grow':['number','bar-chart',['comparison']], 'bar-chart-growth':['number','bar-chart',['comparison']],
 'line-chart-story-draw':['number','trend',['timeline']], 'map-route-pin':['process','route',['timeline']],
 'long-take-world':['process','spatial-tour',['sequence']], 'split-compare-slider':['comparison','media-compare',['before_after']],
 'rack-focus-pair':['comparison','media-compare',['comparison']], 'grid-to-hero':['evidence','gallery',['hierarchy']],
 'filmstrip-conveyor':['evidence','gallery',['parallel']], 'gallery-wall-dolly':['evidence','gallery',['parallel']],
 'timeline-photo-strip':['evidence','gallery',['timeline']], 'stack-fan-out':['evidence','gallery',['parallel']],
 'still-layout-relay':['evidence','gallery',['parallel']], 'info-card-assemble':['evidence','single-result',['single_focus']],
 'quote-card':['quote','quote-card',['single_focus']], 'quote-bracket-pull':['quote','quote-card',['single_focus']],
 'lower-third-nameplate':['entity','identity',['single_focus']], 'chevron-lower-third':['entity','identity',['single_focus']],
 'douyin-follow-card':['entity','follow',['single_focus']], 'x-follow-card':['entity','follow',['single_focus']],
 'subscribe-cta':['entity','follow',['single_focus']], 'host-card-glass-board':['process','process-map',['sequence']],
 'doc-park-left-pill-deal':['screen-demo','focus-callout',['single_focus']],
};
const lit=s=>f.createStringLiteral(s);const access=(base,key)=>f.createElementAccessExpression(base,lit(key));const inp=f.createIdentifier('__input');
const call=(name,args)=>f.createCallExpression(f.createIdentifier(name),undefined,args);
const strip=n=>{const mods=n.modifiers?.filter(m=>![ts.SyntaxKind.ExportKeyword,ts.SyntaxKind.DefaultKeyword].includes(m.kind));if(n.modifiers)n.modifiers=f.createNodeArray(mods);return n;};
const semanticField=/^(text|txt|title|label|name|note|caption|author|source|unit|brand|tag|sub|line[12]|code|year|time|prompt|result|hint|desc|value)$/i;
function shape(n){
 if(ts.isAsExpression(n)||ts.isParenthesizedExpression(n)||ts.isNonNullExpression(n))return shape(n.expression);
 if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return {type:'string',default:n.text};
 if(ts.isNumericLiteral(n)||ts.isPrefixUnaryExpression(n))return {type:'number',default:Number(n.getText().replace(/_/g,''))};
 if([ts.SyntaxKind.TrueKeyword,ts.SyntaxKind.FalseKeyword].includes(n.kind))return {type:'boolean',default:n.kind===ts.SyntaxKind.TrueKeyword};
 if(ts.isArrayLiteralExpression(n))return {type:'array',length:n.elements.length,items:n.elements.map(shape)};
 if(ts.isObjectLiteralExpression(n))return {type:'object',fields:Object.fromEntries(n.properties.filter(ts.isPropertyAssignment).map(p=>[p.name.text,shape(p.initializer)]))};
 return {type:'derived'};
}
const registry=[...existing],contracts={};const index=[];
for(const card of input){
 const slug=card.slug,old=existing.find(c=>c.slug===slug);if(old){index.push({slug,source:old.source,existing:true});continue;}
 const source=fs.readFileSync(root+'/vendor/talkcraft/'+card.code,'utf8');const sf=ts.createSourceFile(slug+'.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const slots={},dataSlots={};let count=0,mediaScope=null;const mediaKeys=new Set();
 function text(n,value,jsx=false){const key='t'+String(++count).padStart(3,'0');slots[key]={example:value,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,...(mediaScope?{media:mediaScope}:{})};const expr=call('__text',[lit(key),lit(value)]);return jsx?f.createJsxExpression(undefined,expr):expr;}
 const transform=ctx=>{
  const visit=n=>{
   if(ts.isJsxElement(n)){
    const a=n.openingElement.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.text==='className'&&a.initializer&&ts.isStringLiteral(a.initializer));
    const cls=a?.initializer?.text;const target=mediaTargets[slug]?.includes(cls);
    if(target){const key=cls.replaceAll(' ','_');mediaKeys.add(key);const prev=mediaScope;mediaScope=key;const updated=ts.visitEachChild(n,visit,ctx);mediaScope=prev;const fallback=f.createJsxFragment(f.createJsxOpeningFragment(),updated.children,f.createJsxJsxClosingFragment());
     if(slug==='evidence-scroll-tour') updated.openingElement=f.updateJsxOpeningElement(updated.openingElement,updated.openingElement.tagName,updated.openingElement.typeArguments,f.createJsxAttributes([...updated.openingElement.attributes.properties,f.createJsxAttribute(f.createIdentifier('style'),f.createJsxExpression(undefined,f.createObjectLiteralExpression([f.createPropertyAssignment('height',f.createPropertyAccessExpression(f.createIdentifier('GEO'),'pageH'))])))]));
     const children=[f.createJsxExpression(undefined,call('__media',[lit(key),fallback]))];return f.updateJsxElement(updated,updated.openingElement,children,updated.closingElement);
    }
   }
   if(ts.isJsxAttribute(n)&&n.initializer&&ts.isStringLiteral(n.initializer)){const value=visit(n.initializer);return f.updateJsxAttribute(n,n.name,ts.isStringLiteral(value)?value:f.createJsxExpression(undefined,value));}
   if(ts.isJsxText(n)&&n.text.trim())return text(n,n.text.replace(/\s+/g,' ').trim(),true);
   if(ts.isStringLiteral(n)&&!ts.isLiteralTypeNode(n.parent)&&!(ts.isPropertyAssignment(n.parent)&&n.parent.name===n)){
    const field=ts.isPropertyAssignment(n.parent)?n.parent.name.text:null;
    if(/[\u3400-\u9fff]/.test(n.text)&&!n.text.includes('font-family')||field&&semanticField.test(field)&&!/^#[0-9a-f]+$/i.test(n.text))return text(n,n.text);
   }
   // Demo silhouette is an opt-in fixture, never an implicit production person.
   if(ts.isConditionalExpression(n)&&n.whenFalse.getText(sf).includes('radial-gradient(ellipse')){
    const updated=ts.visitEachChild(n,visit,ctx);return f.updateConditionalExpression(updated,updated.condition,updated.questionToken,updated.whenTrue,updated.colonToken,f.createNull());
   }
   if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&/^[A-Z][A-Z0-9_]+$/.test(n.name.text)&&n.initializer&&['CONFIG','GEO'].includes(n.name.text)||ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&/^[A-Z][A-Z0-9_]+$/.test(n.name.text)&&n.initializer&&(ts.isArrayLiteralExpression(n.initializer)||ts.isObjectLiteralExpression(n.initializer))){
    if(n.name.text!=='CSS'&&n.name.text!=='meta'){
     dataSlots[n.name.text]=shape(n.initializer);const updated=ts.visitEachChild(n,visit,ctx);return f.updateVariableDeclaration(updated,updated.name,updated.exclamationToken,updated.type,call('__data',[lit(n.name.text),updated.initializer]));
    }
   }
   return ts.visitEachChild(n,visit,ctx);
  };return n=>ts.visitNode(n,visit);
 };
 const transformed=ts.transform(sf,[transform]).transformed[0];const imports=transformed.statements.filter(ts.isImportDeclaration).map(n=>printer.printNode(ts.EmitHint.Unspecified,n,sf)).join('\n');
 const main=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword));if(!main)throw Error('main missing '+slug);
 const body=transformed.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>printer.printNode(ts.EmitHint.Unspecified,strip(n),sf)).join('\n');
 const originalMeta=readMeta(source);
 const nativeProps=main.parameters[0]&&ts.isObjectBindingPattern(main.parameters[0].name)?main.parameters[0].name.elements.map(e=>e.name.getText(sf)):[];
 const fields=[...new Set([...nativeProps,'texts','data','media','skin','illustration'])];
 let family,subtype,structures,layer='primary';
 if(special[slug])[family,subtype,structures]=special[slug];
 else if(card.category==='转场结构'){family='transition';subtype='scene-change';structures=['single_focus'];layer='transition';}
 else if(card.category==='运镜'){family='camera';subtype='camera-motion';structures=['single_focus'];layer='camera';}
 else if(card.category==='强调标注'){family='screen-demo';subtype='focus-callout';structures=['single_focus'];}
 else if(card.category==='数据信息图'){family='number';subtype='single-metric';structures=['single_focus'];}
 else if(card.category==='素材呈现'){family='evidence';subtype='single-result';structures=['single_focus'];}
 else if(illustrations.has(slug)){family='screen-demo';subtype='tool-demo';structures=['sequence','single_focus'];}
 else {family='emphasis';subtype='keyword';structures=['single_focus'];}
 const nativeCounts={'filmstrip-conveyor':6,'gallery-wall-dolly':3,'grid-to-hero':6,'rack-focus-pair':2,'stack-fan-out':5,'still-layout-relay':3,'timeline-photo-strip':4,'word-relay-filmstrip':3};
 const contract={slug,native_media_count:nativeCounts[slug],texts:slots,data:dataSlots,native_props:nativeProps,media:[...mediaKeys],required_native_media:nativeProps.filter(k=>/^(src|srcs|srcBefore|srcAfter|srcB|docSrc|avatar)$/.test(k)),numeric_bindings:(()=>{const list=[];for(const[k,v]of Object.entries(dataSlots)){const walk=(q,p)=>{if(q.type==='object')for(const[a,b]of Object.entries(q.fields)){if(/^(target|odoTarget|value|values|num|amount|price|bars|pts|v)$/i.test(a))list.push([k,...p,a]);else walk(b,[...p,a]);}else if(q.type==='array')q.items.forEach((a,i)=>walk(a,[...p,i]));};walk(v,[]);}return list;})(),illustration_only:illustrations.has(slug),source_meta:originalMeta,source_hash:crypto.createHash('sha256').update(source).digest('hex')};contracts[slug]=contract;
 const output=`// Generated by scripts/adapt-talkcraft-all.mjs; edit the generator/overrides, not this snapshot.\n${imports}\nimport {AdapterMedia,applySkinCss,mergeData} from '../support';\nfunction define(__input:any={}) {\nconst __text=(key:string,fallback:string)=>__input.texts?.[key]??fallback;\nconst __data=(key:string,fallback:any)=>mergeData(fallback,__input.data?.[key]);\nconst __media=(key:string,fallback:React.ReactNode)=>__input.media?.[key]?<AdapterMedia src={__input.media[key]} flow={${['magnifier-detail','news-card-desk'].includes(slug)?'true':'false'}} />:(__input.illustration===true?fallback:null);\n${body}\nreturn {Component:${main.name.text},meta};\n}\nexport const meta=define({illustration:true}).meta;\nexport function metadata(input:any){return define(input).meta;}\nexport default function Adapter(input:any={}){const def=React.useMemo(()=>define(input),[input]);return <><style>{applySkinCss(input.skin)}</style><def.Component {...input}/>${illustrations.has(slug)?'<div style={{position:"absolute",left:20,top:12,fontSize:13,color:"#666",background:"#fff",padding:4}}>流程示意</div>':''}</>;}\n`;
 fs.writeFileSync(root+'/adapters/talkcraft/full/cards/'+slug+'.tsx',output);
 registry.push({id:'talkcraft:'+slug,slug,family,subtype,visual_structures:structures,layer,version:'jianjipro-full-1',source:'full/cards/'+slug+'.tsx',adapter_mode:'full_source',status:'adapted_pending_verification',required:['texts',...(illustrations.has(slug)?['illustration']:[])],props:fields,min_frames:originalMeta.durationInFrames,panel:'source',full_screen:true,contract,source_dimensions:{width:960,height:540},semantics:card.semantics,category:card.category});
 index.push({slug,source:'full/cards/'+slug+'.tsx',existing:false});
}
fs.writeFileSync(root+'/adapters/talkcraft/registry.json',JSON.stringify(registry,null,2)+'\n');fs.writeFileSync(root+'/adapters/talkcraft/full/contracts.json',JSON.stringify(contracts,null,2)+'\n');
const imports=index.map((c,i)=>`import C${i}${c.existing?'':`, {meta as M${i}}`} from '../${c.source.replace(/\.tsx$/,'')}';`).join('\n');
fs.writeFileSync(root+'/adapters/talkcraft/full/index.ts',imports+'\nexport const allCards:Record<string,any>={'+index.map((c,i)=>`'${c.slug}':C${i}`).join(',')+'};\nexport const sourceMeta:Record<string,any>={'+index.filter(c=>!c.existing).map(c=>`'${c.slug}':M${index.indexOf(c)}`).join(',')+'};\n');
console.log('Adapters '+registry.length+'; new factories '+Object.keys(contracts).length+'; slots '+Object.values(contracts).reduce((a,c)=>a+Object.keys(c.texts).length,0));
