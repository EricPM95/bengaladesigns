# Para Code · Tanda 7: llegadas y vueltas

**Empieza cuando la 6j esté subida** (ya lo está: a9d2651).

**Antes de empezar:**
- **El documento.** `docs\dias\DIAS_ROMA_PARADAS.md` tiene la sección final **«Llegadas y vueltas»** reescrita entera. Pásalo por el convertidor y no lo toques. Todo lo de esta tanda sale de esa sección; aquí va **cómo** tiene que funcionar en la app.
- **Lo que ya existe y hay que usar,** no hacer de nuevo:
  - en RESERVAS, las horas de llegada y de salida y los botones de Fiumicino y Ciampino (`FlightTickets.tsx`, `ReservasPanel.tsx`, `arrivalFlightTime`, `departureFlightTime`, `arrivalPointId`, `departurePointId`, y `tripModes` para el medio de la ida y el de la vuelta);
  - las horas de cada punto en `data/dias/roma/_llegada.json` y `shared/arrival/arrivalRules.js` (`centerMinutesOf`, `leaveMinutesOf`, `barTextOf`);
  - la barra de llegada y de vuelta de cada día y la ventana de llegada (Resumen · Traslados · Tips, `ArrivalReturnSheet.tsx`);
  - la etiqueta «Día de viaje»;
  - la campana de avisos de la cabecera (`useAppNotices`, `NoticesSheet`);
  - la hoja que sube desde abajo de la 6j (la de mover el día por una reserva).
- **Lo viejo que esta tanda sustituye** está en el punto 10.

## Cómo trabajar
- **Nada de parches:** cada regla, en un sitio y para todos los destinos.
- **`PROGRESO_TANDA7.md`,** con una línea por bloque y TERMINADO al final.
- **Lo que decidas tú,** en `PREGUNTAS_TANDA7.md`.
- **Al acabar,** `INFORME_TANDA7.md` en palabras sencillas.
- **Commits locales por bloques.**
- **Añade `.claude/` al `.gitignore`** (el `scheduled_tasks.lock` de la herramienta no debe parar nunca un push).
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. Lo que pone el viajero (en RESERVAS)
- **Las horas de llegada y de salida, y el punto:** las que ya hay. No hagas campos nuevos.
  - El día es el primero y el último del viaje. Debajo de la hora, en pequeño, «¿Llegas o te vas otro día? Cambia las fechas del viaje», que abre el cambio de fechas que ya existe.
  - La vuelta usa su propio medio (`tripModes`), que puede no ser el de la ida.
  - En coche, sin hora, como ahora.
- **«¿En qué zona te alojas?»:** botones dentro del bloque del alojamiento de RESERVAS. **Sirve para dos cosas:** por dónde empieza la ruta del día 1 (punto 5) y «Para tu zona» (punto 11). Las opciones:
  - Centro (Panteón, Trevi, Navona);
  - Plaza de España (Plaza de España, Popolo, Via del Corso);
  - Prati (Vaticano);
  - Trastevere;
  - Termini;
  - Monti (Coliseo);
  - Aún no lo sé (cuenta como Centro).

  Se guarda con el viaje.
- **Nada de esto va en el formulario.** La pantalla «¿Cómo quieres llegar a…?» se queda como está.
- **Sin horas,** el viaje sale con días enteros, como ahora.
- **Al poner, cambiar o borrar una hora, el punto o la zona,** los días se rehacen solos (la zona solo cambia el día 1) con las reglas del documento y sale la hoja del resumen (punto 9). Las reservas se quedan en su día y a su hora. Los días que el viajero ha cambiado a mano no se tocan.

## 2. Las horas
- **Una sola fuente: `_llegada.json`.** No escribas los márgenes en ningún otro sitio.
- **Libre** = llegada + `al_centro_min` del punto + 30 min para dejar la maleta. Es solo para el motor: no se enseña.
- **Salir** = la de `leaveMinutesOf`, como ahora (con el `salir_antes_min` de cada punto: Ciampino 2:50, Tiburtina 0:55…).
- **La última mañana** usa «salir − 1:00» para recoger la maleta.
- **Vuelos de madrugada (de 0:00 a 5:00):**
  - **a la llegada,** el día 1 es un día entero normal;
  - **a la vuelta,** cuenta como la noche anterior: el último día solo lleva el traslado, y el de antes acaba sin nocturna.
- **Vuelta de 5:00 a 9:00:** el día de antes, normal; el último, solo el traslado.
- **Llegar y irse el mismo día:** de momento, el D0 de siempre, con las dos barras.
- **En ningún texto para el viajero sale la palabra «centro».** Los nombres de zona, como «Centro (Panteón, Trevi, Navona)», sí.

## 3. Lo que se ve en el día
- **La barra de llegada,** sin la hora de la derecha: «LLEGADA · VUELO 09:00 · FIUMICINO». **Fuera «EN EL CENTRO …»** (en `barTextOf` y en la ventana de llegada: «En el centro {hora}»).
- **La de vuelta,** como ahora, con «SAL A LAS 14:00».
- **«Día de viaje»,** como ahora.

## 4. El orden de los días y los días reales
**Primero, sin vuelos (cambia para todos, también lo gratis).** Sigue «El orden nuevo de los días», al principio de la sección «Llegadas y vueltas» del documento: sustituye a «Qué días lleva cada viaje», «El día de excursión» y «El orden de los días» de arriba (el documento no lo tocas tú: lo dejaremos con uno solo antes de esta tanda):
- **en viajes de 3 días o más, el día 1 es el Centro:** la «Llegada a Roma», la ruta del centro histórico entera, igual para todos, la comida, la cena y la nocturna, empezando a las 9:00. Con Free Tour, el Free Tour a las 10:00 y lo que el guía no enseña;
- **los días 2 y 3, el D1 y el D2;** el día 4, el interruptor (4 días, Roma = D4; 5 o más, Excursión); después, D4, D5 y D6;
- **los cierres:** primero se cambian entre sí el D1 y el D2; si no se puede, con el día siguiente; nunca al día 1;
- **el D4,** siempre en su versión «Con Free Tour de mañana» (el centro ya se vio el día 1);
- **el D3 y el D1-FT** ya no salen en viajes de 3 días o más, salvo con vuelos y el Free Tour después de las 16:30 (abajo). Siguen en los de 2 días. **El D1-corto** ya no sale;
- **en viajes de 2 días,** como ahora.

**Después, con vuelos.** El viaje es el mismo; solo cambian el primero y el último día (sección «Los días reales» del documento):
- **El día 1** se recorta por el tramo (punto 5). Con un vuelo de madrugada, entero.
- **Los días de en medio no se mueven.**
- **El último día:**
  - con última mañana (3 h o más entre las 9:00 y «salir − 1:00»), el medio día de mañana que toque, tal como está escrito, a su hora de empezar y con su versión de cierres: sin el D2 en el viaje, el D0-medio; con D1 y D2, el DT-medio; con el D4 también, el DA-medio; con el D5, la mañana del D6;
  - si no cabe entero antes de «salir − 1:00», lo del final pasa a «Si te sobra tiempo» (regla 5);
  - la comida, solo si se sale a las 14:30 o más tarde;
  - sin última mañana, solo el traslado.
- **Con un solo día entero** (el día 2): el D1 y el D0-medio en la última mañana; sin última mañana, el D0.
- **Sin ningún día entero:** la llegada y, si la hay, la última mañana (D0-medio).
- **Una reserva grande en la última mañana o en el día de llegada:** sigue el documento («Una reserva grande en la última mañana» y «… el día de llegada»). Lo importante:
  - la reserva manda: si hay una reserva, hay mañana;
  - a esa mañana va solo su bloque (Coliseo + Arco + Foro y Palatino; Museos + Plaza + Basílica; Galería + parque), si cabe antes de «salir − 1:00»;
  - lo que no cabe se queda en su día, salvo el Foro (misma entrada), que lleva su hoja al guardar la reserva;
  - el resto de su día escrito se queda en su día, sin el bloque (el D2 con su versión del miércoles; el D4 con la del lunes; el D1 empezando en el Campidoglio);
  - el día de llegada libre antes de las 13:00: el día escrito entero de ese sitio, y el día que lo llevaba pasa a ser el Centro (se cambian uno por otro).
- **La última mañana cumple las mismas reglas de cierres que cualquier día:** si lleva algo cerrado ese día (los Museos marcados un domingo), se cambia con un día entero si se puede; si no, eso sale con «Cerrado hoy».
- **La excursión,** en el día 4 si es entero. El interruptor, por defecto como sin vuelos (así no cambia al poner los vuelos). Si el día 4 pasa a ser el de vuelta, punto 7.
- **El Free Tour sin reservar y libre después de las 16:30:** el Free Tour va al día 2 a las 10:00, y los días 2 y 3 son el D3 y el D1-FT (el único caso en que el Coliseo y el Vaticano cambian de día).
- **La regla 11c** cuenta los días del viaje por sus fechas.
- **Los medios días «de tarde»** (D0-medio, DT-medio y DA-medio de tarde) ya no se usan. Déjalos en los datos, sin borrar.

## 5. La «Llegada a Roma» (el día 1)
- **Una sola ruta para todos,** la del centro histórico (en el documento). **No hay listas por zona:** la zona solo decide por dónde empieza. Todo por fuera.
  - **Centro, Prati, Trastevere, Monti, Termini y «Aún no lo sé»:** empieza en Navona y va hacia el Popolo.
  - **Plaza de España:** empieza en la Plaza de España, sube a la Trinità y al Pincio, baja al Popolo y vuelve por Via del Corso a Trevi, el Panteón y Navona.
  - Cada orden con su comida y su cena (en el documento).
- **La tabla de tramos, tal cual la del documento.** Cada tramo empieza en su hora: libre a las 13:00 en punto ya es el segundo.

  | Libre a las… | Qué ve el día 1 |
  |---|---|
  | antes de las 13:00 | toda la ruta, con el Pincio y el Popolo, comida, cena y nocturna (si está libre antes de las 9:00, empieza a las 9:00) |
  | de 13:00 a 14:30 | la comida nada más llegar y los imprescindibles (Navona, el Panteón, Trevi y la Plaza de España con la Trinità); cena y nocturna |
  | de 14:30 a 17:00 | los imprescindibles, sin comida; cena y nocturna |
  | de 17:00 a 20:30 | desde Navona: Navona y el Panteón, cena, y de noche Trevi y la Plaza de España. Desde la Plaza de España: la Plaza de España y la Trinità, el Panteón y Navona, cena, y de noche Trevi |
  | de 20:30 a 23:00 | Trevi de noche, con su texto |
  | después de las 23:00 | nada, con su texto |

- **Lo primero que se quita, el Pincio y el Popolo.** Los imprescindibles del centro se quedan siempre que esté libre antes de las 20:30: de día o, lo que no quepa, de noche.
- **No hagas cuentas al minuto:** el tramo decide qué entra. Lo demás lo ajusta HOY.
- **La comida y la cena,** las de la ruta según dónde acaba, sin repetir restaurante.
- **La nocturna:**
  - en los tres primeros tramos, Trevi y la Plaza de España ya se han visto. En viajes de 2,5 días o más (regla 11c), va otra a 15 min o menos de la cena, andando o en taxi, como en el D3, primero las imprescindibles (suele ser el Coliseo). En viajes más cortos, Trevi y la Plaza de España;
  - de 20:30 a 23:00, el texto «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»;
  - **{Llegada}:** avión, «Aterrizas»; tren o autobús, «Llegas a {punto}»; barco, «Desembarcas»;
  - después de las 23:00: «{Llegada} a las {hora}. Descansa, que mañana empezamos a tope.»;
  - la de la llegada cuenta para el viaje: no se repite.
- **Lo visto en la llegada cuenta como visto (regla 9):**
  - los días siguientes lo pasan a «de camino», con «Ya lo visitaste el día 1»;
  - salvo si ese día se entra por dentro (el Panteón del D1, la Basílica del D2): se queda como parada.

## 6. El Free Tour
**El día de llegada:**
- **Se ofrece como ahora** (`freeTourAvailable`): en viajes de 2 días o más, por sus fechas.
- **Si está reservado,** manda su hora.
- **Si solo está en el viaje,** la hora sale de la tabla del documento (10, 12, 15 o 17). Después de las 16:30, al día siguiente a las 10:00. La de las 21:00, nunca sola.
- **La llegada con Free Tour:**
  - el Free Tour a su hora;
  - de la ruta, solo lo que el guía no enseña (la Trinità, el Pincio y el Popolo);
  - lo que sí enseña, con «Lo ves en el Free Tour»;
  - la comida, la cena y la nocturna según el tramo.
- **Con el Free Tour en la llegada,** los días 2 y 3 son el **D1 y el D2**, como siempre (no el D1-FT: su tarde repetiría la del D2). Lo del D1 que ya enseñó el guía va «de camino»; el Panteón por dentro se queda.
- **Con uno o ningún día entero,** el Free Tour solo va el día de llegada. Si no cabe, no se pone, y lo dice la hoja del resumen (texto en el documento).

**En «+ Añadir parada»:**
- **En la lista:** el Free Tour sale siempre el primero en «Recomendados» y en «Entradas». Si ya está en el viaje, no va el primero: sale con «Ya está en tu Día {n}».
- **En su ficha, dos botones:**
  - **[Añadir al Día {n}]:** sin preguntar la hora. La app lo pone a la que mejor le va a ese día (la de su día escrito; el día de llegada, la de la tabla), con la línea «Te proponemos las {hora} · Reserva para asegurar tu plaza».
  - **[Reservar Free Tour]:** abre el enlace `https://www.civitatis.com/es/roma/free-tour-roma/?aid=5206&cmp=Routy` en otra pestaña. Guarda el enlace en los datos del destino, no en el código. El botón no nombra a la empresa.
- **Fuera la hoja de la hora** de la 6j (`FreeTourSheet.tsx`, «Por la mañana · Por la tarde · Por la noche»).
- **La hora se pone al reservar:** en RESERVAS, con su confirmación, elige la hora que le han dado (10:00, 12:00, 15:00, 17:00 o 21:00). Entonces queda fija y el día se ajusta.

## 7. La excursión y los vuelos
Los casos del documento, con sus textos tal cual:
- **Sin reservar y el día 4 pasa a ser el de vuelta:** si la puso la app por defecto, ese día pasa a Roma solo, con su última mañana y el texto de la vuelta «Había excursión»; si la eligió el viajero, la hoja con [Pasar este día a Roma] · [Mantener la excursión].
- **Reservada:** no se toca nunca, y los demás días se quedan donde estaban.
- **Reservada el día de llegada, antes de estar libre:** el aviso «… no llegas. Revisa tu reserva.».
- **Reservada el día de vuelta, que vuelve después de salir:** el aviso con [Ver mi reserva] · [Pasar este día a Roma]. No se cambia nada solo.
- **Ostia o Tívoli** el día de vuelta: solo con el vuelo a las 18:00 o más tarde.

## 8. Las reservas y los vuelos
- **Antes de estar libre:** «Tu entrada al Coliseo es a las 10:00 y aterrizas a las 9:30: no llegas a tiempo. Revisa tu reserva.»
- **Después de la hora de salir:** «Tu entrada a los Museos Vaticanos es a las 15:00 y ese día sales hacia el aeropuerto a las 14:00. Revisa tu reserva.» Según el medio: aeropuerto, estación o puerto.
- **En un día en que ese sitio cierra** (también sin vuelos; en la 6j se guardaba sin decir nada): «La Galería Borghese cierra los lunes: revisa la fecha de tu reserva.»
- **Todos llevan [Ver mi reserva].**
- **Una reserva grande el día de llegada o en la última mañana:** como en el punto 4.
- **Sin vuelos, una reserva en otro día** (la 6k): se cambian los dos días enteros, uno por otro. **Esto sustituye la excepción de la 6j** («no se mueve en el día de llegada o de vuelta») cuando hay vuelos.

## 9. Los avisos
- **Una sola hoja para toda la app:** la de abajo, con su texto y la X, y botones solo si hay que elegir. Usa la de la 6j y pon en ella todas las hojas, también las de la 6j que no la usen.
- **La campana:** los avisos que son un problema (los de los puntos 7 y 8) se quedan en la campana hasta que se arreglan, aunque se cierre la hoja. Al arreglarlo, desaparecen solos.
- **La hoja del resumen:**
  - al poner, cambiar o borrar vuelos, el punto o la zona, **una sola hoja** con todo lo que ha cambiado (ejemplo en el documento);
  - termina con [De acuerdo], o con los botones de la excursión si hay que elegir;
  - los días cambiados a mano: «El día {n} lo has cambiado tú: lo dejamos como está.».

## 10. Lo viejo que se quita
Sustituido por lo de esta tanda, en un solo sitio:
- **la hoja «¿Ajustamos tu ruta a tu vuelo?»** («Sí, ajústala por mí» / «No, lo hago yo») y `flightOpportunity.ts`. También lo usan `PaceWandPrompt.tsx` y `stopScheduling.ts`: cámbialos para que no dependan de él, sin romperlos;
- **la tarjeta del primer y el último día de RESERVAS** (`FirstLastDayCard`), con «Libre hacia las {hora}» y «Ajustado / Lo ajustas tú / Por ajustar», y el campo `flightAdjust`;
- **el botón «Ajustar este día a tu llegada / vuelta»** de DÍAS y lo que hace (`fitMealsToStops`, si solo se usa ahí);
- **«EN EL CENTRO …»** de la barra y de la ventana de llegada;
- **cualquier otro camino** que rehaga el primer o el último día por la hora del vuelo.

Si algo de esto lo usa otra pantalla, apúntalo en PREGUNTAS y no lo rompas.

## 11. «Para tu zona» en la ventana de llegada
- **Arriba del Resumen,** una línea «Para tu zona» con lo más cómodo según el punto y la zona (tabla «Cómo llegar a tu zona» del documento). Debajo, las demás formas, como ahora. A la vuelta, al revés.
- **Sin zona,** como ahora.
- **Si llega después del último tren** (dato de `_llegada.json`), lo primero es el taxi.
- **Las líneas** son las que ya usa la app (metro A y B, bus 40 y 64, tranvía 8, FL1, Leonardo Express, Airlink).
- **Los textos con «centro»** de esa ventana y de `_llegada.json` («Cómo llegar al centro…», «De {punto} al centro», «casi todo el centro») pasan a «a Roma» o «a tu zona».
- **Si en `_llegada.json` falta un dato** (por ejemplo, si el tren de Civitavecchia para en Roma Trastevere), no lo inventes: apúntalo en PREGUNTAS.

## 12. Para los destinos que vienen
- **Deja en los datos de cada destino un `preguntar_movilidad`** (en Roma, `false`): en Roma no hay «¿Cómo te moverás allí?».
- **Escribe las reglas de llegada y vuelta para que reciban la ciudad, la hora y el punto.** Así mañana sirven para cada ciudad de un viaje con varias. No cambies todavía cómo se guarda el viaje: de momento, una llegada y una salida por viaje.

## 13. Pruebas
Con las 365 fechas de 2027, viajes de 1 a 7 días, con y sin Free Tour, con y sin excursión:
- **llegadas** a las 0:30, 6:00, 8:00, 10:00, 11:30, 12:00, 13:00, 14:00, 16:00, 18:00, 20:00, 22:00 y 23:30 por Fiumicino, y alguna por Ciampino, Termini y Civitavecchia;
- **vueltas** a las 1:00, 7:00, 8:00, 11:00, 14:00, 16:00, 18:00 y 21:00;
- **las seis zonas** y «Aún no lo sé».

Hay que comprobar:
1. **Sin vuelos,** en 3 días o más: el día 1 es el Centro (la ruta entera), los días 2 y 3 el D1 y el D2 (o al revés por un cierre) y el día 4 el interruptor. **Con vuelos:** los días 2, 3 y 4 son los mismos que sin vuelos (salvo el Free Tour después de las 16:30), y el día 1 empieza en Navona (en la Plaza de España si duerme allí), con las primeras paradas de su orden.
2. **Cada tramo lleva lo que dice la tabla:**
   - comida solo si está libre antes de las 14:30;
   - el Pincio y el Popolo, solo si está libre antes de las 13:00; Navona, el Panteón, Trevi y la Plaza de España, siempre que esté libre antes de las 20:30 (de día o de noche);
   - de 20:30 a 23:00, solo Trevi de noche;
   - después de las 23:00, nada.
3. **La noche:**
   - 0 nocturnas repetidas en el viaje;
   - en 2,5 días o más, ninguna nocturna es un sitio visto ese día;
   - la de la llegada, a 15 min o menos de la cena (andando o en taxi).
4. **Lo visto en la llegada** sale «de camino» los días siguientes, salvo lo que se ve por dentro. Nada por dentro dos veces en el viaje.
5. **El Free Tour sin reservar:**
   - a la hora de la tabla;
   - después de las 16:30, al día siguiente;
   - nunca a las 21:00;
   - con el Free Tour en la llegada, los días 2 y 3 son D1 y D2, sin el D1-FT.
6. **El día de vuelta:**
   - última mañana solo con 3 h o más;
   - la comida solo si se sale a las 14:30 o más tarde;
   - nunca una parada después de «salir − 1:00».
7. **Con un día entero:** D1 + D0-medio, o D0.
8. **La excursión:**
   - solo en el día 4, y solo si es entero;
   - una reservada nunca se mueve ni se quita.
9. **Los avisos de los puntos 7 y 8** salen cuando toca y se quedan en la campana hasta que se arreglan.
10. **0 textos de esta tanda** (barras, hojas, avisos, ventana de llegada y textos de la llegada) con «centro» o con el nombre de un proveedor.
11. **Lo de siempre:**
    - nada cerrado;
    - sin zigzag;
    - por dentro una sola vez;
    - 0 restaurantes repetidos.

**La página de simulación:**
- una llegada de cada tramo, empezando en Navona y empezando en la Plaza de España;
- tres vueltas: con mañana, sin mañana y con excursión reservada.

**A mano, en el móvil a 375 px:**
- poner la llegada, la vuelta y la zona en RESERVAS, y ver la hoja del resumen;
- el día de llegada con su barra;
- una llegada a las 21:00 con su texto;
- el día de vuelta;
- el aviso de una reserva a la que no llega, y que se queda en la campana;
- el Free Tour en «+ Añadir parada», con sus dos botones.

Al final, **reinicia el api-server.**

## 14. Lo que NO va en esta tanda
- La pestaña HOY en detalle.
- La escala de crucero (llegar y salir el mismo día por Civitavecchia).
- Los viajes con varias ciudades.
- La zona del alojamiento para el día de vuelta (la vuelta se cuenta desde el centro).
- Qué es gratis y qué es de pago.
