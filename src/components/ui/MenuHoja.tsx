import { useState, type ReactNode } from 'react'
import { HojaOpciones } from './HojaOpciones'

/**
 * LOS MENÚS DE TRES PUNTITOS, DESDE ABAJO (Tanda 10N §6c, Eric 25-oct; formato de Design en la 10N4 §3): el botón «···» y, al tocarlo, la hoja de opciones (`HojaOpciones`: tirador, ✕, la etiqueta pequeña, el nombre
 * grande y las opciones como TARJETAS con su icono, su línea y su «›»).
 *
 * USO
 *   <MenuHoja etiquetaBoton="Opciones de la parada" etiqueta="Parada" titulo="Iglesia del Gesù">
 *     {(cerrar) => (<><OpcionTarjeta tono="arena" icono={ICONOS_OPCION.cambiar} titulo="Cambiar parada" linea="Elige otro sitio para este hueco" flecha onClick={() => { cerrar(); … }} /></>)}
 *   </MenuHoja>
 *   `tam`: el lado del botón (28 en una parada, 38 en un día). `datos`: data-menu-hoja del botón, para las pruebas.
 *   Para una hoja con vistas (menú → confirmación → «Mover a»), usa `HojaDelMenu` directamente con el estado en el padre.
 */
export function MenuHoja({
  etiquetaBoton,
  etiqueta,
  titulo,
  tam = 28,
  datos,
  children,
}: {
  etiquetaBoton: string
  etiqueta?: string
  titulo: ReactNode
  tam?: number
  datos?: string
  children: (cerrar: () => void) => ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)
  return (
    <div className="relative">
      <BotonPuntitos etiqueta={etiquetaBoton} tam={tam} datos={datos} onClick={() => setAbierto(true)} />
      {abierto && (
        <HojaDelMenu etiqueta={etiqueta} titulo={titulo} onCerrar={cerrar}>
          {children(cerrar)}
        </HojaDelMenu>
      )}
    </div>
  )
}

/** El botón redondo «···» de siempre (borde fino, gris). */
export function BotonPuntitos({ etiqueta, tam = 28, datos, onClick }: { etiqueta: string; tam?: number; datos?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      title="Más opciones"
      aria-label={etiqueta}
      data-menu-hoja={datos ?? ''}
      className="flex shrink-0 items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-[12px] font-bold leading-none tracking-[1px] text-text/60 hover:bg-bg-hover"
      style={{ width: tam, height: tam }}
    >
      ···
    </button>
  )
}

/**
 * La hoja de un menú (Tanda 10N4 §3: el formato de «Hojas Opciones» de Design, `HojaOpciones`). Los hijos son `OpcionTarjeta`. `z`: por encima de otra hoja, si hace falta.
 */
export function HojaDelMenu({ etiqueta, titulo, onCerrar, children, z, cabecera, datos }: { etiqueta?: string; titulo: ReactNode; onCerrar: () => void; children: ReactNode; z?: number; cabecera?: ReactNode; datos?: string }) {
  return (
    <span data-hoja-menu="1">
      <HojaOpciones etiqueta={etiqueta} titulo={titulo} onCerrar={onCerrar} z={z} cabecera={cabecera} datos={datos ?? 'menu'}>
        {children}
      </HojaOpciones>
    </span>
  )
}
