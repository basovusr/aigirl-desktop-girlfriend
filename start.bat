@echo off
rem 桌面女友 - 双击启动
chcp 65001 >nul
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
if exist "%~dp0node_modules\electron\dist\electron.exe" (
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0"
) else (
  echo [错误] 找不到 electron.exe，请先运行 pnpm install
  pause
)
