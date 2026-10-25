@echo off
title Autostart Installation
set "SCRIPT_DIR=%~dp0"
set "VBS_PATH=%SCRIPT_DIR%StartHidden.vbs"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_DIR%\YandexMusicBridge.lnk"

if not exist "%VBS_PATH%" (
    echo [ERROR] StartHidden.vbs not found in this folder!
    echo Make sure you put this .bat file in the same folder as the plugin scripts.
    pause
    exit /b
)

echo Creating shortcut in startup folder...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%VBS_PATH%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"

if exist "%SHORTCUT%" (
    echo [SUCCESS] Bridge added to autostart! It will now launch with Windows.
) else (
    echo [ERROR] Failed to create shortcut. Try running this file as Administrator.
)
pause