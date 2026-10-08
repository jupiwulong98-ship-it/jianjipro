// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {act,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {PlanningBoard} from '../src/planning/PlanningBoard';
import type {PlanningProject} from '../src/planning/types';

const words=[{id:'w1',text:'输入',start:1,end:2},{id:'w2',text:'结果',start:3,end:4}];
const fixture:PlanningProject={id:'video',title:'真实新片子',binding:'binding-1',plan_error:'',proposal_note:'AI 初稿，待确认',review:{revision:0,shots:{}},
  transcript:{revision:'transcript-1',captured_at:'2026-10-02T16:06:43Z',segment_count:2,word_count:2,full_text:'输入\n结果',listening_review:'not_verified',source:{duration_frames:150,time_basis:'edited_timeline'},segments:words.map(w=>({id:w.id,text:w.text,start:w.start,end:w.end,words:[w]}))},
  scenes:words.map((w,index)=>({id:`s${index+1}`,title:index?'保留讲述':'输入到输出',mode:index?'clean':'visual',packaging_rule:index?'clean_presenter':'input_process_output',start:w.start,end:w.end,text:w.text,words:[w],viewer_goal:'看懂关系',initial_state:'只有输入',final_state:'显示结果',materials:'使用示意',reason:'帮助理解',actions:index?[]:[{word_id:w.id,description:'输入移动到工具',text:w.text,start:w.start,end:w.end}]}))};
let current:PlanningProject;
beforeEach(()=>{
  window.history.replaceState(null,'','/#planning');window.localStorage.clear();
  current=structuredClone(fixture);
  vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
    if(url==='/api/planning-projects')return {ok:true,json:async()=>[{id:'video',title:'真实新片子'}]};
    if(options?.method==='POST')return {ok:true,json:async()=>current.review};
    return {ok:true,json:async()=>structuredClone(current)};
  }));
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
function board(){return render(<PlanningBoard onHistory={()=>{}} onTemplates={()=>{}}/>);}
const row=(index:number)=>screen.getByRole('row',{name:`策划第 ${index} 段`});
async function ready(){await screen.findByRole('table',{name:'逐段口播与包装策划'});}
function edit(index:number,text:string){fireEvent.click(within(row(index)).getByRole('button',{name:`给第 ${index} 段留意见`}));fireEvent.change(screen.getByLabelText(`第 ${index} 段意见`),{target:{value:text}});}

it('默认表格同时展示全部原文与动作，全文保留字词时间并能定位到对应行',async()=>{
  board();await ready();
  expect(screen.getAllByRole('row')).toHaveLength(3);
  expect(within(row(1)).getAllByRole('cell')[0]).toHaveTextContent('输入');
  expect(within(row(1)).getByText('输入移动到工具')).toBeVisible();
  expect(within(row(2)).getByText('保持人物讲述，不增加解释性动画。')).toBeVisible();
  fireEvent.click(screen.getByRole('tab',{name:'剪后全文'}));
  const first=document.querySelector('.pb-transcript-list details')!;fireEvent.click(first.querySelector('summary')!);
  expect(within(first as HTMLElement).getByText('1.000 — 2.000 s')).toBeInTheDocument();
  fireEvent.click(within(first as HTMLElement).getByRole('button',{name:'查看对应画面策划'}));
  expect(row(1)).toHaveClass('pb-row-focused');expect(row(2)).toBeVisible();
});
it('直达链接优先选择指定的新项目而不是列表首项，并且刷新后仍选中它',async()=>{
  window.history.replaceState(null,'','/?project=new-video#planning');
  window.localStorage.setItem('jianjipro.planning.project','video');
  vi.mocked(fetch).mockImplementation(async(url)=>({ok:true,json:async()=>url==='/api/planning-projects'
    ?[{id:'video',title:'旧视频'},{id:'new-video',title:'新视频'}]
    :{...structuredClone(fixture),id:url.toString().endsWith('/new-video')?'new-video':'video',title:url.toString().endsWith('/new-video')?'新视频':'旧视频'}} as Response));
  const first=board();await ready();
  expect(screen.getByLabelText('当前项目')).toHaveValue('new-video');
  expect(document.title).toBe('新视频 · jianjipro');
  first.unmount();board();await ready();
  expect(screen.getByLabelText('当前项目')).toHaveValue('new-video');
});
it('切换项目更新直达链接，普通入口也记住最近加载成功的项目',async()=>{
  vi.mocked(fetch).mockImplementation(async(url)=>({ok:true,json:async()=>url==='/api/planning-projects'
    ?[{id:'video',title:'旧视频'},{id:'new-video',title:'新视频'}]
    :{...structuredClone(fixture),id:url.toString().endsWith('/new-video')?'new-video':'video'}} as Response));
  const first=board();await ready();
  fireEvent.change(screen.getByLabelText('当前项目'),{target:{value:'new-video'}});
  await waitFor(()=>expect(new URLSearchParams(window.location.search).get('project')).toBe('new-video'));
  expect(window.location.hash).toBe('#planning');
  first.unmount();window.history.replaceState(null,'','/#planning');board();await ready();
  expect(screen.getByLabelText('当前项目')).toHaveValue('new-video');
});
it('指定不存在的项目时明确提示，不悄悄显示另一条视频',async()=>{
  window.history.replaceState(null,'','/?project=missing#planning');board();
  expect(await screen.findByText('链接中的项目不存在，请从当前项目列表重新选择。')).toBeVisible();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
it('每行规则可预览真实运动示意，可以暂停、重播和关闭',async()=>{
  board();await ready();
  fireEvent.click(screen.getByRole('button',{name:'预览第 1 段包装规则'}));
  const dialog=screen.getByRole('dialog');expect(dialog).toHaveTextContent('本段成片尚未制作');
  const graphic=within(dialog).getByRole('img',{name:'包装规则动态示意'});expect(graphic).toHaveAttribute('data-phase','0');
  vi.useFakeTimers();
  // Start the interval under fake timers by pausing and resuming.
  fireEvent.click(within(dialog).getByRole('button',{name:'暂停示意'}));fireEvent.click(within(dialog).getByRole('button',{name:'播放示意'}));
  act(()=>{vi.advanceTimersByTime(2400);});expect(graphic).toHaveAttribute('data-phase','1');
  fireEvent.click(within(dialog).getByRole('button',{name:'暂停示意'}));act(()=>{vi.advanceTimersByTime(2400);});expect(graphic).toHaveAttribute('data-phase','1');
  fireEvent.click(within(dialog).getByRole('button',{name:'重新播放'}));expect(graphic).toHaveAttribute('data-phase','0');
  fireEvent.keyDown(dialog,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('意见草稿分别跟随每行，筛选来回不丢失，未提交草稿不能确认',async()=>{
  board();await ready();edit(1,'别重复口播');edit(2,'这里保留人物');
  expect(screen.getByRole('button',{name:'确认第 1 段策划'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'保留人物',exact:true}));expect(screen.queryByRole('row',{name:'策划第 1 段'})).not.toBeInTheDocument();
  expect(screen.getByLabelText('第 2 段意见')).toHaveValue('这里保留人物');
  fireEvent.click(screen.getByRole('button',{name:'全部',exact:true}));expect(screen.getByLabelText('第 1 段意见')).toHaveValue('别重复口播');
});
it('保存失败保留对应行输入，新版本阻断旧提交并允许带草稿载入新版',async()=>{
  board();await ready();
  vi.mocked(fetch).mockImplementation(async(url,options)=>{
    if(options?.method==='POST')return {ok:false,json:async()=>({error:'策划已有更新；输入内容会保留。'})} as Response;
    return {ok:true,json:async()=>({...current,binding:'binding-2'})} as Response;
  });
  edit(1,'输入先出现');fireEvent.click(screen.getByRole('button',{name:'保存第 1 段意见'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('输入内容会保留');
  const reload=await screen.findByRole('button',{name:'载入新版本，保留意见草稿'});
  expect(screen.getByLabelText('第 1 段意见')).toHaveValue('输入先出现');expect(screen.getByRole('button',{name:'保存第 1 段意见'})).toBeDisabled();
  fireEvent.click(reload);await waitFor(()=>expect(screen.getByRole('button',{name:'保存第 1 段意见'})).toBeEnabled());
  expect(screen.getByLabelText('第 1 段意见')).toHaveValue('输入先出现');
});
it('保存提交正确行和本轮版本，成功清空草稿，待处理意见阻断确认',async()=>{
  board();await ready();
  current.review={revision:1,shots:{s1:{status:'changes_requested',comments:[{id:'c1',text:'先看输入',resolved:false,createdAt:'2026-10-03'}]}}};
  edit(1,'先看输入');fireEvent.click(screen.getByRole('button',{name:'保存第 1 段意见'}));
  expect(await screen.findByText('✓ 已保存到本项目')).toBeInTheDocument();
  expect(screen.getByLabelText('第 1 段意见')).toHaveValue('');expect(screen.getByRole('button',{name:'确认第 1 段策划'})).toBeDisabled();
  const options=vi.mocked(fetch).mock.calls.find(([,options])=>options?.method==='POST')![1];
  expect(JSON.parse(options!.body as string)).toMatchObject({binding:'binding-1',revision:0,shotId:'s1',text:'先看输入'});
});
it('未声明包装规则不伪造预览；保留人物可使用人物规则示意',async()=>{
  delete current.scenes[0].packaging_rule;
  board();await ready();expect(screen.getByRole('button',{name:'预览第 1 段包装规则'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'预览第 2 段包装规则'}));
  expect(screen.getByRole('dialog')).toHaveTextContent('保留人物 · 留出呼吸');
});
it('没有当前版本策划时先展示全文，旧方案不可确认',async()=>{
  current.scenes=[];current.plan_error='剪后逐字稿已变化，请重新策划';board();
  await screen.findByRole('heading',{name:'完整剪后逐字稿'});expect(screen.getByRole('alert')).toHaveTextContent('重新策划');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
it('实际样段与通用规则示意分开，当前已渲染段落能打开视频参考',async()=>{
  current.reference_sample={title:'前20秒候选',duration_seconds:20,scene_ids:['s1'],url:'/candidate.mp4',poster:'/poster.png'};
  board();await ready();
  expect(within(row(2)).queryByRole('button',{name:'播放第 2 段样段参考'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'播放第 1 段样段参考'}));
  const dialog=screen.getByRole('dialog',{name:'动效候选预览'});
  const video=within(dialog).getByLabelText('动效候选视频') as HTMLVideoElement;
  expect(video).toHaveAttribute('src','/candidate.mp4');fireEvent.loadedMetadata(video);expect(video.currentTime).toBe(1);
  expect(dialog).toHaveTextContent('此处播放的是本地参考渲染');
  fireEvent.click(within(dialog).getByRole('button',{name:'关闭样段参考'}));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
