Empieza la Tanda 6k: está en docs\dias\PARA_CODE_TANDA6K.md. Léela entera y hazla toda, en el orden de los puntos. Son arreglos: no cambia cómo se montan los días.

Antes de empezar: docs\dias\DIAS_ROMA_PARADAS.md ha cambiado. Para esta tanda solo vale el D3 (la tarde del Vaticano). Pásalo por el convertidor y no lo toques. La sección final «Llegadas y vueltas» entera, con «El orden nuevo de los días» que hay dentro, es de la Tanda 7: en esta tanda no la uses.

Resumen:
1. URGENTE: sin fechas, al mover una reserva del Coliseo a otro día («A mano», por ejemplo al día 3), la app se rompe («Algo ha ido mal»). Arréglalo; sin fechas, la hoja sin la fecha («…al día 3, con tu reserva.»); y que una pantalla de error no vuelva a salir por esto: si algo falla, la reserva se guarda en su día y sale un aviso.
2. URGENTE: con fechas, al mover el Coliseo del día 1 al último día, el día 1 se descontrola (una parada inventada, la cena a la 1:15, dos «Mañana», el Foro a las 20:22). Sin vuelos, el primer y el último día son días normales: se cambian los dos días enteros, uno por otro (y algún día más solo si un cierre lo obliga). El Foro va siempre con el Coliseo. Si un día de verdad no se puede mover, no se mueve nada y sale el aviso; nunca un día a medias. Para el Coliseo, los Museos y la Galería, solo horas a las que se puede entrar; si la hora no tiene lista, la hoja de la regla 17 con dos horas propuestas. Y las cinco cosas que no pueden pasar nunca, como comprobación en todas las pruebas.
3. Sin fechas, el Panteón sale «Hoy cierra»: sin fechas no hay «hoy». Busca qué lo marca y que no les pase a otros sitios.
4. «Añade tu reserva» → «Día del viaje»: el día donde ya está ese sitio, con «· aquí está ahora» y ya elegido (con fechas, también la fecha).
5. Fuera la línea repetida «Jueves 31 dic → tu Día 4»; se queda «Tu reserva es del jueves 31: la pasamos a tu Día 4.».
6. La tarjeta de los Mercadillos navideños crece con su texto.
7. RUTA: el mapa sin el punto del aeropuerto (en la ventana de llegada, sí).
8. La fecha y la hora, más bonitas y en toda la app: el calendario del formulario en una hoja (en una reserva, solo los días del viaje) y la hora con dos ruedas tipo iPhone (de 5 en 5), o botones cuando hay pocas horas. Un solo componente de cada para toda la app.
9. D3: la tarde del Vaticano pasa a Museos → Plaza → Basílica → Conciliazione → Castillo → Puente.
10. Las pruebas del punto 10, y esta vez lo de las reservas también a mano en el navegador, con y sin fechas.

Cómo trabajar: lo de siempre (PROGRESO, PREGUNTAS e INFORME de la 6k, commits locales por bloques). Añade .claude/ al .gitignore. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
