// La prueba de la Tanda LZ3, agente B: los dibujos de los logros de Lanzarote (sello, 7 colecciones en gajos, 11 emblemas con su movimiento) y el botón «Reorganizar» tras «Ahora no».
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaLZ3_B.mjs
// Un solo Chrome de prueba (la página de dibujos de desarrollo `?dibujos=1`, que no necesita la API). El Vite estable tiene que haberse arrancado con el código nuevo.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))

// ── 0. Lo que se ve en el código y en los datos ───────────────────────────────────────────────────────────────────────────────
const lz = json('data/logros/lanzarote.json')
const pipe = json('data/pipeline_v2/lanzarote.json')
const idsDeSitio = new Set(pipe.places.map((p) => p.id))
const tablaTxt = leer('src/components/logros/dibujos/gajosColecciones.ts')
const tabla = json('docs/dias/_lz3_tabla_gajos.json')
debe(Object.keys(tabla).filter((k) => !k.startsWith('_')).length === 7, 'la tabla gajo → sitio (docs/dias/_lz3_tabla_gajos.json) no tiene las 7 colecciones')
{
  // Cada gajo de cada colección es un id de lanzarote.json, y los sitios de la tabla son los de la colección de data/logros/lanzarote.json.
  const filas = {}
  for (const m of tablaTxt.matchAll(/^\s*(lz\d):\s*\{[^}]*?sitios:\s*\[([^\]]*)\]/gm)) filas[m[1]] = [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])
  debe(Object.keys(filas).length === 7, 'gajosColecciones.ts no tiene lz1 a lz7')
  const DE = { lz1: 'lz_imprescindibles', lz2: 'cesar_manrique', lz3: 'tierra_de_fuego', lz4: 'isla_a_tus_pies', lz5: 'playas_y_charcos', lz6: 'pueblos_con_alma', lz7: 'entre_vinas_de_ceniza' }
  for (const [k, sitios] of Object.entries(filas)) {
    for (const s of sitios) debe(idsDeSitio.has(s), `${k}: «${s}» no es un id de data/pipeline_v2/lanzarote.json`)
    const col = lz.colecciones.find((c) => c.id === DE[k])
    debe(Boolean(col), `${k}: no hay colección «${DE[k]}» en data/logros/lanzarote.json`)
    if (col) debe(JSON.stringify([...new Set(sitios)].sort()) === JSON.stringify([...col.sitios].sort()), `${k}: los sitios de los gajos no son los de «${DE[k]}» en lanzarote.json`)
  }
  // La geometría es la de Design (Piezas/Insignia Lanza Pro).
  const dis = leer('docs/diseno/proyecto/Piezas/Insignia Lanza Pro.dc.html').match(/const IMG=\{([^}]*)\}/)
  debe(Boolean(dis), 'no leo la geometría de Insignia Lanza Pro')
  if (dis) {
    for (const m of dis[1].matchAll(/(\d):\[([^\]]*)\]/g)) {
      const [iw, ih, cx, cy, n, a0] = m[2].split(',').map(Number)
      const mine = tablaTxt.match(new RegExp(`lz${m[1]}:\\s*\\{[^}]*?iw:\\s*(\\d+),\\s*ih:\\s*(\\d+),\\s*cx:\\s*(\\d+),\\s*cy:\\s*(\\d+),\\s*n:\\s*(\\d+),\\s*a0:\\s*(-?\\d+)`))
      // (LZ3b) La col6 de Design dice 5 gajos iguales, pero su imagen trae 4 trozos desiguales: la app usa n 4 con `cortes` (se lo pedimos a Design). El resto, como Design.
      debe(mine && [iw, ih, cx, cy, n, a0].every((v, i) => (m[1] === '6' && i === 4) || Number(mine[i + 1]) === v), `la geometría de lz${m[1]} no es la de Design (${m[2]})`)
    }
  }
  for (let i = 1; i <= 7; i++) debe(fs.existsSync(`public/logros/lanza/col${i}.webp`), `falta public/logros/lanza/col${i}.webp`)
}
{
  // Los emblemas: los 11 con su ficha de datos de A.
  const em = leer('src/components/logros/dibujos/EmblemaLanza.tsx')
  debe(Array.from({ length: 10 }, (_, i) => `'${i + 2}'`).every((k) => em.includes(`case ${k}`)) && em.includes("case 'gl'"), 'EmblemaLanza.tsx no dibuja los 11 emblemas')
  debe(lz.emblemas.length === 11, `lanzarote.json tiene ${lz.emblemas.length} emblemas, no 11`)
  // Sin «patrimonios» de Roma en lo de Lanzarote.
  debe(/volcan/.test(leer('src/components/logros/dibujos/piezas/SelloLogro.tsx')) && /lanzarote/.test(leer('src/components/logros/dibujos/Sello.tsx')), 'el sello de Lanzarote no lleva el volcán')
}
{
  // (3b) «Ahora no» ya no esconde el botón de Reorganizar, para todos los destinos.
  const store = leer('src/store/useReorganizarStore.ts')
  debe(/ahoraNo:\s*\(\)\s*=>\s*set\(\{\s*alerta:\s*false\s*\}\)/.test(store), '«Ahora no» (useReorganizarStore.ahoraNo) vacía los días: el botón se esconde')
  const host = leer('src/components/reorganizar/ReorganizarHost.tsx')
  debe(/Un día que ya tiene el botón y al que se le QUITA una parada/.test(host), 'ReorganizarHost no recalcula el día al que se le quita una parada')
  debe(!/roma|lanzarote|destination|destino/i.test(leer('src/components/reorganizar/useBotonReorganizarVisible.ts')), 'el botón de Reorganizar mira el destino (tiene que ser igual en todos)')
  debe(/«Ahora no» ya NO esconde el botón «Reorganizar»/.test(leer('docs/REGLAS_DE_LA_APP.md')), 'REGLAS_DE_LA_APP.md no recoge el cambio de «Ahora no»')
}

// ── 1. En pantalla: la página de dibujos de desarrollo ────────────────────────────────────────────────────────────────────────
const a = await abrirApp(BASE, { ruta: '/?dibujos=1', ancho: 390, alto: 844, sinEsperarRuta: true })
try {
  for (let i = 0; i < 60 && !(await a.evaluar("Boolean(document.querySelector('[data-lz3=emblemas]'))")); i++) await a.esp(500)
  await a.esp(1500)

  // El sello en sus 5 estados.
  const sello = await a.evaluar("(document.querySelector('[data-lz3=sello]')?.innerText || '')")
  debe((sello.match(/LANZAROTE/g) || []).length >= 4, `el sello no lleva «LANZAROTE» en sus grados: «${sello.slice(0, 80)}»`)
  debe((await a.evaluar("document.querySelectorAll('[data-lz3=sello] > div').length")) === 5, 'el sello no sale en sus 5 estados (por conseguir, bronce, plata, oro, diamante)')

  // Las 7 colecciones: 0, 3 gajos y completa.
  const cols = await a.evaluar("Array.from(document.querySelectorAll('[data-lz3=colecciones] [data-gajos]')).map((e) => [Number(e.dataset.gajos), Number(e.dataset.ganados), e.querySelectorAll('img').length])")
  debe(cols.length === 21, `salen ${cols.length} insignias de Lanzarote, no 21`)
  const N = [7, 7, 7, 6, 7, 4, 3] // (LZ3b) La colección 6 («Pueblos con alma») tiene 4 gajos dibujados y 5 sitios
  for (let c = 0; c < 7; c++) {
    const [cero, tres, todas] = cols.slice(c * 3, c * 3 + 3)
    debe(cero && cero[0] === N[c] && cero[1] === 0, `colección ${c + 1}: sin ganar tiene que tener 0 gajos en color`)
    debe(tres && tres[1] === 3, `colección ${c + 1}: con 3 sitios tienen que ir 3 gajos en color (${tres && tres[1]})`)
    debe(todas && todas[1] === N[c], `colección ${c + 1}: completa tiene que llevar los ${N[c]} gajos en color`)
    debe(cero && tres && (c === 6 ? tres[2] === 2 : tres[2] === cero[2] + 3 + 1), `colección ${c + 1}: ganar 3 sitios tiene que pintar 3 gajos y el centro (imágenes: ${tres && tres[2]})`)
  }
  // Ganar un sitio colorea su gajo (y solo el suyo): el recorte del gajo de «montanas_del_fuego» en lz3 es el 0.
  await a.evaluar("(() => { const c = Array.from(document.querySelectorAll('[data-lz3=colecciones] [data-gajos]'))[4]; c.scrollIntoView({block:'center'}); return true })()")
  const gajoPintado = await a.evaluar("Array.from(document.querySelectorAll('[data-lz3=colecciones] [data-gajos]'))[4].querySelector('[data-gajo=\"0\"]')?.style.clipPath.startsWith('polygon') || false")
  debe(gajoPintado, 'en la colección 2 con 3 sitios ganados, el primer gajo no está recortado en color')
  await a.captura(path.join(SALIDA, 'lz3_colecciones_3gajos_1.jpg'))

  // Roma no cambia: sus insignias no son de gajos.
  debe((await a.evaluar("document.querySelectorAll('[data-gajos]').length")) === 21, 'alguna insignia de Roma sale como imagen en gajos')

  // Los 11 emblemas: cada uno con su movimiento (las animaciones propias de cada dibujo) cuando va animado; y la silueta con «?».
  await a.evaluar("(() => { const c = document.querySelector('input[type=checkbox]'); if (!c.checked) c.click(); return true })()")
  await a.esp(1800)
  const MOV = ['lzDraw', 'lqCrab', 'lqLamp', 'lqBoat', 'lqLava', 'lqGreen', 'lqWind', 'lqDot', 'lqSurf', 'lqSunUp', 'lqSunDown']
  const movs = await a.evaluar("Array.from(document.querySelectorAll('[data-lz3=emblemas] > div')).map((cel) => { const e = cel.querySelector('[data-emblema-lanza]'); return [e.dataset.emblemaLanza, [...new Set(e.getAnimations({ subtree: true }).map((x) => x.animationName))], cel.querySelectorAll('[data-silueta]').length, (cel.querySelector('[data-silueta]')?.innerText || '')] })")
  debe(movs.length === 11, `salen ${movs.length} emblemas de Lanzarote, no 11`)
  const kinds = ['gl', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
  movs.forEach(([k, anims, nSil, txt], i) => {
    debe(k === kinds[i], `emblema ${i + 1}: dibujo «${k}», debía ser «${kinds[i]}»`)
    debe(anims.includes(MOV[i]), `emblema ${i + 1}: no tiene su movimiento ${MOV[i]} (${anims.join(',')})`)
    debe(nSil === 1 && /\?/.test(txt), `emblema ${i + 1}: la silueta sin ganar no lleva «?»`)
  })
  // Quieto (animado=false en los pequeños): sin movimientos largos que corran.
  await a.evaluar("(() => { const c = document.querySelector('input[type=checkbox]'); if (c.checked) c.click(); return true })()")
  await a.esp(600)

  // Capturas: el sello, las colecciones (0, 3, completa), los emblemas ganados y sin ganar.
  const ir = (sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); window.scrollTo(0, 0); const r = document.querySelector('[style*="overflow: auto"]'); if (r) r.scrollTop = e.offsetTop - 10; e.scrollIntoView({block:'start'}); return true })()`)
  await ir('[data-lz3=sello]')
  await a.esp(500)
  await a.captura(path.join(SALIDA, 'lz3_sello_grados_1.jpg'))
  await ir('[data-lz3=colecciones]')
  await a.esp(500)
  await a.captura(path.join(SALIDA, 'lz3_colecciones_0_3_completa_1.jpg'))
  await a.evaluar("(() => { const e = document.querySelector('[data-lz3=colecciones]'); const r = e.closest('[style*=\"overflow: auto\"]') || document.scrollingElement; r.scrollTop += 560; return true })()")
  await a.esp(400)
  await a.captura(path.join(SALIDA, 'lz3_colecciones_0_3_completa_2.jpg'))
  await ir('[data-lz3=emblemas]')
  await a.esp(500)
  await a.captura(path.join(SALIDA, 'lz3_emblemas_ganados_sin_ganar_1.jpg'))
  await a.evaluar("(() => { const e = document.querySelector('[data-lz3=emblemas]'); const r = e.closest('[style*=\"overflow: auto\"]') || document.scrollingElement; r.scrollTop += 560; return true })()")
  await a.esp(400)
  await a.captura(path.join(SALIDA, 'lz3_emblemas_ganados_sin_ganar_2.jpg'))

  // (3b) El botón «Reorganizar»: tras «Ahora no» se queda; solo «Reorganizar» (terminar) y el recálculo lo quitan. (Es el mismo almacén en Roma y en Lanzarote.)
  const r = await a.evaluar(`import('/src/store/useReorganizarStore.ts').then((m) => { const S = m.useReorganizarStore; S.getState().reiniciar(); S.getState().poner(['d2'], ['d2']); S.getState().abrirAlerta(); const conAlerta = S.getState().alerta && S.getState().dias.length === 1; S.getState().ahoraNo(); const trasAhoraNo = { alerta: S.getState().alerta, dias: S.getState().dias.length }; S.getState().poner([], ['d2']); const calculado = S.getState().dias.length; S.getState().poner(['d2'], ['d2']); S.getState().terminar(); const fin = S.getState().dias.length; return { conAlerta, trasAhoraNo, calculado, fin } })`)
  debe(r.conAlerta, 'el almacén no abre la alerta con un día pendiente')
  debe(r.trasAhoraNo.alerta === false && r.trasAhoraNo.dias === 1, `tras «Ahora no» el botón tiene que seguir (alerta ${r.trasAhoraNo.alerta}, días ${r.trasAhoraNo.dias})`)
  debe(r.calculado === 0, 'cuando el día deja de necesitarlo, el botón se va')
  debe(r.fin === 0, 'tras reorganizar, el botón se va')
} finally {
  a.cerrar()
}

// ── 2. La hoja de logros de Lanzarote, a medias y completa (estados hechos con las funciones reales del servidor: scripts/destino/generarEstadosHojaLZ3.mjs) ──────────────────
{
  const b = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 120 && !(await b.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await b.esp(500)
    await b.evaluar('window.__rutaPrueba().then(() => true)')
    const R = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
    for (let i = 0; i < 90 && !(await b.evaluar(R + '.then((S) => Boolean(S.getState().route))')); i++) await b.esp(1000)
    await b.esp(2500)
    // La hoja se pinta con el estado de Lanzarote (el viaje de fondo es el de pruebas; se pone «Lanzarote» de destino para las insignias).
    await b.evaluar(R + ".then((S) => { S.setState({ destination: 'Lanzarote', screen: 'route', mode: 'days' }); return true })")
    for (let i = 0; i < 3; i++) {
      await b.evaluar("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Empezar mi día)$/.test(x.textContent.trim())); e?.click(); return true })()")
      await b.esp(600)
    }
    for (const [nombre, archivo, esperados] of [['amedias', 'hoja_lz_amedias', { enc: 4 }], ['completa', 'hoja_lz_completa', { enc: 11 }]]) {
      await b.evaluar(`Promise.all([import('/src/components/logros/momentos/api.ts'), import('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(json(`src/dev/escaparates/datos/${archivo}.json`))}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 200); return true })`)
      await b.esp(1800)
      for (let i = 0; i < 40 && (await b.evaluar("Boolean(document.querySelector('[data-hueco-insignia]'))")); i++) await b.esp(150)
      const sec = await b.evaluar("document.querySelector('[data-secretos]')?.querySelectorAll('[data-emblema-lanza]').length ?? -1")
      const huecos = await b.evaluar("document.querySelector('[data-secretos]')?.querySelectorAll('[data-hueco-emblema]').length ?? -1")
      debe(sec === esperados.enc, `hoja ${nombre}: salen ${sec} emblemas ganados de Lanzarote, no ${esperados.enc}`)
      debe(huecos === 11 - esperados.enc, `hoja ${nombre}: ${huecos} emblemas sin ganar, debían ser ${11 - esperados.enc}`)
      const gajos = await b.evaluar("document.querySelectorAll('[data-gajos]').length")
      debe(gajos === 7, `hoja ${nombre}: salen ${gajos} insignias en gajos, no 7`)
      await b.captura(path.join(SALIDA, `lz3_hoja_${nombre}_1.jpg`))
      await b.evaluar("(() => { const h = document.querySelector('[data-secretos]'); h?.scrollIntoView({block:'start'}); return true })()")
      await b.esp(500)
      await b.captura(path.join(SALIDA, `lz3_hoja_${nombre}_emblemas_2.jpg`))
      await b.evaluar("import('/src/components/logros/momentos/useMomentosUI.ts').then((m) => { m.useMomentosUI.getState().cerrarHojaLogros(); return true })")
      await b.esp(500)
    }
  } finally {
    b.cerrar()
  }
}

console.log(`\nPrueba LZ3 B (dibujos y Reorganizar): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
