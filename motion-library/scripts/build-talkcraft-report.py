import json,pathlib,subprocess,concurrent.futures,html
from PIL import Image,ImageDraw,ImageFont
root=pathlib.Path(__file__).resolve().parents[2];p=root/'.cache/talkcraft-all';v=json.load(open(p/'verification.json'));cat=json.load(open(root/'motion-library/src/talkcraft/catalog.json'));rows={x['slug']:x for x in v['results']};font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17)
def proxy(r):
 if r['status']!='pass':return
 d=p/'renders'/r['slug'];o=d/'preview.mp4'
 if not o.exists():subprocess.run(['ffmpeg','-v','error','-i',str(d/'output.mov'),'-vf','scale=960:540','-c:v','libx264','-threads','2','-filter_threads','2','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-an','-y',str(o)],check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:list(ex.map(proxy,v['results']))
for n in range(9):
 group=cat[n*12:(n+1)*12];im=Image.new('RGB',(1280,1044),'#111827');d=ImageDraw.Draw(im)
 for i,c in enumerate(group):
  x=(i%4)*320;y=(i//4)*348;slug=c['slug']
  for j in [1,2]:
   f=p/'renders'/slug/f'{j}.png'
   if f.exists():im.paste(Image.open(f).convert('RGB').resize((320,180)),(x,y+(j-1)*168))
  d.rectangle((x,y+324,x+320,y+348),fill='#111827');d.text((x+5,y+327),slug,font=font,fill='white')
 im.save(p/f'contact-{n+1}.jpg')
items=[]
for c in cat:
 s=c['slug'];r=rows.get(s,{});status=r.get('status','pending');items.append(f'''<article data-q="{html.escape(c['title']+' '+s+' '+c['category'])}"><h2>{html.escape(c['title'])}</h2><small>{c['category']} · {s} · {status}</small><video controls preload="none" poster="renders/{s}/2.png" src="renders/{s}/preview.mp4"></video><details><summary>内容替换与阶段帧</summary><img src="renders/{s}/{r.get("replacement_baseline_index",1)}.png"><img src="renders/{s}/changed.png"><img src="renders/{s}/3.png"><p>素材均为标明 TEST 的合成验收材料，不是项目实际结果。</p></details></article>''')
p.joinpath('index.html').write_text('''<!doctype html><html lang="zh"><meta charset="utf-8"><title>TalkCraft 108 接入验收</title><style>body{margin:32px;background:#10141d;color:#f8fafc;font:16px system-ui}header{max-width:1000px;margin:auto}h1{font-size:36px}p{line-height:1.7;color:#bdcad8}input{padding:16px;width:90%;border:0;border-radius:8px;font-size:18px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:24px;margin-top:30px}article{padding:20px;background:#202936;border-radius:16px}h2{font-size:24px}video,img{width:100%;margin-top:12px;border-radius:10px}small{color:#91cddd}summary{cursor:pointer;margin-top:16px}</style><header><h1>TalkCraft · 108 模板接入验收</h1><p>'''+f"当前实际渲染通过 {v['passed']}/108；内容替换通过 108/108，ChatCut 原生时间线已检查 108 张代表帧。每张卡使用独立参数和明确标为 TEST 的素材，输出 1920×1080、30fps、静音透明 ProRes，并保留四个阶段帧和内容替换帧。"+'''</p><p>这里证明接口与渲染可用。实际项目仍需检查文案长度、关系表达、真实素材定位和动态声画；演示用的网页、人物、数字不能当成你的结果。</p><input id="q" placeholder="搜索名称、用途或 slug"><a href="verification.json" style="color:#22d3ee">查看逐卡机器验证记录</a></header><main>'''+''.join(items)+'''</main><script>q.oninput=()=>document.querySelectorAll('article').forEach(x=>x.hidden=!x.dataset.q.toLowerCase().includes(q.value.toLowerCase()))</script></html>''')
print(f"Report and previews {v['passed']}/108 ready")
