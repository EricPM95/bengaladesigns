import { MenuHoja, OpcionHoja } from '../../ui/MenuHoja'

/** Las acciones de un día libre (decisión del usuario, 2026-09-28). */
export interface FreeDayMenuActions {
  onAddPlaces: () => void
  onRename: () => void
  onMoveBefore: (() => void) | null
  onMoveAfter: (() => void) | null
}

interface DayMenuProps {
  /** «Recuperar este día»: solo en los días con cambios (undefined: la opción no sale). */
  onRestoreDay?: () => void
  /** «Volver al día propuesto»: solo en el día 4 cuando es un día que montó el viajero con sus sitios (Tanda 6g). */
  onBackToProposed?: () => void
  /** "Eliminar día": en todos los días, también el de llegada y el de vuelta (PROMPT_UI, Parte 1). */
  onDelete: (() => void) | null
  freeDay?: FreeDayMenuActions
  /** El nombre del día que se toca, arriba de la hoja («Jueves 26 · Roma antigua y Centro histórico»). */
  titulo?: string
}

/**
 * Menú "···" de CABECERA de un día completo (a diferencia de StopMenu.tsx, que es por parada): en un día libre, añadir lugares, cambiar el nombre y moverlo; y en todos, "Eliminar día".
 * (Tanda 10N §6c: sale desde abajo, como hoja baja con el nombre del día arriba —`MenuHoja`—, no como cuadro flotante.)
 */
export function DayMenu({ onDelete, freeDay, onRestoreDay, onBackToProposed, titulo = 'Este día' }: DayMenuProps) {
  const item = (cerrar: () => void, label: string, action: (() => void) | null | undefined, options: { danger?: boolean } = {}) =>
    action === undefined ? null : (
      <OpcionHoja
        key={label}
        peligro={options.danger}
        deshabilitada={action === null}
        onClick={() => {
          cerrar()
          action?.()
        }}
      >
        {label}
      </OpcionHoja>
    )

  return (
    <MenuHoja etiquetaBoton="Más opciones del día" etiqueta="Día" titulo={titulo} tam={38} datos="dia">
      {(cerrar) => (
        <>
          {freeDay && (
            <>
              {item(cerrar, 'Añadir lugares', freeDay.onAddPlaces)}
              {item(cerrar, 'Cambiar el nombre', freeDay.onRename)}
              {item(cerrar, 'Mover el día antes', freeDay.onMoveBefore)}
              {item(cerrar, 'Mover el día después', freeDay.onMoveAfter)}
            </>
          )}
          {onBackToProposed && item(cerrar, 'Volver al día propuesto', onBackToProposed)}
          {onRestoreDay && item(cerrar, 'Recuperar este día', onRestoreDay)}
          {item(cerrar, 'Eliminar día', onDelete, { danger: true })}
        </>
      )}
    </MenuHoja>
  )
}
