import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { avisoDeManana, type TipoAviso } from '../../../../lib/avisosDelTiempo'
import { leerDatosDeExcursion, type DatosDeExcursion } from '../../../../lib/datosDelDiaEscrito'
import type { LineaManana, MananaH13 } from '../../../../lib/hoyParada'
import { fetchHourlyRain } from '../../../../lib/rainForecast'
import type { Route } from '../../../../lib/types'
import { useReservasFocusStore } from '../../../../store/useReservasFocusStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { Icono, IconoRuta } from '../../../ui/Icono'
import { ICONO as ICONO_TIEMPO, esDeLanzarote } from '../AvisosDelTiempo'
import { TarjetaOscura } from '../piezas'

/**
 * (V73, «Hoy Al Acabar» AC1-AC3) «Mañana, viernes 27 · La Graciosa»: la tarjeta oscura de lo de mañana (solo cuando no queda nada por hacer hoy), con sus líneas con icono debajo del título.
 *  · la primera: «Sales a las 8:10» (excursión con reserva), «Ferry de las 10:00 desde Órzola» (excursión por libre, del traslado con hora de los datos del día), «Aún no tienes la reserva de La Graciosa» con [Añadir tu reserva]
 *    (RESERVAS en esa excursión) o «Empiezas por Timanfaya»;
 *  · el consejo, si lo hay (de los datos del día; nunca inventado), y el tiempo de mañana, si hay aviso (lluvia, viento, nubes en un mirador).
 * Al tocarla: DÍAS, abierto en mañana. Si un dato no existe, su línea no sale.
 */
const ORO_CLARO = '#F3D88F'
const MARFIL = '#FBF3E2'
const CONSEJO_PLAYA = 'Lleva el bañador y protector solar: hay playa.'

type Fila = { clave: string; icono: LineaManana['icono'] | 'tips' | TipoAviso; texto: string }

export function TarjetaMananaOscura({ route, cuando, manana, dateIso }: { route: Route; cuando: string; manana: MananaH13; /** El día de mañana (AAAA-MM-DD): para pedir su previsión. */ dateIso: string }) {
  const setMode = useRouteStore((s) => s.setMode)
  const setActiveDayId = useRouteStore((s) => s.setActiveDayId)
  const dia = route.days.find((d) => d.id === manana.diaId)
  const [datos, setDatos] = useState<DatosDeExcursion | null>(null)
  const [tiempo, setTiempo] = useState<{ tipo: TipoAviso; texto: string } | null>(null)

  // Los datos de la excursión se leen del archivo del destino en el móvil (un trozo aparte, una vez al enseñar la tarjeta): ni Supabase ni red.
  useEffect(() => {
    let vivo = true
    if (manana.esExcursion) void leerDatosDeExcursion(route.destination, manana.diaEscritoId).then((d) => vivo && setDatos(d))
    return () => {
      vivo = false
    }
  }, [manana.esExcursion, manana.diaEscritoId, route.destination])

  // (V36) El tiempo de mañana: UNA petición a nuestro servidor al enseñar la tarjeta (con el día acabado y la pantalla visible), nunca en bucle; baja ~1 KB (24 horas de lluvia, nubes y rachas) y el servidor la guarda ~3 h.
  useEffect(() => {
    let vivo = true
    // Dónde mirar el tiempo: una parada de mañana; en una excursión sin paradas, su destino; si no, el del viaje o, en último caso, cualquier parada del viaje (la misma ciudad o isla).
    const at =
      dia?.stops.find((s) => hasRealCoordinates(s.coordinates))?.coordinates ??
      dia?.excursions?.map((x) => x.destinationCoords).find((c): c is NonNullable<typeof c> => Boolean(c && hasRealCoordinates(c))) ??
      (route.destinationCoordinates && hasRealCoordinates(route.destinationCoordinates) ? route.destinationCoordinates : null) ??
      route.days.flatMap((d) => d.stops).find((s) => hasRealCoordinates(s.coordinates))?.coordinates ??
      null
    if (dia && at && document.visibilityState === 'visible') void fetchHourlyRain(at, dateIso).then((m) => vivo && m && setTiempo(avisoDeManana(dia, m, esDeLanzarote(route))))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manana.diaId, dateIso])

  const filas: Fila[] = []
  const primera = manana.primera ?? (datos?.traslado ? ({ icono: 'excursion', texto: datos.traslado } as LineaManana) : null)
  if (primera) filas.push({ clave: 'sales', icono: primera.icono, texto: primera.texto })
  if (manana.turno) filas.push({ clave: 'reserva', icono: 'reservas', texto: manana.turno })
  const consejo = manana.consejo ?? (datos?.playa ? CONSEJO_PLAYA : null)
  if (consejo) filas.push({ clave: 'consejo', icono: 'tips', texto: consejo })
  if (tiempo) filas.push({ clave: 'tiempo', icono: tiempo.tipo, texto: tiempo.texto })

  const abrirDias = () => {
    setActiveDayId(manana.diaId)
    setMode('days')
  }
  const anadirReserva = (e: MouseEvent) => {
    e.stopPropagation()
    if (!manana.anadirReserva) return
    // RESERVAS, abierto en esa excursión (la misma petición que el botón de «Excursiones y actividades» de DÍAS).
    setMode('bookings')
    useReservasFocusStore.getState().pedirExcursion(manana.anadirReserva.excursion, manana.anadirReserva.dayId)
  }
  const alTeclear = (e: KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      abrirDias()
    }
  }

  return (
    <div data-hoy-manana role="button" tabIndex={0} onClick={abrirDias} onKeyDown={alTeclear} aria-label={`${cuando} · ${manana.titulo}`} className="flex flex-none cursor-pointer flex-col text-left">
      <TarjetaOscura brillo="rgba(243,216,143,.55)">
        <div className="relative flex flex-col gap-2.5" style={{ color: MARFIL }}>
          <span className="flex items-center gap-1.5" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: ORO_CLARO, textTransform: 'uppercase' }}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: ORO_CLARO }} />
            Mañana
          </span>
          <b data-hoy-manana-titulo style={{ font: "400 26px/1.12 'Instrument Serif',serif", textWrap: 'balance' as never }}>
            {cuando} · {manana.titulo}
          </b>
          {filas.length > 0 && (
            <div data-hoy-manana-lineas className="mt-1 flex flex-col rounded-[20px] px-3" style={{ background: 'rgba(255,253,248,.06)', border: '1px solid rgba(251,243,226,.12)' }}>
              {filas.map((f, i) => (
                <span key={f.clave} data-hoy-manana-linea={f.clave} {...(f.clave === 'sales' ? { 'data-hoy-manana-sales': '' } : f.clave === 'reserva' ? { 'data-hoy-manana-reserva': '' } : f.clave === 'consejo' ? { 'data-hoy-manana-consejo': '' } : {})} className="flex items-center gap-3 py-3 text-[14.5px] font-medium leading-[1.3]" style={i > 0 ? { borderTop: '1px solid rgba(251,243,226,.1)' } : undefined}>
                  <span aria-hidden="true" className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px]" style={{ background: ORO_CLARO, color: '#6E5018' }}>
                    {f.icono === 'viento' || f.icono === 'lluvia' || f.icono === 'nubes' ? <IconoRuta d={ICONO_TIEMPO[f.icono]} size={19} grosor={1.8} /> : <Icono nombre={f.icono} size={19} grosor={1.8} />}
                  </span>
                  <span className="min-w-0 flex-1">{f.texto}</span>
                </span>
              ))}
            </div>
          )}
          {manana.anadirReserva && (
            <button type="button" onClick={anadirReserva} data-hoy-manana-anadir-reserva className="flex h-12 items-center justify-center gap-1.5 rounded-2xl text-[14px] font-bold" style={BOTON_ORO}>
              <Icono nombre="anadir" size={15} grosor={2.2} />
              Añadir tu reserva
            </button>
          )}
        </div>
      </TarjetaOscura>
    </div>
  )
}
