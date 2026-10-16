# Plan de las cuentas, parte 1 (lo de dentro)

Escrito antes de programar (16-oct-2026). Lo que sale de leer el código está marcado con el fichero. Lo que choca con el encargo o es un riesgo va al final, en «Choques y riesgos».

## 1. Qué guarda hoy la app y dónde

Hoy **ya hay una sesión de Supabase para todo el mundo**: cada dispositivo entra con una sesión anónima (`signInAnonymously`, `src/lib/tripPersistence.ts`) y tiene su propio `auth.uid()`. Por eso casi todo está ya en la nube, no en el móvil.

| Qué | Dónde está hoy | Fichero |
|---|---|---|
| El viaje (ruta, días, paradas) | Supabase, tabla `trips`, columna `route` (jsonb); autoguardado con espera de 1,5 s | `tripPersistence.ts`, `TripSync.tsx` |
| Reservas, alojamiento, transporte, vuelos, lista de deseos, pestaña en la que estaba | Supabase, `trips.bookings`, `trips.wishlist`, `trips.ui_state` | `tripPersistence.ts` |
| La generación a medias | Supabase, `trips.generation_state` | `tripPersistence.ts` |
| **Vistos** (✓ de cada parada) | Dentro de la ruta: `route.days[].stops[].checkedInAt`. O sea, en `trips.route` y **del viaje, no de la persona** | `useRouteStore.setStopVisto` |
| Fotos del viaje | Supabase: bucket privado `fotos-viaje` + tabla `trip_photos`, con la sesión anónima. Se re-codifican en el navegador (1.600 px, calidad 0,82) y se les quitan los metadatos antes de subir | `fotosViaje.ts`, migración 0018 |
| «Me gusta» de los sitios | Supabase `place_likes` **y** copia en el móvil (`localStorage`, `trazo:megusta:<destino>`) para cuando no hay nube | `useMeGustaStore.ts`, migración 0012 |
| Avisos leídos | Solo en el móvil (`localStorage`) | `useNoticesStore.ts` |
| Modo oscuro | Solo en el móvil (`localStorage`) | `useRouteStore.ts` |
| Cachés de sitios y fotos de sitios | Supabase, tablas globales (no son de nadie) | migraciones 0004–0016 |
| Ventas del afiliado | Supabase `affiliate_sales`, solo con la clave de servicio | migración 0017 |

Lo único que vive solo en el móvil y es del viajero: los «me gusta» sin subir, los avisos leídos y el modo oscuro. Todo lo demás ya cuelga de su `auth.uid()` anónimo.

## 2. Cómo pasar todo eso a la cuenta sin que nadie pierda nada

La clave: **una sesión anónima de Supabase se puede convertir en cuenta real conservando el mismo `uid`**. Si el `uid` no cambia, no hay nada que mover: los viajes, fotos y «me gusta» siguen siendo suyos.

**Caso A. Primera cuenta en este móvil (el normal).**
- Email: `auth.updateUser({ email })`. Supabase manda el enlace mágico; al pulsarlo la sesión anónima pasa a ser real con el mismo `uid`.
- Google: `auth.linkIdentity({ provider: 'google' })`, también con el mismo `uid`.
- Nada se mueve. Se marca `travelers.is_anonymous = false` y se guarda la fecha de alta.

**Caso B. Esa persona ya tiene cuenta (otro móvil, o reinstaló).**
- Entra con `signInWithOtp` / `signInWithOAuth`: es otro `uid`. Lo que tenía este móvil como anónimo (quizá un viaje) hay que traerlo a la cuenta.
- Antes de cambiar de sesión se guarda en el móvil el token de la sesión anónima. Tras entrar, el cliente llama al servidor, `POST /api/cuenta/reclamar`, con **los dos** tokens.
- El servidor (con la clave de servicio) comprueba que el viejo es de verdad anónimo y que los dos son válidos, y pasa a la cuenta: los viajes, las fotos (filas y archivos del almacenamiento), los «me gusta» y los vistos. Luego borra el usuario anónimo vacío.
- Solo con el interruptor encendido. Si el servidor no tiene la clave de servicio responde con un aviso claro y no toca nada.

**Cosas que solo estaban en el móvil.** Al entrar se suben los «me gusta» que quedaron sin subir (ya lo hace el store); avisos leídos y modo oscuro se quedan en el móvil (son del aparato, no de la cuenta).

**Vistos.** Hoy están dentro de la ruta del viaje. Con un viaje compartido cada persona necesita los suyos: tabla nueva `stop_visits`, de cada persona. Al entrar, los vistos que el administrador ya tiene en la ruta se copian a su tabla. La app sigue leyendo los del administrador de la ruta hasta que lleguen las pantallas nuevas (parte 2); los de un invitado solo existen en la tabla.

## 3. Tablas nuevas (migración 0020) y quién ve qué

Regla general: cada persona solo ve lo suyo y lo de los viajes donde está invitada.

| Tabla | Para qué | Quién lee | Quién escribe |
|---|---|---|---|
| `app_config` | Datos de la app como dato, no escritos a mano: `salida_app` = `2026-11-04` | Todos | Solo el servidor |
| `travelers` (ya existe) | Se le añaden `alta_cuenta`, `email`, `nombre` | Cada uno el suyo | Cada uno el suyo |
| `trips` (ya existe) | **Dueño = administrador** (`traveler_id`). Se rehacen las reglas | Dueño e invitados | Solo el dueño cambia o borra; crea cualquiera |
| `trip_members` | Invitados de un viaje (`rol`: `admin` o `invitado`) | El dueño y el propio invitado | El dueño invita; el invitado puede salirse |
| `trip_recommendations` | Lo que un invitado recomienda: `cambio`, `dia` o `ruta`, con su `payload` | El autor y el dueño | El invitado crea; solo el dueño la acepta o la rechaza |
| `stop_visits` | Vistos de cada persona (viaje, día, parada, cuándo) | Cada uno los suyos | Cada uno los suyos |
| `trip_photos` (ya existe) | Fotos de cada persona | Cada uno las suyas | Cada uno las suyas |
| `trip_photo_meta` | Fecha y, si la tiene, sitio de la foto, leídos **antes** de quitar los datos escondidos. Aparte, para los logros | Cada uno los suyos | Cada uno los suyos |
| `achievements` | Logros: qué logro, qué escalón, cuándo, en qué viaje y destino. Hoy vacía | Cada uno los suyos | Solo el servidor (que no se los dé uno mismo) |
| `passes` y `pass_members` | Pases: destino, quién lo compró, tipo (`uno`, `duo`, `grupo`), para quién, usos, fecha, código. Hoy sin cobro: todo sigue abierto | El comprador y los que lo usan | Solo el servidor |
| `place_likes` (ya existe) | Sin cambios | Todos (para los totales) | Cada uno los suyos |

**Viajero fundador.** `travelers.alta_cuenta` guarda la fecha en que la persona pasó a tener cuenta real (la rellena una función del servidor de datos, `marcar_alta()`, solo si la sesión ya no es anónima). Es fundador quien tiene `alta_cuenta` **anterior a `salida_app + 1 año`**. La salida (`app_config.salida_app`, hoy 4-nov-2026) es un dato: si cambia la salida, cambia la fecha sin tocar código. Una vista (`viajero_fundador`) y una función (`es_fundador()`) lo calculan.

**Reglas de los invitados (por qué no hay recursión).** Las reglas de `trips` consultan `trip_members`, y las de `trip_members` consultan `trips`. Para que no se llamen entre sí sin fin, las dos comprobaciones (`es_dueno(viaje)`, `es_miembro(viaje)`) son funciones `security definer`.

## 4. Las fotos en la nube

Lo que ya hay y vale: bucket privado, carpeta `{uid}/…`, reglas por dueño, copia pequeña, quitar metadatos y borrar al borrar la cuenta (el usuario cae en cascada en las tablas, no en los archivos: hay que borrarlos aparte, ver §5).

Lo que se cambia:
- **~300 KB cada una.** Hoy salen de 1.600 px a calidad 0,82, que suele dar 400–900 KB. La foto grande pasa a ajustarse (baja la calidad y, si hace falta, el lado) hasta quedar en unos 300 KB, sin bajar de 1.000 px de lado largo ni de calidad 0,55.
- **Leer antes de quitar.** Antes de pasarla por el lienzo, se lee con un lector pequeño de EXIF la fecha en que se hizo (`DateTimeOriginal`), la ubicación si la lleva y si trae datos de cámara (marca y modelo; hará falta para la regla de «foto de cámara» de los logros). Eso va a `trip_photo_meta`. **Nunca se sube la ubicación dentro de la foto**: la foto sigue saliendo sin metadatos.
- **[Guardar en mi galería].** Una función `guardarEnMiGaleria(foto)` que baja la foto grande al móvil. Botón provisional en el visor de fotos hasta que Design dibuje el suyo.
- **Privadas y borrado.** Sin cambios en las reglas; el borrado de la cuenta se lleva también los archivos (§5).

## 5. Borrar la cuenta

Un botón (provisional) en el Perfil, con confirmación, que llama a `DELETE /api/cuenta`. El servidor, con la clave de servicio:
1. Comprueba quién es (token).
2. Borra todos los archivos de `fotos-viaje/{uid}/…`.
3. Borra al usuario de Supabase. Eso arrastra por cascada: `travelers`, sus `trips` (y con ellos `trip_members` y `trip_recommendations` de esos viajes), `trip_photos` y `trip_photo_meta`, `stop_visits`, `place_likes`, `achievements` y `pass_members`; los pases que compró se borran también.
4. En los viajes donde solo estaba invitado, lo único que desaparece es su fila de invitado y sus cosas; el viaje del administrador sigue.
5. Devuelve «todo borrado» y la app vuelve al principio.
La prueba lo comprueba mirando todas las tablas y el almacenamiento.

## 6. Entrar en la app

- Interruptor `cuentasActivas()` (`src/lib/cuentas.ts`): apagado salvo `VITE_CUENTAS_ACTIVAS=true`. Para probar en desarrollo también vale `?cuentas=on` en la dirección. **Con él apagado, el código nuevo no se ejecuta y la app es la de hoy.**
- Pantalla provisional de entrar (email con enlace mágico, o Google) y un «seguir sin cuenta» para pruebas. Se pide al empezar solo con el interruptor encendido.
- Perfil (con el interruptor): «Cerrar sesión», «Borrar mi cuenta» y «Privacidad».

## 7. Privacidad

Página con su estructura (qué guardamos, para qué, cuánto tiempo, cómo borrarlo, a quién escribir). Cada apartado dice «Texto pendiente». Sí nombra los servicios que tratan datos (única excepción a la regla de no nombrar empresas); la lista está en el informe.

## 8. Migraciones

Una nueva, `0020_cuentas.sql`, que no se aplica en producción. Orden y requisitos en el informe.

## 9. La prueba

La prueba nueva (`pruebaCuentas1.mjs`) ejecuta **de verdad** la migración sobre un Postgres de prueba que corre dentro de Node (PGlite), con un `auth.uid()` simulado y las reglas de seguridad activas, y comprueba: entrar, un viaje del móvil que pasa a la cuenta, una foto, un invitado que no puede cambiar la ruta, y borrar la cuenta sin que quede nada. La parte de las fotos escondidas se prueba con una foto de verdad con EXIF.

## Choques y riesgos

1. **«Subir lo del móvil a la cuenta» casi no hace falta.** Los viajes, las fotos y los «me gusta» ya están en la nube bajo la sesión anónima. Lo que hace falta es **conservar el `uid`** al hacer la cuenta (Caso A) y **trasladarlo** solo si ya existía una cuenta (Caso B).
2. **Hay que activar cosas en Supabase** (explicado paso a paso en el informe): vincular identidades a mano, proveedor de Google, enlaces de vuelta permitidos y un servicio de envío de correos propio (el de Supabase solo manda unos pocos al día). Sin eso, el enlace mágico y Google no funcionan.
3. **El Caso B necesita la clave de servicio en el servidor** (`SUPABASE_SERVICE_ROLE_KEY`, que ya se usa para las ventas del afiliado). Sin ella, entrar con una cuenta que ya existe en otro móvil no traspasa lo del móvil actual. Borrar la cuenta también la necesita.
4. **Los vistos hoy son del viaje, no de la persona.** Para un viaje compartido hace falta `stop_visits` (se crea ahora) y cambiar dónde se leen en la parte 2, con las pantallas. Hasta entonces el administrador sigue con los suyos en la ruta.
5. **La prueba con Postgres de verdad no es Supabase.** PGlite no trae `auth`, `storage` ni el servicio de enlaces; se simulan (`auth.uid()` y las tablas del almacenamiento). Prueba bien las reglas de seguridad y la cascada, pero no el envío de correos, Google ni el borrado real de archivos. Eso queda para probarlo a mano con una cuenta de prueba cuando se apliquen las migraciones.
6. **Reglas de `trips` rehechas.** La migración cambia las reglas de una tabla que ya está en uso. Si no se aplica entera (o si falla a medias), los viajes dejarían de poder leerse. Va en una sola transacción.
7. **El límite de fotos de la gratis (una por parada) no cambia.** Es de la regla de pago, no de las cuentas.
8. **No se toca el motor de rutas.** Nada de `shared/routeEngine` ni de `server/engine`. El servidor se toca solo para añadir el módulo de cuentas.
