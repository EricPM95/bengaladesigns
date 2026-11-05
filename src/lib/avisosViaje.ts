import { llamar } from './logros'

/**
 * HOY3: [Enviarme un aviso de prueba] (Ajustes, SOLO el administrador; lo decide el servidor). Manda un aviso de verdad al móvil de quien lo pide, para comprobar hoy mismo que los avisos del viaje llegan
 * con el móvil bloqueado. Devuelve la frase que se enseña debajo del botón.
 */
export interface RespuestaDePrueba {
  ok?: boolean
  enviados?: number
  motivo?: string
}

/** Pura: la frase de lo que ha pasado. */
export function textoDeLaPrueba(r: RespuestaDePrueba | null): string {
  if (!r) return 'No se ha podido mandar el aviso. Vuelve a probar en un momento.'
  if (r.ok) return 'Te lo hemos mandado. Bloquea el móvil: te tiene que llegar en unos segundos.'
  switch (r.motivo) {
    case 'sin_suscripcion':
      return 'Este móvil no tiene los avisos encendidos. Enciende «Avisos en el móvil» y vuelve a probar.'
    case 'apagado':
      return 'Los avisos del móvil están apagados en el servidor (falta PUSH_ACTIVO=true).'
    case 'faltan_claves_vapid':
      return 'Faltan las claves de los avisos en el servidor (VAPID).'
    case 'falta_el_paquete_web_push':
      return 'Falta el paquete de los avisos en el servidor (web-push).'
    case 'no_ha_llegado':
      return 'El servidor ha mandado el aviso pero el móvil no lo ha recibido. Apaga y vuelve a encender «Avisos en el móvil».'
    default:
      return 'No se ha podido mandar el aviso. Vuelve a probar en un momento.'
  }
}

export async function enviarAvisoDePrueba(): Promise<string> {
  return textoDeLaPrueba(await llamar<RespuestaDePrueba>('/api/admin/avisos-viaje/prueba', { metodo: 'POST', cuerpo: { prueba: true } }))
}
