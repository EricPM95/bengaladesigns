import { useState, type ReactNode } from 'react'
import { Hoja } from './Hoja'

/**
 * LOS MENÚS DE TRES PUNTITOS, DESDE ABAJO (Tanda 10N §6c, Eric 25-oct): el botón «···» y, al tocarlo, una HOJA BAJA (la pieza `Hoja`: tirador, ✕, se cierra deslizando o tocando fuera) con el nombre de lo que
 * se toca arriba y las opciones una debajo de otra, como en el iPhone. Nada de cuadritos flotantes encima del día o de la parada.
 *
 * USO
 *   <MenuHoja etiquetaBoton="Opciones de la parada" etiqueta="Parada" titulo="Iglesia del Gesù">
 *     {(cerrar) => (<><OpcionHoja onClick={() => { cerrar(); … }}>Cambiar parada</OpcionHoja><OpcionHoja peligro onClick={…}>Quitar parada</OpcionHoja></>)}
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
 * La hoja baja de un menú. El portal sigue a sus padres en el árbol de React, y el menú vive dentro de tarjetas que se abren al tocarlas: aquí se corta el toque para que no llegue a ellas.
 * `z`: por encima de otra hoja, si hace falta.
 */
export function HojaDelMenu({ etiqueta, titulo, onCerrar, children, z }: { etiqueta?: string; titulo: ReactNode; onCerrar: () => void; children: ReactNode; z?: number }) {
  return (
    <span onClick={(event) => event.stopPropagation()} data-hoja-menu="1">
      <Hoja baja etiqueta={etiqueta} titulo={titulo} onCerrar={onCerrar} z={z} datos="menu">
        <div className="-mx-1 flex flex-col">{children}</div>
      </Hoja>
    </span>
  )
}

/** Una opción de la hoja: una fila de 52 px, una debajo de otra, con su raya fina. `peligro`: en rojo (Eliminar, Quitar). */
export function OpcionHoja({ children, onClick, peligro = false, deshabilitada = false, icono, href, datos }: { children: ReactNode; onClick?: () => void; peligro?: boolean; deshabilitada?: boolean; icono?: ReactNode; href?: string; datos?: string }) {
  const estilo = {
    minHeight: 52,
    width: '100%',
    padding: '0 4px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left' as const,
    font: "500 15.5px 'Geist'",
    color: peligro ? 'oklch(0.55 0.19 25)' : '#1C2230',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(28,34,48,.08)',
    opacity: deshabilitada ? 0.4 : 1,
    cursor: deshabilitada ? 'default' : 'pointer',
  }
  const contenido = (
    <>
      {icono && <span aria-hidden="true" style={{ flex: 'none', display: 'inline-flex', color: peligro ? 'inherit' : 'rgba(28,34,48,.6)' }}>{icono}</span>}
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
    </>
  )
  if (href && !deshabilitada)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} data-opcion-hoja={datos ?? ''} style={estilo}>
        {contenido}
      </a>
    )
  return (
    <button type="button" disabled={deshabilitada} onClick={onClick} data-opcion-hoja={datos ?? ''} style={estilo}>
      {contenido}
    </button>
  )
}
