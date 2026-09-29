# Revisión final de v4: 35 viajes (5 fechas normales + los 30 del cierre), horas de 5 en 5

Motor v4 (días escritos), generado el 2026-09-29 con `node scripts/destino/revisionV4Final.mjs`. Sin arreglar nada: es para revisar que las rutas son bonitas.

- **Hora**: la que ve el usuario, de 5 en 5. **Tiempo**: minutos de visita (el atardecer es la hora real del sol).
- **Cómo sale en la app**: Parada / Por el camino / Por fuera (con su motivo) / 🌅 Atardecer / 🌙 Noche / 🍝 Comida / 🍷 Cena / 🕐 Tiempo libre.
- **Cómo llegas**: andando desde lo anterior (la comida, si va en medio), o el bus/metro del día ("🚌 Bus 118, 25 min").
- **Por qué aquí**: el `por_que` de la parada (lo que ve el viajero; la nota es interna) y sus avisos (⚠️). Al final, el recuento de la Parte D.

## Índice

| Nº | Días | Ritmo | Free Tour | Experiencias | Pool | Empieza | Avisos de fechas |
|---|---|---|---|---|---|---|---|
| [1](#ruta-1) | 2 | completo | no | sin experiencias | — | sábado 15 may 2027 · fin de semana A | Domingo 16 de mayo · Museos Vaticanos |
| [2](#ruta-2) | 3 | completo | no | sin experiencias | — | viernes 8 oct 2027 · fin de semana B | Domingo 10 de octubre · Museos Vaticanos |
| [3](#ruta-3) | 3 | completo | sí | sin experiencias | — | viernes 21 may 2027 · fin de semana C | Domingo 23 de mayo · Museos Vaticanos |
| [4](#ruta-4) | 3 | completo | no | sin experiencias | — | sábado 12 jun 2027 · fin de semana D | Domingo 13 de junio · Museos Vaticanos |
| [5](#ruta-5) | 4 | completo | no | sin experiencias | — | viernes 17 sep 2027 · fin de semana E | Domingo 19 de septiembre · Museos Vaticanos |
| [6](#ruta-6) | 2 | completo | no | sin experiencias | — | jueves 21 ene 2027 | — |
| [7](#ruta-7) | 3 | completo | no | sin experiencias | — | viernes 15 ene 2027 | Domingo 17 de enero · Museos Vaticanos |
| [8](#ruta-8) | 4 | completo | no | sin experiencias | — | jueves 4 feb 2027 | Domingo 7 de febrero · Museos Vaticanos |
| [9](#ruta-9) | 3 | completo | no | sin experiencias | — | viernes 19 feb 2027 | Domingo 21 de febrero · Museos Vaticanos |
| [10](#ruta-10) | 2 | completo | no | sin experiencias | — | martes 2 mar 2027 · 3 mar: audiencia papal (miércoles por la mañana) | — |
| [11](#ruta-11) | 3 | completo | sí | sin experiencias | — | sábado 6 mar 2027 | Primer domingo de mes · Museos gratis |
| [12](#ruta-12) | 4 | completo | no | sin experiencias | — | viernes 12 mar 2027 | Domingo 14 de marzo · Museos Vaticanos |
| [13](#ruta-13) | 2 | completo | sí | sin experiencias | — | sábado 10 abr 2027 | Domingo 11 de abril · Museos Vaticanos |
| [14](#ruta-14) | 3 | tranquilo | no | sin experiencias | — | jueves 15 abr 2027 | — |
| [15](#ruta-15) | 5 | completo | no | Barrios | — | lunes 19 abr 2027 · 21 abr: audiencia papal (miércoles por la mañana) | — |
| [16](#ruta-16) | 3 | completo | no | sin experiencias | — | domingo 2 may 2027 | Primer domingo de mes · Museos gratis |
| [17](#ruta-17) | 3 | completo | no | Arte | — | jueves 6 may 2027 | — |
| [18](#ruta-18) | 4 | completo | sí | sin experiencias | — | viernes 28 may 2027 | Domingo 30 de mayo · Museos Vaticanos |
| [19](#ruta-19) | 3 | tranquilo | sí | sin experiencias | — | viernes 4 jun 2027 | Domingo 6 de junio · Museos Vaticanos |
| [20](#ruta-20) | 2 | tranquilo | no | sin experiencias | — | sábado 19 jun 2027 | Domingo 20 de junio · Museos Vaticanos |
| [21](#ruta-21) | 3 | completo | no | Naturaleza | — | miércoles 23 jun 2027 · 23 jun: audiencia papal (miércoles por la mañana) | — |
| [22](#ruta-22) | 3 | completo | sí | sin experiencias | — | viernes 2 jul 2027 | Domingo 4 de julio · Museos Vaticanos |
| [23](#ruta-23) | 4 | tranquilo | no | sin experiencias | — | jueves 8 jul 2027 | Domingo 11 de julio · Museos Vaticanos |
| [24](#ruta-24) | 3 | completo | no | sin experiencias | — | sábado 24 jul 2027 | Domingo 25 de julio · Museos Vaticanos |
| [25](#ruta-25) | 2 | completo | no | sin experiencias | — | sábado 7 ago 2027 | Domingo 8 de agosto · Museos Vaticanos |
| [26](#ruta-26) | 5 | completo | sí | sin experiencias | — | lunes 23 ago 2027 · 25 ago: audiencia papal (miércoles por la mañana) | — |
| [27](#ruta-27) | 3 | completo | no | Barrios | — | viernes 3 sep 2027 | Domingo 5 de septiembre · Museos Vaticanos |
| [28](#ruta-28) | 3 | completo | sí | Arte | — | viernes 10 sep 2027 | Domingo 12 de septiembre · Museos Vaticanos |
| [29](#ruta-29) | 2 | completo | no | sin experiencias | — | martes 28 sep 2027 · 29 sep: audiencia papal (miércoles por la mañana) | Miércoles 29 de septiembre · Audiencia papal |
| [30](#ruta-30) | 4 | completo | no | Naturaleza | — | viernes 1 oct 2027 | Domingo 3 de octubre · Museos Vaticanos |
| [31](#ruta-31) | 3 | completo | no | sin experiencias | — | viernes 29 oct 2027 | Domingo 31 de octubre · Museos Vaticanos |
| [32](#ruta-32) | 3 | completo | sí | sin experiencias | — | viernes 12 nov 2027 | Domingo 14 de noviembre · Museos Vaticanos |
| [33](#ruta-33) | 2 | completo | no | sin experiencias | — | sábado 27 nov 2027 | Domingo 28 de noviembre · Museos Vaticanos |
| [34](#ruta-34) | 3 | completo | no | sin experiencias | — | viernes 10 dic 2027 | Mercadillo de Navidad en Piazza Navona · Domingo 12 de diciembre · Museos Vaticanos |
| [35](#ruta-35) | 5 | tranquilo | sí | sin experiencias | — | lunes 13 dic 2027 · 15 dic: audiencia papal (miércoles por la mañana) | — |

<a id="ruta-1"></a>
## 1. 2 días · completo · sin Free Tour · sin experiencias · desde el sábado 15 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:30. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 16 de mayo · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 15 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 15 may 2027** · 🌅 atardecer 20:23 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 55 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:10 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:25 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:00 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:00 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 16 may 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:24 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 40 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Ponte Sisto | 45 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

**Lo que quedó fuera**: nada.

<a id="ruta-2"></a>
## 2. 3 días · completo · sin Free Tour · sin experiencias · desde el viernes 8 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:45. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 10 de octubre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 9 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 8 oct 2027** · 🌅 atardecer 18:41 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo y paseo por Centro Histórico | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 9 oct 2027** · 🌅 atardecer 18:39 · día curado D2 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:50 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:05 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:25 | Trastevere | 45 min | Parada | 25 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 17:20 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 9 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:45 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:15 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:15 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:35 | Aperitivo y paseo por Trastevere | 55 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 10 oct 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:37 · día curado D4M (B, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 11:30 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:00 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 17 min andando | en Tridente y Spagna |
| 14:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:05 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 17:05 | Monti | 65 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 18:20 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 18:55 | Aperitivo y paseo por Monti | 45 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: Trattoria Monti |  | 🍷 Cena | 20 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-3"></a>
## 3. 3 días · completo · Free Tour · sin experiencias · desde el viernes 21 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 23 de mayo · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 21 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 21 may 2027** · 🌅 atardecer 20:29 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Aperitivo y paseo por Vaticano | 43 min | 🕐 Tiempo libre |  | ideas: Puente Sant'Angelo |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 22:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 22 may 2027** · 🌅 atardecer 20:30 · día curado D1-FT (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 125 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:20 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:50 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:10 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:25 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:50 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 70 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:05 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:20 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:50 | Mirador del Janículo | 55 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 24 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 23 may 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:31 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 60 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:10 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:00 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-4"></a>
## 4. 3 días · completo · sin Free Tour · sin experiencias · desde el sábado 12 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 13 de junio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 12 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 12 jun 2027** · 🌅 atardecer 20:45 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 80 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:50 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:20 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 13 jun 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:46 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 65 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:25 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**lunes 14 jun 2027** · 🌅 atardecer 20:46 · día curado D4M (D, lunes)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:15 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Edy | 105 min | 🍝 Comida | 13 min andando | en Tridente y Spagna |
| 15:10 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 20 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de San Clemente | 40 min | Parada · por dentro | 13 min andando | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 17:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:05 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:05 | Monti | 75 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-5"></a>
## 5. 4 días · completo · sin Free Tour · sin experiencias · desde el viernes 17 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 19 de septiembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 18 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 17 sep 2027** · 🌅 atardecer 19:17 · día curado D1 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 15:40 | Iglesia del Gesù | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:00)) | 5 min andando | La iglesia madre de los jesuitas, con una de las fachadas más copiadas del mundo. Si está abierta, entra: el techo pintado parece que se sale del marco. |
| 15:55 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:10 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:05 | Campo de' Fiori | 45 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 18:55 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 19:45 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 18 sep 2027** · 🌅 atardecer 19:15 · día curado D2 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:05 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:20 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:40 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:05 | Trastevere | 45 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:15 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:50 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:45 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, la Borghese y el Popolo

**domingo 19 sep 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:13 · día curado D4 (C, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:20 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Sgarro Bistrot | 75 min | 🍝 Comida | 22 min andando | en Tridente y Spagna |
| 14:50 | Ara Pacis | 45 min | Parada · por dentro | 5 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 15:40 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:15 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:15 | Parque de Villa Borghese | 50 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 18:15 | Jardines del Pincio | 30 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 18:50 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 19:45 | Cena: Poldo e Gianna Osteria |  | 🍷 Cena | 16 min andando | en Tridente y Spagna |
| 21:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 20 sep 2027** · 🌅 atardecer 19:12 · día curado D5C (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:50 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:00 | Mercados de Trajano | 60 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:10 | Monti | 30 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 18:50 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:45 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-6"></a>
## 6. 2 días · completo · sin Free Tour · sin experiencias · desde el jueves 21 ene 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:15 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**jueves 21 ene 2027** · 🌅 atardecer 17:11 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo en Campo de' Fiori y la Plaza Farnese | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 22 ene 2027** · 🌅 atardecer 17:12 · día curado D2 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 20 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:35 | Puente Sant'Angelo | 5 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 100 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:50 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:10 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 19:45 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:15 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-7"></a>
## 7. 3 días · completo · sin Free Tour · sin experiencias · desde el viernes 15 ene 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:00 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 17 de enero · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 16 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 15 ene 2027** · 🌅 atardecer 17:04 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo en Campo de' Fiori y la Plaza Farnese | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 16 ene 2027** · 🌅 atardecer 17:05 · día curado D2 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 15 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:10 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:40 | Castillo de Sant'Angelo | 100 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:45 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:05 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 19:40 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:10 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 17 ene 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:06 · día curado D4M (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 11:30 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:00 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 17 min andando | en Tridente y Spagna |
| 14:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:00 | Monti | 35 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 16:45 | Via dei Fori Imperiali | 40 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:30 | Mercados de Trajano | 60 min | Parada · por dentro | 7 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 20:00 | Cena: Trattoria Monti |  | 🍷 Cena | 19 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-8"></a>
## 8. 4 días · completo · sin Free Tour · sin experiencias · desde el jueves 4 feb 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:30 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 7 de febrero · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 4
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 5 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**jueves 4 feb 2027** · 🌅 atardecer 17:29 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo en Campo de' Fiori y la Plaza Farnese | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 5 feb 2027** · 🌅 atardecer 17:30 · día curado D2 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 40 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:35 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:55 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 16:05 | Castillo de Sant'Angelo | 100 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 18:10 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:30 | Trastevere al anochecer y aperitivo | 89 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, la Borghese y el Popolo

**sábado 6 feb 2027** · 🌅 atardecer 17:31 · día curado D4 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:20 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Edy | 55 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 14:30 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 15:25 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:00 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:15 | Jardines del Pincio | 50 min | Parada | 5 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 17:05 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 17:50 | Santa Maria del Popolo | 10 min | Por fuera (A esta hora ya ha cerrado) | 5 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 18:30 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada», antes de cenar · Del Pincio se baja sin cortes por Trinità dei Monti hasta la Plaza de España: la escalinata iluminada, la Barcaccia sonando y la Via Condotti con los escaparates encendidos. El final perfecto para un día de miradores. |
| 18:55 | Compras por Via del Corso y aperitivo | 26 min | 🕐 Tiempo libre |  | ideas: Via del Babuino, Via del Corso |
| 19:30 | Cena: Il Gabriello |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 7 feb 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:32 · día curado D5C (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:45 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:10 | Monti | 50 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 17:10 | Via dei Fori Imperiali | 40 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:55 | Mercados de Trajano | 60 min | Parada · por dentro | 7 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:55 | Paseo por Monti y los Foros iluminados y aperitivo | 57 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-9"></a>
## 9. 3 días · completo · sin Free Tour · sin experiencias · desde el viernes 19 feb 2027

**Nota de temporada**: En tus fechas anochece sobre las 17:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 21 de febrero · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 20 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 19 feb 2027** · 🌅 atardecer 17:48 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo en Campo de' Fiori y la Plaza Farnese | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 20 feb 2027** · 🌅 atardecer 17:49 · día curado D2 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:50 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:05 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:15 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:40 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:25 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:15 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:45 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 21 feb 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:50 · día curado D4M (B, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 11:30 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:00 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 17 min andando | en Tridente y Spagna |
| 14:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:05 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 17:05 | Monti | 40 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 17:55 | Roma iluminada desde los Foros | 20 min | 🌙 Noche | 9 min andando | La avenida de los Foros de noche: las ruinas iluminadas a los dos lados y el Coliseo encendido al fondo. |
| 18:30 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 18:55 | Paseo por Monti y los Foros iluminados y aperitivo | 45 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: Trattoria Monti |  | 🍷 Cena | 20 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-10"></a>
## 10. 2 días · completo · sin Free Tour · sin experiencias · desde el martes 2 mar 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:00. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**martes 2 mar 2027** · 🌅 atardecer 18:01 · día curado D2 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:50 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:05 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:15 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:40 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:25 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:35 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:55 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:25 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:55 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**miércoles 3 mar 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 18:02 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo y paseo por Centro Histórico | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-11"></a>
## 11. 3 días · completo · Free Tour · sin experiencias · desde el sábado 6 mar 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:00. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Primer domingo de mes · Museos gratis** · etiqueta «Museos gratis» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 6 para que no los pierdas.
  - El primer domingo de mes la entrada al Coliseo es gratis: habrá muchísima gente. Ese día no se reserva: las entradas se recogen en la taquilla por orden de llegada, así que ve temprano.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 6 mar 2027** · 🌅 atardecer 18:06 · día curado D3 (B, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber», antes de cenar · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |
| 20:45 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**domingo 7 mar 2027** · 🏷️ Museos gratis · 🌅 atardecer 18:07 · día curado D1-FT (B, domingo, fecha:primer_domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 85 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:40 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:10 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:30 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:45 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:15 | Trastevere | 20 min | Parada | 8 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 16:45 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 9 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:10 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:45 | Mirador del Janículo | 35 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:40 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:00 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 8 mar 2027** · 🌅 atardecer 18:08 · día curado D5C (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:50 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:55 | Monti | 45 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 17:50 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:00 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:25 | Aperitivo y paseo por Monti | 25 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-12"></a>
## 12. 4 días · completo · sin Free Tour · sin experiencias · desde el viernes 12 mar 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 14 de marzo · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 13 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 12 mar 2027** · 🌅 atardecer 18:13 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo y paseo por Centro Histórico | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 13 mar 2027** · 🌅 atardecer 18:14 · día curado D2 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:50 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:05 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:25 | Trastevere | 20 min | Parada | 25 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 16:55 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 9 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:20 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:50 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:50 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:10 | Trastevere al anochecer y aperitivo | 80 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, la Borghese y el Popolo

**domingo 14 mar 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:15 · día curado D4 (B, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:20 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Sgarro Bistrot | 75 min | 🍝 Comida | 22 min andando | en Tridente y Spagna |
| 14:50 | Ara Pacis | 45 min | Parada · por dentro | 5 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 15:40 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:15 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 20 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:05 | Parque de Villa Borghese | 35 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 17:50 | Terraza del Pincio | 40 min | 🌅 Atardecer | 11 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 19:00 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada», antes de cenar · Del Pincio se baja sin cortes por Trinità dei Monti hasta la Plaza de España: la escalinata iluminada, la Barcaccia sonando y la Via Condotti con los escaparates encendidos. El final perfecto para un día de miradores. |
| 20:00 | Cena: Poldo e Gianna Osteria |  | 🍷 Cena | 16 min andando | en Tridente y Spagna |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 15 mar 2027** · 🌅 atardecer 18:16 · día curado D5C (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:50 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:55 | Monti | 50 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 17:55 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:00 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:25 | Aperitivo y paseo por Monti | 25 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-13"></a>
## 13. 2 días · completo · Free Tour · sin experiencias · desde el sábado 10 abr 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:45. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 11 de abril · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 10 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**sábado 10 abr 2027** · 🌅 atardecer 19:45 · día curado D3 (D, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Aperitivo y paseo por Vaticano | 43 min | 🕐 Tiempo libre |  | ideas: Puente Sant'Angelo |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 22:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**domingo 11 abr 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:46 · día curado D1-FT (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 125 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:20 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:50 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:10 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:25 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:50 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 40 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:50 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:20 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-14"></a>
## 14. 3 días · tranquilo · sin Free Tour · sin experiencias · desde el jueves 15 abr 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:45. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**jueves 15 abr 2027** · 🌅 atardecer 19:51 · día curado D1 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:30 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:50 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:35 | Plaza Venecia | 10 min | Por el camino | 5 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:50 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Nonna Betta | 105 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:25 | Ponte Sisto | 45 min | 🌅 Atardecer | 12 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:55 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 16 abr 2027** · 🌅 atardecer 19:52 · día curado D2 (D, tranquilo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:40 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 12:05 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:15 | Comida: Borghiciana Pastificio Artigianale | 105 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:20 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:35 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:55 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:25 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:55 | Trastevere | 40 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:45 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:00 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:30 | Mirador del Janículo | 35 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi, el Pincio y la tarde en Monti

**sábado 17 abr 2027** · 🌅 atardecer 19:53 · día curado D4M (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Fontana de Trevi | 25 min | Parada | — | La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma. |
| 10:05 | Via Condotti | 10 min | Por el camino | 9 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:20 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:45 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 11:05 | Piazza del Popolo | 10 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:20 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:50 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:30 | Comida: Sgarro Bistrot | 105 min | 🍝 Comida | 9 min andando | en Tridente y Spagna |
| 14:40 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 20 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 22 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:50 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 17:50 | Monti | 95 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 19:35 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:30 | Cena: Trattoria Monti |  | 🍷 Cena | 20 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-15"></a>
## 15. 5 días · completo · sin Free Tour · Barrios · desde el lunes 19 abr 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:00. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**lunes 19 abr 2027** · 🌅 atardecer 19:55 · día curado D1 (D, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 45 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 16:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:55 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:20 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:35 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:55 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:20 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:55 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:35 | Ponte Sisto | 35 min | 🌅 Atardecer | 12 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**martes 20 abr 2027** · 🌅 atardecer 19:56 · día curado D2 (D, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 40 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. · experiencia: Barrios |
| 18:55 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:10 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:40 | Mirador del Janículo | 30 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, la Borghese y el Popolo

**miércoles 21 abr 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 19:57 · día curado D4 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:20 | Trinità dei Monti | 10 min | Por fuera (Todavía no ha abierto (abre a las 12:00)) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Edy | 105 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 15:20 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 16:15 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:50 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:50 | Parque de Villa Borghese | 40 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 18:40 | Jardines del Pincio | 60 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 19:40 | Terraza del Pincio | 30 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:30 | Cena: Il Gabriello |  | 🍷 Cena | 8 min andando | en Tridente y Spagna |
| 22:00 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — Excursión

**jueves 22 abr 2027** · 🌅 atardecer 19:58

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**viernes 23 abr 2027** · 🌅 atardecer 19:59 · día curado D5C (D, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. · experiencia: Barrios |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 35 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. · experiencia: Barrios |
| 19:45 | Via dei Fori Imperiali | 25 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-16"></a>
## 16. 3 días · completo · sin Free Tour · sin experiencias · desde el domingo 2 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Primer domingo de mes · Museos gratis** · etiqueta «Museos gratis» en el día 1
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el martes 4 para que no los pierdas.
  - El primer domingo de mes la entrada al Coliseo es gratis: habrá muchísima gente. Ese día no se reserva: las entradas se recogen en la taquilla por orden de llegada, así que ve temprano.

### Día 1 — Roma Antigua y el centro barroco

**domingo 2 may 2027** · 🏷️ Museos gratis · 🌅 atardecer 20:09 · día curado D1 (D, domingo, fecha:primer_domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 25 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:45 | Ponte Sisto | 45 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:45 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Trevi sin gente, el Pincio y la tarde en Monti

**lunes 3 may 2027** · 🌅 atardecer 20:10 · día curado D4M (D, lunes)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:15 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Edy | 105 min | 🍝 Comida | 13 min andando | en Tridente y Spagna |
| 15:10 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 20 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de San Clemente | 40 min | Parada · por dentro | 13 min andando | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 17:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:05 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:05 | Monti | 35 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 19:50 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:45 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

### Día 3 — Vaticano, Castillo y Trastevere al atardecer

**martes 4 may 2027** · 🌅 atardecer 20:11 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 45 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:00 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:15 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:45 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-17"></a>
## 17. 3 días · completo · sin Free Tour · Arte · desde el jueves 6 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**jueves 6 may 2027** · 🌅 atardecer 20:14 · día curado D1 (D, arte_museos)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:35 | Museos Capitolinos | 60 min | Parada · por dentro | 6 min andando | Los museos públicos más antiguos del mundo, en la plaza de Miguel Ángel. Dentro está la loba que amamanta a Rómulo y Remo, el símbolo de Roma, y la estatua original de Marco Aurelio a caballo. · experiencia: Arte |
| 16:45 | Largo di Torre Argentina | 15 min | Parada | 8 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 17:05 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. · experiencia: Arte |
| 17:30 | Elefantino de Bernini | 5 min | Por el camino | 5 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:45 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. · experiencia: Arte |
| 18:10 | Panteón | 35 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:50 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:25 | Campo de' Fiori | 15 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:50 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:45 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 7 may 2027** · 🌅 atardecer 20:15 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. · experiencia: Arte |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. · experiencia: Arte |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. · experiencia: Arte |
| 18:05 | Trastevere | 50 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:05 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. · experiencia: Arte |
| 19:20 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:50 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:45 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, la Borghese y el Popolo

**sábado 8 may 2027** · 🌅 atardecer 20:16 · día curado D4 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. · experiencia: Arte |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:20 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. · experiencia: Arte |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 13:30 | Comida: Edy | 105 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 15:20 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. · experiencia: Arte |
| 16:15 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:50 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. · experiencia: Arte |
| 17:50 | Parque de Villa Borghese | 45 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 18:45 | Jardines del Pincio | 60 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 19:50 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:45 | Cena: Il Gabriello |  | 🍷 Cena | 8 min andando | en Tridente y Spagna |
| 22:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

**Lo que quedó fuera**: nada.

<a id="ruta-18"></a>
## 18. 4 días · completo · Free Tour · sin experiencias · desde el viernes 28 may 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 20:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 30 de mayo · Museos Vaticanos** · etiqueta «Último domingo de mes» en el día 3
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el viernes 28.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 28 may 2027** · 🌅 atardecer 20:35 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Aperitivo y paseo por Vaticano | 43 min | 🕐 Tiempo libre |  |  |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 22:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 29 may 2027** · 🌅 atardecer 20:36 · día curado D1-FT (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 125 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:20 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:50 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:10 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:25 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:50 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:10 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:25 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:55 | Mirador del Janículo | 55 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 24 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**domingo 30 may 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 20:37 · día curado D4 (D, con_free_tour, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:45 | Puente Sant'Angelo | 10 min | Parada | — | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 09:00 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 🚌 Un taxi, 20 min | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Sgarro Bistrot | 105 min | 🍝 Comida | 22 min andando | en Tridente y Spagna |
| 15:20 | Ara Pacis | 45 min | Parada · por dentro | 5 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 16:10 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:45 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:00 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:45 | Parque de Villa Borghese | 75 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 19:10 | Jardines del Pincio | 60 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 20:10 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 21:15 | Cena: Poldo e Gianna Osteria |  | 🍷 Cena | 16 min andando | en Tridente y Spagna |
| 23:00 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 31 may 2027** · 🌅 atardecer 20:38 · día curado D5C (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 70 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:20 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-19"></a>
## 19. 3 días · tranquilo · Free Tour · sin experiencias · desde el viernes 4 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos pensado tu ruta para que la disfrutes sin agobios.

> **Banner del viaje**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 6 de junio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 4 para que no los pierdas.

### Día 1 — Free Tour por el centro y el Vaticano por la tarde

**viernes 4 jun 2027** · 🌅 atardecer 20:41 · día curado D3 (D, tranquilo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | — | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Aperitivo y paseo por Vaticano | 43 min | 🕐 Tiempo libre |  | ideas: Puente Sant'Angelo |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:55 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 5 jun 2027** · 🌅 atardecer 20:41 · día curado D1-FT (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:45 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:15 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:35 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 5 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 105 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:00 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:30 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:50 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:05 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:30 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:25 | Trastevere | 100 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:15 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:30 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:00 | Mirador del Janículo | 55 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:30 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 24 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 6 jun 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:42 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:30 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:55 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 11:15 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 75 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:25 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-20"></a>
## 20. 2 días · tranquilo · sin Free Tour · sin experiencias · desde el sábado 19 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 20 de junio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 19 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 19 jun 2027** · 🌅 atardecer 20:48 · día curado D2 (D, tranquilo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:40 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 12:05 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:15 | Comida: Borghiciana Pastificio Artigianale | 105 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:20 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:35 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:55 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:25 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:55 | Trastevere | 90 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:50 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:25 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 20 jun 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:48 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:30 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:50 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:35 | Plaza Venecia | 10 min | Por el camino | 5 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:50 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Nonna Betta | 105 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 65 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:25 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

**Lo que quedó fuera**: nada.

<a id="ruta-21"></a>
## 21. 3 días · completo · sin Free Tour · Naturaleza · desde el miércoles 23 jun 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**miércoles 23 jun 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 20:49 · día curado D1 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 65 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:25 | Ponte Sisto | 50 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. · experiencia: Naturaleza |
| 21:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**jueves 24 jun 2027** · 🌅 atardecer 20:49 · día curado D2 (D, naturaleza_vistas)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. · experiencia: Naturaleza |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 80 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:50 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. · experiencia: Naturaleza |
| 20:25 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. · experiencia: Naturaleza |
| 21:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**viernes 25 jun 2027** · 🌅 atardecer 20:49 · día curado D4M (D, naturaleza_vistas)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. · experiencia: Naturaleza |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. · experiencia: Naturaleza |
| 12:15 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. · experiencia: Naturaleza |
| 13:00 | Comida: Edy | 105 min | 🍝 Comida | 13 min andando | en Tridente y Spagna |
| 15:10 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 20 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de San Clemente | 40 min | Parada · por dentro | 13 min andando | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 17:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:05 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:05 | Monti | 75 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:30 | Cena: Trattoria Monti |  | 🍷 Cena | 20 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-22"></a>
## 22. 3 días · completo · Free Tour · sin experiencias · desde el viernes 2 jul 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 4 de julio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 2 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 2 jul 2027** · 🌅 atardecer 20:49 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Aperitivo y paseo por Vaticano | 43 min | 🕐 Tiempo libre |  | ideas: Puente Sant'Angelo |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 22:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 3 jul 2027** · 🌅 atardecer 20:49 · día curado D1-FT (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 125 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:20 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:50 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:10 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:25 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:50 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 85 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:20 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:35 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:10 | Mirador del Janículo | 55 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:30 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 24 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 4 jul 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:49 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 80 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-23"></a>
## 23. 4 días · tranquilo · sin Free Tour · sin experiencias · desde el jueves 8 jul 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

> **Banner del viaje**: Hemos preparado tu ruta con calma: empiezas a las 10:00, comes sin prisa y tienes ratos libres para disfrutar de Roma a tu aire. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 11 de julio · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 4
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 9 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**jueves 8 jul 2027** · 🌅 atardecer 20:47 · día curado D1 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:30 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:50 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:35 | Plaza Venecia | 10 min | Por el camino | 5 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:50 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:45 | Comida: Nonna Betta | 105 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 65 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:25 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 9 jul 2027** · 🌅 atardecer 20:47 · día curado D2 (D, tranquilo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:40 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 12:05 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:15 | Comida: Borghiciana Pastificio Artigianale | 105 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:20 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:35 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:55 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:25 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:55 | Trastevere | 90 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:50 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:20 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi, la Borghese y el Popolo

**sábado 10 jul 2027** · 🌅 atardecer 20:47 · día curado D4 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Fontana de Trevi | 25 min | Parada | — | La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma. |
| 10:05 | Via Condotti | 10 min | Por el camino | 9 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:20 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 16 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Edy | 105 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 15:20 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 16:15 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:50 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:50 | Parque de Villa Borghese | 80 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 19:20 | Jardines del Pincio | 65 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 20:25 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 21:15 | Cena: Il Gabriello |  | 🍷 Cena | 8 min andando | en Tridente y Spagna |
| 23:00 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 11 jul 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:46 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:30 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:55 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 11:15 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 75 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:25 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-24"></a>
## 24. 3 días · completo · sin Free Tour · sin experiencias · desde el sábado 24 jul 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 25 de julio · Museos Vaticanos** · etiqueta «Último domingo de mes» en el día 2
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 24.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 24 jul 2027** · 🌅 atardecer 20:37 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 70 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:25 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:40 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 20:10 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 25 jul 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 20:36 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 55 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:15 | Ponte Sisto | 45 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**lunes 26 jul 2027** · 🌅 atardecer 20:35 · día curado D4M (D, lunes)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:15 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Edy | 105 min | 🍝 Comida | 13 min andando | en Tridente y Spagna |
| 15:10 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 20 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de San Clemente | 40 min | Parada · por dentro | 13 min andando | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 17:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:05 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:05 | Monti | 60 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:15 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:00 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-25"></a>
## 25. 2 días · completo · sin Free Tour · sin experiencias · desde el sábado 7 ago 2027

**Nota de temporada**: En verano Roma aprieta: hemos intentado poner las visitas principales a primera hora de la mañana para que evites la multitud y el calor.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 8 de agosto · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 7 para que no los pierdas.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 7 ago 2027** · 🌅 atardecer 20:22 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 100 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:45 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:35 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 8 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:05 | Trastevere | 55 min | Parada | 7 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 19:10 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 19:25 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:55 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 21:00 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 8 ago 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:20 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 120 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:40 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:05 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:20 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:40 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:15 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:55 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:45 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

**Lo que quedó fuera**: nada.

<a id="ruta-26"></a>
## 26. 5 días · completo · Free Tour · sin experiencias · desde el lunes 23 ago 2027

**Nota de temporada**: En verano Roma aprieta: hemos pensado tu ruta para que la disfrutes sin agobios.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**lunes 23 ago 2027** · 🌅 atardecer 19:59 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Aperitivo y paseo por Vaticano | 51 min | 🕐 Tiempo libre |  | ideas: Via della Conciliazione |
| 20:30 | Cena: Il Sorpasso |  | 🍷 Cena | 4 min andando | en Vaticano |
| 22:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**martes 24 ago 2027** · 🌅 atardecer 19:57 · día curado D1-FT (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 125 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:20 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:50 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:10 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:25 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:50 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 40 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 18:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:50 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:20 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:45 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 24 min andando | en Trastevere |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**miércoles 25 ago 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 19:56 · día curado D4 (D, con_free_tour)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:45 | Puente Sant'Angelo | 10 min | Parada | — | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 09:00 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 🚌 Un taxi, 20 min | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Edy | 105 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 15:20 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 16:15 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:50 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:00 | Santa Maria del Popolo | 35 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:50 | Parque de Villa Borghese | 40 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 18:40 | Jardines del Pincio | 60 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 19:40 | Terraza del Pincio | 35 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:30 | Cena: Il Gabriello |  | 🍷 Cena | 8 min andando | en Tridente y Spagna |
| 22:00 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — Excursión

**jueves 26 ago 2027** · 🌅 atardecer 19:54

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**viernes 27 ago 2027** · 🌅 atardecer 19:53 · día curado D5C (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:20 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Mercados de Trajano | 80 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 35 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 19:45 | Via dei Fori Imperiali | 20 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-27"></a>
## 27. 3 días · completo · sin Free Tour · Barrios · desde el viernes 3 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:45. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 5 de septiembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 4 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 3 sep 2027** · 🌅 atardecer 19:41 · día curado D1 (C, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:30 | Barrio Judío | 45 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:00 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:25 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:00 | Piazza Navona | 35 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:40 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. · experiencia: Barrios |
| 19:15 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:15 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:55 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 4 sep 2027** · 🌅 atardecer 19:39 · día curado D2 (C, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:05 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:20 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:40 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:05 | Trastevere | 70 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. · experiencia: Barrios |
| 18:25 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:40 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:15 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:15 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 5 sep 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:38 · día curado D4M (C, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 11:30 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:00 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Sgarro Bistrot | 105 min | 🍝 Comida | 17 min andando | en Tridente y Spagna |
| 15:10 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 20 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:45 | Basílica de San Clemente | 40 min | Parada · por dentro | 13 min andando | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 17:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 18:00 | Monti | 70 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. · experiencia: Barrios |
| 19:20 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:15 | Cena: Trattoria Monti |  | 🍷 Cena | 20 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-28"></a>
## 28. 3 días · completo · Free Tour · Arte · desde el viernes 10 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:30. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 12 de septiembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 10 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 10 sep 2027** · 🌅 atardecer 19:29 · día curado D3 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:00 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 21:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber» · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 11 sep 2027** · 🌅 atardecer 19:27 · día curado D1-FT (C, arte_museos)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 105 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:05 | Museos Capitolinos | 60 min | Parada · por dentro | 6 min andando | Los museos públicos más antiguos del mundo, en la plaza de Miguel Ángel. Dentro está la loba que amamanta a Rómulo y Remo, el símbolo de Roma, y la estatua original de Marco Aurelio a caballo. · experiencia: Arte |
| 16:15 | Barrio Judío | 25 min | Parada | 11 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:50 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 17:15 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. · experiencia: Arte |
| 17:50 | Iglesia de Santa Maria in Trastevere | 15 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. · experiencia: Arte |
| 18:15 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 8 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. · experiencia: Arte |
| 18:30 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 19:00 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:15 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 24 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**domingo 12 sep 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:26 · día curado D4 (C, con_free_tour, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:45 | Puente Sant'Angelo | 10 min | Parada | — | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 09:00 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. · experiencia: Arte |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 🚌 Un taxi, 20 min | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 13:30 | Comida: Sgarro Bistrot | 75 min | 🍝 Comida | 22 min andando | en Tridente y Spagna |
| 14:50 | Ara Pacis | 45 min | Parada · por dentro | 5 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. · experiencia: Arte |
| 15:40 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:15 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. · experiencia: Arte |
| 17:15 | Parque de Villa Borghese | 65 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 18:30 | Jardines del Pincio | 30 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 19:00 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 20:00 | Cena: Poldo e Gianna Osteria |  | 🍷 Cena | 16 min andando | en Tridente y Spagna |
| 21:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

**Lo que quedó fuera**: nada.

<a id="ruta-29"></a>
## 29. 2 días · completo · sin Free Tour · sin experiencias · desde el martes 28 sep 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:00. Hemos pensado tu ruta para que aproveches cada hora.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Miércoles 29 de septiembre · Audiencia papal** · etiqueta «Audiencia papal» en el día 2
  - Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro. Mientras tanto, el Castillo; la plaza y la Basílica, después de comer, cuando ya han abierto.

### Día 1 — Roma Antigua y el centro barroco

**martes 28 sep 2027** · 🌅 atardecer 18:58 · día curado D1 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Giggetto al Portico d'Ottavia | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 15:40 | Iglesia del Gesù | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:00)) | 5 min andando | La iglesia madre de los jesuitas, con una de las fachadas más copiadas del mundo. Si está abierta, entra: el techo pintado parece que se sale del marco. |
| 15:55 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:10 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:05 | Campo de' Fiori | 25 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 18:35 | Ponte Sisto | 35 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 19:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**miércoles 29 sep 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🏷️ Audiencia papal · 🌅 atardecer 18:56 · día curado D2 (C, miercoles)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Borgo Pio | 10 min | Por el camino | 10 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 11:30 | Puente Sant'Angelo | 10 min | Parada | 9 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 11:40 | Castillo de Sant'Angelo | 75 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 13:15 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 6 min andando | en Vaticano y Borgo |
| 14:35 | Plaza de San Pedro | 25 min | Parada | 7 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 15:05 | Basílica de San Pedro | 75 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 16:35 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 🚌 Bus 23 por el Lungotevere, 15 min | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 16:55 | Trastevere | 40 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 17:45 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:00 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:35 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-30"></a>
## 30. 4 días · completo · sin Free Tour · Naturaleza · desde el viernes 1 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 19:00. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 3 de octubre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 2 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 1 oct 2027** · 🌅 atardecer 18:53 · día curado D1 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:30 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 15:40 | Iglesia del Gesù | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:00)) | 5 min andando | La iglesia madre de los jesuitas, con una de las fachadas más copiadas del mundo. Si está abierta, entra: el techo pintado parece que se sale del marco. |
| 15:55 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:10 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 5 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Piazza Navona | 30 min | Parada | 7 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:05 | Campo de' Fiori | 25 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 18:35 | Ponte Sisto | 30 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. · experiencia: Naturaleza |
| 19:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 2 oct 2027** · 🌅 atardecer 18:51 · día curado D2 (C, naturaleza_vistas)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. · experiencia: Naturaleza |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:05 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:20 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:40 | Iglesia de Santa Maria in Trastevere | 25 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:05 | Trastevere | 40 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 17:55 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 9 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 18:10 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. · experiencia: Naturaleza |
| 18:40 | Mirador del Janículo | 30 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. · experiencia: Naturaleza |
| 19:30 | Cena: Tonnarello |  | 🍷 Cena | 13 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, la Borghese y el Popolo

**domingo 3 oct 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:49 · día curado D4 (C, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:20 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. · experiencia: Naturaleza |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 18 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Sgarro Bistrot | 75 min | 🍝 Comida | 22 min andando | en Tridente y Spagna |
| 14:50 | Ara Pacis | 45 min | Parada · por dentro | 5 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 15:40 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:15 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:15 | Parque de Villa Borghese | 40 min | Parada | 16 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. · experiencia: Naturaleza |
| 18:05 | Jardines del Pincio | 35 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. · experiencia: Naturaleza |
| 18:40 | Terraza del Pincio | 25 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. · experiencia: Naturaleza |
| 19:30 | Cena: Poldo e Gianna Osteria |  | 🍷 Cena | 16 min andando | en Tridente y Spagna |
| 21:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 4 oct 2027** · 🌅 atardecer 18:47 · día curado D5C (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. · experiencia: Naturaleza |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 30 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:50 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:00 | Mercados de Trajano | 60 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:25 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 7 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-31"></a>
## 31. 3 días · completo · sin Free Tour · sin experiencias · desde el viernes 29 oct 2027

**Nota de temporada**: Buena época para Roma: se camina a gusto y hay luz hasta las 18:15. Hemos pensado tu ruta para que aproveches cada hora.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 31 de octubre · Museos Vaticanos** · etiqueta «Último domingo de mes» en el día 3
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 30.

### Día 1 — Roma Antigua y el centro barroco

**viernes 29 oct 2027** · 🌅 atardecer 18:09 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo y paseo por Centro Histórico | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 30 oct 2027** · 🌅 atardecer 18:07 · día curado D2 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:50 | Puente Sant'Angelo | 15 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:05 | Castillo de Sant'Angelo | 55 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:25 | Trastevere | 20 min | Parada | 25 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 16:55 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 9 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:20 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:45 | Mirador del Janículo | 35 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:40 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:00 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 31 oct 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 17:06 · día curado D4M (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 11:30 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:00 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 17 min andando | en Tridente y Spagna |
| 14:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:00 | Monti | 35 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 16:45 | Via dei Fori Imperiali | 40 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:30 | Mercados de Trajano | 60 min | Parada · por dentro | 7 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 20:00 | Cena: Trattoria Monti |  | 🍷 Cena | 19 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-32"></a>
## 32. 3 días · completo · Free Tour · sin experiencias · desde el viernes 12 nov 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 14 de noviembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 12 para que no los pierdas.

### Día 1 — Trevi sin gente, Free Tour y Vaticano por la tarde

**viernes 12 nov 2027** · 🌅 atardecer 16:52 · día curado D3 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 20:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Castillo y el Tíber», antes de cenar · A cinco minutos de la cena tienes el Puente Sant'Angelo: los ángeles de Bernini iluminados y el Castillo reflejado en el Tíber. Crúzalo despacio y vuelve por la orilla del río, que a esta hora está tranquila. |
| 20:45 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 13 nov 2027** · 🌅 atardecer 16:51 · día curado D1-FT (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 55 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:10 | Barrio Judío | 20 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 14:35 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 14:55 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:10 | Isla Tiberina | 15 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 15:35 | Trastevere | 35 min | Parada | 8 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 16:25 | Mirador del Janículo | 40 min | 🌅 Atardecer | 🚌 Bus 115, 15 min | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 17:20 | Fontana dell'Acqua Paola | 10 min | Parada | 16 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:35 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (A esta hora ya ha cerrado) | 5 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. |
| 17:55 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 7 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:15 | Trastevere al anochecer y aperitivo | 64 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto, Plaza Farnese |
| 19:30 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 11 min andando | en Trastevere |
| 21:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 14 nov 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 16:51 · día curado D5C (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:00 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 25 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:45 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:30 | Via dei Fori Imperiali | 40 min | 🌅 Atardecer | 8 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:15 | Mercados de Trajano | 60 min | Parada · por dentro | 7 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:30 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 18:55 | Paseo por Monti y los Foros iluminados y aperitivo | 57 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-33"></a>
## 33. 2 días · completo · sin Free Tour · sin experiencias · desde el sábado 27 nov 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 28 de noviembre · Museos Vaticanos** · etiqueta «Último domingo de mes» en el día 2
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 27.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 27 nov 2027** · 🌅 atardecer 16:42 · día curado D2 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 15 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:10 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:40 | Castillo de Sant'Angelo | 75 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:20 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:40 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 19:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 28 nov 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 16:41 · día curado D1 (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo en Campo de' Fiori y la Plaza Farnese | 54 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-34"></a>
## 34. 3 días · completo · sin Free Tour · sin experiencias · desde el viernes 10 dic 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Mercadillo de Navidad en Piazza Navona** · etiqueta «Mercadillo de Navidad en Piazza Navona» en el día 1
  - Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad.
- **Domingo 12 de diciembre · Museos Vaticanos** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 11 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 10 dic 2027** · 🏷️ Mercadillo de Navidad en Piazza Navona · 🌅 atardecer 16:39 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:20 | Foro Romano y Palatino | 105 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 10 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 30 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:25 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:40 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:30 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:30 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:00 | Aperitivo en Campo de' Fiori y la Plaza Farnese | 53 min | 🕐 Tiempo libre |  | ideas: Plaza Farnese, Ponte Sisto, Plaza Trilussa |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 11 dic 2027** · 🌅 atardecer 16:39 · día curado D2 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 15 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:10 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 15:40 | Castillo de Sant'Angelo | 75 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:20 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:40 | Trastevere al anochecer y aperitivo | 90 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto |
| 19:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi sin gente, el Pincio y la tarde en Monti

**domingo 12 dic 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 16:39 · día curado D4M (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 15 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:20 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:45 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | La calle de los anticuarios, entre la Piazza del Popolo y la Plaza de España. |
| 10:55 | Piazza del Popolo | 15 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 10 min | Por fuera (Todavía no ha abierto (abre a las 16:30)) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 11:30 | Terraza del Pincio | 20 min | Parada | 6 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 12:00 | Parque de Villa Borghese | 30 min | Parada | 12 min andando | Cruzas el gran parque de Roma hasta el Pincio. Por el camino pasas junto al lago y su templete, uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Sgarro Bistrot | 90 min | 🍝 Comida | 17 min andando | en Tridente y Spagna |
| 14:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:35 | Iglesia de San Pietro in Vincoli | 25 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:20 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 8 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:00 | Mercados de Trajano | 60 min | Parada · por dentro | 7 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:30 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 18:55 | Paseo por Monti y los Foros iluminados y aperitivo | 46 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano |
| 20:00 | Cena: Trattoria Monti |  | 🍷 Cena | 19 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-35"></a>
## 35. 5 días · tranquilo · Free Tour · sin experiencias · desde el lunes 13 dic 2027

**Nota de temporada**: En tus fechas anochece sobre las 16:45 y muchos monumentos cierran antes. Hemos adaptado tu ruta para que llegues a todo y veas Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Free Tour por el centro y el Vaticano por la tarde

**lunes 13 dic 2027** · 🌅 atardecer 16:39 · día curado D3 (A, tranquilo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Free Tour Centro Histórico | 150 min | Parada (Free Tour) | — | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma el primer día. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:35 | Panteón | 30 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 17:55 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Borgo Pio | 10 min | Por el camino | 7 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 19:35 | Paseo por Via della Conciliazione y el Castillo iluminados y aperitivo | 58 min | 🕐 Tiempo libre |  | ideas: Via della Conciliazione |
| 20:45 | Cena: L'Arcangelo |  | 🍷 Cena | 12 min andando | en Vaticano |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**martes 14 dic 2027** · 🌅 atardecer 16:39 · día curado D1-FT (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:45 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:15 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:35 | Foro Romano y Palatino | 100 min | Parada · por dentro | 9 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:20 | Plaza Venecia | 10 min | Por el camino | 5 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:35 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 55 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:10 | Barrio Judío | 20 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 14:35 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 14:55 | Teatro de Marcelo | 5 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:10 | Isla Tiberina | 15 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 15:35 | Trastevere | 35 min | Parada | 8 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de subir al mirador, que es lo que hacen los romanos. |
| 16:25 | Mirador del Janículo | 30 min | 🌅 Atardecer | 🚌 Bus 115, 15 min | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 17:10 | Fontana dell'Acqua Paola | 10 min | Parada | 16 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:25 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Parada · por dentro | 5 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:40 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 7 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:00 | Trastevere al anochecer y aperitivo | 79 min | 🕐 Tiempo libre |  | ideas: Plaza Trilussa, Ponte Sisto, Plaza Farnese |
| 19:30 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 11 min andando | en Trastevere |
| 21:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**miércoles 15 dic 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 16:40 · día curado D4 (A, con_free_tour)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:45 | Puente Sant'Angelo | 10 min | Parada | — | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. Desde aquí sigues por la orilla del río hasta Trastevere. |
| 09:00 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 11:00 | Galería Borghese | 120 min | Parada · por dentro | 🚌 Un taxi, 20 min | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:30 | Comida: Edy | 55 min | 🍝 Comida | 19 min andando | en Tridente y Spagna |
| 14:30 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 15:25 | Via Margutta | 30 min | Parada | 7 min andando | La calle escondida de los pintores, donde vivió Fellini y donde estaba la casa de Gregory Peck en Vacaciones en Roma. |
| 16:00 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:15 | Jardines del Pincio | 25 min | Parada | 5 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:40 | Terraza del Pincio | 20 min | 🌅 Atardecer | 2 min andando | El atardecer más clásico de Roma: las cúpulas, con San Pedro al fondo, sobre la Piazza del Popolo. Los romanos vienen aquí a ver ponerse el sol; haz como ellos. |
| 17:05 | Santa Maria del Popolo | 25 min | Parada · por dentro | 5 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 18:00 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada», antes de cenar · Del Pincio se baja sin cortes por Trinità dei Monti hasta la Plaza de España: la escalinata iluminada, la Barcaccia sonando y la Via Condotti con los escaparates encendidos. El final perfecto para un día de miradores. |
| 18:25 | Luces de Navidad por Via del Corso y Via Condotti, y aperitivo | 56 min | 🕐 Tiempo libre |  | ideas: Via del Babuino, Via del Corso |
| 19:30 | Cena: Il Gabriello |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |

### Día 4 — Excursión

**jueves 16 dic 2027** · 🌅 atardecer 16:40

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**viernes 17 dic 2027** · 🌅 atardecer 16:40 · día curado D5C (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 10:00 | Boca de la Verdad | 20 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:30 | Jardín de los Naranjos | 20 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:55 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 11:15 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:30 | Testaccio | 45 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:45 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 16:20 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 8 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:30 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 17:55 | Tarde libre | 115 min | 🕐 Tiempo libre |  | ideas: Columna de Trajano, Palazzo Doria Pamphilj |
| 20:00 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |

**Lo que quedó fuera**: nada.

## Caso de prueba: agosto sin fechas frente a 13-15 de agosto

### 3 días en agosto, sin fechas

**Avisos de fechas**: 
- **Ferragosto** · sin etiqueta en ningún día: Si tu viaje coincide con los días del 14 al 15 de agosto: los romanos se van a la playa y la ciudad está más tranquila que nunca.

- **Día 1 — Roma Antigua y el centro barroco**: 08:30 Coliseo · 10:00 Arco de Constantino · 10:20 Foro Romano y Palatino · 12:05 Plaza del Campidoglio · 12:20 Plaza Venecia · 12:35 Altar de la Patria · 15:30 Barrio Judío · 16:05 Fuente de las Tortugas · 16:20 Largo di Torre Argentina · 16:40 Iglesia del Gesù · 17:05 Iglesia de Santa Maria sopra Minerva · 17:20 Elefantino de Bernini · 17:40 Iglesia de San Luigi dei Francesi · 18:05 Panteón · 18:40 Piazza Navona · 19:15 Campo de' Fiori · 19:50 Ponte Sisto · 22:30 Fontana de Trevi (noche)
- **Día 2 — Vaticano, Castillo y Trastevere al atardecer**: 08:00 Museos Vaticanos y Capilla Sixtina · 11:10 Plaza de San Pedro · 11:35 Cúpula de San Pedro · 12:20 Basílica de San Pedro · 15:15 Via della Conciliazione · 15:30 Puente Sant'Angelo · 15:45 Castillo de Sant'Angelo · 17:05 Iglesia de Santa Maria in Trastevere · 17:35 Basílica de Santa Cecilia in Trastevere · 18:05 Trastevere · 19:00 San Pietro in Montorio y Tempietto de Bramante (por fuera: A esta hora ya ha cerrado) · 19:15 Fontana dell'Acqua Paola · 19:45 Mirador del Janículo · 22:30 Trastevere de noche
- **Día 3 — Trevi sin gente, el Pincio y la tarde en Monti**: 08:30 Fontana de Trevi · 09:00 Desayuno romano · 09:20 Iglesia de San Ignacio de Loyola · 09:45 Via Condotti · 10:05 Plaza de España · 10:25 Trinità dei Monti · 10:40 Via del Babuino · 10:55 Piazza del Popolo · 11:15 Santa Maria del Popolo · 11:45 Terraza del Pincio · 12:15 Parque de Villa Borghese · 15:10 Basílica de Santa María la Mayor · 16:00 Basílica de San Juan de Letrán · 16:45 Basílica de San Clemente · 17:35 Iglesia de San Pietro in Vincoli · 18:05 Mercados de Trajano · 19:05 Monti · 19:55 Via dei Fori Imperiali · 22:30 Coliseo (noche)

### Los mismos 3 días, del 13 al 15 de agosto de 2027

**Avisos de fechas**: 
- **Ferragosto** · etiqueta «Ferragosto» en el día 2: Los Museos Vaticanos cierran el sábado 14 (Ferragosto) y el domingo 15 (Ferragosto). Hemos puesto tu visita el viernes 13 para que no los pierdas. El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer. El 15 de agosto el Panteón cierra por Ferragosto. Hemos puesto tu visita el sábado 14 para que no lo pierdas. Los romanos se van a la playa y la ciudad está más tranquila que nunca. Muchos restaurantes cierran o tienen menú especial: reserva la comida y la cena.

- **Día 1 (viernes 13 ago 2027) — Vaticano, Castillo y Trastevere al atardecer**: 08:00 Museos Vaticanos y Capilla Sixtina · 11:10 Plaza de San Pedro · 11:35 Cúpula de San Pedro · 12:20 Basílica de San Pedro · 15:15 Via della Conciliazione · 15:30 Puente Sant'Angelo · 15:45 Castillo de Sant'Angelo · 17:05 Iglesia de Santa Maria in Trastevere · 17:35 Basílica de Santa Cecilia in Trastevere · 18:05 Trastevere · 19:00 San Pietro in Montorio y Tempietto de Bramante (por fuera: A esta hora ya ha cerrado) · 19:15 Fontana dell'Acqua Paola · 19:50 Mirador del Janículo · 22:30 Trastevere de noche
- **Día 2 (sábado 14 ago 2027) — Roma Antigua y el centro barroco**: 08:30 Coliseo · 10:00 Arco de Constantino · 10:20 Foro Romano y Palatino · 12:05 Plaza del Campidoglio · 12:20 Plaza Venecia · 12:35 Altar de la Patria · 15:10 Panteón · 15:45 Elefantino de Bernini · 15:55 Iglesia de Santa Maria sopra Minerva · 16:15 Iglesia de San Luigi dei Francesi · 16:40 Piazza Navona · 17:15 Largo di Torre Argentina · 17:35 Iglesia del Gesù · 18:05 Barrio Judío · 18:40 Fuente de las Tortugas · 18:55 Campo de' Fiori · 19:45 Ponte Sisto · 22:30 Fontana de Trevi (noche)
- **Día 3 (domingo 15 ago 2027) — Trevi sin gente, el Pincio y la tarde en Monti**: 08:30 Fontana de Trevi · 09:00 Desayuno romano · 09:20 Iglesia de San Ignacio de Loyola · 09:45 Via Condotti · 10:05 Plaza de España · 10:25 Trinità dei Monti · 10:40 Via del Babuino · 10:55 Piazza del Popolo · 11:15 Santa Maria del Popolo (por fuera: Todavía no ha abierto (abre a las 16:30)) · 11:30 Terraza del Pincio · 12:00 Parque de Villa Borghese · 15:10 Basílica de Santa María la Mayor · 16:00 Basílica de San Juan de Letrán · 16:45 Basílica de San Clemente · 17:35 Iglesia de San Pietro in Vincoli · 18:05 Mercados de Trajano · 19:05 Monti · 19:55 Via dei Fori Imperiali · 22:30 Coliseo (noche)

Sin fechas el viaje es el de siempre (D1, D2, D4M) y la ventana solo dice "Si tu viaje coincide…", sin etiqueta. Con el 13-15, el Vaticano pasa al viernes 13 y la ventana cuenta el Ferragosto en su día.

## Auditoría automática

Todas las comprobaciones de siempre, para cada ruta (scripts/destino/auditoria.mjs). Tiene que salir todo a 0, o con la lista de lo que no se ha podido arreglar.

- **Lugar repetido en el mismo día**: 0 ✅
- **Lugar repetido otro día (salvo nocturnas y revisitas)**: 0 ✅
- **Lugar del pool fuera de la ruta**: 0 ✅
- **Parada fuera de su horario real de ese día**: 0 ✅
- **Mirador de atardecer después del sol (o texto de atardecer de noche)**: 0 ✅
- **Tramo de más de 25 min andando sin transporte**: 0 ✅
- **Hueco de más de 20 min sin nada entre dos paradas (30 antes del atardecer o de una entrada con turno)**: 0 ✅
- **Tiempo libre de más de 30 min (60 si sale con nombre de paseo)**: 0 ✅
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
- **Parada de paseo (parque, jardín, barrio o avenida) por encima de su máximo**: 0 ✅
- **El mismo restaurante dos veces en el viaje**: 0 ✅
- **"Por fuera para llegar a todo" en un día con tiempo libre o paradas estiradas**: 0 ✅
- **"Por la mañana" en el texto de una parada que va por la tarde**: 0 ✅
- **Imprescindible de pago que no sale nunca por dentro en el viaje**: 0 ✅

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
- (en la ruta) A primera hora, sin nadie delante, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves.
- (en la ruta) La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro.
- (en la ruta) A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día.
- (en la ruta) La fuente más famosa del mundo, y desde la plaza se ve gratis. Para bajar junto al agua a tirar la moneda hay una tasa de 2 € de 9:00 a 22:00: no es una entrada. Tírala de espaldas, con la mano derecha por encima del hombro izquierdo: dicen que así vuelves a Roma.
- (ficha de Fontana de Trevi) La fuente más famosa del mundo. 26 metros de altura, 50 de ancho — un escenario barroco tallado en la fachada de un palacio donde Neptuno domina las aguas desde su carro tirado por tritones y caballos marinos. Cada día se recogen unos 3.000€ en monedas del fondo, que se donan a Cáritas para proyectos sociales en Roma. La tradición: tira una moneda con la mano derecha por encima del hombro izquierdo y volverás a Roma.
- (ficha de Fontana de Trevi) No es una entrada: la fuente se ve gratis desde la plaza a cualquier hora. Para bajar a la zona junto al agua hay una tasa de 2 € de 9:00 a 22:00 (algunos días laborables, desde las 11:30). Antes y después, libre. Los residentes en Roma y los niños pequeños no pagan. Compruébalo en la web del Ayuntamiento.
- (ficha de Fontana de Trevi) La tradición original no era una moneda, sino beber agua de la fuente. La costumbre de la moneda viene de la película 'Tres monedas en la fuente' (1954) — y ahora genera más de 1 millón de euros al año para Cáritas.
