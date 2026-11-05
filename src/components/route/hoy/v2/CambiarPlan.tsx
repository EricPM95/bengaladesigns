import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { catalogoEnMemoria } from '../../../../lib/destinationPlacesApi'
import { addDaysToIso } from '../../../../lib/dateRange'
import { displayStopName } from '../../../../lib/format'
import { fijasDelDia, horaFijaDe, horaCorta } from '../../../../lib/hoyParada'
import {
  candidatosParaAnadir,
  diaAdmite,
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
import { abrirHistorial, aplicarPropuesta, cerrarAviso, deshacerUltimo, useCambiarPlanStore, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { useSyncStore } from '../../../../store/useSyncStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { Icono } from '../../../ui/Icono'
import { ListaDeDias } from '../../dayDetail/ListaDeDias'
import { useDatosDeImportancia } from '../masVisitas'
import { useCercaDeAqui } from '../useCercaDeAqui'
import { HojaV2 } from './HojasV2'
import { ParadaFoto } from './ParadaFoto'
import { HojaComerAhora } from './ComerAhora'

/**
 * HOY2 (agente B, pantallas 22 a 27b y 30 del recorrido): [Cambiar plan] SUSTITUYE a [No me da tiempo]. Un botón en la tarjeta de la parada y, al tocarlo, la hoja de 5 opciones:
 * Voy con retraso (23) · Quiero comer ahora (24, de la HOY2 C: aquí solo su puerta) · Saltarme esta parada (25) · Pasar a otro día (26a/b/c) · Añadir un sitio cercano (27a/b).
 * Todas las propuestas, con el mismo formato: Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original». Nada se mueve sin [Aplicar] y todo lleva «Plan actualizado · Deshacer» (30).
 * Las cuentas están en `src/lib/hoyCambiarPlan.ts` (puras); lo que escribe en el viaje, en `hoyCambiarPlanAplicar.ts`.
 */

const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_CLARO = '#F3D88F'
const BOTON_ORO = { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }
const BOTON_MARFIL = { background: MARFIL, border: '1px solid rgba(181,138,46,.55)', color: '#4A3510' }

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
  return useMemo(() => {
    const inicio = route.answers.dateRange?.start ?? null
    return {
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
  }, [route, reservations, datos, enCoche])
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

/** La fila «Cambia: …» / «Se mantiene: …» de las propuestas. */
function FilaPropuesta({ tipo, titulo, detalle }: { tipo: 'cambia' | 'mantiene'; titulo: string; detalle: string }) {
  return (
    <div data-propuesta={tipo} className="flex items-start gap-3 rounded-[18px] p-3" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full" style={{ background: tipo === 'cambia' ? '#B58A2E' : '#2B7F45' }}>
        {tipo === 'cambia' ? <Pic d={D_CAMBIO} size={17} color="#fff" grosor={2.2} /> : <Pic d="M5 12.5l4.5 4.5L19 7" size={17} color="#fff" grosor={2.2} />}
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <b style={{ font: "700 14.5px 'Geist'" }}>
          {tipo === 'cambia' ? 'Cambia' : 'Se mantiene'}: {titulo}
        </b>
        <span className="text-[12.5px] leading-[1.35] text-[#1C2230]/60">{detalle}</span>
      </span>
    </div>
  )
}

/** La hoja de una propuesta (23, 26a/b/c, 27a/b): la frase, Cambia, Se mantiene, [Aplicar], [Ver otra opción] y «Volver a mi ruta original». */
export function HojaPropuesta({ titulo, propuestas, indice, onOtra, onAplicar, onOriginal, onCerrar, vacio, extra, etiquetaAplicar }: { titulo: string; propuestas: Propuesta[]; indice: number; onOtra: () => void; onAplicar: (p: Propuesta) => void; onOriginal: () => void; onCerrar: () => void; vacio?: string; /** (HOY2b, E) Algo más entre «Se mantiene» y [Aplicar] (la pausa de «Vamos con calma»). */ extra?: ReactNode; /** (HOY2b, E) Lo que dice el botón de aplicar si no es «Aplicar». */ etiquetaAplicar?: string }) {
  const p = propuestas[indice] ?? null
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta={titulo} fondo={MARFIL}>
      <div data-cambiar-hoja="propuesta" data-propuesta-tipo={p?.tipo ?? 'vacia'} data-propuesta-caso={p?.caso ?? undefined} className="flex flex-col gap-3">
        <Titulo texto={titulo} onCerrar={onCerrar} />
        {p ? (
          <>
            <span data-propuesta-intro className="text-[14.5px] font-medium leading-[1.4]">{p.intro}</span>
            <FilaPropuesta tipo="cambia" titulo={p.cambia.titulo} detalle={p.cambia.detalle} />
            <FilaPropuesta tipo="mantiene" titulo={p.mantiene.titulo} detalle={p.mantiene.detalle} />
            {extra}
            <button type="button" onClick={() => onAplicar(p)} data-propuesta-aplicar className="flex h-[50px] items-center justify-center rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
              {p.pregunta ? 'Sí, dejarlo' : (etiquetaAplicar ?? 'Aplicar')}
            </button>
            {propuestas.length > 1 && (
              <button type="button" onClick={onOtra} data-propuesta-otra className="flex h-[50px] items-center justify-center rounded-2xl text-[14.5px] font-bold" style={BOTON_MARFIL}>
                Ver otra opción
              </button>
            )}
          </>
        ) : (
          <span data-propuesta-vacia className="text-[14.5px] font-medium leading-[1.4]">{vacio ?? 'No hay nada que ajustar: tu día sigue igual.'}</span>
        )}
        <button type="button" onClick={onOriginal} data-propuesta-original className="flex h-11 items-center justify-center rounded-2xl text-[13.5px] font-bold" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.55)', color: TINTA }}>
          Volver a mi ruta original
        </button>
      </div>
    </HojaV2>
  )
}

/** «Plan actualizado · Deshacer» (30): el aviso de abajo después de cada cambio. Se va solo a los 12 segundos. */
export function AvisoPlanActualizado({ texto, conDeshacer }: { texto: string; conDeshacer: boolean }) {
  useEffect(() => {
    const id = window.setTimeout(cerrarAviso, 12000)
    return () => window.clearTimeout(id)
  }, [texto])
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-[18px]">
      <div data-plan-actualizado className="pointer-events-auto flex min-h-12 w-full max-w-[430px] items-center rounded-[14px] px-3.5 text-[13.5px] font-medium" style={{ background: TINTA, color: MARFIL }}>
        <span className="flex-1">{texto}</span>
        {conDeshacer && (
          <button type="button" onClick={() => deshacerUltimo()} data-plan-deshacer className="flex h-11 items-center font-bold" style={{ color: ORO_CLARO }}>
            Deshacer
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** (HOY2, C) El «Plan actualizado · Deshacer» de abajo, UNO solo para todo HOY (lo montan HoyDuranteV2 y nadie más): lo usan [Cambiar plan], «Quiero comer ahora», la solución de una entrada en peligro y el plan de lluvia. */
export function AvisoPlanActualizadoGlobal() {
  const aviso = useCambiarPlanStore((s) => s.aviso)
  return aviso ? <AvisoPlanActualizado texto="Plan actualizado" conDeshacer /> : null
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
  const aviso = useCambiarPlanStore((s) => s.aviso)
  const [textoVuelta, setTextoVuelta] = useState<string | null>(null)
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const cerca = useCercaDeAqui({ tripId, sitiosHoy: day.stops.map((s) => s.name), activo: paso === 'anadir_lista' })
  const fijas = ctx.fijasDe(day)
  const horaFija = ctx.horaFijaMin?.(siguiente) ?? null
  const esFija = fijas.has(siguiente.id) || Boolean(siguiente.reservedId)

  useEffect(() => {
    abrirHistorial(route.id, dateIso)
  }, [route.id, dateIso])
  useEffect(() => {
    if (!textoVuelta) return
    const id = window.setTimeout(() => setTextoVuelta(null), 6000)
    return () => window.clearTimeout(id)
  }, [textoVuelta])

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
    if (esFija) {
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

  // «Añadir un sitio cercano»: los de fuera de la ruta (EXPLORAR y «Cerca de ti»), los de logro primero.
  const lugares = catalogoEnMemoria(route.destination)?.places ?? []
  const logros = useMemo(() => {
    const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    const dichos = new Set((cerca?.cerca ?? []).filter((c) => c.hay_emblema || c.coleccion_nombre).flatMap((c) => [norm(c.sitio), norm(c.nombre)]))
    return new Set(lugares.filter((l) => dichos.has(norm(l.name))).map((l) => l.name))
  }, [cerca, lugares])
  const desde = p.ubicacion ?? siguiente.coordinates
  const candidatos: Candidato[] = paso === 'anadir_lista' ? candidatosParaAnadir({ route, lugares, desde, logros, enCoche: p.enCoche }) : []
  const elegirSitio = (c: Candidato) => {
    const lista = proponerAnadir({ route, day, stop: stopDeCandidato(c), ctx, ahoraMin: p.ahoraMin })
    mostrar('Añadir un sitio cercano', lista, 'anadir', `Hoy no cabe ${displayStopName(c.nombre)} sin quitar algo importante. Mejor déjalo para otro momento.`)
  }

  const aplicar = (pr: Propuesta) => {
    aplicarPropuesta(route.id, dateIso, pr)
    cerrar()
  }
  const original = () => {
    const n = volverALaRutaOriginal()
    cerrar()
    setTextoVuelta(n > 0 ? 'Tu ruta vuelve a ser la original.' : 'Tu ruta ya es la original.')
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
            <Opcion dato="saltar" d={D_SALTAR} titulo="Saltarme esta parada" sub="La dejamos para otro día" onClick={irSaltar} />
            <Opcion dato="otro_dia" d={D_DIAS} titulo="Pasar a otro día" sub="Lo movemos a un día que le venga bien" onClick={() => setPaso('dias')} />
            <Opcion dato="anadir" d={D_MAS} titulo="Añadir un sitio cercano" sub="Algo que te pille de paso" onClick={() => setPaso('anadir_lista')} />
          </div>
        </HojaV2>
      )}
      {paso === 'comer' && <HojaComerAhora route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={p.ubicacion} enCoche={p.enCoche} ahoraMin={p.ahoraMin} onCerrar={cerrar} />}
      {paso === 'retraso' && <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onOriginal={original} onCerrar={cerrar} />}
      {paso === 'saltar_reserva' && (
        <Mensaje titulo="Saltarme esta parada" texto={`Tienes la entrada reservada${horaFija != null ? ` a las ${horaCorta(`${Math.floor(horaFija / 60)}:${String(horaFija % 60).padStart(2, '0')}`)}` : ''}. ¿La saltamos igual?`} onCerrar={cerrar}>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={cerrar} data-saltar-cancelar className="flex h-12 items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_ORO}>
              Cancelar
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
              Saltar igual
            </button>
          </div>
        </Mensaje>
      )}
      {paso === 'dias' && (
        <HojaV2 onCerrar={cerrar} etiqueta="Pasar a otro día" fondo={MARFIL}>
          <div data-cambiar-hoja="dias" className="flex flex-col gap-2">
            <Titulo texto="Pasar a otro día" onCerrar={cerrar} />
            <ListaDeDias dias={diasPosibles} ahora={day.dayNumber} onElegir={elegirDia} />
          </div>
        </HojaV2>
      )}
      {paso === 'otro_dia' && <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onOriginal={original} onCerrar={cerrar} />}
      {paso === 'anadir_lista' && (
        <HojaV2 onCerrar={cerrar} etiqueta="Añadir un sitio cercano" fondo={MARFIL}>
          <div data-cambiar-hoja="anadir_lista" className="flex flex-col gap-2.5">
            <Titulo texto="Añadir un sitio cercano" onCerrar={cerrar} />
            <span className="text-[13.5px] leading-[1.4] text-[#1C2230]/65">Sitios fuera de tu ruta que te pillan de paso. Los que suman a un logro, primero.</span>
            {candidatos.length === 0 && <span data-anadir-vacio className="text-[14px] font-medium">No hay nada fuera de tu ruta por aquí cerca.</span>}
            {candidatos.map((c) => (
              <button key={c.nombre} type="button" onClick={() => elegirSitio(c)} data-anadir-candidato={c.nombre} data-anadir-logro={c.logro ? '1' : undefined} className="flex min-h-[64px] items-center gap-3 rounded-[18px] p-2 text-left" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)' }}>
                <ParadaFoto nombre={c.nombre} photoUrl={c.lugar?.photoUrl} vista size={48} marca={false} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate" style={{ font: "400 19px/1.1 'Instrument Serif',serif" }}>{displayStopName(c.nombre)}</span>
                  <span className="text-[12px] text-[#1C2230]/60">
                    {p.enCoche ? `a ${Math.max(1, Math.round((c.metros * 1.35) / ((40 * 1000) / 60)))} min en coche` : `a ${Math.max(1, Math.round(c.metros / 80))} min a pie`}
                    {c.logro ? ' · suma a un logro' : ''}
                  </span>
                </span>
                <Icono nombre="adelante" size={16} grosor={2} />
              </button>
            ))}
          </div>
        </HojaV2>
      )}
      {paso === 'anadir' && <HojaPropuesta titulo={titulo} propuestas={propuestas} indice={indice} vacio={vacio} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onOriginal={original} onCerrar={cerrar} />}
      {!aviso && textoVuelta && <AvisoPlanActualizado texto={textoVuelta} conDeshacer={false} />}
    </>
  )
}
