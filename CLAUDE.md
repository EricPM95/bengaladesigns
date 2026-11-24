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
`hoy_prueba` (el día de prueba de HOY) e `historia_de_prueba` son «una por cuenta, para siempre»: **`empezar_de_cero` NO las borra** (migración 0072, que parte de la 0071 y solo les quita esas dos líneas; `docs/dias/COMPROBAR_0072.sql`). **La última versión de la función `empezar_de_cero` ya no es la de la 0072 (V37, 21-nov: hoy es la de la 0091, y cambiará): se encuentra SIEMPRE buscando la migración con el número más alto que la define (`grep -l "function public.empezar_de_cero" supabase/migrations/*.sql`, la última de la lista), nunca de memoria ni de este archivo**: la próxima migración que la rehaga parte de ahí, con `diff`. En `pruebaTanda10J` esas dos tablas están en `SE_QUEDA`, no en el inventario de lo que se borra. (Ojo: «Reiniciar mis pruebas» del panel de administrador es otra cosa y sigue borrándolas, a petición expresa del administrador.)

## Consultas a Supabase: cada una dice cada cuánto se hace y cuánto baja; nada en bucle (Eric, 21-nov, V36)
El plan gratis de Supabase tiene 5 GB de «egress» al mes; la app llegó a 10 GB (el 99,8 % era PostgREST: consultas repetidas o que bajan de más; dos personas de viaje gastaron ~1 GB al día). Con más de 5 GB Supabase puede bloquear la app (402). Reglas fijas:
1. **Toda consulta nueva a Supabase (`supabase.from`, `rpc`, Realtime, o una ruta de `server/` que lea de la base) lleva un comentario que dice CADA CUÁNTO se hace y CUÁNTO BAJA** (filas y KB aproximados). Si no sabes uno de los dos, mídelo con el contador de desarrollo antes de subir.
2. **Nada en bucle.** Si hace falta saber algo nuevo: Realtime, o intervalos largos (5 minutos como mínimo) y SOLO con la pantalla visible (`document.visibilityState === 'visible'`); nunca en segundo plano. Usa `src/lib/sondeo.ts` (una sola petición aunque la pidan dos piezas).
3. **El GPS no pregunta a Supabase a cada paso.** Los logros y las visitas se calculan en el móvil y solo se manda lo nuevo, una vez.
4. **Bajar solo lo que hace falta:** `select` con las columnas justas (nunca `*` ni el `route` entero de un viaje si basta un sello), filtrado por cuenta y viaje; lo que no cambia se guarda en el móvil y se pide una vez. El panel cuenta en la base de datos, no baja tablas enteras.
5. **Los servidores de desarrollo (la API en 8787) no hacen tareas programadas contra producción.**
6. Hay un **contador de peticiones en desarrollo** (consola: «Supabase: X peticiones, Y KB» cada minuto, aviso en rojo si pasa del límite) y **`pruebaV36`**, que falla si el día simulado de HOY baja más de 5 MB o si la app quieta hace peticiones. Toda tanda que toque algo que pregunte a Supabase pasa `pruebaV36`.

## «Sello» y «medalla»; los `.env*`; borrar la cuenta (Eric, 21-nov, V37)
- **En el código, `sello` es la MEDALLA de un destino** (el momento «sello», la partitura «sello», `Sello.tsx`, el logro `sello`, `ciudades_sello`); **el sello del pasaporte es otra cosa** (`PasaporteScreen`, `selloEstampado`, `sellado`). **En los textos que ve la gente, siempre «medalla»**; «sello» queda SOLO para el pasaporte. Los nombres internos no se renombran (obligaría a migrar datos). `pruebaV37_textos` falla si «sello» aparece en un texto fuera del pasaporte.
- **Los agentes nunca abren ni leen los archivos `.env*`** (claves y contraseñas). Si hace falta saber qué variables hay, se busca en el código (`grep` de `process.env.` / `import.meta.env.`). Nunca se escribe ni se enseña una clave.
- **«Borrar mi cuenta»** (Ajustes, al final; RGPD): `DELETE /api/cuenta` con `{ confirmar: 'BORRAR' }`; hace lo mismo que `empezar_de_cero` y además borra los archivos y la cuenta de Supabase Auth; deja `pagos_registro` (la ley); nunca anónima ni administrador. Cualquier tabla nueva con datos de una persona sigue la regla de «Empezar de cero» de arriba (la cuenta se borra con la misma función).

## Emblemas: los mismos momentos clave dentro de cada destino (Eric, 22-nov, V38B)
**Todos los emblemas de un destino usan los mismos momentos clave (`dim`, `fl`, `x`); nunca uno distinto.** Así un sonido de emblema que Eric guarda en el estudio vale para todos los de ese destino. Entre destinos pueden ser distintos (Roma: la luz estalla a los 8 s; Lanzarote, a los 9,9 s). En Roma las escenas no escriben `dim`, `fl` ni `x` (valen los de `tiemposDeEscena()`, en `tiempos.ts`); en Lanzarote salen de `cineLanza.tsx`. **La única excepción es el Coliseo** (`coliseo.tsx`, su escena es más larga). Si el dibujo de un emblema nuevo no cabe en esos tiempos, se ajusta el DIBUJO (sus retrasos CSS), nunca los momentos clave. En el estudio hay UNA tarjeta de emblema por destino («Emblema de Roma», «Emblema de Lanzarote») más la del «Coliseo»; un destino nuevo añade la suya y su lista de escenas en `estudio.ts` (`ESCENAS_DE_…`). `pruebaV38B` falla si una escena de un destino cambia sus tiempos.


## Las obras no se señalan (Eric, 23-nov, V41)
**En la app no se avisa de obras: cada sitio con su horario normal.** En los textos que ve el viajero (datos de los destinos, fichas, avisos, excursiones…) no se pone «en obras», «en restauración», «andamios», «remodelación» ni «cerrado por obras». Las notas internas (como la de la Domus Aurea en `data/dias/roma/_webs_oficiales_entradas.json`) se quedan. `pruebaV41` falla si un texto del viajero lo menciona. (Caso real: Barcelona › Camp Nou, «En obras de remodelación — consulta disponibilidad antes de ir».)

## Los botones flotantes: la derecha es fija, los demás van a su izquierda (Eric, 23-nov, V42)
- **La columna de la derecha es fija: Avisos, Cámara y Logros.**
- **Cualquier otro botón flotante** (Reorganizar, el lápiz de la propuesta y los que vengan) va **del mismo tamaño (44 px), en una columna a su izquierda**: el primero, a la izquierda de Logros; el segundo, a la de la Cámara; el tercero, a la de Avisos. **Nunca uno encima de otro.**
- **El color no cambia:** azul oscuro con dorado.
- En el código: `src/components/flotantes/flotantes.ts` (`useColumnaIzquierda`, `bottomDeLaFila`, `DERECHA_DE_LA_COLUMNA_IZQUIERDA`, `ORDEN_IZQUIERDA`); el botón nuevo se apunta ahí, lleva `data-flotante` y `data-flotante-izq`. `pruebaV42` falla si dos botones flotantes se pisan.

## HOY: las hojas de propuesta, los avisos y el botón dorado (Eric, 24-nov, V43)
- **Todas las hojas de propuesta** (`HojaPropuesta`: retraso, comer, otro día, añadir un sitio, plan de lluvia, «Hoy ya no da tiempo a todo») tienen UN solo formato: el texto de arriba; **un solo bloque de resumen que no se pulsa** (fondo suave, sin borde ni sombra; una línea con icono por cada cambio, solo las que vienen al caso); el **botón dorado que dice lo que hace** («Pasarlo al viernes 27»); y abajo, pequeño, [Dejarlo como está]. **Nunca** salen las palabras «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original» en HOY. **Nunca se protege una entrada o reserva cuya hora ya ha pasado** y **nunca se quita algo si se puede mover** a otro día (primero «pasarlo al mejor día donde quepa»; quitarlo es la segunda opción). `pruebaV43` lo vigila.
- **Los avisos.** Con [Deshacer]: tapando el menú de abajo (`AvisoSobreLaBarra`) y todos en el MISMO sitio; el texto dice qué ha pasado («Piazza Navona, añadida a tu día»). Sin [Deshacer]: arriba, bajo la cabecera; se van solos a los 5 s o deslizándolos; nunca más de uno a la vez (si hay varios, se juntan). **Cada aviso sale UNA vez por viaje, día y sitio** (`src/lib/avisosUnaVez.ts`, guardado en el móvil; un `useRef` no vale: se borra al cambiar de pestaña).
- **Un solo botón dorado** (el de Design, `135deg`, sin borde) y un solo botón claro: se escriben UNA vez en `src/components/ui/botonesOro.ts` (`BOTON_ORO`, `BOTON_CLARO`, `DORADO`) y todos los botones de HOY los usan. **Nunca** se vuelve a escribir un degradado dorado ni un borde `#9A7228` en un botón.

## HOY: la ubicación lejos del destino y los avisos con [Deshacer] (Eric, 24-nov, V44)
- **El GPS solo cuenta para los minutos y los cierres cuando el viajero está EN LA RUTA** (a 30 min andando de la parada; en coche, a un cuarto de hora de carretera): `zonaDeUbicacion` en `src/lib/ubicacionHoy.ts` da `ruta` · `destino` (en el destino pero lejos de la ruta: el aeropuerto) · `fuera` (a más de 50 km de todo el viaje) · `sin`. Fuera de la ruta HOY cuenta con el **tiempo del plan** («19 min · Del alojamiento al Coliseo», «Del Panteón a la Fontana de Trevi»); fuera del destino, «—» y «Estás lejos». **Nada se va a «Lugares pendientes» ni sale vacío por estar lejos** (tampoco en comer ni en añadir un sitio: se cuenta desde la parada de ahora). Nunca una cifra de más de un día. `pruebaV44` lo vigila. Cualquier pantalla nueva de HOY que use el GPS recibe `ubicacion` YA filtrada (en `HoyDuranteV2` la variable `ubicacion` es la útil; la cruda es `ubicacionReal`).
- **Todo lo que cambia la ruta lleva [Deshacer] y va ABAJO** (sobre el menú, `AvisoSobreLaBarra`): saltar, quitar, pasar a otro día, pasar todos, recuperar hoy y ya lo visité. **Juntar avisos es SOLO para los de arriba** (los que no llevan [Deshacer]); uno con [Deshacer] nunca se junta con otro. Al saltar se mira todo el día de golpe: un solo aviso («Han cerrado A y B»).
- «Activa tu ubicación» **no lleva pasos** (cada navegador y versión los cambia): solo qué hace falta y [Entendido].

## RESERVAS: el mismo patrón en vuelo, alojamiento, entradas y excursiones; y los avisos de toda la app (Eric, 24-nov, V45)
- **Cada tarjeta guardada lleva, arriba a la derecha junto al lápiz, el icono del documento** (QR o reserva): **gris con «+»** si falta, **dorado** si está (al tocarlo, `CodigoPantallaCompleta`). Mientras falta, abajo, **un botón de BORDE «+ Añade/Sube…»** (`BotonAnadirDocumento estilo="borde"`, en `BotonesDeReserva.tsx`). **Primero se guarda, después se sube:** las hojas no piden el documento. El contador «X de Y reservadas» cuenta al GUARDAR.
- **El billete de HOY y DÍAS** (`BilleteDeVuelo.tsx`, Design «Billete QR» Q1-Q4): QR dorado si la tarjeta está guardada, gris con «+» si falta (lleva a RESERVAS), franja «✓ Tarjeta de embarque guardada» o «+ Añade tu tarjeta de embarque».
- **Cada vuelo guardado se ve ABIERTO.** La vuelta sin poner: una línea «Falta añadir la vuelta» que abre la hoja en «Vuelta», sin QR.
- **La hoja «Elige día y hora»** no lleva [Añadir tu entrada] ni «Rellenar desde el email o el PDF» ni textos grises; en grupo va en DOS pasos (días y hora → «Casi lista» con «¿A qué cuenta lo sumamos?» y, solo con cuenta conjunta o del grupo, «¿Quién la ha pagado?»).
- **[Ver todas] de «Excursiones y actividades» abre la página de TODAS** (`TodasLasActividades.tsx`; el servidor da `todas` en `/api/destino-pagina`), nunca EXPLORAR. El carrusel se queda siempre.
- **Los avisos de toda la app** (amplía V43): con [Deshacer], abajo tapando el menú; los que solo informan («Enlace copiado», «Foto guardada»), ARRIBA (`AvisoArriba`), 5 s, se juntan. **Un error en un documento** (la tarjeta de otro día) NO es ventana ni aviso que se va: línea naranja DENTRO de la tarjeta con [Es correcta] (`src/lib/avisoDeDocumento.ts`), se queda hasta cambiar el documento o pulsar [Es correcta]. `pruebaV45` lo vigila.
- **Lo que ya pasó y no es una visita** (la comida del mediodía a las 22:35) sale de «Tu día» en HOY (2 h después de su hora).
- **Los dibujos de Design están en `docs/diseno/proyecto/`** (ULTIMO, copiado de Descargas): se miran con `scripts/destino/capturaDesign.mjs` y se comparan con la app.
