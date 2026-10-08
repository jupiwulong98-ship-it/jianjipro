import type {ReviewState} from '../review/types';

export type TimedWord={id:string;text:string;start:number;end:number};
export type Transcript={revision:string;captured_at:string;segment_count:number;word_count:number;
  full_text:string;listening_review:string;source:{duration_frames:number;time_basis:string};
  segments:{id:string;text:string;start:number;end:number;words:TimedWord[]}[]};
export type PlanningScene={id:string;title:string;mode:'clean'|'visual';start:number;end:number;text:string;
  packaging_rule?:string;
  viewer_goal:string;initial_state:string;final_state:string;materials:string;reason:string;
  words:TimedWord[];actions:{word_id:string;description:string;text:string;start:number;end:number}[]};
export type PlanningProject={id:string;title:string;transcript:Transcript;scenes:PlanningScene[];
  reference_sample?:{title:string;duration_seconds:number;scene_ids:string[];url:string;poster:string}|null;
  proposal_note:string;plan_error:string;binding:string;review:ReviewState};
