/**
 * EL CORREO (V33): una sola puerta para mandar correos con Resend (https://resend.com). La clave sale de `RESEND_API_KEY` (la pone Eric en Vercel); aquí no se escribe ni se enseña nunca.
 *
 *   const correo = crearCorreo({ apiKey: process.env.RESEND_API_KEY })
 *   correo.activo                                   → true si hay clave
 *   await correo.enviar({ de, para, asunto, html, texto })  → { enviado: true, id } | { enviado: false, motivo: 'sin_clave' | 'datos' | 'fallo' }
 *
 * Sin clave no hace nada y no falla. Nunca lanza: si Resend no responde o dice que no, devuelve `motivo: 'fallo'` (el motivo exacto no se copia a ningún sitio con la clave dentro).
 * `fetchFn` se puede cambiar (las pruebas ponen uno de mentira: ningún correo real).
 */

export const REMITENTE_SOPORTE = 'Jutrip Soporte <soporte@jutrip.app>'
export const REMITENTE_AUTOMATICO = 'Jutrip <no-reply@jutrip.app>'
export const CORREO_SOPORTE = 'soporte@jutrip.app'
const URL_RESEND = 'https://api.resend.com/emails'
const CORREO_VALIDO = /^[^\s@<>]+@[^\s@.<>]+(\.[^\s@.<>]+)+$/

export function crearCorreo({ apiKey = null, fetchFn = globalThis.fetch } = {}) {
  const clave = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : null
  return {
    activo: Boolean(clave),
    async enviar({ de, para, asunto, html, texto } = {}) {
      if (!clave) return { enviado: false, motivo: 'sin_clave' }
      const destinatarios = (Array.isArray(para) ? para : [para]).map((x) => String(x ?? '').trim())
      if (!de || !asunto || destinatarios.length === 0 || !destinatarios.every((x) => CORREO_VALIDO.test(x)) || (!html && !texto)) return { enviado: false, motivo: 'datos' }
      try {
        const r = await fetchFn(URL_RESEND, {
          method: 'POST',
          headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: de, to: destinatarios, subject: asunto, ...(html ? { html } : {}), ...(texto ? { text: texto } : {}) }),
        })
        if (!r || !r.ok) return { enviado: false, motivo: 'fallo' }
        const cuerpo = await r.json().catch(() => ({}))
        return { enviado: true, id: typeof cuerpo?.id === 'string' ? cuerpo.id : null }
      } catch {
        return { enviado: false, motivo: 'fallo' }
      }
    },
  }
}
