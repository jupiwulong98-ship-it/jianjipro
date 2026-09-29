import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cardsDir = path.join(root, "cards");
const taxonomyFile = path.join(root, "taxonomy", "card-capabilities.yaml");

const cardIds = fs.readdirSync(cardsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const text = fs.readFileSync(taxonomyFile, "utf8");
const blocks = text.split(/\n(?=  - id: )/).filter((block) => /^  - id: /m.test(block));

const entries = blocks.map((block) => {
  const id = block.match(/^  - id:\s*(.+)$/m)?.[1]?.trim();
  const family = block.match(/^    family:\s*(.+)$/m)?.[1]?.trim();
  const subtype = block.match(/^    subtype:\s*(.+)$/m)?.[1]?.trim();
  const version = block.match(/^    version:\s*(.+)$/m)?.[1]?.trim();
  return { id, family, subtype, version };
});

const errors = [];
const seen = new Set();

for (const entry of entries) {
  if (!entry.id) continue;
  if (seen.has(entry.id)) errors.push(`duplicate taxonomy entry: ${entry.id}`);
  seen.add(entry.id);
  if (!entry.family) errors.push(`${entry.id}: family missing`);
  if (!entry.subtype) errors.push(`${entry.id}: subtype missing`);
  if (!entry.version) errors.push(`${entry.id}: version missing`);
  if (!cardIds.includes(entry.id)) errors.push(`${entry.id}: taxonomy points to missing card`);
}

for (const id of cardIds) {
  if (!seen.has(id)) errors.push(`${id}: card missing taxonomy capability entry`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`validated taxonomy for ${cardIds.length} cards`);
