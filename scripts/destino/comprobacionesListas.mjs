// Las comprobaciones del motor de listas (PARA_CODE_TANDA6.md, punto 6). Son sencillas y NO comparten código con el motor: miran lo que sale.
//   1. El orden de cada día = el de su lista, sin lo quitado.        5. Por dentro una sola vez en el viaje.
//   2. Nada cerrado en su franja.                                      6. 0 restaurantes y 0 nocturnas repetidos.
//   3. Sin zigzag.                                                     7. Las reservas, a su hora, con su «Llegada a…».
//   4. La pirámide: ningún imprescindible quitado la primera vez.      8. Ninguna comida después de las 14:30 (salvo delante solo imprescindibles).
// No hay prueba de «huecos»: el tiempo libre es del viajero.
import { closedOnDay, effectiveSchedule, parseHoursSessions } from '../../shared/routeEngine/openingHours.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))

export function comprobarViaje({ D, plan, etiqueta, entradas = {}, poolNames = [], hasFreeTour = false }) {
  const fallos = []
  const info = []
  const place = (name) => D.places.find((p) => p.name === name)
  const coordsDe = (row) => {
    const p = place(row.lugar)
    if (!p) return null
    return row.modo === 'fuera' || row.modo === 'camino' ? p.pass_by?.coordinates ?? p.coordinates : p.coordinates
  }
  const dias = plan.days.filter((day) => day.curatedDay?.id)
  const cubiertos = new Set(hasFreeTour ? D.default_free_tour?.covers ?? [] : [])
  const vistos = new Set(cubiertos)
  const dentro = new Map()
  const mesas = new Map()
  const noches = new Map()
  const falla = (regla, dia, texto) => fallos.push({ regla, texto: `${etiqueta} · ${dia.hours?.dateIso ?? `día ${dia.dayNumber}`} ${dia.curatedDay.id}: ${texto}` })
  const avisa = (regla, dia, texto) => info.push({ regla, texto: `${etiqueta} · ${dia.hours?.dateIso ?? `día ${dia.dayNumber}`} ${dia.curatedDay.id}: ${texto}` })

  for (const dia of dias) {
    const rows = dia.escritoRows ?? []
    const log = dia.escritoLog ?? []
    const stops = rows.filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'desayuno') && !r.llegada)
    // 1. El orden
    const base = new Map((dia.ordenBase ?? []).map((id, i) => [id, i]))
    const secuencia = rows.filter((r) => base.has(r.id) && !r.llegada && !r.fija && !r.relleno && r.tipo !== 'traslado').map((r) => base.get(r.id))
    for (let i = 1; i < secuencia.length; i++) if (secuencia[i] < secuencia[i - 1]) { falla('orden', dia, `el orden del día no es el de su lista (${rows.filter((r) => base.has(r.id) && !r.llegada && !r.fija).map((r) => r.titulo ?? r.lugar).slice(0, 6).join(' → ')}…)`); break }
    // Todo lo que falta de la lista tiene su causa (cierre, sobra, pool…)
    const spareIds = new Set((dia.spareRows ?? []).map((r) => r.id))
    for (const id of dia.ordenBase ?? []) {
      if (rows.some((r) => r.id === id) || spareIds.has(id)) continue
      if (!log.some((l) => l.id === id && (l.que === 'quitada' || l.que === 'sobra'))) falla('sin_explicar', dia, `«${id}» está en la lista y no sale ni tiene causa en el registro`)
    }
    // 2. Nada cerrado
    for (const r of stops) {
      if (r.modo === 'fuera' || r.modo === 'camino' || r.tipo !== 'parada') continue
      const p = place(r.lugar)
      if (!p) continue
      if (r.hora_tipo === 'reserva') continue // (la reserva del viajero manda: el motor avisa)
      if (r.lugar && closedOnDay(p, dia.hours.weekday, dia.hours.dateIso)) { falla('cerrado', dia, `«${r.titulo ?? r.lugar}» sale por dentro y está cerrado ese día`); continue }
      const sesiones = parseHoursSessions(effectiveSchedule(p, dia.hours))
      if (sesiones.length === 0) continue
      const ventana = r.franja === 'manana' ? [7 * 60, 14 * 60 + 30] : [12 * 60, 22 * 60]
      const cabe = sesiones.some((s) => Math.min(s.close, ventana[1]) - Math.max(s.open, ventana[0]) >= Math.min(r.min, 20))
      if (!cabe) falla('cerrado', dia, `«${r.titulo ?? r.lugar}» no abre en su franja (${r.franja}): ${sesiones.map((s) => `${Math.floor(s.open / 60)}:${String(s.open % 60).padStart(2, '0')}-${Math.floor(s.close / 60)}:${String(s.close % 60).padStart(2, '0')}`).join(' y ')}`)
    }
    // 3. Zigzag: lo que rompe el día y no rompía la lista escrita
    const zig = (lista) => {
      const puntos = lista.map((r) => ({ r, c: coordsDe(r) })).filter((x) => x.c)
      const out = new Set()
      // (Solo cuenta volver para ver algo que se podía ver al pasar: de camino, por fuera o de pocos minutos; no una visita con hora ni una larga.)
      const alPasar = (r) => !r.fija && !r.hora_tipo && (r.modo === 'camino' || r.modo === 'fuera' || (r.min ?? 30) <= 20)
      for (let j = 2; j < puntos.length; j++) for (let i = 0; i < j - 1; i++) {
        if (!alPasar(puntos[j].r)) continue
        if (puntos[i].r.lugar === puntos[j].r.lugar) continue
        if (straightLineMeters(puntos[i].c, puntos[j].c) >= 300) continue
        let lejos = 0
        for (let k = i + 1; k < j; k++) lejos = Math.max(lejos, straightLineMeters(puntos[i].c, puntos[k].c))
        if (lejos > 600) out.add(`${puntos[i].r.id}>${puntos[j].r.id}`)
      }
      return out
    }
    const ordenados = (lista) => lista.filter((r) => r.tipo === 'parada' || r.tipo === 'desayuno')
    const final = ordenados(stops.filter((r) => !r.relleno))
    const conSobra = [...final, ...(dia.spareRows ?? []).map((r) => ({ ...r, tipo: 'parada' }))].filter((r) => base.has(r.id)).sort((a, b) => base.get(a.id) - base.get(b.id))
    const antes = zig(conSobra)
    for (const k of zig(final)) if (!antes.has(k)) falla('zigzag', dia, `zigzag nuevo (${k.replace(/_/g, ' ')})`)
    // 4. La pirámide
    const valor = (r) => {
      const nivel = r.nivel ?? place(r.lugar)?.level ?? 3
      if (r.protegido) return nivel === 1 ? 100 : 80
      if (nivel === 1) return 100
      return (nivel === 2 ? 50 : 10) - (r.modo === 'camino' ? 5 : 0)
    }
    for (const s of dia.spareRows ?? []) {
      if ((s.nivel ?? 3) === 1 && !vistos.has(s.lugar) && !rows.some((r) => r.lugar === s.lugar)) falla('piramide', dia, `«${s.titulo ?? s.lugar}» es un imprescindible y pasa a «Si te sobra tiempo» la primera vez`)
      for (const r of stops) if (r.franja === s.franja && !r.fija && !r.hora_tipo && !r.llegada && valor(r) < valor(s)) falla('piramide', dia, `«${s.titulo ?? s.lugar}» pasa a «Si te sobra tiempo» y «${r.titulo ?? r.lugar}», de menos importancia, se queda`)
    }
    // 5. Por dentro una sola vez (en el viaje)
    for (const r of stops) if (r.modo === 'dentro') { const dd = dentro.get(r.lugar); if (dd) falla('dentro_dos_veces', dia, `«${r.lugar}» va por dentro también el ${dd}`); dentro.set(r.lugar, dia.hours?.dateIso ?? `día ${dia.dayNumber}`) }
    for (const r of stops) vistos.add(r.lugar)
    // 6. Restaurantes y nocturnas
    for (const r of rows.filter((x) => x.tipo === 'comida' || x.tipo === 'cena')) {
      const antesDia = mesas.get(r.restaurante)
      const conMotivo = log.some((l) => l.id === r.id && l.que === 'aviso' && /repetido/.test(l.causa ?? ''))
      if (antesDia) (conMotivo ? avisa : falla)('restaurante_repetido', dia, `«${r.restaurante}» ya salió el ${antesDia}${conMotivo ? ' (apuntado: no hay recambio)' : ''}`)
      mesas.set(r.restaurante, dia.hours?.dateIso ?? `día ${dia.dayNumber}`)
    }
    for (const n of dia.escritoNights ?? []) {
      const especial = D.destination_config?.noche_especial?.[String(dia.hours?.dateIso ?? '').slice(5)]?.noche === n.name
      if (noches.has(n.name) && !especial) falla('noche_repetida', dia, `«${n.name}» ya salió de noche el ${noches.get(n.name)}`)
      noches.set(n.name, dia.hours?.dateIso ?? `día ${dia.dayNumber}`)
    }
    // 7. Las reservas, a su hora, con su «Llegada a…»
    for (const [lugar, hora] of Object.entries(entradas)) {
      const r = rows.find((x) => x.lugar === lugar && x.hora_tipo === 'reserva' && !x.llegada)
      if (!r) continue
      if (r.hora_fija !== hora) falla('reserva', dia, `${lugar}: la reserva es a las ${hora} y sale con la hora ${r.hora_fija}`)
      const i = rows.indexOf(r)
      const previa = rows.slice(0, i).reverse().find((x) => x.tipo !== 'traslado')
      if (!previa?.llegada || previa.lugar !== lugar) falla('reserva', dia, `${lugar}: la reserva no lleva su «Llegada a…» delante`)
      if (r.tarde > 0) avisa('reserva_tarde', dia, `${lugar}: se llega ${r.tarde} min tarde a la reserva de las ${hora}`)
    }
    // 8. La comida, como muy tarde a las 14:30
    const comida = rows.find((x) => x.tipo === 'comida')
    if (comida && comida.llegaA > 14 * 60 + 30) {
      const delante = rows.slice(0, rows.indexOf(comida)).filter((x) => (x.tipo === 'parada' || x.tipo === 'tour') && !x.llegada)
      const soloImprescindibles = delante.length > 0 && delante.every((x) => (x.nivel ?? 3) === 1 || x.fija)
      ;(soloImprescindibles ? avisa : falla)('comida_tarde', dia, `la comida es a las ${Math.floor(comida.llegaA / 60)}:${String(comida.llegaA % 60).padStart(2, '0')}${soloImprescindibles ? ' (delante solo hay imprescindibles)' : ''}`)
    }
    // El plan de lluvia pasa las mismas comprobaciones
    for (const texto of dia.rainPlan?.checks ?? []) falla('lluvia', dia, `la alternativa de lluvia rompe: ${texto}`)
    // Lo que el viajero marcó en el pool y no sale
  }
  for (const name of poolNames) {
    // (Sale si lo enseña la ruta —de camino también—, su nocturna, o una parada de su mismo barrio; o si está en «Si te sobra tiempo» o en «No incluido».)
    const barrio = place(name)?.tags?.includes('barrio') ? place(name)?.zone : null
    const sale = dias.some((d) => (d.escritoRows ?? []).some((r) => r.lugar === name || (barrio && place(r.lugar)?.zone === barrio && r.modo !== 'camino')) || (d.escritoNights ?? []).some((n) => (n.conflicts_with ?? []).includes(name)) || (d.spareRows ?? []).some((r) => r.lugar === name) || (d.escritoLog ?? []).some((l) => l.sitio === name && l.que === 'quitada')) || plan.unplacedPool.some((u) => u.name === name) || (hasFreeTour && cubiertos.has(name) && place(name)?.type !== 'interior')
    if (!sale) fallos.push({ regla: 'pool', texto: `${etiqueta}: «${name}» marcado en el pool no sale ni está en «No incluido»` })
  }
  // «Si te sobra tiempo» y lo que cuentan los avisos
  for (const dia of dias) {
    for (const l of dia.escritoLog ?? []) if (l.que === 'aviso' && /no cabe del todo/.test(l.causa ?? '')) avisa('no_cabe_del_todo', dia, l.causa)
    for (const s of dia.spareRows ?? []) avisa('sobra', dia, `«${s.titulo ?? s.lugar}» pasa a «Si te sobra tiempo»`)
  }
  return { fallos, info }
}
