import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPostCutTranscript, transcriptSrt} from '../scripts/post-cut-transcript.mjs';

function capture() {
  const tracks = [{id: 'speech', role: 'original', cardCount: 2}, {id: 'translation', role: 'translation', cardCount: 1}];
  const card = (id, text, start, end, trackId = 'speech') => ({id, text, start, end, trackId,
    words: [{id: `word-${id}`, text, start, end}]});
  return {projectId: 'project', timelineId: 'timeline', trackId: 'speech', durationFrames: 300,
    capturedAt: '2026-10-03T00:00:00Z', pages: [
      {timelineId: 'timeline', captionsItemId: 'captions', captions: {tracks},
        cards: [card('a', '先剪。', 250000, 900000), card('translated', 'Cut.', 250000, 900000, 'translation')],
        page: {offset: 0, returned: 2, total: 3, hasMore: true, nextOffset: 2}},
      {timelineId: 'timeline', captionsItemId: 'captions', captions: {tracks},
        cards: [card('b', '再看。', 3500000, 4200000)],
        page: {offset: 2, returned: 1, total: 3, hasMore: false}}
    ]};
}

test('保留完整剪后全文和停顿，排除翻译，SRT使用剪后时间', () => {
  const result = buildPostCutTranscript(capture());
  assert.equal(result.full_text, '先剪。\n再看。');
  assert.equal(result.word_count, 2);
  assert.equal(result.segments[1].words[0].start, 3.5);
  assert.match(transcriptSrt(result), /00:00:03,500 --> 00:00:04,200/);
  assert.equal(result.listening_review, 'not_verified');
});
test('第一页不能冒充全文；分页状态和轨道总数变化也阻断', () => {
  const input = capture(); input.pages.pop();
  assert.throws(() => buildPostCutTranscript(input), /未完整读取/);
  const changed = capture(); changed.pages[1].page.total = 4;
  assert.throws(() => buildPostCutTranscript(changed), /状态已变化/);
});
test('拒绝翻译轨道或不同时间线', () => {
  const translated = capture(); translated.trackId = 'translation';
  assert.throws(() => buildPostCutTranscript(translated), /原文轨道/);
  const mixed = capture(); mixed.pages[1].timelineId = 'other';
  assert.throws(() => buildPostCutTranscript(mixed), /不同时间线/);
});
test('拒绝缺失字词、越界时间、乱码或文字不匹配', () => {
  for (const [change, pattern] of [
    [card => {delete card.words;}, /缺少字词/],
    [card => {card.words[0].end = 9999999;}, /越界/],
    [card => {card.text = '\uFFFD';}, /乱码/],
    [card => {card.text = '换了文字';}, /不一致/]
  ]) {
    const input = capture(); change(input.pages[0].cards[0]);
    assert.throws(() => buildPostCutTranscript(input), pattern);
  }
});
test('来源版本忽略读取时间，但文字或剪后时点修改使版本改变', () => {
  const input = capture(); const original = buildPostCutTranscript(input).revision;
  input.capturedAt = '2026-10-03T01:00:00Z';
  assert.equal(buildPostCutTranscript(input).revision, original);
  input.pages[1].cards[0].start += 100000;
  input.pages[1].cards[0].words[0].start += 100000;
  assert.notEqual(buildPostCutTranscript(input).revision, original);
});

test('无文字无字词的原生空占位保留溯源，不能补造成口播', () => {
  const input = capture();
  for (const page of input.pages) {page.page.total = 4; page.captions.tracks[0].cardCount = 3;}
  input.pages[1].cards.push({id: 'empty', trackId: 'speech', text: '', start: 500000, end: 510000, words: []});
  input.pages[1].page.returned = 2;
  const result = buildPostCutTranscript(input);
  assert.equal(result.native_card_count, 3);
  assert.equal(result.segment_count, 2);
  assert.equal(result.ignored_empty_cards[0].id, 'empty');
  assert.equal(result.full_text, '先剪。\n再看。');
});
