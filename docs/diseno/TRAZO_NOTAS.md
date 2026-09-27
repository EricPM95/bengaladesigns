# Formulario "Trazo" (creación de viaje)

Sustituye a LandingScreen + Questionnaire (`src/components/trazo/`, montado en App.tsx para las pantallas
`destination` y `questionnaire`). El motor no cambia: guarda los mismos campos en el store y la
generación es la misma (`src/lib/useRouteGeneration.ts`, compartida con la pantalla de carga de enlaces
compartidos y reanudaciones).

Prototipo de referencia: `Trazo App.dc.html` + `support.js` (Claude Design). El diseño manda en el aspecto;
nuestra lógica, textos y datos mandan en el contenido.

## Reglas que no hay que perder
- Transporte: animación "Conectando" de 3,6 s siempre (como el prototipo): filas escalonadas, crecimiento suave, "Recomendado" al final y luego el botón; sin animación con "reducir movimiento".
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
- Pool: "Elige lo que siempre soñaste ver en {destino}". Con `pool_lista` en el JSON del destino, esa lista tal cual y en su orden (Roma, 20 lugares); sin ella, la fórmula de siempre. Tope por duración (`poolSelectionLimit`: 3 / 5 / 7) con contador; sin "Añadir todos".
- Resumen: paradas reales de la ruta generada (sin las de paso, nocturnas ni pausas) y "VER MI RUTA".

## Proceso
- Después de cambiar `roma.json` (o cualquier JSON de `data/` o `server/index.js`), reiniciar SIEMPRE el servidor de la API: el viejo sigue sirviendo los datos anteriores sin avisar.

## Por dentro de la app (diseño "Trazo Itinerario", 2026-09-27)
- Paleta y letras comunes en `src/index.css` + `tailwind.config.ts` (papel crema, tinta azul noche, terracota; Instrument Serif / Geist / Geist Mono): así llega a TODAS las pantallas.
- DIAS: el día se abre como acordeón dentro de la lista; el mapa de arriba enseña ese día (DayDetailPanel publica sus pines con `onMapChange`).
- Una sola tarjeta para todo (`TrazoCards.tsx`): el color y el icono salen del tipo (`stopKind.ts`). Números de tarjeta = números del mapa (`numberedStopsOf`, en orden de hora; sin pausas, paseos, "de paso" ni tiempo libre).
- Franjas Mañana/Mediodía/Tarde/Atardecer/Noche: salen de la hora y nunca retroceden (`periodFor`).
- Título del día = `curated_day.name` del motor; atardecer y mirador de noche = `sunset_minutes` / `night_view` del motor (la app ya los guarda).
- RUTA: tarjeta de país con la bandera en franjas inclinadas (`flagColors.ts`, todos los países).
- Avisos de fechas (PROMPT_AVISO_FECHAS): `DateNoticesModal.tsx` — hoja desde abajo en móvil, tarjeta centrada en ordenador, fondo desenfocado, icono ilustrado propio (`DateNoticeIcons.tsx`, trazo terracota sobre crema), encabezado "Hemos preparado tu viaje para estas fechas", un solo botón "¡Entendido!", como mucho 3 tarjetas con puntitos (la tercera, "y N más"). Sale una vez por ruta (`dateNoticesSeenKey`); la etiqueta del día (DayList) la reabre. Capturas en `docs/diseno/avisos_fechas/`.
