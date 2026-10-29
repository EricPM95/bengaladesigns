import type { CSSProperties } from 'react'
import { nombreVisible } from '../../lib/nombrePersona'

/**
 * ELEGIR PERSONAS EN CUADRADOS (Tanda 10N10 §4; `Piezas/Vuelo Reservas` 05). Para ELEGIR a alguien («¿Para quién…?», «¿Quién lo ha pagado?», «Solo para algunos»): un cuadrado por persona con la inicial y el nombre;
 * azul oscuro con ✓ dorado si está marcada y blanco si no. Para ENSEÑAR quién es (sin elegir) se usa el redondo (`InicialDePersona`).
 *
 *   <PersonasCuadradas personas={[{id,nombre}]} marcados={ids} onAlternar={(id)=>…} grande datos="pagado" />
 *   `grande`: cuadrados más altos (para «¿Quién lo ha pagado?»). `unica`: elegir uno solo (al tocar uno, se marca solo ese). `minimo`: cuántos tienen que quedar marcados (por defecto 1; 0 permite vaciar).
 */

const AZUL = '#1C2230'
const CLARO = '#FBF3E2'
const ORO = '#F3D88F'

/** La letra de las preguntas de las hojas: tinta azul de Design. */
export const ESTILO_PREGUNTA: CSSProperties = { font: "600 15px/1.25 'Geist'", color: AZUL }

export interface PersonaElegible {
  id: string
  nombre: string | null | undefined
}

export function PersonasCuadradas({
  personas,
  marcados,
  onAlternar,
  grande = false,
  unica = false,
  minimo = 1,
  datos = 'personas',
  etiqueta,
}: {
  personas: PersonaElegible[]
  marcados: readonly string[]
  onAlternar: (id: string) => void
  grande?: boolean
  unica?: boolean
  minimo?: number
  datos?: string
  etiqueta?: string
}) {
  const alto = grande ? 76 : 62
  const alternar = (id: string) => {
    if (unica) return onAlternar(id)
    // No se deja vacío más allá del mínimo.
    if (marcados.includes(id) && marcados.length <= minimo) return
    onAlternar(id)
  }
  return (
    <div role="group" aria-label={etiqueta} data-personas-cuadradas={datos} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Math.max(personas.length, 1), 3)}, minmax(0,1fr))`, gap: 8 }}>
      {personas.map((p) => {
        const marcada = marcados.includes(p.id)
        const nombre = nombreVisible(p.nombre ?? '') || 'Alguien'
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={marcada}
            data-persona-cuadrada={p.id}
            data-elegida={marcada ? '1' : '0'}
            onClick={() => alternar(p.id)}
            style={{
              position: 'relative',
              height: alto,
              minWidth: 0,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: marcada ? AZUL : '#FFFDF8',
              color: marcada ? CLARO : AZUL,
              border: `1px solid ${marcada ? AZUL : 'rgba(28,34,48,.14)'}`,
              cursor: 'pointer',
              transition: 'background .15s,color .15s',
            }}
          >
            {marcada && (
              <svg aria-hidden="true" data-persona-marca width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ORO} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 7, right: 8 }}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            )}
            <span aria-hidden="true" style={{ font: `400 ${grande ? 26 : 22}px/1 'Instrument Serif',serif`, color: marcada ? ORO : 'rgba(28,34,48,.7)' }}>
              {(nombre[0] ?? '·').toUpperCase()}
            </span>
            <span style={{ font: "600 13px/1.1 'Geist'", maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 6px' }}>{nombre}</span>
          </button>
        )
      })}
    </div>
  )
}
