import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Route } from '../../../lib/types'
import { buildCombinedDaysLines, buildCombinedDaysMarkers } from '../../../lib/routeMapMarkers'
import { buildDestinationSegments } from '../../../lib/destinationSegments'
import { useArrivalMarkers } from '../../../lib/useArrivalMarkers'
import { StopsMapView } from '../../map/StopsMapView'
import {
  minutesToHHMM,
  type ArrivalInfo,
  type ArrivalMedio,
  type ArrivalMode,
  type ArrivalOption,
  type ArrivalPoint,
  type ArrivalTip,
} from '../../../lib/arrivalReturn'
import { Button } from '../../ui/Button'
import { ARRIVAL_PETROL, ModeIcon } from './ArrivalReturnBar'

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
  /** El punto elegido (con reserva) o null: sin reserva se enseñan todos. */
  pointId: string | null
  onPickPoint: (pointId: string) => void
  /** Hora en el centro (llegada) o de salir (vuelta), en minutos; null sin reserva. */
  keyMinutes: number | null
  /** La primera parada del día, con su número del mapa y cómo llegar. */
  firstStop: { number: number | null; name: string; howTo: string } | null
  onEditBooking: () => void
  onClose: () => void
}

function formatPrivatePrice(precio: number, moneda: string): string {
  return `${precio.toLocaleString('es-ES')} ${moneda === 'EUR' ? '€' : moneda}`
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-text/55">{title}</h4>
      {children}
    </section>
  )
}

function SourceLink({ href }: { href?: string | null }) {
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-text/45 underline underline-offset-2 hover:text-text/70">
      Fuente
    </a>
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
      <SourceLink href={option.fuente} />
    </div>
  )
}

function OptionList({ options }: { options: ArrivalOption[] }) {
  // La más cómoda, la primera.
  const sorted = [...options].sort((a, b) => Number(Boolean(b.mas_comodo)) - Number(Boolean(a.mas_comodo)))
  return <div className="divide-y divide-text/[.08] rounded-2xl border border-text/[.10] bg-bg-card">{sorted.map((option) => <OptionRow key={option.nombre} option={option} />)}</div>
}

function InfoBlock({ block }: { block?: { titulo?: string; texto: string; fuente?: string } }) {
  if (!block) return null
  return (
    <Section title={block.titulo ?? ''}>
      <p className="text-[13.5px] leading-relaxed text-text/75">{block.texto}</p>
      <SourceLink href={block.fuente} />
    </Section>
  )
}

function TipList({ tips }: { tips: ArrivalTip[] }) {
  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <div key={tip.titulo} className="rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-3">
          <p className="text-[14px] font-semibold text-text">{tip.titulo}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-text/70">{tip.texto}</p>
          {tip.fuente && (
            <div className="mt-1">
              <SourceLink href={tip.fuente} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * La llegada o la vuelta abiertas (PROMPT_UI, Parte 3): el mapa del viaje arriba (PROMPT_UI_REPASO 9: antes, una foto), X, «LLEGADA · MAR 29 SEP», el título y la reserva
 * con «Editar». Pestañas Resumen / Traslados / Tips, con el contenido del medio (data/dias/<destino>/_llegada.json):
 * a la llegada, todas las formas de ir al centro (la más cómoda primero), la estación, la consigna y la primera parada;
 * a la vuelta, la última tarde, las formas de ir al aeropuerto o la estación, la maleta y la última hora. Cada precio
 * con su fuente. Traslados, solo si ese punto tiene traslado privado (nunca en coche).
 */
export function ArrivalReturnSheet(props: ArrivalReturnSheetProps) {
  const { open, kind, route, mode, info, medio, origin, dateIso, time, pointId, onPickPoint, keyMinutes, firstStop, onEditBooking, onClose } = props
  const [tab, setTab] = useState<Tab>('resumen')

  const points = medio?.puntos ?? []
  const chosen: ArrivalPoint | null = points.find((point) => point.id === pointId) ?? null
  // Con reserva, un punto (el elegido o el primero); sin reserva, todos.
  const shownPoints: ArrivalPoint[] = time ? [chosen ?? points[0]].filter(Boolean) : points

  useEffect(() => {
    if (open) setTab('resumen')
  }, [open, kind])

  // Arriba, el mapa del viaje entero (el de la pestaña Ruta): los días con sus líneas y el punto de llegada.
  const segments = buildDestinationSegments(route.days)
  const arrivalMarkers = useArrivalMarkers(route, segments)

  if (!medio) return null
  const arrival = kind === 'llegada'
  const title = arrival ? medio.textos.llegada_titulo : medio.textos.vuelta_titulo.replace('{origen}', origin)
  // Con un solo punto a la vista, su propio texto (Tiburtina no es Termini); con varios, el del medio.
  const onePoint = shownPoints.length === 1 ? shownPoints[0] : null
  const why = (arrival ? onePoint?.por_que_llegada : onePoint?.por_que_vuelta) ?? (arrival ? medio.textos.llegada_por_que : medio.textos.vuelta_por_que)
  // Sin enlace de afiliado, el traslado privado no sale a la venta (PARA_CODE_LLEGADAS, 5).
  const privatePoints = mode === 'coche' ? [] : shownPoints.filter((point) => point.privado && point.privado.url_afiliado && point.privado.url_afiliado !== '#')
  // Un tip de un punto (`solo_en`) sale solo si ese punto está a la vista (con reserva, el elegido; sin ella, todos); uno con fecha de fin (`hasta`), solo hasta
  // esa fecha (la del viaje o, sin ella, la de hoy).
  const tipDate = dateIso ?? new Date().toISOString().slice(0, 10)
  const tips = (arrival ? medio.tips_llegada : medio.tips_vuelta).filter(
    (tip) => (!tip.solo_en || shownPoints.some((point) => tip.solo_en!.includes(point.id))) && (!tip.hasta || tipDate <= tip.hasta),
  )
  const tabs: Tab[] = ['resumen', ...(privatePoints.length > 0 ? (['traslados'] as const) : []), ...(tips.length > 0 ? (['tips'] as const) : [])]
  const activeTab = tabs.includes(tab) ? tab : 'resumen'
  const eyebrow = [arrival ? 'LLEGADA' : 'VUELTA', eyebrowDate(dateIso)].filter(Boolean).join(' · ')
  const bookingLine = time ? `${BOOKING_NAME[mode]} ${time}${shownPoints[0] ? ` · ${shownPoints[0].nombre}` : ''}` : null
  // La estación, la consigna, la maleta y «Tu última hora» hablan de Termini: solo si lo que se ve pasa por Termini.
  const viaTermini = mode !== 'coche' && shownPoints.every((point) => point.termini !== false)

  // La última tarde: libre hasta 15 min antes de recoger la maleta, la maleta 30 min antes de salir, y salir.
  const lastAfternoon =
    !arrival && keyMinutes != null
      ? [
          { label: 'Libre hasta', value: minutesToHHMM(keyMinutes - 45) },
          { label: 'Maleta a las', value: minutesToHHMM(keyMinutes - 30) },
          { label: 'Sal a las', value: minutesToHHMM(keyMinutes) },
        ]
      : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
          <div className="flex-1 overflow-y-auto">
            <div className="relative h-[30vh] min-h-[180px] w-full overflow-hidden bg-bg-hover">
              <StopsMapView markers={[...buildCombinedDaysMarkers(route.days), ...arrivalMarkers]} lines={buildCombinedDaysLines(route.days)} />
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg-card/95 text-[18px] text-text shadow-md hover:bg-bg-card"
              >
                ✕
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
                {mode !== 'coche' && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-2.5">
                    {/* Los datos se cortan si no caben; la hora clave, nunca. */}
                    <p className="flex min-w-0 items-center gap-1.5 font-mono text-[12px] font-medium uppercase tracking-[.05em] text-text/75 max-[479px]:text-[11px] max-[479px]:tracking-[.02em]">
                      <span className="min-w-0 truncate">{bookingLine ?? `Sin ${BOOKING_NAME[mode].toLowerCase()} añadido`}</span>
                      {time && keyMinutes != null && (
                        <span className="shrink-0 whitespace-nowrap text-accent">
                          {arrival ? `En el centro ${minutesToHHMM(keyMinutes)}` : `Sal a las ${minutesToHHMM(keyMinutes)}`}
                        </span>
                      )}
                    </p>
                    <button type="button" onClick={onEditBooking} className={`shrink-0 text-[13px] font-semibold ${time ? 'text-accent' : 'text-[#2563A8]'} hover:underline`}>
                      {time ? 'Editar' : `+ ${ADD_LABEL[mode]}`}
                    </button>
                  </div>
                )}
                {/* Con reserva: ¿a cuál de los puntos llegas? (Fiumicino o Ciampino). */}
                {time && points.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {points.map((point) => (
                      <button
                        key={point.id}
                        type="button"
                        onClick={() => onPickPoint(point.id)}
                        className={`rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
                          point.id === (chosen ?? points[0]).id ? 'border-text bg-text text-bg' : 'border-text/20 text-text/70 hover:border-text/40'
                        }`}
                      >
                        {point.nombre}
                      </button>
                    ))}
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

              {activeTab === 'resumen' && (
                <div className="space-y-6">
                  <p className="text-[13.5px] leading-relaxed text-text/75">{why}</p>

                  {lastAfternoon && (
                    <Section title="Tu última tarde, sin prisas">
                      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-text/[.10] bg-bg-card">
                        {lastAfternoon.map((cell, index) => (
                          <div key={cell.label} className={`px-2 py-2.5 text-center ${index > 0 ? 'border-l border-dashed border-text/15' : ''}`}>
                            <p className="text-[11px] text-text/55">{cell.label}</p>
                            <p className={`font-mono text-[15px] font-semibold ${index === 2 ? 'text-accent' : 'text-text'}`}>{cell.value}</p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                  {!arrival && !lastAfternoon && info.ultima_tarde && mode !== 'coche' && (
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
                          ? `De ${point.nombre} al centro`
                          : `Del centro a ${point.nombre}`
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

                  {arrival && firstStop && (
                    <Section title="Tu primera parada">
                      <div className="flex items-start gap-3 rounded-2xl border border-text/[.10] bg-bg-card px-3.5 py-3">
                        {firstStop.number != null && (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-text font-mono text-[12px] font-semibold text-bg">{firstStop.number}</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-text">{firstStop.name}</p>
                          <p className="text-[12.5px] leading-snug text-text/60">{firstStop.howTo}</p>
                        </div>
                      </div>
                    </Section>
                  )}

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
                    Si vais en familia, en grupo, o simplemente preferís no complicaros con trasbordos ni cargar maletas, un traslado privado os recoge y os
                    lleva directos, puerta a puerta.
                  </p>
                  {privatePoints.map((point) => (
                    <div key={point.id} className="flex items-center justify-between gap-3 rounded-2xl border border-text/[.10] bg-bg-card p-3.5">
                      <div>
                        <p className="text-[14px] font-semibold text-text">Traslado privado puerta a puerta</p>
                        <p className="text-[12.5px] text-text/60">
                          {arrival ? `De ${point.nombre} a tu alojamiento` : `De tu alojamiento a ${point.nombre}`} — sin trasbordos ni esperas.
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="mb-1 text-[15px] font-bold text-text">{formatPrivatePrice(point.privado!.precio, point.privado!.moneda)}</p>
                        <a href={point.privado!.url_afiliado} target="_blank" rel="noopener noreferrer">
                          <Button className="text-caption font-bold shadow-sm">Reservar</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tips' && <TipList tips={tips} />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
