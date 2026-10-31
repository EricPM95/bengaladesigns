Hola. TANDA 10S7: «REORGANIZAR» DEL PASE, TODA PARADA NUEVA LA PRIMERA DEL DÍA, LAS ENTRADAS Y EL ALOJAMIENTO CON SU BILLETE, LA LISTA DEL PASE Y LAS PRUEBAS QUE NO SE DEVUELVEN (31-oct). Va después de la 10S6 (la de solo diseño): si estás con otra tanda, acábala primero (con su push) y haz esta después. Puedes tocar el motor solo para el apartado 2 (reorganizar un día); dime antes qué vas a tocar. No hace falta la muestra de 60 fechas, salvo que toques el motor de la ruta inicial (entonces sí).

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S7.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Migraciones aplicadas por Eric:** todas hasta la **0071** (la corregida).
- **Design:** ya puesto al día en la 10S6 (`docs/diseno/proyecto/`). Lo de esta tanda: `Piezas/Reorganizar` (R1 a R4), `Piezas/Entradas Billete` (E1 a E4, A1 y A2), el botón del código de `Piezas/Entradas Lista` (L2) y los cambios de `Piezas/Pase Lista`. **El diseño, exactamente igual; los textos y los datos, los de este prompt.**
- **Cómo trabajar (Eric quiere las tandas rápidas):** los 4 agentes a la vez, repartiendo los apartados que no se pisan; un solo servidor; hasta 2 Chrome de prueba a la vez (las del Supabase real, solas y con cuentas fijas). Con menos de 6 GB libres, espera. Nada de batería completa: solo las pruebas de lo tocado y `pruebaJutrip` (y `pruebaTanda10J` si tocas `empezar_de_cero` o creas una tabla con datos de una persona). Si un apartado se complica, déjalo a medias, dímelo y sigue. Dime al empezar cuánto calculas que vas a tardar. La nota de estado (`docs/dias/_estado_10s7.md`) a la rama `estado` cada 30 minutos, de principio a fin. No apagues el PC.

## 0b. Respuestas a tus dudas de la 10S6
- **La línea del pase en la Vuelta**, bajo «Sale a las»: se queda ahí (es el lado de Roma, como en la Ida).
- **Las miniaturas de las entradas** (hoy un degradado con rayas): que salga **la foto del sitio**, la misma que tiene la parada en DÍAS y en su ficha. El degradado, solo si un sitio no tiene foto.
- **La traza de React sobre `ReservasPanel`** en `pruebaTanda6s` y `pruebaTanda7_reservas`: mírala y dime qué es; si es un fallo de la app, arréglalo.
- **`pruebaTanda7_conexion`, `pruebaTanda7_ficha` y `repaso10N9`**: ponlas al día con lo que cambió a propósito («antes → ahora → decisión de Eric») y pásalas en 0 fallos.
- La tabla de estaciones de ejemplo (13 ciudades) vale por ahora.

## 1. Toda parada nueva, la primera del día (regla nueva, gratis y con pase)
- **Toda parada que se añade a un día, o que se pasa a otro día** (desde EXPLORAR, su ficha, «+ Añadir parada», «Mover a otro día», [Añadir otra reserva]…), **va la primera de ese día** y se ilumina un segundo (como ya se marca al mover). El vuelo y el hotel no cuentan como paradas: el día 1, la primera parada después de la llegada; el último día, el vuelo sigue al final.
- **La excepción: «Añadir entre dos paradas».** Ahí el viajero ha elegido el sitio: se queda donde la ha puesto.
- **Una reserva que ya está en su día no se mueve** (regla de la 10N10).
- **El Free Tour reservado en otro día** (por ejemplo, el viernes cuando está el jueves): pasa a ese día, de primero, como cualquier parada. Ningún otro día se toca.
- Gratis se queda así. Con pase, puede salir el botón del apartado 2.
- Fuera la regla vieja «con pase, donde mejor encaja» al añadir: ahora eso lo hace el botón.

## 2. El botón «Reorganizar» del pase (`Piezas/Reorganizar`)
- **Solo con el pase.** Un botón flotante redondo, **encima del de logros** (R1), en columna, sin taparse (regla de los botones flotantes de la 10S5).
- **Cuándo sale:** después de que el viajero añada una parada o la pase a otro día; ponga o cambie la hora de una entrada o del Free Tour; ponga o cambie los vuelos; o elija o cambie **la zona** del alojamiento. **Y solo si reorganizar cambiaría algo de verdad:** la app lo calcula antes; si el día ya está en el mejor orden (por ejemplo, una parada añadida «entre dos paradas» en su sitio), no sale nada.
- **Nada se reorganiza solo** (tampoco el vuelo al guardarlo): todo pasa por el botón. Si hoy algo se recoloca solo con el pase, dímelo y quítalo.
- **Al tocarlo, la alerta (R2):** «**¿Reorganizamos tu día?**» · «Adaptamos tus paradas a tu viaje y tus reservas a su hora, para que no pierdas tiempo.» · [Reorganizar] [Ahora no]. Con «Ahora no», el botón desaparece hasta el próximo cambio.
- **Qué hace al reorganizar:** solo los días afectados; **no quita nada** de ningún día; las reservas, más o menos a su hora; lo demás, en el mejor orden alrededor (andar lo menos posible, con los cierres del día). Si las horas no acaban de cuadrar, no pasa nada.
- **Después (R3):** la franja «Hemos reorganizado tu día» con [Deshacer], y las paradas que se han movido iluminadas un momento. El botón desaparece.
- **El menú «⋯» del día (R4):** **el nuestro de siempre**, con una opción más: «Reorganizar este día» (solo con pase; sin pase no sale). Design pinta otras opciones de ejemplo: no las copies.
- **Viaje compartido:** el botón solo para quien puede editar la ruta, y al reorganizar sale **un solo aviso** para los demás («Eric ha reorganizado el jueves 26»).
- **Sin pase**, nada nuevo: solo la línea gris del pase debajo de una reserva que no cuadra con su franja (la de la 10S3).

## 3. Las entradas con su billete (`Piezas/Entradas Billete` E1 a E4)
- Igual que el billete del vuelo (10S5), para las entradas y el Free Tour: **[Añadir tu entrada]** (E1) desde el PDF, una foto o una captura; la app lee y rellena el día, la hora, cuántas personas y el localizador, y guarda el código; con la entrada (E2), el código en pequeño con «Toca para ampliar»; a pantalla completa (E3). Se puede cambiar cualquier dato a mano.
- **Con el pase, en HOY** (E4), en la parada de ese sitio, la fila «Tu entrada» con el código pequeño, que se abre a pantalla completa.
- **Privado y sin internet,** como el billete: cada uno ve solo su entrada, y se ve sin conexión. Usa la tabla de la 0070 si sirve (es «el billete de cada persona»); si hace falta otra, migración nueva con su comprobación, y al inventario de `empezar_de_cero` (con su migración) y de `pruebaTanda10J`.

## 4. El botón del código en «Entradas y Free Tour» (`Piezas/Entradas Lista` L2)
- En las entradas reservadas, el botón del código (el cuadradito de la derecha) que abre el código a pantalla completa (E3). Solo si esa entrada tiene su billete añadido.

## 5. El alojamiento con su reserva (`Piezas/Entradas Billete` A1 y A2)
- **[Añadir tu reserva]** (A1) desde el PDF, una foto o una captura; la app lee y rellena el nombre del hotel, la dirección, las fechas y las noches, la hora de entrada y de salida, el teléfono y el localizador (A2). Sin código (los hoteles no lo usan). Se puede cambiar a mano.
- **Diferencias con Design:** la cabecera del bloque **sin la línea de debajo del título** (Design pinta «Roma · 3 noches»), como dejó la 10S4; y dentro sigue lo de la 10S4: el precio con «Cambiar», «Eliminar alojamiento» abajo a la derecha y, con pase, la zona, la dirección y [Cómo llegar a tu alojamiento].
- Si la dirección leída de la reserva es distinta de la que había, pregunta antes de cambiarla.

## 6. La lista del pase (`Piezas/Pase Lista`)
- Los dos puntos nuevos de «Antes del viaje», como Design: «**Tu día, reorganizado en un toque**» · «Optimizamos tu ruta para que no pierdas tiempo.» (después de «Tu ruta se adapta a tu vuelo») y «**Adaptamos tu viaje al mejor orden**» · «Ordenamos tus días según tus prioridades y los cierres de los monumentos.» (en lugar de «Los días, en el mejor orden»). También en `data/pase/incluye.json`.
- **Solo si es verdad:** el primero, cuando el botón del apartado 2 funcione; el segundo, dime si con el pase se ordenan de verdad los días por las entradas y los cierres; si no, que la frase diga solo lo que hace.

## 7. «Empezar de cero» no devuelve las pruebas
- Hoy `empezar_de_cero` (0071) borra `hoy_prueba` (el día de prueba de HOY) e `historia_de_prueba`: cualquiera podría gastar su prueba, empezar de cero y tenerla otra vez, sin fin. **Las pruebas gastadas se quedan siempre** (son «una por cuenta, para siempre»): migración nueva (0072 o la que toque) que las saque de lo que se borra, partiendo de la **última** versión de la función (la de la 0071), con su `COMPROBAR_…sql`; y `pruebaTanda10J` al día (que tras empezar de cero la prueba siga gastada, y que el resto se borre igual).

## 8. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip` y `pruebaTanda10J`, en 0 fallos.
- Prueba nueva `pruebaTanda10S7`:
  - añadir una parada desde EXPLORAR, «+ Añadir parada» y [Añadir otra reserva]: va la primera del día (el día 1, después de la llegada) y se ilumina; «entre dos paradas» se queda donde la pone; pasar una parada a otro día: la primera de ese día; el Free Tour reservado en otro día: pasa a ese día y ningún otro cambia;
  - con pase: el botón sale solo si reorganizar cambia algo; la alerta; «Ahora no» lo esconde; reorganizar no quita nada, pone la reserva más o menos a su hora, solo toca los días afectados, ilumina lo movido y [Deshacer] lo devuelve todo; «Reorganizar este día» en el menú «⋯» con pase y no sin pase; nada se reorganiza solo al guardar el vuelo; en un viaje compartido, un solo aviso; sin pase, el botón no sale nunca;
  - las entradas con su billete (añadir, datos, código, pantalla completa, privado, sin internet; con pase, «Tu entrada» en HOY);
  - el botón del código en las entradas reservadas;
  - el alojamiento con su reserva;
  - los dos puntos de la lista del pase;
  - empezar de cero con la prueba gastada: sigue gastada.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S7.html`, a tamaño de móvil, al lado de las de Design.

## 9. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S7»: qué has hecho, en palabras sencillas, qué has tocado del motor, qué pruebas has pasado y qué migraciones hay que aplicar (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta, con pase o sin él) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10S7.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
