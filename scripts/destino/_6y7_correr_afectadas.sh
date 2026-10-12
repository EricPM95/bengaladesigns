#!/bin/sh
# Pasa las pruebas que tocan los títulos de los días (tanda 6y7) y enseña la última línea de cada una.
#   API_URL=http://localhost:8834 SERVIDOR=http://localhost:8834 sh scripts/destino/_6y7_correr_afectadas.sh
for f in pruebaFase6y7_titulos pruebaFase6y_manual pruebaFase6y_reorganizar pruebaFase6y_formulario pruebaFase6y2_formulario pruebaFase6y2_reorganizar pruebaFase6y2_reservas pruebaFase6y2_fotos \
  pruebaFase6y3_formulario pruebaFase6y3_reservas pruebaFase6y3_fotos pruebaFase6y4_ficha pruebaFase6y4_formulario pruebaFase6y4_iconos pruebaFase6y4_listas pruebaFase6y4_perfil pruebaFase6y4_presupuesto pruebaFase6y4_reservas \
  pruebaFase6y5_pantallas pruebaFase6y5_historias pruebaTanda6z3 pruebaCorr6z6 pruebaCorr6z6_efecto pruebaCorr6z6_perfil pruebaCorr6z6_reservas pruebaTanda6z6 pruebaTanda6z6a pruebaTanda6z6b pruebaTanda6z6c pruebaTanda6z6d \
  pruebaTanda6z5 pruebaTanda6s pruebaTanda6u pruebaTanda6v; do
  echo "=== $f"
  timeout 600 node scripts/destino/$f.mjs 2>&1 | grep -v "pipeline-v2" | tail -6
  echo "exit: $?"
done
