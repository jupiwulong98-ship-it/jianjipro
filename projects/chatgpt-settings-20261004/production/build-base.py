import json,subprocess,pathlib,concurrent.futures
p=pathlib.Path(__file__).resolve().parent
x=json.loads((p.parent/'rough-cut/after-timeline.json').read_text())
entries=[e for e in x['timeline']['entries'] if e.get('itemType')=='video' and e.get('trackAlias')=='V1']
files={'2788d4fc-5959-4454-8951-3333ea869340':'/Users/jupiwulong/Downloads/9ac428c9eed44b2099cbfdf39dae706f.MOV','ae3235fe-7f60-473e-9601-9b9e82adaf7a':'/Users/jupiwulong/Downloads/4a33841950f84a398b8974e08425bf3b.MOV'}
out=p/'assets/base-parts';out.mkdir(exist_ok=True)
def render(pair):
 i,e=pair;n=e['timelineRange']['toFrame']-e['timelineRange']['fromFrame'];dest=out/f'{i:03}.mov'
 if True:
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(e['sourceRange']['start']/1e6),'-i',files[e['asset']['id']],'-t',str(n/30),'-vf','setpts=PTS-STARTPTS,fps=30,scale=1920:1080,setsar=1','-af','aresample=48000,apad','-frames:v',str(n),'-c:v','libx264','-preset','ultrafast','-crf','22','-threads','2','-pix_fmt','yuv420p','-c:a','pcm_s16le',str(dest)],check=True)
 return i
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for count,i in enumerate(pool.map(render,enumerate(entries)),1):
  if count%10==0: print('Base',count,'/',len(entries),flush=True)
(out/'list.txt').write_text('\n'.join("file '"+str(out/f'{i:03}.mov')+"'" for i in range(len(entries))))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(out/'list.txt'),'-c:v','copy','-c:a','aac','-b:a','192k','-t',str(4475/30),'-movflags','+faststart',str(p/'assets/base.mp4')],check=True)
print('Base ready',flush=True)
