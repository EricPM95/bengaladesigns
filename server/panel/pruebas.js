/**
 * (V35B) «SIN CUENTAS DE PRUEBA»: las cuentas de prueba y las de administrador no cuentan en las cifras ni los gráficos del panel (Inicio, Ventas, Usuarios, Logros).
 *   · Las de administrador (LOGROS_ADMIN_EMAILS / LOGROS_ADMIN_IDS) no cuentan NUNCA.
 *   · Las de prueba se marcan por correo en la tabla `cuentas_de_prueba` (migración 0091; Herramientas › «Cuentas que no cuentan»). Sin la tabla, solo cuentan como excluidas las de administrador.
 *   · El interruptor de arriba del panel (`?sin_pruebas=1`, encendido por defecto; `?sin_pruebas=0` las incluye) decide si se aplica el filtro. La lista de usuarios las sigue enseñando, con la etiqueta «Prueba».
 *   · Filtrar es quitar de la base (usuarios, viajes, pases, cobros, logros, uso…) lo que es de esas cuentas ANTES de calcular: los cálculos no cambian.
 */
import { leerBase } from './base.js'

const lista = (texto) => String(texto ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)

/** Los correos y los identificadores de los administradores (nunca cuentan). */
export const administradoresDe = (env = process.env) => ({ correos: new Set(lista(env.LOGROS_ADMIN_EMAILS)), ids: new Set(lista(env.LOGROS_ADMIN_IDS)) })

/** ¿Está encendido «Sin cuentas de prueba»? Por defecto sí; solo `sin_pruebas=0` (o false/no/off) lo apaga. */
export const sinPruebasDe = (query = {}) => !['0', 'false', 'no', 'off'].includes(String(query.sin_pruebas ?? '1').toLowerCase())

/** Los ids de las cuentas que no cuentan: las de administrador (siempre) y las marcadas como de prueba. */
export function idsQueNoCuentan(base, env = process.env) {
  const admin = administradoresDe(env)
  const pruebas = new Set((base.cuentas_de_prueba ?? []).map((e) => String(e).toLowerCase()))
  const ids = new Set()
  const prueba = new Set()
  const administrador = new Set()
  for (const u of base.usuarios ?? []) {
    const correo = String(u.email ?? '').toLowerCase()
    if (admin.ids.has(String(u.id).toLowerCase()) || (correo && admin.correos.has(correo))) {
      ids.add(u.id)
      administrador.add(u.id)
    } else if (correo && pruebas.has(correo)) {
      ids.add(u.id)
      prueba.add(u.id)
    }
  }
  return { ids, prueba, administrador }
}

/** La misma base sin lo que es de esas cuentas. Pura. */
export function sinCuentas(base, ids) {
  if (!ids || ids.size === 0) return base
  const fuera = (id) => ids.has(id)
  const pasesFuera = new Set((base.pases ?? []).filter((p) => fuera(p.comprador_id)).map((p) => p.pago_ref).filter(Boolean))
  const viajesFuera = new Set((base.trips ?? []).filter((t) => fuera(t.traveler_id)).map((t) => t.id))
  return {
    ...base,
    usuarios: (base.usuarios ?? []).filter((u) => !fuera(u.id)),
    travelers: (base.travelers ?? []).filter((t) => !fuera(t.id)),
    trips: (base.trips ?? []).filter((t) => !viajesFuera.has(t.id)),
    miembros: (base.miembros ?? []).filter((m) => !fuera(m.user_id) && !viajesFuera.has(m.trip_id)),
    pases: (base.pases ?? []).filter((p) => !fuera(p.comprador_id)),
    miembros_pase: (base.miembros_pase ?? []).filter((m) => !fuera(m.user_id)),
    pagos: (base.pagos ?? []).filter((p) => !(p.user_id && fuera(p.user_id)) && !pasesFuera.has(p.pago_ref)),
    logros: (base.logros ?? []).filter((l) => !fuera(l.user_id)),
    perfiles: (base.perfiles ?? []).filter((p) => !fuera(p.user_id)),
    primera_vez: (base.primera_vez ?? []).filter((p) => !fuera(p.user_id)),
    uso_diario: (base.uso_diario ?? []).filter((u) => !fuera(u.user_id)),
  }
}

/**
 * Lo que leen los servicios del panel: la base ya sin las cuentas que no cuentan (si el interruptor está encendido) y, aparte, quiénes son de prueba (para la etiqueta «Prueba» de la lista).
 * Devuelve la base de siempre con `sin_pruebas`, `ocultas` y `ids_prueba` añadidos.
 */
export async function leerBaseDelPanel(admin, query = {}, env = process.env) {
  const completa = await leerBase(admin)
  const quienes = idsQueNoCuentan(completa, env)
  const sin = sinPruebasDe(query)
  // Las de administrador no cuentan nunca; las de prueba, solo con el interruptor encendido.
  const aQuitar = sin ? quienes.ids : quienes.administrador
  const base = sinCuentas(completa, aQuitar)
  return { ...base, sin_pruebas: sin, ocultas: aQuitar.size, ids_fuera: [...aQuitar], ids_prueba: [...quienes.prueba], ids_admin: [...quienes.administrador], completa }
}
