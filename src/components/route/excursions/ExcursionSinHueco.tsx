import { useState } from 'react'
import type { Excursion, Route } from '../../../lib/types'
import { canAddDay } from '../../../lib/freeDays'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import { opcionesDeCambio, textoDeConfirmar } from '../../../lib/excursionSinHueco'
import { elDia } from '../../../lib/nombreDeDia'
import { useRouteStore } from '../../../store/useRouteStore'
import { anadirExcursionEnDiaNuevo, cambiarDiaPorExcursion } from '../../../store/excursionSinHuecoActions'
import { ConfirmDialog } from '../ConfirmDialog'
import { HojaDia, filasDeDias } from '../../ui/HojaDia'

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

/** «Cambiar un día por la excursión»: la hoja de elegir día de la app (`HojaDia`, 10N8) con lo que se pierde en cada día, el recomendado marcado y los que tienen una reserva en gris. Esto SÍ mueve un día entero, así que puede bloquear días. */
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
  const filas = filasDeDias(
    route,
    opciones.map((opcion) => opcion.day),
    (day) => (opciones.find((opcion) => opcion.day.id === day.id)?.reservado ? 'Tienes una reserva este día.' : null),
    (day) => {
      const opcion = opciones.find((o) => o.day.id === day.id)
      if (!opcion) return null
      const partes = [opcion.recomendado ? 'Recomendado: se pierde lo menos.' : '', opcion.perdida.imprescindibles.length > 0 ? `Imprescindibles: ${opcion.perdida.imprescindibles.join(', ')}.` : '']
      return partes.filter(Boolean).join(' ') || null
    },
  )

  return (
    <>
      <HojaDia
        etiqueta={excursion.title}
        titulo="¿Qué día cambiamos?"
        filas={filas}
        elegido={choice}
        onElegir={setChoice}
        boton={elegida ? `Cambiar ${elDia(route, elegida.day.dayNumber)} por la excursión` : 'Elige un día'}
        onConfirmar={() => setAsking(true)}
        onCerrar={onClose}
        z={96}
        datos="cambiar-dia-excursion"
      >
        {opciones.length === 0 && <p className="text-[14px] text-text-muted">No hay ningún día que se pueda cambiar.</p>}
      </HojaDia>
      {asking && elegida && (
        <ConfirmDialog
          alto
          eyebrow="Tu viaje"
          text={`¿Cambiamos ${elDia(route, elegida.day.dayNumber)} por la excursión?`}
          detail={textoDeConfirmar(route, elegida.day, excursion, elegida.perdida)}
          peligro
          confirmLabel="Sí, cambiar"
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false)
            void cambiar()
          }}
        />
      )}
    </>
  )
}
