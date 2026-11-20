/**
 * [RESPONDER] A UN REPORTE (V33): POST /api/admin/reportes/:id/responder { texto } → { ok, campana, correo }
 *   · campana: se deja un aviso corto en la campana del viajero (solo si el reporte lo mandó una cuenta de verdad: el `user_id` solo se guarda con cuenta y «avísame»).
 *   · correo: 'enviado' | 'sin_cuenta' (no hay cuenta o no hay correo) | 'no_avisame' (la cuenta no pidió que le avisen) | 'sin_clave' (no hay RESEND_API_KEY: no se manda nada) | 'fallo' (Resend no lo mandó).
 * Remitente: Jutrip Soporte <soporte@jutrip.app>. El correo del viajero solo sale de la base hacia Resend: nunca se devuelve al panel.
 */
import { REMITENTE_SOPORTE } from '../correo.js'
import { plantillaRespuesta } from './plantillas.js'
import { rpc } from './guardian.js'

export const MIN_RESPUESTA = 2
export const MAX_RESPUESTA = 300
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const limpiarRespuesta = (v) => String(v ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

export function crearServicioReportes({ admin, correo }) {
  return {
    /** @returns {Promise<{estado:number, cuerpo:object}>} */
    async responder(id, cuerpo) {
      if (!UUID.test(String(id))) return { estado: 404, cuerpo: { ok: false, error: 'Ese reporte no existe.' } }
      const texto = limpiarRespuesta(cuerpo?.texto)
      if (texto.length < MIN_RESPUESTA || texto.length > MAX_RESPUESTA) return { estado: 400, cuerpo: { ok: false, error: `La respuesta tiene que tener entre ${MIN_RESPUESTA} y ${MAX_RESPUESTA} caracteres.` } }
      const r = await rpc(admin, 'panel_reporte_responder', { p_id: id, p_texto: texto })
      if (!r?.encontrado) return { estado: 404, cuerpo: { ok: false, error: 'Ese reporte no existe.' } }
      let resultado
      if (!r.con_cuenta || !r.email) resultado = 'sin_cuenta'
      else if (r.avisame !== true) resultado = 'no_avisame'
      else if (!correo?.activo) resultado = 'sin_clave'
      else {
        const { asunto, html, texto: plano } = plantillaRespuesta(texto)
        const e = await correo.enviar({ de: REMITENTE_SOPORTE, para: r.email, asunto, html, texto: plano })
        resultado = e.enviado ? 'enviado' : e.motivo === 'sin_clave' ? 'sin_clave' : 'fallo'
      }
      return { estado: 200, cuerpo: { ok: true, campana: r.campana === true, correo: resultado } }
    },
  }
}
