import { useEffect, useState } from 'react'
import type { Route } from '../../../lib/types'
import type { CambioDeVuelo, EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { puntoCorto, type ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf, legWord, legsTag, type LegKind, type LegState } from '../../../lib/reservasLegs'
import { useRouteStore } from '../../../store/useRouteStore'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { entreEfectivo, idsConLoSuyo } from '../../../lib/loSuyo'
import { BloqueShell, CambiarBoton, EliminarTexto, EstadoBloque, FlechaBloque, IconoBloque, iconoDeMedio, tituloBloqueStyle, INK } from './BloqueReservas'
import { leerImporte } from '../../../lib/dinero'
import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { fechaLarga } from '../../../lib/fechaLarga'
import { HojaDelVuelo, type LadoDeHoja } from './HojaDelVuelo'
import { useDineroDeReserva } from './DineroDeReserva'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { EnEsteChips } from './EnEsteChips'
import { Icono } from '../../ui/Icono'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'

const ETIQUETA_PUNTO: Record<string, string> = { avion: 'Aeropuerto', tren: 'Estación', bus: 'Estación', ferry: 'Puerto', coche: 'Punto' }
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/**
 * LA HOJA DEL VUELO DEL ADMINISTRADOR (Tanda 10N10 §7b; `Piezas/Vuelo Reservas` 02-05b): las pestañas Ida | Vuelta con sus datos (día fijo, aeropuerto, hora, referencia, aerolínea y «¿De dónde sales? · opcional»)
 * y, debajo, para TODO el vuelo, el bloque del dinero (¿para quién?, ¿cuánto ha costado en total?, ¿quién lo ha pagado?, la línea de a dónde va). La rueda de la hora no tiene [Guardar]: un solo botón «Guardar el vuelo» y un solo aviso
 * (`guardarVueloDelAdmin` apunta UN cambio con la ida y la vuelta juntas). El precio, el para quién y quién pagó se guardan en el viaje (`setLegPrecio`, `setCuentasEntre`, `setPagadoPorDe`).
 */
export function HojaVueloDelAdmin({
  route,
  ida,
  vuelta,
  ladoInicial,
  onFechas,
  onClose,
  onGuardar,
}: {
  route: Route
  ida: LegState
  vuelta: LegState
  ladoInicial: LegKind
  onFechas: () => void
  onClose: () => void
  onGuardar: (cambios: { arrival?: { time: string; pointId?: string | null }; departure?: { time: string; pointId?: string | null }; medio?: string }, cambiosDeVuelo: CambioDeVuelo[]) => void
}) {
  const setLegPrecio = useRouteStore((s) => s.setLegPrecio)
  const setLegCodigo = useRouteStore((s) => s.setLegCodigo)
  const setLegCompania = useRouteStore((s) => s.setLegCompania)
  const setLegOtroPunto = useRouteStore((s) => s.setLegOtroPunto)
  const setLegOtraHora = useRouteStore((s) => s.setLegOtraHora)
  const setCuentasEntre = useRouteStore((s) => s.setCuentasEntre)
  const setPagadoPorDe = useRouteStore((s) => s.setPagadoPorDe)
  const principal = ida.mode !== 'coche' ? ida : vuelta
  const noun = legWord(principal.mode).noun
  const dinero = useDineroDeReserva({
    para: route.cuentasEntre?.llegada ?? route.cuentasEntre?.vuelta ?? null,
    pagado: route.pagadoPorDe?.llegada ?? null,
    precio: leerImporte(route.arrivalPrecio) ?? leerImporte(route.departurePrecio),
  })
  const lado = (leg: LegState): LadoDeHoja => ({
    activo: leg.mode !== 'coche',
    hora: leg.time,
    punto: leg.point ? puntoCorto(leg.point) : null,
    fecha: leg.dateIso,
    hecho: leg.done && leg.mode !== 'coche',
    dias: leg.dateIso ? [{ iso: leg.dateIso, texto: fechaLarga(leg.dateIso) }] : [],
    diasFijos: true,
    puntos: leg.points.map(puntoCorto),
    etiquetaPunto: ETIQUETA_PUNTO[leg.mode] ?? 'Punto',
    puntoObligatorio: leg.hasButtons,
    llega: leg.kind === 'arrival',
    extras: {
      codigo: leg.codigo ?? '',
      compania: leg.compania ?? '',
      otroPunto: leg.otroPunto ?? '',
      otraHora: leg.otraHora,
      etiquetaOtro: leg.kind === 'arrival' ? '¿De dónde sales? · opcional' : '¿A dónde llegas? · opcional',
      marcaOtraHora: leg.kind === 'arrival' ? 'Sales a las' : 'Llegas a las',
    },
  })
  return (
    <HojaDelVuelo
      titulo={`Tu ${noun}`}
      textoGuardar={`Guardar el ${noun}`}
      datos="admin"
      lados={{ ida: lado(ida), vuelta: lado(vuelta) }}
      ladoInicial={ladoInicial === 'arrival' ? 'ida' : 'vuelta'}
      extra={dinero.bloque('vuelo')}
      avisoFechas={
        <span className="mt-3 block text-[12px] leading-[1.35] text-text/60">
          ¿Llegas o te vas otro día?{' '}
          <button type="button" onClick={onFechas} className="underline underline-offset-2" style={{ color: INK }}>
            Cambia las fechas del viaje
          </button>
        </span>
      }
      onClose={onClose}
      onGuardar={(gIda, gVuelta) => {
        const cambios: Parameters<typeof onGuardar>[0] = { medio: noun }
        const avisos: CambioDeVuelo[] = []
        for (const [leg, g] of [[ida, gIda], [vuelta, gVuelta]] as const) {
          if (leg.mode === 'coche' || !g.puesto) continue
          const punto = leg.points.length === 1 ? leg.points[0] : (leg.points.find((p) => puntoCorto(p) === g.punto) ?? null)
          const entrada = { time: g.hora, ...(punto ? { pointId: punto.id } : {}) }
          if (leg.kind === 'arrival') cambios.arrival = entrada
          else cambios.departure = entrada
          // (Los motores solo se enteran de lo que de verdad ha cambiado: la hora o el punto de esa mitad.)
          if (leg.time !== g.hora) avisos.push({ que: 'hora', mitad: leg.kind })
          else if (punto && leg.point?.id !== punto.id) avisos.push({ que: 'punto', mitad: leg.kind })
        }
        onGuardar(cambios, avisos)
        // Lo de más: referencia, aerolínea, el otro punto y su hora, y el dinero (todo el vuelo a la vez).
        for (const [leg, g] of [[ida, gIda], [vuelta, gVuelta]] as const) {
          if (leg.mode === 'coche' || !g.puesto) continue
          setLegCodigo(leg.kind, g.codigo)
          setLegCompania(leg.kind, g.compania)
          setLegOtroPunto(leg.kind, g.otroPunto)
          setLegOtraHora(leg.kind, g.otraHora)
        }
        const total = dinero.precio.importe
        setLegPrecio(principal.kind, total)
        const otra = principal.kind === 'arrival' ? 'departure' : 'arrival'
        if (ida.mode !== 'coche' && vuelta.mode !== 'coche') setLegPrecio(otra, null)
        if (!dinero.solo) {
          const todos = dinero.gente.map((p) => p.id)
          const lista = dinero.paraIds.length === todos.length ? null : dinero.paraIds
          const paga = dinero.paraIds.length > 1 && total ? dinero.pagadoIds : null
          for (const clave of ['llegada', 'vuelta']) {
            setCuentasEntre(clave, lista)
            setPagadoPorDe(clave, paga)
          }
        }
      }}
    />
  )
}

/** Una mitad en la tarjeta guardada (Design 06): «IDA · Jueves 29 octubre · Cambiar», «Llegas a las» / 11:20 / «Aeropuerto de Fiumicino · Roma». */
function MitadGuardada({ leg, ciudad, onCambiar, onQuitar }: { leg: LegState; ciudad: string; onCambiar: () => void; onQuitar: () => void }) {
  const esIda = leg.kind === 'arrival'
  const fecha = leg.dateIso ? capitalizar(fechaLarga(leg.dateIso)) : `Día ${leg.dayNumber}`
  const coche = leg.mode === 'coche'
  return (
    <div data-mitad={leg.kind} data-mitad-hecha={leg.done ? '1' : '0'} className="mx-3.5 mb-3 flex flex-col gap-1 rounded-[18px] px-3.5 pb-3.5 pt-3" style={{ background: '#FBF1D8', border: '1px solid rgba(181,138,46,.3)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1 rounded-full px-2.5" style={{ background: '#1C2230', color: '#F3D88F', font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
            <Icono nombre={iconoDeMedio(leg.mode)} size={11} />
            {esIda ? 'Ida' : 'Vuelta'}
          </span>
          <span style={{ font: "600 13.5px 'Geist'", color: INK }}>
            {fecha}
          </span>
        </span>
        {!coche && <CambiarBoton onClick={onCambiar} texto={leg.done ? 'Cambiar' : 'Añadir'} />}
      </div>
      {coche ? (
        <span className="text-[14px] text-text/70">{legLine(leg)}</span>
      ) : leg.done ? (
        <>
          <span className="text-[13px] text-text/60">{esIda ? 'Llegas a las' : 'Sales a las'}</span>
          <span style={{ font: "400 34px/1 'Instrument Serif',serif" }}>{leg.time}</span>
          <span className="text-[13px] text-text/60">
            {leg.point ? `${leg.point.nombre} · ${ciudad}` : ciudad}
            {leg.codigo ? ` · ${leg.codigo.toUpperCase()}` : ''}
          </span>
          <EliminarTexto onClick={onQuitar} texto={`Eliminar ${legWord(leg.mode).noun}`} />
        </>
      ) : (
        <span className="text-[13.5px] text-text/55">{esIda ? 'Falta la ida' : 'Falta la vuelta'}</span>
      )}
    </div>
  )
}

/**
 * El bloque «Llegada y vuelta» de RESERVAS (Tanda 10N10 §7; `Piezas/Vuelo Reservas` 01 y 06). Sin nada hecho, una tarjeta con «Falta» que abre la hoja del vuelo. Con algo hecho, la ida y la vuelta con su hora grande,
 * [Cambiar] en cada una (abre la misma hoja) y, dentro de la MISMA tarjeta, «En este vuelo · Tú y Viajes» (en redondo) con [Cambiar]. Fuera la caja del pase «Tu primer y tu último día» y el bloque suelto «En este vuelo».
 */
export function LlegadaYVuelta({
  route,
  info,
  abierto,
  onToggle,
  mitadAbierta,
  onMitad,
  onCambioDeVuelo,
  onFechas,
}: {
  route: Route
  info: ArrivalInfo
  /** (Se conserva por el panel; la tarjeta ya no usa las zonas.) */
  zonas?: unknown
  abierto: boolean
  onToggle: () => void
  /** undefined = la que falta; null = ninguna. */
  mitadAbierta: LegKind | null | undefined
  onMitad: (mitad: LegKind | null | undefined) => void
  onCambioDeVuelo: EnCambioDeVuelo
  onFechas: () => void
}) {
  useMonedaViajero() // se repinta al cambiar la moneda
  const guardarVueloDelAdmin = useRouteStore((state) => state.guardarVueloDelAdmin)
  const removeLeg = useRouteStore((state) => state.removeFlightLeg)
  const marcarVueltaVista = useRouteStore((state) => state.marcarVueltaVista)
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const g = useEntradasDelGrupo()
  // La hoja del vuelo: la ida y la vuelta juntas y UN solo botón «Guardar el vuelo». `vueloAbierto` es la pestaña con la que se abre.
  const [vueloAbierto, setVueloAbierto] = useState<LegKind | null>(null)
  const ida = legOf(route, info, 'arrival')
  const vuelta = legOf(route, info, 'departure')
  const origen = route.origin
  const ciudad = route.days[0]?.city ?? route.destination
  const hecho = ida.done && vuelta.done
  const algoHecho = ida.done || vuelta.done
  const hayVuelo = (ida.done && ida.mode !== 'coche') || (vuelta.done && vuelta.mode !== 'coche')
  const etiqueta = legsTag(ida, vuelta)
  const precioTotal = leerImporte(route.arrivalPrecio) ?? leerImporte(route.departurePrecio)
  // El viajero ha abierto su vuelta: ya la ha visto con las fechas de ahora (se va el aviso de la campana de «has cambiado los días del viaje»).
  const fechaDeLaVuelta = route.answers.dateRange?.end ?? null
  useEffect(() => {
    if (vueloAbierto === 'departure') marcarVueltaVista()
  }, [vueloAbierto, fechaDeLaVuelta, marcarVueltaVista])
  // Las fichas del resumen, el «+ AÑADIR VUELO» de DÍAS y el «Editar» de la ventana de llegada piden este bloque con una mitad: se abre la hoja.
  useEffect(() => {
    if (abierto && !vueloAbierto) {
      setVueloAbierto(mitadAbierta === 'departure' ? 'departure' : mitadAbierta === 'arrival' ? 'arrival' : !ida.done ? 'arrival' : !vuelta.done ? 'departure' : 'arrival')
      onMitad(undefined)
      onToggle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const abrirHoja = (mitad: LegKind) => {
    setVueloAbierto(mitad)
  }
  const primeraLibre: LegKind = !ida.done && ida.mode !== 'coche' ? 'arrival' : !vuelta.done && vuelta.mode !== 'coche' ? 'departure' : ida.mode !== 'coche' ? 'arrival' : 'departure'

  // «En este vuelo · Tú y Viajes»: a quién cubre (en un viaje con más gente).
  const adminId = g.gente.find((p) => p.esAdmin)?.id ?? null
  const todos = g.gente.map((p) => p.id)
  const declarado = route.cuentasEntre?.llegada ?? route.cuentasEntre?.vuelta ?? null
  const efectivo = entreEfectivo(declarado, todos, idsConLoSuyo(grupoLoSuyo, 'vuelo'), adminId)
  const quienes = g.gente.filter((p) => efectivo.includes(p.id))
  const nombresQuienes = (() => {
    const n = quienes.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'))
    return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
  })()
  const quitar = (leg: LegState) => {
    const teniaHora = Boolean(leg.time)
    quitarConDeshacer(`${leg.kind === 'arrival' ? 'Ida' : 'Vuelta'} quitada del viaje`, () => removeLeg(leg.kind))
    if (teniaHora) onCambioDeVuelo({ que: 'quitar', mitad: leg.kind })
  }

  return (
    <>
      <BloqueShell bloque="llegada">
        {!algoHecho ? (
          <div onClick={() => abrirHoja(primeraLibre)} className="flex cursor-pointer items-center gap-3.5 p-4" data-llegada-vacia>
            <IconoBloque nombre={iconoDeMedio(ida.mode)} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span style={tituloBloqueStyle}>Llegada y vuelta</span>
              <EstadoBloque texto={etiqueta} hecho={false} />
              <span className="text-[13px] text-text/55">
                {origen} → {ciudad}
              </span>
            </span>
            <FlechaBloque abierto={false} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3.5 px-4 pb-3 pt-4">
              <IconoBloque nombre={iconoDeMedio(ida.mode)} hecho={hecho} />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span style={tituloBloqueStyle}>Llegada y vuelta</span>
                <span className="text-[13px] text-text/55">
                  {origen} → {ciudad}
                  {precioTotal ? ` · ${precioEnVista(precioTotal)}` : ''}
                </span>
              </span>
              <EstadoBloque texto={hecho ? 'Listo' : etiqueta} hecho={hecho} />
            </div>
            <MitadGuardada leg={ida} ciudad={ciudad} onCambiar={() => abrirHoja('arrival')} onQuitar={() => quitar(ida)} />
            <MitadGuardada leg={vuelta} ciudad={ciudad} onCambiar={() => abrirHoja('departure')} onQuitar={() => quitar(vuelta)} />
            {hayVuelo && g.gente.length >= 2 && g.esAdmin && (
              <div className="flex flex-col gap-2.5 px-4 pb-4 pt-1" data-en-este-vuelo>
                <span className="flex items-center justify-between text-text/55" style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>
                  En este vuelo
                  <CambiarBoton onClick={() => abrirHoja(primeraLibre)} />
                </span>
                <EnEsteChips gente={quienes} datos="vuelo" />
                <span hidden data-en-este-vuelo-nombres>
                  {nombresQuienes}
                </span>
              </div>
            )}
          </>
        )}
      </BloqueShell>
      {vueloAbierto && (
        <HojaVueloDelAdmin
          route={route}
          ida={ida}
          vuelta={vuelta}
          ladoInicial={vueloAbierto}
          onFechas={() => {
            setVueloAbierto(null)
            onFechas()
          }}
          onClose={() => setVueloAbierto(null)}
          onGuardar={(cambios, cambiosDeVuelo) => {
            guardarVueloDelAdmin(cambios)
            setVueloAbierto(null)
            onMitad(undefined)
            for (const cambio of cambiosDeVuelo) onCambioDeVuelo(cambio)
          }}
        />
      )}
    </>
  )
}
