# Informe de la Tanda 10B

## 1. El modo noche, acabado
Se había quedado a medias; lo he terminado. La app sale **siempre en claro** (marfil, blanco y oro, como Marca JUTRIP). Al abrir, borra el ajuste de modo noche que alguien tuviera guardado de antes.

- **¿He quitado el código del modo noche?** Sí, todo, y no ha roto nada: el ajuste del almacén, la clase `dark`, todos sus colores de `index.css`, la clave de Tailwind, las variantes `dark:` y los arreglos de noche de la tanda anterior (HOY, EXPLORAR, DÍAS, RESERVAS, ficha de la parada).
- **Lo único oscuro que queda:** la barra de abajo A y la franja «Estás en Roma» de RESERVAS (más piezas pequeñas: pestaña elegida, número del día, reproductor de «Escuchar historia»).
- **Lo que era oscuro y ahora es claro:** el recuadro «33 logros conseguidos» de Logros → Todos mis logros (era un panel de tinta; ahora tarjeta marfil con filo de oro). Las portadas del Pase y las insignias de Logros son arte propio y no se tocan.
- Borradas todas las capturas de noche; rehechas las de día.

## 2. RUTA: iconos y compartir
- Los iconos de la tarjeta del destino, más pequeños (de 38 a 32 px).
- Un icono más: **compartir el viaje**, con el dibujo de siempre. Abre la hoja de invitar que ya existía (Cuentas, parte 3). Sale solo con cuenta y viaje guardado.
- **El círculo negro:** en la app hay dos cosas negras arriba a la derecha. Una era la **pastilla oscura «Compartir viaje»** (solo sale con cuenta y viaje guardado), pegada encima de la tarjeta: **la he quitado**, porque ahora hace lo mismo el icono nuevo. La otra es el **círculo de la cuenta** de la cabecera (abre el perfil: viajes, pases, ajustes). Ese **no lo he quitado**: hace falta. Si era ese el que decías, dime dónde lo quieres (por ejemplo, dentro del icono de «Mis viajes») y lo muevo.
- «Recomendar otra ruta» (para quien mira el viaje de otra persona) sigue donde estaba.

## 3. RUTA: el mapa, solo con los destinos
Con un solo destino, el mapa de RUTA ya no es el de DÍAS: enseña la ciudad y los puntos por donde se llega según el medio elegido (de `_llegada.json`): avión (Fiumicino y Ciampino), tren (Termini y Tiburtina), autobús (estación de autobuses de Tiburtina), ferry (Civitavecchia), coche (solo la ciudad). Sin paradas. El punto que el viajero eligió (su vuelo, su tren…) va resaltado en oro lleno con anillo. Iconos finos en oro. El mapa de DÍAS no se ha tocado. Con varios destinos se queda el mapa de siempre.

## 4. El día de vuelta
- Título **«Hoy vuelves a casa»** y debajo «Roma → Barcelona · Día de viaje» (el de llegada sin paradas sigue como estaba).
- Sin hora de vuelta, tarjeta nueva (con pase y sin él), con tinta y letra de 14,5 px, botones dorado y de borde. «Tu vuelo» cambia: tu vuelo / tu tren / tu autobús / tu ferry / tu hora de salida (coche) / tu vuelo o tu tren (si no se sabe); «aeropuerto» cambia a «estación» o «puerto».
  - Sin pase: «El último día, a la medida de tu vuelo», con «Pase de Roma» y «más de 20 ventajas» en oro; [Ver el Pase de Roma] y [+ Añadir mis lugares].
  - Con pase: «Tu último día, a la medida de tu vuelo»; [+ Vuelo] (o [+ Tren]…) y [+ Añadir mis lugares].
- Con la tarjeta ya no salen debajo la barra de «+ Añadir vuelo» ni «Fin del viaje. Arrivederci, Roma.».
- **El número sale de una lista, no a ojo:** `data/pase/incluye.json`, sacada de «EN EL PASE» de `GRATIS_Y_PASE.md`, una cosa por línea. **Hoy salen 32** (así que el texto dice «más de 20 ventajas»): 5 de «Antes del viaje» (vuelos y horas, orden de los días, zona del alojamiento, cómo llegar al alojamiento, resumen de reservas); 14 de HOY (siguiente parada, cómo llegar, Visto, No me da tiempo, billete, día de llegada y vuelta ajustados, escuchar historia, sobre este lugar, cerca de ti ×3: baños, fuentes y comer, más visitas, avisos del día, aviso de lluvia); 8 de Logros (sellos, 11 colecciones, 12 emblemas secretos, logros de viajero, botón flotante, pantalla de Logros, «Lo de ayer también cuenta», «Guarda un recuerdo»); 5 de Después (resumen del día, resumen del viaje, volver a Roma, ajustar los vuelos del viaje nuevo, ruta del segundo viaje). Con 21 o más dice siempre «más de 20»; con menos, el número exacto. Cuando entren cosas nuevas, se añade una línea y sube solo. Una prueba comprueba que no falta ninguna ✅ del documento.

## 5. «Verme como viajero sin pase»
- Interruptor en `/?admin=logros` → pestaña «Mis pruebas». Apagado por defecto.
- Lo decide **siempre el servidor**: solo los emails de `LOGROS_ADMIN_EMAILS` pueden encenderlo, y solo afecta a su propia cuenta (un `user_id` que mande el móvil se ignora). El móvil solo lee. Encendido: cobro puesto, sin pase, HOY cerrado con la tarjeta del pase, un [Visto] no cuenta, lo de pago cerrado en la app y etiqueta «Sin pase (prueba)» arriba, solo para ti. Apagado: vuelve tu pase. No toca el pase de verdad ni los cobros.
- **Migración nueva: `0030_admin_sin_pase.sql`** (la 0029 queda para la 9B). **Hay que aplicarla a mano** en el SQL editor de Supabase (se puede repetir). Sin ella, la app no se rompe: el interruptor dice que no se ha podido guardar y todo queda como siempre.

## 6. Pruebas
- Motor: 143.647 comprobaciones, 0 fallos. Batería rápida (78 pruebas): 0 fallos (`pruebaFase6y5_motor` agota el tiempo suelta, como siempre, y se corre con `_correr6y5.mjs`).
- `pruebaJutrip` (ya sin noche, con «sin modo noche»): 117, 0 fallos. `pruebaTanda10B` (nueva): 123, 0 fallos. `pruebaLogros1`: 451, 0 fallos (con las pruebas nuevas de «sin pase»: otra cuenta no puede encenderlo, encendido cierra lo de pago, apagado vuelve el pase, los pases no se tocan).
- Pruebas que he cambiado a propósito: `pruebaFase6y7_titulos` (2 comprobaciones: el día de vuelta sin paradas ahora se llama «Hoy vuelves a casa»), `pruebaFase6y7_historias` (ya no hay `oscuro` en «Escuchar»), `pruebaFase6y4_ficha` (ficha sin modo noche), `pruebaJutrip`, `_baseDeDatosPrueba.mjs` y `pruebaLogros1` (llevan la migración 0030). La batería rápida ahora incluye `Tanda10B` y `Jutrip`.
- **Peso al abrir:** 325,3 KB antes de esta limpieza → 325,0 KB sin modo noche → **325,4 KB** con esta tanda (original de la Tanda 10: 322,8 KB). El mapa nuevo y la tarjeta van en el trozo de la ruta, no en el de abrir.

## 7. Qué mirar en el móvil
1. RUTA con avión, tren, autobús y coche (datos de llegada del formulario): los puntos y sus iconos; con el vuelo/tren puesto, el punto elegido resaltado.
2. La tarjeta de Roma en RUTA: iconos más pequeños y el de compartir (con cuenta y viaje guardado).
3. DÍAS → el día de vuelta sin hora: título y tarjeta, con y sin pase.
4. Aplica la migración 0030 y prueba el interruptor en `/?admin=logros` → Mis pruebas: la etiqueta «Sin pase (prueba)» y HOY cerrado.
5. Que no queda nada oscuro de más (menos la barra de abajo y la franja de RESERVAS).

Capturas (390 × 844) en `docs/dias/capturas_jutrip/`: `ruta_mapa_avion|tren|autobus|coche`, `dias_vuelta_con_pase`, `dias_vuelta_sin_pase_prueba`, `reservas_sin_pase_prueba`, y de día: HOY, DÍAS (abierto y cerrado), EXPLORAR, RESERVAS, Logros, Pase y ficha de una parada.

## 10C. Tres arreglos de la 10B

**1. Los tres iconos de la tarjeta del destino (RUTA).** Ahora salen siempre: la bombilla, compartir y la flecha de volver a la ruta de antes.
- **Por qué no salían:** la flecha solo se pintaba si la ruta tenía guardada una «ruta original» (`route.originalRoute`); la ruta de las capturas no la tiene, y la del servidor tampoco siempre. Compartir solo salía con cuenta y viaje guardado (lo puse así en la 10B). La bombilla sale si el destino tiene tips; si no, antes tampoco salía.
- **Ahora:** la flecha sale siempre y va **apagada** si no hay una ruta anterior que recuperar o no hay nada cambiado (como antes). La bombilla sale siempre, apagada si el destino aún no tiene tips. Compartir sale siempre: con cuenta y viaje guardado abre la hoja de invitar; con las cuentas encendidas pero sin cuenta, pide entrar (la pantalla de entrar de siempre); con las cuentas apagadas o el viaje aún sin guardar, lo dice con un aviso corto («Compartir el viaje se activa con las cuentas» / «Estamos guardando tu viaje»). Los tres miden lo mismo (32 px).

**2. El mapa de RUTA cuando no se sabe cómo llega.** Nunca enseña paradas. Siempre: la ciudad y el punto de llegada. Si eligió cómo llega, manda lo elegido; si no, el medio que se deduce de su origen (a 500 km o más: avión → Fiumicino y Ciampino; desde Madrid, sí); si no se puede deducir (sin origen, o tan cerca que podría ir de varias formas), **Roma Termini**, el primer punto del tren en `_llegada.json`, con su icono de tren. (La captura de las paradas numeradas era una captura vieja, de antes de la 10B: la he rehecho.)

**3. HOY sin pase.** La pestaña HOY **ya no desaparece**: la barra lleva siempre las cinco pestañas, también con «Verme como viajero sin pase» (y con `?version=gratis`). Sin pase, HOY enseña lo de antes del viaje («Tu modo Hoy se activa el sábado 17…», lo que tendrás, [Ver mi primer día]) y debajo la tarjeta «Tu día de prueba» con **[Ver el Pase de Roma]**. Si el viaje ya empezó o acabó, dice «Tu modo Hoy es parte del Pase de Roma» con la misma tarjeta (nunca «se activa el…»). Nunca enseña la siguiente parada, [Cómo llegar] ni [Visto].
- **¿Qué más esconde «sin pase» en vez de enseñarlo cerrado?** (solo lo dejo dicho; no lo he tocado):
  1. RESERVAS: el bloque **«Llegada y vuelta»** (y su resumen) desaparece entero. Habría que dejarlo cerrado con su invitación.
  2. La pregunta de la **zona del alojamiento** y [Cómo llegar a tu alojamiento] desaparecen (RESERVAS y DÍAS).
  3. El **billete** de llegada y de vuelta en DÍAS (se queda la barra sin «+ Añadir vuelo» con candado; solo sale la barra normal).
  4. En EXPLORAR, **baños, fuentes y «Cerca de mí»** no salen.
  5. **«+ Más visitas»** de HOY y **«Tus fotos de hoy»** (dentro de HOY, que sin pase ya no se pinta).
  6. Los **avisos de cambio de vuelo** y los avisos de vuelo.
  7. En el presupuesto, las líneas de **ida y vuelta**.
  Sí salen cerrados, con su candado o invitación: [Escuchar historia] y la tarjeta de «Tu último día» (10B).

**Y, de paso (petición tuya en paralelo): la pantalla de inicio.** En ORIGEN / DESTINO, las fotos de los destinos curados que salen bajo DESTINO van ahora **pegadas a la tarjeta de ORIGEN, 8 px por encima** (antes quedaban a 42 px, a una altura fija). Captura: `primera_destinos_pegados_a_origen.jpg`.

**Pruebas.** Batería rápida y `pruebaJutrip` en 0 fallos; `pruebaTanda10B` ampliada (136 comprobaciones: los tres iconos, el aviso de compartir, el mapa sin medio y sin origen, HOY y la barra sin pase). Pruebas viejas cambiadas a propósito (decidían que sin pase no había HOY): `pruebaTanda6z6a` (barra y HOY: ahora cinco pestañas y la invitación al pase), `pruebaTanda6z3` (igual), `pruebaTanda6z6c` («Escuchar» no sale como botón; la lista de lo que tendrás sí lo nombra).
Capturas: `ruta_tarjeta_tres_iconos`, `ruta_mapa_sin_medio_madrid`, `ruta_mapa_sin_medio_ni_origen`, `hoy_sin_pase_antes_del_viaje` (y `_abajo`), `hoy_sin_pase_despues_del_viaje`.

Pruebas viejas cambiadas además a propósito en la 10C: `pruebaCorr6z6_perfil` (la bombilla sale siempre, apagada sin tips), `pruebaTanda6z5` (el botón [No me da tiempo] no sale sin pase; la lista de lo que tendrás sí lo nombra), `pruebaFase6y7_historias` (HOY sin pase enseña la invitación al pase). Peso al abrir: 325,4 KB (10B) → 326,4 KB (la lista de HOY sin pase, el aviso y los tres iconos van en el trozo de abrir). Motor: sin tocar.

## 10D. HOY antes del viaje, como el diseño

HOY antes del viaje (sin pase, y también con pase) es ahora la pantalla del diseño **App · HOY 1a (con fechas) y 1b (sin fechas)**, la que ya tenía `HoyAntesV2`:
- Arriba: «Tu modo Hoy se activa el sáb 17 oct» con la cuenta atrás grande («16 días»); sin fechas, «Tu modo Hoy se activa el primer día de tu viaje» con [Pon tus fechas].
- Debajo: el panel «🔒 PASE DE ROMA · Durante el viaje, **Hoy te dará**» con sus seis cuadros (Siguiente parada, Escuchar su historia, Tu día paso a paso, Cerca de ti, Avisos del día, Fotos del viaje) y «Logros y sellos» con bronce, plata y oro, y [Ver el Pase de Roma]. Los textos son los del diseño (se cambiarán cuando llegue el compañero de HOY).
- **Sin pase**, debajo de todo eso, la tarjeta del día de prueba («Tienes un día de prueba con HOY, gratis. Con el Pase de Roma, te acompaña todo el viaje.»), en lugar de la lista sencilla «Ese día tendrás».
- **Con pase**: lo mismo sin el candado «Pase de Roma» ni [Ver el Pase de Roma] (el estado «con pase» de `HoyAntesV2`). La HOY de producción antes del viaje ya no es la lista sencilla.
- **Colores de Marca JUTRIP:** los paneles, en tinta `#1C2230` (se acabó el azul y el morado de los fondos); el azul claro en cursiva del diseño («sáb 17 oct», «días», «el primer día de tu viaje»), en oro pálido `#E9C77A`; «Hoy te dará», en oro como antes. Esto cambia también el HOY v2 (flag `?hoy2=on`), que usa la misma pieza.
- Una cosa a tener en cuenta: la tarjeta «Logros y sellos» solo sale con los logros encendidos (`logrosActivos()`, como ya hacía `HoyAntesV2`). En producción están apagados, así que ahí no sale hasta que se enciendan.
- Después de empezar el viaje, sin pase, sigue como en la 10C («Tu modo Hoy es parte del Pase de Roma»).

Pruebas: batería rápida y `pruebaJutrip` en 0 fallos; `pruebaTanda10B` ampliada (141). Cambiadas a propósito `pruebaTanda6z3`, `pruebaTanda6z6a` y `pruebaTanda6z6c` (HOY antes del viaje ya no es «Ese día tendrás… [Ver mi primer día]» sino la pantalla del diseño). Capturas: `hoy_antes_sin_pase_con_fechas`, `hoy_antes_sin_pase_sin_fechas`, `hoy_antes_con_pase_con_fechas` y `hoy_antes_con_pase_sin_fechas` (cada una con su `_abajo`).

## 10F. Eliminar un viaje desde el Perfil

**Lo que ve el viajero.** En Perfil → Mis viajes sale [Editar] al lado del título (en el Perfil de siempre y en el que tiene logros). Al tocarlo pasa a [Hecho] y cada viaje enseña a su derecha una papelera (en el de otra persona, «Salir»). La papelera abre una **hoja de abajo** (la `Hoja` de siempre, no una ventana del navegador): «¿Eliminar tu viaje a Roma?» con sus fechas; **Se borra** (la ruta, los días, las reservas que has apuntado y las fotos de ese viaje; con fotos, «Tienes 155 fotos en este viaje» y [Guardar en mi galería]); **Se queda** (tus logros, sellos y EXP y tu Pase del destino: se paga por destino, no por viaje); [Eliminar viaje] en el rojo de los avisos y [Cancelar]. Se avisa y nunca se niega: «Es el viaje que tienes abierto», «Estás de viaje ahora mismo» y, si lo creó esta persona y es compartido, «También desaparece para Ana y Luis». Quien está invitada ve [Salir de este viaje] (solo se quita ella, y sus fotos de ese viaje).
Al confirmar, el viaje se va de la lista, sale **«Viaje eliminado» con [Deshacer] 8 segundos** y pasado el plazo se borra de verdad. Si era el viaje abierto, la app abre el siguiente guardado (los próximos antes que los hechos) y cierra el Perfil; si no queda ninguno, la primera pantalla. [Deshacer] lo devuelve entero (también el abierto), sin haber tocado la nube. Si la nube falla al borrar, el viaje vuelve a la lista y se dice. Si la app se cierra durante los 8 segundos, **el viaje se borra al volver a abrirla** (la persona ya dijo que lo quería eliminar): al confirmar se apunta en el dispositivo lo que hay que borrar (`jutrip:eliminar-pendiente`) y TripSync lo remata antes de cargar la lista de viajes, para que ni salga ni se abra solo.
[Guardar en mi galería] baja todas las fotos del viaje (una sola hoja de compartir donde el navegador deja; si no, una a una). Hasta ahora existía solo para una foto (`guardarEnMiGaleria`): la de todas es nueva, hecha con el mismo camino.

**Qué se borra y qué se queda en Supabase** (comprobado con las migraciones reales en una base de pruebas, `scripts/destino/pruebaTanda10F.mjs`):
- **Se borra con la fila del viaje** (`on delete cascade`): `trip_members`, `trip_invitations`, `trip_recommendations`, `stop_visits` y `logro_avisos`.
- **Se queda** (`on delete set null`: solo pierde la referencia al viaje): `passes` (el Pase), `achievements` y `logro_hechos` (logros, sellos y EXP) y `hoy_prueba`. Comprobado: tras eliminar, el Pase de Roma, el logro y el hecho siguen, con `trip_id` a null.
- **Las fotos NO cuelgan de la fila** (`trip_photos.trip_id` es el id de la ruta, texto, sin clave ajena): no se borraban solas ni sus filas ni sus archivos. Ahora la app borra, ANTES que el viaje y solo si sale bien: los archivos de Storage (la grande y la pequeña de cada foto) y las filas de `trip_photos` (con su `trip_photo_meta` en cascada). Si falla el almacén no se toca nada y se avisa; nunca queda una foto sin viaje ni un viaje a medias. Probado: ni en la tabla ni en Storage queda nada, y las fotos de otro viaje de la misma persona siguen.
- **¿Hace falta la 0031? No para que funcione; sí para el caso de un viaje compartido.** Las fotos de OTRAS personas (los invitados) solo las puede borrar su dueña (reglas de Storage). La **0031** (`supabase/migrations/0031_eliminar_viaje.sql`, la 0029 sigue guardada para la 9B) añade `fotos_por_borrar` y un disparador en `trips`: al borrar un viaje apunta los archivos de todas las personas y borra sus filas; cada persona, al abrir la app, quita sus archivos. **La tiene que aplicar Eric a mano** en el SQL editor de Supabase. Hasta entonces la app funciona igual; lo único que se queda son las fotos de los invitados de un viaje compartido que borró su administrador (probado también SIN la 0031). Con ella, probado: las filas se van, los archivos quedan apuntados, solo su dueña puede vaciarlos y al hacerlo no queda ninguno en Storage.
- Un invitado NO puede borrar el viaje de otra persona (las reglas de seguridad lo impiden; probado) y [Salir de este viaje] no lo borra para quien lo creó.

**La pantalla antigua** (`MyTripsScreen` + `TripCard`): no sobraba (TripSync aterriza en ella cuando hay viajes guardados y ninguno es de hoy), así que usa **la misma hoja y el mismo camino** (`useEliminarViaje`): su confirmación propia se quitó y `deleteTrip` ya solo lo llama la nube de la 10F.

**Pruebas:** `pruebaTanda10F`, 88 comprobaciones, 0 fallos (eliminar uno cerrado, el abierto —abre el siguiente—, el único —va a la primera pantalla—, [Deshacer] en los tres, la nube que falla, el pase y los logros que siguen, las fotos que ya no están en la tabla ni en Storage, el invitado con [Salir de este viaje], el viaje compartido, el borrado al volver a abrir la app tras un cierre durante el plazo, y que no hay ninguna ventana del navegador). La batería rápida y `pruebaJutrip`: ver más abajo. Capturas en `docs/dias/capturas_jutrip/`: `10f_1_mis_viajes_con_editar`, `10f_2_modo_editar`, `10f_3_hoja_con_fotos`, `10f_4_hoja_viaje_compartido`, `10f_5_hoja_invitada_salir`, `10f_6_aviso_viaje_eliminado_con_deshacer` y `10f_7_hoja_viaje_abierto_y_ahora` (sin fotos y con los dos avisos).
Ayudante nuevo para probar: `_ayuda10F.mjs` (abre la app con cuatro viajes guardados y una nube de mentira). En desarrollo, `window.__fotosPrueba` pone las cifras de fotos sin servidor.

## 10G. La apertura, la sesión abierta, el primer paso de crear el viaje y la versión gratis

Prompt guardado tal cual en `docs/dias/PROMPT_TANDA10G.md`. No se ha tocado el motor de rutas. Prueba nueva: `scripts/destino/pruebaTanda10G.mjs` (74 comprobaciones, 0 fallos). Capturas en `docs/dias/capturas_jutrip/` (`10g_*` y `gratis_*`) y la página `docs/dias/GRATIS_REVISION.html` (15 capturas dentro del propio archivo, para verla en el móvil).

### 1. La apertura
- **Sale en cada apertura** (navegador, icono de la pantalla de inicio, otro día): fuera la condición de `sessionStorage` de `index.html`. La única excepción es la recarga que hace la propia app justo después de entrar en la cuenta o de unirse a un viaje (`recargarSinApertura()` deja una marca que `index.html` lee una vez, quita y borra; la usan `cuentas.ts`, `PuertaDeCuenta` y `AjustesScreen`). La siguiente apertura sale otra vez.
- **Dura 3,5 segundos** y se ve **entera**: el logo, el lema letra a letra (ahora del 20 % al 76 % de la animación, para que quepa) y la línea nueva **«TU APP DE VIAJES»**, más pequeña, en mayúsculas espaciadas y en el oro profundo (#A67C52), que entra después del lema (del 80 % al 94 %). No hizo falta acelerar nada más.
- **No se corta nunca.** Antes, `main.tsx` la quitaba a los 3 s desde que se abría la página (`3000 - performance.now()`): si la animación empezaba tarde se quedaba a medias. Ahora se quita cuando **acaba la animación de la línea nueva** (`animationend` de `[data-fin]`), que cuenta desde que empieza de verdad; y **fuera el toque que la saltaba**. Con las animaciones reducidas: quieta, con el logo, el lema y la línea nueva, 1,5 s.
- Capturas: `10g_apertura_1_logo`, `_2_lema_escribiendose`, `_3_lema_entero` y `_4_final_con_tu_app_de_viajes` (se para la animación en cada instante, así nunca salen en blanco; la captura comprueba que la apertura está puesta).

### 2. La sesión abierta · por qué pedía entrar cada vez
**Lo que he visto en el código** (no he podido verlo en el iPhone de Eric: lo que depende del móvil es lo que sé del navegador, no una medición):
1. **Lo de la app estaba bien**: el cliente de Supabase guardaba la sesión en el móvil y la renovaba sola (valores por defecto). Ahora lo dice explícito (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`) y pide al navegador que no borre lo guardado (`navigator.storage.persist()`).
2. **Causa principal: el enlace del email se abre en OTRO navegador.** La pantalla de entrar manda un enlace mágico. Si el enlace se abre dentro de la app de Gmail, o en Safari mientras Eric usa la app instalada en la pantalla de inicio, la sesión se crea **allí**: el navegador (o la app instalada) desde donde se pidió el enlace sigue sin sesión de verdad y la app vuelve a enseñar la pantalla de entrar. En el iPhone, la app instalada y Safari **no comparten** lo guardado.
3. **Con la sesión anónima** (la de «Guarda tus viajes»), mientras el enlace no se confirme **en ese mismo navegador**, la sesión sigue siendo anónima y la puerta pide entrar. Y aunque el enlace se confirmase en otro sitio, esta sesión no se enteraba hasta renovarse.
4. **Safari borra los datos de una web que no se usa en 7 días** (la protección contra el rastreo de Apple). En una pestaña de Safari (no instalada) eso borra la sesión. La app instalada en la pantalla de inicio no tiene ese límite.
5. **Google** entra bien (vuelve a la misma dirección); dentro del navegador de otra app vale lo mismo que el punto 2.
6. **Lo que NO era**: la app no cierra la sesión sola (solo con [Cerrar sesión] o al borrar la cuenta), y la sesión no caduca por el código.

**Lo que he arreglado en la app**
- **Entrar con el código del email**: en «Te hemos enviado un enlace…» hay ahora «¿Se ha abierto el enlace en otro navegador? Escribe aquí el código de números del email» y [Entrar]. La sesión queda donde se escribe el código (en la propia app instalada). Vale para cuenta nueva o ya existente y para el cambio de email de la sesión anónima (`verifyOtp`).
- **Al volver a la app con la sesión anónima**, se renueva sola (`visibilitychange` y `focus`): si el enlace se confirmó en otro navegador, la app se entera al volver.
- **Al abrir la app con sesión: «solo la apertura y después, directamente, tu último viaje»**, siempre en **RUTA**; si hoy es un día del viaje, en **HOY**; aunque antes estuvieras en otra pestaña (`src/lib/dondeAbrir.ts`, probada). «Mis viajes» ya no es lo primero que se ve: se abre desde el Perfil. La pantalla de entrar solo sale sin sesión o tras [Cerrar sesión].

**Lo que tiene que hacer Eric (y no puedo hacer yo)**, en el panel de Supabase del proyecto:
1. **Authentication → Emails (Email Templates)**: en las plantillas **Magic Link**, **Confirm signup** y **Change Email Address**, añadir una línea con el código: `Tu código: {{ .Token }}`. Sin eso el email lleva solo el enlace y la casilla del código no sirve de nada.
2. **Authentication → Sessions**: «Time-box user sessions» e «Inactivity timeout» tienen que estar **apagados** (sin límite). Si hubiera uno, la sesión se cerraría sola aunque la app esté bien. (Es un ajuste del plan Pro; si no aparece, no hay límite.)
3. **Authentication → URL Configuration**: la «Site URL» y las «Redirect URLs» deben ser la dirección de producción de la app (la misma a la que se vuelve del enlace).
4. **En el iPhone**: usar la app **instalada en la pantalla de inicio** (no una pestaña de Safari) para no perder la sesión a los 7 días sin abrirla; y, la primera vez, entrar con el **código** del email en vez de tocar el enlace (así la sesión queda en la app instalada).

### 3. El primer paso de Crear el viaje
- **La tarjeta del destino con su foto**: sale de los datos del destino. `data/dias/<destino>/_mapa.json` lleva `portada` y `portada_pequena` (en Roma, el Coliseo); `server/destinosCurados.js` las pasa en `/api/destinos-curados` y `PrimeraPantalla` las pinta. Un destino nuevo trae la suya con solo ponerla en su `_mapa.json`; sin foto, las rayas de siempre.
- **Los transportes, en la MISMA pantalla**: al tocar [Trazar ruta] el mapa se queda y dibuja la línea de origen a destino; la tarjeta de abajo (Origen, Destino y [Trazar ruta]) desaparece y, en su sitio, con la misma tarjeta, salen la distancia y los transportes con su tiempo; arriba, «Conectando *Barcelona* con *Roma*» con los nombres en oro (al acabar el cálculo pasa a «¿Cómo quieres llegar a Roma?», como la pantalla antigua). [Cambiar ruta] vuelve a elegir origen y destino. Lo demás del paso, igual (elegir el transporte y seguir al paso 3). `StepTransport` tiene ahora un modo `tarjeta`; la pantalla antigua «02 — Calculando ruta…» ya no existe como pantalla aparte. Design no tiene pieza para esto: está hecho con la tarjeta del paso 1 y la lista de transportes de la pantalla antigua, con los colores de Marca JUTRIP.
- Capturas: `10g_paso1_tarjeta_de_roma_con_foto`, `10g_paso1_barcelona_roma`, `10g_paso1_trazando` y `10g_paso1_despues_de_trazar_con_transportes`.

### 4. La versión gratis: lo de pago, cerrado y a la vista
- **Una sola pieza de «cerrado»** (`src/components/pase/Candado.tsx`): gris, con un candado dorado sobre marfil y una línea corta con lo que ganarías; al tocarla se abre **`abrirPase()`** (`src/lib/pago.ts`), **la única función para abrir el pase** (la hoja de compra «¿Cuántos sois?»). La usan todos los candados, la pastilla de RUTA, las tarjetas cerradas de EXPLORAR y todos los [Ver el Pase de Roma] (`pedirPago` es el mismo nombre de antes). Cuando llegue la película del pase, solo hay que cambiar esa función. La variante de tarjeta grande existe pero hoy no se usa: todo va con la línea (como mucho una invitación grande por pantalla).
- **Guardar el viaje es gratis; que la app lo use para ajustar tu ruta, del pase:**
  - **RESERVAS, «Llegada y vuelta»: abierto y gratis** (la hora, la referencia, la compañía); el resumen vuelve a **«0 de 3 listo»**; debajo del vuelo guardado, el candado «Con el pase, ajustamos tu primer y tu último día a tu vuelo» (sustituye a la tarjeta P1).
  - **DÍAS:** la barra «Llegada · desde Madrid» con [+ Vuelo] abierta (guarda el vuelo, igual que en RESERVAS), la pastilla «✓ 15:40» y el billete de llegada y de vuelta visibles con lo guardado; el día **no se ajusta** (el motor no recibe las horas en la gratis) y sale el candado «Con el pase, tu día se ajusta a la hora de tu vuelo». La ficha de llegada también deja guardar el vuelo.
  - **El alojamiento:** guardarlo en RESERVAS, gratis (como antes); la zona («¿En qué zona te alojas?») y [Cómo llegar a tu alojamiento] salen cerradas, con «Con el pase, cada día empieza cerca de donde duermes» (en RESERVAS y en DÍAS).
  - **El presupuesto:** las líneas de ida y vuelta, gratis (ya salían con los datos del viajero; no se tocó nada).
  - **Los avisos de la campana cuando una reserva no cuadra con el vuelo**, y el de «Revisa tu vuelta» al cambiar las fechas: **gratis** (`useAvisosDeVuelo`, `useAppNotices` y `datosParaMotor` con `paraAvisos`). En la gratis solo se manda al servidor lo de los avisos; los días no se ajustan.
  - «Viaje listo» (el «!» de Reservas y el %) cuenta ahora también el vuelo y el alojamiento en la gratis.
- **Lo que hoy desaparecía sin pase y ahora sale cerrado:** EXPLORAR, **Baños y Fuentes** (tarjetas en gris con su candado) y **«Cerca de ti»** (el orden por cercanía, como candado); la zona del alojamiento y [Cómo llegar a tu alojamiento].
- **Lo que es gratis:** el Perfil y «¿Dónde has estado ya?», el resumen de RESERVAS, guardar el vuelo o tren, el alojamiento y las entradas, la ruta, los días, el mapa, las fichas, quitar/mover/añadir paradas, EXPLORAR, las entradas, el Free Tour, las excursiones, buscar alojamiento, el presupuesto y la historia del Coliseo, como muestra. **Lo que es del pase y ya salía cerrado:** HOY, [Escuchar historia] y la tarjeta del día de vuelta.
- **RUTA, la pastilla del pase** en la tarjeta de cada destino (P0c y P0d de «Pase Incluye»): sin pase, «Pase de Roma» con el candado sobre marfil; con pase, con el ✓ sobre oro; al tocarla, `abrirPase()`. El nombre sale del tramo del viaje («Pase de Florencia»…). La tarjeta del destino crece algo para que quepa debajo.
- **Logros sin pase:** la vitrina y las colecciones se ven cerradas (en gris; al tocarlas se abre el pase), con «Con el Pase de Roma, cada sitio que ves suma». [Visto] no cuenta sin pase salvo el día de prueba: eso ya lo decidía el servidor (`puedeGanarLogros`); no hace falta tocar nada.
- **HOY antes del viaje:** el [Ver el Pase de Roma] repetido de la tarjeta del día de prueba, fuera; se queda el del panel. (Durante y después del viaje, ese botón sigue siendo el único.)
- **¿Choca con el motor?** No: en la gratis, `datosParaMotor` devuelve `{}` salvo para los avisos; guardar el vuelo no mueve el día solo.
- Página para revisarlo: `docs/dias/GRATIS_REVISION.html`.

### 5. Pruebas
- `pruebaTanda10G`: 74 comprobaciones, 0 fallos (la apertura sale en cada apertura y no dos veces seguidas tras entrar; no se quita antes de acabar y un toque no la corta; el paso 1: foto, línea, título y transportes; el vuelo se guarda gratis en RESERVAS y en DÍAS, «0 de 3», el día no se ajusta y sale el candado; la zona del alojamiento, Baños y Fuentes, «Cerca de ti» y Logros salen cerrados y al tocarlos se abre el pase; con pase, ningún candado; una sola función para abrir el pase).
- **Pruebas viejas que he tenido que cambiar** (decían lo contrario de lo que ahora pide Eric; no las he aflojado): `pruebaTanda6t` y `pruebaTanda6v` (la barra y «Llegada y vuelta» ya no son solo de pago), `pruebaTanda6s`, `pruebaTanda6z6a` y `pruebaCorr6z6_reservas` (la gratis lleva tres fichas y «x de 3 listo»), `pruebaTanda6z6c` (EXPLORAR gratis enseña lo cerrado), `pruebaFase6y4_presupuesto` (el candado de la zona), `pruebaCuentas3` (el candado sustituye a la tarjeta P1), `pruebaTanda10B` (un solo [Ver el Pase de Roma] antes del viaje; «Reservas!» puede llevar su «!») y `pruebaJutrip` (3,5 s, sin toque y la marca de la recarga).
- **No probado:** la sesión en el iPhone real (lo de los puntos 2 a 4 de «Lo que he visto en el código») y la entrada con el código del email contra Supabase de verdad (la prueba cubre la validación del código y el cableado, no el envío del correo).
