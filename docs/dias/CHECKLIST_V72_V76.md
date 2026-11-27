# CHECKLIST V72 a V76 (27-nov)

**✅ 62 hechos · 🟡 22 a medias · ❌ 0 no hechos (de 84 puntos).**

Cada punto de cada tanda, uno por línea: ✅ hecho (y dónde se ve) · 🟡 a medias (qué falta) · ❌ no hecho (por qué). V72 y V73 en modo rápido; V74, V75 y V76 con pruebas.html`.

## V72 · Los logros más bonitos: la ficha en grande, la página del destino y «Logros de viajero»

- ✅ **1a** — La ficha en grande: UNA pieza para una colección, una medalla o un logro de viajero (F1-F5, F2b, F3b) (se ve en: design_ficha_logros.jpg, F1_app_lanzarote.jpg)
- ✅ **1b** — «Lo conseguido» con foto real, nombre y fecha; «Lo que falta» con la foto real en gris, el día de la ruta o «Sin día en tu viaje», y [Cómo llegar] si es de la ruta de hoy (se ve en: F4_app_roma.jpg)
- ✅ **1c** — La medalla (F3): el grado y lo que falta para el siguiente, con las cuentas reales de «sellos» (se ve en: F3_app_lanzarote.jpg)
- ✅ **1d** — El botón de la vitrina («Llevar a mi vitrina» / «En tu vitrina») arriba a la derecha, solo si está ganado
- 🟡 **1e** — [Compartir] y [Volver a ver] en lo ganado (F2b, F3b); «Es tu título» solo en los logros de viajero (F5) — El dibujo enseña F2 y F3 sin pie y F2b y F3b con pie; la app siempre pone el pie en lo ganado.
- 🟡 **1f** — La misma ficha en «Todos mis logros» (F5), con todo lo que ya hace — F5 enseña una sola fila «lugar · fecha» real, nunca lista de lugares. Iluminar el trozo del emblema al tocar una fila (recuperado del álbum viejo) no se comprobó a mano.
- ✅ **1g** — Los Emblemas Ocultos no salen nunca en la ficha
- ✅ **2** — La página del destino (P1-P2): no se quita nada; la medalla y la colección abren la ficha; la barrita de avance bajo cada colección; «Emblemas secretos» se queda (se ve en: design_fichas_2.jpg, P1_app_lanzarote.jpg)
- ✅ **3a** — «Logros de viajero» en «Todos mis logros» (L1-L2): fuera el círculo de color y la medalla un 15 % más grande, el + y el ✓ iguales, «2 de 3» y la barrita, «Exclusivos» más grandes (se ve en: app_L1_arriba.jpg)
- ✅ **3b** — El panel «Tus logros / Reclamar con tus fotos» tapa HOY y la cámara: fallo de la app, arreglado
- ✅ **3c** — Reglas nuevas en CLAUDE.md: un agente nunca hace git stash/restore/checkout ni cierra los Chrome de otro; el script de subida incluye TODO lo cambiado
- ✅ **4** — Pasar solo pruebaTandaHOY1_B y pruebaJutrip; build sin errores
- ✅ **5** — Subir lo que quedó sin subir: las páginas de Design de docs/diseno/proyecto y la captura hoy2b_reto_3_4.jpg
- ✅ **6** — Build sin errores; push a main; producción

## V73 · HOY cuando ya has visto todo («Todo visto por hoy»)

- ✅ **1a** — El orden de HOY con el día acabado: cabecera, tarjeta de cierre, alojamiento, reto (solo si se puede hacer hoy), ¿Qué hago ahora?, TU DÍA, «Hasta aquí, hoy», MAÑANA, «Si te sobra tiempo» y «Lugares pendientes» (se ve en: AC1_design.jpg, LAC1_app.jpg)
- ✅ **1b** — Fuera «Sin tu ubicación no sabemos cuándo llegas» cuando ya no queda ninguna parada
- ✅ **2a** — La tarjeta de cierre nunca vacía: con atardecer «Hoy has visto el atardecer · Un cierre perfecto en …»; sin atardecer «Has hecho N paradas hoy · Lo mejor: …» (se ve en: AC2_design.jpg, LAC2_app.jpg)
- ✅ **2b** — La franja «Ver el resumen del día ›» abre el mismo ResumenDia de siempre
- ✅ **2c** — El título del resumen pasa a «Resumen del día» y «Resumen de ayer»
- ✅ **2d** — Las etiquetas con los números reales («6 paradas», «2 colecciones avanzan»)
- ✅ **3a** — El Reto del día: el hueco de la foto nunca vacío (el dibujo de la colección con sus pedazos) (se ve en: LAC1_app_abajo.jpg)
- ✅ **3b** — El número y el texto dicen lo mismo («La Geria: falta tu foto»); por qué salía 0
- 🟡 **3c** — Con el día acabado el reto solo sale si aún se puede hacer hoy (un sitio cerca y abierto ahora, con [Añadir a mi día]) — «Abierto ahora» exige horario conocido con 30 minutos de margen o un sitio sin horario en los datos; «cerca» es el del servidor (de cualquier parada de hoy). No probado con el servidor real.
- ✅ **4a** — MAÑANA como Hoy Completa: título «Mañana, viernes 27 · La Graciosa» (sin «(excursión)») y debajo sus líneas con icono (se ve en: lanza_sinreserva_app.jpg)
- ✅ **4b** — La primera línea de MAÑANA: «Sales a las 8:10» (reserva), «Ferry de las 10:00 desde Órzola» (por libre), «Aún no tienes la reserva de La Graciosa» con [Añadir tu reserva], o «Empiezas por …» (se ve en: lanza_conreserva_app.jpg)
- 🟡 **4c** — El consejo (de los datos, nunca inventado) y el tiempo de mañana si hay aviso — El viento o las nubes en una excursión no dan línea (los umbrales miran sitios del día y una excursión no tiene paradas); el viento dice el sitio y no «en el norte»; no existe un campo consejo escrito a mano. Una petición /api/tiempo/horas al enseñar la tarjeta, sin bucle (~1 KB, caché de 3 h), con comentario V36.
- ✅ **4d** — Al tocar la tarjeta, DÍAS abierto en mañana (se ve en: lanza_tocar_manana_app.jpg)
- 🟡 **5a** — «Pon tu alojamiento para volver con un toque»: [+ Añadir] como BOTON_CLARO; con el día acabado sube detrás de la tarjeta de cierre; con alojamiento, el [Volver al alojamiento] de siempre — BOTON_CLARO es marfil con borde dorado, no el blanco con borde fino del dibujo. Hay tres VolverAlAlojamiento en HoyDuranteV2 (día de excursión, día acabado, día en marcha); los dos últimos son excluyentes y el primero es otra rama: no sale duplicado.
- ✅ **5b** — RESERVAS: el bloque «Coche» siempre debajo de «Entradas y Free Tour» y encima de «Excursiones y actividades» (se ve en: lanza_reservas_coche_app.jpg)
- 🟡 **6** — Roma y Lanzarote, con y sin alojamiento y con la excursión de mañana sin y con reserva — RAC2 y RAC3 (Roma, atardecer visto y sin él) son de antes de arreglar «desdel» y RAC2 todavía lo muestra; la recaptura de Roma se quedó muy lenta. No se probó un viaje viejo de Supabase.
- ✅ **7** — Bug extra arreglado: «desde el» salía como «desdel» en toda la app
- ✅ **8** — Build sin errores; arranque bajo el tope; push a main; producción

## V74 · Las decisiones de Eric: excursiones, motor, restaurantes y HOY

- ✅ **1a** — Excursiones desde Roma y Civitatis: Pompeya 149, Florencia 3742, Tívoli 146; Nápoles en tren y Costa Amalfitana ninguna
- ✅ **1b** — Radios de las zonas de Lanzarote (4, 4, 3,5, 4, 10 y 9 km) y «Instalarse» (Roma 60, Lanzarote 20)
- 🟡 **2a** — Vuelo tarde (V68): un imprescindible o el Free Tour que no cabe el día de llegada entra en el mejor día siguiente; sale lo MENOS importante a Lugares pendientes — En el viaje denso de la app (13/18/17 paradas por día) los Vaticanos siguen en pendientes. Algo con reserva y hora fija sigue yendo a pendientes con su reserva (la entrada es para esa fecha): excepción a tu frase literal. Se sacan hasta 8 paradas de un día por UNA importante (MAX_SACADOS). El Free Tour se coloca a la hora del hueco (p. ej. 16:40), que puede no existir como tour.
- ✅ **2b** — (34) Lanzarote sin Reorganizar: la hora de salir al aeropuerto y el aviso «Tu vuelo sale a las … y hoy no te da tiempo a todo» los calcula el motor de coche, una vez (se ve en: lanza_ultimo_dia_antes.jpg, lanza_ultimo_dia_despues.jpg)
- 🟡 **2c** — (42) Una visita que acabaría después del cierre: si queda con más de la mitad se acorta; si no, va a otro día y si no cabe a Lugares pendientes — Lo de «a otro día» automático NO está: cada día se monta por separado. Propuesta: que cambioMinimo use mejorDia también para estos.
- ✅ **2d** — (41) Minutos de Lanzarote: El Golfo sin «hasta el atardecer», Papagayo 180, Salinas de Janubio 30, Montaña Bermeja 20
- 🟡 **2e** — (V68_V71-7) Al generar un viaje con vuelo, la misma regla que Reorganizar, no «el día 1 pasa al día 2» — NO cambiado el motor de generación: tocarlo sin el barrido de 365 no es seguro. Propuesta: generar sin el vuelo y aplicar propuestaDeVuelos + ponerDiasAdaptados al crear, y pasar el barrido.
- ✅ **2f** — (V68_V71-12) El sitio que sale por el viento o la lluvia va de verdad a Lugares pendientes (con [Deshacer])
- 🟡 **2g** — (V68_V71-17) Marcar los «de camino» con passThrough (Roma y Lanzarote); salen los primeros de un día, sin aviso — Piazza in Piscinula no existe en los datos. En Lanzarote solo cumple ese sitio («saliendo hacia Teguise»). roma.json cambió y puede afectar a pruebaListas.
- ✅ **3a** — (44) Un restaurante sin horario o sin días confirmados ya no se esconde: «Revisa el horario» (se ve en: lanza_revisa_horario_app.jpg)
- 🟡 **3b** — (43) La comida del último día en Arrecife con los restaurantes de Arrecife que abren a mediodía — No se encontraron datos fiables de 3 o 4 restaurantes más y no se añadió nada (candidatos en DECISIONES_V74). Entre semana solo 2 o 3 sitios seguros. No visto en la app.
- 🟡 **3c** — (45) Coordenadas reales de Liken, Tacande, El Risco y los demás sin coordenadas — Sin encontrar: Liken, Tacande, El Risco y unos 20 más. Mapbox necesita .env.local (los agentes no lo abren): lo puede pasar Eric con lanzaroteRestaurantes.mjs.
- 🟡 **4a** — (35) Después del último vuelo: el resumen del viaje sale 2 horas después de «Ya en el aeropuerto» o, si no, 2 horas después de la hora del vuelo de vuelta — Sin capturar. Si el viajero estuvo en el aeropuerto a las 14:00 y el vuelo es a las 17:00, el resumen sale en cuanto despega (17:00), no a las 16:00.
- ✅ **4b** — (36) El probador: traducir free_tour_con_hora_ya_empezado y arreglar «El el día 1»
- ✅ **4c** — (48) El aviso de abajo «Tu entrada del Coliseo, el domingo 18», igual que el título de la hoja E1 (se ve en: roma_aviso_coliseo_app.jpg)
- 🟡 **5a** — (27) El fundido de las fotos también en las filas pequeñas, la galería y las fotos de personas — Las «fotos de personas» no existen: el Avatar no usa foto.
- ✅ **5b** — (29) Borrar la rama «oculto» de HojaDelVisto
- ✅ **5c** — (13, 6, 8, 11, 14, 15, 16, 18, 19, 20, 23, 24, 28, 30, 31, 46, 47) se quedan como están; (21) el medio «coche» de verdad, más adelante
- 🟡 **5d** — «Si te sobra tiempo»: captura en HOY y en DÍAS, en Roma y en Lanzarote, con qué es y de dónde salen sus sitios — En los viajes de prueba el motor no dejaba ningún sitio ahí, así que se movió uno a mano: las capturas no son de un caso real del motor.
- ✅ **6** — Para el fin de semana de pruebas (solo apuntar): (37) app rápida, Supabase al doble, (38) probador, barrido de 365
- 🟡 **7** — Pruebas del motor y de reservas en 0 fallos; arreglo de un fallo real (vuelo de llegada y de vuelta a la vez); las cuatro pruebas de RESERVAS que fallaban — pruebaTandaLL_LZ: 2 fallos («vuelta desde el norte, vuelo 15:00 y 17:30: la mañana sale vacía») que dan igual con el código anterior. pruebaListas en muestra (12 fechas, 25.887 viajes): 42 fallos de la regla [orden] en D1-FT y D4, anteriores a la V74 (con y sin los passThrough salen los mismos), sin causa confirmada. El barrido de 365 no se lanzó (6-7 h).
- ✅ **8** — Migraciones: quitar cualquier «sin aplicar» (Eric comprobó que todas están aplicadas de la 0065 a la 0095)
- ✅ **9** — Build sin errores; arranque bajo el tope; push a main; producción

## V75 · «+ Añadir una reserva» (tren, autobús, ferry, otra) y los tres iconos de cada tarjeta

- ✅ **1a** — El botón «+ Añadir una reserva» ancho de borde dorado (BOTON_CLARO) debajo de la tarjeta «X de N reservas listas» (se ve en: R1a_design.jpg, R1a_app.jpg)
- ✅ **1b** — La hoja «Añade una reserva» (R2): la frase y la cuadrícula de 9 con los iconos de RESERVAS; Vuelo, Alojamiento, Entrada, Excursión y Coche abren SU hoja de siempre (se ve en: R2_design.jpg, R2_app.jpg)
- ✅ **2a** — Vuelo en un viaje de un solo destino: con la ida puesta abre «Tu vuelo de vuelta»; con las dos, «Ya tienes tus vuelos» con [Cambiar la ida] y [Cambiar la vuelta] (se ve en: R7a_design.jpg, R7a_app.jpg)
- ✅ **3a** — Ferry, tren, autobús y otra: campos, día deslizando, hora con la rueda, localizador y precio opcionales (se ve en: R3_design.jpg, R3_app.jpg)
- 🟡 **3b** — En grupo: «Siguiente» y el paso «Casi lista» (¿A qué cuenta?, ¿Para quién es?, ¿Quién la ha pagado?); el precio entra en el presupuesto y los gastos — En grupo el precio sale en el paso 2 (como las entradas) y el dibujo R3g lo pone en el paso 1.
- ✅ **4** — Un bloque por tipo nuevo (Ferry, Tren, Autobús, Otras reservas) con «1 guardado», al final y antes de «Útil para el viaje» (se ve en: R6_design.jpg, R6_app.jpg)
- 🟡 **5a** — Los tres iconos (QR, lápiz, papelera) arriba a la derecha de TODAS las tarjetas; la papelera ya no va abajo — El coche no tiene QR ni archivo de reserva: el icono es el de la reserva (dorado si hay código escrito). En la cabecera del vuelo la fecha baja debajo de la píldora «IDA». Lanzarote no tiene vuelo en el viaje de prueba.
- 🟡 **5b** — La hoja de confirmar al tocar la papelera (D1-D2): «¿Seguro que quieres eliminar tu vuelo de ida?» y «Se borrará de tus reservas y no se puede deshacer.» — La hoja dice «no se puede deshacer» pero borrar sigue mostrando un aviso con [Deshacer] unos segundos (quitarConDeshacer); además el [Deshacer] devuelve la reserva pero no su billete. Decisión abierta. La hoja usa el fondo #FFFDF8 de Hoja, no el #FBF3E2 del dibujo.
- ✅ **5c** — Un PDF grande de varias páginas: que se lean todas las páginas, como UNA lectura
- ✅ **6a** — pruebaV75 en Roma y en Lanzarote con los casos pedidos
- ✅ **6b** — Pasar las pruebas de reservas, pruebaV36, pruebaJutrip y el build
- ✅ **7** — Build sin errores; push a main; producción

## V76 · Unir una reserva a la excursión, la llegada o la vuelta; las escalas del vuelo

- ✅ **1a** — Unir a una excursión (R5): un ferry, tren o autobús que cae el día de una excursión pregunta «¿Es para tu excursión a La Graciosa?» con [Sí, unirlo a la excursión] y [No, guardarlo aparte] lado a lado (se ve en: R5_design.jpg, R5_app.jpg)
- ✅ **1b** — Si se une: cuenta como la reserva de la excursión («Isla La Graciosa» pasa a hecha en «X de N»), se ve dentro de su ficha y ida y vuelta pueden ser dos billetes
- 🟡 **1c** — HOY, la tarjeta de la excursión (R9): «SALIDA · Órzola», una fila por billete con QR dorado o gris con «+», [Cómo llegar] — La tarjeta sale sin comprobar el pase (la excursión vieja ya salía siempre): decisión tuya. DÍAS no enseña los billetes unidos del día de excursión.
- ✅ **1d** — La tarjeta MAÑANA dice «Sales a las 10:00 · Ferry desde Órzola»
- ✅ **2a** — Unir a la llegada o la vuelta (R11): un tren o autobús pregunta «¿Es para ir del aeropuerto a tu alojamiento?» / «¿Es para ir al aeropuerto?» (se ve en: R11_design.jpg, U1_roma_app.jpg)
- ✅ **2b** — RESERVAS (R11c): dentro de «Llegada y vuelta», debajo de su vuelo, «TREN AL CENTRO» / «TREN AL AEROPUERTO» con sus tres iconos (se ve en: R11c_design.jpg, U2_roma_app.jpg)
- ✅ **2c** — HOY, la llegada (V62) solo gana la fila «Leonardo Express · 14:35 · Fiumicino → Termini» con su QR (se ve en: R11a_design.jpg, U3_roma_app.jpg)
- ✅ **2d** — HOY, la vuelta (V70): la caja AEROPUERTO dice «Leonardo Express · 14:35», debajo la fila con su QR, y SALIR sale de la hora del tren (se ve en: R11b_design.jpg, U4_roma_app.jpg)
- ✅ **2e** — Un tren unido a una llegada que sale antes de aterrizar (8:30 con vuelo a las 11:15) también avisa con «Revisa las horas»
- ✅ **3a** — Una reserva extra en su día (R10): sale en HOY y en DÍAS por su hora con SALE / LLEGA y la fila con su QR (se ve en: R10_design.jpg, R10_app.jpg)
- ✅ **3b** — Si choca con paradas de ese día: aviso de arriba «Revisa las horas · Ferry a Fuerteventura · choca con una parada» [Ver]; al guardar, la hoja A1 «Revisa las horas»
- 🟡 **4a** — Las escalas: en la hoja «Tu vuelo», «+ Añadir escala» añade un tramo (compañía, número, de dónde a dónde, hora de salida y de llegada con la rueda) — R8 no está copiado al píxel: usa las cajas de hora de siempre (CampoDeHora) en vez de la rueda abierta por tramo. No se calcula la duración de la escala ni se avisa de «escala muy corta».
- ✅ **4b** — En RESERVAS cada tramo es su tarjeta («IDA · 1 DE 2», «IDA · 2 DE 2») con su propia tarjeta de embarque, su QR y sus tres iconos (se ve en: R8b_design.jpg, E1_roma_app.jpg)
- ✅ **4c** — El motor y HOY usan la llegada del ÚLTIMO tramo y la salida del PRIMERO; el QR de HOY es el del tramo que toca a esa hora; un viaje sin escalas no cambia nada (se ve en: E3_roma_app.jpg)
- ✅ **5a** — pruebaV76 (el ferry unido, el tren unido a la vuelta, el ferry no unido que choca, el vuelo con escala): pura, Roma y Lanzarote
- 🟡 **5b** — Pasar pruebaV75, las de llegada y vuelta, la de la V68, pruebaJutrip, y el build — Cuatro pruebas viejas actualizadas: pruebaTanda7_vuelta (se regrabó la huella dorada: 9 hashes nuevos; solo dice «cambió», no «está bien»), pruebaTanda7_unificado, pruebaTandaHOY1_A y HOY2_A (con la condición de «Tu día» relajada y deslizar en vez de la X de los avisos: pierden algo de rigor). El barrido de 365 no se pasó. Con la API de Lanzarote visible no se corrió pruebaJutrip.
- ✅ **6** — Build sin errores; push a main; producción



(Cada una, con su pregunta y mi propuesta. Migraciones: todas aplicadas hasta la 0095; ninguna tanda de esta noche necesitó una nueva.)

## Cosas tuyas
1. **Probar en el iPhone lo que no pude ver:** la ficha en grande de una colección/medalla/logro (quitar de la vitrina, iluminar el trozo al tocar una fila); «Tus logros» tras «Saltar todo» con la cámara abierta; «Revisa las horas» encima del formulario; subir un archivo real a «+ Sube tu billete» de ferry, tren, autobús y a una escala; un PDF grande de varias páginas en «Subir todas a la vez»; un invitado (viaje de otra persona) con ferry y tren unidos. Propuesta: el fin de semana de pruebas.
2. **Lo del fin de semana de pruebas (V74 §5):** app rápida (medir la apertura de cada pantalla), Supabase al doble de lo que debería, lo que falta del probador y el barrido de 365. Propuesta: el barrido de 365 esta noche o mañana (6 a 7 horas de CPU), porque se tocó el motor en la V61, V63, V67, V68 y V74.

## V72 · Logros
3. En la ficha, F2 y F3 salen sin pie en el dibujo y F2b y F3b con pie; la app pone siempre [Compartir] y [Volver a ver] en lo ganado: ¿lo dejamos? Propuesta: sí.
4. «Lo que falta» conserva [Añadir a mi viaje] en los sitios sin día (el dibujo no lo enseña): ¿lo dejamos? Propuesta: sí (regla V46).
5. Un día de la ruta que ya pasó con el sitio sin ver sale como «Sin día en tu viaje», no «En tu ruta · domingo 11»: ¿bien? Propuesta: sí.
6. «A mi aire» sale con «0 de 1» (como el dibujo): ¿lo quitamos? Propuesta: dejarlo.
7. «Tus logros» ya no se abre sola si hay algo del Visto abierto, y eso afecta también al flujo legítimo de «Reclamar con tus fotos»: ¿bien? Propuesta: sí, y que se abra al cerrar lo abierto.
8. Las fotos de Lanzarote no cargan para un viajero normal mientras Lanzarote siga oculto (`/api/place-photo`): ¿lo habilitamos cuando se publique el destino? Propuesta: sí, con el destino.

## V73 · HOY con el día acabado
9. La franja dorada de la tarjeta de cierre usa el degradado del dibujo, no `BOTON_ORO`: ¿lo cambiamos? Propuesta: `BOTON_ORO` si prefieres una sola forma de dorado.
10. «Lo mejor:» sale «las Montañas del Fuego, La Geria y sus bodegas y El Golfo…»; Design pone «Timanfaya»: ¿añadimos un nombre corto a los datos de Lanzarote? Propuesta: sí, dime los nombres cortos.
11. El viento o las nubes en una excursión no dan línea en MAÑANA (los umbrales miran paradas); y el viento dice el sitio y no «en el norte»: ¿añadimos una zona a los datos? Propuesta: sí.
12. «Aún no tienes la reserva» y el ferry con hora no salen a la vez en MAÑANA: ¿añadimos el ferry como segunda línea? Propuesta: sí.
13. El consejo «Lleva el bañador…» es una frase fija ligada a `tiempo_de_playa`; no hay campo escrito a mano: ¿quieres escribir los consejos por excursión? Propuesta: sí, un campo `consejo` en los datos del día.
14. [+ Añadir] del alojamiento es `BOTON_CLARO` (marfil con borde dorado), no el blanco del dibujo: ¿bien? Propuesta: sí, una sola pieza.

## V74 · Tus decisiones
15. Los Museos Vaticanos y el Free Tour con un vuelo tarde: en el viaje denso de la app siguen yendo a Lugares pendientes (ningún día tiene sitio); se sacan hasta 8 paradas de un día por UNA importante (`MAX_SACADOS`): ¿lo bajamos o lo subimos? Propuesta: dejarlo en 8 y probar con viajes reales.
16. Algo con reserva y hora fija sigue yendo a pendientes con su reserva, no a otro día (la entrada es para esa fecha): ¿bien? Propuesta: sí; moverla solo si el viajero confirma el cambio de fecha.
17. El Free Tour se coloca a la hora que sale por hueco (16:40), que puede no existir como tour: ¿redondeamos a las horas reales (10, 12, 15, 17, 19, 21)? Propuesta: sí, con `freeTourHoras.js`.
18. Visita que acabaría después del cierre: se acorta o sale a pendientes, pero no «a otro día» solo: ¿lo hacemos? Propuesta: sí, que `cambioMinimo` use el mejor día también para estas.
19. Generar un viaje con vuelo sigue con «el día 1 pasa al día 2» (V61): ¿lo cambiamos? Propuesta: generar sin el vuelo y aplicar la regla de Reorganizar al crear, y pasar el barrido de 365 antes.
20. El día 1 de Lanzarote (El Golfo sin «hasta el atardecer») acaba hacia las 16:50 sin atardecer: ¿añadimos «Atardecer en El Golfo» como parada? Propuesta: sí.
21. Comida del último día en Arrecife: solo 2 o 3 sitios seguros entre semana (Malecón, Tasca La Raspa, Cala, Lilium); Cala sin coordenadas; Malecón: nuestros datos dicen miércoles a lunes y una guía dice jueves a martes: ¿me dices tú los restaurantes de Arrecife que conoces? Propuesta: sí, y yo les busco coordenadas y horario.
22. Coordenadas: 5 restaurantes con fuente (Photon); sin encontrar Liken, Tacande, El Risco y unos 20 más (Mapbox necesita `.env.local`, que los agentes no abren): ¿lo pasas tú con `lanzaroteRestaurantes.mjs`? Propuesta: sí.
23. Resumen del viaje tras el último vuelo: si estuviste en el aeropuerto a las 14:00 y el vuelo es a las 17:00, sale cuando despega (17:00), no a las 16:00: ¿bien? Propuesta: sí.
24. Florencia: el 3742 va en «Florencia en tren» y «Florencia y Pisa» (142547) conserva el suyo: ¿bien? Propuesta: sí.
25. Fundido de fotos: no hay «fotos de personas» (el Avatar no usa foto); queda fuera lo demás ya aplicado: ¿bien? Propuesta: sí.
26. «Si te sobra tiempo» en HOY y DÍAS: en los viajes de prueba el motor no deja ningún sitio ahí, así que las capturas son de un caso movido a mano: ¿lo miras tú en un viaje real? Propuesta: sí.
27. El medio «coche» de verdad en el motor (V62-13): apuntado para más adelante. Propuesta: después del barrido de 365.

## V75 · Añadir una reserva
28. En grupo el precio de un ferry/tren sale en el paso 2 (como las entradas) y el dibujo R3g lo pone en el paso 1: ¿cuál? Propuesta: el paso 2, como las entradas.
29. Obligatorios: día, hora de salida y «De»/«A» (o el nombre en «Otra»); la naviera o compañía es opcional: ¿bien? Propuesta: sí.
30. La hoja de borrar dice «no se puede deshacer» pero sigue saliendo un aviso con [Deshacer] unos segundos, y ese [Deshacer] devuelve la reserva pero no su billete: ¿cambiamos el texto o el borrado? Propuesta: quitar el [Deshacer] de estas tarjetas y que la hoja diga la verdad.
31. «Alojamiento» desde «Añadir una reserva» abre el del primer tramo sin hotel; no hay segundo hotel en el mismo tramo sin cambiar el modelo: ¿lo cambiamos? Propuesta: más adelante.
32. R5 y R8 a R11 del dibujo: se hicieron en la V76; ¿falta algo de R5 (la hoja de unir sobre RESERVAS)? Propuesta: dejarlo.
33. El coche no tiene QR ni archivo; el icono es el de su reserva (dorado si hay código escrito): ¿bien? Propuesta: sí.
34. Un PDF de más de 20 páginas solo lee las 20 primeras y una lectura de 20 páginas cuesta unos 3 céntimos con Haiku: ¿bien? Propuesta: sí.

## V76 · Unir y escalas
35. «Choca» = salida→llegada (sin llegada, 1 hora) pisa la hora + duración de una parada, sin margen: ¿ponemos un margen de 15 minutos? Propuesta: sí.
36. La tarjeta de la excursión con ferry sale sin comprobar el pase: ¿candado sin pase? Propuesta: dejarla como la excursión vieja.
37. La hoja «Tu vuelo» con escala usa las cajas de hora de siempre y no la rueda abierta por tramo del dibujo R8: ¿la copiamos al píxel? Propuesta: no hasta que la veas.
38. No se calcula la duración de una escala ni se avisa de «escala muy corta»: ¿lo añadimos? Propuesta: sí, un aviso por debajo de 60 minutos.
39. DÍAS no enseña las escalas ni los billetes unidos del día de excursión: ¿los añadimos? Propuesta: sí, en la próxima tanda.
40. Un invitado no edita las escalas y sus ferry/tren unidos no salen en HOY ni DÍAS: ¿bien? Propuesta: comprobarlo con una cuenta real antes de decidir.

## Pruebas y datos
41. La huella dorada de `pruebaTanda7_vuelta` se regrabó (9 hashes nuevos, las otras 55.249 comprobaciones no cambian): solo dice «cambió», no «está bien»: ¿la revisamos con el barrido de 365? Propuesta: sí.
42. `pruebaTandaHOY1_A` y `HOY2_A` pierden algo de rigor (la condición de «Tu día» se relajó y se desliza en vez de la X de los avisos): ¿bien? Propuesta: sí.
43. `pruebaListas` en muestra da 42 fallos de la regla [orden] (D1-FT y D4) anteriores a la V74, y `pruebaTandaLL_LZ` 2 («la mañana sale vacía»): ¿los investigamos? Propuesta: sí, con el barrido de 365; sospecho de la V61 (Free Tour a su hora).
44. `pruebaTandaLL_LZ` y algunas pruebas de Lanzarote solo pasan con la API en `DESTINOS_OCULTOS='-'`, y `pruebaJutrip` no con ella: ¿una sola configuración? Propuesta: publicar Lanzarote cuando quieras y simplificar.
