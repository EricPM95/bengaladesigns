Hola. Tanda pequeña y urgente: ARREGLO DE ENTRAR, LA PÁGINA QUE NO PARA DE RECARGAR. Hazlo todo tú, en este PC. Al entrar con mi cuenta de Google, la página recarga una y otra vez y no entra nunca. Me pasa en el navegador normal del PC y en una ventana de incógnito. No toques el motor de rutas.

## 0. Antes de empezar
- Haz `git fetch` y mira si en origin hay un commit «arreglo de entrar» (`9d61655`). Lo hizo otra sesión de Code en la nube, pero GitHub no le dejó subirlo, así que lo normal es que no esté. Si está, haz `git pull`, comprueba que hace todo lo de abajo y sigue desde el punto 3. Si no está, hazlo tú desde el punto 1.
- Guarda este prompt, tal cual, en docs/dias/PROMPT_ARREGLO_ENTRAR.md e inclúyelo en tu commit.
- **No borres ni limpies mi navegador normal.** Mi sesión anónima de ese navegador tiene mis viajes de antes: tienen que pasar a mi cuenta, no perderse.

## 1. Lo que pasa (ya lo encontró la otra sesión; compruébalo)
En `src/lib/cuentas.ts`:
- `entrarConGoogle()`, con una sesión anónima, llama a `linkIdentity` (para no cambiar el `uid`).
- Si esa cuenta de Google ya existe en otra cuenta, Supabase vuelve con `identity_already_exists`.
- `alVolverDelEnlace()` lo ve y llama otra vez a `entrarConGoogle()`. Como la sesión **sigue siendo anónima**, vuelve a hacer `linkIdentity`, vuelve el mismo error… y así sin parar.
- Por email no hay bucle.

## 2. El arreglo
- Con `identity_already_exists` (y los errores parecidos), entrar **directamente** en la cuenta que ya existe (`signInWithOAuth`, sin volver a intentar `linkIdentity`). Un solo intento.
- **Ningún bucle, nunca:** si vuelve a fallar, se para y sale «No hemos podido entrar. Inténtalo de nuevo.», con su botón, en vez de recargar.
- Después de entrar, la página recarga **una sola vez**.
- Lo que tenía la sesión anónima de ese navegador (viajes, vistos, logros…) pasa a la cuenta con `/api/cuenta/reclamar`. Si el paso falla, la sesión anónima no se olvida (se guarda para reintentarlo) y su token se mantiene al día.
- Añade `.env` al `.gitignore` (no estaba; `.env.local` ya lo cubría `*.local`).

## 3. Mi cuenta
- Escribe y ejecuta `scripts/cuentas/cuentaDeEric.mjs`. Que lea Supabase con la clave de servicio del .env y diga a qué cuenta está unido mi Google (mi email está en LOGROS_ADMIN_EMAILS), si hay una o dos cuentas con mi email, cuál tiene mis viajes y si hay sesiones anónimas con viajes que se puedan pasar. No me pases ni pegues ninguna clave en el chat.

## 4. La prueba
- No toca el motor: la batería rápida. Las dos pruebas de fotos, si fallan en paralelo, pásalas también solas, y dime cómo salen.
- Pruebas nuevas:
  - Google ya unido a otra cuenta → entra en esa cuenta a la primera, sin bucle, y lo de la sesión anónima pasa a la cuenta;
  - el mismo caso por email;
  - si el segundo intento también falla, se para y sale el aviso (nada de recargar otra vez);
  - una cuenta nueva (Google sin cuenta antes) → sigue con el mismo `uid` y sin recargar de más;
  - con el código de antes, la prueba tiene que reproducir el bucle.
- Una prueba de verdad contra Supabase, en una ventana de incógnito: entra con Google en una cuenta que ya existe y cuéntame qué ves. Sin tocar mi navegador normal: ese lo pruebo yo.

## 5. El informe (docs/dias/INFORME_ARREGLO_ENTRAR.md)
En español sencillo:
- qué pasaba y qué has cambiado;
- a qué cuenta está unido mi Google y dónde están mis viajes;
- qué tengo que hacer yo para probarlo en mi navegador normal (paso a paso) y qué tengo que ver si va bien.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
