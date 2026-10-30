import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useArrastreParaCerrar } from './Hoja'

/**
 * LA HOJA DE OPCIONES, IGUAL EN TODA LA APP (Tanda 10N4 §3, `Piezas/Hojas Opciones` de Design, 01 a 04).
 * Cada vez que el viajero elige qué hacer (cambiar, añadir, mover, quitar…) las opciones salen así: hoja desde abajo con tirador y ✕, arriba pequeño qué es
 * («PARADA») y debajo grande su nombre; cada opción, una TARJETA blanca con su icono en un cuadrado de color suave, el nombre en la letra de los títulos y,
 * debajo en gris, una línea que explica qué hace; «›» si lleva a otra pantalla; la que no se puede, en gris diciendo por qué; la de quitar, la última y en rojo.
 *
 * USO
 *   <HojaOpciones etiqueta="Parada" titulo="Fontana di Trevi" onCerrar={cerrar} datos="parada">
 *     <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.cambiar} titulo="Cambiar parada" linea="Elige otro sitio para este hueco" flecha onClick={…} />
 *     <OpcionTarjeta tono="gris" icono={ICONOS_OPCION.arriba} titulo="Mover antes" linea="Ya es la primera del día" deshabilitada />
 *     <OpcionTarjeta tono="rojo" icono={ICONOS_OPCION.papelera} titulo="Quitar parada" linea="Sale de tu ruta. Puedes deshacerlo" peligro onClick={…} />
 *   </HojaOpciones>
 *
 *   HojaOpciones:  `etiqueta` (pequeña, se pone en mayúsculas), `titulo` (grande), `onCerrar`, `z` (nivel, 94 por defecto), `datos` (data-hoja-opciones, para las pruebas),
 *                  `cabecera` (algo entre el título y las opciones: p. ej. la lista de personas de «Personas del viaje»). Los hijos son las tarjetas (o cualquier contenido).
 *   OpcionTarjeta: `tono` ('salvia' | 'arena' | 'azul' | 'gris' | 'rojo'), `icono` (el trazo SVG de 24×24: un `d` de ICONOS_OPCION, o un ReactNode), `titulo`, `linea`,
 *                  `flecha` (el «›»), `peligro` (rojo: tarjeta rosa, título rojo), `deshabilitada` (gris claro; `linea` dice por qué), `elegida` (el estilo de elegir: azul oscuro, texto claro,
 *                  icono en oro), `discontinua` (borde de rayas: «Añadir a alguien»), `derecha` (algo a la derecha, antes del «›»), `href` (enlace que abre fuera), `datos` (data-opcion-hoja), `atributos` (data-* extra).
 *   `HojaOpciones` lleva su propia hoja (portal): no hace falta envolverla en `Hoja`.
 */

export type TonoOpcion = 'salvia' | 'arena' | 'azul' | 'gris' | 'rojo'

const TONOS: Record<TonoOpcion, { fondo: string; trazo: string }> = {
  salvia: { fondo: '#DDE5D2', trazo: '#3E5A33' },
  arena: { fondo: '#F3E3B2', trazo: '#6E5018' },
  azul: { fondo: '#DCE4F2', trazo: '#2F4E86' },
  gris: { fondo: '#ECE8DE', trazo: '#6B665A' },
  rojo: { fondo: '#F7DCDC', trazo: '#B3262E' },
}

/** Los trazos de los iconos de Design (24×24, grosor 1.7), por si una opción nueva quiere el mismo. */
export const ICONOS_OPCION = {
  cambiar: 'M7 7h13l-4-4M17 17H4l4 4',
  calendario: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  arriba: 'M12 19V5M6 11l6-6 6 6',
  abajo: 'M12 5v14M6 13l6 6 6-6',
  papelera: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  pin: 'M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  mochila: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
  llave: 'M15 7a4 4 0 1 0-3.9 5L3 20v1h3v-2h2v-2l3-3M17 9h.01',
  salir: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  mas: 'M12 5v14M5 12h14',
  candado: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  camara: 'M4 8h3l2-3h6l2 3h3v12H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  galeria: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01',
  volver: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  mapa: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  ficha: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  campana: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  circulo: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
} as const

export function HojaOpciones({
  etiqueta,
  titulo,
  onCerrar,
  children,
  cabecera,
  z = 94,
  datos,
}: {
  etiqueta?: string
  titulo: ReactNode
  onCerrar: () => void
  children?: ReactNode
  cabecera?: ReactNode
  z?: number
  datos?: string
}) {
  const arrastre = useArrastreParaCerrar(onCerrar)
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  return createPortal(
    // El portal sigue a sus padres en el árbol de React y el menú vive dentro de tarjetas que se abren al tocarlas: aquí se corta el toque.
    <div data-hoja={datos ?? ''} data-hoja-opciones={datos ?? ''} onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: z }} role="dialog" aria-modal="true" aria-label={typeof titulo === 'string' ? titulo : etiqueta}>
      <div className="hoja-fondo" onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.45)' }} />
      <div
        className="hoja-panel"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '92%',
          margin: '0 auto',
          maxWidth: 520,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          translate: arrastre.dy > 0 ? `0 ${arrastre.dy}px` : undefined,
          transition: arrastre.arrastrando ? 'none' : 'translate .2s ease-out',
          borderRadius: '32px 32px 0 0',
          background: '#FDFBF4',
          color: '#1C2230',
          padding: '10px 20px calc(34px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 -20px 40px rgba(0,0,0,.25)',
          fontFamily: "'Geist',system-ui,sans-serif",
        }}
      >
        {/* El tirador: se agarra y se baja para cerrar (la zona de agarre es más alta que la rayita). */}
        <span data-hoja-tirador="1" {...arrastre.props} style={{ alignSelf: 'stretch', height: 24, margin: '-8px 40px -8px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'grab' }}>
          <span aria-hidden="true" style={{ display: 'block', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, paddingTop: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            {etiqueta && <span data-hoja-opciones-etiqueta style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: '#6F4E37', textTransform: 'uppercase' }}>{etiqueta}</span>}
            <span data-hoja-opciones-titulo style={{ font: "400 32px/1.05 'Instrument Serif',serif", textWrap: 'pretty', overflowWrap: 'anywhere' }}>{titulo}</span>
          </div>
          <button className="zona-toque" type="button" onClick={onCerrar} aria-label="Cerrar" data-hoja-cerrar style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', border: 'none', background: '#EEEAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {cabecera}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function OpcionTarjeta({
  tono = 'gris',
  icono,
  titulo,
  linea,
  flecha = false,
  peligro = false,
  deshabilitada = false,
  elegida = false,
  discontinua = false,
  derecha,
  onClick,
  href,
  datos,
  atributos,
}: {
  tono?: TonoOpcion
  icono?: string | ReactNode
  titulo: ReactNode
  linea?: ReactNode
  flecha?: boolean
  peligro?: boolean
  deshabilitada?: boolean
  elegida?: boolean
  discontinua?: boolean
  /** Algo a la derecha, antes del «›» (un «Solo Eric» con candado, un ✓ dorado…). */
  derecha?: ReactNode
  onClick?: () => void
  href?: string
  datos?: string
  atributos?: Record<string, string>
}) {
  const t = TONOS[peligro ? 'rojo' : deshabilitada ? 'gris' : tono]
  const colorTitulo = elegida ? '#FBF3E2' : peligro ? '#B3262E' : '#1C2230'
  const estilo = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '11px 14px 11px 11px',
    borderRadius: 22,
    textAlign: 'left' as const,
    textDecoration: 'none',
    color: '#1C2230',
    background: elegida ? '#1C2230' : peligro ? '#FFF8F7' : '#FFFDF8',
    border: elegida ? '1px solid #1C2230' : peligro ? '1px solid rgba(179,38,46,.25)' : discontinua ? '1.5px dashed rgba(28,34,48,.25)' : '1px solid rgba(28,34,48,.12)',
    opacity: deshabilitada ? 0.45 : 1,
    cursor: deshabilitada ? 'default' : 'pointer',
    boxSizing: 'border-box' as const,
  }
  const contenido = (
    <>
      <span aria-hidden="true" style={{ width: 54, height: 54, flex: 'none', borderRadius: 16, background: elegida ? 'rgba(251,243,226,.1)' : t.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {typeof icono === 'string' ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={elegida ? '#F3D88F' : t.trazo} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d={icono} />
          </svg>
        ) : (
          <span style={{ display: 'inline-flex', color: elegida ? '#F3D88F' : t.trazo }}>{icono}</span>
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span data-opcion-titulo style={{ font: "400 23px/1.1 'Instrument Serif',serif", color: colorTitulo }}>{titulo}</span>
        {linea && (
          <span data-opcion-linea style={{ font: "400 14px/1.3 'Geist'", color: elegida ? 'rgba(251,243,226,.72)' : 'rgba(28,34,48,.58)' }}>
            {linea}
          </span>
        )}
      </span>
      {derecha}
      {flecha && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={elegida ? 'rgba(251,243,226,.6)' : 'rgba(28,34,48,.35)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  )
  const comunes = { 'data-opcion-hoja': datos ?? '', 'data-peligro': peligro ? '1' : undefined, 'data-deshabilitada': deshabilitada ? '1' : undefined, 'data-flecha': flecha ? '1' : undefined, 'data-elegida': elegida ? '1' : undefined, ...atributos }
  if (href && !deshabilitada)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} {...comunes} style={estilo}>
        {contenido}
      </a>
    )
  return (
    <button type="button" disabled={deshabilitada} aria-pressed={elegida || undefined} onClick={onClick} {...comunes} style={estilo}>
      {contenido}
    </button>
  )
}
