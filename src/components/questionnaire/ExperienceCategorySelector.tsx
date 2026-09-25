import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { DateRange, ExperienceCategoryId, Season } from '../../lib/types'
import { EXPERIENCE_CATEGORY_BANK, MAX_POSITIVE_CATEGORIES, isCategoryVisible } from '../../lib/experienceCategoryBank'
import { fetchSeasonalWindows, seasonStatus, type SeasonalWindow } from '../../lib/seasonalAvailability'

interface ExperienceCategorySelectorProps {
  season: Season | undefined
  /** Fecha de inicio del viaje, si el viajero la fijó — decide si se enseña la tarjeta de invierno. */
  tripStartIso?: string | null
  selected: ExperienceCategoryId[]
  onChange: (selected: ExperienceCategoryId[]) => void
  onConfirm: () => void
  /** Estaciones, Parte 4: destino, mes y fechas para las experiencias de temporada. */
  destination?: string
  month?: number
  dateRange?: DateRange
  /** Las de mes frontera a las que el viajero dijo "Sí, viajo en esas fechas". */
  seasonalConfirmed?: ExperienceCategoryId[]
  onSeasonalConfirmedChange?: (confirmed: ExperienceCategoryId[]) => void
}

/**
 * "Elige tus 3 experiencias favoritas".
 *
 * Antes esta pantalla pedía clasificar seis categorías en tres zonas: me interesa, no me lo
 * recomiendes y sin decidir. Ahora solo pide elegir tres de cinco (seis en invierno). El motivo no
 * es estético: preguntar qué NO quieres es pedirle al viajero que trabaje para el algoritmo. Nadie
 * abre una app de viajes con ganas de descartar cosas, y una pantalla con tres zonas y dos límites
 * distintos se lee como un formulario. Tres toques y a la siguiente.
 *
 * Los negativos desaparecen del todo: lo que no eliges simplemente no recibe preferencia, que es
 * suficiente. Y "Imprescindibles" deja de ser un interruptor con truco —el nivel 1 entra siempre,
 * ver assignTiers en server/engine/preplan.js— y pasa a ser una tarjeta más: quien la elige está
 * diciendo "dame lo esencial", no activando nada que no estuviera ya.
 */
export function ExperienceCategorySelector({
  season,
  tripStartIso,
  selected,
  onChange,
  onConfirm,
  destination,
  month,
  dateRange,
  seasonalConfirmed = [],
  onSeasonalConfirmedChange,
}: ExperienceCategorySelectorProps) {
  const winter = isWinterTrip(season, tripStartIso)
  // Ventanas de temporada del destino (Estaciones, Parte 4). Una experiencia con ventana: fuera del mes
  // (o de las fechas) no se ofrece; en mes frontera se pregunta si se viaja en esas fechas. Sin ventana,
  // manda la regla de siempre (winterOnly).
  const [windows, setWindows] = useState<Record<string, SeasonalWindow>>({})
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!destination) return
    let alive = true
    fetchSeasonalWindows(destination).then((result) => {
      if (alive) setWindows(result)
    })
    return () => {
      alive = false
    }
  }, [destination])
  const statusOf = (id: ExperienceCategoryId) => seasonStatus(windows[id], month, dateRange)
  const visibleCategories = EXPERIENCE_CATEGORY_BANK.filter((category) =>
    windows[category.id] ? statusOf(category.id) !== 'out' : isCategoryVisible(category, winter ? 'winter' : season),
  )
  // Si cambia el mes y una elegida queda fuera, deja de estar elegida.
  useEffect(() => {
    const outside = selected.filter((id) => windows[id] && statusOf(id) === 'out')
    if (outside.length > 0) onChange(selected.filter((id) => !outside.includes(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windows, month, dateRange?.start, dateRange?.end])
  // Elegidas en mes frontera que aún no tienen respuesta: hasta responder, no se continúa.
  const pendingBorder = selected.filter((id) => windows[id] && statusOf(id) === 'border' && !seasonalConfirmed.includes(id))
  const answerBorder = (id: ExperienceCategoryId, yes: boolean) => {
    const category = EXPERIENCE_CATEGORY_BANK.find((item) => item.id === id)
    if (yes) {
      onSeasonalConfirmedChange?.([...seasonalConfirmed, id])
      return
    }
    onChange(selected.filter((existing) => existing !== id))
    setNotice(`Hemos quitado ${category?.title ?? id}: en ${destination} solo están ${windows[id]?.label ?? "en otras fechas"}.`)
  }
  const complete = selected.length === MAX_POSITIVE_CATEGORIES

  const toggle = (id: ExperienceCategoryId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((existing) => existing !== id))
      return
    }
    // Al llegar a tres, la cuarta no entra sola: que el viajero suelte una primero deja claro que
    // son tres y no "las que quepan".
    if (selected.length >= MAX_POSITIVE_CATEGORIES) return
    onChange([...selected, id])
  }

  return (
    <div className="space-y-4">
      <p className="font-dmsans text-small text-onb-text-soft">
        Elige las <span className="font-semibold text-onb-text">3</span> que más te apetezcan. Lo esencial del destino entra en tu ruta de todas formas.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {visibleCategories.map((category) => {
          const isSelected = selected.includes(category.id)
          const order = selected.indexOf(category.id) + 1
          // Sin seleccionar y ya con tres: se apaga, pero sigue pulsable para que el viajero
          // descubra que tiene que soltar una — un botón muerto no explica nada.
          const dimmed = !isSelected && complete
          return (
            <motion.button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              aria-pressed={isSelected}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-start gap-1 rounded-onb-lg border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-onb-accent bg-onb-accent-light'
                  : `border-onb-border bg-onb-card hover:border-onb-accent/50 ${dimmed ? 'opacity-45' : ''}`
              }`}
            >
              {isSelected && (
                <motion.span
                  layout
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-onb-accent font-dmsans text-caption font-bold text-white"
                >
                  {order}
                </motion.span>
              )}
              <span className="text-h2 leading-none" aria-hidden="true">
                {category.icon}
              </span>
              <span className={`font-dmsans text-small font-semibold leading-tight ${isSelected ? 'text-onb-accent-hover' : 'text-onb-text'}`}>
                {category.title}
              </span>
              <span className="font-dmsans text-caption leading-tight text-onb-text-muted">{category.description}</span>
            </motion.button>
          )
        })}
      </div>

      {pendingBorder.map((id) => {
        const category = EXPERIENCE_CATEGORY_BANK.find((item) => item.id === id)
        const name = category?.seasonalName ?? `"${category?.title ?? id}"`
        return (
          <div key={id} className="rounded-onb-md border border-onb-accent/40 bg-onb-accent-light px-3 py-2.5 font-dmsans text-small text-onb-text">
            <p>
              En {destination}, {name} suelen estar {windows[id]?.label}. ¿Viajas en esas fechas?
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => answerBorder(id, true)} className="rounded-onb-full border border-onb-accent px-3 py-1 font-medium text-onb-accent-hover">
                Sí
              </button>
              <button type="button" onClick={() => answerBorder(id, false)} className="rounded-onb-full border border-onb-border px-3 py-1 font-medium text-onb-text">
                No
              </button>
            </div>
          </div>
        )
      })}
      {notice && <p className="font-dmsans text-caption text-onb-text-soft">{notice}</p>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={!complete || pendingBorder.length > 0}
        className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {complete ? 'Continuar →' : `Elige ${MAX_POSITIVE_CATEGORIES - selected.length} más`}
      </button>
    </div>
  )
}

/**
 * Si el viaje cae en invierno, para enseñar la tarjeta de mercadillos navideños.
 *
 * Con fechas exactas manda el mes de verdad (noviembre o diciembre): la estación declarada puede
 * decir "winter" en febrero, cuando ya no hay mercadillo que valga. Sin fechas se cae a la estación,
 * que es lo único que hay.
 */
function isWinterTrip(season: Season | undefined, tripStartIso?: string | null): boolean {
  if (tripStartIso) {
    const month = Number(tripStartIso.slice(5, 7))
    return month === 11 || month === 12
  }
  return season === 'winter'
}
