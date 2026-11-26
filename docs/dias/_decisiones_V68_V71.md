# Decisiones pendientes de Eric (V68 a V71)

## Cosas que hay que hacer tú o comprobar a mano
1. **La migración 0095** (tabla `documentos_de_entrada`, V65) sigue sin aplicar: ¿la aplicas tú?
2. **Los ~1.200 archivos viejos de `docs/dias`** son salidas que regeneran las pruebas y las capturas: ¿confirmas el `git restore docs/dias`? (Añadí a `.gitignore` lo temporal con guion bajo; lo ya versionado no se suelta solo.)
3. **Oír en el iPhone** que cada sonido sale con su pantalla (V71): no se pudo medir el audio en el Chrome de pruebas.
4. **Abrir Ajustes a mano** (moneda y país con su buscador, V70): con la carga perezosa nueva no se pudo capturar sin iniciar sesión.

## V68 · Reservas en otro día, «Recuperar el día», Reorganizar
5. Con los vuelos de 15:30 y 17:30 el Free Tour sin hora y los Museos Vaticanos acaban en **Lugares pendientes** porque los demás días van llenos: ¿quieres que el Free Tour tenga prioridad en el día 2?
6. En Lanzarote con el vuelo de 17:30 el día 1 queda solo con la cena (todo lo demás en pendientes): ¿bien o prefieres que quede algo?
7. La generación del viaje ENTERO con vuelo sigue con «el día 1 pasa al día 2» (diseño de la V61); solo cambia el botón Reorganizar: ¿lo cambiamos también al generar?
8. Al mandar un sitio a otro día se usa la distancia en línea recta, no Mapbox: ¿bien?
9. El barrido de 365 sigue sin pasar (no se tocó `shared/` en la V68, pero sí en V61, V63 y V67): ¿lo lanzamos esta noche (6-7 h de CPU)?
10. «Recuperar el día» con un viaje en marcha y días pasados bloqueados solo se probaron con función pura y por lectura de código: ¿lo compruebas tú en el móvil?

## V69 · Hojas de Reorganizar y de mover días, «Revisa las horas», horas del Free Tour, pendientes en DÍAS
11. Con 4 o más sitios al mismo destino puse una tarjeta «12 sitios de tu martes · A Lugares pendientes» (idea mía): ¿te vale?
12. En el aviso del tiempo (viento) «Sale de hoy · A Lugares pendientes» no es exacto: el sitio se guarda en la copia del plan y vuelve con Deshacer: ¿cambiamos el texto?
13. «Una sola lista» de pendientes: HOY sigue con su bloque «Si te sobra tiempo» y DÍAS tiene el suyo: ¿las unificamos?
14. «Agotado» por hora en el Free Tour es una aproximación (la API solo da las horas libres): ¿aceptas hasta que Civitatis dé también las agotadas?
15. En la hoja de mover días incluí también la tarjeta del día de la reserva (el dibujo solo enseña los desplazados): ¿bien?
16. Si la entrada es de otra persona y no hay documento para ti, el botón [Ver entrada] no sale (decisión mía): ¿bien?
17. «De camino» (Fuente de las Tortugas, Elefantino) no sale como tarjeta si el dato lleva la marca `passThrough`/`isFreeWalk`: ¿las marcamos en los datos de Roma?
18. Las 46 miniaturas de Lanzarote (166 KB) son archivos nuevos que se han subido: ¿bien?

## V70 · El día de la vuelta y tus respuestas
19. En la caja AEROPUERTO sale el tiempo del traslado (32 min), no los 70 min de SALIR: ¿bien?
20. «Ya en el aeropuerto» sin GPS usa el trayecto de SALIR (70 min en Roma): ¿bien?
21. [He salido tarde] con coche propio cuenta para el motor como una llegada por carretera (medio «tren», sin punto): es una aproximación: ¿quieres un medio «coche» de verdad en el motor?
22. En Lanzarote sin Reorganizar no hay hora de SALIR y no sale la tarjeta de tiempo libre: ¿bien?
23. Entrada y excursión ya no avisan «hemos cambiado tu reserva» con [Deshacer] al leer (solo [Guardar] cambia): ¿lo echas de menos?
24. [+ Añade tu reserva] es marfil (BOTON_CLARO), no blanco puro, en vuelo, entradas, excursiones y alojamiento: ¿bien?
25. Nota y opiniones de Civitatis: el sandbox solo da una ficha (142547): hay que repetirlo con producción de Civitatis: ¿cuándo?
26. El audio de la historia de Haría hay que regenerarlo si ya existe (la frase «Fíjate en tres cosas» cambió): ¿lo regeneras?
27. El fundido de fotos quedó fuera de las filas pequeñas de añadir parada, buscador, comidas y cerca, la galería y las fotos de personas: ¿las incluimos?
28. Los seis estrictos (Coliseo, Vaticanos, Borghese, Domus Aurea, Última Cena y Free Tours) ya salen con «Hora exacta · Llega 15 min antes»: ¿bien?

## V71 · Emblema y logros
29. La rama «oculto» de `HojaDelVisto` (`logros/visto/Hojas.tsx`) quedó sin usar: ¿la borramos?
30. Cinco logros de viajero seguidos son cinco pantallas: ¿quieres un tope (por ejemplo, tres y el resto en el resumen)?
31. «Volver» y «Tres viajes en un año»: si un viaje empieza el mismo día que acaba el anterior se considera que se pisan (lo elegí yo): ¿bien?
32. No hay captura del dibujo de Design (Día perfecto / M1) al lado de la de la app: ¿la sacas tú o la repetimos?

## Lo que no se ha podido comprobar
33. Peso de arranque: la V70 lo bajó de ~351 a 260,8 KB con carga perezosa de la primera pantalla y de 18 hojas y avisos; comprobado que carga en jutrip.app, pero no se abrió ninguna hoja de invitación, pago ni propuestas en el navegador.
34. Pruebas que siguen sin pasar por otras causas: `pruebaTandaHOY1_B` (un panel «Tus logros / Reclamar con tus fotos» tapa HOY en la K4) y `pruebaV35A_logros` con Vite (falla una aserción distinta cada vez, parece flaky).
