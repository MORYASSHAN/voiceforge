@echo off
title VoiceForge Launcher
cd /d "%~dp0"

echo ========================================================
echo               VOICEFORGE ALL-IN-ONE LAUNCHER
echo ========================================================
echo.
echo Launching Token Server in a new window...
start "VoiceForge Token Server" cmd /k "call start_token_server.bat"

echo Launching Agent Worker in a new window...
start "VoiceForge Agent Worker" cmd /k "call start_agent.bat"

echo Launching Web Frontend in a new window...
start "VoiceForge Web UI" cmd /k "call start_web.bat"

echo.
echo ========================================================
echo Services started!
echo - Web UI:       http://localhost:3000
echo - Token Server: http://localhost:8000
echo - Agent Worker: connects to LiveKit directly (no local port)
echo ========================================================
echo.
pause
