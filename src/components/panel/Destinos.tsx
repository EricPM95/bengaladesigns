import { useEffect, useState, type ReactNode } from 'react'
import { fechaCorta, mandar, pedir, type DestinosDelPanel } from './api'
import { Bandera, isoDe } from './banderas'
import { SERIE } from './estilo'
import { parametrosDePeriodo, SelectorDePeriodo, TituloConPeriodo, usePeriodo } from './periodo'

/**
 * (V35A, Design P4/P4b/M4) DESTINOS PEDIDOS: los destinos que pide la gente en el periodo elegido («Los más pedidos · este mes», con bandera, barra y cuántos quieren que les avisemos) y los «Próximamente» con cuánta gente espera.
 * [Avisar] / [Ya está disponible: avisarles] avisa UNA sola vez por persona y destino: la campana (si tiene cuenta) y el correo. «Añadir un destino», «Pasar a Próximamente» y «Quitar» (que guardan los Próximamente en la base de datos)
 * llegan en la V35B: aquí salen apagados con «Pronto». Sin la clave de correo, solo la campana (y se dice).
 */
const botonOro = (desactivado: boolean) => ({ height: 36, padding: '0 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', color: '#4A3510', font: "700 13px 'Geist'", opacity: desactivado ? 0.4 : 1, cursor: desactivado ? 'default' : 'pointer' }) as const

export function Destinos({ movil }: { movil: boolean }): ReactNode {
  const p = usePeriodo()
  const [d, setD] = useState<DestinosDelPanel | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const cargar = () => void pedir<DestinosDelPanel>(`/api/admin/destinos?${parametrosDePeriodo(p)}`).then(setD)
  useEffect(cargar, [p.periodo, p.desde, p.hasta]) // eslint-disable-line react-hooks/exhaustive-deps
  const periodo = <SelectorDePeriodo movil={movil} />
  if (!d) return <div data-seccion="destinos" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{periodo}<p>Cargando…</p></div>
  const avisar = async (destino: string) => {
    setOcupado(true)
    const r = await mandar<{ ok: boolean; campana: number; correos: number; ya_avisados: number; correo: string }>('/api/admin/destinos/ya-disponible', { destino })
    setOcupado(false)
    setMensaje(r?.ok ? `${destino}: avisadas ${r.campana} personas en la campana y ${r.correos} por correo${r.ya_avisados ? ` (${r.ya_avisados} ya estaban avisadas)` : ''}${r.correo === 'sin_clave' ? '. El correo está apagado (falta RESEND_API_KEY en Vercel).' : '.'}` : 'No se ha podido avisar.')
    cargar()
  }
  const max = Math.max(1, ...d.pedidos.map((x) => x.veces))
  return (
    <div data-seccion="destinos" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
      {periodo}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button" data-anadir-destino disabled title="Pronto" style={{ height: 44, padding: '0 22px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', color: '#4A3510', font: "700 14px 'Geist'", opacity: 0.45, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Añadir un destino
        </button>
        <span data-pronto style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Pronto: nombre y país, a mano</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.25fr 1fr', gap: 14, alignItems: 'start' }}>
        <div data-bloque="mas-pedidos" style={{ borderRadius: 24, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <TituloConPeriodo texto="Los más pedidos" titulo={d.periodo.titulo} />
          {d.pedidos.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Nadie ha pedido un destino en este periodo.</span>}
          {d.pedidos.map((x) => {
            const pendientes = Math.max(0, x.quieren_aviso - x.avisados)
            const todosAvisados = x.quieren_aviso > 0 && pendientes === 0
            return (
              <div key={x.destino} data-pedido={x.destino} style={{ padding: 12, borderRadius: 18, background: '#F7F1E4', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bandera iso={isoDe(x.destino)} tam={20} />
                  <span style={{ width: movil ? 100 : 130, font: "600 14px/1.2 'Geist'" }}>{x.destino}</span>
                  <span style={{ flex: 1, height: 10, borderRadius: 10, background: '#E8DFC9', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.round((x.veces / max) * 100)}%`, background: 'linear-gradient(90deg,#E4C36E,#C99A44)' }} /></span>
                  <b style={{ width: 36, textAlign: 'right', font: "700 14px 'Geist'" }}>{x.veces}</b>
                </div>
                <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{x.quieren_aviso} {x.quieren_aviso === 1 ? 'quiere' : 'quieren'} que les avisemos</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {todosAvisados ? (
                    <span data-avisados style={{ height: 34, padding: '0 14px', borderRadius: 12, background: '#DCEBDD', color: '#2F6B43', display: 'inline-flex', alignItems: 'center', font: "700 12.5px 'Geist'" }}>Avisados ✓{x.ultimo_aviso ? ` · ${fechaCorta(x.ultimo_aviso).replace(/\s\d{2}$/, '')}` : ''}</span>
                  ) : (
                    <button type="button" data-avisar={x.destino} disabled={ocupado || pendientes <= 0} onClick={() => void avisar(x.destino)} style={botonOro(ocupado || pendientes <= 0)}>Avisar</button>
                  )}
                  {x.lanzado ? null : x.proximamente ? (
                    <span style={{ height: 30, padding: '0 12px', borderRadius: 12, background: '#E3E8F4', color: '#2A4A94', display: 'inline-flex', alignItems: 'center', font: "700 12px 'Geist'" }}>En Próximamente</span>
                  ) : (
                    <button type="button" data-pasar-proximamente disabled title="Pronto" style={{ height: 34, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(28,34,48,.2)', background: '#FFFFFF', font: "600 13px 'Geist'", opacity: 0.45 }}>Pasar a Próximamente</button>
                  )}
                </div>
                {x.quieren_aviso === 0 && <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.45)' }}>Nadie lo espera todavía</span>}
              </div>
            )
          })}
        </div>
        <div data-bloque="proximamente" style={{ borderRadius: 24, background: '#FFFFFF', border: '1px solid rgba(28,34,48,.08)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ font: "600 14px 'Geist'" }}>Próximamente</span>
          {d.proximamente.map((x) => {
            const pendientes = Math.max(0, x.avisos - x.avisados)
            return (
              <div key={x.destino} data-proximamente={x.destino} style={{ padding: 12, borderRadius: 18, background: '#F7F1E4', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Bandera iso={x.iso ?? isoDe(x.destino)} tam={20} estilo={{ marginTop: 4 }} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ font: `400 22px/1.1 ${SERIE}` }}>{x.destino}</span>
                    <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{x.avisos} {x.avisos === 1 ? 'persona esperando' : 'personas esperando'}</span>
                  </span>
                  <button type="button" data-quitar disabled title="Pronto" style={{ background: 'none', border: 'none', font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.55)', opacity: 0.5 }}>🗑 Quitar</button>
                </div>
                <button type="button" data-ya-disponible={x.destino} disabled={ocupado || pendientes <= 0} onClick={() => void avisar(x.destino)} style={{ minHeight: 40, borderRadius: 12, border: 'none', background: pendientes > 0 ? '#1C2230' : '#E8DFC9', color: pendientes > 0 ? '#F3D88F' : 'rgba(28,34,48,.4)', font: "700 13.5px 'Geist'", cursor: pendientes > 0 ? 'pointer' : 'default' }}>Ya está disponible: avisarles</button>
                {x.avisos === 0 && <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.45)' }}>Nadie lo espera todavía</span>}
              </div>
            )
          })}
          {mensaje && <p data-mensaje-destinos role="status" style={{ margin: 0, font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.75)' }}>{mensaje}</p>}
          {!d.correo.activo && <p style={{ margin: 0, font: "400 12.5px/1.4 'Geist'", color: '#8A6210' }}>Los correos están apagados (falta RESEND_API_KEY en Vercel): [Ya está disponible] solo avisa en la campana.</p>}
        </div>
      </div>
    </div>
  )
}
