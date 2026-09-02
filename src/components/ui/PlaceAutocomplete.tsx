import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Place } from '../../lib/types'
import { searchPlaces } from '../../lib/mapboxGeocoding'
import { FlagIcon } from './FlagIcon'

interface PlaceAutocompleteProps {
  value: string
  onChange: (text: string) => void
  onSelect: (place: Place) => void
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  wrapperClassName?: string
  inputClassName?: string
}

const DEBOUNCE_MS = 250

const DEFAULT_INPUT_CLASS =
  'flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-body text-text placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-60'

export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  autoFocus,
  disabled,
  wrapperClassName = '',
  inputClassName = DEFAULT_INPUT_CLASS,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Al seleccionar, escribimos el nombre completo en `value` — eso no debe volver a disparar una búsqueda.
  const suppressNextSearchRef = useRef(false)

  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false
      return
    }

    const trimmed = value.trim()
    if (!trimmed) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      searchPlaces(trimmed, controller.signal)
        .then((places) => {
          setSuggestions(places)
          setHighlightedIndex(0)
          setOpen(places.length > 0)
        })
        .catch(() => {
          // Búsqueda cancelada o fallida — se ignora, el usuario puede seguir escribiendo.
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectPlace = (place: Place) => {
    suppressNextSearchRef.current = true
    onSelect(place)
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => (index - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectPlace(suggestions[highlightedIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName}`}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        className={inputClassName}
      />

      {open && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {suggestions.map((place, index) => (
            <li key={`${place.name}-${place.coordinates.lat}-${place.coordinates.lng}`}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectPlace(place)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                  index === highlightedIndex ? 'bg-emerald-50 text-emerald-900' : 'text-gray-800'
                }`}
              >
                <FlagIcon countryCode={place.countryCode} />
                <span className="truncate">{place.fullName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
