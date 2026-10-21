import {projectDir,inspect,preview,produce,review} from './core.mjs';
import {startServer} from './web.mjs';
const args=process.argv.slice(2),command=args[0],p=args.indexOf('--project'),id=p===-1?null:args[p+1];
if(!id||!['preflight','serve','produce','status'].includes(command)) {
  console.error('用法: node studio-v2/cli.mjs preflight|serve|produce|status --project <id> [--auto-produce] [--port 3038]');
  process.exit(2);
}
try{
  const dir=projectDir(id);
  if(command==='preflight')console.log(JSON.stringify(preview(dir),null,2));
  if(command==='status') {const d=inspect(dir);console.log(JSON.stringify({binding:d.binding,review:review(dir,d),duration:d.duration},null,2));}
  if(command==='produce')console.log(JSON.stringify(produce(dir),null,2));
  if(command==='serve'){
    const idx=args.indexOf('--port');const port=idx>=0?Number(args[idx+1]):3038;
    if(!Number.isInteger(port)||port<0||port>65535)throw Error('端口无效');
    startServer(dir,{port,autoProduce:args.includes('--auto-produce')});
  }
}catch(e){console.error(e.stack??e.message);process.exitCode=1;}
