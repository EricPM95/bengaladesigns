import { useMemo, useState } from 'react'
import { IconoPendientes } from './IconoPendientes'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { useDatosDeHorario } from '../../../../lib/horarioDeParada'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { aHora, diaAdmite, mejorDiaPara, opcionesDeDia, proponerPasarADia, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { ListaDeDias } from '../../dayDetail/ListaDeDias'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import { conA, paradasJustasDeHoy, parrafoDeHoy, proponerAdelantar, quienLlegaTarde, textoDelAviso, ventanaDeHorario, type VentanaDeHorario } from '../../../../lib/hoyHorarios'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { AvisoDeHoy, CruzDeAviso, useAvisoCerrado } from './AvisosHoy'
import { HojaPropuesta, TarjetaDelSitio, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'
import { EnlaceDeAviso, EnlaceDejarlo } from '../piezas'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { displayStopName } from '../../../../lib/format'

/**
 * (HOY2b 8b) LOS AVISOS DE HORARIO EN HOY. Los cálculos viven en `src/lib/hoyHorarios.ts`; aquí, lo que se ve:
 *  · `TarjetaDeHorariosDeHoy` (por la mañana, prioridad 5): una tarjeta tranquila con 2 sitios como mucho y su X: «Para hoy: la Cueva de los Verdes cierra a las 18:00. Vamos con margen; si os retrasáis, os avisamos a tiempo.»
 *  · `AvisoDeHorarioEnDirecto` (con la hora real, prioridad 2): «A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado» + [Ver solución] (adelantarla quitando antes algo flexible; propuesta con vista previa y Deshacer). Una vez por sitio y día; si se ve por fuera, no avisa.
 */
const TINTA = '#1C2230'

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
  const [eligiendo, setEligiendo] = useState(false)
  if (!tarde) return null
  const { titulo, hora } = textoDelAviso(tarde)
  // (V50; Design «Aviso Cierre» A2) El texto de arriba de la hoja y el botón, en «tú», con el sitio de la última entrada: «Hoy ya no llegas a los Museos Vaticanos. Te los pasamos al jueves 26, que tiene hueco y está abierto.»
  const conTextoDeCierre = (p: Propuesta): Propuesta => {
    const t = p.tarjetaDia
    if (!t || !tarde) return p
    const los = tarde.v.plural ? 'los' : 'lo'
    const semana = t.destino.replace(/ \d+$/, '')
    return {
      ...p,
      intro: p.caso === 'c' ? p.intro : `Hoy ya no llegas ${conA(tarde.v.nombre)}. Te ${los} pasamos al ${t.destino}, que tiene hueco y está abierto.`,
      boton: `Pasar${los} al ${p.caso === 'c' ? semana : semana}`,
    }
  }
  // «Elegir otro día»: la misma lista de días que Cambiar plan (solo posteriores a hoy; el mejor, destacado; los cerrados, en gris).
  const iHoy = route.days.findIndex((d) => d.id === day.id)
  const diasPosibles = route.days.filter((d, i) => i > iHoy && d.id !== day.id && diaAdmite(d)).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  const ver = () => {
    // (V48) Si ya no se puede entrar hoy, la solución es pasarlo al mejor otro día (no adelantarlo): una sola propuesta con su botón «Pasarlo al …».
    if (tarde.ya) {
      const mejor = mejorDiaPara({ route, day, stop: tarde.v.stop, ctx })
      setPropuestas(mejor ? proponerPasarADia({ route, day, stop: tarde.v.stop, destinoId: mejor.dia.id, ctx }).propuestas.map(conTextoDeCierre) : [])
    } else {
      setPropuestas(proponerAdelantar({ day, tarde, ctx, ahoraMin, ubicacion, ventanas }))
    }
    setIndice(0)
    setAbierta(true)
  }
  return (
    <>
      {!cerrado && (
        <AvisoDeHoy id={`horario-vivo:${tarde.v.stop.id}`} prio={2}>
          {/* (V2b, H2 de Design) Tarjeta pequeña en ámbar, con su icono, el texto en una o dos líneas y su X; [Ver solución] como enlace pequeño dentro. */}
          <div data-hoy-horario-vivo={tarde.v.stop.id} data-hoy-horario-vivo-tipo={tarde.tipo} className="flex flex-none flex-col rounded-[22px] py-3.5 pl-3.5 pr-2.5" style={{ background: '#FBF1D8', border: '1.5px solid rgba(200,140,40,.6)', color: '#6A3E06' }}>
            <div className="flex items-start gap-3">
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8620A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="mt-px flex-none">
                <path d="M12 8v5M12 16.5h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 2-2L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span data-hoy-horario-vivo-texto className="text-[14.5px] font-semibold leading-[1.35]">{titulo}</span>
                {hora && <span data-hoy-horario-vivo-hora className="text-[12.5px] leading-[1.3]" style={{ color: 'rgba(106,62,6,.8)' }}>{hora}</span>}
              </span>
              <span className="-my-2 flex flex-none"><CruzDeAviso onClick={cerrar} /></span>
            </div>
            <EnlaceDeAviso onClick={ver} texto={tarde.ya ? 'Pasarlo a otro día' : 'Ver solución'} datos={{ 'data-horario-ver-solucion': '1' }} className="-mb-2 ml-[34px]" />
          </div>
        </AvisoDeHoy>
      )}
      {abierta && tarde.ya && propuestas.length === 0 && !eligiendo && (
        // (V50; Design «Aviso Cierre» A3) No cabe en ningún otro día: [Guardarlos en pendientes] (dorado) y, pequeños, [Quitarlos del viaje] y [Dejarlo como está]. La misma hoja que «Pasar a otro día» (HojaV2 + Titulo + BOTON_ORO).
        <HojaV2 onCerrar={() => setAbierta(false)} etiqueta="Pasar a otro día" fondo="#FBF3E2">
          <div data-hoy-no-cabe className="flex flex-col gap-3">
            <Titulo texto="Pasar a otro día" onCerrar={() => setAbierta(false)} />
            <span className="text-[14.5px] font-medium leading-[1.4]">Hoy ya no llegas {conA(tarde.v.nombre)}, y no {tarde.v.plural ? 'caben' : 'cabe'} en ningún otro día de tu viaje.</span>
            {/* (V53 §6; Design «Icono Pendientes» I3) La tarjeta del sitio, con el pin con reloj a la derecha en lugar de la fecha. */}
            <TarjetaDelSitio t={{ nombre: displayStopName(tarde.v.stop.name), fotoUrl: tarde.v.stop.photoUrl || tarde.v.stop.fixedPhotoUrl || '', cuando: 'A Lugares pendientes', semanaCorta: '', numero: '', destino: '', diaDeHoy: '', aPendientes: true }} />
            <button
              type="button"
              data-no-cabe-guardar
              onClick={() => {
                const { setStopSaltada } = useRouteStore.getState()
                setStopSaltada(day.id, tarde.v.stop.id, true)
                avisarAbajo({ id: `saltada:${tarde.v.stop.id}`, texto: `${displayStopName(tarde.v.stop.name)}: la tienes en Lugares pendientes`, accion: { etiqueta: 'Deshacer', alTocar: () => useRouteStore.getState().setStopSaltada(day.id, tarde.v.stop.id, false) } })
                cerrar()
                setAbierta(false)
              }}
              className="flex min-h-[50px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold"
              style={BOTON_ORO}
            >
              <span className="flex items-center justify-center gap-2.5"><IconoPendientes size={20} color="#4A3510" grosor={1.9} />{tarde.v.plural ? 'Guardarlos en pendientes' : 'Guardarlo en pendientes'}</span>
            </button>
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                data-no-cabe-quitar
                onClick={() => {
                  const stop = tarde.v.stop
                  const antes = useRouteStore.getState().route
                  useRouteStore.getState().removeStop(day.id, stop.id)
                  avisarAbajo({ id: `quitada:${stop.id}`, texto: `${displayStopName(stop.name)}: fuera de tu viaje`, accion: { etiqueta: 'Deshacer', alTocar: () => { if (antes) useRouteStore.setState({ route: antes }) } } })
                  cerrar()
                  setAbierta(false)
                }}
                className="flex min-h-11 items-center text-[13.5px] font-semibold underline underline-offset-[3px]"
                style={{ color: 'rgba(28,34,48,.7)' }}
              >
                {tarde.v.plural ? 'Quitarlos del viaje' : 'Quitarlo del viaje'}
              </button>
              <EnlaceDejarlo onClick={() => setAbierta(false)} datos={{ 'data-propuesta-dejar': '1' }} />
            </div>
          </div>
        </HojaV2>
      )}
      {abierta && (!tarde.ya || propuestas.length > 0) && !eligiendo && (
        <HojaPropuesta
          titulo={tarde.ya ? 'Pasar a otro día' : 'Una solución'}
          propuestas={propuestas}
          indice={indice}
          vacio={`Esta vez no hay un cambio pequeño que lo arregle. ${tarde.v.nombre.charAt(0).toUpperCase()}${tarde.v.nombre.slice(1)} ${tarde.v.plural ? 'cierran' : 'cierra'} a las ${aHora(tarde.cierra, false)}: si no llegáis, mejor dejadlo para otro día.`}
          onOtra={() => setIndice((i) => (i + 1) % propuestas.length)}
          onElegirOtroDia={tarde.ya ? () => setEligiendo(true) : undefined}
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
      {abierta && tarde.ya && eligiendo && (
        // (V50) «Elegir otro día»: la lista de días de Cambiar plan (solo posteriores a hoy; el mejor, destacado; los cerrados, en gris).
        <HojaV2 onCerrar={() => setEligiendo(false)} etiqueta="Pasar a otro día" fondo="#FBF3E2">
          <div data-hoy-elegir-dia className="flex flex-col gap-3">
            <Titulo texto="Pasar a otro día" onCerrar={() => setEligiendo(false)} />
            <ListaDeDias
              dias={diasPosibles}
              ahora={day.dayNumber}
              recomendado={mejorDiaPara({ route, day, stop: tarde.v.stop, ctx })?.dia.id ?? null}
              cerrados={new Set(opcionesDeDia({ route, day, stop: tarde.v.stop, ctx }).filter((o) => o.cerrado).map((o) => o.dia.id))}
              onElegir={(id) => {
                setPropuestas(proponerPasarADia({ route, day, stop: tarde.v.stop, destinoId: id, ctx }).propuestas.map(conTextoDeCierre))
                setIndice(0)
                setEligiendo(false)
              }}
            />
          </div>
        </HojaV2>
      )}
    </>
  )
}
