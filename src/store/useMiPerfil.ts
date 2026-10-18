import { create } from 'zustand'
import { cargarMiPerfil, fotoParaMostrar, guardarMiNombre, nombreDePila, nombreParaMostrar, quitarMiFoto, subirMiFoto } from '../lib/miPerfil'

/**
 * MI PERFIL (cuentas parte 3, punto 6): mi nombre y mi foto, para pintarlos donde toque (el Perfil, «Hola, …», el pie de Compartir). `nombre` es el que puse (o el de Google la primera
 * vez); `fotoGoogle` es la de Google mientras no ponga otra. Lo carga `AvisosHost` al entrar con una cuenta; sin cuenta, todo queda vacío (la inicial «V» y «Viajero»).
 */
interface MiPerfilState {
  uid: string | null
  nombre: string | null
  fotoPath: string | null
  fotoGoogle: string | null
  cargado: boolean
  cargar: (uid: string, deGoogle?: { nombre?: string | null; foto?: string | null }) => Promise<void>
  poner: (datos: { nombre?: string | null; fotoPath?: string | null; fotoGoogle?: string | null }) => void
  cambiarNombre: (nombre: string) => Promise<string | null>
  cambiarFoto: (archivo: Blob) => Promise<string | null>
  borrarFoto: () => Promise<string | null>
}

export const useMiPerfil = create<MiPerfilState>((set, get) => ({
  uid: null,
  nombre: null,
  fotoPath: null,
  fotoGoogle: null,
  cargado: false,
  cargar: async (uid, deGoogle) => {
    const datos = await cargarMiPerfil(uid)
    let nombre = datos?.nombre ?? null
    // La primera vez, el nombre de pila de Google (si entra con Google); con el email, «Viajero» hasta que ponga uno.
    if (!nombre && deGoogle?.nombre) {
      nombre = nombreDePila(deGoogle.nombre)
      if (nombre) void guardarMiNombre(uid, nombre)
    }
    set({ uid, nombre, fotoPath: datos?.fotoPath ?? null, fotoGoogle: deGoogle?.foto ?? null, cargado: true })
  },
  poner: (datos) => set((s) => ({ ...s, ...datos, cargado: true })),
  cambiarNombre: async (texto) => {
    const { uid } = get()
    if (!uid) return 'Entra en tu cuenta para cambiarlo.'
    const error = await guardarMiNombre(uid, texto)
    if (!error) set({ nombre: nombreDePila(texto) })
    return error
  },
  cambiarFoto: async (archivo) => {
    const { uid, fotoPath } = get()
    if (!uid) return 'Entra en tu cuenta para cambiarla.'
    const r = await subirMiFoto(uid, archivo, fotoPath)
    if (r.ruta) set({ fotoPath: r.ruta })
    return r.error
  },
  borrarFoto: async () => {
    const { uid, fotoPath } = get()
    if (!uid) return 'Entra en tu cuenta para cambiarla.'
    const error = await quitarMiFoto(uid, fotoPath)
    if (!error) set({ fotoPath: null })
    return error
  },
}))

/** Lo que se pinta: el nombre (o «Viajero») y la dirección de la foto (la propia, la de Google o ninguna). */
export function useMiNombreYFoto(): { nombre: string; tieneNombre: boolean; foto: string | null } {
  const nombre = useMiPerfil((s) => s.nombre)
  const fotoPath = useMiPerfil((s) => s.fotoPath)
  const fotoGoogle = useMiPerfil((s) => s.fotoGoogle)
  return { nombre: nombreParaMostrar(nombre), tieneNombre: Boolean(nombre?.trim()), foto: fotoParaMostrar(fotoPath, fotoGoogle) }
}

if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __miPerfil: typeof useMiPerfil }).__miPerfil = useMiPerfil
