#!/bin/sh
# Otras pruebas que pintan días (por si el título nuevo las toca). Última línea de cada una.
for f in pruebaTanda6g pruebaTanda6z pruebaTanda6z2 pruebaTanda6z3_dias pruebaTanda6x_franjas pruebaFase6y6_cierre; do
  echo "=== $f"
  timeout 900 node scripts/destino/$f.mjs 2>&1 | grep -v "pipeline-v2" | grep -v "Warning" | grep -v "    at " | tail -4
done
