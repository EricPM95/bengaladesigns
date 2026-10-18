/**
 * EL MODO DE PRUEBAS DE LA EXP (Tanda 8C1): `window.__momentos.exp()` enseña la EXP, el nivel y el rango de un viajero de ejemplo, con las cuentas de Roma (un viaje normal y Roma al 100 %).
 * Solo en desarrollo. Usa las MISMAS funciones del servidor (server/logros/exp.js y escenarios.js) y los mismos datos (data/logros/*.json), así que dice lo que diría el servidor.
 * No es una pantalla de la app: las pantallas de la EXP (barra de nivel, marcos de rango, subida de nivel, tienda) llegarán con Design.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

interface Datos { exp: Record<string, any>; [k: string]: any }
interface Escenarios { normal: { total: number; por_categoria: Record<string, number> }; roma100: { total: number; por_categoria: Record<string, number> } }
interface Cargado { datos: Datos; nivelDeExp: (e: number, t: any) => any; expDeNivel: (n: number, t: any) => number; escenarios: Escenarios }

async function cargar(): Promise<Cargado> {
  const [roma, viajero, ajustes, exp, catalogo, activo, E, esc] = await Promise.all([
    import('../../data/logros/roma.json'),
    import('../../data/logros/viajero.json'),
    import('../../data/logros/ajustes.json'),
    import('../../data/logros/exp.json'),
    import('../../data/pipeline_v2/roma.json'),
    import('../../server/logros/viajeroActivo.js'),
    import('../../server/logros/exp.js'),
    import('../../server/logros/escenarios.js'),
  ])
  const destino = { ...(roma as any).default }
  Object.defineProperty(destino, 'sitios_catalogo', { value: ((catalogo as any).default.places ?? []).map((p: { id: string }) => p.id), enumerable: false })
  const datos: Datos = { destinos: { roma: destino }, viajero: (activo as any).soloActivos((viajero as any).default), ajustes: (ajustes as any).default, exp: (exp as any).default }
  const e = E as any
  return { datos, nivelDeExp: e.nivelDeExp, expDeNivel: e.expDeNivel, escenarios: { normal: (esc as any).escenarioDeRoma(datos, 'normal'), roma100: (esc as any).escenarioDeRoma(datos, 'roma100') } }
}

const PRESETS: { id: string; nombre: string }[] = [
  { id: 'normal', nombre: 'Roma · un viaje normal (9 sitios, 3 días)' },
  { id: 'roma100', nombre: 'Roma al 100 %' },
  { id: 'cero', nombre: 'Recién llegado (0 EXP)' },
  { id: 'n10', nombre: 'Nivel 10' },
  { id: 'n50', nombre: 'Nivel 50' },
  { id: 'leyenda', nombre: 'Leyenda ★3' },
]

function Panel({ c, inicial, cerrar }: { c: Cargado; inicial: string; cerrar: () => void }): ReactNode {
  const [preset, setPreset] = useState(inicial)
  const [libre, setLibre] = useState('')
  const total = useMemo(() => {
    if (libre.trim() !== '' && Number.isFinite(Number(libre))) return Math.max(0, Math.round(Number(libre)))
    if (preset === 'normal') return c.escenarios.normal.total
    if (preset === 'roma100') return c.escenarios.roma100.total
    if (preset === 'n10') return c.expDeNivel(10, c.datos.exp)
    if (preset === 'n50') return c.expDeNivel(50, c.datos.exp)
    if (preset === 'leyenda') return c.expDeNivel(50, c.datos.exp) + 3 * c.datos.exp.niveles.estrella_cada + 120
    return 0
  }, [preset, libre, c])
  const n = c.nivelDeExp(total, c.datos.exp)
  const por = preset === 'normal' ? c.escenarios.normal.por_categoria : preset === 'roma100' ? c.escenarios.roma100.por_categoria : null
  const pct = Math.min(100, Math.round((n.exp_en_nivel / n.coste_nivel) * 100))
  const f = (x: number) => x.toLocaleString('es-ES')
  return (
    <div data-exp-prueba style={{ position: 'fixed', inset: 0, zIndex: 99990, background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',system-ui,sans-serif", overflowY: 'auto', padding: '30px 22px 40px' }}>
      <button type="button" onClick={cerrar} style={{ position: 'absolute', right: 14, top: 14, border: 'none', background: 'transparent', font: "600 14px 'Geist'", cursor: 'pointer' }}>Cerrar</button>
      <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Modo de pruebas · EXP</span>
      <div style={{ font: "400 34px/1.05 'Instrument Serif',serif", marginTop: 6 }}>Un viajero de ejemplo</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        {PRESETS.map((p) => (
          <button key={p.id} type="button" data-preset={p.id} onClick={() => { setPreset(p.id); setLibre('') }} style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid rgba(28,34,48,.2)', background: p.id === preset && !libre ? '#1C2230' : 'transparent', color: p.id === preset && !libre ? '#FFFDF8' : '#1C2230', font: "600 12.5px 'Geist'", cursor: 'pointer' }}>{p.nombre}</button>
        ))}
      </div>
      <label style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.65)' }}>O una EXP cualquiera: <input data-exp-libre value={libre} onChange={(e) => setLibre(e.target.value)} inputMode="numeric" style={{ width: 110, marginLeft: 6, padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(28,34,48,.25)' }} /></label>
      <div style={{ margin: '22px 0 6px', padding: '18px 18px 16px', borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span data-exp-total style={{ font: "400 44px/1 'Instrument Serif',serif" }}>{f(total)}</span>
          <span style={{ font: "500 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>EXP</span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span data-exp-nivel style={{ font: "400 28px 'Instrument Serif',serif" }}>Nivel {n.nivel}</span>
          <span data-exp-rango style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(0.55 0.17 5)' }}>{n.rango}{n.leyenda_estrellas > 0 ? ` ★${n.leyenda_estrellas}` : ''}</span>
          <span aria-label={`${n.estrellas_en_rango} de 5 estrellas del rango`} style={{ letterSpacing: 2, color: '#B8964F' }}>{'★'.repeat(n.estrellas_en_rango)}<span style={{ color: 'rgba(28,34,48,.2)' }}>{'★'.repeat(5 - n.estrellas_en_rango)}</span></span>
        </div>
        <div style={{ marginTop: 14, height: 10, borderRadius: 999, background: 'rgba(28,34,48,.1)', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#E3B13F,#B8863A)' }} /></div>
        <div data-exp-barra style={{ marginTop: 8, font: "500 13px 'Geist'", color: 'rgba(28,34,48,.7)' }}>{f(n.exp_en_nivel)} de {f(n.coste_nivel)} en este nivel · faltan {f(n.falta)} para {n.maximo ? 'la siguiente estrella de Leyenda' : `el nivel ${n.nivel + 1}`}</div>
      </div>
      {por && (
        <div style={{ marginTop: 18 }}>
          <div style={{ font: "400 22px 'Instrument Serif',serif", marginBottom: 6 }}>De dónde sale</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', font: "500 13.5px 'Geist'" }}>
            <tbody>
              {Object.entries(por).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <tr key={k} style={{ borderTop: '1px solid rgba(28,34,48,.08)' }}><td style={{ padding: '6px 0' }}>{k}</td><td style={{ textAlign: 'right' }}>{f(v)}</td></tr>
              ))}
            </tbody>
          </table>
          <p style={{ font: "400 12px/1.4 'Geist'", color: 'rgba(28,34,48,.55)', marginTop: 10 }}>Sin el continente ni «Todos los secretos» (apagados en la Versión 1). Los viajes de antes de la app dan 0.</p>
        </div>
      )}
    </div>
  )
}

/** `window.__momentos.exp('normal' | 'roma100' | 'cero' | 'n10' | 'n50' | 'leyenda')`: abre el panel de pruebas de la EXP. */
export async function abrirExpPrueba(preset = 'normal'): Promise<void> {
  const c = await cargar()
  const viejo = document.querySelector('[data-exp-prueba-raiz]')
  viejo?.remove()
  const div = document.createElement('div')
  div.setAttribute('data-exp-prueba-raiz', '')
  document.body.appendChild(div)
  const raiz = createRoot(div)
  const cerrar = () => {
    raiz.unmount()
    div.remove()
  }
  raiz.render(<Panel c={c} inicial={preset} cerrar={cerrar} />)
}
