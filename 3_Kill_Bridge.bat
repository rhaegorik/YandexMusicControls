@echo off
title Kill Yandex Music Bridge
echo Stopping Yandex Music Bridge...

:: Убиваем скрытый VBS-скрипт
taskkill /F /IM wscript.exe >nul 2>&1

:: Убиваем процесс PowerShell, который держит трей и мост
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name = 'powershell.exe'\" | Where-Object { $_.CommandLine -match 'YandexMusic' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1

echo Bridge stopped.
timeout /t 2 >nul
