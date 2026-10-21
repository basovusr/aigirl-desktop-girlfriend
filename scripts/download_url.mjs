import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const url = process.argv[2];
const dest = process.argv[3];
if (!url || !dest) { console.error('usage: node download_url.mjs <url> <dest>'); process.exit(1); }

(async () => {
  await mkdir(join(dest, '..'), { recursive: true });
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  const s = await stat(dest);
  console.log('SAVED', dest, s.size, 'bytes');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
