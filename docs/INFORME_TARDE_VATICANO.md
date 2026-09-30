# Informe: la tarde del Vaticano y fuera la regla de «no repetir de noche»

## El día del ejemplo
Viaje de 4 días desde el 15 de julio de 2027, con Free Tour. Día 1: D3 «Free Tour y el Vaticano por la tarde».

| Antes | Después |
|---|---|
| 14:45 Museos Vaticanos (bus 40) | 14:45 Museos Vaticanos (bus 40) |
| 18:00 Plaza de San Pedro | 18:00 Plaza de San Pedro |
| 18:20 Basílica de San Pedro | 18:20 Basílica de San Pedro |
| 19:30 De camino · Borgo Pio | 19:25 Via della Conciliazione (de camino) |
| — | 19:45 Castillo de Sant'Angelo, por fuera |
| — | 20:20 Puente Sant'Angelo al atardecer (sol a las 20:44) |
| 20:30 Cena en L'Arcangelo, «12 min desde el aperitivo» sin aperitivo a la vista | 21:15 Cena en L'Arcangelo, cerca |
| 22:00 Puente Sant'Angelo (noche), con la etiqueta «Revisita» | 23:00 Panteón y Navona de noche |

## Por qué faltaban el Castillo y el Puente
No era la regla de «no repetir de noche». El día escrito D3 nunca llevaba el Castillo ni el Puente después de la Basílica: su tarde acababa en «Borgo Pio, de camino». Solo la variante de los Museos cerrados los tenía.

La regla sí influía en la noche. Como el Puente no estaba en la tarde, la nocturna podía llevarlo, y salía como «Revisita».

## Qué ha cambiado
1. **Fuera la regla.** Una nocturna puede volver a lo que se vio esa tarde o a la mañana siguiente. Lo que se ha quitado:
   - en el motor: la mañana siguiente, el mismo día y el barrio de la tarde;
   - en la regla 413 de INVARIANTES;
   - la comprobación «noche y mañana siguiente» de la prueba.

   Se quedan las comprobaciones de día: Trevi el día del Free Tour y el mismo barrio dos veces de día.
2. **La tarde del Vaticano.** Al salir de la Basílica: Via della Conciliazione, el Castillo por fuera y el Puente al atardecer (en invierno, ya iluminado). La cena, cerca.
   - De noche, el centro: el motor aún puede volver al Puente.
   - Con los Museos cerrados, primero la Plaza, la Cúpula y la Basílica, y luego Borgo Pio, el Castillo y el Puente.
   - En Navidad, con el Castillo cerrado, se ve por fuera.
   - Un atardecer escrito ya no lo sustituye la nocturna.
3. **Sin huecos antes de cenar.** Si quedan más de 45 min, va un sitio del destino que cumpla todo esto:
   - que el viaje no vea;
   - de nivel 1 o 2 y de la misma zona;
   - a 12 min andando como mucho;
   - abierto a esa hora;
   - ni un museo de noche, ni volver junto a lo ya visto ese día.

   Cuento el aperitivo en un barrio y la nocturna de antes de cenar como rato ya ocupado.
4. **«Revisita»** ya no sale en ninguna nocturna.
5. **El aperitivo invisible.** Si hay aperitivo, su tarjeta sale siempre. Antes solo salía con 45 min o más, y la cena decía «desde el aperitivo» igualmente.
6. **La prueba** comprueba el Castillo y el Puente en el día del Vaticano (`vaticano_sin_castillo`, `vaticano_sin_puente`).
   - Excepción: el 24 y el 31 en los viajes de 2 días con Free Tour. Ese día el Vaticano va por la mañana y la Roma Antigua cierra pronto: pasar por el Castillo hacía perder el Foro por dentro.

## Cifras (365 fechas, 6.180 viajes)
| | Antes | Después |
|---|---|---|
| Días del Vaticano sin Castillo | 2.182 | 0 |
| Días del Vaticano sin Puente | 2.188 | 0 |
| Días con más de 45 min antes de cenar y un sitio a un paseo | 62 | 13 |
| Prueba de 365 fechas: avisos reales (sin contar las dos comprobaciones nuevas) | 0 | 13 (los huecos de la tabla; los 21 informativos siguen igual) |
| Navidad y Fin de Año | 0 | 0 |
| Los 56 viajes | 0 peor | 0 peor |

Los 13 huecos que quedan:
- 8 son del Ponte Sisto en viajes de 2 días con Free Tour: el atardecer es a las 19:00 y la cena en Campo de' Fiori, a unos pasos.
- Los otros 5 caen en Nochebuena (1), Nochevieja (3) y Año Nuevo (1), días con horarios especiales.

Regla nueva: la 416.
