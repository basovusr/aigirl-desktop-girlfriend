import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import https from 'node:https';

const name = process.argv[2] || 'sailor-costume';
const BASE = 'https://cdn.jsdelivr.net/npm/yzs-live2d_src@1.1.0';
const OUT = 'F:/aigirl/renderer/models/pio';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' ' + url));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

const flat = JSON.parse((await get('https://data.jsdelivr.com/v1/packages/npm/yzs-live2d_src@1.1.0?structure=flat')).toString()).files.map((f) => f.name);
const prefix = '/model/Pio/' + name + '/';
const targets = flat.filter((f) => f.startsWith(prefix));
if (!targets.length) { console.error('no files for', name); process.exit(1); }
for (const t of targets) {
  const url = BASE + t;
  const dest = join(OUT, t.replace('/model/Pio/', ''));
  const buf = await get(url);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  console.log('saved', t);
}
console.log('done', targets.length);
