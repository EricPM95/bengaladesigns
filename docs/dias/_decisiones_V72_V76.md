# Decisiones pendientes de Eric (V72 a V76)

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
