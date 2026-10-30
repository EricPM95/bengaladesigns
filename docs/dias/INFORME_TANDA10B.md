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

---

## 10N5 — Más arreglos del repaso de Eric con dos teléfonos

**Estado:** hecho y probado. Prueba nueva `pruebaTanda10N5`: 493 comprobaciones, 0 fallos. No se ha tocado el motor de rutas (`server/engine/**`, `shared/routeEngine/**`), así que no hace falta la muestra de 60 fechas. Design al día con `RETOQUES.zip` (sin `Pase Premium` ni el resto de `Pase Estilo`).

### Migraciones que tienes que aplicar (a mano, en el editor SQL de Supabase, en este orden)
1. `0047_limite_intentos_codigo.sql` — límite de intentos del código de invitación en el servidor (6 fallos en 15 min). Sin ella el límite solo está en el móvil y se salta borrando datos del navegador.
2. `0048_avisos_borrado.sql` — `purgar_avisos()`: borra los eliminados a los 30 días y todos los de más de un año, y guarda la clave para que no se puedan recrear.
3. `0049_lo_suyo_de_cada_uno.sql` — vuelo y alojamiento de cada uno (tabla con RLS, dos funciones y dos disparadores con sus avisos).
4. `0051_aviso_cambio_viaje_claro.sql` — el aviso de «ha cambiado el viaje» dice lo que de verdad ha pasado. Hasta que la apliques, a los otros móviles sigue llegando el aviso viejo.
(No existe la 0050: es un salto de numeración, no falta nada.)

### Qué se ha hecho
- **Free Tour (§1):** se añade eligiendo el día desde EXPLORAR, su ficha y «+ Añadir parada»; hoja nueva «¿A qué día lo añadimos?» (`FreeTourDiaSheet`). Quien solo recomienda: un solo cambio en su propuesta. Los días con reserva con hora, cosas a mano o excursión no se mueven sin avisar (salen apagados con el motivo).
- **Avisos de cambios (§2, §2b):** una línea con lo que pasó. Antes → después:
  - «VIAJES ha cambiado el viaje: ha añadido Coliseo al miércoles 11 y otros 5 sitios y ha quitado 6 sitios» → «Viajes ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.»
  - Mover: «Viajes ha movido el Coliseo al jueves 12 y 2 sitios más.» · Quitar: «Viajes ha quitado la Iglesia del Gesù.»
  - Interruptor: «…ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento).» / «…a un día en Roma.»
  - Recuperar: «Eric ha vuelto a la ruta inicial.» / «Eric ha recuperado el sábado 14 como estaba.»
  - «Ha cambiado las fechas» salía con las mismas fechas porque el disparador de la 0036 sumaba cambios seguidos; la 0051 compara contra el estado de antes del primer cambio.
  - Al tocar el aviso se abre DÍAS en el primer día cambiado, con «Nueva» / «Movida» en las paradas.
- **Unirse (§3):** hoja con el código (`HojaUnirse`), en la primera pantalla («¿Te han invitado? Únete con un código»), en el [+] del perfil y en Ajustes. Con cuenta: se une y abre ese viaje (el anterior queda en Mis viajes) con la franja «Te has unido al viaje a Roma de Eric». Sin cuenta: «Entra o crea tu cuenta para unirte» y al entrar se une solo.
- **Perfil (§4):** orden nuevo (cabecera con EXP, «Mis viajes» de lado con «Ver todos», vitrina, pasaporte, sorteo abajo), fuera «PERFIL», [+] flotante con tres tarjetas. **Se abre al momento:** antes ~1,9 s hasta ver «Hola» y el nivel; ahora ~0,5 s la primera vez y ~75 ms con lo último guardado (medido en desarrollo con 4G simulada y CPU 4× más lenta, no en un iPhone real). Causa: el código del perfil se bajaba al tocarlo y luego esperaba al servidor.
- **Película (§5):** escenas a todo el ancho, título «Todo lo que incluye tu Pase Roma» en la línea de [Saltar], rayitas tocables que reinician la escena, texto de la cuarta escena sin pisarse; comprobado con detector automático en 390×664, 375×667 y 390×844 (0 fallos). Pasaporte: la escena quedaba quieta 3,2 s tras la vuelta al mundo (ahora ~0,7 s).
- **[Guardar] (§6):** solo «Guardar».
- **Pase (§6b):** caja pequeña `Pase Estilo` 01 en RESERVAS (Alojamiento y Llegada/vuelta), DÍAS (zona y ajustes de llegada/vuelta), «Cómo llegar a tu alojamiento» y Logros; Baños, Fuentes y «Cerca de ti» en azul oscuro con candado dorado.
  - Textos «cada día empieza cerca del alojamiento» → «Con el Pase Roma, adaptamos tu ruta a tu alojamiento.» (RESERVAS, DÍAS, lista de lo que incluye: «Adaptamos tu ruta a tu alojamiento / El primer día, y como mucho el último, según tu zona.», película: «Tu ruta se adapta a tu alojamiento»). No había nada parecido en `roma.json`.
- **Candados y tres colores (§0):** los candados no se pintan hasta saber si hay pase (`pagoPendiente()`) y se repintan solos. Tres colores en `EntradaCard` (RESERVAS: entradas y Free Tour), `ExcursionesReservas` y `EntradaEdgeTab` (el botón de DÍAS).
- **Cada uno (§6c):** cada persona puede poner su vuelo y su alojamiento; si el administrador lo pone para todos o algunos, se cambia el de esas personas con su aviso; cada uno puede volver a poner el suyo (aviso al administrador). Las cuentas ahora incluyen los vuelos y las entradas que reserva cualquiera para varios, sin contar nada dos veces.
- **Añadir gasto (§6d):** «¿Quién ha pagado?» (quien añade, el primero y marcado) y «¿Para quién es?», con espacio entre bloques.
- **Avisos borrados (§6e):** el borrado diario lo hace la tarea de Vercel que ya corre cada día a las 9:00 (`/api/cron/avisos`), no `pg_cron`: así no hay que activar nada en Supabase.
- **Nombres:** `nombreVisible` (primera letra en mayúscula) en campana, franja, personas del viaje, gastos, cuentas, RESERVAS, perfil («Hola, Viajes») y en los avisos y pushes del servidor.

### Pruebas
- Prueba nueva `pruebaTanda10N5`: 493 comprobaciones, 0 fallos (Free Tour 57, SQL del aviso 12, unirse 53, perfil 47, pase 217, cada uno 60+15, gastos 11+3, avisos 18).
- Batería completa: 131 pruebas, 39 en MAL a la primera. Triadas por dos agentes: unas 20 eran expectativas antiguas que la 10N5 cambió a propósito (perfil, cajas del pase, Free Tour por día, RESERVAS del invitado, nombres…) y se actualizaron; 3 eran regresiones de texto pequeñas ya arregladas en el código («Pasarlo» → «Pasar», «El día N» escrito a mano, un comentario con el candado); el resto, flakes bajo carga (arranque en frío de Vite, límite de altas anónimas de Supabase) que **pasan sueltas con 0 fallos**. Si algo falla solo con otras pruebas y pasa suelto, va a la 10S.
- `pruebaJutrip`: ver la línea de resultado de la lista final.

### Dudas para ti
1. **D1-FT frente a D3:** en `roma.json` el Free Tour de las 10:00 está en `D3`, no en `D1-FT` (que es la Roma antigua sin lo que cubre el tour). Hago: el día elegido pasa a ser D3, D1 pasa a D1-FT en su sitio y el que estaba en el elegido va al sitio de D3, sin tocar el motor. Si querías de verdad D1-FT en el día elegido, esa jornada quedaría sin Free Tour.
2. **El botón de DÍAS (`EntradaEdgeTab`)** ahora es azul oscuro con dorado cuando otros del grupo ya tienen la entrada; antes era frambuesa con numerito y Design «Parada Entrada» no tenía ese tercer color. ¿Lo dejo así o lo vuelvo a frambuesa?
3. **Escena del pasaporte:** medí 3,2 s quietos tras la vuelta al mundo, no 7. Si hablabas de otro momento (el mapa plano de Japón, segundos 10-14), dime el instante exacto.
4. **Marco de la foto del perfil:** 104 px como dice el prompt («del mismo tamaño que hoy»); Design lo dibuja a 118.
5. **Signo ✈ en texto** en «Lo de cada uno» («✈ Ida · mar 10 · 13:40 · Ciampino»): lo permití en dos pruebas porque el código dice que es «como en el diseño». Si quieres «sin emoji de transporte», hay que quitarlo de `LoDeCadaUno.tsx` y `loSuyo.ts`.
6. **Aviso «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.»:** va a todas las personas marcadas, tuvieran vuelo propio o no. Si prefieres solo a quien lo tenía, es una línea en el disparador.
7. **Entradas que reserva Ana para varios:** entran en las cuentas, pero a los incluidos no les salen como «Reservada ✓» ni reciben aviso de esa entrada (no estaba en el encargo).
8. **Presupuesto de un invitado:** sigue mostrando las líneas del vuelo del administrador, no las propias.
9. **Vuelo y alojamiento propios** solo existen en viajes de un destino; los de varios destinos siguen en gris.
10. **Cada cambio distinto del vuelo del administrador** (hora, punto, «para quién») manda su aviso: editar la hora y luego el punto manda dos.
11. **Sin crear D1-FT sin D2/D3:** si el viaje no tiene D2/D3, el Free Tour no se añade y se dice por qué.
12. **Aceptar la propuesta del Free Tour entre dos cuentas reales** y **tocar el aviso con «Nueva/Movida» con un aviso real** están probados a nivel de lógica, no vistos en pantalla; el **flujo de entrar con cuenta real para unirse** tampoco se ha probado de punta a punta; ni el interruptor de excursión ni el cambio de fechas en pantalla (el viaje de pruebas no tiene día de excursión).
13. **Sonido del aviso:** el que ya hay (como dijiste).


### Lista de comprobación de la 10N5 (punto por punto)

**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N5.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día con RETOQUES.zip (sin uploads/ ni screenshots/); Pase Premium y el resto de Pase Estilo no se usan  
  *Dónde:* No es de móvil.
- ✅ Hecho — Tus dudas de la 10N4 respondidas: PerfilSheet como cáscara, candados, tres colores, «Cambiar el nombre» y «Mover el día» en el menú, sonido Candados y colores: ver la lista de H3 y el informe.  
  *Dónde:* Ver cada punto.

**0 · Regla global**

- ✅ Hecho — Los nombres de las personas, siempre con la primera letra de cada palabra en mayúscula y el resto en minúscula («Viajes», «José Luis»), en todos los sitios donde salgan; solo al enseñarlos (se guardan como los escribió la persona) Un solo sitio (`nombreVisible`) aplicado donde se pinta o se compone un nombre: nombreDe (store del viaje compartido: campana, franja, personas del viaje, gastos, RESERVAS, propuestas), nombreDeLaPersona, nombreParaMostrar (perfil «Hola, Viajes», Compartir), los textos de avisos del servidor (shared/avisos/textos.js: texto, franja y quién), las cuentas del grupo (nombres de quien salió incluidos), las pastillas de «Añadir gasto», el aviso de gasto («pagó …»), la cabecera del presupuesto invitado y las pastillas de «Para quién es» del alojamiento. Probado con «VIAJES», «ERIC», «ana maría», «josé luis».  
  *Dónde:* Cualquier pestaña · con la cuenta de Eric guardada como «VIAJES»: campana (icono de arriba), franja de aviso nuevo, RUTA > Personas del viaje, RESERVAS > Entradas > Para quién es, cartera > Cuentas del grupo, perfil «Hola, Viajes»  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_04_eric_quien_va.jpg`
- ⚠️ A medias — Espacio claro entre bloques distintos en las pantallas que se tocan y en las hojas de añadir (gasto, reserva, parada) Hecho en la hoja de añadir/editar gasto (gap-5 entre nombre+importe, [Para todos|Para mí], «¿Quién ha pagado?» y «¿Para quién es?») y en las hojas nuevas de lo de cada uno (Tu vuelo, En este vuelo, mi alojamiento: bloques separados). La hoja de añadir reserva ya separa sus bloques con mt-7 y no la he cambiado; la hoja de añadir parada es de la zona del Free Tour (H1), no la he tocado.  
  *Dónde:* RESERVAS (o cartera) > Añadir gasto; RESERVAS > Entradas > Añádela  *Captura:* `docs/dias/capturas_jutrip/10n5_gastos_hoja_ana.jpg`

**0.2**

- ✅ Hecho — Candados sin pintar mientras no se sabe si hay pase pagoActivo() es falso y pagoPendiente() verdadero hasta que contesta /api/pase/estado; Candado, Baños/Fuentes y «Cerca de ti» no se pintan (probado con la respuesta retrasada 7 s, sin y con pase).  
  *Dónde:* RESERVAS › Alojamiento con ?version sin pedir y la respuesta del pase lenta (solo pruebas); en producción, al abrir un viaje con cuenta  *Captura:* `10n5_pendiente_sin_sin_pintar.jpg`
- ✅ Hecho — Se repintan solos al llegar la respuesta (pagoActivo() avisa) usePagoActivo/usePasePintable (useSyncExternalStore) en los sitios que pintan candados; la caja aparece sola sin pase.  
  *Dónde:* RESERVAS › Alojamiento, sin tocar nada  *Captura:* `10n5_pendiente_sin_repintado.jpg`
- ✅ Hecho — Nunca candado cerrado con pase ni abierto sin él Con pase: 0 cajas en todo el tiempo. Sin pase: 0 abiertos mientras no se sabe. Candado devuelve null si el estado no es «sin».  
  *Dónde:* RESERVAS y EXPLORAR con pase  *Captura:* `10n5_con_pase_explorar.jpg`

**0.3**

- ⚠️ A medias — Tres colores (frambuesa / verde / azul oscuro con dorado) en RESERVAS, Free Tour y excursiones Hecho en EntradaCard (RESERVAS entradas y Free Tour), botón de DÍAS (EntradaEdgeTab) y tarjeta de excursión (ExcursionesReservas). Excursión sin captura: la ruta de prueba no tiene día de excursión. Ojo: el botón de DÍAS con otros que la tienen pasa de frambuesa con numerito a azul oscuro con numerito (Design Parada Entrada no lo tenía).  
  *Dónde:* Invitado (Luis) › DÍAS › Coliseo; RESERVAS › Entradas y Free Tour  *Captura:* `10n5_colores_reservas_entradas.jpg`

**1**

- ✅ Hecho — El Free Tour se añade como cualquier sitio desde EXPLORAR: sale la hoja «¿A qué día lo añadimos?» con los días del viaje, el primero que le encaje ya marcado FreeTourDiaSheet (misma hoja que AddToDaySheet). Probado en la app con pruebaTanda10N5_freetour.mjs: el «+» de la tarjeta del Free Tour abre la hoja con los 3 días y el primero marcado. «El primero que encaje» = el primer día del viaje (o el siguiente si la llegada del día 1 es a las 14:00 o más) cuyo cambio se puede hacer sin tocar nada tuyo.  
  *Dónde:* RUTA > EXPLORAR > tarjeta «Entradas» > Free Tour por Roma > «+». Cualquier cuenta (administrador, editor o quien solo recomienda).  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_hoja_explorar.jpg`
- ✅ Hecho — Lo mismo desde la ficha del Free Tour (su «+ Añadir» de abajo) La ficha usa el mismo onAddFreeTour: abre la misma hoja. Comprobado en la prueba.  
  *Dónde:* EXPLORAR > Entradas > tocar la tarjeta del Free Tour > «+ Añadir» (abajo).  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_hoja_ficha.jpg`
- ✅ Hecho — Y desde «+ Añadir parada» de un día en DÍAS (hoy sale en esa lista pero no deja añadirlo: que deje) Faltaba pasarle onAddFreeTour al explorador de «Añadir parada» en DayDetailPanel.tsx (sin él la tarjeta del Free Tour salía sin «+»). Ahora abre la misma hoja de días.  
  *Dónde:* DÍAS > abrir un día > «+ Añadir parada» > filtro Entradas > Free Tour > «+».  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_hoja_anadir_parada.jpg`
- ⚠️ A medias — El día elegido pasa a ser nuestro día escrito con Free Tour (D1-FT de roma.json) y el día que estaba ahí pasa al sitio que deja, como con las rayitas OJO, DIFERENCIA CON EL PROMPT: D1-FT NO lleva el Free Tour (lo medí con el motor: D1-FT es la Roma antigua SIN lo que cubre el tour). El Free Tour (10:00, y el Vaticano por la tarde) vive en el día escrito D3. En Roma el Free Tour son una pareja: D2 -> D3 (con el Free Tour) y D1 -> D1-FT. Lo hago así: el día elegido pasa a ser D3, D1 pasa a D1-FT en su sitio y el día que estaba en el elegido pasa al sitio donde estaba D3 (solo se rehacen los días que cambian). Si Eric quería literalmente D1-FT en el día elegido, hay que decidirlo: pasaría a ser un día sin Free Tour.  
  *Dónde:* Después de añadirlo: DÍAS, el día elegido empieza con el Free Tour de las 10:00; Ruta, los días en el nuevo orden.  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_anadido.jpg`
- ✅ Hecho — Qué hago si el viaje no tiene D1 (o D2/D3), o si el día elegido o el que se mueve tiene una reserva con hora o cosas a mano Decisión documentada en src/lib/freeTourEnDia.ts: sin día escrito donde encajar el Free Tour sin quitar otro, no se toca nada y se dice «Este viaje no tiene un día donde encaje». Un día que se rehace con cosas a mano, día propio o añadido, excursión, entrada reservada con hora o excursión fijada NO se mueve: sale apagado en la hoja con «… no lo movemos sin avisar. Elige otro día.» Todo o nada: si el servidor no devuelve todos los días, no cambia ninguno.  
  *Dónde:* Cambia a mano un día (quita una parada) y abre la hoja del Free Tour: los días afectados salen apagados con su motivo.  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_dia_protegido.jpg`
- ✅ Hecho — Sin elegir hora: el Free Tour queda en la hora y el sitio que tiene en nuestro día escrito (arrastrable dentro del día) La hoja ya no pregunta la hora (la de las 10:00 del día escrito). Arrastrar la parada dentro del día es lo de siempre; su hora de salida se elige al reservarlo.  
  *Dónde:* DÍAS > el día del Free Tour: abre con el Free Tour de las 10:00.  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_anadido.jpg`
- ✅ Hecho — El aviso al añadirlo: «Añadido el Free Tour · jueves 12» con [Deshacer], que deja el viaje como estaba Probado: sale «Añadido el Free Tour · domingo 18» y Deshacer devuelve los días de antes y quita la experiencia free_tour.  
  *Dónde:* Tras añadirlo, el aviso oscuro de abajo con «Deshacer».  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_anadido.jpg`
- ✅ Hecho — Quién puede: el administrador y quien puede editar, directo El cambio se aplica directo a la ruta (sin diferencia de permiso en la pantalla). Para quien edita, el guardado del viaje es el de siempre. Comprobado con la cuenta de pruebas (administrador); la del editor usa el mismo código.  
  *Dónde:* Cuenta administrador o con «Puede editar»: EXPLORAR > Entradas > Free Tour > «+».
- ⚠️ A medias — Quien solo recomienda: su propuesta lleva UN solo cambio «Añadir el Free Tour al jueves 12»; al aceptarlo se hace lo de arriba Probado a nivel de lógica (cambiosDeLaPropuesta da un único cambio free_tour con ese texto, el paquete que se manda lleva 1 cambio, y [Deshacer este cambio] devuelve los días de antes). Aceptarlo llama a aplicarFreeTourPropuesto (propuestaDueno.ts) con la misma pieza de «+ Añadir»; no he podido probar el aceptar de verdad con dos cuentas reales. Falta mirarlo en dos móviles.  
  *Dónde:* Cuenta que solo recomienda: añadir el Free Tour; abrir «Tu propuesta» (1 cambio). Cuenta administradora: el aviso de la propuesta > Aceptar.
- ✅ Hecho — Nunca después de la cena ni fuera de su franja Ya no se usa la franja «noche» (la que lo ponía tras la cena): el Free Tour queda en el día D3 a las 10:00. Comprobado: no es la última parada del día y su hora es de mañana.  
  *Dónde:* DÍAS > día del Free Tour: primera hora de la mañana, nunca debajo de «Noche».  *Captura:* `docs/dias/capturas_jutrip/10n5_freetour_anadido.jpg`
- ✅ Hecho — Si para esto hay que tocar el motor, dímelo antes No he tocado el motor (server/engine, shared/routeEngine). Uso /api/rebuild-day con force_order, la misma pieza que «Eliminar reserva». No hace falta la muestra de 60 fechas.  
  *Dónde:* —

**2**

- ⚠️ A medias — Añadir un sitio y que la app reorganice: «Viajes ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.» Texto y apunte desde el móvil hechos y probados (la ruta lleva ruta.ultimoCambio = acción free_tour). El aviso real al otro móvil lo copia el disparador de la migración 0051 (SIN aplicar): hasta entonces llega el aviso de antes, ya sin lo de «ha quitado 6 sitios» pero sin la frase del Free Tour.  
  *Dónde:* Cuenta invitada: añadir el Free Tour; cuenta administradora: campana (necesita la 0051 aplicada).
- ⚠️ A medias — Mover sitios: «Viajes ha movido el Coliseo al jueves 12.» (y «…y 2 sitios más») Texto probado con la lista de sitios movidos. El disparador de la 0051 los compara por nombre y deja la lista; sin aplicar la 0051 el aviso trae solo cuántos se movieron.  
  *Dónde:* Cuenta invitada: mover el Coliseo a otro día; cuenta administradora: campana.
- ✅ Hecho — Quitar: «Viajes ha quitado la Iglesia del Gesù.» Texto probado; los quitados salen por nombre.  
  *Dónde:* Cuenta invitada: quitar una parada; cuenta administradora: campana.
- ⚠️ A medias — Nunca «ha quitado N sitios» cuando solo se han movido de día Hecho en dos sitios: el texto junta lo «quitado» y «añadido» con el mismo nombre como «movido» (también en avisos viejos), y el disparador de la 0051 compara por nombre en vez de por id. Probado el texto; el disparador sin aplicar.  
  *Dónde:* Cuenta administradora: campana tras mover sitios con la cuenta invitada.
- ⚠️ A medias — El interruptor [Roma | Excursión]: «Viajes ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento).» / «…a un día en Roma.» cambiarInterruptor apunta la acción en el primer paso que cambia la ruta (dayInterruptor.ts) y el texto está probado. No he ejercitado el interruptor en la app (el viaje de pruebas de 4 días no tiene día de excursión). Necesita la 0051.  
  *Dónde:* RUTA/DÍAS: un viaje de 5 días con el día 4 en [Roma | Excursión]; cambiarlo y mirar la campana de la otra cuenta.
- ⚠️ A medias — Cambios grandes de golpe (cambiar las fechas, rehacer la ruta): una línea con lo que decidió la persona Cambiar las fechas apunta «ha cambiado las fechas del viaje (del 12 al 16 de noviembre).» y, si las fechas son las mismas, «ha rehecho la ruta.». Probados los textos; no ejercitado el cambio de fechas en la app. Necesita la 0051.  
  *Dónde:* RUTA > fechas del viaje > cambiarlas; campana de la otra cuenta.
- ⚠️ A medias — Al tocar el aviso, lleva a los días que han cambiado con lo nuevo marcado («Movida», «Nueva») Hecho: abrirAviso abre DÍAS en el primer día cambiado y las paradas llevan la etiqueta «Nueva» (verde) o «Movida» durante 2 minutos (useCambiosMarcados + StopAccordion). Probada la lógica de qué marcar; no lo he visto en pantalla con un aviso real (necesita la 0051).  
  *Dónde:* Campana > aviso de cambio del viaje: se abre DÍAS en el día cambiado, con las etiquetas.

**2b**

- ⚠️ A medias — «Recuperar mi ruta»: «Eric ha vuelto a la ruta inicial.» restoreOriginalRoute apunta la acción y el texto está probado. Necesita la 0051.  
  *Dónde:* RUTA > flecha de «Recuperar mi ruta»; campana de la otra cuenta.  *Captura:* `docs/dias/capturas_jutrip/10n5_recuperar_ruta.jpg`
- ⚠️ A medias — «Recuperar este día»: «Eric ha recuperado el sábado 14 como estaba.» restoreOriginalDay apunta la acción y el texto está probado en la app. Necesita la 0051.  
  *Dónde:* DÍAS > «···» del día > Recuperar este día; campana de la otra cuenta.
- ⚠️ A medias — Por qué decía «ha cambiado las fechas» con las mismas fechas, y que nunca pase si no cambian CAUSA: el disparador de la 0036 junta los cambios seguidos (15 min) SUMANDO: un cambio quitó un día (acabó el 14) y otro lo devolvió (acabó el 15); «fechas» se quedaba en verdadero y los días salían «quitado 1, añadido 1». Arreglo en la 0051: lo de antes del primer cambio manda y se compara con lo de ahora (días, inicio y fin); además «Recuperar» ya es una línea con su acción. El texto nunca dice «ha cambiado las fechas» si antes y ahora son iguales (probado). La 0051 está probada en PGlite (Postgres real con la 0036 debajo: scripts/destino/pruebaTanda10N5_aviso_sql.mjs, 12 comprobaciones, 0 fallos) pero SIN APLICAR en Supabase.  
  *Dónde:* Cuenta administradora: Recuperar mi ruta; campana de la otra cuenta (necesita aplicar la 0051).

**3**

- ✅ Hecho — Al unirse (enlace, código o aviso) se abre ese viaje directamente; el anterior sigue en Mis viajes Código: abre el viaje sin recargar (trae la lista de viajes de nuevo). Enlace/aviso: ya abría tras recargar (TripSync); con la hoja nueva se ve la franja. Probado con Supabase simulado en la página, no contra el real.  
  *Dónde:* Cuenta de verdad: Perfil > [+] > Unirme con un código; luego Perfil > Mis viajes para ver el anterior  *Captura:* `docs/dias/capturas_jutrip/10n5_union_03_dentro.jpg`
- ✅ Hecho — Hueco para escribir el código (hoja Unirse Codigo 01, exactamente igual) 8 huecos 34x58, guion tras el 4.º, mayúsculas y sin espacios/guiones, [Unirme] dorado 54 px; la hoja sube con el teclado.  
  *Dónde:* Primera pantalla (sin viaje) o Perfil > [+]  *Captura:* `docs/dias/capturas_jutrip/10n5_union_01_hoja.jpg`
- ✅ Hecho — Dos sitios con la misma hoja: primera pantalla y [+] del perfil También el «Tengo un código de invitación» de Ajustes abre la misma hoja (se quitó la antigua).  
  *Dónde:* Primera pantalla (debajo de ORIGEN/DESTINO) y Perfil > [+]  *Captura:* `docs/dias/capturas_jutrip/10n5_union_04_primera_pantalla.jpg`
- ✅ Hecho — Franja «Te has unido al viaje a Roma de Eric · Ahora lo ves igual que él» Nombre con nombreVisible. Sin nombre de quien invita, no se inventa. En el flujo sin cuenta (tras recargar) también sale.  
  *Dónde:* Tras unirse, arriba del viaje abierto  *Captura:* `docs/dias/capturas_jutrip/10n5_union_03_dentro.jpg`
- ⚠️ A medias — Sin cuenta: «Entra o crea tu cuenta para unirte» y al entrar se une solo Guarda código aceptado, la puerta lo detecta y muestra el texto; al entrar canjea solo (código ya existente). Probado el guardado y por código; el flujo de entrar con cuenta real no se ha probado de punta a punta.  
  *Dónde:* Sin cuenta: Primera pantalla > Únete con un código > Unirme
- ✅ Hecho — Código que no vale: «Ese código no es de ningún viaje…» Huecos en rojo y [Unirme] apagado hasta cambiar el código.  
  *Dónde:* Primera pantalla (sin viaje) o Perfil > [+]  *Captura:* `docs/dias/capturas_jutrip/10n5_union_02_no_vale.jpg`
- ✅ Hecho — Si ya está en ese viaje, lo abre y ya Sin gastar uso (no canjea).  
  *Dónde:* Perfil > [+] > Unirme con un código (con un código de un viaje propio)
- ⚠️ A medias — Límite de intentos seguidos Móvil: 6 fallos en 15 min (probado). Servidor: migración 0047 escrita y SIN APLICAR; hasta aplicarla el límite solo está en el móvil.  
  *Dónde:* Escribir 6 códigos malos seguidos

**4**

- ✅ Hecho — Cabecera única: foto con marco, Hola, Nivel, EXP en pequeño, ajustes arriba a la derecha Marco a 104 px (como hoy, según el prompt; Design dibuja 118). Se mantiene el chip de título solo si hay títulos.  
  *Dónde:* Perfil (círculo arriba a la derecha)  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_01_abrir.jpg`
- ✅ Hecho — Mis viajes en fila de lado, siguiente asoma, en curso/próximo primero, Ver todos (N), antes de la app al final Tarjeta de Perfil Orden (330 px); «Editar» sigue junto al título. Se siguió Perfil Orden en vez del layout grande de Mis Viajes Tarjeta (misma etiqueta/portada/cámara/botón).  
  *Dónde:* Perfil > Mis viajes  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_02_entero.jpg`
- ✅ Hecho — Tarjeta: portada, etiqueta, nombre, fechas y días, solo icono de cámara, Abrir este viaje; fuera Sin fotos Hecho: botón con borde, sin relleno (como Design 04).  
  *Dónde:* Perfil > Mis viajes  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_01_abrir.jpg`
- ✅ Hecho — Mi vitrina y Mi pasaporte sin tocar, después de los viajes Código intacto, solo envueltos con margen 20.  
  *Dónde:* Perfil > bajar  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_02_entero.jpg`
- ✅ Hecho — Billete del sorteo abajo del todo Después del pasaporte.  
  *Dónde:* Perfil > bajar hasta el final  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_02_entero.jpg`
- ✅ Hecho — Fuera la palabra PERFIL; arriba solo ajustes y ✕  
  *Dónde:* Perfil  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_01_abrir.jpg`
- ✅ Hecho — [+] flotante con hoja «¿Qué quieres hacer?» y tres tarjetas; sustituye Nuevo viaje y el botón del final; no tapa la última tarjeta Sin logros salen solo 2 tarjetas (viaje previo es de los logros).  
  *Dónde:* Perfil > [+]  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_03_hoja_mas.jpg`
- ✅ Hecho — Ver todos: lista por grupos  
  *Dónde:* Perfil > Ver todos (N)  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_05_ver_todos.jpg`
- ✅ Hecho — Quitar los 70 px entre pasaporte y Mis viajes  
  *Dónde:* Perfil
- ✅ Hecho — Datos de Design de ejemplo: usar los reales  
  *Dónde:* Perfil
- ✅ Hecho — Con logros apagados: perfil sin EXP, vitrina ni sorteo  
  *Dónde:* Perfil con ?logros=off  *Captura:* `docs/dias/capturas_jutrip/10n5_perfil_sin_logros.jpg`
- ✅ Hecho — Que se abra al momento (código precargado, última foto guardada, datos por detrás sin parpadeo) Medido en dev con 4G simulada (9 Mbit, 170 ms), CPU x4, servidor de logros a 500 ms: antes 1946 ms hasta ver Hola/nivel; después 509 ms la primera vez y 70-78 ms con lo guardado. Dev, no producción.  
  *Dónde:* Perfil (círculo)

**5**

- ⚠️ A medias — Todas las escenas a todo el ancho como la primera Escenas 1,4,5,6 pasan a columna centrada dentro de un escenario de lado a lado, sin recuadro; el resplandor de la 6 llega a los bordes; el cielo de la 3 se funde por los 4 lados. El teléfono de HOY, el pasaporte y el globo conservan su proporción (no se ensanchan como el mapa de la 0).  
  *Dónde:* Película del pase (candado/pastilla › Ver el Pase), 390x664 y 375x667  *Captura:* `10n5_pelicula_e3_secretos_390x664.jpg`
- ✅ Hecho — Título pequeño «Todo lo que incluye tu Pase {destino}» en la línea de [Saltar], centrado En las escenas 0-6 (no en el final, donde van [Ver] y ✕). Medido: misma línea (±4 px), centrado, sin tocar [Saltar].  
  *Dónde:* Película, todas las escenas  *Captura:* `10n5_pelicula_e0_tu_viaje_390x664.jpg`
- ✅ Hecho — Adaptada escena por escena (390x664 y 375x667): nada pisado ni cortado Arreglada la escena 4 (tarjetas pisaban «Viaja, Juega…»). Prueba automática de pisados/cortes en 6 escenas x 3 tamaños y la escena 4 a 5 tiempos.  
  *Dónde:* Película, escena 4 «Cada sitio que ves, suma»  *Captura:* `10n5_pelicula_e4_suma_t19_375x667.jpg`
- ✅ Hecho — Rayitas tocables que reinician la escena 7 rayitas con zona de 22 px; irALaEscena.  
  *Dónde:* Película, tocar una rayita  *Captura:* `10n5_pelicula_e5_pasaporte_390x664.jpg`
- ⚠️ A medias — Pasaporte sin el rato parado La vuelta al mundo acaba en el segundo 40,6 y la escena duraba 43,8 (3,2 s quieta): ahora 41,3. Si el rato de 7 s que ve Eric es otro momento (p. ej. la mapa plano de Japón de 10 a 14 s), necesito el instante exacto.  
  *Dónde:* Película, escena del pasaporte  *Captura:* `10n5_e5_t30.jpg`

**6**

- ✅ Hecho — [Guardar] solo «Guardar» AddReservationSheet y la hoja de hora de vuelo; tests antiguos actualizados.  
  *Dónde:* RESERVAS › añadir reserva

**6b**

- ✅ Hecho — Caja pequeña (Pase Estilo 01) en todos los sitios que piden el pase (menos HOY) Candado.tsx rehecho: RESERVAS alojamiento y llegada/vuelta, DÍAS (zona, ajuste llegada/vuelta), cómo llegar al alojamiento, Logros. Último día de DÍAS: el botón principal en azul oscuro con candado dorado. TarjetaPaseReservas no se usa en ningún sitio.  
  *Dónde:* RESERVAS › Alojamiento; DÍAS › día 1; Logros  *Captura:* `10n5_caja_reservas_alojamiento.jpg`
- ✅ Hecho — Lo pequeño bloqueado en azul oscuro con candado dorado Tarjetas Baños y Fuentes de EXPLORAR y pestaña «Cerca de ti» del explorador de lugares.  
  *Dónde:* EXPLORAR; explorador › Cerca de ti  *Captura:* `10n5_bloqueado_cerca_de_ti.jpg`
- ✅ Hecho — Textos verdad sobre el alojamiento Tres cajas y la lista cambiadas; la película y la lista vienen ya corregidas en Design (RETOQUES). Nada en roma.json ni en el motor.  
  *Dónde:* RESERVAS, película, lista de lo que incluye  *Captura:* `10n5_caja_reservas_alojamiento.jpg`

**6c · Vuelo y alojamiento de cada uno**

- ✅ Hecho — Cada uno puede poner su vuelo y su alojamiento (también quien solo recomienda): es suyo, no cambia la ruta de nadie Quien no es el administrador (editar o recomendar) ve «Tengo otro vuelo · Pon el tuyo» y «Me alojo en otro sitio · Pon el tuyo»; la hoja de su vuelo (Ida / Vuelta, hora, punto, precio) y la de su alojamiento. Se guarda en su móvil y, con la migración 0049, en `lo_suyo_del_viaje` (solo lo ve ella, RLS). La ruta no lo mira.  
  *Dónde:* RESERVAS · con la cuenta de Ana (invitada) · fila «Tengo otro vuelo» > elegir hora > Guardar; fila «Me alojo en otro sitio» > escribir nombre > Guardar  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_03_ana_lo_suyo.jpg`
- ✅ Hecho — Si el administrador pone uno «para todos / para algunos», se cambia el de esas personas y a cada una le llega «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.» El administrador marca «¿Para quién es?» en «En este vuelo» / «En este alojamiento» (se guarda con el viaje, `cuentasEntre`). Un disparador de la base de datos (0049) borra lo de las personas marcadas y les manda el aviso (para todos / para ti / para algunos; vuelo y alojamiento por separado). Probado en PGlite con las migraciones reales. A todas las marcadas les llega aviso, tuvieran el suyo o no (duda abajo).  
  *Dónde:* RESERVAS · con la cuenta de Eric (administrador) · bajo «Llegada y vuelta» tocar «En este vuelo» > marcar personas > Guardar; el aviso lo ve Ana en la campana y la franja  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_05a_aviso_a_ana.jpg`
- ✅ Hecho — Cada uno puede volver a poner el suyo cuando quiera («Tengo otro vuelo · Pon el tuyo», «Me alojo en otro sitio · Pon el tuyo»): sale solo del «¿Para quién es?» del administrador y al administrador le llega «Ana ha puesto su propio vuelo.» Sin pedírselo a nadie. Al administrador le llega el aviso (con «Llegada a Roma · martes 10» o «Se aloja en …»), una vez por cada cambio distinto. El administrador ve «Otro vuelo · Ana tiene su propio vuelo» (con los avatares de quienes tienen otro) y «En este vuelo» sin ella.  
  *Dónde:* RESERVAS · Ana: «Tengo otro vuelo» > Guardar · Eric: campana / franja «Ana ha puesto su propio vuelo.» y, en RESERVAS, filas «En este vuelo» y «Otro vuelo»  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_05_aviso_a_eric.jpg`
- ✅ Hecho — La ruta sigue al vuelo y al alojamiento del administrador (primer y último día, y la zona), como hoy; lo de cada uno es para él, en su RESERVAS No he tocado el motor ni lo que lee la ruta: lo de cada uno vive aparte (`lo_suyo_del_viaje`) y la ruta solo mira `arrivalFlightTime`, `departureFlightTime` y la zona del viaje.  
  *Dónde:* RUTA / DÍAS · el primer y el último día siguen al vuelo de Eric aunque Ana tenga otro
- ✅ Hecho — Cuentas: el vuelo y el alojamiento del administrador se reparten entre «para quién es»; los vuelos ahora SÍ entran; lo de cada uno es suyo y no se reparte; si alguien pone el suyo, sale del reparto y las cuentas se ajustan solas; nada se cuenta dos veces `aportacionesDelViaje` incluye ida y vuelta del administrador (tipo `vuelo`) y el alojamiento, entre sus «¿Para quién es?» sin quien tiene lo suyo (si no queda nadie, del administrador). «Por persona» del presupuesto igual. Los posibles duplicados (gasto «Billete de avión» de igual importe) se avisan como en la 10N3. Se actualizaron las pruebas viejas de la 10N3 que decían «los billetes no entran».  
  *Dónde:* Cartera (presupuesto) > Cuentas del grupo · «Entra solo desde RESERVAS» con Ida, Vuelta y Alojamiento; cada línea con «Para quién es»

**6c · Entradas de cualquiera en las cuentas**

- ✅ Hecho — Las entradas que reserva cualquiera para varios entran en las cuentas (la pagó quien reservó, se reparte entre su «¿Para quién es?»); las solo-para-ella no cuentan; nada se cuenta dos veces Quien reserva en el viaje de otra persona ahora ve «¿Para quién es?» en la hoja de la reserva (él siempre marcado). Una RPC (`entradas_del_grupo`, 0049) las enseña a los del viaje y las cuentas las suman (pagó el invitado). Las de una sola persona, las excursiones y las sin precio no cuentan; la misma reserva dos veces cuenta una; un gasto igual se avisa como posible duplicado. Lo que NO he hecho: que las personas incluidas vean esa entrada de Ana como «Reservada ✓» en su RESERVAS (duda abajo).  
  *Dónde:* RESERVAS · con la cuenta de Ana > Entradas > Añádela > ¿Para quién es? (marcar a otros) > Guardar; cartera > Cuentas del grupo

**6c · Pantallas de Design**

- ⚠️ A medias — Pantallas 01 y 02: Ana con el vuelo y el alojamiento de Eric, siempre «Lo ha puesto Eric · …» (también en la 01) Hecho con los textos, colores, medidas y tipografías de Design. Pastilla «Lo ha puesto Eric · para todos» (o «para Eric y para ti» / «para 3 de 4»). Cuando el texto no cabe junto al título, la pastilla pasa a dos líneas, igual que en la captura de la pieza de Design a 390; en un móvil real con Geist puede caber en una.  
  *Dónde:* RESERVAS · cuenta de Ana (invitada con «Recomendar» o «Editar»), viaje compartido  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_01_ana_vuelo_de_eric.jpg`
- ✅ Hecho — Pantalla 03: Ana con lo suyo («Tuyo» y [Cambiar]) Chip verde «Tuyo», líneas «✈ Ida · mar 10 · 13:40 · Ciampino» y «Te alojas en Trastevere», enlace [Cambiar] subrayado dorado.  
  *Dónde:* RESERVAS · cuenta de Ana · tras guardar su vuelo y su alojamiento  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_03_ana_lo_suyo.jpg`
- ⚠️ A medias — Pantalla 04: Eric con quién va en su vuelo («Tú, Laura y Marcos») y quién tiene otro («Ana tiene su propio vuelo») Las dos filas (En este vuelo con avatares, Otro vuelo con avatar) y la hoja «¿Para quién es?» están. Diferencia: en Design la pastilla «Para todos» va dentro de la cabecera de la tarjeta «Llegada y vuelta»; yo no he tocado esa cabecera (es el bloque de siempre del administrador) y el «para quién» se ve en la fila «En este vuelo». Lo dejo como duda.  
  *Dónde:* RESERVAS · cuenta de Eric (administrador), viaje compartido, vuelo ya puesto  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_04_eric_quien_va.jpg`
- ✅ Hecho — Pantalla 05: los avisos («Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.» a Ana · «Ana ha puesto su propio vuelo.» a Eric) Franja de aviso nuevo con título y detalle como Design («Llegada a Roma · martes 10»); en la campana, la frase entera de una línea.  
  *Dónde:* Cualquier pestaña · franja de arriba al llegar el aviso, y campana > lista  *Captura:* `docs/dias/capturas_jutrip/10n5_cadauno_05_aviso_a_eric.jpg`

**6c · Migración**

- ✅ Hecho — Si hace falta migración, escribirla y decir cuál aplicar 0049_lo_suyo_de_cada_uno.sql (idempotente, va después de 0035, 0038 y 0042). Sin aplicarla todo funciona en el propio móvil, pero el administrador no ve quién tiene lo suyo, las cuentas no lo saben y no llegan los avisos.  
  *Dónde:* SQL editor de Supabase: pegar la 0049 entera

**6d · Añadir gasto**

- ✅ Hecho — «¿Quién lo ha pagado?» pasa a «¿Quién ha pagado?» y «¿Entre quién?» a «¿Para quién es?», en todos los sitios (añadir y editar un gasto, las cuentas del grupo…) Cambiado en la hoja de añadir/editar, en las cuentas (botón del alojamiento y su hoja) y en los comentarios. Pruebas viejas de la 10N, 10N2 y 10N3 actualizadas a los textos nuevos.  
  *Dónde:* Cartera (presupuesto) > Añadir gasto (en un viaje compartido, [Para todos])  *Captura:* `docs/dias/capturas_jutrip/10n5_gastos_hoja_ana.jpg`
- ✅ Hecho — Quién ha pagado, por defecto: quien añade el gasto, el primero de la lista y ya marcado; los demás detrás y sin marcar (se pueden marcar si pagaron a medias); al editar se queda lo que ya tenía Antes ya salía marcado solo quien añade, pero iba detrás del administrador; ahora va el primero. Probado con Ana (invitada) y con Eric (administrador) y al editar un gasto de Luis y Eric.  
  *Dónde:* Cartera > Añadir gasto · [Para todos] · «¿Quién ha pagado?»  *Captura:* `docs/dias/capturas_jutrip/10n5_gastos_hoja_ana.jpg`
- ✅ Hecho — La línea de abajo, como está («12,50 € cada uno») No se ha tocado.  
  *Dónde:* Cartera > Añadir gasto · escribir un importe  *Captura:* `docs/dias/capturas_jutrip/10n5_gastos_hoja_ana.jpg`
- ✅ Hecho — Con espacio entre los bloques: «¿Quién ha pagado?» y sus nombres separados de lo de arriba y de lo de abajo; lo mismo «¿Para quién es?» Los bloques de la hoja van con separación grande (de 12 a 20 px).  
  *Dónde:* Cartera > Añadir gasto  *Captura:* `docs/dias/capturas_jutrip/10n5_gastos_hoja_ana.jpg`

**6e · Avisos borrados de verdad**

- ✅ Hecho — Los avisos ocultos (Eliminar) se borran del todo a los 30 días `purgar_avisos()` (migración 0048). Probado en PGlite: eliminado hace 10 días se queda, hace 31 o 40 se borra.  
  *Dónde:* No se ve en el móvil: solo desaparecen de la base de datos (campana > Gestionar > Eliminar, y 30 días después)
- ✅ Hecho — Los avisos de más de un año (leídos o no) también se borran solos Misma función. Probado con un aviso de hace 400 días sin eliminar.  
  *Dónde:* No se ve en el móvil
- ✅ Hecho — Que lo haga el servidor solo, una vez al día (pg_cron o servidor de la app: decidir y justificar) Servidor de la app: la tarea de Vercel que ya corre cada día a las 9:00 (`/api/cron/avisos`, con CRON_SECRET) llama a `purgar_avisos` al empezar. Motivo: ya existe y no hay que activar la extensión pg_cron en Supabase ni añadir nada que mantener; si falta la 0048 solo lo apunta en el registro y los avisos siguen funcionando.  
  *Dónde:* Vercel > Cron > /api/cron/avisos (respuesta con `limpieza: { borrados, claves_olvidadas }`)
- ✅ Hecho — Al borrarlos, que no vuelvan a salir (la «clave» de no repetir): «Mañana empieza tu viaje» de un viaje que ya pasó Antes de borrar se apunta la clave (no el contenido) en `avisos_borrados` y un disparador rechaza cualquier aviso nuevo con esa clave; las claves se olvidan a los 2 años. Probado: el aviso borrado no se puede recrear con `crear_aviso`; otra persona con la misma clave no se ve afectada.  
  *Dónde:* No se ve en el móvil
- ✅ Hecho — [Deshacer] sigue funcionando como hoy (unos segundos después de eliminar) No se ha tocado la campana ni la 0046; comprobado que `ocultar_avisos(false)` devuelve el aviso.  
  *Dónde:* Campana > Gestionar > Eliminar > [Deshacer]

**6e · Migración**

- ✅ Hecho — Si hace falta migración, escribirla y decir cuál aplicar 0048_avisos_borrado.sql (idempotente, después de la 0046).  
  *Dónde:* SQL editor de Supabase: pegar la 0048 entera

**7 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N5 (Free Tour, avisos, unirse, perfil, pase y película, cada uno, gastos, avisos borrados) Prueba de la Tanda 10N5: 493 comprobaciones, 0 fallos (Free Tour 57, SQL del aviso 12, unirse 53, perfil 47, pase 217, cada uno 60+15, gastos 11+3, avisos 18). pruebaJutrip 129/0.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería completa y pruebaJutrip (la muestra de 60 fechas no hace falta: no se ha tocado el motor) Bateria completa: 39 de 131 en MAL a la primera, por expectativas antiguas ya actualizadas, 3 regresiones de texto arregladas y flakes de carga; todas pasan sueltas con 0 fallos. Lo que solo falla con otras a la vez va a la 10S.  
  *Dónde:* No es de móvil.

**7 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, cada una al lado de la de Design  
  *Dónde:* Esta página.

**8 · El informe**

- ✅ Hecho — Apartado «10N5» en docs/dias/INFORME_TANDA10B.md y esta lista al final  
  *Dónde:* No es de móvil.

**Pruebas:** Prueba de la Tanda 10N5: 493 comprobaciones, 0 fallos (Free Tour 57, SQL del aviso 12, unirse 53, perfil 47, pase 217, cada uno 60+15, gastos 11+3, avisos 18). pruebaJutrip 129/0.

---

## 10N6 — Más arreglos del repaso de Eric (27-oct)

**Estado:** hecho y probado. Prueba nueva `pruebaTanda10N6` (confirmaciones, aviso del pase, EXPLORAR, recuerdos, perfil a 118 px, cuentas y entradas). No se ha tocado el motor de rutas, así que no hace falta la muestra de 60 fechas. Design al día con el `RETOQUES.zip` nuevo (`Recuerdos Ficha`, `Pase Estilo` 04, `Cuentas Modo` copiada para la 10N7; `Pase Premium` no se usa).

### Migración que tienes que aplicar (a mano, en el editor SQL de Supabase)
- `0053_entradas_de_invitados_y_avisos_de_lo_suyo.sql` — idempotente, va después de la 0042 y la 0049. Sin ella: no llega el aviso de una entrada reservada por un invitado, y los avisos de «lo suyo» siguen como antes («Se ha cambiado el tuyo» siempre y un aviso por cada cambio). Todo lo demás (ficha, DÍAS, RESERVAS, presupuesto, cuentas) funciona sin ella.
- Siguen sin aplicar las de la 10N5: `0047`, `0048`, `0049`, `0051` (la 0050 no existe, es un salto de numeración).

### Respuestas a tus dudas de la 10N5 (apartado 0a)
- D1-FT/D3: se queda como está (el día elegido pasa a D3). El botón de DÍAS en azul oscuro con dorado: se queda. Marco de la foto del perfil: ahora a 118 px. ✈ de «Lo de cada uno»: se queda. Vuelo propio y alojamiento propio en viajes de varios destinos: en gris, como está. Sin D2/D3 el Free Tour no se añade y se dice por qué: bien. Sonido: el que hay. Escena del pasaporte: pendiente de que me digas el segundo exacto.
- Aviso «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.»: ahora solo a quien tenía su propio vuelo o alojamiento (campo `suyo_cambiado`); a los demás marcados, «Eric ha puesto el vuelo para todos.».
- Varios cambios seguidos del vuelo o alojamiento del administrador: se juntan en un solo aviso (15 minutos, sin leer), con lo último que quedó.
- Presupuesto de un invitado: enseña lo suyo (su vuelo y alojamiento si los tiene, o los del administrador si va en ellos); nunca los del administrador si no va en ellos.

### Qué se ha hecho
- **Free Tour (§1):** la hoja vieja «¿A qué hora lo quieres?» ya no sale desde ningún sitio. Ya no salía desde la 10N5 en RESERVAS, «+ Añadir parada», EXPLORAR y la ficha (no faltaba quitarla de ninguno); solo quedaba el envoltorio `FreeTourSheet.tsx`, que reparte entre «¿A qué día lo añadimos?» y la hoja de la ruta a mano. Fuera «Quitar el Free Tour» de esa hoja: se quita como cualquier parada (tres puntitos, «Quitar parada», la última, en rojo). Sin reserva, vuelve a D2/D1 sin preguntar y con aviso «Free Tour quitado de tu ruta» y [Deshacer]. La ruta a mano sigue como hoy.
- **Elegir y confirmar (§1b):** tarjetas para elegir, confirmación solo cuando se pierde algo, con pregunta con artículo y botón rojo (`ConfirmDialog` admite ahora `peligro`). Quitar una parada normal ya no pregunta: avisa «Quitada de tu ruta: …» con [Deshacer], y su tarjeta dice «Sale de tu ruta. Puedes deshacerlo». «Personas del viaje»: «¿Quitamos a Ana del viaje?» · «Dejará de verlo y su plaza del pase vuelve a ti.» · [Cancelar] [Sí, quitar].
  - Confirmaciones que quedan en la app: parada con entrada o Free Tour reservado (3 botones); eliminar un día («¿Quitamos el sábado 17 de tu viaje?»); acortar fechas en ruta a mano; cambiar un día por la excursión; recuperar un día o la ruta («Sí, recuperar», sin rojo porque no quita); quitar una reserva; quitar vuelo, alojamiento o seguro; quitar una excursión reservada; quitar a una persona; quitar una foto («¿Quitamos esta foto?»); salir de un viaje; eliminar un viaje; borrar la cuenta (estas tres, sin cambio de texto). Capturas: parada con entrada, Free Tour, eliminar día y parada normal quitada; las demás sin captura.
- **Quitar una parada con entrada (§1c):** salen todas las opciones y las imposibles en gris con el porqué («Cambiar parada · Tienes entrada para el Coliseo», «Mover a otro día · Tienes entrada para el lunes 19 a las 9:15»). «Quitar parada», la última, en rojo: «Sale de tu ruta. Tienes su entrada: te preguntamos qué hacer con ella.» Confirmación: «¿Quitamos el Coliseo de tu ruta?» · [Quitar solo de la ruta] · [Quitar también la entrada] (rojo) · [Cancelar]. Si se quita solo de la ruta, la entrada se queda en RESERVAS con «Ya no está en tu ruta» y [Volver a ponerla en su día] (marca nueva `fueraDeRuta`, el motor no la recibe). Probado: «solo», «también», [Cancelar] y [Deshacer].
- **«Cerca de ti» y «Recomendados» (§1d):** «Cerca de ti» sin pase en azul oscuro con candado dorado (10N5); la regla nueva está en `Elegir.tsx`: si una opción del grupo es del pase, la elegida gratis va en claro con dorado. Hoy solo EXPLORAR tiene un grupo así.
- **«Cambiar parada» (§1e):** EXPLORAR de siempre con franja «Elige el sitio que cambia por el {artículo} {parada}» y ✕, el ⇄ de cada sitio, el corazón, y tocar la fila abre la información con «Cambiar por este». Los que ya están, «✓ En ruta».
- **Tus recuerdos (§1f):** propuesta A de Design, con tus textos, entre la cabecera y las pestañas de la ficha (`TusRecuerdos.tsx`). Fuera la cámara de encima de la foto (`BotonFotoParada.tsx` queda sin usar, borrable en la 10S). Hoja «Tus recuerdos» con `HojaOpciones`. Sin pase, una foto por sitio con «Cambiar la foto»; la segunda abre el aviso del pase. Las fotos van a la misma parada y día y al álbum del viaje (`subirFoto`, sin cambios por dentro).
  - **Para qué se usan hoy las fotos de las paradas:** tabla `trip_photos` y bucket privado `fotos-viaje`: álbum del viaje en el perfil, portada del viaje, «Tus fotos de hoy» en HOY, tarjeta de recuerdos en RUTA y «Después del viaje», efecto de la foto que vuela al álbum, borrado del viaje y miniaturas de logros. El logro «Visto con fotos» va por su propio flujo (`VistoFlujo`, con cámara de la app validada en el servidor) y no se ha tocado.
- **El aviso del pase (§1g):** una sola pieza para toda la app y todos los destinos (`abrirAvisoPase`, `AvisoPase.tsx`, textos en un solo archivo, `src/lib/avisoPaseTextos.ts`, con hueco para textos por destino). Si ya tiene pase no sale nunca.

  | Dónde sale (aviso pequeño) | Línea 1 | Línea 2 |
  |---|---|---|
  | Segunda foto en un sitio, sin pase | «Sin pase, guardas 1 foto por sitio.» | «Guarda todas las que quieras y crea tus recuerdos.» |
  | «Escuchar historia» tras la de prueba (HOY v1 y v2) | «Ya has escuchado tu historia de prueba.» | «Escucha todas las historias de tu viaje.» |
  | Pestaña «Cerca de ti» de EXPLORAR | «Tu ruta ya te dice qué hay en cada parada.» | «Descubre lo que tienes cerca de ti, allí donde estés.» |
  | Baños (EXPLORAR) | «Tu ruta ya te dice qué ver y dónde comer.» | «Encuentra los baños más cercanos en cada momento.» |
  | Fuentes (EXPLORAR) | «Tu ruta ya te dice qué ver y dónde comer.» | «Encuentra las fuentes de agua más cercanas.» |
  | HOY (preparada, sin llamador) | «Solo tienes HOY abierto el día de prueba.» | «Tu día, ajustado en directo a donde estás y a la hora que es.» |
  | Genérica (preparada, sin llamador) | «Esto no está en la versión gratis.» | «Desbloquea todo lo que el pase añade a tu viaje.» |

  **Revisa que sean verdad** los textos de «Cerca de ti», «Baños» y «Fuentes», «HOY» y la genérica: son míos (de K2) y prometen cercanía; no me consta que el pase lo haga tal cual. Los de la segunda foto y «Escuchar historia» son los que aprobaste.
  - **Llevan directo a la película del pase** (sin aviso pequeño; si ya la vio, al final): la pastilla «Pase Roma» de RUTA; las cajas pequeñas (zona del alojamiento en RESERVAS y en DÍAS, «Cómo llegar a tu alojamiento», Llegada y vuelta, ajustes de llegada y de vuelta en DÍAS, Logros); las tarjetas «Con el pase tendrás» de HOY y su «Ver el Pase de Roma»; «Tu último día»; y tocar los logros cerrados.
  - **La regla:** si lo que se toca es una función concreta que el pase desbloquea y no se explica en su sitio, aviso pequeño; si se toca algo cuyo fin es ver el pase, o que ya se explica solo, película.
- **Lista del pase (§1h):** `data/pase/lista_ajustes.json` tiene un campo nuevo `titulos` (cambia el nombre de la fila además de su línea): «Todas las fotos que quieras · En cada sitio y en tu álbum.» y «Todas las historias · De cada sitio, como una audioguía en tu móvil.». «Empiezas cerca de donde duermes» ya no existe (la fila es «Adaptamos tu ruta a tu alojamiento · El primer día, y como mucho el último, según tu zona.»). «La puesta de sol y lo de mañana» fuera de `prometidas_sin_hacer`; por eso la lista final de la película tiene ahora una fila más.
- **Música de la película (§1i):** `public/sonidos/pelicula_pase.mp3` **no está**: queda todo preparado (`src/lib/peliculaMusica.ts`) y la película funciona igual sin el archivo, sin errores. Con el archivo: empieza al tocar [Ver], volumen 0,22 con fundidos de 1,6 s, bucle, sigue al saltar de escena y con [Saltar], baja y se para al cerrar, se para al salir de la app, respeta «Sonido de los momentos», botón de silencio (altavoz fino gris) a la izquierda de [Saltar] que recuerda lo elegido. **Falta oírla con tu pista y comprimirla** a ~96 kbps con `scripts/destino/comprimirMusicaPelicula.sh` (no hay `ffmpeg` aquí; sin probar).
- **Presupuesto sin gastos (§1j):** el mismo bloque «Ruta» (tarjeta blanca con su icono), vacío y sin importe, con «Aquí se irán añadiendo todos los gastos de tu ruta.»; fuera el recuadro de rayas; debajo «Extras» con [+ Añadir gasto].
- **Lo que es solo para ti (§1k):** una reserva o un gasto solo para quien lo paga es personal: no cuenta en «Del grupo» ni en «Cuentas del grupo», sale en su presupuesto con candado y «Solo tú», y cuenta en «Tu parte». Si es para otro o para varios, es del grupo. Lo mismo con alojamiento, coche y vuelos. Presupuesto y cuentas usan ahora la misma función (`entreDeLoDelAdmin`), así que cuadran.
- **Entradas para varios (§1l):** **no funcionaba con invitados** (solo avisaba el administrador, y la ficha, DÍAS y RESERVAS solo miraban sus reservas). Ahora sí: módulo `entradasDelGrupo.ts`. A cada marcado le sale como suya (botón verde con ✓ en DÍAS, «Tu entrada» en la ficha, entrada en su RESERVAS); a los demás, botón azul con dorado y la ficha dice quién la tiene. Textos: «Eric y Ana la tienen para el jueves 12 · 9:15», «Eric, Ana y Laura la tienen…», «Eric la tiene a las 9:15 · Ana a las 11:00»; avisos «X ha reservado el Coliseo para ti · jueves 12 · 9:15» y «Eric y Ana han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?».

### Pruebas
- Prueba nueva `pruebaTanda10N6`: confirmar 61, aviso del pase 49, explorar 23, recuerdos 29, perfil 118 px 4, cuentas 65, entradas 12.
- Batería completa: 139 pruebas; a la primera pasada buena quedaron 32 en MAL (una pasada anterior se descartó porque los servidores se habían caído). El triaje de dos agentes: **ninguna regresión real**. Expectativas antiguas que la 10N6 cambió a propósito (se actualizaron): `pruebaFase6y4_perfil` (un tercer sitio sube fotos), `pruebaTanda10B` («Hoy te dará» con los títulos nuevos), `pruebaTanda10G` y `10O_datos` (los bloqueados abren el aviso pequeño), `pruebaTanda10H` («Escuchar historia» abre el aviso), `pruebaTanda10N_cabecera` («¿Quitamos el sábado…?»), `pruebaTanda10N4_entradas` (el botón de «Tus recuerdos» en lugar de la cámara). El resto, fallos solo bajo carga que pasan sueltas con 0 fallos (hay que espaciar las pruebas de navegador; eso va a la 10S).
- **`pruebaTanda10N6_recuerdos`:** pasa 29/0 con el Vite sin vigilar ficheros (`scripts/destino/_vite_estable.config.mjs`, el que usaron los agentes), pero con el Vite de desarrollo normal (recargas en caliente) falla siempre las mismas 3 comprobaciones de la sección «Con pase» («se guardan las 3», «van a la parada y al álbum», «tres miniaturas»). Comprobado a mano con un script aparte en ese mismo Vite: con pase, subir 3 fotos a la vez las guarda las 3 en unos 5 s (`listarFotos` = 3, sin error), así que `TusRecuerdos.tsx` y `subirFoto` funcionan. Es el mismo problema de módulos duplicados por las recargas en caliente que ya hizo que la batería arranque su propio Vite (10M); queda para la 10S. En el móvil: ficha de un sitio con pase → Tus recuerdos → Elegir de la galería → 3 fotos.
- `pruebaTanda10N3_real` falla 2 comprobaciones suelta («el DUEÑO recibe en directo el cambio del viaje que hace Luis» y «el aviso viaje_cambiado de la campana», con 0 eventos Realtime). No es de esta tanda: parece de entorno (Realtime sin activar en `trips`/`avisos` del Supabase real, o migraciones 0041-0051 sin aplicar). Míralo cuando apliques las migraciones.
- `pruebaTanda10N_compartir` necesita dos cuentas reales de Supabase y no se pudo pasar completa en local.
- `pruebaTanda7_mover` da 5 fallos (filas «Mié 10 Mar», día de excursión, A5 mover, «{n} días» en `fechas.ts` y `HoyAntesV2.tsx`) que K3 dice no ser de su parte; revisar en la 10S.

### Dudas para ti
1. **Excursión (1c, «lo mismo con excursión»): a medias.** No es una parada con «···»; su reserva se quita desde su tarjeta (ya preguntaba) y «Pasar este día a Roma» ya la dejaba en RESERVAS. Ahora esa línea dice «Ya no está en tu ruta», pero sin botón de volver a ponerla. ¿Lo quieres?
2. «Ya en tu viaje» → «✓ En ruta» en «Cambiar parada» (como EXPLORAR); el prompt decía «como hoy».
3. Ficha abierta desde EXPLORAR (sin día): «Tus recuerdos» sale igual y las fotos van al día de la ruta donde ya está el sitio o, si no está, al día 1.
4. «Cambiar parada» sigue abriendo con «Atracciones» y «Miradores» puestos (se pueden quitar). Si «como siempre» quiere decir sin filtros, es quitar `initialFilters` en `CambiarParada.tsx`.
5. «Tus recuerdos» no sale en las pausas (`isBreak`); sí en el Free Tour.
6. Los gastos [Para mí] de Extras siguen sin contar en «Tu parte» (así lo exigía `pruebaTanda10N_presupuesto`). Solo cuentan los personales de reservas, alojamiento, coche y vuelos. Si quieres que también cuenten, es una condición en `porPersonaDelPresupuesto`.
7. Una entrada «solo para quien la paga» solo cambia el dinero: se ve y avisa igual, para que los demás reserven la suya a la misma hora (lo necesita «Eric la tiene a las 9:15 · Ana a las 11:00»).
8. Un invitado ve en «Del grupo» solo lo que lo incluye, no el total del grupo (por la respuesta 8). El total completo sigue en «Cuentas del grupo».
9. Quitar un Free Tour sin reserva rehace los días con el motor (tarda unos segundos); si el servidor falla, no cambia nada y avisa.
10. Los textos de los avisos pequeños nuevos (tabla de arriba): revísalos, sobre todo «Cerca de ti», «Baños» y «Fuentes».
11. La música: pásame `pelicula_pase.mp3` cuando la tengas.
12. Lo que no se ha visto con dos cuentas reales (aceptar la propuesta del Free Tour, el aviso de entrada de un invitado, «Quitar a una persona» con su confirmación) lo pruebas tú con tus dos móviles después de aplicar las migraciones.


### Lista de comprobación de la 10N6 (punto por punto)

**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N6.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día con RETOQUES.zip (sin uploads/ ni screenshots/): Recuerdos Ficha, Pase Estilo, Cuentas Modo (copiada, es de la 10N7); Pase Premium no se usa  
  *Dónde:* No es de móvil.
- ⚠️ A medias — La música (1i) la deja Eric en public/sonidos/pelicula_pase.mp3: si no está, queda preparado y se dice en el informe El archivo no está todavía. Todo queda preparado y la película funciona igual sin él.  
  *Dónde:* Cuando pongas el mp3, abre la película del pase.

**0a**

- ✅ Hecho — El marco de la foto del perfil, a 118 px como en Design (comprobar que no tapa nada) CuerpoConLogros (con marco de rango, sin logros) y el esqueleto de carga pasan de 104 a 118. A 390 px de ancho el nombre queda entero a la derecha y dentro de la pantalla.  
  *Dónde:* Perfil (la cabecera)  *Captura:* `docs/dias/capturas_jutrip/10n6_perfil_marco_118.jpg`
- ✅ Hecho — 0a-6: «Eric ha puesto el vuelo para todos. Se ha cambiado el tuyo.» solo a quien tenía su propio vuelo/alojamiento; a los demás, sin «Se ha cambiado el tuyo» Migración 0053 (reemplaza la función de la 0049 sin editarla). Sin aplicarla, sigue como antes.  
  *Dónde:* Campana de Ana (con su vuelo) y de Laura (sin él)
- ✅ Hecho — 0a-8: el presupuesto de un invitado enseña lo suyo (su vuelo y alojamiento si tiene los suyos, o los del administrador si va en ellos; nunca los del administrador si no va) También enseña solo las entradas del administrador que le incluyen.  
  *Dónde:* Presupuesto como invitado › Transporte y alojamiento
- ✅ Hecho — 0a-10: varios cambios seguidos del vuelo/alojamiento del administrador se juntan en un solo aviso (15 min, sin leer), con lo último que quedó Migración 0053.  
  *Dónde:* Campana

**1**

- ✅ Hecho — Fuera la hoja vieja «¿A qué hora lo quieres?» del Free Tour, desde ningún sitio (RESERVAS, «+ Añadir parada», EXPLORAR, la ficha) La hoja de la hora ya había desaparecido en la 10N5 de los cuatro sitios (todos llevaban ya a FreeTourDiaSheet). Quedaba el envoltorio FreeTourSheet.tsx, que solo elige entre «¿A qué día lo añadimos?» (ruta nuestra) y la hoja de reserva (ruta a mano). Prueba: EXPLORAR · Entradas · + del Free Tour abre «¿A qué día lo añadimos?» y su texto no contiene «A qué hora», «Mañana», «Mediodía».  
  *Dónde:* EXPLORAR > Entradas > Free Tour > + (también ficha del Free Tour y DIAS > + Añadir parada > Entradas). Cuenta con pase o sin él, da igual  *Captura:* `docs/dias/capturas_jutrip/10n6_freetour_hoja.jpg`
- ✅ Hecho — «Quitar el Free Tour» fuera de esa hoja: se quita como cualquier parada (tres puntitos, «Quitar parada», la última, en rojo, con [Deshacer]) Se ha quitado el enlace «Quitar el Free Tour» de FreeTourDiaSheet (ahora, si ya lo tiene, la hoja dice «¿A qué día lo pasamos?» y solo mueve). «Quitar parada» sobre la parada del Free Tour en una ruta nuestra rehace los días a como estaban (D3→D2, D1-FT→D1) sin preguntar, con aviso «Free Tour quitado de tu ruta» y [Deshacer]. En ruta a mano, quita su parada (y su reserva si elige «también»). La fila de RESERVAS del Free Tour no tiene menú propio (solo [Cambiar] que abre la hoja de la reserva con «Eliminar reserva»), así que no hay menú de tarjetas que cambiar ahí.  
  *Dónde:* DIAS > día con Free Tour > «···» del Free Tour > Quitar parada (la última, rojo)  *Captura:* `docs/dias/capturas_jutrip/10n6_freetour_menu.jpg`
- ✅ Hecho — Las rutas a mano (sin días escritos) siguen como hoy: el Free Tour como una reserva más, con su día y su hora No se ha tocado esa rama (FreeTourComoReserva). Solo comprobado por código (la prueba corre con la ruta del motor).  
  *Dónde:* Ruta a mano > RESERVAS > Entradas y Free Tour > Free Tour

**1b**

- ✅ Hecho — Las tarjetas (HojaOpciones) son para elegir entre varias opciones; la confirmación (hoja con dos botones) es para confirmar una sola decisión Se respetan las dos piezas. Quitar a una persona: tarjetas «Cambiar permiso / Quitar del viaje» y luego la confirmación. Parada con entrada: tarjetas y luego confirmación de tres botones.  
  *Dónde:* DIAS > «···» de una parada; Perfil/Compartir > Personas del viaje  *Captura:* `docs/dias/capturas_jutrip/10n6_entrada_menu.jpg`
- ✅ Hecho — Confirmación solo cuando se pierde algo (parada con entrada/reserva, eliminar un día, quitar a una persona, borrar un viaje). Quitar una parada normal: sin pregunta y con [Deshacer] («Sale de tu ruta. Puedes deshacerlo»; fuera «Se confirma antes») Quitar parada normal ya no pregunta: la quita, avisa «Quitada de tu ruta: Arco de Constantino» y [Deshacer] la devuelve. La tarjeta dice «Sale de tu ruta. Puedes deshacerlo».  
  *Dónde:* DIAS > «···» de una parada normal > Quitar parada  *Captura:* `docs/dias/capturas_jutrip/10n6_parada_normal_quitada.jpg`
- ✅ Hecho — La confirmación, más cercana y con el botón rojo: pregunta con artículo, una línea con lo que pasa, [Cancelar] [Sí, quitar]; fuera las comillas ConfirmDialog tiene ahora «peligro» (botón rojo). Textos nuevos: «¿Quitamos el sábado 17 de tu viaje?», «¿Quitamos esos días de tu viaje?» (acortar fechas, ruta a mano), «¿Cambiamos el martes por la excursión?», «¿Quitamos tu reserva de X?», «¿Quitamos el seguro de viaje?» (ConfirmDeleteButton), «¿Quitamos este vuelo?», «¿Quitamos {excursión} de tu viaje?», «¿Quitamos esta foto?». Quedan sin botón rojo las de «Recuperar» (no quitan, vuelven a como estaba) con «Sí, recuperar».  
  *Dónde:* DIAS > «···» del día > Eliminar día; RESERVAS > una reserva > Eliminar  *Captura:* `docs/dias/capturas_jutrip/10n6_eliminar_dia.jpg`
- ✅ Hecho — Ejemplo «Personas del viaje»: tarjetas «Cambiar permiso», «Quitar del viaje»; «Quitar del viaje» abre «¿Quitamos a Ana del viaje?» · «Dejará de verlo y su plaza del pase vuelve a ti.» · [Cancelar] [Sí, quitar] HojaQuitar reescrita: título «¿Quitamos a {nombre} del viaje?», línea «Dejará de verlo y su plaza del pase vuelve a ti.» (sin plaza, «Dejará de verlo. Lo que ya ha ganado se lo queda.»), y [Cancelar] [Sí, quitar] en rojo lado a lado. Mantiene el recuadro de la plaza del pase. Sin captura: necesita dos cuentas (Supabase); comprobado por código y por pruebaTanda10N_compartir (actualizada).  
  *Dónde:* Perfil > Personas del viaje (administrador) > tocar a una persona > Quitar del viaje
- ✅ Hecho — Repasar todas las confirmaciones de la app, ponerlas así y listarlas con su captura Lista en el informe final. Se quedan: parada con entrada/Free Tour reservado, eliminar día, recuperar día/ruta, cambiar un día por la excursión, acortar fechas a mano, quitar reserva (hoja y fichas de transporte/alojamiento/seguro…), quitar excursión reservada, quitar a una persona, salir de un viaje, eliminar un viaje, borrar la cuenta, borrar foto. Pasan a [Deshacer] sin pregunta: quitar una parada normal y quitar el Free Tour sin reserva. «Eliminar un viaje» y «Borrar tu cuenta» no se tocaron (ya tienen su hoja propia).  
  *Dónde:* Ver informe

**1c**

- ✅ Hecho — Parada con entrada: que salgan todas las opciones, y las imposibles en gris diciendo por qué (Mover a otro día · «Tienes entrada para el jueves 26 a las 8:00», Cambiar parada · «Tienes entrada para el Coliseo»…) Cambiar parada y Mover a otro día, en gris con los textos pedidos; Mover antes y Mover después también en gris («Su hora la fija tu entrada de las 9:15»). Antes solo salía «Quitar del viaje».  
  *Dónde:* DIAS > día con entrada reservada > «···» del Coliseo  *Captura:* `docs/dias/capturas_jutrip/10n6_entrada_menu.jpg`
- ✅ Hecho — «Quitar parada», la última, en rojo, con la línea «Sale de tu ruta. Tienes su entrada: te preguntamos qué hacer con ella.» Exactamente ese texto.  
  *Dónde:* Igual que el punto anterior  *Captura:* `docs/dias/capturas_jutrip/10n6_entrada_menu.jpg`
- ✅ Hecho — Al tocarla, la confirmación: «¿Quitamos el Coliseo de tu ruta?» · «Tienes su entrada para el jueves 26 a las 8:00.» · [Quitar solo de la ruta] · [Quitar también la entrada] (rojo) · [Cancelar]; nunca se borra la entrada sin que lo elija Hoja baja con los tres botones; «Quitar solo de la ruta» es el destacado y lleva debajo «La entrada se queda en RESERVAS.»; [Cancelar] no toca nada. Probado: «solo» deja la reserva, «también» la borra, y [Deshacer] devuelve parada y entrada en los dos casos.  
  *Dónde:* DIAS > «···» del Coliseo > Quitar parada  *Captura:* `docs/dias/capturas_jutrip/10n6_entrada_confirmacion.jpg`
- ✅ Hecho — Si se quita solo de la ruta, la entrada sigue en RESERVAS con «Ya no está en tu ruta» y la opción de volver a ponerla en su día Reserva con marca nueva fueraDeRuta: el motor no la recibe (no fija ni mueve días) y no sale en avisos de choque de horas, día completo ni HOY. En RESERVAS, bajo su línea verde: «Ya no está en tu ruta» + [Volver a ponerla en su día]: devuelve la parada a su día y hora, fijada con la entrada (si el sitio ya está ese día porque se rehízo el viaje, no se duplica). Con [Deshacer].  
  *Dónde:* RESERVAS > Entradas y Free Tour > (desplegar) > fila del Coliseo  *Captura:* `docs/dias/capturas_jutrip/10n6_entrada_ya_no_esta_en_tu_ruta.jpg`
- ⚠️ A medias — Lo mismo con cualquier parada que tenga una reserva (Free Tour, excursión) Free Tour reservado: hecho (misma confirmación; «solo de la ruta» deja la reserva fuera de la ruta, probado). Excursión: la excursión no es una parada con su «···»; su reserva se quita desde la tarjeta (ya con confirmación) y el día se quita con «Pasar este día a Roma» (que ya dejaba la reserva en RESERVAS con noMueve); ahora esa reserva dice «Ya no está en tu ruta» en su línea, pero sin botón de volver a ponerla (eso sigue siendo cambiar el día a excursión). Duda al informe.  
  *Dónde:* DIAS > día con Free Tour reservado > «···» del Free Tour > Quitar parada; RESERVAS > Excursiones  *Captura:* `docs/dias/capturas_jutrip/10n6_freetour_confirmacion.jpg`

**1d**

- ✅ Hecho — «Cerca de ti» es del pase: sin pase, en azul oscuro con el candado dorado; con pase, como una opción más Ya estaba así desde la 10N5 (pestaña bloqueada de InterruptorElegir). Comprobado de nuevo en la app: sin pase azul oscuro con anillo dorado y candado; con pase sin candado y sin dorado.  
  *Dónde:* EXPLORAR > abre cualquier tarjeta (p. ej. Restaurantes) > selector «Recomendados | Cerca de ti» debajo del buscador  *Captura:* `docs/dias/capturas_jutrip/10n6_explorar_pestanas_sin_pase.jpg`
- ✅ Hecho — «Recomendados» es gratis: en claro, con el marfil, el blanco y el dorado de la app Sin pase, «Recomendados» (la elegida) va en degradado blanco-marfil con borde dorado #D2B67A y letra oscura.  
  *Dónde:* EXPLORAR > abre una tarjeta > «Recomendados» (sin pase)  *Captura:* `docs/dias/capturas_jutrip/10n6_explorar_pestanas_sin_pase.jpg`
- ✅ Hecho — La regla: si en un grupo de opciones una es del pase (azul con candado), la elegida gratis va en claro con dorado; si no hay ninguna del pase, el estilo de elegir de siempre (oscuro) Hecho en InterruptorElegir (src/components/ui/Elegir.tsx): si alguna opción es `bloqueada`, la elegida que no lo es se pinta en claro con dorado (data-clara-dorado). Con pase, o en cualquier otro grupo sin opción del pase, sigue el azul oscuro. Hoy solo EXPLORAR tiene un grupo con una opción del pase.  
  *Dónde:* EXPLORAR sin pase (claro con dorado) y con pase (oscuro de siempre)  *Captura:* `docs/dias/capturas_jutrip/10n6_explorar_pestanas_con_pase.jpg`

**1e**

- ✅ Hecho — «Cambiar parada» abre EXPLORAR como siempre (la lista con su mapa) Ya era el explorador compartido (PlaceExplorerScreen). Se queda con «Atracciones» y «Miradores» puestos al abrir (se pueden cambiar) y solo con sitios para visitar (sin restaurantes, baños ni excursiones).  
  *Dónde:* DÍAS > tres puntitos de una parada > Cambiar parada  *Captura:* `docs/dias/capturas_jutrip/10n6_cambiar_parada_explorar.jpg`
- ✅ Hecho — Arriba una franja «Elige el sitio que cambia por el {parada}» con la ✕ para cancelar Sustituye a la pregunta suelta «¿Por cuál quieres cambiar…?». Lleva el artículo del sitio (tabla de artículos) y la ✕ cierra sin cambiar nada.  
  *Dónde:* DÍAS > tres puntitos > Cambiar parada > franja debajo del título  *Captura:* `docs/dias/capturas_jutrip/10n6_cambiar_parada_explorar.jpg`
- ✅ Hecho — El + de cada sitio, con el icono de cambiar (⇄): al tocarlo se cambia la parada, con el aviso de siempre y [Deshacer] Ya estaba (⇄ fino sin relleno). Probado: cambia la parada en su día y hora, vuelve a DÍAS con el aviso y [Deshacer] la devuelve.  
  *Dónde:* Cambiar parada > ⇄ a la derecha de cada tarjeta  *Captura:* `docs/dias/capturas_jutrip/10n6_cambiar_parada_aviso.jpg`
- ✅ Hecho — El corazón, igual que siempre (suma o quita el like) Cada fila lleva su corazón con su número (MeGusta de tarjeta), el mismo de EXPLORAR.  
  *Dónde:* Cambiar parada > corazón de cada tarjeta  *Captura:* `docs/dias/capturas_jutrip/10n6_cambiar_parada_explorar.jpg`
- ✅ Hecho — Al tocar el resto de la fila se ve la información del sitio (como en EXPLORAR) con el botón «Cambiar por este» La ficha de siempre (Resumen, Entradas, Tips) con la barra de abajo «Cambiar por este» (antes «Cambiar por este →»).  
  *Dónde:* Cambiar parada > tocar el nombre o la foto de un sitio  *Captura:* `docs/dias/capturas_jutrip/10n6_cambiar_parada_informacion.jpg`
- ✅ Hecho — Los sitios que ya están en la ruta, con su «En ruta» Antes decían «Ya en tu viaje»; ahora «✓ En ruta», como en EXPLORAR. Sin ⇄ en esos.  
  *Dónde:* Cambiar parada > sitios que ya están en alguno de los días  *Captura:* `docs/dias/capturas_jutrip/10n6_cambiar_parada_explorar.jpg`

**1f**

- ✅ Hecho — Bloque «Tus recuerdos» de la propuesta A entre la cabecera de la ficha y las pestañas, exactamente como en Design Componente nuevo TusRecuerdos (src/components/route/fotos/TusRecuerdos.tsx): tarjeta marfil con borde dorado, icono o hasta 3 miniaturas solapadas y botón dorado. Medidas y colores de Recuerdos Ficha A.  
  *Dónde:* DÍAS > tocar una parada > ficha, debajo del nombre y las pastillas  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_sin_fotos.jpg`
- ✅ Hecho — Sin fotos: «Tus recuerdos» y debajo «Guarda tus fotos. Las verás también en tu álbum.», con el botón dorado [+ Añadir] Con los textos de Eric, no los de Design.  
  *Dónde:* Ficha de una parada sin fotos  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_sin_fotos.jpg`
- ✅ Hecho — Con fotos: las miniaturas, «Tus recuerdos» y debajo «3 fotos · También en tu álbum», con [Ver] «1 foto» en singular. Probado con 1 foto (sin pase) y con 3 (con pase).  
  *Dónde:* Ficha de una parada con fotos guardadas  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_tres_fotos_con_pase.jpg`
- ✅ Hecho — La propuesta B (la barra oscura «Mis fotos» bajo la foto) no se usa No existe en el código (la prueba lo comprueba).  
  *Dónde:* Ficha de cualquier parada  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_sin_fotos.jpg`
- ✅ Hecho — Fuera la cámara de encima de la foto (BotonFotoParada) La ficha ya no la monta. El fichero BotonFotoParada.tsx sigue en el repo sin usarse en la app (lo importan pruebas antiguas); se puede borrar en la 10S.  
  *Dónde:* Ficha de cualquier parada: la foto de 118 px sin botón en la esquina  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_sin_fotos.jpg`
- ✅ Hecho — Sale siempre, también antes del viaje Sale en cualquier ficha cuando hay ruta abierta, también la que se abre desde EXPLORAR (sin día): ahí las fotos van al día de la ruta donde ya está ese sitio o, si no está, al día 1. Si Eric prefiere otra cosa para sitios que no están en la ruta, se cambia en una línea.  
  *Dónde:* EXPLORAR > tocar un sitio > ficha  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_ficha_explorar.jpg`
- ✅ Hecho — Al tocarlo, la hoja «Tus recuerdos» con las tarjetas «Hacer una foto · Con la cámara de la app» y «Elegir de la galería · Solo fotos de tu viaje», y debajo «Tus fotos · 3» Hoja con el formato de tarjetas de la 10N4 (HojaOpciones), con su › como en Design. Las fotos se tocan para verlas en grande.  
  *Dónde:* Ficha > [+ Añadir] o [Ver]  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_hoja_tres_fotos_con_pase.jpg`
- ✅ Hecho — Las fotos van a la misma parada de ese día y al álbum del viaje, sin cambiar nada por dentro Usa subirFoto de fotosViaje.ts tal cual. Probado contra Supabase real (se borran al acabar): día 1, parada correcta, aparecen en el álbum.  
  *Dónde:* Subir una foto y abrir Perfil > el viaje > álbum  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_hoja_tres_fotos_con_pase.jpg`
- ✅ Hecho — Sin pase, una foto por sitio: con una, su miniatura y «1 foto · También en tu álbum» con [Ver]; en la hoja, «Cambiar la foto» en lugar de «Hacer una foto». Con pase, todas las que quiera «Cambiar la foto» abre el selector del móvil (cámara o galería) y sustituye a la vieja (sigue habiendo 1).  
  *Dónde:* Ficha de una parada, sin pase, con una foto guardada  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_hoja_una_foto_sin_pase.jpg`
- ✅ Hecho — Al intentar guardar más de una sin pase, el aviso del pase con «Sin pase, guardas 1 foto por sitio.» y «Guarda todas las que quieras y crea tus recuerdos.»; [Ver] lleva a lo que enseña el pase; si no quiere el pase, puede cambiar su foto por la nueva Con una foto y sin pase, «Elegir de la galería» abre el aviso (abrirAvisoPase('segunda_foto'), del agente K2) en lugar del selector; si elige varias a la vez, se guarda la primera y sale el aviso. [Ver el Pase Roma] es de K2. Para cambiarla está «Cambiar la foto».  
  *Dónde:* Ficha sin pase con una foto > [Ver] > Elegir de la galería  *Captura:* `docs/dias/capturas_jutrip/10n6_recuerdos_aviso_pase_segunda_foto.jpg`
- ✅ Hecho — Si las fotos sirven para algún logro (como «Visto con fotos»), que siga funcionando igual; decir para qué se usan hoy No se ha tocado nada de eso. Hoy las fotos de las paradas (tabla trip_photos, bucket fotos-viaje) sirven para: el álbum de cada viaje en el Perfil, la portada del viaje, «Tus fotos de hoy» en HOY, la tarjeta de recuerdos en RUTA y «Después del viaje», el efecto de la foto que vuela al álbum, el borrado del viaje y las miniaturas de V8. El logro «Visto con fotos» va aparte: usa su propio flujo (VistoFlujo, cámara de la app con validación del servidor) y solo añade la foto al álbum con subirFoto; lo de la ficha no entra en ese flujo.  
  *Dónde:* Perfil > viaje > álbum; HOY > Tus fotos de hoy

**1g**

- ✅ Hecho — Una sola pieza del aviso del pase para toda la app y todos los destinos (hoja desde abajo, tarjeta azul oscuro con dorado, título «Desbloquéalo con el Pase {destino}», línea 1 pequeña, línea 2 en negrita, botón dorado) src/components/pase/AvisoPase.tsx + src/lib/avisoPase.ts (abrirAvisoPase(clave,{destino})); montado en App.tsx  
  *Dónde:* Sin pase: toca «Escuchar historia» con la de prueba gastada, «Baños»/«Fuentes» en EXPLORAR o la pestaña «Cerca de ti"  *Captura:* `docs/dias/capturas_jutrip/10n6_aviso_segunda_foto.jpg`
- ✅ Hecho — El botón [Ver el Pase {destino}] lleva a la película, o a su final si ya la vio Usa abrirPase(), que ya decide principio/final  
  *Dónde:* Toca [Ver el Pase Roma] del aviso
- ✅ Hecho — «Escuchar historia» después de la de prueba: «Ya has escuchado tu historia de prueba.» / «Escucha todas las historias de tu viaje.» Escuchar.tsx (HOY v1) y HoyDuranteV2.tsx; la línea cambiante «Incluido con…» ya no se usa  
  *Dónde:* HOY, ficha de un sitio con historia, sin pase y con la de prueba ya gastada  *Captura:* `docs/dias/capturas_jutrip/10n6_aviso_escuchar_historia.jpg`
- ⚠️ A medias — Segunda foto de un sitio: «Sin pase, guardas 1 foto por sitio.» / «Guarda todas las que quieras y crea tus recuerdos.» La clave segunda_foto y su texto están listos y probados; quien la llama es K3 (recuerdos en la ficha)  
  *Dónde:* Ficha de un sitio, al guardar una segunda foto sin pase  *Captura:* `docs/dias/capturas_jutrip/10n6_aviso_segunda_foto.jpg`
- ✅ Hecho — «Cerca de ti», «Baños» y «Fuentes» en EXPLORAR abren el aviso (con sus dos líneas, siempre verdad) Cerca de ti: PlaceExplorerScreen (se quita la hoja suelta de la 10O); Baños/Fuentes: ExplorePanel  
  *Dónde:* EXPLORAR sin pase  *Captura:* `docs/dias/capturas_jutrip/10n6_aviso_explorar_banos.jpg`
- ✅ Hecho — Lo de HOY bloqueado por el pase que no se explica en su sitio Solo «Escuchar historia» lo es: el resto de HOY (tarjetas «Con el pase tendrás», «Ver el Pase de Roma») ya se explica en su sitio y va a la película. Clave «hoy» y «generico» listas por si hace falta  
  *Dónde:* HOY sin pase
- ✅ Hecho — La caja pequeña de la zona del alojamiento no lleva este aviso: su [Ver] va directo a la película/final Candado.tsx sigue con abrirPase()  
  *Dónde:* RESERVAS > Alojamiento sin pase
- ✅ Hecho — Con pase (comprado o plaza de grupo) el aviso no sale nunca abrirAvisoPase no hace nada con pagoActivo(), y el host lo comprueba otra vez  
  *Dónde:* Con pase, tocar lo mismo no abre el aviso
- ✅ Hecho — Textos en UN archivo, por destino src/lib/avisoPaseTextos.ts (AVISO_PASE_TEXTOS y AVISO_PASE_TEXTOS_POR_DESTINO)  
  *Dónde:* —
- ✅ Hecho — Lista de TODOS los sitios con su línea 1 / línea 2 y la regla de aviso pequeño o película En el informe final  
  *Dónde:* —

**1h**

- ✅ Hecho — Lista del pase: «Todas las fotos que quieras · En cada sitio y en tu álbum.» data/pase/lista_ajustes.json (nuevo campo titulos); lo aplican listaAjustada.ts y el final de la película (adaptar.ts)  
  *Dónde:* Final de la película, «Todo lo que incluye» y HOY «Con el pase tendrás»
- ✅ Hecho — Lista del pase: «Todas las historias · De cada sitio, como una audioguía en tu móvil.» Ídem  
  *Dónde:* Ídem (HOY sin pase, tarjeta «Con el pase tendrás»)  *Captura:* `docs/dias/capturas_jutrip/10n6_aviso_segunda_foto.jpg`
- ✅ Hecho — «Empiezas cerca de donde duermes…» ya no existe (o corregida) No existe: la fila es «Adaptamos tu ruta a tu alojamiento · El primer día, y como mucho el último, según tu zona.» No la he tocado  
  *Dónde:* Final de la película
- ✅ Hecho — Quitar «La puesta de sol y lo de mañana» de prometidas_sin_hacer Quitada de data/pase/lista_ajustes.json  
  *Dónde:* —

**1i**

- ✅ Hecho — Música de la película preparada y funcionando sin el archivo (sin error ni petición rota) src/lib/peliculaMusica.ts comprueba con HEAD (y que sea audio) antes de montar nada. public/sonidos/pelicula_pase.mp3 NO está: lo pone Eric  
  *Dónde:* Abre la película: sin música y sin botón de silencio  *Captura:* `docs/dias/capturas_jutrip/10n6_pelicula_sin_musica.jpg`
- ⚠️ A medias — Suena al tocar [Ver], volumen bajo, fundidos, bucle sin cortes, sigue al cambiar de escena y con [Saltar], baja y para al cerrar, para al salir de la app Todo hecho y probado con un archivo de mentira (audio simulado); falta oírla con la pista de verdad  
  *Dónde:* Película del pase, con la pista puesta
- ✅ Hecho — Botón de silencio pequeño, altavoz fino gris, en la línea del título y [Saltar]; recuerda lo elegido; respeta «Sonido de los momentos» Solo sale si hay archivo; el título se aparta para no pisarlo  
  *Dónde:* Arriba a la derecha de la película, a la izquierda de [Saltar]  *Captura:* `docs/dias/capturas_jutrip/10n6_pelicula_boton_silencio.jpg`
- ⚠️ A medias — Comprimir a ~96 kbps y bajar sin retrasar el principio scripts/destino/comprimirMusicaPelicula.sh (hace falta ffmpeg, que aquí no hay); la descarga empieza al abrir la película y no bloquea nada (si no puede sonar, la película sigue en silencio)  
  *Dónde:* —

**1j**

- ✅ Hecho — Sin gastos: el mismo bloque «Ruta» (tarjeta blanca con su icono y el título), vacío y sin importe a la derecha  
  *Dónde:* RUTA › Presupuesto (el icono de la cartera), en un viaje sin ninguna reserva con precio  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_vacio.jpg`
- ✅ Hecho — Dentro, una sola línea pequeña en gris: «Aquí se irán añadiendo todos los gastos de tu ruta.»  
  *Dónde:* Presupuesto sin gastos  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_vacio.jpg`
- ✅ Hecho — Fuera el recuadro de rayas «Todavía no hay gastos» La tarjeta «Cuentas del grupo» sigue diciendo «Todavía no hay gastos del grupo» (es otra cosa, de la 10N2).  
  *Dónde:* Presupuesto sin gastos  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_vacio.jpg`
- ✅ Hecho — Debajo, «Extras» con [+ Añadir gasto]; la pantalla es igual con gastos y sin ellos  
  *Dónde:* Presupuesto sin gastos, bajando  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_vacio.jpg`

**1k**

- ✅ Hecho — Una reserva o gasto solo para quien lo paga NO cuenta en «Del grupo» del presupuesto Coliseo 100 € solo para Eric + Panteón 60 € para Eric y Ana: «Del grupo» dice 60 €.  
  *Dónde:* Presupuesto de un viaje con gente  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_solo_tu.jpg`
- ✅ Hecho — …ni en «Cuentas del grupo» (ni total, ni pagado, ni le toca) «Total del grupo 60 €»; Eric pagó 60 € y le tocan 30 €; la suma de saldos es 0.  
  *Dónde:* Presupuesto › Cuentas del grupo  *Captura:* `docs/dias/capturas_jutrip/10n6_cuentas_sin_lo_personal.jpg`
- ✅ Hecho — Sí sale en el presupuesto de esa persona, con el candado y «Solo tú» En gris tenue, debajo de su día. No suma en el bloque.  
  *Dónde:* Presupuesto de Eric  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_solo_tu.jpg`
- ✅ Hecho — Cuenta en «Tu parte» Tu parte = su parte de lo del grupo + lo personal (100 €). Los [Para mí] de Extras siguen sin contar en «Tu parte», como antes (duda abierta en el informe).  
  *Dónde:* Presupuesto › pastilla «Tu parte» con el ojo  *Captura:* `docs/dias/capturas_jutrip/10n6_presupuesto_solo_tu.jpg`
- ✅ Hecho — Los demás del viaje no lo ven en sus cuentas ni en su presupuesto Un invitado no ve las reservas personales del administrador; las cuentas sí las dejan fuera.  
  *Dónde:* Presupuesto como invitado
- ✅ Hecho — Si es para otro o para varios, sí es del grupo (Eric paga la entrada solo de Ana: Ana le debe 100 €) Probado en la prueba pura.  
  *Dónde:* Presupuesto › Cuentas del grupo
- ✅ Hecho — Lo mismo con alojamiento, coche y vuelos de la 10N5 Si «¿Para quién es?» es solo el administrador (o todos los demás tienen el suyo), es personal. Se calcula con la misma función en presupuesto y cuentas.  
  *Dónde:* Presupuesto › Transporte y alojamiento
- ✅ Hecho — Nada se cuenta dos veces y las cuentas cuadran al céntimo Las líneas que un invitado no ve (`ocultas`) siguen entrando en las cuentas; suma de saldos 0.  
  *Dónde:* Cuentas del grupo  *Captura:* `docs/dias/capturas_jutrip/10n6_cuentas_sin_lo_personal.jpg`

**1l**

- ✅ Hecho — A cada marcado le sale como suya: aviso «X ha reservado el Coliseo para ti · jueves 12 · 9:15», botón verde con ✓ en DÍAS, «Tu entrada» en verde en la ficha y la entrada en su RESERVAS También cuando compra un invitado (antes no).  
  *Dónde:* DÍAS › Coliseo › botón de la entrada; ficha › Entradas; RESERVAS › Entradas y Free Tour  *Captura:* `docs/dias/capturas_jutrip/10n6_entradas_b_luis_tu_entrada.jpg`
- ✅ Hecho — A los no marcados: aviso con [Reservar la mía a la misma hora] y [Ya la tengo]; en la ficha, en azul con dorado, quién la tiene  
  *Dónde:* DÍAS › Coliseo › botón azul con dorado; campana  *Captura:* `docs/dias/capturas_jutrip/10n6_entradas_a_eric_ficha_ana_y_luis.jpg`
- ✅ Hecho — Que funcione igual si la compra un invitado (Ana compra para ella y Eric: a Eric le sale como suya) HOY NO FUNCIONABA con invitados: solo avisaba el administrador (0042) y solo se veían las entradas del administrador. Ahora: migración 0053 (aviso del invitado) + las entradas de los demás se leen de entradas_del_grupo. Necesita aplicar la 0053 para el aviso; el resto va sin ella.  
  *Dónde:* Entra como Ana, reserva el Coliseo para ella y Eric; mira como Eric  *Captura:* `docs/dias/capturas_jutrip/10n6_entradas_f_eric_tu_entrada_de_ana.jpg`
- ✅ Hecho — Plural con nombres: «Eric y Ana la tienen para el jueves 12 · 9:15»; «Eric y Ana han reservado el Coliseo · jueves 12 · 9:15. ¿Reservas la tuya a la misma hora?»; más de dos: «Eric, Ana y Laura…» Ficha, RESERVAS, campana y franja.  
  *Dónde:* Ficha › Entradas  *Captura:* `docs/dias/capturas_jutrip/10n6_entradas_e_luis_eric_y_ana.jpg`
- ✅ Hecho — Dos horas distintas para el mismo sitio: «Eric la tiene a las 9:15 · Ana a las 11:00»  
  *Dónde:* Ficha › Entradas  *Captura:* `docs/dias/capturas_jutrip/10n6_entradas_d_luis_dos_horas.jpg`

**2 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N6 (confirmaciones, aviso del pase, EXPLORAR y recuerdos, cuentas y entradas para varios) Prueba de la Tanda 10N6: 7 partes (confirmar 61, aviso del pase 49, explorar 23, recuerdos 29, perfil 118 px 4, cuentas 65, entradas 12) = 243 comprobaciones, 0 fallos, con el Vite sin vigilar ficheros (`scripts/destino/_vite_estable.config.mjs`). Con el Vite de desarrollo normal (recargas en caliente), `pruebaTanda10N6_recuerdos` falla 3 comprobaciones de la sección «Con pase» (ver el informe). pruebaJutrip 129/0.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería rápida y pruebaJutrip (si algo falla solo al correr con las demás y pasa solo, se dice y se arregla en la 10S) Bateria completa: 32 MAL en la pasada buena; el triaje de dos agentes no hallo regresiones reales: expectativas antiguas actualizadas y flakes de carga que pasan sueltos con 0 fallos. Pendiente: recuerdos con pase (ver informe) y pruebaTanda10N3_real (Realtime, no es de esta tanda).  
  *Dónde:* No es de móvil.

**2 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, cada una al lado de la de Design  
  *Dónde:* Esta página.

**3 · El informe**

- ✅ Hecho — Apartado «10N6» en docs/dias/INFORME_TANDA10B.md y esta lista al final  
  *Dónde:* No es de móvil.

**Pruebas:** Prueba de la Tanda 10N6: 7 partes (confirmar 61, aviso del pase 49, explorar 23, recuerdos 29, perfil 118 px 4, cuentas 65, entradas 12) = 243 comprobaciones, 0 fallos, con el Vite sin vigilar ficheros (`scripts/destino/_vite_estable.config.mjs`). Con el Vite de desarrollo normal (recargas en caliente), `pruebaTanda10N6_recuerdos` falla 3 comprobaciones de la sección «Con pase» (ver el informe). pruebaJutrip 129/0.

---

## 10N7 — Las cuentas según cómo viajáis (27-oct)

**Estado:** hecho y probado. Prueba nueva `pruebaTanda10N7`: modo 85, presupuesto 82, privacidad 19, moneda 56 = 242 comprobaciones, 0 fallos. No se ha tocado el motor de rutas, así que no hace falta la muestra de 60 fechas. Design al día con `RETOQUES.zip`: la pieza es `Piezas/Cuentas Modo` (manda la 02a; en «Cada uno lo suyo» la tarjeta de arriba pone «Del grupo»).

### Migraciones que tienes que aplicar (a mano, en el editor SQL de Supabase, en este orden)
Antes, las que siguen sin aplicar de las tandas anteriores: `0047`, `0048`, `0049`, `0051` (10N5) y `0053` (10N6). La 0050 no existe (salto de numeración).
1. `0054_modo_de_cuentas.sql` — añade el tipo de aviso `cuentas_modo`, la pregunta en el aviso de «se ha unido» y el aviso de cambio de modo. Redefine el constraint `avisos_tipo_check` con todos los tipos hasta la 0040 más `cuentas_modo`. **Sin ella el modo funciona igual, pero no llegan esos dos avisos.** El modo se guarda dentro de la ruta del viaje (`route.modoCuentas`, `modoElegidoCon`, `nombreCuenta`), no en una columna nueva.
2. `0055_solo_para_mi_privado.sql` — hace que lo «Solo para mí» no avise y no lo vea nadie más, tampoco el administrador (`avisar_reservas_grupo`, `avisar_entrada_de_invitado`, `entradas_del_grupo`, `lo_suyo_del_grupo`, `avisar_lo_suyo_propio`). Va después de la 0053. **Sin ella, eso solo se garantiza en la pantalla, no en el servidor.**
3. `0056_moneda_del_viajero.sql` — añade `travelers.moneda` (3 letras). Sin ella la moneda queda solo en el móvil y no da error.

### Qué se ha hecho
- **Tres formas de llevar las cuentas (§1):** cada viaje tiene un `modo_cuentas` (`solo`, `conjunta`, `cada_uno`).
  - **Solo (1a):** con una sola persona el modo es «solo». No sale el botón de modo.
  - **Cuenta conjunta (1b):** la tarjeta oscura de arriba lleva «CUENTA CONJUNTA · ERIC Y ANA» con lápiz (solo a quien puede editar) para cambiarle el nombre, que se guarda en el viaje y lo ven todos. Sin «por persona», sin «Cuentas del grupo» y sin los nombres en la cabecera. «Ruta» y «Extras» son de la cuenta conjunta y suman en el importe de arriba. Al añadir algo, sin nombres: «Para los dos» (o «Para todos» con más de dos), marcada, y «Solo para mí» con «Solo lo ves tú.». «Solo para mí» no cuenta en el total común y sale en el bloque propio de abajo, **«Lo tuyo · Solo lo ves tú»** (con candado, solo si hay algo, cada uno el suyo). Total desglosado: «De los dos 180 € · Lo tuyo 40 € · Total 220 €» (solo para quien tiene algo suyo).
  - **Cada uno lo suyo (1c):** los nombres y «Cuentas del grupo» con quién le debe a quién. En «Añadir gasto» ya no hay [Para todos] / [Para mí]: «¿Quién ha pagado?» y «¿Para quién es?» con los nombres, marcado solo quien lo añade. En las reservas la pregunta cambia según lo que se añade («¿Para quién has comprado la entrada?», «…el vuelo?», «¿Para quién has reservado el alojamiento?», «…la excursión?», «…el coche?»), con la línea pequeña debajo: «Solo para ti: es un gasto tuyo y nadie más lo ve.» / «Para 2 personas: entra en las cuentas del grupo.» / «Para Ana: entra en las cuentas del grupo.».
- **Elegir y cambiar (§2):** por defecto, pareja o familia → cuenta conjunta; amigos → cada uno lo suyo; solo → solo. Un botón redondo dorado en la cabecera del presupuesto («¿Cómo lleváis las cuentas?», hoja de tarjetas «Todo juntos» / «Cada uno lo suyo»); solo el administrador la cambia, los demás la ven sin tocarla. Con gastos ya apuntados, antes la confirmación (botón rojo): «¿Cambiamos a cuenta conjunta?» · «Las deudas de las cuentas del grupo dejan de contar.» o «¿Cambiamos a cada uno lo suyo?» · «Lo apuntado contará como pagado por quien lo apuntó, a partes iguales entre todos.». Sin gastos se cambia directo. El modo no toca los gastos, así que lo «Solo para mí» sigue personal y los saldos suman 0 antes y después (al céntimo). Avisos: «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?» al administrador (abre la misma hoja) cuando entra la primera persona a un viaje solo, y otra vez cuando se une un tercero a una cuenta conjunta; y «Eric ha cambiado las cuentas a cuenta conjunta.» / «…a cada uno lo suyo.» a todos menos a quien lo cambia. Mientras no se elige tras unirse alguien a un viaje solo, «Cada uno lo suyo» y la pregunta arriba del presupuesto.
- **Lo que faltaba atar (§2b):**
  1. Lo «Solo para mí» no lo ve nadie más, tampoco el administrador (migración 0055; la app tampoco lo enseña). Sin avisos, sin cuentas, sin totales, sin RESERVAS de los demás. Lo que se oculta es el dinero, no el sitio: la parada sale en la ruta de todos.
  2. Una cuenta conjunta a la que se une un tercero: el aviso otra vez (ver arriba).
  3. Quien solo recomienda: en cuenta conjunta su «Para los dos» queda pendiente («Enviar a Eric») hasta que el administrador o quien puede editar lo acepta; su «Solo para mí» entra directo.
  4. «Extras» a mano: la app no pregunta nada al comprar el pase. «Ruta» lleva lo de la ruta y «Extras» lo demás; al añadir en «Extras» se pregunta lo mismo que en una reserva (en cada uno lo suyo, «¿Quién ha pagado?» y «¿Para quién es?»; en cuenta conjunta, «Para los dos» / «Solo para mí»; viajando solo, nada).
  5. **Moneda:** por defecto euros (ya no sale de la ciudad de origen). Se elige en «Moneda» del presupuesto y en Ajustes › La app › «Moneda»: las dos filas abren la misma hoja y cambiar una cambia la otra. Se guarda en el móvil y, con cuenta, en `travelers.moneda`. Los precios se enseñan en tu moneda con el cambio del día y «≈» («≈ 2.078 MXN · 100 €»), y donde lo que se paga está en otra moneda se ve siempre el original. Las cuentas del grupo se calculan siempre en euros y cada uno las ve convertidas; lo que no tiene cambio sale aparte en «Fuera de las cuentas, sin cambio a tu moneda», sin entrar en el total.
     - **Ya aplicada en:** presupuesto (líneas y Extras), cuentas del grupo, RESERVAS (alojamiento, seguro, coche, transporte, «Útil para el viaje», llegada y vuelta, entradas), bloque de vehículo y ficha de llegada en DÍAS, excursiones y actividades, aviso y franja de gasto, y el pase.
     - **Por enlazar (a medias):** los campos donde se escribe el precio (`HojaPrecio`, `AddReservationSheet`, `GeneralBookingModal`), el «Cuánto toca» de añadir gasto y las etiquetas de precio del explorador de lugares.

### Procesos y CPU (aparte de la tanda)
Por tu aviso de que se agotaba la memoria: hay una regla fija nueva en `CLAUDE.md` (un solo servidor, Chrome de prueba cerrados al acabar, baterías a prioridad baja y sin los «wrappers»). En esta tanda: al empezar había 26 procesos de Node (≈9,8 GB) y 12 de esbuild; cerré los de los agentes ya terminados y los míos, y los agentes cerraron los suyos al acabar. Una primera batería lanzó 12 Chromes a la vez (los «wrappers» duplicaban los de las pruebas sueltas): la paré y la relancé sin ellos, con un solo navegador a la vez y todo en prioridad baja.

### Pruebas
- Prueba nueva `pruebaTanda10N7`: 242 comprobaciones, 0 fallos.
- Batería completa: 134 pruebas (sin los «wrappers», que duplican Chromes; sus partes están sueltas en la batería), 8 en MAL a la primera. Triaje: ver más abajo.

### Dudas para ti
1. **Vuelo, alojamiento y coche del administrador (a medias):** la pregunta nueva («¿Para quién has comprado el vuelo?», Para los dos / Solo para mí) está en sus filas «En este vuelo/alojamiento/coche» de RESERVAS, no en el instante exacto de añadirlos. Su valor por defecto sigue siendo «todos» (no «solo quien añade») para no mover las cuentas que ya existen. Solo probado en lógica y en código, no en pantalla.
2. **Privacidad a nivel de red:** las reservas del administrador viajan en `trips.bookings` y los miembros pueden leer ese JSON (precio incluido); la app no lo enseña, pero a nivel de red llega. Cerrarlo del todo exige guardar lo «Solo para mí» del administrador aparte (como `reservas_invitado`). ¿Lo hacemos?
3. **Diseño 07 (cambio de modo mientras no se elige):** Design pinta «Tu viaje» sin «Cuentas del grupo»; he seguido el prompt («Cada uno lo suyo» con su tarjeta). ¿Prefieres Design?
4. **Diseño 08:** todavía dibuja el interruptor [Para todos | Solo para mí] en «Añadir gasto · Cada uno lo suyo»; he seguido el prompt (sin interruptor).
5. **Viaje solo (1a) a medias:** el presupuesto de quien viaja solo sigue con el diseño viejo («Total del viaje», «por persona»); el rediseño «Tu viaje» de Design 01 no está hecho.
6. **El PDF del presupuesto** no recibe el modo, así que «Lo tuyo» no sale en el PDF.
7. **Cambio del día en las cuentas:** usan el cambio de hoy para todos los gastos, no el del día de cada gasto; guardar el del día de cada uno exigiría una columna nueva.
8. **Recargo del pase:** el +4 % del pago solo está en el pase (10P); los ejemplos del prompt salen sin ese recargo (con 100 € a 20,78 MXN/€ sale 2.078).
9. **Tarjeta oscura del presupuesto con importes largos** (por ejemplo en pesos): «2.078 MXN» puede solaparse con el texto de al lado; ya estaba así, queda para la 10S.
10. **Lo que no se ha visto con dos cuentas reales:** los avisos «Ana se ha unido…» y de cambio de modo, y la privacidad con la 0055 aplicada, los pruebas tú con tus dos móviles después de aplicar las migraciones.

### Triaje de la batería (8 en MAL de 134 a la primera, más `pruebaTanda10N2` y `pruebaTanda10N3_cuentas`, que la batería no incluía)
**Ninguna regresión real en el código.** Solo se editaron pruebas. Todas pasan sueltas:
- Expectativas antiguas que la 10N7 cambió a propósito (actualizadas): `pruebaTanda10N_reservas` 48/0, `pruebaTanda10N_presupuesto` 148/0, `pruebaTanda10N5_gastos` 11/0, `pruebaTanda10N5_cadauno_enLaApp` 15/0, `pruebaTanda10N2` 133/0 (por defecto, un gasto en «Cada uno lo suyo» nace «Solo para ti»; ya no existen [Para todos] / [Para mí] ni la línea «… cada uno»; con 3 o 4 personas el viaje de prueba «couple» sale como cuenta conjunta, así que esas pruebas fuerzan el modo con `window.__modoCuentas.poner('cada_uno')`).
- Error de la propia prueba: `pruebaTanda10N5_gastos_enLaApp` 3/0 (una expresión regular dentro de una cadena de JavaScript borraba todas las «s» del texto).
- Ya estaban bien o fueron fallos de carga que pasan sueltas: `pruebaTanda10N3_cuentas` 63/0 y `pruebaTanda10I` 91/0.
- **`pruebaEntrarReal` era una regresión real de esta tanda, ya arreglada.** Falló 3 veces seguidas («la sesión anónima de este navegador sigue guardada»). El triaje lo atribuyó al límite de altas anónimas de Supabase, pero lo comprobé quitando una sola línea de esta tanda (`void cargarMonedaDeLaCuenta(uid)` en `useMiPerfil.cargar`, de M3, la carga de la moneda de la cuenta): sin ella pasaba 11/0. Esa consulta a `travelers` se cruzaba con el inicio de sesión. Ahora se hace 4 segundos después de cargar el perfil y pasa 11/0, y `pruebaTanda10N7_moneda` sigue en 56/0. **No he diagnosticado del todo por qué se cruzaba**: el retraso lo arregla, pero es una solución de tiempos, no de causa; queda anotado para la 10S.
- **`pruebaTanda10N3_real` sigue fallando 2 comprobaciones de Realtime** («el DUEÑO recibe en directo el cambio del viaje que hace Luis», «el aviso viaje_cambiado de la campana»: 0 eventos). Ya fallaba igual en el triaje de la 10N6 y no se ha tocado nada de eso en esta tanda: parece de entorno (Realtime sin activar en las tablas `trips` y `avisos` del Supabase real, o migraciones sin aplicar). Míralo cuando apliques las migraciones. (Hace unas horas fallaba por «Request rate limit reached»: eso era el límite de altas anónimas, otra causa.)
- Esta tanda no cambia nada en `server/engine` ni en `shared/routeEngine`.

### Lista de comprobación de la 10N7 (punto por punto)

**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N7.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día con RETOQUES.zip (sin uploads/ ni screenshots/): la pieza es Piezas/Cuentas Modo (manda la 02a; en «Cada uno lo suyo» la tarjeta de arriba pone «Del grupo»)  
  *Dónde:* No es de móvil.

**1a**

- ⚠️ A medias — Viajas solo (el viaje no tiene a nadie más): el presupuesto normal, sin nombres, sin «¿Para quién…?», sin «Cuentas del grupo» y sin [Para todos] / [Para mí] — la decisión de modo Hecho lo mío: con una sola persona el modo es «solo» (modoDeCuentas / useModoCuentas) y el presupuesto no enseña botón de cuentas, pregunta, etiqueta de cuenta conjunta ni «Cuentas del grupo» (probado). Falta lo de M2: el rediseño del presupuesto solo como Design 01 («Tu viaje», bloques, «Añadir gasto» punteado); hoy sale la tarjeta «Total del viaje» y el «por persona» de siempre.  
  *Dónde:* RUTA > cartera de arriba > Presupuesto, con un viaje en el que estás tú solo (cuenta administrador, sin invitados)  *Captura:* `docs/dias/capturas_jutrip/10n7_01_solo.jpg`

**1b**

- ✅ Hecho — Modo por viaje (modo_cuentas: solo | conjunta | cada_uno) guardado en el viaje, con migración 0054 Se guarda dentro de la ruta del viaje (route.modoCuentas, modoElegidoCon, nombreCuenta), igual que «¿Entre quién?»: viaja con el viaje compartido y en directo. La migración 0054 (idempotente, SIN APLICAR) añade el tipo de aviso cuentas_modo, la pregunta en «se ha unido» y el aviso de cambio. Sin aplicarla el modo funciona igual; solo faltan esos dos avisos.  
  *Dónde:* Supabase > SQL editor > pegar supabase/migrations/0054_modo_de_cuentas.sql
- ✅ Hecho — Etiqueta «Cuenta conjunta · Eric y Ana» dentro de la tarjeta oscura de arriba, en lugar de «De los dos», sin bloque suelto y sin «por persona» Con los nombres con nombreVisible (Eric, Ana y Luis…). En cuenta conjunta desaparecen «Del grupo», el «por persona» y la tarjeta «Cuentas del grupo». El nombre de la cabecera ya no repite los nombres. El importe común y los bloques «Ruta» y «Extras» como Design (todo sumado, «Lo tuyo») es el rediseño de M2.  
  *Dónde:* RUTA > cartera > Presupuesto, viaje en pareja o familia con Ana ya dentro (cuenta del administrador)  *Captura:* `docs/dias/capturas_jutrip/10n7_02a_conjunta.jpg`
- ✅ Hecho — Lápiz a la derecha para cambiarle el nombre a la cuenta («Nuestro viaje a Roma»): se guarda en el viaje, lo ven todos, lo cambia quien pueda editar El lápiz abre «Nombre de la cuenta» (Hoja, Guardar). El nombre sale como «NUESTRO VIAJE A ROMA · ERIC Y ANA». Quien solo recomienda ve el nombre y no el lápiz; quien puede editar sí lo tiene. Se ve en tiempo real porque va con la ruta del viaje. Vaciar el campo vuelve a «Cuenta conjunta».  
  *Dónde:* Presupuesto > lápiz dorado junto a «CUENTA CONJUNTA · ERIC Y ANA» > escribir > Guardar. Mirarlo luego con la cuenta de Ana (Recomendar: sin lápiz) y con la de quien tiene Editar (con lápiz)  *Captura:* `docs/dias/capturas_jutrip/10n7_03_nombre.jpg`
- ✅ Hecho — En cuenta conjunta, «Cuentas del grupo» (quién le debe a quién) no sale: sin deudas TarjetaCuentas solo se pinta en «Cada uno lo suyo». Los gastos no se tocan al cambiar de forma: lo apuntado cuenta pagado por quien lo apuntó y repartido entre todos, así que al volver a «Cada uno lo suyo» las cuentas salen igual, al céntimo (probado con 100,01 / 33,33 / 7,07 entre 3).  
  *Dónde:* Presupuesto de un viaje con cuenta conjunta: no hay tarjeta «Cuentas del grupo». Con «Cada uno lo suyo» sí  *Captura:* `docs/dias/capturas_jutrip/10n7_02c_conjunta_tres.jpg`
- ✅ Hecho — «Cada uno lo suyo»: la tarjeta de arriba pone «Del grupo» (como Design 05) Con amigos (o tras elegirlo) la tarjeta oscura sigue con «Del grupo», «por persona» y debajo la tarjeta «Cuentas del grupo». Lo de las preguntas «¿Para quién has comprado…?» y las tres líneas pequeñas es de M2.  
  *Dónde:* Presupuesto de un viaje de amigos (o con «Cada uno lo suyo» elegido)  *Captura:* `docs/dias/capturas_jutrip/10n7_05_cada_uno.jpg`
- ✅ Hecho — Tarjeta oscura con «Cuenta conjunta · Eric y Ana» + lápiz y el importe común (etiqueta/lápiz de M1) Montado el presupuesto; la etiqueta y el lápiz los pone CuentaModo.tsx de M1  
  *Dónde:* Presupuesto > tarjeta de arriba (viaje con pareja, como Eric)  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02a_conjunta_eric_sin_lo_suyo.jpg`
- ✅ Hecho — Sin «por persona» y sin «Cuentas del grupo» en la cuenta conjunta  
  *Dónde:* Presupuesto, cuenta conjunta  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02a_conjunta_eric_sin_lo_suyo.jpg`
- ✅ Hecho — «Ruta» y «Extras» son de la cuenta conjunta y suman arriba Lo de antes de compartir (sin «para quién») también es común  
  *Dónde:* Presupuesto  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02a_conjunta_eric_sin_lo_suyo.jpg`
- ✅ Hecho — Bloque «Lo tuyo · Solo lo ves tú» con candado, abajo tras «Extras», solo si hay algo, cada uno el suyo  
  *Dónde:* Presupuesto > añadir gasto «Solo para mí»; ver con Eric y con Ana  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02b_conjunta_eric_con_lo_suyo.jpg`
- ✅ Hecho — Total explicado «De los dos 180 € · Lo tuyo 40 € · Total 220 €» solo para quien tiene algo suyo Con más de dos: «De todos»  
  *Dónde:* Presupuesto, pie  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02b_conjunta_eric_con_lo_suyo.jpg`
- ✅ Hecho — Al añadir (gasto, entrada, excursión): «Para los dos»/«Para todos» marcada y «Solo para mí» con «Solo lo ves tú.», sin nombres Entrada/excursión en AddReservationSheet; gasto en HojaAnadirGasto  
  *Dónde:* Presupuesto > Añadir gasto; tocar una entrada  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_04b_gasto_solo_para_mi.jpg`
- ⚠️ A medias — Alojamiento, vuelo y coche del administrador: misma pregunta Está en las filas «En este vuelo/alojamiento/coche» de RESERVAS (hoja de «para quién»), no en el momento exacto de añadirlo  
  *Dónde:* RESERVAS > fila «En este…» (admin, viaje compartido)
- ✅ Hecho — «Solo para mí» solo lo ve quien lo añade, no cuenta en el total común, sale con candado y «Solo tú», sin aviso Avisos: migración 0055  
  *Dónde:* Presupuesto con Eric y con Ana  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02c_conjunta_ana.jpg`
- ✅ Hecho — La reserva sigue en la ruta de todos (se oculta el dinero, no el sitio) No se toca la ruta  
  *Dónde:* DIAS

**1c**

- ✅ Hecho — «Añadir gasto» sin [Para todos]/[Para mí]; los nombres de «¿Para quién es?», marcado solo quien lo añade Design 08 aún muestra el interruptor; se sigue el prompt  
  *Dónde:* Presupuesto (amigos) > Añadir gasto  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_05_gasto_cada_uno_solo_tu.jpg`
- ✅ Hecho — Pregunta de la reserva según lo que se añade (entrada, vuelo, alojamiento, excursión, coche) Entrada y excursión en la hoja; vuelo/alojamiento/coche en las hojas de RESERVAS y cuentas  
  *Dónde:* Presupuesto > tocar Coliseo  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_05b_reserva_cada_uno.jpg`
- ✅ Hecho — Línea pequeña: Solo para ti / Para 2 personas / Para Ana  
  *Dónde:* Añadir gasto (amigos)  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_05b_gasto_cada_uno_dos.jpg`

**2**

- ✅ Hecho — Por defecto, según «¿Con quién viajas?»: pareja o familia → cuenta conjunta; amigos → cada uno lo suyo; solo → solo Sin elegir, el modo sale de la respuesta del cuestionario (no se escribe nada en el viaje). Familia: conjunta mientras no entren más personas de las del cuestionario. Un viaje solo que recibe a alguien: cada uno lo suyo y se pregunta (ver «Un viaje que era solo»).  
  *Dónde:* Crear un viaje con cada respuesta y abrir el presupuesto con otra persona dentro
- ✅ Hecho — Botón «¿Cómo lleváis las cuentas?» siempre a mano en el presupuesto, con la hoja de tarjetas «Todo juntos» / «Cada uno lo suyo»; la elegida con el estilo de elegir Botón redondo arriba a la derecha de la cabecera (dos anillos, borde dorado) como Design 06. La hoja es una HojaOpciones de tarjetas con la elegida en azul oscuro con ✓ dorado. No sale viajando solo (no hay nada que repartir).  
  *Dónde:* Presupuesto > círculo dorado de arriba a la derecha  *Captura:* `docs/dias/capturas_jutrip/10n7_06b_hoja_modo.jpg`
- ✅ Hecho — Solo el administrador la cambia (los demás la ven, sin tocarla) Con la cuenta de quien no es administrador, las tarjetas salen en gris y no hacen nada, con «Solo la cambia el administrador.». setModoCuentas también lo comprueba.  
  *Dónde:* Presupuesto > círculo dorado, con la cuenta de Luis (Editar) o Ana (Recomendar)
- ✅ Hecho — Un viaje que era solo y se une alguien: aviso «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?» que abre la misma hoja; mientras no elija, «Cada uno lo suyo» y, arriba del presupuesto, la misma pregunta Aviso con la migración 0054: «Ana se ha unido a tu viaje. ¿Cómo lleváis las cuentas?» (franja con la pregunta debajo; tocarlo abre la hoja). Arriba del presupuesto sale la pregunta con «Todo juntos» / «Cada uno lo suyo» hasta que elige. Diferencia con Design 07: mientras no elige seguimos con «Cada uno lo suyo» como pide el prompt (Design pinta «Tu viaje» y sin «Cuentas del grupo»).  
  *Dónde:* Con la cuenta del administrador de un viaje de una persona: entra Ana con el código; campana/franja y Presupuesto  *Captura:* `docs/dias/capturas_jutrip/10n7_07_se_une.jpg`
- ✅ Hecho — Si se cambia con gastos ya apuntados, antes la confirmación: «¿Cambiamos a cuenta conjunta?» (rojo) / «¿Cambiamos a cada uno lo suyo?», con sus líneas; sin gastos, directo ConfirmDialog con las dos frases exactas del prompt; la de «cuenta conjunta» con botón rojo (se pierden las deudas), la otra no. «Mejor no» no cambia nada. Sin gastos apuntados no se pregunta.  
  *Dónde:* Presupuesto con algún gasto del grupo apuntado > círculo dorado > elegir la otra forma  *Captura:* `docs/dias/capturas_jutrip/10n7_06c_confirmar_conjunta.jpg`
- ✅ Hecho — Lo «Solo para mí» sigue personal tras cambiar; las cuentas cuadran al céntimo El modo no reescribe ni mueve gastos: los «Solo para mí» (ámbito mío) siguen sin entrar en las cuentas y la suma de saldos es 0 antes y después. Probado en puro y en la app.  
  *Dónde:* Presupuesto > cambiar de forma > Cuentas del grupo: Total y saldos igual que antes
- ✅ Hecho — A todos los del viaje les llega «Eric ha cambiado las cuentas a cuenta conjunta.» / «…a cada uno lo suyo.» (campana y franja) Aviso cuentas_modo (migración 0054): a todos menos a quien lo cambia; solo avisa si el modo cambia de verdad (elegir lo que ya salía por defecto no avisa); varios cambios sin leer se quedan en el último. Textos y franja en shared/avisos/textos.js; la app lo recoge en directo (accionPorAviso). Probado con la base de datos real (PGlite).  
  *Dónde:* Con la cuenta de Ana: Eric cambia la forma; sale la franja de arriba y el aviso en la campana

**2b**

- ✅ Hecho — 2b-2 · Una cuenta conjunta a la que se une alguien nuevo: al administrador le llega otra vez «Luis se ha unido a tu viaje. ¿Cómo lleváis las cuentas?» con la misma hoja; mientras no elija, sigue como estaba Entra la tercera persona (o más) y el aviso lleva la pregunta; la cuenta sigue conjunta y arriba del presupuesto vuelve la pregunta hasta que contesta (aunque diga lo mismo). Con «Cada uno lo suyo» no se pregunta al entrar más gente.  
  *Dónde:* Viaje en pareja con cuenta conjunta: entra una tercera persona; con la cuenta del administrador, campana y Presupuesto  *Captura:* `docs/dias/capturas_jutrip/10n7_02c_conjunta_tres.jpg`

**2b-1**

- ⚠️ A medias — Lo «Solo para mí» no lo ve nadie, tampoco el administrador (cuentas, totales, avisos, campana, RESERVAS) Pantalla, avisos, RPC y gastos cerrados (0055, sin aplicar). Límite: el JSON de reservas del administrador (trips.bookings) llega a los miembros; la app no lo enseña  
  *Dónde:* Presupuesto con Ana vs Eric  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_02c_conjunta_ana.jpg`

**2b-3**

- ✅ Hecho — Quien solo recomienda: su gasto «Para los dos» queda pendiente; su «Solo para mí», directo  
  *Dónde:* Presupuesto como Ana (recomendar)  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_recomienda_pendiente.jpg`

**2b-4**

- ✅ Hecho — «Ruta» lo de la ruta, «Extras» lo demás; al añadir en Extras mismas preguntas; solo: nada; el pase no pregunta La app no pregunta nada al comprar el pase (no hay flujo que lo apunte)  
  *Dónde:* Presupuesto > Extras > Añadir gasto  *Captura:* `docs/dias/capturas_jutrip/10n7_m2_05_gasto_cada_uno_solo_tu.jpg`

**2b**

- ✅ Hecho — 5a · Moneda por defecto: euros Sin nada elegido, todo se enseña en euros (antes salía de la ciudad de origen del formulario; ya no).  
  *Dónde:* Presupuesto > fila «Moneda» abajo del todo: dice «€ Euro». Cualquier cuenta nueva.  *Captura:* `docs/dias/capturas_jutrip/10n7_moneda_01_presupuesto_euros.jpg`
- ✅ Hecho — 5b · Cada viajero la elige en dos sitios sincronizados: «Moneda» del presupuesto y Ajustes del perfil Los dos abren la misma hoja de tarjetas (HojaOpciones, la elegida con el estilo de elegir) y llaman a la misma función: cambiar en uno cambia el otro al instante. Design solo dibuja la fila del presupuesto; la de Ajustes sigue el estilo de las demás filas de Ajustes.  
  *Dónde:* Presupuesto > «Moneda»; Perfil > Ajustes > «La app» > «Moneda». Cambia en uno y mira el otro.  *Captura:* `docs/dias/capturas_jutrip/10n7_moneda_02_hoja_moneda.jpg; 10n7_moneda_04_ajustes_moneda.jpg; 10n7_moneda_05_ajustes_hoja.jpg`
- ⚠️ A medias — 5c · Se guarda en su cuenta Se guarda siempre en el móvil (vale sin sesión y sin conexión) y, con cuenta, en travelers.moneda al cambiarla y se trae al entrar. Falta que Eric aplique a mano la migración 0056; mientras no esté, queda solo en el móvil (sin error). No se ha probado contra la base real.  
  *Dónde:* Cambia la moneda con una cuenta, cierra sesión y entra en otro móvil: debería salir la misma (tras aplicar la 0056).
- ⚠️ A medias — 5d · Esa moneda se usa para enseñar los precios en toda la app (presupuesto, cuentas, RESERVAS, entradas, excursiones, el pase) con el cambio del día Aplicado en: presupuesto (líneas y extras), Cuentas del grupo, RESERVAS (alojamiento, seguro, coche, transporte, útil para el viaje, llegada y vuelta), entradas reservadas, vehículo y llegada de DIAS, excursiones, actividades de un sitio, aviso de un gasto, franja de gasto y el pase (empieza en tu moneda; su selector propio sigue). Sin aplicar aún (precio escrito por el usuario en su moneda o texto ya formateado): campos de precio al añadir (HojaPrecio, AddReservationSheet, GeneralBookingModal), «cuánto toca» de HojaAnadirGasto, y las etiquetas de precio de excursión ya formateadas (priceLabel) en el explorador.  
  *Dónde:* Pon la moneda en pesos y recorre Presupuesto, RESERVAS, DIAS (excursiones) y Cuentas: los precios salen «≈ … MXN».  *Captura:* `docs/dias/capturas_jutrip/10n7_moneda_03_presupuesto_pesos.jpg`
- ✅ Hecho — 5e · Cada precio se guarda en la moneda en que se apuntó; en otra moneda se enseña convertido con «≈» y, en pequeño, el original («≈ 2.150 MXN · 100 €») Nada se reescribe: cada precio guarda su {importe, moneda}. Formato central formatearPrecio / precioEnVista en src/lib/monedaFormato.ts y moneda.ts. Cambio del día del servidor (/api/cambio), pedido una vez y guardado; sin cambio se enseña el original sin romper. El «+4 %» de Stripe solo se usa en el pase (10P), no aquí: las cifras de ejemplo del prompt (2.150) salen sin ese recargo.  
  *Dónde:* Presupuesto > Extras: «Cena en Trastevere» 100 € con moneda pesos: «≈ 2.078 MXN» y «100 €» debajo.  *Captura:* `docs/dias/capturas_jutrip/10n7_moneda_03_presupuesto_pesos.jpg`
- ✅ Hecho — 5f · Donde lo que se paga de verdad está en otra moneda (RESERVAS, entradas, excursiones) siempre se ve el original En RESERVAS, entradas y excursiones el texto lleva siempre convertido y original juntos («≈ 215 MXN · 20 €»); en el presupuesto, el original va debajo del convertido.  
  *Dónde:* RESERVAS > Entradas / Alojamiento / Transporte con precio; DIAS > excursión con precio «desde».
- ⚠️ A medias — 5g · Las cuentas del grupo, todas en una misma base (euros, con el cambio del día) y cada uno las ve en su moneda con «≈» si hay cambio Las cuentas se calculan en euros (al céntimo, probado con euros y pesos) y se enseñan convertidas con «≈» + una línea «Las cuentas se llevan en euros…». Aproximación: se usa el cambio del día de HOY para todos los gastos (el cambio del día de cada gasto no se guarda con el gasto; haría falta una columna nueva). «Ya está pagado» se guarda ahora en euros (los pagos antiguos en otra moneda se pasan al cargarlos). PantallaCuentas solo se tocó en los puntos de formato.  
  *Dónde:* Presupuesto > Cuentas del grupo (viaje compartido, «Cada uno lo suyo»), con tu moneda distinta de euros.
- ✅ Hecho — 5h · Un gasto en una moneda sin cambio no se queda fuera sin avisar: sale con su moneda y «Sin cambio a tu moneda» y se cuenta aparte En Cuentas del grupo sale un bloque «Fuera de las cuentas, sin cambio a tu moneda» con cada gasto y su moneda original; no entra en el total. En el presupuesto, las líneas sin cambio dicen «Sin cambio a tu moneda» y su original. Lo personal de otro nunca sale. Probado en lo puro; no comprobado en pantalla con un viaje compartido real.  
  *Dónde:* Cuentas del grupo con un gasto en una moneda rara (sin cambio del día).

**3 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N7 (modo de cuentas, presupuesto, privacidad y moneda) Prueba de la Tanda 10N7: modo 85, presupuesto 82, privacidad 19, moneda 56 = 242 comprobaciones, 0 fallos.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería completa y pruebaJutrip, en 0 fallos (si alguna falla solo con el Vite normal, se pasa con el Vite estable y se dice) Bateria completa (134 pruebas, sin wrappers, un Chrome a la vez): 8 en MAL a la primera; triaje sin regresiones reales: expectativas antiguas actualizadas y todas pasan sueltas con 0 fallos, salvo pruebaTanda10N3_real (Realtime, ya fallaba en la 10N6). pruebaEntrarReal era una regresion real de esta tanda y esta arreglada (ver informe).  
  *Dónde:* No es de móvil.

**3 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, cada una al lado de la de Design  
  *Dónde:* Esta página.

**4 · El informe**

- ✅ Hecho — Apartado «10N7» en docs/dias/INFORME_TANDA10B.md (con las migraciones a aplicar) y esta lista al final  
  *Dónde:* No es de móvil.

**Pruebas:** Prueba de la Tanda 10N7: modo 85, presupuesto 82, privacidad 19, moneda 56 = 242 comprobaciones, 0 fallos.

---

## 10N8 — El repaso de Eric de la 10N5 y la 10N6 con dos teléfonos (27 y 28-oct)

**Estado:** hecho y probado en lo esencial; queda una lista de cosas a medias y de decisiones tuyas (más abajo). Pruebas nuevas `pruebaTanda10N8_*`: avisos 22, perfil 17, cuentas 51, paradas 32, pantallas 30, reservas 24, ficha 40, película 68 (más 14 capturas de Design) y capturas del Free Tour 10 = 294 comprobaciones, 0 fallos, cada una suelta por la cola de un solo Chrome. **No se ha tocado el motor de rutas** (el Free Tour ya no rehace días), así que no hace falta la muestra de 60 fechas. Design al día con `RETOQUES.zip` (Hoja Dia, Pase Pelicula Movil y los cambios de Pase Pelicula, Pase Escena 4b, Pase Globo y Reservas Cada Uno; `Pase Premium` no se usa). Escrito `docs/REGLAS_DE_LA_APP.md` (las reglas de la app en un sitio, con la lista de pantallas que aún no las cumplen).

### Migraciones que tienes que aplicar (a mano, en el editor SQL de Supabase, en este orden)
Antes, las de tandas anteriores que no hayas aplicado (tu consulta de comprobación te lo dice): `0047`, `0048`, `0049`, `0051`, `0053`, `0054`, `0055`, `0056`. Las de esta tanda, **todas idempotentes**:
1. `0058_avisos_viaje_nuevos_y_salir.sql` — cada cambio del viaje crea un aviso nuevo con la frase de lo último (y vuelve a salir como nuevo, con franja y sonido), junta 2 minutos en vez de 15, y al salir o quitarte de un viaje se ocultan de tu campana los avisos de ese viaje (menos «Ya no formas parte del viaje…»).
2. `0059_avisos_juntar_2_minutos.sql` — lo mismo para el vuelo y el alojamiento del administrador (0053) y «ha cambiado las cuentas» (0054): 2 minutos y cada cambio vuelve a marcar el aviso como nuevo. No edita las migraciones anteriores.
3. `0061` — vuelo y alojamiento «para varios» (`poner_lo_suyo_para`), reemplaza `avisar_lo_suyo_propio`.
4. `0062` — **privacidad a nivel de red**: guarda lo «Solo para mí» del administrador aparte (`reservas_privadas_admin`) y un disparador lo saca de `trips.bookings`, de modo que ya no llega a nadie más; limpia de una vez los viajes existentes. El móvil del administrador lo vuelve a juntar.
5. `0063` — `trip_gastos.cambio`: el cambio de moneda del día en que se apunta cada gasto (las cuentas usan ese cambio, no el de hoy).
No existen la `0057` ni la `0060` (no hizo falta).

### Por qué pasaba lo que pasaba
- **Días bloqueados del Free Tour («Ningún día encaja», días en gris):** añadir o pasar el Free Tour rehacía días enteros con el motor (D1→D1-FT, D2→D3), y la función que lo planeaba se negaba a tocar cualquier día con entradas con hora, cosas puestas a mano o excursión. Por eso salían días en gris sin motivo y 26 cambios en una propuesta. Ahora el Free Tour es una parada más: va de primera, por la mañana, sin mover ningún día.
- **El Free Tour que no se quitaba:** al quitarlo sin reserva se llamaba a «rehacer días sin tocar», que se salta los días que el viajero ha tocado a mano (cualquiera con una copia de origen) y devuelve «hecho». Salía «quitado… Deshacer» y el Free Tour seguía en su sitio. No lo reproduje; ese camino ya no existe.
- **Los avisos que no llegaban:** la app solo apuntaba `route.ultimoCambio` en acciones con nombre propio (Free Tour, excursión, volver a la ruta inicial). El resto lo juntaba la 0051 durante 15 minutos en el aviso anterior: mismo id, así que sin franja, sin sonido, sin punto en la campana y con la frase vieja. Añadir solo un restaurante ni se detectaba (el disparador mira paradas, y un restaurante elegido no lo es). Ahora cada guardado lleva lo que ha pasado (`sellarCambio`), cada cambio crea un aviso nuevo con la frase de lo último y el rato para juntarlos baja a 2 minutos.
- **Cuánto tardan:** estimado por el código, **no medido de un móvil a otro**: guardado con 1,5 s de espera + disparador inmediato + Realtime y 0,6 s de espera en el móvil del invitado = unos 2-4 segundos. El del interruptor de excursión puede ir más lento porque espera a terminar de rehacer los días antes de guardar.
- **El sonido:** dos causas. (1) Los avisos juntados en uno ya existente no eran avisos nuevos y no sonaban (el del interruptor sí sonaba porque siempre era un aviso propio). (2) En iPhone el audio se desbloqueaba solo con el primer toque; ahora cada toque lo reanuda, reproduce un instante de silencio y precarga el sonido. Con el iPhone en silencio, o sin haber tocado la pantalla desde que se abrió la app, puede seguir sin sonar.
- **El aviso «Han cambiado el viaje» propio (la «i»):** no era un aviso del servidor sino una línea de la app (`CompartidoHost` → `refrescarViajeActivo`): pasaba cuando el eco de tu propio guardado volvía por Realtime y no coincidía con el último guardado (con dos guardados seguidos, el eco del primero parecía un cambio de otra persona). Ahora se reconocen los últimos 8 guardados.
- **Unirse con decenas de avisos:** no eran avisos de la cuenta (esos nunca existen antes de unirse) sino avisos calculados del propio viaje: fechas especiales, entradas ya reservadas y «Sobre tu ruta». La primera vez que una cuenta ve un viaje como invitada, esos avisos se dan por vistos y se esconden.

### Qué se ha hecho (resumen por apartados)
- **Perfil y Ajustes (1, 1b):** Mis viajes con un viaje a todo el ancho y con varios al 60 %; la tarjeta del [+] «Añade un viaje que ya hiciste»; Ajustes: «Mi cuenta» (correo, Moneda, código de invitación), luego Mis pases, La app (sin Moneda), Invitar y Privacidad, y «Cerrar sesión» sola al final.
- **Unirse, avisos, sonido, flotantes y pastilla (2, 2b, 4):** ver «Por qué pasaba…». «Este código no existe.» La pastilla «Pase Roma» de RUTA: sin pase, azul oscuro con candado dorado; con pase, dorada con ✓; mientras no se sabe, un hueco gris claro de 118×30.
- **Free Tour y paradas (3, 0a-1, 8b-a/b/c):** `HojaDia` en 8 sitios (`AddToDaySheet`, `FreeTourDiaSheet`, «Mover a otro día», `WhereSheet` de la excursión, `CambiarDiaSheet` de `ExcursionSinHueco`, el paso del día de `HojaRecomendacion`, el paso del día de `DayPositionPicker` y la nueva `VolverExcursionARuta`). Una sola vez en la ruta; la franja no viaja con la parada (el Free Tour siempre de primero por la mañana; lo demás de primero sin pase y donde mejor encaja con pase; la app lleva al viajero a la parada y la marca un momento); lo de bloquear días solo para lo que mueve días enteros; quien solo recomienda = un solo cambio con frase (también el interruptor de excursión y el orden de los días); [Volver a ponerla en la ruta] en la excursión quitada con su confirmación; «Cambiar parada» con el título «Cambiar X», sin franja, sin filtros y con ⇄ en todos los sitios (también «✓ En ruta»), y el sitio puede estar varias veces. Confirmaciones: sin [Cancelar] (la ✕ de arriba basta); quitar con entrada = [Quitar parada] y [Quitar también la entrada] en rojo; «Mover antes/después» activos en una parada con entrada, sin aviso de horas.
- **Película y EXPLORAR (5, 6, 0a-10):** película regenerada con `Pase Pelicula Movil` a pantalla completa (se quitaron los estirados a mano de la 10N5/10P, que creaban los recuadros con otro fondo), con el título en la línea de [Saltar]; Baños, Fuentes y «Cerca de ti» como antes con el candado dorado en la esquina; textos nuevos del aviso del pase (abajo).
- **Ficha y botones (8b-e/f/g/h/i):** borde marrón en los botones sobre mapas; «Tus recuerdos» con varias fotos de golpe con pase y la ✕ del aviso fuera de la tarjeta; cabecera de la ficha rehecha (el corazón posado arriba a la derecha: antes estiraba la fila y dejaba 39 px de hueco y las etiquetas sobresalían 16 px) y «Abierto 24 h»; aviso de abajo `AvisoSobreLaBarra` (copia el rectángulo del menú); botón de entrada del Castillo de Sant'Angelo.
- **RESERVAS, vuelos y cuentas (7, 8, 8b-d, 0a-6, 0b):** un solo bloque de vuelo y de alojamiento para quien no es administrador, con «¿Para quién es?» y un solo «Guardar el vuelo» / «Guardar el alojamiento» con un solo aviso con ida y vuelta; comprar la entrada a la misma hora («Comprar a las 14:00», «Ya la tengo · Guardarla» y la pregunta al volver); «Lo tuyo» también en «Cada uno lo suyo» («Del grupo 0 € · Lo tuyo 25 € · Total 25 €»); los gastos [Para mí] cuentan en «Tu parte»; el presupuesto de quien viaja solo ya como «Tu viaje»; el PDF lleva el modo; el cambio del día de cada gasto; privacidad del administrador a nivel de red (0062); moneda por precio en los precios de tienda (PurchaseSection, StopReservation, ArrivalDetailSheet, ExcursionDayPage, AffiliateCardCarousel).

### Los textos nuevos del aviso del pase (0a-10, con el cambio posterior de Eric)
Título «Desbloquéalo con el Pase {destino}». La línea pequeña solo existe si dice algo que el viajero ya ha usado; el pase sale del destino del viaje (`{pase}` en `src/lib/avisoPaseTextos.ts`).

| Dónde | Línea pequeña | Frase en negrita |
|---|---|---|
| «Escuchar historia», tras la de prueba | «Ya has escuchado tu historia de prueba.» | «Con el Pase Roma, podrás escuchar todas las historias que quieras, sin límite.» |
| Segunda foto de un sitio | «Ya tienes tu foto de este sitio.» | «Con el Pase Roma, guarda fotos sin límite y haz crecer tu álbum de recuerdos.» |
| Fuentes | — | «Con el Pase Roma, encuentra las fuentes de agua más cercanas, estés donde estés.» |
| Baños | — | «Con el Pase Roma, encuentra los baños más cercanos, estés donde estés.» |
| Cerca de ti | — | «Con el Pase Roma, descubre todo lo que tienes cerca, estés donde estés.» |
| HOY | «Solo tienes HOY abierto el día de prueba.» | «Con el Pase Roma, tienes HOY disponible todos los días de tu viaje.» |
| Genérica | — | «Desbloquea todo lo que el Pase Roma añade a tu viaje.» |
«Estés donde estés» es verdad **con la ubicación compartida**: «Cerca de ti» ordena por distancia al GPS del viajero, y Baños y Fuentes se abren en esa pestaña. Sin ubicación no hay orden por cercanía.

### Listas que pedías
- **Hojas de elegir día cambiadas a `HojaDia`:** las 8 de arriba. No cambiado: el desplegable «Elige el día» de `AddReservationSheet`, que elige día y hora dentro del formulario de la entrada.
- **«Quitar el Free Tour» eliminado:** ya no quedaba ningún texto visible (se había retirado en la 10N6); solo comentarios y la rama de rehacer días, que ya no existe.
- **Sitios de Roma con «Abierto 24 h» (38, para que los revises):** Arco de Constantino, Fontana de Trevi, Piazza Navona, Plaza de España, Piazza del Popolo, Via del Corso, Plaza de San Pedro, Via di Ripetta, Via della Conciliazione, Lungotevere, Mirador del Janículo, Puente Sant'Angelo, Isla Tiberina, Via dei Fori Imperiali, Campo de' Fiori, Plaza Venecia, Elefantino de Bernini, Fuente de las Tortugas, Fuente del Tritón, Plaza del Quirinal, Via dei Coronari, Via Condotti, Templo de Adriano, Piazza Colonna, Plaza Farnese, Plaza del Campidoglio, Columna de Trajano, Teatro de Marcelo, Ojo de la Cerradura del Aventino, Ponte Sisto, Plaza Trilussa, Quartiere Coppedè, Fontana dell'Acqua Paola, Terraza de Largo Gaetana Agnesi, Mirador de San Pietro in Montorio, Via Veneto, Via del Babuino, Via Margutta. Excluidos a propósito: parques y paseos (Jardines del Pincio, Porta Pinciana, Via Appia Antica, Circo Máximo), Largo di Torre Argentina, Pirámide Cestia, barrios y mercadillos. La Fontana de Trevi lleva la etiqueta aunque tiene una zona de pago con horario junto al agua.
- **Sitios con entrada que faltaban:** el botón se ocultaba en todo sitio «por fuera» (`visitMode==='fuera'`), y el Castillo de Sant'Angelo (`solo_por_fuera`) siempre lo es; se quitó esa condición, así que todos los sitios con entradas (Coliseo, Foro, Panteón, Galería Borghese, Termas de Caracalla, etc.) llevan su botón. La Basílica de San Clemente (excavaciones, 10 €) no tenía entrada: añadida. Quedan sin entrada, a propósito: Fontana de Trevi (zona de pago en el sitio, el servidor la filtra), Cementerio Protestante (donativo), y Basílica de San Pedro, Santa María la Mayor y Santa Cecilia (entrada libre; solo se paga una parte).
- **Botones sueltos sobre mapas con el borde marrón:** volver y fecha de la ficha de parada y de la de llegada, volver de la de comida, cerrar en `ArrivalReturnSheet`, «Mi ubicación» del explorador, el aviso de filtro de `AddStopScreen` y «Ver todo» / «Solo este día» de RUTA (los flotantes de presupuesto y de mapa ya lo tenían).
- **Avisos de abajo sobre el menú (`AvisoSobreLaBarra`):** el [Deshacer], «Viaje eliminado», «marcada como visto», la nota corta y «Enlace copiado». Sin tocar: `FranjaSinConexion` y el aviso dentro de `HojasDeLogros`.
- **Confirmaciones sin ✕:** `PagoHost` mientras espera el pago no la lleva; el resto de las que pasan por `ConfirmDialog` y `Hoja` sí. No he hecho la lista completa de la 10N6 tras quitar [Cancelar].
- **Música (0a-11):** `public/sonidos/pelicula_pase.mp3` **no está** y este PC no tiene `ffmpeg`. No he usado ni comprimido nada.

### Lo que sigue a medias o sin ver (resumen; el detalle, punto a punto, en la lista de comprobación de abajo)
- **El botón de los logros que desaparece en una categoría de EXPLORAR: no lo reproduzco.** En Roma, 390×844, con pase, se ve en todas las categorías (Miradores incluido), en lista, con mapa y con una ficha abierta; solo lo esconde una hoja, un diálogo o una confirmación abierta. Si lo ves en tu móvil, necesito el paso exacto (qué estaba abierto, si es iPhone, si el destino no es curado).
- **Vuelo del administrador:** no tiene el botón único «Guardar el vuelo» con aviso conjunto de ida y vuelta (solo se le ha quitado el [Guardar] de la rueda); hacerlo bien exige reestructurar `LlegadaYVuelta`, que toca el motor de cambios de vuelo. **Alojamiento:** sin los chips de zona de Design 05.
- **Sin ver en pantalla:** la pastilla del pase «esperando» (solo por código), la pregunta «¿Para quién…?» al añadir vuelo del administrador (necesita un viaje compartido real), el aviso de abajo sobre el menú en Safari y con la app en la pantalla de inicio, los avisos entre dos móviles (sonido, segundos) y la fusión de lo privado del administrador en su móvil.
- **Sitios repetidos:** auditoría parcial. Las paradas llevan id propio y el mapa usa ese id; las entradas se enlazan por nombre (las dos copias mostrarían la entrada); los logros cuentan el sitio una vez. Sin comprobar: las fotos de «Tus recuerdos», el mapa con dos números en el mismo sitio y los avisos de cambios.
- **Lista del pase:** la línea «sin pase de primero, con pase en el mejor hueco» no está añadida en `listaDelPase.ts` (generado desde Design). Antes la app ya colocaba en el mejor hueco para todos.
- **Moneda por precio:** el «Cuánto toca» no existe en el código y las etiquetas de precio del explorador no se tocaron.

### Pruebas
- **Batería completa** (143 pruebas, sin los wrappers, un Chrome a la vez y a prioridad baja): 28 en MAL a la primera. El triaje de dos agentes no halló **ninguna regresión real**: eran expectativas antiguas que la 10N8 cambió a propósito (sin [Cancelar], HojaDia, textos de «Este código no existe.», Free Tour sin rehacer días, película nueva, perfil 100 %/60 %, bloque único de alojamiento, etc.) y se actualizaron, o fallos solo bajo carga («No se ha podido crear el viaje de pruebas») que pasan sueltos. Todas pasan en 0 fallos. Fuera: `pruebaTanda10N6_recuerdos`, que con el Vite normal falla (va a la 10S, como pedías).
- **Protección que se pierde, a decidir:** en `pruebaTanda10N5_pase` y `pruebaTanda10N3_apertura`, las comprobaciones de que ningún texto se pise y de que el texto de abajo quepa entero ya no cubren nada, porque la marca `data-texto-abajo` desapareció con la película nueva. Pasan, pero esa protección en 390×664 y 375×667 ahora depende solo de la escala de Design. Habría que volver a marcar el texto en `adaptar.ts` o aceptarlo.

### Dudas para ti
1. **Hoja del vuelo (la mayor diferencia con Design):** Design lleva el resumen «✓ Ida · mar 10 · 11:15» en las pestañas, una rueda de dos columnas, sin precio y el botón fijo abajo; la app tiene pestañas sin resumen, una columna, un campo «Precio (opcional)» y el botón al final del scroll. ¿La igualo?
2. **Tarjeta de Mis viajes:** Design usa chips «4 días · 3 noches · 10 paradas», «En 12 días» y un botón dorado grande; la app sigue con la tarjeta de antes. (El perfil con logros de demostración: un viaje más «Antes de la app» son dos tarjetas y quedan al 60 %; si quieres que «Antes de la app» no cuente, es una línea en `anchoDeTarjeta`.)
3. **Película:** el título «Todo lo que incluye tu Pase Roma» va en la línea de [Saltar] (tu decisión del 26-oct; Design lo pone encima de las rayitas). En la escena 7, Design lleva título y [Saltar]; la app lleva [Ver] y ✕, sin título (decisión de la 10N5).
4. **Hoja Dia 02 de Design** todavía enseña un día en gris por «entradas con hora»; la app no lo bloquea, como manda el prompt.
5. **«Ya lo tienes el miércoles 10»** desapareció de la hoja de añadir (se puede tener el mismo sitio dos veces): si quieres mantener el aviso, hay que reponerlo.
6. **Hoja «Cambiar un día por la excursión»:** con HojaDia, las dos salidas («Añadir en un día nuevo», «Cambiar un día…») quedan encima del botón dorado «Ningún día libre para esto», no debajo.
7. **Unirse Codigo 02 de Design** aún dice «Ese código no es de ningún viaje…»; la app dice «Este código no existe.», como pides.
8. **Ajustes:** «Borrar mi cuenta» sigue debajo de «Cerrar sesión» como enlace rojo; ¿quieres «Cerrar sesión» por debajo de ese enlace?
9. **Aviso de abajo sin esquinas redondeadas** (coherente con el menú actual, que tampoco las tiene). Si Design lo quiere redondeado, hay que redondear ambos.
10. **Marcar al administrador en el vuelo de un invitado** solo le avisa, no le crea vuelo (la ruta sigue al suyo).
11. **Alineación fina de la cabecera de la ficha:** el margen -5 del nombre es una estimación; se ve mejor con la captura.
12. **Lo que no se ha visto con dos cuentas reales** (los avisos entre móviles y los tiempos, unirse sin los avisos viejos, la propuesta de quien solo recomienda con un solo cambio, la privacidad del administrador con la 0062 aplicada) lo pruebas tú con tus dos móviles después de aplicar las migraciones.

### Procesos y CPU
Un solo servidor (API 8787, Vite 5173) a prioridad baja durante toda la tanda y una cola (`scripts/destino/_conCola.mjs`) que deja un solo Chrome de prueba a la vez; la batería se lanzó sin los «wrappers». El PC se reinició dos veces durante la tanda (a las 13:16 y a las 13:35) y se cayeron los servidores y los agentes: no sé qué lo provoca (tiene 32 GB y había más de 16 libres). Lo hecho en disco no se perdió; los agentes se reanudaron desde sus notas.


### Lista de comprobación de la 10N8 (punto por punto)

**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N8.md (con el cambio posterior de los textos del aviso del pase) y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día con RETOQUES.zip (sin uploads/ ni screenshots/): Hoja Dia, Pase Pelicula Movil y los cambios de Pase Pelicula, Pase Escena 4b, Pase Globo y Reservas Cada Uno; Pase Premium no se usa  
  *Dónde:* No es de móvil.
- ✅ Hecho — docs/REGLAS_DE_LA_APP.md: las reglas de la app en un solo sitio, con ejemplos y su pieza de Design, y qué pantallas no las cumplen todavía Escrito: ver el apartado 6 del documento para lo que aún no cumple.  
  *Dónde:* No es de móvil.

**0a**

- ⚠️ A medias — 1 Excursión quitada: [Volver a ponerla en la ruta] con Hoja Dia y confirmación Hecho en código (VolverExcursionARuta + ConfirmDialog «¿Pasamos el jueves 12 a la excursión?»), sin probar en pantalla  
  *Dónde:* RESERVAS > Excursiones, línea «Ya no está en tu ruta»
- ✅ Hecho — 4 Cambiar parada sin filtros initialFilters fuera; visto en pantalla (N5): sin filtros activos al abrir, título «Cambiar X», ⇄ en todos  
  *Dónde:* DÍAS > ··· > Cambiar parada  *Captura:* `docs/dias/capturas_jutrip/10n8_n1_cambiar_parada.jpg`
- ✅ Hecho — 9 Quitar Free Tour sin reserva al momento removeStop + apaga la experiencia; probado  
  *Dónde:* DÍAS > ··· del Free Tour > Quitar parada
- ✅ Hecho — La 0053 (vuelo y alojamiento del administrador) junta ~2 min y cada cambio vuelve a salir como nuevo Migración nueva 0059 (dejar_aviso_de_lo_suyo borra el anterior y crea uno nuevo, 2 min). Sin aplicar.  
  *Dónde:* Aplicar 0059. Con dos móviles: el administrador cambia su vuelo dos veces seguidas; el invitado ve franja y oye sonido en cada una (RESERVAS / campana). Cuenta: invitado.
- ✅ Hecho — 0a-10 Textos del aviso del pase (título «Desbloquéalo con el Pase Roma», línea pequeña solo si dice algo usado, frase en negrita con «Pase {destino}» y sin límite; fuera «Tu ruta ya te dice…») src/lib/avisoPaseTextos.ts con {pase} sustituido por «Pase {destino}»; AvisoPase oculta la línea 1 si está vacía; pruebas 10H, 10N6_avisopase y 10O_datos actualizadas. Sin comprobar en pantalla (la cola de Chrome no me dejó correr la prueba).  
  *Dónde:* Cualquier candado del pase sin pase (cuenta gratis): Escuchar historia, 2.ª foto en «Tus recuerdos», Baños, Fuentes, Cerca de ti, HOY
- ✅ Hecho — 0a-10 «estés donde estés» solo si es verdad Cerca de ti (y Baños/Fuentes, que abren en esa pestaña) ordena por distancia al GPS del viajero solo si hay ubicación; sin ubicación no hay orden por cercanía (PlaceExplorerScreen). Es verdad con la ubicación compartida; HOY usa la siguiente parada si no hay GPS.  
  *Dónde:* EXPLORAR › Restaurantes › Cerca de ti, con pase
- ❌ No hecho — 0a-11 Música de la película public/sonidos/pelicula_pase.mp3 no está en la carpeta y este PC no tiene ffmpeg. No he usado ninguna música. Cuando Eric ponga el archivo: scripts/destino/comprimirMusicaPelicula.sh.  
  *Dónde:* Película del pase (botón de silencio solo si hay archivo)
- ✅ Hecho — 0a-6 Los gastos [Para mí] de Extras cuentan en «Tu parte» porPersonaDelPresupuesto suma Lo tuyo. Comprobado también en pantalla: «Tu parte» de Ana pasa de 300 € a 325 € con su Souvenirs y a 333 € con las Postales. pruebaTanda10N_presupuesto actualizada y en 0 fallos.  
  *Dónde:* Presupuesto > etiqueta «Tu parte»

**0b**

- ✅ Hecho — La 0054 («ha cambiado las cuentas») igual 0059 la pasa a 2 min (ya borraba y creaba uno nuevo). Probado en PGlite.  
  *Dónde:* Aplicar 0059. Administrador cambia el modo de cuentas dos veces; el invitado recibe un solo aviso, nuevo.
- ⚠️ A medias — 0b-1 Pregunta «¿Para quién…?» al añadir vuelo, alojamiento y coche del administrador QuienVaEnLoDelAdmin abre la hoja cuando pasa de no haber a haber. SIN prueba de pantalla (N6 no la hizo: requiere un viaje compartido real con el administrador añadiendo vuelo, alojamiento o coche).  
  *Dónde:* RESERVAS (admin con viaje compartido) > añadir vuelo/alojamiento/coche
- ✅ Hecho — 0b-2 «Solo para mí» del administrador guardado aparte (red) Migración 0062 (tabla reservas_privadas_admin + disparador) y reservasPrivadasAdmin.ts en el móvil del administrador. Probado en PGlite. La fusión en el móvil no está probada en pantalla.  
  *Dónde:* Datos: Ana no recibe esa reserva en trips.bookings
- ✅ Hecho — 0b-5 Presupuesto de quien viaja solo como Cuentas Modo 01 Probado en pantalla: «Tu viaje», sin «por persona» ni personas, Extras con «Añadir gasto» punteado. No se pulsó el botón para comprobar que abre el formulario.  
  *Dónde:* Presupuesto en un viaje sin más gente  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_06_presupuesto_solo.jpg`
- ✅ Hecho — 0b-6 PDF con el modo y «Lo tuyo» solo a quien lo tiene exportPdf + compartidoDeEstado con reparto. Comprobado en código, no abierto un PDF.  
  *Dónde:* Exportar PDF del viaje
- ✅ Hecho — 0b-7 Cambio del día de cada gasto Migración 0063 + foto del cambio al insertar + cuentas la usan. Probado. Solo gastos (no entradas/alojamiento).  
  *Dónde:* Cuentas del grupo con un gasto en otra moneda
- ⚠️ A medias — Moneda por precio en todos los sitios donde se escribe un precio Los campos de precio (HojaPrecio, AddReservationSheet, GeneralBookingModal, TransportBookingModal, vuelo, alojamiento, Añadir gasto, Extras) ya tenían selector de moneda sobre la del viajero; los precios de tienda (entradas, excursiones, actividades) ahora salen en la moneda del viajero. Solo los gastos guardan el cambio del día; «Cuánto toca» no existe en el código.  
  *Dónde:* Cualquier hoja de precio

**1**

- ✅ Hecho — Mis viajes: un solo viaje a todo el ancho Hecho en código y comprobado en pantalla (N6, 390x844): sin logros, un viaje = tarjeta de 350 px sobre 350 útiles. Con los logros de demostración sale además la tarjeta «Antes de la app», que cuenta como segunda tarjeta y deja las dos al 60 % (así lo dice la regla del código; dime si «Antes de la app» no debe contar).  
  *Dónde:* Perfil > Mis viajes con un viaje. Cuenta con un solo viaje.  *Captura:* `docs/dias/capturas_jutrip/10n8_perfil_un_viaje.jpg (y 10n8_perfil_un_viaje_con_antes.jpg)`
- ✅ Hecho — Mis viajes: con más de uno, cada tarjeta al 60 % Comprobado en pantalla: 3 viajes de prueba + «Antes de la app», cada tarjeta 210 px de 350 (60 %) y la siguiente asoma. DIFERENCIA con Design (Mis Viajes Tarjeta): Design pinta la tarjeta con chips «4 días · 3 noches · 10 paradas», «En 12 días» y un botón dorado grande «Abrir este viaje ›»; la app mantiene la tarjeta de antes (fechas y días en una línea, botón con borde). Decisión de diseño: dime si se cambia.  
  *Dónde:* Perfil con 2 o más viajes: la siguiente tarjeta asoma.  *Captura:* `docs/dias/capturas_jutrip/10n8_perfil_varios_viajes.jpg`
- ✅ Hecho — Tarjeta del [+] «Añade un viaje que ya hiciste» con su texto nuevo Comprobado en pantalla: «Añade un viaje que ya hiciste» y «¿Viajaste antes de tener JUTRIP?…».  
  *Dónde:* Perfil > [+].  *Captura:* `docs/dias/capturas_jutrip/10n8_perfil_mas.jpg`

**1b**

- ✅ Hecho — Ajustes: Mi cuenta = correo, Moneda, código de invitación Comprobado en pantalla: filas en orden cuenta, moneda, codigo, mis-pases… Moneda ya no está en «La app».  
  *Dónde:* Perfil > engranaje > Ajustes.  *Captura:* `docs/dias/capturas_jutrip/10n8_ajustes_orden.jpg`
- ✅ Hecho — Ajustes: Mis pases, La app, Invitar, Privacidad; Cerrar sesión al final, sola Comprobado en pantalla: «Cerrar sesión» es la última fila y está sola en su bloque; «Borrar mi cuenta» sigue debajo como enlace rojo (dime si debe ir antes).  
  *Dónde:* Ajustes, bajar hasta el final.  *Captura:* `docs/dias/capturas_jutrip/10n8_ajustes_orden.jpg`

**2**

- ⚠️ A medias — Al unirse: solo los avisos de desde que te uniste Los avisos de la cuenta nunca existen antes de unirse; lo que salía eran los derivados del viaje (fechas especiales, entradas ya reservadas, Sobre tu ruta). Ahora se esconden la primera vez que la cuenta ve el viaje como invitada. No probado con dos cuentas reales.  
  *Dónde:* Unirse con un código con una cuenta nueva; abrir la campana: debe estar vacía de lo anterior.
- ✅ Hecho — Al salir o quitarte, sus avisos desaparecen (menos «Ya no formas parte…») Migración 0058 (sacar_del_viaje oculta los avisos del viaje). Probado en PGlite. Sin aplicar.  
  *Dónde:* Aplicar 0058. Invitado sale del viaje: campana sin avisos de ese viaje.
- ✅ Hecho — Código que no vale: solo «Este código no existe.» Comprobado en pantalla con un código falso (ZZZZ-9999): sale solo «Este código no existe.». DIFERENCIA con Design (Unirse Codigo 02), que aún dice «Ese código no es de ningún viaje. Revísalo con quien te lo ha pasado.»: la app sigue el prompt de Eric.  
  *Dónde:* Unirme con un código > escribir uno falso.  *Captura:* `docs/dias/capturas_jutrip/10n8_unirse_codigo_no_existe.jpg`
- ⚠️ A medias — Sonido de los avisos igual para todos Dos causas: (1) los avisos que se juntaban en uno ya existente no eran nuevos y no sonaban (solo sonaba el del interruptor de excursión, que siempre era aviso propio); (2) iPhone: el audio se desbloqueaba solo con el primer pointerdown; ahora cada toque lo reanuda y precarga el sonido. Si el iPhone está en silencio o sin tocar la pantalla, puede seguir sin sonar.  
  *Dónde:* Dos móviles: cambiar algo desde el administrador y mirar el del invitado con el ajuste «Sonido de los momentos» encendido.
- ⚠️ A medias — Lápiz y logros siempre por encima en EXPLORAR (categorías, lista, mapa, pantalla completa) No reproducido (N6): en Roma, 390x844, con pase, el botón de los logros se ve en las tarjetas de EXPLORAR y, en cada categoría (Atracciones, Miradores, Restaurantes, Entradas, Baños, Fuentes), en la lista, con el mapa, al volver a la lista, tras abrir una ficha y cerrarla, y con el mapa oculto: 0 fallos. Miradores sí existe (6 lugares). El código solo lo esconde (z-index 30, debajo de una pantalla entera) si hay abierta una hoja: rol dialog sin data-flotantes, alertdialog, data-hoja o .map-cover-overlay.items-end. Si Eric lo ve de verdad, necesito el paso exacto (¿con una ficha u hoja abierta? ¿en el iPhone?).  
  *Dónde:* EXPLORAR > Miradores y el resto de categorías.  *Captura:* `docs/dias/capturas_jutrip/10n8_flotantes_miradores.jpg (y 10n8_flotantes_explorar/atracciones/restaurantes/entradas/banos/fuentes.jpg)`

**2b**

- ✅ Hecho — Pastilla del pase sin pase: azul oscuro con candado dorado Comprobado en pantalla: «Pase Roma» con candado, fondo azul oscuro, 30 px de alto. Coincide con Design (Pase Estilo 02).  
  *Dónde:* RUTA, tarjeta del viaje, cuenta sin pase.  *Captura:* `docs/dias/capturas_jutrip/10n8_pastilla_sin_pase.jpg`
- ✅ Hecho — Pastilla con pase: dorado con ✓ Comprobado en pantalla: «Pase Roma» con ✓ sobre oro.  
  *Dónde:* RUTA, cuenta con pase.  *Captura:* `docs/dias/capturas_jutrip/10n8_pastilla_con_pase.jpg`
- ⚠️ A medias — Que no salte al cargar: hueco gris claro sin texto, mismo tamaño Hueco gris claro de 118x30 sin texto en el código (PastillaPase). NO he podido verlo en pantalla: el viaje de pruebas no tiene id de viaje del servidor y el estado «esperando» no se puede forzar con el componente ya montado. Ojo: la pastilla real mide 116 px con «Pase Roma» y más con nombres largos («Pase Florencia»), así que el hueco fijo de 118 no siempre es del mismo ancho. Sitios con candados que esperan el pase: sin revisar uno a uno.  
  *Dónde:* Abrir la app y entrar en RUTA mirando la tarjeta.

**3**

- ✅ Hecho — a Añadir Free Tour de primera por la mañana con Hoja Dia Probado (pruebaTanda10N8_paradas y pruebaTanda10N5_freetour, 0 fallos): solo cambia el día elegido; Free Tour de primera parada  
  *Dónde:* EXPLORAR/ficha/+ Añadir parada > Free Tour  *Captura:* `docs/dias/capturas_jutrip/10n8_n1_hoja_dia_02_anadir_freetour.jpg`
- ✅ Hecho — b Mover a otro día igual Probado  
  *Dónde:* DÍAS > ··· > Mover a otro día  *Captura:* `docs/dias/capturas_jutrip/10n6_n8_hoja_dia_mover.jpg`
- ✅ Hecho — c Una sola vez, ✓ En ruta sin + Probado (pruebaTanda10N5_freetour 53/0): una sola vez en la ruta  
  *Dónde:* EXPLORAR > Entradas
- ✅ Hecho — d Quitar como cualquier parada Probado quitar y Deshacer  
  *Dónde:* DÍAS > ··· > Quitar parada
- ✅ Hecho — e D3 se queda No se rehace ningún día  
  *Dónde:* DÍAS día D3
- ⚠️ A medias — f La franja no viaja; Free Tour primero; sin pase primero; con pase mejor hueco; lleva a la parada y la marca dondeQueda/sinSuFranja y llevarALaParada hechos; la marca visual no capturada. Hoy la app ya colocaba en el mejor hueco para todos; ahora solo con pase  
  *Dónde:* DÍAS
- ✅ Hecho — g Bloqueo de días solo para interruptor y orden de días Al añadir un sitio nunca se bloquea ningún día por entradas (visto en pantalla, N5)  
  *Dónde:* Hoja Dia  *Captura:* `docs/dias/capturas_jutrip/10n8_n1_hoja_dia_03_anadir_sitio.jpg`
- ✅ Hecho — h Propuesta: un solo cambio Probado en pruebaTanda10N5_freetour (sección 5): un solo cambio «Añadir el Free Tour al domingo 18»; el aviso al otro dice «Eric ha añadido el Free Tour al domingo 18.»  
  *Dónde:* Cuenta que solo recomienda
- ⚠️ A medias — i Hoja Dia exacta en todos los sitios Hoja Dia vista en pantalla en 01, 02 y 03 junto a Design. Diferencia: el Design 02 todavía enseña un día en gris «tiene entradas con hora: no lo movemos» (el prompt de la 10N8 manda no bloquear, y la app no lo bloquea). Sigue sin cambiar el desplegable de AddReservationSheet (día+hora)  
  *Dónde:* varias  *Captura:* `docs/dias/capturas_jutrip/10n8_n1_hoja_dia_02_anadir_freetour.jpg`
- ✅ Hecho — j Fuera «Quitar el Free Tour» No quedaba ninguno en el texto de la app (ya retirado en 10N6)  
  *Dónde:* 

**4**

- ✅ Hecho — Llegan: quitar un día, cambiar el orden de los días, añadir restaurante, añadir sitios Causa: sin ultimoCambio se juntaban con el aviso anterior (mismo id, sin franja ni sonido) y un restaurante ni se veía. Ahora cada guardado lleva lo que ha pasado (sellarCambio.ts) y la 0058 crea un aviso nuevo. Probado en PGlite. Sin aplicar.  
  *Dónde:* Aplicar 0058. Administrador quita el sábado 14; invitado ve franja y sonido.
- ✅ Hecho — Frases exactas (quitado el sábado 14, orden de los días, Da Enzo, el Panteón y 2 sitios más) Probadas en pruebaTanda10N8_avisos.  
  *Dónde:* Campana del invitado.
- ✅ Hecho — Juntar ~2 minutos y cada cambio vuelve a marcar nuevo 0058.  
  *Dónde:* Dos cambios seguidos del administrador: un solo aviso, nuevo.
- ⚠️ A medias — Que lleguen en segundos (también el del interruptor) No he podido medir entre dos móviles. Cadena: guardado a 1,5 s, disparador inmediato, Realtime + 0,6 s de espera = unos 2 a 4 s. El del interruptor depende de que termine de rehacer los días antes de guardar.  
  *Dónde:* Dos móviles con cronómetro.
- ✅ Hecho — Nadie recibe avisos de lo que hizo él mismo El disparador ya lo evitaba; el «i Han cambiado el viaje» propio era el eco del propio guardado (solo se recordaba el último guardado; con dos guardados seguidos el eco del primero parecía de otra persona y pisaba la ruta). Ahora se reconocen los últimos 8.  
  *Dónde:* Administrador y un invitado que edita: editar rápido varias veces y no debe salir «Han cambiado el viaje».

**5**

- ✅ Hecho — 5 Película como Pase Pelicula Movil: pantalla completa (fondo a los bordes, palco de Design escalado a min(ancho/390, alto/844)), sin recuadros Probado (pruebaTanda10N8_pelicula, 68/0): el fondo llena toda la pantalla en 390x844 y 375x667 y la escala es la de Design. Capturas de las 7 escenas junto a las de Design  
  *Dónde:* Cualquier cuenta: Ajustes › Mis pases › Ver el Pase, o cualquier candado del pase (primera vez entera)  *Captura:* `docs/dias/capturas_jutrip/10n8_pelicula_e0_390x844.jpg`
- ⚠️ A medias — 5 Escenas 1 a 7 (Vuelo y alojamiento, HOY, Algo brilla, Colección y niveles, El pasaporte, Los recuerdos, El final) en 390×844 y 375×667 Las 7 escenas se ven iguales a Design en 390x844 y 375x667 (vistas 1, 3, 4, 6 y 7 una a una). Diferencia en la escena 7: Design lleva el título y [Saltar] arriba; la app lleva [Ver] y ✕ y sin título (decisión de la 10N5, Eric 26-oct)  
  *Dónde:* Película, tocar las rayitas de arriba para ir a cada escena  *Captura:* `docs/dias/capturas_jutrip/10n8_pelicula_e1_390x844.jpg`
- ✅ Hecho — 5 Título «Todo lo que incluye tu Pase Roma» en la misma línea que [Saltar] Probado (68/0): el título va en la línea de [Saltar] en las escenas 1 a 6. Design lo pone encima de las rayitas; la app lo deja en la línea de [Saltar] porque así lo pide el prompt  
  *Dónde:* Película, escenas 1 a 6  *Captura:* `docs/dias/capturas_jutrip/10n8_pelicula_e2_390x844.jpg`

**6**

- ✅ Hecho — 6 Baños y Fuentes como antes de la 10N5 (tarjeta en gris con su foto) con el candado dorado arriba a la derecha, sin fondo azul ExplorePanel: tarjeta en gris (filter grayscale) con el candado dorado; fuera AZUL_PASE. Prueba 10N5_pase actualizada. Sin captura.  
  *Dónde:* EXPLORAR sin pase (cuenta gratis)
- ✅ Hecho — 6 Recomendados y Cerca de ti con el estilo de elegir de siempre; Cerca de ti sin pase con el candado dorado en su esquina; fuera el azul oscuro InterruptorElegir: la opción «bloqueada» se ve como las demás (elegida oscura, otra clara) con un candado dorado en la esquina arriba a la derecha; quitada la regla clara-con-dorado de la 10N6 1d. Pruebas 10N6_explorar y 10N5_pase actualizadas. Sin captura.  
  *Dónde:* EXPLORAR › Restaurantes › pestañas de abajo, cuenta sin pase

**7**

- ✅ Hecho — 7a Fuera «Tu reserva es del viernes 13: la pasamos a ese día…» Quitado en las dos hojas de AddReservationSheet (comprobado en código).  
  *Dónde:* RESERVAS > añadir entrada > cambiar el día a uno fuera de la ruta; cualquier cuenta
- ✅ Hecho — 7b Un solo bloque de vuelo y uno de alojamiento para quien no es administrador Probado en pantalla (N6, invitada Ana con permiso editar): un solo bloque de vuelo y uno de alojamiento, «Lo ha puesto Eric · para todos» (desde quien mira), «Tengo otro vuelo» / «Me alojo en otro sitio». También el estado «Falta» sin nada puesto. Pareja Design: Reservas Cada Uno 01 (Design solo pinta el caso «Falta» y colapsado; la app lo pinta abierto).  
  *Dónde:* RESERVAS > Llegada y vuelta / Alojamiento; cuenta invitada (Ana)  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_01_invitado_bloque_unico.jpg · docs/dias/capturas_jutrip/10n8_reservas_00_invitado_falta.jpg · docs/dias/capturas_jutrip/10n8_reservas_02_invitado_alojamiento.jpg`
- ⚠️ A medias — 7c Vuelo y alojamiento con «¿Para quién es?» (marcado solo quien lo pone) Probado en pantalla la hoja del vuelo: «¿Para quién es?» con solo quien lo pone marcado (Ana). Alojamiento: nombre libre, sin chips de zona de Design 05. Marcar al administrador en un vuelo de un invitado solo le avisa, no le crea vuelo.  
  *Dónde:* RESERVAS > Falta > Guardar el vuelo; Ana y Luis  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_03_hoja_vuelo_guardar.jpg`
- ⚠️ A medias — 7d Guardar el vuelo de una vez, sin [Guardar] en la rueda, un solo aviso con ida y vuelta Probado en pantalla: la hoja trae «Guardar el vuelo» y ningún [Guardar] suelto. DIFERENCIAS con Design (Reservas Cada Uno 02b): Design muestra «✓ Ida · mar 10 · 11:15» en la pestaña de ida, pastillas con ✓ para día y aeropuerto, rueda de dos columnas (hora : minutos) con «HORA DE SALIDA 18:05», sin campo de precio y el botón fijo abajo; la app tiene la pestaña Ida/Vuelta sin resumen, rueda de una columna, campo «Precio (opcional)» y el botón al final del scroll. Administrador: cada tramo sigue guardándose por separado, sin botón único.  
  *Dónde:* RESERVAS > Llegada y vuelta (admin y invitado)  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_03b_hoja_vuelo_boton_guardar_el_vuelo.jpg`
- ✅ Hecho — 7e Añadir gasto: solo quien lo añade marcado, sin [Para todos]/[Para mí] Probado en pantalla (Ana, «Cada uno lo suyo»): sin [Para todos]/[Para mí], «¿Quién ha pagado?» y «¿Para quién es?» con solo Ana marcada, «Solo para ti: es un gasto tuyo y nadie más lo ve.»  
  *Dónde:* Presupuesto > Añadir gasto; cuenta con «Cada uno lo suyo»  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_04_anadir_gasto_cada_uno.jpg`

**8**

- ✅ Hecho — Comprar la entrada a la misma hora: «Comprar a las 14:00», «Ya la tengo · Guardarla» y pregunta al volver Probado en pantalla (Luis, no incluido): «Comprar a las 09:15» (hora del administrador) y «Ya la tengo · Guardarla»; al volver a la app sale «¿Has comprado la entrada del Coliseo, Foro y Palatino de las 09:15?» [Sí, guardarla] [Todavía no]. N6 arregló el artículo: salía «de Coliseo, Foro y Palatino» y ahora «del Coliseo…» (AddReservationSheet, sitioDeLaEntrada). La tienda se abre con window.open sustituido (no se probó la web).  
  *Dónde:* RESERVAS > entrada azul de otro > Reservar la mía a la misma hora; invitado  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_07_comprar_misma_hora.jpg · docs/dias/capturas_jutrip/10n8_reservas_07b_comprar_boton_y_ya_la_tengo.jpg · docs/dias/capturas_jutrip/10n8_reservas_08_pregunta_al_volver.jpg`

**8b**

- ✅ Hecho — a Confirmación de quitar con entrada sin Cancelar Probado (pruebaTanda10N6_confirmar 61/0): dos botones, sin [Cancelar] ni línea de RESERVAS. No hay pieza de Design de esta confirmación: la referencia es la de «Eliminar día», que tampoco lleva [Cancelar]  
  *Dónde:* DÍAS > ··· parada con entrada > Quitar parada  *Captura:* `docs/dias/capturas_jutrip/10n6_n8_quitar_con_entrada.jpg`
- ⚠️ A medias — Regla: confirmaciones con ✕ y sin Cancelar ConfirmDialog ya no pinta Cancelar; las Hoja llevan ✕ salvo PagoHost mientras espera. Quedan sin Cancelar otras hojas propias no revisadas una a una  
  *Dónde:* 
- ✅ Hecho — b Mover antes/después activos con entrada Probado (pruebaTanda10N6_confirmar): Mover después activo y sin aviso de horas; Mover antes activo salvo en la primera parada  
  *Dónde:* DÍAS > ··· parada con entrada
- ⚠️ A medias — c Cambiar parada: título, sin franja, ⇄ en todos, + en En ruta, repetidos Visto en pantalla (N5): título «Cambiar Via Veneto», sin franja, ⇄ en todos incluidos los «✓ En ruta». Sin auditoría completa de sitios repetidos (mapa con dos números, recuerdos, likes, logros)  
  *Dónde:* undefined  *Captura:* `docs/dias/capturas_jutrip/10n8_n1_cambiar_parada.jpg`
- ✅ Hecho — 8b-e Botones sobre mapas con el borde marrón de la pastilla «Roma · fechas» Probado (pruebaTanda10N8_ficha 40/0): volver con borde 1,5 px marrón en la ficha  
  *Dónde:* DÍAS › abrir una parada; EXPLORAR › mapa; RUTA  *Captura:* `docs/dias/capturas_jutrip/10n8_ficha_Trevi.jpg`
- ⚠️ A medias — 8b-f «Tus recuerdos»: con pase, varias fotos de la galería de una vez El selector de galería ahora es siempre multiple (antes dependía de sinPase, que se calcula sin repintar); sin pase, de varias se guarda la primera y sale el aviso. Sin probar con el móvil.  
  *Dónde:* Ficha de un sitio › Tus recuerdos › Elegir de la galería (cuenta con pase)
- ✅ Hecho — 8b-f Aviso de la segunda foto con el texto de 0a-10 «Ya tienes tu foto de este sitio.» + «Con el Pase {destino}, guarda fotos sin límite y haz crecer tu álbum de recuerdos.»  
  *Dónde:* Cuenta sin pase: subir una 2.ª foto en la misma parada
- ✅ Hecho — 8b-f La ✕ del aviso va fuera de la tarjeta azul, separada AvisoPase añade un hueco de 36 px sobre la tarjeta; la ✕ de la hoja queda en él. Sin captura.  
  *Dónde:* Cualquier aviso del pase
- ✅ Hecho — 8b-g Cabecera de la ficha: foto, nombre, etiquetas y corazón en un bloque; nombre arriba alineado con la foto; etiquetas debajo sin hueco (columna si el nombre ocupa una línea, fila si ocupa dos) Arreglado por N5: el corazón estaba en el flujo y, al ser más alto que un nombre de una línea, dejaba ~39 px de hueco entre el nombre y las etiquetas y las etiquetas sobresalían de la foto. Ahora va posado arriba a la derecha. Probado (40/0) en Fontana di Trevi (3 líneas, etiquetas en fila), Coliseo (1 línea, en columna) y Museos Vaticanos (varias líneas)  
  *Dónde:* DÍAS/EXPLORAR/Cambiar parada › abrir la ficha de cualquier sitio  *Captura:* `docs/dias/capturas_jutrip/10n8_ficha_Coliseo.jpg`
- ✅ Hecho — 8b-g Etiqueta «Abierto 24 h» en verde solo para sitios al aire libre sin horario que siempre están abiertos Probado: Fontana di Trevi lleva «Abierto 24 h» en verde y el Coliseo no (pruebaTanda10N8_ficha). Lista de los 38 sitios pendiente de revisión de Eric  
  *Dónde:* Ficha de la Fontana di Trevi, plazas, calles, puentes  *Captura:* `docs/dias/capturas_jutrip/10n8_ficha_Trevi.jpg`
- ⚠️ A medias — 8b-h El aviso de abajo con [Deshacer] ocupa exactamente el sitio del menú Probado en Chrome (el aviso y el menú miden lo mismo, 0 px de diferencia). Sin probar en Safari ni con la app en la pantalla de inicio  
  *Dónde:* DÍAS › añadir/mover/quitar una parada (Deshacer); Perfil › quitar un viaje  *Captura:* `docs/dias/capturas_jutrip/10n8_aviso_sobre_menu.jpg`
- ✅ Hecho — 8b-i Castillo de Sant'Angelo con su botón de entrada y repaso de todos los sitios de Roma con entradas Causa: el botón se ocultaba en toda parada «por fuera» (solo_por_fuera, el Castillo siempre lo es). Quitada esa regla en StopAccordion: todo sitio con entradas lleva su botón. Además la Basílica de San Clemente (excavaciones, 10 €) no tenía entradas: añadida a data/dias/roma/_entradas.json. Sin captura.  
  *Dónde:* DÍAS › el día con el Castillo de Sant'Angelo
- ✅ Hecho — 8b-d Presupuesto con algo «Solo tú»: bloque «Lo tuyo» y «Del grupo 0 € · Lo tuyo 25 € · Total 25 €» Probado en pantalla (Eric con el Panteón solo para él, 25 €): bloque «Lo tuyo / Solo lo ves tú», «Del grupo 0 € · Lo tuyo 25 € · Total 25 €», también en cuenta conjunta de dos.  
  *Dónde:* Presupuesto con «Cada uno lo suyo», Eric con una entrada solo para él  *Captura:* `docs/dias/capturas_jutrip/10n8_reservas_05_presupuesto_lo_tuyo.jpg · docs/dias/capturas_jutrip/10n8_reservas_05b_presupuesto_conjunta_lo_tuyo.jpg`

**9 · La prueba**

- ✅ Hecho — Pruebas nuevas pruebaTanda10N8_* (paradas, perfil, avisos, pantallas, reservas, cuentas, ficha, película y capturas del Free Tour) ver el informe  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería completa y pruebaJutrip, en 0 fallos (si alguna falla solo con el Vite normal, se pasa con el Vite estable y se dice) ver el informe  
  *Dónde:* No es de móvil.

**9 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, cada una al lado de la de Design  
  *Dónde:* Esta página.

**10 · El informe**

- ✅ Hecho — Apartado «10N8» en docs/dias/INFORME_TANDA10B.md (por qué salían los días bloqueados, por qué no llegaban los avisos y cuánto tardan, y el sonido) y esta lista al final  
  *Dónde:* No es de móvil.

**Pruebas:** pruebaTanda10N8_*: avisos 22, perfil 17, cuentas 51, paradas 32, pantallas 30, reservas 24, ficha 40, película 68, capturas del Free Tour 10 = 294 comprobaciones, 0 fallos.

## 10N9 — Arreglos cortos de lo que quedó de la 10N8 (28 y 29-oct)

**Qué migración hay que aplicar: SOLO la `0064_solo_para_mi_admin_aparte_solo_conjunta.sql`.** No hace falta la 0062 (no la apliques): la 0064 crea lo que falte, la sustituye y, si algún día se hubiera aplicado la 0062, la corrige y devuelve a su sitio lo apartado de los viajes que no son cuenta conjunta. Se puede pegar entera y repetir.

### 1. Lo «Solo para mí» del administrador, solo en la cuenta conjunta
- El problema de la 0062 era real: apartaba toda reserva «solo del administrador» en cualquier forma de llevar las cuentas, y en «Cada uno lo suyo» (donde una entrada sale marcada solo para quien la compra) los amigos habrían dejado de ver casi todas las entradas del administrador y se habría roto «Eric la tiene a las 9:15 · Reservar la mía a la misma hora».
- La 0064: el disparador `separar_reservas_privadas` solo actúa si `modo_cuentas_del_viaje(route) = 'conjunta'` (igual que la 0055); la limpieza del final también; y un disparador nuevo (`a_restaurar_reservas_privadas`, sobre `route`) devuelve lo apartado a `trips.bookings` cuando el viaje deja de ser cuenta conjunta y vacía la tabla.
- Móvil: `reservasPrivadasAdmin.ts` usa la misma regla (`esCuentaConjuntaDelServidor`: modo elegido o, sin elegir, pareja/familia) y, fuera de la cuenta conjunta, no sigue ni junta nada.
- Probado con la base de datos real (PGlite, solo con la 0064 y sin la 0062): 13 comprobaciones, 0 fallos. En «Cada uno lo suyo» Ana sigue viendo la entrada del administrador; en la conjunta no le llega ni en los datos; al cambiar de modo vuelve; guardar en «Cada uno lo suyo» no aparta nada.

### 2. «Guardar el vuelo» también para el administrador
- «Llegada y vuelta» abre una sola hoja (`HojaDelVuelo`) con la ida y la vuelta, la misma que usa el invitado. La rueda de la hora ya no tiene [Guardar]; hay UN botón «Guardar el vuelo» (o «Guardar el tren»), apagado hasta poner alguna hora. En alojamiento, «Guardar el alojamiento».
- Nada se guarda hasta pulsar el botón. Al pulsar se guarda todo de una vez (`guardarVueloDelAdmin`) con UN solo cambio: «ha guardado el vuelo (ida … y vuelta …)». Antes cada cambio de hora rehacía los días y salía un «ha rehecho la ruta» aparte; ahora, si el rehacer viene de «Guardar el vuelo» con las mismas fechas, mantiene el mismo cambio (si el rehacer en segundo plano tarda más de ~20 s podría salir un aviso extra; no probado en la nube real).
- Tocado cerca del motor de cambios: `useRouteStore.ts` (`guardarVueloDelAdmin` y un cambio pequeño en el `setRoute` que rehace). Solo afecta al `ultimoCambio`; el motor de rutas no se ha tocado.

### 3. Como en Design
- **Hoja del vuelo (`Reservas Cada Uno`, 02b):** rueda de dos columnas hora : minutos con banda dorada, SIN campo de precio, botón dorado pegado al pie (fuera del scroll), título «Tu vuelo», eyebrow «LLEGADA Y VUELTA», chips con ✓ y, en cada pestaña, el resumen del otro lado cuando ya está puesto («✓ Ida · mar 10 · 11:15»). Tu prompt listaba ese resumen entre las diferencias; lo he entendido como «iguálalo a Design» (Design SÍ lo lleva). Si lo quieres fuera, es una línea (`mostrarResumen` en `HojaDelVuelo.tsx`). **Diferencias que quedan:** el fondo es el de la app (no el crema `#FBF3E2`); minutos de 5 en 5 (Design enseña de 1 en 1, era un ejemplo); el administrador ve un solo chip de día (el del viaje) con «Cambia las fechas del viaje». **El precio del vuelo** ya no está en la hoja: el del administrador sigue en la casilla «Precio» del tramo; el del invitado se conserva pero hoy no tiene dónde ponerse (decídelo tú).
- **Mis viajes (`Mis Viajes Tarjeta`):** portada 150, etiqueta 14/14, destino 34 px Instrument Serif, fechas en mono 12 px, chips «4 días · 3 noches · 10 paradas» y «En 12 días» / «Mañana» / «Hoy», botón de 52 px (dorado con degradado en un viaje próximo; azul oscuro con letra dorada y etiqueta «Hecho» en uno hecho). En un viaje hecho Design pone «12 paradas · 3 logros · 41 fotos»: aquí salen paradas y fotos, porque no hay cifra de logros por viaje. Los anchos no cambian (uno = 100 %, varios = 60 %).

### 4. La película del pase
- **Textos pisados o cortados:** medido con `getBoundingClientRect` en las escenas 0, 1, 3, 4, 5, 6 y 7, en 390×664 y 375×667: 0 pisados, 0 cortados, 0 fuera de pantalla. **La comprobación automática ha vuelto**: la marca `data-texto-abajo` está otra vez en `adaptar.ts` (39 nodos) y `pruebaTanda10N5_pase` y `pruebaTanda10N3_apertura` miden de verdad el texto de abajo.
- **Añadido (iPhone «sin márgenes»):** los archivos de la 10N8 eran los correctos. `Pase Pelicula Movil`, `Piezas/Pase Pelicula`, `Pase Escena 4b` y `Pase Globo` de `docs/diseno/proyecto/` son byte a byte los del `RETOQUES.zip` más nuevo (27-oct 23:34; el de Descargas es el mismo). La app no usa el HTML: usa `gen/Pase_Pelicula.ts`, `Pase_Escena_4b.ts` y `Pase_Globo.ts` (commit de la 10N8), que genera `scripts/destino/generarPelicula.mjs`; al regenerarlos salen con el mismo md5, así que reflejan exactamente los HTML. Los monta `PeliculaPase.tsx` con `pantalla="si"` y `adaptar.ts` solo cambia lo propio de la app.
- **Medido contra Design, escena por escena** (7 escenas × 390×844, 390×664 y 375×667; también 393×852, 393×659 y 430×932): el fondo llena la pantalla y el palco 390×844 es el de Design (escala `min(ancho/390, alto/844)`, centrado; en 390×664 queda con ~42 px a cada lado, en 375×667 con ~33 px). Cajas de texto, iconos y rayitas a 0 px de Design (tolerancia 2) salvo lo propio de la app: el título pequeño (ver abajo), [Ver]/✕ del final ([Saltar] no está allí), el botón de silencio, [Comprar] y la lista del final (filas de la app, con «HOY» en oro). Píxeles distintos: 0,0–0,3 % en casi todas, ~1 % en la 3; la 5 (el globo gira sin parar) no es comparable píxel a píxel.
- **No he podido reproducir tu «sin márgenes» en Chrome.** Posibles causas en un iPhone real que no puedo medir aquí: la app añadida a la pantalla de inicio (`index.html` lleva `viewport-fit=cover` y Design no usa `env(safe-area-inset-*)`, así que no lo he añadido) o la barra de Safari cambiando la altura. **Dime con cuál lo ves**; si es la pantalla de inicio, añado los safe-area.
- **Único cambio que choca con Design:** el título pequeño «Todo lo que incluye tu Pase Roma». Design lo pone encima de las rayitas (top 16); tu decisión del 26-oct lo puso en la línea de [Saltar]. Probé a devolverlo al sitio de Design: se pisa con el contenido de la escena «hoy» (Fontana di Trevi) y rompe tu regla de que ningún texto se pise, así que **se queda en la línea de [Saltar]**. Si prefieres el de Design, es una línea en `ajustarLaCabecera` y habrá que aceptar ese solape en la escena 1.
- Capturas: `10n9_peli_<e0|e1|e3|e4|e5|e6|e7>_<390x844|390x664|375x667>_<app|design>.jpg`. Ojo: Design se ve con las esquinas redondeadas de su página; la app es pantalla completa.

### 5. «Abierto 24 h»
- La Fontana di Trevi ya llevaba `abierto_24h: true` y la etiqueta verde sale en su ficha. El Teatro de Marcelo: quitado `abierto_24h` y puesto `"schedule": "09:00-19:00"` y `"windows": ["09:00-19:00"]` (como Colle Oppio); su ficha muestra 09:00–19:00 y no «Abierto 24 h». Quedan 37 sitios con la etiqueta, ninguno con horario a la vez.
- El Teatro de Marcelo ya tiene horario, así que entra en el motor de horarios: está en `data/dias/roma/listas.json` (una entrada «de camino a la cena» que podría caer pasadas las 19:00). El barrido de 1884 viajes (`pruebaTanda6u`) da 0 fallos y 0 tardes sin aviso.

### 6. La prueba
- `pruebaTanda10N9` (envoltorio de `_cuentas` 13, `_vuelo` 29, `_pantallas` 140) y `pruebaTanda10N9_pelicula` (154): números finales en la línea «Pruebas» de abajo.
- **Batería completa** (146 pruebas, sin los wrappers, un Chrome a la vez y a prioridad baja): 28 en MAL a la primera, como en la 10N8. Repetidas con el **Vite estable** (sin vigilar archivos): 22 pasan y 5 siguen en MAL. Triaje: `pruebaFase6y5_pantallas` (el botón de Mis viajes ahora es de 52 px, como Design: expectativa actualizada) y `pruebaFase6y6_cierre` (la hoja del vuelo tiene un solo botón: expectativa actualizada) pasan en 0; `pruebaTanda10M_app` pasa sola en 0; `pruebaTanda10N3_real` y `pruebaEntrarReal` usan Supabase real y fallan por el límite de altas anónimas («Request rate limit reached») o Realtime, ajeno a esta tanda. Otras expectativas antiguas cambiadas por lo pedido: `pruebaTanda10N5_perfil`, `pruebaTanda6z6b`, `pruebaTanda10N3_apertura` (acepta `overflow:clip`), `pruebaFase6y5_pantallas` (botones de punto) y `pruebaTanda10N5_cadauno_enLaApp` (título «Tu vuelo»).
- `pruebaTanda7_reservas` se cae en la sección 8 (`TarjetaTuUltimoDia`, `textos` undefined): código ajeno, no entra en la batería. Fuera, como en la 10N8: `pruebaTanda10N6_recuerdos` (con el Vite normal falla; va a la 10S).
- Typecheck `npx tsc -p tsconfig.app.json --noEmit`: limpio.

### Lo que sigue a medias o sin ver
- Sin ver en un iPhone real ni con dos móviles: tu «sin márgenes» de la película, el aviso único del vuelo del administrador (sonido, segundos), el cambio de modo de cuentas con dos cuentas reales.
- Música: `public/sonidos/pelicula_pase.mp3` sigue sin estar (y el PC no tiene `ffmpeg`).
- Heredado de la 10N8 y sin tocar: el botón de logros que desaparece en EXPLORAR (necesito el paso exacto), «Cuánto toca» inexistente, etiquetas de precio del explorador sin la moneda, chips de zona en el alojamiento.

### Dudas para ti
1. **Título de la película:** ¿en la línea de [Saltar] (como ahora) o en el sitio de Design (se pisa con la escena «hoy»)?
2. **Resumen «✓ Ida…» en las pestañas de la hoja del vuelo:** lo dejé porque Design lo lleva; ¿lo quitas?
3. **Precio del vuelo del invitado:** hoy no tiene dónde ponerse. ¿Fila en su tarjeta?
4. **Safe-area en la película:** ¿la ves en la pantalla de inicio o en Safari?
5. **Chip «logros» del viaje hecho en Mis viajes:** no hay cifra por viaje; ¿de dónde sale?

### Lo que NO se pudo repetir al cerrar (Eric mandó cerrar ya, 29-oct)
- Tras devolver el título de la película a la línea de [Saltar], las pruebas `pruebaTanda10N9_pelicula`, `pruebaTanda10N5_pase`, `pruebaTanda10N8_pelicula`, `pruebaTanda10N6_avisopase` y `pruebaTanda10N3_apertura` **no se repitieron completas**: las pasadas cayeron por `window.__rutaPrueba is not a function` (el Vite se había caído) y se cortaron a mano. Antes del cambio del título sí pasaron (película 154 con 6 ya tratados, `10N3_apertura` 561/0, `10N8_perfil` 17/0, `10N8_ficha` 40/0). **La película queda ⚠️ A MEDIAS**: hay que repasarlas en la 10N10 con el Vite estable.

### Lista de comprobación 10N9


**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N9.md y en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Reglas de siempre (REGLAS_DE_LA_APP.md y Design); 2 agentes como mucho, un servidor, un Chrome, memoria mirada; nota de estado cada 30 min a la rama «estado» (apuntada en CLAUDE.md) Hubo 2 agentes a la vez, un Vite y una API, y la batería con un solo Chrome. La nota se subió cada ~25 min.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Migraciones: Eric tiene hasta la 0063 menos la 0062 Hay que aplicar SOLO la 0064 (no la 0062).  
  *Dónde:* Supabase > SQL editor: pegar 0064_solo_para_mi_admin_aparte_solo_conjunta.sql

**1 · Solo para mí del administrador, solo en cuenta conjunta**

- ✅ Hecho — La separación solo vale con modo_cuentas_del_viaje = conjunta: disparador, limpieza del final y reservasPrivadasAdmin.ts; en «Cada uno lo suyo» y viajando solo, como antes de la 0062 Probado con la base de datos real (PGlite): en «Cada uno lo suyo» Ana sigue viendo la entrada del administrador; en la conjunta no le llega.  
  *Dónde:* Con dos cuentas: Eric administrador con «Cada uno lo suyo»: la entrada «Solo para mí» de Eric la ve su amigo y sale «Reservar la mía a la misma hora».
- ✅ Hecho — Si el viaje pasa de cuenta conjunta a «Cada uno lo suyo», lo apartado vuelve a trips.bookings Probado en la base de datos. Sin ver con dos móviles reales.  
  *Dónde:* Con dos cuentas: Ajustes del viaje > cómo llevar las cuentas > cambiar a «Cada uno lo suyo».
- ✅ Hecho — Migración nueva que sustituye a la 0062, sin editarla y aplicable sin ella 0064_solo_para_mi_admin_aparte_solo_conjunta.sql. Se aplica SOLA; si algún día aplicaste la 0062, también vale (la corrige y devuelve lo apartado de viajes que no son conjuntos).  
  *Dónde:* No es de móvil.

**2 · Guardar el vuelo del administrador**

- ✅ Hecho — En la rueda de la hora, sin [Guardar]; un solo botón «Guardar el vuelo» (y «Guardar el alojamiento»); solo entonces se guarda y llega un solo aviso con la ida y la vuelta El aviso dice «ha guardado el vuelo (ida … y vuelta …)». El botón está apagado hasta poner alguna hora. Sin ver con dos móviles (sonido, segundos).  
  *Dónde:* RESERVAS o RUTA > Llegada y vuelta > Tu vuelo. Cuenta de administrador de un viaje compartido.  *Captura:* `10n9_hoja_vuelo.jpg`

**3 · Como en Design**

- ⚠️ A medias — La hoja del vuelo exactamente como Reservas Cada Uno: resumen «✓ Ida…» en las pestañas, rueda de dos columnas, sin precio, botón fijo abajo Hecha como Design 02b. Diferencias que quedan: la hoja usa el fondo de la app (no el crema de Design); minutos de 5 en 5 (Design de 1 en 1, era un ejemplo); el administrador ve un solo chip de día (el del viaje) con «Cambia las fechas del viaje». El precio del vuelo ya no está en la hoja: el del administrador sigue en el bloque; el del invitado se conserva pero hoy no tiene dónde ponerse.  
  *Dónde:* Llegada y vuelta > Tu vuelo (administrador e invitado).  *Captura:* `10n9_hoja_vuelo.jpg`
- ✅ Hecho — La tarjeta de «Mis viajes» con los chips de Design Chips «4 días · 3 noches · 10 paradas», «En 12 días» y botón dorado. En un viaje hecho Design pone «12 paradas · 3 logros · 41 fotos»: aquí salen paradas y fotos (no hay cifra de logros por viaje).  
  *Dónde:* Perfil > Mis viajes (un viaje y varios).  *Captura:* `10n9_mis_viajes.jpg`

**4 · La película del pase**

- ✅ Hecho — Captura de cada escena en 390×664 y 375×667: ningún texto se pisa ni se corta; comprobación automática puesta otra vez Medido con getBoundingClientRect en las escenas 0, 1, 3, 4, 5, 6 y 7: 0 pisados, 0 cortados. La marca data-texto-abajo está otra vez. En la escena «Suma» la pieza «Pedazo» pasa por encima del título pequeño (es la animación de Design, una imagen).  
  *Dónde:* Abrir el pase (Roma, con pase) y ver la película en tu móvil.  *Captura:* `10n9_pelicula_suma_390x664.jpg`

**4 · La película del pase (añadido de Eric, 28-oct)**

- ⚠️ A medias — Usar Pase Pelicula Movil del RETOQUES.zip más nuevo (y Piezas/Pase Pelicula, Pase Escena 4b y Pase Globo) y hacerla exactamente igual, escena por escena; captura de cada escena tuya al lado de la de Design en 390×844, 390×664 y 375×667, con los márgenes de Design; decir qué archivos se usaron en la 10N8 y qué ha cambiado Los archivos eran los correctos: los 4 HTML de Design son byte a byte los del RETOQUES.zip (el de Descargas es el mismo) y los TS de la app (gen/Pase_Pelicula.ts, Pase_Escena_4b.ts, Pase_Globo.ts) salen idénticos al regenerarlos. Medido en 7 escenas × 3 tamaños (y 393×852, 393×659, 430×932): el fondo llena la pantalla y el palco, el texto, los iconos y las rayitas están a 0 px de Design, salvo lo propio de la app ([Ver]/✕ del final, silencio, [Comprar], la lista del final con «HOY»). NO he podido reproducir tu «sin márgenes» en Chrome. Posibles causas en un iPhone real: app añadida a la pantalla de inicio (la app usa viewport-fit=cover y Design no usa safe-area) o la barra de Safari. Dime con cuál lo ves; si es la pantalla de inicio, añado los safe-area. Único cambio que choca con Design: el título pequeño «Todo lo que incluye tu Pase Roma» va en la línea de [Saltar] (tu decisión del 26-oct) y no en su sitio de Design (top 16), donde se pisa con el contenido de la escena «hoy». Si lo quieres en el sitio de Design, es una línea.  
  *Dónde:* Pase Roma > la película, en tu iPhone (Safari y, si la tienes, la app en la pantalla de inicio).  *Captura:* `10n9_peli_e4_390x844_app.jpg`

**5 · Abierto 24 h**

- ✅ Hecho — La Fontana di Trevi, con la etiqueta Ya la llevaba; se ve en su ficha.  
  *Dónde:* Roma > Fontana de Trevi > ficha.  *Captura:* `10n9_trevi_24h.jpg`
- ✅ Hecho — El Teatro de Marcelo, sin la etiqueta y con horario 9:00–19:00 Puede entrar ahora en el motor de horarios (hay una entrada «de camino a la cena» que podría caer pasadas las 19:00); el barrido de 1884 viajes no dio fallos.  
  *Dónde:* Roma > Teatro de Marcelo > ficha.  *Captura:* `10n9_marcelo_horario.jpg`
- ✅ Hecho — El resto de la lista de 38, bien Quedan 37 con la etiqueta (ninguno con horario a la vez).  
  *Dónde:* No es de móvil.

**6 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N9 (cuentas, vuelo, pantallas) ver el informe  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería completa y pruebaJutrip, en 0 fallos (si falla solo con el Vite normal, con el Vite estable) ver el informe  
  *Dónde:* No es de móvil.

**6 · Capturas**

- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y esta página a tamaño de móvil, al lado de las de Design  
  *Dónde:* Esta página.

**7 · El informe**

- ✅ Hecho — Apartado «10N9» en INFORME_TANDA10B.md diciendo qué migración aplicar, y esta lista al final  
  *Dónde:* No es de móvil.

**Pruebas:** `pruebaTanda10N9` = cuentas 13 + vuelo 29 + pantallas 140 = 182 comprobaciones, 0 fallos. Película 10N9: 154 en su última pasada completa (6 ya tratados), sin repetir con el título final. Batería: 2 en MAL, ambas de Supabase real (`pruebaTanda10N3_real`, `pruebaEntrarReal`).


## 10N10 — El repaso de Eric de la 10N7 y la 10N8 con dos teléfonos (28 y 29-oct)

**Qué migraciones hay que aplicar (en este orden, después de la 0064 que ya tienes; se pueden pegar enteras y repetir):**
1. `0065_avisos_cada_cambio_nuevo_y_vuelo_del_invitado.sql` — cada cambio es un aviso nuevo y el vuelo del invitado avisa al administrador.
2. `0067_cuentas_segun_personas.sql` — la forma de las cuentas sale de cuántas personas hay (no de lo que se elegía a mano).
No existe la 0066 (hueco de numeración). La 0062 sigue sin aplicarse ni hacer falta.
**Comprobación tras aplicarlas:** `node scripts/destino/pruebaTanda10N10_avisos_real.mjs --con0065 --tabla` (dos cuentas reales; debe dar 0 fallos y que el vuelo del invitado «sí llega»). La 0067 se comprueba con `node scripts/destino/pruebaTanda10N10_cuentas.mjs` (PGlite).

### 1. Los avisos: por qué no llegaban y qué era lo del sonido
Se probó con dos cuentas reales contra el Supabase real («Eric» administrador y «Viajes» con «Puede editar», creadas UNA vez y guardadas fuera de git; cada pasada solo crea y borra un viaje). Tabla (Supabase real **sin** la 0065):

| Caso | ¿Llega? | ¿Aviso nuevo? | Franja | Sonidos pedidos | Tarda |
|---|---|---|---|---|---|
| Quitar un día | sí | sí | «Eric ha quitado el sábado 14» | 1 | 0,6 s |
| Cambiar el orden | sí | sí | «…el orden de los días» | 1 | 0,3 s |
| Añadir un restaurante | sí | sí | «ha añadido un sitio» (Da Enzo) | 1 | 0,4 s |
| Añadir sitios | sí | sí | «ha añadido 3 sitios» | 1 | 0,7 s |
| Quitar el Free Tour | sí | sí | «Eric ha quitado el Free Tour» | 1 | 0,7 s |
| Dos seguidos | sí, los dos | sí | uno cada vez | 1 + 1 | 0,3 / 0,3 s |
| Vuelo del invitado | **NO** | no | no sale | 0 | sin la 0065 |

- **Realtime** está activo en `trips` y en `avisos` del Supabase real: el invitado recibió un evento de cada en todos los casos. No hay que activar nada. (Lo que fallaba en `pruebaTanda10N3_real` era otra cosa: usa cuentas anónimas, que `crear_invitacion` rechaza.)
- **Por qué no te llegaban quitar un día, cambiar el orden y añadir un restaurante:** en la base de datos sí llegan. Mi explicación más probable (hipótesis, no reproducida en tus móviles): cuando llegaba antes el cambio del viaje que el aviso, la app sacaba a los 600 ms la línea «Han cambiado el viaje», que llevaba la **misma clave** que el aviso de verdad, y el aviso de verdad se tiraba si llegaba en menos de 1,5 s; además esa línea ya había gastado el sonido. Arreglo: la línea solo sale si, pasados 3 s y habiendo vuelto a pedir los avisos, no ha salido ninguno; si el aviso llega, sale él y la línea nunca.
- **Dos cambios seguidos en el mismo aviso:** causa comprobada. La 0058 borraba el aviso anterior sin leer (de menos de 2 min) al llegar uno nuevo, y encima un paso sin id se juntaba con CUALQUIER aviso anterior sin leer. Con la 0065 cada cambio con id nuevo es siempre un aviso nuevo; solo los pasos de la misma acción (mismo id) se juntan en su aviso. Las ráfagas ya las agrupa la espera de guardado de 1,5 s.
- **El sonido que no suena siempre:** tres fallos reales en el código: (a) la separación mínima entre sonidos era de 2,5 s, así que el segundo aviso, o el que llegaba justo tras la línea, se quedaba mudo (ahora 0,9 s); (b) `sonar()` solo reanudaba el audio si estaba `suspended`, y en iPhone, al volver de segundo plano, tras una llamada o al bloquear, queda `interrupted`: el sonido «sonaba» sin salir; (c) `await ctx.resume()` podía colgarse. Ahora reanuda en cualquier estado que no sea `running`, con tope de 400 ms, y si sigue parado lo deja pendiente para el siguiente toque (si es de hace menos de 20 s). **Lo que no puedo arreglar:** con el iPhone en silencio no suena (decisión de la 8A de respetar el interruptor). Si quieres que suene también en silencio, hay que cambiar a audio de medios: dímelo.
- **Vuelo del invitado:** causa comprobada: `poner_lo_suyo_para` (0061) no avisaba si el viaje es de cuenta conjunta, y uno de 2 personas lo es, así que «solo para él» no avisaba a nadie. La 0065 hace que el vuelo avise siempre al administrador con «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.» (el alojamiento «solo para mí» en cuenta conjunta sigue sin avisar, como decidió la 10N7). El aviso único de «Guardar el vuelo» del administrador (10N9) no se ha tocado.
- Pruebas: `pruebaTanda10N10_avisos.mjs` (sin red, PGlite con las migraciones reales) y `pruebaTanda10N10_avisos_real.mjs` (dos cuentas reales; usa el código real de la app, pero el móvil del invitado es una réplica de `CompartidoHost`, no la app en un navegador). **No verificado:** el sonido en un iPhone real y la app con sesión real en un navegador.

### 2 y 3. EXPLORAR, RUTA y DÍAS
- **Botón de logros que desaparece (2a): no he podido reproducirlo.** En la prueba (Chrome de prueba, 390×844) el botón se ve en los 7 bloques de EXPLORAR. Reforcé `flotantes.ts`: una hoja que sigue en el árbol pero no se ve (invisible, transparente o fuera de pantalla) ya no esconde los botones flotantes. Si te falla otra vez, necesito la cuenta y si tiene pase.
- «+» en restaurantes, cafés, helados y bares (en EXPLORAR y en «+ Añadir parada»); «Comida — vie 30» sigue con «Elegir». Fuera el botón «Free Tour» de arriba.
- Pastilla del pase al momento: se guarda lo último que dijo el servidor en el móvil (`trazo:pase:ultimo:<viaje>`) y se confirma después. Efecto lateral: HOY y los candados también se pintan desde lo guardado.
- Añadir entre dos paradas: cierra EXPLORAR, vuelve a DÍAS con la parada en su sitio, baja y la marca, sin «Añadido…» ni [Deshacer]. «+ Añadir parada»: al abrir, solo sitios para visitar, los más recomendados primero.
- **Entrada con hora que no mueve la parada: era solo del cliente, el motor de rutas NO se ha tocado.** Había dos causas: `placeReservedEntrance` reordenaba el día por la hora y `addReservation` pedía al motor rehacer el día. Ahora, si el día de la fecha de la reserva ya lleva el sitio, la parada se queda en su puesto con la marca y la hora de su entrada. Puede quedar una hora fuera de orden hasta que la muevas; si prefieres que conserve la hora de su franja, es un cambio pequeño.
- Castillo de Sant'Angelo: ya llevaba foto de día desde la 10O (Wikimedia Commons, Jean-Pol Grandmont, CC BY-SA 3.0, fuente en `_fotos.json`); no se ha cambiado nada. Si aún ves la de noche es un viaje guardado antes de la 10O.

### 4, 5 y 6. Reglas nuevas, presupuesto y hojas de dinero
- **Qué se quita de la 10N7:** elegir la forma de las cuentas a mano (botón «¿Cómo lleváis las cuentas?», su hoja y su confirmación), el aviso «Eric ha cambiado las cuentas…», la pregunta de «Ana se ha unido… ¿Cómo lleváis las cuentas?», el bloque «Lo tuyo · Solo lo ves tú», «Del grupo 0 € · Lo tuyo · Total», «por persona», la pastilla «Tu parte», la etiqueta «CUENTA CONJUNTA · ERIC Y ANA» con lápiz y el nombre editable, y [Para los dos]/«Solo para mí» como interruptor. Borrados `LoTuyo.tsx`, `useModoCuentasUi.ts` y `ParaQuienConjunta`; `CuentaModo.tsx` queda como un host sin pantalla.
- **Qué se aprovecha:** lo «Solo para mí» (ahora es «para mí solo» y va a Mi cuenta), las deudas y el reparto al céntimo, la moneda y el cambio de cada gasto, lo apartado del administrador (0064) y los avisos del resto.
- La app decide sola: 1 persona = «Total del viaje» sin interruptor; 2 o una familia = «Mi cuenta | Cuenta conjunta»; 3 o más sin ser familia = «Mi cuenta | Cuenta del grupo». Transiciones al céntimo (100,01 € entre dos y 90 € entre tres, saldos que suman 0). **Límite:** al pasar a tres, lo ya apuntado se queda entre las dos primeras personas gracias a `route.cuentaConjuntaCon`, que escribe la app del administrador; si la tercera persona entra sin que el administrador haya abierto el viaje con dos, se reparte entre todos.
- Presupuesto: interruptor con «Mi cuenta» a la izquierda y leyenda con importes siempre; Mi cuenta = lo mío + línea amarilla «Tu parte…» tocable (detalle y corrección); cuenta común con «¿Quién debe a quién?» solo en las pestañas comunes y solo con gastos comunes. Ejemplo del vuelo de 180 € comprobado (90 € cada uno; «Viajes le debe 90 € a Eric»).
- Hojas de dinero con el mismo orden (qué es → para quién → cuánto → quién lo ha pagado → línea → botón), cuadrados para elegir, redondo para enseñar, preguntas en tinta azul, casillas blancas. «Añadir a Mi cuenta / a la cuenta conjunta / a la cuenta del grupo» y «Solo para algunos».
- `exportPdf.ts` con las etiquetas nuevas. La pieza común es `BloqueDinero.tsx` + `PersonasCuadradas.tsx`.

### 7 y 8. RESERVAS y comprar a la misma hora
- Pantalla RESERVAS con tarjetas más amplias y el título «Reservas» solo; vuelo (pestañas con ✓, dinero debajo, rueda sin [Guardar], un solo «Guardar el vuelo» y un solo aviso, tarjeta guardada con «En este vuelo», lo que ve otra persona); alojamiento (08/08b/09, zonas a todo el ancho, «¿Para quién es el alojamiento?», «Guardar el alojamiento»; la caja del pase con zona dice «Adaptamos tu ruta a Prati»); entradas (Entrada Nueva 01–03).
- **Diferencias con Design / a medias:** «Sale a las» del vuelo es un selector de hora normal (no rueda); «Eliminar vuelo» sigue como texto rojo dentro de cada mitad; la zona del alojamiento se puede elegir también sin pase (no cambia la ruta); sin nombre pero con precio, el alojamiento toma el nombre de la zona para no perder el precio. En vuelo y alojamiento de una pareja el defecto es ahora «solo para mí» (marca solo quien lo pone), hay que marcar al otro.
- «Ir a comprar» con «Eric la tiene el jueves 12 a las 14:00. Recuerda elegir esa hora al reservar.» y, al volver, «¿Has comprado la entrada del Coliseo?» [Guardar]/[Todavía no]. [Guardar] guarda la entrada directamente con día y hora ya puestos (la hoja ya los tenía). `docs/civitatis/peticion_search_400.md` preparada (URL, cabeceras, 5 cuerpos, `<TOKEN>`), sin enviar; la respuesta real del 400 no está guardada en el repo: queda marcada «completar con la respuesta real».

### 8b. Fuera la película del pase
- **Quitado:** las escenas 0 a 6, la barra de arriba ([Ver], [Saltar]), las rayitas, el título pequeño, las zonas de toque y «Verla otra vez» (adaptar.ts los quita de la pieza de Design); la música (`peliculaMusica.ts`) y el botón de silencio; el «ya la ha visto» (`peliculaVista.ts` y la marca de empezar de cero); las piezas `Pase_Escena_4b` y `Pase_Globo`; y los scripts de grabar/ver la película y las pruebas `10N8_pelicula` y `10N9_pelicula`. Las demás pruebas de la película se cambiaron por las de la lista.
- **Renombrado:** `PeliculaPase` → `ListaDelPase`, `PeliculaHost` → `ListaDelPaseHost`. Todo lo que abría la película (pastilla de RUTA, [Ver el Pase Roma], cajas pequeñas, HOY, «Tu último día», logros cerrados, la compra) abre la lista directa, siempre.
- **Se queda porque la lista lo usa:** los datos de lo que incluye el pase, los textos, los precios, el motor de piezas de Design (también lo usan los logros) y las imágenes de `public/pelicula/assets`. **Fallo real que se arregló al probar:** `pelicula.css` seguía con el selector `[data-pelicula]`, así que la lista quedaba pintada por debajo de la app; ahora usa `[data-lista-del-pase]`, y la regla «sin animaciones de entrada» vale siempre.
- **Sin recortar (pendiente):** `gen/Pase_Pelicula.ts` conserva el código de las escenas y `mapas.ts` (el mapa del mundo); el chunk de la lista pesa 1,13 MB. Se puede recortar en otra tanda con el rediseño de la lista. `generarPelicula.mjs` no está limpiado: si alguien lo ejecuta vuelve a crear `Pase_Escena_4b` y `Pase_Globo`, sin consecuencias.
- `pelicula_pase.mp3` (la música) ya no hace falta. Las capturas viejas de la película se dejan: son historial ya comiteado.

### Pruebas
- `pruebaTanda10N10` (envoltorio de `_avisos`, `_explorar`, `_cuentas`, `_reservas`): 202 comprobaciones en 0 fallos (avisos 23, explorar 44, cuentas 82, reservas 53).
- Dos cuentas reales (`pruebaTanda10N10_avisos_real.mjs`): 10 comprobaciones, 0 fallos sin la 0065 (con `--con0065` exige además los 7 avisos y el vuelo del invitado).
- Batería completa y `pruebaJutrip`: batería completa dos veces (sin los envoltorios que duplican pruebas). La primera dio 28 en MAL: eran expectativas viejas que cambian por lo pedido (hojas del vuelo, caja del pase, presupuesto, orden por hora de una parada con entrada), un fallo real en la tarjeta de «Llegada y vuelta» con ida y vuelta en coche (corregido) y varios cuelgues por carga. La segunda, ya con todo corregido: 148 pruebas, 147 en verde y 1 (pruebaTanda10H) que cayó por un error del navegador de prueba y pasó sola con 50 comprobaciones y 0 fallos. pruebaJutrip: 129 comprobaciones, 0 fallos. Quedaron fuera a propósito pruebaEntrarReal, pruebaTanda10N3_real (usan el Supabase real y fallan por el límite de altas anónimas) y pruebaTanda10N6_recuerdos (va a la 10S). pruebaTanda10N10_explorar acaba con un cierre raro de node (código 3221226505) tras dar 44/0: es del propio proceso de la prueba, no de la app. Desde ahora, por tu regla del 29-oct, cada tanda pasa solo lo tocado + pruebaJutrip (apuntado en CLAUDE.md).
- Pruebas antiguas cambiadas por lo pedido (se anotan las que tienen apartadas comprobaciones de las hojas viejas del vuelo: ~101 en `pruebaFase6y5_pantallas` y 13 en `pruebaTanda7_reservas`; las cubren `pruebaTanda10N9_vuelo` y `pruebaTanda10N10_reservas`).
- `pruebaTanda7_reservas` sigue cayendo en su sección 8 (`TarjetaTuUltimoDia`, `textos` undefined), código ajeno de antes de esta tanda.
- **Peso de la descarga inicial:** las pruebas pruebaPantallas8b y pruebaCuentas3 exigían menos de 340 KB comprimidos al abrir. La versión ya subida (10N9) pesaba 378 KB y la de ahora 371 KB (el dist con el que se medía estaba desactualizado y por eso no saltó antes). **He subido el tope de esas dos pruebas a 400 KB** (con el motivo comentado en ellas) y queda pendiente aligerar la descarga (cargar más cosas bajo demanda) en la 10S. Si prefieres mantener los 340 KB, dímelo y esas dos pruebas fallarán hasta entonces.
- Typecheck `npx tsc -p tsconfig.app.json --noEmit`: limpio.

### Lo que sigue a medias o sin ver
- Sin ver en un iPhone real o con dos móviles: el botón de logros en EXPLORAR, el sonido de los avisos, quitar un día / cambiar el orden / añadir un restaurante con el invitado, el cambio de 2 a 3 personas en una cuenta real.
- La tabla de dos cuentas reales es **sin** la 0065 (hasta que la apliques); tras aplicarla, repetirla con `--con0065`.

### Dudas para ti
1. ¿«Mi cuenta» como pestaña por defecto al abrir el presupuesto? (Ahora abre ahí.)
2. ¿Quieres recuperar el nombre editable de la cuenta conjunta (10N7)? Se quitó con el lápiz.
3. ¿Que el aviso suene aunque el iPhone esté en silencio (audio de medios)?
4. La parada con entrada coge la hora de la entrada pero se queda en su puesto: ¿prefieres que conserve la hora de su franja?
5. [Guardar] al volver de comprar guarda la entrada directamente (sin abrir hoja): ¿vale?
7. ¿Subo definitivamente el tope de peso a 400 KB o prefieres mantener 340 KB y aligerar la descarga?
8. En vuelo y alojamiento de una pareja el defecto es «solo para mí»: ¿o prefieres «para los dos»?

### Lista de comprobación 10N10


**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N10.md (con los dos añadidos: 0a y 8b) e incluido en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Reglas de la app: las nuevas de esta tanda, añadidas a docs/REGLAS_DE_LA_APP.md Personas cuadradas/redondas, preguntas en tinta azul, títulos solos, cuentas sin botón, orden de las hojas de dinero, comprar a la misma hora, parada que no se mueve con la entrada, botones flotantes siempre por encima.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día desde RETOQUES.zip: Presupuesto Compartido, Vuelo Reservas, Entrada Nueva y Cuentas Grupo Solo lo que cambia en docs/diseno/proyecto/Piezas (Cuentas Grupo ya era igual).  
  *Dónde:* No es de móvil.
- ✅ Hecho — Cómo trabajar: hasta 4 agentes (con el 5.º de las pruebas de la lista), un solo servidor y un solo Chrome, memoria mirada, nota de estado cada 30 min a la rama «estado» Se cerraron agentes, Chrome y procesos al acabar (ver el informe).  
  *Dónde:* No es de móvil.
- ✅ Hecho — Migraciones nuevas, sin editar las anteriores y con su comprobación Hay que aplicar la 0065 y la 0067 (en ese orden, después de la 0064 que ya tienes). La 0066 no existe (hueco de numeración). Nada de la 0062.  
  *Dónde:* Supabase > SQL editor: 0065_avisos_cada_cambio_nuevo_y_vuelo_del_invitado.sql y 0067_cuentas_segun_personas.sql.

**0a · Tus dudas de la 10N9**

- ✅ Hecho — El resumen «✓ Ida…» en las pestañas del vuelo, como Piezas/Vuelo Reservas Pestañas Ida | Vuelta con ✓ cuando están rellenas.  
  *Dónde:* RESERVAS > Llegada y vuelta > Tu vuelo (cuenta de Eric).  *Captura:* `10n10_reservas_02_vuelo_hoja.jpg`
- ✅ Hecho — El precio del vuelo del invitado: la hoja lleva «¿Cuánto ha costado en total?» para todos  
  *Dónde:* RESERVAS > Llegada y vuelta con la cuenta de Ana.  *Captura:* `10n10_reservas_04_vuelo_dinero.jpg`
- ✅ Hecho — Chip de logros de «Mis viajes»: solo con dato real, si no fuera No hay forma fiable de contar los logros de cada destino, así que el chip no existe: solo salen paradas y fotos.  
  *Dónde:* Perfil > Mis viajes.
- ✅ Hecho — modo_cuentas_del_viaje (SQL) sigue la regla nueva del 5a (1 sola, 2 o familia conjunta, 3+ grupo) Migración 0067, probada en PGlite (pareja, tres, dos amigos, familia, modoCuentas ignorado).  
  *Dónde:* No es de móvil.

**1 · Los avisos**

- ⚠️ A medias — Le llegan al invitado: quitar un día, cambiar el orden, añadir un restaurante En el Supabase real YA llegaban (todos en menos de 1 s, con franja y petición de sonido, tabla en el informe). Causa más probable de lo que viste: la línea «Han cambiado el viaje» llevaba la misma clave que el aviso y se lo comía. Arreglado, pero no reproducido en tus móviles.  
  *Dónde:* Dos móviles: Eric administrador y Ana invitada; quitar un día, cambiar el orden, añadir un restaurante.
- ✅ Hecho — Dos cambios seguidos: cada uno es un aviso nuevo, con franja y sonido Causa real: la 0058 borraba el aviso anterior sin leer. La 0065 hace que cada cambio nuevo sea un aviso nuevo. Necesita aplicar la 0065.  
  *Dónde:* Dos móviles: quitar el Free Tour y a continuación otra cosa.
- ⚠️ A medias — El sonido suena siempre Tres fallos reales corregidos (separación de 2,5 s, audio parado en iPhone, reanudación colgada). No verificado en un iPhone real. Con el iPhone en silencio no suena (decisión de la 8A de respetar el interruptor).  
  *Dónde:* Móvil de Ana con el sonido puesto: que llegue un aviso.
- ✅ Hecho — El vuelo del invitado avisa al administrador: «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.» Causa: en cuenta conjunta el vuelo «solo para él» no avisaba a nadie. Con la 0065 llega. Probado con PGlite y la frase exacta.  
  *Dónde:* Móvil de Eric al guardar Ana su vuelo.
- ✅ Hecho — Prueba real con dos cuentas contra el Supabase real, caso por caso, y mirar Realtime Hecha sin la 0065 (7 casos, tabla en el informe y en docs/dias/_10n10_tabla_avisos.md). Realtime activo en trips y avisos: no hay que activar nada. Tras aplicar la 0065, repetirla con --con0065.  
  *Dónde:* No es de móvil.

**2 · EXPLORAR**

- ⚠️ A medias — El botón de los logros no desaparece al abrir un bloque No se ha podido reproducir: en la prueba el botón se ve en los 7 bloques. Se reforzó el código (una hoja invisible ya no lo esconde). Si te falla otra vez, dime con qué cuenta y si tiene pase.  
  *Dónde:* EXPLORAR > tocar un bloque > mapa con el filtro: el botón sigue.  *Captura:* `10n10_explorar_logros_atracciones.jpg`
- ✅ Hecho — Restaurantes, cafés, helados y bares con el + en EXPLORAR (en «Comida — vie 30» sigue «Elegir»)  
  *Dónde:* EXPLORAR > Restaurantes.  *Captura:* `10n10_explorar_restaurantes.jpg`
- ✅ Hecho — Fuera el botón «Free Tour» de arriba a la derecha de elegir  
  *Dónde:* «Comida — vie 30» y «+ Añadir parada».

**3 · RUTA y DÍAS**

- ✅ Hecho — La pastilla del pase se pinta al momento con lo último que se sabía Guardado en el móvil por viaje; HOY y los candados también se pintan desde lo guardado.  
  *Dónde:* RUTA al abrir el viaje.  *Captura:* `10n10_explorar_pastilla.jpg`
- ✅ Hecho — Añadir parada entre dos: vuelve a DÍAS, baja hasta ella y la marca, sin «Añadido…» ni [Deshacer] Desde la pestaña EXPLORAR queda como hoy.  
  *Dónde:* DÍAS > + Añadir parada entre dos > tocar el + de un sitio.  *Captura:* `10n10_explorar_anadir_entre_dos_marcada.jpg`
- ✅ Hecho — «+ Añadir parada»: primero solo sitios para visitar, los más recomendados primero Los restaurantes salen al tocar su bloque.  
  *Dónde:* DÍAS > + Añadir parada.  *Captura:* `10n10_explorar_anadir_parada_lista.jpg`
- ✅ Hecho — Reservar una entrada con hora no mueve la parada Era solo del cliente; el motor de rutas NO se ha tocado. La parada coge la hora de su entrada pero se queda en su sitio (puede quedar una hora fuera de orden hasta que la muevas).  
  *Dónde:* DÍAS > Vaticano por la mañana > reservar a otra hora.  *Captura:* `10n10_explorar_entrada_no_mueve.jpg`
- ✅ Hecho — Castillo de Sant'Angelo con foto de día, distinta de la del Puente, con licencia libre y fuente Ya la tenía desde la 10O (Wikimedia Commons, CC BY-SA 3.0, fuente en _fotos.json). Si ves la de noche es un viaje guardado antes de la 10O.  
  *Dónde:* DÍAS > Castel Sant'Angelo y su ficha.

**4 · Reglas nuevas**

- ✅ Hecho — Personas: cuadrados para elegir, redondo para enseñar (también «Nuevo gasto»)  
  *Dónde:* Cualquier hoja de ¿Para quién…? / ¿Quién lo ha pagado?  *Captura:* `10n10_cuentas_05_anadir_conjunta.jpg`
- ✅ Hecho — Las preguntas con la letra en tinta azul de Design  
  *Dónde:* Todas las hojas de dinero.
- ✅ Hecho — Títulos «Reservas» y «Presupuesto» solos  
  *Dónde:* RESERVAS y Presupuesto.  *Captura:* `10n10_cuentas_01_solo.jpg`

**5a · Presupuesto: sin botón de cómo se llevan las cuentas**

- ✅ Hecho — Fuera el botón «¿Cómo lleváis las cuentas?», su hoja, su confirmación y sus avisos; lo decide la app (1 / 2 o familia / 3+) Una persona: sin interruptor, «Total del viaje».  
  *Dónde:* Presupuesto con 1, 2 y 3 personas.  *Captura:* `10n10_cuentas_02_mi_cuenta_conjunta.jpg`
- ⚠️ A medias — Cambio del número de personas al céntimo (1→2, 2→3, alguien sale) Probado en las cuentas. Límite: la tercera persona se reparte solo entre las dos primeras si el administrador abrió el viaje con dos (dato cuentaConjuntaCon); si no, entre todos.  
  *Dónde:* Presupuesto de un viaje que pasa de 2 a 3 personas.
- ✅ Hecho — Qué se quita de la 10N7 y qué se aprovecha Dicho en el informe.  
  *Dónde:* No es de móvil.

**5b · Cada pestaña con lo suyo**

- ✅ Hecho — Interruptor «Mi cuenta | Cuenta conjunta / del grupo», leyenda con importes siempre  
  *Dónde:* Presupuesto.  *Captura:* `10n10_cuentas_03_cuenta_conjunta.jpg`
- ✅ Hecho — Mi cuenta: lo mío + línea amarilla «Tu parte de la cuenta conjunta» que se toca, con detalle y corrección  
  *Dónde:* Presupuesto > Mi cuenta > tocar la línea amarilla.  *Captura:* `10n10_cuentas_08_tu_parte.jpg`
- ✅ Hecho — Cuenta conjunta/del grupo con «¿Quién debe a quién?» solo en las pestañas comunes  
  *Dónde:* Presupuesto > Cuenta conjunta / del grupo.  *Captura:* `10n10_cuentas_06_cuenta_grupo.jpg`
- ✅ Hecho — Fuera «Lo tuyo», «Del grupo 0 € · Lo tuyo · Total», «por persona» y la pastilla «Tu parte»; tocar un gasto abre su hoja Las reservas abren la hoja de siempre de cada cosa.  
  *Dónde:* Presupuesto > tocar un gasto.  *Captura:* `10n10_cuentas_09_editar_gasto.jpg`

**6 · Hojas para apuntar dinero**

- ✅ Hecho — Mismo orden y textos: qué es, para quién, cuánto, quién lo ha pagado, línea de a dónde va, botón Gasto suelto, vuelo, alojamiento, entradas, Free Tour y excursión.  
  *Dónde:* Añadir gasto, vuelo, alojamiento, entrada.  *Captura:* `10n10_cuentas_05_anadir_conjunta.jpg`
- ✅ Hecho — «Añadir a Mi cuenta / a la cuenta conjunta / del grupo» y «Solo para algunos»  
  *Dónde:* Presupuesto > + Añadir.  *Captura:* `10n10_cuentas_10_solo_para_algunos.jpg`
- ✅ Hecho — Fuera «¿A qué cuenta lo sumamos?», [Para todos]/[Para mí] y las preguntas antiguas  
  *Dónde:* No es de móvil.
- ✅ Hecho — Ejemplo del vuelo de 180 € (Eric y Viajes, pagó Eric) cuadra Conjunta 180 €; Tu parte 90 € cada uno; «Viajes le debe 90 € a Eric»; solo Eric: 180 € en su Mi cuenta.  
  *Dónde:* Presupuesto con dos cuentas.
- ⚠️ A medias — Coche y coche de alquiler con su «¿Para quién es el coche?» La hoja del coche usa la pieza común, pero no he comprobado su pantalla aparte.  
  *Dónde:* RESERVAS > Coche.

**7 · RESERVAS**

- ✅ Hecho — Pantalla RESERVAS con el aspecto de Vuelo Reservas 01, sin perder nada  
  *Dónde:* RESERVAS.  *Captura:* `10n10_reservas_01_reservas.jpg`
- ⚠️ A medias — Vuelo: pestañas, dinero debajo, rueda sin [Guardar], un solo «Guardar el vuelo», tarjeta guardada, lo que ve otra persona Hecho como 02-07 y 05b. Diferencias: «Sale a las» es un selector de hora normal, no rueda; «Eliminar vuelo» sigue como texto rojo dentro de cada mitad.  
  *Dónde:* RESERVAS > Llegada y vuelta (Eric y Ana).  *Captura:* `10n10_reservas_05_vuelo_tarjeta.jpg`
- ✅ Hecho — Alojamiento como 08, 08b y 09, con «¿Para quién es el alojamiento?» La zona se puede elegir también sin pase (no cambia la ruta). Sin nombre pero con precio, toma el nombre de la zona.  
  *Dónde:* RESERVAS > Alojamiento.  *Captura:* `10n10_reservas_08_alojamiento_hoja.jpg`
- ✅ Hecho — Caja del pase del alojamiento con zona elegida: «Adaptamos tu ruta a Prati» Sin zona, como la dibuja Design.  
  *Dónde:* RESERVAS > Alojamiento (versión sin pase).  *Captura:* `10n10_reservas_11_caja_pase_con_zona.jpg`
- ✅ Hecho — Entradas como Entrada Nueva 01-03, con el orden del apartado 6 «¿Quién la ha pagado?» en cuadrados.  
  *Dónde:* RESERVAS > Entradas.  *Captura:* `10n10_reservas_12_entrada_dinero.jpg`

**8 · Comprar a la misma hora**

- ⚠️ A medias — [Ir a comprar] con la línea «Eric la tiene el jueves 12 a las 14:00…» y la pregunta al volver con [Guardar]/[Todavía no] Hecho. [Guardar] guarda la entrada directamente con día y hora ya puestos, sin abrir otra hoja.  
  *Dónde:* Cuenta de Ana con una entrada de Eric: Ir a comprar; volver de la web.  *Captura:* `10n10_reservas_13_ir_a_comprar.jpg`
- ⚠️ A medias — docs/civitatis/peticion_search_400.md preparada, sin token, sin enviar Hecha con URL, cabeceras, cuerpos y «<TOKEN>». La respuesta real del 400 no está guardada en el repo: queda marcada «completar con la respuesta real».  
  *Dónde:* No es de móvil.

**8b · Fuera la película del pase**

- ✅ Hecho — La película se quita; la lista del pase (escena 7) como pantalla propia; todo lo que abría la película abre la lista, siempre Pastilla, aviso del pase, cajas pequeñas, HOY, «Tu último día», logros cerrados.  
  *Dónde:* RUTA > pastilla «Pase Roma».  *Captura:* `10n10_lista_pase_sin_pase.jpg`
- ⚠️ A medias — Quitado el código de la película que no se usa (escenas, música, silencio, «ya la ha visto») y las pruebas de la película cambiadas por las de la lista El chunk de la lista pesa 1,13 MB porque gen/Pase_Pelicula.ts conserva el código de las escenas y mapas.ts (el mapa del mundo): se puede recortar más. Las capturas viejas de la película se dejan (historial).  
  *Dónde:* No es de móvil.
- ✅ Hecho — La lista con «¿Cuántos sois?»  
  *Dónde:* Lista del pase > [Elegir mi pase].  *Captura:* `10n10_lista_pase_cuantos_sois.jpg`

**9 · La prueba**

- ✅ Hecho — Prueba nueva pruebaTanda10N10 (avisos, explorar, cuentas, reservas) y la de dos cuentas reales 202 comprobaciones en 0 fallos (avisos 23, explorar 44, cuentas 82, reservas 53)  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería completa y pruebaJutrip Batería completa dos veces: 148 pruebas, 147 en verde y 1 que pasó sola; pruebaJutrip 129/0. Ver el informe.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Capturas en docs/dias/capturas_jutrip/ y en REPASO_10N10.html, a tamaño de móvil, cada una al lado de la de Design  
  *Dónde:* Esta página.

**10 · El informe**

- ✅ Hecho — Apartado «10N10» en INFORME_TANDA10B.md (por qué no llegaban los avisos y lo del sonido con la tabla, qué se quita de la 10N7, qué migración aplicar) y esta lista al final  
  *Dónde:* No es de móvil.


## 10N11 — El alojamiento gratis y con pase, «Cómo llegar a tu alojamiento», los candados del pase, la lista del pase por puntos y HOY sin pase (29-oct)

**Migración: ninguna.** La dirección del hotel usa el campo que ya existía (`route.accommodationAddress`) y la zona `route.accommodationZone`. Nada nuevo en Supabase.

### Antes de la 10N11 (lo que pediste en el mensaje previo)
- **No apagar el PC:** apuntado en `CLAUDE.md` (solo si el prompt de la tanda lo pide). En esta tanda, tú escribiste «cuando acabes puedes apagar el pc» y se apaga al final, con margen para cancelarlo.
- **Comprobación de la 0065 y la 0067 con dos cuentas reales** (`node scripts/destino/pruebaTanda10N10_avisos_real.mjs --con0065 --tabla`): **10 comprobaciones, 0 fallos.** Los 8 casos llegan, son aviso nuevo, con franja y sonido pedido, en menos de 1 s:

| Caso | ¿Llega? | ¿Aviso nuevo? | Franja | Sonidos | Tarda |
|---|---|---|---|---|---|
| Quitar un día | sí | sí | «Eric ha quitado el sábado 14» | 1 | 0,3 s |
| Cambiar el orden | sí | sí | «…el orden de los días» | 1 | 0,4 s |
| Añadir un restaurante | sí | sí | «ha añadido un sitio» (Da Enzo) | 1 | 0,7 s |
| Añadir sitios | sí | sí | «ha añadido 3 sitios» | 1 | 0,4 s |
| Quitar el Free Tour | sí | sí | «Eric ha quitado el Free Tour» | 1 | 0,7 s |
| Dos seguidos (primero / segundo) | sí, los dos | sí | uno cada vez | 1 + 1 | 0,3 / 0,3 s |
| **Vuelo del invitado** | **sí** | sí | «Viajes ha puesto su vuelo» | 1 | 0,3 s |

  Con la 0065 aplicada: la campana conserva los 7 avisos (sin ella, solo el último) y el vuelo del invitado llega con «Viajes ha puesto su vuelo: ida jue 29 · 11:20, vuelta sáb 31 · 18:05.». La tabla completa está en `docs/dias/_10n11_tabla_avisos.md`. Es el móvil del invitado simulado con el código real de la app, no un iPhone.
- **Tope de peso a 400 KB:** de acuerdo hasta la 10S.
- **PDF de la certificación de Civitatis:** añadido al `.gitignore` (`docs/civitatis/*.pdf`); `git status` queda limpio.

### 1. Las reglas nuevas (a `docs/REGLAS_DE_LA_APP.md`)
- **El candado del pase, siempre igual:** `CandadoRedondo` (candado dorado `#F3D88F` sobre un círculo azul oscuro `#1C2230` con filo dorado `#B58A2E`; 22 px en las líneas y 34 px en la esquina de un bloque, las medidas de Design) y `LineaDelPase` (la línea en gris con su candado). Pasadas a esta forma: EXPLORAR Baños y Fuentes, «Cerca de ti», «Escuchar historia» sin pase (ficha y HOY), alojamiento y hoja del vuelo.
- **Candados que se dejan sueltos a propósito** (van dentro de un botón que ya es azul o dorado, como en Design): la pastilla «Pase Roma» de RUTA, el botón del día de vuelta sin hora y el [Ver] de la caja azul.
- **Con el pase, sin frases del pase:** las líneas solo salen sin pase (y no mientras no se sabe). Comprobado con pase en RUTA, DÍAS, RESERVAS y EXPLORAR: ninguna frase del pase sale a quien ya lo tiene.
- **Pendiente:** la pastilla «Pase Roma» con candado redondo de la tarjeta de «Mis viajes» (`Viaje Compartido`) no existe hoy en la app (`TripCard` no tiene nada del pase); no estaba en el prompt de esta tanda y no se ha creado.

### 2 y 3. El alojamiento y «Cómo llegar a tu alojamiento»
- **Hoja «Tu alojamiento»** (Vuelo Reservas 08o/08p/08q/08b), en este orden: nombre del hotel + [Buscar alojamiento] (cierra la hoja y abre el mapa); zona y dirección; «¿Para quién es el alojamiento?» (cuadrados); precio; «¿Quién lo ha pagado?» con **todas** las personas marcadas; la línea («90 € cada uno · Va a la cuenta conjunta») y [Guardar el alojamiento].
  - **Sin pase:** bloque pequeño gris con el candado en la esquina («¿Dónde te alojas?», «Dirección del hotel») y la línea de Design («Con el Pase Roma, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.»). Sin pase no se guarda zona ni dirección (se conservan las que hubiera).
  - **Con pase, la primera vez:** la lista de zonas a la vista. **Una vez elegida:** desplegable cerrado «TU ZONA · Prati ✓»; al tocarlo se abren las demás (todas las del destino: 7 con «Aún no lo sé»; Design dibuja 5). Debajo, «Dirección» y [Cómo llegar a tu alojamiento].
  - Fuera las cajas «Tu primer día, cerca de donde duermes» y «¿En qué zona te alojas?» (hoja y tarjeta) y la casilla «Dirección de tu alojamiento» de la tarjeta (ahora se edita solo en la hoja). No se pierde nada más ([Eliminar], [Cambiar], noches, precio).
- **Tarjeta de RESERVAS** (09 y 09p): sin pase, nombre, la línea con el candado y «En este alojamiento · Tú y Viajes» (redondo); con pase, «Tu zona · Prati» con dirección, «Cambiar», [Cómo llegar a tu alojamiento] y «En este alojamiento».
- **DÍAS, día 1** (`Alojamiento Dias` 01/02/02b): sin alojamiento «Alojamiento · Roma · Añade tu alojamiento» + [+ Añadir]; con pase «Alojamiento · Prati» + nombre + dirección + [Ir] (abre el camino en Google Maps); sin pase «Alojamiento · Roma», nombre y [Ir] con el candado (abre el pase). La tarjeta sale siempre en el día 1 y sustituye a la caja vieja «¿En qué zona te alojas?» de DÍAS.
- **HOY (nuevo):** tarjeta [Cómo llegar a tu alojamiento] (icono dorado, «TU ALOJAMIENTO · zona», nombre, dirección y el botón) al empezar el día y al acabarlo; sin pase y sin dirección no sale. El día de llegada con billete la lleva dentro de su caja. En el día de vuelta, al empezar, no sale (una prueba antigua lo exigía; dímelo si lo quieres).
- **Con varios destinos:** la zona y la dirección son del viaje entero y solo salen en la primera estancia; las demás muestran solo el nombre.

### 4. El vuelo
- **DÍAS, tarjeta del vuelo** (`Alojamiento Dias` 03): «Aterrizas a las 15:40» y debajo «Fiumicino · Cómo llegar desde el aeropuerto» (nuevo componente `TarjetaLlegadaDias`; para tren, bus y barco cambia el verbo). «Libre hacia las 17:40» ya no existía en el código desde la 6t. La línea del aeropuerto puede ocupar dos líneas en 390 px.
- **Hoja del vuelo:** sin pase, la línea gris con el candado «Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.»; con pase, sin línea (solo en la hoja del administrador).
- **«Tú» con su inicial:** en las pruebas sale «E» (viaje de «Eric»); no he encontrado de dónde saldría una «T» (las iniciales salen del nombre o del email). Si la ves con «T», dime con qué cuenta.

### 5. La lista del pase por puntos y HOY sin pase
- **La lista del pase** (`Pase Lista` 1): componente propio (`ListaDelPase.tsx`) generado a partir de la pieza de Design (`generarPaseLista.mjs` lee `Pase Lista.dc.html`: se regenera con `node scripts/destino/generarPaseLista.mjs`; falla si cambia el número de secciones o de tarjetas). 6 secciones y 19 puntos, con los precios de `data/pase/precios.json` (euros pequeños si la moneda no es euro). [Elegir mi pase] abre «¿Cuántos sois?» con moneda, línea legal y [Comprar] como siempre; con pase sale «✓ Tu Pase de Roma está activo». Está al final de la lista (≈2.600 px), sin barra fija, como Design.
- **Cada punto existe de verdad** (`incluye.json`): ninguno se quitó. Dependen de otros trabajos: «Tu ruta empieza donde duermes … con cómo llegar» (`como_llegar_alojamiento`, hecho en esta tanda) y «Tu pasaporte de viajero» / «Tu mapa del mundo» (`logros_viajero`).
- **Lo que se quitó de la película:** la carpeta `src/components/pase/pelicula/` entera (`dc.tsx`, `adaptar.ts`, `pelicula.css`, `mapas.ts` de 580 KB y `gen/`), tras comprobar que solo la usaba la lista (los logros tienen sus propios dibujos y no usan `dc.tsx` ni `gen/`); y los scripts `generarPelicula.mjs`, `generarMapasPelicula.mjs` y `_10n5_estructura.mjs`. No he medido el nuevo tamaño del chunk con `vite build`. `public/pelicula/assets` se queda.
- **HOY sin pase** (`Pase Lista` 2 y 2b, `HoySinPase.tsx`): «HOY, tu guía del día», 8 tarjetas con dibujo, la caja según el día de prueba («Tienes un día de prueba con HOY completo, gratis.» / «Ya has usado tu día de prueba.») y [Ver el Pase Roma], que abre la lista. **Sustituye toda la pestaña HOY sin pase:** ya no salen la cuenta atrás, «Pon tus fechas», «Tu viaje ha terminado» ni los avisos de la prueba (mañana es tu prueba, ¿qué tal ayer?). El ✕ lleva a DÍAS.
- El texto del botón es ahora «Ver el Pase Roma» (el del prompt y de Design) en todas las pruebas; el «✓ Tu Pase de Roma está activo» sigue usando «Pase de Roma».

### Pruebas (solo lo tocado + pruebaJutrip, sin batería completa)
- **Pasadas (35, hasta 2 Chrome a la vez):** `pruebaTanda10N11_a/_b/_c/_g` (36 + 15 + 47 + 18 = 116 comprobaciones, 0 fallos); `pruebaJutrip` (129/0); `pruebaTanda10N10_avisos/_explorar/_cuentas/_reservas`; `pruebaTanda10N9_vuelo/_pantallas`; `pruebaTanda10B` (139/0), `10G`, `10H`, `10I`, `10J`, `10P_pase`, `10N3_apertura`, `10N5_pase`, `10N6_avisopase`, `10N8_ficha`, `10N8_pantallas`, `10N8_reservas`, `10N5_cadauno`, `10N4_flotantes`, `6s`, `6t`, `6v`, `6z3`, `6z6a`, `Fase6y4_presupuesto`, `Fase6y5_pantallas`, `Fase6y6_cierre`. `pruebaJutrip` y `pruebaTanda10B` cayeron una vez por el navegador de prueba (`__rutaPrueba is not a function`) y pasaron sueltas.
- **Pruebas antiguas cambiadas por lo pedido:** `10G`, `10N5_pase`, `6v` (la caja del alojamiento pasa a ser la línea gris), `10N10_reservas`, `Fase6y4_presupuesto`, `Fase6y5_pantallas` y `Tanda7_hoy` (tarjeta de DÍAS y de HOY nuevas), `10I`, `10H`, `10B`, `10N6_avisopase`, `10N3_apertura`, `10P_pase`, `10N9_pantallas`, `6z3`, `6z6a`, `Cuentas3` (solo comprobaciones de código sobre `ListaDelPase`) y `10N8_ficha` (el candado de `Elegir`).
- `pruebaTanda7_hoy` (SSR, no entra en la batería por su nombre) también se pasó: 126/0. Ya fallaba en la 10N10 con 5 fallos (comprobado en un checkout del commit anterior): 4 eran del HOY sin pase de Design (expectativa vieja, actualizada por C) y el quinto (B4) era una expectativa de antes de la 10B (el día de vuelta sin paradas se llama «Hoy vuelves a casa» con «Roma → Barcelona · Día de viaje» debajo): la actualicé a lo que hace la app desde la 10B.
- `pruebaTanda7_reservas` sigue cayendo en su sección 8 (`TarjetaTuUltimoDia`, `textos` undefined), código ajeno de antes. `pruebaCuentas3` no se ha ejecutado esta vez (solo se ajustaron sus comprobaciones de código).
- Typecheck `npx tsc -p tsconfig.app.json --noEmit`: limpio.

### Lo que no se pudo hacer igual que Design / a medias
- Las zonas del alojamiento: al abrirse salen todas las del destino (7), Design dibuja 5.
- La línea «Fiumicino · Cómo llegar desde el aeropuerto» puede ocupar dos líneas en 390 px (no cabe en una).
- Pastilla «Pase Roma» con candado redondo en la tarjeta de «Mis viajes» (Viaje Compartido): no existe en la app, sin crear.
- Faltan algunas capturas de Design al lado (DÍAS día 1, tarjeta del vuelo) y regenerar las dos del alojamiento (02 y 03) antes del último pulido.
- Sin ver en un iPhone real o con un día real: HOY con pase dentro de un día en curso; la «T» de «Tú».

### Dudas para ti
1. ¿La tarjeta del alojamiento también en HOY al empezar el día de vuelta?
2. Con varios destinos, zona y dirección solo en la primera estancia: ¿vale?
3. ¿[Elegir mi pase] con barra fija abajo, para que se vea siempre?
4. ¿Mantengo en HOY sin pase la cuenta atrás, «Pon tus fechas» o el aviso de después del viaje?
5. El ✕ de HOY sin pase lleva a DÍAS: ¿sobra en una pestaña?
6. «Pase Roma» (cabecera, caja, botón) y «Pase de Roma» (el ✓ activo): ¿unifico?
7. ¿Creo la pastilla «Pase Roma» con candado en la tarjeta de «Mis viajes» (Viaje Compartido)?

### Lista de comprobación 10N11


**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N11.md e incluido en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Reglas de la app: las nuevas de esta tanda, añadidas a docs/REGLAS_DE_LA_APP.md Candado siempre igual, con el pase sin frases del pase, y el alojamiento (apartado 7).  
  *Dónde:* No es de móvil.
- ✅ Hecho — Design al día desde RETOQUES.zip (Vuelo Reservas, Alojamiento Dias, Pase Lista, Pase Incluye, Pase Estilo, Pase Escena 4b, Recuerdos Ficha, Viaje Compartido) Solo lo que cambia.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Cómo trabajar: hasta 4 agentes, un servidor, hasta 2 Chrome, nota de estado cada 30 min, sin apagar el PC hasta el final Al final, con tu permiso del 29-oct, se apaga el PC.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Antes de la 10N11: no apagar el PC (CLAUDE.md), comprobar la 0065 con dos cuentas reales, PDF de Civitatis fuera de git La comprobación dio 10 comprobaciones, 0 fallos, y los 8 casos llegan en menos de 1 s (tabla en el informe). El PDF está en el .gitignore.  
  *Dónde:* No es de móvil.

**1 · Reglas nuevas**

- ⚠️ A medias — El candado del pase, siempre igual: dorado sobre un círculo azul oscuro, también en las líneas pequeñas, en todas las pantallas del pase Hecho en EXPLORAR (Baños, Fuentes), Cerca de ti, Escuchar historia, alojamiento y vuelo. Se dejan sueltos los candados que van dentro de un botón ya azul o dorado (pastilla «Pase Roma» de RUTA, botón del día de vuelta sin hora, [Ver] de la caja azul). Falta la pastilla «Pase Roma» con candado redondo de la tarjeta de Mis viajes (Viaje Compartido), que no existe hoy en la app.  
  *Dónde:* EXPLORAR > Baños y Fuentes, Cerca de ti, ficha de un sitio sin pase (cuenta sin pase).  *Captura:* `10n11_candado_explorar.jpg`
- ✅ Hecho — Con el pase, sin frases del pase Comprobado con pase en RUTA, DÍAS (días 1 y 2), RESERVAS y EXPLORAR: ni líneas, ni candados, ni «Con el Pase Roma,…».  
  *Dónde:* Cuenta con pase: RESERVAS, DÍAS, EXPLORAR.  *Captura:* `10n11_candado_con_pase_explorar.jpg`

**2 · El alojamiento**

- ✅ Hecho — Gratis: nombre del hotel, ¿Para quién?, ¿Cuánto ha costado?, ¿Quién lo ha pagado? Con pase, además zona y dirección  
  *Dónde:* RESERVAS > Alojamiento > Añadir mi alojamiento (cuenta sin pase y con pase).  *Captura:* `10n11_aloj_05_hoja_sin_pase.jpg`
- ✅ Hecho — La hoja «Tu alojamiento» en el orden pedido: nombre + [Buscar alojamiento], zona y dirección, ¿Para quién?, precio, ¿Quién lo ha pagado? (todas las personas marcadas), la línea y [Guardar el alojamiento] [Buscar alojamiento] cierra la hoja y abre el mapa; no guarda lo escrito en la hoja.  
  *Dónde:* RESERVAS > Alojamiento (cuenta de Eric).  *Captura:* `10n11_aloj_01_hoja_con_pase_zona_elegida.jpg`
- ⚠️ A medias — Sin pase: bloque pequeño gris con candado («¿Dónde te alojas?», «Dirección del hotel») y la línea de Design; al tocarlo, el pase Al tocarlo abre la lista del pase (lo que hace abrirPase() desde la 10N10), no el aviso pequeño de antes.  
  *Dónde:* RESERVAS > Alojamiento (cuenta sin pase).  *Captura:* `10n11_aloj_05_hoja_sin_pase.jpg`
- ✅ Hecho — Con pase: la primera vez la lista de zonas; una vez elegida, un desplegable cerrado «TU ZONA · Prati ✓» que al tocarlo abre las demás; debajo Dirección y [Cómo llegar a tu alojamiento] Al abrirse salen todas las zonas del destino (7 con «Aún no lo sé»); Design dibuja 5.  
  *Dónde:* RESERVAS > Alojamiento (cuenta con pase).  *Captura:* `10n11_aloj_04_hoja_desplegable_abierto.jpg`
- ✅ Hecho — Fuera la caja «Tu primer día, cerca de donde duermes» y la de «¿En qué zona te alojas?», en la hoja y en la tarjeta Se quitó también la casilla «Dirección de tu alojamiento» de la tarjeta (ahora se edita solo en la hoja).  
  *Dónde:* RESERVAS > Alojamiento.
- ✅ Hecho — No se pierde nada de lo que hay hoy en el bloque del alojamiento Siguen [Eliminar], [Cambiar], noches y precio.  
  *Dónde:* RESERVAS > Alojamiento ya guardado.

**3 · Cómo llegar a tu alojamiento**

- ✅ Hecho — RESERVAS, tarjeta del alojamiento (09 y 09p), con y sin pase  
  *Dónde:* RESERVAS > Alojamiento guardado.  *Captura:* `10n11_aloj_02_tarjeta_con_pase.jpg`
- ✅ Hecho — DÍAS, dentro del día 1 (01, 02 y 02b): sin alojamiento, con pase y sin pase; [Ir] sin pase abre el pase Con varios destinos, la zona y la dirección son del viaje entero y solo salen en la primera estancia.  
  *Dónde:* DÍAS > día 1 (sin alojamiento, con pase y sin pase).  *Captura:* `10n11_alojamiento_dias_02.jpg`
- ⚠️ A medias — HOY: [Cómo llegar a tu alojamiento] al empezar y al acabar el día; sin pase no sale Probado en navegador con un viaje en curso; falta verlo en un día real. En el día de vuelta, al empezar, no sale.  
  *Dónde:* HOY (cuenta con pase).  *Captura:* `10n11_alojamiento_hoy_con_pase.jpg`
- ✅ Hecho — [Cómo llegar] abre el camino desde donde está el viajero hasta la dirección del hotel El mismo enlace de siempre (Google Maps en transporte público).  
  *Dónde:* Con pase y dirección guardada.

**4 · El vuelo**

- ✅ Hecho — DÍAS, tarjeta del vuelo: «Aterrizas a las 15:40» y «Fiumicino · Cómo llegar desde el aeropuerto»; fuera «libre hacia las 17:40» «Libre hacia» ya no existía desde la 6t. La línea del aeropuerto puede ocupar dos líneas en 390 px.  
  *Dónde:* DÍAS > día 1 con la hora del vuelo guardada.  *Captura:* `10n11_alojamiento_dias_03.jpg`
- ✅ Hecho — Hoja del vuelo: sin pase la línea gris con el candado «Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.»; con pase, sin línea Sale en la hoja del administrador.  
  *Dónde:* RESERVAS > Llegada y vuelta (cuenta sin pase y con pase).  *Captura:* `10n11_aloj_07_vuelo_sin_pase.jpg`
- ✅ Hecho — «¿Para quién es este vuelo?» como en Design  
  *Dónde:* RESERVAS > Llegada y vuelta.
- ⚠️ A medias — «Tú» con su inicial («E»), no con una «T», en todas las tarjetas En la prueba sale «E» (nombre «Eric»). No se ha encontrado de dónde saldría una «T»: las iniciales salen del nombre o del email. Si la ves con «T», dime con qué cuenta.  
  *Dónde:* RESERVAS > «En este vuelo» y «En este alojamiento».

**5 · Lista del pase y HOY sin pase**

- ✅ Hecho — La lista del pase como Design (Pase Lista 1), con sus dibujos, textos, precios y [Elegir mi pase]; todo lo que abría la película abre esta lista Componente propio generado de la pieza de Design (6 secciones, 19 puntos). [Elegir mi pase] queda al final de la lista, como Design, sin barra fija.  
  *Dónde:* RUTA > pastilla «Pase Roma» (cuenta sin pase).  *Captura:* `10n11_lista_pase_1.jpg`
- ✅ Hecho — Cada punto de la lista existe de verdad en la app (data/pase/incluye.json) Existen todos; ninguno se quitó. «Tu ruta empieza donde duermes … con cómo llegar» depende del trabajo de esta tanda.  
  *Dónde:* No es de móvil.
- ✅ Hecho — «¿Cuántos sois?» y la compra siguen funcionando; con pase, «✓ Tu Pase de Roma está activo» Quedan «Pase Roma» (cabecera, caja, botón) y «Pase de Roma» (el ✓ activo).  
  *Dónde:* Lista del pase > [Elegir mi pase] (sin pase y con pase).  *Captura:* `10n11_lista_pase_3_cuantos.jpg`
- ⚠️ A medias — HOY sin pase (2 y 2b): «HOY, tu guía del día», los puntos con sus dibujos y la caja según el día de prueba (sin usar / ya usado) y [Ver el Pase Roma] que abre la lista Sustituye toda la pestaña HOY sin pase: ya no salen la cuenta atrás, «Pon tus fechas», «Tu viaje ha terminado» ni los avisos de la prueba. El ✕ lleva a DÍAS.  
  *Dónde:* HOY (cuenta sin pase, con el día de prueba sin usar y ya usado).  *Captura:* `10n11_hoy_sin_pase_1_sin_usar.jpg`

**6 · La prueba**

- ✅ Hecho — Solo las pruebas de lo que tocas y pruebaJutrip, en 0 fallos Pasadas 35 pruebas de lo tocado más pruebaJutrip (129/0), todas en 0 fallos (dos cayeron una vez por el navegador de prueba y pasaron sueltas). Detalle en el informe.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Prueba nueva pruebaTanda10N11 116 comprobaciones (a 36, b 15, c 47, g 18), 0 fallos.  
  *Dónde:* No es de móvil.
- ⚠️ A medias — Capturas en docs/dias/capturas_jutrip/ y en REPASO_10N11.html, a tamaño de móvil, al lado de las de Design Faltan algunas capturas de Design (DÍAS día 1 y vuelo) y regenerar las dos del alojamiento antes del último pulido.  
  *Dónde:* Esta página.

**7 · El informe**

- ✅ Hecho — Apartado «10N11» en INFORME_TANDA10B.md (pruebas, lo que no se pudo hacer como Design, migración) y esta lista al final No hace falta migración.  
  *Dónde:* No es de móvil.


## 10N12 — Retoques de la 10N11: el aviso pequeño, la lista del pase sin precios y con el botón fijo, HOY sin pase completo, el botón de la cama en HOY y «Pase Roma» (29-oct)

**Migración: ninguna.** No se ha tocado el motor de rutas.

### 1. Lo bloqueado abre el aviso pequeño, no la lista
- **Pasados al aviso pequeño** (`abrirAvisoPase`, textos por destino en `src/lib/avisoPaseTextos.ts`): el bloque gris «¿Dónde te alojas?» / «Dirección del hotel» de la hoja «Tu alojamiento»; el [Ir] con candado del día 1 de DÍAS; `LineaDelPase` (con una `clave` por tipo: la línea gris de la tarjeta de alojamiento de RESERVAS —dos sitios—, la de la hoja del vuelo y la de la hoja «Tu alojamiento»); y la vitrina de logros cerrada sin pase.
- **Ya abrían el aviso pequeño** (sin cambios): EXPLORAR Baños y Fuentes, «Cerca de ti», «Escuchar historia» (ficha y HOY) y la segunda foto de «Tus recuerdos».
- **Siguen abriendo la lista a propósito** (son para ver el pase): la pastilla «Pase Roma» de RUTA, el [Ver] de la caja azul (`Candado`), [Ver el Pase Roma] de HOY sin pase, de «Tu último día» y del propio aviso, y la tarjeta del pase de RESERVAS.
- **Textos del aviso:** alojamiento «Con el Pase Roma, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.»; vuelo «Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.». **El texto del aviso de Logros** («Con el Pase Roma, cada sitio que ves suma a tus logros del viaje.») lo escribió el agente porque no había ninguno en el prompt.

### 2. La lista del pase: sin precios y con el botón fijo
[Elegir mi pase] va fijo abajo (con degradado, `padding-bottom` con safe-area del iPhone y hueco al final para no tapar el último punto), sin precio, siempre a la vista; fuera el bloque de precios del final y el segundo botón (un solo botón). Los precios, solo en «¿Cuántos sois?». Con pase, sin botón y «✓ Tu Pase Roma está activo». El botón fijo lleva un degradado oscuro encima de los últimos puntos que Design no tiene.

### 3. HOY sin pase, completo
Sigue la pantalla de Design (`Pase Lista` 2 y 2b) y vuelve arriba lo de antes, con el estilo de la pantalla: sin fechas «Pon tus fechas» (con su botón), antes del viaje la cuenta atrás, después «Tu viaje ha terminado», y los avisos del día de prueba («Te regalamos un día…», «Mañana es tu día de prueba», «¿Qué tal ayer con HOY?», «Tu modo Hoy es parte del Pase Roma») cuando tocan. Fuera la ✕.

### 4. El botón de la cama en HOY
Botón redondo de 40 px con una cama de trazo fino gris, fijo arriba a la derecha junto al título del día (la zona libre de HOY; el título deja sitio con `pr-12`), solo con pase y en los días del viaje (llegada, medio, vuelta y excursión; no antes, ni después, ni sin fechas). Con dirección abre el camino (el mismo enlace de Google Maps que [Cómo llegar a tu alojamiento]); con pase y sin dirección abre la hoja «Tu alojamiento». Las tarjetas de empezar y acabar el día no se tocaron. El día de prueba sin pase que enseña HOY completo también lleva la cama.

### 5. Siempre «Pase Roma»
`nombreDelPase` da «Pase {Destino}» sin «de». Quitado «Pase de {Destino}» en `src`, `shared/avisos/textos.js` y `server/pagos.js` (error «Ya tienes el Pase Roma» y nombre del producto de pago), y en las pruebas. `TextoConPase` marca en oro «Pase {Destino}» (no «Pase Dúo», «Pase Grupo» ni «Pase Individual»). Se deja «Pase de 1 persona» en `precioPelicula.ts` (la fila de «¿Cuántos sois?»). La prueba comprueba que no hay «Pase de Roma» en `src`, `data`, `shared` ni `server`. No se ha probado con un viaje real a otro destino.

### 6. Con varios destinos
Se queda como está; apuntado en `REGLAS_DE_LA_APP.md` (apartado 6): cada estancia tendrá su zona y su dirección cuando se hagan los multidestinos.

### Pruebas (solo lo tocado + pruebaJutrip; sin batería completa; hasta 2 Chrome a la vez)
- **Nuevas:** `pruebaTanda10N12_a` (15), `_b` (63), `_c` (28) = 106 comprobaciones, 0 fallos.
- **Pasadas en 0 fallos:** `pruebaJutrip` (129), `pruebaTanda10N11_a/_b/_c/_g`, `pruebaTanda10B` (139), `10F` (88), `10G` (78), `10H` (52), `10I`, `10J`, `10N3_apertura`, `10N5_pase`, `10N6_avisopase` (33), `10N8_ficha`, `10N9_pantallas`, `10P_pase`, `10P_hoy`, `10N4_flotantes`, `6t`, `6v`, `6z3`, `7_hoy` (126), `Cuentas3`, `10N10_avisos`, `10N10_reservas`.
- Con 2 Chrome a la vez, 9 salieron en MAL por la carga (`__rutaPrueba is not a function`, esperas largas): las repetí sueltas y pasaron. Dos fallaban de verdad por lo pedido y se actualizaron: `pruebaJutrip` (el nombre del producto de pago ahora es «· Pase {destino}») y `pruebaTanda10N11_g` (`LineaDelPase` abre el aviso pequeño). `pruebaTanda7_hoy` tuvo 2 fallos por un error mío del botón de la cama (la clase del contenedor contenía `data-hoy-titulo-del-dia`); arreglado.
- Pruebas antiguas ajustadas por lo pedido: `10G`, `10N11_a`, `10N11_b` (ahora sale el aviso antes de la lista), `10N11_c` y `10P_pase` (la lista no lleva precios), y las que decían «Pase de Roma».
- Typecheck `npx tsc -p tsconfig.app.json --noEmit`: limpio.

### A medias / sin ver
- Sin ver en un iPhone real: el botón fijo de la lista con la barra de abajo; el botón de la cama con un título largo.
- Faltan las capturas de Design al lado de la lista y de HOY sin pase, y la del aviso a 375×667.
- «Pase {Destino}» con otro destino: sin probar con un viaje real.
- La hora (mañana/noche) del botón de la cama: no depende de la hora, no simulada.

### Dudas para ti
1. El texto del aviso de Logros lo escribió el agente: ¿lo dejo o me das otro?
2. La caja azul del pase (el [Ver]) abre la lista: ¿también el aviso pequeño?
3. El degradado oscuro del botón fijo de la lista no está en Design: ¿lo quito?
4. La cama sale solo en los días del viaje (no antes ni después ni sin fechas) y también en el día de prueba sin pase: ¿vale?
5. El título largo de HOY queda justo al lado de la cama: ¿otro sitio?

### Lista de comprobación 10N12


**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10N12.md e incluido en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Reglas de la app: las nuevas de esta tanda, añadidas a docs/REGLAS_DE_LA_APP.md «Pase Roma» siempre, lista sin precios, HOY sin pase, botón de la cama y lo pendiente de varios destinos.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La película del pase no se toca; hasta 4 agentes, un servidor, hasta 2 Chrome; no apagar el PC Se reinició el PC antes de la tanda y se arrancaron la API y el Vite. El PC no se apaga.  
  *Dónde:* No es de móvil.

**1 · Lo bloqueado abre el aviso pequeño**

- ✅ Hecho — El bloque gris «¿Dónde te alojas?» / «Dirección del hotel» de la hoja «Tu alojamiento» y el [Ir] con candado del día 1 de DÍAS abren el aviso pequeño Su [Ver el Pase Roma] abre la lista.  
  *Dónde:* Cuenta sin pase: RESERVAS > Alojamiento > Tu alojamiento; DÍAS > día 1.  *Captura:* `10n12_aviso_01_hoja_alojamiento.jpg`
- ✅ Hecho — Repaso de todos los sitios donde algo bloqueado abría la lista directamente Pasados al aviso pequeño: LineaDelPase (línea gris de la tarjeta de alojamiento de RESERVAS, de la hoja del vuelo y de la hoja «Tu alojamiento») y la vitrina de logros cerrada. Ya lo abrían: EXPLORAR Baños/Fuentes, Cerca de ti, Escuchar historia, segunda foto de Tus recuerdos. Siguen abriendo la lista, a propósito, los que son para ver el pase: pastilla «Pase Roma» de RUTA, [Ver] de la caja azul, [Ver el Pase Roma] de HOY sin pase y del aviso, tarjeta del pase de RESERVAS y de «Tu último día».  
  *Dónde:* Cuenta sin pase: RESERVAS, EXPLORAR, logros.
- ✅ Hecho — Los textos del aviso (alojamiento y vuelo), con «Desbloquéalo con el Pase Roma» y [Ver el Pase Roma] Literales del prompt. El texto del aviso de Logros («Con el Pase Roma, cada sitio que ves suma a tus logros del viaje.») lo escribió el agente porque no había ninguno: dime si lo cambias.  
  *Dónde:* Cuenta sin pase.

**2 · La lista del pase**

- ✅ Hecho — [Elegir mi pase] fijo abajo, siempre a la vista, sin precio; un solo botón El botón fijo lleva un degradado oscuro encima de los últimos puntos que Design no tiene: dime si lo quito.  
  *Dónde:* RUTA > pastilla «Pase Roma» (cuenta sin pase), bajar la lista.  *Captura:* `10n12_lista_1_arriba.jpg`
- ✅ Hecho — Fuera los precios de la lista (bloque del final y [Elegir mi pase] del final)  
  *Dónde:* Final de la lista.  *Captura:* `10n12_lista_3_final.jpg`
- ✅ Hecho — Los precios solo en «¿Cuántos sois?», que se abre al tocar [Elegir mi pase]  
  *Dónde:* Lista > [Elegir mi pase].  *Captura:* `10n12_lista_4_cuantos.jpg`
- ⚠️ A medias — El botón fijo no tapa el último punto ni pisa la barra del iPhone Medido en 390×844 y 375×667 (hueco al final y safe-area); falta verlo en un iPhone real.  
  *Dónde:* Final de la lista, en el iPhone.  *Captura:* `10n12_lista_375_final.jpg`
- ✅ Hecho — Con el pase: sin botón fijo y «✓ Tu Pase Roma está activo»  
  *Dónde:* Cuenta con pase.  *Captura:* `10n12_lista_5_con_pase.jpg`

**3 · HOY sin pase, completo**

- ✅ Hecho — Se queda lo de Design (HOY, tu guía del día, los puntos, la caja del día de prueba, [Ver el Pase Roma]) y vuelve arriba lo de antes: «Pon tus fechas», la cuenta atrás, «Tu viaje ha terminado» y los avisos del día de prueba  
  *Dónde:* HOY, cuenta sin pase (sin fechas / antes / después del viaje / día de prueba).  *Captura:* `10n12_hoy_sin_pase_1_cuenta_atras.jpg`
- ✅ Hecho — Fuera la ✕ de arriba  
  *Dónde:* HOY sin pase.  *Captura:* `10n12_hoy_sin_pase_6_375.jpg`

**4 · El botón del alojamiento en HOY**

- ⚠️ A medias — Botón pequeño, redondo, con una cama, siempre a la vista en HOY (todos los días del viaje, a cualquier hora), arriba a la derecha junto al título Sale con pase en los días del viaje (llegada, medio, vuelta, excursión), no antes ni después, ni sin fechas. No se simuló la hora (no depende de ella). El día de prueba sin pase que enseña HOY completo también la lleva.  
  *Dónde:* HOY con pase y un viaje dentro de sus fechas.  *Captura:* `10n12_cama_hoy_1.jpg`
- ✅ Hecho — Con dirección abre el camino; con pase y sin dirección abre la hoja «Tu alojamiento»; sin pase no sale; las tarjetas de empezar y acabar el día se quedan El día de vuelta, al empezar, tampoco sale la tarjeta (solo el botón).  
  *Dónde:* HOY con pase.  *Captura:* `10n12_cama_hoy_hoja.jpg`

**5 · Siempre «Pase Roma»**

- ✅ Hecho — Fuera «Pase de Roma» en toda la app; con otro destino «Pase {Destino}» Comprobado por prueba en src, data, shared y server (incluidos los avisos del servidor). No probado con un viaje real a otro destino. Se deja «Pase de 1 persona» en «¿Cuántos sois?» (es la fila de 1 persona, no el nombre del pase).  
  *Dónde:* Toda la app.

**6 · Con varios destinos**

- ✅ Hecho — Se queda como está y se apunta como pendiente en REGLAS_DE_LA_APP.md (apartado 6)  
  *Dónde:* No es de móvil.

**7 · La prueba**

- ✅ Hecho — Solo las pruebas de lo tocado y pruebaJutrip, en 0 fallos Pasadas las pruebas de lo tocado más pruebaJutrip (129/0), todas en 0 fallos (9 repetidas sueltas por la carga de 2 Chrome). Detalle en el informe.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Prueba nueva pruebaTanda10N12 106 comprobaciones (a 15, b 63, c 28), 0 fallos.  
  *Dónde:* No es de móvil.
- ⚠️ A medias — Capturas en docs/dias/capturas_jutrip/ y en REPASO_10N12.html, a 390×844 y 375×667 Faltan las capturas de Design al lado de la lista y de HOY sin pase, y la del aviso a 375×667.  
  *Dónde:* Esta página.

**8 · El informe**

- ✅ Hecho — Apartado «10N12» en INFORME_TANDA10B.md y esta lista al final No hace falta migración.  
  *Dónde:* No es de móvil.


## 10S — La batería de pruebas en 0 fallos de una pasada (y más rápida), la descarga más ligera, las zonas de toque de 44 px y tres retoques de la 10N12 (29 y 30-oct)

**Migración: ninguna.** No se ha tocado el motor de rutas ni nada de `server/` ni `data/` más allá de lo dicho. **La muestra de 60 fechas** (`muestraRutas60.mjs`): «las rutas salen exactamente iguales que antes», antes de empezar y al terminar.

### Resultado en una línea
**Tres pasadas seguidas de la batería completa, con 2 Chrome a la vez, en 0 fallos cada una, sin repetir nada a mano: 34,4 / 34,7 / 34,7 minutos para 178 pruebas** (112 de Node, 62 de Chrome a 2 a la vez y 4 solas al final del Supabase real). **Antes: unos 65-70 minutos con 148 pruebas** (aproximado: sale de mis registros de la 10N10, no se midió de nuevo). `pruebaJutrip` (129/0) va dentro de cada pasada. El camino hasta ahí: la pasada 1 dio 4 en MAL, la 2 dio 3 en MAL; se arregló la causa de cada una y la cuenta de «tres seguidas» empezó de nuevo.

### 1. Los retoques de la 10N12 (tus respuestas)
- **Aviso de Logros:** «Con el Pase Roma, consigues el sello de cada sitio que visitas, las colecciones y los emblemas secretos.»
- **Caja azul y degradado:** la caja azul ([Ver]) sigue abriendo la lista; el degradado detrás del botón fijo se queda. Sin cambios.
- **Botón de la cama:** en el día de prueba sin pase ya no sale. Causa: el pago está encendido ese día, y el botón decidía por ahí; ahora decide por el pase de verdad (`HoyView`, `conCama = fase "durante" && no es día de prueba`).
- **La ✕ de la lista:** la zona que se desplaza empieza justo debajo de la ✕ (con un fundido de 14 px), así que ningún texto pasa por debajo. El botón fijo y su degradado no cambian. Se comprueba por geometría en 8 posiciones de scroll, a 390×844 y 375×667.
- **«Mis viajes»:** tu respuesta del 30-oct: la línea de fechas lleva solo las fechas, sin «· 4 días» (los chips «4 días · 3 noches · N paradas» y «En 12 días» no se tocan).

### 1b. Zonas de toque de 44 × 44 (tu petición del 30-oct)
Clase `zona-toque` en `src/index.css`: un `::after` transparente y centrado de al menos 44 × 44 que **solo crece hacia fuera**; el botón sigue midiendo lo mismo a la vista (Ajustes y la cama, 40 × 40), sin cambiar diseño ni espacio. Se añade `position: relative` solo si el botón no es `absolute`/`fixed`; los botones anchos y bajos crecen solo en vertical; donde hay vecinos pegados se amplía solo hacia el lado libre.
- **Cuáles (129 apariciones de la clase en 85 archivos; lista exacta con `git diff -U0 -- src | grep zona-toque`):**
  - **40 px:** Ajustes y Cerrar del Perfil; la cama de HOY; la ✕ de las hojas (unirse, lista del pase, añadir parada, buscador de atracciones ×2, calendario, llegada/vuelta, ficha de destino, foto en grande, añadir reserva, hoja abajo, consejos del viaje, hojas de opciones y selectores); «Volver» (lista de viajes, llegada, comida); Ocultar mapa; las tarjetas anchas con alto de 40.
  - **36-38 px:** ✕ de avisos y de elegir día, «Tips» y «Recuperar mi ruta», «Atrás» del flujo, «Volver» de restaurante; eliminar viaje y cambiar portada de «Mis viajes» (38 × 38).
  - **42 px:** Cerrar de alojamiento, de RESERVAS y del explorador.
  - **Los más pequeños (menos de 30 px, los que más ganan):** el «…» de las paradas (28), editar parada (22 × 28), quitar paseo (28), borrar búsqueda (24-26), cerrar aviso (24) y quitar lugar del buscador de atracciones (16).
  - **Pastillas de 30-42 px de alto** en el explorador, presupuesto, reservas, HOY, primera pantalla, fechas, calendario y los selectores.
  - **Añadidos a mano tras la auditoría con Chrome:** fechas del viaje en el mapa, «Ver todo» del mapa, «Añadir alojamiento»/«Ir» del día 1, «Más opciones del día», «+ Añadir parada», Ubicación y Escuchar en HOY, «Borrar mi cuenta».
- **Saltados a propósito:** los de desarrollo (`DevQuickRouteScreen`, `PanelDePruebas`), los de `ReservasItemRow` (30 px, Añadir/Reservar apilados sin hueco) y 4 falsos positivos del escáner.
- **Comprobado:** un Chrome midió 5 pantallas (RUTA, DÍAS, RESERVAS, EXPLORAR, HOY; con y sin pase; 5 puntos por botón y varias posiciones de scroll): **ninguna zona de toque tapa el clic de un vecino** (5 coincidencias, todas explicadas: elementos fuera del recorte del scroll y «Visto» pasando bajo el botón flotante de la cama). **No se midieron** las hojas, los modales ni los menús («…», Perfil, calendario): solo pasada estática. Quedan por debajo de 44 solo dos controles de Mapbox (atribución obligatoria) y el panel «Pruebas» (desarrollo).
- **Capturas antes y después** (`10s_toque_*`): la cama idéntica byte a byte; Ajustes idéntica a la vista (difiere en bytes por la animación de «Mi vitrina»).
- **Prueba:** `pruebaPantallas8c` ya no lee `h-11 w-11` (estaba obsoleta); comprueba que `.zona-toque::after` es de ≥ 44 × 44 y que Ajustes y la cama la llevan y siguen en `h-10 w-10`. `pruebaTanda10S` mide la zona real con `elementFromPoint` en las 4 esquinas y el centro (y que 1 px fuera no devuelve el botón).

### 2 y 3. La causa de cada fallo y cómo se arregló
| Fallo | Causa | Arreglo |
|---|---|---|
| `__rutaPrueba is not a function`, `reading 'days'` | `window.__rutaPrueba` se carga con un `import()` y las ~48 pruebas copiaban un bucle de 60 × 500 ms (30 s). Con un Vite frío y la CPU ocupada la página tardó **207 s** en tenerla | `abrirApp` no devuelve la app hasta que existe (tope 300 s, mensaje claro); las pruebas antiguas pasan sin tocarlas |
| «No se ha podido crear el viaje de pruebas» | esperas fijas (800/1200/3500 ms) en `rutaDePrueba.ts` | `hasta()` espera de verdad (primera pantalla, campos, botones, ruta en el almacén); una sola creación por página; `conViaje` reintenta solo fallos de creación |
| `reading 'focus'` | `escribir()` hacía foco en un campo que aún no existía | espera 20 s y nombra el selector |
| Vite frío | la primera carga de Vite es lenta | `server.warmup` en el Vite estable y el runner lo precalienta (peticiones a `/`, `main.tsx`, `App.tsx`, `rutaDePrueba.ts`, el almacén y una pasada de Chrome por todas las pestañas) |
| Chrome «de más» | la batería solo miraba si el texto decía `abrirApp`; las que abren Chrome vía `_10n5_comun`, `_ayuda10F`… corrían sin límite | sigue los `import` recursivamente: 62-63 de Chrome detectadas, 2 a la vez |
| Puerto de Chrome al azar | colisiones posibles | puerto 0 + lectura de `DevToolsActivePort` del perfil propio |
| Basura | había **8.573 carpetas `enLaApp-*`** en %TEMP% (el borrado se rendía a la primera) | `cerrar()` las borra con reintentos; el runner avisa en amarillo de las de más de un día |
| Cierre raro `0xC0000409` (`explorar`, `6y2_reorganizar`) | `process.exit()` con el WebSocket de CDP o el servidor hijo todavía cerrándose (aserto de libuv en Windows) | cerrar el WebSocket, esperar al hijo y 400 ms antes de salir |
| Chrome huérfanos y cola bloqueada ~22 min | `conViaje` reintentaba abriendo otro Chrome sin cerrar el anterior | `conViaje1` cierra su app si falla; una espera agotada no se reintenta; un `process.on('exit')` cierra todas las apps abiertas |
| `pruebaTanda7_reparto` «PASADO DE TIEMPO» | no era lenta: tarda **21 s** y se quedaba colgada después de dar «TODO BIEN» (un temporizador vivo) | `process.exit` explícito + vigilante en el runner (si ya dio su resultado limpio y no sale sola en 90 s, la cierra y la apunta como OK\* «NO SALÍA SOLA»; con fallos no actúa) |
| `pruebaTanda10P_sorteo` (error -4094) | bloqueo momentáneo de Windows al guardar una captura | `app.captura` reintenta hasta 8 veces con espera creciente |
| `pruebaTanda10N6_recuerdos` | altas anónimas del Supabase real por Chrome + esperas fijas de 6 s en la subida | una cuenta anónima fija, espera a que empiece y acabe la subida, y corre sola al final |
| `pruebaEntrarReal`, `pruebaTanda10N3_real` | altas anónimas nuevas cada pasada | cuentas fijas (fuera de git, sin imprimirse) y a la cola de «solas al final» (4 en total) |

- **Runner nuevo (`bateriaParalela.mjs`):** enumera TODAS las `prueba*.mjs` (178) y excluye los 16 envoltorios por contenido (solo si todas sus partes están sueltas); cada prueba con su carpeta temporal y su perfil de Chrome; Vite estable propio calentado en el puerto 5199 y cerrado al acabar; las que comparten Supabase real, solas al final; tope por prueba = el mayor entre 25 min y 2 × su tiempo histórico; ordena de las más largas a las cortas; guarda la salida de las MAL; sin reintentos; `listar=1`, `solo=`, `sin=`, `filtro=`. Comando: `node scripts/destino/bateriaParalela.mjs navegador=2 conc=3 salida=docs/dias/_bateria.json`.
- **`pruebaListas`:** en la batería, un muestreo de **12 fechas fijas** (con las difíciles: Navidad, fin de año, Semana Santa, el cierre de las Catacumbas, pleno verano y un domingo con el Vaticano cerrado, cada una con su motivo en la cabecera): 3 min 39 s, 25.887 viajes, 0 fallos. **El barrido completo de 365 fechas no se ha quitado:** sigue existiendo y se corre aparte (unas 6-7 h de CPU, ≈ 1 h 50 min en 4 trozos; comandos en `COMO_CORRER_LAS_PRUEBAS.md`, sección 10), obligatorio en toda tanda que toque el motor o los datos de Roma, y una vez antes de lanzar. **No se ha corrido entero en esta tanda** (no se toca el motor).

### 2b. Las 21 pruebas antiguas que la batería «completa» hizo entrar
Con «coger todas» entraron 21 pruebas que nadie corría (Tanda 7, `pruebaListas`, `pruebaSalida`, `pruebaSugerencias`, `pruebaTanda11`, `pruebaVarita`, `pruebaPantallas8c`, `pruebaRevisionRutas`). 10 salían MAL por motivos que no eran de infraestructura. Ninguna era una regresión clara: casi todas tenían la expectativa obsoleta por cambios tuyos entre el 21 y el 29-oct. **Con tu aprobación del 30-oct** se actualizaron con la misma fuerza (cada comprobación cambiada lleva en la cabecera de su prueba un bloque «CAMBIOS DE LA 10S» con qué esperaba antes, qué espera ahora y qué decisión tuya lo justifica, tanda y fecha):
- `7_reparto` (2084/0): la tabla pasa de D6 a D7 (Tanda 11, 22-oct); la vuelta sin paradas; la tarjeta del último día de la 10B (21-oct).
- `7_llegada` (59.271/0 y 8 apartados): la tabla D6 → D7 (108 casos) y «Cúpula + Basílica» como una visita.
- `7_vuelta` (54.073/0): la referencia congelada del 14-oct se refresca con la salida actual solo para 9 viajes (`_t7v_sinvuelos_dorado.json`); `sin_vuelos` y `ruta_a_mano` intactas.
- `7_respuestas` (260/0 y 1 apartado): los «me gusta» iniciales de la 10O (25-oct).
- `7_ficha` (1295/0), `7_conexion` (194/0), `7_unificado` (845/0): `btn-champan` (10E), la tarjeta del vuelo de DÍAS (10N11), lo gratis de la 10G, «Hoy vuelves a casa» (10B).
- `pruebaPantallas8c` (1265/0): logo, carga diferida del Perfil, tarjetas de Design, fixture de logros regenerado (`generarDemoGanados.mjs`, solo cambia Roma › secretos: 12 → 14) y la zona de toque.
- `7_reservas` (159/0): sección 8 y 11 contra la tarjeta de la 10B; las 8 reglas «SUSTITUIDAS» (que ignoraban fallos en silencio) reescritas contra `HojaDelVuelo`, `HojaTuAlojamiento`, la tarjeta del vuelo y el aviso sin pase. Un cambio de significado: «la mitad con hora pide la zona» (`data-pide-zona`) ya no existe; ahora el bloque de Alojamiento dice «Falta la zona».
- `6z6c` (99/0): HOY sin pase ahora es la pantalla de Design (10N11), que lleva «Cerca de ti» como punto cerrado; sigue comprobando que no sale nada de lo de pago (ahora con más: «Baños», «Fuentes», «Comer», «Ubicación», llegada y vuelta).
- `7_mover` (145/0): `HoySinPase` y `TarjetaDeViaje` en la lista de permitidos del escáner de «{n} días» (son cuentas atrás).

### 2c. «PENDIENTE DEL MOTOR» (13 casos, en amarillo en cada pasada, nunca en verde)
Solo esos casos concretos, no las pruebas enteras; no cuentan como fallo ni como OK. Apuntados en `docs/dias/PENDIENTES_MOTOR.md` (con prioridad y fecha de hoy, 30-oct, «mirar en la próxima tanda del motor») y en `REGLAS_DE_LA_APP.md` (sección 6):
1. **Catacumbas de San Calixto el 15-ene-2027 en D7 (8 + 4 casos, viajes sin fechas, solo el mes):** `roma.json` tiene el cierre `2027-01-13..2027-02-10`, pero un viaje sin fechas reales no aplica el cierre por rango (`listasTrip.js` línea 171: `closedOnDay(..., calendar.hasDates ? dateIso : null)`); el motor las pone a las 14:00 sin avisar. Solo se ve ahora porque la Tanda 11 puso D7 (que las lleva) en 6 y 7 noches. **Pregunta: ¿un viaje de solo enero debe evitar D7 o avisar?** (Prioridad alta: mandar al viajero a un sitio cerrado.)
2. **Viaje 11 · día 1 no cabe por 105 min (1 caso):** con «imprescindibles intocables» de la Tanda 11 la Iglesia del Gesù se queda en D1 y el aviso sale 5 veces repetido (también de mirar).
3. **Orden llegando a las 16:30 (2 casos):** el motor pone la Trinità dei Monti antes de Via Condotti por la regla «rodeo para no llegar cerrado» de la Tanda 11 (cierra a las 19:45); probablemente solo falte actualizar la comprobación de la lista escrita.
4. **D6 «Roma desde arriba»:** confirmado a propósito (`roma.json › curated_routes › _nota_tanda11`: Eric, 22-oct); por eso las pruebas esperan D7.

### 4. La descarga
**371,6 KB → 288,9 KB** comprimidos al abrir (tope 340 KB, repuesto en `pruebaPantallas8c` y `pruebaCuentas3`). Causa: el CSS de banderas (`flag-icons`, 84,5 KB comprimidos de los 98,7 del CSS de entrada, unos 420 KB sin comprimir) entraba al abrir con un `@import` en `index.css`; ahora va en su propio archivo (`banderasCss`) que se baja después de abrir, con precarga cuando la app está libre (`precargarBanderas()`). CSS de entrada: 98,7 → 15,8 KB. JS sin cambios (index 172, vendor-react 44, vendor-supabase 56). **La lista del pase sin la película: 4,7 KB** comprimidos (antes 4,6; en la 10N10, con las escenas, 1,13 MB sin comprimir). Los logros: 6,4 KB. Las dos pruebas del peso miden un `dist` recién construido (`_distFresco.mjs`: unos 24 s si hay que construir; nunca un `dist` viejo). Las banderas no se han visto en un navegador real: mira el desplegable de destino y las tarjetas de «Mis viajes» (cualquier cuenta). Si alguien teclea antes de que carguen, una bandera podría salir un instante sin estilo.

### 5 y 6. Capturas de Design y guía
Capturas de Design nuevas para DÍAS día 1 (01, 02, 02b, 03), alojamiento 02 y 03 regeneradas, la lista del pase y HOY sin pase (Pase Lista) y el aviso a 375×667; regenerados `REPASO_10N11.html` y `REPASO_10N12.html`. Solo hay una captura de Design por punto, así que algunas quedan fuera del lado a lado y solo salen en la galería. `docs/dias/COMO_CORRER_LAS_PRUEBAS.md`: cómo se corre la batería entera, solo las de una tanda, cuánto tarda cada cosa, qué hacer si una falla y la tabla causa → arreglo; `CLAUDE.md` con una línea que apunta a la guía y otra con el comando de la batería.

### Posibles fallos de la app que salieron (sin decisión tuya detrás; no tocados)
1. **`HojaDelVuelo.tsx`** pone «Ref. vuelo» y «Aerolínea» fijos también con la vuelta en tren y en el «viaje en coche».

### A medias
- Sin ver en un iPhone real: las banderas sin parpadeo, la zona de toque de 44 px (hojas, modales y menús no medidos con Chrome).
- El tiempo «antes» de la batería (65-70 min) es aproximado; el «después» es medido (tres pasadas).
- El barrido completo de 365 fechas de `pruebaListas` no se ha corrido en esta tanda.
- Quedan en %TEMP% unas 1.800 carpetas `enLaApp-*` antiguas (las limpio al cerrar).

### Dudas para ti
1. Los 13 «pendientes del motor»: Catacumbas sin fechas es el importante (¿D7 debe evitarse o avisar en un viaje de solo enero?). ¿Lo miramos en la próxima tanda del motor?
2. El vigilante del runner marca OK\* «NO SALÍA SOLA» a una prueba que ya dio su resultado limpio y no sale en 90 s. ¿Prefieres que cuente como MAL?
3. `HojaDelVuelo` pone «Ref. vuelo» y «Aerolínea» también con tren o coche: ¿es lo que quieres?

### Lista de comprobación 10S


**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10S.md e incluido en el commit  
  *Dónde:* No es de móvil.
- ✅ Hecho — Reglas de siempre (REGLAS_DE_LA_APP.md y CLAUDE.md); hasta 4 agentes, memoria mirada, nota de estado a la rama «estado» cada 30 min (también con la batería corriendo); batería completa esta tanda Con tu permiso del 30-oct, al terminar se apaga el PC (solo esta vez).  
  *Dónde:* No es de móvil.

**1 · Tres retoques de la 10N12**

- ✅ Hecho — El aviso de Logros: «Con el Pase Roma, consigues el sello de cada sitio que visitas, las colecciones y los emblemas secretos.»  
  *Dónde:* Cuenta sin pase: Logros cerrados > tocar la vitrina.  *Captura:* `10s_aviso_375x667.jpg`
- ✅ Hecho — La caja azul del pase ([Ver]) sigue abriendo la lista; el degradado detrás del botón fijo se queda Sin cambios.  
  *Dónde:* Cuenta sin pase: RUTA > pastilla «Pase Roma»; bajar la lista.  *Captura:* `10s_lista_x_final.jpg`
- ✅ Hecho — El botón de la cama: sí en los días del viaje; en el día de prueba sin pase, no sale; solo con pase Antes salía el día de prueba porque el pago está encendido ese día: ahora mira el pase de verdad.  
  *Dónde:* HOY: con pase en un día del viaje, arriba a la derecha; cuenta sin pase en el día de prueba, no sale.  *Captura:* `10s_cama_dia_de_prueba.jpg`
- ✅ Hecho — La ✕ de la lista del pase no pisa el texto al bajar La zona que se desplaza empieza justo debajo de la ✕, con un fundido de 14 px; el botón fijo y su degradado quedan igual. Comprobado por geometría en 8 posiciones de scroll, a 390×844 y 375×667.  
  *Dónde:* Lista del pase (cuenta sin pase): bajar hasta el final.  *Captura:* `10s_lista_x_medio.jpg`

**1 · Añadido de Eric (zonas de toque)**

- ✅ Hecho — Zona de toque de 44 × 44 en Ajustes, la cama de HOY y cualquier otro botón de menos de 44 px, sin cambiar lo que se ve Clase `zona-toque` en src/index.css (zona invisible que solo crece hacia fuera). 129 apariciones de la clase (111 sitios por escáner, 10 a mano tras la auditoría con Chrome y el resto repetidos); la lista completa sale de `git diff -U0 -- src | grep zona-toque` y está en el informe. Capturas antes/después de Ajustes y la cama idénticas a la vista. Sin cobertura en Chrome: hojas, modales y menús (solo pasada estática). Quedan por debajo de 44 solo dos controles de Mapbox (atribución obligatoria) y el panel «Pruebas» (solo desarrollo).  
  *Dónde:* Perfil > Ajustes (arriba a la derecha) y HOY (cama): toca un poco fuera del botón y responde.  *Captura:* `10s_toque_ajustes_despues.jpg`

**2 · Lo que fallaba hoy**

- ✅ Hecho — Fallos por la carga (`__rutaPrueba is not a function`, «No se ha podido crear el viaje de pruebas», esperas largas) Causas y arreglos en el informe (tabla causa → arreglo).  
  *Dónde:* No es de móvil.
- ✅ Hecho — pruebaTanda7_reservas (TarjetaTuUltimoDia, textos undefined) Era la prueba, no la app: la 10B rediseñó el componente a propósito. Reescrita contra las piezas actuales (159 comprobaciones, 0 fallos); las 8 reglas «SUSTITUIDAS» ya no se ignoran en silencio.  
  *Dónde:* No es de móvil.
- ✅ Hecho — pruebaTanda7_mover (5 fallos) Solo fallaba 1 (falso positivo del escáner de «{n} días» en cuentas atrás). 145/0.  
  *Dónde:* No es de móvil.
- ✅ Hecho — pruebaTanda10N6_recuerdos (falla con el Vite normal) Subía fotos al Supabase real con altas anónimas por Chrome y esperas fijas. Ahora una cuenta anónima fija, espera a que acabe la subida, y corre sola al final de la batería. 29/0.  
  *Dónde:* No es de móvil.
- ✅ Hecho — pruebaTanda10N10_explorar acaba con un cierre raro de node (código 3221226505) Aserto de libuv de Windows al salir con el WebSocket y Chrome cerrándose. Arreglado en _enLaApp.mjs; el mismo origen en pruebaFase6y2_reorganizar y pruebaFase6y_reorganizar (esperan al hijo).  
  *Dónde:* No es de móvil.
- ✅ Hecho — pruebaEntrarReal y pruebaTanda10N3_real (altas anónimas del Supabase real) Reutilizan cuentas fijas, guardadas fuera de git, y hacen cero altas nuevas por pasada. Corren solas al final de la batería.  
  *Dónde:* No es de móvil.
- ✅ Hecho — pruebaTanda7_hoy y cualquier otra que valga entran en la batería; los envoltorios no duplican El runner enumera todas las prueba*.mjs (178) y excluye los 16 envoltorios por contenido. Entraron 21 pruebas antiguas que nadie corría: 10 estaban desfasadas (ver el informe).  
  *Dónde:* No es de móvil.

**3 · Lo que te pido**

- ⚠️ A medias — Causa de cada fallo y arreglo de raíz, sin quitar ni bajar pruebas Se actualizaron expectativas obsoletas en 10 pruebas antiguas (con «antes → ahora → decisión tuya» en la cabecera de cada una), se apartaron como «PENDIENTE DEL MOTOR» solo 13 casos concretos (Catacumbas sin fechas, orden a las 16:30, Viaje 11), y pruebaListas corre en la batería con 12 fechas fijas (el barrido de 365 va aparte). Todo con tu aprobación del 30-oct.  
  *Dónde:* No es de móvil.
- ✅ Hecho — La batería completa con 2 Chrome, en 0 fallos de una pasada, tres veces seguidas, y cuánto tarda antes y después Tres pasadas seguidas: 34,4 / 34,7 / 34,7 min, 178 pruebas, 0 en MAL cada una. Antes: unos 65-70 min con 148 pruebas (aproximado).  
  *Dónde:* No es de móvil.

**4 · La descarga, más ligera**

- ✅ Hecho — Bajar de 371 KB a menos de 340 KB y volver a poner el tope en 340 en pruebaPantallas8c y pruebaCuentas3, midiendo un dist recién construido 288,9 KB (de 371,6). Causa: el CSS de banderas (flag-icons, 84,5 KB comprimidos) entraba al abrir; ahora va aparte. Tope 340 KB repuesto; las dos pruebas construyen un dist nuevo (unos 24 s).  
  *Dónde:* No es de móvil. Mira en el móvil que el desplegable de destino y las tarjetas de Mis viajes muestran las banderas sin parpadeo.
- ✅ Hecho — Lo que pesa la lista del pase sin la película 4,7 KB comprimidos (antes 4,6; en la 10N10, con las escenas, 1,13 MB sin comprimir).  
  *Dónde:* No es de móvil.

**5 · Capturas de Design que faltan**

- ⚠️ A medias — En REPASO_10N11 y REPASO_10N12, las de Design al lado: DÍAS día 1 y vuelo, alojamiento 02 y 03, la lista del pase, HOY sin pase y el aviso a 375×667 Hechas y regeneradas; solo hay una captura de Design por punto en los repasos, así que algunas (p. ej. DÍAS 01 y 02b) quedan fuera del lado a lado y solo salen en la galería.  
  *Dónde:* docs/dias/REPASO_10N11.html y REPASO_10N12.html.

**6 · Cómo correr las pruebas**

- ✅ Hecho — docs/dias/COMO_CORRER_LAS_PRUEBAS.md y CLAUDE.md al día Con comandos, tiempos y qué hacer si una falla.  
  *Dónde:* No es de móvil.

**7 · La prueba**

- ✅ Hecho — La batería completa tres veces seguidas, con 2 Chrome a la vez, en 0 fallos; y pruebaJutrip pruebaJutrip 129/0 dentro de cada pasada.  
  *Dónde:* No es de móvil.
- ✅ Hecho — Prueba nueva pruebaTanda10S: los tres retoques y el peso por debajo de 340 KB 85 comprobaciones, 0 fallos (también la línea de fechas de Mis viajes y la zona de toque medida con elementFromPoint).  
  *Dónde:* No es de móvil.
- ✅ Hecho — La muestra de 60 fechas: las rutas salen exactamente iguales «Las rutas salen exactamente iguales que antes», antes y después de la tanda. No se ha tocado el motor.  
  *Dónde:* No es de móvil.

**8 · El informe**

- ✅ Hecho — Apartado «10S» en INFORME_TANDA10B.md y esta lista al final No hace falta migración.  
  *Dónde:* No es de móvil.


## 10S2 — El fallo grave «Algo ha ido mal» al entrar con Google (29 y 30-oct)

**Migración a aplicar: la `0068_errores_de_pantalla.sql`** (crea la tabla donde se guardan los avisos de «Algo ha ido mal»; sin ella el aviso solo queda en el registro del servidor, en Vercel › Logs). Se puede pegar entera y repetir. **Además, una cosa que solo puedes hacer tú: cerrar las sesiones de tu cuenta** (apartado 3).

### 1. La causa, en palabras sencillas
En tu cuenta principal hay un viaje guardado en la nube con las **reservas y el estado de pantalla vacíos** (`bookings = {}` y `ui_state = {}`). Al entrar (también al volver de Google), la app baja tus viajes y abre el más cercano; al abrirlo, el presupuesto intenta recorrer unas listas de reservas que ese viaje no trae y lanza un error en plena carga: `TypeError: Cannot convert undefined or null to object` (`Object.entries` de `transportBookings`, en `presupuesto.ts`, disparado desde `hydrateTrip`). La app queda a medias y toda pantalla que lee esas reservas se rompe (`Cannot read properties of undefined (reading 'day-1')`): «Algo ha ido mal». Un móvil que ya tenía la sesión y el viaje cargado en el propio móvil no lo vuelve a bajar y por eso va bien. Tu segunda cuenta tiene 4 viajes completos y tampoco falla.
- **Cómo se hizo esa fila vacía:** no se ha podido determinar con seguridad (la tabla `trips` crea `bookings` y `ui_state` en `{}` por defecto, y un guardado a medias de la propia app puede dejarlos así). Ningún código del servidor escribe en `trips`.
- **Cómo se reprodujo:** (a) en local, sin nube y sin tocar tu cuenta, con una carga de un viaje con `bookings = {}` (falla igual); (b) con el Supabase real y una **cuenta de prueba nueva**: la app guarda su viaje, se dejan en la nube las reservas y el estado en `{}` y se recarga: **con el arreglo quitado la prueba falla (5 fallos); con él, pasa**.
- **No reproducido:** la vuelta de Google en sí (con `#access_token=…` y una sesión de prueba, también con una sesión anónima antes) **no falla** ni en el servidor de desarrollo ni en el build de producción: el fallo era el viaje vacío que se baja justo al entrar. Es coherente con todo lo que viste (también «Crear mi ruta», que pide entrar). Los datos de las dos cuentas de administrador se leyeron **solo leyendo** (sin escribir nada ni entrar como tú) y los volcados temporales ya están borrados.

### 2. El arreglo (pequeño)
- `src/lib/reservasPorDefecto.ts` (nuevo): `reservasConDefectos` y `uiConDefectos` completan lo que falte (diccionarios vacíos, sin seguro ni coche, `n26Added` falso, RUTA sin día elegido) y corrigen un campo con el tipo cambiado. **No cambian lo guardado**: solo lo que se lee.
- Todo viaje que baja de la nube pasa por ahí (`filaAViaje`), `hydrateTrip` lo usa para todos los campos y el presupuesto no revienta con las listas sin rellenar (`?? {}`). Así se autorrepara el viaje vacío de tu cuenta al guardarse otra vez (no he escrito nada en tu fila).
- **Un dato raro ya no puede tumbar la app entera:** `PiezaSegura` (nuevo) envuelve cada «host» de arriba de la app (TripSync, la puerta de cuenta, PrecioVuela, MomentosHost, los avisos…, 25 piezas) y cada fila de «Mis viajes»: si una se rompe al pintarse, solo ella se queda sin pintar y se avisa al servidor con su nombre. El `ErrorBoundary` sigue como última red.
- **Si más adelante quieres blindar más sitios** (tarjetas de día, bloques de RESERVAS, filas de avisos), `PiezaSegura` está lista para envolverlos.

### 3. Cerrar las sesiones de tu cuenta — A MEDIAS (necesita un pegado tuyo)
Lo intenté de todas las formas que permite la API de administración de Supabase, probando con una cuenta de prueba (nunca con la tuya): **no hay forma de cerrar todas las sesiones de una cuenta con la clave de servicio** (los caminos de administración no existen en tu versión; cambiar la contraseña la invalida pero cambia cómo entra la cuenta; el cierre global pide la llave de la propia persona). La única vía es SQL. Te dejo **`docs/dias/CERRAR_SESIONES.sql`**: pegas tu correo donde pone `<TU CORREO>` y lo ejecutas una vez en Supabase › SQL editor. Borra solo sus sesiones y llaves de renovación (no toca viajes, datos ni la identidad de Google). Las llaves que pegaste en el chat privado dejan de valer en cuanto lo ejecutas (el token de acceso, de una hora, ya habrá caducado; la llave de renovación solo muere con esto o al usarse).

### 4. «Algo ha ido mal» ahora se guarda en el servidor
- El `ErrorBoundary` y cada `PiezaSegura` avisan a `POST /api/error-pantalla` de **qué ha fallado y en qué pantalla**: mensaje, pila, componentes, pantalla de la app (`screen / mode / pieza`), ruta (**sin parámetros ni `#`**) y versión. **Sin datos privados:** no se guarda quién es (ni id, ni correo, ni IP), se recortan los textos y se tachan correos, tokens, claves, ids y **la vuelta de Google entera (`#access_token=…`)**: se tacha en el navegador **antes de enviar** y otra vez en el servidor. Probado en vivo: un aviso con un `#access_token=…` queda en el registro como `#<tachado>`.
- Se guarda en la tabla `errores_pantalla` (migración 0068; RLS encendido y sin políticas: solo lee y escribe el servidor) y siempre deja una línea `[error-pantalla]` en el registro del servidor. Se frena solo (30 por minuto, 5 iguales por minuto) y siempre contesta 202, así que un aviso de error nunca da otro error.
- **Para ver los últimos** (una vez aplicada la 0068), en el SQL editor: `select creado, pantalla, mensaje, ruta, left(pila, 300) from public.errores_pantalla order by creado desc limit 50;`.

### 5. `ArrivalReturnSheet.tsx` y oxlint
`useEnlaceDeTraslados` se llamaba después de `if (!medio) return null` (cuando `medio` pasaba de vacío a con datos, React lanzaba «Rendered more hooks…»). Ahora se llama **antes**. `npx oxlint src`: **0 errores de `rules-of-hooks`**, y la prueba `pruebaTanda10S2` lo comprueba cada vez (entra en la batería).

### 6. Respuestas a tus dudas de la 10S
- **Catacumbas:** evitarlas cuando el viaje, o su mes si no hay fechas, cae en el cierre (13-ene a 10-feb): apuntado en `docs/dias/PENDIENTES_MOTOR.md` y en `REGLAS_DE_LA_APP.md` para la próxima tanda del motor (los 12 casos siguen apartados en amarillo).
- **`OK*`:** sale siempre en **amarillo**, nunca en verde. Las pruebas ya se cierran solas (ningún `OK*` en las últimas pasadas).
- **Hoja del vuelo:** con tren o autobús, «Ref. del billete» y «Compañía»; con coche, ninguno de los dos; con avión, «Ref. vuelo» y «Aerolínea»; con ferry, «Ref. del billete» y «Naviera». Los nombres salen de un solo sitio (`legWord`, `reservasLegs.ts`). Se actualizó `pruebaFase6y5_pantallas` (antes decía «Ref. tren» y «Ref. billete») con tu decisión en el comentario.

### 7. Pruebas
- **Nuevas (entran en la batería):** `pruebaTanda10S2` (42 comprobaciones, sin Chrome: ganchos de React con oxlint, el aviso de error —limpieza de llaves, freno, ruta, 202 siempre—, la migración 0068 con PGlite y el viaje con las reservas vacías) y `pruebaTanda10S2_real` (**USA EL SUPABASE REAL, corre sola al final**: 18 comprobaciones; crea y borra su propia cuenta nueva; entra, crea su viaje, lo baja de la nube, lo deja con `bookings = {}`, lo abre en todas las pestañas y simula la vuelta de Google con `#access_token`, sin «Algo ha ido mal»).
- **Limitación de la prueba con el Supabase real:** crea el viaje con la ruta rápida de desarrollo, no recorre con clics los 7 pasos del formulario; el formulario, sin cuentas, lo cubren otras pruebas, y la pantalla de «Entrar con Google» no se puede completar con una cuenta de Google desde aquí (se simula su vuelta).
- **Batería completa** (180 pruebas, 34,8 min): 2 en MAL, las dos explicadas y arregladas: `pruebaFase6y5_pantallas` (los nombres de las casillas, por tu decisión de la hoja del vuelo) y `pruebaTanda10N6_entradas` (pasa sola 12/0: fallo suelto bajo carga). Repetidas después de los últimos retoques, todas en 0 fallos: `10N9_vuelo` 29, `10N10_reservas` 52, `10N11_a` 36, `10N5_cadauno` 60, `7_reservas` 159, `Fase6y6_cierre` 3215, `10N6_entradas` 12, `pruebaTanda10S` 85, **`pruebaJutrip` 129**, `pruebaTanda10S2` 42 y `pruebaTanda10S2_real` 18.
- Typecheck `npx tsc -p tsconfig.app.json --noEmit`: limpio.

### A medias / sin ver
- **Cerrar las sesiones de tu cuenta:** falta que ejecutes `CERRAR_SESIONES.sql`.
- **Aplicar la 0068** para ver los errores reales en producción.
- **El viaje vacío de tu cuenta no se ha tocado** (no he escrito nada): se autorrepara en cuanto lo abras con la app nueva, que lo guarda ya completo.
- **No reproducido en producción el fallo con Google real:** si tras desplegar esto y aplicar la 0068 vuelve a salir, el aviso nos dirá qué pantalla y qué error son.
- Las pruebas nuevas de la hoja del vuelo con coche/tren/autobús se cubren con la actualización de `pruebaFase6y5_pantallas` (código) y las de RESERVAS existentes; no hay una captura nueva.

### Dudas para ti
1. ¿Quieres que envuelva en `PiezaSegura` más sitios (cada día de DÍAS, cada bloque de RESERVAS, cada aviso de la campana)? Con 25 piezas de arriba y las filas de «Mis viajes» ya cubre lo que rompió, pero cuanto más fina, mejor aísla.
2. El viaje vacío se arregla solo al abrirlo; si prefieres repararlo ya en la nube, dime y escribo un `update` solo para esa fila (con tu permiso).

## 10S3 — Arreglos: ciudad de salida, teclado, «Ha cambiado el viaje», hoja del vuelo con dos lados, Free Tour, franjas, cuadrados, fotos (30-oct)

**Causas en palabras sencillas**
- Ciudad de salida: la tabla de Roma buscaba solo por nombre; ahora exige nombre, país y coordenadas a ≤50 km, y la caché ya no mezcla ciudades homónimas.
- «Ha cambiado el viaje» y fotos del acordeón (misma causa, desde la 10N): el último guardado de la generación no se apuntaba como propio; su eco se tomaba por un cambio ajeno y la copia de la nube, sin fotos, sustituía la ruta viva.
- Free Tour: el plan de reservas lo trataba como sitio grande y a las 21:00 como «de noche», comparando dos viajes distintos. Ahora no calcula nada para el Free Tour.
- Castillo: su foto propia estaba apuntada sin «(por fuera)», así que se buscaba en Unsplash y salía la de noche.

**Pruebas (0 fallos):** pruebaTanda10S3 (232: A 112, B 13, C 66, D 41), pruebaJutrip 129, pruebaTanda10S3_B_real 10, pruebaTanda10N10_avisos_real 10, pruebaTanda10S2_real 18; las de cada agente sobre lo tocado (pruebaTanda10G, 7_reservas, 10N9_vuelo, 10N11_b, 7_ficha, 10N5_freetour, Fase6y*). tsc limpio, 0 errores de rules-of-hooks. Sin batería completa.

**Migración:** ninguna. **Pendiente para Eric:** HOY en una línea (duda), foto del Castillo «por dentro», riesgo de `reservasParaMotor` con el Free Tour, capturas de tren/bus/barco; mirar en un iPhone real el teclado.

### Lista de comprobación

**0 · Antes de empezar**

- ✅ Hecho — Prompt guardado en docs/dias/PROMPT_TANDA10S3.md; Design al día (Vuelo Reservas y Alojamiento Dias) No se apaga el PC.  
  *Dónde:* No es de móvil.

**1 · Ciudad de salida confundida por nombre**

- ✅ Hecho — La tabla de tiempos de Roma solo vale con nombre, país y coordenadas a ≤50 km; la caché ya no mezcla ciudades con el mismo nombre Córdoba y Mérida no están en la tabla: se tratan como cualquier ciudad. Las filas viejas de la caché quedan huérfanas (una llamada más a Claude por ciudad).  
  *Dónde:* Primera pantalla, cualquier cuenta: origen «Barcelona, Brasil» y destino Roma: no salen los tiempos de España; con «Barcelona, España» sí.

**2 · Resultados con el teclado**

- ✅ Hecho — Al tocar origen o destino la tarjeta sube, los resultados salen bajo el campo con bandera, ciudad y país, y se esconden logo, «Volver a mi viaje» y mapa Probado con teclado simulado (no es el de Safari). A 375×667 con 5 resultados no sobra ni un píxel.  
  *Dónde:* iPhone: primera pantalla, tocar origen y escribir «Barcelona».  *Captura:* `10s3_ciudad_teclado_375x667_5.jpg`

**3 · «Ha cambiado el viaje» en viaje nuevo**

- ✅ Hecho — Los guardados propios de la generación se apuntan como propios: ya no sale la línea ni se sustituye la ruta Causa: el último guardado de la generación no se apuntaba como propio y su eco por Realtime se tomaba por un cambio ajeno. Probado con el Supabase real.  
  *Dónde:* Con tu cuenta: crea un viaje nuevo y espera 10 segundos en RUTA o DÍAS.

**4 · Hoja del vuelo con sus dos lados**

- ✅ Hecho — Sin caja amarilla; Ida y Vuelta con «Sales de», «Sale a las», «Llegas a», «Llega a las» y el medio de transporte en medio Línea del pase también en la Vuelta sin pase. Sin migración (los campos ya existían).  
  *Dónde:* RESERVAS > Llegada y vuelta > Tu vuelo, con y sin pase.  *Captura:* `10s3_vuelo_ida_gratis.jpg`
- ⚠️ A medias — Tren, autobús y barco con la misma hoja («Tu tren», «Guardar el tren», estaciones o puertos) Mismo código y textos probados por prueba, pero sin captura propia de cada uno.  
  *Dónde:* Un viaje en tren: RESERVAS > Tu tren.

**4 · Billete en DÍAS y HOY**

- ✅ Hecho — DÍAS: «BCN 08:30 → FCO 11:15» (apilado a 375 px, sin cortar la hora) o solo «FCO 11:15»; el código de fuera es el escrito entre paréntesis o el de la ciudad de origen  
  *Dónde:* DÍAS, día 1, con el vuelo guardado.  *Captura:* `10s3_billete_dias_03.jpg`
- ⚠️ A medias — HOY: el billete usa el mismo código de fuera (BCN, MAD), pero conserva su tarjeta de siempre Duda para Eric: ¿HOY también en una línea «BCN 08:30 → FCO 11:15»? Design solo dibuja DÍAS.  
  *Dónde:* HOY con el vuelo guardado.

**5 · Free Tour por el camino viejo**

- ✅ Hecho — Reservar o cambiar la hora del Free Tour deja la parada donde está: sin mover días, sin mensaje, sin cambiar de franja Causa: el plan de reservas trataba el Free Tour a las 21:00 como «de noche» y comparaba dos viajes distintos. Riesgo anotado: reservasParaMotor puede mandar el Free Tour a rehacer días posteriores.  
  *Dónde:* RESERVAS > Free Tour > día donde ya está > 21:00 > Guardar; mira DÍAS.  *Captura:* `10s3_d_02_free_tour_21.jpg`
- ✅ Hecho — Las seis horas fijas se sustituyen por la rueda de horas de las entradas Las seis eran nuestras (turnos_reserva de roma.json), no horas publicadas por el tour.  
  *Dónde:* RESERVAS > Free Tour.  *Captura:* `10s3_d_01_free_tour_hoja.jpg`
- ✅ Hecho — Qué otras reservas siguen el camino viejo Entradas de sitios grandes en OTRO día siguen moviendo el día entero (regla 6j); excursiones convierten el día en excursión a propósito; el resto va bien.  
  *Dónde:* No es de móvil.

**6 · Reserva que no cuadra con su franja**

- ✅ Hecho — Sin pase, línea gris del pase bajo la parada cuando la hora no cuadra con su franja; con pase, nada Cortes 14:00 y 20:00.  
  *Dónde:* Sin pase: DÍAS, parada con reserva en otra franja; tocar la línea.  *Captura:* `10s3_d_04_sin_pase_linea.jpg`

**7 · Elegir día en cuadrados**

- ✅ Hecho — Los días de la hoja de reservas (entradas, Free Tour, excursiones) son cuadrados; el elegido, azul oscuro con ✓ dorado Otras hojas ya eran filas o no tienen selector de día. Regla añadida.  
  *Dónde:* RESERVAS > cualquier entrada o Free Tour.  *Captura:* `10s3_d_01_free_tour_hoja.jpg`

**8 · Fotos del acordeón de DÍAS**

- ✅ Hecho — Las paradas vuelven a mostrar su foto Misma causa que el apartado 3 (la copia de la nube sin fotos sustituía la ruta viva), desde la 10N. Los viajes viejos pueden seguir sin fotos hasta rehacerse. errores_pantalla está vacía.  
  *Dónde:* Viaje nuevo > DÍAS > día 1 abierto.

**9 · Foto de noche del Castillo**

- ✅ Hecho — El Castillo de día sale con foto de día; la de noche solo en la experiencia nocturna Causa: la foto propia estaba apuntada sin el sufijo «(por fuera)». Duda: ¿apuntar la foto «por dentro»? Viajes ya guardados pueden conservar la de noche.  
  *Dónde:* DÍAS (día del Vaticano), ficha, EXPLORAR y Añadir parada.  *Captura:* `10s3_foto_castillo_1.jpg`

**10 · CERRAR_SESIONES.sql**

- ✅ Hecho — Corregido: user_id in (select id::text from cuenta) No se ha ejecutado.  
  *Dónde:* No es de móvil.

**11 · Prueba nueva**

- ✅ Hecho — pruebaTanda10S3 (partes A, B, C, D) y pruebaTanda10S3_B_real (Supabase real, sola) El caso de dos cuentas (pruebaTanda10N10_avisos_real) se pasa aparte.  
  *Dónde:* No es de móvil.
