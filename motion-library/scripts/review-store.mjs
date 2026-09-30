import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const reviewStatuses = ['pending', 'approved', 'changes_requested'];
export function readReview(file) {
  if (!fs.existsSync(file)) return {revision: 0, shots: {}};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
export function mutateReview(file, validShotIds, request) {
  const current = readReview(file);
  if (request.revision !== current.revision) {
    const error = new Error('意见已有更新，请刷新后重试；输入内容会保留。'); error.status = 409; throw error;
  }
  if (!validShotIds.includes(request.shotId)) throw new Error('镜头不存在');
  const shot = structuredClone(current.shots[request.shotId] ?? {status:'pending', comments:[]});
  if (request.action === 'comment') {
    if (typeof request.text !== 'string' || !request.text.trim() || request.text.trim().length > 2000) throw new Error('意见需为 1–2000 字');
    shot.comments.push({id:crypto.randomUUID(),text:request.text.trim(),createdAt:new Date().toISOString(),resolved:false});
    shot.status = 'changes_requested';
  } else if (request.action === 'status') {
    if (!reviewStatuses.includes(request.status)) throw new Error('状态无效');
    if (request.status === 'approved' && shot.comments.some(c => !c.resolved)) throw new Error('请先标记意见已处理，再确认本镜头。');
    shot.status = request.status;
  } else if (request.action === 'resolve') {
    const comment = shot.comments.find(c => c.id === request.commentId);
    if (!comment) throw new Error('意见不存在');
    comment.resolved = !comment.resolved;
    if (!comment.resolved) shot.status = 'changes_requested';
    else if (shot.comments.every(c => c.resolved)) shot.status = 'pending';
  } else if (request.action === 'delete') {
    if (!shot.comments.some(c => c.id === request.commentId)) throw new Error('意见不存在');
    shot.comments = shot.comments.filter(c => c.id !== request.commentId);
    if (!shot.comments.some(c => !c.resolved)) shot.status = 'pending';
  } else throw new Error('操作无效');
  const next = {...current, revision:current.revision+1, updatedAt:new Date().toISOString(), shots:{...current.shots, [request.shotId]:shot}};
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {fs.writeFileSync(temporary, JSON.stringify(next,null,2)+'\n');fs.renameSync(temporary,file);}
  finally {if (fs.existsSync(temporary)) fs.unlinkSync(temporary);}
  return next;
}
