import type { CambioPropuesto } from '../../lib/propuesta'

/**
 * UNA FILA DE LA LISTA DE LA PROPUESTA (Tanda 10N, apartado 6; «Propuesta Cambios · 2 · Las hojas de la propuesta»). Un cambio por idea y en palabras normales:
 *   · icono y color por tipo: verde = añadir, rojo = quitar, oro = mover, cambiar el orden o cambiar una por otra (con la flecha de dos días al cambiar de día);
 *   · la etiqueta pequeña («DÍA 1 · JUE 26» o «JUE 26 → SÁB 28»), la frase y, si la hay, la segunda línea («Antes: Coliseo → Arco de Constantino»);
 *   · [Deshacer] (quien propone), [Aceptar] [Rechazar] (quien decide) o, ya decidido, «Aceptado ✓» / «Rechazado»;
 *   · la flechita › : al tocar la fila se abre el detalle.
 */
export const COLORES_DE_CAMBIO = {
  oro: { bg: '#F1E3BF', fg: '#8E6820' },
  rojo: { bg: '#FBEAEA', fg: '#B3262E' },
  verde: { bg: '#EAF4EC', fg: '#2B7F45' },
} as const

const ICONOS = { oro: 'M7 7h13l-4-4M17 17H4l4 4', rojo: 'M5 12h14', verde: 'M12 5v14M5 12h14', dia: 'M5 12h14M13 6l6 6-6 6' } as const

export const colorDelCambio = (tipo: CambioPropuesto['tipo']): keyof typeof COLORES_DE_CAMBIO => (tipo === 'quitar' ? 'rojo' : tipo === 'anadir' || tipo === 'dia_nuevo' || tipo === 'free_tour' ? 'verde' : 'oro')

export type DecisionDeFila = 'aceptado' | 'rechazado' | null

export function FilaDeCambio({
  cambio,
  modo,
  decision = null,
  ocupado = false,
  onDeshacer,
  onAceptar,
  onRechazar,
  onAbrir,
  onQuitar,
}: {
  cambio: CambioPropuesto
  /** `mia`: quien propone, antes de enviar. `dueno`: quien decide. `enviada`: la propuesta ya mandada (solo mirar). */
  modo: 'mia' | 'dueno' | 'enviada'
  decision?: DecisionDeFila
  ocupado?: boolean
  onDeshacer?: () => void
  onAceptar?: () => void
  onRechazar?: () => void
  onAbrir?: () => void
  /** Un cambio que ya no tiene sentido: [Quitar]. */
  onQuitar?: () => void
}) {
  const color = COLORES_DE_CAMBIO[colorDelCambio(cambio.tipo)]
  const icono = cambio.tipo === 'mover_dia' ? ICONOS.dia : ICONOS[colorDelCambio(cambio.tipo)]
  const sinSentido = Boolean(cambio.sinSentido)
  return (
    <div
      data-cambio-propuesto={cambio.tipo}
      data-cambio-id={cambio.id}
      data-decision={decision ?? ''}
      data-sin-sentido={sinSentido ? '1' : undefined}
      onClick={sinSentido ? undefined : onAbrir}
      role={sinSentido ? undefined : 'button'}
      tabIndex={sinSentido ? undefined : 0}
      onKeyDown={(e) => {
        if (!sinSentido && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onAbrir?.()
        }
      }}
      style={{
        borderRadius: 18,
        background: '#FFFDF8',
        border: sinSentido ? '1.5px dashed rgba(179,38,46,.45)' : '1px solid rgba(28,34,48,.08)',
        boxShadow: '0 6px 12px -10px rgba(28,34,48,.4)',
        padding: '10px 12px',
        flex: 'none',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        cursor: sinSentido ? 'default' : 'pointer',
        opacity: sinSentido ? 0.9 : 1,
      }}
    >
      <span style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icono} />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span data-cambio-etiqueta style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: color.fg }}>
          {cambio.etiqueta}
        </span>
        <span data-cambio-texto style={{ font: "600 14px/1.25 'Geist'", color: '#1C2230' }}>
          {cambio.texto}
        </span>
        {cambio.sub && (
          <span data-cambio-sub style={{ font: "400 11.5px/1.3 'Geist'", color: 'rgba(28,34,48,.55)' }}>
            {cambio.sub}
          </span>
        )}
        {sinSentido && (
          <span data-cambio-sin-sentido style={{ font: "500 12px/1.3 'Geist'", color: '#B3262E' }}>
            Ya no tiene sentido: {cambio.sinSentido}
          </span>
        )}
        {sinSentido && onQuitar && (
          <span style={{ paddingTop: 4 }}>
            <button type="button" data-quitar-sin-sentido onClick={onQuitar} style={{ minHeight: 44, padding: '0 15px', borderRadius: 999, border: '1px solid rgba(28,34,48,.22)', background: 'transparent', font: "600 12.5px 'Geist'", color: '#1C2230', cursor: 'pointer' }}>
              Quitar
            </button>
          </span>
        )}
        {!sinSentido && modo === 'mia' && onDeshacer && (
          <span style={{ paddingTop: 4 }}>
            <button
              type="button"
              data-deshacer-cambio
              onClick={(e) => {
                e.stopPropagation()
                onDeshacer()
              }}
              style={{ minHeight: 44, padding: '0 15px', borderRadius: 999, border: '1px solid rgba(28,34,48,.22)', background: 'transparent', font: "600 12px 'Geist'", color: '#1C2230', cursor: 'pointer' }}
            >
              Deshacer
            </button>
          </span>
        )}
        {!sinSentido && modo === 'dueno' && !decision && (
          <span style={{ display: 'flex', gap: 7, paddingTop: 5 }}>
            <button
              type="button"
              data-aceptar-cambio
              disabled={ocupado}
              onClick={(e) => {
                e.stopPropagation()
                onAceptar?.()
              }}
              style={{ minHeight: 44, padding: '0 17px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', font: "700 12.5px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}
            >
              Aceptar
            </button>
            <button
              type="button"
              data-rechazar-cambio
              disabled={ocupado}
              onClick={(e) => {
                e.stopPropagation()
                onRechazar?.()
              }}
              style={{ minHeight: 44, padding: '0 17px', borderRadius: 999, border: '1px solid rgba(28,34,48,.22)', background: 'transparent', font: "600 12.5px 'Geist'", color: '#1C2230', cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}
            >
              Rechazar
            </button>
          </span>
        )}
      </div>
      {decision && (
        <span
          data-estado-del-cambio={decision}
          style={{ alignSelf: 'center', height: 26, padding: '0 10px', borderRadius: 999, background: decision === 'aceptado' ? '#EAF4EC' : '#FBEAEA', color: decision === 'aceptado' ? '#2B7F45' : '#B3262E', display: 'flex', alignItems: 'center', font: "700 11.5px 'Geist'", whiteSpace: 'nowrap' }}
        >
          {decision === 'aceptado' ? 'Aceptado ✓' : 'Rechazado'}
        </span>
      )}
      {!sinSentido && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.45)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', alignSelf: 'center' }} aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
}
