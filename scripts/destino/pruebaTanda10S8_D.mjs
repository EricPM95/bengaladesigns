// Tanda 10S8 (agente D): «Entradas y Free Tour» en claro como Design (E1-E5) y «Alojamiento» como Design (A1-A3), con el candado del pase en los botones de añadir documento.
//   A · sin navegador: el código (sin «Eliminar alojamiento»/«Quitar entrada», sin «2 personas», sin línea de texto bajo el título, los dos lápices y la papelera).
//   B · sin pase (Chrome, 375 px): [Añadir tu entrada] y [Añadir tu reserva] con candado y su aviso; «Listo» con el hotel puesto y sin reserva; la entrada en claro; lo guardado se ve sin pase.
//   C · con pase: sin candado; zona y dirección UNA sola vez; Datos de la reserva con Dirección/Teléfono/Localizador; Datos de la entrada sin «personas»; la papelera quita.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S8_D.mjs
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
  const aloj = leer('src/components/route/reservas/AlojamientoReservas.tsx')
  const entradas = leer('src/components/route/reservas/EntradasYFreeTour.tsx')
  const billete = leer('src/components/route/reservas/EntradaConBillete.tsx')
  const piezas = leer('src/components/route/reservas/PiezasDesignReservas.tsx')
  const hojaEntrada = leer('src/components/route/reservas/AddReservationSheet.tsx')
  debe(!/Eliminar alojamiento/.test(aloj) && /PapeleraRoja/.test(aloj), 'papelera', '«Eliminar alojamiento» sale: la papelera roja lo sustituye')
  debe(!/Quitar tu billete|Quitar entrada/.test(billete + entradas) && /PapeleraRoja/.test(billete), 'papelera', '«Quitar entrada» / «Quitar tu billete» salen: la papelera roja lo sustituye')
  debe(/LapizDeReserva/.test(billete) && /LapizDeReserva/.test(aloj) && /LapizDeReserva/.test(piezas), 'lapices', 'los dos lápices (el de arriba y el del bloque de datos) en las entradas y en el alojamiento')
  debe(/BotonAnadirDocumento/.test(billete) && /documento_entrada/.test(billete) && /documento_alojamiento/.test(leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')), 'candado', '[Añadir tu entrada] y [Añadir tu reserva] salen del botón compartido con el candado')
  debe(!/data-entrada-ayuda/.test(billete) && !/data-reserva-aloj-ayuda/.test(leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')), 'ayuda', 'fuera «Desde el PDF, una foto o una captura.» de las dos tarjetas (Design no la lleva)')
  debe(!/data-entrada-dato="personas"/.test(hojaEntrada) && !/textoPersonas\(/.test(billete.replace(/export const textoPersonas[^\n]*/, '')), 'sin_personas', 'en «Datos de la entrada» ya no hay «Personas» ni «2 personas»')
  debe(/data-cabecera-clara/.test(piezas) && !/EstadoBloque|background: '#1C2230', color: '#FBF3E2'/.test(entradas), 'claro', 'la cabecera de «Entradas y Free Tour» es la clara (no la tarjeta azul oscuro)')
  debe(/soloDatos/.test(hojaEntrada) && /Datos de la entrada/.test(hojaEntrada) && /Guardar los datos/.test(hojaEntrada), 'e5', 'el lápiz del bloque abre «Datos de la entrada» con [Guardar los datos]')
  debe(/Datos de la reserva/.test(leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')) && /Guardar los datos/.test(leer('src/components/route/reservas/ReservaDelAlojamiento.tsx')), 'a3', 'el lápiz del bloque del alojamiento abre «Datos de la reserva» con [Guardar los datos]')
}
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B y C. La pantalla ───────────────────────── */
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
    const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); const ft = r.days.flatMap((x) => x.stops).find((p) => p.isFreeTour); return { dateIso: B.dateOfDay(r, d), nombre: s.name, freeTour: ft ? ft.name : null, ftDia: ft ? B.dateOfDay(r, r.days.find((x) => x.stops.includes(ft))) : null }`)
    // La ruta de prueba no trae Free Tour: se le pone uno (una parada con isFreeTour) en el mismo día, para ver su tarjeta.
    if (!base.freeTour) {
      base.freeTour = 'Free Tour'
      await R(`const r = route(); const dias = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x)); const d = dias[2] ?? dias[dias.length - 1]; const s = d.stops.find((p) => !p.isFreeTour && !p.passThrough && p.name) ?? d.stops[0]; const ft = { ...s, id: 'ft-10s8-d', name: 'Free Tour de Roma', isFreeTour: true, photoUrl: null }; R.useRouteStore.setState({ route: { ...r, days: r.days.map((x) => (x.id === d.id ? { ...x, stops: [...x.stops, ft] } : x)) } }); return B.dateOfDay(r, d)`).then((iso) => { base.ftDia = iso })
    }
    await R(`st().addReservation({ id: 'res-10s8-d', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
    if (base.freeTour) await R(`st().addReservation({ id: 'res-10s8-ft', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour', placeNames: [], dateIso: ${JSON.stringify(base.ftDia)}, dayNumber: null, time: '10:00' }, null, null); return true`)
    const abre = async (b) => {
      await R("st().setMode('bookings'); return true")
      await a.esp(1800)
      await ev(`(() => { const b = document.querySelector('[data-blk="${b}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema]').length === 0) b.querySelector('[data-cabecera-clara]')?.click(); return true })()`)
      await a.esp(1200)
    }
    const fila = (nombre) => `[data-entrada-fila="${nombre.replace(/"/g, '\\"')}"]`

    /* — Entradas (E1) — */
    await abre('entradas')
    const e1 = await ev(`(() => {
      const f = document.querySelector(${JSON.stringify(fila(base.nombre))}); const b = document.querySelector('[data-blk="entradas"]')
      const cab = b.querySelector('[data-cabecera-clara]'); const titulo = b.querySelector('[data-titulo-bloque]')
      const medidas = (s) => Array.from(f.querySelectorAll(s)).map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] })
      const bg = getComputedStyle(b).backgroundColor
      return { hay: Boolean(f), fondoBloque: bg, tituloMedidas: [Math.round(titulo.getBoundingClientRect().height), titulo.scrollWidth, titulo.clientWidth, window.innerWidth], pildora: cab.querySelector('[data-estado]')?.textContent.trim(), lapices: medidas('[data-lapiz]'), papelera: medidas('[data-papelera]'), chip: f.querySelector('[data-entrada-chip]')?.textContent, hora: f.querySelector('[data-caja-hora]')?.textContent, dia: f.querySelector('[data-caja-dia]')?.textContent, texto: f.innerText.replace(/\\s+/g, ' '), boton: f.querySelector('[data-anadir-doc]')?.textContent.trim() ?? null, candado: f.querySelector('[data-anadir-doc]')?.getAttribute('data-con-candado'), cabeceraTexto: cab.innerText.replace(/\\s+/g, ' ') }
    })()`)
    debe(e1.hay && /^rgb\(255, 253, 248\)/.test(e1.fondoBloque), 'E1 claro', `el bloque es claro como los otros (${e1.fondoBloque})`)
    debe(e1.tituloMedidas[0] < 32 && e1.tituloMedidas[1] <= e1.tituloMedidas[2] + 1, 'E1 titulo', `«Entradas y Free Tour» en UNA línea a 375 px (alto, scroll, cliente, ventana: ${JSON.stringify(e1.tituloMedidas)})`)
    debe(/^\d+ de \d+ reservadas$/.test(e1.pildora ?? ''), 'E1 estado', `(10S9, 1-nov) antes: el estado «1 de 7 reservadas» en una pastilla a la derecha → ahora: debajo del título, con la flecha → decisión de Eric (10S9, 1-nov) (${e1.pildora})`)
    debe(e1.cabeceraTexto === `Entradas y Free Tour ${e1.pildora}`, 'E1 cabecera', `la cabecera sin línea de texto bajo el título (${e1.cabeceraTexto})`)
    debe(e1.lapices.length === 1 && e1.lapices.every(([w, h]) => w === 44 && h === 44), 'E1 lapices', `un solo lápiz (10S9, 1-nov: antes dos → ahora uno sin documento → decisión de Eric) de 44 × 44 (${JSON.stringify(e1.lapices)})`)
    debe(e1.papelera.length === 1 && e1.papelera[0][0] === 44 && e1.papelera[0][1] === 44, 'E1 papelera', `la papelera de 44 × 44 (${JSON.stringify(e1.papelera)})`)
    debe(e1.boton === 'Añadir tu entrada', 'E1 boton', `[Añadir tu entrada] (${e1.boton})`)
    debe(/\d{2}:\d{2}$/.test((e1.hora ?? '').trim()) && /09:15/.test(e1.hora ?? ''), 'E1 hora', 'la hora en el cuadro azul noche')
    debe(!/Desde el PDF/.test(e1.texto) && !/personas/.test(e1.texto), 'E1 texto', 'sin «Desde el PDF…» ni «personas»')
    debe(/50 €|50,00 €|€ ?50/.test(e1.texto), 'E1 precio', `el precio en su fila (${e1.texto.slice(0, 120)})`)
    debe(e1.candado === (sin ? '1' : '0'), 'candado', sin ? '[Añadir tu entrada] lleva el candado sin pase' : '[Añadir tu entrada] NO lleva candado con pase')
    await a.captura(path.join(SALIDA, `10s8_d_entradas_${version}_375.jpg`)).catch(() => {})

    /* — El aviso sin pase / el selector con pase — */
    if (sin) {
      await ev(`document.querySelector(${JSON.stringify(fila(base.nombre) + ' [data-anadir-doc]')})?.click(); true`)
      await a.esp(900)
      const aviso = await ev("(document.querySelector('[data-aviso-pase]')?.innerText ?? '').replace(/\\s+/g, ' ')")
      debe(/guardas tu entrada y la tienes a mano en la puerta, aunque no haya internet/.test(aviso) && /Pase Roma/.test(aviso), 'aviso entrada', `el aviso de la entrada dice lo que toca (${aviso.slice(0, 160)})`)
      debe(/Ver el Pase Roma/.test(aviso), 'aviso entrada', '…con su botón para ver el pase')
      await a.captura(path.join(SALIDA, `10s8_d_aviso_entrada_375.jpg`)).catch(() => {})
      await ev("(() => { const d = document.querySelector('[data-aviso-pase]')?.closest('[role=dialog]'); d?.querySelector('button[aria-label=Cerrar]')?.click(); return true })()")
      await a.esp(500)
    }

    /* — E2: con su billete (guardado antes de que acabase el pase: se ve igual) — */
    await ev(`(async () => { const S = await import('/src/store/useBilleteStore.ts'); const st = S.useBilleteStore.getState(); st.ponerEntrada(st.tripId, ${JSON.stringify(base.nombre)}, { personas: 2, localizador: 'ABC123', codigo: { texto: 'COLOSSEUM|ABC123', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(DIBUJO)} }, dueno: null }); return true })()`)
    await a.esp(1500)
    const e2 = await ev(`(() => { const f = document.querySelector(${JSON.stringify(fila(base.nombre))}); return { texto: f.innerText.replace(/\\s+/g, ' '), codigo: Boolean(f.querySelector('[data-entrada-codigo-pequeno] img')), anadir: Boolean(f.querySelector('[data-anadir-doc]')), papelera: f.querySelectorAll('[data-papelera]').length } })()`)
    debe(/Localizador ABC123/.test(e2.texto) && /Toca para ampliar/.test(e2.texto) && e2.codigo, 'E2', `con billete: localizador y el código con «Toca para ampliar» (${sin ? 'SIN pase: lo guardado se ve' : 'con pase'})`)
    debe(!e2.anadir && e2.papelera === 1 && !/personas/.test(e2.texto), 'E2 limpio', 'sin [Añadir tu entrada], con la papelera y sin «2 personas»')
    await a.captura(path.join(SALIDA, `10s8_d_entradas_e2_${version}_375.jpg`)).catch(() => {})

    /* — E5: el lápiz del bloque — */
    await ev(`document.querySelector(${JSON.stringify(fila(base.nombre) + ' [data-lapiz="entrada-datos"]')})?.click(); true`)
    await a.esp(1500)
    const e5 = await ev(`(() => ({ titulo: document.querySelector('[data-hoja-titulo]')?.textContent ?? null, texto: (document.querySelector('[role=dialog]')?.innerText ?? '').replace(/\\s+/g, ' '), personas: Boolean(document.querySelector('[data-entrada-dato="personas"]')), loc: document.querySelector('[data-entrada-dato="localizador"]')?.value ?? null, boton: document.querySelector('[data-guardar-reserva]')?.textContent.trim() ?? null, dias: document.querySelectorAll('[data-dia-cuadrado]').length }))()`)
    debe(e5.titulo === 'Datos de la entrada' && e5.boton === 'Guardar los datos', 'E5', `«Datos de la entrada» con [Guardar los datos] (${e5.titulo} · ${e5.boton})`)
    debe(!e5.personas && !/Personas|2 personas/.test(e5.texto) && e5.loc === 'ABC123', 'E5 sin personas', 'sin «personas», con el localizador leído')
    debe(/¿Cuánto ha costado en total\?/.test(e5.texto) && e5.dias === 0, 'E5 contenido', 'trae el precio y no el día ni la hora (eso es el lápiz de arriba)')
    await a.captura(path.join(SALIDA, `10s8_d_e5_${version}_375.jpg`)).catch(() => {})
    await ev("document.querySelector('[role=dialog] button[aria-label=Cerrar]')?.click(); true")
    await a.esp(500)
    await ev(`document.querySelector(${JSON.stringify(fila(base.nombre) + ' [data-lapiz="entrada-arriba"]')})?.click(); true`)
    await a.esp(1200)
    debe(await ev("document.querySelectorAll('[data-dia-cuadrado]').length > 0"), 'lapiz arriba', 'el lápiz de arriba abre sitio/día/hora (los cuadrados de día)')
    await ev("document.querySelector('[role=dialog] button[aria-label=Cerrar]')?.click(); true")
    await a.esp(500)

    /* — Free Tour: mismo estilo — */
    if (base.freeTour) {
      const ft = await ev(`(() => { const f = document.querySelector('[data-entrada-fila="Free Tour"]') ?? document.querySelector('[data-entrada-fila]:has([data-tarjeta-crema="free-tour"])'); return f ? { crema: Boolean(f.querySelector('[data-tarjeta-crema]')), chip: f.querySelector('[data-entrada-chip]')?.textContent, hora: f.querySelector('[data-caja-hora]')?.textContent.trim(), boton: f.querySelector('[data-anadir-doc]')?.textContent.trim(), lapices: f.querySelectorAll('[data-lapiz]').length, papelera: f.querySelectorAll('[data-papelera]').length, precio: /€/.test(f.innerText) } : null })()`)
      debe(ft && ft.crema && /Free Tour|Ya no está en tu ruta|En tu ruta/.test(ft.chip ?? '') && ft.lapices === 1 && ft.papelera === 1 && ft.boton === 'Añadir tu entrada' && !ft.precio, 'Free Tour', `el Free Tour con el mismo estilo que una entrada, sin precio (${JSON.stringify(ft)})`)
      await ev(`document.querySelector('[data-tarjeta-crema="free-tour"]')?.scrollIntoView({ block: 'center' }); true`)
      await a.esp(400)
      await a.captura(path.join(SALIDA, `10s8_d_freetour_${version}_375.jpg`)).catch(() => {})
    } else console.log('  (la ruta de prueba no trae Free Tour: ese caso no se pasa)')

    /* — Quitar la entrada con la papelera — */
    await ev(`document.querySelector(${JSON.stringify(fila(base.nombre) + ' [data-papelera]')})?.click(); true`)
    await a.esp(1200)
    const quedan = await R(`return st().reservations.filter((x) => x.refId === ${JSON.stringify(base.nombre)}).length`)
    debe(quedan === 0, 'papelera', 'la papelera quita la entrada (con su Deshacer)')

    /* ═══ Alojamiento ═══ */
    console.log(`B. Alojamiento ${quien}`)
    await R(`const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); ${sin ? '' : "R.useRouteStore.setState({ route: { ...route(), accommodationZone: 'centro', accommodationAddress: 'Via Cavour 12, Roma' } });"} return true`)
    await a.esp(1500)
    await ev(`(() => { if (!document.querySelector('[data-blk="aloj"] [data-alojamiento-caja]')) document.querySelector('[data-blk="aloj"] [data-cabecera-clara]')?.click(); return true })()`)
    await a.esp(800)
    const alojInfo = () => ev(`(() => { const b = document.querySelector('[data-blk="aloj"]'); const medidas = (s) => Array.from(b.querySelectorAll(s)).map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] }); const dir = Array.from(b.querySelectorAll('[data-direccion-tarjeta]')).map((x) => x.textContent); return { texto: b.innerText.replace(/\\s+/g, ' '), estado: b.querySelector('[data-cabecera-clara] [data-estado]')?.textContent.trim(), cabecera: b.querySelector('[data-cabecera-clara]').innerText.replace(/\\s+/g, ' '), lapices: medidas('[data-lapiz]'), papelera: medidas('[data-papelera]'), boton: b.querySelector('[data-anadir-doc]')?.textContent.trim() ?? null, candado: b.querySelector('[data-anadir-doc]')?.getAttribute('data-con-candado') ?? null, comoLlegar: Boolean(b.querySelector('[data-como-llegar-alojamiento]')), dir, noches: b.querySelector('[data-caja-noches]')?.textContent.replace(/\\s+/g, ' ').trim(), fechas: b.querySelector('[data-alojamiento-fechas]')?.innerText.replace(/\\s+/g, ' ') } })()`)
    const a1 = await alojInfo()
    debe(a1.estado === 'Listo', 'A1 listo', `«Listo» en cuanto el hotel está puesto, sin reserva (${a1.estado})`)
    debe(a1.cabecera === 'Alojamiento Listo', 'A1 cabecera', `cabecera sin línea de texto bajo el título (${a1.cabecera})`)
    debe(a1.lapices.length === 1 && a1.lapices.every(([w, h]) => w === 44 && h === 44) && a1.papelera.length === 1 && a1.papelera[0][0] === 44, 'A1 botones', `un solo lápiz (10S9, 1-nov: antes dos → ahora uno sin documento → decisión de Eric) y la papelera de 44 × 44 (${JSON.stringify([a1.lapices, a1.papelera])})`)
    debe(a1.boton === 'Añadir tu reserva' && a1.candado === (sin ? '1' : '0'), 'candado', sin ? '[Añadir tu reserva] lleva el candado sin pase' : '[Añadir tu reserva] NO lleva candado con pase')
    debe(/Hotel Palatino/.test(a1.texto) && /NOCHES|noches/i.test(a1.noches ?? '') && /→/.test(a1.fechas ?? ''), 'A1 contenido', `nombre, fechas con flecha y noches en su cuadro (${a1.fechas} · ${a1.noches})`)
    debe(!/Eliminar alojamiento|Cambiar los datos|Desde el PDF/.test(a1.texto), 'A1 limpio', 'sin «Eliminar alojamiento» ni «Desde el PDF…»')
    debe(a1.comoLlegar === !sin, 'A1 como llegar', sin ? 'sin pase no hay [Cómo llegar]' : 'con pase, [Cómo llegar a tu alojamiento]')
    if (!sin) debe(a1.dir.length === 1 && /^Zona Centro · Via Cavour 12, Roma$/.test(a1.dir[0]), 'A1p direccion', `la dirección UNA sola vez, con la zona nuestra (${JSON.stringify(a1.dir)})`)
    await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(400)
    await a.captura(path.join(SALIDA, `10s8_d_alojamiento_a1_${version}_375.jpg`)).catch(() => {})
    if (sin) {
      await ev(`document.querySelector('[data-blk="aloj"] [data-anadir-doc]')?.click(); true`)
      await a.esp(900)
      const aviso = await ev("(document.querySelector('[data-aviso-pase]')?.innerText ?? '').replace(/\\s+/g, ' ')")
      debe(/guardas tu reserva y tienes la dirección, las horas y el teléfono a mano, aunque no haya internet/.test(aviso) && /Pase Roma/.test(aviso), 'aviso aloj', `el aviso del alojamiento dice lo que toca (${aviso.slice(0, 170)})`)
      await a.captura(path.join(SALIDA, `10s8_d_aviso_alojamiento_375.jpg`)).catch(() => {})
      await ev("(() => { const d = document.querySelector('[data-aviso-pase]')?.closest('[role=dialog]'); d?.querySelector('button[aria-label=Cerrar]')?.click(); return true })()")
      await a.esp(500)
    }

    /* — A2: con la reserva (guardada: se ve sin pase) — */
    await R(`const r = route(); const id = r.days[0].id; const h = st().accommodationSelections[id]; st().setAccommodationHotel(id, { ...h, reserva: { direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, horaEntrada: '15:00', horaSalida: '11:00', telefono: '+39 06 1234 5678', localizador: null } }); const S = await import('/src/store/useBilleteStore.ts'); S.useBilleteStore.getState().ponerAlojamiento(S.useBilleteStore.getState().tripId, id, 'HX48K2'); return true`)
    await a.esp(1500)
    const a2 = await alojInfo()
    debe(/Entrada desde las 15:00 · Salida hasta las 11:00/.test(a2.texto) && /\+39 06 1234 5678/.test(a2.texto) && /Localizador HX48K2/.test(a2.texto), 'A2 filas', `con reserva: horas, teléfono y localizador (${sin ? 'SIN pase: lo guardado se ve' : 'con pase'})`)
    debe(/Jueves 26 → Domingo 29/i.test(a2.fechas ?? '') && /3\s*NOCHES/i.test(a2.noches ?? ''), 'A2 fechas', `las fechas de la reserva («Jueves 26 → Domingo 29») y 3 noches (${a2.fechas} · ${a2.noches})`)
    debe(a2.boton === null && a2.estado === 'Listo', 'A2 sin boton', 'con la reserva ya no hay [Añadir tu reserva] y sigue «Listo»')
    debe(a2.dir.length === 1 && (sin ? /^Via Cavour 12, Roma$/.test(a2.dir[0]) : /^Zona Centro · Via Cavour 12, Roma$/.test(a2.dir[0])), 'A2p direccion', `la dirección UNA sola vez (${JSON.stringify(a2.dir)})`)
    await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
    await a.esp(400)
    await a.captura(path.join(SALIDA, `10s8_d_alojamiento_a2_${version}_375.jpg`)).catch(() => {})

    /* — A3: Datos de la reserva — */
    await ev(`document.querySelector('[data-blk="aloj"] [data-lapiz="aloj-datos"]')?.click(); true`)
    await a.esp(1500)
    const a3 = await ev(`(() => ({ titulo: document.querySelector('[data-hoja-titulo]')?.textContent ?? null, etiquetas: Array.from(document.querySelectorAll('[role=dialog] label span, [role=dialog] [data-campo-de-hora] > span > span:not([data-campo-de-hora-texto])')).map((x) => x.textContent.trim()), dir: document.querySelector('[data-reserva-aloj-campo="direccion"]')?.value, tel: document.querySelector('[data-reserva-aloj-campo="telefono"]')?.value, loc: document.querySelector('[data-reserva-aloj-campo="localizador"]')?.value, boton: document.querySelector('[data-reserva-aloj-guardar]')?.textContent.trim() }))()`)
    debe(a3.titulo === 'Datos de la reserva' && a3.boton === 'Guardar los datos', 'A3', `«Datos de la reserva» con [Guardar los datos] (${a3.titulo} · ${a3.boton})`)
    debe(a3.etiquetas.some((t) => /^Teléfono$/i.test(t)) && a3.etiquetas.some((t) => /^Localizador$/i.test(t)) && a3.etiquetas.some((t) => /^Entrada · jue 26$/i.test(t)) && a3.etiquetas.some((t) => /^Salida · dom 29$/i.test(t)), 'A3 casillas', `cada casilla con su nombre (${JSON.stringify(a3.etiquetas)})`)
    debe(a3.dir === 'Via Cavour 12, Roma' && a3.tel === '+39 06 1234 5678' && a3.loc === 'HX48K2', 'A3 datos', 'con lo guardado, el localizador incluido')
    await a.captura(path.join(SALIDA, `10s8_d_a3_${version}_375.jpg`)).catch(() => {})
    // Se cambia un dato y se guarda: se refleja en la tarjeta.
    await ev(`(() => { const e = document.querySelector('[data-reserva-aloj-campo="telefono"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, '+39 06 9999 0000'); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    await a.esp(300)
    await ev("document.querySelector('[data-reserva-aloj-guardar]')?.click(); true")
    await a.esp(1200)
    debe(/\+39 06 9999 0000/.test((await alojInfo()).texto), 'A3 guarda', '[Guardar los datos] cambia el teléfono en la tarjeta')

    /* — La papelera quita el alojamiento — */
    await ev(`document.querySelector('[data-blk="aloj"] [data-papelera="alojamiento"]')?.click(); true`)
    await a.esp(1200)
    const hay = await R(`return Boolean(st().accommodationSelections[route().days[0].id])`)
    debe(hay === false, 'papelera', 'la papelera quita el alojamiento y su reserva (con su Deshacer)')
  } finally {
    a.cerrar()
  }
}

await pasada('gratis')
await pasada('pago')

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
