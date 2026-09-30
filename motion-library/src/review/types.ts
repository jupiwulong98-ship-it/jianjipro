export interface ReviewAsset {id:string;label:string;kind:string;url:string;source:string;note:string;}
export interface BoardShot {
  id:string;title:string;startFrame:number;endFrame:number;mode:string;intent:string;reason:string;ruleIds:string[];
  templateIds:string[];layerNote:string;packaging:string;preview:string;caption:string;transcript:string;
  assetIds:string[];attention:string[];originalShotIds:string[];
}
export interface BoardProject {id:string;title:string;fps:number;durationFrames:number;captionCount:number;clipCount:number;
  snapshotDate:string;styleLabel:string;chatcutProjectId:string;provenance:string;assets:ReviewAsset[];shots:BoardShot[];}
export interface Comment {id:string;text:string;createdAt:string;resolved:boolean;}
export interface ShotReview {status:'pending'|'approved'|'changes_requested';comments:Comment[];}
export interface ReviewState {revision:number;shots:Record<string,ShotReview>;}
