import type { Momento } from './logros'

/**
 * LA DEMO DE «YO TAMBIÉN ESTABA» (Tanda V7, solo desarrollo): responde a `GET /api/logros/companero` y `POST /api/logros/yo-tambien` con unos pendientes de Eric. Las reglas de verdad (solo con el viaje
 * acabado, solo si no lo tengo, una vez…) son del servidor (`server/logros/servicio.js › companeroPendientes`), que prueba `pruebaV7`. `window.__companeroDemo = { sinPase, pendientes }` cambia la demo.
 */
interface P {
  sitio: string
  nombre: string
  de: string
  de_nombre: string
  falta: string[]
  colecciones: string[]
  emblema: boolean
  foto_url: string | null
  instante: string | null
}
const TODOS: P[] = [
  { sitio: 'coliseo', nombre: 'Coliseo', de: 'A', de_nombre: 'Eric', falta: ['pedazo', 'emblema'], colecciones: ['Los imprescindibles de Roma'], emblema: true, foto_url: null, instante: null },
  { sitio: 'fontana_de_trevi', nombre: 'Fontana de Trevi', de: 'A', de_nombre: 'Eric', falta: ['pedazo'], colecciones: ['Los imprescindibles de Roma'], emblema: false, foto_url: null, instante: null },
  { sitio: 'panteon', nombre: 'Panteón', de: 'A', de_nombre: 'Eric', falta: ['pedazo'], colecciones: ['Los imprescindibles de Roma'], emblema: false, foto_url: null, instante: null },
  { sitio: 'piazza_navona', nombre: 'Piazza Navona', de: 'A', de_nombre: 'Eric', falta: ['pedazo'], colecciones: ['Los imprescindibles de Roma'], emblema: false, foto_url: null, instante: null },
]
let ganados = new Set<string>()
const cfg = () => (window as unknown as { __companeroDemo?: { sinPase?: boolean; pendientes?: P[] } }).__companeroDemo ?? (/[?&]sinCompanero=1/.test(location.search) ? { pendientes: [] } : {})
const lista = (): P[] => (cfg().pendientes ?? TODOS).filter((p) => !ganados.has(p.sitio))

export function responder(ruta: string, _url: URL, c: Record<string, unknown>): unknown {
  if (ruta === '/api/logros/companero') return { ok: true, pendientes: lista(), sin_pase: Boolean(cfg().sinPase) }
  if (ruta === '/api/logros/yo-tambien') {
    if (cfg().sinPase) return { ok: true, cuenta: false, motivo: 'sin_pase', nuevos: [] }
    const pedidos = c.sitios === 'todos' ? lista() : lista().filter((p) => (c.sitios as string[]).includes(p.sitio))
    for (const p of pedidos) ganados.add(p.sitio)
    const nuevos: Momento[] = []
    if (pedidos.length > 0) nuevos.push({ tipo: 'suma', cat: 'pedazo', coleccion: 'imprescindibles', destino: 'roma', nombre: 'Los imprescindibles de Roma', n: pedidos.length, total: 8, sitios: pedidos.map((p) => p.sitio), linea: `${pedidos.length} de 8`, primera_vez: true })
    for (const p of pedidos) if (p.emblema) nuevos.push({ tipo: 'emblema', cat: 'emblema', clave: `roma|emblema|${p.sitio}`, id: p.sitio, destino: 'roma', nombre: `Emblema de ${p.nombre}`, linea: 'Lo ganasteis juntos.', primera_vez: true, frase: 'Algo se esconde aquí.' })
    return { ok: true, cuenta: true, sitios: pedidos.map((p) => ({ sitio: p.sitio, nombre: p.nombre })), nuevos }
  }
  return undefined
}
export const reiniciarDemoDeCompanero = () => { ganados = new Set() }
