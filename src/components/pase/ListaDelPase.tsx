import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import textos from '../../../data/pase/textos.json'
import { configDelPase, crearPagoDelPase, irAPagar, type ConfigPase } from '../../lib/pagoPase'
import { usePaseEstado } from '../../lib/paseEstado'
import { nombreDeMoneda } from '../../lib/dinero'
import { guardarMoneda, monedaGuardada, monedaUsable } from '../../lib/precioMoneda'
import { hojaCuantosSois } from '../../lib/precioPelicula'
import { monedaDelViajero, useCambio } from '../../lib/useMoneda'
import { monedaElegida } from '../../lib/moneda'
import { nombreDelPase } from '../../lib/nombrePase'
import { useRouteStore } from '../../store/useRouteStore'
import { SECCIONES_DE_LA_LISTA } from './lista/disenoLista'

/**
 * LA LISTA DEL PASE POR PUNTOS (Tanda 10N11, apartado 5; `Piezas/Pase Lista` de Design, pantalla 1). Antes (10N10) era la última escena de la película; ahora es un componente propio, fiel al diseño y sin el código de la película
 * (los dibujos y los textos salen de `lista/disenoLista.ts`, que genera `scripts/destino/generarPaseLista.mjs` desde la pieza de Design). Lo abre SIEMPRE todo lo que antes abría la película (`abrirPase()`: la pastilla de RUTA, el aviso del pase, las cajas, los candados…).
 *   · `desde="lista"`: la lista; `"compra"`: la lista con «¿Cuántos sois?» ya abierta.
 *   · Los precios (los tres de la lista y los de «¿Cuántos sois?») son los de la app (data/pase/precios.json, que da el servidor); [Elegir mi pase] abre «¿Cuántos sois?» y [Comprar] crea el pago como siempre.
 *   · Con el pase comprado: «✓ Tu Pase Roma está activo», sin precios ni botón fijo. El ✕ cierra y vuelve a donde se estaba.
 */
const ORO = '#E9C77A'
const CREMA = '#FBF3E2'
const FILETE = 'rgba(233,199,122,.14)'
const BOTON_ORO: CSSProperties = {
  background: 'linear-gradient(135deg,#F7E8BC,#D9BC74 52%,#B58A2E)',
  color: '#3A2A0A',
  boxShadow: '0 14px 26px -12px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.6)',
}
const MONO = "'Geist Mono',monospace"
const SERIF = "'Instrument Serif',serif"

const Dibujo = ({ svg }: { svg: string }) => <span aria-hidden="true" style={{ display: 'flex' }} dangerouslySetInnerHTML={{ __html: svg }} />

function Marcado({ texto, destino }: { texto: string; destino: string }) {
  // Donde Design dice «Roma» va el destino del viaje abierto.
  return <>{texto.replace(/Roma/g, destino)}</>
}

export function ListaDelPase({ destino, tripId, desde, onCerrar, configInicial = null }: { destino: string; tripId: string | null; desde: 'lista' | 'compra'; onCerrar: () => void; configInicial?: ConfigPase | null }) {
  const [config, setConfig] = useState<ConfigPase | null>(configInicial)
  const [error, setError] = useState<string | null>(null)
  const route = useRouteStore((st) => st.route)
  const cambio = useCambio()
  const [codigoMoneda, setCodigoMoneda] = useState<string>(() => monedaElegida() ?? monedaGuardada() ?? monedaDelViajero(route))
  const moneda = monedaUsable(codigoMoneda, cambio?.tasas)
  const [hoja, setHoja] = useState<'' | 'buy' | 'cur'>(desde === 'compra' ? 'buy' : '')
  const [n, setN] = useState(4)
  const pase = usePaseEstado(tripId)
  const ocupado = useRef(false)

  useEffect(() => {
    if (configInicial) return undefined
    let vivo = true
    void configDelPase().then((c) => {
      if (vivo) setConfig(c)
    })
    return () => {
      vivo = false
    }
  }, [configInicial])

  const planes = config?.precios?.planes ?? []
  const nombre = nombreDelPase(destino)
  const conPase = pase.conPase

  const comprar = async (plan: 'uno' | 'duo' | 'grupo', personas: number) => {
    if (ocupado.current || planes.length === 0) return
    ocupado.current = true
    setError(null)
    const r = await crearPagoDelPase({ destino, plan, personas, tripId })
    if (r.url) {
      irAPagar(r.url)
      return // (la app sale a la página de pago; al volver, PagoHost recoge el resultado)
    }
    ocupado.current = false
    setError(r.error)
  }

  const cuantos = hojaCuantosSois(planes, n, moneda)

  const monedas = ['EUR', ...Object.keys(cambio?.tasas ?? {}).sort()]
  if (codigoMoneda && !monedas.includes(codigoMoneda)) monedas.unshift(codigoMoneda)
  const activa = moneda?.codigo ?? 'EUR'
  // La elegida arriba del todo (con su borde de oro), luego el euro y el resto por orden.
  monedas.sort((x, y) => (x === activa ? -1 : y === activa ? 1 : x === 'EUR' ? -1 : y === 'EUR' ? 1 : x.localeCompare(y)))

  const botonX: CSSProperties = { width: 32, height: 32, borderRadius: '50%', background: 'rgba(28,34,48,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 0, padding: 0 }
  const redondo: CSSProperties = { width: 42, height: 42, borderRadius: '50%', background: '#FFFDF8', border: '1px solid rgba(28,34,48,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 24px/1 'Geist'", cursor: 'pointer', color: '#1C2230' }

  return createPortal(
    <div data-lista-del-pase={desde} data-moneda={moneda?.codigo ?? 'EUR'} role="dialog" aria-modal="true" aria-label={nombre} style={{ position: 'fixed', inset: 0, zIndex: 400, color: CREMA, fontFamily: "'Geist',sans-serif" }}>
      {/* El fondo de Design: degradado azul oscuro con el halo de oro arriba a la izquierda. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1B2240 0%,#12172D 38%,#0C1020 100%)' }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: -60, top: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(233,199,122,.22),transparent 68%)' }} />
      <div data-lista-pase="1" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 'calc(env(safe-area-inset-top, 0px) + 56px)', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto', paddingBottom: 'max(34px, env(safe-area-inset-bottom))' }}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 26px 14px', textAlign: 'center' }}>
            <span style={{ font: `400 35px/1.04 ${SERIF}`, color: CREMA, textShadow: '0 0 24px rgba(233,199,122,.28)' }}>
              Todo lo que incluye tu <span style={{ color: ORO }}>{`Pase ${destino}`}</span>
            </span>
            {!conPase && <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(251,243,226,.7)' }}>Se paga una vez · No caduca</span>}
            <span style={{ width: 70, height: 1, marginTop: 4, background: `linear-gradient(90deg,transparent,${ORO},transparent)` }} />
          </div>

          <div style={{ position: 'relative', padding: '0 22px', display: 'flex', flexDirection: 'column' }}>
            {SECCIONES_DE_LA_LISTA.map((s) => (
              <div key={s.titulo} data-lista-seccion={s.titulo} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 4px' }}>
                  <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(233,199,122,.55))' }} />
                  <span style={{ font: `600 10.5px ${MONO}`, letterSpacing: '.2em', color: ORO, whiteSpace: 'nowrap' }}>{s.titulo}</span>
                  <span style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,transparent,rgba(233,199,122,.55))' }} />
                </div>
                {s.filas.map((f) => (
                  <div key={f.titulo} data-lista-punto={f.titulo} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '15px 0', borderTop: `1px solid ${FILETE}` }}>
                    <span style={{ width: 66, height: 66, flex: 'none', borderRadius: '50%', background: 'radial-gradient(circle at 35% 28%,#FFFDF8,#F3E3B2 70%,#E3C77E)', boxShadow: '0 0 0 1.5px #E9C77A,0 0 0 6px rgba(233,199,122,.16),0 10px 18px -8px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Dibujo svg={f.icono} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ font: `400 22px/1.08 ${SERIF}`, color: CREMA }}>
                        <Marcado texto={f.titulo} destino={destino} />
                      </span>
                      <span style={{ font: "400 13.5px/1.4 'Geist'", color: 'rgba(251,243,226,.66)' }}>
                        <Marcado texto={f.linea} destino={destino} />
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {conPase ? (
              <span data-pase-activo="1" style={{ marginTop: 22, minHeight: 58, borderRadius: 18, background: 'rgba(43,127,69,.2)', border: '1px solid #4FAE6B', color: '#8EDBA3', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 14px', font: "600 15px 'Geist'" }}>{`✓ Tu ${nombre} está activo`}</span>
            ) : (
              <span aria-hidden="true" data-lista-espacio-boton="1" style={{ height: 'calc(58px + 28px + env(safe-area-inset-bottom, 0px))', flex: 'none' }} />
            )}
          </div>
        </div>
      </div>

      {/* (Tanda 10S §1) Franja de cabecera: la lista se desplaza debajo de ella (el scroll empieza bajo la ✕), así la ✕ nunca pisa texto. */}
      <div aria-hidden="true" data-lista-franja-fundido="1" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(env(safe-area-inset-top, 0px) + 56px)', height: 14, background: 'linear-gradient(180deg,rgba(26,33,62,1),rgba(26,33,62,0))', zIndex: 9, pointerEvents: 'none' }} />
      {!conPase && (
        <div data-elegir-pase-fijo="1" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8, padding: '34px 22px max(16px, env(safe-area-inset-bottom))', background: 'linear-gradient(180deg,rgba(12,16,32,0),rgba(12,16,32,.92) 55%)', pointerEvents: 'none' }}>
          <span role="button" tabIndex={0} data-elegir-pase="1" onClick={() => setHoja('buy')} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setHoja('buy')} style={{ ...BOTON_ORO, pointerEvents: 'auto', maxWidth: 436, margin: '0 auto', height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 16.5px 'Geist'", cursor: 'pointer' }}>
            Elegir mi pase
          </span>
        </div>
      )}
    <button className="zona-toque"
      type="button"
      onClick={onCerrar}
      aria-label="Cerrar"
      data-pelicula-cerrar="1"
      style={{ position: 'absolute', zIndex: 10, right: 18, top: 'calc(env(safe-area-inset-top, 0px) + 12px)', width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(233,199,122,.6)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CREMA} strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
      {hoja && !conPase && (
        <>
          <div onClick={() => setHoja('')} style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,5,.6)', zIndex: 15 }} />
          <div data-hoja-cuantos-sois="1" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 16, maxWidth: 480, margin: '0 auto', borderRadius: '30px 30px 0 0', background: CREMA, color: '#1C2230', padding: '14px 20px max(26px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 -20px 40px rgba(0,0,0,.35)', maxHeight: '88%', overflowY: 'auto' }}>
            <span style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: `400 28px/1 ${SERIF}` }}>{hoja === 'cur' ? 'Moneda' : '¿Cuántos sois?'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {hoja === 'buy' && (
                  <span className="zona-toque" role="button" onClick={() => setHoja('cur')} style={{ height: 32, padding: '0 11px 0 13px', borderRadius: 999, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.5)', display: 'flex', alignItems: 'center', gap: 5, font: `700 12.5px ${MONO}`, letterSpacing: '.04em', color: '#6E5018', cursor: 'pointer' }}>
                    {activa}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                )}
                <button type="button" aria-label="Cerrar" onClick={() => (hoja === 'cur' ? setHoja('buy') : setHoja(''))} style={botonX}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C2230" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>
            </div>

            {hoja === 'cur' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '2px 2px 16px' }}>
                {monedas.map((k) => (
                  <div
                    key={k}
                    role="button"
                    data-moneda-opcion={k}
                    onClick={() => {
                      setCodigoMoneda(k)
                      guardarMoneda(k)
                      setHoja('buy')
                    }}
                    style={{ borderRadius: 16, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: k === activa ? '#FBF3E2' : '#FFFDF8', border: k === activa ? '2px solid #B58A2E' : '1px solid rgba(28,34,48,.12)' }}
                  >
                    <b style={{ font: `700 14px ${MONO}`, minWidth: 42 }}>{k}</b>
                    <span style={{ flex: 1, font: "500 14.5px 'Geist'" }}>{nombreDeMoneda(k)}</span>
                    {k === activa && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E6820" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '2px 0 6px' }}>
                  <span role="button" aria-label="Menos" onClick={() => setN(Math.max(1, n - 1))} style={redondo}>
                    −
                  </span>
                  <span style={{ minWidth: 90, textAlign: 'center', font: `400 40px/1 ${SERIF}` }}>{cuantos.personasTxt}</span>
                  <span role="button" aria-label="Más" onClick={() => setN(Math.min(cuantos.hasta, n + 1))} style={redondo}>
                    +
                  </span>
                </div>
                {cuantos.filas.map((f, k) => (
                  <div
                    key={f.plan}
                    role="button"
                    onClick={() => setN(k === 0 ? 1 : k === 1 ? 2 : Math.max(cuantos.desde, n))}
                    style={{ borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: k === cuantos.elegida ? '#FBF3E2' : '#FFFDF8', border: k === cuantos.elegida ? '2px solid #B58A2E' : '1px solid rgba(28,34,48,.12)' }}
                  >
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <b style={{ font: "600 14.5px 'Geist'" }}>{f.t}</b>
                      <span style={{ font: "600 12px 'Geist'", color: '#6F4E37' }}>{f.sub}</span>
                      {f.save && <span style={{ font: "600 11.5px 'Geist'", color: '#2B7F45' }}>{f.save}</span>}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flex: 'none' }}>
                      {f.old && <s style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.45)' }}>{f.old}</s>}
                      <b style={{ font: `400 21px/1.1 ${SERIF}`, whiteSpace: 'nowrap' }}>{f.p}</b>
                      {moneda && (
                        <span style={{ font: "500 11px 'Geist'", color: 'rgba(28,34,48,.5)', whiteSpace: 'nowrap' }}>
                          {f.old && <s>{f.olde}</s>} {f.pe}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {textos.linea_legal_compra && (
                  <p data-linea-legal="1" style={{ margin: 0, padding: '7px 10px', borderRadius: 10, background: 'rgba(28,34,48,.05)', font: "400 11.5px/1.4 'Geist'", color: 'rgba(28,34,48,.7)' }}>
                    {textos.linea_legal_compra}
                  </p>
                )}
                <span role="button" data-comprar="1" onClick={() => void comprar(cuantos.plan, cuantos.personas)} style={{ height: 50, borderRadius: 15, background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 15px 'Geist'", cursor: 'pointer', boxShadow: '0 10px 20px -12px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }}>
                  {cuantos.comprarTxt}
                </span>
                <span style={{ textAlign: 'center', font: "400 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>Se paga una vez y no caduca</span>
              </div>
            )}
          </div>
        </>
      )}
      {error && (
        <p role="alert" data-error-compra style={{ position: 'absolute', left: 16, right: 16, bottom: 'max(16px, env(safe-area-inset-bottom))', zIndex: 30, margin: 0, padding: '10px 14px', borderRadius: 14, background: '#FBF3E2', color: '#B3261E', font: "500 13px/1.4 'Geist'", textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>,
    document.body,
  )
}
