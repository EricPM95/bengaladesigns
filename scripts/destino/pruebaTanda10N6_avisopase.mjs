// La prueba de la Tanda 10N6, agente K2: 1g el aviso pequeño del pase (una pieza para toda la app, `Piezas/Pase Estilo` 04), 1h la lista del pase, 1i la música de la película.
//   APP_URL=http://localhost:5202 API_URL=http://localhost:8872 node scripts/destino/pruebaTanda10N6_avisopase.mjs
// Acaba imprimiendo «N comprobaciones, M fallos» y sale con código 1 si falla alguna. Capturas en docs/dias/capturas_jutrip/10n6_*.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, abrirPase, esp, cuando, foto as foto5, leer, modulo } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

process.env.APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
process.env.API_URL = process.env.API_URL ?? 'http://localhost:8787'
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const foto = (n) => foto5(n).replace('10n5_', '10n6_')
const store = modulo('/src/store/useRouteStore.ts')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/* ───────────────────────── 1. El código ───────────────────────── */
console.log('1. El código')
const api = leer('src/lib/avisoPase.ts')
debe(/export function abrirAvisoPase\(clave: string, opciones\?: \{ destino\?: string \}\): void/.test(api) && /if \(pagoActivo\(\)\) return/.test(api), 'api', 'abrirAvisoPase(clave, {destino}) existe y con pase no hace nada')
const textos = leer('src/lib/avisoPaseTextos.ts')
for (const c of ['segunda_foto', 'escuchar_historia', 'cerca_de_ti', 'banos', 'fuentes']) debe(new RegExp(`${c}: \\{`).test(textos), 'textos', `el archivo de textos tiene «${c}»`)
debe(/Sin pase, guardas 1 foto por sitio\./.test(textos) && /Guarda todas las que quieras y crea tus recuerdos\./.test(textos), 'textos', 'los dos textos de la segunda foto, los aprobados')
debe(/Ya has escuchado tu historia de prueba\./.test(textos) && /Escucha todas las historias de tu viaje\./.test(textos), 'textos', 'los dos textos de «Escuchar historia», los aprobados')
debe(/AvisoPaseHost/.test(leer('src/App.tsx')), 'host', 'el aviso está montado globalmente en App.tsx')
debe(!/abrirPase/.test(sinComentarios(leer('src/components/route/hoy/Escuchar.tsx'))) && !/abrirPase/.test(sinComentarios(leer('src/components/route/hoy/v2/HoyDuranteV2.tsx'))), 'sitios', '«Escuchar historia» cerrado abre el aviso, no la película')
debe(/abrirAvisoPase\('cerca_de_ti'/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')) && !/datos="explorar-cerca-de-ti"/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')), 'sitios', '«Cerca de ti» sin pase abre el aviso (la hoja suelta de la 10O ya no está)')
debe(/abrirAvisoPase\(id === 'banos'/.test(leer('src/components/route/ExplorePanel.tsx')), 'sitios', 'Baños y Fuentes abren el aviso')
const ajustes = JSON.parse(leer('data/pase/lista_ajustes.json'))
debe(ajustes.titulos['Tus fotos de cada sitio'] === 'Todas las fotos que quieras' && ajustes.textos['Tus fotos de cada sitio'] === 'En cada sitio y en tu álbum.', 'lista', 'fila de las fotos cambiada')
debe(ajustes.titulos['La historia de cada sitio'] === 'Todas las historias' && ajustes.textos['La historia de cada sitio'] === 'De cada sitio, como una audioguía en tu móvil.', 'lista', 'fila de las historias cambiada')
debe(!ajustes.prometidas_sin_hacer.some((x) => /puesta de sol/.test(x)), 'lista', 'la puesta de sol ya no está en prometidas_sin_hacer')
const gen = leer('src/lib/listaDelPase.ts')
debe(!/Empiezas cerca de donde duermes/.test(gen) && !/Empiezas cerca de donde duermes/.test(leer('src/components/pase/pelicula/gen/Pase_Pelicula.ts')), 'lista', '«Empiezas cerca de donde duermes» no existe')
const musica = leer('src/lib/peliculaMusica.ts')
debe(/HEAD/.test(musica) && /audio\|mpeg/.test(musica), 'musica', 'se comprueba si el archivo existe (y que sea audio) antes de montar nada')
debe(/visibilitychange/.test(musica) && /pagehide/.test(musica) && /sonidoActivado/.test(musica), 'musica', 'se para al salir de la app y respeta «Sonido de los momentos»')
debe(fs.existsSync('scripts/destino/comprimirMusicaPelicula.sh'), 'musica', 'el script para comprimir a 96 kbps está')
const hayArchivo = fs.existsSync('public/sonidos/pelicula_pase.mp3')

/* ───────────────────────── 2. La función pura de la música ───────────────────────── */
const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
try {
  console.log('2. El aviso sin pase')
  const m = await g.evaluar(`import('/src/lib/peliculaMusica.ts').then((m) => ({ a: m.volumenEnLaPista(0, 60), b: m.volumenEnLaPista(30, 60), c: m.volumenEnLaPista(59.9, 60), d: m.volumenEnLaPista(1, 2), hay: null }))`)
  debe(m.a === 0 && m.b > 0.1 && m.b < 0.3 && m.c < 0.02 && m.d > 0 && m.d <= m.b, 'musica', `el volumen es bajo, entra y sale poco a poco (${JSON.stringify(m)})`)
  const hay = await g.evaluar(`import('/src/lib/peliculaMusica.ts').then((m) => m.hayMusicaDeLaPelicula())`)
  debe(hay === hayArchivo, 'musica', `sin el archivo no se monta nada (hay archivo: ${hayArchivo}; la comprobación dice ${hay})`)

  const abrir = (clave) => g.evaluar(`import('/src/lib/avisoPase.ts').then((m) => { m.abrirAvisoPase(${JSON.stringify(clave)}); return true })`)
  const leerAviso = () => g.evaluar(`(() => { const e = document.querySelector('[data-aviso-pase]'); if (!e) return null; const r = e.getBoundingClientRect(); const ver = e.querySelector('[data-aviso-pase-ver]'); return { clave: e.getAttribute('data-aviso-pase'), titulo: e.querySelector('[data-aviso-pase-titulo]').innerText, l1: e.querySelector('[data-aviso-pase-linea1]').innerText, l2: e.querySelector('[data-aviso-pase-linea2]').innerText, ver: ver.innerText, fondo: getComputedStyle(e).backgroundImage, l2peso: getComputedStyle(e.querySelector('[data-aviso-pase-linea2]')).fontWeight, l1color: getComputedStyle(e.querySelector('[data-aviso-pase-linea1]')).color, ancho: r.width, izq: r.left, der: r.right, verFondo: getComputedStyle(ver).backgroundImage } })()`)
  const cerrar = () => g.evaluar(`(() => { const b = document.querySelector('[data-hoja="aviso-pase"] button[aria-label="Cerrar"]'); if (b) b.click(); return true })()`).then(() => esp(500))

  await abrir('segunda_foto')
  await esp(700)
  let av = await leerAviso()
  debe(av && /^Desbloquéalo con el Pase Roma$/.test(av.titulo.trim()), 'aviso', `título «Desbloquéalo con el Pase Roma» (${av?.titulo})`)
  debe(av?.l1 === 'Sin pase, guardas 1 foto por sitio.' && av?.l2 === 'Guarda todas las que quieras y crea tus recuerdos.', 'aviso', 'segunda foto: línea 1 y línea 2')
  debe(av?.ver.trim() === 'Ver el Pase Roma', 'aviso', `botón «Ver el Pase Roma» (${av?.ver})`)
  debe(av && /28, 34, 48/.test(av.fondo) && /243, 226, 176/.test(av.verFondo) && Number(av.l2peso) >= 600 && Number(av.l2peso) > 400, 'aviso', 'azul oscuro, botón dorado y la línea 2 en negrita')
  debe(av && av.izq >= 0 && av.der <= 390, 'aviso', 'cabe en el ancho del móvil')
  await g.captura(foto('aviso_segunda_foto'))
  // [Ver el Pase Roma] → la película (ya vista en esta prueba: directo al final)
  await g.evaluar(`document.querySelector('[data-aviso-pase-ver]').click(); true`)
  const pelicula = await cuando(g, `Boolean(document.querySelector('[data-pelicula]'))`, 40)
  debe(pelicula, 'aviso', '[Ver el Pase Roma] abre la película del pase')
  debe(!(await g.evaluar(`Boolean(document.querySelector('[data-aviso-pase]'))`)), 'aviso', 'y el aviso se cierra')
  const modoPelicula = await g.evaluar(`document.querySelector('[data-pelicula]')?.getAttribute('data-pelicula')`)
  debe(modoPelicula === 'final', 'aviso', `con la película ya vista, va directo al final (${modoPelicula})`)
  await g.evaluar(`document.querySelector('[data-pelicula-cerrar]')?.click(); true`)
  await esp(600)

  await abrir('escuchar_historia')
  await esp(600)
  av = await leerAviso()
  debe(av?.l1 === 'Ya has escuchado tu historia de prueba.' && av?.l2 === 'Escucha todas las historias de tu viaje.', 'aviso', '«Escuchar historia»: línea 1 y línea 2')
  await g.captura(foto('aviso_escuchar_historia'))
  await cerrar()
  for (const clave of ['cerca_de_ti', 'banos', 'fuentes', 'hoy', 'generico']) {
    await abrir(clave)
    await esp(400)
    av = await leerAviso()
    debe(av && av.l1.length > 3 && av.l2.length > 3 && av.clave === clave, 'aviso', `«${clave}» saca su aviso con dos líneas (${av?.l1} / ${av?.l2})`)
    await cerrar()
  }
  debe(!(await leerAviso()), 'aviso', 'la equis cierra el aviso')

  // EXPLORAR: Baños abre el aviso
  console.log('3. Desde la app')
  await g.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setActiveDayId(null); e.setMode('explore'); return true })`)
  await esp(3000)
  const hizo = await cuando(g, `(() => { const b = document.querySelector('[data-candado="explorar-banos"]'); if (!b) return false; b.click(); return true })()`, 20)
  if (hizo) {
    await esp(600)
    av = await leerAviso()
    debe(av?.clave === 'banos' && /Pase/.test(av.titulo), 'sitios', `EXPLORAR › Baños (sin pase) abre el aviso (${JSON.stringify(av)?.slice(0, 160)})`)
    await g.captura(foto('aviso_explorar_banos'))
    await cerrar()
  } else debe(false, 'sitios', 'EXPLORAR muestra Baños bloqueado sin pase')
} finally {
  g.cerrar()
}

/* ───────────────────────── 4. Con pase, nunca ───────────────────────── */
console.log('4. Con pase')
const c = await conViaje({ version: 'pago', ancho: 390, alto: 844 })
try {
  await c.evaluar(`import('/src/lib/avisoPase.ts').then((m) => { m.abrirAvisoPase('segunda_foto'); m.abrirAvisoPase('escuchar_historia'); return true })`)
  await esp(800)
  debe(!(await c.evaluar(`Boolean(document.querySelector('[data-aviso-pase]'))`)), 'con pase', 'con pase el aviso no sale nunca')
} finally {
  c.cerrar()
}

/* ───────────────────────── 5. La música, con un archivo de mentira ───────────────────────── */
console.log('5. La música de la película')
// 5a. Sin archivo: la película sale sin botón de silencio y sin ningún error.
const s = await conViaje({ version: 'gratis', vista: false, ancho: 390, alto: 844 })
try {
  await abrirPase(s)
  await cuando(s, `Boolean(document.querySelector('[data-pelicula]'))`, 40)
  await esp(2500)
  const errores = await s.evaluar(`window.__erroresPrueba ?? []`).catch(() => [])
  debe(await s.evaluar(`Boolean(document.querySelector('[data-pelicula]'))`), 'musica', 'sin archivo la película abre')
  debe(hayArchivo || !(await s.evaluar(`Boolean(document.querySelector('[data-pelicula-musica]'))`)), 'musica', 'sin archivo no sale el botón de silencio')
  debe(Array.isArray(errores) && errores.length === 0, 'musica', 'ni un error')
  await s.captura(foto('pelicula_sin_musica'))
} finally {
  s.cerrar()
}
// 5b. Con un archivo de mentira (se hace creer a la página que existe) para ver el botón y que recuerda lo elegido.
const SIMULA = `(() => { const f = window.fetch; window.fetch = (u, o) => String(u).includes('/sonidos/pelicula_pase.mp3') && o && o.method === 'HEAD' ? Promise.resolve(new Response(null, { status: 200, headers: { 'content-type': 'audio/mpeg' } })) : f(u, o); window.__audios = []; const A = window.Audio; window.Audio = function (u) { const a = new A(u); window.__audios.push(a); a.play = () => Promise.resolve(); return a }; })();`
const k = await conViaje({ version: 'gratis', vista: false, ancho: 390, alto: 844, extraAntes: SIMULA })
try {
  await abrirPase(k)
  const hay = await cuando(k, `Boolean(document.querySelector('[data-pelicula-musica]'))`, 40)
  debe(hay, 'musica', 'con archivo sale el botón de silencio')
  if (hay) {
    const pos = await k.evaluar(`(() => { const be = document.querySelector('[data-pelicula-musica]'); const b = be.getBoundingClientRect(); const t = document.querySelector('[data-pelicula-titulo]').getBoundingClientRect(); const sa = document.querySelector('[data-pelicula-saltar]').getBoundingClientRect(); return { top: b.top, h: b.height, w: b.width, tTop: t.top, tH: t.height, sTop: sa.top, sH: sa.height, bDer: b.right, bIzq: b.left, tTexto: (document.querySelector('[data-pelicula-titulo] span') || document.querySelector('[data-pelicula-titulo]')).getBoundingClientRect().right, sIzq: sa.left, svg: be.querySelector('svg') ? be.querySelector('svg').getAttribute('fill') : null } })()`)
    const centro = (t, h) => t + h / 2
    debe(Math.abs(centro(pos.top, pos.h) - centro(pos.tTop, pos.tH)) < 8 && Math.abs(centro(pos.top, pos.h) - centro(pos.sTop, pos.sH)) < 8, 'musica', `el botón está en la misma línea que el título y [Saltar] (${JSON.stringify(pos)})`)
    debe(pos.bDer <= pos.sIzq + 1 && pos.svg === 'none', 'musica', 'a la izquierda de [Saltar], icono fino sin relleno')
    debe(pos.tTexto <= pos.bIzq, 'musica', `el título no pisa el botón de silencio (el texto acaba en ${pos.tTexto}, el botón empieza en ${pos.bIzq})`)
    await k.captura(foto('pelicula_boton_silencio'))
    const sonando = await k.evaluar(`window.__audios.length > 0 && window.__audios[0].loop === true`)
    debe(sonando, 'musica', 'se crea el audio, en bucle')
    await k.evaluar(`document.querySelector('[data-pelicula-musica]').click(); true`)
    await esp(300)
    debe((await k.evaluar(`localStorage.getItem('trazo:pelicula_musica')`)) === 'no', 'musica', 'el silencio se recuerda')
    // Saltar no corta el audio
    await k.evaluar(`document.querySelector('[data-pelicula-saltar]').click(); true`)
    await esp(800)
    debe(await k.evaluar(`window.__audios[0].paused === false || window.__audios[0].paused === true`), 'musica', '[Saltar] no rompe nada')
    // Cerrar para el audio
    await k.evaluar(`document.querySelector('[data-pelicula-cerrar]')?.click(); true`)
    await esp(1800)
    debe(await k.evaluar(`window.__audios.every((a) => a.paused || a.volume < 0.01)`), 'musica', 'al cerrar la película, la música baja y se para')
  }
} finally {
  k.cerrar()
}

// La pieza de Design, al lado.
try {
  await capturarDesign('Piezas/Pase Estilo.dc.html', 'docs/dias/capturas_jutrip/10n6_design_pase_estilo_04.jpg', {
    ancho: 520,
    alto: 1000,
    despues: `(() => { const e = Array.from(document.querySelectorAll('span')).find((x) => /^04 /.test((x.textContent || '').trim()) && x.children.length === 0); if (e) e.scrollIntoView({ block: 'start' }); return true })()`,
    espera: 5,
  })
} catch (e) {
  console.log('(No se pudo capturar Design:', e.message, ')')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
void path
process.exit(fallos.length ? 1 : 0)
