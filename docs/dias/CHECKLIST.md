# CHECKLIST: qué se pidió y qué está hecho (tandas V43 a V50 y la noche del 24-25 nov)

Hecha el 25-nov por un agente que SOLO leyó (no tocó la app). Una línea por cada punto que Eric pidió.

## RECUENTO (una línea por punto: 281 líneas)
- ✅ Hecho y comprobado en pantalla: **149**
- 🟡 Hecho pero sin ver en pantalla: **86**
- ⚠️ A medias: **29**
- ❌ No hecho: **17**
- Esta cuenta se hizo ANTES de la pasada final de la batería y antes de escribir el REPASO de la noche: esas líneas (Parte 3 y «Al final») cambiarán.

**Cómo leerla**
- ✅ = hecho Y visto en una captura. Abrí cada captura que nombro y comprobé que enseña lo que dice. Donde pone «(según NOCHE_HOY.md)» o «(según NOCHE_RESTO.md)» me fío de la nota del agente que la hizo y no la abrí.
- 🟡 = hecho (en el código o con una prueba) pero SIN verlo en pantalla. Ojo: varias capturas se llaman como lo que querían enseñar y no lo enseñan (ver abajo); esas son 🟡, no ✅.
- ⚠️ = a medias. ❌ = no hecho.
- Una regla escrita en CLAUDE.md o una respuesta escrita en un DECISIONES no tiene pantalla: va como ✅ «visto en el archivo».
- **Capturas que NO enseñan lo que dice su nombre** (las traté como no vistas): `V43_capturas/v43_aviso_cerrado.jpg` (no sale ningún aviso), `V43_capturas/v43_hoy_parada.jpg` (enseña la hoja «Hoy ya no da tiempo»), `V44_capturas/v44_dias_franjas.jpg` (la hoja del emblema tapa las filas), `V45_capturas/v45_entrada.jpg`, `v45_excursion.jpg` y `v45_alojamiento.jpg` (las tres enseñan el vuelo, solo cambia la cabecera), `V45_capturas/v45_sin_vuelta.jpg` (solo la cabecera «Falta la vuelta»), `V46_capturas/v46_pasar_a_otro_dia_tercer_dia.jpg` (la lista de días no se ve), `V49_capturas/v49_dia1_antes.jpg` y `v49_dia1_despues.jpg` (no se ven las paradas), `V50_capturas/v50_a1_aviso.jpg` y `v50_a3_no_cabe.jpg` (no enseñan ni el aviso A1 ni la hoja A3), `CATALOGO_capturas/hoy_activa_tu_ubicacion.jpg` (no sale la hoja), `CATALOGO_capturas/reservas_aviso_naranja_documento.jpg` (no sale el aviso naranja), `CATALOGO_capturas/pase_prueba_gastada.jpg` (enseña «¿Qué tal el lunes con HOY?», no «Tu modo Hoy es parte del Pase Roma»).
- **Los dibujos de Design de HOY NO se capturaron esta noche** (la cola de Chrome estuvo ocupada por las baterías): el agente HOY ajustó la app leyendo el código del dibujo y mirando solo la app. Por eso, en la Parte 1 de la noche, «✅» quiere decir «la app se ve bien y como se ajustó», no «comparado a ojo con el dibujo».
- Todas las capturas están en `docs/dias/<tanda>_capturas/` (V4x, NOCHE_HOY, NOCHE_RESTO, CATALOGO, VIAJEROS).

---

## V43 · HOY, «Cambiar plan» y los avisos
- ✅ V43 §1 Regla de las hojas de propuesta apuntada en CLAUDE.md — visto en CLAUDE.md (sección «HOY: las hojas de propuesta…»)
- ✅ V43 §1 Hoja de propuesta con UN formato (texto, un bloque de resumen que no se pulsa, botón dorado que dice lo que hace, [Dejarlo como está] pequeño; sin «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original») — `V43_capturas/v43_retraso.jpg` y `CATALOGO_capturas/hoy_lluvia_plan.jpg`
- 🟡 V43 §1 «Nunca se protege una entrada cuya hora ya pasó» y «nunca se quita si se puede mover» — está en el motor y lo vigila `pruebaV43` (41 comprobaciones, pasó en la V43); sin captura del caso de las 21:19
- 🟡 V43 §2 «Voy con retraso»: ya no corta a 60 min; primero pasar al mejor día con su nombre («Pasamos el Panteón al viernes 27»), con [Ver otra opción] quitarlo, si no cabe en ningún día solo quitar — la captura `v43_retraso.jpg` enseña la hoja con el formato nuevo pero el caso concreto (23b, 23c, nombre del sitio) no se ve
- 🟡 V43 §2 «Es de lo más importante: solo lo quitamos si tú quieres» (solo con imprescindibles) — hecho, sin captura
- ✅ V43 §2 Hoja «Hoy ya no da tiempo a todo» con [Ver lo que queda hoy], [Pasar lo que falta a otro día] y [Dejarlo como está] — `V43_capturas/v43_ya_no_da_tiempo.jpg` (y `V48_capturas/v48_ya_no_da_tiempo.jpg`)
- 🟡 V43 §2 «Tu entrada de las 10:00 en el Coliseo ya ha pasado» dentro de esa hoja — el viajero de Roma lo vio con un error de texto («en Coliseo», sin «el»): `VIAJEROS_capturas/roma_hoy_d2_1900.jpg`; no hay captura sin ese error
- ✅ V43 §3 «Quiero comer ahora»: filtros de restaurantes arriba, mapa con números, cada tarjeta con número, tipo de cocina, minutos a pie, precio, «Abierto hasta las 15:00» y [Elegir] en vez de [Ir aquí] — `V43_capturas/v43_comer.jpg`
- 🟡 V43 §3 «Cierra pronto» en naranja si cierra en menos de una hora; [Todos] sin gelato, café ni aperitivo — hecho, no se ve en ninguna captura
- 🟡 V43 §3 Al elegir un restaurante: «El resto de tu día sigue igual», pasar a otro día lo que choque, sustituir la comida que ya había — está en el motor y en su prueba, pero nadie lo probó pulsando un restaurante en pantalla (DECISIONES_V43 §6)
- ✅ V43 §4 Subtítulos del menú «Guárdala en pendientes y decide luego.» y «Elige otro día de tu viaje que te vaya bien.» — `V43_capturas/v43_menu_cambiar_plan.jpg`
- ✅ V43 §4 Saltar una parada con un toque y [Deshacer] — `V44_capturas/v44_saltar_con_deshacer.jpg`
- 🟡 V43 §4 Saltar una parada con reserva por llegar pregunta «Tienes reserva a las 10:00… puedes perderla» con [No, lo mantengo] y [Saltarlo igual] — hecho, sin captura
- ⚠️ V43 §4 «Al saltar, mira todo el día de golpe» — NO se hizo en la V43; se hizo en la V44 (ver V44 §3)
- ✅ V43 §4 «Pasar a otro día»: lista de días con los cerrados en gris «Cerrado ese día» — `V43_capturas/v43_pasar_dia.jpg` y `V46_capturas/v46_pasar_a_otro_dia_primer_dia.jpg`
- ✅ V43 §4 Al elegir día: la mejor forma en ESE día (o «al final, en Si te sobra tiempo»), [Pasarlo al domingo] y [Elegir otro día], sin [Ver otra opción] — `V50_capturas/v50_a2_hoja.jpg`
- ✅ V43 §4 «Dime si [Ver otra opción] cambia de día» — respondido en DECISIONES_V43 §2 («no cambiaba de día»), visto en el archivo
- ✅ V43 §5 «Añadir un sitio cercano»: mapa, número, foto, minutos, estado («Al aire libre», «Abierto · cierra a las 19:30») y [Elegir]; la etiqueta azul «Lo tienes el lunes 19» — `V43_capturas/v43_anadir.jpg` y `V44_capturas/v44_anadir_sin_ubicacion.jpg`
- ⚠️ V43 §5 «Salen sin fotos» — en las dos capturas el primer sitio (Borgo Pio) sale con un degradado azul en vez de foto
- 🟡 V43 §5 Solo lo abierto ahora (de noche, solo nocturnas y aire libre), nunca un sitio que ya está hoy — hecho y vigilado por `pruebaV43`; sin captura de noche
- 🟡 V43 §5 «Contiene recompensa» solo en esta pantalla y primero; [Quitarlo del {día}] en el resumen; pantalla «A esta hora no queda nada abierto cerca» con [Volver al alojamiento] y [Ver Explorar]; en coche, minutos de coche — hecho, no visto en ninguna captura
- 🟡 V43 §5 Escalón «metro o bus» — se trata como «hasta 30 min en línea recta», sin ruta de metro real (DECISIONES_V43 §7); sin probar a mano
- ✅ V43 §5 «100 Presepi in Vaticano»: fechas comprobadas (8 dic a 6 ene) y no se ofrece como sitio — visto en DECISIONES_V43; hay que revisar las fechas de 2026-27 cuando salgan (decisión 11 abajo)
- ✅ V43 §6 Aviso con [Deshacer] tapando el menú y con lo que ha pasado («Borgo Pio, añadida a tu día») — `V43_capturas/v43_aviso_deshacer.jpg`
- ✅ V43 §6 Aviso sin [Deshacer] arriba, bajo la cabecera — `CATALOGO_capturas/hoy_aviso_arriba_foto_guardada.jpg` y `VIAJEROS_capturas/lanza_d3_1830_han_cerrado_Haria.jpg`
- 🟡 V43 §6 Se van solos a los 5 s o deslizándolos, nunca más de uno (se juntan) — hecho, el tiempo no se ve en una foto
- 🟡 V43 §6 Cada aviso una vez por viaje, día y sitio (no repetir «Panteón ya ha cerrado» al cambiar de pestaña) — `pruebaV43` lo mira (HOY → DÍAS → HOY → RUTA → HOY); sin captura (`v43_aviso_cerrado.jpg` no enseña ningún aviso)
- ✅ V43 §7 «Lugares pendientes»: filas compactas con [Otro día] y «···» — `V43_capturas/v43_pendientes.jpg`
- ✅ V43 §7 [Pasar todos a otros días] en azul oscuro con dorado, con el resumen antes (L4) — `V43_capturas/v43_pendientes.jpg` y `NOCHE_HOY_capturas/pendientes_L4_resumen_despues.jpg`
- ✅ V43 §7 «···» abre Recuperar hoy / Ya lo visité / Quitar (en rojo) — `V44_capturas/v44_pendientes_menu.jpg`
- 🟡 V43 §7 «La lista se ve entera y se baja con la página» — se quitó el tope de altura pero no se comprobó en el móvil (DECISIONES_V43 §5); la captura solo tiene 2 filas
- ✅ V43 §8 Horario «Cerrado ahora · abre a las 8:30» — `V47_capturas/v47_antes_375_cerrado_ahora.jpg`
- ✅ V43 §8 Con ubicación «12 min desde ti» y «¿Ya estás aquí? [Ya he llegado]» — `V44_capturas/v44_aeropuerto.jpg` (la frase) y `V44_capturas/v44_en_la_ruta.jpg` (el [Actualizar])
- ✅ V43 §8 Sin ubicación: minutos del plan y el recuadro «Sin tu ubicación no sabemos cuándo llegas» con [Usar mi ubicación] y [Ya he llegado] — `V46_capturas/v46_parada_plaza.jpg`
- ✅ V43 §8 «Escucha su historia por el camino · 3 min» como un reproductor — `V46_capturas/v46_parada_plaza.jpg`
- 🟡 V43 §8 Mientras suena la historia se queda como hoy (azul), el T3 no se copia — no se ha visto sonando (el Chrome de prueba no tiene audio)
- ⚠️ V43 §8 «En todo HOY: [Usar mi ubicación] o [Actualizar]» — está en la tarjeta de la parada y en una línea aparte, NO en la cabecera de HOY (DECISIONES_V43 §4). Visto: `V48_capturas/v48_hoy_sin_tarjeta.jpg`
- 🟡 V43 §8 Hoja «Activa tu ubicación» si el viajero dijo que no — cambiada en la V44 (ver V44 §7)
- ✅ V43 §8 Lluvia: «aquí tienes una alternativa» + [Ver alternativa] cuando hay plan de lluvia — `CATALOGO_capturas/hoy_lluvia_plan.jpg` (el plan) y `CATALOGO_capturas/hoy_lluvia_aviso.jpg`
- 🟡 V43 §8 Lluvia sin plan: texto que no promete nada; el aviso no sale si esa parte del día ya pasó — hecho, sin captura
- ✅ V43 §9 Un solo botón dorado (el de Design, sin borde #9A7228), escrito una vez en `botonesOro.ts` — regla visto en CLAUDE.md y el dorado igual en todas las capturas de HOY (`NOCHE_HOY_capturas/parada_T1_cerrado_sin_ubicacion_despues.jpg`)
- ✅ V43 §10 `pruebaV43` nueva (41), `pruebaJutrip`, V36 y las de HOY en 0 — en la V43 pasaron; en la pasada 1 de la noche `pruebaV43` no está en rojo. la pasada completa de la noche (25-nov) la deja en verde
- ⚠️ V43 §10 Quedaban 3 fallos viejos: `pruebaTandaHOY2b_D` (1) y `pruebaV36_cliente` (2). `V36_cliente` se arregló en la V44; `HOY2b_D [6]` SIGUE en rojo (decisión 2)
- ✅ V43 §10 REPASO_V43 con capturas, lista de comprobación y qué cambia — `docs/dias/REPASO_V43.html`

## V44 · Lo que Eric vio en el móvil, y DÍAS
- ✅ V44 §1 Fuera del destino (Barcelona): caja con «—» y «Estás lejos» y el recuadro «Estás lejos de Roma. Cuando llegues, contaremos desde donde estés.» sin botones — `V44_capturas/v44_lejos.jpg` y `CATALOGO_capturas/hoy_estas_lejos.jpg`
- ✅ V44 §1 En la ruta: «7 min · Desde ti» con [Actualizar] pequeño en la caja — `V44_capturas/v44_en_la_ruta.jpg`
- ✅ V44 §1 En el aeropuerto o sin ubicación: el tiempo del plan diciendo de dónde («18 min · Desde el centro», «7 min · Desde los Museos Vaticanos…») — `V44_capturas/v44_aeropuerto.jpg` y `V46_capturas/v46_parada_plaza.jpg`
- 🟡 V44 §1 «Nada se va a pendientes ni sale vacío por estar lejos» (también en comer y en añadir un sitio) y «ninguna cifra de más de un día» — `pruebaV44` (43 comprobaciones); la captura de «lejos» no enseña la lista de pendientes
- 🟡 V44 §1 «La app lo nota sola al acercarse, sin botón» — hecho, no probado con un GPS que se mueva (el GPS simulado no emite posiciones, ver `VIAJEROS_ROMA.html`)
- ✅ V44 §2 «Escucha su historia por el camino · 3 min» en azul oscuro desde el principio — `V44_capturas/v44_lejos.jpg`
- 🟡 V44 §2 Al darle al play solo cambia ▶ por ❚❚ y se mueven las ondas — hecho, no se ve en una foto
- ⚠️ V44 §2 La tarjeta con DOS cajas — la V47 la pasó a TRES cajas (ver V47); `pruebaV44` sigue esperando la de dos y está en rojo
- ✅ V44 §3 «Parada saltada» con [Deshacer], abajo, sobre el menú — `V44_capturas/v44_saltar_con_deshacer.jpg`
- 🟡 V44 §3 Quitar, pasar a otro día, pasar todos, recuperar hoy y ya lo visité también con [Deshacer] abajo; juntar solo los de arriba — `pruebaV44`; sin captura de cada uno
- ✅ V44 §3 Al saltar se mira todo el día de golpe: un solo aviso «Han cerrado A, B y C · los tienes en Lugares pendientes» en plural — `VIAJEROS_capturas/lanza_d3_1830_han_cerrado_Haria.jpg` (visto en Lanzarote; el viajero apunta que son pueblos, no sitios que cierran)
- 🟡 V44 §3 La comida del mediodía ya pasada (22:35) sale de «Tu día» — hecho en la V45; sin captura
- ✅ V44 §4 «Lugares pendientes» › «···»: hoja grande con «PARADA» y el nombre, «Recuperar hoy», «Ya lo visité», «Quitar» en rojo — `V44_capturas/v44_pendientes_menu.jpg`
- ✅ V44 §5 «Desayunar cerca de ti» (con [Café] marcado) y «Comer cerca de ti» según la hora — `V44_capturas/v44_desayunar.jpg` y `NOCHE_HOY_capturas/comer_24_sin_ubicacion_despues.jpg`
- 🟡 V44 §5 «Cenar cerca de ti» después de las 17:00 — hecho, sin captura
- ✅ V44 §5 Sin ubicación: «No tienes la ubicación activada · Usar mi ubicación», sin nombrar ningún sitio; el tipo de local («Cafetería», «Trattoria») bajo el nombre — `V44_capturas/v44_desayunar.jpg`
- ✅ V44 §5 Si no hay nada abierto: «A esta hora aún no han abierto. Los más cercanos:» con «Abre a las 7:30» — `V44_capturas/v44_aun_no_han_abierto.jpg`
- 🟡 V44 §5 [Ver todos en Explorar] abajo del todo (EXPLORAR con el filtro Restaurantes) — hecho, el final de la lista no sale en ninguna captura
- ✅ V44 §5 «Añadir un sitio cercano» con la misma línea sin ubicación — `V44_capturas/v44_anadir_sin_ubicacion.jpg`
- ⚠️ V44 §6 Sitios nuevos de Roma — la V45 añadió La Licata, Oppio Caffè y Ciuri Ciuri; FALTAN Gelateria dell'Angeletto (sin horario fiable) y el de Piazza Venezia (Eric tenía que decir cuál). El horario de Oppio no está confirmado. Sin captura (decisiones 8, 9 y 10)
- 🟡 V44 §7 El «mejor día» sin el tope de 7 visitas (cuenta el tiempo) — hecho, sin captura
- 🟡 V44 §7 «Activa tu ubicación» sin pasos, solo texto y [Entendido] — hecho, pero la hoja no se ha visto en ninguna captura (`hoy_activa_tu_ubicacion.jpg` no la enseña); lo debe probar Eric en su iPhone
- ✅ V44 §7 Billete nuevo con QR (llegada), QR dorado/gris con «+» y franja de la tarjeta de embarque — `V48_capturas/v48_dias_con_tarjeta.jpg`, `v48_dias_sin_tarjeta.jpg`, `v48_hoy_con_tarjeta.jpg`, `v48_hoy_sin_tarjeta.jpg` (se hizo en la V48; ver V48 §1)
- ⚠️ V44 §7 El billete de VUELTA («Vuelta · Vuelo XX1234») — no se ve en HOY: el día de vuelta sale vacío (`VIAJEROS_capturas/roma_hoy_d4_1900.jpg`); en DÍAS no hay captura de la vuelta
- ✅ V44 §8 Alojamiento en el mapa (M1-M3): se buscó con Photon/OpenStreetMap, solo en la ciudad del viaje, y se guarda el punto — `V45_capturas/v45_mapa_m2_busqueda.jpg` y `V45_capturas/v45_mapa_m3_hoja.jpg` (hecho en la V45; la V44 comprobó que Mapbox no deja guardar resultados)
- 🟡 V44 §8 «Volver al alojamiento» y los minutos se cuentan desde ese punto; «Cómo llegar» abre el punto; si cae en otra zona se propone la zona — hecho, no visto; el viajero de Roma vio que HOY seguía diciendo «Desde el centro» con el hotel puesto (`roma_hoy_d1_0830.jpg`, duda)
- ✅ V44 §8 «Solo se AÑADE el mapa» (nombre, zona, «¿Para quién es?», dinero y reserva se quedan) — `V45_capturas/v45_mapa_m3_hoja.jpg` (la zona y la dirección siguen en la hoja)
- ✅ V44 §9 Globo grande › [Ver destino]: la página del destino se ve encima — `V44_capturas/v44_globo_ver_destino.jpg`
- 🟡 V44 §9 Al cerrar la página vuelve el globo; probado desde los dos globos, con y sin viaje — `pruebaV44`; no se ve en una captura
- 🟡 V44 §9 `ExtraDaySheet`: «A partir de aquí, el viaje lo eliges tú: monta cada día a tu gusto.» — hecho, sin captura
- 🟡 V44 §9 Día montado por el viajero sin «Hora de comer» ni «Hora de cenar» automáticas; día en blanco con solo [Elegir mis sitios] en azul oscuro y «Día por organizar» — hecho y vigilado por `pruebaV44`; sin captura
- 🟡 V44 §9 Las franjas blancas de `StopConnector` ya no se salen de la tarjeta, «con capturas de todas las filas de un día» — la captura `v44_dias_franjas.jpg` NO enseña las filas (la hoja del emblema las tapa); lo mira `pruebaV44`
- ✅ V44 §9 Las 4 pruebas viejas (`V36_cliente`, `Fase6y_manual`, `10N10_explorar`, `10N_propuesta`) al día — pasaron en la V44; la pasada completa de la noche (25-nov) la deja en verde
- ⚠️ V44 §10 `pruebaV44` nueva (43) — pasó en la V44; en la pasada 1 de la noche está en rojo (espera la tarjeta de antes de la V47: reproductor azul oscuro)
- ✅ V44 §10 REPASO_V44 con capturas y lista — `docs/dias/REPASO_V44.html` (la lista de comprobación DE ESTA TANDA incluye puntos sin captura)

## V45 · RESERVAS y los avisos de toda la app
- ✅ V45 §1 Vuelo: icono del documento gris con «+» junto al lápiz y botón de borde «+ Añade tu tarjeta de embarque» — `V45_capturas/v45_vuelo.jpg`
- ✅ V45 §1 Alojamiento: icono gris con «+» y botón de borde «+ Añade tu reserva» — `NOCHE_RESTO_capturas/alojamiento_despues.jpg`
- ✅ V45 §1 Entrada guardada: icono gris con «+» y «+ Sube tu entrada» — `NOCHE_RESTO_capturas/entrada_despues.jpg`
- ✅ V45 §1 Excursión guardada: icono gris con «+» y «+ Sube tu reserva» — `NOCHE_RESTO_capturas/excursion_despues.jpg`
- 🟡 V45 §1 Con el documento puesto: icono DORADO que abre el código en grande, localizador y «Toca para ampliar» (en entradas, excursiones, alojamiento y vuelo de RESERVAS) — solo se vio el QR dorado del billete de DÍAS (`V48_capturas/v48_dias_con_tarjeta.jpg`), no la tarjeta de RESERVAS con documento
- ✅ V45 §1 «Primero se guarda, después se sube»: las hojas ya no piden el documento — `V45_capturas/v45_hoja_solo.jpg`
- ✅ V45 §2 Cada vuelo guardado se ve ABIERTO (horas grandes, trayecto, lápiz, QR, botón) — `V45_capturas/v45_vuelo.jpg` y `NOCHE_RESTO_capturas/vuelo_despues.jpg` (ida y vuelta)
- 🟡 V45 §2 La vuelta sin poner: línea «Falta añadir la vuelta» que abre la hoja en «Vuelta», sin QR — `V45_capturas/v45_sin_vuelta.jpg` solo enseña «Falta la vuelta» en la cabecera; la línea no se ve
- ✅ V45 §3 Alojamiento «Listo» con hotel y fechas, haya documento o no — `NOCHE_RESTO_capturas/alojamiento_despues.jpg`
- ✅ V45 §3 La dirección una vez: la zona en una línea y la dirección con el mapa pequeño — `V45_capturas/v45_mapa_m3_hoja.jpg`
- 🟡 V45 §3 Con reserva: entrada, salida, teléfono y localizador solo si el documento los trae; sin pase la zona y [Cómo llegar] con candado; la reserva no enciende el «!» de RESERVAS — hecho, sin captura
- ✅ V45 §4 Hoja «Elige día y hora» en viaje solo: días con «En tu ruta», hora, precio y [Guardar la entrada], sin [Añadir tu entrada] ni «Rellenar desde el email» ni textos grises — `V45_capturas/v45_hoja_solo.jpg`
- ✅ V45 §4 En grupo, paso 1 (días y hora con [Siguiente]) — `V45_capturas/v45_hoja_grupo_paso1.jpg`
- ✅ V45 §4 En grupo, paso 2 «Casi lista»: «¿A qué cuenta lo sumamos?» y «¿Quién la ha pagado?» solo con la cuenta del grupo — `V46_capturas/v46_casi_lista_dos.jpg` (la V45 no tiene captura del paso 2)
- ✅ V45 §4 Hoja de la excursión con el mismo patrón — `V49_capturas/v49_excursion_hoja.jpg`
- 🟡 V45 §4 Si al subir el documento trae otro día u otra hora, la app los corrige y lo dice — NO estaba en la V45; se hizo en la V50 (ver V50 §4), sin ver
- 🟡 V45 §4 El contador «X de Y reservadas» cuenta al GUARDAR — lo vigila `pruebaV45` (54); sin captura del antes y el después
- ✅ V45 §5 [Ver todas] abre la página de TODAS las excursiones y actividades (no EXPLORAR), con filtros por tipo (Todo, Excursiones, Free tours, Actividades) — `V45_capturas/v45_ver_todas.jpg` (Lanzarote)
- 🟡 V45 §5 Que esté todo el carrusel (7) en esa página y la de Lanzarote tenga 25; [Ver todas] solo si hay más de las que se ven; el carrusel se queda siempre — `pruebaV45`; la captura solo enseña el filtro «Free tours»
- 🟡 V45 §5 Con excursión en la ruta: [Reservar excursión] + [Ya la tengo]; abajo «¿Ya tienes una? Añádela» / «¿Ya tienes otra? Añádela» — hecho, sin captura
- ✅ V45 §6 Error de fecha en un billete: línea naranja DENTRO de la tarjeta con [Es correcta], sin ventana — `V45_capturas/v45_aviso_fecha.jpg`
- 🟡 V45 §6 Se queda hasta cambiar el documento o pulsar [Es correcta] — hecho, el tiempo no se ve
- ✅ V45 §6 Con [Deshacer] abajo / solo informan arriba — `V43_capturas/v43_aviso_deshacer.jpg` y `CATALOGO_capturas/hoy_aviso_arriba_foto_guardada.jpg`
- ⚠️ V45 §6 «Revisa los avisos de RESERVAS, DÍAS, EXPLORAR y el Perfil, y pon cada uno en su sitio» — solo se movieron «Enlace copiado» y «Foto guardada»; el resto «ya cumplía», sin repaso a fondo (DECISIONES_V45)
- ⚠️ V45 §7 Sitios nuevos de Roma — ver V44 §6 (faltan dos; Oppio sin horario confirmado)
- ⚠️ V45 §7 `HOY2b_D` (1 fallo): «si la vieja es la prueba, ponla al día» — la parte de la foto se puso al día; el fallo [6] del atardecer de Lanzarote SIGUE en rojo (arreglo propuesto, decisión 2)
- ✅ V45 §7 `pruebaV45` nueva (54), `V45_mapa` (45) — pasaron en la V45/V46; la pasada completa de la noche (25-nov) la deja en verde
- ✅ V45 §7 REPASO_V45 con capturas solo y en grupo — `docs/dias/REPASO_V45.html` (en el propio REPASO ponía «Sin captura: En grupo, paso 2» y «el billete no se pudo capturar»; el paso 2 está en la V46 y el billete en la V48)

## V46 · Cinco arreglos tras la V45
- ✅ V46 §1 «¿Para quién es?» devuelto en «Casi lista»: quien la añade sale marcado — `V46_capturas/v46_casi_lista_cuatro.jpg` (Eric marcado; Ana, Luis y Marta sin marcar) y `v46_casi_lista_dos.jpg` (Eric y Ana marcados)
- 🟡 V46 §1 Se puede desmarcar, siempre queda al menos uno; una entrada para dos sale solo en su ruta y su gasto solo entre ellos (comprobado con `aportacionesDelViaje`) — sin captura de la ruta ni del gasto
- 🟡 V46 §1 «¿Para quién es?» sigue en vuelo, alojamiento, coche, entradas y excursiones — vuelo, alojamiento y coche «no se habían tocado»; sin captura
- ✅ V46 §1 Regla «nunca se quita algo que funciona porque no salga en un dibujo» en CLAUDE.md — visto en CLAUDE.md
- 🟡 V46 §2 «Pasar a otro día» nunca ofrece días pasados ni el de hoy — en `v46_pasar_a_otro_dia_primer_dia.jpg` solo salen días desde el domingo (con «Ahora: sábado 17»); el caso de «hoy es el tercer día» (`v46_..._tercer_dia.jpg`) no enseña la lista
- ✅ V46 §2 El día recomendado en su tarjeta con borde dorado, «Te lo recomendamos» encima y su flecha — `V46_capturas/v46_pasar_a_otro_dia_recomendado.jpg`
- ✅ V46 §2 Los días cerrados, en gris con «Cerrado ese día» — `V46_capturas/v46_pasar_a_otro_dia_primer_dia.jpg`
- ✅ V46 §3 El recuadro de la ubicación debajo de las cajas y encima de «Escucha su historia» — `V46_capturas/v46_parada_plaza.jpg`
- ✅ V46 §3 La caja HORARIO sale siempre; en una plaza pone «Abierto» — `V46_capturas/v46_parada_plaza.jpg` y `V47_capturas/v47_antes_plaza.jpg`
- 🟡 V46 §4 «Aquí ganas 1 pedazo» sale a la vez que la tarjeta, sin empujar (la pregunta al servidor se hace en cuanto la parada es la siguiente) — sin captura (depende de la red); el REPASO explica de dónde venía el retraso
- ⚠️ V46 §5 `pruebaV46` nueva (45) — pasó en la V46; en la pasada 1 de la noche está en rojo (5 comprobaciones de la caja HORARIO y los minutos, que cambió la V47)
- ✅ V46 §5 REPASO_V46 con capturas — `docs/dias/REPASO_V46.html`

## V47 · La tarjeta de la parada, antes de llegar y al llegar
- ✅ V47 §1 Tres cajas en una fila (HORARIO, A PIE, VISITA) con el caso más largo («Cerrado ahora · abre a las 8:00», sin ubicación) en 375 px sin cortar texto — `V47_capturas/v47_antes_375_cerrado_ahora.jpg`
- ✅ V47 §1 HORARIO sin horario: «Abierto» y «Sin horario» — `V47_capturas/v47_antes_plaza.jpg`
- ✅ V47 §1 HORARIO abierto: «Abierto» y «Cierra a las 20:00» — `V48_capturas/v48_ya_no_da_tiempo.jpg`
- ✅ V47 §1 HORARIO después del cierre: «Cerrado» y «Abre mañana a las 8:30» — `VIAJEROS_capturas/roma_hoy_d2_1900.jpg` (lo vio el viajero de Roma; el REPASO_V47 decía «no visto»). Ojo: es el Coliseo cerrado como PRIMERA parada a las 19:00 (hallazgo de los viajeros)
- ✅ V47 §1 A PIE con «Desde el centro» / «Desde ti» / «Desde los Museos Vaticanos…» (la parada anterior) — `V47_capturas/v47_antes_plaza.jpg`, `V44_capturas/v44_en_la_ruta.jpg`, `V44_capturas/v44_aeropuerto.jpg`
- 🟡 V47 §1 «Desde el alojamiento» (la primera del día, con alojamiento puesto) — no se ha visto: el viajero de Roma puso el hotel y HOY seguía diciendo «Desde el centro» (duda, `roma_hoy_d1_0830.jpg`)
- ✅ V47 §1 VISITA con el reloj de arena, «30 min» y «Lo que recomendamos» — `V47_capturas/v47_antes_plaza.jpg`
- ✅ V47 §1 Debajo de las cajas: recuadro de la ubicación, historia, y después [Cómo llegar] y [Cambiar plan] — `V47_capturas/v47_antes_plaza.jpg`
- ✅ V47 §2 Al llegar: las tres cajas con «Aquí · Ya has llegado» — `V47_capturas/v47_al_llegar.jpg` y `NOCHE_HOY_capturas/parada_T3_aqui_despues.jpg`
- ✅ V47 §2 Franja dorada «AQUÍ GANAS 1 PEDAZO» con el nombre de la colección y el trozo del sitio en color — `V47_capturas/v47_al_llegar.jpg`
- 🟡 V47 §2 Si da trozos de dos colecciones, el de la primera y «y 1 más» — hecho, sin captura
- ✅ V47 §2 Tres botones con nombre ([Qué ver], [Escuchar historia], [Hacer foto] dorado) y debajo [He terminado], [Necesito más tiempo], «Saltar parada» — `NOCHE_HOY_capturas/parada_T3_aqui_despues.jpg`
- ✅ V47 §3 «La foto de los Museos Vaticanos en la Plaza del Campidoglio: dime de dónde salió» — respondido en DECISIONES_V47 (del montaje de la captura, no de la app); la plaza ya sale con su foto — `V47_capturas/v47_antes_plaza.jpg`
- ❌ V47 §3 `pruebaV47` nueva (tres cajas a 375 px, horario por hora, «Desde…», trozo y botones al llegar, y «cada parada lleva su propia foto») — NO existe: Eric mandó «modo rápido, sin pruebas» a mitad de tanda; nadie la ha escrito después
- ❌ V47 §3 `pruebaV2Hoy` (1 fallo): poner al día o arreglar el aviso «ya ha cerrado · la tienes en Lugares pendientes» — NO se hizo (sin pruebas por orden de Eric); `pruebaV2Hoy` SIGUE en rojo en la noche
- ✅ V47 §3 REPASO corto con antes y después — `docs/dias/REPASO_V47.html`

## V48 · HOY y el día de llegada
- ✅ V48 §1 Billete con QR en DÍAS, primer día, sin la tarjeta de embarque: QR gris con «+» y «+ Añade tu tarjeta de embarque», «LLEGADA · VUELO VY6102», las dos horas y los códigos BCN y FCO — `V48_capturas/v48_dias_sin_tarjeta.jpg`
- ✅ V48 §1 Lo mismo con la tarjeta guardada: QR dorado y «✓ Tarjeta de embarque guardada» — `V48_capturas/v48_dias_con_tarjeta.jpg`
- ✅ V48 §1 Billete en HOY, arriba del día de llegada, antes de la primera parada, sin y con tarjeta — `V48_capturas/v48_hoy_sin_tarjeta.jpg` y `v48_hoy_con_tarjeta.jpg`
- ✅ V48 §1 El billete en HOY ya no sale de 2 px de alto — se ve entero en las dos capturas de HOY
- ⚠️ V48 §1 El billete de VUELTA en HOY («donde hoy sale Llegada al aeropuerto») — el viajero de Roma vio el día de vuelta vacío, sin billete (`VIAJEROS_capturas/roma_hoy_d4_1900.jpg`); el de DÍAS (último día) no tiene captura
- 🟡 V48 §1 QR dorado abre el código a pantalla completa; QR gris lleva a RESERVAS; tocar el resto abre la ficha de llegada; sin número «LLEGADA · {aeropuerto}»; sin pase con candado — hecho, sin ver
- ❌ V48 §2 El día de llegada demasiado corto — no se pudo reproducir en la V48 (el motor daba 6-7 paradas); se encontró y arregló en la V49 (ver V49 §1)
- 🟡 V48 §3 «Hoy ya no puedes entrar a los Museos Vaticanos: la última entrada era a las 18:00» con [Ver solución] — hecho y comprobada la frase con la función; NUNCA se ha visto en pantalla: a las 18:20 la app ya manda los Museos a pendientes (`V48_capturas/v48_aviso_museos_1820.jpg` solo enseña «ya ha cerrado»). El catálogo tampoco pudo provocarlo
- ✅ V48 §3 «Hoy ya no da tiempo a todo» — la hoja se ve en `V48_capturas/v48_ya_no_da_tiempo.jpg`
- 🟡 V48 §3 …sale a 1 h 30 de la hora prevista de la primera parada y una vez al día — hecho; la hora exacta no se puede ver en una foto. El viajero de Roma lo vio salir a las 19:00 y 22:40 y a las 22:00 en Lanzarote (hallazgo)
- 🟡 V48 §3 Una sola hoja cada vez: primero «Navidad en Roma» y al cerrarla esta — hecho; la tarjeta de Navidad se ve (`CATALOGO_capturas/hoy_navidad_tarjeta_temporada.jpg`) pero no la secuencia
- 🟡 V48 §3 Free tour: «Tu Free Tour por Roma de las 10:00 ya ha pasado» (solo las entradas dicen «Tu entrada…») — hecho, no visto
- ✅ V48 §4 EXPLORAR › ficha de un lugar: la barra «Escuchar historia» no tapa el botón [+ Añadir], entero en 375 px — `V48_capturas/v48_explorar_ficha.jpg`
- ✅ V48 §5 Sin pruebas por orden de Eric, solo `npm run build` y capturas — REPASO_V48 lo dice; cumplido

## V49 · El día de llegada al reorganizar y la excursión en otro día
- 🟡 V49 §1 Reproducir por el botón y arreglar el día 1 de 3 paradas (Free Tour por la tarde): ahora 7 paradas con comida y cena — causa y arreglo en DECISIONES_V49; las dos capturas (`v49_dia1_antes.jpg`, `v49_dia1_despues.jpg`) enseñan solo la lista de días (cambia el título a «Free Tour y Plaza de España» y sale «Hemos reorganizado tu día · Deshacer»), no se ven las paradas 13 y 7
- 🟡 V49 §1 [Reorganizar] se va a la primera y no vuelve solo — hecho (`reorganizarDia.ts`); el botón sí se ve (`CATALOGO_capturas/reservas_reorganizar_alerta.jpg`) pero no se ha visto que NO vuelva
- ✅ V49 §2 La hoja de la excursión ofrece TODOS los días completos (jue 26, vie 27, sáb 28 «En tu ruta») y «Es una excursión de día entero: solo se puede hacer un día completo del viaje.» — `V49_capturas/v49_excursion_hoja.jpg`
- ✅ V49 §2 Aviso E1 con fechas: título, día elegido arriba con borde dorado, los demás con «Antes, el …», [De acuerdo] — `V49_capturas/v49_aviso_e1.jpg` y `CATALOGO_capturas/reservas_e1_dias_cambian.jpg`
- ✅ V49 §2 Después, aviso de abajo «Tu excursión a Pompeya, el jueves 26» con [Deshacer], y un solo día de excursión — `V49_capturas/v49_tras_guardar.jpg`
- 🟡 V49 §2 El mismo aviso E1 para las entradas, siempre con fechas, nunca «día 3» — hecho (mismo componente); NO visto con una entrada
- ✅ V49 §3 La tarjeta de la excursión sin «Estación de Termini» ni [Cómo llegar al punto de encuentro] — `NOCHE_RESTO_capturas/excursion_despues.jpg`
- 🟡 V49 §3 El punto de encuentro solo si viene de la API de Civitatis o del bono; revisar todas las de Roma y Lanzarote — la V50 limpió las 8 de Roma (ver V50 §4); sin captura
- 🟡 V49 §3 La hora gris de ejemplo no se guarda («nunca se guarda lo que el viajero no escribe»); sin hora la tarjeta no la enseña — hecho en `HojaDeHora` (todas las hojas con hora); sin captura
- ✅ V49 §4 Sin pruebas por orden de Eric, solo `npm run build` y capturas — cumplido

## V50 · RESERVAS y «Hoy ya no puedes entrar»
- ✅ V50 §0 Regla nueva «nunca se inventa un diseño» en CLAUDE.md — visto en CLAUDE.md
- 🟡 V50 §1 Aviso A1 «Hoy ya no puedes entrar a los Museos Vaticanos…» con el enlace [Pasar a otro día] (y fuera la hoja «Una solución») — NUNCA visto; `v50_a1_aviso.jpg` no lo enseña
- ✅ V50 §1 Hoja A2 «Pasar a otro día» con el texto de arriba, la tarjeta del sitio (foto, nombre, cuándo en gris, fecha en cuadrado oscuro «DOM 18»), la franja verde «Sigue igual: el resto de tu sábado», [Pasarlo al domingo], [Elegir otro día] y [Dejarlo como está] — `V50_capturas/v50_a2_hoja.jpg` (entrando por Cambiar plan; es la misma pieza que usa el aviso)
- 🟡 V50 §1 La MISMA hoja desde el aviso «Hoy ya no puedes entrar» — no visto (depende de ver el aviso)
- 🟡 V50 §1 A3 «no caben en ningún otro día» con [Guardarlos en pendientes] dorado y [Quitarlos del viaje] — hecho; `v50_a3_no_cabe.jpg` NO lo enseña
- ✅ V50 §2 RESERVAS › «Llegada y vuelta» sin vuelos, como Alojamiento: plegado solo la cabecera; abierto «¿Ya tienes vuelo?» [Añadir mi vuelo] y «¿Aún no?» [Buscar vuelos] dentro del bloque — `V50_capturas/v50_llegada_vacia_plegada.jpg` y `v50_llegada_vacia_abierta.jpg`
- ✅ V50 §2 [Añadir mi vuelo] abre la hoja «Tu vuelo» de siempre — `V50_capturas/v50_hoja_tu_vuelo.jpg`
- ✅ V50 §3 Buscador del alojamiento: «Via Nazionale» sale primero como calle (Via Nazionale, 00184 Roma) — `V50_capturas/v50_buscador_campo.jpg`
- ✅ V50 §3 El campo «O escribe la dirección» también busca y da sugerencias — `V50_capturas/v50_buscador_campo.jpg`
- 🟡 V50 §3 «Via Nazionale 22» (Hotel Artemide), «Via del Corso», «Vía della Conciliazione» y «Hotel Artemide» — comprobados a mano contra Photon (DECISIONES_V50); sin captura. Viajes con varias ciudades o islas (Lanzarote) sin comprobar
- ⚠️ V50 §4 Aviso naranja con el nombre del documento — «Esta tarjeta de embarque…» (avión) y «Este billete…» (tren, bus, barco) hechos; «Esta entrada…» y «Esta reserva…» NO están (esas tarjetas no pintan la línea naranja). Sin captura (la del catálogo no enseña el aviso)
- 🟡 V50 §4 La rueda de la hora sin X: se cierra tocando fuera, con Escape o deslizando, sin guardar; quedan la papelera y el ✓ — hecho en `HojaDeHora` (todas las hojas con hora); sin ver. Una prueba (`pruebaTanda10N9_vuelo`) sugiere que elegir los minutos «40» justo después de la hora puede no aplicarse
- 🟡 V50 §4 Al subir una entrada o excursión con otro día u otra hora, la app lo corrige y lo dice con [Deshacer] — hecho (`corregirConElDocumento.ts`); no visto
- 🟡 V50 §4 Entradas en otro día: [Deshacer] cuando el motor termina de recolocar, y deshace todo — hecho; no visto
- ✅ V50 §4 «Datos de las excursiones: dime cuáles has tocado» — respondido en DECISIONES_V50 (las 8 de Roma en `_excursiones.json` y `roma.json`, y `servicio.js`); visto en el archivo. Las 3 de Lanzarote no traen punto ni hora (no se tocaron)
- ✅ V50 §5 Sin pruebas, solo `npm run build` y capturas — cumplido

## Cierre de cada tanda (V43 a V50): subir a main, comprobar jutrip.app, reiniciar api-server
- 🟡 V43 a V50 «push a main sin --force, comprobar producción en modo iPhone, reiniciar el api-server» — los 8 commits (V43 a V50) están en `main` y el último push es anterior al commit de esta noche (`main` va 1 por delante de origin); NO he comprobado jutrip.app ni el reinicio del api-server (no puedo desde aquí)
- 🟡 V43 a V46 «sube la nota `_estado_v4x.md` a la rama `estado` cada 30 minutos» — no puedo comprobarlo desde aquí

---

## NOCHE 24-25 nov · PARTE 1 · El repaso de diseño (dibujos sin capturar; ajustado leyendo su código)
- ✅ Noche 0 Cuadrado de la fecha, uno solo (`CuadradoFecha.tsx`), fondo azul oscuro, día de la semana pequeño y número grandes en dorado, con regla en CLAUDE.md — regla visto en CLAUDE.md; en pantalla en DÍAS: `NOCHE_RESTO_capturas/dias_despues.jpg` (el del día abierto con borde dorado) y en «Pasar a otro día»: `NOCHE_HOY_capturas/pasar_dia_26a_lista_despues.jpg`
- 🟡 Noche 0 El cuadrado en las hojas de elegir día (`HojaDia`), RESERVAS y la tarjeta «Tu día de prueba» (P12) — cambiado (`HojaDia` con la fila elegida marcada y el día bloqueado apagado), sin captura propia
- ⚠️ Noche 0 «Donde haya una fecha en un cuadrado de calendario» — la tira de días de la tarjeta oscura de `HoyDespues.tsx` NO se pasó (los cuadritos translúcidos se perderían sobre el azul); decisión 20
- ✅ Noche 0 Los botones de elegir día («Mar 24», «Jue 26») se quedan — `V45_capturas/v45_hoja_solo.jpg`
- 🟡 Noche 0 «Enséñalo en el REPASO» (el cuadrado de DÍAS con el día abierto marcado) — el REPASO de la noche todavía no está escrito; la captura existe
- ✅ Noche 1 Tarjeta de la parada, antes (T1): tres cajas, recuadro de ubicación marfil con círculo, historia azul con ondas, botones de 52 px — `NOCHE_HOY_capturas/parada_T1_cerrado_sin_ubicacion_despues.jpg`
- ✅ Noche 1 Tarjeta de la parada al llegar (T3): «Ya estás aquí», franja del pedazo, tres botones — `NOCHE_HOY_capturas/parada_T3_aqui_despues.jpg`
- 🟡 Noche 1 T2 (la plaza) — solo existe la captura «antes» (`parada_T2_plaza_antes.jpg`); ajustado, sin ver «después»
- 🟡 Noche 1 «Mientras suena la historia, se queda como hoy» — sin ver sonando
- ✅ Noche 2 «Pasar a otro día» (26a): la lista con el cuadrado de la fecha azul — `NOCHE_HOY_capturas/pasar_dia_26a_lista_despues.jpg`
- ✅ Noche 2 Hoja A2 con la tarjeta del sitio, franja verde, [Pasarlo al {día}], [Elegir otro día], [Dejarlo como está] — `NOCHE_HOY_capturas/pasar_dia_hoja_A2_despues.jpg` (según NOCHE_HOY.md) y `V50_capturas/v50_a2_hoja.jpg` (abierta)
- 🟡 Noche 2 La MISMA pieza para el aviso «Hoy ya no puedes entrar» — no se ha visto ese aviso (ver V50 §1)
- ✅ Noche 3 «Voy con retraso» (23a): resumen con círculos dorado y verde, botones 52/48 — `NOCHE_HOY_capturas/retraso_23a_despues.jpg` (según NOCHE_HOY.md)
- 🟡 Noche 3 «Voy con retraso» 23b y 23c — sin captura
- ✅ Noche 3 «Quiero comer ahora» (24): «Comer cerca de ti» sin ubicación, «No tienes la ubicación activada · Usar mi ubicación», [Elegir] 34 px, mapa 112 px — `NOCHE_HOY_capturas/comer_24_sin_ubicacion_despues.jpg`
- 🟡 Noche 3 «Quiero comer ahora» con ubicación (24b a 24g) — sin captura «después» (solo `comer_24_con_ubicacion_antes.jpg`)
- ✅ Noche 3 «Añadir un sitio cercano» (27a) — `NOCHE_HOY_capturas/anadir_27a_lista_despues.jpg` (según NOCHE_HOY.md)
- 🟡 Noche 3 «Añadir un sitio cercano» 27b a 27f (la fila ya elegida 27c, etc.) — sin captura
- ✅ Noche 4 «Lugares pendientes» L2 (fila abierta) y L4 (resumen y los que no caben) — `NOCHE_HOY_capturas/pendientes_L2_abierto_despues.jpg` (según NOCHE_HOY.md), `pendientes_L4_resumen_despues.jpg` (abierta) y `pendientes_L4_no_caben_despues.jpg` (según NOCHE_HOY.md)
- 🟡 Noche 4 L1 (la lista) y L3 (el menú «···») — sin captura «después» (`pendientes_L3_menu_antes.jpg` solo antes); el menú de la V44-V45 sí se ve: `V44_capturas/v44_pendientes_menu.jpg`
- 🟡 Noche 4 «Volver al alojamiento se queda con su [Cómo llegar]» — no tocado ni mirado
- ✅ Noche 5 Aviso de arriba (A1 «Avisos Arriba»): tarjeta clara con filo dorado e icono — `NOCHE_HOY_capturas/aviso_arriba_A1_despues.jpg` (abierta)
- ✅ Noche 5 Aviso de abajo con [Deshacer] (no cambia) — `NOCHE_HOY_capturas/aviso_abajo_deshacer_despues.jpg` (según NOCHE_HOY.md)
- 🟡 Noche 5 Aviso ámbar de cierre (A1 «Aviso Cierre») pasado al dibujo — no se pudo provocar; sin ver
- ⚠️ Noche 6 Billete (Q1-Q4), en HOY y DÍAS — NO se tocó: vive en `dayDetail/BilleteDeVuelo.tsx`; el dibujo pide la hora a 36 px y la app la tiene a 30. Solo hay capturas «antes» (`billete_Q_con_tarjeta_antes.jpg`, `billete_Q_sin_tarjeta_antes.jpg`)
- ✅ Noche 7 Vuelo (`Reservas Billete`): botón «+ Añade tu tarjeta de embarque» y papelera en la misma fila (ida y vuelta) — `NOCHE_RESTO_capturas/vuelo_despues.jpg` (hecha ANTES de la última corrección del texto en una sola línea; esa corrección no se ha vuelto a ver)
- 🟡 Noche 7 Vuelo con la tarjeta ya guardada (papelera sola, a la izquierda, bajo la línea punteada) — sin captura
- ✅ Noche 8 Alojamiento guardado (A1-A3): botón de borde crema con borde dorado de 46 px — `NOCHE_RESTO_capturas/alojamiento_despues.jpg`
- 🟡 Noche 8 La hoja del alojamiento (`hoja_aloj_despues.jpg` enseña otra pantalla) y «Alojamiento Mapa» M1-M3 — NO comparados con el dibujo en pantalla; sin tocar; los estados del mapa de la V45 sí tienen capturas (`V45_capturas/v45_mapa_m1_hoja.jpg`, `v45_mapa_m2_busqueda.jpg`, `v45_mapa_m3_hoja.jpg`)
- ✅ Noche 8 «La zona y ¿Para quién es? se quedan» — `V45_capturas/v45_mapa_m3_hoja.jpg` (la zona) y `V46_capturas/v46_casi_lista_cuatro.jpg` (¿Para quién es?)
- ✅ Noche 9 Entrada guardada (E1): botón de borde, hora oscura — `NOCHE_RESTO_capturas/entrada_despues.jpg`
- ✅ Noche 9 La hoja de una entrada: crema, título de 28 px, [Guardar la entrada] dorado de 54 px — `NOCHE_RESTO_capturas/hoja_entrada_despues.jpg`
- ✅ Noche 9 Excursión guardada (X5): botón de borde y sin [Cómo llegar al punto de encuentro] — `NOCHE_RESTO_capturas/excursion_despues.jpg`
- 🟡 Noche 9 Entradas E3 a E5 y excursiones X0 a X4, X6 y X7 — NO comparadas en pantalla (solo por código)
- ✅ Noche 9 «¿Para quién es?» en «Casi lista» se queda (hoja de grupo) — `V46_capturas/v46_casi_lista_cuatro.jpg` (de la V46; esta noche no se capturó la hoja de grupo)
- ✅ Noche 10 Aviso de los días que cambian (E1): panel claro, título grande, filas con la elegida con borde dorado, [De acuerdo] dorado — `CATALOGO_capturas/reservas_e1_dias_cambian.jpg` (hecha esta noche; el agente RESTO solo lo comparó con el dibujo por medidas)

## NOCHE · PARTE 2 · Una sola forma para cada cosa (HOY y el resto son dos mundos)
- ✅ Parte 2 Cuadrado de la fecha — pieza `ui/CuadradoFecha.tsx`, los dos mundos, 3 sitios cambiados en el resto (`ListaDeDias`, `DayList` con el día abierto marcado, `HojaDia`) y 2 en HOY — `NOCHE_RESTO_capturas/dias_despues.jpg`
- ✅ Parte 2 X de cerrar una HOJA — pieza `ui/CruzDeHoja.tsx`, los dos mundos, 16 sitios en el resto y 9 en HOY — `NOCHE_RESTO_capturas/hoja_entrada_despues.jpg` y `NOCHE_HOY_capturas/pasar_dia_26a_lista_despues.jpg`
- ⚠️ Parte 2 «Todo lo que lleva X, que sea la misma X» — quedan DOS formas a propósito: la de las hojas (círculo de 40 px) y la de las pantallas completas y mapas (círculo con aro dorado, ver `v44_globo_ver_destino.jpg`); decisión 14
- ✅ Parte 2 Tirador de las hojas — pieza `ui/TiradorDeHoja.tsx` (44×4), 22 barritas en 16 archivos — se ve en `NOCHE_RESTO_capturas/hoja_entrada_despues.jpg`
- ✅ Parte 2 Esquinas de las hojas a 32 px (HOY y el resto, ~29 hojas) — `NOCHE_RESTO_capturas/hoja_entrada_despues.jpg`
- ⚠️ Parte 2 La sombra de detrás de las hojas — en HOY ya es la de Design; en el resto hay unas 12 hojas con otra sombra y desenfoque; NO unificada (decisión 15)
- ✅ Parte 2 Botón dorado en HOY — pieza `BOTON_ORO` (esquinas de 16), ~17 sitios cambiados, sin `btn-champan` ni degradados sueltos — `NOCHE_HOY_capturas/parada_T1_cerrado_sin_ubicacion_despues.jpg`
- ⚠️ Parte 2 Botón dorado en el resto — 12 degradados a mano pasan a `DORADO`, pero siguen DOS sistemas (`BOTON_ORO` en reservas y propuestas, y el champán `BotonHoja` en cuenta, pase y ajustes); decisión 13
- ✅ Parte 2 Botón claro (`BOTON_CLARO`) — pieza común, los dos mundos — `V50_capturas/v50_a2_hoja.jpg` ([Elegir otro día])
- ✅ Parte 2 Botón de borde «+ Añade/Sube…» — pieza `BotonAnadirDocumento estilo="borde"`, un solo componente para vuelo, alojamiento, entradas y excursiones — `NOCHE_RESTO_capturas/entrada_despues.jpg`
- ✅ Parte 2 Botón azul oscuro de HOY (`BOTON_AZUL`) — 7 sitios — `NOCHE_HOY_capturas/pendientes_L4_resumen_despues.jpg` (el de «Pasar todos»; ahí el botón dorado ya es «Pasar los 2 que caben»)
- ✅ Parte 2 Enlace pequeño «Dejarlo como está» (`EnlaceDejarlo`, 4 copias) — `NOCHE_HOY_capturas/pendientes_L4_resumen_despues.jpg`
- ✅ Parte 2 Papelera (`PapeleraRoja`) y lápiz (`LapizDeReserva`) — `NOCHE_RESTO_capturas/entrada_despues.jpg`
- ⚠️ Parte 2 El botón «Ahora no» sale con tres aspectos (borde de 15 px, píldora con borde, texto sin borde) — sin dibujo que lo fije, se dejó (decisión 16)
- ✅ Parte 2 Etiquetas — HOY: `Etiqueta` con 4 tonos (4 sitios); resto: `ui/Etiqueta.tsx` con 3 tonos (5 sitios) — `NOCHE_RESTO_capturas/hoja_entrada_despues.jpg` («En tu ruta») y `NOCHE_HOY_capturas/pendientes_L2_abierto_despues.jpg` (según NOCHE_HOY.md)
- ❌ Parte 2 Los ICONOS y sus círculos — ninguno de los dos agentes dice haberlos revisado; no consta
- ✅ Parte 2 Recuadro de puntos en HOY (`RecuadroDePuntos`, 3 sitios) — `NOCHE_HOY_capturas/parada_T1_cerrado_sin_ubicacion_despues.jpg`
- ✅ Parte 2 Aviso de arriba (una pieza `AvisoArriba`, usada por HOY) y aviso de abajo (`AvisoSobreLaBarra`) — `NOCHE_HOY_capturas/aviso_arriba_A1_despues.jpg`
- ⚠️ Parte 2 `AvisoArriba` es oscuro por defecto en el resto de la app; en HOY se pide claro con filo dorado por un parámetro `estilo`; el resto no se pasó (decisión 19)
- ✅ Parte 2 Tarjetas oscuras de HOY a 26 de esquina (`TarjetaOscura`, tarjeta blanca `CajaBlanca`) — hecho en HOY; sin captura de comparación (solo código)
- ❌ Parte 2 Tarjetas (de parada, de lugar, de reserva), avisos y recuadros de puntos del RESTO — «sin tocar» (0 sitios cambiados, DECISIONES_NOCHE_RESTO)
- ✅ Parte 2 «Apunta en CLAUDE.md cuál es la pieza de cada cosa (archivo y nombre)» — visto en CLAUDE.md (sección «Piezas», 11 líneas)
- ❌ Parte 2 «En el REPASO, una tabla: cada elemento, de HOY/resto/los dos, la pieza y cuántos sitios, con capturas antes y después» — el REPASO de la noche todavía NO está escrito; las tablas están en `NOCHE_HOY.md` y `NOCHE_RESTO.md` y las capturas antes/después en `NOCHE_HOY_capturas/` y `NOCHE_RESTO_capturas/`

## NOCHE · PARTE 3 · Todas las pruebas
- ⚠️ Parte 3 La batería completa a prioridad baja — PASADA 1 terminada: 349 pruebas, 341 corridas (8 del Supabase real saltadas por orden), 33 en rojo de 79 que fallaban en algún momento (`docs/dias/_bateria_estado.md`). (superada por la pasada completa final: ver línea de «hasta que esté en 0»)
- 🟡 Parte 3 Pruebas puestas al día porque lo que cambió fue a propósito (billete V48, alojamiento «Listo», «Día de viaje» / «Día por organizar», excursiones sin datos inventados, hoja «Pasar a otro día», rueda de la hora, puntos de encuentro, ~15 de la hora, etc.) — listado en `DECISIONES_NOCHE_PRUEBAS.md` §6 y §9; (superada por la pasada completa final: ver línea de «hasta que esté en 0»)
- 🟡 Parte 3 Arreglos reales de la app por fallos de pruebas: `ExcursionConBillete.tsx` (el gancho estaba tras un `return`), z-index del calendario 9500 a 9800 (el aviso de «versión nueva» tapaba su botón), candado de `AntesDelViaje.tsx` — hechos, sin captura
- ✅ Parte 3 `pruebaV2Hoy` (el aviso «ya ha cerrado» va arriba) — puesta al día; pasa en la pasada completa final (`docs/dias/_bateria_final.json`)
- ❌ Parte 3 `pruebaTandaHOY2b_D` [6] (en Lanzarote, los sitios del atardecer al aire libre tienen que salir: sale 1) — NO arreglado: el arreglo propuesto toca `hoy/v2/HoyDuranteV2.tsx` (usar `ubicacionReal`); decisión 2
- ⚠️ Parte 3 Las 33 pruebas en rojo tras la pasada 1: 4 de peso al abrir (`pruebaCuentas3`, `pruebaPantallas8b`, `pruebaTanda10S`, `pruebaLogros2`) y 6 que esperan decisión de Eric (`pruebaFase6y10_ficha`, `pruebaTanda6z2`, `pruebaTandaHOY2b_D`, `pruebaRevisionLargos`, `pruebaRevisionRutas`, `pruebaTanda10N5_perfil`); 21 de «diseño en curso» (`pruebaPantallas8c`, `pruebaTanda7_mover`, `pruebaTandaHOY2_B`, `pruebaTandaHOY1_B`, `pruebaV2Hoy`, `pruebaV46`, `pruebaV44`, `pruebaTanda10N9_pantallas`, `pruebaV9`, `pruebaV41_globo`, `pruebaV27`, `pruebaTanda10S5_L`, `pruebaTanda10S8_C`, `pruebaTanda10S3_C`, `pruebaTanda10N11_b`, `pruebaTanda10N6_entradas`, `pruebaTanda10N9_vuelo`, más 2 de temporización `pruebaV13`, `pruebaV40B` y `pruebaTanda10N_reservas` sin repasar). (superada por la pasada completa final: ver línea de «hasta que esté en 0»)
- ⚠️ Parte 3 «Al final, la batería otra vez, hasta que esté en 0 (o solo con lo de DECISIONES)» — pasada completa final: 349 pruebas, 341 corridas (8 del Supabase real saltadas por orden), 122,9 min; quedan 10 en rojo, TODAS en DECISIONES (peso al abrir ×4, restaurantes con «me gusta», € a mano en paginaDestino, páginas de revisión de rutas ×2, Perfil viejo de la V31; ver `DECISIONES_NOCHE_FINAL.md`). Las otras 8 que fallaron por carga pasan solas; `pruebaTandaHOY2b_D` [6] ya pasa (arreglo en `HoyDuranteV2.tsx`).

## NOCHE · PARTE 4 · El catálogo de avisos y momentos (`CATALOGO_AVISOS.html`, 24 con captura, 3 huecos)
- ❌ Parte 4 El pase: «Te queda medio día…» (el día de prueba, a las 12:00) — NO se pudo provocar: la captura de la primera pasada se sobrescribió; falta repetirlo (`catalogo_pase.mjs pregunta`). Se repetirá
- ✅ Parte 4 El pase: franja «Hoy es tu día de prueba» — `CATALOGO_capturas/pase_hoy_es_prueba.jpg`
- ✅ Parte 4 El pase: tarjeta P3 («Mañana es tu día de prueba») — `CATALOGO_capturas/pase_p3_dia_de_llegada.jpg` (el texto de la captura coincide con el catálogo)
- ✅ Parte 4 El pase: tarjeta del día 12 «¿Qué tal ayer con HOY?» — `CATALOGO_capturas/pase_dia_12_que_tal_ayer.jpg`
- ⚠️ Parte 4 El pase: la prueba gastada («Tu modo Hoy es parte del Pase Roma») — la captura `pase_prueba_gastada.jpg` enseña «¿Qué tal el lunes con HOY?», que es otra tarjeta
- ✅ Parte 4 El pase: aviso pequeño «Desbloquéalo con el Pase Roma» — `CATALOGO_capturas/pase_aviso_pequeno.jpg`
- ✅ Parte 4 HOY: «Hoy ya no da tiempo a todo» — `CATALOGO_capturas/hoy_ya_no_da_tiempo.jpg`
- ❌ Parte 4 HOY: «Hoy ya no puedes entrar a…» — NO se pudo provocar (la app manda los Museos a pendientes a las 18:20 antes de enseñar el aviso); solo hay la captura del estado real `hoy_ya_no_puedes_entrar_estado_real.jpg` (enseña «ya ha cerrado»). Se repetirá
- ✅ Parte 4 HOY: fechas especiales — tarjeta «Navidad en Roma» y aviso del 1 de enero — `CATALOGO_capturas/hoy_navidad_tarjeta_temporada.jpg` y `hoy_navidad_avisos_de_fechas.jpg`
- ✅ Parte 4 HOY: la lluvia (aviso y plan) — `CATALOGO_capturas/hoy_lluvia_aviso.jpg` y `hoy_lluvia_plan.jpg`
- ✅ Parte 4 HOY: «Guarda tus recuerdos» y el resumen del viaje — `CATALOGO_capturas/hoy_guarda_tus_recuerdos.jpg` y `hoy_fin_del_viaje_resumen.jpg`
- ✅ Parte 4 HOY: «Estás lejos» — `CATALOGO_capturas/hoy_estas_lejos.jpg`
- ⚠️ Parte 4 HOY: «Activa tu ubicación» — la captura existe pero NO enseña la hoja (solo la tarjeta de la parada); `hoy_activa_tu_ubicacion.jpg`. Se repetirá
- ✅ Parte 4 HOY: aviso de abajo con [Deshacer] y aviso de arriba («Foto guardada») — `CATALOGO_capturas/hoy_aviso_abajo_con_deshacer.jpg` y `hoy_aviso_arriba_foto_guardada.jpg`
- ✅ Parte 4 Logros: los pedazos («Pedazos nuevos» y «Un pedazo nuevo»), el emblema oculto (dos capturas), la barra de experiencia «+405 EXP», «Y además…» (dos), la medalla (bronce), la maravilla («Una maravilla nueva», dos), Patrimonio (Petra) y el final de las 7 maravillas — `CATALOGO_capturas/logros_*.jpg` (12 capturas; el texto de cada una coincide con el catálogo en `_manifiesto.json`)
- 🟡 Parte 4 Logros: «subir de nivel» — la captura de la barra enseña «Nivel 1 800 / 1.000» (no cruza de nivel); el catálogo describe «¡Subes a nivel 2!» sin captura propia
- ⚠️ Parte 4 RESERVAS: el aviso naranja de un documento — la captura existe pero NO enseña el aviso (la tarjeta del vuelo salió plegada); `reservas_aviso_naranja_documento.jpg`. Se repetirá
- ✅ Parte 4 RESERVAS: el mensaje de los días que cambian (E1) — `CATALOGO_capturas/reservas_e1_dias_cambian.jpg`
- ✅ Parte 4 RESERVAS: «Reorganizar» (botón, alerta y «hecho») — `CATALOGO_capturas/reservas_reorganizar_boton.jpg`, `reservas_reorganizar_alerta.jpg`, `reservas_reorganizar_hecho.jpg`
- ✅ Parte 4 Para cada captura: cuándo sale, cuántas veces y si suena (resumen: solo suenan los momentos de logros, la campanita y el [Visto]) — texto de `CATALOGO_AVISOS.html`
- ✅ Parte 4 «No cambies nada de la app para hacer las capturas» — cumplido (usa `__rutaPrueba`, `__horaFalsa`, `__momentos`…)

## NOCHE · PARTE 5 · Esta lista
- ⚠️ Parte 5 `CHECKLIST.md` (esta) y «en el REPASO» — esta lista está hecha; el REPASO de la noche (con la lista dentro) todavía no está escrito

## NOCHE · PARTE 6 · Viajeros de prueba (2 agentes)
- ✅ Parte 6 Viaje a Roma de 4 días (vuelo, alojamiento, una entrada y la excursión), recorrido de la mañana a la noche con capturas en modo iPhone — `VIAJEROS_capturas/roma_hoy_d1_0830.jpg` … `roma_hoy_d4_2240.jpg` (4 horas por día) y `roma_acc_*` y `roma_flu_*` (DÍAS, RESERVAS, EXPLORAR, Perfil, «Cambiar plan»)
- ⚠️ Parte 6 Viaje a Lanzarote de 3 días en coche — el ayudante del viaje de prueba fija 6 DÍAS, no 3; se recorrieron los 6 (`lanza_d1_*` a `lanza_d6_*`)
- ✅ Parte 6 Roma: 17 hallazgos apuntados con su pantalla, hora simulada y cómo repetirlos — `docs/dias/VIAJEROS_ROMA.html`
- ✅ Parte 6 Lanzarote: 23 hallazgos (5 contradicciones, 10 sin lógica, 3 pantallas, 2 que tapan, 3 textos) — `docs/dias/VIAJEROS_LANZAROTE.html`
- ✅ Parte 6 NO arreglar nada — cumplido: nada se ha arreglado, todo apuntado en `docs/dias/VIAJEROS_DE_PRUEBA.html`; lo dudoso va como «duda»
- ❌ Parte 6 Lo que NO se pudo comprobar: sonidos (el Chrome de prueba no tiene audio), «Cambiar plan» hasta el final y «Voy con retraso» en Lanzarote, GPS lejos y en el aeropuerto, DÍAS de los días 3 y 4 de Roma
- 🟡 Parte 6 Hallazgos con más peso a mirar primero (no arreglados): sitios cerrados como primera parada a las 19:00-22:40; día de la excursión que HOY enseña como «Hoy libre»; día de vuelta vacío en HOY; alojamiento «puesto» en RESERVAS pero HOY lo pide; botones flotantes que tapan [Necesito más tiempo] y [Cambiar plan]; «Tu entrada a el Coliseo»

## NOCHE · AL FINAL (lo que se pidió que se hiciera al terminar)
- ❌ Final «El REPASO en palabras sencillas» (capturas, tabla de piezas, cuántas pruebas fallaban, enlace al catálogo, lo que queda para Eric) — todavía no escrito
- ❌ Final Batería en 0, `npm run build` sin errores, `git status` limpio y nada privado, push a origin sin --force — todavía no: `git status` tiene muchos archivos modificados y `main` va 1 por delante; el push va al final
- ❌ Final Comprobar jutrip.app en modo iPhone tras el push — pendiente (va tras el push)
- ❌ Final Cerrar servidores de prueba, los Chrome y los agentes, apuntar cuántos había; reiniciar el api-server; última nota de estado — pendiente
- ❌ Final «Y por último, apagar el PC» (Eric lo pidió en este prompt, vale solo esta noche) — pendiente; NO apagar hasta que todo lo anterior esté hecho
- 🟡 Final Nota `_estado_noche.md` en la rama `estado` al empezar y cada 30 minutos — el archivo existe en `docs/dias/`; no puedo comprobar que se haya subido

---

## Decisiones pendientes de Eric (juntas, sin repetir)
Cada una en una frase con la pregunta. Entre paréntesis, de dónde viene.

**Pruebas y peso**
1. La app pesa 341,2 KB al abrir (tope 340) y 1.029 KB de JavaScript (tope 1 MB): ¿subo el tope, o saco del arranque lo que solo usan el panel de administración y el estudio de sonidos? (`pruebaCuentas3`, `pruebaPantallas8b`, `pruebaTanda10S`, `pruebaLogros2`; DECISIONES_NOCHE_PRUEBAS §1)
2. Los sitios de atardecer cerca de ti en Lanzarote salen 1 en vez de 2 o 3: ¿aplico el arreglo de `HoyDuranteV2.tsx` (contar desde tu ubicación real, no desde la última parada)? (`pruebaTandaHOY2b_D` [6]; DECISIONES_NOCHE_PRUEBAS §2)
3. En los «me gusta» de los restaurantes el corte 21/22 empata (Taverna Trilussa y Sgarro Bistrot): ¿cuál lleva cifra, o pongo 22? (`pruebaFase6y10_ficha`; DECISIONES_NOCHE_PRUEBAS §3)
4. Los precios «desde» de las actividades de la página del destino se escriben en euros a mano: ¿se enseñan siempre en euros (precio de Civitatis) o convertidos a la moneda del viajero? (`pruebaTanda6z2`; DECISIONES_NOCHE_PRUEBAS §4)
5. Las páginas de revisión de rutas (`RUTAS_REVISION*.html`, del 23-oct) ya no coinciden con el motor: ¿las regenero? Necesita Chrome y es el documento que tú revisas. (`pruebaRevisionLargos`, `pruebaRevisionRutas`; DECISIONES_NOCHE_PRUEBAS §9)
6. Tocar fuera de la rueda de la hora cierra SIN guardar (V50): ¿lo dejamos así, o que tocar fuera sí guarde? (DECISIONES_NOCHE_PRUEBAS §9)
7. En un viaje a mano el último día en blanco que pasa de los escritos se llama «Día de viaje»: ¿prefieres «Hoy vuelves a casa» ahí? (`pruebaFase6y7_titulos`; DECISIONES_NOCHE_PRUEBAS §6)

**Datos de Roma**
8. ¿Cuál es el sitio de desayuno de Piazza Venezia que añado? (V44 §6)
9. La Gelateria dell'Angeletto no tiene horario fiable y falta Ciuri Ciuri confirmado en su web: ¿me pasas tú el horario o la dejo fuera? (V44 §6)
10. El horario de Oppio Caffè (7:00-2:00 todos los días) sale de fichas públicas, no de italia.it: ¿me pasas el de italia.it? (V45)
11. «100 Presepi in Vaticano» tiene fechas del 8 dic al 6 ene de 2025-26: ¿las reviso cuando salgan las de 2026-27? El dato dice «revisar en noviembre». (V43 §5)
12. El escalón «metro o bus» de «Añadir un sitio cercano» se cuenta como 30 min en línea recta: ¿hace falta ruta de metro de verdad? (V43 §5)

**Diseño: una sola forma para cada cosa**
13. Dos botones dorados en el resto de la app: el de reservas y propuestas (`BOTON_ORO`: 135°, esquinas de 15, 50 px) y el champán de cuenta, pase y ajustes (`BotonHoja`, 54 px): ¿cuál queda para todo el resto? (DECISIONES_NOCHE_RESTO)
14. La X de cerrar: ¿se quedan las dos formas (hoja de 40 px y pantalla completa con aro dorado) o la misma en todas partes? (DECISIONES_NOCHE_RESTO §2)
15. La sombra de detrás de las hojas: en HOY es la de Design (sin desenfoque), en unas 12 hojas del resto es otra con desenfoque de 6 px: ¿las pasamos todas a la de Design? Tocaría también HOY (`trazo-notice-backdrop`). (DECISIONES_NOCHE_RESTO)
16. El botón «Ahora no» sale con tres aspectos (borde de 15 px, píldora con borde, texto sin borde): ¿cuál es el bueno? (DECISIONES_NOCHE_RESTO)
17. El botón de guardar de las hojas de entrada y excursión pasó del champán al dorado de Design (54 px): ¿lo dejamos así mientras el resto de hojas de cuenta y pase siguen en champán? (DECISIONES_NOCHE_RESTO)
18. La papelera del vuelo va en la misma fila que el botón «+ Añade tu tarjeta de embarque» y, en entradas, alojamiento y excursiones, abajo a la derecha: ¿una sola colocación para todas? (DECISIONES_NOCHE_RESTO)
19. El aviso de arriba (`AvisoArriba`) es oscuro por defecto en toda la app, y en HOY se pidió claro con filo dorado según el dibujo A1: ¿cambio el aspecto por defecto y quito el parámetro especial de HOY? (DECISIONES_NOCHE_HOY §7)
20. La tira de días de la tarjeta oscura «Tu viaje a …» de HOY (después del viaje) lleva cuadritos translúcidos y no usa el cuadrado de la fecha azul porque se perdería sobre el azul: ¿cambio el color de esa tarjeta o se queda así? (DECISIONES_NOCHE_HOY, «Para el coordinador»)
21. En el dibujo del billete (Q1-Q4) la hora va a 36 px y en la app a 30: ¿la subo a 36 px? (NOCHE_HOY.md)
22. En la tarjeta de la parada usé UN solo dorado para [Cómo llegar] y [Usar mi ubicación] (el dibujo T1 trae dos) y [Ya he llegado] con el botón claro de siempre y no el blanco del dibujo: ¿vale? (DECISIONES_NOCHE_HOY §3 y §4)
23. «Hecho» en DÍAS en los días ya pasados aunque no se marcó nada: ¿«Hecho» quiere decir «pasado»? (VIAJEROS_LANZAROTE C5)

**Reservas y avisos**
24. Aviso naranja del documento: «Esta tarjeta de embarque…» y «Este billete…» están; ¿quieres también «Esta entrada…» y «Esta reserva…» (hoy esas tarjetas corrigen el día y la hora sin mostrar la línea naranja)? (V50 §4)
25. Quedan avisos de DÍAS, EXPLORAR y el Perfil sin repasar a fondo: ¿lo pido en otra tanda? (V45 §6)
26. «Activa tu ubicación»: el dibujo trae [Abrir Ajustes] y [Ahora no], pero una web no puede abrir los Ajustes del móvil, así que queda solo [Entendido]. ¿Vale? Y ¿puedes probar en tu iPhone que la hoja se ve bien? (V45; V44 §7)
27. El mapa del alojamiento usa Photon (OpenStreetMap, gratis, sin guardar resultados de Mapbox): ¿te vale, o prefieres Mapbox con `permanent=true` (cuesta; hay que ver el precio)? (V44 §3 y V45)

**Lo que dejaron los viajeros (nada arreglado; dime por dónde empezar)**
28. ¿Qué debe salir en HOY el día de vuelta (hoy sale vacío: sin billete, sin hora del vuelo, sin «haz la maleta»)? (VIAJEROS_ROMA)
29. La hoja «Hoy ya no da tiempo a todo» sale a las 19:00, a las 22:00 y a las 22:40: ¿a última hora debe cerrar el día en vez de ofrecer «Ver lo que queda hoy»? (VIAJEROS_ROMA, VIAJEROS_LANZAROTE L5)
30. Un sitio cerrado hasta mañana sale como «Primera parada» a las 19:00-22:40: ¿qué debe salir en su lugar? (VIAJEROS_ROMA y LANZAROTE L4)
31. Los pueblos (Haría, Teguise) llevan un horario inventado y «cierran»: ¿les quito el horario? (VIAJEROS_LANZAROTE L3)
32. El día de la excursión sale en HOY como «Hoy libre / A tu aire» y se le pueden pasar 10 sitios: ¿es un fallo de cómo se creó el viaje de prueba o de la app? (VIAJEROS_ROMA y LANZAROTE C3, duda)
33. «¿Cómo vais?» (plural) en un viaje de pareja y en uno de uno: ¿cambio a «¿Cómo vas?» como en el resto de textos de «tú»? (VIAJEROS_ROMA, VIAJEROS_LANZAROTE X2)

**Cosas que no son preguntas, solo quedan por hacer**
- Poner al día en la pasada final las pruebas de «diseño en curso» (V44, V46, V2Hoy…) y reescribir `pruebaTanda10N5_perfil` con el Perfil de la V31.
- Escribir `pruebaV47` (no existe) y repasar los colores a mano de `ListaDeDias.tsx` (regla E14).
- Repetir las capturas del catálogo que faltan (medio día, ya no puedes entrar, aviso naranja del documento, activa tu ubicación) y ver en pantalla los avisos A1 y A3 de la V50.


## Añadido tras la pasada final (25-nov)
- ✅ Billete: horas a 36 px (`BilleteDeVuelo.tsx`) — hecho; sin captura nueva (🟡 en pantalla).
- ✅ Aviso de arriba: aspecto claro por defecto (`AvisoArriba.tsx`) — hecho; visto en `NOCHE_HOY_capturas/aviso_arriba_A1_despues.jpg`.
- 🟡 `ListaDeDias.tsx` sin colores a mano; papelera del billete guardado a la derecha; aviso «Guardada…» de la cámara que ahora se va solo — arreglos reales hechos y con sus pruebas en verde, sin captura.