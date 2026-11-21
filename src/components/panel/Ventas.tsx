import { useEffect, useState, type ReactNode } from 'react'
import { euros, fechaCorta, miles, nombreDePase, pedir, type CompraDelPanel, type Ventas as DatosVentas } from './api'
import { Bandera } from './banderas'
import { Cifra, etiquetaMono, SERIE, tarjeta, tarjetaGrande } from './estilo'
import { GraficoDePases } from './Inicio'
import { irAFicha } from './navegar'
import { parametrosDePeriodo, SelectorDePeriodo, TituloConPeriodo, usePeriodo } from './periodo'

/**
 * (V35A, Design P5/P5b/M5/M5b) VENTAS: lo vendido en el periodo elegido, solo cobros reales. Tarjetas (pases vendidos, ingresos, «lo que te queda» antes de impuestos, conversión), «Pases por día», «Pases por destino» con bandera
 * e ingresos, «Últimas compras» (quién compró, con enlace a su ficha; Comprado, «Regalado» o «Reembolsado»; importe) y «Afiliados» (los dos paneles; los clics, «Pronto»). (V35B) «Lo que te queda» = ingresos − comisión de Stripe − devoluciones, antes de impuestos; las devoluciones salen en rojo suave y tachadas; los clics de afiliados son de verdad (sin saber quién).
 * Nunca datos de tarjeta.
 */
const textoDeFecha = (iso: string): string => fechaCorta(iso).replace(/\s\d{2}$/, '').replace('.', '')

function Pastillita({ children, fondo, color }: { children: ReactNode; fondo: string; color: string }): ReactNode {
  return <span style={{ flex: 'none', height: 22, padding: '0 9px', borderRadius: 999, background: fondo, color, display: 'inline-flex', alignItems: 'center', font: "700 11px 'Geist'", whiteSpace: 'nowrap' }}>{children}</span>
}

export function FilaDeCompra({ c, movil }: { c: CompraDelPanel; movil: boolean }): ReactNode {
  const tipo = `${nombreDePase(c.tipo)}${c.tipo === 'grupo' && c.personas ? ` ×${c.personas}` : ''}`
  return (
    <div data-compra={c.estado} style={{ display: 'flex', alignItems: 'center', gap: movil ? 8 : 12, padding: c.estado === 'reembolsado' ? '10px 8px' : '10px 0', borderTop: '1px solid rgba(28,34,48,.06)', flexWrap: movil ? 'wrap' : 'nowrap', background: c.estado === 'reembolsado' ? 'oklch(0.97 0.03 5)' : 'transparent', borderRadius: c.estado === 'reembolsado' ? 10 : 0, textDecoration: c.estado === 'reembolsado' ? 'line-through' : 'none', textDecorationColor: 'oklch(0.5 0.19 5)' }}>
      <span style={{ width: 46, font: "400 13px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{textoDeFecha(c.fecha)}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: movil ? 110 : 130, font: "600 13px 'Geist'" }}>
        <Bandera iso={c.destino} tam={15} />
        {c.destino}
      </span>
      <Pastillita fondo="#F3EBD8" color="#1C2230">{tipo}</Pastillita>
      <span style={{ flex: 1, minWidth: 90, font: "500 13px 'Geist'", color: '#1C2230' }}>
        {c.persona ? (
          <button type="button" data-ver-ficha={c.persona.id} onClick={() => irAFicha(c.persona!.id)} style={{ background: 'none', border: 'none', padding: 0, font: "500 13px 'Geist'", color: '#1C2230', cursor: 'pointer', textAlign: 'left' }}>
            {c.persona.nombre} <span style={{ color: '#8A6A2C', fontWeight: 700 }}>›</span>
          </button>
        ) : (
          <span data-sin-cuenta style={{ color: 'rgba(28,34,48,.5)' }}>Sin cuenta asociada</span>
        )}
      </span>
      {c.estado === 'regalado' && <Pastillita fondo="#F1E6FA" color="#6A3A9A">Regalado</Pastillita>}
      {c.estado === 'reembolsado' && <Pastillita fondo="oklch(0.97 0.03 5)" color="oklch(0.5 0.19 5)">Reembolsado</Pastillita>}
      <span style={{ minWidth: 62, textAlign: 'right', font: "700 13.5px 'Geist'", color: c.estado === 'reembolsado' ? 'oklch(0.5 0.19 5)' : '#1C2230', textDecoration: c.estado === 'reembolsado' ? 'line-through' : 'none' }}>{euros(c.importe_cent, c.moneda)}</span>
    </div>
  )
}

export function Ventas({ movil }: { movil: boolean }): ReactNode {
  const p = usePeriodo()
  const [v, setV] = useState<DatosVentas | null>(null)
  useEffect(() => {
    let vivo = true
    void pedir<DatosVentas>(`/api/admin/ventas?${parametrosDePeriodo(p)}`).then((r) => vivo && setV(r))
    return () => {
      vivo = false
    }
  }, [p.periodo, p.desde, p.hasta])
  const periodo = <SelectorDePeriodo movil={movil} />
  if (!v) return <div data-seccion="ventas" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{periodo}<p>Cargando…</p></div>
  const maxDestino = Math.max(1, ...v.por_destino.map((d) => d.n))
  const eur = (c: number) => euros(c, v.moneda)
  const titulo = v.periodo.titulo
  const rel = movil ? '14px' : '16px'
  const tam = movil ? 30 : 36
  return (
    <div data-seccion="ventas" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
      {periodo}
      <div data-tarjetas style={{ display: 'grid', gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(4,minmax(0,1fr))', gap: 12 }}>
        <Cifra etiqueta="Pases vendidos" valor={miles(v.pases.periodo)} pie={`${v.pases.hoy} hoy`} relleno={rel} tamano={tam} />
        <Cifra etiqueta="Ingresos" valor={eur(v.ingresos_cent)} pie="Lo que pagaron los clientes" relleno={rel} tamano={tam} />
        <Cifra etiqueta="Lo que te queda" valor={eur(v.te_queda.cent)} pie={<><span>{`Comisión de Stripe: ${v.te_queda.comision_cent === null ? 'pronto' : eur(v.te_queda.comision_cent)}`}</span>{(v.te_queda.devoluciones_cent ?? 0) > 0 && <span data-devoluciones style={{ display: 'block' }}>{`Devoluciones: ${eur(v.te_queda.devoluciones_cent ?? 0)}`}</span>}<span data-antes-de-impuestos style={{ display: 'block', marginTop: 3, font: "400 11px 'Geist'", color: 'rgba(255,253,248,.5)' }}>antes de impuestos</span></>} oscura relleno={rel} tamano={tam} />
        <Cifra etiqueta="Conversión" valor={`${v.conversion.pct} %`} pie={`De los que crean un viaje compran el pase · ${v.conversion.compraron} de ${v.conversion.viajeros} viajeros`} relleno={rel} tamano={tam} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.3fr 1fr', gap: 14 }}>
        <div data-bloque="pases-por-dia" style={tarjeta}>
          <TituloConPeriodo texto={v.por_dia.tipo === 'dia' ? 'Pases por día' : v.por_dia.tipo === 'semana' ? 'Pases por semana' : 'Pases por mes'} titulo={titulo} />
          <GraficoDePases cubetas={v.por_dia.cubetas} alto={movil ? 90 : 96} />
        </div>
        <div data-bloque="pases-por-destino" style={tarjeta}>
          <TituloConPeriodo texto="Pases por destino" titulo={titulo} />
          {v.por_destino.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Sin ventas en este periodo.</span>}
          {v.por_destino.map((d) => (
            <div key={d.destino} data-destino-vendido={d.destino} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bandera iso={d.destino} tam={18} />
              <span style={{ width: 84, font: "500 13.5px 'Geist'" }}>{d.destino}</span>
              <span style={{ flex: 1, height: 10, borderRadius: 10, background: '#F1EADC', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.round((d.n / maxDestino) * 100)}%`, background: 'linear-gradient(90deg,#E4C36E,#C99A44)' }} /></span>
              <b style={{ width: 26, textAlign: 'right', font: "700 13px 'Geist'" }}>{d.n}</b>
              <span style={{ width: movil ? 58 : 64, textAlign: 'right', font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{eur(d.importe_cent)}</span>
            </div>
          ))}
        </div>
      </div>
      <div data-bloque="ultimas-compras" style={{ ...tarjeta, gap: 4 }}>
        <span style={{ font: "600 14px 'Geist'", paddingBottom: 6 }}>Últimas compras</span>
        {v.compras.length === 0 && <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)', paddingBottom: 6 }}>Sin compras en este periodo.</span>}
        {v.compras.map((c, i) => <FilaDeCompra key={`${c.fecha}${i}`} c={c} movil={movil} />)}
      </div>
      <div data-bloque="afiliados" style={{ ...tarjetaGrande, gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ font: `400 24px ${SERIE}` }}>Afiliados</span>
          <span style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Civitatis y Stay22</span>
        </span>
        <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>Veces que la gente pulsa «Reservar», por destino, {titulo}. Las comisiones se ven en sus paneles.</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px', gap: '8px 10px', font: "500 13px 'Geist'" }}>
          <span style={{ ...etiquetaMono, letterSpacing: '.1em' }}>DESTINO</span>
          <span style={{ ...etiquetaMono, letterSpacing: '.1em', textAlign: 'right' }}>ACTIV.</span>
          <span style={{ ...etiquetaMono, letterSpacing: '.1em', textAlign: 'right' }}>HOTELES</span>
          {(v.afiliados.por_destino ?? []).map((d) => (
            <FilaAfiliado key={d.destino} destino={d.destino} actividad={d.actividad} hotel={d.hotel} />
          ))}
          {v.afiliados.clics === null && <span data-pronto style={{ gridColumn: '1 / -1', color: 'rgba(28,34,48,.55)' }}>Pronto: los clics a Civitatis y Stay22 se verán aquí.</span>}
          {v.afiliados.clics !== null && (v.afiliados.por_destino ?? []).length === 0 && <span data-sin-clics style={{ gridColumn: '1 / -1', color: 'rgba(28,34,48,.55)' }}>Nadie ha pulsado «Reservar» en este periodo.</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[['Abrir el panel de Civitatis ↗', v.afiliados.enlaces.civitatis, 'civitatis'], ['Abrir el panel de Stay22 ↗', v.afiliados.enlaces.stay22, 'stay22']].map(([texto, url, id]) => (
            <a key={id} data-panel-afiliado={id} href={url || '#'} target="_blank" rel="noopener noreferrer" style={{ minHeight: 44, padding: '0 18px', borderRadius: 12, background: '#1C2230', color: '#F3D88F', display: 'inline-flex', alignItems: 'center', gap: 8, font: "700 13.5px 'Geist'", textDecoration: 'none' }}>{texto}</a>
          ))}
        </div>
      </div>
    </div>
  )
}

function FilaAfiliado({ destino, actividad, hotel }: { destino: string; actividad: number; hotel: number }): ReactNode {
  return (
    <>
      <span data-afiliado-destino={destino} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bandera iso={destino} tam={15} />{destino}</span>
      <b data-clics-actividades style={{ textAlign: 'right', color: '#8A6A2C' }}>{actividad}</b>
      <b data-clics-hoteles style={{ textAlign: 'right', color: '#8A6A2C' }}>{hotel}</b>
    </>
  )
}
