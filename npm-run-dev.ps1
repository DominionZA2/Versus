# Kill any process using port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processes) {
    $processes | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "Killed processes on port 3000"
}

# Start npm run dev as background job on port 3000
Write-Host "Starting npm run dev as background job on port 3000..."
Start-Job -ScriptBlock { Set-Location "C:\Source\Versus"; $env:PORT = "3000"; npm run dev } -Name "DevServer"
Write-Host "Dev server started in background on port 3000. Use 'Get-Job' to check status."
