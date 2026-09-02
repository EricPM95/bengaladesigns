import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Place } from '../../lib/types'
import { PlaceAutocomplete } from '../ui/PlaceAutocomplete'

interface DestinationInputProps {
  onSubmit: (place: Place) => void
}

export function DestinationInput({ onSubmit }: DestinationInputProps) {
  const [value, setValue] = useState('')
  const [place, setPlace] = useState<Place | null>(null)

  const submit = () => {
    if (place) onSubmit(place)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="flex w-full items-center gap-3 rounded-full border-2 border-border bg-white p-2 pl-5 shadow-sm transition-colors focus-within:border-accent"
    >
      <span className="pl-0.5 text-text-muted">🔍</span>
      <div className="flex-1">
        <PlaceAutocomplete
          value={value}
          onChange={(text) => {
            setValue(text)
            setPlace(null)
          }}
          onSelect={(selected) => {
            setValue(selected.fullName)
            setPlace(selected)
          }}
          placeholder="¿A dónde quieres viajar?"
          autoFocus
          inputClassName="w-full bg-transparent py-1.5 font-display text-lg text-text placeholder:text-text-muted focus:outline-none sm:text-xl"
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!place}
        className="shrink-0 rounded-full bg-accent px-4 py-3 text-small font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-body"
      >
        Crear mi ruta →
      </button>
    </motion.div>
  )
}
