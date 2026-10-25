@echo off
title Autostart Removal
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_DIR%\YandexMusicBridge.lnk"

echo Removing shortcut from startup folder...
if exist "%SHORTCUT%" (
    del "%SHORTCUT%"
    echo [SUCCESS] Bridge removed from autostart! It will no longer launch automatically.
) else (
    echo [INFO] Shortcut not found in startup. It might have already been removed.
)
pause