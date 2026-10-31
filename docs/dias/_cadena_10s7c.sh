cd "C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS"
export APP_URL=http://localhost:5173 API_URL=http://localhost:8787
echo "=== muestra de 60 fechas"; node scripts/destino/muestraRutas60.mjs 2>&1 | tail -2 | cut -c1-200
for p in pruebaTanda10S7c pruebaTanda10S7b pruebaTanda10S7_R pruebaTanda7_conexion pruebaTanda7_reservas pruebaTanda10N10_reservas pruebaTanda10S3_C pruebaTanda7_reorganizar pruebaTanda10J pruebaJutrip; do
  echo "=== $p"
  node scripts/destino/_conCola.mjs node scripts/destino/$p.mjs 2>&1 | grep -E "✓|✗|comprobaciones|fallos|FALLO" | tail -12 | cut -c1-260
done
echo FIN_CADENA
