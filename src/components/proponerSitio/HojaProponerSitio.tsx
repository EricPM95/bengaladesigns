import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from '../ui/Icono'
import { enviarPropuestaDeSitio, propuestaValida } from '../../lib/proponerSitio'

/**
 * (10S5) La hoja «Propón un sitio», exactamente como `Piezas/Billete Reservas` P2 y P3 de Design:
 *  P2: «Nombre del sitio» (ya escrito con lo que puso), «¿Algo más que debamos saber?» · opcional (Escríbelo aquí) y [Enviar];
 *  P3: el círculo con el ✓ dorado y «Gracias. Lo revisamos y, si encaja, lo añadimos.».
 * Se abre desde cualquier sitio con `abrirProponerSitio` (ver `useProponerSitioStore`). Si el envío falla, el aviso sale en la hoja y lo escrito se queda (se puede repetir).
 */
const GRADIENTE = 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)'

export function HojaProponerSitio({ nombreInicial, destino, origen, onClose }: { nombreInicial: string; destino: string; origen: string; onClose: () => void }) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [comentario, setComentario] = useState('')
  const [estado, setEstado] = useState<'escribiendo' | 'enviando' | 'enviado' | 'error'>('escribiendo')
  const campoNombre = useRef<HTMLInputElement>(null)
  const valido = propuestaValida(nombre)

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onClose])
  // Si no viene el nombre escrito, el cursor empieza en el nombre.
  useEffect(() => {
    if (!nombreInicial) campoNombre.current?.focus()
  }, [nombreInicial])

  const enviar = async () => {
    if (!valido || estado === 'enviando') return
    setEstado('enviando')
    const ok = await enviarPropuestaDeSitio({ nombre, comentario, destino, origen })
    setEstado(ok ? 'enviado' : 'error')
  }

  return createPortal(
    <div data-hoja="proponer-sitio" data-proponer-sitio={estado === 'enviado' ? 'enviado' : 'formulario'} style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} role="dialog" aria-modal="true" aria-labelledby="proponer-sitio-titulo">
      <div className="hoja-fondo" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,10,.5)' }} />
      <div
        className="hoja-panel"
        style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '92%', overflowY: 'auto', scrollbarWidth: 'none', borderRadius: '32px 32px 0 0', background: '#FBF3E2', color: '#1C2230', padding: '10px 18px calc(26px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 40px rgba(0,0,0,.25)' }}
      >
        <span aria-hidden="true" style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)', flex: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span id="proponer-sitio-titulo" style={{ font: "400 30px/1 'Instrument Serif',serif" }}>
            Propón un sitio
          </span>
          <button className="zona-toque" type="button" onClick={onClose} aria-label="Cerrar" data-proponer-sitio-cerrar style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'rgba(28,34,48,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1C2230' }}>
            <Icono nombre="cerrar" size={17} grosor={2} />
          </button>
        </div>

        {estado === 'enviado' ? (
          <div data-proponer-sitio-gracias style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '18px 0 8px', textAlign: 'center' }}>
            <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#1C2230', border: '2px solid #B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </span>
            <span style={{ font: "400 24px/1.25 'Instrument Serif',serif", maxWidth: 280 }}>Gracias. Lo revisamos y, si encaja, lo añadimos.</span>
          </div>
        ) : (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ font: "700 14.5px 'Geist'" }}>Nombre del sitio</span>
              <input
                ref={campoNombre}
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={120}
                autoComplete="off"
                data-proponer-sitio-nombre
                style={{ height: 54, borderRadius: 15, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', padding: '0 14px', font: "500 16px 'Geist'", color: '#1C2230' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: "700 14.5px 'Geist'" }}>¿Algo más que debamos saber?</span>
                <span style={{ font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.5)' }}>opcional</span>
              </span>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={1000}
                placeholder="Escríbelo aquí"
                data-proponer-sitio-comentario
                style={{ height: 96, borderRadius: 15, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', padding: 14, font: "500 16px 'Geist'", color: '#1C2230', resize: 'none' }}
              />
            </label>
            {estado === 'error' && (
              <p data-proponer-sitio-error style={{ margin: 0, font: "400 12.5px/1.35 'Geist'", color: 'rgb(var(--accent-red))' }}>
                No hemos podido enviarlo. Revisa la conexión e inténtalo otra vez.
              </p>
            )}
            <button
              type="button"
              disabled={!valido || estado === 'enviando'}
              onClick={enviar}
              data-proponer-sitio-enviar
              style={{ height: 54, borderRadius: 15, border: 'none', background: GRADIENTE, color: '#4A3510', font: "700 16px 'Geist'", boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)', opacity: !valido || estado === 'enviando' ? 0.45 : 1, cursor: !valido || estado === 'enviando' ? 'default' : 'pointer', flex: 'none' }}
            >
              Enviar
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
