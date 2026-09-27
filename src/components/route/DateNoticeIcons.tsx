import type { ReactNode } from 'react'
import type { DateNoticeIcon } from '../../lib/types'

/**
 * Iconos ilustrados de los avisos de fechas (DateNoticesModal.tsx): trazo fino en terracota sobre un círculo crema,
 * con toques en oro — la paleta del diseño "Trazo Itinerario" (tokens de index.css). Propios, nunca emojis.
 * `small` es la versión de la etiqueta del día: el mismo dibujo, sin círculo y en el color del texto.
 */
const INK = 'rgb(var(--accent))'
const SOFT = 'rgb(var(--accent-soft))'
const GOLD = 'rgb(var(--accent-gold))'

const DRAWINGS: Record<DateNoticeIcon, ReactNode> = {
  // Serpentinas y confeti saliendo de un cucurucho.
  fiesta: (
    <>
      <path d="M20 46 L28 26 L38 36 Z" fill={SOFT} />
      <path d="M20 46 L28 26 L38 36 Z" />
      <path d="M31 22 c2 -4 6 -4 7 -8" />
      <path d="M40 30 c4 -1 6 2 10 0" />
      <path d="M36 24 c3 -3 7 -2 9 -5" />
      <circle cx="44" cy="16" r="1.6" fill={GOLD} stroke="none" />
      <circle cx="49" cy="24" r="1.6" fill={GOLD} stroke="none" />
      <circle cx="30" cy="16" r="1.4" fill={INK} stroke="none" />
      <circle cx="47" cy="36" r="1.4" fill={INK} stroke="none" />
    </>
  ),
  // Una cúpula con su cruz (las iglesias y el Papa).
  religioso: (
    <>
      <path d="M18 46 h28" />
      <path d="M21 46 v-12 h22 v12" fill={SOFT} />
      <path d="M22 34 c0 -8 5 -13 10 -13 s10 5 10 13" fill={SOFT} />
      <path d="M32 21 v-5 M30 17.5 h4" />
      <path d="M29 46 v-6 a3 3 0 0 1 6 0 v6" />
      <path d="M25 38 v3 M39 38 v3" />
    </>
  ),
  // Dos palmeras de fuegos artificiales.
  fuegos: (
    <>
      <circle cx="26" cy="26" r="2" fill={GOLD} stroke="none" />
      <path d="M26 18 v-4 M26 34 v4 M18 26 h-4 M34 26 h4 M20.5 20.5 l-3 -3 M31.5 31.5 l3 3 M31.5 20.5 l3 -3 M20.5 31.5 l-3 3" />
      <circle cx="42" cy="38" r="1.6" fill={INK} stroke="none" />
      <path d="M42 32 v-3 M42 44 v3 M36 38 h-3 M48 38 h3 M38 34 l-2 -2 M46 42 l2 2 M46 34 l2 -2 M38 42 l-2 2" stroke={GOLD} />
      <path d="M26 38 c0 4 2 8 4 10" strokeDasharray="1.5 2.5" />
    </>
  ),
  // El sol entrando por un óculo (el Panteón, la luz).
  luz: (
    <>
      <path d="M16 44 c0 -9 7 -16 16 -16 s16 7 16 16" fill={SOFT} />
      <path d="M16 44 h32" />
      <circle cx="32" cy="20" r="5" fill={GOLD} stroke="none" />
      <path d="M32 11 v-3 M23 20 h-3 M44 20 h-3 M25.5 13.5 l-2 -2 M38.5 13.5 l2 -2" />
      <path d="M32 27 l-4 17 h8 z" fill={GOLD} stroke="none" opacity="0.55" />
    </>
  ),
  // Un abeto con su estrella.
  navidad: (
    <>
      <path d="M32 18 L22 32 h5 L19 44 h26 L37 32 h5 Z" fill={SOFT} />
      <path d="M32 18 L22 32 h5 L19 44 h26 L37 32 h5 Z" />
      <path d="M30 44 v4 h4 v-4" />
      <path d="M32 10 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4 z" fill={GOLD} stroke="none" />
      <circle cx="28" cy="37" r="1.3" fill={INK} stroke="none" />
      <circle cx="36" cy="40" r="1.3" fill={INK} stroke="none" />
    </>
  ),
  // Una bandera ondeando.
  bandera: (
    <>
      <path d="M20 50 V14" />
      <path d="M20 16 c6 -3 10 3 16 0 s8 -2 10 -1 v16 c-2 -1 -4 -1 -10 1 s-10 -3 -16 0 z" fill={SOFT} />
      <path d="M20 16 c6 -3 10 3 16 0 s8 -2 10 -1 v16 c-2 -1 -4 -1 -10 1 s-10 -3 -16 0 z" />
      <path d="M31 18 v14" stroke={GOLD} />
    </>
  ),
  // Dos corcheas.
  musica: (
    <>
      <path d="M26 42 V20 l18 -4 v22" />
      <path d="M26 24 l18 -4" />
      <ellipse cx="22" cy="42" rx="4.5" ry="3.5" fill={SOFT} />
      <ellipse cx="40" cy="38" rx="4.5" ry="3.5" fill={SOFT} />
      <circle cx="48" cy="14" r="1.4" fill={GOLD} stroke="none" />
      <circle cx="16" cy="28" r="1.4" fill={GOLD} stroke="none" />
    </>
  ),
  // Sol sobre el mar: la ciudad tranquila de agosto.
  calma: (
    <>
      <circle cx="32" cy="28" r="8" fill={GOLD} stroke="none" opacity="0.8" />
      <path d="M32 14 v-3 M20 28 h-3 M47 28 h-3 M22.5 18.5 l-2 -2 M41.5 18.5 l2 -2" />
      <path d="M14 38 c3 -2 6 -2 9 0 s6 2 9 0 s6 -2 9 0 s6 2 9 0" />
      <path d="M18 45 c3 -2 6 -2 9 0 s6 2 9 0 s6 -2 9 0" />
    </>
  ),
  // Un calendario con la marca de resuelto: el cierre que ya hemos arreglado.
  cierre: (
    <>
      <rect x="16" y="18" width="32" height="28" rx="4" fill={SOFT} />
      <rect x="16" y="18" width="32" height="28" rx="4" />
      <path d="M16 26 h32 M24 14 v7 M40 14 v7" />
      <path d="M25 36 l5 5 l10 -10" stroke={GOLD} strokeWidth="2.2" />
    </>
  ),
}

export function DateNoticeIllustration({ icon, size = 88 }: { icon: DateNoticeIcon; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill={SOFT} opacity="0.55" />
      <g fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {DRAWINGS[icon] ?? DRAWINGS.fiesta}
      </g>
    </svg>
  )
}

/** La versión pequeña, para la etiqueta de la cabecera del día. */
export function DateNoticeSmallIcon({ icon }: { icon: DateNoticeIcon }) {
  return (
    <svg viewBox="8 8 48 48" className="h-3.5 w-3.5 shrink-0 [&_*]:!fill-none [&_*]:!stroke-current" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {DRAWINGS[icon] ?? DRAWINGS.fiesta}
      </g>
    </svg>
  )
}
