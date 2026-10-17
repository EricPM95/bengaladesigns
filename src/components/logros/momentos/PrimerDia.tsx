import { ICONOS as ICONOS_FAMILIA } from '../../../lib/iconos'
import type { ReactNode } from 'react'
import { pedirEstado } from './api'
import { FONDO_NOCHE, ORO } from './base'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * «HOY EMPIEZAS A GANAR LOGROS» (Tanda 8B, pantalla L0 de «Ayudas»). Sale una sola vez, al empezar el primer día del viaje con logros; se recuerda en el móvil.
 * Los textos son los del diseño.
 */
export const CLAVE_PRIMER_DIA = 'trazo:logros:primerdia'

export function yaVisto(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_PRIMER_DIA) === 'si'
  } catch {
    return false
  }
}

/** Mira si hoy es un día del viaje y aún no se ha enseñado; si toca, lo abre. */
export async function comprobarPrimerDia(tripId: string): Promise<void> {
  if (yaVisto()) return
  const e = await pedirEstado(tripId)
  if (!e) return
  const { inicio, fin, hoy } = e.viaje
  if (hoy >= inicio && hoy <= fin) useMomentosUI.getState().ponerPrimerDia(true)
}

const ICONOS = {
  visto: 'M5 12.5l4.5 4.5L19 7.5',
  gema: 'M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16M15 4l-3 16',
  pin: ICONOS_FAMILIA.mapa,
}

export default function PrimerDia(): ReactNode {
  const cerrar = () => {
    try {
      window.localStorage.setItem(CLAVE_PRIMER_DIA, 'si')
    } catch {
      /* sin almacenamiento */
    }
    useMomentosUI.getState().ponerPrimerDia(false)
  }
  const filas: { icono: string; fondo: string; color: string; texto: ReactNode }[] = [
    { icono: ICONOS.visto, fondo: '#F3E3B8', color: '#4A3612', texto: <>Toca <em style={{ fontStyle: 'normal', fontWeight: 700 }}>Visto</em> en cada sitio y gana sus pedazos.</> },
    { icono: ICONOS.gema, fondo: 'linear-gradient(140deg,#2A3146,#141826)', color: ORO, texto: 'Algunos sitios esconden un Emblema Oculto: haz la foto y descúbrelo.' },
    { icono: ICONOS.pin, fondo: '#FFFDF8', color: '#1C2230', texto: 'Todo se guarda en el botón flotante.' },
  ]
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Hoy empiezas a ganar logros" style={{ position: 'fixed', inset: 0, zIndex: 9000, background: FONDO_NOCHE, color: '#FFFDF8', fontFamily: "'Geist',system-ui,sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: ORO, animation: 'moUp .6s ease both' }}>Tu primer día</span>
      <span style={{ font: "400 40px/1.05 'Instrument Serif',serif", margin: '10px 0 26px', textWrap: 'balance', animation: 'moUp .6s .1s ease both' }}>Hoy empiezas a ganar logros</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>
        {filas.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', animation: `moUp .6s ${(0.3 + i * 0.15).toFixed(2)}s ease both` }}>
            <span style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: f.fondo, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={f.icono} /></svg>
            </span>
            <span style={{ font: "400 15px/1.4 'Geist'", color: 'rgba(255,253,248,.88)' }}>{f.texto}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={cerrar} style={{ marginTop: 34, width: '100%', maxWidth: 360, height: 54, border: 'none', borderRadius: 999, background: 'linear-gradient(110deg,#D9BE85,#F3E3B8 50%,#D9BE85)', color: '#2A1D10', font: "700 15px 'Geist'", cursor: 'pointer', animation: 'moUp .6s .8s ease both' }}>Empezar mi día</button>
    </div>
  )
}
