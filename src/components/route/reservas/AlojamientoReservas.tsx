import { useMemo, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { BloqueShell, CambiarBoton, FlechaBloque, GR, ICONOS, INK, Icono, IconoBloque, PastillaEstado, tituloBloqueStyle } from './BloqueReservas'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { TimeListWheel } from '../../ui/TimeListWheel'

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

/** La hoja de la zona (Tanda 6v): las zonas del destino en una rueda, como la de la hora, y [Guardar]. */
function HojaZona({ zonas, actual, onGuardar, onClose }: { zonas: DestinationExcursions['zonasAlojamiento']; actual: string | null; onGuardar: (id: string) => void; onClose: () => void }) {
  const [id, setId] = useState(() => (zonas.some((zona) => zona.id === actual) ? (actual as string) : (zonas[0]?.id ?? '')))
  const elegida = zonas.find((zona) => zona.id === id) ?? zonas[0]
  return (
    <HojaAbajo titleId="hoja-zona" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Alojamiento
      </p>
      <h2 id="hoja-zona" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        ¿En qué zona te alojas?
      </h2>
      <div className="mt-4">
        <TimeListWheel
          tipo="lista"
          label="Zona del alojamiento"
          items={zonas.map((zona) => zona.nombre)}
          value={elegida?.nombre ?? ''}
          onChange={(nombre) => setId(zonas.find((zona) => zona.nombre === nombre)?.id ?? id)}
        />
        <p className="mt-2 min-h-[18px] text-center text-[12px] text-text/55">{elegida?.sub ?? ''}</p>
      </div>
      <button type="button" onClick={() => elegida && onGuardar(elegida.id)} className="mt-3 h-12 w-full rounded-full bg-[#1C2230] text-[15px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]">
        Guardar
      </button>
    </HojaAbajo>
  )
}

/**
 * El bloque «Alojamiento» de RESERVAS (Tanda 6s y 6v). De pago: una línea «¿En qué zona te alojas?» con un campo que se toca («Elige tu zona ⌄»), que abre una hoja con las zonas en una rueda y [Guardar]; debajo del
 * campo, [Buscar alojamiento] como botón principal, que abre la hoja del mapa. Con una zona elegida el bloque se cierra («Te alojas en Prati · Cambiar», cuenta como hecho); con «Aún no lo sé» o sin elegir, el
 * campo y el botón siguen a la vista. Gratis: sin el campo, solo [Buscar alojamiento]. La zona se guarda con el viaje; todavía no cambia la ruta (la usará la Tanda 7).
 */
export function AlojamientoReservas({ route, info, pago }: { route: Route; info: DestinationExcursions; pago: boolean }) {
  const zona = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const setZona = useRouteStore((state) => state.setAccommodationZone)
  const [mapaAbierto, setMapaAbierto] = useState(false)
  const [zonaAbierta, setZonaAbierta] = useState(false)
  const ciudad = route.days[0]?.city ?? route.destination
  const zonas = info.zonasAlojamiento
  const elegida = zonas.find((candidate) => candidate.id === zona) ?? null
  const hecho = alojamientoHecho(elegida?.id)

  const hoja = mapaAbierto ? <HojaMapaAlojamiento route={route} ciudad={ciudad} mapa={info.mapaAlojamiento} onClose={() => setMapaAbierto(false)} /> : null
  const hojaZona = zonaAbierta ? (
    <HojaZona
      zonas={zonas}
      actual={zona}
      onGuardar={(id) => {
        setZona(id)
        setZonaAbierta(false)
      }}
      onClose={() => setZonaAbierta(false)}
    />
  ) : null
  const buscar = (
    <button
      type="button"
      onClick={() => setMapaAbierto(true)}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1C2230] text-[14.5px] font-semibold text-[#FFFDF8] transition-transform active:scale-[.98]"
    >
      <Icono d={ICONOS.lupa} size={15} stroke={2} />
      Buscar alojamiento
    </button>
  )

  // Con una zona elegida: la línea verde de siempre.
  if (pago && hecho) {
    return (
      <>
        <BloqueShell bloque="aloj">
          <div className="flex items-center gap-2.5 rounded-[22px] py-2.5 pl-3 pr-2" style={{ background: 'oklch(0.97 0.025 150)' }}>
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-white" style={{ background: GR }}>
              <Icono d={ICONOS.hotel} size={14} stroke={1.9} />
            </span>
            <span className="min-w-0 flex-1 text-[13px] leading-[1.4]" style={{ textWrap: 'pretty' as never }}>
              Te alojas en {elegida?.nombre}
            </span>
            <CambiarBoton onClick={() => setZonaAbierta(true)} />
          </div>
        </BloqueShell>
        {hojaZona}
        {hoja}
      </>
    )
  }

  return (
    <>
      <BloqueShell bloque="aloj">
        <div className="flex items-center gap-3 px-3.5 pt-3.5">
          <IconoBloque d={ICONOS.hotel} />
          <span className="min-w-0 flex-1" style={tituloBloqueStyle}>
            Alojamiento
          </span>
          {pago && <PastillaEstado texto="Falta" hecho={false} />}
        </div>
        <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-3">
          {pago ? (
            <>
              <span className="text-[14px] font-medium">¿En qué zona te alojas?</span>
              <button
                type="button"
                onClick={() => setZonaAbierta(true)}
                className="flex h-12 w-full items-center justify-between rounded-[14px] border border-text/15 bg-white px-3.5 text-left text-[14.5px]"
                style={{ color: elegida ? INK : 'rgba(28,34,48,.55)' }}
              >
                <span className="min-w-0 truncate">{elegida ? elegida.nombre : 'Elige tu zona'}</span>
                <FlechaBloque abierto={false} />
              </button>
            </>
          ) : (
            <span className="text-[13px] leading-[1.4] text-text/65">Busca dónde dormir en {ciudad}, con el mapa y las fechas de tu viaje.</span>
          )}
          {buscar}
        </div>
      </BloqueShell>
      {hojaZona}
      {hoja}
    </>
  )
}

/** ¿Está hecho el alojamiento? Con una zona elegida («Aún no lo sé» no cuenta). */
export const alojamientoHecho = (zona: string | null | undefined): boolean => Boolean(zona) && zona !== 'nose'
