import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Red de seguridad genérica — cualquier crash de renderizado en cualquier pantalla (un día con datos
 * incompletos, una parada sin coordenadas, etc.) mostraba pantalla en blanco sin ningún mensaje. No
 * existía ningún ErrorBoundary en el proyecto antes de este (a pesar de haberse dado por hecho en
 * algún momento que sí) — este es completamente nuevo. "Volver al inicio" recarga la app desde cero
 * en vez de intentar recuperar el estado que causó el crash (podría volver a fallar igual).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Crash de renderizado:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-h2">⚠️</p>
        <h1 className="font-display text-h2 font-semibold text-text">Algo ha ido mal</h1>
        <p className="max-w-sm text-small text-text-soft">
          Esta pantalla no se pudo mostrar correctamente. Puede que falten datos de esta parte del viaje — prueba a volver al inicio.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-accent px-5 py-2.5 text-body font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Volver al inicio
        </button>
      </div>
    )
  }
}
