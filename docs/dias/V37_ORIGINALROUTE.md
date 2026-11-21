# V37 · El viaje sin `originalRoute` (la mitad de peso)

`route.originalRoute` era una copia de la ruta tal como salió al crearla (`{ days, answers }`), metida dentro de cada `trips.route`. Hacía pesar el viaje el doble en cada bajada, subida y guardado.

## 1. Dónde se usaba (antes de tocar nada)

Servidor (`server/`), `shared/`, `api/`, `data/` y `supabase/migrations/`: **ninguna mención** (ni consultas `route->...`, ni funciones SQL, ni logros, ni compartir, ni panel). Solo la usa el móvil.

| Archivo · línea | Escribe / lee | Para qué | Qué se hace ahora |
|---|---|---|---|
| `src/store/useRouteStore.ts` ~1161 (`setRoute`) | escribe | al crear o rehacer la ruta (cambiar fechas) se pone `originalRoute: originalRouteOf(...)` | Sigue poniéndola en MEMORIA y la guarda además aparte, en el móvil (`guardarCopiaOriginal(id, copia, true)`) |
| `src/store/useRouteStore.ts` ~1205 (`hydrateTrip`) | escribe | un viaje guardado sin copia (de antes de la varita) la recibe al abrirse, a partir de lo que se abre | Primero la copia del móvil; si no, la que trae un viaje viejo de la nube; si no, la ruta tal como se abre (y se apunta en el móvil). Nunca se vuelve a subir |
| `src/store/useRouteStore.ts` ~978-988 (`restoreOriginalRoute`) | lee | la varita «Volver a mi ruta original» (viaje entero) | Igual (lee la copia en memoria) |
| `src/lib/recuperarDestino.ts` 31, 51 | lee | la varita por destino y «¿tiene este destino cambios?» | Igual |
| `src/components/route/RouteOverview.tsx` 74 | lee | enseñar o no la varita (`canRestoreRoute`) | Igual |
| `src/components/route/dayDetail/DayDetailPanel.tsx` 938 | lee | el nº de día original, para marcar un día movido de su fecha | Igual |
| `src/lib/freeDays.ts` 262 (`originalRouteOf`) | calcula | hace la copia | Igual |
| `src/lib/types.ts` 1079 | tipo | campo opcional de `Route` | Igual (solo en memoria) |
| `src/lib/tripPersistence.ts` (`saveTrip`, `filaAViaje`, `canonico`) | pasaba entera | subía, bajaba y comparaba la ruta con la copia dentro | `saveTrip` la quita antes de subir (insert y update); lo que baja sale sin ella; `canonico` (huella, eco, «igual a la nube») la ignora |
| `src/components/sync/TripSync.tsx` (`buildTripPayload`) | pasaba entera | el guardado en la nube Y la caché de HOY del móvil (`guardarLoDeHoy`) | sale sin la copia |
| `src/lib/viajeEnDirecto.ts` (`esEcoRemoto`) | comparaba | no volver a guardar lo que acaba de llegar de otra persona | compara sin la copia |
| `scripts/destino/pruebaCuentas1`, `pruebaFase6y_formulario`, `pruebaTanda10N5_freetour`, `pruebaVarita` | lee/escribe en memoria | comprueban la varita | No cambian: la copia en memoria sigue existiendo |

## 2. Qué se decidió

- La varita («Volver a la ruta original», «Recuperar mi ruta» por destino y el nº de día original) SÍ necesita la copia: con ella se vuelve a cualquier día tal como salió (paradas quitadas, horas, restaurantes). No se puede recalcular: las rutas de Lanzarote y las de fuera de Roma pasan por Claude y no son deterministas, y aun las curadas dependen de las fechas y del día en que se abra.
- Así que **la copia se queda, pero deja de viajar**: vive en MEMORIA (nada del resto de la app cambia) y se guarda UNA vez, aparte, en el móvil (`localStorage`, clave `jutrip-ruta-original:<id de la ruta>`, como mucho las 8 últimas; se borra al cerrar sesión: `src/lib/copiaOriginal.ts`). Sin migración y sin tocar el servidor.
- **Lo que se pierde (decisión de sentido común, dilo si no te vale):** la copia ya no va a la nube, así que otro móvil u otro navegador no la tiene. Allí la «original» es la ruta tal como se abre por primera vez en ese móvil (lo mismo que ya pasaba con los viajes anteriores a la varita). La varita funciona en el móvil donde se creó el viaje (o donde se abrió por primera vez un viaje viejo con copia). Si quieres que la original viaje entre móviles, la opción limpia es una columna aparte `trips.route_original` (migración) que solo se escriba una vez y no entre en las consultas normales; no la he hecho porque necesita SQL tuyo.
- Un viaje viejo (con copia en la nube): al bajarlo, la copia pasa al móvil y se quita del `route` en memoria que se guarda. Al guardarse sube sin ella. La huella (`canonico`) ignora la copia (un viaje viejo y el mismo limpio son lo mismo), pero se apunta que la nube aún la lleva (`nubeConCopia`) y el PRÓXIMO guardado SÍ se sube, una sola vez, para aligerar la nube.
- Los viajes que nadie vaya a guardar pronto se pueden limpiar de golpe con `docs/dias/LIMPIAR_ORIGINALROUTE.sql` (SIN APLICAR, opcional; comprobación en `COMPROBAR_LIMPIAR_ORIGINALROUTE.sql`).

## 3. El SQL de limpieza y los disparadores

Un `update ... set route = route - 'originalRoute'` suelto dispararía (cambia `route`): `trips_anotar_cambio` (0087: pone `trip_cambios.cambiado_en` y despierta por Realtime a los móviles abiertos, que preguntarían el sello; como `updated_at` no cambia, no bajarían nada, pero es ruido) y los de avisos (`avisar_viaje_cambiado`, `avisar_lo_del_admin`, `avisar_cuentas_modo`: avisos «han cambiado el viaje» de una limpieza que nadie hizo). Por eso el PASO 2 apaga los disparadores de usuario de `trips` dentro de la transacción (`alter table public.trips disable trigger user` … `enable trigger user`; si algo falla, se deshace y quedan encendidos). `updated_at` y `guardado_en` no se tocan. La prueba lo comprueba en PGlite con las migraciones reales y enseña por contraste que sin apagarlos `trip_cambios` sí se movería.

## 4. Pesos (bytes de la ruta tal como se sube: `JSON.stringify`)

| Viaje | Antes (con copia) | Ahora | Queda |
|---|---|---|---|
| Lanzarote real de Eric (`docs/dias/_hoy3_ruta_eric.json`) | 96.883 B (94,6 KB) | 49.278 B (48,1 KB) | 50,9 % |
| Roma (la ruta de `__rutaPrueba`, abierta con `setRoute`) | 161.666 B (157,9 KB) | 81.640 B (79,7 KB) | 50,5 % |
| Lanzarote: cuerpo del PATCH real de la app al guardar el viaje viejo | 96.883 B | 49.254 B | 50,8 % |

(En la prueba de SQL, 3 viajes de Lanzarote, 2 con copia: 260.691 B → 158.601 B de `route`.)

## 5. Prueba

`APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV37_viaje.mjs` (40 comprobaciones, 0 fallos): código, peso, viaje nuevo sin copia en la petición, viaje viejo que se abre, se edita, se guarda limpio y conserva la varita, huella, otro móvil sin copia, límite de 8 copias y SQL (PASO 1, PASO 2, repetible, disparadores, COMPROBAR).
