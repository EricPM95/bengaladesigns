// Tanda 10N7 (M3) · 2b-5 LA MONEDA: una sola para cada viajero y en toda la app. No toca el motor de rutas.
//   APP_URL=http://localhost:5223 API_URL=http://localhost:8893 node scripts/destino/pruebaTanda10N7_moneda.mjs
// 1. Lo puro: formato con «≈» y el original, sin cambio, las cuentas con monedas distintas (en euros, al céntimo) y lo que no tiene cambio aparte.
// 2. Lo que hay en el código (migración 0056, los dos sitios que cambian la moneda, los precios de RESERVAS/entradas/excursiones…).
// 3. La pantalla de verdad (hace falta Vite; SIN_APP=1 la salta): euros por defecto, cambiar en el presupuesto y en Ajustes a la vez. Capturas 10n7_moneda_*.jpg (390x844).
import fs from 'node:fs'
import path from 'node:path'
import { prepararSSR } from './_ssr.mjs'
import { conViaje, modulo, esp, cuando, SALIDA } from './_10n6_k3_comun.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const foto = (n) => path.join(SALIDA, `10n7_moneda_${n}.jpg`)

const { M } = await prepararSSR('scripts/destino/_10n7_m3_entrada.tsx')
const { formatearPrecio, formatearCentimosBase, hayCambioPara, aportacionesSinCambio, aportacionesDelViaje, calcularCuentas } = M

/* ═══════════════ 1. Lo puro ═══════════════ */
console.log('1. Lo puro')
const cambio = { fecha: '2026-10-27', tasas: { MXN: 20, USD: 1.1, GBP: 0.85 } }
const eur = (amount) => ({ amount, currency: 'EUR' })
const mxn = (amount) => ({ amount, currency: 'MXN' })
{
  const enEur = { codigo: 'EUR', cambio }
  const enMxn = { codigo: 'MXN', cambio }
  debe(formatearPrecio(eur(100), enEur).completo === '100 €', '2b-5', 'euros por defecto: un precio en euros se enseña tal cual («100 €»), sin ≈')
  const a = formatearPrecio(eur(100), enMxn)
  debe(a.completo === '≈ 2.000 MXN · 100 €', '2b-5', `viajero en pesos, precio en euros: «≈ 2.000 MXN · 100 €» (sale «${a.completo}»)`)
  debe(a.texto === '≈ 2.000 MXN' && a.original === '100 €' && a.aproximado && !a.sinCambio, '2b-5', 'el principal va convertido con «≈» y el original aparte')
  debe(formatearPrecio(eur(100), enMxn, { mostrarOriginal: false }).completo === '≈ 2.000 MXN', '2b-5', 'en los titulares se puede enseñar solo lo convertido')
  const b = formatearPrecio(mxn(800), enEur)
  debe(b.completo === '≈ 40 € · 800 MXN', '2b-5', `un precio en pesos con el viajero en euros: «≈ 40 € · 800 MXN» y el original siempre a la vista (sale «${b.completo}»)`)
  debe(formatearPrecio(mxn(800), enMxn).completo === '800 MXN', '2b-5', 'en su misma moneda, tal cual')
  const c = formatearPrecio({ amount: 50, currency: 'XYZ' }, enMxn)
  debe(c.sinCambio && c.completo === '50 XYZ' && !c.aproximado, '2b-5', `sin cambio no rompe: se enseña el original («${c.completo}») y se marca sinCambio`)
  debe(formatearPrecio(eur(100), { codigo: 'MXN', cambio: null }).completo === '100 €', '2b-5', 'si el cambio aún no llegó, el original solo')
  debe(hayCambioPara('EUR', null) && hayCambioPara('MXN', cambio) && !hayCambioPara('XYZ', cambio), '2b-5', 'hayCambioPara: el euro siempre, el resto solo con cambio')
  debe(formatearCentimosBase(15000, enMxn) === '≈ 3.000 MXN', '2b-5', 'las cuentas (base euros, en céntimos) se ven en la moneda de quien mira con «≈»')
  debe(formatearCentimosBase(15000, enEur) === '150 €', '2b-5', 'y en euros, tal cual')
  debe(formatearCentimosBase(15000, { codigo: 'XYZ', cambio }) === '150 €', '2b-5', 'si la moneda de quien mira no tiene cambio, las cuentas salen en euros sin romper')
}
{
  // Cuentas con monedas distintas: Eric paga 100 € de una cena; Ana paga 2.000 MXN (=100 €) de otra; las dos entre los dos.
  const gasto = (id, autor, precio, extra = {}) => ({ id, tripId: 't', autorId: autor, nombre: id, precio, ambito: 'grupo', estado: 'aceptado', pagadoPor: [autor], entre: ['eric', 'ana'], decididoPor: 'eric', creadoEn: '2026-10-27', ...extra })
  const base = { reservas: [], adminId: 'eric', todos: ['eric', 'ana'], cambio, entran: [], entreDe: null }
  const personas = [{ id: 'eric', nombre: 'Eric' }, { id: 'ana', nombre: 'Ana' }]
  const ap = aportacionesDelViaje({ ...base, gastos: [gasto('cena', 'eric', eur(100)), gasto('taxis', 'ana', mxn(2000))], moneda: 'EUR' })
  const cu = calcularCuentas({ aportaciones: ap, pagos: [], personas, todos: ['eric', 'ana'] })
  debe(cu.total === 20000 && cu.enPaz && cu.pendientes.length === 0, '2b-5', `100 € de Eric y 2.000 MXN de Ana (a 20 MXN/€) son 200 € y quedan en paz (total ${cu.total} cént.)`)
  const ap2 = aportacionesDelViaje({ ...base, gastos: [gasto('cena', 'eric', eur(100)), gasto('taxis', 'ana', mxn(1000))], moneda: 'EUR' })
  const cu2 = calcularCuentas({ aportaciones: ap2, pagos: [], personas, todos: ['eric', 'ana'] })
  debe(cu2.total === 15000 && cu2.pendientes.length === 1 && cu2.pendientes[0].deudorId === 'ana' && cu2.pendientes[0].centimos === 2500, '2b-5', 'con 1.000 MXN (50 €) de Ana: Ana debe 25 € a Eric, al céntimo')
  debe(cu2.personas.reduce((t, p) => t + p.saldo, 0) === 0, '2b-5', 'los saldos suman 0 al céntimo con monedas distintas')
  // Lo mismo, visto por quien viaja en pesos: se convierte al mostrar, nunca al calcular.
  debe(formatearCentimosBase(cu2.pendientes[0].centimos, { codigo: 'MXN', cambio }) === '≈ 500 MXN', '2b-5', 'quien viaja en pesos ve «≈ 500 MXN» de lo que se deben (25 €), con las mismas cuentas')
  // Un gasto en una moneda sin cambio: no entra en euros, pero no se pierde: sale aparte con su moneda.
  const entrada = { ...base, gastos: [gasto('cena', 'eric', eur(100)), gasto('rarito', 'ana', { amount: 70, currency: 'XYZ' })] }
  const ap3 = aportacionesDelViaje({ ...entrada, moneda: 'EUR' })
  debe(ap3.length === 1 && ap3[0].id === 'gasto-cena', '2b-5', 'el gasto sin cambio no entra en las cuentas en euros (no se inventa un número)')
  const sin = aportacionesSinCambio(entrada)
  debe(sin.length === 1 && sin[0].id === 'gasto-rarito' && sin[0].precio.currency === 'XYZ' && sin[0].precio.amount === 70, '2b-5', 'pero no se queda fuera sin avisar: sale aparte con su moneda original')
  debe(aportacionesSinCambio({ ...base, gastos: [gasto('cena', 'eric', eur(100)), gasto('taxis', 'ana', mxn(2000))] }).length === 0, '2b-5', 'sin gastos sin cambio, la lista aparte está vacía')
  const sinPersonal = aportacionesSinCambio({ ...entrada, gastos: [gasto('mio', 'ana', { amount: 9, currency: 'XYZ' }, { ambito: 'mio', estado: 'aceptado' })] })
  debe(sinPersonal.length === 0, '2b-5', 'lo personal de otro nunca sale en la lista de sin cambio')
}

/* ═══════════════ 2. Lo que hay en el código ═══════════════ */
console.log('2. Lo que hay en el código')
{
  const mig = leer('supabase/migrations/0056_moneda_del_viajero.sql')
  debe(/add column if not exists moneda text/.test(mig) && /drop constraint if exists/.test(mig), '2b-5', 'la migración 0056 añade travelers.moneda y es idempotente')
  const mon = sinComentarios(leer('src/lib/moneda.ts'))
  debe(/trazo:moneda-viajero/.test(mon) && /update\(\{ moneda/.test(mon), '2b-5', 'la moneda se acuerda en el móvil (respaldo sin sesión) y en la cuenta')
  const um = leer('src/lib/useMoneda.ts')
  debe(/export function monedaDelViajero\(_route/.test(um) && !/monedaDePais\(route/.test(um), '2b-5', 'la moneda es del viajero (no del viaje) y por defecto el euro (ya no sale de la ciudad de origen)')
  const hoja = leer('src/components/moneda/HojaMonedaViajero.tsx')
  debe(/HojaOpciones/.test(hoja) && /elegida=/.test(hoja) && /cambiarMoneda/.test(hoja), '2b-5', 'la hoja de elegir moneda es una HojaOpciones con el estilo de elegir y llama a cambiarMoneda')
  debe(/HojaMonedaViajero/.test(leer('src/components/route/presupuesto/PantallaPresupuesto.tsx')), '2b-5', '«Moneda» del presupuesto abre la misma hoja')
  const aj = leer('src/components/ajustes/AjustesScreen.tsx')
  debe(/HojaMonedaViajero/.test(aj) && /titulo="Moneda"/.test(aj), '2b-5', 'Ajustes del perfil tiene «Moneda» y abre la misma hoja')
  debe(/cargarMonedaDeLaCuenta/.test(leer('src/store/useMiPerfil.ts')), '2b-5', 'al entrar con una cuenta se trae su moneda')
  for (const f of ['reservas/AlojamientoReservas', 'reservas/EntradasYFreeTour', 'reservas/InsuranceRow', 'reservas/RentalVehicleRow', 'reservas/TransportRow', 'reservas/UtilParaElViaje', 'reservas/LlegadaYVuelta', 'dayDetail/VehicleBlock', 'dayDetail/ArrivalDetailSheet'])
    debe(/precioEnVista/.test(leer(`src/components/route/${f}.tsx`)), '2b-5', `${f}: el precio pasa por precioEnVista (moneda del viajero + original)`)
  for (const f of ['dayDetail/ExcursionBlocks', 'excursions/ExcursionsPage', 'reservas/ActividadesDelSitio', 'reservas/DatosDeLaActividad'])
    debe(/precioTiendaEnVista/.test(leer(`src/components/route/${f}.tsx`)), '2b-5', `${f}: el precio de la tienda pasa por precioTiendaEnVista`)
  debe(/precioEnVista/.test(leer('src/components/avisos/AvisoDeGasto.tsx')), '2b-5', 'el aviso de un gasto enseña el precio en la moneda de quien lo lee')
  debe(/monedaElegida\(\)/.test(leer('src/components/pase/ListaDelPase.tsx')), '2b-5', 'el pase empieza en la moneda del viajero')
  const hook = leer('src/hooks/useCuentasDelGrupo.ts')
  debe(/MONEDA_BASE/.test(hook) && /aportacionesSinCambio/.test(hook), '2b-5', 'las cuentas del grupo se calculan en una misma base (euros) y llevan lo de sin cambio aparte')
  debe(/Sin cambio a tu moneda/.test(leer('src/components/route/presupuesto/PantallaCuentas.tsx')), '2b-5', 'Cuentas del grupo avisa «Sin cambio a tu moneda» de lo que no tiene cambio')
}

/* ═══════════════ 3. La pantalla de verdad ═══════════════ */
if (process.env.SIN_APP) {
  console.log('3. (sin pantalla: SIN_APP)')
} else {
  console.log('3. La pantalla de verdad')
  const g = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
  const tienda = (ruta, nombre, js) => g.evaluar(`${modulo(ruta)}.then((m) => { const s = m.${nombre}; return ${js} })`)
  const clic = (sel) => g.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const texto = (sel) => g.evaluar(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ')`)
  const guardada = () => g.evaluar("(() => { try { return localStorage.getItem('trazo:moneda-viajero') } catch (e) { return 'ERR' } })()")
  try {
    await g.evaluar("(() => { try { localStorage.removeItem('trazo:moneda-viajero') } catch (e) {} return true })()")
    await tienda('/src/lib/moneda.ts', 'ponerMonedaLocal', 's(null)')
    // Un precio en euros, en el presupuesto, para ver el «≈».
    await tienda('/src/store/useRouteStore.ts', 'useRouteStore', "s.getState().addGastoExtra({ id: 'm3', nombre: 'Cena en Trastevere', precio: { amount: 100, currency: 'EUR' } })")
    await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().abrir()')
    await cuando(g, "Boolean(document.querySelector('[data-fila-moneda]'))", 60)
    await esp(800)
    let fila = await texto('[data-fila-moneda]')
    debe(/Euro/.test(fila) && !(await guardada()), '2b-5', `euros por defecto: «Moneda» del presupuesto dice Euro y no hay nada guardado (${fila})`)
    await g.evaluar("document.querySelector('[data-fila-moneda]').scrollIntoView({ block: 'center' }); true")
    await esp(500)
    await g.captura(foto('01_presupuesto_euros'))
    // Cambiar en el presupuesto.
    await clic('[data-fila-moneda]')
    debe(await cuando(g, "Boolean(document.querySelector('[data-hoja-opciones=\"moneda\"]'))", 40), '2b-5', '«Moneda» abre una hoja de opciones (tarjetas)')
    await esp(500)
    await g.captura(foto('02_hoja_moneda'))
    const hayMxn = await cuando(g, "Boolean(document.querySelector('[data-opcion-hoja=\"moneda-MXN\"]'))", 40)
    debe(hayMxn, '2b-5', 'la hoja ofrece el peso mexicano (hay cambio del día)')
    await clic('[data-opcion-hoja="moneda-MXN"]')
    await esp(900)
    fila = await texto('[data-fila-moneda]')
    debe(/Peso mexicano|MXN/.test(fila) && (await guardada()) === 'MXN', '2b-5', `elegir pesos en el presupuesto: la fila lo dice y se guarda (${fila}; guardada ${await guardada()})`)
    const cuerpo = await g.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
    debe(/≈ [\d.,]+ MXN/.test(cuerpo) && /100 €/.test(cuerpo), '2b-5', 'el precio en euros sale convertido con «≈ … MXN» y, en pequeño, el original «100 €»')
    await g.evaluar("document.querySelector('[data-blk=\"extras\"]')?.scrollIntoView({ block: 'center' }); true")
    await esp(500)
    await g.captura(foto('03_presupuesto_pesos'))
    const enApp = await g.evaluar(`${modulo('/src/lib/moneda.ts')}.then((m) => m.precioEnVista({ amount: 100, currency: 'EUR' }))`)
    debe(/^≈ [\d.,]+ MXN · 100 €$/.test(enApp), '2b-5', `un precio de RESERVAS en la app sale «${enApp}»`)
    // Ajustes: la misma moneda.
    await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().cerrar()')
    await tienda('/src/store/useAjustesUi.ts', 'useAjustesUi', "s.getState().abrir('ajustes')")
    debe(await cuando(g, "Boolean(document.querySelector('[data-ajuste=\"moneda\"]'))", 60), '2b-5', 'Ajustes tiene la fila «Moneda»')
    await esp(700)
    const ajuste = await texto('[data-ajuste="moneda"]')
    debe(/Moneda/.test(ajuste) && /Peso mexicano|MXN/.test(ajuste), '2b-5', `Ajustes enseña la misma moneda que se eligió en el presupuesto (${ajuste})`)
    await g.captura(foto('04_ajustes_moneda'))
    // Cambiar en Ajustes y ver el presupuesto.
    await clic('[data-ajuste="moneda"]')
    await cuando(g, "Boolean(document.querySelector('[data-opcion-hoja=\"moneda-GBP\"]'))", 40)
    await esp(400)
    await g.captura(foto('05_ajustes_hoja'))
    await clic('[data-opcion-hoja="moneda-GBP"]')
    await esp(700)
    const ajuste2 = await texto('[data-ajuste="moneda"]')
    debe(/Libra|GBP|£/.test(ajuste2) && (await guardada()) === 'GBP', '2b-5', `elegir libras en Ajustes: la fila lo dice y se guarda (${ajuste2})`)
    await tienda('/src/store/useAjustesUi.ts', 'useAjustesUi', 's.getState().cerrar()')
    await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().abrir()')
    await cuando(g, "Boolean(document.querySelector('[data-fila-moneda]'))", 60)
    await esp(700)
    fila = await texto('[data-fila-moneda]')
    debe(/Libra|GBP|£/.test(fila), '2b-5', `la fila «Moneda» del presupuesto ya dice libras tras cambiarla en Ajustes (${fila})`)
    const cuerpo2 = await g.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
    debe(/≈ [\d.,]+ £/.test(cuerpo2), '2b-5', 'y el precio de la cena sale en libras con «≈ … £»')
    // Volver a euros desde el presupuesto.
    await clic('[data-fila-moneda]')
    await cuando(g, "Boolean(document.querySelector('[data-opcion-hoja=\"moneda-EUR\"]'))", 40)
    await clic('[data-opcion-hoja="moneda-EUR"]')
    await esp(700)
    fila = await texto('[data-fila-moneda]')
    debe(/Euro/.test(fila) && (await guardada()) === 'EUR', '2b-5', `volver a euros desde el presupuesto (${fila})`)
    await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().cerrar()')
  } finally {
    g.cerrar()
  }
}

console.log(`pruebaTanda10N7_moneda: ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  MAL [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
