import { create } from 'zustand'
import { llamar, type Momento } from '../../../../lib/logros'

/**
 * Lo que devuelve `GET /api/logros/ganados` (server/logros/pantallas/ganados.js): todo lo que se ve en «Mi vitrina» y «Todos mis logros». Los números y los textos los pone el servidor.
 */
export type Balda = 'viajero' | 'sellos' | 'colecciones' | 'emblemas'
export type TipoDeItem = 'viajero' | 'sello' | 'coleccion' | 'emblema' | 'maravilla' | 'exclusivo'

export interface ItemGanado {
  clave: string
  tipo: TipoDeItem
  destino: string | null
  logro: string
  escalon: string
  nombre: string
  linea: string | null
  en: string
  /** AAAA-MM-DD, en la hora del destino. */
  fecha: string
  lugar: string
  balda: Balda | null
  titulable: boolean
  momento: Momento | null
  /** Ya tiene otro más alto de lo mismo: no se enseña. */
  superado?: boolean
  def?: string
  grupo?: string
  sello?: string
  grado?: string
  nombre_grado?: string
  coleccion?: string
  emblema?: string
  maravilla?: string
}

export interface FilaDeViajero {
  id: string
  grupo: string
  familia: string
  con_escalones: boolean
  ganado: boolean
  clave: string | null
  escalon: number | null
  nombre: string
  linea: string | null
  como: string | null
  fecha: string | null
  lugar: string | null
  cuenta: { n: number; unidad_uno: string; unidad_varios: string } | null
  actual: number
  objetivo: number
  completo: boolean
  siguiente: { n: number; nombre: string; faltan: number } | null
  progreso: number | string | null
  nuevo: boolean
}

export interface DestinoGanado {
  destino: string
  ciudad: string
  pais: string | null
  codigo_pais: string | null
  sello: { id: string; nombre: string; grado: string | null; nombre_grado: string | null; linea: string | null }
  sellos: { id: string; nombre: string; grado: string | null }[]
  colecciones: { completas: number; total: number }
  secretos: { encontrados: number }
  avance: number
  desde: string | null
}

export interface PaisGanado {
  pais: string
  codigo: string | null
  destinos: { destino: string; ciudad: string; dentro_de_otro: boolean; sellos: { id: string; nombre: string; grado: string | null }[] }[]
}

export interface VitrinaGanada {
  pedestal: string[]
  exclusivos: string[]
  baldas: Record<Balda, { huecos: string[]; elegida: boolean; hay_mas: boolean }>
  titulo: string | null
}

export interface Ganados {
  ok: boolean
  total: number
  titulo: { clave: string; nombre: string } | null
  items: ItemGanado[]
  viajero: { id: string; nombre: string; filas: FilaDeViajero[] }[]
  maravillas: { id: string; nombre: string; ganada: boolean; clave: string | null; fecha: string | null }[]
  exclusivos: ItemGanado[]
  por_destino: DestinoGanado[]
  paises: PaisGanado[]
  vitrina: VitrinaGanada
}

interface Almacen {
  datos: Ganados | null
  estado: 'sin_pedir' | 'cargando' | 'listo' | 'error'
  cargar: (forzar?: boolean) => Promise<void>
  poner: (g: Ganados) => void
}

/** Lo ganado, compartido por «Mi vitrina», «Todos mis logros» y la ficha: se pide una vez al abrir y se vuelve a pedir tras cada cambio. */
export const useGanados = create<Almacen>((set, get) => ({
  datos: null,
  estado: 'sin_pedir',
  cargar: async (forzar = false) => {
    if (get().estado === 'cargando' || (!forzar && get().estado === 'listo')) return
    set({ estado: 'cargando' })
    const r = await llamar<Ganados>('/api/logros/ganados')
    if (r?.ok) set({ datos: r, estado: 'listo' })
    else set({ estado: get().datos ? 'listo' : 'error' })
  },
  poner: (g) => set({ datos: g, estado: 'listo' }),
}))

export const ORDEN_BALDAS: Balda[] = ['viajero', 'sellos', 'colecciones', 'emblemas']
export const TITULO_DE_BALDA: Record<Balda, string> = { viajero: 'Logros de viajero', sellos: 'Sellos de ciudad', colecciones: 'Colecciones completadas', emblemas: 'Emblemas secretos' }
export const VACIA_DE_BALDA: Record<Balda, string> = { viajero: 'Tu primer logro de viajero irá aquí', sellos: 'Tu primer sello de ciudad irá aquí', colecciones: 'Tu primera colección completada irá aquí', emblemas: 'Tu primer emblema secreto irá aquí' }

/** Guarda una balda entera (hasta 4 claves). Devuelve la vitrina nueva o null si no se ha podido. */
export async function guardarBalda(balda: Balda, huecos: string[]): Promise<VitrinaGanada | null> {
  const r = await llamar<{ ok: boolean; vitrina?: VitrinaGanada }>('/api/logros/ganados/vitrina', { metodo: 'PUT', cuerpo: { balda, huecos } })
  return r?.ok && r.vitrina ? r.vitrina : null
}

/** Pone (o quita, con null) el título del Perfil: una cosa ganada de viajero. */
export async function guardarTitulo(clave: string | null): Promise<boolean> {
  const r = await llamar<{ ok: boolean }>('/api/logros/vitrina', { metodo: 'PUT', cuerpo: { titulo: clave } })
  return Boolean(r?.ok)
}

/** El estado de las hojas de encima (ficha y «elige un hueco») y el aviso de abajo. Lo comparten «Todos mis logros» y la ficha suelta. */
interface Hojas {
  ficha: string | null
  hueco: { clave: string; inicial?: number } | null
  aviso: string | null
  abrirFicha: (clave: string) => void
  cerrarFicha: () => void
  abrirHueco: (clave: string, inicial?: number) => void
  cerrarHueco: () => void
  avisar: (t: string) => void
  limpiar: () => void
}
let temporizador: number | undefined
export const useHojasDeLogros = create<Hojas>((set) => ({
  ficha: null,
  hueco: null,
  aviso: null,
  abrirFicha: (clave) => set({ ficha: clave }),
  cerrarFicha: () => set({ ficha: null, hueco: null }),
  abrirHueco: (clave, inicial) => set({ hueco: { clave, inicial } }),
  cerrarHueco: () => set({ hueco: null }),
  avisar: (t) => {
    set({ aviso: t })
    window.clearTimeout(temporizador)
    temporizador = window.setTimeout(() => set({ aviso: null }), 2400)
  },
  limpiar: () => set({ ficha: null, hueco: null, aviso: null }),
}))
