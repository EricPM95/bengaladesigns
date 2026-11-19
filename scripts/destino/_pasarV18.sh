#!/bin/bash
SALIDA="$1"; shift
: > "$SALIDA"
for p in "$@"; do
  f="scripts/destino/$p.mjs"
  APP_URL=http://localhost:5173 timeout 900 node scripts/destino/_conCola.mjs node "$f" > "$TEMP/pas18.out" 2>&1
  c=$?
  r=$(grep -E "comprobaciones|fallos" "$TEMP/pas18.out" | tail -1)
  echo "== $p: salida $c · $r" >> "$SALIDA"
  [ "$c" != "0" ] && grep -E "FALLO|✗" "$TEMP/pas18.out" | head -6 | cut -c1-260 >> "$SALIDA"
done
echo "== FIN" >> "$SALIDA"
