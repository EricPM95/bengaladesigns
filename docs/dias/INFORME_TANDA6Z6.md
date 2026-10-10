# Informe de la Tanda 6z6

## 0. Las respuestas a mis preguntas de la 6z5
- **El Coliseo a las 12:30 y a las 13:00 tiene su propia fila** (la del documento): la mañana (el Campidoglio, el Altar por dentro, el Foro y el Palatino), luego el Coliseo y el Arco, y la comida en Monti después; la tarde, la de mediodía. De 13:30 a 15:00 sigue la de mediodía (la comida antes). Pasé el documento por el convertidor sin tocarlo (0 dudas) y puse al día la prueba de listas: nuevas reservas del Coliseo a las 12:30 y a las 13:30, y una regla que comprueba que con las 12:30 y las 13:00 va la visita primero y la comida después.
- **El horario sin fechas** enseña el de la temporada del mes del viaje; si hay un día de la semana que cierra, el general con ese día: «Abre 9:00 – 19:00 · Cerrado los lunes». Sin fechas y sin mes, como antes (nada si el horario varía).
- **La última entrada con dos tramos:** la del último tramo; los dos tramos del horario se ven («9:00 – 13:00 y 15:00 – 19:00»).
- **El aviso «Saltada»** no se guarda. Para una parada saltada, el menú «···» tiene «Devolverla a la ruta» (y en la lista de HOY, un botoncito en su fila).
- **El aviso de cierre** avisa por cualquiera de los sitios que cubre la entrada, con el nombre del que cierra («Ese día (26 mar) el Foro Romano cierra a las 14:00. Revisa tu reserva.»). Sigue siendo solo un aviso.

## 1. La barra, según la versión
Gratis: cuatro pestañas siempre (Ruta · Días · Explorar · Reservas). De pago: cinco siempre (Hoy · Ruta · Días · Explorar · Reservas). En la gratis HOY no sale, ni con candado; un «Hoy» guardado cae a «Ruta» en un solo sitio (`src/lib/barra.ts`). La barra no cambia nunca con el momento del viaje.

## 2. Arriba de RESERVAS (corregido en la 6z6b: ahora son DOS tarjetas)
> Esta sección la sustituye la Tanda 6z6b (ver `INFORME_TANDA6Z6B.md`): la tarjeta oscura ya NO lleva el resumen dentro.
- **La oscura:** solo la cuenta atrás («Tu viaje a Roma empieza en · 10 días»; sin fechas, «Tu viaje a Roma · octubre» con [Pon tus fechas]; durante el viaje, «Estás en Roma · mié 14 · 2 de 4»; después, no sale) y el tiempo pequeño cuando lo hay. Sin «Te faltan…» ni «Lo tienes todo listo».
- **La clara, aparte y debajo:** «Tu viaje a Roma · 0 de 3 listo» (gratis «0 de 2») con una ficha redonda por bloque; cada ficha baja a su bloque. Es el único sitio que dice lo que falta.
- «Te falta por reservar» y «Útil para el viaje» ya no van aparte en HOY: son los bloques de RESERVAS.

## 3. DÍAS durante el viaje
Se abre sola en el día de hoy, con la etiqueta «HOY» en su cabecera (gratis y de pago); los demás días siguen igual. Si el viajero cierra el día, se queda cerrado.

## 4. El Perfil: el mapa de mis viajes y las fotos
- **El mapa de mis viajes** (gratis y de pago): arriba del Perfil, una bola del mundo (Mapbox, `projection: 'globe'`) con una chincheta por cada destino de cada viaje (un viaje a Roma y Florencia, dos). Debajo, la lista de todos los viajes («Roma · 13 – 16 oct 2026 · 4 días»): primero los que vienen, luego los hechos. Al tocar una chincheta o un viaje: su ficha («4 días · 55 paradas») con su álbum. Sin cuentas todavía: son los viajes de este móvil.
- **El álbum:** por días y por parada, con [Añadir foto] y «Eliminar» en cada una (con confirmación).
- **Añadir fotos:** en las dos versiones, desde la ficha de cada parada; en la de pago también al marcar «✓ Visto» y desde HOY después del viaje; en la gratis, después del viaje, «Guarda tus recuerdos» sale arriba en RUTA con [Subir mis fotos] y lleva al álbum.
- **Miniaturas:** al subir cada foto se guarda también una copia pequeña (400 px de lado) en el mismo almacén privado, con el mismo nombre acabado en «_min» (sin tocar la tabla ni hacer migración). El álbum, la ficha y las listas enseñan la pequeña; la grande solo se descarga al abrir una foto en grande (un toque la abre; otro la cierra). Al eliminar se borran las dos; si una foto antigua no tiene pequeña, se enseña la grande. **Lo que pesan, en la prueba** (8 fotos de Roma del propio proyecto, de 640 KB a 1 MB y de 1.920–2.400 px de lado): la foto grande, reducida a 1.600 px, pesa de media **424 KB** (de 288 a 609) y la pequeña de 400 px, **35 KB** (de 25 a 49). Son fotos ya comprimidas de internet; una de móvil (de 3 a 5 MB y 4.000 px) saldrá algo más pesada en las dos.
- **Cuántas fotos:** gratis, una por parada («Añadir foto» pasa a «Cambiar foto»; el álbum dice «Una foto por parada»); de pago, sin límite. Una sola regla (`limiteDeFotos()` en `fotosViaje.ts`).

## 5. HOY de pago, por momentos
- **Antes:** «Tu modo Hoy se activa el miércoles 13 de octubre» y lo que tendrá, con [Ver mi primer día] (abre DÍAS). Sin fechas: «Pon tus fechas para activar tu modo Hoy».
- **Durante:** la siguiente parada con distancia y «Ubicación», [Cómo llegar], [✓ Visto], [No me da tiempo], **«Escuchar»**, la entrada a su hora, la lluvia, los avisos del día («Santa Maria del Popolo cierra hoy a las 18:00», el horario real, hasta tres) y **«Cerca de ti»** (Baños · Fuentes · Comer, que abren EXPLORAR con ese filtro, ordenado por cercanía a donde está el viajero o, sin ubicación, a la siguiente parada). La línea «Hoy es un día completo: te recomendamos madrugar.» sale cuando toca.
- **Al final de HOY, durante el viaje (de pago): «Tus fotos de hoy»**, un bloque pequeño con el estilo de «Guarda tus recuerdos»: las miniaturas de las fotos de ese día (las de las paradas y las sueltas) y [+ Foto], para añadir fotos sueltas del día sin parada (la cena, una calle). Sin fotos todavía, solo el título y [+ Foto]. Las sueltas van al álbum del viaje, en su día, sin parada. El bloque grande «Guarda tus recuerdos» sale solo después del viaje; en la gratis, nada de esto (allí, desde la ficha de cada parada, una por parada).
- **Después:** «Tu viaje a Roma» con las fichas de los días, «Guarda tus recuerdos» con [Subir mis fotos] y [Ver mis recuerdos] (abre el álbum en el Perfil), y «¿A dónde vamos ahora?» con [+ Nuevo viaje].

## 6. «Escuchar»
Botón con altavoz en la tarjeta de la siguiente parada y en la pestaña «Resumen» de la ficha (de pago). Lee en voz alta el texto del Resumen con la voz del propio móvil (`es-ES` si la hay; si no, otro español), con [Pausa], [Seguir] y [Parar]; se corta al cambiar de parada o de pantalla. Sin voz en español, el botón no sale. Sin coste y sin mandar nada fuera.

## 7. «Cerca de mí» de pago y la ubicación
- En la gratis, EXPLORAR ordena solo por «Recomendado»; «Cerca de ti» y los filtros de baños y fuentes solo en la de pago (`src/lib/explorarDePago.ts`). Como esa pantalla es la misma que usan el «+» de DÍAS y «Añadir al viaje», en la gratis tampoco tienen «Cerca de ti».
- **Qué más usa la ubicación del viajero en la gratis:** (1) el botón de localizarte del mapa de esa pantalla del explorador; (2) las distancias del buscador de lugares (`PlaceFinderPanel`, vía `getDistanceToStop`: pide la ubicación para decir a cuánto están los lugares que no están en la ruta). Los dejé como estaban; dime si también van de pago.

## 8. El panel de pruebas
Botón «Pruebas» abajo a la izquierda, solo en local y en las vistas previas (el mismo criterio que `?prueba=1`, en un solo sitio: `esEntornoDePrueba()`; en producción no existe). Hoja con Versión (Gratis · De pago), Momento (Fecha real · Antes del viaje · Durante cada día · Después del viaje, más «Probar otra fecha») y Números de «me gusta» (De prueba · Los de verdad). Se acuerda de lo elegido durante la sesión y repinta la app sin perder el viaje. Es el que he usado para todo lo de abajo.

## 9. Los dos avisos suaves (los dos solo avisan; nunca mueven ni quitan nada)
- **«Vas justo»**, solo entre dos reservas del viajero del mismo día: si entre que acaba la primera (su hora más lo que dura) y empieza la segunda hay menos que el trayecto más 30 min: «Ojo: entre tu Free Tour y tu entrada a los Museos hay poco margen. Es posible que vayas justo: te recomendamos ir directo.» (con los nombres cortos), en la hoja de abajo y en la campana. No cuenta nuestras paradas. Si las horas se cruzan, sale «coinciden» y no este.
- **«Día completo»:** «Hoy es un día completo: te recomendamos madrugar.» en la cabecera de ese día en DÍAS y en HOY (de pago), sin hoja ni campana, si las paradas de un día con reserva suman más de lo que cabe de 9:00 a 22:00 con lo que se anda y las comidas.

## 10. Pruebas
Todas a 0 fallos. La nueva `pruebaTanda6z6.mjs` corre sus cuatro partes (a: barra, RESERVAS, DÍAS y panel; b: Perfil y fotos; c: HOY durante, «Escuchar», EXPLORAR; d: motor y avisos). Las viejas puestas al día por lo que cambia (6s, 6v, 6z3, 6z5). La prueba de listas con los próximos 12 meses (del 11-oct-2026 al 10-oct-2027, las 365 fechas, sin saltarse ninguna) con las seis tandas en paralelo: 1 día (87 s), 2 días (294 s), 3 días (444 s), 4 días (1.008 s), 5 días (1.446 s) y 6 días (1.926 s): 0 fallos en las seis, 198.195 viajes (unos 32 minutos).

## 11. A mano a 375 px, con el panel de pruebas
Gratis y de pago, antes, durante y después: la barra de 4 y de 5 pestañas, la tarjeta de RESERVAS en cada momento, DÍAS con «HOY», HOY de pago durante (con «Escuchar» y su [Pausa]/[Seguir], «Cerca de ti» → EXPLORAR con baños, los avisos del día), EXPLORAR en las dos versiones, el Perfil con el globo, la ficha del viaje con su álbum (con «Una foto por parada») y «Guarda tus recuerdos» en RUTA (gratis). Capturas en `docs/dias/img/6z6-*.jpg`. Lo que NO pude comprobar: subir y borrar fotos de verdad (la migración `0018_fotos_viaje.sql` sigue sin aplicar) y «Escuchar» con voz real. Viaje de prueba borrado.
