@echo off
setlocal

cd /d "%~dp0"

echo.
echo   ====================================
echo     Aurora 课程管理中心 - 启动脚本
echo   ====================================
echo.

:: ── Python 环境检查 ──
set "PYTHON_EXE=%~dp0.conda\python.exe"
if not exist "%PYTHON_EXE%" (
  echo [Aurora] 未找到项目内置 Python 环境 (.conda\python.exe)。
  echo [Aurora] 后端将不会启动，仅启动前端。
  goto :skip_backend
)

:: ── 数据库迁移 ──
echo [Aurora] 正在执行数据库迁移 (Alembic) ...
"%PYTHON_EXE%" -m alembic -c server\alembic.ini upgrade head
if errorlevel 1 (
  echo [Aurora] 数据库迁移失败，后端将不会启动。
  goto :skip_backend
)
echo [Aurora] 数据库迁移完成。

:: ── 检查种子数据 ──
if not exist "server\data\aurora.db" (
  echo [Aurora] 未检测到数据库文件，正在导入标准种子数据...
  "%PYTHON_EXE%" server\scripts\import_seed.py
  if errorlevel 1 (
    echo [Aurora] 种子数据导入失败，请检查 scripts/seed/output/ 目录。
  ) else (
    echo [Aurora] 种子数据导入完成。
  )
)

:: ── 启动后端 (后台) ──
echo [Aurora] 正在启动后端 API 服务器 (http://127.0.0.1:8000) ...
start "Aurora-Backend" /min "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir server
echo [Aurora] 后端已在后台启动。

:skip_backend

:: ── Node.js 环境检查 ──
echo [Aurora] 正在检查 Node.js / npm ...
where npm >nul 2>nul
if errorlevel 1 (
  echo [Aurora] 未检测到 npm，请先安装 Node.js 18+ LTS。
  echo [Aurora] 下载地址：https://nodejs.org/
  timeout /t 10
  exit /b 1
)

if not exist "node_modules" (
  echo [Aurora] 首次运行，正在安装前端依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo [Aurora] 依赖安装失败，请检查网络或 npm 配置。
    timeout /t 10
    exit /b 1
  )
  echo [Aurora] 前端依赖安装完成。
)

echo.
echo [Aurora] 正在启动前端开发服务器...
echo [Aurora] 前端: http://127.0.0.1:4200  后端: http://127.0.0.1:8000
echo [Aurora] 浏览器将自动打开前端地址
echo [Aurora] 关闭此窗口即可停止前后端服务。
echo.

call npm run start:open

:: ── 前端退出后清理后端进程 ──
echo [Aurora] 正在关闭后端服务...
taskkill /fi "WINDOWTITLE eq Aurora-Backend*" /f >nul 2>nul
echo [Aurora] 全部服务已停止。
