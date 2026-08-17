@echo off
title VoiceForge Agent Worker
cd /d "%~dp0"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
cd agent
echo Starting VoiceForge LiveKit Agent Worker ...
python main.py dev
pause
