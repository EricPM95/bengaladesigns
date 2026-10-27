// Tanda 10N5 §6d · «Añadir gasto» más limpio: «¿Quién ha pagado?», «¿Para quién es?», quien añade el primero y marcado (los demás sin marcar), la línea de abajo como está y espacio entre bloques.
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
  poner('ana', true)
  const h = hoja()
  const t = plano(aTexto(h))
  debe(/¿Quién ha pagado\?/.test(t) && !/¿Quién lo ha pagado\?/.test(t), '6d-1', 'dice «¿Quién ha pagado?» (ya no «¿Quién lo ha pagado?»)')
  debe(/¿Para quién es\?/.test(t) && !/¿Entre quién\?/.test(t), '6d-1', 'dice «¿Para quién es?» (ya no «¿Entre quién?»)')
  const pagan = [...h.matchAll(/data-elegir-pastilla="pago-([^"]+)"/g)].map((m) => m[1])
  debe(pagan.join() === 'ana,eric,luis', '6d-2', `en «¿Quién ha pagado?» va primero quien añade el gasto (Ana), luego los demás: ${pagan.join()}`)
  const bloque = h.slice(h.indexOf('data-gasto-quien-pago'), h.indexOf('data-gasto-entre-quien'))
  const marcadas = [...bloque.matchAll(/data-elegir-pastilla="pago-([^"]+)"[^>]*data-elegida="(1|0)"/g)]
  const estado = Object.fromEntries(marcadas.map((m) => [m[1], m[2]]))
  debe(estado.ana === "1" && estado.eric === "0" && estado.luis === "0", '6d-2', `solo Ana, que añade, sale marcada (${JSON.stringify(estado)})`)
  debe(/Ana María/.test(t) && !/ana maría/.test(t) && /Eric/.test(t) && !/ERIC/.test(t), 'nombres', 'los nombres con la primera en mayúscula: «Eric», «Ana María»')
  debe(/cada uno|Escribe el importe/.test(t), '6d-3', 'la línea de abajo sigue («… cada uno» / «Escribe el importe…»)')
  debe(/mt-4 flex flex-col gap-5/.test(h), '6d-4', 'espacio claro entre los bloques de la hoja (gap-5)')
  poner('eric', false)
  const e = hoja()
  const pe = [...e.matchAll(/data-elegir-pastilla="pago-([^"]+)"/g)].map((m) => m[1])
  debe(pe.join() === 'eric,ana,luis', '6d-2', `si añade Eric, Eric va primero: ${pe.join()}`)
  // Al editar: se queda lo que ya tenía
  poner('ana', true)
  const gasto = { id: 'g1', tripId: 't1', autorId: 'luis', nombre: 'Cena', precio: { amount: 30, currency: 'EUR' }, ambito: 'grupo', estado: 'aceptado', pagadoPor: ['luis', 'eric'], entre: ['eric', 'luis'], decididoPor: null, creadoEn: '2026-10-26T10:00:00Z' }
  const ed = hoja({ editar: gasto })
  const bq = ed.slice(ed.indexOf('data-gasto-quien-pago'), ed.indexOf('data-gasto-entre-quien'))
  const est = Object.fromEntries([...bq.matchAll(/data-elegir-pastilla="pago-([^"]+)"[^>]*data-elegida="(1|0)"/g)].map((m) => [m[1], m[2]]))
  debe(est.luis === "1" && est.eric === "1" && est.ana === "0", '6d-2', `al editar se queda lo que ya tenía (Luis y Eric): ${JSON.stringify(est)}`)
}

console.log('2. Los textos en toda la app')
{
  const codigo = ['src/components/route/presupuesto/HojaAnadirGasto.tsx', 'src/components/route/presupuesto/PantallaCuentas.tsx', 'src/components/route/presupuesto/PantallaPresupuesto.tsx', 'src/components/route/presupuesto/ExtrasCompartidos.tsx'].map((f) => sinComentarios(leer(f))).join('\n')
  debe(!/Quién lo ha pagado|¿Entre quién|>\s*Entre quién\s*</.test(codigo), '6d-1', 'en añadir, editar y las cuentas ya no queda «¿Quién lo ha pagado?» ni «¿Entre quién?»')
  debe(/Para quién es/.test(sinComentarios(leer('src/components/route/presupuesto/PantallaCuentas.tsx'))), '6d-1', 'el botón de las cuentas del alojamiento dice «Para quién es»')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
