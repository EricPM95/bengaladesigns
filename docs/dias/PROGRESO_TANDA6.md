# Progreso de la Tanda 6

Una línea por bloque: hora · qué he terminado · qué falta · si algo ha fallado. Reglas que me has puesto: no tocar la pantalla «¿Cómo quieres llegar a…?» (las llegadas van en la Tanda 7), no borrar `dia_escalera_santa.jpg`, no hacer push.

- 08:30 · Terminado: leído el documento nuevo y la tanda. Falta: todo lo demás. Fallos: ninguno.
- 09:30 · Terminado: pantalla de la tanda (trayecto con transporte público, «Si te sobra tiempo», horas orientativas, cabecera del sol, HOY con cuenta atrás, retraso, cansado y lluvia). Falta: motor. Fallos: ninguno (`tsc` limpio; no probado a mano en el móvil).
- 10:30 · Terminado: archivo de lo viejo (documento y tablas con horas) y convertidor de `DIAS_ROMA_PARADAS.md` a `listas.json`. Falta: motor. Fallos: `docs/archivo` está ignorado por git; se añade con `-f`.
- 12:30 · Terminado: motor de listas (cierres, hora fija con su llegada, pool, experiencias, pirámide, restaurantes, nocturnas, comprobaciones, lluvia) y `/api/adjust-day`. Falta: pruebas. Fallos: el reparto se rompía al anclar una reserva (zigzag); arreglado probando prefijos y mandando a «Si te sobra tiempo» lo que lo rompe.
- 13:30 · Terminado: motor viejo y sus pruebas archivados; prueba nueva (`pruebaListas.mjs`) y página `VIAJES_LISTAS.html`. Falta: prueba entera de las 365 fechas. Fallos: la prueba sacaba falsos fallos de lluvia y de pool (arreglados en la comprobación y en el motor).
- 14:30 · Terminado: prueba entera de 1 a 4 días (83.500 viajes). Falta: 5 y 6 días, informe. Fallos: `sin_explicar` en Navidad (el Santo Bambino fuera de temporada no dejaba causa): arreglado; el proceso de 5 y 6 días se paró solo.
- 14:40 · Terminado: relanzada la prueba entera con el arreglo, en 5 procesos. Falta: ver el resultado, regenerar la página, reiniciar el api-server, escribir `INFORME_TANDA6.md`, commits. Fallos: ninguno.
- 15:15 · Terminado: prueba entera de 1 a 5 días con el arreglo (0 fallos salvo 3 comidas tarde del 25-dic con Free Tour y la reserva del Coliseo a las 12:00, 18 min de más, apuntadas en el registro). Falta: grupo de 6 días, página, api-server, informe, commits. Fallos: el proceso de 5 y 6 días de antes seguía vivo y dejó un resultado viejo; descartado.
- 16:30 · Terminado: prueba entera (125.925 viajes; 7 comidas tarde del 25-dic apuntadas, el resto a 0), pagina VIAJES_LISTAS.html regenerada, api-server reiniciado y probado, PRUEBA_LISTAS.md, PREGUNTAS_TANDA6.md e INFORME_TANDA6.md escritos. Falta: commits. Fallos: ninguno.
TERMINADO
