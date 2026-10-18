# Fotos de Roma en HOY v2 (Tanda 8B2)

Auditoría hecha con `node scripts/destino/auditoriaFotos.mjs roma [--servidor http://localhost:8787] [--fecha 2026-10-18] [--json]` (solo lectura: no escribe ni cambia ninguna foto). Usa las MISMAS reglas que el servidor (`/api/place-photo`): 1) foto propia de `data/dias/roma/_fotos.json` (con su ventana de fechas), 2) «sin foto», 3) la de Unsplash o Wikipedia (caché compartida), 4) la foto de otro sitio de su misma zona. Con `--servidor` pregunta al servidor (como hace la app; puede guardar en su caché lo que busque por primera vez).

## Por qué Navona salía con la foto de Trevi
No era un fallo del mapeo: **era mi dato de prueba**. Al inyectar paradas en la ruta rápida de desarrollo puse a mano `dia_fontana_de_trevi.jpg` en Piazza Navona (y en Trevi). La foto de verdad la pide `photoNameOf(stop)` → `/api/place-photo` (nombre + fecha del día). En octubre Navona recibe su foto de Unsplash de la caché (se ve la plaza con la Fuente de los Cuatro Ríos). He cambiado mi dato de prueba para que pida las fotos al servidor igual que la app (`enrichRoutePhotos`).

## Resultado (94 sitios, fecha 2026-10-18)
- 59 con foto propia, 9 Unsplash, 19 Wikipedia, 4 con la foto de otro sitio de su zona, 3 sin foto.
- **Repetidas en sitios distintos (2 casos):**
  - `dia_foros_de_trajano.jpg`: Mercados de Trajano y Columna de Trajano. Propongo una foto propia para la Columna (hoy comparte la de los Foros).
  - `dia_altar_de_la_patria.jpg` (foto de la zona): Terraza de Largo Gaetana Agnesi y Colle Oppio. Son la foto del Altar de la Patria prestada; propongo foto propia o dejarlas sin foto.
- **Con la foto de otro sitio de su zona** (la regla de la zona, 4 sitios): Terraza de Largo Gaetana Agnesi y Colle Oppio (Altar de la Patria), Mirador de San Pietro in Montorio (Mirador del Janículo), **Via del Babuino (Fontana de Trevi)**. Esta última es la más dudosa: Via del Babuino no es Trevi.

## Sospechosas
- **Piazza Navona (de día):** su única foto propia es `navidad_noche_piazza_navona_desde_arriba.jpg`, una foto de Navidad de noche, y solo vale del 1-dic al 5-ene. El resto del año recibe una de Unsplash. Propongo una foto de día propia de Navona para todo el año y dejar la de Navidad como foto de fechas.
- **Mercadillo de Navidad de Piazza Navona:** su foto propia solo vale del 1-dic al 6-ene; fuera de esas fechas la que sale es de Unsplash (cualquiera). Debería llevar `sin_foto` o no salir fuera de fechas.
- **Fotos de Navidad / de noche puestas como «de día»** (todas con ventana de fechas, salvo la última): Plaza de San Pedro y Plaza de San Pedro y los 100 Presepi (`navidad_noche_plaza_san_pedro.jpg`, 8-dic a 6-ene), Mercadillo de Navidad (`navidad_mercadillo_piazza_navona.jpg`), Luces de Navidad del Tridente (`navidad_luces_tridente.jpg`, sin ventana de fechas: sale todo el año; si el sitio solo existe en Navidad, está bien).
- **Wikipedia como último recurso puede traer fotos equivocadas.** Ejemplo visto: al pedir el Panteón con el servidor sin caché, Wikipedia devolvió `SantRomaSau_IPA-24833_0759.jpg` (una iglesia catalana). Después la caché lo tenía de Unsplash. Propongo: para los sitios nivel 1 (Panteón, Foro, etc.) escribir foto propia y no depender de la búsqueda.
- Museos Vaticanos y Capilla Sixtina sale con la foto de Wikipedia del interior de la Capilla Sixtina (`Sistina-interno.jpg`): la Capilla no deja hacer fotos; propongo una de la fachada o los patios.

## Qué NO he tocado
Ninguna foto, ni `_fotos.json`, ni `roma.json`, ni el servidor. Lo de arriba son propuestas.

---

# 8B3 (decisiones de Eric aplicadas)
Ninguna foto borrada. Cambia qué foto sale en cada sitio. Reglas en `server/index.js` (`/api/place-photo` y `/api/pool-photos`) y datos en `data/dias/roma/_fotos.json`. El motor no se ha tocado. Comprobado con peticiones reales a `localhost:8787` tras reiniciar el api-server.

| Sitio | Antes | Ahora | Cómo |
|---|---|---|---|
| **Coliseo** | su foto propia `dia_coliseo.jpg` (el servidor SÍ la daba) pero el viaje de pruebas llevaba las paradas SIN foto y nadie la pedía; en HOY salía un cuadrado de color | su foto propia | HOY v2 ahora pide la foto al servidor por el nombre cuando la parada viene sin ella (`useFotoDeParada`); `rutaDePrueba` llama a `enrichRoutePhotos` como un viaje de verdad. La «reja con árboles» de V7 era otra foto (un dato de prueba del Visto) |
| **Via del Babuino** | foto de la Fontana de Trevi (regla de la zona) | sin foto | se quita la regla de la zona (`zonePhotoFor` ya no se usa) |
| **Terraza de Largo Gaetana Agnesi** | foto del Altar de la Patria (zona) | sin foto | idem |
| **Colle Oppio** | foto del Altar de la Patria (zona) | sin foto | idem |
| **Mirador de San Pietro in Montorio** | foto del Mirador del Janículo (zona) | sin foto | idem |
| **Museos Vaticanos y Capilla Sixtina** | Wikipedia: interior de la Capilla Sixtina | sin foto | `fotos_rechazadas` (también «Museos Vaticanos», que traía el escudo en SVG) |
| **Panteón** | a veces Wikipedia (`SantRomaSau`, una iglesia catalana) | nunca Wikipedia: la de Unsplash que ya menciona el sitio, o ninguna | regla de sitios importantes |
| **Piazza Navona** (de día) | su única foto propia es de Navidad de noche (1-dic a 5-ene); fuera de ellas salía una de Unsplash | fuera de fechas, sin foto; en Navidad, la suya | `soloFotoDeFechas` |
| **Mercadillo de Navidad de Piazza Navona** | fuera de fechas, una de Unsplash | fuera de fechas, sin foto | idem |
| **Columna de Trajano** | compartía `dia_foros_de_trajano.jpg` con los Mercados | sin foto (los Mercados y los Foros se quedan con la suya) | se quita de `lugares` de esa foto y se añade a `sin_foto` |

**Reglas nuevas en el servidor:** (1) los sitios importantes = nivel 1 en el JSON del destino: nunca la foto de Wikipedia (ni la que viniera guardada en la caché); (2) un sitio cuyas fotos propias son todas de unas fechas va sin foto fuera de ellas; (3) fuera la foto de otro sitio de la zona.

## Sitios importantes (nivel 1) que NO tienen foto propia: hay que buscarlas
1. **Foro Romano y Palatino** (hoy: Unsplash que menciona el sitio)
2. **Arco de Constantino** (hoy: Unsplash)
3. **Panteón** (hoy: Unsplash)
4. **Piazza Navona** (hoy: sin foto fuera de Navidad)
5. **Museos Vaticanos y Capilla Sixtina** (hoy: sin foto)
Con foto propia: Coliseo, Fontana de Trevi, Plaza de España, Basílica de San Pedro, Plaza de San Pedro, Altar de la Patria.

## La auditoría ahora falla si algo vuelve
`node scripts/destino/auditoriaFotos.mjs roma --servidor http://localhost:8787` sale con código 1 si: un sitio importante lleva Wikipedia o foto de otro sitio; hay fotos repetidas en sitios distintos; una foto de unas fechas se sirve fuera de ellas (se prueba con 6 fechas del año, también sin servidor); o un sitio lleva la foto de otro de su zona. Resultado hoy: 0 repetidas, 0 de Navidad fuera de fechas, 0 importantes con Wikipedia. Sin `--servidor` solo comprueba lo que no depende de Unsplash o Wikipedia.

---

# 8B4 (fotos de Unsplash para elegir)
Ninguna foto puesta en la app. Página para elegir: `docs/dias/FOTOS_CANDIDATAS_8B4.html` (generada con `scripts/destino/paginaCandidatas8b4.mjs` desde `docs/dias/notas_8b/candidatas_8b4.json`, que guarda autor, enlace y licencia de cada una). Búsqueda: `scripts/destino/candidatasFotos8b4.mjs` (API de Unsplash, apaisadas, `content_filter=high`, mínimo 1.800 px de ancho).
- 3 candidatas: Foro Romano y Palatino, Arco de Constantino, Panteón, Piazza Navona (de día), Museos Vaticanos (fachada/patios), Columna de Trajano.
- Sin ninguna buena (ninguna foto nombra el sitio): Via del Babuino, Terraza de Largo Gaetana Agnesi, Colle Oppio, Mirador de San Pietro in Montorio. Quedan sin foto.
- Cuando Eric elija: bajar la `raw` de Unsplash, sacar `dia_<sitio>.jpg` (1600 px) y `dia_<sitio>_p.jpg` (640 px), añadir a `_fotos.json` con `fuente: "Unsplash"`, `autor` y `enlace`, quitar el sitio de `sin_foto` / `fotos_rechazadas` si hace falta, `node scripts/generarMiniaturas.mjs` y reiniciar el api-server. Piazza Navona: su foto de día vale todo el año; la de Navidad se queda con sus fechas.

---

# 8B5 (fotos elegidas por Eric)
Puestas como fotos propias (Unsplash, con autor, enlace y licencia en `_fotos.json`; 1600 px, tarjeta de 640 px y miniatura WebP): Foro Romano y Palatino (opción 2, Himmel S), Arco de Constantino (1, Anton Volnuhin), Panteón (1, Harold Wainwright), Piazza Navona (3, Gabriella Clare Marino; todo el año, la de Navidad sigue con sus fechas), Museos Vaticanos (2, Sui Xu; vale para «Museos Vaticanos» y «Museos Vaticanos y Capilla Sixtina») y Columna de Trajano (2, Gertrud). Script: `scripts/destino/aplicarFotosElegidas8b5.mjs`.

## Pendientes (sin foto, a propósito)
- Via del Babuino
- Terraza de Largo Gaetana Agnesi
- Colle Oppio
- Mirador de San Pietro in Montorio
