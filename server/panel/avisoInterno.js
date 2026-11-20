/**
 * EL AVISO INTERNO A SOPORTE@ (V33): cuando entran reportes nuevos, un correo a soporte@jutrip.app con el tipo, el destino, el texto y un enlace al panel (`${APP_URL}/admin?reporte=<id>`).
 * NUNCA lleva el correo de quien lo mandó. Como mucho UN correo cada 15 minutos: los reportes que llegan en ese rato se juntan en el siguiente.
 *
 * El servidor es «serverless» (la memoria no vale), así que todo se apoya en la base: `avisos_de_viajeros.notificado_en` (migración 0090). `panel_reportes_a_notificar` junta y marca (con candado) los
 * reportes sin avisar, y solo si han pasado 15 minutos desde el último correo; si el envío falla, `panel_reportes_desmarcar` los deja libres. Sin RESEND_API_KEY no hace nada (ni marca nada).
 *
 * Se intenta: (a) al entrar un reporte (server/avisosViajeros.js), (b) en GET /api/admin/inicio y (c) en la tarea programada /api/cron/avisos (server/avisos.js).
 */
import { REMITENTE_AUTOMATICO, CORREO_SOPORTE } from '../correo.js'
import { plantillaAvisoInterno } from './plantillas.js'
import { rpc } from './guardian.js'

export const MINUTOS_ENTRE_CORREOS = 15

export function crearAvisoInterno({ admin, correo, env = process.env, ahora = () => new Date(), consola = console }) {
  return {
    /** @returns {Promise<{enviado:number, motivo?:string}>} Nunca lanza. */
    async intentar() {
      try {
        if (!admin || !correo?.activo) return { enviado: 0, motivo: 'sin_clave' }
        const reportes = await rpc(admin, 'panel_reportes_a_notificar', { p_ahora: new Date(ahora()).toISOString(), p_minutos: MINUTOS_ENTRE_CORREOS })
        if (!Array.isArray(reportes) || reportes.length === 0) return { enviado: 0, motivo: 'nada_o_pronto' }
        const { asunto, html, texto } = plantillaAvisoInterno(reportes, env.APP_URL)
        const r = await correo.enviar({ de: REMITENTE_AUTOMATICO, para: CORREO_SOPORTE, asunto, html, texto })
        if (!r.enviado) {
          await rpc(admin, 'panel_reportes_desmarcar', { p_ids: reportes.map((x) => x.id) })
          return { enviado: 0, motivo: r.motivo ?? 'fallo' }
        }
        return { enviado: reportes.length }
      } catch (e) {
        try {
          consola.error('[panel/aviso-interno]', e?.message ?? e)
        } catch {
          /* nada más que hacer */
        }
        return { enviado: 0, motivo: 'fallo' }
      }
    },
  }
}
