import type { ConfigEscena } from './cine'

/** Una escena por emblema, cada una en su archivo y cargada solo al abrirla (la app no pesa más al abrir). */
export const ESCENAS: Record<string, () => Promise<{ default: ConfigEscena }>> = {
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
}
export const EMBLEMAS_CON_ESCENA = ['coliseo', ...Object.keys(ESCENAS)]
