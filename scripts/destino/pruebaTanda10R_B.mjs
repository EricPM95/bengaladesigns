// Tanda 10R (agente B): LA EXCURSIÓN EN RESERVAS, COMO UNA ENTRADA (`Piezas/Entradas Billete` E1-E5).
//   A · sin navegador: el código (piezas compartidas, aviso `documento_excursion`, store `excursiones`, sin migración, sin «Eliminar»).
//   B · sin pase y con pase (Chrome, 375 px): la tarjeta, [Añadir tu excursión] con candado y su aviso (sin pase), el billete guardado, «Datos de la excursión», [Cómo llegar al punto de encuentro] (solo con pase),
//       la papelera, y que el día de la excursión NO cambia al reservarla ni al guardar los datos (regla 6j).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10R_B.mjs
import fs from 'node:fs'
import path from 'node:path'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

/* ───────────────────────── A. Sin navegador ───────────────────────── */
console.log('A. El código')
{
  const exc = leer('src/components/route/reservas/ExcursionConBillete.tsx')
  const lista = leer('src/components/route/reservas/ExcursionesReservas.tsx')
  const store = leer('src/store/useBilleteStore.ts')
  const botones = leer('src/components/route/reservas/BotonesDeReserva.tsx')
  const textos = leer('src/lib/avisoPaseTextos.ts')
  debe(/documento_excursion/.test(botones) && /clave="documento_excursion"/.test(exc), 'clave', 'ClaveDocumento lleva `documento_excursion` y [Añadir tu excursión] la usa')
  debe(textos.includes('Con el {pase}, guardas el billete de tu excursión y lo tienes a mano en el punto de encuentro, aunque no haya internet.'), 'aviso', 'el aviso pequeño de la excursión, con el texto de Eric')
  debe(/excursiones\?: Record<string, BilleteDeExcursion>/.test(store) && /ponerExcursion/.test(store) && /quitarExcursion/.test(store), 'store', '`excursiones[refId]` en el store del billete (ponerExcursion / quitarExcursion)')
  debe(/salida\.excursiones = excursiones/.test(store), 'privado', 'lo de las excursiones es privado por persona (delDueno lo filtra, como las entradas)')
  debe(/PapeleraRoja/.test(exc) && /LapizDeReserva/.test(exc) && /SeccionDatos/.test(exc) && /CajaDia/.test(exc) && /CajaHora/.test(exc), 'piezas', 'usa las piezas de la 10S8: papelera roja, lápices, datos, cajas de día y hora')
  debe(/Datos de la excursión/.test(exc) && /Guardar los datos/.test(exc) && /Cómo llegar al punto de encuentro/.test(exc) && /Toca para ampliar/.test(exc), 'textos', 'Datos de la excursión, [Guardar los datos], [Cómo llegar al punto de encuentro] y «Toca para ampliar»')
  debe(!/LineaReservada/.test(lista) && /TarjetaExcursionDesign/.test(lista), 'lista', 'en RESERVAS la excursión reservada ya no es una línea verde: es la tarjeta de Design')
  debe(!/addReservation\(/.test(lista), 'no mueve', 'guardar los datos no vuelve a colocar la excursión (no llama a addReservation)')
  const migraciones = fs.readdirSync('supabase/migrations').filter((f) => /excursion/i.test(f) && /10r/i.test(f))
  debe(migraciones.length === 0, 'sin migracion', 'sin migración nueva')
}
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const DIBUJO = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#fff"/><path d="M0 0h3v3H0zM5 0h3v3H5zM0 5h3v3H0zM4 4h1v1H4zM6 5h2v1H6zM5 7h1v1H5z" fill="#111"/></svg>').toString('base64')

async function pasada(version) {
  const sin = version === 'gratis'
  const quien = sin ? 'sin pase' : 'con pase'
  console.log(`\nB. La pantalla ${quien} (375 px)`)
  const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}`, ancho: 375, alto: 812 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let intento = 0; intento < 3; intento++) {
      for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
      try {
        await ev('window.__rutaPrueba().then(() => true)')
        break
      } catch (e) {
        if (intento === 2) throw e
        await ev('location.reload()').catch(() => undefined)
        await a.esp(5000)
      }
    }
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
    // El viaje de pruebas tiene 3 días y las excursiones de Roma salen desde 4: se añade un día libre.
    await R("if (route().days.filter((x) => !x.isReturnLeg).length < 4) st().addFreeDay('Día libre'); return true")
    await a.esp(1500)
    // Un día de excursión posible (no el de llegada ni el de vuelta) y la excursión «pompeya_sorrento» reservada en él.
    const base = await R(`const r = route(); const dias = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x)); const d = dias[2] ?? dias[dias.length - 1]; return { dateIso: B.dateOfDay(r, d), diaId: d.id, nParadas: d.stops.length }`)
    await R(`st().addReservation({ id: 'res-10r-b', kind: 'excursion', refId: 'pompeya_sorrento', name: 'Excursión a Pompeya y Sorrento', placeNames: [], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '07:30', excursionId: 'pompeya_sorrento', excursionData: null, precio: { amount: 98.26, currency: 'EUR' }, meetingPoint: 'Piazza della Repubblica' }, null, null); return true`)
    await a.esp(1500)
    await R("st().setMode('bookings'); return true")
    for (let i = 0; i < 30 && !(await ev("Boolean(document.querySelector('[data-blk=excursiones]'))")); i++) await a.esp(500)
    await a.esp(800)
    const fila = '[data-excursion-fila="pompeya_sorrento"]'
    const diaDe = () => R(`const r = route(); const d = r.days.find((x) => (x.excursions ?? []).some((e) => e.id === 'pompeya_sorrento') || x.selectedExcursionId === 'pompeya_sorrento'); return d ? d.id : null`)
    const diaAntes = await diaDe()

    /* — E1: la tarjeta — */
    await ev(`document.querySelector(${JSON.stringify(fila)})?.scrollIntoView({ block: 'center' }); true`)
    await a.esp(500)
    const e1 = await ev(`(() => {
      const f = document.querySelector(${JSON.stringify(fila)}); if (!f) return { hay: false }
      const medidas = (s) => Array.from(f.querySelectorAll(s)).map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] })
      const nombre = f.querySelector('[data-excursion-nombre]')
      return { hay: true, crema: Boolean(f.querySelector('[data-tarjeta-crema]')), chip: f.querySelector('[data-excursion-chip]')?.textContent, nombre: nombre?.textContent, nombreFuente: nombre ? getComputedStyle(nombre).fontSize : null, hora: f.querySelector('[data-caja-hora]')?.textContent, dia: f.querySelector('[data-caja-dia]')?.textContent, lapices: medidas('[data-lapiz]'), papelera: medidas('[data-papelera]'), texto: f.innerText.replace(/\\s+/g, ' '), boton: f.querySelector('[data-anadir-doc]')?.textContent.trim() ?? null, candado: f.querySelector('[data-anadir-doc]')?.getAttribute('data-con-candado'), comoLlegar: Boolean(f.querySelector('[data-como-llegar-punto-encuentro]')), candadoComoLlegar: Boolean(f.querySelector('[data-candado="como-llegar-punto-encuentro"]')) , cuenta: document.body.innerText.includes('Reservadas · 1') }
    })()`)
    debe(e1.hay && e1.crema, 'E1', 'la excursión reservada es la tarjeta crema de las entradas')
    debe(e1.chip === 'Excursión' && /Excursión a Pompeya y Sorrento/.test(e1.nombre ?? '') && e1.nombreFuente === '28px', 'E1 nombre', `«Excursión» pequeño y el nombre grande a 28 px (${e1.chip} · ${e1.nombreFuente})`)
    debe(/07:30/.test(e1.hora ?? '') && /\d/.test(e1.dia ?? ''), 'E1 cajas', `el día y la hora en sus dos cuadros (${(e1.dia ?? '').trim()} · ${(e1.hora ?? '').trim()})`)
    debe(e1.lapices.length === 2 && e1.lapices.every(([w, h]) => w === 44 && h === 44), 'E1 lapices', `dos lápices de 44 × 44 (${JSON.stringify(e1.lapices)})`)
    debe(e1.papelera.length === 1 && e1.papelera[0][0] === 44 && e1.papelera[0][1] === 44, 'E1 papelera', `la papelera roja de 44 × 44 (${JSON.stringify(e1.papelera)})`)
    debe(/98,26 €|98.26 €|€ ?98/.test(e1.texto), 'E1 precio', `el precio en su fila (${e1.texto.slice(0, 140)})`)
    debe(/Piazza della Repubblica/.test(e1.texto), 'E1 punto', 'el punto de encuentro en su fila')
    debe(e1.boton === 'Añadir tu excursión' && e1.candado === (sin ? '1' : '0'), 'candado', sin ? '[Añadir tu excursión] lleva el candado dorado sin pase' : '[Añadir tu excursión] sin candado con pase')
    debe(sin ? !e1.comoLlegar : e1.comoLlegar, 'como llegar', sin ? 'sin pase no sale el botón [Cómo llegar al punto de encuentro]' : 'con pase, [Cómo llegar al punto de encuentro]')
    debe(!/Eliminar|Quitar excursión/.test(e1.texto), 'sin eliminar', 'sin «Eliminar excursión»: la papelera lo sustituye')
    await a.captura(path.join(SALIDA, `10r_reservas_excursion_${version}_375.jpg`)).catch(() => {})

    /* — El aviso sin pase — */
    if (sin) {
      await ev(`document.querySelector(${JSON.stringify(fila + ' [data-anadir-doc]')})?.click(); true`)
      await a.esp(900)
      const aviso = await ev("(document.querySelector('[data-aviso-pase]')?.innerText ?? '').replace(/\\s+/g, ' ')")
      debe(/guardas el billete de tu excursión y lo tienes a mano en el punto de encuentro, aunque no haya internet/.test(aviso) && /Pase Roma/.test(aviso), 'aviso', `el aviso dice lo que toca (${aviso.slice(0, 170)})`)
      debe(/Ver el Pase Roma/.test(aviso), 'aviso', '…con [Ver el Pase Roma]')
      await a.captura(path.join(SALIDA, `10r_reservas_excursion_aviso_375.jpg`)).catch(() => {})
      await ev("(() => { const d = document.querySelector('[data-aviso-pase]')?.closest('[role=dialog]'); d?.querySelector('button[aria-label=Cerrar]')?.click(); return true })()")
      await a.esp(500)
    }

    /* — E2: con su billete (guardado antes de que acabase el pase: se ve igual) — */
    await ev(`(async () => { const S = await import('/src/store/useBilleteStore.ts'); const st = S.useBilleteStore.getState(); st.ponerExcursion(st.tripId, 'pompeya_sorrento', { personas: 2, localizador: 'CIV48213', codigo: { texto: 'CIVITATIS|CIV48213', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(DIBUJO)} }, dueno: null }); return true })()`)
    await a.esp(1500)
    const e2 = await ev(`(() => { const f = document.querySelector(${JSON.stringify(fila)}); return { texto: f.innerText.replace(/\\s+/g, ' '), codigo: Boolean(f.querySelector('[data-excursion-codigo-pequeno] img')), anadir: Boolean(f.querySelector('[data-anadir-doc]')), papelera: f.querySelectorAll('[data-papelera]').length } })()`)
    debe(/Localizador CIV48213/.test(e2.texto) && /Toca para ampliar/.test(e2.texto) && e2.codigo, 'E2', `con billete: localizador y el código con «Toca para ampliar» (${sin ? 'SIN pase: lo guardado se ve' : 'con pase'})`)
    debe(!e2.anadir && e2.papelera === 1, 'E2 limpio', 'sin [Añadir tu excursión] y con la papelera')
    await a.captura(path.join(SALIDA, `10r_reservas_excursion_billete_${version}_375.jpg`)).catch(() => {})
    // El código a pantalla completa.
    await ev(`document.querySelector(${JSON.stringify(fila + ' [data-excursion-codigo-pequeno]')})?.click(); true`)
    await a.esp(800)
    const grande = await ev("(document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ')")
    debe(/Excursión a Pompeya y Sorrento/.test(grande) && /Localizador CIV48213/.test(grande), 'E3', 'el código a pantalla completa con el nombre y el localizador')
    await ev("document.querySelector('[data-billete-cerrar]')?.click(); true")
    await a.esp(500)

    /* — «Datos de la excursión» — */
    await ev(`document.querySelector(${JSON.stringify(fila + ' [data-lapiz="excursion-datos"]')})?.click(); true`)
    await a.esp(1500)
    const d = await ev(`(() => ({ titulo: document.querySelector('[data-hoja-titulo]')?.textContent ?? null, boton: document.querySelector('[data-excursion-guardar]')?.textContent.trim() ?? null, loc: document.querySelector('[data-excursion-campo="localizador"]')?.value, per: document.querySelector('[data-excursion-campo="personas"]')?.value, punto: document.querySelector('[data-excursion-campo="punto"]')?.value, hora: document.querySelector('[data-excursion-campo="hora"]')?.value }))()`)
    debe(d.titulo === 'Datos de la excursión' && d.boton === 'Guardar los datos', 'Datos', `«Datos de la excursión» con [Guardar los datos] (${d.titulo} · ${d.boton})`)
    debe(d.loc === 'CIV48213' && d.per === '2' && d.punto === 'Piazza della Repubblica' && d.hora === '07:30', 'Datos contenido', `con lo guardado (${JSON.stringify(d)})`)
    await a.captura(path.join(SALIDA, `10r_reservas_excursion_datos_${version}_375.jpg`)).catch(() => {})
    await ev(`(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; const e = document.querySelector('[data-excursion-campo="punto"]'); set.call(e, 'Termini, Roma'); e.dispatchEvent(new Event('input', { bubbles: true })); const h = document.querySelector('[data-excursion-campo="hora"]'); set.call(h, '08:00'); h.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    await a.esp(300)
    await ev("document.querySelector('[data-excursion-guardar]')?.click(); true")
    await a.esp(1500)
    const tras = await ev(`(() => { const f = document.querySelector(${JSON.stringify(fila)}); return { texto: f.innerText.replace(/\\s+/g, ' '), hora: f.querySelector('[data-caja-hora]')?.textContent } })()`)
    debe(/Termini, Roma/.test(tras.texto) && /08:00/.test(tras.hora ?? ''), 'Datos guarda', '[Guardar los datos] cambia el punto de encuentro y la hora en la tarjeta')
    debe((await diaDe()) === diaAntes, 'no mueve', 'guardar los datos no cambia el día de la excursión en la ruta (regla 6j)')
    if (!sin) {
      const enlace = await ev(`document.querySelector(${JSON.stringify(fila + ' [data-como-llegar-punto-encuentro]')})?.getAttribute('href') ?? null`)
      debe(/google\.com\/maps\/dir/.test(enlace ?? '') && /Termini/.test(decodeURIComponent(enlace ?? '')), 'como llegar', `[Cómo llegar al punto de encuentro] abre Maps con el punto (${enlace})`)
      await ev(`document.querySelector(${JSON.stringify(fila)})?.scrollIntoView({ block: 'center' }); true`)
      await a.captura(path.join(SALIDA, `10r_reservas_excursion_comollegar_375.jpg`)).catch(() => {})
    }

    /* — El lápiz de arriba — */
    await ev(`document.querySelector(${JSON.stringify(fila + ' [data-lapiz="excursion-arriba"]')})?.click(); true`)
    await a.esp(1200)
    debe(await ev("document.querySelectorAll('[data-dia-cuadrado]').length > 0"), 'lapiz arriba', 'el lápiz de arriba abre excursión/día/hora (los cuadrados de día)')
    await ev("document.querySelector('[role=dialog] button[aria-label=Cerrar]')?.click(); true")
    await a.esp(500)

    /* — La papelera — */
    await ev(`document.querySelector(${JSON.stringify(fila + ' [data-papelera]')})?.click(); true`)
    await a.esp(1200)
    const quedan = await R("return st().reservations.filter((x) => x.refId === 'pompeya_sorrento').length")
    debe(quedan === 0, 'papelera', 'la papelera quita la excursión (con su Deshacer)')
    const hayBillete = await ev("(async () => { const S = await import('/src/store/useBilleteStore.ts'); return Boolean(S.useBilleteStore.getState().datos.excursiones?.pompeya_sorrento) })()")
    debe(hayBillete === false, 'papelera', 'y se lleva su billete')
    debe(await ev("Array.from(document.querySelectorAll('button')).some((b) => /Deshacer/.test(b.textContent || ''))"), 'papelera', 'sale «Deshacer»')
  } finally {
    a.cerrar()
  }
}

await pasada('gratis')
await pasada('pago')

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
