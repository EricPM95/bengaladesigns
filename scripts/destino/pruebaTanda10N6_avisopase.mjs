// La prueba de la Tanda 10N6, agente K2: 1g el aviso pequeño del pase (una pieza para toda la app, `Piezas/Pase Estilo` 04) y 1h la lista del pase. (10N10, 8b: la película y su música se quitaron.)
//   APP_URL=http://localhost:5202 API_URL=http://localhost:8872 node scripts/destino/pruebaTanda10N6_avisopase.mjs
// Acaba imprimiendo «N comprobaciones, M fallos» y sale con código 1 si falla alguna. Capturas en docs/dias/capturas_jutrip/10n6_*.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, cuando, foto as foto5, leer, modulo } from './_10n5_comun.mjs'
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
debe(/Ya tienes tu foto de este sitio\./.test(textos) && /guarda fotos sin límite y haz crecer tu álbum de recuerdos\./.test(textos), 'textos', 'los dos textos de la segunda foto, los aprobados')
debe(/Ya has escuchado tu historia de prueba\./.test(textos) && /podrás escuchar todas las historias que quieras, sin límite\./.test(textos), 'textos', 'los dos textos de «Escuchar historia», los aprobados')
debe(/AvisoPaseHost/.test(leer('src/App.tsx')), 'host', 'el aviso está montado globalmente en App.tsx')
debe(!/abrirPase/.test(sinComentarios(leer('src/components/route/hoy/Escuchar.tsx'))) && !/abrirPase/.test(sinComentarios(leer('src/components/route/hoy/v2/HoyDuranteV2.tsx'))), 'sitios', '«Escuchar historia» cerrado abre el aviso, no la lista del pase')
debe(/abrirAvisoPase\('cerca_de_ti'/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')) && !/datos="explorar-cerca-de-ti"/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')), 'sitios', '«Cerca de ti» sin pase abre el aviso (la hoja suelta de la 10O ya no está)')
debe(/abrirAvisoPase\(id === 'banos'/.test(leer('src/components/route/ExplorePanel.tsx')), 'sitios', 'Baños y Fuentes abren el aviso')
const ajustes = JSON.parse(leer('data/pase/lista_ajustes.json'))
debe(ajustes.titulos['Tus fotos de cada sitio'] === 'Todas las fotos que quieras' && ajustes.textos['Tus fotos de cada sitio'] === 'En cada sitio y en tu álbum.', 'lista', 'fila de las fotos cambiada')
debe(ajustes.titulos['La historia de cada sitio'] === 'Todas las historias' && ajustes.textos['La historia de cada sitio'] === 'De cada sitio, como una audioguía en tu móvil.', 'lista', 'fila de las historias cambiada')
debe(!ajustes.prometidas_sin_hacer.some((x) => /puesta de sol/.test(x)), 'lista', 'la puesta de sol ya no está en prometidas_sin_hacer')
const gen = leer('src/lib/listaDelPase.ts')
debe(!/Empiezas cerca de donde duermes/.test(gen) && !/Empiezas cerca de donde duermes/.test(leer('src/components/pase/lista/disenoLista.ts')), 'lista', '«Empiezas cerca de donde duermes» no existe')

/* ───────────────────────── 2. El aviso sin pase ───────────────────────── */
const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
try {
  console.log('2. El aviso sin pase')

  const abrir = (clave) => g.evaluar(`import('/src/lib/avisoPase.ts').then((m) => { m.abrirAvisoPase(${JSON.stringify(clave)}); return true })`)
  const leerAviso = () => g.evaluar(`(() => { const e = document.querySelector('[data-aviso-pase]'); if (!e) return null; const r = e.getBoundingClientRect(); const ver = e.querySelector('[data-aviso-pase-ver]'); return { clave: e.getAttribute('data-aviso-pase'), titulo: e.querySelector('[data-aviso-pase-titulo]').innerText, l1: e.querySelector('[data-aviso-pase-linea1]')?.innerText ?? '', l2: e.querySelector('[data-aviso-pase-linea2]').innerText, ver: ver.innerText, fondo: getComputedStyle(e).backgroundImage, l2peso: getComputedStyle(e.querySelector('[data-aviso-pase-linea2]')).fontWeight, l1color: e.querySelector('[data-aviso-pase-linea1]') ? getComputedStyle(e.querySelector('[data-aviso-pase-linea1]')).color : '', ancho: r.width, izq: r.left, der: r.right, verFondo: getComputedStyle(ver).backgroundImage } })()`)
  const cerrar = () => g.evaluar(`(() => { const b = document.querySelector('[data-hoja="aviso-pase"] button[aria-label="Cerrar"]'); if (b) b.click(); return true })()`).then(() => esp(500))

  await abrir('segunda_foto')
  await esp(700)
  let av = await leerAviso()
  debe(av && /^Desbloquéalo con el Pase Roma$/.test(av.titulo.trim()), 'aviso', `título «Desbloquéalo con el Pase Roma» (${av?.titulo})`)
  debe(av?.l1 === 'Ya tienes tu foto de este sitio.' && /^Con el Pase .+, guarda fotos sin límite y haz crecer tu álbum de recuerdos\.$/.test(av?.l2 ?? ''), 'aviso', 'segunda foto: línea 1 y línea 2')
  debe(av?.ver.trim() === 'Ver el Pase Roma', 'aviso', `botón «Ver el Pase Roma» (${av?.ver})`)
  debe(av && /28, 34, 48/.test(av.fondo) && /243, 226, 176/.test(av.verFondo) && Number(av.l2peso) >= 600 && Number(av.l2peso) > 400, 'aviso', 'azul oscuro, botón dorado y la línea 2 en negrita')
  debe(av && av.izq >= 0 && av.der <= 390, 'aviso', 'cabe en el ancho del móvil')
  await g.captura(foto('aviso_segunda_foto'))
  // [Ver el Pase Roma] → la lista del pase (Tanda 10N10, 8b: ya no hay película; abre siempre directo la lista, con [Elegir mi pase])
  await g.evaluar(`document.querySelector('[data-aviso-pase-ver]').click(); true`)
  const lista = await cuando(g, `Boolean(document.querySelector('[data-lista-del-pase]'))`, 40)
  debe(lista, 'aviso', '[Ver el Pase Roma] abre la lista del pase')
  debe(!(await g.evaluar(`Boolean(document.querySelector('[data-aviso-pase]'))`)), 'aviso', 'y el aviso se cierra')
  const modoLista = await g.evaluar(`document.querySelector('[data-lista-del-pase]')?.getAttribute('data-lista-del-pase')`)
  debe(modoLista === 'lista' && (await cuando(g, `/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')`, 20)), 'aviso', `va directo a la lista, con [Elegir mi pase] (${modoLista})`)
  await g.captura(foto('lista_del_pase'))
  await g.evaluar(`document.querySelector('[data-pelicula-cerrar]')?.click(); true`)
  await esp(600)

  await abrir('escuchar_historia')
  await esp(600)
  av = await leerAviso()
  debe(av?.l1 === 'Ya has escuchado tu historia de prueba.' && /^Con el Pase .+, podrás escuchar todas las historias que quieras, sin límite\.$/.test(av?.l2 ?? ''), 'aviso', '«Escuchar historia»: línea 1 y línea 2')
  await g.captura(foto('aviso_escuchar_historia'))
  await cerrar()
  for (const clave of ['cerca_de_ti', 'banos', 'fuentes', 'hoy', 'generico']) {
    await abrir(clave)
    await esp(400)
    av = await leerAviso()
    debe(av && av.l2.length > 3 && av.clave === clave, 'aviso', `«${clave}» saca su aviso con dos líneas (${av?.l1} / ${av?.l2})`)
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
