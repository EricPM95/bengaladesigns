// Los casos de capturasV69_b.mjs (separados para poder repetir uno solo).
const QR = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path fill="#111" d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM3 3h3v3H3zM15 3h3v3h-3zM3 15h3v3H3zM10 1h1v2h-1zM10 5h2v1h-2zM9 9h3v1H9zM13 10h2v2h-2zM17 12h3v1h-3zM10 14h2v3h-2zM14 15h3v1h-3zM18 17h2v3h-2zM13 18h3v2h-3z"/></svg>')}`

export async function casos(c) {
  const { a, ev, R, lanza, quiere, montar, abrirAnadir, elegirDia, ponerHora, sacar, clic, clicTexto, log } = c
  const dias = await ev(`(async () => { const r = ${R}.getState().route; const i0 = r.answers.dateRange.start; return r.days.map((d) => ({ n: d.dayNumber, id: d.id, ret: !!d.isReturnLeg, iso: new Date(new Date(i0 + 'T12:00:00Z').getTime() + (d.dayNumber - 1) * 86400000).toISOString().slice(0, 10), stops: d.stops.map((s) => s.name) })) })()`)
  const diaDe = (nombre) => dias.find((d) => d.stops.some((s) => new RegExp('^' + nombre + '$', 'i').test(s)))
  const ciudad = dias.filter((d) => !d.ret)
  const isos = ciudad.map((d) => d.iso)
  console.log('dias', JSON.stringify(dias.map((d) => [d.n, d.iso, d.ret])))
  const guardar = async (rx = '^Guardar (la entrada|el Free Tour|la excursión)') => {
    console.log('guardar', await clicTexto(rx))
    await a.esp(3500)
  }
  /** Mete la parada del Free Tour en el día 1 (como la V60), a la hora dicha: la hora de la ruta de ese día. */
  const conFreeTour = (hora = '09:30') => `(() => { const d1 = r.days[0]; if (!d1.stops.some((s) => s.isFreeTour)) { const m = d1.stops.find((s) => !s.isArrival); d1.stops.splice(d1.stops.indexOf(m) + 1, 0, { ...m, id: 'ft-v69', name: 'Free Tour por Roma', isFreeTour: true, time: '${hora}', reservedId: null, checkedInAt: null }) } })()`
  const horasMock = (porDia) => ({ actividadId: 777, conHorasFijas: true, dias: Object.fromEntries(isos.map((d, i) => [d, porDia[i] ?? { sinPlazas: false, horas: [] }])) })
  const H = (hora, plazas = null) => ({ hora, plazas, aviso: plazas != null && plazas <= 3 ? `Últimas ${plazas} plazas` : null })
  const montarFT = async ({ horas, llegada = null, hora = '09:30' }) => {
    await a.evaluar(`(async () => { const r = JSON.parse(window.__base); r.arrivalFlightTime = ${JSON.stringify(llegada)}; if (${JSON.stringify(llegada)} && !r.arrivalPointId) r.arrivalPointId = 'fco'; ${conFreeTour(hora)}; window.__base2 = JSON.stringify(r); return true })()`)
    await montar({ horas })
    await a.evaluar(`(async () => { const st = ${R}; st.setState({ route: JSON.parse(window.__base2) }); return true })()`)
    await a.esp(1500)
  }

  // ---- 2 · E1/E2: mover días por una entrada o una excursión ----
  if (quiere('E1') && !lanza) {
    await montar({})
    if (await abrirAnadir('Coliseo')) {
      await elegirDia(ciudad[0].id)
      await ponerHora('13:00')
      await guardar()
      await sacar('E1', '[data-hoja-mover-dias]')
      // [Cambiar los días]: se aplica y sale el aviso de abajo con [Deshacer].
      console.log('grandes', await ev(`(async () => { const B = await import('/src/lib/bookings.ts'); const r = ${R}.getState().route; return JSON.stringify([r.destination, B.sitiosGrandesDelViaje(r), r.days.map((d) => [d.id, !!d.originalSnapshot, d.userAdded, d.ownDay, d.dayType])]) })()`))
      await clic('[data-mover-dias-cambiar]')
      for (let i = 0; i < 40; i++) {
        await a.esp(1500)
        if ((await ev(`${R}.getState().route.days[0].curatedId`)) !== 'D2') break
      }
      await a.esp(1200)
      log.E1_despues = await ev(`JSON.stringify(${R}.getState().route.days.map((d) => [d.dayNumber, d.curatedId, d.stops.filter((s) => /^(Coliseo|Foro Romano y Palatino|Museos Vaticanos y Cap)/.test(s.name)).map((s) => s.time + ' ' + s.name)]))`)
      console.log('despues', log.E1_despues)
      console.log('completo', await ev(`JSON.stringify([${R}.getState().route.days.map((d) => [d.dayNumber, d.curatedId, d.stops.map((s) => s.time + ' ' + s.name.slice(0, 14))]), window.__sitiosRepetidosLog, (await import('/src/store/useNoticesStore.ts')).useNoticesStore.getState().pushed.map((n) => n.title + ': ' + n.text)])`))
      await a.captura(`${c.CAP}/E1_aviso_app.jpg`)
      log.E1_aviso = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ').slice(0, 300)")
    }
    // [Solo mover la entrada]: solo los sitios de la entrada, a su hora; los demás días no se tocan.
    await montar({})
    const antes = await ev(`JSON.stringify(${R}.getState().route.days.map((d) => [d.dayNumber, d.curatedId, d.stops.length]))`)
    if (await abrirAnadir('Coliseo')) {
      await elegirDia(ciudad[0].id)
      await ponerHora('13:00')
      await guardar()
      await clic('[data-mover-dias-solo]')
      await a.esp(3000)
      log.E1_solo = await ev(`JSON.stringify(${R}.getState().route.days.map((d) => [d.dayNumber, d.curatedId, d.stops.length, d.stops.filter((s) => /^(Coliseo|Foro Romano y Palatino)/.test(s.name)).map((s) => s.time + ' ' + s.name)]))`)
      log.E1_solo_antes = antes
      console.log('solo antes', antes, '\nsolo despues', log.E1_solo)
      await a.captura(`${c.CAP}/E1_solo_aviso_app.jpg`)
    }
  }

  if (quiere('E2') && !lanza) {
    await a.evaluar(`(async () => { const r = JSON.parse(window.__base); const d3 = r.days[2]; d3.dayType = 'excursion'; d3.stops = []; d3.meals = []; d3.title = 'Excursión a Pompeya'; d3.curatedTitle = 'Excursión a Pompeya'; window.__base2 = JSON.stringify(r); return true })()`)
    await a.evaluar(`(async () => { window.__base = window.__base2; return true })()`)
    await montar({})
    const info = await ev(`(async () => { const m = await import('/src/lib/destinationExcursions.ts'); const r = ${R}.getState().route; const d = await m.fetchDestinationExcursions(r.destination); const l = (d.excursions ?? d.lista ?? []); window.__exc = l.find((e) => e.length !== 'half-day' && !/medio/i.test(e.durationLabel ?? '')) ?? l[0]; return JSON.stringify({ claves: Object.keys(d), n: l.length, t: window.__exc?.title, len: window.__exc?.length }) })()`)
    console.log('exc', info)
    await ev(`(async () => { (await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore.getState().pedirExcursion(window.__exc, ${JSON.stringify(ciudad[0].id)}); return true })()`)
    await a.esp(3500)
    await sacar('E2_antes')
    await ponerHora('07:30')
    await guardar('^Guardar la excursi')
    await sacar('E2', '[data-hoja-mover-dias]')
    await clic('[data-mover-dias-solo]')
    await a.esp(3000)
    log.E2_solo = await ev(`JSON.stringify(${R}.getState().route.days.map((d) => [d.dayNumber, d.curatedId, d.dayType, d.stops.length]))`)
    console.log('E2 solo', log.E2_solo)
  }

  // ---- 3 · «Revisa las horas» ----
  if ((quiere('A1a') || quiere('A1c')) && !lanza) {
    await montar({ ruta: { arrivalFlightTime: '17:30', arrivalPointId: 'fco' } })
    if (await abrirAnadir('Coliseo')) {
      await elegirDia(ciudad[0].id)
      await ponerHora('10:00')
      await guardar()
      await sacar('A1a', '[data-hoja-revisa-las-horas]')
      if (quiere('A1c')) {
        await clic('[data-enlace-hoja="guardarla-igualmente"]')
        await a.esp(2500)
        await ev("(await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore.getState().pedir('entradas')")
        await a.esp(1500)
        await a.evaluar("(() => { const e = document.querySelector('[data-aviso-documento]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
        await sacar('A1c', '[data-aviso-documento]')
        log.A1c_reservas = await ev(`JSON.stringify(${R}.getState().reservations.map((x) => [x.name, x.time, x.dateIso, x.revisarHoras]))`)
        log.A1c_ruta = await ev(`JSON.stringify(${R}.getState().route.days.map((d) => [d.dayNumber, d.stops.filter((s) => /^Coliseo$/.test(s.name)).map((s) => s.time + (s.reservedId ? ' RESERVADO' : ''))]))`)
        console.log('A1c', log.A1c_reservas, log.A1c_ruta)
      }
    }
  }
  if (quiere('A1b') && !lanza) {
    const reservaFT = { id: 'res-ft-v69', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: ciudad[2].iso, dayNumber: null, time: '12:00', precio: null }
    await montar({ reservas: [reservaFT] })
    if (await abrirAnadir('Coliseo')) {
      await elegirDia(ciudad[2].id)
      await ponerHora('13:00')
      await guardar()
      await sacar('A1b', '[data-hoja-revisa-las-horas]')
    }
  }

  // ---- 4 · «Elige día y hora»: las horas en botones ----
  if (!lanza && (quiere('H1') || quiere('H1b') || quiere('H2') || quiere('H3') || quiere('H3b'))) {
    const dia1 = { sinPlazas: false, horas: [H('10:00'), H('12:00', 3), H('15:00'), H('19:00')] }
    const dia2 = { sinPlazas: false, horas: [H('10:00'), H('12:00', 3), H('19:00')] }
    if (quiere('H1') || quiere('H1b')) {
      await montarFT({ horas: horasMock([dia1, dia2, dia1]) })
      if (await abrirAnadir('Free Tour')) {
        await elegirDia(ciudad[1].id)
        await a.esp(1500)
        await sacar('H1')
        await clic('[data-hora-boton="19:00"]')
        await a.esp(500)
        log.H1_elegida = await a.evaluar("document.querySelector('[data-hora-elegida=\"1\"]')?.getAttribute('data-hora-boton')")
        await sacar('H1b')
      }
    }
    if (quiere('H2')) {
      await montarFT({ horas: horasMock([{ sinPlazas: true, horas: [] }, dia2, dia1]) })
      if (await abrirAnadir('Free Tour')) {
        await elegirDia(ciudad[0].id)
        await a.esp(1500)
        await sacar('H2')
      }
    }
    if (quiere('H3')) {
      await montarFT({ horas: null })
      if (await abrirAnadir('Free Tour')) {
        await elegirDia(ciudad[1].id)
        await a.esp(1500)
        await sacar('H3')
      }
    }
    if (quiere('H3b')) {
      // El día de llegada: las horas antes de quedar libre, «No llegas»; y una agotada (la de las 17:00 solo está el día 2).
      const l1 = { sinPlazas: false, horas: [H('10:00'), H('12:00'), H('15:00', 3), H('19:00')] }
      const l2 = { sinPlazas: false, horas: [H('10:00'), H('12:00'), H('15:00'), H('17:00'), H('19:00')] }
      await montarFT({ horas: horasMock([l1, l2, l2]), llegada: '13:30' })
      if (await abrirAnadir('Free Tour')) {
        await elegirDia(ciudad[0].id)
        await a.esp(1500)
        await sacar('H3b')
      }
    }
  }

  // ---- 6 · [Ver entrada] ----
  if (quiere('V1') || quiere('V2') || quiere('L_V2')) {
    const sitio = lanza ? 'Jameos del Agua' : 'Coliseo'
    const conDoc = quiere('V1')
    const id = conDoc ? 'V1' : lanza ? 'L_V2' : 'V2'
    await a.evaluar(`(async () => {
      const st = ${R}
      try { sessionStorage.clear() } catch {}
      const r = JSON.parse(window.__base)
      st.setState({ route: r, reservations: [], screen: 'route' })
      const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
      const b = (await import('/src/store/useBilleteStore.ts')).useBilleteStore
      b.setState({ datos: {}, tripId: tid ?? null })
      const B = await import('/src/lib/bookings.ts')
      const d = r.days.find((x) => x.stops.some((s) => s.name === ${JSON.stringify(sitio)}))
      const parada = d.stops.find((s) => s.name === ${JSON.stringify(sitio)})
      st.getState().addReservation({ id: 'res-v69', kind: 'entrada', refId: ${JSON.stringify(sitio)}, name: ${JSON.stringify(sitio)}, placeNames: [${JSON.stringify(sitio)}], dateIso: B.dateOfDay(r, d), dayNumber: null, time: parada.time || '09:15', precio: { amount: 25, currency: 'EUR' } }, null, null)
      ${conDoc ? `b.getState().ponerEntrada(tid ?? null, ${JSON.stringify(sitio)}, { personas: 2, localizador: 'K7M2QX', codigo: { texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(QR)} }, dueno: null })` : ''}
      st.getState().setActiveDayId(d.id); st.getState().setMode('days')
      return true })()`)
    await a.esp(2500)
    // La ficha de la parada → pestaña «Entradas».
    console.log('abrir', await a.evaluar(`(() => { const el = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && new RegExp('^' + ${JSON.stringify(sitio)} + '$').test((x.textContent || '').trim())); if (!el) return 'sin ' + ${JSON.stringify(sitio)}; el.click(); return 'click' })()`))
    await a.esp(2800)
    await a.evaluar(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Entradas/.test((x.textContent || '').trim())); if (b) b.click(); return true })()`)
    await a.esp(1800)
    await a.evaluar("(() => { const e = document.querySelector('[data-ficha-seccion=\"tu-entrada\"]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(800)
    await sacar(id + '_ficha', '[data-ficha-seccion="tu-entrada"]')
    console.log('ver entrada', await clic('[data-ver-entrada]'))
    await a.esp(1500)
    await sacar(id)
  }
}
