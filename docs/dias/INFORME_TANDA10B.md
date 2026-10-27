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

## 10H. [Escuchar historia] sin pase, el nombre del pase y el día de prueba

**Qué se ha hecho**
1. **[Escuchar historia] sin pase** (`Escuchar.tsx`): el mismo botón de siempre (la barra oscura de la ficha y el botón pequeño de la tarjeta de la parada) con el candado dorado en el extremo derecho, dentro del botón, sobre marfil. Fuera «Con la versión completa». Al tocarlo dice «Incluido con el Pase de Roma» y llama a `abrirPase()`. La historia del Coliseo (`libre`) sigue abierta.
2. **El nombre del pase, del dato** (`src/lib/nombrePase.ts`): «Pase de {Destino}» sale siempre de `nombreDelPase(destino)`. No queda ningún «Pase de Roma» escrito a mano en el código (la prueba lo busca; los que hay son comentarios).
3. **En oro, una sola pieza** (`src/components/pase/Marca.tsx`, `<Marca>`): «HOY» y «Pase de {Destino}» van en oro en todas las frases (`TextoConPase` reparte cualquier frase y usa `Marca`): texto pequeño `#6F4E37`, títulos de 18 px o más `#A67C52`, sobre paneles oscuros `#E9C77A`. También en los textos del día de prueba, el candado, la pastilla y el botón de «Incluido con…».
4. **El día de prueba en HOY sin pase** (`src/lib/diaDePrueba.ts`, `filaDeHoySinPase`, pura): decide qué fila de la tabla toca. La usan las tres rutas de HOY (la simulación «gratis», el día de prueba real en `HoyView` y el cobro real en `HoyV2`/`HoyDuranteV2`), así que el texto es el mismo en todas. El día de prueba (00:00–23:59 del destino) abre HOY entero con la franja «Hoy es tu día de prueba…» (`fijarDiaDePrueba` en `pago.ts`).

**La tabla, fila a fila** (todas con prueba y captura `docs/dias/capturas_jutrip/h10_*.jpg`, también en `GRATIS_REVISION.html`): más de 5 días antes (nada de la prueba) · desde 5 días antes con la prueba otro día · con la prueba el primer día · antes con la prueba usada en otro viaje (solo cuenta atrás) · mañana es la prueba · el día de la prueba (franja + HOY entero) · después de la prueba (+ [Ver el Pase de Roma]) · durante con la prueba usada en otro viaje («Tu modo Hoy es parte del Pase de Roma.») · después del viaje (nada de la prueba; ya no sale «Tienes un día de prueba») · sin fechas («Pon tus fechas»).

**Casos que no salían así (arreglados)**: después del viaje se hablaba de la prueba; antes del viaje se hablaba de ella a más de 5 días y con la prueba ya gastada; con la prueba ya usada en otro viaje salía igualmente la tarjeta del día de prueba.

**⚠ Lo que hay que decidir: «lo que veas el sábado también suma a tus logros» NO es verdad.** En el servidor (`server/logros/servicio.js`, `visto`), sin acceso un [Visto] **no guarda nada**. Lo único que suma después de comprar es «Lo de ayer también cuenta»: las **fotos** de la galería subidas cuando ya hay pase. Por eso el texto dice ahora: «Y si luego te quedas con el pase, **las fotos que hagas** el sábado también suman a tus logros.» (una sola constante, `FRASE_QUE_SUMA`, en `diaDePrueba.ts`). Si Eric quiere que sume lo que se VE, hay que cambiar el servidor para que guarde el [Visto] del día de prueba (y entonces se vuelve a poner el texto original).

**Decisiones mías donde la tabla no decía** (fáciles de cambiar en `diaDePrueba.ts`)
- Fila extra `prueba_mas_adelante`: durante el viaje, si la prueba es otro día más adelante (no mañana): «Tu día de prueba con HOY es el miércoles 28: gratis y completo.»
- Después de la prueba: «ayer» solo si fue ayer; si no, «¿Qué tal el sábado con HOY?… Lo que conseguiste ese día ya es tuyo.»
- «Mañana es tu día de prueba» sale cualquier día del viaje en que mañana sea el de la prueba, no solo el de llegada.
- Para distinguir «prueba usada en otro viaje» hace falta el id del viaje: sin sesión (`?cuentas=off`) no se distingue y se toma como de este viaje.

**Pruebas**: `pruebaTanda10H.mjs` (50 comprobaciones, 0 fallos: el botón cerrado con el candado dentro y a la derecha, el texto «Incluido con…», `abrirPase`, sin «Pase de Roma» a mano, los tres oros, las 10 filas en la función y en la pantalla, y otro destino «París»); la batería rápida y `pruebaJutrip` (resultado en el cierre del commit).
**No probado**: la pregunta de las 12:00 y el gasto de la prueba contra el servidor real con una cuenta (no se ha tocado: solo se ha cambiado cómo se cuenta en pantalla); el audio de la historia en un aparato con voz.

**10H, cierre del punto de las fotos (Eric: «déjalo en fotos»).** La frase de «desde 5 días antes, la prueba otro día» queda tal cual: «Te regalamos un día con HOY para que lo pruebes: el domingo 26, gratis y completo. Y si luego te quedas con el pase, las fotos que hagas el sábado también suman a tus logros.» (los días salen de los datos). **Comprobado que es verdad** en `pruebaLogros1` (caso `foto_del_sabado`): un día que no es el de la prueba, sin pase, la foto de la galería no suma; con el pase comprado después, la misma foto subida al día siguiente suma y da el emblema («Lo de ayer también cuenta»). El servidor no mira cuándo se compró el pase, solo que lo haya al subir la foto.

## 10I. La película del pase

**Duración:** la película entera dura **2 min 52 s** (171,6 s medidos de principio a final; la suma de las escenas de Design es 169,6 s más las entradas). Vídeo grabado, sin pase, a tamaño de móvil: `docs/dias/capturas_jutrip/pelicula_del_pase.webm` (17 MB; también en `GRATIS_REVISION.html`, apartado «La película del pase»).

**Qué se ha hecho**
1. **Design al día:** `docs/diseno/proyecto/` actualizado con el zip nuevo (solo lo que cambia: 10 ficheros, sin `uploads/`). El zip se llamaba «Trazo App_ diseño de rutas personalizadas.zip» (el nombre del prompt no existía).
2. **La película, tal cual Design:** las 6 escenas y el final, con sus animaciones, tiempos, títulos y subtítulos, el botón [Saltar] y la barra de arriba. No se ha reescrito ningún texto: `scripts/destino/generarPelicula.mjs` trocea los archivos de Design (con el mismo analizador de HTML que su runtime) y genera `src/components/pase/pelicula/gen/`. Además se traen las 12 piezas que importa (Eiffel, globo, marco de nivel, escena 4b…). La prueba comprueba que cada texto de la película está en el archivo de Design.
3. **Nada de fuera mientras se ve:** el mapa del mundo (`world-atlas`) está calculado dentro de la app (`mapas.ts`), las letras (Geist, Geist Mono, Instrument Serif, Italiana; licencia OFL) en `src/assets/fonts` y las imágenes (marcos de nivel y huecos) en `public/pelicula/assets` (se bajan al abrirla, mientras se ven las primeras escenas). La prueba mira que no salga ninguna petición fuera de la app (solo guardar en la cuenta que ya la vio) ni imagen rota.
4. **Cuándo sale:** `abrirPase()` abre la película (PeliculaHost), ya no la hoja de compra. La primera vez, entera; después, directa al final. Se guarda en la cuenta (datos de la persona en Supabase) y siempre en el móvil. [Saltar] va al final; el ✕ del final cierra y vuelve a donde se estaba.
5. **El final y «¿Cuántos sois?»:** sin pase, «Se paga una vez y no caduca», [Elegir mi pase] y [Ver todo lo que incluye]; con pase, «✓ Tu Pase de Roma está activo», [Verla otra vez] (la película entera) y [Ver todo lo que incluye], sin precio y sin hoja de compra. La hoja «¿Cuántos sois?» es la de Design y **sustituye a HojaDeCompra** (borrada); los precios salen de `data/pase/precios.json` (vía el servidor): 1 persona 6,99 €; Dúo 10,99 € (tachado 13,98 €, ahorras 2,99 €); Grupo con 4: 19,96 € (tachado 27,96 €, ahorras 8,00 €). [Comprar] crea el pago como antes. Se mantiene la línea legal de antes de [Comprar] (`data/pase/textos.json`).
6. **Una lista sola:** la lista del final de la película se saca a `src/lib/listaDelPase.ts` (generada); el final, «Todo lo que incluye» (ahora con el nombre y la línea de cada fila) y «Con el pase tendrás» de HOY salen de ella (HOY: las 5 filas que le corresponden, con sus iconos, por `listaDeHoy.ts`).
7. **Un solo destino de película:** solo cambian «Pase de {Destino}» (final, hoja y «✓ Tu Pase de … está activo») y «TU VIAJE A {DESTINO}» (escena 6); el resto sigue siendo el ejemplo de Roma.

**Lo que no se ha montado igual que Design (y por qué)**
- Se quita lo que Design pone fuera del móvil (el botón «Repetir animación») y el marco redondeado con sombra: la película ocupa la pantalla (el móvil de 390 × 844 se escala para caber).
- **El ✕ de cerrar es añadido** (Design no lo tenía): en el final sustituye a [Saltar]. La línea legal también es añadida.
- «Todo lo que incluye»: en Design eran frases viejas («Tu ruta se ajusta a la hora de tu vuelo»…); ahora es la lista del final, como pedía el prompt.
- Rendimiento: Design repinta toda la película 16 veces por segundo solo para mover la barra de arriba; aquí solo se repinta cuando la barra cambia de verdad (≈2 por segundo). El dibujo es el mismo. El oro de las palabras va en cada palabra/letra (color, no fondo recortado), como pide el prompt; no he podido probar en un Android real (solo Chrome sin ventana en el ordenador).
- Peso: la película es un trozo aparte que se baja al abrirla (303 KB comprimidos, del que el mapa de los países pesa lo más) más 2,3 MB de imágenes; lo que se descarga al abrir la app no cambia.
- El vídeo se graba con capturas WebP (≈8 por segundo) en un contenedor WebM hecho a mano; el movimiento en el vídeo es menos fluido que en la app.

**Pruebas:** `pruebaTanda10I.mjs` (91 comprobaciones: abrir entera y luego directa al final, [Saltar], precios de 1, 2 y 4 personas, con pase, otro destino, nada de fuera, misma lista) + batería rápida y `pruebaJutrip`. Pruebas viejas actualizadas porque comprobaban la hoja de compra o los nombres viejos de HOY: ver el resultado de la batería abajo.

## 10J. Empezar de cero

**Qué es:** en `/?admin=logros` → Mis pruebas, justo debajo de «Verme como viajero sin pase», el botón **[Empezar de cero]**. Solo existe si el servidor dice que la cuenta es de `LOGROS_ADMIN_EMAILS` (`GET /api/admin/empezar-de-cero/puede`). Al tocarlo sale «Se borrará todo lo de tu cuenta: viajes, reservas, fotos, logros, experiencia, el día de prueba y los pases. La cuenta se queda. ¿Seguro?» con [Sí, empezar de cero] y [Cancelar]. Al confirmar: el servidor borra (`POST /api/admin/empezar-de-cero`), el móvil se limpia, se cierra la sesión y se vuelve a la raíz recargando, con la apertura como la primera vez.

**Lo que borra** (siempre con `columna = uid` de la sesión, en UNA transacción: la función `public.empezar_de_cero(uid)` de la migración 0032; un `user_id` en el cuerpo se ignora)
- Viajes (`trips`), con sus reservas, entradas, vuelos y alojamientos, que viven dentro de la fila del viaje.
- Fotos: `trip_photos` y `trip_photo_meta`, y los archivos del bucket `fotos-viaje` (los borra el servidor después de la transacción).
- Vistos (`stop_visits`), hechos de los logros (`logro_hechos`), logros ganados (`achievements`: sellos, colecciones, emblemas), avisos de logros (`logro_avisos`), perfil de logros (`logro_perfil`: EXP, nivel, marco, vitrina, países previos), suscripción a los avisos (`push_suscripciones`).
- Día de prueba (`hoy_prueba`: vuelve a estar sin usar).
- Pases: `passes` que compró (con sus plazas, `pass_members`) y su sitio en los pases de otros.
- Invitaciones de viaje que creó (`trip_invitations`), recomendaciones que escribió (`trip_recommendations`), su sitio en viajes ajenos (`trip_members`), sus invitaciones a amigos como invitadora (`logro_referidos.invitador_id`).
- Campanita (`avisos`), «avísame cuando llegue» (`avisos_destino`), «me gusta» (`place_likes`), el interruptor «sin pase» (`admin_sin_pase`), restos de fotos por borrar (`fotos_por_borrar`).
- Datos de la persona en Supabase: la marca `user_metadata.pelicula_pase_vista` (servidor con `updateUserById` y, de refuerzo, el cliente con `updateUser` antes de cerrar sesión; el resto de datos de la persona no se toca).
- En el móvil: todo `localStorage`, `sessionStorage` e IndexedDB de la app, incluida `trazo:pelicula-pase-vista`. Se conservan solo los cuatro interruptores de la app (`trazo:cuentas`, `trazo:logros`, `trazo:civitatis`, `trazo:version`), que no son datos de la persona: sin ellos la app de desarrollo no arrancaría igual. Los stores en memoria desaparecen con la recarga.

**Lo que NO borra**
- La cuenta de auth y su ficha `travelers` (nombre, email, foto del perfil `perfiles/…`, zona), ni `invitaciones_app` (su enlace para invitar).
- `logro_referidos` donde ella es la INVITADA (es el registro de quien la invitó).
- Stripe: ni una llamada, y `pagos_registro` (el registro de cobros, que no cuelga de ninguna cuenta) queda igual.
- Nada de otra cuenta. Lo compartido pasa a los demás con la misma regla que al borrar una cuenta (`preparar_borrado`, 0021): un viaje con invitados pasa a ser del invitado que entró primero (con su ruta y las fotos de los demás intactas); un pase con otras personas se queda con ellas. Único efecto fuera de la cuenta: si usaba el pase de OTRA persona, a esa persona le baja una plaza (igual que ya pasa al borrar una cuenta).

**Cómo se probó** (`scripts/destino/pruebaTanda10J.mjs`, 170 comprobaciones, 0 fallos; `pruebaLogros1` sigue en 453/0)
- Base de datos real (PGlite con TODAS las migraciones, 0032 incluida): una cuenta con datos en las 21 tablas del inventario queda en 0 en cada una; otra cuenta con datos queda IDÉNTICA (se compara toda la base de datos fuera de la cuenta, tabla a tabla, antes y después); la cuenta, `travelers` y `pagos_registro` se quedan; repetirlo no falla; el móvil (`authenticated`) no puede llamar a la función; una transacción rota a medias (un disparador que falla al borrar pases) deja todo como estaba; un viaje y un pase compartidos con una amiga pasan a ella sin perder nada. Un control comprueba que NINGUNA tabla con clave a `auth.users` queda fuera del inventario.
- Rutas reales con clave de servicio de mentira: un email que no está en `LOGROS_ADMIN_EMAILS` no ve el botón (`puede: false`), la sesión anónima 403, sin sesión 401; usar el POST sin ser administrador da 403 y no se borra nada (ni filas, ni archivos, ni datos de la persona); sin confirmar, 400; con la base de datos rota o sin la migración, 500 sin tocar archivos ni marca; el administrador borra solo lo suyo aunque el cuerpo nombre otra cuenta (3 archivos suyos fuera, 2 de la otra cuenta quedan, perfil y registro de cobros intactos).
- Código: ni «Stripe» ni `pagos_registro` ni `deleteUser` ni `truncate` en lo nuevo, un único `delete … where columna = $1`, no toca el motor.
- Pantalla (modo demo del panel, headless Chrome contra `npm run dev`): sin permiso no hay botón; con permiso sale bajo «Verme como viajero sin pase»; el diálogo con el texto exacto; [Cancelar] no borra nada; [Sí] vuelve a `/`, borra las claves sembradas (incluida la marca de la película y una base de IndexedDB) y deja sin la marca `jutrip:sin-apertura` (sale la apertura). Capturas: `docs/dias/capturas_jutrip/j10_boton.jpg` y `j10_dialogo.jpg`.

**No probado:** contra el Supabase real (el Postgres de prueba es PGlite; `auth.admin.updateUserById` y Storage son dobles); que GoTrue reemplace o mezcle `user_metadata` (se cubre con `null` explícito más el refuerzo del cliente); la suscripción push del navegador (la fila se borra, pero el navegador conserva su suscripción hasta que caduque); el botón de un no administrador en pantalla (se prueba el servidor y el cliente con la respuesta `puede: false` simulada).

**Para integrar:** aplicar a mano `supabase/migrations/0032_empezar_de_cero.sql` (SQL editor de Supabase; se puede repetir) y reiniciar el api-server (no se recarga solo). Sin la 0032 el botón dice que falta la migración y no borra nada.

## 10K. Entrar con Google a la primera, y adónde abre la app

**Lo que pasaba (confirmado leyendo `src/lib/cuentas.ts`)**: con la sesión anónima, `entrarConGoogle` intentaba primero `linkIdentity`. Si esa cuenta de Google ya tenía cuenta (lo normal al volver, después de [Empezar de cero] o en otro móvil), Supabase contestaba al volver con `identity_already_exists` y hacía falta un segundo viaje a Google (`signInWithOAuth`). Y sí: el aviso de reintento (`trazo:cuenta:google-reintento`) solo se borraba al entrar con éxito; si el intento anterior había dejado la marca dentro de los 5 minutos, `alVolverDelEnlace` no reintentaba y dejaba «No hemos podido entrar». Además, cada vuelta de Google era una carga nueva de la página y `index.html` ponía la pantalla de inicio de 3,5 s cada vez (la única excepción era la marca de «recarga justo después de entrar», que no cubría la vuelta de Google).

**Lo que se ha hecho**
1. **Un solo viaje a Google**: `entrarConGoogle` va directo con `signInWithOAuth` (se acabó `linkIdentity`), tenga o no cuenta ya esa cuenta de Google. Antes de irse guarda la sesión anónima con su token al día; al volver ya dentro de su cuenta, `completarEntrada` le pasa todo lo de la anónima (`/api/cuenta/reclamar`), exactamente igual que al entrar con el email. Una cuenta de Google nueva también se prueba así (se crea y recibe lo de la anónima).
2. **Sin frenos**: cada toque en [Continuar con Google] borra la marca de reintento y el aviso de antes. `alVolverDelEnlace` ya no reintenta nada: ante cualquier error al volver (Google cancelado, `identity_already_exists` heredado…) limpia la dirección y deja «No hemos podido entrar. Inténtalo de nuevo.» una sola vez, sin segundo viaje y sin recargar.
3. **La vuelta de Google no pone la pantalla de inicio**: `index.html` la quita si la dirección trae `code=`, `access_token=`, `error=` o `error_code=` (en la búsqueda o en el hash); es la misma regla que `esVueltaDeGoogle` en `cuentas.ts`. También sigue la excepción de la recarga justo después de entrar. Abrir la app con normalidad la saca siempre.
4. **Adónde abre la app con sesión** (`src/lib/dondeAbrir.ts` + `TripSync.tsx`; cambia lo de la 10G): (0) generación a medias → se retoma; (1) hoy es día de un viaje → HOY de ese viaje; (2) hay viajes por delante → RUTA del más cercano en fecha (aunque haya tocado otro después; a igualdad, el que tocó más recientemente); un viaje sin fechas cuenta como «por delante»: si hay varios sin fechas, el último que tocó; (3) todos pasaron → «Mis viajes» (pantalla `myTrips`, ahora con el título «Mis viajes» y el botón «+ Crear viaje» arriba del todo); (4) sin viajes → «Crear viaje» (la pantalla de destino).
   - **Decisión mía**: si hay a la vez un viaje con fecha por delante y otro sin fechas, manda el de fecha (tiene una fecha que el otro no tiene); el sin fechas solo gana si no hay ninguno con fecha por delante.
   - «Hoy» sale de `todayIso()` (la fecha del móvil), como el resto de la app; el cálculo con la hora del destino no se ha tocado.

**Pruebas**: `pruebaTanda10K.mjs` (46 comprobaciones, con el Google de mentira de `pruebaEntrar.mjs`): sesión anónima + cuenta de Google que ya existe → un solo viaje y lo de la anónima pasado a esa cuenta; cuenta nueva → un solo viaje y dentro; dos intentos seguidos en menos de 5 minutos → los dos entran; al volver de Google (código, sesión o error) no sale la pantalla de inicio, y abriendo con normalidad sí; otros errores → el aviso, sin bucle y sin salir otra vez; y cada caso de adónde abre la app (hoy de viaje, por delante con otro tocado después, solo pasados, sin viajes, sin fechas, empates, a medias). Se actualizaron `pruebaEntrar.mjs` (el bucle de antes ya no existe) y `pruebaTanda10G.mjs` (las reglas de dónde abrir pasan a las de arriba).

**Cómo probarlo tú en tu Supabase de verdad** (no hace falta ningún cambio en Supabase: Google y las direcciones de vuelta siguen igual; `linkIdentity` simplemente ya no se usa)
1. Con la app desplegada o en local, abre una ventana de incógnito (sin sesión) y entra en la app: sale la pantalla de inicio una vez.
2. Crea un viaje SIN cuenta (así hay algo en la sesión anónima).
3. Toca [Continuar con Google] y elige tu cuenta de siempre (la que ya tiene cuenta): **una sola** ventana de Google y entras; no debe salir ningún «No hemos podido entrar» ni una segunda pantalla de inicio al volver. Tu viaje nuevo debe aparecer junto a los que ya tenías (lo pasa `reclamar`).
4. Cierra sesión y repite con [Empezar de cero] (10J) antes: tras empezar de cero, un solo toque en Google debe dejarte dentro a la primera.
5. Repite con una cuenta de Google que no hayas usado nunca (cuenta nueva): un solo viaje, dentro, y el viaje creado antes sigue ahí.
6. Cancela en la ventana de Google: vuelves a la pantalla de entrar con «No hemos podido entrar. Inténtalo de nuevo.», sin pantalla de inicio; vuelve a tocar el botón y entra.
7. Para lo de adónde abre: con sesión, recarga la app con (a) un viaje que incluya hoy → HOY; (b) solo viajes futuros → RUTA del más cercano; (c) solo pasados → «Mis viajes»; (d) sin viajes → «Crear viaje».

## 10K2. La pantalla de inicio sin «TU APP DE VIAJES»

Petición de Eric (25-oct): en la pantalla de inicio de 3,5 s, fuera el texto «TU APP DE VIAJES» y el lema «De viajeros, para viajeros» pasa a tener la animación que tenía esa línea. Hecho en `shared/marca/aperturaJutrip.js`: se quita la línea (y `ETIQUETA`) y el lema ya no se escribe letra a letra; entra suave desde abajo con la animación `apTag` (del 80 % al 94 % de los 3,5 s, es lo último en entrar) y conserva su aspecto (mayúsculas espaciadas, oro profundo). `main.tsx` sigue quitando la pantalla cuando acaba la animación del lema (`data-fin`). Prueba: `pruebaTanda10G` (77 comprobaciones, apartado de la apertura actualizado) y capturas nuevas `10g_apertura_*` (`capturasJutrip.mjs tanda10g`).

## 10L. Fuera las tarjetas de las estaciones, el último domingo de los Vaticanos y la captura de los avisos

**1. Fuera las estaciones.** `server/engine/seasonNote.js` ya no tiene `SEASON_CARD_TEXTS` ni la estación del año, ni lo de «a primera hora» ni el atardecer: `seasonNoteFor` solo devuelve algo si el primer día cae en la `temporada_navidad` del destino, y si no, `null`. Además `SeasonCard.tsx` solo pinta la de Navidad, así que los viajes ya guardados con una tarjeta de primavera/verano/otoño/invierno tampoco la enseñan. Los textos de Navidad de Roma (`destination_config.nota_temporada`) pierden «como anochece sobre las {hora_atardecer}»: con mercadillo y noche = «¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, también iluminado.»; con árboles: «… sitios más bonitos, también iluminados.»; solo luces: «… para que las veas, también de noche.»; las `_sin_noche` no cambian. No se ha tocado el reparto de los días.

**2. El último domingo de mes en los Museos Vaticanos.** Fuente oficial (museivaticani.va, «orari-musei-vaticani», **comprobada el 25-oct-2026**): domingos cerrados, salvo el último domingo del mes, 9:00-14:00 (última entrada 12:30), entrada gratuita, «purché non coincida con la Santa Pasqua»; la web también nombra el 29 de junio y el 25, 26 y 31 de diciembre como fechas especiales.
- **Qué hacía la app (sin cambios en esto):** el dato ya traía `last_sunday` y `closed_on`; `closedOnDay` entiende el último domingo y el motor NO los da por cerrados ese día: no sale «Los domingos los Museos Vaticanos cierran» ni el aviso de «Museos Vaticanos cerrados», y la ruta no los quita por cierre. Sí es verdad que los días escritos nunca ponen el Vaticano en un domingo (el comentario de `server/engine/index.js` lo dice: «el documento escribe esos domingos sin ese sitio»), así que la visita sigue en su día (en domingos normales, además, con su aviso de cierre).
- **Qué he cambiado:** un aviso propio, `ultimo_domingo_vaticanos` en `fechas_especiales` (nueva fecha `ultimo_domingo`, con `excepto`: Pascua, 29 jun, 25, 26 y 31 dic; `specialDates.js`, `validar.mjs`): «Último domingo de mes: los Museos Vaticanos abren gratis por la mañana y hay mucha cola. Tu visita al Vaticano sigue en su día, sin esas colas.» (si algún día el Vaticano cayera ese domingo: «Hemos dejado tu visita por la mañana.»; si el viaje no lleva el Vaticano, no sale). Decisión que te dejo: la ruta sigue SIN poner el Vaticano en ese domingo (lo escriben así los días de Roma); si quisieras que sí lo pusiera, habría que cambiar el documento de los días, no esto.

**3. La captura de todos los avisos:** `docs/dias/AVISOS_REVISION.html`, que genera `scripts/destino/avisosRevision.mjs` (ver más abajo el resumen de lo que sale y lo que no se ha podido capturar).

**4. Pruebas:** `pruebaTanda10L.mjs` (27 comprobaciones, con el motor de verdad): un viaje de 2 días empezando cada día entre nov-2026 y dic-2027 → ninguna fecha saca la tarjeta de una estación (solo Navidad, sin la hora del atardecer); Navidad en cada variante; el último domingo los Vaticanos no están cerrados y sale el aviso propio (no en Pascua); un domingo normal sigue con su cierre. No hace falta la muestra de 60 fechas (solo cambian textos). `pruebaFase6y5_motor` se queda sin tiempo como antes de esta tanda (se arregla en la Tanda 12).

**La página de avisos** (`docs/dias/AVISOS_REVISION.html`, 6,4 MB, 390 px, capturas dentro; se vuelve a generar con `node scripts/destino/avisosRevision.mjs` —unos 25 minutos; `--solo=texto` repite solo algunos y `--sin-capturas` solo regenera la página—). Recorre el motor de Roma con viajes de 2, 3 y 5 días que empiezan cada día de 2027, elige para cada aviso distinto el viaje más corto y temprano que lo saca, lo crea en la app real y lo fotografía: **81 avisos distintos, 78 con captura**. Cada uno lleva su texto, «Cuándo sale» y «Dónde». Incluye: la tarjeta de Navidad (con mercadillo, árboles y solo luces; sin tarjetas de estación); 22 de las 23 fechas especiales (con sus variantes), entre ellas el aviso nuevo del último domingo; los cambios que hace el motor (por fuera, cerrado, horario especial, visita movida); los banners de contexto (los enseña la campana de Avisos); y los avisos de las paradas (cerrado hoy, ya ha cerrado, aún no ha abierto, cierres de Año Nuevo y Navidad, «última entrada»…). El aviso de los restaurantes va dentro de las tarjetas de Nochebuena, Navidad, San Esteban y la semana de Ferragosto.
**No capturado:** las tres variantes de Navidad «sin noche» (ningún viaje las saca: el motor siempre pone alguna noche; se enseñan con el texto de la plantilla); «hoy ves…» y «se queda en su día y decides tú» de las reservas (solo salen con reservas hechas, no al crear un viaje; la parte de «se queda en su día» sí sale como «Cerrado este día»); no he encontrado ningún aviso de la Borghese en lunes en estos viajes (la Galería simplemente se coloca otro día); la variante sin «reserva» de `domenica_borghese`.

## 10M. Los avisos de la ruta

La regla de Eric (25-oct, tras ver `AVISOS_REVISION.html`): **la ruta, limpia; lo importante, al abrir la ruta; y luego, siempre a mano en la campana.** No cambia cómo se reparten los días (comprobado: `scripts/destino/muestraRutas60.mjs` compara 60 viajes —paradas, días, horas y minutos— con la huella guardada antes de empezar y dice «exactamente iguales»; no hace falta la de 365).

**1. Orden al abrir la ruta.** Primero la tarjeta especial (si toca); la ventana de avisos espera a que se cierre; sin tarjeta, los avisos directamente. Al cerrarlos, quedan en la campana.

**2. Tarjetas especiales** (`SeasonCard.tsx`, `server/engine/seasonNote.js`, `destination_config.nota_temporada`): tres, una por viaje y UN texto cada una, los de Eric palabra por palabra, con «Roma» sacado del dato del destino (cada destino pone las suyas; sin la clave, esa tarjeta no sale): **Navidad** (26 nov–6 ene, con su dibujo de siempre), **Semana Santa y Pascua** (nueva: del Domingo de Ramos al Lunes de Pascua; dibujo con el amanecer rosa y oro y la cúpula y las columnatas de San Pedro) y **el cumpleaños de Roma** (nueva: 21 de abril; el Coliseo con sus arcos encendidos, columnas y guirnalda de banderines al atardecer). Mismo lienzo, rótulo y animación que Navidad. Si un viaje cae en dos, solo Semana Santa. Las tarjetas se enseñan si ALGÚN día del viaje cae en las fechas (antes Navidad exigía el primer día); los viajes ya guardados con una tarjeta de estación ya no la enseñan.
  - **Fuentes comprobadas el 25-oct-2026** (guardadas en `nota_temporada._fuentes`): Semana Santa — vatican.va, «Notificazione Settimana Santa 2026» (Urbi et Orbi desde la Loggia central de San Pedro el Domingo de Pascua) y press.vatican.va, boletín del 3-abr-2026 (el Papa preside el Via Crucis en el Coliseo el Viernes Santo); cumpleaños — turismoroma.it, «Natale di Roma – XXVI edizione» (18–21 de abril de 2026, cortejo desde el Circo Máximo; 2779.º cumpleaños); Navidad — turismoroma.it (luces del 26 nov al 6 ene). Las URLs directas a vatican.va y turismoroma.it dieron 404 desde aquí: se confirmó por búsqueda y por los documentos oficiales que las enlazan. Los textos no dan horas.

**3. La ventana de avisos** (`DateNoticesModal.tsx`, `AvisoDeFechaTarjeta.tsx`): ya no sube como una hoja: sale **en el centro, del mismo tamaño y estilo que la tarjeta de Navidad**, con el icono de cada aviso arriba en lugar del dibujo; se conservan las flechas ‹ ›, los puntitos, «1 de 3», como mucho 3 tarjetas (la 3.ª, «y N más»), «Siguiente» y «Entendido».

**4. Un solo aviso por fecha** (`server/engine/dateNotices.js` y `fechas_especiales`, 20 entradas rehechas sin `hecho`/`cubre`): dos partes — **qué pasa ese día, siempre igual** (todo lo que cierra o cambia, esté o no en su ruta; solo cambia la fecha) y la frase de lo hecho, la misma para todos: «Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.» Excepción única: «En tu viaje no hay otro día para {sitio}: se quedan en su día y decides tú.» y la de «te lo enseñamos por fuera» de ahora. Sale si la fecha cae en el viaje aunque nada de su ruta cierre. Lo aparte (transporte del 1 de enero, «muchos restaurantes cierran») va en la misma tarjeta.
  - **Decisión mía que conviene que confirmes:** la frase «Hemos preparado tu ruta…» solo sale en los avisos de días que cierran o cambian algo; los puramente informativos (primer domingo gratis, mercadillo, semana de Ferragosto, último domingo de mes) no la llevan, porque ahí no hemos hecho nada. Las frases de la excepción y de «por fuera» pueden pasar de 35 palabras (se dejaron tal cual).
  - Los festivos sin entrada propia (1 nov, 19 mar, 11 feb, 14 ago…) salen como «1 de noviembre · Todos los Santos: es festivo y cierran…» si cierra un lugar de nivel 1 o uno de la ruta.

**5. Los cierres de la semana y el último domingo.**
  - **Qué pasó en el viaje del jueves 5 al domingo 8 de noviembre de 2026:** son 4 días de viaje, 3 de ruta (jueves a sábado) y el domingo es el día de vuelta. Los Vaticanos cayeron solos el viernes 6 (día 2 de los días escritos): el motor no movió nada. El domingo ya no era día de ruta, así que `dateNotices` no lo miraba; y el aviso viejo de «cerrado» solo salía cuando el motor movía algo (`dateMoves`) y solo para lugares de nivel 1, joyas o del pool. Con el mismo viaje leído como 4 días de ruta (hasta el lunes 9) sí hubo un movimiento por el cierre del domingo y el aviso salía. En la página de la 10L no había aviso de la Borghese en lunes porque es de nivel 2 y no es joya (`matters()` la descartaba).
  - **Ahora** salen siempre que un cierre semanal caiga dentro de las fechas del viaje (también el día de vuelta, antes no se miraba) y el sitio esté en su ruta, nombrando el sitio: «Los domingos cierran los Museos Vaticanos. Hemos preparado tu ruta…», «Los lunes cierran el Castillo de Sant'Angelo y la Galería Borghese.».
  - **Último domingo de mes:** «Último domingo de mes: los Museos Vaticanos abren gratis por la mañana, hay mucha cola y puedes perder todo el día. Por eso te los hemos puesto {día}.» con {día} = el día del viaje en que están («el viernes 6»). Solo si el viaje incluye ese domingo y los Vaticanos están en su ruta otro día; ese domingo no sale «los domingos cierran»; en Pascua no sale. La ruta sigue sin ponerlos ese domingo.

**6. DÍAS limpio y todo a la campana.** Fuera las pastillas de los avisos de la cabecera del día (`DayList.tsx`) y «Hoy el sol se pone a las…» (`DayDetailPanel.tsx`). **Aviso:** esa línea no estaba en ningún otro sitio, así que la puesta de sol ya no se ve en ninguna pantalla (el dato sigue en la ruta); HOY nunca la tuvo. Si quieres que HOY la enseñe «cuando toca», hay que diseñarlo (dime cuándo). **Campana** (`useAppNotices.ts`, `NoticesSheet.tsx`, `useRouteStore.ts`): cada fecha con avisos entra con su frase corta (`campana`, p. ej. «1 de enero · Año Nuevo: el Coliseo, el Foro Romano y 6 lugares más cierran.»; «Museos Vaticanos cierran el domingo 8 de noviembre.»; sin cierres, el título); al tocarla se abre su tarjeta; leído = deja de contar en el numerito pero se queda siempre en la lista; lo visto en la ventana entra como leído; los nuevos, arriba (también los de cambio de vuelo, que nunca están leídos); al cambiar las fechas, los nuevos entran como nuevos y los de fechas que ya no tocan se quitan. El leído se guarda con la ruta (`dateNoticesRead`, por `id` estable `fecha:tipo`). No probado contra Supabase real con cuentas encendidas.

**7. La página de avisos** (`docs/dias/AVISOS_REVISION.html`, 4 MB; `node scripts/destino/avisosRevision.mjs` la vuelve a generar, unos 10 minutos): 72 avisos, 72 con captura — las 3 tarjetas, un ejemplo por fecha (24), los cierres de la semana (domingo+Vaticanos, lunes+Borghese, lunes+San Pietro in Montorio), la excepción y «por fuera» aparte (3 y 3), la ventana con 3 y con 5 avisos («y 3 más»), la campana con avisos nuevos y leídos y la tarjeta que abre, DÍAS sin pastillas, el aviso «Sobre tu ruta» y los avisos de las paradas. El script falla si algún texto mostrado contiene «anochece», «{» o «hora_atardecer» (en la 10L tres tarjetas de Navidad lo llevaban).

**8. La batería, estable.** `bateriaParalela.mjs` ahora arranca SU PROPIO Vite recién nacido en otro puerto (APP_URL, que `abrirApp` respeta; `sinvite=1` usa el de siempre) y cierra todo al acabar: el Vite abierto muchas horas acumulaba módulos duplicados por el HMR (`route` null) y era la causa de los fallos de 10B/10G. Las pruebas que abren Chrome (las que usan `abrirApp`) corren de 2 en 2 (`navegador=2`) a la vez que las de Node (`conc`); `pruebaFase6y5_motor` (siempre agota su tiempo; Tanda 12) solo entra con `motor=1`. Importante: mientras la batería corre no debe haber otras cosas con Chrome (en la primera pasada, regenerar la página de avisos a la vez provocó fallos por carga).

**9. Pruebas.** `pruebaTanda10M.mjs` junta `pruebaTanda10M_motor.mjs` (46: tarjetas —Navidad, Semana Santa, 21 de abril, Pascua+21 de abril, otra fecha—, un aviso por fecha con la frase, la excepción, cierres de la semana, último domingo, campos de la campana), `pruebaTanda10M_app.mjs` (70: las tres tarjetas, la ventana, DÍAS sin pastillas ni «el sol se pone», la campana) y la huella de 60 viajes. Pruebas viejas actualizadas a las reglas nuevas, sin debilitarlas: 10L, Cuentas3 (la lista de la campana), Jutrip (el punto de «sin leer» de la campana), Tanda7_respuestas, 6z6f.


## 10O · EXPLORAR

Prompt guardado en `docs/dias/PROMPT_TANDA10O.md`. Prueba: `scripts/destino/pruebaTanda10O.mjs` (datos y app, API, muestra de 60 viajes). Capturas en `docs/dias/capturas_jutrip/10o_*.jpg` y página `docs/dias/REPASO_10O.html` (a tamaño de móvil, con las listas).

**No se ha tocado el motor de rutas.** Todo lo de la tanda vive en la lista de EXPLORAR (el servidor del catálogo `/api/destination-places` y la app). La muestra de 60 viajes sale exactamente igual que antes. Por eso no hace falta la de 365.

### 1.1 Las dos pestañas
- Fuera la tarjeta cerrada «Cerca de ti». Vuelve el interruptor de dos partes **[Recomendados] [Cerca de ti]** debajo de «Buscar en Roma…», para todos (con y sin pase, dueño e invitado: la pantalla no distingue) y en todas las listas (Lugares, Restaurantes, Entradas, Excursiones…).
- Sin pase: candado dorado pequeño junto a «Cerca de ti»; al tocarla sale la hoja (tirador, ✕, título «Cerca de ti», el texto con «Pase de Roma» en oro con `Marca` y [Ver el Pase de Roma] → `abrirPase()`). No cambia de pestaña. Con pase, ordena por cercanía como antes.

### 1.2 Listas de Lugares y Miradores
- **Free Tour**: `default_free_tour.megusta_inicial = 978` en roma.json; el servidor lo manda como `likes_initial` y el almacén de «me gusta» lo cuenta como el de cualquier sitio.
- **Fuera de la lista** (campo nuevo `fuera_de_lista: true` en `places`; el catálogo los sigue mandando y la app solo los quita de la lista, del mapa y de los contadores): Luces de Navidad del Tridente, Lungotevere, Mercadillo de Navidad de Piazza Navona, Terraza del Largo Gaetana Agnesi, Porta Pinciana, Mirador de San Pietro in Montorio, Fontana dell'Acqua Paola y Jardines del Pincio. Siguen en `places`: el motor y los textos de la ruta (Navidad, paseo hasta Trastevere, Janículo, Pincio) no cambian; lo demuestra la muestra de 60.
- **Al final** (campo `al_final_de_lista: true`; en el orden va detrás de los «me gusta» y delante del nivel, así que si un viajero les da «me gusta» suben): Plaza del Quirinal, Quartiere Coppedè, Santo Bambino de Aracoeli, Via dei Coronari, Via del Babuino, Via di Ripetta, Via Margutta y Via Veneto.
- **Suben**: Plaza Venecia 97, Puente Sant'Angelo 96, Via dei Fori Imperiali 95, Via della Conciliazione 94, Via Appia Antica 90, Teatro de Marcelo 86 y Via Condotti 83, en ese orden, sin empates. **Decisión a revisar:** entre la Cúpula (95) y Villa Borghese (81) solo hay 13 números y los nueve sitios que ya estaban ahí ocupaban 9, así que no cabían siete más. Para que quepan sin cambiar el orden de nadie he subido los cuatro de arriba: Cúpula de San Pedro 95→99, Trastevere 96→100, Castillo de Sant'Angelo 98→101 y Galería Borghese 99→102. Es más de «uno o dos», dime si prefieres otra cosa. En la lista sin filtros los siete quedan entre los puestos 18 y 31 (Villa Borghese pasa del 25 al 33 porque entran siete sitios más y la Terraza).
- **Terraza del Altar de la Patria**: sitio nuevo en Miradores, **sin pasar por `places`** (array nuevo `lugares_solo_lista` en roma.json que solo lee el servidor del catálogo): el motor no la ve y la ruta no cambia. 98 «me gusta» (justo detrás de la Cúpula), horario 09:30–19:30, última subida 19:00, de pago, su texto y su foto (la de las vistas desde arriba que ya estaba en `public/fotos/roma/dia_terraza_altar_patria.jpg`). **Pendiente:** esa foto no lleva crédito y no he podido confirmar su autor ni su licencia (no es un fichero que pueda localizar en Commons con seguridad: las dos candidatas son «Victor Emanuel II Rome 2011 7/8.jpg»). Hay que mirar de dónde salió o cambiarla.
- La ficha de la Terraza, como la de cualquier sitio sin ficha ampliada, pide su texto a la IA (con caché) al abrirse.
- Listas completas, con su puesto, al final de este apartado.

### 1.3 Entradas, Excursiones y Hoteles
- **Castillo de Sant'Angelo por fuera**: `dia_castillo_sant_angelo_fuera.jpg` (+ `_p` y miniatura), Wikimedia Commons, autor Jean-Pol GRANDMONT, CC BY-SA 3.0 (pide crédito, ya apuntado en `_fotos.json`), «0 Pont et château Sant'Angelo - Rome (1).JPG» (30-9-2011), con el puente y el Tíber. La de dentro se queda en el repositorio, sin uso. Ojo: el nombre de la foto es el del Castillo, así que sale por fuera en TODAS las fichas y tarjetas (también en el día «Roma desde arriba»).
- **Por qué Excursiones salía fea** (no era la consulta ni la caché): (1) la tarjeta no pintaba foto (solo un cuadrito con icono) aunque el catálogo trae el nombre con el que buscarla; (2) `mapExcursionsByDay` oculta la nota y las opiniones cuando el precio es provisional (5 de las 7 lo son: es lo correcto, no se enseñan notas inventadas); (3) con la API apagada solo 2 de las 7 se enriquecen. Ahora la tarjeta es la de las demás listas (foto, nombre en la letra de los títulos, duración y «desde X €»); un dato que no llega se omite, sin huecos ni «undefined» y sin el nombre del proveedor.
- **La API solo para admin**: `CIVITATIS_API_ACTIVA=admin` (`true` = para todos, vacío o `false` = nadie). El servidor mira el token de sesión de Supabase, saca el email y lo compara con `LOGROS_ADMIN_EMAILS` (excluye sesiones anónimas); sin sesión, sin clave de servicio o ante cualquier fallo, apagada. **Lo que tiene que poner Eric en Vercel** (sin claves en este documento): `CIVITATIS_API_ACTIVA=admin`, `CIVITATIS_API_ENV=sandbox`, `VITE_CIVITATIS_ACTIVA=true` (solo hace que la app pregunte; decide el servidor; pide un nuevo build) y volver a desplegar. Tienen que seguir puestas `CIVITATIS_API_USER`, `CIVITATIS_API_PASSWORD`, `LOGROS_ADMIN_EMAILS` y `SUPABASE_SERVICE_ROLE_KEY`. El cliente manda ahora `Authorization` a `/api/destination-excursions` y `/api/civitatis/*`. Limitación: la app guarda la respuesta por destino durante la sesión; si Eric entra en su cuenta después de abrir la app, hay que recargar.
- **Caché**: catálogo, actividad, traslados, cerca y resolver a 14400 s (4 h); calendario, 3600 s. Tope duro de 4 h también en el código (`cache.js`, con la fecha del 19-oct). Si la API falla se sirve lo caducado marcado como viejo, también de más de 4 h: dime si el proveedor lo cuenta como «guardar» y lo quito.
- **Descripciones y valoraciones tal como vienen**: la API no aporta descripciones (las de las excursiones salen de roma.json, intactas). La nota se redondeaba a un decimal en el servidor y ya no; en pantalla la tarjeta sigue enseñando un decimal (formato del cliente), dime si el proveedor quiere ver todos.
- **Las cinco excursiones sin resolver**: `POST /search` devuelve 400 con las cinco formas de cuerpo que probé (hay que preguntar al proveedor el cuerpo correcto). Por las actividades de los destinos cercanos, ninguna sale «desde Roma». Candidatas con salida desde otras ciudades: Pompeya y Sorrento → 115374 y 158234 (Nápoles); Costa Amalfitana → 30945 (Nápoles), 11020 (Positano), 172603 (Pompeya); Nápoles y Pompeya en tren → 158222 (en Florencia) y 158244 (Nápoles), sin confirmar; Florencia en tren y Tívoli → sin coincidencias. Script listo: `scripts/destino/civitatisBuscarCinco.mjs`.
- **Hoteles** vuelve como tarjeta (foto del Hotel Eden de Roma, de Wikipedia, como Baños y Fuentes), antes de Baños y Fuentes, para todos; abre `useAlojamientoUi.getState().abrirMapa()`.

### 1.4 Añadir un sitio sin pedir la hora
- Dónde lo ponía antes: en EXPLORAR, la hoja pedía día y hora (8:45 era la hora de la primera parada del día: la sugerida salía de ahí) y lo metía por hora (`withStopAt`). En DÍAS el «+» ya era posicional (entra en el hueco que se toca) y no pedía hora; no se ha tocado.
- Ahora: se elige solo el día (los minutos se quedan) y `mejorHuecoEnElDia` (`src/lib/mejorHueco.ts`) lo coloca entre las paradas donde **menos hay que andar de más** (línea recta: ir de la anterior al sitio y del sitio a la siguiente, menos ir de una a otra) y **con el sitio abierto** (el mismo cálculo de horarios de siempre: `placeHoursOnDate`, la apertura y el cierre). Nunca el primero si el día ya tiene paradas; nunca después de las nocturnas. La hora la calcula el almacén desde la parada de delante (`insertStopAt`); las de detrás no se mueven (decisión del 28-sep). En un día libre, al final, como antes.
- Si ese día cierra (o no hay hueco en que esté abierto): «El lunes 19 la Galería Borghese cierra. ¿Lo ponemos el sábado 17?» con [Ponerlo el sábado 17] y [Dejarlo el lunes 19 igual]. El día propuesto es el primero de los siguientes (luego los anteriores) en que abre y no tiene excursión de día entero ni lo tiene ya. Sin otro día posible, solo el aviso «El lunes 19 la Galería Borghese cierra.» y el botón de siempre. El artículo del sitio sale de la tabla de artículos de Roma.
- **No hace falta tocar el motor**: todo es del lado de la app (`insertStopAt` ya existía).
- La ruedita de una entrada (RESERVAS) parte de la hora a la que la ruta llega a ese sitio ese día (si ya está), si no de las 9:00, y se queda en la hora más cercana de las del sitio (si abre más tarde, la de apertura). Los minutos se quedan.
- Invitado: la hoja pasa por `alAnadir` de siempre (modo recomendación sobre una copia); no cambia el viaje del dueño.

### 1.5 Los días
- Hoja de añadir, «Mover a» y las hojas de excursión: «Sáb 17 Oct · Vaticano y Trastevere» (`diaConFecha` en `nombreDeDia.ts`; sin fechas, «Día 3 · …»). En «Mover a» la fecha va en negrita y el nombre del día detrás.

### Dudas para Eric
1. ¿Vale subir los cuatro de arriba (Cúpula, Trastevere, Castillo, Galería) para que quepan los siete?
2. ¿De dónde sale la foto de la Terraza (autor y licencia)? Sin eso va sin crédito.
3. ¿Quieres que «Dejarlo igual» y el «+» de EXPLORAR pregunten también los minutos o los quito (hoy se quedan)?
4. ¿La caché caducada de la API (servida si falla) cuenta como «guardar» para el proveedor?

### Listas completas (puesto, «me gusta» de partida, sitio)

```
Free Tour: Free Tour por Roma → 978

LUGARES (81)
  1   412  Coliseo
  2   391  Fontana de Trevi
  3   368  Museos Vaticanos y Capilla Sixtina
  4   347  Basílica de San Pedro
  5   326  Panteón
  6   305  Plaza de España
  7   199  Piazza Navona
  8   184  Foro Romano y Palatino
  9   169  Plaza de San Pedro
 10   154  Altar de la Patria
 11   139  Arco de Constantino
 12   102  Galería Borghese
 13   101  Castillo de Sant'Angelo
 14   100  Trastevere
 15    97  Plaza Venecia
 16    96  Puente Sant'Angelo
 17    95  Via dei Fori Imperiali
 18    94  Via della Conciliazione
 19    93  Museos Capitolinos
 20    92  Plaza del Campidoglio
 21    91  Boca de la Verdad
 22    90  Via Appia Antica
 23    89  Basílica de San Juan de Letrán
 24    88  Basílica de Santa María la Mayor
 25    87  Termas de Caracalla
 26    86  Teatro de Marcelo
 27    85  Circo Máximo
 28    84  Campo de' Fiori
 29    83  Via Condotti
 30    82  Isla Tiberina
 31    81  Parque de Villa Borghese
 32    77  Barrio Judío
 33    76  Cripta de los Capuchinos
 34    74  Basílica de San Clemente
 35    73  Domus Aurea
 36    71  Piazza del Popolo
 37    70  Trinità dei Monti
 38    69  Iglesia de San Pietro in Vincoli
 39    67  Ara Pacis
 40    66  Iglesia de Santa Maria in Trastevere
 41    65  Santa Maria del Popolo
 42    63  Iglesia de San Luigi dei Francesi
 43    62  Iglesia del Gesù
 44    60  Mercados de Trajano
 45    59  Monti
 46    58  Testaccio
 47    56  Largo di Torre Argentina
 48    55  Villa Farnesina
 49    52  San Pietro in Montorio y Tempietto de Bramante
 50     0  100 Presepi in Vaticano
 51     0  Basílica de Santa Cecilia in Trastevere
 52     0  Bioparque de Roma
 53     0  Borgo Pio
 54     0  Catacumbas de San Calixto
 55     0  Cementerio Protestante
 56     0  Colle Oppio
 57     0  Columna de Trajano
 58     0  Elefantino de Bernini
 59     0  Fuente de las Tortugas
 60     0  Fuente del Tritón
 61     0  Galería Nacional de Arte Moderno
 62     0  Iglesia de San Ignacio de Loyola
 63     0  Iglesia de Santa Maria della Vittoria
 64     0  Iglesia de Santa Maria sopra Minerva
 65     0  Mercado de Testaccio
 66     0  Palazzo Doria Pamphilj
 67     0  Piazza Colonna
 68     0  Pirámide Cestia
 69     0  Plaza Farnese
 70     0  Plaza Trilussa
 71     0  Ponte Sisto
 72     0  Templo de Adriano
 73     0  Via del Corso
 74     0  Plaza del Quirinal  (al final)
 75     0  Quartiere Coppedè  (al final)
 76     0  Santo Bambino de Aracoeli  (al final)
 77     0  Via dei Coronari  (al final)
 78     0  Via del Babuino  (al final)
 79     0  Via di Ripetta  (al final)
 80     0  Via Margutta  (al final)
 81     0  Via Veneto  (al final)

MIRADORES (6)
  1    99  Cúpula de San Pedro
  2    98  Terraza del Altar de la Patria
  3    80  Mirador del Janículo
  4    78  Terraza del Pincio
  5    53  Jardín de los Naranjos
  6     0  Ojo de la Cerradura del Aventino

TODO (87): sin filtros, lugares y miradores juntos
  1   412  Coliseo
  2   391  Fontana de Trevi
  3   368  Museos Vaticanos y Capilla Sixtina
  4   347  Basílica de San Pedro
  5   326  Panteón
  6   305  Plaza de España
  7   199  Piazza Navona
  8   184  Foro Romano y Palatino
  9   169  Plaza de San Pedro
 10   154  Altar de la Patria
 11   139  Arco de Constantino
 12   102  Galería Borghese
 13   101  Castillo de Sant'Angelo
 14   100  Trastevere
 15    99  Cúpula de San Pedro
 16    98  Terraza del Altar de la Patria
 17    97  Plaza Venecia
 18    96  Puente Sant'Angelo
 19    95  Via dei Fori Imperiali
 20    94  Via della Conciliazione
 21    93  Museos Capitolinos
 22    92  Plaza del Campidoglio
 23    91  Boca de la Verdad
 24    90  Via Appia Antica
 25    89  Basílica de San Juan de Letrán
 26    88  Basílica de Santa María la Mayor
 27    87  Termas de Caracalla
 28    86  Teatro de Marcelo
 29    85  Circo Máximo
 30    84  Campo de' Fiori
 31    83  Via Condotti
 32    82  Isla Tiberina
 33    81  Parque de Villa Borghese
 34    80  Mirador del Janículo
 35    78  Terraza del Pincio
 36    77  Barrio Judío
 37    76  Cripta de los Capuchinos
 38    74  Basílica de San Clemente
 39    73  Domus Aurea
 40    71  Piazza del Popolo
 41    70  Trinità dei Monti
 42    69  Iglesia de San Pietro in Vincoli
 43    67  Ara Pacis
 44    66  Iglesia de Santa Maria in Trastevere
 45    65  Santa Maria del Popolo
 46    63  Iglesia de San Luigi dei Francesi
 47    62  Iglesia del Gesù
 48    60  Mercados de Trajano
 49    59  Monti
 50    58  Testaccio
 51    56  Largo di Torre Argentina
 52    55  Villa Farnesina
 53    53  Jardín de los Naranjos
 54    52  San Pietro in Montorio y Tempietto de Bramante
 55     0  100 Presepi in Vaticano
 56     0  Basílica de Santa Cecilia in Trastevere
 57     0  Bioparque de Roma
 58     0  Borgo Pio
 59     0  Catacumbas de San Calixto
 60     0  Cementerio Protestante
 61     0  Colle Oppio
 62     0  Columna de Trajano
 63     0  Elefantino de Bernini
 64     0  Fuente de las Tortugas
 65     0  Fuente del Tritón
 66     0  Galería Nacional de Arte Moderno
 67     0  Iglesia de San Ignacio de Loyola
 68     0  Iglesia de Santa Maria della Vittoria
 69     0  Iglesia de Santa Maria sopra Minerva
 70     0  Mercado de Testaccio
 71     0  Ojo de la Cerradura del Aventino
 72     0  Palazzo Doria Pamphilj
 73     0  Piazza Colonna
 74     0  Pirámide Cestia
 75     0  Plaza Farnese
 76     0  Plaza Trilussa
 77     0  Ponte Sisto
 78     0  Templo de Adriano
 79     0  Via del Corso
 80     0  Plaza del Quirinal  (al final)
 81     0  Quartiere Coppedè  (al final)
 82     0  Santo Bambino de Aracoeli  (al final)
 83     0  Via dei Coronari  (al final)
 84     0  Via del Babuino  (al final)
 85     0  Via di Ripetta  (al final)
 86     0  Via Margutta  (al final)
 87     0  Via Veneto  (al final)

FUERA DE LA LISTA (8): Lungotevere; Fontana dell'Acqua Paola; Terraza de Largo Gaetana Agnesi; Mirador de San Pietro in Montorio; Porta Pinciana; Jardines del Pincio; Mercadillo de Navidad de Piazza Navona; Luces de Navidad del Tridente
```


## 10O2 · Lo que quedaba de EXPLORAR

Prompt guardado en `docs/dias/PROMPT_TANDA10O2.md`. No se ha tocado el motor de rutas (la muestra de 60 sigue igual). La prueba es `pruebaTanda10O` (ahora 126 comprobaciones, 0 fallos); captura nueva `10o2_hoja_anadir.jpg` en `docs/dias/REPASO_10O.html`.

- **Fuera la casilla «Minutos»** de la hoja de añadir un sitio. La hoja queda solo con el día. El tiempo de visita es el `duration_minutes` de cada sitio en roma.json, que la app ya llevaba en su parada (`durationMinutes`) y usa para colocarlo y para mirar si cierra antes de acabar la visita. **Nada dependía de la casilla**: era un estado local de la hoja (valor inicial = el del sitio) que solo se usaba en esa hoja; el resto de la app no la lee. Un restaurante o una excursión no la usaban.
- **La API no enseña datos de más de 4 horas**: si la API falla, `cache.js` solo usa lo guardado si lo guardado tiene 4 horas o menos desde que se guardó (aunque su vida normal ya haya acabado: el calendario guarda 1 h). Con más de 4 horas, o sin nada, devuelve el fallo y la app hace lo de hoy con roma.json (las excursiones siguen provisionales, las entradas son las nuestras). Probado en `pruebaTanda10O_api.mjs` (sección 4) y en `pruebaCivitatis1.mjs` (la antigua esperaba lo contrario: actualizada).
- **La foto de la Terraza del Altar de la Patria** es de Eric: registrada en `_fotos.json` con él como autor (sale «Foto: Eric»), y también en el generador de huecos.
- El orden de las listas y la foto de la Cúpula se quedan como estaban.
- **Batería**: ver el resultado en la respuesta; los fallos que solo salen al correr con las demás (`pruebaJutrip` por un fichero temporal que otra prueba borra a la vez, `pruebaRevisionLargos` con los títulos vacíos bajo carga) pasan solos y se arreglan más adelante, como se pidió.


## 10P · El pase, la moneda, el sorteo y el perfil

Prompt en `docs/dias/PROMPT_TANDA10P.md`. Prueba: `scripts/destino/pruebaTanda10P.mjs` (tres partes: `_pase` 3524, `_hoy` 39 y `_sorteo` 62 comprobaciones; **3625 · 0 fallos**). Capturas en `docs/dias/capturas_jutrip/10p_*.jpg` y la página `docs/dias/REPASO_10P.html` (con la lista de comprobación con casillas arriba del todo). **No se ha tocado el motor de rutas** (no hace falta la muestra de 60). Trabajo repartido en tres agentes (película/lista/moneda, historia de prueba/HOY, sorteo/EXP/perfil) e integrado aquí.

### Lo que Eric tiene que hacer (a mano)
1. **Aplicar dos migraciones** en el editor SQL de Supabase (están SIN aplicar): `supabase/migrations/0033_historia_de_prueba.sql` (la historia de prueba en la cuenta; hasta entonces vive en el móvil) y `0034_avisos_sorteo_y_amigo.sql` (sin ella, la EXP del amigo y el sorteo funcionan pero los dos avisos de la campana no salen).
2. **Stripe:** panel › Ajustes › Pagos › **Adaptive Pricing** › activarlo (primero en modo prueba, luego en real). Sirve para los pagos de una vez de Checkout y Payment Links, en más de 150 países (entre ellos México, Colombia, Chile, Perú, España y Portugal; Argentina no). El cliente paga un 2-4 % de conversión dentro del cambio y a JUTRIP le llega en euros. No hay que cambiar código. No se ha probado un pago real.
3. **HOY v2** solo se ve con `?hoy2=on` en desarrollo: confirmar que producción tiene `VITE_HOY_V2` en true; y que el motor manda siempre `sunsetText` (hora del sol) en producción.

### Decisiones y límites a revisar
- **Moneda del pase:** el cambio de Stripe no se puede pedir antes de pagar; se aplica el plan B de Eric (cambio del día + 4 % redondeando hacia arriba), de ahí 160 MXN y no 140. El cambio sale del BCE (`/api/cambio`, como mucho una vez al día, guardado 12 h). El BCE no publica COP, CLP, ARS, PEN, UYU, BOB, PYG, CRC, DOP ni GTQ: se añadió una segunda fuente gratuita (currency-api vía jsdelivr) solo para esas; si no te convence, se quitan COP y CLP. La moneda que se elige en el pase no cambia la del presupuesto.
- **Historia de prueba:** el móvil escribe directo en la tabla con RLS (como los [Visto]), sin endpoint de servidor. El Coliseo ya no es la historia gratis fija.
- **Sorteo «a cualquier destino»:** hoy solo cuentan los viajes de destinos con datos de logros (Roma). Un viaje con HOY en París no cuenta todavía. Lo probado se hizo con PGlite y las migraciones reales, no contra Supabase real.
- **Atardecer sin mirador en la ruta:** solo mira los miradores que ya están en la ruta; para buscar entre todos del destino habría que ampliar la API de lugares.
- **Perfil:** mientras llega la respuesta del servidor se ve un instante el perfil de siempre (menos de 1 s).
- Pendiente de `data/pase/textos.json`: «Texto pendiente» (`linea_legal_compra`) sale sobre [Comprar]; es de antes y falta rellenarlo.
- Filas de la lista del pase que siguen sin existir: «¿Qué hago ahora?», «Estoy aquí» y «Funciona sin internet».
- **Batería:** en la batería completa fallaron `pruebaJutrip`, `pruebaTanda10F` y `pruebaRevisionLargos` (las conocidas, solo con las demás) y, esta vez, también `pruebaEntrarReal`, `pruebaTanda10P_sorteo` y los dos envoltorios `pruebaTanda10O` y `pruebaTanda10P` (estos agotaron los 1500 s con la batería entera). Todas pasan solas con 0 fallos. Se arreglan más adelante, como se pidió.

### Lista de comprobación (el repaso final de la app)
Cada punto del prompt, en el mismo orden. La misma lista, con casillas, está arriba del todo de `docs/dias/REPASO_10P.html`.

**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10P.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día (docs/diseno/proyecto/, sin uploads/): Pase Moneda y Sorteo Perfil nuevas; Pase Pelicula, Logros Pantallas, Perfil, App Pase y cuenta, App Ruta y dias, Reservas v4, Presupuesto y Propuesta Boton/Cambios El zip de la carpeta se llama «NUEVA TANDA.zip» (no «NUEVA_TANDA_1.zip»); «PRESUPUESTO.zip» tiene lo mismo en estas piezas. Dejé fuera las capturas de pantalla (screenshots/) y el .thumbnail del zip.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Reservas v4 («¿Para quién es?») y Presupuesto (cartera de Extras): no tocarlos ahora (van en la 10N) Solo se copió su diseño; el código de la app no se ha tocado.  
  *Dónde:* No es de móvil.

**1.1 · La historia de prueba**

- ✅ Hecho — La historia de prueba es la del sitio que el viajero elija (no la fija del Coliseo)  
  *Dónde:* DÍAS › abrir cualquier parada con historia › barra de abajo (sin pase).  *Captura:* `10p_hoy_historia_prueba.jpg`
- ✅ Hecho — Antes de usarla, en todos los sitios con historia: «Escuchar historia · Gratis, tu historia de prueba · 0/1» («Gratis» en oro)  
  *Dónde:* DÍAS › parada › barra de abajo; y HOY (con ?hoy2=on en desarrollo) › botón «Escuchar historia» (sin pase).  *Captura:* `10p_hoy_historia_prueba.jpg`
- ✅ Hecho — Se gasta a los 3 segundos de escucharla y esa historia se queda suya, para todo el viaje A 1,4 s no se gasta; a 4 s sí.  
  *Dónde:* Toca ▶ en una parada y espera más de 3 s; vuelve a abrirla: sigue abierta (sin pase).
- ✅ Hecho — Las demás, después: el mismo botón con el candado dorado a la derecha y «Todas las historias, con el Pase de Roma»  
  *Dónde:* Abre otra parada distinta de la que escuchaste (sin pase).  *Captura:* `10p_hoy_historia_cerrada.jpg`
- ⚠️ A medias — Una por destino, guardada en la cuenta (no solo en el móvil) Hecho, pero la tabla `historia_de_prueba` (migración 0033) está SIN APLICAR: hasta entonces vive en el móvil y se sube sola cuando exista la tabla. El móvil escribe directo con RLS (como los [Visto]), sin endpoint de servidor: dime si prefieres endpoint.  
  *Dónde:* Aplica 0033 en el editor SQL de Supabase; luego, en otro móvil con la misma cuenta, la misma historia sale gastada.
- ✅ Hecho — El día de prueba de HOY no la gasta  
  *Dónde:* HOY › «Tu día de prueba» › escucha una historia más de 3 s: no cambia el 0/1 (con pase).

**1.2 · La película en el móvil**

- ✅ Hecho — Que ocupe toda la pantalla, sin márgenes negros a los lados y sin deformarse Medido a 390, 430 y 360 de ancho en Chrome emulando móvil; no en un iPhone real.  
  *Dónde:* RUTA › pastilla «Pase de Roma» (sin pase).  *Captura:* `10p_pase_01_final_390x664.jpg`
- ✅ Hecho — En el final se puede bajar: la lista hace scroll y la parte fija de abajo («Se paga una vez y no caduca», [Elegir mi pase]…) siempre a la vista Dos causas: las zonas de toque y el degradado tapaban la lista.  
  *Dónde:* Película › final › baja la lista con el dedo (sin pase; en el iPhone).  *Captura:* `10p_pase_02_final_430x932.jpg`
- ✅ Hecho — Botón [Ver] arriba, junto a [Saltar] (o junto al ✕ en el final), para verla otra vez desde el principio En el final va junto al ✕; [Saltar] ya no se ve en el final.  
  *Dónde:* Final de la película › [Ver] arriba (sin pase).  *Captura:* `10p_pase_05_ver_otra_vez_empieza.jpg`
- ✅ Hecho — Cuando ya se ha visto, el final sale ya montado (sin repetir la animación de unos 5 s al tocar [Elegir mi pase] o cualquier botón del pase) Medido: a los 0,5 s no queda ninguna animación sin acabar.  
  *Dónde:* Abre el pase una segunda vez › sale directo con «Pase de Roma», la lista y [Elegir mi pase] (sin pase).  *Captura:* `10p_pase_06_final_EUR.jpg`

**1.3 · La puesta de sol y lo de mañana en HOY**

- ⚠️ A medias — El atardecer: si la siguiente parada es un mirador del atardecer, «Al Janículo para el atardecer: el sol se pone a las 17:02» (con el icono del sol) Hecho y probado, pero la hora sale de `sunsetText` del motor y en la ruta de pruebas de desarrollo llega vacío (la prueba lo pone a mano): confirma que en producción llega siempre. Y HOY v2 solo se ve con `?hoy2=on` (o VITE_HOY_V2 en producción): confírmalo.  
  *Dónde:* HOY, en un día con mirador del atardecer como siguiente parada (con pase o día de prueba).  *Captura:* `10p_hoy_atardecer.jpg`
- ⚠️ A medias — Sin mirador en la ruta y con uno cerca a media tarde: «Hoy el sol se pone a las 17:02 · el Janículo está a 15 min» Solo mira miradores que ya estén en la ruta (otros días o «si te sobra tiempo»): el catálogo del destino no expone el mirador del atardecer al cliente. Para buscar entre todos habría que ampliar la API de lugares.  
  *Dónde:* HOY a media tarde sin mirador pendiente (con pase).
- ✅ Hecho — Lo de mañana: al acabar el día o desde la hora de la cena, «Mañana: Vaticano y Trastevere · empiezas a las 9:00», y la reserva con hora del día siguiente si la hay  
  *Dónde:* HOY al acabar las paradas del día (con pase).  *Captura:* `10p_hoy_manana.jpg`
- ✅ Hecho — El último día del viaje, nada Tampoco en el día de vuelta.  
  *Dónde:* HOY en el último día (con pase).
- ✅ Hecho — Con el pase (y el día de prueba); sin pase, como ahora  
  *Dónde:* HOY (sin pase: sin la puesta de sol ni lo de mañana).

**1.4 · La lista del pase**

- ✅ Hecho — Fuera de la lista (final de la película, «Todo lo que incluye» y «Con el pase tendrás» de HOY): «Modo "a mi aire"» y «El reto del día» Mediante `data/pase/lista_ajustes.json` (si Design cambia la lista y se regenera, los ajustes se siguen aplicando).  
  *Dónde:* Final de la película › [Ver todo lo que incluye]; y HOY › «Con el pase tendrás» (sin pase).  *Captura:* `10p_pase_11_todo_lo_que_incluye.jpg`
- ⚠️ A medias — Se quedan «¿Qué hago ahora?», «Estoy aquí», «Funciona sin internet» y «La puesta de sol y lo de mañana»; apuntar cuáles faltan todavía Siguen SIN existir: «¿Qué hago ahora?», «Estoy aquí» y «Funciona sin internet» (el service worker no guarda nada). «La puesta de sol y lo de mañana» existe (1.3), con los límites de arriba.  
  *Dónde:* No hay dónde mirarlas: están por hacer antes del lanzamiento.
- ⚠️ A medias — «Invita a un amigo · Gana 200 EXP cuando haga su primer viaje con HOY» («HOY» con Marca), también en una línea en la hoja de invitar a un amigo La fila está en el final de la película, en «Todo lo que incluye» y en Ajustes › «Invitar a un amigo». `HojaInvitar.tsx` es la hoja de invitar a un viaje/pase, no la de amigo: si la quieres ahí también es una línea más.  
  *Dónde:* Ajustes › «Invitar a un amigo» (con o sin pase).  *Captura:* `10p_pase_04_invita_a_un_amigo.jpg`

**1.5 · +200 EXP por invitar**

- ✅ Hecho — +200 EXP a quien invita cuando el amigo (cuenta nueva) completa su primer viaje con HOY: viaje terminado y HOY usado al menos la mitad de los días (hacia arriba; un día con HOY = al menos un [Visto] ese día) Una sola función compartida con el sorteo; idempotente. Probado con PGlite y las migraciones reales, no contra la base de Supabase real.  
  *Dónde:* Perfil › barra de EXP, cuando un amigo haya terminado un viaje así.
- ✅ Hecho — Como mucho 5 amigos al año por persona El sexto no da EXP ni aviso.  
  *Dónde:* No hay pantalla: se ve en la EXP.
- ⚠️ A medias — Aviso en la campana de quien invita: «Ana ha hecho su primer viaje con HOY: +200 EXP» Hecho, pero hace falta aplicar la migración 0034 (amplía los tipos de aviso). Sin ella, la EXP funciona y el aviso no sale.  
  *Dónde:* Campana (arriba a la derecha) con la cuenta de quien invitó.
- ✅ Hecho — Cuenta para el nivel y para el sorteo, como cualquier otra experiencia  
  *Dónde:* Perfil › EXP y billete del sorteo.

**1.6 · El sorteo**

- ✅ Hecho — El billete dorado en el perfil, debajo de la tarjeta de EXP, con sus tres estados («Te faltan 340 EXP para el nivel 3» con barrita real; «Ya tienes el nivel. Haz un viaje con HOY activado y entras.»; [✓ Estás dentro]) Para verlos en desarrollo: en la consola `__demoSorteo.poner("sin_nivel"|"falta_viaje"|"dentro")`.  
  *Dónde:* Perfil (foto de arriba a la derecha) › bajo la barra de EXP.  *Captura:* `10p_perfil_1_billete_sin_nivel.jpg`
- ✅ Hecho — Al tocarlo, la página del sorteo (foto, premio, cuándo se sortea, quién entra, «Cómo se entra» con ✓, [Bases legales] y botón con su estado) La foto es la del Coliseo, que ya estaba en la app; la del diseño era un hueco.  
  *Dónde:* Perfil › tocar el billete dorado.  *Captura:* `10p_sorteo_1_pagina_sin_nivel.jpg`
- ⚠️ A medias — Aviso dorado de la campana el día que entra: «¡Ya estás en el sorteo de 2027!», una sola vez Hecho y probado (una sola vez), pero necesita la migración 0034.  
  *Dónde:* Campana, el día en que la cuenta cumple las dos condiciones.  *Captura:* `10p_sorteo_5_campana.jpg`
- ⚠️ A medias — Regla nueva en exp.json: nivel 3 o más + un viaje acabado con HOY la mitad de los días o más, a cualquier destino La regla está hecha. «A cualquier destino» solo es cierto para destinos con datos de logros (hoy solo Roma): un viaje con HOY en París no cuenta todavía.  
  *Dónde:* Admin: `/?admin=logros` › pestaña «Sorteo».
- ✅ Hecho — Se cierra el 31 de agosto (2027: viajes y nivel hasta el 31-ago-2027; después, del 1-sep al 31-ago) Probado: un viaje acabado el 1-sep-2027 ya no cuenta para 2027.  
  *Dónde:* Admin › «Sorteo».
- ✅ Hecho — Datos del sorteo en un sitio y fáciles de cambiar: año 2027, Roma, «Un viaje a Roma para dos personas», fechas «del 8 al 10 de octubre de 2027», cierre 31-ago-2027, enlace de bases `data/logros/exp.json › sorteo.edicion`. Añadí `fecha_sorteo` (2027-10-10) para saber cuándo pasar al año siguiente.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Mientras no haya enlace de las bases, el botón [Bases legales] no sale `bases_url` vacío; probado también con enlace.  
  *Dónde:* Perfil › billete › página del sorteo.  *Captura:* `10p_sorteo_4_pagina_con_bases.jpg`
- ✅ Hecho — Después del cierre y hasta el sorteo: «Estás dentro» para quien está dentro; a los demás el billete les cuenta para el año siguiente («Un viaje al destino del año»)  
  *Dónde:* Perfil › billete.
- ✅ Hecho — Para todos los que tengan los logros encendidos  
  *Dónde:* Perfil (con los logros encendidos).
- ⚠️ A medias — Comprobado de punta a punta con cuentas de prueba (la EXP sube, el nivel se ve, tres estados, menos de la mitad de los días no cuenta, 1-sep-2027 no cuenta, aviso una vez, el admin cuenta a esa cuenta) Comprobado con PGlite y las migraciones reales, NO contra Supabase real (falta la clave de servicio). Falta: la migración 0034 aplicada y una prueba real con una cuenta de verdad.  
  *Dónde:* Perfil y `/?admin=logros`.

**1.7 · El precio en la moneda del viajero**

- ✅ Hecho — En «¿Cuántos sois?»: pastilla de la moneda («MXN ⌄») junto a la ✕; precio grande en su moneda («≈ …») y pequeño en euros; tachado y «Ahorras ≈ …»; «≈ … cada uno»; [Comprar · ≈ …]; en euros, todo como ahora  
  *Dónde:* RUTA › pastilla del pase › [Elegir mi pase] (sin pase).  *Captura:* `10p_pase_07_compra_MXN.jpg`
- ✅ Hecho — El final de la película con «≈ … MXN» grande y «6,99 €» pequeño; la hoja «Moneda» desde abajo con la elegida con borde de oro  
  *Dónde:* Final de la película › pastilla de moneda (sin pase).  *Captura:* `10p_pase_10_hoja_moneda.jpg`
- ✅ Hecho — La moneda: la que ya tiene en la app (presupuesto) o, si no, la de su país; se puede cambiar ahí mismo La que se elige en el pase se recuerda en el móvil y NO cambia la del presupuesto: dime si debería.  
  *Dónde:* RUTA › presupuesto › Moneda; luego el pase (sin pase).
- ✅ Hecho — Cifras redondeadas y que cuadren (tachado − precio = ahorro); euros siempre los de precios.json Redondeo de 10 en 10 en pesos mexicanos, de 100 en 100 en COP/CLP. Probado con más de 3000 combinaciones.  
  *Dónde:* [Elegir mi pase] en MXN, USD y COP (sin pase).  *Captura:* `10p_pase_09_compra_COP.jpg`
- ✅ Hecho — Que nunca pague más de lo que vio: primero el cambio de Stripe si se puede pedir; si no, el cambio del día + 4 % redondeando hacia arriba Stripe no deja pedir el cambio antes de pagar: se aplica el plan B. Por eso el pase sale en 160 MXN y no en 140 (el 4 % más el redondeo hacia arriba). Si te parece caro, se baja el margen.  
  *Dónde:* [Elegir mi pase] en MXN (sin pase).  *Captura:* `10p_pase_07_final_MXN.jpg`
- ⚠️ A medias — De dónde sale el cambio del día y cada cuánto se actualiza Del Banco Central Europeo (`/api/cambio`, como mucho una vez al día, guardado 12 h). El BCE NO publica COP, CLP, ARS, PEN, UYU, BOB, PYG, CRC, DOP ni GTQ: añadí una segunda fuente gratuita (currency-api vía jsdelivr) solo para esas. Confírmame que te vale; si no, se quitan COP y CLP.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Adaptive Pricing de Stripe: comprobar que sirve para pagos de una vez y en qué países, y qué tiene que tocar Eric Sirve para pagos de una vez de Checkout y Payment Links (más de 150 países, entre ellos MX, CO, CL, PE, ES, PT; ARG no). Eric: panel de Stripe › Ajustes › Pagos › Adaptive Pricing › activarlo (primero en modo prueba, luego en real). No hay que cambiar código. No se probó un pago real.  
  *Dónde:* Panel de Stripe (no es de móvil).

**1.8 · El perfil y el pasaporte**

- ✅ Hecho — Países, ciudades y mapa salen de un solo sitio (el pasaporte, lo visitado), en el perfil y dentro Una sola función en el servidor para las dos pantallas.  
  *Dónde:* Perfil y Perfil › Mi pasaporte: mismas cifras.  *Captura:* `10p_perfil_4_pasaporte_tarjeta.jpg`
- ✅ Hecho — Perfil (P1): fuera el mapa suelto bajo «Mi pasaporte»; tarjeta con el círculo del mapa a la izquierda, sellos a la derecha y solo «N países · N ciudades» Mientras llega la respuesta del servidor se ve un instante el perfil de siempre (menos de un segundo).  
  *Dónde:* Perfil › bajar a la tarjeta burdeos.  *Captura:* `10p_perfil_4_pasaporte_tarjeta.jpg`
- ✅ Hecho — Pasaporte (P2): «Pasaporte de {nombre}», círculo del mapa mucho más grande, «N países · N ciudades · N días viajando», mapa centrado en lo visitado (sin nada, en Europa) El círculo mide 364 px en un móvil de 390 (antes 268).  
  *Dónde:* Perfil › tocar «Mi pasaporte».  *Captura:* `10p_perfil_5_pasaporte_dentro.jpg`
- ✅ Hecho — Orden del perfil: EXP, el billete del sorteo, Mi vitrina, Mi pasaporte y Mis viajes  
  *Dónde:* Perfil, de arriba abajo.  *Captura:* `10p_perfil_3_billete_dentro.jpg`

**2 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10P (película/lista/moneda, historia/HOY, sorteo/perfil) Ver las cifras en el informe.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y solo pasa solo, se dice) En la batería completa fallaron pruebaJutrip, pruebaTanda10F y pruebaRevisionLargos (las conocidas, solo con las demás), más pruebaEntrarReal y pruebaTanda10P_sorteo (carga) y los dos envoltorios pruebaTanda10O y pruebaTanda10P, que agotaron su tiempo con la batería entera. Todas pasan solas con 0 fallos (10P: 3625 comprobaciones; 10O: 126).  
  *Dónde:* No es de móvil.
- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil  
  *Dónde:* Esta página.

**3 · El informe**

- ✅ Hecho — Apartado «10P» en docs/dias/INFORME_TANDA10B.md con esta lista al final  
  *Dónde:* No es de móvil.


## 10N · Tanda Ruta: los arreglos del repaso de Eric

Prompt en `docs/dias/PROMPT_TANDA10N.md`. Prueba: `scripts/destino/pruebaTanda10N.mjs` (cinco partes: `_cabecera` 59, `_compartir` 97, `_propuesta` 59, `_reservas` 55 y `_presupuesto` 148 comprobaciones; **418 · 0 fallos**). Capturas en `docs/dias/capturas_jutrip/10n_*.jpg` y la página `docs/dias/REPASO_10N.html` (con la lista de comprobación con casillas arriba del todo). **No se ha tocado el motor de rutas.** Trabajo repartido en cinco agentes (cabecera/sin pase/hojas/estilo, compartir y permisos, propuesta, RESERVAS y presupuesto) e integrado aquí. Design al día con `DESIGN_26OCT.zip` (sin `uploads/` ni `screenshots/`); entraron también `Cuentas Grupo` y `Pase Fundador` (10N2 y 10Q), solo el diseño.

### Lo que Eric tiene que hacer (a mano, en el editor SQL de Supabase, EN ESTE ORDEN)
Todas están SIN APLICAR. Sin ellas la app sigue funcionando (cada parte degrada a lo de antes) pero los permisos, los avisos y el directo no funcionan de verdad:
1. `0032_empezar_de_cero.sql` (**volver a pegarla**: ya no borra `admin_sin_pase`; hasta entonces `server/logros/reiniciar.js` lo conserva por su cuenta). La 0037 la vuelve a crear con la tabla de gastos.
2. `0033_historia_de_prueba.sql` y `0034_avisos_sorteo_y_amigo.sql` (de la 10P, si aún no están).
3. `0035_avisos_tanda_10n.sql` (todos los tipos de aviso nuevos de la tanda).
4. `0036_permisos_del_viaje.sql` (permisos Administrador / Puede editar / Solo recomendar, quitar y salir con la plaza del pase, cambios en directo).
5. `0037_presupuesto_compartido.sql` (tabla `trip_gastos`, avisos de gasto, tiempo real).
6. `0038_reservas_para_quien.sql` (tabla `reservas_invitado`).
7. `0039_propuesta_10n.sql` (decisiones por cambio y los textos de los avisos de la propuesta).

### Lo que no se ha podido hacer igual que en Design, y límites
- **Nada de esto se ha visto contra Supabase real** (falta la clave de servicio en desarrollo): la lógica de base de datos se probó con PGlite y las migraciones reales, y la pantalla con servidores de mentira. El Realtime por la red, los avisos de la campana en un móvil y las notificaciones push no se han visto.
- **Compartir:** el enlace del dibujo es «jutrip.app/v/…»; el nuestro es `…/?invitacion=CÓDIGO`. Los nombres de sitios en los avisos van sin artículo («ha añadido Fontana di Trevi al sábado 28») porque no se puede saber el género. Si dueño y editor cambian la ruta a la vez, gana el último en guardar (no hay fusión). El administrador de pruebas con «sin pase» no se distingue del invitado normal al probar el pase.
- **Permisos en la interfaz:** el servidor ya impide que «Puede editar» cambie fechas, vuelo y alojamiento; falta ocultarlos en la interfaz del editor (RESERVAS en gris para él no está hecho).
- **Quitar a alguien:** las propuestas que ya había enviado se quedan en el servidor; la propuesta sin enviar es local y no se borra desde el servidor.
- **Propuesta:** el mapa pequeño del detalle es esquemático (como en Design) y los km son en línea recta; «+ Añadir parada» y la ficha pasan por las mismas acciones que EXPLORAR, pero la prueba solo pulsó EXPLORAR. Sin cerrojo central: si el invitado cambia la ruta por una vía no oculta, no se bloquea (su ruta no se guarda).
- **Free Tour del invitado (§6a): no he podido reproducir el fallo.** Con la ruta de pruebas sale para el invitado en EXPLORAR › Entradas, y el catálogo no depende de la cuenta. La causa probable es que la ruta guardada del viaje real no lleve `curatedId` en dos días: hay que verlo con el viaje de Eric como invitado.
- **RESERVAS del invitado:** el botón [Reservar la mía a la misma hora] abre la tienda externa (no admite fecha ni hora) y después se guarda la suya con [Guardar]. Los avisos de grupo se calculan en el móvil, no llegan como notificación. En el aviso «tu entrada no cuadra con la ruta» falta el botón [Proponer el cambio] (por enganchar con la propuesta). Si el dueño aún no tiene alojamiento, el invitado no puede mandarle su idea.
- **Presupuesto:** los gastos de un viaje con gente viven en `trip_gastos` (no en la ruta, que ven todos); los extras antiguos salen solo al dueño como «Solo para ti». Añadí una ✕ para quitar un gasto (Design no la dibuja) y un selector de moneda pequeño; «¿Quién lo ha pagado?» admite varias personas. El «por persona» cuenta todas las reservas como del grupo hasta que se enchufe «¿Para quién es?» por reserva.
- **Sin pase:** la causa del desajuste RUTA/HOY era que la pastilla miraba el interruptor de pruebas `PAGO_ACTIVO` y HOY miraba al servidor; el pase de la cuenta de Eric NO venía del Probador. Ahora `pagoActivo()` también obedece al servidor y las dos pantallas dicen lo mismo (cambio global: cualquier candado sin versión pedida en la dirección sigue ahora al pase real).
- **Menús:** usé la hoja clara de siempre (no el cuadro oscuro de antes). «Mover a» lleva la rueda.
- **Cabecera:** el número de personas ya no sale arriba; se sigue viendo en el «por persona» del presupuesto, en la hoja de alojamiento, en el formulario de reservas, en el precio de las hojas y en la compra del pase (¿Cuántos sois?, Dúo/Grupo).
- **Foto del Castillo (§1):** ya estaba hecha en la 10O (castillo con el puente, Jean-Pol GRANDMONT, CC BY-SA 3.0); si el móvil de Eric aún muestra la terraza es caché del navegador (24 h) o un despliegue anterior.
- **«Mover a» y el Arco de Constantino (§6):** hasta ahora la app lo ponía AL FINAL del día (Eric acertaba); ahora usa `mejorHuecoEnElDia` (menos camino de más entre dos paradas; nunca el primero, así que el Arco puede quedar entre dos paradas del día del Vaticano y no al empezar).

### Dudas para Eric
1. ¿Vale la hoja clara para los menús de tres puntitos, o la quieres oscura?
2. ¿Los nombres de sitios en los avisos llevan artículo («la Fontana di Trevi») o los dejamos sin él?
3. ¿Al quitar a alguien se borran también las propuestas que ya había enviado?
4. «Mover a»: ¿vale que el Arco caiga donde menos desvío haya, aunque no sea el primero ni el último?
5. Free Tour del invitado: ¿abres ese viaje como invitado y me dices si sale? (o relajo la condición para destinos con catálogo curado).
6. ¿Dejo la ✕ de quitar gasto en el presupuesto aunque Design no la tenga?
7. Alojamiento: ¿cómo quieres que el invitado «mande su idea» al dueño?
8. ¿Basta con el aviso en Reservas y la campana cuando la entrada no cuadra, o quieres ya el botón [Proponer el cambio]?

### Lista de comprobación (el repaso final de la app)
Cada punto del prompt, en el mismo orden. La misma lista, con casillas, está arriba del todo de `docs/dias/REPASO_10N.html`.

**§0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día con DESIGN_26OCT.zip (docs/diseno/proyecto/, sin uploads/ ni screenshots/): Viaje Compartido, Presupuesto Compartido, Propuesta Cambios/Boton, Reservas v4, App Ruta y días, App Reservas y presupuesto También entraron Cuentas Grupo y Pase Fundador (10N2 y 10Q): solo el diseño, sin tocar su código.  
  *Dónde:* No es de móvil.

**§1 · Crear el viaje**

- ✅ Hecho — Foto del Castillo de Sant'Angelo en «Elige lo que siempre soñaste ver»: castillo y puente, licencia libre, fuente apuntada Ya la dejó la Tanda 10O (dia_castillo_sant_angelo_fuera.jpg, 1600 px y _p 640 px, Jean-Pol GRANDMONT, CC BY-SA 3.0, crédito en _fotos.json). El servidor la sirve para el Castillo; no hubo que descargar otra. Si el móvil de Eric aún enseña la terraza es caché del navegador (24 h, poolphoto:v2) o la versión desplegada antes de la 10O.  
  *Dónde:* Formulario › paso «Elige lo que siempre soñaste ver en Roma» › baldosa «Castillo de Sant'Angelo» (cuenta cualquiera, con o sin pase; borra los datos del sitio si sigue la vieja)

**§2 · La cabecera**

- ✅ Hecho — Fuera «Roma / 26 – 29 nov · 2 personas»; en su lugar el logo de JUTRIP (Italiana con la estrella sobre la I)  
  *Dónde:* Cualquier pestaña, arriba a la izquierda (dueño o invitado, con o sin pase)  *Captura:* `10n_cabecera_ruta.jpg`
- ✅ Hecho — La misma cabecera en todas las pestañas: logo, cartera, campana y perfil; «Sin pase (prueba)» sigue donde está RESERVAS tenía su propia cabecera (✕ + «Reservas» + cartera): ahora lleva la cabecera común y su fila ✕ + «Reservas» queda debajo sin la cartera.  
  *Dónde:* RUTA, DÍAS, EXPLORAR, HOY y RESERVAS: arriba. Con «Verme como viajero sin pase» encendido (cuenta admin) sale la etiqueta arriba al centro  *Captura:* `10n_cabecera_hoy_antes.jpg`
- ✅ Hecho — Decir dónde más se ve el número de personas del viaje Se sigue viendo en: Presupuesto (el «por persona»), hoja del alojamiento, formulario de reservas (precio por persona), HojaPrecio y la compra del pase (¿Cuántos sois? Dúo/Grupo, precioPelicula/pagoPase). El dato es personasDelViaje(route) en src/lib/useMoneda.ts; también se ve al escoger compañía en el formulario. En el código ya no hay ningún sitio de la cabecera que lo pinte (subtituloDelViaje quedó sin usar).  
  *Dónde:* RESERVAS › Presupuesto (cartera), RUTA › Pase de Roma › ¿Cuántos sois?
- ✅ Hecho — El invitado ve «Viaje de Eric» en la tarjeta del destino de RUTA, debajo de «Roma» Lo pone la tarjeta del destino de RUTA (trabajo de la parte de compartir): «Viaje de Eric» debajo de «Roma» para quien no es el dueño.  
  *Dónde:* RUTA, con la cuenta de un invitado (Puede editar o Solo recomendar), con o sin pase.  *Captura:* `10n_compartir_08_tarjeta_del_invitado.jpg`

**§2 · Cabecera (parte mía)**

- ✅ Hecho — El invitado ve «Viaje de Eric» debajo de «Roma» en la tarjeta del destino de RUTA  
  *Dónde:* RUTA, tarjeta del destino, con una cuenta invitada (no dueña)  *Captura:* `10n_compartir_08_tarjeta_del_invitado.jpg`

**§3 · Modo sin pase y [Empezar de cero]**

- ✅ Hecho — [Empezar de cero] no apaga «Verme como viajero sin pase» (no borra admin_sin_pase) Se quitó la tabla de la lista de la migración 0032 (hay que volver a pegar la 0032 en Supabase para que la base deje de borrarla) y, mientras no se haga, server/logros/reiniciar.js lee la fila antes y la devuelve después. pruebaTanda10J actualizada (admin_sin_pase pasa a «se queda»).  
  *Dónde:* Perfil › Ajustes › [Empezar de cero] con la cuenta de Eric, teniendo «sin pase» encendido en /?admin=logros: al volver, la etiqueta «Sin pase (prueba)» sigue
- ✅ Hecho — RUTA (pastilla «✓ Pase de Roma») y HOY (tarjeta con candado) dicen lo mismo; de dónde sale el pase; con «sin pase» no sale en ningún sitio Causa: la pastilla de RUTA miraba pagoActivo() (el interruptor de pruebas PAGO_ACTIVO=true, no el pase real) y HOY miraba al servidor (/api/pase/estado): con la cuenta sin pase real, RUTA decía «con» y HOY «sin». No viene del Probador. Ahora pagoActivo() también obedece al servidor (cobro encendido y sin pase = sin pase) y la pastilla usa usePaseEstado, igual que HOY. Con «sin pase» encendido siempre sale «sin».  
  *Dónde:* RUTA › pastilla del pase junto al destino y HOY (antes del viaje): cuenta de Eric tras [Empezar de cero], y con «sin pase» encendido  *Captura:* `10n_cabecera_pastilla_sin_pase.jpg`
- ✅ Hecho — Tarjeta «Durante el viaje, Hoy te dará» sale de la misma lista que el final de la película; cualquier otra lista del pase escrita aparte, a la misma HoyAntesV2 usaba una lista escrita a mano (VISTA_PREVIA); ahora pinta filasDeHoy() (listaDeHoy → listaAjustada), con 5 tarjetas y la última a todo el ancho. Búsqueda de otras listas del pase escritas aparte: no queda ninguna (HoyAntes/ListaLoQueTendras, «Todo lo que incluye» y la película ya salían de la misma).  
  *Dónde:* HOY antes del viaje (viaje con fechas futuras, sin pase o con pase)  *Captura:* `10n_cabecera_hoy_antes.jpg`

**§4 · Compartir el viaje**

- ✅ Hecho — Título «Invita a los tuyos a tu viaje a Roma» (Roma del dato)  
  *Dónde:* RUTA > [Compartir], dueño sin pase Dúo/Grupo  *Captura:* `10n_compartir_07_hoja_de_invitar.jpg`
- ✅ Hecho — Debajo del título: «Tus acompañantes verán tu ruta y podrán proponerte cambios.»  
  *Dónde:* RUTA > [Compartir], dueño  *Captura:* `10n_compartir_07_hoja_de_invitar.jpg`
- ✅ Hecho — Recuadro del código: «Invita hasta 10 personas con este código.» (confirmado: son 10); con Dúo/Grupo se queda «1 de 2 plazas del pase usadas» 10 = PLAZAS_SIN_PASE, el mismo número con el que ya se creaba la invitación  
  *Dónde:* RUTA > [Compartir], dueño (sin pase Dúo/Grupo para el texto nuevo)  *Captura:* `10n_compartir_07_hoja_de_invitar.jpg`
- ✅ Hecho — El mismo código para el mismo viaje; solo se crea otro si se gastó o se anuló; los códigos ya creados siguen valiendo Probado con la lógica (invitacionReutilizable) y la base de datos de prueba; con Supabase real hay que abrir la hoja dos veces y ver el mismo código  
  *Dónde:* RUTA > [Compartir], cerrar y volver a abrir: mismo código (dueño, cuenta real)

**§4a · Personas del viaje**

- ✅ Hecho — Tres permisos: Administrador / Puede editar / Solo recomendar, con sus reglas Reglas en la migración 0036 (SIN APLICAR) y probadas en PGlite; sin aplicarla todos los invitados cuentan como «Solo recomendar»  
  *Dónde:* Personas del viaje (caras en la tarjeta de RUTA)  *Captura:* `10n_compartir_03_personas_administrador.jpg`
- ⚠️ A medias — Administrador: único que invita, quita, cambia permisos, fechas, vuelo/alojamiento y borra Servidor: invitar, quitar, permisos y borrar solo del dueño (probado). Fechas/vuelo/alojamiento bloqueados al editor en la base de datos. Falta ocultar en la interfaz el botón de fechas y poner en gris RESERVAS para el editor (RESERVAS es de D1)  
  *Dónde:* Cuenta con «Puede editar»: intentar cambiar fechas
- ⚠️ A medias — Puede editar: toca la ruta directamente y acepta/rechaza propuestas y gastos Guardado de la ruta por el editor y decidir recomendaciones: hecho y probado en BD. La interfaz: usePermisosDelViaje ya existe para que C, D1 y D2 la usen; useModoInvitado.soloVer sigue tratando al editor como invitado (queda para quien rehaga el modo propuesta)  
  *Dónde:* Cuenta invitada con «Puede editar», DÍAS/EXPLORAR
- ⚠️ A medias — Solo recomendar: propone; sus gastos esperan Permiso y regla en BD hechos; propuesta y gastos son de C y D2  
  *Dónde:* Cuenta invitada normal
- ✅ Hecho — Todos empiezan con «Solo recomendar»  
  *Dónde:* Invitar a alguien, que entre, y mirar su etiqueta en Personas del viaje  *Captura:* `10n_compartir_03_personas_administrador.jpg`

**§4a · Tarjeta del viaje en RUTA**

- ✅ Hecho — Sin compartir: [Compartir] en champán junto a la pastilla (fuera el icono suelto) Según Eric: la pastilla dice «Pase Roma» y el botón va a su lado; bombilla y flecha juntas a la derecha  
  *Dónde:* RUTA, dueño sin compañeros  *Captura:* `10n_compartir_01_tarjeta_sin_compartir.jpg`
- ✅ Hecho — Ya compartido: caras con el número y flechita (E A L M 4 ›) que abren Personas del viaje  
  *Dónde:* RUTA, dueño con compañeros  *Captura:* `10n_compartir_02_tarjeta_compartida.jpg`
- ✅ Hecho — Invitados (Puede editar y Solo recomendar): caras con número, nunca [Compartir] ni [+ Invitar], «Viaje de Eric» debajo de «Roma»  
  *Dónde:* RUTA, cuenta invitada  *Captura:* `10n_compartir_08_tarjeta_del_invitado.jpg`

**§4a · 01 Hoja de invitar**

- ✅ Hecho — Enlace con [Copiar], código, [Compartir el enlace] y «Personas del viaje · 4 ›» El enlace es de la app (…/?invitacion=CÓDIGO), no el «jutrip.app/v/…» del dibujo  
  *Dónde:* RUTA > [Compartir], con compañeros  *Captura:* `10n_compartir_07_hoja_de_invitar.jpg`

**§4a · 02 Lista**

- ✅ Hecho — Etiquetas por permiso; al tocar a alguien, [Cambiar permiso] y [Quitar del viaje]; [+ Invitar a alguien]  
  *Dónde:* RUTA > caras > tocar a una persona (dueño)  *Captura:* `10n_compartir_04_fila_abierta.jpg`

**§4a · 03 Permiso de Ana**

- ⚠️ A medias — Hoja con los tres permisos, Administrador en gris con candado y «Solo Eric», elegido en azul oscuro con ✓, [Guardar permiso]; aviso en la campana Hoja hecha y capturada. Aviso en la campana: creado por la BD y con texto («Eric te ha dado permiso para editar el viaje a Roma»), probado en PGlite; sin Supabase real no se ha visto en el móvil  
  *Dónde:* RUTA > caras > Ana > Cambiar permiso (dueño); la campana de Ana  *Captura:* `10n_compartir_05_permiso_de_ana.jpg`

**§4a · 04 Quitar**

- ⚠️ A medias — «¿Quitar a Luis del viaje a Roma?», plaza del pase «3 de 4 usadas → Vuelve a ti», [Quitar a Luis] rojo y [Cancelar] Hoja hecha; el recuadro de la plaza sale con la 0036 y un pase de grupo (en la captura, sin Supabase, no hay recuadro)  
  *Dónde:* RUTA > caras > Luis > Quitar del viaje (dueño con pase Grupo)  *Captura:* `10n_compartir_06_quitar_a_luis.jpg`

**§4a · 04 Al quitarlo**

- ⚠️ A medias — Deja de ver el viaje enseguida (en directo), la plaza vuelve a quien la compró, lo ganado se queda Probado en BD (deja de verlo, plaza 4→3, la plaza se reasigna). El «en directo» usa Realtime: solo comprobable contra Supabase real y con la 0036  
  *Dónde:* Dos móviles: dueño quita, el otro mira el viaje abierto
- ❌ No hecho — Su propuesta sin enviar se borra; sus gastos [Para todos] aceptados se quedan No tocado: la propuesta sin enviar es local (C) y los gastos son de D2; en el servidor no se borra nada de eso. Las propuestas ya enviadas se quedan (decisión mía)  
  *Dónde:* —

**§4a · 05 Invitado**

- ✅ Hecho — Lista sin botones, «· Tú» y [Salir del viaje] con confirmación Salir devuelve la plaza (probado en BD)  
  *Dónde:* RUTA > caras, cuenta invitada  *Captura:* `10n_compartir_09_personas_invitado.jpg`

**§4a · 06 Aviso a quien quitan**

- ⚠️ A medias — En su campana: «Ya no formas parte del viaje a Roma» Aviso creado por la BD y con su texto (probado); con la app abierta, al llegar por Realtime deja de verse el viaje. No visto en móvil real  
  *Dónde:* Campana del quitado

**§4a · Administrador**

- ✅ Hecho — El administrador no puede quitarse ni salir Bloqueado en la BD y sin botón de salir en pantalla para el dueño  
  *Dónde:* RUTA > caras (dueño): no hay [Salir del viaje]

**§5 · Abrir un enlace**

- ⚠️ A medias — No pasa por «Crear viaje» ni al abrir el enlace ni al tocar [Unirme] Hecho (App no pinta «Crear viaje» con invitación en marcha, y al unirse se abre directo ese viaje). Comprobado por código; el parpadeo real hay que verlo en el móvil con un enlace de verdad  
  *Dónde:* Abrir ?invitacion=CÓDIGO con una cuenta nueva y tocar [Unirme]
- ⚠️ A medias — Ya unido, recargar o reabrir el enlace va directo al viaje; el código sale de la dirección al unirse La BD dice ya_dentro y a qué viaje ir (probado); la app abre ese viaje sin la pantalla. Hay una recarga si el viaje aún no estaba cargado. Necesita la 0036 para el caso «reabrir enlace»  
  *Dónde:* Invitado ya dentro: recargar y reabrir el enlace
- ✅ Hecho — Logo de JUTRIP pequeño, arriba y centrado, en «Eric te invita a su viaje a Roma» Sin captura propia  
  *Dónde:* Abrir un enlace de invitación sin haber entrado
- ⚠️ A medias — Compartir sin Dúo/Grupo nunca da el pase al invitado (probar con cuenta normal) Comprobado en BD (ninguna plaza en pass_members) y en el código (el pase sale solo de passes/pass_members). El pase de Eric venía de su propia cuenta de administrador/prueba, no de la invitación. Falta probarlo con dos cuentas reales  
  *Dónde:* Invitado normal: RUTA, pastilla «Pase Roma» con candado

**§6 · La propuesta**

- ✅ Hecho — Fuera [Recomendar otra ruta] y el «modo propuesta»: el invitado cambia la ruta directamente en DÍAS/EXPLORAR y cada cambio va a su propuesta  
  *Dónde:* Invitado «Solo recomienda», antes del viaje: RUTA (ya no hay botón dorado) y DÍAS: mover, quitar o añadir una parada.  *Captura:* `10n_propuesta_dias_con_lapiz.jpg`
- ⚠️ A medias — Todo lo que añade el invitado va a su propuesta (+ Añadir parada, EXPLORAR, ficha…); nunca al viaje del dueño Probado por EXPLORAR y por insertar/mover/quitar (todo cambio de la ruta se compara con la del dueño). «+ Añadir parada» y la ficha pasan por las mismas acciones del almacén pero no se pulsaron una a una en la prueba. La base de datos ya no deja al invitado escribir el viaje (RLS).  
  *Dónde:* Invitado «Solo recomienda», antes del viaje: DÍAS › «+ Añadir parada» de un día, y EXPLORAR › Entradas › «+».  *Captura:* `10n_propuesta_explorar_free_tour_invitado.jpg`
- ✅ Hecho — El aviso dice «Añadido a tu propuesta · jueves 26» con [Deshacer] que lo quita de la propuesta; el numerito del lápiz sube Las confirmaciones de EXPLORAR ahora llevan su [Deshacer] también para el invitado (antes salían sin él).  
  *Dónde:* Invitado: añade un sitio desde DÍAS o EXPLORAR y mira el aviso de abajo y el lápiz.
- ✅ Hecho — Lo añadido se ve marcado como propuesta en la ruta del invitado (borde de puntos y «Propuesta») Se marcan las paradas añadidas, llegadas de otro día y movidas. La captura de la parada marcada no está hecha (la prueba comprueba el atributo).  
  *Dónde:* Invitado: DÍAS › abre el día donde has añadido algo.
- ✅ Hecho — Botón flotante: lápiz redondo con el numerito en oro, encima del de los logros (versión A), solo tras el primer cambio, en todas las pestañas Si ya enviaste y esperas respuesta, el lápiz sigue con el número en claro para poder ver lo enviado.  
  *Dónde:* Invitado «Solo recomienda»: haz un cambio en DÍAS y mira abajo a la derecha; cambia de pestaña.  *Captura:* `10n_propuesta_dias_con_lapiz.jpg`
- ⚠️ A medias — El lápiz no tapa el botón de logros ni la última parada (espacio al final de DÍAS y EXPLORAR) Se deja un hueco de 150 px al final de DÍAS y de EXPLORAR. No comprobado en un móvil real con el viaje largo.  
  *Dónde:* Invitado con un cambio: DÍAS y EXPLORAR, baja hasta el final.
- ✅ Hecho — Fuera la barra «Tu propuesta · Ver · Enviar a Eric» BarraDePropuesta.tsx borrado.  
  *Dónde:* Invitado con cambios: no hay barra abajo.
- ✅ Hecho — Al tocar el lápiz, la hoja «Tu propuesta · N cambios» con la lista y [Enviar a Eric] siempre a mano; nunca se envía sin pasar por la lista  
  *Dónde:* Invitado con cambios: toca el lápiz.  *Captura:* `10n_propuesta_hoja_ana.jpg`
- ✅ Hecho — Un cambio por idea y en lenguaje normal, cinco tipos: orden en el mismo día, mover a otro día en UNA línea, quitar, añadir (icono y color, ›, [Deshacer]) Añadí un sexto tipo, «Cambiar X por Y», porque «Cambiar parada» ya existía.  
  *Dónde:* Invitado: haz uno de cada y abre la hoja del lápiz.  *Captura:* `10n_propuesta_hoja_ana.jpg`
- ⚠️ A medias — Detalle al tocar una línea: [Antes]/[Ahora], mapa pequeño con km, «Movida/Sale/Entra/Nueva», dos días en un cambio de día, [Deshacer este cambio] El mapa pequeño es esquemático (puntos proyectados, no Mapbox) como en Design; los km son en línea recta.  
  *Dónde:* Invitado: lápiz › toca una línea.  *Captura:* `10n_propuesta_detalle_mover_dia.jpg`
- ✅ Hecho — Dueño: [Rechazar] [Aceptar] en el detalle y luego «Aceptado ✓»/«Rechazado»  
  *Dónde:* Dueño (administrador): campana › «Ana te propone N cambios» › toca una línea.  *Captura:* `10n_propuesta_dueno_detalle.jpg`
- ⚠️ A medias — Dónde queda lo que se mueve de día: arrastrado, ese sitio; con «Mover a», donde menos hay que andar de más (lógica de mejorHueco) Hasta hoy la app lo ponía AL FINAL del día (moveStopToDay añade al final, a la hora sugerida): Eric acertaba. Ahora «Mover a» usa mejorHuecoEnElDia (nunca antes de la primera parada: esa lógica no ofrece el hueco 0, así que el Arco en el día del Vaticano irá donde menos desvío haya entre dos paradas, no necesariamente al empezar). El arrastre a un sitio concreto ya respetaba el sitio. No se tocó el motor.  
  *Dónde:* Cualquier cuenta: DÍAS › ··· de una parada › Mover a otro día; mira dónde cae.
- ✅ Hecho — La propuesta siempre enseña cómo quedan las cosas al final: mover dos veces actualiza la misma línea; devolverlo la quita; al enviar queda fija  
  *Dónde:* Invitado: mueve una parada dos veces y devuélvela; abre el lápiz.
- ⚠️ A medias — Quién acepta: administrador y quien puede editar; si dos a la vez, vale el primero Se comprueba en la app (lo ya decidido no se vuelve a decidir). Que el editor pueda escribir en la base de datos lo da la migración 0036 de B; sin aplicar.  
  *Dónde:* Dueño o editor: campana › la propuesta.
- ⚠️ A medias — Campana del dueño «Ana te propone 5 cambios en tu viaje a Roma» con la misma lista, [Aceptar]/[Rechazar] por cambio y [Aceptar todos] La hoja y los textos están hechos y probados. El texto del aviso con el número y el destino necesita la migración 0039 (SIN APLICAR); sin ella dice «te recomienda otra ruta».  
  *Dónde:* Dueño: campana › toca el aviso.  *Captura:* `10n_propuesta_dueno_ana_propone.jpg`
- ✅ Hecho — Al aceptar, el cambio se coloca donde decía o, si ese día cambió, donde mejor encaje; después «3 aceptados · 2 rechazados»  
  *Dónde:* Dueño: acepta un cambio y revisa DÍAS; reabre el aviso.  *Captura:* `10n_propuesta_dueno_decidida.jpg`
- ⚠️ A medias — Al invitado le llega «Eric ha aceptado 3 de tus 5 cambios» y, al tocarlo, su lista con cuáles sí y cuáles no Texto, hoja y apertura desde la campana hechos; el aviso real lo crea la migración 0039 (SIN APLICAR). Lo aceptado llega a su ruta por el directo de B; lo rechazado se quita de su ruta al ver la decisión.  
  *Dónde:* Invitado: campana › «Eric ha aceptado…».
- ⚠️ A medias — Durante el viaje el invitado ya no propone (sin lápiz, sin cambiar la ruta); el resto sigue igual Desde el primer día con la hora del destino (tabla corta: Roma y Cancún; el resto, la hora del teléfono). Se esconden las herramientas de editar y el menú de la parada queda en ficha y cómo llegar. No hay un cerrojo central: un cambio por una vía sin ocultar no se bloquea.  
  *Dónde:* Invitado «Solo recomienda», con viaje empezado: DÍAS, fichas y HOY.
- ⚠️ A medias — El día antes, con cambios sin enviar, aviso en la campana «Tienes 2 cambios sin enviar a Eric…» El cliente avisa al servidor (POST /api/avisos/sin-enviar) y el texto está; el tipo sin_enviar lo deja la 0035 (sin aplicar). No probado con base de datos real.  
  *Dónde:* Invitado con cambios sin enviar, el día antes del viaje: campana.
- ✅ Hecho — Propuesta a medias sobre algo que el dueño quitó o cambió: se ajusta, el cambio sin sentido sale marcado y se quita (ajustarPropuestaAlViaje) Función pura, llamada desde hydrateTrip (también cuando llega el directo de B).  
  *Dónde:* Invitado con cambios; el dueño quita una parada que el invitado había movido; abre el lápiz.  *Captura:* `10n_propuesta_a_medias.jpg`

**§6a · Free Tour del invitado**

- ⚠️ A medias — El invitado ve el Free Tour en EXPLORAR igual que el dueño; añadirlo a un día es un cambio de su propuesta No he podido reproducir el fallo: con la ruta de pruebas freeTourAvailable da true para el invitado y el Free Tour sale en Entradas (el catálogo no depende de la cuenta). Posible causa real: la ruta guardada del viaje de Eric sin curatedId en 2 días. Sin ese dato no he cambiado la condición. Con el motor, el Free Tour rehace los días: para el invitado queda como varios cambios de su propuesta.  
  *Dónde:* Invitado: EXPLORAR › Entradas.  *Captura:* `10n_propuesta_explorar_free_tour_invitado.jpg`

**§6b · Puntitos y rayitas**

- ✅ Hecho — Quien solo recomienda: sin los tres puntitos del día; administrador y quien puede editar, como estaba  
  *Dónde:* DÍAS con tres cuentas: administrador, editor e invitado «Solo recomienda».
- ✅ Hecho — Las rayitas ≡ para arrastrar días solo para administrador y quien puede editar; qué pasaba hoy si un invitado cambiaba el orden de los días Hasta hoy el invitado «solo mirar» no tenía las rayitas (data-edit-tool); en una cuenta de invitado sin ese modo (la de Eric) reordenaba los días en SU teléfono, sin guardarlos (la base de datos no le deja) y sin que el dueño lo supiera. Ahora no las tiene.  
  *Dónde:* DÍAS: mira el borde izquierdo de cada día con las tres cuentas.

**§6c · Menús de tres puntitos desde abajo**

- ✅ Hecho — Menús del día y de la parada, la confirmación y «Mover a» salen como la hoja (tirador, ✕, se cierran deslizando o tocando fuera) Nuevas piezas: ui/MenuHoja.tsx (MenuHoja, HojaDelMenu, OpcionHoja), Hoja con prop baja y cierre deslizando por el tirador (vale para todas las hojas), ConfirmDialog reescrito sobre Hoja (lo usan también «Recuperar este día», fechas, excursiones). Estilo: la hoja clara de siempre (no el cuadro oscuro de antes).  
  *Dónde:* DÍAS › «···» de un día o de una parada (dueño o con permiso de edición)  *Captura:* `10n_cabecera_menu_parada.jpg`
- ✅ Hecho — Arriba, el nombre de lo que se toca; hoja baja; opciones una debajo de otra El día muestra «Sábado 17 · título del día»; la parada, su nombre. La hoja baja ocupa menos de la mitad de la pantalla (comprobado en la prueba).  
  *Dónde:* DÍAS › «···» de un día  *Captura:* `10n_cabecera_menu_dia.jpg`
- ✅ Hecho — «Mover a» con una ruedita (como la hora del iPhone), «Ahora: jueves 26» arriba y [Mover aquí] debajo Nuevo dayDetail/MoverADia.tsx sobre TimeListWheel (tipo lista). Los días de excursión entera y el de vuelta no salen en la rueda. La lista antigua ListaDeDias se queda solo en HOY («Pasarla a otro día»).  
  *Dónde:* DÍAS › «···» de una parada › Mover a otro día  *Captura:* `10n_cabecera_mover_a.jpg`
- ✅ Hecho — Confirmación «¿Seguro que quieres eliminar…?» como hoja Día: «¿Eliminar el …?» con ConfirmDialog; parada: «¿Seguro que quieres eliminar «X»?» [Cancelar] [Sí, eliminar].  
  *Dónde:* DÍAS › «···» de un día (que no sea el de llegada) › Eliminar día  *Captura:* `10n_cabecera_confirmar_dia.jpg`
- ✅ Hecho — En toda la app, cualquier otro menú de tres puntitos que salga en medio de la pantalla Revisado: solo existían los de DÍAS (día y parada, también BreakCard/TrazoCards que usan el mismo StopMenu) y el del invitado (MenusDelInvitado.tsx, convertido; C lo ha reducido/retirado por su parte).  
  *Dónde:* DÍAS

**§7 · «Cambiar hora»**

- ✅ Hecho — Quitar «Cambiar hora» de las opciones de cada parada, para todos También se quitaron «Poner hora» y «Quitar hora» de los días libres (misma razón: la app ya no enseña horas).  
  *Dónde:* DÍAS › «···» de una parada  *Captura:* `10n_cabecera_menu_parada.jpg`

**§8 · RESERVAS del invitado**

- ✅ Hecho — Misma pantalla de RESERVAS que la del dueño (mismos bloques, datos, Falta/Listo); fuera la pantalla pobre  
  *Dónde:* Invitado (sessionStorage trazo:invitado=1 en dev): pestaña Reservas  *Captura:* `10n_reservas_invitado_gris.jpg`
- ✅ Hecho — Donde hay un dato, sale el dato (vuelo, alojamiento, entrada con día y hora) Comprobado con alojamiento y entradas; el vuelo usa el mismo componente que el dueño (no probado con un vuelo cargado).  
  *Dónde:* Invitado: Reservas > abrir Llegada y vuelta / Alojamiento / Entradas  *Captura:* `10n_reservas_invitada_incluida.jpg`
- ✅ Hecho — Campos y botones de editar en gris y sin poder tocarlos; al tocar, «Esto lo cambia Eric»  
  *Dónde:* Invitado: Reservas > Llegada y vuelta > tocar «Llega» o un botón  *Captura:* `10n_reservas_invitado_gris.jpg`
- ✅ Hecho — Fuera «Esto es lo que ha reservado Eric. Aquí solo se mira.»  
  *Dónde:* Invitado: Reservas  *Captura:* `10n_reservas_invitado_gris.jpg`
- ✅ Hecho — Llegada y vuelta en gris  
  *Dónde:* Invitado: Reservas > Llegada y vuelta  *Captura:* `10n_reservas_invitado_gris.jpg`
- ⚠️ A medias — Alojamiento en gris si el dueño lo ha puesto; si no, [Buscar alojamiento] activo y guardar solo el dueño Gris y Buscar activo comprobados. Guardar bloqueado para el invitado con un aviso corto («El alojamiento lo guarda Eric»); NO se le manda la idea al dueño (falta decidir el canal: propuesta de C).  
  *Dónde:* Invitado: Reservas > Alojamiento  *Captura:* `10n_reservas_invitado_gris.jpg`
- ⚠️ A medias — Entradas, Free Tour y excursiones activos para el invitado Entradas y Free Tour comprobados; excursiones usan sus propias reservas por el mismo mecanismo pero sin prueba específica.  
  *Dónde:* Invitado: Reservas > Entradas y Free Tour / Excursiones  *Captura:* `10n_reservas_invitado_misma_hora_tarjeta.jpg`
- ⚠️ A medias — Si el dueño tiene entrada de ese sitio: sale su día y hora y [Reservar la mía a la misma hora] con día y hora ya elegidos El día y la hora llegan elegidos a la hoja; el botón abre la tienda externa (no admite fecha) y luego se guarda aquí con [Guardar].  
  *Dónde:* Invitado no incluido: Reservas > Entradas > Coliseo > [Reservar la mía a la misma hora]  *Captura:* `10n_reservas_invitado_misma_hora_compra.jpg`
- ✅ Hecho — «¿Para quién es?» en el formulario de la entrada, solo en viaje compartido; sin compartir, como ahora  
  *Dónde:* Dueño con gente en el viaje: Reservas > Entradas > Coliseo > Añádela  *Captura:* `10n_reservas_dueno_para_quien.jpg`
- ✅ Hecho — Pastillas por persona (marcada en oscuro con ✓), después de la ruedita y antes del precio, «2 de 4»; bajan de fila si no caben El dueño no se puede desmarcar.  
  *Dónde:* Dueño con gente: formulario de la entrada  *Captura:* `10n_reservas_dueno_para_quien.jpg`
- ✅ Hecho — Reservas anteriores al compartir cuentan como «solo para mí» y el dueño puede editarlas Sin paraQuien = solo el dueño; al pulsar Cambiar se abre con solo el dueño marcado.  
  *Dónde:* Dueño: Reservas > una entrada ya reservada > Cambiar
- ✅ Hecho — Botón [Guardar · …] del formulario en champán Ya era champán en la app (clase btn-champan); comprobado por estilo calculado.  
  *Dónde:* Dueño: formulario de la entrada  *Captura:* `10n_reservas_dueno_sin_compartir.jpg`
- ✅ Hecho — Más espacio entre secciones del formulario  
  *Dónde:* Dueño: formulario de la entrada  *Captura:* `10n_reservas_dueno_para_quien.jpg`
- ✅ Hecho — Fuera «Lo que pagaste en total, todas las personas.» Solo en el formulario de la entrada; la hoja de precio del vuelo (HojaPrecio) conserva su texto. El presupuesto por personas marcadas es de D2 (el campo paraQuien está disponible).  
  *Dónde:* Dueño: formulario de la entrada  *Captura:* `10n_reservas_dueno_sin_compartir.jpg`
- ✅ Hecho — La ruta es una: la parada pasa al día y la hora de esa reserva para todos Mecanismo de siempre (reservedId en la ruta del dueño); no se tocó el motor.  
  *Dónde:* Dueño y invitado: pestaña Días  *Captura:* `10n_reservas_dias_etiqueta_incluida.jpg`
- ⚠️ A medias — DÍAS: etiqueta corta «Reservada ✓» (verde) para incluidos y «Comprar entrada» (frambuesa) para no incluidos Solo en viajes con gente; sustituye a la pestañita del icono. El detalle «Eric va el jueves 26 a las 8:00» está en la ficha (Entradas). Sin ver la ficha en captura.  
  *Dónde:* Invitado: Días > abrir el día del Coliseo > esquina de la tarjeta  *Captura:* `10n_reservas_dias_etiqueta_no_incluido.jpg`
- ⚠️ A medias — Campana del incluido: «Eric ha reservado el Coliseo para ti: jueves 26, 8:00.» Se calcula en el móvil a partir de las reservas del viaje (no se crea un aviso en el servidor: falta la clave de servicio de Supabase); no llega como notificación al móvil.  
  *Dónde:* Invitado incluido: campana de la cabecera (Días o Ruta)
- ⚠️ A medias — Campana del no incluido con [Reservar la mía a la misma hora] y [Ya la tengo] Igual que el anterior (calculado en el móvil). [Ya la tengo] abre la hoja de añadir partiendo del día y hora del dueño.  
  *Dónde:* Invitado no incluido: campana  *Captura:* `10n_reservas_campana_no_incluido.jpg`
- ✅ Hecho — Al leerlo deja de contar y se queda en la lista  
  *Dónde:* Invitado: campana > Marcar como leído
- ⚠️ A medias — Lo que compre el invitado es suyo: sale en SU RESERVAS, no en la del dueño Se guarda en el móvil (y en la tabla reservas_invitado si Eric aplica la migración 0038, SIN aplicar). Sin la migración no viaja entre dispositivos.  
  *Dónde:* Invitado: guardar la suya; luego mirar como dueño  *Captura:* `10n_reservas_invitado_la_suya.jpg`
- ⚠️ A medias — Aviso «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26» y poder proponer el cambio El aviso sale en Reservas y en la campana. NO hay botón [Proponer el cambio]: la propuesta es de C; falta enganchar.  
  *Dónde:* Invitado con su entrada en otro día: Reservas > Entradas, y campana  *Captura:* `10n_reservas_invitado_no_cuadra.jpg`

**§9 · El presupuesto compartido**

- ✅ Hecho — 01 · el presupuesto de Ana: «de Eric» arriba, «Del grupo · 600 € · 300 € por persona» con el ojo  
  *Dónde:* Invitada (con o sin pase): cartera de arriba > Presupuesto. Toca el ojo para ver «300 € por persona».  *Captura:* `10n_presupuesto_01_ana.jpg`
- ✅ Hecho — 01 · Extras: cada gasto con «Pagó Eric · Para todos»; el suyo pendiente en amarillo «Pendiente de Eric»; los suyos con ojo tachado y «Solo para ti»; [+ Añadir gasto] Cada gasto lleva una ✕ pequeña para quitarlo (solo los propios; el administrador y quien puede editar quitan los del grupo): Design no la dibuja, pero hacía falta para poder borrar.  
  *Dónde:* Invitada: Presupuesto > bloque Extras.  *Captura:* `10n_presupuesto_01_ana.jpg`
- ✅ Hecho — 02 · el de Eric: «Eric y Ana» arriba, sus gastos «Solo para ti»  
  *Dónde:* Dueño: cartera > Presupuesto, con al menos una persona invitada en el viaje.  *Captura:* `10n_presupuesto_02_eric.jpg`
- ✅ Hecho — 03 · Ana añade [Para todos]: hoja con nombre, precio, [Para todos] [Para mí], «Se lo enviamos a Eric», «¿Quién lo ha pagado?» y [Enviar a Eric]; queda «Pendiente de Eric» Junto al precio hay un selector de moneda pequeño (el € por defecto), como el formulario de siempre.  
  *Dónde:* Invitada «Solo recomendar»: Presupuesto > [+ Añadir gasto].  *Captura:* `10n_presupuesto_03_ana_para_todos.jpg`
- ✅ Hecho — 04 · Ana añade [Para mí]: «Solo lo ves tú», sin «¿Quién lo ha pagado?», [Añadir gasto]; entra directo y solo lo ve ella Privacidad comprobada en la base de datos (PGlite con la 0037): ni el dueño ni nadie lo ve.  
  *Dónde:* Invitada: [+ Añadir gasto] > [Para mí].  *Captura:* `10n_presupuesto_04_ana_para_mi.jpg`
- ✅ Hecho — 05 · Eric añade [Para todos]: «Entra directo en el presupuesto», con «¿Quién lo ha pagado?»; también tiene [Para mí]  
  *Dónde:* Dueño: [+ Añadir gasto].  *Captura:* `10n_presupuesto_05_eric_para_todos.jpg`
- ✅ Hecho — 06-08 · campana de Eric: «Ana quiere añadir al presupuesto» con el gasto dentro y [Rechazar] [Aceptar] en el mismo aviso; luego «✓ Aceptado · suma al grupo» o «Rechazado»; se queda en la lista Solo comprobado con servidor de mentira en la pantalla y con PGlite en la base de datos; el trayecto real por la red (Supabase) no se ha podido probar sin aplicar la 0037.  
  *Dónde:* Dueño: campana de arriba (con una invitada que haya mandado un gasto [Para todos]).  *Captura:* `10n_presupuesto_06_eric_campana.jpg`
- ✅ Hecho — 07 · después de aceptar: «✓ Aceptado · suma al grupo»  
  *Dónde:* Dueño: campana > [Aceptar].  *Captura:* `10n_presupuesto_07_eric_aceptado.jpg`
- ✅ Hecho — 08 · después de rechazar: «Rechazado»  
  *Dónde:* Dueño: campana > [Rechazar].  *Captura:* `10n_presupuesto_08_eric_rechazado.jpg`
- ✅ Hecho — 09 · Ana tras aceptar: «Pagó Ana · Para todos», verde un momento, suben total y «por persona»  
  *Dónde:* Invitada con la app abierta en el presupuesto mientras el dueño acepta.  *Captura:* `10n_presupuesto_09_ana_aceptado.jpg`
- ✅ Hecho — 10 · Ana tras rechazar: «Eric prefirió no sumarlo · ahora solo para ti»  
  *Dónde:* Invitada con la app abierta mientras el dueño rechaza.  *Captura:* `10n_presupuesto_10_ana_rechazado.jpg`
- ✅ Hecho — Aviso a Ana SIEMPRE en su campana («Eric ha aceptado tu gasto · Cena día 1 · 30 € · ya suma en el grupo» / «…ha preferido no sumar tu gasto… se queda solo para ti») Lo crea un disparador de la base de datos (0037), con la app abierta o cerrada. El aviso al móvil (push) usa el mismo texto pero no se ha probado con PUSH_ACTIVO.  
  *Dónde:* Invitada: campana de arriba.  *Captura:* `10n_presupuesto_11_ana_campana.jpg`
- ⚠️ A medias — Además, con la app abierta: la franja de arriba que se va sola y el cambio en directo Hecho con Realtime de Supabase (canal sobre trip_gastos) + lectura cada 20 s y al volver a la app; la franja y el cambio están probados con un servidor de mentira. Realtime por la red real solo se verá con la 0037 aplicada en Supabase.  
  *Dónde:* Invitada con la app abierta en cualquier pantalla mientras el dueño acepta/rechaza.  *Captura:* `10n_presupuesto_09_ana_aceptado.jpg`
- ✅ Hecho — Permisos: [Para todos] de quien puede editar entra directo; los de «Solo recomendar» esperan; los aceptan administrador o quien puede editar (a todos les llega el aviso; vale lo del primero) Probado en la base de datos con Eric, Luis (editar), Ana y Marta (recomendar). Usa trip_members.permiso de la 0036: sin ella solo decide el administrador.  
  *Dónde:* Con una cuenta «Puede editar»: Presupuesto > [+ Añadir gasto] (entra directo). Con «Solo recomendar»: espera.
- ✅ Hecho — «¿Quién lo ha pagado?» se guarda (una o varias personas); «¿Entre quién?» y quién le debe a quién, NO (10N2) Se guarda como lista de personas (pagado_por). Las pastillas admiten marcar a más de una.  
  *Dónde:* [+ Añadir gasto] > [Para todos].  *Captura:* `10n_presupuesto_03_ana_para_todos.jpg`
- ⚠️ A medias — El «por persona» solo de los gastos del grupo, nunca de los [Para mí] Hecho para billetes, alojamiento, reservas y gastos [Para todos]. Las reservas todas cuentan como del grupo: cuando D1 guarde «¿Para quién es?» en cada reserva, el reparto por personas marcadas hay que enchufarlo aquí.  
  *Dónde:* Presupuesto con el ojo; añade un [Para mí]: el «por persona» no se mueve.  *Captura:* `10n_presupuesto_04_ana_para_mi.jpg`
- ✅ Hecho — Extras en nuestro azul de Extras, con la cartera en el apartado y en cada gasto El pendiente lleva un reloj amarillo y el «solo para ti» un ojo tachado (como Design). La cartera del apartado también sale ahora en el Extras de un viaje sin compartir.  
  *Dónde:* Presupuesto > Extras.  *Captura:* `10n_presupuesto_01_ana.jpg`
- ✅ Hecho — Precios «334 €» con el símbolo detrás Todo sale del formateador de la app; la prueba 6z2 sigue en verde.  
  *Dónde:* Presupuesto y campana.  *Captura:* `10n_presupuesto_01_ana.jpg`
- ✅ Hecho — Sin compartir, el presupuesto se queda como ahora (sin [Para todos]/[Para mí] ni «¿Quién lo ha pagado?») También se queda así si la 0037 no está aplicada (la app lo detecta).  
  *Dónde:* Dueño sin invitados: cartera > Presupuesto.  *Captura:* `10n_presupuesto_12_sin_compartir.jpg`

**§10 · En directo**

- ⚠️ A medias — Con la app abierta, el cambio del dueño llega solo, con la línea «Eric ha cambiado el viaje.» Realtime de Supabase (trips, trip_members, avisos) + refresco al volver y cada 30 s; lógica probada con un bus de mentira. La red de Realtime solo se prueba contra Supabase real con la 0036  
  *Dónde:* Dos móviles: el dueño quita un día, el invitado mira RUTA
- ⚠️ A medias — Siempre un aviso en la campana, en lenguaje normal (ha quitado 2 días, ha añadido X al sábado 28, ha cambiado las fechas); varios se juntan; al tocarlo lleva a la ruta ya cambiada Textos y unión probados en BD. Los nombres van sin artículo («ha añadido Fontana di Trevi al sábado 28»)  
  *Dónde:* Campana del invitado, tocar el aviso
- ✅ Hecho — Con la app cerrada, al abrir carga el viaje de ahora; nunca hay que recargar La carga de siempre más el refresco al volver a la app  
  *Dónde:* Cerrar la app del invitado, cambiar el viaje, abrirla
- ⚠️ A medias — Una propuesta a medias sobre algo que el dueño quitó sale marcada Dejo el evento y el almacén useViajeEnDirecto (días y paradas quitadas) y la función cambiosEntreRutas; marcarlo en la propuesta es de C  
  *Dónde:* Invitado con propuesta a medias
- ✅ Hecho — Cuando el dueño acepta una propuesta, el invitado ve la ruta cambiada en directo Aceptar guarda la ruta y eso dispara el mismo cambio en directo (sin Supabase real no visto)  
  *Dónde:* Dos móviles
- ⚠️ A medias — Los cambios de quien puede editar llegan a todos (también al administrador) con su aviso Probado en BD (aviso a todos menos al autor, incluido el dueño). El editor guarda solo ruta y lista de deseos  
  *Dónde:* Cuenta «Puede editar» cambia algo; mirar el dueño

**§11 · Elegir una cosa u otra**

- ✅ Hecho — Componente compartido: lo elegido en azul oscuro #1C2230 con texto claro e icono en oro; lo no elegido en blanco con borde fino ui/Elegir.tsx: InterruptorElegir y PastillaElegir (API documentada en el fichero; D1 y D2 ya lo usan).  
  *Dónde:* EXPLORAR, Reservas, presupuesto  *Captura:* `10n_cabecera_elegir_explorar.jpg`
- ✅ Hecho — [Recomendados] [Cerca de ti] de EXPLORAR con este estilo; pruebas actualizadas También el mismo par en «Añadir parada» (AddStopScreen) y el [Roma | Excursión] del día con excursión (DayInterruptorSwitch). pruebaTanda10O_datos actualizada. Dejados como estaban: pestañas de la ficha (ya en oscuro), selectores del formulario (ya en tinta), y listas de una fila (Moneda, título, días a cambiar).  
  *Dónde:* EXPLORAR › Atracciones (arriba); DÍAS › + Añadir parada; día 4 con excursión  *Captura:* `10n_cabecera_elegir_explorar.jpg`
- ✅ Hecho — «¿Para quién es?» de Reservas y «¿Quién lo ha pagado?» del presupuesto Las dos usan las pastillas de Elegir.tsx (azul oscuro con ✓ en oro).  
  *Dónde:* RESERVAS › añadir entrada (viaje compartido); presupuesto › añadir gasto

**§12 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N (cabecera, compartir, propuesta, reservas y presupuesto) 418 comprobaciones · 0 fallos (cabecera 59, compartir 97, propuesta 59, reservas 55, presupuesto 148); las tres partes que dieron «no ha dado resultado» en una pasada eran la pantalla de «ruta rápida» de un Vite con horas abierto: con un Vite recién arrancado pasan.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y solo pasa solo, se dice) En la batería completa fallaron 14 pruebas. Siete eran expectativas antiguas que la 10N cambió a propósito (la cabecera con logo, la cartera única, la hoja de confirmar, «Hoy te dará» con la lista de la película, la cartera del invitado y el menú de «Mover a»): ya actualizadas, pasan solas. Las demás (pruebaJutrip, pruebaTanda10B, pruebaTanda10P_sorteo y los tres envoltorios 10O, 10P y 10N) fallaron por carga o por la pantalla de ruta rápida; solas pasan todas con 0 fallos. Quedan a arreglar más adelante, como se pidió.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil  
  *Dónde:* Esta página.

**§13 · El informe**

- ✅ Hecho — Apartado «10N» en docs/dias/INFORME_TANDA10B.md, con lo que no se ha podido hacer igual que en Design, y esta lista al final  
  *Dónde:* No es de móvil.


## 10N2 · Las cuentas del grupo (quién le debe a quién)

Prompt en `docs/dias/PROMPT_TANDA10N2.md`. Prueba: `scripts/destino/pruebaTanda10N2.mjs` (cinco partes: la cuenta pura, PGlite con la 0040 y cinco cuentas, las pantallas en SSR, el código y la pantalla real a tamaño de móvil con un servidor de mentira; **133 · 0 fallos**). Capturas `docs/dias/capturas_jutrip/10n2_*.jpg` (12) y la página `docs/dias/REPASO_10N2.html`, con la lista de comprobación con casillas arriba del todo. **No se ha tocado el motor de rutas.** Hecha por el mismo agente que el presupuesto compartido de la 10N.

### Lo que Eric tiene que hacer
Aplicar `supabase/migrations/0040_cuentas_del_grupo.sql` en el editor SQL de Supabase (SIN APLICAR; va después de la 0036 y la 0037, y de toda la cadena 0035-0039 de la 10N). Crea `trip_gastos.entre`, las tablas `trip_pagos` y `trip_ex_miembros`, el aviso `pago_marcado`, añade los pagos a Realtime y vuelve a crear `empezar_de_cero`. Sin ella: las cuentas se calculan igual (gastos entre todos), pero no hay botón [Ya está pagado] y quien salió del viaje saldría como «Alguien».

### Decisiones y diferencias con Design
- El «a partes iguales» es en la moneda del viajero (euros por defecto): lo que está en otra moneda se pasa con el cambio del día; sin cambio no cuenta (no se inventa un número).
- «Para quedar en paz» usa el reparto voraz (el que más debe paga al que más le deben): como mucho n−1 pagos. En el ejemplo de Design da Marta 60 €, Luis 15 € y Ana 15 € a Eric. Los céntimos que sobran al repartir (100 € entre 3), a quien pagó, así cuadra al céntimo.
- En la tarjeta del presupuesto la primera deuda es la mayor (Marta 60 € a Eric), no «Ana 15 €» como el ejemplo del prompt.
- Las líneas pagadas salen arriba con «✓ Pagado» y «Deshacer» debajo (Design no dibuja el deshacer). El saldo = pagado − le toca + enviado − recibido, que reproduce la pantalla 05 de Design (Eric +75, Ana 0 € ✓).
- Si no todos tienen lo mismo (alguien desmarcado), no se pone «a partes iguales» ni «por persona».
- «Estáis en paz» solo con al menos un gasto contado; sin gastos dice «Todavía no hay gastos del grupo».
- El aviso del pago, a deudor y acreedor: si lo marca un tercero (administrador o quien puede editar), les llega a los dos con el texto adaptado.
- Tocar un gasto del grupo en Extras lo abre para editarlo; los pendientes y los [Para mí] no se editan desde ahí.

### Lo que no está hecho igual o está a medias
- Lo reservado para varios cuenta solo en las entradas del dueño con «¿Para quién es?» (las paga el administrador). Billetes, alojamiento, seguro y coche no entran. Probado con datos, no en pantalla con una reserva real.
- El directo (Realtime por la red real) y el aviso al móvil no se han podido probar sin la 0040 aplicada; la pantalla y la base de datos se probaron con servidor de mentira y PGlite.

### Dudas para Eric
1. ¿Las cuentas deben incluir también billetes, alojamiento y coche, o solo gastos y entradas para varios?
2. ¿Se queda «Deshacer» bajo «✓ Pagado», aunque Design no lo dibuje?
3. Quien salió del viaje ya no puede marcar pagos (no ve nada): lo marca el administrador. ¿Vale?

### Lista de comprobación (el repaso final de la app)
Cada punto del prompt, en el mismo orden. La misma lista, con casillas, está arriba del todo de `docs/dias/REPASO_10N2.html`.

**§0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N2.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design: Piezas/Cuentas Grupo (ya puesta al día con DESIGN_26OCT.zip en la 10N)  
  *Dónde:* No es de móvil.

**§1 · ¿Entre quién?**

- ✅ Hecho — En la hoja de añadir un gasto [Para todos], debajo de «¿Quién lo ha pagado?», «¿Entre quién?» con una pastilla por persona, todas marcadas por defecto y «4 de 4» a la derecha, con el estilo de elegir  
  *Dónde:* Presupuesto (cartera) > Extras > [+ Añadir gasto] > [Para todos]. Cualquier permiso (administrador, puede editar o solo recomienda).  *Captura:* `10n2_02_entre_los_4.jpg`
- ✅ Hecho — Debajo, la línea «30 € cada uno», que cambia al desmarcar a alguien («3 de 4 · 40 € cada uno») Sin importe escrito, la línea pide escribirlo.  
  *Dónde:* Misma hoja: escribe un importe y toca una pastilla de «¿Entre quién?» para desmarcarla.  *Captura:* `10n2_03_entre_3_luis_desmarcado.jpg`
- ✅ Hecho — A partes iguales y en euros entre los marcados; los céntimos que sobren (100 € entre 3) al que lo pagó, para que las cuentas cuadren al céntimo Se cuenta en la moneda del viajero (euros por defecto): lo que está en otra moneda se pasa con el cambio del día; sin cambio no cuenta. Probado: 100 € entre 3 = 33,33 + 33,33 + 33,34 y la suma de saldos es 0.  
  *Dónde:* Cuentas del grupo (presupuesto > tarjeta «Cuentas del grupo»): «Ha pagado… · Le toca…».  *Captura:* `10n2_04_cuentas_del_grupo.jpg`
- ⚠️ A medias — Lo reservado para varios en RESERVAS («¿Para quién es?») cuenta igual: lo pagó quien lo añadió y se reparte entre los marcados Hecho para las entradas del dueño con `paraQuien` (las paga el administrador, que es quien las guarda en el viaje). Billetes, alojamiento, seguro y coche no entran en las cuentas (no tienen «¿Para quién?»). Probado con datos, no en pantalla con una reserva real.  
  *Dónde:* RESERVAS > añadir una entrada con precio y marcar a dos personas; luego Presupuesto > Cuentas del grupo (con la cuenta del administrador).
- ✅ Hecho — Los gastos [Para mí] no cuentan en las cuentas del grupo; los «Pendiente de…» tampoco, hasta que se aceptan Tampoco cuentan los rechazados.  
  *Dónde:* Presupuesto > Cuentas del grupo: añade un [Para mí] o uno pendiente y mira que el total no cambia.
- ✅ Hecho — Se puede editar un gasto [Para todos] después (quién lo pagó, entre quién, el importe): quien lo añadió, el administrador y los que pueden editar Se toca el gasto en Extras. En la base de datos lo hacen solo esas tres personas (probado con 4 cuentas).  
  *Dónde:* Presupuesto > Extras > tocar un gasto del grupo (administrador, puede editar, o quien lo añadió).  *Captura:* `10n2_09_editar_gasto.jpg`

**§2 · La pantalla «Cuentas del grupo»**

- ✅ Hecho — 01 · Debajo de «Del grupo», la tarjeta «Cuentas del grupo» con las caras y la primera deuda («Ana le debe 15 € a Eric») o «Estáis en paz»; solo en viaje compartido La primera deuda es la mayor. Si no hay gastos, dice «Todavía no hay gastos del grupo».  
  *Dónde:* Presupuesto (cartera de arriba), con un viaje que tenga al menos otra persona. Cualquier permiso.  *Captura:* `10n2_01_presupuesto_tarjeta.jpg`
- ✅ Hecho — 04 · «4 personas · a partes iguales», arriba «Total del grupo 600 € · 150 € por persona»  
  *Dónde:* Presupuesto > tocar la tarjeta «Cuentas del grupo».  *Captura:* `10n2_04_cuentas_del_grupo.jpg`
- ✅ Hecho — 04 · Cada persona con «Ha pagado 240 € · Le toca 150 €» y su saldo en verde con «+», en rojo con «−» o «0 € ✓»  
  *Dónde:* Misma pantalla.  *Captura:* `10n2_04_cuentas_del_grupo.jpg`
- ✅ Hecho — 04 · «Para quedar en paz»: lo mínimo de pagos para dejar a todos a cero, cada uno con [Ya está pagado] Reparto voraz (el que más debe paga al que más le deben): con n personas, como mucho n−1 pagos.  
  *Dónde:* Misma pantalla, abajo.  *Captura:* `10n2_04_cuentas_del_grupo.jpg`
- ✅ Hecho — Si no todos tienen lo mismo (¿Entre quién?), «Le toca» es lo de cada uno y arriba solo el total (sin «por persona») Tampoco pone «a partes iguales» en ese caso.  
  *Dónde:* Añade un gasto [Para todos] desmarcando a alguien en «¿Entre quién?» y abre Cuentas del grupo.
- ✅ Hecho — 05 · Al tocar [Ya está pagado]: la línea en verde con «✓ Pagado» y cambian los saldos  
  *Dónde:* Cuentas del grupo > [Ya está pagado] en una línea.  *Captura:* `10n2_05_ana_ya_ha_pagado.jpg`
- ✅ Hecho — 05 · Lo puede tocar quien paga, quien cobra, el administrador o los que pueden editar Un «solo recomienda» que no es parte del pago no ve el botón; y la base de datos también lo impide.  
  *Dónde:* Con la cuenta de Ana (solo recomienda) ve solo su línea con botón; con el administrador, las tres.  *Captura:* `10n2_11_cuentas_vistas_por_ana.jpg`
- ✅ Hecho — 05 · Al otro le llega a la campana «Eric ha marcado como pagados los 15 € que le debías.» Aviso nuevo `pago_marcado` (el servidor y el móvil usan el mismo texto). Si lo marca una tercera persona, les llega a los dos; el texto cambia («Luis ha marcado como pagados los 20 € que le debías a Eric.»).  
  *Dónde:* Con la cuenta de Ana: campana de arriba tras marcar Eric el pago.  *Captura:* `10n2_08_campana_de_ana.jpg`
- ✅ Hecho — 05 · Se puede deshacer Con «Deshacer» bajo «✓ Pagado» (quien paga, quien cobra, el administrador y quien puede editar).  
  *Dónde:* Cuentas del grupo > «Deshacer» en una línea pagada.  *Captura:* `10n2_05_ana_ya_ha_pagado.jpg`
- ✅ Hecho — 06 · Todos en paz: todos a «0 € ✓» y la tarjeta verde «Estáis en paz» La tarjeta del presupuesto también pasa a verde con «Estáis en paz».  
  *Dónde:* Marca los tres pagos en Cuentas del grupo.  *Captura:* `10n2_06_todos_en_paz.jpg`
- ✅ Hecho — Lo ve todo el grupo, con cualquier permiso  
  *Dónde:* Con la cuenta de Ana (solo recomienda): Presupuesto > Cuentas del grupo.  *Captura:* `10n2_11_cuentas_vistas_por_ana.jpg`
- ⚠️ A medias — En directo: si alguien añade un gasto o marca un pago, a los demás les cambia sin recargar Realtime de Supabase sobre gastos y pagos, más lectura cada 20 s y al volver a la app. Probado con un servidor de mentira que avisa del cambio; Realtime por la red real solo se verá con la 0040 aplicada.  
  *Dónde:* Dos móviles: uno con Cuentas del grupo abierta; el otro marca un pago.
- ✅ Hecho — Si alguien sale del viaje o lo quitan, sus gastos y lo que le tocaba se quedan en las cuentas, con su nombre Un disparador guarda su nombre al salir o al quitarlo (`trip_ex_miembros`); en las cuentas sale con «Ya no está en el viaje». Si no puso ni le toca nada, no sale. Sin la 0040 saldría como «Alguien».  
  *Dónde:* Administrador: quita a alguien en Personas del viaje y abre Cuentas del grupo.  *Captura:* `10n2_10_quien_sale_sigue.jpg`
- ✅ Hecho — Sin compartir, ni la tarjeta ni la pantalla Tampoco con la 0037 sin aplicar. Con la 0040 sin aplicar, las cuentas se ven (gastos entre todos) pero sin botón de marcar pagos.  
  *Dónde:* Dueño sin invitados: Presupuesto.  *Captura:* `10n2_12_sin_compartir.jpg`

**§3 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N2 133 comprobaciones · 0 fallos (cuenta pura, PGlite con la 0040, pantallas en SSR, código y pantalla real a tamaño de móvil).  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y solo pasa solo, se dice) La prueba 10N2 pasó en la batería completa. Fallaron (por carga o por la pantalla de ruta rápida, no por la tanda) pruebaJutrip, pruebaRevisionLargos, pruebaTanda10B, 10G, 10H, 10I, 10M_app, 10N_presupuesto, 10P_sorteo y los envoltorios 10P y 10N; repetidas solas pasan todas con 0 fallos (10P: 3625; 10N: 418). Se arreglan más adelante, como se pidió.  
  *Dónde:* No es de móvil.

**§3 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil  
  *Dónde:* Esta página.

**§4 · El informe**

- ✅ Hecho — Apartado «10N2» en docs/dias/INFORME_TANDA10B.md, con lo que no se ha podido hacer igual que en Design, y esta lista al final  
  *Dónde:* No es de móvil.


## 10N3 · Lo que quedó a medias de la 10N y las respuestas de Eric

Prompt en `docs/dias/PROMPT_TANDA10N3.md`. Prueba: `scripts/destino/pruebaTanda10N3.mjs` (editar 45, avisos 20, reservas 31, cuentas 63, apertura 207, perfil 61 y la prueba contra Supabase real 47: 474 comprobaciones · 0 fallos). Capturas en `docs/dias/capturas_jutrip/10n3_*.jpg` y página `docs/dias/REPASO_10N3.html` (con la lista de comprobación con casillas arriba del todo). **No se ha tocado el motor de rutas.** Por petición de Eric, no se ha pasado la batería completa en esta tanda: solo las pruebas de la tanda, la de la 10N y `pruebaJutrip`. Hecha con seis agentes y revisada aquí.

### Lo que Eric tiene que hacer: aplicar cinco migraciones nuevas en Supabase (SIN APLICAR), en este orden
- `0041_quitar_borra_propuestas.sql`: quitar o salir borra las propuestas enviadas sin decidir de esa persona.
- `0042_avisos_entradas_servidor.sql`: los avisos de las entradas del dueño (incluido, no incluido, «no cuadra») los crea el servidor.
- `0043_cuentas_admin_todo.sql`: **arregla un fallo real**: quien sale del viaje seguía pudiendo editar y quitar sus gastos y deshacer sus pagos; además, el administrador lo toca todo en las cuentas.
- `0044_perfil_foto_portadas.sql`: el encuadre de la foto del perfil y las portadas, en la cuenta.
- `0045_aviso_propuesta_a_editores.sql`: la propuesta del invitado avisa también a quien puede editar (antes solo al dueño). Se renombró de 0043 para no chocar con la de las cuentas.

### Lo que se probó contra Supabase REAL (tres cuentas anónimas de prueba, borradas al acabar)
Funcionó: las migraciones 0032-0040 existen y responden sin error; solo el dueño cambia permisos y a quien se lo cambian le llega su aviso; el editor guarda la ruta y no cambia fechas, vuelo ni borra el viaje; quien solo recomienda no escribe; el cambio de un editor llega en la campana de los demás (`viaje_cambiado`); la propuesta llega al dueño, el editor la acepta y a quien la hizo le llega «aceptada»; quitar (deja de ver el viaje y recibe «Ya no formas parte del viaje a Roma»), el administrador no se puede quitar ni salir, y salir no se puede dos veces; el directo (Realtime) con dos clientes. **Encontró y arregló un fallo real:** los cambios seguidos se juntan actualizando el aviso en lugar de crear otro, así que Realtime no emitía ningún INSERT y el aviso no llegaba en directo; ahora se escuchan todos los eventos de `avisos`.
**No se pudo comprobar contra Supabase real:** crear y canjear una invitación (exigen una cuenta de verdad con email, no anónima; solo se comprobó el rechazo), la plaza del pase que vuelve (necesita un cobro real), los gastos aceptado y rechazado, el directo con dos NAVEGADORES (solo dos clientes), y las migraciones 0041-0045 (nuevas, sin aplicar). Eso se probó con PGlite y las migraciones reales.

### Las respuestas de Eric, aplicadas
1. **Hoja clara** en los menús de tres puntitos: se queda.
2. **Avisos con artículo:** el artículo se resuelve al escribir el texto («ha añadido la Fontana de Trevi al sábado 28»; «ha quitado los Museos Capitolinos») con la tabla de artículos de Roma, que ya cubría los 94 sitios; sin artículo si un sitio no está. Igual en la campana y en el aviso del móvil.
3. **Quitar a alguien:** sus propuestas enviadas sin decidir se borran (0041); las decididas se quedan; la propuesta sin enviar se borra del móvil la próxima vez que abra la app.
4. **«Mover a» y el Arco:** vale lo que ya hace (menos desvío; nunca el primero de un día con paradas).
5. **Free Tour del invitado:** sin tocar; a la espera de que Eric lo pruebe.
6. **La ✕ para quitar un gasto:** se queda.
7. **Alojamiento del invitado:** fuera «mandarle la idea»: solo [Buscar alojamiento] para mirar; si algo le abre la hoja «Tu alojamiento», se cierra con «Esto lo cambia Eric».
8. **[Proponer el cambio]:** en el aviso «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26»: para quien solo recomienda es un cambio más de su propuesta; para quien puede editar, [Moverlo al viernes 27] directo.
**10N2:** el alojamiento y el coche entran solos en las cuentas (el administrador los paga, repartidos entre todos con «¿Entre quién?»; los billetes, no; aviso si ya hay un gasto igual); «Deshacer» se queda; el administrador lo puede tocar todo, también lo de quien salió.

### Lo hecho
- **«Puede editar» en la pantalla:** `useModoInvitado.soloVer` ya solo vale para quien solo recomienda. El editor toca la ruta como el administrador, sin lápiz ni propuesta, y acepta o rechaza propuestas y gastos desde la campana. No ve el botón de las fechas (apagado), RESERVAS de llegada y vuelta ni alojamiento en gris, ni invitar, quitar, cambiar permisos o borrar.
- **Por persona:** una reserva para 2 de 4 cuenta solo entre esos 2; si ya no hay un único «por persona», la píldora dice «tu parte».
- **Avisos de entradas desde el servidor** (0042), sin duplicar con los del móvil; **la compra del invitado** viaja entre sus móviles (0038).
- **Lápiz y última parada:** con un día de 18 paradas a 390 px no tapa nada en DÍAS ni EXPLORAR; en RESERVAS sí tapaba «Comprar» y «Añadir»: arreglado.
- **Película de la apertura (es la película del pase):** el mapa y las tarjetas de las paradas a casi todo el ancho (margen de 14 px), los textos de abajo más arriba y enteros con la barra de Safari, en todas las escenas; probado a 390×664, 430×932 y 360×640 (no en un iPhone real).
- **Perfil:** el viejo ya no se cuela (se ve el perfil nuevo vacío mientras llegan los datos); la esquina del pasaporte lleva dos sellos (de muestra, o los dos últimos ganados); 70 px entre el pasaporte y «Mis viajes»; la foto se ajusta al círculo del emblema (un dedo, dos dedos, [Guardar]) y se ve igual en el emblema, la cabecera y «Personas del viaje»; portada de cada viaje (el Coliseo de día para Roma) con «Cambiar portada» (una foto de su viaje, de su galería, o volver a la del destino) y, al acabar el viaje, la primera foto suya; fuera «Abierto».
- **«Abierto» quería decir** «este es el viaje que tienes cargado ahora mismo en la app», y salía aunque no estuviera «En curso». Sigue en el perfil viejo (solo con los logros apagados), porque una prueba antigua lo exige.

### Lo que no está igual o está a medias
- No se ha borrado el perfil viejo (`PerfilSheet` y piezas): con los logros apagados, que es lo que hay hoy en producción, es el único perfil.
- Las fotos de perfil ya subidas antes son cuadradas: solo se pueden mover y acercar, no alejar más allá del cuadrado. La subida de la foto de galería al almacén `perfiles` no está probada.
- La portada por defecto de París (y de cualquier destino sin fotos propias) pide su foto al servidor de fotos o queda en degradado: no se ha probado.
- La película: «más grande» a fondo solo en la escena del mapa; en las demás, el alto manda y la escala sube poco; quedan bordes oscuros laterales en las escenas con fondo propio de 390 (colección, pasaporte, fotos), que ya existían.
- El aviso «no cuadra» creado por el servidor no se recalcula si luego el dueño mueve la parada (lo sigue avisando el móvil al abrir). Los avisos de entradas y de «sin enviar» no se han visto en pantalla con la 0042 aplicada.
- `route.cuentasEntre` (el «¿Entre quién?» del alojamiento y el coche) solo lo escribe el administrador.
- Las pruebas `pruebaPantallas8c` (4 fallos) y `pruebaTanda10I` en un puerto distinto del 5173 fallan por cosas ajenas a esta tanda; no se compararon con un estado anterior.

### Dudas para Eric
1. Las fechas del viaje quedan bloqueadas también para quien solo recomienda (antes solo lo estaba el editor): ¿es lo que quieres?
2. ¿Quito «Abierto» también del perfil viejo (solo con los logros apagados)? Obliga a cambiar una prueba antigua.
3. «Tu parte» en lugar del «por persona» cuando hay reservas para parte del grupo: ¿mejor otra cosa (p. ej. el «por persona» medio)?
4. ¿Borramos ya el perfil viejo? Hoy solo lo usa quien tiene los logros apagados.
5. Free Tour del invitado: ¿lo has probado con tu viaje?

### Lista de comprobación (el repaso final de la app)
Cada punto del prompt, en el mismo orden. La misma lista, con casillas, está arriba del todo de `docs/dias/REPASO_10N3.html`.

**§0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N3.md y en el commit  
  *Dónde:* No es de móvil.

**§0 · Supabase real**

- ✅ Hecho — Migraciones 0032 y 0033-0040 aplicadas y sin error al probar Comprobado contra Supabase real: funciones de la 0036, tablas de 0037-0040 y la columna decisiones (0039) existen y responden. Ninguna da error  
  *Dónde:* No se mira en el móvil
- ⚠️ A medias — Código de invitación que se repite (el mismo código para el mismo viaje) Real: el dueño ve su invitación vigente y otra cuenta no ve las del viaje. crear_invitacion/canjear_invitacion exigen cuenta de verdad (no anónima) y rechazan a las anónimas; con cuentas anónimas no se pueden probar de verdad. Probado en PGlite y con el cliente  
  *Dónde:* RUTA > Compartir dos veces, dueño con cuenta de email: mismo código
- ✅ Hecho — Permisos: cambiar permiso y su aviso en la campana Real: solo el dueño cambia permisos; a Luis le llega el aviso «permiso» y lo lee con sus propias reglas  
  *Dónde:* Campana del invitado al que el dueño cambia el permiso
- ✅ Hecho — Quitar a alguien: deja de ver el viaje, aviso «Ya no formas parte» Real: el invitado lo ve antes y deja de verlo al quitarlo; le llega el aviso. Un editor no quita y el administrador no puede quitarse ni salir  
  *Dónde:* Personas del viaje > quitar, y la campana del quitado
- ⚠️ A medias — Plaza del pase que vuelve al quitar o salir No probado en real: hace falta un pase de verdad (se crea con un cobro). Sí está en PGlite  
  *Dónde:* Dueño con pase Grupo: quitar a alguien y ver «3 de 4 usadas»
- ✅ Hecho — Salir del viaje Real: sale, deja de verlo y no puede salir dos veces  
  *Dónde:* Personas del viaje > Salir del viaje, cuenta invitada
- ✅ Hecho — Avisos de la campana: permiso, quitado, viaje_cambiado, recomendación/aceptada Real: los cinco llegan. Los gastos (gasto_pendiente/resuelto) no los probé: son de D2  
  *Dónde:* Campana de cada cuenta
- ✅ Hecho — El directo (Realtime) con dos clientes escuchando a la vez Real: el cambio de Luis llega al dueño en directo (trips) y los avisos también. Falló una vez y lo arreglé: los avisos seguidos de la misma persona se juntan actualizando el aviso, no creando otro; ahora se escuchan también esas actualizaciones. Con dos navegadores de verdad no lo he visto, con dos clientes de Supabase sí  
  *Dónde:* Dos móviles: el dueño cambia algo, el otro mira RUTA

**§1 · «Puede editar» en la pantalla**

- ✅ Hecho — Quien puede editar toca la ruta como el administrador: DÍAS, EXPLORAR, añadir, mover, quitar y las rayitas de los días, sin lápiz ni propuesta Ya funcionaba en la ruta desde la 10N (usePuedeCambiarLaRuta); lo que seguía mal era useModoInvitado.soloVer, que lo trataba como invitado: ahora solo vale para quien solo recomienda. Comprobado en la prueba (reordenar, quitar, mover a otro día, puntitos y rayitas, EXPLORAR, sin lápiz).  
  *Dónde:* Cuenta «Puede editar»: pestañas DÍAS (··· de la parada y rayitas de los días) y EXPLORAR (añadir un sitio); no sale el lápiz  *Captura:* `10n3_editar_editor_explorar.jpg`
- ⚠️ A medias — Acepta o rechaza propuestas y gastos desde la campana Hecho en la app (la hoja «Ana te propone N cambios» con [Aceptar]/[Rechazar] y la etiqueta dorada del día ahora salen también para quien puede editar; los gastos ya los decidía puedeEditar). Falta APLICAR la migración 0045: sin ella el aviso de la propuesta en la campana sigue llegando solo al dueño. La parte de base de datos no se ha probado contra Supabase.  
  *Dónde:* Cuenta «Puede editar», con una propuesta pendiente de un invitado: campana, o etiqueta «1 recomendación» en la tarjeta del día en RUTA  *Captura:* `10n3_editar_editor_decide_propuesta.jpg`
- ✅ Hecho — No ve el botón de las fechas (apagado), ni RESERVAS de llegada y vuelta ni el alojamiento (en gris) El botón de fechas de la cabecera del mapa sale apagado y el calendario no se abre desde ningún sitio (también para quien solo recomienda). Llegada, vuelta y alojamiento en gris como antes.  
  *Dónde:* Cuenta «Puede editar»: RUTA (arriba, destino y fechas, sin responder al toque) y RESERVAS (Llegada y vuelta, Alojamiento)  *Captura:* `10n3_editar_editor_ruta_fechas_fijas.jpg`
- ✅ Hecho — No puede invitar, quitar, cambiar permisos ni borrar el viaje En «Personas del viaje» solo tiene [Salir del viaje]; en «Mis viajes» el viaje ajeno es «Salir de este viaje», no borrar.  
  *Dónde:* Cuenta «Puede editar»: RUTA › caras de las personas del viaje; Perfil › Mis viajes  *Captura:* `10n3_editar_editor_personas.jpg`

**§2 · Duda 1**

- ✅ Hecho — Los menús de tres puntitos: la hoja clara está bien Se queda la hoja clara.  
  *Dónde:* DÍAS › tres puntitos de un día o de una parada.

**§2 · Duda 4**

- ✅ Hecho — «Mover a» y el Arco de Constantino: donde menos desvío haya, sin quedar en medio de una visita larga Usa la misma lógica que añadir un sitio (mejorHuecoEnElDia: nunca el primero de un día con paradas). Lo de «en medio de una visita larga» sale de ese cálculo; no hay una regla aparte para las visitas largas.  
  *Dónde:* DÍAS › tres puntitos de una parada › Mover a (cualquier cuenta que pueda editar).

**§2 · Duda 5**

- ✅ Hecho — El Free Tour del invitado: Eric lo prueba y dice; mientras, se deja como está Sin cambios. Pendiente de que Eric abra su viaje como invitado y diga si falta.  
  *Dónde:* EXPLORAR › Entradas, con la cuenta del invitado.

**§2 · Duda 6**

- ✅ Hecho — La ✕ para quitar un gasto: se queda Se queda tal como estaba.  
  *Dónde:* RUTA › cartera › Extras, con la cuenta que añadió el gasto o con el administrador.

**§2 · Duda 2**

- ✅ Hecho — Avisos con artículo («ha añadido la Fontana de Trevi al sábado 28») El artículo se pone en shared/avisos/textos.js con la tabla data/logros/articulos.json, que el servidor carga: el mismo texto en la campana y en el aviso del móvil. La tabla ya tenía los 94 sitios de Roma. Sin artículo si no está  
  *Dónde:* Campana del invitado, aviso «ha cambiado el viaje: ha añadido…»
- ✅ Hecho — Coherencia con la línea «Eric ha cambiado el viaje.» Esa línea no nombra ningún sitio, así que no lleva artículo  
  *Dónde:* Arriba del móvil del invitado, cuando el dueño cambia algo

**§2 · Duda 3**

- ⚠️ A medias — Quitar a alguien borra sus propuestas enviadas sin decidir; las decididas se quedan Migración 0041 hecha y probada en PGlite (también al salir uno mismo). SIN APLICAR: la aplica Eric  
  *Dónde:* Dueño: quitar a quien tenía una propuesta sin decidir; mirar la campana
- ✅ Hecho — Su propuesta sin enviar se borra de su móvil la próxima vez que abra la app Al abrir la app, con los viajes cargados, se borran las propuestas guardadas de viajes que ya no ve (y al dejar de verlo en directo). Probado en lo puro; no visto en un móvil real  
  *Dónde:* Cuenta quitada: abrir la app tras tener una propuesta a medias

**§2 · Duda 7**

- ✅ Hecho — Alojamiento del invitado: [Buscar alojamiento] para mirar, sin «mandarle la idea» al dueño En el mapa de alojamientos ya no sale «¿Ya tienes alojamiento? Añádelo» para quien no es el dueño; si algo le abre la hoja «Tu alojamiento», se cierra con «Esto lo cambia Eric». El aviso «El alojamiento lo guarda Eric» se ha quitado.  
  *Dónde:* Cuenta «solo recomendar» o «puede editar»: RESERVAS › Alojamiento › [Buscar alojamiento]  *Captura:* `10n3_editar_invitado_mapa_alojamiento.jpg`

**§2 · Duda 8**

- ✅ Hecho — [Proponer el cambio] (solo recomienda) y [Moverlo al viernes 27] (puede editar) en el aviso «Tu entrada del Coliseo es el viernes 27…» PropuestaHost escucha trazo:proponer-cambio-reserva: mueve la parada al día de la entrada (propuesta de quien recomienda: un cambio más y el lápiz sube; editor: directo con Deshacer). Probado con el evento; el aviso real del servidor depende de la migración 0042 (D1), no probado contra Supabase.  
  *Dónde:* Campana, aviso «Tu entrada del Coliseo es el … y en la ruta está el …» (solo recomendar: [Proponer el cambio]; puede editar: [Moverlo al …])  *Captura:* `10n3_editar_proponer_cambio_coliseo.jpg`

**§2b · Dudas de la 10N2**

- ✅ Hecho — El alojamiento y el coche entran solos en las cuentas: el precio que el administrador pone en RESERVAS cuenta como pagado por él y repartido entre todos los del viaje Se toma de las líneas del presupuesto (hotel de cada tramo con noches, y coche de alquiler), convertidas a la moneda del viajero. Sin precio en RESERVAS no entra nada (no se inventa).  
  *Dónde:* Presupuesto (cartera) > tarjeta «Cuentas del grupo». Sección «Entra solo desde RESERVAS». Con cualquier cuenta del viaje; el precio lo pone el administrador en RESERVAS.  *Captura:* `10n3_cuentas_01_hotel_y_coche_entran_solos.jpg`
- ✅ Hecho — …con «¿Entre quién?» para cambiarlo, como un gasto más Botón [Entre quién] en cada línea, solo para el administrador; se guarda con el viaje (`route.cuentasEntre`). Si lo ponen todos, vuelve a «entre todos». Quien puede editar no lo cambia (el viaje solo lo guarda el administrador).  
  *Dónde:* Cuentas del grupo > «Entra solo desde RESERVAS» > [Entre quién] (cuenta del administrador).  *Captura:* `10n3_cuentas_02_entre_quien_del_hotel.jpg`
- ✅ Hecho — Los billetes de avión, no (cada uno paga el suyo) Ida y vuelta no entran en las cuentas; tampoco seguro, eSIM ni traslados (no se pidió).  
  *Dónde:* Presupuesto con billetes con precio: el total de «Cuentas del grupo» no los suma.  *Captura:* `10n3_cuentas_01_hotel_y_coche_entran_solos.jpg`
- ✅ Hecho — Que no se cuente nada dos veces: si ya hay un gasto [Para todos] igual, avísalo Aviso amarillo «Puede que algo esté contado dos veces» en la pantalla de cuentas (mismo importe y concepto parecido: nombre incluido o «hotel/alojamiento», «coche/alquiler»). Avisa pero sigue contando los dos.  
  *Dónde:* Cuentas del grupo (cualquier cuenta): apunta un gasto [Para todos] «Hotel…» con el mismo importe que el alojamiento.  *Captura:* `10n3_cuentas_04_aviso_contado_dos_veces.jpg`
- ✅ Hecho — «Deshacer» bajo «✓ Pagado»: se queda Sin cambios (ya estaba en la 10N2).  
  *Dónde:* Cuentas del grupo > línea pagada > «Deshacer» (quien paga, quien cobra, administrador o puede editar).  *Captura:* `10n3_cuentas_06_admin_marca_y_deshace.jpg`
- ✅ Hecho — El administrador lo puede tocar todo en las cuentas: marcar un pago como hecho y deshacerlo Ya lo permitían las reglas de la 0040; probado también con pagos de quien ya salió. La 0043 (SIN APLICAR) hace que el aviso de ese pago solo llegue a quien sigue en el viaje.  
  *Dónde:* Cuentas del grupo > [Ya está pagado] y «Deshacer» en cualquier línea (cuenta del administrador).  *Captura:* `10n3_cuentas_06_admin_marca_y_deshace.jpg`
- ✅ Hecho — …y editar cualquier gasto del grupo (quién lo pagó, entre quién y el importe), también los de quien ya salió del viaje En la hoja de editar, quien salió sigue saliendo con su nombre en las pastillas. FALLO ENCONTRADO Y ARREGLADO en la 0043: quien salía del viaje seguía pudiendo editar y quitar sus propios gastos; ahora no (los suyos se quedan para las cuentas). Sin la 0043 ese fallo sigue en Supabase.  
  *Dónde:* Presupuesto > Extras > tocar un gasto de alguien que salió (cuenta del administrador; también «puede editar»).  *Captura:* `10n3_cuentas_05_admin_edita_gasto_de_quien_salio.jpg`

**§3 · Lo demás**

- ⚠️ A medias — Aviso «Eric ha reservado el Coliseo para ti: …» creado por el servidor (disparador SQL sobre la reserva del viaje) y que llegue a la campana, también con la app cerrada Hecho y probado con PGlite y las migraciones reales (incluida la 0042); la 0042 está SIN aplicar: Eric la aplica. Sin ella, el móvil sigue calculándolo. Con la app cerrada llega como cualquier aviso (cola del aviso del móvil, solo con PUSH_ACTIVO); no probado contra Supabase real.  
  *Dónde:* Invitado marcado en «¿Para quién es?» (cuenta real con el viaje compartido): campana de la cabecera, aviso sin leer
- ⚠️ A medias — Aviso para los no incluidos con [Reservar la mía a la misma hora] y [Ya la tengo] El servidor crea el aviso (caso no_incluido) y la campana lo pinta con los dos botones (AvisoDeEntrada), que abren RESERVAS con día y hora del dueño. Botones comprobados por código y en la prueba de pantalla antigua (aviso calculado en el móvil); el del servidor en pantalla no se ha visto sin la 0042 aplicada.  
  *Dónde:* Invitado NO marcado: campana de la cabecera
- ✅ Hecho — No se duplican con lo que ya calcula el móvil El móvil no calcula el aviso de una reserva si la lista de la cuenta ya trae uno con el mismo reserva_id; en el servidor, la clave impide repetirlo aunque se guarde igual dos veces. Si el dueño cambia la hora, llega uno nuevo (a propósito).  
  *Dónde:* Invitado: campana, un solo aviso por entrada
- ⚠️ A medias — Aviso «Tu entrada del Coliseo es el viernes 27, y en la ruta está el jueves 26» creado por el servidor, con sitio, día de la reserva, día de la ruta y la acción Se crea al guardar el invitado su entrada (disparador sobre reservas_invitado). Si luego el dueño mueve la parada, el servidor no lo recalcula (lo sigue avisando el móvil al abrir). [Proponer el cambio] lanza el evento trazo:proponer-cambio-reserva con los datos (reservaId, sitio, diaDeLaReserva, diaDeLaRuta, dateIso); lo engancha E1.  
  *Dónde:* Invitado con su entrada en otro día: campana y Reservas > Entradas
- ✅ Hecho — Lo que compra el invitado, guardado en su cuenta con la 0038 (viaja entre sus móviles) Probado con PGlite (0038 real): guardar, recuperar en otro móvil, que lo quitado no vuelva y subir lo hecho sin conexión; solo lo lee su dueña (RLS). No probado contra Supabase real (la 0038 la aplicó Eric).  
  *Dónde:* Invitado con cuenta: guardar su entrada en un móvil y abrir el viaje en otro

**§3 · Lo demás que quedó a medias**

- ✅ Hecho — El «por persona» con «¿Para quién es?»: una reserva para 2 de 4 cuenta solo entre esos 2 Cuando todo es entre todos, el «por persona» es el de siempre. Si hay una entrada para 2 de 4, un gasto «entre 3» o el hotel entre unos pocos, la píldora dice «tu parte» (lo que te toca a ti), porque ya no hay un único «por persona». Una reserva sin «¿Para quién es?» cuenta solo para el administrador.  
  *Dónde:* Presupuesto con una entrada marcada para 2 personas (RESERVAS > añadir entrada > «¿Para quién es?»): el ojo de la tarjeta oscura dice «… € tu parte». Con cualquier cuenta.  *Captura:* `10n3_cuentas_07_tu_parte_con_para_quien_es.jpg`
- ⚠️ A medias — «Eric ha cambiado el viaje.» y la propuesta a medias marcada cuando el dueño quita lo que el invitado había propuesto Ya estaba enchufado (CompartidoHost pinta la línea tras Realtime/refresco; hydrateTrip → alLlegarElViaje marca «ya no está en la ruta» con su ✕). Probado el marcado en la pantalla; la línea con Realtime real no se ha visto con dos móviles en esta prueba.  
  *Dónde:* Cuenta «solo recomendar» con un cambio sin enviar (p. ej. quitar el Panteón) y el dueño quitándolo: lápiz › lista  *Captura:* `10n3_editar_propuesta_a_medias_marcada.jpg`
- ✅ Hecho — El lápiz no tapa la última parada ni el botón de los logros en 390 px con un día largo En DÍAS (día de 18 paradas) y EXPLORAR ya había hueco. En RESERVAS el lápiz tapaba los últimos botones («Comprar»/«Añadir»): arreglado con el mismo hueco al final.  
  *Dónde:* Cuenta «solo recomendar» con algún cambio hecho: DÍAS (abrir un día largo, bajar al final) y RESERVAS (bajar al final)  *Captura:* `10n3_editar_lapiz_dia_largo_final.jpg`

**§3b · Película de la apertura**

- ✅ Hecho — Más grande: el mapa y las tarjetas de las paradas, casi a todo el ancho, con margen pequeño a los lados, adaptado al ancho de cada móvil y sin deformarse Escena del mapa: mapa, filas de llegada/salida y tarjetas de paradas con 14 de margen por lado (a 390, 430 y 360 de ancho, medido). El escenario se escala igual en ancho y alto. La ruta con sus pines no se estira (se quedaría deformada): va centrada dentro del mapa más ancho. Las demás escenas (HOY, colección, pasaporte, fotos) siguen a su tamaño de Design, solo algo mayor que antes (escala 0,85 en vez de 0,83 a 390x664).  
  *Dónde:* Abre la app sin sesión (pantalla de inicio / [Ver] de la película del pase) y mira la primera escena, «Tú decides el viaje». Cualquier cuenta.  *Captura:* `10n3_apertura_escena_1.jpg`
- ✅ Hecho — Los textos de abajo, un poco más arriba, con separación clara de la última tarjeta y sin pegarse al borde de abajo Los textos empiezan justo bajo lo último de arriba (y=608 de 780) y nunca bajan del borde: aire mínimo de 16 px abajo medido a 390x664, 430x932 y 360x640. Separación mínima de 10 px con lo de arriba, comprobada en la prueba. Sin iPhone real: medido en Chrome emulando 390x664.  
  *Dónde:* En el móvil, con la barra de Safari: escena 1 (Tú decides el viaje. Nosotros lo ordenamos.). Cualquier cuenta.  *Captura:* `10n3_apertura_escena_1.jpg`
- ✅ Hecho — Los textos se ven enteros en un móvil de 390 de ancho con la barra de Safari (≈ 390x664) Medido a 390x664, 430x932 y 360x640 en las 8 escenas: ningún texto cortado por el borde visible. Pendiente de que Eric lo mire en su iPhone (no se ha probado en un iPhone real).  
  *Dónde:* iPhone con Safari y su barra visible: recorre la película entera.  *Captura:* `10n3_apertura_escena_2.jpg`
- ✅ Hecho — Lo mismo en todas las escenas de la película Escenas 1 mapa, 2 HOY, 3 mapa del mundo, 4 emblema secreto, 5 colección, 6 pasaporte, 7 fotos y resumen, 8 final. Arreglado de paso: HOY y pasaporte tapaban su texto (se recogen un 7 %), el emblema secreto estaba pegado a la izquierda (ahora centrado) y su aviso quedaba cortado abajo. Quedan visibles unos bordes oscuros a los lados en escenas con fondo propio de 390 de ancho (colección, pasaporte, fotos), que ya estaban antes.  
  *Dónde:* Película completa, todas las escenas. Cualquier cuenta.  *Captura:* `10n3_apertura_escena_4.jpg`

**§3b · El perfil**

- ✅ Hecho — 2. El perfil viejo se cuela al abrir el perfil: que no salga nunca; mientras llegan los datos, el perfil nuevo vacío; quitar el viejo del código si ya no se usa Con los logros encendidos el perfil viejo ya no sale NUNCA: mientras llegan los datos (o si no llegan) se ve el perfil nuevo vacío (huecos gris claro, «Hola, Eric» ya puesto) con «Mis viajes» de este móvil debajo. La prueba mira cada 60 ms con la respuesta retrasada 3,5 s y con la respuesta que no llega: 0 muestras con el viejo. NO he borrado PerfilSheet/CabeceraDeSiempre/FilaDeViaje/MapaMisViajes: con los logros APAGADOS (hoy es el caso de producción, VITE_LOGROS_ACTIVOS sin poner) siguen siendo el único perfil que existe; borrarlo dejaría a todos sin perfil.  
  *Dónde:* Perfil (círculo de arriba a la derecha) con una cuenta con los logros encendidos: debe verse el esqueleto gris un instante y luego el perfil con EXP, billete, vitrina y pasaporte, sin mapa grande ni «1 país · 1 lugar».  *Captura:* `10n3_perfil_01_abriendo.jpg`
- ✅ Hecho — 3. La tarjeta de «Mi pasaporte»: la esquina de la hoja lleva dos sellos estampados (redondo azul y cuadrado verde de Roma, como P1); sin sellos del viajero dos de muestra; con los suyos los dos últimos; el círculo del mapa se pinta con lo visitado Sin sellos: el redondo azul y el cuadrado verde de Roma (decoración, con fechas de muestra). Con uno solo: el suyo y uno de muestra. Con dos o más: los dos últimos que ha ganado. El mapa del círculo ya se pintaba con paises_iso (comprobado: 6 países pintados con el demo, 1 con solo Italia); no he tocado esa parte. Ojo: la tarjeta lee el servidor (perfil.pasaporte); la prueba lo ha comprobado con los logros de mentira, no con Supabase real.  
  *Dónde:* Perfil › tarjeta granate «Mi pasaporte», esquina inferior derecha. Con una cuenta sin viajes hechos: dos sellos de muestra; con sellos ganados: los dos últimos.  *Captura:* `10n3_perfil_02_pasaporte_sin_sellos.jpg`
- ⚠️ A medias — 4. La foto del perfil dentro del emblema: al tocarla ajustarla al círculo (mover con el dedo, pinch, [Guardar]) y cambiarla por otra; lo ajustado se guarda en la cuenta y se ve igual en todos los sitios Hecho y probado: al tocar el emblema se abre «Tu perfil» con la foto en un círculo grande (un dedo mueve, dos dedos acercan, barra de zoom y rueda como alternativa), [Hacer una foto] / [Elegir de la galería] para cambiarla, y [Guardar] aplica el encuadre. La foto ya no se recorta a un cuadrado al subirla (se guarda entera, lado largo 384 px); el encuadre (x, y, zoom) se guarda aparte. Un único componente (FotoEncuadrada) lo pinta en el emblema, Avatar, caras de «Personas del viaje»/cabecera de viaje y la hoja de ajustar: la prueba comprueba que los cuatro dan la misma posición relativa. FALTA/NO COMPROBADO: (1) el guardado en la CUENTA y que los demás lo vean exige aplicar la migración 0044 (sin ella se guarda solo en este móvil y no falla); (2) no probado contra Supabase real; (3) las fotos ya subidas antes son cuadradas (solo se pueden mover/acercar, no alejar más allá del cuadrado); (4) los avatares cuadrados redondeados de la campana (AvisoDeEntrada/AvisoDeGasto/ListaDeAvisos) NO los he tocado porque los edita otro agente: siguen con la foto centrada.  
  *Dónde:* Perfil › tocar el círculo con tu foto (arriba a la izquierda) › mover y pellizcar › Guardar. Después mira Perfil, y con un viaje compartido «Personas del viaje». Con una cuenta con foto propia o de Google.  *Captura:* `10n3_perfil_03_foto_ajustada_en_el_emblema.jpg`
- ✅ Hecho — 5. «Mis viajes» más separado de «Mi pasaporte»: unos 70 px de margen Medido en la pantalla: 70 px entre el borde de abajo de la tarjeta del pasaporte y el título «Mis viajes» (18 del hueco de siempre + 52).  
  *Dónde:* Perfil, bajando hasta la tarjeta granate: debajo, un hueco claro antes de «Mis viajes».  *Captura:* `10n3_perfil_02_pasaporte_sin_sellos.jpg`
- ⚠️ A medias — 6a. Portada por defecto: una foto bonita del destino (Roma una de Roma, París una de París), con licencia libre y crédito; la misma para todos los viajes a ese sitio Roma: el Coliseo de día (public/fotos/roma/dia_coliseo_p.jpg, David Libeert, Unsplash) con su crédito en letra pequeña en la tarjeta. Es la única ciudad con fotos propias en public/fotos/, así que París y cualquier otro destino piden su foto al servidor de fotos de la app (Unsplash/Wikipedia con su crédito) y, si no hay, queda el degradado de siempre. Eso último NO lo he podido comprobar (no hay servidor de fotos con clave en la prueba).  
  *Dónde:* Perfil › Mis viajes: la tarjeta de un viaje a Roma con la foto del Coliseo; un viaje a otro sitio con su foto o el degradado.  *Captura:* `10n3_perfil_04_mis_viajes_portada_destino.jpg`
- ⚠️ A medias — 6b. El viajero puede cambiar la portada: «Cambiar portada» con dos opciones (una de sus fotos del viaje o una de su galería) y volver a la del destino Cada tarjeta lleva un botón «Cambiar portada» (arriba a la izquierda) que abre una hoja con: Una foto de tu viaje (cuadrícula con las fotos de sus paradas), Una foto de mi galería, y Volver a la del destino. Hecho exactamente como un botón en la tarjeta, no al tocar la tarjeta entera (tocar la tarjeta sigue abriendo el viaje/álbum, como antes). Se guarda por persona y viaje en este móvil y, con la migración 0044, en la cuenta (travelers.portadas). Probado con fotos de mentira de las paradas (sin Supabase real); la subida de la foto de galería al almacén perfiles solo se usa con la cuenta encendida y NO la he probado contra Supabase (sin cuenta se guarda la foto pequeña en el móvil).  
  *Dónde:* Perfil › Mis viajes › «Cambiar portada» en la tarjeta de un viaje. Con una cuenta con fotos hechas en las paradas del viaje.  *Captura:* `10n3_perfil_06_cambiar_portada.jpg`
- ✅ Hecho — 6c. Al acabar el viaje, si tiene fotos suyas y no ha elegido portada, sale sola la primera de sus fotos (y la puede cambiar) Viaje ya hecho, sin portada elegida y con fotos suyas: sale la primera (día más bajo, la más antigua). La puede cambiar, y si elige «la del destino» no se le vuelve a cambiar. Un viaje hecho sin fotos suyas se queda con la del destino. Probado con fotos de mentira.  
  *Dónde:* Perfil › Mis viajes › «Ya hechos»: un viaje acabado con fotos tuyas en sus paradas, sin haber tocado «Cambiar portada».  *Captura:* `10n3_perfil_05_mis_viajes_portada_viajero.jpg`
- ✅ Hecho — 7. Fuera la etiqueta «Abierto» de la tarjeta del viaje en «Mis viajes» (y decir qué quería decir) Quitada de la tarjeta de «Mis viajes» del perfil nuevo. Lo que quería decir: «este es el viaje que tienes cargado ahora mismo en la app (el que ves en RUTA/DÍAS/HOY)»; salía en cualquier viaje que coincidiera con la ruta abierta, aunque no fuera el de hoy, y por eso no se entendía con «Próximo/En curso/Ya hechos» encima. Se mantiene «Día 2 de 5» en el viaje en curso. Sigue existiendo en el perfil VIEJO (FilaDeViaje, solo con los logros apagados): lo he dejado porque su prueba antigua (pruebaFase6y4_perfil) lo exige; dime si también quieres quitarlo ahí.  
  *Dónde:* Perfil › Mis viajes: ninguna tarjeta dice «Abierto».  *Captura:* `10n3_perfil_05_mis_viajes_portada_viajero.jpg`

**§4 · La prueba**

- ⚠️ A medias — Contra Supabase real, con dos cuentas: invitar, cambiar un permiso, quitar, un gasto [Para todos] aceptado y uno rechazado, una propuesta aceptada, y el directo con dos navegadores abiertos Hecho con tres cuentas anónimas de prueba (que se borraron al acabar): permisos, quitar, salir, avisos, propuesta aceptada y el directo con dos clientes. NO se pudo contra Supabase real: crear y canjear una invitación (exigen cuenta de verdad, no anónima), la plaza del pase que vuelve (necesita un cobro real), los gastos aceptado y rechazado, ni el directo con dos NAVEGADORES (solo dos clientes). Las migraciones 0041 a 0045 son nuevas y están SIN aplicar.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Prueba nueva pruebaTanda10N3 (editar, avisos, reservas, cuentas, apertura y perfil; y la prueba contra Supabase real con dos cuentas) Editar 45, avisos 20, reservas 31, cuentas 63, apertura 207, perfil 61 y real contra Supabase 47: todas en 0 fallos (en una pasada falló la parte de reservas por un texto de botón que cambió y se actualizó, la del perfil por un puerto a mano en un ayudante, y la real por el límite de altas anónimas de Supabase; repetidas, 0 fallos). Además, la prueba de la 10N: 418 · 0 fallos.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería rápida y pruebaJutrip (Eric pidió no pasar la batería completa en esta tanda) Eric pidió no pasar la batería completa en esta tanda. Se pasaron pruebaJutrip (129 · 0), pruebaTanda10N (418 · 0), pruebaTanda10P_sorteo (62 · 0) y las pruebas de la tanda.  
  *Dónde:* No es de móvil.

**§4 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil  
  *Dónde:* Esta página.
- ✅ Hecho — Capturas de cada escena de la película de la apertura a 390 de ancho con la barra de Safari (390x664) Ocho capturas, una por escena (la 8 es el final, a los 3 s, aún entrando).  
  *Dónde:* docs/dias/capturas_jutrip/10n3_apertura_escena_1.jpg a _8.jpg  *Captura:* `10n3_apertura_escena_1.jpg`

**§5 · El informe**

- ✅ Hecho — Apartado «10N3» en docs/dias/INFORME_TANDA10B.md, con esta lista al final  
  *Dónde:* No es de móvil.



## 10N4 · Pequeños arreglos del repaso de Eric con dos teléfonos

Prompt en `docs/dias/PROMPT_TANDA10N4.md`. Prueba: `scripts/destino/pruebaTanda10N4.mjs` (seis partes: lápiz y logros 51, campana 55, franja 130, menús 65, entradas 48 y perfil 32). Capturas en `docs/dias/capturas_jutrip/10n4_*.jpg` (las de Design, al lado, con el prefijo `10n4_design_`) y página `docs/dias/REPASO_10N4.html`, con la lista de comprobación con casillas arriba del todo y cada captura de la app al lado de la de Design. **No se ha tocado el motor de rutas.** Design al día con `APP RUTAS.zip` (sin `uploads/` ni `screenshots/`): `Avisos Gestion`, `Avisos Franja`, `Hojas Opciones`, `Ficha Cabecera` y `Parada Entrada` (de esta tanda) y, copiados pero SIN hacer (son de la 10T), `Entradas Horas`, `Ver Entrada` y `Entradas Pestana`. Hecha con seis agentes y revisada aquí.

### Lo que Eric tiene que hacer
Aplicar `supabase/migrations/0046_avisos_gestion.sql` en el editor SQL de Supabase (SIN APLICAR): la columna `oculto_en`, las funciones de «Marcar como no leído» y «Eliminar», y que `avisos_de` no devuelva los eliminados. Sin ella todo funciona igual, pero lo eliminado y lo no leído se recuerdan solo en ese móvil.

### Tus dudas de la 10N3, respondidas
- Las fechas del viaje bloqueadas también para quien solo recomienda: así estaba; se comprobó en la prueba.
- **Perfil viejo fuera del todo**, y con él «Abierto»: un solo perfil para todos. Quien tiene los logros apagados ve el perfil nuevo sin EXP, vitrina ni billete, con su pasaporte (países y ciudades de sus viajes), «Mis viajes» con portadas y sus ajustes. Se borraron `CabeceraDeSiempre`, `FilaDeViaje` (la única «Abierto»), `MapaMisViajes` y `CifrasDelMapa`, y el bloque del globo de `viajesPerfil.ts`. `PerfilSheet.tsx` queda como cáscara (cabecera, Créditos, [Nuevo viaje], álbum) porque `Header` la usa. **Pruebas antiguas cambiadas** (hacían referencia al perfil viejo, su mapa o «Abierto»): `pruebaFase6y4_perfil`, `pruebaCorr6z6_perfil`, `pruebaTanda6z6b`, `pruebaFase6y5_pantallas`, `pruebaFase6y7_pantallas`, `pruebaFase6z6c`, `pruebaTanda10F`, `pruebaCuentas3`, `pruebaTanda10P_sorteo`, `pruebaTanda7_mover` (una entrada que apuntaba a un fichero borrado) y `pruebas8c/*`.
- **«Tu parte · 31,00 €»** cuando una reserva es solo para parte del grupo (con el ojo cerrado, «Tu parte · € •••»); para todo el grupo, «31,00 € por persona».
- El Free Tour del invitado va en la 10N5: no se ha tocado.

### El lápiz y los logros (§0b)
La causa: las pantallas completas (EXPLORAR z-90, presupuesto z-80, cuentas z-85, alojamiento z-100, fichas z-50) tapaban los botones, que estaban en z 40 y 41, y el botón de logros solo salía en RUTA, DÍAS y HOY y el lápiz solo con `screen === 'route'`. Ahora un observador del DOM (`src/components/flotantes/flotantes.ts`) los deja encima de todo y solo los baja por debajo de una hoja que sale desde abajo mientras está abierta (vuelven al cerrarla), y los sube para no tapar los botones de abajo; el hueco al final de las listas (150 px, 220 con el lápiz) está en EXPLORAR, la ficha, el presupuesto y las cuentas. No he comprobado una a una otras pantallas con barra de abajo propia (añadir parada, excursiones, alojamiento): una hoja nueva que no use `role="dialog"` no escondería los botones.

### La pastilla del pase (§1)
Causa: `usePaseEstado` arrancaba en «cobro apagado, todo abierto», así que la pastilla se pintaba «comprada» hasta que llegaba `/api/pase/estado`. Ahora hay un estado «sabido»: mientras no se sabe, la pastilla va vacía (mismo tamaño) y HOY no pinta ni «con pase» ni «sin pase». **No tocado:** los candados leen `pagoActivo()`, que no es reactivo y empieza abierto hasta que llega la respuesta; cambiarlo sin un repintado global podría dejar un candado cerrado a quien sí tiene pase. Decide tú si lo quieres.

### Una sola letra (§1b)
Se cambió `font-dmsans` por `font-sans` (Geist) en `DurationSelector`, `CompanionSelector`, `CuratedPlacesPool` y `ExperienceCategorySelector`, y `.rdp-root` ahora usa Geist; se quitaron de `index.css` los dos `@import` de Google Fonts (Plus Jakarta Sans, Playfair Display, DM Sans) y `playfair`/`dmsans` de `tailwind.config.ts`. El calendario que se ve de verdad es el de `DateField`; `DurationSelector` no lo usa ninguna pantalla. **Otra letra que quedaba:** Helvetica Neue, la de Mapbox, en los números de las paradas del mapa y en la atribución (RUTA, DÍAS, EXPLORAR): arreglada con `body .mapboxgl-map` en `index.css`. No medido por pantalla: Perfil, Ajustes, Pasaporte ni las películas del pase.

### La campana (§2), como en Design
`src/components/layout/NoticesSheet.tsx` a pantalla completa («TUS AVISOS», «Avisos» y [Seleccionar]), filas como en Design (nuevo en negrita con el puntito dorado, leído en gris, **sin la etiqueta «Leído»**), el circulito, «N seleccionados», «Seleccionar todos», la hoja con las dos tarjetas (formato de «Hojas Opciones», sube al elegir el primero y se queda mientras eliges, con 280 px de hueco abajo, «Marcar como no leído» si todos están leídos) y «Eliminar» sin preguntar, con la franja «2 avisos eliminados» y [Deshacer] 6 s. **Abrir la campana ya no marca nada como leído** (cambia lo de la 10M). Los avisos con botones los siguen llevando. Los avisos de fecha que solo cuentan qué cierra salen como «Información» con la «i».
**Lo que no se pudo hacer igual que Design:** la hoja no lleva el rótulo grande ni la ✕ de las demás hojas de opciones (arriba ya están «N seleccionados» y [Cancelar]) y no oscurece la lista porque hay que seguir eligiendo; el icono de «Fecha especial» es un calendario dibujado en trazo fino (Design pone el carácter ▦); los avisos de arreglar (errores, «Revisa tu vuelta») no tienen circulito: no se eliminan, se arreglan; en modo Seleccionar los botones de dentro de los avisos se apagan.

### De dónde salían los dos avisos raros
- **«Sobre tu ruta» («2 días en Roma dan para mucho…»)** era `route.contextBanner`, que el motor escribe una sola vez al crear la ruta con los días de ese momento: si luego cambian los días, el texto queda desfasado. Ahora solo se enseña si el número de días que dice coincide con los de la ruta abierta.
- **«Mañana empieza tu viaje a Roma · ahora»** era el aviso `d10`, que el servidor crea una vez por viaje con las fechas de ese momento y no revisaba. Ahora el servidor lo oculta si el viaje cambió de fecha o ya no existe, y cuenta «Mañana» o «En N días» con la fecha de hoy en la hora del destino. No puedo ver la base de datos de Eric: no sé si vino de un viaje de pruebas o de un cambio de fechas; el arreglo cubre las dos cosas.
- Pendiente: los avisos de la cuenta de **otros viajes** no se filtran todavía por «viaje abierto» en la campana (anotado en el checklist).

### La franja y el sonido (§4b), como en Design 11
`src/components/avisos/FranjaDeAviso.tsx` + `useFranjaStore.ts`: sale con CUALQUIER aviso nuevo que llega con la app abierta (no el primero que se carga ni los de más de 20 minutos, leídos o eliminados), siempre además de la campana, con título corto y detalle, la inicial de quien lo hizo en la moneda dorada o el icono de la app (calendario para «Mañana empieza», «i» para información, estrella para el sorteo, ticket para la entrada que no cuadra), varios a la vez en una sola («3 avisos nuevos», las monedas, los nombres y [Ver]), tocarla abre y marca leído, deslizarla hacia arriba la quita, **un solo sonido por tanda** (separación de 2,5 s) y sin sonido si el ajuste «Sonido de los momentos» está apagado. **El sonido (`public/sonidos/aviso.wav`) es provisional, generado por mí con un script**; el del iPhone y su permiso solo se pueden comprobar en el aparato. La franja del grupo (permisos, propuestas, gastos, cambios del viaje) usa ya esta misma pieza. **No igual que Design:** la posición superior es 12 px en un navegador normal y `safe-area-inset-top` + 4 px en iPhone (Design usa 44 px dentro de un marco con la barra dibujada; no comprobado en un iPhone real); el calendario de Design lleva una cruz dentro (usado tal cual); Design no tiene ticket (dibujado fino en el mismo estilo).

### Los textos de todos los avisos (§4b2)
La lista entera, con el ANTES y el DESPUÉS, está en **`docs/dias/_10n4_textos_avisos.md`** (para que Eric los revise). Cambios principales: «Laura te ha recomendado un cambio en el día 2», «Ana te ha mandado una propuesta de 5 cambios para el viaje a Roma», «Eric ha añadido la Fontana de Trevi al sábado 28» (sin el «ha cambiado el viaje:» de delante), «Eric ha reservado el Coliseo para ti el jueves 26 a las 8:00.», «Te queda 1 día…», «Los Museos Vaticanos y la Villa Farnesina cierran el domingo 15 de noviembre.» (el artículo y el plural se resuelven al enseñarlo: el motor no se toca). Los textos de los disparadores SQL no cambiaron (no escriben texto, solo datos): no hay migración de textos.

### Los menús de opciones (§3 y §4), como en Design
El componente compartido `src/components/ui/HojaOpciones.tsx` (`HojaOpciones` + `OpcionTarjeta`): hoja con tirador y ✕, etiqueta pequeña y nombre grande (radio 32, fondo #FDFBF4, título 32 px, como Design), tarjetas blancas con icono de color suave, línea gris, «›» si lleva a otra pantalla, la que no se puede en gris con el porqué y la de quitar siempre la última en rojo. **Menús cambiados:** (1) la parada, (2) la parada para quien solo recomienda durante el viaje («Ver la ficha» y «Cómo llegar»), (3) el día (llegada, con excursión y vuelta), (4) «Personas del viaje», al tocar a una persona, la hoja del permiso y «Salir del viaje» del invitado, (5) «Cambiar portada», (6) «+ Añadir día · ¿Qué quieres hacer este día?», (7) «Abrir ruta en…». Los «tres puntitos» de RESERVAS, de un gasto, de la tarjeta de «Mis viajes» y del perfil **no existen como menús** en el código actual (son botones directos o filas que abren su pantalla): no había nada que convertir. Los diálogos de confirmación («¿Eliminar…?», «¿Quitar a Luis…?») siguen como hojas de confirmación. **Opciones extra de la parada que se quedan** (mismo formato, antes de «Quitar parada»): «Devolverla a la ruta» (si se saltó) y «Desmarcar visto»; si está reservada, el menú es solo «Quitar del viaje»; en días libres no sale «Cambiar parada». **Menú del día:** «Añadir lugares» en todos los días; «Añadir una excursión» activa solo si el día lleva interruptor (en gris con «No cabe en el día de llegada / de vuelta / este día» si no; si ya está en Excursión, «Volver a Roma»); también «Cambiar el nombre», «Mover el día antes/después», «Volver al día propuesto» y «Recuperar este día» cuando procede (esas líneas son mías, Design no las trae); «Eliminar día» siempre la última, en rojo. **Permisos con nombres cortos** (fuente única `src/lib/personasViaje.ts`): «Administrador» (candado y «Solo Eric»), «Editar · Cambia la ruta.», «Recomendar · Propone cambios.»; no queda ninguna cadena visible con «Puede editar» o «Solo recomendar»; los avisos no se tocaron.
**Desviaciones:** la 04 de Design usa los nombres viejos de los permisos; se usaron los del §4. «Mover antes/después» llevan «›» como en Design aunque no abran pantalla (sin él en gris). «Quitar parada» en días no libres dice «Sale de tu ruta. Se confirma antes» (no «Puedes deshacerlo») porque ahí hay confirmación y no deshacer. Los iconos de «Editar» (lápiz) y «Recomendar» (bombilla) son míos. «Mover a otro día» mantiene la ruedita dentro de la hoja. «Añadir una excursión» activa se probó inyectando un interruptor (el cambio real contra el servidor no).

### «Cierra» al añadir y las entradas en la ficha y en DÍAS (§4c y §4d)
- **Aviso de cierre:** un solo `<p>` rojo, sin botones, debajo de la lista, cuando el día elegido cierra (también el preseleccionado): «El lunes 19 cierra la Galería Borghese.» con concordancia («cierran los Museos Capitolinos», «cierran las Termas…», «cierra Trastevere»: `cierraElSitio`, `elSitio` y `sitioEnPlural` en `src/lib/articulos.ts`). La lista de días, sin marcas.
- **La cabecera de la ficha:** foto 118 con la cámara de 40, nombre a 33 px, pastillas de 30 px, y el corazón de 56 px con solo el número (se llena en frambuesa, sube y se quita).
- **La pestaña Entradas:** lo tuyo arriba del todo: caja azul oscuro con dorado cuando otro del grupo la tiene y tú no («Eric la tiene para el … · hora», [Reservar la mía a la misma hora], «Ya la tengo») y caja verde «Tu entrada» con la hora en grande, [Cambiar hora] y [Ver entrada]; fuera «Fijada».
- **El botón de la parada en DÍAS:** botón redondo sin palabras, también para el dueño: frambuesa si falta (con un numerito de cuántos del viaje la tienen), verde con ✓ blanco si ya la tienes (también si te cubre la del dueño); al tocarlo, la ficha en Entradas; fuera «Comprar entrada» y «Reservada ✓»; las etiquetas dejan sitio al botón y bajan de línea (ya no son nowrap: una muy larga se parte en dos dentro de su pastilla).
- **No igual que Design / a medias:** los tres colores están solo en el botón de DÍAS y en la pestaña Entradas de la ficha; **no se tocaron** las filas de RESERVAS, el Free Tour ni las excursiones, que siguen con su verde y frambuesa de antes. [Ver entrada] está puesto pero no hace nada (su pantalla es de la 10T). En `Parada Entrada` 01 y 02 los colores están cruzados respecto a sus títulos: se siguió el texto del prompt. El Design de «Tu entrada» no lleva la nota de llegada ni el punto de encuentro: se dejaron debajo de los botones en gris pequeño. A quien le cubre la entrada del dueño no le sale [Cambiar hora]. **Efecto:** la hora de la entrada (y la del Free Tour) ya no sale en la tarjeta de DÍAS, solo en la ficha.

### Dudas para Eric
1. ¿Quito en el modo con logros apagados la cáscara `PerfilSheet.tsx` o la dejo (la usa la cabecera)?
2. ¿Los candados del pase deben esperar también a saber el estado (hoy leen `pagoActivo()`, que empieza abierto)?
3. ¿Quieres los tres colores (frambuesa / verde / azul y dorado) también en las filas de RESERVAS, el Free Tour y las excursiones?
4. ¿Dejo «Cambiar el nombre» y «Mover el día antes/después» en el menú del día con mis líneas, o los quito por no estar en Design?
5. ¿Prefieres otro sonido de campanita? El actual es provisional (un tono corto y suave generado por script).

### Lista de comprobación (el repaso final de la app)
Cada punto del prompt, en el mismo orden. La misma lista, con casillas y cada captura al lado de la de Design, está arriba del todo de `docs/dias/REPASO_10N4.html`.

### Lista de comprobación de la 10N4 (punto por punto)

**§0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N4.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día con APP RUTAS.zip (sin uploads/ ni screenshots/): Avisos Gestion, Avisos Franja, Hojas Opciones, Ficha Cabecera, Parada Entrada, y copiados (sin hacer aquí, son de la 10T) Entradas Horas, Ver Entrada y Entradas Pestana  
  *Dónde:* No es de móvil.

**§0a · Tus dudas de la 10N3**

- ✅ Hecho — 1. Las fechas del viaje, bloqueadas también para quien solo recomienda (solo las cambia el administrador) Ya estaba así (useDatesCalendarStore: si el permiso no es 'admin', el calendario no se abre). Solo comprobado, con una prueba de código.  
  *Dónde:* Con la cuenta invitada (bengala.ingresos) en un viaje de Eric con permiso «Solo recomienda» o «Puede editar»: tocar las fechas en RUTA no abre el calendario.
- ✅ Hecho — 2. El perfil viejo, fuera del todo: un solo perfil para todos; con los logros apagados, el nuevo sin EXP, vitrina ni billete (con pasaporte, viajes y ajustes) Borrados CabeceraDeSiempre, FilaDeViaje, MapaMisViajes, CifrasDelMapa y el código del mapa/chinchetas de viajesPerfil.ts. PerfilSheet queda solo como cáscara (cabecera, Créditos, Nuevo viaje, álbum). Sin logros no se pide nada a /api/logros; su pasaporte cuenta países y ciudades de los viajes guardados y no abre el de los logros.  
  *Dónde:* Perfil (círculo de arriba a la derecha) con los logros apagados (producción): Hola + foto + ajustes, Mi pasaporte, Mis viajes con portadas. Con logros=on se ve el de siempre.  *Captura:* `10n4_perfil_logros_apagados.jpg`
- ✅ Hecho — 3. «Tu parte · 31 €» en lugar de «por persona» cuando una reserva es solo para parte del grupo; para todo el grupo, «por persona» Nuevo componente EtiquetaPorPersona en PantallaPresupuesto: «Tu parte · 31,00 €» (importe con formatoImporte, nunca un € escrito a mano) o «€ •••» con el ojo cerrado; para todo el grupo «31,00 € por persona». Sin captura de la pastilla: se comprueba con el código de verdad.  
  *Dónde:* Presupuesto (cartera) de un viaje compartido, con una entrada reservada para 2 de 4: la pastilla de la tarjeta oscura; tocar el ojo para ver el importe.
- ✅ Hecho — 4. Fuera «Abierto» (la pastilla del viaje abierto en Mis viajes) Desaparece con FilaDeViaje; la tarjeta nueva ya no lo escribía. Pruebas antiguas que lo pedían (pruebaFase6y4_perfil y las del mapa/fila) cambiadas para comprobar el perfil nuevo.  
  *Dónde:* Perfil > Mis viajes, con cualquier cuenta: ninguna tarjeta dice «Abierto».  *Captura:* `10n4_perfil_logros_encendidos.jpg`

**§0b · El lápiz y los logros**

- ✅ Hecho — El lápiz de la propuesta y el botón de los logros son flotantes y se ven en todas las pantallas: RUTA, DÍAS, EXPLORAR (también a pantalla completa, con lista y mapa), las fichas, RESERVAS, el presupuesto, HOY  
  *Dónde:* Con la cuenta que solo recomienda (invitada): haz un cambio en la ruta y recorre RUTA, DÍAS, EXPLORAR (abre una tarjeta a pantalla completa), la ficha de un sitio, RESERVAS, el presupuesto y HOY: el lápiz (con el numerito) y el botón de los logros salen siempre. El administrador ve solo el de los logros.  *Captura:* `10n4_flotantes_explorar_completo.jpg`
- ✅ Hecho — Error grave de la prueba de Eric: el invitado que añade un sitio desde EXPLORAR no veía el lápiz hasta cerrarlo todo y volver a la ruta  
  *Dónde:* Cuenta invitada (recomendar): EXPLORAR > una tarjeta > [+] de un sitio > elegir día. Al cerrar la hoja, el lápiz con el numerito está ya encima de la pantalla completa de EXPLORAR, sin salir a la ruta. Causa: las pantallas completas (z-index 50 a 90) tapaban los botones, que estaban en 40 y 41.  *Captura:* `10n4_flotantes_ficha.jpg`
- ✅ Hecho — Solo se quedan debajo de una hoja que sale desde abajo mientras está abierta, y vuelven al cerrarse Comprobado con la hoja de «¿A qué día lo añadimos?», la de la propuesta y la de los logros. Detecta por rol de diálogo (role=dialog, alertdialog, data-hoja y el Modal); una hoja nueva que no use ninguno de esos no los esconde.  
  *Dónde:* En EXPLORAR, toca [+] en un sitio: la hoja sube y los dos botones quedan debajo; ciérrala y vuelven. Igual al tocar el lápiz o el botón de los logros.  *Captura:* `10n4_flotantes_explorar_hoja.jpg`
- ⚠️ A medias — Nunca tapan el último elemento de una lista (hueco al final) ni los botones de abajo Hueco al final puesto y medido en la lista de EXPLORAR, la ficha, el presupuesto y las cuentas (150 px con logros, 220 con el lápiz); DÍAS, EXPLORAR en tarjetas y RESERVAS ya lo tenían. Los botones de abajo se esquivan (los botones suben) en HOY, el pie de la ficha ([Cambiar por este], [Añadir]), la barra de elegir varios y la barra de «Escuchar historia». No he revisado una a una las demás pantallas con barra propia (añadir parada, excursiones, alojamiento, otras fichas): se marcan con data-evitar-flotantes.  
  *Dónde:* Baja hasta el final de la lista de EXPLORAR, de una ficha y del presupuesto: el último elemento queda por encima de los botones. En la ficha, los botones suben por encima de la barra «Escuchar historia».  *Captura:* `10n4_flotantes_presupuesto.jpg`

**§1 · La pastilla del pase**

- ✅ Hecho — La pastilla «Pase Roma» ya no sale medio segundo como comprada al cargar la ruta: mientras no se sabe, va sin estado, nunca «comprado» por adelantado Causa: usePaseEstado arrancaba en «cobro apagado, todo abierto» y la pastilla se pintaba con el pase hasta que llegaba /api/pase/estado. Ahora arranca en «sin saber» y la pastilla deja su sitio vacío. Probado con la respuesta retrasada 2,5 s y muestreo cada 30 ms, con y sin pase: solo pasa de cargando al estado real.  
  *Dónde:* RUTA, tarjeta del destino, al abrir un viaje con la cuenta sin pase (y con pase): la pastilla aparece ya en su estado, sin «comprada» un instante.  *Captura:* `10n4_flotantes_pase_sin.jpg`
- ⚠️ A medias — Lo mismo en cualquier otro sitio que enseñe el pase (HOY, el perfil, los candados) HOY hecho: no se pinta ni «con pase» ni «sin pase» hasta saberlo (probado). El perfil no lee el estado del pase (no hay nada que arreglar). Los candados leen pagoActivo(), que no es reactivo y empieza abierto hasta que llega la respuesta: no lo he tocado porque, sin un aviso de repintado global, un candado podría quedarse cerrado a quien sí tiene pase. Queda para decidirlo.  
  *Dónde:* Pestaña HOY de un viaje sin pase: al abrirla no sale un instante lo del viaje con pase.  *Captura:* `10n4_flotantes_hoy_sin_pase.jpg`

**§1b · Una sola letra**

- ✅ Hecho — El calendario para elegir las fechas (DurationSelector y .rdp-root) usa las mismas letras que el resto, como en Design font-dmsans sustituido por font-sans (Geist) en DurationSelector, CompanionSelector, CuratedPlacesPool y ExperienceCategorySelector; .rdp-root ahora Geist. DurationSelector no se usa hoy en ninguna pantalla (el calendario que se ve es el de DateField, con .rdp-root).  
  *Dónde:* Crear viaje > elegir fechas: el calendario con Geist, como el resto.
- ✅ Hecho — Quitar de index.css y tailwind.config.ts lo que ya no se use (Plus Jakarta Sans, Playfair Display, DM Sans) para que cargue menos Fuera los dos @import de Google Fonts de index.css (Plus Jakarta Sans, Playfair Display y DM Sans: tres familias menos que bajar) y fontFamily playfair/dmsans de tailwind.config.ts. index.html ya solo cargaba Geist, Geist Mono, Instrument Serif e Italiana. Comprobado con grep que nada de src las usa.  
  *Dónde:* No se ve; la app arranca bajando menos letras.
- ✅ Hecho — Buscar si queda alguna otra pantalla con otra letra (fuera del logo, Italiana) y decirlo Medido en RUTA, DÍAS, RESERVAS, HOY y EXPLORAR: solo quedaba Helvetica Neue, la de Mapbox, en los números de las paradas del mapa (43 en DÍAS) y en la atribución del mapa. Arreglado con una regla en index.css. No he medido Perfil, Ajustes, Pasaporte ni las películas del pase por pantalla (por código no queda otra letra en src).  
  *Dónde:* DÍAS: los números de las paradas del mapa ya van en Geist.

**§2 · La campana**

- ✅ Hecho — Hacerla exactamente igual que Design «Avisos Gestion» (01 normal con [Seleccionar], 02 seleccionando, 03 después de eliminar): letras, tamaños, colores, iconos, fondo dorado claro del elegido Medidas, colores y letras copiados de la pieza (tarjeta de 20 px, icono de 42 px, puntito dorado de 10 px, circulito de 24 px, franja oscura de 54 px). Dos diferencias: el icono de «Fecha especial» es un calendario dibujado en trazo fino (Design pone el carácter ▦) y no hay grabador de arriba porque es pantalla completa.  
  *Dónde:* Campana (arriba a la derecha) › Seleccionar › elegir avisos › Eliminar. Con cualquier cuenta con avisos.  *Captura:* `10n4_campana_01_normal.jpg`
- ✅ Hecho — Cambio 1 de Eric: la campana es a pantalla completa; arriba «TUS AVISOS», «Avisos» grande y [Seleccionar]; se cierra como hoy Ocupa toda la pantalla; la ✕ de al lado de [Seleccionar] la cierra (en Seleccionar solo sale [Cancelar], como en Design).  
  *Dónde:* Toca la campana de la cabecera de RUTA; cierra con la ✕.  *Captura:* `10n4_campana_01_normal.jpg`
- ✅ Hecho — Cambio 2 de Eric: [Marcar leído] y [Eliminar] como hoja desde abajo con dos tarjetas («Marcar como leído» y, la última y en rojo, «Eliminar»), formato de Hojas Opciones; sube al elegir el primero, se queda sin tapar la lista y baja al no quedar ninguno o con [Cancelar] Usa las tarjetas de HojaOpciones (OpcionTarjeta) dentro de una hoja que no oscurece ni bloquea la lista (si no, no se podría seguir eligiendo). La hoja no lleva el rótulo grande ni la ✕ de las demás hojas, porque arriba ya está «2 seleccionados» y [Cancelar]; así es pequeña. La lista deja 280 px de hueco abajo.  
  *Dónde:* Campana › Seleccionar › toca un aviso: sube la hoja; toca [Cancelar] o quita la selección: baja.  *Captura:* `10n4_campana_02_seleccionando.jpg`
- ✅ Hecho — Los textos de la pieza son de ejemplo; los de verdad, con artículo también en los de cierre («Los Museos Vaticanos y la Villa Farnesina cierran…»). El aviso de que cierran museos es INFORMACIÓN (la «i»); «Fecha especial» y el calendario, para «Mañana empieza tu viaje» y parecidos Lo resuelve la parte de la franja y los textos: «Sobre tu ruta» solo sale si sus días coinciden con los de la ruta abierta, y «Mañana empieza tu viaje» solo el día de verdad antes (ver «§4b2» y «de dónde salían» en el informe).  
  *Dónde:* Campana: los avisos de fechas del viaje (cierres) con la «i» y «INFORMACIÓN».  *Captura:* `10n4_campana_01_normal.jpg`
- ✅ Hecho — Fuera la etiqueta «Leído» («Fecha especial · Leído», «Información · Leído»): nuevos en negrita con el puntito dorado, leídos en gris Ya solo sale el tipo («INFORMACIÓN», «FECHA ESPECIAL», «AVISO»). Nuevo: negrita 600 y puntito dorado; leído: 400 en gris.  
  *Dónde:* Campana: compara un aviso nuevo y uno leído.  *Captura:* `10n4_campana_01_normal.jpg`
- ✅ Hecho — Cambia lo de la 10M: abrir la campana YA NO marca todo como leído; cada aviso sigue nuevo hasta que el viajero lo abre o lo marca Quitado el «al cerrar, todo leído». También fuera «Marcar todos como leídos» y el botón «Marcar como leído» de cada aviso (ahora es con Seleccionar).  
  *Dónde:* Abre la campana con avisos nuevos y ciérrala: el punto de la campana de la cabecera sigue ahí.  *Captura:* `10n4_campana_01_normal.jpg`
- ✅ Hecho — Normal (01): tocar un aviso lo abre (propuesta, gasto, día que ha cambiado…) y lo marca leído; los que llevan botones dentro ([Aceptar] [Rechazar]…) los siguen llevando Tocar abre lo de siempre (abrirAviso) y los avisos que no abrían nada ahora se dan por leídos al tocarlos. En los avisos con botones (gasto pendiente, entrada) tocar fuera de los botones lo da por leído. Los avisos de arreglar (error, «Revisa tu vuelta») no se marcan: cuentan hasta que se arreglan.  
  *Dónde:* Campana › toca «Eric ha cambiado el viaje…» (abre la ruta) o «Ana quiere añadir al presupuesto» (con [Rechazar] [Aceptar]).  *Captura:* `10n4_campana_01b_botones.jpg`
- ✅ Hecho — [Seleccionar] (02): circulito a la izquierda de cada aviso, al tocar se elige (fondo dorado claro y ✓ oscuro), «2 seleccionados» y «Seleccionar todos», [Seleccionar] pasa a [Cancelar], hoja abajo y, si todos los elegidos ya están leídos, «Marcar como no leído» Los avisos de arreglar (errores y avisos del viaje) no llevan circulito porque no se eliminan ni se marcan: se arreglan. «Marcar como no leído» funciona también en la cuenta (guardado en el servidor con la migración 0046 y siempre en el móvil).  
  *Dónde:* Campana › Seleccionar; elige leídos solos para ver «Marcar como no leído».  *Captura:* `10n4_campana_02_seleccionando.jpg`
- ✅ Hecho — Eliminar (03): sin preguntar, los quita de su campana, franja oscura «2 avisos eliminados» con [Deshacer] unos segundos, y la campana vuelve a la normal La franja dura 6 s. [Deshacer] devuelve los avisos. Lo eliminado se recuerda al cerrar y abrir (en el móvil siempre; en el servidor con la migración 0046, SIN aplicar: hay que aplicarla para que también valga en otro móvil).  
  *Dónde:* Campana › Seleccionar › elige 2 › Eliminar; prueba [Deshacer] antes de que se vaya la franja.  *Captura:* `10n4_campana_03_eliminados.jpg`
- ✅ Hecho — El aviso «Sobre tu ruta» («2 días en Roma dan para mucho…»): cada aviso tiene que ser del viaje que está abierto; mira de qué viaje sale ese texto Lo resuelve la parte de la franja y los textos: «Sobre tu ruta» solo sale si sus días coinciden con los de la ruta abierta, y «Mañana empieza tu viaje» solo el día de verdad antes (ver «§4b2» y «de dónde salían» en el informe).  
  *Dónde:* Campana en el viaje del 11 al 15 de noviembre: «Sobre tu ruta» debe hablar de 5 días.
- ✅ Hecho — «Mañana empieza tu viaje a Roma · ahora» salió el 26-oct con un viaje del 11 al 15 de noviembre: mira por qué y que solo salga el día antes, en la hora del destino Lo resuelve la parte de la franja y los textos: «Sobre tu ruta» solo sale si sus días coinciden con los de la ruta abierta, y «Mañana empieza tu viaje» solo el día de verdad antes (ver «§4b2» y «de dónde salían» en el informe).  
  *Dónde:* Campana con un viaje que empieza dentro de más de un día: no debe salir.
- ⚠️ A medias — Textos de cierre con artículo: «Los Museos Vaticanos y la Villa Farnesina cierran el domingo 15 de noviembre.» (información, la «i») Artículos y plural hechos al enseñarlos (el motor no se toca). La «i» en lugar del calendario en la fila de la campana es de la campana (G2a); en la franja ya va así.  
  *Dónde:* Campana con un viaje que tenga cierres
- ✅ Hecho — «Sobre tu ruta» («2 días en Roma…») saliendo en un viaje de 5 días: de qué viaje sale y arreglarlo Salía del texto guardado en la ruta al crearla (route.contextBanner), que no se actualiza si cambian los días. Ahora solo sale si coincide con los días del viaje. Los avisos de la cuenta de otros viajes no se filtran por viaje abierto (queda por decidir).  
  *Dónde:* Viaje de 5 días creado antes con 2 días, o al cambiar fechas
- ✅ Hecho — «Mañana empieza tu viaje a Roma · ahora» salió hoy con el viaje del 11 al 15 de nov: por qué y que solo salga el día antes El aviso de los 10 días se crea una vez con las fechas de ese momento y nunca se revisaba. Ahora el servidor lo oculta si el viaje cambió de fecha o no existe y cuenta el «Mañana»/«En N días» con la fecha de hoy en la hora del destino. No puedo ver la base de datos de Eric para saber el viaje exacto.  
  *Dónde:* Campana el 26-oct con el viaje del 11 al 15 de nov: no debe salir

**§3 · Los menús de opciones**

- ✅ Hecho — Menú de una parada (01) igual que Design: PARADA + nombre, tarjetas con icono de color, línea gris, «›», Quitar parada la última en rojo Orden de Design. Extras que se quedan antes de Quitar: «Devolverla a la ruta» (parada saltada), «Desmarcar visto», «Quitar del viaje» (parada reservada, sustituye al resto). En días libres no sale «Cambiar parada». «Mover antes/después» llevan «›» como en Design aunque no abran pantalla.  
  *Dónde:* DÍAS > abrir un día > «···» de una parada (administrador o Editar)  *Captura:* `10n4_menus_01_parada.jpg`
- ✅ Hecho — «Mover antes» en gris diciendo por qué («Ya es la primera del día»); lo mismo con «Mover después» en la última  
  *Dónde:* «···» de la primera parada de un día  *Captura:* `10n4_menus_01_parada.jpg`
- ✅ Hecho — «Mover a otro día» abre la ruedita de días dentro de la misma hoja La ruedita es un selector, no una lista de opciones: se queda como estaba dentro de la hoja nueva.  
  *Dónde:* «···» de una parada > Mover a otro día  *Captura:* `10n4_menus_01b_mover_a.jpg`
- ✅ Hecho — Menú de un día (02): Añadir lugares, Añadir una excursión y Eliminar día (la última, roja) Además, si procede: Cambiar el nombre y Mover el día antes/después (días libres), Volver al día propuesto y Recuperar este día; todos con el mismo formato antes de Eliminar día. Los textos de líneas de nombres/mover son míos (Design no los trae).  
  *Dónde:* DÍAS > «···» de la cabecera de un día (administrador o Editar)  *Captura:* `10n4_menus_02_dia_llegada.jpg`
- ✅ Hecho — «Añadir lugares» abre EXPLORAR/añadir para ese día (en todos los días) Usa openAddFlow(dia), la misma pantalla de añadir de los días libres.  
  *Dónde:* DÍAS > «···» de un día > Añadir lugares
- ✅ Hecho — «Añadir una excursión» hace lo mismo que el interruptor [Roma | Excursión] y solo donde cabe (no llegada ni vuelta); si no, en gris con el porqué «Cabe» = el día lleva interruptor. En gris: «No cabe en el día de llegada / de vuelta / No cabe una excursión este día». Si el día ya está en Excursión la tarjeta pasa a «Volver a Roma». En el viaje de pruebas ningún día lleva interruptor: la opción activa se probó inyectando uno y comprobando que pide 'excursion' como el interruptor (no se probó el cambio real contra el servidor).  
  *Dónde:* DÍAS > «···» de un día; probar en el día con interruptor [Roma | Excursión]  *Captura:* `10n4_menus_02_dia_con_excursion.jpg`
- ✅ Hecho — «Personas del viaje» (03): lista con permisos, «Añadir a alguien · Con un enlace o un código» en vez de «+ Invitar a alguien» El invitado ve la lista y, abajo, «Salir del viaje» como tarjeta roja.  
  *Dónde:* RUTA > caras del viaje (administrador); como invitado, la misma pantalla  *Captura:* `10n4_menus_03_personas.jpg`
- ✅ Hecho — Al tocar a una persona (04): su hoja con «Cambiar permiso · Editar o Recomendar» y «Quitar del viaje» en rojo Usa «Editar o Recomendar» (no los nombres viejos de Design).  
  *Dónde:* RUTA > caras del viaje > tocar a otra persona (administrador)  *Captura:* `10n4_menus_04_persona.jpg`
- ✅ Hecho — Hoja del permiso con tarjetas: Administrador gris con candado y «Solo Eric», Editar, Recomendar; la elegida en azul oscuro Design no trae esta pantalla: iconos (lápiz, bombilla) y composición son míos sobre el mismo formato.  
  *Dónde:* Personas del viaje > persona > Cambiar permiso  *Captura:* `10n4_menus_05_permiso.jpg`
- ✅ Hecho — Menú de parada de quien solo recomienda durante el viaje (Ver la ficha, Cómo llegar) con el mismo formato Probado por código y por el render; sin captura propia.  
  *Dónde:* DÍAS con cuenta Recomendar, durante el viaje > «···» de una parada
- ✅ Hecho — «Cambiar portada» con tarjetas Tres tarjetas: Una foto de tu viaje (despliega la cuadrícula debajo), Una foto de mi galería, Volver a la del destino.  
  *Dónde:* Perfil > Mis viajes > «Cambiar portada» de la tarjeta  *Captura:* `10n4_menus_07_cambiar_portada.jpg`
- ✅ Hecho — Otros menús de la app con el mismo formato: «+ Añadir día» (qué quieres hacer) y «Abrir ruta en…» Los «tres puntitos» de RESERVAS, de un gasto, de la tarjeta de «Mis viajes» y del perfil NO existen como menús en el código actual (son botones directos o filas que abren su pantalla), así que no hay nada que convertir. Los diálogos de confirmación («¿Eliminar…?», «¿Quitar a Luis…?») siguen como hojas de confirmación, no son menús de opciones.  
  *Dónde:* DÍAS > «+ Añadir día»; conectores de una parada > Abrir ruta en…  *Captura:* `10n4_menus_03_anadir_dia.jpg`

**§4 · Los permisos con nombres cortos**

- ✅ Hecho — «Administrador» sin texto debajo, en gris con candado y «Solo {nombre del administrador}» a la derecha  
  *Dónde:* Personas del viaje > persona > Cambiar permiso  *Captura:* `10n4_menus_05_permiso.jpg`
- ✅ Hecho — «Editar» (antes «Puede editar») con «Cambia la ruta.» y «Recomendar» (antes «Solo recomendar») con «Propone cambios.» Cambiado en textoDelPermiso/lineaDelPermiso (fuente única): etiquetas de la lista, hoja del permiso y demás. No quedan cadenas visibles con los nombres viejos en src ni server.  
  *Dónde:* Personas del viaje (lista y hoja del permiso)  *Captura:* `10n4_menus_03_personas.jpg`
- ✅ Hecho — Fuera las frases largas de lo que puede y no puede hacer; los avisos siguen en lenguaje normal Los textos de los avisos no se tocaron.  
  *Dónde:* Hoja del permiso  *Captura:* `10n4_menus_05_permiso.jpg`

**§4b · La franja de aviso nuevo**

- ✅ Hecho — Cualquier aviso nuevo con la app abierta (permisos, propuestas, gastos, cambios, entradas, sorteo…) saca la franja arriba y se queda en la campana Detecta avisos nuevos en cada carga de la lista (Realtime, cada minuto, al volver). Probado con 11 tipos.  
  *Dónde:* Con dos móviles: Eric cambia un permiso o añade un sitio y mira el otro móvil (cuenta invitada)  *Captura:* `10n4_franja_permiso.jpg`
- ✅ Hecho — Sonido corto y suave de campanita, el mismo para todos; respeta «Sonido de los momentos»; sin vibración; no falla si el iPhone no deja public/sonidos/aviso.wav (provisional, generado). El audio se prepara en el primer toque. En iPhone real hay que comprobarlo: no se puede probar aquí.  
  *Dónde:* Ajustes > Sonido de los momentos activado/apagado, y esperar un aviso con el móvil ya tocado
- ✅ Hecho — Varios a la vez: una sola franja «3 avisos nuevos» y un solo sonido Se juntan los que llegan casi a la vez (1,5 s); uno que llega después sustituye a la franja anterior.  
  *Dónde:* Hacer 3 cambios seguidos desde el otro móvil  *Captura:* `10n4_franja_varios.jpg`
- ✅ Hecho — Franja como Design 11: oscura, moneda dorada, título en negrita y detalle debajo Medidas, colores, letras y sombra copiados de la pieza. Diferencia: en una web normal baja 12 px (en el iPhone con barra, lo que mida la zona segura).  
  *Dónde:* Cualquier pantalla de la app  *Captura:* `10n4_franja_sitio.jpg`
- ✅ Hecho — Icono: inicial/foto de la persona; si avisa la app, su icono dorado (calendario fechas especiales, «i» información, estrella sorteo, ticket entradas) Cruce de la pieza corregido como pedía el prompt. El calendario es el de Design (lleva una cruz). El ticket no está en Design: dibujado fino en el mismo estilo.  
  *Dónde:* Aviso «Mañana empieza tu viaje», sorteo, entrada que no cuadra  *Captura:* `10n4_franja_fecha.jpg`
- ✅ Hecho — Varios a la vez: monedas apiladas, «3 avisos nuevos», nombres debajo y [Ver] que abre la campana  
  *Dónde:* Tres avisos de golpe y tocar la franja  *Captura:* `10n4_franja_varios.jpg`
- ✅ Hecho — Al tocar la franja abre lo que sea y marca leído; deslizada hacia arriba se va antes Los avisos con botones (gasto pendiente, entrada del dueño) abren la campana en ese aviso sin darlo por leído. Usa abrirAviso.ts.  
  *Dónde:* Tocar y deslizar una franja
- ⚠️ A medias — No tapa la barra de arriba del iPhone (hora y batería) Usa env(safe-area-inset-top)+4 px; comprobado a 390 px en el navegador, no en un iPhone real.  
  *Dónde:* iPhone, con la app instalada en la pantalla de inicio
- ✅ Hecho — Una misma pieza para todos los avisos (también el «Eric ha aceptado tu gasto» y las líneas «Ya no formas parte…»), franja y campana a la vez con un solo sonido GastosCompartidosHost y CompartidoHost usan ahora la misma franja; se quitó la pastilla vieja. Duplicados evitados por clave.  
  *Dónde:* Aceptar/rechazar un gasto del otro móvil; quitar a alguien del viaje  *Captura:* `10n4_franja_gasto_ok.jpg`

**§4b2 · Los textos de los avisos**

- ✅ Hecho — Una sola regla de textos para campana, franja y móvil: frases cortas, artículo, plural, día bien dicho, lo que decidió la persona shared/avisos/textos.js; la franja también viene del servidor (con artículos) y se arma en el móvil si falta. Lista antes/después en docs/dias/_10n4_textos_avisos.md. Sin migración 0047 (ningún SQL escribe texto).  
  *Dónde:* Campana de cualquier cuenta
- ✅ Hecho — Repaso uno a uno de todos los textos existentes con antes y después Ver _10n4_textos_avisos.md. Los textos de reservas/lluvia/vuelos calculados en el móvil se revisaron y se dejaron salvo el de «entrada no cuadra» (ahora con artículo).  
  *Dónde:* docs/dias/_10n4_textos_avisos.md

**§4c · Añadir un sitio: el aviso de que cierra**

- ✅ Hecho — Fuera el recuadro con [Ponerlo el …] y [Dejarlo … igual]: solo un aviso en rojo, sin botones, debajo de la lista Se muestra cuando el día elegido cierra (también si es el que venía preseleccionado).  
  *Dónde:* EXPLORAR > Añadir (+) a un sitio > tocar un día que cierra (p. ej. la Galería Borghese un lunes). Administrador o invitado.  *Captura:* `10n4_cierra_aviso.jpg`
- ✅ Hecho — Texto «El miércoles 11 cierran los Museos Capitolinos.»; el viajero elige otro día o lo deja; nunca se le niega nada [Añadir …] sigue activo con el día que cierra.  
  *Dónde:* Misma hoja; pulsar [Añadir al lunes 19].  *Captura:* `10n4_cierra_aviso.jpg`
- ✅ Hecho — La lista de días igual para todos: sin etiquetas ni marcas en el que cierra Se mantienen los motivos de bloqueo que no son de cierre (ya lo tienes ese día, excursión de día entero).  
  *Dónde:* Misma hoja, lista de días.  *Captura:* `10n4_cierra_aviso.jpg`
- ✅ Hecho — Concordancia: «cierran los Museos Capitolinos», «cierra la Galería Borghese» cierraElSitio() en src/lib/articulos.ts (plural por el artículo de la tabla).  
  *Dónde:* Misma hoja con un sitio en plural (Museos Capitolinos, Termas de Caracalla).  *Captura:* `10n4_cierra_aviso.jpg`

**§4d · Las entradas en la ficha y en DÍAS**

- ⚠️ A medias — Regla de los tres colores: frambuesa te falta, verde ya lo tienes, azul oscuro con dorado otro del grupo la tiene Aplicado en el botón de la parada de DÍAS y en la pestaña Entradas de la ficha. No tocados: filas de RESERVAS, Free Tour y excursiones (siguen con su verde/frambuesa de antes).  
  *Dónde:* DÍAS (botón de la parada) y ficha > Entradas; administrador y invitado.  *Captura:* `10n4_entradas_dias_grupo.jpg`
- ✅ Hecho — Cabecera de la ficha: foto 118 con cámara, nombre, pastillas y a la derecha el corazón con el número Pestañas y tirador ajustados a Design (50 px, 15 px).  
  *Dónde:* Abrir la ficha de cualquier sitio del catálogo.  *Captura:* `10n4_entradas_cabecera_01.jpg`
- ✅ Hecho — El corazón se llena en frambuesa y sube a 94; al volver a tocarlo se quita Misma cuenta única de «me gusta» (useMeGustaStore).  
  *Dónde:* Ficha de un sitio > tocar el corazón.  *Captura:* `10n4_entradas_cabecera_02.jpg`
- ✅ Hecho — Pestaña Entradas con lo tuyo arriba del todo, visible sin scroll  
  *Dónde:* Ficha > Entradas, con cualquier cuenta.  *Captura:* `10n4_entradas_ficha_del_grupo.jpg`
- ✅ Hecho — 03: recuadro azul oscuro con dorado «Eric la tiene para el jueves 12 · 11:45», [Reservar la mía a la misma hora] y «¿Ya la tienes? Ya la tengo» Solo sale al invitado que no está incluido en la entrada del dueño.  
  *Dónde:* Cuenta invitada no incluida > ficha > Entradas.  *Captura:* `10n4_entradas_ficha_del_grupo.jpg`
- ⚠️ A medias — 04: recuadro verde con ✓, «Tu entrada», hora en grande, «Sitio · día», [Cambiar hora] y [Ver entrada]; fuera «Fijada» [Ver entrada] queda puesto pero no hace nada: su pantalla es de la 10T. A quien le cubre la entrada del dueño no le sale [Cambiar hora].  
  *Dónde:* Administrador con entrada reservada > ficha > Entradas.  *Captura:* `10n4_entradas_ficha_tu_entrada.jpg`
- ✅ Hecho — Debajo, las entradas para comprar como hasta ahora  
  *Dónde:* Ficha > Entradas.  *Captura:* `10n4_entradas_ficha_sin_entrada.jpg`
- ✅ Hecho — Tarjeta de DÍAS: fuera «Comprar entrada» y la pastilla «Reservada ✓»; botón redondo con icono de entrada abajo a la derecha Sin palabras, también para el dueño. Efecto colateral: la hora de la entrada ya no sale en la tarjeta (solo en la ficha).  
  *Dónde:* DÍAS > tarjeta de una parada con entradas.  *Captura:* `10n4_entradas_dias_falta.jpg`
- ✅ Hecho — Frambuesa si no la tienes, con numerito cuando otros del grupo la tienen El número es cuántas personas cubre la entrada del dueño.  
  *Dónde:* Invitado no incluido > DÍAS.  *Captura:* `10n4_entradas_dias_grupo.jpg`
- ✅ Hecho — Verde con ✓ blanco arriba a la derecha si ya tienes la tuya En Design las piezas 01 y 02 tienen los colores cruzados respecto a sus títulos; seguido el texto del prompt.  
  *Dónde:* Administrador con entrada, o invitado incluido > DÍAS.  *Captura:* `10n4_entradas_dias_tengo.jpg`
- ✅ Hecho — Al tocar el botón, la ficha abierta en la pestaña Entradas  
  *Dónde:* DÍAS > botón de la entrada.  *Captura:* `10n4_entradas_ficha_tu_entrada.jpg`
- ✅ Hecho — Las etiquetas nunca pasan por debajo del botón: si no caben, bajan de línea Las etiquetas ya no son nowrap: una muy larga se parte en dos líneas dentro de su pastilla.  
  *Dónde:* DÍAS > paradas con 3 o más etiquetas.  *Captura:* `10n4_entradas_dias_etiquetas_largas.jpg`

**§5 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N4 (lápiz y logros, campana, franja, menús, entradas y perfil) Prueba de la Tanda 10N4: 381 comprobaciones, 0 fallos. Con 10N 418/0, 10N3 474/1 (el aviso en directo de Ana, solo bajo carga; suelto 47/0), 10P 3625/0, 10O 129/0, pruebaJutrip 129/0.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y solo pasa solo, se dice y se arregla en la 10S) Bateria completa: 22 MAL, todos por expectativas antiguas ya actualizadas (sin regresiones); sueltas pasan con 0 fallos. Lo que falle solo con otras pruebas a la vez y pase suelto va a la 10S.  
  *Dónde:* No es de móvil.

**§5 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, cada una al lado de la de Design  
  *Dónde:* Esta página.

**§6 · El informe**

- ✅ Hecho — Apartado «10N4» en docs/dias/INFORME_TANDA10B.md (con de dónde salían «Sobre tu ruta» y «Mañana empieza tu viaje», la lista de menús cambiados y la lista de textos de avisos) y esta lista al final  
  *Dónde:* No es de móvil.

**Pruebas:** 
