from PIL import Image,ImageDraw,ImageFont
import json,pathlib,hashlib
p=pathlib.Path(__file__).parent; sb=json.load(open(p/'shotbook.json'));shots=[s for s in sb['shots'] if not s.get('clean_presenter')];font=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',20)
for part in range(3):
 group=shots[part*7:part*7+7];im=Image.new('RGB',(1152,len(group)*242),'#111827');d=ImageDraw.Draw(im)
 for r,s in enumerate(group):
  for j in range(3):
   f=p/'renders'/f"{s['id']}-{j}.png"
   if f.exists():im.paste(Image.open(f).convert('RGB').resize((384,216)),(j*384,r*242))
  d.text((8,r*242+217),f"{s['id']} | {s['start']:.2f}–{s['end']:.2f}s | {s['visual_structure']}",font=font,fill='white')
 im.save(p/'validation'/f'contact-{part+1}.jpg')
json.dump({'sfx_cues':0,'reason':'保留现有真人口播与音频接缝处理；本轮只改视觉呈现。','status':'no_added_sfx_not_a_listening_pass'},open(p/'validation/sfx-report.json','w'),ensure_ascii=False,indent=2)
anchors=[]
for s in shots:
 pp=s['primary_motion_request']['content']
 for i,t in enumerate(pp.get('entryTimes',[0])):anchors.append({'shot':s['id'],'at':s['start']+t,'anchor':(pp.get('items') or [pp.get('keyword') or pp.get('name') or pp.get('caption') or s['spoken_text']])[min(i,len(pp.get('items') or [None])-1)]})
json.dump(anchors,open(p/'validation/word-anchors.json','w'),ensure_ascii=False,indent=2)
with open(p/'validation/card-candidates.md','w') as f:
 f.write('# V2 实现关系\n先有画面概念再判断模板。现有模板不能保留关系时使用 Generated Motion。\n')
 for s in shots:f.write(f"- {s['id']}: "+('TalkCraft keyword-pop-highlight' if s['id'] in ['github','find'] else 'TalkCraft doc-park-left-pill-deal + 调整口播落点' if s['id']=='readme-checks' else 'TalkCraft lower-third-nameplate + 透明人物旁版' if s['id']=='identity' else 'Generated Motion，保留 '+s['visual_structure'])+'\n')
with open(p/'validation/QA.md','w') as f:f.write('风格：深色解释画面、白底真实网页/文档；青色强调。主体信息在底部195px字幕保留区上方；真人脸部避让。网页内容为真实捕获，合集卡与工具处理结果明确示意。V2只改善视觉，音频未重新剪切。16个项目生成镜头、2个新适配卡镜头和2个旧关键词卡镜头；以实际候选清单为准。不得把静帧通过称为动态/听审通过。\n')
print('QA 五件材料与分片拼图已生成')
