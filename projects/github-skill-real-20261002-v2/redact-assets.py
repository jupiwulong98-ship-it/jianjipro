"""Flatten irreversible privacy masks into source PNGs BEFORE animation.
Originals stay in V1; public_dir contains only sanitized copies.
"""
import json,pathlib,subprocess,hashlib
p=pathlib.Path(__file__).parent; raw=p.parent/'github-skill-real-20261002/assets'; out=p/'assets'; masks={
'signup.png':[],
'search-codex.png':[[330,145,1070,34],[330,270,1070,34],[330,429,990,35],[330,550,1060,39],[330,710,1060,42],[330,865,1060,39],[330,985,1060,44]],
'search-ppt.png':[[320,133,1180,947],[1500,74,420,1006]],
'search-awesome.png':[[330,144,1050,35],[330,302,1050,35],[330,459,1050,35],[330,617,1050,35],[330,775,1050,35],[330,933,1050,35],[1502,128,405,220]],
'readme-body.png':[[350,70,930,510],[350,20,300,48],[1280,0,640,1080],[383,655,850,59],[383,729,850,57],[383,1035,850,45]],
}
records=[]
for name,boxes in masks.items():
 src=raw/name;dst=out/name
 filters=','.join(f'drawbox=x={x}:y={y}:w={w}:h={h}:color=0x58616f:t=fill' for x,y,w,h in boxes)
 args=['ffmpeg','-v','error','-y','-i',str(src)]
 if filters:args+=['-vf',filters]
 args+=['-frames:v','1',str(dst)];subprocess.run(args,check=True)
 records.append({'file':name,'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'sanitized_sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'rectangles':boxes,'method':'opaque_pixel_masks_flattened_into_png','width':1920,'height':1080})
# Derived document viewport uses only already-sanitized pixels; the file table is never animated.
derived=out/'readme-visible.png'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'readme-body.png'),'-vf','crop=905:285:355:795','-frames:v','1',str(derived)],check=True)
records.append({'file':'readme-visible.png','source_sha256':hashlib.sha256((out/'readme-body.png').read_bytes()).hexdigest(),'sanitized_sha256':hashlib.sha256(derived.read_bytes()).hexdigest(),'rectangles':[],'method':'crop_of_flattened_sanitized_source','derived_from':'readme-body.png','crop':[355,795,905,285],'width':905,'height':285})
# Unused raw screenshot cannot remain in the renderer's public asset directory.
(out/'readme.png').unlink(missing_ok=True)
json.dump({'version':1,'policy':'网页链接、仓库地址、具体 Skill 名称先打码，再做动画；画面不显示来源脚注。','status':'pixels_redacted_pending_visual_readback','assets':records},open(p/'validation/redaction.json','w'),ensure_ascii=False,indent=2)
print('5 张截图已在动画前形成不可逆打码源文件；渲染资产目录无原始截图')
