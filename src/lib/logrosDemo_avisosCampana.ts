/**
 * Solo desarrollo (modo demo de los logros, ?logrosDemo=1): la campana con una RESPUESTA de ejemplo y un «ya está arreglado» de ejemplo (V35B). Solo si se pide con `?avisosDemo=respuesta`
 * (se recuerda en la pestaña; `?avisosDemo=0` lo apaga): sin pedirlo, no contesta nada y la campana se queda como antes.
 */
const hace = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

function encendido(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('avisosDemo')
    if (q === 'respuesta') window.sessionStorage.setItem('trazo:avisosDemo', 'respuesta')
    if (q === '0') window.sessionStorage.removeItem('trazo:avisosDemo')
    return q === 'respuesta' || (q !== '0' && window.sessionStorage.getItem('trazo:avisosDemo') === 'respuesta')
  } catch {
    return false
  }
}

const REPORTE = { titulo: 'Coliseo · Horario', texto: 'Ahora cierra a las 18:00' }
const AVISOS = () => [
  { id: 'demo-respuesta', tipo: 'gracias_viajero', texto: 'Te hemos respondido', franja: { titulo: 'Te hemos respondido', detalle: 'Tienes razón: el Coliseo cierra a las 18:00 en invierno y ya lo hemos corregido…', icono: 'estrella' }, quien: null, creado_en: hace(8), leido: false, payload: { texto: 'Tienes razón: el Coliseo cierra a las 18:00 en invierno y ya lo hemos corregido. Gracias por avisarnos.', tipo: 'dato_mal', aviso_id: 'demo-reporte', es_respuesta: true, reporte: REPORTE }, detalle: 'Tienes razón: el Coliseo cierra a las 18:00 en invierno y ya lo hemos corregido…', etiqueta: null },
  { id: 'demo-arreglado', tipo: 'gracias_viajero', texto: 'Gracias a ti, ya está arreglado: Coliseo.', franja: { titulo: 'Gracias a ti, ya está arreglado: Coliseo.', detalle: '', icono: 'estrella' }, quien: null, creado_en: hace(200), leido: false, payload: { texto: 'Gracias a ti, ya está arreglado: Coliseo.', tipo: 'dato_mal', aviso_id: 'demo-reporte', reporte: REPORTE }, detalle: null, etiqueta: null },
]

export function responder(ruta: string): unknown {
  if (ruta === '/api/avisos' && encendido()) {
    const avisos = AVISOS()
    return { ok: true, avisos, sin_leer: avisos.length }
  }
  return undefined
}
