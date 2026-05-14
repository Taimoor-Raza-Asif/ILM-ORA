# backend/start-services-local.ps1
# Same as start-services.ps1 but auth uses .env.nomongo (no MongoDB; demo login: test / pass).
# Ensure Python deps: pip install -r services/quiz-service/src/requirements.txt
#   and pip install -r services/recommendation-service/requirements.txt (or src equivalent)
# Optional: MongoDB for university/quiz if you point MONGO_URI in those services' .env files.

$ErrorActionPreference = "Stop"
Write-Host "Starting ILM-ORA (local, auth without Mongo)..." -ForegroundColor Green
Write-Host ""

function Start-ServiceWindow {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '$ServiceName (port $Port)' -ForegroundColor Blue; $Command"
}

Write-Host "1. API Gateway (NODE_ENV=development)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Gateway" -Path "$PSScriptRoot\services\gateway" -Command "`$env:NODE_ENV='development'; npm run dev" -Port 3000
Start-Sleep -Seconds 3

Write-Host "2. Auth (.env.nomongo)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Auth" -Path "$PSScriptRoot\services\auth-service" -Command "`$env:AUTH_ENV_FILE='.env.nomongo'; npm run dev" -Port 3008
Start-Sleep -Seconds 2

Write-Host "3. Quiz (Python)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Quiz" -Path "$PSScriptRoot\services\quiz-service" -Command "npm run dev" -Port 3002
Start-Sleep -Seconds 2

Write-Host "4. Recommendation (Python)..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Recommendation" -Path "$PSScriptRoot\services\recommendation-service" -Command "npm run dev" -Port 3003
Start-Sleep -Seconds 2

Write-Host "5. Sentiment..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Sentiment" -Path "$PSScriptRoot\services\sentiment-service" -Command "npm run dev" -Port 3004
Start-Sleep -Seconds 2

Write-Host "6a. Python sentiment helper..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Python Sentiment" -Path "$PSScriptRoot\services\university-service\scripts" -Command "python sentiment_service_python.py" -Port 5000
Start-Sleep -Seconds 3

Write-Host "6b. University..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "University" -Path "$PSScriptRoot\services\university-service" -Command "npm run dev" -Port 3005
Start-Sleep -Seconds 2

Write-Host "7. Career..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Career" -Path "$PSScriptRoot\services\career-service" -Command "npm run dev" -Port 3006
Start-Sleep -Seconds 2

Write-Host "8. Admin..." -ForegroundColor Yellow
Start-ServiceWindow -ServiceName "Admin" -Path "$PSScriptRoot\services\admin-service" -Command "npm run dev" -Port 3007
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Backend windows opened. Frontend: in another terminal run: cd frontend; npm run dev" -ForegroundColor Green
Write-Host "Then open http://localhost:3001" -ForegroundColor Cyan
Write-Host "Gateway health: http://localhost:3000/health" -ForegroundColor Yellow
Write-Host ""
while ($true) { Start-Sleep -Seconds 60 }
