import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadata = JSON.parse(fs.readFileSync(path.join(root,'vendor/talkcraft/references/cards-index.json'),'utf8'));
const adapters = JSON.parse(fs.readFileSync(path.join(root,'adapters/talkcraft/registry.json'),'utf8'));
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
