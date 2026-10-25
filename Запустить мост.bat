@echo off
title Yandex Music Bridge
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "YandexMusicBridge.ps1"
pause