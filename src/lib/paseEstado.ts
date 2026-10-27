import { useEffect, useState } from 'react'
import { llamar, logrosActivos } from './logros'
import { fijarServidorDiceSinPase } from './pago'
import { useLogrosStore } from '../store/useLogrosStore'
import type { PruebaDelPase } from './diaDePrueba'

/**
 * EL ESTADO DEL PASE PARA HOY (Tanda 8B). Con el cobro apagado (o sin servidor, sin cuenta, sin logros) todo está abierto.
 * Con el cobro encendido manda `GET /api/pase/estado` (server/logros/servicio.js › estadoDelPase).
 * En desarrollo (`import.meta.env.DEV`) `?pase=sin|prueba|con|pregunta` fuerza un estado sin servidor:
 *   sin = cobro, sin pase, prueba por usar · prueba = cobro, sin pase, prueba ya gastada · con = cobro y con pase · pregunta = como «sin» y además la pregunta de las 12:00 (P10).
 */
export interface EstadoPase {
  cobro: boolean
  conPase: boolean
  /** HOY se puede usar (con pase, en el día de prueba o con el cobro apagado). */
  puede: boolean
  pruebaGastada: boolean
  /** (Tanda 10H) Lo que dice el servidor de la prueba: si está sin usar o gastada, de qué viaje y qué día. Sin él (cobro apagado), no hay prueba que contar. */
  prueba?: PruebaDelPase
  /** (Tanda 10N4 §1) ¿Se sabe ya lo del pase? Falso solo mientras llega `/api/pase/estado`: entonces el resto de campos son de relleno y NADA debe pintarse como «comprado» ni como «bloqueado». */
  sabido?: boolean
}

const ABIERTO: EstadoPase = { cobro: false, conPase: false, puede: true, pruebaGastada: false, sabido: true }
const DESCONOCIDO: EstadoPase = { cobro: false, conPase: false, puede: true, pruebaGastada: false, sabido: false }
const CLAVE = 'trazo:pase'

export function paseForzado(): 'sin' | 'prueba' | 'con' | 'pregunta' | null {
  if (!import.meta.env.DEV) return null
  try {
    const p = new URLSearchParams(window.location.search).get('pase')
    if (p === 'sin' || p === 'prueba' || p === 'con' || p === 'pregunta') window.sessionStorage.setItem(CLAVE, p)
    else if (p === 'off') window.sessionStorage.removeItem(CLAVE)
    const g = window.sessionStorage.getItem(CLAVE)
    return g === 'sin' || g === 'prueba' || g === 'con' || g === 'pregunta' ? g : null
  } catch {
    return null
  }
}

interface RespuestaEstado {
  ok: boolean
  cobro: boolean
  pases: unknown[]
  prueba: { ya_usada: boolean; estado?: PruebaDelPase['estado']; trip_id?: string | null; fecha?: string | null }
  hoy: { puede: boolean }
}

export function usePaseEstado(tripId: string | null): EstadoPase {
  const forzado = paseForzado()
  // (Tanda 10N4 §1) Antes arrancaba en ABIERTO («cobro apagado, todo abierto») y la pastilla salía «comprada» hasta que llegaba la respuesta. Ahora, si hay que preguntar al servidor, arranca en DESCONOCIDO.
  const [real, setReal] = useState<EstadoPase>(() => (!forzado && tripId && logrosActivos() ? DESCONOCIDO : ABIERTO))
  useEffect(() => {
    if (forzado || !tripId || !logrosActivos()) return undefined
    let vivo = true
    void llamar<RespuestaEstado>(`/api/pase/estado?trip_id=${encodeURIComponent(tripId)}`).then((r) => {
      if (!vivo) return
      if (!r?.ok) {
        // Sin respuesta (sin servidor o sin sesión): como siempre, todo abierto.
        setReal(ABIERTO)
        return
      }
      fijarServidorDiceSinPase(r.cobro && r.pases.length === 0)
      setReal({ cobro: r.cobro, conPase: r.pases.length > 0, puede: !r.cobro || r.hoy.puede, pruebaGastada: r.prueba.ya_usada, sabido: true, prueba: { estado: r.prueba.estado ?? null, tripId: r.prueba.trip_id ?? null, fecha: r.prueba.fecha ?? null } })
    })
    return () => {
      vivo = false
    }
  }, [forzado, tripId])
  // Si el viaje abierto cambia, hasta que conteste el servidor por el nuevo no se sabe.
  useEffect(() => {
    if (!forzado && tripId && logrosActivos()) setReal((r) => (r.sabido === false ? r : { ...r, sabido: false }))
  }, [forzado, tripId])
  // La pregunta de las 12:00 de prueba, una sola vez por carga.
  useEffect(() => {
    if (forzado !== 'pregunta') return
    const s = useLogrosStore.getState()
    if (!s.pregunta) useLogrosStore.setState({ pregunta: { texto: 'Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?', opciones: [{ id: 'hoy', texto: 'Hoy' }, { id: 'manana', texto: 'Mañana' }] } })
  }, [forzado])
  // Solo en desarrollo (capturas y pruebas): `window.__pruebaDelPase = { cobro, conPase, puede, pruebaGastada, prueba: { estado, tripId, fecha } }` pone el estado entero a mano.
  const aMano = import.meta.env.DEV ? (window as unknown as { __pruebaDelPase?: EstadoPase }).__pruebaDelPase : undefined
  if (aMano) return aMano
  if (forzado === 'sin' || forzado === 'pregunta') return { cobro: true, conPase: false, puede: true, pruebaGastada: false }
  if (forzado === 'prueba') return { cobro: true, conPase: false, puede: false, pruebaGastada: true }
  if (forzado === 'con') return { cobro: true, conPase: true, puede: true, pruebaGastada: false }
  return real
}
