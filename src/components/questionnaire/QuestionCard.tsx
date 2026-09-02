import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface QuestionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  delay?: number
}

export function QuestionCard({ title, subtitle, children, delay = 0 }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      <Card className="p-6">
        <h2 className="font-sans text-h2 font-semibold text-text">{title}</h2>
        {subtitle && <p className="mt-1 text-small text-text-soft">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </Card>
    </motion.div>
  )
}
