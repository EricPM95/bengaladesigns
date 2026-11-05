import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, Route } from '../../../lib/types'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { fetchHourlyRain, type HourlyRain } from '../../../lib/rainForecast'
import { calcularAvisos, haParadoDeLlover, motivoDelCambio, normalizar, TEXTOS, volverAlPlan, type AvisoTiempo, type TipoAviso } from '../../../lib/avisosDelTiempo'
import type { Propuesta } from '../../../lib/hoyCambiarPlan'
import { aplicarPropuesta, deshacerUltimo, useCambiarPlanStore, volverALaRutaOriginal } from '../../../lib/hoyCambiarPlanAplicar'
import { proponerAlternativaDelTiempo, proponerVolverAlPlan } from '../../../lib/hoyLluvia'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { HojaPropuesta, useContexto } from './v2/CambiarPlan'
import { AvisoDeHoy, CruzDeAviso } from './v2/AvisosHoy'

/**
 * LOS AVISOS DEL TIEMPO EN DIRECTO (HOY1, apartado 6; H12, C14 y C15 de Design). Se engancha en HOY con UNA línea: `<AvisosDelTiempo route={route} day={day} dateIso={dateIso} />`.
 * Lluvia, nubes sobre un mirador del norte y viento fuerte en Lanzarote (los umbrales y los sitios, en `data/hoy/avisos_tiempo.json`); en Roma sigue el aviso de lluvia de siempre (RainAlert).
 * Nada se mueve solo: [Ver alternativa] enseña lo que entra y lo que sale, [Cambiar…] lo hace y deja el [Deshacer]; C15 «Ha parado de llover» ofrece volver al plan de antes.
 */
const TINTA = '#1C2230'
const DORADO_CLARO = '#F3D88F'
const clave = (tripId: string, fecha: string, id: string) => `trazo:hoy1:tiempo:${tripId}:${fecha}:${id}`
const yaDescartado = (k: string): boolean => {
  try {
    return window.localStorage.getItem(k) === '1'
  } catch {
    return false
  }
}
const descartar = (k: string) => {
  try {
    window.localStorage.setItem(k, '1')
  } catch {
    /* sin almacenamiento: vuelve a salir */
  }
}

type Inyeccion = Partial<Record<'probability' | 'precipitation' | 'cloud' | 'gust', number[]>>
/** En desarrollo, `window.__hoy1Tiempo = { cloud: [...24], gust: [...24], probability: [...], precipitation: [...] }` pone una previsión de mentira (lo que falte, a cero). */
function previsionInyectada(): HourlyRain | null {
  if (!import.meta.env.DEV) return null
  const d = (window as unknown as { __hoy1Tiempo?: Inyeccion }).__hoy1Tiempo
  if (!d) return null
  const v = (a?: number[]) => Array.from({ length: 24 }, (_, i) => a?.[i] ?? 0)
  return { probability: v(d.probability), precipitation: v(d.precipitation), cloud: v(d.cloud), gust: v(d.gust) }
}

/** La hora de ahora en el móvil (en desarrollo, `window.__hoy1HoraLocal` pone otra). */
function horaDeAhora(): number {
  const falsa = import.meta.env.DEV ? (window as unknown as { __hoy1HoraLocal?: number }).__hoy1HoraLocal : undefined
  return typeof falsa === 'number' ? falsa : new Date().getHours()
}

export const esDeLanzarote = (route: Route): boolean => normalizar(route.destination ?? '').includes('lanzarote')

const ICONO: Record<TipoAviso, string> = {
  lluvia: 'M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1A3.5 3.5 0 0 1 16 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
  nubes: 'M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1A3.5 3.5 0 0 1 16 18z',
  viento: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8',
}
const FONDO: Record<TipoAviso, string> = { lluvia: '#E7EEF6', nubes: '#EEEBE4', viento: '#EFE9DB' }

function Icono({ d }: { d: string }) {
  return (
    <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full" style={{ background: '#FFFDF8' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E6820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  )
}

/** H12: el cartel de un aviso, con [Ver alternativa]. */
function Cartel({ aviso, onVer, onCerrar }: { aviso: AvisoTiempo; onVer: () => void; onCerrar: () => void }) {
  // (HOY2) Con la X, el texto y el botón no caben en una fila: arriba el icono, el texto y la X; debajo, [Ver alternativa].
  return (
    <div data-aviso-tiempo={aviso.tipo} className='flex flex-none flex-col gap-1 rounded-[18px] py-2 pl-3.5 pr-2' style={{ background: FONDO[aviso.tipo], border: '1px solid rgba(28,34,48,.1)' }}>
      <div className='flex items-start gap-2.5'>
        <Icono d={ICONO[aviso.tipo]} />
        <span className='min-w-0 flex-1 pt-1 text-[13.5px] font-medium leading-[1.35]'>{aviso.texto}</span>
        <CruzDeAviso onClick={onCerrar} />
      </div>
      <button type='button' data-ver-alternativa onClick={onVer} className='mb-1 ml-[48px] flex h-11 flex-none items-center self-start rounded-full px-4 text-[12px] font-bold' style={{ background: TINTA, color: DORADO_CLARO }}>
        Ver alternativa
      </button>
    </div>
  )
}

/** El aviso de «lo hemos cambiado», con [Deshacer]; y 32b «Ha parado de llover» con [Ver plan] (que abre «¿Volvemos al plan?»). */
function CambioHecho({ day, paro, onDeshacer, onVerPlan, onCerrarParo }: { day: DayPlan; paro: boolean; onDeshacer: () => void; onVerPlan: () => void; onCerrarParo: () => void }) {
  const motivo = motivoDelCambio(day)
  if (paro && (motivo === 'lluvia' || motivo === 'descansar')) {
    return (
      <div data-ha-parado-de-llover className='flex flex-none flex-col gap-1 rounded-[18px] py-2 pl-3.5 pr-2' style={{ background: 'oklch(0.96 0.05 85)', border: '1px solid oklch(0.82 0.1 85)' }}>
        <div className='flex items-start gap-2.5'>
          <span className='flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full' style={{ background: '#FFFDF8' }}>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#8E6820' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <circle cx='12' cy='12' r='4' />
              <path d='M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4' />
            </svg>
          </span>
          <span className='min-w-0 flex-1 pt-1 text-[13.5px] font-medium leading-[1.35]'>{TEXTOS.ha_parado}</span>
          <CruzDeAviso onClick={onCerrarParo} />
        </div>
        <button type='button' data-ver-plan onClick={onVerPlan} className='mb-1 ml-[48px] flex h-11 flex-none items-center self-start rounded-full px-4 text-[12px] font-bold' style={{ background: TINTA, color: DORADO_CLARO }}>
          Ver plan
        </button>
      </div>
    )
  }
  const texto = motivo === 'descansar' ? 'Hoy toca descansar: hemos quitado lo que queda al aire libre.' : motivo === 'nubes' ? 'Hemos cambiado el mirador por otro sitio.' : motivo === 'viento' ? 'Hemos cambiado el sitio con viento por otro a resguardo.' : 'Estás usando el plan de lluvia.'
  return (
    <div data-tiempo-cambiado={motivo ?? ''} className='flex flex-none items-center gap-3 rounded-[18px] px-3.5 py-3' style={{ background: '#EEEBE4', border: '1px solid rgba(28,34,48,.1)' }}>
      <Icono d={ICONO[motivo === 'nubes' ? 'nubes' : motivo === 'viento' ? 'viento' : 'lluvia']} />
      <span className='min-w-0 flex-1 text-[13.5px] font-medium leading-[1.35]'>{texto}</span>
      <button type='button' data-deshacer-tiempo onClick={onDeshacer} className='flex h-11 flex-none items-center rounded-full px-3 text-[12px] font-bold' style={{ background: TINTA, color: DORADO_CLARO }}>
        Deshacer
      </button>
    </div>
  )
}

export function AvisosDelTiempo({ route, day, dateIso, ubicacion = null, enCoche = true }: { route: Route; day: DayPlan; dateIso: string; ubicacion?: Coordinates | null; enCoche?: boolean }) {
  void ubicacion
  const lanza = esDeLanzarote(route)
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const [meteo, setMeteo] = useState<HourlyRain | null>(null)
  // (HOY2, C) Lo que está abierto: la alternativa de un aviso (32, «Plan de lluvia») o «¿Volvemos al plan?» (32b), las dos con el formato común de las propuestas.
  const [abierto, setAbierto] = useState<string | null>(null)
  const [verPlan, setVerPlan] = useState(false)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [version, setVersion] = useState(0)
  const ctx = useContexto(route, enCoche)
  const at = day.stops.find((s) => hasRealCoordinates(s.coordinates))?.coordinates

  // La previsión: la de nuestro servidor (con la caché de siempre) y, cada 20 minutos, se vuelve a mirar. En desarrollo, una de mentira puesta a mano.
  useEffect(() => {
    if (!lanza || !at) return undefined
    let vivo = true
    const mirar = () => {
      const falsa = previsionInyectada()
      if (falsa) return setMeteo(falsa)
      void fetchHourlyRain(at, dateIso).then((m) => vivo && setMeteo(m))
    }
    mirar()
    const t = window.setInterval(mirar, 20 * 60 * 1000)
    const alCambiar = () => mirar()
    window.addEventListener('hoy1-tiempo', alCambiar)
    return () => {
      vivo = false
      window.clearInterval(t)
      window.removeEventListener('hoy1-tiempo', alCambiar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanza, at?.lat, at?.lng, dateIso])

  const hecho = motivoDelCambio(day)
  const avisos = useMemo(() => (meteo && lanza ? calcularAvisos(day, meteo, true) : []), [meteo, lanza, day])
  if (!lanza || !meteo) return null

  const cerrarHoja = () => {
    setAbierto(null)
    setVerPlan(false)
  }
  const aplicar = (pr: Propuesta) => {
    aplicarPropuesta(route.id, dateIso, pr)
    cerrarHoja()
    setVersion((v) => v + 1)
  }
  const original = () => {
    volverALaRutaOriginal()
    cerrarHoja()
    setVersion((v) => v + 1)
  }
  // [Deshacer] del aviso de «lo hemos cambiado»: si lo último del historial es el cambio del tiempo, se deshace por el historial (así «Volver a mi ruta original» sigue cuadrando); si no, como siempre.
  const deshacer = () => {
    const h = useCambiarPlanStore.getState().historial
    const ultima = h[h.length - 1]
    if (ultima && (ultima.tipo === 'lluvia' || ultima.tipo === 'vuelta_lluvia')) deshacerUltimo()
    else useRouteStore.getState().applyAdjustedDay(day.id, volverAlPlan(day))
    setVersion((v) => v + 1)
  }
  const hoja = (titulo: string) => <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio="No hay nada que cambiar: tu día sigue igual." onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onOriginal={original} onCerrar={cerrarHoja} />

  // Ya hay un cambio hecho por un aviso: su [Deshacer] y, si dejó de llover, 32b «Ha parado de llover» → [Ver plan] → «¿Volvemos al plan?».
  if (hecho) {
    const claveParo = clave(tripId, dateIso, 'paro')
    const paro = haParadoDeLlover(meteo, horaDeAhora()) && !yaDescartado(claveParo)
    return (
      <div key={version} className="flex flex-none flex-col gap-2.5">
        <AvisoDeHoy id="tiempo:hecho" prio={2}>
          <CambioHecho
            day={day}
            paro={paro}
            onDeshacer={deshacer}
            onVerPlan={() => {
              setPropuestas(proponerVolverAlPlan({ day, ctx }))
              setIndice(0)
              setVerPlan(true)
            }}
            onCerrarParo={() => {
              descartar(claveParo)
              setVersion((v) => v + 1)
            }}
          />
        </AvisoDeHoy>
        {verPlan && hoja('¿Volvemos al plan?')}
      </div>
    )
  }

  const visibles = avisos.filter((a) => !yaDescartado(clave(tripId, dateIso, a.id)))
  if (visibles.length === 0) return null
  return (
    <div key={version} className="flex flex-none flex-col gap-2.5">
      {visibles.map((a) => (
        <AvisoDeHoy key={a.id} id={`tiempo:${a.id}`} prio={2}>
          <Cartel
            aviso={a}
            onVer={() => {
              setPropuestas(proponerAlternativaDelTiempo({ day, aviso: a, ctx }))
              setIndice(0)
              setAbierto(a.id)
            }}
            onCerrar={() => {
              descartar(clave(tripId, dateIso, a.id))
              setVersion((v) => v + 1)
            }}
          />
          {abierto === a.id && hoja(a.tipo === 'lluvia' ? 'Plan de lluvia' : a.tipo === 'nubes' ? 'Cambio por las nubes' : 'Cambio por el viento')}
        </AvisoDeHoy>
      ))}
    </div>
  )
}
