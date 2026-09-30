"""Build the review-board fixture from the existing real-talkcraft v2 project."""
from pathlib import Path
import argparse
import json
import shutil
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
args = parser.parse_args()
source = args.source.resolve()
library = Path(__file__).resolve().parents[1]
project_id = 'ai-tools-real-20260930'
public = library / 'public' / 'review-projects' / project_id
public.mkdir(parents=True, exist_ok=True)
url = f'/review-projects/{project_id}/'
footage = source / 'sample/remotion/public'
overlay = source / 'sample/remotion/out/AI剪辑工具怎么选-多版式包装-v2.mov'
cuts = json.loads((source / 'sample/remotion/src/cuts.json').read_text())
captions = json.loads((source / 'sample/remotion/src/full-captions.json').read_text())

# Follow FullV2.tsx, rather than shots.json, which still describes the earlier v1.
rows = [
    ('开场：AI 剪辑怎么选', 0, 261, '人物旁', ['split-text-stagger'], ['host'], '先建立本片主题', '开头给出话题，标题与人物共同承担注意力，不急着堆素材。', ['rule-section-title'], '人物旁透明标题', []),
    ('HyperFrames：工具首次出现', 261, 560, '人物旁', ['title-demote-to-label'], ['hyperframes-logo'], '记住名称，再接用途', '工具首次出现用标识建立认知，标题随后让位给产品介绍、文字图片和动画。', ['rule-entity-emphasis'], '名称 → 角标 → 用途', []),
    ('HyperFrames：展示官网', 560, 764, '全屏', ['slow-push-in'], ['hyperframes-page'], '让观众看见实际产品', '真实官网接管画面，轻缓推近只作为辅助运镜。', ['rule-tutorial-screen-primary'], '官网截图 + 缓推', ['这是官网页面概览，不是实际操作录屏。']),
    ('灵活，也需要判断', 764, 1148, '人物旁', ['keyword-pop-highlight'], ['host'], '突出优势与代价', '对“工程可改”“需要判断”做局部重音，人物继续说话。', ['rule-return-to-clean-talking-head'], '关键词强调', ['这段较长，可在重点之间留干净口播。']),
    ('Remotion：可复用的模板元素', 1148, 1507, '人物旁', ['numbered-step-stack'], ['remotion-logo'], '解释哪些东西可做成模板', '标题、字幕、品牌颜色与动画是并列内容，先检查其信息关系再选排版。', ['rule-list-tags'], '旧版编号堆叠 · 建议调整', ['旧版用了步骤卡，但这里是并列项，建议换成并列标签。']),
    ('Remotion：官网与复用', 1507, 1708, '全屏', ['slow-push-in'], ['remotion-page'], '展示工具及复用方向', '用已有官网截图承接“换内容、改参数”，不把官网示例冒充我们的实测结果。', ['rule-tutorial-screen-primary'], '官网截图 + 缓推', []),
    ('搭模板需要时间', 1708, 1814, '全屏', [], ['typing'], '用动作素材承接时间投入', '键盘素材提供场景变化；它是动作示意，不是 Remotion 操作证据。', ['rule-example-broll'], '独立 B-roll + 细线边框', ['全屏素材的裁切与露底需要实际合成检查。']),
    ('只做一条，可能不划算', 1814, 2003, '人物旁', ['keyword-pop-highlight'], ['host'], '强调使用成本判断', '让画面回到人物，突出“不划算”，避免同一段持续全屏。', ['rule-return-to-clean-talking-head'], '人物回场 + 关键词', []),
    ('ChatCut：真人口播与录屏', 2003, 2178, '人物旁', [], ['chatcut-logo'], '建立适用场景', '先认出工具名称，再看到真人口播和录屏这两类输入。', ['rule-entity-emphasis'], 'Logo + 简洁场景文字', ['当前文字为旧项目定制实现，尚未作为通用卡注册。']),
    ('剪废话、字幕、补画面', 2178, 2288, '全屏', [], ['production'], '让画面节奏发生变化', '制作现场素材作为场景示意，口播和字幕仍是主要信息。', ['rule-example-broll'], '独立 B-roll + 细线边框', ['它不是 ChatCut 软件的实际操作录屏。']),
    ('ChatCut：在时间线上修改', 2288, 2433, '全屏', ['slow-push-in'], ['chatcut-page'], '展示产品界面方向', '用真实官网截图承接口播，不伪造界面操作。', ['rule-tutorial-screen-primary'], '官网截图 + 缓推', []),
    ('最终结果自己微调', 2433, 2646, '人物旁', ['keyword-pop-highlight'], ['host'], '强调人工过片', '核心落点是自己调整和判断，保持人物在场。', ['rule-return-to-clean-talking-head'], '“自己微调”强调', []),
    ('安装简单，自己尝试', 2646, 2884, '人物旁', ['word-slot-cycle'], ['hyperframes-logo', 'remotion-logo', 'chatcut-logo'], '串起三个工具名称', '三个名称处于同一语义槽位，轮换后落到“自己尝试”。', ['rule-entity-emphasis'], '词槽轮换 → 结论', ['检查工具名阅读时间，不能为了展示动画加快口播。']),
    ('先看需求', 2884, 2974, '人物旁', ['keyword-pop-highlight'], ['host'], '给出选择原则', '先用短关键词突出选择依据，再进入工具匹配。', ['rule-return-to-clean-talking-head'], '短句强调', []),
    ('三种任务，三种工具', 2974, 3242, '全屏', ['parallel-items-with-host'], ['hyperframes-logo', 'remotion-logo', 'chatcut-logo'], '帮助观众快速做选择', '动效、固定栏目、真人口播是平级任务，用三栏对应工具，不能画成先后流程。', ['rule-list-tags'], '全屏三栏，按口播逐项进入', ['旧模板名字含人物，但这一镜实际采用无占位人物的全屏版式。']),
    ('收束：结果自己判断', 3242, 3410, '人物旁', ['quote-hold-arrow'], ['host'], '让结论落定', '省步骤、省时间之后，把注意力交回人物与“自己判断”。', ['rule-return-to-clean-talking-head'], '三行观点 + 最后一行高亮', ['这是自己的结论，不是外部引用。']),
]

def ffmpeg(arguments):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *arguments], check=True)

assets = [dict(id='host', label='真实口播主线', kind='image', url=url+'host.jpg', source='', note='35 个初剪片段；人物镜头对应源视频映射。')]
for name, slug, website in [('HyperFrames','hyperframes','https://www.hyperframes.dev/'),('Remotion','remotion','https://www.remotion.dev/'),('ChatCut','chatcut','https://chatcut.io/zh')]:
    logo = {'hyperframes':'hyperframes.svg','remotion':'remotion.png','chatcut':'chatcut-app.png'}[slug]
    shutil.copy2(footage/'logos'/logo,public/logo)
    assets.append(dict(id=slug+'-logo',label=name+' 标识',kind='image',url=url+logo,source=website,note='沿用旧项目已登记的官方标识；保留品牌颜色。'))
    ffmpeg(['-i',str(footage/(slug+'-v2.png')),'-vf','scale=1280:-2','-frames:v','1',str(public/(slug+'-page.jpg'))])
    assets.append(dict(id=slug+'-page',label=name+' 官网截图',kind='image',url=url+slug+'-page.jpg',source=website,note='2026-09-30 缓存的官网页面；不是操作录屏。'))
for asset_id, filename, label, source_url in [('typing','typing-pixabay-6378.mp4','键盘与工作场景','https://pixabay.com/videos/id-6378/'),('production','editing-pixabay-26537.mp4','视频制作现场','https://pixabay.com/videos/id-26537/')]:
    ffmpeg(['-ss','2','-i',str(footage/'broll'/filename),'-t','4','-an','-vf','scale=960:-2','-c:v','libx264','-preset','fast','-crf','25','-movflags','+faststart',str(public/(asset_id+'.mp4'))])
    assets.append(dict(id=asset_id,label=label,kind='video',url=url+asset_id+'.mp4',source=source_url,note='场景 B-roll，源素材静音；不声称是产品真实操作。'))

shots = []
for i, (title,start,end,mode,templates,asset_ids,intent,reason,rules,packaging,attention) in enumerate(rows,1):
    frame = start + int((end-start)*.62)
    cut = next(c for c in cuts if c['from'] <= frame < c['from']+c['frames'])
    source_time = (cut['sourceFrame']+frame-cut['from'])/30
    timeline_time = frame/30
    inputs=['-ss',str(source_time),'-i',str(footage/'source-normalized.mp4'),'-ss',str(timeline_time),'-i',str(overlay)]
    if 'typing' in asset_ids or 'production' in asset_ids:
        asset='typing' if 'typing' in asset_ids else 'production'
        filename='typing-pixabay-6378.mp4' if asset=='typing' else 'editing-pixabay-26537.mp4'
        inputs+=['-ss',str(2+(frame-start)/30),'-i',str(footage/'broll'/filename)]
        graph='[2:v]scale=1852:1042,crop=1852:940:0:51[b];[0:v][b]overlay=34:34[base];[base][1:v]overlay=0:0,scale=1280:720[out]'
    else:graph='[0:v][1:v]overlay=0:0,scale=1280:720[out]'
    id=f'scene-{i:02d}'
    ffmpeg([*inputs,'-filter_complex',graph,'-map','[out]','-frames:v','1','-q:v','2',str(public/(id+'.jpg'))])
    if i==1:shutil.copy2(public/(id+'.jpg'),public/'host.jpg')
    spoken=[c for c in captions if c['end']>start/30 and c['start']<end/30]
    caption=next((c['text'] for c in captions if c['start']<=timeline_time<c['end']),spoken[-1]['text'] if spoken else '')
    parents=[s['id'] for s in json.loads((source/'shots.json').read_text()) if s['toFrame']>start and s['fromFrame']<end]
    shots.append(dict(id=id,title=title,startFrame=start,endFrame=end,mode=mode,intent=intent,reason=reason,ruleIds=rules,
        templateIds=templates,layerNote='辅助运镜；主画面是真实截图' if templates==['slow-push-in'] else '主包装' if templates else 'ChatCut 原生素材 / 项目定制文字',
        packaging=packaging,preview=url+id+'.jpg',caption=caption,transcript=''.join(c['text'] for c in spoken),assetIds=asset_ids,
        attention=attention,originalShotIds=parents))

project=dict(id=project_id,title='AI 剪辑工具怎么选',fps=30,durationFrames=3410,captionCount=len(captions),clipCount=len(cuts),
    snapshotDate='2026-09-30',styleLabel='旧 v2 单蓝强调 · 本轮待审',chatcutProjectId='81892e72-e13e-4a96-a827-90f8162794d1',
    provenance='用已有 v2 镜头与确认字幕占位；包装理由为本轮审阅建议，尚未代表用户确认。画面为历史包装与初剪源片合成参考，不是实时 ChatCut 截屏。',assets=assets,shots=shots)
out=library/'src/review/project.json'
out.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
record=library.parent/'projects'/project_id
record.mkdir(parents=True,exist_ok=True)
(record/'.gitignore').write_text('review.json\n*.tmp\n')
(record/'README.md').write_text('# AI 剪辑工具怎么选 · 项目审阅占位\n\n源工程：'+str(source)+'\n\n看板数据：`motion-library/src/review/project.json`。画面参考位于 `motion-library/public/review-projects/ai-tools-real-20260930/`。\n\n意见提交后写入本目录 `review.json`，不会修改镜头计划、重新渲染或写入 ChatCut。意见状态“已处理”只表示人工标记，须在制作后检查实际画面。\n\n初始镜头全部待确认，包装建议并非用户已批准。当前源数据来自既有 v2 快照；不会自动同步 ChatCut 的后续修改。\n')
print(f'{out}: {len(shots)} scenes, {len(captions)} captions, {len(cuts)} cuts')
