// Exploración de la película (Tanda 10N5): TAM=390x664 ESC=4 ESPERA=12 FF=1 node ...  (ESPERA en segundos de escena real; FF=1 avanza las animaciones a su final antes de capturar)
import { conViaje, abrirPase, esp, foto, cuando, clicEn } from './_10n5_comun.mjs'
const tam = (process.env.TAM ?? '390x664').split(',').map((t) => t.split('x').map(Number))
const escenas = (process.env.ESC ?? '0,1,3,4,5,6').split(',').map(Number)
const espera = Number(process.env.ESPERA ?? 2)
const FF = process.env.FF !== '0'
import fs from 'node:fs'
const log = (...x) => fs.appendFileSync(process.env.TEMP + '/explorar_10n5.log', new Date().toISOString().slice(11, 19) + ' ' + x.join(' ') + String.fromCharCode(10))
const conTope = (p, ms, que) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('tope ' + que)), ms))])
const ff = `(() => { const r = document.querySelector('[data-pelicula] .pfr'); r.getAnimations({subtree:true}).forEach(an => { try { const e = an.effect.getComputedTiming().endTime; if (isFinite(e)) an.currentTime = e } catch(x){} }); return true })()`
for (const [w, h] of tam) {
  const a = await conViaje({ ancho: w, alto: h, vista: false, extraAntes: 'window.__pruebaPeliculaEscena = 0;' })
  try {
    await abrirPase(a)
    await cuando(a, "Boolean(document.querySelector('[data-pelicula] .pfr'))", 40)
    await esp(1500)
    for (const e of escenas) {
      const idx = [0, 1, 3, 4, 5, 6, 7].indexOf(e)
      const c = await a.evaluar(`(() => { const r = document.querySelectorAll('[data-pelicula] [data-raya]')[${idx}]; if (!r) return null; const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })()`)
      log('raya', e, c)
      if (c) await clicEn(a, c[0], c[1])
      await esp(espera * 1000)
      const antes = await conTope(a.evaluar(`(() => { const r = document.querySelector('[data-pelicula] .pfr'); const ends = r.getAnimations({subtree:true}).map(an => an.effect.getComputedTiming()).filter(t=>isFinite(t.endTime)).map(t=>Math.round(t.endTime)); return { max: Math.max(...ends), n: ends.length, tops: ends.sort((x,y)=>y-x).slice(0,6) } })()`), 30000, 'medir')
      log(w, h, 'escena', e, JSON.stringify(antes))
      if (FF) await conTope(a.evaluar(ff), 30000, 'ff')
      await esp(700)
      await conTope(a.captura(foto(`explorar_e${e}_${w}x${h}${process.env.SUF ?? ''}`)), 30000, 'captura')
      log('captura', e)
    }
  } finally {
    a.cerrar()
  }
}
