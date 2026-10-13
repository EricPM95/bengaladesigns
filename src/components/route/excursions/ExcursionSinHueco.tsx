import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Excursion, Route } from '../../../lib/types'
import { canAddDay } from '../../../lib/freeDays'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { opcionesDeCambio, textoDeConfirmar, type OpcionDeCambio } from '../../../lib/excursionSinHueco'
import { elDia } from '../../../lib/nombreDeDia'
import { useRouteStore } from '../../../store/useRouteStore'
import { anadirExcursionEnDiaNuevo, cambiarDiaPorExcursion } from '../../../store/excursionSinHuecoActions'
import { ConfirmDialog } from '../ConfirmDialog'
import { dayOptionLabel } from '../freeDay/AddToDaySheet'
import { Icono } from '../../ui/Icono'

/**
 * Cuando la excursión no cabe en ningún día (Tanda 6y10): debajo del «no cabe» de siempre, dos salidas más con el mismo diseño. [Añadir en un día nuevo] (el viaje gana un día al final, con la
 * vuelta al día siguiente, sin aviso propio) y [Cambiar un día por la excursión] (la lista de días con lo que se pierde). Las dos dejan el aviso de abajo con [Deshacer].
 */
export function ExcursionSinHueco({ route, excursion, onClose }: { route: Route; excursion: Excursion; onClose: () => void }) {
  const [cambiando, setCambiando] = useState(false)
  const nuevoDia = canAddDay(route)

  const enDiaNuevo = () => {
    if (anadirExcursionEnDiaNuevo(excursion)) onClose()
  }

  return (
    <div className="mt-4 border-t border-text/[.1] pt-4" data-excursion-sin-hueco>
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-text-muted">Si quieres la excursión igualmente</p>
      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          disabled={!nuevoDia}
          onClick={enDiaNuevo}
          className="flex min-h-12 w-full flex-col items-start justify-center rounded-2xl border border-text/[.15] px-4 py-2 text-left transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-[15px] font-medium text-text">Añadir en un día nuevo</span>
          <span className="text-[12.5px] text-text-muted">{nuevoDia ? 'Tu viaje gana un día al final' : 'Máximo 14 días'}</span>
        </button>
        <button
          type="button"
          onClick={() => setCambiando(true)}
          className="flex min-h-12 w-full flex-col items-start justify-center rounded-2xl border border-text/[.15] px-4 py-2 text-left transition-colors hover:bg-bg-hover"
        >
          <span className="text-[15px] font-medium text-text">Cambiar un día por la excursión</span>
          <span className="text-[12.5px] text-text-muted">Eliges qué día dejas</span>
        </button>
      </div>
      {cambiando && <CambiarDiaSheet route={route} excursion={excursion} onClose={() => setCambiando(false)} onDone={onClose} />}
    </div>
  )
}

/** «Cambiar un día por la excursión»: la lista de días con su título, los que llevan imprescindibles marcados, el recomendado arriba y los que tienen una reserva en gris. */
export function CambiarDiaSheet({ route, excursion, onClose, onDone }: { route: Route; excursion: Excursion; onClose: () => void; onDone: () => void }) {
  const reservations = useRouteStore((state) => state.reservations)
  const info = useDestinationExcursions(route.destination)
  const opciones = opcionesDeCambio(route, reservations, excursion, info.importanciaPorSitio)
  const [choice, setChoice] = useState<string | null>(opciones.find((opcion) => opcion.recomendado)?.day.id ?? null)
  const [asking, setAsking] = useState(false)
  const elegida = opciones.find((opcion) => opcion.day.id === choice && !opcion.reservado) ?? null

  const cambiar = async () => {
    if (!elegida) return
    if (!(await cambiarDiaPorExcursion(elegida.day, excursion))) return
    onDone()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[96] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="cambiar-dia-heading">
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={onClose} />
      <div className="trazo-notice-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-[28px] bg-bg-card shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[440px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-text-soft hover:bg-bg-hover">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto px-6 pt-4">
          <p className="max-w-[calc(100%-2.5rem)] font-mono text-[10.5px] font-medium uppercase tracking-[.12em] text-accent">{excursion.title}</p>
          <h2 id="cambiar-dia-heading" className="mt-1.5 font-display text-[26px] leading-[1.15] text-text">
            ¿Qué día cambiamos?
          </h2>
          <div className="mt-4 flex flex-col gap-1.5">
            {opciones.length === 0 && <p className="text-[14px] text-text-muted">No hay ningún día que se pueda cambiar.</p>}
            {opciones.map((opcion) => (
              <FilaDeDia key={opcion.day.id} route={route} opcion={opcion} activa={opcion.day.id === choice} onChoose={() => setChoice(opcion.day.id)} />
            ))}
          </div>
        </div>
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" disabled={!elegida} onClick={() => setAsking(true)} className="h-12 w-full rounded-full bg-text text-[15px] font-medium text-bg transition-transform active:scale-[.98] disabled:opacity-40">
            {elegida ? `Cambiar ${elDia(route, elegida.day.dayNumber)} por la excursión` : 'Elige un día'}
          </button>
        </div>
      </div>
      {asking && elegida && (
        <ConfirmDialog
          alto
          eyebrow="Tu viaje"
          text="¿Estás seguro?"
          detail={textoDeConfirmar(route, elegida.day, excursion, elegida.perdida)}
          confirmLabel="Cambiar"
          cancelLabel="Cancelar"
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false)
            void cambiar()
          }}
        />
      )}
    </div>,
    document.body,
  )
}

function FilaDeDia({ route, opcion, activa, onChoose }: { route: Route; opcion: OpcionDeCambio; activa: boolean; onChoose: () => void }) {
  const { day, perdida, reservado, recomendado } = opcion
  const llevaImprescindibles = perdida.imprescindibles.length > 0
  return (
    <button
      type="button"
      disabled={reservado}
      aria-pressed={activa}
      data-dia={day.id}
      data-recomendado={recomendado ? 'si' : undefined}
      data-reservado={reservado ? 'si' : undefined}
      onClick={onChoose}
      className={`rounded-2xl border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${activa ? 'border-accent bg-accent-soft' : 'border-text/[.12] hover:bg-bg-hover'} ${reservado ? 'opacity-50' : ''}`}
    >
      {recomendado && <span className="mb-0.5 block font-mono text-[10px] font-medium uppercase tracking-[.14em] text-accent-hover">Recomendado · se pierde lo menos</span>}
      <span className="block text-[14px] font-medium text-text">{dayOptionLabel(route, day)}</span>
      {reservado && <span className="block text-[12px] text-text-muted">Tienes una reserva este día</span>}
      {!reservado && llevaImprescindibles && (
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-hover">Imprescindibles</span>
          <span className="text-[12px] text-text-muted">{perdida.imprescindibles.join(', ')}</span>
        </span>
      )}
    </button>
  )
}
