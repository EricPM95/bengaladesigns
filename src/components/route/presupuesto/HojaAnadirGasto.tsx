import { useState } from 'react'
import { HojaAbajo } from '../reservas/HojaAbajo'
import { InterruptorElegir } from '../../ui/Elegir'
import { ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { BloqueDinero, lineasDeDestino, textoDelBoton, tituloAnadirGasto, type CuentaComun } from './BloqueDinero'
import { estadoInicial, type AmbitoGasto, type GastoCompartido } from '../../../lib/gastosCompartidos'
import type { GastosDelViaje } from '../../../hooks/useGastosDelViaje'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import { usePrecioEditable } from '../../../lib/useMoneda'
import { nombreDe } from '../../../store/useViajeCompartido'
import { nombreVisible } from '../../../lib/nombrePersona'
import { nombreDeLaCuentaComun } from '../../../lib/cuentaDelViaje'

const CAMPO = 'h-[52px] min-w-0 rounded-[16px] border border-text/[.12] bg-white px-4 text-[15px] outline-none focus:border-text/40'

/** El círculo con la inicial de una persona (el del administrador, oscuro; los demás, dorado), para ENSEÑAR quién es (nunca para elegir: para elegir, `PersonasCuadradas`). */
export function InicialDePersona({ nombre, esAdmin, tam = 20 }: { nombre: string; esAdmin: boolean; tam?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: tam, height: tam, flex: 'none', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: esAdmin ? '#1C2230' : 'linear-gradient(145deg,#FFF6DC,#E9C77A 55%,#C99A44)', color: esAdmin ? '#FFFDF8' : '#1C2230', font: `600 ${Math.round(tam * 0.5)}px/1 'Geist'` }}
    >
      {(nombre[0] ?? '·').toUpperCase()}
    </span>
  )
}

/**
 * «AÑADIR A MI CUENTA» / «AÑADIR A LA CUENTA CONJUNTA» / «AÑADIR A LA CUENTA DEL GRUPO» (Tanda 10N10 §6; cambia la 10N5 y la 10N7). El gasto suelto del presupuesto NO pregunta «¿Para quién es?»: va a la pestaña desde la que se abre,
 * y el título lo dice. Orden: 1) concepto; 3) «¿Cuánto ha costado en total?» con su moneda; 4) «¿Quién lo ha pagado?» (cuadrados, si es común y para más de uno); 5) la línea pequeña de a dónde va el dinero; 6) el botón.
 *   · «Mi cuenta»: solo el concepto y el precio («Va a Mi cuenta» · «Solo lo ves tú»).
 *   · cuenta del grupo: la opción pequeña «Solo para algunos» abre los nombres (el taxi de Ana y tuyo, no de Luis).
 *   · `editar`: la misma hoja para cambiar el precio, la cuenta o quién lo pagó, o quitarlo; al guardar todo se recalcula.
 */
export function HojaAnadirGasto({ gv, onClose, editar, pestana = 'comun', cuenta = 'conjunta' }: { gv: GastosDelViaje; moneda: string; onClose: () => void; editar?: GastoCompartido; pestana?: 'mia' | 'comun'; cuenta?: CuentaComun }) {
  const anadir = useGastosCompartidos((s) => s.anadir)
  const editarGasto = useGastosCompartidos((s) => s.editar)
  const quitar = useGastosCompartidos((s) => s.quitar)
  const exMiembros = useGastosCompartidos((st) => st.exMiembros)
  const [nombre, setNombre] = useState(editar?.nombre ?? '')
  const precioEstado = usePrecioEditable(editar?.precio ?? null)
  // La cuenta: al añadir, la de la pestaña; al editar, la del gasto (se puede cambiar).
  const [cuentaElegida, setCuentaElegida] = useState<'mia' | 'comun'>(editar ? (editar.ambito === 'mio' ? 'mia' : 'comun') : pestana)
  const comun = cuentaElegida === 'comun'
  const todosIds = gv.personas.map((p) => p.id)
  const idsDeSalidas = editar ? [...new Set([...editar.pagadoPor, ...editar.entre])].filter((id) => !todosIds.includes(id)) : []
  // Quien añade el gasto, el primero de la lista (y ya marcado en «¿Quién lo ha pagado?»).
  const personasConYoPrimero = [...gv.personas].sort((a, b) => Number(b.id === gv.yoId) - Number(a.id === gv.yoId))
  const lista = [...personasConYoPrimero, ...idsDeSalidas.map((id) => ({ id, nombre: exMiembros.find((e) => e.id === id)?.nombre ?? null, foto: null, esAdmin: false }))]
  const personas = lista.map((p) => ({ id: p.id, nombre: nombreDe(p) }))
  const [pagadoPor, setPagadoPor] = useState<string[]>(editar && editar.pagadoPor.length > 0 ? editar.pagadoPor : gv.yoId ? [gv.yoId] : [])
  // «Solo para algunos» (cuenta del grupo): abierto si el gasto ya era entre unos pocos.
  const eraParaAlgunos = Boolean(editar && editar.entre.length > 0 && editar.entre.length < todosIds.length)
  const [soloAlgunos, setSoloAlgunos] = useState(eraParaAlgunos)
  const [entre, setEntre] = useState<string[]>(editar && editar.entre.length > 0 ? editar.entre : todosIds)
  const [enCurso, setEnCurso] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmarQuitar, setConfirmarQuitar] = useState(false)
  const precio = precioEstado.importe
  const admin = nombreVisible(gv.nombreAdmin) || 'el administrador'
  const alternar = (lista: string[], id: string) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])

  const entreFinal = !comun ? [] : cuenta === 'grupo' && soloAlgunos && entre.length > 0 && entre.length < todosIds.length ? entre : cuenta === 'grupo' ? todosIds : []
  const pagadoFinal = comun ? (pagadoPor.length > 0 ? pagadoPor : gv.yoId ? [gv.yoId] : []) : []
  const listo = Boolean(nombre.trim()) && precio !== null && (!comun || pagadoFinal.length > 0)
  const marcadosParaLinea = comun ? (entreFinal.length > 0 ? entreFinal : todosIds) : gv.yoId ? [gv.yoId] : []
  const normal = editar ? 'Guardar cambios' : 'Añadir gasto'
  const boton = editar ? normal : textoDelBoton({ normal, solo: !comun, marcados: comun ? marcadosParaLinea : [], yoId: gv.yoId, permiso: gv.puedeDecidir ? 'editar' : 'recomendar', nombreAdmin: gv.nombreAdmin })
  const titulo = editar ? 'Editar gasto' : tituloAnadirGasto(pestana === 'mia' ? 'mia' : cuenta)

  const enviar = async () => {
    if (!listo || !precio || enCurso) return
    setEnCurso(true)
    setError(null)
    const ambito: AmbitoGasto = comun ? 'grupo' : 'mio'
    let fallo: string | null
    if (editar && (editar.ambito === 'mio') === comun) {
      // Cambia de cuenta: se quita y se vuelve a apuntar en la otra (la base de datos no deja cambiar el ámbito de un gasto).
      fallo = await quitar(editar.id)
      if (!fallo) fallo = await anadir({ nombre: nombre.trim(), precio, ambito, estado: estadoInicial(ambito, gv.puedeDecidir), pagadoPor: pagadoFinal, entre: entreFinal })
    } else if (editar) {
      fallo = await editarGasto(editar.id, { nombre: nombre.trim(), precio, pagadoPor: pagadoFinal, entre: entreFinal })
    } else {
      fallo = await anadir({ nombre: nombre.trim(), precio, ambito, estado: estadoInicial(ambito, gv.puedeDecidir), pagadoPor: pagadoFinal, entre: entreFinal })
    }
    setEnCurso(false)
    if (fallo) setError(fallo)
    else onClose()
  }

  const quitarGasto = async () => {
    if (!editar) return
    setEnCurso(true)
    const fallo = await quitar(editar.id)
    setEnCurso(false)
    if (fallo) setError(fallo)
    else onClose()
  }

  const destinoMia = (
    <div className="flex flex-col gap-0.5" data-linea-destino style={{ font: "400 12.5px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
      {lineasDeDestino({ solo: false, marcados: gv.yoId ? [gv.yoId] : [], yoId: gv.yoId, precio, cuenta, permiso: 'admin', nombreAdmin: gv.nombreAdmin }).map((l, i) => (
        <span key={l} style={i === 0 ? { fontWeight: 600, color: 'rgba(28,34,48,.78)' } : undefined}>
          {l}
        </span>
      ))}
    </div>
  )

  return (
    <HojaAbajo titleId="hoja-anadir-gasto" onClose={onClose} capa={100}>
      <h2 id="hoja-anadir-gasto" data-titulo-hoja-gasto className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
        {titulo}
      </h2>
      <div className="mt-4 flex flex-col gap-5">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Cena el primer día" aria-label="Nombre del gasto" data-gasto-nombre className={CAMPO} />
        {editar && (
          <div className="flex flex-col gap-2.5" data-gasto-cuenta>
            <span style={ESTILO_PREGUNTA}>Cuenta</span>
            <InterruptorElegir
              valor={cuentaElegida}
              onCambio={(id) => setCuentaElegida(id as 'mia' | 'comun')}
              datos="gasto-cuenta"
              etiqueta="Cuenta"
              alto={46}
              opciones={[
                { id: 'mia', texto: 'Mi cuenta', atributos: { 'data-opcion': 'mia' } },
                { id: 'comun', texto: nombreDeLaCuentaComun(cuenta === 'grupo' ? 'grupo' : 'conjunta'), atributos: { 'data-opcion': 'comun' } },
              ]}
            />
          </div>
        )}
        <BloqueDinero
          tipo="gasto"
          solo={!comun}
          personas={personas}
          yoId={gv.yoId}
          paraQuien={entre}
          onParaQuien={(id) => setEntre((actual) => (actual.includes(id) && actual.length <= 1 ? actual : alternar(actual, id)))}
          precio={precioEstado}
          pagadoPor={pagadoPor}
          onPagadoPor={(id) => setPagadoPor((actual) => (actual.includes(id) && actual.length <= 1 ? actual : alternar(actual, id)))}
          cuenta={cuenta}
          permiso={gv.puedeDecidir ? 'editar' : 'recomendar'}
          nombreAdmin={admin}
          soloParaAlgunos={soloAlgunos}
          onSoloParaAlgunos={(abierto) => {
            setSoloAlgunos(abierto)
            if (abierto && gv.yoId) setEntre([gv.yoId])
            if (!abierto) setEntre(todosIds)
          }}
          destino={!comun ? destinoMia : undefined}
        />
        {error && (
          <p role="alert" className="text-[13px] text-accent-red">
            {error}
          </p>
        )}
        <button type="button" disabled={!listo || enCurso} onClick={() => void enviar()} data-gasto-enviar className="btn-champan mt-1 h-[54px] w-full rounded-full text-[15px] font-semibold transition-transform active:scale-[.98] disabled:opacity-40">
          {boton}
        </button>
        {editar && (
          confirmarQuitar ? (
            <div className="flex items-center justify-center gap-4" data-gasto-confirmar-quitar>
              <button type="button" onClick={() => void quitarGasto()} disabled={enCurso} className="text-[14px] font-semibold text-accent-red">
                Sí, quitar el gasto
              </button>
              <button type="button" onClick={() => setConfirmarQuitar(false)} className="text-[14px] font-medium text-text/60">
                No
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmarQuitar(true)} data-gasto-quitar className="text-center text-[14px] font-semibold text-accent-red">
              Quitar este gasto
            </button>
          )
        )}
      </div>
    </HojaAbajo>
  )
}
