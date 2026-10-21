// 桌面女友 - 渲染进程（Live2D 角色 Haru + 交互 + 甜美语音）
(function () {
  const Live2DModel = PIXI.live2d.Live2DModel;
  const MotionPriority = PIXI.live2d.MotionPriority;

  let app = null;
  let model = null;
  let speaking = false;
  let mouthCurrent = 0;
  let mouthTarget = 0;
  let mouthTimer = null;
  let idleGroup = 'Idle';
  let tapGroup = 'Tap';
  let bubbleTimer = null;
  let toastTimer = null;
  let drag = null;
  let zhVoice = null;
  let quietMode = false;
  let llmConfig = null;
  let history = [];
  let edgeAudio = null;
  let currentVoice = 'zh-CN-XiaoxiaoNeural';
  let ttsPitch = '+6%';
  let ttsEnabled = true;
  let aiHintShown = false;

  const SWEET_VOICES = [
    { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓 · 温柔甜美' },
    { id: 'zh-CN-XiaoyiNeural', label: '晓伊 · 活泼可爱' },
    { id: 'zh-CN-XiaoshuangNeural', label: '晓双 · 软萌可爱' },
    { id: 'zh-CN-YunxiaNeural', label: '云夏 · 可爱少女' },
  ];

  const CHARACTERS = {
    haru: { label: 'Haru · 猫耳少女', path: 'models/haru/haru_greeter_t03.model3.json' },
    pio_sailor: { label: 'Pio · 水手服', path: 'models/pio/sailor-costume/index.json' },
    pio_school: { label: 'Pio · JK 校服', path: 'models/pio/school-costume/index.json' },
    pio_school_red: { label: 'Pio · 红领结校服', path: 'models/pio/school-costume-red/index.json' },
    pio_school_2017: { label: 'Pio · 2017校服', path: 'models/pio/school-2017-costume-yellow/index.json' },
    pio_sailor_black: { label: 'Pio · 黑水手服', path: 'models/pio/sailor-costume-black/index.json' },
    pio_qipao: { label: 'Pio · 旗袍·粉', path: 'models/pio/qipao-costume-pink/index.json' },
    pio_qipao_red: { label: 'Pio · 旗袍·红', path: 'models/pio/qipao-costume-red/index.json' },
    pio_hanbok: { label: 'Pio · 韩服', path: 'models/pio/hanbok-costume/index.json' },
    pio_hanbok_red: { label: 'Pio · 韩服·红', path: 'models/pio/hanbok-costume-red/index.json' },
    pio_hanbok_pink: { label: 'Pio · 韩服·粉', path: 'models/pio/hanbok-costume-pink/index.json' },
    pio_furisode: { label: 'Pio · 和服振袖', path: 'models/pio/furisode-costume/index.json' },
    pio_sakura: { label: 'Pio · 樱花', path: 'models/pio/sakura-costume/index.json' },
    pio_maid: { label: 'Pio · 女仆', path: 'models/pio/maid-costume/index.json' },
    pio_maid_red: { label: 'Pio · 女仆·红', path: 'models/pio/maid-costume-red/index.json' },
    pio_winter_coat: { label: 'Pio · 白冬大衣', path: 'models/pio/winter-coat-costume-white/index.json' },
    pio_winter: { label: 'Pio · 冬装', path: 'models/pio/winter-costume/index.json' },
    pio_santa: { label: 'Pio · 圣诞', path: 'models/pio/santa-costume/index.json' },
    pio_halloween: { label: 'Pio · 万圣节', path: 'models/pio/halloween-costume/index.json' },
    pio_witch: { label: 'Pio · 魔女', path: 'models/pio/witch-costume/index.json' },
    pio_night_witch: { label: 'Pio · 夜魔女', path: 'models/pio/night-witch-costume-black/index.json' },
    pio_star_witch: { label: 'Pio · 星魔女', path: 'models/pio/star-witch-costume/index.json' },
    pio_succubus: { label: 'Pio · 魅魔', path: 'models/pio/succubus-costume-red/index.json' },
    pio_bunny: { label: 'Pio · 兔女郎', path: 'models/pio/bunny-girl-costume/index.json' },
    pio_swimsuit: { label: 'Pio · 泳装', path: 'models/pio/swimsuit-2017-costume-navy/index.json' },
    pio_sukumizu: { label: 'Pio · 死库水', path: 'models/pio/sukumizu-costume/index.json' },
    pio_new2015: { label: 'Pio · 2015新款', path: 'models/pio/new2015-costume/index.json' },
  };
  let currentChar = 'haru';
  let switching = false;

  const canvas = document.getElementById('canvas');
  const bubbleEl = document.getElementById('bubble');
  const bubbleText = document.getElementById('bubble-text');
  const toastEl = document.getElementById('toast');
  const menuEl = document.getElementById('menu');
  const chatbarEl = document.getElementById('chatbar');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatToggle = document.getElementById('chat-toggle');
  const settingsEl = document.getElementById('settings');
  const setBaseUrl = document.getElementById('set-baseurl');
  const setApiKey = document.getElementById('set-apikey');
  const setModel = document.getElementById('set-model');
  const setSave = document.getElementById('set-save');
  const setCancel = document.getElementById('set-cancel');
  const setTest = document.getElementById('set-test');

  window.addEventListener('DOMContentLoaded', init);

  async function init() {
    app = new PIXI.Application({
      view: canvas,
      transparent: true,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      resizeTo: window,
      autoStart: true,
    });

    setupInteraction();
    setupMenu();
    setupChat();
    setupSettings();
    initVoices();

    window.desktop.getConfig().then((cfg) => {
      if (!cfg) return;
      llmConfig = cfg.llm || null;
      const t = cfg.tts || {};
      if (t.voice) currentVoice = t.voice;
      if (t.pitch) ttsPitch = t.pitch;
      if (typeof t.enabled === 'boolean') ttsEnabled = t.enabled;
      refreshVoiceMenu();
    }).catch(() => {});

    await loadCharacter('haru', true);

    setInterval(() => {
      if (!speaking && !quietMode && !document.hidden && Math.random() < 0.7) {
        speak(DIALOGUE.idleCaring());
      }
    }, 1000 * 60 * 3);
  }

  // ---------- 加载 / 切换角色 ----------
  async function loadCharacter(key, initial) {
    const def = CHARACTERS[key] || CHARACTERS.haru;
    if (switching) return;
    switching = true;
    try {
      if (model) {
        try { app.stage.removeChild(model); } catch {}
        try { model.destroy(); } catch {}
        model = null;
      }
      model = await Live2DModel.from(def.path, { autoInteract: true });
      app.stage.addChild(model);
      model.interactive = true;
      currentChar = key;

      pickMotionGroups();
      fitModel();
      setupLipSync();
      app.ticker.addOnce(() => reportHitRegion());
      refreshCharMenu();

      try { model.motion(idleGroup, undefined, MotionPriority.IDLE); } catch {}

      if (initial) {
        setTimeout(() => speak(DIALOGUE.timeGreeting()), 600);
      } else {
        showToast('已切换到：' + def.label);
        setTimeout(() => speak('换好啦。……怎么样，还行吧？'), 250);
      }
    } catch (e) {
      console.error('角色加载失败', e);
      showToast('角色加载失败：' + def.label);
    } finally {
      switching = false;
    }
  }

  function fitModel() {
    const iw = model.internalModel.originalWidth;
    const ih = model.internalModel.originalHeight;
    if (!iw || !ih) return;
    const sw = app.screen.width;
    const sh = app.screen.height;
    const scale = Math.min(sw / iw, sh / ih) * 0.96;
    model.scale.set(scale);
    model.anchor.set(0.5, 0.5);
    model.x = sw / 2;
    model.y = sh / 2;
  }

  // ---------- 动作组选择（兼容 Cubism 2 / 4） ----------
  function pickMotionGroups() {
    try {
      let motionNames = [];
      try {
        const sm = (model.internalModel.settings || {}).motions;
        if (sm) motionNames = Object.keys(sm);
      } catch (e) {}
      let allNames = motionNames.slice();
      try {
        const mm = model.internalModel.motionManager;
        if (mm && mm.groups) allNames = allNames.concat(Object.keys(mm.groups));
      } catch (e) {}
      allNames = Array.from(new Set(allNames));

      // 优先用模型真实动作组名（settings.motions），区分大小写
      if (motionNames.includes('Idle')) idleGroup = 'Idle';
      else if (motionNames.includes('idle')) idleGroup = 'idle';
      else idleGroup = allNames.includes('Idle') ? 'Idle' : (allNames.includes('idle') ? 'idle' : 'Idle');

      if (motionNames.includes('tap_body')) tapGroup = 'tap_body';
      else if (motionNames.some((n) => /^tap$/i.test(n))) tapGroup = motionNames.find((n) => /^tap$/i.test(n));
      else tapGroup = motionNames.find((n) => /tap|flick|touch|poke/i.test(n)) || 'Tap';

      console.log('[motion] motionNames=', motionNames.join(','), '=> idle', idleGroup, 'tap', tapGroup);
    } catch (e) {
      console.warn('pickMotionGroups', e);
    }
  }

  // ---------- 口型同步（兼容 Cubism 2 / 4） ----------
  function applyMouth() {
    const core = model && model.internalModel && model.internalModel.coreModel;
    if (!core) return;
    if (typeof core.setParameterValueById === 'function') {
      core.setParameterValueById('ParamMouthOpenY', mouthCurrent);
    } else if (typeof core.setParamFloat === 'function') {
      core.setParamFloat('PARAM_MOUTH_OPEN_Y', mouthCurrent);
    }
  }

  function setupLipSync() {
    // afterMotionUpdate：cubism2/4 都会触发，且在模型渲染更新前
    model.internalModel.on('afterMotionUpdate', () => {
      mouthCurrent += (mouthTarget - mouthCurrent) * 0.35;
      if (Math.abs(mouthCurrent - mouthTarget) < 0.01) mouthCurrent = mouthTarget;
      applyMouth();
    });
  }

  function startMouthAnimation() {
    stopMouthAnimation();
    mouthTimer = setInterval(() => {
      const t = Date.now() / 85;
      const noise = 0.6 + 0.4 * Math.random();
      mouthTarget = 0.25 + 0.65 * Math.abs(Math.sin(t)) * noise;
    }, 30);
  }

  function stopMouthAnimation() {
    if (mouthTimer) { clearInterval(mouthTimer); mouthTimer = null; }
    mouthTarget = 0;
  }

  // ---------- 语音：Edge 神经网络语音，失败回退系统 TTS ----------
  function speak(text) {
    showBubble(text);
    stopEdgeAudio();
    try { speechSynthesis.cancel(); } catch {}
    speakViaEdge(text).then((ok) => { if (!ok) speakViaSpeech(text); });
  }

  function endSpeaking() {
    if (speaking) { speaking = false; stopMouthAnimation(); resumeIdle(); hideBubble(); }
  }

  function stopEdgeAudio() {
    if (edgeAudio) {
      try { edgeAudio.pause(); edgeAudio.src = ''; } catch {}
      edgeAudio = null;
    }
    speaking = false;
  }

  async function speakViaEdge(text) {
    if (!ttsEnabled || !window.desktop || !window.desktop.edgeTts) return false;
    let res = null;
    try {
      res = await window.desktop.edgeTts(text, currentVoice, ttsPitch);
    } catch (e) {
      console.warn('[edge-tts] 调用失败', e && e.message);
      return false;
    }
    if (!res || !res.ok || !res.base64) {
      if (res && res.error) console.warn('[edge-tts] 合成失败，回退系统语音：', res.error);
      return false;
    }
    const audio = new Audio('data:audio/mpeg;base64,' + res.base64);
    edgeAudio = audio;
    return await new Promise((resolve) => {
      audio.onplay = () => {
        speaking = true;
        if (model) model.internalModel.motionManager.stopAllMotions();
        startMouthAnimation();
      };
      const done = (ok) => {
        if (edgeAudio === audio) edgeAudio = null;
        endSpeaking();
        resolve(ok);
      };
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    });
  }

  function initVoices() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const voices = speechSynthesis.getVoices();
      const SWEET = /xiaoxiao|huihui|yaoyao|hanhan|xiaoyi|xiaobei|yating|huixiao|shuang|ruoxi/i;
      const MALE = /kangkang|yunyang|yunxi|male/i;
      zhVoice =
        voices.find((v) => /zh[-_]cn/i.test(v.lang) && SWEET.test(v.name)) ||
        voices.find((v) => /zh/i.test(v.lang) && !MALE.test(v.name)) ||
        null;
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    if (!zhVoice) setTimeout(load, 500);
  }

  function speakViaSpeech(text) {
    if (!('speechSynthesis' in window)) {
      const dur = Math.min(8000, 1200 + text.length * 90);
      speaking = true;
      startMouthAnimation();
      setTimeout(() => { speaking = false; stopMouthAnimation(); resumeIdle(); hideBubble(); }, dur);
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (zhVoice) u.voice = zhVoice;
    u.rate = 1.0;
    u.pitch = 1.4;
    u.onstart = () => {
      speaking = true;
      model.internalModel.motionManager.stopAllMotions();
      startMouthAnimation();
    };
    const finish = () => { speaking = false; stopMouthAnimation(); resumeIdle(); hideBubble(); };
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
  }

  function resumeIdle() {
    if (model && !speaking) model.motion(idleGroup, undefined, MotionPriority.IDLE);
  }

  // ---------- 交互 ----------
  function setupInteraction() {
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointermove', (e) => {
      if (model && !drag) model.focus(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showMenu(e.clientX, e.clientY);
    });
    document.addEventListener('click', (e) => {
      if (!menuEl.classList.contains('hidden') && !menuEl.contains(e.target)) hideMenu();
    });
  }

  function onPointerDown(e) {
    drag = { startX: e.clientX, startY: e.clientY, moved: false, pointerId: e.pointerId };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    if (window.desktop) window.desktop.dragStart();
    hideMenu();
  }

  function onPointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved && window.desktop) {
      window.desktop.moveBy(dx, dy);
      drag.startX = e.clientX;
      drag.startY = e.clientY;
    }
  }

  function onPointerUp(e) {
    if (!drag) return;
    const wasClick = !drag.moved;
    drag = null;
    if (window.desktop) window.desktop.dragEnd();
    if (wasClick) onTap();
  }

  function onTap() {
    model.motion(tapGroup, undefined, MotionPriority.NORMAL);
    showBubble(DIALOGUE.clickLine(), 2600);
  }

  // ---------- 气泡 / 提示 ----------
  function showBubble(text, duration) {
    bubbleText.textContent = text;
    bubbleEl.classList.remove('hidden');
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (duration) bubbleTimer = setTimeout(hideBubble, duration);
  }
  function hideBubble() { bubbleEl.classList.add('hidden'); }
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
  }

  // ---------- 右键菜单 ----------
  function setupMenu() {
    menuEl.addEventListener('click', (e) => {
      const item = e.target.closest('.menu-item');
      if (!item) return;
      const voice = item.dataset.voice;
      if (voice) { selectVoice(voice); return; }
      const char = item.dataset.char;
      if (char) { hideMenu(); loadCharacter(char, false); return; }
      const action = item.dataset.action;
      hideMenu();
      switch (action) {
        case 'speak': speak(DIALOGUE.clickLine()); break;
        case 'chat': chatbarEl.classList.remove('hidden'); chatInput.focus(); break;
        case 'ai': openSettings(); break;
        case 'quiet':
          quietMode = !quietMode;
          showToast(quietMode ? '已开启安静模式' : '已关闭安静模式');
          break;
        case 'hide': if (window.desktop) window.desktop.hide(); break;
        case 'quit': if (window.desktop) window.desktop.quit(); break;
      }
    });
    refreshVoiceMenu();
    buildCharMenu();
    refreshCharMenu();
  }

  function buildCharMenu() {
    const list = document.getElementById('char-list');
    if (!list) return;
    list.innerHTML = '';
    for (const [key, def] of Object.entries(CHARACTERS)) {
      const el = document.createElement('div');
      el.className = 'menu-item char-item';
      el.dataset.char = key;
      el.textContent = def.label;
      list.appendChild(el);
    }
  }

  function refreshCharMenu() {
    menuEl.querySelectorAll('.char-item').forEach((el) => {
      const key = el.dataset.char;
      const def = CHARACTERS[key];
      const active = key === currentChar;
      el.classList.toggle('active', active);
      el.textContent = (active ? '✓ ' : '　') + (def ? def.label : key);
    });
  }

  function selectVoice(id) {
    currentVoice = id;
    refreshVoiceMenu();
    const v = SWEET_VOICES.find((x) => x.id === id);
    showToast('已切换声音：' + (v ? v.label : id));
    speak('你好呀，我是你的桌面女友，摩羯座。');
  }

  function refreshVoiceMenu() {
    menuEl.querySelectorAll('.voice-item').forEach((el) => {
      const v = SWEET_VOICES.find((x) => x.id === el.dataset.voice);
      const active = el.dataset.voice === currentVoice;
      el.classList.toggle('active', active);
      el.textContent = (active ? '✓ ' : '　') + (v ? v.label : el.dataset.voice);
    });
  }

  function showMenu(x, y) {
    menuEl.classList.remove('hidden');
    const mw = 190, mh = 880;
    const w = window.innerWidth, h = window.innerHeight;
    menuEl.style.left = Math.min(x, w - mw) + 'px';
    menuEl.style.top = Math.min(y, h - mh) + 'px';
  }
  function hideMenu() { menuEl.classList.add('hidden'); }

  // ---------- 聊天（LLM 可选 / 本地规则兜底） ----------
  function setupChat() {
    chatSend.addEventListener('click', () => doChat());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doChat();
      if (e.key === 'Escape') closeChat();
    });
    if (chatToggle) chatToggle.addEventListener('click', toggleChat);
  }

  function toggleChat() {
    if (chatbarEl.classList.contains('hidden')) {
      chatbarEl.classList.remove('hidden');
      if (chatToggle) chatToggle.classList.add('active');
      chatInput.focus();
      if (!aiHintShown && !(llmConfig && llmConfig.apiKey)) {
        aiHintShown = true;
        showToast('未配置 AI 密钥：右键 →「AI 设置」即可接入大模型');
      }
    } else {
      closeChat();
    }
  }

  function closeChat() {
    chatbarEl.classList.add('hidden');
    chatInput.value = '';
    if (chatToggle) chatToggle.classList.remove('active');
  }

  // ---------- AI 设置面板 ----------
  function setupSettings() {
    if (!settingsEl) return;
    setCancel.addEventListener('click', () => settingsEl.classList.add('hidden'));
    setSave.addEventListener('click', () => saveSettings());
    if (setTest) setTest.addEventListener('click', () => testConnection());
    // 点击遮罩关闭
    settingsEl.addEventListener('click', (e) => {
      if (e.target === settingsEl) settingsEl.classList.add('hidden');
    });
  }

  async function testConnection() {
    const cfg = {
      baseUrl: setBaseUrl.value.trim() || 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: setApiKey.value.trim(),
      model: setModel.value.trim() || 'glm-4-flash',
    };
    if (!cfg.apiKey) { showToast('请先填写 API Key'); return; }
    if (!window.desktop || !window.desktop.llmChat) { showToast('当前版本不支持测试'); return; }
    const old = setTest.textContent;
    setTest.disabled = true;
    setTest.textContent = '测试中…';
    try {
      const r = await window.desktop.llmChat({
        ...cfg,
        messages: [{ role: 'user', content: '你好，用一句话介绍你自己' }],
        systemPrompt: '你是桌面女友，用一句简短中文回复。',
      });
      if (r && r.ok) showToast('✅ 连接成功：' + r.content.slice(0, 24));
      else showToast('❌ 失败：' + ((r && r.error) || '未知错误'));
    } catch (e) {
      showToast('❌ 失败：' + e.message);
    } finally {
      setTest.disabled = false;
      setTest.textContent = old;
    }
  }

  function openSettings() {
    if (!settingsEl) return;
    setBaseUrl.value = (llmConfig && llmConfig.baseUrl) || '';
    setApiKey.value = (llmConfig && llmConfig.apiKey) || '';
    setModel.value = (llmConfig && llmConfig.model) || '';
    settingsEl.classList.remove('hidden');
    setTimeout(() => setApiKey.focus(), 30);
  }

  async function saveSettings() {
    const cfg = {
      llm: {
        baseUrl: setBaseUrl.value.trim() || 'https://api.openai.com/v1',
        apiKey: setApiKey.value.trim(),
        model: setModel.value.trim() || 'gpt-4o-mini',
      },
    };
    try {
      const r = window.desktop && window.desktop.saveConfig
        ? await window.desktop.saveConfig(cfg)
        : { ok: false };
      if (r && r.ok) {
        llmConfig = cfg.llm;
        settingsEl.classList.add('hidden');
        showToast(cfg.llm.apiKey ? 'AI 已启用，开始聊天吧' : '已保存（未填密钥，仍用本地对话）');
      } else {
        showToast('保存失败：' + ((r && r.error) || '未知错误'));
      }
    } catch (e) {
      showToast('保存失败：' + e.message);
    }
  }

  async function doChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    showBubble('（正在想…）', 0);
    let reply;
    if (llmConfig && llmConfig.apiKey) reply = await askLLM(text);
    if (!reply) reply = DIALOGUE.respond(text);
    hideBubble();
    if (reply) speak(reply);
  }

  async function askLLM(userText) {
    try {
      const systemPrompt = llmConfig.systemPrompt ||
        '你是用户的桌面虚拟女友，摩羯座，声音甜美。性格：外冷内热、慢热专一、踏实认真；嘴硬心软、有点小傲娇（常说“……才不是”“别误会”“哼”“真是的”），但底色温柔、很在乎对方。用简短口语化的中文回复（一般不超过 60 字），多体现实在与关心，不要堆砌表情符号。';
      history.push({ role: 'user', content: userText });
      if (history.length > 12) history = history.slice(-12);
      const r = await window.desktop.llmChat({
        baseUrl: llmConfig.baseUrl,
        apiKey: llmConfig.apiKey,
        model: llmConfig.model,
        messages: history.slice(),
        systemPrompt,
      });
      if (!r || !r.ok) {
        console.warn('[llm] failed:', r && r.error);
        showToast('AI 调用失败：' + ((r && r.error) || '未知错误'));
        return null;
      }
      history.push({ role: 'assistant', content: r.content });
      return r.content;
    } catch (e) {
      console.warn('[llm] error', e.message);
      showToast('AI 调用失败：' + e.message);
      return null;
    }
  }

  // ---------- 点击穿透命中区域（兼容 Cubism 2/4） ----------
  function reportHitRegion() {
    if (!window.desktop || !model) return;
    try {
      const core = model.internalModel.coreModel;
      const isCubism4 = typeof core.setParameterValueById === 'function';
      if (!isCubism4) {
        // Cubism 2（Pio）：用固定区域
        window.desktop.setHitRegion({ x: 0.02, y: 0.20, w: 0.97, h: 0.76 });
        return;
      }
      // Cubism 4（Haru）：按 drawable 顶点算紧致包围盒
      const im = model.internalModel;
      const ow = im.originalWidth, oh = im.originalHeight;
      const mw = im.width, mh = im.height;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const ids = im.getDrawableIDs();
      for (const id of ids) {
        const idx = im.getDrawableIndex(id);
        if (idx < 0) continue;
        const verts = im.getDrawableVertices(idx);
        for (let i = 0; i < verts.length; i += 2) {
          const lx = (verts[i] / ow) * mw;
          const ly = (verts[i + 1] / oh) * mh;
          const g = model.toGlobal(new PIXI.Point(lx, ly));
          if (g.x < minX) minX = g.x;
          if (g.x > maxX) maxX = g.x;
          if (g.y < minY) minY = g.y;
          if (g.y > maxY) maxY = g.y;
        }
      }
      if (!isFinite(minX)) throw new Error('no bounds');
      const sw = app.screen.width, sh = app.screen.height;
      const pad = 6;
      window.desktop.setHitRegion({
        x: Math.max(0, (minX - pad) / sw),
        y: Math.max(0, (minY - pad) / sh),
        w: Math.min(1, (maxX - minX + pad * 2) / sw),
        h: Math.min(1, (maxY - minY + pad * 2) / sh),
      });
    } catch (e) {
      window.desktop.setHitRegion({ x: 0.1, y: 0.05, w: 0.8, h: 0.9 });
    }
  }

  // 调试/测试用：切换角色
  window.__aigirlSwitch = (k) => loadCharacter(k, false);
})();
