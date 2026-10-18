import { llamar } from '../../../../lib/logros'
import type { ResumenDeExp } from '../../momentos/api'

export type { ResumenDeExp }

/** La EXP tal como la manda el Perfil: lo de siempre y, además, si ya está en el último nivel (solo estrellas de Leyenda). */
export type ExpDelPerfil = ResumenDeExp & { maximo?: boolean }

/** Un título que el viajero puede elegir (sale de sus logros de viajero ganados). `clave` es la que guarda el servidor (`*|viajero:paises|10`). */
export interface TituloDeViajero {
  clave: string
  id: string
  grupo: string
  nombre: string
  escalon: number | null
  linea: string | null
}

/** Lo ganado más reciente que se dibuja en el resumen de la vitrina del Perfil. */
export interface PiezaReciente {
  clave: string
  logro: string
  escalon: string
  destino: string
}

/** Lo que devuelve `GET /api/logros/perfil` (server/logros/pantallas/perfil.js). */
export interface PerfilLogros {
  ok: boolean
  exp: ExpDelPerfil
  titulo: TituloDeViajero | null
  titulos: TituloDeViajero[]
  vitrina: { logros: number; recientes: PiezaReciente[] }
  pasaporte: { paises: number; sellos: number }
  /** Los países que marcó en «¿Dónde has estado ya?»: los viajes de antes de la app. */
  previos: { paises: number }
}

export async function pedirPerfil(): Promise<PerfilLogros | null> {
  const r = await llamar<PerfilLogros>('/api/logros/perfil')
  return r?.ok ? r : null
}

/** Elige el título (la clave del logro) o lo quita (`null`). Devuelve true si el servidor lo guardó. Reutiliza `PUT /api/logros/vitrina`. */
export async function elegirTitulo(clave: string | null): Promise<boolean> {
  const r = await llamar<{ ok: boolean }>('/api/logros/vitrina', { metodo: 'PUT', cuerpo: { titulo: clave } })
  return Boolean(r?.ok)
}

/** El nombre de cada grupo de logros de viajero (los textos de Design en «Mi Vitrina» y en el Perfil: «El mundo · …», «Cómo viajas · …»). */
export const NOMBRE_DE_GRUPO: Record<string, string> = {
  mundo: 'El mundo',
  tiempo: 'El tiempo',
  como_viajas: 'Cómo viajas',
  coleccionista: 'Coleccionista',
  exclusivos: 'Exclusivos',
}

/** Lo que manda el servidor en `exp` de la respuesta de un Visto o una foto (server/logros/momentos.js, 8C1): la EXP ganada y el estado antes y después. */
export interface ExpDeRespuesta {
  ganada: number
  antes: ResumenDeExp
  despues: ResumenDeExp
  sube_de_nivel?: boolean
}

/** Las líneas de cada rango (los textos de Design en el Dashboard, pestaña «Marcos»), en el orden de los rangos. Los NOMBRES de los rangos salen del servidor (`data/logros/exp.json`). */
export const LINEA_DE_RANGO: string[] = [
  'Todo viaje empieza con una idea y una luna.',
  'Ya tienes brújula y ganas de perderte.',
  'Sellos, billetes y una ruta que ya es tuya.',
  'El planeta se te ha quedado pequeño.',
  'Montañas, riesgo y ninguna prisa por volver.',
  'Tu casa es donde plantas la tienda esta noche.',
  'Ya no sigues mapas: los dibujas tú.',
  'Los destinos te reciben con laureles.',
  'Llevas el timón de todos tus viajes.',
  'Tu nombre ya se cuenta en las rutas.',
]
