import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Chapa } from '../../dibujos'
import { NOMBRE_DE_GRUPO, type TituloDeViajero } from './api'

/**
 * «Elige tu título» (P1b de Design): la hoja que sube desde abajo al tocar el título del Perfil, con los logros de viajero que ya tiene ganados (el escalón más alto de cada uno).
 * Tocar uno lo elige; tocar el elegido lo quita. Con los títulos vacíos no se abre (el Perfil no pinta el botón).
 */
export function ElegirTitulo({ titulos, elegido, onElegir, onCerrar }: { titulos: TituloDeViajero[]; elegido: string | null; onElegir: (clave: string | null) => void; onCerrar: () => void }): ReactNode {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])
  return createPortal(
    <>
      <div onClick={onCerrar} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'rgba(28,34,48,.45)', animation: 'pfEntra .3s ease both' }} />
      <div role="dialog" aria-modal="true" aria-label="Elige tu título" data-elegir-titulo style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 76, maxHeight: '78vh', borderRadius: '28px 28px 0 0', background: '#FFFDF8', color: '#1C2230', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 32px)', display: 'flex', flexDirection: 'column', gap: 10, fontFamily: "'Geist',system-ui,sans-serif" }}>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" style={{ alignSelf: 'center', width: 64, height: 44, border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: -14 }}>
          <span style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        </button>
        <span style={{ marginTop: 6, font: "400 26px/1 'Instrument Serif',serif" }}>Elige tu título</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {titulos.map((t) => {
            const on = t.clave === elegido
            return (
              <button key={t.clave} type="button" onClick={() => onElegir(on ? null : t.clave)} aria-pressed={on} data-titulo={t.clave} style={{ minHeight: 58, display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px 6px 6px', borderRadius: 16, background: on ? 'oklch(0.8 0.14 70 / .14)' : '#FFFFFF', border: `1.5px solid ${on ? 'oklch(0.7 0.14 70)' : 'rgba(28,34,48,.08)'}`, textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
                <span style={{ width: 44, height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Chapa logro={t.id} escalon={t.escalon ?? undefined} tam={44} />
                </span>
                <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ font: "600 14px 'Geist'" }}>{t.nombre}</span>
                  <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.58)' }}>{NOMBRE_DE_GRUPO[t.grupo] ?? t.grupo}</span>
                </span>
                <span aria-hidden="true" style={{ width: 24, height: 24, flex: 'none', borderRadius: '50%', border: `1.5px solid ${on ? 'oklch(0.6 0.14 70)' : 'rgba(28,34,48,.25)'}`, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: on ? 'oklch(0.6 0.14 70)' : 'transparent' }} />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body,
  )
}
