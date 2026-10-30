/**
 * (10S5) Manda al servidor el sitio que propone el viajero (POST /api/proponer-sitio, server/propuestasSitio.js → tabla `propuestas_de_sitio`, migración 0069).
 * SIN DATOS PRIVADOS: solo el nombre, el comentario, el destino del viaje y desde qué pantalla; ni quién es, ni su correo, ni su viaje. La fecha la pone el servidor.
 */
export interface PropuestaDeSitio {
  nombre: string
  comentario: string
  destino: string
  origen: string
}

export const MIN_NOMBRE_SITIO = 2

/** Pura: ¿se puede enviar? (el nombre, con al menos 2 letras). */
export function propuestaValida(nombre: string): boolean {
  return nombre.trim().length >= MIN_NOMBRE_SITIO
}

/** Manda la propuesta. Devuelve true si el servidor la ha recibido; nunca lanza. */
export async function enviarPropuestaDeSitio(propuesta: PropuestaDeSitio): Promise<boolean> {
  try {
    const respuesta = await fetch('/api/proponer-sitio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: propuesta.nombre.trim(), comentario: propuesta.comentario.trim(), destino: propuesta.destino.trim(), origen: propuesta.origen }),
    })
    return respuesta.ok
  } catch {
    return false
  }
}
