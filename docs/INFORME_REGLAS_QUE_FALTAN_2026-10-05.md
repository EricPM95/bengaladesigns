# Informe: las reglas que faltan (5-oct-2026)

Hecho: reglas 33 a 37 en `REGLAS_RUTAS.md` y `CAMBIOS.md`; quitado a mano lo pedido; los 20 viajes en `docs/reglas/VIAJES_EJEMPLO.md`. Commit `cb38fae` y siguientes, sin push.

## Prueba de las 365 fechas (6.987 viajes)

Total 5.803 → 6.120. Casi todo el aumento es de preferencias: `hora_no_10` +400 (R-22), `experiencia_sin_efecto` +89 (R-13), `no_cuadra` +41. Mejoran: tramos de más de 25 min andando 6 → 0, comida de más de 90 min 20 → 0, imprescindibles de pago sin visita por dentro 7 → 1, nota de temporada que promete 2 → 0, joya tarde 584 → 461, zigzag 6 → 4.

## Los casos sueltos: qué regla o qué dato lo arregla

Es lo que propongo; **no está aplicado** (cada uno es un dato que hay que escribir y comprobar con las 365 fechas).

| Caso | Qué pasa | Qué lo arregla |
|---|---|---|
| R-5 Monti (2 viajes, 4 días con Coliseo a las 15:30, 27-ago y 24-sep) | Monti sale el día 1 (tarde D1) y otra vez el día 4 (cena o paseo de D5C). | **Dato:** D5C D y C tienen que llevar `no_si_dia` / otro barrio de cena cuando el viaje ya pasó por Monti; la regla 7 ya dice «un paseo, una vez por viaje si queda otro». Falta ese dato en D5C. |
| R-8 `tour_repite` (24 y 31 dic, 3 días con Free Tour) | El día 1 (D3 A, con el Vaticano cerrado) pone el Panteón a las 15:50 y el Free Tour del 12:00 también pasa por ahí. | **Dato:** en `fecha:12-24` y `fecha:12-31` de D3, el Panteón sale solo si el tour no lo cubre (`no_con_tour`), como ya se hace en D0. La regla 8 ya lo manda. |
| R-10 `dos_visitas_grandes` (24 y 31 dic, 2 días con Free Tour) | El día 1 junta el Vaticano (95 min) y la Roma Antigua (130 min) porque el tour cambia a las 12:00. | **Regla 11:** en 2 días, un día cada visita grande. Falta el dato `desde_dias` en el cambio de las 12:00 de esas dos fechas. |
| R-25 `fuera_sin_vista` (24 y 31 dic, la Basílica por fuera) | Ese día la Basílica va por fuera a propósito y la prueba no ve nada que ver desde la calle. | **Dato:** `pass_by` de la Basílica de San Pedro con su `minutos_fuera`. La regla 25 ya lo cubre: es un dato que falta. |
| R-26 `nota_promete` | Ya está en 0 en esta prueba. | Nada que hacer; se vigila en la siguiente.

## Lo que no se arregla con una regla ni con un dato (hoy)

1. **Foro desde el Campidoglio de noche, en verano, con Free Tour, 1 día.** Empieza a las 23:35, después del límite de 23:30. Para cumplirlo habría que acortar la tarde, y la regla 33 no deja recortar lo protegido.
2. **Museos Vaticanos en el pool, 1 día** (viaje 4 de los 20). Entra a las 14:30 y sustituye la tarde. La Basílica sale a las 18:10 y acaba a las 19:05, después de las 19:00. No es una regla ni un dato: es el orden de la tarde cuando el museo ocupa 3 horas.
3. **24 de diciembre, 1 día.** Solo cabe una nocturna por la Nochebuena. La regla 6 pide una cada noche; hace falta decidir cuál.
4. **Villa Borghese dos veces el mismo día** (viaje 13 de los 20): una vez de paso por la mañana y otra como paseo por la tarde. Hay que decidir si el «de paso» cuenta como visita.
5. **«Naturaleza y Vistas» en 3 y 5 días:** 188 viajes sin cambio. Con la regla 33, alargar Villa Borghese ya no quita nada, y lo siguiente de la lista (Jardín de los Naranjos, Via Appia) no cabe o su día no está en el viaje. Hace falta **un dato**: otro sitio en la lista que esté en las zonas de los días 1 a 3. Hay que elegirlo tú.
6. **D2 D con lunes y los Museos Vaticanos por la mañana:** quedan 50 min «Descanso después de comer» porque la comida ya no se estira. La regla 20 pide un sitio de camino y no hay ninguno en esa zona: es **un dato** (un sitio de camino en la zona del Janículo).
7. **Verano, D1 D (domingo):** el Panteón y Santa Maria sopra Minerva a las 14:20–14:50. El Panteón, por dentro, está a cubierto; sale «por fuera» por el domingo. Es un dato de D1 D.
