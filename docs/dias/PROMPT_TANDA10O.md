Hola. TANDA 10O: EXPLORAR. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10O.md e inclúyelo en tu commit.
- Sale del repaso de la app que ha hecho Eric el 25-oct en su iPhone.
- **Si para algo de esta tanda hay que tocar el motor de rutas, dímelo antes**, y entonces la muestra de 60 fechas, push, y luego la de 365 (`_correr6y5.mjs procesos=12`).

## 1. EXPLORAR
### 1.1 Las dos pestañas «Recomendados» y «Cerca de ti», como antes
- Hoy, en la lista de EXPLORAR, sale una tarjeta cerrada en medio de la lista («Cerca de ti · Con el pase, ordena los sitios por lo cerca que los tienes de ti»). **Fuera esa tarjeta.**
- Vuelven las dos pestañas de antes, **debajo de «Buscar en Roma…»**, con el diseño de entonces (el interruptor de dos partes: la elegida en marfil con el texto en oro, la otra en gris): **[Recomendados] [Cerca de ti]**. Sin pase, el candado dorado pequeño junto a «Cerca de ti». «Recomendados», la lista de ahora.
- **Para todos:** con pase y sin pase, el dueño del viaje y el invitado, y en todas las listas de EXPLORAR (Lugares, Restaurantes, Entradas, Excursiones…).
- **Sin pase, al tocar «Cerca de ti»:** una hoja desde abajo (con el tirador y la ✕, como los demás avisos del pase): el título «Cerca de ti», el texto «Encuentra los mejores sitios cerca de ti, sin perder tiempo. Disponible con el Pase de Roma.» («Pase de Roma», del dato y con `<Marca>`) y [Ver el Pase de Roma] (`abrirPase()`).
- Con pase, «Cerca de ti» ordena por cercanía, como ya hace.

### 1.2 Las listas de Lugares y Miradores: qué sale, y en qué orden
- **El Free Tour:** «Free Tour por Roma» sale sin número de «lo recomiendan» (los demás sitios llevan su `megusta_inicial` en roma.json; el Coliseo, 412). Que lleve el suyo: **978**, en el mismo sitio y con la misma forma que los demás, para que salga el primero.
- **Fuera de la lista de EXPLORAR:** «Luces de Navidad del Tridente», «Lungotevere» y «Mercadillo de Navidad de Piazza Navona» (con Piazza Navona basta). **Solo de la lista:** lo que la ruta ya dice de ellos se queda (en Navidad, «Pasea y piérdete entre las luces del Tridente» en el paseo libre antes de cenar, en DÍAS y en HOY, el mercadillo dentro de la noche en Piazza Navona y su aviso del 1 de diciembre al 6 de enero, el Lungotevere en el texto del paseo hasta Trastevere). Si quitarlos de la lista cambia algo de la ruta, dímelo antes.
- **Al final de la lista, lo que casi nadie conoce:** Plaza del Quirinal, Quartiere Coppedè, Santo Bambino de Aracoeli, Via dei Coronari, Via del Babuino, Via di Ripetta, Via Margutta y Via Veneto.
- **Suben, entre los puestos 15 y 25 de la lista:** Plaza Venecia, Puente Sant'Angelo, Via dei Fori Imperiali, Via della Conciliazione, Via Appia Antica, Teatro de Marcelo y Via Condotti (hoy, sin «me gusta»). Ponles su `megusta_inicial` en ese orden, entre los de la Cúpula de San Pedro (95) y el Parque de Villa Borghese (81), sin empates (si no caben, mueve uno o dos «me gusta» los de al lado, sin cambiar su orden).
- **Miradores, fuera de la lista:** Terraza del Largo Gaetana Agnesi, Porta Pinciana, Mirador de San Pietro in Montorio, Fontana dell'Acqua Paola (ya está el Janículo) y Jardines del Pincio (ya está la Terraza del Pincio). Igual que arriba, solo de la lista: donde la ruta pasa por ellos (la Fontana dell'Acqua Paola subiendo al Janículo, los Jardines del Pincio, Porta Pinciana), se quedan como están. Si quitarlos de la lista cambia algo de la ruta, dímelo antes.
- **Miradores, nuevo: «Terraza del Altar de la Patria»**, la terraza panorámica con ascensor (ya está en los datos del Altar de la Patria: de 09:30 a 19:30, última subida a las 19:00, de pago). Que salga en Miradores con su foto (las vistas desde arriba, con licencia libre, y apunta la fuente), su texto y su horario; al tocarla, su ficha, y con [+] se añade como los demás. Ponle `megusta_inicial` para que salga entre los primeros miradores, después de la Cúpula de San Pedro. En la ruta no cambia nada: si para que salga en la lista hace falta un sitio nuevo que el motor pueda poner en las rutas, dímelo antes.
- Comprueba que las listas de EXPLORAR salen ordenadas así (los «me gusta» de mayor a menor y, sin «me gusta», los de este apartado al final), y pon en el informe la lista entera de Lugares y la de Miradores, con su puesto, para que Eric la revise.

### 1.3 Entradas, Excursiones y Hoteles
- **Entradas:** la foto del Castillo de Sant'Angelo es de dentro. Cámbiala por una **del castillo por fuera** (mejor con el puente delante), con licencia libre, como las demás. Apunta la fuente.
- **Excursiones:** la lista se ve muy fea: le faltan los datos que vienen de fuera (la foto, el precio, la duración, la valoración…). Mira por qué (si la consulta está apagada en Vercel, si falla, si la caché está vacía) y dímelo. Que la lista quede como la de Entradas: cada excursión con su foto, su nombre, la duración y el precio «desde». Si un dato no llega, la tarjeta sale bonita igual, con lo que tengamos en roma.json, nunca con huecos ni «undefined». En los textos de la app, nunca el nombre del proveedor.
- **La API de excursiones y entradas, para que Eric la vea en su móvil antes de la certificación:**
  - que se pueda encender **solo para los emails de `LOGROS_ADMIN_EMAILS`** (lo decide el servidor, como el modo prueba de la 9B), con el sandbox de verdad: Eric ve las excursiones, las entradas de cada ficha, las horas libres y la hora recomendada con datos reales, y nadie más. Para los demás, como hoy. Dime qué tiene que poner Eric en Vercel (sin enseñar ninguna clave);
  - **la caché, 4 horas como mucho** (lo que pidió el proveedor el 19-oct): hoy en `data/civitatis/ajustes.json`, el catálogo, la actividad, los traslados y «cerca» guardan 24 h, y «resolver», 7 días. Todo a 4 h como mucho; el calendario (precios y plazas), como está, 1 h;
  - **las descripciones y las valoraciones, tal como vienen**, sin resumirlas ni reescribirlas (también lo pidió el proveedor). Comprueba que es así;
  - las cinco excursiones que no se resolvieron (Pompeya y Sorrento, Nápoles y Pompeya en tren, Costa Amalfitana, Florencia en tren y Tívoli): búscalas en el catálogo (`POST /search` o en otros destinos) y dime cuáles salen.
- **Hoteles, otra vez en la pantalla de EXPLORAR:** hoy solo salen dentro, en la fila de filtros. Vuelve la tarjeta «Hoteles», con su foto, como las demás, **antes de Baños y Fuentes** (las que salen en gris). Al tocarla, se abre la pantalla de alojamientos de Roma (`useAlojamientoUi.getState().abrirMapa()`, la misma del botón de los filtros). Para todos, con pase y sin pase.

### 1.4 Añadir un sitio sin pedir la hora
- Hoy, al tocar [+] en un sitio de EXPLORAR (y en «+ Añadir parada» de un día en DÍAS), se pide el día y la hora, con 8:45 por defecto. La app ya no enseña horas: **fuera la hora**.
- Se elige solo **el día**, y la app lo coloca **donde mejor encaje** ese día: donde menos hay que andar de más entre las paradas de al lado, y mirando por dentro los horarios para que no llegue cerrado. Dime dónde lo pone hoy y si para esto hay que tocar el motor.
- **Si ese día cierra** (o no hay hueco en que esté abierto), se avisa en la misma hoja: «El jueves 26 la Galería Borghese cierra. ¿Lo ponemos el viernes 27?» [Ponerlo el viernes 27] [Dejarlo el jueves igual]. Nunca se niega nada.
- Lo que tiene hora de verdad (una entrada, un tour, una excursión con recogida) sigue pidiendo la hora desde RESERVAS. **La hora con la que empieza la ruedita** (hoy, siempre 8:45): si el sitio ya está en la ruta ese día, la hora a la que la ruta llega ahí, redondeada a la franja más cercana; si no, las 9:00, o la hora de apertura si abre más tarde. Los minutos se quedan, en los saltos de cada sitio.
- Para el invitado de un viaje compartido, nada de esto cambia el viaje del dueño (ya no lo hace).

### 1.5 Los días, más bonitos
- En la hoja para elegir el día (añadir un sitio y «Mover a»), cada día así: **«Jue 26 Nov · Roma antigua y Centro histórico»** (el día de la semana y el mes con la primera letra en mayúscula, el número y el nombre del día de la ruta). Con el estilo de Marca JUTRIP.

## 2. La prueba
- La batería rápida y `pruebaJutrip`.
- Prueba nueva `pruebaTanda10O`:
  - las dos pestañas, para el dueño y el invitado, con y sin pase; sin pase, «Cerca de ti» abre la hoja; el Free Tour con 978; los tres sitios fuera de la lista y su texto todavía en la ruta en Navidad; los siete entre los puestos 15 y 25; los ocho al final; los cinco miradores fuera y la Terraza del Altar de la Patria dentro;
  - la foto del Castillo por fuera en Entradas; Excursiones con foto, duración y precio (y bonita aunque falte un dato); la tarjeta Hoteles antes de Baños y Fuentes, y que abre los alojamientos; la API encendida solo para los emails de admin, y apagada para los demás; la caché en 4 h como mucho;
  - añadir un sitio sin hora: va a su mejor sitio; si ese día cierra, el aviso con sus dos botones; la ruedita de una entrada empieza en la hora que toca;
  - los días con el formato «Jue 26 Nov · …».
- Capturas en `docs/dias/capturas_jutrip/` y una página `docs/dias/REPASO_10O.html`, a tamaño de móvil, para que Eric lo revise en su teléfono.

## 3. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10O».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
