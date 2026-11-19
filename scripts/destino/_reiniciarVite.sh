#!/bin/bash
# Reinicia el Vite de la 5173 (tras editar archivos, el grafo de módulos de un Vite viejo da dos copias del almacén en las pruebas).
powershell -NoProfile -Command "\$v = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if (\$v) { Stop-Process -Id \$v.OwningProcess -Force }; Start-Sleep 2; Get-Process esbuild -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Process -FilePath cmd -ArgumentList '/c','npx vite --port 5173 --strictPort > %TEMP%\vite18.log 2>&1' -WindowStyle Hidden -WorkingDirectory (Get-Location).Path"
for i in $(seq 1 40); do curl -s -o /dev/null http://localhost:5173/ && break; sleep 1; done
curl -s -o /dev/null -w "vite %{http_code}\n" http://localhost:5173/
