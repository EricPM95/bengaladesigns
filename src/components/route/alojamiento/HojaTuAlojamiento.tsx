import { useState } from 'react'
import { HojaAbajo } from '../reservas/HojaAbajo'
import { EliminarTexto } from '../reservas/BloqueReservas'
import { precioDeAlojamiento, type TuAlojamiento } from '../../../lib/tuAlojamiento'
import { ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { Icono } from '../../ui/Icono'
import { useDineroDeReserva } from '../reservas/DineroDeReserva'
import type { Importe } from '../../../lib/dinero'

export interface ZonaParaElegir {
  id: string
  nombre: string
  sub?: string
}

/** Lo que devuelve [Guardar el alojamiento] además del hotel: la zona elegida y el dinero (para quién, quién pagó). */
export interface DatosDelAlojamiento {
  zona: string | null
  para: string[]
  pagado: string[] | null
  solo: boolean
  todos: string[]
  precio: Importe | null
}

const ETIQUETA = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(28,34,48,.55)' }

/**
 * LA HOJA «TU ALOJAMIENTO» (Tanda 10N10 §7c; `Piezas/Vuelo Reservas` 08 y 08b): con las zonas del destino, elegir la zona a todo el ancho (cada una una tarjeta con su frase, la elegida en azul oscuro con ✓ dorado, «Aún no lo sé» incluida),
 * el nombre (opcional si hay zonas: «Hotel o dirección»), «¿Para quién es el alojamiento?», «¿Cuánto ha costado en total?», «¿Quién lo ha pagado?», la línea de a dónde va el dinero y UN botón «Guardar el alojamiento».
 * Sin zonas (destino sin ellas, o la hoja del invitado) el nombre es obligatorio, como siempre.
 */
export function HojaTuAlojamiento({
  actual,
  zonas = [],
  zonaActual = null,
  para = null,
  pagado = null,
  onGuardar,
  onEliminar,
  onClose,
  textoGuardar = 'Guardar el alojamiento',
}: {
  ciudad?: string
  noches?: number
  actual: TuAlojamiento | null
  zonas?: ZonaParaElegir[]
  zonaActual?: string | null
  para?: readonly string[] | null
  pagado?: readonly string[] | null
  onGuardar: (hotel: TuAlojamiento | null, datos: DatosDelAlojamiento) => void
  onEliminar: () => void
  onClose: () => void
  textoGuardar?: string
}) {
  const conZonas = zonas.length > 0
  const [nombre, setNombre] = useState(actual?.name ?? '')
  const [zona, setZona] = useState<string | null>(zonaActual)
  const dinero = useDineroDeReserva({ para, pagado, precio: precioDeAlojamiento(actual) })
  const nombreLimpio = nombre.trim()
  const puede = conZonas ? Boolean(zona) || Boolean(nombreLimpio) : Boolean(nombreLimpio)
  const todos = zonas.some((z) => z.id === 'nose') ? zonas : [...zonas, { id: 'nose', nombre: 'Aún no lo sé', sub: 'Lo elegirás más tarde' }]
  const guardar = () => {
    if (!puede) return
    const hotel = nombreLimpio ? { name: nombreLimpio, precio: dinero.precio.importe } : null
    const total = dinero.precio.importe
    onGuardar(hotel, { zona, para: dinero.paraIds, pagado: dinero.paraIds.length > 1 && total ? dinero.pagadoIds : null, solo: dinero.solo, todos: dinero.gente.map((p) => p.id), precio: total })
  }
  return (
    <HojaAbajo
      titleId="hoja-tu-alojamiento"
      onClose={onClose}
      capa={110}
      pie={
        <>
          <button type="button" onClick={guardar} disabled={!puede} data-guardar-alojamiento className="h-[54px] w-full rounded-full btn-champan text-[16px] font-bold transition-transform active:scale-[.98] disabled:opacity-40">
            {textoGuardar}
          </button>
          {actual && (
            <div className="mt-1 flex justify-center">
              <EliminarTexto texto="Eliminar" onClick={onEliminar} />
            </div>
          )}
        </>
      }
    >
      <h2 id="hoja-tu-alojamiento" className="max-w-[calc(100%-3rem)] font-display text-[30px] leading-none text-text">
        Tu alojamiento
      </h2>
      {conZonas && (
        <div className="mt-5 flex flex-col gap-2.5" data-zonas-alojamiento>
          <span style={ESTILO_PREGUNTA}>¿En qué zona te alojas?</span>
          {todos.map((z) => {
            const activa = zona === z.id
            return (
              <button
                key={z.id}
                type="button"
                aria-pressed={activa}
                data-zona-opcion={z.id}
                onClick={() => setZona(z.id)}
                className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left transition-colors"
                style={activa ? { background: '#1C2230', color: '#FBF3E2', border: '1px solid #1C2230' } : { background: '#FFFDF8', color: '#1C2230', border: '1px solid rgba(28,34,48,.12)' }}
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px]" style={{ background: activa ? 'rgba(243,216,143,.16)' : '#F5E3AE', color: activa ? '#F3D88F' : '#6F4E37' }}>
                  <Icono nombre={z.id === 'nose' ? 'info' : 'ubicacion'} size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[14.5px] font-bold leading-tight">{z.nombre}</span>
                  {z.sub && (
                    <span className="text-[12px] leading-tight" style={{ color: activa ? 'rgba(251,243,226,.75)' : 'rgba(28,34,48,.55)' }}>
                      {z.sub}
                    </span>
                  )}
                </span>
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full" style={activa ? { background: '#E9C77A', color: '#1C2230' } : { border: '1.5px solid rgba(28,34,48,.25)' }}>
                  {activa && <Icono nombre="hecho" size={13} grosor={3} />}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <label className="mt-4 flex flex-col gap-1.5 rounded-[16px] border border-text/15 bg-white px-3.5 py-2.5">
        <span style={ETIQUETA}>{conZonas ? 'Nombre · opcional' : 'Nombre'}</span>
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={80} placeholder={conZonas ? 'Hotel o dirección' : 'Hotel Artemide'} autoComplete="off" data-alojamiento-nombre className="w-full bg-transparent text-[15px] text-text outline-none placeholder:text-text/35" />
      </label>
      <div className="mt-6 flex flex-col gap-5" data-alojamiento-dinero>
        {dinero.bloque('alojamiento')}
      </div>
    </HojaAbajo>
  )
}
