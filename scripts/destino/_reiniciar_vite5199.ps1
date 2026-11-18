# Para el Vite estable de pruebas (5199) y arranca otro, a prioridad baja (para ver código nuevo; no vigila archivos).
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'vite' -and $_.CommandLine -match '5199' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
Get-CimInstance Win32_Process -Filter "Name='esbuild.exe'" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
$p = Start-Process -FilePath node -ArgumentList 'node_modules/vite/bin/vite.js','--port','5199','--strictPort','--config','scripts/destino/_vite_estable.config.mjs' -WindowStyle Hidden -PassThru -RedirectStandardOutput "$env:TEMP\vite5199.log" -RedirectStandardError "$env:TEMP\vite5199.err"
Start-Sleep -Seconds 3
try { $p.PriorityClass = 'BelowNormal' } catch {}
Get-CimInstance Win32_Process -Filter "Name='esbuild.exe'" | ForEach-Object { try { (Get-Process -Id $_.ProcessId).PriorityClass = 'BelowNormal' } catch {} }
Write-Output "Vite 5199 arrancado (pid $($p.Id))"
