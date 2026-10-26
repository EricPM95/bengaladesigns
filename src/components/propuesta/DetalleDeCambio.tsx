import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { detalleDelCambio, kilometrosDelRecorrido, textoDeKm, type CambioPropuesto, type MarcaDeParada, type ParadaDelDetalle } from '../../lib/propuesta'
import type { Route } from '../../lib/types'
import { colorDelCambio, COLORES_DE_CAMBIO, type DecisionDeFila } from './FilaDeCambio'

const TIPOS: Record<CambioPropuesto['tipo'], string> = {
  mover: 'ORDEN · EN EL MISMO DÍA',
  mover_dia: 'MOVER A OTRO DÍA',
  quitar: 'QUITAR UNA PARADA',
  anadir: 'AÑADIR UNA PARADA',
  cambiar: 'CAMBIAR UNA PARADA POR OTRA',
  dia_nuevo: 'UN DÍA NUEVO',
}
const ETIQUETA_MARCA: Record<Exclude<MarcaDeParada, null>, string> = { movida: 'Movida', sale: 'Sale', entra: 'Entra', nueva: 'Nueva' }

function MiniMapa({ paradas }: { paradas: ParadaDelDetalle[] }) {
  const vivas = paradas.filter((p) => p.marca !== 'sale' && p.coordinates && (p.coordinates.lat !== 0 || p.coordinates.lng !== 0))
  const W = 342
  const H = 112
  const lats = vivas.map((p) => p.coordinates.lat)
  const lngs = vivas.map((p) => p.coordinates.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const rx = maxLng - minLng || 1
  const ry = maxLat - minLat || 1
  const puntos = vivas.map((p, i) => ({ ...p, n: i + 1, x: 22 + ((p.coordinates.lng - minLng) / rx) * (W - 44), y: 20 + (1 - (p.coordinates.lat - minLat) / ry) * (H - 40) }))
  const km = kilometrosDelRecorrido(paradas)
  return (
    <div data-mini-mapa style={{ position: 'relative', height: 112, borderRadius: 18, overflow: 'hidden', background: '#E6EBD9', boxShadow: '0 6px 14px -10px rgba(28,34,48,.4)', flex: 'none' }}>
      <span style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(40deg,rgba(255,255,255,.55) 0 3px,transparent 3px 40px)' }} />
      <svg width="100%" height="112" viewBox={`0 0 ${W} ${H}`} fill="none" style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="none">
        {puntos.length > 1 && <path d={'M' + puntos.map((p) => `${p.x.toFixed(0)} ${p.y.toFixed(0)}`).join('L')} stroke="#B58A2E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 6" />}
        {puntos.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r="10" fill={p.marca === 'movida' ? '#B58A2E' : p.marca === 'nueva' || p.marca === 'entra' ? '#2B7F45' : '#1C2230'} stroke="#fff" strokeWidth="2" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontFamily="Geist,sans-serif" fontWeight="700" fontSize="11" fill="#fff">
              {p.n}
            </text>
          </g>
        ))}
      </svg>
      <span data-mini-mapa-km style={{ position: 'absolute', right: 10, top: 10, height: 24, padding: '0 10px', borderRadius: 999, background: '#1C2230', color: '#F3E2B0', display: 'flex', alignItems: 'center', font: "600 11.5px 'Geist'" }}>
        {textoDeKm(km)}
      </span>
    </div>
  )
}

/**
 * EL DETALLE DE UN CAMBIO (Tanda 10N, apartado 6; «Propuesta Cambios · 3 · El detalle de cada cambio»): pantalla entera con [Antes] y [Ahora], el mapa pequeño del día con sus kilómetros, las paradas con lo
 * que cambia marcado («Movida», «Sale», «Entra», «Nueva») y, si el cambio es de día, los dos días. Para quien propone, [Deshacer este cambio]; para quien decide, [Rechazar] [Aceptar] y, después,
 * «Aceptado ✓» o «Rechazado».
 */
export function DetalleDeCambio({
  cambio,
  sobre,
  cabecera,
  modo,
  decision = null,
  ocupado = false,
  onCerrar,
  onDeshacer,
  onAceptar,
  onRechazar,
}: {
  cambio: CambioPropuesto
  /** La ruta sobre la que se enseña el antes y el ahora (la del administrador). */
  sobre: Route
  /** «CAMBIO 1 DE 5» · «ANA PROPONE · 3 DE 5». */
  cabecera: string
  modo: 'mia' | 'dueno' | 'enviada'
  decision?: DecisionDeFila
  ocupado?: boolean
  onCerrar: () => void
  onDeshacer?: () => void
  onAceptar?: () => void
  onRechazar?: () => void
}) {
  const dias = useMemo(() => detalleDelCambio(sobre, cambio), [sobre, cambio])
  const [dia, setDia] = useState(0)
  const [pestana, setPestana] = useState<'antes' | 'ahora'>('ahora')
  const d = dias[Math.min(dia, dias.length - 1)]
  const lista = d ? (pestana === 'antes' ? d.antes : d.ahora) : []
  const color = COLORES_DE_CAMBIO[colorDelCambio(cambio.tipo)]
  let numero = 0
  return createPortal(
    <div data-detalle-de-cambio={cambio.tipo} role="dialog" aria-modal="true" aria-label="Detalle del cambio" style={{ position: 'fixed', inset: 0, zIndex: 97, background: '#F6EFE0', color: '#1C2230', display: 'flex', flexDirection: 'column', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(14px + env(safe-area-inset-top)) 18px 6px' }}>
        <button type="button" data-detalle-volver onClick={onCerrar} aria-label="Volver" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(28,34,48,.12)', background: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: '#6E5018' }}>{cabecera}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 22px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', color: color.fg }}>{TIPOS[cambio.tipo]}</span>
          <span data-detalle-texto style={{ font: "400 22px/1.14 'Instrument Serif',serif" }}>
            {cambio.etiqueta.includes('→') ? '' : `${cambio.etiqueta} · `}
            {cambio.texto}
          </span>
          {cambio.sub && <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.55)' }}>{cambio.sub}</span>}
          {cambio.sinSentido && <span style={{ font: "500 12.5px 'Geist'", color: '#B3262E' }}>Ya no tiene sentido: {cambio.sinSentido}</span>}
        </div>
        {dias.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {dias.map((x, k) => (
              <button key={k} type="button" data-detalle-dia={k} onClick={() => setDia(k)} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: '1px solid rgba(28,34,48,.14)', background: k === dia ? '#1C2230' : '#FFFDF8', color: k === dia ? '#FBF3E2' : '#1C2230', font: "600 13px 'Geist'", cursor: 'pointer' }}>
                {x.etiqueta}
              </button>
            ))}
          </div>
        )}
        <div style={{ height: 46, borderRadius: 999, background: 'rgba(28,34,48,.07)', padding: 4, display: 'flex', flex: 'none' }}>
          {(['antes', 'ahora'] as const).map((k) => (
            <button key={k} type="button" data-detalle-pestana={k} onClick={() => setPestana(k)} style={{ flex: 1, borderRadius: 999, border: 'none', background: pestana === k ? '#1C2230' : 'transparent', color: pestana === k ? '#FBF3E2' : 'rgba(28,34,48,.6)', font: "600 14px 'Geist'", cursor: 'pointer' }}>
              {k === 'antes' ? 'Antes' : 'Ahora'}
            </button>
          ))}
        </div>
        <MiniMapa paradas={lista} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {lista.map((p) => {
            const sale = p.marca === 'sale' && pestana === 'ahora'
            if (!sale) numero++
            const bg = sale ? '#FBEAEA' : p.marca === 'nueva' || p.marca === 'entra' ? '#EAF4EC' : p.marca === 'movida' ? '#FFF8E4' : '#FFFDF8'
            const borde = sale ? '1px solid rgba(179,38,46,.35)' : p.marca === 'nueva' || p.marca === 'entra' ? '1px solid #2B7F45' : p.marca === 'movida' ? '1.5px solid #B58A2E' : '1px solid rgba(28,34,48,.08)'
            const tag = pestana === 'antes' ? null : p.marca
            const colorTag = sale ? '#B3262E' : p.marca === 'nueva' || p.marca === 'entra' ? '#2B7F45' : '#B58A2E'
            return (
              <div key={p.id} data-detalle-parada={p.marca ?? ''} style={{ minHeight: 42, borderRadius: 13, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', background: pestana === 'antes' ? '#FFFDF8' : bg, border: pestana === 'antes' ? '1px solid rgba(28,34,48,.08)' : borde }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', flex: 'none', background: pestana === 'antes' ? '#1C2230' : sale ? '#B3262E' : colorTag === '#B58A2E' && p.marca ? '#B58A2E' : p.marca ? colorTag : '#1C2230', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 12px 'Geist'" }}>{sale ? '×' : numero}</span>
                <span style={{ flex: 1, font: "600 14px 'Geist'", color: sale ? '#B3262E' : '#1C2230', textDecoration: sale ? 'line-through' : 'none' }}>{p.nombre}</span>
                {tag && (
                  <span data-detalle-marca={tag} style={{ height: 22, padding: '0 9px', borderRadius: 999, background: colorTag, color: '#fff', display: 'flex', alignItems: 'center', font: "700 11px 'Geist'" }}>
                    {ETIQUETA_MARCA[tag]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 9, padding: '10px 22px calc(26px + env(safe-area-inset-bottom))' }}>
        {modo === 'mia' && onDeshacer && (
          <button type="button" data-deshacer-este-cambio onClick={onDeshacer} style={{ flex: 1, height: 50, borderRadius: 15, border: '1px solid rgba(28,34,48,.25)', background: 'transparent', font: "600 15px 'Geist'", color: '#1C2230', cursor: 'pointer' }}>
            Deshacer este cambio
          </button>
        )}
        {modo === 'dueno' && !decision && !cambio.sinSentido && (
          <>
            <button type="button" data-detalle-rechazar disabled={ocupado} onClick={onRechazar} style={{ flex: 1, height: 50, borderRadius: 15, border: '1px solid rgba(28,34,48,.25)', background: 'transparent', font: "600 15px 'Geist'", color: '#1C2230', cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
              Rechazar
            </button>
            <button type="button" data-detalle-aceptar disabled={ocupado} onClick={onAceptar} style={{ flex: 1.3, height: 50, borderRadius: 15, border: 'none', background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', font: "700 15px 'Geist'", boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)', cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
              Aceptar
            </button>
          </>
        )}
        {decision && (
          <span data-detalle-decision={decision} style={{ flex: 1, height: 50, borderRadius: 15, background: decision === 'aceptado' ? '#EAF4EC' : '#FBEAEA', color: decision === 'aceptado' ? '#2B7F45' : '#B3262E', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 16px 'Geist'" }}>
            {decision === 'aceptado' ? 'Aceptado ✓' : 'Rechazado'}
          </span>
        )}
      </div>
    </div>,
    document.body,
  )
}
