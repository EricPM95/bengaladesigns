import { useState } from 'react'
import { createPortal } from 'react-dom'
import { cuentasActivas } from '../../lib/cuentas'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { botonChampan } from '../../lib/marcaBoton'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { usePersonasStore } from '../../store/usePersonasStore'
import { CarasDelViaje } from '../compartir/CarasDelViaje'
import { useCuenta } from '../cuenta/useCuenta'
import { Icono } from '../ui/Icono'
import { usePagoStore } from '../../store/usePagoStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { misPases } from '../../lib/pagoPase'
import { pedirPermisoUnaVez } from '../../lib/permisoAvisos'
import { usePedirNombre } from '../../store/usePedirNombre'
import { EntrarCuenta } from '../cuenta/EntrarCuenta'
import { AvisoSobreLaBarra } from '../ui/AvisoSobreLaBarra'

/**
 * [Compartir viaje] como icono de la tarjeta del destino (RUTA): mismo tamaño y estilo que la bombilla y la varita. SIEMPRE a la vista (Tanda 10C; en la 10B solo salía con cuenta y viaje guardado, y por eso no se veía).
 *   · Con su cuenta y su viaje guardado: abre la hoja de invitar.
 *   · Con las cuentas encendidas pero sin cuenta: pide entrar (la pantalla de entrar de siempre).
 *   · Con las cuentas apagadas o el viaje aún sin guardar: lo dice con un aviso corto.
 */
export function BotonCompartirViaje() {
  if (!cuentasActivas()) return <IconoCompartir cuenta={null} activo={false} />
  return <CompartirEncendido />
}

function IconoCompartir({ cuenta, activo, tripId = null }: { cuenta: 'cuenta' | 'otra' | null; activo: boolean; tripId?: string | null }) {
  const route = useRouteStore((s) => s.route)
  const abrir = usePagoStore((s) => s.abrir)
  const { esInvitado } = useModoInvitado()
  const gente = useViajeCompartido((s) => s.gente)
  const abrirPersonas = usePersonasStore((s) => s.abrir)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)
  const decir = (texto: string) => {
    setAviso(texto)
    window.setTimeout(() => setAviso(null), 3200)
  }
  const compartir = async () => {
    if (!activo) {
      decir('Compartir el viaje se activa con las cuentas.')
      return
    }
    if (cuenta !== 'cuenta') {
      setEntrando(true)
      return
    }
    if (!tripId || !route) {
      decir('Estamos guardando tu viaje. Prueba en un momento.')
      return
    }
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
  // (Tanda 10N §4a) Ya compartido —o invitado—: las caras de las personas con el número y la flechita; al tocarlas, «Personas del viaje». Nunca [Compartir] para un invitado: invitar es del administrador.
  const compartido = gente.length > 1 || (esInvitado && gente.length > 0)
  if (compartido) {
    return (
      <button type="button" data-caras-del-viaje-boton onClick={abrirPersonas} aria-label={`Personas del viaje: ${gente.length}`} title="Personas del viaje" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-text/[.14] bg-bg-card pl-1.5 pr-2.5 text-text">
        <CarasDelViaje personas={gente} max={4} tam={24} borde="#FFFDF8" />
        <span data-numero-de-personas className="text-[13px] font-semibold">
          {gente.length}
        </span>
        <Icono nombre="adelante" size={12} />
      </button>
    )
  }
  if (esInvitado) return null
  return (
    <>
      {/* (Tanda 10N §4a) Sin compartir: el botón [Compartir] en champán, con su texto, junto a la pastilla del pase (fuera el icono suelto). */}
      <button type="button" data-compartir-viaje disabled={ocupado} onClick={() => void compartir()} title="Compartir viaje" aria-label="Compartir viaje" className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 disabled:opacity-60" style={{ ...botonChampan(), border: 'none', font: "700 13px 'Geist'" }}>
        <Icono nombre="compartirViaje" size={14} grosor={2} />
        Compartir
      </button>
      {aviso && createPortal(
        <AvisoSobreLaBarra z={60} datos={{ 'data-aviso-compartir': '' }} className="justify-center text-center text-[13.5px] font-medium">
          {aviso}
        </AvisoSobreLaBarra>,
        document.body,
      )}
      {entrando &&
        createPortal(
          <div data-compartir-entrar className="fixed inset-0 z-[80]">
            <EntrarCuenta />
          </div>,
          document.body,
        )}
    </>
  )
}

function CompartirEncendido() {
  const cuenta = useCuenta()
  const tripId = useSyncStore((s) => s.activeTripId)
  return <IconoCompartir cuenta={cuenta.tipo === 'cuenta' ? 'cuenta' : 'otra'} activo tripId={tripId} />
}
