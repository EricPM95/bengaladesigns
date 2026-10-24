Hola. TANDA 10K, pequeña: ENTRAR CON GOOGLE A LA PRIMERA. No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10K_GOOGLE.md e inclúyelo en tu commit.

## 1. Lo que pasa (vídeo de Eric, 24-oct, en el ordenador, en Chrome con el tamaño de iPhone SE)
Después de [Empezar de cero], Eric toca [Continuar con Google] y elige su cuenta de Google:
1. Vuelve con `error_code=identity_already_exists` («Identity is already linked to another user») en la dirección. Sale otra vez la pantalla de inicio entera y después «No hemos podido entrar. Inténtalo de nuevo.».
2. Toca otra vez [Continuar con Google] y elige la misma cuenta. Vuelve con el mismo error, sale sola otra vez la ventana de Google, la elige por tercera vez y **entonces sí entra** (llega a «¿De dónde sales y a dónde vas?»).
3. Cada vuelta de Google pone **la pantalla de inicio de 3,5 s otra vez**: la ve tres veces.

Lo que creo que pasa (`src/lib/cuentas.ts`): con la sesión anónima, `entrarConGoogle` primero intenta `linkIdentity`. Si esa cuenta de Google ya tiene cuenta en JUTRIP (lo normal para quien vuelve, en otro móvil o después de cerrar sesión), Supabase da `identity_already_exists`, y hace falta un segundo viaje a Google con `signInWithOAuth`. Y si el aviso de reintento (`CLAVE_REINTENTO_GOOGLE`) de un intento anterior sigue dentro de los 5 minutos, ni siquiera reintenta: deja «No hemos podido entrar». Compruébalo y dime si es eso.

## 2. Lo que tiene que pasar
- **Un toque en [Continuar con Google], elegir la cuenta, y dentro. Un solo viaje a Google, sin errores y sin ventanas repetidas**, tenga o no cuenta ya.
- Lo que hubiera hecho en el móvil antes de entrar (la sesión anónima: un viaje creado sin cuenta…) se pasa a su cuenta, como ya hace la app al entrar con el email. No se pierde nada.
- Propuesta (decide tú la forma más segura): en la pantalla de entrar, ir directo con `signInWithOAuth` y pasar lo de la sesión anónima al volver, en vez de intentar primero `linkIdentity`. O, si mantienes `linkIdentity`, que el reintento sea automático, sin aviso de error, y que el freno de los 5 minutos se borre cada vez que la persona toca el botón.
- **La pantalla de inicio no sale al volver de Google** (es la recarga justo después de entrar, como dijimos en la 10G), ni al volver con un error.
- Si de verdad falla (Google cancelado, sin conexión), entonces sí: «No hemos podido entrar. Inténtalo de nuevo.», sin la pantalla de inicio.

## 3. La prueba
- La batería rápida y `pruebaJutrip`.
- Prueba nueva `pruebaTanda10K`, con el Google de mentira de las pruebas:
  - con sesión anónima y una cuenta de Google que **ya tiene** cuenta: un solo viaje a Google y dentro de esa cuenta, con lo de la anónima pasado;
  - con sesión anónima y una cuenta de Google **nueva**: un solo viaje y dentro;
  - dos intentos seguidos en menos de 5 minutos: los dos entran;
  - al volver de Google no sale la pantalla de inicio;
  - si Google devuelve otro error: el aviso, sin bucle y sin la pantalla de inicio.
- Dime cómo lo pruebo yo en mi Supabase de verdad.

## 4. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10K».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.

## Adónde lleva la app al abrirla (Eric, 24-oct)
Siempre, primero, la pantalla de inicio de 3,5 s (salvo la recarga justo después de entrar). Sin sesión, la pantalla de entrar. Con sesión, no se pide nada y se va directo, en este orden:
1. Si hoy es un día de alguno de sus viajes (con la hora del destino): HOY de ese viaje.
2. Si tiene algún viaje por delante: RUTA del más cercano en fecha, aunque haya tocado otro después.
3. Si todos sus viajes ya pasaron: «Mis viajes», con [Crear viaje] bien a la vista.
4. Si no tiene ningún viaje: «Crear viaje».
- Un viaje sin fechas cuenta como «por delante»; si hay varios sin fechas, el último que tocó.
- Revisa lo que hace hoy la app (10G: «el último viaje en RUTA, o HOY si hoy es día de viaje») y cámbialo a esto.

## La prueba
- Añade a pruebaTanda10K, al abrir la app con sesión, cada caso: hoy de viaje → HOY; viaje por delante (y otro tocado después) → RUTA del más cercano; solo viajes pasados → «Mis viajes»; sin viajes → «Crear viaje»; viajes sin fechas.
- Ponlo en el informe, en el apartado «10K».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
