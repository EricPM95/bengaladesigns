# Arreglo de entrar: la página que no paraba de recargar

Ninguna clave aparece aquí ni en el repositorio. No he tocado el motor de rutas ni tu navegador normal.

## 1. Qué pasaba

Con tu Google ya unido a una cuenta, al entrar desde un navegador con otra sesión anónima:
1. [Continuar con Google] intentaba **vincular** tu Google a la sesión anónima de ese navegador (`linkIdentity`).
2. Supabase contestaba al volver: «esa cuenta de Google ya existe» (`identity_already_exists`).
3. La app lo veía y llamaba **otra vez** a entrar con Google. Como la sesión **seguía siendo anónima**, volvía a intentar vincular… el mismo error… y así sin parar. Por email no había bucle.

(Esto lo había encontrado otra sesión de Code en la nube; su commit `9d61655` **no está** en el repositorio, así que lo he hecho yo desde cero.)

## 2. Qué he cambiado

En `src/lib/cuentas.ts`:
- **Con «esa cuenta ya existe», la app entra directamente en esa cuenta** (`signInWithOAuth`), **sin volver a vincular**. Un solo intento.
- **Ningún bucle:** si en los 5 minutos siguientes vuelve otro error (o es cualquier otro error: cancelar en Google, etc.), se para: sale **«No hemos podido entrar. Inténtalo de nuevo.»** en la pantalla de entrar, con su mismo botón [Continuar con Google], y **no se recarga nada**.
- **Después de entrar, la página recarga una sola vez**, y solo si había algo que pasar a la cuenta.
- **Lo de la sesión anónima pasa a tu cuenta** (`/api/cuenta/reclamar`): antes de salir a Google se guarda esa sesión con su token; el token guardado **se mantiene al día** cada vez que Supabase lo renueva; y si pasarlo falla, **no se olvida** (se reintenta la próxima vez, sin recargar).
- Se añadió `.env` a `.gitignore` (antes solo lo cubría `*.local`).
- La pantalla de entrar enseña el aviso (`EntrarCuenta.tsx`).

## 3. A qué cuenta está unido tu Google y dónde están tus viajes

(`node scripts/cuentas/cuentaDeEric.mjs --email=…`, con tu email; solo lee.) El email del administrador (`LOGROS_ADMIN_EMAILS`) solo está en Vercel, no en `.env.local`, así que se le pasa con `--email`.
- **Una sola cuenta con tu email** (identificador `3024d56f…`), creada el 14 sep, y **tu Google está unido a ella desde hoy 20 oct a las 07:11** (la unión se hizo con éxito desde otro sitio, seguramente el móvil). **No hay dos cuentas** con tu email.
- **Tus 3 viajes de Roma están en esa cuenta** (uno sin fechas, uno del 28 al 31 oct y uno del 20 al 22 oct). Logros, hechos, visitas y pases comprados: 0.
- **Por eso el bucle:** en el navegador del PC, la sesión anónima es otra, y tu Google ya estaba en `3024d56f…` → `identity_already_exists` → antes, bucle; ahora, entra directamente en `3024d56f…`.
- Hay otra cuenta real con Google que **no** lleva tu email (no es mía de decir de quién es).
- **Sesiones anónimas con viajes: 173** (las más recientes, del 18-19 oct, son de pruebas). No se puede saber cuál es la de tu navegador normal desde fuera; la de tu navegador normal tiene su sesión guardada en ese navegador y, **al entrar, sus viajes pasan a `3024d56f…`**.

## 4. Qué tienes que hacer tú para probarlo en tu navegador normal (paso a paso)

Primero **espera a que Vercel haya desplegado este cambio** (lo despliega solo al subirlo; mira en Vercel → Deployments que el último commit es «arreglo de entrar» y está en verde).
1. Abre la app en tu navegador normal del PC (no incógnito), en `https://bengaladesigns.vercel.app`. **No borres nada del navegador.**
2. Si ves la página recargándose, ciérrala y vuelve a abrirla (para cargar la versión nueva): si hace falta, `Ctrl+Shift+R`.
3. Pulsa **[Continuar con Google]** y elige tu cuenta de Google.
4. **Qué tienes que ver si va bien:** vas a Google, vuelves a la app y **entras**; la página se recarga **una sola vez** y ves **tus viajes de antes** (los de tu cuenta y, si ese navegador tenía otros, también esos). Nada de recargas seguidas.
5. **Si algo falla** verás «No hemos podido entrar. Inténtalo de nuevo.» con el botón: la página **no** se recarga sola. Pulsa el botón una vez más. Si vuelve a salir, dímelo con qué ves.
6. Para comprobar que no se ha perdido nada, abre **Mis viajes** y mira que están tus 3 viajes de Roma.

## 5. Pruebas

- **`pruebaEntrar` (nueva): 28 comprobaciones, 0 fallos.** Con un Supabase y un navegador de mentira, prueba: Google ya unido a otra cuenta → entra a la primera, sin bucle, y lo de la sesión anónima pasa a la cuenta con una sola recarga; el mismo caso por email; si el segundo intento falla, se para y avisa (y no recarga); cuenta nueva → mismo `uid`, sin pasar nada y sin recargar; si pasarlo falla, la sesión anónima no se pierde; el token guardado se mantiene al día. **Con el código de antes** (guardado en `scripts/destino/_cuentasAntesDelArreglo.txt`) **la misma prueba reproduce el bucle** (6 vueltas, 6 vinculaciones y ninguna entrada); con el arreglo se corta en la segunda vuelta.
- **`pruebaEntrarReal` (nueva), de verdad:** un Chrome nuevo y sin datos (como incógnito) contra el Supabase de verdad y la app en local. No inicia sesión en Google (no se puede hacer desde aquí): llega hasta salir hacia Google, lo frena, y simula lo que Supabase deja en la dirección. Resultado: 11 comprobaciones, 0 fallos. **Qué se ve:** la pantalla de entrar; [Continuar con Google] crea una sesión anónima y sale hacia Google (1 vinculación); al volver con «ya existe», **no vuelve a vincular** y sale a Google **una sola vez** con la entrada directa; al volver otra vez con el mismo error **no hace ninguna llamada más, no recarga y sale «No hemos podido entrar. Inténtalo de nuevo.»** con su botón. Capturas en `docs/dias/capturas_entrar/`. (Esa prueba crea una o dos sesiones anónimas vacías en Supabase; no pasa nada.)
- **El paso de pasar lo del móvil a la cuenta, contra el Supabase de verdad:** `comprobarCasoA.mjs` (de la tanda 9) sigue bien: el viaje de la sesión anónima pasa a la cuenta sin cambiar nada.
- **Batería rápida (76 pruebas, sin la del motor largo):** 75 en 0 fallos. `pruebaCorr6z6` salió «MAL» en paralelo y **sola da 0 fallos** (también con mis cambios apartados: es lo de siempre al lanzar varias a la vez). **Las dos pruebas de fotos** (`pruebaFase6y2_fotos`: 95 comprobaciones, 0 fallos; `pruebaFase6y3_fotos`: 49, 0 fallos) las pasé también solas: bien.
- `pruebaCuentas3`: 476 comprobaciones, 0 fallos. `tsc` limpio.

## 6. Riesgos

- **El navegador normal de Eric guarda la sesión anónima en su `localStorage`:** si alguna vez se borrara antes de entrar, esos viajes no se podrían pasar (por eso: no lo borres hasta comprobar que están en tu cuenta).
- **El aviso «No hemos podido entrar» sale en cualquier error de vuelta de Google,** también si cancelas en la pantalla de Google. No recarga ni bloquea: puedes volver a pulsar el botón.
- **La ventana de 5 minutos** del único reintento es la que corta el bucle: pasado ese rato, un intento nuevo vale otra vez (porque ya sería otro intento tuyo).
- **Si tu Google estuviera unido a más de una cuenta** (no es el caso hoy: una sola), Supabase solo permite una por identidad.
