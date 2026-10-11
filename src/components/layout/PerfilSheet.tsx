import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { usePerfilUi } from '../../store/usePerfilUi'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import { useNumeroFotos } from '../../lib/useNumeroFotos'
import { chinchetasDeViajes, cifrasDelPerfil, viajePorId, viajesDelPerfil, type ResumenViaje } from '../../lib/viajesPerfil'
import { Icono } from '../ui/Icono'
import { Creditos } from '../perfil/Creditos'
import { FichaDeViaje } from '../perfil/FichaDeViaje'
import { FilaDeViaje } from '../perfil/FilaDeViaje'
import { MapaMisViajes } from '../perfil/MapaMisViajes'
import { NewTripSheet } from './NewTripSheet'

const ETIQUETA = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' } as const

/**
 * El Perfil (Tanda 6z3, 6z6, 6z6b y 6y4, con el diseño «Perfil»): una PANTALLA COMPLETA con, de arriba abajo: la cabecera («PERFIL» y la ✕), «Hola, viajero» con su círculo, el mapa de mis viajes (nuestro globo
 * de Mapbox, de 286 px, con una chincheta por destino —«Roma ×5»— y las cifras «1 país · 4 lugares · 14 días» abajo a la izquierda), «Mis viajes» con su número y cada viaje (bandera de RUTA, fecha, fotos y «Abierto»),
 * «Créditos» al final de la lista y, fijo abajo del todo, [+ Nuevo viaje]. Tocar un viaje o una chincheta abre su álbum, también a pantalla completa y con [‹ Volver]; qué álbum está abierto lo dice `usePerfilUi.albumDe`.
 * Se pinta en el `body` (por encima de la barra de abajo, que así queda tapada). Mientras el álbum está abierto, la lista (y su mapa) no se monta: no queda un lienzo WebGL vivo bajo él.
 */
export function PerfilSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rutaAbierta = useRouteStore((state) => state.route)
  const savedTrips = useSyncStore((state) => state.savedTrips)
  const albumDe = usePerfilUi((state) => state.albumDe)
  const abrirAlbum = usePerfilUi((state) => state.abrirAlbum)
  const cerrarAlbum = usePerfilUi((state) => state.cerrarAlbum)
  const [newTripOpen, setNewTripOpen] = useState(false)
  const [creditosOpen, setCreditosOpen] = useState(false)

  const viajes = useMemo(() => viajesDelPerfil(savedTrips ?? [], rutaAbierta), [savedTrips, rutaAbierta])
  const chinchetas = useMemo(() => chinchetasDeViajes(viajes), [viajes])
  const cifras = useMemo(() => cifrasDelPerfil(viajes), [viajes])
  const fotos = useNumeroFotos(useMemo(() => viajes.map((v) => v.id), [viajes]))
  const ficha = viajePorId(viajes, albumDe)
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)

  // (Tanda 6y5) [Abrir este viaje]: carga el viaje guardado en la app y cierra el Perfil.
  const abrirViaje = (viaje: ResumenViaje) => {
    if (!viaje.guardado) return
    onClose()
    useSyncStore.getState().setActiveTripId(viaje.guardado.id)
    useSyncStore.getState().setResumeTrip(null)
    hydrateTrip(viaje.guardado)
  }

  return (
    <>
      {open &&
        (ficha ? (
          <FichaDeViaje viaje={ficha} onVolver={cerrarAlbum} />
        ) : (
          createPortal(
            <div role="dialog" aria-modal="true" aria-label="Perfil" className="fixed inset-0 z-[70] flex flex-col bg-bg text-text">
              <header className="flex h-14 shrink-0 items-center justify-between pl-5 pr-3 pt-[env(safe-area-inset-top)]">
                <h1 className="uppercase text-text/55" style={ETIQUETA}>
                  Perfil
                </h1>
                <button type="button" onClick={onClose} aria-label="Cerrar el Perfil" title="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE4D3] text-[#1C2230] transition-colors hover:bg-[#E4D9C4]">
                  <Icono nombre="cerrar" size={18} />
                </button>
              </header>
              <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-4 pb-5 pt-0.5" style={{ scrollbarWidth: 'none' }}>
                <div className="flex items-center gap-3.5 px-1">
                  <h2 className="m-0 flex-1 font-display text-[40px] leading-none tracking-[-.01em] text-text">
                    Hola, <em>viajero</em>
                  </h2>
                  <span aria-hidden="true" className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-[#1C2230] font-display text-[26px] leading-none text-[#FFFDF8]" style={{ boxShadow: '0 0 0 3px rgb(var(--bg)), 0 0 0 4.5px oklch(0.8 0.14 70)' }}>
                    V
                  </span>
                </div>
                <MapaMisViajes chinchetas={chinchetas} cifras={cifras} onElegir={abrirAlbum} />
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between px-1">
                    <h3 className="m-0 uppercase text-text/55" style={ETIQUETA}>
                      Mis viajes
                    </h3>
                    <span className="text-text/45" style={{ font: "500 11px 'Geist Mono',monospace" }} data-numero-de-viajes>
                      {viajes.length}
                    </span>
                  </div>
                  {viajes.length === 0 && <p className="px-1 text-[13px] text-text/60">Aún no tienes viajes guardados en este dispositivo.</p>}
                  {viajes.map((viaje) => (
                    <FilaDeViaje key={viaje.id} viaje={viaje} fotos={fotos ? (fotos.get(viaje.id) ?? 0) : null} abierto={viaje.id === rutaAbierta?.id} onAbrir={() => abrirAlbum(viaje.id)} onAbrirViaje={() => abrirViaje(viaje)} />
                  ))}
                </div>
                <button type="button" onClick={() => setCreditosOpen(true)} className="self-start p-1 text-[12px] text-text/50 underline underline-offset-[3px]">
                  Créditos
                </button>
              </div>
              <div className="flex-none px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3" style={{ background: 'linear-gradient(180deg, rgb(var(--bg) / 0), rgb(var(--bg)) 30%)' }}>
                <button
                  type="button"
                  onClick={() => setNewTripOpen(true)}
                  className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-full bg-[#1C2230] text-[16px] font-semibold text-[#FFFDF8] shadow-[0_14px_26px_-14px_rgba(28,34,48,.8)] transition-transform active:scale-[.98]"
                >
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[#17120a]" style={{ background: 'oklch(0.8 0.14 70)' }}>
                    <Icono nombre="anadir" size={13} grosor={2.6} />
                  </span>
                  Nuevo viaje
                </button>
              </div>
            </div>,
            document.body,
          )
        ))}
      {open && creditosOpen && <Creditos onVolver={() => setCreditosOpen(false)} />}
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
