import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TIP_LABELS, useDestinationTips, type DestinationTip } from '../../lib/destinationTips'
import { useRouteStore } from '../../store/useRouteStore'


interface TripTipsSheetProps {
  open: boolean
  destination: string
  onClose: () => void
}

/**
 * Los tips del viaje (la bombilla de la cabecera, PROMPT_UI_REPASO_2 3): una ventana a pantalla completa con los de su
 * destino (data/dias/<destino>/_tips.json). Cabecera oscura con la bombilla, «8 COSAS QUE UN ROMANO TE DIRÍA» y «Lo que
 * ojalá te hubieran contado»; cada tip en su tarjeta con el número grande, la etiqueta de color, el título y el texto.
 * Los que tienen que ver con algo que se reserva llevan «Ver entradas de tu viaje ›».
 */
export function TripTipsSheet({ open, destination, onClose }: TripTipsSheetProps) {
  const data = useDestinationTips(destination, open)
  const setMode = useRouteStore((state) => state.setMode)
  const city = destination.split(',')[0].trim()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const count = data?.tips.length ?? 0
  const eyebrow = data?.local ? `${count} cosas que ${data.local} te diría` : `${count} cosas que saber de ${city}`
  const toBookings = () => {
    onClose()
    setMode('bookings')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-tips-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-bg"
        >
          <header className="relative shrink-0 px-6 pb-7 pt-[max(1.25rem,env(safe-area-inset-top))]" style={{ background: '#1F1B16', color: '#F5EFE4' }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar los tips"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[.08] text-[oklch(0.8_0.14_70)]" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 21h4" />
                <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
              </svg>
            </span>
            {count > 0 && (
              <p className="mt-4 font-mono text-[11px] font-medium uppercase tracking-[.16em] text-[oklch(0.8_0.14_70)]">
                {eyebrow}
              </p>
            )}
            <h1 id="trip-tips-title" className="mt-2 font-display text-[34px] leading-[1.05]">
              Lo que ojalá te hubieran contado
            </h1>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5">
            {data === undefined && <p className="px-2 text-[14px] text-text-soft">Cargando…</p>}
            {data === null && <p className="px-2 text-[14.5px] leading-relaxed text-text-soft">{`Aún no tenemos los tips de ${city}. Pronto estarán aquí.`}</p>}
            {data && (
              <ol className="mx-auto max-w-lg space-y-3">
                {data.tips.map((tip, index) => (
                  <TipCard key={tip.orden} tip={tip} number={index + 1} onBookings={toBookings} />
                ))}
              </ol>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TipCard({ tip, number, onBookings }: { tip: DestinationTip; number: number; onBookings: () => void }) {
  const label = TIP_LABELS[tip.etiqueta] ?? TIP_LABELS.dinero
  return (
    <li className="flex gap-4 rounded-[22px] border border-text/[.08] bg-bg-card px-4 py-4">
      <span className="w-8 shrink-0 text-center font-display text-[40px] leading-[.9] text-text/25" aria-hidden="true">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <span className="inline-flex rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold" style={{ color: label.color, background: label.soft }}>
          {label.text}
        </span>
        <h2 className="mt-2 font-display text-[21px] leading-[1.15] text-text">{tip.titulo}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-text-soft">{tip.texto}</p>
        {tip.enlace === 'entradas' && (
          <button type="button" onClick={onBookings} className="mt-2.5 text-[13.5px] font-semibold text-accent hover:underline">
            Ver entradas de tu viaje ›
          </button>
        )}
      </div>
    </li>
  )
}
