import { createElement, lazy, useSyncExternalStore, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * QUE UNA PIEZA QUE NO SE PUDO BAJAR NO SE QUEDE MUERTA (V25, el fallo de «logros congelados»). `React.lazy` se acuerda del primer fallo para siempre: si una parte de logros (la hoja, una escena, el resumen) no se podía bajar
 * (red que falla un momento, o un archivo que ya no existe porque se publicó una versión nueva con la app abierta), TODAS las veces siguientes fallaba igual hasta cerrar la app. Aquí:
 *   · `lazyReintentable`: como `lazy`, pero cada `reintentarCargas()` crea una nueva y vuelve a bajarla;
 *   · `recargarUnaVez`: si el archivo ya no existe (versión nueva), lo que arregla de verdad es recargar la app: se hace una vez (nunca en bucle);
 *   · `conLimite`: una espera con tope, para que nada se quede esperando una respuesta que no llega.
 */
let version = 0
const oyentes = new Set<() => void>()
const suscribir = (f: () => void) => {
  oyentes.add(f)
  return () => {
    oyentes.delete(f)
  }
}
/** Vuelve a intentar todas las partes que fallaron al bajarse. */
export function reintentarCargas(): void {
  version++
  oyentes.forEach((f) => f())
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyReintentable<T extends ComponentType<any>>(importador: () => Promise<{ default: T }>): ComponentType<React.ComponentProps<T>> {
  const hechos = new Map<number, LazyExoticComponent<T>>()
  const de = (v: number): LazyExoticComponent<T> => {
    let c = hechos.get(v)
    if (!c) {
      c = lazy(importador)
      hechos.set(v, c)
      for (const k of [...hechos.keys()]) if (k < v - 1) hechos.delete(k)
    }
    return c
  }
  const Envoltorio = (props: React.ComponentProps<T>) => {
    const v = useSyncExternalStore(suscribir, () => version, () => version)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createElement(de(v) as ComponentType<any>, props)
  }
  return Envoltorio as ComponentType<React.ComponentProps<T>>
}

/** ¿El error es de no poder bajar una parte de la app (red, o archivo que ya no existe tras una versión nueva)? */
export function esFalloDeCargaDeParte(error: unknown): boolean {
  const texto = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Load failed|NetworkError|preload/i.test(texto)
}

/**
 * UNA VERSIÓN NUEVA PUBLICADA CON LA APP ABIERTA (decisión de Eric, 19-nov): NUNCA se recarga sola (nadie pierde lo que estaba haciendo: escribiendo en «Cuéntanos», eligiendo fotos para reclamar, pagando…). Se avisa con una
 * franja pequeña abajo, «Hay una versión nueva · [Actualizar]», y solo se recarga al tocarla (o cuando la persona abre la app la próxima vez, que ya trae lo nuevo).
 */
let hayVersionNueva = false
const oyentesDeVersion = new Set<() => void>()
export function avisarVersionNueva(): void {
  if (hayVersionNueva) return
  hayVersionNueva = true
  oyentesDeVersion.forEach((f) => f())
}
export const versionNuevaAvisada = (): boolean => hayVersionNueva
export function suscribirVersionNueva(f: () => void): () => void {
  oyentesDeVersion.add(f)
  return () => {
    oyentesDeVersion.delete(f)
  }
}
/** Solo al tocar [Actualizar]. */
export function actualizarAhora(): void {
  try {
    window.location.reload()
  } catch {
    /* sin ventana */
  }
}

/** Espera a `promesa` como mucho `ms`; si tarda más, devuelve `porDefecto` (la promesa sigue por su cuenta, pero nadie la espera). */
export function conLimite<T>(promesa: Promise<T>, ms: number, porDefecto: T): Promise<T> {
  return new Promise<T>((resolver) => {
    const t = setTimeout(() => resolver(porDefecto), ms)
    promesa.then(
      (v) => {
        clearTimeout(t)
        resolver(v)
      },
      () => {
        clearTimeout(t)
        resolver(porDefecto)
      },
    )
  })
}
