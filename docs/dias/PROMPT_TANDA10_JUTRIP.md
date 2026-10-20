Hola. TANDA 10: JUTRIP. EL NOMBRE, EL LOGO, LA APP EN MÁRMOL Y ORO, LA PRIMERA PANTALLA NUEVA Y DOS EMBLEMAS NUEVOS. La app ya tiene nombre: **JUTRIP**, con el logo **P4** (marfil y oro). No toques el motor de rutas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10_JUTRIP.md e inclúyelo en tu commit.
- **Design, nuevo:** Eric ha dejado en la carpeta del proyecto el zip de Design «Trazo_App__diseño_de_rutas_personalizadas__5_.zip». Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/`) e inclúyelo en tu commit. Lo que usa esta tanda:
  - `Marca JUTRIP.dc.html` (página nueva) → **01 · Colores**, **02 · Pantallas** y **03 · La barra**, con sus piezas nuevas `Piezas/Logo JUTRIP` y `Piezas/Barra JUTRIP`. **Es un prototipo de colores:** de sus pantallas, toma solo los colores, no los textos, los datos ni lo que cada pantalla tiene o deja de tener (por ejemplo «Entrar con el móvil» o las horas del Panteón);
  - `Logos JUTRIP.dc.html` → **P4** (pestaña Premium);
  - `Piezas/Primera Pantalla.dc.html` (se ve en **App Crear el viaje → 09 · Primera pantalla: nuestros destinos en el mapa**, con sus estados A a G);
  - `Logros Momentos.dc.html` → **01**, las películas **E12** (Plaza de España) y **E13** (Castillo de Sant'Angelo);
  - `Logros Modelos.dc.html` → **03 · Los 14 emblemas**, y las piezas `Emblema Secreto`, `Emblemas Coleccion`, `Emblemas Cine` y `Emblema Cine`.
- En App Crear el viaje, los apartados **06, 07 y 08** (azul noche y los logos JUPI) son versiones antiguas: no los uses.

## 1. El nombre y el logo
- `data/marca.json`: el nombre, **JUTRIP**. Los colores de tema, de fondo y de apertura, los de P4 (crema `#F6EFE0`, oro). Quita de la nota lo de «pendiente de la búsqueda de marcas».
- **El logo P4**, dibujado con código como en `Piezas/Logo JUTRIP` (con su versión clara y su versión oscura): la estrella con su anillo y la ruta de puntos, en oro con relieve, y debajo JUTRIP en Bodoni Moda 500, con la R y la P más finas (400). Que la tenga `marca.json` en `logo`, para que salga en los huecos que ya están preparados: la pantalla de entrar, la de apertura y los avisos.
- **El lema**, debajo del logo en la pantalla de apertura (como «TU APP DE VIAJES» en Marca JUTRIP 02 · 01, en mayúsculas pequeñas y separadas): **«De viajeros, para viajeros»**. Que salga de `marca.json` (`lema`) y sea también la descripción del manifiesto.
- **La pantalla de apertura** (Marca JUTRIP 02 · **01**, con el logo grande, el lema y la ruta de puntos): es lo primero que sale al abrir la app, **unos 2 segundos**, y luego la app. Un toque la salta. Solo al abrir la app, no en cada recarga de dentro (por ejemplo, la de después de entrar en la cuenta).
- **La pantalla de entrar** (Marca JUTRIP 02 · **02**), con un cambio: arriba solo la palabra **JUTRIP**, más pequeña y sin el recuadro de fondo ni la estrella.
- **El logo pequeño** (la estrella y JUTRIP en una línea), arriba en el formulario, como en la Primera Pantalla.
- **Los iconos de la app**, del icono de P4 (la estrella sobre marfil): `icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon` y el icono de la pestaña del navegador. El de «maskable», con su margen para que no se corte.
- **El nombre, en todo lo que ve el viajero:** cualquier «Routy» o «Trazo» que se vea en la app, en los avisos del móvil, en lo que se comparte, en el nombre del pase que sale al pagar y en las páginas de privacidad y condiciones, pasa a JUTRIP. El código de campaña por defecto de los enlaces de alojamiento (hoy «Routy»), también.
- **Lo de dentro no se toca:** las claves guardadas en el navegador (`trazo:…`), los nombres de archivos, de carpetas y de tablas se quedan como están. Si cambiaran, la gente perdería su sesión y sus viajes.
- Bodoni Moda, solo con los pesos que se usan, cargada como las otras fuentes de la app.

## 2. El formulario, en mármol, y la primera pantalla nueva
**La primera pantalla, como `Piezas/Primera Pantalla` (estados A a G):**
- El mapa del mundo con los pines de **nuestros destinos**: **solo los que están curados de verdad** (con días escritos y pase), sacados de los datos y no de una lista fija. Hoy es solo Roma. Cuando haya otro, saldrá solo. Los nombres de la lista de Design son de muestra.
- La silueta de la tierra, la que ya está **dentro de la app** (`tierra110.json`): nada se pide a internet para dibujar el mapa.
- Arrastrar y hacer zoom, como en Design. Al elegir el destino, el mapa va hacia él.
- **ORIGEN:** cualquier ciudad, con el buscador de siempre.
- **DESTINO:** solo los nuestros (los pines, o escribiendo). Si escribe uno que no tenemos (estado C): «Aún no tenemos Tokio. ¿Te avisamos cuando llegue?», con el email y [Avísame], y después «¡Hecho! Te escribimos en cuanto llegue Tokio.»
  - El aviso se guarda en Supabase, en una tabla nueva (con su migración, con el siguiente número libre): destino escrito, email, idioma y fecha. Uno por email y destino. Si tiene cuenta, el email ya viene puesto.
  - Si la migración aún no está aplicada, la app no se rompe: sale «No hemos podido guardarlo. Inténtalo más tarde.»
  - Añade una línea en la página de privacidad: para qué guardamos ese email y que solo lo usamos para avisarle de ese destino.
  - En el panel de administrador, una lista sencilla: qué destinos pide la gente y cuántas veces.
- Con origen y destino, la curva y el avión que va de uno a otro (estados E y F) y [Trazar ruta].

**Los otros pasos del formulario (2 a 7), con los mismos colores que la primera pantalla:** crema `#F6EFE0`, tarjetas `#FFFDF8`, tinta `#1C2230` y oro. Misma estructura que hoy: solo cambian los colores y el logo de arriba.

**El oro y la lectura:** el oro claro (`#B58A2E`) sobre crema se lee mal (un contraste de 2,8). Úsalo solo en lo que no es texto pequeño: líneas, pines, la barra de pasos, los puntos. Para los textos y los botones con texto, el oro oscuro (`#8E6820`, o `#6E5018` si hace falta), con un contraste de al menos 4,5 en el texto normal y de 3 en los títulos grandes. Si algo de Design no llega, oscurécelo lo justo y dímelo.

**Si con un solo destino curado algo del formulario deja de tener sentido** (por ejemplo «Varias ciudades» o la ruta panorámica), no lo quites: dime qué es en el informe y lo decide Eric.

## 3. Los dos emblemas nuevos (Roma pasa a 14 secretos)
- En `data/logros/roma.json → emblemas`, los dos nuevos, con los textos de **Logros Modelos → 03 · Los 14 emblemas**:
  - **Plaza de España** (sitio `plaza_de_espana`): «Escalón a escalón» · «Los 135 escalones que suben a la Trinità dei Monti.»
  - **Castillo de Sant'Angelo** (sitio `castillo_de_santangelo`): «Tumba de emperador» · «Tumba de emperador, fortaleza de papas.»
- Sus dibujos, como en Design (`esc` y `cas`), en la colección, en la vitrina y donde salen los otros.
- **Sus películas, E12 y E13** de Logros Momentos 01, como las otras de `escenas/cine.tsx`: con su texto, su «Toca para saltar», su [Repetir animación] y cargadas solo al abrirlas.
- Que el total («Roma esconde 14 secretos») salga de los datos.
- Se ganan como los demás: con la ubicación (el radio de cada sitio, el que ya tiene en `sitios`) o con la foto.
- Si ves que algún otro texto de emblema de Design no coincide con `roma.json` (por ejemplo, el del Foro), no lo cambies: ponlo en el informe.

## 4. La app por dentro, en mármol y oro (Marca JUTRIP)
- **Los colores, los de Marca JUTRIP → 01**, en los colores de la app (`src/index.css`), no pantalla a pantalla:
  - crema `#F6EFE0` (el fondo), marfil `#FBF3E2` (hojas desde abajo y apertura), tarjeta `#FFFDF8`, tinta `#1C2230`;
  - oro claro `#B58A2E` (solo líneas, pines, iconos grandes, rutas de puntos y brillos), oro oscuro `#8E6820` (texto en oro y botones principales con texto blanco), oro profundo `#6E5018` (texto pequeño sobre marfil y botón pulsado), oro pálido `#E9C77A` (el oro en modo noche).
- **El frambuesa deja de ser el color de la marca:** botones, pestañas y marcas pasan al oro y la tinta. Se queda solo para dos cosas: lo que falta («Falta», el punto de los avisos) y resaltar (el corazón de «lo recomiendan» y las piezas de la colección principal).
- **Lo que no cambia de color:**
  - el verde de «Visto», el rojo de los avisos importantes y el lila de los barrios;
  - los colores de cada día de la ruta (azul, naranja, verde…);
  - **las etiquetas de tipo de las paradas** (Ruinas, Parque, Monumento…), también en los días cerrados: se quedan con sus colores de ahora;
  - los colores propios de los logros (las medallas, los sellos, los emblemas y sus películas).
- **La barra de abajo:** la **A** de Marca JUTRIP 03 (tinta con la pestaña elegida en marfil). En modo noche, la **C**.
- **Las pantallas de 02** (DÍAS, EXPLORAR, RESERVAS, Logros, el Pase y la ficha de una parada) son la referencia para comprobar que queda igual de colores. **Para HOY, la referencia es la 09** («HOY en modo claro»: la tarjeta clara con la foto, [Visto] en verde, [Cambiar planes] y [Cómo llegar] en oro), **no la 03**. De la 09 solo vale HOY: la barra de abajo es la A, como en el resto.
- **Modo noche:** el oro pálido en lugar del oro, sin tocar lo demás del modo noche.
- Si algún sitio usa el frambuesa a mano, sin pasar por los colores de `index.css`, cámbialo también, y pon la lista en el informe.

## 4b. Lo que NO va en esta tanda
- La 9B: va después.

## 5. La prueba
- No toca el motor: la batería rápida.
- Pruebas nuevas:
  - en lo que ve el viajero no queda ningún «Routy» ni «Trazo», y el manifiesto dice JUTRIP con sus iconos;
  - en el mapa solo salen los destinos curados (hoy, Roma), y con un destino de prueba curado de mentira sale también;
  - el mapa no pide nada a internet;
  - [Avísame] guarda una vez por email y destino, y sin la tabla no se rompe;
  - los 14 emblemas: los dos nuevos se ganan, salen en la colección y su película se abre;
  - los contrastes del oro, medidos;
  - el frambuesa solo queda en «Falta», el punto de los avisos, el corazón de «lo recomiendan» y las piezas de la colección principal;
  - las etiquetas de tipo de las paradas y los colores de los días, sin cambiar.
- El peso al abrir la app, antes y después (que no pase de lo que pesaba ahora, menos de 340 KB, salvo lo justo para el logo).
- **Capturas** en `docs/dias/capturas_jutrip/`, en tamaño móvil: la primera pantalla en sus estados A a G, un paso del formulario de cada tipo, la pantalla de entrar, la de apertura, el icono, las películas E12 y E13 (un fotograma del principio y uno del final), y por dentro, de día y de noche: HOY, DÍAS con un día abierto y otro cerrado, EXPLORAR, RESERVAS, Logros, el Pase y la ficha de una parada.

## 6. El informe (docs/dias/INFORME_TANDA10_JUTRIP.md)
En español sencillo:
- qué has cambiado y dónde;
- la migración nueva: qué es y cómo la aplico en Supabase (el texto para pegar);
- lo que se ha quedado sin sentido con un solo destino;
- los textos de emblemas que no coinciden;
- los contrastes que has tenido que oscurecer;
- y qué tengo que mirar en el móvil.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
