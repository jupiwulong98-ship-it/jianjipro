import React from 'react';
import {AbsoluteFill, Composition, Freeze, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import Split from '../adapters/talkcraft/cards/split-text-stagger';
import Keyword from '../adapters/talkcraft/cards/keyword-pop-highlight';
import Title from '../adapters/talkcraft/cards/title-demote-to-label';
import Steps from '../adapters/talkcraft/cards/numbered-step-stack';
import Words from '../adapters/talkcraft/cards/word-slot-cycle';
import Parallel from '../adapters/talkcraft/cards/parallel-items-with-host';
import Quote from '../adapters/talkcraft/cards/quote-hold-arrow';
import Push from '../adapters/talkcraft/cards/slow-push-in';
import {Skin, defaultTheme} from '../adapters/talkcraft/theme';

import {allCards as cards} from '../adapters/talkcraft/full/index';
function bind(value: any): any {
  if (typeof value === 'string' && value.startsWith('asset:')) return staticFile(value.slice(6));
  if (Array.isArray(value)) return value.map(bind);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,bind(v)]));
  return value;
}
function Shot({shot, theme = {}, width = 1920, height = 1080}: any) {
  const frame = useCurrentFrame();
  const Card = cards[shot.card.slug];
  const skin = {...defaultTheme, ...theme};
  const props = bind(shot.props);
  const box = shot.box;
  const seconds = shot.duration_frames / 30;
  const overrides: any = {};
  if (shot.card.slug === 'parallel-items-with-host') Object.assign(overrides, {fullScreen: true, seconds});
  if (shot.card.slug === 'slow-push-in') overrides.seconds = seconds;
  if (shot.card.slug === 'title-demote-to-label') {
    overrides.exitTime = (shot.duration_frames - (shot.start_delay_frames ?? 0)) / 30 * (shot.motion_speed ?? 1) - .4;
    overrides.itemsAt = props.itemsAt ?? props.items.map((_: string, i: number) => 2.067 + i * .55);
  }
  if (['title-demote-to-label', 'word-slot-cycle'].includes(shot.card.slug) && !props.accent) overrides.accent = skin.accent;
  const scale = Math.min(box.width / 960, box.height / 540);
  return <Skin theme={skin}><AbsoluteFill style={{width, height, background: 'transparent', fontFamily: skin.fontFamily}}>
    <div className="tc-stage" style={{position:'absolute', ...box, overflow:'hidden',
      background: shot.card.panel === 'light' ? skin.panel : 'transparent', borderRadius: shot.presentation_mode === 'presenter_safe' ? 20 : 0}}>
      <div style={{position:'absolute', left:(box.width-960*scale)/2, top:(box.height-540*scale)/2,
        width:960, height:540, transform:`scale(${scale})`, transformOrigin:'0 0'}}>
        <Freeze frame={Math.max(0, Math.floor((frame-(shot.start_delay_frames ?? 0))*(shot.motion_speed ?? 1)))}>
          <Card {...overrides} {...props}/>
        </Freeze>
      </div>
    </div>
  </AbsoluteFill></Skin>;
}
function Root() {return <Composition id="TalkCraftShot" component={Shot} width={1920} height={1080} fps={30} durationInFrames={120}
  defaultProps={{shot: {card:{slug:'keyword-pop-highlight',panel:'transparent'}, props:{keyword:'模板复用'}, box:{left:64,top:120,width:720,height:540}, duration_frames:120}}}
  calculateMetadata={({props}: any) => ({width: props.width ?? 1920, height: props.height ?? 1080, fps:30, durationInFrames:props.shot.duration_frames})}/>;}
registerRoot(Root);
