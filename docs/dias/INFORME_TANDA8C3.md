# Informe: Tanda 8C3, los arreglos tras las capturas de la 8C2

18-oct-2026. Todo sigue detrás de los mismos interruptores. **El motor de rutas no se ha tocado** (ni `server/engine`, ni `shared/routeEngine`, ni `shared/archivo`). No hay migraciones nuevas. Se incluye, tal cual, `PROMPT_TANDA8C3.md`.

## Qué he cambiado

### 1. Las capturas, sobre la pantalla de verdad
- La hoja de logros (2a, 3a, 3b, 3c, 3d, 3e, 4a) ya sale sobre **DÍAS**, con el viaje de pruebas abierto. Antes salía sobre «Crear el viaje».
- El «+EXP» (E1, E2 y E1-quieto) sale sobre **HOY**, y se ve que no tapa [✓ Visto] ni la barra de abajo.
- Al sacar E1/E2 sobre HOY se vio que el «+EXP» **sí tapaba [✓ Visto]**. Arreglo en la app: el «+EXP» flota ahora justo encima del botón [✓ Visto] (marcado con `data-boton-visto` en los dos HOY), sin tapar ni ese botón ni la barra de abajo. Sin ese botón en pantalla, queda donde estaba.
- Las capturas de la hoja y las demás esperan a que los dibujos de las colecciones hayan cargado antes de fotografiar.

### 2. Fallos que se veían en las capturas
- **3c, colecciones sin dibujo.** El dibujo de cada colección se baja al pintarse y la captura se hizo antes. Ahora, mientras carga, cada colección sale con su **hueco en gris** (no queda un vacío), y la captura espera a que no quede ninguno.
- **Perfil en el rango 7 (Cartógrafo).** Ver «Por qué salía el Perfil de antes» más abajo.
- **El exclusivo de la ciudad y el año.** El dibujo (`ExclusivoHolo`) tenía **«ROMA» y «2027» escritos dentro**; el texto sí usaba el año real. Ahora el dibujo recibe la ciudad y el año del propio logro («Roma 2026») y los dos dicen lo mismo, en cualquier año.
- **Pasaporte del Vaticano (P2v).** El sello llevaba el Coliseo porque estaba puesto a propósito (`MON.vaticano = MON.roma`). Ahora lleva su **cúpula de San Pedro** (con su linterna y su cruz), dibujada en el mismo trazo que los demás.
- **HOY (1a-hoy): el mapa grande.** Ver «Lo del mapa grande de HOY» más abajo.
- **Los secretos.** En la página de cada destino (G1, G2, T3) y en Todos mis logros (T1) ya no pone «N de 12 secretos» ni «N secretos encontrados»: pone **«Roma aún esconde N secretos.»**, como en el resto, y antes del viaje **«Roma esconde 12 secretos»**. También he quitado el «3 de 12» suelto que había junto al título «Emblemas secretos». Para esto el servidor manda ahora el total de secretos de cada destino en Todos mis logros.

### 3. Un solo viajero de prueba en todo el modo de pruebas
El viajero de ejemplo es el del **viaje a Roma acabado** (el de «Todos mis logros»). De ahí salen ahora los demás:
- **Perfil y pasaporte dicen lo mismo.** El Perfil ya no tiene números escritos a mano: los toma del demo del pasaporte (hoy **7 países · 11 sellos**; el pasaporte, **7 países · 5 ciudades · 41 días**). Si en «¿Dónde has estado ya?» marcas un país más, el Perfil y el pasaporte cambian juntos.
- **El Perfil toma de ese viajero** sus títulos, sus logros de la vitrina (33, los mismos que cuenta Todos mis logros) y sus tres piezas.
- **Roma es la misma en las dos pantallas:** sello de diamante, 11 de 11 colecciones, los mismos secretos y los mismos sellos (Roma y el Vaticano). Para no perder lo que enseña «A» (una colección con sitios aún por ver y [Cómo llegar]), esa captura se hace **a mitad del viaje (12 de octubre)**, y lo dice su nombre; las demás, con el viaje acabado.
- **J3: «8 sellos de recuerdo» de 11 países.** Tiene su razón: de los 11 países marcados, **3 ya tienen sello de verdad** de viajes con la app (Italia, el Vaticano y Francia), así que su sello es el de verdad y no se repite como recuerdo. 11 − 3 = 8. La prueba lo comprueba.
- **J3 ya no dice «2 continentes»** (los continentes están apagados en la Versión 1). El dato sigue en el servidor para cuando se enciendan.

### 4. Lo que había quedado distinto del diseño
- **Pines de la vitrina** en la página de cada destino: ✓ verde si está en tu vitrina, «+» dorado si está ganado y aún no; solo en lo ganado (sellos, colecciones completas y emblemas). Colores y trazos del diseño. Solo se ven (como en el diseño); se toman de la misma vitrina que Todos mis logros.
- **«Añadir a mi ruta»** abre la pantalla de añadir con el sitio **ya puesto** y pregunta a qué día va. Si el sitio no se encuentra en el catálogo, se abre como antes.
- **Mis viajes:** tarjetas grandes con degradado/foto como en el diseño (176 px el viaje en curso con «Día N de M», 132 px los demás), no las filas. El grupo «Antes de la app» también. Con los logros apagados queda la fila de siempre.
- Se quedan como estaban, según dijiste: la inicial en vez de la foto del perfil, los sellos con monumento solo en las ciudades que dibuja Design, y Ajustes (parte 3, cuentas).

### 5. Los riesgos que dejé
- **`construirVitrina`** (vistas.js): **quitada**. Alguien la usaba (`GET /api/logros/vitrina`, que Compartir pide para el título), así que en vez de dejarla he hecho que ese servicio use la vitrina buena de «Todos mis logros» (`vitrinaDeGanados`): una balda vaciada se queda vacía y el bronce de un sello que ya es oro no entra. Nadie puede ya usar la mala por error.
- **El sello estampado al acabar el viaje.** El aviso de viaje acabado (el resumen del viaje) lleva ahora **[Estampar mi sello]**: cierra el aviso y abre el pasaporte en la página del viaje con el sello estampándose (P2e).
- **Un fallo real que salió por el camino:** el Perfil contaba cada grado de un sello y cada escalón de un logro como logros distintos (38 en el Perfil frente a 33 en Todos mis logros). Ahora cuenta una vez cada uno, como Todos mis logros.

## Por qué salía el Perfil de antes en el rango 7
No era del rango 7. En esa captura el Perfil nuevo **aún no había llegado** cuando se hizo la foto: el Perfil con logros se baja al abrirse y, mientras llega, se enseña el de siempre (la «V» sin marco, el mapa y Mis viajes). El escaparate esperaba 6 s y, si no llegaba, **fotografiaba igualmente lo que hubiera** sin avisar. Con el Vite compartido y otros editando a la vez, esa vez tardó más.
Arreglo: el escaparate espera hasta 15 s y, si el Perfil nuevo no se ha pintado, **falla** (en vez de fotografiar el de antes) y el script repite con una página nueva. Los 10 rangos se han vuelto a sacar y los 10 salen con el marco, el nivel, el título y la vitrina. La prueba comprueba que los 10 rangos contestan el Perfil nuevo completo, con su marco y su hueco.

## Lo del mapa grande de HOY
No era a propósito. HOY en su versión 2 (la foto del sitio con su mapa pequeño, de la 8B) va detrás de su interruptor (`?hoy2=on` en desarrollo); en la 8C2 el escaparate no lo encendía y salía el HOY de siempre, con el mapa grande. Ahora las capturas de HOY encienden el v2. **Ojo: en producción el HOY v2 sigue apagado** (`VITE_HOY_V2`), así que lo que verá la gente sin ese interruptor es el HOY con el mapa grande.

## Las capturas nuevas
Se han rehecho **todas** (los datos del viajero han cambiado en casi todas las pantallas) en `docs/dias/capturas_8c/`. Las que cambian de pantalla de fondo: **2a, 3a, 3b, 3c, 3d, 3e, 4a** (sobre DÍAS) y **E1, E2, E1-quieto** (sobre HOY). Las de HOY (1a-hoy, E1, E2) llevan ahora la foto del sitio con su mapa pequeño. Se añade **A** (a mitad de viaje) con su nombre aclarado. La prueba sigue fallando si dos capturas son idénticas.

## Pruebas
- `pruebaPantallas8c`: **1.071 comprobaciones, 0 fallos** (las 992 de antes más 79 nuevas, en `pruebas8c/z_arreglos8c3.mjs`: los 10 rangos con el Perfil nuevo, el año del exclusivo, el sello del Vaticano, los secretos, los datos iguales en todas las pantallas, sin continentes, los pines, «Añadir a mi ruta» con el sitio, las tarjetas de Mis viajes, la vitrina sin los dos fallos y el sello estampado) y que no haya dos capturas iguales.
- Las de siempre, en 0: `pruebaPantallas8b` (171), `pruebaLogros1` (433), `pruebaLogros2` (54), `pruebaFase6y4_perfil` (157), `pruebaCorr6z6_perfil` (88), `pruebaFase6y4_iconos` (4.865). `tsc -p tsconfig.app.json` limpio. No toca el motor: no se ha pasado `pruebaFase6y5_motor`.
- Consola: sin errores míos en ninguna captura (solo los de siempre de Mapbox/Supabase sin claves).

## Riesgos
- Los **«7 países · 11 sellos»** del Perfil y los «5 ciudades» del pasaporte salen de definiciones distintas en el **servidor real**: el Perfil cuenta un sello por ciudad ganada + los recuerdos; el pasaporte, un sello por viaje acabado + los recuerdos. En el demo cuadran porque el Perfil lee los números del pasaporte; **con Supabase real pueden diferir** si hay una ciudad con dos viajes (el Perfil contaría 1 y el pasaporte 2). Conviene decidir cuál es la definición buena y poner la misma en los dos.
- Los logros de viajero del viajero de ejemplo («1 país visitado», «1 viaje») vienen del escenario «lleno» (un viaje a Roma) y no cuadran con un pasaporte de 7 países y 5 ciudades: el pasaporte enseña viajes con la app anteriores a los logros. Solo se nota si se miran las dos pantallas con lupa.
- «Añadir a mi ruta» busca el sitio por su nombre en el catálogo (el catálogo no trae el identificador del sitio de los logros): si un nombre cambiara entre los dos archivos, se abriría la pantalla de añadir sin el sitio puesto (como antes).
- **Reinicio del servidor:** he tocado `server/logros/servicio.js` y `ganados.js`; hay que reiniciar el api-server (hecho al terminar).
- Nada de esto está probado con Supabase real ni en un móvil real.
