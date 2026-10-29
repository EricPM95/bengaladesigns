# Reglas fijas del proyecto

## Memoria del ordenador: servidores, Node.js y navegadores de prueba (Eric, 28-oct)
El ordenador de Eric se quedó sin memoria por procesos que se dejaron abiertos (5 procesos de Node.js de 1,2 a 2,8 GB cada uno, varios esbuild y varios Chrome de prueba a la vez). Estas reglas valen en todas las sesiones, para mí y para cualquier agente que lance:

1. **Antes de arrancar el servidor de la app (Vite o la API), comprobar si ya hay uno funcionando** (por ejemplo, mirando los puertos 5173 y 8787, o los procesos `node` con `vite` o `server/index.js`). Si lo hay, usar ese; no abrir otro.
2. **Nunca más de un servidor de la app encendido a la vez** (un Vite y una API). Los agentes en paralelo comparten ese mismo servidor; no levantan uno cada uno en puertos propios. Si un agente necesita reiniciarlo, lo reinicia (lo para y lo arranca), no lo duplica.
3. **Los navegadores de prueba (Chrome sin ventana) se cierran al terminar cada prueba.** Nunca dejar uno abierto entre pruebas.
4. **Las pruebas que arrancan su propio Vite** (la batería, `bateriaParalela.mjs`) lo cierran al acabar, y no se lanza una batería mientras haya otro servidor de pruebas en marcha.
5. **Al final de cada sesión o tarea, apagar** los servidores, los procesos de Node.js y los navegadores de prueba que se hayan abierto, y confirmarlo a Eric en el resumen final (cuántos había y cuántos se han cerrado). Los `esbuild.exe` mueren con su Vite; si quedan huérfanos, se cierran también.
6. **Para no saturar el procesador:** las baterías y los servidores de pruebas se lanzan (o se pasan enseguida) a prioridad baja (`BelowNormal`; los procesos hijos, incluidos los Chrome de prueba, la heredan). Las baterías se lanzan con `navegador=1` y SIN los «wrappers» (`pruebaTanda10N*.mjs`, `10P`, `10O`, `10M`: cada uno ya corre sus partes, que están también sueltas en la batería y duplicarían los Chromes). Nunca más de un Chrome de prueba a la vez.
7. **Si falta un servidor para la siguiente tarea, se arranca entonces**, no antes: no dejar servidores encendidos «por si acaso».

## Nota de estado en la rama «estado» (Eric, 28-oct) — ACTIVA otra vez en la tanda 10N9
Eric la desactivó el 28-oct («ya estoy en casa») y la volvió a pedir en el prompt de la 10N9 (cada 30 minutos, también mientras espero a los agentes). Si un prompt de tanda no la pide, no se sube.

**Agentes (Eric, 28-oct):** como mucho 2 a la vez; antes de lanzar uno, mirar la memoria libre (con menos de 4 GB, esperar).

La conexión de Claude con el PC de Eric no funciona, así que Eric sigue cada tanda desde GitHub. Mientras haga una tanda, **cada ~30 minutos** actualizo la nota `docs/dias/_estado_<tanda>.md` y la subo a la rama **`estado`**, solo con ese archivo:

`node scripts/destino/_estado.mjs <tanda> "<qué estoy haciendo>" "<qué falta>"`

- La nota lleva arriba la hora de la última actualización, qué estoy haciendo, qué falta y cuántos procesos de node y de Chrome de prueba hay abiertos (los cuenta el propio script).
- El script no toca `main`, ni la carpeta de trabajo, ni el índice de git (usa un índice temporal), y sube sin `--force`: cada nota es un commit nuevo encima del anterior.
- `docs/dias/_estado_*.md` está en `.git/info/exclude`: la nota nunca entra en el commit de la tanda. A `main` solo se hace push al final de la tanda (prueba en 0 fallos, `git status` limpio, nada privado, sin `--force`).
- Al terminar la tanda, última nota con el resultado final.

## Tandas de Eric
Los avisos de tandas anteriores (prompt guardado en `docs/dias/PROMPT_TANDA<id>.md`, informe en `docs/dias/INFORME_TANDA10B.md`, repaso en `docs/dias/REPASO_<id>.html`, push a `main` sin `--force`, reiniciar el api-server al final) están en cada prompt de tanda; no se repiten aquí.
