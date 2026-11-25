
## 1. Búsqueda de Civitatis: lo que encuentra el sandbox (25-nov) - para que Eric diga
No se ha cambiado ningún dato de excursiones. Búsquedas con `destinationId: 19` (Roma), sandbox. Las notas y opiniones hay que pedirlas a la ficha de cada actividad.
- **Pompeya y Sorrento:** «Pompeya» -> 365 Excursión a Pompeya; 149 Pompeya, Sorrento y Capri en 2 o 3 días; 604 Tour de 3 días por Pompeya y Minori; 94632 Excursión privada desde Roma. «Sorrento» -> 149. Candidata: 149 (o 365 si es solo Pompeya).
- **Nápoles y Pompeya en tren:** «Nápoles» -> 365, 149, 94632. Ninguna dice «tren»: candidata 365; decide Eric.
- **Costa Amalfitana:** «Amalfi»/«Amalfitana» -> solo 604 (3 días, Pompeya y Minori). No hay una excursión de un día desde Roma en el sandbox; sin destino salen 7255 (barco a Amalfi y Positano), 167062, 172603 (Pompeya, Amalfi y Ravello): son de Nápoles/Sorrento, no desde Roma.
- **Florencia en tren:** «Florencia» -> **3742 Excursión a Florencia en tren de alta velocidad** (coincide) y 142547 Florencia y Pisa.
- **Tívoli:** «Tívoli» -> **146 Excursión a Tívoli** (coincide) y 94632 Excursión privada desde Roma.
- «Pompeya» sin destino: 40 resultados; «Amalfi»: 46; «Tívoli»: 4 (2 son los Jardines Tivoli de Copenhague, no valen).
- El sandbox tiene menos que producción: al pasar a producción hay que repetir la búsqueda (`node scripts/destino/civitatisBuscarCinco.mjs`).

## Apartado 2: la hora que recomendamos (decisiones para Eric)
- **Hora de partida del día de llegada = `horaUtilMin` del vuelo, sin mirar la hora que la ruta daba a la parada** (con 10:30 en Ciampino, libre hacia las 13:20, la primera hora que cabe). Puede ser anterior a la hora de la ruta (la parada pasa a esa hora al guardar). Si prefieres que sea max(hora útil, hora de la ruta), es un cambio de una línea en `recomendarHora`.
- **Otro día:** se elige el día del viaje más cercano al de la parada (empate, el más temprano) con alguna hora libre; y dentro de él, la primera hora desde la hora de la ruta de la parada, o la primera del día si no cabe ninguna. No se ofrecen el día de vuelta ni el de excursión.
- **Sin vuelo con hora** el día de llegada, o sin hora de ruta en la parada, no se recomienda nada (como antes).
- **Un día normal que ya no tiene hora libre después de la de la ruta** sale con la franja ámbar «El jueves 26 no llegas a ninguna hora libre» (el texto de Design es solo del vuelo; este lo he escrito yo por analogía).
- **Sin ningún otro día con hueco:** solo sale la franja (roja o ámbar), sin caja verde.
- **Al guardar la reserva en otro día la parada ya pasa a ese día**: lo hacía ya `placeReservedEntrance` (Free Tour y entradas: llega de primera al día de la fecha de la reserva). No he tocado el almacén. Las excursiones siguen con el mecanismo de la V49.
- La hora útil en Lanzarote sale sin redondear a 5 (11:13); en HOY se redondea hacia arriba. No cambia ninguna hora recomendada con las horas de ejemplo, pero con horas muy ajustadas podría.
