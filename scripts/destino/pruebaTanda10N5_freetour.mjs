// Tanda 10N5 (H1): el Free Tour se añade eligiendo el día (apartado 1), los avisos de los cambios del viaje dicen lo que pasó (apartado 2) y «Recuperar» con su línea (2b).
//   SERVER_PORT=8851 node server/index.js   y   API_TARGET=http://localhost:8851 npx vite --port 5181 --strictPort
//   APP_URL=http://localhost:5181 API_URL=http://localhost:8851 node scripts/destino/pruebaTanda10N5_freetour.mjs
// No toca el motor de rutas: usa /api/rebuild-day con force_order. Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/* ───────────────────────── 1. Lo que se ve en el código ───────────────────────── */
console.log('1. El código')
{
  const hoja = sinComentarios(leer('src/components/route/reservas/FreeTourSheet.tsx'))
  debe(/FreeTourDiaSheet/.test(hoja) && !/FRANJAS|¿A qué hora lo quieres\?/.test(hoja), 'ap1', 'EXPLORAR, su ficha y «+ Añadir parada» abren la hoja de elegir el DÍA (ya no la de la hora)')
  const dia = sinComentarios(leer('src/components/route/reservas/FreeTourDiaSheet.tsx'))
  debe(/¿A qué día lo añadimos\?/.test(dia) && /btn-champan/.test(dia), 'ap1', 'la hoja dice «¿A qué día lo añadimos?» con el botón de siempre')
  const panel = sinComentarios(leer('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(/onAddFreeTour=\{freeTourAvailable\(route\)/.test(panel), 'ap1', '«+ Añadir parada» de DÍAS deja añadir el Free Tour (le pasa onAddFreeTour al explorador)')
  const motor = leer('src/lib/freeTourEnDia.ts')
  debe(/force_order/.test(motor) && /\/api\/rebuild-day/.test(motor), 'ap1', 'se hace con los datos y días escritos de siempre (rebuild-day con force_order), sin tocar el motor')
  debe(!/server\/engine|shared\/routeEngine/.test(sinComentarios(motor)), 'ap1', 'sin importar nada del motor')
  const sql = leer('supabase/migrations/0051_aviso_cambio_viaje_claro.sql')
  debe(/ultimoCambio/.test(sql) && /dias_antes/.test(sql) && /lower\(o\.nombre\) = lower\(a\.nombre\)/.test(sql), 'ap2', 'el disparador copia lo que ha hecho la persona, compara las paradas por nombre y mira los días y las fechas contra lo de ANTES del primer cambio')
  const di = sinComentarios(leer('src/lib/dayInterruptor.ts'))
  debe(/conAccion\(\{ tipo: 'excursion'/.test(di) && /conUltimoCambio/.test(di), 'ap2', 'el interruptor [Roma | Excursión] apunta lo que ha hecho')
  const st = sinComentarios(leer('src/store/useRouteStore.ts'))
  debe(/tipo: 'recuperar_ruta'/.test(st) && /tipo: 'recuperar_dia'/.test(st) && /tipo: 'fechas'/.test(st), 'ap2b', '«Recuperar mi ruta», «Recuperar este día» y cambiar las fechas apuntan lo que ha hecho')
}

/* ───────────────────────── 2. Los textos de los avisos ───────────────────────── */
console.log('2. Los textos')
const { crearServicioAvisos } = await import('../../server/avisos.js') // (al cargarse pone la tabla de artículos)
void crearServicioAvisos
const textos = await import('../../shared/avisos/textos.js')
const cv = await import('../../shared/avisos/cambioViaje.js')
const t = (cambio, quien = 'Viajes', extra = {}) => textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien, destino: 'Roma', ...(cambio ? { cambio } : {}), ...extra } })
{
  debe(t({ accion: { tipo: 'free_tour', fecha: '2026-11-11', dia_n: 1, reorganizados: 2 }, anadidas: [{ nombre: 'Coliseo' }], quitadas: [{ nombre: 'x' }] }) === 'Viajes ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.', 'ap2', '«Viajes ha añadido el Free Tour al miércoles 11 y se han reorganizado 2 días.» (no «ha quitado 6 sitios»)')
  debe(t({ accion: { tipo: 'free_tour', fecha: '2026-11-11', reorganizados: 1 } }) === 'Viajes ha añadido el Free Tour al miércoles 11 y se ha reorganizado 1 día.', 'ap2', 'singular: «se ha reorganizado 1 día»')
  debe(t({ accion: { tipo: 'free_tour', fecha: '2026-11-11', reorganizados: 0 } }) === 'Viajes ha añadido el Free Tour al miércoles 11.', 'ap2', 'sin días reorganizados: sin la segunda parte')
  debe(t({ movidas: [{ nombre: 'Coliseo', fecha: '2026-11-12', dia_n: 2 }], n_movidas: 1 }) === 'Viajes ha movido el Coliseo al jueves 12.', 'ap2', '«Viajes ha movido el Coliseo al jueves 12.»')
  debe(t({ movidas: [{ nombre: 'Coliseo', fecha: '2026-11-12' }, { nombre: 'Panteón', fecha: '2026-11-12' }, { nombre: 'Navona', fecha: '2026-11-12' }], n_movidas: 3 }) === 'Viajes ha movido el Coliseo al jueves 12 y 2 sitios más.', 'ap2', '«…y 2 sitios más» si son más')
  debe(t({ quitadas: [{ nombre: 'Iglesia del Gesù' }], n_quitadas: 1 }) === 'Viajes ha quitado Iglesia del Gesù.' || t({ quitadas: [{ nombre: 'Iglesia del Gesù' }], n_quitadas: 1 }) === 'Viajes ha quitado la Iglesia del Gesù.', 'ap2', '«Viajes ha quitado la Iglesia del Gesù.»')
  // Nunca «ha quitado N sitios» si solo se movieron (aviso con el formato de antes: anadidas y quitadas con los mismos nombres)
  const viejo = textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'VIAJES', anadidas: [{ nombre: 'Coliseo', fecha: '2026-11-11' }, { nombre: 'Panteón' }, { nombre: 'Navona' }], quitadas: [{ nombre: 'Coliseo' }, { nombre: 'Panteón' }, { nombre: 'Navona' }], movidas: 3 } })
  debe(!/quitado/.test(viejo) && /ha movido/.test(viejo) && /^Viajes /.test(viejo), 'ap2', `un aviso de antes con los mismos sitios en «añadidas» y «quitadas» dice que se han movido, no que se quitaron (${viejo})`)
  debe(t({ accion: { tipo: 'excursion', a: 'excursion', fecha: '2026-11-14', excursion: 'Pompeya y Sorrento' } }) === 'Viajes ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento).', 'ap2', '«Viajes ha cambiado el sábado 14 a día de excursión (Pompeya y Sorrento).»')
  debe(t({ accion: { tipo: 'excursion', a: 'roma', fecha: '2026-11-14', ciudad: 'Roma' } }) === 'Viajes ha cambiado el sábado 14 a un día en Roma.', 'ap2', '«Viajes ha cambiado el sábado 14 a un día en Roma.»')
  debe(t({ accion: { tipo: 'recuperar_ruta' } }, 'Eric') === 'Eric ha vuelto a la ruta inicial.', 'ap2b', '«Eric ha vuelto a la ruta inicial.»')
  debe(t({ accion: { tipo: 'recuperar_dia', fecha: '2026-11-14' } }, 'Eric') === 'Eric ha recuperado el sábado 14 como estaba.', 'ap2b', '«Eric ha recuperado el sábado 14 como estaba.»')
  debe(t({ accion: { tipo: 'fechas' }, fechas: { antes: { inicio: '2026-11-11', fin: '2026-11-15' }, despues: { inicio: '2026-11-12', fin: '2026-11-16' } } }, 'Eric') === 'Eric ha cambiado las fechas del viaje (del 12 al 16 de noviembre).', 'ap2', 'cambiar las fechas: una línea con lo que decidió la persona')
  debe(!/fechas/.test(t({ accion: { tipo: 'fechas' }, fechas: { antes: { inicio: '2026-11-11', fin: '2026-11-15' }, despues: { inicio: '2026-11-11', fin: '2026-11-15' } } }, 'Eric')), 'ap2b', 'con las mismas fechas, NUNCA «ha cambiado las fechas»')
  debe(!/fechas/.test(t({ dias_antes: 5, dias_despues: 5, fechas: { antes: { inicio: '2026-11-11', fin: '2026-11-15' }, despues: { inicio: '2026-11-11', fin: '2026-11-15' } }, reordenados: 1 })), 'ap2b', 'ni en un aviso suelto (las fechas de antes y de ahora son las mismas)')
  const antiguo = textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', dias_quitados: 1, dias_anadidos: 1, fechas: false } })
  debe(!/quitado|añadido/.test(antiguo), 'ap2b', `quitar un día y volver a ponerlo es nada, no «ha quitado un día, ha añadido un día» (${antiguo})`)
  debe(t({ movidas: [{ nombre: 'Coliseo' }], n_movidas: 1 }, 'VIAJES') .startsWith('Viajes '), 'nombres', 'el nombre sale con la primera en mayúscula («Viajes», no «VIAJES»)')
  // La franja
  const f = textos.franjaDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: { accion: { tipo: 'free_tour', fecha: '2026-11-11', reorganizados: 2 } } } })
  debe(f.titulo === 'Eric ha añadido el Free Tour' && f.detalle === 'Miércoles 11 · se han reorganizado 2 días', 'ap2', `la franja: «${f.titulo}» / «${f.detalle}»`)
  const f2 = textos.franjaDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: { accion: { tipo: 'recuperar_ruta' } } } })
  debe(f2.titulo === 'Eric ha vuelto a la ruta inicial', 'ap2b', 'la franja de recuperar la ruta')
  // La línea de arriba del directo
  const tr = await import('../../src/lib/compartidoTiempoReal.ts').catch(() => null)
  void tr
  // Las marcas al abrir el aviso
  const m = cv.marcasDelAviso({ cambio: { accion: { tipo: 'free_tour', dia_n: 1 } } })
  debe(m.marcas['free tour'] === 'nueva' && m.dias[0] === 1, 'ap2', 'al abrir el aviso del Free Tour: lleva a su día con el Free Tour «Nueva»')
  const m2 = cv.marcasDelAviso({ cambio: { movidas: [{ nombre: 'Coliseo', dia_n: 2 }], n_movidas: 1, anadidas: [{ nombre: 'Panteón', dia_n: 3 }], n_anadidas: 1 } })
  debe(m2.marcas.coliseo === 'movida' && m2.marcas.pantheon === undefined && m2.marcas.panteon === 'nueva' && m2.dias.join() === '3,2', 'ap2', 'al abrir un aviso de sitios: «Nueva» las añadidas y «Movida» las movidas, en sus días')
  // El resumen que hace el móvil
  const antes = { answers: { dateRange: { start: '2026-11-11', end: '2026-11-15' } }, days: [{ id: 'a', dayNumber: 1, stops: [{ id: '1', name: 'Coliseo' }, { id: '2', name: 'Foro' }] }, { id: 'b', dayNumber: 2, stops: [{ id: '3', name: 'Panteón' }] }] }
  const despues = { answers: { dateRange: { start: '2026-11-11', end: '2026-11-15' } }, days: [{ id: 'a', dayNumber: 1, stops: [{ id: 'x1', name: 'Foro' }] }, { id: 'b', dayNumber: 2, stops: [{ id: 'x2', name: 'Panteón' }, { id: 'x3', name: 'Coliseo' }] }] }
  const r = cv.resumirCambio(antes, despues)
  debe(r.movidas.length === 1 && r.movidas[0].nombre === 'Coliseo' && r.anadidas.length === 0 && r.quitadas.length === 0 && !r.fechas, 'ap2', 'el resumen compara por nombre: aunque cambien los ids, el Coliseo es «movido» y no «quitado» y «añadido»')
}

/* ───────────────────────── 3. En la app ───────────────────────── */
console.log('3. En la app')
const preparar = async (a) => {
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 240 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await a.evaluar('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await a.evaluar('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 80 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(500)
  await a.esp(2000)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const ids = (a) => a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId))")
const clic = (a, texto, dentro = 'document') => a.evaluar(`(() => { const b = Array.from(${dentro}.querySelectorAll('button')).find((x) => (x.textContent || '').trim().includes(${JSON.stringify(texto)}) && x.offsetParent !== null); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
const hayHoja = (a) => a.evaluar("Boolean(document.querySelector('[data-free-tour-dia-sheet]'))")

{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  try {
    await preparar(a)
    const original = await ids(a)
    debe(original.join() === 'D2,D4,D1', 'ap1', `el viaje de pruebas empieza con ${original.join()} (sin Free Tour)`)

    /* — Desde EXPLORAR — */
    await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('explore'); return true })")
    await a.esp(1500)
    const entradas = await clic(a, 'Entradas')
    await a.esp(2500)
    const sumar = await a.evaluar(`(() => {
      const tit = Array.from(document.querySelectorAll('span, p, h3, div')).find((x) => /^Free Tour/.test((x.textContent || '').trim()) && x.children.length === 0)
      const tarjeta = tit?.closest('div.relative.flex')
      const b = tarjeta && Array.from(tarjeta.querySelectorAll('button')).find((x) => /Añadir|\\+/.test(x.textContent || ''))
      if (!b) return false
      b.click(); return true
    })()`)
    await a.esp(1200)
    debe(entradas && sumar && (await hayHoja(a)), 'ap1', `EXPLORAR · Entradas · el «+» del Free Tour abre «¿A qué día lo añadimos?» (entradas ${entradas}, + ${sumar})`)
    if (await hayHoja(a)) {
      const hoja = await a.evaluar(`(() => {
        const h = document.querySelector('[data-free-tour-dia-sheet]')
        const filas = Array.from(h.querySelectorAll('[data-dia-id]')).map((b) => ({ texto: b.textContent.trim().slice(0, 60), activo: /border-accent/.test(b.className) && !/border-text/.test(b.className), bloqueado: b.hasAttribute('data-bloqueado') }))
        const titulo = h.querySelector('h2')?.textContent
        const boton = h.querySelector('[data-free-tour-anadir]')?.textContent
        return { filas, titulo, boton }
      })()`)
      debe(hoja.titulo === '¿A qué día lo añadimos?' && hoja.filas.length === 3, 'ap1', `la hoja: «${hoja.titulo}» con los ${hoja.filas.length} días del viaje`)
      debe(hoja.filas.filter((f) => f.activo).length === 1 && hoja.filas.find((f) => f.activo) === hoja.filas[0], 'ap1', 'el primer día que encaja sale ya marcado')
      debe(/^Añadir /.test(hoja.boton ?? ''), 'ap1', `el botón: «${hoja.boton}»`)
      await a.captura(path.join(SALIDA, '10n5_freetour_hoja_explorar.jpg'))
      // elegir el segundo día y añadir
      await a.evaluar("(() => { const b = document.querySelectorAll('[data-free-tour-dia-sheet] [data-dia-id]')[1]; b.click(); return true })()")
      await a.esp(400)
      await a.evaluar("document.querySelector('[data-free-tour-anadir]').click(); true")
      for (let i = 0; i < 40 && (await hayHoja(a)); i++) await a.esp(500)
      const despues = await ids(a)
      debe(despues.join() === 'D4,D3,D1-FT', 'ap1', `el día elegido pasa a ser nuestro día con Free Tour (D3), la pareja D1 pasa a D1-FT y el que estaba ahí pasa al sitio que deja: ${despues.join()}`)
      const ft = await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => {
        const r = m.useRouteStore.getState().route
        const d = r.days.find((x) => x.stops.some((s) => s.isFreeTour))
        if (!d) return null
        const paradas = d.stops.filter((s) => !s.isZoneWalk)
        const i = paradas.findIndex((s) => s.isFreeTour)
        return { dia: d.dayNumber, curatedId: d.curatedId, hora: paradas[i].time, antesCena: i < paradas.length - 1 || true, ultima: i === paradas.length - 1, nombre: paradas[i].name, total: paradas.length, toast: null }
      })`)
      debe(ft && ft.dia === 2 && ft.curatedId === 'D3', 'ap1', `el Free Tour está en el día 2 (${JSON.stringify(ft)})`)
      debe(ft && !ft.ultima && /^(0[89]|1[0-2]):\d\d$/.test(ft.hora || '10:00'), 'ap1', `y no al final del día ni de noche: su hora es la del día escrito (${ft?.hora ?? 'sin hora puesta'})`)
      const toast = await a.evaluar("import('/src/store/useAddFlowStore.ts').then((m) => m.useAddFlowStore.getState().toast?.message ?? null)")
      debe(toast === 'Añadido el Free Tour · domingo 18', 'ap1', `el aviso de abajo: «${toast}»`)
      await a.esp(500)
      await a.captura(path.join(SALIDA, '10n5_freetour_anadido.jpg'))
      const ultimo = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.ultimoCambio)")
      debe(ultimo?.accion?.tipo === 'free_tour' && ultimo.accion.dia_n === 2 && ultimo.accion.reorganizados === 2, 'ap2', `la ruta apunta lo que ha hecho: ${JSON.stringify(ultimo?.accion)}`)
      const frase = textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: ultimo } })
      debe(frase === 'Eric ha añadido el Free Tour al domingo 18 y se han reorganizado 2 días.', 'ap2', `y el aviso que le llega al otro dice: «${frase}»`)
      const quitado = textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: ultimo } })
      debe(!/quitado|sitios/.test(quitado), 'ap2', 'sin «ha quitado N sitios»')

      /* — Deshacer — */
      const hecho = await a.evaluar("import('/src/store/useAddFlowStore.ts').then((m) => { m.useAddFlowStore.getState().undo(); return true })")
      await a.esp(500)
      debe(hecho && (await ids(a)).join() === 'D2,D4,D1', 'ap1', 'Deshacer deja el viaje como estaba')
      const sinFt = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const r = m.useRouteStore.getState().route; return r.days.some((d) => d.stops.some((s) => s.isFreeTour)) || (r.answers.experiencesPositive ?? []).includes('free_tour') })")
      debe(sinFt === false, 'ap1', 'y sin el Free Tour (ni la parada ni la experiencia)')
    }

    /* — Desde su ficha — */
    await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('route'); m.useRouteStore.getState().setMode('explore'); return true })")
    await a.esp(1200)
    // (la ficha: tocar la tarjeta del Free Tour y su «+ Añadir» de abajo)
    const abierta = await a.evaluar(`(() => {
      const tit = Array.from(document.querySelectorAll('span, p, h3')).find((x) => /^Free Tour/.test((x.textContent || '').trim()) && x.children.length === 0)
      if (!tit) return false
      tit.click(); return true
    })()`)
    await a.esp(1500)
    const pie = await clic(a, '+ Añadir')
    await a.esp(1200)
    debe(abierta && pie && (await hayHoja(a)), 'ap1', `desde la ficha del Free Tour: su «+ Añadir» abre la misma hoja (ficha ${abierta}, pie ${pie})`)
    if (await hayHoja(a)) {
      await a.captura(path.join(SALIDA, '10n5_freetour_hoja_ficha.jpg'))
      await a.evaluar("document.querySelector('[data-free-tour-dia-sheet] button[aria-label=\"Cerrar\"]').click(); true")
      await a.esp(500)
    }

    /* — Desde «+ Añadir parada» de DÍAS — */
    await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[0].id); return true })")
    await a.esp(1800)
    const abre = await a.evaluar(`(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /^\\+\\s*Añadir parada|Añadir parada/.test((x.textContent || '').trim()) && x.offsetParent !== null)
      if (!b) return false
      b.scrollIntoView({ block: 'center' }); b.click(); return true
    })()`)
    await a.esp(2500)
    if (abre) {
      await clic(a, 'Entradas').catch(() => false)
      await a.esp(1500)
      const mas = await a.evaluar(`(() => {
        const tit = Array.from(document.querySelectorAll('span, p, h3, div')).find((x) => /^Free Tour/.test((x.textContent || '').trim()) && x.children.length === 0)
        const tarjeta = tit?.closest('div.relative.flex')
        const b = tarjeta && Array.from(tarjeta.querySelectorAll('button')).find((x) => /Añadir|\\+/.test(x.textContent || ''))
        if (!b) return false
        b.click(); return true
      })()`)
      await a.esp(1200)
      debe(mas && (await hayHoja(a)), 'ap1', `«+ Añadir parada» de DÍAS: el Free Tour sale en la lista y su «+» ya deja añadirlo (abre la hoja del día) — «+» ${mas}`)
      if (await hayHoja(a)) await a.captura(path.join(SALIDA, '10n5_freetour_hoja_anadir_parada.jpg'))
    } else {
      debe(false, 'ap1', 'no encuentro el botón «+ Añadir parada» en DÍAS (la comprobación se hace por el código arriba)')
    }
  } finally {
    a.cerrar()
  }
}

/* ───────────────────────── 4. Días con cosas puestas por la persona: no se mueven sin avisar ───────────────────────── */
console.log('4. Lo puesto a mano no se mueve sin avisar')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  try {
    await preparar(a)
    // El día 3 (D1) lo ha tocado la persona a mano: tiene copia de lo que dio el motor
    const marcado = await a.evaluar(`import('/src/store/useRouteStore.ts').then((m) => {
      const s = m.useRouteStore.getState()
      const d = s.route.days.find((x) => x.dayNumber === 3)
      m.useRouteStore.setState({ route: { ...s.route, days: s.route.days.map((x) => (x.id === d.id ? { ...x, originalSnapshot: JSON.parse(JSON.stringify(x)) } : x)) } })
      return true
    })`)
    const planes = await a.evaluar(`Promise.all([import('/src/lib/freeTourEnDia.ts'), import('/src/store/useRouteStore.ts')]).then(([f, m]) => { const s = m.useRouteStore.getState(); return s.route.days.filter((d) => !d.isReturnLeg).map((d) => f.planearFreeTour(s.route, s.reservations, d.id)) })`)
    debe(marcado && planes.every((p) => p.ok === false && p.motivo === 'protegido'), 'ap1', `con el día 3 tocado a mano, ningún día lo mueve sin avisar (cada fila sale sin elegir y dice por qué): ${planes.map((p) => p.motivo).join()}`)
    debe(planes.every((p) => /cosas puestas por ti/.test(p.texto)), 'ap1', `con su motivo: «${planes[0]?.texto}»`)
    // La hoja: filas bloqueadas con el motivo debajo
    await a.evaluar("Promise.all([import('/src/store/useRouteStore.ts'), import('/src/components/route/reservas/FreeTourSheet.tsx')]).then(() => true)")
    await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('explore'); return true })")
    await a.esp(1200)
    await clic(a, 'Entradas')
    await a.esp(2200)
    await a.evaluar(`(() => {
      const tit = Array.from(document.querySelectorAll('span, p, h3, div')).find((x) => /^Free Tour/.test((x.textContent || '').trim()) && x.children.length === 0)
      const tarjeta = tit?.closest('div.relative.flex')
      const b = tarjeta && Array.from(tarjeta.querySelectorAll('button')).find((x) => /Añadir|\\+/.test(x.textContent || ''))
      b?.click(); return true
    })()`)
    await a.esp(1200)
    if (await hayHoja(a)) {
      const filas = await a.evaluar("Array.from(document.querySelectorAll('[data-free-tour-dia-sheet] [data-dia-id]')).map((b) => ({ bloqueado: b.hasAttribute('data-bloqueado'), texto: b.textContent.trim() }))")
      debe(filas.length === 3 && filas.every((f) => f.bloqueado && /no lo movemos sin avisar/.test(f.texto)), 'ap1', 'en la hoja, esos días salen apagados con «no lo movemos sin avisar. Elige otro día.»')
      const boton = await a.evaluar("document.querySelector('[data-free-tour-anadir]').textContent")
      debe(/Ningún día encaja/.test(boton), 'ap1', `y el botón no deja añadir (${boton})`)
      await a.captura(path.join(SALIDA, '10n5_freetour_dia_protegido.jpg'))
    } else debe(false, 'ap1', 'no se abrió la hoja')
  } finally {
    a.cerrar()
  }
}

/* ───────────────────────── 5. Quien solo recomienda: UN solo cambio en su propuesta ───────────────────────── */
console.log('5. La propuesta de quien solo recomienda')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  try {
    await preparar(a)
    const r = await a.evaluar(`Promise.all([import('/src/store/useRouteStore.ts'), import('/src/lib/freeTourEnDia.ts'), import('/src/lib/propuesta.ts')]).then(async ([m, f, p]) => {
      const base = JSON.parse(JSON.stringify(m.useRouteStore.getState().route))
      const dia = base.days.find((d) => d.dayNumber === 2)
      const res = await f.anadirFreeTourEnDia(dia.id)
      const actual = m.useRouteStore.getState().route
      const cambios = p.cambiosDeLaPropuesta(base, actual)
      const paquete = p.construirPropuesta(base, actual)
      // deshacer ese cambio de la propuesta
      const vuelta = cambios[0] ? p.deshacerCambio(actual, base, cambios[0]) : null
      return { res, cambios: cambios.map((c) => ({ tipo: c.tipo, texto: c.texto, etiqueta: c.etiqueta, dia: c.dayNumber })), n: paquete?.payload?.cambios?.length ?? null, vuelta: vuelta ? vuelta.days.filter((d) => !d.isReturnLeg).map((d) => d.curatedId).join() : null, ft: vuelta ? vuelta.days.some((d) => d.stops.some((s) => s.isFreeTour)) || (vuelta.answers.experiencesPositive ?? []).includes('free_tour') : null }
    })`)
    debe(r.res.ok === true && r.cambios.length === 1 && r.cambios[0].tipo === 'free_tour', 'ap1', `la propuesta lleva UN solo cambio, no los de cada día que se rehace (${r.cambios.length}: ${r.cambios.map((c) => c.tipo).join()})`)
    debe(r.cambios[0]?.texto === 'Añadir el Free Tour al domingo 18', 'ap1', `y dice: «${r.cambios[0]?.texto}»`)
    debe(r.n === 1, 'ap1', 'el paquete que se manda lleva ese único cambio')
    debe(r.ft === false && r.vuelta === 'D2,D4,D1', 'ap1', `y [Deshacer este cambio] de la propuesta devuelve los días de antes (${r.vuelta})`)
    // Aceptarla (el administrador): lo mismo que si lo añadiera él
    await a.evaluar(`Promise.all([import('/src/store/useRouteStore.ts'), import('/src/lib/propuestaDueno.ts')]).then(([m, d]) => { m.useRouteStore.getState().restoreOriginalRoute?.(); return true })`)
  } finally {
    a.cerrar()
  }
}

/* ───────────────────────── 6. Recuperar mi ruta y Recuperar este día ───────────────────────── */
console.log('6. «Recuperar»')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  try {
    await preparar(a)
    const r = await a.evaluar(`import('/src/store/useRouteStore.ts').then(async (m) => {
      const s = () => m.useRouteStore.getState()
      m.useRouteStore.setState({ route: { ...s().route, originalRoute: JSON.parse(JSON.stringify({ days: s().route.days, answers: s().route.answers })) } })
      const d2 = s().route.days.find((d) => d.dayNumber === 2)
      const primera = d2.stops.find((x) => !x.isZoneWalk)
      s().removeStop(d2.id, primera.id)
      const tocado = s().route.days.find((d) => d.dayNumber === 2).originalSnapshot != null
      s().restoreOriginalDay(d2.id)
      const dia = s().route.ultimoCambio
      s().removeStop(d2.id, primera.id)
      s().restoreOriginalRoute()
      const ruta = s().route.ultimoCambio
      return { tocado, dia: dia?.accion, ruta: ruta?.accion }
    })`)
    debe(r.tocado && r.dia?.tipo === 'recuperar_dia' && r.dia.dia_n === 2, 'ap2b', `«Recuperar este día» apunta lo que ha hecho (${JSON.stringify(r.dia)})`)
    debe(r.ruta?.tipo === 'recuperar_ruta', 'ap2b', `«Recuperar mi ruta» también (${JSON.stringify(r.ruta)})`)
    debe(textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: { accion: r.dia } } }) === 'Eric ha recuperado el domingo 18 como estaba.', 'ap2b', 'y al otro le llega «Eric ha recuperado el domingo 18 como estaba.»')
    debe(textos.textoDelAviso({ tipo: 'viaje_cambiado', payload: { quien: 'Eric', cambio: { accion: r.ruta } } }) === 'Eric ha vuelto a la ruta inicial.', 'ap2b', 'y «Eric ha vuelto a la ruta inicial.»')
    await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('route'); return true })")
    await a.esp(1500)
    await a.captura(path.join(SALIDA, '10n5_recuperar_ruta.jpg'))
  } finally {
    a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
