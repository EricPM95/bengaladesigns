import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { lazyReintentable } from '../../../lib/cargaSegura'
import { useSyncStore } from '../../../store/useSyncStore'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { abrirMapaEnOtraPestana, buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { ICONOS } from '../../../lib/iconos'
import { Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { ORDEN_EMBLEMAS_LANZAROTE, idDeDibujoLanzarote } from '../dibujos/emblemasLanzarote'
import { estadoGuardado, olvidarPeticionDelEstado, pedirEstado, type ColeccionDeEstado, type EstadoLogros } from './api'
import { mismaRespuesta } from '../../../lib/logrosEnCache'
import { BotonDeReclamar } from '../reclamar/Reclamar'
import { TarjetaDeCompanero } from '../companero/Companero'
import { cargarCompanero } from '../../../lib/companero'
import { bannerAntes, etiquetaDeFase, faseDelViaje, lineaDeGrado, marcaDeColeccion, textoDeLoQueQueda, TEXTO_AL_COMPLETAR, type FaseDelViaje } from './hoja/textosHoja'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'
import { usePasePintable } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { Candado } from '../../pase/Candado'
import { ListaDeColeccion } from '../ficha/ListaDeColeccion'
import { SiluetaDeEmblema } from '../dibujos/SiluetaDeEmblema'
import { BloqueDelPase, ColeccionesAntes, LoQueTePuedesLlevar } from './hoja/AntesDelViaje'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { TiradorDeHoja } from '../../ui/TiradorDeHoja'
import { FONDO_DE_HOJA } from '../../ui/fondoDeHoja'
import { BOTON_ORO } from '../../ui/botonesOro'

const EscenaDeEmblema = lazyReintentable(() => import('./EscenaDeEmblema'))

/**
 * LA HOJA DE LOGROS (Tanda 8C2, «Logros · el botón del destino», partes 2, 3 y 4). Lo que abre el botón flotante: antes, durante y después del viaje.
 *   - Arriba, los sellos (Roma en grande y el Vaticano) con su avance y lo que les falta para el siguiente grado.
 *   - Una franja con «Con tu ruta puedes completar N de las 11 colecciones» (antes) o lo que queda para el diamante (después).
 *   - Las colecciones, en el orden del servidor (lo nuevo de hoy, las completas, las de su ruta y las demás): tocar un pedazo dice su nombre, tocar la colección abre sus sitios (con [Cómo llegar]
 *     y [Añadir a mi ruta]).
 *   - Los secretos: nunca se enseñan los que faltan (solo «?»); los encontrados se ven y, al tocarlos, vuelve a ponerse su escena.
 * Nunca enseña un emblema antes de encontrarlo, ni dice cuáles faltan ni dónde están. Todos los números salen de `GET /api/logros/estado`.
 */
const ID_EMBLEMAS = ['coliseo', 'foro_romano', 'panteon', 'fontana_de_trevi', 'museos_vaticanos', 'plaza_san_pedro', 'basilica_san_pedro', 'boca_de_la_verdad', 'ojo_cerradura', 'catacumbas', 'plaza_de_espana', 'castillo_de_santangelo', 'madrugador', 'nocturno']
const UNIDAD_DE_SELLO: Record<string, string> = { roma: 'imprescindibles', lanzarote: 'imprescindibles' }

const ETIQUETA = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' } as const
const FRAMBUESA = 'oklch(0.55 0.17 5)'
const VERDE = 'oklch(0.55 0.11 150)'

export default function HojaLogros(): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  // (V9) Abre AL INSTANTE con lo último que se vio de este viaje (el botón flotante ya lo ha pedido al abrir el viaje); lo nuevo llega por detrás y solo cambia lo que cambie.
  const [estado, setEstado] = useState<EstadoLogros | null>(() => estadoGuardado(tripId))
  const [cargado, setCargado] = useState(false)
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())
  const [escena, setEscena] = useState<string | null>(null)
  // (LZ3b, V3) Al tocar un emblema de Lanzarote sale SU escena (la de Design, directo al sitio, sin frase de suspense) con SU nombre y SU línea, como en Roma.
  const [escenaTexto, setEscenaTexto] = useState<{ nombre: string; linea: string } | null>(null)
  // (V25) Si lo de logros no llega (falla o tarda), la hoja no se queda en el esqueleto para siempre: a los 10 s dice «No se ha podido cargar, vuelve a probar» con [Reintentar] y sigue funcionando con lo que tenga.
  const [intento, setIntento] = useState(0)
  const [tardaMucho, setTardaMucho] = useState(false)
  useEffect(() => {
    let vivo = true
    setCargado(false)
    setTardaMucho(false)
    const reloj = window.setTimeout(() => vivo && setTardaMucho(true), 10000)
    void pedirEstado(tripId).then((e) => {
      if (!vivo) return
      window.clearTimeout(reloj)
      setEstado((prev) => (prev && e && mismaRespuesta(prev, e) ? prev : e ?? prev))
      setCargado(true)
    })
    return () => {
      vivo = false
      window.clearTimeout(reloj)
    }
  }, [tripId, intento])
  // (V15b) La hoja de un viaje pregunta por SU viaje al abrirse (no por el que estuviera activo antes): la tarjeta «Eric consiguió N sitios…» sale de ahí.
  useEffect(() => {
    if (tripId) void cargarCompanero(tripId)
  }, [tripId])
  const cerrar = () => useMomentosUI.getState().cerrarHojaLogros()
  const fase = faseDelViaje(estado?.viaje)
  const etiqueta = estado ? etiquetaDeFase(fase, estado.viaje, estado.ciudad) : null
  const hayViaje = Boolean(estado?.viaje)
  // Tanda 10G: sin el pase, la vitrina y las colecciones se ven, cerradas (en gris), con lo que ganarías; tocarlas abre el pase. [Visto] no suma sin pase, salvo el día de prueba (lo decide el servidor).
  const estadoPase = usePasePintable()
  const sinPase = estadoPase === 'sin'
  // (V25) Antes del viaje, sin pase: la hoja es un juego a la vista y al final VENDE el pase (nada en gris ni bloqueado). Durante y después, como siempre.
  const cerrado = sinPase && fase !== 'antes'

  // (V9) Arriba, las colecciones con algún pedazo (en el orden del servidor); al final, las que están a 0, juntas y plegadas en «Más colecciones de …». Si todas están a 0, sin plegar.
  const [masAbierto, setMasAbierto] = useState(false)
  const conAlgo = estado ? estado.colecciones.filter((c) => c.n > 0 || c.completa) : []
  const aCero = estado ? estado.colecciones.filter((c) => !(c.n > 0 || c.completa)) : []
  const plegar = conAlgo.length > 0 && aCero.length > 0
  const alternar = (id: string) =>
    setAbiertas((a) => {
      const n = new Set(a)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="mo" style={{ position: 'fixed', inset: 0, zIndex: 9000, fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div onClick={cerrar} style={{ position: 'absolute', inset: 0, background: FONDO_DE_HOJA, animation: 'moFade .3s ease both' }} />
      <div role="dialog" aria-modal="true" aria-label="Tus logros" data-hoja-logros={fase} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 64, display: 'flex', flexDirection: 'column', borderRadius: '32px 32px 0 0', background: '#FFFDF8', color: '#1C2230', animation: 'moSube .45s cubic-bezier(.2,.8,.2,1) both' }}>
        <TiradorDeHoja />
        {/* (V14) Lo único fijo es una barra fina con el título y la X: la medalla y el botón de reclamar se mueven con el resto al bajar (antes la cabecera quedaba quieta y tapaba la tarjeta de la medalla). */}
        <div data-barra-de-logros style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 10px 0 20px', borderBottom: '1px solid rgba(28,34,48,.06)' }}>
          <span data-titulo-de-logros style={{ flex: 1, minWidth: 0, font: "400 24px/1.05 'Instrument Serif',serif", letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {estado?.ciudad ? (
              <>
                Tus logros en <em style={{ fontStyle: 'italic', color: '#8A6A2C' }}>{estado.ciudad}</em>
              </>
            ) : (
              'Tus logros'
            )}
          </span>
          <CruzDeHoja enLinea onCerrar={cerrar} />
        </div>
        <div data-cuerpo-de-logros style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '14px 20px calc(env(safe-area-inset-bottom,0px) + 28px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* (LG1, 5-nov) Los colores de «Logros Boton» de Design: la cabecera de fase en frambuesa oklch(0.5 0.17 5) (antes marrón #6F4E37). */}
          {etiqueta && (
            <span data-etiqueta-de-fase style={{ ...ETIQUETA, flex: 'none', alignSelf: 'flex-start', height: 22, padding: '0 10px', borderRadius: 999, background: 'oklch(0.55 0.17 5 / .1)', color: 'oklch(0.48 0.17 5)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 9 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: FRAMBUESA }} />
              {etiqueta}
            </span>
          )}
          {/* (V25) ANTES del viaje no se ha visitado nada: ni [Reclamar con tus fotos], ni «Puedes reclamar hasta…», ni «Yo también estaba». Solo durante y después (hasta el fin del plazo de reclamar). */}
          {!(estado?.viaje && fase === 'antes') && (
            <div data-cabeza-de-logros style={{ flex: 'none', margin: '-8px -20px -6px' }}>
              <BotonDeReclamar ciudad={estado?.ciudad} />
              <TarjetaDeCompanero tripId={tripId} />
            </div>
          )}
          {!estado ? (
            cargado || tardaMucho ? (
              <div data-logros-sin-cargar="1" role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, margin: '28px 0', textAlign: 'center' }}>
                <p style={{ margin: 0, font: "400 15px/1.35 'Geist'", color: 'rgba(28,34,48,.7)' }}>No se ha podido cargar, vuelve a probar.</p>
                <button type="button" data-reintentar-logros onClick={() => {
                    olvidarPeticionDelEstado(tripId)
                    setIntento((n) => n + 1)
                  }} style={{ height: 48, padding: '0 24px', borderRadius: 999, border: 0, cursor: 'pointer', ...BOTON_ORO, font: "700 15px 'Geist'" }}>
                  Reintentar
                </button>
              </div>
            ) : (
              <EsqueletoDeLogros />
            )
          ) : (
            <>
              {cerrado && <Candado datos="logros-sin-pase" destino={estado.ciudad} titulo="Tus logros del viaje" texto="Con el {pase}, cada sitio que ves suma." />}
              <div data-logros-cerrados={cerrado ? '1' : undefined} onClickCapture={cerrado ? (e) => { e.stopPropagation(); e.preventDefault(); abrirAvisoPase('logros', { destino: estado.ciudad }) } : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 18, ...(cerrado ? { filter: 'grayscale(1)', opacity: 0.55, cursor: 'pointer' } : {}), ...(estadoPase === 'pendiente' ? { visibility: 'hidden' as const } : {}) }}>
              {/* (V25) Roma, el Vaticano y lo que haya: la MISMA tarjeta (la oscura y grande), una debajo de otra. */}
              {estado.sellos.map((sello) => (
                <TarjetaDeSello key={sello.id} sello={sello} fase={fase} />
              ))}
              {fase === 'antes' && <LoQueTePuedesLlevar ciudad={estado.ciudad} insignias={estado.colecciones.length} medallas={4} />}
              {fase === 'antes' && <Secretos fase={fase} estado={estado} verEscena={(id, texto) => { setEscenaTexto(texto ?? null); setEscena(id) }} />}
              {fase === 'antes' && <ColeccionesAntes estado={estado} sinPase={sinPase} ciudad={estado.ciudad} destino={estado.destino} cerrarHoja={cerrar} />}
              {fase !== 'antes' && <Franja fase={fase} estado={estado} hayViaje={hayViaje} />}
              {fase !== 'antes' && <div data-colecciones-con-algo="1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(plegar ? conAlgo : estado.colecciones).map((c, i) => (
                  <FilaDeColeccion key={c.id} c={c} i={i} fase={fase} ciudad={estado.ciudad} destino={estado.destino} abierta={abiertas.has(c.id)} alternar={() => alternar(c.id)} cerrarHoja={cerrar} />
                ))}
              </div>}
              {fase !== 'antes' && plegar && (
                <div data-mas-colecciones={masAbierto ? 'abierto' : 'plegado'} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button type="button" aria-expanded={masAbierto} onClick={() => setMasAbierto((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '14px 16px', borderRadius: 18, background: '#F5EFE4', border: '1px solid rgba(28,34,48,.06)', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}>
                    <span style={{ flex: 1, font: "500 14.5px 'Geist'" }}>Más colecciones de {estado.ciudad}</span>
                    <span data-mas-colecciones-n style={{ minWidth: 26, height: 26, padding: '0 8px', borderRadius: 999, background: '#1C2230', color: '#F3D59A', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 12px 'Geist Mono',monospace" }}>{aCero.length}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: masAbierto ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} aria-hidden>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {masAbierto &&
                    aCero.map((c, i) => <FilaDeColeccion key={c.id} c={c} i={i} fase={fase} ciudad={estado.ciudad} destino={estado.destino} abierta={abiertas.has(c.id)} alternar={() => alternar(c.id)} cerrarHoja={cerrar} />)}
                </div>
              )}
              {fase !== 'antes' && <Secretos fase={fase} estado={estado} verEscena={(id, texto) => { setEscenaTexto(texto ?? null); setEscena(id) }} />}
              </div>
              {/* (V25) Sin pase y antes del viaje: la hoja vende el pase (el precio sale del servidor). Con pase, la misma hoja sin este bloque. */}
              {fase === 'antes' && sinPase && <BloqueDelPase ciudad={estado.ciudad} secretos={estado.secretos.total} />}
              {fase === 'despues' && (
                <button
                  type="button"
                  onClick={() => {
                    cerrar()
                    useMomentosUI.getState().abrirResumenViaje()
                  }}
                  data-ver-resumen-del-viaje
                  style={{ flex: 'none', position: 'relative', overflow: 'hidden', width: '100%', height: 52, minHeight: 52, marginTop: 4, border: 'none', borderRadius: 999, background: '#1C2230', boxShadow: '0 14px 24px -14px rgba(28,34,48,.8), inset 0 0 0 1.5px rgba(243,213,154,.55)', color: '#FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, font: "600 15px 'Geist'", cursor: 'pointer' }}
                >
                  <span aria-hidden="true" style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: 'linear-gradient(140deg,#F8E7BC,#C99A4C)', color: '#2A1D10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2zM9 9h6M9 13h6" />
                    </svg>
                  </span>
                  Ver el resumen del viaje
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F3D59A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {escena && (
        <Suspense fallback={null}>
          <EscenaDeEmblema id={escena} primeraVez={false} nombre={escenaTexto?.nombre ?? null} linea={escenaTexto?.linea ?? null} onSeguir={() => { setEscena(null); setEscenaTexto(null) }} />
        </Suspense>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

/** (V9) El esqueleto gris de siempre (sin texto) para la primera vez en un móvil nuevo: la forma de la hoja con los huecos en gris claro. */
function EsqueletoDeLogros(): ReactNode {
  const hueco = (h: number, r = 18): ReactNode => <span aria-hidden="true" style={{ display: 'block', height: h, borderRadius: r, background: 'rgba(28,34,48,.07)' }} />
  return (
    <div data-logros-cargando="1" aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {hueco(150, 22)}
      {hueco(64, 20)}
      {hueco(64, 20)}
      {hueco(64, 20)}
    </div>
  )
}

function TarjetaDeSello({ sello, fase }: { sello: EstadoLogros['sellos'][number]; fase: FaseDelViaje }): ReactNode {
  const grado = sello.grado
  const siguiente = sello.siguiente ? { grado: sello.siguiente.grado, faltan: sello.siguiente.faltan } : null
  // (V9) UNA sola tarjeta con la medalla, su barra y lo que queda: «Te quedan 2 para la plata · 6 para el diamante» (después del viaje y durante); antes, «Empieza en bronce».
  const texto = textoDeLoQueQueda({ fase, grado, siguiente, n: sello.n, total: sello.total, alCompletar: TEXTO_AL_COMPLETAR[sello.id] ?? null })
  const pct = sello.total > 0 ? (sello.n / sello.total) * 100 : 0
  // (V25) Sin grado, el título dice lo que viene («Empieza en bronce: 1 sitio»); el «Por conseguir» ya está en la línea de arriba (nunca dos veces) y debajo no se repite.
  const tituloSello = sello.nombre_grado ?? (siguiente ? `Empieza en ${siguiente.grado}${siguiente.faltan > 0 ? `: ${siguiente.faltan} ${siguiente.faltan === 1 ? 'sitio' : 'sitios'}` : ''}` : 'Por conseguir')
  const textoDebajo = grado ? texto : null
  {
    return (
      <div data-sello={sello.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, background: 'radial-gradient(120% 140% at 0% 0%,#3A3F5C 0%,#232840 45%,#1C2230 100%)', border: '1px solid rgba(243,213,154,.35)', boxShadow: '0 16px 28px -18px rgba(28,34,48,.8)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, color: '#FFFDF8' }}>
        <span style={{ position: 'relative', zIndex: 1, flex: 'none', ...(grado ? { opacity: 1 } : { filter: 'grayscale(.4) sepia(.3) saturate(1.2)', opacity: 0.9 }) }}>
          <Sello id={sello.id} grado={(grado ?? 'bronce') as GradoDeSello} apagado={!grado} tam={84} animado={false} etiqueta />
        </span>
        <span aria-hidden="true" style={{ position: 'absolute', left: -30, top: -50, width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle,rgba(243,213,154,.22),transparent 68%)' }} />
        <span style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#F3D59A' }}>{lineaDeGrado(grado, sello.n, sello.total, UNIDAD_DE_SELLO[sello.id] ?? 'sitios')}</span>
          <span data-sello-titulo style={{ font: "400 23px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>{tituloSello}</span>
          <span style={{ height: 5, borderRadius: 5, background: 'rgba(255,253,248,.16)', overflow: 'hidden', marginTop: 2 }}>
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 5, background: 'linear-gradient(90deg,#E4C58A,#F8E7BC)', animation: 'moGrow 1.1s .4s cubic-bezier(.3,0,.2,1) both' }} />
          </span>
          {textoDebajo && <span data-sello-texto style={{ font: "400 12.5px/1.3 'Geist'", color: 'rgba(255,253,248,.82)' }}>{textoDebajo}</span>}
        </span>
      </div>
    )
  }
}

function Franja({ fase, estado, hayViaje }: { fase: FaseDelViaje; estado: EstadoLogros; hayViaje: boolean }): ReactNode {
  const texto = fase === 'antes' ? (hayViaje ? bannerAntes(estado.con_tu_ruta_puedes_completar, estado.colecciones.length) : null) : null
  if (!texto) return null
  const verde = fase === 'antes'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 18, background: verde ? 'oklch(0.96 0.035 150)' : '#F5EFE4', border: `1px solid ${verde ? 'oklch(0.55 0.11 150 / .3)' : 'rgba(28,34,48,.08)'}` }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={verde ? 'oklch(0.42 0.09 150)' : '#A67C52'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden>
        <path d={verde ? ICONOS.ruta : 'M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z'} />
      </svg>
      <span style={{ flex: 1, font: "500 13.5px/1.35 'Geist'", textWrap: 'pretty' as never }}>{texto}</span>
    </div>
  )
}

function FilaDeColeccion({ c, i, fase, ciudad, destino, abierta, alternar, cerrarHoja }: { c: ColeccionDeEstado; i: number; fase: FaseDelViaje; ciudad: string; destino: string; abierta: boolean; alternar: () => void; cerrarHoja: () => void }): ReactNode {
  const marca = marcaDeColeccion({ fase, completa: c.completa, nuevo: c.nuevo_hoy, enTuRuta: c.en_tu_ruta, ciudad })
  const nuevo = marca.etiqueta === 'nuevo'
  const verdeMarca = marca.etiqueta === 'completa' || marca.etiqueta === 'en_ruta'
  const puedeAbrir = true // (V25) Se abre al tocarla también antes del viaje.
  const ganados = useMemo(() => c.sitios.filter((s) => s.visto).map((s) => s.sitio), [c.sitios])
  return (
    <div data-coleccion={c.id} style={{ borderRadius: 22, background: '#FFFDF8', border: `1px solid ${nuevo ? 'oklch(0.55 0.17 5 / .3)' : 'rgba(28,34,48,.08)'}`, boxShadow: '0 8px 20px -16px rgba(28,34,48,.35)', animation: `moPop .4s ${(0.05 + i * 0.04).toFixed(2)}s ease both` }}>
      <div onClick={puedeAbrir ? alternar : undefined} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px 10px 10px', cursor: puedeAbrir ? 'pointer' : 'default', minHeight: 76 }}>
        <span style={{ width: 76, height: 76, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Insignia coleccion={c.id} ganados={ganados} completa={c.completa} tam={76} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
            <span style={{ flex: 1, minWidth: 0, font: "400 19px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{c.nombre}</span>
            {/* (V25) Fuera la etiqueta negra con el nombre de un sitio (salía al tocar un trozo de la insignia). */}
            {marca.texto && <span style={{ flex: 'none', height: 20, padding: '0 8px', borderRadius: 999, background: nuevo ? 'oklch(0.55 0.17 5 / .12)' : verdeMarca ? 'oklch(0.96 0.035 150)' : '#F1EADC', color: nuevo ? 'oklch(0.48 0.17 5)' : 'oklch(0.38 0.1 150)', font: nuevo ? "600 10px/20px 'Geist Mono',monospace" : "600 11px/20px 'Geist'", letterSpacing: nuevo ? '.08em' : 0, whiteSpace: 'nowrap', textTransform: nuevo ? 'uppercase' : 'none' }}>{nuevo ? 'Hoy' : marca.texto}</span>}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, height: 5, borderRadius: 5, background: 'rgba(28,34,48,.09)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${c.total > 0 ? (c.n / c.total) * 100 : 0}%`, borderRadius: 5, background: c.completa ? VERDE : c.n ? FRAMBUESA : 'rgba(28,34,48,.18)' }} />
            </span>
            <span style={{ flex: 'none', font: "500 12px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{`${c.n} de ${c.total}`}</span>
          </span>
        </span>
        {puedeAbrir && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: abierta ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </div>
      {abierta && puedeAbrir && (
        <div data-lista-abierta={c.id} style={{ margin: '0 12px 10px', padding: '8px 8px 2px', borderRadius: 14, background: '#F5EFE4', animation: 'moPop .3s ease both' }}>
          {/* (V14) La lista se queda al tocar la colección (✓ lo que tienes, ○ lo que falta) y, al final, [Ver la colección ›] abre la pantalla de la colección. */}
          <ListaDeColeccion
            destino={destino}
            coleccion={c.id}
            ciudad={ciudad}
            sitios={c.sitios.map((s) => ({ sitio: s.sitio, nombre: s.nombre ?? s.sitio, visto: s.visto }))}
            antesDeVer={cerrarHoja}
            accion={(x) => {
              const s = c.sitios.find((y) => y.sitio === x.sitio)
              if (!s || s.visto || fase === 'despues') return null
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (s.en_ruta) abrirMapaEnOtraPestana(buildGoogleMapsUrlFromHere(s.lat != null && s.lng != null ? `${s.lat},${s.lng}` : `${s.nombre ?? s.sitio}, ${ciudad}`))
                    else {
                      cerrarHoja()
                      useAddFlowStore.getState().openAddFlow(null, s.nombre ?? s.sitio)
                    }
                  }}
                  style={{ flex: 'none', minHeight: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', height: 32, padding: '0 11px', borderRadius: 999, border: s.en_ruta ? '1px solid rgba(28,34,48,.16)' : 'none', background: s.en_ruta ? '#FFFFFF' : '#1C2230', color: s.en_ruta ? '#1C2230' : '#FFFDF8', font: "600 11.5px 'Geist'", whiteSpace: 'nowrap' }}>{s.en_ruta ? 'Cómo llegar' : 'Añadir a mi ruta'}</span>
                </button>
              )
            }}
          />
        </div>
      )}
    </div>
  )
}

function Secretos({ fase, estado, verEscena }: { fase: FaseDelViaje; estado: EstadoLogros; verEscena: (id: string, texto?: { nombre: string; linea: string }) => void }): ReactNode {
  const { total, encontrados_lista: lista } = estado.secretos
  // Los encontrados van en su sitio de siempre; el resto de los huecos solo llevan una silueta con «?» (nunca se dice cuál es cuál).
  // (LZ3) Lanzarote tiene sus 11 emblemas, en su orden y con su dibujo (ids «lz_…»; V3: cada uno con su escena, que se abre al tocarlo).
  const lanza = estado.destino === 'lanzarote'
  const ORDEN = lanza ? ORDEN_EMBLEMAS_LANZAROTE : ID_EMBLEMAS
  const huecos = lanza ? ORDEN.length : Math.max(total, ID_EMBLEMAS.length)
  const posicion = (id: string) => ORDEN.indexOf(id)
  const porSitio = new Map<number, (typeof lista)[number]>()
  let extra = ORDEN.length
  for (const e of lista) porSitio.set(posicion(e.id) >= 0 ? posicion(e.id) : extra++, e)
  if (!(total > 0) && lista.length === 0) return null
  void fase
  return (
    <div data-secretos="1" style={{ marginTop: 6, borderRadius: 20, background: 'radial-gradient(120% 100% at 50% 0%,#2A3050 0%,#1C2230 70%)', color: '#FFFDF8', padding: '14px 0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span data-titulo-secretos style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#F3D59A', textTransform: 'uppercase' }}>{`${lista.length} de ${Math.max(total, lista.length)} ${Math.max(total, lista.length) === 1 ? 'secreto encontrado' : 'secretos encontrados'}`}</span>
      <div data-rejilla-de-emblemas style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', padding: '2px 14px 4px 0', scrollbarWidth: 'none', touchAction: 'pan-x', overscrollBehavior: 'contain' }}>
        {Array.from({ length: huecos }, (_, k) => {
          const e = porSitio.get(k)
          return (
            <span key={k} style={{ flex: 'none', width: 66, height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {e && lanza ? (
                <button type="button" aria-label={`Volver a ver ${e.nombre}`} onClick={() => verEscena(idDeDibujoLanzarote(e.id), { nombre: e.nombre, linea: e.linea })} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Emblema id={idDeDibujoLanzarote(e.id)} tam={66} animado={false} />
                </button>
              ) : e ? (
                <button type="button" aria-label={`Volver a ver ${e.nombre}`} onClick={() => verEscena(e.id)} style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Emblema id={e.id} tam={66} animado={false} fecha={e.en ? e.en.slice(0, 10) : null} />
                </button>
              ) : (
                <SiluetaDeEmblema k={k} tam={66} />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
