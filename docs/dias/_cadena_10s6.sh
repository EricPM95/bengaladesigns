cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
export APP_URL=http://localhost:5173 API_URL=http://localhost:8787
for p in pruebaTanda10S6 pruebaTanda10N10_reservas pruebaTanda6s pruebaTanda10N9_vuelo pruebaTanda7_reservas pruebaJutrip; do
  echo "=== $p"
  node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs 2>&1 | grep -E "✓|✗|comprobaciones|fallos|FALLO" | tail -12 | cut -c1-260
done
echo FIN_CADENA
