# Reinicia SOLO la API de la app (puerto 8787), a prioridad baja. Úsalo tras tocar server/ o data/. No toca el Vite.
#   powershell -ExecutionPolicy Bypass -File scripts/destino/_reiniciar_api.ps1
$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ocupado = Get-NetTCPConnection -State Listen -LocalPort 8787 -ErrorAction SilentlyContinue
foreach ($c in $ocupado) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
$env:SERVER_PORT = '8787'
$p = Start-Process node -ArgumentList 'server/index.js' -WorkingDirectory $raiz -WindowStyle Hidden -PassThru -RedirectStandardOutput "$env:TEMP\api.log" -RedirectStandardError "$env:TEMP\api.err"
$p.PriorityClass = 'BelowNormal'
Start-Sleep -Seconds 5
try { $r = Invoke-WebRequest http://localhost:8787/api/x -UseBasicParsing -TimeoutSec 5; "API: $($r.StatusCode)" } catch { "API: $($_.Exception.Response.StatusCode.value__)" }
