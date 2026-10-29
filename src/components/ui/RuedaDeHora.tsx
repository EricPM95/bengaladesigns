import { useEffect, useLayoutEffect, useRef } from 'react'

const ITEM_H = 30
const VISIBLE = 5

const dos = (n: number) => String(n).padStart(2, '0')
const HORAS = Array.from({ length: 24 }, (_, i) => dos(i))
const MINUTOS = Array.from({ length: 12 }, (_, i) => dos(i * 5))

/** Una columna de la rueda: se desliza con el dedo, con la rueda del ratón y con las flechas; la elegida va grande y negra, las de al lado más pequeñas y pálidas (como en Design). */
function Columna({ items, value, onChange, label }: { items: string[]; value: string; onChange: (valor: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const index = Math.max(0, items.indexOf(value))
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ITEM_H
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const el = ref.current
    if (el && Math.abs(el.scrollTop - index * ITEM_H) > 1) el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' })
  }, [index])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const asentar = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const siguiente = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)))
      if (items[siguiente] !== value) onChange(items[siguiente])
    }, 90)
  }
  const pad = ITEM_H * ((VISIBLE - 1) / 2)
  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      data-rueda-columna={label}
      tabIndex={0}
      onScroll={asentar}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          onChange(items[Math.min(items.length - 1, index + 1)])
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          onChange(items[Math.max(0, index - 1)])
        }
      }}
      className="relative h-full w-[70px] snap-y snap-mandatory overflow-y-auto overscroll-contain text-center outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingTop: pad, paddingBottom: pad, WebkitMaskImage: 'linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent)', maskImage: 'linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent)' }}
    >
      {items.map((item, i) => {
        const lejos = Math.abs(i - index)
        return (
          <div
            key={item}
            role="option"
            aria-selected={i === index}
            onClick={() => onChange(item)}
            className="flex cursor-pointer snap-center items-center justify-center font-display transition-all"
            style={{ height: ITEM_H, fontSize: i === index ? 32 : 22, lineHeight: 1, color: `rgba(28,34,48,${lejos === 0 ? 1 : lejos === 1 ? 0.4 : 0.18})` }}
          >
            {item}
          </div>
        )
      })}
    </div>
  )
}

/**
 * La rueda de la hora de dos columnas, hora : minutos (los minutos de 5 en 5), de la hoja del vuelo (Tanda 10N9; `Piezas/Reservas Cada Uno` 02). `value` y `onChange` son «HH:MM».
 */
export function RuedaDeHora({ value, onChange, label = 'Hora' }: { value: string; onChange: (valor: string) => void; label?: string }) {
  const [h, m] = /^\d{1,2}:\d{2}$/.test(value) ? value.split(':') : ['11', '15']
  const hora = dos(Math.min(23, Number(h)))
  const minuto = dos(Math.min(55, Math.round(Number(m) / 5) * 5))
  return (
    <div className="relative flex items-center justify-center gap-2.5 overflow-hidden rounded-[20px] border border-text/10 bg-[#FFFDF8]" style={{ height: ITEM_H * VISIBLE }} data-rueda-de-hora role="group" aria-label={label}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-3.5 rounded-xl border border-[rgba(181,138,46,.45)] bg-[rgba(233,199,122,.22)]" style={{ top: (ITEM_H * VISIBLE - 40) / 2, height: 40 }} />
      <Columna items={HORAS} value={hora} onChange={(x) => onChange(`${x}:${minuto}`)} label="Horas" />
      <span aria-hidden="true" className="relative font-display text-[30px] leading-none">
        :
      </span>
      <Columna items={MINUTOS} value={minuto} onChange={(x) => onChange(`${hora}:${x}`)} label="Minutos" />
    </div>
  )
}
