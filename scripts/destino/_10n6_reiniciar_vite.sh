#!/bin/sh
# Reinicia MI Vite (puerto 5201, sin vigilar ficheros; API en 8871) para que coja el código nuevo.
for p in $(netstat -ano | grep ":5201 " | grep LISTEN | awk '{print $5}' | sort -u); do taskkill //PID $p //F >/dev/null 2>&1; done
sleep 1
(API_TARGET=http://localhost:8871 nohup npx vite --config scripts/destino/_vite_estable.config.mjs --port 5201 --strictPort > /tmp/vite5201.log 2>&1 &)
sleep 6
curl -s -o /dev/null -w "vite %{http_code}\n" http://localhost:5201/
