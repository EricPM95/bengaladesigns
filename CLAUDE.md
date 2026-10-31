# Reglas fijas del proyecto

## Memoria del ordenador: servidores, Node.js y navegadores de prueba (Eric, 28-oct)
El ordenador de Eric se quedó sin memoria por procesos que se dejaron abiertos (5 procesos de Node.js de 1,2 a 2,8 GB cada uno, varios esbuild y varios Chrome de prueba a la vez). Estas reglas valen en todas las sesiones, para mí y para cualquier agente que lance:

1. **Antes de arrancar el servidor de la app (Vite o la API), comprobar si ya hay uno funcionando** (por ejemplo, mirando los puertos 5173 y 8787, o los procesos `node` con `vite` o `server/index.js`). Si lo hay, usar ese; no abrir otro.
2. **Nunca más de un servidor de la app encendido a la vez** (un Vite y una API). Los agentes en paralelo comparten ese mismo servidor; no levantan uno cada uno en puertos propios. Si un agente necesita reiniciarlo, lo reinicia (lo para y lo arranca), no lo duplica.
3. **Los navegadores de prueba (Chrome sin ventana) se cierran al terminar cada prueba.** Nunca dejar uno abierto entre pruebas.
4. **Las pruebas que arrancan su propio Vite** (la batería, `bateriaParalela.mjs`) lo cierran al acabar, y no se lanza una batería mientras haya otro servidor de pruebas en marcha.
5. **Al final de cada sesión o tarea, apagar** los servidores, los procesos de Node.js y los navegadores de prueba que se hayan abierto, y confirmarlo a Eric en el resumen final (cuántos había y cuántos se han cerrado). Los `esbuild.exe` mueren con su Vite; si quedan huérfanos, se cierran también.
6. **Para no saturar el procesador:** las baterías y los servidores de pruebas se lanzan (o se pasan enseguida) a prioridad baja (`BelowNormal`; los procesos hijos, incluidos los Chrome de prueba, la heredan). Las baterías se lanzan con `navegador=1` y SIN los «wrappers» (`pruebaTanda10N*.mjs`, `10P`, `10O`, `10M`: cada uno ya corre sus partes, que están también sueltas en la batería y duplicarían los Chromes). Nunca más de 2 Chrome de prueba a la vez (Eric, 29-oct; ver «Cómo probar» abajo).
7. **Si falta un servidor para la siguiente tarea, se arranca entonces**, no antes: no dejar servidores encendidos «por si acaso».

## Apagar el PC (Eric, 29-oct)
NO apagar el PC al acabar una tanda, salvo que Eric lo pida en ese mismo prompt (en la 10N10 el prompt decía «No apagues el PC al acabar» y se programó el apagado igual: no volver a pasar). Un permiso dado en una conversación no vale para la siguiente tanda.

## Cómo probar (Eric, 29-oct) — para ir más rápido
(10S: la guía paso a paso, con comandos y qué hacer si una falla, está en `docs/dias/COMO_CORRER_LAS_PRUEBAS.md`.)
- **En cada tanda, NO la batería completa:** solo las pruebas de lo que se ha tocado en esa tanda, más `pruebaJutrip`. En el informe se dice cuáles se han pasado.
- **La batería completa, solo cuando Eric lo pida o antes de una tanda grande** (lo dirá en el prompt).
- **Hasta 2 Chrome de prueba a la vez.** Las pruebas que usan el Supabase real o las mismas cuentas de prueba, **siempre solas**. Si una falla con 2 a la vez, se repite sola antes de darla por mala.
- **La batería (10S):** `node scripts/destino/bateriaParalela.mjs navegador=2 conc=3 salida=docs/dias/_bateria.json`. Coge todas las `prueba*.mjs` menos los envoltorios (se detectan por contenido), arranca su Vite estable calentado en 5199 y lo cierra, coge la cola de Chrome, da a cada prueba su carpeta de temporales, corre las del Supabase real solas al final y no repite nada. `listar=1` enseña el reparto sin correr. Detalle en `docs/dias/COMO_CORRER_LAS_PRUEBAS.md`.
- Si una batería completa sigue sin terminar, se corta y se pasan solo las de la tanda y `pruebaJutrip`.

## Nota de estado en la rama «estado» (Eric, 28-oct) — ACTIVA otra vez en la tanda 10N9
Eric la desactivó el 28-oct («ya estoy en casa») y la volvió a pedir en el prompt de la 10N9 (cada 30 minutos, también mientras espero a los agentes). Si un prompt de tanda no la pide, no se sube.

**Agentes:** (Eric, 28-oct) como mucho 2 a la vez y memoria libre ≥4 GB; (Eric, 29-oct, 10N10) hasta 4 a la vez con ≥6 GB libres, si Eric lo dice en el prompt de la tanda.

La conexión de Claude con el PC de Eric no funciona, así que Eric sigue cada tanda desde GitHub. Mientras haga una tanda, **cada ~30 minutos** actualizo la nota `docs/dias/_estado_<tanda>.md` y la subo a la rama **`estado`**, solo con ese archivo:

`node scripts/destino/_estado.mjs <tanda> "<qué estoy haciendo>" "<qué falta>"`

- La nota lleva arriba la hora de la última actualización, qué estoy haciendo, qué falta y cuántos procesos de node y de Chrome de prueba hay abiertos (los cuenta el propio script).
- El script no toca `main`, ni la carpeta de trabajo, ni el índice de git (usa un índice temporal), y sube sin `--force`: cada nota es un commit nuevo encima del anterior.
- `docs/dias/_estado_*.md` está en `.git/info/exclude`: la nota nunca entra en el commit de la tanda. A `main` solo se hace push al final de la tanda (prueba en 0 fallos, `git status` limpio, nada privado, sin `--force`).
- Al terminar la tanda, última nota con el resultado final.

## Tandas de Eric
Los avisos de tandas anteriores (prompt guardado en `docs/dias/PROMPT_TANDA<id>.md`, informe en `docs/dias/INFORME_TANDA10B.md`, repaso en `docs/dias/REPASO_<id>.html`, push a `main` sin `--force`, reiniciar el api-server al final) están en cada prompt de tanda; no se repiten aquí.

## Tablas con datos de una persona y «Empezar de cero» (Eric, 31-oct)
Cada vez que se crea una tabla con datos de una persona (una columna que apunta a la cuenta), hay que hacer TRES cosas en la misma tanda: (1) una migración nueva que vuelva a crear `empezar_de_cero` (con `create or replace`, sin editar la 0032 ni las anteriores) con la tabla en su inventario, más su `COMPROBAR_<n>.sql`; (2) añadir la tabla al inventario de `scripts/destino/pruebaTanda10J.mjs` (y sembrarle una fila); (3) **pasar `pruebaTanda10J`** en 0 fallos, además de las pruebas de lo tocado y `pruebaJutrip`. Su control «ninguna tabla con datos de una cuenta queda fuera del inventario» falla si se olvida. (Caso real: `billetes_personales`, 0070 → 0071.)

## Rehacer una función de la base de datos: partir de su ÚLTIMA versión (Eric, 31-oct)
Al volver a crear una función con `create or replace` (por ejemplo `empezar_de_cero`), se parte SIEMPRE de su última versión: buscar en TODAS las migraciones (`grep -l "function public.<nombre>" supabase/migrations/*.sql`) cuál la define en último lugar y copiar de ahí, nunca de la primera. Después, comparar con `diff` contra esa última versión: la única diferencia tiene que ser lo que se quería cambiar. (Caso real: la 0071 se copió de la 0032 y se dejaba fuera lo que añadió la 0040: `admin_sin_pase`, `trip_gastos`, `trip_pagos`, `trip_ex_miembros`.) Y la prueba de una función de la base de datos lee la función VIGENTE de PGlite con todas las migraciones aplicadas en orden (`pg_get_functiondef`), no el texto de una migración.

## Las pruebas gastadas no se devuelven al empezar de cero (Eric, 31-oct, 10S7)
`hoy_prueba` (el día de prueba de HOY) e `historia_de_prueba` son «una por cuenta, para siempre»: **`empezar_de_cero` NO las borra** (migración 0072, que parte de la 0071 y solo les quita esas dos líneas; `docs/dias/COMPROBAR_0072.sql`). **La última versión de la función `empezar_de_cero` es ahora la de la 0072**: la próxima migración que la rehaga parte de ahí, con `diff`. En `pruebaTanda10J` esas dos tablas están en `SE_QUEDA`, no en el inventario de lo que se borra. (Ojo: «Reiniciar mis pruebas» del panel de administrador es otra cosa y sigue borrándolas, a petición expresa del administrador.)
