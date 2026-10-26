/**
 * EL DEMO DEL PERFIL (Tanda 8C2). SOLO EN DESARROLLO (lo carga `logrosDemo.ts`): contesta con LA FORMA REAL del servidor (server/logros/pantallas/perfil.js) a lo que pide el Perfil:
 *   GET /api/logros/perfil                    EXP, título, títulos que puede elegir, resumen de la vitrina, números del pasaporte
 *   GET /api/logros/exp                       la EXP sola
 *   PUT /api/logros/vitrina { titulo }        elegir (o quitar) el título
 *   GET /api/logros/resumen?trip_id=…         lo ganado en un viaje, SOLO para los viajes que el escaparate marca (`viajesConGanado`); los demás los contesta el demo de siempre
 * Los números de la EXP salen de las MISMAS funciones y la MISMA tabla que el servidor (server/logros/exp.js y data/logros/exp.json): aquí no hay ninguno escrito a mano.
 * Los datos de ejemplo (un viajero con unos cuantos logros) son de prueba. El escaparate los cambia con `ponerPerfilDemo`.
 */
import ajustes from '../../data/logros/ajustes.json'
import roma from '../../data/logros/roma.json'
import { soloActivos } from '../../server/logros/viajeroActivo.js'
import { titulosGanados } from '../../server/logros/pantallas/perfil.js'
import { mapaDelPasaporte, numerosDelPasaporte } from './logrosDemo_mundo'
import { resumenDeVitrina } from '../../server/logros/pantallas/perfil.js'
import ganadosDatos from './logrosDemo_ganados_datos.json'
import tablaExp from '../../data/logros/exp.json'
import viajero from '../../data/logros/viajero.json'
import { estadoDelSorteo, expDeNivel, nivelDeExp, resumenDeExp } from '../../server/logros/exp.js'
import type { EstadoDelSorteo } from '../components/logros/pantallas/sorteo/api'
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

/**
 * El viajero de ejemplo es EL MISMO de «Todos mis logros» (`logrosDemo_ganados_datos.json`, escenario «lleno»: el viaje a Roma entero) y el del pasaporte (`logrosDemo_mundo.ts`): de ahí salen
 * los títulos que puede elegir, los logros de la vitrina y los números del pasaporte. Nada de esto está escrito a mano en este archivo.
 */
const itemsDeLosGanados = () => new Map((ganadosDatos.lleno.items as { clave: string }[]).map((i) => [i.clave, i as never]))
const datosDelViajero = { destinos: { roma }, viajero: soloActivos(viajero), ajustes }
export const TITULOS_DE_EJEMPLO: TituloDeViajero[] = titulosGanados({ datos: datosDelViajero, items: itemsDeLosGanados(), ahora: new Date('2026-10-20T10:00:00Z') }) as TituloDeViajero[]

/** El viajero de ejemplo: nivel 8 (el mismo del diseño), con título, su vitrina y su pasaporte (los del demo del mundo). */
export function perfilDeEjemplo(): PerfilLogros {
  const { paises, ciudades, sellos, previos } = numerosDelPasaporte()
  return {
    ok: true,
    exp: expDeEjemplo(expEnNivel(8, 220)),
    titulo: TITULOS_DE_EJEMPLO.find((t) => t.id === 'cazador_emblemas') ?? TITULOS_DE_EJEMPLO[0] ?? null,
    titulos: TITULOS_DE_EJEMPLO,
    vitrina: resumenDeVitrina({ items: itemsDeLosGanados() }),
    pasaporte: { paises, ciudades, sellos, ...mapaDelPasaporte() },
    previos: { paises: previos },
  }
}

let perfil: PerfilLogros = perfilDeEjemplo()

/**
 * (10P, 1.6) El sorteo del viajero de ejemplo, calculado con LAS MISMAS funciones y la MISMA tabla que el servidor (server/logros/exp.js › estadoDelSorteo, data/logros/exp.json › sorteo). `viajeConHoy`:
 * si el viajero de ejemplo ha acabado un viaje usando HOY la mitad de los días. `__demoSorteo.poner('sin_nivel' | 'falta_viaje' | 'dentro')` lo cambia desde la consola.
 */
let viajeConHoy = false
/** El enlace de las bases del demo (vacío, como en exp.json: las bases todavía no están); `__demoSorteo.bases('https://…')` lo pone para ver el botón [Bases legales]. */
let basesDemo = ''
export function sorteoDeEjemplo(): EstadoDelSorteo {
  const total = perfil.exp.exp
  const tabla = basesDemo ? { ...tablaExp, sorteo: { ...tablaExp.sorteo, edicion: { ...tablaExp.sorteo.edicion, bases_url: basesDemo } } } : tablaExp
  const viajes = viajeConHoy ? [{ trip_id: 'demo-roma-2026', fin: '2026-10-13', dias: 5, dias_con_hoy: 3, cumple: true }] : []
  return estadoDelSorteo({ tabla, entradas: [{ fecha: '2026-10-01', exp: total }], expActual: total, viajes, ahora: new Date('2026-10-26T10:00:00Z') }) as EstadoDelSorteo
}
/** Pone al viajero de ejemplo en uno de los tres estados del billete (con su EXP, para que el nivel del Perfil cuadre). */
export function ponerSorteoDemo(estado: 'sin_nivel' | 'falta_viaje' | 'dentro'): void {
  const nivelMinimo = tablaExp.sorteo.nivel_minimo
  viajeConHoy = estado === 'dentro'
  perfil = { ...perfil, exp: expDeEjemplo(estado === 'sin_nivel' ? Math.round(expDeNivel(nivelMinimo, tablaExp) * 0.32) : expDeNivel(nivelMinimo, tablaExp) + 120) }
}
if (typeof window !== 'undefined') (window as unknown as { __demoSorteo: unknown }).__demoSorteo = { poner: ponerSorteoDemo, estado: () => sorteoDeEjemplo(), bases: (url: string) => (basesDemo = url) }
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

/** Lo que el escaparate ha puesto a mano (el resto del pasaporte sale siempre del demo del mundo, para que cuadre). */
const puestoAMano = new Set<string>()
export function ponerPerfilDemo(p: Partial<PerfilLogros>): void {
  for (const k of Object.keys(p)) puestoAMano.add(k)
  perfil = { ...perfil, ...p }
}
export function reiniciarPerfilDemo(): void {
  puestoAMano.clear()
  perfil = perfilDeEjemplo()
  viajeConHoy = false
  viajesConGanado.clear()
}

export function responder(ruta: string, url: URL, cuerpo: Record<string, unknown>, opciones: { metodo?: string; cuerpo?: unknown }): unknown {
  if (ruta === '/api/logros/perfil') {
    const vivo = perfilDeEjemplo()
    return { ...perfil, ...(puestoAMano.has('pasaporte') ? {} : { pasaporte: vivo.pasaporte }), ...(puestoAMano.has('previos') ? {} : { previos: vivo.previos }), sorteo: sorteoDeEjemplo() }
  }
  if (ruta === '/api/logros/sorteo') return sorteoDeEjemplo()
  if (ruta === '/api/logros/exp') return { ok: true, ...perfil.exp }
  if (ruta === '/api/logros/vitrina' && opciones.metodo === 'PUT' && 'titulo' in cuerpo && !('balda' in cuerpo)) {
    const clave = (cuerpo.titulo as string | null) ?? null
    perfil = { ...perfil, titulo: clave ? (perfil.titulos.find((t) => t.clave === clave) ?? null) : null }
    return { ok: true, titulo: perfil.titulo?.clave ?? null }
  }
  if (ruta === '/api/logros/resumen' && viajesConGanado.has(String(url.searchParams.get('trip_id')))) return { ok: true, ganado: ganadoDeEjemplo, por_categoria: {}, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null }, texto_viaje: '', texto_viaje_tipo: 'wow' }
  return undefined
}
