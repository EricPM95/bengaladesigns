import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { viajePorId, viajesDelPerfil } from '../../../lib/viajesPerfil'
import { FotoEnGrande } from '../../route/fotos/FotoEnGrande'
import { Icono } from '../../ui/Icono'
import { Capa } from './Capa'
import { PiezaDeVitrina } from './perfil/PiezaDeVitrina'
import { pedirGanadoDelViaje, piezasDelViaje } from './perfil/piezasDelViaje'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'
import type { PiezaReciente } from './perfil/api'

/**
 * MIS VIAJES → UN VIAJE (TR de «Mi Vitrina» en Design, Tanda 8C2): arriba su portada con el destino y las fechas, «Sus días», «Sus fotos» y «Lo que ganaste en este viaje» con [Ver todo Roma].
 * Los días y las fechas salen del viaje guardado en este dispositivo; las fotos, de las del viaje (las mismas del álbum); lo ganado, de `GET /api/logros/resumen?trip_id=` (lo ganado en las fechas del viaje).
 * Un emblema oculto solo sale si ya se encontró (el servidor no manda los demás).
 */
const TITULO = { font: "400 22px/1 'Instrument Serif',serif" } as const

export default function ViajeGuardado({ pantalla }: { pantalla: PantallaDe<'viaje'> }): ReactNode {
  const savedTrips = useSyncStore((s) => s.savedTrips)
  const rutaAbierta = useRouteStore((s) => s.route)
  const viaje = useMemo(() => viajePorId(viajesDelPerfil(savedTrips ?? [], rutaAbierta), pantalla.tripId), [savedTrips, rutaAbierta, pantalla.tripId])
  const { fotos: fotosReales } = useFotosViaje(viaje?.id ?? pantalla.tripId)
  // Solo en desarrollo: el escaparate puede poner fotos de mentira (`window.__fotosDePrueba[tripId]`) para la captura; en producción esta línea no existe.
  const fotos = (import.meta.env.DEV ? (window as unknown as { __fotosDePrueba?: Record<string, FotoViaje[]> }).__fotosDePrueba?.[pantalla.tripId] : undefined) ?? fotosReales
  const [ganado, setGanado] = useState<PiezaReciente[]>([])
  const [destinoClave, setDestinoClave] = useState<string | null>(null)
  const [grande, setGrande] = useState<FotoViaje | null>(null)

  useEffect(() => {
    let vivo = true
    void pedirGanadoDelViaje(viaje?.id ?? pantalla.tripId).then((g) => {
      if (!vivo || !g) return
      setGanado(piezasDelViaje(g))
      setDestinoClave(g.find((x) => x.logro === 'sello')?.destino ?? g[0]?.destino ?? null)
    })
    return () => {
      vivo = false
    }
  }, [viaje?.id, pantalla.tripId])

  const dias = (viaje?.route.days ?? []).filter((d) => !d.isReturnLeg)
  const portada = fotos[0] ? urlParaMostrar(fotos[0]) : ''
  return (
    <Capa etiqueta="ViajeGuardado">
      <main className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-10" style={{ scrollbarWidth: 'none' }} data-viaje-guardado={pantalla.tripId}>
        <div className="relative flex-none text-[#FFFDF8]" style={{ height: 180, background: 'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)' }}>
          {portada && <img src={portada} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,12,20,.25),transparent 30%,transparent 40%,rgba(10,12,20,.65))' }} />
          <button type="button" onClick={() => useLogrosPantallas.getState().volver()} aria-label="Volver" className="absolute left-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF8]/90 text-[#1C2230]">
            <Icono nombre="atras" size={18} />
          </button>
          <span className="absolute bottom-3.5 left-[18px] flex flex-col gap-[3px]">
            <span style={{ font: "400 34px/1 'Instrument Serif',serif" }}>{viaje?.destino ?? ''}</span>
            {viaje && (
              <span style={{ font: "500 12px 'Geist Mono',monospace" }}>
                {[viaje.cuando, viaje.duracion.split(' · ')[0]].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
        </div>

        {dias.length > 0 && (
          <>
            <span className="px-[18px]" style={TITULO}>
              Sus días
            </span>
            <div className="flex gap-2 overflow-x-auto px-5" style={{ scrollbarWidth: 'none' }} data-sus-dias>
              {dias.map((d) => (
                <span key={d.id} className="flex w-[118px] flex-none flex-col gap-[3px] rounded-2xl border border-[#1C2230]/[.07] bg-[#FFFDF8] px-3 py-2.5">
                  <span style={{ font: "600 10px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>DÍA {d.dayNumber}</span>
                  <span style={{ font: "400 16px/1.15 'Instrument Serif',serif" }}>{d.curatedTitle ?? d.title}</span>
                </span>
              ))}
              <span className="w-3 flex-none" />
            </div>
          </>
        )}

        {fotos.length > 0 && (
          <>
            <span className="px-[18px]" style={TITULO}>
              Sus fotos
            </span>
            <div className="grid grid-cols-3 gap-1 px-4" data-sus-fotos>
              {fotos.map((f) => (
                <button key={f.id} type="button" onClick={() => setGrande(f)} aria-label={f.stopName ?? 'Foto del viaje'} className="aspect-square overflow-hidden rounded-[10px] bg-[#1C2230]/10 p-0">
                  {urlParaMostrar(f) && <img src={urlParaMostrar(f)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          </>
        )}

        {ganado.length > 0 && (
          <>
            <span className="px-[18px]" style={TITULO}>
              Lo que ganaste en este viaje
            </span>
            <div className="flex flex-wrap items-end gap-2.5 px-4" data-lo-ganado-del-viaje>
              {ganado.map((p) => (
                <span key={p.clave} className="flex items-end justify-center" style={{ minWidth: 64, minHeight: 64 }}>
                  <PiezaDeVitrina pieza={p} tam={64} />
                </span>
              ))}
            </div>
            {destinoClave && viaje && (
              <button type="button" onClick={() => useLogrosPantallas.getState().abrir({ t: 'destino', destino: destinoClave })} className="mx-4 mt-1.5 h-[52px] flex-none rounded-full bg-[#1C2230] text-[14.5px] font-semibold text-[#FFFDF8]">
                Ver todo {viaje.destino}
              </button>
            )}
          </>
        )}
      </main>
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </Capa>
  )
}
