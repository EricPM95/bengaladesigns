Empieza la Tanda 6m: está en docs\dias\PARA_CODE_TANDA6M.md. Léela entera y hazla toda, en el orden de los puntos. El diseño está en docs\diseno\reservas\ (Entrada Tarjeta.dc.html, que se abre en el navegador, y dos capturas). Del diseño se copia lo visual; los datos y las reglas son los nuestros.

Resumen:
1. RESERVAS, la tarjeta de cada entrada como en el diseño. Sin reservar: «ENTRADA · Día 1» (con fechas, «Mar 12 ene»), el nombre entero, [Reservar entrada] (abre el enlace de compra, con el aviso «Abriendo la tienda de entradas…»; en el Free Tour, [Reservar Free Tour]) y «¿Ya la tienes? Añádela». Reservada, en verde: «✓ Reservada · 14:00 · Cambiar». Fuera el «Añadir» gris y la mejor hora.
2. La hoja de la hora («Añádela» y «Cambiar») como en el diseño: una sola rueda y [Guardar · 14:00]. Las horas, las de verdad de cada sitio ese día (la Galería cada hora y 17:45; el Free Tour, sus cinco botones; los demás, de 15 en 15). Debajo, «¿Es para otro día? Cambiar el día» (la lista de días de la 6k) y «Rellenar desde el email o el PDF» (lo que ya existe).
3. Dentro de «Cambiar», abajo y en rojo, «Eliminar reserva», con su pregunta en la misma hoja. Al eliminar, la tarjeta vuelve a sin reservar, el día se queda donde está y la parada vuelve a su lista normal.
4. Fuera «Mejor hora este día» en toda la app (la hoja de la regla 17 se queda).
5. La Trinità del medio día de tarde: no se cambia la regla 7.
6. Las pruebas y la comprobación a mano del punto 6.

Cómo trabajar: lo de siempre (PROGRESO, PREGUNTAS e INFORME de la 6m, commits locales por bloques). Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
