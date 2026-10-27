import type { ReactNode } from 'react'

/**
 * LA FILA DE LA CAMPANA, IGUAL QUE EN DESIGN (Tanda 10N4 §2, `Piezas/Avisos Gestion`): tarjeta redonda de 20 px; el aviso nuevo en blanco con borde dorado y el puntito dorado, el leído en crema con borde gris;
 * el icono de 42 px (la inicial de quien lo hace, o el de la app); lo nuevo en negrita y lo leído en gris; «hace 5 min» debajo. En «Seleccionar», un circulito a la izquierda y, al elegir, fondo dorado claro y ✓.
 */
export interface SeleccionDeAvisos {
  activa: boolean
  elegidos: ReadonlySet<string>
  alternar: (clave: string) => void
}

export const SIN_SELECCION: SeleccionDeAvisos = { activa: false, elegidos: new Set(), alternar: () => undefined }

export function CirculoDeSeleccion({ elegido }: { elegido: boolean }) {
  return (
    <span
      data-aviso-circulo={elegido ? 'elegido' : 'libre'}
      aria-hidden="true"
      style={{ width: 24, height: 24, flex: 'none', borderRadius: '50%', marginTop: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: elegido ? '#1C2230' : 'transparent', border: `2px solid ${elegido ? '#1C2230' : 'rgba(28,34,48,.3)'}` }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBF3E2" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: elegido ? 1 : 0 }}>
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </span>
  )
}

export function FilaDeAviso({
  clave,
  leido,
  seleccion = SIN_SELECCION,
  seleccionable = true,
  onTocar,
  tocable = true,
  resaltado = false,
  icono,
  etiqueta,
  children,
  atributos,
}: {
  /** Con qué se elige en «Seleccionar» (`c:ID` de la cuenta, `a:ID` de la app). */
  clave: string
  leido: boolean
  seleccion?: SeleccionDeAvisos
  /** Los errores y los avisos del viaje (se arreglan, no se eliminan) no se pueden elegir. */
  seleccionable?: boolean
  onTocar?: () => void
  tocable?: boolean
  resaltado?: boolean
  icono: ReactNode
  /** El tipo en pequeño («FECHA ESPECIAL», «INFORMACIÓN»), solo en los avisos de la app. */
  etiqueta?: string
  children: ReactNode
  atributos?: Record<string, string | undefined>
}) {
  const elegido = seleccion.activa && seleccion.elegidos.has(clave)
  const puedeTocar = seleccion.activa ? seleccionable : tocable
  const toque = () => {
    if (seleccion.activa) {
      if (seleccionable) seleccion.alternar(clave)
      return
    }
    onTocar?.()
  }
  return (
    <div
      role={puedeTocar ? 'button' : undefined}
      tabIndex={puedeTocar ? 0 : undefined}
      data-fila-aviso={clave}
      {...atributos}
      data-sin-leer={!leido ? '1' : undefined}
      data-elegido={elegido ? '1' : undefined}
      onClick={(e) => {
        // Los botones de dentro ([Ver mi reserva], [Aceptar]…) hacen lo suyo; solo el resto de la fila abre el aviso.
        if (!seleccion.activa && (e.target as HTMLElement).closest('button, a')) return
        toque()
      }}
      onKeyDown={puedeTocar ? (e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && toque() : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '13px 12px',
        borderRadius: 20,
        background: elegido ? '#FBF3E2' : leido ? '#FFFDF8' : '#FFFFFF',
        border: `1px solid ${elegido ? '#B58A2E' : leido ? 'rgba(28,34,48,.1)' : 'rgba(181,138,46,.35)'}`,
        outline: resaltado ? '2px solid oklch(0.8 0.14 70)' : 'none',
        cursor: puedeTocar ? 'pointer' : 'default',
        opacity: seleccion.activa && !seleccionable ? 0.5 : 1,
        fontFamily: "'Geist',system-ui,sans-serif",
        textAlign: 'left',
      }}
    >
      {seleccion.activa && seleccionable && <CirculoDeSeleccion elegido={elegido} />}
      <span aria-hidden="true" style={{ width: 42, height: 42, flex: 'none', borderRadius: 13, background: leido ? '#F1EADC' : '#F3E2B0', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 22px/1 'Instrument Serif',serif", color: '#1C2230', overflow: 'hidden' }}>{icono}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {etiqueta && <span data-aviso-etiqueta style={{ font: "500 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>{etiqueta}</span>}
        {children}
      </div>
      {!leido && !seleccion.activa && <span aria-label="Sin leer" data-punto-aviso style={{ width: 10, height: 10, borderRadius: '50%', background: '#B58A2E', flex: 'none', marginTop: 6 }} />}
    </div>
  )
}

/** La letra del aviso: nuevo, 600 14.5 en negro; leído, 400 14 en gris (Design). */
export const letraDeAviso = (leido: boolean) => ({ font: leido ? "400 14px/1.35 'Geist'" : "600 14.5px/1.35 'Geist'", color: leido ? 'rgba(28,34,48,.62)' : '#1C2230', textWrap: 'pretty' as const })

/** «hace 9 min»: 12.5 px, gris. */
export const letraDeCuando = { font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.5)' } as const

/**
 * Las tarjetas con botones dentro (el gasto con [Aceptar] [Rechazar], la entrada con [Reservar la mía…]) llevan su propio diseño: en «Seleccionar» se les pone delante el circulito, se toca para elegir
 * (los botones se apagan) y, elegidas, un borde dorado. Fuera de «Seleccionar», tocar lo que no es un botón da el aviso por leído.
 */
export function ConSeleccion({ clave, seleccion, onLeer, children }: { clave: string; seleccion: SeleccionDeAvisos; onLeer?: () => void; children: ReactNode }) {
  const elegido = seleccion.activa && seleccion.elegidos.has(clave)
  return (
    <div
      data-fila-aviso={clave}
      data-elegido={elegido ? '1' : undefined}
      onClick={(e) => {
        if (seleccion.activa) return seleccion.alternar(clave)
        if ((e.target as HTMLElement).closest('button, a')) return
        onLeer?.()
      }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: seleccion.activa ? 'pointer' : undefined }}
    >
      {seleccion.activa && <CirculoDeSeleccion elegido={elegido} />}
      <div style={{ flex: 1, minWidth: 0, pointerEvents: seleccion.activa ? 'none' : undefined, borderRadius: 20, boxShadow: elegido ? '0 0 0 1.5px #B58A2E' : undefined }}>{children}</div>
    </div>
  )
}
