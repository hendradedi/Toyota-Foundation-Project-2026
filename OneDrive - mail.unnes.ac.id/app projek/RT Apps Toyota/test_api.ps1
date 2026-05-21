$baseUrl = $env:RT_API_BASE_URL
if (-not $baseUrl) {
    $baseUrl = "http://localhost:3000"
}

$loginBody = '{"email":"admin@rtmuban.local","password":"AdminPassword@123"}'

try {
    $tmpLoginFile = Join-Path $env:TEMP "rt_apps_toyota_login_body.json"
    Set-Content -Path $tmpLoginFile -Value $loginBody -Encoding UTF8 -NoNewline
    $loginRaw = & curl.exe -sS --max-time 15 -H "Content-Type: application/json" --data-binary "@$tmpLoginFile" "$baseUrl/api/auth/login"
    if ($LASTEXITCODE -ne 0 -or -not $loginRaw) {
        throw "Login request failed"
    }

    $loginResponse = $loginRaw | ConvertFrom-Json
    $token = $loginResponse.accessToken
    if (-not $token -and $loginResponse.data -and $loginResponse.data.tokens) {
        $token = $loginResponse.data.tokens.accessToken
    }
    $refreshToken = $null
    if ($loginResponse.data -and $loginResponse.data.tokens) {
        $refreshToken = $loginResponse.data.tokens.refreshToken
    }
    $userId = $null
    if ($loginResponse.data -and $loginResponse.data.user) {
        $userId = $loginResponse.data.user.id
    }

    if (-not $token) {
        throw "Access token not found in login response"
    }

    Write-Output "TOKEN_STATUS: Success"
} catch {
    Write-Output "TOKEN_STATUS: Failed - $_"
    return
} finally {
    if (Test-Path $tmpLoginFile) {
        Remove-Item -Path $tmpLoginFile -Force -ErrorAction SilentlyContinue
    }
}

try {
    if (-not $userId) { throw "User ID not found in login response" }
    $profileRaw = & curl.exe -sS --max-time 15 -H "Authorization: Bearer $token" "$baseUrl/api/users/$userId"
    if ($LASTEXITCODE -ne 0 -or -not $profileRaw) {
        throw "Profile request failed"
    }
    $profile = $profileRaw | ConvertFrom-Json
    $message = $profile.data.message
    Write-Output "PROFILE: UserId=$userId, Message=$message"
} catch {
    Write-Output "PROFILE: Failed - $_"
}

try {
    if (-not $refreshToken) { throw "Refresh token not found in login response" }
    $refreshBody = '{"refreshToken":"' + $refreshToken + '"}'
    $tmpRefreshFile = Join-Path $env:TEMP "rt_apps_toyota_refresh_body.json"
    Set-Content -Path $tmpRefreshFile -Value $refreshBody -Encoding UTF8 -NoNewline
    $refreshRaw = & curl.exe -sS --max-time 15 -H "Content-Type: application/json" --data-binary "@$tmpRefreshFile" "$baseUrl/api/auth/refresh"
    if ($LASTEXITCODE -ne 0 -or -not $refreshRaw) {
        throw "Refresh request failed"
    }
    $refreshRes = $refreshRaw | ConvertFrom-Json
    $newToken = $refreshRes.data.accessToken
    if (-not $newToken) { $newToken = $refreshRes.accessToken }
    Write-Output "REFRESH: Success=$(if ($newToken) { 'true' } else { 'false' })"
} catch {
    Write-Output "REFRESH: Failed - $_"
} finally {
    if (Test-Path $tmpRefreshFile) {
        Remove-Item -Path $tmpRefreshFile -Force -ErrorAction SilentlyContinue
    }
}

try {
    $logoutRaw = & curl.exe -sS --max-time 15 -X POST -H "Authorization: Bearer $token" "$baseUrl/api/auth/logout"
    if ($LASTEXITCODE -ne 0 -or -not $logoutRaw) {
        throw "Logout request failed"
    }
    $logoutRes = $logoutRaw | ConvertFrom-Json
    Write-Output "LOGOUT: Message=$($logoutRes.message)"
} catch {
    Write-Output "LOGOUT: Failed - $_"
}
