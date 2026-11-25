// CATALOGO · el pase: la pregunta del día de prueba («Te queda medio día…»), la franja «Hoy es tu día de prueba», «Mañana es tu día de prueba» + la tarjeta P3, la tarjeta del día 12 («¿Qué tal ayer con HOY?»),
// la prueba gastada («Tu modo Hoy es parte del Pase Roma») y el aviso pequeño del pase. Por la cola (UN Chrome):
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/catalogo_pase.mjs [seccion ...]
import { abrir, anotar, clicTexto, cuerpo, foto, montarHoy, nada, R } from './catalogo_comun.mjs'

const quiero = new Set(process.argv.slice(2))
const va = (s) => quiero.size === 0 || quiero.has(s)
const BASE = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
const c = await abrir(quiero.has('pregunta') ? { ruta: BASE + '&pase=sin' } : quiero.has('aviso') ? { ruta: BASE + '&pase=sin' } : {})
const { a, ev } = c
const idViaje = () => a.evaluar("import('/src/store/useSyncStore.ts').then((m) => m.useSyncStore.getState().activeTripId)")
const pase = (p) => a.evaluar(`window.__pruebaDelPase = ${JSON.stringify(p)}; true`)
const seccion = async (n, fn) => {
  if (!va(n)) return
  console.log('· sección', n)
  try {
    await fn()
  } catch (e) {
    console.log('FALLO en', n, e.message)
    anotar(`pase_${n}_error`, { ok: false, motivo: e.message })
  }
}
try {
  const trip = await idViaje()

  await seccion('pregunta', async () => {
    // La pregunta de las 12:00 («Te queda medio día…»): sale en la app con el estado de prueba `pregunta` (la pone el servidor real a las 12:00 del día de prueba)
    // la pregunta que pone el servidor a las 12:00 del día de prueba (aquí puesta en el almacén, que es lo que la pinta)
    await a.evaluar(`(async () => { const L = (await import('/src/store/useLogrosStore.ts')).useLogrosStore; L.setState({ pregunta: { texto: 'Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?', opciones: [{ id: 'hoy', texto: 'Hoy' }, { id: 'manana', texto: 'Mañana' }] } }); return true })()`)
    await montarHoy(c, 12 * 60)
    await a.esp(2000)
    const t = await cuerpo(a, 6000)
    if (/medio día/.test(t)) await foto(a, 'pase_pregunta_medio_dia', { texto: 'Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana? [Hoy] [Mañana]' })
    else nada('pase_pregunta_medio_dia', 'la pregunta no salió con el estado puesto a mano: la pone `?pase=pregunta` al cargar la página (una sola vez por carga); ver el hueco')
  })

  await seccion('hoyesprueba', async () => {
    await pase({ cobro: true, conPase: false, puede: true, pruebaGastada: false, sabido: true, prueba: { estado: 'pendiente', tripId: null, fecha: '2026-10-17' } })
    await montarHoy(c, 10 * 60)
    await a.esp(1500)
    await foto(a, 'pase_hoy_es_prueba', { texto: await cuerpo(a, 500) })
  })

  await seccion('p3', async () => {
    // Día de llegada sin pase y sin poder usar HOY: la tarjeta P3 (con «Mañana es tu día de prueba» encima si la prueba es mañana)
    await pase({ cobro: true, conPase: false, puede: false, pruebaGastada: false, sabido: true, prueba: { estado: 'pendiente', tripId: null, fecha: '2026-10-18' } })
    await montarHoy(c, 10 * 60)
    await a.esp(1500)
    await foto(a, 'pase_p3_dia_de_llegada', { texto: await cuerpo(a, 500) })
  })

  await seccion('dia12', async () => {
    // Un día después de la prueba: la tarjeta «Tu día de prueba» con «¿Qué tal ayer con HOY?» (pantalla 12)
    await pase({ cobro: true, conPase: false, puede: false, pruebaGastada: true, sabido: true, prueba: { estado: 'gastada', tripId: null, fecha: '2026-10-17' } })
    await montarHoy(c, 10 * 60, { fecha: '2026-10-18' })
    await a.esp(1500)
    await foto(a, 'pase_dia_12_que_tal_ayer', { texto: await cuerpo(a, 600) })
  })

  await seccion('gastada', async () => {
    // La prueba ya se gastó en OTRO viaje: «Tu modo Hoy es parte del Pase Roma»
    await pase({ cobro: true, conPase: false, puede: false, pruebaGastada: true, sabido: true, prueba: { estado: 'gastada', tripId: 'otro-viaje', fecha: '2026-06-01' } })
    await montarHoy(c, 10 * 60, { fecha: '2026-10-18' })
    await a.esp(1500)
    await foto(a, 'pase_prueba_gastada', { texto: await cuerpo(a, 600) })
  })

  await seccion('aviso', async () => {
    await ev(`${R}.getState().setMode('route')`)
    await a.esp(1500)
    // el aviso pequeño: sus claves salen de src/lib/avisoPaseTextos.ts
    const claves = await a.evaluar(`(async () => { const M = await import('/src/lib/avisoPaseTextos.ts'); return JSON.stringify(Object.keys(M.AVISO_PASE_TEXTOS)) })()`).catch(() => '[]')
    console.log('claves del aviso', claves)
    const lista = JSON.parse(claves)
    const clave = lista[0] ?? 'reservas'
    await a.evaluar(`(async () => { const M = await import('/src/lib/avisoPase.ts'); M.abrirAvisoPase(${JSON.stringify(clave)}); return true })()`)
    await a.esp(1500)
    const hay = await a.evaluar("Boolean(document.querySelector('[data-aviso-pase], [data-hoja=\"aviso-pase\"]'))")
    if (hay) await foto(a, 'pase_aviso_pequeno', { clave, texto: await cuerpo(a, 500) })
    else nada('pase_aviso_pequeno', `no salió con la clave «${clave}» (avisoDelPaseSeEnsena lo decide)`)
  })
} finally {
  a.cerrar()
}
console.log('pase hecho')
