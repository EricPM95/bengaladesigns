import { useEffect, useMemo, useRef, useState } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { hasRealCoordinates, haversineMeters } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import type { Propuesta } from '../../../../lib/hoyCambiarPlan'
import { proponerSolucion, quienCorrePeligro, textoDelPeligro } from '../../../../lib/hoyPeligro'
import { useRadioDeParada } from '../../../../lib/radiosDeHoy'
import { useSyncStore } from '../../../../store/useSyncStore'
import { Icono } from '../../../ui/Icono'
import { AvisoDeHoy, CruzDeAviso, useAvisoCerrado } from './AvisosHoy'
import { AvisoPlanActualizado, HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'

/**
 * HOY2 (agente C, apartado 5): «Tu entrada… corre peligro» (29 y 29b) y «¿Qué hacemos con…?» (28).
 *  · `AvisoDePeligro`: aviso de arriba (prioridad 1, el más urgente), con su X y [Ver solución] → «Una solución» (propuesta con el formato común). El que se cierra no vuelve ese día, salvo que otra entrada corra peligro.
 *  · `PreguntaParadaNoMarcada`: si estuviste en una parada y te alejas sin marcarla, pregunta UNA vez: [Ya lo visité] / [Lo dejo pendiente] / [Ahora no].
 */
const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const DORADO_CLARO = '#F3D88F'

/* ------------------------------------------------------------------ */
/* 29 y 29b: la entrada en peligro                                      */
/* ------------------------------------------------------------------ */

export function AvisoDePeligro({ route, day, dateIso, ubicacion, enCoche, ahoraMin }: { route: Route; day: DayPlan; dateIso: string; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number }) {
  const ctx = useContexto(route, enCoche)
  const peligro = useMemo(() => quienCorrePeligro({ day, ctx, ahoraMin, ubicacion, enCoche }), [day, ctx, ahoraMin, ubicacion, enCoche])
  const [cerrado, cerrar] = useAvisoCerrado(`${day.id}:${dateIso}`, `peligro-${peligro?.stop.id ?? 'ninguno'}`)
  const [abierta, setAbierta] = useState(false)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [textoVuelta, setTextoVuelta] = useState<string | null>(null)
  useEffect(() => {
    if (!textoVuelta) return undefined
    const id = window.setTimeout(() => setTextoVuelta(null), 6000)
    return () => window.clearTimeout(id)
  }, [textoVuelta])
  if (!peligro) return textoVuelta ? <AvisoPlanActualizado texto={textoVuelta} conDeshacer={false} /> : null
  const esTurno = Boolean(peligro.stop.isFreeTour)
  const horaTexto = `${Math.floor(peligro.horaMin / 60)}:${String(peligro.horaMin % 60).padStart(2, '0')}`
  const ver = () => {
    setPropuestas(proponerSolucion({ day, peligro, ctx, ahoraMin, ubicacion }))
    setIndice(0)
    setAbierta(true)
  }
  return (
    <>
      {!cerrado && (
        <AvisoDeHoy id={`peligro:${peligro.stop.id}`} prio={1}>
          <div data-hoy-peligro={peligro.stop.id} className="flex flex-none flex-col gap-1 rounded-[18px] py-2 pl-3.5 pr-2" style={{ background: 'rgb(var(--accent-red) / .07)', border: '1px solid rgb(var(--accent-red) / .3)' }}>
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-white" style={{ background: 'rgb(var(--accent-red))' }}>
                <Icono nombre="reloj" size={16} />
              </span>
              <span data-hoy-peligro-texto className="min-w-0 flex-1 pt-1 text-[13.5px] font-medium leading-[1.35]">{textoDelPeligro(peligro, esTurno)}</span>
              <CruzDeAviso onClick={cerrar} />
            </div>
            <button type="button" onClick={ver} data-peligro-ver-solucion className="mb-1 ml-[42px] flex h-11 flex-none items-center self-start rounded-full px-4 text-[12px] font-bold" style={{ background: TINTA, color: DORADO_CLARO }}>
              Ver solución
            </button>
          </div>
        </AvisoDeHoy>
      )}
      {abierta && (
        <HojaPropuesta
          titulo="Una solución"
          propuestas={propuestas}
          indice={indice}
          vacio={`Esta vez no hay un cambio pequeño que lo arregle. Si no llegas a las ${horaTexto}, mira si te dejan entrar un poco más tarde.`}
          onOtra={() => setIndice((i) => (i + 1) % propuestas.length)}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            setAbierta(false)
          }}
          onOriginal={() => {
            const n = volverALaRutaOriginal()
            setAbierta(false)
            setTextoVuelta(n > 0 ? 'Tu ruta vuelve a ser la original.' : 'Tu ruta ya es la original.')
          }}
          onCerrar={() => setAbierta(false)}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 28: ¿Qué hacemos con…?                                               */
/* ------------------------------------------------------------------ */

const clave = (rutaId: string, diaId: string, stopId: string) => `trazo:hoy2:no-marcada:${rutaId}:${diaId}:${stopId}`
const leer = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k)
  } catch {
    return null
  }
}
const escribir = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v)
  } catch {
    /* sin almacenamiento: vale hasta cerrar la pantalla */
  }
}
/** Cuánto te tienes que alejar del radio del sitio para que cuente como «te has ido» (m). */
export const ALEJARSE_M = 400

/** Estuviste en una parada (dentro de su radio) y ahora estás lejos sin haberla marcado: pregunta UNA vez (queda apuntado en el móvil). */
export function PreguntaParadaNoMarcada({ route, day, siguiente, ubicacion, onVisto }: { route: Route; day: DayPlan; siguiente: Stop | null; ubicacion: Coordinates | null; onVisto: (stop: Stop) => void }) {
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const radio = useRadioDeParada(tripId, siguiente?.name ?? '')
  const [pregunta, setPregunta] = useState<Stop | null>(null)
  const yaPreguntadas = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!siguiente || siguiente.checkedInAt || siguiente.saltada || !ubicacion || !hasRealCoordinates(ubicacion) || !hasRealCoordinates(siguiente.coordinates)) return
    const k = clave(route.id, day.id, siguiente.id)
    const estado = leer(k)
    if (estado === 'preguntada' || yaPreguntadas.current.has(k)) return
    const d = haversineMeters(ubicacion, siguiente.coordinates)
    if (d <= radio) {
      if (estado !== 'cerca') escribir(k, 'cerca')
      return
    }
    if (estado === 'cerca' && d > radio + ALEJARSE_M) {
      escribir(k, 'preguntada')
      yaPreguntadas.current.add(k)
      setPregunta(siguiente)
    }
  }, [route.id, day.id, siguiente, ubicacion, radio])
  if (!pregunta) return null
  const nombre = displayStopName(pregunta.name)
  const cerrar = () => setPregunta(null)
  const Fila = ({ dato, titulo, sub, onClick }: { dato: string; titulo: string; sub: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} data-no-marcada-opcion={dato} className="flex min-h-[60px] flex-col justify-center gap-0.5 rounded-[18px] px-4 py-2.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
      <b style={{ font: "400 21px/1.1 'Instrument Serif',serif" }}>{titulo}</b>
      <span className="text-[12.5px] text-[#1C2230]/60">{sub}</span>
    </button>
  )
  return (
    <HojaV2 onCerrar={cerrar} etiqueta={`¿Qué hacemos con ${nombre}?`} fondo={MARFIL}>
      <div data-no-marcada className="flex flex-col gap-3">
        <Titulo texto={`¿Qué hacemos con ${nombre}?`} onCerrar={cerrar} />
        <span className="text-[13.5px] leading-[1.4] text-[#1C2230]/70">Parece que has pasado de largo sin marcarlo.</span>
        <Fila
          dato="visite"
          titulo="Ya lo visité"
          sub="Lo marcamos como visto"
          onClick={() => {
            onVisto(pregunta)
            cerrar()
          }}
        />
        <Fila dato="pendiente" titulo="Lo dejo pendiente" sub="Se queda en «Tu día»" onClick={cerrar} />
        <Fila dato="ahora_no" titulo="Ahora no" sub="No volvemos a preguntar" onClick={cerrar} />
      </div>
    </HojaV2>
  )
}
