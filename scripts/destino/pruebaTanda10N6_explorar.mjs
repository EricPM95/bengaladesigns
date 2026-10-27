// Tanda 10N6 (agente K3), apartados 1d y 1e: «Cerca de ti» y «Recomendados» en EXPLORAR, y «Cambiar parada» con EXPLORAR de siempre.
//   SERVER_PORT=8873 node server/index.js   y   API_TARGET=http://localhost:8873 npx vite --config scripts/destino/_vite_estable.config.mjs --port 5203 --strictPort
//   APP_URL=http://localhost:5203 API_URL=http://localhost:8873 node scripts/destino/pruebaTanda10N6_explorar.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla. Solo mira la app (no toca el motor de rutas).
import { conViaje, modo, esp, cuando, foto, leer, preparar, store } from './_10n6_k3_comun.mjs'

const { debe, fin } = preparar()
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SOLO = process.env.SOLO ?? ''
const toca = (n) => !SOLO || SOLO === n
const paso = (t) => console.log('   · ' + t)
const clic = (a, js) => a.evaluar(`(() => { const e = ${js}; if (!e) return false; e.click(); return true })()`)

/* ───────────────────────── 1. El código ───────────────────────── */
console.log('1. El código')
{
  const el = sinComentarios(leer('src/components/ui/Elegir.tsx'))
  debe(/hayDelPase = opciones\.some\(\(o\) => o\.bloqueada\)/.test(el) && /claraConDorado = elegida && !o\.bloqueada && hayDelPase/.test(el), '1d', 'InterruptorElegir: si una opción es del pase, la elegida gratis va en claro con dorado')
  const cp = sinComentarios(leer('src/components/route/dayDetail/CambiarParada.tsx'))
  debe(/Elige el sitio que cambia por \$\{elSitio\(/.test(cp), '1e', 'la franja dice «Elige el sitio que cambia por {el sitio}» con su artículo')
  const ex = sinComentarios(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx'))
  debe(/data-cancelar-cambio/.test(ex) && /label: 'Cambiar por este'/.test(ex) && /data-cambiar-por/.test(ex), '1e', 'la franja lleva ✕ y la ficha el botón «Cambiar por este»')
}

/* ───────────────────────── 2. «Cerca de ti» y «Recomendados» ───────────────────────── */
const ESTILO_PESTANAS = `(() => {
  const p = (id) => { const e = document.querySelector('[data-pestana="' + id + '"]'); if (!e) return null; const cs = getComputedStyle(e); return { texto: (e.innerText || '').trim(), fondo: cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor, color: cs.color, borde: cs.borderTopColor, sombra: cs.boxShadow, claroDorado: e.dataset.claraDorado === '1', elegida: e.dataset.elegida === '1', candado: Boolean(e.querySelector('svg[data-bloqueado-pase]')) } }
  return { rec: p('recommended'), cerca: p('nearby') }
})()`
async function abrirExplorador(a) {
  await modo(a, 'explore')
  await esp(2500)
  const ok = await clic(a, "Array.from(document.querySelectorAll('button')).find((b) => /Restaurantes/.test(b.innerText))")
  await cuando(a, "Boolean(document.querySelector('[data-pestanas-explorar]'))", 60)
  await esp(1200)
  return ok
}
console.log('2. EXPLORAR sin pase')
if (toca('2')) {
  const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    debe(await abrirExplorador(g), '1d', 'no se abre el explorador desde EXPLORAR')
    const e = await g.evaluar(ESTILO_PESTANAS)
    debe(e?.cerca && /Cerca de ti/.test(e.cerca.texto) && /28, 34, 48/.test(e.cerca.fondo) && /233, 199, 122/.test(e.cerca.sombra) && e.cerca.candado, '1d', `«Cerca de ti» sin pase: azul oscuro con el candado dorado (${JSON.stringify(e?.cerca)})`)
    debe(e?.rec && e.rec.elegida && e.rec.claroDorado, '1d', `«Recomendados» (elegida) va en claro con dorado (${JSON.stringify(e?.rec)})`)
    debe(e?.rec && /255, 253, 248|251, 243, 226/.test(e.rec.fondo) && !/28, 34, 48/.test(e.rec.fondo) && /210, 182, 122/.test(e.rec.borde) && /28, 34, 48/.test(e.rec.color), '1d', `«Recomendados» en marfil/blanco con borde dorado y letra oscura (${JSON.stringify(e?.rec)})`)
    await g.captura(foto('explorar_pestanas_sin_pase'))
  } finally {
    g.cerrar()
  }
}
console.log('2b. EXPLORAR con pase')
if (toca('2')) {
  const k = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
  try {
    debe(await abrirExplorador(k), '1d', 'con pase: no se abre el explorador')
    const e = await k.evaluar(ESTILO_PESTANAS)
    debe(e?.cerca && !e.cerca.candado && !/233, 199, 122/.test(e.cerca.sombra), '1d', `con pase «Cerca de ti» es una opción más, sin candado (${JSON.stringify(e?.cerca)})`)
    debe(e?.rec && e.rec.elegida && !e.rec.claroDorado && /28, 34, 48/.test(e.rec.fondo), '1d', `con pase, «Recomendados» elegida va en el azul oscuro de siempre (${JSON.stringify(e?.rec)})`)
    await k.captura(foto('explorar_pestanas_con_pase'))
  } finally {
    k.cerrar()
  }
}

/* ───────────────────────── 3. «Cambiar parada» ───────────────────────── */
console.log('3. Cambiar parada')
if (toca('3')) {
  const a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    paso('viaje abierto')
    await modo(a, 'days', 0)
    paso('en DÍAS')
    const nombresAntes = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days[0].stops.map((x) => x.name))`)
    // El primer «···» cuya hoja deja «Cambiar parada».
    let abierto = false
    let paradaCambiada = null
    const kebabs = await a.evaluar("document.querySelectorAll('[aria-label=\"Opciones de la parada\"]').length")
    for (let i = 0; i < Math.min(kebabs, 6) && !abierto; i++) {
      await a.evaluar(`(() => { const e = document.querySelectorAll('[aria-label="Opciones de la parada"]')[${i}]; e.scrollIntoView({ block: 'center' }); e.click(); return true })()`)
      await esp(700)
      const info = await a.evaluar(`(() => { const h = document.querySelector('[data-hoja-opciones]'); const t = Array.from(h?.querySelectorAll('[data-opcion-hoja]') ?? []).find((b) => /Cambiar parada/.test(b.innerText)); return { hoja: Boolean(h), titulo: h?.querySelector('[data-hoja-opciones-titulo]')?.innerText ?? null, hay: Boolean(t), off: t?.dataset.deshabilitada === '1' } })()`)
      if (info.hay && !info.off) {
        paradaCambiada = info.titulo
        await clic(a, "Array.from(document.querySelector('[data-hoja-opciones]').querySelectorAll('[data-opcion-hoja]')).find((b) => /Cambiar parada/.test(b.innerText))")
        abierto = true
      } else {
        await clic(a, "document.querySelector('[data-hoja-opciones] [data-hoja-cerrar]')")
        await esp(500)
      }
    }
    paso('menu abierto: ' + abierto)
    debe(abierto, '1e', 'no he podido abrir «Cambiar parada» desde los tres puntitos de una parada')
    await cuando(a, "Boolean(document.querySelector('[data-pregunta-cambiar-parada]'))", 80)
    await esp(2500)
    const franja = await a.evaluar(`(() => { const f = document.querySelector('[data-pregunta-cambiar-parada]'); if (!f) return null; const x = f.querySelector('[data-cancelar-cambio]'); const r = f.getBoundingClientRect(); return { texto: f.innerText.replace(/\\s+/g, ' ').trim(), cruz: Boolean(x), cruzAncho: x ? Math.round(x.getBoundingClientRect().width) : 0, derecha: Math.round(r.right), ancho: Math.round(r.width) } })()`)
    debe(franja && /^Elige el sitio que cambia por (el |la |los |las )?\S+/.test(franja.texto), '1e', `la franja dice «Elige el sitio que cambia por …» (${JSON.stringify(franja)})`)
    debe(franja && paradaCambiada && franja.texto.toLowerCase().includes(String(paradaCambiada).toLowerCase().split(' ')[0]), '1e', `la franja nombra la parada que se cambia (${paradaCambiada})`)
    debe(franja && franja.cruz && franja.cruzAncho >= 32 && franja.derecha <= 390, '1e', 'la franja lleva su ✕ y cabe en el móvil')
    const filas = await a.evaluar(`(() => { const sw = Array.from(document.querySelectorAll('[data-cambiar-por]')); const fila = sw[0]?.closest('div.relative'); return { n: sw.length, conCorazon: sw.filter((b) => b.closest('div.relative')?.querySelector('[data-me-gusta], button[aria-label*="gusta" i]')).length, mas: Array.from(document.querySelectorAll('div.relative.flex')).filter((d) => d.className.includes('h-[88px]') && d.querySelector('button[aria-label^="Añadir "]')).length, enRuta: (document.body.innerText.match(/✓ En ruta/g) || []).length, yaEnViaje: (document.body.innerText.match(/Ya en tu viaje/g) || []).length, trazo: sw[0]?.querySelector('svg path')?.getAttribute('d') ?? null } })()`)
    debe(filas.n >= 3, '1e', `salen los sitios con su ⇄ (${filas.n})`)
    debe(filas.mas === 0, '1e', 'en «Cambiar parada» no queda ningún «+ Añadir»')
    debe(filas.enRuta >= 1 && filas.yaEnViaje === 0, '1e', `los que ya están en la ruta dicen «En ruta» (${filas.enRuta}, «Ya en tu viaje»: ${filas.yaEnViaje})`)
    const corazones = await a.evaluar(`(() => Array.from(document.querySelectorAll('[data-cambiar-por]')).slice(0, 3).map((b) => Boolean(b.closest('div.relative.flex')?.querySelector('[data-megusta="tarjeta"]'))))()`)
    debe(corazones.length >= 1 && corazones.every(Boolean), '1e', `cada fila lleva su corazón (${JSON.stringify(corazones)})`)
    await a.captura(foto('cambiar_parada_explorar'))

    // Tocar el resto de la fila: la información del sitio con «Cambiar por este».
    const nombreFila = await a.evaluar(`(() => { const b = document.querySelector('[data-cambiar-por]'); const n = b?.dataset.cambiarPor; const fila = b?.closest('div.relative.flex'); fila?.querySelector('button')?.click(); return n })()`)
    await cuando(a, "Boolean(document.querySelector('[data-ficha-panel]'))", 60)
    await esp(2500)
    const ficha = await a.evaluar(`(() => { const p = document.querySelector('[data-ficha-panel]'); const b = Array.from(document.querySelectorAll('button')).find((x) => /^Cambiar por este/.test((x.innerText || '').trim())); return { ficha: Boolean(p), boton: b ? b.innerText.trim() : null, pestanas: Boolean(p?.querySelector('[data-ficha-pestanas]')) } })()`)
    debe(ficha.ficha && ficha.boton === 'Cambiar por este', '1e', `al tocar la fila se ve la información del sitio con el botón «Cambiar por este» (${JSON.stringify(ficha)})`)
    await a.captura(foto('cambiar_parada_informacion'))
    await clic(a, "document.querySelector('button[aria-label=\"Volver\"]')")
    await esp(1000)

    // El ⇄ cambia la parada, con aviso y [Deshacer].
    await clic(a, `document.querySelector('[data-cambiar-por=${JSON.stringify(nombreFila)}]')`)
    await esp(3500)
    const despues = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days[0].stops.map((x) => x.name))`)
    debe(despues.includes(nombreFila) && !despues.includes(paradaCambiada) || despues.some((n) => n.includes(nombreFila.split(' ')[0])), '1e', `el ⇄ cambia la parada por ${nombreFila} (antes ${JSON.stringify(nombresAntes.slice(0, 4))}, ahora ${JSON.stringify(despues.slice(0, 4))})`)
    const aviso = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Deshacer$/.test((x.innerText || '').trim())); return { hay: Boolean(b), pantalla: Boolean(document.querySelector('[data-pregunta-cambiar-parada]')) } })()")
    debe(aviso.hay && !aviso.pantalla, '1e', `tras el ⇄ vuelve a DÍAS con el aviso y [Deshacer] (${JSON.stringify(aviso)})`)
    await a.captura(foto('cambiar_parada_aviso'))
    await clic(a, "Array.from(document.querySelectorAll('button')).find((x) => /^Deshacer$/.test((x.innerText || '').trim()))")
    await esp(1500)
    const vuelta = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days[0].stops.map((x) => x.name))`)
    debe(JSON.stringify(vuelta) === JSON.stringify(nombresAntes), '1e', `[Deshacer] devuelve la parada (${JSON.stringify(vuelta.slice(0, 4))})`)

    // La ✕ cancela sin tocar nada.
    for (let i = 0; i < 6; i++) {
      await a.evaluar(`(() => { const e = document.querySelectorAll('[aria-label="Opciones de la parada"]')[${i}]; e?.scrollIntoView({ block: 'center' }); e?.click(); return true })()`)
      await esp(700)
      const ok = await clic(a, "Array.from(document.querySelector('[data-hoja-opciones]')?.querySelectorAll('[data-opcion-hoja]') ?? []).find((b) => /Cambiar parada/.test(b.innerText) && b.dataset.deshabilitada !== '1')")
      if (ok) break
      await clic(a, "document.querySelector('[data-hoja-opciones] [data-hoja-cerrar]')")
      await esp(500)
    }
    await cuando(a, "Boolean(document.querySelector('[data-cancelar-cambio]'))", 80)
    await clic(a, "document.querySelector('[data-cancelar-cambio]')")
    await esp(1200)
    const cerrada = await a.evaluar("!document.querySelector('[data-pregunta-cambiar-parada]')")
    const igual = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days[0].stops.map((x) => x.name))`)
    debe(cerrada && JSON.stringify(igual) === JSON.stringify(nombresAntes), '1e', 'la ✕ cierra EXPLORAR sin cambiar nada')
  } finally {
    a.cerrar()
  }
}

fin('pruebaTanda10N6_explorar')
