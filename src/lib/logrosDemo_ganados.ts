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
import { ponerTituloDelPerfil } from './logrosDemo_perfil'
import type { Ganados, ItemGanado } from '../components/logros/pantallas/todos/api'

export type EscenarioGanados = 'lleno' | 'poco' | 'vacio'
const ESCENARIOS = datos as unknown as Record<EscenarioGanados, Ganados>

const copia = (e: EscenarioGanados): Ganados => JSON.parse(JSON.stringify(ESCENARIOS[e])) as Ganados
let actual: Ganados = copia('lleno')

/** Deja al viajero de ejemplo en ese estado (con la vitrina que tenía de salida). */
export function ponerEscenario(e: EscenarioGanados): void {
  actual = copia(e)
}

/**
 * (V72) Lanzarote en lo ganado del demo (solo para ver las fichas en grande): `n` imprescindibles vistos (4 → medalla de plata en la vitrina; 7 → colección completa y diamante, fuera de la vitrina). Con la misma forma que el servidor.
 */
const GRADOS_LZ: [number, string, string, string][] = [[1, 'bronce', 'Primeros pasos en Lanzarote', 'Has visto tu primer imprescindible.'], [3, 'plata', 'Lanzarote te atrapa', '{n} de {total} imprescindibles.'], [5, 'oro', 'Tierra de volcanes', '{n} de {total} imprescindibles.'], [7, 'diamante', 'Lanzarote, de punta a punta', 'Todos los imprescindibles de Lanzarote.']]
export function ponerLanzarote(n: number): void {
  actual.items = actual.items.filter((i) => i.destino !== 'lanzarote')
  const dia = (k: number): string => `2026-11-${k < 2 ? 26 : k < 4 ? 27 : 28}`
  const nuevos: ItemGanado[] = []
  const grados = GRADOS_LZ.filter(([desde]) => desde <= n)
  grados.forEach(([desde, grado, nombreGrado, linea], i) => {
    const clave = `lanzarote|sello|lanzarote:${grado}`
    const fecha = dia(desde - 1)
    nuevos.push({ clave, tipo: 'sello', destino: 'lanzarote', logro: 'sello', escalon: `lanzarote:${grado}`, nombre: 'Medalla de Lanzarote', linea: linea.replace('{n}', String(n)).replace('{total}', '7'), en: `${fecha}T10:00:00Z`, fecha, lugar: 'Lanzarote, España', balda: 'sellos', titulable: false, momento: { tipo: 'sello', cat: 'sello', clave, sello: 'lanzarote', destino: 'lanzarote', grado, nombre: nombreGrado, linea, primera_vez: false, en: `${fecha}T10:00:00Z`, frase: null } as never, sello: 'lanzarote', grado, nombre_grado: nombreGrado, ...(i < grados.length - 1 ? { superado: true } : {}) } as ItemGanado)
  })
  if (n >= 7) {
    const clave = 'lanzarote|coleccion|lz_imprescindibles'
    nuevos.push({ clave, tipo: 'coleccion', destino: 'lanzarote', logro: 'coleccion', escalon: 'lz_imprescindibles', nombre: 'Los imprescindibles de Lanzarote', linea: 'Lo esencial, visto', en: '2026-11-28T10:00:00Z', fecha: '2026-11-28', lugar: 'Lanzarote, España', balda: 'colecciones', titulable: false, momento: { tipo: 'coleccion', cat: 'coleccion', clave, id: 'lz_imprescindibles', destino: 'lanzarote', nombre: 'Los imprescindibles de Lanzarote', linea: 'Lo esencial, visto', primera_vez: false, en: '2026-11-28T10:00:00Z', frase: null } as never, coleccion: 'lz_imprescindibles' } as ItemGanado)
  }
  actual.items = [...actual.items, ...nuevos]
  // En la vitrina solo está la medalla (F3: «En tu vitrina»); la colección completa aún no (F2: «Llevar a mi vitrina»).
  const hueco = grados.length ? `lanzarote|sello|lanzarote:${grados[grados.length - 1][1]}` : null
  const sellos = actual.vitrina.baldas.sellos.huecos.filter((k) => !k.startsWith('lanzarote|'))
  actual.vitrina.baldas.sellos = { ...actual.vitrina.baldas.sellos, huecos: hueco ? [...sellos, hueco].slice(0, 4) : sellos }
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
    // (V8) El Perfil del demo (otro archivo) lleva el mismo título, para que al volver a abrirlo salga el elegido.
    ponerTituloDelPerfil(typeof c.titulo === 'string' ? c.titulo : null)
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
