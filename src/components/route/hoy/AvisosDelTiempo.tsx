import { useEffect, useMemo, useState } from 'react'
import type { DayPlan, Route } from '../../../lib/types'
import { hasRealCoordinates } from '../../../lib/distanceMock'
import { fetchHourlyRain, type HourlyRain } from '../../../lib/rainForecast'
import { calcularAvisos, aplicarCambio, haParadoDeLlover, listaDeNombres, motivoDelCambio, normalizar, TEXTOS, volverAlPlan, type AvisoTiempo, type TipoAviso } from '../../../lib/avisosDelTiempo'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { ParadaFoto, ParadaFotoDeParada } from './v2/ParadaFoto'

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

const BOTON_OSCURO = 'flex h-[46px] min-h-[46px] flex-1 items-center justify-center rounded-full text-[14px] font-semibold text-[#FFFDF8]'
/** El mismo botón, a lo ancho, cuando va en columna (sin `flex-1`, que en vertical lo encogería). */
const BOTON_ANCHO = 'flex h-[46px] min-h-[46px] w-full flex-none items-center justify-center rounded-full text-[14px] font-semibold text-[#FFFDF8]'

/** H12: el cartel de un aviso, con [Ver alternativa]. */
function Cartel({ aviso, onVer }: { aviso: AvisoTiempo; onVer: () => void }) {
  return (
    <div data-aviso-tiempo={aviso.tipo} className="flex flex-none items-center gap-3 rounded-[18px] px-3.5 py-3" style={{ background: FONDO[aviso.tipo], border: '1px solid rgba(28,34,48,.1)' }}>
      <Icono d={ICONO[aviso.tipo]} />
      <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.35]">{aviso.texto}</span>
      <button type="button" data-ver-alternativa onClick={onVer} className="flex h-11 flex-none items-center rounded-full px-3 text-[12px] font-bold" style={{ background: TINTA, color: DORADO_CLARO }}>
        Ver alternativa
      </button>
    </div>
  )
}

/** C14: «Va a llover» con lo que entra y lo que sale, y los botones. */
function Alternativa({ aviso, day, dateIso, onCambiar, onDescansar, onSeguir }: { aviso: AvisoTiempo; day: DayPlan; dateIso: string; onCambiar: () => void; onDescansar: () => void; onSeguir: () => void }) {
  const salen = aviso.salen.map((s) => day.stops.find((p) => p.id === s.id)).filter((p): p is NonNullable<typeof p> => Boolean(p))
  const hayEntra = aviso.entra.length > 0
  const etiqueta = aviso.tipo === 'lluvia' ? 'Cambiar al plan de lluvia' : aviso.tipo === 'nubes' ? 'Hacer el cambio' : 'Cambiar de sitio'
  const titulo = aviso.tipo === 'lluvia' ? `Va a llover ${aviso.cuando}` : aviso.tipo === 'nubes' ? 'Hay nubes en el norte' : 'Viento fuerte'
  return (
    <div data-alternativa-tiempo={aviso.tipo} className="flex flex-none flex-col gap-3">
      <div className="flex items-center gap-3 rounded-[22px] px-3.5 py-3" style={{ background: 'oklch(0.95 0.025 230)', border: '1px solid oklch(0.82 0.06 230)' }}>
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-white" style={{ background: 'oklch(0.56 0.1 230)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONO[aviso.tipo]} />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[14.5px] font-semibold leading-[1.2]">{titulo}</span>
          <span className="text-[12.5px] leading-[1.35] text-text/70">{hayEntra ? 'Te proponemos:' : aviso.tipo === 'lluvia' ? TEXTOS.descansar : 'Lo dejamos a tu criterio.'}</span>
        </span>
      </div>
      {(hayEntra || salen.length > 0) && (
        <div className="flex gap-2.5">
          {hayEntra && (
            <div data-entra className="flex flex-1 flex-col gap-2.5 rounded-[20px] p-3" style={{ background: 'oklch(0.96 0.03 150)', border: '1px solid oklch(0.82 0.07 150)' }}>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: 'oklch(0.55 0.11 150)' }}>
                Entra
              </span>
              <span className="flex gap-1.5">
                {aviso.entra.map((e) => (
                  <ParadaFoto key={e.clave} nombre={e.nombre} vista={false} marca={false} size={aviso.entra.length > 1 ? 40 : 56} />
                ))}
              </span>
              <span className="text-[14px] font-medium leading-[1.2]">{listaDeNombres(aviso.entra.map((e) => e.nombre))}</span>
              <span className="text-[12px] text-text/60">
                {aviso.entra.map((e) => `${Math.floor(e.minutos / 60) ? `${Math.floor(e.minutos / 60)} h ` : ''}${e.minutos % 60 ? `${e.minutos % 60} min` : ''}`.trim()).join(' · ')}
                {aviso.entra.some((e) => e.reserva) ? ' · con reserva' : ''}
              </span>
            </div>
          )}
          <div data-sale className="flex flex-1 flex-col gap-2.5 rounded-[20px] p-3" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)' }}>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: 'rgb(var(--accent-red))' }}>
              Sale
            </span>
            <span className="flex gap-1.5">
              {salen.map((p) => (
                <ParadaFotoDeParada key={p.id} parada={p} ciudad={day.city} dateIso={dateIso} vista={false} marca={false} size={salen.length > 1 ? 40 : 56} />
              ))}
            </span>
            <span className="text-[14px] font-medium leading-[1.2]">{listaDeNombres(aviso.salen.map((s) => s.nombre))}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {hayEntra && (
          <button type="button" data-cambiar-plan onClick={onCambiar} className={BOTON_ANCHO} style={{ background: TINTA }}>
            {etiqueta}
          </button>
        )}
        {aviso.tipo === 'lluvia' && (
          <button type="button" data-hoy-descansar onClick={onDescansar} className={hayEntra ? 'self-center py-1.5 text-[13px] font-medium text-text/60 underline underline-offset-[3px]' : BOTON_ANCHO} style={hayEntra ? undefined : { background: TINTA }}>
            {TEXTOS.descansar}
          </button>
        )}
        <button type="button" data-seguir-igual onClick={onSeguir} className="min-h-11 self-center py-1 text-[13px] font-medium text-text/60 underline underline-offset-[3px]">
          Seguir igual
        </button>
      </div>
    </div>
  )
}

/** El cartel de «lo hemos cambiado», con [Deshacer]; y C15 «Ha parado de llover». */
function CambioHecho({ day, paro, onDeshacer, onSeguirAsi }: { day: DayPlan; paro: boolean; onDeshacer: () => void; onSeguirAsi: () => void }) {
  const motivo = motivoDelCambio(day)
  if (paro && (motivo === 'lluvia' || motivo === 'descansar')) {
    return (
      <div data-ha-parado-de-llover className="flex flex-none flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[22px] px-3.5 py-3" style={{ background: 'oklch(0.96 0.05 85)', border: '1px solid oklch(0.82 0.1 85)' }}>
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-white" style={{ background: 'oklch(0.5 0.12 65)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[14.5px] font-semibold leading-[1.2]">{TEXTOS.ha_parado}</span>
            <span className="text-[12.5px] leading-[1.35] text-text/70">{TEXTOS.ha_parado_sub}</span>
          </span>
        </div>
        <div className="flex gap-2.5">
          <button type="button" data-volver-al-plan onClick={onDeshacer} className={BOTON_OSCURO} style={{ background: TINTA }}>
            Volver al plan
          </button>
          <button type="button" data-seguir-asi onClick={onSeguirAsi} className="flex h-[46px] flex-1 items-center justify-center rounded-full text-[14px] font-semibold" style={{ border: '1.5px solid rgba(28,34,48,.22)', color: TINTA }}>
            Seguir así
          </button>
        </div>
      </div>
    )
  }
  const texto = motivo === 'descansar' ? 'Hoy toca descansar: hemos quitado lo que queda al aire libre.' : motivo === 'nubes' ? 'Hemos cambiado el mirador por otro sitio.' : motivo === 'viento' ? 'Hemos cambiado el sitio con viento por otro a resguardo.' : 'Estás usando el plan de lluvia.'
  return (
    <div data-tiempo-cambiado={motivo ?? ''} className="flex flex-none items-center gap-3 rounded-[18px] px-3.5 py-3" style={{ background: '#EEEBE4', border: '1px solid rgba(28,34,48,.1)' }}>
      <Icono d={ICONO[motivo === 'nubes' ? 'nubes' : motivo === 'viento' ? 'viento' : 'lluvia']} />
      <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.35]">{texto}</span>
      <button type="button" data-deshacer-tiempo onClick={onDeshacer} className="flex h-11 flex-none items-center rounded-full px-3 text-[12px] font-bold" style={{ background: TINTA, color: DORADO_CLARO }}>
        Deshacer
      </button>
    </div>
  )
}

export function AvisosDelTiempo({ route, day, dateIso }: { route: Route; day: DayPlan; dateIso: string }) {
  const lanza = esDeLanzarote(route)
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const [meteo, setMeteo] = useState<HourlyRain | null>(null)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
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

  const aplicar = (aviso: AvisoTiempo, descansar = false) => {
    useRouteStore.getState().applyAdjustedDay(day.id, aplicarCambio(day, aviso, descansar))
    setAbierto(null)
  }
  const deshacer = () => {
    useRouteStore.getState().applyAdjustedDay(day.id, volverAlPlan(day))
    setVersion((v) => v + 1)
  }

  // Ya hay un cambio hecho por un aviso: su [Deshacer] y, si dejó de llover, C15.
  if (hecho) {
    const claveParo = clave(tripId, dateIso, 'paro')
    const paro = haParadoDeLlover(meteo, horaDeAhora()) && !yaDescartado(claveParo)
    return (
      <div key={version} className="flex flex-none flex-col gap-2.5">
        <CambioHecho
          day={day}
          paro={paro}
          onDeshacer={deshacer}
          onSeguirAsi={() => {
            descartar(claveParo)
            setVersion((v) => v + 1)
          }}
        />
      </div>
    )
  }

  const visibles = avisos.filter((a) => !yaDescartado(clave(tripId, dateIso, a.id)))
  if (visibles.length === 0) return null
  return (
    <div key={version} className="flex flex-none flex-col gap-2.5">
      {visibles.map((a) =>
        abierto === a.id ? (
          <Alternativa
            key={a.id}
            aviso={a}
            day={day}
            dateIso={dateIso}
            onCambiar={() => aplicar(a)}
            onDescansar={() => aplicar({ ...a, entra: [], salen: a.salen }, true)}
            onSeguir={() => {
              descartar(clave(tripId, dateIso, a.id))
              setAbierto(null)
            }}
          />
        ) : (
          <Cartel key={a.id} aviso={a} onVer={() => setAbierto(a.id)} />
        ),
      )}
    </div>
  )
}
