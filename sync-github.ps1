# Đồng bộ toàn bộ thay đổi lên GitHub repository https://github.com/raifirstsi/bot
param(
    [string]$Message = "Sync update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RAI² SI - Đồng Bộ Dự Án Lên GitHub" -ForegroundColor Green
Write-Host "  Repository: https://github.com/raifirstsi/bot" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "[1/3] Adding changes..." -ForegroundColor Gray
git add -A

$status = git status --porcelain
if ($status) {
    Write-Host "[2/3] Committing changes: $Message" -ForegroundColor Gray
    git commit -m "$Message"
} else {
    Write-Host "[2/3] No new changes to commit." -ForegroundColor Yellow
}

Write-Host "[3/3] Pushing to origin main..." -ForegroundColor Gray
git push origin main --no-verify

Write-Host "Đồng bộ lên GitHub hoàn tất!" -ForegroundColor Green
