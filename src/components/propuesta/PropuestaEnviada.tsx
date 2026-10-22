import { botonChampan } from '../../lib/marcaBoton'
import { createPortal } from 'react-dom'
import { textoMandadoA } from '../../lib/propuesta'
import { Icono } from '../ui/Icono'

/**
 * «SE LO HEMOS MANDADO A ELENA» (RSent, cuentas parte 3): pantalla completa con la palomita verde que aparece de golpe (sin movimiento con «reducir movimiento») y [Volver al viaje].
 */
export function PropuestaEnviada({ nombre, onVolver }: { nombre: string; onVolver: () => void }) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Propuesta enviada" data-propuesta-enviada style={{ position: 'fixed', inset: 0, zIndex: 96, background: '#F5EFE4', color: '#1C2230', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 30px', textAlign: 'center' }}>
      <span className="hoja-pop" style={{ width: 84, height: 84, borderRadius: '50%', background: 'oklch(0.55 0.11 150)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <Icono nombre="hecho" size={38} grosor={2.6} />
      </span>
      <span style={{ font: "400 32px/1.1 'Instrument Serif',serif" }}>{textoMandadoA(nombre)}</span>
      <button type="button" onClick={onVolver} style={{ marginTop: 20, width: '100%', maxWidth: 420, height: 52, borderRadius: 999, border: 'none', ...botonChampan(), font: "600 15px 'Geist'", cursor: 'pointer' }}>
        Volver al viaje
      </button>
    </div>,
    document.body,
  )
}
