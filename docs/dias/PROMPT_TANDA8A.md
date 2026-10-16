Hola. Nueva tanda: TANDA 8A, EL CEREBRO DE LOS LOGROS. Esta tanda no lleva pantallas de Design: solo las reglas, los datos, el servidor y las pruebas. Las pantallas llegan en la 8b (HOY v2 y los momentos) y en la 8c (las pantallas de los logros). Todo va detrás de un interruptor apagado en producción. No toques el motor de rutas.

## 0. Antes de empezar
- Lee, en docs/dias:
  - APUNTES_TRAS_TANDA7.md, apartados 9 y del 21 al 31;
  - NOMBRES_LOGROS.md;
  - BRIEF_DISENO_LOGROS.md;
  - GRATIS_Y_PASE.md;
  - tus informes INFORME_CUENTAS_1.md e INFORME_CUENTAS_2.md.
- **Si algo choca, manda este prompt.** En los apuntes hay versiones viejas: dentro de cada apartado, lo de más abajo manda sobre lo de arriba. PENDIENTES_RECOMPENSAS.md es historia: no lo uses como regla, salvo si este prompt te manda a él.
- Claude ha actualizado APUNTES_TRAS_TANDA7.md y ORDEN_PARA_CODE.md y ha dejado este prompt. Inclúyelos en tu commit tal cual.
- Los logros van en la cuenta, así que todo se apoya en lo de las cuentas (`achievements`, `stop_visits`, `trip_photo_meta`, `passes`, `app_config`). Las migraciones 0020, 0021 y 0022 siguen sin aplicar. Si necesitas tablas nuevas, escribe la 0023 (o las que hagan falta) sin aplicarlas, y prueba con PGlite como en `pruebaCuentas1`.
- **Interruptores:** uno nuevo para los logros (por ejemplo `VITE_LOGROS_ACTIVOS` y `LOGROS_ACTIVOS` en el servidor), apagado en producción. Solo funciona si las cuentas también están encendidas.

## 1. Los datos de los logros, en archivos
Todo lo de cada destino va en un archivo de datos (por ejemplo `data/logros/roma.json`), y los logros de viajero en otro (por ejemplo `data/logros/viajero.json`). Nada escrito a mano dentro del código. Los nombres y las líneas cortas, de NOMBRES_LOGROS.md.

**Regla de los sitios:** cada sitio de una colección o de un emblema tiene que existir ya en nuestros datos de Roma, con su id. No inventes sitios ni coordenadas. Si falta alguno, déjalo fuera del archivo y apúntalo en el informe; no lo añadas tú.

### Roma: los sellos
- **Roma**, por los 8 imprescindibles: Coliseo, Foro Romano y Palatino, Fontana de Trevi, Panteón, Piazza Navona, Plaza de España, Castillo de Sant'Angelo y Trastevere.
  - 1: bronce;
  - 4: plata;
  - 6: oro;
  - 8: diamante.
- **El Vaticano**, por sus 3 sitios: Museos Vaticanos, Basílica de San Pedro y Plaza de San Pedro. No tiene bronce.
  - 1: plata;
  - 2: oro;
  - 3: diamante.
- El sello es uno solo y se transforma: no salen dos.
- Los nombres de cada grado, de NOMBRES_LOGROS.md, apartado 1.
- En los datos del motor no se toca el nivel de ningún sitio. Solo cambian las listas de los logros.

### Roma: las 11 colecciones, por grupos y en este orden
| Grupo | Colección | Sitios |
|---|---|---|
| Las principales | Los imprescindibles de Roma | los 8 del sello |
| Las principales | El país más pequeño del mundo | Museos Vaticanos, Basílica de San Pedro, Plaza de San Pedro |
| Las de empezar | Las 4 joyas de Roma | Coliseo, Fontana de Trevi, Panteón, Museos Vaticanos |
| Las de empezar | El alma de Trastevere | Isla Tiberina, Santa Maria in Trastevere, San Pietro in Montorio y el Tempietto, el barrio de Trastevere |
| Las de artistas | La Roma de Miguel Ángel | Museos Vaticanos, Basílica de San Pedro, Plaza del Campidoglio, Santa Maria sopra Minerva |
| Las de artistas | La Roma de Bernini | Piazza Navona, Elefantino de Bernini, Plaza de San Pedro, Basílica de San Pedro, Puente Sant'Angelo |
| Las de artistas | Tras los pasos de Caravaggio | San Luigi dei Francesi, Santa Maria del Popolo, Galería Borghese |
| Las de explorar | La Roma antigua | Coliseo, Foro Romano y Palatino, Largo di Torre Argentina, Castillo de Sant'Angelo, Circo Máximo, Termas de Caracalla |
| Las de explorar | Los miradores | Mirador del Janículo, Terraza del Pincio, Jardín de los Naranjos |
| Las de explorar | Plazas y fuentes de Roma | Piazza Navona, Piazza del Popolo, Plaza de España, Plaza Venecia, Fontana de Trevi, Fontana dell'Acqua Paola, Fuente del Tritón |
| Las de explorar | La Roma secreta | Ojo de la Cerradura del Aventino, Pirámide Cestia, Basílica de San Clemente, Tempietto de Bramante, Fuente de las Tortugas |

- Cada colección tiene tantos pedazos como sitios, y cada pedazo es siempre su sitio.
- Al completarla sale su nombre y, debajo, su línea («Luz y sombra»…): NOMBRES_LOGROS.md, apartado 2.
- **El Tempietto** sale en El alma de Trastevere (junto a San Pietro in Montorio) y en La Roma secreta. Si en los datos es un solo sitio, cuenta en las dos.

### Roma: los 12 emblemas ocultos
- **10 de sitio:** Coliseo, Foro Romano, Museos Vaticanos, Plaza de San Pedro, Basílica de San Pedro, Panteón, Fontana de Trevi, Boca de la Verdad, Ojo de la Cerradura del Aventino y Catacumbas de San Calixto. Los nombres y las líneas, de NOMBRES_LOGROS.md, apartado 3. El de la Plaza se llama «La frontera que no se ve».
- **2 de momento**, solo en los 8 imprescindibles y según la hora de la foto (nunca se enseña la hora):
  - Madrugador: antes de las 8:00;
  - Nocturno: desde las 22:00, o desde las 19:00 en invierno (la misma definición de invierno de la Tanda 7).
- Los del Vaticano cuentan en la página de Roma: «Roma esconde 12 secretos».
- **El Coliseo** es además «Tu primera maravilla» (las 7 maravillas, en el apartado 3).

### Datos de cada sitio que hacen falta
- **El radio de la ubicación:** más grande en los sitios grandes (los Museos, el Circo Máximo). Trastevere es un barrio: el radio cubre todo el barrio. Pon tú los radios con su motivo y enséñalos en el informe.
- **Foto dentro:** un campo con su texto, para los sitios donde no se pueden hacer fotos dentro. La foto vale en cualquier punto del sitio o en su entrada.
  - Museos Vaticanos: «En la Capilla Sixtina no se pueden hacer fotos: hazla en cualquier otra sala o en la salida.»
  - Catacumbas de San Calixto: «Dentro no se pueden hacer fotos: hazla en la entrada.»
  - Galería Borghese: «Sin flash.»
- **El país** de cada sitio (Italia o Ciudad del Vaticano) y si su ciudad es capital.
- **El Patrimonio de la Humanidad** al que pertenece cada sitio, si pertenece a uno.
  - En Roma: el Centro histórico, la Ciudad del Vaticano y la Vía Apia.
  - En las excursiones: Pompeya, Villa Adriana, Villa d'Este, Florencia y la Costa Amalfitana.
  - No lo adivines: pon solo lo que puedas comprobar con la lista oficial de la UNESCO y deja en el informe la lista sitio por sitio, para que la revisemos.
  - Si las excursiones no tienen Visto en la app, dímelo y no cuentan de momento.

## 2. Cómo se gana cada cosa
**La regla de siempre:** el viajero solo toca [Visto] y, si quiere o hace falta, hace su foto. Una sola foto lo reparte todo: los pedazos, el emblema, el sello y los logros de viajero.

**Lo decide el servidor, nunca el móvil.**
- El móvil manda los hechos:
  - el Visto, con su hora;
  - la ubicación de ese momento, si la hay;
  - los datos de la foto leídos en el móvil (la fecha de la cámara, la ubicación si la trae y si es de una cámara).
- El servidor decide qué se gana y lo guarda en `achievements`.
- Se puede volver a calcular todo desde los hechos con una función: así, si cambian los datos, nada se descuadra.
- Nunca da dos veces lo mismo.

**Solo en las fechas del viaje.** Fuera de ellas, el Visto se marca para la ruta, pero no da logros.

**[Visto] también vale en la ficha de cualquier sitio** durante las fechas del viaje, aunque no esté en la ruta.

**Un pedazo de colección** (y el avance de su sello):
- Con ubicación y cerca del sitio: se gana al tocar Visto, sin foto. La foto es opcional, para el álbum.
- Sin ubicación (no dio permiso o no hay señal): no se gana todavía. El móvil enseñará «Activa tu ubicación o haz una foto para ganar tu pedazo». Con una foto válida de ese día, se gana.
- Con la ubicación lejos: el Visto se marca para su ruta, pero el pedazo no («Parece que no estás en Plaza Navona. Tu pedazo te espera allí.»).

**Un emblema oculto:** siempre con una foto válida en el sitio.

**La foto válida:**
- de la cámara de la app; o
- de la galería, con estas condiciones:
  - tiene que ser de una cámara: una captura de pantalla o una foto bajada de internet no vale («Esta foto no está hecha con una cámara.»);
  - su fecha tiene que estar dentro de las fechas del viaje. Si no: «Esta foto es del 2 de septiembre. Elige una del 10 al 14 de octubre.»;
  - si trae ubicación, tiene que ser en el sitio. Si no: «Esta foto no es de la Fontana de Trevi.» Si no trae ubicación, vale;
  - vale también la foto de un amigo del grupo;
  - la hora de aterrizar no se mira.
- **No se mira lo que sale en la foto.** Eso será más adelante, automático y nunca por una persona.
- **Las fotos, como ya las tienes:** unos 300 KB, privadas, y sin los datos escondidos al subirlas. Los datos se leen en el móvil antes de quitarlos.
- **La ubicación del momento** solo se usa para decidir. No se guarda: solo queda si se dio por buena.
- **Las horas** (fechas, Madrugador, Nocturno, días seguidos) van siempre en la hora del destino (Roma).

**Deshacer:**
- Al tocar Visto: «Fontana de Trevi marcada como visto · [Deshacer]» durante 5 segundos.
- Después, con «¿No estás aquí? Desmarcar visto» o desde el menú «···» de la parada, mientras no haya foto.
- Lo ganado solo con el Visto (un pedazo por ubicación) se quita al desmarcar. Lo ganado con una foto ya no se quita nunca.

**Sin cobertura:**
- El móvil guarda el Visto, su hora, la ubicación de ese momento y la foto.
- Lo manda al volver la señal; las sorpresas salen entonces.
- La hora que cuenta es la del Visto, no la del envío.

**«Lo de ayer también cuenta»:**
- Una función que dice qué paradas de los días anteriores del viaje no tienen todavía su pedazo o su emblema.
- Sirve para la tarjeta que sale al empezar el día de prueba o al comprar el pase: «Ayer tenías en tu ruta: Fontana de Trevi, Panteón…».
- Con las fotos de la galería de esos días se gana lo que toque.

**El plazo para reclamar:**
- 30 días desde el último día del viaje para subir las fotos que faltan. Después, lo pendiente se pierde.
- Durante el viaje no hay cuenta atrás: solo «Te espera una sorpresa: sube tu foto». La cuenta atrás, solo después del último día.
- Desde casa, solo con fotos de la galería de esas fechas (y de ese sitio, si la foto trae ubicación).
- El servidor sabe en todo momento qué queda pendiente y cuántos días quedan, por viaje.

**Viajes compartidos:** cada persona tiene sus Vistos y sus logros, aunque la ruta sea la misma.

**Volver a la misma ciudad:** el avance de las colecciones y de los sellos se suma entre viajes.

## 3. Los logros de viajero
Las listas, los escalones y los nombres están en NOMBRES_LOGROS.md, apartado 4. Lo que manda:

**Los escalones**
- Países: 1, 3, 5, 8, 10, 15, 20, 25, 30.
- Destinos: 1, 3, 5, 10, 15, 20.
- Capitales: 5, 10, 15, 25.
- Patrimonios: 1, 10, 15.
- Cazador de emblemas: 5, 10, 15.
- Coleccionista: 5, 10, 15.
- Las 7 maravillas: de 1 a 7.
- Viajes: 1, 5, 10.
- Con quién viajas (A mi aire, En pareja, Con amigos, En familia): 1, 3, 5, 10, cada uno con su chapa.
- Conocedor de la ciudad: 25 y 50 sitios distintos vistos en la misma ciudad, sumando viajes.

**Solo se gana viajando con la app**
- Ya no cuentan los países de antes (cambia lo de los apuntes, apartado 31).
- Los países marcados en «¿Dónde has estado ya?» o los viajes añadidos a mano solo pintan el globo y suman en los números («12 países · 41 días viajando»). No dan ningún logro, ni sello, ni colección.
- Guárdalos aparte de lo ganado con la app.

**Qué es un viaje hecho con la app:** un viaje con al menos un Visto válido en sus fechas.

**Cuándo cuenta cada cosa**
- **Un país:** con el primer Visto válido en un sitio de ese país. El Vaticano cuenta con cualquiera de sus 3 sitios.
- **Una capital, un destino o un continente:** igual, con el primer Visto válido allí.

**Escalones visibles**
- Solo se ven los logros y los escalones que se pueden conseguir con los destinos que tenemos curados. Calcúlalo solo, desde los datos.
- Cuando un escalón se pueda conseguir, aparece con «Nuevo escalón».
- Con solo Roma, muchos no saldrán todavía. Dime en el informe cuáles se ven hoy.

**Lo que ya está decidido (Eric)**
- **Dos países en un día:** Vistos válidos en Italia y en el Vaticano el mismo día.
- **De sol a sol:** Madrugador y Nocturno el mismo día.
- **Alondra:** 10 veces Madrugador. **Búho:** 10 veces Nocturno.
- **Escapada:** 1 o 2 noches. **Gran viaje:** 10 noches o más.
- **Imparable:** 3 días seguidos completados.
- **El fotógrafo:** foto en todas las paradas vistas de un viaje.
- **Con quién viajas:** sale del formulario. Se puede cambiar hasta que empieza el viaje; después queda fijo. Si la pareja entra con el Pase Dúo, el viaje es «en pareja» para los dos.
- **Nunca es la última vez:** un segundo viaje hecho con la app a la misma ciudad.
- **Tres ciudades de oro** y **Tres ciudades de diamante:** una ciudad en diamante también cuenta para la de oro.
- **Viajero fundador:**
  - para quien haga un viaje con la app desde la salida hasta un año después;
  - guárdalo como «salida + 1 año», leyendo la fecha de salida de `app_config` (`salida_app`). Nunca una fecha escrita a mano: si cambia la salida, cambia sola.
- **Pionero:** los 100 primeros viajeros de cada destino, con un dato por destino para encenderlo o apagarlo.
- **La edición del año:** «Roma 2027», con un Visto válido en Roma ese año.
- **Probador:** por decidir. Déjalo preparado, sin darlo solo; se da a mano desde /admin/logros.

**Lo que decido yo (Claude)**
Ponlo así, y apúntalo en el informe para que Eric lo vea:
- **Las cuatro estaciones**, por meses:
  - primavera, de marzo a mayo;
  - verano, de junio a agosto;
  - otoño, de septiembre a noviembre;
  - invierno, de diciembre a febrero.
  - Cuenta el día de cada Visto válido.
- **Un destino, cuatro estaciones:** lo mismo, en la misma ciudad.
- **Los 12 meses:** un Visto válido en cada mes del año, en cualquier año.
- **Navidad fuera de casa:** un Visto válido el 24 o el 25 de diciembre. **Nochevieja:** el 31 de diciembre.
- **Tres viajes en un año:** 3 viajes hechos con la app que empiezan en el mismo año.
- **Día perfecto:** todas las paradas de un día vistas. No cuentan «Si te sobra tiempo» ni las paradas «Cerrado este día». Un día completado es lo mismo.
- **Viaje perfecto:** todos los días con paradas, perfectos.
- **Madrugador y Nocturno**, como emblemas: se ganan una vez por ciudad. Para Alondra y Búho, cuenta cada día distinto con su foto.
- **Ciudad al completo:** todas las colecciones de esa ciudad completas.
- **Todos sus secretos:** sus 12 emblemas.
- **La ciudad** de Tres ciudades de oro, Tres ciudades de diamante, Diamante a la primera y Conocedor es el destino (Roma), con su sello principal. El sello del Vaticano no cuenta como otra ciudad en estos.
- **Pionero:** encendido en Roma.

**Fuera de esta tanda:** la vuelta al mundo (va en una actualización después de la salida), la experiencia y los niveles, la tienda y las rutas para desbloquear.

## 4. El pase y los logros
- Los logros van en el Pase de Roma. Más:
  - el día de prueba (el primer día entero del primer viaje a ese destino) los tiene completos;
  - lo ganado en la prueba no se pierde nunca.
- **El cobro todavía no existe:** va en la parte 3 de las cuentas. Mientras tanto, todo abierto.
- Haz una sola función que diga si una cuenta puede ganar logros en un viaje y un día. Con el cobro apagado, siempre sí. Con el cobro encendido:
  - con el pase de ese destino;
  - o en su día de prueba.
- Si compra el pase más tarde, lo de los días anteriores se gana con las fotos de la galería («Lo de ayer también cuenta»), dentro del plazo de 30 días.

## 5. Lo que el servidor devuelve para las pantallas
Sin pantallas todavía, pero con todo listo para la 8b y la 8c.

**Después de cada Visto o foto: la lista de lo nuevo, en orden**
1. el emblema;
2. lo que suma (una línea por colección y por sello, con «1 de 8»…);
3. las colecciones completadas;
4. el sello que sube;
5. el país nuevo y el destino nuevo;
6. la maravilla y el Patrimonio;
7. los logros de viajero.
- Si Design pone otro orden en Logros · Momentos, manda Design: déjalo fácil de cambiar.
- Cada cosa lleva si es la primera vez que se descubre. La frase de suspense de antes del emblema («¡Eh! Aquí hay algo…» y las demás de los apuntes, apartado 12) va solo la primera vez, al azar y sin repetir la última que vio esa persona. Al volver a verlo, sin frase.

**El botón flotante y Logros, por viaje**
- Los sellos con su grado y lo que falta para el siguiente.
- Las colecciones con su avance, en este orden:
  1. lo nuevo de hoy;
  2. las completas;
  3. las de su ruta;
  4. las demás.
- «En tu ruta»: la colección que su ruta puede completar. Para eso:
  - cuentan las paradas de sus días;
  - no cuentan «Si te sobra tiempo» ni las paradas «Cerrado este día»;
  - usa la lista de paradas que ya calcula el motor, sin tocarlo.
- «Con tu ruta puedes completar 7 colecciones».
- «Roma esconde 12 secretos» / «3 de 12 secretos encontrados». Nunca cuáles ni dónde.
- Lo pendiente de reclamar y los días que quedan.

**El puntito del botón**
- Cada cosa ganada guarda si su animación se vio.
- Si se saltó (también con [Saltar todo]), queda sin ver y el botón lleva puntito.

**La pestaña de colecciones de la ficha**
- Las colecciones del sitio, con sus sitios: vistos, este sitio y los demás.
- La línea «Con el Coliseo, 2 de 6».
- Nunca emblemas ni logros de viajero. Sin pestaña en los sitios que no están en ninguna colección.

**El pasaporte**
- Los países con algo que ganar en la app, aunque no haya ido («Por descubrir», con sus sellos en gris), y los que ha visitado («Tus países»), con la fecha de entrada (su primer Visto válido).
- Los números («6 países · 9 ciudades · 41 días viajando») cuentan solo lo visitado, también lo de antes de la app.
- «Nuevo» solo en los destinos recién añadidos: un dato con fecha en cada destino.

**La vitrina**
- El pedestal de las maravillas, solo si tiene alguna.
- La balda de los exclusivos, sin límite.
- Las baldas temáticas, de 4 huecos cada una: logros de viajero, sellos de ciudad, colecciones completadas y emblemas.
- Los huecos se llenan solos con lo último ganado, hasta que el viajero elige con [Llevar a mi vitrina]. Si la balda está llena, elige cuál quita.
- [Usar como mi título], en los logros de viajero.
- Guárdalo en la cuenta (migración nueva, sin aplicar).

**El resumen del día y el del viaje**
- Todo lo ganado ese día o en ese viaje, y lo pendiente.
- Para el resumen del viaje, cuál de los dos textos toca:
  - con al menos 3 colecciones completas y 2 secretos: «¡Wow! Tu viaje a Roma fue increíble…»;
  - si no: «Roma se ha quedado con ganas de verte otra vez: aún esconde {n} secretos…».

## 6. Los avisos (la lógica, sin enviar todavía)
- Calcula a quién toca avisar y cuándo:
  - el resumen del viaje, al día siguiente del último día;
  - «Te quedan 3 días para reclamar tus 2 sorpresas de Roma», 3 días antes de que acabe el plazo.
- Déjalo en una cola. El envío de verdad (aviso en el móvil o email) se enciende cuando estén la pantalla del permiso (paso 3 de Design) y el servicio de correo (falta el dominio).
- Si preparar el aviso en el móvil (web push) es sencillo, déjalo listo detrás de su interruptor y dime qué falta.

## 7. Que la web se pueda instalar en el móvil
- Con su icono, su nombre y su pantalla de inicio, abierta a pantalla completa, sin la barra del navegador.
- El nombre aún no está decidido: déjalo en un solo sitio, fácil de cambiar, con un icono provisional.
- Un service worker mínimo, sin modo sin conexión y sin guardar las respuestas del servidor (para no enseñar datos viejos).
- El aviso «Añádela a tu pantalla de inicio»:
  - la lógica: sale una vez, se puede cerrar y no sale si ya está instalada;
  - explica cómo hacerlo en iPhone y en Android (en Android, con el aviso del propio navegador si lo da);
  - de momento, una versión provisional detrás del interruptor. El diseño llega con Design.

## 8. Los sonidos y la vibración (preparados)
- Una sola función para hacer sonar cada momento, con archivos provisionales muy ligeros. Los de verdad los pondrá Eric más adelante, sin tocar el código.
- Reglas:
  - suena al tocar Visto, que es cuando el móvil deja sonar;
  - de 1 a 3 segundos;
  - un ajuste para quitar el sonido siempre;
  - respeta el modo silencio donde el navegador lo permita. Dime en qué móviles se puede y en cuáles no.
- La vibración, pequeña, solo donde el móvil la permite.

## 9. El peso
- Los logros se dibujarán con código (SVG o CSS), sin vídeos ni GIF. Las escenas se cargan solo al abrirlas.
- Las fotos, en WebP y cargadas al verlas.
- Los audios de «Escuchar», al darle al play.
- Mide cuánto pesa abrir la app la primera vez (antes y después de esta tanda) y ponlo en el informe. La meta, unos 2 MB o menos.

## 10. /admin/logros
Una página solo para Eric. La cuenta de administrador, por una variable del servidor; ningún email escrito en el código. En ella:
- **por destino, todo lo de los datos:**
  - los sellos con sus grados;
  - las colecciones con sus sitios;
  - los emblemas con su sitio, su radio y su texto de «foto dentro»;
  - los Patrimonios;
- **avisos de los datos:** sitios que faltan, ids que no existen, un sitio sin radio;
- **los logros de viajero** con sus escalones, cuáles se ven hoy y cuáles todavía no;
- **un simulador:** elige unos sitios, unas fechas y unas horas de foto, y mira qué se gana y en qué orden;
- **cuánta gente tiene cada logro** (solo números);
- **dar Probador a mano** a una cuenta.
- **Nunca enseña las fotos de nadie.**

## 11. La prueba de las fotos en iPhone y Android
- Una página de prueba, detrás del interruptor: eliges una foto de la galería y dice qué datos llegan (la fecha, si trae ubicación, si es de una cámara). No sube nada.
- Así Eric la prueba con su iPhone y con un Android. Explica en el informe cómo usarla.

## 12. La prueba
- No toca el motor: la batería rápida.
- Una prueba nueva de los logros con PGlite, con estos casos, por lo menos:
  - los 4 grados de Roma y los 3 del Vaticano;
  - un pedazo con ubicación cerca, sin ubicación, con ubicación lejos y con foto;
  - un emblema sin foto (no se gana) y con foto;
  - la foto de la galería: de otro día, sin datos de cámara, de otro sitio y buena;
  - un Visto fuera de las fechas del viaje;
  - deshacer antes y después de la foto;
  - Madrugador y Nocturno, en verano y en invierno, y en un sitio que no es imprescindible (no da nada);
  - una foto que suma en tres colecciones a la vez (Basílica de San Pedro);
  - completar una colección y que el sello suba;
  - dos países en un día;
  - el plazo de 30 días: el día 30 vale, el 31 no;
  - el Visto sin cobertura que llega horas después;
  - los países de antes, que no dan logros;
  - un viaje compartido, con los logros de cada persona;
  - un segundo viaje a Roma («Nunca es la última vez», y el avance sumado);
  - Viajero fundador con la fecha de salida cambiada;
  - lo mismo dos veces no se da dos veces;
  - volver a calcular todo da lo mismo;
  - la función del pase con el cobro apagado y encendido.

## 13. El informe (docs/dias/INFORME_TANDA8A.md)
En español sencillo:
- qué has hecho y dónde está cada cosa;
- los sitios que faltan en los datos;
- los radios que has puesto;
- la lista de Patrimonios, sitio por sitio, con su fuente;
- los logros y escalones que se ven hoy;
- lo que he decidido yo (el apartado 3), por si Eric quiere cambiarlo;
- el peso de la app;
- las migraciones nuevas, sin aplicar, y en qué orden van después de la 0022;
- lo que tiene que hacer Eric fuera del código;
- lo que queda para la 8b y la 8c;
- los riesgos y lo que no has podido hacer.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
