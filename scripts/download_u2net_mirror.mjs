import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const url = 'https://hf-mirror.com/tomjackson2023/rembg/resolve/main/u2net.onnx';
const dir = join(homedir(), '.rembg', 'models', 'u2net');
const dest = join(dir, 'u2net.onnx');

(async () => {
  await mkdir(dir, { recursive: true });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log('attempt', attempt);
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      const s = await stat(dest);
      console.log('SAVED', dest, s.size, 'bytes');
      return;
    } catch (e) {
      console.log('fail', attempt, e.message);
    }
  }
  process.exit(1);
})();
