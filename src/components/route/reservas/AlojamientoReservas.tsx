import { useMemo, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { BloqueShell, CambiarBoton, FlechaBloque, GR, ICONOS, INK, Icono, IconoBloque, PastillaEstado, tituloBloqueStyle } from './BloqueReservas'
import { HojaAbajo } from './HojaAbajo'

/**
 * El enlace del mapa de alojamientos (Tanda 6s): el de los datos del destino (`mapa_alojamiento`) con el primer día del viaje (`checkin`), el último (`checkout`) y el código de campaña del
 * viaje (`campaign`, «Routy» si no hay). Sin fechas, sin checkin ni checkout. Sin personas: se eligen dentro del mapa.
 */
export function mapaAlojamientoUrl(mapa: NonNullable<DestinationExcursions['mapaAlojamiento']>, route: Route, campaignCode: string | null): string {
  const base = mapa.usar === 'embed_guardado' && mapa.embed_guardado ? mapa.embed_guardado : mapa.embed
  const url = new URL(base)
  const rango = route.answers.dateRange
  if (rango?.start && rango?.end) {
    url.searchParams.set('checkin', rango.start)
    url.searchParams.set('checkout', rango.end)
  }
  url.searchParams.set('campaign', campaignCode || 'Routy')
  return url.toString()
}

/** La hoja «Alojamiento en Roma»: sube desde abajo con su tirador y su cruz y lleva el mapa de alojamientos dentro, a lo ancho. */
export function HojaMapaAlojamiento({ route, ciudad, mapa, onClose }: { route: Route; ciudad: string; mapa: DestinationExcursions['mapaAlojamiento']; onClose: () => void }) {
  const campaignCode = useRouteStore((state) => state.campaignCode)
  const url = useMemo(() => (mapa ? mapaAlojamientoUrl(mapa, route, campaignCode) : null), [mapa, route, campaignCode])
  return (
    <HojaAbajo titleId="hoja-alojamiento" onClose={onClose} ancha>
      <h2 id="hoja-alojamiento" className="max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        Alojamiento en {ciudad}
      </h2>
      <div className="mt-3.5 overflow-hidden rounded-[22px] bg-[#F5EFE4]" style={{ height: 428 }}>
        {url ? (
          <iframe title={`Alojamientos en ${ciudad}`} src={url} className="h-full w-full border-0" loading="lazy" allow="geolocation" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-text/60">Todavía no tenemos el mapa de alojamientos de este destino.</div>
        )}
      </div>
    </HojaAbajo>
  )
}

/**
 * El bloque «Alojamiento» de RESERVAS (Tanda 6s). Gratis: una fila que abre la hoja del mapa. De pago: un desplegable con las zonas del destino; con una zona, una línea verde («Te alojas en
 * Prati · Cambiar», cuenta como hecho); con «Aún no lo sé», sin verde y con [Buscar alojamiento]. La zona se guarda con el viaje; todavía no cambia la ruta (la usará la Tanda 7).
 */
export function AlojamientoReservas({
  route,
  info,
  pago,
  abierto,
  onToggle,
  onAbrir,
  onCerrar,
}: {
  route: Route
  info: DestinationExcursions
  pago: boolean
  abierto: boolean
  onToggle: () => void
  onAbrir: () => void
  onCerrar: () => void
}) {
  const zona = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const setZona = useRouteStore((state) => state.setAccommodationZone)
  const [mapaAbierto, setMapaAbierto] = useState(false)
  const ciudad = route.days[0]?.city ?? route.destination
  const zonas = info.zonasAlojamiento
  const elegida = zonas.find((candidate) => candidate.id === zona) ?? null
  const noSabe = elegida?.id === 'nose'
  const hecho = Boolean(elegida) && !noSabe

  const hoja = mapaAbierto ? <HojaMapaAlojamiento route={route} ciudad={ciudad} mapa={info.mapaAlojamiento} onClose={() => setMapaAbierto(false)} /> : null

  if (!pago) {
    return (
      <>
        <BloqueShell bloque="aloj">
          <div onClick={() => setMapaAbierto(true)} className="flex cursor-pointer items-center gap-3 p-3.5">
            <IconoBloque d={ICONOS.hotel} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span style={tituloBloqueStyle}>Alojamiento</span>
              <span className="text-[12px] text-text/60">Buscar alojamiento en {ciudad}</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
        </BloqueShell>
        {hoja}
      </>
    )
  }

  const buscar = (extra = '') => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        setMapaAbierto(true)
      }}
      className={`flex items-center gap-[7px] rounded-full font-semibold ${extra}`}
    >
      <Icono d={ICONOS.lupa} size={13} stroke={2} />
      Buscar alojamiento
    </button>
  )

  return (
    <>
      <BloqueShell bloque="aloj">
        {!abierto && !elegida ? (
          <div onClick={onAbrir} className="flex cursor-pointer items-center gap-3 p-3.5">
            <IconoBloque d={ICONOS.hotel} />
            <span className="min-w-0 flex-1" style={tituloBloqueStyle}>
              Alojamiento
            </span>
            <PastillaEstado texto="Falta" hecho={false} />
            <FlechaBloque abierto={false} />
          </div>
        ) : !abierto && hecho ? (
          <div className="flex items-center gap-2.5 rounded-[22px] py-2.5 pl-3 pr-2" style={{ background: 'oklch(0.97 0.025 150)' }}>
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-white" style={{ background: GR }}>
              <Icono d={ICONOS.hotel} size={14} stroke={1.9} />
            </span>
            <span className="min-w-0 flex-1 text-[13px] leading-[1.4]" style={{ textWrap: 'pretty' as never }}>
              Te alojas en {elegida?.nombre}
            </span>
            <CambiarBoton onClick={onAbrir} />
          </div>
        ) : !abierto ? (
          <div className="flex items-center gap-2.5 py-3 pl-3 pr-2">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#F1EADC] text-text/70">
              <Icono d={ICONOS.hotel} size={14} stroke={1.9} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
              <span className="text-[13px] leading-[1.4]">Aún no sabes dónde te alojas</span>
              {buscar('h-9 bg-[#1C2230] pl-3 pr-3.5 text-[12.5px] text-[#FFFDF8]')}
            </span>
            <CambiarBoton onClick={onAbrir} />
          </div>
        ) : (
          <>
            <div onClick={onToggle} className="flex cursor-pointer items-center gap-3 px-3.5 pb-2.5 pt-3.5">
              <IconoBloque d={ICONOS.hotel} hecho={hecho} />
              <span className="min-w-0 flex-1" style={tituloBloqueStyle}>
                Alojamiento
              </span>
              <PastillaEstado texto={hecho ? '✓ Listo' : 'Falta'} hecho={hecho} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </div>
            <div className="flex flex-col gap-2.5 px-3.5 pb-3.5">
              <span className="text-[14px] font-medium">¿En qué zona te alojas?</span>
              <div className="flex flex-wrap gap-1.5">
                {zonas.map((candidate) => {
                  const activa = candidate.id === zona
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => {
                        setZona(candidate.id)
                        onCerrar()
                      }}
                      className="flex min-h-10 flex-col items-start justify-center gap-px rounded-[14px] px-3 py-[5px] text-left transition-colors"
                      style={{ border: `1.5px solid ${activa ? INK : 'rgba(28,34,48,.12)'}`, background: activa ? INK : '#FFFFFF', color: activa ? '#FFFDF8' : INK }}
                    >
                      <span className="text-[13px] font-semibold leading-[1.1]">{candidate.nombre}</span>
                      {candidate.sub && <span className="text-[10.5px] leading-[1.15] opacity-70">{candidate.sub}</span>}
                    </button>
                  )
                })}
              </div>
              {noSabe && buscar('h-10 self-start border border-text/15 bg-white pl-3 pr-3.5 text-[13px] text-text')}
            </div>
          </>
        )}
      </BloqueShell>
      {hoja}
    </>
  )
}

/** ¿Está hecho el alojamiento? Con una zona elegida («Aún no lo sé» no cuenta). */
export const alojamientoHecho = (zona: string | null | undefined): boolean => Boolean(zona) && zona !== 'nose'
