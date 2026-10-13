# Informe de la parte MOTOR: el día de llegada con horas · Tanda 7 (agente F)

Todo en palabras sencillas. Solo he tocado el motor del **día de llegada** (el día 1) con vuelo, tren, autobús o barco con hora, que es de pago. No he tocado el día de vuelta (lo hace el agente G) ni las pantallas.

## 1. Qué se ha hecho, punto por punto

El código nuevo vive en **un solo módulo**, `shared/routeEngine/llegadaDia1.js` (puro, sin Roma escrita dentro). `listasTrip.js`, `listasOrden.js` y `listasDia.js` solo tienen los puntos de enganche, marcados con «Tanda 7»:

| Dónde | Qué hace el enganche |
|---|---|
| `listasTrip.js › planListasTrip` | recibe `llegada`, la pasa a `ordenarDias` y devuelve `plan.llegada` y, en cada día, `llegadaDia` |
| `listasOrden.js › ordenarDias` | tras elegir los días de la tabla, pregunta a la llegada: los cambia, deja fijo el día 1 y cambia las copias de los días tocados |
| `listasTrip.js › preparar` | aplica `llegada_ops` al día (quitar paradas, comida al llegar, cena y noche de otro día, empezar más tarde…) con sus variantes ya puestas |
| `listasTrip.js` (antes de las reservas pequeñas) | mete el bloque de una reserva grande del día 1 en su puesto por la hora |
| `listasDia.js › aplicarVariantes` | `ctx.forzar`: variantes que valen aunque su condición no se cumpla (la versión tranquila; la «versión sin esa visita») |

- **Punto 5 (las horas).** «Libre» = llegada + el traslado del punto (`_llegada.json › al_centro_min`) + 30 min (`destination_config.llegada.libre_extra_min`). Si pasa de la medianoche sigue siendo el mismo día (la última fila). Cada tramo empieza en su hora, sin redondear. «Invierno» = los días en que el sitio de referencia (`destination_config.llegada.invierno`: el Coliseo a las 16:30) cierra a esa hora según `horarioDeLaFecha`; sin fechas, el día 15 del mes; un día en que cierra entero (25 de diciembre, 1 de enero) se mira por el día de al lado. Sin punto: el del traslado más largo de su medio.
- **Punto 6 (3 noches o más).** La tabla del día 1 (`listas.json › llegadas.dia1`) elige la lista del día 1. Desde las 14:00 (en invierno, desde las 13:00) «el D1 pasa entero al día 2»: el día 1 es la ruta del centro (o el anochecer, o la noche), todo se corre un día y **se cae el último día de la tabla**. La zona decide solo por dónde empieza la ruta del centro (`llegadas.inicio_por_zona`). La comida al llegar es la parada «Comida, cerca de tu alojamiento» sin restaurante nuestro, antes de la primera parada (no se mueve nunca). Los textos de la llegada de noche salen con la hora del viajero y el verbo de su medio. La nocturna de la llegada cuenta para el viaje (no se repite otra). Los cierres, con el horario de su fecha, como en cualquier día.
- **Punto 7 (Free Tour de mañana).** El D3 entero si está libre antes del límite de su hora; si no, pero con 30 min de margen, solo la parte del Free Tour (día 2 el D2, día 3 el D1, se cae el último); si el tour ya ha empezado, no se reorganiza nada y sale el aviso de reservas contra el vuelo. Sin hora: la primera de la lista única (`freeTourHoras.js`) que le pille libre, solo entre las del día (los días de horas especiales, solo las suyas); si no hay ninguna, el tour va al día siguiente a las 10:00 (día 1 = su fila, día 2 el D3, día 3 el D1-FT) y, si el día 2 o el 3 tienen una reserva grande, el tour no se pone y el viaje se rehace «sin Free Tour». Con el tour de 19:00 o 21:00 el viaje lleva los días «sin Free Tour» y el tour va con el D1 (si el D1 pasa al día 2, con él).
- **Punto 8 (1 y 2 noches).** Mismas versiones. 2 noches libre desde las 14:00: día 1 la ruta del centro y día 2 el «D1+Vaticano». 1 noche desde las 14:00: la ruta del centro y el Coliseo (con el Foro y el Altar) a «Si te sobra tiempo» con su aviso. 1 día un miércoles: el D0 del miércoles que ya estaba (comprobado: la mañana no queda vacía).
- **Punto 10 (reservas grandes, parte de la llegada).** Libre antes de las 14:00 (13:00 en invierno): ese día es el día escrito de ese sitio (el Coliseo: el D1 con la tabla de su hora; los Museos o la Galería: lo mueve el orden de los días). Desde las 14:00 (13:00): solo el **bloque** entero (sale de `sitios_grandes.lugares[].bloque` y de la lista del día escrito del sitio con la tabla de su hora), metido en la ruta de la fila donde le toca por su hora; el resto del día del sitio va en su versión sin esa visita (`sin_la_visita`). Dos reservas grandes el mismo día: cada una a su hora; si se cruzan, aviso «coinciden». Una reserva antes de estar libre se queda en su sitio y sale el aviso. La regla del Coliseo de `claseDeReserva` («con excursión de mañana no cabe antes de las 16:30») ya está en los datos (`no_cabe_con_excursion_hasta`).
- **Punto 11 (lo que queda fuera).** Va a «Si te sobra tiempo» del día 1 (del día 2 si el día 1 es de noche), con su aviso. Nunca restaurantes ni nocturnas. Lo elegido o reservado no desaparece (ver las pruebas).
- **Punto 12 (excursión).** La excursión sigue en el día 4 de ruta; nunca cae en el día de llegada ni en el de vuelta. Una excursión reservada el día 1 que sale antes de estar libre: aviso; si sale después, ese día lleva la excursión (el esqueleto lo marca) y la del día 4 vuelve a Roma.
- **Punto 19 (ruta a mano).** `llegada.aMano = true` → el motor no cambia nada. Igual con `pago: false` (la gratis) y con coche.
- **Sin vuelos, igual que antes.** Ver el apartado 5.

## 2. La ENTRADA del motor

`planListasTrip({ …lo de siempre, llegada })` y, desde el servidor, `POST /api/generate-day-block` con **`body.llegada`** (lo lee `engineExtrasFromRequest` y llega como `options.llegada`):

```js
llegada: {
  hora: '14:30',            // obligatoria. La hora de llegada que puso el viajero.
  medio: 'avion',           // 'avion' | 'tren' | 'bus' | 'ferry' (por defecto 'avion'). En coche no se manda nada.
  puntoId: 'fco',           // opcional: 'fco' | 'cia' | 'termini' | 'tiburtina' | 'tibus' | 'civitavecchia' (ids de _llegada.json). Sin él, el del traslado más largo de su medio.
  zona: 'centro',           // opcional: id de destination_config.zonas_alojamiento. 'nose' o sin zona = «Aún no lo sé».
  pago: false,              // si es false, el motor no usa ni borra nada (la gratis)
  aMano: true,              // la ruta a mano: el motor no cambia nada
  excursionReservada: { dateIso, dayNumber, salida: '07:30', vuelta: '20:00', nombre: 'Pompeya' }   // opcional
}
```

Las reservas de siempre siguen entrando como hasta ahora (`body.reservas` → `reservasGrandes`, `reservasViaje`, `entradas`) y el Free Tour como siempre (`hasFreeTour`, la hora en `entradas`/`reservasGrandes`, `freeTourDespues` para 19:00 y 21:00). Con la llegada puesta, `mediaJornada` (el medio día de las salidas de antes) se ignora.

Los datos que lee, todos del destino: `listas.json › llegadas.dia1` e `inicio_por_zona`, `_llegada.json › medios`, `roma.json › destination_config.llegada` y `sitios_grandes.lugares[]` (`bloque`, `sin_la_visita`, `no_cabe_con_excursion_hasta`). `writtenDaysFor` devuelve ahora `llegadas` y `llegadaInfo` junto a `days`.

## 3. La SALIDA del motor

**`plan.llegada`** (y, en el JSON del primer día de ciudad, **`day.arrival_plan`**; es el mismo objeto). Solo está si la llegada ha actuado.

| Campo | Qué es |
|---|---|
| `entrada` | `{ hora, medio, punto_id, punto, zona, invierno }` |
| `tabla`, `fila` | `'marzo_octubre'` o `'invierno'`; `{ indice, desde, hasta, doc }` de la fila (**solo para depurar: no se enseña**) |
| `caso` | `madrugada`, `tranquilo`, `d1_de_siempre`, `rapido`, `de_tarde`, `ruta_del_centro`, `ruta_del_centro_entera`, `anochecer`, `noche_con_cena`, `noche_sin_cena`, `sin_ruta`, `reserva_grande_dia_completo`, `excursion_el_dia_1`, `free_tour_{con_hora,sin_hora}_{entero,solo_la_parte_del_tour,ya_empezado,con_otras_reservas}`, `free_tour_dia_siguiente`, `free_tour_no_se_pone+…`; con un `+reserva_grande` si hay un bloque |
| `dia1` | `{ lista, nombre, variante, comida_al_llegar, comida_corta_min, inicio_ruta, sin_paradas, texto, de_noche }`. `sin_paradas` = el día se llama «Día de viaje». `texto` = el texto de la llegada de noche, ya con `{Llegada}` y `{hora}` rellenos. `de_noche` = desde las 20:30 |
| `pasa_al_dia_2` | el D1 (o lo que tocaba) se corre un día |
| `orden` | los ids de los días en el orden pedido a `ordenarDias` (el orden final por cierres está en `plan.days`) |
| `dia_caido` | `{ id, nombre, motivo }` o `null`. Motivos: `el_dia_1_pasa_al_dia_2`, `free_tour_el_dia_siguiente`, `vuelve_el_dia_de_una_reserva` |
| `dia_sustituido` | con 1 o 2 noches: el día de la tabla que sustituye un día escrito para la llegada (`una_noche_con_llegada_tarde`, `dos_noches_con_llegada_tarde`, `una_reserva_reclama_el_dia`). No es un día caído |
| `free_tour` | `{ hora, sin_hora, dia }` (la hora de un tour que existe, no una hora calculada) o `null` |
| `bloques` | `[{ sitio, hora, lugares, fuente }]` de las reservas grandes del día 1 |
| `dias_que_vuelven` | `[{ id, por, sale }]`: un día que la llegada había dejado fuera y una reserva reclama |
| `dejado_fuera` | `[{ lugar, dia, parada, motivo, de_dia }]`: lo que queda en «Si te sobra tiempo» por la llegada (`dia` = 1 o 2) |
| `avisos`, `resumen` | los textos (apartado 4) |
| `hooks.vuelta` | para G (apartado 6) |

**Por día** (en el JSON de cada día de ciudad):

- **`day.arrival_day`** (en el día 1 y en el día que lleve la llegada): `{ lista, nombre, variante, comida_al_llegar, comida_corta_min, inicio_ruta, sin_paradas, texto, de_noche, es_dia_1, bloques: [sitios] }`. `lista` es siempre el id del día que ha quedado de día 1.
- **`day.meals[]`**: la comida al llegar trae `no_restaurant: true` y `title: 'Comida, cerca de tu alojamiento'` (sin `restaurant`).
- **`day.spare_stops`**: «Si te sobra tiempo» de siempre; lo que deja la llegada va dentro (en el motor, su fila de `spareRows` lleva `por_llegada: true`; la lista completa, con su aviso, está en `dejado_fuera`).
- **`plan.days[i].llegadaDia`** (a nivel de motor): lo mismo que `arrival_day`.

**Ninguna hora calculada sale en ningún campo de texto.** Las únicas horas son las del viajero (su llegada, sus reservas, el Free Tour que ya existe). «Libre» y la hora de salir se usan por dentro y no se devuelven. Los textos llevan `{dia:N}` donde va el día: las pantallas lo escriben con `nombreDeDia.ts` («el mar 10»; sin fechas, «el día 1»), N = número de día del viaje.

## 4. Los avisos y la hoja del resumen

| `tipo` | Texto (con `{dia:N}` donde va un día) | Botones | ¿Campana? |
|---|---|---|---|
| `reserva_antes_de_llegar` | «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.» (también las pequeñas; «llegas» / «desembarcas» según el medio) | `ver_reserva` | sí |
| `free_tour_antes_de_llegar` | «Tu Free Tour es a las 10:00 y aterrizas a las 11:30: no te da tiempo. Revisa tu reserva.» | `ver_reserva` | sí |
| `excursion_antes_de_llegar` | «Aterrizas a las 9:00 y tu excursión a Pompeya sale a las 7:30: no llegas. Revisa tu reserva.» | `ver_reserva` | sí |
| `reservas_coinciden` | «Tu entrada al Coliseo y tu entrada a los Museos coinciden. Revisa una de las dos reservas.» | `ver_mis_reservas` | sí |
| `free_tour_puesto_al_llegar` | «Hemos puesto el Free Tour el {dia:1}, nada más llegar. Al reservarlo, elige la hora que te encaje.» (`dayNumber` 1 o 2) | `ver_disponibilidad` | no |
| `free_tour_no_se_pone` | «Con tus vuelos, el Free Tour no cabe sin quitarte el Coliseo o el Vaticano. Si aun así lo quieres, añádelo desde «+ Añadir parada».» | `de_acuerdo` | no |
| `sitio_en_si_te_sobra` | «El Coliseo lo tienes en «Si te sobra tiempo» del {dia:1}: si reservas la entrada, te lo ponemos en el día.» (uno por entrada: el Coliseo y el Foro van juntos) | `de_acuerdo` | no |

**`resumen`** (la hoja de abajo; termina con [De acuerdo] o con los botones de la fila): `llegada` («El {dia:1} es tu llegada a Roma.»), `madrugada` (con [Cambiar fechas] · [De acuerdo]), `dia_corrido` («Como llegas por la tarde, la Roma antigua pasa al {dia:2}.»; «de noche» desde las 20:30) y `dia_caido` («Villa Borghese no cabe en tu viaje: si reservas la Galería, te ponemos su día.»; si el día no lleva un sitio grande, «…si lo quieres, puedes añadirlo desde «+ Añadir parada».»). «Los días que el viajero cambió a mano no se rehacen» y «Al borrar los vuelos» son de las pantallas.

## 5. Cómo se ha comprobado

**Sin vuelos y en la gratis, los días salen igual que antes.** `scripts/destino/_baselineSinVuelos.mjs` guarda la huella (filas, lo que sobra, registros, comidas, noches y avisos) de **483 viajes** con el motor de **antes de tocar nada** (`_baseline_sinvuelos.json`): 1 a 7 noches × sin Free Tour y con los 6 del tour × 9 fechas (verano, agosto, invierno, los dos cambios de hora, Navidad, Fin de Año, Pascua, domingo) y 2 meses sin fechas + reservas grandes y pequeñas. Se vuelve a pasar tras cada cambio: **0 distintos**. Además, `pago: false`, `aMano: true`, coche y «sin hora» dan la misma huella que sin llegada (sección 8 de la prueba).

**Prueba nueva `scripts/destino/pruebaTanda7_llegada.mjs`** (las tablas del documento están escritas otra vez dentro, sin compartir código con el motor): **0 fallos**.

1. Fronteras (**cada punto**, 6 + 4 «sin punto», verano e invierno, con y sin fechas): 0:00, 4:59, 5:00, las 18 horas que dejan libre a las 9:59…23:00, 23:15 (pasa de la medianoche) y 23:59; y **ninguna hora de 0:00 a 23:59 sin fila** (28.800 comprobaciones).
2. Cada fila lleva exactamente su lista (orden, nada de más, comida solo donde toca y entre las 12:00 y las 15:00, la comida al llegar sin restaurante, la cena de la lista, la zona decide el inicio, ninguna hora fija sin reserva, ningún imprescindible «de camino»).
3. El D1 pasa al día 2 (3 a 7 noches, con y sin fechas, con la excursión del día 4 en los dos lados): se corre todo, solo se cae el último y la excursión sigue en el día 4.
4. 1 y 2 noches. 5. Free Tour: con cada hora (límites del documento), sin hora, el día siguiente, la noche (19:00 y 21:00), los días de horas especiales, reservado en otro día. 6. Reservas: Coliseo, Museos y Galería el día 1 (antes y después de las 14:00, cada una a 3-5 horas), dos a la vez, en un día de en medio, y pequeñas. 7. Excursión. 8. Gratis, a mano y coche. 9. Matriz de 1.500 viajes al azar (siempre los mismos) con **todas las comprobaciones de siempre** (`comprobarViaje`: cierres, zigzag, por dentro una vez, restaurantes y nocturnas repetidos, pool…) más las de la llegada (comida, textos sin horas calculadas ni empresas ni «taxi», «Cerrado este día» sin tiempo…). 10. **Los 20 viajes de la revisión con una llegada de cada fila** (`LLEGADAS_20` en `viajes20Lib.mjs`).

Otras pruebas, **0 fallos**: `pruebaFase6y4_listas`, `6y6_cierre`, `6y7_motor` partes 1-3, `6y8_comida`, `6y9_freetour`, `6y10_viajes`, `6y10_comida`, `pruebaTanda6g…6z6d`, `pruebaTanda7_documento`, `pruebaTanda7_datosllegada` y la muestra de fechas de `pruebaListas` (ver el final).

`pruebaTanda6g` daba miles de fallos porque comprobaba lo contrario de la regla nueva de Eric (Navona y el Panteón del D6 «de camino» con «Ya lo visitaste»). La he actualizado: un imprescindible no va de camino y es una parada corta (≤ 15 min); solo lo que no es imprescindible va de camino con «Ya lo visitaste el {día}».

### Tabla de fronteras por punto (desde qué hora de llegada cae el viajero en cada fila)

Sale de `node scripts/destino/pruebaTanda7_llegada.mjs fronteras=1` (el motor, no el documento). «Libre» = llegada + traslado + 30 min. Son las horas del viajero; **no se enseñan**.

| Libre a las… (marzo a octubre) | Fiumicino | Ciampino | Termini | Tiburtina | Autobuses Tiburtina | Civitavecchia |
|---|---|---|---|---|---|---|
| llega de 0:00 a 4:59 · D1 | 0:00 | 0:00 | 0:00 | 0:00 | 0:00 | 0:00 |
| antes de las 10:00 · D1 tranquilo | 5:00 | 5:00 | 5:00 | 5:00 | 5:00 | 5:00 |
| 10:00–11:59 · rápido | 8:30 | 8:40 | 9:15 | 9:05 | 9:05 | 7:30 |
| 12:00–13:59 · de tarde | 10:30 | 10:40 | 11:15 | 11:05 | 11:05 | 9:30 |
| 14:00–14:59 · ruta del centro con comida · D1 al día 2 | 12:30 | 12:40 | 13:15 | 13:05 | 13:05 | 11:30 |
| 15:00–18:59 · ruta del centro · D1 al día 2 | 13:30 | 13:40 | 14:15 | 14:05 | 14:05 | 12:30 |
| 19:00–20:29 · anochecer · D1 al día 2 | 17:30 | 17:40 | 18:15 | 18:05 | 18:05 | 16:30 |
| 20:30–21:59 · noche con cena · D1 al día 2 | 19:00 | 19:10 | 19:45 | 19:35 | 19:35 | 18:00 |
| 22:00–22:59 · noche sin cena · D1 al día 2 | 20:30 | 20:40 | 21:15 | 21:05 | 21:05 | 19:30 |
| 23:00 o más tarde · sin ruta · D1 al día 2 | 21:30 | 21:40 | 22:15 | 22:05 | 22:05 | 20:30 |

En **invierno** cambian solo las filas de la mañana: 10:00–10:59 rápida de invierno 10 (igual que arriba), **11:00–11:59** rápida de invierno 11 (9:30, 9:40, 10:15, 10:05, 10:05, 8:30), **12:00–12:59** de tarde con comida corta (10:30, 10:40, 11:15, 11:05, 11:05, 9:30) y **13:00–13:59** la ruta del centro entera con comida y el D1 al día 2 (11:30, 11:40, 12:15, 12:05, 12:05, 10:30). Las tres tablas coinciden con las del agente de datos de llegada. Sin punto: el del traslado más largo de su medio (avión Fiumicino, tren Tiburtina, autobús la estación de autobuses de Tiburtina, barco Civitavecchia).

## 6. Para el agente de la vuelta (ganchos)

- **`plan.llegada.hooks.vuelta`**: `{ dia_caido: { id, nombre, motivo } | null, pendientes: [{ lugar, motivo, de_dia }], vuelve_como_dia_mas: id | null }`.
  - `dia_caido` / `vuelve_como_dia_mas`: el día que se cayó al llegar. Para el vuelo de las 23:00 o más tarde («un día más entero»), G usa este día si existe; si no, el siguiente día escrito que el viaje no lleva.
  - `pendientes`: lo que la llegada dejó sin día y puede entrar en la mañana de la vuelta (con 2 noches y el Free Tour: la Roma antigua). **Ya están en «Si te sobra tiempo» del día 1 y en `dejado_fuera`**: si G lo coloca en la mañana de la vuelta, tiene que quitarlo de allí.
- **`plan.llegada.dejado_fuera`** y `dia_sustituido`: lo visto y lo no visto. «Lo principal ya visto de día» para las últimas mañanas: G lo calcula con las paradas de `plan.days` como siempre; la llegada no mete nada de noche en ese cálculo.
- **Dónde enganchar sin pisarse:** G toca `listasTrip.js` para el último día; mis cambios están en `ordenarDias` (llamada a `env.llegada`), `preparar` (`llegada_ops`), el bucle de bloques y las dos líneas de `ajustar`/`mesasYReservas`. El módulo `llegadaDia1.js` exporta `aplicarOpsLlegada`, `quitarParadas`, `fraseDeDia`, `aMin`/`aHHMM` y `puntoDeLlegada` por si G los quiere; el **bloque de un sitio grande** de la vuelta puede salir del mismo dato (`sitios_grandes.lugares[].bloque` + la lista del día escrito con la hora de la reserva, ver el bucle «LLEGADA» de `listasTrip.js`).

## 7. Decidido por Code

1. **Los datos que no caben en `listas.json` van a `destination_config.llegada`** (roma.json), no a `listas.json` (que se regenera del documento): `libre_extra_min`, `invierno`, `dos_noches_tarde`, `dia_roma_antigua` y `free_tour`. Los bloques y la «versión sin esa visita» de cada sitio grande, en `sitios_grandes`.
2. **El día 1 es siempre el D1** (o el D0 con 1 noche) en la versión de su fila; los demás días se reparten como sin vuelos. Lo único que lo suelta es una reserva grande de otro día que reclama su día.
3. **La versión tranquila** no es una lista nueva: es el D1 con la variante `coliseo_tarde` forzada, y sigue con las reglas de siempre (la comida antes de las 15:00, empieza a su hora). Las listas **escritas para la llegada** (rápida, de tarde, ruta del centro, anochecer, noche) empiezan cuando el viajero está libre y **no se recortan por minutos**. Si el viajero añade algo (pool, experiencias, una reserva), el día se ajusta como siempre y lo que no cabe va a «Si te sobra tiempo».
4. **La comida al llegar no se mueve** de delante de la primera parada, aunque haya una reserva. En la parte del Free Tour de tarde sin tiempo para comer (libre después de las 15:00) el día no lleva comida.
5. **Free Tour.** Con hora: «libre al menos 30 min antes» = `libre ≤ hora − 30`. Sin hora: `libre < hora − 30` (así sale la tabla del documento: antes de las 9:30 → 10:00, de 9:30 a 11:29 → 12:00…). La hora que elige la app solo sirve para escoger la versión del D3 de esa hora y **no es una reserva** (no sale «Reservado»). La cena y la noche de la parte del tour son las de `free_tour.cena_y_noche_de` (la noche con cena: Armando o Da Baffetto y Trevi). La comida al llegar solo si el tour es por la tarde.
6. **Si hay otra reserva grande de cualquier día y la llegada pediría «solo la parte del tour», no se reorganiza nada** (solo los avisos): el reparto ya lo manda esa reserva.
7. **Una reserva grande del día 1 antes de las 14:00:** el día 1 es el del sitio de la más temprana que abre ese día; las demás van como bloque dentro de él. El Coliseo mantiene el D1 fijo.
8. **Una reserva grande de otro día que reclama el D1** cuando la fila lo gastaría el día 1 (el Coliseo reservado el día 3 con una llegada rápida o de tarde): el día 1 pasa a la ruta del centro (con comida al llegar) y el D1 baja a su día; se cae el último. Con la tranquila, el D1 no se fija y lo reparte la reserva.
9. **Los días que la llegada tarde dejó fuera vuelven solos** si una reserva grande los reclama (la Galería con 3 noches): entran en el lugar del último día que no lleva reserva. El Free Tour reservado en otro día reclama el D3 igual (con 2 noches el D3 sustituye al «D1+Vaticano» y la Roma antigua va a «Si te sobra tiempo»).
10. **«Nada se repite» con la Galería:** su día (D4) «con la del lunes» pierde además «Parque de Villa Borghese», porque el bloque de la Galería ya lo lleva (`sin_la_visita.D4.quitar`). Con los Museos hago lo que dice el documento (la versión sin Museos de los cierres, que empieza en San Pedro con la Basílica y las Grutas): **repite la Plaza y la Basílica** (ver preguntas).
11. **1 noche con la llegada tarde:** el Coliseo, el Foro y el Altar (imprescindibles por dentro del D1 que no caben en ningún día) van a «Si te sobra tiempo»; el aviso es uno por entrada (el Coliseo con el Foro).
12. **2 noches y la llegada tarde:** el D2 no «cae»: lo sustituye el D1+Vaticano (`dia_sustituido`). El domingo o el miércoles el Vaticano se queda como «Cerrado este día» en el día 2 (la regla de la 6y10); lo de pasarlo a la mañana de la vuelta lo decide G (gancho `pendientes` solo en el caso del Free Tour).
13. **Excursión reservada el día 1:** si sale después de estar libre, el día 1 es la excursión y el interruptor del día 4 vuelve a Roma (no se hacen dos); el D1 y los demás ocupan los días de ciudad que quedan.
14. **Una llegada que el motor no entiende** (coche, sin hora, sin datos del destino, `pago: false`, `aMano`, el día 1 «Crear mi propio día») no cambia nada.
15. **`comidaTardia`** en `mesasYReservas`: en el día de llegada, una comida que quedaría detrás de la reserva de la noche pesa en la elección de las opciones; en los demás días no cuenta, como siempre.
16. **Tres retoques a las pruebas compartidas** (`comprobacionesListas.mjs`): el día de llegada puede empezar más tarde; con la llegada tarde el D2 no está entre los dos primeros días; y con una hora fija, la cena (como la comida) va donde la pone la regla de la reserva. `pruebaTanda6g` a la regla nueva de los imprescindibles. `pruebaFase6y10_sitiosgrandes` pasa los límites con excursión por el dato nuevo. `pruebaListas.mjs` admite `llegada=HH:MM` (y `zona=`, `punto=`, `medio=`).

## 8. Casos no resueltos o que se quedan como estaban

- **Dos horas fijas el mismo día y la comida a medianoche.** Con el turno real de la Galería (del pool) y un Free Tour de las 19:00 en el mismo día, la regla 17 deja la lista tal cual y la comida puede caer a las 24:05. **Ya pasaba sin vuelos** (60 de 300 días en una prueba rápida con ese pool). No lo he tocado; lo apunto.
- **Reserva de una excursión en un día de en medio** (no el 1): el esqueleto solo conoce el día 4; no la mueve ni la marca. Ya era así.
- **Los Museos o la Galería reservados con 1 noche** (el D0 no lleva el sitio): no se ven en el día. Ya era así sin vuelos.
- **«Que acaba después de la hora de salir»** (punto 10) y los avisos de la vuelta: de G.
- **La mañana de la vuelta con lo `pendiente`:** de G.
- **«Más para tu día»** (punto 11): las pantallas lo sacan de `spare_stops` (que ya trae lo que la versión dejó fuera, en su orden) y de `dejado_fuera`; el motor no ordena por importancia.
- **Un Free Tour reservado a las 12:00 con la tranquila y un pool grande** puede dar «no cabe del todo» en el registro del día (el motor avisa y no quita nada imprescindible).

## 9. Invariantes propuestas (para `INVARIANTES_PANTALLA.md` / `INVARIANTES_MOTOR`; las numera quien las suba)

1. Con la llegada (de pago, con hora), el día 1 es una lista escrita para la hora a la que está libre; ninguna hora de 0:00 a 23:59 se queda sin fila para ningún punto.
2. «Libre» = llegada + traslado del punto + 30 min; cada tramo empieza en su hora (libre a las 14:00 en punto ya es la fila de las 14:00); si pasa de la medianoche sigue siendo el mismo día.
3. «Invierno» se mira por el horario de la fecha del sitio de referencia, nunca por fechas escritas; sin fechas, el día 15 del mes.
4. Desde las 14:00 (13:00 en invierno) el día 1 pasa entero al día 2: se corre todo un día y solo se cae el último día de la tabla; el día caído queda en `hooks.vuelta`.
5. La comida al llegar es «Comida, cerca de tu alojamiento», sin restaurante nuestro, antes de la primera parada, y nunca empieza después de las 15:00.
6. Nada de la lista escrita de la llegada se recorta por minutos; lo que el viajero añade y no cabe va a «Si te sobra tiempo».
7. Una reserva (grande o pequeña) del día de llegada nunca desaparece ni cambia de hora; con la llegada tarde una reserva grande lleva solo su bloque, entero, y el resto de su día va sin esa visita; nada del bloque se repite en otro día.
8. Una reserva antes de estar libre se queda en su sitio y sale el aviso (se compara con «libre», sin margen).
9. Ningún texto de la llegada enseña una hora que calcule la app, un nombre de empresa, «taxi» ni «Día n» con fechas; las horas son las del viajero.
10. Sin llegada, con `pago: false`, con la ruta a mano o en coche, los días salen igual que sin esta tanda.
11. La excursión del día 4 no se mueve por la llegada ni cae nunca en el día de llegada ni en el de vuelta; la reservada el día 1 lleva ese día.

## 10. Preguntas abiertas (máximo 5)

1. **Los Museos reservados el día 1 con la llegada tarde:** el documento pide que el día del Vaticano siga «con su versión sin Museos de los cierres», que empieza en la Plaza de San Pedro y la Basílica «y las Grutas». Eso **repite la Plaza y la Basílica** que el bloque ya llevó el día 1. ¿Se queda como dice el documento o quitamos la Plaza y la Basílica de ese día (como he hecho con el parque de la Galería)?
2. **El Free Tour de 19:00 con la versión tranquila** (llega antes de las 10:00 en marzo-octubre): el día tranquilo acaba hacia las 19:15 y el tour sale a las 19:00. El motor pasa lo que cabe detrás del tour y avisa «no cabe del todo». ¿Prefieres que con un tour de 19:00 la llegada de mañana use el D1 de siempre (la Roma antigua por la mañana) en vez de la tranquila?
3. **El Coliseo reservado un día de en medio con una llegada rápida o de tarde:** el día 1 pasa a ser la ruta del centro (con comida al llegar) y el D1 baja a su día, y se cae el último. ¿Está bien, o prefieres que la rápida/de tarde se quede y el Coliseo de esa reserva se ponga en la rápida del día 1 sin mover nada?
4. **Con 2 noches y el Free Tour reservado el día 2 con la llegada tarde,** el día 2 es el del Free Tour (D3) y la Roma antigua queda en «Si te sobra tiempo» (y, si cabe, en la mañana de la vuelta). ¿Bien?
5. **La comida a medianoche con dos horas fijas** (apartado 8) ya pasaba sin vuelos. ¿La arreglamos en otra tanda (que la comida mande sobre la lista escrita cuando hay dos horas fijas) o se queda?

## 11. Ficheros

`shared/routeEngine/llegadaDia1.js` (nuevo), `shared/routeEngine/listasTrip.js`, `listasOrden.js`, `listasDia.js`, `listasReservas.js`, `server/index.js` (`body.llegada`), `server/engine/index.js`, `server/engine/buildDayV3.js`, `server/engine/writtenDays.js`, `data/pipeline_v2/roma.json` (`destination_config.llegada`, `sitios_grandes`), `docs/dias/GUIA_NUEVOS_DESTINOS.md`, y en `scripts/destino`: `pruebaTanda7_llegada.mjs`, `llegadaLib.mjs`, `verLlegada.mjs` (explorador), `_baselineSinVuelos.mjs` + `_baseline_sinvuelos.json`, `viajes20Lib.mjs` (`LLEGADAS_20`), `pruebaListas.mjs` (`llegada=`), `comprobacionesListas.mjs`, `pruebaTanda6g.mjs`, `pruebaFase6y10_sitiosgrandes.mjs`.
