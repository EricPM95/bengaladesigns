import { lazy, Suspense, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { usePerfilUi } from '../../store/usePerfilUi'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import { useNumeroFotos } from '../../lib/useNumeroFotos'
import { viajePorId, viajesDelPerfil, type ResumenViaje } from '../../lib/viajesPerfil'
import { Icono } from '../ui/Icono'
import { Creditos } from '../perfil/Creditos'
import { PerfilEsqueleto } from '../perfil/PerfilEsqueleto'
import { useMiNombreYFoto } from '../../store/useMiPerfil'
import { FichaDeViaje } from '../perfil/FichaDeViaje'
import { NewTripSheet } from './NewTripSheet'

/** (8C2, Tanda 10N4) El cuerpo del Perfil —el único que hay—: con los logros encendidos lleva marco, EXP, vitrina, billete y pasaporte; apagados, solo su foto, su pasaporte de este móvil, sus viajes y los ajustes. Se baja solo al abrir el Perfil. */
const CuerpoConLogros = lazy(() => import('../logros/pantallas/perfil/CuerpoConLogros'))

const ETIQUETA = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' } as const

/**
 * El Perfil (Tanda 6z3, 6z6, 6z6b y 6y4, con el diseño «Perfil»; Tanda 10N4: UN solo Perfil, el nuevo, con y sin logros): una PANTALLA COMPLETA con, de arriba abajo: la cabecera («PERFIL» y la ✕), el cuerpo (`CuerpoConLogros`: «Hola, …»,
 * su pasaporte y «Mis viajes» con su número y cada viaje con su portada y sus fotos),
 * «Créditos» al final de la lista y, fijo abajo del todo, [+ Nuevo viaje]. Tocar un viaje abre su álbum, también a pantalla completa y con [‹ Volver]; qué álbum está abierto lo dice `usePerfilUi.albumDe`.
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
  const fotos = useNumeroFotos(useMemo(() => viajes.map((v) => v.id), [viajes]))
  const ficha = viajePorId(viajes, albumDe)
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const yo = useMiNombreYFoto()

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
                <Suspense fallback={<PerfilEsqueleto nombre={yo.tieneNombre ? yo.nombre : null} />}>
                  <CuerpoConLogros viajes={viajes} fotos={fotos} rutaAbiertaId={rutaAbierta?.id ?? null} onAbrirAlbum={abrirAlbum} onAbrirViaje={abrirViaje} />
                </Suspense>
                {/* Tanda 10N4: un solo Perfil para todos; los logros apagados solo le quitan lo de los logros. */}
                <button type="button" onClick={() => setCreditosOpen(true)} className="self-start p-1 text-[12px] text-text/50 underline underline-offset-[3px]">
                  Créditos
                </button>
              </div>
              <div className="flex-none px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3" style={{ background: 'linear-gradient(180deg, rgb(var(--bg) / 0), rgb(var(--bg)) 30%)' }}>
                <button
                  type="button"
                  onClick={() => setNewTripOpen(true)}
                  className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-full btn-champan text-[16px] font-semibold shadow-[0_14px_26px_-14px_rgba(28,34,48,.8)] transition-transform active:scale-[.98]"
                >
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[#FFFDF8]" style={{ background: '#A67C52' }}>
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
