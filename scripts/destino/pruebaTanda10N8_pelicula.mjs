// Tanda 10N8 (N3), apartado 5: la película del pase como `Pase Pelicula Movil` (Design), escena por escena, a pantalla completa, en 390x844 y 375x667.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N8_pelicula.mjs
// Comprueba: el fondo llena toda la pantalla, el palco es el de Design (escala = min(ancho/390, alto/844)), el título va en la MISMA línea que [Saltar], y saca la captura de cada escena junto a la de Design.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { conViaje, abrirPase, esp, cuando, clicEn } from './_10n5_comun.mjs'
import { preparar } from './_10n6_k3_comun.mjs'

const { debe, fin } = preparar()
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const TAMS = [[390, 844], [375, 667]]
const ESCENAS = [0, 1, 3, 4, 5, 6, 7]
const NOMBRES = ['Vuelo y alojamiento', 'HOY', 'Algo brilla', 'Coleccion y niveles', 'El pasaporte', 'Los recuerdos', 'El final']
const SOLO_DESIGN = process.env.SOLO === 'design'
const SOLO_APP = process.env.SOLO === 'app'

const FF = `(() => { const r = document.querySelector('[data-pelicula] .pfr') || document.querySelector('.pfr'); r.getAnimations({subtree:true}).forEach(an => { try { const e = an.effect.getComputedTiming().endTime; if (isFinite(e)) an.currentTime = e } catch(x){} }); return true })()`

// ---------- Design ----------
if (!SOLO_APP) {
  const RAIZ = path.resolve('docs/diseno/proyecto')
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' }
  const servidor = http.createServer((req, res) => {
    const ruta = path.join(RAIZ, decodeURIComponent((req.url ?? '/').split('?')[0]))
    if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] ?? 'application/octet-stream' })
    fs.createReadStream(ruta).pipe(res)
  })
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
  const puerto = servidor.address().port
  const d = await abrirApp(`http://127.0.0.1:${puerto}`, { ancho: 1000, alto: 900, ruta: '/' + encodeURIComponent('Pase Pelicula Movil.dc.html'), sinEsperarRoot: true, baseFija: true, esperaFija: 10 })
  try {
    console.log('design abierto'); await d.esp(6000); console.log('design listo')
    for (const [w, h] of TAMS) {
      for (const [idx, e] of ESCENAS.entries()) {
        // Las 14 pantallas son los `.pfr` de la página, en orden: escena 0 (390, 375), escena 1 (390, 375)...
        const EL = `document.querySelectorAll('.pfr')[${idx * 2 + (w === 375 ? 1 : 0)}]`
        console.log('escena', e, w); const caja = await d.evaluar(`(() => { const el = ${EL}; if (!el) return null; el.scrollIntoView({block:'center'}); return true })()`)
        if (!caja) { debe(false, '5', `Design: no encuentro la escena ${e} a ${w}x${h}`); continue }
        await d.esp(1500)
        await d.evaluar(`(() => { const el = ${EL}; el.getAnimations({subtree:true}).forEach(an => { try { const t = an.effect.getComputedTiming().endTime; if (isFinite(t)) an.currentTime = t } catch(x){} }); return true })()`)
        await d.esp(700)
        const r = await d.evaluar(`(() => { const b = ${EL}.getBoundingClientRect(); return {x:b.x+scrollX,y:b.y+scrollY,w:b.width,h:b.height} })()`)
        const x = await d.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } })
        fs.writeFileSync(path.join(SALIDA, `10n8_design_pelicula_e${idx}_${w}x${h}.jpg`), Buffer.from(x.result.data, 'base64'))
      }
    }
  } finally {
    d.cerrar()
    servidor.close()
  }
}

// ---------- La app ----------
if (!SOLO_DESIGN) {
  for (const [w, h] of TAMS) {
    console.log('viaje', w, h); const a = await conViaje({ ancho: w, alto: h, vista: false, extraAntes: 'window.__pruebaPeliculaEscena = 0;' })
    try {
      await abrirPase(a)
      await cuando(a, "Boolean(document.querySelector('[data-pelicula] .pfr'))", 60)
      await esp(2500)
      for (const [idx, e] of ESCENAS.entries()) {
        const c = await a.evaluar(`(() => { const r = document.querySelectorAll('[data-pelicula] [data-raya]')[${idx}]; if (!r) return null; const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })()`)
        debe(Boolean(c), '5', `${w}x${h} escena ${e}: la rayita de la escena se puede tocar`)
        if (c) await clicEn(a, c[0], c[1])
        await esp(1800)
        await a.evaluar(FF)
        await esp(900)
        const m = await a.evaluar(`(() => {
          const p = document.querySelector('[data-pelicula]'); const r = p.querySelector('.pfr').getBoundingClientRect()
          const t = p.querySelector('[data-pelicula-titulo]'); const s = p.querySelector('[data-pelicula-saltar]')
          const rt = t && t.getBoundingClientRect(); const rs = s && s.getBoundingClientRect()
          const palco = [...p.querySelectorAll('.pfr > div')].find((x) => /scale/.test(x.style.transform))
          return { fondo: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], vw: innerWidth, vh: innerHeight,
            titulo: rt ? [Math.round(rt.y + rt.height / 2)] : null, saltar: rs ? Math.round(rs.y + rs.height / 2) : null, tituloTxt: t ? t.textContent : null,
            escala: palco ? palco.style.transform : null }
        })()`)
        debe(m.fondo[0] === 0 && m.fondo[1] === 0 && m.fondo[2] === m.vw && m.fondo[3] === m.vh, '5', `${w}x${h} escena ${e}: el fondo llena toda la pantalla (${m.fondo.join(',')} de ${m.vw}x${m.vh})`)
        const esperada = Math.min(w / 390, h / 844)
        const real = Number((/scale\(([\d.]+)\)/.exec(m.escala ?? '') ?? [])[1])
        debe(Math.abs(real - esperada) < 0.02, '5', `${w}x${h} escena ${e}: la escala es la de Design (${real} y debería ser ${esperada.toFixed(3)})`)
        if (e !== 7) {
          debe(m.titulo && m.saltar != null && Math.abs(m.titulo[0] - m.saltar) <= 6, '5', `${w}x${h} escena ${e}: el título «Todo lo que incluye tu Pase…» va en la misma línea que [Saltar] (${m.titulo} / ${m.saltar})`)
          debe(/Todo lo que incluye tu Pase/.test(m.tituloTxt ?? ''), '5', `${w}x${h} escena ${e}: el texto del título`)
        }
        console.log('escena', e); await a.captura(path.join(SALIDA, `10n8_pelicula_e${idx}_${w}x${h}.jpg`))
      }
      // el final: la lista con scroll y los botones de abajo
      const fin7 = await a.evaluar("(() => { const l = document.querySelector('[data-lista-pase]'); return l ? [l.scrollHeight, l.clientHeight] : null })()")
      debe(Boolean(fin7) && fin7[0] > fin7[1], '5', `${w}x${h}: la lista del final se mueve con el dedo (${fin7})`)
    } finally {
      a.cerrar()
    }
  }
}
fin('pruebaTanda10N8_pelicula')
