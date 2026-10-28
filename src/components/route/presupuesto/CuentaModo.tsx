import { useState } from 'react'
import { etiquetaCuentaConjunta, setModoCuentas, setNombreCuentaConjunta, useModoCuentas, type ModoCuentas } from '../../../lib/modoCuentas'
import { useModoCuentasUi } from '../../../store/useModoCuentasUi'
import { useViajeCompartido, nombreDe } from '../../../store/useViajeCompartido'
import { useCuentasDelGrupo } from '../../../hooks/useCuentasDelGrupo'
import { usePermisosDelViaje } from '../../../hooks/usePermisosDelViaje'
import { HojaOpciones, OpcionTarjeta } from '../../ui/HojaOpciones'
import { Hoja } from '../../ui/Hoja'
import { ConfirmDialog } from '../ConfirmDialog'
import { CaraDePersona } from '../../compartir/CarasDelViaje'
import { botonChampan } from '../../../lib/marcaBoton'

/**
 * COMO SE LLEVAN LAS CUENTAS, LO VISIBLE (Tanda 10N7, `Piezas/Cuentas Modo` de Design 02, 03, 06, 06b y 07). Piezas sueltas para que el presupuesto las monte donde toque:
 *   · `EtiquetaCuentaConjunta`  — «CUENTA CONJUNTA · ERIC Y ANA» con su lápiz, dentro de la tarjeta oscura de arriba (solo en cuenta conjunta);
 *   · `BotonModoCuentas`        — el botón redondo de arriba a la derecha de la cabecera que abre «¿Cómo lleváis las cuentas?» (no sale viajando solo);
 *   · `PreguntaModoCuentas`     — la tarjeta de arriba del presupuesto que pregunta lo mismo al administrador mientras no haya elegido;
 *   · `ModoCuentasHost`         — SIEMPRE montado: las hojas (elegir, renombrar) y la confirmación. Las abre el botón, la pregunta o el aviso de la campana.
 */

const DOS_ANILLOS = 'M9 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'
const DOS_CAJAS = 'M5 8h5v8H5zM14 8h5v8h-5z'
const LAPIZ = 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4'

function Trazo({ d, color, size, grosor = 1.9 }: { d: string; color: string; size: number; grosor?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d={d} />
    </svg>
  )
}

/** Los nombres de las personas del viaje, con la primera en mayúscula. */
function useNombresDelViaje(): string[] {
  const gente = useViajeCompartido((s) => s.gente)
  return [...gente].sort((a, b) => Number(b.esAdmin) - Number(a.esAdmin)).map((p) => nombreDe(p))
}

/** «CUENTA CONJUNTA · ERIC Y ANA» con el lápiz (Design 02). Con un nombre puesto, ese nombre en lugar de «Cuenta conjunta». Solo quien puede editar ve el lápiz. */
export function EtiquetaCuentaConjunta() {
  const m = useModoCuentas()
  const { puedeEditar } = usePermisosDelViaje()
  const abrirNombre = useModoCuentasUi((s) => s.abrirNombre)
  const nombres = useNombresDelViaje()
  if (m.modo !== 'conjunta') return null
  const texto = etiquetaCuentaConjunta(nombres, m.nombrePuesto)
  return (
    <span data-etiqueta-cuenta-conjunta className="flex items-center gap-2">
      <span data-cuenta-nombre style={{ font: "500 11px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#B9B2A4', textTransform: 'uppercase' }}>
        {texto}
      </span>
      {puedeEditar && (
        <button type="button" onClick={abrirNombre} aria-label="Cambiar el nombre de la cuenta" data-lapiz-cuenta className="flex h-6 w-6 flex-none items-center justify-center rounded-full">
          <Trazo d={LAPIZ} color="#E9C77A" size={16} />
        </button>
      )}
    </span>
  )
}

/** El botón redondo de la cabecera (Design 06): dos anillos en un círculo blanco con borde dorado. */
export function BotonModoCuentas() {
  const m = useModoCuentas()
  const abrir = useModoCuentasUi((s) => s.abrirEleccion)
  if (m.modo === 'solo') return null
  return (
    <button
      type="button"
      onClick={abrir}
      aria-label="¿Cómo lleváis las cuentas?"
      data-boton-modo-cuentas
      className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full"
      style={{ background: '#FFFDF8', border: '1.5px solid #B58A2E', boxShadow: '0 6px 14px -8px rgba(110,80,24,.6)' }}
    >
      <Trazo d={DOS_ANILLOS} color="#6E5018" size={22} grosor={1.8} />
    </button>
  )
}

/** La pregunta de arriba del presupuesto mientras el administrador no elige (Design 07). Solo la ve el administrador. */
export function PreguntaModoCuentas() {
  const m = useModoCuentas()
  const gente = useViajeCompartido((s) => s.gente)
  const abrir = useModoCuentasUi((s) => s.abrirEleccion)
  const { aplicar } = useCambioDeModo()
  if (!m.pendiente || !m.esAdmin) return null
  const caras = [...gente].sort((a, b) => Number(b.esAdmin) - Number(a.esAdmin)).slice(0, 3)
  return (
    <div data-pregunta-modo-cuentas className="flex flex-none flex-col gap-3 rounded-[26px] bg-[#FFFDF8] p-4" style={{ border: '1.5px solid #B58A2E', boxShadow: '0 12px 26px -16px rgba(110,80,24,.55)' }}>
      <button type="button" onClick={abrir} className="flex items-center gap-2.5 text-left" aria-label="Elegir cómo lleváis las cuentas">
        <span className="flex">
          {caras.map((p, i) => (
            <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
              <CaraDePersona persona={p} tam={34} tono={0} borde="#FFFDF8" />
            </span>
          ))}
        </span>
        <span style={{ font: "400 25px/1.05 'Instrument Serif',serif" }}>¿Cómo lleváis las cuentas?</span>
      </button>
      <div className="flex gap-2.5">
        <button type="button" data-elegir-modo="conjunta" onClick={() => aplicar('conjunta')} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-bold" style={botonChampan()}>
          <Trazo d={DOS_ANILLOS} color="#4A3510" size={18} grosor={2} />
          Todo juntos
        </button>
        <button type="button" data-elegir-modo="cada_uno" onClick={() => aplicar('cada_uno')} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold" style={{ background: '#F5EDDD', border: '1px solid rgba(28,34,48,.16)' }}>
          <Trazo d={DOS_CAJAS} color="#1C2230" size={18} grosor={2} />
          Cada uno lo suyo
        </button>
      </div>
    </div>
  )
}

/**
 * Cambiar de forma (§2): si ya hay gastos apuntados, antes la confirmación (se pierde cómo estaba); si no, se cambia directamente. El hook devuelve `aplicar(modo)` y la confirmación pendiente para pintarla.
 * La confirmación la pinta quien monta el hook (`ModoCuentasHost`); aquí `aplicar` solo deja el modo pedido en un almacén pequeño para que la confirmación salga siempre en el mismo sitio.
 */
const CONFIRMACION = {
  conjunta: { texto: '¿Cambiamos a cuenta conjunta?', detalle: 'Las deudas de las cuentas del grupo dejan de contar.', peligro: true },
  cada_uno: { texto: '¿Cambiamos a cada uno lo suyo?', detalle: 'Lo apuntado contará como pagado por quien lo apuntó, a partes iguales entre todos.', peligro: false },
} as const

let pedirConfirmacion: ((modo: Exclude<ModoCuentas, 'solo'>) => void) | null = null

export function useCambioDeModo(): { aplicar: (modo: Exclude<ModoCuentas, 'solo'>) => void } {
  const m = useModoCuentas()
  const cuentas = useCuentasDelGrupo()
  const cerrar = useModoCuentasUi((s) => s.cerrarEleccion)
  return {
    aplicar: (modo) => {
      // Lo mismo que ya hay: solo se anota la elección (así deja de preguntar), sin confirmar nada.
      const cambia = modo !== m.modo
      const hayGastos = cuentas.aportaciones.length > 0 || cuentas.cuentas.hayGastos
      if (cambia && hayGastos && pedirConfirmacion) {
        pedirConfirmacion(modo)
        return
      }
      setModoCuentas(modo)
      cerrar()
    },
  }
}

/** La hoja «¿Cómo lleváis las cuentas?» (Design 06b): dos tarjetas; la elegida, con el estilo de elegir. Los que no son el administrador la ven sin tocarla. */
function HojaModo() {
  const m = useModoCuentas()
  const cerrar = useModoCuentasUi((s) => s.cerrarEleccion)
  const { aplicar } = useCambioDeModo()
  const nadie = m.pendiente
  return (
    <HojaOpciones etiqueta="Cuentas del viaje" titulo="¿Cómo lleváis las cuentas?" onCerrar={cerrar} datos="modo-cuentas">
      <OpcionTarjeta
        tono="arena"
        icono={DOS_ANILLOS}
        titulo="Todo juntos"
        linea="Una cuenta conjunta, sin deudas"
        elegida={m.modo === 'conjunta' && !nadie}
        deshabilitada={!m.esAdmin}
        derecha={m.modo === 'conjunta' && !nadie ? <Marca /> : undefined}
        datos="modo-conjunta"
        onClick={m.esAdmin ? () => aplicar('conjunta') : undefined}
      />
      <OpcionTarjeta
        tono="arena"
        icono={DOS_CAJAS}
        titulo="Cada uno lo suyo"
        linea="Con las cuentas del grupo"
        elegida={m.modo === 'cada_uno' && !nadie}
        deshabilitada={!m.esAdmin}
        derecha={m.modo === 'cada_uno' && !nadie ? <Marca /> : undefined}
        datos="modo-cada-uno"
        onClick={m.esAdmin ? () => aplicar('cada_uno') : undefined}
      />
      {!m.esAdmin && (
        <span data-solo-admin-modo style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
          Solo la cambia el administrador.
        </span>
      )}
    </HojaOpciones>
  )
}

function Marca() {
  return (
    <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1C2230' }}>
      <Trazo d="M5 12.5l4.5 4.5L19 7" color="#F3D88F" size={14} grosor={3} />
    </span>
  )
}

/** La hoja para ponerle nombre a la cuenta conjunta (Design 03). */
function HojaNombre() {
  const m = useModoCuentas()
  const cerrar = useModoCuentasUi((s) => s.cerrarNombre)
  const [texto, setTexto] = useState(m.nombrePuesto)
  return (
    <Hoja etiqueta="Cuenta conjunta" titulo="Nombre de la cuenta" onCerrar={cerrar} z={100} datos="nombre-cuenta">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={40}
        autoFocus
        placeholder="Nuestro viaje"
        aria-label="Nombre de la cuenta"
        data-campo-nombre-cuenta
        className="h-[62px] w-full rounded-[18px] bg-[#FFFDF8] px-[18px] text-[19px] font-medium outline-none"
        style={{ border: '1.5px solid #B58A2E' }}
      />
      <button
        type="button"
        data-guardar-nombre-cuenta
        onClick={() => {
          setNombreCuentaConjunta(texto)
          cerrar()
        }}
        className="h-14 w-full rounded-[18px] text-[16px] font-bold"
        style={botonChampan()}
      >
        Guardar
      </button>
    </Hoja>
  )
}

/** Siempre montado: las hojas y la confirmación (con gastos apuntados, antes de cambiar de forma). */
export function ModoCuentasHost() {
  const eligiendo = useModoCuentasUi((s) => s.eligiendo)
  const renombrando = useModoCuentasUi((s) => s.renombrando)
  const cerrarEleccion = useModoCuentasUi((s) => s.cerrarEleccion)
  const [pidiendo, setPidiendo] = useState<Exclude<ModoCuentas, 'solo'> | null>(null)
  pedirConfirmacion = setPidiendo
  return (
    <>
      {eligiendo && <HojaModo />}
      {renombrando && <HojaNombre />}
      {pidiendo && (
        <ConfirmDialog
          eyebrow="Cuentas del viaje"
          text={CONFIRMACION[pidiendo].texto}
          detail={CONFIRMACION[pidiendo].detalle}
          confirmLabel="Cambiar"
          cancelLabel="Mejor no"
          alto
          peligro={CONFIRMACION[pidiendo].peligro}
          onCancel={() => setPidiendo(null)}
          onConfirm={() => {
            setModoCuentas(pidiendo)
            setPidiendo(null)
            cerrarEleccion()
          }}
        />
      )}
    </>
  )
}
