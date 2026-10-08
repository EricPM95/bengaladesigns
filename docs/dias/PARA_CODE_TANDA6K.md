# Para Code · Tanda 6k: los fallos gordos de las reservas, y arreglos

**Empieza cuando esté subida la 6j** (ya lo está: a9d2651). Es una tanda de **arreglos**: no cambia cómo se montan los días.

**Antes de empezar:**
- `docs\dias\DIAS_ROMA_PARADAS.md` ha cambiado. **Para esta tanda, solo vale el D3** (la tarde del Vaticano, punto 9). Pásalo por el convertidor y no lo toques.
- **La sección final «Llegadas y vueltas» entera es de la Tanda 7**, también «El orden nuevo de los días» que hay dentro. En esta tanda no la uses.
- Eric ha probado la 6j en el navegador. Los dos primeros puntos rompen la app o descontrolan un día, y no dejan probar nada de las reservas: **son lo primero**.

## Cómo trabajar
- **Nada de parches:** cada arreglo, en un sitio y para todos los destinos.
- **`PROGRESO_TANDA6K.md`,** con una línea por bloque y TERMINADO al final.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA6K.md`.
- **Al acabar,** `INFORME_TANDA6K.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Añade `.claude/` al `.gitignore`** (el `scheduled_tasks.lock` de la herramienta no debe parar nunca un push).
- **Esta vez, todo lo de las reservas se prueba también a mano en el navegador** (puntos 1, 2 y 10). En la 6j no se hizo, y por eso se escaparon los dos fallos gordos.
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. URGENTE · La app se rompe al mover una reserva a otro día (sin fechas)
- **Cómo se ve:** un viaje de 4 días **sin fechas**. En RESERVAS, «Añade tu reserva» del Coliseo → «A mano» → elegir un día que no es el del Coliseo (por ejemplo, el día 3). Sale la pantalla «Algo ha ido mal · Esta pantalla no se pudo mostrar correctamente…».
- **Solo pasa sin fechas** (comprobado por Eric). Con fechas no se rompe. Eligiendo el mismo día en el que ya está el Coliseo, tampoco.
- **Lo más probable:** la hoja de la 6j lleva «({fecha})» y sin fechas no hay fecha. O mover el día sin fecha rompe algo.
- **Lo que hay que hacer:**
  - encontrar el fallo y arreglarlo;
  - sin fechas, la hoja sin la fecha: «Para que tengas una buena experiencia en Roma, vamos a mover el día del Coliseo al día 3, con tu reserva.»;
  - **que una pantalla de error no vuelva a salir por esto:** si algo falla al mover, la reserva se guarda en su día, sale un aviso y la app sigue funcionando.

## 2. URGENTE · Al mover el Coliseo al último día, el día del que sale se descontrola
- **Cómo se ve:** un viaje de 4 días con fechas. El Coliseo pasa del día 1 al día 4 (jueves 31 de diciembre).
  - **El día 4** sale bien, con el Coliseo.
  - **El día 1,** el que se queda sin el Coliseo, sale así:
    - por la mañana, la Plaza del Campidoglio, Plaza Venecia, el Altar, el Arco y la «Terraza de Largo Gaetana Agnesi» (sin foto, y no está en ningún día escrito);
    - la comida en Il Bocconcino y, justo después, **la cena a la 1:15** en Da Enzo;
    - después, **otra vez «Mañana · 09:00–12:30»** con el **Foro y Palatino a las 20:22**, cuando cierra a las 16:30;
    - la noche, «Fin del día».
- **O sea:** no se ha movido el día entero, solo el Coliseo, y el día 1 se ha rehecho con lo que quedaba. Es lo que la 6j tenía que evitar.
- **Lo más probable:** la 6j dice que el día no se mueve «en el día de llegada o de vuelta», y se ha tomado el último día como día de vuelta aunque el viaje no tenga vuelos.
  - **Sin vuelos, el primer y el último día son días normales.**
  - Esa excepción es solo para cuando haya vuelos (Tanda 7). **En esta tanda no hay ninguna excepción por ser el primer o el último día.**
- **Lo que tiene que pasar (decidido por Eric): se cambian los dos días enteros, uno por otro.**
  - El día del Coliseo (D1) va al día 4, con la lista escrita de la hora de la reserva, y el que había en el día 4 pasa al día 1.
  - Solo si un cierre lo obliga (el Vaticano un domingo, la Galería un lunes) se mueve algún día más, y la hoja lo explica (como en la 6j).
  - **El Foro y Palatino van siempre con el Coliseo** (es la misma entrada).
- **Si un día de verdad no se puede mover** (las excepciones que quedan de la 6j: dos reservas grandes el mismo día, o una excursión reservada ese día), no se arranca la parada sola:
  - no se mueve nada;
  - sale el aviso de la 6j, que se queda en la campana;
  - nunca un día a medias.
- **La hora de la reserva:** la 6j quitó el aviso «A las {hora} no tenemos escrito…», y ahora la app acepta **cualquier** hora. Eso estaba bien para las horas que sí tienen lista (como las 13:30 del Coliseo), pero no para las que no la tienen o con el sitio cerrado.
  - **En la rueda de la hora** (punto 8), para el Coliseo, los Museos y la Galería solo salen las horas a las que se puede entrar ese día (de la apertura a la última entrada), con las mejores marcadas («Mejor hora este día»).
  - **Si aun así la hora no tiene lista escrita** (la Galería a las 12:00, por ejemplo), regla 17, con una hoja desde abajo: «A las 12:00 la visita no encaja bien en el día. Te proponemos las 11:00 o las 15:00.» [11:00] · [15:00] · [Dejar las 12:00]. Si la deja, regla 4, sin romper nada de lo de abajo.
- **Lo que no puede pasar nunca.** Ponlo como comprobación en las pruebas, para todos los días y todas las reservas:
  - una parada a una hora en que ese sitio está cerrado;
  - una comida o una cena fuera de su hora (la cena, nunca después de las 22:30);
  - dos franjas con el mismo nombre en un día, o una franja con horas que no son las suyas;
  - una reserva que desaparece del día;
  - una parada que no está en ningún día escrito (salvo lo que añade el viajero y «Si te sobra tiempo»).

## 3. El Panteón sale «Hoy cierra» sin fechas
- **Cómo se ve:** un viaje de 4 días en enero, sin fechas y con el Free Tour marcado. En el día del Free Tour (D3), el Panteón sale en rojo «Hoy cierra», con 15 min (por fuera).
- **Sin fechas no hay «hoy»,** así que no debería salir ningún «Hoy cierra». La app usa el día 15 del mes solo como referencia (`closedOnDate` ya dice que, sin fechas, no cierra).
- **Busca qué lo marca así:** puede ser el horario nuevo del Panteón de la 6j (la última entrada a las 18:30, o las misas).
- **Comprueba que no les pasa a otros sitios:** todos los sitios, sin fechas, en los 12 meses.

## 4. «Añade tu reserva» → «Día del viaje»
- **En la lista de días,** el día en el que ya está ese sitio lleva detrás «· aquí está ahora» (por ejemplo, «Día 2 · aquí está ahora») y sale ya elegido.
- **Se puede elegir igual:** así sabe que lo pone en el día bueno, y no se mueve nada.
- **Con fechas,** cada día con su fecha: «Día 2 · mar 12 ene · aquí está ahora».
- **En el móvil** la lista es la del sistema y no admite cursiva: por eso va como texto detrás.

## 5. «Añade tu reserva» con fechas: fuera la línea repetida
Ahora salen dos líneas: «Jueves 31 dic → tu Día 4» y «Tu reserva es del jueves 31: la pasamos a tu Día 4.».
- **Se queda solo la segunda,** sin rojo, como dijo la 6j.
- **Fuera la primera** (`dayLine` en `AddReservationSheet.tsx`).

## 6. Experiencias · Mercadillos navideños
- **El texto se sale de la tarjeta:** la línea «Es probable que algunos mercadillos ya hayan cerrado.» queda por fuera.
- **La tarjeta tiene que crecer con su texto,** como las demás.
- **Míralo a 375 px,** con las seis tarjetas.

## 7. RUTA · el mapa sin el aeropuerto
- **Quita el punto del aeropuerto** (Fiumicino) del mapa de la pestaña RUTA, para que el mapa se centre en Roma y no se vea pequeño. Que el encuadre cuente solo las paradas de los días.
- **Solo en RUTA.** En la ventana de llegada (Resumen · Traslados · Tips), el punto del aeropuerto se queda: ahí sí sirve.

## 8. Elegir la fecha y la hora, más bonito (en toda la app)
- **La fecha:**
  - fuera el campo del sistema (el «31/12/2026» con el icono);
  - sale una hoja desde abajo con el mismo calendario que el formulario (el `DayPicker` de «Añadir fechas», con los colores de la app);
  - **en una reserva,** solo se pueden tocar los días del viaje; los demás, en gris.
- **La hora:**
  - fuera el campo del sistema;
  - sale una hoja desde abajo con **dos ruedas que se deslizan,** como el reloj del iPhone: horas y minutos, de 5 en 5, con los colores de la app y la hora elegida resaltada en el centro;
  - se mueve con el dedo, con la rueda del ratón y con el teclado. Abajo, [Listo];
  - **cuando las horas posibles son pocas** (el Free Tour: 10:00, 12:00, 15:00, 17:00 y 21:00), en lugar de la rueda salen esas horas como botones;
  - **para el Coliseo, los Museos y la Galería,** solo las horas a las que se puede entrar ese día (punto 2).
- **Un solo componente de fecha y uno de hora para toda la app.** Sustituyen a todos los campos del sistema:
  - «Añade tu reserva» (día, hora y hora de vuelta);
  - las horas de los vuelos de RESERVAS;
  - «+ Añadir parada» en un día libre;
  - el menú de cada parada;
  - las fechas de otras reservas.

  Las pantallas de pruebas no.
- **Míralo a 375 px y en el ordenador.**

## 9. D3: la tarde del Vaticano, en otro orden (documento)
- **Ahora va así:** Museos → Plaza de San Pedro → Basílica → Conciliazione → Castillo → Puente.
- **Antes:** Basílica → Museos → Plaza, que era ir y volver (21 min de la Basílica a los Museos y 11 de vuelta).
- **Es como lo haría un guía:** el Free Tour ya enseñó el centro por la mañana, y la Basílica abre hasta las 20:00.
- **Comprueba** que no cambia la versión con los Museos reservados de 13:30 a 14:30, que ya iba así.

## 10. Pruebas
**Las de siempre, a 0 fallos:** 6g, 6h, 6i, 6j y `pruebaListas`, con las comprobaciones nuevas del punto 2 (lo que no puede pasar nunca) metidas en todas.

**Reservas, con y sin fechas, en viajes de 2 a 6 días:**
- el Coliseo, los Museos y la Galería, movidos a **cada día** del viaje (también el primero y el último);
- a primera hora, a mediodía y por la tarde.

Comprueba:
- se cambian los dos días enteros;
- 0 pantallas de error;
- 0 días a medias;
- 0 paradas cerradas, 0 comidas o cenas fuera de hora, 0 franjas repetidas;
- 0 reservas perdidas y 0 paradas inventadas;
- el Foro, siempre con el Coliseo.

**Sin fechas, los 12 meses:** 0 «Hoy cierra».

**A mano, en el navegador y en el móvil a 375 px:**
- **sin fechas,** mover el Coliseo del día 1 al día 3 y ver la hoja;
- **con fechas,** mover el Coliseo al último día y mirar los dos días;
- la lista de días con «· aquí está ahora»;
- la fecha y la hora nuevas, en «Añade tu reserva» y en los vuelos;
- la tarjeta de los Mercadillos;
- el mapa de RUTA sin el aeropuerto;
- el D3 con el orden nuevo.

Al final, **reinicia el api-server.**

## 11. Lo que NO va en esta tanda
- **Todo lo de llegadas y vueltas** (Tanda 7), incluido el orden nuevo de los días.
- **El aviso de una reserva en un día en que ese sitio cierra** (la Galería un lunes): va en la Tanda 7, con los demás avisos.
- **Lo del Free Tour en «+ Añadir parada»** (el primero de la lista, sus dos botones, las 12:00): Tanda 7.
