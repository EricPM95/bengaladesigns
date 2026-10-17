import { Component, lazy, useState, type ComponentType, type ReactNode } from 'react'
import { useRouteStore } from '../../store/useRouteStore'

/**
 * MIENTRAS LLEGA UNA PANTALLA (Tanda 8B, 4b). La primera vez que se abre una pantalla partida (la ruta, Mis viajes…) se baja en ese momento; mientras llega se ve el mismo fondo de la app
 * con la cabecera (el destino, si ya hay viaje) y unas barras suaves, para que no parezca un fallo. Si la red falla justo al cargarla, no se queda en blanco: «No se ha podido cargar. [Reintentar]»,
 * que vuelve a pedirla (una carga fallida no se puede reintentar con `lazy` tal cual, así que cada reintento crea una nueva).
 */

/** El fondo de espera: la cabecera de la app (solo el destino) y unas barras. Sin textos de carga: es un instante. */
export function Cargando() {
  const destino = useRouteStore((s) => s.route?.destination)
  return (
    <div className="flex h-dvh flex-col bg-bg" role="status" aria-label="Cargando">
      <div className="flex shrink-0 items-center gap-1 pb-2.5 pl-5 pr-2.5 pt-1">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {destino ? <span className="truncate font-display text-[30px] leading-none text-text">{destino}</span> : <span className="h-[30px] w-40 animate-pulse rounded-lg bg-text/[.07]" />}
          <span className="h-[11px] w-28 animate-pulse rounded bg-text/[.07]" />
        </span>
        <span className="h-11 w-11 shrink-0" />
      </div>
      <div className="flex flex-col gap-3 px-4 pt-2" aria-hidden="true">
        <span className="h-36 animate-pulse rounded-[28px] bg-text/[.06]" />
        <span className="h-20 animate-pulse rounded-[22px] bg-text/[.05]" />
        <span className="h-20 animate-pulse rounded-[22px] bg-text/[.05]" />
      </div>
    </div>
  )
}

/** «No se ha podido cargar. [Reintentar]»: mismo fondo y cabecera que la espera. */
function NoSePudoCargar({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg px-8 text-center" role="alert">
      <p className="font-display text-[26px] leading-tight text-text">No se ha podido cargar.</p>
      <button type="button" onClick={onReintentar} className="h-12 rounded-full bg-[#1C2230] px-7 text-[15px] font-semibold text-[#FFFDF8]">
        Reintentar
      </button>
    </div>
  )
}

interface LimiteProps {
  alFallar: ReactNode
  children: ReactNode
}
/** Solo coge los fallos de carga de la pantalla (los de dibujado siguen yendo al ErrorBoundary de la app). */
class LimiteDeCarga extends Component<LimiteProps, { fallo: boolean }> {
  state = { fallo: false }
  static getDerivedStateFromError(error: unknown) {
    return { fallo: esFalloDeCarga(error) }
  }
  componentDidCatch(error: unknown) {
    if (!esFalloDeCarga(error)) throw error
  }
  render() {
    return this.state.fallo ? this.props.alFallar : this.props.children
  }
}

/** Pura: ¿el error es de bajar una parte (red, archivo que ya no existe tras una versión nueva) y no de dibujar? */
export function esFalloDeCarga(error: unknown): boolean {
  const texto = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Load failed|NetworkError/i.test(texto)
}

/**
 * Como `lazy`, pero con «No se ha podido cargar. [Reintentar]». Devuelve una pantalla normal; el `Suspense` con `<Cargando />` lo pone quien la usa.
 * El importador se llama una vez al principio (y se puede adelantar con `precargar`).
 */
export function pantallaPerezosa<P extends object>(importador: () => Promise<{ default: ComponentType<P> }>) {
  const nueva = () => lazy(importador)
  let actual = nueva()
  const Pantalla = (props: P) => {
    const [intento, repintar] = useState(0)
    const reintentar = () => {
      actual = nueva()
      repintar((n) => n + 1)
    }
    const Perezosa = actual as unknown as ComponentType<object>
    return (
      <LimiteDeCarga key={intento} alFallar={<NoSePudoCargar onReintentar={reintentar} />}>
        <Perezosa {...props} />
      </LimiteDeCarga>
    )
  }
  return Pantalla
}
