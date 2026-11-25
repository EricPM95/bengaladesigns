# REPASO V58 (modo rápido: sin pruebas; `tsc` y `npm run build` sin errores)

Capturas en `docs/dias/V58_capturas/` («<punto>_antes.jpg» = las de los viajeros de anoche, «<punto>_despues.jpg» = de hoy, en iPhone 390x844). Todo en `docs/dias/V58_puntos.json`. Lo que hay que decidir, en `DECISIONES_V58.md`.

1. ✅ **Alojamiento, una sola respuesta.** RESERVAS, DÍAS y HOY usan la misma función. Con el hotel (sin dirección): nadie lo pide y HOY dice «Desde el alojamiento». Solo con la zona: no cuenta como hecho (contador «1 de 11», tarjeta «Falta»), DÍAS y HOY lo piden y HOY dice «Desde Costa Teguise». Pasaba también con un viaje normal.
2. ✅ **Cabecera de RESERVAS.** «Domingo 18 · día 2 de 3» y «4 de 7 reservas listas»; el total cuadra con las fichas y los bloques de abajo (cada entrada cuenta una).
3. ✅ **Dos tarjetas del vuelo.** El día de llegada sale solo el billete; la tarjeta oscura ya no repite «Tu vuelo · Aterrizas a las…» y solo queda con lo que el billete no tiene (empiezas a las…, comer, restaurantes).
4. ✅ **Barra «… · Deshacer».** Sí pasaba (también sin cambiar el día simulado): el plazo de 6 s se reiniciaba en cada cambio de pestaña. Ahora cuenta desde que sale el aviso: a los 9 s ya no está.
5. ✅ **«a el», «de el» y artículos.** «Tu entrada al Coliseo», «Tu entrada de las 10:00 en el Coliseo». Regla: «a el» → «al», «de el» → «del»; el artículo sale de los datos de los destinos (Roma y Lanzarote juntos; «Montserrat», sin artículo). Pendiente menor: el aviso «Tu Coliseo, el domingo 18».
6. 🟡 **Lanzarote en coche.** ✅ «64,3 km en coche» (y «a pie» solo si hay). ✅ Tabla de minutos en DECISIONES (no se ha cambiado ninguno). ✅ Ninguna visita acaba después de que cierre el sitio (motor de coche; Roma ya lo cumplía). 🟡 «Hora de comer»: el jueves ya sale Liken (antes ninguno: el motor apagaba los «sin confirmar»); el viernes (vuelta, Arrecife) no hay restaurantes de comida en los datos y no los he inventado.
7. ✅ **«Guarda un recuerdo».** Sale a los ~0,3 s del [He terminado] (antes, tras 5 s de aviso), solo en HOY, y se cierra sola al cambiar de pestaña, de día o de viaje.
8. ✅ **Sin pruebas.** `npm run build` sin errores; capturas antes y después de cada punto.

## Qué cuenta cada número de la cabecera de RESERVAS
- **«Domingo 18 · día 2 de 3»** (tarjeta oscura): el día del viaje en el que estás y cuántos días de ruta tiene (sin contar el día de la vuelta a casa).
- **«4 de 7 reservas listas»** (tarjeta clara): cosas ya reservadas entre todas las que se reservan: llegada y vuelta (1), alojamiento (1), coche (si hay), **cada entrada**, cada excursión, seguro y eSIM (si hace falta).
- **«Entradas 1/3»** (en su ficha): 1 entrada reservada de 3 en tu ruta; cuenta 1 en el «4 de 7» (y las otras 2 son 2 pendientes).

## Qué no pude comprobar
- Sonido (Chrome sin audio).
- Los «antes» son las capturas de los viajeros de anoche (no se volvió al código viejo para no tocar los 1.200 archivos sin subir).
- «Hora de comer» del jueves: lo vi en los datos del viaje (Liken en la lista de ese día), no el nombre dentro de HOY (Liken no tiene coordenadas, así que HOY no lo marca como recomendado).
- Pruebas viejas que pueden fallar por el cambio (no se pasaron): alojamiento con solo hotel, cabecera de RESERVAS y «Tu entrada a el Coliseo».
- No hay commit ni push (como pidió el encargo).
