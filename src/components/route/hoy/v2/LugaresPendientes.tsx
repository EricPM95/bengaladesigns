import { useEffect, useMemo, useRef, useState } from 'react'
import { useReorganizarStore } from '../../../../store/useReorganizarStore'
import { CuadradoPendientes, IconoPendientes } from './IconoPendientes'
import type { DayPlan, Route } from '../../../../lib/types'
import { displayStopName } from '../../../../lib/format'
import { esDestinoDeCoche } from '../../../../lib/experienceCategoryBank'
import { diaAdmite, etiquetaConNumero, mejorDiaPara } from '../../../../lib/hoyCambiarPlan'
import type { Pendiente } from '../../../../lib/hoyPendientes'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { HojaPasarAOtroDia } from '../saltar'
import { HojaV2 } from './HojasV2'
import { HojaDelMenu } from '../../../ui/MenuHoja'
import { ICONOS_OPCION, OpcionTarjeta } from '../../../ui/HojaOpciones'
import { Titulo, useContexto } from './CambiarPlan'
import { ParadaFotoDeParada } from './ParadaFoto'
import { BOTON_CLARO, BOTON_ORO } from '../../../ui/botonesOro'
import { CuadradoFecha } from '../../../ui/CuadradoFecha'
import { formatWeekdayAbbrEs } from '../../../../lib/dateRange'
import { BOTON_AZUL, EnlaceDejarlo } from '../piezas'

/**
 * «LUGARES PENDIENTES» (V2 y V43 §7): lo SALTADO y lo que no dio tiempo o ya ha cerrado, aparte de «Si te sobra tiempo». Va al final de HOY, cerrado con su número o abierto, y la lista se ve ENTERA (se baja con la página).
 * Filas COMPACTAS: la foto pequeña, el nombre, la pastilla del motivo, [Otro día] y «···». El «···» abre: Recuperar hoy (solo si sigue abierto), Ya lo visité y Quitar (en rojo, con [Deshacer]).
 * [Pasar todos a otros días] va en azul oscuro con dorado, a propósito: así destaca sobre los botones de cada fila. Antes enseña el resumen (L4): cada uno a su mejor día; los que no caben se quedan en pendientes.
 *
 * (V69; Design «Lugares Pendientes» L5) UNA SOLA LISTA PARA TODO EL VIAJE: la misma pieza sale también en DÍAS (`modo="dias"`), al final de la lista de días, justo encima de «Añadir día», ya abierta y con el motivo
 * de cada sitio en gris. Si está vacía, no sale. `day` = el día de hoy (null antes del viaje: entonces nada se «recupera hoy» y solo cuentan los días que quedan por delante de ninguno). Lo que viene de «Si te sobra
 * tiempo» (`origen: 'sobra'`: lo que Reorganizar no pudo colocar) vive en las `spareStops` de su día: pasarlo a otro día lo mete en ese día y lo saca de ahí, con [Deshacer].
 */
const TINTA = '#1C2230'

export function LugaresPendientes({ route, day, dateIso, pendientes, modo = 'hoy', abiertaDeEntrada = false, conAHoy = false }: { route: Route; day: DayPlan | null; dateIso: string | null; pendientes: Pendiente[]; modo?: 'hoy' | 'dias'; /** (V80) Sale ya abierta (el día libre de la excursión cancelada). */ abiertaDeEntrada?: boolean; /** (V80) El día libre de la excursión cancelada: cada fila lleva [+ A hoy] (entra en el día de hoy; este día no admite sitios si hay excursión, y aquí ya no la hay). */ conAHoy?: boolean }) {
  const [abierta, setAbierta] = useState(modo === 'dias' || abiertaDeEntrada)
  const raiz = useRef<HTMLDivElement>(null)
  // (V77) [Ver] de «Y N sitios más pasan a Lugares pendientes»: DÍAS abre esta lista y baja hasta ella.
  const pedida = useReorganizarStore((s) => s.verSobraTiempoDe)
  useEffect(() => {
    if (modo !== 'dias' || !pedida) return
    setAbierta(true)
    useReorganizarStore.getState().verSobraTiempo(null)
    window.setTimeout(() => raiz.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
  }, [pedida, modo])
  const [pasando, setPasando] = useState<Pendiente | null>(null)
  const [menu, setMenu] = useState<Pendiente | null>(null)
  const [resumen, setResumen] = useState(false)
  const setStopSaltada = useRouteStore((s) => s.setStopSaltada)
  const setStopVisto = useRouteStore((s) => s.setStopVisto)
  const moveStopToDay = useRouteStore((s) => s.moveStopToDay)
  const removeStop = useRouteStore((s) => s.removeStop)
  const insertStopAt = useRouteStore((s) => s.insertStopAt)
  const ctx = useContexto(route, esDestinoDeCoche(route.destination))
  // El día «de referencia» para contar los días posteriores: hoy, o (antes del viaje) uno que no existe, así que se cuentan todos.
  const hoyNum = day?.dayNumber ?? 0
  const referencia: DayPlan = day ?? { ...route.days[0], id: '__antes_del_viaje__' }
  const ciudadDe = (p: Pendiente) => route.days.find((d) => d.id === p.dayId)?.city ?? day?.city ?? ''
  // L4: el mejor día de cada pendiente (abierto, cerca, sin llenarlo). Se calcula al abrir el resumen, no en cada pintado.
  const reparto = useMemo(
    () =>
      resumen
        ? pendientes.filter((p) => !p.stop.reservedId).map((p) => ({ p, mejor: mejorDiaPara({ route, day: referencia, stop: p.stop, ctx, dias: route.days.filter((d) => d.id !== p.dayId && d.dayNumber > hoyNum) }) }))
        : [],
    [resumen, pendientes, route, referencia, ctx, hoyNum],
  )
  if (pendientes.length === 0) return null
  // (V43) Solo días de DESPUÉS de hoy: lo de un día pasado no se toca (la app no deja mover a ni desde un día pasado).
  const diasPara = (p: Pendiente) => route.days.filter((d) => !d.isReturnLeg && d.dayType !== 'excursion' && d.interruptor?.mode !== 'excursion' && d.id !== p.dayId && d.dayNumber > hoyNum).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  // (V44 §3) TODO lo que cambia la ruta lleva [Deshacer] y va ABAJO (sobre el menú): recuperar hoy, ya lo visité, quitar, pasar a otro día y pasar todos.
  const conDeshacer = (id: string, texto: string, deshacer: () => void) => avisarAbajo({ id, texto, accion: { etiqueta: 'Deshacer', alTocar: deshacer } })
  // Lo de «Si te sobra tiempo» (spareStops) cambia de sitio con estas dos (la inversa es la otra): sale de ahí y entra en el día, o al revés.
  const sobraADia = (p: Pendiente, aDayId: string) => {
    const { spareReason: _motivo, ...limpia } = p.stop
    void _motivo
    useRouteStore.getState().addStop(aDayId, { ...limpia, addedByUser: true, saltada: false })
    useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, spareStops: (d.spareStops ?? []).filter((x) => x.id !== p.stop.id) } : d)) } } : actual))
  }
  const diaASobra = (p: Pendiente, deDayId: string) => {
    removeStop(deDayId, p.stop.id)
    useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, spareStops: [...(d.spareStops ?? []).filter((x) => x.id !== p.stop.id), p.stop] } : d)) } } : actual))
  }
  // (V77) [Añadir a hoy] de lo que antes era «Si te sobra tiempo» (lo que hacía [Recuperar]): entra en el día de hoy, al final de su franja y por su hora orientativa, y sale de la lista de pendientes. Con [Deshacer] vuelve.
  const anadirAHoy = (p: Pendiente) => {
    if (!day) return
    const { id } = p.stop
    if (p.dayId !== day.id) {
      // Viene de la lista de otro día: pasa primero a la de hoy y de ahí al día (la misma función de siempre).
      useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, spareStops: (d.spareStops ?? []).filter((x) => x.id !== id) } : d.id === day.id ? { ...d, spareStops: [...(d.spareStops ?? []).filter((x) => x.id !== id), p.stop] } : d)) } } : actual))
    }
    useRouteStore.getState().addSpareStop(day.id, id)
    conDeshacer(`anadir:${id}`, `${displayStopName(p.stop.name)}, añadida a tu día`, () => {
      removeStop(day.id, id)
      useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, spareStops: [...(d.spareStops ?? []).filter((x) => x.id !== id), p.stop] } : d)) } } : actual))
    })
  }
  const recuperar = (p: Pendiente) => {
    if (!day) return
    const deOtroDia = p.dayId !== day.id
    const estabaSaltada = Boolean(p.stop.saltada)
    if (deOtroDia) moveStopToDay(p.stop.id, p.dayId, day.id)
    setStopSaltada(day.id, p.stop.id, false)
    conDeshacer(`recuperar:${p.stop.id}`, `${displayStopName(p.stop.name)}, de vuelta en tu día`, () => {
      setStopSaltada(day.id, p.stop.id, true)
      if (deOtroDia) {
        moveStopToDay(p.stop.id, day.id, p.dayId)
        setStopSaltada(p.dayId, p.stop.id, estabaSaltada)
      }
    })
  }
  // (V80) [+ A hoy]: lo que venía de «Lugares pendientes» entra en el día de hoy (con [Deshacer], como siempre): lo de «No cabía…» con `anadirAHoy`; lo saltado o de otro día con `recuperar`.
  // Lo de un día que YA PASÓ no se mueve con `moveStopToDay` (la red de seguridad de la V24 no deja): sale de su día y entra en el de hoy con las acciones que sí valen (`addStop` en hoy), y [Deshacer] lo devuelve a su sitio.
  const aHoy = (p: Pendiente) => {
    if (!day) return
    if (p.origen === 'sobra') return anadirAHoy(p)
    if (p.dayId === day.id) return recuperar(p)
    const origen = route.days.find((d) => d.id === p.dayId)
    const indice = origen ? origen.stops.findIndex((s) => s.id === p.stop.id) : -1
    const estabaSaltada = Boolean(p.stop.saltada)
    useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, stops: d.stops.filter((s) => s.id !== p.stop.id) } : d)) } } : actual))
    useRouteStore.getState().addStop(day.id, { ...p.stop, saltada: false, addedByUser: true })
    conDeshacer(`a-hoy:${p.stop.id}`, `${displayStopName(p.stop.name)}, añadida a tu día`, () => {
      removeStop(day.id, p.stop.id)
      useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, stops: [...d.stops.slice(0, Math.max(indice, 0)), { ...p.stop, saltada: estabaSaltada }, ...d.stops.slice(Math.max(indice, 0))] } : d)) } } : actual))
    })
  }
  const visitado = (p: Pendiente) => {
    setStopVisto(p.dayId, p.stop.id, true)
    conDeshacer(`visitado:${p.stop.id}`, `Has visto ${displayStopName(p.stop.name)}`, () => setStopVisto(p.dayId, p.stop.id, false))
  }
  const pasar = (p: Pendiente, aDayId: string) => {
    const estabaSaltada = Boolean(p.stop.saltada)
    const aDia = route.days.find((d) => d.id === aDayId)
    if (p.origen === 'sobra') sobraADia(p, aDayId)
    else {
      moveStopToDay(p.stop.id, p.dayId, aDayId)
      setStopSaltada(aDayId, p.stop.id, false)
    }
    setPasando(null)
    conDeshacer(`pasar:${p.stop.id}`, `${displayStopName(p.stop.name)}, pasada al ${aDia ? etiquetaConNumero(ctx, aDia) : 'otro día'}`, () => {
      if (p.origen === 'sobra') diaASobra(p, aDayId)
      else {
        moveStopToDay(p.stop.id, aDayId, p.dayId)
        setStopSaltada(p.dayId, p.stop.id, estabaSaltada)
      }
    })
  }
  const quitar = (p: Pendiente) => {
    if (p.origen === 'sobra') {
      useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, spareStops: (d.spareStops ?? []).filter((x) => x.id !== p.stop.id) } : d)) } } : actual))
      conDeshacer(`quitar:${p.stop.id}`, `${displayStopName(p.stop.name)}, quitada de tu ruta`, () =>
        useRouteStore.setState((actual) => (actual.route ? { route: { ...actual.route, days: actual.route.days.map((d) => (d.id === p.dayId ? { ...d, spareStops: [...(d.spareStops ?? []), p.stop] } : d)) } } : actual)),
      )
      return
    }
    const d = route.days.find((x) => x.id === p.dayId)
    const indice = d ? d.stops.findIndex((s) => s.id === p.stop.id) : -1
    removeStop(p.dayId, p.stop.id)
    conDeshacer(`quitar:${p.stop.id}`, `${displayStopName(p.stop.name)}, quitada de tu ruta`, () => insertStopAt(p.dayId, Math.max(indice, 0), p.stop))
  }
  const pasarTodos = () => {
    const hechos = reparto.filter((x) => x.mejor).map(({ p, mejor }) => ({ p, aDayId: (mejor as NonNullable<typeof mejor>).dia.id, estabaSaltada: Boolean(p.stop.saltada) }))
    for (const h of hechos) {
      if (h.p.origen === 'sobra') sobraADia(h.p, h.aDayId)
      else {
        moveStopToDay(h.p.stop.id, h.p.dayId, h.aDayId)
        setStopSaltada(h.aDayId, h.p.stop.id, false)
      }
    }
    setResumen(false)
    if (hechos.length > 0)
      conDeshacer('pasar-todos', hechos.length === 1 ? `${displayStopName(hechos[0].p.stop.name)}, pasada a otro día` : `${hechos.length} lugares pasados a otros días`, () => {
        for (const h of hechos) {
          if (h.p.origen === 'sobra') diaASobra(h.p, h.aDayId)
          else {
            moveStopToDay(h.p.stop.id, h.aDayId, h.p.dayId)
            setStopSaltada(h.p.dayId, h.p.stop.id, h.estabaSaltada)
          }
        }
      })
  }
  const caben = reparto.filter((x) => x.mejor)
  const noCaben = reparto.filter((x) => !x.mejor)
  return (
    <div ref={raiz} data-hoy-pendientes={pendientes.length} data-pendientes-modo={modo} data-hoy-pendientes-estado={abierta ? 'abierta' : 'cerrada'} className="flex flex-none flex-col rounded-[22px]" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-hoy-pendientes-cabecera className="flex min-h-12 items-center gap-2.5 px-4 py-3.5 text-left">
        <IconoPendientes />
        <span style={{ font: "600 11.5px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#6F4E37', textTransform: 'uppercase' }}>Lugares pendientes</span>
        <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full px-1.5 text-[12.5px] font-bold" style={{ background: TINTA, color: '#fff' }}>{pendientes.length}</span>
        <span className="flex-1" />
        <Icono nombre={abierta ? 'arriba' : 'abajo'} size={18} grosor={2} style={{ color: TINTA }} />
      </button>
      {abierta && (
        <div className="px-3 pb-2.5" style={{ borderTop: '1px solid rgba(28,34,48,.07)' }}>
          {pendientes.some((p) => !p.stop.reservedId) && (
            <div className="pb-1.5 pt-2.5">
              <button type="button" onClick={() => setResumen(true)} data-hoy-pendientes-pasar-todos className="flex h-[46px] w-full items-center justify-center gap-[9px] rounded-2xl text-[14px] font-bold" style={BOTON_AZUL}>
                <Icono nombre="dias" size={17} grosor={2} />
                Pasar todos a otros días
              </button>
            </div>
          )}
          <ul data-hoy-pendientes-lista className="m-0 flex list-none flex-col divide-y p-0" style={{ borderColor: 'rgba(28,34,48,.08)' }}>
            {pendientes.map((p) => (
              <li key={`${p.dayId}-${p.stop.id}`} data-hoy-pendiente={p.motivo} data-hoy-pendiente-id={p.stop.id} className="flex items-center gap-2 py-2">
                <span data-hoy-pendiente-foto className="flex flex-none">
                  <ParadaFotoDeParada parada={p.stop} ciudad={ciudadDe(p)} dateIso={dateIso} vista marca={false} size={38} carga="eager" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-[3px]">
                  <p className="m-0 w-full text-[13.5px] font-bold leading-[1.15] text-[#1C2230]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayStopName(p.stop.name)}</p>
                  <span data-hoy-pendiente-pastilla className="text-[11.5px] font-medium leading-[1.2]" style={{ color: '#8A6A2C' }}>
                    {p.texto}
                  </span>
                </div>
                {diasPara(p).length > 0 && !p.stop.reservedId && (
                  <button type="button" onClick={() => setPasando(p)} data-hoy-pendiente-pasar className="zona-toque flex h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-xl px-[11px] text-[12px] font-bold" style={BOTON_ORO}>
                    <Icono nombre="dias" size={14} grosor={2} />
                    Otro día
                  </button>
                )}
                {conAHoy && day && !p.stop.reservedId && (
                  <button type="button" onClick={() => aHoy(p)} data-hoy-pendiente-a-hoy className="zona-toque flex h-9 flex-none items-center whitespace-nowrap rounded-xl px-[9px] text-[12px] font-bold" style={BOTON_CLARO}>
                    + A hoy
                  </button>
                )}
                <button type="button" onClick={() => setMenu(p)} aria-label="Más opciones" data-hoy-pendiente-mas className="zona-toque flex h-[34px] w-[30px] flex-none items-center justify-center rounded-xl pb-[5px] text-[16px] font-bold leading-none tracking-[1px]" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.16)', color: TINTA }}>
                  ···
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {menu && (
        <span data-hoy-pendiente-menu>
          <HojaDelMenu etiqueta="Parada" titulo={displayStopName(menu.stop.name)} onCerrar={() => setMenu(null)} z={95}>
            {menu.motivo !== 'cerrada' && menu.origen !== 'sobra' && day && (
              <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.volver} titulo="Recuperar hoy" linea="Vuelve a ser una parada normal del día" datos="pendiente-recuperar" atributos={{ 'data-hoy-pendiente-recuperar': '1' }} onClick={() => { recuperar(menu); setMenu(null) }} />
            )}
            {menu.origen === 'sobra' && day && modo === 'hoy' && (diaAdmite(day) || conAHoy) && !menu.stop.reservedId && (
              <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.volver} titulo="Añadir a hoy" linea="Entra en tu día de hoy" datos="pendiente-anadir-hoy" atributos={{ 'data-hoy-pendiente-anadir-hoy': '1' }} onClick={() => { anadirAHoy(menu); setMenu(null) }} />
            )}
            {menu.origen !== 'sobra' && (
              <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.check} titulo="Ya lo visité" linea="Márcala como vista y quítala de pendientes" atributos={{ 'data-hoy-pendiente-visitado': '1' }} onClick={() => { visitado(menu); setMenu(null) }} />
            )}
            <OpcionTarjeta peligro icono={ICONOS_OPCION.papelera} titulo="Quitar" linea="Sale de tu lista. Puedes deshacerlo" atributos={{ 'data-hoy-pendiente-quitar': '1' }} onClick={() => { quitar(menu); setMenu(null) }} />
          </HojaDelMenu>
        </span>
      )}
      {resumen && (
        <HojaV2 onCerrar={() => setResumen(false)} etiqueta="Pasar todos a otros días" fondo="#FBF3E2">
          <div data-hoy-pendientes-resumen className="flex flex-col gap-3">
            <Titulo texto="Pasar todos a otros días" onCerrar={() => setResumen(false)} />
            <span className="text-[14.5px] font-medium leading-[1.4]" style={{ color: 'rgba(28,34,48,.7)' }}>Ponemos cada sitio en el mejor día donde quepa.</span>
            {caben.length > 0 && <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' }}>Pasan a otro día · {caben.length}</span>}
            {/* (V63 §17) Una fila por sitio, como las tarjetas de las demás hojas: la foto, el nombre, a dónde va en gris y, a la derecha, su cuadrado azul de la fecha. Sin flecha. */}
            <div className="flex flex-col gap-2">
              {caben.map(({ p, mejor }) => {
                const iso = mejor ? ctx.fechaDe?.(mejor.dia) ?? null : null
                return (
                  <div key={p.stop.id} data-resumen-pasa className="flex items-center gap-3 rounded-[20px] bg-[#FFFDF8] p-3" style={{ border: '1px solid rgba(181,138,46,.45)' }}>
                    <ParadaFotoDeParada parada={p.stop} ciudad={ciudadDe(p)} dateIso={dateIso} vista marca={false} size={46} carga="eager" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="line-clamp-2" style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{displayStopName(p.stop.name)}</span>
                      <span className="text-[12.5px] font-medium leading-[1.25] text-[#1C2230]/60">{mejor ? `Al ${mejor.etiqueta}` : ''}</span>
                    </span>
                    {iso ? <CuadradoFecha semana={formatWeekdayAbbrEs(iso)} numero={Number(iso.slice(8, 10))} /> : <span className="flex-none text-[12.5px] font-semibold" style={{ color: '#6E5018' }}>{mejor?.etiqueta}</span>}
                  </div>
                )
              })}
            </div>
            {noCaben.length > 0 && <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#8A6A2C', textTransform: 'uppercase' }}>No caben · se quedan en pendientes · {noCaben.length}</span>}
            <div className="flex flex-col gap-2">
              {noCaben.map(({ p }) => (
                <div key={p.stop.id} data-resumen-no-cabe className="flex items-center gap-3 rounded-[20px] bg-[#FFFDF8] p-3" style={{ border: '1px solid rgba(28,34,48,.12)' }}>
                  <ParadaFotoDeParada parada={p.stop} ciudad={ciudadDe(p)} dateIso={dateIso} vista marca={false} size={46} carga="eager" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2" style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{displayStopName(p.stop.name)}</span>
                    <span className="text-[12.5px] font-medium leading-[1.25] text-[#1C2230]/60">Se queda en Lugares pendientes</span>
                  </span>
                  <CuadradoPendientes />
                </div>
              ))}
            </div>
            {caben.length > 0 ? (
              <button type="button" onClick={pasarTodos} data-hoy-pendientes-confirmar className="flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
                {caben.length === 1 ? 'Pasar el que cabe' : `Pasar los ${caben.length} que caben`}
              </button>
            ) : (
              <span className="text-[14px] font-medium">Ninguno cabe en otro día: se quedan aquí.</span>
            )}
            <EnlaceDejarlo onClick={() => setResumen(false)} />
          </div>
        </HojaV2>
      )}
      {pasando && <HojaPasarAOtroDia dias={diasPara(pasando)} ahora={hoyNum} onElegir={(id) => pasar(pasando, id)} onCerrar={() => setPasando(null)} />}
    </div>
  )
}
