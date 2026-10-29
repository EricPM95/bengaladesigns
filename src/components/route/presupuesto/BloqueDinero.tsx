import type { ReactNode } from 'react'
import { CampoPrecio } from '../../ui/CampoPrecio'
import { ESTILO_PREGUNTA, PersonasCuadradas, type PersonaElegible } from '../../ui/PersonasCuadradas'
import { formatoImporte, type Importe } from '../../../lib/dinero'
import { nombreVisible } from '../../../lib/nombrePersona'

/**
 * EL BLOQUE DEL DINERO DE TODAS LAS HOJAS (Tanda 10N10 §6). El mismo orden en todas: 2) «¿Para quién…?» → 3) «¿Cuánto ha costado en total?» (con su moneda) → 4) «¿Quién lo ha pagado?» → 5) la línea pequeña de a dónde va el dinero.
 * (1, qué es, y 6, el botón, los pone cada hoja alrededor.) Es presentacional: la hoja guarda el estado (`paraQuien`, `pagadoPor` y el precio de `usePrecioEditable`) y lo pasa por props.
 *
 *   <BloqueDinero tipo="vuelo" personas={…} yoId={…} paraQuien={…} onParaQuien={…} precio={usePrecioEditable(…)} pagadoPor={…} onPagadoPor={…} cuenta="conjunta" permiso="admin" nombreAdmin="Eric" />
 *
 * Reglas (apartado 6 del prompt):
 *   · `solo` (viajando solo): ninguna pregunta de personas, solo el precio.
 *   · `tipo="gasto"`: sin «¿Para quién…?» (va a la pestaña desde la que se abre); en `cuenta="grupo"` la opción pequeña «Solo para algunos» abre los nombres.
 *   · «¿Quién lo ha pagado?» solo si es para más de uno y hay precio; cuadrados más grandes.
 *   · Línea pequeña: «90 € cada uno · Va a la cuenta conjunta» · «Va a Mi cuenta» + «Solo lo ves tú» · «Se lo enviamos a Eric» (quien solo recomienda) · «Entra directo en el presupuesto» (quien edita).
 */
export type TipoDeHoja = 'vuelo' | 'alojamiento' | 'entradas' | 'freetour' | 'excursion' | 'coche' | 'gasto'
export type CuentaComun = 'conjunta' | 'grupo'

/** «¿Para quién es este vuelo?» … Los textos del prompt (apartado 6). */
export function preguntaParaQuien(tipo: TipoDeHoja): string | null {
  switch (tipo) {
    case 'vuelo':
      return '¿Para quién es este vuelo?'
    case 'alojamiento':
      return '¿Para quién es el alojamiento?'
    case 'entradas':
    case 'freetour':
      return '¿Para quién son las entradas?'
    case 'excursion':
      return '¿Para quién es la excursión?'
    case 'coche':
      return '¿Para quién es el coche?'
    case 'gasto':
      return null
  }
}

/** El título de la hoja de un gasto suelto según la pestaña desde la que se abre. */
export function tituloAnadirGasto(pestana: 'mia' | CuentaComun | 'total'): string {
  if (pestana === 'mia') return 'Añadir a Mi cuenta'
  if (pestana === 'grupo') return 'Añadir a la cuenta del grupo'
  if (pestana === 'conjunta') return 'Añadir a la cuenta conjunta'
  return 'Añadir gasto'
}

export const nombreDeCuenta = (cuenta: CuentaComun): string => (cuenta === 'grupo' ? 'la cuenta del grupo' : 'la cuenta conjunta')

/** Las dos líneas pequeñas de debajo: la de a dónde va el dinero y, si hace falta, la segunda («Solo lo ves tú», «Se lo enviamos a Eric»…). Pura, para las pruebas. */
export function lineasDeDestino(a: { solo: boolean; marcados: readonly string[]; yoId: string | null; precio: Importe | null; cuenta: CuentaComun; permiso: 'admin' | 'editar' | 'recomendar'; nombreAdmin: string }): string[] {
  if (a.solo) return []
  const soloYo = Boolean(a.yoId) && a.marcados.length === 1 && a.marcados[0] === a.yoId
  if (soloYo) return ['Va a Mi cuenta', 'Solo lo ves tú']
  const n = Math.max(a.marcados.length, 1)
  const cada = a.precio && n > 1 ? `${formatoImporte({ amount: Math.round((a.precio.amount / n) * 100) / 100, currency: a.precio.currency })} cada uno · ` : ''
  const primera = `${cada}Va a ${nombreDeCuenta(a.cuenta)}`
  const segunda = a.permiso === 'recomendar' ? `Se lo enviamos a ${nombreVisible(a.nombreAdmin) || 'el administrador'}` : 'Entra directo en el presupuesto'
  return [primera, segunda]
}

/** El texto del botón de abajo: quien solo recomienda y apunta algo para varios, «Enviar a Eric»; si no, el de cada hoja (`normal`: «Guardar el vuelo», «Añadir gasto»…). */
export function textoDelBoton(a: { normal: string; solo: boolean; marcados: readonly string[]; yoId: string | null; permiso: 'admin' | 'editar' | 'recomendar'; nombreAdmin: string }): string {
  const soloYo = Boolean(a.yoId) && a.marcados.length === 1 && a.marcados[0] === a.yoId
  if (a.solo || soloYo || a.permiso !== 'recomendar') return a.normal
  return `Enviar a ${nombreVisible(a.nombreAdmin) || 'el administrador'}`
}

interface EstadoPrecio {
  texto: string
  setTexto: (texto: string) => void
  moneda: string
  setMoneda: (moneda: string) => void
  opciones: { codigo: string; etiqueta: string }[]
  importe: Importe | null
}

export function BloqueDinero({
  tipo,
  solo = false,
  personas,
  yoId,
  paraQuien,
  onParaQuien,
  precio,
  pagadoPor,
  onPagadoPor,
  cuenta = 'conjunta',
  permiso = 'admin',
  nombreAdmin = '',
  soloParaAlgunos = false,
  onSoloParaAlgunos,
  destino,
  pregunta,
}: {
  tipo: TipoDeHoja
  /** Viajando solo: solo el precio. */
  solo?: boolean
  personas: PersonaElegible[]
  yoId: string | null
  /** Marcados en «¿Para quién…?» (en un `gasto`, quien está en «Solo para algunos»). */
  paraQuien: string[]
  onParaQuien: (id: string) => void
  precio: EstadoPrecio
  pagadoPor: string[]
  onPagadoPor: (id: string) => void
  cuenta?: CuentaComun
  permiso?: 'admin' | 'editar' | 'recomendar'
  nombreAdmin?: string
  /** Solo en `gasto` de la cuenta del grupo: «Solo para algunos» está abierto. */
  soloParaAlgunos?: boolean
  onSoloParaAlgunos?: (abierto: boolean) => void
  /** Sustituye las líneas pequeñas de destino (por si la hoja tiene un caso especial). */
  destino?: ReactNode
  pregunta?: string
}) {
  const textoPregunta = pregunta ?? preguntaParaQuien(tipo)
  const esGasto = tipo === 'gasto'
  // Los marcados reales: en un gasto sin «Solo para algunos», es para todos; en «Mi cuenta» (cuenta no común) no se pregunta nada.
  const marcados = esGasto && !soloParaAlgunos ? personas.map((p) => p.id) : paraQuien
  const hayPrecio = precio.importe !== null
  const variosYPrecio = !solo && marcados.length > 1 && hayPrecio
  const lineas = lineasDeDestino({ solo, marcados, yoId, precio: precio.importe, cuenta, permiso, nombreAdmin })
  return (
    <div className="flex flex-col gap-5" data-bloque-dinero={tipo}>
      {!solo && !esGasto && textoPregunta && (
        <div className="flex flex-col gap-2.5" data-para-quien-cuadrados>
          <span style={ESTILO_PREGUNTA}>{textoPregunta}</span>
          <PersonasCuadradas personas={personas} marcados={paraQuien} onAlternar={onParaQuien} datos="para-quien" etiqueta={textoPregunta} />
        </div>
      )}
      <CampoPrecio estado={precio} etiqueta="¿Cuánto ha costado en total?" />
      {!solo && esGasto && cuenta === 'grupo' && (
        <div className="flex flex-col gap-2.5" data-solo-para-algunos>
          <button type="button" onClick={() => onSoloParaAlgunos?.(!soloParaAlgunos)} aria-expanded={soloParaAlgunos} className="self-start text-[13px] font-semibold underline underline-offset-2" style={{ color: '#6F4E37' }}>
            Solo para algunos
          </button>
          {soloParaAlgunos && <PersonasCuadradas personas={personas} marcados={paraQuien} onAlternar={onParaQuien} datos="solo-para-algunos" etiqueta="Solo para algunos" />}
        </div>
      )}
      {variosYPrecio && (
        <div className="flex flex-col gap-2.5" data-quien-lo-ha-pagado>
          <span style={ESTILO_PREGUNTA}>¿Quién lo ha pagado?</span>
          <PersonasCuadradas personas={personas.filter((p) => marcados.includes(p.id) || pagadoPor.includes(p.id))} marcados={pagadoPor} onAlternar={onPagadoPor} grande datos="pagado" etiqueta="¿Quién lo ha pagado?" />
        </div>
      )}
      {destino ??
        (lineas.length > 0 && (
          <div className="flex flex-col gap-0.5" data-linea-destino style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            {lineas.map((l, i) => (
              <span key={l} style={i === 0 ? { fontWeight: 600, color: 'rgba(28,34,48,.78)' } : undefined}>
                {l}
              </span>
            ))}
          </div>
        ))}
    </div>
  )
}
