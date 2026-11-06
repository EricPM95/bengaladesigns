#!/bin/bash
# Pasa en fila las pruebas de lo tocado en RETOQUES_TARJETAS (un solo Chrome por la cola). Salida: docs/dias/_retoques_pruebas.txt
cd "$(dirname "$0")/../.."
export APP_URL=http://localhost:5173 API_URL=http://localhost:8787
OUT=docs/dias/_retoques_pruebas.txt
: > $OUT
for p in pruebaTanda6z5 pruebaTanda10N8_paradas pruebaTandaLZ2a_A pruebaTandaLZ2a_B pruebaTandaLZ2b1_A pruebaTandaLZ2b1_B pruebaTandaLZ3b pruebaTanda10S10_B pruebaTanda10S10_C pruebaRetoquesReservas pruebaRetoquesExplorar pruebaTanda6v pruebaCorr6z6_reservas pruebaArregloReservas pruebaTanda10N10_reservas pruebaTanda10R_B pruebaFase6y4_ficha; do
  echo "== $p" >> $OUT
  node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs 2>&1 | grep -E "comprobaciones|FALLO|✗|fallos" | head -8 >> $OUT
done
echo "FIN" >> $OUT
