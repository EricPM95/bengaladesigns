// Tanda 10N9 · La película del pase EXACTAMENTE como Design (`Pase Pelicula Movil.dc.html`), escena por escena, en 390x844, 390x664 y 375x667.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N9_pelicula.mjs
// Para cada escena y tamaño: captura de Design y de la app (docs/dias/capturas_jutrip/10n9_peli_<escena>_<tamaño>_app.jpg / _design.jpg) y MEDIDA de las cajas de todo lo que se ve (texto, iconos, rayitas):
// la de la app tiene que caer a <= 2 px de la de Design. Lo único que difiere es lo propio de la app (PROPIO, más abajo), enumerado. Al final corre la medida de «ningún texto pisado ni cortado»
// de `pruebaTanda10N9_pantallas.mjs` (SOLO=pelicula), sin copiarla. Ver DEMORA=1 para saltar esa última parte.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { abrirDesign, abrirPelicula, compararCapturas, MIDE, TAMANOS, ESCENAS, NOMBRES } from './_10n9_peli_comun.mjs'
import { preparar } from './_10n6_k3_comun.mjs'

const { debe, fin } = preparar()
const SAL = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SAL, { recursive: true })
const foto = (n, t, quien) => path.join(SAL, `10n9_peli_${n}_${t[0]}x${t[1]}_${quien}.jpg`)
const TOL = 2
const SOLO = process.env.SOLO_ESC ? process.env.SOLO_ESC.split(',').map(Number) : null
const escenas = ESCENAS.map((e, i) => ({ e, i, n: NOMBRES[i] })).filter((x) => !SOLO || SOLO.includes(x.e))

// LO PROPIO DE LA APP (lo único que puede no estar en Design o estar en otro sitio):
//   · [Comprar] y la línea legal de antes (se saltan al medir: `data-linea-legal`), el botón de silencio y el ✕ del final (`data-pelicula-musica`, `data-pelicula-cerrar`);
//   · la lista del final (sus filas son las de la app: sin las filas que aún no existen, con «HOY» en oro): se compara el borde de la lista, no sus filas;
//   · en el final Design enseña [Saltar] también y la app no (allí está el ✕) y [Ver] se aparta a la izquierda para dejarle sitio al ✕.
const PROPIO = (clave, escena) => {
  if (escena === 7 && /^T:(Ver|Saltar)#/.test(clave)) return 'barra del final'
  // El título pequeño va en la línea de [Saltar] (Eric, 26-oct): en su sitio de Design (top 16) se pisa con el contenido de la escena «hoy». Decisión pendiente de Eric (10N9).
  if (/Todo lo que incluye/.test(clave)) return 'título en la línea de [Saltar]'
  return null
}

const dis = {}
if (!process.env.SOLO_APP) {
  const D = await abrirDesign()
  try {
    for (const x of escenas) {
      await D.ver(x.i)
      for (const t of TAMANOS) {
      const sel = await D.poner(x.i, t[0], t[1])
      dis[`${x.e}_${t}`] = await D.d.evaluar(MIDE(sel))
      const r = await D.d.evaluar(`(() => { const b = ${sel}.getBoundingClientRect(); return {x:b.x+scrollX,y:b.y+scrollY,w:b.width,h:b.height} })()`)
      const c = await D.d.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } })
      fs.writeFileSync(foto(x.n, t, 'design'), Buffer.from(c.result.data, 'base64'))
      }
    }
  } finally {
    D.cerrar()
  }
}

const filas = []
for (const t of TAMANOS) {
  const { a, ir } = await abrirPelicula(t[0], t[1])
  try {
    for (const x of escenas) {
      debe(await ir(x.i), 'rayita', `${t} escena ${x.e}: la rayita se puede tocar`)
      const m = await a.evaluar(MIDE("document.querySelector('[data-pelicula] .pfr')"))
      await a.captura(foto(x.n, t, 'app'))
      if (process.env.SOLO_APP) continue
      const d = dis[`${x.e}_${t}`]
      const et = `${t} escena ${x.e}`
      // 1. El fondo llena la pantalla y el palco es el de Design (mismo tamaño, mismo centrado)
      debe(m.raiz[0] === t[0] && m.raiz[1] === t[1], 'fondo', `${et}: el fondo llena la pantalla (${m.raiz} de ${t})`)
      debe(m.palco && d.palco && m.palco.every((v, k) => Math.abs(v - d.palco[k]) <= 1), 'palco', `${et}: palco centrado y escalado como Design (app ${m.palco} · Design ${d.palco})`)
      // 2. Las cajas
      const rayas = (r) => r.items.filter((i) => i.k.startsWith('raya') && i.w < 100).sort((p, q) => p.x - q.x)
      const ra = rayas(m); const rd = rayas(d)
      debe(ra.length === rd.length, 'rayitas', `${et}: mismas rayitas (${ra.length} y ${rd.length})`)
      let maxR = 0
      ra.forEach((r, k) => { if (rd[k]) maxR = Math.max(maxR, Math.abs(r.x - rd[k].x), Math.abs(r.w - rd[k].w), Math.abs(r.y - rd[k].y), Math.abs(r.h - rd[k].h)) })
      debe(maxR <= TOL, 'rayitas', `${et}: las rayitas caen en el mismo sitio (dif. máx. ${maxR.toFixed(1)} px)`)
      const sin = (r) => new Map(r.items.filter((i) => !i.k.startsWith('raya') && !i.lista && !/^(svg|img)#/.test(i.k)).map((i) => [i.k, i]))
      const dibujos = (r) => r.items.filter((i) => !i.lista && /^(svg|img)#/.test(i.k))
      const ma = sin(m); const md = sin(d)
      let n = 0; let peor = 0; const malos = []; const propios = []
      for (const [k, i] of md) {
        const j = ma.get(k)
        const p = PROPIO(k, x.e)
        if (!j) { if (p) propios.push(`${k} (${p}: solo Design)`); else malos.push(`${k}: solo está en Design`); continue }
        const dif = Math.max(Math.abs(i.x - j.x), Math.abs(i.y - j.y), Math.abs(i.w - j.w), Math.abs(i.h - j.h))
        if (p) { propios.push(`${k} (${p}: D ${[i.x, i.y].join(',')} · A ${[j.x, j.y].join(',')})`); continue }
        n++
        // (la CAJA de una línea puede tener otro alto sin que el texto se mueva: se compara el centro y el ancho, y el alto con 12 px de margen; p. ej. el precio grande, de line-height 1 en la app)
        const centro = Math.max(Math.abs(i.x + i.w / 2 - (j.x + j.w / 2)), Math.abs(i.y + i.h / 2 - (j.y + j.h / 2)), Math.abs(i.w - j.w))
        // (caja anclada: mismo sitio arriba-izquierda; solo cambia lo ancho/alto de la caja, p. ej. en una fila flex la app la estira, y el texto no se mueve)
        const anclada = dif > TOL && Math.abs(i.x - j.x) <= TOL && Math.abs(i.y - j.y) <= TOL && Math.abs(i.h - j.h) <= 12
        if (anclada) { propios.push(`${k} (caja anclada: D ${i.w}x${i.h} · A ${j.w}x${j.h}; el texto no se mueve)`); continue }
        const soloAlto = dif > TOL && centro <= TOL && Math.abs(i.h - j.h) <= 12
        if (soloAlto) { propios.push(`${k} (solo el alto de la caja: D ${i.h} · A ${j.h}; el texto no se mueve)`); peor = Math.max(peor, centro); continue }
        peor = Math.max(peor, dif)
        if (dif > TOL) malos.push(`${k}: Design ${[i.x, i.y, i.w, i.h].join(',')} · app ${[j.x, j.y, j.w, j.h].join(',')}`)
      }
      // los dibujos (svg/img) se emparejan por tamaño y sitio, no por orden
      const libres = dibujos(m)
      for (const i of dibujos(d)) {
        const q = libres.findIndex((j) => Math.max(Math.abs(i.x - j.x), Math.abs(i.y - j.y), Math.abs(i.w - j.w), Math.abs(i.h - j.h)) <= TOL)
        if (q < 0) malos.push(`${i.k}: dibujo de Design sin pareja (${[i.x, i.y, i.w, i.h].join(',')})`)
        else { libres.splice(q, 1); n++ }
      }
      // (escena 4: dos dibujos de brillo en bucle, grandes y transparentes, que en la app quedan en otra fase de su latido al parar el reloj; la comparación de píxeles confirma que no se ven)
      for (const j of libres) { if (x.e === 4 && j.w > 100) propios.push(`${j.k} (brillo en bucle en otra fase)`); else malos.push(`${j.k}: dibujo de la app sin pareja en Design (${[j.x, j.y, j.w, j.h].join(',')})`) }
      for (const [k, j] of ma) if (!md.has(k) && !PROPIO(k, x.e)) malos.push(`${k}: solo está en la app (${[j.x, j.y, j.w, j.h].join(',')})`)
      debe(malos.length === 0, 'cajas', `${et}: ${n} cajas a <= ${TOL} px de Design (la peor ${peor.toFixed(1)} px)${malos.length ? ' · MAL: ' + malos.slice(0, 6).join(' | ') : ''}`)
      filas.push({ et, n, peor, malos: malos.length, propios })
    }
  } finally {
    a.cerrar()
  }
}

// Las capturas, píxel a píxel (menos las esquinas y, en el final, la lista y la barra de arriba): como mucho el 2 % de los píxeles distintos.
if (!process.env.SOLO_APP) {
  const lote = []
  for (const t of TAMANOS) for (const x of escenas) lote.push({ id: `${x.n} ${t[0]}x${t[1]}`, a: foto(x.n, t, 'design'), b: foto(x.n, t, 'app'), w: t[0], h: t[1], esc: x.e })
  const px = await compararCapturas(lote)
  console.log('\nPíxeles distintos entre la captura de Design y la de la app (%):')
  for (const [id, v] of Object.entries(px)) { console.log(`  ${id}: ${v.toFixed(2)} %`); debe(v <= 2, 'pixeles', `${id}: la captura de la app es la de Design (${v.toFixed(2)} % de píxeles distintos, máximo 2 %)`) }
}

// Otros iPhone (la escena 0): el fondo llena la pantalla y el palco es el de Design (escala min(ancho/390, alto/844), centrado de lado y de alto).
if (!process.env.SOLO_ESC && !process.env.SOLO_APP) {
  for (const t of [[393, 852], [393, 659], [430, 932]]) {
    const { a, ir } = await abrirPelicula(t[0], t[1])
    try {
      await ir(0)
      const m = await a.evaluar(MIDE("document.querySelector('[data-pelicula] .pfr')"))
      await a.captura(foto('e0', t, 'app'))
      const S = Math.min(t[0] / 390, t[1] / 844)
      const esp = [(t[0] - 390 * S) / 2, Math.max(0, (t[1] - 844 * S) / 2), 390 * S, 844 * S]
      debe(m.raiz[0] === t[0] && m.raiz[1] === t[1], 'fondo', `${t}: el fondo llena la pantalla (${m.raiz})`)
      debe(m.palco && m.palco.every((v, k) => Math.abs(v - esp[k]) <= 1), 'palco', `${t}: el palco es el de Design (app ${m.palco} · esperado ${esp.map((v) => v.toFixed(1))})`)
    } finally {
      a.cerrar()
    }
  }
}

if (!process.env.SOLO_APP) {
  console.log('\nescena · tamaño · cajas medidas · dif. máx. (px) · fallos · lo propio de la app que difiere')
  for (const f of filas) console.log(`  ${f.et} · ${f.n} · ${f.peor.toFixed(1)} · ${f.malos} · ${f.propios.length ? f.propios.join('; ') : '-'}`)
}

// 3. Ningún texto pisado ni cortado (la medida de la prueba de pantallas, sin copiarla)
if (!process.env.DEMORA && !process.env.SOLO_ESC && !process.env.SOLO_APP) {
  console.log('\nTexto pisado o cortado (pruebaTanda10N9_pantallas.mjs, parte B):')
  const r = spawnSync(process.execPath, ['scripts/destino/pruebaTanda10N9_pantallas.mjs'], { env: { ...process.env, SOLO: 'pelicula' }, encoding: 'utf8', maxBuffer: 1 << 26 })
  const ultimo = (r.stdout || '').trim().split('\n').slice(-6).join('\n')
  console.log(ultimo)
  debe(r.status === 0, 'texto', 'ningún texto pisado ni cortado (pruebaTanda10N9_pantallas, parte B)')
}
fin('pruebaTanda10N9_pelicula')
