import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useUnirseUi } from '../../store/useUnirseUi'
import { usePerfilUi } from '../../store/usePerfilUi'
import { useArrastreParaCerrar } from '../ui/Hoja'
import { normalizarCodigo } from '../../lib/invitaciones'
import { abrirViajeRecienUnido, unirseConCodigo } from '../../lib/unirseConCodigo'
import { EVENTO_FRANJA_UNION, leerFranjaDeUnion, olvidarFranjaDeUnion, textosDeLaFranja, type FranjaDeUnion } from '../../lib/franjaDeUnion'

/**
 * LA HOJA «ESCRIBE EL CÓDIGO» (Tanda 10N5, apartado 3, `Piezas/Unirse Codigo` 01 y 02, exactamente igual): una hoja desde abajo con «UNIRME A UN VIAJE» / «Escribe el código», la ✕, los ocho huecos
 * del código (letras grandes, sin distinguir mayúsculas; los espacios y los guiones no cuentan) y [Unirme]. Si el código no es de ningún viaje, los huecos se ponen en rojo, sale el aviso rojo y [Unirme] se apaga
 * hasta que se cambia el código. Se abre desde la primera pantalla, el [+] del Perfil y los Ajustes (`useUnirseUi`).
 * Lo que pasa al tocar [Unirme] está en `unirseConCodigo` (lib): con cuenta, se abre el viaje; sin ella, primero la cuenta, y al entrar se une solo.
 */

const OSCURO = '#1C2230'
const LARGO = 8

function Hueco({ letra, rojo, activo }: { letra: string; rojo: boolean; activo: boolean }): ReactNode {
  return (
    <span
      data-hueco-codigo
      style={{ width: 34, height: 58, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 32px/1 'Instrument Serif',serif", background: '#FFFDF8', border: `1.5px solid ${rojo ? '#B3262E' : 'rgba(181,138,46,.7)'}`, boxShadow: `inset 0 -3px 0 ${activo ? 'rgba(181,138,46,.55)' : 'rgba(181,138,46,.18)'}`, boxSizing: 'border-box' }}
    >
      {letra}
    </span>
  )
}

export function HojaUnirse({ onCerrar }: { onCerrar: () => void }): ReactNode {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)
  const arrastre = useArrastreParaCerrar(onCerrar)
  const [subir, setSubir] = useState(0)
  const codigo = normalizarCodigo(texto).slice(0, LARGO)
  const completo = codigo.length === LARGO

  useEffect(() => {
    entrada.current?.focus()
  }, [])
  // Con el teclado abierto en el iPhone, la hoja sube con él (el botón [Unirme] nunca queda tapado).
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return undefined
    const mirar = () => setSubir(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    mirar()
    vv.addEventListener('resize', mirar)
    vv.addEventListener('scroll', mirar)
    return () => {
      vv.removeEventListener('resize', mirar)
      vv.removeEventListener('scroll', mirar)
    }
  }, [])
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  const unirme = async () => {
    if (!completo || ocupado || error) return
    setOcupado(true)
    const r = await unirseConCodigo(codigo)
    setOcupado(false)
    if (r.tipo === 'error') {
      setError(r.texto)
      return
    }
    onCerrar()
    if (r.tipo === 'necesita_cuenta') return // (la puerta de la app pide la cuenta; al entrar se une sola)
    usePerfilUi.getState().cerrar()
    void abrirViajeRecienUnido(r.tripId)
  }

  // Los ocho huecos, con el guion después del cuarto («ROMA-4K7Q»).
  const huecos: ReactNode[] = []
  for (let i = 0; i < LARGO; i++) {
    if (i === 4) huecos.push(<span key="guion" aria-hidden="true" style={{ width: 12, height: 2, background: 'rgba(28,34,48,.35)', margin: '0 3px' }} />)
    huecos.push(<Hueco key={i} letra={codigo[i] ?? ''} rojo={Boolean(error)} activo={!error && i === codigo.length} />)
  }

  return createPortal(
    <div data-hoja="unirse" data-hoja-unirse onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Escribe el código" style={{ position: 'fixed', inset: 0, zIndex: 96 }}>
      <div className="hoja-fondo" onClick={onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.45)' }} />
      <div
        className="hoja-panel"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: subir,
          maxHeight: '92%',
          margin: '0 auto',
          maxWidth: 520,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          translate: arrastre.dy > 0 ? `0 ${arrastre.dy}px` : undefined,
          transition: arrastre.arrastrando ? 'none' : 'translate .2s ease-out',
          borderRadius: '32px 32px 0 0',
          background: '#FDFBF4',
          color: OSCURO,
          padding: '10px 20px calc(34px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 -20px 40px rgba(0,0,0,.25)',
          fontFamily: "'Geist',system-ui,sans-serif",
        }}
      >
        <span data-hoja-tirador="1" {...arrastre.props} style={{ alignSelf: 'stretch', height: 24, margin: '-8px 40px -8px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'grab' }}>
          <span aria-hidden="true" style={{ display: 'block', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, paddingTop: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: '#6F4E37' }}>UNIRME A UN VIAJE</span>
            <span data-unirse-titulo style={{ font: "400 32px/1.05 'Instrument Serif',serif" }}>Escribe el código</span>
          </div>
          <button className="zona-toque" type="button" onClick={onCerrar} aria-label="Cerrar" data-hoja-cerrar style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', border: 'none', background: '#EEEAE0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={OSCURO} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {/* Los huecos: el campo de verdad va encima, transparente (el teclado, el pegar y el corregir funcionan como en cualquier campo). */}
        <div style={{ padding: error ? '8px 0 0' : '8px 0 10px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={() => entrada.current?.focus()}>
            {huecos}
          </div>
          <input
            ref={entrada}
            data-campo-codigo
            value={texto}
            onChange={(e) => {
              setTexto(normalizarCodigo(e.target.value).slice(0, LARGO))
              setError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && void unirme()}
            aria-label="Código del viaje"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="go"
            maxLength={24}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, border: 0, padding: 0, font: "400 16px 'Geist'", caretColor: 'transparent' }}
          />
        </div>
        {error && (
          <div role="alert" data-error-codigo style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 16, background: '#FFF8F7', border: '1px solid rgba(179,38,46,.25)', color: '#B3262E', font: "500 14px/1.4 'Geist'" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B3262E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
              <path d="M12 8v5M12 16.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => void unirme()}
          disabled={!completo || ocupado || Boolean(error)}
          data-unirme-codigo
          style={{
            height: 54,
            borderRadius: 16,
            border: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            font: "700 16px 'Geist'",
            cursor: !completo || error ? 'default' : 'pointer',
            ...(!completo || error || ocupado
              ? { background: 'rgba(28,34,48,.1)', color: 'rgba(28,34,48,.4)' }
              : { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -12px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }),
          }}
        >
          {ocupado ? 'Uniéndome…' : 'Unirme'}
        </button>
      </div>
    </div>,
    document.body,
  )
}

/**
 * LA FRANJA «TE HAS UNIDO AL VIAJE A ROMA DE ERIC» (`Piezas/Unirse Codigo` 03): arriba, sobre el viaje recién abierto, una tarjeta oscura con la inicial de quien lo organiza en un círculo dorado,
 * «Te has unido al viaje a Roma de Eric» y «Ahora lo ves igual que él». Se queda unos segundos o hasta que se toca.
 */
export function FranjaDeUnionHost(): ReactNode {
  const [franja, setFranja] = useState<FranjaDeUnion | null>(() => leerFranjaDeUnion())
  useEffect(() => {
    const mirar = () => setFranja(leerFranjaDeUnion())
    window.addEventListener(EVENTO_FRANJA_UNION, mirar)
    return () => window.removeEventListener(EVENTO_FRANJA_UNION, mirar)
  }, [])
  useEffect(() => {
    if (!franja) return undefined
    const t = window.setTimeout(() => {
      olvidarFranjaDeUnion()
      setFranja(null)
    }, 6500)
    return () => window.clearTimeout(t)
  }, [franja])
  if (!franja) return null
  const t = textosDeLaFranja(franja)
  const cerrar = () => {
    olvidarFranjaDeUnion()
    setFranja(null)
  }
  return createPortal(
    <div data-franja-union role="status" onClick={cerrar} style={{ position: 'fixed', left: 14, right: 14, top: 'max(56px, calc(env(safe-area-inset-top) + 10px))', zIndex: 130, maxWidth: 492, margin: '0 auto', animation: 'trazo-franja-baja .45s cubic-bezier(.2,.8,.2,1) both' }}>
      <style>{'@keyframes trazo-franja-baja{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:none}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 20, background: OSCURO, color: '#FBF3E2', boxShadow: '0 18px 30px -14px rgba(14,21,48,.8)', fontFamily: "'Geist',system-ui,sans-serif" }}>
        <span style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', background: 'linear-gradient(145deg,#FFF6DC,#E9C77A 60%,#B58A2E)', color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 18px 'Geist'" }}>{t.inicial}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span data-franja-titulo style={{ font: "600 14.5px/1.3 'Geist'" }}>{t.titulo}</span>
          <span data-franja-linea style={{ font: "400 13px/1.3 'Geist'", color: 'rgba(251,243,226,.72)' }}>{t.linea}</span>
        </span>
      </div>
    </div>,
    document.body,
  )
}

/** Se monta una vez en la app: la hoja del código (si está abierta) y la franja de «Te has unido…». */
export function UnirseHost(): ReactNode {
  const abierta = useUnirseUi((s) => s.abierta)
  const cerrar = useUnirseUi((s) => s.cerrar)
  return (
    <>
      {abierta && <HojaUnirse onCerrar={cerrar} />}
      <FranjaDeUnionHost />
    </>
  )
}
