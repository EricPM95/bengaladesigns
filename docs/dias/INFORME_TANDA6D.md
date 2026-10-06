# Informe de la Tanda 6d

Todo hecho y comprobado. No he hecho push. Lo que he decidido yo está en `PREGUNTAS_TANDA6D.md` (22 puntos). Las sugerencias que salen están en `INFORME_TANDA6D_SUGERENCIAS.md`.

## 1. Reservas a otra hora: ya están escritas

- **D1 con el Coliseo** a media mañana (10:30–12:00), a mediodía (12:30–15:00) y por la tarde (16:00 o más), cada una con su lista del documento: con el Coliseo a las 12:00, Arco y Foro, «Llegada a…», Coliseo, y después los Fori Imperiali, el Campidoglio y el Altar; con el Coliseo a las 14:00, el Campidoglio, el Altar y el Foro por la mañana, la comida en Monti, y después el Coliseo, el Arco, el Panteón y Navona (el Barrio Judío y las iglesias, a «Si te sobra tiempo»); con el Coliseo a las 16:00 el día va al revés y acaba en el Coliseo.
- **D2 con los Museos a las 15:00 o más tarde:** la Cúpula a primera hora (si el viaje no lleva el D6), la Basílica, la Plaza, el Castillo por dentro y el Puente; comida en Prati; los Museos; y al salir, la Plaza iluminada; cena en Trastevere, taxi. La Isla Tiberina, Santa Maria in Trastevere y el Janículo, a «Si te sobra tiempo».
- **D2 en miércoles sin Museos:** empieza a su hora (9:00) con el Castillo por dentro, el Puente y el Lungotevere; la Plaza y la Basílica desde las 12:30. Ya no hay ninguna excepción de «el día empieza más tarde».
- La regla general (la 4) queda para las horas sin lista escrita.
- Para que estas listas salgan bien he tenido que arreglar el motor: la comida escrita justo antes de la hora fija se queda antes, y cuando algo no cabe antes de una hora fija se acorta (de por dentro a por fuera, de por fuera a de camino) **antes** de quitar nada.
- **`VIAJES_LISTAS.html`** tiene ahora un viaje por cada hora: el D2 con los Museos a las 9:00, 11:00, 14:00 y 16:00 y el D1 con el Coliseo a las 9:00, 11:00, 12:00, 14:00 y 16:00 (y el ejemplo de HOY y la tarjeta de descanso de la 6c).

## 2. Sugerencias de «Vas bien de tiempo»

1. **Nada que ya salga en el viaje**, ni días antes ni después, ni en la noche de ese mismo día. Fuera «Lo tienes el día n».
2. **Lo lejano, solo antes de cenar.** Antes de comer, solo lo que queda cerca de donde empieza la tarde (10 min andando o menos). En el D4 ya no se sugiere Campo de' Fiori ni los Mercados de Trajano antes de comer. La única excepción es lo que el propio documento sugiere para ese día (la Columna y los Mercados de Trajano en el D1).
3. **Si se cambia la cena de zona, la noche sigue cerca** (taxi de 15 min o menos); si no, va la nocturna más cercana a la nueva cena que no haya salido, y al añadir la sugerencia se cambia también la nocturna del día.
4. **Coming Out es un pub:** ya no sale como sitio para comer ni cenar.

## 3. Pequeños

- **Espera:** cambiada con tu mensaje: hasta 15 min en general y hasta 40 si lo de antes es una plaza o un sitio al aire libre justo al lado. En el D4, la Piazza del Popolo (~30) y Santa Maria del Popolo se ven por dentro a las 16:00. Más de 40 min: por fuera, con su aviso. En HOY, al llegar antes: «Santa Maria del Popolo (los Caravaggio) abre en 20 min. Mientras, haz unas fotos en la Piazza del Popolo» (en la tarjeta de la parada y en «A continuación»).
- **El hueco antes de una reserva:** si antes de una «Llegada a…» sobran más de 30 min, HOY dice «Tienes 48 min antes de tu entrada» con sugerencias cercanas. En el D1 con el Coliseo a las 12:00, la primera es San Pietro in Vincoli.

## Respuestas a la 6c

Quitado el ajuste aparte del Popolo (el documento ya dice ~30); el miércoles del D2 y el hueco antes de una entrada ya están resueltos como pediste; «Trevi» como zona se queda; Piperno se queda, con las coordenadas aproximadas.

## Resultado de la prueba

- **189.800 viajes** (todas las duraciones, 365 fechas, Free Tour, medios días, pool, reservas, lluvia): **0 fallos** (con las comprobaciones nuevas y más horas de reserva: Coliseo 11:00, 14:00 y 18:00; Museos 9:00, 11:00, 16:00 y 17:30).
- **Prueba nueva de sugerencias:** 518 momentos, 1.480 sugerencias, 0 fallos.
- **Por qué la prueba de antes no veía lo que enseñaste:** solo probaba el Coliseo a las 9:30, 12:00 y 16:00 y los Museos a las 14:00; no había nada que mirara si una sugerencia ya salía en el viaje o en la noche, ni si lo lejano caía antes de comer. Todo eso se comprueba ahora.
- **Fallos que salieron por el camino y arreglé:** la alternativa de lluvia del D1 rompía una comprobación en la versión de mediodía (ahora no se aplica esa parte); acortar algo cuando después hay que esperar a una hora no servía de nada (ahora solo se acorta si adelanta de verdad).

## Casos que siguen sin caber (apuntados, no son fallos)

1. **Free Tour de mañana + Museos a las 14:00 el mismo día** (ya de antes).
2. **Roma en un día (D0) con el Coliseo entre las 13:00 y las 15:30:** llega tarde (150–200 min): lo de antes es todo imprescindible y no hay lista escrita. **Necesito tu decisión** (pregunta 9).
3. **Excursión de medio día + Coliseo a las 16:00:** la ciudad empieza a las 16:00 y la lista de tarde no cabe antes (pregunta 21).

## Lo que debes mirar

- Lungotevere (sitio nuevo) y las coordenadas del Foro por lados: aproximadas.
- L'Arcangelo solo abre a la cena según los datos: a la comida de Prati va Osteria dell'Angelo (que he pasado a «ambos»).
- No he probado la pantalla a mano en el móvil. tsc sin errores; servidor reiniciado y `/api/check-time` probado con un cambio de cena y de noche; `/api/rebuild-day` y `/api/adjust-day` siguen respondiendo.
