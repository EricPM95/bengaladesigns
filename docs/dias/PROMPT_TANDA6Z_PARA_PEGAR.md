Tanda 6z: arreglos de EXPLORAR y del alojamiento (con añadir tu alojamiento), y «viajeros lo recomiendan». Va todo en este mensaje. La 6x ya está subida: puedes empezar. No cambia cómo se montan los días. Tus preguntas de la 6x las contesto en otra tanda: de momento, déjalas como están.

Antes de empezar: he copiado en docs\dias un DIAS_ROMA_PARADAS.md nuevo (solo cambia el texto de la regla 3: las franjas sin hora, que ya hiciste en la 6x), PENDIENTES_6K.md, GUIA_NUEVOS_DESTINOS.md, este prompt (PROMPT_TANDA6Z_PARA_PEGAR.md) y el de la 6y (PROMPT_TANDA6Y_PARA_PEGAR.md), y el diseño de la ruta a mano en docs\diseno\ruta_manual\ (Itinerario Eleccion.dc.html y support.js). Mételos en un commit tal cual. La 6y NO la hagas todavía: va mañana.

1. EXPLORAR: LA LISTA DE DEBAJO DEL MAPA, SOLO CON EL NOMBRE
En las tarjetas de la lista (`PlaceExplorerScreen.tsx`), en los lugares que se visitan (no en restaurantes, baños ni fuentes):
- Fuera la línea pequeña de debajo del nombre: la zona («Roma antigua»), la duración («10 min») y «Entrada» con el billete.
- Se quedan:
  - la foto;
  - el nombre;
  - el corazón con sus «me gusta»;
  - el botón de la derecha;
  - «Hoy cierra», si cierra ese día (es un dato real y útil);
  - la distancia, que solo sale con la ubicación del viajero (durante el viaje).
- Restaurantes, baños y fuentes, como están: su tipo y precio, si es de pago, etc., sirven para elegir.
- El botón «✓ En ruta», más pequeño: más bajo y con la letra más pequeña que «+ Añadir», para que no robe protagonismo al nombre. Mismo color y mismo sitio.
- En la ficha del lugar no cambia nada: la zona, la duración y la entrada siguen ahí.

2. EXPLORAR: EL FILTRO «ENTRADAS», CON EL FREE TOUR PRIMERO
- Con el filtro «Entradas» activado, lo primero de la lista, arriba del todo, es siempre el «Free Tour por Roma» (el del destino, de `entradas_reservas`), con su foto y su ficha.
- Debajo, el resto de entradas, en el orden de siempre.
- Si el Free Tour no es un lugar de la lista hoy, añádelo solo en este filtro, con los datos que ya tiene en RESERVAS. Si no se puede, dímelo en PREGUNTAS.
- Nada escrito de Roma en el código: el Free Tour de cada destino sale de sus datos.

3. RESERVAS: EL ALOJAMIENTO, CERRADO AL ABRIR
- Ahora el bloque de alojamiento sale abierto. Tiene que salir cerrado, como acordeón, igual que «Llegada y vuelta» y «Entradas y Free Tour»: icono, título, «Falta» (o «✓ Hotel Artemide», o la zona en la de pago), y la flecha.
- Se abre al tocarlo, como los demás.
- En la gratis y en la de pago.

4. EL MAPA DEL ALOJAMIENTO, A PANTALLA COMPLETA
- Ahora [Buscar alojamiento] abre la hoja de abajo con el tirador (`HojaAbajo` ancha, en `AlojamientoReservas.tsx`). Cambia a una pantalla completa, sin tirador:
  - arriba, una barra con el título «Alojamiento en {destino}» y una ✕ (o la flecha de atrás) para cerrar;
  - debajo, el mapa de Stay22 ocupando todo lo demás, a lo ancho y a lo alto;
  - el mismo mapa y los mismos datos que ahora (`aid` viajesbengala, las fechas del viaje, la campaña).
- Con un enlace pequeño abajo, fuera del mapa: «¿Ya tienes alojamiento? Añádelo», que abre la hoja nueva «Tu alojamiento» (punto 7).
- A 375 px y en el ordenador.

5. LA MISMA PANTALLA DESDE EXPLORAR Y DESDE EL DÍA 1
- EXPLORAR: vuelve el botón «Hoteles» en la fila de filtros, en la pantalla principal de EXPLORAR (`ExplorePanel`) y en las demás donde salga EXPLORAR. Al tocarlo, abre la pantalla completa del punto 4. No es un filtro del mapa: es un botón que abre esa pantalla.
- El día 1: en la fila de alojamiento que va encima de la llegada («Añade alojamiento en {destino}» con el «+», `AccommodationBlock.tsx`), al tocar, abre la misma pantalla completa del punto 4. Añadir el alojamiento que ya tiene queda en el enlace «¿Ya tienes alojamiento? Añádelo» de esa pantalla (punto 7). Con el alojamiento ya puesto, la fila no abre el mapa: abre «Tu alojamiento» para verlo o cambiarlo.
- Todos los enlaces de hoteles de la app llevan a esta misma pantalla, nunca directos a otra web: también los de `AddToTripScreen.tsx` y `DestinationDetailModal.tsx`, que hoy usan `buildHotelSearchUrl`. Dime en el informe cuáles había.

6. FUERA EL RECUADRO LILA DE DÍAS
- Fuera, por ahora, el recuadro lila «¿Necesitas alojamiento?» de arriba del todo en DÍAS (`MissingAccommodationBanner` en `DayList.tsx`).
- Solo deja de pintarse: no borres la pieza, que puede volver más adelante.

7. AÑADIR TU ALOJAMIENTO (el que ya tiene el viajero) Y EL BLOQUE DE RESERVAS, REHECHO
Hoy no hay forma real de añadir el alojamiento que ya tiene el viajero: el «+» del día 1 abre `AccommodationHotelModal`, que enseña hoteles inventados (`mockHotels`, con precios y notas de ejemplo). Eso no puede verlo nadie.
- Fuera de lo que ve el viajero todos los datos de ejemplo de hoteles y actividades (`mockHotels`, `mockActivities`, `mockAffiliateData`): en `AccommodationHotelModal`, en `DestinationDetailModal` y donde salgan. Dime en el informe dónde estaban y qué enseñaban.
- Para qué sirve (decidido por Eric): el alojamiento que añade el viajero es solo informativo. Es para que tenga todo lo del viaje en un sitio, con la conciencia tranquila, y para el presupuesto del viaje más adelante. No cambia la ruta ni el mapa. Lo que decide por dónde empieza y acaba cada día, y el «cómo llegar» a la zona, es la zona (de pago), como ahora.
- La hoja nueva «Tu alojamiento» (en el enlace «¿Ya tienes alojamiento? Añádelo» y al tocar «Cambiar»):
  - solo dos campos: el nombre (texto libre, por ejemplo «Hotel Artemide») y el precio (opcional, el total de la estancia en euros, «420 €»). Nada de dirección, ni buscador, ni mapa;
  - las noches no se piden: son las del viaje;
  - el precio se guarda como número, para poder sumarlo en el presupuesto cuando lo hagamos;
  - [Guardar]. Con alojamiento ya puesto, también [Eliminar], como todo lo reservado.
- Puesto el alojamiento:
  - en RESERVAS, el bloque cerrado dice «✓ Hotel Artemide» (en la de pago, con la zona si la tiene: «✓ Hotel Artemide · Monti»); abierto: el nombre, «{n} noches», el precio si lo puso, «Cambiar» y «Eliminar»;
  - en el día 1, la fila del alojamiento con el ✓ verde, el nombre y «{n} noches · 420 €» (o solo «{n} noches», si no puso precio);
  - no cambia nada más: ni la zona, ni la ruta, ni el mapa.
- El bloque de alojamiento de RESERVAS, abierto y sin nada puesto, queda así, de arriba abajo:
  - «¿Ya tienes alojamiento?» y el botón [Añadir mi alojamiento], que abre la hoja «Tu alojamiento»;
  - «¿Aún no?» y el botón principal [Buscar alojamiento], que abre la pantalla completa del mapa (punto 4);
  - solo en la de pago, debajo: «¿En qué zona te alojas?», con el campo de la zona y su rueda, como ahora. Sale siempre, tenga o no alojamiento puesto, porque la zona es la que usa la ruta. Con «Aún no lo sé», sigue contando como «Falta».
- En el «x de 3» de la de pago, el alojamiento cuenta como hecho con una zona elegida que no sea «Aún no lo sé», como ahora, porque es lo que usa la ruta. Con el hotel puesto y sin zona, el bloque cerrado dice «✓ Hotel Artemide · Falta la zona».
- Añadir tu alojamiento es gratis: va en las dos versiones. La zona sigue siendo solo de pago.
- Se guarda con el viaje. Una estancia por destino. Si el viaje tiene varios destinos, una por destino, en el primer día de cada uno, como ahora.
- El nombre y el precio se quedan en el viaje del viajero y no se mandan a ninguna web de fuera.
- En la prueba a mano: añadir, cambiar y eliminar un alojamiento desde RESERVAS y desde el día 1, en la gratis y en la de pago. En la de pago, con y sin zona.

8. «VIAJEROS LO RECOMIENDAN»: DE VERDAD PARA LA GENTE, INVENTADO SOLO PARA PROBAR
- Junto al corazón, en la lista de EXPLORAR y en la ficha del lugar, el número de «me gusta» con su texto: en la ficha, «1.240 viajeros lo recomiendan»; en la lista, como ahora, el número junto al corazón («♥ 1.240»).
- En la app de verdad, solo los «me gusta» reales (`place_likes`), y el número solo sale desde 20. Por debajo de 20, no sale número (el corazón sí).
- Modo de pruebas, con `?prueba=1` en el enlace (como `?version=gratis`): números inventados para ver cómo queda, por nivel del lugar:
  - imprescindibles y nivel 1: entre 800 y 2.500;
  - nivel 2: entre 80 y 600;
  - nivel 3: ninguno.
  Fijos por lugar (sale siempre el mismo número para cada sitio, sacado de su nombre), no al azar en cada carga.
- Los números de prueba nunca se guardan en `place_likes` ni en ningún sitio, no se suman a los de verdad y nunca salen sin `?prueba=1`. En producción (Vercel), `?prueba=1` no hace nada: solo funciona en local y en las vistas previas.
- A INVARIANTES: la app nunca enseña a la gente un número de recomendaciones, reseñas o «me gusta» que no sea real.
- Prueba: sin `?prueba=1`, 0 números inventados en EXPLORAR y en las fichas; con `?prueba=1` en producción, tampoco.

9. PRUEBAS
- Las de siempre a 0 fallos (con la 6r, 6s, 6t, 6u, 6v, 6w, 6x y la de franjas).
- Al acabar, borra los viajes de prueba que hayas creado (también los dos «Roma 13–17 oct» de la 6x).
- A mano, a 375 px, gratis y de pago:
  - la lista de EXPLORAR, solo con el nombre, y «✓ En ruta» más pequeño;
  - el filtro «Entradas», con el Free Tour arriba;
  - RESERVAS al abrir, con el alojamiento cerrado;
  - la pantalla completa del alojamiento desde RESERVAS, desde «Hoteles» de EXPLORAR y desde el día 1;
  - DÍAS sin el recuadro lila;
  - EXPLORAR y una ficha con `?prueba=1` (con los números) y sin él (solo los reales).
  Capturas en el informe.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
