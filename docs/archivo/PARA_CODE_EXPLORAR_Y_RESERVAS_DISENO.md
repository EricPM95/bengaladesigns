# Nuevo diseño de Explorar y Reservas

Junto a este mensaje te llegan desde Claude Design dos archivos:
- **«Explorar 1 y Reservas»** (`Trazo Reservas.dc.html`): la pantalla «12 · Explorar» y la «13 · Reservas»;
- **«Explorar 2»** (`Trazo Explorar.dc.html`): Explorar por dentro, con los filtros, el mapa y la lista.

Commit por parte y sin push.

**Son prototipos visuales.** De ellos se copia **solo cómo se ve**: colores, letras, tarjetas, iconos, botones, etiquetas y espacios. **Los datos y lo que hace cada cosa siguen exactamente como en la app hoy.** Las ciudades, lugares, números, vuelos y servicios del prototipo son de maqueta: no los copies.

- Si algo de lo nuestro no tiene sitio en el diseño, o el diseño enseña algo que no tenemos, **no lo inventes ni lo quites:** dímelo.

## Parte 1. La ventana de Explorar (pantalla «12 · Explorar»)

Es la ventana que se abre al pulsar Explorar, para elegir qué explorar.

- **Su aspecto:**
  - rejilla de 2 columnas;
  - cada tarjeta con su cuadro de icono de color, la franja diagonal con la foto o el degradado, el nombre en Instrument Serif y el contador pequeño («77 lugares», «18 con entrada»);
  - en Hoteles, el enlace «Buscar hotel ↗»;
  - las pestañas Hoy · Ruta · Días · Explorar, con la raya debajo de la elegida.
- **Lo que hay dentro es lo de hoy:** Atracciones, Miradores, Restaurantes, Entradas, Excursiones y Hoteles, con nuestros contadores y lo que abre cada una.
- **Lo nuevo: una tarjeta de Baños.** Estaba pendiente.
  - Datos: los baños públicos de OpenStreetMap (`amenity=toilets`), descargados una vez para Roma y guardados en el proyecto. Que se vea si son de pago y si son accesibles.
  - Dentro de la ficha o la lista va «© OpenStreetMap».
  - Si no puedes descargarlos, deja la tarjeta preparada y dímelo.
- **La barra flotante de abajo** (los iconos con el botón naranja en medio) **no se toca:** va con el rediseño de la pantalla principal.

## Parte 2. Explorar por dentro («Explorar 2»)

- **Su aspecto:**
  - **arriba:** la cruz en círculo, «Explorar **Roma**» con el nombre del destino en cursiva de color, y debajo la categoría en letra pequeña;
  - **los filtros:** píldoras con icono y número, y la elegida en oscuro;
  - **sobre el mapa:** la píldora «En tu ruta · {n}» y el botón de localizarte;
  - **la hoja de abajo:**
    - el buscador. **Un cambio sobre el diseño:** dale un poco de margen por arriba, para que no quede pegado al mapa;
    - el selector «Recomendados / Cerca de ti»;
    - las tarjetas de cada lugar: foto en diagonal con el icono de su tipo, el nombre en Instrument Serif, el corazón con su número, la etiqueta «En tu ruta», la zona · la duración · el icono de entrada, y el botón oscuro «✓ En ruta».
- **Todo lo demás sigue como hoy:**
  - los filtros que tenemos;
  - nuestros lugares, con **nuestras fotos**;
  - el buscador, con sus nombres alternativos;
  - lo de «en ruta / no en ruta»;
  - lo que pasa al añadir un lugar a un día.

## Parte 3. Reservas (pantalla «13 · Reservas»)

- **La pantalla queda igual que el diseño.** Encima de todo, lo que se ve aquí debajo.
- **Su aspecto:**
  - **arriba:** la cruz en círculo y el % de la cabecera en su píldora;
  - **el aviso de arriba:** la tarjeta color melocotón con su icono;
  - **los vuelos:** las dos tarjetas tipo billete (código grande de cada aeropuerto con la ciudad debajo, el arco con el avión y la duración, el corte de billete con los semicírculos, y el campo de la hora con el reloj);
  - **la tarjeta oscura «Tu primer y último día»,** con la barra de horas de cada día;
  - **las secciones:** título en mayúsculas pequeñas, y cada fila con su bloque de color en diagonal y su icono, la categoría pequeña, el nombre en Instrument Serif, y a la derecha «Añadir» y el botón en píldora («Reservar»).
- **Lo que hay dentro es lo de hoy,** en el mismo orden y con los mismos textos:
  - vuelos;
  - alojamiento;
  - las Entradas con las imprescindibles del destino y «Ver más entradas de tu ruta»;
  - la excursión;
  - el %;
  - la ventana «Añade tu reserva»;
  - todo lo demás que tenga hoy.
  - Si un texto nuestro no cabe en el hueco del diseño, se queda nuestro texto y se ajusta el hueco.
- **No va:** el seguro de viaje y la tarjeta de pago del prototipo. No los tenemos, y en lo que lee el viajero no se nombran empresas.

### La tarjeta «Tu primer y último día» (nueva, la azul marino del diseño)

Le enseña al viajero cuánto tiempo tiene para aprovechar el día 1 y el último día.

- **Sin vuelo:** la barra rayada y el texto «Añade tu hora de llegada» o «Añade tu hora de salida», como en el diseño.
- **Con vuelo:** en la barra de horas (de 08h a 24h) se ve **rayado** el tiempo que no está libre y **claro** el que sí, con la hora en que empieza o acaba:
  - **día 1:** libre desde la hora de aterrizaje más el traslado al centro;
  - **último día:** libre hasta la hora de despegue menos lo que hay que salir antes.
  - Usa los tiempos que ya usa la app con los vuelos y los de `_llegada.json` (`al_centro_min`, `salir_antes_min`). No inventes otros: los repasaremos en el encargo de los vuelos.
- Lo mismo con tren, autobús o barco, con sus tiempos de `_llegada.json`.
- La fecha de cada día sale del viaje.

## Parte 4. Al poner un vuelo: «¿Ajustamos tu ruta?»

Cuando el viajero pone la hora de llegada o de salida, sale **desde abajo una ventana con dos opciones**. Es el mismo estilo que la de «+ Añadir día» (Añadir lugares / Añadir una excursión).

- **Título:** «¿Ajustamos tu ruta a tu vuelo?»
- **Opción 1 — «Sí, ajústala por mí»:** «Movemos tu primer y tu último día a tus horas.»
- **Opción 2 — «No, lo hago yo»:** «Tu ruta se queda como está. Arriba ves el tiempo que tienes cada día.»

**Lo que pasa con cada opción:**
- Con la 1, haz con la ruta **lo que la app ya hace hoy** al poner un vuelo. No cambies esa lógica: el motor nuevo de vuelos llega en otro encargo.
- Con la 2, la ruta no se toca. Solo se ve la tarjeta «Tu primer y último día».
- Lo que el viajero elija se guarda. Si vuelve a cambiar la hora del vuelo, la ventana sale otra vez.

**Dime cómo funciona hoy:** qué hace la app ahora mismo cuando se pone un vuelo, para saber qué hay detrás de la opción 1.

## Informe

1. Capturas en el móvil de las tres pantallas, con un viaje a Roma: Explorar, Explorar por dentro con Atracciones y Reservas entera.
   - En Reservas, también la tarjeta «Tu primer y último día» sin vuelo y con un vuelo que aterriza a las 10:00 y otro que despega a las 18:00, y la ventana de la parte 4.
2. La tarjeta de Baños: cuántos baños salen en Roma y una captura.
3. Lo que no hayas podido tomar del diseño, o que choque con lo que tenemos, y por qué.

Explícalo en español sencillo, sin jerga.
