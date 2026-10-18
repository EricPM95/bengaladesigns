/**
 * LAS CUENTAS DE EJEMPLO DE ROMA (Tanda 8C1): de unos sitios visitados, cuánta EXP sale, por categoría. Pura. La usan la prueba y el modo de pruebas del móvil
 * (`window.__momentos.exp()`), para que las dos digan lo mismo.
 *   - 'normal': un viaje de 3 días con 9 sitios (el Coliseo, el Foro, Trevi, el Panteón, Navona, Plaza de España, los Museos Vaticanos, San Pedro y su plaza).
 *   - 'roma100': Roma al 100 %: todos los sitios de las colecciones y de los emblemas, con Madrugador y Nocturno (sin el continente ni «Todos los secretos», que están apagados).
 */
import { calcular } from './motor.js'
import { calcularExp } from './exp.js'

export const SITIOS_VIAJE_NORMAL = ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'museos_vaticanos_y_capilla_sixtina', 'basilica_de_san_pedro', 'plaza_de_san_pedro']

/** Todos los sitios de las colecciones y de los emblemas de Roma. */
export function sitiosDeRomaAl100(datos) {
  const R = datos.destinos.roma
  const s = new Set()
  for (const c of R.colecciones) c.sitios.forEach((x) => s.add(x))
  for (const e of R.emblemas) if (e.sitio) s.add(e.sitio)
  return [...s]
}

/** @returns {{ total: number, por_categoria: Record<string, number>, entradas: Array }} */
export function escenarioDeRoma(datos, cual) {
  const sitios = cual === 'roma100' ? sitiosDeRomaAl100(datos) : SITIOS_VIAJE_NORMAL
  // El viaje normal dura 3 días (2 noches: es una escapada); Roma al 100 % es un viaje largo (10 noches).
  const fin = cual === 'roma100' ? '2026-10-20' : '2026-10-12'
  const noches = cual === 'roma100' ? 10 : 2
  const porDia = cual === 'roma100' ? 9 : 3
  const hora = (i) => String(8 + (i % 9)).padStart(2, '0')
  const hechos = sitios.map((s, i) => ({ id: `e${i}`, tipo: 'foto', trip_id: 'v', destino: 'roma', sitio: s, stop_id: `x${i}`, instante: `2026-10-${10 + Math.floor(i / porDia)}T${hora(i)}:00:00Z`, recibido_en: `2026-10-${10 + Math.floor(i / porDia)}T${hora(i)}:00:00Z`, ubic: 'cerca', valido: true, inicio: '2026-10-10', fin }))
  if (cual === 'roma100') {
    hechos.push({ ...hechos[0], id: 'mm', sitio: 'coliseo', stop_id: 'xm', instante: '2026-10-15T04:30:00Z', recibido_en: '2026-10-15T04:30:00Z' })
    hechos.push({ ...hechos[0], id: 'mn', sitio: 'fontana_de_trevi', stop_id: 'xn', instante: '2026-10-15T20:30:00Z', recibido_en: '2026-10-15T20:30:00Z' })
  }
  const viaje = { id: 'v', destino: 'roma', inicio: '2026-10-10', fin, con_quien: 'pareja', noches, dias: [] }
  const ahora = new Date('2026-11-01T12:00:00Z')
  const items = calcular({ datos, hechos, viajes: { v: viaje }, cuenta: { alta_cuenta: '2026-10-01T00:00:00Z' }, ahora })
  const r = calcularExp({ datos, items, hechos, viajes: { v: viaje }, ahora })
  const por_categoria = {}
  for (const x of r.entradas) {
    const k = x.tipo.startsWith('viajero') ? 'logros de viajero' : x.tipo
    por_categoria[k] = (por_categoria[k] ?? 0) + x.exp
  }
  return { total: r.total, por_categoria, entradas: r.entradas }
}
