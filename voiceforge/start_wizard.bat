@echo off
title VoiceForge Setup Wizard
cd /d "%~dp0"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
python cli/wizard.py
pause
