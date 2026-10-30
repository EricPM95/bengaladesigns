Hola. TANDA 10S4: MÁS DEL REPASO DE ERIC (30-oct): EL PRESUPUESTO SIN EL VUELO, LAS ENTRADAS DE LA RUTA QUE NO LLEGAN A RESERVAS, [AÑADIR OTRA RESERVA] CON SU BUSCADOR, LOS BLOQUES DE RESERVAS QUE SE PLIEGAN Y LOS BUSCADORES SIN ACENTOS. Va después de la 10S3: si estás con ella, acábala primero (con su push) y haz esta después. No toques el motor de rutas (si hace falta, dímelo antes). No hace falta la muestra de 60 fechas.

## Antes de cerrar la 10S3: respuestas a tus dudas (aplícalas en la 10S3, antes de su push)
1. Haz al menos la captura de la hoja del tren y ponla en `REPASO_10S3.html`.
2. HOY: sí, el billete igual que en DÍAS, «BCN 08:30 → FCO 11:15», sin cortar nunca la hora de llegada a Roma.
3. Castillo «por dentro»: la foto de día del Castillo (nunca la de noche). Apúntalo.
4. **El Free Tour: arréglalo en la 10S3.** El apartado 5 de la 10S3 te deja tocar el motor para eso. Que la reserva del Free Tour (o cambiarle la hora) **nunca** rehaga ni mueva días, tampoco los siguientes por `reservasParaMotor`. Si el arreglo es grande, dime antes qué vas a tocar. Añade a `pruebaTanda10S3` el caso: viaje con el Free Tour ya puesto, reservarlo a otra hora en su día y comprobar que **ningún día** del viaje cambia (mismas paradas, mismo orden, todos los días) y que no sale ningún mensaje.

Cuando la 10S3 esté cerrada y subida, empieza esta.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S4.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Design:** no hay zip nuevo. Lo que no dibuja Design, con las piezas y el estilo que ya tiene cada pantalla (RESERVAS, presupuesto), bonito y coherente.
- **Cómo trabajar (Eric, 30-oct: quiere esta tanda rápida):** usa los 4 agentes a la vez, repartiendo los apartados que no se pisan; un solo servidor; hasta 2 Chrome de prueba a la vez (las del Supabase real, solas y con cuentas fijas). Con menos de 6 GB libres, espera. Nada de batería completa: solo las pruebas de lo tocado y `pruebaJutrip`. Si un apartado se complica más de la cuenta, déjalo a medias, dímelo en el informe y sigue con los demás. Dime al empezar cuánto calculas que vas a tardar. La nota de estado (`docs/dias/_estado_10s4.md`) a la rama `estado` cada 30 minutos, también mientras corren las pruebas. No apagues el PC.
- **Eric sigue repasando la app mientras trabajas:** no cambies nada fuera de lo que pide esta tanda.

## 1. El presupuesto
- **El precio del vuelo no suma** (Eric: vuelo de 150 € en RESERVAS; el presupuesto da 330 € = hotel 280 + Coliseo 50). **La causa** (`src/lib/presupuesto.ts`, líneas 158-159): la ida y la vuelta solo se suman con `entrada.pago` (`pagoActivo()`): «Lo de pago (los billetes de llegada y vuelta) solo cuenta con la versión de pago», una regla vieja de cuando poner los vuelos era del pase. Hoy poner el vuelo es gratis (lo del pase es adaptar los días): **el precio del vuelo, del tren, del autobús y del barco suma siempre, con pase y sin él.** Repasa que nada más del presupuesto dependa del pase y dime si encuentras algo.
- **La leyenda de arriba** (debajo del total) dice «Transporte · 280 €» y esos 280 € son el hotel. **En la leyenda, separados:** «Transporte · 150 €», «Alojamiento · 280 €», «Ruta · 50 €» (y «Extras» si hay), cada uno con su color en la barra; si no cabe en una línea en 375 px, en dos. **El bloque de abajo sigue junto: «Transporte y alojamiento».**

## 2. RESERVAS: «Llegada y vuelta» y «Alojamiento», que se pliegan
- **Como «Entradas y Free Tour»** (que ya se abre y se cierra):
  - **Cerrado** (así salen cuando están «Listo»): la misma cabecera que cuando RESERVAS está vacía (el icono, el título y su estado), con el icono en verde y «Listo». **Ninguna línea de texto debajo del título**, diga lo que diga (hoy sale, por ejemplo, «Barcelona → Roma · 110 €» o el nombre del hotel; con otro destino u otros datos será otro texto: fuera igual). Al tocarlo se abre; otra vez, se cierra. Mientras falta algo, abierto, como ahora.
  - **Abierto:** lo de ahora, sin esa línea de debajo del título. «Cambiar» deja cambiar todo (el nombre, las fechas, el precio…).
  - **El precio, dentro:** en el vuelo, «Precio · 110 €» con su «Cambiar» (hoy el precio solo sale en la línea de arriba, que se va); en el alojamiento, como ahora («2 noches · 280 €», «Cambiar»).
- **El alojamiento abierto, con el mismo estilo que los bloques del vuelo:** la caja crema con sus datos (el hotel, las fechas y las noches, el precio; con pase, la zona, la dirección y [Cómo llegar a tu alojamiento]), «Cambiar» arriba a la derecha y «Eliminar alojamiento» abajo a la derecha.
- **La línea del pase (sin pase):** con el bloque abierto, dentro, debajo, como siempre; **con el bloque cerrado, fuera, debajo de la cabecera**, para que se vea sin abrirlo.
- **«Eliminar vuelo»** (en rojo, hoy centrado al final de cada bloque, Ida y Vuelta): que siga al final del bloque, pero **alineado a la derecha**, debajo de «Cambiar». Igual con tren, autobús y barco.

## 3. RESERVAS: «Entradas y Free Tour», solo lo de tu ruta y al día
- **El fallo:** Eric añade a su ruta un sitio con entrada que no estaba (los Museos Capitolinos) y **no aparece en «Entradas y Free Tour»**.
- **Lo que pido:**
  - el bloque enseña **solo «En tu ruta», bien resaltado**: la entrada de cada parada de la ruta que la necesita, más el Free Tour si está. **Se actualiza solo:** se añade a la ruta un sitio con entrada (los Capitolinos, la Cúpula…) → aparece su entrada; se quita la parada → se va, salvo que ya tenga la entrada guardada: entonces se queda con «Ya no está en tu ruta» (regla de la 10N10). Con un sitio varias veces en la ruta, una entrada por parada;
  - **fuera «Ver 3 más»** (las reservas que no están en la ruta);
  - en su lugar, **[Añadir otra reserva]** (apartado 4).

## 4. [Añadir otra reserva] y su buscador
- **Una casilla donde se escribe lo que sea.** Mientras escribe, si lo escrito se parece a algo nuestro con entrada, sale debajo **como sugerencia** (con su foto pequeña y su nombre). Si la toca, es ese sitio; si no, se queda lo que ha escrito, tal cual. Después, la misma hoja de siempre: día (en cuadrados), hora, «¿Para quién es…?», precio y [Guardar la entrada].
- **Dónde va:**
  - **si eligió una sugerencia** (un sitio nuestro): **entra también en la ruta, en el día elegido**, como **primera parada de ese día** (como hasta ahora sin pase), con su hora; la app lleva a la parada y la marca un momento. Si la hora no cuadra con su franja, sale la línea gris del pase (la de la 10S3). **No se quita nada del día.** El día no se cambia nunca (si la entrada es para el jueves, va el jueves). Con pase, de momento, igual (lo que hará el pase va en otra tanda);
  - **si se queda lo escrito:** solo en RESERVAS (no sabemos dónde está).
- **El buscador, sin acentos ni mayúsculas** («cupula» = «Cúpula»), con palabras a medias («capito» → Museos Capitolinos), alguna letra equivocada («cupla») y el nombre en italiano («Cupola», «Musei Capitolini»).

## 5. Todos los buscadores, igual
- **Regla nueva (a `REGLAS_DE_LA_APP.md`):** ningún buscador de la app falla por un acento, una mayúscula, una palabra a medias o una letra equivocada, y todos encuentran también el nombre en el idioma del destino. Repasa los que hay (EXPLORAR, «Añadir parada», la ciudad de salida, el de esta tanda…) y pásalos a una sola forma de buscar. Dime cuáles has cambiado.

## 6. «Reorganizar este día», solo con el pase
- El botón «Reorganizar este día» (`ReorganizarDia.tsx`, Tanda 6y, al final de los días con dos paradas o más) **hoy lo puede usar cualquiera**, y reorganizar es del pase (Eric, 26 y 30-oct). **Sin pase, que no salga.** Con pase, como ahora. (En otra tanda se cambiará por un botón flotante del pase.)

## 7. Lo pendiente de otras tandas
- **`PiezaSegura` en más sitios** (10S2, Eric de acuerdo): cada día de DÍAS, cada bloque de RESERVAS, cada aviso de la campana.
- **Las zonas de toque de 44 × 44** en las hojas, los modales y los menús, que quedaron sin medir en la 10S (sin cambiar lo que se ve).

## 8. La prueba
- Solo las pruebas de lo que tocas, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10S4`:
  - el presupuesto con vuelo, sin pase y con pase: el vuelo suma; la leyenda con Transporte, Alojamiento y Ruta separados, sin cortarse en 375 px; el bloque «Transporte y alojamiento» junto;
  - «Llegada y vuelta» y «Alojamiento»: cerrados cuando están listos (sin línea debajo del título), se abren y se cierran, abiertos mientras falta algo; el precio dentro; el alojamiento con el estilo del vuelo; la línea del pase fuera con el bloque cerrado y dentro con el bloque abierto; «Eliminar vuelo» a la derecha;
  - añadir a la ruta un sitio con entrada que no estaba (los Capitolinos) → aparece en «Entradas y Free Tour»; quitarlo → se va; quitarlo con la entrada guardada → se queda con «Ya no está en tu ruta»; sin «Ver 3 más»;
  - [Añadir otra reserva]: escribir «cupula» → sugiere la Cúpula; elegirla y guardarla el jueves → entra en la ruta el jueves, de primera, marcada, sin quitar nada del día; escribir algo que no tenemos → solo en RESERVAS;
  - los buscadores con «cupula», «capito», «cupla» y «Cupola»;
  - sin pase, sin «Reorganizar este día»; con pase, sí.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S4.html`, a tamaño de móvil.

## 9. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S4»: qué has hecho, en palabras sencillas, qué pruebas has pasado y si hace falta migración (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta, con pase o sin él) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10S4.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
