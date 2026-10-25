// Genera docs/dias/REPASO_10O.html: para que Eric repase la Tanda 10O (EXPLORAR) en su teléfono. Las capturas salen de pruebaTanda10O_datos.mjs (docs/dias/capturas_jutrip/10o_*.jpg) y las listas, del servidor.
//   API_URL=http://localhost:8787 node scripts/destino/repaso10O.mjs
import fs from 'node:fs'
import { cargarCatalogo, listas } from './listaExplorar10O.mjs'

const { lugares, miradores, todo, ocultos, freeTour } = listas(await cargarCatalogo(process.env.API_URL ?? 'http://localhost:8787'))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const fila = (p, i) => `<tr><td>${i + 1}</td><td>${p.likes_initial ?? 0}</td><td>${esc(p.name)}${p.al_final_de_lista ? ' <em>(al final)</em>' : ''}</td></tr>`
const tabla = (titulo, lista) => `<h2>${titulo} (${lista.length})</h2><table><tr><th>Puesto</th><th>Me gusta</th><th>Sitio</th></tr>${lista.map(fila).join('')}</table>`
const CAPTURAS = [
  ['10o_explorar_tarjetas.jpg', 'EXPLORAR: la tarjeta Hoteles (con foto) va antes de Baños y Fuentes. Los contadores ya no cuentan lo que está fuera de la lista (81 lugares, 6 miradores).'],
  ['10o_hoteles_alojamientos.jpg', 'Tocar Hoteles abre la pantalla de alojamientos de Roma (la misma del botón de los filtros).'],
  ['10o_pestanas_sin_pase.jpg', 'Sin pase: las dos pestañas debajo de «Buscar en Roma…», con el candado dorado pequeño junto a «Cerca de ti». Ya no hay tarjeta cerrada en medio de la lista.'],
  ['10o_hoja_cerca_de_ti.jpg', 'Sin pase, tocar «Cerca de ti» abre esta hoja (tirador, ✕, «Pase de Roma» en oro y [Ver el Pase de Roma]).'],
  ['10o_pestanas_con_pase.jpg', 'Con pase: las mismas dos pestañas, sin candado; «Cerca de ti» ordena por cercanía.'],
  ['10o_miradores.jpg', 'Miradores: la Terraza del Altar de la Patria, justo detrás de la Cúpula de San Pedro.'],
  ['10o_ficha_terraza.jpg', 'La ficha de la Terraza del Altar de la Patria, con su horario (09:30–19:30, última subida a las 19:00) y [+ Añadir].'],
  ['10o_entradas_castillo.jpg', 'Entradas: el Castillo de Sant’Angelo, ahora con la foto de fuera y el puente delante.'],
  ['10o_excursiones.jpg', 'Excursiones: cada una con su foto, su nombre, la duración y el precio «desde».'],
  ['10o_anadir_cierra.jpg', 'Añadir un sitio: ya no se pide la hora. Si ese día cierra, la hoja lo dice y propone el siguiente día en que abre; los días van como «Sáb 17 Oct · Vaticano y Trastevere».'],
]
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repaso 10O · EXPLORAR</title>
<style>
:root{--bg:#FBF6EC;--tx:#1C2230;--oro:#6F4E37}
@media (prefers-color-scheme:dark){:root{--bg:#1C2230;--tx:#FFFDF8;--oro:#E9C77A}}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,sans-serif;max-width:560px;margin-inline:auto}
h1{font:400 30px/1.1 Georgia,serif}h2{font:400 22px/1.2 Georgia,serif;margin-top:28px;color:var(--oro)}
figure{margin:18px 0}img{width:100%;max-width:390px;border-radius:16px;border:1px solid rgba(128,128,128,.3);display:block}
figcaption{font-size:13.5px;opacity:.8;margin-top:6px}
table{border-collapse:collapse;width:100%;font-size:13.5px}td,th{padding:3px 6px;border-bottom:1px solid rgba(128,128,128,.2);text-align:left}
em{opacity:.6}
</style></head><body>
<h1>Repaso de la Tanda 10O</h1>
<p>EXPLORAR. Capturas a tamaño de móvil y las listas completas, con su puesto, para revisar.</p>
<p><strong>Free Tour por Roma</strong>: ${freeTour?.likes_initial} «me gusta» de partida (sale el primero).</p>
${CAPTURAS.map(([f, t]) => `<figure><img src="capturas_jutrip/${f}" alt=""><figcaption>${esc(t)}</figcaption></figure>`).join('')}
${tabla('Lugares', lugares)}
${tabla('Miradores', miradores)}
${tabla('Todo junto (sin filtros: Lugares y Miradores)', todo)}
<h2>Fuera de la lista (${ocultos.length})</h2><p>${ocultos.map(esc).join('; ')}</p>
</body></html>`
fs.writeFileSync('docs/dias/REPASO_10O.html', html)
console.log('docs/dias/REPASO_10O.html')
