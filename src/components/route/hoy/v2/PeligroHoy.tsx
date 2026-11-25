import { useEffect, useMemo, useRef, useState } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { hasRealCoordinates, haversineMeters } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { aplicarPropuesta } from '../../../../lib/hoyCambiarPlanAplicar'
import { aHora, escalonDeRetraso, proponerRetraso, retrasoDeAhora, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { conArticulo, proponerSolucion, revisarEntradas, type Peligro } from '../../../../lib/hoyPeligro'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { useRadioDeParada } from '../../../../lib/radiosDeHoy'
import { useSyncStore } from '../../../../store/useSyncStore'
import { AvisoDeHoy, D_AVISO, FilaDeAviso, avisoCerrado, cerrarAvisoDelDia } from './AvisosHoy'
import { AvisoPlanActualizado, HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaSolucion } from './HojaSolucion'
import { HojaDeCierre, HojaVoyConRetraso, retrasoConHojaNueva } from './HojaDelDia'
import { HojaV2 } from './HojasV2'

/**
 * HOY2 (agente C, apartado 5) y V54: «Tu entrada…» y «¿Qué hacemos con…?» (28).
 *  · `AvisoDeEntradas`: los avisos de las entradas con hora, según su PUNTUALIDAD (`puntualidadEntradas.ts`, comprobada en la web de cada sitio):
 *      – ESTRICTA que no llegas → ROJO «Si no sales ya, no llegas a tu entrada de las 9:15 en el Coliseo» + [Ver solución] (la hoja «Pasar a otro día», `HojaSolucion`). Dos o más: «2 entradas corren peligro · Coliseo 9:15 · Museos Vaticanos 11:00».
 *      – ESTRICTA cuya hora ya ha pasado → AMARILLO «Tu entrada de las 9:15 en el Coliseo ya ha pasado» (nada de «peligro» ni de protegerla).
 *      – LIBRE o con margen, con retraso → nunca «peligro»: VERDE que se va a los 5 s si el retraso cabe en el día; AMARILLO «Vas con retraso…» + [Ver cómo queda el día] si ya no cabe todo.
 *  · `PreguntaParadaNoMarcada`: si estuviste en una parada y te alejas sin marcarla, pregunta UNA vez: [Ya lo visité] / [Lo dejo pendiente] / [Ahora no].
 */
const MARFIL = '#FBF3E2'

/* ------------------------------------------------------------------ */
/* Las entradas con hora                                                */
/* ------------------------------------------------------------------ */

const alSitio = (s: Stop): string => conArticulo(s).replace(/^el /, 'al ').replace(/^(?!al )/, 'a ')

const horaTexto = (min: number) => aHora(min, false)
const quita = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

export function AvisoDeEntradas({ route, day, dateIso, ubicacion, enCoche, ahoraMin }: { route: Route; day: DayPlan; dateIso: string; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number }) {
  const ctx = useContexto(route, enCoche)
  const rev = useMemo(() => revisarEntradas({ day, ctx, ahoraMin, ubicacion, enCoche }), [day, ctx, ahoraMin, ubicacion, enCoche])
  const dia = `${day.id}:${dateIso}`
  const [, repintar] = useState(0)
  const cerrar = (clave: string) => {
    cerrarAvisoDelDia(dia, clave)
    repintar((n) => n + 1)
  }
  const [hoja, setHoja] = useState<null | 'solucion' | 'retraso' | 'pasada'>(null)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [textoVuelta, setTextoVuelta] = useState<string | null>(null)
  useEffect(() => {
    if (!textoVuelta) return undefined
    const id = window.setTimeout(() => setTextoVuelta(null), 6000)
    return () => window.clearTimeout(id)
  }, [textoVuelta])

  const peligros = rev.peligros
  const claveP = `peligro-${peligros.map((p) => p.stop.id).join('+')}`
  const pasadas = rev.pasadas
  const claveX = `pasada-${pasadas.map((p) => p.stop.id).join('+')}`
  const margen = rev.conMargen[0] ?? null
  const claveM = `margen-${margen?.stop.id ?? 'ninguno'}-${margen?.cabe ? 'cabe' : 'nocabe'}`

  const solucionPara = (p: Peligro, diaDe?: Record<string, string>) => proponerSolucion({ route, day, peligro: p, ctx, ahoraMin, ubicacion, diaDe })
  const verSolucion = () => {
    setPropuestas(solucionPara(peligros[0]))
    setHoja('solucion')
  }
  const verRetraso = () => {
    const sig = numberedStopsOf(day).find((s) => !s.saltada && !s.checkedInAt)
    if (!sig) return
    setPropuestas(proponerRetraso({ route, day, paradaId: sig.id, minutos: escalonDeRetraso(retrasoDeAhora(ahoraMin, sig.time)), ctx, ahoraMin }))
    setHoja('retraso')
  }
  const cierra = () => setHoja(null)
  const esTurno = (s: Stop) => Boolean(s.isFreeTour)
  const palabra = (s: Stop) => (esTurno(s) ? 'turno' : 'entrada')
  const lista = (xs: { stop: Stop; horaMin: number }[]) => xs.map((x) => `${displayStopName(x.stop.name)} ${quita(x.horaMin)}`).join(' · ')

  return (
    <>
      {textoVuelta && <AvisoPlanActualizado texto={textoVuelta} conDeshacer={false} />}
      {peligros.length > 0 && !avisoCerrado(dia, claveP) && (
        <AvisoDeHoy id="peligro" prio={1}>
          <FilaDeAviso
            tono="rojo"
            icono={D_AVISO.reloj}
            titulo={peligros.length === 1 ? `Si no sales ya, no llegas a tu ${palabra(peligros[0].stop)} de las ${horaTexto(peligros[0].horaMin)} en ${conArticulo(peligros[0].stop)}` : `${peligros.length} entradas corren peligro`}
            sub={peligros.length > 1 ? lista(peligros) : undefined}
            boton={{ texto: 'Ver solución', onClick: verSolucion, datos: { 'data-peligro-ver-solucion': '1' } }}
            onIrse={() => cerrar(claveP)}
            datos={{ 'data-hoy-peligro': peligros[0].stop.id }}
          />
        </AvisoDeHoy>
      )}
      {pasadas.length > 0 && !avisoCerrado(dia, claveX) && (
        <AvisoDeHoy id="pasada" prio={2}>
          <FilaDeAviso
            tono="amarillo"
            icono={D_AVISO.reloj}
            titulo={pasadas.length === 1 ? `Tu ${palabra(pasadas[0].stop)} de las ${horaTexto(pasadas[0].horaMin)} en ${conArticulo(pasadas[0].stop)} ya ha pasado` : `${pasadas.length} entradas ya han pasado`}
            sub={pasadas.length > 1 ? lista(pasadas) : undefined}
            boton={{ texto: 'Ver', onClick: () => setHoja('pasada'), datos: { 'data-pasada-ver': '1' } }}
            onIrse={() => cerrar(claveX)}
            datos={{ 'data-hoy-entrada-pasada': pasadas[0].stop.id }}
          />
        </AvisoDeHoy>
      )}
      {margen && !avisoCerrado(dia, claveM) && (
        <AvisoDeHoy id="margen" prio={margen.cabe ? 3.5 : 2}>
          {margen.cabe ? (
            <FilaDeAviso tono="verde" icono={D_AVISO.ok} titulo={`Tranquilo, tienes margen: ${alSitio(margen.stop)} puedes entrar más tarde y tu día sigue igual.`} autoIrse onIrse={() => cerrar(claveM)} datos={{ 'data-hoy-entrada-margen': 'cabe' }} />
          ) : (
            <FilaDeAviso
              tono="amarillo"
              icono={D_AVISO.reloj}
              titulo="Vas con retraso"
              sub={`${alSitio(margen.stop)} puedes entrar más tarde sin problema, pero hoy quizá no te dé tiempo a todo.`}
              boton={{ texto: 'Ver cómo queda el día', onClick: verRetraso, datos: { 'data-margen-ver-dia': '1' } }}
              onIrse={() => cerrar(claveM)}
              datos={{ 'data-hoy-entrada-margen': 'nocabe' }}
            />
          )}
        </AvisoDeHoy>
      )}
      {hoja === 'solucion' && peligros[0] && (
        <HojaSolucion
          route={route}
          day={day}
          enCoche={enCoche}
          propuestas={propuestas}
          vacio={`Esta vez no hay un cambio pequeño que lo arregle. Si no llegas a las ${quita(peligros[0].horaMin)}, mira si te dejan entrar un poco más tarde.`}
          recalcular={(diaDe) => solucionPara(peligros[0], diaDe).filter((p) => Object.keys(diaDe).every((id) => p.quitadas.some((q) => q.id === id)))}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            cierra()
          }}
          onCerrar={cierra}
        />
      )}
      {hoja === 'retraso' && (retrasoConHojaNueva(propuestas) ? (
        <HojaVoyConRetraso route={route} day={day} dateIso={dateIso} enCoche={enCoche} propuestas={propuestas} ahoraMin={ahoraMin} onCerrar={cierra} />
      ) : (
        <HojaPropuesta titulo="Voy con retraso" propuestas={propuestas} indice={0} vacio="No hay nada más que ajustar hoy: tu día sigue igual." onOtra={() => undefined} onAplicar={(pr) => { aplicarPropuesta(route.id, dateIso, pr); cierra() }} onCerrar={cierra} />
      ))}
      {hoja === 'pasada' && pasadas[0] && <HojaDeCierre variante="h1" route={route} day={day} dateIso={dateIso} enCoche={enCoche} ahoraMin={ahoraMin} onCerrar={cierra} />}

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
