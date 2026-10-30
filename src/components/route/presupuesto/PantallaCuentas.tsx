import { useState } from 'react'
import { nombreVisible } from '../../../lib/nombrePersona'
import { useHuecoAlFinal } from '../../propuesta/BotonDePropuesta'
import { createPortal } from 'react-dom'
import { formatoImporte } from '../../../lib/dinero'
import { deCentimos } from '../../../lib/cuentasGrupo'
import { useCuentasDelGrupo } from '../../../hooks/useCuentasDelGrupo'
import { useGastosDelViaje } from '../../../hooks/useGastosDelViaje'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import { useRouteStore } from '../../../store/useRouteStore'
import { HojaAbajo, ojoStyle } from '../reservas/HojaAbajo'
import { Icono } from '../../ui/Icono'
import { ParaQuienConNombres, preguntaDeReserva } from './ParaQuien'
import { CaraDePersona } from '../../compartir/CarasDelViaje'

const MONO = "'Geist Mono',monospace"
const ojo = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const }

/**
 * LA TARJETA «CUENTAS DEL GRUPO» del presupuesto (Tanda 10N2, `Piezas/Cuentas Grupo` 01): las caras del grupo y, debajo, la primera deuda pendiente («Ana le debe 15 € a Eric») o «Estáis en paz».
 * Solo en un viaje compartido; con la migración 0040 sin aplicar sigue saliendo (las cuentas se calculan igual), sin poder marcar pagos.
 */
export function TarjetaCuentas({ onAbrir }: { onAbrir: () => void }) {
  const c = useCuentasDelGrupo()
  // (Tanda 10N10 §5b) «¿Quién debe a quién?» en las dos pestañas comunes (conjunta y del grupo), nunca en «Mi cuenta», y solo cuando hay gastos comunes.
  if (!c.compartido || !c.cuentas.hayGastos) return null
  const primera = c.cuentas.pendientes[0]
  const texto = !c.cuentas.hayGastos ? 'Todavía no hay gastos del grupo' : primera ? `${c.nombreDe(primera.deudorId)} le debe ${c.texto(primera.centimos)} a ${c.nombreDe(primera.acreedorId)}` : 'Estáis en paz'
  const paz = c.cuentas.enPaz
  return (
    <button
      type="button"
      onClick={onAbrir}
      data-tarjeta-cuentas
      data-en-paz={paz ? '1' : '0'}
      className="flex w-full flex-none items-center gap-3 rounded-[20px] px-3.5 py-3 text-left text-text"
      style={{ background: paz ? 'oklch(0.96 0.035 150)' : '#FFFDF8', border: `1px solid ${paz ? 'oklch(0.8 0.08 150)' : 'rgba(181,138,46,.55)'}`, boxShadow: '0 1px 2px rgba(28,34,48,.05)' }}
    >
      <span className="flex flex-none items-center" style={{ paddingLeft: 6 }}>
        {c.personas.slice(0, 4).map((p, i) => (
          <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
            <CaraDePersona persona={p} tam={32} tono={0} borde={paz ? 'oklch(0.96 0.035 150)' : '#FFFDF8'} />
          </span>
        ))}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold leading-[1.2]">¿Quién debe a quién?</span>
        <span data-cuentas-resumen className="truncate text-[12.5px]" style={{ color: paz ? 'oklch(0.36 0.09 150)' : 'rgba(28,34,48,.62)' }}>
          {texto}
        </span>
      </span>
      <span className="flex-none text-text/45">
        <Icono nombre="adelante" size={14} />
      </span>
    </button>
  )
}

const dinero = (centimos: number, texto: (centimos: number) => string) => texto(centimos)
const conSigno = (centimos: number, texto: (centimos: number) => string) => (centimos > 0 ? `+${dinero(centimos, texto)}` : centimos < 0 ? `−${dinero(-centimos, texto)}` : `${dinero(0, texto)} ✓`)

/**
 * LA PANTALLA «CUENTAS DEL GRUPO» (Tanda 10N2, `Piezas/Cuentas Grupo` 04, 05 y 06): el total, cada persona con lo que ha pagado, lo que le toca y su saldo (verde con «+», rojo con «−», «0 € ✓»), y «Para quedar en paz»,
 * lo mínimo de pagos para dejar a todos a cero, cada uno con [Ya está pagado]. Lo marcado queda en verde con «✓ Pagado» (y se puede deshacer). Lo ve todo el grupo; marca quien paga, quien cobra, el administrador y
 * quien puede editar. En directo (la lee `GastosCompartidosHost`).
 */
export function PantallaCuentas({ onCerrar }: { onCerrar: () => void }) {
  const huecoAlFinal = useHuecoAlFinal(32) // (Tanda 10N4 §0b) hueco para el lápiz y los logros
  const c = useCuentasDelGrupo()
  const gv = useGastosDelViaje()
  const marcarPago = useGastosCompartidos((s) => s.marcarPago)
  const deshacerPago = useGastosCompartidos((s) => s.deshacerPago)
  const [error, setError] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState<string | null>(null)
  const [cambiando, setCambiando] = useState<string | null>(null)
  const { cuentas, moneda } = c
  // (Tanda 10N3) Lo que entra solo desde RESERVAS (alojamiento y coche) y quién puede cambiar su «¿Para quién es?»: el administrador.
  const adminId = c.personas.find((x) => x.esAdmin)?.id ?? null
  const soyAdmin = Boolean(adminId) && gv.yoId === adminId
  const entranSolas = c.aportaciones.filter((a) => a.origen === 'alojamiento' || a.origen === 'coche')
  const cambiandoLinea = entranSolas.find((a) => a.clave === cambiando) ?? null
  const puede = (deudorId: string, acreedorId: string) => c.puedeMarcarPagos && (gv.yoId === deudorId || gv.yoId === acreedorId || gv.puedeDecidir)
  const quienes = cuentas.personas.length

  const marcar = async (deudorId: string, acreedorId: string, centimos: number) => {
    setEnCurso(`${deudorId}>${acreedorId}`)
    setError(null)
    const fallo = await marcarPago({ deudorId, acreedorId, importe: deCentimos(centimos, moneda) })
    setEnCurso(null)
    if (fallo) setError(fallo)
  }
  const deshacer = async (id: string) => {
    setEnCurso(id)
    setError(null)
    const fallo = await deshacerPago(id)
    setEnCurso(null)
    if (fallo) setError(fallo)
  }

  return createPortal(
    <div className="map-cover-overlay fixed inset-0 z-[85] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-labelledby="titulo-cuentas" data-pantalla-cuentas data-flotantes>
      <div className="flex flex-none flex-col gap-2 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
        <button type="button" onClick={onCerrar} aria-label="Atrás" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#FFFDF8] text-text shadow-[0_1px_2px_rgba(28,34,48,.08)]">
          <Icono nombre="atras" size={18} />
        </button>
        <span id="titulo-cuentas" style={{ font: "400 30px/1 'Instrument Serif',serif" }}>
          ¿Quién debe a quién?
        </span>
        <span className="text-text/55" style={{ font: "500 11px/1.35 'Geist Mono',monospace", letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {quienes} {quienes === 1 ? 'persona' : 'personas'}
          {cuentas.aPartesIguales ? ' · a partes iguales' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2 md:px-8" style={{ paddingBottom: huecoAlFinal }}>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-2.5">
          <div data-cuentas-total className="flex flex-none items-center justify-between gap-3 rounded-[16px] bg-[#1C2230] px-4 py-3 text-[#FFFDF8]">
            <span className="text-[14px] font-semibold">
              Total del grupo <span style={{ color: '#E9C77A' }}>{dinero(cuentas.total, c.texto)}</span>
            </span>
            {cuentas.porPersona !== null && <span className="text-[12.5px] text-[#FFFDF8]/80">{dinero(cuentas.porPersona, c.texto)} por persona</span>}
          </div>

          {c.aproximado && <span data-cuentas-aproximado className="px-1 text-[11.5px] leading-[1.4] text-text/55">Las cuentas se llevan en euros; aquí las ves en {c.monedaVista} con el cambio del día (≈).</span>}
          {c.sinCambio.length > 0 && (<div data-cuentas-sin-cambio role="status" className="flex flex-none flex-col gap-1 rounded-[14px] border border-text/[.12] bg-[#FFFDF8] px-3.5 py-3"><span className="text-[13px] font-semibold text-text">Fuera de las cuentas, sin cambio a tu moneda</span>{c.sinCambio.map((x) => (<span key={x.id} className="text-[12.5px] leading-[1.4] text-text/70">{x.nombre} · {formatoImporte(x.precio)} · Sin cambio a tu moneda, se cuenta aparte</span>))}</div>)}
          {c.duplicados.length > 0 && (
            <div data-aviso-duplicado role="status" className="flex flex-none flex-col gap-1 rounded-[14px] px-3.5 py-3" style={{ background: '#FFF6DC', border: '1px solid rgba(201,154,68,.5)' }}>
              <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#6F4E37' }}>
                <Icono nombre="alerta" size={15} /> Puede que algo esté contado dos veces
              </span>
              {c.duplicados.map((d) => (
                <span key={d.linea} className="text-[12.5px] leading-[1.4] text-text/70">
                  «{d.linea}» ({dinero(d.centimos, c.texto)}) ya entra solo desde RESERVAS y también está apuntado como gasto del grupo: «{d.gasto}». Quita uno de los dos.
                </span>
              ))}
            </div>
          )}

          {!cuentas.hayGastos && (
            <div className="flex flex-none flex-col gap-0.5 rounded-[14px] border border-dashed border-text/[.18] px-3.5 py-3.5">
              <span className="text-[13px] font-medium">Todavía no hay gastos del grupo</span>
              <span className="text-[12px] leading-[1.4] text-text/60">Los gastos comunes y las entradas para varios aparecerán aquí, repartidos entre quienes toquen.</span>
            </div>
          )}

          {cuentas.personas.map((p) => {
            const persona = c.personas.find((x) => x.id === p.id)!
            const nombre = nombreVisible(p.nombre) || 'Alguien'
            const tono = p.saldo > 0 ? { fondo: 'oklch(0.96 0.035 150)', color: 'oklch(0.36 0.09 150)' } : p.saldo < 0 ? { fondo: 'oklch(0.95 0.03 25)', color: 'oklch(0.45 0.16 25)' } : { fondo: '#EDE8DE', color: 'rgba(28,34,48,.6)' }
            return (
              <div key={p.id} data-cuentas-persona={p.id} className="flex flex-none items-center gap-3 rounded-[18px] bg-[#FFFDF8] px-3.5 py-3" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
                <CaraDePersona persona={persona} tam={44} tono={0} borde="#FFFDF8" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold leading-[1.2]">{nombre}</span>
                  <span className="text-[11.5px] leading-[1.35] text-text/55">
                    {persona.salio && 'Ya no está en el viaje · '}Ha pagado {dinero(p.pagado + p.enviado, c.texto)} · Le toca {dinero(p.toca, c.texto)}
                  </span>
                </span>
                <span data-saldo={p.saldo} className="flex-none rounded-full px-3 py-1 text-[13px] font-semibold" style={{ background: tono.fondo, color: tono.color, font: `600 13px ${MONO}` }}>
                  {conSigno(p.saldo, c.texto)}
                </span>
              </div>
            )
          })}

          {entranSolas.length > 0 && (
            <>
              <span className="mt-2 text-text/55" style={ojoStyle}>
                Entra solo desde RESERVAS
              </span>
              {entranSolas.map((a) => (
                <div key={a.id} data-entra-sola={a.clave} className="flex flex-none items-center gap-3 rounded-[16px] bg-[#FFFDF8] px-3.5 py-3" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[14px] font-semibold">{a.nombre}</span>
                    <span className="text-[11.5px] text-text/55">
                      {c.nombreDe(a.pagan[0])} lo pagó · entre {a.entre.length} de {c.personas.filter((x) => !x.salio).length}
                    </span>
                  </span>
                  <span style={{ font: `600 13px ${MONO}` }}>{dinero(a.centimos, c.texto)}</span>
                  {soyAdmin && (
                    <button type="button" data-cambiar-entre onClick={() => setCambiando(a.clave ?? null)} className="zona-toque h-9 flex-none rounded-[10px] border border-text/[.14] px-2.5 text-[12px] font-semibold">
                      Para quién es
                    </button>
                  )}
                </div>
              ))}
            </>
          )}

          {cuentas.hayGastos && (cuentas.pagados.length > 0 || cuentas.pendientes.length > 0) && (
            <span className="mt-2 text-text/55" style={ojo}>
              Para quedar en paz
            </span>
          )}

          {cuentas.pagados.map((pg) => (
            <div key={pg.id} data-pago-linea="pagado" className="flex flex-none items-center gap-2.5 rounded-[16px] px-3 py-2.5" style={{ background: 'oklch(0.96 0.035 150)' }}>
              <Flecha deudor={c.nombreDe(pg.deudorId)} acreedor={c.nombreDe(pg.acreedorId)} />
              <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.25]">
                {c.nombreDe(pg.deudorId)} le debía {dinero(pg.centimos, c.texto)} a {c.nombreDe(pg.acreedorId)}
              </span>
              <span className="flex flex-none flex-col items-end gap-0.5">
                <span className="flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: 'oklch(0.36 0.09 150)' }}>
                  <Icono nombre="hecho" size={14} /> Pagado
                </span>
                {puede(pg.deudorId, pg.acreedorId) && (
                  <button type="button" data-pago-deshacer disabled={enCurso === pg.id} onClick={() => void deshacer(pg.id)} className="text-[11.5px] text-text/55 underline underline-offset-2">
                    Deshacer
                  </button>
                )}
              </span>
            </div>
          ))}

          {cuentas.pendientes.map((x) => (
            <div key={`${x.deudorId}>${x.acreedorId}`} data-pago-linea="pendiente" className="flex flex-none items-center gap-2.5 rounded-[16px] px-3 py-2.5" style={{ background: '#FFF6DC' }}>
              <Flecha deudor={c.nombreDe(x.deudorId)} acreedor={c.nombreDe(x.acreedorId)} />
              <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.25]">
                {c.nombreDe(x.deudorId)} le debe {dinero(x.centimos, c.texto)} a {c.nombreDe(x.acreedorId)}
              </span>
              {puede(x.deudorId, x.acreedorId) && (
                <button type="button" data-ya-pagado disabled={enCurso === `${x.deudorId}>${x.acreedorId}`} onClick={() => void marcar(x.deudorId, x.acreedorId, x.centimos)} className="zona-toque btn-champan h-10 flex-none rounded-[12px] px-3 text-[12.5px] font-semibold">
                  Ya está pagado
                </button>
              )}
            </div>
          ))}

          {error && (
            <p role="alert" className="text-[12.5px] text-accent-red">
              {error}
            </p>
          )}

          {cuentas.enPaz && (
            <div data-en-paz className="mt-1 flex flex-none flex-col items-center gap-3 rounded-[22px] px-4 py-7" style={{ background: 'linear-gradient(180deg,oklch(0.97 0.03 150),oklch(0.94 0.04 150))', border: '1px solid oklch(0.82 0.07 150)' }}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: 'oklch(0.5 0.12 150)', boxShadow: '0 10px 20px -8px oklch(0.4 0.12 150 / .6)' }}>
                <Icono nombre="hecho" size={26} grosor={2.4} />
              </span>
              <span style={{ font: "400 26px/1 'Instrument Serif',serif" }}>Estáis en paz</span>
            </div>
          )}
        </div>
      </div>
      {cambiandoLinea && <HojaEntreAlojamiento linea={cambiandoLinea} onClose={() => setCambiando(null)} personas={c.personas.filter((x) => !x.salio)} yoId={gv.yoId} />}
    </div>,
    document.body,
  )
}

/** «¿Para quién es?» del alojamiento o el coche que entran solos (solo el administrador lo cambia; se guarda con el viaje). */
function HojaEntreAlojamiento({ linea, personas, yoId, onClose }: { linea: { clave?: string; nombre: string; entre: string[] }; personas: { id: string; nombre: string | null }[]; yoId: string | null; onClose: () => void }) {
  const setCuentasEntre = useRouteStore((st) => st.setCuentasEntre)
  const todos = personas.map((x) => x.id)
  const [marcadas, setMarcadas] = useState<string[]>(linea.entre.filter((id) => todos.includes(id)))
  const alternar = (id: string) => setMarcadas((m) => (m.includes(id) ? (m.length > 1 ? m.filter((x) => x !== id) : m) : [...m, id]))
  return (
    <HojaAbajo titleId="hoja-entre-alojamiento" onClose={onClose} capa={120}>
      <h2 id="hoja-entre-alojamiento" className="max-w-[calc(100%-3rem)] font-display text-[24px] leading-[1.05] text-text">
        {linea.nombre}
      </h2>
      <div className="mt-4">
        <ParaQuienConNombres
          pregunta={preguntaDeReserva(linea.clave === 'coche' ? 'coche' : 'alojamiento')}
          personas={personas.map((x) => ({ id: x.id, nombre: x.nombre ?? '', esAdmin: false }))}
          marcados={marcadas}
          onAlternar={alternar}
          yoId={yoId}
          nombreDe={(id) => nombreVisible(personas.find((x) => x.id === id)?.nombre) || 'Alguien'}
          datos="entre-aloj"
        />
      </div>
      <button
        type="button"
        data-guardar-entre
        onClick={() => {
          if (linea.clave) setCuentasEntre(linea.clave, marcadas.length === todos.length ? null : marcadas)
          onClose()
        }}
        className="btn-champan mt-5 h-[54px] w-full rounded-full text-[15px] font-semibold"
      >
        Guardar
      </button>
    </HojaAbajo>
  )
}

function Flecha({ deudor, acreedor }: { deudor: string; acreedor: string }) {
  const ini = (n: string) => (n[0] ?? '·').toUpperCase()
  return (
    <span className="flex flex-none items-center gap-1.5" aria-hidden="true">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1C2230] text-[12px] font-semibold text-[#F3D59A]">{ini(deudor)}</span>
      <Icono nombre="flecha" size={13} />
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1C2230] text-[12px] font-semibold text-[#F3D59A]">{ini(acreedor)}</span>
    </span>
  )
}
