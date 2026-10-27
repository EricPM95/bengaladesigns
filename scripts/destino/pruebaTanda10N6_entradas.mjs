// Tanda 10N6 (K4) §1l · las entradas para varios, las compre quien las compre, en la app de verdad (Chrome sin ventana). No toca el motor de rutas.
//   APP_URL=http://localhost:5204 API_URL=http://localhost:8874 node scripts/destino/pruebaTanda10N6_entradas.mjs
// Quien mira cambia entre Eric (administrador), Luis y Ana (invitados). Capturas docs/dias/capturas_jutrip/10n6_entradas_*.jpg y, al lado, la pieza de Design.
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, modulo } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const foto = (n) => path.join(SALIDA, `10n6_entradas_${n}.jpg`)
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' },
  { id: 'p-luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' },
]

const a = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
try {
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useMisReservas.ts'), import('/src/store/useLoSuyo.ts')]).then(() => true)")
  const quienMira = (yo) =>
    ev(`(async () => {
      const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-' + ${JSON.stringify(yo)} }))
      sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso')
      if (${JSON.stringify(yo)} !== 'eric') { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'recomendar') }
      for (const [m, n] of [['store/useViajeCompartido.ts', 'useViajeCompartido']]) {
        const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((x) => x.includes(m)))]
        for (const u of urls) { const st = (await import(/* @vite-ignore */ u))[n]; st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
      }
      return true
    })()`)
  const poner = (modulo_, nombre, estado) =>
    ev(`(async () => {
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((x) => x.includes(${JSON.stringify(modulo_)})))]
      for (const u of urls) { const st = (await import(/* @vite-ignore */ u))[${JSON.stringify(nombre)}]; st.setState({ cargar: async () => {}, ...${JSON.stringify(estado)} }) }
      return true
    })()`)
  const sitio = await ev(`(async () => {
    const b = await import('/src/lib/bookings.ts')
    const { fetchDestinationExcursions } = await import('/src/lib/destinationExcursions.ts')
    const { useRouteStore } = await import('/src/store/useRouteStore.ts')
    const s = useRouteStore.getState()
    const info = await fetchDestinationExcursions('Roma')
    const d = s.route.days.find((x) => x.stops.some((y) => y.name === 'Coliseo'))
    const base = b.entranceTargetFor('Coliseo', info.entradas)
    useRouteStore.setState({ reservations: [] })
    useRouteStore.getState().setActiveDayId(d.id); useRouteStore.getState().setMode('days')
    return { base, dateIso: b.dateOfDay(s.route, d), dayNumber: d.dayNumber }
  })()`)
  const reserva = (id, hora, paraQuien) => ({ id, kind: 'entrada', ...sitio.base, dateIso: sitio.dateIso, dayNumber: sitio.dayNumber, time: hora, paraQuien, precio: { amount: 80, currency: 'EUR' } })
  const estado = async ({ admin = [], inv = [], mias = [] }) => {
    await ev(`import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.setState({ reservations: ${JSON.stringify(admin)} }); return true })`)
    await poner('store/useLoSuyo.ts', 'useLoSuyo', { entradas: inv })
    await poner('store/useMisReservas.ts', 'useMisReservas', { lista: mias })
    await esp(1500)
  }
  const boton = () => ev(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === 'Coliseo'); const t = tit?.closest('div.relative.flex'); const b = t?.querySelector('[data-boton-entrada]'); if (!b) return null; t.scrollIntoView({ block: 'center' }); return { tipo: b.dataset.botonEntrada, cuantos: b.dataset.cuantos ?? null } })()`)
  const abrirFicha = async () => {
    await ev(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === 'Coliseo'); const b = tit?.closest('div.relative.flex')?.querySelector('[data-boton-entrada]'); b?.click(); return true })()`)
    await esp(2500)
    return ev(`(() => { const s = document.querySelector('[data-ficha-seccion="entrada-del-grupo"]') ?? document.querySelector('[data-ficha-seccion="tu-entrada"]'); return s ? { tipo: s.dataset.fichaSeccion, texto: s.innerText.replace(/\\s+/g, ' ') } : null })()`)
  }
  const cerrarFicha = async () => {
    await ev("(() => { const b = Array.from(document.querySelectorAll('[role=\"dialog\"] button, button')).find((x) => /^(Cerrar|Atrás|Volver)$/.test(x.getAttribute('aria-label') || '')); b?.click(); return true })()")
    await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true")
    await esp(800)
  }
  const reservasTexto = async () => {
    await ev(`${modulo('/src/store/useRouteStore.ts')}.then((m) => { m.useRouteStore.getState().setMode('bookings'); return true })`)
    await esp(2500)
    await ev("(() => { const b = document.querySelector('[data-blk=\"entradas\"] div'); if (b) b.click(); return true })()")
    await esp(1500)
    return ev("(() => { const e = document.querySelector('[data-blk=\"entradas\"]'); e?.scrollIntoView({ block: 'start' }); return Array.from(document.querySelectorAll('[data-entrada-fila], [data-entrada-color]')).map((x) => x.innerText.replace(/\\s+/g, ' ')).join(' || ') })()")
  }
  const volverADias = async () => {
    await ev(`${modulo('/src/store/useRouteStore.ts')}.then((m) => { m.useRouteStore.getState().setMode('days'); return true })`)
    await esp(2000)
  }

  /* A · Ana (invitada) reserva a las 11:00 para ella y Luis. Mira Eric (el administrador). */
  console.log('A. Ana (invitada) reserva para ella y para Luis; mira Eric (administrador)')
  await quienMira('eric')
  await estado({ inv: [{ userId: 'p-ana', reservas: [reserva('a1', '11:00', ['p-ana', 'p-luis'])] }] })
  await volverADias()
  let b = await boton()
  debe(b && b.tipo === 'grupo' && b.cuantos === '2', '1l', `Eric no está en la de Ana: su botón de DÍAS es azul con dorado y dice cuántos la tienen (${JSON.stringify(b)})`)
  let f = await abrirFicha()
  debe(f && f.tipo === 'entrada-del-grupo' && /Ana y Luis la tienen para el .+ · 11:00/.test(f.texto) && /Reservar la mía a la misma hora/.test(f.texto), '1l', `la ficha de Eric, en azul con dorado: «Ana y Luis la tienen para el … · 11:00» con [Reservar la mía a la misma hora] (${f && f.texto})`)
  await a.captura(foto('a_eric_ficha_ana_y_luis'))
  await cerrarFicha()
  await volverADias()
  let r = await reservasTexto()
  debe(/Ana y Luis la tienen para el/.test(r), '1l', `RESERVAS de Eric lo dice en plural (${r.slice(0, 200)})`)

  /* B · mira Luis (marcado) */
  console.log('B. Mira Luis (marcado por Ana)')
  await quienMira('luis')
  await estado({ inv: [{ userId: 'p-ana', reservas: [reserva('a1', '11:00', ['p-ana', 'p-luis'])] }] })
  await volverADias()
  b = await boton()
  debe(b && b.tipo === 'tengo', '1l', `a Luis le sale como suya: botón verde con ✓ en DÍAS (${JSON.stringify(b)})`)
  f = await abrirFicha()
  debe(f && f.tipo === 'tu-entrada' && /TU ENTRADA/i.test(f.texto) && /11:00/.test(f.texto), '1l', `«Tu entrada» en verde en la ficha de Luis (${f && f.texto})`)
  await a.captura(foto('b_luis_tu_entrada'))
  await cerrarFicha()
  await volverADias()
  r = await reservasTexto()
  debe(/Ana la ha reservado para ti/.test(r) && /11:00|11 /.test(r), '1l', `en el RESERVAS de Luis: «Ana la ha reservado para ti» (${r.slice(0, 200)})`)
  await a.captura(foto('b_luis_reservas'))

  /* C · mira Ana, la que compró */
  console.log('C. Mira Ana (la que compró)')
  await quienMira('ana')
  await estado({ inv: [{ userId: 'p-ana', reservas: [reserva('a1', '11:00', ['p-ana', 'p-luis'])] }], mias: [reserva('a1', '11:00', ['p-ana', 'p-luis'])] })
  await volverADias()
  b = await boton()
  debe(b && b.tipo === 'tengo', '1l', `a Ana, que la compró, le sale verde (${JSON.stringify(b)})`)

  /* D · dos horas distintas: Eric a las 9:15 (solo él) y Ana a las 11:00 (solo ella). Mira Luis. */
  console.log('D. Dos horas distintas; mira Luis')
  await quienMira('luis')
  await estado({ admin: [reserva('e1', '09:15', ['p-eric'])], inv: [{ userId: 'p-ana', reservas: [reserva('a2', '11:00', ['p-ana'])] }] })
  await volverADias()
  b = await boton()
  debe(b && b.tipo === 'grupo' && b.cuantos === '2', '1l', `Luis no tiene ninguna: azul con dorado y «2» (${JSON.stringify(b)})`)
  f = await abrirFicha()
  debe(f && /Eric la tiene a las 9:15 · Ana a las 11:00/.test(f.texto), '1l', `dos horas distintas: «Eric la tiene a las 9:15 · Ana a las 11:00» (${f && f.texto})`)
  await a.captura(foto('d_luis_dos_horas'))
  await cerrarFicha()

  /* E · plural lo compre el administrador: Eric a las 9:15 para él y Ana. Mira Luis. */
  console.log('E. Eric reserva para él y Ana; mira Luis')
  await estado({ admin: [reserva('e1', '09:15', ['p-eric', 'p-ana'])], inv: [] })
  await volverADias()
  f = await abrirFicha()
  debe(f && /Eric y Ana la tienen para el .+ · 9:15/.test(f.texto), '1l', `«Eric y Ana la tienen para el … · 9:15» (${f && f.texto})`)
  await a.captura(foto('e_luis_eric_y_ana'))
  await cerrarFicha()

  /* F · Ana (invitada) compra para ella y para Eric: a Eric le sale como suya */
  console.log('F. Ana compra para ella y Eric; mira Eric')
  await quienMira('eric')
  await estado({ inv: [{ userId: 'p-ana', reservas: [reserva('a3', '12:30', ['p-ana', 'p-eric'])] }] })
  await volverADias()
  b = await boton()
  debe(b && b.tipo === 'tengo', '1l', `Ana compra para ella y para Eric: a Eric le sale como suya, verde (${JSON.stringify(b)})`)
  f = await abrirFicha()
  debe(f && f.tipo === 'tu-entrada' && /12:30/.test(f.texto), '1l', `«Tu entrada» en verde en la ficha de Eric (${f && f.texto})`)
  await a.captura(foto('f_eric_tu_entrada_de_ana'))
} finally {
  a.cerrar()
}
await capturarDesign('Piezas/Ficha Cabecera.dc.html', foto('design_ficha_cabecera'), {}).catch(() => undefined)

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
