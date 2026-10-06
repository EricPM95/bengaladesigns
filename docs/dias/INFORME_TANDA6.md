# Informe de la Tanda 6: el motor de listas

## En una frase

Los días de Roma ya no son tablas con horas al minuto y cuatro versiones por atardecer: son **listas de paradas por franjas** (`DIAS_ROMA_PARADAS.md`, que no he tocado). El motor solo hace unas pocas cosas y la hora de cada parada es orientativa (la suma de lo que dura cada una y el trayecto).

## Qué he quitado y por qué

Todo está archivado (no borrado) y en el historial de git:

- **Las horas escritas al minuto y las tablas de cada día** (`data/dias/roma/D*.json`) → `data/archivo/dias_roma/`. Ahora la fuente es `listas.json`, que sale del documento con `scripts/destino/listasConvertir.mjs`.
- **El documento viejo** `DIAS_ESCRITOS_ROMA.md` → `docs/archivo/`; y las páginas y pruebas viejas (2,5 días, 3-6 días, distancias) → `docs/archivo/dias/`.
- **Las versiones A, B, C y D** y los cortes de luz: el sol es solo un dato de la cabecera («Hoy el sol se pone a las…»).
- **El ajuste al atardecer** (la parada elástica, el mirador a su hora): nada se mueve por el sol.
- **Las tablas de fechas especiales** del motor (una versión por fecha): quedan solo los cambios que el documento escribe (mercadillos, cierres) y los avisos de fecha de siempre.
- **Rellenar huecos y alargar paradas** (colchones, huecos de 15 y 30 min): el tiempo libre es del viajero.
- **La corrección automática de las distancias** y los **márgenes complicados**: queda solo la «Llegada a…» (30 min antes de una reserva, 15 antes de un turno o del Free Tour).
- **El motor** (`writtenTrip.js`, `escritos.js`, `componerDia.js`: 4.547 líneas) → `shared/archivo/motor_v4/`. El nuevo son 1.475 líneas (`listasTrip.js`, `listasDia.js`, `listasOrden.js`, `listasReglas.js`).
- De `_destino.json`: cortes de luz, pool y colchones de las tablas, noches y viajes cortos (copia en `data/archivo/dias_roma/_destino.antes_tanda6.json`).
- Las pruebas del motor viejo → `scripts/archivo/`.

Lo que **no** he tocado: qué días lleva cada viaje y su orden (igual que antes), la pantalla «¿Cómo quieres llegar a…?» (las llegadas van en la Tanda 7), las fotos (`dia_escalera_santa.jpg` sigue donde estaba) y los datos de `roma.json`.

## Lo que hace el motor

1. **Días y orden:** como antes (el Vaticano no en domingo ni miércoles, la excursión, «Prefiero quedarme en Roma»).
2. **Cierres:** lo cerrado ese día sale con «Cerrado hoy» (o por fuera si se ve desde la calle); si no abre en su franja, igual; avisos «Cierra a las…» y «Abre a las…».
3. **Hora fija** (reserva, turno, Free Tour): va a su hora con su «Llegada a…» delante; lo que cabe antes va antes y lo demás después, en el mismo orden; si queda un rato, una parada corta pegada al sitio; si no, el día empieza más tarde (o antes). Si colocarla rompe una comprobación, lo que la rompe pasa a «Si te sobra tiempo».
4. **Pool y experiencias:** cada cosa en el sitio que escribe el documento (cada variante cita su frase).
5. **Si cabe:** se suman los minutos y el trayecto por franja; lo que no cabe pasa a «Si te sobra tiempo» por la pirámide (nunca un imprescindible la primera vez); la comida, como muy tarde a las 14:30 (antes se acorta lo de menos de la mañana).
6. **Restaurantes y nocturnas:** la alternativa escrita; un recambio solo si es un restaurante de verdad a menos de 10 min; sin repetir; las nocturnas imprescindibles, en los primeros días.
7. **Las mismas comprobaciones al recolocar** (zigzag, pirámide, por dentro una vez, nada repetido, se come donde se acaba, nada cerrado): si un cambio rompe una, no se hace.
8. **Horas orientativas.**

## En la app

- Trayecto entre paradas siempre (RUTA, DÍAS, HOY); en las opciones del trayecto ya sale **«Transporte público»**.
- «De camino» agrupado, «Llegada a…» con su texto y sin foto, «Si te sobra tiempo» plegado con «Añadir», cabecera con el sol, «No incluido» solo para lo que se queda fuera.
- **HOY:** siguiente parada y trayecto, «Marcar como hecha», avisos de cierre, cuenta atrás de las reservas, «Voy con retraso» y «Estoy cansado» (`/api/adjust-day`), y aviso de lluvia con Open-Meteo y botón «Ver alternativa» (nunca cambia sola).

## Pruebas (`PRUEBA_LISTAS.md`)

125.925 viajes y 463.915 días (1 a 6 días, 365 fechas, con y sin pool, Free Tour, reservas y experiencias): **orden, cerrado, zigzag, pirámide, por dentro una vez, restaurantes y nocturnas repetidos, reservas, pool y lluvia, todos a 0.** Un solo caso queda: **7 viajes** el 25 de diciembre con el Coliseo reservado a las 12:00 y Free Tour, donde la comida cae a las 14:33-14:48 (el motor lo apunta). No hay prueba de huecos.

Fallos que encontré por el camino y arreglé en su causa: colocar una reserva rompía el reparto (zigzag); una parada de temporada fuera de fechas se quitaba sin dejar causa; el plan de lluvia mezclaba mañana y tarde; el motivo de un recambio de restaurante decía lo contrario de lo que pasaba.

`VIAJES_LISTAS.html`: un viaje de cada duración en invierno y verano, uno con reservas y otro con lluvia. El api-server está reiniciado y probado con peticiones reales (rehacer un día, retraso, cansado, medio día de excursión).

## Lo que queda (ver `PREGUNTAS_TANDA6.md`)

- Lo que decidí yo: horas de inicio y límites de cada franja, minutos de los traslados, varias interpretaciones del documento (D0 al revés, D2 y D6 en miércoles, D1-FT con pool, «el Janículo» en la lluvia…).
- **Pool sin sitio escrito en el documento** (sale en «No incluido»): en 1 día, la Cúpula, la Galería Borghese, la Boca de la Verdad, el Parque de Villa Borghese, el Ojo, los Capitolinos y San Juan de Letrán; las Termas de Caracalla en 1, 2 y 3 días.
- **No he probado a mano la pantalla en el móvil** (solo `tsc` limpio y peticiones al servidor).
- Los scripts de auditoría de fotos (`auditarFotos.mjs`, `fotosRevision.mjs`) leen las tablas viejas y no encuentran nada ahora; habría que apuntarlos a `listas.json`.
- No he hecho push.
