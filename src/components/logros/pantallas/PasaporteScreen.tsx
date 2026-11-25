import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flagDots } from '../../../lib/flagColors'
import { empezarViajeNuevo } from '../../../lib/nuevoViaje'
import { mismaRespuesta } from '../../../lib/logrosEnCache'
import { fechaLarga } from '../../../lib/reclamar'
import { abrirGaleriaDeReclamo } from '../reclamar/Reclamar'
import { usePerfilUi } from '../../../store/usePerfilUi'
import { Capa } from './Capa'
import { Globo, type Marca, type Objetivo, type Relleno } from './mundo/Globo'
import { pasaporteGuardado, pedirPasaporte, type PaginaDePasaporte, type RespuestaPasaporte, type SelloDePagina, type ViajeSinSello } from './mundo/api'
import { zoomParaPais } from './mundo/proyeccion'
import { mapaDeVisitados } from './mundo/mapaDeVisitados'
import { useMiNombreYFoto } from '../../../store/useMiPerfil'
import { reducirMovimiento, sinTildes, usePaisesYTierra, type Pais } from './mundo/paises'
import { SelloPasaporte } from './mundo/SelloPasaporte'
import { aspectoDeSello, fechaDeSello } from './mundo/selloDatos'
import './mundo/mundo.css'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { marcarSelloEstampado, selloYaEstampado } from '../../../lib/selloEstampado'
import { prepararSonido, sonar } from '../../../lib/sonidos'
import { TiradorDeHoja } from '../../ui/TiradorDeHoja'

const BURDEOS = 'linear-gradient(150deg,#7A2034,#4A1220 60%,#36101A)'
const ORO = 'oklch(0.8 0.14 70)'
const SUAVES = ['oklch(0.74 0.14 65)', 'oklch(0.68 0.12 150)', 'oklch(0.66 0.1 240)', 'oklch(0.66 0.1 300)', 'oklch(0.72 0.13 35)', 'oklch(0.68 0.1 195)']
/** (V14) Cada página del pasaporte lleva 3 sellos, como en uno de verdad: el 1.º arriba a la izquierda, el 2.º arriba a la derecha y el 3.º abajo en el centro, cada uno un poco girado. */
export const SELLOS_POR_PAGINA = 3
/** (V14) Cada sello mide ~45 % del ancho de la página (llenan la página, sin salirse ni taparse más que en las puntas). */
export const tamDeSello = (ancho: number): number => Math.round(ancho * 0.45)
/** Dónde cae cada sello de la página: x, y (con el ancho de la página) y giro. */
export function huecoDeSello(i: number, ancho: number): { x: number; y: number; r: number } {
  const tam = tamDeSello(ancho)
  if (i === 0) return { x: 10, y: 4, r: -8 }
  if (i === 1) return { x: Math.max(0, ancho - tam - 10), y: 20, r: 7 }
  return { x: Math.max(0, (ancho - tam) / 2), y: Math.min(146, 326 - tam - 6), r: -4 }
}
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const realesDe = (p: PaginaDePasaporte) => p.sellos.filter((s) => !s.vacio)
/** (V11) Dónde está cada destino (el punto de cada viaje en el globo). */
const COORDENADAS_DE_DESTINO: Record<string, { lat: number; lng: number }> = { roma: { lat: 41.9, lng: 12.5 }, lanzarote: { lat: 29.0, lng: -13.6 } }

function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * (V12) Adónde mira el globo al abrir la página de un país: a su centro de siempre, salvo si el viaje de esa página está MUY lejos de ese centro (Lanzarote, en las Canarias, a más de 1.000 km del centro de España):
 * entonces se acerca a la ciudad del viaje, para que se vean las islas.
 */
function puntoDeLaPagina(p: PaginaDePasaporte, c: Pais): { lat: number; lng: number; z: number } {
  const lejos = p.sellos
    .filter((s) => !s.vacio && COORDENADAS_DE_DESTINO[s.destino])
    .map((s) => COORDENADAS_DE_DESTINO[s.destino])
    .find((d) => distanciaKm(c, d) > 1000)
  return lejos ? { lat: lejos.lat, lng: lejos.lng, z: zoomParaPais(true) } : { lat: c.lat, lng: c.lng, z: zoomParaPais(c.p === 1) }
}

/** Qué dice cada país en la lista. */
function textoDeLista(p: PaginaDePasaporte): string {
  if (p.estado === 'recuerdo') return 'antes de la app'
  if (p.estado === 'por_conseguir') return `${plural(p.sellos.length, 'sello', 'sellos')} por conseguir`
  const n = realesDe(p).length
  return n ? plural(n, 'sello', 'sellos') : 'sin sello aún'
}

const Banderita = ({ iso, ancho = 26 }: { iso: string | null; ancho?: number }): ReactNode => {
  const [a, b, c] = flagDots(iso)
  return (
    <span aria-hidden="true" style={{ width: ancho, height: Math.round((ancho * 18) / 26), flex: 'none', borderRadius: 3, overflow: 'hidden', display: 'flex', boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.15)' }}>
      <span style={{ flex: 1, background: a }} />
      <span style={{ flex: 1, background: b }} />
      <span style={{ flex: 1, background: c }} />
    </span>
  )
}

/** Dónde se pone cada sello de la página `sub` (3 por página; el primero, arriba a la izquierda, aunque sea el único). */
function colocar(sellos: SelloDePagina[], sub: number, ancho: number): Array<{ s: SelloDePagina; x: number; y: number; r: number; tam: number }> {
  return sellos.slice(sub * SELLOS_POR_PAGINA, sub * SELLOS_POR_PAGINA + SELLOS_POR_PAGINA).map((s, i) => ({ s, ...huecoDeSello(i, ancho), tam: tamDeSello(ancho) }))
}

/**
 * MI PASAPORTE (Tanda 8C2; P2, P2l, P2v, P2i2, P2m y P2e del Perfil de Design): el globo de «Tu mundo» arriba, el pasaporte abierto debajo con una página por país (sus sellos de
 * viaje, 4 por página), la lista de países en una hoja, el Vaticano como página aparte, «Por conseguir» en gris y el sello que se estampa al acabar un viaje. `pagina`:
 * un país («Italia»), un país y su página de sellos («Italia:2»), «lista» (abre la lista) o «sello:<id del viaje>» (estampa el sello de ese viaje).
 */
export default function PasaporteScreen({ pantalla, ejemplo }: { pantalla: PantallaDe<'pasaporte'>; /** (V36C) Solo el estudio de sonidos: un pasaporte de EJEMPLO (no pide nada al servidor ni apunta ningún sello como estampado). */ ejemplo?: RespuestaPasaporte }): ReactNode {
  const { paises: catalogo, tierra } = usePaisesYTierra(true)
  // (V11) Abre AL INSTANTE con lo último que se vio del pasaporte (países, sellos y el globo); lo nuevo llega por detrás y solo cambia lo que cambie.
  const [datos, setDatos] = useState<RespuestaPasaporte | 'error' | null>(() => ejemplo ?? pasaporteGuardado())
  const [idx, setIdx] = useState(0)
  const [sub, setSub] = useState(0)
  const [lista, setLista] = useState(false)
  const [aviso, setAviso] = useState<SelloDePagina | null>(null)
  const [cubierta, setCubierta] = useState(pantalla.pagina === undefined && !reducirMovimiento())
  const [objetivo, setObjetivo] = useState<Objetivo | undefined>(undefined)
  const [estampar, setEstampar] = useState<string | null>(null)
  const [sinSello, setSinSello] = useState<ViajeSinSello | null>(null)
  const [golpe, setGolpe] = useState(0)
  const sembrado = useRef(false)
  const reducido = reducirMovimiento()
  // (10P, 1.8) «Pasaporte de {nombre}» y un mapa MUCHO más grande: ocupa casi todo el ancho del móvil (346 px en un iPhone de 390; el del diseño P2) en vez de los 254 de antes.
  const yo = useMiNombreYFoto()
  const lado = Math.max(220, Math.min(322, (typeof window !== 'undefined' ? window.innerWidth : 390) - 44))

  useEffect(() => {
    if (ejemplo) return undefined
    let vivo = true
    void pedirPasaporte().then((r) => vivo && setDatos((prev) => (r?.ok ? (prev && prev !== 'error' && mismaRespuesta(prev, r) ? prev : r) : prev && prev !== 'error' ? prev : 'error')))
    return () => {
      vivo = false
    }
  }, [])
  useEffect(() => {
    if (!cubierta) return
    const t = setTimeout(() => setCubierta(false), 2700)
    return () => clearTimeout(t)
  }, [cubierta])

  const paginas = useMemo(() => (datos && datos !== 'error' ? datos.paginas : []), [datos])
  const porIso = useMemo(() => new Map((catalogo ?? []).map((p) => [p.i, p])), [catalogo])

  const ir = (i: number, lugar?: Pais) => {
    const p = paginas[i]
    if (!p) return
    const c = lugar ?? (p.iso ? porIso.get(p.iso) : undefined)
    setIdx(i)
    setSub(0)
    setLista(false)
    setAviso(null)
    const v = c ? puntoDeLaPagina(p, c) : null
    if (v) setObjetivo((o) => ({ ...v, n: (o?.n ?? 0) + 1 }))
  }

  // Cuando llegan los datos y el catálogo, se abre donde pide `pagina` (una sola vez).
  const [inicial, setInicial] = useState<{ lat: number; lng: number; z: number } | null>(null)
  useEffect(() => {
    if (sembrado.current || !catalogo || !paginas.length) return
    sembrado.current = true
    const pedida = pantalla.pagina
    let i = 0
    let s = 0
    if (pedida?.startsWith('sello:') || pedida?.startsWith('ver-sello:')) {
      const trip = pedida.slice(pedida.indexOf(':') + 1)
      const k = paginas.findIndex((p) => p.sellos.some((x) => x.trip_id === trip))
      if (k >= 0) {
        i = k
        // (V14) El sello se estampa UNA sola vez por viaje: si ya se estampó (o se pide [Ver mi sello]), la página se abre en su sitio sin estampar otra vez.
        if (pedida.startsWith('sello:') && (ejemplo || !selloYaEstampado(trip))) {
          setEstampar(trip)
          if (!ejemplo) marcarSelloEstampado(trip, paginas[k].sellos.find((x) => x.trip_id === trip)?.fecha ?? null)
        }
        s = Math.floor(paginas[k].sellos.findIndex((x) => x.trip_id === trip) / SELLOS_POR_PAGINA)
      } else {
        // (V11) Ese viaje aún no tiene sello: se abre la página de su país y se dice qué hace falta (no se deja el sello «Por conseguir» sin explicación).
        const falta = (datos && datos !== 'error' ? datos.viajes_sin_sello : undefined)?.find((v) => v.trip_id === trip)
        if (falta) {
          const kk = paginas.findIndex((p) => p.sellos.some((x) => x.destino === falta.destino))
          if (kk >= 0) i = kk
          setSinSello(falta)
        }
      }
    } else if (pedida && pedida !== 'lista') {
      const [nombre, num] = pedida.split(':')
      const k = paginas.findIndex((p) => sinTildes(p.pais) === sinTildes(nombre))
      if (k >= 0) {
        i = k
        s = Math.max(0, Number(num ?? 1) - 1)
      }
    } else if (pedida === 'lista') setLista(true)
    const c = paginas[i].iso ? porIso.get(paginas[i].iso as string) : undefined
    setIdx(i)
    setSub(s)
    // Al abrirlo sin pedir nada, el mapa se centra en los países VISITADOS (sin ninguno, en Europa); si piden un país o un sello, en ese.
    if (!pedida) setInicial(mapaDeVisitados(catalogo, paginas.filter((p) => p.estado !== 'por_conseguir' && p.iso).map((p) => p.iso as string)).inicial)
    else if (c) setInicial(puntoDeLaPagina(paginas[i], c))
    else setInicial({ lat: 36, lng: 8, z: 1 })
  }, [catalogo, paginas, porIso, pantalla.pagina])

  const pagina = paginas[idx]
  const reales = pagina ? realesDe(pagina) : []

  const rellenos = useMemo(() => {
    const r: Record<string, Relleno> = {}
    paginas.forEach((p, k) => {
      if (!p.iso) return
      if (p.estado === 'por_conseguir') r[p.iso] = { f: '#E6DCC6', s: 'rgba(28,34,48,.45)', w: 1.2 }
      else r[p.iso] = { f: SUAVES[k % SUAVES.length], s: 'rgba(28,34,48,.5)' }
    })
    if (pagina?.iso) r[pagina.iso] = { ...(r[pagina.iso] ?? { f: '#E6DCC6' }), s: '#1C2230', w: 2 }
    return r
  }, [paginas, pagina])
  const marcas = useMemo(() => {
    // (V15) Solo hay puntos en las CIUDADES con viaje (Lanzarote en Lanzarote), nunca en el centro de un país: antes cada país visitado llevaba un punto en su centro (en España, cerca de Madrid, sin ningún viaje allí).
    // LLENO si el viaje ya está hecho (sello), HUECO (más suave) si está por hacer. Tocar un punto lleva a la página de su país. La clave empieza por el número de esa página.
    const porDestino = (d: string) => COORDENADAS_DE_DESTINO[d]
    const m: Marca[] = []
    paginas.forEach((p, k) => p.sellos.filter((s) => !s.vacio && porDestino(s.destino)).forEach((s) => m.push({ clave: `${k}|hecho-${s.trip_id}`, lat: porDestino(s.destino).lat, lng: porDestino(s.destino).lng, tipo: 'oro', brillo: k === idx })))
    for (const v of datos && datos !== 'error' ? (datos.viajes_por_hacer ?? []) : []) {
      if (!porDestino(v.destino)) continue
      const k = paginas.findIndex((p) => p.sellos.some((x) => x.destino === v.destino))
      m.push({ clave: `${k}|hueco-${v.trip_id}`, lat: porDestino(v.destino).lat, lng: porDestino(v.destino).lng, tipo: 'gris', brillo: k === idx })
    }
    return m
  }, [paginas, idx, datos])

  const alPais = (iso: string) => {
    const k = paginas.findIndex((p) => p.iso === iso)
    if (k >= 0) ir(k)
  }
  const cerrar = () => useLogrosPantallas.getState().volver()
  const crearViaje = () => {
    useLogrosPantallas.getState().cerrarTodo()
    usePerfilUi.getState().cerrar()
    empezarViajeNuevo()
  }

  const nSubs = Math.max(1, pagina ? Math.ceil(pagina.sellos.length / SELLOS_POR_PAGINA) : 1)
  const anchoDePagina = Math.max(220, Math.min(typeof window !== 'undefined' ? window.innerWidth : 390, 430) - 72)
  const colocados = pagina ? colocar(pagina.sellos, sub, anchoDePagina) : []
  const estampando = estampar && !reducido ? colocados.find((c) => c.s.trip_id === estampar) : undefined
  const numeros = datos && datos !== 'error' ? datos.numeros : null
  // (V37) El sello CON SONIDO: al montar el golpe (`Golpe`, que cae a los 2,05 s: `TIEMPOS_ESTAMPADO.golpe`) suena la partitura `sello_pasaporte`, que ya cuenta con 0,5 s de vuelo antes del golpe. UNA vez por estampado
  // (otra, solo si se toca [Repetir el golpe]); nada al volver a una página ya estampada ([Ver mi sello]: ahí `estampar` no se pone); nada en el estudio (`ejemplo` y `__estudioVisor`: el visor ya hace sonar la suya);
  // y con «reducir movimiento» no hay golpe (`estampando` vacío) y por tanto tampoco sonido: el sonido sigue a la animación.
  const sonoPara = useRef('')
  const hayGolpe = Boolean(estampando)
  useEffect(() => {
    if (!estampar || ejemplo || (window as unknown as { __estudioVisor?: unknown }).__estudioVisor) return
    prepararSonido('sello_pasaporte') // los archivos listos antes de que caiga el sello
    if (!hayGolpe) return
    const k = `${estampar}:${golpe}`
    if (sonoPara.current === k) return
    sonoPara.current = k
    void sonar('sello_pasaporte')
  }, [estampar, golpe, hayGolpe, ejemplo])

  return (
    <Capa etiqueta="PasaporteScreen" fondo="#F1E8D6">
      <div data-mundo="" style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', paddingBottom: 'calc(26px + env(safe-area-inset-bottom))' }}>
          <div style={{ position: 'relative', borderRadius: '0 0 26px 26px', background: BURDEOS, boxShadow: '0 18px 30px -16px rgba(54,16,26,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 24px', color: '#F3D59A', zIndex: 2 }}>
            <button type="button" onClick={cerrar} aria-label="Cerrar" style={{ position: 'absolute', left: 10, top: 10, width: 44, height: 44, border: 'none', background: 'transparent', color: '#F3D59A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(243,213,154,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </span>
            </button>
            <span data-titulo-pasaporte style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <span style={{ font: "300 11px/1 'Geist'", letterSpacing: '.34em', textTransform: 'uppercase' }}>Pasaporte</span>{' '}
              {yo.tieneNombre && <span style={{ font: "italic 400 24px/1 'Instrument Serif',serif", color: '#FFF1D6' }}>de {yo.nombre}</span>}
            </span>
            <div data-mapa-grande style={{ position: 'relative', marginTop: 8, width: lado + 18, height: lado + 18, borderRadius: '50%', padding: 9, background: 'conic-gradient(from 200deg,#F6E3A8,#B8903E,#F3D59A,#8E6A26,#F6E3A8)', boxShadow: '0 10px 24px -10px rgba(0,0,0,.6)' }}>
              {inicial ? (
                <Globo tierra={tierra} rellenos={rellenos} marcas={marcas} objetivo={objetivo} inicial={inicial} estilo="papel" lado={lado} zoomMax={9} onPais={alPais} onMarca={(c) => { const k = Number(String(c).split('|')[0]); if (Number.isFinite(k) && k >= 0) ir(k) }} etiqueta="El globo de tu pasaporte" />
              ) : (
                <div data-globo-esqueleto aria-hidden="true" style={{ width: lado, height: lado, borderRadius: '50%', background: 'radial-gradient(circle at 38% 32%,#FBF6EA 0%,#EADFC6 55%,#D9CBAB 100%)', boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.08)', animation: 'muFade 1.2s ease-in-out infinite alternate' }} />
              )}
            </div>
            {numeros && (
              <span style={{ marginTop: 14, font: "500 11px 'Geist Mono',monospace", letterSpacing: '.04em', color: 'rgba(243,213,154,.85)' }}>
                {plural(numeros.paises, 'país', 'países')} · {plural(numeros.ciudades, 'ciudad', 'ciudades')} · {plural(numeros.dias_viajando, 'día viajando', 'días viajando')}
              </span>
            )}
          </div>

          <div style={{ position: 'relative', margin: '-14px 18px 0', zIndex: 1 }}>
            <span style={{ position: 'absolute', left: -6, right: -6, top: 0, bottom: -8, borderRadius: '0 0 22px 22px', background: 'linear-gradient(150deg,#6A1A2C,#4A1220)', boxShadow: '0 22px 36px -20px rgba(28,34,48,.7)' }} />
            <div style={{ position: 'relative', marginTop: 14, minHeight: 440, borderRadius: '4px 4px 16px 16px', background: '#F3EBDB', overflow: 'hidden', boxShadow: 'inset 0 8px 10px -8px rgba(0,0,0,.3)', padding: '12px 18px' }}>
              {datos === 'error' && <span style={{ display: 'block', paddingTop: 40, textAlign: 'center', font: "italic 400 18px/1.3 'Instrument Serif',serif", color: 'rgba(28,34,48,.65)' }}>No se ha podido abrir tu pasaporte. Vuelve a probar.</span>}
              {datos && datos !== 'error' && !pagina && <span style={{ display: 'block', paddingTop: 60, textAlign: 'center', font: "italic 400 20px/1.3 'Instrument Serif',serif", color: 'rgba(28,34,48,.65)' }}>Tu primer sello llega al acabar un viaje</span>}
              {pagina && (
                <>
                  <button type="button" onClick={() => setLista(true)} aria-label="Elegir país" style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 10px', border: 'none', borderBottom: '1px solid rgba(28,34,48,.15)', background: 'transparent', color: '#1C2230', cursor: 'pointer', textAlign: 'left' }}>
                    <Banderita iso={pagina.iso} />
                    <span style={{ flex: 1, font: "600 11px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase' }}>Pasaporte · {pagina.pais}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.6)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div key={`${pagina.pais}-${sub}-${golpe}`} style={{ position: 'relative', height: 372, animation: 'muSwap .35s ease both' }}>
                    {pagina.estado === 'recuerdo' && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-36%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                        <Banderita iso={pagina.iso} ancho={56} />
                        <span style={{ font: "400 28px/1 'Instrument Serif',serif" }}>{pagina.pais}</span>
                        <span style={{ font: "italic 400 17px/1.3 'Instrument Serif',serif", color: 'rgba(28,34,48,.6)' }}>Viaje de antes de usar la app</span>
                      </div>
                    )}
                    {nSubs > 1 && (
                      <span style={{ position: 'absolute', right: -8, bottom: -22, zIndex: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {sub > 0 && <Flecha etiqueta="Página anterior" lado="izq" alTocar={() => setSub(sub - 1)} />}
                        <span style={{ font: "500 11px 'Geist Mono',monospace", color: 'rgba(28,34,48,.55)', padding: '0 4px' }}>
                          {sub + 1} / {nSubs}
                        </span>
                        {sub < nSubs - 1 && <Flecha etiqueta="Página siguiente" lado="der" alTocar={() => setSub(sub + 1)} />}
                      </span>
                    )}
                    <div style={{ position: 'absolute', left: 0, right: 0, top: 44, bottom: 0 }}>
                      {colocados.map(({ s, x, y, r, tam }, k) => {
                        const oculto = Boolean(estampando && s.trip_id === estampar)
                        const a = aspectoDeSello(s.ciudad, s.fecha)
                        return (
                          <span key={`${s.destino}-${s.trip_id ?? 'vacio'}-${k}`} style={{ position: 'absolute', left: x, top: y, width: tam, height: tam, transform: `rotate(${r}deg)`, visibility: oculto ? 'hidden' : 'visible' }}>
                            <span style={{ position: 'absolute', inset: 0, filter: s.vacio ? 'grayscale(1) opacity(.55)' : 'none', animation: `muStamp .5s ${(0.15 + k * 0.22).toFixed(2)}s cubic-bezier(.3,1.5,.5,1) both` }}>
                              <SelloPasaporte forma={a.forma} sitio={s.ciudad} fecha={fechaDeSello(s.fecha)} tinta={a.tinta} vacio={s.vacio} tam={tam} />
                            </span>
                            {s.vacio && (
                              <>
                                <button type="button" data-sello-por-conseguir={s.destino} onClick={() => { const falta = (datos && datos !== 'error' ? datos.viajes_sin_sello : undefined)?.find((v) => v.destino === s.destino); if (falta) setSinSello(falta); else setAviso(s) }} aria-label={`${s.ciudad}, por conseguir`} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                                <span style={{ position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)', height: 20, padding: '0 8px', borderRadius: 999, background: '#FFFDF8', border: '1px dashed rgba(28,34,48,.3)', color: 'rgba(28,34,48,.6)', font: "600 10px/18px 'Geist'", whiteSpace: 'nowrap', pointerEvents: 'none' }}>Por conseguir</span>
                              </>
                            )}
                            {s.nuevo && <span style={{ position: 'absolute', right: -6, top: -4, height: 22, padding: '0 8px', borderRadius: 999, background: '#F1E3BF', color: '#6F4E37', font: "600 10.5px/22px 'Geist'", boxShadow: '0 0 0 2px #F3EBDB' }}>Nuevo</span>}
                          </span>
                        )
                      })}
                      {estampando && <Golpe key={golpe} x={estampando.x} y={estampando.y} r={estampando.r} tam={estampando.tam} s={estampando.s} />}
                    </div>
                  </div>
                  {reales.length > 0 && nSubs === 1 && !estampar && <span style={{ position: 'absolute', left: 18, bottom: 12, font: "500 11px 'Geist Mono',monospace", letterSpacing: '.08em', color: 'rgba(28,34,48,.55)' }}>{reales.length === 1 ? '1 SELLO' : `${reales.length} SELLOS`}</span>}
                </>
              )}
              {estampar && pagina && (
                <span style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,0)', animation: reducido ? 'none' : 'muInk 1.6s 2.1s ease-out both', pointerEvents: 'none' }} />
              )}
            </div>
          </div>
          {estampar && pagina && (
            <div style={{ position: 'relative', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 26, animation: 'muSwap .5s 3s ease both' }}>
              <span style={{ padding: '8px 14px', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "500 13px 'Geist'" }}>{(colocados.find((c) => c.s.trip_id === estampar)?.s.ciudad ?? pagina.pais)} te deja su sello</span>
              {!reducido && (
                <button type="button" onClick={() => setGolpe(golpe + 1)} style={{ height: 44, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(28,34,48,.18)', background: '#FFFDF8', font: "600 12.5px 'Geist'", cursor: 'pointer' }}>
                  Repetir el golpe
                </button>
              )}
            </div>
          )}
        </div>

        {lista && (
          <>
            <div onClick={() => setLista(false)} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(28,34,48,.4)', animation: 'muFade .25s ease both' }} />
            <div role="dialog" aria-label="Países del pasaporte" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 31, borderRadius: '32px 32px 0 0', background: '#FFFDF8', padding: '10px 18px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', animation: 'muSheet .35s cubic-bezier(.2,.8,.2,1) both' }}>
              <CruzDeHoja onCerrar={() => setLista(false)} estilo={{ top: 8, right: 8 }} />
              <TiradorDeHoja />
              <div style={{ maxHeight: 560, overflowY: 'auto', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column' }}>
                {([['Tus países', (p: PaginaDePasaporte) => p.estado !== 'por_conseguir'], ['Por descubrir', (p: PaginaDePasaporte) => p.estado === 'por_conseguir']] as const).map(([titulo, filtro]) => {
                  const filas = paginas.map((p, k) => [p, k] as const).filter(([p]) => filtro(p))
                  if (!filas.length) return null
                  return (
                    <div key={titulo} style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ padding: '14px 2px 6px', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>{titulo}</span>
                      {filas.map(([p, k]) => (
                        <button key={p.pais} type="button" onClick={() => ir(k)} style={{ minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px', border: 'none', borderBottom: '1px solid rgba(28,34,48,.08)', background: k === idx ? 'oklch(0.8 0.14 70 / .14)' : 'transparent', borderRadius: 10, color: '#1C2230', cursor: 'pointer', textAlign: 'left' }}>
                          <span style={{ display: 'flex', filter: p.estado === 'por_conseguir' ? 'grayscale(.6)' : 'none' }}>
                            <Banderita iso={p.iso} ancho={28} />
                          </span>
                          <span style={{ flex: 1, font: "500 15px 'Geist'", color: p.estado === 'por_conseguir' ? 'rgba(28,34,48,.65)' : '#1C2230' }}>{p.pais}</span>
                          <span style={{ font: "500 12px 'Geist'", color: p.estado === 'por_conseguir' ? 'oklch(0.48 0.17 5)' : 'rgba(28,34,48,.55)' }}>{textoDeLista(p)}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {aviso && (
          <>
            <div onClick={() => setAviso(null)} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(28,34,48,.4)', animation: 'muFade .25s ease both' }} />
            <div role="dialog" aria-label={`Aún no has estado en ${aviso.ciudad}`} data-hoja-por-conseguir style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 31, borderRadius: '32px 32px 0 0', background: '#FFFDF8', padding: '10px 20px calc(30px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', animation: 'muSheet .35s cubic-bezier(.2,.8,.2,1) both' }}>
              <CruzDeHoja onCerrar={() => setAviso(null)} />
              <TiradorDeHoja />
              <span style={{ marginTop: 8, font: "400 26px/1.1 'Instrument Serif',serif" }}>Aún no has estado en {aviso.ciudad}</span>
              {/* (V11) Tocar «Por conseguir» NUNCA crea un viaje: [Planear un viaje] solo abre el formulario de siempre. */}
              <button type="button" data-planear-un-viaje onClick={crearViaje} style={{ marginTop: 6, width: '100%', height: 52, border: 'none', borderRadius: 999, background: ORO, color: '#17120a', font: "700 15px 'Geist'", cursor: 'pointer' }}>
                Planear un viaje
              </button>
            </div>
          </>
        )}

        {sinSello && (
          <>
            <div onClick={() => setSinSello(null)} style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(28,34,48,.4)', animation: 'muFade .25s ease both' }} />
            <div role="dialog" aria-label={`El sello de ${sinSello.ciudad}`} data-hoja-sin-sello style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 31, borderRadius: '32px 32px 0 0', background: '#FFFDF8', padding: '10px 20px calc(30px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', animation: 'muSheet .35s cubic-bezier(.2,.8,.2,1) both' }}>
              <CruzDeHoja onCerrar={() => setSinSello(null)} />
              <TiradorDeHoja />
              <span style={{ marginTop: 8, font: "400 26px/1.1 'Instrument Serif',serif" }}>Tu sello de {sinSello.ciudad} aún no está</span>
              <span style={{ font: "400 14px/1.45 'Geist'", color: 'rgba(28,34,48,.7)' }}>
                {sinSello.vistas < sinSello.minimas ? `Te ${sinSello.minimas - sinSello.vistas === 1 ? 'falta 1 sitio' : `faltan ${sinSello.minimas - sinSello.vistas} sitios`} para tu sello. ` : ''}
                {`El sello se estampa al acabar el viaje con al menos ${sinSello.minimas} sitios vistos (con tu ubicación o con una foto). En este viaje llevas ${sinSello.vistas}.`}
                {sinSello.plazo_abierto ? ' Todavía puedes sumar los que te faltan con las fotos que hiciste: el plazo acaba el ' + fechaLarga(sinSello.hasta) + '.' : ''}
              </span>
              {sinSello.plazo_abierto && (
                <button type="button" data-reclamar-para-el-sello onClick={() => { setSinSello(null); useLogrosPantallas.getState().cerrarTodo(); abrirGaleriaDeReclamo() }} style={{ marginTop: 6, width: '100%', height: 52, border: 'none', borderRadius: 999, background: ORO, color: '#17120a', font: "700 15px 'Geist'", cursor: 'pointer' }}>
                  Reclamar con tus fotos
                </button>
              )}
            </div>
          </>
        )}

        {cubierta && (
          <button type="button" onClick={() => setCubierta(false)} aria-label="Abrir el pasaporte" style={{ position: 'absolute', inset: 0, zIndex: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', animation: 'muCovBg .4s 2.2s ease forwards' }}>
            <span style={{ position: 'absolute', inset: 0, background: BURDEOS, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#F3D59A', animation: 'muCovUp 1.1s 1s cubic-bezier(.6,0,.3,1) both' }}>
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3zM5 7.5h14M5 16.5h14" />
              </svg>
              <span style={{ font: "300 12px/1 'Geist'", letterSpacing: '.36em', textTransform: 'uppercase' }}>Pasaporte</span>
            </span>
          </button>
        )}
      </div>
    </Capa>
  )
}

function Flecha({ etiqueta, lado, alTocar }: { etiqueta: string; lado: 'izq' | 'der'; alTocar: () => void }): ReactNode {
  const oscura = lado === 'der'
  return (
    <button type="button" onClick={alTocar} aria-label={etiqueta} style={{ width: 44, height: 44, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <span style={{ width: 36, height: 36, borderRadius: '50%', border: oscura ? 'none' : '1px solid rgba(28,34,48,.18)', background: oscura ? '#1C2230' : '#FFFDF8', color: oscura ? '#FFFDF8' : '#1C2230', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: oscura ? '0 6px 12px -6px rgba(28,34,48,.6)' : 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={oscura ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
        </svg>
      </span>
    </button>
  )
}

/** El golpe del sello: cae, rebota, salpica tinta y deja un anillo. Se pinta encima del hueco donde se queda. */
function Golpe({ x, y, r, tam, s }: { x: number; y: number; r: number; tam: number; s: SelloDePagina }): ReactNode {
  const a = aspectoDeSello(s.ciudad, s.fecha)
  const gotas = Array.from({ length: 8 }, (_, i) => {
    const ang = (i / 8) * Math.PI * 2
    const d = 54 + (i % 3) * 12
    return { x: `${Math.round(Math.cos(ang) * d)}px`, y: `${Math.round(Math.sin(ang) * d)}px`, s: `${4 + (i % 3)}px` }
  })
  const tinta = a.tinta
  return (
    <div aria-hidden="true" data-golpe-del-sello style={{ position: 'absolute', left: x + tam / 2, top: y + tam / 2, width: 0, height: 0, pointerEvents: 'none' }}>
      <span style={{ position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: '50%', border: `3px solid ${tinta.replace(')', ' / .6)')}`, opacity: 0, animation: 'muRing 1.1s 2.15s ease-out both' }} />
      <span style={{ position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: '50%', border: `2px solid ${tinta.replace(')', ' / .45)')}`, opacity: 0, animation: 'muRing 1.4s 2.3s ease-out both' }} />
      {gotas.map((g, i) => (
        <span key={i} style={{ position: 'absolute', left: -3, top: -3, width: g.s, height: g.s, borderRadius: '50%', background: tinta, opacity: 0, ['--dx' as string]: g.x, ['--dy' as string]: g.y, animation: 'muDrop .6s 2.12s ease-out both' }} />
      ))}
      <span style={{ position: 'absolute', left: -tam / 2, top: -tam / 2, width: tam, height: tam, transformOrigin: '50% 50%', animation: 'muSlam 2.3s cubic-bezier(.5,0,.3,1) both', ['--giro' as string]: `${r}deg` }}>
        <SelloPasaporte forma={a.forma} sitio={s.ciudad} fecha={fechaDeSello(s.fecha)} tinta={a.tinta} tam={tam} />
      </span>
    </div>
  )
}
