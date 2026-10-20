import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from './Icono'

/**
 * La hoja que sube desde abajo (el diseño de las cuentas: «Pase Cuenta»): fondo que oscurece, asa, equis de 44 px y el contenido. Se cierra con la equis, tocando fuera o con Esc.
 * `oscura`: el fondo azul noche de la pantalla de entrar (texto claro). `z`: el nivel, por si va por encima de otra hoja.
 */
export function Hoja({
  onCerrar,
  etiqueta,
  titulo,
  children,
  oscura = false,
  z = 90,
  sinCerrar = false,
  datos,
}: {
  onCerrar?: () => void
  etiqueta?: string
  titulo?: ReactNode
  children?: ReactNode
  oscura?: boolean
  z?: number
  /** `true`: sin equis ni cierre al tocar fuera (una pregunta que hay que contestar). */
  sinCerrar?: boolean
  datos?: string
}) {
  useEffect(() => {
    if (!onCerrar || sinCerrar) return undefined
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar, sinCerrar])

  return createPortal(
    <div data-hoja={datos ?? ''} style={{ position: 'fixed', inset: 0, zIndex: z }} role="dialog" aria-modal="true" aria-label={typeof titulo === 'string' ? titulo : etiqueta}>
      <div className="hoja-fondo" onClick={sinCerrar ? undefined : onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.45)' }} />
      <div
        className="hoja-panel"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '92%',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          borderRadius: '26px 26px 0 0',
          background: oscura ? '#1C2230' : '#FFFDF8',
          color: oscura ? '#FFFDF8' : '#1C2230',
          padding: '12px 18px calc(30px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          margin: '0 auto',
          maxWidth: 520,
        }}
      >
        <span aria-hidden="true" style={{ alignSelf: 'center', width: 42, height: 4, flex: 'none', borderRadius: 4, background: 'rgba(128,128,128,.35)' }} />
        {!sinCerrar && onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{ position: 'absolute', right: 8, top: 8, width: 44, height: 44, border: 'none', background: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(128,128,128,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icono nombre="cerrar" size={13} grosor={2.2} />
            </span>
          </button>
        )}
        {etiqueta && <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: oscura ? '#F3D59A' : 'rgb(var(--accent-hover))' }}>{etiqueta}</span>}
        {titulo && <span style={{ paddingRight: 34, font: "400 25px/1.12 'Instrument Serif',serif", textWrap: 'pretty' }}>{titulo}</span>}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Los botones de las hojas del diseño: principal (dorado), oscuro y secundario (borde). */
export function BotonHoja({ children, tipo = 'principal', onClick, disabled, datos, enviar = false }: { children: ReactNode; tipo?: 'principal' | 'oscuro' | 'secundario'; onClick?: () => void; disabled?: boolean; datos?: string; enviar?: boolean }) {
  const estilos = {
    principal: { height: 54, background: 'oklch(0.8 0.14 70)', color: '#17120a', border: 'none', font: "700 15px 'Geist'" },
    oscuro: { height: 54, background: '#1C2230', color: '#FFFDF8', border: 'none', font: "600 15px 'Geist'" },
    secundario: { height: 46, background: 'transparent', color: 'inherit', border: '1px solid rgba(128,128,128,.3)', font: "600 13.5px 'Geist'" },
  }[tipo]
  return (
    <button
      type={enviar ? 'submit' : 'button'}
      onClick={onClick}
      disabled={disabled}
      data-boton-hoja={datos ?? tipo}
      style={{ ...estilos, flex: 'none', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, width: '100%' }}
    >
      {children}
    </button>
  )
}

/** El enlace subrayado de las hojas («¿No te llega? Enviar otra vez»), con su línea pequeña debajo si hace falta. */
export function EnlaceHoja({ children, onClick, subtitulo, disabled, datos }: { children: ReactNode; onClick?: () => void; subtitulo?: string; disabled?: boolean; datos?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-enlace-hoja={datos ?? ''}
      style={{ alignSelf: 'center', minHeight: 44, padding: '0 8px', border: 'none', background: 'transparent', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.55 : 1 }}
    >
      <span style={{ font: "500 12.5px 'Geist'", opacity: 0.8, textDecoration: 'underline', textUnderlineOffset: 3 }}>{children}</span>
      {subtitulo && <span style={{ font: "400 11px 'Geist'", opacity: 0.55 }}>{subtitulo}</span>}
    </button>
  )
}
