import { Component, type ReactNode } from 'react'
import { avisarDeError } from '../lib/errorDePantalla'

/**
 * UNA PIEZA SEGURA (10S2): un dato raro (de un viaje, un gasto, un aviso, una moneda…) no puede tumbar la app entera con «Algo ha ido mal». Esto envuelve una pieza suelta de una pantalla (una tarjeta, una fila,
 * un bloque): si SE ROMPE al pintarse, esa pieza se queda sin pintar (o con `alternativa`) y el resto de la pantalla sigue; el fallo se avisa al servidor (qué pieza y qué error, sin datos privados) para verlo
 * sin reproducirlo. El `ErrorBoundary` de toda la app sigue siendo la última red.
 */
export class PiezaSegura extends Component<{ nombre: string; children: ReactNode; alternativa?: ReactNode }, { fallo: boolean }> {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[PiezaSegura] ${this.props.nombre}:`, error)
    avisarDeError(error, info.componentStack ?? undefined, this.props.nombre)
  }

  render() {
    return this.state.fallo ? (this.props.alternativa ?? null) : this.props.children
  }
}
