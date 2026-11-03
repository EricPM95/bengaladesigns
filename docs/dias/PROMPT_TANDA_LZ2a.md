Hola. TANDA LZ2a: LANZAROTE, PARTE 2a: QUE LA APP SEPA MOVERSE EN COCHE Y MONTE LOS DÍAS, PARA QUE ERIC LA USE EN SU VIAJE (4-nov). Eric se va a Lanzarote el DOMINGO 8-nov: esto tiene que estar subido el SÁBADO 7 por la mañana como tarde. Si no llega todo, sube lo que funcione (en 0 fallos) en el orden de abajo y dime lo que falta. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **La portada de Lanzarote:** la que Eric te eligió en el botón; si no te contestó, la 3 (Papagayo).
- **Regla de oro, igual que en la LZ1:** Roma no cambia. Todo detrás de los ajustes del destino (`medio: "coche"`…). Después de cada cambio del motor, la muestra de 60 fechas de Roma idéntica y `pruebaJutrip` en 0. Lanzarote sigue oculto: solo el administrador.
- **Para no agotar el límite de uso:** 2 agentes como mucho, 1 Chrome, un servidor. Lee solo lo que necesites de cada documento de `docs/destinos/lanzarote/` y de tu `INFORME_DIAS_MAPBOX.md`. Nota de estado (`_estado_lz2a.md`) a la rama `estado` cada 30 minutos y al acabar cada apartado. No apagues el PC.

## 1. El motor en coche (lo primero)
Lo de «Imprescindible» de `LANZAROTE_PARA_CODE.md` (puntos 2 a 9):
- **Trayectos:** dentro de una parada, a pie; entre paradas, en coche, con tu tabla `lanzarote_coche.json` más el rato de aparcar. Se leen «En coche · 25 min · 18 km» con [Abrir en Maps], que lleva a la coordenada de la parada (su aparcamiento). Nunca «taxi». Usa la pieza de trayecto que ya hay, con un icono de coche (Design la mejorará después).
- **La ida desde el alojamiento y la vuelta a casa cuentan.** Sin pase, desde la zona más lejana a ese día (la ruta es igual para todos). Con pase, desde la zona del viajero, con la hora de salir de casa.
- **Tope de coche: 3 h al día.**
- **Sin paseo nocturno:** el día acaba con el atardecer y la cena.
- **Entradas con hora solo online** (Timanfaya, Cueva de los Verdes): «Llegada a…» 15 min antes, como el Coliseo, y el aviso de comprarlas con tiempo en la web oficial.
- **Lo que en la LZ1 dejaste atado a Roma y hace falta para usarla:** `meses_invierno` y `excursion_interruptor` de Lanzarote, `insideSwitch.js`, `llegadaDia1.js`, el menú del día (DayMenu, sin Pompeya ni Florencia) y la ciudad de Civitatis por excursión (no `?? 'roma'`). Lo demás (EXPLORAR, Lista del pase, logros, ejemplos en gris) es de la LZ2b.

## 2. Los días de Lanzarote
- Que el motor lea `data/dias/lanzarote/listas.json`: los 5 días curados, sus variantes (domingo con el mercadillo de Teguise, sábado con el mercado de Haría, viernes con las Noches de Jameos, 1 de enero, viaje de 2 días con la Fundación, invierno y verano), el orden de los días por prioridades, La Graciosa como día de excursión y Fuerteventura en los viajes de 7 días. Todo como dice `DIAS_CURADOS_LANZAROTE.md`. No cambies los días.
- **Comidas:** las de cada día en `DIAS_CURADOS_LANZAROTE.md`, con su alternativa (`RESTAURANTES_LANZAROTE.md`, solo las comidas de los días).
- **Regla nueva 1 (Eric, 3-nov), los opcionales salen solo si caben.** Si un opcional hace llegar tarde a lo siguiente (a su última entrada o a su turno), o pasa del tope de 3 h, el motor lo quita solo, empezando por el menos importante. El viajero puede añadirlo desde EXPLORAR, con el aviso de siempre («posiblemente ya esté cerrado»). En el día 3 se quita primero la Ciudad Estratificada, y con eso se llega al Campesino. Lo mismo en el día 3 con Arte (LagOmar): si aun así no cabe, dímelo.
- **Regla nueva 2 (Eric, 3-nov), la cena cerca del alojamiento.** Con pase, tras el atardecer vuelves y cenas cerca de tu zona, con 2-3 restaurantes de `RESTAURANTES_LANZAROTE.md` («Cenas cerca del alojamiento, por zona»). Sin pase sale «Cena cerca de tu alojamiento», sin restaurante. Con esto, el día 4 desde El norte tiene que bajar de 3 h: compruébalo.

## 3. Las zonas y el pase en Lanzarote
- Las 7 zonas de `ZONAS_ALOJAMIENTO_LANZAROTE.md` en lugar de Termini, Prati…, con sus ids.
- **Con pase, la zona adapta CADA día** (en Roma solo el primero y el último): la hora de salir, la cena cerca y el aviso si el día pasa de 3 h. Lo de «el orden al revés cuando sale más corto» solo si te da tiempo; si no, a la LZ2b.
- Texto del pase en Lanzarote: «Adaptamos cada día a donde duermes: a qué hora salir, por dónde empezar y dónde cenar cerca».

## 4. El formulario de Lanzarote
- **«¿Vas a moverte en coche?»**: «Sí, de alquiler» (con la etiqueta «Muy recomendado»), «Sí, el mío» y «No». Con el mismo estilo de las otras preguntas del formulario (Design la mejorará después).
  - **De alquiler:** el bloque del coche de alquiler en RESERVAS (ya existe) y, el día de llegada, el rato de recoger el coche (30-45 min).
  - **No:** la misma ruta, con el aviso al empezar y, arriba de cada día, su «¿Sin coche?» con la excursión de Civitatis y lo que deja fuera (`DIAS_CURADOS_LANZAROTE.md`, apartado 1b y cada día; enlaces en tu `_civitatis.json`).
- **Las 4 experiencias de Lanzarote** en lugar de las de Roma: Manrique y arte, Volcanes y senderismo, Playa y calma, Vino y cocina canaria. Lo que cambia cada una está en `DIAS_CURADOS_LANZAROTE.md`.
- **Sin la pregunta del Free Tour** (en Lanzarote no cambia la ruta).

## 5. Llegar y volver
- Aeropuerto de Lanzarote (ACE): el día de llegada y la tarjeta «Hoy vuelves a casa» del día de vuelta (la de la 10S11), con el trayecto en coche desde la zona. Solo la parte de llegada y vuelta de `LLEGADA_FECHAS_CONSEJOS_LANZAROTE.md`.
- Hora de Canarias (`Atlantic/Canary`) en DÍAS, HOY, vuelos y avisos.

## 6. Que Eric pueda usarla en su viaje
- Con su cuenta de administrador, desde el móvil: crear un viaje a Lanzarote que empieza el domingo 8-nov y usar DÍAS y HOY con la hora de Canarias. Pruébalo con el viaje de Eric: duerme en **Costa Teguise** (5 días si no te dice otros), con y sin pase. Y con El norte, la zona con más coche.
- Comprueba también lo de la LZ1 que no se pudo probar: con administrador real se ve Lanzarote; sin sesión, no.

## 7. La prueba
- La muestra de 60 fechas de Roma, idéntica. `pruebaJutrip` en 0. Las pruebas de lo tocado.
- Prueba nueva `pruebaTandaLZ2a` con la muestra de fechas de Lanzarote (domingo, sábado, viernes, 1 de enero, invierno y verano; 2 a 7 días; desde las 6 zonas; con y sin pase; con coche y sin coche). Tiene que comprobar:
  - ningún día pasa de 3 h de coche;
  - ningún sitio se pasa de su última entrada o de su turno;
  - comida antes de las 15:00;
  - los opcionales se quitan cuando no caben;
  - la cena cerca de la zona con pase;
  - nunca sale «taxi» ni «Roma»;
  - nunca sale paseo nocturno;
  - Lanzarote oculto para quien no es administrador.
- En el REPASO, capturas de móvil de un día de Lanzarote (trayectos en coche, cena cerca, «¿Sin coche?», el formulario, la llegada y la vuelta). Y tu lista de comprobación DE ESTA TANDA, como siempre.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
