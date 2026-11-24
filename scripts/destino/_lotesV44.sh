#!/bin/bash
# Pasa, de una en una, las pruebas de lo tocado en la V44. Resultado en $SALIDA (por defecto docs/dias/_pruebasV44.txt). TIEMPO: segundos por prueba (por defecto 1500).
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
SALIDA=${SALIDA:-docs/dias/_pruebasV44.txt}
TIEMPO=${TIEMPO:-1500}
: > $SALIDA
for p in "$@"; do
  echo "=== $p" >> $SALIDA
  APP_URL=http://localhost:5173 timeout $TIEMPO node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs > /tmp/_v44_$p.log 2>&1
  code=$?
  echo "exit=$code" >> $SALIDA
  grep -E "FALLO|✗|fallos|Prueba de|SIN VERIFICAR" /tmp/_v44_$p.log | tail -12 >> $SALIDA
done
echo FIN >> $SALIDA
