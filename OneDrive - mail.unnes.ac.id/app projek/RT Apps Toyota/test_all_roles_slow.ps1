# ============================================
# Digital RT-Muban - Comprehensive Role Testing Script (Slow Mode)
# ============================================
# This script tests all user roles with delays to avoid rate limiting
# Test Users:
# 1. Admin (Super Admin): admin@rtmuban.local / AdminPassword@123
# 2. RT Leader (Admin RT): leader@rtmuban.local / LeaderPassword@123
# 3. Resident (User): resident@rtmuban.local / ResidentPassword@123
# ============================================

$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Digital RT-Muban - Role Testing Script (Slow Mode)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test users
$testUsers = @(
    @{
        Name = "Super Admin (Admin Utama)"
        Email = "admin@rtmuban.local"
        Password = "AdminPassword@123"
        Role = "admin"
    },
    @{
        Name = "RT Leader (Admin RT)"
        Email = "leader@rtmuban.local"
        Password = "LeaderPassword@123"
        Role = "rt_leader"
    },
    @{
        Name = "Resident (User)"
        Email = "resident@rtmuban.local"
        Password = "ResidentPassword@123"
        Role = "resident"
    }
)

$allErrors = @()
$testResults = @()

# Function to test API endpoint with delay
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    # Add delay to avoid rate limiting
    Start-Sleep -Seconds 2
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        return @{
            Success = $false
            Error = $errorMessage
            StatusCode = $statusCode
        }
    }
}

# Test 1: Check API Health
Write-Host "`n[TEST 1] Checking API Health..." -ForegroundColor Yellow
$healthCheck = Test-Endpoint -Url "$baseUrl/health"
if ($healthCheck.Success) {
    Write-Host "OK API is healthy" -ForegroundColor Green
    Write-Host "  Gateway: $($healthCheck.Data.gateway)" -ForegroundColor Gray
    Write-Host "  Status: $($healthCheck.Data.status)" -ForegroundColor Gray
} else {
    Write-Host "X API health check failed: $($healthCheck.Error)" -ForegroundColor Red
    $allErrors += "API Health Check Failed"
}

# Test each user role
foreach ($user in $testUsers) {
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "Testing Role: $($user.Name)" -ForegroundColor Cyan
    Write-Host "Email: $($user.Email)" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    
    $roleErrors = @()
    $roleTests = @{
        Role = $user.Name
        Email = $user.Email
        Tests = @()
    }
    
    # Test 2: Login
    Write-Host "`n[TEST 2] Login Test..." -ForegroundColor Yellow
    $loginBody = @{
        email = $user.Email
        password = $user.Password
    } | ConvertTo-Json
    
    $loginResult = Test-Endpoint -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginBody
    
    if ($loginResult.Success) {
        Write-Host "OK Login successful" -ForegroundColor Green
        $accessToken = $loginResult.Data.data.tokens.accessToken
        $userData = $loginResult.Data.data.user
        Write-Host "  User ID: $($userData.id)" -ForegroundColor Gray
        Write-Host "  Name: $($userData.firstName) $($userData.lastName)" -ForegroundColor Gray
        Write-Host "  Roles: $($userData.roles -join ', ')" -ForegroundColor Gray
        
        $roleTests.Tests += @{
            Test = "Login"
            Status = "PASS"
            Details = "Successfully logged in"
        }
        
        $headers = @{
            "Authorization" = "Bearer $accessToken"
        }
        
        # Test 3: Get Profile
        Write-Host "`n[TEST 3] Get User Profile..." -ForegroundColor Yellow
        $profileResult = Test-Endpoint -Url "$baseUrl/api/users/profile" -Headers $headers
        
        if ($profileResult.Success) {
            Write-Host "OK Profile retrieved successfully" -ForegroundColor Green
            $roleTests.Tests += @{
                Test = "Get Profile"
                Status = "PASS"
                Details = "Profile data retrieved"
            }
        } else {
            Write-Host "X Failed to get profile: $($profileResult.Error)" -ForegroundColor Red
            $roleErrors += "Get Profile Failed"
            $roleTests.Tests += @{
                Test = "Get Profile"
                Status = "FAIL"
                Details = $profileResult.Error
            }
        }
        
        # Test 4: Waste Bank
        Write-Host "`n[TEST 4] Get Waste Bank Categories..." -ForegroundColor Yellow
        $wasteBankResult = Test-Endpoint -Url "$baseUrl/api/waste-bank/categories" -Headers $headers
        
        if ($wasteBankResult.Success) {
            Write-Host "OK Waste bank categories retrieved successfully" -ForegroundColor Green
            $count = $wasteBankResult.Data.data.Count
            Write-Host "  Found $count categories" -ForegroundColor Gray
            $roleTests.Tests += @{
                Test = "Get Waste Bank Categories"
                Status = "PASS"
                Details = "Waste bank data retrieved"
            }
        } else {
            Write-Host "X Failed to get waste bank categories: $($wasteBankResult.Error)" -ForegroundColor Red
            $roleErrors += "Get Waste Bank Categories Failed"
            $roleTests.Tests += @{
                Test = "Get Waste Bank Categories"
                Status = "FAIL"
                Details = $wasteBankResult.Error
            }
        }
        
        # Test 5: Marketplace Products
        Write-Host "`n[TEST 5] Get Marketplace Products..." -ForegroundColor Yellow
        $marketplaceResult = Test-Endpoint -Url "$baseUrl/api/marketplace/products" -Headers $headers
        
        if ($marketplaceResult.Success) {
            Write-Host "OK Marketplace products retrieved successfully" -ForegroundColor Green
            $roleTests.Tests += @{
                Test = "Get Marketplace Products"
                Status = "PASS"
                Details = "Marketplace data retrieved"
            }
        } else {
            Write-Host "X Failed to get marketplace products: $($marketplaceResult.Error)" -ForegroundColor Red
            $roleErrors += "Get Marketplace Products Failed"
            $roleTests.Tests += @{
                Test = "Get Marketplace Products"
                Status = "FAIL"
                Details = $marketplaceResult.Error
            }
        }
        
        # Test 6: SOS Alerts
        Write-Host "`n[TEST 6] Get SOS Alerts..." -ForegroundColor Yellow
        $sosResult = Test-Endpoint -Url "$baseUrl/api/sos/alerts" -Headers $headers
        
        if ($sosResult.Success) {
            Write-Host "OK SOS alerts retrieved successfully" -ForegroundColor Green
            $roleTests.Tests += @{
                Test = "Get SOS Alerts"
                Status = "PASS"
                Details = "SOS data retrieved"
            }
        } else {
            Write-Host "X Failed to get SOS alerts: $($sosResult.Error)" -ForegroundColor Red
            $roleErrors += "Get SOS Alerts Failed"
            $roleTests.Tests += @{
                Test = "Get SOS Alerts"
                Status = "FAIL"
                Details = $sosResult.Error
            }
        }
        
        # Test 7: Patrol Schedules
        Write-Host "`n[TEST 7] Get Patrol Schedules..." -ForegroundColor Yellow
        $patrolResult = Test-Endpoint -Url "$baseUrl/api/patrol/schedules" -Headers $headers
        
        if ($patrolResult.Success) {
            Write-Host "OK Patrol schedules retrieved successfully" -ForegroundColor Green
            $roleTests.Tests += @{
                Test = "Get Patrol Schedules"
                Status = "PASS"
                Details = "Patrol data retrieved"
            }
        } else {
            Write-Host "X Failed to get patrol schedules: $($patrolResult.Error)" -ForegroundColor Red
            $roleErrors += "Get Patrol Schedules Failed"
            $roleTests.Tests += @{
                Test = "Get Patrol Schedules"
                Status = "FAIL"
                Details = $patrolResult.Error
            }
        }
        
        # Admin-specific tests
        if ($user.Role -eq "admin" -or $user.Role -eq "rt_leader") {
            Write-Host "`n[TEST 8] Admin: Get All Users..." -ForegroundColor Yellow
            $usersResult = Test-Endpoint -Url "$baseUrl/api/users" -Headers $headers
            
            if ($usersResult.Success) {
                Write-Host "OK Users list retrieved successfully" -ForegroundColor Green
                $roleTests.Tests += @{
                    Test = "Get All Users (Admin)"
                    Status = "PASS"
                    Details = "Users data retrieved"
                }
            } else {
                Write-Host "X Failed to get users: $($usersResult.Error)" -ForegroundColor Red
                $roleErrors += "Get All Users Failed"
                $roleTests.Tests += @{
                    Test = "Get All Users (Admin)"
                    Status = "FAIL"
                    Details = $usersResult.Error
                }
            }
        }
        
        # Test: Logout
        Write-Host "`n[TEST 9] Logout Test..." -ForegroundColor Yellow
        $logoutResult = Test-Endpoint -Url "$baseUrl/api/auth/logout" -Method "POST" -Headers $headers
        
        if ($logoutResult.Success) {
            Write-Host "OK Logout successful" -ForegroundColor Green
            $roleTests.Tests += @{
                Test = "Logout"
                Status = "PASS"
                Details = "Successfully logged out"
            }
        } else {
            Write-Host "X Logout failed: $($logoutResult.Error)" -ForegroundColor Red
            $roleErrors += "Logout Failed"
            $roleTests.Tests += @{
                Test = "Logout"
                Status = "FAIL"
                Details = $logoutResult.Error
            }
        }
        
    } else {
        Write-Host "X Login failed: $($loginResult.Error)" -ForegroundColor Red
        $roleErrors += "Login Failed"
        $roleTests.Tests += @{
            Test = "Login"
            Status = "FAIL"
            Details = $loginResult.Error
        }
    }
    
    # Summary for this role
    Write-Host "`n--- Summary for $($user.Name) ---" -ForegroundColor Cyan
    $passCount = ($roleTests.Tests | Where-Object { $_.Status -eq "PASS" }).Count
    $failCount = ($roleTests.Tests | Where-Object { $_.Status -eq "FAIL" }).Count
    Write-Host "Passed: $passCount" -ForegroundColor Green
    Write-Host "Failed: $failCount" -ForegroundColor Red
    
    if ($roleErrors.Count -gt 0) {
        $allErrors += $roleErrors
    }
    
    $testResults += $roleTests
    
    # Delay between users
    Write-Host "`nWaiting 5 seconds before testing next role..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# Final Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "FINAL TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

foreach ($result in $testResults) {
    Write-Host "`n$($result.Role):" -ForegroundColor Yellow
    foreach ($test in $result.Tests) {
        $color = if ($test.Status -eq "PASS") { "Green" } else { "Red" }
        $symbol = if ($test.Status -eq "PASS") { "OK" } else { "X" }
        Write-Host "  $symbol $($test.Test): $($test.Status)" -ForegroundColor $color
        if ($test.Status -eq "FAIL") {
            Write-Host "    Error: $($test.Details)" -ForegroundColor Gray
        }
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
if ($allErrors.Count -eq 0) {
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "TESTS COMPLETED WITH ERRORS" -ForegroundColor Red
    Write-Host "Total Errors: $($allErrors.Count)" -ForegroundColor Red
}
Write-Host "============================================" -ForegroundColor Cyan

# Save results to file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "test_results_$timestamp.json"
$testResults | ConvertTo-Json -Depth 10 | Out-File $reportFile
Write-Host "`nDetailed results saved to: $reportFile" -ForegroundColor Cyan
