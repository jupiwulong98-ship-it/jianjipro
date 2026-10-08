import json,pathlib,copy
p=pathlib.Path(__file__).parent
sem=json.load(open(p/'semantic-map.json'));co=json.load(open(p/'visual-concepts.json'));ed=json.load(open(p/'edit-plan.json'));sb=json.load(open(p/'shotbook.json'))
for obj in [sem,co,ed,sb]:obj['project_id']=p.name
ideas={
'repository':('中心仓库连接环形分布的四类内容；随口播依次高亮，使用图标和连线减少盒子。','orbital-repository'),
 'three-actions':('沿搜索、看介绍、复制链接的连续路线推进，当前步骤放大，最后看完整順序。','action-rail'),
 'signup':('真实页面顶栏与 Sign up 局部放大窗并排，定位线交代按钮在右上角。','signup-inset'),
 'search-codex':('左侧真实搜索结果近景，右侧同步人物小窗，查询词直接连接结果。','search-presenter-pair'),
 'search-ppt':('横向搜索条与真实项目结果特写，具体检索词成为主体。','search-results-focus'),
 'repositories':('左栏 Repositories 局部放大，旁边仅保留中文释义。','repository-sidebar-closeup'),
 'awesome':('真实 awesome 搜索结果为入口，三张抽象工具卡从入口向外展开，标注合集结构示意。','collection-fan'),
 'stars':('先拍真实 Most stars 排序入口，再随新口播移到同页项目列表，保持真实内容。','stars-page-tour'),
 'star-not-fit':('星标群和需求靶心分列两侧，中间大号不等号；保留关注度不等于适用性。','star-target-contrast'),
 'readme':('真实 README 纵向文档卡与人物小窗同屏，慢移到用途与输出段落。','readme-document-and-host'),
 'readme-checks':('README 向左驻留，右侧三个平级阅读问题按口播出现，保留真实文档来源。','readme-park-and-questions'),
 'copy-link':('真实项目地址从浏览器地址条复制到标明请求示意的 Codex 输入区，表现连续交接。','link-handoff'),
 'check-before-install':('连续检查台按兼容性、依赖费用、安装、用例推进；当前项成为主角，其余留编号。','inspection-desk'),
 'install-not-use':('安装成功状态章与待实测任务之间保留大号不等号，提醒自己的任务才是验收。','installed-versus-task'),
 'real-task':('输入材料进入工具，落在待核验结果位；PPT 和视频两组实例在同一位置接力，注明示意。','real-material-relay'),
 'acceptance':('两个独立验收条件分别亮起，两项都成立才汇合成需要的工具，保留 AND。','two-condition-lock'),
 'summary':('六个连续站点随口播依次进入主画面，底部路线记录已走步骤，最后看完整搜索到实测链。','six-stop-journey')}
for c in co['concepts']:
 ident=c['event_id'].removeprefix('visual-')
 if ident in ideas:c['visual_concept']=c['structure_description']=ideas[ident][0];c['revision_reason']='V1 网页构图重复、盒子箭头较多；保留语义关系，改取景和信息层级。'
for s in sb['shots']:
 if s['id'] in ideas:s['rhythm']['layout']=ideas[s['id']][1];s['rhythm']['motion_strength']='medium' if s['id'] in ['three-actions','summary','stars'] else 'low';s['implementation_notes']=ideas[s['id']][0]
 if s['id']=='three-actions':s['primary_motion_request']={'family':'process','subtype':'cinematic-route','visual_structure':'sequence','content':{'title':'你只需要会三件事','items':['搜需求','看介绍','复制链接'],'entryTimes':[0,1.9,3.5]}}
 if s['id']=='readme-checks':s['primary_motion_request']['subtype']='document-questions'
 if s['id'] in ['search-codex','readme']:s['asset_slots'].append({'id':'asset:presenter.mp4','required':True,'status':'ready','evidence_role':'actual_presenter','source':'V1 原素材按已验证剪切拼接，同步实际口播时间'})
 for k in ['resolution','card','generated_motion_request']:s.pop(k,None)
outro=next(s for s in sb['shots'] if s['id']=='clean-outro');original_end=outro['end'];outro['end']=5791/30;outro['duration_frames']=5791-outro['start_frame']
name=copy.deepcopy(outro);name.update(id='identity',start_frame=5791,duration_frames=198,start=5791/30,end=5989/30,clean_presenter=False,spoken_text='那么我是乌龙，分享 AI 工具和实操。和大家一起把 AI 真正用进工作和项目里。',source_segment_ids=['clean-outro'],source_edit_event_id='edit-identity',visual_concept_ids=['visual-identity'],primary_visual_job='介绍本人和内容方向',visual_structure='single_focus',presentation_mode='presenter_safe',box={'left':52,'top':600,'width':600,'height':220},primary_motion_request={'family':'entity','subtype':'identity-overlay','visual_structure':'single_focus','content':{'name':'乌龙','title':'AI 工具 · 实操','entryTimes':[0,.55]}},safe_zones={'presenter':{'enabled':True,'region':{'left':800,'top':120,'width':400,'height':600}},'captions':{'enabled':True,'bottom_reserve_pct':18}},rhythm={'layout':'presenter-lowerthird','visual_intensity':'low','visual_subject':'presenter','motion_strength':'low','information_change':'new_state','visualizable':True,'annotation_source':'shotbook'},asset_slots=[])
name.pop('clean_presenter_reason',None);sb['shots'].append(name)
tail=copy.deepcopy(outro);tail.update(id='clean-tail',start_frame=5989,duration_frames=5,start=5989/30,end=original_end);sb['shots'].append(tail)
co['concepts'].append({'event_id':'visual-identity','source_segment_ids':['clean-outro'],'start':name['start'],'end':name['end'],'spoken_text':name['spoken_text'],'meaning':'介绍讲述者及内容方向','visual_concept':'人物左侧色条展开，姓名先出现，内容方向随后跟进，避开脸部和字幕。','visual_structure':'single_focus','structure_description':'姓名与方向同属一个身份信息组。','visual_focus':'乌龙分享 AI 工具与实操','presentation':'presenter_safe','real_asset_need':'none','asset_description':'','importance':'normal','evidence_need':'none','claim_status':'owner_confirmed','fallback':{'strategy':'generated_motion','description':'保留身份信息组，避开脸部。'},'revision_reason':'补上原片尾自我介绍的身份展示。'})
for e in ed['events']:
 s=next(s for s in sb['shots'] if s.get('source_edit_event_id')==e['id']);e['motion_request']=s['primary_motion_request'];e['visual_intent']=next(c['visual_concept'] for c in co['concepts'] if c['event_id']==e['visual_concept_id'])
ed['events'].append({'id':'edit-identity','start':name['start'],'end':name['end'],'visual_concept_id':'visual-identity','source_segment_ids':['clean-outro'],'motion_request':name['primary_motion_request'],'visual_intent':co['concepts'][-1]['visual_concept'],'presentation_hint':'presenter_safe'})
sb['visual_concepts']=co;sb.pop('rhythm_review',None)
for f,o in [('semantic-map.json',sem),('visual-concepts.json',co),('edit-plan.json',ed),('shotbook.json',sb)]:json.dump(o,open(p/f,'w'),ensure_ascii=False,indent=2)
print('20 包装概念，36 主线分段')
