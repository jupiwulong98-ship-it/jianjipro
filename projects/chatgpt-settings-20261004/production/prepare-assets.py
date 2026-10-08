from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent;raw=p.parents[2]/'.cache/chatgpt-capture'
fontpath='/System/Library/Fonts/Supplemental/Arial Unicode.ttf';font=lambda n:ImageFont.truetype(fontpath,n)
reports=[]
def screenshot(name,crop,masks=[]):
 im=Image.open(raw/(name+'.png')).convert('RGB');h=hashlib.sha256(im.tobytes()).hexdigest();d=ImageDraw.Draw(im)
 for box in masks:
  d.rectangle(box,fill='#d4d4d4');d.text((box[0]+32,box[1]+26),'私人内容已隐藏',font=font(30),fill='#555')
 im=im.crop(crop);dest=p/'assets'/('screen-'+name+'.png');im.save(dest)
 reports.append({'id':name,'source':'Tabbit ChatGPT live screenshot','crop':crop,'opaque_masks':masks,'source_pixels_sha256':h,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'file':str(dest.relative_to(p)),'privacy_check':'pending_visual_check'})
screenshot('menu',(30,995,640,1285))
screenshot('personalization',(35,245,2480,1320))
screenshot('style',(35,245,2480,1470))
screenshot('style-options',(35,245,2480,1550))
screenshot('instructions',(915,380,2480,1120),[(928,540,2470,1120)])
screenshot('memory',(670,315,2025,1545),[(680,425,2020,1545)])
screenshot('data',(35,245,2480,1310))
# Static text is template input, not a fabricated product interface.
def slate(name,tag,lines,w=720,h=450,highlight=-1):
 im=Image.new('RGB',(w,h),'#f6f5f0');d=ImageDraw.Draw(im);d.text((40,30),tag,font=font(22),fill='#777')
 for i,line in enumerate(lines):d.text((40,115+i*85),line,font=font(36),fill='#9e4938' if i==highlight else '#242522')
 im.save(p/'assets'/('text-'+name+'.png'))
slate('model-a','相同模型',['ChatGPT','设置 A'])
slate('model-b','相同模型',['ChatGPT','设置 B'])
slate('praise1','口播例子',['“你的想法很棒”'])
slate('praise2','口播例子',['“这个方向','非常有潜力”'])
slate('problem','问题处理',['待解决','没有具体建议'])
slate('ability','模型能力',['更强的模型'])
slate('work','工作方式',['偏好 / 指令','准确记忆'])
slate('instructions-example','口播示例',['不为认同而认同','逻辑有问题，直接指出','先结论，再原因','少说正确但无用的话'],w=960,h=540)
(p/'validation/privacy-assets.json').write_text(json.dumps({'status':'pending_visual_check','assets':reports},ensure_ascii=False,indent=2))
thumb=Image.new('RGB',(1440,810),'#eee')
for i,r in enumerate(reports):
 im=Image.open(p/r['file']);im.thumbnail((480,270));thumb.paste(im,((i%3)*480,(i//3)*270))
thumb.save(p/'validation/privacy-contact-sheet.jpg')
# Normalize only already redacted images to the template's 960x430 image slot.
for name in ['menu','personalization','style','style-options','instructions','memory','data']:
 im=Image.open(p/'assets'/('screen-'+name+'.png'));im.thumbnail((960,430));canvas=Image.new('RGB',(960,430),'#f6f5f0');canvas.paste(im,((960-im.width)//2,(430-im.height)//2));canvas.save(p/'assets'/('canvas-'+name+'.png'))
# Larger, legible crop of the same captured data-control row; no settings are altered.
data=Image.open(p/'assets/screen-data.png');data=data.crop((875,0,2440,610));data.thumbnail((920,415));canvas=Image.new('RGB',(960,430),'#f6f5f0');canvas.paste(data,((960-data.width)//2,0));canvas.save(p/'assets/canvas-data-target.png')
canvas=Image.new('RGB',(960,430),'#f6f5f0');d=ImageDraw.Draw(canvas)
ins=Image.open(p/'assets/screen-instructions.png');ins.thumbnail((335,270));canvas.paste(ins,(15,30));d.text((30,325),'真实输入区 · 私人内容已隐藏',font=font(18),fill='#777')
d.text((420,35),'口播示例',font=font(25),fill='#888')
for i,line in enumerate(['不为认同而认同','逻辑有问题，直接指出','先结论，再原因','少说正确但无用的话']):d.text((420,130+i*75),line,font=font(36),fill='#242522')
canvas.save(p/'assets/canvas-instruction-combined.png');canvas.save(p/'assets/canvas-instructions-example.png')
# Increase illustrative text size so it survives card scaling in the presenter-safe crop.
for name,tag,lines in [('model-a','相同模型',['ChatGPT','设置 A']),('model-b','相同模型',['ChatGPT','设置 B']),('praise1','口播例子',['“你的想法很棒”']),('praise2','口播例子',['“这个方向','非常有潜力”']),('problem','问题处理',['待解决','没有具体建议']),('ability','模型能力',['更强的模型']),('work','工作方式',['偏好 / 指令','准确记忆'])]:
 im=Image.new('RGB',(720,450),'#f6f5f0');d=ImageDraw.Draw(im);d.text((40,25),tag,font=font(36),fill='#777')
 for i,line in enumerate(lines):d.text((40,130+i*115),line,font=font(60),fill='#242522')
 im.save(p/'assets'/('text-'+name+'.png'))
# Keep the real navigation plus a larger crop of the same visible style controls.
style=Image.open(p/'assets/screen-style-options.png');nav=style.crop((0,0,675,1305));nav.thumbnail((230,420));main=Image.open(raw/'style-options.png').crop((915,810,2475,1630));main.thumbnail((680,420));canvas=Image.new('RGB',(960,430),'#f6f5f0');canvas.paste(nav,(0,0));canvas.paste(main,(270,15));canvas.save(p/'assets/canvas-style-options.png')
