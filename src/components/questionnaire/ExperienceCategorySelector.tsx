import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ExperienceCategoryId, Season } from '../../lib/types'
import { EXPERIENCE_CATEGORY_BANK, MAX_NEGATIVE_CATEGORIES, MAX_POSITIVE_CATEGORIES, isCategoryVisible } from '../../lib/experienceCategoryBank'

interface ExperienceCategorySelectorProps {
  season: Season | undefined
  positive: ExperienceCategoryId[]
  negative: ExperienceCategoryId[]
  onChange: (positive: ExperienceCategoryId[], negative: ExperienceCategoryId[]) => void
  onConfirm: () => void
}

/**
 * "Elige tus experiencias" v2 (punto 4 del prompt DEFINITIVO) — reemplaza el selector de 5 buckets
 * (ExperienceSelector.tsx, banco de 18) por 6 categorías fijas (7 en invierno) que el viajero
 * clasifica en 3 zonas: "Me interesa" (máx. 3), "No me lo recomiendes" (máx. 2) y sin decidir
 * (neutra, el resto). El prompt original pide "drag & drop" — aquí se resuelve con tap directo a
 * cada zona en vez de arrastrar de verdad: mismo resultado final (3 zonas, mismos límites), pero
 * fiable en móvil sin añadir una librería de drag-and-drop nueva solo para esta pantalla (el resto
 * de la app no usa ninguna). Las tarjetas usan `layout` de framer-motion para animarse al cambiar de
 * zona, así se siente como mover algo de sitio aunque el gesto sea un tap.
 */
export function ExperienceCategorySelector({ season, positive, negative, onChange, onConfirm }: ExperienceCategorySelectorProps) {
  const visibleCategories = EXPERIENCE_CATEGORY_BANK.filter((category) => isCategoryVisible(category, season))
  const neutral = visibleCategories.filter((category) => !positive.includes(category.id) && !negative.includes(category.id))

  const moveToPositive = (id: ExperienceCategoryId) => {
    if (positive.includes(id) || positive.length >= MAX_POSITIVE_CATEGORIES) return
    onChange([...positive, id], negative.filter((existing) => existing !== id))
  }
  const moveToNegative = (id: ExperienceCategoryId) => {
    const category = EXPERIENCE_CATEGORY_BANK.find((entry) => entry.id === id)
    if (category?.lockedPositive || negative.includes(id) || negative.length >= MAX_NEGATIVE_CATEGORIES) return
    onChange(positive.filter((existing) => existing !== id), [...negative, id])
  }
  const moveToNeutral = (id: ExperienceCategoryId) => {
    const category = EXPERIENCE_CATEGORY_BANK.find((entry) => entry.id === id)
    if (category?.lockedPositive) return
    onChange(positive.filter((existing) => existing !== id), negative.filter((existing) => existing !== id))
  }

  return (
    <div className="space-y-5">
      <ExperienceZone
        title="Me interesa"
        countLabel={`${positive.length}/${MAX_POSITIVE_CATEGORIES}`}
        emptyHint="Toca 👍 en una experiencia de abajo para priorizarla"
        accent
      >
        {positive.map((id) => {
          const category = EXPERIENCE_CATEGORY_BANK.find((entry) => entry.id === id)
          if (!category) return null
          return (
            <ExperienceCard key={id} category={category} onTap={category.lockedPositive ? undefined : () => moveToNeutral(id)} tone="positive" />
          )
        })}
      </ExperienceZone>

      <ExperienceZone
        title="No me lo recomiendes"
        countLabel={`${negative.length}/${MAX_NEGATIVE_CATEGORIES}`}
        emptyHint="Toca 👎 en una experiencia de abajo para evitarla"
      >
        {negative.map((id) => {
          const category = EXPERIENCE_CATEGORY_BANK.find((entry) => entry.id === id)
          if (!category) return null
          return <ExperienceCard key={id} category={category} onTap={() => moveToNeutral(id)} tone="negative" />
        })}
      </ExperienceZone>

      {neutral.length > 0 && (
        <ExperienceZone title="Sin decidir" countLabel={`${neutral.length}`}>
          {neutral.map((category) => (
            <ExperienceCard
              key={category.id}
              category={category}
              tone="neutral"
              actions={
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveToPositive(category.id)}
                    disabled={positive.length >= MAX_POSITIVE_CATEGORIES}
                    aria-label={`Me interesa ${category.title}`}
                    className="rounded-full border border-onb-border bg-onb-card px-2.5 py-1.5 text-small transition-colors hover:border-onb-accent/50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    onClick={() => moveToNegative(category.id)}
                    disabled={negative.length >= MAX_NEGATIVE_CATEGORIES}
                    aria-label={`No me recomiendes ${category.title}`}
                    className="rounded-full border border-onb-border bg-onb-card px-2.5 py-1.5 text-small transition-colors hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    👎
                  </button>
                </div>
              }
            />
          ))}
        </ExperienceZone>
      )}

      <button
        type="button"
        onClick={onConfirm}
        className="w-full rounded-onb-full bg-onb-accent py-3.5 font-dmsans text-body font-semibold text-white transition-colors hover:bg-onb-accent-hover"
      >
        Continuar →
      </button>
    </div>
  )
}

function ExperienceZone({
  title,
  countLabel,
  emptyHint,
  accent,
  children,
}: {
  title: string
  countLabel: string
  emptyHint?: string
  accent?: boolean
  children: React.ReactNode
}) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children)
  return (
    <div className={`rounded-onb-lg border p-3 ${accent ? 'border-onb-accent/40 bg-onb-accent-light/40' : 'border-onb-border bg-onb-card/60'}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-dmsans text-caption font-semibold uppercase tracking-wide text-onb-text-muted">{title}</p>
        <span className="font-dmsans text-caption text-onb-text-muted">{countLabel}</span>
      </div>
      {hasChildren ? (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">{children}</AnimatePresence>
        </div>
      ) : (
        emptyHint && <p className="font-dmsans text-small italic text-onb-text-soft">{emptyHint}</p>
      )}
    </div>
  )
}

/** forwardRef obligatorio — al ser un hijo directo de AnimatePresence (dentro de ExperienceZone), framer-motion le clona un ref para medir su tamaño en la animación de salida; sin forwardRef, React avisa que no puede adjuntarlo a un componente de función normal. */
const ExperienceCard = forwardRef<
  HTMLDivElement,
  {
    category: { id: ExperienceCategoryId; icon: string; title: string; description: string }
    tone: 'positive' | 'negative' | 'neutral'
    onTap?: () => void
    actions?: React.ReactNode
  }
>(function ExperienceCard({ category, tone, onTap, actions }, ref) {
  const toneClass =
    tone === 'positive'
      ? 'border-onb-accent bg-onb-accent-light text-onb-accent-hover'
      : tone === 'negative'
        ? 'border-red-300 bg-red-50 text-red-700'
        : 'border-onb-border bg-onb-card text-onb-text'

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-2 rounded-onb-md border px-3 py-2 ${toneClass}`}
    >
      <span className="text-body leading-none">{category.icon}</span>
      <div className="min-w-0">
        <p className="font-dmsans text-small font-semibold leading-tight">{category.title}</p>
        <p className="line-clamp-1 font-dmsans text-caption leading-tight opacity-70">{category.description}</p>
      </div>
      {actions}
      {onTap && (
        <button type="button" onClick={onTap} aria-label={`Quitar ${category.title}`} className="ml-1 shrink-0 text-caption opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </motion.div>
  )
})
