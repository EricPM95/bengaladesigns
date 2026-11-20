/**
 * (V35A) LO COMÚN DEL PANEL: a partir de la base (`base.js`), las cosas que usan a la vez Inicio, Ventas y Usuarios, calculadas UNA sola vez y siempre igual para que las cifras cuadren entre pantallas:
 *   · `nombreDe`: el nombre de una persona (su nombre, o la parte del correo antes de la @);
 *   · `viajesDe`: sus viajes, PROPIOS y COMPARTIDOS (a los que se ha unido: Alice cuenta el de Eric), cada uno con quién lo creó;
 *   · `pasesDe`: sus pases, con su origen: «Comprado», «Regalado» (sin cobro) o «Compartido» (de otra persona: «Lanzarote · Dúo (de Eric)»), y lo que pagó de verdad;
 *   · `gastadoDe`: la suma de lo que pagó (exactamente la de sus pases comprados: la ficha y la lista nunca se contradicen).
 * Un cobro del registro (`pagos_registro`) solo se atribuye a una persona a través de su pase (`passes.pago_ref`): si el pase ya no existe (por ejemplo, se borró con «Empezar de cero») el cobro cuenta en Ventas pero no tiene
 * dueño. Pura: sin base de datos (la prueba la usa).
 */
const n = (v) => Number(v) || 0

export const PLANES = { uno: 'Individual', duo: 'Dúo', grupo: 'Grupo' }
export const nombreDePlan = (t) => PLANES[String(t ?? '').toLowerCase()] ?? (t ? String(t).charAt(0).toUpperCase() + String(t).slice(1) : '—')

/** Un cobro real (de Stripe, no el de la pasarela de mentira de desarrollo). */
export const esCobroReal = (p) => p && p.proveedor !== 'mentira'

export function indiceDe(base) {
  const usuarios = new Map((base.usuarios ?? []).map((u) => [u.id, u]))
  const nombres = new Map((base.travelers ?? []).map((t) => [t.id, t.nombre]))
  const pagos = new Map((base.pagos ?? []).map((p) => [p.pago_ref, p]))
  const pases = new Map((base.pases ?? []).map((p) => [p.id, p]))
  const viajes = new Map((base.trips ?? []).map((t) => [t.id, t]))
  const miembrosDeViaje = new Map()
  for (const m of base.miembros ?? []) {
    if (!miembrosDeViaje.has(m.trip_id)) miembrosDeViaje.set(m.trip_id, [])
    miembrosDeViaje.get(m.trip_id).push(m)
  }
  const miembrosDePase = new Map()
  for (const m of base.miembros_pase ?? []) {
    if (!miembrosDePase.has(m.pass_id)) miembrosDePase.set(m.pass_id, [])
    miembrosDePase.get(m.pass_id).push(m)
  }
  return { usuarios, nombres, pagos, pases, viajes, miembrosDeViaje, miembrosDePase }
}

export function nombreDe(ix, id) {
  const propio = String(ix.nombres.get(id) ?? '').trim()
  if (propio) return propio
  const email = ix.usuarios.get(id)?.email
  return email ? String(email).split('@')[0] : 'Sin nombre'
}

const esAnterior = (fin, hoy) => Boolean(fin) && String(fin) < hoy

/** Sus viajes: los suyos y los compartidos. `hecho` = su último día ya pasó (hoy = «AAAA-MM-DD» de Madrid). */
export function viajesDe(ix, base, uid, hoy) {
  const salida = []
  const vistos = new Set()
  for (const t of base.trips ?? []) {
    if (t.traveler_id !== uid) continue
    vistos.add(t.id)
    const personas = 1 + (ix.miembrosDeViaje.get(t.id)?.length ?? 0)
    salida.push({ id: t.id, destino: t.destino ?? '', inicio: t.inicio ?? null, fin: t.fin ?? null, origen: t.origen ?? null, hecho: esAnterior(t.fin, hoy), suyo: true, de: null, de_id: null, personas })
  }
  for (const m of base.miembros ?? []) {
    if (m.user_id !== uid || vistos.has(m.trip_id)) continue
    const t = ix.viajes.get(m.trip_id)
    if (!t) continue
    vistos.add(t.id)
    const personas = 1 + (ix.miembrosDeViaje.get(t.id)?.length ?? 0)
    salida.push({ id: t.id, destino: t.destino ?? '', inicio: t.inicio ?? null, fin: t.fin ?? null, origen: t.origen ?? null, hecho: esAnterior(t.fin, hoy), suyo: false, de: nombreDe(ix, t.traveler_id), de_id: t.traveler_id, personas })
  }
  return salida.sort((a, b) => String(a.inicio ?? '9999').localeCompare(String(b.inicio ?? '9999')))
}

/** Sus pases (los activos), con lo que pagó de verdad en cada uno. */
export function pasesDe(ix, base, uid) {
  const salida = []
  const vistos = new Set()
  const unoSuyo = (p, origen, de) => {
    const cobro = p.pago_ref ? ix.pagos.get(p.pago_ref) : null
    const pagado = origen === 'comprado' && cobro && esCobroReal(cobro) && cobro.estado === 'pagado'
    salida.push({
      id: p.id,
      destino: p.destino,
      tipo: p.tipo,
      origen,
      de: de?.nombre ?? null,
      de_id: de?.id ?? null,
      fecha: origen === 'compartido' ? null : (cobro?.creado_en ?? p.created_at ?? null),
      importe_cent: pagado ? n(cobro.importe_cent) : 0,
      moneda: cobro?.moneda ?? 'eur',
      reembolsado: Boolean(cobro && cobro.estado === 'devuelto'),
      personas: cobro ? n(cobro.personas) || null : null,
    })
  }
  for (const p of base.pases ?? []) {
    if (p.estado !== 'activo' || p.comprador_id !== uid) continue
    vistos.add(p.id)
    unoSuyo(p, p.pago_ref ? 'comprado' : 'regalado', null)
  }
  for (const p of base.pases ?? []) {
    if (p.estado !== 'activo' || vistos.has(p.id) || p.comprador_id === uid) continue
    const lePertenece = p.para_id === uid || (ix.miembrosDePase.get(p.id) ?? []).some((m) => m.user_id === uid)
    if (!lePertenece) continue
    vistos.add(p.id)
    unoSuyo(p, 'compartido', { nombre: nombreDe(ix, p.comprador_id), id: p.comprador_id })
  }
  return salida
}

/** La etiqueta de un pase: «Roma · Dúo», «Barcelona · Regalado», «Lanzarote · Dúo (de Eric)». */
export function etiquetaDePase(p) {
  const base = `${p.destino} · ${nombreDePlan(p.tipo)}`
  if (p.origen === 'regalado') return `${p.destino} · Regalado`
  if (p.origen === 'compartido') return `${base} (de ${p.de ?? '—'})`
  return base
}

export const gastadoDe = (pases) => pases.reduce((s, p) => s + n(p.importe_cent), 0)

/** El nombre de un destino como lo escribe el panel («lanzarote» → «Lanzarote»), para agrupar sin duplicar. */
export const clavePanel = (d) => String(d ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
