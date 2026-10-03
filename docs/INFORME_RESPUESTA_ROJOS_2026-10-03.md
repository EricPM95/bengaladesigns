# Respuesta a tu respuesta: lo hecho tras el informe de los rojos

Commits sin push. Pruebas completas pasadas al final: las 365 fechas (6 180 viajes), 17 155 reservas simuladas y 4 380 viajes con Free Tour. Detalle en `docs/MEDIR_ENTRADAS_ROJOS_2026-10-03.md`, `docs/MEDIR_FT_ROJOS_2026-10-03.md` y `docs/PRUEBA365.md`.

## 🔴 En rojo, arriba

**Todo en 0 después de volver a los 30 minutos:** hora fija rota, sitio cerrado a su hora, imprescindible quitado sin aviso y lugar repetido el mismo día. En las reservas simuladas y en los viajes con Free Tour, 0 en las cuatro cosas. La prueba de las 365 fechas baja de 522 a **484** casos.

Dos cosas que ves en la prueba de las 365 fechas y que no son nuevas:

- La Basílica por fuera en un día de Vaticanos: **2 casos** (24 y 31 de diciembre, D3 con Free Tour). Como dijiste, se queda así; ahora lleva el aviso de la campana (abajo).
- «Hora que no cuadra» (115), «huecos de más de 20 min» (165) y «repetido otro día» (69) se quedan como estaban en la prueba anterior.

## A. Los 30 minutos

Quitado lo de «hasta 10 min antes vale»: a una entrada reservada se llega siempre 30 min antes (INVARIANTES 469 corregida). Lo demás que cambié sin que estuviera en el encargo queda como aprobaste.

- **Reservas que dejan de caber: 0.** Todas siguen saliendo a su hora. Lo que cambia es que algunas llevan un aviso en la campana.
- **El aviso sale en 302 reservas, y es casi siempre el mismo caso: D2 con la entrada a las 13:00** (301 fechas del año; el otro caso es una entrada de las 8:00 el Viernes Santo). Pizzarium está a 9 min andando de la entrada de los Museos, la comida más corta que hay son 30 min y empieza como pronto a las 12:00: llegas 9 min más tarde de los 30 min recomendados. El aviso dice: «Llegarás 9 min más tarde de lo recomendado (30 min antes de tu entrada)», con la sugerencia «Come más deprisa o elige una entrada un poco más tarde». Para que no saliera haría falta empezar a comer a las 11:51 en vez de a las 12:00: **dime si lo cambio.**
- **Qué se recorta en cada caso** (lo que se quita antes de la hora fija): primero los opcionales, que salen en silencio (la Cúpula de San Pedro en 1 129 casos de D2 de mañana, Santa Cecilia en 108, el Desayuno romano en D4, el Ara Pacis en las entradas de mediodía); no hay ningún caso en que haga falta recortar la elástica o la comida más allá de su mínimo, salvo el de las 13:00.

## B. Las decisiones

- **2. Basílica el 24 y el 31 de diciembre (D3 con Free Tour):** se queda así y sale el aviso en la campana con la hora de ese día sacada del dato: «Hoy la Basílica cierra a las 15:00; si quieres entrar, ve otro día del viaje.» (el 31, a las 14:30). El aviso sale también cuando la Basílica va por fuera en otro día de Vaticanos.
- **3. Jueves Santo con entrada a los Museos (25 de marzo de 2027):** la Plaza de San Pedro sale siempre. La Basílica abre ese día a las 12:00 y, si la entrada la pisa, **va después de los Museos** (antes, se quitaba todo lo demás). Lo que sale con cada hora de entrada (Plaza / Basílica):

  | Entrada | Plaza | Basílica |
  |---|---|---|
  | 8:00, 8:30, 9:00 | 11:10 a 11:30 | 12:00 |
  | 9:30 | 12:40 | 13:20 |
  | 10:00 | 13:10 | 13:50 |
  | 10:30 | 13:40 | 14:20 |
  | 11:00 | 14:10 | 14:50 |
  | 11:30, 12:00, 12:30 | 7:30 | 14:40, 15:10, 15:40 |
  | 13:00 (aviso de 9 min) | 7:30 | 16:10 |
  | 13:30, 14:00, 14:30, 15:00 | 7:30 | 16:40, 17:10, 17:40, 18:10 |
  | 15:30, 16:00 | 7:30 | 12:00 (antes de los Museos) |

  En ningún caso la Basílica queda sin sitio. Con la entrada de las 15:30 y las 16:00 salen avisos de «no te dio tiempo» de lo menor (Janículo, Trastevere, Castillo): el día lleva la Plaza, la Basílica a las 12:00 y los Museos. Está sacado con `scripts/destino/_juevesSanto.mjs`.
- **4. Parque de Villa Borghese dos veces en D4:** se queda; la prueba no lo cuenta como repetido (ya estaba así).
- **5. Passeggiata del Gianicolo de 65 a 70 min los lunes:** se queda; la prueba sube su límite a 70 min. «Tiempo libre de más de 30 min» baja de 94 a 56.
- **6. Último domingo de mes:** el día va sin Museos; la ficha de los Museos Vaticanos, en **Entradas**, dice ahora: «Último domingo de mes: entrada gratis de 09:00 a 12:30 (última entrada), sin reserva y con mucha cola. No vale si cae en Pascua, el 29 de junio, el 25 o el 26 de diciembre ni el 31 de diciembre.» (sacado del dato que ya comprobé en museivaticani.va).
- **7. El Castillo en la pantalla:** hecho. En el Castillo (y en cualquier parada escrita «por fuera» a propósito) **ya no sale «Hoy lo ves por fuera para llegar a todo lo del día» ni el botón «Quiero entrar»**: sale «Por fuera» y el texto `por_fuera` de la ficha, una sola vez. Captura: `docs/capturas/castillo_por_fuera_2026-10-03.jpg` (día 2, 14 de octubre). Nueva clase `a_proposito` en el motor y en la app.
  - **Viajes de 1 y 2 días, como están hoy:** el Castillo sigue saliendo como antes: «Hoy lo ves por fuera para llegar a todo lo del día» y con «Quiero entrar» (comprobado con un viaje de 2 días). Cuadra con lo que dices, porque ahí el viajero puede marcarlo en el pool. Solo me chirría el texto, que para el Castillo sigue siendo falso en esos viajes: dime si lo cambio ahí también.
- **8. D4 en verano, entrada a las 17:00 o a las 17:45:** comida tranquila. Con la entrada de las 17:00, a las 14:30; con la de las 17:45, a las 15:00 (jueves 1 de julio comprobado). El rato que sobra antes de la entrada es margen y no cuenta como hueco hasta 60 min. **Huecos de D4 de tarde: de 112 a 6.** Con las entradas de las 17:00 y de las 17:45 ya no queda ningún hueco de más de 30 min; los 6 que quedan en D4 de tarde son de las 16:00 (de 33 a 38 min antes de la Terraza del Pincio, en mayo).

## C. Los huecos

- **9. Basílica de San Pietro in Vincoli: no la he añadido.** Tiene ficha en `roma.json` (nivel 2, gratis, 20 min, a 5 min del Coliseo), pero su horario sale de una web no oficial: lateranensi.org (la oficial) no responde y turismoroma.it no da horario. El horario que tengo: **de 8:00 a 12:30 y de 15:00 a 18:00; de abril a septiembre la tarde llega hasta las 19:00; cerrada a mediodía**, confianza «media». Cuadra con las entradas de las 17:30 y de las 18:00 (que solo existen de primavera a verano, con la tarde abierta hasta las 19:00), pero como no es el dato oficial, te pido que me lo confirmes o me mandes la ficha. Los huecos de D1 de tarde, ya con la comida más larga, quedan en 71 (antes 431): 15:30 (68 casos: 34 min antes de Navona al atardecer), 16:00 (3). **Las entradas de las 17:30 y las 18:00 ya no dejan huecos de más de 30 min** (eran 351 casos).
- **10. Esperas antes de un atardecer: ninguna elástica las absorbe, y te digo por qué en cada caso. No lo he arreglado.**
  - **D4 a las 9:00 y a las 10:00 en invierno** (35 a 55 min antes de la Terraza del Pincio, 94 y 108 casos): en la tarde de esas dos variantes (`entrada:nueve` y `entrada:diez`) **no hay ninguna parada elástica** (`elastica`), así que no hay nada que se estire. Antes del atardecer lo último es «Jardines del Pincio», que el tiempo libre ya estira hasta su máximo de paseo (90 min) y aun así faltan de 35 a 55. Ejemplo: viernes 19 de febrero de 2027, entrada a las 9:00: Jardines del Pincio 14:20-14:40 (estirado), Terraza del Pincio a las 17:25.
  - **D2 los miércoles con la entrada de mediodía** (33 a 53 min antes del Puente Sant'Angelo, 55 casos): la única elástica de ese día es **Borgo Pio, y va antes de los Museos**, en la mañana; al cerrar la comida después de los Museos no hay ninguna elástica en la tarde. Ejemplo: sábado 2 de enero de 2027, entrada a las 11:30: Puente Sant'Angelo a las 16:20 con 33 min de espera.
- **11. D1 de mañana, de 33 a 48 min antes del Panteón (49 casos):** **no es un hueco real y la elástica no tiene nada que ver (D1 no tiene ninguna).** Es un fallo de la prueba: la parada de antes (la Plaza del Campidoglio) se estira 10 min y termina después de que empiece la comida, así que la prueba no la reconoce como «viene de comer» y cuenta la comida como espera. Ejemplo: jueves 1 de julio, entrada a las 11:00: el Campidoglio llega hasta las 14:50, se come de 14:40 a 15:30 y el Panteón es a las 15:50. Lo dejo así; tendrías que decirme si arreglo la prueba o que la parada de antes no pise la comida.

## Informe: tabla de huecos de más de 30 min, antes y ahora

| Día · franja | Caben antes | Huecos antes | Caben ahora | Huecos ahora |
|---|---|---|---|---|
| D1 · mañana | 5092 (100 %) | 49 | 5092 (100 %) | 49 |
| D1 · tarde | 1427 (99,9 %) | 431 | 1427 (99,9 %) | 71 |
| D2 · mañana | 2107 (100 %) | 0 | 2107 (100 %) | 0 |
| D2 · mediodía | 903 (100 %) | 53 | 903 (100 %) | 55 |
| D2 · primera tarde | 899 (100 %) | 0 | 899 (100 %) | 0 |
| D2 · tarde | 1196 (100 %) | 1 | 1196 (100 %) | 0 |
| D4 · nueve | 311 (100 %) | 94 | 311 (100 %) | 94 |
| D4 · diez | 311 (100 %) | 108 | 311 (100 %) | 108 |
| D4 · mañana | 311 (100 %) | 0 | 311 (100 %) | 0 |
| D4 · mediodía | 933 (100 %) | 0 | 933 (100 %) | 0 |
| D4 · quince | 311 (100 %) | 12 | 311 (100 %) | 12 |
| D4 · tarde | 933 (100 %) | 112 | 933 (100 %) | 6 |

El Free Tour sigue en el 100 % en los 12 casos (3, 4 y 5 días × mañana, tarde 16:00, tarde 17:00 y noche), con 81 casos «con aviso».
