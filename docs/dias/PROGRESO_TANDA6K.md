# Progreso de la Tanda 6k

0. **Antes de empezar:** `.claude/` al `.gitignore` y fuera del repo; el convertidor sobre `DIAS_ROMA_PARADAS.md` (solo cambia el D3; «Llegadas y vueltas» sin usar). Hecho.
1. **URGENTE · sin fechas, mover una reserva rompía la app.** Causa encontrada y arreglada; la hoja sin fecha; red de seguridad (la ventana se cierra con aviso, la reserva se guarda en su día y la app sigue). Probado a mano en el navegador. Hecho.
2. **URGENTE · el Coliseo al último día descontrolaba el día.** Causa: la reserva se marcaba como «cambio a mano» de los dos días y el rehacer se los saltaba; la parada se iba sola. Ahora todo o nada, se cambian días enteros (los menos posibles), un día con cambios del viajero no se mueve (aviso). Horas de entrada solo las posibles; regla 17 con dos horas; las cinco comprobaciones. Probado a mano con fechas. Hecho.
3. **Panteón «Hoy cierra» sin fechas.** Causa y arreglo para todos los sitios; 12 meses a 0. Hecho.
4. **«Día del viaje» con «· aquí está ahora» y ya elegido.** Hecho (y con fechas, la fecha ya elegida).
5. **Fuera la línea repetida con fechas.** Hecho.
6. **Mercadillos: la tarjeta crece.** Hecho, visto a 375 px.
7. **RUTA sin el punto del aeropuerto.** Hecho (la ventana de llegada lo conserva).
8. **Un selector de fecha y uno de hora para toda la app.** Hecho (hoja con calendario; dos ruedas, o botones si hay pocas horas); sustituyen a los campos del sistema de reservas, vuelos, parada de un día libre, menú de la parada y otras reservas.
9. **D3 en el orden nuevo.** Hecho; la versión con Museos de 13:30 a 14:30 no cambia.
10. **Pruebas.** Hechas (ver informe).

TERMINADO
