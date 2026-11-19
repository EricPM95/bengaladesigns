/**
 * LAS PREGUNTAS QUE SE REPITEN, BIEN PORTADAS (V26, el gasto de Supabase). Lo que la app vuelve a preguntar «por si ha cambiado» (el viaje compartido, los gastos, las propuestas, los avisos, lo suyo del viaje, el «cerca de aquí»)
 * ya no es un reloj fijo de 20-45 segundos. Reglas, en un solo sitio:
 *   · SE PREGUNTA al abrir, al volver a la app (o a tener red) y, como respaldo, cada rato largo; y siempre después de un cambio (lo piden las propias pantallas con `preguntarAhora`);
 *   · NUNCA con la app en segundo plano (ni el reloj ni nada: si no se ve, no se pregunta);
 *   · UNA SOLA VEZ aunque lo pidan varias pantallas a la vez (misma clave): comparten la respuesta y no se repite hasta pasado el mínimo.
 */
interface Registro {
  en: number
  p: Promise<unknown>
  terminada: boolean
}
const ultimas = new Map<string, Registro>()

/** Ejecuta la tarea solo si no hay otra igual en marcha ni ha empezado hace menos de `minimoMs`; si la hay, devuelve la misma respuesta. */
export function unaSolaVez<T>(clave: string, tarea: () => Promise<T> | T, minimoMs = 0): Promise<T> {
  const u = ultimas.get(clave)
  const ahora = Date.now()
  if (u && (!u.terminada || ahora - u.en < minimoMs)) return u.p as Promise<T>
  const reg: Registro = { en: ahora, p: Promise.resolve().then(tarea), terminada: false }
  reg.p.then(
    () => {
      reg.terminada = true
    },
    () => {
      reg.terminada = true
    },
  )
  ultimas.set(clave, reg)
  return reg.p as Promise<T>
}

export const seVe = (): boolean => typeof document === 'undefined' || document.visibilityState === 'visible'

export interface OpcionesDeSondeo {
  clave: string
  tarea: () => Promise<unknown> | unknown
  /** El respaldo: cada cuánto (solo con la app a la vista). */
  cadaMs: number
  /** Lo mínimo entre dos preguntas iguales (por defecto, la cuarta parte del respaldo). */
  minimoMs?: number
  /** Preguntar nada más empezar (por defecto, sí). */
  alAbrir?: boolean
}

/** Pregunta al abrir, al volver a la app o a tener red, y cada `cadaMs` mientras se ve. Devuelve cómo dejar de hacerlo. */
export function sondearMientrasSeVe(o: OpcionesDeSondeo): () => void {
  const minimo = o.minimoMs ?? Math.round(o.cadaMs / 4)
  const preguntar = () => {
    if (!seVe()) return
    void unaSolaVez(o.clave, o.tarea, minimo).catch(() => undefined)
  }
  if (o.alAbrir !== false) preguntar()
  const reloj = window.setInterval(preguntar, o.cadaMs)
  document.addEventListener('visibilitychange', preguntar)
  window.addEventListener('online', preguntar)
  return () => {
    window.clearInterval(reloj)
    document.removeEventListener('visibilitychange', preguntar)
    window.removeEventListener('online', preguntar)
  }
}

/** Después de un cambio (lo guardó esta persona, llegó un aviso en directo…): se pregunta ya, sin esperar, saltándose el mínimo (pero sin duplicar una pregunta que ya va en camino). */
export function preguntarAhora<T>(clave: string, tarea: () => Promise<T> | T): Promise<T> {
  const u = ultimas.get(clave)
  if (u && !u.terminada) return u.p as Promise<T>
  ultimas.delete(clave)
  return unaSolaVez(clave, tarea, 0)
}
