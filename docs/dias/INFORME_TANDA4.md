# Informe de la Tanda 4

Resultado de la prueba entera (todos los viajes de 1 a 6 días, con y sin pool y Free Tour, las 365 fechas de 2027, con las comprobaciones nuevas, sin sacar ningún caso): **27.740 días, 0 diferencias sin explicar, 0 fallos reales**. Lo que queda aparte (con su motivo) está al final. Detalle en `PRUEBA_ESCRITOS.md`. Lo que he decidido yo, en `PREGUNTAS_TANDA4.md`. No he tocado `DIAS_ESCRITOS_ROMA.md` y no he hecho push.

## 1. Las horas se calculan una sola vez
- **Causa:** cada ajuste (Free Tour, atardecer, cierres, pool, distancias) movía horas por su cuenta y el último no recalculaba lo demás; luego otra pasada (el programador de visitas) volvía a mover.
- **Regla nueva:** los ajustes deciden qué filas van y qué horas son fijas; `componerDia.js` saca todas las horas del día una vez, al final. El registro cuenta los cambios con esa hora final. Una sola hora límite de la noche (`nightLimit.js`).
- **Prueba nueva:** hora en pantalla = hora final = última del registro; ninguna nocturna después del límite; ninguna cena después de las 22:00. **Resultado: 0 fallos.**
- Destapó: una visita que abre a las 12:00 (San Clemente el 1 de enero) se mostraba a una hora y se calculaba a otra. Ahora la visita empieza cuando abre.

## 2. Nunca un hueco sin nombre
- **Causa:** los ajustes dejaban tiempo libre y nadie lo llenaba; las «Llegada a…» solo existían a veces.
- **Regla nueva:** el margen antes de una reserva o un turno es siempre la parada «Llegada a {sitio}». Lo que sobra se llena, en este orden: comida (hasta 75 min), colchón (hasta 2 h), colchón nuevo de la zona y, como último recurso, un rato más en el último sitio al aire libre. Si el día empieza antes de lo que abre algo, empieza más tarde. Una fila con hora fija que ese día está cerrada se quita antes de calcular.
- **Prueba nueva:** 0 huecos de más de 15 min (descontando lo andado más el margen). **Resultado: 0.**
- Los cinco casos: 24-12 Roma desde arriba y 25-12 basílicas (huecos con nombre), 24-12 Villa Borghese (colchón), Free Tour → Museos y Galería Borghese (llegada con la reserva, ya sale).

## 3. Nocturnas por orden de días
- **Causa:** «ya salió» contaba también lo visto de día, y se repartía antes de saber qué nocturnas cabían.
- **Regla nueva:** día a día desde el primero; «ya salió» = salió de noche en un día anterior, ya con la hora límite aplicada. Primero Trevi, Plaza de España y Coliseo (`noches_imprescindibles`).
- **Prueba nueva:** Trevi, Plaza de España y Coliseo salen por orden en las primeras noches; 0 repetidas. **Resultado: 0 fallos** (antes 553 en la muestra).

## 4. Restaurantes
- **Causa:** el motor no recordaba lo ya usado en el viaje.
- **Regla nueva:** ninguno se repite; la cadena escrito → alternativa → tercera → otro de la zona → otro a menos de 1 km en otro barrio; sin cenar dos días seguidos en el mismo barrio ni comer y cenar en el mismo barrio el mismo día. Si no hay otra opción, se deja con aviso.
- **Prueba nueva:** restaurantes repetidos y barrios repetidos. **Resultado: 0** (en la muestra había 779 casos de barrio antes de la regla).

## 5. Datos en pantalla
- Zona de la cena = la del restaurante en los datos (Nonna Betta ya sale en el Gueto). «Con reserva» en 24, 25, 31 de diciembre y 1 de enero, lista en `destination_config.fechas_con_reserva`. Prueba de ambas: 0 fallos.
- **Sitios sin horario** (lista en el informe de la prueba): 43 sitios, todos calles y plazas, y 2 restaurantes (Osteria dell'Angelo, 200 Gradi).
- Las páginas generadas llevan `<!doctype html>` y `<meta charset="utf-8">` (plantilla común `cabeceraHtml.mjs`); comprobado: 0 páginas sin ellos.

## 6. «De camino»
- **Causa:** no había una definición: se mezclaban calles de 15 min, sitios de nivel 1 y cosas cerradas.
- **Regla nueva:** más de 5 min → «Paseo por X»; nivel 1 o 2 la primera vez → parada; un sitio que no se ve desde la calle cuando está cerrado (Tempietto) sale como «El mirador de San Pietro in Montorio». Dos o más de camino seguidos, una sola tarjeta «De camino a {siguiente}» (no la he visto aún en pantalla, solo el typecheck).
- **Prueba nueva:** 0 de camino de más de 5 min, 0 nivel 1 o 2 de camino la primera vez, 0 colchones que nombren otra parada. **Resultado: 0.** Tarjetas por día: **11,94** de media (en 29.200 días).
- **Aparte, con motivo:** 654 casos en los que los márgenes de una hora fija aprietan un imprescindible hasta «de camino» (es lo último antes de quitarlo); quedan apuntados en el registro.
- Cambia otros días: en 1 día todos los imprescindibles de camino pasan a «por fuera» (más largo).

## 7. El pool
- **Causa:** el paso del pool apretaba con las horas de la tabla y luego sobraba tiempo (un colchón de 2 horas) o la comida caía a las 14:50.
- **Regla nueva:** hora límite de la comida (14:30); si se pasa, por este orden: colchón, visita marcada hasta su mínimo (Capitolinos 60), nivel más bajo a «de camino», quitar por la pirámide. Nunca se reordena. Lo apretado vuelve a su tamaño y lo quitado vuelve si cabe.
- **Prueba:** los Capitolinos están de vuelta (2, 3, 4 y 5 días): **0 comidas en restaurante cerrado**. Aparte: 18 días en los que la comida cae pasadas las 14:30 porque delante solo hay imprescindibles (apuntado).

## 8. Excursiones de medio día
- **Regla nueva:** 8:00–14:00 la excursión, comida en su bloque, 14:00–16:00 descanso, desde las 16:00 la tarde del día que sustituye a la excursión (D5, D6, D7), con cierres y atardecer; sin paradas de nivel 1 o 2, «Tu tarde en Roma está libre». Motor, servidor (`answers.mediaExcursion`) y pantalla del día de excursión.
- **Prueba:** 4, 5 y 6 días × 4 estaciones × Ostia y Tívoli: **24 combinaciones, 0 fallos**. Pendiente: la pantalla del D5 en 4 días aún no las ofrece (pregunta 14).

## 9. Medio día repite un día entero
- Solo comprobación, como pediste: **fallo conocido** (en la prueba, 365 casos del 3,5 días con llegada por la tarde: el medio día del Tridente repite el D4). Se arregla con «Llegada según la hora».

## 10. Distancias
- Modo nuevo: primero se acorta el colchón de antes (sin bajar de 30), después se corre lo siguiente; la cena a en punto o y media. **`DISTANCIAS_PROPUESTA.md`: 109 tablas** con la fila del documento → la fila nueva. Las tablas de `data/dias/roma/` ya van así.

## 11. Lo nuevo del documento
Cripta de los Capuchinos, Largo Gaetana Agnesi, miércoles del D6, lunes del D4, cenas de Campo de' Fiori y de Gino, textos de colchón por tabla y datos de la Cúpula y la Basílica: ya en los datos. Huecos de fotos: Cripta (nuevo) y Coliseo desde Largo Gaetana con la foto del Coliseo.

## 12. Al acabar
Prueba entera hecha (arriba). `VIAJES_2_5_MOTOR.html` y `VIAJES_3_6_MOTOR.html` regenerados (la segunda lleva 6 viajes nuevos con excursión de medio día); no he podido abrirlas en el navegador desde aquí. api-server reiniciado y petición real comprobada (200, también con media jornada).
