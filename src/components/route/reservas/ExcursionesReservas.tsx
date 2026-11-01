import { useMonedaViajero } from '../../../lib/moneda'
import { useEffect, useState } from 'react'
import type { Excursion, Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { buildExcursionRow, dayOfReservation, hasEnoughDaysForExcursions, type Reservation } from '../../../lib/bookings'
import { buildActivitySearchUrl } from '../../../lib/affiliateLinks'
import { useExcursionsStore } from '../../../store/useExcursionsStore'
import { useEntradasDelGrupo, useReservasParaMi } from '../../../hooks/useEntradasDelGrupo'
import { textoQuienVa, idsIncluidos } from '../../../lib/reservasGrupo'
import { CabeceraBloque, ICONOS } from './BloqueReservas'
import { BloqueClaro } from './PiezasDesignReservas'
import { useReservasFocusStore } from '../../../store/useReservasFocusStore'
import { EntradaCard } from './EntradaCard'
import { AddReservationSheet, type ReservationTarget } from './AddReservationSheet'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { enTuRuta, cuandoDeLaReserva, diaEnCajas } from './EntradasYFreeTour'
import { ROTULO } from './TarjetasEntradas'
import { Icono } from '../../ui/Icono'
import { VolverExcursionARuta } from './VolverExcursionARuta'
import { TarjetaExcursionDesign, HojaDatosDeLaExcursion, type DatosDeLaExcursion } from './ExcursionConBillete'
import { useBilletesDeExcursiones } from '../../../hooks/useBilleteExcursion'
import { useBilleteStore } from '../../../store/useBilleteStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useMisReservas } from '../../../store/useMisReservas'
import { removeReservationWithUndo } from '../../../store/useAddFlowStore'
import { leerImporte } from '../../../lib/dinero'
import { precioEnVista } from '../../../lib/moneda'
import type { DatosExcursionLeida } from '../../../lib/billeteLeer'

/** Una excursión de la lista de «¿Qué excursión tienes?»: su foto pequeña (o el color), el nombre y «Día completo» / «Medio día». */
function FilaExcursion({ excursion, onPick }: { excursion: Excursion; onPick: () => void }) {
  const mediaJornada = excursion.page?.halfDay ?? excursion.length === 'half-day'
  const foto = excursion.page?.photoUrl ?? null
  return (
    <button type="button" onClick={onPick} className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-text/[.08] bg-white py-2 pl-2 pr-3 text-left transition-colors hover:border-text/25">
      <span className="relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl text-white" style={{ background: excursion.page?.color ?? 'oklch(0.58 0.12 60)' }}>
        {foto ? <img src={foto} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /> : <Icono nombre={ICONOS.excursion} size={20} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-[17px] leading-[1.1] text-text">{excursion.title}</span>
        <span className="text-[11.5px] text-text/55">{mediaJornada ? 'Medio día' : 'Día completo'}</span>
      </span>
      <Icono nombre="adelante" size={16} style={{ color: 'rgba(28,34,48,.45)' }} />
    </button>
  )
}

/** «¿Qué excursión tienes?» (paso 1 de «Añadir una excursión»): las excursiones del destino; al elegir una, la hoja de la hora con «Hora de recogida». */
function HojaQueExcursion({ excursions, onPick, onClose }: { excursions: Excursion[]; onPick: (excursion: Excursion) => void; onClose: () => void }) {
  return (
    <HojaAbajo titleId="hoja-que-excursion" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Añadir una excursión · 1 de 2
      </p>
      <h2 id="hoja-que-excursion" className="mt-1 font-display text-[24px] leading-[1.05] text-text">
        ¿Qué excursión tienes?
      </h2>
      <div className="mt-3.5 flex flex-col gap-1.5">
        {excursions.map((excursion) => (
          <FilaExcursion key={excursion.id} excursion={excursion} onPick={() => onPick(excursion)} />
        ))}
      </div>
    </HojaAbajo>
  )
}

/**
 * El bloque «Excursiones» de RESERVAS (Tanda 6s). Sin día de excursión en la ruta: solo «Excursiones desde Roma · n excursiones» [Ver excursiones] y, dentro de la misma tarjeta, debajo del botón y en pequeño, «¿Ya tienes una? Añádela» (Tanda 6v).
 * Con el día de excursión: solo la tarjeta de esa excursión (la de entrada, con [Reservar excursión] y «¿Ya la tienes? Añádela») y, debajo, «Ver más excursiones». Nunca dos «Añádela».
 * Las añadidas, en una línea verde con «Cambiar». Viajes de menos días que `excursiones_desde_dias`: no sale.
 */
export function ExcursionesReservas({ route, info, abierto = false }: { route: Route; info: DestinationExcursions; abierto?: boolean }) {
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda
  // (Tanda 10N §8: las excursiones también son de cada uno; quien mira el viaje de otra persona ve las suyas.)
  const reservations = useReservasParaMi()
  const grupo = useEntradasDelGrupo()
  const openExcursions = useExcursionsStore((state) => state.openPage)
  const [lista, setLista] = useState(false)
  const [target, setTarget] = useState<ReservationTarget | null>(null)
  // (10R §4) El billete de cada excursión (privado de esta persona) y la hoja «Datos de la excursión».
  const billetes = useBilletesDeExcursiones()
  const [datosDe, setDatosDe] = useState<{ reserva: Reservation; leida: DatosExcursionLeida | null } | null>(null)
  // (10S10 §4 y §5) Un bloque como «Entradas y Free Tour»: cerrado al entrar, siempre; el viajero lo abre y lo cierra.
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  useEffect(() => setDesplegadoUsuario(null), [abierto])
  const desplegado = desplegadoUsuario ?? abierto
  // «¿Ya la has reservado? Añade tu confirmación» de la página del día de excursión: abre este bloque y la hoja de ESA excursión con el día puesto.
  const excursionPedida = useReservasFocusStore((state) => state.excursionPedida)
  useEffect(() => {
    if (!excursionPedida) return
    const { excursion, dayId } = excursionPedida
    useReservasFocusStore.getState().limpiarExcursion()
    setDesplegadoUsuario(true)
    const existing = reservations.find((item) => item.kind === 'excursion' && item.refId === excursion.id && dayOfReservation(route, item)?.id === dayId)
    setTarget({ kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], excursion, currentDayId: dayId, ...(existing ? { existing } : {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excursionPedida])
  const disponible = info.excursions.length > 0 && hasEnoughDaysForExcursions(route, info.fromDays)
  if (!disponible) return null
  const fila = buildExcursionRow(route, reservations)
  const hayDiaDeExcursion = Boolean(fila.excursion && fila.day)
  const añadidas = reservations.filter((item) => item.kind === 'excursion')
  const excursionDe = (reserva: Reservation): Excursion | null => reserva.excursionData ?? info.excursions.find((item) => item.id === reserva.refId) ?? null
  /** Guarda lo privado (personas, localizador, código) en el móvil de esta persona y la hora y el punto de encuentro en la reserva. NO toca la ruta ni el día: la excursión no cambia de sitio (regla 6j). */
  const guardarDatos = (reserva: Reservation, d: DatosDeLaExcursion) => {
    const antes = billetes.de(reserva.refId)
    if (d.personas || d.localizador || d.codigo) useBilleteStore.getState().ponerExcursion(billetes.tripId, reserva.refId, { personas: d.personas, localizador: d.localizador, codigo: d.codigo, dueno: antes?.dueno ?? billetes.yoId })
    else if (antes) useBilleteStore.getState().quitarExcursion(billetes.tripId, reserva.refId)
    const nueva: Reservation = { ...reserva, time: d.hora ?? reserva.time, meetingPoint: d.puntoEncuentro }
    if (nueva.time === reserva.time && nueva.meetingPoint === (reserva.meetingPoint ?? null)) return
    if (grupo.esInvitado) useMisReservas.getState().anadir(nueva)
    else useRouteStore.setState((state) => ({ reservations: state.reservations.map((otra) => (otra.id === reserva.id ? nueva : otra)) }))
  }
  const sinReservar = hayDiaDeExcursion && !fila.reservation
  // (Tanda 10N5, los tres colores) Otro del grupo ya reservó esta excursión y a ti te queda elegir la tuya → azul oscuro con dorado.
  const delGrupo = sinReservar && fila.excursion && grupo.esInvitado ? (grupo.reservasDelDueno.find((r) => r.kind === 'excursion' && r.refId === fila.excursion!.id) ?? null) : null

  return (
    <>
      <BloqueClaro bloque="excursiones">
        <span data-cabecera-excursiones className="block">
          <CabeceraBloque
            icono={ICONOS.excursion}
            titulo="Excursiones"
            datos="excursiones"
            onClick={() => setDesplegadoUsuario(!desplegado)}
            estado={hayDiaDeExcursion ? (fila.reservation ? 'Listo' : '0 de 1 reservada') : 'Ninguna en tu ruta'}
            hecho={!hayDiaDeExcursion || Boolean(fila.reservation)}
            abierto={desplegado}
            className="px-0.5"
          />
        </span>
        {desplegado && (
          <>
        {sinReservar && fila.excursion && fila.day && (
          <EntradaCard
            eyebrow="Excursión"
            when={enTuRuta(route, fila.day)}
            name={fila.excursion.title}
            delGrupo={Boolean(delGrupo)}
            notes={delGrupo ? [{ text: textoQuienVa(grupo.nombreAdmin, route, delGrupo) }] : []}
            buyLabel={delGrupo ? 'Reservar la mía' : 'Reservar excursión'}
            buyHref={fila.excursion.page?.affiliateUrl ?? fila.excursion.bookUrl ?? buildActivitySearchUrl(`${fila.excursion.title} ${route.destination}`)}
            reservedTime={null}
            onAdd={() => setTarget({ kind: 'excursion', refId: fila.excursion!.id, name: fila.excursion!.title, placeNames: [], excursion: fila.excursion, currentDayId: fila.day!.id })}
            onChange={() => undefined}
          />
        )}
        {añadidas.length > 0 && (
          <span data-seccion-reservadas style={ROTULO}>
            Reservadas · {añadidas.length}
          </span>
        )}
        {añadidas.map((reserva) => {
          const excursion = excursionDe(reserva)
          const billete = billetes.de(reserva.refId)
          const gente = grupo.gente.length >= 2 ? idsIncluidos(reserva, grupo.gente).map((id) => grupo.gente.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p)) : []
          const precio = leerImporte(reserva.precio)
          const fecha = reserva.dateIso && route.answers.dateRange ? diaEnCajas(reserva.dateIso) : { rotulo: 'DÍA', grande: `Día ${reserva.dayNumber ?? ''}`.trim() }
          const quitar = () => {
            if (grupo.esInvitado) useMisReservas.getState().quitar(reserva.id)
            else removeReservationWithUndo(reserva.id)
            if (billete) useBilleteStore.getState().quitarExcursion(billetes.tripId, reserva.refId)
          }
          return (
            <div key={reserva.id} className="flex flex-col gap-2" data-excursion-fila={reserva.refId}>
              <TarjetaExcursionDesign
                chip={reserva.noMueve ? 'Ya no está en tu ruta' : 'Excursión'}
                nombre={reserva.name}
                diaRotulo={fecha.rotulo}
                diaGrande={fecha.grande}
                hora={reserva.time}
                gente={gente}
                precio={precio ? precioEnVista(precio) : null}
                billete={billete}
                puntoEncuentro={reserva.meetingPoint ?? excursion?.meetingPoint ?? null}
                ciudad={route.destination}
                cuando={cuandoDeLaReserva(route, reserva)}
                año={route.answers.dateRange ? Number(route.answers.dateRange.start.slice(0, 4)) : undefined}
                onLapizArriba={() => setTarget({ kind: 'excursion', refId: reserva.refId, name: reserva.name, placeNames: [], excursion, currentDayId: dayOfReservation(route, reserva)?.id ?? null, existing: reserva })}
                onLapizDatos={() => setDatosDe({ reserva, leida: null })}
                onLeida={(leida) => setDatosDe({ reserva, leida })}
                onQuitar={quitar}
                extra={reserva.noMueve ? <VolverExcursionARuta route={route} reserva={reserva} excursion={excursion} /> : undefined}
              />
            </div>
          )
        })}
        {/* (10S10 §4) «Ver más excursiones», abajo y DENTRO del bloque; sin día de excursión es lo único que hay (más el atajo pequeño para quien ya tiene una). */}
        <button type="button" onClick={() => openExcursions(false)} data-ver-mas-excursiones className="zona-toque flex h-12 items-center justify-center gap-2 rounded-[15px] border-[1.5px] border-text/20 bg-transparent text-[14px] font-semibold text-text">
          Ver más excursiones
        </button>
        {!hayDiaDeExcursion && (
          <button type="button" onClick={() => setLista(true)} data-ya-tengo-excursion className="zona-toque border-none bg-transparent p-0 text-center text-[12px] leading-[1.25] text-text/60">
            ¿Ya tienes una? <span className="font-semibold text-text underline underline-offset-2">Añádela</span>
          </button>
        )}
          </>
        )}
      </BloqueClaro>
      {lista && (
        <HojaQueExcursion
          excursions={info.excursions}
          onClose={() => setLista(false)}
          onPick={(excursion) => {
            setLista(false)
            const dia = fila.day && fila.excursion?.id === excursion.id ? fila.day : null
            setTarget({ kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], excursion, currentDayId: dia?.id ?? null, paso2: true })
          }}
        />
      )}
      {datosDe && (
        <HojaDatosDeLaExcursion
          billete={billetes.de(datosDe.reserva.refId)}
          puntoActual={datosDe.reserva.meetingPoint ?? excursionDe(datosDe.reserva)?.meetingPoint ?? null}
          horaActual={datosDe.reserva.time}
          leida={datosDe.leida}
          onClose={() => setDatosDe(null)}
          onGuardar={(d) => {
            guardarDatos(datosDe.reserva, d)
            setDatosDe(null)
          }}
        />
      )}
      {target && <AddReservationSheet route={route} target={target} onClose={() => setTarget(null)} />}
    </>
  )
}
