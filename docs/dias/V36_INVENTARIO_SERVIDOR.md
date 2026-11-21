# V36 · Inventario del servidor: qué lee de Supabase y cuánto baja

Los números son MEDIDAS con un cliente de Supabase de mentira (`scripts/destino/pruebaV36_servidor.mjs`: un viajero con 300 hechos, 90 logros y una ruta de 79 KB; un panel con 400 cuentas, 500 viajes, 200 pases y 1.500 logros) o ESTIMACIONES (se dice cuál). No se ha tocado producción.

## Las 5 que más gastaban (arriba la fuga)

| # | Consulta | Archivo | Cada cuánto | KB por vez | Suma al día | Estado |
|---|---|---|---|---|---|---|
| 1 | `viajes_en_curso_para_avisos`: la RUTA ENTERA y las reservas de cada viaje en curso con alguien a quien avisar | `server/avisosViaje.js` (versión del 5-nov, la de la fuga) llamada por `pg_cron` (0075) | **cada minuto** (1.440/día) mientras había un viaje en curso | ~80-350 por viaje (la ruta de Lanzarote) | ~115-500 MB por viaje y día (estimación; Eric y Alicia = 2 viajes) | **ARREGLADO el 15-nov (V1)**: plan guardado en `avisos_programados`, huella md5 dentro de la base, tarea cada 5 min. Necesita la migración 0077 aplicada |
| 2 | Carga completa de logros (`cargar`: hechos, viajes, logros, cuenta, pioneros, probador, perfil, referidos, invitador = 9 lecturas, 12 consultas) en `/api/logros/cerca` | `server/logros/servicio.js` + `repo.js` | cada 45 s con HOY abierto (el móvil ahora cada 75 s) | ~128 (medido) | 82 MB en 8 h por persona (medido, 640 vueltas) | **ARREGLADO ahora (V36)**: `cerca` solo lee viajes y logros y lo guarda 30 s: **0,1 MB en 8 h** |
| 3 | `leerBase` del panel: 15 tablas enteras + todas las cuentas, en CADA petición de Inicio, Ventas, Usuarios y Logros (+ `achievements` otra vez en la pestaña Logros) | `server/panel/base.js`, `pruebas.js`, `logrosPanel.js` | cada clic, cada cambio de periodo, cada tecla del buscador (Usuarios la guardaba 30 s solo para sí) | ~280 por petición con 400 cuentas (crece con la base) | 12 clics = 3,4 MB (medido) | **ARREGLADO ahora (V36)**: una lectura guardada 60 s sirve a todas las pestañas, la pestaña Logros usa la misma: **0,49 MB** (7 veces menos) |
| 4 | `viajesDe`: la ruta de cada viaje del viajero | `server/logros/repo.js` | en cada carga de logros (`estado`, `resumen`, `ficha`, `pasaporte`…) | ~100 (id + sello) y la ruta solo si cambió | casi 0 | Ya arreglado en la V26 (19-nov): sello `updated_at` + memoria 15 min |
| 5 | `place_content_cache` / `place_photo_cache` / `route_cache` (`select *` o `place_data`) | `server/index.js` (1824, 5557, 5609, 2846) | al generar una ruta o abrir una ficha, no por sondeo | 1-8 por lectura | < 1 MB por viaje | Sin cambios (no se repiten; la foto ya tiene caché propia en el servidor y en el móvil) |

## Todas las rutas que leen de Supabase

| Ruta / tarea | Consulta | Archivo | Quién la llama y cada cuánto | KB | Notas |
|---|---|---|---|---|---|
| `/api/cron/avisos-viaje` | `avisos_viajes_por_planificar` (ids y huella), `avisos_programados_debidos` (textos), `avisos_viaje_para_plan` (UNA ruta, solo si cambió o cada 6 h) | `server/avisosViaje.js` | `pg_cron` de Supabase cada 5 min (0077) | ~0,1 por vuelta; ~100 por plan nuevo | Sin `CRON_SECRET` da 404: un servidor local nunca puede dispararla |
| `/api/cron/avisos` | avisos con fecha de todos | `server/avisos.js` | Vercel, 1 vez al día (09:00) | pequeño | único cron de `vercel.json` |
| `/api/logros/cerca` | `trips` (id, sello), `trip_members`, `trip_invitations`, `achievements` | `server/logros/servicio.js` | HOY, cada 75 s con la app a la vista | 0,1 MB/8 h | V36: lectura ligera guardada 30 s; se vacía con cualquier escritura |
| `/api/logros/estado`, `/ficha`, `/resumen`, `/pasaporte`, `/exp`, `/viajero`, `/vitrina`, `/companero`, `/sitios`… | carga completa (`cargar`) | `server/logros/servicio.js` | al abrir cada pantalla, no por sondeo | 20-130 según los hechos | `hechosDe` y `logrosDe` usan `select *` (ver «Pendiente») |
| `/api/logros/visto`, `/foto` | carga completa + `insertarHecho` | idem | por evento (un Visto, una foto) | 20-130 | normal |
| `/api/admin/inicio`, `/ventas`, `/usuarios*`, `/logros-panel/resumen` | `leerBase` (15 tablas + `auth.admin.listUsers`) | `server/panel/*.js` | el administrador, a mano | 280 la primera, 0 las siguientes (60 s) | V36: una lectura para todas; un POST/PUT del panel la olvida |
| `/api/admin/inicio?resumen=1` | 2 cuentas de `avisos_de_viajeros` | `server/panel/inicio.js` | menú del panel | ~0 | ya era ligera |
| `/api/admin/reportes*` | `avisos_de_viajeros` (50 en 50) | `server/panel/reportes.js` | el administrador | pequeño | paginada |
| `/api/zona-turistica`, `/zona-restaurantes`, `tips_anclas`, `transporte_cercano` | una fila por lugar | `server/index.js` | al generar o abrir ficha | < 2 | cachés de datos que no cambian |
| `/api/trip-sales`, `/api/afiliados/clic` | filas de `affiliate_sales`, 1 RPC | `server/index.js`, `server/panel/index.js` | por evento | < 1 | |
| Civitatis (`civitatis_cache`) | 1 fila por clave, con memoria del servidor | `server/civitatis/cache.js` | al abrir actividades | 1-20 | ya tiene memoria y TTL |

## Tareas programadas y el PC de Eric

- No hay `setInterval`, `node-cron` ni nada parecido en `server/`, `api/` ni `shared/` (salvo el contador de desarrollo de esta tanda, que NO pregunta a Supabase: solo cuenta lo que ya se hace). Lo comprueba `pruebaV36_servidor`.
- Los crons viven fuera: `vercel.json` (1 al día, contra producción) y `pg_cron` de Supabase (cada 5 min, llama a la dirección de PRODUCCIÓN guardada en el Vault). Un servidor en 8787 en el PC de Eric no se dispara solo: nadie lo llama y, sin `CRON_SECRET`, las rutas de cron dan 404.
- Con la clave de producción en el PC de Eric, el único gasto es el de lo que Eric abre en el navegador de prueba apuntando a esa API. Para ver cuánto es, el contador nuevo escribe cada minuto «Supabase (servidor): X peticiones, Y KB».

## Pendiente (no hecho; poco o nada de gasto hoy)

- `hechosDe` y `logrosDe` bajan todas las columnas (`select *`). En la medida, `logro_hechos` pesa ~380 bytes por fila; con 300 hechos son ~110 KB por carga completa. Se podría pedir solo las columnas usadas, pero hay que auditar cada uso de `h.*` (riesgo de romper logros; no se ha tocado).
- `quienEs` pregunta a Auth (`/auth/v1/user`) en cada ruta con sesión. Es Auth, no PostgREST (el 99,8 % de la fuga), y pesa ~1 KB.
