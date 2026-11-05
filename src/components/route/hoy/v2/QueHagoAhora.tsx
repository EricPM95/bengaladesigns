import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, MealSlot, Route, Stop } from '../../../../lib/types'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { useDestinationPool } from '../../../../lib/useDestinationPool'
import { useSyncStore } from '../../../../store/useSyncStore'
import { useRadioDeParada } from '../../../../lib/radiosDeHoy'
import { estaAqui, urlComoLlegar } from '../../../../lib/hoyParada'
import { proponerAnadir, stopDeCandidato, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { useCompaneroStore } from '../../../../lib/hoyCompanero'
import { decidirQueHago, estaIluminado, type QueHago } from '../../../../lib/hoyQueHago'
import type { FraseDeAtardecer } from '../../../../lib/puestaDeSolYManana'
import { alCambiarSugerencias, sugerenciasDelCompanero } from '../../../../lib/sugerenciasCompanero'
import { Icono } from '../../../ui/Icono'
import { HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaComerAhora } from './ComerAhora'
import { HojaV2 } from './HojasV2'
import { FotoDeSitio } from './RetoDelDia'

/**
 * (HOY2b, E, apartado 1) EL BOTÓN [¿QUÉ HAGO AHORA?] y su hoja (17 y Completa 1 a 6). Siempre a la vista, en su hueco (`data-hoy-hueco-que-hago-ahora`, entre la tarjeta principal y «Cerca de ti»).
 * Se ilumina (el punto dorado, quieto) solo si hay algo NUEVO (hueco libre, hora de comer sin restaurante, día acabado con luz); al abrir la hoja se apunta que ya lo has visto y se apaga hasta que haya otra cosa.
 * La decisión está en `src/lib/hoyQueHago.ts` (pura). [Añadir] abre la propuesta de «Añadir un sitio cercano» (27a / 27b): nada se mueve sin [Aplicar], y después sale «Plan actualizado · Deshacer».
 */
const MARFIL = '#FBF3E2'
const BOTON_ORO = { background: 'linear-gradient(180deg,#F8EBC4,#DDBE7C 50%,#B58A2E)', color: '#3E2A0C', border: '1px solid #9A7228', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7),0 8px 14px -8px rgba(110,80,24,.8)' }
const BOTON_BLANCO = { background: '#FFFDF8', border: '1px solid rgba(181,138,46,.55)', color: '#1C2230', boxShadow: '0 4px 10px -6px rgba(110,80,24,.4)' }

const claveVisto = (rutaId: string, diaId: string, clave: string) => `trazo:hoy2b:que-hago:${rutaId}:${diaId}:${clave}`
const leerVisto = (k: string): boolean => {
  try {
    return window.localStorage.getItem(k) === '1'
  } catch {
    return false
  }
}
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Lo que identifica «lo nuevo» (para apagar el punto una vez visto). */
const claveDe = (q: QueHago): string => (q.tipo === 'hueco' ? `hueco:${norm(q.candidato.nombre)}` : q.tipo === 'comer' ? `comer:${q.meal.id}` : q.tipo)

export function QueHagoAhora({ route, day, dateIso, siguiente, anterior, ubicacion, enCoche, ahoraMin, comida, fraseAtardecer, casa }: { route: Route; day: DayPlan; dateIso: string; siguiente: Stop | null; anterior?: Stop; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; comida: MealSlot | null; fraseAtardecer: FraseDeAtardecer | null; casa?: Coordinates | null }) {
  const [sugerencias, setSugerencias] = useState(sugerenciasDelCompanero())
  useEffect(() => alCambiarSugerencias(() => setSugerencias(sugerenciasDelCompanero())), [])
  const { places, resolved } = useDestinationPool(route.destination, true)
  const cerca = useCompaneroStore((s) => s.cerca)
  const ofrecido = useCompaneroStore((s) => s.ofrecido)
  const radio = useRadioDeParada(useSyncStore((s) => s.activeTripId) ?? route.id, siguiente?.name ?? '')
  const [abierta, setAbierta] = useState(false)
  const [paso, setPaso] = useState<'inicio' | 'comer' | 'anadir'>('inicio')
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [vistos, setVistos] = useState<string[]>([])
  const ctx = useContexto(route, enCoche)

  const coleccionDe = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of cerca?.retos ?? []) for (const s of r.sitios) if (!s.ganado && !m.has(norm(s.nombre))) m.set(norm(s.nombre), r.nombre)
    return m
  }, [cerca])
  const desde = ubicacion ?? (anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null) ?? casa ?? null
  const aqui = Boolean(siguiente && estaAqui(ubicacion, siguiente, radio))
  const q = useMemo(
    () => (resolved ? decidirQueHago({ day, siguiente, desde, ahoraMin, enCoche, lugares: places, coleccionDe, ofrecido, comida, hayAtardecer: Boolean(fraseAtardecer), aqui, route }) : null),
    [resolved, day, siguiente, desde?.lat, desde?.lng, ahoraMin, enCoche, places, coleccionDe, ofrecido, comida, fraseAtardecer, aqui, route], // eslint-disable-line react-hooks/exhaustive-deps
  )
  if (!q) return null
  const clave = claveDe(q)
  const nuevo = estaIluminado(q) && sugerencias && !vistos.includes(clave) && !leerVisto(claveVisto(route.id, day.id, clave))
  const abrir = () => {
    if (estaIluminado(q)) {
      try {
        window.localStorage.setItem(claveVisto(route.id, day.id, clave), '1')
      } catch {
        /* sin almacenamiento: se apaga hasta cerrar la pantalla */
      }
      setVistos((v) => [...v, clave])
    }
    setPaso('inicio')
    setAbierta(true)
  }
  const cerrar = () => {
    setAbierta(false)
    setPaso('inicio')
    setPropuestas([])
  }
  const anadir = (c: Extract<QueHago, { tipo: 'hueco' }>['candidato']) => {
    setPropuestas(proponerAnadir({ route, day, stop: stopDeCandidato(c), ctx, ahoraMin }))
    setIndice(0)
    setPaso('anadir')
  }

  return (
    <>
      <button type="button" onClick={abrir} data-hoy-que-hago-ahora data-iluminado={nuevo ? '1' : '0'} data-que-hago-tipo={q.tipo} aria-label={nuevo ? '¿Qué hago ahora? Hay algo nuevo' : '¿Qué hago ahora?'} className="relative flex h-[52px] flex-none items-center justify-center gap-[9px] text-[14.5px] font-bold" style={{ ...BOTON_BLANCO, borderRadius: 18, boxShadow: '0 4px 10px -8px rgba(110,80,24,.4)' }}>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full" style={{ background: 'linear-gradient(145deg,#FFF6DC,#D9BC6E 60%,#B58A2E)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.6 1 1.3 1 2.1h5c0-.8.3-1.5 1-2.1A6 6 0 0 0 12 3z" />
          </svg>
        </span>
        ¿Qué hago ahora?
        {nuevo && <span data-hoy-punto-dorado aria-hidden="true" className="absolute right-3.5 top-2.5 block h-2.5 w-2.5 rounded-full" style={{ background: '#D9A92E', boxShadow: '0 0 0 2px #FFFDF8' }} />}
      </button>
      {abierta && paso === 'inicio' && (
        <HojaV2 onCerrar={cerrar} etiqueta="¿Qué hago ahora?" fondo={MARFIL}>
          <div data-que-hago-hoja={q.tipo} className="flex flex-col gap-3">
            <Titulo texto="¿Qué hago ahora?" onCerrar={cerrar} />
            <div className="flex flex-col gap-3 rounded-[20px] p-4" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.45)' }}>
              {q.tipo === 'hueco' && (
                <>
                  <span data-que-hago-frase style={{ font: "400 24px/1.2 'Instrument Serif',serif", textWrap: 'balance' as never }}>{q.frase}</span>
                  {q.coleccion && (
                    <span data-que-hago-coleccion className="text-[12.5px] font-semibold" style={{ color: '#8E6820' }}>
                      Te da un pedazo de la colección «{q.coleccion}».
                    </span>
                  )}
                  <div className="flex gap-2">
                    <a href={urlComoLlegar(q.candidato.coordinates, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-que-hago-como-llegar className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
                      <Icono nombre="localizar" size={17} grosor={2} />
                      Cómo llegar
                    </a>
                    <button type="button" onClick={() => anadir(q.candidato)} data-que-hago-anadir className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_BLANCO}>
                      <Icono nombre="anadir" size={16} grosor={2} />
                      Añadir
                    </button>
                  </div>
                </>
              )}
              {q.tipo === 'comer' && (
                <>
                  <span data-que-hago-frase style={{ font: "400 24px/1.2 'Instrument Serif',serif", textWrap: 'balance' as never }}>
                    {q.meal.mealTime === 'dinner' ? 'Es hora de cenar y todavía no tenéis restaurante.' : 'Es hora de comer y todavía no tenéis restaurante.'} Te enseñamos los abiertos más cerca.
                  </span>
                  <button type="button" onClick={() => setPaso('comer')} data-que-hago-comer className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_ORO}>
                    Quiero {q.meal.mealTime === 'dinner' ? 'cenar' : 'comer'} ahora
                  </button>
                </>
              )}
              {q.tipo === 'atardecer' && fraseAtardecer && <ContenidoAtardecer route={route} day={day} frase={fraseAtardecer} ubicacion={ubicacion} enCoche={enCoche} />}
              {q.tipo === 'clavando' && (
                <>
                  <span data-que-hago-frase style={{ font: "400 24px/1.2 'Instrument Serif',serif", textWrap: 'balance' as never }}>{q.frase}</span>
                  {q.siguiente && hasRealCoordinates(q.siguiente.coordinates) && (
                    <a href={urlComoLlegar(q.siguiente.coordinates, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-que-hago-como-llegar className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
                      <Icono nombre="localizar" size={17} grosor={2} />
                      Cómo llegar
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </HojaV2>
      )}
      {abierta && paso === 'comer' && siguiente && <HojaComerAhora route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onCerrar={cerrar} />}
      {abierta && paso === 'anadir' && (
        <HojaPropuesta
          titulo="Añadir un sitio cercano"
          propuestas={propuestas}
          indice={indice}
          vacio={q.tipo === 'hueco' ? `Hoy no cabe ${displayStopName(q.candidato.nombre)} sin quitar algo importante. Mejor déjalo para otro momento.` : undefined}
          onOtra={() => setIndice((i) => (i + 1) % propuestas.length)}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            cerrar()
          }}
          onOriginal={() => {
            volverALaRutaOriginal()
            cerrar()
          }}
          onCerrar={cerrar}
        />
      )}
    </>
  )
}

/** El día acabado y con luz: el atardecer cercano (con fotos) y la cena. */
function ContenidoAtardecer({ route, day, frase, ubicacion, enCoche }: { route: Route; day: DayPlan; frase: FraseDeAtardecer; ubicacion: Coordinates | null; enCoche: boolean }) {
  const cena = day.meals.find((m) => m.mealTime === 'dinner')
  const sitio = cena?.chosenRestaurant ?? cena?.recommendedRestaurant ?? null
  return (
    <>
      <span data-que-hago-frase style={{ font: "400 24px/1.2 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        Todavía hay luz. {frase.texto.replace(/\.$/, '')}.
      </span>
      {frase.extra && <span className="text-[13.5px] leading-[1.4] text-[#1C2230]/75">{frase.extra}</span>}
      {frase.tipo === 'cerca' && (
        <div className="flex flex-col gap-2" data-que-hago-atardecer-sitios>
          {frase.cerca.map((c) => (
            <div key={c.nombre} data-hoy-atardecer-sitio className="flex items-center gap-3 rounded-2xl p-2" style={{ background: '#FBF3E2' }}>
              <FotoDeSitio nombre={c.nombre} ciudad={route.destination} alto={52} ancho={52} radio={14} />
              <span className="flex min-w-0 flex-1 flex-col">
                <b className="text-[14px] leading-[1.2]">{displayStopName(c.nombre)}</b>
                <span className="text-[12.5px] text-[#1C2230]/65">{c.modo === 'coche' ? `a ${c.minutos} min en coche` : `a ${c.minutos} min a pie`}</span>
              </span>
              <a href={urlComoLlegar(c.coordinates, ubicacion, c.modo === 'coche')} target="_blank" rel="noopener noreferrer" data-hoy-atardecer-como-llegar className="flex h-11 flex-none items-center rounded-xl px-3 text-[12.5px] font-bold no-underline" style={BOTON_ORO}>
                Cómo llegar
              </a>
            </div>
          ))}
        </div>
      )}
      <span data-que-hago-cena className="text-[14px] font-medium leading-[1.4]">
        {sitio ? `Y para cenar, os esperamos en ${displayStopName(sitio.name)}.` : 'Y para cenar, mira los restaurantes abiertos cerca desde «Cerca de ti».'}
      </span>
      {sitio && hasRealCoordinates(sitio.coordinates) && (
        <a href={urlComoLlegar(sitio.coordinates, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-que-hago-cena-como-llegar className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
          <Icono nombre="localizar" size={17} grosor={2} />
          Cómo llegar a la cena
        </a>
      )}
    </>
  )
}
