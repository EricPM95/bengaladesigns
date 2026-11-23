/**
 * (V35A) LOS CÁLCULOS DE «USUARIOS»: funciones PURAS que reciben la base (`base.js`), un periodo (`periodo.js`) y los datos de los logros, y devuelven lo que enseña la pantalla. Sin base de datos: la prueba les pasa una base falsa.
 * Reglas fijas (las mismas que Inicio y Ventas, vía `comunes.js`, para que las cifras nunca se contradigan):
 *   · Sus viajes son los PROPIOS y los COMPARTIDOS a los que se ha unido (`viajesDe`).
 *   · Sus pases y lo gastado salen de la MISMA función (`pasesDe`, `gastadoDe`): la lista y la ficha no se pueden contradecir.
 *   · Un cobro solo es de alguien a través de su pase. Si el pase ya no existe (por ejemplo, «Empezar de cero» lo borró), el cobro cuenta en Ventas pero NO se pone en la ficha de nadie: se enseña aparte como «cobros sin pase».
 *   · Un día es un día de Madrid.
 */
import { diaDe, diasEntre, rangoDePeriodo, sumarDias, enRango } from './periodo.js'
import { clavePanel, esCobroReal, gastadoDe, indiceDe, nombreDe, nombreDePlan, pasesDe, etiquetaDePase, viajesDe } from './comunes.js'
import { desdeDondeViajan, primeraVez } from './calculos.js'
import { nivelDeExp } from '../logros/exp.js'
import { dondeViven, paisDeVive, usoDeLaApp } from './calculosPersonas.js'
import { franjaDeFila } from '../franjaEdad.js'

/** El año de un día «AAAA-MM-DD» (con él se calcula la franja de edad de las respuestas viejas, V41). */
const anioDe = (hoy) => Number(String(hoy).slice(0, 4))

const n = (v) => Number(v) || 0
const pct = (x, total) => (total > 0 ? Math.round((x / total) * 100) : 0)
export const POR_PAGINA = 50
export const ORDENES = ['viajes', 'gastado', 'reciente', 'acceso']
export const FRECUENCIAS = ['una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas']
export const COMPANIAS = ['a_mi_aire', 'pareja', 'familia', 'amigos']
const FECHA = /^\d{4}-\d{2}-\d{2}$/
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
/** Los colores de los 5 destinos con más gente; el resto va junto en «Otros» (gris). */
export const COLORES_CALENDARIO = ['#C99A44', '#C2603A', '#2A4A94', '#7FB8A0', '#8A5AA8']
export const COLOR_OTROS = '#C9BFA8'

/** Destinos que conoce la app (nombre bonito y país): para que «roma», «Roma» y «ROMA» sean un solo destino con su bandera. */
export function indiceDeDestinos(conocidos = []) {
  const m = new Map()
  for (const d of conocidos) {
    m.set(clavePanel(d.nombre), d)
    if (d.clave) m.set(clavePanel(d.clave), d)
  }
  return m
}
const ponerMayuscula = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)
/** { nombre, iso } de un destino tal como viene escrito en un viaje o un pase. */
export function destinoBonito(crudo, conocidos) {
  const k = clavePanel(crudo)
  const d = conocidos.get(k)
  if (d) return { clave: k, nombre: d.nombre, iso: d.iso ?? null }
  const texto = String(crudo ?? '').split(',')[0].trim()
  return { clave: clavePanel(texto) || '—', nombre: ponerMayuscula(texto) || '—', iso: null }
}

const nombreDePais = (() => {
  let nombres = null
  return (iso) => {
    try {
      nombres ??= new Intl.DisplayNames(['es'], { type: 'region' })
      return nombres.of(String(iso).toUpperCase()) ?? String(iso).toUpperCase()
    } catch {
      return String(iso).toUpperCase()
    }
  }
})()

/** ¿El viaje cae (aunque sea un solo día) entre estas dos fechas? Una fecha vacía = sin límite por ese lado. */
export function solapa(v, desde, hasta) {
  if (!v.inicio) return false
  const fin = v.fin ?? v.inicio
  return (!desde || fin >= desde) && (!hasta || v.inicio <= hasta)
}

/** Lo que ha ganado la persona, agrupado como en la ficha (Medallas, Colecciones, Emblemas y logros especiales, Pasaporte). Nunca «Sello»: son medallas. */
export function logrosDe(filas, datos) {
  const d = datos ?? { destinos: {}, viajero: { logros: [] } }
  const ciudad = (clave) => d.destinos?.[clave]?.ciudad ?? d.destinos?.[clave]?.destino ?? ponerMayuscula(String(clave ?? ''))
  const ORDEN = ['bronce', 'plata', 'oro', 'diamante']
  const mejor = new Map() // medalla → grado más alto
  const colecciones = new Map()
  const emblemas = []
  let paises = 0
  let sellos = 0
  for (const a of filas) {
    const logro = String(a.logro ?? '')
    if (logro === 'sello') {
      sellos += 1
      const [id, grado] = String(a.escalon).split(':')
      const clave = `${a.destino}|${id}`
      const def = d.destinos?.[a.destino]?.sellos?.find((s) => s.id === id)
      const actual = mejor.get(clave)
      if (!actual || ORDEN.indexOf(grado) > ORDEN.indexOf(actual.grado)) mejor.set(clave, { grado: grado ?? '', nombre: def?.nombre ?? ciudad(a.destino) })
    } else if (logro === 'coleccion') {
      colecciones.set(a.destino, (colecciones.get(a.destino) ?? 0) + 1)
    } else if (logro === 'pais') {
      paises += 1
    } else if (logro === 'emblema') {
      const e = d.destinos?.[a.destino]?.emblemas?.find((x) => x.id === a.escalon)
      emblemas.push({ texto: e?.nombre ?? String(a.escalon), tipo: 'emblema' })
    } else if (logro === 'maravilla') {
      emblemas.push({ texto: `Maravilla · ${ciudad(a.destino)}`, tipo: 'emblema' })
    } else if (logro === 'patrimonio') {
      emblemas.push({ texto: `Patrimonio · ${ciudad(a.destino)}`, tipo: 'emblema' })
    } else if (logro === 'destino_nuevo') {
      emblemas.push({ texto: `Destino nuevo · ${ciudad(a.destino)}`, tipo: 'emblema' })
    } else if (logro.startsWith('viajero:')) {
      const def = d.viajero?.logros?.find((l) => l.id === logro.slice('viajero:'.length))
      const e = def?.escalones?.find((x) => String(x.n) === String(a.escalon))
      emblemas.push({ texto: e?.nombre ?? def?.id ?? logro, tipo: 'viajero' })
    }
  }
  return {
    medallas: [...mejor.values()].map((m) => ({ grado: m.grado, texto: `Medalla de ${m.grado === 'diamante' ? 'diamante' : m.grado} · ${m.nombre}` })),
    colecciones: [...colecciones.entries()].map(([destino, hechas]) => {
      const total = d.destinos?.[destino]?.colecciones?.length ?? 0
      return { texto: total ? `${hechas} de ${total} en ${ciudad(destino)}` : `${hechas} en ${ciudad(destino)}` }
    }),
    emblemas,
    pasaporte: { paises, sellos, texto: paises || sellos ? `${paises} ${paises === 1 ? 'país' : 'países'} · ${sellos} ${sellos === 1 ? 'sello' : 'sellos'}` : '' },
  }
}

/** Una fila por persona (con todo calculado una vez): la lista, los filtros, el resumen y la ficha salen de aquí. */
export function prepararUsuarios(base, { hoy, datos, conocidos }) {
  const ix = indiceDe(base)
  const exp = new Map((base.perfiles ?? []).map((p) => [p.user_id, n(p.exp_max)]))
  const primera = new Map((base.primera_vez ?? []).map((p) => [p.user_id, p]))
  const logros = new Map()
  for (const a of base.logros ?? []) {
    if (!logros.has(a.user_id)) logros.set(a.user_id, [])
    logros.get(a.user_id).push(a)
  }
  const registros = (base.usuarios ?? []).map((u) => {
    const viajes = viajesDe(ix, base, u.id, hoy).map((v) => ({ ...v, destino_crudo: v.destino, destino: destinoBonito(v.destino, conocidos).nombre, clave: destinoBonito(v.destino, conocidos).clave, iso: destinoBonito(v.destino, conocidos).iso }))
    const pases = pasesDe(ix, base, u.id).map((p) => ({ ...p, destino: destinoBonito(p.destino, conocidos).nombre, clave: destinoBonito(p.destino, conocidos).clave, etiqueta: null }))
    for (const p of pases) p.etiqueta = etiquetaDePase(p)
    const nivel = nivelDeExp(exp.get(u.id) ?? 0, datos.exp)
    const pv = primera.get(u.id)
    return {
      id: u.id,
      nombre: nombreDe(ix, u.id),
      email: u.email,
      alta: u.alta,
      ultimo_acceso: u.ultimo_acceso,
      proveedor: u.proveedor,
      exp: exp.get(u.id) ?? 0,
      nivel: nivel.nivel,
      rango: nivel.rango,
      viajes,
      pases,
      gastado_cent: gastadoDe(pases),
      moneda: pases.find((p) => p.moneda)?.moneda ?? 'eur',
      primera_vez: pv ? { frecuencia: pv.frecuencia ?? null, compania: pv.compania ?? null, franja_edad: franjaDeFila(pv, anioDe(hoy)) } : null,
      logros: logros.get(u.id) ?? [],
      vive: paisDeVive(base, u.id),
    }
  })
  return { registros, ix }
}

/** El próximo viaje (el que aún no ha terminado y empieza antes). Con «Viajan entre…», el que cae en esas fechas (y a ese destino, si se eligió). */
export function proximoViaje(r, hoy, entre = null) {
  const lista = r.viajes.filter((v) => v.inicio && (entre ? solapa(v, entre.desde, entre.hasta) && (!entre.destino || v.clave === clavePanel(entre.destino)) : (v.fin ?? v.inicio) >= hoy))
  lista.sort((a, b) => a.inicio.localeCompare(b.inicio))
  const v = lista[0]
  return v ? { destino: v.destino, iso: v.iso, inicio: v.inicio, fin: v.fin ?? v.inicio } : null
}

const sinTildes = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const limpiarBusqueda = (v) => String(v ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)

/** Los filtros de la lista, limpios (lo que no vale, se ignora). */
export function leerFiltros(query = {}) {
  const fecha = (v) => (FECHA.test(String(v ?? '')) ? String(v) : '')
  return {
    q: limpiarBusqueda(query.q),
    pase: ['si', 'no'].includes(query.pase) ? query.pase : '',
    destino: limpiarBusqueda(query.destino),
    frecuencia: FRECUENCIAS.includes(query.frecuencia) ? query.frecuencia : '',
    compania: COMPANIAS.includes(query.compania) ? query.compania : '',
    orden: ORDENES.includes(query.orden) ? query.orden : 'reciente',
    entre_desde: fecha(query.entre_desde),
    entre_hasta: fecha(query.entre_hasta),
    entre_destino: limpiarBusqueda(query.entre_destino),
    pagina: Math.max(1, Math.min(Number.parseInt(String(query.pagina ?? ''), 10) || 1, 100000)),
  }
}
export const hayEntre = (f) => Boolean(f.entre_desde || f.entre_hasta || f.entre_destino)

/** Filtra y ordena. «Viajan entre…» deja SOLO a quien tiene un viaje que cae en esas fechas (y a ese destino, si se eligió). */
export function filtrarYOrdenar(registros, f, hoy) {
  const q = sinTildes(f.q)
  const dest = clavePanel(f.destino)
  const entre = hayEntre(f) ? { desde: f.entre_desde, hasta: f.entre_hasta, destino: f.entre_destino } : null
  let r = registros.filter((u) => {
    if (q && !sinTildes(`${u.nombre} ${u.email}`).includes(q)) return false
    if (f.pase === 'si' && u.pases.length === 0) return false
    if (f.pase === 'no' && u.pases.length > 0) return false
    if (dest && !u.pases.some((p) => p.clave === dest) && !u.viajes.some((v) => v.clave === dest)) return false
    if (f.frecuencia && u.primera_vez?.frecuencia !== f.frecuencia) return false
    if (f.compania && u.primera_vez?.compania !== f.compania) return false
    if (entre && !proximoViaje(u, hoy, entre)) return false
    return true
  })
  const hechos = (u) => u.viajes.filter((v) => v.hecho).length
  const t = (v) => (v ? new Date(v).getTime() : 0)
  const claves = {
    viajes: (a, b) => b.viajes.length - a.viajes.length || hechos(b) - hechos(a),
    gastado: (a, b) => b.gastado_cent - a.gastado_cent,
    reciente: (a, b) => t(b.alta) - t(a.alta),
    acceso: (a, b) => t(b.ultimo_acceso) - t(a.ultimo_acceso),
  }
  r = [...r].sort((a, b) => claves[f.orden](a, b) || a.id.localeCompare(b.id))
  return { filas: r, entre }
}

/** La fila de la lista (y la cabecera de la ficha). */
export function filaDe(r, hoy, entre = null) {
  const pv = r.primera_vez
  return {
    id: r.id,
    nombre: r.nombre,
    email: r.email,
    // (V35B) Cuenta de prueba (Herramientas › «Cuentas que no cuentan»): la lista la enseña con la etiqueta «Prueba».
    prueba: Boolean(r.prueba),
    alta: r.alta,
    ultimo_acceso: r.ultimo_acceso,
    nivel: r.nivel,
    rango: r.rango,
    exp: r.exp,
    pase: { tiene: r.pases.length > 0, destinos: r.pases.map((p) => ({ destino: p.destino, tipo: p.tipo, origen: p.origen, de: p.de, etiqueta: p.etiqueta })) },
    viajes: { creados: r.viajes.length, hechos: r.viajes.filter((v) => v.hecho).length },
    proximo_viaje: proximoViaje(r, hoy, entre),
    gastado_cent: r.gastado_cent,
    moneda: r.moneda,
    primera_vez: pv ? { frecuencia: pv.frecuencia, compania: pv.compania, franja_edad: pv.franja_edad ?? null } : null,
  }
}

/** La lista paginada. */
export function listar(registros, query, { hoy, conocidos }) {
  const f = leerFiltros(query)
  const { filas, entre } = filtrarYOrdenar(registros, f, hoy)
  const desde = (f.pagina - 1) * POR_PAGINA
  const destinos = new Map()
  for (const u of registros) {
    for (const x of [...u.viajes, ...u.pases]) if (x.clave && x.clave !== '—') destinos.set(x.clave, x.destino)
  }
  for (const d of conocidos.values()) destinos.set(clavePanel(d.nombre), d.nombre)
  return {
    ok: true,
    pagina: f.pagina,
    por_pagina: POR_PAGINA,
    total: filas.length,
    con_entre: Boolean(entre),
    usuarios: filas.slice(desde, desde + POR_PAGINA).map((u) => filaDe(u, hoy, entre)),
    destinos: [...destinos.values()].sort((a, b) => a.localeCompare(b, 'es')),
  }
}

/** La ficha de una persona, o null si no existe. */
export function ficha(registros, id, { hoy, ahora, datos, reportes = [] }) {
  const u = registros.find((x) => x.id === id)
  if (!u) return null
  const L = logrosDe(u.logros, datos)
  const conQuien = (v) => (v.personas <= 1 ? 'Solo' : v.personas === 2 ? 'En pareja' : `Grupo de ${v.personas}`)
  const destinosConPase = new Set(u.pases.map((p) => p.clave)).size
  return {
    ok: true,
    usuario: filaDe(u, hoy),
    // «Hoy · 09:14»: la hora de Madrid del último acceso (la pone la pantalla).
    // (V35B) El país donde vive ({ iso, nombre }), o null si no lo ha dicho o aún no se guarda (0091 sin aplicar).
    vive_en: u.vive ?? null,
    hoy,
    ahora: ahora.toISOString(),
    pase_texto: u.pases.length ? `Sí · ${destinosConPase} ${destinosConPase === 1 ? 'destino' : 'destinos'}` : 'No',
    viajes: u.viajes.map((v) => ({ id: v.id, destino: v.destino, iso: v.iso, inicio: v.inicio, fin: v.fin, hecho: v.hecho, personas: v.personas, con_quien: conQuien(v), suyo: v.suyo, de: v.de, de_id: v.de_id })),
    pases: [...u.pases].sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? ''))).map((p) => ({ fecha: p.fecha, destino: p.destino, tipo: p.tipo, plan: nombreDePlan(p.tipo), origen: p.origen, de: p.de, de_id: p.de_id, etiqueta: p.etiqueta, importe_cent: p.importe_cent, moneda: p.moneda, reembolsado: p.reembolsado })),
    logros: L,
    reportes,
  }
}

/** Cobros reales pagados que ningún pase reclama (su pase ya no existe, p. ej. «Empezar de cero»). Cuentan en Ventas, pero no son de nadie. */
export function cobrosSinPase(base) {
  const conPase = new Set((base.pases ?? []).filter((p) => p.pago_ref).map((p) => p.pago_ref))
  const filas = (base.pagos ?? []).filter((p) => esCobroReal(p) && p.estado === 'pagado' && !conPase.has(p.pago_ref))
  return { n: filas.length, importe_cent: filas.reduce((s, p) => s + n(p.importe_cent), 0), moneda: String(filas[0]?.moneda ?? 'eur'), detalle: filas.map((p) => ({ destino: p.destino, importe_cent: n(p.importe_cent), fecha: p.creado_en })) }
}

/** Los meses (de este) y las semanas (de esta) que enseña el calendario. */
const mesesSiguientes = (hoy, k) => {
  let a = Number(hoy.slice(0, 4))
  let m = Number(hoy.slice(5, 7)) - 1
  const salida = []
  for (let i = 0; i < k; i++) {
    const clave = `${a}-${String(m + 1).padStart(2, '0')}`
    const ultimo = new Date(Date.UTC(a, m + 1, 0)).getUTCDate()
    salida.push({ clave, nombre: MESES[m], largo: MESES_LARGOS[m], desde: `${clave}-01`, hasta: `${clave}-${String(ultimo).padStart(2, '0')}` })
    m += 1
    if (m > 11) {
      m = 0
      a += 1
    }
  }
  return salida
}
const lunesDe = (dia) => sumarDias(dia, -((new Date(`${dia}T12:00:00Z`).getUTCDay() + 6) % 7))

/** El calendario de viajes de los próximos 6 meses: por mes y por semana; los 5 destinos con más gente con su color y el resto en «Otros». */
export function calendario(registros, hoy) {
  const meses = mesesSiguientes(hoy, 6)
  const l0 = lunesDe(hoy)
  const semanas = Array.from({ length: 26 }, (_, i) => {
    const desde = sumarDias(l0, i * 7)
    const [, m, d] = desde.split('-')
    return { clave: desde, nombre: `${Number(d)} ${MESES[Number(m) - 1].toLowerCase()}`, desde, hasta: sumarDias(desde, 6) }
  })
  // Una persona cuenta una vez por destino y hueco (aunque tenga dos viajes al mismo sitio).
  const contar = (huecos) => {
    const salida = huecos.map((h) => ({ ...h, por: new Map() }))
    for (const u of registros) {
      for (const h of salida) {
        const destinos = new Set(u.viajes.filter((v) => solapa(v, h.desde, h.hasta)).map((v) => v.clave))
        for (const c of destinos) {
          const nombre = u.viajes.find((v) => v.clave === c).destino
          const x = h.por.get(c) ?? { clave: c, destino: nombre, n: 0 }
          x.n += 1
          h.por.set(c, x)
        }
      }
    }
    return salida
  }
  const porMes = contar(meses)
  const porSemana = contar(semanas)
  // Los 5 con más gente (en los 6 meses).
  const total = new Map()
  for (const h of porMes) for (const x of h.por.values()) total.set(x.clave, { destino: x.destino, n: (total.get(x.clave)?.n ?? 0) + x.n })
  const top = [...total.entries()].sort((a, b) => b[1].n - a[1].n || a[1].destino.localeCompare(b[1].destino)).slice(0, 5)
  const color = new Map(top.map(([clave], i) => [clave, COLORES_CALENDARIO[i]]))
  const dar = (h) => {
    const segmentos = []
    let otros = 0
    for (const x of [...h.por.values()].sort((a, b) => b.n - a.n)) {
      if (color.has(x.clave)) segmentos.push({ clave: x.clave, destino: x.destino, n: x.n, color: color.get(x.clave) })
      else otros += x.n
    }
    // En el mismo orden que la leyenda (para que cada destino quede siempre en la misma altura).
    segmentos.sort((a, b) => top.findIndex(([c]) => c === a.clave) - top.findIndex(([c]) => c === b.clave))
    if (otros) segmentos.push({ clave: 'otros', destino: 'Otros', n: otros, color: COLOR_OTROS })
    return { clave: h.clave, nombre: h.nombre, desde: h.desde, hasta: h.hasta, total: segmentos.reduce((s, x) => s + x.n, 0), segmentos }
  }
  const mesesSalida = porMes.map(dar)
  const hayOtros = [...mesesSalida, ...porSemana.map(dar)].some((m) => m.segmentos.some((s) => s.clave === 'otros'))
  const leyenda = top.map(([clave, x]) => ({ clave, destino: x.destino, color: color.get(clave) }))
  if (hayOtros) leyenda.push({ clave: 'otros', destino: 'Otros', color: COLOR_OTROS })
  // La frase de la temporada fuerte, con los datos de verdad.
  const fuerte = [...mesesSalida].sort((a, b) => b.total - a.total)[0]
  let frase = 'Todavía no hay viajes en los próximos 6 meses.'
  if (fuerte && fuerte.total > 0) {
    const mayor = [...fuerte.segmentos].filter((s) => s.clave !== 'otros').sort((a, b) => b.n - a.n)[0] ?? fuerte.segmentos[0]
    const largo = meses.find((m) => m.clave === fuerte.clave)?.largo ?? fuerte.nombre
    frase = `${largo} es la temporada fuerte: ${fuerte.total} ${fuerte.total === 1 ? 'persona viaja' : 'personas viajan'}${mayor ? `, la mayoría a ${mayor.destino}` : ''}.`
  }
  return { leyenda, meses: mesesSalida, semanas: porSemana.map(dar), mes_fuerte: fuerte && fuerte.total > 0 ? fuerte.clave : null, frase }
}

/** «Viajando ahora» (viajes cuyas fechas incluyen hoy) y «Viajan en los próximos 30 días», con los 3 primeros destinos. */
export function viajando(registros, hoy) {
  const fin30 = sumarDias(hoy, 30)
  const porDestino = new Map()
  let ahora = 0
  let proximos = 0
  for (const u of registros) {
    const de_hoy = new Set(u.viajes.filter((v) => solapa(v, hoy, hoy)).map((v) => v.clave))
    const de_30 = new Set(u.viajes.filter((v) => solapa(v, hoy, fin30)).map((v) => v.clave))
    if (de_hoy.size) ahora += 1
    if (de_30.size) proximos += 1
    for (const c of de_30) {
      const x = porDestino.get(c) ?? { clave: c, destino: u.viajes.find((v) => v.clave === c).destino, iso: u.viajes.find((v) => v.clave === c).iso, hoy: 0, en30: 0 }
      x.en30 += 1
      if (de_hoy.has(c)) x.hoy += 1
      porDestino.set(c, x)
    }
  }
  const destinos = [...porDestino.values()].sort((a, b) => b.en30 - a.en30 || b.hoy - a.hoy || a.destino.localeCompare(b.destino)).slice(0, 3)
  return { hoy: ahora, proximos30: proximos, destinos }
}

/** El resumen de arriba de la pantalla (todo menos la lista). */
export function resumen(base, { periodo = {}, ahora = new Date(), datos, conocidos }) {
  const rango = rangoDePeriodo(periodo, ahora)
  const hoy = diaDe(ahora)
  const { registros } = prepararUsuarios(base, { hoy, datos, conocidos })
  const total = registros.length
  const conViaje = registros.filter((u) => u.viajes.some((v) => v.suyo)).length
  const conPase = registros.filter((u) => u.pases.length > 0).length
  const hechoViaje = registros.filter((u) => u.viajes.some((v) => v.hecho)).length
  const conLogro = registros.filter((u) => u.logros.length > 0).length
  const pasos = [['registrados', 'Registrados', total], ['con_viaje', 'Con viaje creado', conViaje], ['con_pase', 'Con pase', conPase], ['han_viajado', 'Han hecho el viaje', hechoViaje], ['con_logro', 'Han ganado un logro', conLogro]]
  const embudo = pasos.map(([id, etiqueta, cuantos], i) => ({ id, etiqueta, n: cuantos, ancho: pct(cuantos, total), pasa_pct: i > 0 ? Math.min(100, pct(cuantos, pasos[i - 1][2])) : null }))
  const activosEn = (dias) => registros.filter((u) => u.ultimo_acceso && diaDe(u.ultimo_acceso) >= sumarDias(hoy, -(dias - 1))).length
  const pv = primeraVez(base, ahora)
  const bloque = (id) => pv.bloques.find((b) => b.id === id) ?? { total: 0, opciones: [] }
  const dondeViajan = desdeDondeViajan(base)
  const niveles = new Map()
  for (const u of registros) niveles.set(u.nivel, (niveles.get(u.nivel) ?? 0) + 1)
  const maximo = Math.max(6, ...niveles.keys())
  const entran = { correo: registros.filter((u) => u.proveedor === 'correo').length, google: registros.filter((u) => u.proveedor === 'google').length }
  entran.otros = total - entran.correo - entran.google
  // (V35B) Con la tabla `uso_diario` (0091), la actividad sale de ella; sin ella, del último acceso y la retención es «Pronto» (null).
  const uso = usoDeLaApp(base, rango)
  return {
    ok: true,
    periodo: { periodo: rango.periodo, desde: rango.desde, hasta: rango.hasta, etiqueta: rango.etiqueta, titulo: rango.titulo },
    hoy,
    total,
    nuevos: registros.filter((u) => u.alta && enRango(u.alta, rango)).length,
    activos: uso ? uso.periodo : registros.filter((u) => u.ultimo_acceso && enRango(u.ultimo_acceso, rango)).length,
    embudo,
    // La retención («de los que entraron una semana, volvieron la siguiente») sale de `uso_diario`. Sin esa tabla, `null` («Pronto»): no se inventa.
    actividad: uso ? { dia: uso.dia, semana: uso.semana, mes: uso.mes, retencion_pct: uso.retencion.pct, retencion_base: uso.retencion.base, retencion_vuelven: uso.retencion.vuelven, de_uso: true } : { dia: activosEn(1), semana: activosEn(7), mes: activosEn(30), retencion_pct: null, retencion_base: 0, retencion_vuelven: 0, de_uso: false },
    // Aparato y dónde la usan (de las personas activas del periodo). null = «Pronto».
    uso: uso ? { aparato: uso.aparato, donde: uso.donde, con_dato: uso.con_dato } : null,
    viajando: viajando(registros, hoy),
    calendario: calendario(registros, hoy),
    quienes: { contestaron: pv.contestaron, frecuencia: bloque('frecuencia').opciones, compania: bloque('compania').opciones, edad: bloque('edad').opciones },
    donde_viven: dondeViven(base),
    desde_donde: { paises: dondeViajan.paises.map((p) => ({ iso: p.iso, nombre: nombreDePais(p.iso), n: p.n })), ciudades: dondeViajan.ciudades.map((c) => ({ nombre: c.nombre, iso: c.iso, n: c.n })) },
    niveles: Array.from({ length: maximo }, (_, i) => ({ nivel: i + 1, n: niveles.get(i + 1) ?? 0 })),
    entran: { total, ...entran, correo_pct: pct(entran.correo, total), google_pct: pct(entran.google, total), otros_pct: pct(entran.otros, total) },
    cobros_sin_pase: cobrosSinPase(base),
  }
}

export { diasEntre }
