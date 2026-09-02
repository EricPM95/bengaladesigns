import type { ReactNode } from 'react'
import { useRouteStore } from '../../store/useRouteStore'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const darkMode = useRouteStore((state) => state.darkMode)

  return <div className={darkMode ? 'dark' : ''}>{children}</div>
}
