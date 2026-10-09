import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadReferenceStyle,recommendReferenceStyle,newStyleSelection,validateStyleBindings,buildReferenceProductionBrief,readReferenceJson} from './reference-style.mjs';

const argv=process.argv.slice(2);
const value=name=>argv.includes(name) ? argv[argv.indexOf(name)+1] : null;
const input=value('--project');
if(!input) throw Error('用法: npm run style:reference -- --project ../projects/<id> [--validate] [--reset-selection]');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.resolve(input);
const from=name=>readReferenceJson(path.join(dir,name));
const output=(name,data)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n');
const selectionPath=path.join(dir,'style-selection.json');
const old=fs.existsSync(selectionPath) ? from('style-selection.json') : null;
const stylePath=old?.package_path || value('--style') || 'styles/codex-six-skills-tech-v0.1/style-package.json';
const loaded=loadReferenceStyle(root,stylePath);
const concepts=from('visual-concepts.json');
const proposals=recommendReferenceStyle(loaded,concepts);
if(argv.includes('--validate')) {
  if(!old) throw Error('先生成 style-selection.json 并审阅每条候选');
  const checked=validateStyleBindings({loaded,concepts,selection:old,edit:from('edit-plan.json'),shotbook:from('shotbook.json')});
  output('style-binding-audit.json',checked);
  output('style-production-brief.json',buildReferenceProductionBrief({loaded,concepts,selection:old,edit:from('edit-plan.json'),shotbook:from('shotbook.json')}));
  console.log('风格来源校验通过：'+checked.selected_count+' 条引用；'+checked.no_match_count+' 条保留独立导演方案');
} else {
  output('style-recommendations.json',proposals);
  if(!old || argv.includes('--reset-selection')) {
    output('style-selection.json',newStyleSelection(proposals,loaded.relativePath));
    console.log('style-selection.json 已初始化：所有镜头仍为待审，必须先选择再渲染');
  } else console.log('保留已有选择，不静默覆盖；版本变化请显式 --reset-selection');
  console.log('候选输出 style-recommendations.json');
}
