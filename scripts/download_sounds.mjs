import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = 'https://raw.githubusercontent.com/guansss/pixi-live2d-display/master/test/assets';
const files = [
  ['shizuku/sounds/flickHead_00.mp3', 'F:/aigirl/renderer/models/shizuku/sounds/flickHead_00.mp3'],
  ['shizuku/sounds/flickHead_01.mp3', 'F:/aigirl/renderer/models/shizuku/sounds/flickHead_01.mp3'],
];
for (const [rel, dest] of files) {
  const res = await fetch(`${BASE}/${rel}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${rel}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(join(dest, '..'), { recursive: true });
  await writeFile(dest, buf);
  console.log(`OK ${buf.length}  ${rel}`);
}
