
## Formato de puntos_de_foto (agente de la regla de la foto, V78)
Un campo NUEVO por sitio, en `data/logros/<destino>.json`, dentro de `destinos.<destino>.sitios.<id_del_sitio>` (junto a `radio_m`, `pais`…). Es una lista; cada punto:

```json
"puntos_de_foto": [
  {
    "nombre": "Via dei Fori Imperiali, mirando al Coliseo",
    "lat": 41.8923,
    "lng": 12.4900,
    "radio_m": 100,
    "fuente": "https://… (donde se ve que la gente hace esa foto)"
  }
]
```
- `nombre` (texto, obligatorio): como se llama el sitio desde donde se ve (en español).
- `lat`, `lng` (números, obligatorios): el centro del punto, en grados decimales (WGS84, como el catálogo).
- `radio_m` (número, obligatorio): entre 50 y 150 m. Sin radio, el servidor usa 100.
- `fuente` (texto, obligatorio): la URL o la referencia que lo avala (web de fotografía, guía oficial…). `validarDatos` avisa de un punto sin fuente o con radio fuera de 50-150.
- El sitio dueño del punto es el `id` bajo el que cuelga (el mismo id que en `sitios`, `colecciones` y `emblemas`). Un sitio puede tener varios puntos; un mismo lugar no debería repetirse en dos sitios.
- Los puntos NO se usan para «has llegado», ni para la hoja del emblema, ni para «Algo brilla» (eso sigue con `radio_m` del sitio, `sitiosCerca`): solo para decidir qué sitio cuenta una FOTO (`sitiosQueCuentaUnaFoto`, `server/logros/cerca.js`).
- En esta tanda NO se meten en los datos reales (Eric los aprueba antes en `PUNTOS_DE_FOTO_PROPUESTOS.md`); el código se prueba con 2 puntos de ejemplo dentro de `pruebaV78.mjs`.

## La regla de la foto (cámara y galería): lo que se ha decidido al hacerla (agente de la regla de la foto, V78)
Código: `server/logros/cerca.js › sitiosQueCuentaUnaFoto` (una función pura) y `server/logros/servicio.js › fotoLibre` (la usan la foto de la cámara y la de la galería sin parada). `sitioDeFotoLibre` y `sitiosDeFotoLibre` (las dos reglas viejas) siguen exportadas y sin cambios, solo para las pruebas viejas; el servicio ya no las usa.
1. **«Posible» = el sitio tiene el punto de la foto dentro de su radio normal O dentro de uno de sus `puntos_de_foto`.** La parada de HOY solo gana (regla 1) si es «posible». Consecuencia: **mientras no haya punto de foto aprobado, en el final de Via dei Fori (313 m del Coliseo, radio 250 m) el Coliseo NO está a la vista y la foto sigue yendo al Foro** aunque el Coliseo sea la parada. Se arregla en cuanto Eric apruebe el punto «Via dei Fori Imperiali» del Coliseo y se meta en los datos (ver `docs/dias/V78_capturas/via_dei_fori_antes_despues.txt`). **Propuesta (no hecha, a decidir por Eric):** que la parada de HOY también valga si la foto está a menos de ~150 m del borde de su radio; es más ancho que lo que pide el prompt y puede dar medallas a quien pasa de largo, por eso no lo he puesto.
2. **En un punto de foto, solo cuenta el sitio (o sitios) de ESE punto**, aunque el viajero esté también dentro del radio de otro sitio (el Foro). Con la parada de HOY entre los posibles (por radio o por punto), la parada manda primero.
3. **«Algo por ganar» = un emblema de sitio o un pedazo de colección sin ganar** (lo que ya miraba la cámara). Un sitio sin nada de eso no cuenta. **Riesgo asumido (ver informe):** la galería antes guardaba un hecho aunque el sitio ya estuviera ganado, y ese hecho podía dar los emblemas de momento (Madrugador, Nocturno, Atardecer) con otra hora; ahora una foto en un sitio ya ganado no guarda hecho. La cámara ya funcionaba así.
4. **La parada de ahora = la primera parada de hoy que no está hecha ni saltada** (sin pausas ni «de camino»), `paradaDeAhora()` en `src/lib/camaraViaje.ts` (la misma que ya usaba `paradaDeLaFoto` como respaldo). Viaja dentro del mismo POST de la foto (`parada_hoy: { stop_id, nombre }`): cero peticiones nuevas a Supabase. El servidor la busca en los días del viaje y **solo la usa si la foto es del mismo día de esa parada** (la foto de la galería de otro día no tiene parada). Si no la encuentra por id, la busca por nombre y solo vale si la foto es de hoy.
5. **Cámara y galería:** la ubicación se mira al hacer la foto (la cámara la pide al mandarla, no al abrir; la galería usa la de la foto). «Reclamar con tus fotos» también manda la parada de ahora (`paradaDeAhoraDeLaRuta`).
6. **Sin nada que ganar:** `sin_logro_aqui` (la foto es válida, va al álbum, no se guarda hecho, ningún aviso). Nuevo campo `ya_ganado: true` cuando estaba en un sitio con logro pero ya lo tenía todo; solo cambia el texto del resumen de «Reclamar con tus fotos» («de este sitio ya tienes todo lo que se podía ganar» en vez de «no está en ningún sitio con logro»).
7. **El radio de «has llegado», el Visto y las fotos con parada explícita (la hoja del emblema, [Hacer foto] de una parada) no cambian** (`sitiosCerca`, `queEnsenar` y `visto` no leen los puntos de foto; una prueba lo vigila).
8. **Hallazgo previo (no es de esta tanda):** `validarDatos` ya daba un error antes de tocar nada: `lanzarote/haria_y_la_casa_museo_cesar_manrique` «no existe en los datos del destino» (el sitio que la V67 separó en dos). Y `pruebaV35A_logros` falla en 2 comprobaciones porque espera Lanzarote «oculto» y la V77 lo hizo visible. No los he tocado.
9. **Riesgo 2 (hechos de «momentos»: Madrugador, Nocturno, Atardecer) — propuesta:** como «algo por ganar» solo mira emblemas de sitio y pedazos, una foto (sobre todo de la galería) en un sitio ya ganado ya no guarda hecho y puede perder un emblema de momento que otra hora habría dado. Propuesta: añadir a `porGanarEn` una comprobación barata de momentos (si el destino tiene `momentos` o es de los imprescindibles, y el momento de la hora de la foto —`momentoDeLaHora` / `momentosDeLaFoto`— aún no está ganado, cuenta como «algo por ganar»). No se ha hecho porque cambia lo que pide el prompt («sin nada que ganar → al álbum») y necesita decidir con Eric; hoy la cámara ya funcionaba así.
10. **`validarDatos` y la parada vieja de Haría:** excepción explícita y documentada (`PARADAS_ANTIGUAS_CONSERVADAS` en `server/logros/datos.js`: solo `lanzarote/haria_y_la_casa_museo_cesar_manrique`, y solo si sigue en `sitios_de_parada`): sale como aviso, cualquier otro id que falte sigue siendo error.
