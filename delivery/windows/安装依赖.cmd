@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist "motion-library\package.json" cd /d "..\.."
where node >nul 2>nul
if errorlevel 1 goto missing_node
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 goto missing_node
cd /d "motion-library"
call npm ci
if errorlevel 1 goto failed
if not exist "runtime-talkcraft\package.json" goto done
cd /d "runtime-talkcraft"
call npm ci
if errorlevel 1 goto failed
:done
echo 安装完成。请运行“启动看板.cmd”。
echo 透明视频渲染另需 FFmpeg；请在终端确认 ffmpeg 和 ffprobe 均可调用。
pause
exit /b 0
:missing_node
echo 请先安装 Node.js 22 或更新的受支持版本，再重新运行本文件。
pause
exit /b 1
:failed
echo 安装失败，请保留窗口内的错误信息。不要把失败当成安装完成。
pause
exit /b 1
