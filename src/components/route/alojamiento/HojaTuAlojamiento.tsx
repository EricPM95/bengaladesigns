import { useState } from 'react'
import { HojaAbajo } from '../reservas/HojaAbajo'
import { EliminarTexto } from '../reservas/BloqueReservas'
import { precioDeAlojamiento, type TuAlojamiento } from '../../../lib/tuAlojamiento'
import { ESTILO_PREGUNTA } from '../../ui/PersonasCuadradas'
import { Icono } from '../../ui/Icono'
import { useDineroDeReserva } from '../reservas/DineroDeReserva'
import type { Importe } from '../../../lib/dinero'
import { usePasePintable } from '../../../lib/pago'
import { abrirAvisoPase } from '../../../lib/avisoPase'
import { CandadoRedondo, LineaDelPase } from '../../pase/Candado'
import { BotonComoLlegarAlojamiento } from './BotonComoLlegarAlojamiento'

export interface ZonaParaElegir {
  id: string
  nombre: string
  sub?: string
}

/** Lo que devuelve [Guardar el alojamiento] además del hotel: la zona elegida, la dirección (con pase) y el dinero (para quién, quién pagó). */
export interface DatosDelAlojamiento {
  zona: string | null
  /** La dirección del hotel (solo con pase; null = sin tocar / vacía). */
  direccion: string | null
  para: string[]
  pagado: string[] | null
  solo: boolean
  todos: string[]
  precio: Importe | null
}

const ETIQUETA = { font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const, color: 'rgba(28,34,48,.55)' }

/**
 * LA HOJA «TU ALOJAMIENTO» (Tanda 10N11 §2; `Piezas/Vuelo Reservas` 08, 08o, 08p, 08q), en este orden:
 *   1. «Nombre del hotel» y [Buscar alojamiento].
 *   2. La zona y la dirección. SIN PASE: un bloque pequeño en gris con el candado (¿Dónde te alojas? / Dirección del hotel; al tocarlo, el aviso del pase) y la línea del pase.
 *      CON PASE, la primera vez: la lista de zonas a la vista. Con la zona ya elegida: desplegable cerrado («TU ZONA · Prati» con ✓); al tocarlo se abren las demás. Debajo, «Dirección» y [Cómo llegar a tu alojamiento].
 *   3. «¿Para quién es el alojamiento?», «¿Cuánto ha costado en total?», «¿Quién lo ha pagado?» (todos marcados), la línea de a dónde va el dinero y [Guardar el alojamiento].
 */
export function HojaTuAlojamiento({
  actual,
  zonas = [],
  zonaActual = null,
  direccionActual = null,
  para = null,
  pagado = null,
  onGuardar,
  onEliminar,
  onBuscar,
  onClose,
  textoGuardar = 'Guardar el alojamiento',
}: {
  ciudad?: string
  noches?: number
  actual: TuAlojamiento | null
  zonas?: ZonaParaElegir[]
  zonaActual?: string | null
  direccionActual?: string | null
  para?: readonly string[] | null
  pagado?: readonly string[] | null
  onGuardar: (hotel: TuAlojamiento | null, datos: DatosDelAlojamiento) => void
  onEliminar: () => void
  /** [Buscar alojamiento]: el mapa. */
  onBuscar?: () => void
  onClose: () => void
  textoGuardar?: string
}) {
  const estadoPase = usePasePintable()
  const conPase = estadoPase === 'con'
  const sinPase = estadoPase === 'sin'
  const conZonas = zonas.length > 0
  const [nombre, setNombre] = useState(actual?.name ?? '')
  const [zona, setZona] = useState<string | null>(zonaActual)
  const [direccion, setDireccion] = useState(direccionActual ?? '')
  const zonaElegidaReal = Boolean(zona) && zona !== 'nose' && zonas.some((z) => z.id === zona)
  const [desplegada, setDesplegada] = useState(false)
  const dinero = useDineroDeReserva({ para, pagado, precio: precioDeAlojamiento(actual), marcarTodos: true, pagadoTodos: true })
  const nombreLimpio = nombre.trim()
  const direccionLimpia = direccion.trim()
  const puede = Boolean(nombreLimpio) || (conPase && conZonas && Boolean(zona))
  const todos = zonas.some((z) => z.id === 'nose') ? zonas : [...zonas, { id: 'nose', nombre: 'Aún no lo sé', sub: 'Lo elegiré más tarde' }]
  const elegida = todos.find((z) => z.id === zona) ?? null
  const guardar = () => {
    if (!puede) return
    const hotel = nombreLimpio ? { name: nombreLimpio, precio: dinero.precio.importe } : null
    const total = dinero.precio.importe
    onGuardar(hotel, {
      // Sin pase no se toca ni la zona ni la dirección (se conservan las que hubiera).
      zona: conPase ? zona : zonaActual,
      direccion: conPase ? (direccionLimpia || null) : direccionActual,
      para: dinero.paraIds,
      pagado: dinero.paraIds.length > 1 && total ? dinero.pagadoIds : null,
      solo: dinero.solo,
      todos: dinero.gente.map((p) => p.id),
      precio: total,
    })
  }

  const tarjetaZona = (z: ZonaParaElegir, onElegir: () => void) => {
    const activa = zona === z.id
    return (
      <button
        key={z.id}
        type="button"
        aria-pressed={activa}
        data-zona-opcion={z.id}
        onClick={onElegir}
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
      <label className="mt-5 flex flex-col gap-1.5 rounded-[16px] border border-text/15 bg-white px-3.5 py-2.5">
        <span style={ETIQUETA}>Nombre del hotel</span>
        <input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={80} placeholder="Escribe el nombre" autoComplete="off" data-alojamiento-nombre className="w-full bg-transparent text-[15px] text-text outline-none placeholder:text-text/35" />
      </label>
      {onBuscar && (
        <button type="button" onClick={onBuscar} data-alojamiento-buscar className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-transparent text-[14.5px] font-semibold transition-transform active:scale-[.98]" style={{ border: '1.5px solid #B58A2E', color: '#6F4E37' }}>
          <Icono nombre="lupa" size={15} />
          Buscar alojamiento
        </button>
      )}

      {sinPase && (
        <div className="mt-5" data-alojamiento-sin-pase>
          <div
            role="button"
            tabIndex={0}
            onClick={() => abrirAvisoPase('alojamiento')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                abrirAvisoPase('alojamiento')
              }
            }}
            data-alojamiento-bloque-pase
            className="relative flex cursor-pointer flex-col gap-2.5 rounded-[18px] px-3.5 py-3"
            style={{ background: 'rgba(181,138,46,.07)', border: '1px dashed rgba(181,138,46,.5)' }}
          >
            <CandadoRedondo tamano="medio" esquina datos="alojamiento-zona" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[14.5px] font-bold text-text/70">¿Dónde te alojas?</span>
              <span className="text-[13px] text-text/45">Elige tu zona</span>
            </span>
            <span className="flex flex-col gap-0.5" style={{ borderTop: '1px solid rgba(28,34,48,.08)', paddingTop: 8 }}>
              <span style={ETIQUETA}>Dirección del hotel</span>
              <span className="text-[13px] text-text/45">Escribe la dirección</span>
            </span>
            <LineaDelPase clave="alojamiento" datos="alojamiento-hoja" texto="Con el {pase}, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés." />
          </div>
        </div>
      )}

      {conPase && (
        <div className="mt-5 flex flex-col gap-3" data-alojamiento-con-pase>
          {conZonas && (
            <div className="flex flex-col gap-2.5" data-zonas-alojamiento>
              <span style={ESTILO_PREGUNTA}>¿En qué zona te alojas?</span>
              {zonaElegidaReal && elegida ? (
                <>
                  {!desplegada ? (
                    <button
                      type="button"
                      aria-expanded={false}
                      data-zona-desplegable
                      onClick={() => setDesplegada(true)}
                      className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] px-3 py-2 text-left"
                      style={{ background: '#1C2230', color: '#FBF3E2', border: '1px solid #1C2230' }}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: '#F3D88F' }}>Tu zona</span>
                        <span className="text-[15px] font-bold leading-tight">{elegida.nombre}</span>
                      </span>
                      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full" style={{ background: '#E9C77A', color: '#1C2230' }}>
                        <Icono nombre="hecho" size={13} grosor={3} />
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2.5" data-zonas-abiertas>
                      {todos.map((z) =>
                        tarjetaZona(z, () => {
                          setZona(z.id)
                          setDesplegada(false)
                        }),
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2.5" data-zonas-lista>
                  {todos.map((z) => tarjetaZona(z, () => setZona(z.id)))}
                </div>
              )}
            </div>
          )}
          <label className="flex flex-col gap-1.5 rounded-[16px] border border-text/15 bg-white px-3.5 py-2.5">
            <span style={ETIQUETA}>Dirección</span>
            <input value={direccion} onChange={(event) => setDireccion(event.target.value)} maxLength={160} placeholder="Escribe la dirección" autoComplete="street-address" data-alojamiento-direccion className="w-full bg-transparent text-[15px] text-text outline-none placeholder:text-text/35" />
          </label>
          {direccionLimpia && <BotonComoLlegarAlojamiento direccion={direccionLimpia} />}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-5" data-alojamiento-dinero>
        {dinero.bloque('alojamiento')}
      </div>
    </HojaAbajo>
  )
}
