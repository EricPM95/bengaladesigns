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
