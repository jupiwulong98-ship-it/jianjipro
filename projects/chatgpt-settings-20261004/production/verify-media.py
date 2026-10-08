import json,subprocess,pathlib,hashlib
p=pathlib.Path(__file__).resolve().parent
probe=lambda file:json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
def verify(file,frames,audio=None,alpha=None):
 x=probe(file);v=next(s for s in x['streams'] if s['codec_type']=='video');hasaudio=any(s['codec_type']=='audio' for s in x['streams']);assert int(v['nb_frames'])==frames,(str(file),v.get('nb_frames'),frames);assert (v['width'],v['height'])==(1920,1080);assert v['r_frame_rate']=='30/1'
 if audio is not None:assert hasaudio==audio
 if alpha:assert v['codec_name']=='prores' and v['pix_fmt'].startswith('yuva')
 return {'file':str(file),'frames':frames,'dimensions':[1920,1080],'fps':30,'audio':hasaudio,'pixel_format':v['pix_fmt'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
checks=[verify(p/'assets/base.mp4',4475,True)]
delivery=json.loads((p/'delivery.json').read_text())
for clip in delivery['clips']:
 checks.append(verify(pathlib.Path(clip['file']),clip['duration_frames'],False,clip['alpha']));clip['source_in_frames']=0;clip['placement']={'left':0,'top':0,'width':1920,'height':1080};clip['verified_media']=True
if (p/'candidate.mp4').exists() and '--candidate' in __import__('sys').argv:checks.append(verify(p/'candidate.mp4',4475,True))
(p/'delivery.json').write_text(json.dumps(delivery,ensure_ascii=False,indent=2)+'\n');(p/'validation/media-check.json').write_text(json.dumps({'status':'pass','checks':checks,'scope':'帧数/画幅/音轨/透明格式；不是动态审片或听音验收'},ensure_ascii=False,indent=2)+'\n');print('Verified',len(checks),'media files')
