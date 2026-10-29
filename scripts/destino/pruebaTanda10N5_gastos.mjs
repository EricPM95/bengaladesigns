// Tanda 10N5 §6d (ajustada en la 10N10 §6): sin «¿Para quién es?» (va a la pestaña), «¿Quién lo ha pagado?» en cuadrados, quien añade el primero y espacio entre bloques.
//   API_URL=http://localhost:8854 node scripts/destino/pruebaTanda10N5_gastos.mjs
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const { M, ponerVersion } = await prepararSSR('scripts/destino/_10n5_entrada.tsx', { piezasFalsas: [{ filtro: /map\/StopsMapView$/, exporta: 'StopsMapView' }] })
const { createElement, renderToStaticMarkup, HojaAnadirGasto, useViajeCompartido, useSyncStore, useGastosCompartidos } = M
const consolaError = console.error
console.error = (...a) => (/useLayoutEffect|Warning:/.test(String(a[0])) ? undefined : consolaError(...a))
const aTexto = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/\s*\n\s*/g, '\n')
const plano = (t) => t.replace(/\n/g, ' | ')

const GENTE = [{ id: 'eric', nombre: 'ERIC' }, { id: 'ana', nombre: 'ana maría' }, { id: 'luis', nombre: 'Luis' }]
const poner = (yo, esInvitado) => {
  ponerVersion('pago')
  useSyncStore.setState({ activeTripId: 't1', savedTrips: [{ id: 't1', esInvitado }] })
  useViajeCompartido.setState({ tripId: 't1', gente: GENTE.map((p) => ({ ...p, foto: null, esAdmin: p.id === 'eric', permiso: p.id === 'eric' ? 'admin' : 'recomendar', esYo: p.id === yo })) })
  useGastosCompartidos.setState({ tripId: 't1', yoId: yo, disponible: true, cuentas: true, gastos: [], pagos: [], exMiembros: [] })
}
const hoja = (props = {}) => renderToStaticMarkup(createElement(function H() { return createElement(HojaAnadirGasto, { gv: M.useGastosDelViaje(), moneda: 'EUR', onClose() {}, ...props }) }))

console.log('1. La hoja')
{
  // (10N10 §6) Desde la cuenta del grupo: título, sin «¿Para quién es?» (el gasto va a la pestaña), «Solo para algunos» y la línea pequeña. «¿Quién lo ha pagado?» sale con precio (al editar).
  poner('ana', true)
  const h = hoja({ pestana: 'comun', cuenta: 'grupo' })
  const t = plano(aTexto(h))
  debe(/Añadir a la cuenta del grupo/.test(t) && /Solo para algunos/.test(t), '6', 'título «Añadir a la cuenta del grupo» y la opción pequeña «Solo para algunos»')
  debe(!/¿Para quién es\?|¿Entre quién\?|¿Quién ha pagado\?/.test(t), '6', 'sin «¿Para quién es?»: el gasto va a la pestaña desde la que se abre')
  debe(!/¿Quién lo ha pagado\?/.test(t), '6', '«¿Quién lo ha pagado?» solo sale cuando hay precio')
  const mia = plano(aTexto(hoja({ pestana: 'mia', cuenta: 'grupo' })))
  debe(/Añadir a Mi cuenta/.test(mia) && !/¿Quién lo ha pagado\?|Solo para algunos/.test(mia) && /Va a Mi cuenta/.test(mia) && /Solo lo ves tú/.test(mia), '6', 'desde «Mi cuenta»: solo concepto y precio, con «Va a Mi cuenta» y «Solo lo ves tú»')
  debe(/mt-4 flex flex-col gap-5/.test(h), '6d-4', 'espacio claro entre los bloques de la hoja (gap-5)')
  // Al editar: «¿Quién lo ha pagado?» en cuadrados, con los nombres con mayúscula inicial, y se queda lo que ya tenía.
  const gasto = { id: 'g1', tripId: 't1', autorId: 'luis', nombre: 'Cena', precio: { amount: 30, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: ['luis', 'eric'], entre: ['eric', 'luis'], decididoPor: null, creadoEn: '2026-10-26T10:00:00Z' }
  const ed = hoja({ editar: gasto, pestana: 'comun', cuenta: 'grupo' })
  const te = plano(aTexto(ed))
  debe(/¿Quién lo ha pagado\?/.test(te), '6', 'al editar (con precio) sale «¿Quién lo ha pagado?»')
  const bq = ed.slice(ed.indexOf('data-personas-cuadradas="pagado"'))
  const est = Object.fromEntries([...bq.matchAll(/data-persona-cuadrada="([^"]+)"[^>]*data-elegida="(1|0)"/g)].map((m) => [m[1], m[2]]))
  debe(est.luis === '1' && est.eric === '1' && est.ana === undefined, '6', `en cuadrados, solo Luis y Eric (quienes pagaron y entran): ${JSON.stringify(est)}`)
  poner('ana', true)
  const t2 = plano(aTexto(hoja({ editar: { ...gasto, pagadoPor: ['ana'], entre: [], autorId: 'ana' }, pestana: 'comun', cuenta: 'grupo' })))
  debe(/Ana María/.test(t2) && !/ana maría/.test(t2) && /Eric/.test(t2) && !/ERIC/.test(t2), 'nombres', 'los nombres con la primera en mayúscula: «Eric», «Ana María»')
  const q = hoja({ editar: { ...gasto, pagadoPor: ['ana'], entre: [], autorId: 'ana' }, pestana: 'comun', cuenta: 'grupo' })
  const pagan = [...q.slice(q.indexOf('data-personas-cuadradas="pagado"')).matchAll(/data-persona-cuadrada="([^"]+)"/g)].map((m) => m[1])
  debe(pagan[0] === 'ana', '6d-2', `quien añade (Ana) va primero en «¿Quién lo ha pagado?»: ${pagan.join()}`)
}

console.log('2. Los textos en toda la app')
{
  const codigo = ['src/components/route/presupuesto/HojaAnadirGasto.tsx', 'src/components/route/presupuesto/PantallaCuentas.tsx', 'src/components/route/presupuesto/PantallaPresupuesto.tsx', 'src/components/route/presupuesto/ExtrasCompartidos.tsx'].map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/Quién lo ha pagado|¿Entre quién|>\s*Entre quién\s*</.test(codigo), '6d-1', 'en añadir, editar y las cuentas (10N10) ya no queda «¿Quién ha pagado?» ni «¿Entre quién?»')
  debe(/Para quién es/.test(sinComentarios(leer('src/components/route/presupuesto/PantallaCuentas.tsx'))), '6d-1', 'el botón de las cuentas del alojamiento dice «Para quién es»')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
