import { lazy, Suspense, useCallback, useEffect } from 'react'
import { accionPorAviso, conectarViaje } from '../../lib/compartidoTiempoReal'
import { cuentasActivas } from '../../lib/cuentas'
import { demoActivo } from '../../lib/logros'
import { dejarDeVerElViaje } from '../../lib/personasViaje'
import { supabase } from '../../lib/supabaseClient'
import { refrescarViajeActivo } from '../../lib/viajeEnDirecto'
import { useAvisosStore } from '../../store/useAvisosStore'
import { useFranjaStore } from '../../store/useFranjaStore'
import { usePersonasStore } from '../../store/usePersonasStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { useCuenta } from '../cuenta/useCuenta'

const PersonasDelViaje = lazy(() => import('./PersonasDelViaje').then((m) => ({ default: m.PersonasDelViaje })))

const CADA_MS = 30_000

/**
 * EL ANFITRIÓN DEL VIAJE COMPARTIDO EN DIRECTO (Tanda 10N §4a y §10). Siempre montado; con las cuentas apagadas no hace nada.
 *   · Se engancha a Realtime de Supabase para el viaje abierto: cuando el dueño o quien puede editar lo cambia, la ruta se pone sola (sin recargar) y arriba sale una línea corta
 *     «Eric ha cambiado el viaje.»; el aviso de la campana ya lo deja la base de datos y aquí se pide de nuevo la lista.
 *   · Si te quitan del viaje con él abierto, deja de verse enseguida («Ya no formas parte del viaje a Roma.»); si te cambian el permiso, se actualiza la lista.
 *   · Sin Realtime (o con la app que vuelve de segundo plano) pide el viaje de ahora al volver y cada 30 s mientras está a la vista: el mismo resultado con unos segundos de retraso.
 *   · Pinta «Personas del viaje» cuando se abre desde la tarjeta de RUTA o desde la hoja de invitar.
 */
export function CompartidoHost() {
  if (!cuentasActivas()) return null
  return <Encendido />
}

function Encendido() {
  const cuenta = useCuenta()
  const tripId = useSyncStore((s) => s.activeTripId)
  const real = cuenta.tipo === 'cuenta' && !demoActivo()
  const uid = cuenta.tipo === 'cuenta' ? cuenta.uid : null
  const abierta = usePersonasStore((s) => s.abierta)
  const cerrarPersonas = usePersonasStore((s) => s.cerrar)

  // (10N4 §4b) Las líneas de la propia app («Ya no formas parte de este viaje») salen en la MISMA franja que los avisos nuevos (con su sonido), no en una pastilla aparte.
  const decir = useCallback((titulo: string, clave: string, detalle = '') => {
    useFranjaStore.getState().mostrar([{ id: `linea:${clave}:${Date.now()}`, clave, titulo, detalle, icono: 'info', quien: null }])
  }, [])
  // Al cambiar de viaje, la hoja de personas del anterior se cierra.
  useEffect(() => {
    cerrarPersonas()
  }, [tripId, cerrarPersonas])

  useEffect(() => {
    if (!real || !tripId || !supabase) return undefined
    let vivo = true
    let esperando: number | undefined
    let hayAviso = false
    const refrescar = () => {
      window.clearTimeout(esperando)
      // (Un momento para que llegue también el aviso con el nombre de quien lo hizo.)
      esperando = window.setTimeout(() => {
        void refrescarViajeActivo().then(async (r) => {
          if (!vivo) return
          // El aviso «Eric ha añadido un sitio» ya sale solo en la franja (llega con el aviso de la base de datos); si no llegó ninguno, una línea sencilla.
          if (r === 'cambiado') {
            if (!hayAviso) decir('Han cambiado el viaje', `cambiado:${tripId}`)
          } else if (r === 'fuera') {
            decir('Ya no formas parte del viaje', `quitado:${tripId}`)
            dejarDeVerElViaje(tripId)
          }
          void useAvisosStore.getState().cargar()
        })
      }, 600)
    }
    const desconectar = conectarViaje(supabase, tripId, uid, {
      alViaje: () => refrescar(),
      alGente: () => void useViajeCompartido.getState().cargar(tripId),
      alAviso: (aviso) => {
        void useAvisosStore.getState().cargar()
        const que = accionPorAviso(aviso, tripId)
        if (que.accion === 'refrescar') {
          hayAviso = true
          refrescar()
        } else if (que.accion === 'quitado') {
          dejarDeVerElViaje(tripId)
        } else if (que.accion === 'gente') void useViajeCompartido.getState().cargar(tripId)
      },
    })
    // El refresco de siempre, por si Realtime no está o se cayó.
    const sondear = () => {
      if (document.visibilityState !== 'visible') return
      void refrescarViajeActivo().then((r) => {
        if (!vivo) return
        if (r === 'cambiado') decir('Han cambiado el viaje', `cambiado:${tripId}`)
        else if (r === 'fuera') {
          decir('Ya no formas parte del viaje', `quitado:${tripId}`)
          dejarDeVerElViaje(tripId)
        }
      })
    }
    const reloj = window.setInterval(sondear, CADA_MS)
    document.addEventListener('visibilitychange', sondear)
    return () => {
      vivo = false
      window.clearTimeout(esperando)
      window.clearInterval(reloj)
      document.removeEventListener('visibilitychange', sondear)
      desconectar()
    }
  }, [real, tripId, uid, decir])

  return (
    <>
      {abierta && (
        <Suspense fallback={null}>
          <PersonasDelViaje />
        </Suspense>
      )}
    </>
  )
}
