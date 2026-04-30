# ILM-ORA Load Testing

Performance / load tests for the ILM-ORA gateway and microservices using
[k6](https://k6.io).

## Prerequisites

1. **k6** installed (on Windows):
   ```powershell
   winget install k6 --source winget
   ```
   If `k6` is not on `PATH` after install, open a **new** PowerShell window.

2. **Backend running** on the usual ports (start from repo root):
   ```powershell
   cd backend
   .\start-services.ps1
   ```
   Wait for the Python DeBERTa model to finish loading on port 5000 before
   running tests that hit `/api/reviews/:university/stats` or
   `/api/sentiment/analyze`.

## Test Scenarios

| File                | Type       | VUs          | Duration | Purpose |
|---------------------|------------|--------------|----------|---------|
| `smoke.js`          | Smoke      | 1            | 1 min    | Sanity check - run this first |
| `avg-load.js`       | Avg Load   | 50 steady    | 20 min   | Baseline perf under realistic load |
| `spike.js`          | Spike      | 5 → 200 → 5  | ~6 min   | Behavior under sudden traffic bursts |
| `endurance.js`      | Endurance  | 30 steady    | 30 min   | Memory leaks / long-term stability |

All four scripts call `helpers/journey.js`, which simulates a full user journey
covering **every** public gateway endpoint group:

- Health & gateway info
- Universities (list, search, detail, programs, scholarships, hostels nearby)
- Careers (list, search, stats, by-category, detail)
- Reviews (list + per-university)
- Sentiment / DeBERTa ML (`/stats`, `/dashboard`, `/analyze`)
- Auth flow (register → login → `/me`)
- Protected endpoints (favorites, recommendations)

## Running

### Individual scenario

```powershell
k6 run load-tests/smoke.js
k6 run load-tests/avg-load.js
k6 run load-tests/spike.js
k6 run load-tests/endurance.js
```

### Override the gateway URL

```powershell
$env:BASE_URL = "http://localhost:3000"
k6 run load-tests/avg-load.js
```

### Run all scenarios with reports

```powershell
.\load-tests\run-all.ps1
```

Or one at a time:

```powershell
.\load-tests\run-all.ps1 -Only smoke
.\load-tests\run-all.ps1 -Only avg
.\load-tests\run-all.ps1 -Only spike
.\load-tests\run-all.ps1 -Only endurance
```

JSON summaries + console logs are written to `load-tests/reports/`.

## What to Look For

### Smoke
- `checks` rate should be ~100%.
- `http_req_failed` should be `0.00%`.
- Any red threshold means a real bug - fix before running bigger tests.

### Average Load
- `http_req_duration p(95)` under 2.5s for normal endpoints.
- Memory of Node/Python processes should plateau, not climb.
- Mongo connection errors? → increase pool size or add retry.

### Spike
- Errors WILL appear - that is the point. Key questions:
  1. Does the gateway stay alive or crash?
  2. After the spike, does `p95` return to its pre-spike value within 1 min?
     If not, you have a recovery/back-pressure problem.
- The `{ skipML: true }` flag in `spike.js` avoids slamming the DeBERTa
  endpoint (which would dominate latency). Remove it to specifically
  stress-test ML throughput.

### Endurance
- In a separate PowerShell, watch process memory every 30 seconds:
  ```powershell
  while ($true) {
    Get-Process node, python -ErrorAction SilentlyContinue |
      Select Name, Id, @{N='MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, CPU |
      Format-Table
    Start-Sleep 30
  }
  ```
- Linear memory growth during the steady phase → memory leak.
- Growing 5xx rate over time → connection pool / handle exhaustion.

## Tuning

- Increase VUs for any scenario via the `stages` arrays in each file.
- Change `BASE_URL` with `$env:BASE_URL=...` if you deploy the gateway
  elsewhere (e.g., a staging VM).
- To output time-series data for Grafana:
  ```powershell
  k6 run --out json=reports/run.jsonl load-tests/avg-load.js
  ```
