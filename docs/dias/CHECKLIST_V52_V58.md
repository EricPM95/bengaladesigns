# CHECKLIST V52 a V58 (25-nov)

**✅ 129 hechos · 🟡 20 a medias · ❌ 3 no hechos (de 152 puntos).**

Cada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). Todas las tandas se hicieron en modo rápido, SIN pasar pruebas. Detalle y capturas en `REPASO_V52_V58.html`.

## V52 · La parada cerrada, los sonidos y el emblema oculto

- ✅ **0** — Los ~1.200 archivos de docs/dias sin subir
- ✅ **1** — La parada que ya ha cerrado: una sola regla, sale su tarjeta y no se manda sola a pendientes (se ve en: v52_1_museos_cerrados_tarjeta.jpg)
- ✅ **1-etiqueta** — Etiqueta «YA HA CERRADO» en lugar de «SIGUIENTE PARADA»; «Cerrado · Abre mañana…» en rojo (se ve en: v52_1_museos_cerrados_tarjeta.jpg)
- ✅ **1-pasar** — [Cómo llegar] pasa a [Pasar a otro día] (dorado) y abre la hoja de siempre (se ve en: v52_1_pasar_a_otro_dia_hoja.jpg)
- ✅ **1-pendientes** — [Cambiar plan] pasa a [Guardar en pendientes], con aviso de abajo y [Deshacer] (se ve en: v52_1_guardar_en_pendientes_aviso.jpg)
- ✅ **1-sin-ubicacion** — Sin el recuadro de la ubicación y sin «¿Ya estás aquí?»; la historia se queda (se ve en: v52_1_museos_cerrados_tarjeta.jpg)
- ✅ **1-claude** — Actualizar la regla V44 de CLAUDE.md y quitar el aviso de arriba «ya ha cerrado»
- ✅ **2** — Aviso «Has visto Via della Conciliazione» (sin género) (se ve en: v52_2_has_visto_aviso.jpg)
- 🟡 **3** — «Guarda un recuerdo de {sitio}»: solo en una parada sin foto y una vez por sitio — Visto cómo se ve la hoja; la condición (sin foto y una vez por sitio) está en el código pero no la he podido probar de punta a punta porque necesita al servidor de logros con cuenta. El texto real de la hoja es «Guarda un recuerdo de…» (no «tus recuerdos»). La hoja de «pedazo ganado» (que también dice «Guarda un recuerdo…») no se ha tocado.
- ✅ **4** — El emblema oculto sale al llegar (GPS o [Ya he llegado]), antes de [He terminado], una vez por sitio y día (se ve en: v52_4_emblema_oculto_al_llegar.jpg)
- 🟡 **5** — Mirar qué sonido le toca a cada uno y por qué no suena; los que no tengan, al estudio — No tengo iPhone: lo comprobado es qué sonidos PIDE la app (lista en REPASO_V52.md). «Y además…» tenía sonido pero no lo pedía cuando era la primera pantalla de una ronda que no venía de un [Visto]; arreglado. Si en el iPhone sigue sin sonar habrá que mirar el audio del móvil.
- 🟡 **5-ademas** — Sonido de «Y además…» (país, destino, Patrimonio, logros de viajero) — En la demo, antes no pedía ningún sonido cuando era la primera pantalla; ahora pide «viajero». En el iPhone no comprobado.
- ✅ **5-oculto** — Sonido del emblema oculto (se ve en: v52_4_emblema_oculto_al_llegar.jpg)
- 🟡 **5-exp** — Sonido de la barra de experiencia — Hecho en el código (suena al salir cada paso de «+EXP», nivel o rango) y añadido al estudio como «La barra de experiencia»; sin captura ni prueba porque la demo no da EXP.
- 🟡 **5-dinero** — Sonido del dinero volando al presupuesto — Hecho en el código (suena cuando el precio vuela, no con «reducir movimiento») y añadido al estudio como «El dinero vuela al presupuesto»; sin captura ni prueba.
- ✅ **5b** — Lo que quedó de la V50 (se ve en: v52_5b_linea_naranja_entrada.jpg)
- 🟡 **5b-naranja** — Línea naranja del documento en entradas, excursiones y alojamiento con [Es correcta] — La línea se ve bien en las tres tarjetas (también v52_5b_linea_naranja_excursion.jpg y _alojamiento.jpg) y [Es correcta] la quita, pero el aviso lo he puesto a mano: la lectura real del documento necesita el servidor de IA. Solo salta si la fecha del documento NO está en el viaje (si es un día del viaje, la reserva se corrige sola como en la V50). Es una decisión mía: ver DECISIONES_V52.md.
- ✅ **5b-museos** — Captura de la tarjeta cerrada de los Museos Vaticanos (aviso «Hoy ya no puedes entrar» y hoja A3) (se ve en: v52_1_museos_cerrados_tarjeta.jpg)
- ✅ **5c** — «Lo que te llevas de hoy»: no sale vacío primero; números y plurales bien (se ve en: v52_5c_resumen_con_filas.jpg)
- ✅ **5c-cuando** — Cuándo sale exactamente (una sola vez)
- ✅ **6** — Sin pruebas; build sin errores y capturas en modo iPhone de los puntos 1, 2 y 4 (se ve en: v52_1_museos_cerrados_tarjeta.jpg)

## V53 · Todo igual (un solo dorado, una sola sombra, botones de «no», papelera, icono de pendientes…)

- ✅ **1** — Un solo botón dorado (BOTON_ORO) en toda la app; fuera el champán (se ve en: v53_1_cuenta_dorado_y_dos_botones.jpg)
- ✅ **2** — La sombra de detrás de las hojas, la de Design, sin desenfoque, en todas las hojas (se ve en: v53_3_tres_opciones_hoy.jpg)
- ✅ **3-dos-opciones** — Con dos opciones: dos botones iguales lado a lado (dorado y blanco con borde) (se ve en: v53_7b_adaptar_vuelos.jpg)
- ✅ **3-tres-o-mas** — Con tres o más: dorado, blanco con borde debajo y la salida como texto pequeño (se ve en: v53_3_tres_opciones_hoy.jpg)
- ✅ **4** — La papelera de RESERVAS abajo a la derecha en todas las tarjetas, también la del vuelo (se ve en: v53_4_vuelo_papelera.jpg)
- ✅ **5-hecho** — DÍAS: el día pasado que hizo algo sigue «Hecho · 1 foto» / «Hecho · Ver tu día» con ✓ verde (se ve en: v53_5_dias_lanzarote.jpg)
- ✅ **5-ya-paso** — DÍAS: el día pasado sin nada dice «Ya pasó · Ver tu día», sin ✓ verde (se ve en: v53_5_dias_lanzarote.jpg)
- ✅ **6-cabecera** — Icono D «Pin con reloj» en la cabecera de LUGARES PENDIENTES (se ve en: v53_6_cabecera_pendientes.jpg)
- 🟡 **6-tarjeta** — El cuadrado de la derecha de la tarjeta de «Pasar a otro día» cuando va a pendientes — La pieza se ve bien (montada suelta), pero no he llegado a abrir la hoja real «no cabe en ningún día» en una captura: hace falta un viaje donde ningún otro día admita la parada.
- ✅ **6-boton** — El botón [Guardar en pendientes] lleva el icono (se ve en: v53_6_boton_guardar_pendientes.jpg)
- ✅ **6-aviso** — El aviso de abajo «… lo tienes en Lugares pendientes · [Deshacer]» lleva el icono (se ve en: v53_6_aviso_pendientes.jpg)
- ✅ **7-llegada** — RESERVAS › «Llegada y vuelta» plegado: mismo margen que Alojamiento, Entradas y Excursiones (se ve en: v53_7a_llegada_plegada.jpg)
- ✅ **7-reorganizar** — Antes del título de «¿Adaptamos tu primer y tu último día…?» y de toda hoja de Reorganizar, el icono del botón flotante (se ve en: v53_7b_adaptar_vuelos.jpg)
- ✅ **8-reglas** — Reglas nuevas en CLAUDE.md: puntos 1-4 y 6, «se adapta si no se ve», «lo de Roma vale para todos los destinos»
- ✅ **8-lanzarote** — Todo lo común vale para Lanzarote: comprobar al menos un caso allí (se ve en: v53_5_dias_lanzarote.jpg)
- ✅ **9** — Sin pruebas; npm run build sin errores; capturas en iPhone

## V54 · Los avisos de arriba y las entradas en peligro

- ✅ **1-fila** — Arriba, una sola fila compacta (icono, título, sitio en gris, botón) (se ve en: v54_1_un_aviso.jpg)
- ✅ **1-juntar-mismo-tipo** — Los del mismo tipo se juntan en una frase (se ve en: v54_1_dos_del_mismo_tipo.jpg)
- ✅ **1-insignia-mas-x** — Tipos distintos: el más importante con insignia +x (se ve en: v54_1_tres_plegados.jpg)
- ✅ **1-desplegado** — Al tocar +x, lista de todos con su color y «Ocultar avisos» (se ve en: v54_1_tres_desplegados.jpg)
- ✅ **1-sube-el-siguiente** — Al resolverse el de arriba sube el siguiente con su +x (se ve en: v54_1_sube_el_siguiente.jpg)
- ✅ **1-no-se-va-solo** — Ninguno con botón se va solo (se ve en: v54_1_un_aviso.jpg)
- ✅ **1-ver-hoja-pasar** — [Ver] de «Hoy ya no llegas a N sitios» abre «Pasar a otro día» con una tarjeta por sitio (se ve en: v54_1_grupo_hoja.jpg)
- ✅ **1-claude-md** — Regla «los avisos se juntan en uno» sustituida en CLAUDE.md
- 🟡 **2-puntualidades** — Puntualidad en los datos de cada sitio, con su web — Detalle en REPASO_V54.md y DECISIONES_V54.md.
- ✅ **2-estricta** — Estricta: aviso rojo «Si no sales ya, no llegas…» con [Ver solución] (se ve en: v54_1_un_aviso.jpg)
- ✅ **2-libre-cabe** — Libre y el retraso cabe: aviso verde que se va solo (se ve en: v54_2_foro_cabe.jpg)
- ✅ **2-libre-no-cabe** — Libre y ya no cabe todo: aviso amarillo «Vas con retraso» con [Ver cómo queda el día] (se ve en: v54_2_foro_no_cabe.jpg)
- ✅ **2-ya-paso** — Entrada estricta ya pasada: aviso amarillo, sin peligro ni protegerla (se ve en: v54_2_coliseo_ya_paso.jpg)
- ✅ **3-hoja-vieja** — Fuera la hoja vieja «Una solución» (se ve en: v54_3_hoja_coliseo.jpg)
- ✅ **3-primero-dia** — Primero propone pasarlo al mejor día (se ve en: v54_3_hoja_coliseo.jpg)
- ✅ **3-no-cabe** — Si no cabe en ningún día: «Guardarlo en pendientes» (se ve en: v54_3_hoja_no_cabe.jpg)
- 🟡 **3-todas-las-hojas** — Todas las hojas «Una solución» pasadas igual — Solo se vio en captura la de PeligroHoy; las otras dos comparten la misma pieza pero no las he capturado.
- ✅ **4** — Sin pruebas; tsc y build; capturas en iPhone (se ve en: v54_4_lanzarote_peligro.jpg)

## V55 · Todas las hojas que proponen un cambio, con el mismo formato (y la rueda de la hora)

- ✅ **1-regla-claude-md** — Sustituir la regla V43 del bloque de resumen por la nueva en CLAUDE.md y poner al día la tabla de piezas
- ✅ **1-texto-claro-arriba** — Arriba, el texto claro de lo que pasa y por qué (se ve en: retraso_despues.jpg)
- ✅ **1-tarjeta-por-sitio** — Una tarjeta por cada sitio que cambia (se ve en: retraso_despues.jpg)
- ✅ **1-foto-real** — La foto real del sitio, la de su parada (se ve en: retraso_despues.jpg)
- ✅ **1-nombre-y-adonde-va-en-gris** — El nombre y a dónde va, en gris (se ve en: retraso_despues.jpg)
- ✅ **1-cuadrado-otro-dia** — Otro día: el cuadrado de la fecha (se ve en: peligro_despues.jpg)
- ✅ **1-cuadrado-hoy-otra-hora** — Hoy a otra hora: cuadrado con el día de hoy y la hora en el gris (se ve en: retraso_despues.jpg)
- ✅ **1-cuadrado-pendientes** — A pendientes: el cuadrado azul con el icono de pendientes (se ve en: yanodatiempo_despues.jpg)
- 🟡 **1-cuadrado-papelera** — Quitar del viaje: el cuadrado azul con la papelera — Pieza CuadradoQuitar en IconoPendientes.tsx; ver DECISIONES_V55 puntos 6 y 11.
- ✅ **1-mas-de-3** — Más de 3 sitios: 3 tarjetas y «y 5 más» que despliega el resto (se ve en: reorganizar_mas_despues.jpg)
- ✅ **1-franja-verde** — La franja verde con lo que se queda igual (se ve en: anadir_despues.jpg)
- ✅ **1-boton-dorado** — El botón dorado dice la acción; si hay segunda opción, el blanco con borde (se ve en: comer_despues.jpg)
- ✅ **1-no-dejar** — Nunca «dejar» para dos cosas: fuera «¿Lo dejamos?» / «Sí, dejarlo» (se ve en: saltar_despues.jpg)
- ✅ **2-retraso** — Voy con retraso (se ve en: retraso_antes_y_despues.jpg)
- ✅ **2-comer** — Quiero comer ahora (se ve en: comer_antes_y_despues.jpg)
- ✅ **2-anadir** — Añadir un sitio cercano (tarjeta del sitio nuevo con «Hoy a las …») (se ve en: anadir_antes_y_despues.jpg)
- ✅ **2-saltar** — Saltarme esta parada (se ve en: saltar_antes_y_despues.jpg)
- ✅ **2-ya-no-da-tiempo** — Hoy ya no da tiempo a todo (se ve en: yanodatiempo_antes_y_despues.jpg)
- ✅ **2-si-te-sobra** — Si te sobra tiempo (MasTiempo) (se ve en: mastiempo_despues.jpg)
- ✅ **2-horario** — El horario y lo cerrado (se ve en: horario_grupo_antes_y_despues.jpg)
- ✅ **2-quehago** — ¿Qué hago ahora? (propone añadir) (se ve en: quehago_antes_y_despues.jpg)
- 🟡 **2-comovais** — ¿Cómo vais? (si propone cambios) — DECISIONES_V55 punto 9.
- ✅ **2-lluvia** — Plan de lluvia (AvisosDelTiempo y RainAlert) (se ve en: lluvia_lanza_antes_y_despues.jpg)
- ✅ **2-reorganizar** — Reorganizar (ReorganizarHost) (se ve en: reorganizar_antes_y_despues.jpg)
- ❌ **2-reorganizar-aviso-no-cabe** — AvisoNoCabe.tsx — DECISIONES_V55 punto 2.
- ❌ **2-reorganizar-dia** — ReorganizarDia.tsx — DECISIONES_V55 punto 3.
- ✅ **2-ninguna-con-resumen** — Que no quede ninguna hoja con ResumenDeCambios
- ✅ **2-no-se-tocan-propuestas-viajeros** — No tocar las propuestas entre viajeros (PropuestaHost, HojaPropuestaDelDueno)
- ✅ **2-lo-que-no-encaja-en-decisiones** — Lo que no encaje, dejarlo y apuntarlo en DECISIONES con su captura
- ✅ **3-rueda-guarda-lo-que-se-ve** — Al pulsar ✓ se guarda la hora que se ve, aunque no se mueva la rueda (se ve en: rueda_vacia_abierta_despues.jpg)
- ✅ **3-todas-las-ruedas** — Vale para todas las ruedas de hora de la app (se ve en: rueda_lista_abierta_despues.jpg)
- ✅ **3-tocar-fuera** — Tocar fuera sigue cerrando sin guardar
- ✅ **3-hora-gris-solo-no-se-guarda-si-no-se-abre** — La hora gris solo no se guarda si nunca se abrió la rueda
- ✅ **4-sin-pruebas** — No pasar pruebas ni escribir una nueva
- ✅ **4-build** — Antes de subir: npm run build sin errores
- ✅ **4-repaso-capturas** — REPASO corto con una captura antes y después de cada hoja, Reorganizar con más de 3 y una en Lanzarote (se ve en: reorganizar_mas_antes_y_despues.jpg)
- ✅ **4-lanzarote** — Una captura en Lanzarote (se ve en: lluvia_lanza_antes_y_despues.jpg)
- ✅ **4-nota-estado** — Nota _estado_v55.md en la rama estado cada 30 minutos
- ✅ **4-push-y-produccion** — Push de main y comprobar jutrip.app en modo iPhone
- ✅ **4-reiniciar-api** — Reiniciar el api-server al final

## V56 · Arreglos pequeños

- ✅ **1** — El panel y el estudio no pesan a ningún viajero
- ✅ **2** — Sitios del atardecer: GPS o última parada hecha
- ✅ **3** — «Me gusta» de restaurantes con corte en 22
- ✅ **4-pais-moneda** — Al contestar el país, la moneda es la de ese país
- ✅ **4-ajustes** — En Ajustes sale esa moneda y se puede cambiar
- ✅ **4-manda-lo-ultimo** — Manda lo último que dice el viajero
- ✅ **4-precios-desde** — Los precios «desde» con formatearPrecio
- ✅ **5-paginas** — Fuera las 4 páginas RUTAS_REVISION
- ✅ **5-pruebas** — Fuera pruebaRevisionRutas y pruebaRevisionLargos
- ✅ **6** — «Hoy vuelves a casa» en el último día en blanco
- ❌ **7** — 100 Presepi in Vaticano: fechas 2026-27 — sin nota
- ✅ **8** — «Hoy ya no da tiempo» no sale desde las 20:00
- ✅ **9-regla** — Regla nueva en CLAUDE.md: pueblos, calles y plazas no cierran
- 🟡 **9-datos** — Quitar el horario a Haría, Teguise y similares en Roma y Lanzarote — sin nota
- ✅ **10-texto** — «¿Cómo vas?» solo, «¿Cómo vais?» con más personas unidas
- ✅ **10-otros-vosotros** — Revisar los otros textos de HOY con «vosotros»
- ✅ **11** — Modo rápido: tsc, build y capturas

## V57 · El día de la vuelta, el de la excursión y el probador de Reorganizar

- ✅ **1-por-que-vacio** — Por qué salió vacío el día de vuelta
- ✅ **1-con-vuelo-billete** — Con vuelo: el billete de vuelta
- 🟡 **1-con-vuelo-sal-hacia** — Con vuelo: «Sal hacia el aeropuerto a las …» — sin nota
- 🟡 **1-con-vuelo-paradas** — Con vuelo: las paradas que da tiempo a ver — sin nota
- ✅ **1-sin-vuelo** — Sin vuelo: «Añade tu vuelo de vuelta…» con [Añadir mi vuelo]
- ✅ **1-ya-salio** — Vuelo ya salido: «Buen viaje de vuelta» / después del viaje
- 🟡 **1-sin-reorganizar-sin-tiempo** — Aviso «Tu vuelo sale a las … y hoy no te da tiempo» con [Adaptar mi día] — sin nota
- ✅ **1-sin-pase** — Sin pase, con su candado como ahora
- ✅ **2-comprobar-viaje-normal** — Comprobar con un viaje normal si fallaba también
- ✅ **2-dia-excursion** — HOY como día de excursión, nunca «Hoy libre»
- 🟡 **2-no-se-pasan-sitios** — A un día de excursión no se le pasan sitios — sin nota
- ✅ **3-apartado** — Apartado «Probar Reorganizar» en /admin
- ✅ **3-se-elige** — Se elige destino, días, llegada, salida, aeropuerto y Free Tour
- 🟡 **3-linea-motor** — Una línea con lo que decidió el motor y por qué — sin nota
- 🟡 **3-antes-despues** — Primer y último día antes y después, lado a lado — sin nota
- 🟡 **3-casos** — Casos preparados con un toque — sin nota
- ✅ **3-mismo-motor** — Mismo motor de la app, sin copias, sin guardar nada
- ✅ **4-capturas-vuelta** — Capturas del día de vuelta en Roma y Lanzarote
- ✅ **4-capturas-excursion** — Capturas de la excursión en Roma y Lanzarote
- ✅ **4-captura-probador** — Captura del probador con un caso preparado
- ✅ **4-build** — tsc y npm run build sin errores; peso de arranque

## V58 · Lo que encontraron los viajeros de prueba

- ✅ **1-una-funcion** — Una sola respuesta a «¿tiene alojamiento?» en RESERVAS, DÍAS y HOY (se ve en: V58_capturas/1-una-funcion_antes.jpg, V58_capturas/1-una-funcion_despues.jpg)
- ✅ **1-con-alojamiento** — Con alojamiento: nadie lo pide y HOY cuenta «Desde el alojamiento» (se ve en: V58_capturas/1-con-alojamiento_antes.jpg, V58_capturas/1-con-alojamiento_despues.jpg)
- ✅ **1-solo-zona** — Solo con la zona: no cuenta como hecho; HOY cuenta «Desde Costa Teguise» (se ve en: V58_capturas/1-solo-zona_antes.jpg, V58_capturas/1-solo-zona_despues.jpg)
- ✅ **2-que-cuenta-cada-numero** — Decir qué cuenta cada número de la cabecera (se ve en: V58_capturas/2-que-cuenta-cada-numero_antes.jpg, V58_capturas/2-que-cuenta-cada-numero_despues.jpg)
- ✅ **2-texto** — Un texto que se entienda solo (se ve en: V58_capturas/2-texto_antes.jpg, V58_capturas/2-texto_despues.jpg)
- ✅ **2-total-cuadra** — El total cuadra con la lista de abajo (se ve en: V58_capturas/2-que-cuenta-cada-numero_antes.jpg, V58_capturas/2-que-cuenta-cada-numero_despues.jpg)
- ✅ **3** — Dos tarjetas del mismo vuelo el día de llegada (se ve en: V58_capturas/3_antes.jpg, V58_capturas/3_despues.jpg)
- ✅ **4** — La barra «… · Deshacer» que no se va (se ve en: V58_capturas/4_antes.jpg, V58_capturas/4_despues.jpg)
- ✅ **5-regla** — Regla «a el» → «al», «de el» → «del» (se ve en: V58_capturas/5-regla_antes.jpg, V58_capturas/5-regla_despues.jpg)
- ✅ **5-articulos-datos** — Cada sitio con su artículo en los datos (se ve en: V58_capturas/5-regla_antes.jpg, V58_capturas/5-regla_despues.jpg)
- ✅ **5-todos-los-textos** — Buscar todos los textos con un sitio después de «a», «de» o «en» (se ve en: V58_capturas/5-todos-los-textos_antes.jpg, V58_capturas/5-todos-los-textos_despues.jpg)
- ✅ **6-km-coche** — «km a pie» en un día en coche (se ve en: V58_capturas/6-km-coche_antes.jpg, V58_capturas/6-km-coche_despues.jpg)
- ✅ **6-minutos-tabla** — Tabla de minutos de Lanzarote en DECISIONES (sin cambiarlos)
- ✅ **6-ninguna-visita-tras-cierre** — Ninguna visita acaba después de que cierre el sitio
- 🟡 **6-comer-sin-restaurantes** — «Hora de comer» sin restaurantes (jueves y viernes) — sin nota
- ✅ **7-al-momento** — «Guarda un recuerdo» sale al momento (se ve en: V58_capturas/7-al-momento_antes.jpg, V58_capturas/7-al-momento_despues.jpg)
- ✅ **7-solo-en-hoy** — Solo en HOY (se ve en: V58_capturas/7-solo-en-hoy_antes.jpg, V58_capturas/7-solo-en-hoy_despues.jpg)
- ✅ **7-se-cierra-sola** — Se cierra sola al cambiar de pestaña, de día o de viaje (se ve en: V58_capturas/7-solo-en-hoy_antes.jpg, V58_capturas/7-solo-en-hoy_despues.jpg)
- ✅ **8** — Sin pruebas; build sin errores; capturas antes y después



Resumen de los siete archivos DECISIONES_V52 a V58. Entre paréntesis, la tanda de origen.

## 1. Decisiones pendientes de Eric

1. Línea naranja de entradas, excursiones y alojamiento: solo sale si la fecha del documento no está en el viaje. Si sí está, la V50 mueve la reserva y avisa con [Deshacer]. ¿Quieres la línea naranja también en ese caso? (V52)
2. «Guarda un recuerdo de…»: solo se limitó a una vez la hoja de «recuerdo»; la del «pedazo ganado» sigue igual para no perder su celebración. ¿La quieres igual? (V52)
3. Sonidos nuevos PROVISIONALES (emblema oculto, EXP, dinero) para que no queden mudos. ¿Los cambias tú en el estudio o te gustan? (V52)
4. «Y además…» no sonaba en el iPhone; se arregló un hueco, pero no se pudo reproducir el fallo. ¿Sigue mudo en tu iPhone? (V52)
5. Se quitó el aviso «Han cerrado A y B» al saltar (ya no tenía sentido). ¿Lo dejas quitado? (V52)
6. Sombra de las hojas: color negro cálido `rgba(20,16,10,.5)` sin desenfoque, para todas. ¿Es el tono que querías? (V53)
7. «Ahora no» en Fuera de ruta y «Cerca de ti» pasó a dos botones lado a lado. ¿Está bien así? (V53)
8. Las píldoras (Seguir, Comprar…) conservan su forma; solo `BotonHoja` pasa a 52 px y esquinas de 16. ¿Quieres también esquinas de 16 en las píldoras? (V53)
9. Puntualidad sin confirmar, puesta como «estricta»: Roma (Museos Vaticanos, Galería Borghese, Galería Nacional de Arte Moderno, Cúpula de San Pedro, Domus Aurea, Villa Farnesina, San Clemente, Mercados de Trajano, Ara Pacis, Museos Capitolinos, Termas de Caracalla, Doria Pamphilj, Catacumbas de San Calixto, Cripta de los Capuchinos, Free Tour) y Lanzarote (Fundación César Manrique, Haría y Casa-Museo, La Geria, Papagayo, probablemente libres). ¿Confirmas alguno como «libre»? (V54)
10. El Panteón va estricto («máxima puntualidad», pero la web no dice la consecuencia). ¿Lo dejas estricto? (V54)
11. Con varias entradas en peligro, [Ver solución] abre la de la primera y el aviso se recalcula. ¿Te parece bien? (V54)
12. En una entrada ya pasada, [Ver] abre la hoja «Hoy ya no da tiempo a todo». ¿Prefieres otra cosa? (V54)
13. En «Vas con retraso», el sitio en gris ocupa 4 líneas en iPhone por la frase larga. ¿Se acorta? (V54)
14. Avisos que NO pasaron a la fila nueva: cierres de la mañana, «¿Cómo vais?», cerca de ti, instalar avisos, carteles de viento/nubes, día de prueba. ¿Los convertimos? (V54)
15. «Es de lo más importante: solo lo hacemos si tú quieres» sale cuando el sitio es imprescindible (el Arco de Constantino lo es). ¿Está bien? (V54)
16. Lluvia: solo se avisa si hay plan de verdad y mientras «esta tarde» no haya pasado (desde las 21:00; «esta mañana», desde las 14:00). ¿Te valen esas horas? (V54)
17. `AvisoNoCabe` («El Coliseo no cabe el jueves»), Reorganizar este día, «Saltar parada» sin reserva y las propuestas entre viajeros NO usan la hoja nueva (no son propuestas con sitios). ¿Quieres un paso de confirmación con tarjeta en alguno? (V55)
18. «Voy con retraso» en Lanzarote cuando todo cabe: sale texto, franja verde y [Ajustar mi día] sin tarjetas. ¿Debería ni salir la hoja? (V55)
19. «Si te sobra tiempo» y la lluvia («Sale de hoy») usan el cuadrado de PENDIENTES; la papelera queda solo para quitar del viaje. ¿Está bien? (V55)
20. Hoja con más de 3 cambios de hora: una tarjeta por cada una y «y N más» (puede salir larga). ¿Quitamos la tarjeta de lo que solo se corre unos minutos? (V55)
21. Reorganizar: tarjeta «De la parada 5 a la 2 · sábado», botón «Reorganizar mi día» y «Dejarlo como está». ¿Te gusta? (V55)
22. «¿Y si por hoy lo dejáis aquí?» pasó a la hoja común («Terminar el día») y no se vio en pantalla. ¿Lo revisas tú? (V55)
23. Textos del botón dorado cambiados: «Guardarlo en pendientes», «Comer ahora en X» / «Cenar ahora en X»; fuera «Sí, dejarlo» y «¿Lo quitamos?». ¿Los confirmas? (V55)
24. `CuadradoQuitar` (papelera dorada) es una pieza nueva que no se ha visto en pantalla. ¿La damos por buena? (V55)
25. Haría: es un solo sitio de datos para el pueblo y la Casa-Museo; el horario es el de la Casa-Museo. ¿Lo separamos en dos sitios (toca logros, coche, fotos, entradas, puntualidad)? (V56 y V58)
26. 100 Presepi 2026-27: fechas sin publicar; se quedan las de 2025-26 y queda apuntado «revisar en diciembre». ¿Lo revisamos en diciembre? (V56)
27. «Hoy ya no da tiempo» ya no sale desde las 20:00; el tope «22:40» no existe en ningún sitio. ¿Quieres además un tope de 22:40 para otros avisos? (V56)
28. Una sola persona ve «Sin fuerzas» (en vez de «Cansado»), «¿Cómo vas?», «Tómate un respiro», «tienes», «te retrasas». ¿Te gustan? (V56)
29. Moneda sin tasa en nuestro cambio: se queda en euros hasta añadirla a `server/cambio.js`. ¿Quieres ampliar monedas? (V56)
30. Sitios del atardecer con GPS a más de 50 km: se cuentan desde la última parada hecha. ¿Está bien? (V56)
31. «Me gusta»: Taverna Trilussa puesta a 100 y guion `megustaInicial6y10.mjs` ajustado (22 con cifra); no se volvió a correr el guion entero. ¿Lo confirmas? (V56)
32. Borradas las páginas viejas de revisión de rutas; sus generadores y capturas siguen en `scripts/destino`. ¿Los borramos también? (V56)
33. «Tienes el día libre hasta las …» pasó a «Sal hacia el aeropuerto a las …». ¿O prefieres las dos líneas? (V57)
34. Lanzarote sin Reorganizar: no sale la hora de salir ni el aviso «no te da tiempo» (la cuenta del coche es del motor); solo «Devuelve el coche en la T1». ¿Lo hacemos con el motor? (V57)
35. «Buen viaje de vuelta» hasta 2 horas después del vuelo y luego «después del viaje» (las 2 h las puse yo). ¿Son 2 h? (V57)
36. Probador: el caso del motor sale con código sin traducir (`free_tour_con_hora_ya_empezado`) y un texto del motor dice «El el día 1». ¿Se arregla? (V57)
37. Peso de la entrada: 338,4 KB con tope 340 (margen 1,6 KB). ¿Subimos el tope o recortamos? (V57)
38. No se comprobó: último día del probador, Lanzarote en el probador, ni billete/alojamiento dentro de sus tarjetas. ¿Lo miras tú? (V57)
39. Falta pulir el diseño con Design; todo sin commit ni push, sin nota en la rama `estado`, nada visto en jutrip.app. ¿Cuándo se sube? (V56, V57)
40. Hay unos 1.200 archivos viejos de `docs/dias` modificados sin subir; no se tocaron. ¿Qué hacemos con ellos? (V52, V57)
41. Tabla de minutos de Lanzarote (sin cambiar nada): proponen quitar «hasta el atardecer» a El Golfo, Papagayo 180 min por defecto, Salinas de Janubio 30, Montaña Bermeja 20; el resto, igual. ¿Cuáles aplicamos? (V58)
42. Una visita que acabaría tras el cierre se ACORTA hasta el cierre. ¿Prefieres moverla a otra hora u otro día? (V58)
43. Viernes de Lanzarote (vuelta, Arrecife): no hay lista de comida y no se inventa. ¿Escribes la lista o usamos las cenas de Arrecife para el mediodía? (V58)
44. Liken sale todos los días menos el lunes (en duda); Brisa Marina sigue sin salir («sin confirmar»). ¿Confirmas sus días? (V58)
45. Liken, Tacande, El Risco… no tienen coordenadas, así que HOY no los pone «recomendado» con mapa. ¿Se buscan sus coordenadas? (V58)
46. «Desde el alojamiento» sin dirección cuenta desde el centro de la zona. ¿Te vale como medida? (V58)
47. Cabecera de RESERVAS: «día 2 de 3» (sin contar el día de vuelta) y «4 de 7 reservas listas» (cada entrada cuenta una). ¿Es lo que querías? (V58)
48. El aviso de abajo dice «Tu Coliseo, el domingo 18» (sin «entrada»). ¿Lo cambiamos? (V58)

## 2. Pruebas viejas que fallarán (no se pasaron en V52-V58)

- `pruebaV43`: busca el bloque de resumen, «Sí, dejarlo», «Comer en …», «Quitarlo de hoy» y el «Hoy ya no da tiempo» pasadas las 20:00.
- `pruebaV44` y `pruebaV45`: pueden romperse por el probador (V57) y por el texto «Tienes el día libre hasta».
- `pruebaV55`: mira «Cansados», «¿Cómo vais?» sin más gente y «Hoy ya no da tiempo» desde las 20:00.
- `pruebaTandaHOY1_C`, `pruebaTandaHOY2_B`, `pruebaTandaHOY2_C`: buscan cosas que la V55 quitó (`[data-propuesta-resumen]`, `[data-resumen-linea]`, «Sí, dejarlo», `[data-saltar-igual]`, `[data-saltar-cancelar]`, `[data-reorganizar-no]` «Ahora no», `data-cansados-terminar`/`data-cansados-seguimos`).
- `pruebaTandaHOY2b_D`: busca esos mismos textos; además su [6] (atardecer de Lanzarote) usa otra ruta (debería dar 2-3 con la última parada hecha).
- `pruebaTandaHOY2b_E`: busca esos textos y «¿Cómo vais?», «Cansados», «Tomaos un respiro» (ahora, solo, dicen «¿Cómo vas?», «Sin fuerzas», «Tómate un respiro»).
- `pruebaTanda10S7_R`: busca los textos «Comer en …» / «Quitarlo de hoy» y los botones quitados.
- `pruebaFase6y10_ficha`: cuenta restaurantes con cifra y ahora son 22.
- `pruebaFase6y7_titulos`: el último día en blanco de un viaje a mano ya no es «Día de viaje» sino «Hoy vuelves a casa».
- `pruebaTanda6z2`: miraba el «€» a mano de `paginaDestino.ts`, que ya no existe (ahora `precioEnVista`); debería pasar.
- `pruebaCuentas3` y `pruebaPantallas8b`: tope de peso de 340 KB; la entrada pasa a 338,1-338,4 KB, deberían pasar.
- `pruebaTanda11`: lee `_rutasRevision*Viajes.json` (se quedan); solo es aviso por los generadores sin página.
- Pruebas sin nombre en los archivos: las que miran «Tienes el día libre hasta» y la tarjeta de vuelta sin plan (V57), las que usan `DayList` o `DayDetailPanel` (refactorizados para el probador, V57), y las que miran «Pon tu alojamiento…» con solo el hotel, la cabecera de RESERVAS («x de y listo», «2 de 3») y «Tu entrada a el Coliseo» (V58).
