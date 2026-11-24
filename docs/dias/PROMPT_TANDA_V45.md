Hola. TANDA V45: RESERVAS (vuelo, alojamiento, entradas y excursiones) Y LOS AVISOS DE TODA LA APP. Empieza SOLO cuando la V44 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**ANTES DE NADA: sube la nota `_estado_v45.md` a la rama `estado` al empezar y cada 30 minutos.** Además: 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado** (en la V43 lo programaste aunque el prompt decía que no: regla de CLAUDE.md). Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. Consulta nueva a Supabase: cada cuánto y cuánto baja.

**Dibujos en Design, en «ULTIMO».** Copia SOLO lo que se dice aquí. **Regla de esta tanda: solo se AÑADE.** Lo que hoy funciona y no sale en un dibujo (filas de datos del vuelo, «o escribe los datos a mano», la zona, los candados sin pase, el carrusel…) se queda como está. Nombres, fechas y precios de los dibujos son ejemplos.

## 1. El mismo patrón en vuelo, alojamiento, entradas y excursiones
Cada tarjeta guardada lleva, arriba a la derecha junto al lápiz, **un icono del documento** (QR o reserva): **gris con «+»** si falta, **dorado** si está (al tocarlo, se abre en grande: `CodigoPantallaCompleta`). Mientras falta, abajo, **un botón de borde «+ Añade/Sube…»** que abre lo mismo que hoy. Con el documento, el localizador y el código pequeño «Toca para ampliar». **Primero se guarda, después se sube:** las hojas ya no piden el documento.

## 2. Vuelo («Llegada y vuelta»)
- Hoy la ida sale plegada en una línea y no se ve [Añadir tarjeta de embarque]. **Cada vuelo guardado se ve abierto:** las horas grandes, el trayecto, el lápiz, el QR y, sin tarjeta, **[+ Añade tu tarjeta de embarque]**.
- **La vuelta sin poner:** una línea con «+» y el enlace **«Falta añadir la vuelta»**, que abre la hoja del vuelo en «Vuelta». Sin QR.

## 3. Alojamiento
- El icono de la reserva junto al lápiz, y el botón dorado grande [Añadir tu reserva] pasa a ser **[+ Añade tu reserva]** de borde. Desaparece cuando ya está.
- Con reserva: entrada y salida, teléfono y localizador, **solo si el documento los trae o el viajero los escribe**.
- La dirección, una vez: «Zona Prati» en una línea y la dirección en otra, con el mapa pequeño de la V44.
- **Sin pase, como hoy:** la zona y [Cómo llegar] con el candado, no escondidos.
- **Arriba, «Listo» con el hotel y las fechas**, haya documento o no. «Falta» solo si falta el hotel o las fechas. La reserva no enciende el «!» de RESERVAS.

## 4. Entradas, excursiones y free tours: UNA sola pieza
**La hoja «Elige día y hora»** (01, 01g, 02, 03; y la de la excursión):
- se quitan el botón dorado de arriba [Añadir tu entrada] y el enlace «Rellenar desde el email o el PDF»;
- **una persona sola:** los días (todos los del viaje, con «En tu ruta»), la hora («Hora de entrada» o «Hora de recogida»), el precio y [Guardar la entrada] o [Guardar la excursión];
- **en grupo:** paso 1, los días y la hora, con [Siguiente]; paso 2, «Casi lista», con «Jue 26 · 07:00» arriba, «¿A qué cuenta lo sumamos?» ([Mi cuenta] / [Cuenta conjunta], o «Cuenta del grupo» según `modoCuentas`), «¿Quién la ha pagado?» (todos los viajeros) **solo con la cuenta conjunta o del grupo**, el precio y [Guardar…];
- sin los textos en gris («Solo lo ves tú», «Entra directo en el presupuesto»).

**La tarjeta guardada:** el día y la hora, quién y el precio, el QR y **[+ Sube tu entrada]** (o [+ Sube tu reserva] en las excursiones). Si al subirla el documento trae otro día u otra hora, la app los corrige y lo dice.

**El contador «X de Y reservadas» cuenta al GUARDAR**, no al subir el documento (en el dibujo pone «0 de 1» con la excursión guardada: está mal).

## 5. «Excursiones y actividades»
- **La excursión de la ruta:** dos botones juntos, [Reservar excursión] (dorado) y [Ya la tengo] (borde), que abre la hoja del punto 4. Del dibujo se copian SOLO esos botones.
- **El carrusel se queda siempre**, también con excursión en la ruta.
- **[Ver todas] abre la página de todas las excursiones y actividades** (la del «X % de viajeros»), NO EXPLORAR. Hoy en Lanzarote el carrusel enseña 7 (free tours, kayak, ferry…) y [Ver todas] abre EXPLORAR › Excursiones con 3.
- **Esa página tiene TODAS:** lo del carrusel y lo demás de Civitatis y nuestras, primero en el orden del carrusel. Arriba, filtros por tipo (Excursiones, Free tours, Actividades, Entradas). [Ver todas] solo sale si hay más de las que se ven.
- **Abajo:** «¿Ya tienes una? Añádela» o, con excursión en la ruta, «¿Ya tienes otra? Añádela».

## 6. Los avisos de TODA la app (amplía la regla de la V43 en CLAUDE.md)
- **Con [Deshacer]:** abajo, tapando el menú.
- **Solo informan:** arriba, se van solos a los 5 s y se juntan.
- **Un error en un billete, una entrada o una reserva** (hoy: «Tu tarjeta es del viernes 13 y tu vuelo está el lunes 23. Revisa las fechas.» con [Vale], abajo): **ni ventana ni aviso que se va.** Una línea en naranja **dentro de esa tarjeta**, junto al QR: «⚠ Esta tarjeta es del viernes 13 y tu vuelo es el lunes 23. Revisa que sea la buena», con [Es correcta]. Se queda hasta cambiar el documento o pulsar [Es correcta].
- Revisa los avisos de RESERVAS, DÍAS, EXPLORAR y el Perfil, y pon cada uno en su sitio.

## 7. La prueba
- **`pruebaJutrip`, `pruebaV36`, `pruebaV43`, `pruebaV44` y las de lo que toques (cuentas y reservas), en 0.** Mira también `HOY2b_D` (1 fallo con el archivo de fotos de Roma, desde la V43): si la vieja es la prueba, ponla al día.
- **Nueva `pruebaV45`:**
  - cada tarjeta guardada (vuelo, alojamiento, entrada, excursión) enseña el QR gris y su botón «+», sin abrir nada;
  - sin vuelta, «Falta añadir la vuelta» y sin QR;
  - en viaje solo, la hoja sin «¿A qué cuenta?»; en pareja, «¿Quién la ha pagado?» solo con la cuenta conjunta;
  - el contador sube al guardar;
  - en Lanzarote, todo lo del carrusel está en [Ver todas];
  - el aviso de fecha va dentro de la tarjeta;
  - ningún aviso sin [Deshacer] abajo.
- **En el REPASO:** capturas en tamaño iPhone de cada punto, solo y en grupo, tu lista de comprobación DE ESTA TANDA y qué cambia, en palabras sencillas.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que RESERVAS, HOY y DÍAS cargan. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
