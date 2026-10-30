import { lazy, Suspense, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { usePerfilUi } from '../../store/usePerfilUi'
import { useAjustesUi } from '../../store/useAjustesUi'
import { useUnirseUi } from '../../store/useUnirseUi'
import { useLogrosPantallas } from '../logros/pantallas/useLogrosPantallas'
import { logrosActivos } from '../../lib/logros'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import { useNumeroFotos } from '../../lib/useNumeroFotos'
import { viajePorId, viajesDelPerfil, type ResumenViaje } from '../../lib/viajesPerfil'
import { Icono } from '../ui/Icono'
import { HojaOpciones, ICONOS_OPCION, OpcionTarjeta } from '../ui/HojaOpciones'
import { Creditos } from '../perfil/Creditos'
import { PerfilEsqueleto } from '../perfil/PerfilEsqueleto'
import { useMiNombreYFoto } from '../../store/useMiPerfil'
import { FichaDeViaje } from '../perfil/FichaDeViaje'
import { NewTripSheet } from './NewTripSheet'

/**
 * (8C2, Tanda 10N4) El cuerpo del Perfil —el único que hay—: con los logros encendidos lleva marco, EXP, vitrina, billete y pasaporte; apagados, solo su foto, su pasaporte de este móvil y sus viajes.
 * (Tanda 10N5, «que se abra al momento») El código del cuerpo se baja YA, cuando la app está quieta (`precargarPerfil`), y no al tocar el Perfil; y al tocar el círculo se empuja la bajada un poco antes (pointerdown).
 */
const cargarCuerpo = () => import('../logros/pantallas/perfil/CuerpoConLogros')
const CuerpoConLogros = lazy(cargarCuerpo)

let precargado = false
/** Baja el código del Perfil y pide sus datos para dejarlos guardados en el móvil; una sola vez. Se llama en reposo (abajo) y al empezar a tocar el círculo del Perfil. */
export function precargarPerfil(): void {
  if (precargado) return
  precargado = true
  void cargarCuerpo()
    .then((m) => m.precalentarPerfil())
    .catch(() => {
      precargado = false
    })
}
if (typeof window !== 'undefined') {
  const enReposo = (f: () => void) => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(f, { timeout: 5000 })
    else window.setTimeout(f, 2500)
  }
  const programar = () => window.setTimeout(() => enReposo(precargarPerfil), 1200)
  if (document.readyState === 'complete') programar()
  else window.addEventListener('load', programar, { once: true })
}

/**
 * El Perfil (Tanda 6z3, 6z6, 6z6b y 6y4, con el diseño «Perfil»; Tanda 10N4: UN solo Perfil, el nuevo, con y sin logros; Tanda 10N5: el orden nuevo, \`Piezas/Perfil Orden\`): una PANTALLA COMPLETA con, arriba a la derecha, los ajustes y la ✕
 * (ya no hay palabra «PERFIL»), el cuerpo (\`CuerpoConLogros\`: la cabecera con la EXP, «Mis viajes» en fila, vitrina, pasaporte y sorteo), «Créditos» al final y, flotante abajo en medio, el [+] que abre «¿Qué quieres hacer?»:
 * crear un viaje nuevo, unirme con un código o añadir un viaje que ya hiciste. Tocar un viaje abre su álbum, también a pantalla completa y con [‹ Volver]; qué álbum está abierto lo dice \`usePerfilUi.albumDe\`.
 * Se pinta en el \`body\` (por encima de la barra de abajo, que así queda tapada). Mientras el álbum está abierto, la lista (y su mapa) no se monta: no queda un lienzo WebGL vivo bajo él.
 */
export function PerfilSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rutaAbierta = useRouteStore((state) => state.route)
  const savedTrips = useSyncStore((state) => state.savedTrips)
  const albumDe = usePerfilUi((state) => state.albumDe)
  const abrirAlbum = usePerfilUi((state) => state.abrirAlbum)
  const cerrarAlbum = usePerfilUi((state) => state.cerrarAlbum)
  const abrirAjustes = useAjustesUi((s) => s.abrir)
  const [newTripOpen, setNewTripOpen] = useState(false)
  const [anadirOpen, setAnadirOpen] = useState(false)
  const [creditosOpen, setCreditosOpen] = useState(false)

  const viajes = useMemo(() => viajesDelPerfil(savedTrips ?? [], rutaAbierta), [savedTrips, rutaAbierta])
  const fotos = useNumeroFotos(useMemo(() => viajes.map((v) => v.id), [viajes]))
  const ficha = viajePorId(viajes, albumDe)
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const yo = useMiNombreYFoto()

  // (Tanda 6y5) [Abrir este viaje]: carga el viaje guardado en la app y cierra el Perfil. El que ya está abierto, solo cierra el Perfil.
  const abrirViaje = (viaje: ResumenViaje) => {
    onClose()
    if (!viaje.guardado || viaje.id === rutaAbierta?.id) return
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
              {/* Arriba, solo los ajustes y la ✕ (Tanda 10N5: fuera la palabra «PERFIL»). */}
              <header className="flex shrink-0 items-center justify-end gap-2.5 px-5 pb-0 pt-[calc(env(safe-area-inset-top)+10px)]">
                <button type="button" aria-label="Ajustes" data-ajustes onClick={() => abrirAjustes()} className="zona-toque flex h-10 w-10 items-center justify-center rounded-full" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                    <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6" />
                  </svg>
                </button>
                <button type="button" onClick={onClose} aria-label="Cerrar el Perfil" title="Cerrar" className="zona-toque flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE4D3] text-[#1C2230] transition-colors hover:bg-[#E4D9C4]">
                  <Icono nombre="cerrar" size={18} />
                </button>
              </header>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[150px]" style={{ scrollbarWidth: 'none' }} data-perfil-scroll>
                <Suspense fallback={<PerfilEsqueleto nombre={yo.tieneNombre ? yo.nombre : null} />}>
                  <CuerpoConLogros viajes={viajes} fotos={fotos} rutaAbiertaId={rutaAbierta?.id ?? null} onAbrirAlbum={abrirAlbum} onAbrirViaje={abrirViaje} />
                </Suspense>
                {/* Tanda 10N4: un solo Perfil para todos; los logros apagados solo le quitan lo de los logros. */}
                <button type="button" onClick={() => setCreditosOpen(true)} className="mx-5 mt-5 self-start p-1 text-[12px] text-text/50 underline underline-offset-[3px]">
                  Créditos
                </button>
              </div>
              {/* El [+] flotante, abajo en medio (Tanda 10N5, `Piezas/Perfil Orden`): sustituye a «Nuevo viaje» y a «Añadir un viaje que ya hiciste». */}
              <div className="pointer-events-none absolute inset-x-0 z-[5] flex justify-center" style={{ bottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
                <button
                  type="button"
                  onClick={() => setAnadirOpen(true)}
                  aria-label="Añadir un viaje"
                  data-anadir-viaje
                  className="pointer-events-auto flex items-center justify-center rounded-full"
                  style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', border: 'none', boxShadow: '0 0 0 6px rgba(246,239,224,.85),0 14px 26px -8px rgba(110,80,24,.85),inset 0 1px 0 rgba(255,255,255,.6)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>,
            document.body,
          )
        ))}
      {open && creditosOpen && <Creditos onVolver={() => setCreditosOpen(false)} />}
      {open && anadirOpen && (
        <HojaOpciones etiqueta="Añadir" titulo="¿Qué quieres hacer?" onCerrar={() => setAnadirOpen(false)} datos="anadir-viaje" z={96}>
          <OpcionTarjeta
            tono="arena"
            icono={ICONOS_OPCION.mas}
            titulo="Crear un viaje nuevo"
            linea="Elige destino y fechas"
            flecha
            datos="crear-viaje"
            onClick={() => {
              setAnadirOpen(false)
              setNewTripOpen(true)
            }}
          />
          <OpcionTarjeta
            tono="azul"
            icono={ICONOS_OPCION.llave}
            titulo="Unirme con un código"
            linea="El que te ha pasado quien organiza el viaje"
            flecha
            datos="unirme-con-codigo"
            onClick={() => {
              setAnadirOpen(false)
              useUnirseUi.getState().abrir()
            }}
          />
          {logrosActivos() && (
            <OpcionTarjeta
              tono="salvia"
              icono="M6 3h12v18H6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 18h6"
              titulo="Añade un viaje que ya hiciste"
              linea="¿Viajaste antes de tener JUTRIP? Añade tu destino y rellena tu mapa y tu pasaporte."
              flecha
              datos="viaje-previo"
              onClick={() => {
                setAnadirOpen(false)
                useLogrosPantallas.getState().abrir({ t: 'previos' })
              }}
            />
          )}
        </HojaOpciones>
      )}
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
