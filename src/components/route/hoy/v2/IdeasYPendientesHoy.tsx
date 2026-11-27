import { useMemo } from 'react'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useExploreAperturaStore } from '../../../../store/useExploreAperturaStore'
import { useDestinationPool } from '../../../../lib/useDestinationPool'
import { candidatosParaAnadir, stopDeCandidato, viajeMin } from '../../../../lib/hoyCambiarPlan'
import { pendientesDelViaje } from '../../../../lib/hoyPendientes'
import { semanaDelDia } from '../../../../lib/tarjetasDePropuesta'
import { displayStopName } from '../../../../lib/format'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { Icono } from '../../../ui/Icono'
import { BOTON_CLARO } from '../../../ui/botonesOro'
import { LugaresPendientes } from './LugaresPendientes'
import { ParadaFotoDeParada } from './ParadaFoto'

/**
 * (V80, apartados 3b y 4; Design «Día de excursión en HOY», EX7, EX8 y el «AL VOLVER» de EX4) «IDEAS Y PENDIENTES»: UNA SOLA PIEZA para los dos sitios donde, en un día de excursión, HOY propone seguir visitando
 * EN LUGAR de «¿Qué hago ahora?» (que NUNCA sale en un día de excursión):
 *   · la excursión CANCELADA → con `titulo` («Tu día libre en Roma»): el día queda libre, y con `conAHoy` cada pendiente lleva [+ A hoy];
 *   · AL VOLVER de la excursión (organizada: tras [He terminado]; por tu cuenta: tras la vuelta al alojamiento), en «Al acabar el día» → sin `titulo`: arriba la frase «¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.».
 * Lleva, en este orden: el título o la frase · tus Lugares pendientes (el bloque de siempre, `LugaresPendientes`, abierto; sin pendientes no sale) · IDEAS CERCA DE TI (3 o 4 sitios REALES de EXPLORAR del destino, abiertos
 * ahora, que aún no están en el viaje, con su foto y «8 min a pie» / «25 min en coche»; sin ideas no sale la tarjeta: nunca nada inventado) · [Ver en Explorar] (abre EXPLORAR con lo de cerca; sale siempre).
 * Sin consultas a Supabase: las ideas salen del catálogo del destino que HOY ya tiene (`/api/destination-places`: una vez por destino y sesión, cacheado en el móvil; Roma ≈ 61 sitios, unos 60 KB, y es el mismo
 * que usa «¿Qué hago ahora?» y EXPLORAR), y los pendientes, de la ruta que está en memoria.
 */
const ORO_OSCURO = '#6F4E37'

export function IdeasYPendientesHoy({ route, day, dateIso, titulo, desde, enCoche, ahoraMin, conAHoy = false }: { route: Route; day: DayPlan; dateIso: string; /** «Tu día libre en Roma» (excursión cancelada). Sin él, la frase de «al volver». */ titulo?: string; /** Desde dónde se cuentan los minutos: el GPS útil o, si no, el alojamiento. */ desde: Coordinates | null; enCoche: boolean; ahoraMin: number; /** Cada pendiente lleva [+ A hoy] (solo en la excursión cancelada: el día ya se puede llenar). */ conAHoy?: boolean }) {
  const setMode = useRouteStore((s) => s.setMode)
  const pedirExplorar = useExploreAperturaStore((s) => s.pedir)
  const { places, resolved } = useDestinationPool(route.destination, true)
  const pendientes = useMemo(() => pendientesDelViaje({ route, hoy: day, semana: (d) => semanaDelDia(route, d) }), [route, day])
  // Sin GPS ni alojamiento, las ideas se ordenan desde el centro de lo que hay en el viaje (solo para ordenar: sin `desde` no se enseñan minutos).
  const origen = useMemo(() => {
    if (desde) return desde
    const cs = route.days.flatMap((d) => d.stops).filter((st) => !st.isBreak && !st.isArrival && hasRealCoordinates(st.coordinates)).map((st) => st.coordinates)
    return cs.length > 0 ? { lat: cs.reduce((a, c) => a + c.lat, 0) / cs.length, lng: cs.reduce((a, c) => a + c.lng, 0) / cs.length } : (route.destinationCoordinates ?? null)
  }, [desde, route])
  const ideas = useMemo(
    () =>
      resolved
        ? candidatosParaAnadir({ route, lugares: places, desde: origen, logros: new Set<string>(), enCoche, limite: 6, ahoraMin, day, fechaIso: dateIso, mes: Number(dateIso.slice(5, 7)) })
            .filter((c) => !c.deOtroDia)
            .slice(0, 4)
        : [],
    [resolved, route, places, origen?.lat, origen?.lng, enCoche, ahoraMin, day, dateIso], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const verEnExplorar = () => {
    pedirExplorar({ categoria: 'atracciones', origen: null, cerca: true })
    setMode('explore')
  }
  return (
    <div data-hoy-ideas-pendientes={titulo ? 'cancelada' : 'al-volver'} className="flex flex-none flex-col gap-3">
      {titulo ? (
        <b data-ideas-titulo style={{ font: "400 28px/1.1 'Instrument Serif',serif", textWrap: 'balance' as never }}>{titulo}</b>
      ) : (
        <p data-ideas-frase className="m-0 px-1 text-[14.5px] font-medium leading-[1.45]" style={{ textWrap: 'pretty' as never }}>
          ¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.
        </p>
      )}
      <LugaresPendientes route={route} day={day} dateIso={dateIso} pendientes={pendientes} abiertaDeEntrada conAHoy={conAHoy} />
      {ideas.length > 0 && (
        <div data-hoy-ideas className="flex flex-none flex-col gap-2.5 rounded-[22px] px-4 pb-3.5 pt-3.5" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
          <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: ORO_OSCURO, textTransform: 'uppercase' }}>Ideas cerca de ti</span>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {ideas.map((c) => {
              const min = desde ? viajeMin({ coordinates: desde }, c, enCoche) : null
              return (
                <li key={c.nombre} data-hoy-idea={c.nombre} className="flex items-center gap-3">
                  <ParadaFotoDeParada parada={stopDeCandidato(c)} ciudad={day.city} dateIso={dateIso} vista marca={false} size={46} carga="eager" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2 text-[14.5px] font-bold leading-[1.2] text-[#1C2230]">{displayStopName(c.nombre)}</span>
                    {min != null && <span className="text-[12.5px] font-medium leading-[1.25] text-[#1C2230]/60">{`${min} min ${enCoche ? 'en coche' : 'a pie'}`}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <button type="button" onClick={verEnExplorar} data-hoy-ideas-explorar className="flex min-h-[50px] flex-none items-center justify-center gap-2 rounded-2xl px-3 text-[14.5px] font-bold" style={BOTON_CLARO}>
        <Icono nombre="explorar" size={16} grosor={1.9} />
        Ver en Explorar
      </button>
    </div>
  )
}
