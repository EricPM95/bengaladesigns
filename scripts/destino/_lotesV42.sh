#!/bin/bash
# Pasa, de una en una, las pruebas de lo tocado en la V42. Resultado en docs/dias/_pruebasV42.txt
cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
SALIDA=docs/dias/_pruebasV42.txt
: > $SALIDA
for p in "$@"; do
  echo "=== $p" >> $SALIDA
  APP_URL=http://localhost:5173 timeout 700 node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs > /tmp/_v42_$p.log 2>&1
  code=$?
  echo "exit=$code" >> $SALIDA
  grep -E "FALLO|✗|fallos|Prueba de|SIN VERIFICAR" /tmp/_v42_$p.log | tail -8 >> $SALIDA
done
echo FIN >> $SALIDA
