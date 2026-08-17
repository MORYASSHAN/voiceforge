@echo off
title VoiceForge Token Server
cd /d "%~dp0"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
cd token-server
echo Starting VoiceForge Token Server on http://127.0.0.1:8000 ...
python -m uvicorn token_server:app --host 0.0.0.0 --port 8000 --reload
pause
