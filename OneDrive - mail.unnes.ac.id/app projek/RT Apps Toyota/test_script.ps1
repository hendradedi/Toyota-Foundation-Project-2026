try {
    # 1. Admin Login
    $admin_body = @{ email = "admin@rtmuban.local"; password = "AdminPassword@123" } | ConvertTo-Json
    $admin_res = Invoke-RestMethod -Uri "http://localhost:3010/api/auth/login" -Method Post -Body $admin_body -ContentType "application/json"
    $admin_info = [PSCustomObject]@{ 
        User = "admin"; 
        Roles = ($admin_res.data.user.roles -join ", "); 
        HasToken = ![string]::IsNullOrEmpty($admin_res.data.tokens.accessToken) 
    }

    # 2. Leader Login
    $leader_body = @{ email = "leader@rtmuban.local"; password = "LeaderPassword@123" } | ConvertTo-Json
    $leader_res = Invoke-RestMethod -Uri "http://localhost:3010/api/auth/login" -Method Post -Body $leader_body -ContentType "application/json"
    $leader_token = $leader_res.data.tokens.accessToken
    $leader_info = [PSCustomObject]@{ 
        User = "leader"; 
        Roles = ($leader_res.data.user.roles -join ", "); 
        HasToken = ![string]::IsNullOrEmpty($leader_token) 
    }

    $admin_info, $leader_info | Format-Table | Out-String | Write-Host

    # 3. Get community members
    $headers = @{ Authorization = "Bearer $leader_token" }
    $members_res = Invoke-RestMethod -Uri "http://localhost:3010/api/users/community-members" -Method Get -Headers $headers
    $members = $members_res.data
    $resident = $members | Where-Object { $_.email -eq "resident@rtmuban.local" }
    $resident_id = $resident.id

    Write-Host "Resident ID: $resident_id, Original Role: $($resident.communityRole)"

    # 4. Patch community role
    $patch_body = @{ role = "secretary" } | ConvertTo-Json
    $patch_res = Invoke-RestMethod -Uri "http://localhost:3010/api/users/$resident_id/community-role" -Method Patch -Body $patch_body -ContentType "application/json" -Headers $headers

    # 5. Verify
    $updated_members_res = Invoke-RestMethod -Uri "http://localhost:3010/api/users/community-members" -Method Get -Headers $headers
    $updated_members = $updated_members_res.data
    $updated_resident = $updated_members | Where-Object { $_.id -eq $resident_id }
    $updated_resident | Select-Object email, communityRole | Format-Table | Out-String | Write-Host
} catch {
    Write-Error $_
}
