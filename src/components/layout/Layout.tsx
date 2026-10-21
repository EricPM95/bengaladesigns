import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

/** El contenedor de la app. Sin modo noche (Tanda 10): la app sale siempre en claro. */
export function Layout({ children }: LayoutProps) {
  return <div>{children}</div>
}
