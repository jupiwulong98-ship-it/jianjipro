import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readReview,mutateReview} from '../scripts/review-store.mjs';

function fixture(run) {const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jianjipro-review-'));try{run(path.join(dir,'review.json'));}finally{fs.rmSync(dir,{recursive:true,force:true});}}
test('意见落盘后可重新读取，自动进入需调整',()=>fixture(file=>{
  assert.equal(readReview(file).revision,0);
  const saved=mutateReview(file,['scene-01'],{revision:0,shotId:'scene-01',action:'comment',text:' 少一点包装 '});
  assert.equal(saved.shots['scene-01'].comments[0].text,'少一点包装');
  assert.equal(saved.shots['scene-01'].status,'changes_requested');assert.deepEqual(readReview(file),saved);
}));
test('旧版本提交被拒绝，已有意见不被覆盖',()=>fixture(file=>{
  mutateReview(file,['s'],{revision:0,shotId:'s',action:'comment',text:'保留人物'});
  assert.throws(()=>mutateReview(file,['s'],{revision:0,shotId:'s',action:'comment',text:'其他意见'}),error=>error.status===409);
  assert.equal(readReview(file).shots.s.comments.length,1);
}));
test('有未处理意见不能确认；处理后待确认；再确认可重新讨论',()=>fixture(file=>{
  let r=mutateReview(file,['s'],{revision:0,shotId:'s',action:'comment',text:'换模板'});
  assert.throws(()=>mutateReview(file,['s'],{revision:r.revision,shotId:'s',action:'status',status:'approved'}),/先标记意见/);
  const id=r.shots.s.comments[0].id;
  r=mutateReview(file,['s'],{revision:r.revision,shotId:'s',action:'resolve',commentId:id});assert.equal(r.shots.s.status,'pending');
  r=mutateReview(file,['s'],{revision:r.revision,shotId:'s',action:'status',status:'approved'});assert.equal(r.shots.s.status,'approved');
  r=mutateReview(file,['s'],{revision:r.revision,shotId:'s',action:'resolve',commentId:id});assert.equal(r.shots.s.status,'changes_requested');
}));
test('撤回只删除指定意见，未知镜头与空意见被拒绝',()=>fixture(file=>{
  let r=mutateReview(file,['s'],{revision:0,shotId:'s',action:'comment',text:'测试意见'});
  r=mutateReview(file,['s'],{revision:r.revision,shotId:'s',action:'delete',commentId:r.shots.s.comments[0].id});assert.equal(r.shots.s.comments.length,0);
  assert.throws(()=>mutateReview(file,['s'],{revision:r.revision,shotId:'missing',action:'comment',text:'意见'}),/镜头不存在/);
  assert.throws(()=>mutateReview(file,['s'],{revision:r.revision,shotId:'s',action:'comment',text:' '}),/1–2000/);
}));
