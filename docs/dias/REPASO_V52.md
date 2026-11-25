# REPASO V52 (25-nov)

Capturas en `docs/dias/V52_capturas/` (modo iPhone 390x844). Sin pruebas, como se pidió; solo `tsc` y `npm run build`, que pasan.

## Lo que ha cambiado

**1. La parada que ya ha cerrado.** Ya no se va sola a «Lugares pendientes». Sale su tarjeta de siempre con la etiqueta **YA HA CERRADO**, «Cerrado · Abre mañana a las…» en rojo, sin el recuadro de la ubicación, con la historia, y dos botones: **[Pasar a otro día]** (dorado, abre la hoja de siempre) y **[Guardar en pendientes]** (con aviso abajo y [Deshacer]). El aviso de arriba «… ya ha cerrado» ya no existe. CLAUDE.md actualizado. Capturas: `v52_1_museos_cerrados_tarjeta`, `v52_1_pasar_a_otro_dia_hoja`, `v52_1_pasar_a_otro_dia_propuesta`, `v52_1_guardar_en_pendientes_aviso`. Con esto los Museos Vaticanos cerrados se ven como esa tarjeta (el aviso «Hoy ya no puedes entrar» ya no sale para la parada de ahora).

**2. «Has visto Via della Conciliazione».** Sin género. También «Has visto X» al pulsar [Ya lo visité] en Lugares pendientes (antes «marcada como visitada»). No queda ningún «marcado/marcada» que vea el viajero. Captura: `v52_2_has_visto_aviso`.

**3. «Guarda un recuerdo de {sitio}».** Dónde está: es la hoja que sale unos segundos después de pulsar [He terminado] (el aviso «Has visto…» primero). Cuándo sale ahora: **solo** si esa parada no tiene foto tuya y **una sola vez por sitio y viaje**. Antes salía cada vez. (El texto real es «Guarda un recuerdo de…», no «tus recuerdos».) Captura de cómo se ve: `v52_3_guarda_un_recuerdo_hoja`.

**4. El emblema oculto, al llegar.** «¡Aquí se esconde un Emblema Oculto!» sale en cuanto estás en la parada: cuando el GPS dice que has llegado **o** cuando pulsas [Ya he llegado], antes de [He terminado]. Una vez por sitio y día (usa la misma marca que el aviso del servidor, así no salen dos). Capturas: `v52_4_antes_de_llegar` (no sale) y `v52_4_emblema_oculto_al_llegar`.

**5. Sonidos.** Lista de lo que pasa en cada caso:

| Qué | Antes | Ahora |
|---|---|---|
| Pedazos, colecciones, medallas, emblemas, país, patrimonio, viajero, resumen, vuelo, aviso, [Visto] | Suenan (ya estaban en el estudio) | Igual |
| **«Y además…»** (país, destino, Patrimonio, logros de viajero) | Tenía sonido, pero no lo pedía si era la primera pantalla de una ronda que no venía de un [Visto] (cola sin conexión, etc.) | **Arreglado:** si nadie había pedido su sonido, suena al salir |
| **Emblema oculto** (la hoja al llegar) | Ningún sonido | **Añadido al estudio** («Emblema oculto (al llegar al sitio)») con uno provisional (dos latidos y un brillo); suena al abrirse la hoja |
| **Barra de experiencia** («+EXP», nivel, rango) | Ningún sonido | **Añadido al estudio** («La barra de experiencia»), provisional (tics y un brillo); suena al salir cada paso |
| **Dinero volando al presupuesto** | Ningún sonido | **Añadido al estudio** («El dinero vuela al presupuesto»), provisional (un vuuush corto); suena cuando vuela (no con «reducir movimiento») |

Eric: en `/admin/sonidos` están las tres tarjetas nuevas para que les pongas el tuyo.

**5b. Lo que quedó de la V50.** La línea naranja con «Esta **entrada**…» / «Esta **reserva**…» y [Es correcta] ya está en entradas, excursiones y alojamiento (una sola pieza, la misma del vuelo). Capturas: `v52_5b_linea_naranja_entrada`, `_excursion`, `_alojamiento`. Sale cuando el documento es de un día **fuera del viaje** (si es un día del viaje, la reserva se corrige sola como en la V50). Los Museos Vaticanos cerrados: ver punto 1.

**5c. «Lo que te llevas de hoy».** Ya no sale primero «Aún no has ganado nada hoy»: mientras llegan los datos el título queda en blanco (`v52_5c_resumen_cargando`) y luego se llena (`v52_5c_resumen_listo`). Las filas llevan su número y la etiqueta sigue al número («1 País nuevo», «2 Países nuevos»; nunca «0 · Destino nuevo»; las filas a 0 no salen). Captura: `v52_5c_resumen_con_filas`.

**Cuándo sale «Lo que te llevas de hoy», exactamente:** una sola vez por día de viaje, (a) al marcar o saltar la **última parada** del día, o (b) si el día acabó sin marcarla, la **primera vez que abres la app esa noche (desde las 21:00)** o **al día siguiente**. Solo si ese día usaste la app (al menos una parada hecha o saltada). Al volver a entrar no sale otra vez.

## Cosas del diseño (copiadas de pantallas hermanas)
- La tarjeta cerrada es la misma tarjeta de la parada; los botones son el dorado y el marfil de HOY (`BOTON_ORO`, `BOTON_MARFIL`) y la hoja es la de «Pasar a otro día» de Cambiar plan.
- La línea naranja de entradas, excursiones y alojamiento es la misma del vuelo (pieza `LineaNaranjaDeDocumento`).
- Las tres tarjetas de sonido nuevas siguen el formato de «Lo ganado que vuela» del estudio.

## Qué no he podido comprobar
- **Sonidos en el iPhone:** no tengo iPhone ni oído; solo he visto qué sonidos pide la app. Si «Y además…» sigue mudo en el iPhone, el fallo sería del audio del móvil y no de la app.
- **GPS real** (punto 4 y tarjeta cerrada): probado con hora falsa y [Ya he llegado].
- **Lectura real de un documento de otro día** (5b): el aviso lo puse a mano; la lectura necesita el servidor de IA.
- **«Guarda un recuerdo» sin foto / una vez** (punto 3) y **sonidos de EXP y dinero**: hechos en el código, sin captura (necesitan el servidor de logros y una cuenta).
- **No hecho (lo hace el coordinador):** commit, push a main, comprobar jutrip.app y reiniciar el api-server.
