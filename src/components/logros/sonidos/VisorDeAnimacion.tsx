import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { aperturaInteriorHtml, DURACION as DURACION_APERTURA } from '../../../../shared/marca/aperturaJutrip.js'
import { contextoDeAudioDeLaApp, sonar } from '../../../lib/sonidos'
import { cortar, esperaDeLaAnimacion, esperaPorCodeMovido, fijarInicioDeLaAnimacion, ponerEstudio, precargar, programarPropios, type AjusteDeCode, type Letra, type SonidoPropio } from '../../../lib/sonidos/motor'
import { ANIMACIONES, animacionDe, golpeDe, MOMENTOS_DEL_ESTUDIO } from '../../../lib/sonidos/estudio'
import { partituraDe } from '../../../lib/sonidos/partituras'
import { Fuegos } from '../momentos/Fuegos'
import { cargarPaises, cargarTierra, cargarTierraDetallada } from '../pantallas/mundo/paises'
import { PASAPORTE_DE_EJEMPLO, VIAJE_DEL_SELLO_DE_EJEMPLO } from './ejemploPasaporte'
import { useEsAdministrador } from './useEsAdministrador'
import { ejemploDelResumenDelViaje } from './ejemploResumenViaje'
import { ESTADO_DEL_ESTUDIO } from '../../../lib/sonidos/ejemploEstado'
import { datosDePrueba } from '../momentos/api'

/**
 * (V34C) EL VISOR del estudio de sonidos: la propia app dentro de un marco de iPhone (393 x 852). `/admin/sonidos` lo mete en un `<iframe src="/?visor-sonidos=1">`; así cada animación se ve con el tamaño de pantalla, los
 * `100vh` y los `fixed inset-0` de un iPhone de verdad, y es la MISMA pieza que usa la app (`Reproductor`, las escenas, `ResumenDia`, la apertura…), no una copia. El sonido lo pone el motor de siempre (`sonar`), con el audio
 * de la página que lo contiene (el primer toque se da allí y suena a la primera). La página le habla por `window.__estudioVisor`. Solo para administradores.
 */
const Reproductor = lazy(() => import('../momentos/Reproductor'))
const ResumenDia = lazy(() => import('../momentos/ResumenDia').then((m) => ({ default: m.ResumenDia })))
const ResumenViaje = lazy(() => import('../momentos/ResumenViaje'))
const PasaporteScreen = lazy(() => import('../pantallas/PasaporteScreen'))
const PrimerDia = lazy(() => import('../momentos/PrimerDia'))

export interface OpcionesDeVer {
  animacion: string
  /** (V35A2) Los sonidos de Eric (se suman) y los de Code que se silencian (`archivo:redoble`, `sint:tic`). */
  propios?: SonidoPropio[]
  silenciados?: string[]
  /** (V35B2) Sonidos de Code movidos, y la letra y el volumen de cada sonido en ESTA animación. */
  ajustes?: Record<string, AjusteDeCode>
  letras?: Record<string, Letra>
  volumenes?: Record<string, number>
  /** (V36B) Sonidos de Code retocados (por `archivo_letra`). */
  editados?: Record<string, { buffer: AudioBuffer; golpe: number; dura: number }>
  /** Se llama cuando la animación acaba (o a los segundos que dura la partitura, si no hay un final claro). */
  alFinal?: () => void
}
export interface VisorApi {
  listo: true
  ver: (o: OpcionesDeVer) => Promise<void>
  parar: () => void
}

function Animacion({ id, alFinal }: { id: string; alFinal: () => void }): ReactNode {
  const a = animacionDe(id)
  const [pulsado, setPulsado] = useState(false)
  // Suena al empezar la animación, igual que en la app (la pantalla de logros pone el sonido al ganarlo; aquí, al montarla).
  useEffect(() => {
    if (!a) return undefined
    for (const s of a.suena) void sonar(s)
    if (a.visor === 'boton') window.setTimeout(() => setPulsado(true), 350)
    // El final: lo que dura la partitura más larga (las pantallas de logros avisan antes, al terminar).
    const dura = Math.max(...a.suena.map((s) => partituraDe(s)?.dura ?? 3), a.visor === 'apertura' ? DURACION_APERTURA : 0)
    const t = window.setTimeout(alFinal, (dura + 0.8) * 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  if (!a) return null
  if (a.visor === 'momentos' || a.visor === 'resumen_dia') {
    const momentos = MOMENTOS_DEL_ESTUDIO[a.momentos ?? a.id]?.() ?? []
    return (
      <Suspense fallback={null}>
        {a.visor === 'momentos' ? <Reproductor momentos={momentos} onTerminar={alFinal} /> : <ResumenDia ganado={momentos} estado={null} alCerrar={alFinal} />}
      </Suspense>
    )
  }
  // (V36C) El sello que se estampa en el pasaporte: la hoja de verdad (con un pasaporte y un viaje de EJEMPLO), no otra animación.
  if (a.visor === 'pasaporte')
    return (
      <Suspense fallback={null}>
        <div data-visor-pasaporte style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#F6EFE0' }}>
          <PasaporteScreen pantalla={{ t: 'pasaporte', pagina: `sello:${VIAJE_DEL_SELLO_DE_EJEMPLO}` }} ejemplo={PASAPORTE_DE_EJEMPLO} />
        </div>
      </Suspense>
    )
  if (a.visor === 'resumen_viaje')
    return (
      <Suspense fallback={null}>
        {/* (V35B) Con datos de EJEMPLO (un viaje a Roma lleno), no con los de la cuenta de quien mira. */}
        <ResumenViaje ejemplo={ejemploDelResumenDelViaje()} />
      </Suspense>
    )
  if (a.visor === 'primer_dia')
    return (
      <Suspense fallback={null}>
        <PrimerDia alCerrar={alFinal} />
      </Suspense>
    )
  if (a.visor === 'fuegos')
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(120% 100% at 50% 30%,#2A3050,#0B0E1C)' }}>
        <Fuegos desde={0} />
      </div>
    )
  if (a.visor === 'apertura') return <div data-visor-apertura style={{ position: 'fixed', inset: 0, background: '#FBF6EC' }} dangerouslySetInnerHTML={{ __html: aperturaInteriorHtml({ lema: 'Viaja con calma' }) }} />
  // `boton` y `solo`: una pantalla sencilla con el gesto donde suena (o solo el nombre).
  return (
    <div data-visor-gesto={a.id} style={{ position: 'fixed', inset: 0, background: 'radial-gradient(120% 100% at 50% 20%,#2A3050,#12172A)', color: '#FFFDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, fontFamily: "'Geist',sans-serif", padding: 30, textAlign: 'center' }}>
      <span style={{ font: "400 34px/1.05 'Instrument Serif',serif" }}>{a.nombre}</span>
      {a.visor === 'boton' && (
        <button type="button" data-boton-del-gesto onClick={() => void sonar(a.suena[0])} style={{ height: 56, padding: '0 30px', borderRadius: 999, border: '1.5px solid #D8BE84', background: pulsado ? '#F3D88F' : 'transparent', color: pulsado ? '#1C2230' : '#F3D88F', font: "700 17px 'Geist'", transition: 'transform .15s,background .15s', transform: pulsado ? 'scale(.94)' : 'none' }}>
          {a.gesto}
        </button>
      )}
      <span style={{ font: "400 13px/1.4 'Geist'", opacity: 0.7, maxWidth: 260 }}>{a.visor === 'boton' ? 'Toca el botón para oírlo otra vez.' : 'Solo el sonido: no tiene una animación propia.'}</span>
    </div>
  )
}

export function VisorDeAnimacion(): ReactNode {
  const admin = useEsAdministrador()
  const [actual, setActual] = useState<{ n: number; id: string } | null>(null)
  const final = useRef<() => void>(() => undefined)
  const contador = useRef(0)

  useEffect(() => {
    const api: VisorApi = {
      listo: true,
      ver: async (o) => {
        const ctx = contextoDeAudioDeLaApp()
        if (!ctx) return
        if (ctx.state !== 'running') void ctx.resume().catch(() => undefined)
        cortar(ctx, 60)
        const a = animacionDe(o.animacion)
        if (!a) return
        const propios = o.propios ?? []
        const golpe = golpeDe(a)
        ponerEstudio({ propios, silenciados: o.silenciados ?? [], golpe, ajustes: o.ajustes ?? {}, letras: o.letras ?? {}, volumenes: o.volumenes ?? {}, editados: o.editados ?? {} })
        // Todo lo que suena, descargado ANTES de empezar (así cada sonido cae en su instante, sin esperas).
        await Promise.all([...a.suena, ...a.partituras, ...(a.visor === 'momentos' ? ['escena'] : [])].map((p) => precargar(ctx, p)))
        // (V36C) La hoja del pasaporte necesita su catálogo y sus costas ya cargados para que el golpe del sello arranque justo al empezar (así el sonido cae con él).
        if (a.visor === 'pasaporte') await Promise.all([cargarPaises(), cargarTierra(), cargarTierraDetallada()]).catch(() => undefined)
        // (V37C) El estado de ejemplo de esta tarjeta (la insignia con lo que ya tenías); las que no lo necesitan, ninguno. Nunca se pide a la cuenta ni a la base de datos.
        datosDePrueba.estado = ESTADO_DEL_ESTUDIO[a.momentos ?? a.id]?.() ?? null
        final.current = o.alFinal ?? (() => undefined)
        setActual(null)
        // (V35A2) El primer fotograma se fija en el reloj de audio: si un sonido de Eric tiene que sonar ANTES, se espera ese tiempo (el sonido no se recorta, se retrasa la animación).
        const espera = Math.max(esperaDeLaAnimacion(propios, golpe), esperaPorCodeMovido(a.suena)) // (V35B2) también los sonidos de Code movidos antes del primer fotograma
        const inicio = ctx.currentTime + 0.05 + espera
        fijarInicioDeLaAnimacion(ctx, inicio)
        programarPropios(ctx, o.animacion, inicio) // los de Eric se suman a los de Code, programados ya (no recortados)
        const w = window as unknown as { __esperaDeLaAnimacion?: number }
        w.__esperaDeLaAnimacion = espera
        window.setTimeout(() => setActual({ n: ++contador.current, id: o.animacion }), Math.max(0, (inicio - ctx.currentTime) * 1000 - 20))
      },
      parar: () => {
        const ctx = contextoDeAudioDeLaApp()
        if (ctx) cortar(ctx, 80)
        datosDePrueba.estado = null
        setActual(null)
      },
    }
    ;(window as unknown as { __estudioVisor?: VisorApi }).__estudioVisor = api
    return () => {
      delete (window as unknown as { __estudioVisor?: VisorApi }).__estudioVisor
      datosDePrueba.estado = null
    }
  }, [])

  if (admin === null) return <div style={{ padding: 20, font: "400 14px 'Geist'" }}>Comprobando…</div>
  if (!admin) return <div data-solo-administradores style={{ padding: 20, font: "400 15px/1.4 'Geist'" }}>Esta página es solo para administradores.</div>
  return (
    <div data-visor-de-animacion data-animacion-actual={actual?.id ?? ''} style={{ position: 'fixed', inset: 0, background: actual ? 'transparent' : 'radial-gradient(120% 100% at 50% 20%,#2A3050,#12172A)', overflow: 'hidden' }}>
      {!actual && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,253,248,.55)', font: "500 14px 'Geist'" }}>{ANIMACIONES.length} animaciones · elige una</div>}
      {actual && <Animacion key={actual.n} id={actual.id} alFinal={() => final.current()} />}
    </div>
  )
}
