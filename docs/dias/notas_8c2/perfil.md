# Perfil con marco de rango, marcos, Mis viajes → un viaje y la EXP a la vista (8C2)

## Qué he hecho y dónde está
- **El Perfil (P1) con logros encendidos** (`PerfilSheet.tsx` + `pantallas/perfil/CuerpoConLogros.tsx`, que se baja solo entonces): marco de rango con la inicial dentro, «Hola, viajero», «Nivel 8 · Explorador», título que se elige tocándolo (P1b, `ElegirTitulo.tsx`), barra de EXP (`NivelYBarra.tsx`), Mi vitrina (resumen con sus 3 últimas piezas y acceso `abrir({t:'todos', pestana:'vitrina'})`), Mi pasaporte («N países · N sellos», `abrir({t:'pasaporte'})`), el mapa de siempre, Mis viajes agrupados (En curso, Próximo, Ya hechos, y una tarjeta «Viaje de antes de usar la app» con los países marcados) y «Añadir un viaje que ya hiciste» (`abrir({t:'previos'})`).
- **Con los logros apagados el Perfil es el de hoy**: el cuerpo de siempre quedó en `cuerpoDeSiempre` (misma estructura) y «Hola, viajero» pasó a `perfil/CabeceraDeSiempre.tsx` (mismo marcado). También se ve mientras llegan los datos o si el servidor no contesta (sin cuenta real, el servidor da 403 a las sesiones anónimas).
- **Los 10 marcos** (`MarcoDeRango.tsx`): imágenes WebP en `public/marcos/` hechas por `scripts/destino/marcos8c.mjs` (reproducible; baja calidad/ancho hasta ≤ 58 KB). Cada uno con su hueco (`hueco-N.webp`, ~1,2 KB) que recorta la foto. `loading="lazy"`; ninguno entra en el paquete. Estrellas del nivel (1–5) y «★N» de Leyenda como en Marco Estatus.
- **EXP a la vista** (solo presentación): `ExpGanada` (E1/E2), `SubeDeNivel` (E3), `CambioDeRango` (E4). Exportados en `pantallas/perfil/index.ts`. Props (todas con `antes`/`despues` = `ResumenDeExp`, lo que manda el servidor en `exp` del Visto/foto):
  - `ExpGanada { ganada, antes, despues, onFin?, inicial? }` — dura 4 s (`DURACION_EXP_GANADA`), se pasa tocando; con «reducir movimiento» sale puesta y se va a los 3 s. Va a 170 px del borde de abajo, por encima del botón flotante y de la barra; no toca [Seguir].
  - `SubeDeNivel { antes, despues, onFin?, inicial? }` y `CambioDeRango { antes, despues, onFin?, inicial? }` — pantalla completa, esperan el toque («Toca para seguir»).
  - `onFin` se llama una sola vez. En el resumen del día no meto EXP.
- **Mis viajes → un viaje (TR)** (`ViajeGuardado.tsx`): portada (primera foto o el degradado de Design), «Sus días», «Sus fotos» (cuadrícula, tocar abre en grande), «Lo que ganaste en este viaje» (`piezasDelViaje.ts`, pura) y [Ver todo Roma]. Lo ganado sale de `GET /api/logros/resumen?trip_id=` (no hizo falta ruta nueva).
- **Servidor**: `GET /api/logros/perfil` (`server/logros/pantallas/perfil.js`): EXP (+`maximo`), título y títulos elegibles (escalón más alto ganado y visible de cada logro), resumen de la vitrina, números del pasaporte y países de antes. Elegir título reutiliza `PUT /api/logros/vitrina {titulo}`.
- **Demo**: `src/lib/logrosDemo_perfil.ts` (perfil, exp, título, resumen de un viaje solo para los ids que marca el escaparate). Los números salen de `server/logros/exp.js` y `data/logros/exp.json`.
- **Escaparate** `src/dev/escaparates/perfil.ts`: P1, P1-rango1…10, P1-viajes (extra: el Perfil desplazado a Mis viajes), P1b, TR, E1, E2, E3, E4 y E1/E3/E4-quieto (reducir movimiento). Monta `PerfilSheet` aparte con viajes guardados de mentira (fechas relativas a hoy).

## Lo que no ha quedado igual que el diseño
- **La vista de los 10 marcos** (Dashboard › Marcos, Experiencia › modo marcos) es documentación de Design: no la he puesto en la app. Los 10 marcos se ven en las capturas P1-rango1…10.
- **Mis viajes**: mantengo las filas de siempre (bandera, fechas, fotos, «Abrir este viaje»), no las tarjetas grandes con foto de Design: las pruebas viejas y las fotos por viaje dependen de ellas. Se agrupan con los encabezados del diseño. Los «viajes de antes de la app» solo se guardan como países (no como viajes con fechas): una sola tarjeta con el número de países.
- **Foto del perfil**: no existe ese sistema; va la inicial «V» (la de siempre).
- **Ajustes**: el botón está donde va y no hace nada (P3–P5 no van en esta tanda).
- **Pasaporte**: uso la tarjeta compacta de «Mi Vitrina» (N países · N sellos), no la grande del Perfil.dc con ciudades y días. «Sellos» = una por ciudad con sello ganado + una «recuerdo» por país de antes de la app aún no visitado.
- En «Elige tu título» la segunda línea es solo el grupo («El mundo»), sin la cifra del diseño («10 países»).
- La animación de E3/E4 es de una pasada (Design la repite en bucle).

## Textos que he puesto yo
- `CuerpoConLogros.tsx`: «Tu primer logro irá aquí» (vitrina sin piezas), «Elige tu título» (chip sin título; es el título de la hoja del diseño), «Antes de la app» (encabezado del grupo), «Aún no tienes viajes guardados en este dispositivo.» (el de siempre), «Ajustes» (aria-label).
- `NivelYBarra.tsx`: «Te faltan N EXP para la siguiente estrella» (en el último nivel).
- `api.ts`: nombres de los grupos (El mundo, El tiempo, Cómo viajas, Coleccionista, Exclusivos) y las líneas de cada rango: son de Design (Dashboard).
- `ViajeGuardado.tsx`: «Ver todo {destino}» (de Design con el destino real).
- `MarcoDeRango.tsx`: aria-label «Marco {rango}, nivel N de 5».

## Peso de los marcos (antes → después)
| Marco | PNG | WebP |
|---|---|---|
| 1 | 689 KB | 37,4 KB |
| 2 | 767 KB | 38,3 KB |
| 3 | 812 KB | 46,8 KB |
| 4 | 811 KB | 50,1 KB |
| 5 | 981 KB | 56,3 KB |
| 6 | 1138 KB | 57,7 KB |
| 7 | 1183 KB | 57,3 KB |
| 8 | 1241 KB | 57,6 KB |
| 9 | 1267 KB | 55,1 KB |
| 10 | 1073 KB | 57,1 KB |

Total 9,7 MB → 0,5 MB (más 12 KB de huecos). Al abrir el Perfil solo se baja el marco del rango del viajero (≤ 58 KB).
Código nuevo (sin contar imágenes): ~62 KB de fuente en archivos propios; todo en trozos perezosos (el Perfil con logros y las pantallas de EXP); lo único que crece en el paquete inicial es `PerfilSheet` (un `lazy`, `Suspense` y `CabeceraDeSiempre`, unas líneas).

## Prueba y capturas
- `scripts/destino/pruebas8c/perfil.mjs` (pesos de los 10 marcos entre 30 y 80 KB, carga perezosa, apagado = de siempre, reglas, y la lógica pura del servidor sobre los datos de verdad). Las pruebas viejas del Perfil (`pruebaFase6y4_perfil.mjs`, `pruebaCorr6z6_perfil.mjs`) se ejecutan aparte.
- Capturas en `docs/dias/capturas_8c/`: P1, P1b, P1-viajes, TR, P1-rango1…10, E1/E2/E3/E4 (principio, mitad, final) y E1/E3/E4-quieto. Sin errores de consola.

## Riesgos y lo que queda
- Con una sesión anónima (sin cuenta) `/api/logros/perfil` da 403: se ve el Perfil de siempre.
- Al llegar los datos el cuerpo se vuelve a montar (el mapa se recrea una vez).
- Si dos pestañas de un escaparate de captura coinciden en nombre con otro ayudante, avisarme.
- La orquestación de cuándo salen E1–E4 es tuya (ExpHost).
