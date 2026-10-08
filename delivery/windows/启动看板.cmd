@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist "motion-library\package.json" cd /d "..\.."
if not exist "motion-library\node_modules" (
  echo 请先运行“安装依赖.cmd”。
  pause
  exit /b 1
)
cd /d "motion-library"
echo 服务启动后，在浏览器打开 http://127.0.0.1:5201/#review
echo 使用期间保留这个窗口；关闭窗口会停止看板与意见保存服务。
call npm run dev -- --host 127.0.0.1 --port 5201 --strictPort
if errorlevel 1 (
  echo 启动失败。若提示端口占用，请先关闭原有看板窗口。
  pause
  exit /b 1
)
