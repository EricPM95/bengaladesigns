// Tanda 10N9 (agente de pantallas) · §3b «Mis viajes» con los chips de Design, §4 la lista del pase (10N10, 8b: antes, la película) sin textos pisados ni cortados en 390x664 y 375x667 (con medida de verdad),
// §5 «Abierto 24 h» en la Fontana di Trevi y no en el Teatro de Marcelo (9:00-19:00).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N9_pantallas.mjs
// Capturas: docs/dias/capturas_jutrip/10n9_*.jpg; las de Design al lado (SIN_DESIGN=1 las salta). SOLO=viajes|pelicula|24h para correr una parte.
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, modulo, esp, cuando, clicEn, abrirPase, modo, store, preparar } from './_10n6_k3_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const { debe, fin } = preparar()
const SAL = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SAL, { recursive: true })
const foto = (n) => path.join(SAL, `10n9_${n}.jpg`)
const toca = (p) => !process.env.SOLO || process.env.SOLO === p
const leer = (f) => fs.readFileSync(f, 'utf8')

/* 0. El código (sin navegador) */
if (toca('viajes')) {
  console.log('0. Código: la tarjeta de Mis viajes como Design')
  const t = leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx')
  const cuerpo = leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')
  debe(/enFila\.length \+ \(antes > 0 \? 1 : 0\) <= 1 \? '100%' : '60%'/.test(cuerpo), 'ancho', 'un viaje = 100 %, varios = 60 %')
  debe(/height: 150/.test(t) && /width: 38, height: 38/.test(t) && /400 34px\/1 'Instrument Serif'/.test(t), 'medidas', 'portada 150, cámara 38, destino 34 px serif')
  debe(/linear-gradient\(135deg,#F3E2B0,#D2B67A 55%,#B58A2E\)/.test(t) && /height: 52/.test(t) && /700 15\.5px 'Geist'/.test(t), 'boton', 'botón dorado de 52 px, 15,5 px, el degradado de Design')
  debe(/background: '#F1EADC'/.test(t) && /height: 26/.test(t) && /#4A3C28/.test(t), 'chips', 'chips #F1EADC de 26 px')
  debe(/En \$\{n\} días/.test(t), 'chips', '«En N días» en la etiqueta')
}

/* A. Mis viajes */
if (toca('viajes')) {
  console.log('A. Mis viajes: un viaje (a todo el ancho) y varios (al 60 %)')
  const MIDE = `(() => {
    const f = document.querySelector('[data-fila-de-viajes]'); if (!f) return null
    const t = Array.from(f.querySelectorAll('[data-tarjeta-de-viaje]'))
    return { modo: f.dataset.anchoTarjeta, fila: Math.round(f.getBoundingClientRect().width), tarjetas: t.map((c) => {
      const r = c.getBoundingClientRect(); const bt = c.querySelector('[data-abrir-este-viaje]'); const cam = c.querySelector('[data-cambiar-portada]')
      const chips = Array.from(c.querySelectorAll('[data-chip-del-viaje]')).map((x) => x.innerText.trim())
      const et = c.querySelector('[data-etiqueta-texto]'); const nombre = c.querySelector('[data-fechas-del-viaje]')?.previousElementSibling
      const cr = (e) => e ? Math.round(e.getBoundingClientRect().height) : null
      return { id: c.dataset.tarjetaDeViaje, etiq: c.dataset.etiquetaDeViaje, w: Math.round(r.width), x: Math.round(r.left), alto: Math.round(r.height), etiqueta: et?.innerText.trim(), fechas: c.querySelector('[data-fechas-del-viaje]')?.innerText.trim(), chips,
        chipAlto: c.querySelector('[data-chip-del-viaje]') ? cr(c.querySelector('[data-chip-del-viaje]')) : null, botonAlto: cr(bt), botonTxt: bt?.innerText.trim(), botonFondo: bt ? getComputedStyle(bt).backgroundImage.slice(0, 40) + '|' + getComputedStyle(bt).backgroundColor : null,
        camAncho: cam ? Math.round(cam.getBoundingClientRect().width) : null, nombreSize: nombre ? getComputedStyle(nombre).fontSize : null, portadaAlto: Math.round(c.firstElementChild.firstElementChild.getBoundingClientRect().height) } }) }
  })()`
  let b
  try {
    b = await conViaje({ ancho: 390, alto: 844, version: 'pago', ruta: '/?cuentas=off&logros=off&version=pago&apertura=0' })
    await b.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
    await cuando(b, "Boolean(document.querySelector('[data-fila-de-viajes]'))", 60)
    await esp(1200)
    const solo = await b.evaluar(MIDE)
    console.log('   un viaje:', JSON.stringify(solo))
    debe(solo && solo.tarjetas.length === 1 && solo.modo === '100%' && solo.tarjetas[0].w >= solo.fila - 44, 'ancho', `un solo viaje: la tarjeta a todo el ancho (${solo?.tarjetas[0]?.w} de ${solo?.fila})`)
    const c = solo?.tarjetas[0]
    if (c) {
      debe(c.portadaAlto === 150 && c.camAncho === 38 && c.nombreSize === '34px' && c.chipAlto === 26 && c.botonAlto === 52, 'medidas', `medidas de Design: portada 150, cámara 38, destino 34, chip 26, botón 52 (${c.portadaAlto}/${c.camAncho}/${c.nombreSize}/${c.chipAlto}/${c.botonAlto})`)
      if (c.etiq === 'hecho') {
        debe(c.chips.length >= 1 && /^\d+ paradas?$/.test(c.chips[0]) && c.chips.slice(1).every((x) => /^\d+ fotos?$/.test(x)), 'chips', `viaje ya hecho: «N paradas» y, si hay, «N fotos» (${JSON.stringify(c.chips)})`)
        debe(c.etiqueta === 'Hecho' && /rgb\(28, 34, 48\)/.test(c.botonFondo ?? ''), 'boton', `viaje ya hecho: etiqueta «Hecho» y botón azul oscuro (${c.etiqueta} · ${c.botonFondo})`)
      } else {
        debe(c.chips.length === 3 && /^\d+ días?$/.test(c.chips[0]) && /^\d+ noches?$/.test(c.chips[1]) && /^\d+ paradas?$/.test(c.chips[2]), 'chips', `chips «N días · N noches · N paradas» (${JSON.stringify(c.chips)})`)
        const nDias = Number((/^(\d+)/.exec(c.chips[0]) ?? [])[1])
        const nNoches = Number((/^(\d+)/.exec(c.chips[1]) ?? [])[1])
        debe(nNoches === nDias - 1, 'chips', `las noches son los días menos uno (${nDias} / ${nNoches})`)
        debe(/^(En \d+ días|Mañana|Hoy|Próximo|En curso)$/.test(c.etiqueta ?? ''), 'chips', `la etiqueta de arriba (${c.etiqueta})`)
        debe(/linear-gradient/.test(c.botonFondo ?? ''), 'boton', `botón dorado (${c.botonFondo})`)
      }
      debe(c.botonTxt === 'Abrir este viaje', 'boton', `el texto del botón (${c.botonTxt})`)
      debe(!/ · \d+ días?$/.test(c.fechas ?? ''), 'chips', `las fechas de la portada van solas, sin «· N días» (${c.fechas})`)
    }
    await b.captura(foto('mis_viajes'))
  } catch (e) {
    debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
  } finally {
    try { b?.cerrar() } catch { /* ya cerrado */ }
  }

  let a
  try {
    a = await conViaje({ ancho: 390, alto: 844, version: 'pago' })
    await a.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
    await cuando(a, "Boolean(document.querySelector('[data-fila-de-viajes]'))", 60)
    await esp(900)
    await a.evaluar(`Promise.all([${modulo('/src/store/useSyncStore.ts')}, ${modulo('/src/components/sync/TripSync.tsx')}]).then(([s, t]) => {
      const base = t.buildTripPayload()
      const hoy = new Date()
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      const mas = (n) => new Date(hoy.getTime() + n * 86400000)
      const crear = (id, destino, ini, fin) => ({ ...base, id, route: { ...base.route, id, destination: destino, answers: { ...base.route.answers, dateRange: { start: iso(mas(ini)), end: iso(mas(fin)) } } }, generationState: null })
      s.useSyncStore.getState().setSavedTrips([crear('t-curso', 'Florencia', -1, 2), crear('t-prox', 'París', 12, 15), crear('t-hecho', 'Roma', -60, -57)])
      return true
    })`)
    await esp(1800)
    const varios = await a.evaluar(MIDE)
    console.log('   varios viajes:', JSON.stringify(varios))
    debe(varios && varios.modo === '60%' && varios.tarjetas.length >= 2 && Math.abs(varios.tarjetas[0].w / (varios.fila - 40) - 0.6) < 0.03, 'ancho', `con varios, cada tarjeta al 60 % (${JSON.stringify(varios?.tarjetas.map((x) => x.w))} de ${varios?.fila})`)
    const por = (e) => varios?.tarjetas.find((x) => x.etiq === e)
    debe(por('en_curso')?.etiqueta === 'En curso', 'chips', `el viaje en curso: «${por('en_curso')?.etiqueta}»`)
    debe(por('proximo')?.etiqueta === 'En 12 días', 'chips', `el próximo, dentro de 12 días: «${por('proximo')?.etiqueta}» (cuenta atrás hasta el primer día)`)
    debe(por('proximo')?.chips.length === 3 && /^4 días$/.test(por('proximo').chips[0]) && /^3 noches$/.test(por('proximo').chips[1]), 'chips', `el próximo: «4 días · 3 noches · N paradas» (${JSON.stringify(por('proximo')?.chips)})`)
    debe(por('hecho')?.etiqueta === 'Hecho' && por('hecho')?.chips.some((x) => /parada/.test(x)), 'chips', `el ya hecho: «Hecho» y sus paradas (${JSON.stringify(por('hecho')?.chips)})`)
    debe(por('hecho') && /rgb\(28, 34, 48\)/.test(por('hecho').botonFondo ?? ''), 'boton', `el botón del viaje ya hecho, azul oscuro con letra dorada (${por('hecho')?.botonFondo})`)
    await a.captura(foto('mis_viajes_varios'))
  } catch (e) {
    debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
  } finally {
    try { a?.cerrar() } catch { /* ya cerrado */ }
  }
  if (process.env.SIN_DESIGN !== '1') {
    const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
    for (const [re, salida] of [['/^01 · /', 'mis_viajes_design'], ['/^02 · /', 'mis_viajes_hecho_design']])
      await capturarDesign('Piezas/Mis Viajes Tarjeta.dc.html', foto(salida), { despues: ir(re) }).catch((e) => console.log('  (sin captura de Design)', e.message))
  }
}

/* B. La lista del pase (Tanda 10N10, 8b: antes, la película con todas sus escenas): ningún texto se pisa ni se corta */
if (toca('pelicula')) {
  console.log('B. La lista del pase, en 390x664 y 375x667 (cerrada y con «¿Cuántos sois?» abierta)')
  // Mide: ningún texto sale por los lados de la pantalla, ninguno queda cortado por su caja (scrollWidth > clientWidth con overflow oculto) y dos textos visibles no se tapan entre sí.
  const MIDE = `(() => {
    const P = document.querySelector('[data-lista-del-pase]'); const vw = innerWidth, vh = innerHeight
    const lista = P.querySelector('[data-lista-pase]'); const lr = lista ? lista.getBoundingClientRect() : null
    const hojas = Array.from(P.querySelectorAll('span')).filter((e) => e.children.length === 0 && (e.textContent || '').trim())
    const fuera = [], cortados = [], pisadas = []
    const cajas = []
    const tituloHoja = Array.from(P.querySelectorAll('span')).find((x) => x.children.length === 0 && x.textContent.trim() === '¿Cuántos sois?')
    const hoja = tituloHoja ? tituloHoja.closest('div[style*="border-radius: 30px"]') : null
    for (const e of hojas) {
      const cs = getComputedStyle(e)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      let op = 1
      for (let p = e; p && p !== P; p = p.parentElement) op *= Number(getComputedStyle(p).opacity)
      if (op < 0.2) continue
      const b = e.getBoundingClientRect()
      if (b.width < 2 || b.height < 2) continue
      // lo que la lista tiene fuera de su caja (por el scroll) no cuenta
      const enLista = lista && lista.contains(e)
      if (enLista && (b.bottom < lr.top || b.top > lr.bottom)) continue
      if (b.bottom < 0 || b.top > vh) continue
      const t = (e.textContent || '').trim().slice(0, 40)
      if (b.left < -0.5 || b.right > vw + 0.5) fuera.push(t)
      for (let p = e; p && p !== P; p = p.parentElement) { const c = getComputedStyle(p); if (/(hidden|clip)/.test(c.overflowX) && p.scrollWidth > p.clientWidth + 1 && !/^(ellipsis)$/.test(c.textOverflow) && p.clientWidth > 0 && p.scrollWidth > p.clientWidth + 3 && p !== lista) { cortados.push(t); break } }
      cajas.push({ t, x: b.left, y: b.top, r: b.right, b: b.bottom, el: e, capa: hoja && hoja.contains(e) ? 'hoja' : enLista ? 'lista' : 'fijo' })
    }
    for (let a = 0; a < cajas.length; a++) for (let c = a + 1; c < cajas.length; c++) {
      const A = cajas[a], B = cajas[c]
      // (solo se comparan textos de la MISMA capa: las filas de la lista pasan por debajo de la parte fija de abajo, y con «¿Cuántos sois?» abierta la lista queda tapada por la hoja)
      if (A.capa !== B.capa || (hoja && A.capa !== 'hoja')) continue
      const ox = Math.min(A.r, B.r) - Math.max(A.x, B.x), oy = Math.min(A.b, B.b) - Math.max(A.y, B.y)
      if (ox > 3 && oy > 3 && !A.el.contains(B.el) && !B.el.contains(A.el)) {
        // (se mira lo que de verdad se ve en el punto central de la zona compartida)
        const px = Math.max(A.x, B.x) + ox / 2, py = Math.max(A.y, B.y) + oy / 2
        const top = document.elementFromPoint(px, py)
        if (top === A.el || top === B.el) pisadas.push(A.t + ' / ' + B.t)
      }
    }
    return { n: cajas.length, fuera, cortados, pisadas, escx: Math.round(P.querySelector('[data-escenario]').getBoundingClientRect().width) }
  })()`
  for (const [w, h] of [[390, 664], [375, 667]]) {
    const a = await conViaje({ ancho: w, alto: h })
    try {
      await abrirPase(a)
      await cuando(a, "/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 60)
      await esp(1500)
      let m = await a.evaluar(MIDE)
      debe(m.n > 10, 'texto', `${w}x${h} · la lista: se lee texto (${m.n} piezas)`)
      debe(m.fuera.length === 0 && m.cortados.length === 0, 'texto', `${w}x${h} · la lista: ningún texto sale de la pantalla ni queda cortado (${JSON.stringify([...m.fuera.slice(0, 2), ...m.cortados.slice(0, 2)])})`)
      debe(m.pisadas.length === 0, 'texto', `${w}x${h} · la lista: ningún texto pisa a otro (${m.pisadas.slice(0, 3).join(' | ') || 'ninguno'})`)
      await a.captura(foto(`lista_${w}x${h}`))
      // «¿Cuántos sois?»
      await a.evaluar("(() => { const e = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => x.children.length === 0 && x.textContent.trim() === 'Elegir mi pase'); if (e) e.click(); return true })()")
      await cuando(a, "/¿Cuántos sois\\?/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')", 20)
      await esp(1200)
      m = await a.evaluar(MIDE)
      debe(m.fuera.length === 0 && m.cortados.length === 0, 'texto', `${w}x${h} · «¿Cuántos sois?»: ningún texto sale de la pantalla ni queda cortado (${JSON.stringify([...m.fuera.slice(0, 2), ...m.cortados.slice(0, 2)])})`)
      debe(m.pisadas.length === 0, 'texto', `${w}x${h} · «¿Cuántos sois?»: ningún texto pisa a otro (${m.pisadas.slice(0, 3).join(' | ') || 'ninguno'})`)
      await a.captura(foto(`lista_cuantos_${w}x${h}`))
    } finally {
      a.cerrar()
    }
  }
}

/* C. Abierto 24 h */
if (toca('24h')) {
  console.log('C. «Abierto 24 h»: la Fontana sí, el Teatro de Marcelo no (9:00-19:00)')
  const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
  const sitio = (n) => roma.places.find((p) => p.name === n)
  debe(sitio('Fontana de Trevi')?.abierto_24h === true, '24h', 'datos: la Fontana de Trevi lleva abierto_24h')
  debe(sitio('Teatro de Marcelo')?.abierto_24h == null && sitio('Teatro de Marcelo')?.schedule === '09:00-19:00' && JSON.stringify(sitio('Teatro de Marcelo')?.windows) === '["09:00-19:00"]', '24h', 'datos: el Teatro de Marcelo, sin abierto_24h y con schedule 09:00-19:00 (el mismo formato que Colle Oppio)')
  debe(roma.places.filter((p) => p.abierto_24h).length === 37, '24h', `datos: quedan 37 sitios con abierto_24h (${roma.places.filter((p) => p.abierto_24h).length})`)
  debe(roma.places.filter((p) => p.abierto_24h && p.schedule).length === 0, '24h', 'datos: ningún sitio con abierto_24h tiene también horario')

  const a = await conViaje({ version: 'pago', ancho: 390, alto: 844 })
  try {
    await modo(a, 'days', 0)
    const dias = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days.map((d) => d.stops.filter((x) => !x.isBreak && !x.isFreeTour).map((x) => x.name)))`)
    console.log('   paradas', dias.map((d, i) => i + ': ' + d.join(', ')).join(' // '))
    const abrirFicha = async (nombre) => {
      await a.evaluar(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)} || x.textContent.startsWith(${JSON.stringify(nombre + ',')})); tit?.scrollIntoView({ block: 'center' }); tit?.click(); return true })()`)
      return cuando(a, "Boolean(document.querySelector('[data-ficha-panel] [data-ficha-cabecera]'))", 60)
    }
    const etiquetas = () => a.evaluar(`(() => { const c = document.querySelector('[data-ficha-cabecera]'); return { nombre: c.querySelector('h1')?.innerText, e: [...c.querySelectorAll('[data-etiqueta-ficha]')].map((x) => ({ t: x.innerText.trim(), color: getComputedStyle(x).color })) } })()`)
    const volver = async () => { await a.evaluar(`(() => { document.querySelector('[aria-label="Volver"]')?.click(); return true })()`); await esp(800) }

    // La Fontana de Trevi (la ficha, como la ve el viajero).
    let di = dias.findIndex((d) => d.includes('Fontana de Trevi'))
    if (di < 0) { // si la ruta de prueba no la lleva, se cambia el nombre de una parada: la ficha lee los datos por el nombre
      await a.evaluar(`${store}.then((s) => { const st = s.useRouteStore.getState(); const r = structuredClone(st.route); const p = r.days[0].stops.find((x) => !x.isBreak && !x.isFreeTour && !x.isFreeWalk); p.name = 'Fontana de Trevi'; delete p.hours; delete p.scheduleText; delete p.hoursData; s.useRouteStore.setState({ route: r }); return true })`)
      di = 0
      await esp(1500)
    }
    await modo(a, 'days', di)
    debe(await abrirFicha('Fontana de Trevi'), '24h', 'se abre la ficha de la Fontana de Trevi')
    await esp(1500)
    const trevi = await etiquetas()
    debe(trevi.e.some((q) => q.t === 'Abierto 24 h' && /43, 127, 69/.test(q.color)), '24h', `Fontana de Trevi: «Abierto 24 h» en verde (${JSON.stringify(trevi.e)})`)
    await a.captura(foto('trevi_24h'))
    await volver()

    // El Teatro de Marcelo: se mira la ficha con su horario; si la ruta de prueba no lo lleva, una parada pasa a llamarse así.
    await a.evaluar(`${store}.then((s) => { const st = s.useRouteStore.getState(); const r = structuredClone(st.route); const todos = r.days.flatMap((d) => d.stops); let p = todos.find((x) => x.name === 'Teatro de Marcelo'); if (!p) { p = r.days[0].stops.find((x) => !x.isBreak && !x.isFreeTour && !x.isFreeWalk && x.name !== 'Fontana de Trevi'); p.name = 'Teatro de Marcelo' } delete p.hours; delete p.scheduleText; delete p.hoursData; s.useRouteStore.setState({ route: r }); return true })`)
    await esp(1500)
    const dias2 = await a.evaluar(`${store}.then((s) => s.useRouteStore.getState().route.days.map((d) => d.stops.map((x) => x.name)))`)
    const dm = dias2.findIndex((d) => d.includes('Teatro de Marcelo'))
    await modo(a, 'days', dm)
    const abre = await abrirFicha('Teatro de Marcelo')
    debe(abre, '24h', 'se abre la ficha del Teatro de Marcelo')
    if (abre) {
      await esp(2500)
      const m = await etiquetas()
      debe(!m.e.some((q) => q.t === 'Abierto 24 h'), '24h', `Teatro de Marcelo: SIN «Abierto 24 h» (${JSON.stringify(m.e.map((q) => q.t))})`)
      debe(m.e.some((q) => /9:00|09:00/.test(q.t) && /19:00/.test(q.t)) || m.e.some((q) => /19/.test(q.t)), '24h', `Teatro de Marcelo: lleva su horario 9:00-19:00 (${JSON.stringify(m.e.map((q) => q.t))})`)
      await a.captura(foto('marcelo_horario'))
    }
    // El dato que usa la app: el parser de horarios entiende «09:00-19:00».
    const h = await a.evaluar(`${modulo('/src/lib/horarioDeParada.ts')}.then(async (m) => { const d = await m.cargaDatosDeHorario('Roma'); const x = d.get(m.normalizaNombre('Teatro de Marcelo')); const r = m.horarioDeParada({ hoursData: x, scheduleText: undefined, hours: undefined }, '2026-11-26'); return { x: x ? { schedule: x.schedule, abierto_24h: x.abierto_24h } : null, r: r ? { texto: JSON.stringify(r).slice(0, 240) } : null } })`)
    console.log('   horario leído por la app:', JSON.stringify(h))
    debe(h && h.x && h.x.schedule === '09:00-19:00' && !h.x.abierto_24h, '24h', 'la app lee del servidor el horario 09:00-19:00 del Teatro de Marcelo y sin abierto_24h (si falla: reiniciar la API tras tocar roma.json)')
    debe(h && h.r && /09:00|9:00/.test(h.r.texto) && /19:00/.test(h.r.texto), '24h', `el parser lo entiende (${h?.r?.texto})`)
  } catch (e) {
    debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
  } finally {
    a.cerrar()
  }
}

fin('pruebaTanda10N9_pantallas')
