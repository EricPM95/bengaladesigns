// REPASO de la Tanda V36B (editar cada sonido en el estudio): lo hecho, capturas y la lista de comprobación.
//   node scripts/destino/generarRepasoV36B.mjs
import fs from 'node:fs'
const D = 'docs/dias/V36B_capturas'
const imgs = fs.existsSync(D) ? fs.readdirSync(D).filter((f) => /\.(jpg|png)$/.test(f)).sort() : []
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const lista = [
  '[Editar] en cada capa (tuya o de Code añadida) y en cada sonido de Code grabado: abre el editor debajo, en 4 pasos numerados: 1 · atajos de un toque, 2 · recortar con dos asas sobre la onda (con el tiempo a la vista «0,12 s – 2,40 s»), 3 · suavizar y retocar, 4 · para el móvil.',
  '<b>Atajos para ir rápido:</b> «Quitar el silencio» (recorta los lados), «Suavizar el final» (fundido de salida de 300 ms), «Para el altavoz del móvil» (quita graves e iguala volumen) y «Más premio» (un poco de eco y de brillo).',
  'Recortar (inicio y fin); fundido de entrada y de salida de 0 a 2000 ms con la curva dibujada sobre la onda; tono; quitar graves (filtro de 150 Hz); brillo de −6 a +6 dB; eco suave de 0 a 30 %; igualar volumen; [Deshacer] y [Volver al original].',
  '<b>Tono:</b> no se puede cambiar el tono sin cambiar la duración con un proceso limpio y sencillo en el navegador (haría falta un vocoder de fase, que suena «a robot» en sonidos cortos). Se hace como VELOCIDAD, de −6 a +6 semitonos: más agudo = más rápido y más corto (+6 semitonos ≈ 29 % más corto). Así el bronce, la plata, el oro y el diamante pueden ser el mismo sonido, cada vez un poco más agudo, pero cada uno dura un poco menos. Lo dice el propio editor.',
  '<b>Igualar volumen:</b> pone el pico a −1 dB (normalización de pico). Se eligió porque es exacta y repetible en el navegador; la sonoridad en LUFS necesita un filtro de ponderación y una ventana de 400 ms que un «pop» de 1 s no llena bien.',
  'El original no se toca nunca: los retoques se aplican encima y se pueden quitar. «Repetir al cambiar» (casilla, se acuerda) repite la animación sola con cada cambio.',
  'Un sonido de Code retocado sigue cayendo en su sitio (el golpe se recalcula tras recortar o cambiar la velocidad). Los sonidos de Code hechos por código (tic, toque, campanita…) no se pueden editar (no son archivos).',
  '<b>El zip:</b> cada sonido editado va ya HECHO como `.wav` final (procesado con OfflineAudioContext, 16 bits), con su original aparte (`medalla_bronce_1_original.wav`) y, en `estudio.json`, los retoques, el número de muestras, la tasa y el pico. [Guardar] y [Cargar un zip] conservan los retoques.',
  '<b>aplicarEstudio.mjs:</b> usa el `.wav` final, comprueba que dura y suena igual (mismas muestras, misma tasa, pico dentro de 0,01) y NO vuelve a aplicar los retoques. Con `--escribir` lo copia y, si hay ffmpeg, lo convierte a .m4a comprobando la duración. 208 comprobaciones.',
  '«Lo elegido» y LO_ELEGIDO.txt dicen lo retocado en palabras («retocado: recortado 0,30 s – final · fundido de salida 300 ms · sin graves · igualado a −1 dB de pico»).',
  'Pruebas: pruebaV36B (41, medidas reales de audio en el navegador) y pruebaV35B2_zip (208) en 0; pruebaV35B2, pruebaV36 (cliente y servidor), pruebaV34C, pruebaV35A2 y las demás en 0.',
  'Solo se ha tocado el estudio (AdminSonidos.tsx, EditorDeSonido.tsx, estudio.ts, editar.ts, el motor del estudio) y aplicarEstudio.mjs. Ningún sonido de la app cambia.',
]
const nota = [
  'Las muestras del estudio van a la tasa del navegador (44,1 o 48 kHz): el navegador remuestrea los archivos al abrirlos, y el `.wav` final sale a esa tasa (`estudio.json` la lleva).',
  'El audio real en un iPhone no se ha oído: la prueba mide las muestras (recorte exacto, silencio al final, energía por debajo de 150 Hz, picos igualados, `.wav` idéntico al estudio).',
]
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V36B · editar sonidos</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:100%;border:1px solid #ddd;border-radius:8px}figure{margin:12px 0}figcaption{font-size:12px;color:#667}code{background:#f3ecd9;padding:1px 4px;border-radius:4px}</style>
<h1>V36B · Editar cada sonido en el estudio</h1>
<h2>Lista de comprobación de esta tanda</h2>${li(lista)}
<h2>Lo que conviene saber</h2>${li(nota)}
<h2>Capturas</h2>${imgs.map((f) => `<figure><img src="V36B_capturas/${f}" alt="${f}"><figcaption>${f}</figcaption></figure>`).join('')}
</html>`
fs.writeFileSync('docs/dias/REPASO_V36B.html', html)
console.log(`REPASO_V36B.html escrito (${imgs.length} capturas)`)
