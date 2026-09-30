// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import {TalkCraftGallery} from '../src/talkcraft/Gallery';

afterEach(cleanup);
it('可以检索模板，未选择时不同时播放 108 个 demo', () => {
  render(<TalkCraftGallery onBack={() => {}}/>);
  expect(screen.getAllByRole('button',{name:'查看动效'})).toHaveLength(108);
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
  fireEvent.change(screen.getByLabelText('搜索 TalkCraft 模板'),{target:{value:'word-slot-cycle'}});
  expect(screen.getAllByRole('button',{name:'查看动效'})).toHaveLength(1);
  fireEvent.click(screen.getByRole('button',{name:'查看动效'}));
  expect(document.querySelector('iframe')).toHaveAttribute('src','/talkcraft-demos/word-slot-cycle/index.html');
});
