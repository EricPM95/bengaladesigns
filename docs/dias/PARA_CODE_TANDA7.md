# Para Code · Tanda 7: llegadas y vueltas

**Empieza cuando hayas terminado la 6j** (con su push).

**Antes de empezar:** `docs\dias\DIAS_ROMA_PARADAS.md` tiene una sección nueva al final, **«Llegadas y vueltas»**, con:
- las seis «Llegadas a Roma» por barrio;
- las horas del Free Tour.

Pásalo por el convertidor y no lo toques. Todo lo de esta tanda sale de esa sección; aquí va **cómo** tiene que funcionar en la app.

## Cómo trabajar

- **Nada de parches:** cada regla, en un sitio y para todos los destinos.
- **`PROGRESO_TANDA7.md`,** con una línea por bloque y TERMINADO al final.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA7.md`.
- **Al acabar,** `INFORME_TANDA7.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. Lo que pone el viajero (en RESERVAS)

- **La llegada:** el día, la hora y por dónde llega (Fiumicino, Ciampino, Termini, Tiburtina, coche o crucero en Civitavecchia).
- **La vuelta:** igual.
- **«¿En qué barrio te alojas?»,** con estas opciones:
  - Centro (Panteón, Trevi, Navona);
  - Plaza de España (Plaza de España, Popolo, Via del Corso);
  - Prati (Vaticano);
  - Trastevere;
  - Termini;
  - Monti (Coliseo);
  - Otro / Aún no lo sé (cuenta como Centro).
- **Nada de esto va en el formulario.** La pantalla «¿Cómo quieres llegar a…?» del formulario se queda como está.
- **Sin estos datos,** el viaje sale con días enteros, como ahora.
- **Al poner o cambiar cualquiera de los tres,** los días se rehacen con las reglas de abajo. Las reservas se quedan en su día y a su hora.

## 2. La hora a la que está libre, y la de salir

- **Libre** = la hora de llegada más el margen de la sección:
  - Fiumicino, 1:30;
  - Ciampino, 1:15;
  - Termini y Tiburtina, 0:45;
  - coche, 1:00;
  - Civitavecchia, 2:00.

  El margen incluye pasar por el alojamiento.
- **Salir hacia el aeropuerto o la estación** = la hora del vuelo o el tren menos su margen (Fiumicino 3:00, Ciampino 2:30, Termini y Tiburtina 1:00, coche 1:00, Civitavecchia 3:00).
- **Los tiempos se cuentan siempre desde el centro.** **En ningún texto sale la palabra «centro».**
- **Lo que se ve en la app:**
  - **arriba del día de llegada:** «✈ Aterrizas a las 9:00 en Fiumicino», con el enlace a la ventana de llegada que ya existe (Resumen · Traslados · Tips);
  - **arriba del día de vuelta:** «✈ Tu vuelo sale a las 17:00 · sal hacia el aeropuerto a las 14:00».
  - **No sale** la hora a la que está «libre»: es solo para el motor.

## 3. Los días reales

Sigue la sección del documento:
- **El día de llegada** es siempre su «Llegada a Roma» (punto 4), nunca un día entero.
- **El día de vuelta:**
  - **con «última mañana»** (3 h o más entre las 9:00 y la hora de salir, menos 1:00 para la maleta), el medio día de mañana que toque;
  - **sin ella,** solo el traslado.
- **Los días de en medio** son los días enteros, con la tabla de siempre, contando solo los días enteros.
  - Con un solo día entero: el D1, y el Vaticano en la última mañana (D0-medio).
  - Sin última mañana: el D0.
- **Los viajes de 1 y 1,5 días** siguen con sus días propios.
- **La excursión** va en el 4.º día completo. Si no hay 4 días completos, no sale el interruptor.
- **La etiqueta «Día de viaje»** (en naranja) va en el día de llegada y en el de vuelta.

## 4. La «Llegada a Roma» por barrio

- **Cada barrio tiene su lista escrita** (en la sección del documento). Todo por fuera.
- **La regla:** se empieza en el barrio y, **si hay menos tiempo, se quita lo del final**, lo que queda más lejos. Nunca se salta lo que tiene al lado.
- **Según la hora a la que está libre,** la tabla del documento:

  | Libre | Qué lleva |
  |---|---|
  | antes de las 12:00 | paradas antes de comer; la comida, entre las 12:30 y las 13:30 |
  | de 12:00 a 15:00 | la comida nada más llegar |
  | de 15:00 a 17:00 | sin comida |
  | de 17:00 a 19:00 | 2 o 3 paradas |
  | de 19:00 a 20:30 | 1 o 2 paradas rápidas |
  | de 20:30 a 22:30 | la cena y la noche |
  | después de las 22:30 | nada |

- **La comida y la cena,** las de la lista, según dónde acaba (está escrito en cada barrio).
- **La noche:** una nocturna a 15 min o menos de donde cena (reglas 11c y 13), sin repetir en el viaje.
- **Lo que se ve en la llegada no cuenta como «ya visitado»** para los días siguientes (como el paseo por Trastevere). Así el D1 sigue entrando en el Panteón, y el D2 hace la Plaza de San Pedro y el Castillo. Las nocturnas, en cambio, sí cuentan.

## 5. El Free Tour el día de llegada

- **Las horas:** 10:00, 12:00, 15:00, 17:00 y, a veces, 21:00. Dura 2 h 30 y sale de la Plaza de España.
- **Si el viajero lo ha reservado,** manda su hora. La llegada se ajusta alrededor con la regla 4:
  - lo que cabe antes, antes; lo demás, después;
  - si no cabe, se quita lo del final.
- **Si solo lo ha marcado en Experiencias,** la app elige la hora con la tabla del documento (la primera que le pille libre, con 30 min para llegar). Después de las 16:30, va al día siguiente a las 10:00 (D3). La de las 21:00, nunca sola.
  - Texto: «Te proponemos el Free Tour de las {hora}, nada más llegar», con el botón para reservarlo.
- **Lo que enseña el guía** (Plaza de España, Trevi, el Panteón y Navona) sale con «Lo ves en el Free Tour».
- **Si el Free Tour va el día de llegada,** los días enteros pasan a D1-FT y D2 (en lugar de D3 y D1-FT).
- **Cualquier otra reserva del día de llegada** funciona igual: fija a su hora, y la llegada alrededor.
- **Si el día de llegada tiene reservado el Coliseo o los Museos Vaticanos** (o la Galería), ese día deja de ser la llegada de su barrio y pasa a ser **el día escrito de ese sitio** (D1, D2 o D4), empezando a la hora a la que está libre, con la reserva a su hora y la lista escrita de esa hora. Lo que no quepa por la mañana, a «Si te sobra tiempo». Es la misma regla de la 6j: se mueve el día entero. Así el Coliseo no sale dos veces ni el D1 se queda cojo.

## 6. Los textos de la vuelta y la excursión

Los cuatro textos de la sección, tal cual:
- **Había excursión, y el vuelo no deja hacerla:** el día pasa solo a Roma (si no estaba confirmada) y sale «Tienes el vuelo a las 17:00, hacer una excursión no es viable, pero te hemos organizado una última mañana por Roma para que te vayas con buen sabor de boca.».
- **No había excursión:** «Tienes el vuelo a las 17:00, te hemos organizado una última mañana por Roma para que te vayas con buen sabor de boca.».
- **No da tiempo a nada:** «Tienes el vuelo a las 11:00: hoy toca volver a casa. ¡Buen viaje!».
- **Excursión confirmada y el vuelo antes de que vuelva:**
  - el aviso de la sección, con [Ver mi reserva] y [Pasar este día a Roma];
  - **no se cambia nada solo;**
  - el mismo aviso sale si añade la confirmación de una excursión en un día que su vuelo no permite.
- **Ostia o Tívoli** en un día con vuelo: solo si el vuelo sale a las 18:00 o más tarde.
- **Ningún texto nombra al proveedor** (Civitatis…) **ni dice «centro».**

## 7. «¿Cómo te moverás allí?»: en Roma, no

- **No hay pantalla para elegir cómo se mueve.** En Roma siempre es a pie y en transporte público, con el taxi como opción en cada trayecto, como ahora.
- **Deja en los datos de cada destino** un `preguntar_movilidad` (en Roma, `false`), para los roadtrips, las islas o las ciudades muy extensas que hagamos más adelante.

## 8. Pruebas

Con las 365 fechas de 2027, viajes de 2 a 7 días, con y sin Free Tour:
- **llegadas** a las 6:00, 8:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 y 23:30 por Fiumicino;
- **alguna por Termini y por Ciampino;**
- **vueltas** a las 8:00, 11:00, 14:00, 16:00, 18:00 y 21:00;
- **los seis barrios** y «Aún no lo sé».

1. **El día de llegada** nunca es un día entero y siempre empieza en su barrio.
2. **Recortada,** se quita siempre lo del final, nunca lo del principio.
3. **La comida** sale solo si está libre antes de las 15:00, y nunca después de las 15:00.
4. **La noche:**
   - si está libre antes de las 22:30, hay nocturna a 15 min o menos;
   - 0 nocturnas repetidas en el viaje;
   - en 2,5 días o más, ninguna nocturna es un sitio visto ese mismo día.
5. **El Free Tour marcado:**
   - va a la hora que dice la tabla;
   - después de las 16:30, al día siguiente a las 10:00;
   - nunca a las 21:00 si no está reservado.
6. **Con el Free Tour en la llegada,** los días enteros son D1-FT y D2.
7. **El día de vuelta:**
   - la última mañana, solo si hay 3 h o más;
   - si no, solo el traslado;
   - nunca una parada después de la hora de salir.
8. **Con un solo día entero,** salen el Coliseo y el Vaticano (D1 y D0-medio, o el D0).
9. **La excursión,** solo en el 4.º día completo. 0 interruptores si hay menos de 4 días completos.
10. **0 textos con «centro»** ni con el nombre de un proveedor.
11. **Lo de siempre:** nada cerrado, sin zigzag, por dentro una sola vez y 0 restaurantes repetidos.

**La página de simulación:** añade una llegada de cada tramo de la tabla en cada barrio, y tres vueltas (con mañana, sin mañana y con excursión confirmada).

**Comprobación a mano a 375 px:**
- poner la llegada, la vuelta y el barrio en RESERVAS;
- el día de llegada con su línea «✈ Aterrizas…»;
- el día de vuelta;
- el aviso de la excursión confirmada.

Al final, **reinicia el api-server.**

## 9. Lo que NO va en esta tanda

- La pestaña HOY en detalle.
- El barrio para el día de vuelta (de momento, la vuelta se cuenta desde el centro).
- Las llegadas de otros destinos.
