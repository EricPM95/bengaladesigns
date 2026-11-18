import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { usePerfilUi } from '../../../store/usePerfilUi'
import { usePortadaDeViaje } from '../../../hooks/usePortadaDeViaje'
import { urlParaMostrar, type FotoViaje } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { viajePorId, viajesDelPerfil } from '../../../lib/viajesPerfil'
import { diasDelViaje, textoDeDias } from '../../../lib/duracionViaje'
import { abrirDiaDelViaje, abrirViajeEnRuta } from '../../../lib/abrirViaje'
import { tituloSinHorasSiYaNoEsVerdad } from '../../../lib/tituloDelDia'
import { FotoEnGrande } from '../../route/fotos/FotoEnGrande'
import { Icono } from '../../ui/Icono'
import { Capa } from './Capa'
import { PiezaDeVitrina } from './perfil/PiezaDeVitrina'
import { pedirGanadoDelViaje, piezasDelViaje } from './perfil/piezasDelViaje'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'
import type { PiezaReciente } from './perfil/api'

/**
 * LOS RECUERDOS DE UN VIAJE (`Perfil Viajes` P2 de Design, V12; antes «Mis viajes → un viaje», TR de «Mi Vitrina»): arriba su portada con el destino y «8 - 13 nov 2026 · 6 días», debajo [Abrir el viaje ›] (oscuro, a todo el ancho),
 * «Tus días» (tocar uno abre ESE día del viaje), «Tus fotos» y «Lo que ganaste en este viaje» con [Ver todo Roma].
 * Los días y las fechas salen del viaje guardado en este dispositivo; las fotos, de las del viaje (las mismas del álbum); lo ganado, de `GET /api/logros/resumen?trip_id=` (lo ganado en las fechas del viaje).
 * Un emblema oculto solo sale si ya se encontró (el servidor no manda los demás). La portada es la foto GRANDE (la pequeña, de 400 px, solo vale para las miniaturas de la cuadrícula).
 */
const TITULO = { font: "400 28px/1 'Instrument Serif',serif" } as const

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
  // (V15) La misma regla de portada que el Perfil y el resumen: lo que eligió el viajero; si no, una foto hecha en el destino (mejor de un sitio con logro); si no, la del destino. La foto, en grande.
  const reglaDePortada = usePortadaDeViaje(viaje?.id ?? pantalla.tripId, viaje?.destino ?? '', true, viaje?.route)
  const portada = reglaDePortada.url ?? ''
  const totalDias = viaje ? diasDelViaje(viaje.route) : 0
  // [Abrir el viaje] y tocar un día: las pantallas de logros y el Perfil se cierran y se ve el viaje.
  const salirAlViaje = (abrir: () => boolean) => {
    if (!viaje) return
    if (!abrir()) return
    useLogrosPantallas.getState().cerrarTodo()
    usePerfilUi.getState().cerrar()
  }
  return (
    <Capa etiqueta="ViajeGuardado">
      <main className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto pb-10" style={{ scrollbarWidth: 'none' }} data-viaje-guardado={pantalla.tripId}>
        <div className="relative flex-none text-[#FFFDF8]" style={{ height: 280, background: 'linear-gradient(160deg,#E7B98A,#B9764A 55%,#5E3A2A)' }}>
          {portada && <img src={portada} alt="" data-portada-grande className="absolute inset-0 h-full w-full object-cover" />}
          <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,12,20,.25),transparent 30%,transparent 40%,rgba(10,12,20,.7))' }} />
          <button type="button" onClick={() => useLogrosPantallas.getState().volver()} aria-label="Volver" className="absolute left-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF8]/90 text-[#1C2230]">
            <Icono nombre="atras" size={18} />
          </button>
          <span className="absolute bottom-[18px] left-5 flex flex-col gap-1.5">
            <span style={{ font: "400 46px/1 'Instrument Serif',serif" }}>{viaje?.destino ?? ''}</span>
            {viaje && (
              <span data-fechas-y-dias style={{ font: "500 13px 'Geist Mono',monospace" }}>
                {[viaje.cuando, totalDias > 0 ? textoDeDias(totalDias) : ''].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
        </div>

        {viaje && (
          <div className="flex-none px-4">
            <button type="button" onClick={() => salirAlViaje(() => abrirViajeEnRuta(viaje))} data-abrir-el-viaje className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold text-[#FFFDF8]" style={{ background: '#1C2230', boxShadow: 'inset 0 0 0 1.5px rgba(243,213,154,.5)' }}>
              Abrir el viaje
              <Icono nombre="adelante" size={16} grosor={2.2} />
            </button>
          </div>
        )}

        {dias.length > 0 && (
          <div className="flex flex-none flex-col gap-3">
            <span className="px-5" style={TITULO} data-titulo-tus-dias>
              Tus días
            </span>
            <div className="flex gap-2.5 overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }} data-tus-dias>
              {dias.map((d) => (
                <button key={d.id} type="button" onClick={() => viaje && salirAlViaje(() => abrirDiaDelViaje(viaje, d.id))} data-dia-del-viaje={d.dayNumber} className="flex h-[92px] w-[150px] flex-none flex-col items-start gap-1.5 rounded-[20px] bg-[#FFFDF8] px-3.5 py-3 text-left" style={{ boxShadow: '0 8px 18px -14px rgba(28,34,48,.45)' }}>
                  <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.1em', color: '#8A6A2C' }}>DÍA {d.dayNumber}</span>
                  <span className="overflow-hidden" style={{ font: "400 17px/1.1 'Instrument Serif',serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {tituloSinHorasSiYaNoEsVerdad(d.curatedTitle ?? d.title, d, null)}
                  </span>
                </button>
              ))}
              <span className="w-2 flex-none" />
            </div>
          </div>
        )}

        {fotos.length > 0 && (
          <div className="flex flex-none flex-col gap-3">
            <span className="px-5" style={TITULO} data-titulo-tus-fotos>
              Tus fotos
            </span>
            <div className="grid grid-cols-3 gap-2 px-4" data-tus-fotos>
              {fotos.map((f) => (
                <button key={f.id} type="button" onClick={() => setGrande(f)} aria-label={f.stopName ?? 'Foto del viaje'} className="aspect-square overflow-hidden rounded-2xl bg-[#1C2230]/10 p-0">
                  {urlParaMostrar(f) && <img src={urlParaMostrar(f)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {ganado.length > 0 && (
          <div className="flex flex-none flex-col gap-3">
            <span className="px-5" style={TITULO}>
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
              <button type="button" onClick={() => useLogrosPantallas.getState().abrir({ t: 'destino', destino: destinoClave })} className="mx-4 mt-1.5 h-[52px] flex-none rounded-full btn-champan text-[14.5px] font-semibold ">
                Ver todo {viaje.destino}
              </button>
            )}
          </div>
        )}
      </main>
      <FotoEnGrande foto={grande} onCerrar={() => setGrande(null)} />
    </Capa>
  )
}
