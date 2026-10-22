import { botonChampan } from '../../../lib/marcaBoton'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flagDots } from '../../../lib/flagColors'
import { Capa } from './Capa'
import { Globo, type Objetivo, type Relleno } from './mundo/Globo'
import { guardarPrevios, pedirPrevios, type RespuestaPrevios } from './mundo/api'
import { centroDeVarios } from './mundo/proyeccion'
import { buscarPaises, usePaisesYTierra, type Pais } from './mundo/paises'
import './mundo/mundo.css'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

const VERDE = 'oklch(0.55 0.11 150)'
const MARCADO = 'oklch(0.66 0.13 40)'
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/**
 * «¿DÓNDE HAS ESTADO YA?» (Tanda 8C2; J1, J2 y J3 de `Piezas/Logros J Donde has estado`). Marcar los países en el globo o en la lista (J1), buscar los pequeños por su nombre (J2) y
 * «Lo que has ganado» (J3). Lo marcado se guarda con `PUT /api/logros/previos`. LA REGLA: solo da su sello «recuerdo» en el pasaporte y sus números; no da EXP, no cuenta para
 * el sorteo ni para los logros que piden viajar con la app (el servidor no lo mira para nada de eso).
 */
export default function DondeHasEstado({ pantalla: _pantalla }: { pantalla: PantallaDe<'previos'> }): ReactNode {
  const { paises, tierra } = usePaisesYTierra()
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [dias, setDias] = useState(0)
  const [q, setQ] = useState('')
  const [fase, setFase] = useState<'elegir' | 'ganado'>('elegir')
  const [resultado, setResultado] = useState<RespuestaPrevios | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(false)
  const [objetivo, setObjetivo] = useState<Objetivo | undefined>(undefined)
  const [inicial, setInicial] = useState<string[] | null>(null)
  const volver = () => useLogrosPantallas.getState().volver()

  useEffect(() => {
    let vivo = true
    void pedirPrevios().then((r) => {
      if (!vivo || !r) return
      setInicial(r.paises)
      setDias(r.dias)
    })
    return () => {
      vivo = false
    }
  }, [])
  // Cuando están el catálogo y lo guardado, se marca lo que ya había (una sola vez) y el globo gira hacia ello.
  const sembrado = useRef(false)
  useEffect(() => {
    if (sembrado.current || !paises || !inicial) return
    sembrado.current = true
    const nombres = new Set(inicial)
    const marcados = paises.filter((p) => nombres.has(p.n))
    setSel(new Set(marcados.map((p) => p.i)))
    if (marcados.length) setObjetivo({ ...centroDeVarios(marcados), z: 1, n: 1 })
  }, [paises, inicial])

  const alternar = (iso: string) =>
    setSel((s) => {
      const n = new Set(s)
      if (n.has(iso)) n.delete(iso)
      else n.add(iso)
      return n
    })

  const lista = useMemo(() => (paises ? buscarPaises(paises, q) : []), [paises, q])
  const rellenos = useMemo(() => {
    const r: Record<string, Relleno> = {}
    for (const iso of sel) r[iso] = { f: MARCADO }
    return r
  }, [sel])
  const n = sel.size

  const terminar = async () => {
    if (guardando || !paises) return
    setGuardando(true)
    setError(false)
    const nombres = paises.filter((p) => sel.has(p.i)).map((p) => p.n)
    const guardado = await guardarPrevios(nombres, dias)
    if (!guardado?.ok) {
      setGuardando(false)
      setError(true)
      return
    }
    if (!nombres.length) return volver()
    const nuevo = await pedirPrevios()
    setResultado(nuevo)
    setFase('ganado')
    setGuardando(false)
  }

  if (fase === 'ganado' && paises) return <LoQueHasGanado tierra={tierra} marcados={paises.filter((p) => sel.has(p.i))} resultado={resultado} />

  return (
    <Capa etiqueta="DondeHasEstado" fondo="#F5EFE4">
      <div data-mundo="" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 'none', display: 'flex', justifyContent: 'flex-end', padding: '0 14px' }}>
          <button type="button" onClick={volver} style={{ height: 44, minWidth: 44, padding: '0 14px', border: 'none', borderRadius: 999, background: 'transparent', color: 'rgba(28,34,48,.7)', font: "600 14px 'Geist'", cursor: 'pointer' }}>
            Ahora no
          </button>
        </div>
        <div style={{ flex: 'none', padding: '0 22px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, font: "400 34px/1.02 'Instrument Serif',serif", textWrap: 'balance' }}>¿Dónde has estado ya?</h1>
          <span style={{ font: "400 14px/1.45 'Geist'", color: 'rgba(28,34,48,.7)', textWrap: 'pretty' }}>Marca los países que has visitado y empieza con tus logros.</span>
        </div>
        {q === '' && (
          <div style={{ position: 'relative', flex: 'none', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ position: 'absolute', width: 270, height: 270, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,240,210,.9),transparent 70%)' }} />
            <div style={{ position: 'relative' }}>
              <Globo tierra={tierra} rellenos={rellenos} objetivo={objetivo} estilo="oceano" lado={264} onPais={alternar} etiqueta="El globo: toca un país para marcarlo" />
            </div>
            <span style={{ position: 'absolute', bottom: 4, height: 30, padding: '0 12px', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', display: 'flex', alignItems: 'center', gap: 6, font: "600 12.5px 'Geist'" }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.72 0.12 150)' }} />
              {plural(n, 'país marcado', 'países marcados')}
            </span>
          </div>
        )}
        <div style={{ flex: 'none', padding: '12px 16px 0' }}>
          <label style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderRadius: 16, background: '#FFFDF8', border: `1.5px solid ${q ? '#1C2230' : 'rgba(28,34,48,.12)'}` }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.55)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un país" aria-label="Busca un país" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', font: "500 15px 'Geist'", color: '#1C2230' }} />
          </label>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '8px 16px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ padding: '6px 4px', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.5)' }}>{q ? (lista.length ? 'Resultados' : 'Ningún país con ese nombre') : 'Todos los países · A-Z'}</span>
          {lista.map((p) => (
            <FilaDePais key={p.i} pais={p} marcado={sel.has(p.i)} alTocar={() => alternar(p.i)} />
          ))}
        </div>
        <div style={{ flex: 'none', padding: '10px 16px calc(30px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid rgba(28,34,48,.07)', background: '#F5EFE4' }}>
          {error && <span style={{ textAlign: 'center', font: "500 13px 'Geist'", color: 'oklch(0.52 0.19 25)' }}>No se ha podido guardar. Vuelve a probar.</span>}
          <button type="button" onClick={() => void terminar()} disabled={guardando} style={{ height: 54, border: 'none', borderRadius: 999, ...botonChampan(), font: "600 15px 'Geist'", cursor: 'pointer', opacity: n ? 1 : 0.4 }}>
            {n ? `Listo · ${plural(n, 'país', 'países')}` : 'Listo'}
          </button>
        </div>
      </div>
    </Capa>
  )
}

function FilaDePais({ pais, marcado, alTocar }: { pais: Pais; marcado: boolean; alTocar: () => void }): ReactNode {
  const [a, b, c] = flagDots(pais.i)
  return (
    <button type="button" onClick={alTocar} aria-pressed={marcado} style={{ minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 6px', border: 'none', borderBottom: '1px solid rgba(28,34,48,.07)', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: '#1C2230' }}>
      <span style={{ width: 26, height: 18, flex: 'none', borderRadius: 4, overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.12)' }}>
        <span style={{ flex: 1, background: a }} />
        <span style={{ flex: 1, background: b }} />
        <span style={{ flex: 1, background: c }} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ font: "500 15px 'Geist'" }}>{pais.n}</span>
        {pais.p === 1 && <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.55)' }}>Pequeño en el globo</span>}
      </span>
      <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: marcado ? VERDE : 'transparent', border: `1.5px solid ${marcado ? VERDE : 'rgba(28,34,48,.25)'}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .25s' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: marcado ? 1 : 0 }} aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </button>
  )
}

/** J3: «Lo que has ganado». Solo lo que es verdad: tu mundo, los sellos recuerdo del pasaporte, calculados por el servidor (los continentes no se cuentan: ese logro está apagado en la Versión 1). Nada de EXP ni de logros. */
function LoQueHasGanado({ tierra, marcados, resultado }: { tierra: Parameters<typeof Globo>[0]['tierra']; marcados: Pais[]; resultado: RespuestaPrevios | null }): ReactNode {
  const numeros = resultado?.numeros
  const total = numeros?.paises ?? marcados.length
  const rellenos: Record<string, Relleno> = {}
  for (const p of marcados) rellenos[p.i] = { f: MARCADO }
  const verMiMundo = () => useLogrosPantallas.getState().cambiar({ t: 'pasaporte' })
  return (
    <Capa etiqueta="DondeHasEstado" oscura fondo="radial-gradient(circle at 50% 30%,#3A2A20 0%,#1A1410 70%)">
      <div data-mundo="" style={{ position: 'relative', flex: 1, color: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '96px 26px calc(34px + env(safe-area-inset-bottom))', textAlign: 'center', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 60, left: '50%', width: 360, height: 360, marginLeft: -180, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(255,220,160,.16) 0 7deg,transparent 7deg 22deg)', WebkitMaskImage: 'radial-gradient(circle,#000 25%,transparent 68%)', maskImage: 'radial-gradient(circle,#000 25%,transparent 68%)', animation: 'muRays 30s linear infinite' }} />
        <span style={{ position: 'absolute', top: 120, left: '50%', width: 220, height: 220, marginLeft: -110, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,215,150,.45),transparent 70%)', animation: 'muGlow 3.2s ease-in-out infinite' }} />
        <div style={{ position: 'relative', width: 200, height: 200, borderRadius: '50%', padding: 6, background: 'conic-gradient(from 200deg,#F6E3A8,#B8903E,#F3D59A,#8E6A26,#F6E3A8)', boxShadow: '0 18px 30px -14px rgba(0,0,0,.7)', animation: 'muPop 1s .3s cubic-bezier(.2,.8,.2,1) both' }}>
          <Globo tierra={tierra} rellenos={rellenos} objetivo={{ ...centroDeVarios(marcados), z: 1, n: 1 }} estilo="oceano" lado={188} interactivo={false} etiqueta="Tu mundo" />
        </div>
        <span style={{ position: 'relative', marginTop: 22, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: '#F3D59A', animation: 'muUp .6s 1.4s ease both' }}>Tu mundo</span>
        <span style={{ position: 'relative', marginTop: 8, font: "400 40px/1 'Instrument Serif',serif", animation: 'muUp .6s 1.6s ease both' }}>{plural(total, 'país', 'países')}</span>
        <span style={{ position: 'relative', marginTop: 12, maxWidth: 290, font: "italic 400 18px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.8)', textWrap: 'balance', animation: 'muUp .6s 1.9s ease both' }}>Tus próximos viajes con la app te darán tus primeros logros.</span>
        {numeros && (
          <span style={{ position: 'relative', marginTop: 16, font: "500 12px 'Geist Mono',monospace", letterSpacing: '.06em', color: 'rgba(243,213,154,.85)', animation: 'muUp .6s 2.3s ease both' }}>
            {plural(numeros.sellos_recuerdo, 'sello de recuerdo', 'sellos de recuerdo')}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={verMiMundo} style={{ position: 'relative', height: 54, width: '100%', border: 'none', borderRadius: 999, background: 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)', color: '#2A1D10', font: "700 15px 'Geist'", cursor: 'pointer', animation: 'muUp .6s 3.8s ease both' }}>
          Ver mi mundo
        </button>
      </div>
    </Capa>
  )
}
