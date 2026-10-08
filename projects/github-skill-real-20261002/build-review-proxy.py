"""Build a local review proxy from canonical source cuts and final packaging movies.
This is not a ChatCut export. Subtitle styling is simplified; audio is omitted.
"""
import json,subprocess
from pathlib import Path
p=Path(__file__).resolve().parent; out=p/'validation/proxy-parts';out.mkdir(exist_ok=True)
data=json.loads((p/'validation/aroll-timeline.json').read_text());base=Path('/var/folders/_z/rc09kq2x6wz7529n_4lz96wr0000gn/T/chatcut-mcp-workspaces/a396a30a-4803-48d8-8351-772e19397011/assets')
entries=[e for e in data['timeline']['entries'] if e.get('itemType')=='video'];parts=[]
for i,e in enumerate(entries):
 f=out/f'{i:03}.mp4';parts.append(f)
 if f.exists():continue
 source=next(base.rglob(e['asset']['name']+'.MOV'));frames=e['timelineRange']['toFrame']-e['timelineRange']['fromFrame']
 subprocess.run(['ffmpeg','-v','error','-y','-threads','2','-ss',str(e['sourceRange']['start']/1e6),'-i',str(source),'-an','-vf','scale=1280:720,fps=30','-frames:v',str(frames),'-c:v','libx264','-preset','ultrafast','-crf','21','-pix_fmt','yuv420p',str(f)],check=True)
 if i%10==0:print(f'base {i+1}/{len(entries)}',flush=True)
listing=out/'concat.txt';listing.write_text('\n'.join("file '"+str(f)+"'" for f in parts))
aroll=p/'validation/aroll-review.mp4'
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy',str(aroll)],check=True)
manifest=p/'renders/chatcut-delivery.json'
if not manifest.exists():print('A-roll proxy ready; rerun after final movies finish',flush=True);raise SystemExit
clips=json.loads(manifest.read_text())['clips'];args=['ffmpeg','-v','error','-y','-threads','2','-i',str(aroll)]
for c in clips:args+=['-threads','1','-i',c['file']]
graph=[];prev='0:v'
for i,c in enumerate(clips,1):
 a=c['start_frame']/30;b=(c['start_frame']+c['duration_frames'])/30
 graph.append(f'[{i}:v]scale=1280:720,format=rgba,setpts=PTS-STARTPTS+{a}/TB[o{i}]')
 graph.append(f'[{prev}][o{i}]overlay=0:0:eof_action=pass:repeatlast=0:enable=\'gte(t,{a})*lt(t,{b})\'[v{i}]');prev=f'v{i}'
# Plain ASS subtitles follow native corrected card text/timing, not native word highlights.
head='''[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,PingFang SC,29,&H00F8FAFC,&H00F8FAFC,&H00000000,&H70070E1C,-1,0,0,0,100,100,0,0,3,1,0,2,90,90,36,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'''
def stamp(us):
 cs=round(us/10000);return f'{cs//360000}:{cs//6000%60:02}:{cs//100%60:02}.{cs%100:02}'
subs=p/'validation/review-captions.ass';cards=json.loads((p/'validation/captions.json').read_text())['cards']
subs.write_text(head+''.join(f'Dialogue: 0,{stamp(c["start"])},{stamp(c["end"])},Default,,0,0,0,,{c["text"].replace(chr(10),r"\N")}\n' for c in cards if c['text']))
graph.append(f"[{prev}]ass='{subs}'[out]");script=p/'validation/proxy-filter.txt';script.write_text(';\n'.join(graph))
args+=['-filter_complex_threads','2','-filter_complex_script',str(script),'-map','[out]','-an','-frames:v','5994','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(p/'validation/review-proxy.mp4')]
subprocess.run(args,check=True);print('Full silent review proxy ready',flush=True)
