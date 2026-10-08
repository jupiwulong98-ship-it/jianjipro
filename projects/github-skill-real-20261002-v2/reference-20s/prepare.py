"""Build an isolated, speech-bearing reference from freshly read Desktop cuts."""
import hashlib, json, subprocess
from pathlib import Path

p = Path(__file__).resolve().parent
project = p.parent
live = json.loads((p/'validation/live-input.json').read_text())
transcript = json.loads((project/'transcript/final-transcript.json').read_text())
native = [w for c in live['native_cards'] for w in c['words']]
words = [w for s in transcript['segments'] for w in s['words']]
assert len(native) == 104
assert all(a['id']==b['id'] and a['text']==b['text'] and abs(a['start']/1e6-b['start'])<.000001 and abs(a['end']/1e6-b['end'])<.000001 for a,b in zip(native,words))
assert transcript['source']['project_id']==live['project_id']

source = Path('/Users/jupiwulong/Downloads/a0403da25a9a47d989b54194c4b8ac8a.MOV')
assert source.is_file()
assets = p/'assets';assets.mkdir(exist_ok=True)
graph=[]; inputs=[]; cursor=0
for i,cut in enumerate(live['base_cuts']):
    first,last=cut['timelineRange']['fromFrame'],cut['timelineRange']['toFrame']
    assert first==cursor
    count=min(last,600)-first;cursor=first+count
    start=cut['sourceRange']['start']/1e6;end=start+count/30
    graph.append(f'[0:v]trim=start={start:.9f}:end={end:.9f},setpts=PTS-STARTPTS,fps=30,scale=1920:1080,setsar=1[v{i}]')
    # Short edge fades approximate the Desktop audio cross-fades; this is a reference, not a native export.
    graph.append(f'[0:a]atrim=start={start:.9f}:end={end:.9f},asetpts=PTS-STARTPTS,aresample=48000,apad,atrim=duration={count/30:.9f},afade=t=in:d=0.018,afade=t=out:st={count/30-.018:.9f}:d=0.018[a{i}]')
    inputs.extend([f'[v{i}]',f'[a{i}]'])
assert cursor==600
graph.append(''.join(inputs)+f'concat=n={len(live["base_cuts"])}:v=1:a=1[v][a]')
(p/'validation/base-filter.txt').write_text(';\n'.join(graph))
subprocess.run(['ffmpeg','-v','error','-y','-threads','2','-i',str(source),'-filter_complex_threads','2','-filter_complex_script',str(p/'validation/base-filter.txt'),'-map','[v]','-map','[a]','-frames:v','600','-t','20','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(assets/'base.mp4')],check=True)

plan=json.loads((project/'visual-planning.json').read_text())
cards=transcript['segments'][:8]
def section(id,title,indices,mode,rule,goal,initial,actions,final,reason):
    source_words=[w for i in indices for w in cards[i]['words']]
    resolved=[]
    for at,cue,description in actions:
        anchor=next(w for w in source_words if abs(w['start']-at)<.002)
        offset=source_words.index(anchor)
        ids=[anchor['id']]
        text=anchor['text']
        while text.strip()!=cue and offset+len(ids)<len(source_words):
            w=source_words[offset+len(ids)];ids.append(w['id']);text+=w['text']
        assert text.strip()==cue,(text,cue)
        resolved.append({'word_id':anchor['id'],'cue_word_ids':ids,'description':description})
    return dict(id=id,title=title,mode=mode,packaging_rule=rule,source_word_ids=[w['id'] for w in source_words],viewer_goal=goal,initial_state=initial,actions=resolved,final_state=final,materials='当前项目实拍与原口播；图形为解释性示意，不使用网页截图。人物脸部和底部字幕区保留。',reason=reason)

new=[
section('ref20-intro','建立讲述者与话题',[0,1],'clean','clean_presenter','听清这次内容承接哪条视频','原有实拍人物与原文字幕',[],'人物继续讲述，进入不是私藏的转折','难点：这是经历与话题交代，额外关系图没有新信息；画面补充：保留人物和字幕，让注意力先落在讲述者。十多万人仅沿用口播自述，不另做增长或统计证据。'),
section('ref20-public','从私藏误解到共享资源',[2,3],'visual','before_after','看懂这些工具来自可找到的共享项目，而不是封闭收藏','人物左侧三个工具符号聚在闭合文件夹内，不显示具体名称',[(6.626667,'不是','文件夹的锁打开，工具保持为同一组对象，解除私藏误解'),(7.966667,'它们','开放文件夹展开，工具沿原位置显出'),(9.366667,'GitHub','同一文件夹标为共享项目；搜索环沿入口定位'),(10.246667,'找到。','搜索环停在其中一个工具，明确可找到的对象')],'开放文件夹、工具和搜索入口同在；随后整组退出','难点：只显示平台名，观众看不出不是私藏与能找到之间的联系；画面补充：同一组工具从闭合收藏转为开放项目，并被搜索环定位，用状态变化解释可获取性。图形为示意，不能作为真实项目检索证据。'),
section('ref20-method','从工具清单转向寻找方法',[4,5],'visual','before_after','分清这一期提供的是寻找方法，而不是另一批推荐名称','三个无名工具符号沿用上一段对象，形成短清单',[(11.706667,'不继续','工具清单降低亮度，保留转折对象而不继续堆新名称'),(13.533333,'我直接教你','工具清单退后，一条搜索路径展开'),(14.573333,'更有用的方法。','找方法短标签出现，搜索环成为主焦点，留出约一秒阅读时间')],'一个搜索路径与短标签找方法驻留，人物始终可见','难点：又出现一组工具名会让观众误以为仍是推荐清单；画面补充：旧清单退后，移动搜索环成为主体，以对象和主焦点的替换解释这期内容变化。借鉴参考的同一主体状态变化，不增加教程步骤。'),
section('ref20-wait','解除等待分享的依赖',[6,7],'visual','single_focus','看懂找工具不必一直依赖别人更新分享','左侧需求符号与等待分享的钟表以虚线相连',[(16.246667,'缺什么工具，','需求符号进入，钟表只是低亮度的等待路径'),(17.006667,'不需要','等待路径断开，需求保持在原位置'),(18.926667,'等别人去分享，','钟表停止并退后，需求成为唯一亮点；不提前演示下一句的 AI 操作')],'需求留在原位，等待路径已解除；20 秒处留给下一句衔接','难点：这句在否定依赖等待，普通标题无法让等待关系可见；画面补充：需求与时钟先连接，再随不需要断开，后面的等别人分享只作收束。不给出尚未说到的检索结果，保留下一句的动作空间。')
]
if (p/'scene-overrides.json').exists():
    revised=json.loads((p/'scene-overrides.json').read_text())
    assert len(revised)==len(new)
    assert [s['source_word_ids'] for s in revised]==[s['source_word_ids'] for s in new]
    new=revised
elif (p/'intro-override.json').exists():
    revised=json.loads((p/'intro-override.json').read_text())
    assert revised['source_word_ids']==new[0]['source_word_ids']
    new[0]=revised
old_prefix=[]
for s in plan['scenes']:
    if s['source_word_ids'][0] not in {w['id'] for w in native}:break
    old_prefix.append(s)
assert [id for s in old_prefix for id in s['source_word_ids']]==[w['id'] for w in native]
if not (p/'validation/prior-first20-plan.json').exists():
    (p/'validation/prior-first20-plan.json').write_text(json.dumps(old_prefix,ensure_ascii=False,indent=2))
plan['scenes']=new+plan['scenes'][len(old_prefix):]
plan['proposal_note']='仅前20秒改为TalkCraft优先候选：人数计数、纠正私藏误解、真实搜索页、清单转方法、不必等分享。20秒以后策划保持原样，尚未重做。候选未装回ChatCut。'
(project/'visual-planning.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
reference=dict(version='0.1',status='candidate',project_id=live['project_id'],timeline_id=live['timeline_id'],transcript_revision=transcript['revision'],width=1920,height=1080,fps=30,duration_frames=600,scene_ids=[s['id'] for s in new],scenes=new,captions=[dict(start=c['start']/1e6,end=c['end']/1e6,text=c['text']) for c in live['native_cards']],source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),audio_note='原口播按当前剪后顺序重建，剪切边缘使用短淡化近似；未改写声音，非 ChatCut 原生导出。',claim_note='十多万人为用户口播自述，不提供额外统计证明。',redaction='没有使用网页截图；图形无链接、仓库地址、具体 Skill 名称或来源脚注。')
if (p/'scene-overrides.json').exists():
    reference['revision_note']='仅前20秒：优先复用TalkCraft五种原动效，字体/布局按当前人物留白适配；原音轨和八条字幕不变。'
    reference['redaction']='使用预先像素打码的真实搜索页；无网址、仓库地址、具体Skill名称或来源脚注。'
(p/'reference-plan.json').write_text(json.dumps(reference,ensure_ascii=False,indent=2)+'\n')
print('Live caption match: 104/104 words. Base: 600 frames with source speech. Plan: 4 new sections.')
