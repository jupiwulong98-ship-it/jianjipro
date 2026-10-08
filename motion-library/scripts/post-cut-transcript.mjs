import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const normalized = text => text.replace(/\s/g, '');
const validRange = item => Number.isSafeInteger(item.start) && Number.isSafeInteger(item.end) && item.start >= 0 && item.end > item.start;

// 输入是ChatCut完整分页读回；不能将原素材毫秒或SRT句级时间混入。
export function buildPostCutTranscript(input) {
  for (const key of ['projectId', 'timelineId', 'trackId', 'capturedAt'])
    requireValue(hasText(input?.[key]), `缺少 ${key}`);
  requireValue(Number.isFinite(Date.parse(input.capturedAt)), 'capturedAt 无效');
  requireValue(Number.isSafeInteger(input.durationFrames) && input.durationFrames > 0, '缺少时间线总帧数');
  requireValue(Array.isArray(input.pages) && input.pages.length > 0, '缺少字幕分页');
  const first = input.pages[0];
  const total = first.page?.total;
  requireValue(Number.isSafeInteger(total) && total > 0, '字幕为空或总数无效');
  let offset = 0;
  const cards = [];
  const cardIds = new Set();
  for (const [index, page] of input.pages.entries()) {
    requireValue(page.timelineId === input.timelineId, '字幕来自不同时间线');
    requireValue(page.captionsItemId === first.captionsItemId, '字幕来源已变化');
    requireValue(page.page?.total === total && page.page.offset === offset, '字幕分页缺失或状态已变化');
    requireValue(Array.isArray(page.cards) && page.cards.length > 0 && page.page.returned === page.cards.length, '字幕分页数量不一致');
    requireValue(page.captions?.tracks?.some(track => track.id === input.trackId && track.role === 'original'), '需明确指定原文轨道');
    for (const card of page.cards) {
      requireValue(hasText(card.id) && !cardIds.has(card.id), '字幕条重复或缺少id');
      cardIds.add(card.id);
      if (card.trackId === input.trackId) cards.push(card);
    }
    offset += page.cards.length;
    const more = offset < total;
    requireValue(page.page.hasMore === more, '字幕分页结束状态不一致');
    if (more) requireValue(page.page.nextOffset === offset, '字幕分页未连续');
    requireValue(more === (index < input.pages.length - 1), '字幕未完整读取或存在多余分页');
  }
  requireValue(offset === total && cards.length > 0, '未读取完整字幕或原文轨道为空');
  const expected = first.captions.tracks.find(track => track.id === input.trackId).cardCount;
  requireValue(cards.length === expected, '原文轨道字幕未读全');
  const wordIds = new Set();
  const ignoredEmptyCards = [];
  let previousCardStart = -1;
  const segments = cards.flatMap(card => {
    requireValue(validRange(card), '字幕时间无效');
    requireValue(typeof card.text === 'string' && !card.text.includes('\uFFFD'), '原文缺失或存在乱码');
    // 原生轨道偶有空字幕占位；保留溯源，不把它补成说话内容。
    if (!card.text.trim() && Array.isArray(card.words) && card.words.length === 0) {
      ignoredEmptyCards.push({id: card.id, start: card.start / 1e6, end: card.end / 1e6, reason: 'native_empty_caption'});
      return [];
    }
    requireValue(card.start >= previousCardStart, '有效字幕顺序错误');
    previousCardStart = card.start;
    requireValue(hasText(card.text), '原文为空但存在字词，需核对');
    requireValue(Array.isArray(card.words) && card.words.length > 0, '缺少字词时间，不能仅使用SRT');
    let previousWordStart = -1;
    const words = card.words.map(word => {
      requireValue(hasText(word.id) && !wordIds.has(word.id), '字词id缺失或重复');
      wordIds.add(word.id);
      requireValue(hasText(word.text) && !word.text.includes('\uFFFD'), '字词文字为空或存在乱码');
      requireValue(validRange(word) && word.start >= card.start && word.end <= card.end && word.start >= previousWordStart, '字词时间无效、越界或顺序错误');
      previousWordStart = word.start;
      return {id: word.id, text: word.text, start: word.start / 1e6, end: word.end / 1e6};
    });
    requireValue(normalized(card.text) === normalized(words.map(word => word.text).join('')), '字幕全文与字词不一致，先校正并重新读取');
    return [{id: card.id, text: card.text, start: card.start / 1e6, end: card.end / 1e6, words}];
  });
  requireValue(segments.length > 0, '原文轨道没有有效文字');
  const source = {project_id: input.projectId, timeline_id: input.timelineId, track_id: input.trackId,
    duration_frames: input.durationFrames, kind: 'chatcut_post_cut_captions', time_basis: 'edited_timeline'};
  const revision = createHash('sha256').update(JSON.stringify({source, segments, ignoredEmptyCards})).digest('hex');
  return {version: '0.1', source, captured_at: input.capturedAt, revision, time_unit: 'seconds',
    data_validation: 'pass', listening_review: 'not_verified', segment_count: segments.length,
    word_count: wordIds.size, native_card_count: cards.length, ignored_empty_cards: ignoredEmptyCards,
    full_text: segments.map(segment => segment.text).join('\n'), segments};
}

function srtTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const pad = (value, width = 2) => String(value).padStart(width, '0');
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

export function transcriptSrt(transcript) {
  return transcript.segments.map((segment, index) =>
    `${index + 1}\n${srtTime(segment.start)} --> ${srtTime(segment.end)}\n${segment.text}\n`).join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [inputFile, outputDir] = process.argv.slice(2);
  requireValue(inputFile && outputDir, '用法：post-cut-transcript.mjs <capture.json> <output-dir>');
  const transcript = buildPostCutTranscript(JSON.parse(fs.readFileSync(inputFile, 'utf8')));
  fs.mkdirSync(outputDir, {recursive: true});
  fs.writeFileSync(path.join(outputDir, 'final-transcript.json'), JSON.stringify(transcript, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'final-transcript.txt'), transcript.full_text + '\n');
  fs.writeFileSync(path.join(outputDir, 'final-transcript.srt'), transcriptSrt(transcript));
  console.log(`剪后全文已保存：${transcript.segment_count} 条字幕、${transcript.word_count} 字词；数据完整性通过，听音未验收。`);
}
