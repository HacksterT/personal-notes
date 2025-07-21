$body = Get-Content test.json -Raw
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/sermon/generate" -Method POST -ContentType "application/json" -Body $body
Write-Output $response