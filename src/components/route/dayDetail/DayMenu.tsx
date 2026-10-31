import { MenuHoja } from '../../ui/MenuHoja'
import { ICONOS_OPCION, OpcionTarjeta, type TonoOpcion } from '../../ui/HojaOpciones'

/** Las acciones de un día libre (decisión del usuario, 2026-09-28). */
export interface FreeDayMenuActions {
  onAddPlaces: () => void
  onRename: () => void
  onMoveBefore: (() => void) | null
  onMoveAfter: (() => void) | null
}

/** «Añadir una excursión» (Tanda 10N4 §3): hace lo mismo que el interruptor [Roma | Excursión] de ese día. Solo cabe donde el día lleva interruptor; si no, sale en gris con el porqué. */
export interface DayMenuExcursion {
  cabe: boolean
  /** Dónde está el interruptor ahora: en Excursión, la opción pasa a «Volver a Roma». */
  modo: 'roma' | 'excursion'
  /** Por qué no cabe (la línea gris). */
  motivo: string
  onCambiar: () => void
}

interface DayMenuProps {
  /** «Recuperar este día»: solo en los días con cambios (undefined: la opción no sale). */
  onRestoreDay?: () => void
  /** «Volver al día propuesto»: solo en el día 4 cuando es un día que montó el viajero con sus sitios (Tanda 6g). */
  onBackToProposed?: () => void
  /** "Eliminar día": en todos los días, también el de llegada y el de vuelta (PROMPT_UI, Parte 1). */
  onDelete: (() => void) | null
  freeDay?: FreeDayMenuActions
  /** «Añadir lugares» en los días que no son libres (abre EXPLORAR para añadir a ese día). En un día libre es `freeDay.onAddPlaces`. */
  onAddPlaces?: () => void
  excursion?: DayMenuExcursion
  /** (10S7) «Reorganizar este día»: solo con pase y para quien puede editar (undefined: la opción no sale). */
  onReorganize?: () => void
  /** El nombre del día que se toca, arriba de la hoja («Domingo 15 · Hoy vuelves a casa»). */
  titulo?: string
  /** Por qué «Eliminar día» no se puede (un día fijado por una reserva). */
  motivoNoEliminar?: string
}

/**
 * Menú "···" de CABECERA de un día completo (a diferencia de StopMenu.tsx, que es por parada), como el 02 de `Piezas/Hojas Opciones` de Design (Tanda 10N4 §3): «Añadir lugares», «Añadir una excursión»
 * y, la última y en rojo, «Eliminar día». En un día libre, además, cambiar el nombre y moverlo; en el que tiene cambios, recuperarlo.
 */
export function DayMenu({ onDelete, freeDay, onAddPlaces, excursion, onRestoreDay, onBackToProposed, onReorganize, titulo = 'Este día', motivoNoEliminar = 'Está fijado por una reserva' }: DayMenuProps) {
  const alAnadir = freeDay?.onAddPlaces ?? onAddPlaces
  const extra = (cerrar: () => void, tono: TonoOpcion, icono: string, tit: string, linea: string, action: (() => void) | null | undefined, flecha = false) =>
    action === undefined ? null : (
      <OpcionTarjeta
        key={tit}
        tono={tono}
        icono={icono}
        titulo={tit}
        linea={linea}
        flecha={flecha}
        deshabilitada={action === null}
        onClick={() => {
          cerrar()
          action?.()
        }}
      />
    )

  return (
    <MenuHoja etiquetaBoton="Más opciones del día" etiqueta="Día" titulo={titulo} tam={38} datos="dia">
      {(cerrar) => (
        <>
          {onReorganize && extra(cerrar, 'arena', ICONOS_OPCION.reorganizar, 'Reorganizar este día', 'Tus paradas, en el mejor orden', onReorganize)}
          {alAnadir && extra(cerrar, 'salvia', ICONOS_OPCION.pin, 'Añadir lugares', 'Monumentos, barrios, miradores…', alAnadir, true)}
          {excursion &&
            (excursion.cabe
              ? extra(cerrar, 'arena', ICONOS_OPCION.mochila, excursion.modo === 'excursion' ? 'Volver a Roma' : 'Añadir una excursión', excursion.modo === 'excursion' ? 'Deja la excursión y vuelve al plan de la ciudad' : 'Pompeya, Florencia, la Costa Amalfitana…', excursion.onCambiar, true)
              : extra(cerrar, 'arena', ICONOS_OPCION.mochila, 'Añadir una excursión', excursion.motivo, null))}
          {freeDay && (
            <>
              {extra(cerrar, 'azul', ICONOS_OPCION.cambiar, 'Cambiar el nombre', 'Ponle el nombre que quieras', freeDay.onRename)}
              {extra(cerrar, 'gris', ICONOS_OPCION.arriba, 'Mover el día antes', freeDay.onMoveBefore ? 'Un día antes en el viaje' : 'Ya es el primero', freeDay.onMoveBefore)}
              {extra(cerrar, 'gris', ICONOS_OPCION.abajo, 'Mover el día después', freeDay.onMoveAfter ? 'Un día más tarde en el viaje' : 'Ya es el último', freeDay.onMoveAfter)}
            </>
          )}
          {onBackToProposed && extra(cerrar, 'azul', ICONOS_OPCION.volver, 'Volver al día propuesto', 'Deja el día como te lo propusimos', onBackToProposed)}
          {onRestoreDay && extra(cerrar, 'azul', ICONOS_OPCION.volver, 'Recuperar este día', 'Vuelve a la ruta original de este día', onRestoreDay)}
          <OpcionTarjeta
            peligro
            icono={ICONOS_OPCION.papelera}
            titulo="Eliminar día"
            linea={onDelete ? 'Se quitan el día y sus paradas' : motivoNoEliminar}
            deshabilitada={onDelete === null}
            onClick={() => {
              cerrar()
              onDelete?.()
            }}
          />
        </>
      )}
    </MenuHoja>
  )
}
