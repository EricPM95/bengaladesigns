import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FlagIcon } from '../ui/FlagIcon'
import { nombreDelPais, paisDelAparato, paisesOrdenados } from '../../lib/paisVive'
import { createPortal } from 'react-dom'
import { aniosPosibles, guardarPrimeraVez, usePrimeraVezUi, type Compania, type Frecuencia } from '../../lib/primeraVez'
import type { Sueno } from '../../lib/suenos'
import { BuscadorSueno } from './BuscadorSueno'
import { marca } from '../../lib/marca'
import { useDestinosCurados } from '../../lib/destinosCurados'
import { destinosDelMapa } from '../../lib/primeraVez'
import { precargarDestinos } from './LoQueTePuedesLlevar'
import { PalabraJutrip } from '../ui/LogoJutrip'

/**
 * (V31, Design «Primera Vez» Q1 a Q4) LAS PREGUNTAS DE LA PRIMERA VEZ: una por pantalla, con la barra de progreso, «Saltar» y [Continuar]. La pantalla «Listo» no va: al acabar la última se cierra y sale el Perfil.
 * Se guardan cuatro cosas (cada cuánto viaja, con quién, el año de nacimiento y, desde la V39, el viaje de sus sueños; más el país donde vive, V35B). La pregunta 3 era «¿Cómo te gusta viajar?» (de relleno, no se guardaba): ahora es «El viaje de tus sueños».
 * Las respuestas no se usan para los viajes. El año empieza SIN ninguno marcado: si no se toca nada, no se guarda.
 */
const IC = {
  fl: 'M5 21V4M5 4h11l-2 4 2 4H5',
  mal: 'M5 8h14v11H5zM9 8V5h6v3',
  av: 'M10.5 21l1.8-7L4 11.5 21 3l-8.5 17z',
  solo: 'M12 3l3 7 7 .8-5.3 4.7 1.6 7.2L12 19l-6.3 3.7 1.6-7.2L2 10.8 9 10z',
  pair: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  fam: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 12a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM3 20c0-3 2.4-5 5-5s5 2 5 5M14 20c0-2.4 1.6-4 3.6-4 2 0 3.4 1.6 3.4 4',
  fr: 'M7 21V9l5-5 5 5v12M10 21v-6h4v6',
} as const
const SERIE = "'Instrument Serif',serif"
const ORO = 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)'

const FRECUENCIAS: { id: Frecuencia; n: string; s: string; i: keyof typeof IC }[] = [
  { id: 'una_vez_al_anio', n: 'Una vez al año', s: 'Un viaje largo, bien elegido', i: 'fl' },
  { id: 'dos_o_tres', n: '2 o 3 veces', s: 'Escapadas y algún viaje grande', i: 'mal' },
  { id: 'cuatro_o_mas', n: '4 o más', s: 'Siempre con la maleta lista', i: 'av' },
]
const COMPANIAS: { id: Compania; n: string; i: keyof typeof IC }[] = [
  { id: 'a_mi_aire', n: 'A mi aire', i: 'solo' },
  { id: 'pareja', n: 'En pareja', i: 'pair' },
  { id: 'familia', n: 'En familia', i: 'fam' },
  { id: 'amigos', n: 'Con amigos', i: 'fr' },
]
/** (V39) Las pantallas, en orden: cada cuánto viaja, con quién, el viaje de sus sueños, el año de nacimiento y el país donde vive. Sin la migración 0093 el servidor no puede guardar el sueño: esa pantalla NO sale y quedan cuatro. */
type Pantalla = 'frecuencia' | 'compania' | 'sueno' | 'anio' | 'pais'
const PANTALLAS_CON_SUENO: Pantalla[] = ['frecuencia', 'compania', 'sueno', 'anio', 'pais']
const PANTALLAS_SIN_SUENO: Pantalla[] = ['frecuencia', 'compania', 'anio', 'pais']

function Icono({ d, color }: { d: string; color: string }): ReactNode {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
function Tilde({ t = 13 }: { t?: number }): ReactNode {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function PreguntasPrimeraVez({ onTerminar }: { onTerminar: () => void }): ReactNode {
  const [paso, setPaso] = useState(0)
  const [bienvenida, setBienvenida] = useState(true)
  const [frecuencia, setFrecuencia] = useState<Frecuencia | null>(null)
  const [compania, setCompania] = useState<Compania | null>(null)
  const [anio, setAnio] = useState<number | null>(null)
  // (V35B) El país donde vive sale ya marcado con el que dice el idioma del móvil (sin ubicación y sin IP); si no hay, ninguno. Se puede cambiar, quitar o saltar.
  const delMovil = useMemo(() => paisDelAparato(), [])
  const [pais, setPais] = useState<string | null>(delMovil)
  const paises = useMemo(() => paisesOrdenados(delMovil), [delMovil])
  // (V39) El viaje de sus sueños (pregunta 3): un país o un destino, opcional. Sin la 0093 la pregunta se salta sola.
  const conSuenos = usePrimeraVezUi((u) => u.suenos)
  const pantallas = conSuenos ? PANTALLAS_CON_SUENO : PANTALLAS_SIN_SUENO
  const ultimo = pantallas.length - 1
  const [sueno, setSueno] = useState<Sueno | null>(null)
  const [guardando, setGuardando] = useState(false)
  // (V34) Mientras la persona contesta, se piden ya los números de «Lo que te puedes llevar» de cada destino: al llegar al mapa, la tarjeta los trae al momento.
  const curados = useDestinosCurados()
  useEffect(() => {
    precargarDestinos(destinosDelMapa(curados).filter((d) => d.listo).map((d) => d.clave))
  }, [curados])

  const terminar = async (r: { frecuencia: Frecuencia | null; compania: Compania | null; anio: number | null; pais: string | null; sueno?: Sueno | null }) => {
    if (guardando) return
    setGuardando(true)
    // Aunque no se pueda guardar (sin red), las preguntas se cierran: no se atasca a nadie. Si no llegó a guardarse, volverán a salir la próxima vez.
    await guardarPrimeraVez({ frecuencia: r.frecuencia, compania: r.compania, anio_nacimiento: r.anio, pais_vive: r.pais, sueno: conSuenos ? (r.sueno ?? null) : null }).catch(() => false)
    onTerminar()
  }
  const id = pantallas[paso]
  const siguiente = () => {
    if (paso >= ultimo) void terminar({ frecuencia, compania, anio, pais, sueno })
    else setPaso(paso + 1)
  }
  // «Saltar» pasa a la pregunta siguiente SIN guardar lo de esta (si ya había algo marcado en ella, se quita).
  const saltar = () => {
    if (id === 'frecuencia') setFrecuencia(null)
    if (id === 'compania') setCompania(null)
    if (id === 'sueno') setSueno(null)
    if (id === 'anio') setAnio(null)
    if (id === 'pais') setPais(null)
    if (paso >= ultimo) void terminar({ frecuencia, compania, anio, pais: id === 'pais' ? null : pais, sueno: id === 'sueno' ? null : sueno })
    else setPaso(paso + 1)
  }

  const tarjeta = (on: boolean) => ({ background: on ? '#1C2230' : '#FFFFFF', border: `1.5px solid ${on ? '#1C2230' : 'rgba(28,34,48,.1)'}`, boxShadow: on ? '0 14px 24px -16px rgba(28,34,48,.8)' : '0 8px 18px -16px rgba(28,34,48,.35)' })
  const titulo = { frecuencia: '¿Cada cuánto viajas?', compania: '¿Con quién sueles viajar?', sueno: '¿Cuál es el viaje de tus sueños?', anio: '¿En qué año naciste?', pais: '¿En qué país vives?' }[id]

  // (V34) La bienvenida, antes de la primera pregunta (la primera pregunta se sentía fría). «Saltar» deja las cuatro preguntas sin contestar (como saltarlas una a una).
  if (bienvenida) {
    return createPortal(
      <div data-bienvenida-primera-vez role="dialog" aria-modal="true" aria-label="Bienvenido a JUTRIP" className="fixed inset-0 z-[90] flex flex-col" style={{ background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',sans-serif" }}>
        <div className="flex flex-none items-center justify-end px-[22px]" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 22px)' }}>
          <button type="button" data-saltar-bienvenida onClick={() => void terminar({ frecuencia: null, compania: null, anio: null, pais: null })} disabled={guardando} className="zona-toque" style={{ font: "600 14px 'Geist'", color: 'rgba(28,34,48,.55)', background: 'none', border: 'none', minHeight: 44, minWidth: 56 }}>
            Saltar
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-[30px] text-center">
          <PalabraJutrip tam={46} tono="claro" />
          <h1 style={{ margin: 0, font: `400 36px/1.05 ${SERIE}`, textWrap: 'balance' }}>Bienvenido a JUTRIP</h1>
          <span style={{ font: "600 11px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#8A6A2C' }}>{marca.lema}</span>
          <p style={{ margin: 0, maxWidth: 300, font: "400 16px/1.45 'Geist'", color: 'rgba(28,34,48,.7)' }}>{conSuenos ? 'Cinco' : 'Cuatro'} preguntas rápidas para conocerte y empezamos</p>
        </div>
        <div className="flex-none px-[22px] pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 28px)' }}>
          <button type="button" data-empezar onClick={() => setBienvenida(false)} className="zona-toque flex w-full items-center justify-center" style={{ height: 56, borderRadius: 18, border: 'none', background: ORO, boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510', font: "700 16px 'Geist'" }}>
            Empezar
          </button>
        </div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div data-preguntas-primera-vez data-pregunta={paso + 1} role="dialog" aria-modal="true" aria-label="Preguntas rápidas" className="fixed inset-0 z-[90] flex flex-col" style={{ background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',sans-serif" }}>
      <div className="flex flex-none items-center gap-3.5 px-[22px]" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 22px)' }}>
        <span className="flex flex-1 gap-1.5" aria-label={`Pregunta ${paso + 1} de ${pantallas.length}`}>
          {pantallas.map((_, i) => (
            <span key={i} style={{ flex: 1, height: 5, borderRadius: 5, background: i < paso ? '#1C2230' : i === paso ? '#D8BE84' : 'rgba(28,34,48,.14)' }} />
          ))}
        </span>
        <button type="button" data-saltar onClick={saltar} className="zona-toque" style={{ font: "600 14px 'Geist'", color: 'rgba(28,34,48,.55)', background: 'none', border: 'none', minHeight: 44, minWidth: 56 }}>
          Saltar
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[22px] pt-6" style={{ scrollbarWidth: 'none' }}>
        <h1 style={{ margin: 0, font: `400 36px/1.05 ${SERIE}`, textWrap: 'balance' }}>{titulo}</h1>

        {id === 'frecuencia' && (
          <div className="flex flex-col gap-3">
            {FRECUENCIAS.map((o) => {
              const on = frecuencia === o.id
              return (
                <button key={o.id} type="button" data-opcion={o.id} aria-pressed={on} onClick={() => setFrecuencia(on ? null : o.id)} className="flex items-center gap-3.5 text-left" style={{ padding: 18, borderRadius: 24, ...tarjeta(on) }}>
                  <span className="flex flex-none items-center justify-center" style={{ width: 48, height: 48, borderRadius: 16, background: on ? 'rgba(243,216,143,.15)' : '#F7F1E4' }}>
                    <Icono d={IC[o.i]} color={on ? '#F3D88F' : '#8A6A2C'} />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span style={{ font: "600 17px 'Geist'", color: on ? '#FFFDF8' : '#1C2230' }}>{o.n}</span>
                    <span style={{ font: "400 13px 'Geist'", color: on ? 'rgba(255,253,248,.7)' : 'rgba(28,34,48,.55)' }}>{o.s}</span>
                  </span>
                  {on && <span className="flex flex-none items-center justify-center" style={{ width: 26, height: 26, borderRadius: '50%', background: '#F3D88F', color: '#1C2230' }}><Tilde /></span>}
                </button>
              )
            })}
          </div>
        )}

        {id === 'compania' && (
          <div className="grid grid-cols-2 gap-3">
            {COMPANIAS.map((o) => {
              const on = compania === o.id
              return (
                <button key={o.id} type="button" data-opcion={o.id} aria-pressed={on} onClick={() => setCompania(on ? null : o.id)} className="relative flex flex-col justify-between text-left" style={{ height: 132, padding: 16, borderRadius: 24, ...tarjeta(on) }}>
                  <span className="flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 15, background: on ? 'rgba(243,216,143,.15)' : '#F7F1E4' }}>
                    <Icono d={IC[o.i]} color={on ? '#F3D88F' : '#8A6A2C'} />
                  </span>
                  <span style={{ font: "600 16px 'Geist'", color: on ? '#FFFDF8' : '#1C2230' }}>{o.n}</span>
                  {on && <span className="absolute flex items-center justify-center" style={{ right: 12, top: 12, width: 24, height: 24, borderRadius: '50%', background: '#F3D88F', color: '#1C2230' }}><Tilde t={12} /></span>}
                </button>
              )
            })}
          </div>
        )}

        {id === 'sueno' && (
          <>
            <span data-sueno-subtitulo style={{ marginTop: -8, font: "400 14.5px/1.35 'Geist'", color: 'rgba(28,34,48,.6)' }}>Un país o una ciudad que te encantaría visitar.</span>
            <BuscadorSueno valor={sueno} onElegir={setSueno} />
          </>
        )}

        {id === 'anio' && (
          <>
            <div data-anios className="flex flex-col items-center overflow-y-auto" style={{ height: 300, flex: 'none', borderRadius: 26, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', scrollbarWidth: 'none', padding: '6px 0' }}>
              {aniosPosibles().map((a) => {
                const on = anio === a
                return (
                  <button key={a} type="button" data-anio={a} aria-pressed={on} onClick={() => setAnio(on ? null : a)} className="flex flex-none items-center justify-center" style={{ height: 54, width: 'calc(100% - 36px)', borderRadius: 16, border: on ? '1.5px dashed rgba(28,34,48,.45)' : '1.5px solid transparent', background: on ? '#FBF3E2' : 'transparent', font: `400 ${on ? 30 : 24}px ${SERIE}`, color: on ? '#1C2230' : 'rgba(28,34,48,.45)' }}>
                    {a}
                  </button>
                )
              })}
            </div>
            <span style={{ textAlign: 'center', font: "400 13px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Opcional. Nos ayuda a mejorar Jutrip; nunca lo enseñamos</span>
          </>
        )}

        {id === 'pais' && (
          <>
            <div data-paises className="flex flex-col items-center overflow-y-auto" style={{ height: 300, flex: 'none', borderRadius: 26, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', scrollbarWidth: 'none', padding: '6px 0' }}>
              {paises.map((p) => {
                const on = pais === p
                return (
                  <button key={p} type="button" data-pais={p} aria-pressed={on} onClick={() => setPais(on ? null : p)} className="flex flex-none items-center gap-3 text-left" style={{ minHeight: 52, width: 'calc(100% - 28px)', padding: '0 14px', borderRadius: 16, border: on ? '1.5px dashed rgba(28,34,48,.45)' : '1.5px solid transparent', background: on ? '#FBF3E2' : 'transparent', font: `400 ${on ? 21 : 19}px ${SERIE}`, color: on ? '#1C2230' : 'rgba(28,34,48,.6)' }}>
                    <span className="flex flex-none items-center justify-center" style={{ width: 28, height: 20, fontSize: 28, overflow: 'hidden', borderRadius: 3 }}>
                      <FlagIcon countryCode={p.toLowerCase()} className="!block !h-full !w-full !rounded-none" />
                    </span>
                    <span className="flex-1">{nombreDelPais(p)}</span>
                    {on && <Tilde />}
                  </button>
                )
              })}
            </div>
            <span data-pais-nota style={{ textAlign: 'center', font: "400 13px 'Geist'", color: 'rgba(28,34,48,.5)' }}>Opcional. Nos ayuda a saber desde dónde viaja la gente; nunca lo enseñamos. Lo puedes cambiar en Ajustes</span>
          </>
        )}
      </div>
      <div className="flex-none px-[22px] pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 28px)' }}>
        <button type="button" data-continuar onClick={siguiente} disabled={guardando} className="zona-toque flex w-full items-center justify-center" style={{ height: 56, borderRadius: 18, border: 'none', background: ORO, boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510', font: "700 16px 'Geist'" }}>
          Continuar
        </button>
      </div>
    </div>,
    document.body,
  )
}
