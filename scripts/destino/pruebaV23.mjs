// La prueba de la Tanda V23: ARREGLOS SUELTOS (crear un viaje, la foto de Lanzarote y la pestaña Entradas).
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV23.mjs     (Vite en 5173 y la API en 8787)
//  1. Crear un viaje: la tarjeta siempre a la vista (20 veces ORIGEN, 20 DESTINO, alternando), sin «Autorrellenar contacto»   2. Portadas de los destinos
//  3. La pestaña Entradas (partes añadidas más abajo)
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V23_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. Crear un viaje ───────── */
console.log('1. Crear un viaje: la tarjeta a la vista')
{
  const f = leer('src/components/trazo/PrimeraPantalla.tsx')
  debe(/visualViewport\?\.offsetTop/.test(f) && /\$\{desplazo\}px/.test(f), 'offsetTop', 'la tarjeta se coloca con lo que el iPhone ha desplazado (visualViewport.offsetTop)')
  debe(/window\.scrollTo\(0, 0\)/.test(f) && /addEventListener\('scroll', sujetar/.test(f), 'sujetar', 'la página se sujeta arriba mientras se escribe')
  const app = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=0', ancho: 375, alto: 512 })
  try {
    for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-campo-origen]'))").catch(() => false)); i++) await app.esp(500)
    await app.esp(1500)
    const attrs = await app.evaluar(`['[data-campo-origen]','[data-campo-destino]'].map((s) => { const e = document.querySelector(s); return { ac: e.getAttribute('autocomplete'), name: e.getAttribute('name'), corr: e.getAttribute('autocorrect'), cap: e.getAttribute('autocapitalize'), ent: e.getAttribute('enterkeyhint'), tipo: e.type } })`)
    debe(attrs.every((a) => a.ac === 'off' && a.corr === 'off' && a.cap === 'off' && a.ent === 'search' && /^trazo-/.test(a.name ?? '') && a.tipo === 'text'), 'autorrellenar', 'los dos campos dicen al iPhone que no son una dirección (autocomplete=off, nombre propio, sin autocorrección)')
    const vista = (sel) => app.evaluar(`(() => { const e = document.querySelector('[data-tarjeta-origen-destino]'); if (!e) return null; const r = e.getBoundingClientRect(); const c = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); const v = window.visualViewport; return { top: Math.round(r.top), bottom: Math.round(r.bottom), campoT: Math.round(c.top), campoB: Math.round(c.bottom), alto: Math.round(v.height), off: Math.round(v.offsetTop), foco: document.activeElement === document.querySelector(${JSON.stringify(sel)}) } })()`)
    let malas = []
    for (let i = 0; i < 20; i++) {
      const [sel, otro] = i % 2 === 0 ? ['[data-campo-origen]', '[data-campo-destino]'] : ['[data-campo-destino]', '[data-campo-origen]']
      // el iPhone desplaza la página al sacar el teclado: se intenta y la app la devuelve
      await app.evaluar(`document.querySelector(${JSON.stringify(sel)}).focus(); window.scrollTo(0, 140); true`)
      await app.esp(450)
      const v = await vista(sel)
      if (!v || !v.foco || v.top < 0 || v.campoT < 0 || v.campoB > v.alto || v.top > 40) malas.push({ i, v })
      await app.evaluar(`document.querySelector(${JSON.stringify(sel)}).blur(); true`)
      await app.esp(450)
      if (i === 0) await app.captura(`${CAP}/ciudad_teclado_origen.jpg`)
      if (i === 1) await app.captura(`${CAP}/ciudad_teclado_destino.jpg`)
    }
    debe(malas.length === 0, 'a-la-vista', `las 20 veces (10 ORIGEN, 10 DESTINO, una tras otra) la tarjeta y el campo se ven, arriba${malas.length ? ' · fallan: ' + JSON.stringify(malas.slice(0, 2)) : ''}`)
    // uno detrás de otro, sin cerrar entre medias
    let encadenadas = 0
    for (let i = 0; i < 10; i++) {
      const sel = i % 2 === 0 ? '[data-campo-origen]' : '[data-campo-destino]'
      await app.evaluar(`document.querySelector(${JSON.stringify(sel)}).focus(); true`)
      await app.esp(400)
      const v = await vista(sel)
      if (v && v.foco && v.top >= 0 && v.campoB <= v.alto) encadenadas++
    }
    debe(encadenadas === 10, 'encadenadas', `tocando uno detrás de otro, sin cerrar, también se ve (${encadenadas} de 10)`)
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
  // los demás buscadores de la app: sin autorrelleno de contacto
  for (const [arch, marca] of [['src/components/route/addStop/AddStopScreen.tsx', 'Añadir parada'], ['src/components/route/placeExplorer/PlaceExplorerScreen.tsx', 'Explorar'], ['src/components/route/attractionsFinder/AttractionsFinder.tsx', 'Buscar lugar'], ['src/components/route/reservas/OtraReservaBuscador.tsx', 'Otra reserva'], ['src/components/destination/RouteSearch.tsx', 'Buscador de ruta'], ['src/components/cuentanos/Cuentanos.tsx', 'Cuéntanos']]) {
    debe(/autoComplete="off"/.test(leer(arch)), 'buscadores', `${marca}: sus campos de texto llevan autoComplete="off"`)
  }
}

/* ───────── 2. Las portadas de los destinos ───────── */
console.log('2. Portadas de los destinos')
{
  const carpetas = fs.readdirSync('data/dias').filter((d) => fs.existsSync(`data/dias/${d}/_mapa.json`))
  debe(carpetas.includes('roma') && carpetas.includes('lanzarote'), 'destinos', 'hay destinos curados (Roma y Lanzarote)')
  for (const d of carpetas) {
    const m = JSON.parse(leer(`data/dias/${d}/_mapa.json`))
    debe(typeof m.portada === 'string' && m.portada.startsWith('/') && fs.existsSync('public' + m.portada), 'portada', `${d}: tiene portada y su archivo existe (${m.portada})`)
    debe(typeof m.portada_pequena === 'string' && m.portada_pequena.startsWith('/') && fs.existsSync('public' + m.portada_pequena), 'portada', `${d}: tiene portada pequeña y su archivo existe (${m.portada_pequena})`)
    debe(!/sin portada/i.test(m._nota ?? ''), 'nota', `${d}: sin la nota vieja de «sin portada»`)
  }
  const lz = JSON.parse(leer('data/dias/lanzarote/_mapa.json'))
  const fotos = JSON.parse(leer('data/dias/lanzarote/_fotos.json'))
  debe(lz.portada === '/fotos/lanzarote/' + fotos.portada.archivo && lz.portada_pequena === '/fotos/lanzarote/' + fotos.portada.ruta_tarjeta, 'papagayo', 'Lanzarote: la portada es la que eligió Eric (Papagayo, de _fotos.json)')
  debe(leer('src/lib/portadaViaje.ts').includes('/fotos/lanzarote/playas_de_papagayo_p.jpg'), 'papagayo', 'la tarjeta del viaje (portada propia) también es Papagayo')
  // la primera pantalla, con la API en modo administrador/oculto='-': la tarjeta de Lanzarote lleva foto
  try {
    const r = await fetch('http://localhost:8787/api/destinos-curados?admin=1').then((x) => x.json()).catch(() => null)
    const todos = (r?.destinos ?? [])
    debe(todos.every((x) => x.portada_pequena), 'api', `la API da portada a todos los destinos que devuelve (${todos.map((x) => x.clave).join(', ')})`)
  } catch {
    /* sin API */
  }
}

/* ───────── 2b. Los enlaces de reservar ───────── */
console.log('2b. Enlaces de reservar')
{
  const { stampCivitatis, CIVITATIS_AID } = await import('../../shared/affiliate/civitatis.js')
  debe(CIVITATIS_AID === '5206', 'afiliado', 'el número de afiliado de la app es 5206 (shared/affiliate/civitatis.js): Eric confirma que es el suyo')
  const exc = JSON.parse(leer('data/dias/lanzarote/_civitatis.json')).excursiones
  const cinco = exc.slice(0, 5)
  debe(cinco.length === 5 && cinco.every((e) => /^https:\/\/www\.civitatis\.com\/es\/[a-z-]+\/[a-z0-9-]+\/?$/.test(e.url) && !/buscar/.test(e.url)), 'lanzarote', '5 excursiones de Lanzarote: cada una con su página propia (no un buscador)')
  debe(cinco.every((e) => { const u = new URL(stampCivitatis(e.url, { campaignCode: 'ABC' })); return u.searchParams.get('aid') === '5206' && u.searchParams.get('cmp') === 'ABC' && u.pathname === new URL(e.url).pathname }), 'lanzarote', 'y salen con nuestro aid=5206 y la campaña, sin cambiar de página')
  debe(exc.every((e) => e.url && !/buscar/.test(e.url)), 'lanzarote', `las ${exc.length} excursiones de Lanzarote llevan su página`)
  const roma = JSON.parse(leer('data/dias/roma/_entradas.json')).lugares
  const entradas = Object.values(roma).flatMap((l) => l.entradas ?? l)
  const conPagina = entradas.filter((e) => e.url).length
  console.log(`   (Roma: ${conPagina} de ${entradas.length} entradas con página propia; el resto abre la búsqueda de ese sitio con nuestro aid)`)
  debe(entradas.filter((e) => e.url).every((e) => /^https:\/\/www\.civitatis\.com\/es\/roma\//.test(e.url) && new URL(stampCivitatis(e.url, { campaignCode: 'ABC' })).searchParams.get('aid') === '5206' && !/buscar/.test(e.url)), 'roma', 'las entradas de Roma que llevan enlace propio son de su página (V28: 9 de las 22; el aid se pone al abrirlas) y salen con nuestro aid=5206')
}

/* ───────── resumen ───────── */
console.log(`\nPrueba de la Tanda V23: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
