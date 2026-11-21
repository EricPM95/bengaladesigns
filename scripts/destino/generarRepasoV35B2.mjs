// REPASO de la Tanda V35B2 (mejora del estudio de sonidos): lo hecho, capturas y la lista de comprobación.
//   node scripts/destino/generarRepasoV35B2.mjs
import fs from 'node:fs'
const D = 'docs/dias/V35B2_capturas'
const imgs = fs.existsSync(D) ? fs.readdirSync(D).filter((f) => /\.(jpg|png)$/.test(f)).sort() : []
const li = (x) => `<ul>${x.map((i) => `<li>${i}</li>`).join('')}</ul>`
const lista = [
  'Cada sonido de Code (golpe, redoble…) se puede MOVER como los tuyos: barra de ms de −duración a +duración (de 10 en 10, con −100 / −10 / 0 / +10 / +100), «Empieza: donde está ahora (por defecto) / al empezar la animación / en el golpe» y [Volver a su sitio]. Si cae antes del primer fotograma, la animación espera y no se recorta.',
  '[+ Añadir un sonido de Code]: lista con todos los candidatos de todas las animaciones, con buscador y ▶ para oírlos; el elegido se suma como una capa con su volumen, su barra de ms, su «Empieza…» y [Quitar].',
  'La línea de tiempo enseña cada capa en su fila y en su sitio, y los trozos se ARRASTRAN con el dedo o el ratón (de 10 en 10 ms).',
  '«Lo elegido» dice dónde está cada sonido («golpe: candidato B · movido −300 ms · 80 %», «añadido: Emblema secreto · golpe del emblema · C · desde el principio +1200 ms · 60 %»).',
  '[Guardar] por animación en este navegador (IndexedDB, nunca en un servidor), con los archivos de Eric ENTEROS: «Guardado ✓ · 00:25». Al abrir la página otra vez, cada animación sale como se guardó.',
  '«Sin guardar» en la tarjeta (la abierta y la de la lista) y el aviso del navegador al salir si hay cambios.',
  '[Eliminar lo guardado] con confirmación («¿Borrar lo guardado de Medalla de bronce?»): vuelve a lo de Code.',
  'Arriba: [Descargar todo lo guardado] (sonidos_jutrip.zip con LO_ELEGIDO.txt, los archivos con el nombre de su animación y estudio.json con los datos exactos) y [Cargar un zip] (lo deja igual que estaba).',
  'Si el navegador no deja guardar (modo privado), lo dice claro.',
  'scripts/sonidos/aplicarEstudio.mjs: el lector del zip para la tanda siguiente. Por defecto en SECO (valida todo y enseña exactamente lo que suena); con --escribir copia los archivos y escribe data/sonidos/estudio.json. Probado con zips de ejemplo (pruebaV35B2_zip, 100 comprobaciones) y con un zip hecho por el propio estudio.',
  'Pruebas: pruebaV35B2 (57) y pruebaV35B2_zip (100) en 0; pruebaV34C, pruebaV35A2 y pruebaV35B en 0.',
  'Solo se ha tocado el estudio (AdminSonidos.tsx, estudio.ts, el motor y el visor del estudio) y lo nuevo (zip.ts, estudioGuardado.ts, aplicarEstudio.mjs). Ningún sonido de la app cambia.',
]
const arrastrar = ['Arrastrar con el DEDO en el móvil no se ha probado en un móvil de verdad (la prueba arrastra con el ratón); el trozo usa eventos de puntero con touch-action: none, así que debería valer.']
const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REPASO V35B2 · estudio de sonidos</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1C2230}img{max-width:100%;border:1px solid #ddd;border-radius:8px}figure{margin:12px 0}figcaption{font-size:12px;color:#667}</style>
<h1>V35B2 · Estudio de sonidos: mover, añadir, guardar y zip</h1>
<h2>Lista de comprobación de esta tanda</h2>${li(lista)}
<h2>Lo que no se pudo verificar</h2>${li(arrastrar)}
<h2>Capturas</h2>${imgs.map((f) => `<figure><img src="V35B2_capturas/${f}" alt="${f}"><figcaption>${f}</figcaption></figure>`).join('')}
</html>`
fs.writeFileSync('docs/dias/REPASO_V35B2.html', html)
console.log(`REPASO_V35B2.html escrito (${imgs.length} capturas)`)
