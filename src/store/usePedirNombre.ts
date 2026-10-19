import { create } from 'zustand'
import { cuentasActivas } from '../lib/cuentas'
import { useMiPerfil } from './useMiPerfil'

/**
 * «¿CÓMO TE LLAMAS?» (cuentas parte 3B, punto 5). Quien entró con el email no tiene nombre; se le pide UNA sola vez, justo cuando hace falta (al compartir un viaje, al unirse a uno o al
 * unirse a un pase), con [Seguir] y «Ahora no». Haga lo que haga, no se le vuelve a preguntar (queda apuntado en este móvil, por cuenta). Mientras no tenga nombre, la app no inventa uno:
 * «Enviar» a secas y, en los avisos, la inicial de su email.
 */
interface PedirNombreState {
  abierta: boolean
  /** Lo que se resuelve al cerrar la hoja (quien llamó a `pedir` sigue su camino). */
  alCerrar: (() => void)[]
  pedir: () => Promise<void>
  cerrar: () => void
}

const CLAVE = (uid: string) => `trazo:nombre-preguntado:${uid}`

/** Pura: ¿hay que preguntarlo? Sí si hay cuenta cargada, sin nombre y sin haberlo preguntado ya. */
export function hayQuePedirNombre(datos: { cuentasActivas: boolean; uid: string | null; cargado: boolean; nombre: string | null; yaPreguntado: boolean }): boolean {
  return datos.cuentasActivas && Boolean(datos.uid) && datos.cargado && !datos.nombre?.trim() && !datos.yaPreguntado
}

function yaPreguntado(uid: string): boolean {
  try {
    return window.localStorage.getItem(CLAVE(uid)) === '1'
  } catch {
    return false
  }
}
function apuntarPreguntado(uid: string): void {
  try {
    window.localStorage.setItem(CLAVE(uid), '1')
  } catch {
    /* sin almacenamiento: puede que se pregunte otra vez */
  }
}

export const usePedirNombre = create<PedirNombreState>((set, get) => ({
  abierta: false,
  alCerrar: [],
  pedir: () => {
    const { uid, cargado, nombre } = useMiPerfil.getState()
    if (!hayQuePedirNombre({ cuentasActivas: cuentasActivas(), uid, cargado, nombre, yaPreguntado: uid ? yaPreguntado(uid) : true })) return Promise.resolve()
    return new Promise<void>((ok) => {
      set((s) => ({ abierta: true, alCerrar: [...s.alCerrar, ok] }))
    })
  },
  cerrar: () => {
    const { uid } = useMiPerfil.getState()
    if (uid) apuntarPreguntado(uid)
    const esperando = get().alCerrar
    set({ abierta: false, alCerrar: [] })
    esperando.forEach((f) => f())
  },
}))

/** Para cuando la persona entra con un viaje que ya la espera (el canje ocurre antes de recargar): al volver a abrir la app se le pregunta. */
export const CLAVE_PEDIR_AL_VOLVER = 'trazo:pedir-nombre-al-volver'

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __pedirNombre: typeof usePedirNombre }).__pedirNombre = usePedirNombre
