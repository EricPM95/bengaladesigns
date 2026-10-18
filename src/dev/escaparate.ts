/**
 * EL ESCAPARATE DE LAS PANTALLAS DE LOS LOGROS (Tanda 8C2). SOLO EN DESARROLLO: abre una pantalla en un estado conocido, con su nombre del diseño (1b, T1, G2, J1, P1, E3…),
 * para sacar las capturas (`node scripts/destino/capturas8c.mjs T1 T2`) y para probar a mano:
 *
 *     window.__escaparate.ids()          los que hay
 *     await window.__escaparate.abrir('T1')
 *     window.__escaparate.limpiar()      cierra todo
 *
 * Cada archivo de `src/dev/escaparates/*.ts` exporta por defecto una lista de `Escaparate`. La captura se hace en los milisegundos de `capturas` tras abrir (por defecto, una a los 900 ms);
 * si hay varias (las animaciones: principio, mitad, final) cada una sale con su nombre `<id>-1-principio`, `<id>-2-mitad`, `<id>-3-final`.
 */
export interface Escaparate {
  /** El nombre de la pantalla en el diseño (1a, 2b, T1, A…). Debe ser único y cómodo de escribir. */
  id: string
  /** Una línea: qué se ve. */
  que: string
  /** Cuándo capturar, en ms desde que termina `abrir`. Por defecto [900]. Con varios valores salen varias capturas. */
  capturas?: number[]
  /** `true`: el móvil con «reducir movimiento» puesto (la captura sale sin movimiento). */
  reducirMovimiento?: boolean
  /** Deja la pantalla en ese estado. Puede esperar lo que haga falta. */
  abrir: () => void | Promise<void>
  /** Cierra lo que abrió (si no lo hace, `limpiar` no hace nada por esa). */
  cerrar?: () => void
}

const lista = new Map<string, Escaparate>()

const archivos = import.meta.glob<{ default: Escaparate[] }>('./escaparates/*.ts', { eager: true })
for (const m of Object.values(archivos)) for (const e of m.default) lista.set(e.id, e)

const api = {
  ids: () => [...lista.keys()],
  info: (id: string) => {
    const e = lista.get(id)
    return e ? { id: e.id, que: e.que, capturas: e.capturas ?? [900], reducirMovimiento: Boolean(e.reducirMovimiento) } : null
  },
  async abrir(id: string) {
    const e = lista.get(id)
    if (!e) throw new Error(`No hay escaparate «${id}». Hay: ${[...lista.keys()].join(', ')}`)
    await e.abrir()
  },
  limpiar() {
    for (const e of lista.values()) e.cerrar?.()
  },
}

declare global {
  interface Window {
    __escaparate?: typeof api
  }
}
if (typeof window !== 'undefined') window.__escaparate = api
