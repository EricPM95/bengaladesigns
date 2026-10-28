import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { DayPlan, Route } from '../../lib/types'
import { fichaDelDia } from '../../lib/nombreDeDia'
import { tituloSimpleDelDia } from '../../lib/tituloDelDia'
import { Icono } from './Icono'

/**
 * (Tanda 10N8, apartado 3i) LA HOJA PARA ELEGIR UN DÍA, exactamente como `Piezas/Hoja Dia` de Design. Una sola para toda la app: siempre que haya que elegir un día (añadir algo a un día, pasar algo a otro,
 * cambiar un día por otro: el Free Tour, cualquier sitio desde EXPLORAR o su ficha, «Mover a otro día» de una parada, una excursión…), esta hoja.
 *   · arriba el nombre de lo que se mueve (mono, color tierra) y la pregunta en serif; la ✕ a la derecha;
 *   · una fila por día: la fecha en su casilla (JUE · 12), el nombre del día y, si hace falta, una línea de por qué no. El día elegido, en azul noche con borde dorado y el ✓ dorado;
 *   · un día que no se puede elegir va apagado, con su candado y su porqué debajo (solo lo que mueve DÍAS ENTEROS bloquea: el día de una excursión; al añadir o mover una parada, nunca se bloquea un día);
 *   · el botón dorado de abajo dice qué pasa: «Pasar al miércoles 11», «Añadir al miércoles 11».
 */
export interface FilaDeDia {
  id: string
  /** «MIÉ» y «11» (sin fechas, «DÍA» y «3»). */
  semana: string
  numero: string
  titulo: string
  /** Por qué no se puede elegir (la fila sale apagada, con su candado). */
  bloqueo?: string | null
  /** Una línea normal debajo del nombre (un aviso que no impide elegir). */
  nota?: string | null
}

/** Las filas de la hoja para unos días del viaje, con su fecha y su nombre (el mismo que en DÍAS). `bloqueo` da el porqué de un día que no se puede elegir. */
export function filasDeDias(route: Route, dias: DayPlan[], bloqueo?: (dia: DayPlan) => string | null | undefined, nota?: (dia: DayPlan) => string | null | undefined): FilaDeDia[] {
  return dias.map((dia) => {
    const ficha = fichaDelDia(route, dia.dayNumber)
    return { id: dia.id, semana: ficha?.semana ?? 'DÍA', numero: ficha?.numero ?? String(dia.dayNumber), titulo: tituloSimpleDelDia(route, dia), bloqueo: bloqueo?.(dia) ?? null, nota: nota?.(dia) ?? null }
  })
}

export function HojaDia({
  etiqueta,
  titulo,
  filas,
  elegido,
  onElegir,
  boton,
  onConfirmar,
  onCerrar,
  ocupado = false,
  z = 90,
  datos = 'hoja-dia',
  children,
  error,
}: {
  etiqueta: string
  titulo: string
  filas: FilaDeDia[]
  elegido: string | null
  onElegir: (id: string) => void
  /** El texto del botón dorado («Añadir al miércoles 11»). Sin día elegido, lo que diga (p. ej. «Elige un día»). */
  boton: string
  onConfirmar: () => void
  onCerrar: () => void
  ocupado?: boolean
  z?: number
  datos?: string
  /** Avisos de debajo de la lista (p. ej. la línea roja «El miércoles 11 cierran los Museos Capitolinos.»). */
  children?: ReactNode
  error?: string | null
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) onCerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar, ocupado])

  return createPortal(
    <div data-hoja-dia={datos} data-hoja={datos} style={{ position: 'fixed', inset: 0, zIndex: z, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="hoja-fondo" onClick={ocupado ? undefined : onCerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,10,.5)' }} />
      <div
        className="hoja-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          maxHeight: '92%',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          borderRadius: '32px 32px 0 0',
          background: '#FBF3E2',
          color: '#1C2230',
          padding: '12px 18px calc(34px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 -20px 40px rgba(0,0,0,.25)',
        }}
      >
        <span aria-hidden="true" style={{ display: 'block', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)', margin: '0 auto 2px', flex: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: '#6F4E37', textTransform: 'uppercase' }}>{etiqueta}</span>
            <span data-hoja-dia-titulo="1" style={{ font: "400 34px/1.05 'Instrument Serif',serif" }}>
              {titulo}
            </span>
          </span>
          <button type="button" onClick={onCerrar} disabled={ocupado} aria-label="Cerrar" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'rgba(28,34,48,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1C2230' }}>
            <Icono nombre="cerrar" size={18} grosor={2} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 4 }}>
          {filas.map((fila) => {
            const bloqueado = Boolean(fila.bloqueo)
            const activo = !bloqueado && fila.id === elegido
            const texto = bloqueado ? 'rgba(28,34,48,.5)' : '#1C2230'
            return (
              <button
                key={fila.id}
                type="button"
                data-dia-id={fila.id}
                data-bloqueado={bloqueado ? '1' : undefined}
                aria-pressed={activo}
                disabled={bloqueado || ocupado}
                onClick={() => onElegir(fila.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '11px 14px 11px 11px',
                  borderRadius: 22,
                  textAlign: 'left',
                  cursor: bloqueado ? 'not-allowed' : 'pointer',
                  background: activo ? '#1C2230' : bloqueado ? '#F4EFE3' : '#FFFDF8',
                  border: activo ? '1.5px solid #E9C77A' : bloqueado ? '1px solid rgba(28,34,48,.08)' : '1px solid rgba(28,34,48,.12)',
                  boxShadow: activo ? '0 10px 20px -12px rgba(28,34,48,.7)' : undefined,
                  color: activo ? '#FBF3E2' : texto,
                }}
              >
                <span style={{ width: 54, height: 58, flex: 'none', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, background: activo ? 'rgba(233,199,122,.16)' : bloqueado ? 'rgba(28,34,48,.06)' : '#F3E3B2' }}>
                  <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', color: activo ? '#E9C77A' : bloqueado ? 'rgba(28,34,48,.4)' : '#6E5018' }}>{fila.semana}</span>
                  <span style={{ font: "400 26px/1 'Instrument Serif',serif", color: activo ? '#FBF3E2' : bloqueado ? 'rgba(28,34,48,.45)' : '#1C2230' }}>{fila.numero}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ font: "600 15px/1.25 'Geist'" }}>{fila.titulo}</span>
                  {(fila.bloqueo || fila.nota) && <span style={{ font: "400 12.5px/1.3 'Geist'", color: activo ? 'rgba(251,243,226,.75)' : 'rgba(28,34,48,.5)' }}>{fila.bloqueo ?? fila.nota}</span>}
                </span>
                {activo ? (
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#E9C77A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  </span>
                ) : bloqueado ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                    <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
                  </svg>
                ) : (
                  <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid rgba(28,34,48,.25)', flex: 'none' }} />
                )}
              </button>
            )
          })}
        </div>

        {children}
        {error && (
          <p data-hoja-dia-error="1" style={{ margin: 0, font: "400 12.5px/1.35 'Geist'", color: 'rgb(var(--accent-red))' }}>
            {error}
          </p>
        )}
        <button
          type="button"
          data-hoja-dia-boton="1"
          disabled={!elegido || ocupado}
          onClick={onConfirmar}
          style={{
            marginTop: 6,
            height: 54,
            borderRadius: 16,
            border: 'none',
            background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)',
            color: '#4A3510',
            font: "700 16px 'Geist'",
            boxShadow: '0 10px 20px -12px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)',
            opacity: !elegido || ocupado ? 0.45 : 1,
            cursor: !elegido || ocupado ? 'default' : 'pointer',
            flex: 'none',
          }}
        >
          {boton}
        </button>
      </div>
    </div>,
    document.body,
  )
}
