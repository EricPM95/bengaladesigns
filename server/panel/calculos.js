/**
 * (V35A) LOS CÁLCULOS DE INICIO Y VENTAS: funciones PURAS que reciben la base (`base.js`) y un periodo (`periodo.js`) y devuelven lo que enseña el panel. Sin base de datos: la prueba les pasa una base falsa.
 * Reglas fijas:
 *   · Solo cuentan los cobros REALES de Stripe (`proveedor` distinto de «mentira») y solo los `pagado` (un cobro `devuelto` no es ingreso).
 *   · Un día es un día de Madrid.
 *   · «Pases vendidos» = cobros reales pagados en el periodo; los pases REGALADOS (sin cobro) salen en «Últimas compras» pero no suman a vendidos ni a ingresos.
 *   · La comisión de Stripe y los reembolsos llegan en la V35B: aquí NO se inventan.
 */
import { cubetasDeRango, diaDe, enRango, rangoDePeriodo, sumarDias, ZONA } from './periodo.js'
import { clavePanel, esCobroReal, indiceDe, nombreDe, nombreDePlan, pasesDe, viajesDe } from './comunes.js'

const n = (v) => Number(v) || 0
const pct = (x, total) => (total > 0 ? Math.round((x / total) * 100) : 0)

/** Ciudades que salen de origen sin país en el viaje (solo para no dejar a «Madrid» sin bandera): ciudad sin tildes → código. */
const CIUDADES = {
  madrid: 'es', barcelona: 'es', valencia: 'es', sevilla: 'es', bilbao: 'es', malaga: 'es', zaragoza: 'es', granada: 'es', alicante: 'es', 'palma de mallorca': 'es', 'las palmas de gran canaria': 'es', 'santa cruz de tenerife': 'es',
  'ciudad de mexico': 'mx', cdmx: 'mx', guadalajara: 'mx', monterrey: 'mx', roma: 'it', milan: 'it', paris: 'fr', londres: 'gb', london: 'gb', lisboa: 'pt', oporto: 'pt', berlin: 'de', amsterdam: 'nl', 'buenos aires': 'ar', bogota: 'co', lima: 'pe', santiago: 'cl',
}

/** País (código) y ciudad de origen de un viaje. */
export function origenDeViaje(v) {
  const ciudad = String(v.origen ?? v.lugar?.name ?? '').trim()
  const iso = String(v.lugar?.countryCode ?? '').toLowerCase() || CIUDADES[clavePanel(ciudad)] || null
  return { ciudad, iso }
}

/** «Desde dónde viajan»: países y ciudades de los viajes (cada viaje cuenta una vez). */
export function desdeDondeViajan(base) {
  const ciudades = new Map()
  const paises = new Map()
  for (const t of base.trips ?? []) {
    const { ciudad, iso } = origenDeViaje(t)
    if (ciudad) {
      const k = clavePanel(ciudad)
      const c = ciudades.get(k) ?? { nombre: ciudad, iso, n: 0 }
      c.n += 1
      ciudades.set(k, c)
    }
    if (iso) paises.set(iso, { iso, n: (paises.get(iso)?.n ?? 0) + 1 })
  }
  const ordenar = (m) => [...m.values()].sort((a, b) => b.n - a.n || String(a.nombre ?? a.iso).localeCompare(String(b.nombre ?? b.iso)))
  return { paises: ordenar(paises), ciudades: ordenar(ciudades) }
}

const NOMBRES = {
  frecuencia: { una_vez_al_anio: 'Una vez al año', dos_o_tres: '2 o 3 veces al año', cuatro_o_mas: '4 o más' },
  compania: { a_mi_aire: 'A mi aire', pareja: 'En pareja', familia: 'En familia', amigos: 'Con amigos' },
}
const TRAMOS = [['menos_18', 'Menos de 18'], ['18_29', '18 – 29'], ['30_44', '30 – 44'], ['45_59', '45 – 59'], ['60_mas', '60 o más']]
const tramoDe = (edad) => (edad < 18 ? 'menos_18' : edad < 30 ? '18_29' : edad < 45 ? '30_44' : edad < 60 ? '45_59' : '60_mas')

/** «Lo que contestaron en la primera vez»: solo cuentas de verdad y SOLO las opciones que alguien ha elegido. */
export function primeraVez(base, ahora = new Date()) {
  const reales = new Set((base.usuarios ?? []).map((u) => u.id))
  const filas = (base.primera_vez ?? []).filter((p) => reales.has(p.user_id) && (p.frecuencia || p.compania || p.anio_nacimiento))
  const anio = Number(diaDe(ahora).slice(0, 4))
  const reparto = (valores, nombres) => {
    const total = valores.length
    const cuenta = new Map()
    for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1)
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([valor, c]) => ({ valor, nombre: nombres[valor] ?? valor, n: c, pct: pct(c, total) }))
  }
  const f = filas.map((p) => p.frecuencia).filter(Boolean)
  const c = filas.map((p) => p.compania).filter(Boolean)
  const e = filas.map((p) => p.anio_nacimiento).filter(Boolean).map((a) => tramoDe(anio - a))
  return {
    contestaron: filas.length,
    bloques: [
      { id: 'frecuencia', titulo: '¿Cada cuánto viajan?', total: f.length, opciones: reparto(f, NOMBRES.frecuencia) },
      { id: 'compania', titulo: '¿Con quién viajan?', total: c.length, opciones: reparto(c, NOMBRES.compania) },
      { id: 'edad', titulo: 'Edad por tramos', total: e.length, opciones: reparto(e, Object.fromEntries(TRAMOS)) },
    ],
  }
}

/** Los cobros reales y pagados dentro de un rango, ordenados del más reciente al más antiguo. */
const cobrosDe = (base, rango, estado = 'pagado') => (base.pagos ?? []).filter((p) => esCobroReal(p) && p.estado === estado && enRango(p.creado_en, rango)).sort((a, b) => String(b.creado_en).localeCompare(String(a.creado_en)))

/** El gráfico de pases vendidos (por día, semana o mes según el rango). */
export function serieDePases(base, rango) {
  const todos = (base.pagos ?? []).filter((p) => esCobroReal(p) && p.estado === 'pagado')
  const primero = todos.map((p) => diaDe(p.creado_en)).sort()[0] ?? rango.hasta
  const { tipo, cubetas, clave } = cubetasDeRango(rango, primero)
  const cuenta = new Map(cubetas.map((c) => [c.clave, 0]))
  for (const p of cobrosDe(base, rango)) {
    const k = clave(diaDe(p.creado_en))
    if (cuenta.has(k)) cuenta.set(k, cuenta.get(k) + 1)
  }
  return { tipo, cubetas: cubetas.map((c) => ({ clave: c.clave, etiqueta: c.etiqueta, pases: cuenta.get(c.clave) ?? 0 })) }
}

const TITULO_AVISO = { restaurante: 'Restaurante nuevo', lugar: 'Lugar nuevo', destino: 'Destino pedido', foto: 'Foto nueva', dato_mal: 'Un dato está mal', consejo: 'Consejo nuevo', no_funciona: 'Algo no funciona', idea: 'Idea nueva' }
const cosaDeAviso = (d) => {
  const x = d && typeof d === 'object' ? d : {}
  const t = [x.sitio, x.nombre, x.destino, x.que, x.texto].map((v) => String(v ?? '').trim()).find(Boolean)
  return t ? t.slice(0, 80) : ''
}
export const tituloDeAviso = (a) => `${TITULO_AVISO[a.tipo] ?? 'Reporte nuevo'}${cosaDeAviso(a.datos) ? `: ${cosaDeAviso(a.datos)}` : ''}`

/** «Pase Roma · Individual» */
export const nombreDeCompra = (p) => `Pase ${p.destino} · ${nombreDePlan(p.plan)}`

/** INICIO: todo lo de la primera pantalla. `avisos` = { nuevos, fotos, recientes[] } (los reportes, que se leen aparte). */
export function calcularInicio(base, avisos, { periodo = {}, ahora = new Date() } = {}) {
  const rango = rangoDePeriodo(periodo, ahora)
  const hoy = diaDe(ahora)
  const mes = rangoDePeriodo({ periodo: 'mes' }, ahora)
  const hace7 = sumarDias(hoy, -6)
  const reales = base.usuarios ?? []
  const ix = indiceDe(base)
  const conViaje = reales.filter((u) => viajesDe(ix, base, u.id, hoy).length > 0).length
  const pagosHoy = cobrosDe(base, { desde: hoy, hasta: hoy })
  const pagosMes = cobrosDe(base, mes)
  const serie = serieDePases(base, rango)
  const ventas = cobrosDe(base, { desde: null, hasta: hoy }).slice(0, 5).map((p) => ({ tipo: 'venta', titulo: nombreDeCompra(p), en: p.creado_en }))
  const reportes = (avisos?.recientes ?? []).map((a) => ({ tipo: a.tipo === 'foto' ? 'foto' : a.tipo === 'no_funciona' ? 'fallo' : 'reporte', titulo: tituloDeAviso(a), en: a.creado, id: a.id }))
  const atencion = [...reportes, ...ventas].filter((x) => x.en).sort((a, b) => String(b.en).localeCompare(String(a.en))).slice(0, 8)
  return {
    ok: true,
    periodo: { periodo: rango.periodo, desde: rango.desde, hasta: rango.hasta, etiqueta: rango.etiqueta, titulo: rango.titulo },
    hoy,
    reportes_nuevos: n(avisos?.nuevos),
    fotos_por_aprobar: n(avisos?.fotos),
    pases: { hoy: pagosHoy.length, mes: pagosMes.length },
    ingresos: { hoy_cent: pagosHoy.reduce((s, p) => s + n(p.importe_cent), 0), mes_cent: pagosMes.reduce((s, p) => s + n(p.importe_cent), 0), moneda: String((base.pagos ?? []).find(esCobroReal)?.moneda ?? 'eur') },
    usuarios: {
      total: reales.length,
      hoy: reales.filter((u) => diaDe(u.alta) === hoy).length,
      semana: reales.filter((u) => u.alta && diaDe(u.alta) >= hace7).length,
      con_viaje: conViaje,
      pct_con_viaje: pct(conViaje, reales.length),
    },
    serie: { ...serie, total: serie.cubetas.reduce((s, c) => s + c.pases, 0) },
    atencion,
    primera_vez: primeraVez(base, ahora),
    desde_donde: desdeDondeViajan(base),
    dondeViven: null,
  }
}

/** VENTAS: tarjetas, pases por día, por destino, últimas compras y conversión, para un periodo. */
export function calcularVentas(base, { periodo = {}, ahora = new Date(), limiteCompras = 30 } = {}) {
  const rango = rangoDePeriodo(periodo, ahora)
  const hoy = diaDe(ahora)
  const ix = indiceDe(base)
  const cobros = cobrosDe(base, rango)
  const ingresosCent = cobros.reduce((s, p) => s + n(p.importe_cent), 0)
  const serie = serieDePases(base, rango)
  // Por destino (con ingresos), del que más al que menos.
  const porDestino = new Map()
  for (const p of cobros) {
    const k = clavePanel(p.destino)
    const d = porDestino.get(k) ?? { destino: p.destino, n: 0, importe_cent: 0 }
    d.n += 1
    d.importe_cent += n(p.importe_cent)
    porDestino.set(k, d)
  }
  // A quién pertenece cada cobro (a través de su pase).
  const pasePorCobro = new Map((base.pases ?? []).filter((p) => p.pago_ref).map((p) => [p.pago_ref, p]))
  const persona = (id) => (id ? { id, nombre: nombreDe(ix, id) } : null)
  const compras = []
  for (const p of (base.pagos ?? []).filter((x) => esCobroReal(x) && enRango(x.creado_en, rango))) {
    const pase = pasePorCobro.get(p.pago_ref)
    compras.push({ fecha: p.creado_en, destino: p.destino, tipo: p.plan, personas: n(p.personas) || null, persona: persona(pase?.comprador_id), estado: p.estado === 'devuelto' ? 'reembolsado' : 'comprado', importe_cent: n(p.importe_cent), moneda: p.moneda ?? 'eur' })
  }
  for (const p of base.pases ?? []) {
    if (p.pago_ref || p.estado !== 'activo' || !enRango(p.created_at, rango)) continue
    compras.push({ fecha: p.created_at, destino: p.destino, tipo: p.tipo, personas: null, persona: persona(p.comprador_id), estado: 'regalado', importe_cent: 0, moneda: 'eur' })
  }
  compras.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  // Conversión: de las personas con viaje, cuántas han comprado un pase (cobro real pagado).
  // «Los que crean un viaje»: quien tiene al menos un viaje PROPIO (unirse al de otra persona no es crear uno).
  const conViaje = (base.usuarios ?? []).filter((u) => viajesDe(ix, base, u.id, hoy).some((v) => v.suyo))
  const compradores = new Set()
  for (const p of base.pases ?? []) {
    const cobro = p.pago_ref ? ix.pagos.get(p.pago_ref) : null
    if (cobro && esCobroReal(cobro) && cobro.estado === 'pagado') compradores.add(p.comprador_id)
  }
  const compraron = conViaje.filter((u) => compradores.has(u.id)).length
  return {
    ok: true,
    periodo: { periodo: rango.periodo, desde: rango.desde, hasta: rango.hasta, etiqueta: rango.etiqueta, titulo: rango.titulo },
    hoy,
    moneda: String((base.pagos ?? []).find(esCobroReal)?.moneda ?? 'eur'),
    pases: { periodo: cobros.length, hoy: cobrosDe(base, { desde: hoy, hasta: hoy }).length },
    ingresos_cent: ingresosCent,
    // «Lo que te queda»: lo cobrado (sin devueltos) antes de impuestos. La comisión de Stripe y los reembolsos llegan en la V35B.
    te_queda: { cent: ingresosCent, comision_cent: null, antes_de_impuestos: true },
    conversion: { pct: pct(compraron, conViaje.length), compraron, viajeros: conViaje.length },
    por_dia: serie,
    por_destino: [...porDestino.values()].sort((a, b) => b.n - a.n || String(a.destino).localeCompare(String(b.destino))),
    compras: compras.slice(0, limiteCompras),
    total_compras: compras.length,
    afiliados: { clics: null },
  }
}

export { rangoDePeriodo, ZONA }
