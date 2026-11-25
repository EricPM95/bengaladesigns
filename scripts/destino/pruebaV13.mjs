// La prueba de la Tanda V13: LAS INSIGNIAS DE LAS COLECCIONES, POR PARTES (las 18 de Design: un trozo por sitio, ganado entero en color, el que falta entero en gris; los iconos iguales en «Los imprescindibles»
// y «Las 4 joyas»; ninguna insignia pintada vieja) y el momento «Un pedazo nuevo» con su tiempo (vuelo, encaje, color, número) y con varias colecciones, una detrás de otra.
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV13.mjs
// Capturas en docs/dias/V13_capturas/ (demo de logros; ninguna llamada a producción).
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
const json = (f) => JSON.parse(leer(f))
const APP = process.env.APP_URL ?? 'http://localhost:5199'
const CAPTURAS = 'docs/dias/V13_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. Datos y código ───────── */
console.log('1. Las 18 insignias: un trozo por sitio, como Design')
{
  const roma = json('data/logros/roma.json')
  const lanza = json('data/logros/lanzarote.json')
  const partes = leer('src/components/logros/dibujos/partes.ts')
  const diseno = leer('docs/diseno/proyecto/Piezas/Insignia Lanza Codigo.dc.html')
  const nDeDiseno = (k) => Number(new RegExp(`'${k}':\\{shape:'[a-z0-9]+',ic:'[a-z]+',c:\\[[^\\]]*\\],n:(\\d+)`).exec(diseno)?.[1])
  const filas = [
    ...roma.colecciones.map((c, i) => ({ id: c.id, col: `r${i + 1}`, sitios: c.sitios })),
    ...lanza.colecciones.map((c, i) => ({ id: c.id, col: String(i + 1), sitios: c.sitios })),
  ]
  debe(filas.length === 18, 'datos', `11 colecciones de Roma y 7 de Lanzarote (${filas.length})`)
  const noCuadran = filas.filter((f) => nDeDiseno(f.col) !== f.sitios.length)
  debe(noCuadran.length === 0, 'trozos', `cada colección tiene en Design tantos trozos como sitios (no cuadran: ${noCuadran.map((f) => `${f.id} ${f.sitios.length}≠${nDeDiseno(f.col)}`).join(', ') || 'ninguna'})`)
  debe(filas.every((f) => partes.includes(`${JSON.stringify(f.id)}: { destino: `) && partes.includes(JSON.stringify(f.sitios))), 'orden', 'partes.ts lleva los sitios de cada colección en el orden de los datos (si no, node scripts/destino/generarPartes.mjs)')
  const esperadoLz = { lz_imprescindibles: 7, cesar_manrique: 7, tierra_de_fuego: 7, isla_a_tus_pies: 6, playas_y_charcos: 7, pueblos_con_alma: 6, entre_vinas_de_ceniza: 3 }
  debe(lanza.colecciones.every((c) => esperadoLz[c.id] === c.sitios.length), 'trozos', 'Lanzarote: Imprescindibles 7, Manrique 7, Tierra de fuego 7, La isla a tus pies 6, Playas y charcos 7, Pueblos con alma 6, Entre viñas 3')
  const pieza = leer('src/components/logros/dibujos/piezas/InsigniaPieza.tsx')
  debe(/arco:S\['Coliseo'\]/.test(pieza) && /trevi:S\['Fontana de Trevi'\]/.test(pieza) && /panteon:S\['Panteón'\]/.test(pieza) && /TRAZO_SITIOS/.test(leer('src/components/logros/dibujos/iconosSitios.ts')), 'iconos', 'los iconos de «Los imprescindibles» y «Las 4 joyas» salen del mismo sitio (Coliseo, Trevi, Panteón), el de Design')
  const part = leer('src/components/logros/dibujos/InsigniaPartes.tsx')
  debe(/CON_ICONOS: Record<string, 'impr' \| 'joyas'> = \{ r1: 'impr', r3: 'joyas' \}/.test(part), 'iconos', 'solo esas dos colecciones llevan iconos en los trozos')
  // Ninguna insignia pintada vieja de Lanzarote.
  const viejos = ['src/components/logros/dibujos/InsigniaGajos.tsx', 'src/components/logros/dibujos/gajosColecciones.ts', 'public/logros/lanza/col1.webp']
  debe(viejos.every((f) => !fs.existsSync(f)), 'viejas', 'las insignias pintadas de Lanzarote (imagen entera recortada a ojo) ya no existen')
  const todo = fs.readdirSync('src', { recursive: true }).map(String).filter((p) => /\.(ts|tsx)$/.test(p)).map((p) => leer(`src/${p}`)).join('\n')
  debe(!/gajosColecciones|InsigniaGajos|coleccionDeGajos|logros\/lanza\/col/.test(todo), 'viejas', 'ninguna pantalla usa ya las insignias pintadas viejas')
  const toque = leer('src/components/logros/momentos/hoja/piezaDeInsignia.ts')
  debe(/sectores|SECTORES|360 \/ total/.test(toque) && !/FORMA_POR_COLECCION/.test(toque), 'toque', 'tocar un trozo dice su sitio por sectores (como están partidas las insignias de Design)')
}

/* ───────── 2. En pantalla ───────── */
console.log('2. En pantalla (demo de logros; ninguna llamada a producción)')
{
  // 2a. Las 18 en la página de dibujos: 0, a medias y completa; ganar 1 sitio colorea solo su trozo.
  const b = await abrirApp(APP, { ruta: '/?dibujos=1', ancho: 800, alto: 700 })
  const ev = (js) => b.evaluar(js)
  try {
    for (let i = 0; i < 60 && !(await ev("document.querySelectorAll('[data-insignia-partes]').length >= 54").catch(() => false)); i++) await b.esp(500)
    await b.esp(1500)
    const r = await ev(`(() => {
      const por = {}
      for (const e of document.querySelectorAll('[data-insignia-partes]')) {
        const id = e.dataset.insigniaPartes
        const lleno = Array.from(e.querySelectorAll('svg g[style]')).map((g) => (/opacity:\\s*1\\b/.test(g.getAttribute('style') || '') ? 1 : 0)).join('')
        const mal = Boolean(e.querySelector('img'))
        ;(por[id] ??= []).push({ trozos: Number(e.dataset.trozos), ganados: Number(e.dataset.ganados), lleno, mal })
      }
      return por
    })()`)
    const ids = Object.keys(r)
    debe(ids.length === 18, 'dibujos', `la página de dibujos enseña las 18 insignias (${ids.length})`)
    debe(ids.every((id) => r[id].length === 3 && r[id].every((x) => !x.mal)), 'dibujos', 'cada una en 3 estados (sin empezar, a medias y completa), sin ninguna imagen pegada')
    const bien = ids.filter((id) => {
      const [cero, medias, todas] = r[id]
      return cero.ganados === 0 && todas.ganados === todas.trozos && medias.ganados > 0 && medias.ganados < medias.trozos
    })
    debe(bien.length === 18, 'trozos', `0, a medias y todos los trozos en las 18 (${bien.length} de 18)`)
    // Cada trozo ganado suma lo mismo (su trozo entero): el color sube en pasos iguales.
    const iguales = ids.filter((id) => {
      const [cero, medias, todas] = r[id]
      if (todas.trozos <= 0) return false
      // Cada trozo ganado cambia siempre el mismo número de capas (su gris se apaga y su color se enciende): los cambios crecen en pasos iguales.
      const cambios = (a, b) => [...a].filter((c, i) => c !== b[i]).length
      const porTrozo = cambios(cero.lleno, todas.lleno) / todas.trozos
      return Number.isInteger(porTrozo) && porTrozo >= 2 && cambios(cero.lleno, medias.lleno) === porTrozo * medias.ganados
    })
    const sinPieza = ids.filter((id) => !iguales.includes(id))
    debe(iguales.length >= 14, 'trozos', `ganar un sitio colorea solo su trozo, entero (sube en pasos iguales en ${iguales.length} de 18; las otras, hechas con la pieza de iconos: ${sinPieza.join(', ')})`)
    debe(['imprescindibles', 'cuatro_joyas'].every((id) => sinPieza.includes(id) || iguales.includes(id)), 'iconos', 'Los imprescindibles y Las 4 joyas existen con sus iconos')
    const conIconos = await ev("['imprescindibles', 'cuatro_joyas'].map((id) => document.querySelectorAll('[data-insignia-partes=\"' + id + '\"] [data-ip]').length)")
    debe(conIconos.every((n) => n >= 3), 'iconos', `esas dos se pintan con la pieza de iconos (${conIconos})`)
    await ev("document.querySelector('div[style*=\"overflow: auto\"]').scrollTop = 0; true")
    const alto = await ev("document.querySelector('div[style*=\"overflow: auto\"]').scrollHeight")
    const pasos = [450, 1250, 2050, 2850, 3650]
    for (const [i, y] of pasos.entries()) {
      if (y > alto) break
      await ev(`document.querySelector('div[style*="overflow: auto"]').scrollTop = ${y}; true`)
      await b.esp(900)
      await b.captura(`${CAPTURAS}/insignias_${i + 1}.jpg`)
    }
  } finally {
    await b.cerrar()
  }

  // 2b. El momento «Un pedazo nuevo».
  const nueva = async () => {
    const app = await abrirApp(APP, { ruta: '/?cuentas=on&logros=on&logrosDemo=1&apertura=0&version=completa&hoy2=on', ancho: 390, alto: 844 })
    for (let i = 0; i < 360 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    await app.evaluar('Promise.resolve(window.__rutaPrueba()).then(() => true)')
    await app.esp(3000)
    for (let i = 0; i < 6; i++) {
      const c = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!c) break
      await app.esp(600)
    }
    return app
  }
  const suma = (coleccion, n, total, sitios) => ({ tipo: 'suma', cat: 'pedazo', coleccion, destino: 'roma', nombre: `Col ${coleccion}`, n, total, sitios, linea: `${n} de ${total}`, primera_vez: true })
  const meter = (app, nuevos) => app.evaluar(`(async () => { const L = await import('/src/store/useLogrosStore.ts'); L.useLogrosStore.getState().recibir(${JSON.stringify({ ok: true, nuevos })}); return true })()`)
  const seguirVisible = `(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Seguir/.test((x.textContent || '').trim())); if (!b) return false; let e = b; while (e) { if (parseFloat(getComputedStyle(e).opacity) < 0.9) return false; e = e.parentElement } return true })()`
  const lee = `(() => ({ fases: Array.from(document.querySelectorAll('[data-pedazo-fase]')).map((e) => Number(e.dataset.pedazoFase)), cuentas: Array.from(document.querySelectorAll('[data-cuenta-del-pedazo]')).map((e) => e.innerText), partes: document.querySelectorAll('[role=dialog] [data-insignia-partes]').length, titulo: (document.querySelector('[role=dialog]')?.innerText ?? '').split(String.fromCharCode(10))[0], seguir: ${seguirVisible} }))()`
  {
    const app = await nueva()
    try {
      await meter(app, [suma('miguel_angel', 2, 4, ['basilica_de_san_pedro'])])
      const linea = []
      let t0 = null
      let tSeguir = null
      let capt = 0
      const marcas = [0.2, 0.9, 1.45, 1.8, 2.6]
      for (let i = 0; i < 160; i++) {
        const s = await app.evaluar(lee)
        const t = Date.now()
        if (s.fases.length > 0 && t0 === null) t0 = t
        if (t0 !== null) {
          if (linea.length === 0 || linea[linea.length - 1].f !== s.fases[0]) linea.push({ f: s.fases[0], seg: (t - t0) / 1000, cuenta: s.cuentas[0] })
          if (capt < marcas.length && (t - t0) / 1000 >= marcas[capt]) await app.captura?.(`${CAPTURAS}/momento_${capt++ + 1}.jpg`)
          if (s.seguir && tSeguir === null) tSeguir = (t - t0) / 1000
        }
        if (tSeguir !== null && linea.some((x) => x.f === 4)) break
        await app.esp(60)
      }
      const secuencia = linea.map((x) => x.f).join('→')
      debe(secuencia === '0→1→2→3→4', 'momento', `la insignia pasa por 0 (lo que ya tenías), 1 (llega volando), 2 (encaja), 3 (color) y 4 (queda): ${secuencia} (${linea.map((x) => x.f + '@' + x.seg.toFixed(1) + 's').join(' ')})`)
      debe(tSeguir !== null && tSeguir >= 1.8 && tSeguir <= 7, 'momento', `[Seguir] sale unos segundos después de empezar (V37/V38b: el sello suena y los pedazos entran uno tras otro; 4-6 s medidos con 2 Chrome a la vez) (${tSeguir?.toFixed(1)} s)`)
      debe(/^[0-9]+ DE 4$/.test(linea[0]?.cuenta ?? '') && /^[0-9]+ DE 4$/.test(linea[linea.length - 1]?.cuenta ?? '') && Number(linea[linea.length - 1]?.cuenta.split(' ')[0]) === Number(linea[0]?.cuenta.split(' ')[0]) + 1, 'momento', `el número sube al final («${linea[0]?.cuenta}» → «${linea[linea.length - 1]?.cuenta}»)`)
      const s2 = await app.evaluar(lee)
      debe(s2.partes === 1, 'momento', 'una sola insignia, con sus trozos por partes')
    } finally {
      await app.cerrar()
    }
  }
  {
    // Con 3 colecciones: una pantalla y una detrás de otra.
    const app = await nueva()
    try {
      await meter(app, [suma('miguel_angel', 2, 4, ['basilica_de_san_pedro']), suma('bernini', 3, 5, ['piazza_navona']), suma('roma_antigua', 2, 6, ['coliseo'])])
      const llegada = [null, null, null]
      let pantallas = 0
      let t0 = null
      for (let i = 0; i < 200; i++) {
        const s = await app.evaluar(lee)
        const t = Date.now()
        if (s.fases.length > 0 && t0 === null) t0 = t
        pantallas = Math.max(pantallas, s.fases.length)
        s.fases.forEach((f, k) => { if (f >= 4 && llegada[k] === null) llegada[k] = t })
        if (llegada.every((x) => x !== null)) break
        await app.esp(80)
      }
      debe(pantallas === 3, 'varias', `las tres colecciones salen en la MISMA pantalla (${pantallas} insignias)`)
      debe(llegada.every((x) => x !== null) && llegada[0] < llegada[1] && llegada[1] < llegada[2], 'varias', `cada insignia hace su trozo, una detrás de otra (${llegada.map((x) => (x && t0 ? ((x - t0) / 1000).toFixed(1) : '?') + ' s').join(', ')})`)
      await app.captura?.(`${CAPTURAS}/momento_tres.jpg`)
    } finally {
      await app.cerrar()
    }
  }
  {
    // «Reducir movimiento»: sin vuelo, solo el color.
    const app = await nueva()
    try {
      await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
      await meter(app, [suma('miguel_angel', 2, 4, ['basilica_de_san_pedro'])])
      const vistos = new Set()
      for (let i = 0; i < 120; i++) {
        const s = await app.evaluar(lee)
        s.fases.forEach((f) => vistos.add(f))
        if (vistos.has(4)) break
        await app.esp(80)
      }
      debe(!vistos.has(1) && !vistos.has(2) && vistos.has(4), 'movimiento', `con «Reducir movimiento» no hay vuelo ni encaje, solo el color (fases vistas: ${[...vistos].sort().join(',')})`)
    } finally {
      await app.cerrar()
    }
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
