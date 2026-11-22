/**
 * (V35B) LOS DATOS DE LAS PERSONAS EN EL PANEL: dónde viven y cómo usan la app. Funciones PURAS que reciben la base (`base.js`); sin base de datos.
 *   · «Dónde viven» (V39): el país que la persona CONTESTÓ (`primera_vez[].pais_vive`, código de 2 letras) manda siempre; si no lo contestó, el país del ORIGEN de su último viaje (se actualiza con cada viaje, sin guardar nada
 *     más). Cada persona lleva de dónde sale: `fuente` = 'contestado' | 'origen'. Solo si la base tiene la columna (`base.hay.pais`); si no, `null` y el panel enseña «Pronto».
 *   · «Cómo usan la app» sale de `uso_diario` (un día activo por cuenta, aparato y si la usan instalada). Solo con `base.hay.uso`; si no, `null` y el panel enseña «Pronto».
 *   · Solo cuentas de verdad (las de `base.usuarios`). Un día es un día de Madrid (las fechas de `uso_diario` ya lo son).
 */
import { sumarDias } from './periodo.js'
import { origenDeViaje } from './calculos.js'

const pct = (x, total) => (total > 0 ? Math.round((x / total) * 100) : 0)
const ISO = /^[A-Za-z]{2}$/

export const nombreDePais = (() => {
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

/**
 * (V39) El país de cada persona (userId → { iso en minúsculas, fuente }): lo que CONTESTÓ, y si no lo contestó (o lo saltó), el del ORIGEN de su último viaje creado (el de la ciudad de la que sale; `updated_at` de
 * `trips`, que ya se baja con la base del panel: no hay consulta nueva). La respuesta contestada nunca se pisa con un origen.
 */
export function paisesDePersonas(base) {
  const salida = new Map()
  const ultimo = new Map() // traveler_id → viaje más reciente
  for (const t of base.trips ?? []) {
    const previo = ultimo.get(t.traveler_id)
    if (!previo || String(t.actualizado ?? '') >= String(previo.actualizado ?? '')) ultimo.set(t.traveler_id, t)
  }
  const contestado = new Map((base.primera_vez ?? []).filter((p) => ISO.test(String(p.pais_vive ?? ''))).map((p) => [p.user_id, String(p.pais_vive).toLowerCase()]))
  for (const u of base.usuarios ?? []) {
    if (contestado.has(u.id)) {
      salida.set(u.id, { iso: contestado.get(u.id), fuente: 'contestado' })
      continue
    }
    const viaje = ultimo.get(u.id)
    const iso = viaje ? origenDeViaje(viaje).iso : null
    if (iso && ISO.test(iso)) salida.set(u.id, { iso: iso.toLowerCase(), fuente: 'origen' })
  }
  return salida
}

/** «Dónde viven»: personas por país donde viven (de más a menos), con cuántas lo contestaron y cuántas se sacan del origen de su viaje. null = la base aún no guarda el país (la 0091 sin aplicar). */
export function dondeViven(base) {
  if (!base?.hay?.pais) return null
  const cuenta = new Map()
  const fuentes = { contestado: 0, origen: 0 }
  for (const { iso, fuente } of paisesDePersonas(base).values()) {
    const c = cuenta.get(iso) ?? { n: 0, contestado: 0, origen: 0 }
    c.n += 1
    c[fuente] += 1
    fuentes[fuente] += 1
    cuenta.set(iso, c)
  }
  const total = fuentes.contestado + fuentes.origen
  const paises = [...cuenta.entries()].map(([iso, c]) => ({ iso, nombre: nombreDePais(iso), n: c.n, contestado: c.contestado, origen: c.origen, pct: pct(c.n, total) })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'))
  return { total, paises, fuentes }
}

/** El país donde vive una persona, para su ficha: { iso, nombre, fuente } o null. */
export function paisDeVive(base, userId) {
  if (!base?.hay?.pais) return null
  const p = paisesDePersonas(base).get(userId)
  return p ? { iso: p.iso, nombre: nombreDePais(p.iso), fuente: p.fuente } : null
}

const NOMBRES_APARATO = { iphone: 'iPhone', android: 'Android', ordenador: 'Ordenador' }

/**
 * Cómo usan la app, a partir de `uso_diario`. `hasta` es el último día del periodo elegido (hoy, casi siempre) y `rango` el periodo.
 *   · activos al día / a la semana / al mes: personas con algún día activo en el último día / 7 días / 30 días hasta `hasta`.
 *   · activos del periodo: personas con algún día activo dentro del rango elegido.
 *   · retención simple: de los activos la semana anterior (7 días anteriores a esta semana), cuántos vuelven esta semana.
 *   · aparato y dónde la usan: de las personas activas del periodo, con su día más reciente.
 * null = sin la tabla (la 0091 sin aplicar).
 */
export function usoDeLaApp(base, rango) {
  if (!base?.hay?.uso) return null
  const reales = new Set((base.usuarios ?? []).map((u) => u.id))
  const filas = (base.uso_diario ?? []).filter((f) => reales.has(f.user_id) && f.dia)
  const hasta = rango.hasta
  const activosEntre = (desde, fin) => new Set(filas.filter((f) => (desde === null || f.dia >= desde) && f.dia <= fin).map((f) => f.user_id))
  const dia = activosEntre(hasta, hasta)
  const semana = activosEntre(sumarDias(hasta, -6), hasta)
  const mes = activosEntre(sumarDias(hasta, -29), hasta)
  const anterior = activosEntre(sumarDias(hasta, -13), sumarDias(hasta, -7))
  const vuelven = [...anterior].filter((id) => semana.has(id)).length
  const delPeriodo = activosEntre(rango.desde, hasta)
  // Con su día más reciente dentro del periodo: el aparato y si la usa instalada.
  const ultimo = new Map()
  for (const f of filas) {
    if ((rango.desde !== null && f.dia < rango.desde) || f.dia > hasta) continue
    const antes = ultimo.get(f.user_id)
    if (!antes || f.dia > antes.dia) ultimo.set(f.user_id, f)
  }
  const reparto = (clave, nombres) => {
    const cuenta = new Map()
    for (const f of ultimo.values()) cuenta.set(clave(f), (cuenta.get(clave(f)) ?? 0) + 1)
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([valor, n]) => ({ valor, nombre: nombres[valor] ?? valor, n, pct: pct(n, ultimo.size) }))
  }
  return {
    dia: dia.size,
    semana: semana.size,
    mes: mes.size,
    periodo: delPeriodo.size,
    retencion: { base: anterior.size, vuelven, pct: anterior.size > 0 ? pct(vuelven, anterior.size) : null },
    aparato: reparto((f) => f.aparato, NOMBRES_APARATO),
    donde: reparto((f) => (f.instalada ? 'instalada' : 'navegador'), { instalada: 'App instalada', navegador: 'Navegador' }),
    con_dato: ultimo.size,
  }
}
