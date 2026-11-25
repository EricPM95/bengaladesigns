# REPASO V61 (25-nov): Reorganizar

Modo rapido: sin pruebas; `tsc` y `npm run build`. Capturas (iPhone) en `docs/dias/V61_capturas/` (RO1-RO3 app y Design, Lanzarote, probador con los tres vuelos de Eric).

- **Motor (dia de llegada):** el Free Tour va a su hora (10:30 → 15:00; 13:30 → 17:00; 17:00 → dia 2 a las 10:00); lo que llegaria cerrado se adelanta si cabe o va a pendientes. Reorganizar dos veces da lo mismo (`scripts/destino/comprobarReorganizarIdempotente.mjs`: Roma y Lanzarote en OK). La propuesta que aparecia tras reorganizar venia del orden suelto: arreglado.
- **Deshacer y boton flotante:** Deshacer restaura la ruta entera y no abre hojas; el boton desaparece tras [Reorganizar] y se queda tras [Dejarlo como esta] (razonado por codigo, no visto en pantalla).
- **Hoja:** una sola (`HojaDeReorganizar.tsx`) para RO1, RO2 y RO3, con tarjeta por cada sitio que cambia, con hora y sin numero de parada.
- **Probador:** linea del motor en palabras, primer y ultimo dia antes/despues, casos de Eric.
- **Lo que mirar:** con el vuelo de 17:00 mucho no cabe el viernes y sale como «Se quita de tu viaje» (~17 tarjetas) en vez de «Al sabado 28» o pendientes (DECISIONES_V61). Sin comprobar: Deshacer y boton en pantalla, barrido de 365, «Has añadido la Galeria Borghese…».
