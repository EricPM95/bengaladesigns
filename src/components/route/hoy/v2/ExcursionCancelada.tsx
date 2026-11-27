import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import { excursionReservationOf, viewedExcursion } from '../../../../lib/dayInterruptor'
import { excursionDeUnDia, isDayPinned, reapplyReservations } from '../../../../lib/bookings'
import { nombreDeLaExcursion, unidasAUnaExcursion } from '../../../../lib/reservasUnidas'
import { nombreDelDia, tituloSimpleDelDia } from '../../../../lib/tituloDelDia'
import { useDestinationExcursions } from '../../../../lib/destinationExcursions'
import { cambioParaLaExcursionCancelada, fechaCorta, rutaConElMovimiento, type FilaDeCambio } from '../../../../lib/excursionMove'
import { useExcursionCancelada } from '../../../../lib/excursionCancelada'
import { leerDatosHoyDeExcursion, leerDiaEscritoDeExcursion, modoDeLaExcursion, trasladosDelDia, type ModoDeExcursion } from '../../../../lib/excursionHoy'
import { pagoActivo } from '../../../../lib/pago'
import { HojaMoverDias, tarjetasDeLosDias } from '../../reservas/HojaMoverDias'
import { CercaDeTiFila } from '../CercaDeTiFila'
import { ImagenConFundido } from '../../../ui/ImagenConFundido'
import { Icono } from '../../../ui/Icono'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { IdeasYPendientesHoy } from './IdeasYPendientesHoy'

/**
 * (V80, apartado 4; Design «Día de excursión en HOY», EX7, EX8 y EX8b) LA EXCURSIÓN CANCELADA.
 *  · `EnlaceExcursionCancelada`: el enlace pequeño «¿Se ha cancelado la excursión?» del final de la tarjeta de la excursión. Al pulsarlo se apunta (`useExcursionCancelada`, en el móvil, por viaje y día) y sale el aviso de abajo
 *    «Excursión cancelada» con [Deshacer] (`AvisoSobreLaBarra`, vía `avisarAbajo`).
 *  · `DiaDeExcursionCancelada`: lo que sale en HOY en su lugar: la tarjeta GRIS («EXCURSIÓN CANCELADA · Hoy no hay excursión: tienes el día libre»), [Hacer La Graciosa otro día] (solo por tu cuenta, y solo si hay un
 *    día con el que cambiarla), «Tu día libre en Roma» (`IdeasYPendientesHoy`: pendientes con [+ A hoy] e ideas cerca) y «Cerca de ti». NUNCA «¿Qué hago ahora?». No se borra nada: la reserva sigue en RESERVAS.
 * Todo vale para todos los destinos (Roma: Pompeya organizada; Lanzarote: La Graciosa por tu cuenta, con su [Hacer La Graciosa otro día]). Sin consultas a Supabase.
 */

/**
 * ¿La excursión del día es por tu cuenta (ferry, tren, bus o coche) u organizada (una empresa)? La MISMA regla que el paso a paso de la excursión (`modoDeLaExcursion`, apartado 1): lo guardado manda (una reserva de excursión → organizada;
 * billetes unidos → por tu cuenta); sin nada, `modo_habitual` de sus datos; sin dato, por tu cuenta solo si el día escrito trae traslados. Lee los dos archivos del destino (cargados bajo demanda, sin red de datos del viajero).
 */
export function useModoDeLaExcursion(route: Route, day: DayPlan): ModoDeExcursion {
  const reservations = useRouteStore((s) => s.reservations)
  const exc = viewedExcursion(day) ?? excursionDeUnDia(day)
  const [datos, setDatos] = useState<{ habitual: ModoDeExcursion | null; traslados: boolean } | null>(null)
  useEffect(() => {
    let vivo = true
    void Promise.all([leerDatosHoyDeExcursion(route.destination, exc?.id), leerDiaEscritoDeExcursion(route.destination, day.diaEscritoId)]).then(([hoy, escrito]) => {
      const t = trasladosDelDia(escrito)
      if (vivo) setDatos({ habitual: hoy?.modo_habitual ?? null, traslados: Boolean(t.coche || t.barco) })
    })
    return () => {
      vivo = false
    }
  }, [route.destination, exc?.id, day.diaEscritoId])
  return modoDeLaExcursion({ reserva: excursionReservationOf(route, reservations, day), unidas: exc ? unidasAUnaExcursion(reservations, exc.id) : [], habitual: datos?.habitual ?? null, diaConTraslados: datos?.traslados ?? false })
}

/** «La Graciosa», «Pompeya»: el nombre de la excursión sin «(excursión)». */
export function nombreDeLaExcursionDelDia(route: Route, day: DayPlan): string {
  const exc = viewedExcursion(day) ?? excursionDeUnDia(day)
  const del = tituloSimpleDelDia(route, day).replace(/\s*\(.*$/, '').trim()
  return del || (exc ? nombreDeLaExcursion(exc) : `la excursión desde ${day.city}`)
}

/** El enlace pequeño del final de la tarjeta de la excursión. */
export function EnlaceExcursionCancelada({ route, day, dateIso }: { route: Route; day: DayPlan; dateIso: string }) {
  const { cancelar, deshacer } = useExcursionCancelada(route.id, day.id, dateIso)
  const alPulsar = () => {
    cancelar()
    avisarAbajo({ id: `excursion-cancelada:${day.id}`, texto: 'Excursión cancelada', accion: { etiqueta: 'Deshacer', alTocar: deshacer } })
  }
  return (
    <button type="button" onClick={alPulsar} data-hoy-excursion-cancelar className="flex min-h-11 w-full items-center justify-start px-1 text-left text-[13.5px] font-medium underline underline-offset-[3px]" style={{ color: 'rgba(28,34,48,.55)' }}>
      ¿Se ha cancelado la excursión?
    </button>
  )
}

export function DiaDeExcursionCancelada({ route, day, dateIso, desde, enCoche, ahoraMin }: { route: Route; day: DayPlan; dateIso: string; desde: Coordinates | null; enCoche: boolean; ahoraMin: number }) {
  const porTuCuenta = useModoDeLaExcursion(route, day) === 'por_tu_cuenta'
  const reservations = useRouteStore((s) => s.reservations)
  const [hoja, setHoja] = useState(false)
  const info = useDestinationExcursions(route.destination)
  const exc = viewedExcursion(day) ?? excursionDeUnDia(day)
  const nombre = nombreDeLaExcursionDelDia(route, day)
  const foto = exc?.page?.photoUrl ?? null
  // El día con el que se cambia (el siguiente que se pueda mover) y el intercambio ya calculado; sin ninguno (es el último día) no hay botón.
  const cambio = useMemo(() => (porTuCuenta ? cambioParaLaExcursionCancelada(route, day, (otro) => isDayPinned(route, reservations, otro)) : null), [porTuCuenta, route, day, reservations])
  const diaDe = (fila: FilaDeCambio): DayPlan | null => (fila.principal ? day : (route.days.find((d) => !d.isReturnLeg && d.dayNumber === fila.antesNumero) ?? null))
  const cambiar = () => {
    if (!cambio) return
    const antes = useRouteStore.getState().route
    const reservas = useRouteStore.getState().reservations
    if (!antes) return
    useRouteStore.setState({ route: reapplyReservations(rutaConElMovimiento(antes, cambio.mov), reservas) })
    setHoja(false)
    const principal = cambio.mov.filas.find((f) => f.principal)
    // El aviso sale cuando HOY ya ha cambiado de día: el host de avisos de este día de excursión se desmonta al cambiar (y vacía la cola), así que se pone en el siguiente turno, para el del día nuevo.
    window.setTimeout(
      () =>
        avisarAbajo({
          id: `excursion-otro-dia:${day.id}`,
          texto: `${nombre}, pasada al ${principal ? fechaCorta(principal.fechaIso, principal.dayNumber) : 'otro día'}`,
          accion: { etiqueta: 'Deshacer', alTocar: () => useRouteStore.setState({ route: antes }) },
        }),
      150,
    )
  }
  const principal = cambio?.mov.filas.find((f) => f.principal)
  return (
    <>
      <div data-hoy-excursion-cancelada className="flex flex-none flex-col overflow-hidden rounded-[26px]" style={{ background: '#FFFDF8', border: '1.5px dashed rgba(28,34,48,.28)' }}>
        <div className="relative overflow-hidden" style={{ height: 132, background: 'linear-gradient(160deg,#B9B6B0,#6D6B67)' }}>
          {foto && (
            <span className="absolute inset-0" style={{ filter: 'grayscale(1)', opacity: 0.85 }}>
              <ImagenConFundido src={foto} fondo="#B9B6B0" loading="lazy" alt="" />
            </span>
          )}
          <span aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(60,58,54,.15),rgba(60,58,54,.62))' }} />
          <span className="absolute left-[18px] top-4 text-white" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' }}>EXCURSIÓN CANCELADA</span>
          <b className="absolute bottom-3.5 left-[18px] right-[18px] text-white" style={{ font: "400 32px/1.05 'Instrument Serif',serif" }}>{nombre}</b>
        </div>
        <p data-hoy-cancelada-texto className="m-0 px-[18px] py-3.5 text-[14px] font-medium leading-[1.4] text-[#1C2230]/65">Hoy no hay excursión: tienes el día libre.</p>
      </div>
      {cambio && (
        <button type="button" onClick={() => setHoja(true)} data-hoy-excursion-otro-dia className="flex min-h-[52px] flex-none items-center justify-center gap-2.5 rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
          <Icono nombre="dias" size={17} grosor={1.9} />
          {`Hacer ${nombre} otro día`}
        </button>
      )}
      <IdeasYPendientesHoy route={route} day={day} dateIso={dateIso} titulo={`Tu día libre en ${route.destination}`} desde={desde} enCoche={enCoche} ahoraMin={ahoraMin} conAHoy />
      <CercaDeTiFila route={route} origen={desde} conPase={pagoActivo()} />
      {hoja && cambio && (
        <HojaMoverDias
          titulo={`Hacer ${nombre} otro día`}
          ciudad={route.destination}
          texto={`Te proponemos hacer ${nombre} el ${principal ? fechaCorta(principal.fechaIso, principal.dayNumber) : 'otro día'} y hoy lo que tenías ese día.`}
          // El día con el que se cambia, con su título de DÍAS («Norte de Lanzarote»), y la excursión con su foto; el que pasa a hoy dice «Pasa a hoy, viernes 27».
          tarjetas={tarjetasDeLosDias(route, cambio.mov.filas, diaDe).map((t, i) => {
            const fila = cambio.mov.filas[i]
            return { ...t, ...(fila?.principal ? { nombre } : (() => { const d = diaDe(fila); return d ? { nombre: nombreDelDia(route, d, info.gruposDia).titulo } : {} })()), ...(fila?.principal && foto ? { fotoUrl: foto } : {}), ...(fila?.fechaIso === dateIso ? { cuando: `Pasa a hoy, ${t.destino}` } : {}) }
          })}
          solo="la excursión"
          sinRecomendado
          etiquetaSolo="Dejarlo como está"
          onCambiar={cambiar}
          onSolo={() => setHoja(false)}
          onCerrar={() => setHoja(false)}
        />
      )}
    </>
  )
}
