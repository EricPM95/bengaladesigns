# Tanda 10 · JUTRIP: el nombre, el logo, la app en mármol y oro, la primera pantalla y dos emblemas

No he tocado el motor de rutas (ni sus datos). Lo que cambia es el nombre, el logo, los colores, la primera pantalla del formulario y los emblemas de Roma (que pasan a 14).

## 1. Qué he cambiado y dónde

**El nombre y el logo**
- `data/marca.json`: nombre **JUTRIP**, lema «De viajeros, para viajeros» (que es también la descripción del manifiesto), colores de P4 (crema `#F6EFE0` de tema y de fondo, marfil `#FBF3E2` de apertura) y el logo. Ya no dice «pendiente de la búsqueda de marcas».
- **El logo P4 va dibujado con código** en `shared/marca/logoJutrip.js` (la estrella con su anillo y la ruta de puntos, en oro con relieve, y debajo JUTRIP en Bodoni Moda 500 con la R y la P en 400; versión clara y versión oscura). Lo usan la apertura (`index.html`, por el plugin de `vite.config.ts`), la pantalla de entrar y los huecos del logo (`src/components/ui/LogoJutrip.tsx`, `LogoDeLaApp.tsx`). La estrella suelta, sin la palabra, está en `public/marca/logo-jutrip.svg` y `logo-jutrip-oscuro.svg`; el pie de las imágenes para compartir ya lleva el logo oscuro (antes, el hueco de rayas).
- **Pantalla de apertura** (Marca JUTRIP 02 · 01): el logo grande, el lema en mayúsculas pequeñas y separadas y la ruta de puntos. Sale unos 2 segundos solo al abrir la app (no en la recarga de después de entrar en la cuenta: lo decide una marca de la pestaña) y un toque la salta.
- **Pantalla de entrar** (02 · 02): arriba solo la palabra JUTRIP, más pequeña y sin recuadro ni estrella, sobre **fondo blanco** (lo pediste durante la tanda). El botón de Google, en degradado de marfil; el del email, en tarjeta.
- **El logo pequeño** (estrella y JUTRIP en una línea) va arriba en la primera pantalla y en el panel de la web grande.
- **Iconos** (`scripts/destino/iconosJutrip.mjs`, a partir del dibujo en código): `icon-192`, `icon-512`, `icon-maskable-512` (con margen del 20 %), `apple-touch-icon` y el de la pestaña (`favicon.svg`). Ver `capturas_jutrip/icono_en_la_pantalla_de_inicio.jpg`.
- **El nombre en lo que ve el viajero:** el único «Trazo» visible era el del panel de la web grande, y había un «ROUTY» dentro del dibujo del exclusivo holográfico; el resto sale de `marca.json`. El código de campaña por defecto de los enlaces de alojamiento es `JUTRIP`. El nombre del pase que sale al pagar es «JUTRIP · Pase de Roma · …». La página de privacidad y condiciones lleva el nombre. No he tocado nada de dentro (`trazo:…`, nombres de archivos, carpetas y tablas).
- **Bodoni Moda**, solo 400 y 500, cargada con las otras fuentes en `index.html`.

**La primera pantalla** (`src/components/trazo/PrimeraPantalla.tsx`, de `Piezas/Primera Pantalla`)
- El mapa del mundo con los pines de **nuestros destinos**: sale de los datos (`server/destinosCurados.js`, `GET /api/destinos-curados`): un destino sale solo si tiene sus días escritos (`data/dias/<clave>/listas.json`), sus datos (`data/pipeline_v2/<clave>.json`), sus logros con pase (`data/logros/<clave>.json`) y su pin (`data/dias/<clave>/_mapa.json`, nuevo; hoy solo el de Roma: 41.9028, 12.4964). Hoy sale solo Roma; cuando haya otro con sus cuatro cosas, sale solo.
- La silueta de la tierra es `tierra110.json`, que ya iba dentro de la app (en su propio trozo): el mapa no pide nada a internet. También el mapa de fondo de los pasos 2 a 7, que antes bajaba la tierra de jsdelivr.
- Arrastrar y zoom (dedos, rueda); al elegir destino, el mapa va hacia él; con origen y destino, la curva con el avión y [Trazar ruta].
- **ORIGEN:** cualquier ciudad, con el buscador de siempre. **DESTINO:** solo los nuestros (los pines, la fila de tarjetas o escribiendo; Intro elige el primero). Si escribes uno que no tenemos: «Aún no tenemos Tokio. ¿Te avisamos cuando llegue?», el email (ya puesto si tienes cuenta) y [Avísame]; después, «¡Hecho! Te escribimos en cuanto llegue Tokio.».
- **Los colores del panel** (ORIGEN/DESTINO, tarjeta, botón) son los de la captura que me pasaste (la variante marfil): panel en degradado de marfil con filo de oro, campos blancos con borde de oro, anillo de ORIGEN en oro y botón apagado beige.
- **Quitado a tu petición:** «¿Buscas una ruta panorámica?» y «Dev: ruta rápida». Respondo a tu pregunta: «Dev: ruta rápida» **solo salía en desarrollo** (estaba dentro de `import.meta.env.DEV`), nunca en la app de verdad. La pantalla dev sigue existiendo y se abre con `window.__rutaPrueba()` (solo en desarrollo), así que las pruebas siguen funcionando.
- **Arriba, un degradado de blanco a azul del mapa** para que el logo y el texto destaquen. **El mapa arranca más centrado en Europa** (el centro y el zoom de salida de la primera pantalla).
- Los pasos 2 a 7: misma estructura, ahora en crema `#F6EFE0`, tarjetas `#FFFDF8`, tinta y oro (`trazoUi.tsx`, `trazo.css`).

**El aviso de destinos nuevos**
- Tabla nueva `avisos_destino` (migración **0028**, abajo). `POST /api/avisos-destino` (`server/avisosDestino.js`): hace falta una sesión (la de la cuenta o la anónima), un máximo de 30 peticiones por hora y dirección, y guarda **una fila por email y destino** (sin mayúsculas ni tildes: «Tokio», «tokio » y «TÓKIO» son lo mismo). Si la tabla no existe: «No hemos podido guardarlo. Inténtalo más tarde.» y no se rompe nada.
- Privacidad: línea nueva en «Para qué lo usamos»: «Avisos de destinos nuevos: si escribes un destino que aún no tenemos y pides que te avisemos, guardamos tu email y ese destino. Solo los usamos para avisarte cuando llegue ese destino.»
- Panel de administrador (`/?admin=logros`): pestaña nueva **«Destinos pedidos»** (qué destinos pide la gente y cuántas veces), con `GET /api/admin/destinos-pedidos` (solo la cuenta de administrador).

**Los dos emblemas nuevos (Roma esconde 14 secretos)**
- `data/logros/roma.json`: **Plaza de España** («Escalón a escalón» · «Los 135 escalones que suben a la Trinità dei Monti.») y **Castillo de Sant'Angelo** («Tumba de emperador» · «Tumba de emperador, fortaleza de papas.»), con sus sitios de siempre (mismo radio). Se ganan como los demás (ubicación o foto). El total sale de los datos.
- Dibujos de Design (`esc`, `cas`) en `Emblema.tsx` (forma de escalinata con borde rosado, y el castillo redondo con su dibujo animado), y su sitio en la vitrina de la hoja de logros.
- Las películas **E12** y **E13** (`escenas/plaza_de_espana.tsx`, `castillo_de_santangelo.tsx`), con sus textos, cargadas solo al abrirlas (import dinámico), como las otras. Un toque salta al emblema; [Seguir] sigue.

**La app por dentro, en mármol y oro**
- Los colores están en `src/index.css` (no pantalla a pantalla): crema `#F6EFE0`, tarjeta `#FFFDF8`, tinta `#1C2230`; `--accent` (oro oscuro), `--accent-hover` (oro profundo `#6E5018`), `--accent-soft`, `--oro` (oro claro `#B58A2E`, solo líneas y puntos) y, de noche, el oro pálido `#E9C77A` (con texto de tinta en los botones de oro). El frambuesa pasa a llamarse `--frambuesa` (y `frambuesa` en Tailwind).
- **La barra de abajo:** la A (tinta con la pestaña en marfil, icono y nombre en oro) y, de noche, la C (gris azulado con filo de oro y pestaña en oro pálido).
- Sin cambiar: el verde de «Visto», el rojo de los avisos, el lila de los barrios, los colores de cada día, las etiquetas de tipo de las paradas (`tagColors.ts` y `dayColors.ts` no han cambiado ni un byte) y los colores propios de los logros.

## 2. La migración nueva (0028)

Es la tabla de los avisos de destinos nuevos. Se puede pegar entera en el SQL Editor de Supabase y se puede repetir sin problema. **Hasta que no la apliques, [Avísame] dice «No hemos podido guardarlo…» y el resto de la app funciona igual.** Pega el contenido de `supabase/migrations/0028_avisos_destino.sql`:

```sql
create table if not exists public.avisos_destino (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  destino_norm text not null,
  email text not null,
  email_norm text not null,
  idioma text not null default 'es',
  user_id uuid references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  constraint avisos_destino_unico unique (email_norm, destino_norm),
  constraint avisos_destino_largos check (char_length(destino) between 2 and 80 and char_length(email) between 5 and 254)
);

create index if not exists idx_avisos_destino_destino on public.avisos_destino (destino_norm);

alter table public.avisos_destino enable row level security;
revoke all on table public.avisos_destino from anon, authenticated;
```

(En el archivo lleva además los comentarios.) Sin políticas: nadie del móvil la lee ni la escribe, solo el servidor. Para comprobar después: `node scripts/cuentas/estadoMigraciones.mjs` (ahora llega hasta la 0028).

**Ojo con la 9B:** su prompt pedía una migración «0028 de_prueba». Esta tanda ya ha cogido el número 0028; la de la 9B tendrá que ser la **0029**.

## 3. Lo que se queda sin sentido con un solo destino curado (lo decides tú)

- **«¿Buscas una ruta panorámica?»**: ya lo quitaste. Sin él, la entrada al flujo «ruta panorámica en coche» (`startPanoramic`) desaparece de la primera pantalla (lo he borrado de `TrazoFlow`). `RouteSearch.tsx` sigue en el proyecto, sin usar.
- **El botón de intercambiar origen y destino**: no está en el diseño y no tiene sentido (el destino ya solo puede ser Roma); no lo he puesto.
- **Las preguntas de «llegar a un destino que no es una ciudad»** del paso 2 (ruta panorámica / explorar desde una base) y la **sugerencia de lugares por Claude** del paso de lugares: con Roma curada no salen nunca. Siguen en el código por si vuelve un destino sin curar.
- «Varias ciudades» no está en el formulario (solo es una pieza de Design), así que no ha cambiado nada.

## 4. Textos de emblemas que no coinciden con Design

He comparado los 14 con «Logros Modelos → 03». **Solo uno** no coincide y no lo he cambiado:
- **Foro Romano** («Donde empezó todo»): `roma.json` dice «Aquí latía la antigua Roma: se votaba, se juzgaba y se comerciaba.»; Design dice «Aquí estaba el Miliario de Oro: de él partían los caminos del Imperio.» (la película del Foro, en `cine.tsx`, ya lleva la del Miliario).

Y una nota: en Design, las películas dicen en su visor «Toca para saltar» y [Repetir animación]; las escenas que ya había en la app (y las dos nuevas) usan «Saltar todo» arriba, un toque para ir directo al emblema y [Seguir]. He hecho las dos nuevas igual que las otras; si quieres «Toca para saltar» y [Repetir animación] en todas, es un cambio aparte en `cine.tsx`.

## 5. Los contrastes del oro (medidos en `pruebaJutrip.mjs`)

| Qué | Contraste | Mínimo |
|---|---|---|
| oro oscuro (texto) sobre crema | 4,56 | 4,5 |
| oro oscuro (texto) sobre tarjeta | 5,14 | 4,5 |
| blanco sobre oro oscuro (botón con texto) | 5,22 | 4,5 |
| oro profundo sobre marfil / crema / oro suave | 6,74 / 6,50 / 5,84 | 4,5 |
| oro oscuro de Design `#8E6820` sobre marfil (pestaña de la barra) | 4,58 | 4,5 |
| oro oscuro, título grande, sobre el mar de la primera pantalla / sobre el crema | 3,53 / 4,56 | 3 |
| texto del botón de entrar (oro profundo) sobre su degradado | 5,34 | 4,5 |
| ORIGEN / DESTINO (tinta al 66 %) sobre la tarjeta | 5,17 | 4,5 |
| «Arrastra y haz zoom» (tinta al 60 %) sobre el mar (texto auxiliar) | 3,69 | 3 |
| noche: oro pálido sobre fondo / tarjeta; tinta sobre oro pálido | 11,32 / 10,24; 11,12 | 4,5 |
| el oro claro `#B58A2E` sobre crema (por eso solo líneas, pines, barra de pasos y puntos) | 2,8 | — |

**Lo que he tenido que oscurecer:**
- **El oro oscuro `#8E6820` de Design sobre el crema `#F6EFE0` da 4,42** (no llega a 4,5). Lo he oscurecido lo justo: **`#8B6620`** (139 102 32), que da 4,56. Es el que va en `--accent` y en los textos del formulario. El `#8E6820` original se queda donde ya llegaba (la pestaña de la barra sobre marfil, 4,58) y dentro del logo.
- **El botón de la primera pantalla** ([Trazar ruta] y [Avísame]) en Design lleva el oro claro `#B58A2E` con texto blanco (2,8): lo he pasado al oro oscuro.
- «Arrastra y haz zoom» y las etiquetas ORIGEN/DESTINO, algo más oscuras que en Design.

## 6. Dónde ha quedado el frambuesa

Solo en lo permitido (la prueba lo comprueba archivo por archivo):
- **«Falta»**: `BloqueReservas` (el estado), `ResumenViaje` (RESERVAS: «0 de 3 listo» y los aros), `ReservasItemRow` (la franja), `EntradaEdgeTab` y `EntradaCard` (la entrada sin reservar), `hoy/piezas.tsx` (la franja de la entrada sin reservar en HOY), `ArrivalReturnSheet` (la franja del traslado sin reservar), `COLOR_ICONO.falta` (`lib/iconos.ts`).
- **El punto de los avisos**: `ListaDeAvisos`.
- **El corazón de «lo recomiendan»**: `MeGusta`.
- **Las piezas de la colección principal y lo demás de los logros** (`src/components/logros/**`: la insignia principal, la hoja de logros, las pantallas del pasaporte y la colección, el botón flotante con su puntito, los resúmenes y las hojas del Visto): son colores propios de los logros y no los he tocado. **Decidido por ti:** las pastillas «Nuevo» se quedan en frambuesa (son un aviso, como el punto de los avisos) y **el botón de la cámara pasa a oro** (el «Hacer foto» de las hojas del Visto y el botón de cámara de la parada con pedazo pendiente).
- `lib/exploreStyle.ts`: la tarjeta «Entradas» de EXPLORAR tiene su propio color (cada tarjeta tiene el suyo); sigue rosado.
- `StepElegir`: las tres líneas de los días del dibujo conservan el color de «falta» como primer día (los colores de los días no cambian).

**Los sitios que usaban el frambuesa a mano, sin pasar por `index.css`, y que he cambiado** (unos 45 en 35 archivos): errores de formularios y hojas (`AjustesScreen`, `EditarPerfil`, `HojaComoTeLlamas`, `HojaDeCompra`, `HojaDosViajes`, `HojaInvitar`, `HojaRecomendacion`, `HojaVerPropuesta`, «sale» de `CambioParada`) → rojo de avisos; el resto → oro (`MisPases`, `TarjetaPaseReservas`, `Hoja`, `TarjetaRecuerdos`, `TusFotosDeHoy`, `PantallaPresupuesto`, `EntradasYFreeTour`, `LlegadaYVuelta`, el botón «Reservar» de HOY y el de `ArrivalReturnSheet`, el pin de «casa» del mapa, el marcador «Ahora» y los textos de HOY v1 y v2, `StepElegir`); los brillos de las tarjetas oscuras de HOY y del presupuesto → oro pálido; «Cerrado» en HOY → rojo.

## 7. Pruebas

- **Nueva `scripts/destino/pruebaJutrip.mjs`: 107 comprobaciones, 0 fallos.** Nombre y manifiesto (con iconos y su tamaño), ningún «Routy» ni «Trazo» en los textos del código ni en lo que sale en pantalla, el mapa (solo Roma; con un destino curado de mentira, también; sin pedir nada a internet: solo la app, las tipografías y la sesión de la cuenta), el aviso (una fila por email y destino, sin la tabla no se rompe, rutas y administrador, y la migración 0028 en un Postgres de verdad con PGlite, repetible y sin políticas), los 14 emblemas (datos, dibujos, escenas, y que las dos películas se abren y salen con su nombre y [Seguir]), los contrastes medidos, el frambuesa solo donde toca, y las etiquetas de las paradas y los colores de los días sin cambiar.
- **Las 9 pruebas que salieron en MAL en la primera pasada de la batería, una por una** (todas miraban cómo era la app antes; solo ha cambiado lo que cambió a propósito):
  1. `pruebaCorr6z6_reservas` (20 fallos): comprobaba que el «Falta» de RESERVAS era monoespaciado en `oklch(0.5 0.17 5)`. Ahora el «Falta» sigue en frambuesa pero pasa por la variable `--frambuesa-hover`; la prueba busca eso. El «Falta» no ha cambiado de color.
  2. `pruebaCorr6z6`: es el paquete que lanza la anterior (y otras dos partes, que siguen en 0). Sin cambios propios: pasa al arreglar la 1.
  3. `pruebaFase6y2_formulario` (1 fallo, «no están las 3 líneas de los días»): contaba tres líneas con color `oklch` en el dibujo de «elegir». Yo había pasado la primera al oro por error; **he devuelto las tres líneas a los colores de los días** (no cambian) y solo el texto «día a día» y la etiqueta RECOMENDADO van en oro. Sin cambios en la prueba: pasa.
  4. `pruebaFase6y_formulario` (2 fallos): esperaba «día a día» en frambuesa; ahora va en oro (`#8B6620`). Cambiada esa expectativa. La otra comprobación (las 3 líneas) pasa con la corrección anterior.
  5. `pruebaFase6y3_formulario` (error): leía `StepRoute.tsx`, que ya no existe (es `PrimeraPantalla.tsx`). Ahora comprueba que la pantalla de inicio ya no lleva «Dev: ruta rápida» ni «ruta panorámica» (lo pediste) y que la pantalla dev sigue abriéndose desde `rutaDePrueba`.
  6. `pruebaFase6y4_formulario` (1 fallo): esperaba el azul marino `#0B2A5B` en el calendario del formulario; ahora es el oro `#8B6620`.
  7. `pruebaFase6z6f` (1 fallo): esperaba `oklch(0.5 0.17 5)` en la tarjeta «0 de N listo» de RESERVAS; sigue en frambuesa («falta») pero por `--frambuesa-hover`.
  8. `pruebaTanda6z3` (1 fallo): comprobaba que `--accent` tenía tono frambuesa. Ahora el acento es el oro; comprueba que tiene tono oro (rojo > verde > azul) y que el texto blanco sobre él llega a 4,5. El frambuesa vive en `--frambuesa`.
  9. `pruebaCuentas3` (error + 3 fallos): leía `StepRoute.tsx` para el botón «Dev: ruta rápida» (ahora comprueba que no está en la pantalla de inicio y que la pantalla dev sigue), esperaba el «hueco del logo» vacío en la entrada y `logo: null` en `marca.json` (ahora, la palabra JUTRIP sin estrella ni recuadro y el logo puesto) y que `index.html` no llevara el nombre (el comentario lo nombraba: lo quité).
  - Además, en `pruebaLogros1` (que estaba en verde porque la edité antes de la pasada): 14 emblemas (12 de sitio y 2 de momento), «Roma esconde 14 secretos» y «2 de 14», +50 EXP al 100 % (dos emblemas más, a 25 cada uno), un sitio que usaba de ejemplo «sin emblema» (el Castillo, que ahora tiene) cambia a Trastevere, `docs/dias/NOMBRES_LOGROS.md` lleva los dos nombres nuevos, y un caso nuevo con los dos emblemas ganados.
  - Ayudantes (no son pruebas): `_baseDeDatosPrueba.mjs` aplica también la 0028, `_enLaApp.mjs` saca capturas, escribe y mide peticiones, y `estadoMigraciones.mjs` llega hasta la 0028.
- **Batería rápida completa (final): 76 pruebas, 75 en 0 fallos o con su «ok?» de siempre.** La que sale en MAL es `pruebaFase6y5_motor`, que sola se pasa del tiempo (ya pasaba con el motor sin tocar) y se corre por procesos (`_correr6y5.mjs procesos=12`): **143.647 comprobaciones, 0 fallos**. Con eso, **la batería rápida queda en 0 fallos**; `pruebaJutrip`: 108 comprobaciones, 0 fallos.
- **Peso al abrir la app** (`scripts/destino/pesoAlAbrir.mjs`, lo que baja el móvil antes de pintar, comprimido): **antes 322,8 KB, ahora 325,3 KB** (+2,5 KB: el logo en código, la primera pantalla y el mapa). Por debajo de 340 KB.
- **Capturas** en `docs/dias/capturas_jutrip/` (390 × 844): la primera pantalla A a G, un paso de cada tipo del formulario (transporte, fechas, compañía), la entrada, la apertura, el icono, las películas E12 y E13 (principio, mitad y final) y, de día y de noche: HOY, DÍAS (cerrado y con un día abierto), la ficha de una parada, EXPLORAR, RESERVAS, Logros (todos mis logros y la hoja del viaje) y el Pase (Mis pases). Se rehacen con `node scripts/destino/capturasJutrip.mjs`.

## 8. Qué mirar en el móvil

1. **Abrir la app**: la apertura (logo, lema, ruta de puntos) unos 2 s; un toque la salta; si recargas (por ejemplo, tras entrar con Google) no vuelve a salir.
2. **La primera pantalla**: arrastrar y zoom con dos dedos; tocar el pin de Roma; escribir «Tokio» y probar [Avísame] (dirá «No hemos podido guardarlo» hasta que apliques la 0028).
3. **El icono**: añadir la web a la pantalla de inicio y ver el icono (con el «maskable» en Android, sin que se corte la estrella).
4. **El oro**: que los textos pequeños en oro se lean (etiquetas «02 — RUTA», pastillas) y los botones se vean claros; en noche, el oro pálido.
5. **La barra de abajo** de día y de noche.
6. **Los dos emblemas** (lo más fácil, con el modo de pruebas de logros): Plaza de España y Castillo de Sant'Angelo.
7. **Visto y no tocado (ya venía así):** en modo noche, algunas tarjetas de RESERVAS y de EXPLORAR llevan fondo marfil fijo con letra clara y casi no se leen. Es de antes de esta tanda; si quieres, lo arreglo en otra.

## 9. Dos arreglos de HOY (después de la tanda)

No he tocado el motor.

**1. La tarjeta de la siguiente parada, en claro** (Marca JUTRIP → 02 · 09)
- **De día:** tarjeta clara (`#FFFDF8`) con filo de oro, letra de tinta, **[Visto] en verde**, **[Cómo llegar] en oro** (degradado de marfil con letra de oro profundo) y los demás botones (No me da tiempo, Sobre este lugar, Más visitas…) con filo de tinta. **De noche:** la tarjeta oscura de siempre con el oro pálido (el «Siguiente parada» y [Cómo llegar] en `#E9C77A`).
- Solo colores y aspecto: cada botón hace lo mismo que antes. Está en las dos versiones de HOY: la de ahora (la tarjeta lleva el mapa pequeño arriba) y la nueva (`VITE_HOY_V2`, con la foto arriba como en Design). En la de ahora no he puesto foto (no hay en esa tarjeta): lleva el mapa, como hoy.
- Dónde está: `useClaro()` y los estilos de la tarjeta en `src/components/route/hoy/piezas.tsx`; la tarjeta en `HoyDurante.tsx` y `v2/HoyDuranteV2.tsx`; los botones sueltos en `saltar.tsx` y `masVisitas.tsx`. La tarjeta lleva `data-tarjeta="clara"|"oscura"`.

**2. Modo noche en HOY**
- Los avisos («… cierra hoy a las 18:30»), «Cerca de ti», la lista de paradas y el aviso de «Saltada» eran tarjetas blancas fijas con letra de tinta (o clara): ahora, de noche, son tarjetas de noche con letra clara (reglas en `src/index.css` bajo `.dark [data-hoy]`, más la letra de la lista y la etiqueta «HOY · SÁB 17 · 0 de 14 visto», que iban con colores fijos).
- La prueba nueva mira, en el navegador, el fondo de la tarjeta y de los avisos de día y de noche.

**Repaso de noche en todas las pantallas** (capturas en `docs/dias/capturas_jutrip/interior_*_noche.jpg` y `hoy_*_noche*.jpg`). Pasa también en estos sitios; **no los he tocado** (me pedías que te dijera dónde):
1. **RESERVAS**: las tarjetas «Llegada y vuelta», «Alojamiento» y «Entradas y Free Tour» y «0 de 3 listo» son marfil fijo con el título casi invisible (letra clara sobre marfil).
2. **EXPLORAR**: las seis tarjetas (Atracciones, Miradores, Restaurantes, Entradas, Excursiones, Baños) llevan fondo marfil con el nombre en letra clara: no se lee el nombre.
3. **DÍAS**: «Añade alojamiento en Roma» y la tarjeta azul de «Llegada · desde Madrid» (el texto «Añade tu vuelo…») se leen mal.
4. **La ficha de una parada** (la hoja que se abre al tocar una parada) sale siempre en claro, también de noche (no sigue el modo noche). Se lee bien, pero no es de noche.
5. Los escaparates de logros y de Pase (`interior_Logros_*`, `interior_Pase_*`) salen siempre en claro en las capturas porque se montan fuera de la app; en la app de verdad no las he podido mirar de noche con estos datos de prueba.
- Bien de noche: HOY (los dos), RUTA, la lista de DÍAS y la barra de abajo.

Si quieres, lo siguiente es arreglar 1, 2 y 3 con la misma idea (tarjeta de noche con letra clara) y llevar la ficha de la parada al modo noche.

**Pruebas de este apartado:** `pruebaJutrip` 118 comprobaciones, 0 fallos (10 nuevas de HOY). Batería rápida: 76 pruebas en 0 fallos; `pruebaFase6y5_motor` por procesos, 143.647 comprobaciones, 0 fallos. Dos pruebas viejas miraban el código de HOY y las he actualizado a propósito: `pruebaFase6y7_historias` (el botón «Escuchar» de HOY ahora lleva `oscuro={!claro}`, es decir, claro o oscuro según el modo) y `pruebaTanda6z5` (la parada saltada sale en gris con la letra del tema, `rgb(var(--text) / .4)`, y no con el gris fijo). Capturas de HOY (v1 y v2, de día y de noche, y la parte de abajo) en `docs/dias/capturas_jutrip/hoy_*.jpg`.
