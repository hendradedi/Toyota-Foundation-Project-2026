# Simple smoke test for RT Apps Toyota (token-aware)
$baseUrl = "http://localhost:3000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SIMPLE SMOKE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Invoke-Curl {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [string]$Token = $null
    )

    $args = @('-sS', '--max-time', '20', '-X', $Method)
    if ($Token) {
        $args += @('-H', "Authorization: Bearer $Token")
    }

    $tmpBodyFile = $null
    if ($Body) {
        $tmpBodyFile = Join-Path $env:TEMP ("rt_apps_simple_" + [guid]::NewGuid().ToString() + ".json")
        Set-Content -Path $tmpBodyFile -Value $Body -Encoding UTF8 -NoNewline
        $args += @('-H', 'Content-Type: application/json', '--data-binary', "@$tmpBodyFile")
    }

    $marker = '__HTTP_CODE__'
    $args += @('-w', "`n$marker%{http_code}", $Url)

    try {
        $raw = & curl.exe @args
        if ($LASTEXITCODE -ne 0 -or -not $raw) {
            return @{ Success = $false; StatusCode = 0; Body = $null; Error = 'curl request failed' }
        }

        $txt = [string]$raw
        $idx = $txt.LastIndexOf($marker)
        $bodyText = $txt.Substring(0, $idx).Trim()
        $code = [int]$txt.Substring($idx + $marker.Length).Trim()

        return @{ Success = ($code -ge 200 -and $code -lt 300); StatusCode = $code; Body = $bodyText; Error = $null }
    }
    finally {
        if ($tmpBodyFile -and (Test-Path $tmpBodyFile)) {
            Remove-Item -Path $tmpBodyFile -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "`n[1] API HEALTH" -ForegroundColor Yellow
$health = Invoke-Curl -Url "$baseUrl/health"
if ($health.Success) {
    Write-Host "  OK Health endpoint (HTTP $($health.StatusCode))" -ForegroundColor Green
} else {
    Write-Host "  FAIL Health endpoint" -ForegroundColor Red
}

Write-Host "`n[2] LOGIN" -ForegroundColor Yellow
$loginBody = '{"email":"admin@rtmuban.local","password":"AdminPassword@123"}'
$login = Invoke-Curl -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginBody
$token = $null
if ($login.Success) {
    try {
        $obj = $login.Body | ConvertFrom-Json
        $token = $obj.data.tokens.accessToken
    } catch {
        $token = $null
    }
}

if ($token) {
    Write-Host "  OK Login and token acquired" -ForegroundColor Green
} else {
    Write-Host "  FAIL Login/token" -ForegroundColor Red
}

Write-Host "`n[3] PROTECTED ENDPOINTS" -ForegroundColor Yellow
$checks = @(
    @{ Name = "Waste categories"; Url = "$baseUrl/api/waste-bank/categories" },
    @{ Name = "Marketplace products"; Url = "$baseUrl/api/marketplace/products" },
    @{ Name = "SOS alerts"; Url = "$baseUrl/api/sos/alerts" },
    @{ Name = "Patrol shifts"; Url = "$baseUrl/api/patrol/shifts" }
)

foreach ($check in $checks) {
    $res = Invoke-Curl -Url $check.Url -Method "GET" -Token $token
    if ($res.Success) {
        Write-Host "  OK $($check.Name): HTTP $($res.StatusCode)" -ForegroundColor Green
    } else {
        Write-Host "  FAIL $($check.Name): HTTP $($res.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`nDone: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
