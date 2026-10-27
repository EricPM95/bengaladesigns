# Textos de los avisos: antes y después (10N4 §4b2)

Regla: frases cortas, español normal, con artículo («la Fontana di Trevi», «los Museos Capitolinos»), plural cuando toca, el día bien dicho («el sábado 14») y lo que ha decidido la persona (no la lista de lo que la app ha movido; eso, 10N5). Fuente única: `shared/avisos/textos.js` (campana, franja y móvil). No hace falta migración: ningún disparador SQL escribe texto, solo datos.

## Campana (frase entera)

| Aviso | Antes | Después |
|---|---|---|
| Recomendación (cambio) | Laura te recomienda un cambio en el día 2 | Laura te ha recomendado un cambio en el día 2 (la hoja R2 sigue en presente) |
| Recomendación (propuesta) | Ana te propone 5 cambios en tu viaje a Roma | Ana te ha mandado una propuesta de 5 cambios para el viaje a Roma |
| Aceptada / rechazada | sin cambios | sin cambios |
| Sin enviar | Envíalos hoy… | «Envíalo hoy» con 1 cambio, «Envíalos hoy» con varios |
| Cambio del viaje | Eric ha cambiado el viaje: ha añadido la Fontana de Trevi al sábado 28 | Eric ha añadido la Fontana de Trevi al sábado 28 |
| Cambio del viaje (días) | Eric ha cambiado el viaje: ha quitado 2 días | Eric ha quitado 2 días (sin nombre: Han quitado 2 días) |
| Entrada del dueño (para ti) | Eric ha reservado Coliseo para ti: jueves 26, 8:00. | Eric ha reservado el Coliseo para ti el jueves 26 a las 8:00. |
| Entrada del dueño | Eric ha reservado Coliseo el jueves 26 a las 8:00. | con artículo: …el Coliseo / los Museos Capitolinos… |
| Entrada que no cuadra | Tu entrada de Coliseo… (móvil) | Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26. (también desde el móvil) |
| Permiso a recomendar | Eric ha cambiado tu permiso en el viaje a Roma: ahora puedes recomendar cambios | Eric ha cambiado tu permiso: ahora puedes recomendar cambios en el viaje a Roma |
| Sorpresas | Te quedan 1 días… | Te queda 1 día… / Te quedan 3 días… |
| Resumen | Tu resumen del viaje está listo | Tu resumen del viaje a Roma está listo (si hay destino) |
| Los 10 días | En 10 días empieza tu viaje a Roma / Mañana… | igual, pero «Mañana» solo cuando de verdad falta 1 día (ver abajo) |
| Cierres (fechas) | Museos Vaticanos y Villa Farnesina cierran el domingo 15 de noviembre. | Los Museos Vaticanos y la Villa Farnesina cierran el domingo 15 de noviembre. (el motor no se toca: se arregla al enseñarlo, `conArticulos` en `src/lib/dateNotices.ts`) |
| Resto (gasto pendiente, gasto resuelto, pago marcado, unido, quitado, sorteo, amigo) | sin cambios | sin cambios |

## Franja de arriba (título corto / detalle)

| Aviso | Título | Detalle | Icono |
|---|---|---|---|
| Permiso | Eric te ha dado permiso | Para editar el viaje a Roma | inicial |
| Cambio del viaje, un sitio | Eric ha añadido un sitio | Fontana di Trevi · sábado 14 | inicial |
| Cambio del viaje, varios | Eric ha añadido 3 sitios / ha quitado 2 días / ha cambiado el viaje | Fontana di Trevi y 2 más / Viaje a Roma / 2 cambios | inicial |
| Gasto | Ana ha añadido un gasto | Cena en Trastevere · 84 € | inicial |
| Propuesta | Laura te ha mandado una propuesta | 3 cambios | inicial |
| Propuesta contestada | Eric ha aceptado tu propuesta | 3 de tus 5 cambios | inicial |
| Entrada del dueño | Eric ha reservado el Coliseo para ti | Jueves 12 · 11:45 | inicial |
| Entrada que no cuadra | Tu entrada no cuadra con la ruta | El Coliseo · viernes 27 | ticket |
| Mañana empieza | Mañana empieza tu viaje | Roma · 26 – 29 nov | calendario |
| Sorteo | Ya tienes tu billete | Para el sorteo de 2026 | estrella |
| Ya no formas parte | Ya no formas parte del viaje | Viaje a Roma | «i» |
| Varios a la vez | 3 avisos nuevos | Eric, Ana y Laura + [Ver] | monedas |

## De dónde salían los dos avisos raros

- **«Sobre tu ruta» («2 días en Roma dan para mucho…»)**: es `route.contextBanner`, escrito por el motor una sola vez al crear la ruta con los días de ese momento (`contextBannerFor`, plantillas `context_banners` de roma.json). Si el viaje cambia después de duración (fechas nuevas, días añadidos), el texto se quedaba contando otra ruta. Ahora solo se enseña si el número de días que dice coincide con los de la ruta (`src/lib/contextBannerVigente.ts`, usado en la campana y en el banner de la ruta).
- **«Mañana empieza tu viaje a Roma · ahora»**: es el aviso `d10`, que el servidor crea UNA vez por viaje (clave `d10:<viaje>`) con las fechas y el «faltan N días» de ese momento, y no se volvía a mirar. Con fechas de viaje cambiadas después, o un viaje de prueba que ya no existe, el aviso se quedaba y decía «Mañana». Ahora, al listar (`server/avisos.js › listar`), solo vale si el viaje sigue existiendo, empieza el mismo día y de verdad faltan de 1 a 10 días en la hora del destino; el «Mañana» / «En N días» se cuenta con la fecha de hoy. No puedo ver la base de datos de Eric: no sé si fue un viaje de pruebas anterior o un cambio de fechas; el arreglo cubre ambos.
