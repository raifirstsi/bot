@echo off
setlocal
echo ========================================================
echo   RAI2 - He Dieu Hanh Doanh Nghiep Tu Hanh (rai2.si)
echo   ARTIFICIAL INTELLIGENCE + ACTUAL INTELLIGENCE
echo ========================================================

cd /d "%~dp0"

set OMB_PORT=8799
set OMB_PUBLIC_URL=https://rai2.si

echo [1/2] Khoi dong Server RAI2 tai port %OMB_PORT% (Public URL: %OMB_PUBLIC_URL%)...
start "RAI2 Enterprise Server" node --experimental-strip-types server/index.ts

timeout /t 5 /nobreak >nul

echo [2/2] Khoi dong Cloudflare Tunnel cho domain rai2.si...
cloudflared.exe tunnel --url http://127.0.0.1:%OMB_PORT%
