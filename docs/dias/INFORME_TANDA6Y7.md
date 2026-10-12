# Informe de la Tanda 6y7

Hecha en cuatro partes en paralelo (motor, datos y textos, pantallas, títulos de los días), cada una con su informe: `INFORME_PARTE_MOTOR_TANDA6Y7.md`, `INFORME_PARTE_DATOS_TANDA6Y7.md`, `INFORME_PARTE_PANTALLAS_TANDA6Y7.md` e `INFORME_PARTE_TITULOS_TANDA6Y7.md`. Los puntos 1 a 9 no tocan el motor; solo el 10 lo toca.

## 1. El calendario, arriba
El calendario va pegado bajo el título «¿Cuándo estás en Roma?» y «Quitar fechas» (o «Cerrar») justo debajo. Es una sola pieza: todos los sitios que lo abren (cabecera, HOY, RESERVAS, campana, «Añade un día más») piden el mismo modal. El formulario conserva su diseño y su «Continuar». Capturas: `6y7-calendario-arriba.jpg`.

## 2. Fuera la pantalla vieja «Creando tu ruta»
Al cambiar las fechas (los dos caminos, el directo y el «Sí, ajústala») ya no cambia a la pantalla de carga: el viajero se queda donde estaba y ve una barrita fina de 3 px arriba y una pastilla «Actualizando tu ruta…» sin tapar nada; se rehace en segundo plano conservando reservas, deseos, días libres y días añadidos. Si falla, «Reintentar» o «Dejarla como estaba».
**Dónde salía:** al cambiar las fechas dentro de la app (los dos caminos), al abrir un enlace compartido y al retomar una generación a medias al abrir la app. **Dónde no salía:** crear desde el formulario, reabrir un viaje guardado, acortar o alargar días, «Ajustar mi ruta a mi vuelo», el resto de rehacer días y la ruta a mano.
**Qué la sustituye (Eric lo pidió para el enlace compartido y para retomar una generación):** el fondo de la app, un texto pequeño «Preparando tu viaje…» y una barrita fina (`PreparandoViaje.tsx`), sin ninguno de los textos viejos; si falla, el mensaje y «Reintentar». La pantalla vieja (`LoadingScreen.tsx`, con el avión y sus pasos) se ha borrado del todo. Capturas: `6y7-cambiar-fechas-sin-pantalla-vieja.jpg`, `6y7-tras-cambiar-fechas.jpg` y `6y7-preparando-tu-viaje.jpg` (un enlace compartido con la generación retenida unos segundos).

## 3. La ficha, sin hueco bajo el tirador
El tirador subía 28 px sobre el mapa con su propio fondo de 20 px y el mapa se veía 8 px por debajo. Ahora el panel es una sola pieza con el fondo hasta arriba y el tirador dentro. Capturas a media altura y entera.

## 4. «Escuchar historia», sin «Voz del móvil»
La barra solo dice «Escuchar historia», el botón y la barra de lo que lleva («Leyendo…» o «En pausa» mientras suena). El texto ya no está en ningún sitio de `src`.

## 5. El mapa del Perfil
Medido antes de arreglarlo: ocupaba 341×12 px (Mapbox le pone `position: relative` al contenedor y anulaba el `absolute inset-0`). Ahora el recuadro que se estira rodea a un contenedor `h-full w-full` y hay `resize()` al montar, al cargar, con `ResizeObserver` y al girar el móvil. Mide 341×284 (el recuadro, 286 con borde) al abrir, al reabrir dos veces seguidas, en horizontal y al volver a vertical.

## 6. Los títulos de los días
Una sola función (`src/lib/tituloDelDia.ts`). Cada sitio lleva su grupo en `grupo_dia` de `roma.json` (95 sitios, 10 nocturnas, 11 paseos por barrio y 9 paseos libres; lo escribe un script repetible que solo añade líneas). Reglas: el nombre propio del viajero manda; la excursión de día entero es «Excursión desde Roma»; como mucho dos nombres con «y», con el Free Tour (o la excursión de medio día) primero y luego el grupo con más paradas (el segundo solo entra con al menos 2 paradas, o si el día entero tiene solo 2; empate: gana el que aparece antes); un día sin paradas, «Día libre». El día de llegada y el de vuelta tienen su título y el trayecto («Madrid → Roma») va pequeño tras «Día de viaje», bajando a la línea de debajo a 375 px sin partirse. Sale igual en DÍAS, HOY (que antes no decía el nombre del día), las hojas de elegir día y el PDF; no se guarda, se calcula al pintar. La **tabla completa parada → grupo** está en `INFORME_PARTE_TITULOS_TANDA6Y7.md` para que la revises. Títulos reales vistos: «Centro histórico y Roma antigua» (llegada), «Vaticano y Trastevere», «Centro histórico y Villa Borghese» (vuelta). Capturas `6y7-titulos-*.jpg`.

## 7. Las historias, versión 4
Las 31 historias v4 están en sus fichas (todas encontraron su ficha; solo el texto, sin título ni «Comprobar»). Regla nueva: ninguna comparte 15 palabras seguidas con su ficha; el tramo igual más largo es de 12 (en el Panteón, la frase tuya «Todavía hoy es la mayor cúpula de hormigón sin armar del mundo», que está en un secreto). La guía lleva tu frase nueva.

## 8. Los superlativos de las fichas
13 frases suavizadas (Trevi: «Una de las fuentes más famosas del mundo»; Plaza de España: «Una de las escalinatas más famosas de Italia»; Museos Vaticanos, Plaza de San Pedro, San Ignacio, Gesù, Domus Aurea, Santa Maria della Vittoria, Catacumbas de San Calixto, Galería Nacional de Arte Moderno, Grutas de San Pedro y Santa María la Mayor con «según la tradición»). La lista antes → después está en `INFORME_PARTE_DATOS_TANDA6Y7.md`. Se dejaron los datos seguros (la cúpula del Panteón, el Coliseo «más grande jamás construido», el museo público más antiguo del mundo, el obelisco de San Juan de Letrán). No se tocaron tus textos de los días (pregunta 16).

## 9. Los datos dudosos de las fichas
19 datos corregidos con fuente (casi todas páginas de Wikipedia en inglés; también el archivo de Radio Vaticana de 2011, el Smithsonian y AP, basilicasanclemente.com y la Italian Art Society); cada fuente va junto a su dato en el informe de datos. Los 12 que no se pudieron confirmar no se tocaron y están en `PREGUNTAS_TANDA6Y7_PARTE_DATOS.md`.

## 10. Respuestas a la 6y6 (esto toca el motor)
- **El Vaticano en miércoles:** el día entero se cambia con otro día del viaje siempre que se pueda; el motor ya lo hacía y se comprobó que no se ha roto: en 4.079 viajes (de 1 a 7 días, todo el año, sin reserva y con el Coliseo reservado en cada día) el día del Vaticano cae en miércoles 36 veces, las 36 sin otra posición posible. La preferencia sigue en el documento y en el motor.
- **El día de miércoles:** la Plaza y la Basílica nunca van antes de comer, tampoco con los Museos reservados. Con los Museos por la mañana: Museos, comida en el Borgo, Plaza y Basílica y lo demás (si no cabe, San Pietro in Montorio y la Fontana dell'Acqua Paola a «Si te sobra tiempo»). Con los Museos a mediodía o por la tarde: mañana sin Museos (Trevi, Plaza de España, Via dei Coronari, el Puente y el Castillo), comida en el Borgo, los Museos a su hora y al salir la Plaza y la Basílica (desde las 16:00 van antes, porque al salir ya no hay entrada; Eric dijo que vale). Documento, datos y motor dicen lo mismo.
- **La línea de la última mañana** habla ahora de la versión sin Museos de los cierres (el domingo).
- **El pool con 1 día no sale:** el formulario salta el paso, la barra cuenta uno menos (5/6, 6/6 y LISTO) y el resumen no lleva «Lugares». Con 2 días hasta 3 sitios; con 3 o más, hasta 6.
- **La frase de Cáritas de Trevi:** se queda.

## Pruebas
- **Nuevas:** `pruebaFase6y7_motor` (partes 1 a 3), `pruebaFase6y7_pantallas` (73 comprobaciones), `pruebaFase6y7_titulos` (3.642 comprobaciones: 228 viajes de prueba con 798 días, 95 con Free Tour siempre «Free Tour» primero, llegada y vuelta con título y trayecto pequeño, DÍAS y HOY con el mismo título y sin horas) y `pruebaFase6y7_historias` (554: las 31 historias idénticas al documento y la regla de 15 palabras).
- **Las 365 fechas** con las cuatro partes juntas y la pantalla de espera nueva (`pruebaListas`, 8 tramos desde el 14-oct-2026, en paralelo): **0 fallos en los 8** (más de 800.000 viajes).
- **Batería de siempre:** 54 pruebas a 0 fallos (todas las `pruebaFase6*`, `Corr6*`, `Tanda6*` y `Fotos6*`, incluidas las nuevas de la 6y7: motor 17.772 comprobaciones, pantallas 77, títulos 3.642, historias 554, cierre 3.211) y tipos limpios.
- **La prueba larga del motor de la 6y5**, por partes (entera tarda más de 25 minutos): dos reservas a la vez, 8.644 comprobaciones; cierres y «Si te sobra tiempo», 13.495; aviso de la Fontana y tope, 14.589; todas a 0 fallos. `pruebaFase6y2_reorganizar` suelta: 782 comprobaciones, 0 fallos.
- **Lo que queda en «No incluido»** con el pool nuevo (540 viajes por forma): 1 día, no hay pool; 2 días (hasta 3 sitios), 142 de 1.620 (8,8 %); 3 días (hasta 6), 311 de 3.240 (9,6 %); 4 días, 2 de 3.240 (0,1 %); 5 y 6 días, ninguno.
- **Dos pruebas antiguas fuera de la batería** (`pruebaFranjas6x`, `pruebaDiasFecha6z3`) siguen fallando como antes de esta tanda: pregunta 17.
- **Además, a petición de Eric,** se ajustó la prueba de iconos (ya no hay pantalla de carga con avión), la de pantallas (comprueba que no queda ningún texto viejo de la pantalla de carga) y la medida del tope de la 6y5 (con 1 día no hay pool).
