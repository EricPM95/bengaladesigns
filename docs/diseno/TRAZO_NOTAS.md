# Formulario "Trazo" (creación de viaje)

Sustituye a LandingScreen + Questionnaire (`src/components/trazo/`, montado en App.tsx para las pantallas
`destination` y `questionnaire`). El motor no cambia: guarda los mismos campos en el store y la
generación es la misma (`src/lib/useRouteGeneration.ts`, compartida con la pantalla de carga de enlaces
compartidos y reanudaciones).

Prototipo de referencia: `Trazo App.dc.html` + `support.js` (Claude Design). El diseño manda en el aspecto;
nuestra lógica, textos y datos mandan en el contenido.

## Reglas que no hay que perder
- Transporte: siempre 5 filas (Avión, Tren, Autobús, Ferry, En tu coche). Activas = Paso A + filtro por
  tipo de destino (`transportRows.ts`, FLUJO_TRANSPORTE Paso B); el resto en gris "Sin ruta". Nunca precios.
  Nunca "directo" ni "con escala" (no se puede garantizar: cambia con la temporada y la aerolínea).
  "Recomendado" como mucho en una; si solo hay una apta se marca sola. Distancia en km por coordenadas.
- Tabla curada `data/transport/{destino}_origenes.json` manda sobre todo (sin Claude). Si no hay fila, una
  consulta por pareja origen|destino y se guarda para siempre en `place_content_cache`
  (destination = `transport:{destino}`), sin migración. El tiempo en coche sale de Mapbox.
- Ritmo: "Completo" (Recomendado) y "Tranquilo". "≈ N planes al día" (Roma: 8 y 6) = media real del motor para todos
  los viajes con ese ritmo (`destination_config.pace_stats`, `scripts/destino/paceStats.mjs --guardar`).
- Experiencias: Imprescindibles siempre marcada y bloqueada, hasta 2 más (o ninguna). Mercadillos solo en
  invierno (o según la ventana del destino). "No me interesa" no existe: negativas siempre [].
- Pool: tope por duración (`poolSelectionLimit`: 5 / 7 / 10) con contador; sin "Añadir todos".
- Resumen: paradas reales de la ruta generada (sin las de paso, nocturnas ni pausas) y "VER MI RUTA".

## Proceso
- Después de cambiar `roma.json` (o cualquier JSON de `data/` o `server/index.js`), reiniciar SIEMPRE el servidor de la API: el viejo sigue sirviendo los datos anteriores sin avisar.
