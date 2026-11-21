import type { AvisoDeCuenta } from '../../lib/avisos'
import { ICONO_CUENTANOS } from './ListaDeAvisos'

/**
 * (V35B) LA RESPUESTA DE ERIC, ABIERTA ENTERA (dentro de la campana): «Te hemos respondido» con lo que nos dice y, debajo, lo que había mandado el viajero («Tu reporte: Coliseo · Horario» y su texto).
 * También sirve para el «Gracias a ti, ya está arreglado» (sin cuerpo propio: el título ya es el mensaje). El reporte lo trae el servidor en `payload.reporte` ({titulo, texto}).
 */
export function RespuestaAbierta({ aviso, onCerrar }: { aviso: AvisoDeCuenta; onCerrar: () => void }) {
  const p = aviso.payload as { es_respuesta?: boolean; texto?: string; reporte?: { titulo?: string; texto?: string } }
  const esRespuesta = p.es_respuesta === true
  const reporte = p.reporte
  const cuerpo = esRespuesta ? String(p.texto ?? '').trim() : ''
  return (
    <div data-respuesta-abierta={esRespuesta ? 'respuesta' : 'hecho'} role="dialog" aria-modal="true" aria-label={aviso.texto} style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#FFFDF8', display: 'flex', flexDirection: 'column', fontFamily: "'Geist',system-ui,sans-serif", color: '#1C2230', paddingTop: 'env(safe-area-inset-top)' }}>
      <div style={{ flex: 'none', padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', color: '#6F4E37' }}>TU AVISO</span>
        <button type="button" className="zona-toque" data-respuesta-cerrar aria-label="Cerrar" onClick={onCerrar} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C2230', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 22px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: '#F3E2B0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A5A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONO_CUENTANOS} />
          </svg>
        </span>
        <h2 data-respuesta-titulo style={{ font: "400 30px/1.1 'Instrument Serif',serif", margin: 0 }}>{aviso.texto}</h2>
        {cuerpo && <p data-respuesta-texto style={{ font: "400 16px/1.5 'Geist'", margin: 0, whiteSpace: 'pre-wrap' }}>{cuerpo}</p>}
        {reporte && (reporte.titulo || reporte.texto) && (
          <div data-respuesta-reporte style={{ marginTop: 6, padding: '14px 16px', borderRadius: 18, background: '#FBF3E2', border: '1px solid rgba(181,138,46,.35)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: "600 13px 'Geist'", color: '#6E5018' }}>Tu reporte{reporte.titulo ? `: ${reporte.titulo}` : ''}</span>
            {reporte.texto && reporte.texto !== reporte.titulo && <span style={{ font: "400 14px/1.45 'Geist'", color: 'rgba(28,34,48,.75)', whiteSpace: 'pre-wrap' }}>{reporte.texto}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
