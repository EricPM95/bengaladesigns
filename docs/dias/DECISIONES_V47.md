# V47 — la tarjeta de la parada, antes de llegar y al llegar (24-nov)

## Hecho
1. **Antes de llegar: tres cajas en una fila** (dibujo T1/T2 de «RETOQUES_V2», copiado a `docs/diseno/proyecto/Parada Tarjeta.dc.html`):
   - **HORARIO** según la hora real: antes de abrir, «8:00–20:00» y en rojo «Cerrado ahora · abre a las 8:00»; abierto, «Abierto» (verde) y «Cierra a las 16:30»; después del cierre, «Cerrado» y «Abre mañana a las 9:00» (o el próximo día que abra, mirando 3 días); sin horario, «Abierto» y «Sin horario». Lógica pura en `src/lib/horarioDeLaCaja.ts`.
   - **A PIE / EN COCHE** con «Desde el alojamiento» / «Desde el Panteón» / «Desde ti» (sin alojamiento, «Desde el centro»); lejos del destino, «—» y «Estás lejos».
   - **VISITA** con el reloj de arena: el tiempo recomendado y «Lo que recomendamos».
   - Debajo, el recuadro de la ubicación, la historia y [Cómo llegar] / [Cambiar plan]. A 375 px caben las tres con el caso más largo (cerrado ahora, sin ubicación) sin cortar texto.
2. **Al llegar:** las mismas tres cajas con A PIE «Aquí · Ya has llegado»; la franja «AQUÍ GANAS 1 PEDAZO» con el nombre de la colección (con dos, la primera y «y 1 más») y el trozo de ESE sitio en color sobre su círculo blanco (`InsigniaPartes`; el servidor manda ahora también el id de la colección en la misma respuesta de `/api/logros/cerca`: sin consultas nuevas); los tres botones con nombre: [Qué ver], [Escuchar historia] y [Hacer foto] (dorado). Debajo, como antes.

## La foto de los Museos Vaticanos en la «Plaza del Campidoglio» (captura de la V46)
Salió de **mi montaje de la captura, no de la app**: para enseñar «una plaza» cogí la primera parada del viaje de pruebas (los Museos Vaticanos) y le cambié solo el nombre; la foto de una parada va en su propio campo (`photoUrl`, `fixedPhotoUrl`…), no se pide por el nombre, así que se quedó la de los Museos. En la V47 la captura de la plaza borra esos campos y la foto se pide por su nombre: sale la del Capitolio. Una parada nunca coge la foto por el nombre de otra.

## No hecho / sin comprobar (tanda de pruebas esta noche, por orden de Eric)
- **No se ha pasado ninguna prueba y no hay `pruebaV47`** (decisión de Eric a mitad de tanda). Solo: `npm run build` sin errores, `tsc` limpio y las capturas.
- **Pruebas que esperarán lo de antes y fallarán** (a poner al día en la tanda de pruebas): las que leen `data-hoy-horario-texto` o el texto «Abierto/Cerrado» de la caja HORARIO, `data-hoy-visita` («Visita de unos 50 min»), `data-hoy-icono` sin texto, y `pruebaV2Hoy` (la frase «Aquí ganas 2 pedazos: «A» y «B»» ahora va en dos líneas).
- **`pruebaV2Hoy` (1 fallo desde la V46):** no la he tocado (Eric: sin pruebas). Queda por mirar si el aviso «… ya ha cerrado · la tienes en Lugares pendientes» va arriba desde la V44.
- No se ha visto en pantalla el caso «Cerrado · abre mañana…» (después del cierre) ni el de «Desde el Panteón» (segunda parada); sí están en la lógica pura.
- «Escuchar historia» solo sale si la parada tiene historia (como antes).
- El API hay que reiniciarlo (cambió `server/logros/cerca.js`): hecho al final de la tanda.
