import type { ReactNode } from 'react'
import type { DayPlan, Route } from '../../lib/types'
import type { Reservation } from '../../lib/bookings'
import type { DayTravelInfo } from '../../lib/dayTravelInfo'
import { dayColor } from '../../lib/dayColors'
import { AÑADE_TUS_SITIOS, DIA_POR_ORGANIZAR, etiquetaDeViaje, type NombreDelDia } from '../../lib/tituloDelDia'
import { diaCorto, type fichaDelDia } from '../../lib/nombreDeDia'
import { TEXTO_DIA_COMPLETO } from '../../lib/diaCompleto'
import { excursionReservationOf, viewedExcursion } from '../../lib/dayInterruptor'
import { EtiquetaRecomendacion } from '../propuesta/EtiquetaRecomendacion'
import { ExcursionCardMeta } from './dayDetail/excursion/ExcursionCardMeta'
import { ExcursionEstadoDelDia } from './dayDetail/ExcursionBloque'
import { Icono } from '../ui/Icono'
import { CuadradoFecha } from '../ui/CuadradoFecha'

interface TarjetaDeDiaProps {
  route: Route
  day: DayPlan
  reservations: Reservation[]
  colorIndex: number
  expanded: boolean
  pasado: boolean
  hizoAlgo: boolean
  fotosDelDia: number
  diaCompleto: boolean
  travel: DayTravelInfo | null
  nombre: NombreDelDia
  ficha: ReturnType<typeof fichaDelDia>
  /** El asa para arrastrar el día (DÍAS); null en el probador del panel. */
  dragHandle?: ReactNode
  /** Lo de la derecha de la cabecera (los tres puntitos o la marca de «Hecho»); lo decide quien la pinta. */
  menu: ReactNode
  onToggle: () => void
  onPonleNombre: () => void
  /** Lo que va debajo de la cabecera: el interruptor [Roma | Excursión] y el día abierto. */
  children?: ReactNode
}

/**
 * LA TARJETA DE UN DÍA de la lista de DÍAS (la cabecera: franja de color, cuadrado de la fecha, título, etiquetas y los tres puntitos; y debajo, lo que se le pone: el interruptor y el día abierto).
 * Una sola pieza: la pinta `DayList` (la lista de DÍAS) y la pinta el probador de Reorganizar del panel (`/admin/reorganizar`, solo lectura), para que el día salga igual en los dos sitios.
 */
export function TarjetaDeDia({ route, day, reservations, colorIndex, expanded, pasado, hizoAlgo, fotosDelDia, diaCompleto, travel, nombre, ficha, dragHandle, menu, onToggle, onPonleNombre, children }: TarjetaDeDiaProps): ReactNode {
  const title = nombre.titulo
  const sinNombre = nombre.ponleNombre
  const enExcursion = day.interruptor?.mode === 'excursion'
  return (
    <div
      data-day-id={day.id}
      data-dia-pasado={pasado ? '1' : undefined}
      className={`relative scroll-mt-3 ml-2.5 rounded-3xl border bg-bg-card shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)] transition-colors ${expanded ? 'border-text/[.14]' : 'border-text/[.06]'}`}
    >
      {/* La franja del color del día, fina y en diagonal (el mismo color que sus pines y su línea en el mapa). Solo
          cerrado: abierto, el color del día se queda en los números de las paradas (decisión del usuario, 2026-09-29). */}
      {!day.isReturnLeg && !expanded && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[14px] overflow-hidden rounded-l-3xl">
          <span className="absolute inset-0" style={{ background: dayColor(colorIndex), clipPath: 'polygon(0 0, 9px 0, 4px 100%, 0 100%)' }} />
        </span>
      )}
      {/* (V38) El asa vuelve a la IZQUIERDA del todo, asomando por el borde, encima de la franja de color (44 × 44 de zona de toque), como antes de la V27 (Eric lo pidió así). Los días «Hecho» no llevan asa. */}
      {dragHandle && !pasado && <span data-asa-del-dia="1" className="absolute -left-[34px] top-[8px] z-10">{dragHandle}</span>}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        className="flex min-h-[60px] w-full cursor-pointer items-center gap-3 py-2 pl-3.5 pr-2.5 text-left"
      >
        {/* (Noche 24-25 nov) El cuadrado de la fecha de toda la app (CuadradoFecha: azul oscuro, día y número en dorado); el día abierto lleva el borde dorado. Sin fechas, el número del día en el mismo cuadrado. */}
        <CuadradoFecha semana={ficha?.semana ?? 'DÍA'} numero={ficha?.numero ?? day.dayNumber} marcado={expanded} datos={{ 'data-dia-cuadrado': day.id }} />

        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          {/* Con fechas la ficha ya dice qué día es: la línea pequeña solo queda sin fechas («DÍA 3»). */}
          {/* (V24) Sin etiqueta «HOY» en el día de hoy (decisión de Eric). */}
          {!ficha && (
            <p className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.14em] text-text/50">{diaCorto(route, day.dayNumber)}</p>
          )}
          {title === DIA_POR_ORGANIZAR ? (
            <>
              <p data-titulo-del-dia="1" className="min-h-[20px] font-display text-[18px] leading-[1.1] text-text [overflow-wrap:anywhere]">{title}</p>
              <p data-anade-tus-sitios="1" className="text-[12.5px] leading-snug text-text/55">{AÑADE_TUS_SITIOS}</p>
            </>
          ) : sinNombre ? (
            <button
              type="button"
              data-ponle-nombre="1"
              onClick={(event) => {
                event.stopPropagation()
                onPonleNombre()
              }}
              className="self-start text-left font-display text-[18px] italic leading-[1.08] text-text/45"
            >
              Ponle nombre
            </button>
          ) : (
            <p data-titulo-del-dia="1" className="min-h-[20px] font-display text-[18px] leading-[1.1] text-text [overflow-wrap:anywhere]">{title}</p>
          )}
          {pasado && (
            <p data-dia-hecho={hizoAlgo ? '1' : undefined} data-dia-ya-paso={hizoAlgo ? undefined : '1'} className="text-[11.5px] font-medium leading-snug text-text/60">
              {fotosDelDia > 0 ? `Hecho · ${fotosDelDia} ${fotosDelDia === 1 ? 'foto' : 'fotos'}` : hizoAlgo ? 'Hecho · Ver tu día' : 'Ya pasó · Ver tu día'}
            </p>
          )}
          <EtiquetaRecomendacion dayId={day.id} />
          {diaCompleto && <p className="text-[12px] leading-snug text-text/60">{TEXTO_DIA_COMPLETO}</p>}
          {/* Las etiquetas de día van en el naranja de la app: el rojo es solo para avisos de verdad (Tanda 6g). El trayecto («Madrid → Roma») va pequeño, junto a la marca, y no es el título (tanda 6y7). */}
          {travel && !day.userAdded && (
            <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11.5px] font-normal text-text/55">
              {/* Tanda 7: «Barcelona → Roma · Día de viaje» (el trayecto primero); si el título ya dice «Día de viaje», solo el trayecto. */}
              {nombre.viaje && <span data-viaje-del-dia="1" className="whitespace-nowrap">{nombre.viaje}</span>}
              {nombre.viaje && etiquetaDeViaje(title) && <span data-marca-dia-de-viaje="1" className="whitespace-nowrap">· <span className="text-accent">{etiquetaDeViaje(title)}</span></span>}
            </p>
          )}
          {/* El día de la excursión lleva su etiqueta, como el primero y el último llevan «Día de viaje» (tanda 3); en el día 4 con interruptor, con sus horas y la reserva. */}
          {enExcursion && !travel && <ExcursionCardMeta excursion={viewedExcursion(day)} reservedName={excursionReservationOf(route, reservations, day)?.name.replace(/^Excursión (a la|a los|a las|al|a)\s+/i, '') ?? null} />}
          {day.dayType === 'excursion' && !enExcursion && !travel && (
            <>
              <p className="text-[12.5px] font-medium text-accent">Día de excursión</p>
              {/* (V18, Design E5) El día cerrado dice si la excursión está reservada: «Sin reservar» en rojo o «Reservada · salida 08:15» en verde. */}
              {!pasado && (day.excursions ?? []).length > 0 && (
                <ExcursionEstadoDelDia reserva={excursionReservationOf(route, reservations, day)} />
              )}
            </>
          )}
        </div>

        <span onClick={(event) => event.stopPropagation()} className="flex items-center">
          {menu}
        </span>

        <span className="flex w-[22px] justify-center text-text/45 transition-transform duration-[400ms]" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>
          <Icono nombre="adelante" className="h-[18px] w-[18px] shrink-0" />
        </span>
      </div>

      {children}
    </div>
  )
}
