import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import type { ArrivalInfo } from '../../../lib/arrivalReturn'
import { legLine, legOf } from '../../../lib/reservasLegs'
import { entreEfectivo, idsConLoSuyo, lineaDeMiAlojamiento, lineasDeMiVuelo, paraQuienDelVuelo, type MiTramo, type MiVuelo } from '../../../lib/loSuyo'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { nombreDe, inicialDe, type Persona } from '../../../store/useViajeCompartido'
import { useRouteStore } from '../../../store/useRouteStore'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { Icono } from '../../ui/Icono'
import { PastillaElegir } from '../../ui/Elegir'
import { TimeListWheel } from '../../ui/TimeListWheel'
import { CampoPrecio } from '../../ui/CampoPrecio'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
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

/** La pastilla oscura con la inicial de quien lo ha puesto: «Lo ha puesto Eric · para todos». */
function PastillaLoHaPuesto({ admin, para }: { admin: Persona | null; para: string }) {
  const nombre = nombreDe(admin) || 'el administrador'
  return (
    <span data-lo-ha-puesto style={{ minHeight: 28, minWidth: 0, flex: '0 1 auto', padding: '4px 12px 4px 4px', borderRadius: 999, background: '#1C2230', color: '#F3D88F', display: 'inline-flex', alignItems: 'center', gap: 7, font: "600 12.5px/1.2 'Geist'" }}>
      <span style={{ width: 20, height: 20, flex: 'none', borderRadius: '50%', background: ORO_DEGRADADO, color: '#4A3510', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 9px 'Geist'" }}>{inicialDe(admin)}</span>
      Lo ha puesto {nombre} · {para}
    </span>
  )
}

function PastillaTuyo() {
  return (
    <span data-tuyo style={{ height: 28, padding: '0 12px', borderRadius: 999, background: '#EAF4EC', color: '#2B7F45', display: 'inline-flex', alignItems: 'center', gap: 6, font: "700 12.5px 'Geist'" }}>
      <Icono nombre="hecho" size={13} grosor={3} />
      Tuyo
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

/** La hoja de «Tengo otro vuelo»: la ida y la vuelta de quien lo pone (hora, punto, referencia y precio), una pestaña cada una. */
function HojaMiVuelo({ actual, ciudad, onGuardar, onQuitar, onClose }: { actual: MiVuelo | null; ciudad: string; onGuardar: (v: MiVuelo | null) => void; onQuitar: () => void; onClose: () => void }) {
  const HORAS = Array.from({ length: (24 * 60) / 5 }, (_, i) => `${String(Math.floor((i * 5) / 60)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`)
  const [lado, setLado] = useState<'ida' | 'vuelta'>('ida')
  // (Sin vuelo puesto aún, la rueda arranca en una hora razonable y [Guardar] la guarda: la ida a las 11:15 y la vuelta a las 18:05, como la hoja del administrador.)
  const [ida, setIda] = useState<MiTramo | null>(actual ? actual.ida : { hora: '11:15' })
  const [vuelta, setVuelta] = useState<MiTramo | null>(actual ? actual.vuelta : { hora: '18:05' })
  const tramo = lado === 'ida' ? ida : vuelta
  const poner = (t: MiTramo | null) => (lado === 'ida' ? setIda(t) : setVuelta(t))
  const precioIda = usePrecioEditable(actual?.ida?.precio)
  const precioVuelta = usePrecioEditable(actual?.vuelta?.precio)
  const precio = lado === 'ida' ? precioIda : precioVuelta
  const hora = tramo?.hora && HORAS.includes(tramo.hora) ? tramo.hora : lado === 'ida' ? '11:15' : '18:05'
  const hay = Boolean(ida || vuelta)
  const guardar = () => {
    const con = (t: MiTramo | null, p: typeof precioIda): MiTramo | null => (t ? { ...t, precio: p.importe } : null)
    const v = { ida: con(ida, precioIda), vuelta: con(vuelta, precioVuelta) }
    onGuardar(v.ida || v.vuelta ? v : null)
  }
  const campo = 'h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[15px] text-text outline-none focus:border-text/50'
  return (
    <HojaAbajo titleId="hoja-mi-vuelo" onClose={onClose} capa={110}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Tu vuelo · solo para ti
      </p>
      <h2 id="hoja-mi-vuelo" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        Tu vuelo a {ciudad}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-2" role="tablist">
        {(['ida', 'vuelta'] as const).map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lado === l} data-mi-vuelo-lado={l} onClick={() => setLado(l)} className="h-11 rounded-full text-[14px] font-semibold" style={{ background: lado === l ? '#1C2230' : '#F5EFE4', color: lado === l ? '#F3D88F' : '#1C2230' }}>
            {l === 'ida' ? 'Ida' : 'Vuelta'}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <TimeListWheel items={HORAS} value={hora} onChange={(h) => poner({ ...(tramo ?? { hora: h }), hora: h })} label={lado === 'ida' ? 'Hora de llegada' : 'Hora de salida'} />
      </div>
      <div className="mt-5 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text">{lado === 'ida' ? '¿Dónde llegas? (opcional)' : '¿De dónde sales? (opcional)'}</span>
          <input value={tramo?.punto ?? ''} onChange={(e) => poner({ ...(tramo ?? { hora }), punto: e.target.value })} maxLength={40} placeholder="Ciampino" autoComplete="off" data-mi-vuelo-punto className={campo} />
        </label>
        <CampoPrecio estado={precio} etiqueta="Precio (opcional)" ayuda="Lo que has pagado tú. No se reparte con el grupo." />
      </div>
      <button type="button" disabled={!hay} onClick={guardar} data-mi-vuelo-guardar className="mt-6 h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98] disabled:opacity-40">
        Guardar
      </button>
      {actual && (
        <button type="button" onClick={onQuitar} data-mi-vuelo-quitar className="mt-3 w-full py-2 text-center text-[13px] font-semibold text-text/60 underline underline-offset-2">
          Quitar el mío
        </button>
      )}
    </HojaAbajo>
  )
}

/** «¿Para quién es?» del vuelo o el alojamiento del administrador: él siempre va marcado. Se guarda con el viaje (`cuentasEntre`) y de ahí sale el reparto de las cuentas. */
export function HojaParaQuienEsLoDelAdmin({ titulo, gente, marcadas, adminId, onGuardar, onClose }: { titulo: string; gente: Persona[]; marcadas: string[]; adminId: string | null; onGuardar: (ids: string[]) => void; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>(() => [...new Set([...(adminId ? [adminId] : []), ...marcadas])])
  const alternar = (id: string) => setIds((previo) => (previo.includes(id) ? previo.filter((x) => x !== id) : [...previo, id]))
  return (
    <HojaAbajo titleId="hoja-para-quien-lo-suyo" onClose={onClose} capa={110}>
      <h2 id="hoja-para-quien-lo-suyo" className="max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        {titulo}
      </h2>
      <p className="mt-5 flex items-baseline gap-2 text-text/50" style={ojoStyle}>
        ¿Para quién es?
        <span className="text-text/70" style={{ letterSpacing: '.04em', textTransform: 'none' }}>
          · {ids.length} de {gente.length}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2" data-para-quien-lo-suyo>
        {gente.map((p) => (
          <PastillaElegir key={p.id} datos={`lo-suyo-${p.id}`} marca elegida={ids.includes(p.id)} onClick={p.esAdmin ? undefined : () => alternar(p.id)}>
            {nombreDe(p) || inicialDe(p)}
          </PastillaElegir>
        ))}
      </div>
      <p className="mt-4 text-[12.5px] leading-snug text-text/60">Quien tenga otro, lo suyo se cambia por este. Cada uno puede volver a poner el suyo.</p>
      <button type="button" data-guardar-lo-suyo onClick={() => onGuardar(ids)} className="mt-6 h-[54px] w-full rounded-full btn-champan text-[15px] font-semibold">
        Guardar
      </button>
    </HojaAbajo>
  )
}

/** Lo que ve QUIEN NO ES EL ADMINISTRADOR de «Llegada y vuelta» y «Alojamiento»: lo del administrador, sin tocarlo, y lo suyo. */
export function LoDeCadaUnoParaElInvitado({ route, info, arrivalInfo, gente, yoId }: { route: Route; info: DestinationExcursions; arrivalInfo: ArrivalInfo; gente: Persona[]; yoId: string | null }) {
  const mio = useLoSuyo((s) => s.mio)
  const ponerVuelo = useLoSuyo((s) => s.ponerVuelo)
  const ponerAlojamiento = useLoSuyo((s) => s.ponerAlojamiento)
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

  const vueloMio = mio.vuelo
  const alojMio = mio.alojamiento
  return (
    <div className="flex flex-col gap-3" data-lo-de-cada-uno="invitado">
      {/* ── Llegada y vuelta ── */}
      {vueloMio ? (
        <div style={TARJETA} data-tarjeta-vuelo="mio">
          <CabeceraTarjeta icono="avion" titulo="Llegada y vuelta" derecha={<PastillaTuyo />} />
          <span style={{ font: "500 14px/1.45 'Geist'" }}>
            {lineasDeMiVuelo(vueloMio, dia).map((l, i) => (
              <span key={i} style={{ display: 'block' }}>
                {l}
              </span>
            ))}
          </span>
          <button type="button" onClick={() => setHoja('vuelo')} data-cambiar-lo-mio="vuelo" style={{ alignSelf: 'flex-start', font: "600 13.5px 'Geist'", color: '#6E5018', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <div style={TARJETA} data-tarjeta-vuelo="admin">
            <CabeceraTarjeta icono="avion" titulo="Llegada y vuelta" derecha={delAdminVuelo && meCubreVuelo ? <PastillaLoHaPuesto admin={admin} para={textoParaQuien(paraVuelo, gente, yoId, adminId)} /> : delAdminVuelo ? <PastillaLoHaPuesto admin={admin} para={textoParaQuien(paraVuelo, gente, yoId, adminId)} /> : <PastillaFalta />} />
            {delAdminVuelo ? (
              <span style={{ font: "500 14px/1.45 'Geist'" }}>
                {[ida, vuelta].filter((l) => l.done).map((l) => (
                  <span key={l.kind} style={{ display: 'block' }}>
                    {l.mode === 'avion' ? '✈ ' : ''}
                    {legLine(l)}
                  </span>
                ))}
              </span>
            ) : (
              <span style={{ font: "500 14px/1.45 'Geist'", color: 'rgba(28,34,48,.58)' }}>Todavía no hay vuelo puesto</span>
            )}
          </div>
          <FilaPonElTuyo icono="avion" titulo={delAdminVuelo ? 'Tengo otro vuelo' : 'Pon tu vuelo'} sub="Pon el tuyo" datos="vuelo" onClick={() => setHoja('vuelo')} />
        </>
      )}

      {/* ── Alojamiento ── */}
      {alojMio ? (
        <div style={TARJETA} data-tarjeta-aloj="mio">
          <CabeceraTarjeta icono="cama" titulo="Alojamiento" derecha={<PastillaTuyo />} />
          <span style={{ font: "500 14px/1.45 'Geist'" }}>{lineaDeMiAlojamiento(alojMio)}</span>
          <button type="button" onClick={() => setHoja('alojamiento')} data-cambiar-lo-mio="alojamiento" style={{ alignSelf: 'flex-start', font: "600 13.5px 'Geist'", color: '#6E5018', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <div style={TARJETA} data-tarjeta-aloj="admin">
            <CabeceraTarjeta icono="cama" titulo="Alojamiento" derecha={delAdminAloj ? <PastillaLoHaPuesto admin={admin} para={textoParaQuien(paraAloj, gente, yoId, adminId)} /> : <PastillaFalta />} />
            <span style={{ font: "500 14px/1.45 'Geist'", color: delAdminAloj ? undefined : 'rgba(28,34,48,.58)' }}>{delAdminAloj ? `Te alojas en ${zona?.nombre ?? hotelAdmin?.name}` : 'Todavía no hay alojamiento puesto'}</span>
          </div>
          <FilaPonElTuyo icono="cama" titulo={delAdminAloj ? 'Me alojo en otro sitio' : 'Pon tu alojamiento'} sub="Pon el tuyo" datos="alojamiento" onClick={() => setHoja('alojamiento')} />
        </>
      )}
      <span hidden data-cubre-vuelo={String(meCubreVuelo)} data-cubre-aloj={String(meCubreAloj)} />

      {hoja === 'vuelo' && (
        <HojaMiVuelo
          actual={vueloMio}
          ciudad={ciudad}
          onClose={() => setHoja(null)}
          onGuardar={(v) => {
            ponerVuelo(v)
            setHoja(null)
          }}
          onQuitar={() => {
            ponerVuelo(null)
            setHoja(null)
          }}
        />
      )}
      {hoja === 'alojamiento' && (
        <HojaTuAlojamiento
          ciudad={ciudad}
          noches={estancia?.noches ?? 0}
          actual={alojMio ? { name: alojMio.name, precio: alojMio.precio ?? precioDeAlojamiento(null) } : null}
          onClose={() => setHoja(null)}
          onGuardar={(h) => {
            ponerAlojamiento({ name: h.name, precio: h.precio })
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
export function QuienVaEnLoDelAdmin({ route, gente, que, hecho, claves, adminId }: { route: Route; gente: Persona[]; que: 'vuelo' | 'alojamiento'; hecho: boolean; claves: string[]; adminId: string | null }) {
  const grupo = useLoSuyo((s) => s.grupo)
  const setCuentasEntre = useRouteStore((s) => s.setCuentasEntre)
  const [abierta, setAbierta] = useState(false)
  if (!hecho || gente.length < 2) return null
  const todos = gente.map((p) => p.id)
  const declarado = claves.map((c) => route.cuentasEntre?.[c]).find((x) => x && x.length > 0) ?? null
  const propios = idsConLoSuyo(grupo, que)
  const efectivo = entreEfectivo(declarado, todos, propios, adminId)
  const quienes = gente.filter((p) => efectivo.includes(p.id))
  const otros = gente.filter((p) => propios.has(p.id) && !p.esAdmin)
  const nombres = (ps: Persona[]) => {
    const n = ps.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'))
    return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
  }
  const nombreOtros = otros.length === 1 ? `${nombreDe(otros[0]) || 'Alguien'} tiene su propio ${que}` : `${nombres(otros)} tienen el suyo`
  return (
    <div className="mt-2.5 flex flex-col gap-2.5" data-lo-de-cada-uno="admin" data-que={que}>
      <button type="button" onClick={() => setAbierta(true)} data-en-este-lo-suyo={que} style={FILA}>
        <IconoCuadrado nombre="compartido" grande />
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ font: "400 23px/1.1 'Instrument Serif',serif" }}>{que === 'vuelo' ? 'En este vuelo' : 'En este alojamiento'}</span>
          <span style={{ font: "400 14px/1.3 'Geist'", color: 'rgba(28,34,48,.58)' }}>{nombres(quienes)}</span>
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
          titulo={que === 'vuelo' ? 'En este vuelo' : 'En este alojamiento'}
          gente={gente}
          marcadas={declarado ?? todos}
          adminId={adminId}
          onClose={() => setAbierta(false)}
          onGuardar={(ids) => {
            const lista = ids.length === todos.length ? null : ids
            for (const c of claves) setCuentasEntre(c, lista)
            setAbierta(false)
          }}
        />
      )}
    </div>
  )
}
