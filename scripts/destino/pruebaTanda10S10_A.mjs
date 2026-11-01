// Tanda 10S10 (A, apartado 1, GRAVE): mover paradas entre franjas. Una parada es de la franja donde cae; la comida y la cena son elementos de la línea como las paradas;
// «Mover antes/después» cambia un elemento por el de al lado y nada más; cabeceras MAÑANA→TARDE→NOCHE una vez cada una; ningún movimiento se impide.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S10_A.mjs
import fs from 'node:fs'
import { conViaje, modulo, esp, preparar, foto } from './_10n6_k3_comun.mjs'
const { debe, fin } = preparar()
const L = (f) => fs.readFileSync(f, 'utf8')
const sinCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('1. Código')
{
  const panel = sinCom(L('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(/!hasDinner && realStops\[item\.index\]\?\.franja/.test(panel) && !/period = realStops\[item\.index\]\.franja as DayPeriod\s*\n\s*if \(period === 'noche'\)/.test(panel), 'ap1', 'la franja guardada en la parada ya no manda cuando el día tiene cena')
  debe(!/if \(flags\.night && phase !== 'manana'\) phase = 'noche'/.test(panel), 'ap1', 'lo «nocturno» ya no mete una parada en la Noche si el día tiene cena')
  debe(/colocarLinea\(day\.id, lineaVisible, nueva\)/.test(panel) && !/handleMealDrop/.test(panel), 'ap1', 'arrastrar (parada, comida y cena) usa la línea entera, sin «vuelve a su sitio»')
  const menu = sinCom(L('src/components/route/dayDetail/StopMenu.tsx'))
  debe(/moverEnLaLinea\(stop\.id/.test(menu), 'ap1', '«Mover antes/después» usa la línea entera (con la comida y la cena)')
  const st = sinCom(L('src/store/useRouteStore.ts'))
  debe(/colocarLinea: \(dayId, antes, despues\)/.test(st) && /comidasTrasInsertar/.test(st) && /comidasTrasQuitar/.test(st), 'ap1', 'el almacén coloca la línea y mantiene la comida y la cena detrás de SU parada al añadir y quitar')
}

console.log('2. En la app')
const a = await conViaje({ version: 'gratis', alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  const st = (js) => ev(modulo('/src/store/useRouteStore.ts') + `.then((m) => { const s = m.useRouteStore.getState(); const r = s.route; ${js} })`)
  const lin = (js) => ev(`Promise.all([${modulo('/src/store/useRouteStore.ts')}, ${modulo('/src/lib/lineaDelDia.ts')}]).then(([m, l]) => { const s = m.useRouteStore.getState(); const r = s.route; ${js} })`)
  for (let i = 0; i < 40 && !(await st('return r.days.some((d)=>d.stops.length>5)')); i++) await esp(500)
  // El día con más paradas (no el de vuelta): comida detrás de la primera, cena detrás de la penúltima.
  const dia = await st(`
    const d = r.days.filter((x) => !x.isReturnLeg && x.stops.length >= 5).sort((p, q) => q.stops.length - p.stops.length)[0]
    if (!d) return null
    return { id: d.id, n: d.stops.length }`)
  debe(Boolean(dia), 'ap1', 'hay un día con 5 paradas o más')
  const fijar = (lunch, dinner) => st(`s.setActiveDayId(${JSON.stringify(dia.id)}); const d = r.days.find((x) => x.id === ${JSON.stringify(dia.id)}); useRouteStoreSet(d); return true`.replace('useRouteStoreSet(d)', `m.useRouteStore.setState({ route: { ...r, days: r.days.map((x) => x.id === d.id ? { ...x, mealAfter: { lunch: ${lunch}, dinner: ${dinner} } } : x) } })`))
  await fijar(0, 3)
  await st(`s.setMode('days'); s.setActiveDayId(${JSON.stringify(dia.id)}); return true`)
  await esp(2500)
  /** La línea tal como se ve: cabeceras, paradas (con su nombre) y la comida y la cena, en orden. */
  const lineaPantalla = () =>
    ev(`(() => {
      const nodos = Array.from(document.querySelectorAll('[data-period-header],[data-stop-id],button[aria-label="Mover la comida"],button[aria-label="Mover la cena"]'))
      const sal = []
      for (const n of nodos) {
        const t = n.hasAttribute('data-period-header') ? 'H:' + n.getAttribute('data-period-header') : n.hasAttribute('data-stop-id') ? 'S:' + n.getAttribute('data-stop-id') : n.getAttribute('aria-label') === 'Mover la comida' ? 'M:comida' : 'M:cena'
        if (sal[sal.length - 1] !== t) sal.push(t)
      }
      return sal
    })()`)
  const ids = await st(`return r.days.find((x) => x.id === ${JSON.stringify(dia.id)}).stops.map((x) => x.id)`)
  const nombres = await st(`return r.days.find((x) => x.id === ${JSON.stringify(dia.id)}).stops.map((x) => x.name)`)
  const hs = (l) => l.filter((x) => x.startsWith('H:'))
  const sinRepetir = (l) => ['H:manana', 'H:tarde', 'H:noche'].every((h) => l.filter((x) => x === h).length <= 1) && hs(l).join() === ['H:manana', 'H:tarde', 'H:noche'].filter((h) => hs(l).includes(h)).join()
  let l0 = await lineaPantalla()
  debe(l0.length > 0 && sinRepetir(l0), 'ap1', `el día de partida: una cabecera de cada y en orden (${l0.join(' ')})`)
  // El Castillo: la parada que va justo antes de la cena menos una (para que dos «Mover después» lo pasen detrás de la cena).
  const abrirMenuDe = (id) => ev(`(() => { const t = document.querySelector('[data-stop-id=${JSON.stringify(id)}]'); const b = t && (t.querySelector('[data-menu-hoja="parada"]') || t.parentElement.querySelector('[data-menu-hoja="parada"]')); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true })()`)
  const opcion = async (id, txt) => {
    if (!(await abrirMenuDe(id))) return false
    await esp(700)
    const ok = await ev(`(() => { const o = Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((t) => t.textContent.includes(${JSON.stringify(txt)})); if (!o || o.hasAttribute('data-deshabilitada')) return false; o.click(); return true })()`)
    await esp(900)
    return ok
  }
  // El Castillo: una parada con su menú «···» (no «de camino») y la cena puesta detrás de la parada de al lado, para que dos «Mover después» la pasen detrás de la cena.
  const conMenu = await ev(`Array.from(document.querySelectorAll('[data-stop-id]')).filter((t) => t.querySelector('[data-menu-hoja="parada"]')).map((t) => t.getAttribute('data-stop-id'))`)
  const posCastillo = ids.findIndex((id, i) => i >= 1 && i < ids.length - 3 && conMenu.includes(id))
  debe(posCastillo >= 1, 'ap1', 'hay una parada con menú para hacer de Castillo')
  const castillo = ids[posCastillo]
  const castilloNombre = nombres[posCastillo]
  await fijar(0, posCastillo + 1)
  await esp(2000)
  l0 = await lineaPantalla()
  debe(sinRepetir(l0) && l0.indexOf('M:cena') === l0.indexOf('S:' + ids[posCastillo + 1]) + 1, 'ap1', `la cena detrás de la parada de al lado del Castillo (${l0.join(' ')})`)
  debe(await opcion(castillo, 'Mover después'), 'ap1', `«Mover después» en ${castilloNombre} (1)`)
  let l1 = await lineaPantalla()
  const sl = (l) => l.filter((x) => !x.startsWith('H:'))
  // Cambia SOLO una posición por la de al lado: dos paradas intercambiadas y nada más.
  debe(sl(l0).length === sl(l1).length && sl(l0).filter((x, i) => x !== sl(l1)[i]).length === 2, 'ap1', `«Mover después» cambia una posición por la de al lado y nada más (${sl(l0).filter((x, i) => x !== sl(l1)[i]).length} sitios distintos)`)
  debe(sinRepetir(l1), 'ap1', `1.er «Mover después»: cabeceras sin repetir (${l1.join(' ')})`)
  debe(await opcion(castillo, 'Mover después'), 'ap1', `«Mover después» en ${castilloNombre} (2): salta la cena`)
  let l2 = await lineaPantalla()
  const iCena = l2.indexOf('M:cena')
  const iCast = l2.indexOf('S:' + castillo)
  debe(iCast > iCena && iCena >= 0, 'ap1', `el Castillo queda DETRÁS de la cena (${l2.join(' ')})`)
  const hDespues = l2.slice(iCena).find((x) => x.startsWith('H:'))
  debe(sinRepetir(l2) && l2.filter((x) => x === 'H:noche').length === 1, 'ap1', `una sola NOCHE y ninguna cabecera repetida (${l2.join(' ')})`)
  debe(l2.indexOf('H:noche') > iCena && l2.indexOf('H:noche') < iCast, 'ap1', 'la NOCHE abre justo después de la cena y el Castillo es el primero de la Noche')
  const fr = await st(`return r.days.find((x) => x.id === ${JSON.stringify(dia.id)}).mealAfter`)
  void hDespues
  debe(fr && fr.dinner === posCastillo, 'ap1', `la cena queda detrás de la parada que le toca (${JSON.stringify(fr)})`)
  await a.captura(foto('s10_a_castillo_noche'))
  // «Mover antes»: vuelve a saltar la cena hacia atrás y es de Tarde otra vez, sin cabeceras repetidas.
  debe(await opcion(castillo, 'Mover antes'), 'ap1', '«Mover antes» salta la cena hacia atrás')
  let l3 = await lineaPantalla()
  debe(l3.indexOf('S:' + castillo) < l3.indexOf('M:cena') && sinRepetir(l3), 'ap1', `y vuelve a ser de la Tarde, sin cabeceras repetidas (${l3.join(' ')})`)

  console.log('3. Arrastrar y mover la cena (la comida y la cena son paradas como las demás)')
  const aplicar = (js) => lin(`
    const d = r.days.find((x) => x.id === ${JSON.stringify(dia.id)})
    const comidas = { lunch: d.mealAfter?.lunch, dinner: d.mealAfter?.dinner }
    const antes = l.lineaDelDia(d.stops.map((x) => x.id), comidas)
    ${js}
    s.colocarLinea(d.id, antes, nueva)
    const d2 = m.useRouteStore.getState().route.days.find((x) => x.id === d.id)
    return { linea: l.lineaDelDia(d2.stops.map((x) => x.id), d2.mealAfter), mealAfter: d2.mealAfter, n: d2.stops.length }`)
  // La cena se arrastra hasta encima de la primera parada de la tarde: sube, y con ella el paso a la Noche.
  const r1 = await aplicar(`const nueva = l.arrastrarAlSitioDe(antes, { tipo: 'meal', comida: 'dinner' }, { tipo: 'stop', id: d.stops[1].id }); if (!nueva) return null;`)
  debe(r1 && r1.mealAfter.dinner === 0, 'ap1', `arrastrar la cena sobre la 2.ª parada: la cena sube (${JSON.stringify(r1?.mealAfter)})`)
  await esp(1200)
  let l4 = await lineaPantalla()
  debe(sinRepetir(l4) && l4.indexOf('M:cena') < l4.indexOf('H:noche') && l4.filter((x) => x === 'H:noche').length === 1, 'ap1', `con la cena arriba, la NOCHE se mueve con ella (${l4.join(' ')})`)
  // Una parada arrastrada por encima de la cena (suelta sobre ella) la cruza.
  const r2 = await aplicar(`const nueva = l.arrastrarAlSitioDe(antes, { tipo: 'stop', id: d.stops[d.stops.length - 1].id }, { tipo: 'meal', comida: 'dinner' }); if (!nueva) return null;`)
  debe(r2 && r2.linea.findIndex((x) => x.tipo === 'meal' && x.comida === 'dinner') > r2.linea.findIndex((x) => x.tipo === 'stop' && x.id === ids.at(-1)), 'ap1', 'una parada soltada sobre la cena la cruza (no «vuelve a su sitio»)')
  // La comida detrás de la cena (nada se impide): sin cabeceras repetidas.
  await aplicar(`const nueva = l.arrastrarAlSitioDe(antes, { tipo: 'meal', comida: 'lunch' }, { tipo: 'stop', id: d.stops[d.stops.length - 1].id }); if (!nueva) return null;`)
  await esp(1200)
  const l5 = await lineaPantalla()
  debe(sinRepetir(l5), 'ap1', `la comida arrastrada al final: ninguna cabecera repetida (${l5.join(' ')})`)
  // La Tarde sin paradas no enseña su texto: comida y cena seguidas.
  await fijar(0, 0)
  await esp(1500)
  const l6 = await lineaPantalla()
  debe(!l6.includes('H:tarde') && l6.includes('H:manana') && l6.includes('H:noche'), 'ap1', `una franja sin paradas no enseña su texto (${l6.join(' ')})`)
  await a.captura(foto('s10_a_franja_vacia'))

  console.log('4. Añadir entre dos paradas, y mover a otro día, junto a la comida y la cena')
  await fijar(0, 3)
  const nuevaParada = (n) => `{ id: 'prueba-10s10-${n}', name: 'Parada de prueba ${n}', time: '12:00', durationMinutes: 30, coordinates: { lat: 41.9, lng: 12.49 }, description: '', category: 'sight' }`
  const ins = (antesDe, n) =>
    lin(`
      const d = r.days.find((x) => x.id === ${JSON.stringify(dia.id)})
      const comidas = { lunch: d.mealAfter.lunch, dinner: d.mealAfter.dinner }
      s.insertStopAt(d.id, comidas.dinner + 1, ${nuevaParada(n)}, { comidas, antesDe: ${antesDe ? JSON.stringify(antesDe) : 'null'} })
      const d2 = m.useRouteStore.getState().route.days.find((x) => x.id === d.id)
      return l.lineaDelDia(d2.stops.map((x) => x.id), d2.mealAfter).map((x) => x.tipo === 'stop' ? x.id : x.comida)`)
  const linA = await ins('dinner', 1)
  debe(linA.indexOf('prueba-10s10-1') === linA.indexOf('dinner') - 1, 'ap1', `el «+» de encima de la cena: la parada entra ANTES de la cena (${linA.slice(-5).join(' ')})`)
  const linB = await ins(null, 2)
  debe(linB.indexOf('prueba-10s10-2') === linB.indexOf('dinner') + 1, 'ap1', `el «+» de debajo de la cena: la parada entra DETRÁS de la cena (${linB.slice(-5).join(' ')})`)
  await esp(800)
  // Mover a otro día: la parada llega la primera del otro día y la comida y la cena de ese día siguen detrás de SUS paradas.
  const otro = await st(`return r.days.find((x) => x.id !== ${JSON.stringify(dia.id)} && !x.isReturnLeg && x.stops.length >= 3)?.id ?? null`)
  if (otro) {
    await lin(`const d = r.days.find((x) => x.id === ${JSON.stringify(otro)}); m.useRouteStore.setState({ route: { ...r, days: r.days.map((x) => x.id === d.id ? { ...x, mealAfter: { lunch: 0, dinner: x.stops.length - 2 } } : x) } }); return true`)
    const antesIds = await st(`return r.days.find((x) => x.id === ${JSON.stringify(otro)}).stops.map((x) => x.id)`)
    await ev(modulo('/src/lib/cambiarParada.ts') + `.then((m) => m.moverParadaAOtroDia('prueba-10s10-2', ${JSON.stringify(dia.id)}, ${JSON.stringify(otro)}, {}))`)
    await esp(600)
    const res = await lin(`const d = r.days.find((x) => x.id === ${JSON.stringify(otro)}); return { linea: l.lineaDelDia(d.stops.map((x) => x.id), d.mealAfter).map((x) => x.tipo === 'stop' ? x.id : x.comida), mealAfter: d.mealAfter }`)
    debe(res.linea[0] === 'prueba-10s10-2', 'ap1', `«Mover a otro día»: llega la primera del día (${res.linea.slice(0, 3).join(' ')})`)
    debe(res.linea.indexOf('lunch') === 2 && res.linea[1] === antesIds[0] && res.linea[res.linea.indexOf('dinner') - 1] === antesIds[antesIds.length - 2], 'ap1', `«Mover a otro día»: la comida y la cena siguen detrás de SU parada (${JSON.stringify(res.mealAfter)})`)
    const origen = await lin(`const d = r.days.find((x) => x.id === ${JSON.stringify(dia.id)}); return d.stops.some((x) => x.id === 'prueba-10s10-2')`)
    debe(origen === false, 'ap1', '«Mover a otro día»: ya no está en el día de origen')
  }
  // Quitar una parada: la cena sigue detrás de SU parada.
  const q = await lin(`
    const d = r.days.find((x) => x.id === ${JSON.stringify(dia.id)})
    const antes = l.lineaDelDia(d.stops.map((x) => x.id), d.mealAfter).map((x) => x.tipo === 'stop' ? x.id : x.comida)
    const quitada = d.stops[1].id
    s.removeStop(d.id, quitada)
    const d2 = m.useRouteStore.getState().route.days.find((x) => x.id === d.id)
    return { quitada, antes, despues: l.lineaDelDia(d2.stops.map((x) => x.id), d2.mealAfter).map((x) => x.tipo === 'stop' ? x.id : x.comida) }`)
  debe(JSON.stringify(q.antes.filter((x) => x !== q.quitada)) === JSON.stringify(q.despues), 'ap1', 'quitar una parada: la comida y la cena siguen en su sitio respecto a las demás')
} finally {
  a.cerrar()
}
fin('pruebaTanda10S10_A')
