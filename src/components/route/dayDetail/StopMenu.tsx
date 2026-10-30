import { DesmarcarDelMenu } from '../../logros/visto/DesmarcarDelMenu'
import { usePuedeCambiarLaRuta } from '../../../hooks/usePuedeCambiarLaRuta'
import { MenuInvitadoParada } from '../../propuesta/MenusDelInvitado'
import { useState } from 'react'
import type { Stop } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { HojaDelMenu } from '../../ui/MenuHoja'
import { ICONOS_OPCION, OpcionTarjeta } from '../../ui/HojaOpciones'
import { MoverADia } from './MoverADia'
import { CambiarParada } from './CambiarParada'
import { withUndo } from '../../../store/useAddFlowStore'
import { moverParadaAOtroDia } from '../../../lib/cambiarParada'
import { cuandoEsLaEntrada, quitarParadaConEntrada, reservaDeLaParada } from '../../../lib/quitarConEntrada'
import { limpiarFreeTourSiYaNoHay } from '../../../lib/freeTourEnDia'
import { horaCorta } from '../../../lib/reservasGrupo'
import { elSitio } from '../../../lib/articulos'
import { QuitarConEntradaDialog } from './QuitarConEntradaDialog'

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

type MenuView = 'menu' | 'move-day'

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
  // (10N6, 1c) Una parada con su entrada (o el Free Tour reservado): sale con todas las opciones; las que no se pueden, en gris con el porqué; y al quitarla se pregunta qué hacer con la entrada.
  const reservations = useRouteStore((state) => state.reservations)
  const reserva = reservaDeLaParada(stop, reservations)
  const [preguntando, setPreguntando] = useState(false)

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
    moverParadaAOtroDia(stop.id, dayId, targetDayId, { llevar: true })
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
        className="zona-toque flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[12px] font-bold leading-none tracking-[1px] text-text/60 hover:bg-bg-hover"
      >
        ···
      </button>

      {open && !eligiendoDia && (
        <HojaDelMenu etiqueta="Parada" titulo={stop.name} onCerrar={close}>
          {/* Una parada que se saltó en HOY («No me da tiempo»): vuelve a la ruta como no saltada (Tanda 6z6). */}
          {view === 'menu' && stop.saltada && (
            <OpcionTarjeta
              tono="salvia"
              icono={ICONOS_OPCION.volver}
              titulo="Devolverla a la ruta"
              linea="Vuelve a ser una parada normal del día"
              onClick={() => {
                setStopSaltada(dayId, stop.id, false)
                close()
              }}
            />
          )}

          {/* 8b2: «Desmarcar visto» mientras no haya foto (con los logros apagados no pinta nada). */}
          {view === 'menu' && <DesmarcarDelMenu dayId={dayId} stop={stop} onHecho={close} />}

          {/* El orden de Design (Hojas Opciones 01): Cambiar parada, Mover a otro día, Mover antes, Mover después y, la última, Quitar parada. En un día libre no hay «Cambiar parada». Con entrada, las que no se pueden, en gris con el porqué (10N6, 1c). */}
          {view === 'menu' && (
            <>
              {!freeDay && (
                <OpcionTarjeta
                  tono="arena"
                  icono={ICONOS_OPCION.cambiar}
                  titulo="Cambiar parada"
                  linea={reserva ? `Tienes entrada para ${stop.isFreeTour ? 'el Free Tour' : elSitio(stop.name)}` : 'Elige otro sitio para este hueco'}
                  flecha={!reserva}
                  deshabilitada={Boolean(reserva)}
                  onClick={() => {
                    setOpen(false)
                    setPickerOpen(true)
                  }}
                />
              )}
              <OpcionTarjeta
                tono="azul"
                icono={ICONOS_OPCION.calendario}
                titulo="Mover a otro día"
                linea={reserva && route ? `Tienes entrada para ${cuandoEsLaEntrada(route, reserva)}` : otherDays.length === 0 ? 'No hay otro día al que pasarla' : 'Pásala a otro día del viaje'}
                flecha={!reserva && otherDays.length > 0}
                deshabilitada={Boolean(reserva) || otherDays.length === 0}
                onClick={() => setView('move-day')}
              />
              <OpcionTarjeta tono="gris" icono={ICONOS_OPCION.arriba} titulo="Mover antes" linea={index === 0 ? 'Ya es la primera del día' : reserva ? `Tienes tu entrada a las ${horaCorta(reserva.time)}` : 'Una posición antes'} flecha={index !== 0} deshabilitada={index === 0} onClick={() => handleReorder('before')} />
              <OpcionTarjeta tono="gris" icono={ICONOS_OPCION.abajo} titulo="Mover después" linea={index === realStops.length - 1 ? 'Ya es la última del día' : reserva ? `Tienes tu entrada a las ${horaCorta(reserva.time)}` : 'Una posición más tarde'} flecha={index !== realStops.length - 1} deshabilitada={index === realStops.length - 1} onClick={() => handleReorder('after')} />
              <OpcionTarjeta
                peligro
                icono={ICONOS_OPCION.papelera}
                titulo="Quitar parada"
                linea={reserva ? 'Sale de tu ruta. Tienes su entrada: te preguntamos qué hacer con ella.' : 'Sale de tu ruta. Puedes deshacerlo'}
                onClick={() => {
                  if (reserva) {
                    setOpen(false)
                    setPreguntando(true)
                    return
                  }
                  // (10N6, 1b) Quitar una parada normal: sin pregunta y con [Deshacer]. (10N8, 3d) El Free Tour también: se quita al momento, como cualquier parada, sin rehacer ningún día.
                  ensureSeeded()
                  withUndo(freeDay ? `Quitada del día: ${stop.name}` : `Quitada de tu ruta: ${stop.name}`, () => {
                    removeStop(dayId, stop.id)
                    if (stop.isFreeTour) limpiarFreeTourSiYaNoHay()
                  })
                  close()
                }}
              />
            </>
          )}

        </HojaDelMenu>
      )}
      {open && eligiendoDia && <MoverADia stop={stop} dayId={dayId} onMover={handleMoveToDay} onCerrar={close} />}

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
      {preguntando && reserva && route && (
        <QuitarConEntradaDialog
          route={route}
          stop={stop}
          reserva={reserva}
          onCancelar={() => {
            setPreguntando(false)
            close()
          }}
          onElegir={(modo) => {
            setPreguntando(false)
            close()
            void quitarParadaConEntrada(dayId, stop, reserva, modo)
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
