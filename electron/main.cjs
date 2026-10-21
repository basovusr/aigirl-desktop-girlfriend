// 桌面女友 - Electron 主进程
// 透明、无边框、置顶、动态点击穿透、拖拽与位置记忆
const { app, BrowserWindow, ipcMain, screen, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

let tray = null;

let win = null;
let hitRegion = { x: 0.05, y: 0.1, w: 0.9, h: 0.9 }; // 相对窗口归一化矩形
let dragging = false;
let pollingTimer = null;
let screenshotMode = process.argv.includes('--screenshot');

const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch {
    return null;
  }
}

function saveState() {
  try {
    if (!win) return;
    const [x, y] = win.getPosition();
    fs.writeFileSync(stateFile(), JSON.stringify({ x, y }));
  } catch {}
}

function createWindow() {
  const state = loadState();
  const opts = {
    width: 720,
    height: 1000,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    useContentSize: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  };
  if (state && Number.isFinite(state.x) && Number.isFinite(state.y)) {
    opts.x = state.x;
    opts.y = state.y;
  }

  win = new BrowserWindow(opts);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // 尺寸变大后，确保窗口不跑出屏幕
  try {
    const disp = screen.getPrimaryDisplay();
    const work = disp.workArea;
    const [cx, cy] = win.getPosition();
    const [cw, ch] = win.getSize();
    const nx = Math.max(work.x, Math.min(cx, work.x + work.width - cw));
    const ny = Math.max(work.y, Math.min(cy, work.y + work.height - ch));
    if (nx !== cx || ny !== cy) win.setPosition(nx, ny);
  } catch (e) {
    console.warn('clamp position failed', e.message);
  }

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  // 转发渲染进程日志，便于排查
  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log('[renderer]', message);
  });

  createTray();

  // 拖拽时临时关闭穿透
  win.on('closed', () => {
    win = null;
  });

  startClickThroughPolling();

  if (screenshotMode) {
    win.webContents.once('did-finish-load', () => {
      // 等模型加载与首帧渲染
      setTimeout(async () => {
        if (process.argv.includes('--test-switch')) {
          try {
            const cnt = await win.webContents.executeJavaScript('document.querySelectorAll(".char-item").length');
            console.log('char items:', cnt);
            await win.webContents.executeJavaScript('window.__aigirlSwitch && window.__aigirlSwitch("pio_qipao")');
            await new Promise((r) => setTimeout(r, 5000));
          } catch (e) { console.error('switch test failed', e); }
        }
        captureScreenshot();
      }, 8000);
    });
  }
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'assets', 'tray.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error('empty icon');
    tray = new Tray(icon);
    tray.setToolTip('桌面女友');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '显示 / 隐藏', click: () => toggleWindow() },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() },
    ]));
    tray.on('click', () => toggleWindow());
  } catch (e) {
    console.error('tray create failed', e.message);
  }
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else win.show();
}

function startClickThroughPolling() {
  if (pollingTimer) clearInterval(pollingTimer);
  pollingTimer = setInterval(() => {
    if (!win || win.isDestroyed() || dragging) return;
    const cursor = screen.getCursorScreenPoint();
    const [wx, wy] = win.getPosition();
    const [ww, wh] = win.getSize();
    const relX = cursor.x - wx;
    const relY = cursor.y - wy;
    const inWindow = relX >= 0 && relY >= 0 && relX < ww && relY < wh;
    let overCharacter = false;
    if (inWindow) {
      const rx = relX / ww;
      const ry = relY / wh;
      overCharacter =
        rx >= hitRegion.x && rx <= hitRegion.x + hitRegion.w &&
        ry >= hitRegion.y && ry <= hitRegion.y + hitRegion.h;
    }
    win.setIgnoreMouseEvents(!overCharacter, { forward: true });
  }, 50);
}

async function captureScreenshot() {
  try {
    if (!win) return;
    const image = await win.webContents.capturePage();
    const out = path.join(__dirname, '..', 'preview.png');
    fs.writeFileSync(out, image.toPNG());
    console.log('SCREENSHOT_SAVED ' + out);
  } catch (e) {
    console.error('SCREENSHOT_FAIL', e);
  } finally {
    setTimeout(() => app.quit(), 200);
  }
}

// ---------- IPC ----------
ipcMain.on('set-hit-region', (e, r) => {
  if (r && Number.isFinite(r.x) && Number.isFinite(r.w)) {
    hitRegion = { x: r.x, y: r.y, w: r.w, h: r.h };
  }
});

ipcMain.on('drag-start', () => {
  dragging = true;
  if (win) win.setIgnoreMouseEvents(false);
});

ipcMain.on('drag-end', () => {
  dragging = false;
  saveState();
});

ipcMain.on('move-to', (e, x, y) => {
  if (win && Number.isFinite(x) && Number.isFinite(y)) {
    win.setPosition(Math.round(x), Math.round(y));
  }
});

ipcMain.on('move-by', (e, dx, dy) => {
  if (win && Number.isFinite(dx) && Number.isFinite(dy)) {
    const [x, y] = win.getPosition();
    win.setPosition(x + Math.round(dx), y + Math.round(dy));
  }
});

ipcMain.on('save-position', () => saveState());

ipcMain.on('quit', () => app.quit());

ipcMain.on('hide', () => {
  if (win) win.hide();
});

ipcMain.on('show', () => {
  if (win) win.show();
});

ipcMain.handle('open-external', (e, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) shell.openExternal(url);
});

// 读取可选的配置（config.json 与主程序同目录）
ipcMain.handle('get-config', () => {
  try {
    const p = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.error('config read failed', e.message);
  }
  return {};
});

// 保存 AI 配置到 config.json
ipcMain.handle('save-config', (e, cfg) => {
  try {
    const p = path.join(__dirname, '..', 'config.json');
    let merged = {};
    if (fs.existsSync(p)) {
      try { merged = JSON.parse(fs.readFileSync(p, 'utf8')) || {}; } catch {}
    }
    if (cfg && cfg.llm) merged.llm = Object.assign(merged.llm || {}, cfg.llm);
    if (cfg && cfg.tts) merged.tts = Object.assign(merged.tts || {}, cfg.tts);
    fs.writeFileSync(p, JSON.stringify(merged, null, 2), 'utf8');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// 主进程调用 AI（无 CORS，密钥不进渲染层）
ipcMain.handle('llm-chat', async (e, payload) => {
  const { baseUrl, apiKey, model, messages, systemPrompt } = payload || {};
  if (!apiKey) return { ok: false, error: '未填写 API Key' };
  try {
    const url = String(baseUrl || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/+$/, '') + '/chat/completions';
    const list = [];
    if (systemPrompt) list.push({ role: 'system', content: systemPrompt });
    if (Array.isArray(messages)) list.push(...messages);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({ model: model || 'glm-4-flash', messages: list, temperature: 0.9, max_tokens: 220 }),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    if (!res.ok) {
      const msg = (data && data.error && (data.error.message || data.error.code)) || text.slice(0, 200) || ('HTTP ' + res.status);
      return { ok: false, status: res.status, error: msg };
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) return { ok: false, error: '接口返回为空' };
    return { ok: true, content: String(content).trim() };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// Edge 神经网络 TTS（甜美自然、免费、需联网），返回 MP3 base64
function ttsLog(line) {
  try { fs.appendFileSync(path.join(__dirname, '..', 'tts.log'), line + '\n'); } catch {}
}

ipcMain.handle('edge-tts', async (e, text, voiceName, pitch) => {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'empty text' };
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voiceName || 'zh-CN-XiaoxiaoNeural',
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );
    const opts = { rate: 1.0 };
    if (pitch) opts.pitch = pitch;
    const dir = app.getPath('temp');
    const { audioFilePath } = await tts.toFile(dir, text, opts);
    const buf = fs.readFileSync(audioFilePath);
    try { fs.unlinkSync(audioFilePath); } catch {}
    ttsLog(`OK bytes=${buf.length} voice=${voiceName || 'default'} text=${text.slice(0, 12)}`);
    return { ok: true, base64: buf.toString('base64'), mime: 'audio/mpeg' };
  } catch (err) {
    ttsLog(`FAIL voice=${voiceName || 'default'} err=${(err && err.message) || err}`);
    return { ok: false, error: String((err && err.message) || err) };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
