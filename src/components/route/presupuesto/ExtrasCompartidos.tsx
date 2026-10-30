import { useState, type ReactNode, type CSSProperties } from 'react'
import { formatoImporte } from '../../../lib/dinero'
import { textoDeQuienPago, type GastoCompartido } from '../../../lib/gastosCompartidos'
import type { BloquePresupuesto, LineaPresupuesto } from '../../../lib/presupuesto'
import type { GastosDelViaje } from '../../../hooks/useGastosDelViaje'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import { useRouteStore } from '../../../store/useRouteStore'
import { Icono } from '../../ui/Icono'
import { HojaAnadirGasto, InicialDePersona } from './HojaAnadirGasto'
import type { CuentaComun } from './BloqueDinero'
import { nombresEnFrase } from '../../../lib/gastosCompartidos'

const AZUL_EXTRAS = { fondo: 'oklch(0.55 0.1 220 / .14)', tinta: 'oklch(0.45 0.1 220)' }
const MONO = "'Geist Mono',monospace"

/**
 * LOS «EXTRAS» DE UN VIAJE COMPARTIDO (Tanda 10N, apartado 9; `Piezas/Presupuesto Compartido` 01, 02, 09 y 10). Cada gasto con su cartera en nuestro azul de Extras y, debajo, quién lo pagó:
 *   · del grupo: «Pagó Eric · Para todos» (con la inicial de quien pagó);
 *   · el mío esperando respuesta: en amarillo, con «Pendiente de Eric»;
 *   · solo mío: el ojo tachado y «Solo para ti» (no suma al grupo);
 *   · el que me han rechazado: «Eric prefirió no sumarlo · ahora solo para ti».
 * El que acaban de aceptar se marca en verde un momento. Debajo, [+ Añadir gasto].
 */
export function ExtrasCompartidos({ cabecera, bloque, gv, moneda, pestana = 'comun', cuenta = 'conjunta' }: { cabecera: ReactNode; bloque: BloquePresupuesto | null; gv: GastosDelViaje; moneda: string; pestana?: 'mia' | 'comun'; cuenta?: CuentaComun }) {
  const resaltado = useGastosCompartidos((s) => s.resaltado)
  const quitar = useGastosCompartidos((s) => s.quitar)
  const removeGastoExtra = useRouteStore((s) => s.removeGastoExtra)
  const [hoja, setHoja] = useState(false)
  const todos = useGastosCompartidos((s) => s.gastos)
  // (Tanda 10N2) Editar un gasto del grupo (quién lo pagó, entre quién, el importe): quien lo añadió, el administrador y quien puede editar.
  const [editando, setEditando] = useState<string | null>(null)
  const gastoEditando = todos.find((g) => g.id === editando) ?? null
  const [error, setError] = useState<string | null>(null)
  const lineas = bloque?.lineas ?? []
  const admin = gv.nombreAdmin || 'el administrador'

  const puedeQuitar = (l: LineaPresupuesto) => {
    const c = l.compartido
    if (!c) return false
    if (c.gastoId === null) return !gv.esInvitado // un extra anterior a compartir: del administrador
    return c.autorId === gv.yoId || (c.vista === 'grupo' && gv.puedeDecidir)
  }
  const puedeEditar = (l: LineaPresupuesto) => {
    const c = l.compartido
    // (10N10) Tocar cualquier gasto abre su hoja: el mío (de Mi cuenta o del grupo) y, si puedo decidir, los del grupo.
    return Boolean(c && c.gastoId && (c.autorId === gv.yoId || (c.vista === 'grupo' && gv.puedeDecidir)))
  }
  const quitarLinea = async (l: LineaPresupuesto) => {
    const c = l.compartido
    if (!c) return
    setError(null)
    if (c.gastoId === null) {
      removeGastoExtra(l.id.replace(/^extra-/, ''))
      return
    }
    const fallo = await quitar(c.gastoId)
    if (fallo) setError(fallo)
  }

  return (
    <div className="flex flex-none flex-col gap-2.5 rounded-[22px] bg-[#FFFDF8] p-3.5" style={{ border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 1px 2px rgba(28,34,48,.05),0 12px 30px -22px rgba(28,34,48,.35)' }} data-blk="extras" data-extras-compartidos>
      {cabecera}
      {lineas.map((l) => (
        <FilaDeGasto key={l.id} linea={l} gasto={todos.find((g) => g.id === l.compartido?.gastoId) ?? null} gv={gv} moneda={moneda} admin={admin} verde={resaltado !== null && l.compartido?.gastoId === resaltado} onQuitar={puedeQuitar(l) ? () => void quitarLinea(l) : undefined} onEditar={puedeEditar(l) ? () => setEditando(l.compartido!.gastoId) : undefined} />
      ))}
      {error && (
        <p role="alert" className="text-[12.5px] text-accent-red">
          {error}
        </p>
      )}
      <button type="button" onClick={() => setHoja(true)} data-anadir-gasto className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[14px] font-semibold" style={{ border: '1.5px dashed rgba(181,138,46,.55)', color: '#8A6420', background: 'transparent' }}>
        <Icono nombre="anadir" size={16} />
        Añadir gasto
      </button>
      {hoja && <HojaAnadirGasto gv={gv} moneda={moneda} pestana={pestana} cuenta={cuenta} onClose={() => setHoja(false)} />}
      {gastoEditando && <HojaAnadirGasto gv={gv} moneda={moneda} pestana={pestana} cuenta={cuenta} editar={gastoEditando} onClose={() => setEditando(null)} />}
    </div>
  )
}

function FilaDeGasto({ linea, gasto, gv, moneda, admin, verde, onQuitar, onEditar }: { linea: LineaPresupuesto; gasto: GastoCompartido | null; gv: GastosDelViaje; moneda: string; admin: string; verde: boolean; onQuitar?: () => void; onEditar?: () => void }) {
  const vista = linea.compartido?.vista ?? 'grupo'
  const cuenta = vista === 'grupo'
  const quienes = (linea.compartido?.pagadoPor ?? []).map((id) => ({ id, persona: gv.personas.find((p) => p.id === id) }))
  const nombres = quienes.map((q) => gv.nombreDe(q.id))
  const primera = quienes[0]?.persona
  const fila: CSSProperties =
    vista === 'pendiente'
      ? { background: '#FFF6DC', border: '1.5px dashed rgba(201,154,68,.7)' }
      : verde
        ? { background: 'oklch(0.96 0.035 150)', border: '1.5px solid oklch(0.72 0.1 150)', transition: 'background .4s,border-color .4s' }
        : { background: '#F8F3EA', border: '1.5px solid transparent' }
  const icono = vista === 'pendiente' ? 'reloj' : cuenta ? 'presupuesto' : 'ojoCerrado'
  return (
    <div className="flex min-h-[52px] items-center gap-2.5 rounded-[14px] py-1.5 pl-1.5 pr-1" style={{ ...fila, cursor: onEditar ? 'pointer' : undefined }} data-gasto-vista={vista} data-gasto-fila={linea.nombre} data-gasto-editable={onEditar ? '1' : undefined} onClick={onEditar} role={onEditar ? 'button' : undefined} aria-label={onEditar ? `Editar ${linea.nombre}` : undefined}>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]" style={{ background: vista === 'pendiente' ? '#F3D59A' : cuenta ? AZUL_EXTRAS.fondo : '#EDE4D3', color: vista === 'pendiente' ? '#8A6420' : cuenta ? AZUL_EXTRAS.tinta : 'rgba(28,34,48,.5)' }}>
        <Icono nombre={icono} size={15} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-[13.5px] font-medium leading-[1.2]">{linea.nombre}</span>
        {vista === 'pendiente' ? (
          <span data-pendiente className="inline-flex w-fit items-center rounded-full bg-[#F3D59A] px-2 py-[1px] text-[11px] font-semibold text-[#6F4E37]">
            Pendiente de {admin}
          </span>
        ) : vista === 'grupo' ? (
          <span className="flex items-center gap-1.5 text-[11px] text-text/55">
            {primera && <InicialDePersona nombre={nombres[0] ?? ''} esAdmin={primera.esAdmin} tam={14} />}
            {`${textoDeQuienPago(nombres) || 'Del grupo'} · ${paraQuienTexto(gasto, gv)}`}
          </span>
        ) : (
          <span className="text-[11px] text-text/55">{vista === 'rechazado' ? `${admin} prefirió no sumarlo · ahora solo para ti` : 'Solo para ti'}</span>
        )}
      </span>
      <span className="flex flex-none flex-col items-end gap-px" style={{ opacity: cuenta ? 1 : 0.5 }}>
        <span style={{ font: `600 13px ${MONO}` }}>{linea.enMonedaViajero && linea.precio.currency !== moneda ? `≈ ${formatoImporte(linea.enMonedaViajero)}` : formatoImporte(linea.precio)}</span>
        {linea.precio.currency !== moneda && (
          <span className="text-text/55" style={{ font: `500 11px ${MONO}` }}>
            {linea.enMonedaViajero ? formatoImporte(linea.precio) : 'Sin cambio a tu moneda'}
          </span>
        )}
      </span>
      {onQuitar ? (
        <button type="button" aria-label={`Quitar ${linea.nombre}`} onClick={(e) => { e.stopPropagation(); onQuitar() }} className="zona-toque flex h-9 w-9 flex-none items-center justify-center rounded-full text-text/45 hover:bg-[#EDE4D3]">
          <Icono nombre="cerrar" size={13} />
        </button>
      ) : (
        <span className="w-2 flex-none" />
      )}
    </div>
  )
}

/** «Para todos» / «Para los dos» / «Para Eric y Ana» (el reparto de un gasto del grupo). */
function paraQuienTexto(gasto: GastoCompartido | null, gv: GastosDelViaje): string {
  const ids = gasto && gasto.entre && gasto.entre.length > 0 ? gasto.entre : gv.personas.map((p) => p.id)
  if (ids.length >= gv.personas.length) return gv.personas.length === 2 ? 'Para los dos' : 'Para todos'
  return `Para ${nombresEnFrase(ids.map((id) => gv.nombreDe(id)))}`
}
