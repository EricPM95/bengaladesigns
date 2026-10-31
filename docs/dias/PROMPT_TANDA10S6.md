Hola. TANDA 10S6: SOLO DISEÑO, RÁPIDA (31-oct): LA HOJA DEL VUELO MÁS LIMPIA, LA RUEDA DE LA HORA IGUAL EN TODA LA APP, EL BLOQUE DE ENTRADAS COMO DESIGN Y LA CABECERA DEL ALOJAMIENTO. Va después de la 10S5 (ya hecha, con la 0071 corregida): si estás con otra tanda, acábala primero (con su push) y haz esta después. **No toques el motor de rutas ni la base de datos: esta tanda es solo lo que se ve.** Sin migraciones. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S6.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Migraciones aplicadas por Eric:** todas hasta la **0071** (la corregida).
- **Design:** el zip completo más nuevo, `RETOQUES.zip`, en la carpeta del proyecto. Pon al día `docs/diseno/proyecto/` con todo lo que cambia (sin `uploads/` ni `Archivo/`), también lo que es para la próxima tanda (`Piezas/Reorganizar`, `Piezas/Entradas Billete`, `Piezas/Pase Lista`). En esta tanda solo se usa `Piezas/Entradas Lista` (L1 y L2). **El diseño, exactamente igual; los textos y los datos, los de este prompt.**
- **Cómo trabajar (Eric quiere esta tanda rápida):** los 4 agentes a la vez, repartiendo los apartados; un solo servidor; hasta 2 Chrome de prueba a la vez. Nada de batería completa: solo las pruebas de lo tocado y `pruebaJutrip`. Si un apartado se complica, déjalo a medias, dímelo y sigue. Dime al empezar cuánto calculas que vas a tardar. La nota de estado (`docs/dias/_estado_10s6.md`) a la rama `estado` cada 30 minutos, de principio a fin. No apagues el PC.

## 1. La hoja del vuelo, más limpia (Eric, con capturas)
Para la hoja del vuelo del administrador y la del invitado, y lo mismo con tren, autobús y barco:
- **«Sales de»:** si la ciudad de salida tiene un solo aeropuerto, relleno como ahora («Barcelona (El Prat)»). Si tiene varios, la casilla vacía con **un ejemplo en gris**: la ciudad y uno de sus aeropuertos entre paréntesis («Londres (Heathrow)»), para que se vea cómo escribirlo. Con tren, igual con estaciones.
- **«Sale a las · opcional» sin hora:** fuera la raya «—». Que salga **una hora de ejemplo en gris** (por ejemplo «08:30») con el reloj a la derecha, como cualquier casilla vacía.
- **«Llegas a» pasa a «Aeropuerto de llegada»** («Llegas a» hace pensar en Roma). En la Vuelta, «Sales de» (Fiumicino o Ciampino) pasa a «Aeropuerto de salida». Con tren, «Estación de llegada» / «Estación de salida»; con barco, «Puerto de…».
- **La línea del pase** («Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.»): 10 px más de espacio arriba y 10 px más abajo.
- **Fuera de la hoja las cinco casillas** «Ref. vuelo», «Aerolínea», «Localizador», «Terminal» y «Asiento», y la línea «Solo lo ves tú: se guarda en tu móvil y se ve sin internet.» (además, desde la 0070 ya no es verdad). Esos datos llegan con la tarjeta de embarque (o el billete) y se cambian en la tarjeta del billete de RESERVAS. **Lo que ya esté guardado no se pierde** (solo se deja de pedir en esta hoja).
- **Fuera «¿Llegas o te vas otro día? Cambia las fechas del viaje»**.
- Después de la línea del pase, directamente **«¿Cuánto ha costado en total?»** y [Guardar el vuelo].

## 2. Elegir una hora, siempre igual en toda la app (regla nueva)
- Hoy, en la hoja del vuelo, la rueda de la hora se abre dentro de la hoja con «Toca fuera para cerrar: la hora se queda puesta» y «Quitar la hora», y según dónde toques fuera la hora se queda o no: lía.
- **Siempre así, en toda la app** (vuelo, entradas, Free Tour, gastos, cualquier hora): la rueda se abre **desde abajo**, en su propia hoja, como la del iPhone. Arriba, a la derecha, un **✓** para guardar la hora y una **papelera** para quitarla (la casilla se queda vacía, con el ejemplo en gris y el reloj, sin raya). **Tocar fuera también guarda la hora elegida**, toques donde toques.
- Repasa todas las ruedas de hora de la app y pásalas a esta. Dime cuáles has cambiado. Añádelo a las reglas.

## 3. «Entradas y Free Tour» como Design (`Piezas/Entradas Lista` L1 y L2)
- El bloque como L1 y L2: «Reservadas» arriba (con su ✓, el día, la hora, el precio y «Cambiar») y «Por reservar» debajo (con [Reservar entrada] y «¿Ya la tienes? Añádela», que abre la hoja de guardar la entrada de siempre).
- **El botón del código** de las reservadas, de momento sin pintar (llega en la próxima tanda, con el billete de las entradas).
- **Diferencias con Design:**
  - **sin «Ver 4 más»**: en su lugar, **[Añadir otra reserva]** (lo de la 10S4: el bloque enseña solo lo de tu ruta);
  - **las fechas enteras** también en las etiquetas («En tu ruta · Jueves 26», no «Jue 26»).
- Lo de la 10S4 sigue igual: se actualiza solo al añadir o quitar sitios con entrada, y una entrada guardada de una parada quitada se queda con «Ya no está en tu ruta».

## 4. La cabecera del alojamiento
- Si en algún sitio ha vuelto la línea de debajo del título del bloque del alojamiento («Roma · 3 noches», el nombre del hotel…), fuera, como dejó la 10S4.

## 5. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10S6`: la hoja del vuelo (el ejemplo en gris con una ciudad de varios aeropuertos, la hora de ejemplo sin raya, «Aeropuerto de llegada» y «de salida», sin las cinco casillas ni las dos líneas, los datos ya guardados sin perderse, el espacio de la línea del pase); la rueda de la hora desde abajo, con ✓ y papelera, y tocar fuera guarda la hora (en el vuelo, una entrada y un gasto); el bloque de entradas como L1 y L2, sin «Ver más», con [Añadir otra reserva] y las fechas enteras.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S6.html`, a tamaño de móvil, al lado de las de Design.

## 6. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S6»: qué has hecho, en palabras sencillas, y qué pruebas has pasado.

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10S6.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
