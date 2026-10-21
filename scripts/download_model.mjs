// Download Haru Live2D model (Live2D Free Material License) + Cubism 4 core
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = 'F:/aigirl/renderer/models/haru';
const BASE = 'https://raw.githubusercontent.com/guansss/pixi-live2d-display/master/test/assets/haru';

const files = [
  'haru_greeter_t03.model3.json',
  'haru_greeter_t03.moc3',
  'haru_greeter_t03.physics3.json',
  'haru_greeter_t03.pose3.json',
  'haru_greeter_t03.2048/texture_00.png',
  'haru_greeter_t03.2048/texture_01.png',
  'expressions/F01.exp3.json',
  'expressions/F02.exp3.json',
  'expressions/F03.exp3.json',
  'expressions/F04.exp3.json',
  'expressions/F05.exp3.json',
  'expressions/F06.exp3.json',
  'expressions/F07.exp3.json',
  'expressions/F08.exp3.json',
  'motion/haru_g_idle.motion3.json',
  'motion/haru_g_m05.motion3.json',
  'motion/haru_g_m07.motion3.json',
  'motion/haru_g_m14.motion3.json',
  'motion/haru_g_m15.motion3.json',
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf.length;
}

let total = 0;
for (const f of files) {
  const url = `${BASE}/${f}`;
  const dest = join(ROOT, f);
  const n = await download(url, dest);
  total += n;
  console.log(`OK ${n.toString().padStart(8)}  ${f}`);
}

// Cubism 4 core (global Live2DCubismCore)
const coreDest = 'F:/aigirl/renderer/vendor/live2dcubismcore.min.js';
const coreN = await download('https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js', coreDest);
total += coreN;
console.log(`OK ${coreN.toString().padStart(8)}  live2dcubismcore.min.js`);

console.log(`\nDONE total bytes: ${total}`);
