import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from './Icono'
import { RuedaDeHora } from './RuedaDeHora'
import { TimeListWheel } from './TimeListWheel'

/**
 * ELEGIR UNA HORA, SIEMPRE IGUAL EN TODA LA APP (Tanda 10S6, apartado 2; regla en `docs/REGLAS_DE_LA_APP.md`).
 *
 * `HojaDeHora` es la hoja que sube desde abajo, en su propia capa, con la rueda (como la del iPhone). Arriba a la derecha: una papelera para quitar la hora y un ✓ para guardarla.
 * Tocar fuera, o Escape, TAMBIÉN guarda la hora elegida (toques donde toques). Si la casilla estaba vacía y no se ha movido la rueda, tocar fuera la deja vacía.
 *   - `valor`: «HH:MM» o null (vacía). `onElegir(h)` recibe la hora, o null si se quita; la hoja se cierra sola después (`onCerrar`).
 *   - `items`: si se pasa, la rueda es de una sola columna con esas horas (las de verdad de cada sitio ese día); si no, la de dos columnas (horas y minutos, de 5 en 5).
 *   - `inicial`: la hora con la que se abre la rueda si `valor` está vacío.
 *
 * `CampoDeHora` es la casilla que la abre: la hora puesta, o, vacía, `ejemplo` en gris (sin raya) y el reloj a la derecha. Lo usan todas las hojas (vuelo, entradas, Free Tour, excursiones…).
 */
export function HojaDeHora({
  titulo,
  valor,
  items,
  inicial = '08:30',
  etiqueta,
  quitable = true,
  onElegir,
  onCerrar,
}: {
  titulo: string
  valor: string | null
  items?: string[]
  inicial?: string
  etiqueta?: string
  quitable?: boolean
  onElegir: (hora: string | null) => void
  onCerrar: () => void
}) {
  const valida = valor && /^\d{1,2}:\d{2}$/.test(valor) ? (valor.length === 4 ? `0${valor}` : valor) : null
  const arranque = valida ?? (items && items.length > 0 ? (items.includes(inicial) ? inicial : items[0]) : inicial)
  const [elegida, setElegida] = useState(arranque)
  const tocada = useRef(false)
  const elegidaRef = useRef(elegida)
  elegidaRef.current = elegida
  const cierre = useRef(false)
  const elegir = (h: string) => {
    tocada.current = true
    setElegida(h)
  }
  const guardar = () => {
    if (cierre.current) return
    cierre.current = true
    // Vacía y sin tocar la rueda: tocar fuera no inventa una hora.
    if (valida || tocada.current) onElegir(elegidaRef.current)
    onCerrar()
  }
  const quitar = () => {
    if (cierre.current) return
    cierre.current = true
    onElegir(null)
    onCerrar()
  }
  const guardarRef = useRef(guardar)
  guardarRef.current = guardar
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        guardarRef.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={titulo} data-hoja-de-hora>
      <div className="trazo-notice-backdrop absolute inset-0 bg-text/25 backdrop-blur-[6px]" onClick={guardar} data-hoja-de-hora-fondo />
      <div className="trazo-notice-panel relative flex w-full flex-col rounded-t-[28px] bg-bg-card pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_-12px_rgba(28,34,48,.35)] md:w-[400px] md:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-[42px] rounded-full bg-text/20" />
        </div>
        <div className="flex items-center justify-between gap-3 px-6 pt-3">
          <h2 className="min-w-0 flex-1 font-display text-[24px] leading-[1.15] text-text">{titulo}</h2>
          <div className="flex shrink-0 items-center gap-2">
            {quitable && (
              <button type="button" onClick={quitar} aria-label="Quitar la hora" data-hoja-de-hora-quitar className="zona-toque flex h-10 w-10 items-center justify-center rounded-full bg-[#F1EADC] text-text">
                <Icono nombre="papelera" size={18} />
              </button>
            )}
            <button type="button" onClick={guardar} aria-label="Guardar la hora" data-hoja-de-hora-guardar className="zona-toque flex h-10 w-10 items-center justify-center rounded-full bg-text text-[#F3D88F]">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-6 pt-4" data-hoja-de-hora-rueda>
          {items && items.length > 0 ? <TimeListWheel items={items} value={elegida} onChange={elegir} label={etiqueta ?? titulo} /> : <RuedaDeHora value={elegida} onChange={elegir} label={etiqueta ?? titulo} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** La casilla que abre la hoja de la hora. Con hora, la hora; vacía, el ejemplo en gris (sin raya) y el reloj a la derecha. */
export function CampoDeHora({
  valor,
  onChange,
  titulo,
  etiqueta,
  ejemplo = '08:30',
  items,
  quitable = true,
  className,
  datos,
}: {
  valor: string | null | undefined
  onChange: (hora: string | null) => void
  /** El título de la hoja y el nombre accesible de la casilla («Hora de entrada»). */
  titulo: string
  /** La etiqueta pequeña de encima de la casilla. Sin ella, no se pinta (la pone quien la usa). */
  etiqueta?: string
  ejemplo?: string
  items?: string[]
  quitable?: boolean
  className?: string
  datos?: string
}) {
  const [abierta, setAbierta] = useState(false)
  const hay = Boolean(valor && /^\d{1,2}:\d{2}$/.test(valor))
  const texto = hay ? (valor as string).padStart(5, '0') : ejemplo
  return (
    <>
      <button
        type="button"
        aria-label={titulo}
        aria-haspopup="dialog"
        onClick={() => setAbierta(true)}
        data-campo-de-hora={datos ?? ''}
        data-vacia={hay ? '0' : '1'}
        className={className ?? 'flex h-[60px] w-full items-center justify-between rounded-[16px] border border-text/15 bg-white px-3.5 text-left'}
      >
        <span className="flex min-w-0 flex-col gap-px">
          {etiqueta && <span className="text-text/50" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' }}>{etiqueta}</span>}
          <span className={`text-[17px] font-medium ${hay ? 'text-text' : 'text-text/35'}`} data-campo-de-hora-texto>
            {texto}
          </span>
        </span>
        <Icono nombre="reloj" size={18} style={{ color: 'rgba(28,34,48,.45)' }} />
      </button>
      {abierta && <HojaDeHora titulo={titulo} valor={hay ? (valor as string) : null} items={items} inicial={ejemplo} quitable={quitable} onElegir={onChange} onCerrar={() => setAbierta(false)} />}
    </>
  )
}
