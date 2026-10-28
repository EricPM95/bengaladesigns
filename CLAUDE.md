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

## Tandas de Eric
Los avisos de tandas anteriores (prompt guardado en `docs/dias/PROMPT_TANDA<id>.md`, informe en `docs/dias/INFORME_TANDA10B.md`, repaso en `docs/dias/REPASO_<id>.html`, push a `main` sin `--force`, reiniciar el api-server al final) están en cada prompt de tanda; no se repiten aquí.
