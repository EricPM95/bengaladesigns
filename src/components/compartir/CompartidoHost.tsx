import { lazy, Suspense, useCallback, useEffect } from 'react'
import { accionPorAviso, conectarViaje } from '../../lib/compartidoTiempoReal'
import { cuentasActivas } from '../../lib/cuentas'
import { demoActivo } from '../../lib/logros'
import { dejarDeVerElViaje } from '../../lib/personasViaje'
import { supabase } from '../../lib/supabaseClient'
import { refrescarViajeActivo } from '../../lib/viajeEnDirecto'
import { unaSolaVez } from '../../lib/sondeo'
import { useAvisosStore } from '../../store/useAvisosStore'
import { avisosAnunciados, useFranjaStore } from '../../store/useFranjaStore'
import { crearAnfitrionDeCambios } from '../../lib/anfitrionDeCambios'
import { usePersonasStore } from '../../store/usePersonasStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { useCuenta } from '../cuenta/useCuenta'
import { useLoSuyoDelViaje } from '../../hooks/useLoSuyoDelViaje'

const PersonasDelViaje = lazy(() => import('./PersonasDelViaje').then((m) => ({ default: m.PersonasDelViaje })))

const CADA_MS = 300_000 // (V36) 5 minutos (antes 45 s; en V26 antes 30 s); el cambio de otra persona llega al momento por Realtime (solo con el viaje compartido abierto); esto es el respaldo y solo pregunta el sello (~100 bytes), ver lib/sondeo.ts

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
  // (Tanda 10N6 §1l) Una sola carga de las entradas de los demás y de lo suyo de cada uno, para DÍAS, la ficha y RESERVAS.
  useLoSuyoDelViaje()
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
    // (10N10) Quién espera a quién (el cambio del viaje y su aviso llegan por canales distintos) está en lib/anfitrionDeCambios.ts.
    const anfitrion = crearAnfitrionDeCambios({
      tripId,
      // (V26) Cada guardado llegaba a TODOS (también al propio móvil) y cada uno bajaba el viaje ENTERO para ver si había cambiado. Ahora se pregunta primero por el sello (~100 bytes): lo propio y lo que no cambió no baja nada.
      refrescar: () => refrescarViajeActivo({ sondeo: true }),
      cargarAvisos: () => useAvisosStore.getState().cargar(),
      anunciados: avisosAnunciados,
      decir,
      alQuitado: () => dejarDeVerElViaje(tripId),
    })
    const desconectar = conectarViaje(supabase, tripId, uid, {
      alViaje: () => {
        anfitrion.alViaje()
        try {
          window.dispatchEvent(new Event('trazo:pase-posible-cambio'))
        } catch {
          /* sin ventana */
        }
      },
      alGente: () => void useViajeCompartido.getState().cargar(tripId),
      alAviso: (aviso) => {
        const que = accionPorAviso(aviso, tripId)
        if (que.accion === 'refrescar') anfitrion.alAvisoDeCambio()
        else {
          void useAvisosStore.getState().cargar()
          if (que.accion === 'quitado') dejarDeVerElViaje(tripId)
          else if (que.accion === 'gente') void useViajeCompartido.getState().cargar(tripId)
        }
      },
    })
    // El refresco de siempre, por si Realtime no está o se cayó.
    const sondear = () => {
      if (document.visibilityState !== 'visible') return
      void unaSolaVez(`viaje:${tripId}`, () => refrescarViajeActivo({ sondeo: true }), 20_000).then((r) => {
        if (!vivo) return
        if (r === 'cambiado') void anfitrion.alSondeo()
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
      anfitrion.parar()
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
