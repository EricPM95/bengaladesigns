# Para Code · Tanda 4: arreglar las causas, no los casos

He revisado los 27 viajes de `VIAJES_3_6_MOTOR.html` uno a uno. Los fallos que salen no son casos sueltos: casi todos vienen de **seis reglas del motor** que no están bien o no existen. Esta tanda es para arreglar esas reglas.

## Cómo trabajar en esta tanda (lo más importante)

1. **Nada de parches.** Está prohibido arreglar un caso con una excepción para ese día, esa fecha o esa parada. Para cada punto:
   - busca **por qué pasa**;
   - arréglalo **en la regla**, que vale para todos los días y **todos los destinos**;
   - añade a la prueba una **comprobación que lo habría detectado**.
2. Si la causa de verdad es otra que la que digo yo, arregla la de verdad y explícalo.
3. Si al arreglar una regla cambian otros días que estaban bien, apúntalo en el informe con ejemplos. No lo escondas.
4. **No toques `DIAS_ESCRITOS_ROMA.md`.** Ya está actualizado (lo nuevo dice «decidido en la Tanda 4»). Pásalo a `data/dias/roma/` con el convertidor, como siempre.
5. Al acabar, `INFORME_TANDA4.md`, en palabras sencillas. Por cada punto: la causa en una frase, qué regla has cambiado y el resultado de la prueba. Lo que decidas tú, en `PREGUNTAS_TANDA4.md`.

---

## 1. Las horas se calculan una sola vez, al final

**Lo que pasa.** En el día de Villa Borghese con Free Tour, tarde D (primavera: 14-04-2027 y fechas parecidas):
- Trinità dei Monti sale a las 19:10, pero su registro dice «de 20:50 a 21:10» y luego «de 21:10 a 19:10».
- Queda un hueco de 2 horas antes de la cena.
- El Coliseo de noche sale a las 23:50, pasado el límite de las 23:45.

**La causa, creo:** cada ajuste (Free Tour, atardecer, cierres, pool, distancias) mueve horas por su cuenta, y el último no recalcula lo que depende de él.

**La regla:** los ajustes deciden **qué** paradas van y **qué** horas fijas hay (reserva, turno, atardecer, apertura, cierre). Las horas de todo el día se calculan **una sola vez, al final**, desde esa lista. La hora que se ve en pantalla es esa, y el registro cuenta los cambios con esa misma hora final.

**La prueba:**
- en todas las fechas y viajes, la hora en pantalla = la última hora del registro;
- ninguna parada empieza después del límite de la noche;
- ninguna cena después de las 22:00.

## 2. Nunca un hueco sin nombre

**Lo que pasa:**
- 24-12: en «Roma desde arriba», 1 h 45 min vacía entre el Campidoglio y la Piazza Venezia (los Capitolinos cierran);
- 25-12: en el día de las basílicas, 1 h 25 min entre San Pietro in Vincoli y Letrán (San Clemente cierra);
- 24-12: en el día de Villa Borghese, 45 min (el Ara Pacis cierra antes);
- en el día del Free Tour, 50 min entre la comida y el bus a los Museos;
- antes de la Galería Borghese, 50 min sin nada. La fila «Galería Borghese: llegada con la reserva (30 min antes)» **está en el documento y no sale**.

**La regla, para todo el tiempo que quede libre** (por un cierre, una parada quitada, un festivo o un margen), en este orden:
1. Si lo que viene después **no** tiene hora fija, se corren las horas hacia antes.
2. Si lo que viene después **sí** tiene hora fija:
   - si justo antes hay una comida, se alarga hasta 75 min;
   - si no, se alarga el colchón de esa zona, como mucho 2 horas y con su texto;
   - si no hay colchón, se mete el colchón de esa zona (tabla «Qué hay en cada colchón»).
3. El margen antes de una reserva o un turno sale **siempre como parada**: «Llegada a {sitio}» con su motivo (recoger las entradas, el control, dejar la mochila). Una fila del documento sin minutos **no se pierde**.

**La prueba:** 0 huecos de más de 15 min sin parada, en todas las fechas y viajes. Comprueba los cinco casos de arriba uno a uno en el informe.

## 3. Las nocturnas se reparten por orden de días (la pirámide)

**Lo que pasa.** En verano, el primer día del viaje deja Trevi de noche porque «Trevi y el Coliseo ya salieron en el viaje», pero salen **en días posteriores**, y Trevi encima de día. Trevi iluminada se queda sin salir de noche en todo el viaje.

**La regla:**
- Las nocturnas se eligen **día a día, empezando por el primero**. Lo mejor va primero (regla 0).
- «Ya salió» = salió **de noche en un día anterior**.
- Un sitio visto de día no quita su nocturna (Trevi a las 7:30 sin gente es otra visita).
- Primero las nocturnas imprescindibles que falten (Trevi, Plaza de España, Coliseo), como dice el documento («Antes van los imprescindibles que no hayan salido en el viaje»). Luego las demás.

**La prueba:**
- 0 nocturnas repetidas;
- en cada viaje, Trevi y la Plaza de España de noche salen en el primer día en que caben;
- ninguna nocturna imprescindible se queda fuera si cabía algún día.

## 4. Restaurantes: no se repiten en el viaje

**Lo que pasa.** En 6 días, Nonna Betta sale dos veces (comida del primer día y cena de otro), y Da Enzo y Giggetto también. Algún domingo se come y se cena en el Gueto el mismo día. En verano se cenaba dos noches seguidas en Trastevere.

He cambiado restaurantes en el documento, pero el motor tiene que asegurarlo solo.

**La regla:**
- **Un restaurante no se repite en el viaje.** Los días van en orden y el primero se queda el suyo. Para los demás, la cadena de siempre: el escrito → la alternativa → la tercera → otro de la misma zona, abierto y **no usado** en el viaje.
- **No se cena dos días seguidos en el mismo barrio**, ni se come y se cena en el mismo barrio el mismo día, **si hay otra opción** que no rompa la ruta. Si no la hay, se deja y se apunta en el registro.

**La prueba:** 0 restaurantes repetidos por viaje, y la lista de los casos de barrio repetido que quedan, con su motivo.

## 5. Datos que salen mal en pantalla

- **La zona de cada restaurante y sitio sale siempre del dato** (`roma.json`), nunca del texto de la tabla ni de la zona del día. Ahora la cena de Nonna Betta sale como «en el barrio de Monti», y está en el Gueto. Prueba: cada etiqueta = la zona de su dato.
- **Fechas especiales en un solo sitio.** El 24, 25 y 31 de diciembre y el 1 de enero, **todas** las comidas y cenas de **todos** los días llevan «Con reserva» (ahora el 25 solo lo lleva la tabla de fiesta). Si un restaurante no tiene dato de esa fecha, sale el aviso «En Navidad, reserva con antelación». La lista de fechas va en `destination_config`, no repartida por las tablas.
- **Sitios sin horario.** El motor da por abierto un sitio sin horario. Así se coló el Colle Oppio, que cierra a las 19:00, en un atardecer de verano. En el informe, la lista de **todos los sitios y restaurantes que usa un día escrito y no tienen horario**, para que los rellenemos.
- **Las páginas que generas** (`VIAJES_2_5_MOTOR.html`, `VIAJES_3_6_MOTOR.html` y las demás) empiezan por `<!doctype html>` y `<meta charset="utf-8">`. Sin eso, en Windows los acentos salen rotos. Arréglalo en la plantilla que las genera.

## 6. «De camino»: qué es y cómo se ve

Hay días con demasiadas tarjetas «de camino»:
- Roma desde arriba: 6 de 17;
- Villa Borghese: 5 de 20;
- Roma antigua: 4 de 20.

Por la mañana de Villa Borghese salen tres seguidas: Tritón, Via Veneto y Porta Pinciana. El problema no es el número: es que mezcla tres cosas distintas.

**La regla:**
1. **«De camino» = pasas por delante sin pararte, 5 min como mucho.** Una calle que se recorre en 10 o 15 min (Via Veneto, Via della Conciliazione, Via Condotti, Via dei Coronari, Via del Babuino y Via Margutta) **no** es «de camino»: es una parada de paseo («Paseo por Via Veneto», con sus minutos y su texto).
2. **Dos o más «de camino» seguidos van en una sola tarjeta:** «De camino a {siguiente parada}», con cada sitio en una línea y su frase. La barra horaria y el mapa siguen marcando cada sitio.
3. **Un sitio de nivel 1 o 2 no va «de camino» la primera vez que sale en el viaje.** Va como parada (como Trinità dei Monti, que ya decidimos). La excepción es que el Free Tour ya haya pasado por él. Ahora pasa con el Tempietto en el día del Vaticano (12 viajes).
4. **Un «de camino» tiene que poder verse desde la calle a esa hora.** El Tempietto está dentro de un patio: cerrado, no se ve. Si está cerrado, la parada es «El mirador de San Pietro in Montorio», en la plaza de delante, que tiene una de las mejores vistas de Roma.
5. **El texto de un colchón no nombra paradas que el mismo día tienen tarjeta propia**, y cuenta el paseo desde donde se entra. El colchón de Villa Borghese de la mañana del D4 usaba el texto genérico: subía «por la rampa del Pincio» y acababa «en la terraza del Pincio a la hora del sol», cuando el reloj de agua y el Pincio son paradas de después. El texto bueno está en el documento, debajo de la tabla. **El texto de un colchón va por tabla, no por sitio.**

**La prueba:**
- 0 «de camino» de más de 5 min;
- 0 sitios de nivel 1 o 2 «de camino» en su primera vez (salvo con el Free Tour);
- 0 colchones que nombren otra parada del mismo día;
- la media de tarjetas por día antes y después, en el informe.

## 7. El pool: qué se acorta antes de quitar

**Lo que pasa.** Con los Museos Capitolinos marcados, la comida cae a las 14:50 y los restaurantes cierran a las 15:00. Lo sacaste de la prueba (pregunta 31). **Vuelve a meterlo.**

**La regla, para cualquier extra del pool que no quepa:**
1. La visita por dentro marcada se acorta hasta su mínimo (`min_max` del sitio; los Capitolinos, 60 min).
2. Lo de nivel más bajo pasa a «de camino».
3. Solo después se quita por la pirámide, de abajo arriba.
4. **Nunca se cambia el orden para comer antes**: haría un zigzag (Campidoglio → Gueto → Campidoglio → Gueto).

**La prueba:** los Capitolinos marcados, de vuelta en la prueba, con 0 comidas en restaurante cerrado.

## 8. Excursiones de medio día, de vuelta

Las apagaste en Roma (pregunta 19). Vuelven, con la regla que ya teníamos:

1. El día de excursión (5 y 6 días) y el D5 que se puede cambiar en 4 días ofrecen también las de **medio día** (Ostia Antica, Tívoli).
2. Con una de medio día:
   - **de 8:00 a 14:00**, la excursión;
   - **la comida**, en el bloque ya decidido: «¿Tu excursión incluye comida? Si no, …»;
   - **de 14:00 a 16:00**, descanso;
   - **desde las 16:00**, la **tarde escrita del día que saldría con «Prefiero quedarme en Roma»**: 4 días → D5, 5 días → D6, 6 días → D7. Con sus cierres y su atardecer de ese día. Lo que no quepa se quita de abajo arriba en la pirámide.
3. Si de esa tarde no queda **ninguna parada de nivel 1 o 2**, la tarde queda libre: «Tu tarde en Roma está libre» con «Añadir parada». Pasará casi siempre con el D7: las catacumbas cierran a las 17:00.
4. La regla es general: la tarde que se usa es la del día que sustituye a la excursión, en cualquier destino.

**La prueba:** una excursión de medio día en 4, 5 y 6 días, en invierno y en verano, en la página de simulación.

## 9. Ningún medio día repite un día entero del mismo viaje

**Lo que pasa.** En 3,5 días con llegada por la tarde pusiste, provisional, el medio día del Tridente y el Pincio. Pero el tercer día es justo ese: Popolo, Pincio, Plaza de España y Trinità. El viaje repite un día.

**La regla, solo la comprobación:** un medio día no puede compartir su tema (sus paradas principales) con un día entero del mismo viaje. Si pasa, es un fallo de la prueba.

**No lo arregles con un parche.** El arreglo de verdad es «Llegada según la hora», que va en la próxima tanda. Déjalo marcado como fallo conocido en el informe.

## 10. Distancias: cambia el modo

En la Tanda 3 corregiste 506 tramos corriendo las horas, y la cena salía hasta 45 min más tarde. **El nuevo modo:**

1. Primero se acorta el colchón de antes, **sin bajar de 30 min**. Si ya tiene menos de 30, no se toca.
2. Solo si no basta, se corre lo de después.
3. **La cena va siempre a en punto o a y media** (redondeando hacia arriba).

No cambies el documento. Saca `DISTANCIAS_PROPUESTA.md`: por cada tabla que cambie, la fila del documento → la fila nueva. Yo la paso al documento y quedan iguales.

## 11. Lo nuevo del documento («decidido en la Tanda 4»)

- **Día de la Roma antigua, tarde D:** el Ponte Sisto al atardecer desde el lado de Campo de' Fiori, cena junto a Campo de' Fiori (Dar Filettaro a Santa Barbara, o Da Baffetto) y la noche con **Trevi y la Plaza de España**. Ya no se cena en Trastevere.
- **Roma desde arriba:** la cena pasa a Dal Cavalier Gino (o Da Baffetto), junto al Panteón (Gino abre a las 20:00: antes, Da Baffetto). **Miércoles:** tabla nueva; la Cúpula **no se quita**, va al final de la mañana, cuando acaba la audiencia. En julio no hay audiencias: la mañana normal. Pon en el dato de la Cúpula y de la Basílica: «miércoles con audiencia, de 9:00 a 12:30 cerradas; en julio no hay audiencias».
- **Villa Borghese en lunes:** tabla nueva con la **Cripta de los Capuchinos**. Es un sitio nuevo en `roma.json`:
  - Via Veneto 27, coordenadas aproximadas 41,9045 / 12,4886;
  - nivel 2, por dentro, 45 min;
  - abre todos los días de 10:00 a 19:00 (la taquilla cierra a las 18:30).

  Escribe el texto de la ficha y márcalo para revisar.
- **La Vía Appia, tarde C y D:** el Coliseo se ve desde la **terraza de Largo Gaetana Agnesi**: en la calle, encima del metro Colosseo, siempre abierta, coordenadas 41,8916 / 12,4910. **No** desde el Colle Oppio, que cierra a las 19:00. Sitio nuevo; el Colle Oppio se queda en los datos con su horario.
- **El colchón de Villa Borghese de la mañana del D4:** su texto, debajo de la tabla de la mañana.
- **Fotos:** el hueco de la Cripta de los Capuchinos. El Coliseo desde Largo Gaetana Agnesi usa la foto del Coliseo que ya hay. Está en `FOTOS_PENDIENTES.md`.

## 12. Al acabar

1. La prueba entera: todos los viajes, de 1 a 6 días, con y sin pool y Free Tour, las 365 fechas de 2027, **con todas las comprobaciones nuevas**. Ningún caso sacado de la prueba.
2. Vuelve a generar `VIAJES_2_5_MOTOR.html` y `VIAJES_3_6_MOTOR.html`, con la excursión de medio día. Ábrelas en el navegador si puedes.
3. Reinicia el api-server.

Commits locales por bloques. **No hagas push.**
