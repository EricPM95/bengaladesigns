Tanda 6z6: HOY solo en la de pago (y con más valor), lo de antes del viaje a RESERVAS, las fotos y el mapa de mis viajes en el Perfil, «Escuchar», «Cerca de mí» de pago y un panel de pruebas. Va todo en este mensaje. Empieza cuando esté subida la 6z5. La 6y (la ruta a mano) va después de esta.

Antes de empezar: he copiado este prompt (docs\dias\PROMPT_TANDA6Z6_PARA_PEGAR.md) y PENDIENTES_6K.md en docs\dias. Mételos en un commit tal cual.

LA IDEA (decidido por Eric el 10-oct-2026)
En la 6z3 HOY salía en las dos versiones, y la diferencia entre la gratis y la de pago era casi nada: la gratis ya enseñaba las paradas de hoy, y «Cómo llegar» ya está gratis en DÍAS. Además, «Hoy» no pega con una cuenta atrás ni con las fotos de un viaje ya hecho. Así que:
- HOY pasa a ser solo de pago, y solo para vivir el viaje;
- lo de antes del viaje va a RESERVAS; las fotos, al Perfil.

1. LA BARRA, SEGÚN LA VERSIÓN (no según el momento)
- Gratis: cuatro pestañas, siempre: Ruta · Días · Explorar · Reservas.
- De pago: cinco, siempre: Hoy · Ruta · Días · Explorar · Reservas.
- En la gratis, HOY no sale (ni con candado): lo de pago no se enseña, simplemente no está.
- La barra no cambia nunca con el momento del viaje (antes, durante, después).

2. LO DE ANTES DEL VIAJE, ARRIBA DE RESERVAS (gratis y de pago)
- Arriba del todo en RESERVAS, antes de la fila del presupuesto, la tarjeta oscura de la cuenta atrás (el diseño de la 6z3): «Tu viaje a {destino} empieza en» y «{n} días», y debajo una línea: «Te faltan {n} cosas por reservar» (lo que está en «Falta» en los bloques de abajo; si no falta nada, «Lo tienes todo listo ✓» en verde).
- Sin fechas: «Tu viaje a {destino} · {mes}» y [Pon tus fechas].
- Durante el viaje: «Estás en {destino} · día {n} de {total}» (con fechas, «lun 13 · 2 de 4»).
- Después del viaje: la tarjeta no sale.
- «Te falta por reservar» con sus botones y «Útil para el viaje» ya no van aparte: son los bloques de RESERVAS de siempre.
- El tiempo (la previsión de 5 días antes) va dentro de esta tarjeta, en pequeño, cuando la haya.

3. DÍAS, DURANTE EL VIAJE (gratis y de pago)
- Durante el viaje, DÍAS se abre sola en el día de hoy, con la etiqueta «HOY» en su cabecera. Es el «hoy» de la versión gratis. Los demás días siguen ahí, como siempre: se abren y se cierran igual.

4. LAS FOTOS Y EL MAPA DE MIS VIAJES, EN EL PERFIL
- **El mapa de mis viajes** (gratis y de pago): en el Perfil, arriba, un mapa distinto al de la app, tipo bola del mundo (el globo de Mapbox, `projection: 'globe'`), con una chincheta por cada destino de cada viaje (un viaje a Roma y Florencia, dos chinchetas). Debajo, la lista de todos los viajes («Roma · 13 – 16 oct 2026 · 4 días»), los que vienen y los hechos.
  - Al tocar una chincheta o un viaje de la lista: su ficha, con el resumen («4 días · 23 paradas») y su álbum de fotos.
  - Sin cuentas todavía: son los viajes de este móvil (como «Mis viajes» de ahora). Cuando haya login, pasarán a la cuenta.
- **El álbum de cada viaje**: ordenado por días (y por parada, si la tiene), con [Añadir fotos] y «Eliminar» en cada una. Lo de la 6z3 (almacén privado, sin datos de dentro), igual.
- **Añadir fotos durante y después del viaje:**
  - en las dos versiones, desde la ficha de cada parada: «📷 Añadir foto»;
  - en la de pago, también al marcar «✓ Visto» en HOY, y desde «Guarda tus recuerdos» de HOY después del viaje (la tarjeta del diseño);
  - en la gratis, después del viaje, la misma tarjeta «Guarda tus recuerdos» sale arriba en RUTA (la pestaña del viaje), con [Subir mis fotos], y lleva al álbum.
- **Cuántas fotos:**
  - gratis: una foto por parada (si ya tiene una, «Añadir foto» pasa a «Cambiar foto»), con una línea pequeña en el álbum: «Una foto por parada»;
  - de pago: sin límite.
- Fuera de HOY lo de antes de las fotos que no sea esto.

5. HOY DE PAGO, POR MOMENTOS
- **Antes del viaje:** «Tu modo Hoy se activa el {fecha del primer día}» y, debajo, lo que tendrá, en una lista corta (la siguiente parada y cómo llegar, «No me da tiempo», «Escuchar», lo que tienes cerca, los avisos del día). Con [Ver mi primer día], que abre DÍAS. Sin fechas: «Pon tus fechas para activar tu modo Hoy» y [Pon tus fechas].
- **Durante el viaje:** lo de la 6z3 y la 6z5 (la siguiente parada con su distancia y «Ubicación», [Cómo llegar], [✓ Visto], [No me da tiempo], la entrada a su hora, la lluvia y la lista del día), más:
  - **«Escuchar»** (punto 6), en la tarjeta de la siguiente parada;
  - **«Cerca de ti»**: tres botones pequeños, «Baños», «Fuentes» y «Comer», que abren EXPLORAR con ese filtro y ordenado por cercanía a donde está el viajero (con su ubicación; sin ella, desde la siguiente parada). Ya están los datos de baños, fuentes y restaurantes;
  - **«Cerca de mí» pasa a ser de pago en EXPLORAR**: en la gratis, EXPLORAR ordena solo por «Recomendado» (sin «Cerca de mí»); en la de pago, los dos. Los filtros de baños y fuentes, también solo en la de pago (se usan durante el viaje). Dime en el informe qué más usa la ubicación del viajero en la gratis;
  - **los avisos del día**, en una línea cada uno: lo que cierra hoy de su ruta («Hoy el Panteón cierra a las 17:00»: el horario real, no un cálculo) y la lluvia.
- **Después del viaje:** «Tu viaje a {destino}» con las fichas de los días, «Guarda tus recuerdos» (la tarjeta del diseño, con [Subir mis fotos]) y [Ver mis recuerdos] (abre el álbum en el Perfil), y «¿A dónde vamos ahora?» con [+ Nuevo viaje].

6. «ESCUCHAR»: LA FICHA EN VOZ ALTA (de pago)
- Un botón «Escuchar» (icono de un altavoz, de la familia de la 6z3) en la tarjeta de la siguiente parada en HOY y en la ficha de cada parada (pestaña «Resumen»), en la de pago.
- Lee en voz alta el texto del «Resumen» de esa ficha, con la voz del propio móvil (la síntesis de voz del navegador, en español de España si la hay; si no, el español que tenga). Sin coste y sin mandar nada fuera.
- Con [Pausa] y [Seguir], y se para al cambiar de pantalla.
- Si el móvil no tiene voz en español, el botón no sale.
- Nada de voces ni textos de otros: solo nuestros textos.

7. EL PANEL DE PRUEBAS (solo en local y en las vistas previas, nunca en producción)
- Un botón pequeño «Pruebas», abajo a la izquierda, por encima de la barra, que abre una hoja con:
  - **Versión:** Gratis · De pago (lo mismo que `?version=gratis` / `?version=completa`);
  - **Momento:** Antes del viaje · Durante (día 1, día 2…) · Después (con el simulador de fecha que ya hay, `DevDateSimulator`);
  - **Números de prueba de «me gusta»:** sí · no (lo mismo que `?prueba=1`).
- Se acuerda de lo elegido mientras dure la sesión. Fuera de producción, igual que la regla de `?prueba=1`: en producción no sale nunca.
- Sirve para que Eric lo vea todo sin tocar enlaces.

8. PRUEBAS
- Las de siempre a 0 fallos (con la 6z3 y la 6z5).
- Una prueba 6z6:
  - la barra tiene 4 pestañas en la gratis y 5 en la de pago, en todos los momentos, con y sin fechas;
  - en la gratis, 0 HOY, 0 «Escuchar», 0 «Cerca de mí» y 0 filtros de baños y fuentes;
  - en la gratis, nunca más de una foto por parada;
  - la tarjeta de la cuenta atrás de RESERVAS, en cada momento y sin fechas;
  - DÍAS se abre en el día de hoy durante el viaje;
  - el panel de pruebas no existe en producción.
- A mano, a 375 px, con el panel de pruebas: gratis y de pago, antes, durante y después; «Escuchar» con [Pausa]; «Cerca de ti»; EXPLORAR en las dos versiones; el mapa de mis viajes (el globo con sus chinchetas y la lista); el álbum del viaje con una foto añadida desde la ficha; «Guarda tus recuerdos» en RUTA (gratis) y en HOY (de pago) después del viaje. Capturas en el informe. Borra al acabar los viajes y las fotos de prueba que crees.

CÓMO TRABAJAR
Lo de siempre: PROGRESO, PREGUNTAS e INFORME de la 6z6 en docs/dias, en palabras sencillas, y commits locales por bloques. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
