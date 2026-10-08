// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {ProjectBoard} from '../src/review/ProjectBoard';

beforeEach(()=>vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({revision:0,shots:{}})})));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('真实项目的 16 段可查看，素材与模板分开展示',async()=>{
  render(<ProjectBoard onBack={()=>{}} onOpenTemplates={()=>{}}/>);
  expect(screen.getAllByRole('button',{name:/查看镜头/})).toHaveLength(16);
  fireEvent.click(screen.getByRole('button',{name:'查看镜头 Remotion：可复用的模板元素'}));
  expect(screen.getByText(/旧版用了步骤卡，但这里是并列项/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'查看来源 ↗'})).toHaveAttribute('href','https://www.remotion.dev/');
  fireEvent.click(screen.getByRole('tab',{name:'模板动效'}));
  expect(document.querySelector('iframe')).toHaveAttribute('src','/talkcraft-demos/numbered-step-stack/index.html');
  await waitFor(()=>expect(screen.getByRole('button',{name:'确认这段方案'})).toBeEnabled());
});
it('保存失败时保留输入，不显示保存成功',async()=>{
  const mock=vi.mocked(fetch);
  mock.mockResolvedValueOnce({ok:true,json:async()=>({revision:0,shots:{}})} as Response);
  mock.mockResolvedValueOnce({ok:false,json:async()=>({error:'意见已有更新，请刷新后重试；输入内容会保留。'})} as Response);
  render(<ProjectBoard onBack={()=>{}} onOpenTemplates={()=>{}}/>);
  await waitFor(()=>expect(screen.getByRole('button',{name:'确认这段方案'})).toBeEnabled());
  fireEvent.change(screen.getByLabelText('修改意见'),{target:{value:'别遮住人物'}});
  fireEvent.click(screen.getByRole('button',{name:'提交意见'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('输入内容会保留');
  expect(screen.getByLabelText('修改意见')).toHaveValue('别遮住人物');
  expect(screen.queryByText(/已保存到本机项目/)).not.toBeInTheDocument();
});
it('镜头间切换保留各自草稿，候选模板显示已完成的接入验证',async()=>{
  render(<ProjectBoard onBack={()=>{}} onOpenTemplates={()=>{}}/>);
  fireEvent.change(screen.getByLabelText('修改意见'),{target:{value:'开头标题小一点'}});
  fireEvent.click(screen.getByRole('button',{name:'查看镜头 HyperFrames：工具首次出现'}));
  expect(screen.getByLabelText('修改意见')).toHaveValue('');
  fireEvent.click(screen.getByRole('button',{name:'查看镜头 开场：AI 剪辑怎么选'}));
  expect(screen.getByLabelText('修改意见')).toHaveValue('开头标题小一点');
  fireEvent.click(screen.getByRole('button',{name:'建议换模板'}));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('搜索候选模板'),{target:{value:'media-pop-in'}});
  expect(screen.getByText(/已接入 · 三项验证通过/)).toBeInTheDocument();
});

it('新构思先展示母模板复用关系，节奏问题可跳到真实镜头',async()=>{
  render(<ProjectBoard onBack={()=>{}} onOpenTemplates={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'查看镜头 Remotion：可复用的模板元素'}));
  expect(screen.getByText('母模板 -> 换内容/参数 -> 视频01 / 视频02 / 视频03')).toBeInTheDocument();
  expect(screen.getByText(/本轮 AI 提案/)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/整片节奏检查/));
  fireEvent.click(screen.getAllByRole('button',{name:'查看对应镜头'})[0]);
  expect(screen.getByRole('heading',{name:'灵活，也需要判断'})).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'查看整片时间带 ↗'})).toHaveAttribute('href','/review-projects/ai-tools-real-20260930/rhythm/contact-sheet.jpg');
  await waitFor(()=>expect(screen.getByRole('button',{name:'确认这段方案'})).toBeEnabled());
});
