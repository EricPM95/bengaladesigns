# Informe de la Tanda 6x

## Qué días cambian por el convertidor (y si alguno no sale como está escrito)

- **D0.** Coliseo por la mañana: ahora Campidoglio antes que el Foro desde la terraza. De 12:30 a 14:00 (una sola lista): la Roma antigua por la mañana (Piazza Venezia, el Altar por fuera, el Campidoglio, la terraza, Via dei Fori, el Coliseo y el Arco) y San Pedro por la tarde (taxi a Navona, Panteón, Navona, Puente, Castillo, Conciliazione, la Plaza y la Basílica, y luego la Plaza de España). De 14:30 en adelante: el Coliseo y el Arco, y después el Campidoglio, la terraza y el Altar. *No sale exactamente como está escrito:* la comida (pregunta 1).
- **D1.** De 10:30 a 12:00: Piazza Venezia por la mañana y el Altar por dentro después de comer. Por la tarde: Piazza Venezia y el Altar por dentro por la mañana, y el Campidoglio, Via dei Fori, el Arco y el Coliseo por la tarde.
- **D1-FT.** El Tempietto con su cierre del lunes; con el Coliseo por la tarde, Trastevere por la mañana sin el paseo y, al final, el paseo y la cena en Trastevere; la Galería y el Ojo ya no quitan la Isla Tiberina ni Trastevere. El Free Tour de «otra parte» (cuando los Museos van otro día) con la Roma antigua en el orden nuevo.
- **D2.** Museos de 9:30 a 11:30 (la Basílica antes) y de 12:00 a 14:30 (la comida antes; de 12:00 a 13:00 rápida); los de la tarde, en tres listas (15:00, 16:00 y 17:00 o más), con el paseo y la cena en Trastevere; la Cúpula no va con el Vaticano por la tarde.
- **D3.** La tabla de seis filas; el Free Tour de las 12:00 con los Museos de 16:00; el de las 15:00 y el de las 17:00, con el Puente y el Castillo después del tour y la cena en Prati; quitado el bloque viejo de los Museos de 13:30 a 14:30; lo del guía «por libre» como paradas (Plaza de España, la Escalinata, Trevi, el Panteón y Navona).
- **D4.** La Galería de 12:00 (el parque antes, por Via Veneto); de 13:00 a 17:45, al revés, con el lago después de la Galería; la de las 17:45 dura 1 h 15.
- **D5.** La Domus Aurea, con su cierre del primer domingo.
- **Noches** sin «iluminada» ni «de noche»: sin problema.

## Los 63 casos de la 6w y lo que pasa a «cerrado»

Quedan **0**. Para llegar a 0 hubo que dejar que lo nuestro pase detrás de la reserva, también los imprescindibles por dentro (la Basílica, el Panteón), salvo el Foro y el Palatino antes del Coliseo, que por su horario no pasa detrás. Lo que pasa detrás y llega cerrado es un cierre: hoy sale **por fuera, con su aviso**. Ejemplos: la Basílica con el Free Tour a las 12:00 y los Museos a las 17:00, y el Panteón con el Free Tour a las 17:00 (el sábado no deja entrar desde las 17:00).

## Los «Si te sobra tiempo» que quedan (255, 31 y 61 en la prueba a una de cada 10 fechas; antes de esta tanda eran 292, 68 y 135)

Ahora la prueba los separa por causa. En los de 1-2, 3 y 4 días son **todos de días sin reserva, por el tiempo** (reglas 5 y 6), salvo 2 en los de 4 días, que son un cierre. **Ninguno es de un día con reserva por falta de tiempo** (eso ya es un fallo de la prueba y no sale).

## Las franjas, sin hora: dónde estaban

- **DÍAS, tarjeta del día:** el rango de la mañana, de la tarde y de la noche (la cabecera de cada franja, `DayDetailPanel.tsx`/`TrazoCards.tsx`) y el de la comida y la cena (`MealCard`).
- **Excursiones de medio día:** «Mañana · 08:00 — 14:00» y «Tarde · desde 14:00» (`ExcursionBlocks.tsx`).
- **PDF:** la comida con su hora (`exportPdf.ts`).
- **Una pieza que hoy no se usa** (`MealSection.tsx`), también limpiada.
- **HOY, RESERVAS, avisos y campana:** no pintaban ninguna hora de franja ni de comida (los avisos de reservas hablan solo de reservas).
- No hay más forma de compartir que el PDF. La app no guarda reserva de restaurante con hora (solo nombre y zona), así que hoy ninguna comida ni cena lleva hora; queda preparado (`reservedTime`) para cuando exista.
- Capturas a 375 px del D2: `img/6x-d2-sin-hora-manana-375.jpg` y `img/6x-d2-sin-hora-comida-tarde-375.jpg` («Mañana», «Comida», «Tarde», sin horas).

## Pruebas (todas a 0 fallos)

6g, 6h, 6i, 6j, 6k (el mínimo de la comida bajó a las 10:30 por la comida rápida de la regla 4), 6l, 6o, 6r, 6s, 6t, 6v (con los nombres cortos), 6u (1.884 viajes; con la llegada de 15 min del Free Tour, la comida rápida, la Basílica antes desde las 16:00, el Puente y el Castillo después del Free Tour de tarde y «tarde por lo nuestro» como fallo), la prueba de listas completa (4 trozos, una de cada 5 fechas), `pruebaFranjas6x.mjs` (32 pantallas, 0 horas de franja, de comida o de cena, con y sin reservas, en la versión gratis y en la de pago) y `tsc`. La prueba de listas mide ahora el orden escrito (con lo que pasa detrás), la comida antes de las 15:00, el paseo antes de cenar, el Foro nunca por fuera, la llegada con su margen y que no se quite nada con una reserva.
