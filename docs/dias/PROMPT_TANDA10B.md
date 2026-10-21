Hola. TANDA 10B: ACABAR EL CLARO SIN MODO NOCHE, LA PESTAÑA RUTA, EL TÍTULO DEL DÍA DE VUELTA Y «VERME COMO VIAJERO SIN PASE». No toques el motor de rutas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10B.md e inclúyelo en tu commit.
- **Lo del modo noche se te cortó a medias.** Mira en qué punto se quedó (git status, cambios sin subir) y acábalo, con lo que te pedí:
  - la app sale **siempre en claro**, en marfil, blanco y oro, **como en Marca JUTRIP** (01 · Colores y 02 · Pantallas, con HOY como la 09). El modo noche no se enciende nunca, tampoco si alguien lo tiene guardado de antes en el navegador (borra ese ajuste al abrir);
  - lo único oscuro, lo que Design dibuja oscuro en Marca JUTRIP: la barra de abajo A y la franja «Estás en Roma» de RESERVAS. Si queda algo oscuro que en Marca JUTRIP es claro, pásalo a claro y dime qué era;
  - si quitar el código del modo noche (la clase `dark`, sus colores de `index.css` y los arreglos de noche de la Tanda 10) es sencillo y no rompe nada, quítalo; si no, déjalo apagado para siempre y dime por qué;
  - borra de `docs/dias/capturas_jutrip/` las capturas de noche.

## 1. La pestaña RUTA: los iconos
- En la tarjeta del destino («Roma · 4 días · 3 noches»), los iconos de la derecha, **un poco más pequeños**.
- **Un icono más: compartir el viaje**, con el dibujo de compartir de siempre. Abre lo que ya existe para compartir o invitar al viaje (Cuentas, parte 3).
- **Fuera el círculo negro** que sale arriba a la derecha, pegado encima de la tarjeta. Si es algo que hace falta (por ejemplo, la cuenta), dime qué es antes de quitarlo y dónde lo pondrías.

## 2. La pestaña RUTA: el mapa, solo con los destinos
- El mapa de RUTA **ya no es el de DÍAS** (el de DÍAS no se toca). Enseña solo los destinos del viaje (ahora, Roma), centrado en ellos, sin las paradas.
- Con **los puntos por donde se llega**, cada uno con su icono, según el medio elegido para llegar (los datos ya están en `data/dias/roma/_llegada.json → medios`):
  - **avión:** Fiumicino y Ciampino;
  - **tren:** Roma Termini y Roma Tiburtina;
  - **autobús:** la estación de autobuses de Tiburtina;
  - **ferry:** el puerto de Civitavecchia;
  - **coche:** sin punto; solo la ciudad.
- Si ya ha puesto su vuelo, su tren o su autobús, el punto que va a usar, resaltado.
- Los iconos, finos y en oro, como los demás de la app.

## 3. El título del día de vuelta
- Hoy el día de vuelta sale con «Día de viaje» como título y «Roma → Barcelona» debajo. Que vaya como el de llegada: un título de verdad, **«Hoy vuelves a casa»** (el de la tarjeta del día de vuelta), y debajo «Roma → Barcelona · Día de viaje».
- Sin vuelo, ese día sigue sin paradas (decidido así), pero con una tarjeta que lo explique y dé dos caminos, en letra que se lea bien (nada de gris claro ni cursiva pequeña):
  - **«Tu vuelo» cambia según cómo vuelve** (el medio que eligió en el formulario): «tu vuelo», «tu tren», «tu autobús», «tu ferry»; en coche, «tu hora de salida»; si no lo sabemos, «tu vuelo o tu tren». En los dos textos de abajo.
  - **Sin el pase:**
    - título: **«El último día, a la medida de tu vuelo»**;
    - texto: «Entre dejar el alojamiento, la maleta y llegar con tiempo al aeropuerto, el día de vuelta es el más difícil de organizar. Con el **Pase de Roma**, pones la hora de tu vuelo y te montamos la mañana para que la aproveches al máximo, sin prisas ni sustos. ¡Y no es todo: tienes **más de 20 ventajas** y tu viaje en directo con HOY!» («Pase de Roma» y «más de 20 ventajas», resaltados en oro como en `TextoConPase`; «llegar con tiempo al aeropuerto» cambia a «a la estación» o «al puerto» según el medio);
    - **El número, de verdad, nunca a ojo:** que salga de una lista de lo que incluye el pase guardada en los datos (por ejemplo, `data/pase/incluye.json`), sacada del apartado «EN EL PASE» de `docs/dias/GRATIS_Y_PASE.md`, **con cada cosa por separado**: los sellos, las colecciones, los emblemas secretos, los logros de viajero, el resumen del día, el del viaje… (no «los logros» como una sola). La app la cuenta, y si son 21 o más, el texto dice siempre **«más de 20 ventajas»** (también con 30 o más). Si salen menos de 21, que diga el número exacto y avísame. Cuando entren cosas nuevas (el compañero de HOY, descargar el viaje sin conexión…), se añaden a la lista y el número sube solo. Dime cuántas salen hoy y cuáles;
    - botones: **[Ver el Pase de Roma]** y, debajo, **[+ Añadir mis lugares]** (abre «Añadir parada» para ese día).
  - **Con el pase:**
    - título: **«Tu último día, a la medida de tu vuelo»**;
    - texto: «Pon la hora de tu vuelo y te montamos la mañana con lo que te da tiempo a ver.»;
    - botones: **[+ Vuelo]** (o [+ Tren], [+ Autobús]…) y **[+ Añadir mis lugares]**.
  - Usa la tarjeta y los botones que ya hay en la app (la de «Añade tu vuelo de vuelta»), con los colores de Marca JUTRIP. Quita «Fin del viaje. Arrivederci, Roma.» si queda debajo con la tarjeta nueva, o déjalo como cierre si cabe sin estorbar.

## 4. «Verme como viajero sin pase» (para mis pruebas)
- En /?admin=logros, un interruptor: **«Verme como viajero sin pase»**. Apagado por defecto.
- Encendido, la app me trata como a alguien que no ha comprado el pase: lo de pago, cerrado, y los avisos que invitan a comprarlo, como los vería cualquiera. Apagado, vuelvo a tener mi pase, como si lo acabara de comprar.
- Solo para los emails de LOGROS_ADMIN_EMAILS, y lo decide siempre el servidor (nada del móvil puede encenderlo). Solo afecta a mi cuenta. No toca el pase de verdad ni los cobros.
- Que se vea que está encendido: una etiqueta pequeña «Sin pase (prueba)» solo para mí.

## 5. La prueba
- No toca el motor: la batería rápida y `pruebaJutrip` (sin las comprobaciones de noche).
- Pruebas nuevas:
  - el modo noche no se enciende ni con el ajuste viejo guardado;
  - el mapa de RUTA enseña los puntos de cada medio (avión, tren, autobús, ferry, coche) y no las paradas;
  - el título del día de vuelta;
  - otra cuenta no puede encender «Verme como viajero sin pase»; encendido, lo de pago sale cerrado; apagado, vuelve el pase.
- El peso al abrir la app, antes y después.
- **Capturas** en `docs/dias/capturas_jutrip/`, en tamaño móvil: RUTA con avión, tren, autobús y coche; DÍAS con el día de vuelta; y de día, HOY, DÍAS (abierto y cerrado), EXPLORAR, RESERVAS, Logros, el Pase y la ficha de una parada; y dos pantallas con «Verme como viajero sin pase» encendido.

## 6. El informe (docs/dias/INFORME_TANDA10B.md)
En español sencillo: qué has cambiado, qué era el círculo negro, si has quitado el código del modo noche y qué tengo que mirar en el móvil.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
