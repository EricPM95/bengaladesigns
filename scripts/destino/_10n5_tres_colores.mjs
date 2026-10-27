// Capturas y comprobaciones de los tres colores de las entradas (Tanda 10N5, apartado 0.3): frambuesa = te falta · verde = ya la tienes · azul oscuro con dorado = otro del grupo la tiene y te queda elegir la tuya.
// Quien mira es Luis (invitado, solo recomienda); Eric (el dueño) tiene la entrada del Coliseo y el Free Tour para Eric y Ana.
import { conViaje, esp, foto, modulo } from './_10n5_comun.mjs'
import fs from 'node:fs'
let comprobaciones = 0
const fallos = []
const debe = (c, t) => {
  comprobaciones++
  if (!c) fallos.push(t)
}
const GENTE = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' },
  { id: 'p-luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'recomendar' },
]
const a = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
try {
  await a.evaluar("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useMisReservas.ts')]).then(() => true)")
  await a.evaluar(`(async () => {
    const g = ${JSON.stringify(GENTE)}.map((p) => ({ ...p, esYo: p.id === 'p-luis' }))
    sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', 'recomendar')
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    for (const u of urls) { const st = (await import(/* @vite-ignore */ u)).useViajeCompartido; st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
    return true
  })()`)
  const dia = await a.evaluar(`(async () => {
    const { useRouteStore } = await import(${JSON.stringify('/src/store/useRouteStore.ts')})
    const b = await import('/src/lib/bookings.ts')
    const { fetchDestinationExcursions } = await import('/src/lib/destinationExcursions.ts')
    const s = useRouteStore.getState()
    const info = await fetchDestinationExcursions('Roma')
    const d = s.route.days.find((x) => x.stops.some((y) => y.name === 'Coliseo'))
    const base = b.entranceTargetFor('Coliseo', info.entradas)
    s.addReservation({ id: 'res-coliseo-10n5', kind: 'entrada', ...base, dateIso: b.dateOfDay(s.route, d), dayNumber: d.dayNumber, time: '11:45', paraQuien: ['p-eric', 'p-ana'] })
    useRouteStore.getState().setActiveDayId(d.id); useRouteStore.getState().setMode('days')
    return d.dayNumber
  })()`)
  await esp(3500)
  const boton = await a.evaluar(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === 'Coliseo'); const t = tit?.closest('div.relative.flex'); const b = t?.querySelector('[data-boton-entrada]'); if (!b) return null; t.scrollIntoView({ block: 'center' }); const cs = getComputedStyle(b); return { tipo: b.dataset.botonEntrada, cuantos: b.dataset.cuantos, fondo: cs.backgroundImage, sombra: cs.boxShadow } })()`)
  debe(boton && boton.tipo === 'grupo' && /28, 34, 48/.test(boton.fondo) && /233, 199, 122/.test(boton.sombra), `DÍAS: el botón de la entrada del Coliseo, con otros que ya la tienen, es azul oscuro con dorado (${JSON.stringify(boton)})`)
  await esp(500)
  await a.captura(foto('colores_dias_grupo'))
  // RESERVAS › Entradas y Free Tour
  await a.evaluar(`${modulo('/src/store/useRouteStore.ts')}.then((m) => { m.useRouteStore.getState().setMode('bookings'); return true })`)
  await esp(2500)
  await a.evaluar("(() => { const b = document.querySelector('[data-blk=\"entradas\"] div'); if (b) b.click(); return true })()")
  await esp(1500)
  await a.evaluar("(() => { const e = document.querySelector('[data-blk=\"entradas\"]'); if (e) e.scrollIntoView({ block: 'start' }); return true })()")
  await esp(700)
  const tarjetas = await a.evaluar(`(() => Array.from(document.querySelectorAll('[data-entrada-color]')).map((e) => ({ color: e.dataset.entradaColor, texto: e.innerText.split(String.fromCharCode(10)).slice(0, 6).join(' | ') })))()`)
  const grupo = tarjetas.filter((t) => t.color === 'grupo')
  const falta = tarjetas.filter((t) => t.color === 'falta')
  debe(grupo.some((t) => /Coliseo/.test(t.texto)), `RESERVAS: la entrada del Coliseo que ya tiene Eric sale en azul oscuro con dorado (${JSON.stringify(tarjetas).slice(0, 300)})`)
  debe(falta.length >= 1, `RESERVAS: las entradas que nadie tiene siguen en frambuesa (${falta.length})`)
  await a.captura(foto('colores_reservas_entradas'))
  fs.writeFileSync(`${process.env.TEMP}/colores_10n5.json`, JSON.stringify({ dia, boton, tarjetas }))
} finally {
  a.cerrar()
}
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f)
process.exit(fallos.length ? 1 : 0)
