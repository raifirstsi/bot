@echo off
setlocal
echo ========================================================
echo   RAI2 SI - Khoi Chay He Thong Va Cloudflare Tunnel
echo ========================================================

cd /d "%~dp0"

echo [1/2] Khoi dong Server RAI2 SI tai port 8799...
start "RAI2 SI Server" node --experimental-strip-types server/index.ts

timeout /t 5 /nobreak >nul

echo [2/2] Khoi dong Cloudflare Quick Tunnel...
cloudflared.exe tunnel --url http://127.0.0.1:8799
