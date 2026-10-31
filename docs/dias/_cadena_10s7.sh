cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
export APP_URL=http://localhost:5173 API_URL=http://localhost:8787
for p in pruebaTanda10S7 pruebaTanda10J pruebaTanda10S6 pruebaTanda10S5_L2 pruebaTanda10S4_H pruebaTanda10S3_D pruebaTanda10S3_E pruebaTanda10N10_reservas pruebaTanda6s pruebaTanda7_reservas pruebaTanda7_conexion pruebaTanda7_hoy pruebaJutrip; do
  echo "=== $p"
  node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs 2>&1 | grep -E "✓|✗|comprobaciones|fallos|FALLO" | tail -12 | cut -c1-260
done
echo FIN_CADENA
