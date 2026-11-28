Hola. FIN DE SEMANA DE PRUEBAS (viernes 27 por la tarde a lunes 30 por la mañana). Primero la V77; después, todo esto con calma. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Antes de empezar:** comprueba que tienes en Descargas `PROMPT_V77_DECISIONES_V72_V76.md` y el Design `TODO_IGUAL` con la página «Consejos del día». Si falta algo, dímelo y no empieces.

**Como siempre:**
- nota en la rama `estado` (`_estado_finde.md`) al empezar, **cada 30 minutos** y al acabar cada paso;
- 2 agentes como mucho, 2 Chrome de prueba como mucho, un servidor;
- las baterías y los barridos, a prioridad baja;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave, y no abras los `.env*`;
- push sin --force;
- los agentes nunca hacen `git stash`, `git restore` ni `git checkout` de archivos (CLAUDE.md, V72);
- **si un paso se atasca más de 2 horas,** apúntalo, déjalo sin romper nada y pasa al siguiente.

## Paso 0. La V77
Hazla entera, como dice su prompt, y súbela. Todo lo demás va sobre la V77 ya subida.

## Paso 1. El barrido de 365 (antes de tocar el motor)
- Pásalo entero (6-7 h).
- **Apunta cada fallo,** agrupado por regla y por destino.
- Busca la causa de:
  - los 42 fallos de `[orden]` de `pruebaListas` (D1-FT y D4; tu sospecha: la V61, el Free Tour a su hora);
  - los 2 de `pruebaTandaLL_LZ` («vuelta desde el norte: la mañana sale vacía»).
- **Revisa la huella dorada de `pruebaTanda7_vuelta`** (los 9 hashes nuevos): ¿el cambio está bien o es un fallo?
- **Arregla los fallos reales,** con su prueba. Lo que sea una decisión, a la lista de Eric.

## Paso 2. Generar un viaje con vuelo (V72_V76, 19)
Con el barrido limpio: al **generar** un viaje con vuelo, la misma regla que Reorganizar (generar sin el vuelo y aplicar `cambioMinimo`), no «el día 1 pasa al día 2» (V61). Pasa `pruebaV68`, `pruebaV74`, las de Reorganizar y una muestra del barrido (Roma y Lanzarote, vuelos de 9:00, 15:30 y 17:30 a la llegada y a la vuelta).

## Paso 3. Las pruebas viejas que fallan
Pon al día o arregla, y di en una línea cuál de las dos cosas y por qué. **Si la prueba encuentra un fallo de verdad, se arregla la app, no la prueba.**
- `pruebaV43`, `pruebaV44`, `pruebaV45` y `pruebaV55`, con los textos y piezas de ahora (V55 y siguientes);
- `pruebaTandaHOY1_B`, `HOY1_C`, `HOY2_B` y `HOY2_C`;
- `pruebaV35A_logros`, que falla una cosa distinta cada vez (busca por qué);
- después, **la batería completa** (`bateriaParalela.mjs navegador=2 conc=3`), con lo que salga en una tabla.

## Paso 4. App rápida (V74, 37)
- **Mide en modo iPhone,** con red 4G simulada, cuánto tarda en abrirse:
  - jutrip.app;
  - cada pestaña (HOY, RUTA, DÍAS, EXPLORAR, RESERVAS);
  - Perfil, logros, Ajustes;
  - y las hojas más usadas.
- **Una tabla antes y después.**
- Optimiza las 10 más lentas sin subir el tope de 340 KB: carga al abrir, fotos más pequeñas, menos peticiones…
- **Comprueba que abren bien** las hojas de invitar, pago y propuestas, Ajustes, la ficha en grande de logros y «+ Añadir una reserva» (lo que no se pudo ver en las tandas).

## Paso 5. Supabase: el gasto sigue al doble
El plan gratis da 5 GB al mes y vamos al doble. Regla V36. Busca qué gasta, con números:
- **Un día de viaje simulado** para el dueño y para un compañero, con el contador de desarrollo: peticiones y KB por pantalla y por hora, con la app abierta y quieta.
- **El reloj de cada minuto de los avisos del viaje** (0075-0077):
  - cuántas veces al día baja `route` o `bookings` de un viaje;
  - si baja el viaje entero cuando no ha cambiado nada.
- **El panel de administración, Realtime, la campana, los logros** y todo lo que use `sondeo.ts`.
- **Las rutas de `server/`** que leen de la base: ¿cuáles bajan `route` entero cuando bastaría un trozo?
- **Una tabla** con lo que más gasta, el arreglo y lo que ahorra. Arregla lo que sea seguro, con `pruebaV36` en 0 fallos.

## Paso 6. Lo que no se comprobó en el probador (V74, 38)
El último día, Lanzarote, y el billete y el alojamiento dentro de sus tarjetas.

## Al final
- **`docs/dias/INFORME_FINDE.md`**, en palabras sencillas:
  - qué se ha arreglado;
  - qué tablas salen (barrido, velocidad, Supabase);
  - qué queda;
  - y «Decisiones pendientes de Eric», cada una con su pregunta y tu propuesta.
- **`docs/dias/REPASO_FINDE.html`:** una página que se abra sola sin internet, con las tablas y las capturas de lo que haya cambiado a la vista.
- Súbelo todo a main, sin --force, con las pruebas de lo tocado en 0 fallos.

En el mensaje final, en palabras sencillas:
- qué pasos se han hecho;
- cuántos fallos encontró el barrido y cuántos se arreglaron;
- cuánto más rápida es la app;
- cuánto se ahorra en Supabase;
- y lo más importante que tengo que mirar yo.

**No apagues el PC.** Al final, reinicia el api-server.
