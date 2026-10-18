import { lazy, Suspense, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, type ColeccionDeEstado, type EstadoLogros } from './api'
import { COLOR_DE_GRADO } from './BotonFlotanteLogros'
import { bannerAntes, bannerDespues, etiquetaDeFase, faseDelViaje, lineaDeGrado, marcaDeColeccion, notaDeSecretos, TEXTO_AL_COMPLETAR, textoDelSiguiente, tituloDeSecretos, type FaseDelViaje } from './hoja/textosHoja'
import { piezaDeInsignia } from './hoja/piezaDeInsignia'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

const EscenaDeEmblema = lazy(() => import('./EscenaDeEmblema'))

/**
 * LA HOJA DE LOGROS (Tanda 8C2, «Logros · el botón del destino», partes 2, 3 y 4). Lo que abre el botón flotante: antes, durante y después del viaje.
 *   - Arriba, los sellos (Roma en grande y el Vaticano) con su avance y lo que les falta para el siguiente grado.
 *   - Una franja con «Con tu ruta puedes completar N de las 11 colecciones» (antes) o lo que queda para el diamante (después).
 *   - Las colecciones, en el orden del servidor (lo nuevo de hoy, las completas, las de su ruta y las demás): tocar un pedazo dice su nombre, tocar la colección abre sus sitios (con [Cómo llegar]
 *     y [Añadir a mi ruta]).
 *   - Los secretos: nunca se enseñan los que faltan (solo «?»); los encontrados se ven y, al tocarlos, vuelve a ponerse su escena.
 * Nunca enseña un emblema antes de encontrarlo, ni dice cuáles faltan ni dónde están. Todos los números salen de `GET /api/logros/estado`.
 */
const ID_EMBLEMAS = ['coliseo', 'foro_romano', 'panteon', 'fontana_de_trevi', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'boca_de_la_verdad', 'ojo_cerradura', 'catacumbas', 'madrugador', 'nocturno']
/** La forma del hueco de cada emblema («?» dentro): ancho, alto, radio y giro, como en el diseño. */
const FORMA_HUECO: [number, number, string, string][] = [
  [69, 78, '50% 50% 14px 14px', 'none'],
  [69, 69, '18px', 'rotate(45deg)'],
  [75, 75, '50%', 'none'],
  [66, 81, '50% 50% 50% 50% / 58% 58% 42% 42%', 'none'],
  [75, 63, '50%', 'none'],
  [72, 72, '21px', 'none'],
  [69, 78, '22px 22px 50% 50%', 'none'],
  [75, 75, '50%', 'none'],
  [66, 66, '15px', 'rotate(45deg)'],
  [69, 81, '50% 50% 12px 12px', 'none'],
  [75, 75, '50%', 'none'],
  [75, 75, '50%', 'none'],
]
const UNIDAD_DE_SELLO: Record<string, string> = { roma: 'imprescindibles' }

const ETIQUETA = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' } as const
const FRAMBUESA = 'oklch(0.55 0.17 5)'
const VERDE = 'oklch(0.55 0.11 150)'

export default function HojaLogros(): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  const [cargado, setCargado] = useState(false)
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())
  const [escena, setEscena] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    void pedirEstado(tripId).then((e) => {
      if (!vivo) return
      setEstado(e)
      setCargado(true)
    })
    return () => {
      vivo = false
    }
  }, [tripId])
  const cerrar = () => useMomentosUI.getState().cerrarHojaLogros()
  const fase = faseDelViaje(estado?.viaje)
  const etiqueta = estado ? etiquetaDeFase(fase, estado.viaje, estado.ciudad) : null
  const hayViaje = Boolean(estado?.viaje)

  const nuevas = estado ? estado.colecciones.filter((c) => c.nuevo_hoy && fase !== 'antes') : []
  const resto = estado ? estado.colecciones.filter((c) => !(c.nuevo_hoy && fase !== 'antes')) : []
  const alternar = (id: string) =>
    setAbiertas((a) => {
      const n = new Set(a)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="mo" style={{ position: 'fixed', inset: 0, zIndex: 9000, fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div onClick={cerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.45)', animation: 'moFade .3s ease both' }} />
      <div role="dialog" aria-modal="true" aria-label="Tus logros" data-hoja-logros={fase} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 64, display: 'flex', flexDirection: 'column', borderRadius: '28px 28px 0 0', background: '#FFFDF8', color: '#1C2230', animation: 'moSube .45s cubic-bezier(.2,.8,.2,1) both' }}>
        <span style={{ alignSelf: 'center', margin: '10px 0 2px', width: 42, height: 4, flex: 'none', borderRadius: 4, background: 'rgba(28,34,48,.18)' }} />
        <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px 10px 20px' }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {etiqueta && <span style={{ ...ETIQUETA, color: 'oklch(0.5 0.17 5)' }}>{etiqueta}</span>}
            <span style={{ font: "400 28px/1 'Instrument Serif',serif" }}>{estado?.ciudad ? `Tus logros en ${estado.ciudad}` : 'Tus logros'}</span>
          </span>
          <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ width: 48, height: 48, flex: 'none', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#F1EADC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '2px 16px calc(env(safe-area-inset-bottom,0px) + 28px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!estado ? (
            <p style={{ textAlign: 'center', font: "400 13.5px 'Geist'", color: 'rgba(28,34,48,.6)', margin: '24px 0' }}>{cargado ? 'Todavía no hay logros que enseñar.' : 'Un momento…'}</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: estado.sellos.length > 1 ? '1.55fr 1fr' : '1fr', gap: 8 }}>
                {estado.sellos.map((s, i) => (
                  <TarjetaDeSello key={s.id} sello={s} grande={i === 0} fase={fase} />
                ))}
              </div>
              <Franja fase={fase} estado={estado} hayViaje={hayViaje} />
              {nuevas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ ...ETIQUETA, padding: '8px 4px 2px', display: 'flex', alignItems: 'center', gap: 8, color: 'oklch(0.48 0.17 5)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: FRAMBUESA }} />
                    Lo nuevo de hoy
                  </span>
                  {nuevas.map((c, i) => (
                    <FilaDeColeccion key={c.id} c={c} i={i} fase={fase} ciudad={estado.ciudad} abierta={abiertas.has(c.id)} alternar={() => alternar(c.id)} cerrarHoja={cerrar} />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resto.map((c, i) => (
                  <FilaDeColeccion key={c.id} c={c} i={i + nuevas.length} fase={fase} ciudad={estado.ciudad} abierta={abiertas.has(c.id)} alternar={() => alternar(c.id)} cerrarHoja={cerrar} />
                ))}
              </div>
              <Secretos fase={fase} estado={estado} verEscena={(id) => setEscena(id)} />
              {fase === 'despues' && (
                <button
                  type="button"
                  onClick={() => {
                    cerrar()
                    useMomentosUI.getState().abrirResumenViaje()
                  }}
                  style={{ width: '100%', height: 50, marginTop: 4, border: 'none', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "700 14.5px 'Geist'", cursor: 'pointer' }}
                >
                  Ver el resumen del viaje
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {escena && (
        <Suspense fallback={null}>
          <EscenaDeEmblema id={escena} primeraVez={false} onSeguir={() => setEscena(null)} />
        </Suspense>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function TarjetaDeSello({ sello, grande, fase }: { sello: EstadoLogros['sellos'][number]; grande: boolean; fase: FaseDelViaje }): ReactNode {
  const grado = sello.grado
  const color = grado ? COLOR_DE_GRADO[grado] : 'rgba(28,34,48,.45)'
  const siguiente = sello.siguiente ? { grado: sello.siguiente.grado, faltan: sello.siguiente.faltan } : null
  const texto = textoDelSiguiente({ fase, grado, siguiente, alCompletar: TEXTO_AL_COMPLETAR[sello.id] ?? null })
  return (
    <div data-sello={sello.id} style={{ borderRadius: 22, background: grande ? '#F5EFE4' : '#FFFFFF', border: '1px solid rgba(28,34,48,.07)', padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, textAlign: 'center' }}>
      <span style={{ opacity: grado ? 1 : 0.55 }}>
        <Sello id={sello.id} grado={(grado ?? 'bronce') as GradoDeSello} apagado={!grado} tam={grande ? 84 : 60} animado={false} etiqueta={grande} />
      </span>
      <span style={{ font: `400 ${grande ? 20 : 16}px/1.05 'Instrument Serif',serif`, textWrap: 'balance' as never }}>{sello.nombre_grado ?? 'Por conseguir'}</span>
      <span style={{ ...ETIQUETA, letterSpacing: '.1em', color }}>{lineaDeGrado(grado, sello.n, sello.total, UNIDAD_DE_SELLO[sello.id] ?? 'sitios')}</span>
      <div style={{ width: '100%', height: 5, borderRadius: 5, background: 'rgba(28,34,48,.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${sello.total > 0 ? (sello.n / sello.total) * 100 : 0}%`, borderRadius: 5, background: color, animation: 'moGrow 1.1s .4s cubic-bezier(.3,0,.2,1) both' }} />
      </div>
      {texto && <span style={{ font: "500 11.5px/1.3 'Geist'", color: grado ? 'oklch(0.48 0.17 5)' : 'rgba(28,34,48,.55)', textWrap: 'balance' as never }}>{texto}</span>}
    </div>
  )
}

function Franja({ fase, estado, hayViaje }: { fase: FaseDelViaje; estado: EstadoLogros; hayViaje: boolean }): ReactNode {
  const texto = fase === 'antes' ? (hayViaje ? bannerAntes(estado.con_tu_ruta_puedes_completar, estado.colecciones.length) : null) : fase === 'despues' ? bannerDespues(estado.ciudad, estado.sellos[0]) : null
  if (!texto) return null
  const verde = fase === 'antes'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 18, background: verde ? 'oklch(0.96 0.035 150)' : '#F5EFE4', border: `1px solid ${verde ? 'oklch(0.55 0.11 150 / .3)' : 'rgba(28,34,48,.08)'}` }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={verde ? 'oklch(0.42 0.09 150)' : 'oklch(0.5 0.17 5)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden>
        <path d={verde ? 'M6 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 18.5h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8' : 'M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z'} />
      </svg>
      <span style={{ flex: 1, font: "500 13.5px/1.35 'Geist'", textWrap: 'pretty' as never }}>{texto}</span>
    </div>
  )
}

function FilaDeColeccion({ c, i, fase, ciudad, abierta, alternar, cerrarHoja }: { c: ColeccionDeEstado; i: number; fase: FaseDelViaje; ciudad: string; abierta: boolean; alternar: () => void; cerrarHoja: () => void }): ReactNode {
  const marca = marcaDeColeccion({ fase, completa: c.completa, nuevo: c.nuevo_hoy, enTuRuta: c.en_tu_ruta, ciudad })
  const nuevo = marca.etiqueta === 'nuevo'
  const verdeMarca = marca.etiqueta === 'completa' || marca.etiqueta === 'en_ruta'
  const puedeAbrir = fase !== 'antes'
  const ganados = useMemo(() => c.sitios.filter((s) => s.visto).map((s) => s.sitio), [c.sitios])
  const [pieza, setPieza] = useState<string | null>(null)
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])
  const tocarInsignia = (e: MouseEvent<HTMLSpanElement>) => {
    const caja = e.currentTarget.getBoundingClientRect()
    const k = piezaDeInsignia(c.id, c.sitios.length, (e.clientX - caja.left) / caja.width, (e.clientY - caja.top) / caja.height)
    if (k == null) return
    e.stopPropagation()
    setPieza(c.sitios[k]?.nombre ?? null)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setPieza(null), 2200)
  }
  return (
    <div data-coleccion={c.id} style={{ borderRadius: 20, background: nuevo ? 'oklch(0.55 0.17 5 / .05)' : '#FFFFFF', border: `1px solid ${nuevo ? 'oklch(0.55 0.17 5 / .3)' : 'rgba(28,34,48,.07)'}`, animation: `moPop .4s ${(0.05 + i * 0.04).toFixed(2)}s ease both` }}>
      <div onClick={puedeAbrir ? alternar : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 8px', cursor: puedeAbrir ? 'pointer' : 'default', minHeight: 64 }}>
        <span onClick={tocarInsignia} style={{ width: 64, height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Insignia coleccion={c.id} ganados={ganados} completa={c.completa} tam={64} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0, font: "400 18px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{c.nombre}</span>
            <span style={{ flex: 'none', font: "600 11.5px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{`${c.n} de ${c.total}`}</span>
          </span>
          <div style={{ height: 4, borderRadius: 4, background: 'rgba(28,34,48,.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${c.total > 0 ? (c.n / c.total) * 100 : 0}%`, borderRadius: 4, background: c.completa ? VERDE : c.n ? FRAMBUESA : 'rgba(28,34,48,.18)' }} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
            {pieza ? (
              <span role="status" style={{ height: 22, padding: '0 8px', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "600 11px/22px 'Geist'", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {pieza}
              </span>
            ) : (
              <>
                {marca.texto && <span style={{ height: 22, padding: '0 8px', borderRadius: 999, background: nuevo ? 'oklch(0.55 0.17 5 / .12)' : verdeMarca ? 'oklch(0.96 0.035 150)' : '#F1EADC', color: nuevo ? 'oklch(0.48 0.17 5)' : 'oklch(0.38 0.1 150)', font: "600 11px/22px 'Geist'", whiteSpace: 'nowrap' }}>{marca.texto}</span>}
                {marca.faltaParaOtroViaje && <span style={{ flex: 1, minWidth: 0, font: "500 12px/1.3 'Geist'", color: 'oklch(0.48 0.17 5)' }}>{marca.faltaParaOtroViaje}</span>}
              </>
            )}
            {puedeAbrir && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginLeft: 'auto', transform: abierta ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </span>
        </span>
      </div>
      {abierta && puedeAbrir && (
        <div style={{ margin: '0 12px 10px', padding: '2px 10px', borderRadius: 14, background: '#F5EFE4', animation: 'moPop .3s ease both' }}>
          {c.sitios.map((s, j) => (
            <div key={s.sitio} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, borderBottom: j < c.sitios.length - 1 ? '1px solid rgba(28,34,48,.08)' : 'none' }}>
              <span style={{ width: 22, height: 22, flex: 'none', borderRadius: '50%', background: s.visto ? VERDE : 'transparent', border: s.visto ? 'none' : `1.5px dashed ${s.en_ruta ? 'rgba(28,34,48,.3)' : FRAMBUESA}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 10px 'Geist'" }}>{s.visto ? '✓' : ''}</span>
              <span style={{ flex: 1, minWidth: 0, font: "500 13px/1.3 'Geist'", color: s.visto ? 'oklch(0.36 0.09 150)' : '#1C2230' }}>{s.nombre ?? s.sitio}</span>
              {!s.visto && (
                <button
                  type="button"
                  onClick={() => {
                    if (s.en_ruta) window.open(buildGoogleMapsUrlFromHere(s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : `${s.nombre ?? s.sitio}, ${ciudad}`), '_blank', 'noopener')
                    else {
                      cerrarHoja()
                      useAddFlowStore.getState().openAddFlow(null, s.nombre ?? s.sitio)
                    }
                  }}
                  style={{ flex: 'none', minHeight: 44, padding: '0 11px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 11px', borderRadius: 999, border: s.en_ruta ? '1px solid rgba(28,34,48,.16)' : 'none', background: s.en_ruta ? '#FFFFFF' : '#1C2230', color: s.en_ruta ? '#1C2230' : '#FFFDF8', font: "600 11.5px 'Geist'", whiteSpace: 'nowrap' }}>{s.en_ruta ? 'Cómo llegar' : 'Añadir a mi ruta'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Secretos({ fase, estado, verEscena }: { fase: FaseDelViaje; estado: EstadoLogros; verEscena: (id: string) => void }): ReactNode {
  const { total, encontrados_lista: lista } = estado.secretos
  const titulo = tituloDeSecretos(fase, estado.ciudad, total, lista.length)
  const nota = notaDeSecretos(fase, total, lista.length)
  // Los encontrados van en su sitio de siempre; el resto de los huecos solo llevan un «?» (nunca se dice cuál es cuál).
  const huecos = Math.max(total, ID_EMBLEMAS.length)
  const posicion = (id: string) => ID_EMBLEMAS.indexOf(id)
  const porSitio = new Map<number, (typeof lista)[number]>()
  let extra = ID_EMBLEMAS.length
  for (const e of lista) porSitio.set(posicion(e.id) >= 0 ? posicion(e.id) : extra++, e)
  if (!(total > 0) && lista.length === 0) return null
  return (
    <div data-secretos="1" style={{ marginTop: 6, borderRadius: 24, background: '#1C2230', color: '#FFFDF8', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {titulo && <span style={{ padding: '0 4px', font: "400 22px/1.1 'Instrument Serif',serif" }}>{titulo}</span>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 8px', justifyItems: 'center' }}>
        {Array.from({ length: huecos }, (_, k) => {
          const e = porSitio.get(k)
          const h = FORMA_HUECO[k] ?? FORMA_HUECO[2]!
          return (
            <span key={k} style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {e ? (
                <button type="button" aria-label={`Volver a ver ${e.nombre}`} onClick={() => verEscena(e.id)} style={{ width: 96, height: 96, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Emblema id={e.id} tam={84} animado={false} fecha={e.en ? e.en.slice(0, 10) : null} />
                </button>
              ) : (
                <span aria-hidden style={{ width: h[0], height: h[1], borderRadius: h[2], transform: h[3], background: 'rgba(255,253,248,.06)', border: '1.5px dashed rgba(243,213,154,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ transform: h[3] === 'none' ? 'none' : 'rotate(-45deg)', font: "400 30px/1 'Instrument Serif',serif", color: 'rgba(243,213,154,.6)' }}>?</span>
                </span>
              )}
            </span>
          )
        })}
      </div>
      {nota && <span style={{ padding: '0 4px', font: "italic 400 15px/1.35 'Instrument Serif',serif", color: 'rgba(255,253,248,.7)', textAlign: 'center' }}>{nota}</span>}
    </div>
  )
}

