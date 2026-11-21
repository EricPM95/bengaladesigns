/**
 * (V35B) LOS DATOS DE LAS PERSONAS EN EL PANEL: dónde viven y cómo usan la app. Funciones PURAS que reciben la base (`base.js`); sin base de datos.
 *   · «Dónde viven» sale de `primera_vez[].pais_vive` (código de 2 letras). Solo si la base tiene la columna (`base.hay.pais`); si no, `null` y el panel enseña «Pronto».
 *   · «Cómo usan la app» sale de `uso_diario` (un día activo por cuenta, aparato y si la usan instalada). Solo con `base.hay.uso`; si no, `null` y el panel enseña «Pronto».
 *   · Solo cuentas de verdad (las de `base.usuarios`). Un día es un día de Madrid (las fechas de `uso_diario` ya lo son).
 */
import { sumarDias } from './periodo.js'

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

/** «Dónde viven»: personas por país donde viven (de más a menos). null = la base aún no guarda el país (la 0091 sin aplicar). */
export function dondeViven(base) {
  if (!base?.hay?.pais) return null
  const reales = new Set((base.usuarios ?? []).map((u) => u.id))
  const cuenta = new Map()
  for (const p of base.primera_vez ?? []) {
    if (!reales.has(p.user_id) || !ISO.test(String(p.pais_vive ?? ''))) continue
    const iso = String(p.pais_vive).toLowerCase()
    cuenta.set(iso, (cuenta.get(iso) ?? 0) + 1)
  }
  const total = [...cuenta.values()].reduce((s, x) => s + x, 0)
  const paises = [...cuenta.entries()].map(([iso, n]) => ({ iso, nombre: nombreDePais(iso), n, pct: pct(n, total) })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'))
  return { total, paises }
}

/** El país donde vive una persona, para su ficha: { iso, nombre } o null. */
export function paisDeVive(base, userId) {
  if (!base?.hay?.pais) return null
  const p = (base.primera_vez ?? []).find((x) => x.user_id === userId)
  return p && ISO.test(String(p.pais_vive ?? '')) ? { iso: String(p.pais_vive).toLowerCase(), nombre: nombreDePais(p.pais_vive) } : null
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
