import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CuadradoPendientes, IconoPendientes } from './IconoPendientes'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import { CuadradoFecha } from '../../../ui/CuadradoFecha'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { catalogoEnMemoria } from '../../../../lib/destinationPlacesApi'
import { addDaysToIso } from '../../../../lib/dateRange'
import { displayStopName } from '../../../../lib/format'
import { fijasDelDia, horaFijaDe, horaCorta } from '../../../../lib/hoyParada'
import { datosDeHorarioEnMemoria, horarioDeParada, normalizaNombre, useDatosDeHorario } from '../../../../lib/horarioDeParada'
import { direccionDelAlojamiento, enlaceComoLlegarAlojamiento, puntoDelAlojamiento } from '../../../../lib/direccionAlojamiento'
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
import { Cruz, HojaV2 } from './HojasV2'
import { ParadaFotoDeParada } from './ParadaFoto'
import { HojaComerAhora } from './ComerAhora'
import { LineaUbicacion } from './LineaUbicacion'
import { BOTON_ORO, BOTON_CLARO } from '../../../ui/botonesOro'
import { Etiqueta, EnlaceDejarlo } from '../piezas'

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
export const D_RELOJ = 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'
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

export function Titulo({ texto, onCerrar }: { texto: string; onCerrar: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>{texto}</span>
      <Cruz onClick={onCerrar} />
    </div>
  )
}

/** (Noche 24-25 nov) LA FILA DE OPCIÓN de las hojas de HOY (Cambiar plan, «Más tiempo aquí»…): el icono en su cuadrado de oro, el título, la línea de debajo y la flecha. */
export function Opcion({ dato, d, titulo, sub, onClick, datos }: { dato: string; d: string; titulo: string; sub: string; onClick: () => void; datos?: Record<string, string> }) {
  return (
    <button type="button" onClick={onClick} data-cambiar-opcion={dato} {...datos} className="flex items-center gap-3.5 rounded-[22px] py-3 pl-3 pr-3.5 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
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

/** (Noche 24-25 nov; Design «Hoy Recorrido» 23a) Cada línea del resumen lleva su icono blanco en un círculo de 24 px: dorado si cambia algo, verde si sigue igual. */
const ICONOS_RESUMEN: Record<NonNullable<Propuesta['resumen']>[number]['icono'], { d: string; color: string }> = {
  mover: { d: D_CAMBIO, color: '#B58A2E' },
  quitar: { d: 'M5 12h14', color: '#B58A2E' },
  ok: { d: 'M5 12.5l4.5 4.5L19 7', color: '#2B7F45' },
  reloj: { d: D_RELOJ, color: '#B58A2E' },
  mas: { d: D_MAS, color: '#B58A2E' },
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
    <div data-propuesta-resumen className="flex flex-col gap-2.5 rounded-2xl p-3.5" style={{ background: 'rgba(28,34,48,.05)' }}>
      {lineas.map((l, i) => (
        <div key={i} data-resumen-linea={l.icono} className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full" style={{ background: ICONOS_RESUMEN[l.icono].color }}>
            <Pic d={ICONOS_RESUMEN[l.icono].d} size={13} color="#fff" grosor={2.6} />
          </span>
          <span className="flex flex-col gap-px">
            <span className="text-[14px] font-semibold leading-[1.3]">{l.texto}</span>
            {l.sub && l.sub !== 'Sin cambios.' && <span className="text-[12.5px] leading-[1.35] text-[#1C2230]/60">{l.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * (V50; Design «Aviso Cierre» A2/A4) «Pasar a otro día»: LA TARJETA DEL SITIO (foto pequeña, nombre, cuándo en gris y la fecha en su cuadrado oscuro; no se pulsa) y la franja verde de lo que sigue igual.
 * La misma pieza para Cambiar plan › «Pasar a otro día» y para el aviso «Hoy ya no puedes entrar…».
 */
export function FranjaVerde({ texto }: { texto: string }) {
  return (
    <div data-franja-sigue-igual className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-semibold leading-[1.3]" style={{ background: '#E6F1E7', color: '#1F5A33' }}>
      <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-white" style={{ background: '#2B7F45' }} aria-hidden="true">
        <Icono nombre="hecho" size={12} grosor={3} />
      </span>
      {texto}
    </div>
  )
}

export function TarjetaDelSitio({ t, sinFranja = false }: { t: NonNullable<Propuesta['tarjetaDia']>; sinFranja?: boolean }) {
  return (
    <>
      <div data-tarjeta-del-sitio className="flex items-center gap-3 rounded-[20px] bg-[#FFFDF8] p-3" style={{ border: '1px solid rgba(181,138,46,.45)', boxShadow: '0 10px 18px -14px rgba(60,40,10,.4)' }}>
        <span className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[14px]" style={{ background: 'linear-gradient(150deg,#C9A57A,#8A6A4C)' }}>
          {t.fotoUrl && <img src={t.fotoUrl} alt="" className="h-full w-full object-cover" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2" style={{ font: "400 20px/1.1 'Instrument Serif',serif" }}>{t.nombre}</span>
          <span className="text-[12.5px] font-medium leading-[1.25] text-[#1C2230]/60">{t.cuando}</span>
        </span>
        {t.aPendientes ? <CuadradoPendientes /> : <CuadradoFecha semana={t.semanaCorta} numero={t.numero} datos={{ 'data-tarjeta-fecha': '1' }} />}
      </div>
      {!t.aPendientes && !sinFranja && <FranjaVerde texto={`Sigue igual: el resto de tu ${t.diaDeHoy}`} />}
    </>
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
                {p.entradasPasadas.map((e) => (e.freeTour ? `Tu ${e.nombre} de las ${e.hora} ya ha pasado.` : `Tu entrada de las ${e.hora} en ${e.nombre} ya ha pasado.`)).join(' ')}
              </span>
            )}
            {p.tarjetasDia && p.tarjetasDia.length > 0 ? (
              <>
                {p.tarjetasDia.map((t, k) => <TarjetaDelSitio key={k} t={t} sinFranja />)}
                {p.franja && <FranjaVerde texto={p.franja} />}
              </>
            ) : p.tarjetaDia ? <TarjetaDelSitio t={p.tarjetaDia} /> : <ResumenDeCambios p={p} />}
            {children}
            {extra}
            {(() => {
              /* V53 §3: con DOS opciones (el dorado y «Dejarlo como está») van lado a lado, del mismo tamaño; con tres o más, el dorado, el blanco con borde debajo y la salida como texto pequeño. */
              const oro = (
                <button type="button" onClick={() => onAplicar(p)} data-propuesta-aplicar className="flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_ORO}>
                  {p.pregunta && !p.boton ? 'Sí, dejarlo' : (p.boton ?? etiquetaAplicar ?? BOTON_POR_TIPO[p.tipo])}
                </button>
              )
              if (!onElegirOtroDia && propuestas.length <= 1) {
                return (
                  <div data-dos-botones className="grid grid-cols-2 gap-2.5">
                    {oro}
                    <button type="button" onClick={onCerrar} data-propuesta-dejar="1" className="flex min-h-[52px] items-center justify-center rounded-2xl px-3 text-center text-[15px] font-bold" style={BOTON_CLARO}>
                      Dejarlo como está
                    </button>
                  </div>
                )
              }
              return (
                <>
                  {oro}
                  {onElegirOtroDia ? (
                    <button type="button" onClick={onElegirOtroDia} data-propuesta-elegir-dia className="flex h-12 items-center justify-center rounded-2xl text-[14.5px] font-bold" style={BOTON_CLARO}>
                      Elegir otro día
                    </button>
                  ) : (
                    <button type="button" onClick={onOtra} data-propuesta-otra className="flex min-h-12 items-center justify-center rounded-2xl px-3 text-center text-[14.5px] font-bold" style={BOTON_CLARO}>
                      {p.etiquetaOtra ?? 'Ver otra opción'}
                    </button>
                  )}
                  <EnlaceDejarlo onClick={onCerrar} datos={{ 'data-propuesta-dejar': '1' }} />
                </>
              )
            })()}
          </>
        ) : (
          <span data-propuesta-vacia className="text-[14.5px] font-medium leading-[1.4]">{vacio ?? 'No hay nada que ajustar: tu día sigue igual.'}</span>
        )}
        {!p && <EnlaceDejarlo onClick={onCerrar} datos={{ 'data-propuesta-dejar': '1' }} />}
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
  /** (V52 §1) La parada ya ha cerrado: en lugar de [Cambiar plan], [Pasar a otro día] (dorado, abre la hoja de siempre) y [Guardar en pendientes]. */
  cerrada?: boolean
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
  const enlaceCasa = enlaceComoLlegarAlojamiento(direccionDelAlojamiento(route), route.destination, puntoDelAlojamiento(route))
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
  // (V46) Solo los días POSTERIORES a hoy: nunca uno que ya pasó (el lunes 23 siendo martes 24) ni el de hoy.
  const iHoy = route.days.findIndex((d) => d.id === day.id)
  const diasPosibles = route.days.filter((d, i) => i > iHoy && d.id !== day.id && diaAdmite(d) && (ctx.fechaDe?.(d) ?? null) !== dateIso && !((ctx.fechaDe?.(d) ?? '') && (ctx.fechaDe?.(d) ?? '') < dateIso)).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
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
  // (V44 §1 y §5) Sin ubicación en la ruta, los sitios se cuentan desde la parada de ahora.
  const [ubiLocal, setUbiLocal] = useState<Coordinates | null>(null)
  const desde = p.ubicacion ?? ubiLocal ?? siguiente.coordinates
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
      {p.cerrada ? (
        <>
          <button type="button" onClick={() => setPaso('dias')} data-hoy-pasar-otro-dia className="flex h-[52px] flex-[1.5] items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-2.5 text-[15px] font-bold" style={BOTON_ORO}>
            Pasar a otro día
          </button>
          <button type="button" onClick={irSaltar} data-hoy-guardar-pendientes className="flex h-[52px] flex-1 items-center justify-center whitespace-nowrap rounded-2xl px-2.5 text-[14px] font-bold" style={{ ...BOTON_MARFIL, gap: 7 }}>
            <IconoPendientes size={18} color="#4A3510" grosor={1.9} />
            Guardar en pendientes
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setPaso('menu')} data-hoy-cambiar-plan className="flex h-[52px] flex-1 items-center justify-center gap-[7px] whitespace-nowrap rounded-2xl px-2.5 text-[14px] font-bold" style={BOTON_MARFIL}>
          <Pic d={D_CAMBIO} size={17} color="currentColor" grosor={2} />
          Cambiar plan
        </button>
      )}
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
            <LineaUbicacion route={route} referencia={siguiente} enCoche={p.enCoche} enLaRuta={Boolean(p.ubicacion)} onUbicacion={setUbiLocal} />
            {candidatos.length > 0 && (
              <div data-anadir-mapa className="h-[104px] flex-none overflow-hidden rounded-[18px]">
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
              <div key={c.nombre} data-anadir-candidato={c.nombre} data-anadir-logro={c.logro ? '1' : undefined} data-anadir-escalon={c.escalon} onClick={() => setActivoAnadir(c.nombre)} className="flex min-h-[64px] items-center gap-2 rounded-[18px] py-2 pl-[9px] pr-2" style={{ background: '#FFFDF8', border: activoAnadir === c.nombre ? '1px solid rgba(181,138,46,.55)' : '1px solid rgba(28,34,48,.12)' }}>
                <span data-anadir-numero className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[12px] font-bold" style={{ background: activoAnadir === c.nombre ? '#B58A2E' : '#1C2230', color: '#fff' }}>{i + 1}</span>
                {/* (V43 §5) La foto, como en el resto de HOY: se pide al servidor por el nombre (el catálogo no la trae). */}
                <ParadaFotoDeParada parada={stopDeCandidato(c)} ciudad={day.city} dateIso={dateIso} vista size={42} marca={false} carga="eager" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate" style={{ font: "700 14px/1.15 'Geist'" }}>{displayStopName(c.nombre)}</span>
                  <span className="text-[12px]" style={{ color: 'rgba(28,34,48,.62)' }}>
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
                      <Etiqueta tono="oro" datos={{ 'data-anadir-recompensa': '1' }}>Contiene recompensa</Etiqueta>
                    )}
                    {c.deOtroDia && (
                      <Etiqueta tono="azul" datos={{ 'data-anadir-otro-dia': '1' }}>Lo tienes el {c.deOtroDia.etiqueta}</Etiqueta>
                    )}
                  </span>
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); elegirSitio(c) }} data-anadir-elegir className="zona-toque flex h-[34px] flex-none items-center rounded-xl px-3 text-[12.5px] font-bold" style={BOTON_ORO}>
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
