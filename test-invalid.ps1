$body = Get-Content test-invalid.json -Raw
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/sermon/generate" -Method POST -ContentType "application/json" -Body $body
    Write-Output "Unexpected success: $response"
} catch {
    Write-Output "Expected validation error: $($_.Exception.Message)"
}