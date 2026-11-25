# Decisiones de la noche (24-nov): las pruebas

Lo que no he querido decidir yo solo, o que cae en archivos que otros agentes tocan a la vez. Cada punto dice qué prueba, qué pasa y qué haría yo.

## 1. Peso de la descarga al abrir (3 pruebas)
- `pruebaCuentas3` y `pruebaPantallas8b` (tope de **340 KB** comprimidos: salen **341,2 KB**) y `pruebaLogros2` (tope de **1 MB** de JavaScript sin comprimir: salen **1.029 KB**).
- No es un fallo de la prueba: la app ha crecido desde la 10S (V30 a V50: sonidos, hojas, tarjetas). Son 1,2 KB y 29 KB por encima.
- Opciones: (a) subir el tope (decisión tuya: el 340 viene de la 10S), o (b) sacar del paquete de entrada algo que no hace falta al abrir (carga perezosa de lo que solo usa el panel de administración o el estudio de sonidos). Yo haría la (b) en una tanda aparte, con `pruebaTanda10S` midiendo antes y después.

## 2. «Sitios de atardecer cerca» en Lanzarote: sale 1 y deberían salir 2 o 3 (`pruebaTandaHOY2b_D` [6])
- Causa (V44): en `src/components/route/hoy/v2/HoyDuranteV2.tsx` la tarjeta del atardecer calcula los sitios cercanos **desde `ubicacion`**, y desde la V44 `ubicacion` es `null` salvo que el viajero esté «EN LA RUTA» (a un cuarto de hora de coche de la **siguiente parada por hacer**). Cuando ya no queda ninguna parada por hacer (justo cuando sale el atardecer: 16:45), `referencia` es `null`, la zona sale `destino` y el GPS se ignora: los sitios se cuentan desde la última parada y salen menos.
- Arreglo propuesto (no lo he hecho porque es `hoy/**`, que están tocando otros agentes): en `fraseDeAtardecer({ desde: … })` usar `ubicacionReal` cuando la zona no es `fuera` ni `sin` (los sitios de atardecer son «cerca de ti», no «del plan»). Línea 305-308 de `HoyDuranteV2.tsx`.

## 3. Las cifras de «me gusta» de los restaurantes (`pruebaFase6y10_ficha`, 3 fallos)
- El guion `megustaInicial6y10.mjs` da cifra a los 21 restaurantes que más salen en los días escritos (`data/dias/roma/listas.json`). Desde la tanda LL (4-nov) los días cambiaron y el corte 21/22 **empata** (3 apariciones los dos: Taverna Trilussa y Sgarro Bistrot).
- No he vuelto a correr el guion: pisaría las cifras que fijó la Tanda 10O para 11 sitios (lo comprobé: Via della Conciliazione, Castillo de Sant'Angelo, Galería Borghese… se quedarían en 0 o cambiarían) y la prueba lo ve.
- Decisión tuya: ¿cuál de los dos restaurantes empatados lleva cifra (o 22 en vez de 21)? Con eso se retoca el guion para respetar la 10O y se regenera.

## 4. «€» escrito a mano en `src/lib/paginaDestino.ts:60` (`pruebaTanda6z2`)
- `desdeTexto` escribe `${Math.round(a.desde)} €` (precio «desde» de las actividades de la página del destino, V21). La regla de siempre es que todo importe pasa por el formateador de la moneda del viajero (`precioEnVista`).
- Hay que decidir si esas actividades se enseñan siempre en euros (precio de Civitatis) o convertidas. Si es lo segundo, es un cambio de una línea; si es lo primero, se añade a las excepciones de la prueba.

## 5. Colores escritos a mano en `ListaDeDias.tsx` (`pruebaTanda7_mover`, regla E14)
- `src/components/route/dayDetail/ListaDeDias.tsx` (V43) lleva `#FFFDF8`, `#B58A2E`, `rgba(110,80,24,.55)` y `#B5704A`. La regla E14 de la Tanda 7 («una sola pieza») prohíbe colores a mano en esa lista.
- Es `dayDetail/**` (lo tocan los agentes de diseño): no lo he tocado. Arreglo: usar `DORADO`/`MARFIL` de `ui/botonesOro.ts` y los tokens de color. Anotado también en `_bateria_pendiente_diseno.md`.

## 6. Cosas que **sí** he cambiado en las pruebas y por qué (para que las repases)
- **Textos del billete (V48):** «Reservado» pasa a «Añade tu tarjeta de embarque / tu billete»; el encabezado sin número de vuelo dice el aeropuerto o la estación («LLEGADA · FIUMICINO», «LLEGADA · TERMINI»); el orden es «11:20 FCO».
- **Alojamiento (V45 §3):** «Listo» solo con hotel y fechas; la zona ya no lo enciende ni lo apaga (antes «Falta la zona»).
- **Días en blanco (V42 §5.1 y V44 §9):** en una ruta a mano, el de llegada y el de vuelta se llaman «Día de viaje» y los de en medio «Día por organizar» (antes «Día libre»). En `pruebaFase6y7_titulos` admito «Día de viaje» en el último día en blanco que ya va más allá de los escritos (`beyondAutoDays`): sale en los viajes de 6 días de enero; **te lo dejo por si prefieres «Hoy vuelves a casa» ahí.**
- **Excursiones sin datos inventados (V50):** `pruebaTanda10S9b_D` ya no espera 08:00 / 11:00 ni punto de encuentro en Ostia Antica.
- **Hoja «Pasar a otro día» (V50):** el título de la hoja es «Pasar a otro día» (el enlace «Pasarla a otro día» es del aviso).
- **El primer día lleva el billete con QR (V48):** `pruebaTanda7_ficha` ya no busca la tarjeta vieja con [Ver].
- **Botón de Logros (V18/V42):** sin aro de avance y con la altura que le da la columna de flotantes; etiqueta «En curso · Jue 29 · día 1».
- **Huella de los días «sin vuelos» (`pruebaTanda7_vuelta`):** regenerada con `dorado=1`. Se rompió en la V38 (`dateNotices.js`: el aviso de un sitio cerrado ahora dice qué se ha hecho; lo comprobé corriendo la prueba en los commits anteriores). Solo cambia el texto de esos avisos.
- **«Con tu vuelo estarás libre hacia las 17:30» (tanda LL):** es la única hora calculada que la prueba 6t permite ahora.
- **La cuenta del presupuesto (10S4):** el precio del vuelo suma siempre, con pase y sin él (`pruebaTanda6z2`, `pruebaCorr6z6_efecto`).
- **Fotos:** una foto «con permiso del autor» (Turismo de Haría) es válida con su crédito (`pruebaTandaLZ1_D`); las fotos «solo tarjetas» se sirven en su versión pequeña (`pruebaArregloFotosViaje`); Lungotevere y el Mirador de San Pietro ya tienen foto desde la V30 (`pruebaV16b`); ya ningún sitio de Roma cae a Unsplash (`pruebaFase6y2_fotos` mira el código del servidor).
- **«Mis viajes» ya no existe desde la V17:** quité de `pruebaTanda7_mover` las dos comprobaciones de su tarjeta (el Perfil se sigue comprobando).
- **Z del calendario:** lo subí de 9500 a **9800** (`DatesCalendarModal.tsx`): el aviso de «versión nueva» (9700) le tapaba el botón de abajo (arreglo real, pequeño).

## 7. Arreglos reales que he hecho en la app (pequeños)
- `src/components/route/reservas/ExcursionConBillete.tsx`: el gancho `usePagoActivo()` estaba **después** de un `return` (V49): rompe las reglas de los ganchos de React (`pruebaTanda10S2` lo veía con oxlint). Movido arriba.
- `src/components/route/DatesCalendarModal.tsx`: z-index 9500 → 9800 (ver arriba).
- `src/components/logros/momentos/hoja/AntesDelViaje.tsx`: el candado dibujado a mano usa `ICONOS.candado`.

## 8. Servidor de pruebas
- Algo (la limpieza de otros agentes al reiniciar su Vite de 5173) **mataba el Vite de 5199 de la batería** dos veces. Lo arranco ahora con `scripts/destino/_servidorPruebas5199.mjs` (sin «vite» en su línea de órdenes) y lanzo la batería con `sinvite=1`. Las dos pasadas cortadas no cuentan.

## 9. Añadido al final de la pasada 1
- **Páginas de revisión de rutas (`pruebaRevisionLargos`, `pruebaRevisionRutas`):** comparan la app con `docs/dias/RUTAS_REVISION*.html`, que se generó el 23-oct. Desde entonces el motor cambió a propósito (3-nov y 4-nov: el Janículo de noche, el día de llegada y el de vuelta) y las rutas ya no salen igual. Hay que regenerarlas con `node scripts/destino/rutasRevision.mjs` (y `--set=largos`), que necesita Chrome y es el documento que tú revisas: no lo he tocado de noche.
- **`pruebaTanda10N5_perfil`:** describe el Perfil de antes de la V31 (el [+] flotante de 64 px, el orden cabecera → Mis viajes → vitrina…). El Perfil nuevo (V31, `BotonMas.tsx`, tarjeta de viaje, mapa del mundo) es otro: la prueba hay que reescribirla con el diseño cerrado.
- **Pruebas de la hora (V49/V50):** el ✓ de la hoja de la hora ya no inventa la hora de ejemplo y tocar fuera cierra sin guardar. He puesto al día ~15 pruebas (elegir la hora en la rueda antes del ✓; «tocar fuera NO guarda»). Si prefieres que tocar fuera sí guarde, es un cambio de dos líneas en `HojaDeHora.tsx` y se revierten esas expectativas.
- **Los puntos de encuentro de las excursiones (V49):** las pruebas de las excursiones ahora piden que NO haya punto de encuentro inventado, ni botón [Cómo llegar al punto de encuentro] en la tarjeta ni en HOY.
- **Pruebas sin Chrome que pasé «solas» y daban 0 sin serlo:** `pruebaFase6y2_fotos` y `pruebaTanda7_respuestas` solo corren su parte de servidor si reciben `SERVIDOR`/`API_URL`. La batería se lo pasa; a mano hay que ponerlo.
- **API para las pruebas:** `pruebaTandaHOY2b_D` (y otras de Lanzarote) piden la API con `DESTINOS_OCULTOS='-'`; `pruebaJutrip` y `pruebaTandaLZ2a_B` la piden **normal**. Corrí cada grupo con la suya. La API está ahora **normal** (como estaba).
