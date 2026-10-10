import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { usePerfilUi } from '../../store/usePerfilUi'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import { chinchetasDeViajes, viajePorId, viajesDelPerfil, type ResumenViaje } from '../../lib/viajesPerfil'
import { Icono } from '../ui/Icono'
import { FichaDeViaje } from '../perfil/FichaDeViaje'
import { MapaMisViajes } from '../perfil/MapaMisViajes'
import { NewTripSheet } from './NewTripSheet'

/**
 * El Perfil (Tanda 6z3, 6z6 y 6z6b): una PANTALLA COMPLETA (como RESERVAS) con su cabecera «Perfil» y la ✕. La cuenta llegará más adelante; de momento, el mapa de mis viajes (un globo bajo, de 220 px, con una
 * chincheta por destino), la lista de los viajes de este dispositivo (los que vienen y luego los hechos) y el «+ Nuevo viaje». Tocar una chincheta o un viaje abre su ficha, con su álbum, también a pantalla completa
 * y con [‹ Volver]. Qué álbum está abierto lo dice `usePerfilUi.albumDe`. Se pinta en el `body` (por encima de la barra de abajo) y, aun así, deja de relleno el alto de la barra para que lo último de la lista se pueda subir.
 * Mientras la ficha está abierta, la lista (y su mapa) no se monta: no queda un lienzo WebGL vivo bajo ella.
 */
export function PerfilSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const rutaAbierta = useRouteStore((state) => state.route)
  const savedTrips = useSyncStore((state) => state.savedTrips)
  const albumDe = usePerfilUi((state) => state.albumDe)
  const abrirAlbum = usePerfilUi((state) => state.abrirAlbum)
  const cerrarAlbum = usePerfilUi((state) => state.cerrarAlbum)
  const [newTripOpen, setNewTripOpen] = useState(false)

  const viajes = useMemo(() => viajesDelPerfil(savedTrips ?? [], rutaAbierta), [savedTrips, rutaAbierta])
  const chinchetas = useMemo(() => chinchetasDeViajes(viajes), [viajes])
  const ficha = viajePorId(viajes, albumDe)

  const abrirViaje = (viaje: ResumenViaje) => {
    if (!viaje.guardado) return
    onClose()
    useSyncStore.getState().setActiveTripId(viaje.guardado.id)
    useSyncStore.getState().setResumeTrip(null)
    hydrateTrip(viaje.guardado)
  }

  const hayHechos = viajes.some((v) => v.fase === 'hecho')
  const hayProximos = viajes.some((v) => v.fase === 'proximo')

  return (
    <>
      {open &&
        (ficha ? (
          <FichaDeViaje viaje={ficha} abierto={ficha.id === rutaAbierta?.id} onVolver={cerrarAlbum} onAbrir={() => abrirViaje(ficha)} />
        ) : (
          createPortal(
            <div role="dialog" aria-modal="true" aria-label="Perfil" className="fixed inset-0 z-[70] flex flex-col bg-bg text-text">
              <header className="flex h-14 shrink-0 items-center justify-between pl-5 pr-2 pt-[env(safe-area-inset-top)]">
                <h1 className="font-display text-[26px] leading-none text-text">Perfil</h1>
                <button type="button" onClick={onClose} aria-label="Cerrar el Perfil" title="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full text-text transition-colors hover:bg-text/[.06]">
                  <Icono nombre="cerrar" size={22} />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
                <h2 className="font-display text-[28px] leading-tight text-text">Hola, viajero</h2>
                <p className="mt-1 text-[13px] text-text/60">Pronto podrás guardar tus viajes en tu cuenta.</p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTripOpen(true)}
                    className="flex h-11 items-center gap-2 rounded-full bg-text px-4 text-[13.5px] font-semibold text-bg transition-transform active:scale-[.98]"
                  >
                    <Icono nombre="anadir" size={15} grosor={2.2} />
                    Nuevo viaje
                  </button>
                </div>
                <div className="mt-5">
                  <MapaMisViajes chinchetas={chinchetas} onElegir={abrirAlbum} />
                </div>
                <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-text/55">Mis viajes</p>
                <div className="mt-2 divide-y divide-text/[.08] rounded-2xl border border-text/[.10] bg-bg-card">
                  {viajes.length === 0 && <p className="px-4 py-3 text-[13px] text-text/60">Aún no tienes viajes guardados en este dispositivo.</p>}
                  {viajes.map((viaje, indice) => (
                    <div key={viaje.id}>
                      {hayHechos && hayProximos && (indice === 0 || viaje.fase !== viajes[indice - 1].fase) && (
                        <p className="px-4 pb-1 pt-3 font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-text/45">{viaje.fase === 'proximo' ? 'Próximos' : 'Ya hechos'}</p>
                      )}
                      <button type="button" onClick={() => abrirAlbum(viaje.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg-hover">
                        <span className="min-w-0 text-[14.5px] font-medium text-text">{viaje.rotulo}</span>
                        {viaje.id === rutaAbierta?.id && <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">Abierto</span>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        ))}
      {newTripOpen && (
        <NewTripSheet
          onConfirm={() => {
            setNewTripOpen(false)
            onClose()
            empezarViajeNuevo()
          }}
          onCancel={() => setNewTripOpen(false)}
        />
      )}
    </>
  )
}
