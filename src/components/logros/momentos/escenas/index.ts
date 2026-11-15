import type { ConfigEscena } from './cine'
import type { ConfigLanza } from './cineLanza'

/** Una escena por emblema, cada una en su archivo y cargada solo al abrirla (la app no pesa más al abrir). */
export const ESCENAS: Record<string, () => Promise<{ default: ConfigEscena | ConfigLanza }>> = {
  panteon: () => import('./panteon'),
  fontana_de_trevi: () => import('./fontana_de_trevi'),
  foro_romano: () => import('./foro_romano'),
  museos_vaticanos: () => import('./museos_vaticanos'),
  plaza_san_pedro: () => import('./plaza_san_pedro'),
  basilica_san_pedro: () => import('./basilica_san_pedro'),
  boca_de_la_verdad: () => import('./boca_de_la_verdad'),
  ojo_cerradura: () => import('./ojo_cerradura'),
  catacumbas: () => import('./catacumbas'),
  plaza_de_espana: () => import('./plaza_de_espana'),
  castillo_de_santangelo: () => import('./castillo_de_santangelo'),
  madrugador: () => import('./madrugador'),
  nocturno: () => import('./nocturno'),
  // Lanzarote (V3): sus 11 emblemas, con los ids de `data/logros/lanzarote.json` («lz_madrugador» no es el «madrugador» de Roma).
  timanfaya: () => import('./lanza/timanfaya'),
  jameos: () => import('./lanza/jameos'),
  cueva_de_los_verdes: () => import('./lanza/cueva_de_los_verdes'),
  mirador_del_rio: () => import('./lanza/mirador_del_rio'),
  fundacion_manrique: () => import('./lanza/fundacion_manrique'),
  el_golfo: () => import('./lanza/el_golfo'),
  la_geria: () => import('./lanza/la_geria'),
  la_graciosa: () => import('./lanza/la_graciosa'),
  papagayo: () => import('./lanza/papagayo'),
  lz_madrugador: () => import('./lanza/lz_madrugador'),
  atardecer_atlantico: () => import('./lanza/atardecer_atlantico'),
}
export const EMBLEMAS_CON_ESCENA = ['coliseo', ...Object.keys(ESCENAS)]
