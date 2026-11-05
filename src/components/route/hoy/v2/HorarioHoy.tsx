import { useMemo, useState } from 'react'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { useDatosDeHorario } from '../../../../lib/horarioDeParada'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { aHora, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { paradasJustasDeHoy, parrafoDeHoy, proponerAdelantar, quienLlegaTarde, textoDelAviso, ventanaDeHorario, type VentanaDeHorario } from '../../../../lib/hoyHorarios'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { AvisoDeHoy, CruzDeAviso, useAvisoCerrado } from './AvisosHoy'
import { HojaPropuesta, useContexto } from './CambiarPlan'

/**
 * (HOY2b 8b) LOS AVISOS DE HORARIO EN HOY. Los cálculos viven en `src/lib/hoyHorarios.ts`; aquí, lo que se ve:
 *  · `TarjetaDeHorariosDeHoy` (por la mañana, prioridad 5): una tarjeta tranquila con 2 sitios como mucho y su X: «Para hoy: la Cueva de los Verdes cierra a las 18:00. Vamos con margen; si os retrasáis, os avisamos a tiempo.»
 *  · `AvisoDeHorarioEnDirecto` (con la hora real, prioridad 2): «A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado» + [Ver solución] (adelantarla quitando antes algo flexible; propuesta con vista previa y Deshacer). Una vez por sitio y día; si se ve por fuera, no avisa.
 */
const TINTA = '#1C2230'
const DORADO_CLARO = '#F3D88F'

/** Las ventanas de horario de lo que queda por hacer hoy (solo visitas por dentro con horario de verdad). */
export function useVentanasDeHoy(route: Route, day: DayPlan, dateIso: string): VentanaDeHorario[] {
  const datos = useDatosDeHorario(day.city || route.destination)
  const mes = useRouteStore((s) => s.route?.answers.month ?? null)
  return useMemo(
    () =>
      numberedStopsOf(day)
        .map((stop) => ventanaDeHorario({ stop, datos, dateIso, mes }))
        .filter((v): v is VentanaDeHorario => v !== null),
    [day, datos, dateIso, mes],
  )
}

/** Por la mañana: «Para hoy: … cierra a las …». */
export function TarjetaDeHorariosDeHoy({ day, dateIso, ventanas, visible }: { day: DayPlan; dateIso: string; ventanas: VentanaDeHorario[]; visible: boolean }) {
  const justas = useMemo(() => paradasJustasDeHoy(ventanas), [ventanas])
  const [cerrado, cerrar] = useAvisoCerrado(`${day.id}:${dateIso}`, 'horario-manana')
  // (Prioridad 5, como la lista de «cierra hoy a las…»; el id hace que sea la primera de las de su prioridad.)
  if (!visible || cerrado || justas.length === 0) return null
  return (
    <AvisoDeHoy id="cierre:0-para-hoy" prio={5}>
      <div data-hoy-horarios-manana={justas.length} className="flex flex-none items-start gap-3 rounded-[18px] py-[9px] pl-3 pr-2" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
        <span className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-[10px]" style={{ background: 'rgba(28,34,48,.07)', color: TINTA }}>
          <Icono nombre="reloj" size={16} grosor={1.7} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1.5">
          {justas.map((j, i) => (
            <span key={j.v.stop.id} data-hoy-horarios-parrafo={j.tipo} className="text-[13px] leading-[1.4]" style={{ textWrap: 'pretty' as never }}>
              {parrafoDeHoy(j, i === 0)}
            </span>
          ))}
        </span>
        <CruzDeAviso onClick={cerrar} />
      </div>
    </AvisoDeHoy>
  )
}

/** En directo: «A este ritmo llegarías a … cuando ya ha cerrado» con [Ver solución]. */
export function AvisoDeHorarioEnDirecto({ route, day, dateIso, ubicacion, enCoche, ahoraMin, ventanas }: { route: Route; day: DayPlan; dateIso: string; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; ventanas: VentanaDeHorario[] }) {
  const ctx = useContexto(route, enCoche)
  const tarde = useMemo(() => quienLlegaTarde({ day, ctx, ahoraMin, ubicacion, enCoche, ventanas }), [day, ctx, ahoraMin, ubicacion, enCoche, ventanas])
  // Una vez por sitio y día: el que se cierra (o se resuelve) no vuelve ese día.
  const [cerrado, cerrar] = useAvisoCerrado(`${day.id}:${dateIso}`, `horario-vivo-${tarde?.v.stop.id ?? 'ninguno'}`)
  const [abierta, setAbierta] = useState(false)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  if (!tarde) return null
  const { titulo, hora } = textoDelAviso(tarde)
  const ver = () => {
    setPropuestas(proponerAdelantar({ day, tarde, ctx, ahoraMin, ubicacion, ventanas }))
    setIndice(0)
    setAbierta(true)
  }
  return (
    <>
      {!cerrado && (
        <AvisoDeHoy id={`horario-vivo:${tarde.v.stop.id}`} prio={2}>
          <div data-hoy-horario-vivo={tarde.v.stop.id} data-hoy-horario-vivo-tipo={tarde.tipo} className="flex flex-none flex-col gap-1 rounded-[18px] py-2 pl-3.5 pr-2" style={{ background: 'rgb(var(--accent-red) / .07)', border: '1px solid rgb(var(--accent-red) / .3)' }}>
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-white" style={{ background: 'rgb(var(--accent-red))' }}>
                <Icono nombre="reloj" size={16} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
                <span data-hoy-horario-vivo-texto className="text-[13.5px] font-medium leading-[1.35]">{titulo}</span>
                <span data-hoy-horario-vivo-hora className="text-[12.5px] leading-[1.3] text-text/65">{hora}</span>
              </span>
              <CruzDeAviso onClick={cerrar} />
            </div>
            <button type="button" onClick={ver} data-horario-ver-solucion className="mb-1 ml-[42px] flex h-11 flex-none items-center self-start rounded-full px-4 text-[12px] font-bold" style={{ background: TINTA, color: DORADO_CLARO }}>
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
          vacio={`Esta vez no hay un cambio pequeño que lo arregle. ${tarde.v.nombre.charAt(0).toUpperCase()}${tarde.v.nombre.slice(1)} ${tarde.v.plural ? 'cierran' : 'cierra'} a las ${aHora(tarde.cierra, false)}: si no llegáis, mejor dejadlo para otro día.`}
          onOtra={() => setIndice((i) => (i + 1) % propuestas.length)}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            cerrar()
            setAbierta(false)
          }}
          onOriginal={() => {
            volverALaRutaOriginal()
            setAbierta(false)
          }}
          onCerrar={() => setAbierta(false)}
        />
      )}
    </>
  )
}
