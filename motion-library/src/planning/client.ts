import type {PlanningProject} from './types';
import type {ReviewState} from '../review/types';

async function request<T>(url:string, options?:RequestInit):Promise<T> {
  const response=await fetch(url,options);
  const data=await response.json();
  if (!response.ok) throw new Error(data.error??'工作台服务未连接，请保留输入后重试。');
  return data as T;
}
const route=(id:string)=>`/api/planning-projects/${encodeURIComponent(id)}`;
export const listProjects=()=>request<{id:string;title:string}[]>('/api/planning-projects');
export const loadProject=(id:string)=>request<PlanningProject>(route(id));
export const savePlanning=(id:string, action:Record<string,unknown>)=>request<ReviewState>(route(id),{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action),
});
