/**
 * La EXP del modo demo (8C2, solo desarrollo). Usa las MISMAS funciones y la MISMA tabla que el servidor (server/logros/exp.js, data/logros/exp.json), así que la barra, el nivel y el rango
 * que se ven en las capturas son los de verdad. `anotarExp(respuesta)` le pone a una respuesta del demo su `exp` (como hace el servidor tras un Visto o una foto).
 * Atajos: `window.__demo.expInicial(n)` fija la EXP de partida (por defecto 1.200: con un viaje normal cruza al nivel 3).
 */
import type { RespuestaDeHecho } from './logros'

interface Cargado {
  resumenDeExp: (exp: number, tabla: unknown) => RespuestaDeHecho['exp'] extends infer E ? (E extends { antes: infer A } ? A : never) : never
  expDeMomento: (datos: unknown, m: unknown) => number
  datos: { exp: unknown; viajero: unknown; destinos: unknown }
}
let cargado: Promise<Cargado> | null = null
async function cargar(): Promise<Cargado> {
  cargado ??= (async () => {
    const [exp, E] = await Promise.all([import('../../data/logros/exp.json'), import('../../server/logros/exp.js')])
    const e = E as unknown as { resumenDeExp: Cargado['resumenDeExp']; expDeMomento: Cargado['expDeMomento'] }
    return { resumenDeExp: e.resumenDeExp, expDeMomento: e.expDeMomento, datos: { exp: (exp as unknown as { default: unknown }).default, viajero: {}, destinos: {} } }
  })()
  return cargado
}

let total = 1200
export const expDelDemo = { fijar: (n: number) => (total = n), actual: () => total }

export async function anotarExp(r: RespuestaDeHecho): Promise<RespuestaDeHecho> {
  const ganada = (r.nuevos ?? []).reduce((s, m) => s + (m.exp ?? 0), 0) || 0
  const { resumenDeExp, expDeMomento, datos } = await cargar()
  const suma = (r.nuevos ?? []).reduce((s, m) => s + expDeMomento(datos, m), 0)
  const g = ganada || suma
  if (g <= 0) return r
  const antes = resumenDeExp(total, datos.exp)
  total += g
  const despues = resumenDeExp(total, datos.exp)
  return { ...r, exp: { ganada: g, antes, despues, sube_de_nivel: despues.nivel > antes.nivel } }
}

/** Sin rutas propias: solo ofrece `anotarExp`. */
export const responder = (): undefined => undefined
