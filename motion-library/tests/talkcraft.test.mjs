import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {resolvePlan, validateAssets, deliveryManifest, fingerprint, catalog, registry, validateProps} from '../runtime-talkcraft/core.mjs';

const keyword = (id='s01') => ({id,start_frame:15,duration_frames:120,presentation_mode:'presenter_safe',
  box:{left:64,top:120,width:720,height:540},primary_motion_request:{family:'emphasis',subtype:'keyword',content:{keyword:'模板复用'}}});
const plan = shots => ({project_id:'test',fps:30,width:1920,height:1080,shots});

test('完整 108 模板有 demo、配方和生产状态；108 张均接入参数适配', () => {
  assert.equal(catalog.length,108); assert.equal(catalog.filter(c => c.adapter).length,108);
  for (const c of catalog) assert.ok(c.demo_url && c.slug && c.title);
});
test('按实际文字参数选卡，不把硬编码 demo 当作真实制作', () => {
  const result=resolvePlan(plan([keyword()]));
  assert.equal(result.shots[0].resolution.primary_card,'talkcraft:keyword-pop-highlight');
  assert.throws(() => resolvePlan(plan([{...keyword(),primary_motion_request:{family:'comparison',subtype:'metric-compare',content:{keyword:'比较'}}}])),/没有合适模板/);
  assert.throws(() => resolvePlan(plan([{...keyword(),primary_motion_request:{family:'emphasis',subtype:'keyword',content:{keyword:'模板',madeUp:1}}}])),/不支持参数/);
});
test('连续主结构第三次被拒绝；清爽口播重置重复历史', () => {
  assert.throws(() => resolvePlan(plan([keyword('a'),keyword('b'),keyword('c')])),/连续使用两次/);
  assert.doesNotThrow(() => resolvePlan(plan([keyword('a'),keyword('b'),{...keyword('clean'),clean_presenter:true},keyword('c')])));
});
test('人物模式、延时与播放速度必须满足可读时长', () => {
  assert.throws(() => resolvePlan(plan([{...keyword(),start_delay_frames:119}])),/镜头太短/);
  assert.throws(() => resolvePlan(plan([{...keyword(),motion_speed:0}])),/motion_speed/);
  assert.throws(() => resolvePlan(plan([{...keyword(),box:{left:1900,top:0,width:720,height:540}}])),/超出画面/);
});
test('素材不能越界或用网络 URL 绕过本地检查', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jianjipro-assets-'));
  try {
    assert.throws(() => validateAssets({shots:[{id:'a',props:{src:'https://example.com/a.png'}}]},dir),/本地素材/);
    assert.throws(() => validateAssets({shots:[{id:'a',props:{src:'asset:../missing.png'}}]},dir),/不存在或越界/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('交付时长用端点差计算，保持帧位置且不修改口播轨道', () => {
  const data=deliveryManifest(plan([]),[{shot_id:'a',file:'/tmp/a.mov',hash:'a',start_frame:1,duration_frames:1}]);
  assert.equal(data.clips[0].start_us,33333);assert.equal(data.clips[0].duration_us,33334);
  assert.equal(data.clips[0].source_in_frame,0); assert.equal(data.clips[0].muted,true);
  assert.equal(data.status,'ready_for_preview_not_assembled'); assert.ok(data.preserve.includes('captions'));
});
test('主题从 jianjipro 风格档加载，参数改变使缓存失效', () => {
  const original=resolvePlan({...plan([keyword()]),style_id:'ai-talkinghead-editorial-v0.1'});
  assert.equal(original.theme.accent,'#22d3ee');assert.equal(original.style_status,'candidate');
  const a=fingerprint(original.shots[0],original,os.tmpdir());
  const changed=resolvePlan({...plan([keyword()]),theme:{accent:'#ffff00'}});
  assert.notEqual(a,fingerprint(changed.shots[0],changed,os.tmpdir()));
});
test('标题条目超过镜头时长时拒绝，避免第三条没出现就结束', () => {
  const shot={...keyword(),duration_frames:180,primary_motion_request:{family:'section',subtype:'chapter-title',content:{title:'测试',items:['甲','乙','丙'],itemsAt:[2,3,6]}}};
  assert.throws(() => resolvePlan(plan([shot])),/条目尚未读完/);
});

test('新增 100 张必须提供显式文案与实际素材，按原版动画时长校验', () => {
 const cards=registry.filter(c=>c.adapter_mode==='full_source');assert.equal(cards.length,100);
 for(const c of cards){assert.equal(c.min_frames,c.contract.source_meta.durationInFrames);assert.throws(()=>validateProps(c,{}),/texts/);assert.equal(c.contract.source_hash.length,64);}
 const c=cards.find(c=>c.slug==='grid-to-hero');const props={texts:Object.fromEntries(Object.keys(c.contract.texts).map(k=>[k,'测试文案'])),srcs:['asset:a.png','asset:b.png','asset:c.png','asset:d.png','asset:e.png','asset:f.png']};assert.doesNotThrow(()=>validateProps(c,props));assert.throws(()=>validateProps(c,{...props,srcs:props.srcs.slice(0,1)}),/6 张真实素材/);
 const media=cards.find(c=>c.slug==='magnifier-detail');assert.throws(()=>validateProps(media,{texts:Object.fromEntries(Object.keys(media.contract.texts).map(k=>[k,'测试']))}),/缺少真实素材/);
});
test('数字演示值和未开放主题不能静默进入真实制作', () => {
 const c=registry.find(c=>c.slug==='number-counter');const props={texts:Object.fromEntries(Object.keys(c.contract.texts).map(k=>[k,'测试']))};assert.throws(()=>validateProps(c,props),/显式绑定数据/);assert.doesNotThrow(()=>validateProps(c,{...props,data:{CONFIG:{target:108,odoTarget:'0108'}}}));assert.throws(()=>validateProps(c,{...props,data:{CONFIG:{target:108,odoTarget:'0108'}},skin:{accent:'#ff0000'}}),/skin 未开放/);
});

test('执行层绑定实际参数，保留导演的语义内容', () => {
 const source=keyword();source.resolution={adapter_props:{keyword:'实际画面文字'}};
 const result=resolvePlan(plan([source])).shots[0];
 assert.equal(result.props.keyword,'实际画面文字');
 assert.equal(result.primary_motion_request.content.keyword,'模板复用');
 assert.equal(source.primary_motion_request.content.keyword,'模板复用');
 assert.throws(()=>resolvePlan(plan([{...source,resolution:{adapter_props:{keyword:'文字',madeUp:true}}}])),/不支持参数/);
});
