import { DesmarcarDelMenu } from '../../logros/visto/DesmarcarDelMenu'
import { usePuedeCambiarLaRuta } from '../../../hooks/usePuedeCambiarLaRuta'
import { MenuInvitadoParada } from '../../propuesta/MenusDelInvitado'
import { useState } from 'react'
import type { Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { HojaDelMenu, OpcionHoja } from '../../ui/MenuHoja'
import { ConfirmDialog } from '../ConfirmDialog'
import { MoverADia } from './MoverADia'
import { CambiarParada } from './CambiarParada'
import { removeReservationWithUndo, withUndo } from '../../../store/useAddFlowStore'
import { moverParadaAOtroDia } from '../../../lib/cambiarParada'
import { RemoveReservationDialog } from '../reservas/ReservedMarks'

interface StopMenuProps {
  dayId: string
  city: string
  stop: Stop
  index: number
  /** Paradas reales del día YA sembradas (o listas para sembrarse) del pool de plantilla, en el mismo orden que se muestran — para "Mover antes/después" (reordenar) y "Mover a otro día" (encontrar el resto de paradas al sembrar). */
  realStops: Stop[]
  otherDays: { id: string; dayNumber: number; city: string }[]
  /** Día libre (decisión del usuario, 2026-09-28): Poner / Cambiar / Quitar hora, Mover a otro día, Subir, Bajar y Quitar del día, con "Deshacer". */
  freeDay?: boolean
  /** Abre la ficha de la parada (el menú de quien mira el viaje de otra persona lo ofrece). */
  onVerFicha?: () => void
}

/** (Tanda 10N §6c) El estilo de una fila de la hoja, para las piezas de fuera que pintan la suya (DesmarcarDelMenu). */
const FILA_DEL_MENU = 'flex min-h-[52px] w-full items-center border-b border-text/[.08] px-1 text-left text-[15.5px] font-medium text-text disabled:opacity-40'

type MenuView = 'menu' | 'remove' | 'move-day'

/**
 * Menú "..." por parada — Cambiar / Quitar / Mover a otro día / Mover antes / Mover después, todo gratuito (sin restricción de plan). (Tanda 10N §7: ya no hay «Cambiar hora»: la app no enseña horas
 * y cambiar la hora no mueve nada; el orden lo decide el viajero colocando las paradas.) Cada acción "cristaliza" primero el pool
 * de plantilla del día en `Stop[]` reales vía `seedDayStops` (no-op si el día ya tiene paradas
 * reales) — necesario porque DIAS muestra contenido mock hasta la primera edición, ver
 * mockDayDetail.ts `resolveDisplayStops`. Los conectores se recalculan solos: derivan del ORDEN e
 * ÍNDICE de las paradas, así que cualquier acción que cambie el orden ya los actualiza sin lógica
 * extra.
 *
 * (Tanda 10N §6c) El menú, la confirmación de quitar y «Mover a otro día» salen DESDE ABAJO como hoja baja (`HojaDelMenu`: tirador, ✕, se cierra deslizando o tocando fuera) con el nombre de la parada arriba;
 * «Mover a» elige el día con una ruedita (`MoverADia`).
 */
function StopMenuCompleto({ dayId, city, stop, index, realStops, otherDays, freeDay = false }: StopMenuProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<MenuView>('menu')
  const [pickerOpen, setPickerOpen] = useState(false)

  const route = useRouteStore((state) => state.route)
  const seedDayStops = useRouteStore((state) => state.seedDayStops)
  const removeStop = useRouteStore((state) => state.removeStop)
  const reorderStops = useRouteStore((state) => state.reorderStops)
  const setStopSaltada = useRouteStore((state) => state.setStopSaltada)
  // Una parada reservada está fijada: solo se quita con «Quitar del viaje» (PARA_CODE_RESERVAS, 6).
  const [removingReservation, setRemovingReservation] = useState(false)

  /** No-op si el día ya tiene paradas reales — `realStops` ya es esa misma lista en ese caso. */
  const ensureSeeded = () => seedDayStops(dayId, realStops)

  const close = () => {
    setOpen(false)
    setView('menu')
  }

  const undoable = (message: string, change: () => void) => (freeDay ? withUndo(message, change) : change())

  const handleReorder = (direction: 'before' | 'after') => {
    ensureSeeded()
    const ids = realStops.map((s) => s.id)
    const targetIndex = direction === 'before' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= ids.length) return
    ;[ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]]
    undoable(direction === 'before' ? `${stop.name}: sube` : `${stop.name}: baja`, () => reorderStops(dayId, ids))
    close()
  }

  const handleMoveToDay = (targetDayId: string) => {
    ensureSeeded()
    // Con «Deshacer» en todos los días (Tanda 7, punto 16): la parada pasa a ese día, más o menos a su hora, y no se quita nada.
    moverParadaAOtroDia(stop.id, dayId, targetDayId)
    close()
  }

  const eligiendoDia = view === 'move-day'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setView('menu')
          setOpen(true)
        }}
        title="Más opciones"
        aria-label="Opciones de la parada"
        data-menu-hoja="parada"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[12px] font-bold leading-none tracking-[1px] text-text/60 hover:bg-bg-hover"
      >
        ···
      </button>

      {open && view === 'remove' && (
        <ConfirmDialog
          eyebrow={stop.name}
          text={`¿Seguro que quieres eliminar "${stop.name}"?`}
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          onCancel={close}
          onConfirm={() => {
            ensureSeeded()
            removeStop(dayId, stop.id)
            close()
          }}
        />
      )}

      {open && view !== 'remove' && (
        <HojaDelMenu etiqueta={eligiendoDia ? 'Mover a otro día' : 'Parada'} titulo={stop.name} onCerrar={close}>
          {/* Una parada que se saltó en HOY («No me da tiempo»): vuelve a la ruta como no saltada (Tanda 6z6). */}
          {view === 'menu' && stop.saltada && (
            <OpcionHoja
              onClick={() => {
                setStopSaltada(dayId, stop.id, false)
                close()
              }}
            >
              Devolverla a la ruta
            </OpcionHoja>
          )}

          {/* 8b2: «Desmarcar visto» mientras no haya foto (con los logros apagados no pinta nada). */}
          {view === 'menu' && <DesmarcarDelMenu dayId={dayId} stop={stop} className={FILA_DEL_MENU} onHecho={close} />}

          {view === 'menu' && stop.reservedId && (
            <>
              <p style={{ margin: 0, padding: '2px 4px 6px', font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Reservada · fijada</p>
              <OpcionHoja
                peligro
                onClick={() => {
                  setRemovingReservation(true)
                  close()
                }}
              >
                Quitar del viaje
              </OpcionHoja>
            </>
          )}

          {view === 'menu' && !stop.reservedId && freeDay && (
            <>
              <OpcionHoja onClick={() => setView('move-day')} deshabilitada={otherDays.length === 0}>
                Mover a otro día
              </OpcionHoja>
              <OpcionHoja onClick={() => handleReorder('before')} deshabilitada={index === 0}>
                Subir
              </OpcionHoja>
              <OpcionHoja onClick={() => handleReorder('after')} deshabilitada={index === realStops.length - 1}>
                Bajar
              </OpcionHoja>
              <OpcionHoja
                peligro
                onClick={() => {
                  ensureSeeded()
                  undoable(`Quitada del día: ${stop.name}`, () => removeStop(dayId, stop.id))
                  close()
                }}
              >
                Quitar del día
              </OpcionHoja>
            </>
          )}

          {view === 'menu' && !stop.reservedId && !freeDay && (
            <>
              <OpcionHoja
                onClick={() => {
                  setOpen(false)
                  setPickerOpen(true)
                }}
              >
                Cambiar parada
              </OpcionHoja>
              <OpcionHoja peligro onClick={() => setView('remove')}>
                Quitar parada
              </OpcionHoja>
              <OpcionHoja onClick={() => setView('move-day')} deshabilitada={otherDays.length === 0}>
                Mover a otro día
              </OpcionHoja>
              <OpcionHoja onClick={() => handleReorder('before')} deshabilitada={index === 0}>
                Mover antes
              </OpcionHoja>
              <OpcionHoja onClick={() => handleReorder('after')} deshabilitada={index === realStops.length - 1}>
                Mover después
              </OpcionHoja>
            </>
          )}

          {view === 'move-day' && <MoverADia dias={otherDays} ahora={route?.days.find((candidate) => candidate.id === dayId)?.dayNumber} onMover={handleMoveToDay} />}
        </HojaDelMenu>
      )}

      {/* «Cambiar parada»: EXPLORAR con los monumentos y los miradores y el ⇄ en cada tarjeta (Tanda 7, punto 16). */}
      <CambiarParada
        open={pickerOpen}
        dayId={dayId}
        stop={stop}
        city={city}
        sembrar={ensureSeeded}
        onClose={() => {
          setPickerOpen(false)
          close()
        }}
      />
      {removingReservation && stop.reservedId && (
        <RemoveReservationDialog
          name={stop.name}
          onCancel={() => setRemovingReservation(false)}
          onConfirm={() => {
            removeReservationWithUndo(stop.reservedId as string)
            setRemovingReservation(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * El menú de una parada. Quien solo recomienda y ya está de viaje (Tanda 10N: desde el primer día ya no propone) ve el suyo, el de RW1: [Ver la ficha] y [Cómo llegar]. Antes del viaje, y siempre para el
 * administrador y quien puede editar, el de siempre (los cambios de quien solo recomienda van a su propuesta).
 */
export function StopMenu(props: StopMenuProps) {
  const { puede } = usePuedeCambiarLaRuta()
  if (!puede) return <MenuInvitadoParada nombre={props.stop.name} ciudad={props.city} onVerFicha={props.onVerFicha ?? (() => undefined)} />
  return <StopMenuCompleto {...props} />
}
