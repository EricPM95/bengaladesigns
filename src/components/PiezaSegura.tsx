import { Component, Fragment, type ReactNode } from 'react'
import { avisarVersionNueva, esFalloDeCargaDeParte } from '../lib/cargaSegura'
import { avisarDeError } from '../lib/errorDePantalla'

/** Solo en desarrollo (la prueba 10S4_I): `window.__pruebaFallo = '<nombre de la pieza>'` hace que esa pieza se rompa al pintarse, para comprobar que no tumba la app. En producción no existe. */
function PuntoDeFallo({ nombre }: { nombre: string }) {
  if (typeof window !== 'undefined' && (window as unknown as { __pruebaFallo?: string }).__pruebaFallo === nombre) throw new Error(`fallo forzado de prueba en ${nombre}`)
  return null
}

/**
 * UNA PIEZA SEGURA (10S2): un dato raro (de un viaje, un gasto, un aviso, una moneda…) no puede tumbar la app entera con «Algo ha ido mal». Esto envuelve una pieza suelta de una pantalla (una tarjeta, una fila,
 * un bloque): si SE ROMPE al pintarse, esa pieza se queda sin pintar (o con `alternativa`) y el resto de la pantalla sigue; el fallo se avisa al servidor (qué pieza y qué error, sin datos privados) para verlo
 * sin reproducirlo. El `ErrorBoundary` de toda la app sigue siendo la última red.
 */
export class PiezaSegura extends Component<{ nombre: string; children: ReactNode; alternativa?: ReactNode; /** (V25) Si se rompe, no se queda muerta: dice «No se ha podido cargar, vuelve a probar» con [Reintentar]. */ reintentable?: boolean; /** Lo que se hace al reintentar (por ejemplo, volver a bajar sus partes). */ alReintentar?: () => void; /** Lo que se hace al romperse (soltar lo que tuviera ocupado). */ alFallar?: () => void }, { fallo: boolean; error: unknown }> {
  state = { fallo: false, error: null as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { fallo: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[PiezaSegura] ${this.props.nombre}:`, error)
    avisarDeError(error, info.componentStack ?? undefined, this.props.nombre)
    try {
      this.props.alFallar?.()
    } catch {
      /* nada */
    }
    // Un archivo que ya no existe (se publicó una versión nueva con la app abierta): NO se recarga sola; se avisa («Hay una versión nueva · [Actualizar]»).
    if (this.props.reintentable && esFalloDeCargaDeParte(error)) avisarVersionNueva()
  }

  reintentar = () => {
    this.props.alReintentar?.()
    this.setState({ fallo: false, error: null })
  }

  render() {
    if (this.state.fallo) {
      if (this.props.reintentable) {
        return (
          <div role="alert" data-pieza-fallida={this.props.nombre} style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom,0px) + 92px)', zIndex: 9600, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 18, background: '#1C2230', color: '#FFFDF8', boxShadow: '0 14px 30px -12px rgba(0,0,0,.5)', font: "500 13.5px/1.3 'Geist',system-ui,sans-serif" }}>
            <span style={{ flex: 1 }}>No se ha podido cargar, vuelve a probar.</span>
            <button type="button" data-reintentar-pieza onClick={this.reintentar} style={{ flex: 'none', height: 40, padding: '0 16px', borderRadius: 999, border: 0, cursor: 'pointer', background: 'linear-gradient(180deg,#FBF3E2,#EBD9AE)', color: '#6F4E37', font: "700 13.5px 'Geist',system-ui,sans-serif" }}>
              Reintentar
            </button>
          </div>
        )
      }
      return this.props.alternativa ?? null
    }
    return import.meta.env.DEV ? (
      <Fragment>
        <PuntoDeFallo nombre={this.props.nombre} />
        {this.props.children}
      </Fragment>
    ) : (
      this.props.children
    )
  }
}
