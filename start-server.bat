@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo   RAI2 - He Dieu Hanh Doanh Nghiep Tu Hanh (rai2.si)
echo   ARTIFICIAL INTELLIGENCE + ACTUAL INTELLIGENCE
echo ========================================================

cd /d "%~dp0"

set OMB_PORT=8799
set OMB_PUBLIC_URL=https://rai2.si

echo [1/2] Khoi dong Server RAI2 tai port %OMB_PORT% (Public URL: %OMB_PUBLIC_URL%)...
start "RAI2 Enterprise Server" node --experimental-strip-types server/index.ts

timeout /t 3 /nobreak >nul

set TUNNEL_TOKEN=
if exist "%~dp0tunnel-token.txt" (
  set /p TUNNEL_TOKEN=<"%~dp0tunnel-token.txt"
)
if "%CLOUDFLARE_TUNNEL_TOKEN%" neq "" (
  set TUNNEL_TOKEN=%CLOUDFLARE_TUNNEL_TOKEN%
)

if "%TUNNEL_TOKEN%" neq "" (
  echo [2/2] Ket noi Named Cloudflare Tunnel cho domain rai2.si bang Token...
  cloudflared.exe tunnel run --token %TUNNEL_TOKEN%
) else (
  echo [2/2] Canh bao: Chua tim thay Token cho domain rai2.si!
  echo       De sua loi Error 1033:
  echo       1. Mo Cloudflare Zero Trust (https://one.dash.cloudflare.com)
  echo       2. Vao Networks -> Tunnels -> Chon Tunnel cua domain rai2.si
  echo       3. Copy ma token va dan vao file "tunnel-token.txt" tai thu muc nay.
  echo.
  echo       Tam thoi mo Quick Tunnel thu nghiem...
  cloudflared.exe tunnel --url http://127.0.0.1:%OMB_PORT%
)
