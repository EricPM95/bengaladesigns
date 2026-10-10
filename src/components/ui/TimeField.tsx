import { useEffect, useMemo, useRef, useState } from 'react'
import { FIELD_BUTTON_CLASS, PickerSheet } from './PickerSheet'
import { Icono } from './Icono'

const ITEM_H = 44
const VISIBLE = 5
const pad = (n: number) => String(n).padStart(2, '0')
const toMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
const toText = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const validTime = (text: string) => /^\d{1,2}:\d{2}$/.test(text)

/** Una rueda que se desliza (con el dedo, con la rueda del ratón y con las flechas), con su elemento central resaltado. */
function Wheel({ label, items, index, onIndex }: { label: string; items: string[]; index: number; onIndex: (index: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  // Lleva la rueda a su elemento cuando cambia desde fuera (flechas, las horas sugeridas, otra lista de minutos).
  useEffect(() => {
    const el = ref.current
    if (el && Math.abs(el.scrollTop - index * ITEM_H) > 1) el.scrollTo({ top: index * ITEM_H, behavior: el.dataset.ready ? 'smooth' : 'auto' })
    if (el) el.dataset.ready = '1'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length, items[0], items[items.length - 1]])
  const settle = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)))
      if (next !== index) onIndex(next)
    }, 90)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={settle}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          onIndex(Math.min(items.length - 1, index + 1))
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          onIndex(Math.max(0, index - 1))
        }
      }}
      className="relative z-[1] h-full flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain text-center outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingTop: ITEM_H * ((VISIBLE - 1) / 2), paddingBottom: ITEM_H * ((VISIBLE - 1) / 2) }}
    >
      {items.map((item, i) => (
        <div
          key={item}
          role="option"
          aria-selected={i === index}
          onClick={() => onIndex(i)}
          className={`flex snap-center items-center justify-center font-display text-[26px] transition-colors ${i === index ? 'text-text' : 'text-text/35'}`}
          style={{ height: ITEM_H }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}

/**
 * El selector de hora de toda la app (Tanda 6k, punto 8): un botón que abre una hoja desde abajo con dos ruedas (horas y minutos, de 5 en 5) como el reloj del iPhone; o, cuando las
 * horas posibles son pocas (`options`: el Free Tour), esas horas como botones. `min` y `max` limitan las horas (el Coliseo, los Museos y la Galería: de la apertura a la última
 * entrada). Sustituye al campo de hora del sistema.
 */
export function TimeField({
  value,
  onChange,
  title = 'Elige la hora',
  min,
  max,
  step = 5,
  options,
  placeholder = 'Elige la hora',
  className = FIELD_BUTTON_CLASS,
  ariaLabel,
}: {
  value: string
  onChange: (hhmm: string) => void
  title?: string
  min?: string
  max?: string
  step?: number
  options?: string[]
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const shown = value && validTime(value) ? toText(toMin(value)) : ''
  return (
    <>
      <button type="button" aria-label={ariaLabel ?? title} className={className} onClick={() => setOpen(true)}>
        <span className={shown ? '' : 'text-text-muted'}>{shown || placeholder}</span>
        <Icono nombre="reloj" className="h-4 w-4 shrink-0 text-text-soft" />
      </button>
      {open &&
        (options && options.length > 0 ? (
          <OptionsSheet title={title} options={options} value={shown} onPick={(hhmm) => { onChange(hhmm); close() }} onClose={close} />
        ) : (
          <WheelSheet title={title} value={shown} min={min} max={max} step={step} onDone={(hhmm) => { onChange(hhmm); close() }} onClose={close} />
        ))}
    </>
  )
}

function OptionsSheet({ title, options, value, onPick, onClose }: { title: string; options: string[]; value: string; onPick: (hhmm: string) => void; onClose: () => void }) {
  return (
    <PickerSheet title={title} onClose={onClose} onDone={onClose} doneLabel="Cerrar">
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const text = toText(toMin(option))
          return (
            <button key={option} type="button" onClick={() => onPick(text)} className={`h-12 rounded-2xl border text-[16px] font-medium ${text === value ? 'border-text bg-text text-bg' : 'border-text/15 bg-bg text-text hover:bg-bg-hover'}`}>
              {text}
            </button>
          )
        })}
      </div>
    </PickerSheet>
  )
}

function WheelSheet({ title, value, min, max, step, onDone, onClose }: { title: string; value: string; min?: string; max?: string; step: number; onDone: (hhmm: string) => void; onClose: () => void }) {
  const minMin = min && validTime(min) ? toMin(min) : 0
  const maxMin = max && validTime(max) ? toMin(max) : 23 * 60 + 55
  // Las horas y, para cada hora, los minutos que se pueden elegir (de 5 en 5 y dentro de lo permitido).
  const hours = useMemo(() => {
    const out: number[] = []
    for (let h = Math.floor(minMin / 60); h <= Math.floor(maxMin / 60); h++) out.push(h)
    return out
  }, [minMin, maxMin])
  const minutesFor = (h: number) => {
    const out: number[] = []
    for (let m = 0; m < 60; m += step) if (h * 60 + m >= minMin && h * 60 + m <= maxMin) out.push(m)
    return out.length > 0 ? out : [0]
  }
  const start = (() => {
    const wanted = value ? toMin(value) : minMin > 0 ? minMin : 9 * 60
    return Math.max(minMin, Math.min(maxMin, wanted))
  })()
  const [hour, setHour] = useState(Math.floor(start / 60))
  const [minute, setMinute] = useState(start % 60)
  const minutes = minutesFor(hour)
  const safeMinute = minutes.includes(minute) ? minute : (minutes.reduce((nearest, m) => (Math.abs(m - minute) < Math.abs(nearest - minute) ? m : nearest), minutes[0]))
  return (
    <PickerSheet title={title} onClose={onClose} onDone={() => onDone(toText(hour * 60 + safeMinute))}>
      <div className="relative mx-auto flex w-full max-w-[260px] items-stretch justify-center" style={{ height: ITEM_H * VISIBLE }}>
        {/* El centro resaltado: lo que se elige. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 z-0 rounded-2xl bg-bg-hover" style={{ top: ITEM_H * ((VISIBLE - 1) / 2), height: ITEM_H }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-1/3 bg-gradient-to-b from-bg-card to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-1/3 bg-gradient-to-t from-bg-card to-transparent" />
        <Wheel label="Horas" items={hours.map(pad)} index={Math.max(0, hours.indexOf(hour))} onIndex={(i) => setHour(hours[i])} />
        <div aria-hidden="true" className="relative z-[1] flex items-center font-display text-[26px] text-text/60">:</div>
        <Wheel label="Minutos" items={minutes.map(pad)} index={Math.max(0, minutes.indexOf(safeMinute))} onIndex={(i) => setMinute(minutes[i])} />
      </div>
    </PickerSheet>
  )
}
