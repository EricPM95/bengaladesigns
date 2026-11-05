import { useEffect, useState } from 'react'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { responderCansados, tocaComoVais, type RespuestaCansados } from '../../../../lib/hoyComoVais'
import { urlComoLlegar } from '../../../../lib/hoyParada'
import { useDestinationPool } from '../../../../lib/useDestinationPool'
import { alCambiarSugerencias, sugerenciasDelCompanero } from '../../../../lib/sugerenciasCompanero'
import { AvisoDeHoy, CruzDeAviso } from './AvisosHoy'
import { HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'
import { AvisoMasTiempo } from './MasTiempo'

/**
 * (HOY2b, E, apartado 2) «¿CÓMO VAIS?» (16) Y «CANSADOS» (16b). UNA vez al día, después de comer, si quedan 2 paradas o más: [Con fuerzas] / [Cansados]. Se apaga con «Sugerencias del compañero».
 * Cansados nunca se queda sin respuesta (la cuenta, en `src/lib/hoyComoVais.ts`): «Vamos con calma» (quitar algo flexible u opcional y una pausa cerca), «Aguantad un poco» (una reserva cerca),
 * «¿Y si por hoy lo dejáis aquí?» (solo queda lo opcional) o «Tomaos un respiro» (+15 / +30, que no mueven la ruta). Todo es una propuesta con vista previa: nada se mueve sin [Aplicar] y después sale «Plan actualizado · Deshacer».
 */
const MARFIL = '#FBF3E2'
const BOTON_ORO = { background: 'linear-gradient(180deg,#F8EBC4,#DDBE7C 50%,#B58A2E)', color: '#3E2A0C', border: '1px solid #9A7228', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7),0 8px 14px -8px rgba(110,80,24,.8)' }
const BOTON_BLANCO = { background: '#FFFDF8', border: '1px solid rgba(181,138,46,.55)', color: '#1C2230', boxShadow: '0 4px 10px -6px rgba(110,80,24,.4)' }

const clave = (rutaId: string, diaId: string) => `trazo:hoy2b:como-vais:${rutaId}:${diaId}`
const leer = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k)
  } catch {
    return null
  }
}

export function ComoVais({ route, day, dateIso, ubicacion, enCoche, ahoraMin, conPase, comidaPendiente = false }: { route: Route; day: DayPlan; dateIso: string; comidaPendiente?: boolean; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; conPase: boolean }) {
  const [sugerencias, setSugerencias] = useState(sugerenciasDelCompanero())
  useEffect(() => alCambiarSugerencias(() => setSugerencias(sugerenciasDelCompanero())), [])
  const k = clave(route.id, day.id)
  const [respondido, setRespondido] = useState<string | null>(() => leer(k))
  useEffect(() => setRespondido(leer(k)), [k])
  const [hoja, setHoja] = useState<RespuestaCansados | null>(null)
  const [indice, setIndice] = useState(0)
  const [minutos, setMinutos] = useState<15 | 30 | null>(null)
  const ctx = useContexto(route, enCoche)
  const { places } = useDestinationPool(route.destination, true)
  const responder = (v: 'fuerzas' | 'cansados' | 'cerrado') => {
    try {
      window.localStorage.setItem(k, v)
    } catch {
      /* sin almacenamiento: vale hasta cerrar la pantalla */
    }
    setRespondido(v)
  }
  const cansados = () => {
    responder('cansados')
    setHoja(responderCansados({ route, day, ctx, ahoraMin, ubicacion, enCoche, dateIso, lugares: places }))
    setIndice(0)
    setMinutos(null)
  }
  const cerrarHoja = () => {
    setHoja(null)
    setMinutos(null)
  }
  const toca = conPase && sugerencias && respondido == null && tocaComoVais({ day, ahoraMin, comidaPendiente })
  const pausa = hoja?.pausa ?? null

  return (
    <>
      {toca && (
        <AvisoDeHoy id="como-vais" prio={3}>
          <div data-hoy-como-vais className="flex flex-none flex-col gap-3 rounded-[22px] p-4" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.45)' }}>
            <span className="flex items-start justify-between">
              <b style={{ font: "400 26px/1.1 'Instrument Serif',serif" }}>¿Cómo vais?</b>
              <CruzDeAviso onClick={() => responder('cerrado')} />
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => responder('fuerzas')} data-como-vais="fuerzas" className="flex h-[50px] min-w-0 flex-1 items-center justify-center rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_ORO}>
                Con fuerzas
              </button>
              <button type="button" onClick={cansados} data-como-vais="cansados" className="flex h-[50px] min-w-0 flex-1 items-center justify-center rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_BLANCO}>
                Cansados
              </button>
            </div>
          </div>
        </AvisoDeHoy>
      )}
      {hoja && (hoja.caso === 'calma' || hoja.caso === 'reserva') && hoja.propuesta && (
        <HojaPropuesta
          titulo={hoja.caso === 'calma' ? 'Vamos con calma' : 'Aguantad un poco'}
          propuestas={[hoja.propuesta]}
          indice={indice}
          etiquetaAplicar={hoja.caso === 'reserva' ? 'Pasar a otro día' : 'Aplicar'}
          extra={
            pausa && hoja.caso === 'calma' ? (
              <div data-cansados-pausa={pausa.tipo} className="flex items-center gap-3 rounded-[18px] p-3" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <b style={{ font: "700 14px 'Geist'" }}>Una pausa cerca</b>
                  <span className="text-[12.5px] leading-[1.35] text-[#1C2230]/65">{displayStopName(pausa.nombre)} · a {pausa.minutos} min {pausa.modo === 'coche' ? 'en coche' : 'a pie'}</span>
                </span>
                {hasRealCoordinates(pausa.coordinates) && (
                  <a href={urlComoLlegar(pausa.coordinates, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-cansados-pausa-como-llegar className="flex h-11 flex-none items-center rounded-full px-3 text-[12px] font-bold no-underline" style={BOTON_BLANCO}>
                    Cómo llegar
                  </a>
                )}
              </div>
            ) : null
          }
          onOtra={() => undefined}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            cerrarHoja()
          }}
          onOriginal={() => {
            volverALaRutaOriginal()
            cerrarHoja()
          }}
          onCerrar={cerrarHoja}
        />
      )}
      {hoja && hoja.caso === 'opcional' && hoja.propuesta && (
        <HojaV2 onCerrar={cerrarHoja} etiqueta="Por hoy" fondo={MARFIL}>
          <div data-cansados-caso="opcional" className="flex flex-col gap-3">
            <Titulo texto="¿Y si por hoy lo dejáis aquí?" onCerrar={cerrarHoja} />
            <span data-cansados-texto className="text-[14.5px] font-medium leading-[1.4]">Lo que queda no es imprescindible. Lo dejamos en «Si te sobra tiempo» por si luego os apetece.</span>
            <button
              type="button"
              onClick={() => {
                aplicarPropuesta(route.id, dateIso, hoja.propuesta as NonNullable<typeof hoja.propuesta>)
                cerrarHoja()
              }}
              data-cansados-terminar
              className="flex h-[50px] items-center justify-center rounded-2xl text-[15px] font-bold"
              style={BOTON_ORO}
            >
              Terminar el día
            </button>
            <button type="button" onClick={cerrarHoja} data-cansados-seguimos className="flex h-[50px] items-center justify-center rounded-2xl text-[14.5px] font-bold" style={BOTON_BLANCO}>
              Seguimos
            </button>
          </div>
        </HojaV2>
      )}
      {hoja && hoja.caso === 'respiro' && (
        <HojaV2 onCerrar={cerrarHoja} etiqueta="Tomaos un respiro" fondo={MARFIL}>
          <div data-cansados-caso="respiro" className="flex flex-col gap-3">
            <Titulo texto="Tomaos un respiro" onCerrar={cerrarHoja} />
            <span className="text-[14.5px] font-medium leading-[1.4]">No hay nada que quitar, así que mejor paráis un rato. ¿Cuánto?</span>
            <div className="flex gap-2">
              {([15, 30] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMinutos(m)} data-cansados-respiro={m} className="flex h-[50px] min-w-0 flex-1 items-center justify-center rounded-2xl text-[14px] font-bold" style={minutos === m ? BOTON_ORO : BOTON_BLANCO}>
                  +{m} min
                </button>
              ))}
            </div>
            {minutos && <AvisoMasTiempo key={minutos} route={route} day={day} dateIso={dateIso} paradaId="" minutos={minutos} plural ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onCerrar={() => undefined} fijo={false} autoCerrar={false} />}
            <button type="button" onClick={cerrarHoja} className="flex h-11 items-center justify-center text-[13px] font-semibold underline underline-offset-[3px] text-[#1C2230]/65">
              Vale, gracias
            </button>
          </div>
        </HojaV2>
      )}
    </>
  )
}

