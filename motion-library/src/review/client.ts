import type {ReviewState} from './types';

async function request(projectId:string, mutation?:Record<string,unknown>):Promise<ReviewState> {
  const response=await fetch(`/api/project-review/${encodeURIComponent(projectId)}`,mutation ? {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(mutation),
  } : undefined);
  const data=await response.json();
  if (!response.ok) throw new Error(data.error ?? '保存失败，请重试');
  return data;
}
export const loadReview=(projectId:string)=>request(projectId);
export const saveReview=(projectId:string,mutation:Record<string,unknown>)=>request(projectId,mutation);
