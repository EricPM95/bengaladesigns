# Mi vitrina, Todos mis logros y la ficha de un logro (8C2)

## Qué hay hecho
- `TodosMisLogros.tsx`: una pantalla con dos pestañas (`pantalla.pestana`). Vitrina (V1, V2): pedestal de las 7 maravillas, balda de Exclusivos y 4 baldas de 4 huecos; tocar una pieza la abre con [Compartir] y [Quitar de mi vitrina]. Todos mis logros (T1, T2): resumen, Por destino (Destinos y Países), logros de viajero por grupos con «Ver todo» (abre `mi_coleccion` con el grupo), Las 7 maravillas y Exclusivos.
- `FichaDeLogro.tsx` (T4): la hoja de un logro. Dentro de Todos mis logros sube sobre la propia pantalla; como pantalla suelta se abre con `abrir({ t: 'ficha', clave })`. `clave` = la de `GET /api/logros/ganados`, o `pendiente:<id del logro de viajero>` para uno que aún no se tiene (en gris, con cómo conseguirlo).
- V3 (`todos/ElegirHueco.tsx`): Llevar a mi vitrina → elige un hueco → Colocar aquí, con el aviso de lo que vuelve a Todos mis logros.
- Resto en `pantallas/todos/`: api.ts (almacén `useGanados` y `useHojasDeLogros`), dibujo.tsx, formato.ts, Vitrina.tsx, TodosLista.tsx, FichaHoja.tsx, HojasDeLogros.tsx, Repetir.tsx (Volver a ver, carga a demanda), todos.css.
- Servidor: `server/logros/pantallas/ganados.js` → `GET /api/logros/ganados` y `PUT /api/logros/ganados/vitrina { balda, huecos:[claves] }` (guarda la balda entera; `[]` la deja vacía de verdad). El título usa el `PUT /api/logros/vitrina { titulo }` que ya existía.
- Demo: `src/lib/logrosDemo_ganados.ts` + `logrosDemo_ganados_datos.json` (lo calcula el motor de verdad: `node scripts/destino/generarDemoGanados.mjs`, archivo extra mío). Viajeros: lleno, poco, vacio (`window.__demoGanados.poner(...)`).
- Escaparates: V1, V1b (pieza abierta), V1c (tras quitar), V2, V2b (nada ganado), V3, T1, T2, T2b, T4, T4b (no ganado), T4c (ya es tu título). Capturas en `docs/dias/capturas_8c/`.
- Prueba: `scripts/destino/pruebas8c/vitrina.mjs` (la parte de la vitrina suma 159 comprobaciones; todo junto 992, 0 fallos).

## Lo que no es igual que el diseño
- La foto «TU FOTO» (polaroid) de la pieza abierta no está: no hay foto del viajero ligada a cada logro.
- La foto de portada de cada destino es un degradado del color de su sello (como el placeholder del diseño); no hay foto de portada.
- Solo existe Roma con logros: el diseño enseña Pisa y Florencia; aquí sale solo Roma (y Vaticano en Países).
- Las tarjetas de destino dicen «11 de 11 colecciones · 5 secretos encontrados» (sin «de 12»: decisión de Eric sobre los secretos).
- El «Roma 2027» del dibujo del exclusivo es del dibujo de Design; el dato del viajero de ejemplo es 2026.
- Tocar un hueco vacío de la vitrina no hace nada (el diseño no lo pide); se llena con «Llevar a mi vitrina» desde la ficha.

## Textos que he puesto yo
- «Te falta 1 / Te faltan N para <escalón>» también en logros ya ganados con siguiente escalón (el diseño solo lo usa en los no ganados): FichaHoja.tsx.
- Unidades de la cuenta («1 país visitado», «viajes en pareja», «colecciones completadas»…): `FAMILIAS` en server/logros/pantallas/ganados.js.
- «N logros conseguidos / 1 logro conseguido»: TodosLista.tsx.
- «Las 7 maravillas» + «N de 7 maravillas.» al abrir el pedestal: Vitrina.tsx.
- «No se ha podido quitar / guardar. Vuelve a probar.», «Todavía no hay logros que enseñar.», «Un momento…»: Vitrina.tsx, ElegirHueco.tsx, TodosMisLogros.tsx.
- «N secretos encontrados» en la tarjeta de destino: TodosLista.tsx.
- «Sello de diamante/oro…» como en el diseño; «dentro del viaje a Roma» y «N destinos» como en el diseño.

## Cosas compartidas / para el coordinador
- `construirVitrina` (vistas.js) vuelve a rellenar solo una balda que se ha vaciado (`[]`) y mete en la vitrina el bronce de un sello que ya es oro. Mi `vitrinaDeGanados` lo corrige; si el Perfil usa `GET /api/logros/vitrina`, convendría que use `vitrina` de `/api/logros/ganados` o cambiar esas dos líneas en vistas.js (no lo he tocado).
- El servidor de desarrollo del 5173 estaba caído al final; saqué las capturas con otro Vite en 5199 (`--url=http://localhost:5199`).
- Los marcos de la pestaña «Mi colección» y la página de destino son de otro ayudante; solo los abro con `abrir`.

## Peso
Archivos nuevos (todos cargados a demanda con la pantalla): ≈ 92 KB de fuente en `todos/` + las dos pantallas; nada en el paquete inicial. El JSON del demo (77 KB) solo existe en desarrollo.

## Riesgos
- Los dibujos de sellos/colecciones/emblemas dependen de los ids de `roma.json`; otro destino necesitará sus dibujos.
- El título solo se puede poner entre logros de viajero (incluye exclusivos).
