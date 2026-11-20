import { useEffect, useState, type ReactNode } from 'react'
import { mandar, pedir, type DestinosDelPanel } from './api'
import { Pastilla, SERIE, boton, tarjeta, Vacio } from './estilo'

/**
 * (V33, Design P4) DESTINOS Y «AVÍSAME»: los destinos más pedidos y los «Próximamente» (V31) con cuántas personas pulsaron [Avísame]. [Ya está disponible: avisarles] manda un aviso a la campana y un correo a quien pulsó
 * [Avísame] para ese destino, UNA sola vez por persona y destino. Sin la clave de correo, solo la campana (y se dice).
 */
export function Destinos({ movil }: { movil: boolean }): ReactNode {
  const [d, setD] = useState<DestinosDelPanel | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const cargar = () => void pedir<DestinosDelPanel>('/api/admin/destinos').then(setD)
  useEffect(cargar, [])
  if (!d) return <p>Cargando…</p>
  const avisar = async (destino: string) => {
    setOcupado(true)
    const r = await mandar<{ ok: boolean; campana: number; correos: number; ya_avisados: number; correo: string }>('/api/admin/destinos/ya-disponible', { destino })
    setOcupado(false)
    setMensaje(r?.ok ? `${destino}: avisadas ${r.campana} personas en la campana y ${r.correos} por correo${r.ya_avisados ? ` (${r.ya_avisados} ya estaban avisadas)` : ''}${r.correo === 'sin_clave' ? '. Los correos están apagados (falta RESEND_API_KEY).' : '.'}` : 'No se ha podido avisar.')
    cargar()
  }
  const max = Math.max(1, ...d.pedidos.map((x) => x.veces))
  return (
    <div data-seccion="destinos" style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: 14, alignItems: 'start' }}>
      <div style={tarjeta}>
        <span style={{ font: `400 24px ${SERIE}` }}>Destinos más pedidos</span>
        {d.pedidos.length === 0 && <Vacio>Nadie ha pedido un destino todavía.</Vacio>}
        {d.pedidos.map((p) => (
          <div key={p.destino} data-pedido={p.destino} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: '0 0 110px', font: "500 13px 'Geist'" }}>{p.destino}</span>
            <span style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(28,34,48,.08)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${(p.veces / max) * 100}%`, background: 'linear-gradient(90deg,#C99A44,#F3D88F)' }} /></span>
            <span style={{ flex: '0 0 36px', textAlign: 'right', font: "600 12px 'Geist Mono',monospace" }}>{p.veces}</span>
          </div>
        ))}
      </div>
      <div style={tarjeta}>
        <span style={{ font: `400 24px ${SERIE}` }}>«Próximamente» y «Avísame»</span>
        {d.proximamente.map((p) => (
          <div key={p.destino} data-proximamente={p.destino} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(28,34,48,.06)', flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 120, font: "600 14px 'Geist'" }}>{p.destino}</span>
            <Pastilla fondo="#F1EADC">{p.avisos} {p.avisos === 1 ? 'persona' : 'personas'}</Pastilla>
            {p.avisados > 0 && <Pastilla fondo="#DCEBDD" color="#2F6B43">{p.avisados} avisadas</Pastilla>}
            <button type="button" data-ya-disponible={p.destino} disabled={ocupado || p.avisos - p.avisados <= 0} onClick={() => void avisar(p.destino)} style={boton(true, ocupado || p.avisos - p.avisados <= 0)}>
              Ya está disponible: avisarles
            </button>
          </div>
        ))}
        {mensaje && <p data-mensaje-destinos role="status" style={{ margin: 0, font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.75)' }}>{mensaje}</p>}
        {!d.correo.activo && <p style={{ margin: 0, font: "400 12.5px/1.4 'Geist'", color: '#8A6210' }}>Los correos están apagados (falta RESEND_API_KEY en Vercel): [Ya está disponible] solo avisa en la campana.</p>}
      </div>
    </div>
  )
}
