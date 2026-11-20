/**
 * LOS USUARIOS DEL PANEL (V33): la lista paginada (50 en 50), los totales con las respuestas de la primera vez y la ficha de una persona. Todo se calcula en la base (`panel_usuarios`, `panel_usuarios_totales`,
 * `panel_ficha`, migración 0090): aquí solo se limpian los filtros y se da forma al contrato. El nivel sale de la EXP guardada (`logro_perfil.exp_max`) con la tabla de data/logros/exp.json.
 */
import { rpc, hoyEnPanel } from './guardian.js'
import { nivelDeExp } from '../logros/exp.js'

export const POR_PAGINA = 50
export const ORDENES = ['viajes', 'gastado', 'reciente', 'acceso']
export const FRECUENCIAS = ['una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas']
export const COMPANIAS = ['a_mi_aire', 'pareja', 'familia', 'amigos']
const TRAMOS = [['menos_18', 'Menos de 18'], ['18_29', '18 – 29'], ['30_44', '30 – 44'], ['45_59', '45 – 59'], ['60_mas', '60 o más']]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const n = (v) => Number(v) || 0
const iso = (v) => (v ? new Date(v).toISOString() : null)
const pct = (x, total) => (total > 0 ? Math.round((x / total) * 1000) / 10 : 0)

/** Texto de búsqueda: recortado a 80 y sin caracteres de control. (Los comodines no hacen nada: la base busca con `strpos`.) */
export const limpiarBusqueda = (v) => String(v ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)

export function leerFiltros(query = {}) {
  const pagina = Math.max(1, Math.min(Number.parseInt(String(query.pagina ?? ''), 10) || 1, 100000))
  return {
    q: limpiarBusqueda(query.q),
    pase: ['si', 'no'].includes(query.pase) ? query.pase : '',
    destino: limpiarBusqueda(query.destino),
    frecuencia: FRECUENCIAS.includes(query.frecuencia) ? query.frecuencia : '',
    compania: COMPANIAS.includes(query.compania) ? query.compania : '',
    orden: ORDENES.includes(query.orden) ? query.orden : 'reciente',
    pagina,
  }
}

export function crearServicioUsuarios({ admin, datos, ahora = () => new Date() }) {
  const dar = (f) => {
    const p = f.primera_vez
    return {
      id: f.id,
      nombre: f.nombre ?? (f.email ? String(f.email).split('@')[0] : ''),
      email: f.email ?? '',
      alta: iso(f.alta),
      ultimo_acceso: iso(f.ultimo_acceso),
      nivel: nivelDeExp(n(f.exp), datos().exp).nivel,
      exp: n(f.exp),
      pase: { tiene: f.tiene_pase === true, destinos: (f.destinos_pase ?? []).map((d) => ({ destino: d.destino, tipo: d.tipo })) },
      viajes: { creados: n(f.viajes_creados), hechos: n(f.viajes_hechos) },
      gastado_cent: n(f.gastado_cent),
      moneda: f.moneda ?? 'eur',
      primera_vez: p ? { frecuencia: p.frecuencia ?? null, compania: p.compania ?? null, anio_nacimiento: p.anio_nacimiento ?? null } : null,
    }
  }
  const hoy = () => hoyEnPanel(new Date(ahora()))
  return {
    async listar(query) {
      const f = leerFiltros(query)
      const r = await rpc(admin, 'panel_usuarios', {
        p_q: f.q, p_pase: f.pase, p_destino: f.destino, p_frecuencia: f.frecuencia, p_compania: f.compania, p_orden: f.orden,
        p_pagina: f.pagina, p_por_pagina: POR_PAGINA, p_hoy: hoy(), p_id: null,
      })
      return { ok: true, pagina: f.pagina, por_pagina: POR_PAGINA, total: n(r?.total), usuarios: (r?.usuarios ?? []).map(dar) }
    },
    async totales() {
      const c = (await rpc(admin, 'panel_usuarios_totales', { p_ahora: new Date(ahora()).toISOString() })) ?? {}
      const grupo = (claves, objeto) => {
        const total = claves.reduce((s, k) => s + n(objeto?.[k]), 0)
        return claves.map((k) => ({ valor: k, n: n(objeto?.[k]), pct: pct(n(objeto?.[k]), total) }))
      }
      const edadTotal = TRAMOS.reduce((s, [k]) => s + n(c.edad?.[k]), 0)
      return {
        ok: true,
        total: n(c.total),
        con_viaje: n(c.con_viaje),
        nuevos_semana: n(c.nuevos_semana),
        contestaron: n(c.contestaron),
        respuestas: {
          frecuencia: grupo(FRECUENCIAS, c.frecuencia),
          compania: grupo(COMPANIAS, c.compania),
          edad: TRAMOS.map(([k, tramo]) => ({ tramo, n: n(c.edad?.[k]), pct: pct(n(c.edad?.[k]), edadTotal) })),
        },
      }
    },
    /** La ficha, o null si el id no es válido o no existe. */
    async ficha(id) {
      if (!UUID.test(String(id))) return null
      const fila = (await rpc(admin, 'panel_usuarios', { p_q: '', p_pase: '', p_destino: '', p_frecuencia: '', p_compania: '', p_orden: 'reciente', p_pagina: 1, p_por_pagina: 1, p_hoy: hoy(), p_id: id }))?.usuarios?.[0]
      if (!fila) return null
      const c = (await rpc(admin, 'panel_ficha', { p_id: id, p_hoy: hoy() })) ?? {}
      const d = datos()
      const nombreDestino = (clave) => d.destinos?.[clave]?.ciudad ?? d.destinos?.[clave]?.destino ?? clave
      const sello = (destino, escalon) => {
        const [id2, grado] = String(escalon).split(':')
        const def = d.destinos?.[destino]?.sellos?.find((s) => s.id === id2)
        return { destino: nombreDestino(destino), nombre: def?.nombre ?? id2, grado: grado ?? '' }
      }
      const totalColecciones = Object.values(d.destinos ?? {}).reduce((s, x) => s + (x.colecciones?.length ?? 0), 0)
      const hoyTexto = hoy()
      return {
        ok: true,
        usuario: dar(fila),
        viajes: (c.viajes ?? []).map((v) => ({ destino: v.destino ?? '', inicio: v.inicio ?? null, fin: v.fin ?? null, grupo: n(v.miembros) > 1 ? 'grupo' : 'solo', miembros: n(v.miembros) || 1, hecho: Boolean(v.fin) && String(v.fin) < hoyTexto })),
        pases: (c.pases ?? []).map((p) => ({ fecha: iso(p.fecha), destino: p.destino, tipo: p.tipo, importe_cent: n(p.importe_cent), moneda: p.moneda ?? 'eur', estado: p.estado ?? 'activo' })),
        logros: {
          sellos: (c.sellos ?? []).map((s) => sello(s.destino, s.escalon)),
          colecciones: { hechas: n(c.colecciones_hechas), total: totalColecciones },
          paises: (c.paises ?? []).map(String),
          destinos: (c.destinos ?? []).map((x) => nombreDestino(String(x))),
        },
        reportes: (c.reportes ?? []).map((r) => ({ id: r.id, tipo: r.tipo, titulo: r.titulo, estado: r.estado, en: iso(r.en) })),
      }
    },
  }
}
