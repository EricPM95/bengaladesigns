# V48 — HOY y el día de llegada (24-nov)

## 1. El billete con QR (DÍAS y HOY) — por qué no salía
En la V45 el billete nuevo (`BilleteDeVuelo`) solo estaba puesto en el último día de DÍAS y en una línea de HOY del día de vuelta (con pase); el primer día de DÍAS seguía usando la tarjeta vieja `TarjetaLlegadaDias` («LLEGADA · BARCELONA → ROMA … [Ver]») y el día de llegada de HOY no tenía billete. **Ahora:**
- DÍAS, primer día: el billete en el sitio de la tarjeta de llegada (la vieja ya no se usa); último día: el de vuelta, como estaba.
- HOY: arriba del día de llegada, antes de «Bienvenido a Roma» y de la primera parada; y el día de vuelta, donde salía «Llegada al aeropuerto» (con [Cómo llegar] debajo).
- Cabecera: «LLEGADA · VUELO {número}»; sin número, «LLEGADA · {aeropuerto}» (`billete.ts`). QR dorado + «✓ Tarjeta de embarque guardada», o QR gris «+» + «+ Añade tu tarjeta de embarque» (lleva a RESERVAS); tocar el resto abre la ficha de llegada de siempre.
- **Un fallo que se escondía solo en HOY:** el billete salía de 2 px de alto (la columna de HOY encoge lo que no lleva `shrink-0`). Arreglado.

## 2. El día de llegada, demasiado corto — NO ARREGLADO (no he podido reproducirlo)
- Probado el motor (`/api/rebuild-day`, llegada 11:15 en Fiumicino) con 6 zonas de alojamiento y en noviembre y julio: **sale siempre un día de 6 a 7 paradas** (la lista «D1-centro-…», la de 12:01 a 18:00), no de 3. Un día de 3 paradas solo sale de la lista «D1-anochecer-…» (2 paradas + la noche), que el motor elige con una hora útil de 18:01 a 20:00; con un aterrizaje a las 11:15 no puede dar eso.
- Lo que SÍ depende de la hora a la que se mira: en HOY, «Parada 1 de N» y las horas de actividad cuentan lo que aún se puede hacer; a las 18:30 la app ya ha pasado a «Lugares pendientes» lo cerrado (por eso un día de 6-7 paradas se ve «de 3»). No lo he cambiado: es el comportamiento de la V44.
- **Necesito el viaje de Eric** (el JSON del viaje, o el día y la zona del alojamiento) para ver qué día generó el motor. Si el día ya salió de 3 en DÍAS antes de mirarlo por la tarde, es el motor; si DÍAS lo enseña de 6-7 y solo HOY lo ve de 3, es lo de arriba.

## 3. Avisos de HOY
- **«Hoy ya no puedes entrar a los Museos Vaticanos: la última entrada era a las 18:00»** cuando la hora de la última entrada (o del cierre) ya ha pasado; [Ver solución] propone pasarlos al mejor otro día (antes proponía adelantarlos). Comprobada la frase exacta con la función; **no he podido sacarlo en pantalla**: con la última entrada puesta en los datos, a las 18:20 la app ya manda los Museos a «Lugares pendientes» («ya ha cerrado») en lugar de enseñar este aviso; el aviso sale con las paradas que aún no se han movido a pendientes.
- **«Hoy ya no da tiempo a todo»:** sale al abrir HOY cuando han pasado **1 h 30 desde la hora prevista de la primera parada** del día sin haber hecho ninguna (ya no «después de las 13:00»); también el día de llegada (con su hora prevista de empezar). Una vez al día. **Una sola hoja:** no sale mientras esté pendiente la tarjeta de temporada («Navidad en Roma»); al cerrarla, sale esta. **Free tour:** «Tu Free Tour por Roma de las 10:00 ya ha pasado» (solo las entradas dicen «Tu entrada…»), también en las hojas de «Cambiar plan».

## 4. EXPLORAR › ficha de un lugar
La barra «Escuchar historia» flotaba sobre el botón de añadir. Con botón de añadir, ahora la barra va en el flujo, justo encima de él: en 375 px el botón («+ Añadir») se ve entero (la barra termina en el píxel 717 y el botón empieza en el 738).

## Sin pruebas (por orden de Eric)
No se ha pasado ninguna prueba ni escrito `pruebaV48`: solo `npm run build` y capturas. Pruebas viejas que fallarán por lo nuevo (a poner al día en la tanda de pruebas): las que esperan «A este ritmo llegarías…» con la última entrada pasada, «después de las 13:00» en «Hoy ya no da tiempo», «Tu entrada de las 10:00» con un free tour, `TarjetaLlegadaDias` / `data-llegada-dias`, y `data-billete` con «Reservado»; y `pruebaV2Hoy` (1 fallo viejo de la V46, sin tocar).
