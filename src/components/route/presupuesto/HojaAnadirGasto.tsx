import { useState } from 'react'
import { HojaAbajo, ojoStyle } from '../reservas/HojaAbajo'
import { Icono } from '../../ui/Icono'
import { InterruptorElegir, PastillaElegir } from '../../ui/Elegir'
import { importeDeTexto, simboloDe } from '../../../lib/dinero'
import { estadoInicial, type AmbitoGasto } from '../../../lib/gastosCompartidos'
import type { GastosDelViaje } from '../../../hooks/useGastosDelViaje'
import { useGastosCompartidos } from '../../../store/useGastosCompartidos'
import { useMonedas } from '../../../lib/useMoneda'
import { nombreDe } from '../../../store/useViajeCompartido'

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
 * entra directo / solo lo ves tú) y, en [Para todos], «¿Quién lo ha pagado?» con una pastilla por persona (quien lo añade, ya marcada). El botón dice [Enviar a Eric] si el gasto espera su respuesta y [Añadir gasto] si entra directo.
 */
export function HojaAnadirGasto({ gv, moneda, onClose }: { gv: GastosDelViaje; moneda: string; onClose: () => void }) {
  const anadir = useGastosCompartidos((s) => s.anadir)
  const { opciones } = useMonedas()
  const [nombre, setNombre] = useState('')
  const [importe, setImporte] = useState('')
  const [monedaElegida, setMoneda] = useState<string | null>(null)
  const [ambito, setAmbito] = useState<AmbitoGasto>('grupo')
  const [pagadoPor, setPagadoPor] = useState<string[]>(gv.yoId ? [gv.yoId] : [])
  const [enCurso, setEnCurso] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const monedaDelCampo = monedaElegida ?? moneda
  const precio = importeDeTexto(importe, monedaDelCampo)
  const listo = Boolean(nombre.trim()) && precio !== null && (ambito === 'mio' || pagadoPor.length > 0)
  const espera = ambito === 'grupo' && !gv.puedeDecidir
  const admin = gv.nombreAdmin || 'el administrador'

  const info = ambito === 'mio' ? { icono: 'ojoCerrado' as const, texto: 'Solo lo ves tú' } : espera ? { icono: 'flecha' as const, texto: `Se lo enviamos a ${admin}` } : { icono: 'hecho' as const, texto: 'Entra directo en el presupuesto' }
  const boton = espera ? `Enviar a ${admin}` : 'Añadir gasto'

  const alternar = (id: string) => setPagadoPor((actuales) => (actuales.includes(id) ? (actuales.length > 1 ? actuales.filter((x) => x !== id) : actuales) : [...actuales, id]))

  const enviar = async () => {
    if (!listo || !precio || enCurso) return
    setEnCurso(true)
    setError(null)
    const fallo = await anadir({ nombre: nombre.trim(), precio, ambito, estado: estadoInicial(ambito, gv.puedeDecidir), pagadoPor: ambito === 'mio' ? [] : pagadoPor })
    setEnCurso(false)
    if (fallo) setError(fallo)
    else onClose()
  }

  return (
    <HojaAbajo titleId="hoja-anadir-gasto" onClose={onClose} capa={100}>
      <h2 id="hoja-anadir-gasto" className="max-w-[calc(100%-3rem)] font-display text-[28px] leading-[1.05] text-text">
        Añadir gasto
      </h2>
      <div className="mt-4 flex flex-col gap-3">
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
        <InterruptorElegir
          valor={ambito}
          onCambio={(id) => setAmbito(id as AmbitoGasto)}
          datos="gasto-ambito"
          etiqueta="¿Para quién es el gasto?"
          opciones={[
            { id: 'grupo', texto: 'Para todos', icono: <Icono nombre="compartido" size={17} /> },
            { id: 'mio', texto: 'Para mí', icono: <Icono nombre="candado" size={16} /> },
          ]}
        />
        <div data-gasto-info className="flex items-center gap-2.5 rounded-[14px] bg-[#F3E6C6]/70 px-3.5 py-3 text-[13px] font-medium text-[#6F4E37]">
          <Icono nombre={info.icono} size={16} />
          <span>{info.texto}</span>
        </div>
        {ambito === 'grupo' && (
          <div className="flex flex-col gap-2" data-gasto-quien-pago>
            <span className="text-text/55" style={ojoStyle}>
              ¿Quién lo ha pagado?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {gv.personas.map((p) => (
                <PastillaElegir key={p.id} elegida={pagadoPor.includes(p.id)} onClick={() => alternar(p.id)} marca datos={`pago-${p.id}`} icono={pagadoPor.includes(p.id) ? undefined : <InicialDePersona nombre={nombreDe(p)} esAdmin={p.esAdmin} />}>
                  {nombreDe(p) || 'Alguien'}
                </PastillaElegir>
              ))}
            </div>
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
