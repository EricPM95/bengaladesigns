import { useMemo, useState } from 'react'
import { IconoPendientes } from './IconoPendientes'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { useDatosDeHorario } from '../../../../lib/horarioDeParada'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { aHora, diaAdmite, mejorDiaPara, opcionesDeDia, proponerPasarADia, proponerPasarSitios, unir, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { ListaDeDias } from '../../dayDetail/ListaDeDias'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import { conA, fraseCortaDeHoy, paradasJustasDeHoy, parrafoDeHoy, proponerAdelantar, quienesLlegaTarde, textoDelAviso, ventanaDeHorario, type VentanaDeHorario } from '../../../../lib/hoyHorarios'
import { useRouteStore } from '../../../../store/useRouteStore'
import { AvisoDeHoy, D_AVISO, FilaDeAviso, useAvisoCerrado } from './AvisosHoy'
import { HojaSolucion } from './HojaSolucion'
import { HojaPropuesta, TarjetaDelSitio, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'
import { EnlaceDejarlo } from '../piezas'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { displayStopName } from '../../../../lib/format'
import { segunGrupo } from '../../../../lib/viajaEnGrupo'

/**
 * (HOY2b 8b) LOS AVISOS DE HORARIO EN HOY. Los cálculos viven en `src/lib/hoyHorarios.ts`; aquí, lo que se ve:
 *  · `TarjetaDeHorariosDeHoy` (por la mañana, prioridad 5): una tarjeta tranquila con 2 sitios como mucho y su X: «Para hoy: la Cueva de los Verdes cierra a las 18:00. Vamos con margen; si os retrasáis, os avisamos a tiempo.»
 *  · `AvisoDeHorarioEnDirecto` (con la hora real, prioridad 2): «A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado» + [Ver solución] (adelantarla quitando antes algo flexible; propuesta con vista previa y Deshacer). Una vez por sitio y día; si se ve por fuera, no avisa.
 */
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1)

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
      {/* (V66, 14) Los cierres de la mañana, en la fila de aviso de siempre (`FilaDeAviso`): uno solo, su frase y debajo el resto; varios, juntos en una frase. Se va deslizándola hacia arriba. */}
      {justas.length === 1 ? (
        <FilaDeAviso tono="amarillo" icono={D_AVISO.reloj} titulo={cap(fraseCortaDeHoy(justas[0]))} sub={parrafoDeHoy(justas[0], false).replace(/^Y también: /, '').slice(fraseCortaDeHoy(justas[0]).length + 1).trim() || undefined} onIrse={cerrar} datos={{ 'data-hoy-horarios-manana': '1', 'data-hoy-horarios-parrafo': justas[0].tipo }} />
      ) : (
        <FilaDeAviso tono="amarillo" icono={D_AVISO.reloj} titulo={`Hoy hay ${justas.length} sitios con horario justo`} sub={justas.map((j) => fraseCortaDeHoy(j)).join(' · ')} onIrse={cerrar} datos={{ 'data-hoy-horarios-manana': String(justas.length) }} />
      )}
    </AvisoDeHoy>
  )
}

/** En directo: «A este ritmo llegarías a … cuando ya ha cerrado» con [Ver solución]. */
export function AvisoDeHorarioEnDirecto({ route, day, dateIso, ubicacion, enCoche, ahoraMin, ventanas }: { route: Route; day: DayPlan; dateIso: string; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; ventanas: VentanaDeHorario[] }) {
  const ctx = useContexto(route, enCoche)
  const todos = useMemo(() => quienesLlegaTarde({ day, ctx, ahoraMin, ubicacion, enCoche, ventanas }), [day, ctx, ahoraMin, ubicacion, enCoche, ventanas])
  // (V54 §1) Varios sitios que ya no llegas: UN solo aviso («Hoy ya no llegas a 3 sitios · A, B y C» [Ver]) y una hoja con una tarjeta por sitio.
  const cerradosAhora = todos.filter((t) => t.tipo === 'cerrado')
  const grupo = cerradosAhora.length >= 2 ? cerradosAhora : null
  const tarde = grupo ? null : (todos[0] ?? null)
  const claveGrupo = `horario-vivo-grupo-${grupo?.map((g) => g.v.stop.id).join('+') ?? 'ninguno'}`
  const [grupoCerrado, cerrarGrupo] = useAvisoCerrado(`${day.id}:${dateIso}`, claveGrupo)
  const [hojaGrupo, setHojaGrupo] = useState<Propuesta | null | undefined>(undefined)
  // Una vez por sitio y día: el que se cierra (o se resuelve) no vuelve ese día.
  const [cerrado, cerrar] = useAvisoCerrado(`${day.id}:${dateIso}`, `horario-vivo-${tarde?.v.stop.id ?? 'ninguno'}`)
  const [abierta, setAbierta] = useState(false)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [eligiendo, setEligiendo] = useState(false)
  if (grupo) {
    const nombres = grupo.map((g) => displayStopName(g.v.stop.name))
    const abrirGrupo = () => setHojaGrupo(proponerPasarSitios({ route, day, ctx, stops: grupo.map((g) => g.v.stop), intro: `Hoy ya no llegas a ${unir(nombres)}. Los pasamos a otros días, cada uno donde mejor encaja.` }))
    return (
      <>
        {!grupoCerrado && (
          <AvisoDeHoy id="horario-vivo:grupo" prio={2}>
            <FilaDeAviso tono="amarillo" icono={D_AVISO.pin} titulo={`Hoy ya no llegas a ${grupo.length} sitios`} sub={unir(nombres)} boton={{ texto: 'Ver', onClick: abrirGrupo, datos: { 'data-horario-ver-grupo': '1' } }} onIrse={cerrarGrupo} datos={{ 'data-hoy-horario-vivo-grupo': String(grupo.length) }} />
          </AvisoDeHoy>
        )}
        {hojaGrupo !== undefined && (
          <HojaPropuesta
            titulo="Pasar a otro día"
            propuestas={hojaGrupo ? [hojaGrupo] : []}
            indice={0}
            vacio="No queda nada que pasar a otro día: tu día sigue igual."
            onOtra={() => undefined}
            onAplicar={(pr) => {
              aplicarPropuesta(route.id, dateIso, pr)
              cerrarGrupo()
              setHojaGrupo(undefined)
            }}
            onCerrar={() => setHojaGrupo(undefined)}
          />
        )}
      </>
    )
  }
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
      setPropuestas(proponerAdelantar({ route, day, tarde, ctx, ahoraMin, ubicacion, ventanas }))
    }
    setIndice(0)
    setAbierta(true)
  }
  return (
    <>
      {!cerrado && (
        <AvisoDeHoy id={`horario-vivo:${tarde.v.stop.id}`} prio={2}>
          {/* (V54; Design «Avisos Hoy Compactos» V3) La fila compacta: el título, el horario en gris y su botón. Se va al resolverse o deslizándola hacia arriba. */}
          <FilaDeAviso tono="amarillo" icono={D_AVISO.reloj} titulo={titulo} sub={hora || undefined} boton={{ texto: tarde.ya ? 'Pasarlo a otro día' : 'Ver solución', onClick: ver, datos: { 'data-horario-ver-solucion': '1' } }} onIrse={cerrar} datos={{ 'data-hoy-horario-vivo': tarde.v.stop.id, 'data-hoy-horario-vivo-tipo': tarde.tipo }} />
        </AvisoDeHoy>
      )}
      {abierta && tarde.ya && propuestas.length === 0 && !eligiendo && (
        // (V50; Design «Aviso Cierre» A3) No cabe en ningún otro día: [Guardarlos en pendientes] (dorado) y, pequeños, [Quitarlos del viaje] y [Dejarlo como está]. La misma hoja que «Pasar a otro día» (HojaV2 + Titulo + BOTON_ORO).
        <HojaV2 onCerrar={() => setAbierta(false)} etiqueta="Pasar a otro día" fondo="#FBF3E2">
          <div data-hoy-no-cabe className="flex flex-col gap-3">
            <Titulo texto="Pasar a otro día" onCerrar={() => setAbierta(false)} />
            <span className="text-[14.5px] font-medium leading-[1.4]">Hoy ya no llegas {conA(tarde.v.nombre)}, y no {tarde.v.plural ? 'caben' : 'cabe'} en ningún otro día de tu viaje.</span>
            {/* (V53 §6; Design «Icono Pendientes» I3) La tarjeta del sitio, con el pin con reloj a la derecha en lugar de la fecha. */}
            <TarjetaDelSitio t={{ nombre: displayStopName(tarde.v.stop.name), fotoUrl: tarde.v.stop.photoUrl || tarde.v.stop.fixedPhotoUrl || '', cuando: 'A Lugares pendientes', semanaCorta: '', numero: '', destino: '', diaDeHoy: '', aPendientes: true, parada: tarde.v.stop, ciudad: day.city }} />
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
      {abierta && !tarde.ya && (
        <HojaSolucion
          route={route}
          day={day}
          enCoche={enCoche}
          propuestas={propuestas}
          vacio={`Esta vez no hay un cambio pequeño que lo arregle. ${tarde.v.nombre.charAt(0).toUpperCase()}${tarde.v.nombre.slice(1)} ${tarde.v.plural ? 'cierran' : 'cierra'} a las ${aHora(tarde.cierra, false)}: ${segunGrupo('si no llegáis, mejor dejadlo para otro día.', 'si no llegas, mejor déjalo para otro día.')}`}
          recalcular={(diaDe) => proponerAdelantar({ route, day, tarde, ctx, ahoraMin, ubicacion, ventanas, diaDe }).filter((p) => Object.keys(diaDe).every((id) => p.quitadas.some((q) => q.id === id)))}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            cerrar()
            setAbierta(false)
          }}
          onCerrar={() => setAbierta(false)}
        />
      )}
      {abierta && tarde.ya && propuestas.length > 0 && !eligiendo && (
        <HojaPropuesta
          titulo="Pasar a otro día"
          propuestas={propuestas}
          indice={indice}
          vacio={`Esta vez no hay un cambio pequeño que lo arregle. ${tarde.v.nombre.charAt(0).toUpperCase()}${tarde.v.nombre.slice(1)} ${tarde.v.plural ? 'cierran' : 'cierra'} a las ${aHora(tarde.cierra, false)}: ${segunGrupo('si no llegáis, mejor dejadlo para otro día.', 'si no llegas, mejor déjalo para otro día.')}`}
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
