# Finde, paso 5: qué gasta Supabase y qué se ha arreglado

(Fin de semana de pruebas, 27-nov. Sin tocar producción ni abrir ningún `.env*`. Todo se ha medido con un Supabase de mentira que cuenta los bytes de cada respuesta.)

## Lo más importante, en dos frases

1. **La prueba de la V36 medía con el reloj parado.** `pruebaV36_servidor` hacía «640 vueltas de "cerca de aquí"» en menos de 30 segundos de reloj, y la memoria de 30 segundos del servidor las contestaba todas casi sin tocar la base: salían 92 KB. En la vida real el móvil pregunta cada 75 s a 5 min, esa memoria no sirve y **cada pregunta lee la base otra vez**. Medido con el reloj avanzando, un día de HOY de 8 h costaba **5 MB por viajero** con una ruta de 79 KB (9 MB con una de 200 KB), no 92 KB. Esa es la causa más probable de que el gasto siga al doble.
2. **Hay dos agujeros más, también arreglados:** el billete (QR) que el móvil bajaba entero cada vez que se cambiaba de pestaña, y los «me gusta» de todos los viajeros del destino bajados en cada apertura de la app.

No tengo acceso al panel de Supabase de verdad: las cifras son del simulador (método abajo) y hay que mirarlas contra el gráfico de «egress» de Supabase en los próximos días.

## Cómo se ha medido

- **El servidor** (`node scripts/destino/medirFindePaso5.mjs`, nuevo): un cliente de Supabase de mentira que suma los bytes de cada respuesta, el reloj avanzando de verdad (75 s entre llamadas), una ruta de 200 KB (o la que se diga con `RUTA_KB=49`), 60 hechos y 90 logros ganados.
- **El móvil** (`pruebaV36_cliente`, ampliada): Chrome con la app de verdad, las peticiones a Supabase y a `/api` interceptadas y contestadas con tamaños realistas (el viaje de Lanzarote de Eric, 49 KB). Ahora además cambia de pestaña dos vueltas (Ruta, Días, Explorar, Reservas, Hoy) y mide lo que baja cada una, con un billete de 150 KB en la «nube».
- Lo que sale de `/api` (los tamaños que supone el móvil) NO es lo que gasta Supabase: lo que gasta es lo que ese servidor lee de la base. Por eso se mide aparte, arriba.

## La tabla: qué gasta más (por viajero y día, estimación)

«Viajero activo» = un día de viaje con la app a la vista unas 8 h, en HOY, con el GPS. «Antes» y «después» se refieren a los arreglos de este paso.

| # | Qué es | Antes | Después | Ahorra | De dónde sale el número |
|---|---|---|---|---|---|
| 1 | `/api/logros/cerca` (HOY, ~100 llamadas/día): el servidor bajaba **todos los logros ganados (`select *`, ~28 KB con 90 logros)** en cada llamada, y **la ruta entera cada 15 min** | 5,3 MB (ruta de 79 KB) · 9,2 MB (ruta de 200 KB) | 1,4 MB · 1,8 MB | **≈ 74 % (de 4 a 7 MB al día por viajero)** | `medirFindePaso5.mjs`, 100 llamadas en 8 h |
| 2 | Billete guardado en la nube (`billetes_personales`, con el QR: 20-150 KB): se bajaba **entero cada vez que se abría una pantalla con billete** (cada 20 s como mucho, con dos relojes separados) | 150 KB por cada visita a RESERVAS; con 15-40 cambios de pestaña al día, de 2 a 12 MB | 150 KB la primera vez y 0,1 KB después (solo el sello) | de 1 a 10 MB al día para quien tenga un billete con QR | `pruebaV36_cliente` sección (d); «antes» deducido del código (la prueba no existía) |
| 3 | `/api/avisos` (la campana, cada 5 min con la pantalla a la vista, 96/día): el servidor devuelve hasta 60 avisos (~0,4 KB cada uno) | 0,4 a 2,3 MB | sin cambio (ver decisiones) | — | estimado del código y de `avisos_de` (limit 60); no medido |
| 4 | `/api/logros/estado` y `/ganados` al abrir la app (3 llamadas, cada una lee de la base 50-145 KB): la app se abre ~3 veces al día | 0,4 a 1,3 MB | sin cambio | — | `medirFindePaso5.mjs`: 49 KB/llamada con ruta de 49 KB, 145 con una de 200 KB |
| 5 | «Me gusta» de los sitios (`place_likes`): TODAS las filas del destino (~90 bytes cada una) bajaban en cada apertura de la app | 90 KB por apertura con 1.000 «me gusta» (crece con los usuarios) | como mucho una vez cada 6 h por destino | ≈ 50-70 % de eso | del código; con 1.000 «me gusta» |
| 6 | Compañero de un viaje compartido: cada guardado del dueño le hace bajar el viaje entero (sello primero) | 0,3-1,2 MB (6 guardados al día × 49-200 KB) | sin cambio (ver decisiones) | — | `pruebaV36_cliente` (1-6 guardados al día) |
| 7 | La tarea de los avisos del viaje (cada 5 min, 288/día): con el plan al día solo pide ids y avisos que tocan (~0,1 KB por viaje) | ~30 KB por viaje y día | igual | — | `pruebaV36_servidor` punto 5 |
| 8 | Esa misma tarea, **al rehacer el plan** de un viaje en curso (cuando cambia o cada 6 h): baja `route` y `bookings` enteros | 4 veces al día por viaje con alguien suscrito = 0,2 a 0,8 MB, más una por cada cambio del viaje | sin cambio (ver decisiones: pide migración) | — | lectura de `0077_avisos_programados.sql` |
| 9 | Móvil con la app a la vista y quieta (10 min): 12 peticiones directas y 4 a `/api` | ~0,5 KB directos; en el servidor 2×cerca + 2×avisos ≈ 40 KB | igual | — | `pruebaV36_cliente` (b) |
| 10 | App en segundo plano (30 min) | 0 | 0 | — | `pruebaV36_cliente` (c) |
| 11 | Abrir la app (la primera carga de un viaje de 49 KB): 52 peticiones, 58 KB directos | 58 KB | 58 KB | — | `pruebaV36_cliente` |
| 12 | Cambiar de pestaña, 1ª vuelta y 2ª (sin contar el billete): Ruta 0,4 KB · Días 3,5 KB · Explorar 0,4 KB · Reservas 0,1 KB · Hoy 3,5-4 KB | — | — | — | `pruebaV36_cliente` (d) |
| 13 | Panel de administración (solo Eric): abrir y moverse con 400 cuentas = 21 consultas, 487 KB; la lectura general se guarda 60 s | 487 KB por visita | igual | — | `pruebaV36_servidor` punto 2 |

**Suma por viajero activo (lo medible):** antes entre 7 y 12 MB al día, después entre 2,5 y 4 MB, según el peso de la ruta y los logros. Para un grupo de 3-4 personas de viaje, de 25-45 MB al día a 8-16 MB. Con 5 GB al mes (≈ 166 MB al día) eso sigue siendo mucho con unas diez personas de viaje a la vez, pero ya no es el doble.

## Lo que se ha arreglado (todo en código, sin migración)

1. **`server/logros/repo.js` — la ruta se baja cada 3 horas, no cada 15 minutos** (`EDAD_MAXIMA_DE_UN_VIAJE_MS`). Cada guardado del viaje pone `updated_at` y esa es la señal de que cambió; los 15 minutos eran un seguro que, con «cerca de aquí» cada 75 s, bajaba la ruta ~32 veces al día. (El móvil ya usaba 3 h desde la V36.) Ahorra ≈ 30 bajadas × 49-200 KB al día por viajero.
2. **`server/logros/repo.js` + `servicio.js` — `logrosDe` con la lectura ligera pide 6 columnas** (`logro, escalon, destino, trip_id, ganado_en, animacion_vista`), las únicas que usa «cerca de aquí», no `select *` (se quitan la frase y el detalle). Cada llamada pasa de ~28 KB a ~12 KB con 90 logros. Cada cuánto: cuando la lectura de 30 s no la tiene.
3. **`src/store/useBilleteStore.ts` — el billete de la nube se pide en dos pasos:** primero solo `actualizado_en` (~60 bytes) y el `datos` entero solo si la nube es más nueva que el móvil. Antes: siempre entero.
4. **Los billetes se sincronizan como mucho cada 5 minutos por viaje, con la pantalla a la vista y una sola vez** (`sincronizarBilletes`, con `sondeo.ts`), en `useBillete` y `useBilletesDeEntradas`. Antes: cada 20 s, con dos relojes separados y sin mirar si la pantalla se veía.
5. **`src/lib/placeLikesApi.ts` — copia de los «me gusta» en el móvil durante 6 horas** por destino y persona; lo que uno marca o desmarca se apunta en la copia al momento, para que al recargar no se desfase.

Cada uno lleva su comentario de «cada cuánto y cuánto baja» en el código.

### Las pruebas

- `pruebaV36_servidor`: **31 comprobaciones, 0 fallos** (nueva: «con el reloj avanzando, 4 h de "cerca de aquí" con una ruta de 79 KB bajan menos de 3 MB y la ruta se baja como mucho 3 veces» y «la lectura ligera pide solo 6 columnas»).
- `pruebaV36_cliente`: **32 comprobaciones, 0 fallos** (ampliada con la sección (d) de las pestañas y un billete de 150 KB en la «nube»: la primera visita a RESERVAS baja el billete una vez (150 KB) y las siguientes 0,1 KB). Una de las cuatro veces que la pasé falló por el parpadeo del guardado de la ruta (ver «Riesgos»).
- `pruebaV36B` y `pruebaV36C`: 41 y 129 comprobaciones, 0 fallos (V36C se puso al día: ver `INFORME_FINDE_PASO3.md`).
- `scripts/destino/medirFindePaso5.mjs` (no es una prueba): la medida de arriba, para repetirla.

## Lo que NO se ha tocado y por qué (decisiones y migraciones, para Eric)

**A. Migración (no la escribo, la aplicas tú):**

1. **`place_likes_resumen(destino)`**: una función que devuelva solo `place_name, total, mío` (~3 KB por destino) en vez de todas las filas. El arreglo de la copia de 6 h es provisional: con 10.000 «me gusta» de un destino, cada descarga son ~900 KB. Esta función lo deja en ~3 KB siempre.
2. **`avisos_viaje_para_plan` con solo lo que usa el plan de avisos** (los días, las paradas con hora y las reservas, sin los textos largos de cada parada) o, mejor, que el plan se rehaga **solo cuando cambia la huella** y no «cada 6 h» además (el tiempo de mañana ya lo puede pedir el servidor aparte, que es otra API y no gasta Supabase). Ahorra de 0,2 a 0,8 MB al día por viaje en curso con alguien suscrito a los avisos.
3. **`avisos_de(p_uid, p_desde)`**: devolver solo los avisos nuevos desde la última vez, en vez de los últimos 60 cada 5 min.

**B. Decisiones tuyas (cambian la sensación de la app):**

4. **Vida de la lectura ligera del servidor: de 30 s a 3 min** (`VIDA_LECTURA_LIGERA_MS`). Ahorraría otros ~60 % de la fila 1 (de 1,4 a ~0,6 MB). Riesgo: en un servidor con varias copias, lo que ganas en una tarda hasta 3 min en verse en «cerca de aquí» (un pedazo ya ganado puede seguir ofreciéndose un rato). La escritura que se hace en la misma copia ya lo limpia sola. Mi propuesta: sí, a 2 min.
5. **«Cerca de aquí» con la pantalla quieta, de cada 5 a cada 10 min** si el GPS no se ha movido y no hay parada cerca. Mi propuesta: sí.
6. **Avisos (la campana) cada 10 minutos en vez de 5** (ya llegan en directo por Realtime; el sondeo es el respaldo). Mi propuesta: sí, 10 min.
7. **Compañero de un viaje compartido: agrupar los cambios del dueño** (esperar ~20 s antes de bajar el viaje, para que 3 guardados seguidos sean 1 bajada). Hoy espera 600 ms. Mi propuesta: 5 s.
8. **`/api/logros/estado` y `/ganados` al abrir la app** se piden 3 veces (cada una lee 50-145 KB en el servidor). Se puede pedir una sola vez por apertura y repartir. No lo he tocado (hay seis pantallas que lo comparten).

## Riesgos que no he arreglado

- **No he podido medir producción.** Mira el gráfico de «egress» de Supabase unos días: si baja de ~160 MB/día a ~80 MB/día, ha sido esto; si no, la causa sigue siendo otra y hay que abrir el registro de PostgREST (qué ruta gasta).
- La memoria del servidor es **por copia**: en Vercel cada copia nueva (arranque en frío) vuelve a bajar la ruta; no se puede arreglar sin una caché fuera (Redis) o sin migración.
- El panel de Eric crece con las cuentas (auth.users 71 KB, logros 160 KB con 400 cuentas): hoy ~0,5 MB por visita; con 5.000 cuentas serán ~6 MB por visita. Hoy no es problema.
- `pruebaV36_cliente` tiene un parpadeo viejo: a veces un guardado de la ruta (PATCH, 49 KB de subida, ~0 de bajada) cae dentro de los 10 minutos de la «quieta» si la máquina va cargada. No es gasto de salida de datos. Se repite sola y pasa.
- No existe `pruebaV55` (no hay ningún archivo con ese nombre); lo de la V55 lo cubren `pruebaV43` y `pruebaV44`.
