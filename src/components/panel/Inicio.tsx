import { useEffect, useState, type ReactNode } from 'react'
import { euros, hace, miles, pedir, type Cubeta, type Inicio as DatosInicio } from './api'
import { Bandera } from './banderas'
import { Cifra, Pastilla, SERIE, etiquetaMono, tarjeta, tarjetaGrande } from './estilo'
import { parametrosDePeriodo, SelectorDePeriodo, TituloConPeriodo, usePeriodo } from './periodo'

/**
 * (V35A, Design P1/M1) INICIO: lo que necesita atención de un vistazo, igual que Design. Arriba el selector de periodo; las seis tarjetas (reportes nuevos, fotos pendientes, pases e ingresos de hoy, usuarios y «con viaje»);
 * «Pases vendidos · {periodo}» con sus fechas y números; «Lo último que ha llegado»; «Lo que contestaron en la primera vez» (en pequeño, solo con las opciones que alguien ha elegido); «Desde dónde viajan» (del ORIGEN de los
 * viajes, con bandera) y «Dónde viven» (con «Pronto»: llega en la V35B). Todos los datos son los de la app real.
 */
const COLORES: Record<string, [string, string, string]> = { reporte: ['#FBEFC8', '#8A6210', 'Reporte'], foto: ['#FCE3EC', '#A02A5A', 'Foto'], venta: ['#DCEBDD', '#2F6B43', 'Venta'], fallo: ['#FADCDC', '#A32A2A', 'Fallo'] }
const PALETA = ['#C99A44', '#8A9AC8', '#C8323C', '#E4C36E', '#2D4FA0', '#7FB8A0', '#A87BC8']

/** El gráfico de barras de Design: el número encima de cada barra (vacío si es 0), la barra de oro y tres fechas debajo (primera, de en medio y última). */
export function GraficoDePases({ cubetas, alto }: { cubetas: Cubeta[]; alto: number }): ReactNode {
  const max = Math.max(1, ...cubetas.map((c) => c.pases))
  const en = (i: number) => cubetas[Math.max(0, Math.min(cubetas.length - 1, i))]?.etiqueta ?? ''
  return (
    <>
      <div data-grafico-pases style={{ height: alto, display: 'flex', alignItems: 'flex-end', gap: cubetas.length > 40 ? 2 : 6 }}>
        {cubetas.map((c) => (
          <span key={c.clave} data-barra={c.clave} title={`${c.etiqueta}: ${c.pases}`} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}>
            <span style={{ font: "700 11px 'Geist'", color: '#8A6A2C', height: 14 }}>{c.pases > 0 && cubetas.length <= 40 ? c.pases : ''}</span>
            <span style={{ width: '100%', height: `${Math.max(0, (c.pases / max) * 100)}%`, minHeight: 3, borderRadius: '5px 5px 2px 2px', background: 'linear-gradient(180deg,#E4C36E,#C99A44)' }} />
          </span>
        ))}
      </div>
      <div data-fechas-grafico style={{ display: 'flex', justifyContent: 'space-between', font: "500 11px 'Geist Mono',monospace", color: 'rgba(28,34,48,.5)' }}>
        <span>{en(0)}</span>
        <span>{cubetas.length > 2 ? en(Math.floor((cubetas.length - 1) / 2)) : ''}</span>
        <span>{cubetas.length > 1 ? en(cubetas.length - 1) : ''}</span>
      </div>
    </>
  )
}

function Donut({ opciones, tam, interior, letra }: { opciones: { pct: number }[]; tam: number; interior: number; letra: number }): ReactNode {
  let acum = 0
  const tramos = opciones.map((o, i) => {
    const desde = acum
    acum += o.pct
    return `${PALETA[i % PALETA.length]} ${desde}% ${Math.min(100, acum)}%`
  })
  const fondo = opciones.length ? `conic-gradient(${tramos.join(',')}${acum < 100 ? `,#E7DFCB ${acum}% 100%` : ''})` : '#E7DFCB'
  return (
    <span data-donut style={{ position: 'relative', flex: 'none', width: tam, height: tam, borderRadius: '50%', background: fondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: interior, height: interior, borderRadius: '50%', background: '#F7F1E4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ font: `400 ${letra}px/1 ${SERIE}` }}>{opciones[0] ? `${opciones[0].pct} %` : '—'}</span>
      </span>
    </span>
  )
}

export function Inicio({ ir, movil }: { ir: (seccion: string) => void; movil: boolean }): ReactNode {
  const p = usePeriodo()
  const [d, setD] = useState<DatosInicio | null>(null)
  useEffect(() => {
    let vivo = true
    void pedir<DatosInicio>(`/api/admin/inicio?${parametrosDePeriodo(p)}`).then((r) => vivo && setD(r))
    return () => {
      vivo = false
    }
  }, [p.periodo, p.desde, p.hasta])
  const periodo = <SelectorDePeriodo movil={movil} />
  if (!d) return <div data-seccion="inicio" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{periodo}<p>Cargando…</p></div>
  const fallos = d.atencion.filter((a) => a.tipo === 'fallo')
  const u = d.usuarios
  const eur = (c: number) => euros(c, d.ingresos.moneda)
  return (
    <div data-seccion="inicio" style={{ display: 'flex', flexDirection: 'column', gap: movil ? 12 : 14 }}>
      {periodo}
      {fallos.length > 0 && (
        <div data-alerta-atencion style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'oklch(0.97 0.03 5)', border: '1px solid oklch(0.58 0.19 5 / .35)' }}>
          <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: 'oklch(0.58 0.19 5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 16px 'Geist'" }}>!</span>
          <span style={{ flex: 1, font: "500 14px/1.35 'Geist'" }}>{fallos[0].titulo}{fallos.length > 1 ? ` (y ${fallos.length - 1} más)` : ''}</span>
          <button type="button" onClick={() => ir('reportes')} style={{ background: 'none', border: 'none', font: "700 13px 'Geist'", color: 'oklch(0.5 0.19 5)', cursor: 'pointer' }}>Ver ›</button>
        </div>
      )}
      <div data-tarjetas style={{ display: 'grid', gridTemplateColumns: movil ? '1fr 1fr' : 'repeat(6,minmax(0,1fr))', gap: 12 }}>
        <Cifra etiqueta="Reportes nuevos" valor={d.reportes_nuevos} pie="Sin mirar" destacada={d.reportes_nuevos > 0} chica={movil} />
        <Cifra etiqueta="Fotos pendientes" valor={d.fotos_por_aprobar} pie="Esperando" chica={movil} />
        <Cifra etiqueta="Pases hoy" valor={d.pases.hoy} pie={`${d.pases.mes} este mes`} chica={movil} />
        <Cifra etiqueta="Ingresos hoy" valor={eur(d.ingresos.hoy_cent)} pie={`${eur(d.ingresos.mes_cent)} este mes`} chica={movil} />
        <Cifra etiqueta="Usuarios" valor={miles(u.total)} pie={`${miles(u.hoy)} ${u.hoy === 1 ? 'nuevo' : 'nuevos'} hoy · ${miles(u.semana)} esta semana`} chica={movil} />
        <Cifra etiqueta="Con viaje" valor={`${miles(u.con_viaje)} de ${miles(u.total)}`} pie={`${u.pct_con_viaje} % de los usuarios`} chica={movil} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.3fr 1fr', gap: 14 }}>
        <div data-bloque="pases-vendidos" style={tarjeta}>
          <TituloConPeriodo texto="Pases vendidos" titulo={d.periodo.titulo} />
          <GraficoDePases cubetas={d.serie.cubetas} alto={movil ? 80 : 70} />
        </div>
        <div data-bloque="lo-ultimo" style={{ ...tarjeta, gap: 8 }}>
          <span style={{ font: "600 14px 'Geist'" }}>Lo último que ha llegado</span>
          {d.atencion.length === 0 && <p style={{ margin: 0, color: 'rgba(28,34,48,.55)' }}>Nada nuevo.</p>}
          {d.atencion.slice(0, 4).map((a, i) => {
            const [fondo, color, texto] = COLORES[a.tipo] ?? COLORES.reporte
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(28,34,48,.06)' }}>
                <Pastilla fondo={fondo} color={color}>{texto}</Pastilla>
                <span style={{ flex: 1, minWidth: 0, font: "400 13px/1.3 'Geist'", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titulo}</span>
                <span style={{ font: "500 11.5px 'Geist'", color: 'rgba(28,34,48,.45)' }}>{hace(a.en)}</span>
              </div>
            )
          })}
        </div>
      </div>
      {!d.correo.activo && <p data-aviso-sin-correo style={{ margin: 0, font: "400 13px/1.4 'Geist'", color: '#8A6210' }}>Los correos están apagados (falta RESEND_API_KEY en Vercel): el panel funciona igual, pero no manda correos.</p>}

      <div data-respuestas-primera-vez style={tarjetaGrande}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: `400 24px ${SERIE}` }}>Lo que contestaron en la primera vez</span>
          <span style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.5)' }}>· {d.primera_vez.contestaron} {d.primera_vez.contestaron === 1 ? 'persona' : 'personas'}</span>
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: movil ? 10 : 14 }}>
          {d.primera_vez.bloques.map((b) => (
            <div key={b.id} data-donut-bloque={b.id} title={b.opciones.map((o) => `${o.nombre} ${o.pct} %`).join(' · ')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, borderRadius: 20, background: '#F7F1E4' }}>
              <Donut opciones={b.opciones} tam={movil ? 60 : 64} interior={movil ? 40 : 42} letra={movil ? 15 : 16} />
              <span style={{ flex: 1, minWidth: 0, font: "600 13px/1.25 'Geist'" }}>{b.titulo}</span>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{b.opciones.map((o) => `${o.nombre} ${o.pct} %`).join(', ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.3fr 1fr', gap: 14 }}>
        <div data-bloque="desde-donde" style={{ ...tarjetaGrande, gap: 12 }}>
          <span style={{ font: `400 24px ${SERIE}` }}>Desde dónde viajan</span>
          {d.desde_donde.paises.length === 0 && d.desde_donde.ciudades.length === 0 ? (
            <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía no hay viajes con origen.</span>
          ) : (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <span style={etiquetaMono}>PAÍSES</span>
                {d.desde_donde.paises.map((o) => <FilaDeOrigen key={o.iso} iso={o.iso} nombre={nombreDePais(o.iso)} n={o.n} />)}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                <span style={etiquetaMono}>CIUDADES</span>
                {d.desde_donde.ciudades.map((o) => <FilaDeOrigen key={o.nombre} iso={o.iso} nombre={o.nombre} n={o.n} />)}
              </div>
            </div>
          )}
        </div>
        <div data-bloque="donde-viven" style={{ ...tarjetaGrande, gap: 12 }}>
          <span style={{ font: `400 24px ${SERIE}` }}>Dónde viven</span>
          <span style={etiquetaMono}>PAÍSES</span>
          <span data-pronto style={{ alignSelf: 'flex-start', height: 26, padding: '0 12px', borderRadius: 999, background: '#F1EADC', color: '#8A6A2C', display: 'inline-flex', alignItems: 'center', font: "700 12px 'Geist'" }}>Pronto</span>
          <span style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.55)' }}>Todavía no se guarda en qué país vive cada persona.</span>
        </div>
      </div>
    </div>
  )
}

const PAISES: Record<string, string> = { es: 'España', mx: 'México', it: 'Italia', fr: 'Francia', gb: 'Reino Unido', pt: 'Portugal', de: 'Alemania', nl: 'Países Bajos', cz: 'Chequia', us: 'Estados Unidos', co: 'Colombia', ar: 'Argentina', cl: 'Chile', pe: 'Perú' }
export const nombreDePais = (iso: string | null | undefined): string => (iso ? (PAISES[iso.toLowerCase()] ?? iso.toUpperCase()) : '—')

function FilaDeOrigen({ iso, nombre, n }: { iso: string | null; nombre: string; n: number }): ReactNode {
  return (
    <span data-origen={nombre} style={{ display: 'flex', alignItems: 'center', gap: 9, font: "500 13px 'Geist'" }}>
      <Bandera iso={iso} tam={16} />
      <span style={{ flex: 1, minWidth: 0 }}>{nombre}</span>
      <b>{n}</b>
    </span>
  )
}

/** Compatibilidad: la caja de las respuestas de la primera vez también la usa Usuarios («Quiénes son»). */
export { Donut }
