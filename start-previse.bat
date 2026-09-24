@echo off
title Previse - start servers
rem Double-click this file to (re)start everything Previse needs.
rem Opens 2 windows: backend API on :3001 and UI on :3000. Keep both open.
cd /d %~dp0
echo Stopping any old Previse servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting backend :3001 ...
start "Previse backend :3001" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 4 /nobreak >nul
echo Starting UI :3000 ...
start "Previse UI :3000" cmd /k "cd /d %~dp0 && npm run dev"
echo.
echo Done. Open http://localhost:3000/connect
echo Keep both black windows open while using the app.
pause
