import { useState, type ReactNode } from 'react'
import { guardarBalda, TITULO_DE_BALDA, useGanados, useHojasDeLogros, type Ganados } from './api'
import { DibujoDeItem } from './dibujo'

/**
 * ELEGIR HUECO EN LA VITRINA (V3): «Llevar a mi vitrina» → «Sellos de ciudad · elige un hueco» → [Colocar aquí]. Si el hueco está lleno, avisa de qué pieza vuelve a Todos mis logros.
 * Guarda la balda entera (lo que se ve es lo que queda): si la balda aún se rellenaba sola, queda fijada tal cual con el cambio.
 */
const ORO = 'oklch(0.8 0.14 70)'

export function ElegirHueco({ g, clave, inicial, cerrar }: { g: Ganados; clave: string; inicial?: number; cerrar: () => void }): ReactNode {
  const poner = useGanados((s) => s.poner)
  const avisar = useHojasDeLogros((s) => s.avisar)
  const item = g.items.find((i) => i.clave === clave)
  const balda = item?.balda ?? null
  const actuales = balda ? g.vitrina.baldas[balda].huecos.map((k) => g.items.find((i) => i.clave === k)) : []
  const huecos = [0, 1, 2, 3].map((i) => actuales[i] ?? null)
  const primeroLibre = huecos.findIndex((h) => h == null)
  const [elegido, setElegido] = useState(inicial ?? (primeroLibre >= 0 ? primeroLibre : 0))
  const [ocupado, setOcupado] = useState(false)
  if (!item || !balda) return null
  const sale = huecos[elegido]
  const colocar = async () => {
    if (ocupado) return
    setOcupado(true)
    const lista = huecos.map((h) => h?.clave ?? null)
    lista[elegido] = item.clave
    const v = await guardarBalda(balda, lista.filter((k): k is string => k != null))
    setOcupado(false)
    if (!v) return avisar('No se ha podido guardar. Vuelve a probar.')
    poner({ ...g, vitrina: v })
    cerrar()
    if (sale) avisar(`«${sale.nombre}» vuelve a Todos mis logros`)
  }
  return (
    <>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', inset: 0, zIndex: 60, border: 'none', padding: 0, background: 'rgba(28,34,48,.45)', animation: 'vtFade .3s ease both', cursor: 'default' }} />
      <div role="dialog" aria-modal="true" aria-label="Elige un hueco" data-elegir-hueco style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 61, borderRadius: '28px 28px 0 0', background: '#FFFDF8', color: '#1C2230', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 30px)', display: 'flex', flexDirection: 'column', gap: 14, animation: 'vtSheet .45s cubic-bezier(.2,.8,.2,1) both' }}>
        <span aria-hidden style={{ alignSelf: 'center', width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DibujoDeItem item={item} tam={56} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>Llevar a mi vitrina</span>
            <span style={{ font: "400 24px/1.05 'Instrument Serif',serif" }}>{item.nombre}</span>
          </span>
        </div>
        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>{TITULO_DE_BALDA[balda]} · elige un hueco</span>
        <div role="radiogroup" aria-label="Huecos" style={{ position: 'relative', borderRadius: 20, background: 'radial-gradient(circle at 50% 0%,#1E2648 0%,#0B0E1C 80%)', padding: '16px 8px 18px', display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 6 }}>
          {huecos.map((h, i) => (
            <button key={i} type="button" role="radio" aria-checked={elegido === i} aria-label={h ? h.nombre : 'Hueco libre'} onClick={() => setElegido(i)} style={{ position: 'relative', minWidth: 0, height: 92, borderRadius: 16, border: `2px solid ${elegido === i ? ORO : 'rgba(255,253,248,.08)'}`, background: elegido === i ? 'rgba(243,213,154,.12)' : 'rgba(255,253,248,.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', transition: 'border-color .2s,background .2s', padding: 0 }}>
              {h ? <DibujoDeItem item={h} tam={52} /> : <span aria-hidden style={{ width: 46, height: 46, borderRadius: '50%', border: '1.5px dashed rgba(243,213,154,.45)' }} />}
              <span style={{ maxWidth: '100%', padding: '0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: "600 9.5px 'Geist Mono',monospace", color: 'rgba(255,253,248,.6)' }}>{h ? h.nombre : 'Libre'}</span>
            </button>
          ))}
          <span aria-hidden style={{ position: 'absolute', left: 10, right: 10, bottom: 8, height: 2, borderRadius: 2, background: 'linear-gradient(90deg,transparent,rgba(220,230,255,.5),transparent)' }} />
        </div>
        {sale && (
          <span role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 14, background: '#F5EFE4', font: "500 12.5px/1.35 'Geist'", animation: 'vtFade .3s ease both' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden>
              <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            </svg>
            «{sale.nombre}» vuelve a Todos mis logros
          </span>
        )}
        <button type="button" disabled={ocupado} onClick={() => void colocar()} style={{ height: 52, border: 'none', borderRadius: 999, background: ORO, color: '#17120a', font: "700 15px 'Geist'", cursor: 'pointer' }}>
          Colocar aquí
        </button>
      </div>
    </>
  )
}
