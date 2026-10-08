"""Build a customer package from tracked allowlisted files, without personal projects."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
DEST = Path(sys.argv[1]).resolve()
if DEST.exists():
    raise SystemExit('Destination already exists; use a new folder to preserve prior packages.')
DEST.mkdir(parents=True)
prefixes = ('motion-library/', 'skills/', 'bindings/', 'asset-workspace/',
            'motion-specs/', 'styles/', 'references/', 'projects/talkcraft-integration-smoke/')
excluded = ('motion-library/public/review-projects/',
            'motion-library/docs/superpowers/',
            'motion-library/src/review/project.json',
            'motion-library/scripts/seed-review-project.py',
            'motion-library/tests/project-review.test.tsx',
            'projects/talkcraft-integration-smoke/VERIFICATION.md')
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
for name in tracked:
    if not name or not (name == 'AGENTS.md' or name.startswith(prefixes)) or name.startswith(excluded):
        continue
    target = DEST / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / name, target)

project = json.loads((ROOT / 'motion-library/src/review/project.json').read_text())
project.update(id='customer-demo', title='客户口播示例', durationFrames=450,
               captionCount=3, clipCount=3, snapshotDate='2026-10-01',
               styleLabel='示例方案 · 待确认', chatcutProjectId='',
               provenance='虚构文案和示意画面，仅用于体验审阅流程；尚未导入客户实拍视频。')
project['assets'] = []
project['shots'] = []
examples = [('主题介绍', '今天分享一个实用方法。', 'split-text-stagger'),
            ('重点强调', '先明确目标，再选择工具。', 'keyword-pop-highlight'),
            ('总结观点', '先做出结果，再逐步调整。', 'quote-hold-arrow')]
media = DEST / 'motion-library/public/review-projects/customer-demo'
media.mkdir(parents=True)
for i, (title, text, template) in enumerate(examples):
    shot = dict(json.loads((ROOT / 'motion-library/src/review/project.json').read_text())['shots'][0])
    shot.update(id=f'demo-{i+1}', title=title, startFrame=i*150, endFrame=(i+1)*150,
                intent=title, reason='示例建议，请替换为真实口播的语义规划和包装理由。',
                ruleIds=[], templateIds=[template], caption=text, transcript=text,
                assetIds=[], attention=['这是虚构示例，实际视频需重新初剪、规划和确认。'],
                originalShotIds=[], preview=f'/review-projects/customer-demo/scene-{i+1}.svg')
    project['shots'].append(shot)
    (media / f'scene-{i+1}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">'
        f'<rect width="1280" height="720" fill="#161b25"/><rect x="100" y="180" width="18" height="300" fill="#22d3ee"/>'
        f'<text x="160" y="310" fill="white" font-family="sans-serif" font-size="54">{title}</text>'
        f'<text x="160" y="390" fill="#d3d8e2" font-family="sans-serif" font-size="34">{text}</text>'
        f'<text x="160" y="490" fill="#7e8b9e" font-family="sans-serif" font-size="28">示意画面 · 非真实视频</text></svg>', encoding='utf-8')
(DEST / 'motion-library/src/review/project.json').write_text(json.dumps(project, ensure_ascii=False, indent=2)+'\n')
board = DEST / 'motion-library/src/review/ProjectBoard.tsx'
content = board.read_text().replace('真实口播 · 旧方案占位', '演示项目 · 未导入客户素材').replace('旧 v2 参考帧', '示例占位画面').replace('已有包装的合成参考，供本轮讨论；还不是新的确认版本。', '虚构示例，仅体验审阅流程；尚未导入客户实拍视频。')
board.write_text(content)
for name in ('安装依赖.cmd', '启动看板.cmd'):
    text = (ROOT / 'delivery/windows' / name).read_text()
    (DEST / name).write_bytes(text.replace('\n', '\r\n').encode('utf-8'))
(DEST / 'projects/talkcraft-integration-smoke/SOURCES.md').write_text('''# 能力测试素材

示例图标和官网截图仅用于渲染测试，不代表客户真实素材。

- HyperFrames：https://www.hyperframes.dev/
- Remotion：https://www.remotion.dev/
- ChatCut：随示例保留的应用标识，使用时核对客户实际应用与品牌规范。

文案为测试说明；未导入任何客户 ChatCut 项目。
''', encoding='utf-8')
for path in DEST.rglob('*'):
    if not path.is_file() or path.suffix not in {'.md', '.json', '.yaml', '.ts', '.tsx', '.mjs', '.py', '.html'}:
        continue
    text = path.read_text(encoding='utf-8')
    if '/Users/jupiwulong' in text or '81892e72-e13e-4a96-a827-90f8162794d1' in text:
        raise SystemExit(f'Personal reference detected: {path.relative_to(DEST)}')
print(f'Prepared {DEST}')

# Generate ZIP only when invoked after verification; MANIFEST includes all delivered files.
def archive(folder):
    files = sorted(p for p in folder.rglob('*') if p.is_file())
    manifest = {str(p.relative_to(folder)).replace('\\','/'): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    (folder/'MANIFEST.sha256.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    output = folder.with_suffix('.zip')
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file():
                z.write(p, str(Path(folder.name)/p.relative_to(folder)))
    return output
