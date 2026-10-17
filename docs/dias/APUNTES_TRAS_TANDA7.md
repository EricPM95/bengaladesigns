# Lo decidido después de pasar la Tanda 7 (13-oct, desde las 21:55)

Todo esto va a la **Tanda 8**. Code no lo tiene todavía. No se toca la Tanda 7 mientras Code trabaja.

---

## 1. HOY sigue siendo de pago, con un día de prueba gratis

- **Cuándo se gasta la prueba:** es el primer día del viaje en que el viajero usa HOY de verdad, es decir, cuando toca [Visto] o [Cómo llegar]. Si solo abre HOY y lo cierra, no la gasta.
- **Al acabar el día de prueba,** una tarjeta: «¿Te ha gustado HOY? Sigue con él el resto de tu viaje.» con [Seguir con HOY], para pagar en un toque.
- **El día de llegada, en la versión gratis,** una tarjeta: «¿Acabas de llegar? Con la versión completa, tu primer día se ajusta a la hora de tu vuelo.»
- **Lo que no sale en la prueba:** el billete, nada del vuelo y [Cómo llegar a tu alojamiento], porque todo eso es de pago.
- **Los demás días de la gratis,** DÍAS se abre en el día de hoy, con [✓ Visto], [Hacer foto], y los emblemas y los sellos en cada parada.
- **Diseño:** fuera las pantallas de la versión gratis con candados. Esa idea ya no vale.

## 2. Escuchar es solo la historia

- **En toda la app** (la ficha y HOY), el único audio es la historia: [Escuchar historia], solo en los sitios que tienen historia. La del Coliseo es gratis.
- **Fuera la ficha leída en voz alta.**
- **En HOY, el botón [Sobre este lugar]:** abre una hoja con el texto útil del Resumen de la ficha: el porqué, la descripción, «Qué vas a ver» y «Por qué te lo recomendamos». Sin Cómo llegar, sin etiquetas y sin botones.
- **Lo que hay que grabar:** solo las 31 historias. Las fichas no se graban.

## 3. «Por qué te lo recomendamos» da valor al sitio

- **Qué dice:** por qué vale la pena ese sitio. Por ejemplo, que es un icono de Roma o lo que lo hace único. Nunca la logística de la ruta («desde aquí el Panteón está a cinco minutos…»).
- **En Roma,** un campo nuestro en los datos, `por_que_recomendamos`, sin IA al abrir la ficha. Los 95 textos están escritos en POR_QUE_RECOMENDAMOS_ROMA.md; **los revisa Eric**.
- **Lo que tiene que decidir Eric de ese archivo:**
  - Plaza Colonna y Piazza Colonna están repetidas: hay que dejar solo una.
  - La cifra de 50.000 espectadores del Coliseo.
  - Los nombres de Van Gogh, Klimt y Monet en la GNAM.
  - Fellini en Via Margutta.
- **En los sitios que no son nuestros** sigue escribiendo la IA, pero con el pedido cambiado («nunca la logística de la ruta»). Se borran los textos viejos guardados.

## 4. «Guarda un recuerdo» y las fotos

- **En los sitios sin logro,** al marcar [Visto], sale la tarjeta «Guarda un recuerdo» para hacer una foto.
- **De dónde sale la foto:** de la cámara de la app o de la galería. De la galería, solo si la foto es de hoy.

## 5. El día de llegada en HOY

- **El bloque «Te recomendamos comer algo…»** con [Explorar restaurantes] solo sale cuando la ruta del día 1 lleva «la comida al llegar», es decir, cuando el viajero está libre entre las 12:00 y las 14:59. Nunca si la ruta ya lleva la comida dentro, ni de las 15:00 en adelante.
- **Si llega tarde** (libre a las 23:00 o más tarde, sin paradas), una tarjeta: «Llegas tarde: hoy no te hemos puesto paradas, descansa. Si tienes hambre, aquí tienes los restaurantes de Roma.» con [Explorar restaurantes].
- **Los demás días de llegada,** un enlace pequeño en la tarjeta del vuelo: «Restaurantes cerca de tu alojamiento». Abre EXPLORAR › Restaurantes con «Cerca de mí». No lleva el «te recomendamos comer».
- **«Tu ruta empieza en…»** dice siempre la primera parada real de ese día. La Tanda 7 ya lo pide así; el error de Piazza Navona solo está en el dibujo de diseño.

## 6. [Cómo llegar a tu alojamiento]

Solo sale si el viajero ha escrito la dirección exacta de su alojamiento. Esa casilla es nueva, opcional y de pago, y va en la Tanda 7.

| Dónde | ¿Sale? |
|---|---|
| La ficha de llegada | Sí |
| HOY, el día de llegada, después del billete | Sí |
| HOY, al acabar cada día | Sí |
| El día de prueba gratis | No |
| El día de vuelta | No |

## 7. Restaurantes el día de vuelta

Ya está en la Tanda 7, así que no hay que pedir nada nuevo. Solo lleva comida con vuelos a las 17:00 o más tarde (Fiumicino) y en el «día más» de los vuelos de las 23:00 o más tarde. La mañana corta y la mañana sin comida llevan solo paradas.

## 8. Arreglos al diseño de HOY

**Ya hechos en la versión 2-2:**
- sin «Día n»;
- los títulos por grupos;
- «Día de viaje · Roma → Madrid»;
- Escuchar historia y Sobre este lugar;
- la tarjeta del día de prueba;
- la foto desde la galería.

**Faltan (mensaje para diseño ya escrito):**
1. **Pantalla 11:** el ejemplo de «Por qué te lo recomendamos» habla de cómo llegar. Hay que cambiarlo por un texto de valor.
2. **Pantalla 12:** quitar [Cómo llegar a tu alojamiento] y «Empezar de nuevo (prototipo)».
3. **Pantalla 4:** «Trevi y Plaza de España» no es un título de grupo.
4. **El día de llegada:**
   - el bloque de comer, solo de 12:00 a 14:59;
   - una pantalla nueva para la llegada tardía;
   - el enlace pequeño «Restaurantes cerca de tu alojamiento».
5. **«Tu ruta empieza en…»,** con la primera parada real.

## 9. Los logros

**Decidido (Eric, 22:51):**
- **1A, la sorpresa al tocar [Visto]:** «¡Has encontrado un emblema secreto! · {texto}» y debajo [Guárdalo con una foto]. Si no está allí o falla la ubicación: «Te espera en {sitio}». En los sitios sin emblema, «Guarda un recuerdo».
- **2A, las fotos de la galería valen para el emblema:** si es una foto de cámara con fecha de las fechas del viaje, hasta 30 días después. Code lo prueba en iPhone y en Android, porque algunos móviles quitan la fecha al elegir la foto desde la web.

- **(23:09) 3A, el sello de Roma:**
  - Bronce: has estado.
  - Plata: 6 de los 11 imprescindibles vistos con foto.
  - Oro: los 11.
  - Brillante: todos los emblemas secretos, o el tercer viaje a Roma.
- **(23:09) Ganar es gratis para todos;** lo de pago es la comodidad (HOY) y el aspecto (los sellos y marcos especiales).
- **(23:09) El resumen del final del viaje** lleva también lo encontrado:
  - los emblemas, con su foto;
  - las colecciones, con su avance;
  - los logros de viajero nuevos.
- **(23:09, idea de Eric, por concretar) En la versión gratis, la sorpresa llega al acabar el día:** «¡Has completado el día!», y ahí se suben las fotos y se desbloquean los emblemas. La propuesta de Claude, con los detalles, está en el chat.

- **(23:16) Las colecciones de Roma** (Eric: «es lo que debería ser»).
  - **Las dos reglas:**
    1. Solo llevan sitios de nuestros días escritos.
    2. Solo se ven las que la ruta del viajero puede completar. Cuentan las paradas de sus días; no cuentan «Si te sobra tiempo» ni las paradas «Cerrado este día». Una colección empezada no desaparece nunca.
  - **Las seis:**
    - La Roma antigua (6): Coliseo, Foro y Palatino, Arco de Constantino, Largo di Torre Argentina, Panteón, Castillo de Sant'Angelo.
    - La Roma de Bernini (5): Piazza Navona, Elefantino de Bernini, Plaza de San Pedro, Basílica de San Pedro, Puente Sant'Angelo.
    - Cazador de fuentes (5): Piazza Navona (los Cuatro Ríos), Fuente de las Tortugas, Fontana dell'Acqua Paola, Fontana de Trevi, Plaza de España (la Barcaccia).
    - Tras los pasos de Caravaggio (3): San Luigi dei Francesi, Santa Maria del Popolo, Galería Borghese.
    - Los miradores (3): Mirador del Janículo, Terraza del Pincio, Jardín de los Naranjos.
    - Las grandes basílicas (3): Basílica de San Pedro, Basílica de Santa María la Mayor, Basílica de San Juan de Letrán.
  - **(23:38) Las cuatro sencillas** (Eric: «me encantan todas»):
    - Las 4 joyas de Roma: Coliseo, Fontana de Trevi, Panteón, Museos Vaticanos.
    - Las plazas de Roma: Piazza Navona, Plaza del Campidoglio, Plaza Venecia, Plaza de San Pedro y (14-oct, 08:55, Eric) Plaza de España: 5 sitios.
    - Iglesias con tesoro: Iglesia del Gesù, San Luigi dei Francesi, Santa Maria sopra Minerva, Santa Maria in Trastevere.
    - Un paseo por Trastevere: Isla Tiberina, Santa Maria in Trastevere, San Pietro in Montorio y Tempietto de Bramante, Trastevere.
  - **Dos más** (propuesta de Claude, por confirmar):
    - La Roma de Miguel Ángel: Museos Vaticanos (la Capilla Sixtina), Basílica de San Pedro (La Piedad), Plaza del Campidoglio (la diseñó él), Santa Maria sopra Minerva (su Cristo).
    - A orillas del Tíber: Castillo de Sant'Angelo, Puente Sant'Angelo, Isla Tiberina.
  - **(23:53, Eric) ROMA Y EL VATICANO, SEPARADOS. Cambia lo de arriba.** El motivo: no todos consiguen entrar a los Museos, así que el sello de Roma no depende de ellos, y el del Vaticano es el difícil.
    - **Los imprescindibles de Roma pasan a ser 8:** Coliseo, Foro Romano y Palatino, Arco de Constantino, Fontana de Trevi, Panteón, Piazza Navona, Plaza de España, Altar de la Patria.
    - **El sello de Roma** (propuesta de Claude, por confirmar):
      - bronce: has estado;
      - plata: 5 de los 8;
      - oro: los 8;
      - brillante: todos los emblemas de Roma (sin los del Vaticano) o el tercer viaje.
    - **El Vaticano:** Museos Vaticanos, Basílica de San Pedro y Plaza de San Pedro.
      - El país cuenta en cuanto ve uno de los tres.
      - El sello del Vaticano, con los tres.
      - Los emblemas de los Museos, la Basílica y la Plaza son del Vaticano.
    - **(00:00, Eric) El sello del Vaticano, por sitios vistos:**
      - 1 de los 3: plata;
      - 2: oro;
      - 3: brillante.
      - Con la Plaza y la Basílica, que son gratis, ya es oro; el brillante pide entrar a los Museos.
  - **(00:00) Las preguntas de Eric** (respuestas de Claude en el chat, por confirmar):
    - **Madrugador:** una foto en cualquier imprescindible antes de las 8:00, según la hora de la foto.
    - **Logros de viajero:**
      - las 7 maravillas;
      - los países (1, 5, 10, 20);
      - los Patrimonios de la Humanidad (1, 10, 25, 50);
      - las cuatro estaciones;
      - los viajes (1, 5, 10);
      - el viajero fiel (volver a una ciudad);
      - la colección de oros (3 sellos de oro).
    - **Sin etiquetas en las tarjetas de DÍAS.** En la ficha de cada sitio, una línea «Forma parte de: …». La sección Logros tiene todo por categorías y lo que falta en cada una.
    - **Logros enseña todas las colecciones**, no solo las que la ruta completa (cambia la regla 2):
      - las que la ruta completa: «Tu ruta la completa»;
      - las demás: «Te falta: Galería Borghese» con [Añadir a mi ruta].
    - **[Visto] en la ficha de cualquier sitio** durante las fechas del viaje, aunque no esté en la ruta; con la foto vale igual.
    - **Todo con animación:**
      - la sorpresa del emblema;
      - lo que suma cada foto, una línea tras otra;
      - la colección completada;
      - la subida del sello;
      - el país nuevo;
      - la maravilla y el Patrimonio;
      - «¡Has completado el día!» y el resumen del viaje.
      - Corta (unos 2 segundos), se puede saltar tocando, respeta «reducir movimiento» del móvil y vibra un poco donde el móvil lo permite.
  - **(00:06, Eric) Madrugador y Nocturno, SOLO EN LOS IMPRESCINDIBLES:**
    - Se mira la fecha y la hora de la foto, sea de la cámara de la app o de la galería.
    - Antes de las 8:00: Madrugador.
    - Desde las 22:00, y desde las 19:00 en invierno (la misma definición de invierno de la Tanda 7): Nocturno.
    - Cambia lo de antes: ya no es «cualquier sitio» ni «3 fotos».
  - **(00:06, Eric) Colección de oros y de brillantes:** dos logros de viajero, «3 ciudades en oro» y «3 ciudades en brillante».
    - El sello de cada ciudad es uno solo y se transforma: el oro pasa a brillante, no salen dos.
    - Una ciudad en brillante cuenta también para la colección de oros.
  - **(00:06, Eric) Países: un logro por cada país nuevo** (1, 2, 3, 4…), cada uno con su animación.
  - **(00:06, Eric) Una pestaña nueva en la ficha, al lado de Tips:**
    - Lleva las colecciones a las que suma ese sitio, en tiempo real. Por ejemplo, «La Roma antigua · 1 de 6» si ya vio el Foro.
    - Cada colección va con sus sitios en fila: en verde, los vistos; en frambuesa, este sitio («suma aquí»); en gris, los demás.
    - Debajo: «Con el Coliseo, 2 de 6».
    - Sin la pestaña en los sitios que no están en ninguna colección.
    - Nunca enseña emblemas ni logros de viajero, para no estropear la sorpresa (Claude).
  - **(00:10, Eric) EL SELLO DE ROMA, POR IMPRESCINDIBLES (cambia todo lo de antes):**
    - 1 de los 8: bronce;
    - 4: plata;
    - 6: oro;
    - 8: diamante.
    - El último grado se llama **diamante**, no brillante, en todos los sellos. El Vaticano: 1 plata, 2 oro, 3 diamante.
    - Fuera lo de «todos los emblemas o el tercer viaje».
  - **(00:10, Eric) Destinos: un logro por cada destino nuevo** (1, 2, 3…), como los países. Solo los destinos curados.
  - **(00:10, Eric) Un botón flotante en DÍAS y en HOY:** abre una hoja con todo lo que se ve:
    - los sellos con su grado;
    - las colecciones con su avance;
    - en cada parada, a qué colecciones suma.
    - Nunca enseña los emblemas. Es también la puerta a la sección Logros.
  - **(00:10, Eric) En la Capilla Sixtina no se pueden hacer fotos.**
    - **(00:12) Miguel Ángel se queda con los Museos Vaticanos** (en los datos, la Capilla Sixtina es parte de ese sitio): vale una foto en cualquier sala de los Museos. No entra San Pietro in Vincoli. Pasa a ser de las de dificultad media, porque pide entrar a los Museos.
    - **Regla general:** en los sitios donde no se puede hacer fotos dentro, la foto vale en cualquier punto del sitio o en su entrada (el radio de la ubicación ya lo cubre).
    - Un campo nuevo en los datos, con su texto: «Dentro no se pueden hacer fotos: hazla en la entrada.»
    - En los Museos: «En la Capilla Sixtina no se pueden hacer fotos: hazla en cualquier otra sala o en la salida.»
    - Por comprobar con fuente, sitio por sitio, antes de publicar: las Catacumbas (Claude cree que no se puede), la Galería Borghese, la Cripta de los Capuchinos.
  - **(14-oct, 08:21) LOS LOGROS DE VIAJERO, LISTA AMPLIADA** (Eric: todos menos el de la lluvia):
    - **El mundo:**
      - continentes, uno por cada uno nuevo;
      - capitales: 5, 10 y 25;
      - Dos países en un día;
      - Los microestados de Europa: Vaticano, San Marino, Mónaco, Liechtenstein, Andorra y Malta;
      - Al otro lado del ecuador;
      - La vuelta al mundo: 40.075 km. Se cuenta solo la ida, del origen al destino que pone el viajero en el formulario del viaje, en línea recta. La vuelta no suma (Eric, 08:23).
    - **El tiempo:**
      - Los 12 meses;
      - Navidad fuera de casa;
      - Nochevieja fuera de casa;
      - Tres viajes en un año;
      - De sol a sol: Madrugador y Nocturno el mismo día;
      - Alondra: 10 Madrugador;
      - Búho: 10 Nocturno.
    - **Cómo viajas:**
      - Día perfecto;
      - Viaje perfecto;
      - Imparable: 3 días seguidos completados;
      - Escapada: 1 o 2 noches;
      - Gran viaje: 10 noches o más;
      - El fotógrafo: foto en todas las paradas vistas de un viaje.
    - **Coleccionista:**
      - Cazador de emblemas: 10, 25 y 50;
      - Coleccionista: 5, 10 y 25 colecciones completas;
      - Ciudad al completo;
      - Todos sus secretos;
      - Diamante a la primera.
    - **Exclusivos:**
      - Viajero fundador, para los que viajen con la app su primer año. Necesita una fecha de cierre y el login.
      - Pionero: los primeros 100 viajeros de cada destino nuevo.
      - (08:24, Eric: sí) La edición del año: cada año, cada destino tiene un emblema que solo existe ese año («Roma 2027»).
      - (08:24, Eric: sí) Probador: para los que usen la app antes de que salga al público.
    - **(08:24, Eric) La vuelta al mundo, por escalones:**
      - primeros 1.000 km;
      - 5.000;
      - 10.000: «Un cuarto de vuelta al mundo»;
      - 20.000: «Media vuelta al mundo»;
      - 40.075: «La vuelta al mundo».
      - Diseño: un mundo en partes que se va completando.
    - Fuera: «Ni la lluvia te para».
    - Se suman a los nueve de antes: países, destinos, maravillas, Patrimonios, estaciones, viajes, viajero fiel, colección de oros y colección de diamantes.
  - **(14-oct, 14:22, Eric) Nombres y logros nuevos:**
    - Un paseo por Trastevere pasa a ser **El alma de Trastevere**.
    - Viajero fiel pasa a ser **Nunca es la última vez**.
    - Las 4 joyas de Roma no se toca.
    - **Colección nueva, La Roma secreta (5):** Ojo de la Cerradura del Aventino, Pirámide Cestia, Basílica de San Clemente, Tempietto de Bramante, Fuente de las Tortugas. Quedan 15 colecciones.
    - **Logro de viajero nuevo, Un destino, cuatro estaciones:** la misma ciudad en las cuatro estaciones.
    - **Países por escalones:** 1, 3, 5, 10 («Ciudadano del mundo»), 25 y 50 (propuesta de Claude). Cada país nuevo tiene su animación, pero solo los escalones son logros.
    - **Destinos por escalones:** 1, 3, 5, 10 y 25.
    - **Patrimonios:** el de 10 se llama «Guardián del patrimonio».
  - **(14-oct, 14:38, Eric) La Roma antigua, rehecha**, para que no repita los imprescindibles: Coliseo, Foro Romano y Palatino, Largo di Torre Argentina, Castillo de Sant'Angelo, Circo Máximo y Termas de Caracalla. Salen el Arco y el Panteón.
  - **(14:38, Eric) Conocedor de la ciudad:** una chapa con dos escalones, 25 y 50 sitios distintos vistos en la misma ciudad, sumando viajes («Conocedor de Roma»).
  - **(14:33, Eric) Viajero nacional:** 3 destinos de tu propio país, según el origen del formulario.
  - **(14-oct, 14:42, Eric) Las insignias de las colecciones se parten en tantos pedazos como sitios tienen** (6 sitios, 6 pedazos). Cada pedazo es un sitio; con 3 de 6, la insignia a medio completar. Al tocar un pedazo, el nombre de su sitio (Claude).
  - **(14-oct, 17:25, Eric) DE 15 A 11 COLECCIONES (manda sobre las listas de arriba):**
    - **Las principales:** Los imprescindibles de Roma, El Vaticano.
    - **Las de empezar:** Las 4 joyas de Roma, El alma de Trastevere.
    - **Las de artistas:** La Roma de Miguel Ángel, La Roma de Bernini, Tras los pasos de Caravaggio.
    - **Las de explorar:** La Roma antigua, Los miradores, La Roma secreta y Plazas y fuentes de Roma.
    - **Plazas y fuentes de Roma, la grande (7):** Piazza Navona, Piazza del Popolo, Plaza de España, Plaza Venecia, Fontana de Trevi, Fontana dell'Acqua Paola, Fuente del Tritón.
    - **Fuera:** Iglesias con tesoro, A orillas del Tíber y Las grandes basílicas. Las plazas y Cazador de fuentes se juntan en Plazas y fuentes de Roma.
    - En Logros se enseñan por grupos.
    - Para los destinos nuevos: entre 8 y 12 colecciones por ciudad (a la GUIA_NUEVOS_DESTINOS).
  - **(14-oct, 17:29, Eric) Logros de viajero más bonitos y que evolucionan:**
    - Ahora parecen básicos y el icono se confunde con los emblemas.
    - Su propio estilo: chapas esmaltadas de colores cálidos, un color por grupo; sin azul noche con oro, sin metales de sello, sin holográfico.
    - Cada escalón hace crecer la misma chapa, cada vez más espectacular (en Países: el 1 básico, el 3 con borde y banderas… hasta el 50, con un mundo que gira).
    - Los de un solo paso, con su propia ilustración. Está en BRIEF_DISENO_LOGROS.
  - **(14-oct, 20:30) Fotos dentro, comprobado con fuente:**
    - **Catacumbas de San Calixto:** prohibido hacer fotos y vídeo dentro (su reglamento oficial, norma 14). La foto del emblema, en la entrada.
    - **Galería Borghese:** se pueden hacer fotos sin flash (su página de información; no es la web oficial del museo).
    - **Cripta de los Capuchinos:** se pueden hacer fotos para uso privado (su web oficial).
    - **Capilla Sixtina:** prohibido (ya apuntado).
    - Aviso en la app: Catacumbas «Dentro no se pueden hacer fotos: hazla en la entrada»; Borghese «Sin flash».
  - **(14-oct, 21:10, Eric) Los logros de viajero, con dibujos genéricos:** nada de monumentos de un destino (el Coliseo salía en «Un destino, cuatro estaciones», «Nunca es la última vez» y «Dos países en un día»). El nombre del sitio, si hace falta, va como texto real («Conocedor de Roma», «Roma 2027», los dos países que haya visitado).
  - **(14-oct, 21:15, Eric) Escalones de salida de los logros de viajero:**
    - Países: 1, 3, 5, 10.
    - Destinos: 1, 3, 5, 10, 15, 20.
    - Capitales: 5, 10, 15.
    - Cazador de emblemas: 5, 10, 15.
    - Coleccionista: 5, 10, 15.
    - Patrimonios: 1, 10, 15.
    - Vuelta al mundo: todos.
    - Los escalones crecen con la app: solo se ven los que se pueden conseguir con los destinos curados. Los altos (25, 50) aparecen más adelante, con el aviso «Nuevo escalón».
    - **(21:18, Eric: sí) Los viajes de antes cuentan, solo en los logros de «dónde has estado»:**
      - **Cuentan:** Países, Continentes, Capitales, Microestados, Al otro lado del ecuador y Viajero nacional.
      - **Solo con la app y su foto:** sellos, emblemas, colecciones, maravillas, Patrimonios, Día perfecto, Viaje perfecto, Imparable, El fotógrafo, Madrugador, Nocturno, De sol a sol, Conocedor, Cazador, Coleccionista y los exclusivos.
      - Por eso Países (1, 3, 5, 10, 25, 50) y Capitales (5, 10, 15, 25) salen enteros desde el principio.
      - Pantalla nueva la primera vez: «¿Dónde has estado ya?», marcando en el globo de Tu mundo, con buscador.
  - **(21:27, Eric) «Dos países en un día» se queda con Italia y el Vaticano dibujados:** hoy es el único par posible. Si un día hay otro (Niza y Mónaco, San Marino…), su propia versión; cada viajero ve el de los dos países que visitó.
  - **Las 7 maravillas:** la animación de «Tu primera maravilla» es la plantilla. El dibujo es el de la maravilla conseguida (hoy solo el Coliseo) y el número sale de la cuenta de cada viajero (I, II, III…).
  - **(14-oct, 21:59, Eric) LOS 8 IMPRESCINDIBLES DE ROMA, CAMBIADOS:** Coliseo, Foro Romano y Palatino, Fontana de Trevi, Panteón, Piazza Navona, Plaza de España, Castillo de Sant'Angelo y Trastevere. Fuera el Arco de Constantino y el Altar de la Patria. Los grados del sello, igual (1, 4, 6, 8). Solo cambia la colección; en los datos del motor, el Arco y el Altar siguen en nivel 1. Trastevere es un barrio: la foto, con un radio de todo el barrio.
  - **En los datos no se toca el nivel 1** de los tres sitios del Vaticano: solo cambia la lista de la colección.
    - **Por mirar:** Las 4 joyas y Miguel Ángel llevan los Museos, así que dejan de ser fáciles.
  - **(23:41, idea de Eric) El Vaticano:** Museos Vaticanos, Basílica de San Pedro, Plaza de San Pedro. Al completarla, un sello especial del Vaticano en el pasaporte, porque es otro país (propuesta de Claude, por confirmar). El emblema secreto de la Plaza de San Pedro («Un país nuevo: el más pequeño del mundo») sigue siendo sorpresa.
  - **El avance de las colecciones se suma entre viajes a la misma ciudad** (propuesta de Claude; se da por buena si Eric no dice lo contrario).
  - **Madrugador** (una foto en Trevi o en la Plaza de España antes de las 8:00, según la hora de la foto) **y Roma de noche** (tres fotos de noche) son emblemas secretos de momento, no colecciones.
  - **(23:22) Los nombres:** «Logros» es la caja donde va todo. Dentro hay tres cosas:
    - **emblemas:** secretos; 10 de sitio y 2 de momento;
    - **colecciones:** se ven, con su contador;
    - **el sello:** el premio de la ciudad, con sus grados.
  - **Una sola foto lo reparte todo:** el emblema, el avance de las colecciones y la cuenta del sello.
  - **La pestaña de Logros:** arriba el sello; en medio las colecciones; abajo los emblemas encontrados, con «Quedan emblemas escondidos en Roma».
  - **(23:31) Los imprescindibles de Roma (11) es la colección principal** y va la primera. Su avance es el que sube el sello: con 6, plata; con los 11, oro. Siempre se ve, aunque el viaje sea corto.
  - **El avance se suma entre viajes a la misma ciudad** (propuesta de Claude, por confirmar).
  - **(23:30) Dónde se ven las colecciones** (Eric, 23:31: «me gusta»):
    - antes del viaje: «Con tu ruta puedes completar 4 colecciones»;
    - en la tarjeta de la parada, una etiqueta pequeña y discreta con el nombre de su colección (si está en dos, las dos: «Bernini · Basílicas»);
    - en Logros, con su avance.
    - Los emblemas nunca se ven antes.
  - **Cómo se hace (Code):** las colecciones van en un archivo de datos de Roma. Se comprueban con la lista de paradas que ya calcula el motor, sin tocar el motor.

**Lo de abajo era la versión de antes, con las dos opciones (ya decidido arriba):**

Hay dos versiones que chocan. Hay que elegir una antes de la Tanda 8:

| | Lo de esta noche (Claude) | Lo del 11 y 12 de octubre |
|---|---|---|
| Fotos de la galería | no dan logros | valen si la fecha es de la cámara, hasta 30 días |
| El sello | según el % de sitios con foto | cuatro grados: bronce, plata (6 de 11), oro (11 de 11) y brillante |
| El orden | primero la foto, después la sorpresa | primero la sorpresa al tocar Visto, después la foto |

Además, quedan por decidir:
- la lista de emblemas de Roma;
- las colecciones;
- qué va en la gratis.

## 10. Cuando Code acabe la Tanda 7

- Leer su informe y volver a sacar VIAJES_REVISION.
- Copiar al PC las versiones nuevas de:
  - PENDIENTES_RECOMPENSAS;
  - PENDIENTES_ESCUCHAR;
  - PENDIENTES_6K;
  - este archivo.
- Escribir el prompt de la Tanda 8 con todo lo de arriba. La Tanda 8 no toca el motor, así que solo lleva la batería rápida, sin las 365 fechas.

## 11. Tanda 7b: las mañanas de la vuelta más cortas (14-oct, 22:30)

- Code apuntó las 5 respuestas de Eric (commit 9af2c31). No tocó código.
- Claude escribe a mano las mañanas de vuelta que no cabían (respuesta 1):
  - Sin comida (vuelo de 15:00 a 16:59): las 5 últimas mañanas tienen su lista propia.
  - Con comida (vuelo de 17:00 a 22:59): el Vaticano, la Roma antigua y la Cúpula tienen su lista propia. El Pincio y el Aventino ya cabían y se quedan como están.
  - Con vuelo a las 23:00 o más tarde se sigue usando la mañana entera de siempre.
- Va como tanda pequeña aparte (7b), porque toca el motor: muestra de 60 fechas, push y las 365.
- Los horarios de transporte que faltan van después, en otra tanda o en la 8.

## 12. Las frases antes de un emblema secreto (14-oct, 22:38)

Antes de la animación de un emblema secreto sale una frase corta, y no siempre la misma (al azar, sin repetir la última). Las de Eric: «¡Eh! Aquí hay algo…» y «Pero… ¿qué es esto?». Las 5 propuestas por Claude: «Espera… algo brilla por aquí», «Esto no lo encuentra cualquiera…», «Mira bien… ¿lo ves?», «Shhh… has descubierto un secreto», «¿Y esto quién lo ha escondido aquí?».

## 13. Los nombres de los logros (Eric, 15-oct, 7:25)

Todo está en `NOMBRES_LOGROS.md`. Decidido:
- El sello del Vaticano en plata se llama «Has cruzado la frontera». El oro es «El Vaticano en el corazón» y el diamante, «El Vaticano es tuyo».
- Países: escalones 1, 3, 5, 8, 10, 15, 20, 25 y 30. El 50, todavía no.
- Los logros del tiempo se quedan con los nombres que ya tenían.
- Los nombres en masculino se quedan como están.
- Lo demás nuevo, aceptado.
- Al completar una colección sale su nombre de siempre y, debajo, como línea corta, la frase propuesta («Luz y sombra»…). Igual que en los emblemas secretos.

## 14. La salida y la próxima actualización (Eric, 15-oct, 8:50)

- La app sale dentro de unos 20 días, hacia el 4 de noviembre de 2026. Primero se comprueba que todo funcione.
- **La vuelta al mundo no va en la salida.** Va en la próxima actualización. Code no la programa en la Tanda 8. Design puede dejar el dibujo hecho, marcado como «próxima actualización».
- **La próxima actualización:**
  - abrir la tienda: nuevos emblemas, nuevos destinos y marcos de viajero;
  - añadir la vuelta al mundo, con «Dos vueltas al mundo» y «Hasta la Luna» si Eric lo confirma;
  - rutas de la app para que la gente las haga, por ejemplo la ruta por la Costa Brava (Tossa, Cadaqués).
- Aviso de Claude sobre la tienda: los emblemas se ganan, no se compran (está decidido que lo de pago solo cambia el aspecto y nunca da ventaja). Lo que se vende son destinos nuevos, con sus emblemas para ganar allí, y cosas de aspecto (marcos y estilos).
- Decidido (Eric, 15-oct, 8:51):
  - En la tienda, los emblemas no se compran. Se venden destinos nuevos, que traen sus emblemas para ganarlos allí, y cosas de aspecto.
  - Viajero fundador acaba al cumplir un año desde la salida. La fecha es estimada: si la app sale el 4-nov-2026, acaba el 4-nov-2027. Si cambia la salida, cambia esta fecha.
  - Probador: por decidir.

## 15. El sonido de los momentos (15-oct, 11:08)

- Design no puede meter archivos de sonido en sus diseños: los fabrica con el navegador, y eso solo sirve para enseñar la idea.
- En la app de verdad, Code pone archivos de sonido reales, cortos y ligeros.
- De dónde salen los sonidos (lo decide Eric):
  - generarlos con ElevenLabs, que ya tenemos. Antes hay que confirmar en sus condiciones que el plan permite usarlos en una app comercial;
  - comprarlos en una biblioteca de efectos con licencia comercial;
  - encargarlos a un diseñador de sonido.
- Nada de canciones ni de música con derechos.
- Reglas propuestas por Claude:
  - suena justo al tocar Visto, que es cuando el móvil deja sonar;
  - respeta el modo silencio del móvil;
  - lleva un botón de altavoz en el momento y un ajuste para quitarlo siempre, porque se usa en iglesias y museos;
  - es poco: un sonido por momento, de 1 a 3 segundos.

## 16. El peso de la app (15-oct, 11:37)

- La app es una web: no se instala, así que no hay un «peso» que asuste antes de descargarla. Lo que importa es lo que gasta al abrirla y en el viaje, y que vaya rápida.
- Medido en el repositorio:
  - hay 186 fotos, unos 37 MB en total, a unos 200 KB cada una. Solo se cargan las que se ven;
  - no hay modo sin conexión.
- Reglas de peso para la Tanda 8 (las pide Claude a Code):
  - los logros se dibujan con código (SVG o CSS), no con vídeos ni GIF;
  - las fotos, en WebP y cargadas solo al verlas;
  - los sonidos, cortos (de 1 a 3 segundos) y ligeros;
  - los audios de «Escuchar» se cargan al darle al play, no antes;
  - Code mide cuánto pesa abrir la app la primera vez y lo pone en el informe. La meta, unos 2 MB o menos.
- Más adelante: «Descargar mi viaje» para usarlo sin cobertura (Vaticano, Catacumbas).

## 17. Cómo sale la app (Eric, 15-oct, 11:41)

- **La salida (hacia el 4-nov) es como web.** No va a las tiendas todavía.
- **En la Tanda 8, que se pueda «instalar» desde la web:**
  - con su icono, su nombre y su pantalla de inicio;
  - que se abra a pantalla completa, sin la barra del navegador;
  - con un aviso suave, «Añádela a tu pantalla de inicio», que explica cómo hacerlo en iPhone y en Android. Sale una vez y se puede cerrar.
- **Las apps de App Store y Google Play,** en una actualización posterior, hechas a partir de la misma web. Habrá que tener en cuenta:
  - la comisión: en la UE, para pequeñas empresas, un 15 % dentro de la app o un 10 % con enlace fuera (Apple, desde el 1-oct-2026); en Google, alrededor del 15 %;
  - las cuotas: unos 99 $ al año en Apple y 25 $ una vez en Google;
  - que Apple no la rechace por ser «solo una web».

## 18. El nombre: ROUTY (Eric, 15-oct, 11:42)

- La app se llama **Routy**. Es el nombre que sale debajo del icono.
- Aviso de Claude, tras buscar en la web:
  - ya existe una empresa «Routy», de Malta, de software de rutas para logística y repartos. Usa el dominio routy.app;
  - en la App Store hay un planificador de viajes con IA que se llama «Routly», casi igual y del mismo sector.
- Antes de gastar en marca, Eric mira la marca en EUIPO (la marca europea) y en OEPM (la española), que se consultan gratis, y busca un dominio libre.
- Búsqueda de marcas en TMview, que reúne EUIPO, OEPM y otras oficinas (Claude, 15-oct, 11:55):
  - **ROUTY:**
    - la marca europea ROUTY (EUIPO 011547015, clases 9, 35, 38, 39, 41 y 42) está **vencida**;
    - pero hay **RoutyRide** registrada en EUIPO en 2026 (019317925; clases 9, 35, 39, 41 y 42, que incluyen software y viajes y transporte);
    - y **routyn**, registrada en EUIPO en 2025 (019256867; clase 9, software de planificación).
    - Riesgo medio o alto en nuestras clases.
  - **RUTEA:** no vale. Está registrada en España: RUTEA (OEPM M3506167; clases 9, 39, 41 y 42) y RUTEA TRAVEL (M3590420; clases 39 y 43), las dos del mismo dueño. También RUTEAS (M4004796; clases 35, 39, 41 y 43).
  - **RUTALY:** no sale ninguna marca igual. Lo más parecido es FRUTALY, de comida y bebida, y Perutaly, un restaurante en Chile. Libre en viajes y software.

## 19. Panel de control de logros, versión por destino (15-oct, 12:30)

- Rehecho con los diseños de Design del 15-oct (Logros Modelos): entras en Roma y ves sus sellos (Roma y Vaticano, con su nombre por grado), sus 11 colecciones por grupos, sus 12 emblemas con movimiento y lo que Roma suma fuera. Los logros de viajero van en su pestaña, con los escalones de cada chapa.
- Visto en los diseños nuevos:
  - Design llama a la colección del Vaticano «El país más pequeño del mundo». Lo decidido era «El Vaticano», y además se parece al emblema de la Plaza. Lo decide Eric.
  - Faltan dibujos en Modelos: Los pequeños gigantes, Tres viajes en un año, Alondra, Búho, Diamante a la primera, Tres ciudades de oro y Tres ciudades de diamante.
  - Hay otros que solo tienen el icono pequeño: Continentes, Viajero nacional, Un destino cuatro estaciones, Los 12 meses, Nunca es la última vez, Ciudad al completo y Todos los secretos.
  - Falta comprobar que el emblema de la Plaza de San Pedro tiene los retoques: el óvalo abierto y la frontera discontinua.

## 20. Revisión de «Logros Momentos» (15-oct, 13:30)

- Eric: los sellos del pasaporte van aparte. Los sellos de bronce, plata, oro y diamante salen en la cabecera de Logros de Roma.
- Eric: fuera B1 y B2 (las pantallas del mapa).
- Correcciones pedidas a Design (`MENSAJE_DESIGN_MOMENTOS.md`):
  - el Coliseo suma en 3 colecciones;
  - el ejemplo de una sola colección;
  - el botón [Seguir] del sello;
  - el emblema del Coliseo antes de «Tu primera maravilla»;
  - «sitios del Vaticano», no «imprescindibles»;
  - la página del pasaporte con el nombre del país;
  - el texto de F3;
  - el Madrugador antes de las 8:00, no de las 7:00;
  - los números del resumen de la versión gratis;
  - el orden cuando un Visto da muchas cosas: sello, colecciones, emblema y «Y además…», como mucho 4 pantallas y con [Saltar].
- La colección del Vaticano se llama «El país más pequeño del mundo» (Eric, 15-oct, 13:31). «El Vaticano» es el nombre del sello.
- Aviso de Claude: el emblema de la Plaza se llama «Un país nuevo: el más pequeño del mundo» y casi repite el nombre de la colección. Decidido (Eric, 13:32): el emblema se llama «La frontera que no se ve».

## 21. El botón flotante de los logros del destino (Eric, 15-oct, 13:53)

- Sale desde que se crea la ruta, solo en las pantallas de ese viaje (RUTA, DÍAS y HOY) y solo con lo de su destino. Los logros de viajero van en el Perfil.
- **Antes del viaje:** discreto. Todo en gris, «por conseguir». Dice qué colecciones puede completar con su ruta y qué le falta, con [Añadir a mi ruta] («Te falta el Janículo para Los miradores»).
- **Durante el viaje:** protagonista en HOY y DÍAS. Se llena en directo y lleva un puntito cuando hay algo nuevo.
- **Después del viaje:** queda lo conseguido y lo que falta («Te quedan 2 para el diamante»).
- **Los emblemas ocultos llevan número** (cambia lo del brief, que no lo daba): «Roma esconde 12 secretos» y luego «3 de 12 secretos encontrados». Nunca se dice cuáles ni dónde.

## 22. Iconos (Eric, 15-oct, 13:59)

- Se cambian tres:
  - la insignia de «Plazas y fuentes de Roma» pasa a ser la Barcaccia;
  - el emblema del Foro pasa a ser el Miliario de Oro;
  - la insignia de «El alma de Trastevere» pasa a ser la ropa tendida entre dos ventanas con hiedra.
- Se quedan como están: el emblema del Coliseo (a Eric le gusta así) y el de la Plaza de San Pedro.
- 14:09 Eric: el botón flotante también sirve para que el viajero vea lo que le falta y se haga su propia ruta si quiere. Mensaje a Design: `MENSAJE_DESIGN_BOTON_FLOTANTE.md`.

## 23. Lo que se ve al tocar el botón flotante (Eric, 15-oct, 14:54)

- Las 11 colecciones van seguidas, sin títulos de grupo, con las más importantes arriba.
- Fuera «Te falta…» y [Añadir a mi ruta]. Solo la etiqueta «En tu ruta»; las demás, con su contador.
- Cada insignia sale con su forma real y sus pedazos. Los pedazos se colorean al ver cada sitio, y cada pedazo es siempre su sitio.
- En la lista no hay animación: solo en el momento de conseguir un pedazo o completar la insignia.
- Al tocar una colección: se queda 3b y se pide otro prototipo, con una pantalla propia de la colección y sus sitios.
- Emblemas:
  - los que faltan, en silueta con «?»;
  - los encontrados, con su animación de emblema en bucle;
  - al tocar uno, se repite la escena de cuando lo encontró.
- Aviso para Code (Tanda 8): repetir la escena al tocar un emblema no puede hacer lenta la app. Va dibujada con código, sin vídeo, y se carga solo al tocarla.
- Mensaje: `MENSAJE_DESIGN_BOTON_DENTRO.md`.
- 15:06 Eric:
  - las colecciones completas suben al principio de la lista;
  - al conseguir algo, su dibujo vuela a donde se guarda: lo del destino, al botón flotante, y lo de viajero, al perfil (destino propuesto por Claude);
  - Design dibuja cómo vuela y Code lo programa en la Tanda 8.
- 15:15 Eric: el puntito del botón flotante solo sale si no se vio la animación (se saltó o es la versión gratis). Si la vio, el dibujo vuela, el botón late y no hay puntito.
- 15:19 Eric: en la lista salen primero las colecciones de su ruta. Orden: «Lo nuevo de hoy», las completas, las de su ruta y las demás.
- 15:24 Eric: para la colección abierta se queda la 5A de Design, la pantalla propia de la colección. La 3B, la lista que se abre debajo, queda descartada.
- Pendiente: decidir dónde van y cómo se ven los logros de viajero (el Perfil).

## 24. Cuentas de usuario antes de la salida (Eric, 15-oct, 15:31)

- La app sale con cuentas y con inicio de sesión. Los logros se guardan en la cuenta.
- Decidido (Eric, 16:17):
  - se entra con el email y un enlace mágico, o con Google; Apple, cuando vayamos a las tiendas;
  - la cuenta se pide al empezar, como en todas las apps;
  - se hace al final, en su propia tanda, antes de la salida.
- Fotos: Claude recomienda la nube, con estas condiciones:
  - comprimidas a unos 300 KB cada una;
  - sin la ubicación del archivo (se quita al subirla);
  - privadas, solo para su dueño;
  - que se borren al borrar la cuenta;
  - con [Guardar en mi galería].
  - Motivo: en una web, lo guardado en el móvil se puede perder (el iPhone borra los datos de las webs que no se usan en 7 días si no están en la pantalla de inicio).
  - Decidido: sí (Eric, 16:24).
- Avisos de Claude:
  - es una tanda grande; mejor que vaya aparte de la Tanda 8;
  - hace falta la política de privacidad (RGPD) y poder borrar la cuenta;
  - Viajero fundador y Probador dependen de las cuentas.

## 25. Repaso de antes y durante el viaje (Eric, 15-oct, 16:32)

- **La primera vez:** una sola pantalla que explica cómo funcionan los logros. La diseña Design.
- **Permisos de cámara y ubicación:** se piden la primera vez que da a Visto, con una línea nuestra antes.
- **Sin cobertura:** se guardan la foto y el Visto, y las sorpresas salen al volver la señal.
- **Resumen:** sí, en la de pago también. Propuesta de Claude:
  - resumen de cada día al acabar el día;
  - resumen del viaje al día siguiente del vuelo de vuelta, con aviso en el móvil (o por email si no hay permiso de avisos) y con imagen para compartir.
- **Viajar en grupo:** cada uno con su cuenta y sus logros. Idea de Eric: descuento si pagan juntos (pareja o amigos) → para cuando se hagan los precios.
- **Volver a Roma:** se mantiene todo y sale «Nunca es la última vez».
- **Por aclarar con Eric:** la ficha del sitio («suma en…»), el deshacer de un Visto (resuelto abajo), compartir los logros y el plazo de las fotos de la galería (pide la fecha del día de la visita).
- 16:51 Eric y Claude:
  - **La ficha del sitio:** en la pestaña LOGROS (junto a TIPS) salen las colecciones en las que suma el sitio, con el formato de la 5A pero con el icono de la colección en vez de la foto. Nunca dice si hay emblema.
  - **Visto sin querer** (Eric, 17:07; queda así):
    - al tocar Visto sale «Foro marcado como visto · [Deshacer]» durante **5 segundos**;
    - después sale la tarjeta de las fotos de Design («Guarda un recuerdo de…» o «LOGRO POR DESCUBRIR · Sube una foto en… y descubre lo que has conseguido»). El pedazo o el emblema llegan **al subir la foto**, no al tocar Visto;
    - para volver atrás desde la tarjeta: abajo del todo, un enlace pequeño y discreto «¿No estás aquí? Desmarcar visto». La parada vuelve a «por ver» y no se pierde nada;
    - si cierra la tarjeta sin foto, la parada sigue vista y en ella queda «Te espera una sorpresa: sube tu foto» (o «Guarda un recuerdo»). Mientras no haya foto, se puede desmarcar desde el menú «···» de la parada;
    - con la foto subida, el logro queda ganado y ya no se deshace;
    - si la foto es de otro sitio o de otro día, no gana nada: «Esta foto no es de la Basílica de San Pedro. Te espera allí.»
  - **Resumen del viaje** (al día siguiente del vuelo de vuelta), con dos textos:
    - si completó al menos 3 colecciones y encontró al menos 2 secretos: «¡Wow! Tu viaje a Roma fue increíble. Echa un vistazo a todo lo que conseguiste.»;
    - si no, uno con esperanza: «Roma se ha quedado con ganas de verte otra vez: aún esconde {n} secretos. Echa un vistazo a lo que conseguiste.»
  - **Galería por fechas:** una web no puede filtrar la galería del móvil. Antes de abrirla sale «Elige una foto del 10 al 14 de octubre», y si la foto no vale: «Esta foto es del 2 de septiembre. Elige una del 10 al 14 de octubre.». (Quitado, Eric 17:10: lo de poner arriba las fotos de la app que aún no se usaron. Con la cámara de la app, una foto da el logro y la cámara se cierra; la galería es solo para las fotos hechas con la cámara normal del móvil.) Filtrar de verdad, cuando haya apps en las tiendas. Depende de la prueba de la fecha en iPhone y Android, que sigue pendiente.
- 17:14 **Las fotos en la versión gratis: POR DECIDIR.** A Eric no le convence hacer la foto desde la ficha del monumento. Opciones que ha dado Claude:
  - A: la foto desde la tarjeta de la parada en DÍAS (el mismo gesto que en la de pago), y las sorpresas por la noche en «¡Has completado el día!»;
  - B: sin fotos durante el día; por la noche, en «¡Has completado el día!», elige de la galería una foto de cada sitio visto;
  - C (la que recomienda Claude): A, y por la noche se pueden añadir de la galería las que falten.
  - Ojo: con la galería solo se puede comprobar el día de la foto, no siempre el sitio.
- 17:18 **Idea de Eric (por confirmar): la app es gratis para crear la ruta; para usarla durante el viaje (HOY y los logros) se paga, unos 4,99 o 6,99 €.** Si se confirma, se acaba el problema de las fotos en la gratis y cambia «ganar es gratis para todos» (apartado 9). Las condiciones que propone Claude:
  - la ruta, DÍAS, el mapa y las fichas siguen gratis siempre, también en el viaje;
  - se queda el día de prueba de HOY, con los logros incluidos;
  - lo ganado en el día de prueba no se pierde nunca: se guarda y sigue si paga;
  - el precio se decide con los demás precios (con el descuento de grupo).
  - Si se confirma, cambiar: el momento I de Design (la versión gratis), la regla del puntito en la gratis y la Tanda 8.
- 17:26 Eric: de acuerdo con las 3 condiciones; se paga por viaje, no al mes. Propuesta de Claude (por confirmar):
  - **Un solo pago por viaje, «el pase del viaje»,** que lo abre todo: antes del viaje (la ruta ajustada a la llegada y a la vuelta, el alojamiento) y durante (HOY y los logros). Se puede comprar en cualquier momento, desde que se crea la ruta hasta el final del viaje.
  - **El momento de venderlo antes del viaje:** al poner el vuelo. Una tarjeta (sin candados): «Tu vuelo llega a las 14:20. Con el pase del viaje, tu primer día se ajusta solo.»
  - **El día de prueba, separado de lo de antes del viaje:** solo HOY y los logros en un día normal. Las llegadas y las vueltas no entran (si no, se regala lo que vende antes del viaje). Quien ya pagó antes del viaje no necesita la prueba.
  - **Un viaje = un destino con sus fechas.** Si cambia las fechas, el pase sigue. Si vuelve otro año, es otro viaje.
  - **Ojo:** el cobro no está en ninguna tanda todavía. Hay que decidir si va en la tanda de las cuentas (antes de la salida) o si se sale con todo abierto y el cobro llega después.
- 17:33 **DECIDIDO (Eric):** el pase del viaje, como arriba. El día de prueba gratis es solo cuando empieza el viaje (HOY y los logros), nada de lo de antes del viaje. El cobro va en la tanda de las cuentas; si no llega a tiempo, sale en 2027, sin prisa (mientras tanto, todo abierto).
- 17:37 Preguntas de Eric. Propuestas de Claude (por confirmar):
  - **El día de prueba es el primer día entero del viaje, no el de llegada.** El día de llegada, sin pase, la ruta no está ajustada al vuelo y la prueba saldría mal. Ese día solo sale la tarjeta «¿Acabas de llegar? Con el pase, tu primer día se ajusta a tu vuelo». Si el viaje es de 1 día, la prueba es ese día.
  - **Antes del viaje, una demostración de HOY** («Así será tu día en Roma»): un día de ejemplo para mirar, sin Visto ni logros.
  - **Una prueba por cuenta,** en el primer viaje. En el segundo viaje ya sabe lo que es.
  - **El pase no se agota ni caduca:** no es una entrada con plazas, va unido a ese viaje. Se puede comprar hoy para diciembre.
  - **Cambiar las fechas:** se puede hasta que empieza el viaje. Después, ya no, para que un pase no sirva para todos los viajes del año.
  - **Dos viajes con fechas separadas** (Florencia del 27 al 30 de octubre y Roma del 10 al 13 de diciembre) = dos viajes = dos pases. HOY enseña siempre el viaje de las fechas de hoy.
  - **Varios destinos seguidos,** sin volver a casa (Roma del 10 al 13 y Florencia del 13 al 16) = un viaje = un pase. Que lo confirme Eric al poner los precios.
  - Idea opcional: un descuento al comprar dos pases, como el de grupo.
- 17:41 Eric está de acuerdo, con dos dudas. Propuestas de Claude:
  - **«¿Y mis logros de ayer?»** Todo el viaje cuenta, compre cuando compre: valen las fotos de la galería hechas en las fechas del viaje (la regla 2A). Al empezar la prueba o al comprar el pase, sale una tarjeta: «Lo de ayer también cuenta. Ayer tenías en tu ruta: Fontana de Trevi, Panteón… Sube tus fotos y descubre lo que ganaste.» Las sorpresas salen ahí. Depende de la prueba de la fecha en iPhone y Android; con la galería no siempre se puede comprobar el sitio.
  - 17:43 **DECIDIDO (Eric: «ESTO NECESITAMOS SI!!»):** la tarjeta «Lo de ayer también cuenta». Va a Design y a la Tanda 8.
  - 17:43 **Hacer más difícil la trampa con fotos de la galería** (propuesta de Claude, por confirmar). Capas, de la más fácil a la más cara:
    1. Que sea una foto de cámara: las capturas de pantalla y las fotos bajadas de internet no tienen los datos de la cámara. No valen.
    2. Que la hora encaje: una foto anterior a la hora de aterrizar no vale. Tampoco dos sitios lejanos con pocos minutos entre las fotos.
    3. Si la foto lleva ubicación, tiene que ser en el sitio. Si dice que es de otro sitio, no vale.
    4. Si no lleva ubicación, la app mira la foto y comprueba si sale el sitio (la Fontana, el Panteón…). Solo se rechaza si está claro que es otro sitio; si hay dudas (un interior, una foto oscura), vale. Esto cuesta un poco por foto: dejarlo para cuando haga falta.
    - 17:47 **DECIDIDO (Eric):** la capa 1 sí. La capa 2 (la hora) fuera: basta con que sea una foto de cámara y con fecha del viaje (vale también la de un amigo del grupo). La capa 3 sí. La capa 4, más adelante, y automática: la app mira la foto, nunca una persona (las fotos son privadas).
    - La prueba pendiente en iPhone y Android se amplía: qué datos llegan al subir la foto desde la web (la fecha, la ubicación y la cámara).
    - Ojo: si los logros acaban dando descuentos, la trampa importa más.
  - 17:48 **Idea de Eric para la tienda (próxima actualización):** regalar a un amigo un logro que tú tienes, por 0,99 €. Aviso de Claude: choca con «los emblemas no se compran» (el amigo no ha estado allí). Alternativas que propone Claude:
    - regalar la postal del logro: «Laura encontró "Volverás a Roma" en la Fontana de Trevi», con su foto. Al amigo le queda en «Regalos de amigos», no en sus logros;
    - regalar una pista de un emblema secreto a un amigo que va a ir: «Laura te ha dejado una pista en Roma». Tiene que ir él a ganarlo;
    - regalar el pase del viaje a un amigo.
    - Por definir: qué son los EXP (los puntos para la tienda) y cómo se ganan.
    - 17:49 **Eric elige la 2 (la pista) y la 3 (regalar el pase).** Los logros no se compran ni se regalan.
  - 18:19 **Idea de Eric: el pase por destino, no por viaje** («el pase de Roma», para siempre). Análisis de Claude (recomienda el pase por destino; por decidir):
    - **A favor:** es más sencillo (sin bloquear fechas, sin discutir qué es un viaje, sin trampas moviendo fechas); encaja con los logros, que son de Roma y para siempre («Roma es tuya»); quien vuelve no paga otra vez para acabar sus logros; casi nadie vuelve el mismo año, así que se gana casi lo mismo.
    - **En contra:** quien vuelve a Roma no paga otra vez (pocos casos); un viaje con varias ciudades son varios pases (más adelante, un paquete «Italia»).
    - **La trampa de cambiar Roma por Islandia:** el pase va unido a la cuenta y al destino que se compró, no a la ruta. Borrar Roma o añadir Islandia no mueve el pase: Islandia pide su propio pase. Si alguien se equivoca de destino, se cambia por email antes de usarlo.
    - **La llegada y la vuelta:** se configuran en cada viaje a Roma, las veces que haga falta. No hay problema.
    - **Volver a Roma (para la próxima actualización):** una ruta de «segundo viaje» que pone delante lo que no vio y los logros que le faltan; sus días escritos no se repiten. Mientras tanto, los mismos días con lo ya visto marcado ✓.
    - **El día de prueba:** uno por destino y cuenta, en el primer viaje a ese destino.
    - 18:30 **Eric acepta el pase por destino, salvo el punto 3:** no se escriben días nuevos para un segundo viaje. En el segundo viaje, el viajero elige: la ruta de siempre (lo ya visto, marcado ✓) o crear sus días desde cero con el mapa y [Añadir parada].
    - 18:30 **Idea de Eric: los viajes siguientes al mismo destino pagan algo simbólico (sobre 1,50 €)** por ajustar los vuelos (el primer y el último día) y el alojamiento. HOY, los logros y las historias siguen incluidos. Opinión de Claude: bien, con condiciones:
      - decirlo claro al comprar: «El pase de Roma es tuyo, sin caducidad. Cada viaje nuevo a Roma con tus vuelos: 1,49 €.» Si no, parece una trampa;
      - quien no lo paga tiene sus días normales (sin ajustar al vuelo), con HOY y los logros;
      - no hacerlo para la salida: casi nadie repetirá el primer año. Mejor hacerlo cuando haga falta (2027);
      - en los pagos pequeños, el cobro se queda una parte mayor de lo que pagan;
      - mejor «sin caducidad» que «para siempre» en los textos.
  - 18:49 **DECIDIDO (Eric): el pase por destino.** Volver a Roma: si el viaje nuevo empieza en los 30 días siguientes al último día del viaje anterior, ajustar los vuelos no cuesta nada; si es más tarde, 1,49 €.
  - 18:49 **Idea de Eric: comprar varios pases con descuento, con usos.** Quien compra elige cuántas personas (usos) y comparte el acceso con un código. Si son amigos y prefieren pagar por separado, también se puede. Más de 5 usos: unos 3,99 o 4,99 € por pase. Propuesta de Claude (por decidir):
    - **Mejor un precio de paquete con nombre que «el segundo al 40 %»:** «Pase Dúo · 2 personas · 10,99 €», tachando los 13,98 € y diciendo «el segundo, casi a mitad de precio». Con precios por debajo de 100 €, el porcentaje parece más grande que los euros.
    - **Escalones:** 1 persona, 6,99 €; Dúo, 10,99 € (5,50 € cada uno); de 3 a 4, 4,99 € cada uno; de 5 en adelante, 3,99 € cada uno, con un máximo de usos (por ejemplo 10) para que no se revendan códigos.
    - **Compartir:** un enlace, y el código de reserva por si acaso: «Únete a mi pase de Roma». Cada uno con su cuenta y sus logros. Quien compra ve «1 de 2 usados».
    - **Pagar por separado sin perder el descuento:** quien abre el grupo paga lo suyo y manda el enlace; cada amigo paga su parte con el precio del grupo.
    - El código sirve solo para ese destino.
  - 19:02 **DECIDIDO (Eric): los precios y el Pase Dúo, como arriba** (1 persona, 6,99 €; Dúo, 10,99 €; de 3 a 4, 4,99 € cada uno; de 5 en adelante, 3,99 € cada uno, con un máximo de usos; se comparte con enlace o código; se puede pagar por separado con el precio del grupo). Con los multidestinos llegará un pase multidestino.
  - 19:02 **Duda de Eric: dos viajes a Roma creados** (por ejemplo, porque se equivocó y creó otro). Propuesta de Claude (por decidir):
    - **El pase no se paga dos veces:** es de la cuenta y de Roma, no de cada viaje. Todos sus viajes a Roma lo tienen.
    - **Los logros, las fotos y lo visto son de la cuenta,** no del viaje. Borrar un viaje no borra nada de eso.
    - **Para que no haga falta crear otro viaje:** la varita que ya existe (ver 19:07).
    - **Si aun así crea otro viaje a Roma con fechas que se pisan:** «Ya tienes un viaje a Roma del 10 al 13 de diciembre. ¿Quieres que este nuevo lo sustituya?» con [Sustituir el anterior] y [Cambiar las fechas]. Nunca dos viajes al mismo destino en los mismos días, así HOY siempre sabe cuál enseñar.
    - **Con fechas distintas que no se pisan,** son dos viajes normales y los dos tienen el pase.
    - **El día de prueba no se repite** al crear otro viaje: es uno por destino y cuenta.
    - 19:07 Eric:
      - **Los 30 días se cuentan desde el último día del viaje anterior** (cuando acaba el viaje, no cuando se crea la ruta).
      - **Viajes que se pisan** (17-19 y 16-20 de octubre): no son dos viajes. Sale el aviso de sustituir y queda uno solo. Los 30 días se cuentan desde el último día del viaje que queda y se hace de verdad.
      - **Regla nueva (Claude):** antes del viaje, las fechas se cambian sin límite. Un viaje que ya acabó no se puede mover a otras fechas (así nadie mueve un viaje viejo para no pagar los 1,49 €).
      - **[Volver a mi ruta original] ya existe:** es la varita de RUTA («Recuperar mi ruta», que mantiene las reservas) y la de cada día («Recuperar este día»). Basta con eso; no hace falta nada nuevo. Los logros no se tocan, porque son de la cuenta.
      - **DECIDIDO: un mini tutorial la primera vez** (lo diseña Design): para qué sirve cada pestaña, la varita (para quien se equivoca), el menú «···» de las paradas y el botón flotante de los logros. Propuesta de Claude: 3 o 4 pantallas como mucho, con [Saltar] y «Ver otra vez» en el Perfil; y además un consejo pequeño la primera vez que pasa algo (al quitar la primera parada: «Si te equivocas, la varita lo deja como estaba»). La pantalla de los logros sigue aparte, al empezar el viaje.
      - 23:11 **DECIDIDO (Eric), para probar: «Mi vitrina»**, la vitrina de museo con todos los logros (balda de honor con las maravillas y los exclusivos, Mis sellos como pasaporte, una balda por destino, baldas del viajero por grupos). Se entra desde el Perfil y desde el botón flotante. Prompt en MENSAJE_DESIGN_VITRINA.md. Resuelve «dónde van los logros de viajero».
      - 23:51 **Eric cambia la vitrina:**
        1. Se separan los sellos del pasaporte (uno por país, al entrar: Italia, Ciudad del Vaticano) de los sellos coleccionables (los de ciudad, por grados: Roma oro, Vaticano plata).
        2. Los sellos coleccionables, sin fondo: solo su figura.
        3. En la vitrina solo sale lo conseguido: colecciones completadas, emblemas encontrados, chapas ganadas. Nada a medias ni «?».
        4. Un espacio por país y destino, como el pasaporte, con absolutamente todo de ese destino: lo conseguido arriba y lo que falta debajo.
        - Propuesta de Claude: «Mi pasaporte» = una página por país con su sello de entrada y la fecha; dentro, la página de cada destino de ese país (Roma) con todo, conseguido arriba y lo que falta debajo. Es lo mismo que se abre desde el botón flotante (una sola pantalla para los dos sitios). Lo del Vaticano va dentro de la página de Roma (se visita en el viaje a Roma); la página del país Ciudad del Vaticano lleva su sello de entrada y enlaza a Roma.
      - 23:55 **Eric afina:**
        - En la vitrina, las colecciones completadas van sin nombre; al tocarlas, se repite su animación de completada y ahí sale cuál es y dónde se consiguió.
        - Mi pasaporte: solo los sellos de entrada conseguidos, por país.
        - Hace falta «Mis destinos» (los destinos visitados): cada destino con TODO (los sellos, todas las colecciones, todos los emblemas), lo que está en la vitrina, lo que no y lo que está a medias.
        - Pregunta de Eric: ¿vitrina infinita o limitada, y que el viajero elija con «Llevar a mi vitrina»? Propuesta de Claude: limitada y a su gusto. La balda de honor es fija (maravillas y exclusivos); debajo, 12 huecos (3 baldas de 4) que se llenan solos al principio con lo último ganado; el viajero los cambia con [Llevar a mi vitrina] en cada pieza (si está llena, elige cuál quitar). Todo lo ganado sigue en Mis destinos. Idea para la tienda: una balda más (es aspecto, no ventaja).
      - 08:49 (16-oct) **Reorganizar el proyecto de Design en dos partes** (Eric). Parte 1, los logros: Logros · Modelos, Logros · Momentos, Logros · Cine, Logros · Pantallas, más Índice y Archivo (MENSAJE_DESIGN_REORGANIZAR_PARTE1.md). Parte 2, la app: Ruta y días, Llegada/reservas/presupuesto, HOY, Ficha y Explorar. La versión buena de Trazo App es «Piscina». En la parte 2 hay que preguntar cuál es la buena de Explorar.
      - 07:21 (16-oct) **DECIDIDO (Eric): la vitrina con baldas temáticas y sin nombres**, y «Todos mis logros» dentro de la misma pantalla, como segunda pestaña (sustituye a Mis destinos). Baldas: logros de viajero, sellos de ciudad, colecciones completadas y emblemas secretos (4 huecos cada una), debajo del pedestal y los exclusivos. Elegir título con [Usar como mi título]. En el Perfil, tres accesos: Mi vitrina, Mi pasaporte y Mis viajes. Prompt en MENSAJE_DESIGN_VITRINA_2.md.
      - 00:07 (16-oct) **La medalla de las 7 maravillas, hecha con la imagen de Eric** (es suya, hecha por él). Design no llegaba a ese nivel dibujando con código. Claude la ha partido en capas: una base con las 7 apagadas (en azul plateado) y una capa dorada por maravilla; la app enciende solo las que ha visto, y las estrellas de fuera (estilo nuestro) se encienden por cuántas lleva, del centro hacia los lados. Archivos en outputs/medalla_maravillas/ (base, oro_*, layout.json con las estrellas). Página de prueba publicada. Es la excepción a «todo dibujado con código» (unos 200 KB en total).
      - 23:59 **DECIDIDO (Eric), la vitrina queda así, de arriba abajo:**
        1. Lo más alto: el pedestal de las maravillas, solo si tiene alguna (la medalla de las 7 maravillas y, a su lado, los emblemas de maravilla que tenga, como el Coliseo; lectura de Claude). Si no tiene ninguna, no sale.
        2. La balda holográfica: todos los exclusivos, sin límite.
        3. Tres baldas de 4 huecos: el viajero decide qué va y en qué hueco.
        - Mis destinos: cada destino con su resumen bonito («Roma · 7 de 11 colecciones · 5 de 12 secretos · sello de oro»).
      - 20:16 **DECIDIDO (Eric): el emblema del Coliseo («Una maravilla del mundo")** con la misma tarjeta que los demás emblemas secretos, pero más espectacular y acabado con fuegos artificiales. Detalle en MENSAJE_DESIGN_GRATIS_FUERA_Y_NUEVOS.md. Los fuegos, solo para las maravillas del mundo (también en los destinos futuros).
      - 19:16 **FUERA (Eric): los consejos de la primera vez.** Nada de burbujas: si se equivoca, que use la varita (se explica en el mini tutorial).
      - 19:16 **Dos viajes a Roma con fechas que se pisan porque aún no sabe cuáles son** (16-19 y 16-20), con el pase ya pagado. Cambia lo de «nunca dos viajes en los mismos días». Propuesta de Claude:
        - al crear el segundo sale: «Ya tienes un viaje a Roma del 16 al 19 de octubre.» El botón grande es [Cambiar las fechas de ese viaje] (lo normal, Eric 19:18); debajo, pequeños, [Guardar los dos de momento] y [Sustituir el anterior];
        - la pregunta solo sale si es el mismo destino y las fechas se pisan. Con otro destino (Londres) o con fechas que no se pisan, no sale nada;
        - los dos tienen el pase y no se paga nada más;
        - **DECIDIDO (Eric, 19:19): el aviso de los 10 días.** Si tiene dos viajes al mismo destino que se pisan y el pase comprado, 10 días antes sale: «En 10 días empieza tu viaje a Roma. Tu pase de Roma está activo para el viaje del 16 al 19 de octubre. Si quieres cambiarlo, ahora es el momento.» con [Es este] y [Cambiar al del 16 al 20]. Va como aviso en el móvil (o por email si no hay permiso de avisos) y como tarjeta en la app. Si el viaje se crea a menos de 10 días, sale enseguida. Propuesta de Claude: el viaje «activo» es el último que tocó; si contesta al aviso, ya no hace falta la pregunta del primer día;
        - si no contestó al aviso, el primer día (el 16), HOY pregunta una vez: «Tienes dos viajes a Roma. ¿Cuál haces?». El elegido sigue; el otro pasa a «Viajes guardados», sin borrarse;
        - los 30 días se cuentan desde el último día del viaje elegido. Los logros son de la cuenta y no dependen de cuál elija.
        - Consejo para el tutorial: las fechas de un viaje se cambian siempre gratis antes de irse, así casi nadie necesitará dos viajes.
      - 19:11 (descartado a las 19:16) **Los consejos de la primera vez** (propuesta de Claude): una burbuja pequeña que señala el botón, sale una sola vez en la vida de la cuenta y se cierra con [Entendido] o tocando fuera. Nunca dos a la vez. Los primeros:
        - al quitar o mover su primera parada → señala la varita: «¿Te has equivocado? Con la varita, tu día vuelve a estar como te lo preparamos.»;
        - la primera vez que sale el botón flotante → «Aquí se guardan tus logros de Roma.»;
        - la primera vez que abre una ficha → señala la pestaña LOGROS;
        - la primera vez que entra en RESERVAS → «Pon tu vuelo y tu primer día se ajusta solo.»
      - 19:11 Ejemplo: Roma del 17 al 19 de octubre y otra vez del 1 al 5 de enero. Pasan más de 30 días: el pase sigue (HOY, logros, historias) y ajustar los vuelos del viaje de enero cuesta 1,49 €. Si no lo paga, días normales sin ajustar al vuelo. Para la ruta, elige la de siempre (lo visto, con ✓) o desde cero.
      - **El día de prueba que no se repite** no se explica antes: solo sale si llega al viaje sin pase y ya lo usó: «Tu día de prueba en Roma ya lo usaste el 17 de octubre. Con el pase de Roma, sigue con HOY.»
  - 17:49 **El precio del pase** (propuesta de Claude, por decidir): 6,99 € por viaje, el mismo precio que la Guía Completa en PDF; 4,99 € para los viajeros fundadores durante el primer año. Un solo precio, dure lo que dure el viaje. Precios mirados el 15-oct: la guía de Roma de GPSmyCity, 4,99 $ (pago único); un audiotour de VoiceMap en Roma, 11,99 $; Wanderlog Pro, 39,99 $ al año.
  - **Las fechas se bloquean cuando llega el primer día del viaje** (o cuando se usa HOY por primera vez, si es antes). No solo al usar HOY: si no, quien no usa HOY podría mover el pase a otro viaje. Si hay un problema de verdad (un vuelo cancelado), se arregla a mano por email.

## 26. La frase de suspense, solo al descubrir (Eric, 16-oct, 10:26)

- La frase de antes de un emblema secreto («¡Eh! Aquí hay algo…», «Pero… ¿qué es esto?»…) y su espera solo salen **la primera vez, al descubrirlo**.
- Después, al verlo guardado (botón flotante, «Todos mis logros», «3 de 12 secretos encontrados», la vitrina, la ficha con [Volver a ver]), sale **solo la animación del emblema**, sin la frase ni el suspense.
- Ya se lo ha dicho Eric a Design. Para Code, en la tanda de los momentos de los logros.
- En la película del Coliseo, «Casi 2.000 años esperándote…» **se queda** también al volver a verla: es el principio de la película, no una frase de suspense (Eric, 10:37). Lo que se salta es solo la frase al azar de antes («¡Eh! Aquí hay algo…»).

## 27. Recomendar cambios en un viaje compartido (Eric, 16-oct, 12:13)

- Quien crea el viaje es el **único administrador**. Los invitados (por ejemplo, la pareja que entra con el Pase Dúo) **recomiendan**, no cambian.
- Un invitado puede mandar:
  - un cambio suelto (quitar, añadir o mover una parada…);
  - un día entero nuevo;
  - la ruta entera nueva.
- El administrador ve cada recomendación y la **acepta o no**. Hasta que la acepta, su ruta no cambia.
- Ideas de Claude para cuando se diseñe:
  - el invitado ve la misma ruta, con un botón [Recomendar un cambio] en vez de los de editar;
  - el administrador recibe un aviso («Laura te recomienda un cambio en el día 2») y ve el antes y el después antes de decidir: [Aceptar] o [No, gracias];
  - si acepta y luego se arrepiente, la varita («Recuperar este día» / «Recuperar mi ruta») sigue funcionando;
  - cada uno marca su propio Visto y gana sus propios logros, aunque la ruta sea la misma.
- Va en la **primera versión** (Eric, 12:18). Necesita las cuentas: se programa con ellas o justo después.

## 28. El pasaporte enseña también lo que se puede conseguir (Eric, 16-oct, 17:01)

- **Cambia la regla del repaso del 16-oct (punto 4: «solo salen los sellos conseguidos»).**
- En la lista de países del pasaporte salen **todos los países donde la app tiene un sello que conseguir**, aunque el viajero no haya ido nunca. Ejemplo: si metemos Cancún, a todos les sale México, con el sello de Cancún en gris, «Por conseguir».
- Propuesta de Claude, para Design:
  - la lista, en dos partes: primero «Tus países» (los visitados) y debajo «Por descubrir» (los que solo tienen sellos por conseguir);
  - en el mapa, esos países sin pintar, con su marcador en gris;
  - «6 países · 9 ciudades · 41 días viajando» cuenta solo lo visitado;
  - al tocar un sello en gris: «Cancún ya está en la app» y [Crear viaje];
  - la etiqueta «Nuevo» se queda solo para los destinos que acabamos de añadir.

## 29. Cómo se gana cada cosa al tocar Visto (Eric, 16-oct, 17:28)

- **Cambia lo del 15-oct** («el pedazo o el emblema salen al subir la foto»): ahora el pedazo de colección no siempre pide foto.
- **Pedazo de colección (ej. Plaza Navona en «Los imprescindibles»):**
  - con ubicación y cerca del sitio: se gana al tocar Visto, sin foto. La foto es opcional, solo para el álbum;
  - sin ubicación (no dio permiso o no hay señal): se le dice claro «Activa tu ubicación o haz una foto para ganar tu pedazo», con [Activar ubicación] y [Hacer foto]. Con la foto del día, gana el pedazo;
  - si la ubicación dice que está lejos: Visto se marca para su ruta, pero el pedazo no: «Parece que no estás en Plaza Navona. Tu pedazo te espera allí.»
- **Emblema Oculto:** siempre con foto. Tarjeta oscura «¡Aquí se esconde un Emblema Oculto!» · «Sube una foto en la Basílica de San Pedro y descúbrelo».
- Visto solo da logros en los días del viaje.
- Sorpresas seguidas: sin límite de pantallas; tocar = siguiente; [Saltar todo] = al final. Al final, siempre el resumen del día (el mismo que al acabar la ruta).
- Foto de otro sitio: «Esta foto no es de la Fontana de Trevi.» + [Elegir otra foto].
- **Plazo para reclamar (Eric, 17:34; regla nueva):** 30 días desde el último día del viaje para subir las fotos que faltan; después se pierde. Lo pendiente sale en la parada, el resumen del día, el resumen del viaje y Mis viajes (con cuenta atrás: «Te quedan 10 días para reclamar tu premio»). Aviso en el móvil 3 días antes (o email). Desde casa, solo con foto de la galería de esas fechas y ese sitio.

## 30. «Por qué te lo recomendamos»: aprobados (Eric, 16-oct, 23:34)
- Los 95 textos de POR_QUE_RECOMENDAMOS_ROMA.md, aprobados todos, con sus datos (los 50.000 del Coliseo, Van Gogh, Klimt y Monet en la GNAM, Fellini en Via Margutta).
- «Plaza Colonna» y «Piazza Colonna»: si en los datos son el mismo sitio dos veces, se queda uno solo (el que sale en las rutas) con el texto de «Plaza Colonna», y el otro nombre pasa a alias.
- Va como tanda pequeña aparte, sin esperar a la Tanda 8.

## 31. Los países de antes de la app (Eric, 16-oct, 23:45)
- De momento, opción B: los países marcados en «¿Dónde has estado ya?» o los viajes añadidos a mano solo pintan el globo y los números («12 países · 41 días viajando»). No dan logros de viajero (países, continentes, capitales, «Ciudadano del mundo»…), ni sellos, ni colecciones. Los logros se ganan solo viajando con la app.

## 32. La Tanda 8 se parte en tres (16-oct, noche)
- **8a, el cerebro de los logros:** reglas, datos, servidor, /admin/logros, instalar la web, sonidos preparados y el peso. Sin pantallas. Prompt: PROMPT_TANDA8A.md.
- **8b:** HOY v2 y los momentos, cuando Design acabe los pasos 3 y 4.
- **8c:** las pantallas de los logros (botón flotante, Logros, vitrina, pasaporte, Perfil).
- Lo que Claude ha decidido en la 8a (Eric puede cambiarlo):
  - las estaciones, por meses (primavera de marzo a mayo, verano de junio a agosto, otoño de septiembre a noviembre, invierno de diciembre a febrero);
  - Navidad fuera de casa, el 24 o el 25 de diciembre; Nochevieja, el 31;
  - Día perfecto, todas las paradas del día vistas; Viaje perfecto, todos los días perfectos;
  - Madrugador y Nocturno, una vez por ciudad; Alondra y Búho cuentan días distintos;
  - Ciudad al completo, todas sus colecciones; Todos sus secretos, sus 12 emblemas;
  - el sello del Vaticano no cuenta como otra ciudad en Tres ciudades de oro, Tres ciudades de diamante, Diamante a la primera y Conocedor;
  - Pionero, encendido también en Roma.
- Con solo Roma, muchos escalones no se verán todavía (por ejemplo, Capitales empieza en 5): solo se ven los que se pueden conseguir con los destinos curados.

## 33. Revisión del paso 3 de Design (Eric, 17-oct, 00:04–02:12)
Detalle en REVISION_DESIGN_PASO3.md. Lo que cambia reglas:
- **Precios del pase:** 1 persona 6,99 €; Pase Dúo 10,99 € (5,50 € cada uno); Pase Grupo, 3 o más, 4,99 € cada uno. Fuera el escalón de 5 o más.
- **Paga todo el que compra** y lo comparte; el invitado entra sin pagar. Fuera lo de pagar cada uno su parte (tenía trampa).
- **Una prueba de HOY por cuenta, para siempre** (antes, una por destino). Si ya la usó, sin alertas: HOY enseña la tarjeta de la pantalla 12.
- **El día de prueba:** si el día de llegada está libre antes de las 10:00, la prueba es ese día; si no, el día siguiente. Sin vuelo, el día 1. Si no hay ningún día libre antes de las 10:00, el día con más horas libres. Se gasta solo al usar HOY (Visto o Cómo llegar). Si la primera vez que usa HOY ese día es a partir de las 12:00: «Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?» [Hoy] [Mañana].
- Fuera la demostración de HOY antes del viaje.
- **Recomendar cambios:** una parada, un día o la ruta entera, en «modo recomendación» con [Enviar a Elena]. El admin siempre puede aceptar, aunque su ruta haya cambiado: sustituye a lo de ahora; si el día ya no existe, elige día. Fuera «ya no encaja» (cambiarlo en las cuentas, parte 3).
- [Compartir viaje] en RUTA.
- En las listas de paradas, la foto pequeña del sitio en vez del círculo con ✓ (Code: miniaturas de cada foto).
- Regla de textos: fuera los que explican lo que ya se ve.

## 34. Tras la Tanda 8a2 (17-oct, 12:16)
- Hecho por Code (f33511b6): Patrimonios por murallas (82 sitios), el Vaticano capital, el día de prueba nuevo, los precios, «ya no encaja» fuera, «Sustituir el anterior» sin borrar, miniaturas (92, 4,3 KB de media), regla de /admin/logros en vercel.json, web-push y claves VAPID en .env.local.
- Revisado por Claude: la lista de Patrimonios está bien (Testaccio, Cementerio Protestante, Borgo y Pincio, dentro; Villa Borghese, GNAM y Coppedè, fuera).
- Va a la 8a3: la hora libre del día de llegada sale de la ruta (no 90 minutos fijos), la pregunta de las 12:00 también con los Vistos que llegan tarde, y partir el código de la app para que abra antes.
- **La campanita (Eric, 12:06–12:09):** todos los avisos llegan a nuestro botón de Avisos (la campana que ya está en la cabecera) y al móvil. Fuera las tarjetas que preguntan por los avisos. La ventana de permiso del móvil sale una vez: tras [Compartir viaje], tras [Enviar a Elena] o al acabar el primer día. Para las cuentas, parte 3: la lista de avisos con leídos y sin leer, el aviso de nueva recomendación y el de la respuesta.
- La recomendación «cambiar X por Y» se guarda como pareja (Code ya lo añadió en la 8a2); Design la enseña en un recuadro.
