import { useMemo, useState } from 'react'
import { FIELD_BUTTON_CLASS } from './PickerSheet'
import { HojaDeHora } from './HojaDeHora'
import { Icono } from './Icono'

const pad = (n: number) => String(n).padStart(2, '0')
const toMin = (hhmm: string) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
const toText = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const validTime = (text: string) => /^\d{1,2}:\d{2}$/.test(text)

/**
 * El campo de hora de los formularios (el «Hora de entrada» / «Hora de recogida» de la reserva a mano). Desde la 10S9 es el mismo selector de TODA la app (`HojaDeHora`: la rueda desde abajo, en su hoja,
 * con ✓ y papelera, el ✓ guarda lo que se ve y tocar fuera guarda lo elegido). Vacío, el texto de ejemplo en gris (`placeholder`); la app nunca pone sola una hora.
 *   - `min` y `max` limitan las horas (el Coliseo, los Museos y la Galería: de la apertura a la última entrada): la rueda es entonces de una sola columna con esas horas, de `step` en `step` minutos.
 *   - `options`: solo esas horas (una columna).
 *   - `quitable`: con papelera para dejarla vacía (las horas opcionales, como «Hora de vuelta»).
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
  quitable = false,
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
  quitable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const shown = value && validTime(value) ? toText(toMin(value)) : ''
  const items = useMemo(() => {
    if (options && options.length > 0) return options.filter(validTime).map((o) => toText(toMin(o)))
    if (!(min && validTime(min)) && !(max && validTime(max))) return undefined
    const desde = min && validTime(min) ? toMin(min) : 0
    const hasta = max && validTime(max) ? toMin(max) : 23 * 60 + 55
    const out: string[] = []
    for (let m = Math.ceil(desde / step) * step; m <= hasta; m += step) out.push(toText(m))
    return out.length > 0 ? out : undefined
  }, [options, min, max, step])
  return (
    <>
      <button type="button" aria-label={ariaLabel ?? title} aria-haspopup="dialog" data-time-field data-vacia={shown ? '0' : '1'} className={className} onClick={() => setOpen(true)}>
        <span className={shown ? '' : 'text-text/35'}>{shown || placeholder}</span>
        <Icono nombre="reloj" className="h-4 w-4 shrink-0 text-text-soft" />
      </button>
      {open && (
        <HojaDeHora
          titulo={title}
          valor={shown || null}
          items={items}
          inicial={min && validTime(min) ? toText(toMin(min)) : '09:00'}
          quitable={quitable}
          onElegir={(h) => onChange(h ?? '')}
          onCerrar={() => setOpen(false)}
        />
      )}
    </>
  )
}
