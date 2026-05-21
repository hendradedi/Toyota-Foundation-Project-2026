# ============================================
# Digital RT-Muban - Role Testing Script (Synced)
# ============================================

$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Digital RT-Muban - Role Testing Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$testUsers = @(
    @{ Name = "Super Admin"; Email = "admin@rtmuban.local"; Password = "AdminPassword@123" },
    @{ Name = "RT Leader"; Email = "leader@rtmuban.local"; Password = "LeaderPassword@123" },
    @{ Name = "Resident"; Email = "resident@rtmuban.local"; Password = "ResidentPassword@123" }
)

function Invoke-CurlJson {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )

    $headerArgs = @()
    foreach ($k in $Headers.Keys) {
        $headerArgs += @('-H', "${k}: $($Headers[$k])")
    }

    $args = @('-sS', '--max-time', '20', '-X', $Method)
    $args += $headerArgs

    $tmpBodyFile = $null
    if ($Body) {
        $tmpBodyFile = Join-Path $env:TEMP ("rt_apps_toyota_body_" + [guid]::NewGuid().ToString() + ".json")
        Set-Content -Path $tmpBodyFile -Value $Body -Encoding UTF8 -NoNewline
        $args += @('-H', 'Content-Type: application/json', '--data-binary', "@$tmpBodyFile")
    }

    $marker = '__HTTP_CODE__'
    $args += @('-w', "`n$marker%{http_code}", $Url)

    try {
        $raw = & curl.exe @args
        if ($LASTEXITCODE -ne 0 -or -not $raw) {
            return @{ Success = $false; StatusCode = 0; Error = 'curl request failed'; Data = $null }
        }

        $text = [string]$raw
        $idx = $text.LastIndexOf($marker)
        if ($idx -lt 0) {
            return @{ Success = $false; StatusCode = 0; Error = 'http code marker missing'; Data = $null }
        }

        $bodyText = $text.Substring(0, $idx).Trim()
        $statusCode = [int]$text.Substring($idx + $marker.Length).Trim()

        $json = $null
        if ($bodyText) {
            try {
                $json = $bodyText | ConvertFrom-Json
            } catch {
                $json = $bodyText
            }
        }

        $ok = ($statusCode -ge 200 -and $statusCode -lt 300)
        $errMsg = $null
        if (-not $ok) {
            if ($json -is [string]) {
                $errMsg = $json
            } elseif ($json -and $json.message) {
                $errMsg = $json.message
            } else {
                $errMsg = "HTTP $statusCode"
            }
        }

        return @{ Success = $ok; StatusCode = $statusCode; Error = $errMsg; Data = $json }
    }
    finally {
        if ($tmpBodyFile -and (Test-Path $tmpBodyFile)) {
            Remove-Item -Path $tmpBodyFile -Force -ErrorAction SilentlyContinue
        }
    }
}

$health = Invoke-CurlJson -Url "$baseUrl/health"
if ($health.Success) {
    Write-Host "[HEALTH] PASS" -ForegroundColor Green
} else {
    Write-Host "[HEALTH] FAIL: $($health.Error)" -ForegroundColor Red
}

$summary = @()

foreach ($user in $testUsers) {
    Write-Host "`n--------------------------------------------" -ForegroundColor Cyan
    Write-Host "Testing: $($user.Name) ($($user.Email))" -ForegroundColor Cyan

    $result = [ordered]@{
        role = $user.Name
        login = 'FAIL'
        profile = 'FAIL'
        waste_categories = 'FAIL'
        marketplace_products = 'FAIL'
        sos_alerts = 'FAIL'
        patrol_shifts = 'FAIL'
        logout = 'FAIL'
        errors = @()
    }

    $loginBody = (@{ email = $user.Email; password = $user.Password } | ConvertTo-Json)
    $login = Invoke-CurlJson -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginBody

    if (-not $login.Success) {
        $result.errors += "Login: $($login.Error)"
        $summary += [pscustomobject]$result
        Write-Host "Login FAIL: $($login.Error)" -ForegroundColor Red
        continue
    }

    $result.login = 'PASS'
    $token = $null
    $userId = $null
    if ($login.Data -and $login.Data.data -and $login.Data.data.tokens) { $token = $login.Data.data.tokens.accessToken }
    if ($login.Data -and $login.Data.data -and $login.Data.data.user) { $userId = $login.Data.data.user.id }

    if (-not $token -or -not $userId) {
        $result.errors += 'Login response missing token/userId'
        $summary += [pscustomobject]$result
        Write-Host "Login PASS but token/userId missing" -ForegroundColor Red
        continue
    }

    $headers = @{ Authorization = "Bearer $token" }

    $profile = Invoke-CurlJson -Url "$baseUrl/api/users/$userId" -Headers $headers
    if ($profile.Success) { $result.profile = 'PASS' } else { $result.errors += "Profile: $($profile.Error)" }

    $waste = Invoke-CurlJson -Url "$baseUrl/api/waste-bank/categories" -Headers $headers
    if ($waste.Success) { $result.waste_categories = 'PASS' } else { $result.errors += "Waste: $($waste.Error)" }

    $market = Invoke-CurlJson -Url "$baseUrl/api/marketplace/products" -Headers $headers
    if ($market.Success) { $result.marketplace_products = 'PASS' } else { $result.errors += "Marketplace: $($market.Error)" }

    $sos = Invoke-CurlJson -Url "$baseUrl/api/sos/alerts" -Headers $headers
    if ($sos.Success) { $result.sos_alerts = 'PASS' } else { $result.errors += "SOS: $($sos.Error)" }

    $patrol = Invoke-CurlJson -Url "$baseUrl/api/patrol/shifts" -Headers $headers
    if ($patrol.Success) { $result.patrol_shifts = 'PASS' } else { $result.errors += "Patrol: $($patrol.Error)" }

    $logout = Invoke-CurlJson -Url "$baseUrl/api/auth/logout" -Method "POST" -Headers $headers
    if ($logout.Success) { $result.logout = 'PASS' } else { $result.errors += "Logout: $($logout.Error)" }

    $summary += [pscustomobject]$result

    $passCount = ($result.GetEnumerator() | Where-Object { $_.Name -ne 'role' -and $_.Name -ne 'errors' -and $_.Value -eq 'PASS' }).Count
    $failCount = 6 - $passCount
    Write-Host "PASS=$passCount FAIL=$failCount" -ForegroundColor Yellow
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "FINAL SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$summary | ConvertTo-Json -Depth 5 | Write-Output

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "test_results_$timestamp.json"
$summary | ConvertTo-Json -Depth 10 | Out-File $reportFile
Write-Host "Report saved to: $reportFile" -ForegroundColor Cyan
