/**
 * EL DEMO DEL PERFIL (Tanda 8C2). SOLO EN DESARROLLO (lo carga `logrosDemo.ts`): contesta con LA FORMA REAL del servidor (server/logros/pantallas/perfil.js) a lo que pide el Perfil:
 *   GET /api/logros/perfil                    EXP, título, títulos que puede elegir, resumen de la vitrina, números del pasaporte
 *   GET /api/logros/exp                       la EXP sola
 *   PUT /api/logros/vitrina { titulo }        elegir (o quitar) el título
 *   GET /api/logros/resumen?trip_id=…         lo ganado en un viaje, SOLO para los viajes que el escaparate marca (`viajesConGanado`); los demás los contesta el demo de siempre
 * Los números de la EXP salen de las MISMAS funciones y la MISMA tabla que el servidor (server/logros/exp.js y data/logros/exp.json): aquí no hay ninguno escrito a mano.
 * Los datos de ejemplo (un viajero con unos cuantos logros) son de prueba. El escaparate los cambia con `ponerPerfilDemo`.
 */
import tablaExp from '../../data/logros/exp.json'
import viajero from '../../data/logros/viajero.json'
import { expDeNivel, nivelDeExp, resumenDeExp } from '../../server/logros/exp.js'
import type { ExpDelPerfil, PerfilLogros, TituloDeViajero } from '../components/logros/pantallas/perfil/api'

/** La EXP de un viajero con tanta EXP total, como la manda el servidor (con `maximo`, como en `/api/logros/perfil`). */
export function expDeEjemplo(total: number): ExpDelPerfil {
  return { ...(resumenDeExp(total, tablaExp) as ExpDelPerfil), maximo: Boolean(nivelDeExp(total, tablaExp).maximo) }
}
/** La EXP justo en la mitad del nivel `n` (para los marcos de cada rango). */
export function expEnNivel(n: number, extra = 0): number {
  return expDeNivel(n, tablaExp) + extra
}
export const estrellaDeLeyenda: number = tablaExp.niveles.estrella_cada

const defs = viajero.logros as { id: string; grupo: string; linea?: string; escalones?: { n: number; nombre: string }[]; nombre?: string }[]
/** Un título como lo manda el servidor: el escalón `n` del logro `id`. */
function titulo(id: string, n: number): TituloDeViajero {
  const d = defs.find((x) => x.id === id)!
  return { clave: `*|viajero:${id}|${n}`, id, grupo: d.grupo, nombre: d.escalones!.find((e) => e.n === n)!.nombre, escalon: n, linea: d.linea ?? null }
}

export const TITULOS_DE_EJEMPLO: TituloDeViajero[] = [titulo('paises', 10), titulo('con_quien_pareja', 3), titulo('cazador_emblemas', 5), titulo('destinos', 3), titulo('viajes', 1)]

/** El viajero de ejemplo: nivel 8 (el mismo del diseño), con título, unos logros en la vitrina y tres países. */
export function perfilDeEjemplo(): PerfilLogros {
  return {
    ok: true,
    exp: expDeEjemplo(expEnNivel(8, 220)),
    titulo: TITULOS_DE_EJEMPLO[0],
    titulos: TITULOS_DE_EJEMPLO,
    vitrina: {
      logros: 38,
      recientes: [
        { clave: 'roma|sello|roma:oro', logro: 'sello', escalon: 'roma:oro', destino: 'roma' },
        { clave: 'roma|emblema|coliseo', logro: 'emblema', escalon: 'coliseo', destino: 'roma' },
        { clave: '*|viajero:paises|10', logro: 'viajero:paises', escalon: '10', destino: '*' },
      ],
    },
    pasaporte: { paises: 3, sellos: 4 },
    previos: { paises: 1 },
  }
}

let perfil: PerfilLogros = perfilDeEjemplo()
/** Los viajes (ids) cuyo resumen contesta este demo. */
export const viajesConGanado = new Set<string>()
export const ganadoDeEjemplo = [
  { clave: 'roma|sello|roma:bronce', logro: 'sello', escalon: 'roma:bronce', destino: 'roma', en: '2026-10-10T10:00:00Z' },
  { clave: 'roma|sello|roma:oro', logro: 'sello', escalon: 'roma:oro', destino: 'roma', en: '2026-10-13T10:00:00Z' },
  { clave: 'roma|emblema|coliseo', logro: 'emblema', escalon: 'coliseo', destino: 'roma', en: '2026-10-10T12:00:00Z' },
  { clave: 'roma|emblema|fontana_de_trevi', logro: 'emblema', escalon: 'fontana_de_trevi', destino: 'roma', en: '2026-10-11T12:00:00Z' },
  { clave: '*|viajero:con_quien_pareja|3', logro: 'viajero:con_quien_pareja', escalon: '3', destino: '*', en: '2026-10-11T09:00:00Z' },
  { clave: '*|pais|Italia', logro: 'pais', escalon: 'Italia', destino: '*', en: '2026-10-10T09:00:00Z' },
]

export function ponerPerfilDemo(p: Partial<PerfilLogros>): void {
  perfil = { ...perfil, ...p }
}
export function reiniciarPerfilDemo(): void {
  perfil = perfilDeEjemplo()
  viajesConGanado.clear()
}

export function responder(ruta: string, url: URL, cuerpo: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (ruta === '/api/logros/perfil') return perfil
  if (ruta === '/api/logros/exp') return { ok: true, ...perfil.exp }
  if (ruta === '/api/logros/vitrina' && opciones.metodo === 'PUT' && 'titulo' in cuerpo && !('balda' in cuerpo)) {
    const clave = (cuerpo.titulo as string | null) ?? null
    perfil = { ...perfil, titulo: clave ? (perfil.titulos.find((t) => t.clave === clave) ?? null) : null }
    return { ok: true, titulo: perfil.titulo?.clave ?? null }
  }
  if (ruta === '/api/logros/resumen' && viajesConGanado.has(String(url.searchParams.get('trip_id')))) return { ok: true, ganado: ganadoDeEjemplo, por_categoria: {}, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null }, texto_viaje: '', texto_viaje_tipo: 'wow' }
  return undefined
}
