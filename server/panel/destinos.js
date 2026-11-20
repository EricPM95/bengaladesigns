/**
 * LOS DESTINOS DEL PANEL (V33):
 *   GET  /api/admin/destinos → { ok, pedidos:[{destino, veces}], proximamente:[{destino, avisos, avisados}], correo:{activo} }
 *   POST /api/admin/destinos/ya-disponible { destino } → { ok, campana, correos, ya_avisados, correo:'activo'|'sin_clave', quedan }
 * «Próximamente» sale de data/primera_vez/destinos.json (V31). «Avísame» vive en `avisos_destino` (0028). El [Ya está disponible] avisa UNA sola vez por persona y destino: la campana (si tiene cuenta) y el correo
 * (a su email) quedan marcados en `avisado_campana_en` / `avisado_correo_en` (0090). Sin RESEND_API_KEY solo se avisa por la campana y el correo queda sin marcar, para mandarlo después.
 * Cada vez se mandan como mucho 100 correos (límite de tiempo del servidor); si quedan más, `quedan` lo dice y se vuelve a pulsar.
 */
import { REMITENTE_SOPORTE } from '../correo.js'
import { plantillaDestinoDisponible } from './plantillas.js'
import { limpiar } from '../avisosDestino.js'
import { rpc } from './guardian.js'

export const MAX_CORREOS_POR_VEZ = 100
const n = (v) => Number(v) || 0

export function crearServicioDestinos({ admin, correo, proximamente, env = process.env, consola = console }) {
  return {
    async leer() {
      const lista = proximamente()
      const [pedidos, resumen] = await Promise.all([
        rpc(admin, 'panel_destinos_pedidos', { p_limite: 50 }),
        rpc(admin, 'panel_destinos_resumen', { p_normas: lista.map((d) => limpiar(d.nombre)) }),
      ])
      const porNorma = new Map((resumen ?? []).map((x) => [x.norm, x]))
      return {
        ok: true,
        pedidos: (pedidos ?? []).map((x) => ({ destino: x.destino, veces: n(x.veces) })),
        proximamente: lista.map((d) => ({ destino: d.nombre, avisos: n(porNorma.get(limpiar(d.nombre))?.avisos), avisados: n(porNorma.get(limpiar(d.nombre))?.avisados) })),
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
