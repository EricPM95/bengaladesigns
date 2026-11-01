cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
export APP_URL=http://localhost:5173 API_URL=http://localhost:8787
for p in pruebaTanda10S9 pruebaTanda10R pruebaTanda10S8 pruebaTanda10S7b_U pruebaTanda10S4_I pruebaCorr6z6_reservas pruebaTanda10N10_reservas pruebaTanda10S3_C pruebaTanda10S6_O pruebaTanda10S7_T pruebaJutrip; do
  echo "=== $p"
  node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs 2>&1 | grep -E "✗|comprobaciones|fallos|FALLO" | tail -10 | cut -c1-240
done
echo FIN_CADENA
