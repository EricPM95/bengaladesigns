# V44 · Ubicación lejos del destino, tarjeta de la parada, avisos y DÍAS — lo que queda por decidir

## No hecho (y por qué)
1. **El billete nuevo con QR (§7, ULTIMO Q1 a Q4).** NO hecho. No puedo leer los dibujos de Design desde aquí (la herramienta de Design solo sirve para sincronizar el sistema de diseño) y copiarlos a ciegas habría sido inventarlos. Lo que sí está en el código para cuando haya dibujo: `CodigoPantallaCompleta`, la tarjeta de embarque guardada y la pantalla de RESERVAS. **Necesito el dibujo en un archivo o una captura** (una por estado: con tarjeta guardada, sin ella, vuelta, con candado).
2. **Los sitios nuevos de Roma (§6).** NO añadidos a `roma.json`. Lo que he podido comprobar (búsqueda, 24-nov):
   - **Bar La Licata** (desayuno, Via dei Serpenti 165, 00184 Roma): dirección y horario **de su propia web (barlalicata.it)**: lunes a sábado 6:00–21:30, domingo 7:00–21:00. Es el único con horario de fuente propia.
   - **Oppio Caffè** (Via delle Terme di Tito 72, 00184 Roma; vistas al Coliseo): la dirección sale en italia.it y en su web; **el horario solo lo da italia.it** (con datos de Google): lunes a sábado 7:00–2:00, domingo 7:00–3:00. Su web no publica horario.
   - **Ciuri Ciuri** (Via Leonina 18, Monti): dirección en dos fuentes; su web no cargó y los horarios que hay en agregadores se contradicen (8:30–0:00 / 7:00–23:30).
   - **Gelateria dell'Angeletto**: «via dell'Angeletto 15», Monti, según Airbnb/Lonely Planet; **ningún horario fiable**.
   - **El de Piazza Venezia: «dime cuál»** — propongo dos de los datos que ya tenemos en la zona, o que lo elijas tú; no he elegido uno para no meter un sitio sin que lo apruebes.
   - **Faltan, para los cinco: las coordenadas** (no las he podido comprobar sin una búsqueda de mapa y un pin mal puesto es peor que no tenerlo). Dime si me das tú las direcciones comprobadas o si quieres que busque coordenadas con la API de Mapbox y las miramos juntos.
3. **El alojamiento en el mapa (§8, M1 a M3).** NO hecho el mapa; hecha la alternativa que pedías. **Comprobado en las condiciones de Mapbox** ([Geocoding API](https://docs.mapbox.com/api/search/geocoding/), «temporary vs permanent»): los resultados de búsqueda son **temporales** y NO se pueden guardar; guardarlos exige `permanent=true`, que requiere tarjeta o contrato (otra página de ayuda de Mapbox dice lo contrario, así que no me fío). Por eso **solo he añadido la ciudad del viaje al enlace de «Cómo llegar»** (`enlaceComoLlegarAlojamiento(direccion, ciudad)`): ya no puede caer en Mataró. **Decisión tuya:** (a) nos quedamos así; o (b) activamos `permanent=true` y se guarda el pin (cuesta; hay que ver el precio con tus números).
4. **«Activa tu ubicación»** ya no lleva pasos (hecho), pero **la comprobación de que se abre bien en un iPhone real** la hace Eric.

## Decisiones que he tomado yo
- **Zona de ubicación:** «en la ruta» = a 30 min andando (2,4 km) de la siguiente parada (en coche, 25 km); «fuera del destino» = a más de 50 km de TODAS las paradas del viaje. Entre las dos, «en el destino pero lejos de la ruta» (el aeropuerto).
- **La caja de minutos fuera de la ruta** cuenta con el plan: de la parada de antes a la de ahora; para la primera del día, «Del alojamiento al Coliseo» **solo con minutos si se conoce la zona del alojamiento**; si no, sale «—» con el «Del alojamiento al…».
- **Los km** del trayecto en coche («22 min · 17 km») ya no salen en la caja nueva (el dibujo solo lleva minutos y «de dónde a dónde»).
- **«Comer cerca de ti»** cuenta desde la parada de ahora (no desde la última vista) cuando no hay ubicación en la ruta. Con ubicación pero lejos: «Contamos desde tu parada de ahora» (sin nombrarla).
- **Los más cercanos cuando nada ha abierto:** primero los que abren más tarde hoy (con su hora), luego el resto, cada grupo por cercanía; sin botón [Elegir] (solo informativos).
- **Mejor día:** quitado el tope de 7 visitas; manda el tiempo (que quepa sin quitar nada).
- **Un día en blanco más allá de los escritos** es «Día por organizar» aunque lo haya añadido el viajero («Añadir día»).
- **Tests viejos puestos al día** (la app estaba bien): `pruebaV36_cliente` (leía la dirección real de Supabase; ahora usa la de mentira del Vite de pruebas y YA NO lee `.env.local`), `pruebaFase6y_manual` (el horario «9:00–19:30» sin la palabra «Abre» también es un horario), `pruebaTanda10N10_explorar` (el botón «Añadir alojamiento» y el del Free Tour no son restaurantes) y `pruebaTanda10N_propuesta` (sin pase «Mover a» pone la parada de primera, por la 10N8; y la pantalla de «enviada» carga bajo demanda).
