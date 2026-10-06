# Prueba del motor de listas (Tanda 6)

Las 365 fechas de 2027, todos los viajes de 1 a 6 días (24 formas), con y sin pool, Free Tour, reservas y experiencias: **125.925 viajes, 463.915 días**. Se corre con `node scripts/destino/pruebaListas.mjs dias=<grupo>` (por grupos para repartirlo en procesos: 1-2 días, 2,5-3, 3,5-4, 5 y 6).

**Fallos: 7** (todos la misma comida; ver abajo).

| Regla | Fallos |
|---|---|
| 1. El orden de cada día = el de su lista, sin lo quitado | 0 |
| 2. Nada cerrado en su franja | 0 |
| 3. Sin zigzag (lo que la lista escrita no hace) | 0 |
| 4. Pirámide: ningún imprescindible quitado la primera vez | 0 |
| 5. Por dentro una sola vez en el viaje | 0 |
| 6. Restaurantes y nocturnas repetidos | 0 |
| 7. Reservas a su hora, con su «Llegada a…» | 0 |
| 8. Comida después de las 14:30 (con algo quitable delante) | 7 |
| Todo lo que falta de la lista tiene su causa en el registro | 0 |
| Lo marcado en el pool sale o está en «No incluido» | 0 |
| La alternativa de lluvia no rompe nada que el día no rompiera | 0 |

Los 7 casos: el **25 de diciembre**, día D1-FT (Roma antigua con Free Tour), con el **Coliseo reservado a las 12:00**, en viajes de 4, 5 y 6 días. La comida sale a las 14:33 o las 14:48; el motor lo apunta («no cabe del todo, 18 min de más») porque quitar el Campidoglio rompería otra comprobación.

Apuntado (no es un fallo): comidas después de las 14:30 con solo imprescindibles delante (unas 15.900), días que no caben del todo (unos 37.600), paradas que pasan a «Si te sobra tiempo» (unas 96.800) y 28 restaurantes repetidos sin recambio de verdad (todos en 6 días, apuntados en el registro).
