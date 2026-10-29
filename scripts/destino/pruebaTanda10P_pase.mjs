// La prueba de la parte «pase» de la Tanda 10P (agente A): 1.2 la lista del pase (10N10, 8b: antes, la película) a todo el ancho del móvil, 1.4 la lista del pase solo con lo que existe, 1.7 el precio en la moneda del viajero.
// Hace falta el servidor y Vite (el coordinador pone APP_URL y API_URL: p. ej. APP_URL=http://localhost:5181 API_URL=http://localhost:8851 node scripts/destino/pruebaTanda10P_pase.mjs).
// Acaba imprimiendo «N comprobaciones · M fallos». Capturas a tamaño de móvil en docs/dias/capturas_jutrip/10p_pase_*.jpg.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { ahorroEnMoneda, importeEnsenado, maximoQueCobraStripe, pasoDeRedondeo, textoEnMoneda, monedaUsable, RECARGO_STRIPE } from '../../src/lib/precioMoneda.ts'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10p_pase_${n}.jpg`)
const BASE = process.env.APP_URL || 'http://localhost:5173'
const num = (t) => Number(String(t).replace(/\./g, '').replace(',', '.'))

/* ───────────────────────── 1. Los datos y el código ───────────────────────── */
{
  const aj = JSON.parse(leer('data/pase/lista_ajustes.json'))
  debe(aj.ocultas.includes('Modo «a mi aire»') && aj.ocultas.includes('El reto del día'), 'lista', 'lista_ajustes.json oculta «a mi aire» y «El reto del día»')
  debe(aj.textos['Invita a un amigo'] === 'Gana 200 EXP cuando haga su primer viaje con HOY', 'lista', 'la fila nueva de «Invita a un amigo» está en los ajustes')
  const lista = leer('src/lib/listaAjustada.ts')
  debe(/ajustes\.ocultas/.test(lista) && /ajustes\.textos/.test(lista), 'lista', 'listaAjustada.ts lee los ajustes (si Design cambia la lista, se siguen aplicando)')
  debe(/listaAjustada/.test(leer('src/lib/listaDeHoy.ts')), 'lista', '(10N11) HOY sale de la lista ajustada (la lista por puntos de Design ya no usa la lista ajustada)')
  debe(/lista_ajustes\.json/.test(leer('src/components/ajustes/AjustesScreen.tsx')) && /Invitar a un amigo/.test(leer('src/components/ajustes/AjustesScreen.tsx')), 'lista', 'la fila «Invitar a un amigo» de Ajustes lleva la misma línea de 200 EXP')
}

/* ───────────────────────── 2. Prueba pura: lo enseñado nunca es menos que lo cobrado ───────────────────────── */
{
  const tasas = { MXN: 21.0226, USD: 1.1193, COP: 3531.348, CLP: 1114.96, GBP: 0.83728, JPY: 175.51, IDR: 20268.06, BRL: 5.6485, PLN: 4.3945, CHF: 0.9227, KRW: 1482.46 }
  let peor = Infinity
  let casos = 0
  let sobra = 0
  for (const [codigo, tasa] of Object.entries(tasas)) {
    const m = { codigo, tasa }
    const paso = pasoDeRedondeo(tasa)
    const importes = [6.99, 10.99, 13.98, 5.5, 4.99, 20.97, 8.97]
    for (let n = 3; n <= 50; n++) importes.push(Math.round(4.99 * n * 100) / 100, Math.round(6.99 * n * 100) / 100)
    for (const e of importes) {
      const visto = importeEnsenado(e, m)
      const cobra = maximoQueCobraStripe(e, m)
      casos++
      peor = Math.min(peor, visto - cobra)
      if (visto + 1e-6 < cobra) sobra++
      debe(visto + 1e-6 >= cobra, 'nunca-mas', `${e} € en ${codigo}: se enseña ${visto} y Stripe cobraría como mucho ${cobra.toFixed(2)}`)
      debe(visto < cobra + paso + 1e-6, 'nunca-mas', `${e} € en ${codigo}: no se pasa más de un paso (${paso}) por arriba`)
      debe(Math.abs(visto / paso - Math.round(visto / paso)) < 1e-6, 'redondeo', `${e} € en ${codigo}: el número es múltiplo de ${paso}`)
    }
    // El tachado y el «Ahorras» cuadran.
    for (const [tachado, precio] of [[13.98, 10.99], [20.97, 14.97], [6.99 * 7, 4.99 * 7], [6.99 * 50, 4.99 * 50]]) {
      const a = ahorroEnMoneda(tachado, precio, m)
      const dif = num(/≈ ([\d.,]+)/.exec(a)[1])
      const t = num(/≈ ([\d.,]+)/.exec(textoEnMoneda(tachado, m))[1])
      const p = num(/≈ ([\d.,]+)/.exec(textoEnMoneda(precio, m))[1])
      debe(Math.abs(t - p - dif) < 1e-6, 'cuadra', `${codigo}: tachado ${t} − precio ${p} = ahorro ${dif}`)
    }
  }
  debe(casos > 1000 && sobra === 0, 'nunca-mas', `${casos} casos: en ninguno se enseña menos de lo que se cobraría (margen mínimo ${peor.toFixed(4)})`)
  debe(RECARGO_STRIPE === 1.04, 'nunca-mas', 'el margen es el 4 % (lo máximo de Adaptive Pricing)')
  debe(textoEnMoneda(6.99, { codigo: 'MXN', tasa: 21.0226 }) === '≈ 160 MXN', 'moneda', '6,99 € en pesos mexicanos se enseña «≈ 160 MXN» (cambio del día + 4 %, hacia arriba, de 10 en 10)')
  debe(!textoEnMoneda(6.99, null).includes('≈') && textoEnMoneda(6.99, null) === '6,99 €', 'moneda', 'en euros: «6,99 €» sin «≈»')
  debe(monedaUsable('XYZ', { MXN: 20 }) === null && monedaUsable('EUR', { MXN: 20 }) === null && monedaUsable('MXN', { MXN: 20 }).tasa === 20, 'moneda', 'sin cambio para una moneda no se inventa (sale en euros)')
}

/* ───────────────────────── 3. La app ───────────────────────── */
const esp = (ms) => new Promise((r) => setTimeout(r, ms))
async function conViaje({ ancho = 390, alto = 664, moneda = 'EUR' } = {}) {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','${moneda}')}catch(e){}; window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false }`
  const a = await abrirApp(BASE, { ancho, alto, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0', antes })
  for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(3500)
  for (let i = 0; i < 4; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
  return a
}
const abrirPase = (a) => a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
const cuando = async (a, js, veces = 40) => {
  for (let i = 0; i < veces; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const texto = (a) => a.evaluar("(document.querySelector('[data-lista-del-pase]')?.innerText ?? '').split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).join(' | ')")
/** El centro (visible) del elemento más pequeño cuyo texto es exactamente `t`, o del que lo CONTIENE si `contiene`. */
const centroDe = (a, t, contiene = false) =>
  a.evaluar(`(() => {
    const t = ${JSON.stringify(t)}
    const todos = Array.from(document.querySelectorAll('[data-lista-del-pase] *')).filter((x) => { const s = x.textContent.trim(); return ${contiene ? 's.includes(t)' : 's === t'} && x.getBoundingClientRect().width > 0 })
    const e = todos.sort((p, q) => p.textContent.length - q.textContent.length)[0]
    if (!e) return null
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowY === 'auto' && p.scrollHeight > p.clientHeight) {
        const pr = p.getBoundingClientRect(), er = e.getBoundingClientRect()
        if (er.top < pr.top || er.bottom > pr.bottom) p.scrollTop += er.top - pr.top - pr.height / 2
        break
      }
    }
    const r = e.getBoundingClientRect()
    return [r.x + r.width / 2, r.y + r.height / 2]
  })()`)
const clic = async (a, t, contiene = false) => {
  await centroDe(a, t, contiene) // (la primera vez solo desplaza la lista hasta el elemento)
  await esp(250)
  const c = await centroDe(a, t, contiene)
  if (!c) return false
  for (const type of ['mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x: c[0], y: c[1], button: 'left', clickCount: 1 })
  await esp(700)
  return true
}
const clicEn = async (a, x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) await a.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
  await esp(700)
}
const estado = (a) =>
  a.evaluar(`(() => {
    const raiz = document.querySelector('[data-lista-del-pase]')
    const r = raiz?.getBoundingClientRect()
    const anims = raiz ? raiz.getAnimations({ subtree: true }) : []
    return { izq: r?.left, der: r?.right, ancho: window.innerWidth, alto: window.innerHeight,
      sinTerminar: anims.filter((x) => x.playState === 'running' && x.effect?.getComputedTiming().iterations !== Infinity).length,
      sinTerminarLista: anims.filter((x) => x.playState === 'running' && x.effect?.getComputedTiming().iterations !== Infinity && x.effect.target?.closest('[data-lista-pase]')).length }
  })()`)

// 3a. (Tanda 10N11, apartado 5: la lista por puntos de Design) A tres anchos: sin márgenes, con scroll y [Elegir mi pase] al final de la lista, sin «a mi aire» ni «el reto del día».
for (const [ancho, alto, nombre] of [[390, 664, '01_final_390x664'], [430, 932, '02_final_430x932'], [360, 640, '03_final_360x640']]) {
  const a = await conViaje({ ancho, alto })
  await abrirPase(a)
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
  await esp(900)
  const t = await texto(a)
  debe(/Pase Roma/.test(t) && /Elegir mi pase/.test(t) && /Se paga una vez · No caduca/.test(t), 'final', `${ancho}x${alto}: «Pase Roma», la lista y [Elegir mi pase]`)
  debe(!/a mi aire/.test(t) && !/El reto del día/.test(t), 'lista', `${ancho}x${alto}: la lista sin «a mi aire» ni «el reto del día»`)
  const lista = await a.evaluar(`(() => {
    const l = document.querySelector('[data-lista-pase]')
    if (!l) return null
    const r = l.getBoundingClientRect()
    l.scrollTop = 0
    const antes = l.scrollTop
    l.scrollTop = 400
    const debajo = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 3)
    const res = { izq: r.left, der: r.right, scrollable: l.scrollHeight > l.clientHeight + 50, mueve: l.scrollTop > antes, recibeToques: Boolean(debajo && l.contains(debajo)) }
    l.scrollTop = l.scrollHeight
    const b = document.querySelector('[data-elegir-pase]').getBoundingClientRect()
    res.boton = b.bottom
    res.ventana = window.innerHeight
    return res
  })()`)
  debe(lista && lista.izq <= 0.5 && lista.der >= ancho - 0.5, 'ancho', `${ancho}x${alto}: la lista llega de lado a lado`)
  debe(lista && lista.scrollable && lista.mueve, 'scroll', `${ancho}x${alto}: la lista hace scroll`)
  debe(lista && lista.recibeToques, 'scroll', `${ancho}x${alto}: nada tapa la lista (los toques llegan a ella)`)
  debe(lista && lista.boton <= lista.ventana, 'scroll', `${ancho}x${alto}: con la lista al final, [Elegir mi pase] entero a la vista (${lista?.boton?.toFixed(0)} de ${lista?.ventana})`)
  await a.captura(foto(nombre))
  a.cerrar()
}

// 3b. (10N10, 8b: la película se quitó: ya no hay [Ver], [Saltar] ni «ya vista») El ✕ cierra la lista; al volver a abrir sale la lista YA colocada y [Elegir mi pase] abre la compra sin repetir la animación.
{
  const a = await conViaje({})
  await abrirPase(a)
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
  await esp(600)
  const antes = await a.evaluar("(() => { const c = document.querySelector('[data-pelicula-cerrar]'); return { ver: Boolean(document.querySelector('[data-pelicula-ver]')), cerrar: Boolean(c), saltar: Boolean(document.querySelector('[data-pelicula-saltar]')), musica: Boolean(document.querySelector('[data-pelicula-musica]')), cl: c?.getBoundingClientRect().left, cr: c?.getBoundingClientRect().right, ancho: window.innerWidth } })()")
  debe(antes.cerrar && !antes.ver && !antes.saltar && !antes.musica, 'ver', 'en la lista hay ✕ arriba y ya no [Ver], [Saltar] ni silencio')
  debe(antes.cl >= 0 && antes.cr <= antes.ancho, 'ver', 'el ✕ cabe en la pantalla')
  await a.captura(foto('05_lista_con_cerrar'))
  await a.evaluar("document.querySelector('[data-pelicula-cerrar]')?.click(); true")
  await esp(600)
  debe(!(await a.evaluar("Boolean(document.querySelector('[data-lista-del-pase]'))")), 'montada', 'el ✕ cierra la lista')
  await abrirPase(a)
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
  await esp(500)
  const e2 = await estado(a)
  const t2 = await texto(a)
  debe(e2.sinTerminar === 0 && /Elegir mi pase/.test(t2), 'montada', `al volver a abrir, la lista sale YA colocada a los 0,5 s (sin animaciones a medias: ${e2.sinTerminar})`)
  // Al tocar [Elegir mi pase] tampoco repite nada.
  await clic(a, 'Elegir mi pase')
  await esp(500)
  const e3 = await estado(a)
  debe(e3.sinTerminarLista === 0 && /¿Cuántos sois\?/.test(await texto(a)), 'montada', 'al tocar [Elegir mi pase] se abre la compra sin repetir la animación de la lista')
  a.cerrar()
}


// 3c. La moneda: EUR como siempre; MXN, USD y COP con «≈», tachado y «Ahorras» que cuadran.
const tasasDe = async () => (await (await fetch(`${process.env.API_URL || 'http://localhost:8787'}/api/cambio`)).json()).tasas
const tasas = await tasasDe()
for (const [moneda, orden] of [['EUR', '06'], ['MXN', '07'], ['USD', '08'], ['COP', '09']]) {
  const a = await conViaje({ moneda })
  await abrirPase(a)
  await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
  await esp(600)
  const fin = await texto(a)
  if (moneda === 'EUR') {
    debe(/6,99 €/.test(fin) && !/≈/.test(fin), 'eur', 'EUR: el final con «6,99 €» y sin «≈»')
  } else {
    const m = { codigo: moneda, tasa: tasas[moneda] }
    const grande = textoEnMoneda(6.99, m)
    debe(tasas[moneda] > 0 && fin.includes(grande) && fin.includes('6,99 €'), 'moneda', `${moneda}: el final con «${grande}» grande y «6,99 €» pequeño`)
  }
  await a.captura(foto(`${orden}_final_${moneda}`))
  await clic(a, 'Elegir mi pase')
  await esp(500)
  const hoja = await a.evaluar(`(() => {
    const filas = Array.from(document.querySelectorAll('[data-hoja-cuantos-sois] div')).filter((d) => /^(Pase de 1 persona|Pase Dúo|Pase Grupo)/.test(d.innerText.trim()) && d.style.borderRadius === '18px').map((d) => d.innerText.split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean))
    const compra = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((s) => /^Comprar/.test(s.textContent.trim()))
    return { filas, compra: compra?.textContent.trim(), pill: Array.from(document.querySelectorAll('[data-lista-del-pase] span')).some((s) => s.textContent.trim() === ${JSON.stringify(moneda)}) }
  })()`)
  debe(hoja.filas.length === 3 && hoja.pill, 'moneda', `${moneda}: «¿Cuántos sois?» con sus 3 pases y la pastilla de moneda («${moneda}»)`)
  const [uno, duo, grupo] = hoja.filas
  if (moneda === 'EUR') {
    const todo = hoja.filas.flat().join(' ')
    debe(!/≈/.test(todo) && !/≈/.test(hoja.compra) && /6,99 €/.test(uno.join(' ')) && /Ahorras 2,99 €/.test(duo.join(' ')), 'eur', 'EUR: la hoja como siempre (6,99 €, «Ahorras 2,99 €», sin «≈»)')
    debe(/Comprar · 19,96 €/.test(hoja.compra), 'eur', `EUR: [Comprar · 19,96 €] (${hoja.compra})`)
  } else {
    for (const [nom, fila, esperadoUnit] of [['Dúo', duo, null], ['Grupo', grupo, null]]) {
      const t = fila.join(' | ')
      const ahorra = num((/Ahorras ≈ ([\d.,]+)/.exec(t) ?? [])[1])
      const resto = t.replace(/Ahorras ≈ [\d.,]+ [A-Z]{3}/, '').replace(/≈ [\d.,]+ [A-Z]{3} cada uno/, '')
      const cifras = [...resto.matchAll(/≈ ([\d.,]+) ([A-Z]{3})/g)].map((x) => num(x[1]))
      const [tachado, precio] = cifras
      debe(Number.isFinite(ahorra) && cifras.length === 2 && Math.abs(tachado - precio - ahorra) < 1e-6, 'cuadra', `${moneda} ${nom}: tachado ${tachado} − precio ${precio} = Ahorras ${ahorra}`)
      debe(/cada uno/.test(t) && /€/.test(t), 'moneda', `${moneda} ${nom}: «≈ … cada uno» y los euros pequeños debajo`)
      void esperadoUnit
    }
    const unoGrande = textoEnMoneda(6.99, { codigo: moneda, tasa: tasas[moneda] })
    debe(uno.join(' ').includes(unoGrande) && /6,99 €/.test(uno.join(' ')), 'moneda', `${moneda}: pase de 1 persona «${unoGrande}» y «6,99 €» debajo`)
    debe(/^Comprar · ≈ [\d.,]+ [A-Z]{3}$/.test(hoja.compra), 'moneda', `${moneda}: [${hoja.compra}]`)
    // Nunca más de lo que se vio: el botón es lo que Stripe cobraría como mucho, redondeado hacia arriba.
    const mostrado = num(/≈ ([\d.,]+)/.exec(hoja.compra)[1])
    const maximo = maximoQueCobraStripe(4.99 * 4, { codigo: moneda, tasa: tasas[moneda] })
    debe(mostrado + 1e-6 >= maximo, 'nunca-mas', `${moneda}: se enseña ${mostrado} y Stripe cobraría como mucho ${maximo.toFixed(2)}`)
  }
  await a.captura(foto(`${orden}_compra_${moneda}`))
  if (moneda === 'MXN') {
    // La hoja «Moneda»: la elegida con borde de oro, y se puede cambiar.
    // (10N8) La hoja del pase cambió de sitio: se toca la pastilla de la moneda (la redonda con el código de la moneda) por el DOM, no por un punto fijo.
    await a.evaluar("(() => { const p = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => x.style.borderRadius === '999px' && /^[A-Z]{3}\\b/.test(x.innerText.trim()) && x.style.fontFamily !== 'x' && x.getBoundingClientRect().width < 120); p?.click(); return Boolean(p) })()")
    await esp(700)
    const hm = await a.evaluar(`(() => {
      const filas = Array.from(document.querySelectorAll('[data-lista-del-pase] div')).filter((d) => d.style.borderRadius === '16px' && /^[A-Z]{3}\\s/.test(d.innerText.trim()))
      return { titulo: /Moneda/.test(document.querySelector('[data-lista-del-pase]').innerText), n: filas.length, oro: filas.filter((d) => d.style.border.includes('2px') ).map((d) => d.innerText.trim().split(String.fromCharCode(10))[0]), tieneCOP: filas.some((d) => d.innerText.startsWith('COP')), tieneEUR: filas.some((d) => d.innerText.startsWith('EUR')) }
    })()`)
    debe(hm.titulo && hm.n >= 10 && hm.oro.length === 1 && hm.oro[0] === 'MXN' && hm.tieneEUR && hm.tieneCOP, 'moneda', `la hoja «Moneda» (${hm.n} monedas, con COP y EUR) marca solo la elegida con borde de oro (${hm.oro})`)
    await a.captura(foto('10_hoja_moneda'))
    await clic(a, 'USD', false)
    await esp(500)
    const cambiada = await a.evaluar("(() => { const s = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => /^Comprar/.test(x.textContent.trim())); return [s?.textContent.trim(), document.querySelector('[data-lista-del-pase]').getAttribute('data-moneda'), localStorage.getItem('trazo:moneda-pase')] })()")
    debe(/≈/.test(cambiada[0] ?? '') && /USD$/.test(cambiada[0] ?? '') && cambiada[1] === 'USD' && cambiada[2] === 'USD', 'moneda', `se cambia la moneda ahí mismo (${cambiada[0]}) y se acuerda`)
  }
  a.cerrar()
}

// 3d. (Tanda 10N11, apartado 5) Ya no hay hoja «Todo lo que incluye»: la lista por puntos es todo lo que incluye. HOY sigue sacando «Con el pase tendrás» de la lista ajustada, sin las dos filas.
{
  const a = await conViaje({})
  const deLista = await a.evaluar("import('/src/lib/listaAjustada.ts').then((m) => m.LISTA_DEL_PASE.flatMap((g) => g.items.map((i) => i.titulo)))")
  debe(!deLista.some((x) => /a mi aire|reto del día/.test(x)) && deLista.includes('Invita a un amigo') && deLista.includes('Tu siguiente parada'), 'lista', 'la lista ajustada (la de HOY) sin las dos filas y con la fila nueva')
  const hoy = await a.evaluar("import('/src/lib/listaDeHoy.ts').then((m) => m.filasDeHoy().map((i) => i.titulo))")
  debe(hoy.length === 5 && !hoy.some((x) => /a mi aire|reto del día/.test(x)), 'lista', '«Con el pase tendrás» de HOY: las mismas 5 filas, sin las dos quitadas')
  a.cerrar()
}

if (fallos.length) {
  console.log(`\n${fallos.length} FALLOS de ${comprobaciones}:`)
  for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
}
console.log(`Tanda 10P (pase): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
