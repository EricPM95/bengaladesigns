# Para Code · Tanda 6g: el día de excursión, con el diseño nuevo

Esta tanda cambia el día de excursión de los viajes de 4, 5 y 6 días y quita el generador «Generar una ruta para este día».

**Antes de empezar:**
- **`docs\dias\DIAS_ROMA_PARADAS.md` ha cambiado.** Pásalo por el convertidor y no lo toques. Lo que ha cambiado:
  - la tabla «Qué días lleva cada viaje» y «El día de excursión» (ahora están en el propio documento, ya no en `DIAS_ESCRITOS_ROMA.md`);
  - la noche del D5;
  - el D6 (Navona y el Campidoglio pasan a de camino, el Teatro de Marcelo es parada, la terraza del Altar, la cena y la noche);
  - la comida del D7 y su domingo;
  - «Excursión de medio día».
- **El diseño está en `docs\diseno\excursion\`.** Ábrelo antes de tocar nada:
  - `Excursion_Dia_4.dc.html` y `.png`: **la página de la excursión.** Es el diseño elegido.
  - `Interruptor_2a.dc.html` y `.png`: **el interruptor.** Es la variante «2a · Interruptor». Las demás variantes de ese archivo no se usan.
  - `Prototipo_dias_4_5_6.dc.html` y `Prototipo_5_dias.png`: **el prototipo con todo junto y funcionando**, con nuestros textos. Si algo del diseño original choca con esta tanda, manda esta tanda.
  - Los `.dc.html` son prototipos: coge **el diseño** (colores, letras, tamaños y orden), no el código. Va con el estilo de la app.

## Cómo trabajar

- **Nada de parches:** cada regla, en un sitio y para todos los destinos.
- **`PROGRESO_TANDA6G.md`,** con una línea por bloque y TERMINADO al final.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA6G.md`.
- **Al acabar,** `INFORME_TANDA6G.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. Fuera el generador «Generar una ruta para este día»

**Lo que pasa ahora:** en el día de excursión sale «Generar una ruta para este día». Genera un día que no es nuestro: «Casco histórico de Roma» con la foto de una cueva junto al mar, «Museo de Arte de Roma», «Hora de comer»…

**Lo que hay que hacer:**
- **Quita el generador del todo, en todos los destinos.**
- **En el informe:**
  - de dónde salían «Casco histórico de Roma» y «Museo de Arte de Roma» (no son sitios de verdad); bórralos de los datos;
  - dónde más se usaba ese generador (por ejemplo, del día 7 en adelante o en los destinos sin días escritos). Ahí va lo del punto 8.

**Quita también la pantalla intermedia de «Prefiero quedarme en Roma»,** la de las paradas famosas con «Organízame este día». Ya no hace falta: con el interruptor en Roma, sale directamente el día escrito.

## 2. Qué días lleva cada viaje

Es la tabla nueva del documento («Qué días lleva cada viaje» y «El día de excursión»). Lo importante:

| Viaje | Día 4 | Por defecto | Con el interruptor en Roma |
|---|---|---|---|
| 4 días | con interruptor | **Roma** | D5 |
| 5 días | con interruptor | **Excursión** | D6 |
| 6 días | con interruptor | **Excursión** | D7 |

- **Con Free Tour,** los días 1 y 2 son D3 y D1-FT. El día 4 funciona igual.
- **El interruptor solo cambia el día 4.** Los demás días no se mueven ni se recalculan, salvo lo que obliguen las reglas de no repetir:
  - si el día 4 pasa a ser un día de Roma, ese día no puede repetir los restaurantes ni las nocturnas de los demás;
  - y si el día 4 se queda con una nocturna, la del día que venía detrás cambia a la siguiente que toque (regla 13). Pasa en 6 días: el D7 se queda con el Panteón y Navona, y el D5 pasa al Puente y el Castillo.
- **El día de excursión nunca es el de llegada ni el de vuelta.** Las llegadas son de la Tanda 7: ahora déjalo en el día 4.

## 3. La tarjeta del día 4 (pestaña DÍAS)

- **El interruptor [Roma | Excursión]** va en la tarjeta, debajo del título, y se ve aunque esté plegada. Mira `Interruptor_2a.png`, el primer móvil:
  - son dos botones de verdad, de 44 px de alto como mínimo;
  - el elegido va en blanco y con sombra;
  - en «Excursión» lleva un circulito con la foto de la excursión elegida.
- **Con el interruptor en Roma:**
  - el título es el nombre del día (por ejemplo, «Las basílicas y el Aventino»);
  - al abrirla, el día escrito de siempre, con sus paradas, sus trayectos y todo lo demás.
- **Con el interruptor en Excursión:**
  - el título es **«Excursión desde Roma»**;
  - debajo, la etiqueta «Día de excursión» en el **naranja de la app** (no en rojo, que parece un error);
  - debajo, «13 h · vuelta a Roma 20:00», con los datos de la excursión elegida;
  - con la excursión confirmada, «✓ Reservada · {nombre de la excursión}»;
  - al abrirla, la página del punto 4.
- **Si la excursión está confirmada y el viajero pasa el interruptor a Roma,** antes de cambiar sale este aviso: «Tienes reservada la excursión a {nombre} ({código}). Si cambias a Roma, la reserva sigue en Civitatis: si no vas a ir, cancélala allí». Lleva dos botones:
  - **«Cambiar a Roma»:** cambia el día; la reserva se queda en RESERVAS;
  - **«Seguir con la excursión»:** no cambia nada.
- **El interruptor se guarda con el viaje,** como cualquier otro cambio del viajero.
- **La etiqueta «Día de viaje»** (la de los días de llegada y de vuelta) también pasa del rojo al **naranja de la app**, igual que «Día de excursión». En la app no queda ninguna etiqueta de día en rojo: el rojo es solo para avisos de verdad.

## 3b. El resumen del día (todos los días, todos los destinos)

El resumen («10 paradas · 10,0 km a pie · 5h 25 de actividad») tiene que quedar como en `docs\diseno\excursion\Resumen_del_dia.png`:
- **ocupa todo el ancho del bloque,** alineado con el resto de la tarjeta (el mismo margen a izquierda y derecha que «Hoy el sol se pone a las…»);
- **con su fondo visible:** el beige claro de la app y las esquinas redondeadas;
- **tres columnas iguales,** separadas por una línea fina vertical;
- **en cada una:** el número grande (con la letra de los títulos) y debajo la etiqueta pequeña en mayúsculas (PARADAS · KM A PIE · DE ACTIVIDAD), centrados;
- **en el día de excursión** (con el interruptor en Excursión) no sale el resumen: ya está la línea de horas.

## 4. La página de la excursión

Es la de `Excursion_Dia_4.png`, de arriba abajo:

1. **La frase del porcentaje,** con su círculo: «En un viaje de {n} días a Roma, el {x}% de la gente dedica al menos uno a visitar {excursión}».
   - **Solo sale si la excursión tiene el dato en los datos** (punto 5).
   - **Sin el dato, la frase no sale.** Nunca un número inventado. El 87% del prototipo no vale.
2. **La foto** (si no hay foto propia, un recuadro de color, no uno vacío), con:
   - arriba a la izquierda, «Excursión del día»;
   - arriba a la derecha, «desde {precio}»;
   - con la excursión confirmada, abajo a la derecha, «✓ Reservada · {código}».
3. **El nombre:** «Excursión a *Pompeya* y Sorrento», con el destino en cursiva y en naranja. **Cambia con la excursión elegida.**
4. **Las etiquetas:** duración, transporte, guía y entrada incluida, según la excursión.
5. **La línea de horas:** Roma 07:00, Pompeya 10:30, Sorrento 14:30 y Roma 20:00, según la excursión.
6. **El texto** de la excursión, de 2 o 3 líneas.
7. **[Ver disponibilidad]:** abre en una pestaña nueva la página de **esa excursión** en Civitatis, con el enlace de afiliado de los datos.
   - **Nada de elegir la hora dentro de la app,** ni «Quedan 6 plazas», ni códigos inventados como los del prototipo.
   - **Con la excursión confirmada,** este botón no sale.
8. **«¿Ya la has reservado? Añade tu confirmación».** Abre:
   - **«¿Qué excursión has reservado?»:** una lista con las excursiones de los datos, con la que se está viendo ya elegida. Así se sabe cuál es aunque la haya reservado directamente en Civitatis.
   - **«Código de reserva»**
   - **[Guardar]**
   - **Al guardar:**
     - la página cambia a esa excursión;
     - sale «✓ Reservada · {código}»;
     - la reserva va a la pestaña RESERVAS, como las demás, con su día;
     - y el enlace pasa a decir «Cambiar confirmación».
9. **«Ver más excursiones (4)»,** con el número que haya. Abre la lista de las demás: el color o la foto, el nombre y «13 h · desde 65€».
   - **Al elegir una,** la página entera cambia a esa excursión, con el mismo diseño: el nombre, las etiquetas, la línea de horas, el texto, el precio, la foto y el enlace.
   - **Con la excursión confirmada,** este botón no sale.
10. **Solo si la excursión es de medio día (Ostia, Tívoli):** el texto «Vuelves a Roma a las 14:00. La tarde es para ti.» y el botón **«+ Añadir lugares»**, con el mismo estilo que «Añadir día» de la pestaña DÍAS. Abre EXPLORAR, y lo que se añada va a la tarde, desde las 14:00, con las reglas de siempre.
11. **«O sin excursión»** y dos botones:
    - **«Prefiero quedarme en Roma»,** con el subtítulo «Te preparamos un día por Roma». Pasa el interruptor a Roma (con el aviso del punto 3, si está confirmada).
    - **«Crear mi propio día»,** con el subtítulo «Elige tus sitios en el mapa». Lleva a lo del punto 7.

**El día de excursión lleva solo la excursión:** ni comida, ni cena, ni noche propuestas. Si el viajero quiere algo más, lo añade él.

## 5. Los datos de las excursiones

Haz un archivo de datos de excursiones por destino, que se pueda rellenar sin tocar código. De cada excursión:

- **El nombre**, en tres partes para la cursiva: «Excursión a» + «Pompeya» + « y Sorrento».
- **El nombre corto** («Pompeya»).
- **La duración.**
- **La hora de vuelta.**
- **Si es de medio día.**
- **El precio «desde».**
- **El enlace de afiliado de Civitatis.**
- **Las etiquetas.**
- **Las paradas de la línea,** con su hora.
- **El texto.**
- **La foto,** con su crédito.
- **El porcentaje,** que puede ir vacío.
- **El orden.** La primera es la que sale por defecto: en Roma, Pompeya y Sorrento.

**Mientras no lleguen los datos de verdad:**
- Usa las 5 del prototipo (Pompeya y Sorrento, Tívoli, Ostia Antica, Florencia y la Costa Amalfitana), con `"ejemplo": true`.
- Los precios que no estén, como «XX€».
- El enlace, vacío. Sin enlace, «Ver disponibilidad» sale igual, pero solo enseña «Enlace pendiente».
- El porcentaje, vacío, así que la frase no sale.

En el informe, la lista de lo que falta por rellenar.

## 6. La pestaña HOY el día de excursión

- **Sale la excursión:** su nombre y su hora de salida, con el código si está confirmada. Nada más.
- **Si es de medio día,** después sale lo que el viajero haya añadido a la tarde.
- **Con el interruptor en Roma,** el día de siempre.

## 7. «Crear mi propio día»

- **Abre EXPLORAR,** la pantalla de sitios del destino con el mapa, que ya existe.
- **El viajero puede añadir varios sitios de golpe.**
- **Al aceptar, la app monta la ruta de ese día con esos sitios:**
  - en orden y sin zigzag;
  - con la comida y la cena donde acaba cada franja;
  - con las reglas de siempre: nada cerrado, por dentro una sola vez y sin repetir restaurantes.
- **Después se cambia como cualquier día,** con «+ Añadir parada».
- **El día que se crea ocupa el lado «Roma» del interruptor.** Si el viajero pasa a Excursión y vuelve a Roma, recupera su día, no lo pierde.
- **Para volver al día escrito por nosotros:** en el menú «···» del día, «Volver al día propuesto».

## 8. Del día 7 en adelante, y destinos sin días escritos

En lugar del generador sale una hoja desde abajo:
- **Título:** «Ya has visto lo mejor de Roma» (en los otros destinos, su nombre).
- **Texto:** «A partir de aquí, el viaje lo eliges tú: te enseñamos los sitios que aún no has visto para que montes cada día a tu gusto.»
- **Botón:** «Elegir mis sitios». Abre EXPLORAR y funciona como el punto 7.

## 9. Lo que quedó de la 6f (ya está en el documento)

- **Líneas de transporte público:** la sección «Líneas de transporte público de Roma que usa la app». Cuentan con **12 min andando** en cada punta (no 8). Si de Trastevere al Coliseo sigue sin salir línea, se queda andando o en taxi: está bien.
- **D1-corto:** el Ponte Sisto va de camino, y la tarde tiene que volver a caber.
- **Los Museos reservados de 12:30 a 13:00:**
  - no tienen lista: al meter la reserva, la app avisa y propone las 11:00 o las 14:00 (regla 17);
  - la lista de mediodía es ahora de 13:30 a 14:30.

## 10. Pruebas

En los viajes de 4, 5 y 6 días, las 365 fechas de 2027, con y sin Free Tour, y con el interruptor en las dos posiciones:

1. **0 veces «Generar una ruta para este día»,** «Casco histórico de Roma» o «Museo de Arte de Roma», en ningún destino ni duración.
2. **El día 4 sale por defecto como dice la tabla:** Roma en 4 días; Excursión en 5 y 6.
3. **Con el interruptor en Roma,** el día 4 es D5 (4 días), D6 (5 días) o D7 (6 días). Al cambiar el interruptor, los demás días siguen iguales, salvo la nocturna que obligue la regla 13.
4. **El día de excursión:** 0 comidas, 0 cenas y 0 nocturnas propuestas.
5. **0 restaurantes repetidos y 0 nocturnas repetidas** en todo el viaje, con el interruptor en las dos posiciones. Por ejemplo:
   - el D6 cena en Giggetto (Nonna Betta es la comida del D1);
   - el D7 no usa Tonnarello si ya es la cena del D2.
6. **Las noches:**
   - el D5 lleva el Panteón y Navona en 4 y 5 días, y el Puente y el Castillo en 6 días con el D7 en el día 4;
   - en 5 y 6 días el D6 va sin nocturna;
   - ninguna nocturna es un sitio visto ese mismo día (regla 11c).
7. **La terraza del Altar sigue en el D6** aunque el D1 lleve el Altar por dentro.
8. **En el D6, la Piazza Navona y el Campidoglio salen como «de camino»,** con «Ya lo visitaste el día 1».
9. **Lo de siempre:** nada cerrado, sin zigzag y por dentro una sola vez.
10. **La excursión de medio día:** la línea de horas acaba a las 14:00 y sale «+ Añadir lugares».
11. **La página de simulación:** añade los viajes de 4, 5 y 6 días, cada uno con el interruptor en Roma y en Excursión, y uno con una excursión de medio día.

**Comprobación a mano en el móvil**, y apunta en el informe lo que no hayas podido probar:
- el interruptor;
- «Ver más excursiones»;
- añadir la confirmación;
- el aviso al pasar a Roma con la excursión confirmada;
- «Crear mi propio día»;
- «Añadir lugares»;
- la hoja del día 7.

Al final, **reinicia el api-server.**

## 11. Lo que NO va en esta tanda

- **Las llegadas y las salidas:** Tanda 7. No toques la pantalla «¿Cómo quieres llegar a…?».
- **Los datos de verdad de las excursiones:** enlaces, precios, porcentajes y fotos. Los pasaré yo.
- **Los créditos** de las fotos de Via della Conciliazione y Via dei Fori Imperiali.
- **La pestaña HOY en detalle.**
