@echo off
setlocal
echo ========================================================
echo   RAI2 SI - Dong Bo Du An Len GitHub
echo   Repository: https://github.com/raifirstsi/bot
echo ========================================================

cd /d "%~dp0"

set COMMIT_MSG=%*
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Auto-sync update %date% %time%

echo [1/3] Staging changes...
git add -A

echo [2/3] Committing changes...
git commit -m "%COMMIT_MSG%"

echo [3/3] Pushing to origin main...
git push origin main

echo ========================================================
echo   Dong bo len GitHub hoan tat!
echo ========================================================
