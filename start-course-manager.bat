@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║      Aurora 课程管理中心 - 一键启动脚本                    ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

:: ── Python 环境检查 ──
set "PYTHON_EXE=%~dp0.conda\python.exe"
echo [初始化] 检查 Python 环境...
if not exist "%PYTHON_EXE%" (
  echo [初始化] ⚠  未找到项目内置 Python 环境 (.\.conda\python.exe)
  echo [初始化] ⚠  后端将不会启动，仅启动前端。
  echo.
  goto :skip_backend
)
echo [初始化] ✓ Python 环境就绪：%PYTHON_EXE%

:: ── 数据库迁移 ──
echo [初始化] 执行数据库迁移...
"%PYTHON_EXE%" -m alembic -c server\alembic.ini upgrade head
if errorlevel 1 (
  echo [初始化] ⚠  数据库迁移失败，后端将不会启动。
  echo.
  goto :skip_backend
)
echo [初始化] ✓ 数据库迁移完成

:: ── 检查种子数据 ──
if not exist "server\data\aurora.db" (
  echo [初始化] 未检测到数据库，正在导入种子数据...
  "%PYTHON_EXE%" server\scripts\import_seed.py
  if errorlevel 1 (
    echo [初始化] ⚠  种子数据导入失败，请检查 scripts/seed/output/ 目录。
  ) else (
    echo [初始化] ✓ 种子数据导入完成
  )
) else (
  echo [初始化] ✓ 数据库文件已存在
)

:: ── 启动后端 (后台) ──
echo.
echo [启动中] 启动后端 API 服务器...
start "Aurora-Backend" "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir server
echo [启动中] 后端已在后台启动，正在检查连接...

:: ── 等待后端启动（最多20秒）──
setlocal enabledelayedexpansion
set "BACKEND_READY=0"
for /L %%i in (1,1,20) do (
  if !BACKEND_READY! equ 0 (
    :: 使用 PowerShell 测试后端端口是否可用
    powershell -Command "try { [System.Net.Sockets.TcpClient]::new('127.0.0.1', 8000).Dispose(); exit 0 } catch { exit 1 }" >nul 2>nul
    if errorlevel 1 (
      timeout /t 1 /nobreak >nul
    ) else (
      set "BACKEND_READY=1"
    )
  )
)
if !BACKEND_READY! equ 0 (
  echo [启动中] ⚠  后端启动超时或连接失败。
  echo [启动中] ⚠  前端仍会启动，但 API 功能可能不可用。
  echo [启动中] 提示：请检查后端进程或查看 8000 端口是否被占用。
  echo.
  timeout /t 2
) else (
  echo [启动中] ✓ 后端已就绪（127.0.0.1:8000）！
)
endlocal

:skip_backend

:: ── Node.js 环境检查 ──
echo.
echo [初始化] 检查 Node.js / npm...
where npm >nul 2>nul
if errorlevel 1 (
  echo [初始化] ✗ 未找到 npm，请先安装 Node.js 18+ LTS
  echo [初始化] 下载地址：https://nodejs.org/
  echo.
  timeout /t 5
  exit /b 1
)
echo [初始化] ✓ npm 环境就绪

:: ── 检查并安装依赖 ──
if not exist "node_modules" (
  echo [初始化] 首次运行，正在安装前端依赖...
  call npm install
  if errorlevel 1 (
    echo [初始化] ✗ 依赖安装失败，请检查网络或 npm 配置
    echo.
    timeout /t 5
    exit /b 1
  )
  echo [初始化] ✓ 前端依赖安装完成
) else (
  echo [初始化] ✓ 依赖已就绪
)

echo.
echo [启动中] 启动前端开发服务器...

call npm run start:open

:: ── 前端退出后清理后端进程 ──
echo.
echo [关闭中] 正在停止所有服务...
taskkill /fi "WINDOWTITLE eq Aurora-Backend*" /f >nul 2>nul
echo [关闭中] ✓ 所有服务已停止。
echo.
timeout /t 2
