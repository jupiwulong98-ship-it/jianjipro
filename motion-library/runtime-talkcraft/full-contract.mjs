const assert=(ok,message)=>{if(!ok)throw Error(message);};
function validateShape(value,schema,path) {
 if(schema.type==='derived')throw Error(`${path}: 派生字段不可直接覆写`);
 if(schema.type==='array'){assert(Array.isArray(value)&&value.length===schema.length,`${path}: 需保留 ${schema.length} 个条目；改变数量需要单独验证布局`);value.forEach((v,i)=>validateShape(v,schema.items[i],path+'.'+i));return;}
 if(schema.type==='object'){assert(value&&typeof value==='object'&&!Array.isArray(value),`${path}: 需要对象`);for(const [k,v] of Object.entries(value)){assert(k in schema.fields,`${path}: 未开放字段 ${k}`);validateShape(v,schema.fields[k],path+'.'+k);}return;}
 assert(typeof value===schema.type,`${path}: 需要 ${schema.type}`);if(schema.type==='number')assert(Number.isFinite(value),`${path}: 需有限数字`);
}
const local=value=>typeof value==='string'&&value.startsWith('asset:')&&value.length>6;
export function validateFullProps(card,props){
 const c=card.contract;assert(props.texts&&typeof props.texts==='object'&&!Array.isArray(props.texts),`${card.slug}: 需显式提供 texts，禁止隐式使用演示文案`);
 for(const [key,value] of Object.entries(props.texts)){assert(key in c.texts,`${card.slug}: 未开放文字槽 ${key}`);assert(typeof value==='string',`${key}: 需要文字`);}
 for(const [key,slot] of Object.entries(c.texts)){if(slot.media&&props.media?.[slot.media])continue;assert(typeof props.texts[key]==='string',`${card.slug}: 缺少文案槽 ${key}`);}
 for(const parts of c.numeric_bindings??[]){const v=parts.reduce((v,k)=>v?.[k],props.data);assert(v!==undefined,`${card.slug}: 需显式绑定数据 data.${parts.join('.')}`);}
 for(const [key,value] of Object.entries(props.data??{})){assert(key in c.data,`${card.slug}: 未开放数据 ${key}`);validateShape(value,c.data[key],card.slug+'.data.'+key);}
 for(const [key,value] of Object.entries(props.media??{})){assert(c.media.includes(key),`${card.slug}: 未开放素材槽 ${key}`);assert(local(value),`${card.slug}: media.${key} 只接受 asset: 本地素材`);}
 for(const key of c.media)assert(local(props.media?.[key]),`${card.slug}: 缺少真实素材 media.${key}，禁止使用假截图`);
 for(const key of c.required_native_media??[])assert(props[key]!==undefined,`${card.slug}: 缺少真实素材 ${key}`);
 for(const key of ['docSrc','src','srcBefore','srcAfter','srcB','avatar','handSrc','hostSrc','logoSrc'])if(props[key]!==undefined)assert(local(props[key]),`${card.slug}: ${key} 只接受 asset: 本地素材`);
 for(const [key,value] of Object.entries(props))if(/srcs$/i.test(key))assert(Array.isArray(value)&&value.length>0&&value.every(local),`${card.slug}: ${key} 需要本地素材数组`);
 if(c.illustration_only)assert(props.illustration===true,`${card.slug}: 只可作为标注的流程示意，不能冒充实际运行结果`);
 if(c.native_media_count)assert(props.srcs?.length>=c.native_media_count,`${card.slug}: 至少需要 ${c.native_media_count} 张真实素材`);
 if(props.skin){assert(typeof props.skin==='object',`${card.slug}: skin 需要对象`);for(const key of Object.keys(props.skin))assert(['fontFamily'].includes(key),`skin 未开放 ${key}`);}
}
