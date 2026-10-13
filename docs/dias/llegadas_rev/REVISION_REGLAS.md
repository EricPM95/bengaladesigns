# Tanda 7 (llegadas y vueltas): revisión contra lo decidido después del 8-oct

*Revisión del 12-oct-2026. No se ha tocado nada del repositorio.*

**Qué he leído:** `PARA_CODE_TANDA7.md`, `PROMPT_TANDA7_PARA_PEGAR.md`, `PROPUESTA_LLEGADAS.md` y `NOTAS_TANDA7_LLEGADAS.md` (8 y 9-oct); `DIAS_ROMA_PARADAS.md` entero; `GUIA_NUEVOS_DESTINOS.md`; los informes de la 6y5 a la 6y9 (y los de la 6s, 6t, 6v, 6y, 6z3, 6z5 y 6z6b, cuando hacía falta saber si algo ya estaba hecho); `data/dias/roma/_llegada.json`; y los más nuevos, que mandan: `PENDIENTES_LLEGADAS.md` y `PENDIENTES_6K.md` (de `/mnt/user-data/outputs/`). He mirado el código, sin cambiarlo, para saber qué existe ya de verdad.

**Otro agente** ha revisado lo mismo a la vez y ha dejado en esta carpeta `HUECOS.md` y `MATRIZ.md` (no los he tocado). Los he leído y he comprobado en el código lo más grave que encontró (la cuenta de los días, el punto 0). Lo que he tomado de ahí lleva **(HUECOS n)**.

**Cómo leer cada punto:**
- **CHOCA:** la Tanda 7 dice algo que va contra una decisión nueva.
- **HECHO:** ya lo hizo otra tanda; en la v2 solo se dice «úsalo».
- **SOBRA:** ya no hace falta.
- **CAMBIA:** no choca con una regla, pero hay que decirlo de otra forma para que Code no se equivoque.
- **FALTA:** no está en la Tanda 7 y hace falta.

Las reglas de Eric que mandan siempre, y a las que me refiero por su número:
**R1** la app avisa y nunca prohíbe · **R2** nada se quita sin que lo decida el viajero (lo que no cabe va a «Si te sobra tiempo») · **R3** ninguna hora calculada a la vista (solo las que pone el viajero) · **R4** sin cuentas al minuto (la hora solo elige la fila de una tabla) · **R5** sin nombres de empresas en los textos · **R6** la llegada y la vuelta con horas son de pago (en la gratis, días enteros) · **R7** reserva grande mueve el día entero, reserva pequeña solo su parada · **R8** horarios reales por tramos de fechas · **R9** comida antes si al salir de una visita son más de las 14:30; cena antes si son más de las 22:00 · **R10** el Free Tour al principio del viaje · **R11** días por su fecha, sin «Día 1» · **R12** títulos de día por grupos · **R13** lo de varios destinos no se hace todavía.

---

## 0. Lo más grave: la app y la tanda no cuentan igual los días

**CHOCA (con el motor, no con una regla de Eric).** La tanda y el documento cuentan la fecha de vuelta como un día de ruta: en el ejemplo de Ana (del martes 10 al sábado 14), el sábado es el D4 sin vuelos y la última mañana con vuelos. **La app no:** cuenta los días de ruta por noches, y la fecha de vuelta es un día aparte, sin ruta (`shared/routeEngine/tripSkeleton.js`: «El último día es la vuelta y no lleva ruta (invariante 21)», `contentDays = totalDays − 1`; `appendReturnLegDay` en `src/lib/tripDays.ts`; invariante 21 de `docs/INVARIANTES_MOTOR.md`). Lo he comprobado en el código (HUECOS 1).

**Qué cambia:**
- las tablas del documento («4 días: día 4 con interruptor») ya son días de ruta: el interruptor usa `contentDays`;
- con vuelos, la última mañana va en el día de vuelta, que hoy está vacío: **no le quita nada al último día de ruta**. Fuera los casos «el último día pasa a ser la última mañana»;
- la excursión del día 4 **nunca** cae en el día de vuelta: fuera «si con los vuelos el día 4 pasa a ser el de vuelta» y sus dos textos;
- «Con un solo día entero» y «Sin ningún día entero» del documento son, contados así, 2 días de ruta y 1 día de ruta.

**Qué debe decir la v2:** su punto 1, «Los días: cómo se cuentan», antes que nada, y todo lo demás escrito con esa cuenta.

---

## 1. «Antes de empezar» y «Cómo trabajar»

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 1.1 **CAMBIA** | «Empieza cuando la 6j esté subida.» | «Empieza cuando la 6y10 esté subida.» | Desde el 8-oct han pasado de la 6k a la 6y9; la 6y10 es la siguiente (PENDIENTES_6K, arriba). Trae «[Añadir en un día nuevo]», que mueve el día de vuelta (ver 2.4). |
| 1.2 **CAMBIA** | «El documento tiene la sección reescrita: pásalo por el convertidor y no lo toques.» | Code arregla él mismo el documento con una lista cerrada de cambios (punto 2 de la v2) y lo pasa por `listasConvertir.mjs` con 0 dudas. | La sección es del 8-oct y lleva horas calculadas, el título «Llegada a Roma», «el día 1», el bloqueo del interruptor… PENDIENTES_LLEGADAS pide quitar arriba las tres secciones viejas para que quede una sola versión. En la 6y8 y la 6y9 ya fue Code quien escribió en el documento. |
| 1.3 **HECHO** | «Añade `.claude/` al `.gitignore`.» | Fuera. | Ya está (línea 31 del `.gitignore`). |
| 1.4 **CAMBIA** | Preguntas sin límite. | La regla de siempre: lo pequeño lo decide Code («Decidido por Code»); como mucho 5 preguntas. | Así van las tandas desde la 6y8 (PROMPT_TANDA6Y9). |
| 1.5 **CAMBIA** | Lista de lo que existe: `FlightTickets.tsx`, `ArrivalReturnSheet.tsx`, `barTextOf`… | Puesta al día: `LlegadaYVuelta.tsx`, `AlojamientoReservas.tsx` (la zona), `HojaAbajo`, `nombreDeDia.ts`, `tituloDelDia.ts`, `horarioDeLaFecha.js`, `freeTourHoras.js`, `quitarConDeshacer`, `pagoActivo()`, el rehacer «Actualizando tu ruta…» de la 6y7. | Muchas piezas son nuevas (6s, 6t, 6v, 6y4, 6y7, 6y9). |

## 2. Punto 1 de la Tanda 7: lo que pone el viajero

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 2.1 **HECHO** | «¿En qué zona te alojas?»: botones nuevos, con 7 opciones. | Ya existe, con su rueda, de pago (`route.accommodationZone`; las 7 zonas en `destination_config.zonas_alojamiento` de `roma.json`). La tanda solo la usa. La zona sin tocar cuenta como «Aún no lo sé» (HUECOS 22). | 6s, 6v y 6z (comentario de `AlojamientoReservas.tsx`: «la zona, solo de pago»). |
| 2.2 **HECHO** | Horas, punto, medio de la vuelta. | Ya existen, con precio, referencia, compañía y código (6y4). | INFORME_6Y4, 6Y5, 6Y6. |
| 2.3 **FALTA** | Nada sobre una hora sin punto. | Con hora y sin punto: el punto con el traslado más largo de ese medio (avión, Fiumicino; tren, Tiburtina; autobús, Tibus; barco, Civitavecchia) (HUECOS 16). | Ningún punto viene marcado de serie (GUIA §4); ninguna hora sin su fila. |
| 2.4 **FALTA** | «¿Llegas o te vas otro día? Cambia las fechas.» | Se queda, y un aviso: si cambian las fechas (o la 6y10 añade un día al final) y ya había vuelta con hora, en la campana: «Has cambiado los días del viaje: revisa que tu vuelta sigue siendo el {día}.» [Ver mi vuelta]. | La 6y10 (12-oct): «si la vuelta de RESERVAS ya no cuadra con las fechas, sale el aviso de siempre en la campana». Ese aviso no está escrito. R1. |
| 2.5 **CHOCA** | «Al poner, cambiar o borrar una hora… los días se rehacen solos.» | Igual, con el rehacer en segundo plano de la 6y7 («gana el último»), con [Deshacer] al quitar el vuelo (6y4) y **solo de pago**. | R6, GUIA §6; 6y7 punto 2 y P7. |
| 2.6 **FALTA** | Medios mezclados. | Cada barra con su medio; solo se recorta donde hay hora (la ida en coche y la vuelta en avión) (HUECOS 23). | — |

## 3. Punto 2: las horas

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 3.1 **CAMBIA** | Libre = llegada + `al_centro_min` + 30; salir = `leaveMinutesOf`; última mañana con «salir − 1:00»; madrugadas. | Lo mismo, pero como **tablas con filas**, una de llegada y otra de vuelta, de 0:00 a 23:59, para cada punto (punto 5 de la v2). | R4 (6z5, 10-oct: «la hora de llegada, como la de una reserva, solo elige la fila de su tabla»). Comprobado en `_llegada.json`: Fiumicino 60+30, Ciampino 50+30, Termini 15+30, Tiburtina y Tibus 25+30, Civitavecchia 120+30; salir 180, 170, 45, 55, 55 y 120+110. Coinciden con el documento. |
| 3.2 **FALTA** | Nada sobre la medianoche. | Libre que pasa de las 24:00 es la última fila («nada»), nunca la mañana siguiente; salir antes de las 0:00 es la noche del día de antes. Sin redondear para elegir la fila. Cada tramo empieza en su hora, en todas las tablas (HUECOS 5, 19). | `centerMinutesOf` no corta en las 24:00 y redondea a 5 min. |
| 3.3 **FALTA** | La llegada de madrugada «día entero». | La hoja del resumen lo explica: «Aterrizas a las 0:30 del mar 10: ese día lo tienes entero, y esa noche ya necesitas alojamiento. Si aterrizas la noche del mar 10, cambia las fechas del viaje.» (HUECOS 6a, 6b). | Con solo la hora, la app no sabe si aterriza antes o después del día 1. R1 (avisa). |
| 3.4 **FALTA** | La vuelta de madrugada: «el de antes acaba sin nocturna». | Y con su cena. Los avisos de ese día se comparan con la hora de salir de esa noche (HUECOS 6c). | Si no, la reserva de ese día no se compara con nada. |
| 3.5 **CHOCA** | «En ningún texto para el viajero sale la palabra «centro».» (y la prueba 10). | «Centro» solo en datos reales (la distancia, el traslado, el nombre de una zona): «32 km al centro», «De Fiumicino al centro» sí; en nuestras frases, no. | NOTAS_TANDA7 (9-oct) y GUIA §5, posteriores. |

## 4. Punto 3: lo que se ve en el día

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 4.1 **HECHO** | Barra «LLEGADA · VUELO 09:00 · FIUMICINO», fuera «EN EL CENTRO». | Ya está, diseño 1b de la 6t: «LLEGADA · FIUMICINO · IB 3214», «Cómo llegar desde Fiumicino» y la pastilla «✓ 09:00»; gratis, «Cómo llegar a Roma» y la flecha. | `barTextOf` (6t, 6y4). Solo queda un comentario viejo en `arrivalReturn.ts`. |
| 4.2 **CHOCA** | La de vuelta «con «SAL A LAS 14:00»» (también el documento, línea 929). | Sin «SAL A LAS»: solo la hora del viajero. | R3. La 6t ya lo quitó del código. |
| 4.3 **CHOCA** | «El día se llama «Llegada a Roma», con o sin vuelos.» | El título sale de los grupos (6y7): «Centro histórico», por ejemplo. «Día de viaje» y el trayecto pequeño, como ahora. Un día de llegada o de vuelta **sin paradas** (llega desde las 23:00, solo el traslado, o solo Trevi de noche, que no cuenta para el título) se llama «Día de viaje», nunca «Día libre». | R12 (6y7 punto 6; 6y9 P11, P13, P14). Hoy «Día libre» es para cualquier día sin paradas. |

## 5. Punto 4: el orden de los días y los días reales

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 5.1 **CAMBIA** | El orden nuevo (Centro el día 1, D1 y D2 en los días 2 y 3, el interruptor el día 4). | Se queda (decidido por Eric), contado en días de ruta, **para todos, también en la gratis** y sin vuelos. | GUIA §6 lo pone como de pago («el orden de los días según los vuelos»), pero el orden nuevo no depende de los vuelos. |
| 5.2 **CHOCA** | El interruptor bloqueado: «no puedes mover este día». | Funciona siempre: el día con la reserva del viajero se queda en su fecha y los demás se colocan alrededor. | R1 y R7. |
| 5.3 **CHOCA** | Sin vuelos, no lo dice claro. | «Sin horas (y en la gratis), el primer y el último día de ruta son días enteros normales: una reserva grande en ellos cambia los dos días enteros.» | Fallo 8 de la 6k (PENDIENTES_6K). |
| 5.4 **CHOCA** | La última mañana: «si no cabe entera, lo del final a «Si te sobra tiempo»»; «3 h o más»; prueba «nunca una parada después de salir − 1:00». | Filas por la hora de salir: antes de las 13:00, solo el traslado; de 13:00 a 14:29, la mañana sin comida (lo escrito después de la comida, a «Si te sobra tiempo»); desde las 14:30, con comida. Cada fila, una **lista escrita**; si una no cabe en la prueba, a PREGUNTAS, sin recortar en el motor (HUECOS 3). | R4 y R2. Las dos formas dan lo mismo (3 h desde las 9:00 hasta salir − 1:00 = salir a las 13:00 o más tarde). |
| 5.5 **FALTA** | Las vueltas de tarde y de noche: con un vuelo a las 23:00 desde Fiumicino (salir a las 20:00), solo una mañana y la tarde vacía. | Filas para salir a las 14:30–19:59, 20:00–22:29 y desde las 22:30. **Duda 4.** (HUECOS 4) | Ninguna hora de salida sin su fila. |
| 5.6 **CHOCA** | Qué media mañana: «con el D1 y el D2, el DT-medio». | La primera que no repita lo principal ya visto de día: D0-medio (San Pedro), DT-medio (el Pincio y el Popolo), DA-medio (el Aventino), mañana del D6 (la Cúpula). El 25 de diciembre y el domingo de Pascua, sin el D0-medio. **Duda 4.** (HUECOS 13a, 13c) | El Centro nuevo ya lleva el Pincio y el Popolo: el DT-medio lo repetiría casi entero (el revisor B ya lo vio). |
| 5.7 **CHOCA** | Reserva grande en la llegada (libre desde las 13:00) o en la última mañana: «solo su bloque», «se mira si cabe», la hoja «Ese día sales hacia el aeropuerto a las 12:00…». | Mantener el bloque, siempre entero, sin mirar si cabe; el Foro siempre con el Coliseo; el miércoles, la Plaza y la Basílica nunca antes de comer; fuera la hoja con la hora. **Duda 1.** Y los casos que faltaban: la Galería con 3 días de ruta (no hay D4: va su bloque), el orden del bloque y la ruta en la llegada (lo que va antes y lo que va después, regla 4), dos reservas grandes el mismo medio día, la reserva antes de estar libre (se queda, con el aviso) (HUECOS 11). | R7 («todo o nada», GUIA §2), R3, R4; 6k: «el Foro va siempre con el Coliseo». |
| 5.8 **CHOCA** | Viajes cortos con vuelos: con 2 días de ruta, el Centro, el D1 y el Vaticano por fuera; con 1, el Centro y el D0-medio. Lo que no entra desaparece. | Libre antes de las 13:00, el día 1 es su día escrito entero (Centro, D1 o D0); desde las 13:00, el Centro por su tramo. Lo que el tramo deja fuera y los imprescindibles sin día, a «Si te sobra tiempo». **Duda 2.** (HUECOS 2, 8) | R2. El revisor B (9-oct): «2 días con vuelos sin Coliseo ni Vaticano». |
| 5.9 **CHOCA** | El D4, «siempre» en su versión «Con Free Tour de mañana». | Salvo que el día 1 no viera de día Trevi y la Plaza de España (llegada de 17:00 a 20:29 desde Navona, o desde las 20:30): entonces, su versión de siempre (HUECOS 2). | Si no, el viajero no ve nunca de día Trevi ni la Plaza de España. |
| 5.10 **CHOCA** | Los cierres: «si no se puede, con el día siguiente». | Con horas, el día de llegada y el de vuelta nunca dan ni reciben un día entero por un cierre; si no queda otro, «Cerrado hoy» con su aviso (HUECOS 14). | El día siguiente puede ser un medio día. |
| 5.11 **CAMBIA** | «La regla 11c cuenta los días del viaje por sus fechas.» | Por los días de ruta: con 1 o 2, la nocturna puede ser un sitio visto ese día; con 3 o más, no. | Ya no hay «2,5 días» (revisor B). |
| 5.12 **CAMBIA** | «Los medios días de tarde ya no se usan.» «El D1-corto ya no sale.» | Se queda, y en el documento una línea en cada uno: «ya no se usa (Tanda 7)». | Una sola versión. |
| 5.13 **SOBRA** | La excursión: «si con los vuelos el día 4 pasa a ser el de vuelta…» (la puso la app / la eligió), «no hay interruptor», «Ostia o Tívoli el día de vuelta». | Fuera: con el día de vuelta aparte, nunca pasa (punto 0) (HUECOS 15a). Quedan los avisos de una excursión **reservada** el día de llegada o el de vuelta. Ostia o Tívoli reservada el día de vuelta: sin aviso si la hora de salir es a las 15:00 o más tarde (con Fiumicino, vuelo a las 18:00), para todos los puntos (HUECOS 15b). | Punto 0. R1. |

## 6. Punto 5: la «Llegada a Roma» (el día 1)

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 6.1 **CAMBIA** | La tabla de tramos. | Se queda, con su fila para cada hora, y dicha como lista escrita por fila y por inicio (Navona o la Plaza de España): 12 listas. | R4. |
| 6.2 **CHOCA** | La comida: «de 13:00 a 14:30, comida; de 14:30 a 17:00, sin comida». | La frontera, a las 15:00 (HUECOS 12a). | La tabla puso 14:30 «porque la regla 6 lo decía» (PROPUESTA 181); la regla 6 dice desde el 9-oct «antes de las 15:00» (Eric, tras su viaje). Lo digo en la duda 3. |
| 6.3 **FALTA** | La fila de 20:30 a 23:00 no lleva cena. | Propuesta: la cena antes de Trevi si está libre antes de las 22:00. **Duda 3b.** (HUECOS 12b) | A las 20:45 se cena en Roma. |
| 6.4 **FALTA** | Las paradas de la ruta del centro no llevan sus minutos (línea 980). | Los de la regla 3 y los días escritos: Navona ~45, Trevi ~45, Plaza de España ~45, Via Condotti ~15, Escalinata y Trinità ~20, Terraza del Pincio ~20, Piazza del Popolo ~20. **El Panteón por fuera no tiene minutos en ningún sitio:** propongo ~30 («por fuera, los demás», regla 3). | Sin minutos, el motor no coloca la comida y el convertidor daría dudas. |
| 6.5 **FALTA** | El día 1 entero (sin vuelos o libre antes de las 13:00) acabaría hacia media tarde (cuenta mía aproximada: unas 4 h 30 de paradas y paseos más la comida). | Dejarlo «mejor que sobre» o alargarlo. **Duda 3a.** (HUECOS 12c) | El revisor B: «la tarde vacía». Sin vuelos le sale a todos, también en la gratis. |
| 6.6 **CAMBIA** | «La comida y la cena, las de la ruta según dónde acaba.» | Se come donde esté la ruta a la hora de comer, con el restaurante de esa zona (Navona y el Panteón: Armando o Da Baffetto; el Tridente: Poldo e Gianna o Edy), sin repetir, antes de las 15:00. | Empezando a las 9:00, «Armando» caería a media mañana. |
| 6.7 **CHOCA** | «Ya lo visitaste el día 1». | «Ya lo visitaste el {día}», con `nombreDeDia`: «el mar 10» con fechas, «el día 1» sin ellas. | R11 (6z3; 6y9 P17 arregló la misma plantilla en otro sitio). |
| 6.8 **FALTA** | Lo visto de noche en la llegada. | Cuenta solo como nocturna: de día sigue siendo parada (HUECOS 21). | Si no, Trevi de noche el día 1 dejaría sin Trevi de día. |
| 6.9 **FALTA** | El mercadillo de Navona. | Del 8 de diciembre al 6 de enero, «Piazza Navona y su mercadillo navideño» también en la ruta del centro, como en el D0 y el D1 (HUECOS 24). | — |
| 6.10 **CAMBIA** | Los textos de las 20:30 y de las 23:00: «Aterrizas a las 21:00…». | Se quedan: la hora es del viajero. | R3. |
| 6.11 **FALTA** | «Aún no lo sé» en «Para tu zona». | Cuenta como Centro para empezar el día 1; en «Para tu zona», sin línea. En la gratis no hay zona: el día 1 empieza en Navona. | La zona es de pago (6v). |

## 7. Punto 6: el Free Tour

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 7.1 **SOBRA** | El Free Tour el primero en «+ Añadir parada». | Fuera. | Hecho en la 6z. |
| 7.2 **CHOCA** | «Fuera `FreeTourSheet.tsx`», «[Reservar Free Tour] abre el enlace…», «[Añadir al Día n]… «Te proponemos las {hora}»». | La hoja **se queda** como la dejó la 6y9: las 6 horas (con las 19:00), su texto «Lo ponemos al principio de tu viaje…» y [Ver disponibilidad] con nuestro enlace. | 12-oct (PENDIENTES_6K, 6y9). «Te proponemos las {hora}» choca con R3. |
| 7.3 **CHOCA** | La hoja del resumen: «Te proponemos el Free Tour de las 15:00, nada más llegar.» | «Hemos puesto el Free Tour el mar 10, nada más llegar. Al reservarlo, elige la hora que te encaje.» con [Ver disponibilidad]; la hora de la app, ya marcada en la hoja. | R3; regla 3 (sin reservar, sin hora a la vista). |
| 7.4 **CAMBIA** | «La de las 21:00, nunca sola.» | «Las de las 19:00 y las 21:00, solo si las pone el viajero.» Cena por R9. | 19:00 añadida el 12-oct; corte de la cena a las 22:00 (6y9). |
| 7.5 **FALTA** | Sin vuelos, el «Centro con Free Tour» solo está escrito con el tour de las 10:00. | Con otra hora en el día 1, la regla de la llegada con Free Tour. Con las 19:00 o las 21:00, la noche del D1 (día 2), como ahora; reservado para el día 1, la noche del día 1. **Duda 5.3.** (HUECOS 10) | Si no, horas del Free Tour sin fila. |
| 7.6 **FALTA** | Los días especiales. | El día de llegada cumple los días sin tour y los de horas especiales de `roma.json` (24, 25 y 31 de diciembre, 1 y 6 de enero: solo a las 12:00). Y el dato viejo `disponibilidad.horas` = `["10:00","16:00"]` pasa a leer `freeTourHoras.js` (HUECOS 9c, 9d). | Comprobado en `roma.json`. |
| 7.7 **CAMBIA** | Los «30 min para llegar a la Plaza de España» de la tabla. | Se quedan, explicados: el camino más los 15 min de antes de la regla 4 (HUECOS 9a). | La regla 4 (9-oct) dice 15 min antes del Free Tour; así no chocan. |
| 7.8 **FALTA** | Dónde va lo que el guía no enseña. | Con el tour de mañana, después de comer, la Trinità, el Pincio y el Popolo; con el de tarde, antes, acabando en la Trinità; nunca volver desde Navona (HUECOS 9f). Con el de las 15:00 y la comida, la regla 4 (comida corta antes; si no llega, después) (HUECOS 9e). | Sin zigzag. |
| 7.9 **CAMBIA** | «Después de las 16:30, al día siguiente a las 10:00 (D3 + D1-FT).» | Solo con 2 días de ruta enteros o más después del de llegada, y solo si ni el día 2 ni el 3 tienen una reserva grande; si no, no se pone y la hoja lo dice (HUECOS 9g). | R7: el cambio movería un día reservado. |

## 8. Puntos 7 y 8: la excursión, las reservas y los vuelos

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 8.1 **CHOCA** | «…y ese día sales hacia el aeropuerto a las 14:00. Revisa tu reserva.» | «Tu entrada a los Museos Vaticanos es a las 15:00 y tu vuelo sale a las 17:00: no te da tiempo. Revisa tu reserva.» Con las palabras del medio (vuelo, tren, autobús, barco; aterrizas, llegas a, desembarcas) en todos los textos (HUECOS 20a). | R3. |
| 8.2 **CAMBIA** | «…y aterrizas a las 9:30: no llegas a tiempo.» y la de la excursión. | Se quedan (horas del viajero). Por dentro, con «libre», sin margen; la que acaba después de salir, con lo que dura la visita en los datos (HUECOS 11e, 11g). | R3. |
| 8.3 **HECHO** | El aviso de un sitio que cierra ese día. | Ya existe (6y5, GUIA §2). Usarlo. | — |
| 8.4 **CHOCA** | «Esto sustituye la excepción de la 6j cuando hay vuelos.» | Sin vuelos, días enteros normales; con vuelos, en un día de en medio, los dos días enteros; en la llegada o el día de vuelta, el bloque (duda 1). Reserva pequeña: solo su parada, sin quitar nada (R7, GUIA §2). | Fallo 8 de la 6k. |
| 8.5 **FALTA** | El horario de la fecha. | El día de llegada y el de vuelta, con `horarioDeLaFecha`; sin fechas, el día 15 del mes. | R8. |
| 8.6 **FALTA** | La excursión reservada el día de llegada, después de estar libre. | Ese día lleva la excursión; la ruta del día 1 se coloca como con una reserva grande en otro día; lo que se quede sin día, a «Si te sobra tiempo» del día 2 (HUECOS 15d). | R2. |

## 9. Punto 9: los avisos

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 9.1 **HECHO** | «Una sola hoja para toda la app.» | Ya existe `HojaAbajo` y la usan ya varias pantallas. Solo las hojas nuevas, con ella. | Código actual. |
| 9.2 **CHOCA** | «…antes de salir hacia el aeropuerto a las 15:00.», «El día 3 lo has cambiado tú…». | «El sáb 14 tienes una última mañana por Roma antes de irte al aeropuerto.» «El jue 12 lo has cambiado tú: lo dejamos como está.» Sin fechas, «el día 1» (HUECOS 20b). | R3, R11. |
| 9.3 **HECHO** | La campana. | Ya existe, con el aviso «coinciden». Usarla. | Código actual. |

## 10. Punto 10: lo viejo que se quita

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 10.1 **HECHO** | Quitar `FirstLastDayCard` y «Libre hacia las…». | Ya no existen (6s, 6t). | Código; NOTAS_TANDA7 (9-oct). |
| 10.2 **SOBRA** | «`PaceWandPrompt.tsx` usa `flightOpportunity`.» | Fuera: ya no existe. Quedan `ReservasPanel.tsx`, un comentario de `stopScheduling.ts`, `types.ts` y la prueba `_6z3_entrada.tsx`. | Código. |
| 10.3 **SIGUE** | «¿Ajustamos tu ruta a tu vuelo?», `flightAdjust`, «Ajustar este día…», `fitMealsToStops`. | Siguen en el código (`FlightAdjustSheet.tsx`, `onGuardada` en `LlegadaYVuelta.tsx`, `setFlightAdjust`, los botones de `DayDetailPanel.tsx`, `fitMealsToStops` en `arrivalReturn.ts`). Se quitan. | NOTAS_TANDA7: la 6s no los quitó. |
| 10.4 **FALTA** | — | `_llegada.json`, `ultima_tarde`: fuera «sal a la hora que te marcamos». | R3. |

## 11. Punto 11: «Para tu zona» y la ventana

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 11.1 **CAMBIA** | La tabla «Cómo llegar a tu zona». | Se queda (líneas que la app ya tiene). Pendiente del «sí» de Eric (duda 5.4). | PENDIENTES_LLEGADAS. |
| 11.2 **CHOCA** | «Si llega después del último tren, lo primero es el taxi.» | Solo donde hay dato: el Leonardo Express desde el aeropuerto (primero 5:38, último 23:23), que **vale del 14 de junio al 12 de diciembre de 2026** según su fuente. Como tramo de fechas; también antes del primer tren; el margen, de los datos. Fuera de ese tramo y en Ciampino, Tiburtina y Civitavecchia, no se aplica (HUECOS 18). | R8. No inventar. |
| 11.3 **CHOCA** | «Los textos con «centro» pasan a «a Roma» o «a tu zona».» | Solo nuestras frases (el subtítulo «Cómo llegar al centro desde tu punto de entrada en Roma»). Los datos reales se quedan. | GUIA §5, NOTAS_TANDA7. |
| 11.4 **FALTA** | Nada sobre empresas. | Fuera de la ventana: «(Terravision)», «(Rome Airport Bus)», «ATRAL», «KiPoint/KiBag» y «la app de Trenitalia». Quedan las líneas (Leonardo Express, Airlink, FL1), el andén, el precio y el tiempo. | R5, GUIA §5. |
| 11.5 **CAMBIA** | «A Prati va por taxímetro.» | Lo del dato: tarifa fija dentro de las murallas; fuera («Prati alto, el EUR»), taxímetro. | Manda el dato. |
| 11.6 **FALTA** | El tren de Civitavecchia y Roma Trastevere. | Se queda «no lo inventes»: el dato solo dice San Pietro, Ostiense y Termini. | — |

## 12. Puntos 12 a 14

| # | Qué dice ahora | Qué debe decir | Por qué |
|---|---|---|---|
| 12.1 **SOBRA** | `preguntar_movilidad` por destino. | Fuera: ninguna pantalla lo usa. | R13. |
| 12.2 **CAMBIA** | Las reglas reciben ciudad, hora y punto. | Y leen del destino sus tablas, listas, sitios grandes y bloques. | Hallazgo de la 6y9: `RESERVAS_GRANDES` es una lista fija de Roma. |
| 13.1 **CHOCA** | «Con las 365 fechas de 2027.» | Muestra de unas 60 fechas durante la tanda; push; las 365 después, en un commit aparte. | REGLA DE PRUEBAS (12-oct). |
| 13.2 **CHOCA** | Horas de prueba sueltas. | Las de los **bordes** de cada fila, para cada punto, más la medianoche. | Con filas, el fallo está en los bordes. |
| 13.3 **CHOCA** | Pruebas 6 y 10. | La 6: «cada lista del día de vuelta cabe con la hora más temprana de su fila». La 10: «0 horas calculadas, 0 empresas, «centro» solo en datos». | 5.4 y 3.5. |
| 14.1 **CHOCA** | «Qué es gratis y qué es de pago» no va. | Sí va: está decidido. | R6, GUIA §6, 6s, 6z6b. |
| 14.2 **CHOCA** | «La pestaña HOY en detalle» no va. | HOY (de pago) el día de llegada y el de vuelta: «Llegada a {punto}» con [Cómo llegar a tu zona]; «Llegada al aeropuerto…» con [Cómo llegar]. | PENDIENTES_LLEGADAS («la siguiente parada puede ser «Llegada al aeropuerto»; [Cómo llegar]»). |
| 14.3 se queda | El crucero, la zona para la vuelta, varias ciudades. | Fuera. | R13. |

---

## 15. Lo que falta del todo (no estaba en la Tanda 7)

1. **Cómo se cuentan los días** (punto 0).
2. **Una fila para cada hora de salida de la tarde y la noche,** y qué media mañana sin repetir (duda 4).
3. **Los viajes cortos y lo que la llegada deja fuera** (duda 2).
4. **La versión gratis, escrita:** sin «Llegada y vuelta» («x de 2»), sin zona, días enteros con el orden nuevo y el día de vuelta como ahora; barra con flecha; ventana con todos los puntos y sin «Para tu zona»; sin hoja del resumen ni avisos de vuelos. Horas guardadas que no se usan si se ve en la gratis o deja de pagar (HUECOS 17b).
5. **HOY el día de llegada y el de vuelta** (14.2).
6. **La ruta a mano con vuelos** (PENDIENTES_LLEGADAS: «Decidir»). Lo resuelvo con la regla de la 6y («la app no mete nada sola, no reordena nada»): las horas solo ponen las barras, «Día de viaje» y los avisos de reservas contra el vuelo; nunca recortan un día. No hace falta preguntarlo: sale de la regla de Eric.
7. **El título de un día de llegada o de vuelta sin paradas** (4.3).
8. **Un punto sin elegir, la medianoche, la madrugada y los medios mezclados** (2.3, 2.6, 3.2 a 3.4).
9. **El aviso cuando cambian las fechas y ya hay vuelta** (2.4).
10. **El Free Tour a otra hora en el día 1 sin vuelos, los días especiales y el orden de lo que el guía no enseña** (7.5 a 7.9).
11. **El primer y el último tren por tramos de fechas** (11.2).
12. **Los nombres de empresas de la ventana** (11.4).
13. **El D4 cuando el día 1 no vio de día Trevi ni la Plaza de España; los cierres con días cortos; lo visto de noche; el mercadillo** (5.9, 5.10, 6.8, 6.9).

## 16. Datos que no están en los documentos (no inventarlos)

- El primer y el último tren o autobús desde Ciampino, Tiburtina (tren y autobús) y Civitavecchia.
- El Leonardo Express después del 12 de diciembre de 2026 (el dato es del horario de verano).
- Si el tren de Civitavecchia para en Roma Trastevere.
- Los minutos del Panteón por fuera (propongo ~30 por la regla 3).
- La hora de empezar del D0-medio, el DA-medio y la mañana del D6 (solo está la del DT-medio, a las 7:30) (HUECOS 13b).
- Los turnos de la Galería, el horario de los Museos de lunes a sábado y el Coliseo de febrero y marzo de 2027: sin verificar en la web oficial (PREGUNTAS_TANDA6Y9, 1). Afectan a las reservas grandes de la llegada y del día de vuelta.
- Un dato caducado en `_llegada.json` (no es de esta tanda, pero sale en la ventana de vuelta): el consejo «Controles en los vuelos con España» tiene `hasta: 2026-10-01`. Si la app ya lo esconde por la fecha, no hay nada que hacer; si se prorrogó, hace falta su nueva fecha y fuente.
- La comida del DA-medio en domingo (el Mercado de Testaccio, «por comprobar» en PENDIENTES_6K) (HUECOS 13f).

## 17. Lo que no he tomado de HUECOS.md (y por qué)

- **Pasar el Free Tour de las 19:00 o las 21:00 a la noche del día 1** (HUECOS 10): lo dejo como pregunta pequeña a Eric (duda 5.3), con mi propuesta de no moverlo; repetiría esa misma noche lo que vio por la tarde.
- **Los avisos «Tienes paradas antes de tu llegada / después de tu vuelo» en la ruta a mano** (HUECOS 17c): para saberlo hay que calcular la hora de cada parada, y en la ruta a mano la app no ordena ni cuenta nada. Fuera.
- **Una reserva pequeña el día de vuelta que no cabe → «Si te sobra tiempo»** (HUECOS 11h): la guía dice que una reserva pequeña «del día al que llega no se quita nada». Se queda así.
- **Con 2 días de ruta y sin última mañana, el D0 en el día 2** (documento, «Con un solo día entero»): el día de en medio no se mueve por la hora de la vuelta (HUECOS 8c, de acuerdo).

## 18. Una mejora posible (no la pongo en la v2)

Con el Free Tour de las 19:00 nuevo, quien está libre entre las 16:30 y las 18:30 el día de llegada podría hacer el tour esa misma noche, en lugar de pasarlo al día 2 y cambiar el Coliseo y el Vaticano de día. La v2 sigue lo decidido (las 19:00 y las 21:00, solo si las pone el viajero). Si a Eric le gusta, es una línea en la tabla del Free Tour.
