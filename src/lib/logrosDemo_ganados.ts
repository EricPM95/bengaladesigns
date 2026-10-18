/**
 * DEMO DE «MI VITRINA» Y «TODOS MIS LOGROS» (8C2). SOLO EN DESARROLLO (lo carga `logrosDemo.ts`). Un viajero de ejemplo con LA FORMA REAL del servidor: los datos de
 * `logrosDemo_ganados_datos.json` los ha calculado el cerebro de verdad (motor.js + `construirGanados`) con unos Vistos y fotos inventados:
 * `node scripts/destino/generarDemoGanados.mjs` los vuelve a generar.
 *
 *   lleno   un viaje entero a Roma (sellos, colecciones, emblemas, la maravilla, logros de viajero y exclusivos)
 *   poco    solo un primer Visto sin maravilla ni colecciones: las baldas casi vacías
 *   vacio   nada ganado todavía: las baldas vacías
 *
 * Cambiar de viajero: `window.__demoGanados.poner('lleno' | 'poco' | 'vacio')` (y los escaparates lo hacen solos).
 */
import datos from './logrosDemo_ganados_datos.json'
import type { Ganados, ItemGanado } from '../components/logros/pantallas/todos/api'

export type EscenarioGanados = 'lleno' | 'poco' | 'vacio'
const ESCENARIOS = datos as unknown as Record<EscenarioGanados, Ganados>

const copia = (e: EscenarioGanados): Ganados => JSON.parse(JSON.stringify(ESCENARIOS[e])) as Ganados
let actual: Ganados = copia('lleno')

/** Deja al viajero de ejemplo en ese estado (con la vitrina que tenía de salida). */
export function ponerEscenario(e: EscenarioGanados): void {
  actual = copia(e)
}

const BALDAS = ['viajero', 'sellos', 'colecciones', 'emblemas'] as const

export function responder(ruta: string, _url: URL, c: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  const metodo = (opciones.metodo ?? 'GET').toUpperCase()
  if (ruta === '/api/logros/ganados' && metodo === 'GET') return JSON.parse(JSON.stringify(actual))
  if (ruta === '/api/logros/ganados/vitrina' && metodo === 'PUT') {
    const balda = String(c.balda ?? '') as (typeof BALDAS)[number]
    const huecos = Array.isArray(c.huecos) ? c.huecos.map(String) : null
    if (!BALDAS.includes(balda) || !huecos || huecos.length > 4) return null
    const porClave = new Map<string, ItemGanado>(actual.items.map((i) => [i.clave, i]))
    if (huecos.some((k) => porClave.get(k)?.balda !== balda)) return null
    const total = actual.items.filter((i) => i.balda === balda && !i.superado).length
    actual.vitrina.baldas[balda] = { huecos, elegida: true, hay_mas: total > huecos.length }
    return { ok: true, vitrina: JSON.parse(JSON.stringify(actual.vitrina)) }
  }
  // El título del Perfil: la misma ruta que usa el servidor de verdad.
  if (ruta === '/api/logros/vitrina' && metodo === 'PUT' && 'titulo' in c) {
    const it = typeof c.titulo === 'string' ? actual.items.find((i) => i.clave === c.titulo && i.titulable) : null
    actual.titulo = it ? { clave: it.clave, nombre: it.nombre } : null
    actual.vitrina.titulo = it ? it.clave : null
    return { ok: true, ...JSON.parse(JSON.stringify(actual.vitrina)) }
  }
  return undefined
}

declare global {
  interface Window {
    __demoGanados?: { poner: (e: EscenarioGanados) => void }
  }
}
if (typeof window !== 'undefined') window.__demoGanados = { poner: ponerEscenario }
