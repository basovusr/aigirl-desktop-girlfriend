# 桌面女友 · Live2D 虚拟伴侣

一个常驻桌面的 Live2D 虚拟女友：透明置顶窗口、可换角色、会眨眼呼吸、能聊天说话。

支持 **27 个角色形象**（Haru 猫耳少女 + 26 套 Pio 服装）、**4 种甜美声音**、**AI 实时对话**（兼容 OpenAI 接口）。

## 功能特性

- 🪟 **透明置顶窗口**：无边框、透明背景、始终置顶、不抢焦点。
- 🖱️ **动态点击穿透**：角色区域可交互，透明区域鼠标穿透到桌面。
- ✋ **拖拽与位置记忆**：拖到桌面任意位置，重启后恢复。
- 👁️ **Live2D 动画**：眨眼、呼吸、发丝物理、待机动作、点击反应、口型同步。
- 🎭 **27 个角色**：右键「换角色」随时切换（Haru + 26 套 Pio 服装）。
- 🎙️ **甜美语音**：微软 Edge 神经网络语音（晓晓/晓伊/晓双/云夏），可切换。
- 🧠 **AI 对话**：右键「AI 设置」填入 API Key，即可让 AI 实时回复；不填则用本地规则对话（傲娇+温柔人设）。
- 🎀 **右键菜单**：说句话 / 聊天 / AI 设置 / 换角色 / 换声音 / 安静模式 / 隐藏 / 退出。
- 🗂️ **托盘图标**：显示/隐藏、退出。

## 快速开始

**方式一：双击 `start.bat`**

**方式二：命令行**
```bash
pnpm install     # 首次
pnpm start       # 或 npm start
```

> 依赖已随项目安装好时，直接双击 `start.bat` 即可。

## 操作指南

详细操作见 [GUIDE.md](GUIDE.md)。

## 目录结构

```
aigirl/
├─ start.bat              双击启动
├─ package.json
├─ config.example.json    AI 配置模板（不含密钥）
├─ electron/
│  ├─ main.cjs            主进程：透明窗口、点击穿透、拖拽、托盘、Edge TTS、AI 请求
│  └─ preload.cjs
├─ renderer/
│  ├─ index.html
│  ├─ app.js              渲染：Live2D 加载、动作、口型、交互、菜单、AI
│  ├─ dialogue.js         本地规则对话（摩羯座 · 傲娇+温柔）
│  ├─ style.css
│  ├─ vendor/             PixiJS + Live2D Cubism 2/4 运行时（本地化）
│  └─ models/
│     ├─ haru/            Haru 猫耳少女（Cubism 4）
│     ├─ pio/             Pio 26 套服装（Cubism 2）
│     └─ shizuku/sounds/  点击反馈语音
└─ scripts/               模型下载 / 图标生成 / 抠像脚本
```

## 技术栈

- **Electron**：透明窗口、无边框、置顶、动态点击穿透。
- **PixiJS v6 + pixi-live2d-display**：Live2D Cubism 2/4 渲染与交互。
- **Live2D Cubism Core 5.1 / Live2D 2.1 Runtime**：模型运行时。
- **msedge-tts**：微软 Edge 神经网络语音（甜美中文女声）。
- **Web Speech API**：系统 TTS 兜底。
- **OpenAI 兼容接口**：可接 DeepSeek / 智谱 / 通义 / Kimi 等。

## 模型授权

- **Haru**：来自 [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) 测试资产，依据 Live2D Free Material License 再分发。
- **Pio 及服装**：来自 [yzs-live2d_src](https://github.com/yzs020220/live2d_api)（MIT License）。
- 商用前请逐项核对各模型的具体授权条款。

## 常见问题

- **AI 不回话/报错**：右键「AI 设置」→「测试连接」，会显示真实错误（如 401 密钥无效）。
- **语音生硬**：断网时会回退系统语音；联网时用 Edge 神经网络语音。
- **看不到角色**：可能被拖出屏幕，托盘图标点「显示/隐藏」可唤回。
- **Edge TTS 429**：请求过多被限流，等几秒或自动回退系统语音。

## License

代码部分 MIT。模型资产遵循各自上游许可（见上）。
