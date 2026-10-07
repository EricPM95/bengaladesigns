// Las comprobaciones del motor de listas (PARA_CODE_TANDA6.md, punto 6). Son sencillas y NO comparten código con el motor: miran lo que sale.
//   1. El orden de cada día = el de su lista, sin lo quitado.        5. Por dentro una sola vez en el viaje.
//   2. Nada cerrado en su franja.                                      6. 0 restaurantes y 0 nocturnas repetidos.
//   3. Sin zigzag.                                                     7. Las reservas, a su hora, con su «Llegada a…».
//   4. La pirámide: ningún imprescindible quitado la primera vez.      8. Ninguna comida después de las 14:30 (salvo delante solo imprescindibles).
// No hay prueba de «huecos»: el tiempo libre es del viajero.
import { closedOnDay, effectiveSchedule, lastEntryMinutes, parseHoursSessions } from '../../shared/routeEngine/openingHours.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const toMin = (hhmm) => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))

export function comprobarViaje({ D, plan, etiqueta, entradas = {}, poolNames = [], hasFreeTour = false, listas = null, franjas = {} }) {
  const fallos = []
  const info = []
  const place = (name) => D.places.find((p) => p.name === name)
  const coordsDe = (row) => {
    const p = place(row.lugar)
    if (!p) return null
    return row.modo === 'fuera' || row.modo === 'camino' ? p.pass_by?.coordinates ?? p.coordinates : (Array.isArray(p.entrada) ? p.entrada : null) ?? p.coordinates
  }
  const dias = plan.days.filter((day) => day.curatedDay?.id)
  // (Tanda 6c) Los sitios «conocidos»: los que salen en algún día escrito del documento o son de nivel 1 o 2.
  const delDocumento = new Set()
  {
    const recorrer = (o) => { if (Array.isArray(o)) o.forEach(recorrer); else if (o && typeof o === 'object') { if (typeof o.lugar === 'string') delDocumento.add(o.lugar); Object.values(o).forEach(recorrer) } }
    recorrer(listas?.days ?? {})
  }
  const cubiertos = new Set(hasFreeTour ? D.default_free_tour?.covers ?? [] : [])
  const vistos = new Set(cubiertos)
  const dentro = new Map()
  const mesas = new Map()
  const noches = new Map()
  const falla = (regla, dia, texto) => fallos.push({ regla, texto: `${etiqueta} · ${dia.hours?.dateIso ?? `día ${dia.dayNumber}`} ${dia.curatedDay.id}: ${texto}` })
  const avisa = (regla, dia, texto) => info.push({ regla, texto: `${etiqueta} · ${dia.hours?.dateIso ?? `día ${dia.dayNumber}`} ${dia.curatedDay.id}: ${texto}` })

  const fallaOrden = (dia, texto) => fallos.push({ regla: 'orden_dias', texto: `${etiqueta}: ${texto}` })
  const avisaOrden = (dia, texto) => info.push({ regla: 'orden_dias_cierre', texto: `${etiqueta}: ${texto}` })
  for (const dia of dias) {
    const rows = dia.escritoRows ?? []
    const log = dia.escritoLog ?? []
    const dentroPrev = new Set(dentro.keys()) // (lo que ya se vio por dentro en días anteriores del viaje)
    // Una reserva a una hora sin lista escrita (o una combinación que no cabe): se aplica la regla general (4) y queda apuntada; las comprobaciones de la comida no valen ahí.
    const sinLista = log.some((l) => l.que === 'aviso' && /^reserva (sin lista|que no cabe)/.test(l.causa ?? ''))
    // Una lista escrita que, con los trayectos de la prueba, no cabe del todo (la comida cae tarde): se apunta, no es un fallo del motor.
    // (Por tramo y hora: las listas escritas que, con los trayectos de la prueba, dejan la comida tarde.)
    const horaDe = (lugar) => (entradas[lugar] ? toMin(entradas[lugar]) : null)
    const NO_CABE = { coliseo_12_30_14_00_manana: [0, 24 * 60], coliseo_13_30_14_00: [0, 24 * 60], coliseo_14_30_15_30: [0, 24 * 60], museos_13_30_14_30: [0, 24 * 60], museos_mediodia: [0, 13 * 60], coliseo_mediodia: [0, 13 * 60], coliseo_11_30_12_00: [0, 11 * 60 + 30], galeria_tarde: [0, 15 * 60] }
    const listaNoCabe = (dia.curatedDay.variantes ?? []).some((v) => NO_CABE[v] && Object.keys(entradas).some((lugar) => horaDe(lugar) != null && horaDe(lugar) >= NO_CABE[v][0] && horaDe(lugar) <= NO_CABE[v][1]))
    const stops = rows.filter((r) => (r.tipo === 'parada' || r.tipo === 'tour' || r.tipo === 'desayuno') && !r.llegada)
    // 1. El orden
    const base = new Map((dia.ordenBase ?? []).map((id, i) => [id, i]))
    const hayFija = rows.some((r) => r.fija && !r.llegada)
    const secuencia = rows.filter((r) => base.has(r.id) && !r.llegada && !r.fija && !r.relleno && r.tipo !== 'traslado' && !(hayFija && r.tipo === 'comida')).map((r) => base.get(r.id))
    for (let i = 1; i < secuencia.length; i++) if (secuencia[i] < secuencia[i - 1]) { falla('orden', dia, `el orden del día no es el de su lista (${rows.filter((r) => base.has(r.id) && !r.llegada && !r.fija).map((r) => r.titulo ?? r.lugar).slice(0, 6).join(' → ')}…)`); break }
    // Todo lo que falta de la lista tiene su causa (cierre, sobra, pool…)
    const spareIds = new Set((dia.spareRows ?? []).map((r) => r.id))
    for (const id of dia.ordenBase ?? []) {
      if (rows.some((r) => r.id === id) || spareIds.has(id)) continue
      if (/^traslado_/.test(id)) continue // (un traslado no es una parada: si lo que le sigue se quita o no existe ese día, el traslado se va con ello)
      if (!log.some((l) => l.id === id && (l.que === 'quitada' || l.que === 'sobra'))) falla('sin_explicar', dia, `«${id}» está en la lista y no sale ni tiene causa en el registro`)
    }
    // 2b. (Tanda 6b) Nada cerrado a la hora de llegada: una visita por dentro con la llegada orientativa fuera de su horario es un fallo; se espera 15 min como mucho (y entonces la hora ya es la de abrir).
    for (const r of stops) {
      if (r.modo === 'fuera' || r.modo === 'camino' || r.tipo !== 'parada' || r.hora_tipo === 'reserva' || r.llegada) continue
      const p = place(r.lugar)
      if (!p || p.type !== 'interior') continue
      const sesiones = parseHoursSessions(effectiveSchedule(p, dia.hours))
      if (sesiones.length === 0) continue
      const dentro = sesiones.some((x) => r.t0 >= x.open && r.t0 + r.min <= x.close + 1)
      if (!dentro) falla('cerrado_a_la_llegada', dia, `«${r.titulo ?? r.lugar}» sale por dentro hacia las ${Math.floor(r.t0 / 60)}:${String(r.t0 % 60).padStart(2, '0')} y su horario ese día es ${sesiones.map((x) => `${Math.floor(x.open / 60)}:${String(x.open % 60).padStart(2, '0')}-${Math.floor(x.close / 60)}:${String(x.close % 60).padStart(2, '0')}`).join(' y ')}`)
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
      // (Cuenta también la vuelta a una parada con hora fija: Tanda 6b.)
      for (let j = 2; j < puntos.length; j++) for (let i = 0; i < j - 1; i++) {
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
    // (La pirámide manda cuando lo que se quita es por falta de tiempo; un cierre o la hora fija de otra parada tienen su propia regla.)
    for (const s of (dia.spareRows ?? []).filter((x) => x.razon === 'cabe' || x.razon == null)) {
      if ((s.nivel ?? 3) === 1 && !vistos.has(s.lugar) && !rows.some((r) => r.lugar === s.lugar)) falla('piramide', dia, `«${s.titulo ?? s.lugar}» es un imprescindible y pasa a «Si te sobra tiempo» la primera vez`)
      for (const r of stops) if (r.franja === s.franja && r.modo !== 'camino' && r.tipo !== 'desayuno' && !r.relleno && !r.fija && !r.hora_tipo && !r.llegada && valor(r) < valor(s)) falla('piramide', dia, `«${s.titulo ?? s.lugar}» pasa a «Si te sobra tiempo» y «${r.titulo ?? r.lugar}», de menos importancia, se queda`)
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
      // (Tanda 6b) Llegar tarde a una reserva es un fallo; la única excepción apuntada: un Free Tour de mañana y los Museos a las 14:00 el mismo día, donde la comida y el tour no caben juntos.
      // (Tanda 6d: la segunda excepción apuntada: Roma en un día (D0) con el Coliseo a media tarde; todo lo que va antes es imprescindible la primera vez y no hay nada que quitar sin romper la pirámide.)
      // (Tanda 6e: el Free Tour de mañana con los Museos de 13:30 a 14:30 SÍ cabe (tiene lista escrita en el D3); antes de las 13:30 no cabe y la hoja de la reserva lo avisa. Roma en un día con el Coliseo ya tiene lista escrita.)
      const excusadaFt = rows.some((x) => x.tipo === 'tour') && /Museos Vaticanos/.test(lugar) && toMin(hora) < 13 * 60 + 30
      const excusadaD0 = false
      // (Y la tercera: la ciudad solo empieza a las 16:00 por una excursión de medio día y la entrada es a las 16:00: la lista escrita de tarde no cabe antes.)
      const excusadaMedia = Boolean(dia.halfDayExcursion?.soloTarde) && toMin(hora) <= 16 * 60 + 30
      const excusada = excusadaFt || excusadaD0 || excusadaMedia
      // (Hasta 5 min de más son del cálculo de los trayectos, no de la lista.)
      // (Con una lista escrita para esa hora, hasta 10 min de más; el resto, hasta 5: son del cálculo de los trayectos.)
      const conLista = (dia.curatedDay.variantes ?? []).some((v) => /^(coliseo_|museos_|galeria_)/.test(v))
      if (r.tarde > (conLista ? 10 : 5)) (excusada ? avisa : falla)('reserva_tarde', dia, `${lugar}: se llega ${r.tarde} min tarde a la reserva de las ${hora}${excusadaFt ? ' (con Free Tour el mismo día)' : excusadaD0 ? ' (Roma en un día: todo lo de antes es imprescindible)' : excusadaMedia ? ' (la ciudad empieza a las 16:00 por la excursión de medio día)' : ''}`)
    }
    // 2c. (Tanda 6c) La hora que se enseña y la que decide el cierre son la misma: una parada que sale «por fuera» por su horario tiene que estar de verdad cerrada a esa hora.
    for (const r of rows.filter((x) => x.por_horario)) {
      const p = place(r.lugar)
      const sesiones = p ? parseHoursSessions(effectiveSchedule(p, dia.hours)) : []
      const dur = r.previo_min ?? 20
      const ultima = p ? lastEntryMinutes(p, r.t0, dia.hours) : null
      if (sesiones.some((x) => r.t0 >= x.open && r.t0 + dur <= x.close) && (ultima == null || r.t0 <= ultima)) falla('aviso_contradictorio', dia, `«${r.titulo ?? r.lugar}» sale por fuera por su horario hacia las ${Math.floor(r.t0 / 60)}:${String(r.t0 % 60).padStart(2, '0')}, pero a esa hora está abierto`)
    }
    // 2d. (Tanda 6c, regla 6) Antes de quitar algo de la mañana por la comida, se acorta: ninguna parada pasa a «Si te sobra tiempo» por la comida mientras quede en esa mañana algo por dentro que se pueda ver por fuera.
    if (log.some((l) => l.que === 'sobra' && /la comida iba a caer/.test(l.causa ?? ''))) {
      const diaConHoraFija = rows.some((x) => x.fija && !x.llegada)
      const protegidaPorReserva = (r) => diaConHoraFija && place(r.lugar)?.level === 1 && !place(r.lugar)?.acortable && !dentroPrev.has(r.lugar)
      // (Con una hora fija solo cuenta lo que va DESPUÉS de su «Llegada a…»: acortar lo de antes no adelanta la comida.)
      const iUltimaLlegada = diaConHoraFija ? rows.map((x) => x.llegada).lastIndexOf(true) : -1
      const acortable = rows.find((r, k) => k > iUltimaLlegada && r.tipo === 'parada' && r.franja === 'manana' && r.modo === 'dentro' && !r.fija && !r.protegido && !r.llegada && r.hora_tipo == null && (place(r.lugar)?.minutos_fuera ?? 99) < r.min && !protegidaPorReserva(r))
      if (acortable) falla('quitar_sin_acortar', dia, `se quita algo de la mañana por la comida y «${acortable.titulo ?? acortable.lugar}» sigue por dentro (${acortable.min} min)`)
    }
    // 2e. (Tanda 6c) Para llenar huecos solo sitios conocidos (del documento o de nivel 1 o 2): nunca uno poco conocido.
    for (const r of rows.filter((x) => x.relleno)) {
      const p = place(r.lugar)
      if (p && (p.level ?? 3) > 2 && !delDocumento.has(r.lugar)) falla('relleno_desconocido', dia, `el relleno «${r.lugar}» no sale en ningún día del documento y no es de nivel 1 o 2`)
    }
    // 2f. (Tanda 6e, regla 17) Una reserva nunca pasa un imprescindible que se visita por dentro (la Basílica, el Foro, el Panteón…) a «por fuera» o «de camino» la primera vez: se mueve, antes o después.
    if (rows.some((x) => x.fija && !x.llegada) && !sinLista) {
      for (const l of log.filter((x) => x.que === 'modo+min' && /pasa de por dentro a (por fuera|de camino)/.test(x.causa ?? ''))) {
        const r = rows.find((x) => x.id === l.id)
        const p = place(l.sitio ?? r?.lugar)
        if (!r || !p || (p.level ?? 3) !== 1 || p.acortable) continue
        if (r.modo !== 'fuera' && r.modo !== 'camino') continue
        if (dentroPrev.has(r.lugar)) continue // (ya se vio por dentro otro día: no es la primera vez)
        falla('imprescindible_por_reserva', dia, `«${r.titulo ?? r.lugar}», un imprescindible por dentro, pasa a «${r.modo === 'camino' ? 'de camino' : 'por fuera'}» en un día con hora fija (${l.causa})`)
      }
    }
    // 2g. (Tanda 6e) Una reserva sin lista escrita (o una combinación que no cabe) queda apuntada: se cuenta como información, para la tabla del informe.
    for (const l of log.filter((x) => x.que === 'aviso' && /^reserva (sin lista|que no cabe)/.test(x.causa ?? ''))) avisa('sin_lista', dia, l.causa)
    // 7b. (Tanda 6b) La comida nunca detrás de una visita larga con hora fija que empieza entre las 13:30 y las 15:00 (si empieza antes de las 13:30 no cabe comer antes: se apunta); y 0 días que empiezan más tarde por una reserva.
    {
      const comidaIdx = rows.findIndex((x) => x.tipo === 'comida')
      for (const f of rows.filter((x) => x.fija && !x.llegada && x.min > 60 && (x.tipo === 'parada' || x.tipo === 'tour'))) {
        const i = rows.indexOf(f)
        if (comidaIdx >= 0 && comidaIdx > i && f.t0 < 15 * 60) (f.t0 >= 13 * 60 + 30 && !sinLista && !listaNoCabe ? falla : avisa)('comida_tras_hora_fija', dia, `la comida va detrás de «${f.titulo ?? f.lugar}», que empieza a las ${f.hora_fija}`)
      }
      const primera = rows.find((x) => x.tipo !== 'traslado')
      const parte = listas?.days?.[dia.curatedDay.id]?.partes
      const empiezaDoc = parte ? Object.values(parte).map((x) => x.empieza).find(Boolean) : null
      const variantes = dia.curatedDay.variantes ?? []
      const esperado = toMin(variantes.includes('con_free_tour_de_manana') ? '09:00' : empiezaDoc ?? (dia.halfDayExcursion?.soloTarde ? '16:00' : (franjas.inicio ?? '09:00')))
      // (Tanda 6c: el documento ya no dice «el día empieza más tarde» en ningún sitio; el lunes del D4 y los miércoles de audiencia empiezan a su hora.)
      // (Tanda 6d: el miércoles del D2 sin Museos también empieza a su hora; solo quedan los medios días de tarde.)
      const excusado = /medio/.test(dia.curatedDay.id) && dia.written?.grupo === 'tarde'
      // (Si lo primero del día es una hora fija —o su «Llegada a…»—, el día empieza a esa hora: no hay nada que hacer antes y no se inventa.)
      if (primera && !excusado && !dia.halfDayExcursion && !primera.llegada && !primera.fija && primera.t0 > esperado + 15) falla('dia_empieza_tarde', dia, `el día empieza a las ${Math.floor(primera.t0 / 60)}:${String(primera.t0 % 60).padStart(2, '0')} y debería empezar a las ${Math.floor(esperado / 60)}:${String(esperado % 60).padStart(2, '0')}`)
    }
    // (Un «de camino» no va a «Si te sobra tiempo».)
    for (const sp of dia.spareRows ?? []) if (sp.modo === 'camino') falla('camino_en_sobra', dia, `«${sp.titulo ?? sp.lugar}» va de camino y está en «Si te sobra tiempo»`)
    // 8. La comida, como muy tarde a las 14:30
    const comida = rows.find((x) => x.tipo === 'comida')
    // (Tanda 6f: en un día con una reserva —una hora fija— la comida puede ser hasta las 15:00.)
    const comidaLimite = rows.some((x) => x.fija && !x.llegada) ? 15 * 60 : 14 * 60 + 30
    if (comida && comida.llegaA > comidaLimite) {
      const delante = rows.slice(0, rows.indexOf(comida)).filter((x) => (x.tipo === 'parada' || x.tipo === 'tour') && !x.llegada && x.modo !== 'camino' && !x.relleno && !x.protegido)
      const soloImprescindibles = delante.length > 0 && delante.every((x) => (x.nivel ?? 3) === 1 || x.fija)
      // (La mañana larga de los Museos por la tarde —la Cúpula, la Basílica, la Plaza, el Castillo por dentro y el Puente— deja la comida hasta 20 min tarde: lo escribe así el documento.)
      const mananaLargaEscrita = (dia.curatedDay.variantes ?? []).includes('museos_tarde_cupula') && comida.llegaA <= 14 * 60 + 50
      // (Tanda 6i: si el motor ya avisa en su registro de que no cabe del todo y no queda nada que quitar sin romper una comprobación, se apunta: es un aviso que sale al viajero, no un fallo callado.)
      const yaAvisado = (dia.escritoLog ?? []).some((l) => l.que === 'aviso' && /no cabe del todo \(\d+ min de más\) y no queda nada que quitar/.test(l.causa ?? '')) && comida.llegaA <= comidaLimite + 5
      ;(soloImprescindibles || sinLista || listaNoCabe || mananaLargaEscrita || yaAvisado ? avisa : falla)('comida_tarde', dia, `la comida es a las ${Math.floor(comida.llegaA / 60)}:${String(comida.llegaA % 60).padStart(2, '0')}${soloImprescindibles ? ' (delante solo hay imprescindibles)' : ''}`)
    }
    // (Tanda 6f, 3) Ningún nombre de parada dice «iluminada», «de noche» o «ya con las luces»: eso es de las nocturnas, no del día.
    for (const r of rows.filter((x) => x.tipo === 'parada' || x.tipo === 'tour' || x.tipo === 'desayuno')) if (/iluminad|de noche|ya con las luces/i.test(`${r.titulo ?? ''} ${r.lugar ?? ''}`)) falla('nombre_de_noche', dia, `«${r.titulo ?? r.lugar}» lleva en el nombre una palabra de noche`)
    // (Tanda 6f, 4i y 4g) Un «de camino» nunca repite una parada del día (de antes ni de después) y el día nunca empieza con un «de camino».
    for (const r of rows.filter((x) => x.modo === 'camino' && x.tipo === 'parada' && !x.llegada)) if (rows.some((x) => x !== r && x.lugar === r.lugar && x.modo !== 'camino' && x.tipo === 'parada' && !x.llegada)) falla('camino_repetido', dia, `«${r.lugar}» va de camino y es también una parada del día`)
    {
      const primera = rows.find((x) => x.tipo !== 'traslado' && !x.llegada)
      if (primera?.modo === 'camino') falla('dia_empieza_de_camino', dia, `el día empieza con «${primera.titulo ?? primera.lugar}» de camino`)
    }
    // (Tanda 6f, 4b y 4) Las nocturnas, por parejas cercanas (a 15 minutos andando como mucho: en línea recta 1.200 m), y en un viaje de 2,5 días o más ninguna de un sitio visto ese día.
    {
      const nocturnas = (dia.escritoNights ?? []).map((n) => ({ n, c: place(String(n.name).replace(/ (noche)$/, ''))?.coordinates ?? null }))
      for (let i = 0; i < nocturnas.length; i++) for (let j = i + 1; j < nocturnas.length; j++) {
        if (nocturnas[i].c && nocturnas[j].c && straightLineMeters(nocturnas[i].c, nocturnas[j].c) > 1200) falla('noches_lejos', dia, `las nocturnas «${nocturnas[i].n.name}» y «${nocturnas[j].n.name}» están a más de 15 minutos andando`)
      }
      if (dias.length >= 3) {
        const delDia = new Set(rows.filter((x) => (x.tipo === 'parada' || x.tipo === 'tour') && !x.llegada).map((x) => x.lugar))
        for (const n of dia.escritoNights ?? []) {
          const base = String(n.name).replace(/ (noche)$/, '')
          if (delDia.has(base)) falla('noche_de_lo_visto', dia, `la nocturna «${n.name}» es de un sitio que se ve ese mismo día`)
        }
      }
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
  // (Tanda 6f, 4f) El orden de los días: lo imprescindible primero. Los dos primeros días completos son el D1 y el D2 (con Free Tour de mañana, el D3 y el D1-FT); solo cambia por un cierre o una fecha mala que marca el documento.
  {
    const completos = dias.filter((d) => !/medio|^D0$/.test(d.curatedDay.id) && !d.isExcursion && !d.halfDayExcursion).sort((a, b) => a.dayNumber - b.dayNumber)
    const buscados = hasFreeTour ? ['D3', 'D1-FT'] : ['D1', 'D2']
    const primeros = completos.slice(0, 2)
    const faltan = buscados.filter((id) => completos.length >= 2 && !primeros.some((d) => d.curatedDay.id === id) && completos.some((d) => d.curatedDay.id === id))
    for (const id of faltan) {
      // (Lo que el documento marca como mala fecha de ese día: días de la semana, fechas y sitios que cierran; con eso el motor lo cambia por el día siguiente.)
      // (El motor dice por qué retrasó el día: lo que le cuesta en su sitio de la tabla —un sitio cerrado, una mala fecha del documento, un horario especial—; sin motivo es un fallo.)
      const motivo = Object.entries(plan.motivosOrden ?? {}).map(([otro, razones]) => `${otro}: ${razones.join(', ')}`).join('; ')
      const cierre = Boolean(motivo)
      const dia = primeros[0]
      ;(cierre ? avisaOrden : fallaOrden)(dia, `el ${id} no cae en los dos primeros días completos (${primeros.map((d) => `${d.hours.dateIso} ${d.curatedDay.id}`).join(', ')})${motivo ? ` (${motivo})` : ''}`)
    }
  }
  // «Si te sobra tiempo» y lo que cuentan los avisos
  for (const dia of dias) {
    for (const l of dia.escritoLog ?? []) if (l.que === 'aviso' && /no cabe del todo/.test(l.causa ?? '')) avisa('no_cabe_del_todo', dia, l.causa)
    for (const s of dia.spareRows ?? []) avisa('sobra', dia, `«${s.titulo ?? s.lugar}» pasa a «Si te sobra tiempo»`)
  }
  return { fallos, info }
}
