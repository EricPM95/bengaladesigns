# Progreso de la Tanda 7

Prompt: `PARA_CODE_TANDA7_v3.md`. Entre paréntesis, la parte que lo hizo (cada una tiene su `INFORME_PARTE_<NOMBRE>_TANDA7.md`).

- [x] Los documentos de Eric (prompt v3, diseños, `VIAJES_REVISION.html`, `PENDIENTES_RECOMPENSAS.md`) tal cual y las líneas «Sustituido por PARA_CODE_TANDA7_v3.md (13-oct-2026).» en los prompts viejos
- [x] 0. Mirar antes lo que ya existe y usarlo (todas las partes: RESERVAS, ventana de llegada, HojaAbajo, campana, rehacer, `ListaDeDias`, `StopMenu`)
- [x] 1. Los días se cuentan por noches y se enseñan «5 días · 4 noches» (REPARTO: `diasDeRuta`, el esqueleto pide `n − 1`; MOVER: `duracionViaje.ts` en 13 sitios y «¿Cuántas noches?»)
- [x] 2. Sin vuelos (y en la gratis) los días como hoy (MOTORLLEGADA y MOTORVUELTA: huella de 483 viajes sin cambios; REPARTO: el día de vuelta sin ruta)
- [x] 3. Gratis y de pago, con la tarjeta «Tu último día también cuenta» (RESERVAS; CONEXIÓN: en la gratis no se manda nada a los motores)
- [x] 4. Lo que pone el viajero en RESERVAS: punto obligatorio, casillas del otro lado, zona, dirección, aviso de fechas, Deshacer (RESERVAS; CONEXIÓN: rehacer y hoja)
- [x] 5. Las horas por dentro: libre y salir (DATOSLLEGADA: márgenes y tablas de fronteras; MOTORLLEGADA; MOTORVUELTA)
- [x] 6. El día 1 con vuelos, 3 noches o más: las filas, el D1 pasa al día 2, la zona y la ruta del centro (DOCUMENTO: listas; MOTORLLEGADA)
- [x] 7. Con vuelos y Free Tour de mañana (MOTORLLEGADA)
- [x] 8. Viajes de 1 y 2 noches con vuelos (DOCUMENTO: «D1+Vaticano»; MOTORLLEGADA)
- [x] 9. El día de vuelta con horas: tabla, última mañana, mañanas cortas, maleta, «Hoy vuelves a casa» (DOCUMENTO: listas; MOTORVUELTA; FICHA y UNIFICADO: tarjeta). Las listas que no caben con la hora más temprana de su fila quedan en PREGUNTAS
- [x] 10. Reservas grandes y vuelos: solo el bloque (MOTORLLEGADA, MOTORVUELTA, INTEGRACIÓN: un solo formato de `sitios_grandes`); la regla del Coliseo con excursión de mañana, a los datos (RESPUESTAS)
- [x] 11. Lo que se queda fuera y «Más para tu día» (MOTORLLEGADA y MOTORVUELTA: «Si te sobra tiempo»; HOY: [+ Más visitas])
- [x] 12. La excursión y los vuelos, [Añadir en un día nuevo] antes del día de vuelta (MOTORLLEGADA, MOTORVUELTA, CONEXIÓN: [Pasar este día a Roma]). Queda sin hacer lo de «Había excursión» (día 4 que pasa a ser el de vuelta), ver los informes
- [x] 13. La ficha de llegada y vuelta y «Para tu zona», sin taxi ni empresas, de noche y a primera hora (DATOSLLEGADA: datos y `paraTuZona`; FICHA: pantalla)
- [x] 14. Los avisos y la hoja del resumen (MOTORLLEGADA y MOTORVUELTA: textos; CONEXIÓN: hoja única, campana, `/api/avisos-de-vuelo`)
- [x] 15. La barra, el título «Día de viaje», el billete, HOY y «Cerrado este día» (RESERVAS: billete; FICHA: título; HOY; MOVER y RESPUESTAS: «Cerrado este día»)
- [x] 16. «Mover a otro día» y «Cambiar parada» con ⇄ (MOVER)
- [x] 17. Respuestas a la 6y10: 1 de enero, «viernes noche», me gusta, audios con `AUDIOS_SECRETO`, nombre del Free Tour, `pruebaTanda6g` (RESPUESTAS; la P5 en MOTORLLEGADA y CONEXIÓN)
- [x] 18. El documento `DIAS_ROMA_PARADAS.md` y `listas.json` con 0 dudas (DOCUMENTO)
- [x] 19. La ruta a mano: las horas solo ponen barras, billete, «Día de viaje» y avisos (MOTORLLEGADA, MOTORVUELTA, CONEXIÓN)
- [x] 20. Fuera lo viejo: hoja del ajuste, `flightOpportunity`, «Ajustar este día», `fitDayToTrip`, `PlaceFinderPanel` (CONEXIÓN, RESERVAS, MOVER)
- [x] 21. Para los destinos que vienen: nada de Roma en el código, `GUIA_NUEVOS_DESTINOS.md` (DOCUMENTO, MOTORLLEGADA, MOTORVUELTA, INTEGRACIÓN, RESPUESTAS, cierre)
- [x] 22. Lo que no va en esta tanda: respetado (sin escala de crucero, sin varios destinos, margen de salida siempre desde el centro, HOY para todos y logros no se tocan)
- [x] 23. La revisión de 20 viajes: viajes 5, 11 y 19 («sobran 150 / 60 min»), viajes 3 y 13 (1 de enero) y los 20 viajes con vuelos en la prueba (RESPUESTAS; MOTORLLEGADA: `LLEGADAS_20`; MOTORVUELTA: `VIAJES_VUELTA`)
- [x] Unificar las pantallas: una sola forma de cada dato y una sola tarjeta «Hoy vuelves a casa» (UNIFICADO)
- [x] Pruebas de cada parte, de la integración y de la tanda entera (batería rápida y muestra de 54 fechas, 0 fallos)
- [x] Capturas a 375 px (`docs/dias/img/7-*.jpg`)
- [x] Informe, preguntas e invariantes (642 a 681)
- [ ] Push a origin
- [ ] Después del push: las 365 fechas completas, con el resultado al final de `INFORME_TANDA7.md` en un commit aparte
