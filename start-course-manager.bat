@echo off
setlocal

cd /d "%~dp0"

echo.
echo   ====================================
echo     Aurora 课程管理中心 - 启动脚本
echo   ====================================
echo.

echo [Aurora] 正在检查 Node.js / npm ...
where npm >nul 2>nul
if errorlevel 1 (
  echo [Aurora] 未检测到 npm，请先安装 Node.js 18+ LTS。
  echo [Aurora] 下载地址：https://nodejs.org/
  timeout /t 10
  exit /b 1
)

if not exist "node_modules" (
  echo [Aurora] 首次运行，正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo [Aurora] 依赖安装失败，请检查网络或 npm 配置。
    timeout /t 10
    exit /b 1
  )
  echo [Aurora] 依赖安装完成。
)

echo [Aurora] 正在启动开发服务器...
echo [Aurora] 浏览器将自动打开可用地址（默认从 http://127.0.0.1:4200 开始）
echo [Aurora] 关闭此窗口即可停止服务。
echo.

call npm run start:open
