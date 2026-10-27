#!/bin/sh
# Reinicia MI Vite (puerto 5183, sin vigilar ficheros) para que coja el código nuevo.
for p in $(netstat -ano | grep ":5183 " | grep LISTEN | awk '{print $5}' | sort -u); do taskkill //PID $p //F >/dev/null 2>&1; done
sleep 1
(API_TARGET=http://localhost:8853 nohup npx vite --port 5183 --strictPort --config scripts/destino/_vite_estable.config.mjs > /tmp/vite5183.log 2>&1 &)
sleep 6
curl -s -o /dev/null -w "vite %{http_code}\n" http://localhost:5183/
