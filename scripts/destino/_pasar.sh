#!/bin/bash
# Pasa, una detrás de otra (1 Chrome), las pruebas que se le dicen. Uso: bash scripts/destino/_pasar.sh <salida> <prueba1> <prueba2> ...
SALIDA="$1"; shift
: > "$SALIDA"
for p in "$@"; do
  f="scripts/destino/$p"; [ -f "$f" ] || f="scripts/destino/$p.mjs"
  APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node "$f" > "/c/Users/ERIC/AppData/Local/Temp/pas_$$.out" 2>&1
  c=$?
  r=$(grep -E "comprobaciones|fallos" "/c/Users/ERIC/AppData/Local/Temp/pas_$$.out" | tail -1)
  echo "== $p: salida $c · $r" >> "$SALIDA"
  [ "$c" != "0" ] && grep -E "FALLO|✗" "/c/Users/ERIC/AppData/Local/Temp/pas_$$.out" | head -8 | cut -c1-260 >> "$SALIDA"
done
echo "== FIN" >> "$SALIDA"
