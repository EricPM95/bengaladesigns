/** Los textos de los correos del panel (V33), en español sencillo y con la marca. Funciones puras: devuelven { asunto, html, texto }. Todo lo que viene de fuera se escapa. */

export const escapar = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const marco = (titulo, cuerpoHtml) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2933">` +
  `<p style="font-size:20px;font-weight:700;letter-spacing:1px;margin:0 0 16px">JUTRIP</p>` +
  `<p style="font-size:16px;font-weight:700;margin:0 0 12px">${escapar(titulo)}</p>${cuerpoHtml}` +
  `<p style="font-size:12px;color:#6b7280;margin:24px 0 0">Jutrip Soporte · soporte@jutrip.app</p></div>`

/** La respuesta a un reporte (va a quien lo mandó y pidió que le avisen). */
export function plantillaRespuesta(texto) {
  return {
    asunto: 'Jutrip: te respondemos',
    html: marco('Gracias por escribirnos', `<p style="font-size:15px;line-height:1.5;margin:0 0 12px">${escapar(texto)}</p><p style="font-size:14px;margin:0">Un abrazo del equipo de Jutrip.</p>`),
    texto: `JUTRIP\n\nGracias por escribirnos.\n\n${texto}\n\nUn abrazo del equipo de Jutrip.\nJutrip Soporte · soporte@jutrip.app`,
  }
}

/** «Ya está disponible»: a quien pidió que le avisaran de un destino. */
export function plantillaDestinoDisponible(destino, enlace) {
  const url = enlace ? String(enlace) : 'https://jutrip.app'
  return {
    asunto: `Jutrip: ${destino} ya está disponible`,
    html: marco(`${destino} ya está en Jutrip`, `<p style="font-size:15px;line-height:1.5;margin:0 0 16px">Tú nos lo pediste: ya puedes planear tu viaje a ${escapar(destino)}.</p><p style="margin:0"><a href="${escapar(url)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:15px">Crear mi viaje</a></p>`),
    texto: `JUTRIP\n\n${destino} ya está en Jutrip. Tú nos lo pediste: ya puedes planear tu viaje.\n\n${url}\n\nJutrip Soporte · soporte@jutrip.app`,
  }
}

const ETIQUETA = { restaurante: 'Restaurante', lugar: 'Lugar', destino: 'Destino pedido', foto: 'Foto', dato_mal: 'Dato mal', consejo: 'Consejo', no_funciona: 'No funciona', idea: 'Idea' }

/**
 * El aviso interno a soporte@: uno o varios reportes juntos. NUNCA lleva el correo de quien los mandó (ni en el asunto ni en el cuerpo: la base ni lo da).
 * @param {Array<{id, tipo, destino, texto}>} reportes
 */
export function plantillaAvisoInterno(reportes, appUrl) {
  const base = String(appUrl || 'https://jutrip.app').replace(/\/+$/, '')
  const n = reportes.length
  const enlace = (r) => `${base}/admin?reporte=${encodeURIComponent(r.id)}`
  const asunto = n === 1 ? `Reporte nuevo en el panel: ${ETIQUETA[reportes[0].tipo] ?? 'Aviso'}` : `${n} reportes nuevos en el panel`
  const trozos = reportes.map((r) => ({ cabecera: `${ETIQUETA[r.tipo] ?? 'Aviso'}${r.destino ? ` · ${r.destino}` : ''}`, texto: String(r.texto ?? '').slice(0, 600), enlace: enlace(r) }))
  const html = marco(
    n === 1 ? 'Ha llegado un reporte' : `Han llegado ${n} reportes`,
    trozos.map((t) => `<div style="border-left:3px solid #0f766e;padding:2px 0 2px 12px;margin:0 0 14px"><p style="margin:0 0 4px;font-weight:700;font-size:14px">${escapar(t.cabecera)}</p><p style="margin:0 0 6px;font-size:14px;line-height:1.4">${escapar(t.texto)}</p><a href="${escapar(t.enlace)}" style="font-size:14px;color:#0f766e">Abrir en el panel</a></div>`).join(''),
  )
  const texto = `JUTRIP\n\n${n === 1 ? 'Ha llegado un reporte' : `Han llegado ${n} reportes`}:\n\n${trozos.map((t) => `${t.cabecera}\n${t.texto}\n${t.enlace}`).join('\n\n')}\n`
  return { asunto, html, texto }
}
