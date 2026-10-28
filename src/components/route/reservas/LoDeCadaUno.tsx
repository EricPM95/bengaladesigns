import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import type { ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf } from '../../../lib/reservasLegs'
import { entreEfectivo, idsConLoSuyo, lineaDeMiAlojamiento, lineasDeMiVuelo, paraQuienDelVuelo, textoLoHaPuesto, type MiAlojamiento, type MiTramo, type MiVuelo } from '../../../lib/loSuyo'
import { addDaysToIso } from '../../../lib/dateRange'
import { puntoCorto } from '../../../lib/arrivalReturn'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { nombreDe, inicialDe, type Persona } from '../../../store/useViajeCompartido'
import { useRouteStore } from '../../../store/useRouteStore'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { Icono } from '../../ui/Icono'
import { TimeListWheel } from '../../ui/TimeListWheel'
import { CampoPrecio } from '../../ui/CampoPrecio'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { useModoCuentas } from '../../../lib/modoCuentas'
import { ParaQuienConjunta, ParaQuienConNombres, preguntaDeReserva, type QueSeAnade } from '../presupuesto/ParaQuien'
import { HojaTuAlojamiento } from '../alojamiento/HojaTuAlojamiento'
import { estanciasDelViaje, precioDeAlojamiento } from '../../../lib/tuAlojamiento'

/**
 * EL VUELO Y EL ALOJAMIENTO DE CADA UNO EN RESERVAS (Tanda 10N5 §6c; diseño `Piezas/Reservas Cada Uno`, pantallas 01-04).
 *   · Quien NO es el administrador (también quien solo recomienda) ve lo del administrador —«Lo ha puesto Eric · para todos»— y debajo [Tengo otro vuelo · Pon el tuyo] / [Me alojo en otro sitio · Pon el tuyo];
 *     con lo suyo puesto: «Tuyo» y [Cambiar].
 *   · El administrador, en un viaje compartido, ve debajo de cada bloque a quién cubre («En este vuelo · Tú, Laura y Marcos», con [¿Para quién es?]) y quién tiene otro («Ana tiene su propio vuelo»).
 * La ruta NO mira lo de cada uno: sigue al vuelo y al alojamiento del administrador.
 */
const TARJETA: CSSProperties = { borderRadius: 24, background: '#FFFDF8', boxShadow: '0 8px 18px -12px rgba(28,34,48,.45)', padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 11 }
const FILA: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px 11px 11px', borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', width: '100%', textAlign: 'left' }
const ORO_DEGRADADO = 'linear-gradient(145deg,#FFF6DC,#E9C77A 60%,#B58A2E)'
const COLORES_AVATAR = [
  { fondo: '#1C2230', texto: '#F3D88F' },
  { fondo: '#F3E3B2', texto: '#6E5018' },
  { fondo: '#DDE5D2', texto: '#3E5A33' },
  { fondo: '#DCE4EE', texto: '#2E4A6B' },
]

export function Avatares({ gente }: { gente: Persona[] }) {
  return (
    <span style={{ display: 'flex' }} data-avatares-lo-suyo>
      {gente.slice(0, 4).map((p, i) => {
        const c = COLORES_AVATAR[i % COLORES_AVATAR.length]
        return (
          <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -9 }}>
            <span style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: c.fondo, color: c.texto, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 14px 'Geist'" }}>{inicialDe(p)}</span>
          </span>
        )
      })}
    </span>
  )
}

function IconoCuadrado({ nombre, grande = false, fondo = '#FBF3E2', color = '#6E5018' }: { nombre: 'avion' | 'cama' | 'compartido'; grande?: boolean; fondo?: string; color?: string }) {
  const lado = grande ? 54 : 42
  return (
    <span style={{ width: lado, height: lado, flex: 'none', borderRadius: grande ? 16 : 13, background: fondo, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icono nombre={nombre} size={grande ? 26 : 22} />
    </span>
  )
}

/** La pastilla oscura con la inicial de quien lo ha puesto: «Lo ha puesto Eric · para Eric y para ti» (el texto, siempre desde quien mira). */
function PastillaLoHaPuestoTexto({ inicial, texto }: { inicial: string; texto: string }) {
  return (
    <span data-lo-ha-puesto style={{ minHeight: 28, minWidth: 0, flex: '0 1 auto', alignSelf: 'flex-start', padding: '4px 12px 4px 4px', borderRadius: 999, background: '#1C2230', color: '#F3D88F', display: 'inline-flex', alignItems: 'center', gap: 7, font: "600 12.5px/1.2 'Geist'" }}>
      <span style={{ width: 20, height: 20, flex: 'none', borderRadius: '50%', background: ORO_DEGRADADO, color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 9px 'Geist'" }}>{inicial}</span>
      {texto}
    </span>
  )
}

function PastillaFalta() {
  return (
    <span data-falta style={{ height: 28, padding: '0 12px', borderRadius: 999, background: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))', display: 'inline-flex', alignItems: 'center', font: "700 12.5px 'Geist'" }}>
      Falta
    </span>
  )
}

function CabeceraTarjeta({ icono, titulo, derecha }: { icono: 'avion' | 'cama'; titulo: string; derecha: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <IconoCuadrado nombre={icono} />
      <span style={{ flex: '1 1 auto', font: "600 16px 'Geist'" }}>{titulo}</span>
      {derecha}
    </div>
  )
}

function FilaPonElTuyo({ icono, titulo, sub, datos, onClick }: { icono: 'avion' | 'cama'; titulo: string; sub: string; datos: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} data-pon-el-tuyo={datos} style={FILA}>
      <IconoCuadrado nombre={icono} grande />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: "400 23px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
        <span style={{ font: "400 14px/1.3 'Geist'", color: 'rgba(28,34,48,.58)' }}>{sub}</span>
      </span>
      <Icono nombre="adelante" size={18} style={{ color: 'rgba(28,34,48,.35)' }} />
    </button>
  )
}

/** A quién cubre lo del administrador, en la pastilla: «para todos» · «para Eric y para ti» · «para 3 de 4». */
export function textoParaQuien(ids: readonly string[], gente: readonly Persona[], yoId: string | null, adminId: string | null): string {
  if (gente.length > 0 && gente.every((p) => ids.includes(p.id))) return 'para todos'
  if (ids.length === 2 && yoId && adminId && ids.includes(yoId) && ids.includes(adminId)) return `para ${nombreDe(gente.find((p) => p.id === adminId)) || 'el administrador'} y para ti`
  return `para ${ids.length} de ${gente.length}`
}

/**
 * «¿PARA QUIÉN ES?» de lo que pone un invitado (vuelo o alojamiento; Tanda 10N8 §7c; `Piezas/Reservas Cada Uno` 02b y 05): en «Cada uno lo suyo», las pastillas con los nombres y SOLO quien lo pone marcado; en la cuenta conjunta,
 * «Para los dos / Para todos» o «Solo para mí».
 */
function ParaQuienDeLoSuyo({ gente, yoId, ids, onIds, tipo }: { gente: Persona[]; yoId: string | null; ids: string[]; onIds: (ids: string[]) => void; tipo: QueSeAnade }) {
  const { modo } = useModoCuentas()
  if (modo === 'conjunta') {
    return <ParaQuienConjunta valor={ids.length <= 1 ? 'mio' : 'todos'} onCambio={(v) => onIds(v === 'mio' ? (yoId ? [yoId] : []) : gente.map((p) => p.id))} personas={gente.length} pregunta={preguntaDeReserva(tipo)} datos="lo-suyo-invitado-conjunta" />
  }
  return (
    <ParaQuienConNombres
      pregunta="¿Para quién es?"
      personas={gente.map((p) => ({ id: p.id, nombre: nombreDe(p), esAdmin: p.esAdmin }))}
      marcados={ids}
      onAlternar={(id) => (id === yoId ? undefined : onIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
      yoId={yoId}
      nombreDe={(id) => nombreDe(gente.find((p) => p.id === id)) || 'Alguien'}
      datos="lo-suyo-invitado"
      pie={false}
    />
  )
}

/** Los días que ofrece la hoja del vuelo: los tres primeros del viaje para la ida y los tres últimos para la vuelta (si el viaje tiene fechas). */
function diasDelTramo(route: Route, lado: 'ida' | 'vuelta'): { iso: string; texto: string }[] {
  const ini = route.answers.dateRange?.start
  const fin = route.answers.dateRange?.end
  if (!ini || !fin) return []
  const total = Math.max(1, route.days.length)
  const n = Math.min(3, total)
  const base = lado === 'ida' ? 0 : total - n
  return Array.from({ length: n }, (_, i) => {
    const iso = addDaysToIso(ini, base + i)
    return { iso, texto: fechaCorta(iso) }
  })
}

/**
 * La hoja del vuelo de quien no es administrador (Tanda 10N8 §7b-d; `Piezas/Reservas Cada Uno` 02 y 02b): la ida y la vuelta con su día, su aeropuerto y su hora (la rueda NO tiene [Guardar]: al cerrarla la hora queda puesta),
 * «¿Para quién es?» y, al final, UN solo botón «Guardar el vuelo». Solo entonces se guarda y llegan los avisos, una vez, con la ida y la vuelta juntas.
 */
function HojaVuelo({ actual, route, ciudad, gente, yoId, puntos, onGuardar, onQuitar, onClose }: { actual: MiVuelo | null; route: Route; ciudad: string; gente: Persona[]; yoId: string | null; puntos: { ida: string[]; vuelta: string[] }; onGuardar: (v: MiVuelo, para: string[]) => void; onQuitar: () => void; onClose: () => void }) {
  const HORAS = Array.from({ length: (24 * 60) / 5 }, (_, i) => `${String(Math.floor((i * 5) / 60)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`)
  const [lado, setLado] = useState<'ida' | 'vuelta'>('ida')
  const [ida, setIda] = useState<MiTramo>(actual?.ida ?? { hora: '11:15' })
  const [vuelta, setVuelta] = useState<MiTramo>(actual?.vuelta ?? { hora: '18:05' })
  const [ids, setIds] = useState<string[]>(() => (actual?.para && actual.para.length > 0 ? actual.para : yoId ? [yoId] : []))
  const tramo = lado === 'ida' ? ida : vuelta
  const poner = (t: MiTramo) => (lado === 'ida' ? setIda(t) : setVuelta(t))
  const precioIda = usePrecioEditable(actual?.ida?.precio)
  const precioVuelta = usePrecioEditable(actual?.vuelta?.precio)
  const precio = lado === 'ida' ? precioIda : precioVuelta
  const hora = HORAS.includes(tramo.hora) ? tramo.hora : lado === 'ida' ? '11:15' : '18:05'
  const dias = diasDelTramo(route, lado)
  const fechaElegida = tramo.fecha ?? dias[0]?.iso ?? null
  const lista = puntos[lado]
  const guardar = () => {
    const con = (t: MiTramo, p: typeof precioIda, l: 'ida' | 'vuelta'): MiTramo => ({ ...t, fecha: t.fecha ?? diasDelTramo(route, l)[0]?.iso ?? null, precio: p.importe })
    onGuardar({ ida: con(ida, precioIda, 'ida'), vuelta: con(vuelta, precioVuelta, 'vuelta') }, ids.length > 0 ? ids : yoId ? [yoId] : [])
  }
  const campo = 'h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] text-text outline-none focus:border-text/50'
  const pastilla = (activa: boolean): CSSProperties => ({ minHeight: 40, padding: '0 14px', borderRadius: 999, background: activa ? '#1C2230' : '#F5EFE4', color: activa ? '#F3D88F' : '#1C2230', font: "600 13.5px 'Geist'" })
  const resumen = (t: MiTramo, l: 'ida' | 'vuelta') => `${l === 'ida' ? 'Ida' : 'Vuelta'}${t.fecha ? ` · ${fechaCorta(t.fecha)}` : ''} · ${t.hora}`
  return (
    <HojaAbajo titleId="hoja-mi-vuelo" onClose={onClose} capa={110}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Llegada y vuelta
      </p>
      <h2 id="hoja-mi-vuelo" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        Tu vuelo a {ciudad}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-2" role="tablist">
        {(['ida', 'vuelta'] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lado === l} data-mi-vuelo-lado={l} onClick={() => setLado(l)} className="h-11 rounded-full text-[14px] font-semibold" style={{ background: lado === l ? '#1C2230' : '#F5EFE4', color: lado === l ? '#F3D88F' : '#1C2230' }}>
            {lado !== l && (l === 'ida' ? actual?.ida || ida.fecha : actual?.vuelta || vuelta.fecha) ? resumen(l === 'ida' ? ida : vuelta, l) : l === 'ida' ? 'Ida' : 'Vuelta'}
          </button>
        ))}
      </div>
      {dias.length > 0 && (
        <div className="mt-5" data-mi-vuelo-dias>
          <span className="text-text/55" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {lado === 'ida' ? 'Día de llegada' : 'Día de salida'}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {dias.map((d) => (
              <button key={d.iso} type="button" data-mi-vuelo-dia={d.iso} onClick={() => poner({ ...tramo, fecha: d.iso })} style={pastilla(fechaElegida === d.iso)}>
                {d.texto}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5">
        <TimeListWheel items={HORAS} value={hora} onChange={(h) => poner({ ...tramo, hora: h })} label={lado === 'ida' ? 'Hora de llegada' : 'Hora de salida'} />
      </div>
      <div className="mt-5 flex flex-col gap-5">
        {lista.length > 1 ? (
          <div>
            <span className="text-text/55" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Aeropuerto
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {lista.map((p) => (
                <button key={p} type="button" data-mi-vuelo-punto-opcion={p} onClick={() => poner({ ...tramo, punto: p })} style={pastilla(tramo.punto === p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-text">{lado === 'ida' ? '¿Dónde llegas? (opcional)' : '¿De dónde sales? (opcional)'}</span>
            <input value={tramo.punto ?? ''} onChange={(e) => poner({ ...tramo, punto: e.target.value })} maxLength={40} placeholder="Ciampino" autoComplete="off" data-mi-vuelo-punto className={campo} />
          </label>
        )}
        <CampoPrecio estado={precio} etiqueta="Precio (opcional)" ayuda="Lo que has pagado tú. No se reparte con el grupo." />
        {gente.length > 1 && (
          <div data-mi-vuelo-para>
            <ParaQuienDeLoSuyo gente={gente} yoId={yoId} ids={ids} onIds={setIds} tipo="vuelo" />
          </div>
        )}
      </div>
      <button type="button" onClick={guardar} data-mi-vuelo-guardar className="mt-6 h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98]">
        Guardar el vuelo
      </button>
      {actual && (
        <button type="button" onClick={onQuitar} data-mi-vuelo-quitar className="mt-3 w-full py-2 text-center text-[13px] font-semibold text-text/60 underline underline-offset-2">
          Quitar el mío
        </button>
      )}
    </HojaAbajo>
  )
}

/**
 * «¿Para quién…?» del vuelo, el alojamiento o el coche del administrador: él siempre va marcado. Se guarda con el viaje (`cuentasEntre`) y de ahí sale el reparto de las cuentas.
 * (Tanda 10N7) Cuenta conjunta: «Para los dos / Para todos» o «Solo para mí», sin nombres. Cada uno lo suyo: la pregunta de lo que es («¿Para quién has comprado el vuelo?»), los nombres y la línea pequeña.
 */
export function HojaParaQuienEsLoDelAdmin({ titulo, tipo, gente, marcadas, adminId, onGuardar, onClose }: { titulo: string; tipo?: QueSeAnade; gente: Persona[]; marcadas: string[]; adminId: string | null; onGuardar: (ids: string[]) => void; onClose: () => void }) {
  const { modo } = useModoCuentas()
  const [ids, setIds] = useState<string[]>(() => [...new Set([...(adminId ? [adminId] : []), ...marcadas])])
  const alternar = (id: string) => setIds((previo) => (previo.includes(id) ? previo.filter((x) => x !== id) : [...previo, id]))
  const todos = gente.map((p) => p.id)
  const soloMio = ids.length === 1 && ids[0] === adminId && gente.length > 1
  return (
    <HojaAbajo titleId="hoja-para-quien-lo-suyo" onClose={onClose} capa={110}>
      <h2 id="hoja-para-quien-lo-suyo" className="max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        {titulo}
      </h2>
      <div className="mt-5" data-para-quien-lo-suyo>
        {modo === 'conjunta' ? (
          <ParaQuienConjunta valor={soloMio ? 'mio' : 'todos'} onCambio={(v) => setIds(v === 'mio' ? (adminId ? [adminId] : []) : todos)} personas={gente.length} pregunta={tipo ? preguntaDeReserva(tipo) : '¿Para quién es?'} datos="lo-suyo-conjunta" />
        ) : (
          <ParaQuienConNombres
            pregunta={tipo ? preguntaDeReserva(tipo) : '¿Para quién es?'}
            personas={gente.map((p) => ({ id: p.id, nombre: nombreDe(p), esAdmin: p.esAdmin }))}
            marcados={ids}
            onAlternar={(id) => (id === adminId ? undefined : alternar(id))}
            yoId={adminId}
            nombreDe={(id) => nombreDe(gente.find((p) => p.id === id)) || 'Alguien'}
            datos="lo-suyo"
          />
        )}
      </div>
      {tipo !== 'coche' && modo !== 'conjunta' && <p className="mt-4 text-[12.5px] leading-snug text-text/60">Quien tenga otro, lo suyo se cambia por este. Cada uno puede volver a poner el suyo.</p>}
      <button type="button" data-guardar-lo-suyo onClick={() => onGuardar(ids)} className="mt-6 h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold">
        Guardar
      </button>
    </HojaAbajo>
  )
}

/** El alojamiento de quien no es administrador: la hoja de siempre más «¿Para quién es?» y «Guardar el alojamiento» (Tanda 10N8 §7c; `Piezas/Reservas Cada Uno` 05). */
function HojaAlojamientoParaVarios({ actual, ciudad, noches, gente, yoId, onGuardar, onEliminar, onClose }: { actual: MiAlojamiento | null; ciudad: string; noches: number; gente: Persona[]; yoId: string | null; onGuardar: (a: MiAlojamiento, para: string[]) => void; onEliminar: () => void; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>(() => (actual?.para && actual.para.length > 0 ? actual.para : yoId ? [yoId] : []))
  return (
    <HojaTuAlojamiento
      ciudad={ciudad}
      noches={noches}
      actual={actual ? { name: actual.name, precio: actual.precio ?? precioDeAlojamiento(null) } : null}
      onClose={onClose}
      textoGuardar="Guardar el alojamiento"
      extra={gente.length > 1 ? <ParaQuienDeLoSuyo gente={gente} yoId={yoId} ids={ids} onIds={setIds} tipo="alojamiento" /> : null}
      onGuardar={(h) => onGuardar({ name: h.name, precio: h.precio }, ids.length > 0 ? ids : yoId ? [yoId] : [])}
      onEliminar={onEliminar}
    />
  )
}

function PastillaListo() {
  return (
    <span data-tuyo style={{ height: 28, padding: '0 12px', borderRadius: 999, background: '#EAF4EC', color: '#2B7F45', display: 'inline-flex', alignItems: 'center', gap: 6, font: "700 12.5px 'Geist'" }}>
      <Icono nombre="hecho" size={13} grosor={3} />
      Listo
    </span>
  )
}

/**
 * Lo que ve QUIEN NO ES EL ADMINISTRADOR de «Llegada y vuelta» y «Alojamiento» (Tanda 10N8 §7b; `Piezas/Reservas Cada Uno` 01, 03, 04 y 06): UN solo bloque de cada, igual que el del administrador.
 *   · Sin nada: «Falta», y al tocarlo se pone el suyo.
 *   · Si lo ha puesto otro (el administrador u otro invitado): ese, con «Lo ha puesto Eric · para Eric y para ti» (siempre desde quien mira) y debajo «Tengo otro vuelo · Pon el tuyo».
 *   · Si lo he puesto yo: «Lo has puesto tú · para ti y Luis» y [Cambiar].
 */
export function LoDeCadaUnoParaElInvitado({ route, info, arrivalInfo, gente, yoId }: { route: Route; info: DestinationExcursions; arrivalInfo: ArrivalInfo; gente: Persona[]; yoId: string | null }) {
  const mio = useLoSuyo((s) => s.mio)
  const ponerVuelo = useLoSuyo((s) => s.ponerVuelo)
  const ponerAlojamiento = useLoSuyo((s) => s.ponerAlojamiento)
  const ponerPara = useLoSuyo((s) => s.ponerPara)
  const selections = useRouteStore((s) => s.accommodationSelections)
  const admin = gente.find((p) => p.esAdmin) ?? null
  const [hoja, setHoja] = useState<'vuelo' | 'alojamiento' | null>(null)
  const ciudad = route.days[0]?.city ?? route.destination
  const ida = legOf(route, arrivalInfo, 'arrival')
  const vuelta = legOf(route, arrivalInfo, 'departure')
  const delAdminVuelo = ida.done || vuelta.done
  const estancia = estanciasDelViaje(route)[0] ?? null
  const hotelAdmin = estancia ? selections[estancia.segmentDayId] ?? null : null
  const zona = info.zonasAlojamiento.find((z) => z.id === route.accommodationZone)
  const delAdminAloj = Boolean(hotelAdmin) || Boolean(zona)
  const todos = gente.map((p) => p.id)
  const paraVuelo = paraQuienDelVuelo(route) ?? todos
  const claveAloj = estancia ? `aloj-${estancia.segmentDayId}` : ''
  const paraAloj = (claveAloj ? route.cuentasEntre?.[claveAloj] : null) ?? todos
  const adminId = admin?.id ?? null
  const meCubreVuelo = Boolean(yoId) && paraVuelo.includes(yoId as string)
  const meCubreAloj = Boolean(yoId) && paraAloj.includes(yoId as string)
  const rango = route.answers.dateRange
  const dia = { ida: rango?.start ? fechaCorta(rango.start) : 'Día 1', vuelta: rango?.end ? fechaCorta(rango.end) : `Día ${route.days.length}` }
  const nombreDeId = (id: string) => nombreDe(gente.find((p) => p.id === id)) || ''

  const vueloMio = mio.vuelo
  const alojMio = mio.alojamiento
  const pastilla = (ids: readonly string[], puestoPor: string | null) => {
    const t = textoLoHaPuesto({ ids, puestoPor, yoId, nombreDe: nombreDeId, total: gente.length })
    return <PastillaLoHaPuestoTexto inicial={inicialDe(gente.find((p) => p.id === puestoPor) ?? null)} texto={`${t.quien} · ${t.para}`} />
  }
  const lineasVuelo = (v: MiVuelo) => lineasDeMiVuelo(v, { ida: v.ida?.fecha ? fechaCorta(v.ida.fecha) : dia.ida, vuelta: v.vuelta?.fecha ? fechaCorta(v.vuelta.fecha) : dia.vuelta })
  const tarjetaFalta = (icono: 'avion' | 'cama', titulo: string, sub: string, datos: string, onClick: () => void) => (
    <button type="button" onClick={onClick} data-falta-tarjeta={datos} style={{ ...TARJETA, textAlign: 'left', width: '100%' }}>
      <CabeceraTarjeta icono={icono} titulo={titulo} derecha={<PastillaFalta />} />
      <span style={{ font: "500 14px/1.45 'Geist'", color: 'rgba(28,34,48,.58)' }}>{sub}</span>
    </button>
  )

  return (
    <div className="flex flex-col gap-3" data-lo-de-cada-uno="invitado">
      {/* ── Llegada y vuelta ── */}
      {vueloMio ? (
        <>
          <div style={TARJETA} data-tarjeta-vuelo="mio">
            <CabeceraTarjeta icono="avion" titulo="Llegada y vuelta" derecha={<PastillaListo />} />
            {(() => {
              const ids = vueloMio.para && vueloMio.para.length > 0 ? vueloMio.para : yoId ? [yoId] : []
              const por = vueloMio.puestoPor ?? yoId
              return pastilla(ids, por)
            })()}
            <span style={{ font: "500 14px/1.45 'Geist'" }}>
              {lineasVuelo(vueloMio).map((l, i) => (
                <span key={i} style={{ display: 'block' }}>
                  {l}
                </span>
              ))}
            </span>
            {(!vueloMio.puestoPor || vueloMio.puestoPor === yoId) && (
              <button type="button" onClick={() => setHoja('vuelo')} data-cambiar-lo-mio="vuelo" style={{ alignSelf: 'flex-start', font: "600 13.5px 'Geist'", color: '#6E5018', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Cambiar
              </button>
            )}
          </div>
          {vueloMio.puestoPor && vueloMio.puestoPor !== yoId && <FilaPonElTuyo icono="avion" titulo="Tengo otro vuelo" sub="Pon el tuyo" datos="vuelo" onClick={() => setHoja('vuelo')} />}
        </>
      ) : delAdminVuelo && meCubreVuelo ? (
        <>
          <div style={TARJETA} data-tarjeta-vuelo="admin">
            <CabeceraTarjeta icono="avion" titulo="Llegada y vuelta" derecha={<PastillaListo />} />
            {pastilla(paraVuelo, adminId)}
            <span style={{ font: "500 14px/1.45 'Geist'" }}>
              {[ida, vuelta].filter((l) => l.done).map((l) => (
                <span key={l.kind} style={{ display: 'block' }}>
                  {l.mode === 'avion' ? '✈ ' : ''}
                  {legLine(l)}
                </span>
              ))}
            </span>
          </div>
          <FilaPonElTuyo icono="avion" titulo="Tengo otro vuelo" sub="Pon el tuyo" datos="vuelo" onClick={() => setHoja('vuelo')} />
        </>
      ) : (
        tarjetaFalta('avion', 'Llegada y vuelta', `${route.origin} → ${ciudad}`, 'vuelo', () => setHoja('vuelo'))
      )}

      {/* ── Alojamiento ── */}
      {alojMio ? (
        <>
          <div style={TARJETA} data-tarjeta-aloj="mio">
            <CabeceraTarjeta icono="cama" titulo="Alojamiento" derecha={<PastillaListo />} />
            {pastilla(alojMio.para && alojMio.para.length > 0 ? alojMio.para : yoId ? [yoId] : [], alojMio.puestoPor ?? yoId)}
            <span style={{ font: "500 14px/1.45 'Geist'" }}>{lineaDeMiAlojamiento(alojMio)}</span>
            {(!alojMio.puestoPor || alojMio.puestoPor === yoId) && (
              <button type="button" onClick={() => setHoja('alojamiento')} data-cambiar-lo-mio="alojamiento" style={{ alignSelf: 'flex-start', font: "600 13.5px 'Geist'", color: '#6E5018', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Cambiar
              </button>
            )}
          </div>
          {alojMio.puestoPor && alojMio.puestoPor !== yoId && <FilaPonElTuyo icono="cama" titulo="Me alojo en otro sitio" sub="Pon el tuyo" datos="alojamiento" onClick={() => setHoja('alojamiento')} />}
        </>
      ) : delAdminAloj && meCubreAloj ? (
        <>
          <div style={TARJETA} data-tarjeta-aloj="admin">
            <CabeceraTarjeta icono="cama" titulo="Alojamiento" derecha={<PastillaListo />} />
            {pastilla(paraAloj, adminId)}
            <span style={{ font: "500 14px/1.45 'Geist'" }}>{`Te alojas en ${zona?.nombre ?? hotelAdmin?.name}`}</span>
          </div>
          <FilaPonElTuyo icono="cama" titulo="Me alojo en otro sitio" sub="Pon el tuyo" datos="alojamiento" onClick={() => setHoja('alojamiento')} />
        </>
      ) : (
        tarjetaFalta('cama', 'Alojamiento', 'Todavía no hay alojamiento puesto', 'alojamiento', () => setHoja('alojamiento'))
      )}
      <span hidden data-cubre-vuelo={String(meCubreVuelo)} data-cubre-aloj={String(meCubreAloj)} />

      {hoja === 'vuelo' && (
        <HojaVuelo
          actual={vueloMio}
          route={route}
          ciudad={ciudad}
          gente={gente}
          yoId={yoId}
          puntos={{ ida: ida.points.map(puntoCorto), vuelta: vuelta.points.map(puntoCorto) }}
          onClose={() => setHoja(null)}
          onGuardar={(v, para) => {
            const texto = (t: MiTramo | null, l: string) => (t ? `${l} ${t.fecha ? fechaCorta(t.fecha) : ''} · ${t.hora}`.replace('  ', ' ') : '')
            const detalle = [texto(v.ida, 'ida'), texto(v.vuelta, 'vuelta')].filter(Boolean).join(', ')
            if (yoId && para.length > 1) void ponerPara({ vuelo: v }, para, yoId, detalle)
            else if (yoId) void ponerPara({ vuelo: v }, [yoId], yoId, detalle)
            else ponerVuelo(v)
            setHoja(null)
          }}
          onQuitar={() => {
            ponerVuelo(null)
            setHoja(null)
          }}
        />
      )}
      {hoja === 'alojamiento' && (
        <HojaAlojamientoParaVarios
          actual={alojMio}
          ciudad={ciudad}
          noches={estancia?.noches ?? 0}
          gente={gente}
          yoId={yoId}
          onClose={() => setHoja(null)}
          onGuardar={(a, para) => {
            if (yoId) void ponerPara({ alojamiento: a }, para, yoId, a.name)
            else ponerAlojamiento(a)
            setHoja(null)
          }}
          onEliminar={() => {
            ponerAlojamiento(null)
            setHoja(null)
          }}
        />
      )}
    </div>
  )
}

/** Debajo de «Llegada y vuelta» y «Alojamiento» del ADMINISTRADOR, en un viaje compartido: a quién cubre («En este vuelo · Tú, Laura y Marcos») y quién tiene otro («Ana tiene su propio vuelo»). */
export function QuienVaEnLoDelAdmin({ route, gente, que, hecho, claves, adminId }: { route: Route; gente: Persona[]; que: 'vuelo' | 'alojamiento' | 'coche'; hecho: boolean; claves: string[]; adminId: string | null }) {
  const grupo = useLoSuyo((s) => s.grupo)
  const setCuentasEntre = useRouteStore((s) => s.setCuentasEntre)
  const [abierta, setAbierta] = useState(false)
  const { modo } = useModoCuentas()
  // (Tanda 10N8 §0b-1) La pregunta sale EN EL MOMENTO de añadirlo (el vuelo, el alojamiento o el coche pasa de «no hay» a «hay»), con solo quien lo añade marcado. Lo que ya estaba guardado no cambia.
  const antes = useRef(hecho)
  const [alAnadir, setAlAnadir] = useState(false)
  useEffect(() => {
    if (!antes.current && hecho && gente.length >= 2) {
      setAlAnadir(true)
      setAbierta(true)
    }
    antes.current = hecho
  }, [hecho, gente.length])
  if (!hecho || gente.length < 2) return null
  const todos = gente.map((p) => p.id)
  const declarado = claves.map((c) => route.cuentasEntre?.[c]).find((x) => x && x.length > 0) ?? null
  const propios = que === 'coche' ? new Set<string>() : idsConLoSuyo(grupo, que)
  const efectivo = entreEfectivo(declarado, todos, propios, adminId)
  const quienes = gente.filter((p) => efectivo.includes(p.id))
  // (10N7) En una cuenta conjunta lo suyo de cada uno es «Solo para mí»: el administrador no ve quién lo tiene.
  const otros = modo === 'conjunta' ? [] : gente.filter((p) => propios.has(p.id) && !p.esAdmin)
  const nombres = (ps: Persona[]) => {
    const n = ps.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'))
    return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
  }
  const titulo = que === 'vuelo' ? 'En este vuelo' : que === 'alojamiento' ? 'En este alojamiento' : 'En este coche'
  const nombreOtros = otros.length === 1 ? `${nombreDe(otros[0]) || 'Alguien'} tiene su propio ${que}` : `${nombres(otros)} tienen el suyo`
  return (
    <div className="mt-2.5 flex flex-col gap-2.5" data-lo-de-cada-uno="admin" data-que={que}>
      <button type="button" onClick={() => setAbierta(true)} data-en-este-lo-suyo={que} style={FILA}>
        <IconoCuadrado nombre="compartido" grande />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: "400 23px/1.1 'Instrument Serif',serif" }}>{titulo}</span>
          <span style={{ font: "400 14px/1.3 'Geist'", color: 'rgba(28,34,48,.58)' }}>{modo === 'conjunta' ? (quienes.length === 1 && quienes[0].esAdmin ? 'Solo para ti' : gente.length > 2 ? 'Todos' : 'Los dos') : nombres(quienes)}</span>
        </span>
        <Avatares gente={quienes} />
      </button>
      {otros.length > 0 && (
        <div style={{ ...FILA, cursor: 'default' }} data-otro-lo-suyo={que}>
          <IconoCuadrado nombre="compartido" grande fondo="#DDE5D2" color="#3E5A33" />
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ font: "400 23px/1.1 'Instrument Serif',serif" }}>{que === 'vuelo' ? 'Otro vuelo' : 'Otro alojamiento'}</span>
            <span style={{ font: "400 14px/1.3 'Geist'", color: 'rgba(28,34,48,.58)' }}>{nombreOtros}</span>
          </span>
          <Avatares gente={otros} />
        </div>
      )}
      {abierta && (
        <HojaParaQuienEsLoDelAdmin
          titulo={titulo}
          tipo={que === 'vuelo' ? 'vuelo' : que === 'alojamiento' ? 'alojamiento' : 'coche'}
          gente={gente}
          marcadas={declarado ?? (alAnadir && modo !== 'conjunta' ? [] : todos)}
          adminId={adminId}
          onClose={() => {
            setAbierta(false)
            setAlAnadir(false)
          }}
          onGuardar={(ids) => {
            const lista = ids.length === todos.length ? null : ids
            for (const c of claves) setCuentasEntre(c, lista)
            setAbierta(false)
            setAlAnadir(false)
          }}
        />
      )}
    </div>
  )
}
