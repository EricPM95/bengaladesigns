# Cómo correr las pruebas

Escrito para Eric, en palabras sencillas. Última revisión: tanda 10S (30-oct).

## 1. Lo que tiene que estar encendido

- **La API** (`node server/index.js`, puerto 8787). Si se ha tocado `server/` o `data/`, se reinicia con `powershell -ExecutionPolicy Bypass -File scripts/destino/_reiniciar_api.ps1`.
- **El Vite estable** (puerto 5173): una versión de Vite que no vigila los archivos (así no se recarga a mitad de una prueba). Se arranca con
  `node node_modules/vite/bin/vite.js --port 5173 --strictPort --config scripts/destino/_vite_estable.config.mjs`.
  Como no vigila archivos, **para ver código nuevo hay que pararlo y arrancarlo otra vez** (no abrir un segundo).
- Nunca más de **un Vite y una API** a la vez. Antes de arrancar nada, mira si ya hay uno: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`.

## 2. Reglas de siempre (CLAUDE.md)

- **Hasta 2 Chrome de prueba a la vez**, nunca más. Se cierran al acabar cada prueba.
- Las pruebas que usan el **Supabase real** o las cuentas de prueba (`pruebaEntrarReal`, `pruebaTanda10N3_real`…) corren **siempre solas**. La batería las detecta sola (nombre `*_real` / `*Real`, o que crean un cliente de Supabase o cuentas) y las corre **al final, una a una, sin nada más en marcha**.
- Las baterías y servidores de pruebas, a prioridad baja (`BelowNormal`).
- Al acabar: apagar servidores, procesos de Node y Chrome de prueba, y contarlos en el resumen. No se apaga el PC salvo que el prompt de la tanda lo diga.

## 3. Una prueba suelta (lo normal en cada tanda)

Todas las pruebas con navegador pasan por la **cola**, que deja pasar de una en una a quien usa Chrome:

```
APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S.mjs
```

Acaban con «N comprobaciones · M fallos». **Si M no es 0, la prueba ha fallado**; la línea `✗ [regla] texto` dice qué.

## 4. Solo las pruebas de una tanda

En cada tanda se pasan **solo las pruebas de lo que se ha tocado, más `pruebaJutrip`**; en el informe se dice cuáles. Se pueden lanzar con la batería indicándole los nombres:

```
node scripts/destino/bateriaParalela.mjs solo=pruebaTanda10S,pruebaJutrip navegador=2
```

(o una a una con el comando de la sección 3). Con `filtro=regex` se cogen todas las que cumplan un patrón en el nombre (por ejemplo `filtro=10N12`).

## 5. La batería entera

Solo cuando Eric lo pide o antes de una tanda grande (la 10S es una de ellas):

```
node scripts/destino/bateriaParalela.mjs navegador=2 conc=3 salida=docs/dias/_bateria.json
```

- Coge **todas** las pruebas `prueba*.mjs` (también `pruebaTanda7_*`, `pruebaListas`, `pruebaSalida`…). Solo deja fuera:
  - **los envoltorios** (`pruebaTanda10N`, `10N3`…`10N12`, `10M`, `10O`, `10P`, `pruebaCorr6z6`, `pruebaTanda6z6`): no comprueban nada propio, solo corren otras pruebas que la batería ya corre sueltas. Se detectan **por lo que hay dentro** (un `spawnSync` de otras pruebas), no por el nombre; si a un envoltorio le faltara alguna parte suelta, la batería lo corre igualmente y lo avisa;
  - las tres que ya estaban fuera por decisión vieja: `pruebaFase6y5_motor` (solo con `motor=1`), `Wikimedia` y `pruebaFase6y8_comida`.
- **Quién usa Chrome** se mira siguiendo los `import` de cada prueba (antes no se veía y algunas abrían un Chrome «de más»). Hasta 2 pruebas de Chrome a la vez, 3 de Node a la vez.
- Para ver cómo la repartiría **sin correr nada**: `node scripts/destino/bateriaParalela.mjs listar=1`.
- Sale con código 1 si alguna está MAL (0 si todas bien). Nunca repite una prueba por su cuenta.
- Arranca su **propio Vite estable**, calentado, y lo cierra al acabar; **no se lanza si ya hay otro servidor de pruebas** en marcha.
- Cada prueba tiene sus propios archivos temporales; mientras corre, coge la cola de Chrome (los agentes que usan `_conCola` esperan).
- Se lanza a prioridad baja y **sin** los envoltorios.
- Al final enseña cuántas están bien y cuántas mal, con la cola de la salida de las malas; guarda los tiempos en `docs/dias/_tiempos_bateria.json` (así la próxima vez empieza por las más largas).

## 6. Cuánto tarda cada cosa

| Qué | Tiempo |
|---|---|
| Una prueba suelta con Chrome | entre 1 y 3 minutos (la mediana de las 178 de la batería es de 15 s; `pruebaTanda10N11_a` unos 100 s) |
| `pruebaTanda10S` (con el peso medido sobre un build nuevo) | unos 2 minutos (116 s en la última pasada; el build sale en unos 25 s si no está ya hecho) |
| `pruebaJutrip` | algo más de 1 minuto (77 s) |
| La batería entera, con 2 Chrome a la vez | **antes (10N10): unos 65-70 min con 148 pruebas** (aproximado, de mis registros); **ahora (10S): 34,4 / 34,7 / 34,7 min con 178 pruebas** (tres pasadas seguidas, 0 fallos). Las más lentas: `pruebaTanda6k` (413 s), `pruebaListas` en muestreo (373 s), `pruebaTanda6h` (342 s), `pruebaFase6y7_motor` (257 s), `pruebaTanda6g` (235 s). El barrido completo de `pruebaListas` (365 fechas) se corre aparte: unas 6-7 h de CPU, ≈1 h 50 min en 4 trozos. |

## 7. Si una prueba falla

1. **Léela entera**: la línea `✗ [regla] …` dice qué comprobación falló y con qué valores.
2. **¿Es por la carga?** (`__rutaPrueba is not a function`, «No se ha podido crear el viaje de pruebas», esperas largas): no se da por buena. Repítela **sola** por la cola. Si sola pasa y con 2 a la vez no, **es un fallo de la prueba o de la infraestructura**: se arregla la causa (esperar a que la página esté lista de verdad, datos propios de la prueba…), no se salta. Las causas que había y cómo se arreglaron están en la sección 9.
3. **¿Ha cambiado la app a propósito?** Entonces se dice a Eric y por qué antes de tocar la prueba. **Nunca** se quita una prueba, se baja lo que comprueba ni se marca «saltable» para que salga en verde.
4. **¿Falla sola y siempre?** Es un fallo de la app: se arregla la app.
5. Si acaba con un código raro pero «0 fallos» en su salida, la batería la marca «OK*»: mira por qué cierra raro (era el cierre de node con un Chrome aún cerrándose; ver sección 9).
6. Si el Vite no refleja un cambio de código: está sin vigilar; páralo y vuélvelo a arrancar (si no hay ninguna prueba corriendo).
7. Si sobran procesos al acabar: `node` (Vite, API, pruebas), `esbuild.exe` huérfanos y `chrome.exe` de prueba (con `--headless`/`--remote-debugging-port`): se cierran, sin tocar el Chrome de Eric.

## 8. Lo que mide `pruebaTanda10S`

- El texto del aviso de Logros, la cama de HOY (con pase sale; el día de prueba sin pase, no) y que la ✕ de la lista del pase no pisa ningún texto al bajar (a 390×844 y 375×667).
- El peso de la descarga al abrir: menos de **340 KB** comprimidos, sobre un build recién hecho (`_distFresco.mjs` y `_pesoAlAbrir.mjs`).

## 9. Por qué fallaban «por la carga» y qué se arregló (10S)

| Fallo | Causa de verdad | Arreglo |
|---|---|---|
| `window.__rutaPrueba is not a function` / `Cannot read properties of null (reading 'days')` | `__rutaPrueba` **no existe al cargar la página**: `main.tsx` la trae con un `import()` dinámico y, con un Vite recién arrancado o con 2 Chrome a la vez, compilar esa cadena de módulos tarda más de los **30 s** (60 × 500 ms) que esperaban las pruebas. Eran ~48 copias del mismo bucle. | `abrirApp` (`_enLaApp.mjs`) **no devuelve la app hasta que `__rutaPrueba` existe** (tope 3 min, con mensaje claro). Los bucles viejos pasan a la primera. |
| «No se ha podido crear el viaje de pruebas» | `src/dev/rutaDePrueba.ts` usaba **esperas fijas** (800 ms para que salga la pantalla dev, 1200 ms para «Crear ruta», 3500 ms para que exista la ruta). Con carga no daba tiempo. | Ahora espera de verdad a cada cosa (campos, botón, ruta en el almacén) con topes de 15 a 90 s, y una sola creación a la vez por página. `conViaje` reintenta 3 veces y dice qué falló. |
| `Cannot read properties of null (reading 'focus')` | `escribir()` hacía `focus()` sobre un campo que aún no existía. | Espera al campo (20 s) y, si no sale, dice cuál. |
| Chrome que chocan | El puerto de depuración era un número al azar entre 600 (dos Chrome podían coincidir). | Puerto 0: lo elige Chrome y se lee de su `DevToolsActivePort`. |
| Cierre raro de node (código 3221226505 / 0xC0000409) tras «0 fallos» | `process.exit()` mientras un WebSocket y un Chrome aún se cierran: fallo conocido de libuv en Windows. | `cerrar()` cierra el WebSocket y reintenta el borrado de la carpeta; `process.exit` espera ~400 ms si hubo una app abierta. |
| Vite frío | La primera carga de Vite compila todo: lenta justo cuando 2 Chrome la piden a la vez. | La batería arranca el Vite **estable** (sin vigilar archivos), le pide por delante lo que siempre se pide (`warmup` en `_vite_estable.config.mjs`) y abre la app una vez con todas sus pestañas antes de la primera prueba. |
| Chromes «de más» | La batería solo miraba si el **texto** de la prueba decía `abrirApp`: las que abren Chrome por `_10n5_comun`, `_ayuda10F`… contaban como «de Node» y corrían sin límite. | Se siguen los `import`. |
| Pruebas que se pisan | Las del Supabase real (cuentas, altas) corrían a la vez que las demás. | Van al final, solas. |
| Chrome huérfanos | Al pasarse de tiempo solo se mataba `node`, no sus Chrome. | Se mata el árbol; cada prueba tiene su carpeta de temporales y, si queda un Chrome vivo de ella, se cierra. |
| Miles de carpetas `enLaApp-*` en `%TEMP%` (8 573 al empezar la 10S) | Windows no soltaba la carpeta al cerrar y el borrado se rendía a la primera. | Reintenta 8 veces; y las de la batería viven dentro de la carpeta de cada prueba, que se borra entera. **Las viejas hay que borrarlas a mano**: carpetas `enLaApp-*` de `%TEMP%` con más de un día. |

Cosas que la batería **no** hace a propósito: repetir una prueba que falla, saltarse una, o dar por buena una que falla «por la carga». Si falla, es MAL y se arregla la causa.

## 10. `pruebaListas`: el muestreo (en la batería) y el barrido completo (aparte)

`pruebaListas` prueba todos los viajes de Roma de 1 a 6 días (formas × extras × reservas × parejas) en las fechas de 2027. Cada fecha son ~2 150 viajes y casi un minuto de CPU, así que el barrido de las 365 fechas **no cabe en la batería** (más de 6 horas de CPU en un solo proceso; antes agotaba el tope de 25 minutos y salía MAL).

- **En la batería corre `muestra=1`**: las mismas comprobaciones, pero solo en **12 fechas fijas** que incluyen las difíciles (Año Nuevo, víspera/dentro/último día del cierre de las Catacumbas del 13-ene al 10-feb, Semana Santa, Pascua, 2 de junio, un domingo normal con el Vaticano cerrado, pleno verano, Ferragosto, Navidad y fin de año). Las fechas y el motivo de cada una están escritos **en la cabecera de `scripts/destino/pruebaListas.mjs`**. Se reparte en 4 procesos y tarda **unos 3 min 40 s** (25 887 viajes). No escribe `docs/dias/PRUEBA_LISTAS.md`.
- La batería imprime «pruebaListas: muestreo de 12 fechas (el barrido completo de 365 se corre aparte…)» y, en el resumen, el apartado **MUESTREOS (NO cuentan como pruebas completas)**: un verde de la batería **no** significa que el barrido completo esté pasado.
- **El barrido completo NO se ha quitado. Hay que correrlo aparte, SIEMPRE en toda tanda que toque el motor de rutas o los datos de Roma, y una vez antes de lanzar (push).** Son 4 procesos a la vez, sin Chrome (≈ 6-7 h de CPU repartidas: **del orden de 1 h 50 min con 4 procesos**; medido: 12 fechas = 3 min 40 s con 4 procesos). Cada trozo con su propio informe para que no se pisen:

```
node scripts/destino/pruebaListas.mjs desde=2027-01-01 n=92 out=%TEMP%/listas_1.md fallos=%TEMP%/listas_1.txt
node scripts/destino/pruebaListas.mjs desde=2027-04-03 n=92 out=%TEMP%/listas_2.md fallos=%TEMP%/listas_2.txt
node scripts/destino/pruebaListas.mjs desde=2027-07-04 n=92 out=%TEMP%/listas_3.md fallos=%TEMP%/listas_3.txt
node scripts/destino/pruebaListas.mjs desde=2027-10-04 n=89 out=%TEMP%/listas_4.md fallos=%TEMP%/listas_4.txt
```

  (se lanzan a la vez, a prioridad baja, con la API y nada más pesado en marcha; cada uno acaba con «N viajes … · M fallos» y sale con código 1 si M no es 0; el total es la suma de los cuatro.)

## 11. Casos «PENDIENTE DEL MOTOR» y limpieza de Chrome

- Si una prueba aparta casos como **PENDIENTE DEL MOTOR** (decisión de Eric; los imprime `scripts/destino/_pendientesMotor.mjs` en amarillo y termina siempre con una línea `pendientes_motor: N`), la batería los lista **aparte, en amarillo**, con la prueba y el motivo, **nunca** como OK ni sumados a los OK, y acaba con «N pendientes del motor». Si no hay ninguna prueba MAL, el código de salida sigue siendo 0.
- Cada prueba borra su carpeta `enLaApp-*` al cerrar Chrome (con reintentos). Al acabar, la batería avisa en amarillo si quedan carpetas `enLaApp-*` de más de un día en `%TEMP%` (hoy quedan unas 4 900 de pruebas antiguas: se borran a mano).

## 12. Topes de tiempo y pruebas con Supabase real (ajuste tras la pasada 1)

- **El tope contra cuelgues es por prueba**: 2 veces su tiempo histórico (`docs/dias/_tiempos_bateria.json`), con mínimo de 25 minutos (`tope=` lo cambia) y máximo de 3 horas. `pruebaTanda7_reparto` (tarda ~23 min suelta y más con la carga de la batería) lleva 60 minutos. Una prueba cortada por el tope no guarda su tiempo.
- **Una prueba con Chrome que use el Supabase real** (altas anónimas por cada Chrome nuevo, subida de fotos…) debe llevar en su cabecera la marca **«USA EL SUPABASE REAL»**: la batería la corre con las demás «solas al final». Hoy van solas: `pruebaEntrarReal`, `pruebaTanda10N3_real`, `pruebaTanda10N10_avisos_real` y `pruebaTanda10N6_recuerdos`.
