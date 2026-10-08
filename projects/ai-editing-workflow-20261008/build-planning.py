import json
from pathlib import Path

root = Path(__file__).parent
transcript = json.loads((root / 'transcript/final-transcript.json').read_text())
seed = json.loads((root / 'planning-seed.json').read_text())
norm = lambda text: ''.join(text.split())
scenes, segments, concepts = [], [], []
full_screen_rules = {'input_process_output', 'one_to_many', 'comparison', 'hierarchy', 'handoff', 'conditional_sequence', 'timeline', 'before_after'}

for index, (first, last, title, rule, initial, final, difficulty, beats) in enumerate(seed, 1):
    selected = transcript['segments'][first:last + 1]
    words = [word for segment in selected for word in segment['words']]
    word_ids = [word['id'] for word in words]
    source_text = ''.join(word['text'] for word in words)
    text = ''.join(norm(word['text']) for word in words)
    char_words = [i for i, word in enumerate(words) for _ in norm(word['text'])]
    actions = []
    previous = -1
    for phrase, description in beats:
        offset = text.find(norm(phrase))
        if offset < 0:
            raise ValueError(f'{title}: missing phrase {phrase}')
        a = char_words[offset]
        b = char_words[offset + len(norm(phrase)) - 1]
        if a < previous:
            raise ValueError(f'{title}: beats out of order')
        previous = a
        actions.append({'word_id': word_ids[a], 'cue_word_ids': word_ids[a:b + 1], 'description': description})
    clean = rule == 'clean'
    scene_id = f'meaning-{index:02d}'
    concept_id = None if clean else f'visual-{index:02d}'
    presentation = 'full_screen' if rule in full_screen_rules else 'presenter_safe'
    goal = title + '：' + final
    reason = '难点：' + difficulty + '；画面补充：' + ('保留人物与原字幕，让语气承担解释。' if clean else initial + ' 随口播变化为：' + final)
    materials = '当前实拍与原字幕；无需外部素材。' if clean else '解释性示意，不能冒充真实软件操作、客户成果或性能证据。暗色工作面、白字与青黄重点；全屏关系图保留人物小窗，轻强调放实际留白；面部与现有字幕保护区需稳定帧复核。'
    scene = {'id': scene_id, 'title': title, 'mode': 'clean' if clean else 'visual', 'source_word_ids': word_ids,
             'viewer_goal': goal, 'initial_state': initial, 'actions': actions, 'final_state': final,
             'materials': materials, 'reason': reason, 'source_segment_ids': [scene_id],
             'visual_concept_id': concept_id, 'presentation': presentation}
    if rule != 'timeline':
        scene['packaging_rule'] = 'clean_presenter' if clean else rule
    scenes.append(scene)
    intent = 'process' if rule in {'sequence', 'input_process_output', 'handoff', 'conditional_sequence', 'timeline', 'one_to_many'} else ('contrast' if rule in {'comparison', 'before_after'} else ('setup' if index == 1 else 'claim'))
    role = 'clean_explanation' if clean else ('mechanism' if rule == 'one_to_many' else ('process' if intent == 'process' else ('comparison' if intent == 'contrast' else 'entity_intro')))
    segments.append({'id': scene_id, 'source_word_ids': word_ids, 'source_caption_ids': [s['id'] for s in selected],
                     'start': words[0]['start'], 'end': words[-1]['end'], 'text': source_text,
                     'primary_intent': intent, 'semantic_role': role, 'importance': .65 if clean else .85,
                     'entities': [name for name in ['AI', 'Hyperframes', 'HTML', 'Remotion', 'ChatCut', 'Claude', 'Opus'] if name in text],
                     'numbers': ['5.5'] if '5.5' in text else [], 'contrast_pair': [],
                     'rhetorical_function': title, 'emotional_intensity': .35, 'visual_evidence_useful': False,
                     'evidence_need': 'none', 'claim_status': 'speaker_claim', 'suggested_inputs': [], 'notes': reason})
    if not clean:
        structure = {'conditional_sequence': 'decision_tree', 'handoff': 'sequence'}.get(rule, rule)
        concepts.append({'event_id': concept_id, 'source_segment_ids': [scene_id], 'start': words[0]['start'],
                         'end': words[-1]['end'], 'spoken_text': source_text, 'meaning': title,
                         'visual_concept': initial + ' ' + ' '.join(a['description'] for a in actions) + ' ' + final,
                         'visual_structure': structure, 'structure_description': final, 'visual_focus': goal,
                         'presentation': presentation, 'real_asset_need': 'none', 'asset_description': materials,
                         'importance': 'high', 'evidence_need': 'none', 'claim_status': 'speaker_claim',
                         'fallback': {'strategy': 'generated_motion', 'description': '现有实现无法保留此关系时按概念生成；素材证据缺失时保留解释性示意或人物。'}, 'revision_reason': None})

documents = {
    'semantic-map.json': {'version': '0.2', 'project_id': root.name, 'source_video': 'ChatCut ' + transcript['source']['project_id'],
                          'transcript_source': 'transcript/final-transcript.json', 'transcript_revision': transcript['revision'],
                          'time_basis': 'edited_timeline', 'listening_review': 'not_verified', 'segments': segments},
    'visual-concepts.json': {'version': '0.1', 'project_id': root.name, 'source_video': 'ChatCut ' + transcript['source']['project_id'],
                             'semantic_map_source': 'semantic-map.json', 'concepts': concepts},
    'visual-planning.json': {'version': '0.1', 'project_id': root.name, 'title': 'AI剪辑流程与组件复用 · 动画包装策划',
                            'transcript_revision': transcript['revision'], 'proposal_note': '本轮 AI 画面策划，待用户确认；尚未制作或装配动画。按剪后全文覆盖28个意群，先决定关系再匹配实现，保留人物呼吸段。', 'scenes': scenes}
}
for filename, document in documents.items():
    (root / filename).write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n')
print(f'{len(scenes)} meaning scenes / {len(concepts)} visual concepts / {sum(len(s["actions"]) for s in scenes)} word-anchored actions')
