# Cierre de Roma: 30 viajes de fechas normales, tal como salen en la app

Motor v4 (días escritos), generado el 2026-10-01 con `node scripts/destino/revision20.mjs`. Sin arreglar nada: es para revisar que las rutas son bonitas.

- **Hora**: la que ve el usuario, de 5 en 5. **Tiempo**: minutos de visita (el atardecer es la hora real del sol).
- **Cómo sale en la app**: Parada / Por el camino / Por fuera (con su motivo) / 🌅 Atardecer / 🌙 Noche / 🍝 Comida / 🍷 Cena / 🕐 Descanso.
- **Cómo llegas**: andando desde lo anterior (la comida, si va en medio), o el bus/metro del día ("🚌 Bus 118, 25 min").
- **Por qué aquí**: el `por_que` de la parada (lo que ve el viajero; la nota es interna) y sus avisos (⚠️). Al final, el recuento de la Parte D.

## Índice

| Nº | Días | Free Tour | Experiencias | Pool | Empieza | Avisos de fechas |
|---|---|---|---|---|---|---|
| [1](#ruta-1) | 2 | no | sin experiencias | — | jueves 21 ene 2027 | — |
| [2](#ruta-2) | 3 | no | sin experiencias | — | viernes 15 ene 2027 | Domingo 17 · Museos Vaticanos cerrados |
| [3](#ruta-3) | 4 | no | sin experiencias | — | jueves 4 feb 2027 | Domingo 7 · Museos Vaticanos cerrados |
| [4](#ruta-4) | 3 | no | sin experiencias | — | viernes 19 feb 2027 | Domingo 21 · Museos Vaticanos cerrados |
| [5](#ruta-5) | 2 | no | sin experiencias | — | martes 2 mar 2027 · 3 mar: audiencia papal (miércoles por la mañana) | — |
| [6](#ruta-6) | 3 | sí | sin experiencias | — | sábado 6 mar 2027 | Domingo 7 · Museos Vaticanos cerrados · Domingo 7 · El Coliseo y los museos del Estado, gratis |
| [7](#ruta-7) | 4 | no | sin experiencias | — | viernes 12 mar 2027 | Domingo 14 · Museos Vaticanos cerrados |
| [8](#ruta-8) | 2 | sí | sin experiencias | — | sábado 10 abr 2027 | Domingo 11 · Museos Vaticanos cerrados |
| [9](#ruta-9) | 3 | no | sin experiencias | — | jueves 15 abr 2027 | — |
| [10](#ruta-10) | 5 | no | Barrios | — | lunes 19 abr 2027 · 21 abr: audiencia papal (miércoles por la mañana) | — |
| [11](#ruta-11) | 3 | no | sin experiencias | — | domingo 2 may 2027 | Domingo 2 · Museos Vaticanos cerrados · Domingo 2 · El Coliseo y los museos del Estado, gratis |
| [12](#ruta-12) | 3 | no | Arte | — | jueves 6 may 2027 | — |
| [13](#ruta-13) | 4 | sí | sin experiencias | — | viernes 28 may 2027 | Domingo 30 · Último domingo de mes |
| [14](#ruta-14) | 3 | sí | sin experiencias | — | viernes 4 jun 2027 | Domingo 6 · Museos Vaticanos cerrados |
| [15](#ruta-15) | 2 | no | sin experiencias | — | sábado 19 jun 2027 | Domingo 20 · Museos Vaticanos cerrados |
| [16](#ruta-16) | 3 | no | Naturaleza | — | miércoles 23 jun 2027 · 23 jun: audiencia papal (miércoles por la mañana) | — |
| [17](#ruta-17) | 3 | sí | sin experiencias | — | viernes 2 jul 2027 | Domingo 4 · Museos Vaticanos cerrados |
| [18](#ruta-18) | 4 | no | sin experiencias | — | jueves 8 jul 2027 | Domingo 11 · Museos Vaticanos cerrados |
| [19](#ruta-19) | 3 | no | sin experiencias | — | sábado 24 jul 2027 | Domingo 25 · Último domingo de mes |
| [20](#ruta-20) | 2 | no | sin experiencias | — | sábado 7 ago 2027 | Domingo 8 · Museos Vaticanos cerrados |
| [21](#ruta-21) | 5 | sí | sin experiencias | — | lunes 23 ago 2027 · 25 ago: audiencia papal (miércoles por la mañana) | — |
| [22](#ruta-22) | 3 | no | Barrios | — | viernes 3 sep 2027 | Domingo 5 · Museos Vaticanos cerrados |
| [23](#ruta-23) | 3 | sí | Arte | — | viernes 10 sep 2027 | Domingo 12 · Museos Vaticanos cerrados |
| [24](#ruta-24) | 2 | no | sin experiencias | — | martes 28 sep 2027 · 29 sep: audiencia papal (miércoles por la mañana) | Miércoles 29 · Audiencia papal |
| [25](#ruta-25) | 4 | no | Naturaleza | — | viernes 1 oct 2027 | Domingo 3 · Museos Vaticanos cerrados · Domingo 3 · La Galería Borghese, gratis con reserva |
| [26](#ruta-26) | 3 | no | sin experiencias | — | viernes 29 oct 2027 | Domingo 31 · Último domingo de mes |
| [27](#ruta-27) | 3 | sí | sin experiencias | — | viernes 12 nov 2027 | Domingo 14 · Museos Vaticanos cerrados |
| [28](#ruta-28) | 2 | no | sin experiencias | — | sábado 27 nov 2027 | Domingo 28 · Último domingo de mes |
| [29](#ruta-29) | 3 | no | sin experiencias | — | viernes 10 dic 2027 | Domingo 12 · Museos Vaticanos cerrados · Mercadillo de Navidad en Piazza Navona |
| [30](#ruta-30) | 5 | sí | sin experiencias | — | lunes 13 dic 2027 · 15 dic: audiencia papal (miércoles por la mañana) | Mercadillo de Navidad en Piazza Navona |

<a id="ruta-1"></a>
## 1. 2 días · sin Free Tour · sin experiencias · desde el jueves 21 ene 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:15, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**jueves 21 ene 2027** · 🌅 atardecer 17:11 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 22 ene 2027** · 🌅 atardecer 17:12 · día curado D2 (A, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 25 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:20 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:35 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:50 | Castillo de Sant'Angelo | 100 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:55 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:15 | Trastevere | 40 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:05 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 19:45 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |
| 21:15 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-2"></a>
## 2. 3 días · sin Free Tour · sin experiencias · desde el viernes 15 ene 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:00, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 17 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 16 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 15 ene 2027** · 🌅 atardecer 17:04 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 16 ene 2027** · 🌅 atardecer 17:05 · día curado D2 (A, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 20 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:40 | Castillo de Sant'Angelo | 100 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:45 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:05 | Trastevere | 45 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:00 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 19:45 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |
| 21:15 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi a primera hora, Monti y el Pincio al atardecer

**domingo 17 ene 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:06 · día curado D4M (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:55 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 20 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 11:40 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 12:05 | Mercados de Trajano | 45 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 13:00 | Monti | 20 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 13:30 | Comida: La Boccaccia | 75 min | 🍝 Comida | 2 min andando | en Monti y Fori Imperiali |
| 15:05 | Via Margutta | 30 min | Parada | 🚇 Metro A o un taxi, 20 min | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 15:40 | Piazza del Popolo | 15 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:15 | Parque de Villa Borghese | 25 min | Parada | 18 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:50 | Terraza del Pincio | 35 min | 🌅 Atardecer | 11 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 17:30 | Santa Maria del Popolo | 25 min | Parada · por dentro | 5 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 18:10 | Pasea y piérdete por Via del Corso y Via Condotti iluminadas | 75 min | Parada | 11 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 19:30 | Cena: Sgarro Bistrot |  | 🍷 Cena | 11 min andando | en Tridente y Spagna |
| 21:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:25 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

**Lo que quedó fuera**: nada.

<a id="ruta-3"></a>
## 3. 4 días · sin Free Tour · sin experiencias · desde el jueves 4 feb 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:30, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 7 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 4
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 5 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**jueves 4 feb 2027** · 🌅 atardecer 17:29 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**viernes 5 feb 2027** · 🌅 atardecer 17:30 · día curado D2 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 45 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:40 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:55 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 16:05 | Castillo de Sant'Angelo | 100 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 18:10 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:30 | Trastevere | 85 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi, la Borghese con su parque y el Popolo

**sábado 6 feb 2027** · 🌅 atardecer 17:31 · día curado D4 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 09:50 | Trinità dei Monti | 10 min | Por fuera (Por dentro abre de 10:15 a 19:45) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:15 | Parque de Villa Borghese | 35 min | Parada | 14 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 70 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 14:40 | Parque de Villa Borghese | 90 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:20 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 17:00 | Terraza del Pincio | 50 min | 🌅 Atardecer | 2 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 17:55 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 18:05 | Santa Maria del Popolo | 10 min | Por fuera (Por dentro abre de 08:30 a 09:45 y de 10:30 a 12:00 y de 16:00 a 18:00) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 18:25 | Ara Pacis | 45 min | Parada · por dentro | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 19:15 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 20:00 | Cena: Il Gabriello |  | 🍷 Cena | 3 min andando | en Tridente y Spagna |
| 21:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 7 feb 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:32 · día curado D5C (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 50 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:05 | Basílica de Santa María la Mayor | 60 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:20 | Mercados de Trajano | 45 min | Parada · por dentro | 17 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 17:15 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 7 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 18:00 | Iglesia de San Pietro in Vincoli | 10 min | Por fuera (Por dentro abre de 08:00 a 12:30 y de 15:00 a 18:00) | 10 min andando | La placita escondida sobre Monti donde está la iglesia del Moisés de Miguel Ángel. Vuelve otro día: por dentro merece la pena. |
| 18:15 | Monti | 30 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 18:55 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:30 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-4"></a>
## 4. 3 días · sin Free Tour · sin experiencias · desde el viernes 19 feb 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:45, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 21 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 20 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 19 feb 2027** · 🌅 atardecer 17:48 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 20 feb 2027** · 🌅 atardecer 17:49 · día curado D2 (B, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:55 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:05 | Castillo de Sant'Angelo | 75 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:35 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:00 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:25 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:45 | Trastevere | 30 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:25 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 20:00 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |
| 21:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi a primera hora, Monti y el Pincio

**domingo 21 feb 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 17:50 · día curado D4M (B, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:55 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 20 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 11:40 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 12:05 | Mercados de Trajano | 45 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 13:00 | Monti | 20 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 13:30 | Comida: La Boccaccia | 90 min | 🍝 Comida | 2 min andando | en Monti y Fori Imperiali |
| 15:20 | Via Margutta | 30 min | Parada | 🚇 Metro A o un taxi, 20 min | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 15:55 | Piazza del Popolo | 15 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:15 | Parque de Villa Borghese | 30 min | Parada | 16 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 17:55 | Roma iluminada desde el Pincio | 20 min | 🌙 Noche | 11 min andando | Ya es de noche y la Piazza del Popolo brilla a tus pies, con las cúpulas del centro encendidas al fondo. |
| 18:30 | Pasea y piérdete por Via del Corso y Via Condotti iluminadas | 55 min | Parada | 13 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 19:30 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:25 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

**Lo que quedó fuera**: nada.

<a id="ruta-5"></a>
## 5. 2 días · sin Free Tour · sin experiencias · desde el martes 2 mar 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 18:00, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**martes 2 mar 2027** · 🌅 atardecer 18:01 · día curado D2 (B, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:55 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:05 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:45 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:10 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:40 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:40 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:00 | Trastevere | 25 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:35 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 20:15 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |
| 21:45 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 2 — Roma Antigua y el centro barroco

**miércoles 3 mar 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 18:02 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-6"></a>
## 6. 3 días · Free Tour · sin experiencias · desde el sábado 6 mar 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 18:00, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 7 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 6 para que no los pierdas.
- **Domingo 7 · El Coliseo y los museos del Estado, gratis** · etiqueta «El Coliseo y los museos del Estado, gratis» en el día 2
  - El primer domingo de mes el Coliseo y los museos del Estado son gratis, sin reserva: entradas en taquilla, por orden de llegada. Es el día de más cola: ve antes de que abra.

### Día 1 — Free Tour y el Vaticano por la tarde

**sábado 6 mar 2027** · 🌅 atardecer 18:06 · día curado D3 (B, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:00 | Roma iluminada desde el Puente Sant'Angelo | 15 min | 🌙 Noche | 2 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:15 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**domingo 7 mar 2027** · 🏷️ Museos Vaticanos cerrados · 🏷️ El Coliseo y los museos del Estado, gratis · 🌅 atardecer 18:07 · día curado D1-FT (B, domingo, fecha:primer_domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | El primer domingo de mes el Coliseo es gratis y es el día de más cola del mes: llega antes de que abra. No se reserva: las entradas se recogen en la taquilla (en la plaza del Coliseo, junto al Templo de Venus y Roma, o en Largo della Salara Vecchia), por orden de llegada, y solo valen para ese día. Ese día no se sube a los niveles de arriba ni se baja a la arena ni a los subterráneos. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 85 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:45 | Barrio Judío | 20 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:10 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:30 | Teatro de Marcelo | 10 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:50 | Isla Tiberina | 45 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:50 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 16 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:15 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:45 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:45 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:05 | Trastevere | 80 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 8 mar 2027** · 🌅 atardecer 18:08 · día curado D5C (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:00 | Monti | 40 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 17:50 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 18:40 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-7"></a>
## 7. 4 días · sin Free Tour · sin experiencias · desde el viernes 12 mar 2027

**Nota de temporada**: ¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 18:15, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 14 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 13 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 12 mar 2027** · 🌅 atardecer 18:13 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 13 mar 2027** · 🌅 atardecer 18:14 · día curado D2 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:55 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:05 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:45 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:10 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:40 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:50 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:10 | Trastevere | 30 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:45 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche», antes de cenar · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |

### Día 3 — Trevi, la Borghese con su parque y el Popolo

**domingo 14 mar 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 18:15 · día curado D4 (B, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 09:50 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:15 | Parque de Villa Borghese | 35 min | Parada | 14 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 80 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 14:50 | Parque de Villa Borghese | 40 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 15:40 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:05 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:20 | Ara Pacis | 50 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 17:15 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 17:50 | Santa Maria del Popolo | 10 min | Por fuera (Por dentro abre de 16:30 a 18:00) | 6 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 18:05 | Terraza del Pincio | 25 min | 🌅 Atardecer | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 18:45 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada», antes de cenar · La Plaza de España iluminada: la escalinata con Trinità dei Monti encendida arriba, la Barcaccia sonando y la Via Condotti con los escaparates encendidos. El final perfecto para un día de miradores. |
| 19:20 | Pasea y piérdete por Via del Corso y Via Condotti | 35 min | Parada | 13 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 15 mar 2027** · 🌅 atardecer 18:16 · día curado D5C (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:00 | Monti | 50 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 18:00 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 18:50 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-8"></a>
## 8. 2 días · Free Tour · sin experiencias · desde el sábado 10 abr 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 19:45, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 11 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 10 para que no los pierdas.

### Día 1 — Free Tour y el Vaticano por la tarde

**sábado 10 abr 2027** · 🌅 atardecer 19:45 · día curado D3 (D, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:00 | Roma iluminada desde el Puente Sant'Angelo | 15 min | 🌙 Noche | 2 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:55 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**domingo 11 abr 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:46 · día curado D1-FT (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 20 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:15 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Teatro de Marcelo | 10 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:55 | Isla Tiberina | 15 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:30 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:10 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 13 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:30 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:55 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 8 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:20 | Trastevere | 35 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:00 | Plaza Trilussa | 30 min | Parada | 4 min andando |  |
| 19:40 | Ponte Sisto | 40 min | 🌅 Atardecer | 2 min andando | El puente de peatones entre Trastevere y el centro. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere y Mirador del Janículo de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-9"></a>
## 9. 3 días · sin Free Tour · sin experiencias · desde el jueves 15 abr 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 19:45, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**jueves 15 abr 2027** · 🌅 atardecer 19:51 · día curado D1 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:05 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:35 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:50 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:10 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:35 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:50 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:05 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:40 | Campo de' Fiori | 45 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:30 | Ponte Sisto | 45 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:55 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, el Janículo y el Castillo al atardecer

**viernes 16 abr 2027** · 🌅 atardecer 19:52 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso después de comer (antes de San Pietro in Montorio y Tempietto de Bramante) | 35 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 15:40 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:05 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:35 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:10 | Castillo de Sant'Angelo | 95 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:00 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:55 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — Trevi a primera hora, el Pincio y la tarde en Monti

**sábado 17 abr 2027** · 🌅 atardecer 19:53 · día curado D4M (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | Busca, junto a la iglesia de San Atanasio, una estatua tumbada y bastante fea: es un sileno, pero a los romanos les pareció un mono y la llamaron «el babuino». La calle se quedó con el nombre. Es una de las «estatuas parlantes», donde se colgaban críticas anónimas contra el Papa. Hoy es calle de anticuarios y galerías. |
| 11:00 | Piazza del Popolo | 10 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 25 min | Parada | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 12:20 | Parque de Villa Borghese | 25 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 12 min andando | en Via Veneto y Salario |
| 14:55 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:50 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:30 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:00 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:00 | Monti | 85 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 19:35 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:30 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-10"></a>
## 10. 5 días · sin Free Tour · Barrios · desde el lunes 19 abr 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:00, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**lunes 19 abr 2027** · 🌅 atardecer 19:55 · día curado D1 (D, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:05 | Barrio Judío | 40 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 15:50 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:05 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:25 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:50 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:05 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:20 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:55 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:20 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:55 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. · experiencia: Barrios |
| 19:30 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, el Janículo y el Castillo al atardecer

**martes 20 abr 2027** · 🌅 atardecer 19:56 · día curado D2 (D, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso después de comer (antes de San Pietro in Montorio y Tempietto de Bramante) | 40 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 15:45 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:10 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:40 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:15 | Castillo de Sant'Angelo | 100 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:05 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:55 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — Trevi, la Borghese con su parque y el Popolo

**miércoles 21 abr 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 19:57 · día curado D4 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 09:50 | Trinità dei Monti | 10 min | Por fuera (Por dentro abre de 12:00 a 19:45) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 10:15 | Parque de Villa Borghese | 35 min | Parada | 14 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 15:00 | Parque de Villa Borghese | 55 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:05 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:30 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:40 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:15 | Ara Pacis | 45 min | Parada · por dentro | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 18:05 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 18:40 | Pasea y piérdete por Via del Corso y Via Condotti | 90 min | Parada | 5 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 20:30 | Cena: Il Gabriello |  | 🍷 Cena | 3 min andando | en Tridente y Spagna |
| 22:00 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |

### Día 4 — Excursión

**jueves 22 abr 2027** · 🌅 atardecer 19:58

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**viernes 23 abr 2027** · 🌅 atardecer 19:59 · día curado D5C (D, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. · experiencia: Barrios |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:25 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:35 | Mercados de Trajano | 75 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 40 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. · experiencia: Barrios |
| 19:50 | Via dei Fori Imperiali | 25 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-11"></a>
## 11. 3 días · sin Free Tour · sin experiencias · desde el domingo 2 may 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:15, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 2 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 1
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el martes 4 para que no los pierdas.
- **Domingo 2 · El Coliseo y los museos del Estado, gratis** · etiqueta «El Coliseo y los museos del Estado, gratis» en el día 1
  - El primer domingo de mes el Coliseo y los museos del Estado son gratis, sin reserva: entradas en taquilla, por orden de llegada. Es el día de más cola: ve antes de que abra.

### Día 1 — Roma Antigua y el centro barroco

**domingo 2 may 2027** · 🏷️ Museos Vaticanos cerrados · 🏷️ El Coliseo y los museos del Estado, gratis · 🌅 atardecer 20:09 · día curado D1 (D, domingo, fecha:primer_domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | El primer domingo de mes el Coliseo es gratis y es el día de más cola del mes: llega antes de que abra. No se reserva: las entradas se recogen en la taquilla (en la plaza del Coliseo, junto al Templo de Venus y Roma, o en Largo della Salara Vecchia), por orden de llegada, y solo valen para ese día. Ese día no se sube a los niveles de arriba ni se baja a la arena ni a los subterráneos. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:05 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:35 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:50 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:10 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:35 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:50 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:05 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:40 | Campo de' Fiori | 60 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:45 | Ponte Sisto | 45 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:45 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Trevi a primera hora, el Pincio y la tarde en Monti

**lunes 3 may 2027** · 🌅 atardecer 20:10 · día curado D4M (D, lunes)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 11:30. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | Busca, junto a la iglesia de San Atanasio, una estatua tumbada y bastante fea: es un sileno, pero a los romanos les pareció un mono y la llamaron «el babuino». La calle se quedó con el nombre. Es una de las «estatuas parlantes», donde se colgaban críticas anónimas contra el Papa. Hoy es calle de anticuarios y galerías. |
| 11:00 | Piazza del Popolo | 10 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 25 min | Parada | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 12:20 | Parque de Villa Borghese | 25 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 13 min andando | en Tridente y Spagna |
| 14:55 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:50 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:30 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:00 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:00 | Monti | 85 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 19:50 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:45 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

### Día 3 — Vaticano, el Janículo y el Castillo al atardecer

**martes 4 may 2027** · 🌅 atardecer 20:11 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso después de comer (antes de San Pietro in Montorio y Tempietto de Bramante) | 55 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 16:00 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:25 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:55 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:30 | Castillo de Sant'Angelo | 100 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:20 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 20:45 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

**Lo que quedó fuera**: nada.

<a id="ruta-12"></a>
## 12. 3 días · sin Free Tour · Arte · desde el jueves 6 may 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:15, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**jueves 6 may 2027** · 🌅 atardecer 20:14 · día curado D1 (D, arte_museos)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:10 | Museos Capitolinos | 55 min | Parada · por dentro | 6 min andando | Los museos públicos más antiguos del mundo, en la plaza de Miguel Ángel. Dentro está la loba que amamanta a Rómulo y Remo, el símbolo de Roma, y la estatua original de Marco Aurelio a caballo. · experiencia: Arte |
| 16:15 | Largo di Torre Argentina | 15 min | Parada | 8 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:35 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. · experiencia: Arte |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 20 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. · experiencia: Arte |
| 17:20 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:30 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:05 | Iglesia de San Luigi dei Francesi | 10 min | Por fuera (Por dentro abre de 09:30 a 12:45 y de 14:30 a 18:15) | 6 min andando | La iglesia de los franceses, a dos pasos de Navona. Dentro esconde tres Caravaggio: si está abierta, entra aunque sean cinco minutos. · experiencia: Arte |
| 18:20 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:55 | Campo de' Fiori | 55 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:55 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:45 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, el Janículo y el Castillo al atardecer

**viernes 7 may 2027** · 🌅 atardecer 20:15 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso después de comer (antes de San Pietro in Montorio y Tempietto de Bramante) | 55 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 16:00 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. · experiencia: Arte |
| 16:25 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:55 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:30 | Castillo de Sant'Angelo | 95 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. · experiencia: Arte |
| 19:20 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 20:45 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 3 — Trevi, la Borghese con su parque y el Popolo

**sábado 8 may 2027** · 🌅 atardecer 20:16 · día curado D4 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 09:50 | Trinità dei Monti | 10 min | Por fuera (Por dentro abre de 10:15 a 19:45) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. · experiencia: Arte |
| 10:15 | Parque de Villa Borghese | 35 min | Parada | 14 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 15:00 | Parque de Villa Borghese | 55 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:05 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:30 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:40 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. · experiencia: Arte |
| 17:15 | Ara Pacis | 45 min | Parada · por dentro | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. · experiencia: Arte |
| 18:05 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 18:40 | Pasea y piérdete por Via del Corso y Via Condotti | 90 min | Parada | 5 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 20:30 | Cena: Il Gabriello |  | 🍷 Cena | 3 min andando | en Tridente y Spagna |
| 22:00 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |

**Lo que quedó fuera**: nada.

<a id="ruta-13"></a>
## 13. 4 días · Free Tour · sin experiencias · desde el viernes 28 may 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:30, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 30 · Último domingo de mes** · etiqueta «Último domingo de mes» en el día 3
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el viernes 28.

### Día 1 — Free Tour y el Vaticano por la tarde

**viernes 28 may 2027** · 🌅 atardecer 20:35 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:10 | Puente Sant'Angelo | 40 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini con el Castillo delante y la cúpula de San Pedro al fondo, río abajo. Cena cerca, en el Borgo o en Prati. |
| 21:00 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 29 may 2027** · 🌅 atardecer 20:36 · día curado D1-FT (D, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Antico Forno Roscioli | 90 min | 🍝 Comida | 13 min andando | en Centro Histórico |
| 15:10 | Barrio Judío | 25 min | Parada | 8 min andando | Es uno de los barrios judíos más antiguos de Europa. El sábado es su día de descanso: muchos comercios y restaurantes cierran y las calles se quedan tranquilas. Busca el Pórtico de Octavia, unas ruinas romanas en mitad de la calle, y la Gran Sinagoga, junto al río. |
| 15:40 | Fuente de las Tortugas | 5 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:55 | Teatro de Marcelo | 10 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:15 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:40 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:20 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 13 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:40 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:10 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 18:50 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:10 | Trastevere | 60 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:15 | Ponte Sisto | 40 min | 🌅 Atardecer | 5 min andando | El puente de peatones entre Trastevere y el centro. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:00 | Cena: Dar Filettaro a Santa Barbara |  | 🍷 Cena | 5 min andando | en Centro Histórico |
| 22:30 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere, Foro Romano desde el Campidoglio, Puente Sant'Angelo y Mirador del Janículo de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**domingo 30 may 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 20:37 · día curado D4 (D, con_free_tour, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Castillo de Sant'Angelo | 65 min | Parada · por dentro | — | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 10:25 | Parque de Villa Borghese | 15 min | Parada | 🚌 Un taxi, 20 min | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 15:00 | Parque de Villa Borghese | 55 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:05 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:30 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:40 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:15 | Ara Pacis | 45 min | Parada · por dentro | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 18:05 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 18:40 | Pasea y piérdete por Via del Corso y Via Condotti | 90 min | Parada | 5 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 20:30 | Cena: Sgarro Bistrot |  | 🍷 Cena | 5 min andando | en Tridente y Spagna |
| 22:00 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 31 may 2027** · 🌅 atardecer 20:38 · día curado D5C (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:25 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:35 | Mercados de Trajano | 75 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 70 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:20 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-14"></a>
## 14. 3 días · Free Tour · sin experiencias · desde el viernes 4 jun 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:45, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 6 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 4 para que no los pierdas.

### Día 1 — Free Tour y el Vaticano por la tarde

**viernes 4 jun 2027** · 🌅 atardecer 20:41 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:20 | Puente Sant'Angelo | 40 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini con el Castillo delante y la cúpula de San Pedro al fondo, río abajo. Cena cerca, en el Borgo o en Prati. |
| 21:15 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 23:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 5 jun 2027** · 🌅 atardecer 20:41 · día curado D1-FT (D, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Antico Forno Roscioli | 90 min | 🍝 Comida | 13 min andando | en Centro Histórico |
| 15:10 | Barrio Judío | 25 min | Parada | 8 min andando | Es uno de los barrios judíos más antiguos de Europa. El sábado es su día de descanso: muchos comercios y restaurantes cierran y las calles se quedan tranquilas. Busca el Pórtico de Octavia, unas ruinas romanas en mitad de la calle, y la Gran Sinagoga, junto al río. |
| 15:40 | Fuente de las Tortugas | 5 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:55 | Teatro de Marcelo | 10 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 16:15 | Isla Tiberina | 20 min | Parada | 9 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 16:40 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 4 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 17:20 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 13 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:40 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:10 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 18:50 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:10 | Trastevere | 65 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:20 | Ponte Sisto | 45 min | 🌅 Atardecer | 5 min andando | El puente de peatones entre Trastevere y el centro. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Dar Filettaro a Santa Barbara |  | 🍷 Cena | 5 min andando | en Centro Histórico |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere, Foro Romano desde el Campidoglio, Puente Sant'Angelo y Mirador del Janículo de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 6 jun 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:42 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:25 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:35 | Mercados de Trajano | 75 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 75 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:25 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-15"></a>
## 15. 2 días · sin Free Tour · sin experiencias · desde el sábado 19 jun 2027

**Nota de temporada**: ¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:45, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 20 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 19 para que no los pierdas.

### Día 1 — Vaticano, el Janículo y el Castillo al atardecer

**sábado 19 jun 2027** · 🌅 atardecer 20:48 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso después de comer (antes de San Pietro in Montorio y Tempietto de Bramante) | 75 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 16:20 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:45 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:15 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:50 | Castillo de Sant'Angelo | 95 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:55 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 21:15 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 23:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 20 jun 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:48 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:05 | Descanso después de comer (antes de Barrio Judío) | 25 min | 🕐 Descanso |  | ideas: Teatro de Marcelo |
| 15:30 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 16:00 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 16:15 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:35 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:00 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 17:15 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:30 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 18:05 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:30 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 19:05 | Campo de' Fiori | 60 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:15 | Ponte Sisto | 50 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 23:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Puente Sant'Angelo y Trastevere de noche» · Los ángeles de Bernini iluminados y el castillo reflejándose en el Tíber. Se cruza despacio. |

**Lo que quedó fuera**: nada.

<a id="ruta-16"></a>
## 16. 3 días · sin Free Tour · Naturaleza · desde el miércoles 23 jun 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: lo más importante, a primera hora. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Roma Antigua y el centro barroco

**miércoles 23 jun 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 20:49 · día curado D1 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 15:05 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:35 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:50 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:10 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:35 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:50 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 17:05 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:40 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 18:05 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:40 | Campo de' Fiori | 60 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:45 | Plaza Farnese | 20 min | Parada | 1 min andando | Una plaza tranquila a un minuto de Campo de' Fiori. Fíjate en las dos fuentes: están hechas con bañeras de granito de las Termas de Caracalla. El palacio, en el que trabajó Miguel Ángel, hoy es la embajada de Francia. |
| 20:15 | Ponte Sisto | 60 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. · experiencia: Naturaleza |
| 21:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, el Janículo y el Castillo al atardecer

**jueves 24 jun 2027** · 🌅 atardecer 20:49 · día curado D2 (D, naturaleza_vistas)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. · experiencia: Naturaleza |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso después de comer (antes de San Pietro in Montorio y Tempietto de Bramante) | 75 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 16:20 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:45 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. · experiencia: Naturaleza |
| 17:15 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. · experiencia: Naturaleza |
| 17:50 | Castillo de Sant'Angelo | 95 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:55 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 21:15 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 23:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 3 — Trevi a primera hora, el Pincio y la tarde en Monti

**viernes 25 jun 2027** · 🌅 atardecer 20:49 · día curado D4M (D, naturaleza_vistas)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 11:30. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. · experiencia: Naturaleza |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | Busca, junto a la iglesia de San Atanasio, una estatua tumbada y bastante fea: es un sileno, pero a los romanos les pareció un mono y la llamaron «el babuino». La calle se quedó con el nombre. Es una de las «estatuas parlantes», donde se colgaban críticas anónimas contra el Papa. Hoy es calle de anticuarios y galerías. |
| 11:00 | Piazza del Popolo | 10 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 25 min | Parada | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. · experiencia: Naturaleza |
| 12:20 | Parque de Villa Borghese | 25 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. · experiencia: Naturaleza |
| 13:00 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 12 min andando | en Via Veneto y Salario |
| 14:55 | Descanso después de comer (antes de Basílica de San Juan de Letrán) | 40 min | 🕐 Descanso |  | Sin prisa: un café, volver un rato al alojamiento o sentarse a la sombra antes de seguir. |
| 15:35 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:30 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:10 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:40 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:40 | Monti | 90 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-17"></a>
## 17. 3 días · Free Tour · sin experiencias · desde el viernes 2 jul 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: después de comer, descanso o sitios a cubierto. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 4 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 2 para que no los pierdas.

### Día 1 — Free Tour y el Vaticano por la tarde

**viernes 2 jul 2027** · 🌅 atardecer 20:49 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:25 | Puente Sant'Angelo | 40 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini con el Castillo delante y la cúpula de San Pedro al fondo, río abajo. Cena cerca, en el Borgo o en Prati. |
| 21:15 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 23:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 3 jul 2027** · 🌅 atardecer 20:49 · día curado D1-FT (D, sabado)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Antico Forno Roscioli | 90 min | 🍝 Comida | 13 min andando | en Centro Histórico |
| 15:15 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 14 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:35 | Descanso a la sombra (antes de Fontana dell'Acqua Paola) | 55 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 16:30 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:05 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:50 | Basílica de Santa Cecilia in Trastevere | 20 min | Parada | 25 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:15 | Isla Tiberina | 20 min | Parada | 4 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 18:45 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 9 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:05 | Trastevere | 75 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:25 | Ponte Sisto | 40 min | 🌅 Atardecer | 5 min andando | El puente de peatones entre Trastevere y el centro. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Dar Filettaro a Santa Barbara |  | 🍷 Cena | 5 min andando | en Centro Histórico |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere, Foro Romano desde el Campidoglio, Puente Sant'Angelo y Mirador del Janículo de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 4 jul 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:49 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:25 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:35 | Mercados de Trajano | 75 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 80 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-18"></a>
## 18. 4 días · sin Free Tour · sin experiencias · desde el jueves 8 jul 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: lo más importante, a primera hora, y después de comer, descanso o sitios a cubierto. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 11 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 4
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 9 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**jueves 8 jul 2027** · 🌅 atardecer 20:47 · día curado D1 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 90 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 11:55 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 6 min andando | en Barrio Judío |
| 14:10 | Panteón | 30 min | Parada · por dentro | 10 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 14:45 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 14:55 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 15:20 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 15:50 | Descanso a la sombra (antes de Largo di Torre Argentina) | 40 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 16:30 | Largo di Torre Argentina | 15 min | Parada | 9 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:50 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:15 | Plaza Venecia | 10 min | Por el camino | 4 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 17:30 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 18:15 | Piazza Navona | 30 min | Parada | 17 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:50 | Campo de' Fiori | 60 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:15 | Ponte Sisto | 50 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 23:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, el Janículo y el Castillo al atardecer

**viernes 9 jul 2027** · 🌅 atardecer 20:47 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso a la sombra (antes de San Pietro in Montorio y Tempietto de Bramante) | 15 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:20 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:45 | Descanso a la sombra (antes de Fontana dell'Acqua Paola) | 45 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 16:30 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:05 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:40 | Castillo de Sant'Angelo | 110 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:55 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 21:15 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 23:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 3 — Trevi, la Borghese con su parque y el Popolo

**sábado 10 jul 2027** · 🌅 atardecer 20:47 · día curado D4 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 09:50 | Trinità dei Monti | 10 min | Por fuera (Por dentro abre de 10:15 a 19:45) | 1 min andando | La iglesia de las dos torres, en lo alto de la escalinata. Asómate a la balaustrada: la Plaza de España y Via Condotti a tus pies. |
| 08:20 | Descanso a la sombra (antes de Parque de Villa Borghese) | 115 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 10:15 | Parque de Villa Borghese | 35 min | Parada | 14 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 16:45 | Parque de Villa Borghese | 55 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 17:50 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 18:15 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 18:25 | Santa Maria del Popolo | 10 min | Por fuera (Por dentro abre de 08:30 a 09:45 y de 10:30 a 12:00 y de 16:00 a 18:00) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 18:45 | Ara Pacis | 10 min | Por fuera (Por dentro abre de 09:30 a 19:30) | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 19:00 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 19:35 | Pasea y piérdete por Via del Corso y Via Condotti | 50 min | Parada | 5 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 20:30 | Cena: Il Gabriello |  | 🍷 Cena | 3 min andando | en Tridente y Spagna |
| 22:00 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 11 jul 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:46 · día curado D5C (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:25 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:35 | Mercados de Trajano | 75 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 80 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:15 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 23:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-19"></a>
## 19. 3 días · sin Free Tour · sin experiencias · desde el sábado 24 jul 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: lo más importante, a primera hora, y después de comer, descanso o sitios a cubierto. Y como anochece sobre las 20:30, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 25 · Último domingo de mes** · etiqueta «Último domingo de mes» en el día 2
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 24.

### Día 1 — Vaticano, el Janículo y el Castillo al atardecer

**sábado 24 jul 2027** · 🌅 atardecer 20:37 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso a la sombra (antes de San Pietro in Montorio y Tempietto de Bramante) | 15 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:20 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:45 | Descanso a la sombra (antes de Fontana dell'Acqua Paola) | 45 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 16:30 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:05 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:40 | Castillo de Sant'Angelo | 110 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:45 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 21:00 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 25 jul 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 20:36 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 90 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 11:55 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 6 min andando | en Barrio Judío |
| 14:10 | Panteón | 30 min | Parada · por dentro | 10 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 14:45 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 14:55 | Descanso a la sombra (antes de Iglesia de Santa Maria sopra Minerva) | 35 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 15:55 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 16:30 | Largo di Torre Argentina | 15 min | Parada | 9 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:50 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:15 | Plaza Venecia | 10 min | Por el camino | 4 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 17:30 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 18:15 | Piazza Navona | 30 min | Parada | 17 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:50 | Campo de' Fiori | 60 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:05 | Ponte Sisto | 60 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 21:15 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 23:00 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Puente Sant'Angelo y Trastevere de noche» · Los ángeles de Bernini iluminados y el castillo reflejándose en el Tíber. Se cruza despacio. |

### Día 3 — Trevi a primera hora, el Pincio y la tarde en Monti

**lunes 26 jul 2027** · 🌅 atardecer 20:35 · día curado D4M (D, lunes)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 11:30. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:40 | Via del Babuino | 10 min | Por el camino | 6 min andando | Busca, junto a la iglesia de San Atanasio, una estatua tumbada y bastante fea: es un sileno, pero a los romanos les pareció un mono y la llamaron «el babuino». La calle se quedó con el nombre. Es una de las «estatuas parlantes», donde se colgaban críticas anónimas contra el Papa. Hoy es calle de anticuarios y galerías. |
| 11:00 | Piazza del Popolo | 10 min | Parada | 6 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 11:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. Ojo: por la mañana cierra a las 12:00. |
| 11:45 | Terraza del Pincio | 25 min | Parada | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 12:20 | Parque de Villa Borghese | 25 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 13:00 | Comida: Edy | 90 min | 🍝 Comida | 13 min andando | en Tridente y Spagna |
| 14:55 | Descanso a la sombra (antes de Basílica de San Juan de Letrán) | 25 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:20 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 25 min | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:15 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:55 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:25 | Mercados de Trajano | 50 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:25 | Monti | 85 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 20:15 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 21:00 | Cena: La Boccaccia |  | 🍷 Cena | 8 min andando | en Monti |
| 22:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-20"></a>
## 20. 2 días · sin Free Tour · sin experiencias · desde el sábado 7 ago 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: lo más importante, a primera hora, y después de comer, descanso o sitios a cubierto. Y como anochece sobre las 20:15, las mejores vistas llegan al atardecer.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 8 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 2
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 7 para que no los pierdas.

### Día 1 — Vaticano, el Janículo y el Castillo al atardecer

**sábado 7 ago 2027** · 🌅 atardecer 20:22 · día curado D2 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:05 | Descanso a la sombra (antes de San Pietro in Montorio y Tempietto de Bramante) | 15 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:20 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:45 | Descanso a la sombra (antes de Fontana dell'Acqua Paola) | 45 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 16:30 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:05 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:40 | Castillo de Sant'Angelo | 105 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 19:30 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 20:45 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua y el centro barroco

**domingo 8 ago 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 20:20 · día curado D1 (D, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 90 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 11:55 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:30 | Comida: Nonna Betta | 90 min | 🍝 Comida | 6 min andando | en Barrio Judío |
| 14:10 | Panteón | 30 min | Parada · por dentro | 10 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 14:45 | Elefantino de Bernini | 10 min | Por el camino | 3 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 14:55 | Descanso a la sombra (antes de Iglesia de Santa Maria sopra Minerva) | 35 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 1 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 15:55 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 8 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 16:30 | Largo di Torre Argentina | 15 min | Parada | 9 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:50 | Iglesia del Gesù | 20 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 17:15 | Plaza Venecia | 10 min | Por el camino | 4 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 17:30 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 18:15 | Piazza Navona | 30 min | Parada | 17 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:50 | Campo de' Fiori | 60 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 19:55 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:45 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 10 min andando | en Centro Histórico |
| 22:30 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Puente Sant'Angelo y Trastevere de noche» · Los ángeles de Bernini iluminados y el castillo reflejándose en el Tíber. Se cruza despacio. |

**Lo que quedó fuera**: nada.

<a id="ruta-21"></a>
## 21. 5 días · Free Tour · sin experiencias · desde el lunes 23 ago 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: después de comer, descanso o sitios a cubierto. Y como anochece sobre las 20:00, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): ninguno.

### Día 1 — Free Tour y el Vaticano por la tarde

**lunes 23 ago 2027** · 🌅 atardecer 19:59 · día curado D3 (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy está cerrado por dentro) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:00 | Roma iluminada desde el Puente Sant'Angelo | 15 min | 🌙 Noche | 2 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 20:30 | Cena: Il Sorpasso |  | 🍷 Cena | 9 min andando | en Vaticano |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:55 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**martes 24 ago 2027** · 🌅 atardecer 19:57 · día curado D1-FT (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 90 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Descanso a la sombra (antes de San Pietro in Montorio y Tempietto de Bramante) | 15 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 15:05 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Parada · por dentro | 17 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:25 | Descanso a la sombra (antes de Fontana dell'Acqua Paola) | 65 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 16:30 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:05 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 17:50 | Basílica de Santa Cecilia in Trastevere | 20 min | Parada | 25 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. |
| 18:15 | Isla Tiberina | 20 min | Parada | 4 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 18:45 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 9 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:05 | Trastevere | 35 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:45 | Ponte Sisto | 35 min | 🌅 Atardecer | 5 min andando | El puente de peatones entre Trastevere y el centro. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:30 | Cena: Dar Filettaro a Santa Barbara |  | 🍷 Cena | 5 min andando | en Centro Histórico |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere, Foro Romano desde el Campidoglio, Puente Sant'Angelo y Mirador del Janículo de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 23:00 | Foro Romano desde el Campidoglio (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere, Foro Romano desde el Campidoglio, Puente Sant'Angelo y Mirador del Janículo de noche» · Desde la terraza de detrás del Campidoglio, el Foro entero iluminado a tus pies: columnas, arcos y templos en silencio, con el Coliseo al fondo. |

### Día 3 — El Castillo, la Borghese y el Popolo

**miércoles 25 ago 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 19:56 · día curado D4 (D, con_free_tour)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Castillo de Sant'Angelo | 65 min | Parada · por dentro | — | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 08:30 | Descanso a la sombra (antes de Parque de Villa Borghese) | 115 min | 🕐 Descanso |  | En verano los romanos se esconden del calor a estas horas. |
| 10:25 | Parque de Villa Borghese | 15 min | Parada | 🚌 Un taxi, 20 min | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 16:45 | Parque de Villa Borghese | 55 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 17:50 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 18:15 | Piazza del Popolo | 5 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 18:25 | Santa Maria del Popolo | 10 min | Por fuera (Por dentro abre de 08:30 a 09:45 y de 10:30 a 12:00 y de 16:00 a 18:00) | 3 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 18:45 | Ara Pacis | 10 min | Por fuera (Por dentro abre de 09:30 a 19:30) | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 19:00 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 19:35 | Pasea y piérdete por Via del Corso y Via Condotti | 50 min | Parada | 5 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 20:30 | Cena: Il Gabriello |  | 🍷 Cena | 3 min andando | en Tridente y Spagna |
| 22:00 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |

### Día 4 — Excursión

**jueves 26 ago 2027** · 🌅 atardecer 19:54

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**viernes 27 ago 2027** · 🌅 atardecer 19:53 · día curado D5C (D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 90 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:30 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:30 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 16:25 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:35 | Mercados de Trajano | 75 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 19:00 | Monti | 40 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 19:50 | Via dei Fori Imperiali | 20 min | 🌅 Atardecer | 9 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 20:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 22:00 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-22"></a>
## 22. 3 días · sin Free Tour · Barrios · desde el viernes 3 sep 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: lo más importante, a primera hora. Y como anochece sobre las 19:45, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 5 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 4 para que no los pierdas.

### Día 1 — Roma Antigua y el centro barroco

**viernes 3 sep 2027** · 🌅 atardecer 19:41 · día curado D1 (C, barrios_sabores)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:35 | Barrio Judío | 40 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. · experiencia: Barrios |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 40 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. · experiencia: Barrios |
| 19:20 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 20:15 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 22:00 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:55 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, el Janículo y el Castillo al atardecer

**sábado 4 sep 2027** · 🌅 atardecer 19:39 · día curado D2 (D, barrios_sabores, luz:C→D)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 65 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 90 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 15:20 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:45 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:15 | Mirador del Janículo | 20 min | Parada | 16 min andando | Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa. |
| 16:50 | Castillo de Sant'Angelo | 95 min | Parada · por dentro | 🚌 Un taxi, 17 min | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel con la luz de última hora: el Tíber, San Pedro y toda Roma a tus pies. |
| 18:45 | Puente Sant'Angelo | 70 min | 🌅 Atardecer | 2 min andando | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:55 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 3 — Trevi a primera hora, Monti y el Pincio al atardecer

**domingo 5 sep 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:38 · día curado D4M (C, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:55 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 20 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 11:40 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 12:05 | Mercados de Trajano | 45 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 13:00 | Monti | 20 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. · experiencia: Barrios |
| 13:30 | Comida: La Boccaccia | 90 min | 🍝 Comida | 2 min andando | en Monti y Fori Imperiali |
| 15:20 | Via Margutta | 30 min | Parada | 🚇 Metro A o un taxi, 20 min | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 15:55 | Piazza del Popolo | 15 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:30 | Santa Maria del Popolo | 30 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:15 | Parque de Villa Borghese | 90 min | Parada | 16 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 19:05 | Terraza del Pincio | 60 min | 🌅 Atardecer | 11 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 20:15 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 22:00 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio y Puente Sant'Angelo de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |
| 22:55 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio y Puente Sant'Angelo de noche» · Los ángeles de Bernini iluminados y el castillo reflejándose en el Tíber. Se cruza despacio. |

**Lo que quedó fuera**: nada.

<a id="ruta-23"></a>
## 23. 3 días · Free Tour · Arte · desde el viernes 10 sep 2027

**Nota de temporada**: ¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor. Y como anochece sobre las 19:30, las mejores vistas llegan al atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 12 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 10 para que no los pierdas.

### Día 1 — Free Tour y el Vaticano por la tarde

**viernes 10 sep 2027** · 🌅 atardecer 19:29 · día curado D3 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. · experiencia: Arte |
| 20:00 | Roma iluminada desde el Puente Sant'Angelo | 15 min | 🌙 Noche | 2 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:00 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:55 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 11 sep 2027** · 🌅 atardecer 19:27 · día curado D1-FT (C, sabado, arte_museos)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Antico Forno Roscioli | 90 min | 🍝 Comida | 13 min andando | en Centro Histórico |
| 15:15 | Museos Capitolinos | 60 min | Parada · por dentro | 12 min andando | Los museos públicos más antiguos del mundo, en la plaza de Miguel Ángel. Dentro está la loba que amamanta a Rómulo y Remo, el símbolo de Roma, y la estatua original de Marco Aurelio a caballo. · experiencia: Arte |
| 16:25 | Barrio Judío | 35 min | Parada | 11 min andando | Es uno de los barrios judíos más antiguos de Europa. El sábado es su día de descanso: muchos comercios y restaurantes cierran y las calles se quedan tranquilas. Busca el Pórtico de Octavia, unas ruinas romanas en mitad de la calle, y la Gran Sinagoga, junto al río. |
| 17:10 | Basílica de Santa Cecilia in Trastevere | 25 min | Parada | 11 min andando | La iglesia de la patrona de la música. Bajo el altar hay una estatua de santa Cecilia tumbada, tal y como dicen que encontraron su cuerpo. La iglesia es gratis y abre a las 16:30. · experiencia: Arte |
| 17:50 | San Pietro in Montorio y Tempietto de Bramante | 10 min | Por fuera (Por dentro abre de 10:00 a 18:00) | 13 min andando | A través de la verja se ve el pequeño templo de Bramante, construido donde se creía que crucificaron a san Pedro. Y desde la puerta de la iglesia tienes Roma entera delante. · experiencia: Arte |
| 18:05 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:35 | Mirador del Janículo | 70 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 20:05 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. · experiencia: Arte |
| 20:25 | Trastevere | 30 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 21:15 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 10 min andando | en Trastevere |
| 23:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**domingo 12 sep 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 19:26 · día curado D4 (C, con_free_tour, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Castillo de Sant'Angelo | 65 min | Parada · por dentro | — | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. · experiencia: Arte |
| 10:25 | Parque de Villa Borghese | 15 min | Parada | 🚌 Un taxi, 20 min | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. · experiencia: Arte |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 15:00 | Parque de Villa Borghese | 90 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:40 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 17:05 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:20 | Ara Pacis | 45 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. · experiencia: Arte |
| 18:10 | Via Margutta | 35 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 18:50 | Santa Maria del Popolo | 10 min | Por fuera (Por dentro abre de 16:30 a 18:00) | 6 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. · experiencia: Arte |
| 19:05 | Terraza del Pincio | 40 min | 🌅 Atardecer | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 20:00 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio y Puente Sant'Angelo de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |
| 22:25 | Puente Sant'Angelo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio y Puente Sant'Angelo de noche» · Los ángeles de Bernini iluminados y el castillo reflejándose en el Tíber. Se cruza despacio. |

**Lo que quedó fuera**: nada.

<a id="ruta-24"></a>
## 24. 2 días · sin Free Tour · sin experiencias · desde el martes 28 sep 2027

**Nota de temporada**: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 19:00, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

> **Banner del viaje**: 2 días en Roma dan para mucho si se aprovechan bien. Hemos puesto los imprescindibles primero para que vuelvas a casa habiendo visto lo que de verdad importa. Si tienes otros planes, puedes cambiar cualquier parada desde los tres puntos.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Miércoles 29 · Audiencia papal** · etiqueta «Audiencia papal» en el día 2
  - Los miércoles por la mañana el Papa recibe a los fieles en la plaza y la Basílica abre más tarde. Hemos puesto San Pedro por la tarde.

### Día 1 — Roma Antigua y el centro barroco

**martes 28 sep 2027** · 🌅 atardecer 18:58 · día curado D1 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Giggetto al Portico d'Ottavia | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:35 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 15:40 | Iglesia del Gesù | 10 min | Por fuera (Por dentro abre de 07:30 a 12:30 y de 16:00 a 19:30) | 5 min andando | La iglesia madre de los jesuitas, con una de las fachadas más copiadas del mundo. Si está abierta, entra: el techo pintado parece que se sale del marco. |
| 15:55 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:10 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:25 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:25 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:00 | Campo de' Fiori | 30 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 18:35 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. |
| 19:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**miércoles 29 sep 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🏷️ Audiencia papal · 🌅 atardecer 18:56 · día curado D2 (C, miercoles)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 180 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:10 | Borgo Pio | 10 min | Por el camino | 10 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 11:30 | Puente Sant'Angelo | 15 min | Parada | 9 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 11:45 | Castillo de Sant'Angelo | 75 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 13:15 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 6 min andando | en Vaticano y Borgo |
| 14:40 | Plaza de San Pedro | 20 min | Parada | 7 min andando | La plaza de Bernini, con sus columnas que abrazan a los peregrinos. Busca uno de los dos discos del suelo entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas se alinean y parecen una sola. |
| 15:05 | Basílica de San Pedro | 110 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 17:10 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 🚌 Un taxi, 17 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:30 | Fontana dell'Acqua Paola | 15 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 18:05 | Mirador del Janículo | 70 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 19:30 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 🚌 Bus 23 por el Lungotevere, 15 min | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:50 | Trastevere | 30 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

**Lo que quedó fuera**: nada.

<a id="ruta-25"></a>
## 25. 4 días · sin Free Tour · Naturaleza · desde el viernes 1 oct 2027

**Nota de temporada**: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 19:00, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 3 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 2 para que no los pierdas.
- **Domingo 3 · La Galería Borghese, gratis con reserva** · etiqueta «La Galería Borghese, gratis con reserva» en el día 3
  - El primer domingo de mes la Galería Borghese es gratis, pero hay que reservar: las entradas salen 10 días antes y es posible que se agoten enseguida.

### Día 1 — Roma Antigua y el centro barroco

**viernes 1 oct 2027** · 🌅 atardecer 18:53 · día curado D1 (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 60 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:35 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:05 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:20 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 15:40 | Iglesia del Gesù | 10 min | Por fuera (Por dentro abre de 07:30 a 12:30 y de 16:00 a 19:30) | 5 min andando | La iglesia madre de los jesuitas, con una de las fachadas más copiadas del mundo. Si está abierta, entra: el techo pintado parece que se sale del marco. |
| 15:55 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:10 | Elefantino de Bernini | 10 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:25 | Panteón | 30 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:00 | Iglesia de San Luigi dei Francesi | 20 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:25 | Piazza Navona | 30 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:00 | Campo de' Fiori | 25 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 18:30 | Ponte Sisto | 40 min | 🌅 Atardecer | 6 min andando | El puente de peatones entre el centro y Trastevere. Al caer el sol, la cúpula de San Pedro se recorta al fondo sobre el Tíber: es la foto que buscan los romanos. · experiencia: Naturaleza |
| 19:30 | Cena: Armando al Pantheon |  | 🍷 Cena | 13 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 2 oct 2027** · 🌅 atardecer 18:51 · día curado D2 (C, naturaleza_vistas)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. · experiencia: Naturaleza |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:10 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:20 | Castillo de Sant'Angelo | 100 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 17:15 | San Pietro in Montorio y Tempietto de Bramante | 15 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:35 | Fontana dell'Acqua Paola | 20 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. · experiencia: Naturaleza |
| 18:10 | Mirador del Janículo | 60 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. · experiencia: Naturaleza |
| 19:30 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:50 | Trastevere | 30 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 1 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi, la Borghese con su parque y el Popolo

**domingo 3 oct 2027** · 🏷️ Museos Vaticanos cerrados · 🏷️ La Galería Borghese, gratis con reserva · 🌅 atardecer 18:49 · día curado D4 (C, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:30 | Plaza de España | 20 min | Parada | 10 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 09:50 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. · experiencia: Naturaleza |
| 10:15 | Parque de Villa Borghese | 35 min | Parada | 14 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. · experiencia: Naturaleza |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 90 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 15:00 | Parque de Villa Borghese | 50 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. · experiencia: Naturaleza |
| 16:00 | Jardines del Pincio | 20 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. · experiencia: Naturaleza |
| 16:25 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:40 | Ara Pacis | 45 min | Parada · por dentro | 7 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 17:30 | Via Margutta | 35 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 18:10 | Santa Maria del Popolo | 10 min | Por fuera (Por dentro abre de 16:30 a 18:00) | 6 min andando | La iglesia de los Caravaggio, en una esquina de la Piazza del Popolo. Si está abierta, entra: dos cuadros suyos y una capilla de Rafael. |
| 18:25 | Terraza del Pincio | 50 min | 🌅 Atardecer | 6 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. · experiencia: Naturaleza |
| 19:30 | Cena: Sgarro Bistrot |  | 🍷 Cena | 9 min andando | en Tridente y Spagna |
| 21:30 | Plaza de España (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La escalinata iluminada» · Después de cenar, baja por Via Condotti hasta la escalinata iluminada, con la Barcaccia sonando y Trinità dei Monti encendida arriba. |

### Día 4 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**lunes 4 oct 2027** · 🌅 atardecer 18:47 · día curado D5C (C)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. · experiencia: Naturaleza |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 45 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:00 | Basílica de San Juan de Letrán | 35 min | Parada · por dentro | 15 min andando | La catedral de Roma, más antigua que San Pedro. Fíjate en la fachada, con sus quince estatuas gigantes mirando la ciudad, y entra al claustro: columnas retorcidas llenas de mosaicos, y casi siempre vacío. |
| 15:55 | Basílica de Santa María la Mayor | 30 min | Parada · por dentro | 21 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 16:35 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:05 | Mercados de Trajano | 60 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 18:30 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 7 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 19:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 10 min andando | en Monti |
| 21:30 | Coliseo (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado» · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |

**Lo que quedó fuera**: nada.

<a id="ruta-26"></a>
## 26. 3 días · sin Free Tour · sin experiencias · desde el viernes 29 oct 2027

**Nota de temporada**: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:15 (desde el domingo 31, con el cambio de hora, hasta las 17:00), hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 31 · Último domingo de mes** · etiqueta «Último domingo de mes» en el día 3
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 30.

### Día 1 — Roma Antigua y el centro barroco

**viernes 29 oct 2027** · 🌅 atardecer 18:09 · día curado D1 (B)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 30 oct 2027** · 🌅 atardecer 18:07 · día curado D2 (B, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 60 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:35 | Via della Conciliazione | 10 min | Por el camino | 4 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 14:55 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:05 | Castillo de Sant'Angelo | 85 min | Parada · por dentro | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 16:45 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 🚌 Un taxi, 16 min | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 17:10 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 17:35 | Mirador del Janículo | 50 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 18:45 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 19:05 | Trastevere | 30 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:45 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 20:30 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |
| 22:00 | Trastevere de noche | 40 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — Trevi a primera hora, Monti y el Pincio al atardecer

**domingo 31 oct 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 17:06 · día curado D4M (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:55 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 20 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 11:40 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 12:05 | Mercados de Trajano | 45 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 13:00 | Monti | 20 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 13:30 | Comida: La Boccaccia | 75 min | 🍝 Comida | 2 min andando | en Monti y Fori Imperiali |
| 15:05 | Via Margutta | 30 min | Parada | 🚇 Metro A o un taxi, 20 min | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 15:40 | Piazza del Popolo | 15 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 16:15 | Parque de Villa Borghese | 25 min | Parada | 18 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:50 | Terraza del Pincio | 35 min | 🌅 Atardecer | 11 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 17:30 | Santa Maria del Popolo | 25 min | Parada · por dentro | 5 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 18:10 | Pasea y piérdete por Via del Corso y Via Condotti iluminadas | 75 min | Parada | 11 min andando | Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día. |
| 19:30 | Cena: Sgarro Bistrot |  | 🍷 Cena | 11 min andando | en Tridente y Spagna |
| 21:30 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado y la Piazza Navona con sus fuentes están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |
| 22:25 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Sin los puestos ni los pintores, la plaza es otra: la Fuente de los Cuatro Ríos iluminada y el rumor del agua. Dale la vuelta despacio antes de irte. |

**Lo que quedó fuera**: nada.

<a id="ruta-27"></a>
## 27. 3 días · Free Tour · sin experiencias · desde el viernes 12 nov 2027

**Nota de temporada**: ¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 16:45, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 14 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 3
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el viernes 12 para que no los pierdas.

### Día 1 — Free Tour y el Vaticano por la tarde

**viernes 12 nov 2027** · 🌅 atardecer 16:52 · día curado D3 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Por dentro abre de 09:00 a 19:30) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:00 | Roma iluminada desde el Puente Sant'Angelo | 15 min | 🌙 Noche | 2 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:15 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**sábado 13 nov 2027** · 🌅 atardecer 16:51 · día curado D1-FT (A, sabado, comida:sin Plaza del Campidoglio)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:10 | Plaza Venecia | 10 min | Por el camino | 5 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:25 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Antico Forno Roscioli | 55 min | 🍝 Comida | 13 min andando | en Centro Histórico |
| 14:20 | Barrio Judío | 20 min | Parada | 8 min andando | Es uno de los barrios judíos más antiguos de Europa. El sábado es su día de descanso: muchos comercios y restaurantes cierran y las calles se quedan tranquilas. Busca el Pórtico de Octavia, unas ruinas romanas en mitad de la calle, y la Gran Sinagoga, junto al río. |
| 14:45 | Fuente de las Tortugas | 5 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:00 | Teatro de Marcelo | 10 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:35 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 23 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 16:00 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:30 | Mirador del Janículo | 40 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 17:30 | Iglesia de Santa Maria in Trastevere | 30 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 18:00 | Trastevere | 80 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:30 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 10 min andando | en Trastevere |
| 21:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**domingo 14 nov 2027** · 🏷️ Museos Vaticanos cerrados · 🌅 atardecer 16:51 · día curado D5C (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 50 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:05 | Basílica de Santa María la Mayor | 25 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:45 | Mercados de Trajano | 45 min | Parada · por dentro | 17 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 16:35 | Via dei Fori Imperiali | 35 min | 🌅 Atardecer | 7 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:20 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 10 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:40 | Monti | 30 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 18:20 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:30 | Cena: La Boccaccia |  | 🍷 Cena | 2 min andando | en Monti |

**Lo que quedó fuera**: nada.

<a id="ruta-28"></a>
## 28. 2 días · sin Free Tour · sin experiencias · desde el sábado 27 nov 2027

**Nota de temporada**: Roma ya se viste de Navidad: las calles estrenan luces. Hemos preparado tu ruta para que las veas, y como anochece sobre las 16:45, las disfrutarás de sobra.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 28 · Último domingo de mes** · etiqueta «Último domingo de mes» en el día 2
  - El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente. Hemos puesto tu visita otro día, el sábado 27.

### Día 1 — Vaticano, Castillo y Trastevere al atardecer

**sábado 27 nov 2027** · 🌅 atardecer 16:42 · día curado D2 (A, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 20 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:40 | Castillo de Sant'Angelo | 80 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:25 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 40 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 18:35 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 19:10 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche», antes de cenar · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 19:45 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |

### Día 2 — Roma Antigua y el centro barroco

**domingo 28 nov 2027** · 🏷️ Último domingo de mes · 🌅 atardecer 16:41 · día curado D1 (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Pizzeria Da Baffetto |  | 🍷 Cena | 6 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

**Lo que quedó fuera**: nada.

<a id="ruta-29"></a>
## 29. 3 días · sin Free Tour · sin experiencias · desde el viernes 10 dic 2027

**Nota de temporada**: ¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Domingo 12 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 1
  - Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el sábado 11 para que no los pierdas.
- **Mercadillo de Navidad en Piazza Navona** · etiqueta «Mercadillo de Navidad en Piazza Navona» en el día 1
  - Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad.

### Día 1 — Roma Antigua y el centro barroco

**viernes 10 dic 2027** · 🏷️ Museos Vaticanos cerrados · 🏷️ Mercadillo de Navidad en Piazza Navona · 🌅 atardecer 16:39 · día curado D1 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. · 🎄 Casi escondido junto a los Foros, en la basílica de los Santos Cosme y Damián, hay un gran belén napolitano del siglo XVIII, lleno de figuras. Poca gente lo conoce. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 40 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:30 | Comida: Nonna Betta | 75 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:50 | Barrio Judío | 25 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 15:20 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 15:35 | Largo di Torre Argentina | 15 min | Parada | 3 min andando | En mitad del tráfico, estos cuatro templos esconden algo que pocos saben: aquí mataron a Julio César. Asómate a la barandilla: hoy los cuida una colonia de gatos que vive entre las ruinas. |
| 16:00 | Iglesia del Gesù | 25 min | Parada · por dentro | 5 min andando | La iglesia madre de los jesuitas, a dos pasos del Largo Argentina. Mira el techo: las figuras se salen del marco y parece que caen hacia ti. A la izquierda, el altar de san Ignacio, todo oro y lapislázuli. |
| 16:30 | Iglesia de Santa Maria sopra Minerva | 15 min | Parada | 6 min andando | Detrás del Panteón está la única iglesia gótica de Roma, y la entrada es gratis. Mira hacia arriba: el techo es azul y lleno de estrellas. Junto al altar tienes un Cristo de Miguel Ángel. |
| 16:45 | Elefantino de Bernini | 5 min | Por el camino | 1 min andando | Un elefante pequeño con un obelisco egipcio encima, diseñado por Bernini. Cuenta la leyenda que le puso la cola mirando al convento de enfrente, con cuyos frailes se llevaba fatal. Búscala. |
| 16:55 | Panteón | 35 min | Parada · por dentro | 3 min andando | Tiene casi 2.000 años y sigue en pie como el primer día. Ponte justo debajo del óculo, el agujero de la cúpula: cuando llueve, el agua cae dentro y se va por unos desagües del suelo que siguen funcionando. Aquí está enterrado Rafael. |
| 17:35 | Iglesia de San Luigi dei Francesi | 15 min | Parada · por dentro | 6 min andando | A dos pasos de Navona, y entrar es gratis. En la última capilla de la izquierda hay tres cuadros de Caravaggio sobre san Mateo. Lleva una moneda: la luz que los ilumina funciona así, y verlos encendidos cambia todo. |
| 17:55 | Piazza Navona | 35 min | Parada | 3 min andando | Tiene esta forma alargada porque aquí había un estadio romano, y las casas se construyeron encima de sus gradas. En el centro está la Fuente de los Cuatro Ríos de Bernini. Cuenta la leyenda que una de sus estatuas se tapa los ojos para no ver la iglesia de su rival, Borromini. · 🎄 En Navidad, Navona es de la Befana: puestos de dulces, figuritas para el belén y carbón de azúcar para los niños que se han portado "mal". |
| 18:35 | Campo de' Fiori | 75 min | Parada | 7 min andando | Es el sitio donde Roma se queda a tomar algo antes de cenar. La estatua oscura del centro es Giordano Bruno, al que quemaron justo aquí. |
| 20:00 | Cena: Armando al Pantheon |  | 🍷 Cena | 7 min andando | en Centro Histórico |
| 21:30 | Fontana de Trevi (noche) | 45 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día. |
| 22:25 | Plaza de España (noche) | 25 min | 🌙 Noche |  | paseo nocturno «La Roma de las fuentes» · Sube por la escalinata casi vacía hasta Trinità dei Monti y date la vuelta: Via Condotti iluminada hasta el fondo. Es la foto que de día no se puede hacer. |

### Día 2 — Vaticano, Castillo y Trastevere al atardecer

**sábado 11 dic 2027** · 🌅 atardecer 16:39 · día curado D2 (A, relleno_cena:Isla Tiberina)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:00 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | — | Entras con el primer turno, cuando todavía hay poca gente. Si vas directo a la Capilla Sixtina, la verás como casi nadie la ve: tranquila. Dentro no se pueden hacer fotos: disfrútala con los ojos. |
| 11:15 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. · 🎄 A un paseo corto, en Via di Porta Cavalleggeri, está el belén de los barrenderos: lo empezó uno de ellos en 1972, con piedras de todo el mundo. Juan Pablo II venía a verlo. Se visita con reserva en la web de AMA. |
| 11:35 | Cúpula de San Pedro | 45 min | Parada · por dentro | 3 min andando | Sube a la cúpula de Miguel Ángel. Los últimos tramos de escalera se inclinan siguiendo la curva de la cúpula, y arriba tienes toda Roma y la plaza de San Pedro a tus pies. |
| 12:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 1 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 13:30 | Comida: Borghiciana Pastificio Artigianale | 75 min | 🍝 Comida | 9 min andando | en Vaticano y Borgo |
| 14:50 | Borgo Pio | 20 min | Parada | 3 min andando | Una calle peatonal junto al Vaticano, con cafés y trattorias de toda la vida. Es de los pocos rincones de la zona donde todavía comen los vecinos. |
| 15:15 | Via della Conciliazione | 10 min | Por el camino | 3 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 15:30 | Puente Sant'Angelo | 10 min | Parada | 7 min andando | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| 15:40 | Castillo de Sant'Angelo | 75 min | 🌅 Atardecer | 2 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Recórrelo sin prisa y sube a la terraza del ángel para el atardecer: tienes el Tíber, San Pedro y toda Roma a tus pies. |
| 17:20 | Iglesia de Santa Maria in Trastevere | 20 min | Parada · por dentro | 24 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:40 | Trastevere | 45 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 18:35 | Isla Tiberina | 20 min | Parada | 8 min andando | La única isla del Tíber, con forma de barco. Para llegar cruzas el Puente Fabricio, el puente romano más antiguo que sigue en pie: lo construyeron hace más de 2.000 años. |
| 19:05 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche», antes de cenar · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |
| 19:45 | Cena: Tonnarello |  | 🍷 Cena | 11 min andando | en Trastevere |

### Día 3 — Trevi a primera hora, Monti y el Pincio al atardecer

**domingo 12 dic 2027** · 🌅 atardecer 16:39 · día curado D4M (A, domingo)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y haces la foto que luego nadie consigue. Además bajas junto al agua sin pagar, porque la tasa de 2 € empieza a las 9:00. Tira la moneda de espaldas: dicen que así vuelves. |
| 09:00 | Desayuno romano | 20 min | ☕ Pausa | 3 min andando | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 09:25 | Iglesia de San Ignacio de Loyola | 15 min | Parada | 3 min andando | La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro. |
| 09:50 | Via Condotti | 10 min | Por el camino | 10 min andando | La calle de las grandes marcas, que desemboca justo en la escalinata. Su nombre viene de los conductos del acueducto que pasaban por debajo y que aún alimentan la Fontana de Trevi. |
| 10:05 | Plaza de España | 20 min | Parada | 7 min andando | La escalinata más famosa del mundo, con la iglesia de Trinità dei Monti arriba. Abajo está la Fuente de la Barcaccia, con forma de barca medio hundida. Un detalle: sentarse en los escalones está prohibido. |
| 10:25 | Trinità dei Monti | 10 min | Parada · por dentro | 1 min andando | La iglesia de las dos torres que corona la escalinata la empezaron los reyes de Francia hace más de cinco siglos, y todavía hoy es francesa. El obelisco de delante tiene jeroglíficos… copiados por los romanos. Asómate a la balaustrada: tienes Via Condotti a tus pies y, al fondo, la cúpula de San Pedro. |
| 10:55 | Basílica de Santa María la Mayor | 35 min | Parada · por dentro | 🚇 Metro A o un taxi, 20 min | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 11:40 | Iglesia de San Pietro in Vincoli | 15 min | Parada · por dentro | 12 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 12:05 | Mercados de Trajano | 45 min | Parada · por dentro | 9 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 13:00 | Monti | 20 min | Parada | 10 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 13:30 | Comida: La Boccaccia | 55 min | 🍝 Comida | 2 min andando | en Monti y Fori Imperiali |
| 14:45 | Via Margutta | 30 min | Parada | 🚇 Metro A o un taxi, 20 min | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 15:20 | Piazza del Popolo | 15 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 15:55 | Parque de Villa Borghese | 25 min | Parada | 18 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 16:30 | Terraza del Pincio | 25 min | 🌅 Atardecer | 11 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 17:00 | Santa Maria del Popolo | 25 min | Parada · por dentro | 5 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:50 | Piazza Navona (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · En Navidad la plaza se llena con el mercadillo: puestos de dulces, belenes y la Befana, con la Fuente de los Cuatro Ríos iluminada en medio. Date una vuelta entre los puestos antes de cenar. |
| 18:30 | Panteón (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El centro iluminado», antes de cenar · El Panteón de noche, con el pórtico iluminado y la plaza casi vacía. Siéntate un momento en la fuente: es cuando más impresiona. |
| 19:30 | Cena: Sgarro Bistrot |  | 🍷 Cena | 11 min andando | en Tridente y Spagna |

**Lo que quedó fuera**: nada.

<a id="ruta-30"></a>
## 30. 5 días · Free Tour · sin experiencias · desde el lunes 13 dic 2027

**Nota de temporada**: ¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.

**Avisos de fechas** (ventana al entrar en la ruta): 
- **Mercadillo de Navidad en Piazza Navona** · etiqueta «Mercadillo de Navidad en Piazza Navona» en el día 1
  - Del 1 de diciembre al 6 de enero, Piazza Navona se llena con el mercadillo de Navidad.

### Día 1 — Free Tour y el Vaticano por la tarde

**lunes 13 dic 2027** · 🏷️ Mercadillo de Navidad en Piazza Navona · 🌅 atardecer 16:39 · día curado D3 (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Desayuno romano | 35 min | ☕ Pausa | — | Desayuna como un romano: cappuccino y cornetto de pie en la barra, en dos minutos y charlando con el camarero. Sentarse en la mesa es de turista, y suele costar más. |
| 10:00 | Free Tour Centro Histórico | 155 min | Parada (Free Tour) | 10 min andando | Dos horas y media por el centro con un guía que te cuenta la historia y las anécdotas de todo lo que ves. Sale de la Plaza de España y es la mejor forma de entender Roma. · El tour acaba en Piazza Navona. · recorre: Plaza de España, Via Condotti, Fontana de Trevi, Iglesia de San Ignacio de Loyola, Panteón, Piazza Navona |
| 12:40 | Panteón | 25 min | Parada · por dentro | 7 min andando | El Free Tour te ha enseñado el Panteón por fuera; ahora toca verlo por dentro. Levanta la vista: la cúpula tiene un agujero de nueve metros abierto al cielo desde hace casi dos mil años. |
| 13:15 | Comida: Armando al Pantheon | 55 min | 🍝 Comida | 1 min andando | en Centro Histórico |
| 14:45 | Museos Vaticanos y Capilla Sixtina | 185 min | Parada · por dentro | 🚌 Bus 40 o un taxi, 25 min | Siete kilómetros de arte que acaban en la Capilla Sixtina de Miguel Ángel. Tómatelo con calma, es la visita del día. Dentro de la Capilla no se pueden hacer fotos: disfrútala con los ojos. |
| 18:00 | Plaza de San Pedro | 20 min | Parada | 11 min andando | Sales de los Museos y llegas a la plaza de Bernini. Busca uno de los dos discos del suelo junto al obelisco: desde ahí, las cuatro filas de columnas parecen una sola. · 🎄 A un paseo corto, en Via di Porta Cavalleggeri, está el belén de los barrenderos: lo empezó uno de ellos en 1972, con piedras de todo el mundo. Juan Pablo II venía a verlo. Se visita con reserva en la web de AMA. |
| 18:20 | Basílica de San Pedro | 60 min | Parada · por dentro | 3 min andando | La iglesia más grande del mundo, y entrar es gratis. Justo a la derecha nada más entrar está la Piedad de Miguel Ángel, que esculpió con 24 años. Lleva hombros y rodillas cubiertos, que lo miran en la puerta. |
| 19:25 | Via della Conciliazione | 10 min | Por el camino | 5 min andando | Es la gran avenida que lleva a San Pedro. Cuando vayas por la mitad, date la vuelta: verás la cúpula al fondo, perfectamente centrada, como si la calle se hubiera hecho solo para esa foto. |
| 19:45 | Castillo de Sant'Angelo | 15 min | Por fuera (Hoy está cerrado por dentro) | 9 min andando | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Hoy lo ves por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| 20:00 | Roma iluminada desde el Puente Sant'Angelo | 15 min | 🌙 Noche | 2 min andando | Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo. |
| 20:30 | Cena: L'Arcangelo |  | 🍷 Cena | 7 min andando | en Vaticano |
| 22:15 | Panteón (noche) | 45 min | 🌙 Noche |  | paseo nocturno «El centro iluminado» · Tu noche en el centro, iluminado y con menos gente. El Panteón, con su pórtico iluminado, la Piazza Navona con sus fuentes, la Fontana de Trevi y la escalinata de la Plaza de España están a pocos minutos a pie unos de otros: un paseo precioso para cerrar el día. |

### Día 2 — Roma Antigua, el Ghetto y Trastevere al atardecer

**martes 14 dic 2027** · 🌅 atardecer 16:39 · día curado D1-FT (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 08:30 | Coliseo | 85 min | Parada · por dentro | — | Llegas a la apertura, cuando todavía hay poca cola y hace fresco. Empezar el día dentro del Coliseo, casi vacío, es de esas cosas que no se olvidan. Guarda la entrada: con la misma ves después el Foro y el Palatino. |
| 10:00 | Arco de Constantino | 20 min | Parada | 3 min andando | Pegado al Coliseo está el arco triunfal mejor conservado de Roma. Fíjate en los relieves: muchos son más antiguos que el propio arco, porque los romanos los reaprovecharon de otros monumentos. |
| 10:25 | Foro Romano y Palatino | 100 min | Parada · por dentro | 4 min andando | Aquí latía la Roma antigua: templos, tribunales y mercados a lo largo de la Vía Sacra. Sube también al Palatino, donde vivían los emperadores; de ahí viene la palabra «palacio». Sales por el lado del Campidoglio, justo por donde sigue el día. · 🎄 Casi escondido junto a los Foros, en la basílica de los Santos Cosme y Damián, hay un gran belén napolitano del siglo XVIII, lleno de figuras. Poca gente lo conoce. |
| 12:05 | Plaza del Campidoglio | 15 min | Parada | 2 min andando | Esta plaza la diseñó Miguel Ángel. Justo detrás, rodeando el edificio del Ayuntamiento, hay un mirador desde el que ves el Foro Romano entero a tus pies. Apúntatelo: poca gente sabe que está ahí. |
| 12:25 | Plaza Venecia | 10 min | Por el camino | 3 min andando | Es la gran plaza a los pies del Altar de la Patria, y desde aquí lo ves entero antes de subir. En un lado de la plaza está el Palacio Venecia, con el balcón desde el que hablaba Mussolini. |
| 12:40 | Altar de la Patria | 30 min | Parada · por dentro | 5 min andando | Los romanos lo llaman «la máquina de escribir» por su mármol blanco y su forma. Por dentro se entra gratis y merece la pena subir sus escaleras sin prisa. Si te animas, la terraza panorámica (va aparte) tiene Roma entera a tus pies. |
| 13:15 | Comida: Giggetto al Portico d'Ottavia | 55 min | 🍝 Comida | 7 min andando | en Barrio Judío |
| 14:15 | Barrio Judío | 15 min | Parada | 1 min andando | Es uno de los barrios judíos más antiguos de Europa, y se nota en sus calles y en su cocina. Si es hora de comer, pide alcachofas a la judía: fritas enteras y crujientes, como aquí no las hacen en ningún otro sitio. |
| 14:35 | Fuente de las Tortugas | 10 min | Por el camino | 4 min andando | Escondida en una placita del Ghetto está una de las fuentes más bonitas de Roma. Busca las tortugas en lo alto: dicen que las añadió Bernini muchos años después. |
| 14:55 | Teatro de Marcelo | 10 min | Por el camino | 8 min andando | Parece un Coliseo pequeño, y es más antiguo que el Coliseo. Lo curioso es que encima de las gradas romanas hay casas en las que hoy vive gente. |
| 15:30 | San Pietro in Montorio y Tempietto de Bramante | 20 min | Parada · por dentro | 23 min andando | Subiendo al Janículo, en el patio de esta iglesia, está el Tempietto de Bramante: un templo pequeñísimo, construido donde se creía que crucificaron a san Pedro. Es una joya del Renacimiento y se entra gratis. |
| 15:55 | Fontana dell'Acqua Paola | 10 min | Parada | 5 min andando | Los romanos la llaman «el Fontanone». Esta gran fuente de mármol es la primera imagen de la película «La gran belleza», y desde su balaustrada tienes Roma entera delante. |
| 16:20 | Mirador del Janículo | 35 min | 🌅 Atardecer | 16 min andando | El atardecer más bonito de Roma, con toda la ciudad a tus pies. Busca un hueco en la balaustrada y quédate hasta que se enciendan las luces. Después se baja a cenar a Trastevere, unos 20 min cuesta abajo. |
| 17:15 | Iglesia de Santa Maria in Trastevere | 30 min | Parada · por dentro | 20 min andando | Una de las iglesias más antiguas de Roma, en la plaza que es el corazón de Trastevere. La entrada es gratis y dentro brillan unos mosaicos dorados que no esperas: no te la saltes. |
| 17:45 | Trastevere | 90 min | Parada | 1 min andando | Aquí toca perderse: calles de piedra, ropa tendida, hiedra en las fachadas y trattorias en cada esquina. Busca un sitio para el aperitivo antes de cenar, que es lo que hacen los romanos. |
| 19:30 | Cena: Trattoria Da Enzo al 29 |  | 🍷 Cena | 10 min andando | en Trastevere |
| 21:00 | Trastevere de noche | 25 min | 🌙 Noche |  | paseo nocturno «Trastevere de noche» · Después de cenar, Trastevere se enciende: guitarras en la Plaza Trilussa, gente sentada en la fuente y terrazas hasta tarde. Cruza el Ponte Sisto y mira atrás: la cúpula de San Pedro asoma sobre el río iluminado. |

### Día 3 — El Castillo, la Borghese y el Popolo

**miércoles 15 dic 2027** · 🎉 audiencia papal (miércoles por la mañana) · 🌅 atardecer 16:40 · día curado D4 (A, con_free_tour)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:00 | Castillo de Sant'Angelo | 65 min | Parada · por dentro | — | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad. |
| 10:25 | Parque de Villa Borghese | 15 min | Parada | 🚌 Un taxi, 20 min | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 11:00 | Galería Borghese | 125 min | Parada · por dentro | 9 min andando | La mejor colección de Bernini y Caravaggio del mundo, en la villa de un cardenal. Busca «Apolo y Dafne»: el mármol parece convertirse en hojas delante de ti. Se entra por turnos y con reserva, así que llega con margen. |
| 13:15 | Comida: Girarrosto Fiorentino | 70 min | 🍝 Comida | 10 min andando | en Via Veneto y Salario |
| 14:40 | Parque de Villa Borghese | 65 min | Parada | 12 min andando | Un paseo por el gran parque de Roma, pegado al Pincio. Busca el lago y su templete: es uno de los rincones más bonitos del parque. |
| 15:55 | Jardines del Pincio | 15 min | Parada | 9 min andando | Vuelve a subir al Pincio, 7 min de escaleras desde la plaza, y pasea por sus jardines hasta que baje el sol. |
| 16:15 | Terraza del Pincio | 40 min | 🌅 Atardecer | 2 min andando | La terraza sobre la Piazza del Popolo, con las cúpulas del centro y San Pedro al fondo. Es el mirador de los romanos al atardecer. |
| 17:00 | Piazza del Popolo | 10 min | Parada | 5 min andando | Durante siglos, esta era la puerta por la que entraban en Roma los viajeros que llegaban del norte. El obelisco egipcio del centro lo trajo Augusto hace más de 2.000 años, y las dos iglesias gemelas enmarcan la entrada a la ciudad. |
| 17:15 | Santa Maria del Popolo | 25 min | Parada · por dentro | 3 min andando | Una joya que mucha gente se salta, y la entrada es gratis. Dentro hay dos Caravaggio en la capilla de la izquierda del altar y una capilla diseñada por Rafael. |
| 17:50 | Ara Pacis | 45 min | Parada · por dentro | 9 min andando | El Altar de la Paz del emperador Augusto, con más de 2.000 años, dentro de un edificio moderno de cristal junto al Tíber. Los relieves de la familia imperial parecen una foto de grupo. |
| 18:40 | Via Margutta | 30 min | Parada | 7 min andando | La calle de los artistas: aquí vivieron Fellini y Giulietta Masina, y en el número 51 estaba la casa de Gregory Peck en «Vacaciones en Roma». Todavía quedan estudios y galerías en los patios. Busca la Fuente de los Artistas, con sus caballetes y pinceles de piedra. |
| 19:30 | Cena: Il Gabriello |  | 🍷 Cena | 3 min andando | en Tridente y Spagna |
| 21:30 | Terraza del Pincio (noche) | 30 min | 🌙 Noche |  | paseo nocturno «Terraza del Pincio de noche» · La misma terraza, otra ciudad: las cúpulas y los tejados encendidos sobre la Piazza del Popolo. |

### Día 4 — Excursión

**jueves 16 dic 2027** · 🌅 atardecer 16:40

Excursión de día completo. Preseleccionada: **Excursión a Pompeya y Sorrento**. Opciones: Excursión a Pompeya y Sorrento, Excursión a Florencia y Pisa, Excursión a Nápoles y Pompeya en tren, Excursión a la Costa Amalfitana, Excursión a Florencia en tren de alta velocidad.

### Día 5 — El Aventino, Testaccio, las basílicas y el Coliseo de noche

**viernes 17 dic 2027** · 🌅 atardecer 16:40 · día curado D5C (A)

| Hora | Qué | Tiempo | Cómo sale en la app | Cómo llegas | Por qué aquí |
|---|---|---|---|---|---|
| 09:30 | Boca de la Verdad | 25 min | Parada | — | La máscara de «Vacaciones en Roma». Cuenta la leyenda que muerde la mano de quien miente: mete la mano, si te atreves. |
| 10:05 | Jardín de los Naranjos | 15 min | Parada | 11 min andando | Un jardín de naranjos en lo alto del Aventino, con una de las vistas más bonitas de Roma y casi sin turistas. Es donde vienen los romanos a sentarse un rato. |
| 10:25 | Ojo de la Cerradura del Aventino | 10 min | Parada | 4 min andando | Aquí suele haber una pequeña cola, y tiene su motivo. Mira por la cerradura de la puerta verde de los Caballeros de Malta: al fondo verás la cúpula de San Pedro, perfectamente enmarcada. |
| 10:45 | Pirámide Cestia | 10 min | Por el camino | 10 min andando | Sí, una pirámide de verdad en Roma. Es la tumba de un magistrado romano al que le entusiasmaba Egipto, y quedó metida dentro de la muralla. |
| 11:00 | Cementerio Protestante | 30 min | Parada | 5 min andando | Un cementerio jardín, precioso y silencioso, donde descansan los poetas Keats y Shelley. Es uno de los rincones más tranquilos de Roma. |
| 11:35 | Testaccio | 40 min | Parada | 7 min andando | El barrio más romano de Roma: aquí comen los de aquí. Detrás hay una colina hecha solo con trozos de ánforas antiguas. Baja callejeando hasta el mercado. |
| 12:30 | Comida: Felice a Testaccio | 70 min | 🍝 Comida | 1 min andando | en Testaccio |
| 14:00 | Basílica de San Clemente | 50 min | Parada · por dentro | 🚇 Metro B, 20 min | Tres iglesias, una encima de otra. Arriba, una basílica del siglo XII; debajo, otra más antigua; y al fondo, un templo romano donde se oye correr agua subterránea. La basílica de arriba es gratis; para bajar hay que reservar online. |
| 15:05 | Basílica de Santa María la Mayor | 25 min | Parada · por dentro | 17 min andando | Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V, y la entrada es gratis. Cuenta la leyenda que se construyó donde nevó un 5 de agosto. Aquí está enterrado el papa Francisco. |
| 15:45 | Mercados de Trajano | 45 min | Parada · por dentro | 17 min andando | El centro comercial de la Roma imperial, con sus tiendas en semicírculo. Desde arriba tienes los Foros a tus pies. |
| 16:35 | Via dei Fori Imperiali | 20 min | 🌅 Atardecer | 7 min andando | Pasea por la avenida de los Foros con la última luz, con las ruinas a los dos lados y el Coliseo al fondo. Es uno de los paseos más bonitos de Roma al atardecer. |
| 17:05 | Iglesia de San Pietro in Vincoli | 20 min | Parada · por dentro | 10 min andando | Aquí está el Moisés de Miguel Ángel, y se entra gratis. Fíjate en los cuernos: vienen de un error de traducción de la Biblia. También se guardan las cadenas que, dicen, llevó san Pedro. |
| 17:30 | Monti | 30 min | Parada | 4 min andando | El barrio con más vida de Roma: tiendas pequeñas, vinotecas y gente joven. Al caer la tarde, los vecinos se sientan en la fuente de la Piazza della Madonna dei Monti con algo de beber. |
| 18:10 | Coliseo (noche) | 25 min | 🌙 Noche |  | paseo nocturno «El Coliseo iluminado», antes de cenar · El final natural del día: el Coliseo iluminado, a un paso de la cena. De noche impresiona todavía más que de día, con los arcos encendidos y mucha menos gente alrededor. |
| 19:30 | Cena: Trattoria Valentino |  | 🍷 Cena | 6 min andando | en Monti |

**Lo que quedó fuera**: nada.

## Caso de prueba: agosto sin fechas frente a 13-15 de agosto

### 3 días en agosto, sin fechas

**Avisos de fechas**: 
- **Ferragosto** · sin etiqueta en ningún día: Si tu viaje coincide con el 15 de agosto: el 15 de agosto es festivo: cierran los Museos Vaticanos y muchos comercios.
- **La semana de Ferragosto** · sin etiqueta en ningún día: Del 13 al 16 de agosto es posible que muchas trattorias y tiendas cierren por vacaciones: llama o reserva antes de ir a comer o a cenar.

- **Día 1 — Roma Antigua y el centro barroco**: 08:30 Coliseo · 10:00 Arco de Constantino · 10:25 Foro Romano y Palatino · 11:55 Plaza del Campidoglio · 14:10 Panteón · 14:45 Elefantino de Bernini · 14:55 Iglesia de Santa Maria sopra Minerva · 15:20 Iglesia de San Luigi dei Francesi · 16:30 Largo di Torre Argentina · 16:50 Iglesia del Gesù · 17:15 Plaza Venecia · 17:30 Altar de la Patria · 18:15 Piazza Navona · 18:50 Campo de' Fiori · 19:50 Ponte Sisto · 22:30 Fontana de Trevi (noche)
- **Día 2 — Vaticano, el Janículo y el Castillo al atardecer**: 08:00 Museos Vaticanos y Capilla Sixtina · 11:15 Plaza de San Pedro · 11:35 Cúpula de San Pedro · 12:20 Basílica de San Pedro · 15:20 San Pietro in Montorio y Tempietto de Bramante · 16:30 Fontana dell'Acqua Paola · 17:05 Mirador del Janículo · 17:40 Castillo de Sant'Angelo · 19:20 Puente Sant'Angelo · 22:30 Panteón (noche)
- **Día 3 — Trevi a primera hora, el Pincio y la tarde en Monti**: 08:30 Fontana de Trevi · 09:00 Desayuno romano · 09:25 Iglesia de San Ignacio de Loyola · 09:50 Via Condotti · 10:05 Plaza de España · 10:25 Trinità dei Monti · 10:40 Via del Babuino · 11:00 Piazza del Popolo · 11:15 Santa Maria del Popolo · 11:45 Terraza del Pincio · 12:20 Parque de Villa Borghese · 14:55 Basílica de San Juan de Letrán · 15:50 Basílica de Santa María la Mayor · 16:30 Iglesia de San Pietro in Vincoli · 17:00 Mercados de Trajano · 18:00 Monti · 19:55 Via dei Fori Imperiali · 22:30 Coliseo (noche)

### Los mismos 3 días, del 13 al 15 de agosto de 2027

**Avisos de fechas**: 
- **Sábado 14 y domingo 15 · Museos Vaticanos cerrados** · etiqueta «Museos Vaticanos cerrados» en el día 2: Los Museos Vaticanos cierran el sábado 14 y el domingo 15, por Ferragosto. Hemos puesto tu visita el viernes 13 para que no los pierdas.
- **Sábado 14 · Misa en el Panteón** · etiqueta «Misa en el Panteón» en el día 2: El sábado el Panteón deja de vender entradas a las 16:00 por la misa. Hemos puesto tu visita nada más comer.
- **Domingo 15 · Panteón cerrado** · etiqueta «Panteón cerrado» en el día 3: El 15 de agosto el Panteón cierra por Ferragosto. Hemos puesto tu visita el sábado 14 para que no lo pierdas.
- **La semana de Ferragosto** · etiqueta «La semana de Ferragosto» en el día 1: Del 13 al 16 de agosto es posible que muchas trattorias y tiendas cierren por vacaciones: llama o reserva antes de ir a comer o a cenar.
- **Ferragosto** · etiqueta «Ferragosto» en el día 3: El 15 de agosto es festivo: cierran los Museos Vaticanos y muchos comercios. Hemos puesto el Vaticano otro día y el resto de tu ruta, en lo que abre.

- **Día 1 (viernes 13 ago 2027) — Vaticano, el Janículo y el Castillo al atardecer**: 08:00 Museos Vaticanos y Capilla Sixtina · 11:15 Plaza de San Pedro · 11:35 Cúpula de San Pedro · 12:20 Basílica de San Pedro · 15:20 San Pietro in Montorio y Tempietto de Bramante · 16:30 Fontana dell'Acqua Paola · 17:05 Mirador del Janículo · 17:40 Castillo de Sant'Angelo · 19:20 Puente Sant'Angelo · 22:30 Panteón (noche)
- **Día 2 (sábado 14 ago 2027) — Roma Antigua y el centro barroco**: 08:30 Coliseo · 10:00 Arco de Constantino · 10:25 Foro Romano y Palatino · 11:55 Plaza del Campidoglio · 12:20 Largo di Torre Argentina · 12:40 Barrio Judío · 14:55 Panteón · 15:30 Elefantino de Bernini · 15:40 Iglesia de Santa Maria sopra Minerva · 16:00 Iglesia del Gesù · 16:25 Plaza Venecia · 16:40 Altar de la Patria · 17:25 Iglesia de San Luigi dei Francesi · 17:50 Piazza Navona · 18:25 Campo de' Fiori · 19:40 Ponte Sisto · 22:30 Foro Romano desde el Campidoglio (noche)
- **Día 3 (domingo 15 ago 2027) — Trevi a primera hora, Monti y el Pincio al atardecer**: 08:30 Fontana de Trevi · 09:00 Desayuno romano · 09:25 Iglesia de San Ignacio de Loyola · 09:50 Via Condotti · 10:05 Plaza de España · 10:25 Trinità dei Monti · 10:55 Basílica de Santa María la Mayor · 11:40 Iglesia de San Pietro in Vincoli · 12:05 Mercados de Trajano · 13:00 Monti · 15:20 Ara Pacis · 16:30 Via Margutta · 17:05 Piazza del Popolo · 17:25 Santa Maria del Popolo · 18:05 Parque de Villa Borghese · 19:00 Jardines del Pincio · 19:50 Terraza del Pincio · 22:30 Terraza del Pincio (noche)

Sin fechas el viaje es el de siempre (D1, D2, D4M) y la ventana solo dice "Si tu viaje coincide…", sin etiqueta. Con el 13-15, el Vaticano pasa al viernes 13 y la ventana cuenta el Ferragosto en su día.

## Auditoría automática

Todas las comprobaciones de siempre, para cada ruta (scripts/destino/auditoria.mjs). Tiene que salir todo a 0, o con la lista de lo que no se ha podido arreglar.

- **Lugar repetido en el mismo día**: 0 ✅
- **Lugar repetido otro día (salvo nocturnas y revisitas)**: 0 ✅
- **Lugar del pool fuera de la ruta**: 0 ✅
- **Parada fuera de su horario real de ese día**: 0 ✅
- **Mirador de atardecer después del sol (o texto de atardecer de noche)**: 0 ✅
- **Tramo de más de 25 min andando sin transporte**: 0 ✅
- **Hora que no cuadra: la anterior + su duración + el paseo pasa de la hora de la parada**: 0 ✅
- **Hueco de más de 20 min sin nada entre dos paradas (30 antes del atardecer o de una entrada con turno)**: 0 ✅
- **Parada con «Todavía no ha abierto» o «Ya ha cerrado» a su hora (junto a un imprescindible va «Por fuera» sin aviso; si no, se mueve a cuando está abierta)**: 0 ✅
- **La misma foto propia en dos tarjetas del mismo día**: 0 ✅
- **Sale un «Tiempo libre» o un «Aperitivo» (ya no existen)**: 0 ✅
- **El paseo de «Pasea y piérdete por…» en el mismo sitio que la parada de antes (esa parada se alarga y no hay tarjeta aparte)**: 0 ✅
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
- **El día del Vaticano sin el Castillo de Sant'Angelo (ni por dentro ni por fuera)**: 0 ✅
- **El día del Vaticano sin el Puente Sant'Angelo de día**: 0 ✅
- **Más de 45 min antes de cenar sin nada, con un sitio de la ruta sin ver a un paseo**: 0 ✅
- **Un sitio del recorrido del Free Tour que sale también suelto el día del tour (Trevi a las 8:30 y el tour a las 10:00)**: 0 ✅
- **El mismo barrio dos veces el mismo día, con otra cosa en medio (Trastevere a las 16:15 y otra vez al anochecer)**: 0 ✅

## Recuento (Parte D)

- **Lugares repetidos en el mismo día**: 10
  - ruta 3, día 3: Parque de Villa Borghese (10:15 y 14:40)
  - ruta 7, día 3: Parque de Villa Borghese (10:15 y 14:50)
  - ruta 10, día 3: Parque de Villa Borghese (10:15 y 15:00)
  - ruta 12, día 3: Parque de Villa Borghese (10:15 y 15:00)
  - ruta 13, día 3: Parque de Villa Borghese (10:25 y 15:00)
  - ruta 18, día 3: Parque de Villa Borghese (10:15 y 16:45)
  - ruta 21, día 3: Parque de Villa Borghese (10:25 y 16:45)
  - ruta 23, día 3: Parque de Villa Borghese (10:25 y 15:00)
  - ruta 25, día 3: Parque de Villa Borghese (10:15 y 15:00)
  - ruta 30, día 3: Parque de Villa Borghese (10:25 y 14:40)
- **Monumentos (nivel 1-2) sin su propia línea**: 0 ✅
- **Lugares de nivel 1 o 2 como "Por el camino"**: 0 ✅
- **Plazas o puentes después de su monumento, fuera de las excepciones**: 0 ✅
- **Avisos amarillos de textos con hora (sin "temprano" ni hora_ok)**: 0 ✅
- **Títulos del día que prometen una hora que no se cumple**: 0 ✅
- **Filas con "Por qué aquí" genérico**: 11
  - ruta 2, día 3, 18:10 Pasea y piérdete por Via del Corso y Via Condotti iluminadas: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 4, día 3, 18:30 Pasea y piérdete por Via del Corso y Via Condotti iluminadas: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 7, día 3, 19:20 Pasea y piérdete por Via del Corso y Via Condotti: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 8, día 2, 19:00 Plaza Trilussa: 
  - ruta 10, día 3, 18:40 Pasea y piérdete por Via del Corso y Via Condotti: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 12, día 3, 18:40 Pasea y piérdete por Via del Corso y Via Condotti: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 13, día 3, 18:40 Pasea y piérdete por Via del Corso y Via Condotti: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 16, día 1, 19:45 Plaza Farnese: Una plaza tranquila a un minuto de Campo de' Fiori. Fíjate en las dos fuentes: están hechas con bañeras de granito de las Termas de Caracalla. El palacio, en el que trabajó Miguel Ángel, hoy es la embajada de Francia.
  - ruta 18, día 3, 19:35 Pasea y piérdete por Via del Corso y Via Condotti: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 21, día 3, 19:35 Pasea y piérdete por Via del Corso y Via Condotti: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
  - ruta 26, día 3, 18:10 Pasea y piérdete por Via del Corso y Via Condotti iluminadas: Sin plan fijo: dejarse llevar por las calles es la mejor forma de despedir el día.
- **Notas internas que se ven**: 0 ✅
- **Cifras y precios fuera de Tickets**: 15
  - línea 121: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 205: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 311: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 537: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 701: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 785: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 877: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 979: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 1300: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 1464: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 1569: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 1822: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 2048: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 2154: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
  - línea 2376: | 08:30 | Fontana de Trevi | 25 min | Parada | — | A primera hora, con menos gente, la fuente es otra: oyes el agua y ha
- **"Por el camino" de más de 10 min**: 0 ✅
- **Tramos de más de 25 min andando sin transporte**: 0 ✅

### Cifras con permiso (`cifra_ok: true`)

Cada texto distinto una sola vez: lo que se queda con cifra a propósito.

- (en la ruta) A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día.
- (en la ruta) La entrada es gratis y guarda uno de los trucos más bonitos de Roma: la cúpula que ves no existe, está pintada sobre un techo plano. Ponte en el disco del suelo y mira hacia arriba. Busca también el gran espejo de la nave, muy viral en redes: con una moneda de 1 € se enciende la luz y ves el techo pintado reflejado, como si flotaras dentro.
- (en la ruta) A esta hora la Fontana de Trevi es otra: menos gente, el agua iluminada y un rumor que tapa la ciudad. Tira la moneda de espaldas, que dicen que así vuelves, y sube hasta la Plaza de España: la escalinata iluminada y casi vacía es de las mejores postales de Roma. Y después de las 22:00 puedes bajar junto al agua sin pagar la tasa de 2 € que se cobra de día.
- (ficha de Fontana de Trevi) La fuente más famosa del mundo. 26 metros de altura, 50 de ancho — un escenario barroco tallado en la fachada de un palacio donde Neptuno domina las aguas desde su carro tirado por tritones y caballos marinos. Cada día se recogen unos 3.000€ en monedas del fondo, que se donan a Cáritas para proyectos sociales en Roma. La tradición: tira una moneda con la mano derecha por encima del hombro izquierdo y volverás a Roma.
- (ficha de Fontana de Trevi) No es una entrada: la fuente se ve gratis desde la plaza a cualquier hora. Para bajar a la zona junto al agua hay una tasa de 2 € de 9:00 a 22:00 (algunos días laborables, desde las 11:30). Antes y después, libre. Los residentes en Roma y los niños pequeños no pagan. Compruébalo en la web del Ayuntamiento.
- (ficha de Fontana de Trevi) La tradición original no era una moneda, sino beber agua de la fuente. La costumbre de la moneda viene de la película 'Tres monedas en la fuente' (1954) — y ahora genera más de 1 millón de euros al año para Cáritas.
