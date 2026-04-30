# load-tests/run-all.ps1
# Convenience script that runs every scenario in order and saves
# a JSON + HTML summary per scenario under load-tests\reports\.
#
# Usage (from repo root):
#   .\load-tests\run-all.ps1
#
# Or run an individual scenario:
#   .\load-tests\run-all.ps1 -Only smoke
#   .\load-tests\run-all.ps1 -Only avg
#   .\load-tests\run-all.ps1 -Only spike
#   .\load-tests\run-all.ps1 -Only endurance

param(
    [ValidateSet('all', 'smoke', 'avg', 'spike', 'endurance')]
    [string]$Only = 'all'
)

$K6 = "k6"
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\k6\k6.exe") {
        $K6 = "C:\Program Files\k6\k6.exe"
    } else {
        Write-Error "k6 not found. Install with:  winget install k6 --source winget"
        exit 1
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$reports = Join-Path $scriptDir "reports"
New-Item -ItemType Directory -Path $reports -Force | Out-Null

function Invoke-Scenario($name, $script) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $json = Join-Path $reports "$name-$stamp.json"
    $log = Join-Path $reports "$name-$stamp.log"

    Write-Host ""
    Write-Host "=== Running scenario: $name ===" -ForegroundColor Cyan
    Write-Host "Script : $script"
    Write-Host "Summary: $json"
    Write-Host ""

    & $K6 run --summary-export="$json" $script 2>&1 | Tee-Object -FilePath $log
}

$smoke     = Join-Path $scriptDir "smoke.js"
$avg       = Join-Path $scriptDir "avg-load.js"
$spike     = Join-Path $scriptDir "spike.js"
$endurance = Join-Path $scriptDir "endurance.js"

switch ($Only) {
    'smoke'     { Invoke-Scenario 'smoke' $smoke }
    'avg'       { Invoke-Scenario 'avg-load' $avg }
    'spike'     { Invoke-Scenario 'spike' $spike }
    'endurance' { Invoke-Scenario 'endurance' $endurance }
    'all' {
        Invoke-Scenario 'smoke' $smoke
        Invoke-Scenario 'avg-load' $avg
        Invoke-Scenario 'spike' $spike
        Invoke-Scenario 'endurance' $endurance
    }
}

Write-Host ""
Write-Host "All requested scenarios finished." -ForegroundColor Green
Write-Host "Reports saved to: $reports" -ForegroundColor Green
