import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { catalogoEnMemoria } from '../../../../lib/destinationPlacesApi'
import { addDaysToIso } from '../../../../lib/dateRange'
import { displayStopName } from '../../../../lib/format'
import { fijasDelDia, horaFijaDe, horaCorta } from '../../../../lib/hoyParada'
import { datosDeHorarioEnMemoria, horarioDeParada, normalizaNombre, useDatosDeHorario } from '../../../../lib/horarioDeParada'
import { direccionDelAlojamiento, enlaceComoLlegarAlojamiento } from '../../../../lib/direccionAlojamiento'
import { StopsMapView, type StopsMapMarker } from '../../../map/StopsMapView'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import {
  candidatosParaAnadir,
  conMeal,
  diaAdmite,
  mejorDiaPara,
  opcionesDeDia,
  minDe,
  escalonDeRetraso,
  proponerAnadir,
  proponerPasarADia,
  proponerRetraso,
  retrasoDeAhora,
  stopDeCandidato,
  type Candidato,
  type Contexto,
  type Propuesta,
} from '../../../../lib/hoyCambiarPlan'
import { abrirHistorial, aplicarPropuesta, cerrarAviso, deshacerUltimo, useCambiarPlanStore } from '../../../../lib/hoyCambiarPlanAplicar'
import { useSyncStore } from '../../../../store/useSyncStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { ListaDeDias } from '../../dayDetail/ListaDeDias'
import { useDatosDeImportancia } from '../masVisitas'
import { useCercaDeAqui } from '../useCercaDeAqui'
import { HojaV2 } from './HojasV2'
import { ParadaFotoDeParada } from './ParadaFoto'
import { HojaComerAhora } from './ComerAhora'
import { BOTON_ORO, BOTON_CLARO } from '../../../ui/botonesOro'

/**
 * HOY2 (agente B, pantallas 22 a 27b y 30 del recorrido): [Cambiar plan] SUSTITUYE a [No me da tiempo]. Un botón en la tarjeta de la parada y, al tocarlo, la hoja de 5 opciones:
 * Voy con retraso (23) · Quiero comer ahora (24, de la HOY2 C: aquí solo su puerta) · Saltarme esta parada (25) · Pasar a otro día (26a/b/c) · Añadir un sitio cercano (27a/b).
 * Todas las propuestas, con el mismo formato: Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original». Nada se mueve sin [Aplicar] y todo lleva «Plan actualizado · Deshacer» (30).
 * Las cuentas están en `src/lib/hoyCambiarPlan.ts` (puras); lo que escribe en el viaje, en `hoyCambiarPlanAplicar.ts`.
 */

const MARFIL = '#FBF3E2'
const BOTON_MARFIL = BOTON_CLARO

const Pic = ({ d, size = 26, color = '#6E5018', grosor = 1.7 }: { d: string; size?: number; color?: string; grosor?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
    <path d={d} />
  </svg>
)
const D_RELOJ = 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'
const D_COMER = 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10'
const D_SALTAR = 'M5 4l10 8-10 8zM19 5v14'
const D_DIAS = 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'
const D_MAS = 'M12 5v14M5 12h14'
const D_CAMBIO = 'M7 7h13l-4-4M17 17H4l4 4'

const diaSemana = (iso: string): string => new Date(`${iso}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' })

/** Todo lo que necesitan las cuentas: lo fijo de cada día, la importancia de cada sitio, el coche y cómo se llama cada día en las frases («jueves», sin fechas «día 3»). */
export function useContexto(route: Route, enCoche: boolean): Contexto {
  const reservations = useRouteStore((s) => s.reservations)
  const datos = useDatosDeImportancia(route.destination)
  const horarios = useDatosDeHorario(route.destination)
  return useMemo(() => {
    const inicio = route.answers.dateRange?.start ?? null
    const mes = route.answers.month ?? null
    return {
      // (V43) La fecha de cada día y el horario de un sitio ese día (los datos reales del destino): para el «mejor día» y «Cerrado ese día».
      fechaDe: (d: DayPlan) => (inicio ? addDaysToIso(inicio, d.dayNumber - 1) : null),
      horarioEn: (s: Stop, fecha: string | null) => {
        const hoursData = (s.hoursData as Record<string, unknown> | null | undefined) ?? horarios.get(normalizaNombre(s.name)) ?? datosDeHorarioEnMemoria(route.destination).get(normalizaNombre(s.name)) ?? null
        const h = hoursData ? horarioDeParada({ hoursData }, fecha, mes) : null
        return h ? { cerrado: h.cerrado, abre: minDe(h.abre), cierra: minDe(h.cierra) } : null
      },
      fijasDe: (d: DayPlan) => fijasDelDia(route, d, reservations),
      datos,
      enCoche,
      etiquetaDia: (d: DayPlan) => (inicio ? diaSemana(addDaysToIso(inicio, d.dayNumber - 1)) : `día ${d.dayNumber}`),
      horaFijaMin: (s: Stop) => {
        const r = reservations.find((x) => x.id === s.reservedId) ?? reservations.find((x) => x.kind === 'entrada' && x.time && x.placeNames.includes(s.name)) ?? null
        const m = /^(\d{1,2}):(\d{2})/.exec(r?.time ?? s.reservationTime ?? '')
        return m ? Number(m[1]) * 60 + Number(m[2]) : horaFijaDe(s, null)
      },
    }
  }, [route, reservations, datos, enCoche, horarios])
}

function Cruz({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Cerrar" className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: 'rgba(28,34,48,.08)' }}>
      <Icono nombre="cerrar" size={17} grosor={2} />
    </button>
  )
}

export function Titulo({ texto, onCerrar }: { texto: string; onCerrar: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>{texto}</span>
      <Cruz onClick={onCerrar} />
    </div>
  )
}

function Opcion({ dato, d, titulo, sub, onClick }: { dato: string; d: string; titulo: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} data-cambiar-opcion={dato} className="flex items-center gap-3.5 rounded-[22px] py-3 pl-3 pr-3.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
      <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl" style={{ background: '#F3E3B2' }}>
        <Pic d={d} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span style={{ font: "400 22px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
        <span className="text-[13.5px] leading-[1.3] text-[#1C2230]/60">{sub}</span>
      </span>
      <Icono nombre="adelante" size={16} grosor={2} />
    </button>
  )
}

const ICONOS_RESUMEN: Record<NonNullable<Propuesta['resumen']>[number]['icono'], { d: string; color: string }> = {
  mover: { d: D_CAMBIO, color: '#8A6418' },
  quitar: { d: 'M5 12h14', color: '#8A6418' },
  ok: { d: 'M5 12.5l4.5 4.5L19 7', color: '#2B7F45' },
  reloj: { d: D_RELOJ, color: '#8A6418' },
  mas: { d: D_MAS, color: '#8A6418' },
}

/** Lo que dice el botón dorado si la propuesta no trae el suyo: SIEMPRE lo que hace, nunca «Aplicar» (V43 §1). */
const BOTON_POR_TIPO: Record<Propuesta['tipo'], string> = { retraso: 'Ajustar mi día', otro_dia: 'Pasarlo a ese día', anadir: 'Añadirlo a mi día', comer: 'Cambiar mi comida', peligro: 'Hacerlo así', lluvia: 'Usar el plan de lluvia', vuelta_lluvia: 'Volver a mi plan', cansados: 'Hacerlo así' }

/** (V43 §1) El resumen: UN solo bloque que no se pulsa (fondo suave, sin borde ni sombra), una línea con icono por cada cambio, solo las que vienen al caso. */
function ResumenDeCambios({ p }: { p: Propuesta }) {
  const lineas = p.resumen ?? [
    { icono: 'mover' as const, texto: `${p.cambia.titulo.charAt(0).toUpperCase()}${p.cambia.titulo.slice(1)}`, sub: p.cambia.detalle },
    { icono: 'ok' as const, texto: `Sigue igual: ${p.mantiene.titulo}`, sub: p.mantiene.detalle },
  ]
  return (
    <div data-propuesta-resumen className="flex flex-col gap-2.5 rounded-[18px] p-3.5" style={{ background: 'rgba(181,138,46,.1)' }}>
      {lineas.map((l, i) => (
        <div key={i} data-resumen-linea={l.icono} className="flex items-start gap-2.5">
          <span className="mt-[1px] flex h-[22px] w-[22px] flex-none items-center justify-center">
            <Pic d={ICONOS_RESUMEN[l.icono].d} size={18} color={ICONOS_RESUMEN[l.icono].color} grosor={2} />
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-[14px] font-medium leading-[1.35]">{l.texto}</span>
            {l.sub && l.sub !== 'Sin cambios.' && <span className="text-[12.5px] leading-[1.35] text-[#1C2230]/60">{l.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * La hoja de una propuesta (V43 §1, la regla de TODAS: retraso, comer, otro día, añadir un sitio, plan de lluvia): el texto de arriba, UN bloque de resumen que no se pulsa,
 * el botón dorado que dice lo que hace y, abajo y pequeño, [Dejarlo como está]. Nada de «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original».
 */
export function HojaPropuesta({ titulo, propuestas, indice, onOtra, onAplicar, onCerrar, vacio, extra, etiquetaAplicar, onElegirOtroDia, children }: { titulo: string; propuestas: Propuesta[]; indice: number; onOtra: () => void; onAplicar: (p: Propuesta) => void; onOriginal?: () => void; onCerrar: () => void; vacio?: string; /** Algo más entre el resumen y el botón dorado (la pausa de «Vamos con calma»). */ extra?: ReactNode; /** Lo que dice el botón dorado si la propuesta no trae el suyo. */ etiquetaAplicar?: string; /** «Pasar a otro día»: en vez de [Ver otra opción], [Elegir otro día]. */ onElegirOtroDia?: () => void; children?: ReactNode }) {
  const p = propuestas[indice] ?? null
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta={titulo} fondo={MARFIL}>
      <div data-cambiar-hoja="propuesta" data-propuesta-tipo={p?.tipo ?? 'vacia'} data-propuesta-caso={p?.caso ?? undefined} className="flex flex-col gap-3">
        <Titulo texto={titulo} onCerrar={onCerrar} />
        {p ? (
          <>
            <span data-propuesta-intro className="text-[14.5px] font-medium leading-[1.4]">{p.intro}</span>
            {p.entradasPasadas && p.entradasPasadas.length > 0 && (
              <span data-propuesta-entrada-pasada className="text-[13.5px] leading-[1.4] text-[#1C2230]/70">
                {p.entradasPasadas.map((e) => `Tu entrada de las ${e.hora} en ${e.nombre} ya ha pasado.`).join(' ')}
              </span>
            )}
            <ResumenDeCambios p={p} />
            {children}
            {extra}
            <button type="button" onClick={() => onAplicar(p)} data-propuesta-aplicar className="flex min-h-[50px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
              {p.pregunta && !p.boton ? 'Sí, dejarlo' : (p.boton ?? etiquetaAplicar ?? BOTON_POR_TIPO[p.tipo])}
            </button>
            {onElegirOtroDia ? (
              <button type="button" onClick={onElegirOtroDia} data-propuesta-elegir-dia className="flex h-11 items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_CLARO}>
                Elegir otro día
              </button>
            ) : (
              propuestas.length > 1 && (
                <button type="button" onClick={onOtra} data-propuesta-otra className="flex min-h-[46px] items-center justify-center rounded-2xl px-3 text-center text-[14px] font-bold" style={BOTON_CLARO}>
                  {p.etiquetaOtra ?? 'Ver otra opción'}
                </button>
              )
            )}
          </>
        ) : (
          <span data-propuesta-vacia className="text-[14.5px] font-medium leading-[1.4]">{vacio ?? 'No hay nada que ajustar: tu día sigue igual.'}</span>
        )}
        <button type="button" onClick={onCerrar} data-propuesta-dejar className="flex h-9 items-center justify-center text-[13px] font-semibold text-[#1C2230]/60">
          Dejarlo como está
        </button>
      </div>
    </HojaV2>
  )
}

/** «Plan actualizado · Deshacer» (30): el aviso de abajo después de cada cambio. (V2, H5) Ya no se pinta aquí: entra en la cola de avisos de abajo (uno a la vez) y lo enseña `AvisoDeAbajoHost`. */
export function AvisoPlanActualizado({ texto, conDeshacer }: { texto: string; conDeshacer: boolean }) {
  useEffect(() => {
    avisarAbajo({ id: `plan:${texto}`, texto, ms: 12000, accion: conDeshacer ? { etiqueta: 'Deshacer', alTocar: () => deshacerUltimo() } : undefined, alIrse: cerrarAviso })
  }, [texto, conDeshacer])
  return null
}

/** (HOY2, C) El «Plan actualizado · Deshacer» de abajo, UNO solo para todo HOY (lo montan HoyDuranteV2 y nadie más): lo usan [Cambiar plan], «Quiero comer ahora», la solución de una entrada en peligro y el plan d… */
export function AvisoPlanActualizadoGlobal() {
  const aviso = useCambiarPlanStore((s) => s.aviso)
  return aviso ? <AvisoPlanActualizado texto={aviso.texto ?? 'Plan actualizado'} conDeshacer /> : null
}

function Mensaje({ titulo, texto, onCerrar, children }: { titulo: string; texto: string; onCerrar: () => void; children?: ReactNode }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta={titulo} fondo={MARFIL}>
      <div data-cambiar-hoja="mensaje" className="flex flex-col gap-3">
        <Titulo texto={titulo} onCerrar={onCerrar} />
        <span className="text-[14.5px] font-medium leading-[1.4]">{texto}</span>
        {children}
      </div>
    </HojaV2>
  )
}

type Paso = null | 'comer' | 'menu' | 'retraso' | 'saltar_reserva' | 'dias' | 'otro_dia' | 'anadir_lista' | 'anadir'

export interface PropsCambiarPlan {
  route: Route
  day: DayPlan
  dateIso: string
  siguiente: Stop
  ubicacion: Coordinates | null
  enCoche: boolean
  ahoraMin: number
  /** Saltarla: lo de siempre (la parada se marca «saltada» y sale «Parada saltada · Deshacer»). */
  onSaltar: () => void
  /** «Quiero comer ahora» (la hoja de la HOY2 C). Sin ella, la puerta avisa de que aún no está. */
  onQuieroComer?: () => void
  /** (V43 §5) Sin nada abierto cerca: [Ver Explorar] y [Volver al alojamiento]. */
  onVerExplorar?: () => void
}

/** [Cambiar plan] y todo lo que abre. */
export function BotonCambiarPlan(p: PropsCambiarPlan) {
  const { route, day, dateIso, siguiente } = p
  const [paso, setPaso] = useState<Paso>(null)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [titulo, setTitulo] = useState('Cambiar plan')
  const [vacio, setVacio] = useState<string | undefined>(undefined)
  const ctx = useContexto(route, p.enCoche)
  const setMode = useRouteStore((s) => s.setMode)
  const enlaceCasa = enlaceComoLlegarAlojamiento(direccionDelAlojamiento(route))
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const cerca = useCercaDeAqui({ tripId, sitiosHoy: day.stops.map((s) => s.name), activo: paso === 'anadir_lista' })
  const fijas = ctx.fijasDe(day)
  const horaFija = ctx.horaFijaMin?.(siguiente) ?? null
  const esFija = fijas.has(siguiente.id) || Boolean(siguiente.reservedId)

  useEffect(() => {
    abrirHistorial(route.id, dateIso)
  }, [route.id, dateIso])

  const cerrar = () => {
    setPaso(null)
    setPropuestas([])
    setIndice(0)
    setVacio(undefined)
  }
  const mostrar = (t: string, lista: Propuesta[], siguientePaso: Paso, sinNada?: string) => {
    setTitulo(t)
    setPropuestas(lista)
    setIndice(0)
    setVacio(sinNada)
    setPaso(siguientePaso)
  }

  const irRetraso = () => {
    const minutos = escalonDeRetraso(retrasoDeAhora(p.ahoraMin, siguiente.time))
    const lista = proponerRetraso({ route, day, paradaId: siguiente.id, minutos, ctx, ahoraMin: p.ahoraMin })
    mostrar('Voy con retraso', lista, 'retraso', 'No hay nada más que ajustar hoy: tu día sigue igual.')
  }
  const irSaltar = () => {
    // (V43 §4) Con una reserva POR LLEGAR, pregunta; si la hora de la reserva ya pasó, no pregunta.
    if (esFija && !(horaFija != null && horaFija < p.ahoraMin)) {
      setPaso('saltar_reserva')
      return
    }
    cerrar()
    p.onSaltar()
  }
  const elegirDia = (destinoId: string) => {
    const r = proponerPasarADia({ route, day, stop: siguiente, destinoId, ctx })
    mostrar('Pasar a otro día', r.propuestas, 'otro_dia', r.razon === 'fija' ? 'Esta parada tiene su entrada reservada: la reserva fija el día, así que no la pasamos a otro.' : 'No podemos pasarla a ese día.')
  }
  const diasPosibles = route.days.filter((d) => d.id !== day.id && diaAdmite(d)).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  // (V43 §4) La lista de días como la de DÍAS al mover una parada: el mejor día, con «Te lo recomendamos»; los días en que está cerrado, en gris («Cerrado ese día»).
  const opcionesDias = paso === 'dias' ? opcionesDeDia({ route, day, stop: siguiente, ctx }) : []
  const mejorDia = paso === 'dias' ? mejorDiaPara({ route, day, stop: siguiente, ctx }) : null
  const cerradosDias = new Set(opcionesDias.filter((o) => o.cerrado).map((o) => o.dia.id))
  const diasOrdenados = mejorDia ? [...diasPosibles].sort((a, b) => Number(b.id === mejorDia.dia.id) - Number(a.id === mejorDia.dia.id)) : diasPosibles

  // «Añadir un sitio cercano»: los de fuera de la ruta (EXPLORAR y «Cerca de ti»), los de logro primero.
  const lugares = catalogoEnMemoria(route.destination)?.places ?? []
  const logros = useMemo(() => {
    const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    const dichos = new Set((cerca?.cerca ?? []).filter((c) => c.hay_emblema || c.coleccion_nombre).flatMap((c) => [norm(c.sitio), norm(c.nombre)]))
    return new Set(lugares.filter((l) => dichos.has(norm(l.name))).map((l) => l.name))
  }, [cerca, lugares])
  const desde = p.ubicacion ?? siguiente.coordinates
  const [activoAnadir, setActivoAnadir] = useState<string | null>(null)
  const [elegidoOtro, setElegidoOtro] = useState<Candidato | null>(null)
  const [quitarDelOtro, setQuitarDelOtro] = useState(false)
  const candidatos: Candidato[] = paso === 'anadir_lista' ? candidatosParaAnadir({ route, lugares, desde, logros, enCoche: p.enCoche, ahoraMin: p.ahoraMin, day, fechaIso: dateIso, mes: route.answers.month ?? null, ctx }) : []
  const elegirSitio = (c: Candidato) => {
    setElegidoOtro(c.deOtroDia ? c : null)
    setQuitarDelOtro(false)
    const lista = proponerAnadir({ route, day, stop: stopDeCandidato(c), ctx, ahoraMin: p.ahoraMin }).map((x) => ({ ...x, avisoTexto: `${displayStopName(c.nombre)}, añadida a tu día` }))
    mostrar('Añadir un sitio cercano', lista, 'anadir', `Hoy no cabe ${displayStopName(c.nombre)} sin quitar algo importante. Mejor déjalo para otro momento.`)
  }

  const aplicar = (pr: Propuesta) => {
    // (V43 §5) Un sitio de otro día se añade hoy y el otro día NO se toca, salvo que el viajero pulse [Quitarlo del {día}].
    let propuesta = pr
    if (quitarDelOtro && elegidoOtro?.deOtroDia) {
      const o = route.days.find((d) => d.id === elegidoOtro.deOtroDia?.diaId)
      const s = o?.stops.find((x) => x.id === elegidoOtro.deOtroDia?.stopId)
      if (o && s) {
        const iy = o.stops.findIndex((x) => x.id === s.id)
        propuesta = { ...pr, ops: [...pr.ops, { t: 'sacar', dia: o.id, stop: s, indice: iy, ...conMeal(o, iy, false) }] }
      }
    }
    aplicarPropuesta(route.id, dateIso, propuesta)
    setElegidoOtro(null)
    setQuitarDelOtro(false)
    cerrar()
  }

  return (
    <>
      <button type="button" onClick={() => setPaso('menu')} data-hoy-cambiar-plan className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_MARFIL}>
        <Pic d={D_CAMBIO} size={17} color="currentColor" grosor={2} />
        Cambiar plan
      </button>
      {paso === 'menu' && (
        <HojaV2 onCerrar={cerrar} etiqueta="Cambiar plan" fondo={MARFIL}>
          <div data-cambiar-hoja="menu" className="flex flex-col gap-3">
            <Titulo texto="Cambiar plan" onCerrar={cerrar} />
            <Opcion dato="retraso" d={D_RELOJ} titulo="Voy con retraso" sub="Ajustamos tu día lo mínimo" onClick={irRetraso} />
            <Opcion
              dato="comer"
              d={D_COMER}
              titulo="Quiero comer ahora"
              sub="Restaurantes abiertos cerca"
              onClick={() => {
                if (p.onQuieroComer) {
                  cerrar()
                  p.onQuieroComer()
                } else setPaso('comer')
              }}
            />
            <Opcion dato="saltar" d={D_SALTAR} titulo="Saltarme esta parada" sub="Guárdala en pendientes y decide luego." onClick={irSaltar} />
            <Opcion dato="otro_dia" d={D_DIAS} titulo="Pasar a otro día" sub="Elige otro día de tu viaje que te vaya bien." onClick={() => setPaso('dias')} />
            <Opcion dato="anadir" d={D_MAS} titulo="Añadir un sitio cercano" sub="Algo que te pille de paso" onClick={() => setPaso('anadir_lista')} />
          </div>
        </HojaV2>
      )}
      {paso === 'comer' && <HojaComerAhora route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={p.ubicacion} enCoche={p.enCoche} ahoraMin={p.ahoraMin} onCerrar={cerrar} />}
      {paso === 'retraso' && <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onCerrar={cerrar} />}
      {paso === 'saltar_reserva' && (
        <Mensaje titulo="Saltarme esta parada" texto={`Tienes reserva${horaFija != null ? ` a las ${horaCorta(`${Math.floor(horaFija / 60)}:${String(horaFija % 60).padStart(2, '0')}`)}` : ''} para ${displayStopName(siguiente.name)}. Si te lo saltas, puedes perderla.`} onCerrar={cerrar}>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={cerrar} data-saltar-cancelar className="flex h-12 items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_ORO}>
              No, lo mantengo
            </button>
            <button
              type="button"
              onClick={() => {
                cerrar()
                p.onSaltar()
              }}
              data-saltar-igual
              className="flex h-12 items-center justify-center rounded-2xl text-[14px] font-bold"
              style={BOTON_MARFIL}
            >
              Saltarlo igual
            </button>
          </div>
        </Mensaje>
      )}
      {paso === 'dias' && (
        <HojaV2 onCerrar={cerrar} etiqueta="Pasar a otro día" fondo={MARFIL}>
          <div data-cambiar-hoja="dias" className="flex flex-col gap-2">
            <Titulo texto="Pasar a otro día" onCerrar={cerrar} />
            <ListaDeDias dias={diasOrdenados} ahora={day.dayNumber} onElegir={elegirDia} recomendado={mejorDia?.dia.id ?? null} cerrados={cerradosDias} />
          </div>
        </HojaV2>
      )}
      {paso === 'otro_dia' && <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onElegirOtroDia={() => setPaso('dias')} onCerrar={cerrar} />}
      {paso === 'anadir_lista' && (
        <HojaV2 onCerrar={cerrar} etiqueta="Añadir un sitio cercano" fondo={MARFIL}>
          <div data-cambiar-hoja="anadir_lista" className="flex flex-col gap-2.5">
            <Titulo texto="Añadir un sitio cercano" onCerrar={cerrar} />
            <span data-anadir-ubicacion className="text-[13px] leading-[1.4] text-[#1C2230]/65">{p.ubicacion ? 'Cerca de ti' : `Sin tu ubicación, contamos desde ${displayStopName(siguiente.name)}`}</span>
            {candidatos.length > 0 && (
              <div data-anadir-mapa className="h-[170px] flex-none overflow-hidden rounded-[22px]" style={{ border: '1px solid rgba(28,34,48,.12)' }}>
                <StopsMapView
                  markers={candidatos.filter((c) => hasRealCoordinates(c.coordinates)).map((c, i): StopsMapMarker => ({ id: c.nombre, name: c.nombre, coordinates: c.coordinates, number: i + 1, bg: activoAnadir === c.nombre ? '#B58A2E' : '#1C2230', text: '#fff' }))}
                  activeStopId={activoAnadir}
                  onSelectStop={(id) => setActivoAnadir(id)}
                  userPosition={p.ubicacion}
                />
              </div>
            )}
            {candidatos.length === 0 && (
              <div data-anadir-vacio className="flex flex-col gap-2.5">
                <span className="text-[14.5px] font-medium leading-[1.4]">A esta hora no queda nada abierto cerca.</span>
                {enlaceCasa && (
                  <a href={enlaceCasa} target="_blank" rel="noopener noreferrer" onClick={cerrar} data-anadir-alojamiento className="flex h-12 items-center justify-center rounded-2xl text-[14px] font-bold no-underline" style={BOTON_ORO}>
                    Volver al alojamiento
                  </a>
                )}
                <button type="button" onClick={() => { cerrar(); if (p.onVerExplorar) p.onVerExplorar(); else setMode('explore') }} data-anadir-explorar className="flex h-11 items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_MARFIL}>
                  Ver Explorar
                </button>
              </div>
            )}
            {candidatos.map((c, i) => (
              <div key={c.nombre} data-anadir-candidato={c.nombre} data-anadir-logro={c.logro ? '1' : undefined} data-anadir-escalon={c.escalon} onClick={() => setActivoAnadir(c.nombre)} className="flex min-h-[64px] items-center gap-2.5 rounded-[18px] p-2" style={{ background: '#FFFDF8', border: activoAnadir === c.nombre ? '1.5px solid #B58A2E' : '1px solid rgba(28,34,48,.12)' }}>
                <span data-anadir-numero className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px] font-bold" style={{ background: activoAnadir === c.nombre ? '#B58A2E' : '#1C2230', color: '#fff' }}>{i + 1}</span>
                {/* (V43 §5) La foto, como en el resto de HOY: se pide al servidor por el nombre (el catálogo no la trae). */}
                <ParadaFotoDeParada parada={stopDeCandidato(c)} ciudad={day.city} dateIso={dateIso} vista size={48} marca={false} carga="eager" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate" style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{displayStopName(c.nombre)}</span>
                  <span className="text-[12px] text-[#1C2230]/60">
                    {p.enCoche ? `a ${Math.max(1, Math.round((c.metros * 1.35) / ((40 * 1000) / 60)))} min en coche` : `a ${Math.max(1, Math.round(c.metros / 80))} min a pie`}
                    {c.porFuera ? ' · por fuera' : ''}
                  </span>
                  {c.estado && (
                    <span data-anadir-estado className="text-[12px] font-semibold" style={{ color: c.estado.cierraPronto ? '#C2581C' : c.estado.alAireLibre ? '#2E5F8A' : 'oklch(0.38 0.1 150)' }}>
                      {c.estado.texto}
                    </span>
                  )}
                  <span className="flex flex-wrap gap-1">
                    {c.logro && (
                      <span data-anadir-recompensa className="rounded-full px-2 py-px text-[10.5px] font-bold" style={{ background: 'rgba(181,138,46,.2)', color: '#6E5018' }}>
                        Contiene recompensa
                      </span>
                    )}
                    {c.deOtroDia && (
                      <span data-anadir-otro-dia className="rounded-full px-2 py-px text-[10.5px] font-bold" style={{ background: 'rgba(46,95,138,.14)', color: '#2E5F8A' }}>
                        Lo tienes el {c.deOtroDia.etiqueta}
                      </span>
                    )}
                  </span>
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); elegirSitio(c) }} data-anadir-elegir className="flex h-11 flex-none items-center rounded-2xl px-3.5 text-[13.5px] font-bold" style={BOTON_ORO}>
                  Elegir
                </button>
              </div>
            ))}
          </div>
        </HojaV2>
      )}
      {paso === 'anadir' && (
        <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onCerrar={cerrar}>
          {elegidoOtro?.deOtroDia && (
            <button type="button" onClick={() => setQuitarDelOtro((v) => !v)} data-anadir-quitar-del-otro aria-pressed={quitarDelOtro} className="self-start rounded-full px-3 py-1.5 text-[12.5px] font-bold" style={quitarDelOtro ? { background: '#1C2230', color: '#F3D88F' } : { background: 'rgba(46,95,138,.12)', color: '#2E5F8A' }}>
              {quitarDelOtro ? `Se quitará del ${elegidoOtro.deOtroDia.etiqueta}` : `Quitarlo del ${elegidoOtro.deOtroDia.etiqueta}`}
            </button>
          )}
        </HojaPropuesta>
      )}
    </>
  )
}
