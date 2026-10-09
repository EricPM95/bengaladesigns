import { useState } from 'react'
import type { Excursion, Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { buildExcursionRow, dayOfReservation, hasEnoughDaysForExcursions, type Reservation } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { ICONOS, Icono, LineaReservada } from './BloqueReservas'
import { EntradaCard } from './EntradaCard'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { enTuRuta, metaReserva } from './EntradasYFreeTour'

const sinCero = (hora: string) => hora.replace(/^0(\d:)/, '$1')

/** El nombre corto de una excursión para su línea verde («Pompeya»). */
const nombreCorto = (excursion: Excursion | null | undefined, respaldo: string) => excursion?.page?.shortName ?? respaldo

/** Una excursión de la lista de «¿Qué excursión tienes?»: su foto pequeña (o el color), el nombre y «Día completo» / «Medio día». */
function FilaExcursion({ excursion, onPick }: { excursion: Excursion; onPick: () => void }) {
  const mediaJornada = excursion.page?.halfDay ?? excursion.length === 'half-day'
  const foto = excursion.page?.photoUrl ?? null
  return (
    <button type="button" onClick={onPick} className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-text/[.08] bg-white py-2 pl-2 pr-3 text-left transition-colors hover:border-text/25">
      <span className="relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl text-white" style={{ background: excursion.page?.color ?? 'oklch(0.58 0.12 60)' }}>
        {foto ? <img src={foto} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : <Icono d={ICONOS.cols} size={20} stroke={1.7} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-[17px] leading-[1.1] text-text">{excursion.title}</span>
        <span className="text-[11.5px] text-text/55">{mediaJornada ? 'Medio día' : 'Día completo'}</span>
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}

/** «¿Qué excursión tienes?» (paso 1 de «Añadir una excursión»): las excursiones del destino; al elegir una, la hoja de la hora con «Hora de recogida». */
function HojaQueExcursion({ excursions, onPick, onClose }: { excursions: Excursion[]; onPick: (excursion: Excursion) => void; onClose: () => void }) {
  return (
    <HojaAbajo titleId="hoja-que-excursion" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Añadir una excursión · 1 de 2
      </p>
      <h2 id="hoja-que-excursion" className="mt-1 font-display text-[24px] leading-[1.05] text-text">
        ¿Qué excursión tienes?
      </h2>
      <div className="mt-3.5 flex flex-col gap-1.5">
        {excursions.map((excursion) => (
          <FilaExcursion key={excursion.id} excursion={excursion} onPick={() => onPick(excursion)} />
        ))}
      </div>
    </HojaAbajo>
  )
}

/**
 * El bloque «Excursiones» de RESERVAS (Tanda 6s). Sin día de excursión en la ruta: solo «Excursiones desde Roma · n excursiones» [Ver excursiones] y, debajo, «¿Ya tienes una? Añádela».
 * Con el día de excursión: solo la tarjeta de esa excursión (la de entrada, con [Reservar excursión] y «¿Ya la tienes? Añádela») y, debajo, «Ver otras excursiones». Nunca dos «Añádela».
 * Las añadidas, en una línea verde con «Cambiar». Viajes de menos días que `excursiones_desde_dias`: no sale.
 */
export function ExcursionesReservas({ route, info }: { route: Route; info: DestinationExcursions }) {
  const reservations = useRouteStore((state) => state.reservations)
  const openExcursions = useExcursionsStore((state) => state.openPage)
  const [lista, setLista] = useState(false)
  const [target, setTarget] = useState<ReservationTarget | null>(null)
  const disponible = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  if (!disponible) return null
  const fila = buildExcursionRow(route, reservations)
  const hayDiaDeExcursion = Boolean(fila.excursion && fila.day)
  const añadidas = reservations.filter((item) => item.kind === 'excursion')
  const excursionDe = (reserva: Reservation): Excursion | null => reserva.excursionData ?? info.excursions.find((item) => item.id === reserva.refId) ?? null
  const sinReservar = hayDiaDeExcursion && !fila.reservation

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {sinReservar && fila.excursion && fila.day && (
          <EntradaCard
            eyebrow="Excursión"
            when={enTuRuta(route, fila.day)}
            name={fila.excursion.title}
            buyLabel="Reservar excursión"
            buyHref={fila.excursion.page?.affiliateUrl ?? fila.excursion.bookUrl ?? buildActivitySearchUrl(`${fila.excursion.title} ${route.destination}`)}
            reservedTime={null}
            onAdd={() => setTarget({ kind: 'excursion', refId: fila.excursion!.id, name: fila.excursion!.title, placeNames: [], excursion: fila.excursion, currentDayId: fila.day!.id })}
            onChange={() => undefined}
          />
        )}
        {añadidas.map((reserva) => {
          const excursion = excursionDe(reserva)
          return (
            <LineaReservada
              key={reserva.id}
              nombre={nombreCorto(excursion, reserva.name)}
              meta={sinCero(metaReserva(route, reserva, 'recogida '))}
              onChange={() => setTarget({ kind: 'excursion', refId: reserva.refId, name: reserva.name, placeNames: [], excursion, currentDayId: dayOfReservation(route, reserva)?.id ?? null, existing: reserva })}
            />
          )
        })}
        {!hayDiaDeExcursion && (
          <>
            <div className="relative flex min-h-[88px] overflow-hidden rounded-[20px] border border-text/[.08] bg-white shadow-[0_1px_2px_rgba(28,34,48,.05),0_10px_22px_-18px_rgba(28,34,48,.4)]">
              <span className="flex w-[66px] flex-none items-center pl-3.5 text-white" style={{ clipPath: 'polygon(0 0,100% 0,calc(100% - 18px) 100%,0 100%)', background: 'oklch(0.56 0.1 220)' }}>
                <Icono d="M5 4h14v12H5zM5 11h14M8 19v-3M16 19v-3" size={20} stroke={1.7} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pl-1.5 pr-2">
                <span style={{ font: "400 19px/1.05 'Instrument Serif',serif" }}>Excursiones desde {route.destination}</span>
                <span className="text-[11.5px] text-text/55">
                  {info.excursions.length} {info.excursions.length === 1 ? 'excursión' : 'excursiones'}
                </span>
              </span>
              <button type="button" onClick={() => openExcursions(false)} className="my-auto mr-3 h-[34px] flex-none whitespace-nowrap rounded-full bg-[#1C2230] px-[13px] text-[12.5px] font-semibold text-[#FFFDF8]">
                Ver excursiones
              </button>
            </div>
            <button type="button" onClick={() => setLista(true)} className="self-start border-none bg-transparent px-1 py-0.5 text-left text-[12px] text-text/60">
              ¿Ya tienes una? <span className="font-semibold text-text underline underline-offset-2">Añádela</span>
            </button>
          </>
        )}
        {hayDiaDeExcursion && (
          <button type="button" onClick={() => openExcursions(false)} className="self-start border-none bg-transparent px-1 py-0.5 text-[12px] font-medium text-text underline underline-offset-2">
            Ver otras excursiones
          </button>
        )}
      </div>
      {lista && (
        <HojaQueExcursion
          excursions={info.excursions}
          onClose={() => setLista(false)}
          onPick={(excursion) => {
            setLista(false)
            const dia = fila.day && fila.excursion?.id === excursion.id ? fila.day : null
            setTarget({ kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], excursion, currentDayId: dia?.id ?? null, paso2: true })
          }}
        />
      )}
      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
    </>
  )
}
