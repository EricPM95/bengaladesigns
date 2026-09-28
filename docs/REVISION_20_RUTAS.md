# 26 rutas de Roma, tal como salen en la app

Motor v3 con los días curados, generado el 2026-09-28 con `node scripts/destino/revision20.mjs`. Sin arreglar nada: es para revisar que las rutas son bonitas.

- **Hora**: la que ve el usuario (:00/:15/:30/:45). **Tiempo**: minutos de visita.
- **Cómo sale en la app**: Parada / Por el camino / Por fuera (con su motivo) / 🌅 Atardecer / 🌙 Noche / 🍝 Comida / 🍷 Cena / 🕐 Tiempo libre.
- **Cómo llegas**: andando desde lo anterior (la comida, si va en medio), o el bus/metro del día ("🚌 Bus 118, 25 min").
- **Por qué aquí**: el `por_que` de la parada (lo que ve el viajero; la nota es interna) y sus avisos (⚠️). Al final, el recuento de la Parte D.

## Índice

| Nº | Días | Ritmo | Free Tour | Experiencias | Pool | Empieza | Avisos de fechas |
|---|---|---|---|---|---|---|---|
| [1](#ruta-1) | 2 | completo | no | sin experiencias | — | sábado 24 abr 2027 · domingo Vaticano cerrado + 25 de abril | 25 de abril · Fiesta de la Liberación |
| [2](#ruta-2) | 2 | completo | sí | sin experiencias | — | sábado 26 jun 2027 | Domingo 27 de junio · Museos Vaticanos |
| [3](#ruta-3) | 3 | completo | no | Arte | — | viernes 26 mar 2027 · Pascua el domingo 28 | Viernes Santo · Via Crucis en el Coliseo · Domingo de Pascua |
| [4](#ruta-4) | 3 | completo | no | sin experiencias | — | sábado 17 jul 2027 · verano | Sábado 17 de julio · Misa en el Panteón · Domingo 18 de julio · Museos Vaticanos |
| [5](#ruta-5) | 3 | completo | sí | Barrios | — | sábado 9 oct 2027 | Domingo 10 de octubre · Museos Vaticanos |
| [6](#ruta-6) | 3 | completo | no | Naturaleza | Castillo de Sant'Angelo | lunes 28 jun 2027 · Castillo cerrado el lunes, Vaticano cerrado el 29 por San Pedro | Lunes 28 de junio · Castillo de Sant'Angelo · 29 de junio · San Pedro y San Pablo · Miércoles 30 de junio · Audiencia papal |
| [7](#ruta-7) | 4 | completo | no | sin experiencias | — | viernes 30 abr 2027 · 1 de mayo | 1 de mayo · Día del Trabajo |
| [8](#ruta-8) | 4 | completo | sí | Arte | — | sábado 4 dic 2027 · invierno, domingo | Mercadillo de Navidad en Piazza Navona · Primer domingo de mes · Museos gratis |
| [9](#ruta-9) | 4 | completo | no | Barrios | — | lunes 1 nov 2027 · Todos los Santos, lunes | 1 de noviembre · Todos los Santos |
| [10](#ruta-10) | 4 | completo | no | sin experiencias | — | viernes 24 dic 2027 · Navidad | Navidad en Roma |
| [11](#ruta-11) | 5 | completo | no | sin experiencias | — | sábado 22 may 2027 · 26 may: audiencia papal (miércoles por la mañana) | Sábado 22 de mayo · Misa en el Panteón · Domingo 23 de mayo · Museos Vaticanos |
| [12](#ruta-12) | 5 | completo | sí | Naturaleza | — | sábado 18 sep 2027 · 22 sep: audiencia papal (miércoles por la mañana) | Domingo 19 de septiembre · Museos Vaticanos |
| [13](#ruta-13) | 3 | completo | no | sin experiencias | — | miércoles 2 jun 2027 · Fiesta de la República + audiencia papal | 2 de junio · Fiesta de la República |
| [14](#ruta-14) | 2 | completo | no | Arte | Galería Borghese | domingo 26 sep 2027 · domingo + lunes con la Galería cerrada | Domingo 26 de septiembre · Museos Vaticanos |
| [15](#ruta-15) | 4 | completo | sí | sin experiencias | — | viernes 13 ago 2027 · Ferragosto | Ferragosto |
| [16](#ruta-16) | 2 | tranquilo | no | sin experiencias | — | sábado 16 ene 2027 | Domingo 17 de enero · Museos Vaticanos |
| [17](#ruta-17) | 3 | tranquilo | sí | sin experiencias | — | sábado 13 feb 2027 | Domingo 14 de febrero · Museos Vaticanos |
| [18](#ruta-18) | 3 | tranquilo | no | Barrios | — | sábado 23 oct 2027 | Sábado 23 de octubre · Misa en el Panteón · Domingo 24 de octubre · Museos Vaticanos |
| [19](#ruta-19) | 4 | tranquilo | no | sin experiencias | — | lunes 6 dic 2027 · 8 de diciembre, la Inmaculada | Mercadillo de Navidad en Piazza Navona · 8 de diciembre · La Inmaculada |
| [20](#ruta-20) | 2 | tranquilo | no | sin experiencias | Galería Borghese | sábado 20 nov 2027 | Domingo 21 de noviembre · Museos Vaticanos |
| [21](#ruta-21) | 2 | completo | no | sin experiencias | — | sábado 15 may 2027 · fin de semana A | Domingo 16 de mayo · Museos Vaticanos |
| [22](#ruta-22) | 3 | completo | no | sin experiencias | — | viernes 8 oct 2027 · fin de semana B | Domingo 10 de octubre · Museos Vaticanos |
| [23](#ruta-23) | 3 | completo | sí | sin experiencias | — | viernes 21 may 2027 · fin de semana C | Domingo 23 de mayo · Museos Vaticanos |
| [24](#ruta-24) | 3 | completo | no | sin experiencias | — | sábado 12 jun 2027 · fin de semana D | Sábado 12 de junio · Misa en el Panteón · Domingo 13 de junio · Museos Vaticanos |
| [25](#ruta-25) | 4 | completo | no | sin experiencias | — | viernes 17 sep 2027 · fin de semana E | — |
| [26](#ruta-26) | 3 | completo | sí | sin experiencias | — | lunes 18 oct 2027 · tres días con Free Tour en octubre (huecos del día 2 y el día 3) | — |

<a id="ruta-1"></a>
## 1. 2 días · completo · sin Free Tour · sin experiencias · desde el sábado 24 abr 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:00. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **25 de abril · Fiesta de la Liberación** · etiqueta «Fiesta de la Liberación» en el día 2
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 24.
  - Fiesta de la Liberación: festivo nacional, con actos oficiales y mucha gente en el centro. Hemos revisado los horarios de hoy para que no choques con ningún cierre.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 24 abr 2027** · 🌅 atardecer 20:00 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:30 | Trastevere | 50 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:30 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:45 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 25 abr 2027** · 🎉 Fiesta de la Liberación · 🏷️ Fiesta de la Liberación · 🌅 atardecer 20:02 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-2"></a>
## 2. 2 días · completo · Free Tour · sin experiencias · desde el sábado 26 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 27 de junio · Museos Vaticanos** · etiqueta «Último domingo de mes» en el día 2
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 26.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 26 jun 2027** · 🌅 atardecer 20:49 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**domingo 27 jun 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 20:49 · día curado D1-FT

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:15 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:30 | Isla Tiberina | 25 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 17:00 | Basílica de Santa Cecilia in Trastevere | 20 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:30 | Trastevere | 100 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:15 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 1 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:45 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 8 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 20:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 17 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-3"></a>
## 3. 3 días · completo · sin Free Tour · Arte · desde el viernes 26 mar 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Viernes Santo · Via Crucis en el Coliseo** · etiqueta «Via Crucis en el Coliseo» en el día 1
  - Por la noche el Papa suele presidir el Via Crucis junto al Coliseo y la zona se corta por la tarde (compruébalo en vatican.va). Hemos puesto el Coliseo por la mañana.
- **Domingo de Pascua** · etiqueta «Domingo de Pascua» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 27 para que no los pierdas.
  - A las 12:00 el Papa suele dar la bendición Urbi et Orbi en la Plaza de San Pedro, con muchísima gente. Hemos dejado tu día preparado para que puedas ir si quieres.

### Día 1 — Roma Antigua y el centro barroco

**viernes 26 mar 2027** · 🎉 Viernes Santo · 🏷️ Via Crucis en el Coliseo · 🌅 atardecer 18:28 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. · experiencia: Arte |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. · experiencia: Arte |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 27 mar 2027** · 🌅 atardecer 18:30 · día curado D2 (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Puente Sant'Angelo | 10 min | Parada | 5 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:30 | Castillo de Sant'Angelo | 80 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. · experiencia: Arte |
| 17:15 | San Pietro in Montorio y Tempietto de Bramante | 25 min | Parada · por dentro | 🚌 Bus 115 o el 870, 20 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. · experiencia: Arte |
| 17:45 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:30 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. · experiencia: Arte |
| 20:00 | Trastevere | 45 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Popolo y la Borghese

**domingo 28 mar 2027** · 🎉 Domingo de Pascua · 🏷️ Domingo de Pascua · 🌅 atardecer 19:31 · día curado D4 (domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 20 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. · experiencia: Arte |
| 10:00 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:30 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:45 | Trinità dei Monti | 20 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. · experiencia: Arte |
| 11:30 | Bendición Urbi et Orbi | 60 min | ☕ Pausa | 🚇 Metro A o el bus 64, 25 min | El Domingo de Pascua a las 12:00, el Papa da la bendición desde el balcón de San Pedro a una plaza llena. Llega con margen: hay controles de seguridad y mucha gente. |
| 13:00 | Comida: Ristorante Arlù | 75 min | 🍝 Comida | 4 min andando | en Vaticano y Borgo |
| 14:45 | Galería Borghese | 125 min | Parada · por dentro | 🚇 Metro A, 25 min | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 17:00 | Parque de Villa Borghese | 105 min | Parada | 8 min andando | Barca en el lago, bici o un rato a la sombra antes de subir al Pincio para el atardecer. |
| 19:15 | Terraza del Pincio | 36 min | 🌅 Atardecer | 11 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:00 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 20:15 | Santa Maria del Popolo | 10 min | Por fuera (A esta hora ya ha cerrado) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. · experiencia: Arte |
| 20:45 | Cena: Sgarro Bistrot |  | 🍷 Cena | 11 min andando | en Tridente y Spagna |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 23:00 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

**Lo que quedó fuera**: nada.

<a id="ruta-4"></a>
## 4. 3 días · completo · sin Free Tour · sin experiencias · desde el sábado 17 jul 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Sábado 17 de julio · Misa en el Panteón** · etiqueta «Misa en el Panteón» en el día 1
  - El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
- **Domingo 18 de julio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el lunes 19 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**sábado 17 jul 2027** · 🏷️ Misa en el Panteón · 🌅 atardecer 20:43 · día curado D1 (sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Enoteca Corsi | 90 min | 🍝 Comida | 7 min andando | en Piazza Venezia |
| 15:15 | Panteón | 25 min | Parada · por dentro | 4 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 15:45 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:00 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:30 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:00 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 17:45 | Largo di Torre Argentina | 15 min | Parada | 7 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 18:00 | Barrio Judío | 40 min | Parada | 7 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 18:45 | Fuente de las Tortugas | 5 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 19:00 | Campo de' Fiori | 40 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 18 jul 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:42 · día curado D4M (domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 12:00 | Terraza del Pincio | 15 min | Parada | 6 min andando | Sube desde la Piazza del Popolo y tendrás Roma entera delante, con la cúpula de San Pedro al fondo. Es uno de los miradores favoritos de los romanos, y no cuesta nada. |
| 12:30 | Tiempo libre antes de la comida | 36 min | 🕐 Tiempo libre |  | ideas: Via Margutta, Via del Babuino |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 9 min andando | en Tridente y Spagna |
| 14:30 | Parque de Villa Borghese | 90 min | Parada | 17 min andando | El gran pulmón verde de Roma. Busca el lago con su templete: si te apetece, puedes alquilar una barca o una bici y ver el parque sin cansarte. |
| 16:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | 20 min andando | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 17:15 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 14 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 18:00 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:30 | Monti | 80 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:15 | Via dei Fori Imperiali | 42 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

### Día 3 — Vaticano, Castillo y Trastevere al atardecer

**lunes 19 jul 2027** · 🌅 atardecer 20:41 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:30 | Trastevere | 95 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:15 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:30 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:15 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-5"></a>
## 5. 3 días · completo · Free Tour · Barrios · desde el sábado 9 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:45. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 10 de octubre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 9 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 9 oct 2027** · 🌅 atardecer 18:39 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere

**domingo 10 oct 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:37 · día curado D1-FT (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:15 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:30 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 17:15 | San Pietro in Montorio y Tempietto de Bramante | 25 min | Parada · por dentro | 16 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:45 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:30 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 20:00 | Trastevere | 45 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. · experiencia: Barrios |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere y Navona de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 23:00 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere y Navona de noche» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 11 oct 2027** · 🌅 atardecer 18:36 · día curado D5C

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 15 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 25 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:30 | Ojo de la Cerradura del Aventino | 5 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 35 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:45 | Testaccio | 65 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. · experiencia: Barrios |
| 13:00 | Comida: Felice a Testaccio | 75 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:45 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:45 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:30 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:15 | Via dei Fori Imperiali | 31 min | 🌅 Atardecer | 8 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:00 | Monti | 40 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. · experiencia: Barrios |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-6"></a>
## 6. 3 días · completo · sin Free Tour · Naturaleza · pool: Castillo de Sant'Angelo · desde el lunes 28 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Lunes 28 de junio · Castillo de Sant'Angelo** · etiqueta «Castillo de Sant'Angelo cerrado» en el día 1
  - Los lunes el Castillo de Sant'Angelo cierra. Hemos puesto tu visita el miércoles 30 para que no lo pierdas.
- **29 de junio · San Pedro y San Pablo** · etiqueta «San Pedro y San Pablo» en el día 2
  - El 29 de junio los Museos Vaticanos cierran por San Pedro y San Pablo. Hemos puesto tu visita el miércoles 30 para que no los pierdas.
  - Fiesta de los patronos de Roma: por la noche suele haber fuegos sobre el Castillo de Sant'Angelo, la Girandola. Hemos puesto tu noche en el Puente Sant'Angelo para verlos.
- **Miércoles 30 de junio · Audiencia papal** · etiqueta «Audiencia papal» en el día 3
  - Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro. Hemos puesto la Basílica después de comer, cuando ya ha abierto.

### Día 1 — Trevi sin gente, el Pincio y la tarde en Monti

**lunes 28 jun 2027** · 🏷️ Castillo de Sant'Angelo cerrado · 🌅 atardecer 20:49 · día curado D4M

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 12:15 | Terraza del Pincio | 15 min | Parada | 6 min andando | Sube desde la Piazza del Popolo y tendrás Roma entera delante, con la cúpula de San Pedro al fondo. Es uno de los miradores favoritos de los romanos, y no cuesta nada. · experiencia: Naturaleza |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 4 min andando | en Tridente y Spagna |
| 14:30 | Parque de Villa Borghese | 90 min | Parada | 13 min andando | El gran pulmón verde de Roma. Busca el lago con su templete: si te apetece, puedes alquilar una barca o una bici y ver el parque sin cansarte. · experiencia: Naturaleza |
| 16:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | 20 min andando | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 17:15 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 14 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 18:00 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:30 | Monti | 75 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:15 | Via dei Fori Imperiali | 44 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

### Día 2 — Roma Antigua y el centro barroco

**martes 29 jun 2027** · 🎉 San Pedro y San Pablo (patrón de Roma) · 🏷️ San Pedro y San Pablo · 🌅 atardecer 20:49 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Girandola» · Los fuegos de la Girandola sobre el Castillo, una tradición que viene del siglo XV por los patronos de Roma. Busca sitio en el puente o en la orilla con tiempo: se llena. |

### Día 3 — Vaticano, Castillo y Trastevere al atardecer

**miércoles 30 jun 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🏷️ Audiencia papal · 🌅 atardecer 20:49 · día curado D2 (miercoles)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Borgo Pio | 5 min | Por el camino | 10 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 11:30 | Tiempo libre antes de la comida | 37 min | 🕐 Tiempo libre |  | Pasear por Prati y el Borgo: los alrededores del Vaticano tienen más de lo que parece. |
| 12:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 3 min andando | en Vaticano y Borgo |
| 13:15 | Plaza de San Pedro | 25 min | Parada | 7 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 13:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. · experiencia: Naturaleza |
| 14:30 | Basílica de San Pedro | 85 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 16:00 | Via della Conciliazione | 5 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 16:15 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:30 | Castillo de Sant'Angelo | 80 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 35 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:30 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:45 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. · experiencia: Naturaleza |
| 20:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. · experiencia: Naturaleza |
| 21:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-7"></a>
## 7. 4 días · completo · sin Free Tour · sin experiencias · desde el viernes 30 abr 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:00. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **1 de mayo · Día del Trabajo** · etiqueta «Día del Trabajo» en el día 2
  - El 1 de mayo los Museos Vaticanos cierran por el Día del Trabajo. Hemos puesto tu visita el lunes 3 para que no los pierdas.
  - Por la tarde suele haber un gran concierto en San Juan de Letrán.

### Día 1 — Roma Antigua y el centro barroco

**viernes 30 abr 2027** · 🌅 atardecer 20:07 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Trevi sin gente, el Popolo y la Borghese

**sábado 1 may 2027** · 🎉 Día del Trabajo · 🏷️ Día del Trabajo · 🌅 atardecer 20:08 · día curado D4

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 12:00 | Tiempo libre antes de la comida | 54 min | 🕐 Tiempo libre |  | ideas: Jardines del Pincio, Via Margutta, Via del Babuino |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 6 min andando | en Tridente y Spagna |
| 15:00 | Galería Borghese | 125 min | Parada · por dentro | 19 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 17:15 | Parque de Villa Borghese | 115 min | Parada | 8 min andando | Barca en el lago, bici o un rato a la sombra antes de subir al Pincio para el atardecer. |
| 19:45 | Terraza del Pincio | 38 min | 🌅 Atardecer | 11 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:45 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 23:00 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — Excursión

**domingo 2 may 2027** · 🌅 atardecer 20:09

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — Vaticano, Castillo y Trastevere al atardecer

**lunes 3 may 2027** · 🌅 atardecer 20:10 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:30 | Trastevere | 50 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:30 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:45 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:45 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-8"></a>
## 8. 4 días · completo · Free Tour · Arte · desde el sábado 4 dic 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Mercadillo de Navidad en Piazza Navona** · etiqueta «Mercadillo de Navidad en Piazza Navona» en el día 1
  - Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad.
- **Primer domingo de mes · Museos gratis** · etiqueta «Museos gratis» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 4 para que no los pierdas.
  - El primer domingo de mes la entrada al Coliseo es gratis: habrá muchísima gente. Ese día no se reserva: las entradas se recogen en la taquilla por orden de llegada, así que ve temprano.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 4 dic 2027** · 🏷️ Mercadillo de Navidad en Piazza Navona · 🌅 atardecer 16:39 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere

**domingo 5 dic 2027** · 🏷️ Museos gratis · 🌅 atardecer 16:39 · día curado D1-FT (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 35 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:00 | Isla Tiberina | 15 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:45 | Roma iluminada desde el Janículo | 40 min | 🌙 Noche | 🚌 Bus 115, 20 min | El sol ya se ha puesto y, a cambio, tienes Roma encendida a tus pies: cúpulas, campanarios y tejados hasta el horizonte. |
| 17:45 | Fontana dell'Acqua Paola | 10 min | Parada | 16 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 5 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. · experiencia: Arte |
| 18:30 | Iglesia de Santa Maria in Trastevere | 10 min | Parada · por dentro | 7 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. · experiencia: Arte |
| 18:45 | Trastevere | 60 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere y Navona de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 22:30 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere y Navona de noche» · En Navidad la plaza se llena con el mercadillo: puestos de dulces, belenes y la Befana, con la Fuente de los Cuatro Ríos iluminada en medio. Date una vuelta entre los puestos. |

### Día 3 — Excursión

**lunes 6 dic 2027** · 🌅 atardecer 16:39

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — Trevi sin gente, el Popolo y la Borghese

**martes 7 dic 2027** · 🌅 atardecer 16:39 · día curado D4 (invierno, con_free_tour)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | — | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. · experiencia: Arte |
| 09:00 | Fuente del Tritón | 5 min | Por el camino | 6 min andando | La fuente de Bernini en la Plaza Barberini: un tritón soplando una caracola sobre cuatro delfines. Es de las que pasan desapercibidas entre el tráfico. |
| 09:15 | Via Veneto | 10 min | Por el camino | 7 min andando | La calle de la Dolce Vita, con sus hoteles de época y sus cafés con toldo. |
| 09:45 | Parque de Villa Borghese | 45 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 14:30 | Via del Babuino | 10 min | Por el camino | 2 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 14:45 | Via Margutta | 10 min | Por el camino | 2 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 15:00 | Piazza del Popolo | 25 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 15:30 | Jardines del Pincio | 35 min | Parada | 5 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:15 | Terraza del Pincio | 39 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 17:00 | Santa Maria del Popolo | 30 min | Parada · por dentro | 5 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. · experiencia: Arte |
| 18:00 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada», antes de cenar · Del Pincio se baja sin cortes por Trinità dei Monti hasta la Plaza de España: la escalinata iluminada, la Barcaccia sonando y la Via Condotti con los escaparates encendidos. El final perfecto para un día de miradores. |
| 18:30 | Luces de Navidad por Via del Corso y Via Condotti, y aperitivo | 84 min | 🕐 Tiempo libre |  | ideas: Via del Corso, Plaza Colonna |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 11 min andando | en Tridente y Spagna |

**Lo que quedó fuera**: nada.

<a id="ruta-9"></a>
## 9. 4 días · completo · sin Free Tour · Barrios · desde el lunes 1 nov 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:00 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **1 de noviembre · Todos los Santos** · etiqueta «Todos los Santos» en el día 1
  - Todos los Santos es festivo en toda Italia, con misas especiales y el centro animado. Hemos revisado los horarios de hoy para que no choques con ningún cierre.

### Día 1 — Roma Antigua y el centro barroco

**lunes 1 nov 2027** · 🎉 Todos los Santos · 🏷️ Todos los Santos · 🌅 atardecer 17:05 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. · experiencia: Barrios |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**martes 2 nov 2027** · 🌅 atardecer 17:04 · día curado D2 (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 5 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:00 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 16:45 | Mirador del Janículo | 35 min | 🌅 Atardecer | 🚌 Bus 115 o el 870, 20 min | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 17:45 | Fontana dell'Acqua Paola | 10 min | Parada | 16 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 5 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:30 | Iglesia de Santa Maria in Trastevere | 10 min | Parada · por dentro | 7 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 60 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. · experiencia: Barrios |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Excursión

**miércoles 3 nov 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 17:02

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — Trevi sin gente, el Popolo y la Borghese

**jueves 4 nov 2027** · 🌅 atardecer 17:01 · día curado D4 (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:45 | Via Condotti | 5 min | Por el camino | 9 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:00 | Plaza de España | 25 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:30 | Trinità dei Monti | 10 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 14:45 | Parque de Villa Borghese | 30 min | Parada | 13 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 15:30 | Piazza del Popolo | 15 min | Parada | 14 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 16:45 | Terraza del Pincio | 36 min | 🌅 Atardecer | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 18:00 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso antes de ir a cenar. |
| 18:45 | Panteón (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · El Panteón de noche, con el pórtico iluminado y la plaza casi vacía. Siéntate un momento en la fuente: es cuando más impresiona. |
| 19:15 | Compras por Via del Corso y aperitivo | 41 min | 🕐 Tiempo libre |  | ideas: Jardines del Pincio, Via Margutta, Via del Babuino |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |

**Lo que quedó fuera**: nada.

<a id="ruta-10"></a>
## 10. 4 días · completo · sin Free Tour · sin experiencias · desde el viernes 24 dic 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Navidad en Roma** · etiqueta «Navidad en Roma» en el día 1
  - El 25 de diciembre el Coliseo y el Panteón cierran por Navidad. Hemos puesto tu visita el viernes 24 para que no los pierdas.
  - El 25 de diciembre los Museos Vaticanos cierran por Navidad. Hemos puesto tu visita el lunes 27 para que no los pierdas.
  - Belenes en las iglesias, el árbol de San Pedro y el mercadillo de Navona; el 25 a las 12:00, bendición del Papa. Hemos colocado tu ruta para que no te pierdas nada.
  - Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.

### Día 1 — Roma Antigua y el centro barroco

**viernes 24 dic 2027** · 🎉 Nochebuena · 🏷️ Navidad en Roma · 🌅 atardecer 16:43 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Trevi sin gente, el Popolo y la Borghese

**sábado 25 dic 2027** · 🎉 Navidad · 🌅 atardecer 16:44 · día curado D4 (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:30 | Plaza de España | 25 min | Parada | 14 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:00 | Trinità dei Monti | 10 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:30 | Bendición Urbi et Orbi | 60 min | ☕ Pausa | 🚇 Metro A o el bus 64, 25 min | El 25 de diciembre a las 12:00, el Papa da la bendición desde el balcón de San Pedro a una plaza llena. Llega con margen: hay controles de seguridad y mucha gente. |
| 13:00 | Comida: Ristorante Arlù | 75 min | 🍝 Comida | 4 min andando | en Vaticano y Borgo |
| 14:45 | Parque de Villa Borghese | 30 min | Parada | 🚇 Metro A, 25 min | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 15:30 | Piazza del Popolo | 15 min | Parada | 14 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 16:45 | Terraza del Pincio | 20 min | 🌅 Atardecer | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 17:30 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · En Navidad la plaza se llena con el mercadillo: puestos de dulces, belenes y la Befana, con la Fuente de los Cuatro Ríos iluminada en medio. Date una vuelta entre los puestos antes de cenar. |
| 18:15 | Panteón (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · El Panteón de noche, con el pórtico iluminado y la plaza casi vacía. Siéntate un momento en la fuente: es cuando más impresiona. |
| 18:45 | Paseo con las luces de Navidad y aperitivo | 71 min | 🕐 Tiempo libre |  | ideas: Jardines del Pincio, Via Margutta, Via del Babuino |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |

### Día 3 — Excursión

**domingo 26 dic 2027** · 🎉 San Esteban · 🌅 atardecer 16:45

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — Vaticano, Castillo y Trastevere al atardecer

**lunes 27 dic 2027** · 🌅 atardecer 16:45 · día curado D2 (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 5 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:00 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 16:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 🚌 Bus 115 o el 870, 20 min | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 17:30 | Fontana dell'Acqua Paola | 10 min | Parada | 16 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:45 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 5 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 10 min | Parada · por dentro | 7 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:30 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: Galería Borghese (Cierra el 25 de diciembre).

<a id="ruta-11"></a>
## 11. 5 días · completo · sin Free Tour · sin experiencias · desde el sábado 22 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Sábado 22 de mayo · Misa en el Panteón** · etiqueta «Misa en el Panteón» en el día 1
  - El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
- **Domingo 23 de mayo · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el lunes 24 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**sábado 22 may 2027** · 🏷️ Misa en el Panteón · 🌅 atardecer 20:30 · día curado D1 (sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Enoteca Corsi | 90 min | 🍝 Comida | 7 min andando | en Piazza Venezia |
| 15:15 | Panteón | 25 min | Parada · por dentro | 4 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 15:45 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:00 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:30 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:00 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 17:45 | Largo di Torre Argentina | 15 min | Parada | 7 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 18:00 | Barrio Judío | 40 min | Parada | 7 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 18:45 | Fuente de las Tortugas | 5 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 19:00 | Campo de' Fiori | 40 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Trevi sin gente, el Popolo y la Borghese

**domingo 23 may 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:31 · día curado D4 (domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:00 | Trinità dei Monti | 20 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:30 | Tiempo libre antes de la comida | 35 min | 🕐 Tiempo libre |  | ideas: Via del Babuino, Via Margutta, Fuente del Tritón |
| 12:00 | Comida: Sgarro Bistrot | 75 min | 🍝 Comida | 5 min andando | en Tridente y Spagna |
| 13:15 | Tiempo libre antes de Galería Borghese | 45 min | 🕐 Tiempo libre |  | Pasear por Villa Borghese: el pulmón verde de Roma. |
| 14:00 | Galería Borghese | 120 min | Parada · por dentro | 22 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 16:30 | Piazza del Popolo | 10 min | Parada | 21 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:45 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 17:45 | Parque de Villa Borghese | 125 min | Parada | 16 min andando | Barca en el lago, bici o un rato a la sombra antes de subir al Pincio para el atardecer. |
| 20:15 | Terraza del Pincio | 36 min | 🌅 Atardecer | 11 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 21:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 23:00 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — Vaticano, Castillo y Trastevere al atardecer

**lunes 24 may 2027** · 🌅 atardecer 20:32 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:30 | Trastevere | 80 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:15 | Fontana dell'Acqua Paola | 25 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:15 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 4 — Excursión

**martes 25 may 2027** · 🌅 atardecer 20:33

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El sur de Roma: el Aventino, Testaccio y la Via Appia

**miércoles 26 may 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 20:33 · día curado D5

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | Parada · por dentro | — | Las termas más espectaculares de Roma, enormes y casi vacías a primera hora. Aquí se bañaban miles de romanos a la vez: pasea sin prisa entre sus muros de ladrillo. |
| 10:30 | Boca de la Verdad | 15 min | Parada | 21 min andando | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 11:00 | Jardín de los Naranjos | 25 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 11:30 | Ojo de la Cerradura del Aventino | 5 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 11:45 | Testaccio | 60 min | Parada | 6 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 13:00 | Comida: Felice a Testaccio | 75 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:45 | Via Appia Antica | 150 min | Parada | 🚌 Bus 118, 25 min | La calzada más famosa de la antigua Roma, con sus losas originales entre pinos y tumbas. Recórrela a pie o en bici hasta la tumba de Cecilia Metella: es como viajar 2.000 años atrás. |
| 17:45 | Circo Máximo | 30 min | Parada | 🚌 Bus 118, 30 min | Bajas del bus aquí, donde corrían las cuadrigas. Con la luz de la tarde, el Palatino que tienes delante se vuelve dorado. |
| 18:30 | Isla Tiberina | 20 min | Parada | 11 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 19:00 | Teatro de Marcelo | 20 min | Parada | 9 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 19:30 | Tiempo libre antes de Plaza del Campidoglio | 45 min | 🕐 Tiempo libre |  | ideas: Via dei Fori Imperiali, Columna de Trajano |
| 20:15 | Plaza del Campidoglio | 38 min | 🌅 Atardecer | 10 min andando | Terminas el día en la plaza de Miguel Ángel. Rodea el Ayuntamiento hasta el mirador de detrás y quédate a ver cómo se encienden las luces del Foro. |
| 21:00 | Cena: La Boccaccia |  | 🍷 Cena | 12 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-12"></a>
## 12. 5 días · completo · Free Tour · Naturaleza · desde el sábado 18 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 19 de septiembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 18 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 18 sep 2027** · 🌅 atardecer 19:15 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Trevi sin gente, el Popolo y la Borghese

**domingo 19 sep 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:13 · día curado D4 (con_free_tour, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | — | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 09:30 | Fuente del Tritón | 5 min | Por el camino | 6 min andando | La fuente de Bernini en la Plaza Barberini: un tritón soplando una caracola sobre cuatro delfines. Es de las que pasan desapercibidas entre el tráfico. |
| 09:45 | Via Veneto | 10 min | Por el camino | 7 min andando | La calle de la Dolce Vita, con sus hoteles de época y sus cafés con toldo. |
| 10:00 | Porta Pinciana | 25 min | Parada | 2 min andando | Al final de Via Veneto está la Porta Pinciana, una de las puertas de la muralla. Crúzala y sigue por el paseo de los pinos del parque hasta la Galería. · experiencia: Naturaleza |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 11 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 22 min andando | en Tridente y Spagna |
| 14:30 | Via del Babuino | 10 min | Por el camino | 4 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 14:45 | Via Margutta | 10 min | Por el camino | 2 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 15:15 | Parque de Villa Borghese | 25 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. · experiencia: Naturaleza |
| 16:00 | Piazza del Popolo | 15 min | Parada | 14 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 17:00 | Jardines del Pincio | 90 min | Parada | 4 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines: los bustos de romanos ilustres, el reloj de agua y la Casina Valadier. Cuando baje el sol, a la terraza. · experiencia: Naturaleza |
| 18:45 | Terraza del Pincio | 38 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. · experiencia: Naturaleza |
| 19:30 | Aperitivo y paseo por Tridente y Spagna | 23 min | 🕐 Tiempo libre |  |  |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 3 — Roma Antigua, el Ghetto y Trastevere al atardecer

**lunes 20 sep 2027** · 🌅 atardecer 19:12 · día curado D1-FT

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:15 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:30 | Isla Tiberina | 25 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 17:00 | Basílica de Santa Cecilia in Trastevere | 20 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:30 | Trastevere | 25 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 18:00 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 1 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:30 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 8 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:00 | Mirador del Janículo | 40 min | 🌅 Atardecer | 17 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. · experiencia: Naturaleza |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 4 — Excursión

**martes 21 sep 2027** · 🌅 atardecer 19:10

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El sur de Roma: el Aventino, Testaccio y la Via Appia

**miércoles 22 sep 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 19:08 · día curado D5

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Termas de Caracalla | 60 min | Parada · por dentro | — | Las termas más espectaculares de Roma, enormes y casi vacías a primera hora. Aquí se bañaban miles de romanos a la vez: pasea sin prisa entre sus muros de ladrillo. |
| 10:30 | Boca de la Verdad | 15 min | Parada | 21 min andando | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 11:00 | Jardín de los Naranjos | 25 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. · experiencia: Naturaleza |
| 11:30 | Ojo de la Cerradura del Aventino | 5 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 11:45 | Testaccio | 60 min | Parada | 6 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 13:00 | Comida: Felice a Testaccio | 75 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:45 | Via Appia Antica | 150 min | Parada | 🚌 Bus 118, 25 min | La calzada más famosa de la antigua Roma, con sus losas originales entre pinos y tumbas. Recórrela a pie o en bici hasta la tumba de Cecilia Metella: es como viajar 2.000 años atrás. |
| 17:45 | Circo Máximo | 30 min | Parada | 🚌 Bus 118, 30 min | Bajas del bus aquí, donde corrían las cuadrigas. Con la luz de la tarde, el Palatino que tienes delante se vuelve dorado. |
| 18:45 | Plaza del Campidoglio | 38 min | 🌅 Atardecer | 15 min andando | Terminas el día en la plaza de Miguel Ángel. Rodea el Ayuntamiento hasta el mirador de detrás y quédate a ver cómo se encienden las luces del Foro. |
| 19:30 | Aperitivo y paseo por Monti | 25 min | 🕐 Tiempo libre |  |  |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 12 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-13"></a>
## 13. 3 días · completo · sin Free Tour · sin experiencias · desde el miércoles 2 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **2 de junio · Fiesta de la República** · etiqueta «Fiesta de la República» en el día 1
  - Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro. Hemos puesto la Basílica después de comer, cuando ya ha abierto.
  - Hay desfile en Via dei Fori Imperiali.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**miércoles 2 jun 2027** · 🎉 Fiesta de la República · 🏷️ Fiesta de la República · 🌅 atardecer 20:39 · día curado D2 (miercoles)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Borgo Pio | 5 min | Por el camino | 10 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 11:30 | Tiempo libre antes de la comida | 37 min | 🕐 Tiempo libre |  | Pasear por Prati y el Borgo: los alrededores del Vaticano tienen más de lo que parece. |
| 12:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 3 min andando | en Vaticano y Borgo |
| 13:15 | Plaza de San Pedro | 25 min | Parada | 7 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 13:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 14:30 | Basílica de San Pedro | 85 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 16:00 | Via della Conciliazione | 5 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 16:15 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:30 | Castillo de Sant'Angelo | 80 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 35 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:30 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:45 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**jueves 3 jun 2027** · 🌅 atardecer 20:40 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**viernes 4 jun 2027** · 🌅 atardecer 20:41 · día curado D4M

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 12:15 | Terraza del Pincio | 15 min | Parada | 6 min andando | Sube desde la Piazza del Popolo y tendrás Roma entera delante, con la cúpula de San Pedro al fondo. Es uno de los miradores favoritos de los romanos, y no cuesta nada. |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 4 min andando | en Tridente y Spagna |
| 14:30 | Parque de Villa Borghese | 90 min | Parada | 13 min andando | El gran pulmón verde de Roma. Busca el lago con su templete: si te apetece, puedes alquilar una barca o una bici y ver el parque sin cansarte. |
| 16:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | 20 min andando | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 17:15 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 14 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 18:00 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:30 | Monti | 80 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:15 | Via dei Fori Imperiali | 41 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-14"></a>
## 14. 2 días · completo · sin Free Tour · Arte · pool: Galería Borghese · desde el domingo 26 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:00. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 26 de septiembre · Museos Vaticanos** · etiqueta «Último domingo de mes» en el día 1
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el lunes 27.

### Día 1 — Roma Antigua y el centro barroco

**domingo 26 sep 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 19:01 · día curado D1 (pool_borghese)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: La Taverna dei Fori Imperiali | 90 min | 🍝 Comida | 7 min andando | en Monti y Fori Imperiali |
| 15:15 | Fontana de Trevi | 35 min | Parada | 14 min andando | La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma. |
| 16:00 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 16:45 | Galería Borghese | 120 min | Parada · por dentro | 16 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 19:15 | Roma iluminada desde el Pincio | 20 min | 🌙 Noche | 17 min andando | Ya es de noche y la Piazza del Popolo brilla a tus pies, con las cúpulas del centro encendidas al fondo. |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:30 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**lunes 27 sep 2027** · 🌅 atardecer 18:59 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. · experiencia: Arte |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. · experiencia: Arte |
| 17:30 | Trastevere | 20 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. · experiencia: Arte |
| 18:15 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:45 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:30 | Aperitivo y paseo por Trastevere | 22 min | 🕐 Tiempo libre |  |  |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-15"></a>
## 15. 4 días · completo · Free Tour · sin experiencias · desde el viernes 13 ago 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Ferragosto** · etiqueta «Ferragosto» en el día 2
  - El 14 de agosto los Museos Vaticanos cierran por Ferragosto. Hemos puesto tu visita el viernes 13 para que no los pierdas.
  - Los romanos se van a la playa y la ciudad está más tranquila que nunca.
  - Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 13 ago 2027** · 🌅 atardecer 20:14 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Trevi sin gente, el Popolo y la Borghese

**sábado 14 ago 2027** · 🏷️ Ferragosto · 🌅 atardecer 20:12 · día curado D4 (con_free_tour)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | — | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 09:00 | Fuente del Tritón | 5 min | Por el camino | 6 min andando | La fuente de Bernini en la Plaza Barberini: un tritón soplando una caracola sobre cuatro delfines. Es de las que pasan desapercibidas entre el tráfico. |
| 09:15 | Via Veneto | 10 min | Por el camino | 7 min andando | La calle de la Dolce Vita, con sus hoteles de época y sus cafés con toldo. |
| 10:00 | Galería Borghese | 120 min | Parada · por dentro | 12 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 12:30 | Comida: Edy | 90 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 14:00 | Via del Babuino | 10 min | Por el camino | 2 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 14:15 | Via Margutta | 10 min | Por el camino | 2 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 14:45 | Parque de Villa Borghese | 25 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 15:30 | Piazza del Popolo | 25 min | Parada | 14 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:00 | Santa Maria del Popolo | 40 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 16:45 | Jardines del Pincio | 125 min | Parada | 4 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines: los bustos de romanos ilustres, el reloj de agua y la Casina Valadier. Cuando baje el sol, a la terraza. |
| 18:45 | Tiempo libre antes de Terraza del Pincio | 53 min | 🕐 Tiempo libre |  | Pasear por Villa Borghese: el pulmón verde de Roma. |
| 19:45 | Terraza del Pincio | 37 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:45 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 22:00 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 3 — Excursión

**domingo 15 ago 2027** · 🎉 Ferragosto · 🌅 atardecer 20:11

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — Roma Antigua, el Ghetto y Trastevere al atardecer

**lunes 16 ago 2027** · 🌅 atardecer 20:09 · día curado D1-FT

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:15 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:30 | Isla Tiberina | 25 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 17:00 | Basílica de Santa Cecilia in Trastevere | 20 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:30 | Trastevere | 55 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 18:30 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 1 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 8 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:45 | Mirador del Janículo | 40 min | 🌅 Atardecer | 17 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-16"></a>
## 16. 2 días · tranquilo · sin Free Tour · sin experiencias · desde el sábado 16 ene 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:00 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 17 de enero · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 16 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere

**sábado 16 ene 2027** · 🌅 atardecer 17:05 · día curado D2 (invierno, tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 13:00 | Comida: 200 Gradi | 120 min | 🍝 Comida | 4 min andando | en Vaticano y Borgo |
| 15:00 | Plaza de San Pedro | 25 min | Parada | 8 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 15:30 | Basílica de San Pedro | 85 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 17:00 | Via della Conciliazione | 5 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 17:15 | Roma iluminada desde el Puente Sant'Angelo | 10 min | 🌙 Noche | 7 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 17:30 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 17 ene 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:06 · día curado D1 (tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Coliseo | 85 min | Parada · por dentro | — | Estás delante del edificio más famoso de Roma: aquí cabían unas 50.000 personas para ver luchar a los gladiadores. Guarda la entrada, porque con la misma ves después el Foro y el Palatino. |
| 11:30 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 12:00 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 13:45 | Comida: La Taverna dei Fori Imperiali | 120 min | 🍝 Comida | 6 min andando | en Monti y Fori Imperiali |
| 15:45 | Plaza Venecia | 10 min | Por el camino | 8 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 16:00 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 16:45 | Plaza del Campidoglio | 31 min | 🌅 Atardecer | 8 min andando | Terminas el día en la plaza de Miguel Ángel. Rodea el Ayuntamiento hasta el mirador de detrás y quédate a ver cómo se encienden las luces del Foro. |
| 17:30 | Panteón | 35 min | Parada · por dentro | 12 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:15 | Iglesia de San Luigi dei Francesi | 10 min | Por fuera (A esta hora ya ha cerrado) | 6 min andando | La iglesia de los franceses, a dos pasos de Navona. Dentro esconde tres Caravaggio: si está abierta, entra aunque sean cinco minutos. |
| 18:30 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 25 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:45 | Plaza Farnese | 10 min | Por el camino | 1 min andando | Una plaza tranquila a un minuto de Campo de' Fiori. Fíjate en las dos fuentes: están hechas con bañeras de granito de las Termas de Caracalla. El palacio, en el que trabajó Miguel Ángel, hoy es la embajada de Francia. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 5 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-17"></a>
## 17. 3 días · tranquilo · Free Tour · sin experiencias · desde el sábado 13 feb 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 14 de febrero · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 13 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 13 feb 2027** · 🌅 atardecer 17:40 · día curado D3

- ⚠️ Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | — | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 75 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere

**domingo 14 feb 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:41 · día curado D1-FT (invierno, tranquilo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Coliseo | 85 min | Parada · por dentro | — | Hoy toca la Roma antigua, y empiezas por el edificio más famoso de Roma. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 11:30 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 12:00 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 13:45 | Comida: La Taverna dei Fori Imperiali | 120 min | 🍝 Comida | 6 min andando | en Monti y Fori Imperiali |
| 15:45 | Plaza Venecia | 10 min | Por el camino | 8 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 16:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 17:00 | Barrio Judío | 35 min | Parada | 13 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 17:45 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 18:15 | Trastevere | 30 min | Parada | 8 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:00 | Mirador del Janículo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Roma desde arriba», antes de cenar · En invierno el atardecer llega pronto, y a cambio el Janículo te regala Roma entera iluminada: cúpulas, campanarios y tejados hasta el horizonte. Sube con calma o en el bus 115, y baja luego a Trastevere, que queda al lado. |
| 19:30 | Paseo por Trastevere iluminado y aperitivo | 34 min | 🕐 Tiempo libre |  |  |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 15 feb 2027** · 🌅 atardecer 17:43 · día curado D5C

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Boca de la Verdad | 15 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:30 | Jardín de los Naranjos | 25 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 11:00 | Ojo de la Cerradura del Aventino | 5 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 11:15 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:45 | Testaccio | 65 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 13:00 | Comida: Felice a Testaccio | 105 min | 🍝 Comida | 1 min andando | en Testaccio |
| 15:15 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 16:30 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:15 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:45 | Roma iluminada desde los Foros | 18 min | 🌙 Noche | 8 min andando | La avenida de los Foros de noche: las ruinas iluminadas a los dos lados y el Coliseo encendido al fondo. |
| 18:15 | Monti | 100 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-18"></a>
## 18. 3 días · tranquilo · sin Free Tour · Barrios · desde el sábado 23 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:15. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas. Solo 1 día empieza antes, para que no te quedes sin ver el Panteón.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Sábado 23 de octubre · Misa en el Panteón** · etiqueta «Misa en el Panteón» en el día 1
  - El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
- **Domingo 24 de octubre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el lunes 25 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**sábado 23 oct 2027** · 🏷️ Misa en el Panteón · 🌅 atardecer 18:17 · día curado D1 (tranquilo, tranquilo_invierno, sabado, tranquilo_sabado)

- ⚠️ Hoy toca madrugar un poco. Sabemos que elegiste ir con calma, pero hoy merece la pena empezar a las 09:30: así te da tiempo a ver el Panteón sin prisas. El resto del día sigue a tu ritmo.

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Coliseo | 85 min | Parada · por dentro | — | Estás delante del edificio más famoso de Roma: aquí cabían unas 50.000 personas para ver luchar a los gladiadores. Guarda la entrada, porque con la misma ves después el Foro y el Palatino. |
| 11:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 11:30 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 13:15 | Comida: La Taverna dei Fori Imperiali | 120 min | 🍝 Comida | 6 min andando | en Monti y Fori Imperiali |
| 15:15 | Panteón | 35 min | Parada · por dentro | 17 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 16:00 | Iglesia de San Luigi dei Francesi | 10 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 16:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 17:15 | Plaza Venecia | 10 min | Por el camino | 14 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 17:30 | Altar de la Patria | 35 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 18:15 | Plaza del Campidoglio | 17 min | 🌅 Atardecer | 8 min andando | Terminas el día en la plaza de Miguel Ángel. Rodea el Ayuntamiento hasta el mirador de detrás y quédate a ver cómo se encienden las luces del Foro. |
| 18:45 | Barrio Judío | 35 min | Parada | 11 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 19:30 | Campo de' Fiori | 25 min | Parada | 9 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. · experiencia: Barrios |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Trevi, el Pincio y la tarde en Monti

**domingo 24 oct 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:16 · día curado D4M (tranquilo, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Fontana de Trevi | 35 min | Parada | — | La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma. |
| 10:45 | Plaza de España | 30 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:30 | Piazza del Popolo | 25 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 12:00 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 12:15 | Terraza del Pincio | 25 min | Parada | 6 min andando | Sube desde la Piazza del Popolo y tendrás Roma entera delante, con la cúpula de San Pedro al fondo. Es uno de los miradores favoritos de los romanos, y no cuesta nada. |
| 13:00 | Comida: Sgarro Bistrot | 120 min | 🍝 Comida | 9 min andando | en Tridente y Spagna |
| 15:00 | Parque de Villa Borghese | 90 min | Parada | 17 min andando | El gran pulmón verde de Roma. Busca el lago con su templete: si te apetece, puedes alquilar una barca o una bici y ver el parque sin cansarte. |
| 17:00 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | 20 min andando | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 17:45 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 14 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 18:30 | Iglesia de San Pietro in Vincoli | 10 min | Por fuera (A esta hora ya ha cerrado) | 12 min andando | La placita escondida sobre Monti donde está la iglesia del Moisés de Miguel Ángel. Vuelve otro día: por dentro merece la pena. |
| 18:45 | Roma iluminada desde los Foros | 20 min | 🌙 Noche | 8 min andando | La avenida de los Foros de noche: las ruinas iluminadas a los dos lados y el Coliseo encendido al fondo. |
| 19:15 | Monti | 40 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. · experiencia: Barrios |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

### Día 3 — Vaticano, Castillo y Trastevere

**lunes 25 oct 2027** · 🌅 atardecer 18:14 · día curado D2 (invierno, tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 13:00 | Comida: 200 Gradi | 120 min | 🍝 Comida | 4 min andando | en Vaticano y Borgo |
| 15:00 | Plaza de San Pedro | 25 min | Parada | 8 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 15:30 | Basílica de San Pedro | 85 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 17:00 | Via della Conciliazione | 5 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 17:15 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 17:30 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. · experiencia: Barrios |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-19"></a>
## 19. 4 días · tranquilo · sin Free Tour · sin experiencias · desde el lunes 6 dic 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Mercadillo de Navidad en Piazza Navona** · etiqueta «Mercadillo de Navidad en Piazza Navona» en el día 1
  - Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad.
- **8 de diciembre · La Inmaculada** · etiqueta «La Inmaculada» en el día 3
  - Por la tarde el Papa suele ir a la Plaza de España a honrar a la Virgen y la plaza se llena.

### Día 1 — Roma Antigua y el centro barroco

**lunes 6 dic 2027** · 🏷️ Mercadillo de Navidad en Piazza Navona · 🌅 atardecer 16:39 · día curado D1 (tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Coliseo | 85 min | Parada · por dentro | — | Estás delante del edificio más famoso de Roma: aquí cabían unas 50.000 personas para ver luchar a los gladiadores. Guarda la entrada, porque con la misma ves después el Foro y el Palatino. |
| 11:30 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 12:00 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 13:45 | Comida: La Taverna dei Fori Imperiali | 120 min | 🍝 Comida | 6 min andando | en Monti y Fori Imperiali |
| 15:45 | Plaza Venecia | 10 min | Por el camino | 8 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 16:00 | Altar de la Patria | 35 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 16:45 | Roma iluminada desde el Campidoglio | 15 min | 🌙 Noche | 8 min andando | Rodea el Ayuntamiento hasta el mirador de detrás: el Foro iluminado a tus pies y casi nadie alrededor. |
| 17:15 | Panteón | 35 min | Parada · por dentro | 12 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:00 | Iglesia de San Luigi dei Francesi | 10 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 25 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:30 | Plaza Farnese | 10 min | Por el camino | 1 min andando | Una plaza tranquila a un minuto de Campo de' Fiori. Fíjate en las dos fuentes: están hechas con bañeras de granito de las Termas de Caracalla. El palacio, en el que trabajó Miguel Ángel, hoy es la embajada de Francia. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 5 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere

**martes 7 dic 2027** · 🌅 atardecer 16:39 · día curado D2 (invierno, tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 13:00 | Comida: 200 Gradi | 120 min | 🍝 Comida | 4 min andando | en Vaticano y Borgo |
| 15:00 | Plaza de San Pedro | 25 min | Parada | 8 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 15:30 | Basílica de San Pedro | 85 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 17:00 | Via della Conciliazione | 5 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 17:15 | Roma iluminada desde el Puente Sant'Angelo | 10 min | 🌙 Noche | 7 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 17:30 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Excursión

**miércoles 8 dic 2027** · 🎉 la Inmaculada · 🏷️ La Inmaculada · 🌅 atardecer 16:39

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren.

### Día 4 — La Borghese, el Pincio y la escalinata

**jueves 9 dic 2027** · 🌅 atardecer 16:39 · día curado D4 (invierno, tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Plaza de España | 20 min | Parada | — | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 16 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Edy | 120 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 15:45 | Parque de Villa Borghese | 30 min | Parada | 13 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 16:30 | Piazza del Popolo | 25 min | Parada | 14 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 17:45 | Roma iluminada desde el Pincio | 20 min | 🌙 Noche | 6 min andando | Ya es de noche y la Piazza del Popolo brilla a tus pies, con las cúpulas del centro encendidas al fondo. |
| 18:30 | Panteón (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado está a un paso: un paseo precioso antes de ir a cenar. |
| 19:00 | Luces de Navidad por Via del Corso y Via Condotti, y aperitivo | 56 min | 🕐 Tiempo libre |  | ideas: Jardines del Pincio, Via Margutta, Via del Babuino |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |

**Lo que quedó fuera**: nada.

<a id="ruta-20"></a>
## 20. 2 días · tranquilo · sin Free Tour · sin experiencias · pool: Galería Borghese · desde el sábado 20 nov 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 21 de noviembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 20 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere

**sábado 20 nov 2027** · 🌅 atardecer 16:46 · día curado D2 (invierno, tranquilo, tranquilo_invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 13:00 | Comida: 200 Gradi | 120 min | 🍝 Comida | 4 min andando | en Vaticano y Borgo |
| 15:00 | Plaza de San Pedro | 25 min | Parada | 8 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 15:30 | Basílica de San Pedro | 85 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 17:00 | Via della Conciliazione | 5 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 17:15 | Roma iluminada desde el Puente Sant'Angelo | 10 min | 🌙 Noche | 7 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 17:30 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy lo ves por fuera para llegar a todo lo del día) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 18:15 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 21 nov 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 16:45 · día curado D1 (tranquilo, tranquilo_invierno, pool_borghese)

- ⚠️ Hoy toca madrugar un poco. Sabemos que elegiste ir con calma, pero hoy merece la pena empezar a las 09:30: así te da tiempo a ver la Galería Borghese sin prisas. El resto del día sigue a tu ritmo. Hoy la comida es más corta para que te dé tiempo a ver la Galería Borghese.

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Coliseo | 85 min | Parada · por dentro | — | Estás delante del edificio más famoso de Roma: aquí cabían unas 50.000 personas para ver luchar a los gladiadores. Guarda la entrada, porque con la misma ves después el Foro y el Palatino. |
| 11:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 11:30 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 13:15 | Comida: La Taverna dei Fori Imperiali | 75 min | 🍝 Comida | 6 min andando | en Monti y Fori Imperiali |
| 14:30 | Plaza Venecia | 10 min | Por el camino | 8 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 14:45 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 15:30 | Fontana de Trevi | 35 min | Parada | 14 min andando | La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma. |
| 16:15 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 17:00 | Galería Borghese | 120 min | Parada · por dentro | 16 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 19:30 | Roma iluminada desde el Pincio | 20 min | 🌙 Noche | 17 min andando | Ya es de noche y la Piazza del Popolo brilla a tus pies, con las cúpulas del centro encendidas al fondo. |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:30 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

**Lo que quedó fuera**: nada.

<a id="ruta-21"></a>
## 21. 2 días · completo · sin Free Tour · sin experiencias · desde el sábado 15 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:30. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 16 de mayo · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 15 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 15 may 2027** · 🌅 atardecer 20:23 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 70 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 18:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:30 | Trastevere | 35 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:15 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:30 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:15 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 16 may 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:24 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-22"></a>
## 22. 3 días · completo · sin Free Tour · sin experiencias · desde el viernes 8 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:45. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 10 de octubre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 9 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 8 oct 2027** · 🌅 atardecer 18:41 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 9 oct 2027** · 🌅 atardecer 18:39 · día curado D2 (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Puente Sant'Angelo | 10 min | Parada | 5 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:30 | Castillo de Sant'Angelo | 80 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:15 | San Pietro in Montorio y Tempietto de Bramante | 25 min | Parada · por dentro | 🚌 Bus 115 o el 870, 20 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:45 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:30 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 20:00 | Trastevere | 45 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 10 oct 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:37 · día curado D4M (domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 12:00 | Terraza del Pincio | 15 min | Parada | 6 min andando | Sube desde la Piazza del Popolo y tendrás Roma entera delante, con la cúpula de San Pedro al fondo. Es uno de los miradores favoritos de los romanos, y no cuesta nada. |
| 12:30 | Tiempo libre antes de la comida | 36 min | 🕐 Tiempo libre |  | ideas: Via Margutta, Via del Babuino |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 9 min andando | en Tridente y Spagna |
| 14:30 | Parque de Villa Borghese | 90 min | Parada | 17 min andando | El gran pulmón verde de Roma. Busca el lago con su templete: si te apetece, puedes alquilar una barca o una bici y ver el parque sin cansarte. |
| 16:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | 20 min andando | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 17:15 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 14 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 18:00 | Iglesia de San Pietro in Vincoli | 10 min | Por fuera (A esta hora ya ha cerrado) | 12 min andando | La placita escondida sobre Monti donde está la iglesia del Moisés de Miguel Ángel. Vuelve otro día: por dentro merece la pena. |
| 18:15 | Via dei Fori Imperiali | 32 min | 🌅 Atardecer | 8 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:00 | Monti | 40 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-23"></a>
## 23. 3 días · completo · Free Tour · sin experiencias · desde el viernes 21 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 23 de mayo · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 21 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 21 may 2027** · 🌅 atardecer 20:29 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:30 | Cena: Dal Toscano |  | 🍷 Cena | 8 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 22 may 2027** · 🌅 atardecer 20:30 · día curado D1-FT

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:15 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:30 | Isla Tiberina | 25 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 17:00 | Basílica de Santa Cecilia in Trastevere | 20 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:30 | Trastevere | 85 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:00 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 1 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:30 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 8 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 20:00 | Mirador del Janículo | 40 min | 🌅 Atardecer | 17 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:00 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 23 may 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:31 · día curado D5C (domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 15 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 25 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:30 | Ojo de la Cerradura del Aventino | 5 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 35 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:45 | Testaccio | 65 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 13:00 | Comida: Felice a Testaccio | 75 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:45 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:45 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:30 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:00 | Monti | 90 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:00 | Via dei Fori Imperiali | 41 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:00 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-24"></a>
## 24. 3 días · completo · sin Free Tour · sin experiencias · desde el sábado 12 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Sábado 12 de junio · Misa en el Panteón** · etiqueta «Misa en el Panteón» en el día 1
  - El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
- **Domingo 13 de junio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el lunes 14 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**sábado 12 jun 2027** · 🏷️ Misa en el Panteón · 🌅 atardecer 20:45 · día curado D1 (sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Enoteca Corsi | 90 min | 🍝 Comida | 7 min andando | en Piazza Venezia |
| 15:15 | Panteón | 25 min | Parada · por dentro | 4 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 15:45 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:00 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:30 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:00 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 17:45 | Largo di Torre Argentina | 15 min | Parada | 7 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 18:00 | Barrio Judío | 40 min | Parada | 7 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 18:45 | Fuente de las Tortugas | 5 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 19:00 | Campo de' Fiori | 40 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 13 jun 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:46 · día curado D4M (domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 12:00 | Terraza del Pincio | 15 min | Parada | 6 min andando | Sube desde la Piazza del Popolo y tendrás Roma entera delante, con la cúpula de San Pedro al fondo. Es uno de los miradores favoritos de los romanos, y no cuesta nada. |
| 12:30 | Tiempo libre antes de la comida | 36 min | 🕐 Tiempo libre |  | ideas: Via Margutta, Via del Babuino |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 9 min andando | en Tridente y Spagna |
| 14:30 | Parque de Villa Borghese | 90 min | Parada | 17 min andando | El gran pulmón verde de Roma. Busca el lago con su templete: si te apetece, puedes alquilar una barca o una bici y ver el parque sin cansarte. |
| 16:30 | Iglesia de Santa Maria della Vittoria | 20 min | Parada | 20 min andando | Una iglesia pequeña que guarda una obra maestra: el Éxtasis de Santa Teresa, de Bernini. Mira a los lados: la familia que lo encargó está esculpida en palcos, como si miraran una obra de teatro. Se entra gratis y casi siempre está tranquila. |
| 17:15 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 14 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 18:00 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:30 | Monti | 75 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:15 | Via dei Fori Imperiali | 41 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

### Día 3 — Vaticano, Castillo y Trastevere al atardecer

**lunes 14 jun 2027** · 🌅 atardecer 20:46 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:30 | Trastevere | 95 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:15 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:30 | Fontana dell'Acqua Paola | 25 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-25"></a>
## 25. 4 días · completo · sin Free Tour · sin experiencias · desde el viernes 17 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**viernes 17 sep 2027** · 🌅 atardecer 19:17 · día curado D1

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:45 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:00 | Largo di Torre Argentina | 20 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:30 | Panteón | 25 min | Parada · por dentro | 6 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:15 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:45 | Iglesia de San Luigi dei Francesi | 25 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:15 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:00 | Campo de' Fiori | 45 min | Parada | 7 min andando | Por la mañana es mercado de frutas y flores, y por la tarde, el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Trevi sin gente, el Popolo y la Borghese

**sábado 18 sep 2027** · 🌅 atardecer 19:15 · día curado D4

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 25 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Iglesia de San Ignacio de Loyola | 25 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 10:00 | Plaza Colonna | 5 min | Por el camino | 4 min andando | La columna del centro cuenta en espiral las guerras de Marco Aurelio, el emperador de «Gladiator». El palacio de al lado es la sede del Gobierno italiano. |
| 10:15 | Via Condotti | 10 min | Por el camino | 7 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:45 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:15 | Piazza del Popolo | 10 min | Parada | 12 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 12:00 | Tiempo libre antes de la comida | 54 min | 🕐 Tiempo libre |  | ideas: Jardines del Pincio, Via Margutta, Via del Babuino |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 6 min andando | en Tridente y Spagna |
| 15:00 | Galería Borghese | 125 min | Parada · por dentro | 19 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 17:15 | Parque de Villa Borghese | 65 min | Parada | 8 min andando | Barca en el lago, bici o un rato a la sombra antes de subir al Pincio para el atardecer. |
| 18:45 | Terraza del Pincio | 40 min | 🌅 Atardecer | 11 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 19:30 | Aperitivo y paseo por Tridente y Spagna | 21 min | 🕐 Tiempo libre |  | ideas: Via Margutta, Via del Babuino |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:30 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — Excursión

**domingo 19 sep 2027** · 🌅 atardecer 19:13

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 4 — Vaticano, Castillo y Trastevere al atardecer

**lunes 20 sep 2027** · 🌅 atardecer 19:12 · día curado D2

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 25 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:45 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 14:00 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Borgo Pio | 10 min | Por el camino | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:30 | Via della Conciliazione | 5 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:45 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:15 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy cierra) | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 17:00 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:30 | Trastevere | 20 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Hoy cierra) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:15 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:00 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-26"></a>
## 26. 3 días · completo · Free Tour · sin experiencias · desde el lunes 18 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**lunes 18 oct 2027** · 🌅 atardecer 18:25 · día curado D3

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra. Tienes tiempo de sobra: el punto de encuentro del tour está a unos 10 min andando. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 13:00 | Comida: Supplizio | 90 min | 🍝 Comida | 8 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 25 min andando | Por la tarde hay menos cola que a media mañana. Tómatelo con calma, es la visita del día. Dentro de la Capilla Sixtina no se pueden hacer fotos. |
| 18:00 | Plaza de San Pedro | 25 min | Parada | 11 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 18:30 | Basílica de San Pedro | 80 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 20:00 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:15 | Cena: Il Sorpasso |  | 🍷 Cena | 4 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere

**martes 19 oct 2027** · 🌅 atardecer 18:23 · día curado D1-FT (invierno)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, con poca cola y todavía fresco. Hoy toca la Roma antigua, y no hay mejor forma de empezarla. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:30 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:15 | Plaza del Campidoglio | 25 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:45 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 13:00 | Altar de la Patria | 45 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:15 | Barrio Judío | 35 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:00 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:30 | Trastevere | 20 min | Parada | 8 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 17:00 | San Pietro in Montorio y Tempietto de Bramante | 40 min | Parada · por dentro | 9 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:45 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:15 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:15 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:30 | Aperitivo y paseo por Trastevere | 25 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere y Navona de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 22:30 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere y Navona de noche» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**miércoles 20 oct 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 18:22 · día curado D5C

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 15 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 25 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:30 | Ojo de la Cerradura del Aventino | 5 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 35 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:45 | Testaccio | 65 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 13:00 | Comida: Felice a Testaccio | 75 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:45 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:45 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:30 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:00 | Via dei Fori Imperiali | 32 min | 🌅 Atardecer | 8 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 18:45 | Monti | 55 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

## Caso de prueba: agosto sin fechas frente a 13-15 de agosto

### 3 días en agosto, sin fechas

**Avisos de fechas**: 
- **Ferragosto** · sin etiqueta en ningún día: Si tu viaje coincide con los días del 14 al 15 de agosto: los romanos se van a la playa y la ciudad está más tranquila que nunca.

- **Día 1 — Roma Antigua y el centro barroco**: 08:30 Coliseo · 10:00 Arco de Constantino · 10:30 Foro Romano y Palatino · 12:15 Plaza del Campidoglio · 12:45 Plaza Venecia · 13:00 Altar de la Patria · 15:15 Barrio Judío · 15:45 Fuente de las Tortugas · 16:00 Largo di Torre Argentina · 16:30 Panteón · 17:00 Elefantino de Bernini · 17:15 Iglesia de Santa Maria sopra Minerva · 17:45 Iglesia de San Luigi dei Francesi · 18:15 Piazza Navona · 19:00 Campo de' Fiori · 21:30 Fontana de Trevi (noche) · 22:30 Plaza de España (noche)
- **Día 2 — Vaticano, Castillo y Trastevere al atardecer**: 08:00 Museos Vaticanos y Capilla Sixtina · 11:15 Plaza de San Pedro · 11:45 Cúpula de San Pedro · 12:30 Basílica de San Pedro · 15:15 Borgo Pio · 15:30 Via della Conciliazione · 15:45 Puente Sant'Angelo · 16:15 Castillo de Sant'Angelo (por fuera: Hoy lo ves por fuera para llegar a todo lo del día) · 17:00 Iglesia de Santa Maria in Trastevere · 17:30 Trastevere · 18:45 San Pietro in Montorio y Tempietto de Bramante (por fuera: A esta hora ya ha cerrado) · 19:00 Fontana dell'Acqua Paola · 19:45 Mirador del Janículo · 22:00 Trastevere de noche
- **Día 3 — Trevi sin gente, el Pincio y la tarde en Monti**: 08:30 Fontana de Trevi · 09:00 Desayuno romano · 09:30 Iglesia de San Ignacio de Loyola · 10:00 Plaza Colonna · 10:15 Via Condotti · 10:45 Plaza de España · 11:15 Piazza del Popolo · 11:30 Santa Maria del Popolo · 12:15 Terraza del Pincio · 14:30 Parque de Villa Borghese · 16:30 Iglesia de Santa Maria della Vittoria · 17:15 Basílica de Santa María la Mayor · 18:00 Iglesia de San Pietro in Vincoli · 18:30 Monti · 19:45 Via dei Fori Imperiali · 22:00 Coliseo (noche)

### Los mismos 3 días, del 13 al 15 de agosto de 2027

**Avisos de fechas**: 
- **Ferragosto** · etiqueta «Ferragosto» en el día 2: Los Museos Vaticanos cierran el sábado 14 (Ferragosto) y el domingo 15 (Ferragosto). Hemos puesto tu visita el viernes 13 para que no los pierdas. El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer. El 15 de agosto el Panteón cierra por Ferragosto. Hemos puesto tu visita el sábado 14 para que no lo pierdas. Los romanos se van a la playa y la ciudad está más tranquila que nunca. Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.

- **Día 1 (viernes 13 ago 2027) — Vaticano, Castillo y Trastevere al atardecer**: 08:00 Museos Vaticanos y Capilla Sixtina · 11:15 Plaza de San Pedro · 11:45 Cúpula de San Pedro · 12:30 Basílica de San Pedro · 15:15 Borgo Pio · 15:30 Via della Conciliazione · 15:45 Puente Sant'Angelo · 16:15 Castillo de Sant'Angelo (por fuera: Hoy lo ves por fuera para llegar a todo lo del día) · 17:00 Iglesia de Santa Maria in Trastevere · 17:30 Trastevere · 18:45 San Pietro in Montorio y Tempietto de Bramante (por fuera: A esta hora ya ha cerrado) · 19:00 Fontana dell'Acqua Paola · 19:45 Mirador del Janículo · 22:00 Trastevere de noche
- **Día 2 (sábado 14 ago 2027) — Roma Antigua y el centro barroco**: 08:30 Coliseo · 10:00 Arco de Constantino · 10:30 Foro Romano y Palatino · 12:15 Plaza del Campidoglio · 12:45 Plaza Venecia · 13:00 Altar de la Patria · 15:15 Panteón · 15:45 Elefantino de Bernini · 16:00 Iglesia de Santa Maria sopra Minerva · 16:30 Iglesia de San Luigi dei Francesi · 17:00 Piazza Navona · 17:45 Largo di Torre Argentina · 18:00 Barrio Judío · 18:45 Fuente de las Tortugas · 19:00 Campo de' Fiori · 21:30 Fontana de Trevi (noche) · 22:30 Plaza de España (noche)
- **Día 3 (domingo 15 ago 2027) — Trevi sin gente, el Pincio y la tarde en Monti**: 08:30 Fontana de Trevi · 09:00 Desayuno romano · 09:30 Iglesia de San Ignacio de Loyola · 10:00 Plaza Colonna · 10:15 Via Condotti · 10:45 Plaza de España · 11:15 Piazza del Popolo · 11:30 Santa Maria del Popolo (por fuera: Todavía no ha abierto (abre a las 16:30)) · 12:00 Terraza del Pincio · 14:30 Parque de Villa Borghese · 16:30 Iglesia de Santa Maria della Vittoria · 17:15 Basílica de Santa María la Mayor · 18:00 Iglesia de San Pietro in Vincoli · 18:30 Monti · 19:45 Via dei Fori Imperiali · 22:00 Coliseo (noche)

Sin fechas el viaje es el de siempre (D1, D2, D4M) y la ventana solo dice "Si tu viaje coincide…", sin etiqueta. Con el 13-15, el Vaticano pasa al viernes 13 y la ventana cuenta el Ferragosto en su día.

## Auditoría automática

Todas las comprobaciones de siempre, para cada ruta (scripts/destino/auditoria.mjs). Tiene que salir todo a 0, o con la lista de lo que no se ha podido arreglar.

- **Lugar repetido en el mismo día**: 0 ✅
- **Lugar repetido otro día (salvo nocturnas y revisitas)**: 0 ✅
- **Lugar del pool fuera de la ruta**: 0 ✅
- **Parada fuera de su horario real de ese día**: 0 ✅
- **Mirador de atardecer después del sol (o texto de atardecer de noche)**: 0 ✅
- **Tramo de más de 25 min andando sin transporte**: 0 ✅
- **Hueco de más de 30 min sin nada entre dos paradas**: 0 ✅
- **Tiempo libre de más de 60 min**: 0 ✅
- **Tiempo libre que pisa la comida o la cena**: 0 ✅
- **Cena que empieza más de 20 min después de llegar, sin motivo**: 0 ✅
- **Zigzag: volver a una zona que ya se dejó ese día**: 0 ✅
- **Nivel 1-2 como "Por el camino"**: 0 ✅
- **Nivel 1-2 como "idea" de tiempo libre**: 0 ✅
- **Imprescindible de menos de 20 min**: 0 ✅
- **"Por fuera" con un tiempo distinto de su minutos_fuera**: 0 ✅
- **Aviso de fecha que promete algo que la ruta no hace**: 0 ✅
- **Aviso de fecha que nombra un lugar que no está en el viaje**: 0 ✅
- **Avisos de fecha repetidos**: 0 ✅
- **Texto de hora que no coincide con la hora real**: 0 ✅
- **Nota de temporada que promete algo que la ruta no hace**: 0 ✅
- **Parada de atardecer que acaba antes de que se ponga el sol**: 0 ✅
- **Lugar de una nocturna que ya salió de día ese mismo día**: 0 ✅
- **"Quedó fuera" con un lugar por el que pasa la ruta o con "No te dio tiempo" por un cierre**: 0 ✅
- **Iglesia o monumento antes que su plaza**: 0 ✅
- **Texto genérico en una nocturna o en "Roma iluminada"**: 0 ✅
- **Texto con solo_si_viene_de / solo_si_sigue que no se cumple**: 0 ✅
- **Tiempo libre con ideas de otra zona**: 0 ✅

## Recuento (Parte D)

- **Lugares repetidos en el mismo día**: 0 ✅
- **Monumentos (nivel 1-2) sin su propia línea**: 0 ✅
- **Lugares de nivel 1 o 2 como "Por el camino"**: 0 ✅
- **Plazas o puentes después de su monumento, fuera de las excepciones**: 0 ✅
- **Avisos amarillos de textos con hora (sin "temprano" ni hora_ok)**: 0 ✅
- **Títulos del día que prometen una hora que no se cumple**: 0 ✅
- **Filas con "Por qué aquí" genérico**: 0 ✅
- **Notas internas que se ven**: 0 ✅
- **Cifras y precios fuera de Tickets**: 0 ✅
- **"Por el camino" de más de 10 min**: 0 ✅
- **Tramos de más de 25 min andando sin transporte**: 0 ✅

### Cifras con permiso (`cifra_ok: true`)

Cada texto distinto una sola vez: lo que se queda con cifra a propósito.

- (en la ruta) A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día.
- (en la ruta) A primera hora casi no hay nadie, y bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Disfrútala ahora: con el tour volverás a pasar a media mañana y estará llena.
- (en la ruta) A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día.
- (en la ruta) A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves.
- (en la ruta) La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro.
- (en la ruta) La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma.
- (ficha de Fontana de Trevi) La fuente más famosa del mundo. 26 metros de altura, 50 de ancho — un escenario barroco tallado en la fachada de un palacio donde Neptuno domina las aguas desde su carro tirado por tritones y caballos marinos. Cada día se recogen unos 3.000€ en monedas del fondo, que se donan a Cáritas para proyectos sociales en Roma. La tradición: tira una moneda con la mano derecha por encima del hombro izquierdo y volverás a Roma.
- (ficha de Fontana de Trevi) No es una entrada: la fuente se ve gratis desde la plaza a cualquier hora. Para bajar a la zona junto al agua hay una tasa de 2 € de 9:00 a 22:00 (algunos días laborables, desde las 11:30). Antes y después, libre. Los residentes en Roma y los niños pequeños no pagan. Compruébalo en la web del Ayuntamiento.
- (ficha de Fontana de Trevi) La tradición original no era una moneda, sino beber agua de la fuente. La costumbre de la moneda viene de la película 'Tres monedas en la fuente' (1954) — y ahora genera más de 1 millón de euros al año para Cáritas.
