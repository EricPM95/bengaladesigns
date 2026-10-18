import { useMemo, useState, type ReactNode } from 'react'
import { MedallaDeSiete } from '../../dibujos'
import { useMomentosUI } from '../../momentos/useMomentosUI'
import { guardarBalda, ORDEN_BALDAS, TITULO_DE_BALDA, useGanados, useHojasDeLogros, VACIA_DE_BALDA, type Balda, type Ganados, type ItemGanado } from './api'
import { DibujoDeItem } from './dibujo'
import { cuandoDe, etiquetaDe } from './formato'

/**
 * «MI VITRINA» (V1 con piezas, V2 con las baldas vacías): el pedestal de las 7 maravillas, la balda de los Exclusivos y cuatro baldas de 4 huecos (logros de viajero, sellos, colecciones
 * y emblemas). Tocar una pieza la abre a pantalla grande con [Compartir] y [Quitar de mi vitrina]. Los emblemas que no se han encontrado no existen aquí: solo los encontrados.
 */
const ETIQUETA = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase' } as const
const ORO_CLARO = 'rgba(243,213,154,.85)'

type Abierta = { clave: string | null; pedestal?: boolean }

export function Vitrina({ g, abiertaInicial = null }: { g: Ganados; abiertaInicial?: Abierta | null }): ReactNode {
  const porClave = useMemo(() => new Map(g.items.map((i) => [i.clave, i])), [g.items])
  const [abierta, setAbierta] = useState<Abierta | null>(abiertaInicial)
  const pedestal = g.vitrina.pedestal.map((k) => porClave.get(k)).filter((x): x is ItemGanado => Boolean(x))
  const exclusivos = g.vitrina.exclusivos.map((k) => porClave.get(k)).filter((x): x is ItemGanado => Boolean(x))
  return (
    <>
      <main className="vt-oculto" data-vitrina style={{ position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '0 16px calc(env(safe-area-inset-bottom,0px) + 40px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pedestal.length > 0 && (
          <div style={{ position: 'relative', flex: 'none', height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span aria-hidden style={{ position: 'absolute', left: '50%', top: -30, width: 300, height: 330, marginLeft: -150, background: 'radial-gradient(ellipse 50% 80% at 50% 0%,rgba(255,226,170,.42),rgba(255,226,170,.08) 60%,transparent 75%)', clipPath: 'polygon(38% 0,62% 0,100% 100%,0 100%)', animation: 'vtSpot 5s ease-in-out infinite' }} />
            <span aria-hidden style={{ position: 'absolute', left: '50%', top: 18, width: 230, height: 230, marginLeft: -115, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(243,213,154,.14) 0 2deg,transparent 2deg 15deg)', WebkitMask: 'radial-gradient(circle,#000 20%,transparent 66%)', mask: 'radial-gradient(circle,#000 20%,transparent 66%)', animation: 'vtRays 40s linear infinite' }} />
            <button type="button" aria-label="Las 7 maravillas" onClick={() => setAbierta({ clave: null, pedestal: true })} style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, minWidth: 44, minHeight: 44, cursor: 'pointer' }}>
              <MedallaDeSiete encendidas={pedestal.map((p) => p.maravilla ?? '')} tam={190} />
            </button>
            <span aria-hidden style={{ position: 'relative', marginTop: -6, width: 170, height: 18, borderRadius: '50%', background: 'linear-gradient(180deg,#3A3424,#15120C)', boxShadow: '0 0 0 1px rgba(243,213,154,.35),0 10px 20px -6px rgba(0,0,0,.8)' }} />
          </div>
        )}

        {exclusivos.length > 0 && (
          <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
            <span style={{ ...ETIQUETA, display: 'flex', justifyContent: 'space-between', padding: '0 4px', color: ORO_CLARO }}>
              <span>Exclusivos</span>
              <span style={{ color: 'rgba(255,253,248,.5)' }}>
                {exclusivos.length} {exclusivos.length === 1 ? 'exclusivo' : 'exclusivos'}
              </span>
            </span>
            <div style={{ position: 'relative', borderRadius: 18, background: 'linear-gradient(180deg,rgba(200,210,255,.06),rgba(255,255,255,.02))', padding: '14px 6px 10px' }}>
              <div className="vt-oculto" style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 8px' }}>
                {exclusivos.map((x) => (
                  <button key={x.clave} type="button" aria-label={x.nombre} onClick={() => setAbierta({ clave: x.clave })} style={{ flex: 'none', minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <DibujoDeItem item={x} tam={86} />
                    <span aria-hidden style={{ marginTop: 2, width: 62, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,.45)' }} />
                  </button>
                ))}
              </div>
              <span aria-hidden style={{ position: 'absolute', left: 8, right: 8, bottom: 6, height: 2, borderRadius: 2, background: 'linear-gradient(90deg,transparent,rgba(220,230,255,.5),transparent)' }} />
            </div>
          </div>
        )}

        {ORDEN_BALDAS.map((b) => (
          <BaldaDeVitrina key={b} balda={b} huecos={g.vitrina.baldas[b].huecos.map((k) => porClave.get(k)).filter((x): x is ItemGanado => Boolean(x))} abrir={(clave) => setAbierta({ clave })} />
        ))}
      </main>
      {abierta && <PiezaAbierta g={g} abierta={abierta} cerrar={() => setAbierta(null)} />}
    </>
  )
}

function BaldaDeVitrina({ balda, huecos, abrir }: { balda: Balda; huecos: ItemGanado[]; abrir: (clave: string) => void }): ReactNode {
  const ninguno = huecos.length === 0
  return (
    <div data-balda={balda} style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
      <span style={{ ...ETIQUETA, display: 'flex', justifyContent: 'space-between', padding: '0 4px', color: ORO_CLARO }}>
        <span>{TITULO_DE_BALDA[balda]}</span>
        <span style={{ color: 'rgba(255,253,248,.5)' }}>{huecos.length} de 4</span>
      </span>
      <div style={{ position: 'relative', height: 122, borderRadius: 16, background: 'linear-gradient(180deg,rgba(255,253,248,.035),rgba(255,253,248,.015))' }}>
        <div style={{ position: 'absolute', inset: '0 6px 14px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {[0, 1, 2, 3].map((i) => {
            const it = huecos[i]
            return (
              <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span aria-hidden style={{ position: 'absolute', left: '50%', top: -6, width: 84, height: 118, marginLeft: -42, background: `radial-gradient(ellipse 50% 90% at 50% 0%,rgba(255,226,170,${it ? '.34' : '.12'}),transparent 72%)`, clipPath: 'polygon(36% 0,64% 0,100% 100%,0 100%)', pointerEvents: 'none' }} />
                {it ? (
                  <>
                    <button type="button" aria-label={it.nombre} onClick={() => abrir(it.clave)} style={{ position: 'relative', border: 'none', background: 'transparent', padding: 0, marginBottom: 4, cursor: 'pointer', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DibujoDeItem item={it} tam={balda === 'viajero' ? 68 : 66} />
                    </button>
                    <span aria-hidden style={{ width: 52, height: 7, borderRadius: '50%', background: 'rgba(0,0,0,.5)' }} />
                  </>
                ) : (
                  <span aria-hidden style={{ width: 62, height: 62, marginBottom: 10, borderRadius: balda === 'colecciones' ? 18 : '50%', border: '1.5px dashed rgba(243,213,154,.3)' }} />
                )}
              </div>
            )
          })}
        </div>
        {ninguno && <span style={{ position: 'absolute', left: 12, right: 12, top: 42, font: "italic 400 16px/1.25 'Instrument Serif',serif", color: 'rgba(255,253,248,.72)', textAlign: 'center', textWrap: 'balance' as never }}>{VACIA_DE_BALDA[balda]}</span>}
        <span aria-hidden style={{ position: 'absolute', left: 4, right: 4, bottom: 8, height: 3, borderRadius: 3, background: 'linear-gradient(90deg,transparent,rgba(220,230,255,.55),transparent)', boxShadow: '0 2px 10px rgba(220,230,255,.18)' }} />
      </div>
    </div>
  )
}

/** Una pieza a pantalla grande: su dibujo con rayos, su nombre, su línea y cuándo se consiguió, con [Compartir] y [Quitar de mi vitrina]. */
function PiezaAbierta({ g, abierta, cerrar }: { g: Ganados; abierta: Abierta; cerrar: () => void }): ReactNode {
  const poner = useGanados((s) => s.poner)
  const avisar = useHojasDeLogros((s) => s.avisar)
  const [ocupado, setOcupado] = useState(false)
  const item = abierta.clave ? g.items.find((i) => i.clave === abierta.clave) : null
  const pedestal = g.vitrina.pedestal.map((k) => g.items.find((i) => i.clave === k)).filter((x): x is ItemGanado => Boolean(x))
  const ultimaMaravilla = [...pedestal].sort((a, b) => b.en.localeCompare(a.en))[0]
  const esColeccion = item?.tipo === 'coleccion'
  let eye = ''
  let nombre = ''
  let linea: string | null = null
  let cuando = ''
  let momento = item?.momento ?? null
  if (item) {
    eye = etiquetaDe(item)
    nombre = item.nombre
    linea = item.linea
    cuando = cuandoDe(item)
  } else if (abierta.pedestal && ultimaMaravilla) {
    eye = 'Las 7 maravillas'
    nombre = 'Las 7 maravillas'
    linea = `${pedestal.length} de ${g.maravillas.length} maravillas.`
    cuando = cuandoDe({ tipo: 'maravilla', grado: undefined, fecha: ultimaMaravilla.fecha })
    momento = ultimaMaravilla.momento
  }
  const puedeQuitar = Boolean(item?.balda && g.vitrina.baldas[item.balda].huecos.includes(item.clave))
  const quitar = async () => {
    if (!item?.balda || ocupado) return
    setOcupado(true)
    const huecos = g.vitrina.baldas[item.balda].huecos.filter((k) => k !== item.clave)
    const v = await guardarBalda(item.balda, huecos)
    setOcupado(false)
    if (!v) return avisar('No se ha podido quitar. Vuelve a probar.')
    poner({ ...g, vitrina: v })
    cerrar()
    avisar(`«${item.nombre}» vuelve a Todos mis logros`)
  }
  return (
    <div role="dialog" aria-modal="true" aria-label={nombre} data-pieza-abierta style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '70px 24px calc(env(safe-area-inset-bottom,0px) + 30px)', background: 'rgba(6,8,16,.9)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'vtFade .3s ease both' }}>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 14, top: 'calc(env(safe-area-inset-top,0px) + 12px)', width: 48, height: 48, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,253,248,.1)', color: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
      </button>
      <div style={{ position: 'relative', width: 200, height: abierta.pedestal ? 236 : 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'vtPop .6s cubic-bezier(.2,.8,.2,1) both' }}>
        {esColeccion && (
          <>
            <span aria-hidden style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(243,213,154,.22) 0 3deg,transparent 3deg 14deg)', WebkitMask: 'radial-gradient(circle,#000 25%,transparent 66%)', mask: 'radial-gradient(circle,#000 25%,transparent 66%)', animation: 'vtRays 20s linear infinite,vtFade 1s ease both' }} />
            <span aria-hidden style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid #F3D59A', opacity: 0, animation: 'vtBurst 1.4s .3s ease-out both' }} />
            <span aria-hidden style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid #FFFFFF', opacity: 0, animation: 'vtBurst 1.6s .55s ease-out both' }} />
          </>
        )}
        {item ? <DibujoDeItem item={item} tam={item.tipo === 'emblema' ? 170 : 180} /> : <MedallaDeSiete encendidas={pedestal.map((p) => p.maravilla ?? '')} tam={190} />}
      </div>
      <span style={{ marginTop: 14, ...ETIQUETA, color: '#F3D59A', animation: 'vtUp .5s .2s ease both' }}>{eye}</span>
      <span style={{ marginTop: 6, font: "400 30px/1.05 'Instrument Serif',serif", color: '#FFFDF8', textAlign: 'center', textWrap: 'balance' as never, animation: 'vtUp .5s .3s ease both' }}>{nombre}</span>
      {linea && <span style={{ marginTop: 6, font: "italic 400 16px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.75)', textAlign: 'center', textWrap: 'balance' as never, animation: 'vtUp .5s .35s ease both' }}>{linea}</span>}
      <span style={{ marginTop: 6, font: "500 11.5px 'Geist Mono',monospace", color: 'rgba(255,253,248,.55)', animation: 'vtUp .5s .4s ease both' }}>{cuando}</span>
      <div style={{ flex: 1 }} />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, animation: 'vtUp .5s .55s ease both' }}>
        <button type="button" disabled={!momento} onClick={() => momento && useMomentosUI.getState().abrirCompartir({ tipo: 'logro', momento })} style={{ height: 52, border: 'none', borderRadius: 999, background: 'oklch(0.8 0.14 70)', color: '#17120a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: "700 15px 'Geist'", cursor: 'pointer', opacity: momento ? 1 : 0.5 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          </svg>
          Compartir
        </button>
        {puedeQuitar && (
          <button type="button" disabled={ocupado} onClick={() => void quitar()} style={{ height: 44, border: '1px solid rgba(255,253,248,.22)', borderRadius: 999, background: 'transparent', color: '#FFFDF8', font: "600 13.5px 'Geist'", cursor: 'pointer' }}>
            Quitar de mi vitrina
          </button>
        )}
      </div>
    </div>
  )
}
