# V36 · Inventario del cliente: lo que el móvil le pide a Supabase

Qué se ha mirado: todo lo de `src/` que habla con Supabase (`supabase.from`, `.rpc`, `.storage`, `.channel`), las llamadas a `/api/*` que el servidor resuelve con Supabase y todo lo que se repite solo (relojes, GPS, efectos de React, Realtime).
Datos reales: el viaje de Lanzarote de Eric (`docs/dias/_hoy3_ruta_eric.json`): la ruta pesa **49 KB**, pero ya guardada en la nube pesa **97 KB** porque la app le añade dentro una copia de sí misma (`originalRoute`, la de «volver a la ruta original»). Un viaje de Roma de 4 días pesa 79 KB (V26) y, con su copia, ~160 KB.
«Día de HOY» = 8 horas con la app a la vista, un móvil, viaje compartido con otra persona.
Los números de «ahora» son MEDIDOS con `scripts/destino/pruebaV36_cliente.mjs` (Chrome de verdad, Supabase de mentira con esos tamaños, reloj de la página x100). Los de «antes» se calculan con los relojes que había antes de esta tanda (están marcados «calc.»).
Lo de `/api/*` lo resuelve el servidor con Supabase (lo audita otro agente): desde el móvil solo se ve CUÁNTAS veces se pregunta; los KB de esas filas son una suposición.

## Las 5 que más gastaban (por día de HOY de 8 h, un móvil)

| # | Consulta | Archivo | Cada cuánto (antes → ahora) | KB por vez | Suma/día antes (calc.) → ahora (medido) |
|---|---|---|---|---|---|
| 1 | `/api/logros/*` cada vez que el servidor leía las rutas ENTERAS de todos los viajes de la cuenta (cerca, estado, resumen…) | `server/logros/repo.js` (V26, ya arreglado; no es del móvil) y `useCercaDeAqui.ts` | «cerca de aquí» cada 75 s (384 al día) → cada 75 s solo si el viajero se mueve más de 60 m; parado, cada 5 min (en la prueba 98 al día con GPS cada 10 min) | ~1,5 al móvil; **el servidor bajaba hasta 130 MB al día por persona (medido en V26)** | 130 MB → 1,4 MB (V26) |
| 2 | Guardar el viaje entero (`PATCH trips`: ruta + reservas + deseos, 97 KB) por cosas que no son un cambio: `ModoCuentasHost` apuntaba «quiénes son» con una lista nueva cada vez que se recargaba la gente (cada 2 min) y la ruta cambiaba de objeto | `store/useRouteStore.ts` `setCuentasPersonas`, `store/useViajeCompartido.ts`, `lib/tripPersistence.ts` | 1 guardado cada 2 min (240/día) → solo si cambia el contenido (3 en la prueba: las 3 visitas) | sube 97; pero cada guardado avisa por Realtime a los demás móviles, que bajan el viaje entero: 97–160 KB cada uno | 23–38 MB en el otro móvil → 0,3 MB sube / 0 baja |
| 3 | `GET trips` con la ruta entera para ver si el viaje ha cambiado (`refrescarViajeActivo`) | `lib/viajeEnDirecto.ts`, `lib/tripPersistence.ts` | cuando el sello caducaba: cada 10 min (48/día) → cada 3 h; y cuando otra persona cambia de verdad el viaje | 97 (Lanzarote) – 160 (Roma) | 4,6–7,7 MB → 0 en la prueba (1 al abrir) |
| 4 | Preguntas de respaldo del viaje compartido: sello (`trips?select=updated_at`), gastos (3 consultas), lo suyo (3 + 2 `auth.getUser`), propuestas (2), avisos | `CompartidoHost`, `GastosCompartidosHost`, `useLoSuyoDelViaje`, `PropuestaHost`, `AvisosHost` | sello 45 s, gastos 2 min, lo suyo 2 min, propuestas 2 min, avisos 3 min → sello y avisos 5 min, gastos, lo suyo y propuestas 10 min (más al volver a la app y tras un cambio) | 0,1–5 cada una | ~3.100 peticiones directas → 562 (medido) |
| 5 | `POST /api/logros/cerca` de «pedazos de la parada» | `components/route/hoy/v2/usePedazosDeParada.ts` | cada vez que cambiaba la identidad del objeto `coordinates` (cualquier repintado de la ruta) → una vez por parada y viaje cada 2 min | ~1,5 | decenas por parada → 1 |

También: `supabase.auth.getUser()` pedía a la red en cada recarga de lo suyo, los gastos y las reservas (480 al día) → ahora 0 (se lee la sesión guardada, `usuarioLocal()`); `/api/tiempo/horas` cada 20 min seguía con la pantalla apagada → solo a la vista; la lista de fotos se pedía una vez por pantalla que se montaba (7 pantallas) → una vez por viaje y 20 s.

## Tabla completa (ahora)

| Consulta | Archivo | Cada cuánto | KB por vez | Suma/día de HOY (8 h) |
|---|---|---|---|---|
| `rpc viajes_lista` (lista ligera) | `tripPersistence.loadTripList` | al abrir la app (y al unirse a un viaje o juntar viajes) | 4 | 4 KB |
| `trips` entero (`loadOneTrip`, `viajeEntero`) | `tripPersistence` | al abrir el viaje; cuando otra persona lo cambia de verdad (sello distinto); respaldo cada 3 h | 47–97 | 0,1–0,3 MB |
| `trips?select=updated_at,guardado_en` (el sello) | `selloDelViaje` ← `CompartidoHost` | cada 5 min a la vista, al volver a verla y al llegar el aviso de Realtime | 0,06 | 6 KB (96 veces) |
| `PATCH trips` (guardar) | `saveTrip` ← `TripSync` (1,5 s de espera) | solo si cambió la ruta, las reservas o los deseos respecto a lo último de la nube | sube 97 | 3 guardados = 292 KB |
| `travelers`, `rpc marcar_alta`, `rpc poner_zona` | `miPerfil`, `moneda`, `cuentas`, `permisoAvisos` | una vez al abrir | 0,2 | 1 KB |
| Realtime `trip_cambios`, `trip_members`, `avisos` | `lib/compartidoTiempoReal.ts` | por evento (la fila de `trip_cambios` pesa ~80 bytes) | 0,1 | cuota de Realtime, aparte |
| `rpc gente_del_viaje` | `useViajeCompartido.cargar` | al abrir, cada 10 min (PropuestaHost) y al llegar un aviso de personas; si la lista es igual, no se cambia nada | 0,3 | 14 KB (48 veces) |
| `trip_recommendations` | `PropuestaHost` | al abrir y cada 10 min a la vista | <1 | <0,05 MB |
| `trip_gastos`, `trip_pagos`, `trip_ex_miembros` | `gastosCompartidosRed` ← `GastosCompartidosHost` | al abrir, cada 10 min a la vista y en directo | 1–10 | <0,2 MB |
| `lo_suyo_del_viaje`, `rpc lo_suyo_del_grupo`, `rpc entradas_del_grupo` | `useLoSuyo.cargar` ← `useLoSuyoDelViaje` | al abrir y cada 10 min a la vista | 1–5 | <0,1 MB |
| `trip_photos` + `createSignedUrls` (lista de fotos y direcciones) | `fotosViaje.listarFotos` ← `useFotosViaje` | una vez por viaje y 20 s; al subir/borrar | ~1,5 + ~3,3 | <0,3 MB (las fotos van por el almacén, otra cuota) |
| `stop_visits` (el Visto) | `vistosApi` ← `VistosPorPersona` | una vez por visita | 0,3 | 1 KB |
| `trips?select=id,route` de los viajes propios | `vistosApi.copiarVistosDeLosViajes` | UNA vez por cuenta y móvil | 97 × nº de viajes | 0 |
| `GET /api/avisos` (campana) | `lib/avisos.ts` ← `AvisosHost` | al abrir, cada 5 min a la vista, y al llegar el aviso | ~2 | 96 llamadas |
| `GET /api/logros/estado`, `/ganados`, `/resumen`, `/viajero`, `/companero` | `components/logros/momentos/api.ts`, `lib/companero.ts` | al abrir y tras cada ronda de logros | 15–25 | ~0,1 MB |
| `POST /api/logros/cerca` | `useCercaDeAqui`, `usePedazosDeParada` | ver arriba | 1,5 | 98 llamadas |
| `GET /api/tiempo/horas` (no usa Supabase) | `AvisosDelTiempo` | cada 20 min a la vista | 3 | 24 llamadas |
| GPS (`getCurrentPosition` cada 45 s) | `useUbicacionHoy` | cada 45 s a la vista | **0: el GPS no habla con Supabase; solo da la coordenada a «cerca de aquí»** | 0 |
| Logros, visitas, sellos | todo en el servidor (`/api/logros/*`) | nada por cada punto de GPS | — | — |

Notas:
- **No hay `watchPosition` en la app** y ninguna consulta se dispara por cada punto de GPS: lo que se repetía eran relojes de 20 a 75 s.
- **No hay `select('*')` de tablas grandes**: los `trips` se piden con columnas; el sello pide solo `updated_at, guardado_en`.
- **La ruta guardada pesa el doble** por `originalRoute` (la copia de la ruta inicial dentro de la propia ruta). Cada bajada o subida del viaje cuesta 2x. Sugerencia (no hecha, toca el servidor y el modelo de datos): sacarla a su propia columna o quitarla de `viajes_lista` y de lo que baja el sondeo.
- La lista de viajes al abrir la app es ligera (`viajes_lista`, V1b); si la migración 0078 no estuviera en producción, cae a la consulta vieja con la ruta de TODOS los viajes: comprobar que la 0078 está aplicada.
- La migración 0087 (`trip_cambios`) estaba SIN APLICAR en el último commit: sin ella Realtime no avisa de los cambios del viaje y el otro móvil se entera por el respaldo (5 min) o al volver a la app.
