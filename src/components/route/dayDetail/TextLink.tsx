import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
}

/** Enlace de texto — verde oscuro, subrayado, sin caja. Para info secundaria (horarios oficiales, webs oficiales) — nunca para el CTA de venta, eso es `Button`. */
export function TextLink({ children, className = '', ...rest }: TextLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`text-small font-medium text-accent-hover underline underline-offset-2 hover:text-accent ${className}`}
      {...rest}
    >
      {children}
    </a>
  )
}
