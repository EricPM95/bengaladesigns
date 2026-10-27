import { useEffect, useState } from 'react'
import { guardarAvisoDeInvitacion, cuentasActivas } from '../../lib/cuentas'
import { usePedirNombre } from '../../store/usePedirNombre'
import { EVENTO_INVITACION, aceptarInvitacionPendiente, canjearInvitacion, invitacionAceptada, invitacionPendiente, olvidarInvitacionPendiente, olvidarViajeAAbrir, pedirAbrirViaje, verInvitacion, type VistaDeInvitacion } from '../../lib/invitaciones'
import { abrirViajeGuardado } from '../../lib/abrirViaje'
import { EntrarCuenta } from './EntrarCuenta'
import { InvitacionRecibida } from './InvitacionRecibida'
import { useCuenta } from './useCuenta'
import { recargarSinApertura } from '../../lib/recargarSinApertura'

/**
 * La puerta de la app (cuentas parte 3): con las cuentas encendidas, la cuenta se pide al empezar. Sin cuenta de verdad sale la pantalla de entrar (A1 a A3); no hay «seguir sin
 * cuenta». Si vienes de un enlace de invitación, antes sale lo que ve quien lo recibe (P7b) y [Unirme] lleva a entrar y, al entrar, a unirse. Con el interruptor apagado no pinta
 * nada y la app es la de hoy.
 */
export function PuertaDeCuenta() {
  if (!cuentasActivas()) return null
  return <PuertaEncendida />
}

function PuertaEncendida() {
  const estado = useCuenta()
  const [codigo, setCodigo] = useState<string | null>(() => invitacionPendiente())
  const [aceptada, setAceptada] = useState(() => invitacionAceptada())
  const [vista, setVista] = useState<VistaDeInvitacion | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const haySesion = estado.tipo === 'anonima' || estado.tipo === 'cuenta'

  // (Tanda 10N §5) Quien ya es parte de ese viaje no vuelve a ver «Eric te invita…»: directo al viaje (sin recargar si ya está cargado; si no, con una recarga que lo abre).
  const irAlViaje = (tripId: string | null | undefined) => {
    olvidarInvitacionPendiente()
    setCodigo(null)
    setVista(null)
    if (!tripId) return
    if (abrirViajeGuardado(tripId)) {
      olvidarViajeAAbrir()
      return
    }
    pedirAbrirViaje(tripId)
    recargarSinApertura()
  }

  // (Tanda 10N5) Un código escrito a mano (la hoja «Escribe el código») deja la invitación aceptada: la puerta se entera y pide la cuenta.
  useEffect(() => {
    const mirar = () => {
      setCodigo(invitacionPendiente())
      setAceptada(invitacionAceptada())
    }
    window.addEventListener(EVENTO_INVITACION, mirar)
    return () => window.removeEventListener(EVENTO_INVITACION, mirar)
  }, [])

  // La invitación pendiente se mira en cuanto hay sesión (la función de la base de datos pide una, aunque sea anónima).
  useEffect(() => {
    if (!codigo || aceptada || !haySesion) return undefined
    let vivo = true
    void verInvitacion(codigo).then((v) => {
      if (!vivo) return
      if (v.ya_dentro && v.trip_id) irAlViaje(v.trip_id)
      else setVista(v)
    })
    return () => {
      vivo = false
    }
  }, [codigo, aceptada, haySesion])

  if (estado.tipo === 'cargando') return null

  const unirme = async () => {
    aceptarInvitacionPendiente()
    setAceptada(true)
    if (estado.tipo !== 'cuenta' || !codigo) return // (sin cuenta: la pantalla de entrar; al entrar se canjea sola)
    setOcupado(true)
    // Sin nombre puesto: «¿Cómo te llamas?», una sola vez, antes de entrar en el viaje.
    await usePedirNombre.getState().pedir()
    const r = await canjearInvitacion(codigo)
    setOcupado(false)
    if (r.error) {
      setError(r.error)
      setAceptada(false)
      return
    }
    guardarAvisoDeInvitacion(r.yaEstaba ? 'Ya estabas en ese viaje.' : 'Has entrado en el viaje como invitado.')
    recargarSinApertura()
  }
  const seguir = () => {
    olvidarInvitacionPendiente()
    setCodigo(null)
    setVista(null)
  }

  if (codigo && !aceptada && vista) return <InvitacionRecibida vista={vista} onUnirme={() => void unirme()} onSeguir={seguir} ocupado={ocupado} error={error} />
  if (codigo && !aceptada && haySesion) return null // (mirando la invitación: no se enseña nada a medias)
  if (estado.tipo === 'anonima' || estado.tipo === 'sin_sesion') return <EntrarCuenta paraUnirte={Boolean(codigo && aceptada)} />
  return null
}
