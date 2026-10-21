import { useState } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { useCuenta } from '../cuenta/useCuenta'
import { Icono } from '../ui/Icono'
import { usePagoStore } from '../../store/usePagoStore'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { misPases } from '../../lib/pagoPase'
import { pedirPermisoUnaVez } from '../../lib/permisoAvisos'
import { usePedirNombre } from '../../store/usePedirNombre'

/**
 * LOS BOTONES DE RUTA (RS1 y RW3, cuentas parte 3): arriba de la pestaña RUTA, a la derecha.
 *   · El administrador (con su cuenta y su viaje guardado): [Compartir viaje] (Tanda 10B: ya no es un botón oscuro encima de la tarjeta, sino un icono más dentro de la tarjeta del destino, `BotonCompartirViaje`).
 *     Abre la hoja del enlace y el código (RS2); con un Pase Dúo o Grupo, la misma hoja que P7 y el invitado entra con su plaza.
 *   · Quien mira el viaje de otra persona: [Recomendar otra ruta] (dorado). Entra en el modo recomendación sobre la ruta entera.
 * Con las cuentas apagadas no sale ninguno: la app es la de hoy.
 */
export function BotonesDeViaje() {
  if (!cuentasActivas()) return null
  return <BotonesEncendidos />
}

function BotonesEncendidos() {
  const { esInvitado, propuestaActiva } = useModoInvitado()
  const route = useRouteStore((s) => s.route)
  const empezar = usePropuestaStore((s) => s.empezar)
  if (!route || !esInvitado || propuestaActiva) return null
  return (
    <div className="flex justify-end px-0.5 pb-1">
      <button type="button" data-recomendar-ruta onClick={() => empezar('ruta')} className="flex h-11 items-center gap-[7px] rounded-full pl-[11px] pr-3.5 text-[13px] font-semibold text-[#17120a]" style={{ background: 'oklch(0.8 0.14 70)' }}>
        <Icono nombre="ruta" size={15} grosor={2} />
        Recomendar otra ruta
      </button>
    </div>
  )
}

/** [Compartir viaje] como icono de la tarjeta del destino (RUTA): mismo tamaño y estilo que la bombilla y la varita. Solo para el administrador, con su cuenta y su viaje guardado. */
export function BotonCompartirViaje() {
  if (!cuentasActivas()) return null
  return <CompartirEncendido />
}

function CompartirEncendido() {
  const cuenta = useCuenta()
  const { esInvitado } = useModoInvitado()
  const tripId = useSyncStore((s) => s.activeTripId)
  const route = useRouteStore((s) => s.route)
  const abrir = usePagoStore((s) => s.abrir)
  const [ocupado, setOcupado] = useState(false)
  if (!route || esInvitado || cuenta.tipo !== 'cuenta' || !tripId) return null
  const compartir = async () => {
    // La ventana del móvil que pide permiso para los avisos sale AQUÍ, una sola vez en la vida, en este mismo toque.
    void pedirPermisoUnaVez()
    setOcupado(true)
    // Quien entró con el email y no tiene nombre: «¿Cómo te llamas?», una sola vez, antes de compartir.
    await usePedirNombre.getState().pedir()
    // Con un Pase Dúo o Grupo de este destino, la misma hoja que P7; si no, la de compartir el viaje.
    const pases = await misPases()
    const pase = pases.find((p) => p.estado === 'activo' && p.es_mio && p.tipo !== 'uno' && p.destino.toLowerCase() === route.destination.toLowerCase() && p.usos_usados < p.usos_max) ?? null
    setOcupado(false)
    abrir({ tipo: 'invitar', modo: pase ? 'pase' : 'viaje', destino: route.destination, tripId, pase })
  }
  return (
    <button type="button" data-compartir-viaje disabled={ocupado} onClick={() => void compartir()} title="Compartir viaje" aria-label="Compartir viaje" className="group flex h-9 w-9 shrink-0 items-center justify-center disabled:opacity-60">
      <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-text/60 group-hover:bg-bg-hover">
        <Icono nombre="compartirViaje" className="h-[16px] w-[16px]" />
      </span>
    </button>
  )
}
