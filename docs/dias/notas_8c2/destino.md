# Notas 8C2 · La página de un destino, una colección por dentro y Mi colección

## Qué he hecho y dónde está
- **Página de destino** (G1, G2, T3; variante G0 sin nada ganado): `src/components/logros/pantallas/PaginaDeDestino.tsx`. Cabecera con el sello principal, «Sellos de ciudad», «Colecciones» (cada una abre su álbum), «Emblemas secretos» (solo los encontrados; los que faltan, «?»). El Vaticano dentro de Roma: el sello sale marcado «Estás aquí» si se llega con `resaltar: 'vaticano'` o con `destino: 'vaticano'` (que se traduce a Roma + resaltar).
- **Una colección por dentro** (A; variante A2 completa): `ColeccionPorDentro.tsx`. Álbum de cromos: lo visto lleva su fecha; lo que falta y está en la ruta del viaje abierto lleva «Día N · día» y [Cómo llegar].
- **Mi colección** (M1, M2; variante M3): `MiColeccion.tsx`. Páginas con scroll-snap, un grupo por página (si un grupo tiene más de 9 logros sigue en otra página), huecos por conseguir, aro de avance. Tocar uno ganado abre `abrir({ t: 'ficha', clave })`; tocar un hueco abre la hoja de «cómo conseguirlo» (solo la línea `como`).
- Sub-componentes: `pantallas/destino/` (`api.ts`, `formato.ts`, `piezas.tsx`, `destino.css`).
- **Servidor**: `server/logros/pantallas/destino.js` (funciones puras `paginaDeDestino`, `coleccionPorDentro`, `miColeccion` y las tres rutas).
- **Demo**: `src/lib/logrosDemo_destino.ts` (usa las mismas funciones del servidor y los datos de `data/logros/*.json`; Roma con parte hecha). `window.__demoDestino.modo('vacio')` para el estado sin nada.
- **Escaparate**: `src/dev/escaparates/destino.ts` (T3, G1, G2, G0, A, A2, M1, M2, M3).
- **Prueba**: `scripts/destino/pruebas8c/destino.mjs` (unas 110 comprobaciones; el total que imprime la prueba general suma las de todas las partes).

## Endpoints nuevos (de solo lectura)
- `GET /api/logros/destino?destino=roma[&trip_id]` → sellos (con fecha del grado), colecciones (con fecha de cada pedazo y de la completa), emblemas encontrados (con fecha) y cuántos faltan, y los números ya calculados (incluida la barra).
- `GET /api/logros/coleccion?destino=&coleccion=[&trip_id]` → cada sitio con nombre, fecha si está visto y, si falta y está en la ruta, su día.
- `GET /api/logros/mi-coleccion` → los logros de viajero por grupos, con la **clave** de cada uno ganado (para abrir su ficha) y su fecha. Lo hago aparte de `/api/logros/viajero` porque ese no da la clave (los logros de una ciudad no son de `*`).
No he tocado `servicio.js`, `vistas.js`, `motor.js` ni `exp.js`.

## Lo que no ha podido quedar igual que el diseño
- **Los pines de la vitrina** (el ✓ verde / «+» dorado de los sellos, colecciones y emblemas de la página): no los he puesto. Dependen de «Llevar a mi vitrina» (V3), que es de otro ayudante. Hay que añadirlos cuando exista esa pantalla.
- **La foto de la cabecera**: sigue siendo el degradado de color del destino (como en el diseño, sin el rótulo «FOTO DE ROMA»), porque aún no hay foto de destino.
- **[Cómo llegar]** no abre la hoja con «Abrir en Apple Maps / Google Maps»: esos nombres de empresa saldrían a la vista (regla 4). Abre directamente el mapa del móvil (el de Apple en iPhone/iPad, el otro en el resto) con la ruta andando desde donde estés.
- **Mi colección**: no incluyo «Las 7 maravillas» ni los Exclusivos (tienen su sitio aparte) y solo salen los logros de la Versión 1, así que hay menos huecos que en el diseño. Con un solo destino (Roma) los logros con escalones solo enseñan los escalones que ya se pueden conseguir (lo decide `logrosVisibles`).
- En un logro con escalones, bajo la chapa sale el nombre del **último escalón ganado** (p. ej. «Primer sello»), no el de la familia.
- Los días de la ruta salen con el calendario real (el diseño de muestra decía «mié 12»; en 2026 el 12 de octubre es lunes).
- G1 y T3 son la misma página de Roma (el diseño usaba Pisa, que no existe todavía): G1 se enseña ya bajada, hasta los emblemas.

## Los textos que he tenido que poner yo
- `destino/piezas.tsx`: «Un momento…» (ya existía en la hoja del botón) y «No se ha podido cargar. Vuelve a probar.».
- `PaginaDeDestino.tsx`: etiquetas solo de lectura para pantalla: «Volver a Todos mis logros», «Un secreto por encontrar»; y «Por conseguir» (grado y sello que aún no se tienen; está en el diseño de otras pantallas).
- `ColeccionPorDentro.tsx`: «✓ COMPLETA» y la frase `al_completar` de los datos (p. ej. «Roma a tus pies») cuando la colección está completa; no están en el diseño de A.
- `MiColeccion.tsx`: nombres cortos de las familias (Países, Destinos, Viajes, Cerrar…) sacados de «Mi vitrina»/Dashboard (`formato.ts › NOMBRE_DE_FAMILIA`) y la etiqueta «Cerrar».
- Las líneas «Roma aún esconde N secretos.» salen de `lineaDeSecretos` (la decisión de Eric).

## Peso (estimado por tamaño de archivo, sin comprimir)
Pantallas: 10 + 5,5 + 10,5 KB; subcarpeta `destino/`: 11,5 KB. Todas van por `import()` desde `PantallasHost`, nada en el paquete de arranque. Servidor: 11 KB. Demo y escaparate: solo desarrollo.

## Capturas hechas (en `docs/dias/capturas_8c/`)
T3, G1, G2, G0, A, A2, M1, M2, M3. Todas revisadas y distintas entre sí.

## Riesgos y lo que queda
- `resaltar` no está en el tipo `Pantalla` de `useLogrosPantallas.ts` (archivo compartido): lo leo con un tipo ampliado. Convendría añadir `resaltar?: string` a `{ t: 'destino' }`.
- Los pines de vitrina (arriba).
- Las capturas con Chrome sin ventana son lentas y a veces se cuelgan si hay varias a la vez; se repiten una a una.
