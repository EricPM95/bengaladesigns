import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Chapa, MedallaDeSiete } from '../../dibujos'
import { FinalSieteMaravillas } from '../../momentos/FinalSieteMaravillas'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { useLogrosPantallas } from '../useLogrosPantallas'
import { useHojasDeLogros, type ExclusivoAbierto, type Ganados, type ItemGanado } from './api'
import { DibujoDeItem } from './dibujo'
import { hastaDe } from './formato'
import { cifrasDeColeccion, numerosDeColeccion } from './numeros'

/**
 * (V82 §1, §4) LOS ESCAPARATES DE «TODOS MIS LOGROS» (N1, P1, P1b, P1c, P2, P2b): la cabecera «Mi colección» con [Presumir de mi colección], el escaparate de las 7 maravillas y el de los exclusivos
 * (la sala azul, de lado a lado). Todo sale de lo ya ganado (`GET /api/logros/ganados`); no pide nada más.
 */
const SERIF = "'Instrument Serif',serif"
const MONO = "'Geist Mono',monospace"
const ORO_CLARO = '#F3D59A'
const NARANJA = 'oklch(0.8 0.14 70)'
const VERDE = 'oklch(0.55 0.11 150)'
const SALA = 'radial-gradient(ellipse 110% 60% at 50% 0%,#1F2750 0%,#12162E 55%,#0B0E1C 100%)'
const ORDEN_MARAVILLAS = ['coliseo', 'gran_muralla', 'petra', 'cristo_redentor', 'machu_picchu', 'chichen_itza', 'taj_mahal']

/** [Presumir de mi colección]: el MISMO botón y el MISMO nombre arriba y abajo. Abre la tarjeta para presumir (P3). */
export function BotonPresumir({ lugar }: { lugar: 'arriba' | 'abajo' }): ReactNode {
  return (
    <button type="button" data-presumir={lugar} onClick={() => useLogrosPantallas.getState().abrir({ t: 'presumir' })} style={{ ...BOTON_ORO, width: '100%', height: 56, border: 'none', borderRadius: 20, font: "700 16px 'Geist'", cursor: 'pointer' }}>
      Presumir de mi colección
    </button>
  )
}

/** La medalla de arriba a la derecha: la de las maravillas si hay al menos una; si no, el primer exclusivo; si no, lo que haya elegido de título. */
export function MedallaDeCabecera({ g, tam }: { g: Ganados; tam: number }): ReactNode {
  const ganadas = g.maravillas.filter((m) => m.ganada)
  if (ganadas.length > 0) return <MedallaDeSiete encendidas={ganadas.map((m) => m.id)} tam={tam} />
  const x = g.exclusivos[0] ?? (g.titulo ? g.items.find((i) => i.clave === g.titulo?.clave) : null)
  return x ? <DibujoDeItem item={x} tam={tam} /> : null
}

export function CabeceraDeColeccion({ g }: { g: Ganados }): ReactNode {
  const n = numerosDeColeccion(g)
  return (
    <div data-cabecera-de-coleccion style={{ margin: '0 16px', flex: 'none', position: 'relative', overflow: 'hidden', borderRadius: 28, background: 'radial-gradient(circle at 80% 10%,#2E3668 0%,#171C3D 45%,#0F1329 100%)', border: '1px solid rgba(243,213,154,.18)', color: '#FFFDF8', padding: '18px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 22px 36px -24px rgba(10,13,28,.8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <span style={{ font: `600 10.5px ${MONO}`, letterSpacing: '.2em', color: ORO_CLARO }}>MI COLECCIÓN</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span data-total-de-coleccion style={{ font: `400 64px/0.9 ${SERIF}`, color: ORO_CLARO }}>{n.total}</span>
            <span style={{ font: `italic 400 22px/1.05 ${SERIF}`, color: 'rgba(255,253,248,.9)' }}>{n.total === 1 ? 'logro' : 'logros'}<br />{n.total === 1 ? 'conseguido' : 'conseguidos'}</span>
          </span>
          {g.titulo && <span data-titulo-del-resumen style={{ marginTop: 2, padding: '6px 12px', borderRadius: 999, background: 'linear-gradient(135deg,#F6E3B0,#D9B867)', color: '#3A2A08', font: "700 12.5px 'Geist'" }}>{g.titulo.nombre}</span>}
        </div>
        <span style={{ flex: 'none', display: 'flex', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.45))' }}>
          <MedallaDeCabecera g={g} tam={112} />
        </span>
      </div>
      <Cifras g={g} />
      <BotonPresumir lugar="arriba" />
    </div>
  )
}

/** Las cuatro cifras (MEDALLAS, COLEC., SECRETOS, PAÍSES), las mismas de la tarjeta para presumir. */
export function Cifras({ g, grande = false }: { g: Ganados; grande?: boolean }): ReactNode {
  return (
    <div data-cifras-de-coleccion style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {cifrasDeColeccion(numerosDeColeccion(g)).map((c) => (
        <span key={c.etiqueta} data-cifra={c.etiqueta.toLowerCase()} style={{ borderRadius: 16, border: '1px solid rgba(255,253,248,.16)', background: 'rgba(255,253,248,.06)', padding: grande ? '12px 4px 10px' : '10px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ font: `400 ${grande ? 34 : 28}px/1 ${SERIF}`, color: '#FFFDF8' }}>{c.n}</span>
          <span style={{ font: `600 8.5px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: ORO_CLARO }}>{c.etiqueta}</span>
        </span>
      ))}
    </div>
  )
}

/* ── Las 7 maravillas (P1, P1b, P1c) ── */
const CLAVE_FINAL = 'jutrip.logros.final_siete_visto'
const yaSeVio = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE_FINAL) === '1'
  } catch {
    return false
  }
}
const apuntarQueSeVio = (): void => {
  try {
    window.localStorage.setItem(CLAVE_FINAL, '1')
  } catch {
    /* sin almacenamiento: se vuelve a ver, no pasa nada */
  }
}

/**
 * El escaparate de las 7 maravillas. En color, SOLO las conseguidas (las demás, en silueta de plata) y en la lista «Conseguida» o «Por ver». Con las 7, la animación completa (`FinalSieteMaravillas`) sale
 * SOLO la primera vez que se ve este escaparate después de conseguir la séptima (se apunta en el móvil); las demás veces, un brillo suave y [Volver a ver] (P1c).
 */
export function BloqueMaravillas({ g }: { g: Ganados }): ReactNode {
  const ganadas = g.maravillas.filter((m) => m.ganada)
  const completa = g.maravillas.length > 0 && ganadas.length === g.maravillas.length
  const caja = useRef<HTMLDivElement>(null)
  const [final, setFinal] = useState(0)
  useEffect(() => {
    if (!completa || yaSeVio()) return
    const el = caja.current
    if (!el) return
    const empezar = () => {
      apuntarQueSeVio()
      setFinal((n) => n + 1)
    }
    if (typeof IntersectionObserver === 'undefined') return empezar()
    const o = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        o.disconnect()
        empezar()
      }
    }, { threshold: 0.35 })
    o.observe(el)
    return () => o.disconnect()
  }, [completa])
  const alVerlo = (m: Ganados['maravillas'][number]) => m.clave && useHojasDeLogros.getState().abrirFicha(m.clave)
  return (
    <div ref={caja} data-maravillas data-maravillas-ganadas={ganadas.length} data-maravillas-modo={final > 0 ? 'final' : completa ? 'brillo' : 'quieta'} style={{ flex: 'none', background: SALA, color: '#FFFDF8', padding: '34px 20px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ font: `600 10.5px ${MONO}`, letterSpacing: '.2em', color: ORO_CLARO }}>LAS 7 MARAVILLAS DEL MUNDO</span>
      <span style={{ font: `400 34px/1.05 ${SERIF}`, textAlign: 'center' }}>
        Mi colección de <em style={{ color: ORO_CLARO }}>maravillas</em>
      </span>
      <span style={{ position: 'relative', margin: '14px 0 6px', display: 'flex', justifyContent: 'center', width: '100%' }}>
        {completa && final === 0 && <span aria-hidden data-brillo-suave style={{ position: 'absolute', inset: '-4% 6%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,140,.38),transparent 66%)', animation: 'vtSpot 4s ease-in-out infinite', pointerEvents: 'none' }} />}
        {final > 0 ? <FinalSieteMaravillas key={final} tam={280} /> : <MedallaDeSiete encendidas={ganadas.map((m) => m.id)} tam={280} />}
      </span>
      {completa && (
        <button type="button" data-volver-a-ver-maravillas onClick={() => setFinal((n) => n + 1)} style={{ height: 44, padding: '0 22px', borderRadius: 999, border: '1px solid rgba(243,213,154,.45)', background: 'rgba(255,253,248,.06)', color: ORO_CLARO, display: 'flex', alignItems: 'center', gap: 8, font: "700 14px 'Geist'", cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 5l12 7-12 7z" /></svg>
          Volver a ver
        </button>
      )}
      <div style={{ alignSelf: 'stretch', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ORDEN_MARAVILLAS.map((id) => g.maravillas.find((x) => x.id === id)).filter((m): m is Ganados['maravillas'][number] => Boolean(m)).map((m) => {
          const fila: CSSProperties = { height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', border: `1px solid ${m.ganada ? 'rgba(243,213,154,.4)' : 'rgba(243,213,154,.12)'}`, background: m.ganada ? 'linear-gradient(180deg,rgba(255,253,248,.1),rgba(255,253,248,.03))' : 'rgba(0,0,0,.16)', color: m.ganada ? '#FFFDF8' : 'rgba(255,253,248,.5)', font: "700 15px 'Geist'", textAlign: 'left' }
          const dentro = (
            <>
              <span aria-hidden style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: m.ganada ? ORO_CLARO : 'rgba(255,253,248,.1)', color: '#17120a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.ganada && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
              </span>
              <span style={{ flex: 1 }}>{m.nombre}</span>
              <span style={{ font: `600 10.5px ${MONO}`, letterSpacing: '.12em', textTransform: 'uppercase', color: m.ganada ? 'rgba(243,213,154,.9)' : 'rgba(243,213,154,.45)' }}>{m.ganada ? 'Conseguida' : 'Por ver'}</span>
            </>
          )
          return m.ganada && m.clave ? (
            <button key={m.id} type="button" data-maravilla={m.id} data-estado="conseguida" onClick={() => alVerlo(m)} style={{ ...fila, cursor: 'pointer', width: '100%' }}>{dentro}</button>
          ) : (
            <span key={m.id} data-maravilla={m.id} data-estado="por-ver" style={fila}>{dentro}</span>
          )
        })}
      </div>
    </div>
  )
}

/* ── Los exclusivos (P2, P2b) ── */
function Hornacina({ dentro, ancho }: { dentro: ReactNode; ancho?: CSSProperties['width'] }): ReactNode {
  return (
    <span style={{ position: 'relative', width: ancho, borderRadius: 24, border: '1px solid rgba(255,253,248,.14)', background: 'linear-gradient(180deg,rgba(200,210,255,.09),rgba(255,255,255,.02))', padding: '14px 6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', overflow: 'hidden' }}>
      <span aria-hidden style={{ position: 'absolute', left: '50%', top: 0, width: 120, height: 90, marginLeft: -60, background: 'linear-gradient(180deg,rgba(255,226,170,.3),transparent)', clipPath: 'polygon(32% 0,68% 0,100% 100%,0 100%)', pointerEvents: 'none' }} />
      {dentro}
    </span>
  )
}

function PinMas({ puesto }: { puesto: boolean }): ReactNode {
  return (
    <span aria-hidden data-pin-vitrina={puesto ? 'en' : 'fuera'} style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: puesto ? VERDE : NARANJA, color: puesto ? '#fff' : '#17120a', boxShadow: '0 0 0 2px #151A38,0 4px 10px -4px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={puesto ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} /></svg>
    </span>
  )
}

/**
 * El escaparate de los exclusivos: salen TUS exclusivos (en color) y los que AÚN se pueden ganar (en silueta, con cómo se consiguen y hasta cuándo); NUNCA los que ya no se pueden ganar.
 * Debajo, «Solo se consiguen una vez: son tuyos para siempre» y [Presumir de mi colección].
 */
export function BloqueExclusivos({ g, enVitrina }: { g: Ganados; enVitrina: Set<string> }): ReactNode {
  const abiertos: ExclusivoAbierto[] = g.exclusivos_abiertos ?? []
  const abrir = (clave: string) => useHojasDeLogros.getState().abrirFicha(clave)
  if (g.exclusivos.length === 0 && abiertos.length === 0) return null
  return (
    <div data-exclusivos style={{ flex: 'none', background: SALA, color: '#FFFDF8', padding: '30px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ padding: '0 4px', font: `600 10.5px ${MONO}`, letterSpacing: '.2em', color: ORO_CLARO }}>EXCLUSIVOS</span>
      <span style={{ padding: '0 4px 4px', font: `400 34px/1.05 ${SERIF}` }}>
        Solo para quien <em style={{ color: ORO_CLARO }}>llegó primero</em>
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {g.exclusivos.map((x: ItemGanado) => (
          <button key={x.clave} type="button" data-exclusivo={x.clave} data-estado="tuyo" onClick={() => abrir(x.clave)} style={{ position: 'relative', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
            <Hornacina ancho="100%" dentro={<><PinMas puesto={enVitrina.has(x.clave)} /><DibujoDeItem item={x} tam={124} /><span style={{ position: 'relative', font: `400 19px/1.1 ${SERIF}` }}>{x.nombre}</span></>} />
          </button>
        ))}
        {abiertos.map((x) => (
          <button key={x.clave} type="button" data-exclusivo={x.clave} data-estado="se-puede-ganar" onClick={() => abrir(x.clave)} style={{ position: 'relative', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
            <Hornacina
              ancho="100%"
              dentro={
                <>
                  <span aria-hidden style={{ position: 'relative', display: 'flex', filter: 'brightness(0) opacity(.38)' }}><Chapa logro={x.def} escalon={x.anio} ciudad={x.ciudad} tam={124} igual /></span>
                  <span style={{ position: 'relative', font: `400 19px/1.1 ${SERIF}` }}>{x.nombre}</span>
                  <span data-hasta style={{ position: 'relative', font: `600 9.5px/1.3 ${MONO}`, letterSpacing: '.04em', color: ORO_CLARO }}>{hastaDe(x.hasta)}</span>
                  <span style={{ position: 'relative', font: "500 12px/1.25 'Geist'", color: 'rgba(255,253,248,.72)' }}>{x.como}</span>
                </>
              }
            />
          </button>
        ))}
      </div>
      <span data-solo-una-vez style={{ margin: '6px 0 4px', padding: '16px 18px', borderRadius: 20, border: '1px solid rgba(255,253,248,.14)', background: 'rgba(255,253,248,.06)', font: `400 22px/1.15 ${SERIF}` }}>Solo se consiguen una vez: son tuyos para siempre</span>
      <BotonPresumir lugar="abajo" />
    </div>
  )
}
