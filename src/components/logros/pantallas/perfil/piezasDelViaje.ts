import { llamar } from '../../../../lib/logros'
import type { PiezaReciente } from './api'

/** Lo que dice `GET /api/logros/resumen?trip_id=`: lo ganado en las fechas del viaje (solo lo que hace falta aquí). */
interface RespuestaDeResumen {
  ok: boolean
  ganado: { clave: string; logro: string; escalon: string; destino: string; en: string }[]
}

export async function pedirGanadoDelViaje(tripId: string): Promise<RespuestaDeResumen['ganado'] | null> {
  const r = await llamar<RespuestaDeResumen>(`/api/logros/resumen?trip_id=${encodeURIComponent(tripId)}`)
  return r?.ok ? r.ganado : null
}

const GRADOS = ['bronce', 'plata', 'oro', 'diamante']
/** Los emblemas cuyo dibujo lleva una hora: no salen. */
const CON_HORA = new Set(['madrugador', 'nocturno'])

/**
 * De lo ganado en un viaje, lo que se DIBUJA en «Lo que ganaste en este viaje» (TR): sellos (uno por ciudad, el grado más alto), colecciones, emblemas ya encontrados y logros de viajero
 * (uno por logro, el escalón más alto). Lo demás (países, destinos nuevos, pedazos…) cuenta pero no se dibuja aquí. Pura: se prueba en `scripts/destino/pruebas8c/perfil.mjs`.
 */
export function piezasDelViaje(ganado: { clave: string; logro: string; escalon: string; destino: string }[]): PiezaReciente[] {
  const mejor = new Map<string, PiezaReciente>()
  const orden: string[] = []
  const poner = (id: string, p: PiezaReciente, mayor: (a: PiezaReciente, b: PiezaReciente) => boolean) => {
    const actual = mejor.get(id)
    if (!actual) {
      orden.push(id)
      mejor.set(id, p)
    } else if (mayor(p, actual)) mejor.set(id, p)
  }
  for (const g of ganado) {
    const p: PiezaReciente = { clave: g.clave, logro: g.logro, escalon: g.escalon, destino: g.destino }
    if (g.logro === 'sello') {
      const [id] = g.escalon.split(':')
      poner(`sello|${g.destino}|${id}`, p, (a, b) => GRADOS.indexOf(a.escalon.split(':')[1] ?? '') > GRADOS.indexOf(b.escalon.split(':')[1] ?? ''))
    } else if (g.logro === 'coleccion') poner(g.clave, p, () => false)
    else if (g.logro === 'emblema' && !CON_HORA.has(g.escalon)) poner(g.clave, p, () => false)
    else if (g.logro.startsWith('viajero:')) poner(g.logro, p, (a, b) => Number(a.escalon || 0) > Number(b.escalon || 0))
  }
  return orden.map((id) => mejor.get(id)!)
}
