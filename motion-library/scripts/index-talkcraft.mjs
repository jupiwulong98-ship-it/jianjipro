import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadata = JSON.parse(fs.readFileSync(path.join(root,'vendor/talkcraft/references/cards-index.json'),'utf8'));
const adapters = JSON.parse(fs.readFileSync(path.join(root,'adapters/talkcraft/registry.json'),'utf8'));
const verificationPath=path.join(root,'adapters/talkcraft/full/verification.json');
const verified=fs.existsSync(verificationPath)?JSON.parse(fs.readFileSync(verificationPath,'utf8')):null;
for(const card of adapters){const proof=verified?.cards?.[card.slug];if(proof&&proof.render==='pass'&&proof.replacement==='pass'&&proof.adapter_sha256===crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'adapters/talkcraft',card.source))).digest('hex')&&proof.support_sha256===crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'adapters/talkcraft/full/support.tsx'))).digest('hex'))card.verification=proof;}

const ids = new Set();
const cards = metadata.cards.map(card => {
  if (ids.has(card.slug)) throw new Error(`重复模板：${card.slug}`);
  ids.add(card.slug);
  for (const file of [`vendor/talkcraft/${card.code}`,`vendor/talkcraft/references/cards/${card.slug}.md`,`public/talkcraft-demos/${card.slug}/index.html`]) {
    if (!fs.existsSync(path.join(root,file))) throw new Error(`缺少 ${file}`);
  }
  return {...card,adapter:adapters.find(a => a.slug === card.slug) ?? null,demo_url:`/talkcraft-demos/${card.slug}/index.html`};
});
for (const a of adapters) if (!ids.has(a.slug) || !fs.existsSync(path.join(root,'adapters/talkcraft',a.source))) throw new Error(`适配源码缺失：${a.slug}`);
fs.writeFileSync(path.join(root,'src/talkcraft/catalog.json'),JSON.stringify(cards,null,2)+'\n');
console.log(`已更新 ${cards.length} 张模板，${adapters.length} 张制作适配卡`);
