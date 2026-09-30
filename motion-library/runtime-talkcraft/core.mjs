import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
export const libraryDir = path.dirname(runtimeDir);
export const registry = JSON.parse(fs.readFileSync(path.join(libraryDir, 'adapters/talkcraft/registry.json'), 'utf8'));
export const catalog = JSON.parse(fs.readFileSync(path.join(libraryDir, 'src/talkcraft/catalog.json'), 'utf8'));
const assert = (ok, message) => {if (!ok) throw new Error(message);};
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
const strings = value => Array.isArray(value) && value.every(x => typeof x === 'string' && x.trim());

export function validateProps(card, props) {
  assert(props && typeof props === 'object' && !Array.isArray(props), 'props 必须是对象');
  for (const key of Object.keys(props)) assert(card.props.includes(key), `${card.slug}: 不支持参数 ${key}`);
  for (const key of card.required) assert(props[key] !== undefined && props[key] !== null && props[key] !== '', `${card.slug}: 缺少 ${key}`);
  for (const key of ['text', 'sub', 'keyword', 'before', 'after', 'title', 'stem', 'final', 'src', 'logoSrc', 'hostSrc']) {
    if (key in props) assert(typeof props[key] === 'string' && (key === 'before' || key === 'after' || props[key].trim()), `${key} 必须是文字或素材引用`);
  }
  const items = props.items ?? props.steps ?? props.words ?? props.lines;
  if (items) {
    assert(Array.isArray(items) && items.length >= card.min_items && items.length <= card.max_items,
      `${card.slug}: 条目数应为 ${card.min_items}–${card.max_items}`);
    if (props.steps) assert(items.every(x => x && typeof x.no === 'string' && typeof x.txt === 'string' && x.txt.trim()), 'steps 需要 no、txt');
    else assert(strings(items), '条目必须是非空文字');
  }
  if (card.max_text) assert([...(props.text ?? props.keyword ?? '')].length <= card.max_text, `${card.slug}: 文字过长，请缩短或升级版式`);
  if (props.srcs) assert(strings(props.srcs) && props.srcs.length === 3, '并列版式必须绑定三张真实图片');
  if (props.layout) assert(card.layouts?.includes(props.layout), '本版只开放已适配的 vertical-strips；其他人物布局需另做适配');
  if (props.fullScreen !== undefined) assert(props.fullScreen === true, '当前并列卡只开放 fullScreen 模式');
  for (const key of ['seconds', 'exitTime']) if (key in props) assert(Number.isFinite(props[key]) && props[key] > 0, `${key} 必须为正数`);
  for (const key of ['itemsAt', 'entryTimes']) if (key in props) assert(Array.isArray(props[key]) && props[key].every((x, i, arr) => Number.isFinite(x) && x >= 0 && (i === 0 || x > arr[i - 1])) && props[key].length === items?.length, `${key} 需要与条目等长、递增的时间点`);
  if (props.itemBg) assert(strings(props.itemBg) && props.itemBg.length >= props.items.length && props.itemBg.every(x => /^#[0-9a-f]{6}$/i.test(x)), 'itemBg 需要为每个条目提供颜色');
  if (props.accent) assert(/^#[0-9a-f]{6}$/i.test(props.accent), 'accent 必须是六位十六进制颜色');
}

export function resolvePlan(plan) {
  assert(plan && safeId(plan.project_id), 'project_id 只能使用字母、数字、下划线或连字符');
  let preset;
  if (plan.style_id) {
    assert(/^[a-zA-Z0-9_.-]+$/.test(plan.style_id) && !plan.style_id.includes('..'), 'style_id 无效');
    const file = path.join(libraryDir, '../styles', plan.style_id, 'talkcraft-theme.json');
    assert(fs.existsSync(file), '该风格尚无 TalkCraft 主题参数');
    preset = JSON.parse(fs.readFileSync(file,'utf8'));
  }
  plan = {...plan, theme:{...(preset?.theme ?? {}),...(plan.theme ?? {})}};
  for (const key of ['accent','ink','panelInk','panel']) if (key in plan.theme) assert(/^#[0-9a-f]{6}$/i.test(plan.theme[key]), `${key} 必须是六位颜色`);
  assert(plan.fps === 30, '首版固定 30 fps，其他帧率须先适配模板时钟');
  assert(Number.isInteger(plan.width) && plan.width > 0 && Number.isInteger(plan.height) && plan.height > 0, '缺少有效分辨率');
  assert(Array.isArray(plan.shots) && plan.shots.length > 0, 'shots 不能为空');
  const seen = new Set();
  const recent = [];
  const shots = plan.shots.map(shot => {
    assert(safeId(shot.id) && !seen.has(shot.id), '镜头 id 无效或重复'); seen.add(shot.id);
    assert(Number.isInteger(shot.start_frame) && shot.start_frame >= 0 && Number.isInteger(shot.duration_frames) && shot.duration_frames > 0, `${shot.id}: 帧范围无效`);
    assert(['presenter_safe', 'full_screen'].includes(shot.presentation_mode), `${shot.id}: 需明确人物/全屏模式`);
    const layer = shot.layer ?? 'primary';
    assert(['primary', 'camera'].includes(layer), '当前只渲染 primary 或 camera 层');
    if (shot.clean_presenter) {recent.push('clean_presenter'); return {...shot, resolution: {primary_card: null, status: 'clean_presenter'}};}
    const request = shot.primary_motion_request;
    assert(layer === 'camera' || request?.family && request?.subtype, `${shot.id}: 缺少 Motion Request`);
    const props = {...(request?.content ?? shot.props ?? {})};
    const requested = layer === 'camera' ? shot.resolution?.camera?.card_id : shot.resolution?.primary_card;
    const rejections = [];
    const candidates = registry.filter(card => card.layer === layer && (!requested || card.id === requested)).filter(card => {
      try {
        assert(layer !== 'primary' || card.family === request.family && card.subtype === request.subtype, '语义关系不匹配');
        assert(!card.full_screen || shot.presentation_mode === 'full_screen', '需要全屏模式');
        validateProps(card, props);
        const speed = shot.motion_speed ?? 1;
        assert(Number.isFinite(speed) && speed >= .25 && speed <= 2, 'motion_speed 需在 0.25–2 之间');
        const delay = shot.start_delay_frames ?? 0;
        assert(Number.isInteger(delay) && delay >= 0, 'start_delay_frames 需为非负整数');
        assert((shot.duration_frames - delay) * speed >= card.min_frames, '镜头太短，动画与阅读停留不足');
        const activeSeconds = (shot.duration_frames - delay) * speed / 30;
        if (card.slug === 'title-demote-to-label') {
          const last = props.itemsAt?.at(-1) ?? 2.067 + (props.items.length-1)*.55;
          assert(last + .5 + .8 <= activeSeconds && (!props.exitTime || last + .5 + .4 <= props.exitTime && props.exitTime <= activeSeconds), '标题条目尚未读完就结束，请调整 itemsAt 或镜头长度');
        }
        if (card.slug === 'parallel-items-with-host' && props.entryTimes) assert(props.entryTimes.at(-1) + .45 + .5 <= activeSeconds, '最后一个并列项没有足够阅读时间');
        if (card.slug === 'word-slot-cycle') assert(1.1 + (props.words.length-2)*.7 + .7 + .35 + .12 + .47 + 1.5 <= activeSeconds, '词槽结论需要至少 1.5 秒停留，请延长镜头');
        assert(recent.length < 2 || recent.slice(-2).some(x => x !== `${card.family}/${card.subtype}`), '同一主结构已连续使用两次，应换布局或回到干净口播');
        return true;
      } catch (error) {rejections.push({card: card.id, reason: error.message}); return false;}
    });
    assert(candidates.length > 0, `${shot.id}: 没有合适模板，需升级/生成或回到干净口播。${JSON.stringify(rejections)}`);
    const card = candidates[0];
    if (layer === 'primary') recent.push(`${card.family}/${card.subtype}`);
    else recent.push('camera');
    assert(shot.presentation_mode === 'full_screen' || shot.box && ['left','top','width','height'].every(k => Number.isFinite(shot.box[k])), `${shot.id}: 人物旁包装需明确 box，并审查人物安全区`);
    const box = shot.box ?? {left: 0, top: 0, width: plan.width, height: plan.height};
    assert(box.left >= 0 && box.top >= 0 && box.width > 0 && box.height > 0 && box.left + box.width <= plan.width && box.top + box.height <= plan.height, `${shot.id}: box 超出画面`);
    return {...shot, box, props, card, resolution: {
      provider: 'talkcraft', primary_card: layer === 'primary' ? card.id : null,
      ...(layer === 'camera' ? {camera: {card_id: card.id}} : {}),
      card_version: card.version, status: 'resolved',
      reason: '语义与实际参数匹配；符合已开放版式、素材与时长约束', rejections,
    }};
  });
  return {...plan, ...(preset ? {style_status:preset.status}: {}), shots};
}

export function assetRefs(value) {
  if (typeof value === 'string') return value.startsWith('asset:') ? [value.slice(6)] : [];
  if (Array.isArray(value)) return value.flatMap(assetRefs);
  return value && typeof value === 'object' ? Object.values(value).flatMap(assetRefs) : [];
}

export function validateAssets(plan, publicDir) {
  for (const shot of plan.shots) {
    for (const key of ['src', 'srcs', 'logoSrc', 'hostSrc']) {
      const values = Array.isArray(shot.props?.[key]) ? shot.props[key] : shot.props?.[key] ? [shot.props[key]] : [];
      assert(values.every(x => typeof x === 'string' && x.startsWith('asset:')), `${shot.id}: ${key} 只接受 asset: 本地素材引用`);
    }
    for (const step of shot.props?.steps ?? []) if (step.logo) assert(typeof step.logo === 'string' && step.logo.startsWith('asset:'), `${shot.id}: steps.logo 只接受 asset: 本地素材引用`);
    for (const ref of assetRefs(shot.props)) {
      const file = path.resolve(publicDir, ref);
      assert(file.startsWith(path.resolve(publicDir) + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile(), `素材不存在或越界：${ref}`);
    }
  }
}

export function fingerprint(shot, plan, publicDir) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify({shot, fps: plan.fps, width: plan.width, height: plan.height, theme: plan.theme}));
  // Include all adapters so a shared helper change also invalidates outputs.
  const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).sort((a,b) => a.name.localeCompare(b.name)).forEach(f => {
    const p = path.join(dir, f.name); if (f.isDirectory()) walk(p); else {hash.update(p); hash.update(fs.readFileSync(p));}
  });
  walk(path.join(libraryDir, 'adapters/talkcraft'));
  for (const file of ['Root.tsx', 'package-lock.json', 'core.mjs', 'render.mjs']) hash.update(fs.readFileSync(path.join(runtimeDir, file)));
  for (const ref of assetRefs(shot.props)) hash.update(fs.readFileSync(path.join(publicDir, ref)));
  return hash.digest('hex');
}

export function deliveryManifest(plan, results) {
  return {version: 1, project_id: plan.project_id, fps: plan.fps, width: plan.width, height: plan.height,
    base_timeline: plan.base_timeline ?? null,
    status: 'ready_for_preview_not_assembled',
    preserve: ['aroll_clips', 'captions', 'voice_audio'],
    clips: results.map(r => ({shot_id: r.shot_id, file: r.file, start_frame: r.start_frame,
      duration_frames: r.duration_frames, source_in_frame: 0, start_us: Math.round(r.start_frame / plan.fps * 1e6),
      duration_us: Math.round((r.start_frame + r.duration_frames) / plan.fps * 1e6) - Math.round(r.start_frame / plan.fps * 1e6), track: 'jianjipro-talkcraft-packaging',
      muted: true, contains_presenter: false, alpha: true, fit: 'native_canvas', width: plan.width, height: plan.height,
      render_hash: r.hash})),
    instructions: '先审片，再在 ChatCut 项目副本导入。以帧计算位置，不修改主线、字幕和口播音频；同一镜头按 shot_id 更新，避免重复添加。'};
}

export function verifyVideo(file, shot, plan) {
  const probe = JSON.parse(execFileSync('ffprobe', ['-v','error','-show_streams','-of','json',file], {encoding:'utf8'}));
  const video = probe.streams.find(s => s.codec_type === 'video');
  assert(video?.width === plan.width && video?.height === plan.height, '渲染分辨率不符');
  assert(Number(video.nb_frames) === shot.duration_frames && video.r_frame_rate === '30/1', '渲染帧数或帧率不符');
  assert(video.codec_name === 'prores' && video.pix_fmt.startsWith('yuva'), '透明 ProRes 输出不符');
  assert(!probe.streams.some(s => s.codec_type === 'audio'), '包装层必须静音');
  return {frames:Number(video.nb_frames),pixel_format:video.pix_fmt,width:video.width,height:video.height};
}
