import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route } from '../../../lib/types'
import { buildCombinedDaysLines, buildCombinedDaysMarkers } from '../../../lib/routeMapMarkers'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { useArrivalMarkers } from '../../../lib/useArrivalMarkers'
import { StopsMapView, type StopsMapMarker, type StopsMapMarkerLine } from '../../map/StopsMapView'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { construirFicha, nombreDeZona } from '../../../lib/fichaLlegada'
import { direccionDelAlojamiento } from '../../../lib/direccionAlojamiento'
import { esDiaDeLlegada, paradasParaElTitulo } from '../../../lib/tituloDelDia'
import { displayStopName } from '../../../lib/format'
import { ARRIVAL_MARKER_BG, ARRIVAL_MARKER_TEXT } from '../../../lib/arrivalIcon'
import { FichaResumen } from './FichaResumen'
import {
  puntoDeLaMitad,
  puntoCorto,
  type ArrivalInfo,
  type ArrivalMedio,
  type ArrivalMode,
  type ArrivalOption,
  type ArrivalPoint,
  type ArrivalTip,
} from '../../../lib/arrivalReturn'
import { openTicketShop } from '../reservas/EntradaCard'
import { usePagoActivo } from '../../../lib/pago'
import { useEnlaceDeTraslados } from '../../../lib/enlaceDeTraslados'
import { ARRIVAL_PETROL, ModeIcon } from './ArrivalReturnBar'
import { Icono } from '../../ui/Icono'

type Tab = 'resumen' | 'traslados' | 'tips'

const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** "MAR 29 SEP" */
function eyebrowDate(dateIso: string | null): string | null {
  if (!dateIso) return null
  const [year, month, day] = dateIso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return `${WEEKDAYS[date.getUTCDay()]} ${day} ${MONTHS[month - 1]}`
}

const BOOKING_NAME: Record<ArrivalMode, string> = { avion: 'Vuelo', tren: 'Tren', bus: 'Autobús', ferry: 'Ferry', coche: 'En coche' }
const ADD_LABEL: Record<ArrivalMode, string> = { avion: 'Añadir vuelo', tren: 'Añadir tren', bus: 'Añadir autobús', ferry: 'Añadir ferry', coche: '' }
/** El traslado privado solo sale donde llegas lejos de la ciudad: aeropuerto y puerto (no en tren, autobús ni coche). */
const TRASLADO_EN: ArrivalMode[] = ['avion', 'ferry']

export interface ArrivalReturnSheetProps {
  open: boolean
  kind: 'llegada' | 'vuelta'
  /** El viaje: arriba va su mapa entero, el de la pestaña Ruta (PROMPT_UI_REPASO 9). */
  route: Route
  mode: ArrivalMode
  info: ArrivalInfo
  medio: ArrivalMedio | null
  origin: string
  dateIso: string | null
  /** La hora de la reserva (vuelo, tren, a bordo…) o null. */
  time: string | null
  /** El punto elegido en RESERVAS (de pago) o null: sin él se enseñan todos. */
  pointId: string | null
  onEditBooking: () => void
  onClose: () => void
  /** [Explorar restaurantes] de «la comida al llegar»: cierra la ficha y abre EXPLORAR › Restaurantes (con «Recomendados» y «Cerca de mí»). */
  onExplorarRestaurantes?: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-text/55">{title}</h4>
      {children}
    </section>
  )
}

function OptionRow({ option }: { option: ArrivalOption }) {
  const line = [option.tiempo, option.frecuencia].filter(Boolean).join(' · ')
  return (
    <div className="space-y-1 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {option.mas_comodo && (
            <span className="mb-1 inline-flex h-[18px] items-center rounded-full px-2 font-mono text-[9.5px] font-semibold tracking-[.08em] text-white" style={{ background: ARRIVAL_PETROL }}>
              EL MÁS CÓMODO
            </span>
          )}
          <p className="text-[14px] font-medium leading-snug text-text">{option.nombre}</p>
        </div>
        {option.precio && <p className="shrink-0 whitespace-nowrap font-mono text-[12px] font-semibold text-text">{option.precio}</p>}
      </div>
      {line && <p className="text-[12.5px] leading-snug text-text/65">{line}</p>}
      {option.nota && <p className="text-[12.5px] leading-snug text-text/55">{option.nota}</p>}
    </div>
  )
}

function OptionList({ options }: { options: ArrivalOption[] }) {
  // La más cómoda, la primera.
  const sorted = [...options].sort((a, b) => Number(Boolean(b.mas_comodo)) - Number(Boolean(a.mas_comodo)))
  return <div className="divide-y divide-text/[.08] rounded-2xl border border-text/[.10] bg-bg-card">{sorted.map((option) => <OptionRow key={option.nombre} option={option} />)}</div>
}

function InfoBlock({ block }: { block?: { titulo?: string; texto: string } }) {
  if (!block) return null
  return (
    <Section title={block.titulo ?? ''}>
      <p className="text-[13.5px] leading-relaxed text-text/75">{block.texto}</p>
    </Section>
  )
}

/** La tarjeta de un traslado privado (Tanda 6t), con el estilo de la tarjeta de entrada de RESERVAS. Nunca el nombre del proveedor y sin precio (el enlace no lo da). */
function TrasladoCard({ title, href }: { title: string; href: string }) {
  const rosa = 'rgb(var(--accent))'
  return (
    <div className="relative flex min-h-[104px] w-full bg-white" style={{ borderRadius: 18, border: '1px solid rgba(28,34,48,.08)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 26px -18px rgba(28,34,48,.4)' }}>
      <div className="relative w-[74px] shrink-0 overflow-hidden text-white" style={{ borderRadius: '17px 0 0 17px' }}>
        <span aria-hidden="true" className="absolute inset-0" style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%)', background: rosa }} />
        <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 flex w-[58px] items-center justify-center">
          <ModeIcon mode="coche" size={22} />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[5px] py-3 pl-2.5 pr-3.5">
        <span className="flex items-center gap-1.5 text-text/50" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(28,34,48,.35)' }} />
          Traslado privado
        </span>
        <span className="font-display text-text [overflow-wrap:anywhere]" style={{ fontSize: 18, lineHeight: 1.08 }}>
          {title}
        </span>
        <span className="text-text/60" style={{ font: "400 11.5px 'Geist'", lineHeight: 1.3 }}>
          Puerta a puerta · sin trasbordos
        </span>
        <span className="mt-0.5 flex">
          <button
            type="button"
            onClick={() => openTicketShop(href, 'Abriendo la tienda de traslados…')}
            className="zona-toque btn-champan h-8 whitespace-nowrap rounded-full px-3.5 transition-transform active:scale-[.97]"
            style={{ font: "600 12.5px 'Geist'" }}
          >
            Reservar traslado
          </button>
        </span>
      </div>
    </div>
  )
}

function TipList({ tips }: { tips: ArrivalTip[] }) {
  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <div key={tip.titulo} className="rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-3">
          <p className="text-[14px] font-semibold text-text">{tip.titulo}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-text/70">{tip.texto}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * La llegada o la vuelta abiertas (PROMPT_UI, Parte 3): el mapa del viaje arriba (PROMPT_UI_REPASO 9: antes, una foto), X, «LLEGADA · MAR 29 SEP», el título y la reserva
 * con «Editar». Pestañas Resumen / Traslados / Tips, con el contenido del medio (data/dias/<destino>/_llegada.json):
 * a la llegada, todas las formas de ir al centro (la más cómoda primero), la estación y la consigna;
 * a la vuelta, la última tarde (solo su texto), las formas de ir al aeropuerto o la estación, la maleta y la última hora. Sin fuentes y sin
 * ninguna hora que calcule la app (Tanda 6t). Traslados, solo en aeropuerto y puerto, con el enlace del punto.
 */
export function ArrivalReturnSheet(props: ArrivalReturnSheetProps) {
  const { open, kind, route, mode, info, medio, origin, dateIso, time, pointId, onEditBooking, onClose, onExplorarRestaurantes } = props
  const [tab, setTab] = useState<Tab>('resumen')

  const pago = usePagoActivo()
  const [verOtro, setVerOtro] = useState(false)
  const points = medio?.puntos ?? []
  // (Tanda 7: con la hora puesta y sin punto elegido —un viaje de antes—, el del traslado más largo de ese medio.)
  const chosen: ArrivalPoint | null = puntoDeLaMitad(medio, pointId, Boolean(time)).point
  const otro: ArrivalPoint | null = chosen ? (points.find((point) => point.id !== chosen.id) ?? null) : null
  // De pago y con el punto elegido, solo ese punto (o el otro, si el viajero lo quiere mirar); sin elegir, o en la versión gratis, todos.
  const shownPoints: ArrivalPoint[] = pago && chosen ? [verOtro && otro ? otro : chosen] : points

  useEffect(() => {
    if (open) {
      setTab('resumen')
      setVerOtro(false)
    }
  }, [open, kind])

  // Arriba, el mapa del viaje entero (el de la pestaña Ruta): los días con sus líneas y el punto de llegada.
  const segments = buildDestinationSegments(route.days)
  const arrivalMarkers = useArrivalMarkers(route, segments)

  // LA FICHA (Tanda 7, de pago y con la hora puesta): el resumen del diseño, con «Para tu zona». Sin hora, o en la gratis, la información general de siempre.
  const destino = useDestinationExcursions(route.destination)
  const puntoDeLaFicha: ArrivalPoint | null = shownPoints.length === 1 ? shownPoints[0] : null
  // El día que lleva la llegada (el primero, o el que el motor marca como día 1) y lo que dice de su comida y de su primera parada.
  const diaLlegada = route.days.find((day) => esDiaDeLlegada(route, day)) ?? route.days[0] ?? null
  const comidaAlLlegar = Boolean(diaLlegada?.meals.some((meal) => meal.noRestaurant)) || Boolean(diaLlegada?.arrivalDay?.comida_al_llegar)
  const primeraParada = diaLlegada && !diaLlegada.arrivalDay?.sin_paradas ? (paradasParaElTitulo(diaLlegada)[0]?.name ?? null) : null
  const ficha = useMemo(() => {
    if (!pago || !time || !medio || !puntoDeLaFicha || mode === 'coche') return null
    return construirFicha({
      kind,
      mode,
      info,
      medio,
      point: puntoDeLaFicha,
      hora: time,
      dateIso,
      mes: route.answers.month ?? null,
      zonaId: route.accommodationZone ?? null,
      zonas: destino.zonasAlojamiento,
      comidaAlLlegar,
      primeraParada: primeraParada ? displayStopName(primeraParada) : null,
    })
  }, [pago, time, medio, puntoDeLaFicha, mode, kind, info, dateIso, route.answers.month, route.accommodationZone, destino.zonasAlojamiento, comidaAlLlegar, primeraParada])
  // El mapa pequeño de arriba (el punto, Termini si pasa por allí y su zona): solo con la ficha.
  const mapaDeLaFicha = useMemo(() => {
    if (!ficha || !puntoDeLaFicha?.coordenadas) return null
    const markers: StopsMapMarker[] = [
      { id: 'ficha-punto', name: puntoCorto(puntoDeLaFicha), coordinates: puntoDeLaFicha.coordenadas, number: 0, bg: ARRIVAL_MARKER_BG, text: ARRIVAL_MARKER_TEXT, icon: mode === 'avion' ? 'avion' : mode === 'ferry' ? 'barco' : mode === 'bus' ? 'bus' : 'tren' },
    ]
    const termini = Object.values(info.medios).flatMap((m) => m?.puntos ?? []).find((point) => point.id === 'termini')?.coordenadas ?? null
    const zona = destino.zonasAlojamiento.find((candidate) => candidate.id === (route.accommodationZone ?? ''))
    if (termini && ficha.pasaPorTermini) markers.push({ id: 'ficha-termini', name: 'Termini', coordinates: termini, number: 0, bg: '#FFFDF8', text: '#1C2230', icon: 'T' })
    if (zona?.coordinates && !ficha.sinZona) markers.push({ id: 'ficha-zona', name: nombreDeZona(zona.nombre), coordinates: zona.coordinates, number: 0, bg: '#6F4E37', text: '#ffffff', icon: 'casa' })
    const camino = markers.map((marker) => marker.coordinates)
    const lines: StopsMapMarkerLine[] = camino.length > 1 ? [{ id: 'ficha-camino', coordinates: camino, color: '#1C2230', dashed: true, width: 3 }] : []
    return { markers, lines }
  }, [ficha, puntoDeLaFicha, mode, info, destino.zonasAlojamiento, route.accommodationZone])

  if (!medio) return null
  const arrival = kind === 'llegada'
  const title = arrival ? medio.textos.llegada_titulo : medio.textos.vuelta_titulo.replace('{origen}', origin)
  // Con un solo punto a la vista, su propio texto (Tiburtina no es Termini); con varios, el del medio.
  const onePoint = shownPoints.length === 1 ? shownPoints[0] : null
  const why = (arrival ? onePoint?.por_que_llegada : onePoint?.por_que_vuelta) ?? (arrival ? medio.textos.llegada_por_que : medio.textos.vuelta_por_que)
  // La pestaña «Traslados» (Tanda 6t): solo en aeropuerto y puerto, y solo con el punto que tenga enlace de traslado en los datos. Con el punto elegido en RESERVAS, el de ese punto; sin elegir, los de todos.
  // (Parte 1 de la API de consulta, con el interruptor encendido: el enlace de traslados del destino; si la API no lo da, el de los datos de siempre.)
  const enlaceDeTraslados = useEnlaceDeTraslados(route.destination)
  const privatePoints = TRASLADO_EN.includes(mode) ? shownPoints.filter((point) => point.traslado?.url || enlaceDeTraslados) : []
  // Un tip de un punto (`solo_en`) sale solo si ese punto está a la vista (con reserva, el elegido; sin ella, todos); uno con fecha de fin (`hasta`), solo hasta
  // esa fecha (la del viaje o, sin ella, la de hoy).
  const tipDate = dateIso ?? new Date().toISOString().slice(0, 10)
  const tips = (arrival ? medio.tips_llegada : medio.tips_vuelta).filter(
    (tip) => (!tip.solo_en || shownPoints.some((point) => tip.solo_en!.includes(point.id))) && (!tip.hasta || tipDate <= tip.hasta),
  )
  const tabs: Tab[] = ['resumen', ...(privatePoints.length > 0 ? (['traslados'] as const) : []), ...(tips.length > 0 ? (['tips'] as const) : [])]
  const activeTab = tabs.includes(tab) ? tab : 'resumen'
  const eyebrow = [arrival ? 'LLEGADA' : 'VUELTA', eyebrowDate(dateIso)].filter(Boolean).join(' · ')
  const bookingLine = time ? `${BOOKING_NAME[mode]} ${time}${chosen ? ` · ${chosen.nombre}` : ''}` : null
  // La estación, la consigna, la maleta y «Tu última hora» hablan de Termini: solo si lo que se ve pasa por Termini.
  const viaTermini = mode !== 'coche' && shownPoints.every((point) => point.termini !== false)

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="flex-1 overflow-y-auto">
            <div className="relative h-[30vh] min-h-[180px] w-full overflow-hidden bg-bg-hover">
              {mapaDeLaFicha ? (
                <StopsMapView markers={mapaDeLaFicha.markers} lines={mapaDeLaFicha.lines} />
              ) : (
                <StopsMapView markers={[...buildCombinedDaysMarkers(route.days), ...arrivalMarkers]} lines={buildCombinedDaysLines(route.days)} />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="zona-toque absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-accent bg-bg-card text-[18px] text-text shadow-md hover:bg-bg-card"
              >
                <Icono nombre="cerrar" size={14} />
              </button>
            </div>

            <div className="mx-auto w-full max-w-lg space-y-5 px-4 pb-10 pt-5">
              <div className="space-y-2">
                <p className="font-mono text-[11px] font-semibold tracking-[.1em] text-text/55">{eyebrow}</p>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: ARRIVAL_PETROL }}>
                    <ModeIcon mode={mode} size={20} />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <h1 className="font-display text-[28px] leading-[1.05] text-text">{title}</h1>
                    <p className="text-[13px] text-text/60">{arrival ? medio.textos.llegada_sub : medio.textos.vuelta_sub}</p>
                  </div>
                </div>
                {/* (Tanda 10G: guardar el vuelo o el tren es GRATIS: la fila «+ Añadir vuelo» / «Editar» sale en las dos versiones.) */}
                {mode !== 'coche' && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-2.5">
                    {/* Los datos se cortan si no caben; la hora clave, nunca. */}
                    <p className="flex min-w-0 items-center gap-1.5 font-mono text-[12px] font-medium uppercase tracking-[.05em] text-text/75 max-[479px]:text-[11px] max-[479px]:tracking-[.02em]">
                      <span className="min-w-0 truncate">{bookingLine ?? `Sin ${BOOKING_NAME[mode].toLowerCase()} añadido`}</span>
                    </p>
                    <button type="button" onClick={onEditBooking} className={`shrink-0 text-[13px] font-semibold ${time ? 'text-accent' : 'text-[#2563A8]'} hover:underline`}>
                      {time ? 'Editar' : `+ ${ADD_LABEL[mode]}`}
                    </button>
                  </div>
                )}
              </div>

              {tabs.length > 1 && (
                <div className="flex gap-1 rounded-full bg-text/[.06] p-1">
                  {tabs.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTab(item)}
                      className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold transition-colors ${activeTab === item ? 'bg-bg-card text-text shadow-sm' : 'text-text/55 hover:text-text'}`}
                    >
                      {item === 'resumen' ? 'Resumen' : item === 'traslados' ? 'Traslados' : 'Tips'}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'resumen' && ficha && (
                <FichaResumen
                  ficha={ficha}
                  direccion={direccionDelAlojamiento(route)}
                  onReservarTraslado={privatePoints.length > 0 && tabs.includes('traslados') ? () => setTab('traslados') : undefined}
                  onExplorarRestaurantes={() => onExplorarRestaurantes?.()}
                />
              )}

              {activeTab === 'resumen' && !ficha && (
                <div className="space-y-6">
                  <p className="text-[13.5px] leading-relaxed text-text/75">{why}</p>

                  {!arrival && info.ultima_tarde && mode !== 'coche' && (
                    <Section title="Tu última tarde, sin prisas">
                      <p className="text-[13.5px] leading-relaxed text-text/75">{info.ultima_tarde.texto}</p>
                    </Section>
                  )}

                  {shownPoints.map((point) => {
                    const options = arrival ? point.al_centro : point.a_la_salida && point.a_la_salida.length > 0 ? point.a_la_salida : point.al_centro
                    const heading =
                      mode === 'coche'
                        ? 'La ZTL y dónde aparcar'
                        : arrival
                          ? `De ${point.nombre} a tu alojamiento`
                          : `De tu alojamiento a ${point.nombre}`
                    return (
                      <Section key={point.id} title={heading}>
                        {point.distancia && <p className="-mt-1 text-[12px] text-text/55">{point.distancia}</p>}
                        <OptionList options={options} />
                      </Section>
                    )
                  })}

                  {arrival && viaTermini && <InfoBlock block={info.estacion_alojamiento} />}
                  {arrival && viaTermini && <InfoBlock block={info.consigna} />}
                  {!arrival && viaTermini && <InfoBlock block={info.maleta} />}

                  {!arrival && viaTermini && info.ultima_hora && info.ultima_hora.length > 0 && (
                    <Section title="Tu última hora">
                      <div className="space-y-2">
                        {info.ultima_hora.map((place) => (
                          <div key={place.nombre} className="rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-3">
                            <p className="text-[14px] font-medium text-text">{place.nombre}</p>
                            <p className="text-[12.5px] leading-snug text-text/60">{place.texto}</p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}

              {activeTab === 'traslados' && (
                <div className="space-y-3">
                  <p className="text-[13.5px] leading-relaxed text-text/75">
                    {arrival
                      ? `¿Vienes en familia, en grupo o en pareja y quieres aprovechar ${info.ciudad} al máximo? Con un traslado privado te esperan a la salida con tu nombre y te dejan en la puerta de tu alojamiento o donde tú quieras. Sin colas, sin trasbordos y sin cargar con las maletas.`
                      : `El último día, sin trasbordos ni maletas por el metro: un traslado privado te recoge en tu alojamiento y te lleva directo a ${privatePoints.map(puntoCorto).join(' o ')}. Ideal si vais en familia, en grupo o en pareja.`}
                  </p>
                  {privatePoints.map((point) => (
                    <TrasladoCard key={point.id} title={arrival ? `De ${puntoCorto(point)} a tu alojamiento` : `De tu alojamiento a ${puntoCorto(point)}`} href={enlaceDeTraslados ?? point.traslado!.url} />
                  ))}
                </div>
              )}

              {activeTab === 'tips' && <TipList tips={tips} />}
              {pago && chosen && otro && mode !== 'coche' && (
                <p className="pt-1 text-center text-[12px] text-text/60">
                  {verOtro ? '¿Prefieres el tuyo?' : '¿Llegas por otro sitio?'}{' '}
                  <button type="button" onClick={() => setVerOtro((value) => !value)} className="font-semibold text-text underline underline-offset-2">
                    Ver {puntoCorto(verOtro ? chosen : otro)}
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
