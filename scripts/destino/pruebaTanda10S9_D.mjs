// Tanda 10S9 (agente D): apartado 3 («Hemos ajustado tu ruta» sin pase y antes de la pregunta) y apartado 4 (un solo lápiz mientras no hay documento).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9_D.mjs
//   SOLO_SECO=1: solo lo que se ve en el código (sin Chrome).
// Un solo Chrome de prueba a la vez; se cierra al acabar cada pasada.
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

/* ───────────────────────── A. El código ───────────────────────── */
console.log('A. El código')
{
  const lib = leer('src/lib/adaptarVuelos.ts')
  const enganche = lib.slice(lib.indexOf('export async function alCambiarElVuelo'), lib.indexOf('export function adaptarLosDias'))
  debe(!/useResumenVueloStore|construirResumen|\.mostrar\(/.test(enganche), 'apartado 3', 'alCambiarElVuelo ya no abre la hoja del resumen («Hemos ajustado tu ruta»)')
  debe(/ponerPlanes/.test(enganche), 'apartado 3', 'lo que solo informa (planes de llegada y vuelta) se sigue actualizando callado')
  debe(/pagoActivo\(\) && dias\.length > 0/.test(enganche) && /proponerVuelos/.test(enganche), 'apartado 3', 'la pregunta de adaptar sigue siendo solo con pase')
  debe(/withUndo\(mensaje/.test(lib) && /Hemos adaptado tus días a tus vuelos/.test(lib), 'apartado 3', 'tras «Sí, adaptarlos» sale la franja con [Deshacer]')
  const aloj = leer('src/components/route/reservas/AlojamientoReservas.tsx')
  debe(/onLapiz=\{esAdmin && hotel && \(reserva \|\| localizador\) \? abrirDatos : undefined\}/.test(aloj), 'apartado 4', 'alojamiento: el lápiz de «Datos de la reserva» solo con documento')
  debe(/onLapiz=\{!soloVer && \(conCodigo \|\| localizador\) \? onLapizDatos : undefined\}/.test(leer('src/components/route/reservas/EntradaConBillete.tsx')), 'apartado 4', 'entradas: el lápiz de «Datos de la entrada» solo con documento')
  debe(/onLapiz=\{conCodigo \|\| localizador \? onLapizDatos : undefined\}/.test(leer('src/components/route/reservas/ExcursionConBillete.tsx')), 'apartado 4', 'excursiones: el lápiz de «Datos de la excursión» solo con documento')
}
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
const s = (cuerpo) => `${store}.then(async (R) => { const st = () => R.getState(); ${cuerpo} })`

async function abrir(version) {
  const a = await abrirApp(BASE, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0`, antes, ancho: 390, alto: 844 })
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await a.evaluar(s('return Boolean(st().route)'))); i++) await a.esp(1000)
  await a.esp(3000)
  await a.evaluar(s("st().setMode('days'); st().setActiveDayId(st().route.days[1].id); return true"))
  await a.esp(2000)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const h = Array.from(document.querySelectorAll('[role=\"dialog\"]')).find((x) => /HEMOS PREPARADO|Hemos preparado/.test(x.innerText || '')); if (!h) return true; const b = Array.from(h.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ok|Genial)$/i.test((x.innerText || '').trim())); b?.click(); return false })()")
    if (hecho) break
    await a.esp(700)
  }
  await a.esp(1000)
  return a
}

const foto = (a) => a.evaluar(s('return JSON.stringify(st().route.days.map((d) => ({ id: d.id, n: d.dayNumber, stops: d.stops.map((x) => x.name + "@" + x.time), spare: (d.spareStops || []).map((x) => x.name) })))')).then((t) => JSON.parse(t))
const planes = (a) => a.evaluar(s('const r = st().route; return JSON.stringify({ llegadaHora: r.planLlegada?.entrada?.hora ?? null, vueltaHora: r.planVuelta?.hora ?? null })')).then((t) => JSON.parse(t))
const hayAlerta = (a) => a.evaluar("Boolean(document.querySelector('[data-alerta-adaptar]'))")
const hayHojaResumen = (a) => a.evaluar("Boolean(document.querySelector('[data-hoja=\"resumen-vuelo\"]')) || /Hemos ajustado tu ruta/.test(document.body.innerText)")
const textoPantalla = (a) => a.evaluar('document.body.innerText')
const ponerVuelo = (a, { llegada, vuelta, cambios }) =>
  a.evaluar(s(`${llegada !== undefined ? `st().setArrivalFlightTime(${JSON.stringify(llegada)});` : ''} ${vuelta !== undefined ? `st().setDepartureFlightTime(${JSON.stringify(vuelta)});` : ''} const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); for (const c of ${JSON.stringify(cambios)}) m.alCambiarElVuelo(c); return true`))

/** Apartado 3 sin pase: guardar el vuelo (ida y vuelta, como la hoja) nunca abre «Hemos ajustado tu ruta». */
async function sinPase() {
  console.log('\nB. Sin pase: guardar el vuelo')
  const a = await abrir('gratis')
  try {
    const inicio = await foto(a)
    await ponerVuelo(a, { llegada: '21:40', vuelta: '19:30', cambios: [{ que: 'hora', mitad: 'arrival' }, { que: 'hora', mitad: 'departure' }] })
    let hoja = false
    let plan = false
    for (let i = 0; i < 100; i++) {
      if (await hayHojaResumen(a)) hoja = true
      if (!plan) plan = (await planes(a)).llegadaHora?.startsWith('21:40') ?? false
      if (plan && i > 30) break
      await a.esp(500)
    }
    debe(plan, 'apartado 3', 'sin pase, el plan de la llegada se actualiza callado con la hora nueva')
    debe(!hoja, 'apartado 3', 'sin pase NO sale «Hemos ajustado tu ruta» al guardar el vuelo')
    debe(!(await hayAlerta(a)), 'apartado 3', 'sin pase no sale «¿Adaptamos tu primer y tu último día…?»')
    debe(JSON.stringify(await foto(a)) === JSON.stringify(inicio), 'apartado 3', 'sin pase no se mueve ninguna parada')
    await a.captura(path.join(SALIDA, '10s9_d_sin_pase_vuelo_1.jpg')).catch(() => {})
  } finally {
    a.cerrar()
  }
}

/** Apartado 3 con pase: ni antes de la pregunta ni después; solo la franja con [Deshacer], sin «Hemos puesto…». */
async function conPase() {
  console.log('\nB. Con pase: guardar el vuelo')
  const a = await abrir('completa')
  try {
    const inicio = await foto(a)
    await ponerVuelo(a, { llegada: '21:40', cambios: [{ que: 'hora', mitad: 'arrival' }] })
    let salio = false
    let hojaAntes = false
    for (let i = 0; i < 140 && !salio; i++) {
      if (await hayHojaResumen(a)) hojaAntes = true
      salio = await hayAlerta(a)
      if (!salio) await a.esp(500)
    }
    debe(salio, 'apartado 3', 'con pase sale la pregunta «¿Adaptamos tu primer y tu último día…?»')
    debe(!hojaAntes && !(await hayHojaResumen(a)), 'apartado 3', 'con pase, «Hemos ajustado tu ruta» no sale antes (ni a la vez que) la pregunta')
    debe(JSON.stringify(await foto(a)) === JSON.stringify(inicio), 'apartado 3', 'antes de contestar no se ha movido nada')
    if (salio) {
      await a.captura(path.join(SALIDA, '10s9_d_con_pase_pregunta_1.jpg')).catch(() => {})
      await a.evaluar("document.querySelector('[data-adaptar-si]')?.click(); true")
      await a.esp(2500)
      const despues = await foto(a)
      const cambio = JSON.stringify(despues) !== JSON.stringify(inicio)
      const texto = await textoPantalla(a)
      debe(!(await hayHojaResumen(a)), 'apartado 3', 'tras [Sí, adaptarlos] tampoco sale la hoja «Hemos ajustado tu ruta»')
      debe(!/Hemos puesto/.test(texto), 'apartado 3', 'ninguna frase «Hemos puesto…» en pantalla')
      debe(!cambio || /Hemos adaptado tus días a tus vuelos/.test(texto), 'apartado 3', 'si se ha movido algo, sale la franja «Hemos adaptado tus días a tus vuelos» con [Deshacer]')
      debe(cambio || !/Hemos adaptado tus días/.test(texto), 'apartado 3', 'si no se ha movido nada, no sale ninguna franja')
      await a.captura(path.join(SALIDA, '10s9_d_con_pase_franja_1.jpg')).catch(() => {})
    }
  } finally {
    a.cerrar()
  }
}

/** Apartado 4: lápices del alojamiento y de una entrada, sin documento y con él. */
async function lapices(version) {
  const sin = version === 'gratis'
  console.log(`\nB. Lápices ${sin ? 'sin pase' : 'con pase'}`)
  const a = await abrir(version)
  try {
    const ev = (js) => a.evaluar(js)
    const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
    const lapizDe = (bloque) => ev(`Array.from(document.querySelectorAll('[data-blk="${bloque}"] [data-lapiz]')).map((x) => x.getAttribute('data-lapiz')).join(',')`)
    const abre = async (bloque) => {
      await R("st().setMode('bookings'); return true")
      await a.esp(1800)
      await ev(`(() => { const b = document.querySelector('[data-blk="${bloque}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema]').length === 0) b.querySelector('[data-cabecera-clara]')?.click(); return true })()`)
      await a.esp(1200)
    }
    /* — Alojamiento — */
    await R(`const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); return true`)
    await a.esp(1200)
    await abre('aloj')
    const sinDoc = await lapizDe('aloj')
    debe(sinDoc === 'aloj-arriba', 'apartado 4', `alojamiento sin documento: un solo lápiz, el de arriba (${sinDoc})`)
    await a.captura(path.join(SALIDA, `10s9_d_aloj_sin_documento_${version}_1.jpg`)).catch(() => {})
    await R(`const r = route(); const id = r.days[0].id; const h = st().accommodationSelections[id]; st().setAccommodationHotel(id, { ...h, reserva: { direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, horaEntrada: '15:00', horaSalida: '11:00', telefono: '+39 06 1234 5678', localizador: null } }); return true`)
    await a.esp(1500)
    await abre('aloj')
    const conDoc = await lapizDe('aloj')
    debe(conDoc.split(',').sort().join(',') === 'aloj-arriba,aloj-datos', 'apartado 4', `alojamiento con documento: los dos lápices, arriba y «Datos de la reserva» (${conDoc})`)
    await a.captura(path.join(SALIDA, `10s9_d_aloj_con_documento_${version}_1.jpg`)).catch(() => {})
    /* — Entrada — */
    const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), nombre: s.name }`)
    await R(`st().addReservation({ id: 'res-10s9-d', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
    await a.esp(1500)
    await abre('entradas')
    const fila = `[data-entrada-fila="${base.nombre.replace(/"/g, '\\"')}"]`
    const lapizEntrada = () => ev(`Array.from(document.querySelectorAll(${JSON.stringify(fila + ' [data-lapiz]')})).map((x) => x.getAttribute('data-lapiz')).join(',')`)
    const e1 = await lapizEntrada()
    debe(e1 === 'entrada-arriba', 'apartado 4', `entrada sin documento: un solo lápiz, el de arriba (${e1})`)
    await a.captura(path.join(SALIDA, `10s9_d_entrada_sin_documento_${version}_1.jpg`)).catch(() => {})
    await ev(`(async () => { const S = await import('/src/store/useBilleteStore.ts'); const st = S.useBilleteStore.getState(); st.ponerEntrada(st.tripId, ${JSON.stringify(base.nombre)}, { personas: 2, localizador: 'ABC123', codigo: null }); return true })()`)
    await a.esp(1500)
    const e2 = await lapizEntrada()
    debe(e2.split(',').sort().join(',') === 'entrada-arriba,entrada-datos', 'apartado 4', `entrada con documento: los dos lápices (${e2})`)
    await a.captura(path.join(SALIDA, `10s9_d_entrada_con_documento_${version}_1.jpg`)).catch(() => {})
  } finally {
    a.cerrar()
  }
}

await sinPase()
await conPase()
await lapices('gratis')
await lapices('completa')

console.log(`\nPrueba 10S9 D: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
