# Informe: las cuentas, parte 1 (lo de dentro)

16-oct-2026. El plan, escrito antes de programar, está en `PLAN_CUENTAS.md`. No se ha tocado el motor de rutas (nada de `shared/routeEngine` ni de `server/engine`).

## En una frase
Todo lo de dentro de las cuentas está hecho y probado, detrás de un interruptor **apagado**. Con el interruptor apagado la app es exactamente la de hoy. Falta aplicar la migración, activar cosas en Supabase y que Design dibuje las pantallas.

## Qué he hecho

**1. Una sorpresa buena.** Hoy cada móvil ya entra con una sesión anónima de Supabase y casi todo (viajes, fotos, «me gusta») ya cuelga de ella. Por eso «subir lo del móvil a la cuenta» casi no hace falta: al hacer la cuenta, la sesión anónima se convierte en la cuenta **con el mismo identificador**, y no se mueve nada. Solo si la persona ya tenía cuenta (otro móvil) hay que pasar lo del móvil, y eso lo hace el servidor.

**2. El interruptor** (`src/lib/cuentas.ts`). Apagado salvo `VITE_CUENTAS_ACTIVAS=true`. En desarrollo también vale `?cuentas=on` o `?cuentas=off` en la dirección. En producción la dirección no enciende nada.

**3. Entrar.** Con el email (enlace mágico) o con Google. Apple, más adelante. Una pantalla provisional («Entra en tu cuenta», con «Seguir sin cuenta (solo para pruebas)») que sale al empezar solo con el interruptor encendido. En el Perfil, un bloque «Mi cuenta» con [Cerrar sesión], [Privacidad] y [Borrar mi cuenta] (con confirmación). Provisionales: las de verdad las dibuja Design.

**4. Lo que se guarda en la cuenta** (migración `0020_cuentas.sql`, una sola, en una sola transacción):
- **Viajes:** el dueño es el administrador y es el único que cambia o borra la ruta. Los invitados (`trip_members`) la ven pero no la cambian. Mandan recomendaciones (`trip_recommendations`: un cambio suelto, un día nuevo o la ruta entera) que el administrador acepta o rechaza; el administrador no puede reescribir lo que se recomendó, solo decidir.
- **Vistos** (`stop_visits`): de cada persona, aunque compartan viaje. Al entrar, los vistos que el administrador ya tiene dentro de la ruta se copian a su tabla.
- **Fotos:** `trip_photo_meta` guarda aparte la fecha de la toma, la ubicación (si la tenía) y si la hizo una cámara, leídos antes de quitarle los datos escondidos. La foto que se sube sale sin ellos.
- **Logros** (`achievements`): preparada, vacía. Solo el servidor concede un logro.
- **Pases** (`passes`, `pass_members`): preparada, vacía; tipo uno, Dúo o grupo, para quién, usos, código y fecha. Sin cobro: todo sigue abierto. Solo el servidor los crea.
- **Viajero fundador:** `travelers.alta_cuenta` guarda la fecha de alta (la rellena `marcar_alta()` solo si la sesión ya no es anónima). Es fundador quien se da de alta **antes de «salida + 1 año»**. La salida es un dato (`app_config.salida_app`, hoy `2026-11-04`), no un número escrito en el código: si cambia la salida, cambia la fecha límite.
- Cada persona solo ve lo suyo y lo de los viajes donde está invitada.

**5. Las fotos en la nube.** Ya eran privadas (carpeta por persona, sin ubicación, copia pequeña). Ahora, con las cuentas encendidas: cada foto grande se ajusta a unos **300 KB** (baja la calidad y, si hace falta, el lado, sin pasar de 1.000 px ni de calidad 0,55); se leen la fecha y el sitio antes de quitarlos; y hay `guardarEnMiGaleria()` para bajar la foto al móvil (con la hoja de compartir donde existe, o descargándola). Falta el botón de Design.

**6. Pasar lo del móvil a la cuenta** (`POST /api/cuenta/reclamar`, `server/cuentas.js`). Si la persona ya tenía cuenta, el servidor comprueba los dos accesos, mueve los archivos de las fotos a la carpeta de la cuenta y llama a `reclamar_anonimo()`, que pasa viajes, fotos, vistos, «me gusta», invitaciones, logros y pases (sin duplicar lo repetido) y borra la sesión anónima ya vacía. Si algo falla a medias, devuelve los archivos a su sitio.

**7. Borrar la cuenta** (`DELETE /api/cuenta`). Borra los archivos de las fotos y al usuario; el resto cae en cascada: viajes que administra (con sus invitaciones y recomendaciones), vistos, fotos, logros y pases. Donde solo era invitada, desaparece ella y el viaje del administrador sigue. La prueba lo comprueba mirando **cada tabla entera** y el almacenamiento.

**8. Privacidad.** Página con su estructura (quién es el responsable, qué guardamos, para qué, cuánto tiempo, con quién lo compartimos, cómo borrarlo, tus derechos, a quién escribir). **Cada apartado dice «Texto pendiente»: los textos legales los escribes tú.** Es la única página que nombra empresas (lista abajo, en `src/lib/privacidad.ts`).

## La prueba
`node scripts/destino/pruebaCuentas1.mjs`: **181 comprobaciones, 0 fallos**. Ejecuta de verdad la migración sobre un Postgres de prueba (PGlite, dentro de Node) con las reglas de seguridad activas y comprueba, entre otras cosas:
- entrar (la sesión anónima pasa a cuenta, se guarda la fecha de alta una vez, fundador sí/no y que cambia con la salida);
- subir un viaje del móvil a la cuenta (el caso de la cuenta que ya existía), con foto (sus dos archivos), visto y «me gusta» repetido sin duplicar;
- un invitado que **no** puede cambiar la ruta, ni borrar el viaje, ni quedárselo, ni aceptar su propia recomendación; el administrador que acepta y no puede reescribir;
- vistos y fotos de cada persona sin mezclarse; logros y pases que nadie se da a sí mismo;
- borrar la cuenta sin que quede **nada** suyo en ninguna tabla ni en las fotos, y borrar a una invitada sin tocar el viaje del administrador;
- la foto con datos escondidos de verdad: se lee la fecha, el sitio y la cámara, y la foto limpia ya no los lleva;
- con el interruptor apagado no se pinta nada y el código no cambia.
Es una prueba nueva en la batería rápida (`bateriaParalela.mjs` ya la incluye). Resultado de la batería: ver al final.

## Lo que tienes que hacer tú, fuera del código (paso a paso)
No me pegues ninguna clave en el chat: las claves se ponen solo en los paneles de Supabase, Google y Vercel.

**A. Aplicar la migración (una sola).**
1. Antes, comprueba que ya están aplicadas las migraciones 0001, 0002, 0003, 0012 y **0018** (las fotos). La 0020 depende de ellas; sin la 0018 falla con «relation trip_photos does not exist» y no cambia nada.
2. Supabase → tu proyecto → **SQL Editor** → «New query» → pega todo `supabase/migrations/0020_cuentas.sql` → **Run**.
3. Si sale un error, no se queda nada a medias (va en una transacción). Dime el mensaje.
4. Para mirar que ha ido bien: Table Editor → deben salir `trip_members`, `trip_recommendations`, `stop_visits`, `trip_photo_meta`, `achievements`, `passes`, `pass_members` y `app_config`.
5. No la apliques hasta que quieras probar las cuentas: reescribe las reglas de `trips`, que ya está en uso.

**B. Activar cosas en Supabase** (Authentication).
1. **Sign In / Providers → Allow anonymous sign-ins:** ya debería estar encendido.
2. **Sign In / Providers → Allow manual linking:** enciéndelo. Sin esto, «Entrar con Google» no puede unir la cuenta a lo que ya tiene el móvil.
3. **Email:** deja encendido el proveedor Email con enlace mágico (magic link).
4. **URL Configuration:** en «Site URL» pon la dirección de la app; en «Redirect URLs» añade la dirección de producción y `http://localhost:5173` (para probar).
5. **Un servicio de envío de correos propio** (Authentication → Emails → SMTP Settings). El correo que trae Supabase de serie manda muy pocos al día y está pensado solo para probar: con él, los enlaces mágicos «se quedan cortos» y a veces no llegan. Hace falta contratar un servicio de envío (los hay con plan gratis para empezar), verificar tu dominio en él y copiar sus datos de conexión en ese panel. Decide cuál (es la única cosa «por elegir» de la lista de servicios).
6. En Authentication → Email Templates, pon el texto del enlace en español.

**C. Entrar con Google.**
1. En la consola de Google Cloud: crea un proyecto → «APIs y servicios» → pantalla de consentimiento de OAuth (nombre de la app, tu email) → «Credenciales» → «Crear credenciales» → «ID de cliente de OAuth», tipo «Aplicación web».
2. En «URI de redireccionamiento autorizados» pega la que te enseña Supabase en Authentication → Sign In / Providers → Google (acaba en `/auth/v1/callback`).
3. Copia el ID de cliente y el secreto **directamente** en ese panel de Supabase de Google y enciende el proveedor. Los dos valores no los pegues en ningún otro sitio.
4. Antes de abrir al público, Google pide verificar la app; mientras tanto solo entran los usuarios de prueba que añadas en la pantalla de consentimiento.

**D. El servidor** (Vercel → Settings → Environment Variables).
1. `SUPABASE_SERVICE_ROLE_KEY`: ya se usa para las ventas del afiliado. Compruébalo; si no está, añádela (Supabase → Project Settings → API → clave «service_role»; **nunca** con el prefijo `VITE_`, porque iría a los móviles). Sin ella, «entrar con una cuenta que ya existía» y «borrar la cuenta» responden con un aviso y no hacen nada.
2. `VITE_CUENTAS_ACTIVAS`: **no la pongas** (o `false`) hasta que estén las pantallas de Design. Cuando estén: `true` y volver a desplegar.

**E. Probar a mano con una cuenta de prueba** (cuando apliques lo anterior y enciendas el interruptor en un entorno de pruebas):
1. Entrar con un email nuevo desde el móvil que ya tenía un viaje: el viaje sigue ahí y el Perfil dice «Has entrado como…».
2. Entrar con Google en otro móvil con el mismo email: lo del segundo móvil aparece en la cuenta.
3. Subir una foto: pesa unos 300 KB, no tiene ubicación y en `trip_photo_meta` queda su fecha.
4. Borrar la cuenta y mirar en Supabase (Table Editor y Storage → `fotos-viaje`) que no queda nada.

**F. Los textos de privacidad.** Escribe cada apartado de la página (ahora todos dicen «Texto pendiente»). Y decide el correo de contacto.

**G. Si cambia la salida de la app:** en el SQL Editor, `update public.app_config set value = '"2026-11-18"' where key = 'salida_app';` (con la fecha nueva). La fecha límite de «viajero fundador» se mueve sola.

## Migraciones pendientes y orden
Solo **una** nueva: `0020_cuentas.sql`. Va después de las que ya haya (0001 a 0019); necesita al menos 0001, 0002, 0003, 0012 y 0018. No hay que aplicarla en producción todavía.

## Servicios de fuera que tratan datos (los nombra la página de privacidad)
- **Supabase:** guarda la cuenta, los viajes, las fotos y los vistos, y manda los enlaces para entrar.
- **Google:** solo si eliges entrar con Google (email y nombre).
- **Un servicio de envío de correos (por elegir):** manda el enlace mágico (tu email).
- **Anthropic (Claude):** prepara parte de las rutas y de los textos de los destinos no escritos a mano (destino, fechas y preferencias; no tu email).
- **Mapbox:** mapas, búsqueda de lugares y lo que se tarda andando.
- **Vercel:** aloja la web y el servidor.
- **Open-Meteo:** previsión de lluvia (ciudad y fechas).
- **Banco Central Europeo:** cambio de moneda (sin datos tuyos).
- **Wikimedia y Unsplash:** fotos de sitios (sin datos tuyos).
- **Enlaces de afiliado** (Stay22, Booking.com, Civitatis, DiscoverCars, Holafly, iati, N26): al pulsar uno sales de la app; reciben un código de campaña del viaje, sin tu nombre ni tu email.
No aparece ElevenLabs: hoy la app no lo llama; si más adelante se generan audios al vuelo, hay que añadirlo.

## Qué falta
- Las pantallas de verdad (Design): entrar, la cuenta, la privacidad, [Guardar en mi galería] y las de invitar y recomendar. Las de ahora son provisionales.
- **Invitar a alguien:** la tabla y las reglas están, pero falta el modo de que el dueño invite (un enlace o un código) y que la otra persona entre. Va con el Pase Dúo y las pantallas.
- **Leer los vistos de cada persona desde la tabla.** Hoy la app sigue leyendo los del administrador de la ruta. Hasta que lleguen las pantallas de la parte 2, un invitado puede marcar vistos (existe la API en `vistosApi.ts`) pero la app no los pinta.
- **Aceptar una recomendación cambia la ruta:** hoy solo se marca como aceptada; aplicar el cambio a la ruta es de la parte 2.
- El cobro de los pases y la concesión de logros (tandas siguientes).
- Entrar con Apple (cuando vayamos a las tiendas).

## Riesgos y lo que no he podido hacer
- **No he probado con Supabase de verdad, ni con Google, ni el envío de correos.** La prueba usa un Postgres de verdad pero no es Supabase: el acceso (`auth`) y el almacenamiento están simulados. Prueba bien las reglas de seguridad, la cascada y el servidor, pero lo de los enlaces, Google y el borrado real de archivos queda para tu prueba a mano (punto E).
- **El caso de Google con una cuenta de Google que ya existía** depende de cómo responda Supabase al volver del enlace; el código lo recoge (`identity_already_exists` y entra en esa cuenta) pero es lo más fino de probar a mano.
- **Los 300 KB** salen de un bucle de calidades y tamaños que se comprueba en lógica, no midiendo fotos reales en un navegador. Conviene subir 3 o 4 fotos de móvil y mirar `bytes` en `trip_photos`.
- **Reglas de `trips` reescritas:** la migración cambia las reglas de una tabla en uso. Va en una transacción, pero aplícala con calma y comprueba después que sigues viendo tus viajes.
- **Un pase de pago que compró alguien que borra su cuenta se borra** (así lo pedía el encargo). Quien lo usaba lo pierde. Habrá que decidirlo cuando haya cobro.
- **Borrar un viaje de otro por borrar su cuenta:** si el administrador borra su cuenta, el viaje compartido desaparece para los invitados (lo pedía el encargo: «los que administra»). Sus fotos y logros no se tocan.
- **Tokens guardados en el móvil:** para poder pasar lo del móvil a una cuenta que ya existía se guarda en `localStorage` el identificador y el token de renovación de la sesión anónima, hasta que se pasa. Es lo mismo que Supabase ya guarda de la sesión; se borra al terminar o al borrar la cuenta.
- La prueba no mide el peso de la app al abrirla (regla de la Tanda 8); lo nuevo se carga con la app pero es poco código.
- `@electric-sql/pglite` entra como dependencia **de desarrollo** (solo para la prueba); no viaja a la web.

## Resultado de la batería rápida
82 pruebas (sin `pruebaFase6y5_motor`, que no se toca: el motor no ha cambiado): todas en 0 fallos, incluida `pruebaCuentas1` (181 comprobaciones). Una, `pruebaTanda6o`, falló la primera vez porque `cuentas.ts` recargaba la página con `location.replace`, y esa prueba prohíbe esa llamada fuera de los enlaces sellados; se cambió por `history.replaceState` + `location.reload` y vuelve a 0. `tsc -p tsconfig.app.json` sin errores.
