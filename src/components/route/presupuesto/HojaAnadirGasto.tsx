import { useState } from 'react'
import { HojaAbajo } from '../reservas/HojaAbajo'
import { Icono } from '../../ui/Icono'
import { PastillaElegir } from '../../ui/Elegir'
import { useModoCuentas } from '../../../lib/modoCuentas'
import { ParaQuienConjunta, ParaQuienConNombres } from './ParaQuien'
import { importeDeTexto, simboloDe, textoDeImporte } from '../../../lib/dinero'
import { estadoInicial, type AmbitoGasto, type GastoCompartido } from '../../../lib/gastosCompartidos'
import type { GastosDelViaje } from '../../../hooks/useGastosDelViaje'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import { useMonedas } from '../../../lib/useMoneda'
import { nombreDe } from '../../../store/useViajeCompartido'
import { nombreVisible } from '../../../lib/nombrePersona'

const CAMPO = 'h-[52px] min-w-0 rounded-[16px] border border-text/[.12] bg-[#FFFDF8] px-4 text-[15px] outline-none focus:border-text/40'

/** El círculo con la inicial de una persona (el del administrador, oscuro; los demás, dorado), para las pastillas y las filas. */
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
 * «AÑADIR GASTO» de un viaje compartido (Tanda 10N, apartado 9; `Piezas/Presupuesto Compartido` 03, 04 y 05): nombre, precio, [Para todos] [Para mí], una línea que dice qué pasa (se lo enviamos al administrador /
 * entra directo / solo lo ves tú) y, en [Para todos], «¿Quién ha pagado?» con una pastilla por persona (quien lo añade, ya marcada). El botón dice [Enviar a Eric] si el gasto espera su respuesta y [Añadir gasto] si entra directo.
 */
export function HojaAnadirGasto({ gv, moneda, onClose, editar }: { gv: GastosDelViaje; moneda: string; onClose: () => void; editar?: GastoCompartido }) {
  const anadir = useGastosCompartidos((s) => s.anadir)
  const editarGasto = useGastosCompartidos((s) => s.editar)
  const { opciones } = useMonedas()
  const [nombre, setNombre] = useState(editar?.nombre ?? '')
  const [importe, setImporte] = useState(editar ? textoDeImporte(editar.precio) : '')
  const [monedaElegida, setMoneda] = useState<string | null>(editar?.precio.currency ?? null)
  // (Tanda 10N7) Cómo se llevan las cuentas: en la conjunta, «Para los dos» / «Solo para mí»; en «Cada uno lo suyo», solo los nombres (sin [Para todos] / [Para mí]): quien lo añade sale marcado en «¿Para quién es?».
  const { modo } = useModoCuentas()
  const conjunta = modo === 'conjunta'
  const [ambito, setAmbito] = useState<AmbitoGasto>('grupo')
  const [pagadoPor, setPagadoPor] = useState<string[]>(editar ? editar.pagadoPor : gv.yoId ? [gv.yoId] : [])
  // «¿Entre quién?» (Tanda 10N2): todas las personas marcadas por defecto; un gasto de antes (sin lista) también es entre todos.
  const todosIds = gv.personas.map((p) => p.id)
  const [entre, setEntre] = useState<string[]>(editar && editar.entre.length > 0 ? editar.entre : editar || conjunta || !gv.yoId ? todosIds : [gv.yoId])
  // (Tanda 10N3) El administrador edita también los gastos de quien ya salió del viaje: esa persona sale en las pastillas, con su nombre, para poder cambiar quién pagó y entre quién.
  const exMiembros = useGastosCompartidos((st) => st.exMiembros)
  const idsDeSalidas = editar ? [...new Set([...editar.pagadoPor, ...editar.entre])].filter((id) => !todosIds.includes(id)) : []
  // (Tanda 10N5 §6d) Quien añade el gasto, el primero de la lista (y ya marcado en «¿Quién ha pagado?»); los demás, detrás.
  const personasConYoPrimero = [...gv.personas].sort((a, b) => Number(b.id === gv.yoId) - Number(a.id === gv.yoId))
  const lista = [...personasConYoPrimero, ...idsDeSalidas.map((id) => ({ id, nombre: exMiembros.find((e) => e.id === id)?.nombre ?? null, foto: null, esAdmin: false }))]
  const [enCurso, setEnCurso] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const monedaDelCampo = monedaElegida ?? moneda
  const precio = importeDeTexto(importe, monedaDelCampo)
  // Solo para quien lo paga: en la conjunta, «Solo para mí»; en «Cada uno lo suyo», cuando solo marca a quien lo añade y lo paga él (lo demás es un gasto del grupo).
  const soloMio = !editar && (conjunta ? ambito === 'mio' : Boolean(gv.yoId) && entre.length === 1 && entre[0] === gv.yoId && pagadoPor.length === 1 && pagadoPor[0] === gv.yoId)
  const ambitoFinal: AmbitoGasto = soloMio ? 'mio' : 'grupo'
  const listo = Boolean(nombre.trim()) && precio !== null && (soloMio || pagadoPor.length > 0)
  const espera = !soloMio && !gv.puedeDecidir && !editar
  const admin = nombreVisible(gv.nombreAdmin) || 'el administrador'

  const boton = editar ? 'Guardar cambios' : espera ? `Enviar a ${admin}` : 'Añadir gasto'

  const alternar = (id: string) => setPagadoPor((actuales) => (actuales.includes(id) ? (actuales.length > 1 ? actuales.filter((x) => x !== id) : actuales) : [...actuales, id]))

  const alternarEntre = (id: string) => setEntre((actuales) => (actuales.includes(id) ? (actuales.length > 1 ? actuales.filter((x) => x !== id) : actuales) : [...actuales, id]))
  // Marcar a todos = lista completa (así quien entre después al viaje no se cuela en un gasto ya hecho).
  const entreFinal = todosIds.every((id) => entre.includes(id)) && entre.length === todosIds.length ? todosIds : entre.filter((id) => todosIds.includes(id) || editar?.entre.includes(id))

  const enviar = async () => {
    if (!listo || !precio || enCurso) return
    setEnCurso(true)
    setError(null)
    const fallo = editar
      ? await editarGasto(editar.id, { nombre: nombre.trim(), precio, pagadoPor, entre: entreFinal })
      : await anadir({ nombre: nombre.trim(), precio, ambito: ambitoFinal, estado: estadoInicial(ambitoFinal, gv.puedeDecidir), pagadoPor: soloMio ? [] : conjunta ? (gv.yoId ? [gv.yoId] : pagadoPor) : pagadoPor, entre: soloMio || conjunta ? [] : entreFinal })
    setEnCurso(false)
    if (fallo) setError(fallo)
    else onClose()
  }

  return (
    <HojaAbajo titleId="hoja-anadir-gasto" onClose={onClose} capa={100}>
      <h2 id="hoja-anadir-gasto" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
        {editar ? 'Editar gasto' : 'Añadir gasto'}
      </h2>
      <div className="mt-4 flex flex-col gap-5">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Cena el primer día" aria-label="Nombre del gasto" data-gasto-nombre className={CAMPO} />
        <div className="grid gap-2" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
          <input value={importe} onChange={(e) => setImporte(e.target.value)} inputMode="decimal" placeholder="30" aria-label="Importe" data-gasto-importe className={CAMPO} style={{ fontFamily: "'Geist Mono',monospace" }} />
          <label className="relative flex items-center">
            <span className="sr-only">Moneda del gasto</span>
            <select value={monedaDelCampo} onChange={(e) => setMoneda(e.target.value)} aria-label="Moneda del gasto" className="h-[52px] rounded-[16px] border border-text/[.12] bg-[#FFFDF8] px-3 text-[14px] font-semibold text-text">
              {opciones.map((o) => (
                <option key={o.codigo} value={o.codigo}>
                  {simboloDe(o.codigo)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {conjunta && !editar && <ParaQuienConjunta valor={ambito === 'mio' ? 'mio' : 'todos'} onCambio={(v) => setAmbito(v === 'mio' ? 'mio' : 'grupo')} personas={gv.personas.length} datos="gasto-ambito" />}
        {espera && (
          <div data-gasto-info className="flex items-center gap-2.5 rounded-[14px] bg-[#F3E6C6]/70 px-3.5 py-3 text-[13px] font-medium text-[#6F4E37]">
            <Icono nombre="flecha" size={16} />
            <span>Se lo enviamos a {admin}</span>
          </div>
        )}
        {!conjunta && (
          <div className="flex flex-col gap-2" data-gasto-quien-pago>
            <span className="text-[15px] font-semibold text-text">¿Quién ha pagado?</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {lista.map((p) => (
                <PastillaElegir key={p.id} elegida={pagadoPor.includes(p.id)} onClick={() => alternar(p.id)} marca datos={`pago-${p.id}`} icono={undefined}>
                  {nombreVisible(nombreDe(p)) || 'Alguien'}
                </PastillaElegir>
              ))}
            </div>
          </div>
        )}
        {!conjunta && (
          <div data-gasto-entre-quien>
            <ParaQuienConNombres
              pregunta="¿Para quién es?"
              personas={lista.map((p) => ({ id: p.id, nombre: nombreDe(p), esAdmin: p.esAdmin }))}
              marcados={entre}
              onAlternar={alternarEntre}
              yoId={gv.yoId}
              nombreDe={(id) => gv.nombreDe(id)}
              datos="entre"
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-accent-red">
            {error}
          </p>
        )}
        <button type="button" disabled={!listo || enCurso} onClick={() => void enviar()} data-gasto-enviar className="btn-champan mt-1 h-[54px] w-full rounded-full text-[15px] font-semibold transition-transform active:scale-[.98] disabled:opacity-40">
          {boton}
        </button>
      </div>
    </HojaAbajo>
  )
}
