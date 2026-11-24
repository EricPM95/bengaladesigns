import { useMemo, useState } from 'react'
import type { DayPlan, Route } from '../../../../lib/types'
import { displayStopName } from '../../../../lib/format'
import { esDestinoDeCoche } from '../../../../lib/experienceCategoryBank'
import { etiquetaConNumero, mejorDiaPara } from '../../../../lib/hoyCambiarPlan'
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

/**
 * «LUGARES PENDIENTES» (V2 y V43 §7): lo SALTADO y lo que no dio tiempo o ya ha cerrado, aparte de «Si te sobra tiempo». Va al final de HOY, cerrado con su número o abierto, y la lista se ve ENTERA (se baja con la página).
 * Filas COMPACTAS: la foto pequeña, el nombre, la pastilla del motivo, [Otro día] y «···». El «···» abre: Recuperar hoy (solo si sigue abierto), Ya lo visité y Quitar (en rojo, con [Deshacer]).
 * [Pasar todos a otros días] va en azul oscuro con dorado, a propósito: así destaca sobre los botones de cada fila. Antes enseña el resumen (L4): cada uno a su mejor día; los que no caben se quedan en pendientes.
 */
const ORO_TEXTO = '#8E6820'
const TINTA = '#1C2230'
const ORO_CLARO = '#F3D88F'

export function LugaresPendientes({ route, day, dateIso, pendientes }: { route: Route; day: DayPlan; dateIso: string; pendientes: Pendiente[] }) {
  const [abierta, setAbierta] = useState(false)
  const [pasando, setPasando] = useState<Pendiente | null>(null)
  const [menu, setMenu] = useState<Pendiente | null>(null)
  const [resumen, setResumen] = useState(false)
  const setStopSaltada = useRouteStore((s) => s.setStopSaltada)
  const setStopVisto = useRouteStore((s) => s.setStopVisto)
  const moveStopToDay = useRouteStore((s) => s.moveStopToDay)
  const removeStop = useRouteStore((s) => s.removeStop)
  const insertStopAt = useRouteStore((s) => s.insertStopAt)
  const ctx = useContexto(route, esDestinoDeCoche(route.destination))
  // L4: el mejor día de cada pendiente (abierto, cerca, sin llenarlo). Se calcula al abrir el resumen, no en cada pintado.
  const reparto = useMemo(
    () => (resumen ? pendientes.filter((p) => !p.stop.reservedId).map((p) => ({ p, mejor: mejorDiaPara({ route, day, stop: p.stop, ctx }) })) : []),
    [resumen, pendientes, route, day, ctx],
  )
  if (pendientes.length === 0) return null
  // (V43) Solo días de DESPUÉS de hoy: lo de un día pasado no se toca (la app no deja mover a ni desde un día pasado).
  const diasPara = (p: Pendiente) => route.days.filter((d) => !d.isReturnLeg && d.id !== p.dayId && d.dayNumber > day.dayNumber).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  // (V44 §3) TODO lo que cambia la ruta lleva [Deshacer] y va ABAJO (sobre el menú): recuperar hoy, ya lo visité, quitar, pasar a otro día y pasar todos.
  const conDeshacer = (id: string, texto: string, deshacer: () => void) => avisarAbajo({ id, texto, accion: { etiqueta: 'Deshacer', alTocar: deshacer } })
  const recuperar = (p: Pendiente) => {
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
  const visitado = (p: Pendiente) => {
    setStopVisto(p.dayId, p.stop.id, true)
    conDeshacer(`visitado:${p.stop.id}`, `${displayStopName(p.stop.name)}, marcada como visitada`, () => setStopVisto(p.dayId, p.stop.id, false))
  }
  const pasar = (p: Pendiente, aDayId: string) => {
    const estabaSaltada = Boolean(p.stop.saltada)
    const aDia = route.days.find((d) => d.id === aDayId)
    moveStopToDay(p.stop.id, p.dayId, aDayId)
    setStopSaltada(aDayId, p.stop.id, false)
    setPasando(null)
    conDeshacer(`pasar:${p.stop.id}`, `${displayStopName(p.stop.name)}, pasada al ${aDia ? etiquetaConNumero(ctx, aDia) : 'otro día'}`, () => {
      moveStopToDay(p.stop.id, aDayId, p.dayId)
      setStopSaltada(p.dayId, p.stop.id, estabaSaltada)
    })
  }
  const quitar = (p: Pendiente) => {
    const d = route.days.find((x) => x.id === p.dayId)
    const indice = d ? d.stops.findIndex((s) => s.id === p.stop.id) : -1
    removeStop(p.dayId, p.stop.id)
    conDeshacer(`quitar:${p.stop.id}`, `${displayStopName(p.stop.name)}, quitada de tu ruta`, () => insertStopAt(p.dayId, Math.max(indice, 0), p.stop))
  }
  const pasarTodos = () => {
    const hechos = reparto.filter((x) => x.mejor).map(({ p, mejor }) => ({ p, aDayId: (mejor as NonNullable<typeof mejor>).dia.id, estabaSaltada: Boolean(p.stop.saltada) }))
    for (const h of hechos) {
      moveStopToDay(h.p.stop.id, h.p.dayId, h.aDayId)
      setStopSaltada(h.aDayId, h.p.stop.id, false)
    }
    setResumen(false)
    if (hechos.length > 0)
      conDeshacer('pasar-todos', hechos.length === 1 ? `${displayStopName(hechos[0].p.stop.name)}, pasada a otro día` : `${hechos.length} lugares pasados a otros días`, () => {
        for (const h of hechos) {
          moveStopToDay(h.p.stop.id, h.aDayId, h.p.dayId)
          setStopSaltada(h.p.dayId, h.p.stop.id, h.estabaSaltada)
        }
      })
  }
  const caben = reparto.filter((x) => x.mejor)
  const noCaben = reparto.filter((x) => !x.mejor)
  return (
    <div data-hoy-pendientes={pendientes.length} data-hoy-pendientes-estado={abierta ? 'abierta' : 'cerrada'} className="flex flex-none flex-col rounded-[24px]" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)', boxShadow: abierta ? '0 24px 40px -28px rgba(28,34,48,.5)' : 'none' }}>
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} data-hoy-pendientes-cabecera className="flex min-h-12 items-center gap-2.5 px-4 text-left">
        <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' }}>Lugares pendientes</span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-bold" style={{ background: TINTA, color: '#fff' }}>{pendientes.length}</span>
        <span className="flex-1" />
        <Icono nombre={abierta ? 'arriba' : 'abajo'} size={15} grosor={2} style={{ color: ORO_TEXTO }} />
      </button>
      {abierta && (
        <div style={{ borderTop: '1px solid rgba(28,34,48,.08)' }}>
          {pendientes.some((p) => !p.stop.reservedId) && (
            <div className="px-4 pt-3">
              <button type="button" onClick={() => setResumen(true)} data-hoy-pendientes-pasar-todos className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold" style={{ background: TINTA, color: ORO_CLARO }}>
                <Icono nombre="dias" size={16} grosor={1.8} />
                Pasar todos a otros días
              </button>
            </div>
          )}
          <ul data-hoy-pendientes-lista className="m-0 flex list-none flex-col divide-y p-0" style={{ borderColor: 'rgba(28,34,48,.08)' }}>
            {pendientes.map((p) => (
              <li key={`${p.dayId}-${p.stop.id}`} data-hoy-pendiente={p.motivo} data-hoy-pendiente-id={p.stop.id} className="flex items-center gap-3 px-4 py-3">
                <span data-hoy-pendiente-foto className="flex flex-none">
                  <ParadaFotoDeParada parada={p.stop} ciudad={day.city} dateIso={dateIso} vista marca={false} size={56} carga="eager" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <p className="m-0 w-full text-[20px] leading-[1.05] text-[#1C2230]" style={{ fontFamily: "'Instrument Serif',serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{displayStopName(p.stop.name)}</p>
                  <span data-hoy-pendiente-pastilla className="flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-bold" style={{ background: '#F6F0E2', color: '#6E5018' }}>
                    <Icono nombre={p.motivo === 'cerrada' ? 'reloj' : 'seguir'} size={12} grosor={1.9} />
                    {p.texto}
                  </span>
                </div>
                {diasPara(p).length > 0 && !p.stop.reservedId && (
                  <button type="button" onClick={() => setPasando(p)} data-hoy-pendiente-pasar className="flex h-11 flex-none items-center rounded-2xl px-3.5 text-[13px] font-bold" style={BOTON_ORO}>
                    Otro día
                  </button>
                )}
                <button type="button" onClick={() => setMenu(p)} aria-label="Más opciones" data-hoy-pendiente-mas className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-[20px] font-bold" style={BOTON_CLARO}>
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
            {menu.motivo !== 'cerrada' && (
              <OpcionTarjeta tono="salvia" icono={ICONOS_OPCION.volver} titulo="Recuperar hoy" linea="Vuelve a ser una parada normal del día" datos="pendiente-recuperar" atributos={{ 'data-hoy-pendiente-recuperar': '1' }} onClick={() => { recuperar(menu); setMenu(null) }} />
            )}
            <OpcionTarjeta tono="arena" icono={ICONOS_OPCION.check} titulo="Ya lo visité" linea="Márcala como vista y quítala de pendientes" atributos={{ 'data-hoy-pendiente-visitado': '1' }} onClick={() => { visitado(menu); setMenu(null) }} />
            <OpcionTarjeta peligro icono={ICONOS_OPCION.papelera} titulo="Quitar" linea="Sale de tu lista. Puedes deshacerlo" atributos={{ 'data-hoy-pendiente-quitar': '1' }} onClick={() => { quitar(menu); setMenu(null) }} />
          </HojaDelMenu>
        </span>
      )}
      {resumen && (
        <HojaV2 onCerrar={() => setResumen(false)} etiqueta="Pasar todos a otros días" fondo="#FBF3E2">
          <div data-hoy-pendientes-resumen className="flex flex-col gap-3">
            <Titulo texto="Pasar todos a otros días" onCerrar={() => setResumen(false)} />
            <span className="text-[14.5px] font-medium leading-[1.4]">Cada sitio va al día donde mejor encaja.</span>
            <div className="flex flex-col gap-2 rounded-[18px] p-3.5" style={{ background: 'rgba(181,138,46,.1)' }}>
              {caben.map(({ p, mejor }) => (
                <span key={p.stop.id} className="text-[14px] font-medium leading-[1.35]">{displayStopName(p.stop.name)} pasa al {mejor?.etiqueta}</span>
              ))}
              {noCaben.map(({ p }) => (
                <span key={p.stop.id} className="text-[14px] leading-[1.35] text-[#1C2230]/65">{displayStopName(p.stop.name)} se queda en pendientes: no cabe en otro día</span>
              ))}
            </div>
            {caben.length > 0 ? (
              <button type="button" onClick={pasarTodos} data-hoy-pendientes-confirmar className="flex min-h-[50px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
                {caben.length === 1 ? 'Pasarlo' : 'Pasarlos'} a su día
              </button>
            ) : (
              <span className="text-[14px] font-medium">Ninguno cabe en otro día: se quedan aquí.</span>
            )}
            <button type="button" onClick={() => setResumen(false)} className="flex h-9 items-center justify-center text-[13px] font-semibold text-[#1C2230]/60">
              Dejarlo como está
            </button>
          </div>
        </HojaV2>
      )}
      {pasando && <HojaPasarAOtroDia dias={diasPara(pasando)} ahora={day.dayNumber} onElegir={(id) => pasar(pasando, id)} onCerrar={() => setPasando(null)} />}
    </div>
  )
}
