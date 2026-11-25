# Decisiones de las tandas V52 a V58

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
