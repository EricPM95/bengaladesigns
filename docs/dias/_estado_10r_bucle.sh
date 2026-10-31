cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
# Sube la nota de estado a la rama «estado» cada 30 minutos, leyendo qué hago y qué falta de dos archivos de texto (que se editan a mano).
while true; do
  node scripts/destino/_estado.mjs 10r "$(cat docs/dias/_estado_10r_haciendo.txt)" "$(cat docs/dias/_estado_10r_falta.txt)" >> docs/dias/_estado_10r_bucle.log 2>&1
  sleep 1800
done
