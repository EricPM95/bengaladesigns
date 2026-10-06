# Para Code · Tanda 5: arreglar lo que salió en la Tanda 4

He revisado uno a uno los 33 viajes de `VIAJES_3_6_MOTOR.html`. Lo que pediste está hecho, pero salen fallos que tus comprobaciones no ven. Dos los provocaron reglas que te pedí yo (la del barrio de los restaurantes y la de los huecos de 15 min): **esas reglas cambian**.

## Cómo trabajar (igual que en la Tanda 4)

- **Nada de parches.** Cada fallo se arregla en su causa, con una regla que vale para todos los días y todos los destinos, y con una comprobación nueva en la prueba que lo habría detectado.
- **Si una comprobación tuya dice 0 y yo te enseño un caso que falla, la comprobación está mal:** arréglala primero y explica por qué no lo vio.
- `DIAS_ESCRITOS_ROMA.md` es el nuevo (lo nuevo dice «decidido en la Tanda 5»). Pásalo con el convertidor y **no lo toques**.
- Al acabar: `INFORME_TANDA5.md` en palabras sencillas (por punto: la causa, la regla, el resultado de la prueba) y `PREGUNTAS_TANDA5.md` con lo que decidas tú.

---

## 1. No hay crucero

La app no tiene el crucero como forma de llegar. **El viaje de 1 día es un día entero normal**: «Roma en un día» (D0), de 9:30 a la noche. Tablas nuevas en el documento, ruta normal y del revés. Con el día entero caben todos los imprescindibles, también la Plaza de España, y Trevi va de noche.

- Quita el crucero de todo: datos, motor, formulario, textos, la hora de vuelta de las 16:30 y la mención del «acordeón del ferry» en el D0. El ferry como forma de llegar se queda.
- **Museos marcados en el pool en 1 día:**
  - la mañana es la de «Con reserva de los Museos» del medio día del Vaticano (D0-medio), hasta la comida;
  - la tarde sigue con la del D0 desde Piazza Navona.

  *Provisional*: dime cómo queda y lo escribo.
- La pregunta 10 de la Tanda 2 (crucero con Museos) desaparece.

## 2. Restaurantes: se come y se cena donde acaba la ruta

**Quita** las reglas de barrio: la de no cenar dos días seguidos en el mismo barrio y la de no comer y cenar en el mismo barrio el mismo día.

**Lo que pasa ahora:**
- El día de Villa Borghese come y cena en el Tridente **a propósito**. En 27 viajes, la cena en Il Gabriello pasa a Buccone (un bar de vinos).
- En «Roma desde arriba», un domingo, se come en un horno (Forno Campo de' Fiori) y se cena en el Tridente, a 25 min, para volver después al Panteón.

**La regla nueva:**
1. Se come y se cena en la zona donde acaba la ruta, **aunque la zona se repita en el viaje**.
2. Lo único que no se repite es **el mismo restaurante**. Si ya salió, va su alternativa de la misma zona.
3. **El restaurante de recambio** tiene que ser:
   - un restaurante de verdad: no un horno, ni un sitio de comida rápida, ni un bar de vinos. Usa un campo de tipo en el dato;
   - a menos de 10 min andando del escrito.

   Si no hay ninguno así, va el escrito aunque se repita, y se apunta en el registro.
4. **Lo andado después de comer o cenar se cuenta desde el restaurante que va de verdad.** Ahora, en «Roma desde arriba», se cuenta desde Dal Cavalier Gino cuando la cena es en Poldo e Gianna.

**La prueba:** 0 restaurantes repetidos, 0 recambios que no sean un restaurante de verdad y 0 recambios a más de 10 min.

## 3. Huecos: hasta 30 min es normal, y solo se alarga lo que tiene contenido

**Lo que pasa ahora** (74 casos): para no dejar huecos de 15 min, el motor alarga lo que no se debe:
- Via Condotti, 35 min;
- Via Veneto, 35;
- el Puente Sant'Angelo, 45;
- el Ponte Sisto, 50;
- la Passeggiata del Gianicolo, 45;
- bajar la escalinata de la Plaza de España, 30.

Es relleno.

**La regla nueva:**
- Un margen de **hasta 30 min** antes de una hora fija (la cena, una reserva, un turno, el atardecer) es normal y se deja tal cual. La tarjeta del trayecto lo dice: «llegas con tiempo».
- **Solo se alargan los colchones con contenido** (hasta 2 horas) **y las comidas** (hasta 75 min).
- **Nunca** se alarga una calle, un «Paseo por…», un puente, una plaza, un mirador ni una parada de camino. Como mucho, +10 min sobre lo escrito.
- **Quita** el «último recurso» de alargar el último sitio al aire libre (pregunta 2 de la Tanda 4).

**El hueco del 25 de diciembre sigue ahí.** En el día de las basílicas, de 4 días, en Navidad: San Pietro in Vincoli acaba a las 11:05, se tarda 25 min andando a Letrán y Letrán sale a las 12:30. Quedan 50 min libres. Tu comprobación dio 0: **arréglala** y luego arregla el día. Lo que viene después no tiene hora fija, así que se corren las horas hacia antes.

**La prueba:**
- 0 huecos de más de 30 min, descontando lo andado y el margen;
- 0 paradas que no sean colchón ni comida alargadas más de 10 min;
- el caso del 25 de diciembre, en el informe.

## 4. El orden de una tabla escrita no se cambia nunca

**Lo que pasa ahora.** En «Roma antigua y Trastevere» (D1-FT), tarde D, primavera (6 días, lunes 19-04-2027):
- el colchón de Trastevere pasa a 120 min;
- el Mirador del Janículo sale antes que el Tempietto y la Fontana dell'Acqua Paola, y luego se baja y se vuelve a subir;
- el paseo por Trastevere sale **dos veces**;
- hay dos paradas que se pisan (25 min de solape).

**La regla:**
- El motor puede **quitar** paradas, **acortar** y **alargar** (con las reglas del punto 3) y **mover horas**, pero **nunca cambia el orden** de las paradas de una tabla escrita.
- Una parada no sale dos veces en el mismo día (las nocturnas de un sitio visto de día no cuentan).
- Si para llegar a un atardecer haría falta cambiar el orden, se acorta lo de antes o se quita por la pirámide.

**La prueba:**
- el orden de cada día = el orden de su tabla, sin las quitadas;
- 0 paradas repetidas en un día;
- 0 solapes.

## 5. «Llegada a…» con su propio texto

Ahora sale con el texto del sitio por fuera. A las 8:15, antes de entrar en el Coliseo, pone «Hoy lo ves por fuera» (99 casos).

«Llegada a {sitio}» es su propio tipo de parada, ni «por fuera» ni «visita». Lleva un texto de llegada: cuánto antes hay que estar, por qué (recoger las entradas, el control, dejar la mochila) y dónde se entra si el dato lo tiene. Sin foto propia.

**Free Tour** (pregunta 1 de la Tanda 4): **sí**, la tarjeta «Llegada al punto de encuentro del Free Tour».

## 6. Un imprescindible no se aprieta hasta «de camino»

Hay 654 casos en que los márgenes de una hora fija dejan un imprescindible en «de camino». No vale.

**La regla:** antes de apretar un imprescindible, se acorta o se quita lo de nivel más bajo de ese día, por la pirámide. Un imprescindible solo va «de camino» si ya salió de verdad otro día del viaje.

**La prueba:** 0 imprescindibles «de camino» la primera vez que salen. En el informe, cuántos de los 654 quedan y por qué.

## 7. Fotos

- Hay foto nueva de **Via Margutta** (`dia_via_margutta.jpg`): dale su hueco.
- **Los «de camino» y los paseos no llevan foto propia**, y tampoco el recuadro con el nombre:
  - los «de camino» van en la tarjeta única;
  - un paseo de un barrio que ya tiene foto usa la del barrio. Trastevere tranquilo usa `dia_trastevere.jpg`;
  - si no hay foto del barrio, va sin foto.
- **La Escalera Santa** va en la misma parada que San Juan de Letrán y usa su foto.
- Comprueba que todas las fotos de `public/fotos/roma/` que te he dejado salen en su sitio. En el informe, la lista de huecos que aún están vacíos.

## 8. Respuestas a PREGUNTAS_TANDA4.md

Todo lo que no sale aquí, vale como lo hiciste.

- **1:** sí, la tarjeta para el Free Tour (punto 5).
- **2:** no. Se quita el «rato más en el último sitio» (punto 3).
- **7:** cambia por el punto 2.
- **9:** los horarios de las calles y plazas los relleno yo más adelante. Déjalo como está.
- **10:** cambia por el punto 6.
- **14:** sí. La pantalla del D5 en 4 días ofrece también las excursiones de medio día.

## 9. Lo nuevo del documento («decidido en la Tanda 5»)

- **«Roma en un día» (D0):** día entero, sin crucero, dos tablas (normal y del revés), con la Plaza de España, cena en el Tridente y Trevi de noche.
- **Regla de restaurantes** en las reglas generales (punto 7 del documento), como en el punto 2 de aquí.
- **«Roma desde arriba»:** la cena vuelve al Gueto (Nonna Betta o Giggetto), donde acaba la tarde.
- **El paseo del Aventino:**
  - ya no nombra el Parque Savello, que es el mismo sitio que el Jardín de los Naranjos y tiene su propia parada;
  - lleva su texto debajo de la tabla.

## 10. Pruebas y páginas

1. La prueba entera, como siempre: todos los viajes de 1 a 6 días, con y sin pool y Free Tour, las 365 fechas, con todas las comprobaciones (las nuevas de los puntos 2, 3, 4, 5 y 6 también) y sin sacar ningún caso.
2. En la página de simulación, añade 5 viajes de 1 día (invierno, primavera, verano, otoño y Navidad) y uno con el Coliseo reservado por la mañana.
3. Vuelve a generar `VIAJES_2_5_MOTOR.html` y `VIAJES_3_6_MOTOR.html`.
4. Reinicia el api-server.

Commits locales por bloques. **No hagas push.**
