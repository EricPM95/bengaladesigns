import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Insignia, Sello, type GradoDeSello } from '../../dibujos'
import { todayIso } from '../../../../lib/dateRange'
import { zonaDelDestino } from '../../../../lib/zonaHoraria'
import { urlEstable } from '../../../../lib/urlsFirmadas'
import { abrirMapaEnOtraPestana, buildAppleMapsUrlFromHere, buildGoogleMapsUrlFromHere } from '../../../../lib/mapsLinks'
import { useAddFlowStore } from '../../../../store/useAddFlowStore'
import { useSyncStore } from '../../../../store/useSyncStore'
import { BOTON_CLARO, BOTON_ORO } from '../../../ui/botonesOro'
import { CruzDeHoja } from '../../../ui/CruzDeHoja'
import { TiradorDeHoja } from '../../../ui/TiradorDeHoja'
import { FONDO_DE_HOJA } from '../../../ui/fondoDeHoja'
import type { Momento } from '../../../../lib/logros'
import { useMomentosUI } from '../../momentos/useMomentosUI'
import { FotoDeSitioDeLista } from '../../ficha/ListaDeColeccion'
import { useLogrosPantallas } from '../useLogrosPantallas'
import { pedirColeccion, pedirDestino, type ColeccionDentroDatos, type PaginaDeDestinoDatos } from '../destino/api'
import { geometriaDeBaldosa } from '../destino/baldosa'
import { useCarga } from '../destino/piezas'
import { COLOR_DE_GRADO, conDe } from '../destino/formato'
import { guardarBalda, useGanados, useHojasDeLogros, type Ganados, type ItemGanado } from './api'
import { NOMBRE_DE_GRADO } from './formato'
import './todos.css'

const Repetir = lazy(() => import('./Repetir'))

/**
 * V72 §1 (Design «Ficha Logros en Grande», F1-F5): LA FICHA EN GRANDE, UNA SOLA PIEZA para una colección, una medalla de ciudad y un logro de viajero. Sube desde abajo (X a la izquierda,
 * «Llevar a mi vitrina» / «En tu vitrina» a la derecha solo si está ganado), con el dibujo en grande, el nombre, cuánto lleva, «Lo conseguido» (foto real, nombre y fecha) y «Lo que falta»
 * (foto real en gris y el día de tu viaje). Abajo, fijos: [Compartir] y [Volver a ver] (y «Es tu título» en un logro de viajero). Sustituye a «Una colección por dentro».
 * Los Emblemas Ocultos no pasan nunca por aquí. Lo hecho sale del servidor (GET /api/logros/coleccion y /destino; una vez al abrir, 2 filas por sitio ≈ 1-2 KB por colección).
 */
const VERDE = 'oklch(0.55 0.11 150)'
const NARANJA = 'oklch(0.8 0.14 70)'
const OCRE = '#8E6820'
const VERDE_TEXTO = '#2F6B43'
const FONDO_FICHA = '#FAF4E6'
const SERIF = "'Instrument Serif',serif"
const MONO = "'Geist Mono',monospace"

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const iso = (f: string | null | undefined): Date | null => (f && /^\d{4}-\d{2}-\d{2}/.test(f) ? new Date(`${f.slice(0, 10)}T12:00:00Z`) : null)
const mayus = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
/** «Jueves 26 de noviembre». */
export const fechaLarga = (f: string | null | undefined): string => {
  const d = iso(f)
  return d ? mayus(`${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`) : ''
}
/** «viernes 27». */
const diaDeSemana = (f: string | null | undefined): string => {
  const d = iso(f)
  return d ? `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}` : ''
}

/** Qué ficha es: una colección o una medalla de ciudad (de lo ganado o de la página del destino) o ninguna de las dos (un logro de viajero, que sigue con `FichaHoja`). */
export function queFichaEs(g: Ganados, clave: string): { tipo: 'coleccion' | 'sello'; destino: string; id: string } | null {
  const m = /^(coleccion|sello):([^:]+):(.+)$/.exec(clave)
  if (m) return { tipo: m[1] as 'coleccion' | 'sello', destino: m[2], id: m[3] }
  const it = g.items.find((i) => i.clave === clave)
  if (it?.tipo === 'coleccion' && it.destino && it.coleccion) return { tipo: 'coleccion', destino: it.destino, id: it.coleccion }
  if (it?.tipo === 'sello' && it.destino && it.sello) return { tipo: 'sello', destino: it.destino, id: it.sello }
  return null
}

/** El camino de siempre a la vitrina: poner (abre «elige un hueco») o quitar. */
export function useVitrinaDe(g: Ganados, item: ItemGanado | null): { enVitrina: boolean; ocupado: boolean; alternar: () => void } {
  const avisar = useHojasDeLogros((s) => s.avisar)
  const abrirHueco = useHojasDeLogros((s) => s.abrirHueco)
  const poner = useGanados((s) => s.poner)
  const [ocupado, setOcupado] = useState(false)
  const enVitrina = Boolean(item?.balda && g.vitrina.baldas[item.balda].huecos.includes(item.clave))
  const alternar = () => {
    if (!item?.balda || ocupado) return
    if (!enVitrina) return abrirHueco(item.clave)
    setOcupado(true)
    void guardarBalda(item.balda, g.vitrina.baldas[item.balda].huecos.filter((k) => k !== item.clave)).then((v) => {
      setOcupado(false)
      if (!v) return avisar('No se ha podido quitar. Vuelve a probar.')
      poner({ ...g, vitrina: v })
      avisar(`«${item.nombre}» vuelve a Todos mis logros`)
    })
  }
  return { enVitrina, ocupado, alternar }
}

/**
 * LA PASTILLA DE LA VITRINA (V82 §2): SIEMPRE arriba a la derecha de toda ficha, con el mismo aspecto: «+ Llevar a mi vitrina» / «✓ En tu vitrina». Solo se ofrece en lo CONSEGUIDO (nunca en una colección a medias ni en lo que aún no se tiene).
 * `fija`: lo que vive siempre en la vitrina sin que se elija (las 7 maravillas y los exclusivos, del pedestal y la balda de exclusivos): la misma pastilla en «✓ En tu vitrina», sin botón porque no hay nada que elegir.
 */
export function PastillaDeVitrina({ vitrina, fija = false }: { vitrina?: { enVitrina: boolean; ocupado: boolean; alternar: () => void } | null; fija?: boolean }): ReactNode {
  const puesto = fija || Boolean(vitrina?.enVitrina)
  const contenido = (
    <>
      <span style={{ width: 32, height: 32, borderRadius: '50%', background: puesto ? VERDE : NARANJA, color: puesto ? '#FFFFFF' : '#17120A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={puesto ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'} />
        </svg>
      </span>
      {puesto ? 'En tu vitrina' : 'Llevar a mi vitrina'}
    </>
  )
  const estilo = { height: 44, padding: '0 14px 0 5px', borderRadius: 999, border: '1px solid rgba(28,34,48,.08)', background: '#FFFDF8', display: 'flex', alignItems: 'center', gap: 8, font: "700 13px 'Geist'", color: '#1C2230', boxShadow: '0 4px 12px -8px rgba(28,34,48,.4)' } as const
  if (fija || !vitrina) return <span data-vitrina-de-ficha="puesto" data-vitrina-fija style={estilo}>{contenido}</span>
  return (
    <button type="button" data-vitrina-de-ficha={vitrina.enVitrina ? 'puesto' : 'libre'} aria-label={vitrina.enVitrina ? 'Quitar de mi vitrina' : 'Llevar a mi vitrina'} disabled={vitrina.ocupado} onClick={vitrina.alternar} style={{ ...estilo, cursor: 'pointer' }}>
      {contenido}
    </button>
  )
}

/** La hoja: fondo que oscurece, tirador, X a la izquierda, vitrina a la derecha, el cuerpo que se desliza y el pie fijo. */
export function HojaGrande({ etiqueta, clave, cerrar, vitrina, alta = true, pie, children }: { etiqueta: string; clave: string; cerrar: () => void; vitrina?: { enVitrina: boolean; ocupado: boolean; alternar: () => void } | null; alta?: boolean; pie?: ReactNode; children: ReactNode }): ReactNode {
  return (
    <>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', inset: 0, zIndex: 40, border: 'none', padding: 0, background: FONDO_DE_HOJA, animation: 'vtFade .3s ease both', cursor: 'default' }} />
      <div role="dialog" aria-modal="true" aria-label={etiqueta} data-ficha={clave} data-ficha-grande style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, ...(alta ? { height: 'calc(100% - 44px)' } : { maxHeight: 'calc(100% - 44px)' }), borderRadius: '32px 32px 0 0', background: FONDO_FICHA, color: '#1C2230', display: 'flex', flexDirection: 'column', animation: 'vtSheet .45s cubic-bezier(.2,.8,.2,1) both', overflow: 'hidden' }}>
        <div style={{ flex: 'none', position: 'relative', paddingTop: 12 }}>
          <TiradorDeHoja />
          <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px 0 10px' }}>
            <CruzDeHoja onCerrar={cerrar} enLinea estilo={{ marginRight: 0, marginTop: 0 }} />
            {vitrina && <PastillaDeVitrina vitrina={vitrina} />}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '0 18px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>{children}</div>
        {pie && <div style={{ flex: 'none', padding: '12px 18px calc(env(safe-area-inset-bottom,0px) + 20px)', background: FONDO_FICHA, boxShadow: '0 -10px 18px -12px rgba(28,34,48,.28)' }}>{pie}</div>}
      </div>
    </>
  )
}

/** El pie de lo ganado: [Compartir] y [Volver a ver] lado a lado (F2b, F3b) y, si es un logro de viajero que se puede usar de título, «Es tu título» debajo (F5). */
export function PieDeFicha({ momento, titulo, oscuro = false }: { momento: Momento | null; titulo?: { es: boolean; ocupado: boolean; alternar: () => void } | null; /** (V82) En la ficha azul (N2): los mismos botones con los mismos nombres, sobre fondo noche. */ oscuro?: boolean }): ReactNode {
  const [repetir, setRepetir] = useState(false)
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button type="button" data-compartir disabled={!momento} onClick={() => momento && useMomentosUI.getState().abrirCompartir({ tipo: 'logro', momento })} style={{ ...BOTON_ORO, height: 52, border: 'none', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: "700 15px 'Geist'", cursor: 'pointer', opacity: momento ? 1 : 0.5 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
            Compartir
          </button>
          <button type="button" data-volver-a-ver disabled={!momento} onClick={() => setRepetir(true)} style={{ ...BOTON_CLARO, ...(oscuro ? { background: 'rgba(255,253,248,.08)', border: '1px solid rgba(243,213,154,.4)', color: '#F3D59A', boxShadow: 'none' } : {}), height: 52, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: "700 15px 'Geist'", cursor: 'pointer', opacity: momento ? 1 : 0.5 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 5l12 7-12 7z" />
            </svg>
            Volver a ver
          </button>
        </div>
        {titulo && (
          <button type="button" data-es-tu-titulo={titulo.es ? '1' : '0'} disabled={titulo.ocupado} onClick={titulo.alternar} style={{ height: 44, borderRadius: 999, border: titulo.es ? 'none' : oscuro ? '1px solid rgba(255,253,248,.18)' : '1px solid rgba(28,34,48,.16)', background: titulo.es ? (oscuro ? '#F3D59A' : '#1C2230') : oscuro ? 'rgba(255,253,248,.1)' : '#FFFFFF', color: titulo.es ? (oscuro ? '#17120a' : '#F3D59A') : oscuro ? '#FFFDF8' : '#1C2230', font: "600 13px 'Geist'", cursor: 'pointer' }}>
            {titulo.es ? 'Es tu título ✓' : 'Usar como mi título'}
          </button>
        )}
      </div>
      {repetir && momento && (
        <Suspense fallback={null}>
          <Repetir momento={momento} alCerrar={() => setRepetir(false)} />
        </Suspense>
      )}
    </>
  )
}

const Etiqueta = ({ children, color }: { children: string; color: string }): ReactNode => (
  <span style={{ alignSelf: 'stretch', textAlign: 'left', margin: '10px 0 0', font: `600 10px ${MONO}`, letterSpacing: '.14em', textTransform: 'uppercase', color }}>{children}</span>
)

/** [Cómo llegar]: abre la ruta andando desde donde estés, en el mapa del propio móvil (el de Apple en iPhone y iPad, el otro en el resto). */
function comoLlegar(destino: string): void {
  const esApple = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  abrirMapaEnOtraPestana(esApple ? buildAppleMapsUrlFromHere(destino) : buildGoogleMapsUrlFromHere(destino))
}
/** [Añadir a mi viaje]: cierra las pantallas de logros y abre el flujo de «Añadir» con el sitio ya elegido. */
function anadirAMiViaje(nombre: string): void {
  useLogrosPantallas.getState().cerrarTodo()
  useMomentosUI.getState().cerrarHojaLogros()
  useHojasDeLogros.getState().limpiar()
  useAddFlowStore.getState().openAddFlow(null, nombre)
}

const BOTON_PEQUENO = { alignSelf: 'flex-start', height: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' } as const

type Sitio = ColeccionDentroDatos['sitios'][number]

/** Lo conseguido: foto real, nombre y fecha (✓ verde en la esquina de la foto). */
function FilaConseguida({ s, ciudad, alTocar }: { s: Sitio; ciudad: string; alTocar?: () => void }): ReactNode {
  return (
    <div data-sitio-de-ficha={s.sitio} data-ganado="1" onClick={alTocar} style={{ cursor: alTocar ? 'pointer' : 'default',  alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 12, padding: 6, borderRadius: 16, background: '#FFFDF8', border: '1px solid oklch(0.55 0.11 150 / .35)', minHeight: 60, textAlign: 'left' }}>
      <span style={{ position: 'relative', flex: 'none', display: 'flex' }}>
        <FotoDeSitioDeLista url={urlEstable(s.foto_url ?? null)} nombre={s.nombre} ciudad={ciudad} visto tam={48} />
        <span aria-hidden="true" style={{ position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: '50%', background: VERDE, color: '#fff', boxShadow: '0 0 0 2px #FFFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: `400 18px/1.1 ${SERIF}` }}>{s.nombre}</span>
        {s.fecha && <span style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{fechaLarga(s.fecha)}</span>}
      </span>
    </div>
  )
}

/** Lo que falta: foto real en gris, el día de tu viaje (o «Sin día en tu viaje») y, si es de la ruta de hoy, [Cómo llegar]. */
function FilaQueFalta({ s, datos, alTocar }: { s: Sitio; datos: ColeccionDentroDatos; alTocar?: () => void }): ReactNode {
  // «Hoy» es el de ahora en el destino (el mismo momento del viaje que en la hoja de logros).
  const hoy = todayIso(zonaDelDestino(datos.destino) ?? zonaDelDestino(datos.ciudad))
  const conViaje = Boolean(datos.viaje)
  const terminado = Boolean(datos.viaje && hoy > datos.viaje.fin)
  const abierto = conViaje && !terminado
  // Un día de la ruta que ya pasó sin ver el sitio ya no es «tu ruta»: sale como un sitio sin día (y se puede añadir a otro día).
  const enRuta = s.en_ruta && (!s.dia?.fecha || s.dia.fecha >= hoy)
  const nota = abierto ? (enRuta && s.dia?.fecha ? `En tu ruta · ${diaDeSemana(s.dia.fecha)}` : enRuta ? 'En tu ruta' : 'Sin día en tu viaje') : 'Por ver'
  const esHoy = abierto && enRuta && s.dia?.fecha === hoy
  return (
    <div data-sitio-de-ficha={s.sitio} data-ganado="0" onClick={alTocar} style={{ cursor: alTocar ? 'pointer' : 'default',  alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 12, padding: 6, borderRadius: 16, background: '#F3ECDD', border: '1px dashed rgba(28,34,48,.22)', minHeight: 60, textAlign: 'left' }}>
      <FotoDeSitioDeLista url={urlEstable(s.foto_url ?? null)} nombre={s.nombre} ciudad={datos.ciudad} visto={false} tam={48} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: `400 18px/1.1 ${SERIF}`, color: 'rgba(28,34,48,.55)' }}>{s.nombre}</span>
        <span data-dia-del-sitio={enRuta && abierto ? '1' : undefined} style={{ font: "500 12px 'Geist'", color: enRuta && abierto ? VERDE_TEXTO : 'rgba(28,34,48,.5)' }}>{nota}</span>
      </span>
      {esHoy && (
        <button type="button" data-como-llegar onClick={(e) => { e.stopPropagation(); comoLlegar(`${s.nombre}, ${datos.ciudad}`) }} style={BOTON_PEQUENO}>
          <span style={{ height: 32, padding: '0 14px', borderRadius: 999, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', display: 'flex', alignItems: 'center', font: "600 12.5px 'Geist'", color: '#1C2230' }}>Cómo llegar</span>
        </button>
      )}
      {abierto && !enRuta && (
        <button type="button" data-anadir-a-mi-viaje onClick={(e) => { e.stopPropagation(); anadirAMiViaje(s.nombre) }} style={BOTON_PEQUENO}>
          <span style={{ height: 32, padding: '0 12px', borderRadius: 999, background: '#1C2230', color: '#F3D59A', display: 'flex', alignItems: 'center', font: "600 12px 'Geist'" }}>Añadir a mi viaje</span>
        </button>
      )}
    </div>
  )
}

function ListasDeSitios({ datos, tituloConseguido, alTocar }: { datos: ColeccionDentroDatos; tituloConseguido: string; alTocar?: (sitio: string) => void }): ReactNode {
  const ganados = datos.sitios.filter((x) => x.visto)
  const faltan = datos.sitios.filter((x) => !x.visto)
  return (
    <>
      {ganados.length > 0 && <Etiqueta color={VERDE_TEXTO}>{tituloConseguido}</Etiqueta>}
      {ganados.map((s) => <FilaConseguida key={s.sitio} s={s} ciudad={datos.ciudad} alTocar={alTocar && (() => alTocar(s.sitio))} />)}
      {faltan.length > 0 && <Etiqueta color="rgba(28,34,48,.55)">Lo que falta</Etiqueta>}
      {faltan.map((s) => <FilaQueFalta key={s.sitio} s={s} datos={datos} alTocar={alTocar && (() => alTocar(s.sitio))} />)}
    </>
  )
}

function useDatosDeColeccion(destino: string, coleccion: string): ColeccionDentroDatos | null | false {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  // Una vez al abrir la ficha (la misma clave de memoria que usaba «la colección por dentro»); lo último que se vio sale al instante.
  return useCarga(() => pedirColeccion(destino, coleccion, tripId), [destino, coleccion, tripId], `pantalla:coleccion:${destino}:${coleccion}:${tripId ?? ''}`)
}

const Cargando = ({ hecho }: { hecho: boolean }): ReactNode => <span style={{ margin: '40px 0', font: "400 13.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{hecho ? 'Un momento…' : 'No se ha podido cargar. Vuelve a probar.'}</span>

/** F1, F2, F2b y F4: una colección. */
function FichaDeColeccion({ g, destino, id, cerrar }: { g: Ganados; destino: string; id: string; cerrar: () => void }): ReactNode {
  const datos = useDatosDeColeccion(destino, id)
  const item = g.items.find((i) => i.clave === `${destino}|coleccion|${id}`) ?? null
  const vitrina = useVitrinaDe(g, item)
  // Tocar un sitio de la lista ilumina su trozo en el emblema (como en el álbum de la V9, que esta ficha sustituye); se apaga a los 2,6 s.
  const [tocado, setTocado] = useState<string | null>(null)
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])
  const tocar = (sitio: string) => {
    setTocado(sitio)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setTocado(null), 2600)
  }
  const c = datos ? datos.coleccion : null
  const TAM = 170
  const trozo = datos && tocado ? (() => { const k = datos.sitios.findIndex((x) => x.sitio === tocado); return k >= 0 ? geometriaDeBaldosa(id, datos.sitios.length, k) : null })() : null
  const completa = Boolean(c?.completa)
  const sub = c ? `${c.n} DE ${c.total}${completa ? ' · COMPLETA' : c.n === 0 ? ' · SIN EMPEZAR' : ''}` : ''
  return (
    <HojaGrande etiqueta={c?.nombre ?? 'Colección'} clave={`coleccion:${destino}:${id}`} cerrar={cerrar} vitrina={item?.balda ? vitrina : null} pie={item ? <PieDeFicha momento={item.momento} /> : null}>
      {!datos || !c ? (
        <Cargando hecho={datos === null} />
      ) : (
        <>
          <span data-insignia-grande style={{ position: 'relative', margin: '4px 0 2px', display: 'flex', width: TAM, height: TAM, filter: c.n === 0 ? 'grayscale(1)' : 'none', opacity: c.n === 0 ? 0.55 : 1 }}>
            <Insignia coleccion={id} ganados={datos.sitios.filter((x) => x.visto).map((x) => x.sitio)} completa={completa} tam={TAM} />
            {trozo && tocado && (
              <span data-trozo-iluminado={tocado} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'drop-shadow(0 0 10px #F3D59A) drop-shadow(0 0 4px #FFF1C8)', animation: 'clPulso 1.3s ease-in-out infinite' }}>
                <span style={{ position: 'absolute', inset: 0, clipPath: `polygon(${trozo.puntos.map(([x, y]) => `${(x * TAM).toFixed(1)}px ${(y * TAM).toFixed(1)}px`).join(',')})` }}>
                  <Insignia coleccion={id} ganados={[tocado]} tam={TAM} />
                </span>
              </span>
            )}
          </span>
          <style>{'@keyframes clPulso{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}'}</style>
          <span style={{ font: `400 30px/1.05 ${SERIF}`, textWrap: 'balance' as never }}>{c.nombre}</span>
          <span style={{ font: `600 10.5px ${MONO}`, letterSpacing: '.14em', color: OCRE }}>{sub}</span>
          {completa && c.al_completar && <span style={{ font: `italic 400 17px ${SERIF}`, color: 'rgba(28,34,48,.7)' }}>{c.al_completar}</span>}
          <ListasDeSitios datos={datos} tituloConseguido="Lo conseguido" alTocar={tocar} />
        </>
      )}
    </HojaGrande>
  )
}

/** Lo que cuenta la medalla: sus pedazos son los de la colección de la que sale (imprescindibles en Lanzarote y Roma; sitios del Vaticano). */
const unidadDeLaMedalla = (coleccion: string): { uno: string; varios: string } => (/imprescindibles/.test(coleccion) ? { uno: 'imprescindible', varios: 'imprescindibles' } : { uno: 'sitio', varios: 'sitios' })
const ARTICULO_DE_GRADO: Record<string, string> = { bronce: 'el', plata: 'la', oro: 'el', diamante: 'el' }

/** F3 y F3b: la medalla de ciudad, con su grado y lo que falta para el siguiente (las cuentas son las de `sellos` en `data/logros/<destino>.json`, que da el servidor). */
function FichaDeMedalla({ g, destino, id, cerrar }: { g: Ganados; destino: string; id: string; cerrar: () => void }): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  // Una vez al abrir la ficha; la misma clave de memoria que la página del destino.
  const pagina = useCarga<PaginaDeDestinoDatos>(() => pedirDestino(destino, tripId), [destino, tripId], `pantalla:destino:${destino}:${tripId ?? ''}`)
  const s = pagina ? pagina.sellos.find((x) => x.id === id) ?? null : null
  const datos = useDatosDeColeccion(destino, s?.coleccion ?? '')
  const item = s?.grado ? (g.items.find((i) => i.clave === `${destino}|sello|${id}:${s.grado}`) ?? null) : null
  const vitrina = useVitrinaDe(g, item)
  const u = s ? unidadDeLaMedalla(s.coleccion) : { uno: 'sitio', varios: 'sitios' }
  const color = s?.grado ? COLOR_DE_GRADO[s.grado] : OCRE
  const sub = s ? (s.grado ? `${NOMBRE_DE_GRADO[s.grado] ?? s.grado} · ${s.nombre_grado ?? ''}`.toUpperCase() : 'POR CONSEGUIR') : ''
  const falta = s?.siguiente ? `Te faltan ${s.siguiente.faltan} ${s.siguiente.faltan === 1 ? u.uno : u.varios} para ${ARTICULO_DE_GRADO[s.siguiente.grado] ?? 'el'} ${s.siguiente.grado}` : s?.grado ? 'Has conseguido el grado más alto' : ''
  return (
    <HojaGrande etiqueta={s ? `Medalla ${s.nombre}` : 'Medalla'} clave={`sello:${destino}:${id}`} cerrar={cerrar} vitrina={item?.balda ? vitrina : null} pie={item ? <PieDeFicha momento={item.momento} /> : null}>
      {!s ? (
        <Cargando hecho={pagina === null} />
      ) : (
        <>
          <span data-medalla-grande style={{ margin: '4px 0 2px', display: 'flex' }}>
            <Sello id={s.id} grado={(s.grado ?? 'bronce') as GradoDeSello} tam={170} apagado={!s.grado} animado={false} />
          </span>
          <span style={{ font: `400 30px/1.05 ${SERIF}`, textWrap: 'balance' as never }}>{`Medalla ${conDe(s.nombre)}`}</span>
          <span style={{ font: `600 10.5px ${MONO}`, letterSpacing: '.12em', color }}>{sub}</span>
          {falta && <span data-falta-para-el-siguiente style={{ font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.7)' }}>{falta}</span>}
          {datos && <ListasDeSitios datos={datos} tituloConseguido={`${u.varios} conseguidos · ${datos.coleccion.n} de ${datos.coleccion.total}`} />}
        </>
      )}
    </HojaGrande>
  )
}

/** La ficha en grande de una colección o de una medalla de ciudad (lo que sube al tocarlas en la página del destino y desde cualquier «Ver la colección ›»). */
export function FichaGrande({ g, clave, cerrar }: { g: Ganados; clave: string; cerrar: () => void }): ReactNode {
  const f = queFichaEs(g, clave)
  if (!f) return null
  return f.tipo === 'coleccion' ? <FichaDeColeccion g={g} destino={f.destino} id={f.id} cerrar={cerrar} /> : <FichaDeMedalla g={g} destino={f.destino} id={f.id} cerrar={cerrar} />
}
