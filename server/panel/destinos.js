/**
 * LOS DESTINOS DEL PANEL (V33):
 *   GET  /api/admin/destinos → { ok, pedidos:[{destino, veces}], proximamente:[{destino, avisos, avisados}], correo:{activo} }
 *   POST /api/admin/destinos/ya-disponible { destino } → { ok, campana, correos, ya_avisados, correo:'activo'|'sin_clave', quedan }
 * «Próximamente» sale de data/primera_vez/destinos.json (V31). «Avísame» vive en `avisos_destino` (0028). El [Ya está disponible] avisa UNA sola vez por persona y destino: la campana (si tiene cuenta) y el correo
 * (a su email) quedan marcados en `avisado_campana_en` / `avisado_correo_en` (0090). Sin RESEND_API_KEY solo se avisa por la campana y el correo queda sin marcar, para mandarlo después.
 * Cada vez se mandan como mucho 100 correos (límite de tiempo del servidor); si quedan más, `quedan` lo dice y se vuelve a pulsar.
 */
import fs from 'node:fs'
import { REMITENTE_SOPORTE } from '../correo.js'
import { plantillaDestinoDisponible } from './plantillas.js'
import { limpiar } from '../avisosDestino.js'
import { rpc } from './guardian.js'
import { enRango, leerPeriodo, rangoDePeriodo } from './periodo.js'

export const MAX_CORREOS_POR_VEZ = 100
const n = (v) => Number(v) || 0

/** Los destinos que ya están abiertos en el lanzamiento (data/primera_vez/destinos.json › salida). */
const leerLanzados = () => {
  try {
    return JSON.parse(fs.readFileSync(new URL('../../data/primera_vez/destinos.json', import.meta.url), 'utf8')).salida ?? []
  } catch {
    return []
  }
}

export function crearServicioDestinos({ admin, correo, proximamente, lanzados = leerLanzados, env = process.env, consola = console, ahora = () => new Date() }) {
  return {
    /**
     * (V35A) Los destinos que pide la gente en el periodo elegido (de «Añadir un destino» de Cuéntanos y de [Avísame]), de más a menos, y los «Próximamente» con cuánta gente espera. SIN funciones SQL nuevas: lee las tablas.
     * «Pasar a Próximamente», «Quitar» y «Añadir un destino» (que guardan los Próximamente en la base de datos) llegan en la V35B.
     */
    async leer(query = {}) {
      const rango = rangoDePeriodo(leerPeriodo(query), new Date(ahora()))
      const lista = proximamente()
      const [{ data: avisosDestino }, { data: pedidosCuentanos }] = await Promise.all([
        admin.from('avisos_destino').select('destino,destino_norm,creado_en,avisado_campana_en,avisado_correo_en').limit(20000),
        admin.from('avisos_de_viajeros').select('datos,creado,avisame,user_id,estado').eq('tipo', 'destino').neq('estado', 'descartado').limit(20000),
      ])
      const grupos = new Map()
      const grupo = (nombre) => {
        const k = limpiar(nombre)
        if (!k) return null
        if (!grupos.has(k)) grupos.set(k, { norma: k, nombres: new Map(), veces: 0, quieren: 0, avisados: 0, ultimo_aviso: null })
        return grupos.get(k)
      }
      const apuntar = (g, nombre) => g.nombres.set(nombre, (g.nombres.get(nombre) ?? 0) + 1)
      // Los totales de quien espera un Próximamente cuentan de siempre (no del periodo); los «pedidos» sí son del periodo.
      const esperando = new Map()
      for (const a of avisosDestino ?? []) {
        const k = a.destino_norm || limpiar(a.destino)
        const e = esperando.get(k) ?? { avisos: 0, avisados: 0 }
        e.avisos += 1
        if (a.avisado_campana_en || a.avisado_correo_en) e.avisados += 1
        esperando.set(k, e)
        if (!enRango(a.creado_en, rango)) continue
        const g = grupo(a.destino)
        if (!g) continue
        apuntar(g, String(a.destino).trim())
        g.veces += 1
        g.quieren += 1
        if (a.avisado_campana_en || a.avisado_correo_en) {
          g.avisados += 1
          const t = a.avisado_campana_en ?? a.avisado_correo_en
          if (!g.ultimo_aviso || String(t) > String(g.ultimo_aviso)) g.ultimo_aviso = t
        }
      }
      for (const a of pedidosCuentanos ?? []) {
        if (!enRango(a.creado, rango)) continue
        const nombre = String(a.datos?.destino ?? '').replace(/s+/g, ' ').trim()
        const g = grupo(nombre)
        if (!g) continue
        apuntar(g, nombre)
        g.veces += 1
        if (a.avisame && a.user_id) g.quieren += 1
      }
      const normasProximamente = new Set(lista.map((d) => limpiar(d.nombre)))
      const normasLanzadas = new Set(lanzados().map((d) => limpiar(d.nombre)))
      const pedidos = [...grupos.values()]
        .map((g) => ({
          destino: [...g.nombres.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? g.norma,
          veces: g.veces,
          quieren_aviso: g.quieren,
          avisados: g.avisados,
          ultimo_aviso: g.ultimo_aviso,
          proximamente: normasProximamente.has(g.norma),
          lanzado: normasLanzadas.has(g.norma),
        }))
        .sort((x, y) => y.veces - x.veces || String(x.destino).localeCompare(String(y.destino)))
        .slice(0, 50)
      return {
        ok: true,
        periodo: { periodo: rango.periodo, desde: rango.desde, hasta: rango.hasta, etiqueta: rango.etiqueta, titulo: rango.titulo },
        pedidos,
        proximamente: lista.map((d) => ({ destino: d.nombre, iso: d.iso ?? null, avisos: n(esperando.get(limpiar(d.nombre))?.avisos), avisados: n(esperando.get(limpiar(d.nombre))?.avisados) })),
        correo: { activo: Boolean(correo?.activo) },
      }
    },
    async yaDisponible(cuerpo) {
      const destino = String(cuerpo?.destino ?? '').replace(/\s+/g, ' ').trim()
      if (destino.length < 2 || destino.length > 80) return { estado: 400, cuerpo: { ok: false, error: 'Falta el destino.' } }
      const activo = Boolean(correo?.activo)
      const texto = `¡${destino} ya está en JUTRIP! Tú lo pediste.`
      const r = (await rpc(admin, 'panel_destino_ya_disponible', { p_norm: limpiar(destino), p_texto: texto, p_correo: activo, p_max: MAX_CORREOS_POR_VEZ })) ?? {}
      let enviados = 0
      const fallidos = []
      if (activo) {
        const enlace = env.APP_URL ? String(env.APP_URL).replace(/\/+$/, '') : null
        const { asunto, html, texto: plano } = plantillaDestinoDisponible(destino, enlace)
        for (const c of r.correos ?? []) {
          const e = await correo.enviar({ de: REMITENTE_SOPORTE, para: c.email, asunto, html, texto: plano })
          if (e.enviado) enviados++
          else fallidos.push(c.id)
        }
        if (fallidos.length > 0) {
          try {
            await rpc(admin, 'panel_destino_correo_devolver', { p_ids: fallidos })
          } catch (e) {
            consola.error('[panel/destinos]', e?.message ?? e)
          }
        }
      }
      return { estado: 200, cuerpo: { ok: true, campana: n(r.campana), correos: enviados, ya_avisados: n(r.ya_avisados), correo: activo ? 'activo' : 'sin_clave', quedan: n(r.quedan) + fallidos.length } }
    },
  }
}
