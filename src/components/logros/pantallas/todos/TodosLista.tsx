import { useState, type ReactNode } from 'react'
import { MedallaDeSiete, Sello, type GradoDeSello } from '../../dibujos'
import { flagStripesGradient } from '../../../../lib/flagColors'
import { lineaDeSecretos } from '../../momentos/textosResumen'
import { useLogrosPantallas } from '../useLogrosPantallas'
import { useHojasDeLogros, type DestinoGanado, type FilaDeViajero, type Ganados, type ItemGanado, type PaisGanado } from './api'
import { ChapaDeFila, DibujoDeItem } from './dibujo'
import { COLOR_DE_GRADO, FONDO_DE_GRADO, GRUPO, NOMBRE_DE_GRADO, fechaCorta } from './formato'

/**
 * «TODOS MIS LOGROS» (T1, T2): el resumen de arriba, «Por destino» con sus dos vistas (Destinos y Países), los logros de viajero por grupos con «Ver todo», Las 7 maravillas y los Exclusivos.
 * Solo existe lo que está encendido en la Versión 1 (el servidor ya no manda lo apagado).
 */
const TITULO = { font: "400 26px/1 'Instrument Serif',serif" } as const
const VERDE = 'oklch(0.55 0.11 150)'
const DORADO = 'oklch(0.8 0.14 70)'

export function TodosLista({ g, vistaInicial = 'destinos' }: { g: Ganados; vistaInicial?: 'destinos' | 'paises' }): ReactNode {
  const [vista, setVista] = useState<'destinos' | 'paises'>(vistaInicial)
  const abrirFicha = useHojasDeLogros((s) => s.abrirFicha)
  const titulo = g.titulo ? g.items.find((i) => i.clave === g.titulo?.clave) : null
  const enVitrina = new Set([...Object.values(g.vitrina.baldas).flatMap((b) => b.huecos)])
  return (
    <main className="vt-oculto" data-todos style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '0 0 calc(env(safe-area-inset-bottom,0px) + 40px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ margin: '0 16px', flex: 'none', borderRadius: 24, background: '#FFFDF8', color: '#1C2230', boxShadow: 'inset 0 0 0 1px rgba(142,104,32,.22)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>
            {g.total} <span style={{ fontSize: 18, color: 'rgba(28,34,48,.6)' }}>{g.total === 1 ? 'logro conseguido' : 'logros conseguidos'}</span>
          </span>
          {g.titulo && <span style={{ font: "500 13px 'Geist'", color: '#8E6820' }}>{g.titulo.nombre}</span>}
        </span>
        {titulo && <DibujoDeItem item={titulo} tam={58} />}
      </div>

      {g.por_destino.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 0' }}>
            <span style={TITULO}>Por destino</span>
            <span role="tablist" aria-label="Vista" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {(['destinos', 'paises'] as const).map((k, j) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center' }}>
                  {j > 0 && <span aria-hidden style={{ padding: '0 4px', font: "500 13px 'Geist'", color: 'rgba(28,34,48,.35)' }}>·</span>}
                  <button type="button" role="tab" aria-selected={vista === k} onClick={() => setVista(k)} style={{ minHeight: 44, padding: '0 4px', border: 'none', background: 'transparent', font: `${vista === k ? 600 : 500} 13px 'Geist'`, color: vista === k ? '#1C2230' : 'rgba(28,34,48,.55)', textDecorationLine: vista === k ? 'underline' : 'none', textDecorationColor: DORADO, textDecorationThickness: '2.5px', textUnderlineOffset: 6, cursor: 'pointer' }}>
                    {k === 'destinos' ? 'Destinos' : 'Países'}
                  </button>
                </span>
              ))}
            </span>
          </div>
          {vista === 'destinos' ? (
            <div className="vt-oculto" style={{ flex: 'none', display: 'flex', gap: 10, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingInline: 20, scrollbarWidth: 'none', padding: '0 20px 6px' }}>
              {g.por_destino.map((d) => (
                <TarjetaDeDestino key={d.destino} d={d} />
              ))}
              <span style={{ flex: 'none', width: 10 }} />
            </div>
          ) : (
            <div style={{ flex: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px' }}>
              {g.paises.map((p) => (
                <TarjetaDePais key={p.pais} p={p} />
              ))}
            </div>
          )}
        </>
      )}

      {g.viajero.length > 0 && <span style={{ padding: '8px 20px 0', ...TITULO }}>Logros de viajero</span>}
      {g.viajero.map((grupo) => (
        <div key={grupo.id} data-grupo={grupo.id} style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ margin: '0 20px', display: 'flex', alignItems: 'center', gap: 7, font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: GRUPO[grupo.id]?.color }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: GRUPO[grupo.id]?.color }} />
            {grupo.nombre}
            <VerTodo grupo={grupo.id} pequeno style={{ marginLeft: 'auto' }} />
          </div>
          <div className="vt-oculto" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingInline: 20, scrollbarWidth: 'none', padding: '2px 20px 6px' }}>
            {grupo.filas.map((f) => (
              <TarjetaDeFila key={f.id} f={f} enVitrina={Boolean(f.clave && enVitrina.has(f.clave))} abrir={() => abrirFicha(f.clave ?? `pendiente:${f.id}`)} />
            ))}
            <span style={{ flex: 'none', width: 12 }} />
            <VerTodo grupo={grupo.id} />
          </div>
        </div>
      ))}

      <span style={{ padding: '12px 20px 0', ...TITULO }}>Las 7 maravillas</span>
      <SieteMaravillas g={g} />

      {g.exclusivos.length > 0 && (
        <>
          <span style={{ padding: '12px 20px 0', ...TITULO }}>Exclusivos</span>
          <div style={{ flex: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px' }}>
            {g.exclusivos.map((x) => (
              <ExclusivoDeLista key={x.clave} x={x} abrir={() => abrirFicha(x.clave)} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}

/** «Ver todo»: abre «Mi colección» en ese grupo. Con `pequeno` es la píldora de la cabecera del grupo; si no, la tarjeta del final de la fila. */
function VerTodo({ grupo, pequeno = false, style }: { grupo: string; pequeno?: boolean; style?: React.CSSProperties }): ReactNode {
  const ir = () => useLogrosPantallas.getState().abrir({ t: 'mi_coleccion', grupo })
  if (pequeno) {
    return (
      <button type="button" onClick={ir} style={{ flex: 'none', minHeight: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', ...style }}>
        <span style={{ height: 30, padding: '0 8px 0 12px', borderRadius: 999, border: '1px solid rgba(28,34,48,.16)', background: '#FFFFFF', color: '#1C2230', display: 'flex', alignItems: 'center', gap: 4, font: "600 12px 'Geist'", letterSpacing: 0, textTransform: 'none', whiteSpace: 'nowrap' }}>
          Ver todo
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
    )
  }
  return (
    <button type="button" onClick={ir} style={{ flex: 'none', width: 96, minHeight: 120, border: '1.5px dashed rgba(28,34,48,.2)', borderRadius: 20, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#1C2230' }}>
      <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#1C2230', color: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>›</span>
      <span style={{ font: "600 12px 'Geist'" }}>Ver todo</span>
    </button>
  )
}

function TarjetaDeDestino({ d }: { d: DestinoGanado }): ReactNode {
  const grado = d.sello.grado ?? 'bronce'
  const color = COLOR_DE_GRADO[grado]
  const pct = Math.round(d.avance * 100)
  const linea = lineaDeSecretos(d.ciudad, d.secretos.total ?? 0, d.secretos.encontrados, !d.sello.grado)
  const resumen = `${d.colecciones.completas} de ${d.colecciones.total} colecciones${linea ? ` · ${linea}` : ''}`
  return (
    <button type="button" onClick={() => useLogrosPantallas.getState().abrir({ t: 'destino', destino: d.destino })} style={{ flex: 'none', width: 286, scrollSnapAlign: 'start', position: 'relative', padding: 0, textAlign: 'left', borderRadius: 24, overflow: 'hidden', background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 14px 28px -22px rgba(28,34,48,.5)', cursor: 'pointer', color: '#1C2230' }}>
      <span style={{ display: 'block', height: 110, background: FONDO_DE_GRADO[grado] }} />
      <span style={{ position: 'absolute', left: 14, top: 70, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.35))' }}>
        <Sello id={d.sello.id} grado={grado as GradoDeSello} tam={70} animado={false} />
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 14px 94px' }}>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: "400 24px/1 'Instrument Serif',serif" }}>{d.ciudad}</span>
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", color }}>Sello de {NOMBRE_DE_GRADO[grado].toLowerCase()}</span>
          <span style={{ font: "500 11.5px/1.3 'Geist'", color: 'rgba(28,34,48,.62)' }}>{resumen}</span>
        </span>
        <span aria-label={`${pct} por ciento`} style={{ position: 'relative', width: 44, height: 44, flex: 'none' }}>
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }} aria-hidden>
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(28,34,48,.1)" strokeWidth="4" />
            <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={Math.round(113 * (1 - d.avance))} />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 10.5px 'Geist Mono',monospace" }}>{pct}%</span>
        </span>
      </span>
    </button>
  )
}

function TarjetaDePais({ p }: { p: PaisGanado }): ReactNode {
  const dentro = p.destinos.length > 0 && p.destinos.every((d) => d.dentro_de_otro)
  const resumen = dentro ? `dentro del viaje a ${p.destinos[0]?.ciudad ?? ''}` : `${p.destinos.length} ${p.destinos.length === 1 ? 'destino' : 'destinos'}`
  return (
    <div style={{ borderRadius: 20, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{ width: 22, height: 16, flex: 'none', borderRadius: 3, background: flagStripesGradient(p.codigo), boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.12)' }} />
        <span style={{ font: "400 20px/1 'Instrument Serif',serif" }}>{p.pais}</span>
      </span>
      <span style={{ font: "500 11px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)' }}>{resumen}</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {p.destinos.flatMap((d) =>
          d.sellos.map((s) => (
            <button key={`${d.destino}-${s.id}`} type="button" aria-label={`${s.nombre}, ${d.ciudad}`} onClick={() => useLogrosPantallas.getState().abrir({ t: 'destino', destino: d.destino })} style={{ minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', padding: 4, borderRadius: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#1C2230' }}>
              <Sello id={s.id} grado={(s.grado ?? 'bronce') as GradoDeSello} tam={40} animado={false} />
              <span style={{ font: "500 10px 'Geist'" }}>{s.nombre}</span>
            </button>
          )),
        )}
      </div>
    </div>
  )
}

function TarjetaDeFila({ f, enVitrina, abrir }: { f: FilaDeViajero; enVitrina: boolean; abrir: () => void }): ReactNode {
  const color = GRUPO[f.grupo]?.color ?? '#1C2230'
  const p = f.objetivo > 0 ? Math.min(1, f.actual / f.objetivo) : 0
  return (
    <button type="button" data-fila={f.id} aria-label={`${f.nombre}${f.ganado ? '' : ' (por conseguir)'}`} onClick={abrir} style={{ flex: 'none', width: 108, scrollSnapAlign: 'start', position: 'relative', border: 'none', borderRadius: 20, background: '#FFFDF8', boxShadow: '0 0 0 1px rgba(28,34,48,.07)', padding: '12px 6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#1C2230' }}>
      {f.ganado && (
        <span aria-hidden style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: enVitrina ? VERDE : DORADO, color: enVitrina ? '#fff' : '#17120a', boxShadow: '0 0 0 2px #FFFDF8,0 4px 10px -4px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d={enVitrina ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
          </svg>
        </span>
      )}
      <span style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx="42" cy="42" r="39" fill="none" stroke="rgba(28,34,48,.09)" strokeWidth="3.5" />
          <circle cx="42" cy="42" r="39" fill="none" stroke={f.ganado ? color : 'rgba(28,34,48,.25)'} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="245" strokeDashoffset={Math.round(245 * (1 - p))} />
        </svg>
        <ChapaDeFila fila={f} tam={64} />
      </span>
      <span style={{ marginTop: 4, font: "500 11.5px/1.2 'Geist'", color: f.ganado ? '#1C2230' : 'rgba(28,34,48,.5)', textWrap: 'balance' as never, textAlign: 'center' }}>{f.nombre}</span>
    </button>
  )
}

function SieteMaravillas({ g }: { g: Ganados }): ReactNode {
  const ganadas = g.maravillas.filter((m) => m.ganada)
  const completa = ganadas.length === g.maravillas.length && g.maravillas.length > 0
  return (
    <div data-maravillas style={{ margin: '0 16px', flex: 'none', position: 'relative', borderRadius: 24, background: 'radial-gradient(circle at 30% 30%,#2A3150 0%,#121626 75%)', color: '#FFFDF8', padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      {completa && (
        <span aria-hidden style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: VERDE, color: '#fff', boxShadow: '0 0 0 2px #1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
      <MedallaDeSiete encendidas={ganadas.map((m) => m.id)} tam={128} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {g.maravillas.map((m) => (
          <span key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, font: "500 12px 'Geist'", color: m.ganada ? '#FFFDF8' : 'rgba(255,253,248,.5)' }}>
            <span aria-hidden style={{ width: 16, height: 16, flex: 'none', borderRadius: '50%', background: m.ganada ? '#F3D59A' : 'transparent', border: m.ganada ? 'none' : '1.5px solid rgba(255,253,248,.25)', color: '#17120a', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 9px 'Geist'" }}>{m.ganada ? '✓' : ''}</span>
            {m.ganada && m.fecha ? `${m.nombre} · ${fechaCorta(m.fecha)}` : m.nombre}
          </span>
        ))}
      </div>
    </div>
  )
}

function ExclusivoDeLista({ x, abrir }: { x: ItemGanado; abrir: () => void }): ReactNode {
  return (
    <button type="button" onClick={abrir} style={{ position: 'relative', border: 'none', borderRadius: 20, background: '#1C2230', color: '#FFFDF8', padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', cursor: 'pointer', minHeight: 44 }}>
      <span aria-hidden style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: VERDE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <DibujoDeItem item={x} tam={84} />
      <span style={{ font: "400 16px/1.1 'Instrument Serif',serif" }}>{x.nombre}</span>
    </button>
  )
}
