import { useEffect, useState, type ReactNode } from 'react'
import { euros, fechaCorta, pedir, type Ventas as DatosVentas } from './api'
import { Barras, Cifra, Vacio, tarjeta } from './estilo'

/**
 * (V33, Design P5) VENTAS: pases por destino y por día (un gráfico sencillo), los ingresos del mes y las últimas compras (fecha, destino, tipo e importe). Nunca datos de tarjeta. Los pases dados a mano o con código cuentan 0 €;
 * las compras anteriores a que el webhook guardara el importe salen con «—» y el panel lo avisa.
 */
export function Ventas({ movil }: { movil: boolean }): ReactNode {
  const [v, setV] = useState<DatosVentas | null>(null)
  useEffect(() => {
    void pedir<DatosVentas>('/api/admin/ventas').then(setV)
  }, [])
  if (!v) return <p>Cargando…</p>
  const maxDestino = Math.max(1, ...v.por_destino.map((x) => x.n))
  return (
    <div data-seccion="ventas" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        <Cifra etiqueta="Pases hoy" valor={v.pases_hoy} />
        <Cifra etiqueta="Pases este mes" valor={v.pases_mes} />
        <Cifra etiqueta="Ingresos del mes" valor={euros(v.ingresos_mes_cent, v.moneda)} oscura />
      </div>
      {!v.importes_conocidos && <p data-aviso-importes style={{ margin: 0, font: "400 13px/1.4 'Geist'", color: '#8A6210' }}>Algunas compras (las anteriores a que la app guardara el importe) no tienen importe: salen con «—» y cuentan 0 €.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.3fr 1fr', gap: 14 }}>
        <div style={tarjeta}>
          <span style={{ font: "600 14px 'Geist'" }}>Pases por día · últimos 30 días</span>
          <Barras valores={v.por_dia.map((x) => x.n)} etiquetas={v.por_dia.map((x) => x.dia)} alto={movil ? 90 : 140} />
        </div>
        <div style={tarjeta}>
          <span style={{ font: "600 14px 'Geist'" }}>Pases por destino</span>
          {v.por_destino.length === 0 && <Vacio>Aún no hay ventas.</Vacio>}
          {v.por_destino.map((d) => (
            <div key={d.destino} data-venta-destino={d.destino} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: '0 0 96px', font: "500 13px 'Geist'" }}>{d.destino}</span>
              <span style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(28,34,48,.08)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${(d.n / maxDestino) * 100}%`, background: 'linear-gradient(90deg,#C99A44,#F3D88F)' }} /></span>
              <span style={{ flex: '0 0 32px', textAlign: 'right', font: "600 12px 'Geist Mono',monospace" }}>{d.n}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={tarjeta}>
        <span style={{ font: "600 14px 'Geist'" }}>Últimas compras</span>
        {v.compras.length === 0 && <Vacio>Aún no hay compras.</Vacio>}
        {v.compras.map((c, i) => (
          <div key={i} data-compra style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 80px', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(28,34,48,.06)', font: "400 13px 'Geist'" }}>
            <span style={{ color: 'rgba(28,34,48,.55)' }}>{fechaCorta(c.fecha)}</span>
            <span>{c.destino}</span>
            <span>{c.tipo}</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{euros(c.importe_cent, c.moneda)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
