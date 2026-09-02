import { AnimatePresence, motion } from 'framer-motion'

interface ImpactBannerProps {
  message: string | null
}

export function ImpactBanner({ message }: ImpactBannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-small text-accent-hover"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
