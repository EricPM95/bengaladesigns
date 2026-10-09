import { useEffect, useLayoutEffect, useRef } from 'react'

const ITEM_H = 40
const VISIBLE = 5

/**
 * La rueda de una sola columna de la hoja de la hora de una entrada (Tanda 6m, diseño «Entrada Tarjeta»): una lista de horas («13:30», «14:00»…) que se desliza con el dedo,
 * con la rueda del ratón y con las flechas; la elegida va resaltada en blanco, en el centro. Las horas las pone quien la usa (las de verdad de cada sitio ese día).
 */
export function TimeListWheel({ items, value, onChange, label = 'Hora de la entrada', tipo = 'hora' }: { items: string[]; value: string; onChange: (value: string) => void; label?: string; /** `lista`: nombres (las zonas del alojamiento), con letra algo menor y en una línea. */ tipo?: 'hora' | 'lista' }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const index = Math.max(0, items.indexOf(value))
  // Al abrir, la rueda ya está en su hora (sin deslizar).
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ITEM_H
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Si la hora cambia desde fuera (flechas, otra lista), la rueda la sigue.
  useEffect(() => {
    const el = ref.current
    if (el && Math.abs(el.scrollTop - index * ITEM_H) > 1) el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' })
  }, [index, items.length, items[0], items[items.length - 1]]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const settle = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)))
      if (items[next] !== value) onChange(items[next])
    }, 90)
  }
  const pad = ITEM_H * ((VISIBLE - 1) / 2)
  return (
    <div className="relative rounded-[20px] bg-bg" style={{ height: ITEM_H * VISIBLE }}>
      {/* La hora elegida, en blanco, en el centro. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 rounded-xl bg-white shadow-[0_2px_8px_-3px_rgba(28,34,48,.2)]" style={{ top: pad, height: ITEM_H }} />
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={settle}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            onChange(items[Math.min(items.length - 1, index + 1)])
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            onChange(items[Math.max(0, index - 1)])
          }
        }}
        className="absolute inset-0 snap-y snap-mandatory overflow-y-auto overscroll-contain text-center outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: pad, paddingBottom: pad, WebkitMaskImage: 'linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent)', maskImage: 'linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent)' }}
      >
        {items.map((item, i) => (
          <div
            key={item}
            role="option"
            aria-selected={i === index}
            onClick={() => onChange(item)}
            className={`flex snap-center cursor-pointer items-center justify-center truncate px-4 font-display transition-all ${tipo === 'lista' ? (i === index ? 'text-[20px] text-text' : 'text-[16px] text-text/45') : i === index ? 'text-[26px] text-text' : 'text-[21px] text-text/45'}`}
            style={{ height: ITEM_H }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
