# Informe: Tanda 8C2, las pantallas de logros, el Perfil con su marco y la EXP a la vista

18-oct-2026. Todo sigue detrás de los interruptores de siempre (con los logros apagados la app es la de hoy). **El motor de rutas no se ha tocado** (ni `server/engine`, ni `shared/routeEngine`, ni `shared/archivo`). **No hay migraciones nuevas** (la 0025 de la 8C1 sigue sin aplicar; orden: 0020 → 0021 → 0023 → 0024 → 0025). Se incluyen, tal cual, `PROMPT_TANDA8C2.md` y los archivos de Design.

Trabajé con cuatro ayudantes (vitrina, destinos, mundo/pasaporte, Perfil); sus notas, con más detalle, están en `docs/dias/notas_8c2/` (`vitrina.md`, `destino.md`, `mundo.md`, `perfil.md`; `BASE.md` es lo que se les dio).

## Qué pantallas hay y dónde están

| Pantalla (nombre de Design) | Dónde |
|---|---|
| **1a, 1b** el botón flotante y sus estados | `momentos/BotonFlotanteLogros.tsx` |
| **2a, 3a, 3b, 3c, 4a** la hoja antes, durante y después | `momentos/HojaLogros.tsx` (+ `momentos/hoja/textosHoja.ts`, `piezaDeInsignia.ts`) |
| **V1, V2, V3, T1, T2** Mi vitrina y Todos mis logros | `pantallas/TodosMisLogros.tsx` (+ `pantallas/todos/`) |
| **T4** la ficha de un logro | `pantallas/FichaDeLogro.tsx` |
| **G1, G2, T3** la página de un destino | `pantallas/PaginaDeDestino.tsx` |
| **A** una colección por dentro | `pantallas/ColeccionPorDentro.tsx` |
| **M1, M2** Mi colección | `pantallas/MiColeccion.tsx` |
| **TR** Mis viajes → un viaje | `pantallas/ViajeGuardado.tsx` |
| **J1, J2, J3** ¿Dónde has estado ya? | `pantallas/DondeHasEstado.tsx` (+ `pantallas/mundo/`) |
| **P1, P1b** el Perfil con marco, nivel, título | `layout/PerfilSheet.tsx` + `pantallas/perfil/CuerpoConLogros.tsx` |
| **P2, P2l, P2v, P2i2, P2m, P2e** el pasaporte | `pantallas/PasaporteScreen.tsx` |
| **E1–E4** la EXP a la vista | las dibujan `pantallas/perfil/` (`ExpGanada`, `SubeDeNivel`, `CambioDeRango`); cuándo salen: `momentos/ExpHost.tsx` |
| **C1, C2** Compartir | `momentos/Compartir.tsx` + `momentos/imagen.ts` |

Todas las pantallas nuevas van en su propio archivo y se bajan al abrirlas. `PantallasHost` (montado en `App`) las abre con `useLogrosPantallas.getState().abrir({ t: 'destino', destino: 'roma' })`, etc.

**Cosas que hacen lo que pedías**
- La hoja usa los números del servidor (el estado ahora manda, por cada sitio de una colección, su nombre, si está en la ruta y sus coordenadas). «Con tu ruta puedes completar N de las 11 colecciones» sale de la ruta de verdad. «Roma esconde 12 secretos» antes del viaje y «Roma aún esconde N secretos.» durante y después.
- Los emblemas: la hoja solo dibuja los encontrados (y al tocarlos vuelve su escena); los que faltan son solo «?». Ningún Madrugador/Nocturno con hora.
- Los países de «¿Dónde has estado ya?» dan su sello «recuerdo»; **no dan EXP, no cuentan para el sorteo, no cuentan para los logros que piden viajar con la app** (la prueba lo comprueba mirando que `exp.js`, `motor.js` y `momentos.js` ni los nombran).
- **EXP:** durante las sorpresas y las películas, nada. Al acabar (y a los ~1,4 s, para que el dibujo llegue al botón y éste lata) sale **una sola** animación «+N EXP» con toda la EXP sumada; después, si sube de nivel, E3; si cambia de rango, E4 con su marco nuevo. No sale en el resumen del día. La EXP la suma el almacén (`useLogrosStore.exp`) con lo que manda el servidor en cada Visto/foto; el móvil no calcula nada. El modo demo usa las mismas funciones y la misma tabla que el servidor.
- **Marcos:** 10 imágenes WebP, de 37–58 KB cada una (antes 0,7–1,3 MB; total 9,7 MB → 0,5 MB, más 12 KB de huecos). Solo se baja el del rango del viajero, al pintar el Perfil (`loading="lazy"`). Reproducibles con `scripts/destino/marcos8c.mjs`.
- **Compartir:** el pie nuevo lleva el marco de rango del viajero con sus estrellas y su título; **el hueco del logo queda vacío** (una caja de rayas) y preparado: `LOGO_DE_LA_APP` en `imagen.ts`. Ningún nombre de la app puesto a mano. La imagen del viaje decía «N de 12 secretos encontrados» y ahora dice «Roma aún esconde N secretos.».
- Servidor, solo lectura salvo donde se dice: `GET /api/logros/ganados` y `PUT /api/logros/ganados/vitrina` (Todos mis logros, vitrina), `GET /api/logros/destino`, `/coleccion`, `/mi-coleccion`, `GET /api/logros/previos`, `/pasaporte2`, `GET /api/logros/perfil`. Cada parte registra sus rutas en `server/logros/pantallas/`.

## Lo que no ha podido quedar igual que el diseño (y por qué)
- **Botón y hoja:** el chip «0 de 12» / «N / 12» de los secretos no está (decisión de Eric: ya no se dice «N de 12»; y sería repetir el título). Los huecos de los secretos que faltan llevan la forma de cada hueco del diseño con un «?» dentro, en su sitio fijo; la forma no dice qué emblema es. **«Añadir a mi ruta»** abre «Añadir parada» sin el sitio puesto (esa pantalla no sabe recibir uno). **«Cómo llegar»** abre el mapa del móvil directamente. Tocar un pedazo de la **insignia del Vaticano**: la forma es un escudo en dos mitades con las llaves en el centro; reparto el toque entre izquierda, derecha y centro (aproximado).
- **Vitrina / Todos mis logros:** falta la foto «TU FOTO» (no hay foto del viajero ligada a cada logro); la portada de cada destino es un degradado del color de su sello; solo existe Roma (el diseño enseña Pisa y Florencia).
- **Destinos:** faltan los pines de vitrina (✓ / «+») de sellos, colecciones y emblemas: dependían de V3 y quedan por añadir. G1 y T3 son Roma (el diseño usaba Pisa). Mi colección tiene menos huecos que el diseño porque solo salen los logros de la Versión 1.
- **Perfil:** «Mis viajes» mantiene las filas de siempre (no las tarjetas grandes con foto); los viajes de antes de la app solo se guardan como países, así que sale una tarjeta con el número de países; la foto del perfil es la inicial «V» (no hay sistema de fotos); el pasaporte es la tarjeta compacta; el botón de **Ajustes** está y no hace nada (P3–P5 van con las cuentas). La vista de los 10 marcos es documentación de Design y no está en la app (se ven en las capturas `P1-rango1…10`).
- **Pasaporte:** el globo es propio (proyección ortográfica en SVG con las costas de world-atlas guardadas en la app, 84 KB, sin d3 ni internet); una moneda por país, no por ciudad; sin nombre del viajero en la tapa; pasar de página es un fundido corto; el monumento del sello solo existe para las ciudades que Design dibuja.
- **Dashboard:** la animación de E3/E4 es de una pasada (Design la repite en bucle).
- **Capturas con la ruta:** 1a se hizo con el viaje de pruebas del motor (`__rutaPrueba`), el servidor API tuvo que estar encendido.

## Los textos que he tenido que poner yo
- Hoja: «Todavía no hay logros que enseñar.», «Un momento…» (ya estaban en la hoja anterior); «Cerrar» y «Volver a ver {emblema}» (solo para lectores de pantalla); la línea «Te quedan N para el diamante de {ciudad}. Lo que no viste te espera en tu próximo viaje.» sale del texto del diseño con el número calculado; «Lo esencial, visto» / «El país entero, visto» son del diseño (Roma y el Vaticano; otro destino no dice nada).
- Vitrina y ficha: «Te falta 1 / Te faltan N para…» en logros ya ganados; las unidades («1 país visitado», «viajes en pareja»…); «N logros conseguidos»; «N de 7 maravillas.»; «N secretos encontrados»; los avisos de error («No se ha podido guardar. Vuelve a probar.»).
- Destinos: «No se ha podido cargar. Vuelve a probar.»; «✓ COMPLETA» y la frase `al_completar` de los datos; nombres cortos de las familias de logros (del Dashboard).
- Mundo: «No se ha podido guardar. Vuelve a probar.», «N sellos de recuerdo · N continentes» (calculado), «sin sello aún», «No se ha podido abrir tu pasaporte. Vuelve a probar.», «N SELLOS».
- Perfil: «Tu primer logro irá aquí», «Elige tu título», «Antes de la app», «Te faltan N EXP para la siguiente estrella» (en el último nivel), «Ver todo {destino}».
- Las listas completas, con el archivo de cada una, están en las notas de cada ayudante.

## El peso al abrir (JavaScript)
- **Antes (8C1): 708,4 KB (315,1 KB comprimidos). Después: 713,1 KB (316,8 KB comprimidos)**, en 4 archivos: **+4,7 KB**. Lo que entra al abrir: el botón con su aro, `PantallasHost`, `ExpHost` y los `lazy` del Perfil. Todo lo demás (hoja, vitrina, destinos, pasaporte, globo, marcos, EXP) se baja al abrirse.
- Marcos: 37–58 KB cada uno (solo el del rango del viajero); huecos ~1,2 KB.
- Pantallas bajo demanda (fuente, sin comprimir): vitrina y ficha ≈ 92 KB, destinos ≈ 38 KB, mundo ≈ 35 KB de código + 84 KB de costas + 17 KB de catálogo de países, Perfil ≈ 62 KB.
- La prueba sigue exigiendo que al abrir el JavaScript pese menos de 1 MB y la descarga menos de 340 KB.

## Lo que queda para la parte 3 de las cuentas
- Ajustes, Mis pases y Borrar la cuenta (P3, P4, P5): el botón de Ajustes está y no hace nada.
- Foto de perfil y nombre del viajero (hoy: la inicial «V» y «Hola, viajero»; el pie de Compartir no lleva nombre).
- Los viajes de antes de la app como viajes con fechas (hoy solo países).
- Los pines de la vitrina en las páginas de destino; que el aviso de «viaje acabado» abra el pasaporte con `pagina: 'sello:<id del viaje>'` y estampe el sello (la pantalla lo sabe hacer; falta quien lo llame).
- El enlace/código de invitación y las pantallas de la EXP para las invitaciones (de la 8C1).
- El nombre y el logo de la app (`data/marca.json`): el logo de Compartir es un hueco vacío.

## Pruebas
- **`pruebaPantallas8c`: 992 comprobaciones, 0 fallos** (cinco partes: botón/hoja/EXP/Compartir, destinos, mundo, Perfil, vitrina) + que **no haya dos capturas iguales byte a byte** (76+ capturas).
- Las de siempre, en 0: `pruebaPantallas8b` (171; actualicé tres comprobaciones que decían «la hoja no enseña emblemas», «ninguna pantalla nueva de la EXP» y el texto de los secretos, que ahora son otra cosa), `pruebaLogros1` (433), `pruebaLogros2` (54), `pruebaFase6y4_perfil` (157), `pruebaCorr6z6_perfil` (88), `pruebaFase6y4_iconos` (4.856). `tsc -p tsconfig.app.json` limpio. No he ejecutado `pruebaFase6y5_motor` (más de 9 minutos y no toca nada de esta tanda).
- Capturas en `docs/dias/capturas_8c/` (390×844, ×2), con el nombre de su pantalla en el diseño: 1a, 1a-hoy, 1b, 2a, 3a–3e, 4a, T1, T2, T2b, T3, T4, T4b, T4c, V1, V1b, V1c, V2, V2b, V3, G0, G1, G2, A, A2, M1, M2, M3, TR, J1, J2, J3 (principio, mitad, final), P1, P1b, P1-rango1…10, P1-viajes, P2 (tapa y página), P2l, P2v, P2i2, P2m, P2e (principio, mitad, final), E1–E4 (principio, mitad, final y «quieto» con reducir movimiento), C1, C2. Las saca `node scripts/destino/capturas8c.mjs <nombre…>` con un Chrome sin ventana; cada escaparate está en `src/dev/escaparates/` (solo desarrollo).
- Consola: sin errores míos en ninguna captura (solo los de siempre de Mapbox/Supabase sin claves en local, que el script ignora).

## Riesgos
- **Dos fallos de `construirVitrina`** (`vistas.js`, compartido, no lo toqué): vuelve a rellenar sola una balda que se vació a propósito y mete en la vitrina el bronce de un sello que ya es oro. La pantalla de la vitrina usa `GET /api/logros/ganados`, que lo corrige; **`GET /api/logros/vitrina` sigue con los dos fallos**. Conviene arreglarlo en `vistas.js` en su tanda.
- El Perfil depende de `catalogoDePaises`, `paisesConocidos` y `recuerdosDe` de `previos.js`: si cambian sus firmas, hay que cambiar el Perfil.
- Nada de esto está probado con Supabase real ni en un móvil real (solo con funciones puras del servidor, el modo demo y Chrome sin ventana a 390 px). Con una sesión anónima `GET /api/logros/perfil` da 403 y el Perfil se ve como el de siempre.
- Los sellos recuerdo y la regla de «no dan EXP/sorteo/logros» están probados con funciones puras, no contra una base de datos.
- Tocar un pedazo de las insignias se calcula por geometría de cada forma (`piezaDeInsignia.ts`): si cambia el dibujo de una insignia en `dibujos/Insignia.tsx`, hay que cambiarlo allí también.
- Capturas: con el Vite compartido y varias personas editando a la vez, la página se recarga a mitad; el script repite solo, pero conviene sacarlas de una en una.
- Un cambio pequeño de `servicio.estado` (campos nuevos por sitio) y la exportación de `aItems`: no cambian lo que ya existía.
